import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FinalService } from './final.service'
import { Prisma } from '@prisma/client'

const challenge = {
  id: 1,
  title: 'Final',
  clueText: 'Solve it',
  startsAt: new Date('2020-01-01T00:00:00.000Z'),
  maxWinners: 2,
  pointsByRank: [20, 10],
  isActive: true,
  answerHash: 'DISANVANHOA2026',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockTx = {
  finalSubmission: {
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  team: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
  scoreEvent: {
    create: jest.fn(),
  },
}

const mockPrisma = {
  finalChallenge: { findFirst: jest.fn(), update: jest.fn() },
  finalSubmission: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  teamStationProgress: { findFirst: jest.fn() },
  $transaction: jest.fn(),
}

const mockActivityLog = { log: jest.fn() }
const mockEventConfig = {
  getPublicConfig: jest.fn(),
  isPastEventEnd: jest.fn(),
}

describe('FinalService', () => {
  let service: FinalService

  beforeEach(() => {
    service = new FinalService(
      mockPrisma as never,
      mockActivityLog as never,
      mockEventConfig as never,
    )
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockPrisma.finalChallenge.findFirst.mockResolvedValue(challenge)
    mockPrisma.finalSubmission.findFirst.mockResolvedValue(null)
    mockPrisma.finalSubmission.count.mockResolvedValue(0)
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue(null)
    mockTx.finalSubmission.findFirst.mockResolvedValue(null)
    mockTx.finalSubmission.count.mockResolvedValue(0)
    mockTx.finalSubmission.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 7,
        submittedAt: new Date(),
        ...data,
      }),
    )
    mockTx.team.findUniqueOrThrow.mockResolvedValue({ totalPoints: 0 })
    mockTx.team.update.mockResolvedValue({})
    mockTx.scoreEvent.create.mockResolvedValue({ id: 9 })
    mockEventConfig.getPublicConfig.mockResolvedValue({
      eventEndTime: '23:59',
      finalStartsAt: '23:59',
      notifyBeforeMinutes: 15,
      cancelCooldownMinutes: 5,
      timezone: 'Asia/Ho_Chi_Minh',
      serverNow: new Date().toISOString(),
      isPastEventEnd: true,
    })
    mockEventConfig.isPastEventEnd.mockResolvedValue(true)
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx),
    )
  })

  it('does not use bcrypt or crypto hashing in the Final Challenge service flow', () => {
    const serviceSource = readFileSync(join(__dirname, 'final.service.ts'), 'utf8')

    expect(serviceSource).not.toMatch(/bcrypt|crypto|createHash|digest|hashAnswer|compareHash/i)
  })

  it('returns the current keyword only from the admin final config response', async () => {
    const result = await service.getFinalConfig()

    expect(result).toMatchObject({
      title: 'Final',
      clueText: 'Solve it',
      currentKeyword: 'DISANVANHOA2026',
    })
    expect(result).not.toHaveProperty('answerHash')
  })

  it('does not return the keyword from the player final response', async () => {
    const result = await service.getPlayerFinal(4)

    expect(result).not.toHaveProperty('currentKeyword')
    expect(result).not.toHaveProperty('answerHash')
    expect(result).toMatchObject({
      title: 'Final',
      clueText: 'Solve it',
    })
  })

  it('preserves the current keyword when updating final config without a new answer', async () => {
    mockPrisma.finalChallenge.update = jest.fn().mockResolvedValue({
      ...challenge,
      title: 'Updated Final',
      clueText: 'Updated clue',
    })
    mockEventConfig.isPastEventEnd.mockResolvedValue(false)

    const result = await service.updateFinalConfig(1, {
      title: 'Updated Final',
      clueText: 'Updated clue',
    })

    expect(mockPrisma.finalChallenge.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        title: 'Updated Final',
        clueText: 'Updated clue',
        isActive: undefined,
        answerHash: undefined,
      },
    })
    expect(result).toMatchObject({
      title: 'Updated Final',
      clueText: 'Updated clue',
      currentKeyword: 'DISANVANHOA2026',
    })
  })

  it('normalizes and returns a new admin keyword after final config update', async () => {
    mockPrisma.finalChallenge.update = jest.fn().mockResolvedValue({
      ...challenge,
      answerHash: 'NEW KEYWORD',
    })
    mockEventConfig.isPastEventEnd.mockResolvedValue(false)

    const result = await service.updateFinalConfig(1, { answer: '  new   keyword  ' })

    expect(mockPrisma.finalChallenge.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        title: undefined,
        clueText: undefined,
        isActive: undefined,
        answerHash: 'NEW KEYWORD',
      },
    })
    expect(result).toMatchObject({ currentKeyword: 'NEW KEYWORD' })
  })

  it('awards the next available rank with the fixed final bonus formula', async () => {
    mockTx.finalSubmission.findFirst.mockResolvedValue(null)
    mockTx.finalSubmission.count.mockResolvedValue(0)
    mockTx.team.findUniqueOrThrow.mockResolvedValue({ totalPoints: 50 })
    mockTx.scoreEvent.create.mockResolvedValue({ id: 9 })
    mockTx.finalSubmission.create.mockResolvedValue({
      id: 7,
      finalChallengeId: 1,
      teamId: 4,
      isCorrect: true,
      winnerRank: 1,
      pointsAwarded: 10,
      submittedAt: new Date(),
      scoreEventId: 9,
    })

    const result = await service.submitFinal(4, { answer: '  DISANVANHOA2026  ' })

    expect(mockTx.scoreEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: 4,
          scoreBefore: 50,
          scoreAfter: 60,
          delta: 10,
          reason: 'Final rank 1',
        }),
      }),
    )
    expect(mockTx.team.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { totalPoints: { increment: 10 } },
    })
    expect(result).toMatchObject({ winnerRank: 1, pointsAwarded: 10 })
  })

  it('returns the prior correct submission without awarding points again', async () => {
    const previousSubmission = {
      id: 6,
      finalChallengeId: 1,
      teamId: 4,
      isCorrect: true,
      winnerRank: 1,
      pointsAwarded: 20,
      submittedAt: new Date(),
      scoreEventId: 8,
    }
    mockTx.finalSubmission.findFirst.mockResolvedValue(previousSubmission)

    const result = await service.submitFinal(4, { answer: 'wrong' })

    expect(mockTx.finalSubmission.count).not.toHaveBeenCalled()
    expect(mockTx.scoreEvent.create).not.toHaveBeenCalled()
    expect(mockTx.team.update).not.toHaveBeenCalled()
    expect(result).toEqual(previousSubmission)
  })

  it('retries a serializable transaction conflict before awarding final points', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'Transaction conflict',
      { code: 'P2034', clientVersion: 'test' },
    )
    mockPrisma.$transaction
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce((callback: (tx: typeof mockTx) => unknown) =>
        callback(mockTx),
      )
    mockTx.finalSubmission.findFirst.mockResolvedValue(null)
    mockTx.finalSubmission.count.mockResolvedValue(1)
    mockTx.team.findUniqueOrThrow.mockResolvedValue({ totalPoints: 30 })
    mockTx.scoreEvent.create.mockResolvedValue({ id: 10 })
    mockTx.finalSubmission.create.mockResolvedValue({
      id: 8,
      finalChallengeId: 1,
      teamId: 5,
      isCorrect: true,
      winnerRank: 2,
      pointsAwarded: 9,
      submittedAt: new Date(),
      scoreEventId: 10,
    })

    const result = await service.submitFinal(5, { answer: 'DISANVANHOA2026' })

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({ winnerRank: 2, pointsAwarded: 9 })
  })

  it('does not open final before event end', async () => {
    mockEventConfig.getPublicConfig.mockResolvedValue({
      eventEndTime: '23:58',
      finalStartsAt: '23:58',
      notifyBeforeMinutes: 15,
      cancelCooldownMinutes: 5,
      timezone: 'Asia/Ho_Chi_Minh',
      serverNow: new Date().toISOString(),
      isPastEventEnd: false,
    })
    mockPrisma.finalSubmission.count = jest.fn().mockResolvedValue(0)

    const result = await service.getPlayerFinal(4)

    expect(result).toMatchObject({
      isOpen: false,
      canSubmit: false,
      clueText: null,
    })
  })

  it('opens final at the configured event end when the team has no active station', async () => {
    mockEventConfig.getPublicConfig.mockResolvedValue({
      eventEndTime: '09:15',
      finalStartsAt: '23:59',
      notifyBeforeMinutes: 15,
      cancelCooldownMinutes: 5,
      timezone: 'Asia/Ho_Chi_Minh',
      serverNow: new Date().toISOString(),
      isPastEventEnd: true,
    })

    const result = await service.getPlayerFinal(4)

    expect(result).toMatchObject({
      isOpen: true,
      canSubmit: true,
      eventEndTime: '09:15',
      blockedByActiveStation: false,
    })
    expect(mockPrisma.teamStationProgress.findFirst).toHaveBeenCalledWith({
      where: {
        teamId: 4,
        status: { in: ['CHECKED_IN', 'PLAYING'] },
      },
      select: { id: true, stationId: true },
    })
  })

  it('blocks final submission while the team has an active station', async () => {
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue({
      id: 12,
      stationId: 'ST15A',
    })

    await expect(service.submitFinal(4, { answer: 'DISANVANHOA2026' })).rejects.toThrow(
      'Finish the active station before entering Final Challenge',
    )
  })

  it('allows final when stations are unfinished but none is active', async () => {
    mockPrisma.teamStationProgress.findFirst.mockResolvedValue(null)

    await expect(service.submitFinal(4, { answer: 'DISANVANHOA2026' })).resolves.toMatchObject({
      isCorrect: true,
    })

    expect(mockPrisma.teamStationProgress.findFirst).toHaveBeenCalledWith({
      where: {
        teamId: 4,
        status: { in: ['CHECKED_IN', 'PLAYING'] },
      },
      select: { id: true, stationId: true },
    })
  })

  it.each([
    ['lowercase', 'disanvanhoa2026'],
    ['mixed-case', 'DiSanVanHoa2026'],
    ['surrounding whitespace', '  DISANVANHOA2026  '],
  ])('normalizes %s answers before backend validation', async (_label, answer) => {
    await expect(service.submitFinal(4, { answer })).resolves.toMatchObject({
      isCorrect: true,
    })
  })

  it('records a wrong answer without awarding rank or points', async () => {

    const result = await service.submitFinal(4, { answer: 'wrong' })

    expect(result).toMatchObject({
      isCorrect: false,
      winnerRank: null,
      pointsAwarded: 0,
      scoreEventId: null,
    })
    expect(result).not.toHaveProperty('currentKeyword')
    expect(result).not.toHaveProperty('answerHash')
    expect(JSON.stringify(result)).not.toContain('DISANVANHOA2026')
    expect(mockTx.scoreEvent.create).not.toHaveBeenCalled()
    expect(mockTx.team.update).not.toHaveBeenCalled()
  })

  it('blocks submission during wrong-answer cooldown', async () => {
    const submittedAt = new Date(Date.now() - 500)
    mockTx.finalSubmission.count.mockResolvedValue(1)
    mockTx.finalSubmission.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ submittedAt })

    await expect(service.submitFinal(4, { answer: 'DISANVANHOA2026' })).rejects.toThrow(
      'Final answer cooldown is active',
    )
  })

  it('caps wrong-answer cooldown at ten seconds', async () => {
    const submittedAt = new Date()
    mockPrisma.finalSubmission.count.mockResolvedValue(25)
    mockPrisma.finalSubmission.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ submittedAt })

    const result = await service.getPlayerFinal(4)

    expect(result.cooldownSeconds).toBe(10)
    expect(result.canSubmit).toBe(false)
  })

  it.each([
    [10, 1],
    [11, 0],
  ])('awards %i rank with %i final bonus points', async (rank, points) => {
    mockTx.finalSubmission.count.mockResolvedValue(rank - 1)
    mockTx.team.findUniqueOrThrow.mockResolvedValue({ totalPoints: 50 })

    const result = await service.submitFinal(rank + 10, { answer: 'DISANVANHOA2026' })

    expect(result).toMatchObject({ winnerRank: rank, pointsAwarded: points })
    if (points > 0) {
      expect(mockTx.scoreEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          delta: points,
          reason: `Final rank ${rank}`,
        }),
      })
    } else {
      expect(mockTx.scoreEvent.create).not.toHaveBeenCalled()
      expect(mockTx.team.update).not.toHaveBeenCalled()
    }
  })

  it('rechecks wrong-answer cooldown after a serializable transaction retry', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'Transaction conflict',
      { code: 'P2034', clientVersion: 'test' },
    )
    mockPrisma.$transaction
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce((callback: (tx: typeof mockTx) => unknown) =>
        callback(mockTx),
      )
    mockTx.finalSubmission.count.mockResolvedValue(1)
    mockTx.finalSubmission.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ submittedAt: new Date() })

    await expect(service.submitFinal(4, { answer: 'DISANVANHOA2026' })).rejects.toThrow(
      'Final answer cooldown is active',
    )

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2)
    expect(mockTx.finalSubmission.create).not.toHaveBeenCalled()
  })

  it('does not retry non-retryable transaction failures', async () => {
    const failure = new Error('database is unavailable')
    mockPrisma.$transaction.mockRejectedValueOnce(failure)

    await expect(service.submitFinal(5, { answer: 'DISANVANHOA2026' })).rejects.toThrow(
      'database is unavailable',
    )
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    expect(mockActivityLog.log).not.toHaveBeenCalled()
  })
})
