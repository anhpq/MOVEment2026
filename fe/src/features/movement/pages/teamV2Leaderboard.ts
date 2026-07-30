import type {LeaderboardEntryResponse} from "../api";

const TEAM_V2_LEADERBOARD_TOP_COUNT = 5;

export function getTeamV2LeaderboardRows(
  rows: readonly LeaderboardEntryResponse[],
  activeTeamId: string | number | null | undefined,
) {
  const topRows = rows.slice(0, TEAM_V2_LEADERBOARD_TOP_COUNT);
  const normalizedActiveTeamId = activeTeamId == null ? null : String(activeTeamId);
  if (
    normalizedActiveTeamId === null ||
    topRows.some((row) => String(row.teamId) === normalizedActiveTeamId)
  ) {
    return topRows;
  }

  const currentTeamRow = rows.find(
    (row) => String(row.teamId) === normalizedActiveTeamId,
  );
  return currentTeamRow ? [...topRows, {...currentTeamRow, rank: 6}] : topRows;
}
