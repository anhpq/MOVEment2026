import {describe, expect, it} from "vitest";
import {
  getTeamV2StationPhaseOpacity,
  shouldAnimateTeamV2GatheringPoint,
  shouldShowTeamV2GatheringPoint,
  TEAM_V2_GATHERING_POINT,
} from "./teamV2FinalNotice";

describe("Team V2 gathering point notice marker", () => {
  it("uses the approved map position", () => {
    expect(TEAM_V2_GATHERING_POINT).toMatchObject({mapX: 65.56, mapY: 68.94});
  });

  it("is always visible whenever the Team V2 map is rendered", () => {
    expect(shouldShowTeamV2GatheringPoint()).toBe(true);
  });

  it.each(["NOTICE", "STATIONS_CLOSED"] as const)(
    "animates during %s",
    (phase) => {
      expect(shouldAnimateTeamV2GatheringPoint(phase)).toBe(true);
    },
  );

  it.each(["NORMAL", "FINAL_STARTED", null, undefined] as const)(
    "stays static during %s",
    (phase) => {
      expect(shouldAnimateTeamV2GatheringPoint(phase)).toBe(false);
    },
  );

  it("dims only Station presentation after Station play closes", () => {
    expect(getTeamV2StationPhaseOpacity(0.8, "STATIONS_CLOSED")).toBeCloseTo(0.44);
    expect(getTeamV2StationPhaseOpacity(0.8, "NOTICE")).toBe(0.8);
    expect(getTeamV2StationPhaseOpacity(0.8, "NORMAL")).toBe(0.8);
  });
});
