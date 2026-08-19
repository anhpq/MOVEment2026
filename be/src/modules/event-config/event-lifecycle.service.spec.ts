import { ProgressStatus } from '@prisma/client';
import { EventLifecycleService } from './event-lifecycle.service';

type Candidate = {
  id: number;
  teamId: number;
  stationId: string;
  status: ProgressStatus;
  checkedInAt: Date;
  checkedOutAt: Date;
  completedAt: Date;
  stationRank: number | null;
  scoreAchieved: number;
};

function makeCandidate(teamId: number, durationMs: number, checkedOutAt: Date): Candidate {
  return {
    id: teamId,
    teamId,
    stationId: 'ST009',
    status: ProgressStatus.COMPLETED,
    checkedInAt: new Date(checkedOutAt.getTime() - durationMs),
    checkedOutAt,
    completedAt: checkedOutAt,
    stationRank: null,
    scoreAchieved: 10,
  };
}

function createHarness(candidates: Candidate[]) {
  const totals = new Map(candidates.map((candidate) => [candidate.teamId, 100]));
  const scoreEvents: Array<Record<string, unknown>> = [];
  const rankActivities: Array<Record<string, unknown>> = [];
  const tx = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    teamStationProgress: {
      findMany: jest.fn().mockImplementation(({where}: {where: Record<string, unknown>}) => {
        if (where.checkedOutAt === null) return [];
        if (where.completedAt === null) return [];
        if (where.stationRank === null) {
          return candidates
            .filter((candidate) => candidate.stationRank === null)
            .map((candidate) => ({...candidate, team: {totalPoints: totals.get(candidate.teamId) ?? 0}}));
        }
        return candidates.map((candidate) => ({...candidate}));
      }),
      updateMany: jest.fn().mockImplementation(({where, data}: {where: {id: number; stationRank?: null}; data: Partial<Candidate>}) => {
        const candidate = candidates.find((item) => item.id === where.id);
        if (!candidate || (where.stationRank === null && candidate.stationRank !== null)) return {count: 0};
        Object.assign(candidate, data);
        return {count: 1};
      }),
    },
    team: {
      findUniqueOrThrow: jest.fn().mockImplementation(({where}: {where: {id: number}}) => ({totalPoints: totals.get(where.id) ?? 0})),
      update: jest.fn().mockImplementation(({where, data}: {where: {id: number}; data: {totalPoints: {increment: number}}}) => {
        totals.set(where.id, (totals.get(where.id) ?? 0) + data.totalPoints.increment);
        return {id: where.id};
      }),
    },
    scoreEvent: {
      create: jest.fn().mockImplementation(({data}: {data: Record<string, unknown>}) => {
        scoreEvents.push(data);
        return data;
      }),
    },
    activityLog: {
      create: jest.fn().mockImplementation(({data}: {data: Record<string, unknown>}) => {
        rankActivities.push(data);
        return data;
      }),
    },
  };
  const prisma = {
    $transaction: jest.fn().mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx)),
  };
  const eventConfig = {isPastFinalStart: jest.fn().mockResolvedValue(true)};
  const service = new EventLifecycleService(prisma as never, eventConfig as never);
  return {service, prisma, tx, totals, scoreEvents, rankActivities};
}

