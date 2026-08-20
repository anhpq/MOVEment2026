export const TEAM_V2_MAP_WORLD_WIDTH = 2048;
export const TEAM_V2_MAP_WORLD_HEIGHT = 1000;
export const TEAM_V2_MIN_MAP_ZOOM_RATIO = 0.5;
export const TEAM_V2_MAX_MAP_ZOOM_RATIO = 8;

export type TeamV2ViewportSize = {
  width: number;
  height: number;
};

export type TeamV2MapTransform = {
  x: number;
  y: number;
  scale: number;
};

export function getTeamV2BaseMapScale(viewport: TeamV2ViewportSize) {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return 1;
  }
  if (viewport.height > viewport.width) {
    return (viewport.height * 0.94) / TEAM_V2_MAP_WORLD_HEIGHT;
  }
  return Math.min(
    viewport.width / TEAM_V2_MAP_WORLD_WIDTH,
    viewport.height / TEAM_V2_MAP_WORLD_HEIGHT,
  );
}

export function clampTeamV2MapScale(value: number, viewport: TeamV2ViewportSize) {
  const baseScale = getTeamV2BaseMapScale(viewport);
  return Math.max(
    baseScale * TEAM_V2_MIN_MAP_ZOOM_RATIO,
    Math.min(baseScale * TEAM_V2_MAX_MAP_ZOOM_RATIO, value),
  );
}

export function getTeamV2DefaultMapTransform(
  viewport: TeamV2ViewportSize,
): TeamV2MapTransform {
  const scale = getTeamV2BaseMapScale(viewport);
  return {
    scale,
    x: (viewport.width - TEAM_V2_MAP_WORLD_WIDTH * scale) / 2,
    y: (viewport.height - TEAM_V2_MAP_WORLD_HEIGHT * scale) / 2,
  };
}

export function scaleTeamV2MapAtPoint(
  current: TeamV2MapTransform,
  requestedScale: number,
  point: {x: number; y: number},
  viewport: TeamV2ViewportSize,
): TeamV2MapTransform {
  return scaleTeamV2MapFromGesture(current, requestedScale, point, point, viewport);
}

export function scaleTeamV2MapFromGesture(
  initial: TeamV2MapTransform,
  requestedScale: number,
  initialPoint: {x: number; y: number},
  currentPoint: {x: number; y: number},
  viewport: TeamV2ViewportSize,
): TeamV2MapTransform {
  const scale = clampTeamV2MapScale(requestedScale, viewport);
  const worldPoint = {
    x: (initialPoint.x - initial.x) / initial.scale,
    y: (initialPoint.y - initial.y) / initial.scale,
  };
  return {
    scale,
    x: currentPoint.x - worldPoint.x * scale,
    y: currentPoint.y - worldPoint.y * scale,
  };
}

export function getTeamV2WheelZoomFactor(deltaY: number, deltaMode = 0) {
  const deltaUnit = deltaMode === 1 ? 16 : deltaMode === 2 ? 120 : 1;
  const normalizedDelta = Math.max(-120, Math.min(120, deltaY * deltaUnit));
  return Math.exp(-normalizedDelta * 0.002);
}
