import {describe, expect, it} from "vitest";
import {
  shouldShowTeamV2GatheringPoint,
  TEAM_V2_GATHERING_POINT,
} from "./teamV2FinalNotice";

describe("Team V2 gathering point notice marker", () => {
  it("uses the approved map position", () => {
    expect(TEAM_V2_GATHERING_POINT).toMatchObject({mapX: 65.56, mapY: 68.94});
  });

  it.each(["NOTICE", "STATIONS_CLOSED"] as const)(
    "is visible during %s",
    (phase) => {
      expect(shouldShowTeamV2GatheringPoint(phase)).toBe(true);
    },
  );

  it.each(["NORMAL", "FINAL_STARTED", null, undefined] as const)(
    "is hidden during %s",
    (phase) => {
      expect(shouldShowTeamV2GatheringPoint(phase)).toBe(false);
    },
  );
});
