import { BadRequestException } from '@nestjs/common';
import { QrPurpose } from '@prisma/client';
import {
  assertEventPreparationConfirmation,
  EVENT_PREPARATION_CONFIRMATION,
  isEventPreparationResetAvailable,
  readEventPreparationInventory,
  resetGameplayInTransaction,
  rotateAllQrInTransaction,
} from './event-preparation-core';

const now = new Date('2026-08-21T00:00:00.000Z');
const stationIds = Array.from({ length: 17 }, (_, index) => `ST${String(index + 1).padStart(3, '0')}`);

function createTransaction() {
  const teams = [{ id: 1 }, { id: 2 }];
  const stations = stationIds.map((id) => ({ id }));
  const games = stationIds.map((stationId, index) => ({ id: index + 1, stationId }));
  const teamTokens = teams.map((team) => ({ teamId: team.id, expiresAt: null }));
  const stationTokens = stationIds.flatMap((stationId) => [
    { stationId, purpose: QrPurpose.CHECK_IN },
    { stationId, purpose: QrPurpose.CHECK_OUT },
  ]);

  return {
    team: {
      findMany: jest.fn().mockResolvedValue(teams),
      updateMany: jest.fn().mockResolvedValue({ count: teams.length }),
    },
    station: { findMany: jest.fn().mockResolvedValue(stations) },
    game: { findMany: jest.fn().mockResolvedValue(games) },
    qrLoginToken: {
      findMany: jest.fn().mockResolvedValue(teamTokens),
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: teams.length }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    qrToken: {
      findMany: jest.fn().mockResolvedValue(stationTokens),
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: stationTokens.length }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    eventConfig: { count: jest.fn().mockResolvedValue(1) },
    finalChallenge: {
      count: jest.fn().mockResolvedValue(1),
    },
    teamSession: {
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      count: jest.fn().mockResolvedValue(0),
    },
    scoreEvent: {
      deleteMany: jest.fn().mockResolvedValue({ count: 4 }),
      count: jest.fn().mockResolvedValue(0),
    },
    finalSubmission: {
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      count: jest.fn().mockResolvedValue(0),
    },
    teamStationProgress: {
      deleteMany: jest.fn().mockResolvedValue({ count: 34 }),
      createMany: jest.fn().mockResolvedValue({ count: 34 }),
      count: jest.fn().mockResolvedValue(34),
    },
    activityLog: {
      deleteMany: jest.fn().mockResolvedValue({ count: 9 }),
      count: jest.fn().mockResolvedValue(0),
    },
  };
}

describe('event preparation core', () => {
  it('enforces the reset confirmation and absolute cutoff', () => {
    expect(() => assertEventPreparationConfirmation('', false)).toThrow(BadRequestException);
    expect(() => assertEventPreparationConfirmation(EVENT_PREPARATION_CONFIRMATION, false)).toThrow(BadRequestException);
    expect(() => assertEventPreparationConfirmation(EVENT_PREPARATION_CONFIRMATION, true)).not.toThrow();
    expect(isEventPreparationResetAvailable(new Date('2026-08-26T22:59:59.999Z'))).toBe(true);
    expect(isEventPreparationResetAvailable(new Date('2026-08-26T23:00:00.000Z'))).toBe(false);
  });

  it('requires the exact Team/Station QR inventory before destructive work', async () => {
    const tx = createTransaction();
    const invalid = await readEventPreparationInventory({
      ...tx,
      qrToken: { ...tx.qrToken, findMany: jest.fn().mockResolvedValue([]) },
    } as never, now);

    expect(invalid.ready).toBe(false);
    expect(invalid.issues).toContain('STATION_QR_INVENTORY_INVALID');
  });

  it('resets only rehearsal/runtime state while retaining the active QR inventory', async () => {
    const tx = createTransaction();

    const result = await resetGameplayInTransaction(tx as never, now);

    expect(result).toEqual({
      teams: 2,
      progressRows: 34,
      teamSessions: 0,
      scoreEvents: 0,
      finalSubmissions: 0,
      activityLogs: 0,
    });
    expect(tx.qrLoginToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { usageCount: 0, lastUsedAt: null },
    }));
    expect(tx.qrToken.updateMany).not.toHaveBeenCalled();
    expect(tx.qrLoginToken.create).not.toHaveBeenCalled();
    expect(tx.qrToken.create).not.toHaveBeenCalled();
    expect(tx.teamStationProgress.createMany).toHaveBeenCalledWith({ data: expect.any(Array) });
  });

  it('rotates every Team and Station credential while preserving the Station/Game inventory', async () => {
    const tx = createTransaction();

    const result = await rotateAllQrInTransaction(tx as never, now);

    expect(result).toEqual({
      teams: 2,
      stations: 17,
      teamQrTokens: 2,
      stationQrTokens: 34,
      revokedTeamSessions: 3,
    });
    expect(tx.qrLoginToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isActive: false }),
    }));
    expect(tx.qrToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isActive: false }),
    }));
    expect(tx.qrLoginToken.create).toHaveBeenCalledTimes(2);
    expect(tx.qrToken.create).toHaveBeenCalledTimes(34);
    expect(tx.teamStationProgress.deleteMany).not.toHaveBeenCalled();
    expect(tx.scoreEvent.deleteMany).not.toHaveBeenCalled();
  });
});
