import {describe, expect, it} from "vitest";
import {
  getStationLabelLayouts,
  MARKER_LABEL_ATTACHMENT_OFFSET,
  STATION_LABEL_HEIGHT,
  STATION_LABEL_WIDTH,
  type MarkerLabelSource,
  type MarkerLabelViewport,
} from "./teamV2MarkerLayout";

const viewport: MarkerLabelViewport = {width: 400, height: 800};
const baseScale = 0.624;

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
  it("anchors the default label above its marker with one screen-space transform", () => {
    const layout = getLayout();

    expect(layout.anchorX).toBeCloseTo(249.6);
    expect(layout.anchorY).toBeCloseTo(187.2);
    expect(layout.labelScale).toBe(1);
    expect(layout.labelGap).toBe(6);
    expect(layout.labelX).toBeCloseTo(layout.anchorX - STATION_LABEL_WIDTH / 2);
    expect(layout.labelY + STATION_LABEL_HEIGHT).toBeCloseTo(
      layout.anchorY - MARKER_LABEL_ATTACHMENT_OFFSET - layout.labelGap,
    );
  });

  it("clamps label scale and gap at minimum and maximum zoom", () => {
    const minimum = getLayout(baseScale * 0.8);
    const maximum = getLayout(baseScale * 5);

    expect(minimum.labelScale).toBe(0.85);
    expect(minimum.labelGap).toBeGreaterThanOrEqual(4);
    expect(minimum.labelGap).toBeLessThanOrEqual(8);
    expect(maximum.labelScale).toBe(1.15);
    expect(maximum.labelGap).toBe(8);
    expect(maximum.labelY + STATION_LABEL_HEIGHT * maximum.labelScale).toBeCloseTo(
      maximum.anchorY - MARKER_LABEL_ATTACHMENT_OFFSET - maximum.labelGap,
    );
  });

  it("moves marker and label by the same delta during pan without mutating marker coordinates", () => {
    const marker = createMarker();
    const before = JSON.stringify(marker);
    const initial = getStationLabelLayouts([marker], viewport, {x: 0, y: 0, scale: baseScale}).get("ST001")!;
    const panned = getStationLabelLayouts([marker], viewport, {x: 73, y: -41, scale: baseScale}).get("ST001")!;

    expect(panned.anchorX - initial.anchorX).toBeCloseTo(73);
    expect(panned.anchorY - initial.anchorY).toBeCloseTo(-41);
    expect(panned.labelX - initial.labelX).toBeCloseTo(73);
    expect(panned.labelY - initial.labelY).toBeCloseTo(-41);
    expect(JSON.stringify(marker)).toBe(before);
  });
});
