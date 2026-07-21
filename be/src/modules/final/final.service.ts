import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActorType, FinalChallenge, Prisma, ProgressStatus, Team } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { EventConfigService } from '../event-config/event-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitFinalDto, UpdateFinalConfigDto } from './dto/final.dto';

@Injectable()
export class FinalService {
  private readonly finalSubmitMaxAttempts = 3;
  private readonly maxFinalBonusRank = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
    private readonly eventConfig: EventConfigService,
  ) {}

  async getPlayerFinal(teamId: number) {
    const now = new Date();
    const [challenge, eventConfig] = await Promise.all([
      this.getActiveChallenge(),
      this.eventConfig.getPublicConfig(),
    ]);
    const [submission, activeProgress, cooldown] = await Promise.all([
      this.prisma.finalSubmission.findFirst({
        where: { finalChallengeId: challenge.id, teamId, isCorrect: true },
        orderBy: { submittedAt: 'asc' },
      }),
      this.getActiveStationProgress(teamId),
      this.getCooldownState(challenge.id, teamId, now),
    ]);
    const isPastEventEnd = eventConfig.isPastEventEnd;
    const isOpen = isPastEventEnd && !activeProgress;

    return {
      id: challenge.id,
      title: challenge.title,
      clueText: isOpen ? challenge.clueText : null,
      startsAt: challenge.startsAt,
      eventEndTime: eventConfig.eventEndTime,
      maxWinners: this.maxFinalBonusRank,
      pointsByRank: Array.from(
        { length: this.maxFinalBonusRank },
        (_, index) => this.calculateFinalBonus(index + 1),
      ),
      isOpen,
      canSubmit: isOpen && !submission && !cooldown.isCoolingDown,
      blockedByActiveStation: Boolean(activeProgress),
      activeStationId: activeProgress?.stationId ?? null,
      teamSubmission: submission ? this.toPublicSubmission(submission) : null,
      wrongAttemptCount: cooldown.wrongAttemptCount,
      cooldownSeconds: cooldown.cooldownSeconds,
      nextAttemptAt: cooldown.nextAttemptAt,
      serverNow: now.toISOString(),
    };
  }

  async submitFinal(teamId: number, dto: SubmitFinalDto) {
    const challenge = await this.getActiveChallenge();
    const now = new Date();
    if (!(await this.eventConfig.isPastEventEnd(now))) {
      throw new BadRequestException('Final challenge is not open yet');
    }
    const activeProgress = await this.getActiveStationProgress(teamId);
    if (activeProgress) {
      throw new BadRequestException('Finish the active station before entering Final Challenge');
    }

    const priorCorrect = await this.prisma.finalSubmission.findFirst({
      where: { finalChallengeId: challenge.id, teamId, isCorrect: true },
    });
    if (priorCorrect) {
      return this.toPublicSubmission(priorCorrect);
    }

    const cooldown = await this.getCooldownState(challenge.id, teamId, now);
    if (cooldown.isCoolingDown) {
      throw new BadRequestException(
        `Final answer cooldown is active until ${cooldown.nextAttemptAt}`,
      );
    }

    const normalized = this.normalizeAnswer(dto.answer);
    const isCorrect = await bcrypt.compare(normalized, challenge.answerHash);
    const result = await this.createFinalSubmissionWithRetry(
      challenge,
      teamId,
      normalized,
      isCorrect,
    );

    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: isCorrect ? 'FINAL_SUBMIT_CORRECT' : 'FINAL_SUBMIT_WRONG',
      entityType: 'FINAL_CHALLENGE',
      entityId: challenge.id,
      metadata: {
        winnerRank: result.winnerRank,
        pointsAwarded: result.pointsAwarded,
      },
    });
    return this.toPublicSubmission(result);
  }

  private async createFinalSubmissionWithRetry(
    challenge: FinalChallenge,
    teamId: number,
    normalizedAnswer: string,
    isCorrect: boolean,
  ) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.finalSubmitMaxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const previousCorrect = await tx.finalSubmission.findFirst({
              where: { finalChallengeId: challenge.id, teamId, isCorrect: true },
            });
            if (previousCorrect) {
              return previousCorrect;
            }

            let winnerRank: number | null = null;
            let pointsAwarded = 0;
            let scoreEventId: number | null = null;

            if (isCorrect) {
              const correctCount = await tx.finalSubmission.count({
                where: { finalChallengeId: challenge.id, isCorrect: true },
              });
              winnerRank = correctCount + 1;
              pointsAwarded = this.calculateFinalBonus(winnerRank);

              if (pointsAwarded > 0) {
                const team = await tx.team.findUniqueOrThrow({ where: { id: teamId } });
                const scoreEvent = await tx.scoreEvent.create({
                  data: {
                    teamId,
                    scoreBefore: team.totalPoints,
                    scoreAfter: team.totalPoints + pointsAwarded,
                    delta: pointsAwarded,
                    reason: `Final rank ${winnerRank}`,
                  },
                });
                scoreEventId = scoreEvent.id;
                await tx.team.update({
                  where: { id: teamId },
                  data: { totalPoints: { increment: pointsAwarded } },
                });
              }
            }

            return tx.finalSubmission.create({
              data: {
                finalChallengeId: challenge.id,
                teamId,
                answerSubmitted: normalizedAnswer,
                isCorrect,
                winnerRank,
                pointsAwarded,
                scoreEventId,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        lastError = error;
        if (!this.isRetryableFinalSubmitError(error) || attempt === this.finalSubmitMaxAttempts) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private isRetryableFinalSubmitError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2034' || error.code === 'P2002')
    );
  }

  async getFinalConfig() {
    const challenge = await this.getActiveChallenge();
    return this.toPublicChallenge(challenge, true);
  }

  async getSubmissions() {
    const submissions = await this.prisma.finalSubmission.findMany({
      include: { team: true, finalChallenge: true },
      orderBy: [{ isCorrect: 'desc' }, { submittedAt: 'asc' }],
    });

    return submissions.map(({ team, finalChallenge, ...submission }) => ({
      ...this.toPublicSubmission(submission),
      answerSubmitted: submission.answerSubmitted,
      team: this.toPublicTeam(team),
      finalChallenge: this.toPublicChallenge(finalChallenge, true),
    }));
  }

  async updateFinalConfig(userId: number, dto: UpdateFinalConfigDto) {
    const challenge = await this.getActiveChallenge();
    if (await this.eventConfig.isPastEventEnd()) {
      throw new BadRequestException('Cannot update final config after it opens');
    }
    const data = {
      title: dto.title,
      clueText: dto.clueText,
      isActive: dto.isActive,
      answerHash: dto.answer
        ? await bcrypt.hash(this.normalizeAnswer(dto.answer), 10)
        : undefined,
    };
    const updated = await this.prisma.finalChallenge.update({
      where: { id: challenge.id },
      data,
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'FINAL_CONFIG_UPDATED',
      entityType: 'FINAL_CHALLENGE',
      entityId: challenge.id,
      metadata: { ...dto, answer: dto.answer ? '[redacted]' : undefined },
    });
    return this.toPublicChallenge(updated, true);
  }

  private async getActiveChallenge() {
    const challenge = await this.prisma.finalChallenge.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: 'asc' },
    });
    if (!challenge) {
      throw new NotFoundException('Final challenge is not configured');
    }
    return challenge;
  }

  private normalizeAnswer(answer: string) {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async getActiveStationProgress(teamId: number) {
    return this.prisma.teamStationProgress.findFirst({
      where: {
        teamId,
        status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] },
      },
      select: { id: true, stationId: true },
    });
  }

  private async getCooldownState(
    finalChallengeId: number,
    teamId: number,
    now: Date,
  ) {
    const [wrongAttemptCount, latestWrong] = await Promise.all([
      this.prisma.finalSubmission.count({
        where: { finalChallengeId, teamId, isCorrect: false },
      }),
      this.prisma.finalSubmission.findFirst({
        where: { finalChallengeId, teamId, isCorrect: false },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);
    const cooldownSeconds = Math.min(wrongAttemptCount, 10);
    const nextAttemptAt =
      latestWrong && cooldownSeconds > 0
        ? new Date(latestWrong.submittedAt.getTime() + cooldownSeconds * 1000)
        : null;

    return {
      wrongAttemptCount,
      cooldownSeconds,
      nextAttemptAt: nextAttemptAt?.toISOString() ?? null,
      isCoolingDown: Boolean(nextAttemptAt && nextAttemptAt > now),
    };
  }

  private calculateFinalBonus(rank: number) {
    return Math.max(11 - rank, 0);
  }

  private toPublicChallenge(challenge: FinalChallenge, includeClue: boolean) {
    return {
      id: challenge.id,
      title: challenge.title,
      clueText: includeClue ? challenge.clueText : null,
      startsAt: challenge.startsAt,
      maxWinners: challenge.maxWinners,
      pointsByRank: challenge.pointsByRank,
      isActive: challenge.isActive,
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    };
  }

  private toPublicSubmission(submission: {
    id: number;
    finalChallengeId: number;
    teamId: number;
    isCorrect: boolean;
    winnerRank: number | null;
    pointsAwarded: number;
    submittedAt: Date;
    scoreEventId: number | null;
  }) {
    return {
      id: submission.id,
      finalChallengeId: submission.finalChallengeId,
      teamId: submission.teamId,
      isCorrect: submission.isCorrect,
      winnerRank: submission.winnerRank,
      pointsAwarded: submission.pointsAwarded,
      submittedAt: submission.submittedAt,
      scoreEventId: submission.scoreEventId,
    };
  }

  private toPublicTeam(team: Team) {
    return {
      id: team.id,
      name: team.name,
      username: team.username,
      captainName: team.captainName,
      totalPoints: team.totalPoints,
      maxPossiblePoints: team.maxPossiblePoints,
      totalPlaySeconds: team.totalPlaySeconds,
      startedAt: team.startedAt,
      status: team.status,
      color: team.color,
    };
  }
}