describe('EventLifecycleService ST009 finalization', () => {
  afterEach(() => jest.useRealTimers());

  it('evaluates the checkout cutoff after acquiring the lifecycle lock', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T05:29:59.999Z'));
    let releaseLock: (() => void) | undefined;
    const tx = {
      $executeRawUnsafe: jest.fn().mockImplementation(() => new Promise<void>((resolve) => { releaseLock = resolve; })),
    };
    const eventConfig = {
      isPastFinalStart: jest.fn().mockImplementation((now: Date) => now.getTime() >= new Date('2026-08-20T05:30:00.000Z').getTime()),
    };
    const service = new EventLifecycleService({} as never, eventConfig as never);

    const result = service.isCheckoutBeforeFinalStart(tx as never);
    await Promise.resolve();
    jest.setSystemTime(new Date('2026-08-20T05:30:00.000Z'));
    releaseLock?.();

    await expect(result).resolves.toBe(false);
    expect(eventConfig.isPastFinalStart).toHaveBeenCalledWith(new Date('2026-08-20T05:30:00.000Z'));
  });

  it('ranks all 25 Teams by millisecond duration, checkout time, then Team ID', async () => {
    const base = new Date('2026-08-20T05:00:10.000Z');
    const candidates = [
      makeCandidate(1, 1_000, base),
      makeCandidate(2, 1_000, base),
      makeCandidate(3, 1_000, new Date(base.getTime() + 1)),
      ...Array.from({length: 22}, (_, index) => {
        const teamId = index + 4;
        return makeCandidate(teamId, 1_000 + teamId, base);
      }),
    ].reverse();
    const {service, tx, totals, scoreEvents, rankActivities} = createHarness(candidates);

    await service.reconcileFinalStart(new Date('2026-08-20T05:30:00.000Z'));

    const rankWrites = tx.teamStationProgress.updateMany.mock.calls
      .map(([call]) => call)
      .filter((call) => call.data.stationRank !== undefined);
    expect(rankWrites).toHaveLength(25);
    expect(rankWrites.slice(0, 3).map((call) => [call.where.id, call.data.stationRank])).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
    expect(rankWrites.at(-1)?.data).toEqual(expect.objectContaining({stationRank: 25, scoreAchieved: 1}));
    expect(totals.get(1)).toBe(115);
    expect(totals.get(16)).toBe(100);
    expect(totals.get(25)).toBe(91);
    expect(scoreEvents.filter((event) => event.reason === 'ST009_FINAL_RANK')).toHaveLength(25);
    expect(rankActivities.filter((event) => event.action === 'ST009_FINAL_RANKED')).toHaveLength(25);
    expect(tx.$executeRawUnsafe).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1)',
      2026081909,
    );
  });

  it('normalizes legacy pending and completed scores before applying the final delta', async () => {
    const pending = {
      ...makeCandidate(1, 1_500, new Date('2026-08-20T05:00:01.500Z')),
      completedAt: null,
      scoreAchieved: 0,
      team: {totalPoints: 50},
    };
    const completed = {
      ...makeCandidate(2, 2_000, new Date('2026-08-20T05:00:02.000Z')),
      scoreAchieved: 20,
      team: {totalPoints: 70},
    };
    const rankedCandidates = [
      {...pending, completedAt: pending.checkedOutAt, scoreAchieved: 10, stationRank: null},
      {...completed, scoreAchieved: 10, stationRank: null},
    ];
    const scoreEvents: Array<Record<string, unknown>> = [];
    const tx = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(0),
      teamStationProgress: {
        findMany: jest.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([pending])
          .mockResolvedValueOnce([completed])
          .mockResolvedValueOnce(rankedCandidates),
        updateMany: jest.fn().mockResolvedValue({count: 1}),
      },
      team: {
        update: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({totalPoints: 60}),
      },
      scoreEvent: {create: jest.fn().mockImplementation(({data}) => { scoreEvents.push(data); return data; })},
      activityLog: {create: jest.fn()},
    };
    const prisma = {$transaction: jest.fn().mockImplementation((callback) => callback(tx))};
    const service = new EventLifecycleService(
      prisma as never,
      {isPastFinalStart: jest.fn().mockResolvedValue(true)} as never,
    );

    await service.reconcileFinalStart();

    expect(scoreEvents.filter((event) => event.reason === 'ST009_PROVISIONAL_NORMALIZATION').map((event) => event.delta)).toEqual([10, -10]);
    expect(scoreEvents.filter((event) => event.reason === 'ST009_FINAL_RANK').map((event) => event.delta)).toEqual([15, 14]);
  });

  it('does not overwrite an Admin correction after stationRank is durable', async () => {
    const corrected = {
      ...makeCandidate(1, 1_000, new Date('2026-08-20T05:00:01.000Z')),
      stationRank: 1,
      scoreAchieved: 105,
    };
    const {service, tx, totals, scoreEvents} = createHarness([corrected]);

    await service.reconcileFinalStart();

    expect(tx.teamStationProgress.updateMany).not.toHaveBeenCalled();
    expect(totals.get(1)).toBe(100);
    expect(scoreEvents).toHaveLength(0);
  });

  it('serializes concurrent reconciliation and awards a Team once', async () => {
    const candidate = makeCandidate(1, 1_000, new Date('2026-08-20T05:00:01.000Z'));
    const harness = createHarness([candidate]);
    let queue = Promise.resolve();
    harness.prisma.$transaction.mockImplementation((callback: (client: typeof harness.tx) => unknown) => {
      const current = queue.then(() => callback(harness.tx));
      queue = current.then(() => undefined, () => undefined);
      return current;
    });

    await Promise.all([
      harness.service.reconcileFinalStart(),
      harness.service.reconcileFinalStart(),
    ]);

    expect(harness.scoreEvents.filter((event) => event.reason === 'ST009_FINAL_RANK')).toHaveLength(1);
    expect(candidate.stationRank).toBe(1);
    expect(harness.totals.get(1)).toBe(115);
  });

  it('returns without writes when no Team completed ST009', async () => {
    const {service, tx, scoreEvents} = createHarness([]);

    await expect(service.reconcileFinalStart()).resolves.toBe(0);

    expect(tx.teamStationProgress.updateMany).not.toHaveBeenCalled();
    expect(scoreEvents).toHaveLength(0);
  });
});
