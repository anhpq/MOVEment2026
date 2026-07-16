import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
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
  teamSession: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
  },
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

    it('should reject team login when credentials are invalid', async () => {
      mockPrisma.team.findFirst.mockResolvedValue(null)

      await expect(
        service.loginTeam({ username: 'team01', password: 'wrong', deviceLabel: 'web' } as TeamLoginDto),
      ).rejects.toThrow(UnauthorizedException)
    })
  })
})
