import {useEffect, useRef} from "react";
import {
  getTeamRuntimePollIntervalMs,
  isTeamRuntimeActive,
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
    intervalMs,
    runImmediately = true,
  }: VisibleOnlinePollingOptions = {},
) {
  const callbackRef = useRef(callback);
  const inFlightRef = useRef(false);
  const resolvedIntervalMs = intervalMs ?? getTeamRuntimePollIntervalMs();

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
    const timer = window.setInterval(() => void refresh(), resolvedIntervalMs);
    document.addEventListener("visibilitychange", refreshWhenActive);
    window.addEventListener("online", refreshWhenActive);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenActive);
      window.removeEventListener("online", refreshWhenActive);
    };
  }, [enabled, resolvedIntervalMs, runImmediately]);
}
