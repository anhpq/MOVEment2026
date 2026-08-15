import {describe, expect, it} from "vitest";
import type {LeaderboardEntryResponse} from "../api";
import {getTeamV2LeaderboardRows} from "./teamV2Leaderboard";

function createRows(count = 10): LeaderboardEntryResponse[] {
  return Array.from({length: count}, (_, index) => ({
    rank: index + 1,
    teamId: index + 1,
    teamName: `Team ${index + 1}`,
    totalPoints: 100 - index,
    completedStations: index,
    totalPlaySeconds: index * 10,
  }));
}

describe("Team V2 leaderboard projection", () => {
  it("shows every authoritative leaderboard row", () => {
    const visibleRows = getTeamV2LeaderboardRows(createRows());

    expect(visibleRows.map((row) => row.teamId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(visibleRows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("keeps each Backend rank unchanged", () => {
    const rows = createRows();
    rows[8] = {...rows[8], rank: 27};
    const visibleRows = getTeamV2LeaderboardRows(rows);

    expect(visibleRows[8].rank).toBe(27);
    expect(rows[8].rank).toBe(27);
  });

  it("returns a copy so UI projection cannot mutate the response array", () => {
    const rows = createRows();
    expect(getTeamV2LeaderboardRows(rows)).not.toBe(rows);
  });
});
