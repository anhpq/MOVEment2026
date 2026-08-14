import type {LeaderboardEntryResponse} from "../api";

export function getTeamV2LeaderboardRows(
  rows: readonly LeaderboardEntryResponse[],
) {
  return [...rows];
}
