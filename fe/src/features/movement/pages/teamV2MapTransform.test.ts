import {describe, expect, it} from "vitest";
import {
  clampTeamV2MapScale,
  getTeamV2BaseMapScale,
  getTeamV2DefaultMapTransform,
  getTeamV2WheelZoomFactor,
  scaleTeamV2MapAtPoint,
  TEAM_V2_MAX_MAP_ZOOM_RATIO,
  TEAM_V2_MIN_MAP_ZOOM_RATIO,
} from "./teamV2MapTransform";

describe("Team V2 map zoom", () => {
  it.each([
    {width: 390, height: 844},
    {width: 844, height: 390},
  ])("clamps $width×$height zoom to the expanded range", (viewport) => {
    const baseScale = getTeamV2BaseMapScale(viewport);

    expect(clampTeamV2MapScale(0, viewport)).toBeCloseTo(
      baseScale * TEAM_V2_MIN_MAP_ZOOM_RATIO,
    );
    expect(clampTeamV2MapScale(Number.POSITIVE_INFINITY, viewport)).toBeCloseTo(
      baseScale * TEAM_V2_MAX_MAP_ZOOM_RATIO,
    );
  });

  it("keeps the focal world coordinate fixed while zooming and at both clamps", () => {
    const viewport = {width: 844, height: 390};
    const current = getTeamV2DefaultMapTransform(viewport);
    const point = {x: 317, y: 181};
    const worldPoint = {
      x: (point.x - current.x) / current.scale,
      y: (point.y - current.y) / current.scale,
    };

    for (const requestedScale of [current.scale * 3, 0, Number.POSITIVE_INFINITY]) {
      const next = scaleTeamV2MapAtPoint(current, requestedScale, point, viewport);
      expect((point.x - next.x) / next.scale).toBeCloseTo(worldPoint.x);
      expect((point.y - next.y) / next.scale).toBeCloseTo(worldPoint.y);
    }
  });

  it("resets to the exact centered base transform", () => {
    const viewport = {width: 390, height: 844};
    const transform = getTeamV2DefaultMapTransform(viewport);

    expect(transform.scale).toBe(getTeamV2BaseMapScale(viewport));
    expect(transform.x).toBeCloseTo((viewport.width - 2048 * transform.scale) / 2);
    expect(transform.y).toBeCloseTo((viewport.height - 1000 * transform.scale) / 2);
  });

  it("uses smooth trackpad deltas and stronger bounded mouse-wheel steps", () => {
    expect(getTeamV2WheelZoomFactor(-1)).toBeGreaterThan(1);
    expect(getTeamV2WheelZoomFactor(-100)).toBeGreaterThan(
      getTeamV2WheelZoomFactor(-1),
    );
    expect(getTeamV2WheelZoomFactor(100)).toBeLessThan(1);
    expect(getTeamV2WheelZoomFactor(-1000)).toBeCloseTo(
      getTeamV2WheelZoomFactor(-120),
    );
    expect(getTeamV2WheelZoomFactor(-3, 1)).toBeGreaterThan(
      getTeamV2WheelZoomFactor(-3),
    );
  });
});
