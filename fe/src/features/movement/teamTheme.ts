import type {CSSProperties} from "react";

export const DEFAULT_TEAM_COLOR = "#FF765C";

export type TeamThemeVars = CSSProperties & Record<`--team-${string}`, string>;

export function normalizeTeamColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export function getTeamThemeVars(value: unknown): TeamThemeVars {
  const primary = normalizeTeamColor(value) ?? DEFAULT_TEAM_COLOR;
  const gradientStart = mixWith(primary, "#FFFFFF", 0.12);
  const gradientEnd = mixWith(primary, "#000000", 0.08);
  return {
    "--team-primary": primary,
    "--team-primary-hover": gradientStart,
    "--team-primary-soft": mixWith(primary, "#FFFFFF", 0.86),
    "--team-on-primary": "#FFFFFF",
    "--team-focus-ring": hexToRgba(primary, 0.35),
    "--team-button-gradient": `linear-gradient(110deg, ${gradientStart}, ${gradientEnd})`,
    "--team-button-gradient-hover": `linear-gradient(110deg, ${mixWith(gradientStart, "#FFFFFF", 0.08)}, ${mixWith(gradientEnd, "#FFFFFF", 0.08)})`,
  };
}

function hexToRgb(hex: string) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function mixWith(hex: string, target: string, amount: number) {
  const sourceRgb = hexToRgb(hex);
  const targetRgb = hexToRgb(target);
  const mix = (source: number, next: number) => Math.round(source * (1 - amount) + next * amount);
  return `#${[mix(sourceRgb.r, targetRgb.r), mix(sourceRgb.g, targetRgb.g), mix(sourceRgb.b, targetRgb.b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function hexToRgba(hex: string, alpha: number) {
  const {r, g, b} = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
