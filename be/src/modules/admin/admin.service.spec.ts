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
  game: {
    findMany: jest.fn(),
    findFirstOrThrow: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  station: {
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  stationImage: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
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
const mockTeamResults = {
  getRankedTeamResults: jest.fn(),
  toLeaderboardRows: jest.fn(),
};

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
    mockPrisma.game.findFirstOrThrow.mockResolvedValue({
      maxPoints: 30,
      type: 'STANDARD',
      mediaUrl: null,
    });
    mockPrisma.game.create.mockResolvedValue({id: 31});
    mockPrisma.station.count.mockResolvedValue(3);
    mockPrisma.station.create.mockResolvedValue({
      id: 'ST999',
      name: 'Station Secure',
      nameEn: 'Secure Station',
      description: null,
      descriptionEn: null,
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
    mockPrisma.stationImage.findMany.mockResolvedValue([]);
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
      mockTeamResults as never,
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
        expiresAt: null,
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

  it('accepts and normalizes Team Color on create', async () => {
    await service.createTeam(1, {
      name: 'Team Seven',
      username: 'team07',
      password: 'secret7',
      teamColor: '#aabbcc',
    });

    expect(mockPrisma.team.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ color: '#AABBCC' }),
    });
  });

  it('clears Team Color on update with explicit null', async () => {
    mockPrisma.team.update.mockResolvedValue({ ...team, color: null });

    await service.updateTeam(1, 7, { teamColor: null });

    expect(mockPrisma.team.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({ color: null }),
    });
  });

  it('rejects conflicting Team Color aliases', async () => {
    await expect(
      service.updateTeam(1, 7, { teamColor: '#112233', color: '#445566' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps missing Team Color unchanged on update', async () => {
    mockPrisma.team.update.mockResolvedValue(team);

    await service.updateTeam(1, 7, { name: 'Team Seven Updated' });

    expect(mockPrisma.team.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.not.objectContaining({ color: expect.anything() }),
    });
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

  it('summarizes QR status without returning raw tokens', async () => {
    mockPrisma.qrLoginToken.findMany.mockResolvedValue([
      {
        teamId: 7,
        isActive: false,
        consumedAt: null,
        revokedAt: new Date(),
      },
      {
        teamId: 7,
        isActive: true,
        consumedAt: null,
        revokedAt: null,
      },
      {
        teamId: 8,
        isActive: false,
        consumedAt: new Date(),
        revokedAt: null,
      },
    ]);
    mockPrisma.qrToken.findMany.mockResolvedValue([
      {
        stationId: 'ST001',
        isActive: false,
        expiresAt: null,
        revokedAt: new Date(),
      },
      {
        stationId: 'ST001',
        isActive: true,
        expiresAt: null,
        revokedAt: null,
      },
      {
        stationId: 'ST001',
        isActive: true,
        expiresAt: null,
        revokedAt: null,
      },
      {
        stationId: 'ST002',
        isActive: true,
        expiresAt: new Date(0),
        revokedAt: null,
      },
    ]);

    const result = await service.qrStatusSummary();

    expect(result).toEqual({
      teams: [
        {teamId: 7, status: 'ACTIVE'},
        {teamId: 8, status: 'NONE'},
      ],
      stations: [
        {stationId: 'ST001', activeCount: 2, status: 'ACTIVE'},
        {stationId: 'ST002', activeCount: 0, status: 'EXPIRED'},
      ],
    });
    expect(JSON.stringify(result)).not.toContain('rawToken');
    expect(mockPrisma.qrLoginToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({rawToken: expect.anything()}),
      }),
    );
    expect(mockPrisma.qrToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({rawToken: expect.anything()}),
      }),
    );
  });

  it('prepares a QR ZIP inventory without rotating exportable active tokens', async () => {
    mockPrisma.team.findMany.mockResolvedValueOnce([
      {id: 1, qrLoginTokens: [{id: 11, rawToken: 'existing-team-token'}]},
    ]);
    mockPrisma.station.findMany.mockResolvedValueOnce([
      {
        id: 'ST001',
        qrTokens: [
          {id: 21, purpose: QrPurpose.CHECK_IN, rawToken: 'existing-check-in', expiresAt: null},
          {id: 22, purpose: QrPurpose.CHECK_OUT, rawToken: 'existing-check-out', expiresAt: null},
        ],
      },
    ]);

    const result = await service.qrCodesReport(1);

    expect(result.teams).toEqual([
      {teamId: 1, loginUrl: 'https://movement.example/qr-login?token=existing-team-token'},
    ]);
    expect(result.stations).toEqual([
      {stationId: 'ST001', purpose: QrPurpose.CHECK_IN, rawToken: 'existing-check-in'},
      {stationId: 'ST001', purpose: QrPurpose.CHECK_OUT, rawToken: 'existing-check-out'},
    ]);
    expect(result.repaired).toEqual({teamIds: [], stationTokens: []});
    expect(mockPrisma.qrLoginToken.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.qrToken.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {isolationLevel: 'Serializable'},
    );
  });

  it('repairs only missing or rawless QR credentials and is idempotent on retry', async () => {
    const createdStationTokens = new Map<string, string>();
    mockPrisma.team.findMany
      .mockResolvedValueOnce([{
        id: 2,
        qrLoginTokens: [{id: 12, rawToken: 'expired-team-token', expiresAt: new Date(0)}],
      }])
      .mockResolvedValueOnce([{id: 2, qrLoginTokens: [{id: 13, rawToken: 'repaired-team-token'}]}]);
    mockPrisma.station.findMany
      .mockResolvedValueOnce([{
        id: 'ST001',
        qrTokens: [
          {id: 21, purpose: QrPurpose.CHECK_IN, rawToken: 'existing-check-in', expiresAt: null},
          {id: 22, purpose: QrPurpose.CHECK_OUT, rawToken: null, expiresAt: null},
        ],
      }])
      .mockResolvedValueOnce([{
        id: 'ST001',
        qrTokens: [
          {id: 21, purpose: QrPurpose.CHECK_IN, rawToken: 'existing-check-in', expiresAt: null},
          {id: 23, purpose: QrPurpose.CHECK_OUT, rawToken: 'repaired-check-out', expiresAt: null},
        ],
      }]);
    mockPrisma.qrLoginToken.create.mockResolvedValue({
      id: 13,
      teamId: 2,
      rawToken: 'repaired-team-token',
      expiresAt: null,
      usageCount: 0,
      createdAt: new Date(),
    });
    mockPrisma.qrToken.create.mockImplementation(({data}) => {
      const rawToken = data.rawToken as string;
      createdStationTokens.set(data.purpose, rawToken);
      return Promise.resolve({id: 23, createdAt: new Date(), expiresAt: null, ...data});
    });

    const first = await service.qrCodesReport(1);
    const repairedStationToken = createdStationTokens.get(QrPurpose.CHECK_OUT);
    expect(first.repaired.teamIds).toEqual([2]);
    expect(first.repaired.stationTokens).toEqual([
      {stationId: 'ST001', purpose: QrPurpose.CHECK_OUT},
    ]);
    expect(first.stations.find(({purpose}) => purpose === QrPurpose.CHECK_IN)?.rawToken)
      .toBe('existing-check-in');
    expect(repairedStationToken).toMatch(/^MV26-SQ1-O-/);
    expect(mockPrisma.qrToken.updateMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.qrToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {stationId: 'ST001', purpose: QrPurpose.CHECK_OUT, isActive: true},
    }));

    await service.qrCodesReport(1);
    expect(mockPrisma.qrLoginToken.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.qrToken.create).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mockActivityLog.log.mock.calls)).not.toContain('repaired-team-token');
    expect(JSON.stringify(mockActivityLog.log.mock.calls)).not.toContain(repairedStationToken);
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
      nameEn: 'Secure Station',
      description: null,
      descriptionEn: null,
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      gameType: 'STANDARD',
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
      nameEn: 'Secure Station',
      description: null,
      descriptionEn: null,
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      gameType: 'STANDARD',
      mediaUrl: null,
    });

    expect(mockPrisma.game.create).toHaveBeenCalledWith({
      data: expect.objectContaining({maxPoints: 30}),
    });
    expect(mockPrisma.team.updateMany).toHaveBeenCalledWith({
      data: {maxPossiblePoints: 1785},
    });
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_STATION',
        metadata: expect.objectContaining({
          maxPoints: 30,
          effectiveMaxPoints: 105,
          gameType: 'STANDARD',
          imageCount: 0,
        }),
      }),
    );
  });

  it('uses effective max score 10 when creating a TIME Station', async () => {
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
      nameEn: 'Secure Station',
      description: null,
      descriptionEn: null,
      trackingMode: StationTrackingMode.TIME,
      mapX: 10,
      mapY: 20,
      gameType: 'STANDARD',
      maxPoints: 100,
      mediaUrl: null,
    });

    expect(mockPrisma.game.create).toHaveBeenCalledWith({
      data: expect.objectContaining({maxPoints: 100}),
    });
    expect(mockPrisma.team.updateMany).toHaveBeenCalledWith({
      data: {maxPossiblePoints: 1785},
    });
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
      nameEn: 'Secure Station',
      description: null,
      descriptionEn: null,
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      gameType: 'STANDARD',
      maxPoints: 45,
      mediaUrl: null,
    });

    expect(mockPrisma.game.create).toHaveBeenCalledWith({
      data: expect.objectContaining({maxPoints: 45}),
    });
    expect(mockPrisma.team.updateMany).toHaveBeenCalledWith({
      data: {maxPossiblePoints: 1785},
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
        nameEn: 'Secure Station',
        description: null,
        descriptionEn: null,
        trackingMode: StationTrackingMode.BOTH,
        mapX: 10,
        mapY: 20,
        gameType: 'STANDARD',
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

  it('updates Station game type and max points and keeps Team maximums in sync', async () => {
    mockPrisma.station.update.mockResolvedValue({id: 'ST999', name: 'Station Secure'});
    mockPrisma.game.findFirstOrThrow.mockResolvedValue({
      maxPoints: 30,
      type: 'STANDARD',
      mediaUrl: null,
    });

    await service.updateStation(1, 'ST999', {
      gameType: 'ST',
      maxPoints: 45,
      mediaUrl: 'https://www.youtube.com/watch?v=abc123',
    });

    expect(mockPrisma.game.updateMany).toHaveBeenCalledWith({
      where: {stationId: 'ST999', isActive: true},
      data: {
        mediaUrl: 'https://www.youtube.com/watch?v=abc123',
        type: 'ST',
        maxPoints: 45,
      },
    });
    expect(mockPrisma.team.updateMany).not.toHaveBeenCalled();
    expect(mockActivityLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_STATION',
        metadata: expect.objectContaining({
          gameType: 'ST',
          maxPoints: 45,
        }),
      }),
    );
  });

  it('decrements Team maximums when changing a Station from BOTH to TIME', async () => {
    mockPrisma.station.findUniqueOrThrow.mockResolvedValueOnce({
      trackingMode: StationTrackingMode.BOTH,
    });
    mockPrisma.station.update.mockResolvedValue({id: 'ST999', name: 'Station Secure'});
    mockPrisma.game.findFirstOrThrow.mockResolvedValue({
      maxPoints: 100,
      type: 'STANDARD',
      mediaUrl: null,
    });

    await service.updateStation(1, 'ST999', {
      trackingMode: StationTrackingMode.TIME,
    });

    expect(mockPrisma.team.updateMany).not.toHaveBeenCalled();
  });

  it('increments Team maximums when changing a Station from TIME to BOTH', async () => {
    mockPrisma.station.findUniqueOrThrow.mockResolvedValueOnce({
      trackingMode: StationTrackingMode.TIME,
    });
    mockPrisma.station.update.mockResolvedValue({id: 'ST999', name: 'Station Secure'});
    mockPrisma.game.findFirstOrThrow.mockResolvedValue({
      maxPoints: 100,
      type: 'STANDARD',
      mediaUrl: null,
    });

    await service.updateStation(1, 'ST999', {
      trackingMode: StationTrackingMode.BOTH,
    });

    expect(mockPrisma.team.updateMany).not.toHaveBeenCalled();
  });

  it('does not change Team maximums when updating TIME stored max points', async () => {
    mockPrisma.station.findUniqueOrThrow.mockResolvedValueOnce({
      trackingMode: StationTrackingMode.TIME,
    });
    mockPrisma.station.update.mockResolvedValue({id: 'ST999', name: 'Station Secure'});
    mockPrisma.game.findFirstOrThrow.mockResolvedValue({
      maxPoints: 50,
      type: 'STANDARD',
      mediaUrl: null,
    });

    await service.updateStation(1, 'ST999', {
      maxPoints: 100,
    });

    expect(mockPrisma.team.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an ST Station without a valid YouTube URL', async () => {
    await expect(
      service.createStation(1, {
        id: 'st999',
        name: 'Station Video',
        nameEn: 'Video Station',
        description: null,
        descriptionEn: null,
        trackingMode: StationTrackingMode.BOTH,
        mapX: 10,
        mapY: 20,
        gameType: 'ST',
        maxPoints: 30,
        mediaUrl: null,
      }),
    ).rejects.toThrow('ST stations require a valid HTTPS YouTube URL');
    expect(mockPrisma.station.create).not.toHaveBeenCalled();
  });

  it('creates an ordered Station image gallery in the Station transaction', async () => {
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
      name: 'Station Gallery',
      nameEn: 'Gallery Station',
      trackingMode: StationTrackingMode.BOTH,
      mapX: 10,
      mapY: 20,
      gameType: 'STANDARD',
      imageUrls: [
        ' https://cdn.example.com/first.webp ',
        'https://cdn.example.com/second.jpg',
      ],
    });

    expect(mockPrisma.stationImage.createMany).toHaveBeenCalledWith({
      data: [
        {
          stationId: 'ST999',
          url: 'https://cdn.example.com/first.webp',
          sortOrder: 0,
        },
        {
          stationId: 'ST999',
          url: 'https://cdn.example.com/second.jpg',
          sortOrder: 1,
        },
      ],
    });
    expect(result.imageUrls).toEqual([
      'https://cdn.example.com/first.webp',
      'https://cdn.example.com/second.jpg',
    ]);
  });

  it('returns ordered imageUrls without Station image persistence fields', async () => {
    mockPrisma.station.findMany.mockResolvedValue([
      {
        id: 'ST999',
        name: 'Station Gallery',
        images: [
          {url: 'https://cdn.example.com/first.webp'},
          {url: 'https://cdn.example.com/second.jpg'},
        ],
        games: [],
      },
    ]);
    mockPrisma.team.findMany.mockResolvedValue([]);

    const result = await service.progressMatrix();

    expect(result.stations).toEqual([
      expect.objectContaining({
        id: 'ST999',
        imageUrls: [
          'https://cdn.example.com/first.webp',
          'https://cdn.example.com/second.jpg',
        ],
      }),
    ]);
    expect(result.stations[0]).not.toHaveProperty('images');
    expect(mockPrisma.station.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          name: true,
          images: expect.any(Object),
          games: expect.any(Object),
        }),
      }),
    );
  });

  it('accepts an unknown reference only for ST007', async () => {
    mockPrisma.station.update.mockResolvedValue({id: 'ST007'});

    await expect(
      service.updateStation(1, 'ST008', {maxPoints: null}),
    ).rejects.toThrow('Only ST007 may have an unknown reference point value');
    await expect(
      service.updateStation(1, 'ST007', {maxPoints: null}),
    ).resolves.toEqual(expect.objectContaining({id: 'ST007'}));

    expect(mockPrisma.game.updateMany).toHaveBeenCalledWith({
      where: {stationId: 'ST007', isActive: true},
      data: {maxPoints: null},
    });
  });

  it('returns only fields consumed by the Admin progress matrix client', async () => {
    const checkedInAt = new Date('2026-08-01T02:00:00.000Z');
    mockPrisma.station.findMany.mockResolvedValue([
      {id: 'ST999', name: 'Station Lean', images: [], games: []},
    ]);
    mockPrisma.team.findMany.mockResolvedValue([
      {
        id: 7,
        name: 'Team Seven',
        username: 'team07',
        captainName: 'Captain Seven',
        totalPoints: 20,
        totalPlaySeconds: 300,
        color: '#123456',
        progress: [
          {
            id: 71,
            stationId: 'ST999',
            status: ProgressStatus.PLAYING,
            scoreAchieved: 0,
            checkedInAt,
            checkedOutAt: null,
            completedAt: null,
            game: {maxPoints: 30},
            gameId: 99,
            cancelledAt: null,
            reopenedAt: null,
          },
        ],
      },
    ]);

    const result = await service.progressMatrix();

    expect(result.rows[0]).toEqual({
      team: {
        id: 7,
        name: 'Team Seven',
        username: 'team07',
        captainName: 'Captain Seven',
        totalPoints: 20,
        totalPlaySeconds: 300,
        teamColor: '#123456',
        color: '#123456',
      },
      cells: [
        {
          progressId: 71,
          stationId: 'ST999',
          status: ProgressStatus.PLAYING,
          scoreAchieved: 0,
          maxPoints: 30,
          scoreEntryMax: 105,
          referenceExceeded: false,
          checkedInAt,
          checkedOutAt: null,
          completedAt: null,
        },
      ],
    });
    expect(result.rows[0].cells[0]).not.toHaveProperty('gameId');
    expect(result.rows[0].cells[0]).not.toHaveProperty('cancelledAt');
    expect(result.rows[0].cells[0]).not.toHaveProperty('reopenedAt');
    expect(result).not.toHaveProperty('serverNow');
  });

  it('replaces, reorders, clears, and preserves Station galleries explicitly', async () => {
    mockPrisma.station.update.mockResolvedValue({
      id: 'ST999',
      name: 'Station Gallery',
    });
    mockPrisma.stationImage.findMany.mockResolvedValueOnce([
      {url: 'https://cdn.example.com/second.jpg'},
      {url: 'https://cdn.example.com/first.webp'},
    ]);

    const replaced = await service.updateStation(1, 'ST999', {
      imageUrls: [
        'https://cdn.example.com/second.jpg',
        'https://cdn.example.com/first.webp',
      ],
    });
    expect(mockPrisma.stationImage.deleteMany).toHaveBeenCalledWith({
      where: {stationId: 'ST999'},
    });
    expect(mockPrisma.stationImage.createMany).toHaveBeenCalledWith({
      data: [
        {
          stationId: 'ST999',
          url: 'https://cdn.example.com/second.jpg',
          sortOrder: 0,
        },
        {
          stationId: 'ST999',
          url: 'https://cdn.example.com/first.webp',
          sortOrder: 1,
        },
      ],
    });
    expect(replaced.imageUrls).toEqual([
      'https://cdn.example.com/second.jpg',
      'https://cdn.example.com/first.webp',
    ]);

    mockPrisma.stationImage.deleteMany.mockClear();
    mockPrisma.stationImage.createMany.mockClear();
    mockPrisma.stationImage.findMany.mockReset();
    mockPrisma.station.update.mockReset();
    mockPrisma.station.update.mockResolvedValue({id: 'ST999'});
    mockPrisma.stationImage.findMany.mockResolvedValue([]);
    await service.updateStation(1, 'ST999', {imageUrls: []});
    expect(mockPrisma.stationImage.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.stationImage.createMany).not.toHaveBeenCalled();

    mockPrisma.stationImage.deleteMany.mockClear();
    mockPrisma.stationImage.createMany.mockClear();
    mockPrisma.stationImage.findMany.mockReset();
    mockPrisma.station.update.mockReset();
    mockPrisma.station.update.mockResolvedValue({id: 'ST999'});
    mockPrisma.stationImage.findMany.mockResolvedValue([
      {url: 'https://cdn.example.com/existing.jpg'},
    ]);
    const preserved = await service.updateStation(1, 'ST999', {name: 'Renamed'});
    expect(mockPrisma.stationImage.deleteMany).not.toHaveBeenCalled();
    expect(preserved.imageUrls).toEqual([
      'https://cdn.example.com/existing.jpg',
    ]);
  });

  it('rejects unsafe, duplicate, oversized, and excessive Station galleries', async () => {
    await expect(
      service.updateStation(1, 'ST999', {
        imageUrls: ['http://cdn.example.com/image.jpg'],
      }),
    ).rejects.toThrow('valid HTTPS URL');
    await expect(
      service.updateStation(1, 'ST999', {
        imageUrls: [
          'https://cdn.example.com/image.jpg',
          ' https://cdn.example.com/image.jpg ',
        ],
      }),
    ).rejects.toThrow('must be unique');
    await expect(
      service.updateStation(1, 'ST999', {
        imageUrls: [`https://cdn.example.com/${'a'.repeat(2049)}`],
      }),
    ).rejects.toThrow('1-2048 characters');
    await expect(
      service.updateStation(1, 'ST999', {
        imageUrls: Array.from(
          {length: 11},
          (_, index) => `https://cdn.example.com/${index}.jpg`,
        ),
      }),
    ).rejects.toThrow('at most 10 images');
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not write an activity log when gallery replacement fails', async () => {
    mockPrisma.station.update.mockResolvedValue({id: 'ST999'});
    mockPrisma.stationImage.createMany.mockRejectedValueOnce(
      new Error('image-create-failed'),
    );

    await expect(
      service.updateStation(1, 'ST999', {
        imageUrls: ['https://cdn.example.com/image.jpg'],
      }),
    ).rejects.toThrow('image-create-failed');
    expect(mockActivityLog.log).not.toHaveBeenCalled();
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
    mockPrisma.station.findUniqueOrThrow.mockReset();
    mockPrisma.station.findUniqueOrThrow.mockResolvedValue({id: 'ST999', isActive: true});
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
    ['above global limit', 106],
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

  it('edits only score fields for Admin without changing status or timestamps', async () => {
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

    expect(mockPrisma.teamStationProgress.update).toHaveBeenCalledWith({
      where: {id: 99},
      data: {
        scoreAchieved: 10,
        scoreEnteredByUserId: 1,
      },
    });
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

  it('accepts 105 above the Station reference and returns a warning', async () => {
    const existingProgress = {
      id: 99,
      teamId: 7,
      stationId: 'ST999',
      status: ProgressStatus.COMPLETED,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
      checkedOutAt: new Date('2026-07-19T01:10:00.000Z'),
      completedAt: new Date('2026-07-19T01:12:00.000Z'),
      scoreAchieved: 5,
      stationRank: null,
      team: {...team, totalPoints: 20},
      game: {maxPoints: 30},
      station: {trackingMode: StationTrackingMode.BOTH},
    };
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue(existingProgress);
    mockPrisma.teamStationProgress.update.mockResolvedValue({...existingProgress, scoreAchieved: 105});

    await expect(
      service.editScore(1, 99, {score: 105, reason: 'verified above reference'}),
    ).resolves.toEqual(expect.objectContaining({
      scoreAchieved: 105,
      scoreEntryMax: 105,
      referenceExceeded: true,
      stationRank: null,
    }));
  });

  it('requires a non-empty reason for every Admin score edit', async () => {
    await expect(
      service.editScore(1, 99, {score: 10, reason: '   '}),
    ).rejects.toThrow('Reason is required for Admin score changes');
    expect(mockPrisma.teamStationProgress.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mockPrisma.teamStationProgress.update).not.toHaveBeenCalled();
  });

  it('rejects Admin score correction before progress is completed', async () => {
    mockPrisma.teamStationProgress.findUniqueOrThrow.mockResolvedValue({
      id: 99,
      teamId: 7,
      stationId: 'ST999',
      status: ProgressStatus.CHECKED_IN,
      checkedInAt: new Date('2026-07-19T01:00:00.000Z'),
      checkedOutAt: null,
      completedAt: null,
      scoreAchieved: 0,
      team: {...team, totalPoints: 20},
      game: {maxPoints: 30},
      station: {trackingMode: StationTrackingMode.BOTH},
    });

    await expect(
      service.editScore(1, 99, {score: 10, reason: 'audit reason'}),
    ).rejects.toThrow('Only completed progress can have its score corrected');
    expect(mockPrisma.teamStationProgress.update).not.toHaveBeenCalled();
    expect(mockPrisma.scoreEvent.create).not.toHaveBeenCalled();
  });
});
