import {BadRequestException} from '@nestjs/common';
import {ProgressStatus, QrPurpose, StationTrackingMode} from '@prisma/client';
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
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  team: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  qrLoginToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  qrToken: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  teamStationProgress: {
    createMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
  scoreEvent: {create: jest.fn()},
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
    mockPrisma.qrLoginToken.findUnique.mockResolvedValue(null);
    mockPrisma.qrLoginToken.updateMany.mockResolvedValue({count: 1});
    mockPrisma.qrLoginToken.create.mockImplementation(({data}) =>
      Promise.resolve({
        id: 12,
        usageCount: 0,
        createdAt: new Date(),
        ...data,
      }),
    );
    mockPrisma.qrToken.findUnique.mockResolvedValue(null);
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
        rawToken: expect.any(String),
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

  it('replaces an active token through the generate action and returns one-time raw token', async () => {
    const result = await service.generateTeamQrLoginToken(1, 7, {});

    expect(mockPrisma.qrLoginToken.updateMany).toHaveBeenCalledWith({
      where: { teamId: 7, isActive: true },
      data: { isActive: false, revokedAt: expect.any(Date) },
    });
    expect(mockPrisma.qrLoginToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        teamId: 7,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        rawToken: expect.any(String),
      }),
    });
    expect(result.rawToken).toEqual(expect.any(String));
    expect(result.qrLoginUrl).toMatch(/^https:\/\/movement\.example\/qr-login\?token=/);
  });

  it('lists Team QR raw token and URL for Admin display when stored', async () => {
    mockPrisma.qrLoginToken.findMany.mockResolvedValue([
      {
        id: 12,
        teamId: 7,
        rawToken: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
        expiresAt: new Date(Date.now() + 60_000),
        isActive: true,
        consumedAt: null,
        revokedAt: null,
        usageCount: 0,
        createdAt: new Date(),
        lastUsedAt: null,
      },
    ]);

    const result = await service.listTeamQrLoginTokens(7);

    expect(result[0].rawToken).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-');
    expect(result[0].qrLoginUrl).toMatch(/^https:\/\/movement\.example\/qr-login\?token=/);
    expect(result[0]).not.toHaveProperty('tokenHash');
  });

  it('rotates by revoking the active token before creating a replacement', async () => {
    await service.generateTeamQrLoginToken(1, 7, {}, true);

    expect(mockPrisma.qrLoginToken.updateMany).toHaveBeenCalledWith({
      where: {teamId: 7, isActive: true},
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

  it('uses the default max score when creating a Station without maxPoints', async () => {
    mockPrisma.qrToken.create.mockImplementation(({data}) =>
      Promise.resolve({
        id: data.purpose === QrPurpose.CHECK_IN ? 101 : 102,
        createdAt: new Date(),
        expiresAt: null,
        ...data,
      }),
    );

    await service.createStation(1, {
      id: 'st999',
      name: 'Station Secure',
      description: null,
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      gameType: 'quiz',
      mediaUrl: null,
    });

    expect(mockPrisma.game.create).toHaveBeenCalledWith({
      data: expect.objectContaining({maxPoints: 30}),
    });
    expect(mockPrisma.team.updateMany).toHaveBeenCalledWith({
      data: {maxPossiblePoints: {increment: 30}},
    });
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_STATION',
        metadata: {maxPoints: 30, gameType: 'quiz'},
      }),
    );
  });

  it('preserves a custom max score when creating a Station', async () => {
    mockPrisma.qrToken.create.mockImplementation(({data}) =>
      Promise.resolve({
        id: data.purpose === QrPurpose.CHECK_IN ? 101 : 102,
        createdAt: new Date(),
        expiresAt: null,
        ...data,
      }),
    );

    await service.createStation(1, {
      id: 'st999',
      name: 'Station Secure',
      description: null,
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      gameType: 'quiz',
      maxPoints: 45,
      mediaUrl: null,
    });

    expect(mockPrisma.game.create).toHaveBeenCalledWith({
      data: expect.objectContaining({maxPoints: 45}),
    });
    expect(mockPrisma.team.updateMany).toHaveBeenCalledWith({
      data: {maxPossiblePoints: {increment: 45}},
    });
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

  it('updates a Team QR token only when a new raw token is provided', async () => {
    mockPrisma.team.update.mockResolvedValue(team);

    const unchanged = await service.updateTeam(1, 7, {name: 'Team Seven', qrToken: '   '});
    expect(unchanged).not.toHaveProperty('qrLogin');
    expect(mockPrisma.qrLoginToken.create).not.toHaveBeenCalled();

    const changed = await service.updateTeam(1, 7, {
      qrToken: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
    });
    expect(changed.qrLogin?.rawToken).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-');
    expect(mockPrisma.qrLoginToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/)}),
    });
  });

  it('rejects invalid and duplicate Team QR tokens', async () => {
    mockPrisma.team.update.mockResolvedValue(team);
    await expect(service.updateTeam(1, 7, {qrToken: 'bad token'})).rejects.toThrow(BadRequestException);

    mockPrisma.qrLoginToken.findUnique.mockResolvedValue({id: 44, teamId: 8});
    await expect(
      service.updateTeam(1, 7, {qrToken: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'}),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates Station QR tokens only when new raw tokens are provided', async () => {
    mockPrisma.station.update.mockResolvedValue({id: 'ST999', name: 'Station Secure'});

    const unchanged = await service.updateStation(1, 'ST999', {checkInQrToken: ' '});
    expect(unchanged).not.toHaveProperty('qrTokens');

    const changed = await service.updateStation(1, 'ST999', {
      checkInQrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    });
    expect(changed.qrTokens?.[0].rawToken).toBe('MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    expect(mockPrisma.qrToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: expect.any(String),
        tokenFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
  });

  it('rejects invalid and duplicate Station QR tokens', async () => {
    mockPrisma.station.update.mockResolvedValue({id: 'ST999', name: 'Station Secure'});
    await expect(service.updateStation(1, 'ST999', {checkInQrToken: 'MV26-SQ1-O-ABCDEFGHIJKLMNOPQRSTUVWXYZ'})).rejects.toThrow(BadRequestException);

    mockPrisma.qrToken.findUnique.mockResolvedValue({id: 55, stationId: 'ST001', purpose: QrPurpose.CHECK_IN});
    await expect(service.updateStation(1, 'ST999', {checkInQrToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXYZ'})).rejects.toThrow(BadRequestException);
  });

  it('lists Station QR raw tokens for Admin display when stored', async () => {
    mockPrisma.qrToken.findMany.mockResolvedValue([
      {
        id: 10,
        stationId: 'ST999',
        purpose: QrPurpose.CHECK_IN,
        schemaVersion: 'SQ1',
        rawToken: 'MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2',
        isActive: true,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.listStationQrTokens('ST999');

    expect(result[0].rawToken).toBe('MV26-SQ1-I-ABCDEFGHIJKLMNOPQRSTUVWXY2');
    expect(result[0]).not.toHaveProperty('tokenHash');
    expect(result[0]).not.toHaveProperty('tokenFingerprint');
  });

  it('generates one-time Station QR tokens without returning hashes', async () => {
    mockPrisma.qrToken.create.mockImplementation(({data}) => Promise.resolve({id: data.purpose === QrPurpose.CHECK_IN ? 1 : 2, createdAt: new Date(), expiresAt: null, ...data}));

    const result = await service.generateStationQrTokens(1, 'ST999');

    expect(result.qrTokens).toHaveLength(2);
    expect(mockPrisma.qrToken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({rawToken: expect.any(String)}),
    }));
    expect(result.qrTokens[0]).toHaveProperty('rawToken');
    expect(result.qrTokens[0]).not.toHaveProperty('tokenHash');
    expect(result.qrTokens[0]).not.toHaveProperty('tokenFingerprint');
  });

  it.each([
    ['negative', -1],
    ['decimal', 10.5],
    ['above max', 31],
  ])('rejects %s Admin score corrections before writing', async (_label, score) => {
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue({
      id: 99,
      teamId: 7,
      stationId: 'ST999',
      status: ProgressStatus.COMPLETED,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
      completedAt: new Date('2026-07-19T01:12:00.000Z'),
      scoreAchieved: 5,
      team: {...team, totalPoints: 20},
      game: {maxPoints: 30},
      station: {trackingMode: StationTrackingMode.BOTH},
    });

    await expect(
      service.editScore(1, 99, {score, reason: 'audit reason'}),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.teamStationProgress.update).not.toHaveBeenCalled();
    expect(mockPrisma.scoreEvent.create).not.toHaveBeenCalled();
  });

  it('keeps Admin score edit audited and separate from Team scoring code', async () => {
    const existingProgress = {
      id: 99,
      teamId: 7,
      stationId: 'ST999',
      status: ProgressStatus.COMPLETED,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
      completedAt: new Date('2026-07-19T01:12:00.000Z'),
      scoreAchieved: 5,
      team: {...team, totalPoints: 20},
      game: {maxPoints: 30},
      station: {trackingMode: StationTrackingMode.BOTH},
    };
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(existingProgress);
    mockPrisma.teamStationProgress.update.mockResolvedValue({
      ...existingProgress,
      scoreAchieved: 10,
    });

    await service.editScore(1, 99, {score: 10, reason: 'audit reason'});

    expect(mockPrisma.scoreEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        teamId: 7,
        progressId: 99,
        stationId: 'ST999',
        scoreBefore: 20,
        scoreAfter: 25,
        delta: 5,
        reason: 'audit reason',
        createdByUserId: 1,
      }),
    });
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EDIT_SCORE',
        metadata: {score: 10, reason: 'audit reason', delta: 5},
      }),
    );
  });
});
