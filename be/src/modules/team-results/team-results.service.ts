import { Injectable } from '@nestjs/common';
import { FinalSubmission, ProgressStatus, StationTrackingMode, TeamStationProgress } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type TeamResultStationColumn = {
  id: string;
  name: string;
  header: string;
  trackingMode: StationTrackingMode;
};

export type TeamResultStation = {
  stationId: string;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  score: number;
  completed: boolean;
};

export type TeamResultRow = {
  rank: number;
  teamId: number;
  teamCode: number;
  teamName: string;
  username: string;
  captainName: string;
  maxPossiblePoints: number;
  rankTotalScore: number;
  rankTotalPlaySeconds: number;
  completedStations: number;
  computedScore: number;
  finalSubmittedAt: Date | null;
  finalRank: number | null;
  finalBonusScore: number;
  lastStationName: string | null;
  stations: Record<string, TeamResultStation>;
};

export type RankedTeamResults = {
  stationColumns: TeamResultStationColumn[];
  rows: TeamResultRow[];
};

type ProgressWithStation = TeamStationProgress & {
  station: { id: string; name: string; trackingMode: StationTrackingMode; isActive: boolean };
};

type TeamForResults = {
  id: number;
  name: string;
  username: string;
  captainName: string;
  totalPoints: number;
  maxPossiblePoints: number;
  totalPlaySeconds: number;
  progress: ProgressWithStation[];
};

export function compareTeamResultRows(
  left: Omit<TeamResultRow, 'rank'>,
  right: Omit<TeamResultRow, 'rank'>,
) {
  if (right.rankTotalScore !== left.rankTotalScore) {
    return right.rankTotalScore - left.rankTotalScore;
  }
  if (left.rankTotalPlaySeconds !== right.rankTotalPlaySeconds) {
    return left.rankTotalPlaySeconds - right.rankTotalPlaySeconds;
  }
  if (right.completedStations !== left.completedStations) {
    return right.completedStations - left.completedStations;
  }
  if (left.finalSubmittedAt && right.finalSubmittedAt) {
    const submittedDelta = left.finalSubmittedAt.getTime() - right.finalSubmittedAt.getTime();
    if (submittedDelta !== 0) {
      return submittedDelta;
    }
  } else if (left.finalSubmittedAt && !right.finalSubmittedAt) {
    return -1;
  } else if (!left.finalSubmittedAt && right.finalSubmittedAt) {
    return 1;
  }
  return left.teamId - right.teamId;
}

@Injectable()
export class TeamResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRankedTeamResults(): Promise<RankedTeamResults> {
    const [stations, teams, activeFinalChallenge] = await Promise.all([
      this.prisma.station.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }, { createdAt: 'asc' }],
        include: {
          games: {
            where: { isActive: true },
            orderBy: { id: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.team.findMany({
        include: {
          progress: {
            include: { station: true },
          },
        },
      }),
      this.prisma.finalChallenge.findFirst({
        where: { isActive: true },
        orderBy: { startsAt: 'desc' },
      }),
    ]);

    const finalSubmissions = activeFinalChallenge
      ? await this.prisma.finalSubmission.findMany({
          where: {
            finalChallengeId: activeFinalChallenge.id,
            isCorrect: true,
          },
          orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
        })
      : [];
    const correctFinalByTeam = new Map<number, FinalSubmission>();
    for (const submission of finalSubmissions) {
      if (!correctFinalByTeam.has(submission.teamId)) {
        correctFinalByTeam.set(submission.teamId, submission);
      }
    }

    const stationColumns = this.toStationColumns(stations);
    const activeStationIds = new Set(stationColumns.map((station) => station.id));
    const rowsWithoutRank = teams.map((team) =>
      this.toTeamResultRow(team, stationColumns, activeStationIds, correctFinalByTeam.get(team.id)),
    );
    const rows = rowsWithoutRank
      .sort(compareTeamResultRows)
      .map((row, index) => ({ rank: index + 1, ...row }));

    return { stationColumns, rows };
  }

  toLeaderboardRows(results: RankedTeamResults) {
    return results.rows.map((row) => ({
      rank: row.rank,
      teamId: row.teamId,
      teamCode: row.teamCode,
      teamName: row.teamName,
      captainName: row.captainName,
      totalPoints: row.rankTotalScore,
      maxPossiblePoints: row.maxPossiblePoints,
      completedStations: row.completedStations,
      lastStationName: row.lastStationName,
      totalPlaySeconds: row.rankTotalPlaySeconds,
    }));
  }

  private toStationColumns(
    stations: Array<{ id: string; name: string; trackingMode: StationTrackingMode }>,
  ): TeamResultStationColumn[] {
    const nameCounts = new Map<string, number>();
    return stations.map((station) => {
      const count = (nameCounts.get(station.name) ?? 0) + 1;
      nameCounts.set(station.name, count);
      return {
        id: station.id,
        name: station.name,
        header: count === 1 ? station.name : `${station.name} (#${String(count).padStart(2, '0')})`,
        trackingMode: station.trackingMode,
      };
    });
  }

  private toTeamResultRow(
    team: TeamForResults,
    stationColumns: TeamResultStationColumn[],
    activeStationIds: Set<string>,
    finalSubmission: FinalSubmission | undefined,
  ): Omit<TeamResultRow, 'rank'> {
    const progressByStation = new Map(team.progress.map((item) => [item.stationId, item]));
    const stations = Object.fromEntries(
      stationColumns.map((station) => {
        const progress = progressByStation.get(station.id);
        return [station.id, this.toStationResult(station, progress)];
      }),
    );
    const completedProgress = team.progress.filter(
      (progress) => activeStationIds.has(progress.stationId) && this.isCompleted(progress),
    );
    const stationScore = completedProgress.reduce(
      (sum, progress) => sum + progress.scoreAchieved,
      0,
    );
    const finalBonusScore = finalSubmission?.pointsAwarded ?? 0;
    const latestCompleted = [...completedProgress].sort((left, right) => {
      const rightTime = right.completedAt?.getTime() ?? 0;
      const leftTime = left.completedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    })[0];

    return {
      teamId: team.id,
      teamCode: team.id,
      teamName: team.name,
      username: team.username,
      captainName: team.captainName,
      maxPossiblePoints: team.maxPossiblePoints,
      rankTotalScore: team.totalPoints,
      rankTotalPlaySeconds: team.totalPlaySeconds,
      completedStations: completedProgress.length,
      computedScore: stationScore + finalBonusScore,
      finalSubmittedAt: finalSubmission?.submittedAt ?? null,
      finalRank: finalSubmission?.winnerRank ?? null,
      finalBonusScore,
      lastStationName: latestCompleted?.station.name ?? null,
      stations,
    };
  }

  private toStationResult(
    station: TeamResultStationColumn,
    progress: ProgressWithStation | undefined,
  ): TeamResultStation {
    if (!progress || !this.isCompleted(progress)) {
      return {
        stationId: station.id,
        checkedInAt: null,
        checkedOutAt: null,
        score: 0,
        completed: false,
      };
    }

    return {
      stationId: station.id,
      checkedInAt: progress.checkedInAt,
      checkedOutAt: progress.checkedOutAt,
      score: progress.scoreAchieved,
      completed: true,
    };
  }

  private isCompleted(progress: ProgressWithStation) {
    return progress.status === ProgressStatus.COMPLETED;
  }
}
