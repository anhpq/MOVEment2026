const inFlightRequests = new Map<string, Promise<unknown>>();

export const TEAM_RUNTIME_POLL_INTERVAL_MS = 15_000;

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
