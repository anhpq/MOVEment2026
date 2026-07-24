import type {CSSProperties} from "react";

export const DEFAULT_TEAM_COLOR = "#FF765C";

type TeamThemeVars = CSSProperties & Record<`--team-${string}`, string>;

export function normalizeTeamColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export function getTeamThemeVars(value: unknown): TeamThemeVars {
  const primary = normalizeTeamColor(value) ?? DEFAULT_TEAM_COLOR;
  const foreground = getReadableForeground(primary);
  return {
    "--team-primary": primary,
    "--team-primary-hover": mixWith(primary, foreground === "#FFFFFF" ? "#FFFFFF" : "#000000", 0.12),
    "--team-primary-soft": mixWith(primary, "#FFFFFF", 0.86),
    "--team-on-primary": foreground,
    "--team-focus-ring": hexToRgba(primary, 0.35),
  };
}

function getReadableForeground(hex: string) {
  const {r, g, b} = hexToRgb(hex);
  const luminance = (0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b));
  return luminance > 0.55 ? "#1B2638" : "#FFFFFF";
}

function toLinear(value: number) {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
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
