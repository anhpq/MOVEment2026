const inFlightRequests = new Map<string, Promise<unknown>>();

// Rollback baseline: keep these defaults at 15s/30s unless the runtime analysis,
// measurements, and tests are updated together.
export const TEAM_RUNTIME_POLL_INTERVAL_MS = 15_000;
export const TEAM_RUNTIME_REDUCED_DATA_POLL_INTERVAL_MS = 30_000;

export function shouldPollTeamRuntime(
  sessionRole: "user" | "admin" | null | undefined,
  phase: "NORMAL" | "NOTICE" | "STATIONS_CLOSED" | "FINAL_STARTED" | null | undefined,
) {
  return sessionRole === "user" && phase !== "FINAL_STARTED";
}

type NetworkConnectionLike = {
  saveData?: boolean;
  effectiveType?: string;
};

function getNetworkConnection() {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return (navigator as Navigator & {connection?: NetworkConnectionLike})
    .connection;
}

export function isReducedDataMode() {
  const connection = getNetworkConnection();
  const effectiveType = connection?.effectiveType?.toLowerCase();
  return (
    connection?.saveData === true ||
    effectiveType === "2g" ||
    effectiveType === "slow-2g"
  );
}

export function getTeamRuntimePollIntervalMs() {
  return isReducedDataMode() ?
      TEAM_RUNTIME_REDUCED_DATA_POLL_INTERVAL_MS
    : TEAM_RUNTIME_POLL_INTERVAL_MS;
}

export class StaleSessionResponseError extends Error {
  constructor() {
    super("STALE_SESSION_RESPONSE");
    this.name = "StaleSessionResponseError";
  }
}

export function isTeamRuntimeActive() {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return false;
  }
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function runSingleFlight<T>(key: string, request: () => Promise<T>) {
  const current = inFlightRequests.get(key) as Promise<T> | undefined;
  if (current) {
    return current;
  }

  const next = request().finally(() => {
    if (inFlightRequests.get(key) === next) {
      inFlightRequests.delete(key);
    }
  });
  inFlightRequests.set(key, next);
  return next;
}

export function clearSingleFlight(key: string) {
  inFlightRequests.delete(key);
}

export function clearRuntimeRequestCoordinator() {
  inFlightRequests.clear();
}
