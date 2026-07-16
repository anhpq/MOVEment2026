import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'

describe('JwtAuthGuard', () => {
  const mockJwtService = {
    verifyAsync: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  }

  const mockPrisma = {
    teamSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  }

  const createContext = (authorization?: string) => {
    const request: Record<string, any> = {
      headers: {
        authorization,
      },
    }
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext
    return { context, request }
  }

  let guard: JwtAuthGuard

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new JwtAuthGuard(
      mockJwtService as any,
      mockConfigService as any,
      mockPrisma as any,
    )
  })

  it('should authenticate a valid team token and set auth on request', async () => {
    const payload = { sub: 2, type: 'TEAM', sessionId: 'session-1' }
    const { context, request } = createContext('Bearer valid-token')

    mockJwtService.verifyAsync.mockResolvedValue(payload)
    mockPrisma.teamSession.findUnique.mockResolvedValue({
      id: 'session-1',
      teamId: 2,
      revokedAt: null,
    })

    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(request.auth).toEqual({ type: 'TEAM', id: 2, sessionId: 'session-1' })
    expect(mockPrisma.teamSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { lastSeenAt: expect.any(Date) },
    })
  })

  it('should throw if authorization header is missing', async () => {
    const { context } = createContext()

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
    await expect(guard.canActivate(context)).rejects.toThrow('Missing bearer token')
  })

  it('should throw if the token is invalid', async () => {
    const { context } = createContext('Bearer invalid-token')
    mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'))

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid token')
  })

  it('should throw when the team session is revoked or replaced', async () => {
    const payload = { sub: 2, type: 'TEAM', sessionId: 'session-1' }
    const { context } = createContext('Bearer expired-token')

    mockJwtService.verifyAsync.mockResolvedValue(payload)
    mockPrisma.teamSession.findUnique.mockResolvedValue({
      id: 'session-1',
      teamId: 2,
      revokedAt: new Date(),
    })

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
    await expect(guard.canActivate(context)).rejects.toThrow('SESSION_REPLACED')
  })
})
