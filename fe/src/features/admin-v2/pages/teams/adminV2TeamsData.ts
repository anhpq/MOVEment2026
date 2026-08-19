import {getAdminProgressMatrix, getAdminQrStatusSummary, type AdminProgressMatrixResponse} from "../../../movement/api";
import {normalizeTeamColor} from "../../../movement/teamTheme";

export type AdminV2TeamActivityStatus = "IN_PROGRESS" | "COMPLETED" | "PARTIALLY_COMPLETED" | "NO_ACTIVITY";
export type AdminV2TeamQrStatus = "ACTIVE" | "NONE" | "UNAVAILABLE";

export type AdminV2TeamListItem = Readonly<{
  id: number;
  name: string;
  username: string;
  captainName: string;
  color: string | null;
  totalPoints: number;
  completedStations: number;
  stationCount: number;
  totalPlaySeconds: number;
  lastActivityAt: string | null;
  activityStatus: AdminV2TeamActivityStatus;
  qrStatus: AdminV2TeamQrStatus;
}>;

export type AdminV2TeamsListResult = Readonly<{
  teams: readonly AdminV2TeamListItem[];
  qrStatusUnavailable: boolean;
}>;

function latestActivity(...timestamps: Array<string | null>) {
  const valid = timestamps.filter((value): value is string => value !== null && !Number.isNaN(Date.parse(value)));
  return valid.length > 0
    ? valid.reduce((latest, value) => Date.parse(value) > Date.parse(latest) ? value : latest)
    : null;
}

function activityStatus(cells: AdminProgressMatrixResponse["rows"][number]["cells"], stationCount: number): AdminV2TeamActivityStatus {
  if (cells.some((cell) => cell?.status === "CHECKED_IN" || cell?.status === "PLAYING")) return "IN_PROGRESS";
  if (stationCount > 0 && cells.filter((cell) => cell?.status === "COMPLETED").length === stationCount) return "COMPLETED";
  if (cells.some((cell) => cell?.status === "COMPLETED")) return "PARTIALLY_COMPLETED";
  return "NO_ACTIVITY";
}

export async function getAdminV2TeamsList(): Promise<AdminV2TeamsListResult> {
  const [matrix, qrSummary] = await Promise.all([
    getAdminProgressMatrix(),
    getAdminQrStatusSummary().catch(() => null),
  ]);
  const qrByTeamId = new Map(qrSummary?.teams.map((item) => [item.teamId, item.status]));

  return {
    teams: matrix.rows.map(({team, cells}) => ({
      id: team.id,
      name: team.name,
      username: team.username,
      captainName: team.captainName,
      color: normalizeTeamColor(team.teamColor ?? team.color),
      totalPoints: team.totalPoints,
      completedStations: cells.filter((cell) => cell?.status === "COMPLETED").length,
      stationCount: matrix.stations.length,
      totalPlaySeconds: team.totalPlaySeconds,
      lastActivityAt: latestActivity(...cells.flatMap((cell) => cell ? [cell.checkedInAt, cell.checkedOutAt, cell.completedAt] : [])),
      activityStatus: activityStatus(cells, matrix.stations.length),
      qrStatus: qrSummary === null ? "UNAVAILABLE" : qrByTeamId.get(team.id) ?? "NONE",
    })),
    qrStatusUnavailable: qrSummary === null,
  };
}
