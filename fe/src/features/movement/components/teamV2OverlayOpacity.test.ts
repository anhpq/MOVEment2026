import {readFileSync} from "node:fs";
import {resolve} from "node:path";
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

  it("applies the variable to surfaces but not buttons or header controls", () => {
    const demoCss = readFileSync(
      resolve(process.cwd(), "src/features/movement/pages/TeamGameplayV2Demo.css"),
      "utf8",
    );
    const scannerCss = readFileSync(
      resolve(process.cwd(), "src/features/movement/components/TeamV2QrScanner.css"),
      "utf8",
    );
    const buttonRule = demoCss.match(/\.team-v2-team-panel button:not\([\s\S]*?\n\}/)?.[0] ?? "";
    const headerRule = demoCss.match(/\.team-v2-overlay-header,[\s\S]*?\n\}/)?.[0] ?? "";

    expect(demoCss).toContain("rgba(0, 3, 8, var(--team-v2-overlay-opacity, .95))");
    expect(demoCss).toContain("rgba(4, 17, 29, var(--team-v2-overlay-opacity, .95))");
    expect(scannerCss).toContain("rgba(2, 10, 18, var(--team-v2-overlay-opacity, 0.95))");
    expect(buttonRule).not.toContain("--team-v2-overlay-opacity");
    expect(headerRule).not.toContain("--team-v2-overlay-opacity");
  });
});
