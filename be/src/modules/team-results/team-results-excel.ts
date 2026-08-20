import * as ExcelJS from 'exceljs';
import { RankedTeamResults } from './team-results.service';

const HCMC_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DATETIME_NUM_FMT = 'dd/mm/yyyy hh:mm:ss';
const MILLIS_DATETIME_NUM_FMT = 'dd/mm/yyyy hh:mm:ss.000';
const DURATION_NUM_FMT = '[h]:mm:ss';
const MILLIS_DURATION_NUM_FMT = '[h]:mm:ss.000';
const STATION_TRACKING_MODE_LABELS = {
  SCORE: 'Score only',
  TIME: 'Time only',
  BOTH: 'Both time and score',
} satisfies Record<RankedTeamResults['stationColumns'][number]['trackingMode'], string>;

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
    'Warnings',
    'Rank',
    'Final Submitted At',
    'Final Rank',
    'Final Bonus Score',
    ...results.stationColumns.flatMap((station) => {
      const stationHeader = `${station.header} [${STATION_TRACKING_MODE_LABELS[station.trackingMode]}]`;
      return station.id === 'ST009' ? [
        `${stationHeader} - Check-in`,
        `${stationHeader} - Check-out`,
        `${stationHeader} - Duration`,
        `${stationHeader} - Station Rank`,
        `${stationHeader} - Score`,
      ] : [
        `${stationHeader} - Check-in`,
        `${stationHeader} - Check-out`,
        `${stationHeader} - Score`,
      ];
    }),
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
      row.warnings ?? '',
      row.rank,
      dateToHcmcExcelSerial(row.finalSubmittedAt),
      row.finalRank ?? '',
      row.finalBonusScore,
      ...results.stationColumns.flatMap((station) => {
        const result = row.stations[station.id];
        if (station.id === 'ST009') {
          const durationMs = result?.checkedInAt && result.checkedOutAt
            ? Math.max(0, result.checkedOutAt.getTime() - result.checkedInAt.getTime()) : 0;
          return [dateToHcmcExcelSerial(result?.checkedInAt ?? null), dateToHcmcExcelSerial(result?.checkedOutAt ?? null), durationMs / 86_400_000, result?.stationRank ?? '', result?.score ?? 0];
        }
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
  worksheet.getColumn(11).numFmt = DATETIME_NUM_FMT;
  let columnIndex = 14;
  for (const station of results.stationColumns) {
    worksheet.getColumn(columnIndex).numFmt = station.id === 'ST009' ? MILLIS_DATETIME_NUM_FMT : DATETIME_NUM_FMT;
    worksheet.getColumn(columnIndex + 1).numFmt = station.id === 'ST009' ? MILLIS_DATETIME_NUM_FMT : DATETIME_NUM_FMT;
    if (station.id === 'ST009') {
      worksheet.getColumn(columnIndex + 2).numFmt = MILLIS_DURATION_NUM_FMT;
      columnIndex += 5;
    } else {
      columnIndex += 3;
    }
  }
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    let scoreColumn = 16;
    for (const station of results.stationColumns) {
      if (station.id !== 'ST009' && station.referencePoints !== null && station.referencePoints !== undefined) {
        const scoreCell = worksheet.getCell(rowIndex, scoreColumn);
        if (typeof scoreCell.value === 'number' && scoreCell.value > station.referencePoints) {
          scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
          scoreCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }
      }
      scoreColumn += station.id === 'ST009' ? 5 : 3;
    }
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
    date.getMilliseconds(),
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
