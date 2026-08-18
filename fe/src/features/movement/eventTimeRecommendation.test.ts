import {describe, expect, it} from "vitest";
import {
  getRecommendedStationCloseTime,
  isFiveMinutesBeforeFinal,
} from "./eventTimeRecommendation";

describe("Event time recommendation", () => {
  it("returns the copy-ready time exactly five minutes before Final", () => {
    expect(getRecommendedStationCloseTime("09:20")).toBe("09:15");
    expect(getRecommendedStationCloseTime("09:20:00")).toBe("09:15");
  });

  it("rejects invalid times and detects a different saved value", () => {
    expect(getRecommendedStationCloseTime("24:00")).toBeNull();
    expect(getRecommendedStationCloseTime("09:7")).toBeNull();
    expect(isFiveMinutesBeforeFinal("09:14", "09:20")).toBe(false);
    expect(isFiveMinutesBeforeFinal("09:15", "09:20")).toBe(true);
  });
});
