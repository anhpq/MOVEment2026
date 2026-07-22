import {BadRequestException} from '@nestjs/common';
import {QrPurpose, StationTrackingMode} from '@prisma/client';
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
  game: {findMany: jest.fn(), create: jest.fn()},
  station: {
    count: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  team: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
  },
  qrLoginToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  qrToken: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
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
    mockPrisma.game.create.mockResolvedValue({id: 31});
    mockPrisma.station.count.mockResolvedValue(3);
    mockPrisma.station.create.mockResolvedValue({
      id: 'ST999',
      name: 'Station Secure',
      description: null,
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      sortOrder: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.station.findUniqueOrThrow.mockResolvedValue({
      id: 'ST999',
      isActive: true,
    });
    mockPrisma.team.findMany.mockResolvedValue([{id: 7}, {id: 8}]);
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

  it('provisions independent SQ1 Station QR tokens in the Station creation transaction', async () => {
    mockPrisma.qrToken.create.mockImplementation(({data}) =>
      Promise.resolve({
        id: data.purpose === QrPurpose.CHECK_IN ? 101 : 102,
        createdAt: new Date(),
        expiresAt: null,
        ...data,
      }),
    );

    const result = await service.createStation(1, {
      id: 'st999',
      name: 'Station Secure',
      description: null,
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      gameType: 'quiz',
      maxPoints: 30,
      mediaUrl: null,
    });

    expect(mockPrisma.qrToken.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.qrToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stationId: 'ST999',
        purpose: QrPurpose.CHECK_IN,
        schemaVersion: 'SQ1',
        tokenFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(mockPrisma.qrToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stationId: 'ST999',
        purpose: QrPurpose.CHECK_OUT,
        schemaVersion: 'SQ1',
        tokenFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(result.qrTokens).toHaveLength(2);
    expect(result.qrTokens[0].rawToken).toMatch(/^MV26-SQ1-I-[A-Z2-7]{26}$/);
    expect(result.qrTokens[1].rawToken).toMatch(/^MV26-SQ1-O-[A-Z2-7]{26}$/);
    expect(result.qrTokens[0].rawToken).not.toBe(result.qrTokens[1].rawToken);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rolls back Station creation when QR pair provisioning fails', async () => {
    mockPrisma.qrToken.create
      .mockResolvedValueOnce({
        id: 101,
        stationId: 'ST999',
        purpose: QrPurpose.CHECK_IN,
        schemaVersion: 'SQ1',
        expiresAt: null,
        createdAt: new Date(),
      })
      .mockRejectedValueOnce(new Error('qr-create-failed'));

    await expect(
      service.createStation(1, {
        id: 'st999',
        name: 'Station Secure',
        description: null,
        trackingMode: StationTrackingMode.BOTH,
        mapX: 10,
        mapY: 20,
        gameType: 'quiz',
        maxPoints: 30,
        mediaUrl: null,
      }),
    ).rejects.toThrow('qr-create-failed');
    expect(mockActivityLog.log).not.toHaveBeenCalledWith(
      expect.objectContaining({action: 'CREATE_STATION'}),
    );
  });

  it('rotates one Station QR purpose without touching the other purpose', async () => {
    mockPrisma.qrToken.create.mockImplementation(({data}) =>
      Promise.resolve({
        id: 201,
        createdAt: new Date(),
        expiresAt: null,
        ...data,
      }),
    );

    const token = await service.rotateStationQrToken(
      1,
      'ST999',
      QrPurpose.CHECK_IN,
    );

    expect(mockPrisma.qrToken.updateMany).toHaveBeenCalledWith({
      where: {
        stationId: 'ST999',
        purpose: QrPurpose.CHECK_IN,
        isActive: true,
      },
      data: {isActive: false, revokedAt: expect.any(Date)},
    });
    expect(token.rawToken).toMatch(/^MV26-SQ1-I-[A-Z2-7]{26}$/);
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({action: 'STATION_QR_ROTATED'}),
    );
  });

  it('rotates Check-out Station QR without touching Check-in', async () => {
    mockPrisma.qrToken.create.mockImplementation(({data}) =>
      Promise.resolve({
        id: 202,
        createdAt: new Date(),
        expiresAt: null,
        ...data,
      }),
    );

    const token = await service.rotateStationQrToken(
      1,
      'ST999',
      QrPurpose.CHECK_OUT,
    );

    expect(mockPrisma.qrToken.updateMany).toHaveBeenCalledWith({
      where: {
        stationId: 'ST999',
        purpose: QrPurpose.CHECK_OUT,
        isActive: true,
      },
      data: {isActive: false, revokedAt: expect.any(Date)},
    });
    expect(token.rawToken).toMatch(/^MV26-SQ1-O-[A-Z2-7]{26}$/);
  });

  it('revokes one active Station QR purpose independently', async () => {
    mockPrisma.qrToken.findFirst.mockResolvedValue({
      id: 301,
      stationId: 'ST999',
      purpose: QrPurpose.CHECK_OUT,
    });
    mockPrisma.qrToken.update.mockResolvedValue({
      id: 301,
      revokedAt: new Date(),
    });

    await service.revokeActiveStationQrToken(1, 'ST999', QrPurpose.CHECK_OUT);

    expect(mockPrisma.qrToken.findFirst).toHaveBeenCalledWith({
      where: {
        stationId: 'ST999',
        purpose: QrPurpose.CHECK_OUT,
        isActive: true,
      },
      orderBy: {createdAt: 'desc'},
    });
    expect(mockPrisma.qrToken.update).toHaveBeenCalledWith({
      where: {id: 301},
      data: {isActive: false, revokedAt: expect.any(Date)},
    });
  });
});
