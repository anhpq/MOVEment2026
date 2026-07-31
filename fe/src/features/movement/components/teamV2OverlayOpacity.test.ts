import {describe, expect, it} from "vitest";
import {
  DEFAULT_TEAM_V2_OVERLAY_OPACITY,
  getTeamV2OverlayStyle,
} from "./teamV2OverlayOpacity";

describe("Team V2 overlay opacity", () => {
  it("uses the 95 percent default as a background-only CSS variable", () => {
    const style = getTeamV2OverlayStyle(DEFAULT_TEAM_V2_OVERLAY_OPACITY);

    expect(style).toEqual({"--team-v2-overlay-opacity": 0.95});
    expect(style).not.toHaveProperty("opacity");
  });

  it("clamps persisted values without applying opacity to overlay content", () => {
    expect(getTeamV2OverlayStyle(-10)).toEqual({"--team-v2-overlay-opacity": 0});
    expect(getTeamV2OverlayStyle(120)).toEqual({"--team-v2-overlay-opacity": 1});
    expect(getTeamV2OverlayStyle(Number.NaN)).toEqual({"--team-v2-overlay-opacity": 0.95});
  });
});
