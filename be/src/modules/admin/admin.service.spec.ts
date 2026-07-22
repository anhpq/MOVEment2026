import {BadRequestException} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {AdminService} from './admin.service';

const team = {
  id: 7,
  name: 'Team Seven',
  username: 'team07',
  captainName: 'Captain Seven',
  passwordHash: 'password-hash',
  loginQrHash: null,
  loginQrFingerprint: null,
  totalPoints: 0,
  maxPossiblePoints: 0,
  totalPlaySeconds: 0,
  startedAt: null,
  status: 'ACTIVE',
  color: null,
  activeSessionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  game: {findMany: jest.fn()},
  team: {create: jest.fn(), findUniqueOrThrow: jest.fn()},
  qrLoginToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  teamStationProgress: {createMany: jest.fn()},
  $transaction: jest.fn(),
};

const mockActivityLog = {log: jest.fn()};
const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === 'FRONTEND_PUBLIC_URL') return 'https://movement.example';
    return undefined;
  }),
};

describe('AdminService Team QR login lifecycle', () => {
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(
      (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma),
    );
    mockPrisma.game.findMany.mockResolvedValue([]);
    mockPrisma.team.create.mockResolvedValue(team);
    mockPrisma.team.findUniqueOrThrow.mockResolvedValue(team);
    mockPrisma.qrLoginToken.create.mockImplementation(({data}) =>
      Promise.resolve({
        id: 12,
        usageCount: 0,
        createdAt: new Date(),
        ...data,
      }),
    );
    mockActivityLog.log.mockResolvedValue(undefined);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('password-hash' as never);

    service = new AdminService(
      mockPrisma as never,
      {} as never,
      mockActivityLog as never,
      mockConfig as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provisions an Automatic URL QR token in the Team creation transaction', async () => {
    const result = await service.createTeam(1, {
      name: 'Team Seven',
      username: 'team07',
      password: 'secret7',
    });

    expect(mockPrisma.qrLoginToken.create).toHaveBeenCalledWith({
      data: {
        teamId: 7,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
        createdByUserId: 1,
      },
    });
    expect(mockPrisma.team.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({
        loginQrHash: expect.anything(),
        loginQrFingerprint: expect.anything(),
      }),
    });
    expect(result.qrLoginUrl).toMatch(
      /^https:\/\/movement\.example\/qr-login\?token=/,
    );
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('does not rotate a valid token through the generate action', async () => {
    mockPrisma.qrLoginToken.findFirst.mockResolvedValue({
      id: 11,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.generateTeamQrLoginToken(1, 7, {}),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.qrLoginToken.create).not.toHaveBeenCalled();
  });

  it('rotates by revoking the active token before creating a replacement', async () => {
    mockPrisma.qrLoginToken.findFirst.mockResolvedValue({
      id: 11,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockPrisma.qrLoginToken.update.mockResolvedValue({});

    await service.generateTeamQrLoginToken(1, 7, {}, true);

    expect(mockPrisma.qrLoginToken.update).toHaveBeenCalledWith({
      where: {id: 11},
      data: {isActive: false, revokedAt: expect.any(Date)},
    });
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({action: 'QR_LOGIN_ROTATED'}),
    );
  });

  it('revokes an active token without deleting its Team', async () => {
    mockPrisma.qrLoginToken.update.mockResolvedValue({
      id: 11,
      teamId: 7,
      revokedAt: new Date(),
    });

    await service.revokeQrLoginToken(1, 11);

    expect(mockPrisma.qrLoginToken.update).toHaveBeenCalledWith({
      where: {id: 11},
      data: {isActive: false, revokedAt: expect.any(Date)},
    });
  });
});
