import {memo, useMemo} from "react";
import {Arc, Circle, Group, Path} from "react-konva";

export const TEAM_V2_MARKER_DESIGN_WIDTH = 640;
export const TEAM_V2_MARKER_DESIGN_HEIGHT = 620;
export const TEAM_V2_MARKER_CENTER_X = 320;
export const TEAM_V2_MARKER_CENTER_Y = 248;
export const TEAM_V2_MARKER_TIP_Y = 606;

const COLORS = {
  body: "#29273D",
  bodyInner: "#302D46",
  cyan: "#60B4CA",
  cyanLight: "#A0D3DF",
  purple: "#9D6FB4",
  pink: "#BF6DB3",
  neonGreen: "#65FFB1",
  neonMint: "#25E6C8",
  neonPurple: "#B05CFF",
  innerBlack: "#070910",
  innerBlackBorder: "#131625",
  white: "#FFFFFF",
  whiteGlow: "#DDFEFF",
  silverLight: "#F2F7FB",
  silver: "#C3CED8",
  silverMid: "#98A5B2",
  silverDark: "#66727F",
};

const PIN_PATH = [
  `M ${TEAM_V2_MARKER_CENTER_X} 52`,
  "C 190 52, 104 137, 104 248",
  `C 104 365, 199 476, ${TEAM_V2_MARKER_CENTER_X} ${TEAM_V2_MARKER_TIP_Y}`,
  "C 441 476, 536 365, 536 248",
  `C 536 137, 450 52, ${TEAM_V2_MARKER_CENTER_X} 52`,
  "Z",
].join(" ");

const INNER_PIN_PATH = [
  `M ${TEAM_V2_MARKER_CENTER_X} 79`,
  "C 211 79, 137 149, 137 249",
  `C 137 345, 215 444, ${TEAM_V2_MARKER_CENTER_X} 558`,
  "C 425 444, 503 345, 503 249",
  `C 503 149, 429 79, ${TEAM_V2_MARKER_CENTER_X} 79`,
  "Z",
].join(" ");

function clampColorChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ?
      normalized.split("").map((character) => character + character).join("")
    : normalized;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({r, g, b}: {r: number; g: number; b: number}) {
  return `#${[r, g, b]
    .map((value) => clampColorChannel(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixColors(from: string, to: string, amount: number) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const ratio = Math.min(1, Math.max(0, amount));
  return rgbToHex({
    r: start.r + (end.r - start.r) * ratio,
    g: start.g + (end.g - start.g) * ratio,
    b: start.b + (end.b - start.b) * ratio,
  });
}

function getCircularGradientColor(progress: number) {
  const position = ((progress % 1) + 1) % 1;
  const stops = [
    {position: 0, color: COLORS.neonGreen},
    {position: 0.25, color: COLORS.neonMint},
    {position: 0.5, color: COLORS.neonPurple},
    {position: 0.75, color: COLORS.neonMint},
    {position: 1, color: COLORS.neonGreen},
  ];

  for (let index = 0; index < stops.length - 1; index += 1) {
    const current = stops[index];
    const next = stops[index + 1];
    if (position >= current.position && position <= next.position) {
      return mixColors(
        current.color,
        next.color,
        (position - current.position) / (next.position - current.position),
      );
    }
  }
  return COLORS.neonGreen;
}

function getCircularSilverColor(progress: number) {
  const position = ((progress % 1) + 1) % 1;
  return position <= 0.5 ?
      mixColors(COLORS.silverLight, COLORS.silverDark, position * 2)
    : mixColors(COLORS.silverDark, COLORS.silverLight, (position - 0.5) * 2);
}

type CircularNeonGradientRingProps = {
  x: number;
  y: number;
  radius: number;
  strokeWidth: number;
  segmentCount?: number;
  rotation?: number;
  glow?: boolean;
  silver?: boolean;
};

const CircularNeonGradientRing = memo(function CircularNeonGradientRing({
  x,
  y,
  radius,
  strokeWidth,
  segmentCount = 180,
  rotation = -90,
  glow = true,
  silver = false,
}: CircularNeonGradientRingProps) {
  const segments = useMemo(() => {
    const segmentAngle = 360 / segmentCount;
    const overlap = Math.min(0.5, segmentAngle * 0.3);
    return Array.from({length: segmentCount}, (_, index) => ({
      key: index,
      rotation: rotation + index * segmentAngle,
      angle: segmentAngle + overlap,
      color: silver ?
        getCircularSilverColor(index / segmentCount)
      : getCircularGradientColor(index / segmentCount),
    }));
  }, [rotation, segmentCount, silver]);

  return (
    <Group listening={false}>
      {glow && (
        <Circle
          x={x}
          y={y}
          radius={radius}
          stroke={silver ? COLORS.silver : COLORS.neonMint}
          strokeWidth={strokeWidth + 5}
          opacity={0.2}
          shadowColor={silver ? COLORS.silverLight : COLORS.neonPurple}
          shadowBlur={18}
          shadowOpacity={0.65}
          listening={false}
        />
      )}
      {segments.map((segment) => (
        <Arc
          key={segment.key}
          x={x}
          y={y}
          innerRadius={radius - strokeWidth / 2}
          outerRadius={radius + strokeWidth / 2}
          angle={segment.angle}
          rotation={segment.rotation}
          fill={segment.color}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
    </Group>
  );
});

type TeamV2NeonMapMarkerProps = {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  silver?: boolean;
};

export const TeamV2NeonMapMarker = memo(function TeamV2NeonMapMarker({
  x = 0,
  y = 0,
  scale = 1,
  rotation = 0,
  opacity = 1,
  silver = false,
}: TeamV2NeonMapMarkerProps) {
  const accent = silver ? COLORS.silver : COLORS.cyan;
  const accentLight = silver ? COLORS.silverLight : COLORS.cyanLight;
  const secondary = silver ? COLORS.silverDark : COLORS.purple;
  const tertiary = silver ? COLORS.silverMid : COLORS.pink;

  return (
    <Group
      x={x}
      y={y}
      scaleX={scale}
      scaleY={scale}
      rotation={rotation}
      offsetX={TEAM_V2_MARKER_CENTER_X}
      offsetY={TEAM_V2_MARKER_TIP_Y}
      opacity={opacity}
      listening={false}>
      <Path
        data={PIN_PATH}
        fill="transparent"
        stroke={accentLight}
        strokeWidth={36}
        opacity={0.14}
        lineJoin="round"
        lineCap="round"
        shadowColor={tertiary}
        shadowBlur={36}
        shadowOpacity={0.45}
        listening={false}
      />
      <Path
        data={PIN_PATH}
        fill={COLORS.body}
        strokeLinearGradientStartPoint={{x: 130, y: 80}}
        strokeLinearGradientEndPoint={{x: 500, y: 560}}
        strokeLinearGradientColorStops={[
          0, accentLight, 0.34, accent, 0.68, secondary, 1, tertiary,
        ]}
        strokeWidth={20}
        lineJoin="round"
        lineCap="round"
        shadowColor={accent}
        shadowBlur={12}
        shadowOpacity={0.48}
      />
      <Path
        data={INNER_PIN_PATH}
        fill={COLORS.bodyInner}
        stroke={silver ? COLORS.silverMid : "#82B6C6"}
        strokeWidth={5}
        opacity={0.86}
        lineJoin="round"
        lineCap="round"
        listening={false}
      />
      <Circle
        x={TEAM_V2_MARKER_CENTER_X}
        y={TEAM_V2_MARKER_CENTER_Y}
        radius={148}
        fill={COLORS.body}
        strokeLinearGradientStartPoint={{x: 180, y: 115}}
        strokeLinearGradientEndPoint={{x: 455, y: 390}}
        strokeLinearGradientColorStops={[
          0, accentLight, 0.52, accent, 1, secondary,
        ]}
        strokeWidth={9}
        shadowColor={accent}
        shadowBlur={9}
        shadowOpacity={0.4}
        listening={false}
      />
      <CircularNeonGradientRing
        x={TEAM_V2_MARKER_CENTER_X}
        y={TEAM_V2_MARKER_CENTER_Y}
        radius={84}
        strokeWidth={18}
        segmentCount={180}
        silver={silver}
      />
      <Circle
        x={TEAM_V2_MARKER_CENTER_X}
        y={TEAM_V2_MARKER_CENTER_Y}
        radius={58}
        fill={COLORS.innerBlack}
        stroke={COLORS.innerBlackBorder}
        strokeWidth={10}
        shadowColor="#000000"
        shadowBlur={8}
        shadowOpacity={0.72}
        listening={false}
      />
      <Circle
        x={TEAM_V2_MARKER_CENTER_X}
        y={TEAM_V2_MARKER_CENTER_Y}
        radius={36}
        fill={COLORS.white}
        stroke={COLORS.whiteGlow}
        strokeWidth={4}
        shadowColor={COLORS.whiteGlow}
        shadowBlur={14}
        shadowOpacity={0.82}
        listening={false}
      />
      <Path
        data="M 174 171 C 217 101, 279 79, 341 83"
        fill="transparent"
        stroke="#D6E7EE"
        strokeWidth={8}
        opacity={0.16}
        lineCap="round"
        listening={false}
      />
      <Path
        data="M 148 254 C 148 322, 181 384, 229 443"
        fill="transparent"
        stroke="#E1C4DB"
        strokeWidth={8}
        opacity={0.1}
        lineCap="round"
        listening={false}
      />
    </Group>
  );
});
