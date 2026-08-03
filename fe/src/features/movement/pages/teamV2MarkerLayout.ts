export const STATION_LABEL_WIDTH = 68;
export const STATION_LABEL_HEIGHT = 22;

const MAP_WORLD_WIDTH = 2048;
const MAP_WORLD_HEIGHT = 1000;
const MARKER_DRAW_REFERENCE_WIDTH = 640;
const MARKER_REFERENCE_TIP_TO_TOP = 554;
export const MIN_MARKER_SIZE = 38;
export const BASE_MARKER_SIZE = 44;
export const MAX_MARKER_SIZE = 58;
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

export function getStationMarkerFontSize(code: string, markerSize: number) {
  const characterCount = Array.from(code.trim()).length;
  const scale = characterCount >= 4 ? 0.26 : characterCount === 3 ? 0.32 : 0.4;
  return Math.max(10, markerSize * scale);
}

type PrioritizedMarker = MarkerLabelSource & {
  isActive?: boolean;
  isSelected?: boolean;
};

export function getNonOverlappingStationLabelIds<T extends PrioritizedMarker>(
  layouts: ReadonlyMap<string, MarkerScreenLayout<T>>,
  viewport: MarkerLabelViewport,
) {
  const padding = viewport.width < 600 ? 5 : 8;
  const candidates = [...layouts.values()]
    .filter((layout) => layout.isInViewport)
    .sort((left, right) =>
      Number(Boolean(right.marker.isSelected)) - Number(Boolean(left.marker.isSelected)) ||
      Number(Boolean(right.marker.isActive)) - Number(Boolean(left.marker.isActive)),
    );
  const occupied: Array<{left: number; right: number; top: number; bottom: number}> = [];
  const visible = new Set<string>();

  for (const layout of candidates) {
    const width = STATION_LABEL_WIDTH * layout.labelScale;
    const height = STATION_LABEL_HEIGHT * layout.labelScale;
    const box = {
      left: clamp(layout.labelX, padding, Math.max(padding, viewport.width - width - padding)),
      right: 0,
      top: clamp(layout.labelY, padding, Math.max(padding, viewport.height - height - padding)),
      bottom: 0,
    };
    box.right = box.left + width;
    box.bottom = box.top + height;
    const overlaps = occupied.some((other) =>
      box.left < other.right + padding &&
      box.right + padding > other.left &&
      box.top < other.bottom + padding &&
      box.bottom + padding > other.top,
    );
    if (!overlaps || layout.marker.isSelected) {
      visible.add(layout.marker.station.id);
      occupied.push(box);
    }
  }

  return visible;
}

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
      labelX: clamp(anchorX - scaledLabelWidth / 2, 4, Math.max(4, viewport.width - scaledLabelWidth - 4)),
      labelY: clamp(anchorY + labelGap, 4, Math.max(4, viewport.height - scaledLabelHeight - 4)),
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
