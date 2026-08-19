import {
  getAdminDashboard,
  getAdminFinalSubmissions,
  getAdminScoreQueue,
} from "../../../movement/api";

type UnknownRecord = Record<string, unknown>;

export type AdminV2EventConfig = Readonly<{
  eventEndTime: string;
  finalStartsAt: string;
  timezone: string;
  notifyBeforeMinutes: number;
  secondsUntilFinal: number;
  isPastEventEnd: boolean;
  isPastFinalStart: boolean;
}>;

export type AdminV2ActivityLog = Readonly<{
  id: string;
  action: string;
  createdAt: string;
}>;

export type AdminV2DashboardData = Readonly<{
  teamCount: number;
  stationCount: number;
  completedCount: number;
  activePlayingCount: number;
  eventConfig: AdminV2EventConfig;
  latestLogs: readonly AdminV2ActivityLog[];
  pendingScoreCount: number;
  finalSubmissionCount: number;
}>;

export type AdminV2DashboardResult = Readonly<{
  data: Partial<AdminV2DashboardData>;
  errors: readonly ("dashboard" | "scoreQueue" | "finalSubmissions")[];
}>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function asFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown) {
  return value === true;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function parseEventConfig(value: unknown): AdminV2EventConfig | null {
  const config = asRecord(value);
  if (!config) return null;

  const eventEndTime = asString(config.eventEndTime);
  const finalStartsAt = asString(config.finalStartsAt);
  const timezone = asString(config.timezone);
  const notifyBeforeMinutes = asFiniteNumber(config.notifyBeforeMinutes);
  const secondsUntilFinal = asFiniteNumber(config.secondsUntilFinal);
  if (!eventEndTime || !finalStartsAt || !timezone || notifyBeforeMinutes === null || secondsUntilFinal === null
    || typeof config.isPastEventEnd !== "boolean" || typeof config.isPastFinalStart !== "boolean") return null;

  return {
    eventEndTime,
    finalStartsAt,
    timezone,
    notifyBeforeMinutes,
    secondsUntilFinal,
    isPastEventEnd: asBoolean(config.isPastEventEnd),
    isPastFinalStart: asBoolean(config.isPastFinalStart),
  };
}

function parseActivityLogs(value: unknown): readonly AdminV2ActivityLog[] | null {
  if (!Array.isArray(value)) return null;

  return value.flatMap((item) => {
    const log = asRecord(item);
    if (!log) return [];
    const id = asString(log.id);
    const action = asString(log.action);
    const createdAt = asString(log.createdAt);
    return id && action && createdAt ? [{id, action, createdAt}] : [];
  });
}

function parseDashboard(value: unknown): Omit<AdminV2DashboardData, "pendingScoreCount" | "finalSubmissionCount"> | null {
  const dashboard = asRecord(value);
  if (!dashboard) return null;
  const eventConfig = parseEventConfig(dashboard.eventConfig);
  const teamCount = asFiniteNumber(dashboard.teamCount);
  const stationCount = asFiniteNumber(dashboard.stationCount);
  const completedCount = asFiniteNumber(dashboard.completedCount);
  const activePlayingCount = asFiniteNumber(dashboard.activePlayingCount);
  const latestLogs = parseActivityLogs(dashboard.latestLogs);
  if (!eventConfig || teamCount === null || stationCount === null || completedCount === null || activePlayingCount === null || latestLogs === null) return null;

  return {
    teamCount,
    stationCount,
    completedCount,
    activePlayingCount,
    eventConfig,
    latestLogs,
  };
}

export async function getAdminV2DashboardData(): Promise<AdminV2DashboardResult> {
  const [dashboardResult, scoreQueueResult, finalSubmissionsResult] = await Promise.allSettled([
    getAdminDashboard(),
    getAdminScoreQueue(),
    getAdminFinalSubmissions(),
  ]);
  const data: {-readonly [Key in keyof AdminV2DashboardData]?: AdminV2DashboardData[Key]} = {};
  const errors: ("dashboard" | "scoreQueue" | "finalSubmissions")[] = [];

  if (dashboardResult.status === "fulfilled") {
    const dashboard = parseDashboard(dashboardResult.value);
    if (dashboard) {
      Object.assign(data, dashboard);
    } else {
      errors.push("dashboard");
    }
  } else {
    errors.push("dashboard");
  }

  if (scoreQueueResult.status === "fulfilled" && Array.isArray(scoreQueueResult.value)) {
    data.pendingScoreCount = scoreQueueResult.value.length;
  } else {
    errors.push("scoreQueue");
  }

  if (finalSubmissionsResult.status === "fulfilled" && Array.isArray(finalSubmissionsResult.value)) {
    data.finalSubmissionCount = finalSubmissionsResult.value.length;
  } else {
    errors.push("finalSubmissions");
  }

  return {data, errors};
}
