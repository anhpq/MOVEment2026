import {useEffect, useMemo, useRef, useState} from "react";
import {
  getPlayerStationPlayingCounts,
  isAuthFailure,
  type StationPlayingCountResponse,
} from "../api";
import {useMovementStore} from "../store";
import type {TeamStation} from "../types";

function buildFallbackCounts(teamStations: Record<string, TeamStation[]>) {
  const counts: Record<string, number> = {};
  Object.values(teamStations).forEach((stations) => {
    stations.forEach((station) => {
      if (
        station.backendStatus === "CHECKED_IN" ||
        station.backendStatus === "PLAYING"
      ) {
        counts[station.stationId] = (counts[station.stationId] ?? 0) + 1;
      }
    });
  });
  return counts;
}

function normalizeCounts(rows: StationPlayingCountResponse[]) {
  return Object.fromEntries(
    rows.map((row) => [row.stationId, row.playingTeamCount]),
  );
}

export function useStationPlayingCounts(enabled: boolean) {
  const teamStations = useMovementStore((state) => state.teamStations);
  const logout = useMovementStore((state) => state.logout);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasLiveCounts, setHasLiveCounts] = useState(false);
  const isFetchingRef = useRef(false);

  const fallbackCounts = useMemo(
    () => buildFallbackCounts(teamStations),
    [teamStations],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      if (
        cancelled ||
        isFetchingRef.current ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      isFetchingRef.current = true;
      try {
        const rows = await getPlayerStationPlayingCounts();
        if (!cancelled) {
          setCounts(normalizeCounts(rows));
          setHasLiveCounts(true);
        }
      } catch (error: unknown) {
        if (!cancelled && isAuthFailure(error)) {
          logout();
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, logout]);

  return enabled && hasLiveCounts ? counts : fallbackCounts;
}
