import {getAdminActivityLogs, getAdminProgressMatrix} from "../../../movement/api";

type UnknownRecord = Record<string, unknown>;

export type AdminV2ActivityLog = Readonly<{
  id: string;
  actorType: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  userId: number | null;
}>;

export type AdminV2ActivityLogData = Readonly<{
  logs: readonly AdminV2ActivityLog[];
  teamNames: ReadonlyMap<string, string>;
  stationNames: ReadonlyMap<string, {name: string; nameEn: string}>;
}>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asIdentifier(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  return typeof value === "number" && Number.isFinite(value) ? String(value) : null;
}

function asOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseLog(value: unknown): AdminV2ActivityLog | null {
  const item = asRecord(value);
  if (!item) return null;
  const id = asIdentifier(item.id);
  const actorType = asString(item.actorType);
  const actorId = asString(item.actorId);
  const action = asString(item.action);
  const entityType = asString(item.entityType);
  const entityId = asString(item.entityId);
  const createdAt = asString(item.createdAt);
  if (!id || !actorType || !actorId || !action || !entityType || !entityId || !createdAt) return null;
  return {id, actorType, actorId, action, entityType, entityId, metadata: item.metadata ?? null, createdAt, userId: asOptionalNumber(item.userId)};
}

export async function getAdminV2ActivityLogData(): Promise<AdminV2ActivityLogData> {
  const [logsResult, matrixResult] = await Promise.allSettled([getAdminActivityLogs(), getAdminProgressMatrix()]);
  if (logsResult.status !== "fulfilled" || !Array.isArray(logsResult.value)) throw new Error("activity logs unavailable");
  const teamNames = new Map<string, string>();
  const stationNames = new Map<string, {name: string; nameEn: string}>();
  if (matrixResult.status === "fulfilled") {
    matrixResult.value.rows.forEach(({team}) => teamNames.set(String(team.id), team.name));
    matrixResult.value.stations.forEach((station) => stationNames.set(station.id, {name: station.name, nameEn: station.nameEn}));
  }
  return {logs: logsResult.value.flatMap((item) => {
    const log = parseLog(item);
    return log ? [log] : [];
  }), teamNames, stationNames};
}

export function safeActivityMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeActivityMetadata);
  const record = asRecord(value);
  if (!record) return value;
  return Object.fromEntries(Object.entries(record).map(([key, child]) => [key, /token|password|secret|authorization|cookie|answer|keyword/i.test(key) ? "[redacted]" : safeActivityMetadata(child)]));
}
