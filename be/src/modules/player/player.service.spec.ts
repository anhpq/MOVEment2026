import { HttpStatus } from '@nestjs/common'
import { ActorType, Prisma, ProgressStatus, QrPurpose, StationTrackingMode } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { PlayerService } from './player.service'
import { PLAYER_ERROR_CODES, PlayerActionException } from './player-error'

const progress = {
  id: 11,
  teamId: 2,
  stationId: 'ST002',
  gameId: 3,
  status: ProgressStatus.AVAILABLE,
  checkedInAt: null,
  checkedOutAt: null,
  completedAt: null,
  cancelledAt: null,
  nextCheckInAllowedAt: null,
  scoreAchieved: 0,
  attemptNo: 0,
  station: { trackingMode: StationTrackingMode.BOTH },
}

const mockPrisma = {
  station: { findMany: jest.fn(), findFirst: jest.fn() },
  finalChallenge: { findFirst: jest.fn() },
  finalSubmission: { findFirst: jest.fn(), count: jest.fn() },
  qrToken: { findUnique: jest.fn() },
  teamStationProgress: {
    groupBy: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
  },
  team: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
  scoreEvent: { create: jest.fn() },
  $transaction: jest.fn(),
}

const mockEventConfig = {
  isPastEventEnd: jest.fn(),
  getConfig: jest.fn(),
  getPublicConfig: jest.fn(),
}

const mockActivityLog = {
  log: jest.fn(),
}

const mockTeamResults = {
  getRankedTeamResults: jest.fn(),
  getLeanLeaderboard: jest.fn(),
  toLeaderboardRows: jest.fn(),
}

