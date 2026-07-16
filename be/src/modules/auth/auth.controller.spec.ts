import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UnauthorizedException } from '@nestjs/common'
import { AuthContext } from '../../common/auth/auth-context'
import { TeamLoginDto, UserLoginDto } from './dto/login.dto'

const mockAuthService = {
  loginUser: jest.fn(),
  loginTeam: jest.fn(),
  me: jest.fn(),
  logout: jest.fn(),
}

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(() => {
    controller = new AuthController(mockAuthService as unknown as AuthService)
    jest.clearAllMocks()
  })

  it('should delegate loginUser to AuthService', async () => {
    const dto: UserLoginDto = { username: 'admin', password: 'admin123' }
    const expected = { accessToken: 'token', user: { id: 1, username: 'admin', role: 'ADMIN' } }
    mockAuthService.loginUser.mockResolvedValue(expected)

    await expect(controller.loginUser(dto)).resolves.toEqual(expected)
    expect(mockAuthService.loginUser).toHaveBeenCalledWith(dto)
  })

  it('should delegate loginTeam to AuthService', async () => {
    const dto: TeamLoginDto = { username: 'team01', password: 'team01', deviceLabel: 'web' }
    const expected = { accessToken: 'token', team: { id: 2, username: 'team01', name: 'Team 01' } }
    mockAuthService.loginTeam.mockResolvedValue(expected)

    await expect(controller.loginTeam(dto)).resolves.toEqual(expected)
    expect(mockAuthService.loginTeam).toHaveBeenCalledWith(dto)
  })

  it('should throw UnauthorizedException when team already has an active session', async () => {
    const dto: TeamLoginDto = { username: 'team01', password: 'team01', deviceLabel: 'web' }
    mockAuthService.loginTeam.mockRejectedValue(new UnauthorizedException('Team is already logged in on another device'))

    await expect(controller.loginTeam(dto)).rejects.toThrow(UnauthorizedException)
    expect(mockAuthService.loginTeam).toHaveBeenCalledWith(dto)
  })

  it('should delegate me to AuthService', async () => {
    const auth: AuthContext = { type: 'TEAM', id: 2, sessionId: 'session-1' }
    const expected = { type: 'TEAM', team: { id: 2, username: 'team01', name: 'Team 01' } }
    mockAuthService.me.mockResolvedValue(expected)

    await expect(controller.me(auth)).resolves.toEqual(expected)
    expect(mockAuthService.me).toHaveBeenCalledWith(auth)
  })

  it('should delegate logout to AuthService', async () => {
    const auth: AuthContext = { type: 'TEAM', id: 2, sessionId: 'session-1' }
    const expected = { success: true }
    mockAuthService.logout.mockResolvedValue(expected)

    await expect(controller.logout(auth)).resolves.toEqual(expected)
    expect(mockAuthService.logout).toHaveBeenCalledWith(auth)
  })
})
