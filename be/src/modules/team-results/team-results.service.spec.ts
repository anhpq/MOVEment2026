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
        { id: 'ST001', name: 'Station', header: 'Station', trackingMode: 'BOTH' },
        { id: 'ST002', name: 'Station', header: 'Station (#02)', trackingMode: 'SCORE' },
        { id: 'ST003', name: 'Timer', header: 'Timer', trackingMode: 'TIME' },
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
              score: 30,
              completed: true,
            },
            ST002: {
              stationId: 'ST002',
              checkedInAt: new Date('2026-08-21T07:10:00.000Z'),
              checkedOutAt: new Date('2026-08-21T07:15:00.000Z'),
              score: 25,
              completed: true,
            },
            ST003: {
              stationId: 'ST003',
              checkedInAt: null,
              checkedOutAt: null,
              score: 0,
              completed: false,
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
      'Rank',
      'Final Submitted At',
      'Final Rank',
      'Final Bonus Score',
      'Station [Both time and score] - Check-in',
      'Station [Both time and score] - Check-out',
      'Station [Both time and score] - Score',
      'Station (#02) [Score only] - Check-in',
      'Station (#02) [Score only] - Check-out',
      'Station (#02) [Score only] - Score',
      'Timer [Time only] - Check-in',
      'Timer [Time only] - Check-out',
      'Timer [Time only] - Score',
    ]);
    const headerValues = worksheet!.getRow(1).values as unknown[];
    expect(worksheet!.getCell('P2').value).not.toBe('');
    expect(worksheet!.getCell('Q2').value).not.toBe('');
    expect(worksheet!.getCell('P2').value).not.toEqual(worksheet!.getCell('Q2').value);
    expect(
      headerValues.some(
        (value) => typeof value === 'string' && value.endsWith(' - Duration'),
      ),
    ).toBe(false);
    expect(headerValues).not.toContain('Team Color');
    expect(headerValues).not.toContain('Team Status');
    expect(headerValues).not.toContain('Total Stations');
    expect(headerValues).not.toContain('Final Challenge Status');
    expect(worksheet!.getColumn(6).numFmt).toBe('[h]:mm:ss');
    expect(worksheet!.getColumn(10).numFmt).toBe('dd/mm/yyyy hh:mm:ss');
    expect(JSON.stringify(worksheet!.getSheetValues())).not.toContain('answerSubmitted');
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
    const service = new TeamResultsService(prisma as never);

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
  });
});
