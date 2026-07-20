import { FinalService } from './final.service'
import * as bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

const challenge = {
  id: 1,
  title: 'Final',
  clueText: 'Solve it',
  startsAt: new Date('2020-01-01T00:00:00.000Z'),
  maxWinners: 2,
  pointsByRank: [20, 10],
  isActive: true,
  answerHash: 'hash',
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
  finalChallenge: { findFirst: jest.fn() },
  finalSubmission: { findFirst: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(),
}

const mockActivityLog = { log: jest.fn() }

describe('FinalService', () => {
  let service: FinalService

  beforeEach(() => {
    service = new FinalService(mockPrisma as never, mockActivityLog as never)
    jest.clearAllMocks()
    mockPrisma.finalChallenge.findFirst.mockResolvedValue(challenge)
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx),
    )
  })

  it('awards the next available rank once for a correct submission', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
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
      pointsAwarded: 20,
      submittedAt: new Date(),
      scoreEventId: 9,
    })

    const result = await service.submitFinal(4, { answer: '  ANSWER  ' })

    expect(mockTx.scoreEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: 4,
          scoreBefore: 50,
          scoreAfter: 70,
          delta: 20,
          reason: 'Final rank 1',
        }),
      }),
    )
    expect(mockTx.team.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { totalPoints: { increment: 20 } },
    })
    expect(result).toMatchObject({ winnerRank: 1, pointsAwarded: 20 })
  })

  it('returns the prior correct submission without awarding points again', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
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

    const result = await service.submitFinal(4, { answer: 'answer' })

    expect(mockTx.finalSubmission.count).not.toHaveBeenCalled()
    expect(mockTx.scoreEvent.create).not.toHaveBeenCalled()
    expect(mockTx.team.update).not.toHaveBeenCalled()
    expect(result).toEqual(previousSubmission)
  })

  it('retries a serializable transaction conflict before awarding final points', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
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
      pointsAwarded: 10,
      submittedAt: new Date(),
      scoreEventId: 10,
    })

    const result = await service.submitFinal(5, { answer: 'answer' })

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({ winnerRank: 2, pointsAwarded: 10 })
  })

  it('does not retry non-retryable transaction failures', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
    const failure = new Error('database is unavailable')
    mockPrisma.$transaction.mockRejectedValueOnce(failure)

    await expect(service.submitFinal(5, { answer: 'answer' })).rejects.toThrow(
      'database is unavailable',
    )
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    expect(mockActivityLog.log).not.toHaveBeenCalled()
  })
})