describe('PlayerService station flow', () => {
  let service: PlayerService

  beforeEach(() => {
    service = new PlayerService(
      mockPrisma as never,
      mockEventConfig as never,
      mockActivityLog as never,
      mockTeamResults as never,
    )
    jest.clearAllMocks()
    mockEventConfig.isPastEventEnd.mockResolvedValue(false)
    mockPrisma.teamStationProgress.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 1,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_IN,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
  })

  it('checks in with a valid station QR token', async () => {
    const updated = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date(),
      attemptNo: 1,
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(progress)
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue(null)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(updated)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(updated)

    expect(mockPrisma.qrToken.findUnique).toHaveBeenCalledWith({
      where: { tokenFingerprint: expect.any(String) },
      include: { station: true },
    })
    expect(mockPrisma.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: progress.id,
        teamId: 2,
        stationId: 'ST002',
        status: ProgressStatus.AVAILABLE,
      }),
      data: expect.objectContaining({
        status: ProgressStatus.PLAYING,
        checkedInAt: expect.any(Date),
        nextCheckInAllowedAt: null,
        attemptNo: { increment: 1 },
      }),
    })
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: ActorType.TEAM,
        actorId: 2,
        action: 'CHECK_IN',
      }),
    )
  })

  it('runs a unified QR action for check-in without requiring a frontend station id', async () => {
    const updated = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date(),
      attemptNo: 1,
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(progress)
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue(null)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(updated)

    await expect(
      service.qrAction(2, { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual({
      action: 'CHECK_IN',
      stationId: 'ST002',
      requiresScore: false,
      progress: updated,
    })
    expect(bcrypt.compare).toHaveBeenCalledTimes(1)
  })

  it('does not create a second attempt for duplicate check-in on the same active station', async () => {
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
      attemptNo: 1,
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(activeProgress)

    expect(mockPrisma.teamStationProgress.findFirst).not.toHaveBeenCalled()
    expect(mockPrisma.teamStationProgress.updateMany).not.toHaveBeenCalled()
  })

  it('returns station playing counts without team identity', async () => {
    mockPrisma.teamStationProgress.groupBy.mockResolvedValue([
      { stationId: 'ST001', _count: { _all: 2 } },
      { stationId: 'ST002', _count: { _all: 1 } },
    ])

    await expect(service.getStationPlayingCounts()).resolves.toEqual([
      { stationId: 'ST001', playingTeamCount: 2 },
      { stationId: 'ST002', playingTeamCount: 1 },
    ])

    expect(mockPrisma.teamStationProgress.groupBy).toHaveBeenCalledWith({
      by: ['stationId'],
      where: {
        status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] },
        station: { isActive: true },
      },
      _count: { _all: true },
    })
  })

  it('localizes player Station list by lang with per-field fallback', async () => {
    mockPrisma.station.findMany.mockResolvedValue([
      {
        id: 'ST001',
        name: 'Tên VI',
        nameEn: 'English Name',
        description: 'Mô tả VI',
        descriptionEn: '',
        mapX: 10,
        mapY: 20,
        trackingMode: StationTrackingMode.BOTH,
        isActive: true,
        images: [
          {url: 'https://cdn.example.com/first.webp'},
          {url: 'https://cdn.example.com/second.jpg'},
        ],
        games: [],
        progress: [],
      },
    ])

    await expect(service.getStations(2, 'en')).resolves.toEqual([
      expect.objectContaining({
        id: 'ST001',
        name: 'English Name',
        description: 'Mô tả VI',
        imageUrls: [
          'https://cdn.example.com/first.webp',
          'https://cdn.example.com/second.jpg',
        ],
      }),
    ])
  })

  it('falls back to Vietnamese Station values for invalid player locale', async () => {
    mockPrisma.station.findMany.mockResolvedValue([
      {
        id: 'ST001',
        name: 'Tên VI',
        nameEn: 'English Name',
        description: 'Mô tả VI',
        descriptionEn: 'English description',
        mapX: 10,
        mapY: 20,
        trackingMode: StationTrackingMode.BOTH,
        isActive: true,
        images: [],
        games: [],
        progress: [],
      },
    ])

    await expect(service.getStations(2, 'fr')).resolves.toEqual([
      expect.objectContaining({
        name: 'Tên VI',
        description: 'Mô tả VI',
        imageUrls: [],
      }),
    ])
  })

  it('rejects check-in after eventEndTime with a closed station message', async () => {
    mockEventConfig.isPastEventEnd.mockResolvedValue(true)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).rejects.toThrow('Stations are closed')
    expect(mockPrisma.qrToken.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.teamStationProgress.updateMany).not.toHaveBeenCalled()
  })

  it('rejects check-in when the QR token is invalid', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false)

    const error = (await service
      .checkIn(2, 'ST002', { qrToken: 'wrong-token' })
      .catch((value: unknown) => value)) as PlayerActionException

    expect(error).toBeInstanceOf(PlayerActionException)
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN)
    expect(error.getResponse()).toEqual(
      expect.objectContaining({ code: PLAYER_ERROR_CODES.qrInvalid }),
    )
    expect(mockPrisma.teamStationProgress.updateMany).not.toHaveBeenCalled()
  })

  it('rejects a wrong-purpose token based on the database record', async () => {
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 2,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_OUT,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).rejects.toThrow(PlayerActionException)
    expect(mockPrisma.teamStationProgress.updateMany).not.toHaveBeenCalled()
  })

  it('rejects a revoked token even when the hash matches', async () => {
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 1,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_IN,
      isActive: false,
      revokedAt: new Date(),
      expiresAt: null,
      station: { isActive: true },
    })

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).rejects.toThrow(PlayerActionException)
    expect(mockPrisma.teamStationProgress.updateMany).not.toHaveBeenCalled()
  })

  it('retains Legacy Station QR compatibility when an active DB record exists', async () => {
    const updated = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date(),
      attemptNo: 1,
    }
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 3,
      stationId: 'ST002',
      tokenHash: 'legacy-hashed-qr-token',
      tokenFingerprint: 'legacy-fingerprint',
      purpose: QrPurpose.CHECK_IN,
      schemaVersion: 'LEGACY',
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(progress)
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue(null)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(updated)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-STATION-ST002-CHECK_IN' }),
    ).resolves.toEqual(updated)
  })

  it('rejects restart during cancel cooldown and allows restart after the deadline', async () => {
    const futureCooldown = new Date(Date.now() + 5 * 60_000)
    const pastCooldown = new Date(Date.now() - 1_000)
    const updated = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date(),
      nextCheckInAllowedAt: null,
      attemptNo: 1,
    }

    mockPrisma.teamStationProgress.findUnique.mockResolvedValueOnce({
      ...progress,
      cancelledAt: new Date(),
      nextCheckInAllowedAt: futureCooldown,
    })

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).rejects.toThrow('Cancel cooldown is still active')
    expect(mockPrisma.teamStationProgress.updateMany).not.toHaveBeenCalled()

    mockPrisma.teamStationProgress.findUnique.mockResolvedValueOnce({
      ...progress,
      cancelledAt: new Date(),
      nextCheckInAllowedAt: pastCooldown,
    })
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue(null)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(updated)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(updated)

    expect(mockPrisma.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: progress.id }),
      data: expect.objectContaining({
        status: ProgressStatus.PLAYING,
        nextCheckInAllowedAt: null,
      }),
    })
  })

  it('cancels an active station back to available with a cooldown deadline', async () => {
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
    }
    const cancelledProgress = {
      ...activeProgress,
      status: ProgressStatus.AVAILABLE,
      checkedInAt: null,
      cancelledAt: new Date(),
      nextCheckInAllowedAt: new Date(Date.now() + 5 * 60_000),
    }

    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)
    mockEventConfig.getConfig.mockResolvedValue({ cancelCooldownMinutes: 5 })
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(cancelledProgress)

    await expect(service.cancel(2, 'ST002')).resolves.toEqual(cancelledProgress)

    expect(mockPrisma.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: progress.id }),
      data: expect.objectContaining({
        status: ProgressStatus.AVAILABLE,
        checkedInAt: null,
        checkedOutAt: null,
        cancelledAt: expect.any(Date),
        nextCheckInAllowedAt: expect.any(Date),
      }),
    })
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: ActorType.TEAM,
        actorId: 2,
        action: 'CANCEL_STATION',
      }),
    )
  })

  it('allows check-out after eventEndTime for a station already in progress', async () => {
    mockEventConfig.isPastEventEnd.mockResolvedValue(true)
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
    }
    const checkedOut = {
      ...activeProgress,
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
    }
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 2,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_OUT,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(checkedOut)

    await expect(
      service.checkOut(2, 'ST002', { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(checkedOut)

    expect(mockPrisma.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: progress.id }),
      data: { checkedOutAt: expect.any(Date) },
    })
  })

  it('checks out an active station and leaves score submission pending', async () => {
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
    }
    const checkedOut = {
      ...activeProgress,
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
    }
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 2,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_OUT,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(checkedOut)

    await expect(
      service.checkOut(2, 'ST002', { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(checkedOut)

    expect(mockPrisma.qrToken.findUnique).toHaveBeenCalledWith({
      where: { tokenFingerprint: expect.any(String) },
      include: { station: true },
    })
    expect(mockPrisma.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: progress.id }),
      data: { checkedOutAt: expect.any(Date) },
    })
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CHECK_OUT' }),
    )
  })

  it('runs a unified QR action for score-required check-out', async () => {
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
    }
    const checkedOut = {
      ...activeProgress,
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
    }
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 2,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_OUT,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(checkedOut)

    await expect(
      service.qrAction(2, { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual({
      action: 'CHECK_OUT',
      stationId: 'ST002',
      requiresScore: true,
      progress: checkedOut,
    })
  })

  it('keeps duplicate completed check-out idempotent', async () => {
    const completedProgress = {
      ...progress,
      status: ProgressStatus.COMPLETED,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
      completedAt: new Date('2026-07-19T01:11:00.000Z'),
      scoreAchieved: 10,
    }
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 2,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_OUT,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(completedProgress)

    await expect(
      service.checkOut(2, 'ST002', { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(completedProgress)

    expect(mockPrisma.teamStationProgress.updateMany).not.toHaveBeenCalled()
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('uses the accepted scan time as check-out time for score-only stations', async () => {
    const checkedInAt = new Date('2026-07-19T01:00:00.000Z')
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt,
      station: { trackingMode: StationTrackingMode.SCORE },
    }
    const checkedOut = {
      ...activeProgress,
      checkedOutAt: checkedInAt,
    }
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 2,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_OUT,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(checkedOut)

    await expect(
      service.checkOut(2, 'ST002', { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(checkedOut)

    expect(mockPrisma.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: progress.id }),
      data: { checkedOutAt: expect.any(Date) },
    })
    expect(mockPrisma.teamStationProgress.updateMany.mock.calls[0][0].data.checkedOutAt).not.toBe(
      checkedInAt,
    )
  })

  it('auto-completes time-only stations on check-out and increments play time', async () => {
    const checkedInAt = new Date('2026-07-19T01:00:00.000Z')
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt,
      station: { trackingMode: StationTrackingMode.TIME },
      team: { totalPoints: 12 },
    }
    const completed = {
      ...activeProgress,
      status: ProgressStatus.COMPLETED,
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
      completedAt: new Date('2026-07-19T01:10:00.000Z'),
      scoreAchieved: 0,
    }
    const tx = {
      teamStationProgress: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(completed),
      },
      team: { update: jest.fn() },
      scoreEvent: { create: jest.fn() },
    }
    mockPrisma.qrToken.findUnique.mockResolvedValue({
      id: 2,
      stationId: 'ST002',
      tokenHash: 'hashed-qr-token',
      tokenFingerprint: 'fingerprint',
      purpose: QrPurpose.CHECK_OUT,
      isActive: true,
      revokedAt: null,
      expiresAt: null,
      station: { isActive: true },
    })
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)
    mockPrisma.$transaction.mockImplementation((callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    )

    await expect(
      service.checkOut(2, 'ST002', { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(completed)

    expect(tx.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: {
        id: progress.id,
        checkedOutAt: null,
        completedAt: null,
        status: { in: [ProgressStatus.PLAYING, ProgressStatus.CHECKED_IN] },
      },
      data: expect.objectContaining({
        status: ProgressStatus.COMPLETED,
        scoreAchieved: 10,
        completedAt: expect.any(Date),
      }),
    })
    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        totalPoints: { increment: 10 },
        totalPlaySeconds: { increment: expect.any(Number) },
      },
    })
    expect(tx.scoreEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scoreBefore: 12,
        scoreAfter: 22,
        delta: 10,
        reason: 'TIME_STATION_AUTO_SCORE',
      }),
    })
  })

  it('submits score after check-out without a confirmation code', async () => {
    const checkedOutAt = new Date('2026-07-19T01:10:00.000Z')
    const checkedInAt = new Date('2026-07-19T01:00:00.000Z')
    const scoreProgress = {
      ...progress,
      checkedInAt,
      checkedOutAt,
      team: { totalPoints: 12 },
      game: { maxPoints: 50 },
    }
    const completed = {
      ...scoreProgress,
      status: ProgressStatus.COMPLETED,
      completedAt: new Date('2026-07-19T01:12:00.000Z'),
      scoreAchieved: 40,
    }
    const tx = {
      teamStationProgress: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(completed),
      },
      team: { update: jest.fn() },
      scoreEvent: { create: jest.fn() },
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(scoreProgress)
    mockPrisma.$transaction.mockImplementation((callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    )

    await expect(
      service.submitScore(2, 'ST002', {
        score: 40,
        reason: 'staff scored',
      }),
    ).resolves.toEqual(completed)

    expect(tx.teamStationProgress.updateMany).toHaveBeenCalledWith({
      where: { id: progress.id, completedAt: null, checkedOutAt: { not: null } },
      data: expect.objectContaining({
        status: ProgressStatus.COMPLETED,
        scoreAchieved: 40,
      }),
    })
    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        totalPoints: { increment: 40 },
        totalPlaySeconds: { increment: 600 },
      },
    })
    expect(tx.scoreEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scoreBefore: 12,
        scoreAfter: 52,
        delta: 40,
        reason: 'staff scored',
      }),
    })
  })

  it('keeps score-only stations at zero play seconds after real check-out time', async () => {
    const checkedOutAt = new Date('2026-07-19T01:10:00.000Z')
    const checkedInAt = new Date('2026-07-19T01:00:00.000Z')
    const scoreProgress = {
      ...progress,
      checkedInAt,
      checkedOutAt,
      station: { trackingMode: StationTrackingMode.SCORE },
      team: { totalPoints: 12 },
      game: { maxPoints: 50 },
    }
    const completed = {
      ...scoreProgress,
      status: ProgressStatus.COMPLETED,
      completedAt: new Date('2026-07-19T01:12:00.000Z'),
      scoreAchieved: 40,
    }
    const tx = {
      teamStationProgress: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(completed),
      },
      team: { update: jest.fn() },
      scoreEvent: { create: jest.fn() },
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(scoreProgress)
    mockPrisma.$transaction.mockImplementation((callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    )

    await service.submitScore(2, 'ST002', { score: 40 })

    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        totalPoints: { increment: 40 },
        totalPlaySeconds: { increment: 0 },
      },
    })
  })

  it('rejects score values above the station maximum', async () => {
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue({
      ...progress,
      checkedOutAt: new Date(),
      team: { totalPoints: 0 },
      game: { maxPoints: 50 },
    })

    await expect(
      service.submitScore(2, 'ST002', {
        score: 51,
      }),
    ).rejects.toThrow(PlayerActionException)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('accepts score 0 and the exact station maximum', async () => {
    const checkedOutAt = new Date('2026-07-19T01:10:00.000Z')
    const checkedInAt = new Date('2026-07-19T01:00:00.000Z')
    const scoreProgress = {
      ...progress,
      checkedInAt,
      checkedOutAt,
      team: { totalPoints: 12 },
      game: { maxPoints: 30 },
    }
    const tx = {
      teamStationProgress: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...scoreProgress,
          status: ProgressStatus.COMPLETED,
          completedAt: new Date(),
        }),
      },
      team: { update: jest.fn() },
      scoreEvent: { create: jest.fn() },
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(scoreProgress)
    mockPrisma.$transaction.mockImplementation((callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    )

    await expect(
      service.submitScore(2, 'ST002', { score: 0 }),
    ).resolves.toBeDefined()
    await expect(
      service.submitScore(2, 'ST002', { score: 30 }),
    ).resolves.toBeDefined()

    expect(tx.teamStationProgress.updateMany).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['negative', -1],
    ['decimal', 10.5],
  ])('rejects %s score values in the backend service', async (_label, score) => {
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue({
      ...progress,
      checkedOutAt: new Date(),
      team: { totalPoints: 0 },
      game: { maxPoints: 50 },
    })

    await expect(
      service.submitScore(2, 'ST002', {
        score,
      }),
    ).rejects.toThrow(PlayerActionException)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects score submission before check-out', async () => {
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue({
      ...progress,
      checkedOutAt: null,
      team: { totalPoints: 0 },
      game: { maxPoints: 50 },
    })

    await expect(
      service.submitScore(2, 'ST002', {
        score: 10,
      }),
    ).rejects.toThrow(PlayerActionException)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects score submission for time-only stations', async () => {
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue({
      ...progress,
      checkedOutAt: new Date(),
      station: { trackingMode: StationTrackingMode.TIME },
      team: { totalPoints: 0 },
      game: { maxPoints: 50 },
    })

    await expect(
      service.submitScore(2, 'ST002', {
        score: 10,
      }),
    ).rejects.toThrow(PlayerActionException)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('keeps a concurrent duplicate score idempotent and applies totals once', async () => {
    const scoreProgress = {
      ...progress,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
      team: { totalPoints: 0 },
      game: { maxPoints: 50 },
    }
    const tx = {
      teamStationProgress: {
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...scoreProgress,
          status: ProgressStatus.COMPLETED,
          completedAt: new Date(),
          scoreAchieved: 10,
        }),
      },
      team: { update: jest.fn() },
      scoreEvent: { create: jest.fn() },
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(scoreProgress)
    mockPrisma.$transaction.mockImplementation((callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    )

    const results = await Promise.allSettled([
      service.submitScore(2, 'ST002', { score: 10 }),
      service.submitScore(2, 'ST002', { score: 10 }),
    ])

    expect(results.filter((item) => item.status === 'fulfilled')).toHaveLength(2)
    expect(results.filter((item) => item.status === 'rejected')).toHaveLength(0)
    expect(tx.team.update).toHaveBeenCalledTimes(1)
    expect(tx.scoreEvent.create).toHaveBeenCalledTimes(1)
    expect(mockActivityLog.log).toHaveBeenCalledTimes(1)
  })

  it('returns a localized minimal catalog and invalidates its version on image changes', async () => {
    const stationUpdatedAt = new Date('2026-07-29T01:00:00.000Z')
    const gameUpdatedAt = new Date('2026-07-29T01:01:00.000Z')
    const firstImageUpdatedAt = new Date('2026-07-29T01:02:00.000Z')
    const catalogRow = {
      id: 'ST001',
      name: 'Tên VI',
      nameEn: 'English name',
      description: 'Mô tả VI',
      descriptionEn: '',
      mapX: 10,
      mapY: 20,
      trackingMode: StationTrackingMode.BOTH,
      updatedAt: stationUpdatedAt,
      images: [{ id: 1, updatedAt: firstImageUpdatedAt }],
      games: [
        {
          id: 7,
          title: 'Game',
          type: 'STANDARD',
          difficulty: 1,
          maxPoints: 30,
          clueText: null,
          mediaUrl: 'https://cdn.example.com/game.webp',
          updatedAt: gameUpdatedAt,
        },
      ],
    }
    mockPrisma.station.findMany
      .mockResolvedValueOnce([catalogRow])
      .mockResolvedValueOnce([
        {
          ...catalogRow,
          images: [
            { id: 1, updatedAt: new Date('2026-07-29T01:03:00.000Z') },
          ],
        },
      ])

    const first = await service.getCatalog('en')
    const second = await service.getCatalog('en')

    expect(first.stations).toEqual([
      {
        id: 'ST001',
        name: 'English name',
        description: 'Mô tả VI',
        mapX: 10,
        mapY: 20,
        trackingMode: StationTrackingMode.BOTH,
        imageCount: 1,
        game: {
          id: '7',
          title: 'Game',
          type: 'STANDARD',
          difficulty: 1,
          maxPoints: 30,
          clueText: null,
          mediaUrl: 'https://cdn.example.com/game.webp',
        },
      },
    ])
    expect(first.catalogVersion).toHaveLength(64)
    expect(second.catalogVersion).not.toBe(first.catalogVersion)
    expect(JSON.stringify(first)).not.toContain('imageUrls')
    expect(mockPrisma.station.findMany.mock.calls[0][0].select.images.select).toEqual({
      id: true,
      updatedAt: true,
    })
  })

  it('returns authoritative Team totals and minimal state without the export projection', async () => {
    mockPrisma.team.findUniqueOrThrow.mockResolvedValue({
      id: 2,
      name: 'Team 2',
      username: 'team02',
      captainName: 'Captain',
      totalPoints: 75,
      maxPossiblePoints: 510,
      totalPlaySeconds: 600,
      status: 'ACTIVE',
      color: '#123456',
      progress: [
        {
          id: 11,
          teamId: 2,
          stationId: 'ST001',
          status: ProgressStatus.COMPLETED,
          checkedInAt: new Date('2026-07-29T01:00:00.000Z'),
          checkedOutAt: new Date('2026-07-29T01:10:00.000Z'),
          completedAt: new Date('2026-07-29T01:11:00.000Z'),
          cancelledAt: null,
          nextCheckInAllowedAt: null,
          scoreAchieved: 30,
          attemptNo: 1,
        },
      ],
    })
    mockEventConfig.getPublicConfig.mockResolvedValue({
      eventEndTime: '11:30',
      finalStartsAt: '11:45',
      isPastEventEnd: false,
      isPastFinalStart: true,
    })
    mockPrisma.station.findMany.mockResolvedValue([])
    mockTeamResults.getLeanLeaderboard.mockResolvedValue([
      {
        rank: 3,
        teamId: 2,
        teamName: 'Team 2',
        totalPoints: 75,
        completedStations: 1,
        totalPlaySeconds: 600,
      },
    ])
    mockPrisma.finalChallenge.findFirst.mockResolvedValue({ id: 9 })
    mockPrisma.finalSubmission.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    mockPrisma.finalSubmission.count.mockResolvedValue(0)

    const state = await service.getState(2)

    expect(state.team).toEqual(
      expect.objectContaining({
        id: 2,
        totalPoints: 75,
        totalPlaySeconds: 600,
        rank: 3,
      }),
    )
    expect(state.completedStations).toBe(1)
    expect(state.progress[0]).toEqual(
      expect.objectContaining({
        stationId: 'ST001',
        scoreAchieved: 30,
      }),
    )
    expect(state.final).toEqual(
      expect.objectContaining({ isOpen: true, canSubmit: true }),
    )
    expect(mockTeamResults.getRankedTeamResults).not.toHaveBeenCalled()
    expect(mockTeamResults.toLeaderboardRows).not.toHaveBeenCalled()
  })

  it('maps a concurrent different-Station check-in to a stable 409 conflict', async () => {
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(progress)
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue(null)
    mockPrisma.teamStationProgress.updateMany.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('unique conflict', {
        code: 'P2002',
        clientVersion: '6.19.0',
      }),
    )

    const error = (await service
      .checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' })
      .catch((value: unknown) => value)) as PlayerActionException

    expect(error.getStatus()).toBe(HttpStatus.CONFLICT)
    expect(error.getResponse()).toEqual(
      expect.objectContaining({ code: PLAYER_ERROR_CODES.activeStationConflict }),
    )
    expect(mockActivityLog.log).not.toHaveBeenCalled()
  })

  it('does not cancel or log when check-out wins the transition race', async () => {
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt: new Date('2026-07-29T01:00:00.000Z'),
    }
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue(activeProgress)
    mockEventConfig.getConfig.mockResolvedValue({ cancelCooldownMinutes: 5 })
    mockPrisma.teamStationProgress.updateMany.mockResolvedValueOnce({ count: 0 })
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue({
      ...activeProgress,
      checkedOutAt: new Date('2026-07-29T01:10:00.000Z'),
    })

    const error = (await service
      .cancel(2, 'ST002')
      .catch((value: unknown) => value)) as PlayerActionException

    expect(error.getStatus()).toBe(HttpStatus.CONFLICT)
    expect(error.getResponse()).toEqual(
      expect.objectContaining({ code: PLAYER_ERROR_CODES.cancelConflict }),
    )
    expect(mockActivityLog.log).not.toHaveBeenCalled()
  })
})
