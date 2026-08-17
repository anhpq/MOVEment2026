import type {PlayerFinalSummary} from "../types";

export const TEAM_V2_GATHERING_POINT = {
  id: "team-v2-gathering-point",
  mapX: 65.56,
  mapY: 68.94,
} as const;

export function shouldShowTeamV2GatheringPoint(
  phase: PlayerFinalSummary["phase"] | null | undefined,
) {
  return phase === "NOTICE" || phase === "STATIONS_CLOSED";
}
