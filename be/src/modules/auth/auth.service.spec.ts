import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { HttpException, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { TeamLoginDto, UserLoginDto } from './dto/login.dto'

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  team: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  qrLoginToken: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  teamSession: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}

const mockJwtService = {
  signAsync: jest.fn(),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)

    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockPrisma) => unknown) =>
      callback(mockPrisma),
    )
  })

  describe('loginUser', () => {
    it('should return accessToken and user when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'admin',
        passwordHash: '$2a$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        role: 'ADMIN',
      })
      mockJwtService.signAsync.mockResolvedValue('token-123')

      const bcrypt = await import('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)

      const result = await service.loginUser({
        username: 'admin',
        password: 'admin123',
      } as UserLoginDto)

      expect(result).toEqual({
        accessToken: 'token-123',
        user: {
          id: 1,
          username: 'admin',
          role: 'ADMIN',
        },
      })
      expect(mockPrisma.activityLog.create).toHaveBeenCalled()
    })

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      await expect(
        service.loginUser({ username: 'admin', password: 'wrong' } as UserLoginDto),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('loginTeam', () => {
    it('should create a session and return team access token when no active session exists', async () => {
      mockPrisma.team.findFirst.mockResolvedValue({
        id: 2,
        username: 'team01',
        passwordHash: '$2a$10$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Team 01',
        captainName: 'Leader',
        totalPoints: 0,
        maxPossiblePoints: 0,
        totalPlaySeconds: 0,
        startedAt: null,
        status: 'ACTIVE',
        color: '#000000',
      })
      mockPrisma.teamSession.findFirst.mockResolvedValue(null)
      mockPrisma.teamSession.create.mockResolvedValue({ id: 'session-1' })
      mockJwtService.signAsync.mockResolvedValue('team-token')
      mockPrisma.teamSession.update.mockResolvedValue({})
      mockPrisma.team.update.mockResolvedValue({})
      mockPrisma.activityLog.create.mockResolvedValue({})

      const bcrypt = await import('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed-token')

      const result = await service.loginTeam({
        username: 'team01',
        password: 'team01',
        deviceLabel: 'web',
      } as TeamLoginDto)

      expect(result).toEqual({
        accessToken: 'team-token',
        team: {
          id: 2,
          username: 'team01',
          name: 'Team 01',
          captainName: 'Leader',
          totalPoints: 0,
          maxPossiblePoints: 0,
          totalPlaySeconds: 0,
          startedAt: null,
          status: 'ACTIVE',
          color: '#000000',
        },
      })
      expect(mockPrisma.teamSession.create).toHaveBeenCalled()
      expect(mockPrisma.team.update).toHaveBeenCalled()
    })

    it('should create a session from a valid team QR token', async () => {
      mockPrisma.team.findFirst.mockResolvedValue({
        id: 2,
        username: 'team01',
        passwordHash: '$2a$10$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        loginQrHash: '$2a$10$cccccccccccccccccccccccccccccccccccccccccc',
        name: 'Team 01',
        captainName: 'Leader',
        totalPoints: 0,
        maxPossiblePoints: 0,
        totalPlaySeconds: 0,
        startedAt: null,
        status: 'ACTIVE',
        color: '#000000',
      })
      mockPrisma.teamSession.findFirst.mockResolvedValue(null)
      mockPrisma.teamSession.create.mockResolvedValue({ id: 'session-qr-1' })
      mockJwtService.signAsync.mockResolvedValue('team-qr-token')
      mockPrisma.teamSession.update.mockResolvedValue({})
      mockPrisma.team.update.mockResolvedValue({})
      mockPrisma.activityLog.create.mockResolvedValue({})

      const bcrypt = await import('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed-token')

      const result = await service.loginTeamWithQr({
        qrToken: ' MV26-TEAM-01-LOGIN ',
        deviceLabel: 'web-qr',
      })

      expect(result.accessToken).toBe('team-qr-token')
      expect(mockPrisma.team.findFirst).toHaveBeenCalledWith({
        where: {
          loginQrFingerprint: expect.any(String),
          status: 'ACTIVE',
        },
      })
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'TEAM',
          actorId: '2',
          action: 'TEAM_QR_LOGIN',
          entityType: 'TEAM',
          entityId: '2',
          metadata: { deviceLabel: 'web-qr' },
        },
      })
    })

    it('should revoke the existing team session and create a new session when login is repeated', async () => {
      mockPrisma.team.findFirst.mockResolvedValue({
        id: 2,
        username: 'team01',
        passwordHash: '$2a$10$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Team 01',
        captainName: 'Leader',
        totalPoints: 0,
        maxPossiblePoints: 0,
        totalPlaySeconds: 0,
        startedAt: null,
        status: 'ACTIVE',
        color: '#000000',
      })
      mockPrisma.teamSession.findFirst.mockResolvedValue({
        id: 'session-existing',
        teamId: 2,
        revokedAt: null,
        deviceLabel: 'phone',
      })
      mockPrisma.teamSession.create.mockResolvedValue({ id: 'session-2' })
      mockJwtService.signAsync.mockResolvedValue('team-token-2')
      mockPrisma.teamSession.update.mockResolvedValue({})
      mockPrisma.teamSession.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.team.update.mockResolvedValue({})
      mockPrisma.activityLog.create.mockResolvedValue({})

      const bcrypt = await import('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed-token-2')

      const result = await service.loginTeam({ username: 'team01', password: 'team01', deviceLabel: 'web' } as TeamLoginDto)

      expect(result).toEqual({
        accessToken: 'team-token-2',
        team: {
          id: 2,
          username: 'team01',
          name: 'Team 01',
          captainName: 'Leader',
          totalPoints: 0,
          maxPossiblePoints: 0,
          totalPlaySeconds: 0,
          startedAt: null,
          status: 'ACTIVE',
          color: '#000000',
        },
      })
      expect(mockPrisma.teamSession.updateMany).toHaveBeenCalledWith({
        where: { teamId: 2, revokedAt: null },
        data: { revokedAt: expect.any(Date), revokeReason: 'REPLACED' },
      })
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'TEAM',
          actorId: '2',
          action: 'TEAM_SESSION_REPLACED',
          entityType: 'TEAM_SESSION',
          entityId: 'session-existing',
          metadata: { previousDeviceLabel: 'phone' },
        },
      })
      expect(mockPrisma.teamSession.create).toHaveBeenCalled()
      expect(mockPrisma.team.update).toHaveBeenCalled()
    })

    it('should revoke an existing team session when QR login is repeated', async () => {
      mockPrisma.team.findFirst.mockResolvedValue({
        id: 2,
        username: 'team01',
        passwordHash: '$2a$10$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        loginQrHash: '$2a$10$cccccccccccccccccccccccccccccccccccccccccc',
        name: 'Team 01',
        captainName: 'Leader',
        totalPoints: 0,
        maxPossiblePoints: 0,
        totalPlaySeconds: 0,
        startedAt: null,
        status: 'ACTIVE',
        color: '#000000',
      })
      mockPrisma.teamSession.findFirst.mockResolvedValue({
        id: 'session-existing',
        teamId: 2,
        revokedAt: null,
        deviceLabel: 'old-phone',
      })
      mockPrisma.teamSession.create.mockResolvedValue({ id: 'session-qr-2' })
      mockJwtService.signAsync.mockResolvedValue('team-qr-token-2')
      mockPrisma.teamSession.update.mockResolvedValue({})
      mockPrisma.teamSession.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.team.update.mockResolvedValue({})
      mockPrisma.activityLog.create.mockResolvedValue({})

      const bcrypt = await import('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed-token-2')

      await service.loginTeamWithQr({
        qrToken: 'MV26-TEAM-01-LOGIN',
        deviceLabel: 'new-phone',
      })

      expect(mockPrisma.teamSession.updateMany).toHaveBeenCalledWith({
        where: { teamId: 2, revokedAt: null },
        data: { revokedAt: expect.any(Date), revokeReason: 'REPLACED' },
      })
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'TEAM',
          actorId: '2',
          action: 'TEAM_SESSION_REPLACED',
          entityType: 'TEAM_SESSION',
          entityId: 'session-existing',
          metadata: { previousDeviceLabel: 'old-phone' },
        },
      })
    })

    it('should reject team login when credentials are invalid', async () => {
      mockPrisma.team.findFirst.mockResolvedValue(null)

      await expect(
        service.loginTeam({ username: 'team01', password: 'wrong', deviceLabel: 'web' } as TeamLoginDto),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should reject team QR login when the token is invalid', async () => {
      mockPrisma.team.findFirst.mockResolvedValue(null)

      await expect(
        service.loginTeamWithQr({ qrToken: 'wrong-token', deviceLabel: 'web-qr' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should reuse an active QR login token and replace the previous team session', async () => {
      const team = {
        id: 2,
        username: 'team01',
        passwordHash: '$2a$10$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Team 01',
        captainName: 'Leader',
        totalPoints: 0,
        maxPossiblePoints: 0,
        totalPlaySeconds: 0,
        startedAt: null,
        status: 'ACTIVE',
        color: '#000000',
      }
      const qrLoginToken = {
        id: 10,
        teamId: 2,
        team,
        expiresAt: new Date(Date.now() + 60_000),
        isActive: true,
        consumedAt: null,
        revokedAt: null,
        usageCount: 0,
        maxUsageCount: 1,
      }
      mockPrisma.qrLoginToken.findUnique.mockResolvedValue(qrLoginToken)
      mockPrisma.qrLoginToken.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.teamSession.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({id: 'session-qr-url-1', deviceLabel: 'first-device'})
      mockPrisma.teamSession.create.mockResolvedValue({ id: 'session-qr-url-1' })
      mockJwtService.signAsync.mockResolvedValue('team-token-from-qr-url')
      mockPrisma.teamSession.update.mockResolvedValue({})
      mockPrisma.team.update.mockResolvedValue({})
      mockPrisma.activityLog.create.mockResolvedValue({})

      const bcrypt = await import('bcryptjs')
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed-token')

      const result = await service.loginWithQr({
        token: 'opaque-random-qr-login-token',
        deviceLabel: 'web-qr-url',
      })
      const secondResult = await service.loginWithQr({
        token: 'opaque-random-qr-login-token',
        deviceLabel: 'second-device',
      })

      expect(result.accessToken).toBe('team-token-from-qr-url')
      expect(secondResult.accessToken).toBe('team-token-from-qr-url')
      expect(mockPrisma.qrLoginToken.updateMany).toHaveBeenCalledWith({
        where: {
          id: 10,
          isActive: true,
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        data: {
          lastUsedAt: expect.any(Date),
          usageCount: { increment: 1 },
        },
      })
      expect(mockPrisma.qrLoginToken.updateMany).toHaveBeenCalledTimes(2)
      expect(mockPrisma.teamSession.create).toHaveBeenCalledTimes(2)
      expect(mockPrisma.teamSession.updateMany).toHaveBeenCalledWith({
        where: {teamId: 2, revokedAt: null},
        data: {revokedAt: expect.any(Date), revokeReason: 'REPLACED'},
      })
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'TEAM',
          actorId: '2',
          action: 'QR_LOGIN_SUCCESS',
          entityType: 'QR_LOGIN_TOKEN',
          entityId: '10',
          metadata: { deviceLabel: 'web-qr-url' },
        },
      })
    })

    it('should reject an expired one-time QR login token', async () => {
      const token = {
        id: 10,
        teamId: 2,
        team: { id: 2, status: 'ACTIVE' },
        expiresAt: new Date(Date.now() - 60_000),
        isActive: true,
        consumedAt: null,
        revokedAt: null,
        usageCount: 0,
        maxUsageCount: 1,
      }
      mockPrisma.qrLoginToken.findUnique.mockResolvedValue(token)
      mockPrisma.activityLog.create.mockResolvedValue({})

      await expect(
        service.loginWithQr({
          token: 'opaque-random-qr-login-token',
          deviceLabel: 'web-qr-url',
        }),
      ).rejects.toThrow(UnauthorizedException)

      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'TEAM',
          actorId: '2',
          action: 'QR_LOGIN_REJECTED',
          entityType: 'QR_LOGIN_TOKEN',
          entityId: '10',
          metadata: { reason: 'QR_LOGIN_EXPIRED' },
        },
      })
    })

    it('should reject a revoked reusable QR login token', async () => {
      const token = {
        id: 10,
        teamId: 2,
        team: {id: 2, status: 'ACTIVE'},
        expiresAt: new Date(Date.now() + 60_000),
        isActive: false,
        consumedAt: null,
        revokedAt: new Date(),
        usageCount: 0,
        maxUsageCount: 1,
      }
      mockPrisma.qrLoginToken.findUnique.mockResolvedValue(token)
      mockPrisma.activityLog.create.mockResolvedValue({})

      await expect(
        service.loginWithQr({
          token: 'opaque-random-qr-login-token',
          deviceLabel: 'web-qr-url',
        }),
      ).rejects.toThrow(UnauthorizedException)

      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'TEAM',
          actorId: '2',
          action: 'QR_LOGIN_REJECTED',
          entityType: 'QR_LOGIN_TOKEN',
          entityId: '10',
          metadata: { reason: 'QR_LOGIN_REVOKED' },
        },
      })
    })

    it('should reject a reusable QR login token for an inactive team', async () => {
      mockPrisma.qrLoginToken.findUnique.mockResolvedValue({
        id: 10,
        teamId: 2,
        team: {id: 2, status: 'INACTIVE'},
        expiresAt: new Date(Date.now() + 60_000),
        isActive: true,
        consumedAt: null,
        revokedAt: null,
        usageCount: 0,
        maxUsageCount: 1,
      })
      mockPrisma.activityLog.create.mockResolvedValue({})

      await expect(
        service.loginWithQr({
          token: 'opaque-random-qr-login-token',
          deviceLabel: 'web-qr-url',
        }),
      ).rejects.toThrow('QR_LOGIN_INACTIVE_TEAM')

      expect(mockPrisma.qrLoginToken.updateMany).not.toHaveBeenCalled()
    })

    it('should rate limit repeated QR login guesses without logging the raw token', async () => {
      mockPrisma.qrLoginToken.findUnique.mockResolvedValue(null)
      mockPrisma.activityLog.create.mockResolvedValue({})

      for (let index = 0; index < 20; index += 1) {
        await expect(
          service.loginWithQr({
            token: 'same-opaque-random-qr-login-token',
            deviceLabel: 'web-qr-url',
          }),
        ).rejects.toThrow(UnauthorizedException)
      }

      await expect(
        service.loginWithQr({
          token: 'same-opaque-random-qr-login-token',
          deviceLabel: 'web-qr-url',
        }),
      ).rejects.toThrow(HttpException)

      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'SYSTEM',
          actorId: 'QR_LOGIN',
          action: 'QR_LOGIN_REJECTED',
          entityType: 'QR_LOGIN_TOKEN',
          entityId: 'unknown',
          metadata: { reason: 'QR_LOGIN_INVALID' },
        },
      })
    })
  })
})
