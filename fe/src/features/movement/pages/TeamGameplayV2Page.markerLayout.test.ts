import {describe, expect, it} from "vitest";
import {
  getNonOverlappingStationLabelIds,
  getStationMarkerFontSize,
  getStationLabelLayouts,
  BASE_MARKER_SIZE,
  MAX_MARKER_SIZE,
  MIN_MARKER_SIZE,
  STATION_LABEL_HEIGHT,
  STATION_LABEL_WIDTH,
  type MarkerLabelSource,
  type MarkerLabelViewport,
} from "./teamV2MarkerLayout";
import {getStationMarkerAppearance} from "../markerAppearance";

const viewport: MarkerLabelViewport = {width: 400, height: 800};
const baseScale = 0.752;

function createMarker(): MarkerLabelSource {
  return {
    station: {id: "ST001"},
    x: 400,
    y: 300,
  };
}

function getLayout(scale = baseScale, x = 0, y = 0) {
  const layouts = getStationLabelLayouts([createMarker()], viewport, {x, y, scale});
  return layouts.get("ST001")!;
}

describe("TeamGameplayV2Page marker label layout", () => {
  it("keeps completed and locked markers in the visible appearance model", () => {
    expect(
      getStationMarkerAppearance({status: "Finished", backendStatus: "COMPLETED"}),
    ).toMatchObject({isCompleted: true, isLocked: false, opacity: 0.4});
    expect(
      getStationMarkerAppearance({status: "New", backendStatus: "LOCKED"}),
    ).toMatchObject({isCompleted: false, isLocked: true, opacity: 1});
  });

  it("anchors the compact points pill below its marker", () => {
    const layout = getLayout();

    expect(layout.anchorX).toBeCloseTo(300.8);
    expect(layout.anchorY).toBeCloseTo(225.6);
    expect(layout.labelScale).toBe(1);
    expect(layout.labelGap).toBe(6);
    expect(layout.markerSize).toBe(BASE_MARKER_SIZE);
    expect(layout.labelX).toBeCloseTo(layout.anchorX - STATION_LABEL_WIDTH / 2);
    expect(layout.labelY).toBeCloseTo(layout.anchorY + layout.labelGap);
  });

  it("clamps label scale and gap at minimum and maximum zoom", () => {
    const minimum = getLayout(baseScale * 0.8);
    const maximum = getLayout(baseScale * 5);

    expect(minimum.labelScale).toBe(0.85);
    expect(minimum.labelGap).toBeGreaterThanOrEqual(4);
    expect(minimum.labelGap).toBeLessThanOrEqual(8);
    expect(minimum.markerSize).toBe(MIN_MARKER_SIZE);
    expect(maximum.labelScale).toBe(1.15);
    expect(maximum.labelGap).toBe(8);
    expect(maximum.markerSize).toBe(MAX_MARKER_SIZE);
    expect(maximum.labelY + STATION_LABEL_HEIGHT * maximum.labelScale).toBeLessThanOrEqual(
      viewport.height - 4,
    );
  });

  it("moves marker and label by the same delta during pan without mutating marker coordinates", () => {
    const marker = createMarker();
    const before = JSON.stringify(marker);
    const initial = getStationLabelLayouts([marker], viewport, {x: 0, y: 0, scale: baseScale}).get("ST001")!;
    const panned = getStationLabelLayouts([marker], viewport, {x: 40, y: -41, scale: baseScale}).get("ST001")!;

    expect(panned.anchorX - initial.anchorX).toBeCloseTo(40);
    expect(panned.anchorY - initial.anchorY).toBeCloseTo(-41);
    expect(panned.labelX - initial.labelX).toBeCloseTo(40);
    expect(panned.labelY - initial.labelY).toBeCloseTo(-41);
    expect(JSON.stringify(marker)).toBe(before);
  });

  it("flags offscreen marker groups for render culling", () => {
    expect(getLayout().isInViewport).toBe(true);
    expect(getLayout(baseScale, -1_000, 0).isInViewport).toBe(false);
    expect(getLayout(baseScale, 0, 1_000).isInViewport).toBe(false);
  });

  it("shrinks marker text for station codes with up to four characters", () => {
    expect(getStationMarkerFontSize("02", BASE_MARKER_SIZE)).toBeCloseTo(12);
    expect(getStationMarkerFontSize("047", BASE_MARKER_SIZE)).toBeCloseTo(9.6);
    expect(getStationMarkerFontSize("ST04", BASE_MARKER_SIZE)).toBe(8);
  });

  it("keeps the selected label visible while suppressing overlapping labels", () => {
    const markers = [
      {...createMarker(), station: {id: "ST001"}},
      {...createMarker(), station: {id: "ST002"}},
      {...createMarker(), station: {id: "ST003"}, isSelected: true},
    ];
    const layouts = getStationLabelLayouts(markers, viewport, {x: 0, y: 0, scale: baseScale});
    const visible = getNonOverlappingStationLabelIds(layouts, viewport);

    expect(visible.has("ST003")).toBe(true);
    expect(visible.size).toBe(1);
  });

  it("clamps labels inside the visible viewport", () => {
    const layout = getLayout(baseScale, -240, -120);

    expect(layout.labelX).toBeGreaterThanOrEqual(4);
    expect(layout.labelY).toBeGreaterThanOrEqual(4);
  });
});
