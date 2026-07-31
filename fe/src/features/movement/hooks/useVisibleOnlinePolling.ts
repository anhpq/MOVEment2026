import {useEffect, useRef} from "react";
import {
  isTeamRuntimeActive,
  TEAM_RUNTIME_POLL_INTERVAL_MS,
} from "../runtimeCoordinator";

type VisibleOnlinePollingOptions = {
  enabled?: boolean;
  intervalMs?: number;
  runImmediately?: boolean;
};

export function useVisibleOnlinePolling(
  callback: () => unknown | Promise<unknown>,
  {
    enabled = true,
    intervalMs = TEAM_RUNTIME_POLL_INTERVAL_MS,
    runImmediately = true,
  }: VisibleOnlinePollingOptions = {},
) {
  const callbackRef = useRef(callback);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      if (cancelled || inFlightRef.current || !isTeamRuntimeActive()) {
        return;
      }

      inFlightRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        inFlightRef.current = false;
      }
    };
    const refreshWhenActive = () => {
      if (isTeamRuntimeActive()) {
        void refresh();
      }
    };

    if (runImmediately) {
      void refresh();
    }
    const timer = window.setInterval(() => void refresh(), intervalMs);
    document.addEventListener("visibilitychange", refreshWhenActive);
    window.addEventListener("online", refreshWhenActive);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenActive);
      window.removeEventListener("online", refreshWhenActive);
    };
  }, [enabled, intervalMs, runImmediately]);
}
