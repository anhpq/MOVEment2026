import * as ExcelJS from 'exceljs';
import { compareTeamResultRows } from './team-results.service';
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
      'Station - Check-in',
      'Station - Check-out',
      'Station - Score',
      'Station (#02) - Check-in',
      'Station (#02) - Check-out',
      'Station (#02) - Score',
    ]);
    expect(worksheet!.getRow(1).values).not.toContain('Team Color');
    expect(worksheet!.getRow(1).values).not.toContain('Team Status');
    expect(worksheet!.getRow(1).values).not.toContain('Total Stations');
    expect(worksheet!.getRow(1).values).not.toContain('Final Challenge Status');
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
