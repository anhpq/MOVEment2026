import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FINAL_CHALLENGE_SEED_KEY,
  normalizeFinalAnswer,
  planFinalChallengeSeed,
} from './final-challenge-seed';

const existingFinalChallenge = {
  id: 1,
  title: FINAL_CHALLENGE_SEED_KEY,
  clueText: 'Runtime clue',
  answerHash: 'RUNTIMEANSWER',
  maxWinners: 5,
  pointsByRank: [5, 4, 3, 2, 1],
};

describe('Final Challenge seed policy', () => {
  it('trims outer whitespace and preserves internal whitespace exactly', () => {
    expect(normalizeFinalAnswer(' every move counts ')).toBe('EVERY MOVE COUNTS');
    expect(normalizeFinalAnswer('every  move counts')).toBe('EVERY  MOVE COUNTS');
    expect(normalizeFinalAnswer('every\tmove counts')).toBe('EVERY\tMOVE COUNTS');
    expect(normalizeFinalAnswer('every\nmove counts')).toBe('EVERY\nMOVE COUNTS');
  });
  it('overwrites seed-managed production fields before the cutoff', () => {
    const action = planFinalChallengeSeed({
      existing: existingFinalChallenge,
      environment: 'production',
      now: new Date('2026-08-20T12:00:00+07:00'),
    });

    expect(action).toMatchObject({
      operation: 'update',
      id: 1,
      data: {
        title: FINAL_CHALLENGE_SEED_KEY,
        clueText: 'Giai mat thu cuoi cung',
        answerHash: 'EVERY MOVE COUNTS',
        maxWinners: 10,
        pointsByRank: [40, 30, 25, 22, 20, 18, 16, 14, 12, 10],
      },
    });
  });

  it('overwrites seed-managed production fields through August 21 Asia Ho Chi Minh time', () => {
    const action = planFinalChallengeSeed({
      existing: existingFinalChallenge,
      environment: 'production',
      now: new Date('2026-08-21T23:59:59+07:00'),
    });

    expect(action.operation).toBe('update');
  });

  it('preserves an existing production record after the cutoff', () => {
    const action = planFinalChallengeSeed({
      existing: existingFinalChallenge,
      environment: 'production',
      now: new Date('2026-08-22T00:00:00+07:00'),
    });

    expect(action).toEqual({ operation: 'preserve' });
  });

  it('overwrites seed-managed fields in non-production environments', () => {
    const action = planFinalChallengeSeed({
      existing: existingFinalChallenge,
      environment: 'non-production',
      now: new Date('2027-01-01T00:00:00+07:00'),
    });

    expect(action.operation).toBe('update');
  });

  it('creates the canonical record when it is missing after the cutoff', () => {
    const action = planFinalChallengeSeed({
      existing: null,
      environment: 'production',
      now: new Date('2026-08-22T00:00:00+07:00'),
    });

    expect(action).toMatchObject({
      operation: 'create',
      data: {
        title: FINAL_CHALLENGE_SEED_KEY,
        answerHash: 'EVERY MOVE COUNTS',
      },
    });
  });

  it('is idempotent for repeated production seed planning before the cutoff', () => {
    const now = new Date('2026-08-21T10:00:00+07:00');
    const first = planFinalChallengeSeed({
      existing: existingFinalChallenge,
      environment: 'production',
      now,
    });
    const second = planFinalChallengeSeed({
      existing: existingFinalChallenge,
      environment: 'production',
      now,
    });

    expect(second).toEqual(first);
  });

  it('looks up the seed-managed record by stable Final Challenge business key', () => {
    const seedSource = readFileSync(join(__dirname, 'seed.ts'), 'utf8');

    expect(seedSource).toContain('where: { title: FINAL_CHALLENGE_SEED_KEY }');
    expect(seedSource).not.toContain('where: { isActive: true }');
  });

  it('does not include unrelated runtime data in production updates', () => {
    const action = planFinalChallengeSeed({
      existing: existingFinalChallenge,
      environment: 'production',
      now: new Date('2026-08-21T10:00:00+07:00'),
    });

    expect(action.operation).toBe('update');
    if (action.operation === 'update') {
      expect(Object.keys(action.data).sort()).toEqual([
        'answerHash',
        'clueText',
        'maxWinners',
        'pointsByRank',
        'title',
      ]);
    }
  });
});
