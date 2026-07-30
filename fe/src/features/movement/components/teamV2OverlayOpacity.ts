import type {CSSProperties} from "react";

export const DEFAULT_TEAM_V2_OVERLAY_OPACITY = 95;

export type TeamV2OverlayStyle = CSSProperties & {
  "--team-v2-overlay-opacity": number;
};

export function getTeamV2OverlayStyle(opacity: number): TeamV2OverlayStyle {
  const normalizedOpacity = Number.isFinite(opacity) ?
      Math.max(0, Math.min(100, opacity)) / 100
    : DEFAULT_TEAM_V2_OVERLAY_OPACITY / 100;
  return {"--team-v2-overlay-opacity": normalizedOpacity};
}
