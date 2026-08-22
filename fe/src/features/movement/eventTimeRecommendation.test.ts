import {describe, expect, it} from "vitest";
import {
  getRecommendedStationCloseTime,
  isRecommendedStationCloseTime,
} from "./eventTimeRecommendation";

describe("Event time recommendation", () => {
  it("returns the copy-ready time exactly fifteen minutes before Final", () => {
    expect(getRecommendedStationCloseTime("09:20")).toBe("09:05");
    expect(getRecommendedStationCloseTime("09:20:00")).toBe("09:05");
  });

  it("rejects invalid times and detects a different saved value", () => {
    expect(getRecommendedStationCloseTime("24:00")).toBeNull();
    expect(getRecommendedStationCloseTime("09:7")).toBeNull();
    expect(isRecommendedStationCloseTime("09:04", "09:20")).toBe(false);
    expect(isRecommendedStationCloseTime("09:05", "09:20")).toBe(true);
  });
});
