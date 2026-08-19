import * as ExcelJS from 'exceljs';
import { compareTeamResultRows, TeamResultsService } from './team-results.service';
import { buildTeamResultsWorkbook, formatHcmcTimestampForFileName } from './team-results-excel';

const baseRow = {
  teamId: 1,
  teamCode: 1,
  teamName: 'Team 1',
  username: 'team01',
  captainName: 'Captain 1',
  maxPossiblePoints: 100,
  rankTotalScore: 100,
  rankTotalPlaySeconds: 300,
  completedStations: 3,
  computedScore: 100,
  finalSubmittedAt: null,
  finalRank: null,
  finalBonusScore: 0,
  lastStationName: null,
  stations: {},
};

describe('Team Results ranking and Excel', () => {
  it('sorts by score, play time, completed stations, final submitted time, and team id', () => {
    const rows = [
      { ...baseRow, teamId: 5, teamCode: 5, rankTotalScore: 90 },
      { ...baseRow, teamId: 4, teamCode: 4, completedStations: 2 },
      { ...baseRow, teamId: 3, teamCode: 3, finalSubmittedAt: new Date('2026-08-21T08:01:00.000Z') },
      { ...baseRow, teamId: 2, teamCode: 2, finalSubmittedAt: new Date('2026-08-21T08:00:00.000Z') },
      { ...baseRow, teamId: 1, teamCode: 1 },
      { ...baseRow, teamId: 6, teamCode: 6, rankTotalPlaySeconds: 200 },
    ];

    expect([...rows].sort(compareTeamResultRows).map((row) => row.teamId)).toEqual([
      6,
      2,
      3,
      1,
      4,
      5,
    ]);
  });

  it('builds one Team Results worksheet without excluded columns or secrets', async () => {
    const buffer = await buildTeamResultsWorkbook({
      stationColumns: [
        { id: 'ST001', name: 'Station', header: 'Station', trackingMode: 'BOTH', referencePoints: 30 },
        { id: 'ST007', name: 'Unknown', header: 'Unknown', trackingMode: 'SCORE', referencePoints: null },
        { id: 'ST009', name: 'Ba Tieu', header: 'Ba Tieu', trackingMode: 'TIME', referencePoints: 25 },
      ],
      rows: [
        {
          rank: 1,
          ...baseRow,
          finalSubmittedAt: new Date('2026-08-21T08:00:00.000Z'),
          finalRank: 11,
          finalBonusScore: 0,
          stations: {
            ST001: {
              stationId: 'ST001',
              checkedInAt: new Date('2026-08-21T07:00:00.000Z'),
              checkedOutAt: new Date('2026-08-21T07:05:00.000Z'),
              score: 31,
              stationRank: null,
              completed: true,
            },
            ST007: {
              stationId: 'ST007',
              checkedInAt: new Date('2026-08-21T07:10:00.000Z'),
              checkedOutAt: new Date('2026-08-21T07:15:00.000Z'),
              score: 105,
              stationRank: null,
              completed: true,
            },
            ST009: {
              stationId: 'ST009',
              checkedInAt: new Date('2026-08-21T07:20:00.123Z'),
              checkedOutAt: new Date('2026-08-21T07:20:01.579Z'),
              score: 25,
              stationRank: 1,
              completed: true,
            },
          },
        },
      ],
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const worksheet = workbook.getWorksheet('Team Results');

    expect(workbook.worksheets).toHaveLength(1);
    expect(worksheet).toBeDefined();
    expect(worksheet!.getRow(1).values).toEqual([
      undefined,
      'Team Code',
      'Team Name',
      'Captain Name',
      'Username',
      'Total Stations Completed',
      'Total Play Time',
      'Total Score',
      'Computed Score',
      'Warnings',
      'Rank',
      'Final Submitted At',
      'Final Rank',
      'Final Bonus Score',
      'Station [Both time and score] - Check-in',
      'Station [Both time and score] - Check-out',
      'Station [Both time and score] - Score',
      'Unknown [Score only] - Check-in',
      'Unknown [Score only] - Check-out',
      'Unknown [Score only] - Score',
      'Ba Tieu [Time only] - Check-in',
      'Ba Tieu [Time only] - Check-out',
      'Ba Tieu [Time only] - Duration',
      'Ba Tieu [Time only] - Station Rank',
      'Ba Tieu [Time only] - Score',
    ]);
    const headerValues = worksheet!.getRow(1).values as unknown[];
    expect(worksheet!.getCell('P2').fill).toEqual(expect.objectContaining({
      type: 'pattern',
      fgColor: {argb: 'FFFF0000'},
    }));
    expect(worksheet!.getCell('P2').font).toEqual(expect.objectContaining({
      bold: true,
      color: {argb: 'FFFFFFFF'},
    }));
    expect(worksheet!.getCell('S2').fill).toBeUndefined();
    expect(worksheet!.getCell('T2').numFmt).toBe('dd/mm/yyyy hh:mm:ss.000');
    expect(worksheet!.getCell('U2').numFmt).toBe('dd/mm/yyyy hh:mm:ss.000');
    expect(worksheet!.getCell('V2').numFmt).toBe('[h]:mm:ss.000');
    expect((worksheet!.getCell('U2').value as Date).getTime() - (worksheet!.getCell('T2').value as Date).getTime()).toBe(1456);
    const durationDate = worksheet!.getCell('V2').value as Date;
    expect(((durationDate.getTime() % 86_400_000) + 86_400_000) % 86_400_000).toBe(1456);
    expect(worksheet!.getCell('W2').value).toBe(1);
    expect(worksheet!.getCell('X2').value).toBe(25);
    expect(headerValues).not.toContain('Team Color');
    expect(headerValues).not.toContain('Team Status');
    expect(headerValues).not.toContain('Total Stations');
    expect(headerValues).not.toContain('Final Challenge Status');
    expect(worksheet!.getColumn(6).numFmt).toBe('[h]:mm:ss');
    expect(worksheet!.getColumn(11).numFmt).toBe('dd/mm/yyyy hh:mm:ss');
    expect(JSON.stringify(worksheet!.getSheetValues())).not.toContain('answerSubmitted');
  });

  it('exports an explicit warning for a provisional ST009 score', async () => {
    const buffer = await buildTeamResultsWorkbook({
      stationColumns: [{id: 'ST009', name: 'Ba Tieu', header: 'Ba Tieu', trackingMode: 'TIME', referencePoints: 25}],
      rows: [{
        rank: 1,
        ...baseRow,
        warnings: 'ST009 provisional score',
        stations: {
          ST009: {
            stationId: 'ST009',
            checkedInAt: new Date('2026-08-21T07:20:00.123Z'),
            checkedOutAt: new Date('2026-08-21T07:20:01.579Z'),
            score: 10,
            stationRank: null,
            completed: true,
          },
        },
      }],
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const worksheet = workbook.getWorksheet('Team Results')!;

    expect(worksheet.getCell('I2').value).toBe('ST009 provisional score');
    expect(worksheet.getCell('Q2').value).toBe('');
    expect(worksheet.getCell('R2').value).toBe(10);
  });

  it('formats filename timestamp in Asia/Ho_Chi_Minh', () => {
    expect(formatHcmcTimestampForFileName(new Date('2026-08-21T17:59:58.000Z'))).toBe(
      '20260822-005958',
    );
  });
});

describe('TeamResultsService lean leaderboard', () => {
  it('uses the shared comparator and returns only Team UI fields', async () => {
    const prisma = {
      team: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Team 1',
            totalPoints: 100,
            totalPlaySeconds: 300,
            progress: [
              {
                completedAt: new Date('2026-07-29T01:05:00.000Z'),
                station: { name: 'Station 1' },
              },
            ],
          },
          {
            id: 2,
            name: 'Team 2',
            totalPoints: 100,
            totalPlaySeconds: 300,
            progress: [
              {
                completedAt: new Date('2026-07-29T01:04:00.000Z'),
                station: { name: 'Station 2' },
              },
            ],
          },
        ]),
      },
      finalChallenge: {
        findFirst: jest.fn().mockResolvedValue({ id: 9 }),
      },
      finalSubmission: {
        findMany: jest.fn().mockResolvedValue([
          {
            teamId: 2,
            submittedAt: new Date('2026-07-29T02:00:00.000Z'),
          },
        ]),
      },
    };
    const eventLifecycle = { reconcileFinalStart: jest.fn().mockResolvedValue(0) };
    const service = new TeamResultsService(prisma as never, eventLifecycle as never);

    const leaderboard = await service.getLeanLeaderboard();

    expect(leaderboard).toEqual([
      {
        rank: 1,
        teamId: 2,
        teamName: 'Team 2',
        totalPoints: 100,
        completedStations: 1,
        totalPlaySeconds: 300,
      },
      {
        rank: 2,
        teamId: 1,
        teamName: 'Team 1',
        totalPoints: 100,
        completedStations: 1,
        totalPlaySeconds: 300,
      },
    ]);
    expect(JSON.stringify(leaderboard)).not.toContain('username');
    expect(prisma.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.any(Object) }),
    );
    expect(eventLifecycle.reconcileFinalStart).toHaveBeenCalledTimes(1);
  });
});
