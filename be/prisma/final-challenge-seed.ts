import { Prisma } from '@prisma/client';

export const FINAL_CHALLENGE_SEED_KEY = 'Final Cipher';
export const FINAL_CHALLENGE_CANONICAL_ANSWER = 'EVERY MOVE COUNTS';
export const FINAL_CHALLENGE_SEED_POINTS_BY_RANK = [40, 30, 25, 22, 20, 18, 16, 14, 12, 10];

// Temporary production override: force seed-managed Final Challenge fields through 2026-08-21 23:59:59 Asia/Ho_Chi_Minh.
export const FINAL_CHALLENGE_PRODUCTION_OVERRIDE_CUTOFF_HCM = '2026-08-21T23:59:59+07:00';

export type SeedEnvironment = 'production' | 'non-production';

type ExistingFinalChallenge = {
  id: number;
  title: string;
  clueText: string;
  answerHash: string;
  maxWinners: number;
  pointsByRank: Prisma.JsonValue;
} | null;

export type FinalChallengeSeedAction =
  | {
      operation: 'create';
      data: Prisma.FinalChallengeCreateInput;
    }
  | {
      operation: 'update';
      id: number;
      data: Prisma.FinalChallengeUpdateInput;
    }
  | {
      operation: 'preserve';
    };

export function normalizeFinalAnswer(answer: string) {
  return answer.trim().toUpperCase();
}

export function isFinalChallengeProductionOverrideEnabled(now: Date) {
  return now.getTime() <= new Date(FINAL_CHALLENGE_PRODUCTION_OVERRIDE_CUTOFF_HCM).getTime();
}

export function getCanonicalFinalChallengeSeedData(now: Date) {
  return {
    title: FINAL_CHALLENGE_SEED_KEY,
    clueText: 'Giai mat thu cuoi cung',
    answerHash: normalizeFinalAnswer(FINAL_CHALLENGE_CANONICAL_ANSWER),
    startsAt: now,
    maxWinners: 10,
    pointsByRank: FINAL_CHALLENGE_SEED_POINTS_BY_RANK,
  } satisfies Prisma.FinalChallengeCreateInput;
}

export function planFinalChallengeSeed(params: {
  existing: ExistingFinalChallenge;
  environment: SeedEnvironment;
  now: Date;
}): FinalChallengeSeedAction {
  const canonical = getCanonicalFinalChallengeSeedData(params.now);
  if (!params.existing) {
    return { operation: 'create', data: canonical };
  }

  const shouldOverwrite =
    params.environment !== 'production' || isFinalChallengeProductionOverrideEnabled(params.now);
  if (!shouldOverwrite) {
    return { operation: 'preserve' };
  }

  return {
    operation: 'update',
    id: params.existing.id,
    data: {
      title: canonical.title,
      clueText: canonical.clueText,
      answerHash: canonical.answerHash,
      maxWinners: canonical.maxWinners,
      pointsByRank: canonical.pointsByRank,
    },
  };
}
