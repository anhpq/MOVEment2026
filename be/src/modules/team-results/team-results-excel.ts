import * as ExcelJS from 'exceljs';
import { RankedTeamResults } from './team-results.service';

const HCMC_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DATETIME_NUM_FMT = 'dd/mm/yyyy hh:mm:ss';
const DURATION_NUM_FMT = '[h]:mm:ss';

export function formatHcmcTimestampForFileName(date = new Date()) {
  const parts = getHcmcDateParts(date);
  return `${parts.year}${pad(parts.month)}${pad(parts.day)}-${pad(parts.hour)}${pad(parts.minute)}${pad(parts.second)}`;
}

export async function buildTeamResultsWorkbook(results: RankedTeamResults) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MOVEment 2026';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Team Results', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  const headers = [
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
    ...results.stationColumns.flatMap((station) => [
      `${station.header} - Check-in`,
      `${station.header} - Check-out`,
      `${station.header} - Score`,
    ]),
  ];
  worksheet.addRow(headers);
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle', wrapText: true };

  for (const row of results.rows) {
    worksheet.addRow([
      row.teamCode,
      row.teamName,
      row.captainName,
      row.username,
      row.completedStations,
      secondsToExcelDuration(row.rankTotalPlaySeconds),
      row.rankTotalScore,
      row.computedScore,
      row.rank,
      dateToHcmcExcelSerial(row.finalSubmittedAt),
      row.finalRank ?? '',
      row.finalBonusScore,
      ...results.stationColumns.flatMap((station) => {
        const result = row.stations[station.id];
        return [
          dateToHcmcExcelSerial(result?.checkedInAt ?? null),
          dateToHcmcExcelSerial(result?.checkedOutAt ?? null),
          result?.score ?? 0,
        ];
      }),
    ]);
  }

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, worksheet.rowCount), column: headers.length },
  };
  worksheet.columns.forEach((column, index) => {
    column.width = getColumnWidth(headers[index] ?? '');
  });
  worksheet.getColumn(6).numFmt = DURATION_NUM_FMT;
  worksheet.getColumn(10).numFmt = DATETIME_NUM_FMT;
  for (let columnIndex = 13; columnIndex <= headers.length; columnIndex += 3) {
    worksheet.getColumn(columnIndex).numFmt = DATETIME_NUM_FMT;
    worksheet.getColumn(columnIndex + 1).numFmt = DATETIME_NUM_FMT;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getHcmcDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: HCMC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const values = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function dateToHcmcExcelSerial(date: Date | null) {
  if (!date) {
    return '';
  }
  const parts = getHcmcDateParts(date);
  const utcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return utcMs / 86_400_000 + 25_569;
}

function secondsToExcelDuration(seconds: number) {
  return Math.max(0, seconds) / 86_400;
}

function getColumnWidth(header: string) {
  if (header.includes(' - ')) {
    return 22;
  }
  if (header === 'Team Name' || header === 'Captain Name') {
    return 24;
  }
  if (header === 'Final Submitted At' || header === 'Total Play Time') {
    return 20;
  }
  return Math.max(12, Math.min(18, header.length + 2));
}
