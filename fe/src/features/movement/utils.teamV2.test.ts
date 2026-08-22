import {describe, expect, it} from "vitest";
import {
  formatDurationFromMs,
  formatMinutesSecondsFromMs,
  getCompactLocalizedTeamName,
} from "./utils";

describe("Team V2 compact display helpers", () => {
  it("formats elapsed time with total minutes", () => {
    expect(formatMinutesSecondsFromMs(65_000)).toBe("01:05");
    expect(formatMinutesSecondsFromMs(3_900_000)).toBe("65:00");
    expect(formatDurationFromMs(65_000)).toBe("00:01:05");
  });

  it("removes leading zero only from canonical Team names", () => {
    expect(getCompactLocalizedTeamName("Đội 03", "vi")).toBe("Đội 3");
    expect(getCompactLocalizedTeamName("Team 03", "en")).toBe("Team 3");
    expect(getCompactLocalizedTeamName("Biệt đội Sao", "vi")).toBe("Biệt đội Sao");
  });
});
