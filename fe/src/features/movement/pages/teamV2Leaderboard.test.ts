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
  it("shows only the first five rows when the active Team is already included", () => {
    const visibleRows = getTeamV2LeaderboardRows(createRows(), "3");

    expect(visibleRows.map((row) => row.teamId)).toEqual([1, 2, 3, 4, 5]);
    expect(visibleRows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("appends an out-of-top-five active Team with display rank six", () => {
    const rows = createRows();
    const visibleRows = getTeamV2LeaderboardRows(rows, "9");

    expect(visibleRows.map((row) => row.teamId)).toEqual([1, 2, 3, 4, 5, 9]);
    expect(visibleRows.at(-1)?.rank).toBe(6);
    expect(rows[8].rank).toBe(9);
  });

  it("keeps the top five when the active Team is absent", () => {
    expect(getTeamV2LeaderboardRows(createRows(), "99")).toHaveLength(5);
  });
});
