export const STATION_LABEL_WIDTH = 120;
export const STATION_LABEL_HEIGHT = 44;

const MAP_WORLD_WIDTH = 2048;
const MAP_WORLD_HEIGHT = 1000;
const MARKER_DRAW_REFERENCE_WIDTH = 640;
const MARKER_REFERENCE_TIP_TO_TOP = 554;
export const MIN_MARKER_SIZE = 32;
export const BASE_MARKER_SIZE = 40;
export const MAX_MARKER_SIZE = 64;
const BASE_MARKER_LABEL_GAP = 6;
const MIN_MARKER_LABEL_GAP = 4;
const MAX_MARKER_LABEL_GAP = 8;
const MIN_MARKER_LABEL_SCALE = 0.85;
const MAX_MARKER_LABEL_SCALE = 1.15;

export type MarkerLabelViewport = {
  width: number;
  height: number;
};

export type MarkerLabelTransform = {
  x: number;
  y: number;
  scale: number;
};

export type MarkerLabelSource = {
  station: {id: string};
  x: number;
  y: number;
};

export type MarkerScreenLayout<T extends MarkerLabelSource = MarkerLabelSource> = {
  marker: T;
  anchorX: number;
  anchorY: number;
  labelX: number;
  labelY: number;
  labelScale: number;
  labelGap: number;
  markerSize: number;
  markerAttachmentOffset: number;
  isInViewport: boolean;
};

function getBaseMapScale(viewport: MarkerLabelViewport) {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return 1;
  }
  if (viewport.height > viewport.width) {
    return (viewport.height * 0.78) / MAP_WORLD_HEIGHT;
  }
  return Math.min(
    viewport.width / MAP_WORLD_WIDTH,
    viewport.height / MAP_WORLD_HEIGHT,
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function getStationLabelLayouts<T extends MarkerLabelSource>(
  markers: readonly T[],
  viewport: MarkerLabelViewport,
  transform: MarkerLabelTransform,
) {
  const zoomRatio = transform.scale / getBaseMapScale(viewport);
  const labelScale = clamp(zoomRatio, MIN_MARKER_LABEL_SCALE, MAX_MARKER_LABEL_SCALE);
  const labelGap = clamp(
    BASE_MARKER_LABEL_GAP * zoomRatio,
    MIN_MARKER_LABEL_GAP,
    MAX_MARKER_LABEL_GAP,
  );
  const markerSize = clamp(
    BASE_MARKER_SIZE * zoomRatio,
    MIN_MARKER_SIZE,
    MAX_MARKER_SIZE,
  );
  const markerAttachmentOffset =
    markerSize * (MARKER_REFERENCE_TIP_TO_TOP / MARKER_DRAW_REFERENCE_WIDTH);
  const scaledLabelWidth = STATION_LABEL_WIDTH * labelScale;
  const scaledLabelHeight = STATION_LABEL_HEIGHT * labelScale;
  const layouts = new Map<string, MarkerScreenLayout<T>>();

  for (const marker of markers) {
    const anchorX = transform.x + marker.x * transform.scale;
    const anchorY = transform.y + marker.y * transform.scale;
    layouts.set(marker.station.id, {
      marker,
      anchorX,
      anchorY,
      labelX: anchorX - scaledLabelWidth / 2,
      labelY: anchorY - markerAttachmentOffset - labelGap - scaledLabelHeight,
      labelScale,
      labelGap,
      markerSize,
      markerAttachmentOffset,
      isInViewport:
        anchorX >= -24 &&
        anchorX <= viewport.width + 24 &&
        anchorY >= -24 &&
        anchorY <= viewport.height + 24,
    });
  }

  return layouts;
}
