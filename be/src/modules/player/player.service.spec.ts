import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { ActorType, ProgressStatus, QrPurpose, StationTrackingMode } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { PlayerService } from './player.service'

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
  qrToken: { findUnique: jest.fn() },
  teamStationProgress: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  team: { update: jest.fn() },
  scoreEvent: { create: jest.fn() },
  $transaction: jest.fn(),
}

const mockEventConfig = {
  isPastEventEnd: jest.fn(),
  getConfig: jest.fn(),
}

const mockActivityLog = {
  log: jest.fn(),
}

describe('PlayerService station flow', () => {
  let service: PlayerService

  beforeEach(() => {
    service = new PlayerService(
      mockPrisma as never,
      mockEventConfig as never,
      mockActivityLog as never,
    )
    jest.clearAllMocks()
    mockEventConfig.isPastEventEnd.mockResolvedValue(false)
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
    mockPrisma.teamStationProgress.update.mockResolvedValue(updated)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(updated)

    expect(mockPrisma.qrToken.findUnique).toHaveBeenCalledWith({
      where: { tokenFingerprint: expect.any(String) },
      include: { station: true },
    })
    expect(mockPrisma.teamStationProgress.update).toHaveBeenCalledWith({
      where: { id: progress.id },
      data: expect.objectContaining({
        status: ProgressStatus.PLAYING,
        checkedInAt: expect.any(Date),
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

  it('rejects check-in when the QR token is invalid', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'wrong-token' }),
    ).rejects.toThrow(ForbiddenException)
    expect(mockPrisma.teamStationProgress.update).not.toHaveBeenCalled()
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
    ).rejects.toThrow(ForbiddenException)
    expect(mockPrisma.teamStationProgress.update).not.toHaveBeenCalled()
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
    ).rejects.toThrow(ForbiddenException)
    expect(mockPrisma.teamStationProgress.update).not.toHaveBeenCalled()
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
    mockPrisma.teamStationProgress.update.mockResolvedValue(updated)

    await expect(
      service.checkIn(2, 'ST002', { qrToken: 'MV26-STATION-ST002-CHECK_IN' }),
    ).resolves.toEqual(updated)
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
    mockPrisma.teamStationProgress.update.mockResolvedValue(checkedOut)

    await expect(
      service.checkOut(2, 'ST002', { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(checkedOut)

    expect(mockPrisma.qrToken.findUnique).toHaveBeenCalledWith({
      where: { tokenFingerprint: expect.any(String) },
      include: { station: true },
    })
    expect(mockPrisma.teamStationProgress.update).toHaveBeenCalledWith({
      where: { id: progress.id },
      data: { checkedOutAt: expect.any(Date) },
    })
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CHECK_OUT' }),
    )
  })

  it('uses the check-in time as check-out time for score-only stations', async () => {
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
    mockPrisma.teamStationProgress.update.mockResolvedValue(checkedOut)

    await expect(
      service.checkOut(2, 'ST002', { qrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXY2' }),
    ).resolves.toEqual(checkedOut)

    expect(mockPrisma.teamStationProgress.update).toHaveBeenCalledWith({
      where: { id: progress.id },
      data: { checkedOutAt: checkedInAt },
    })
  })

  it('auto-completes time-only stations on check-out and increments play time', async () => {
    const checkedInAt = new Date('2026-07-19T01:00:00.000Z')
    const activeProgress = {
      ...progress,
      status: ProgressStatus.PLAYING,
      checkedInAt,
      station: { trackingMode: StationTrackingMode.TIME },
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
        update: jest.fn().mockResolvedValue(completed),
      },
      team: { update: jest.fn() },
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

    expect(tx.teamStationProgress.update).toHaveBeenCalledWith({
      where: { id: progress.id },
      data: expect.objectContaining({
        status: ProgressStatus.COMPLETED,
        scoreAchieved: 0,
        completedAt: expect.any(Date),
      }),
    })
    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        totalPlaySeconds: { increment: expect.any(Number) },
      },
    })
  })

  it('submits score only after check-out and with the confirmation code', async () => {
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
    mockEventConfig.getConfig.mockResolvedValue({ scoringCodeHash: 'hash' })
    mockPrisma.$transaction.mockImplementation((callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    )

    await expect(
      service.submitScore(2, 'ST002', {
        score: 40,
        confirmationCode: '2468',
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

  it('rejects score submission with an invalid confirmation code', async () => {
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue({
      ...progress,
      checkedOutAt: new Date(),
      team: { totalPoints: 0 },
      game: { maxPoints: 50 },
    })
    mockEventConfig.getConfig.mockResolvedValue({ scoringCodeHash: 'hash' })
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false)

    await expect(
      service.submitScore(2, 'ST002', {
        score: 10,
        confirmationCode: 'wrong',
      }),
    ).rejects.toThrow(ForbiddenException)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects score values above the station maximum', async () => {
    mockPrisma.teamStationProgress.findUnique.mockResolvedValue({
      ...progress,
      checkedOutAt: new Date(),
      team: { totalPoints: 0 },
      game: { maxPoints: 50 },
    })
    mockEventConfig.getConfig.mockResolvedValue({ scoringCodeHash: 'hash' })

    await expect(
      service.submitScore(2, 'ST002', {
        score: 51,
        confirmationCode: '2468',
      }),
    ).rejects.toThrow(BadRequestException)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })
})
