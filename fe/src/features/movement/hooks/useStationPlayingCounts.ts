import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  getPlayerStationPlayingCounts,
  isAuthFailure,
  type StationPlayingCountResponse,
} from "../api";
import {useMovementStore} from "../store";
import {shouldPollTeamRuntime} from "../runtimeCoordinator";
import type {TeamStation} from "../types";
import {useVisibleOnlinePolling} from "./useVisibleOnlinePolling";

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
  const sessionRole = useMovementStore((state) => state.session?.role);
  const finalPhase = useMovementStore((state) => state.finalSummary?.phase);
  const logout = useMovementStore((state) => state.logout);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasLiveCounts, setHasLiveCounts] = useState(false);
  const mountedRef = useRef(false);

  const fallbackCounts = useMemo(
    () => buildFallbackCounts(teamStations),
    [teamStations],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const rows = await getPlayerStationPlayingCounts();
      if (mountedRef.current) {
        setCounts(normalizeCounts(rows));
        setHasLiveCounts(true);
      }
    } catch (error: unknown) {
      if (mountedRef.current && isAuthFailure(error)) {
        logout();
      }
    }
  }, [logout]);

  const pollingEnabled = enabled && shouldPollTeamRuntime(sessionRole, finalPhase);

  useVisibleOnlinePolling(refresh, {enabled: pollingEnabled});

  return pollingEnabled && hasLiveCounts ? counts : fallbackCounts;
}
