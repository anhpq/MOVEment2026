/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import {
  CloseOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {Alert, App as AntdApp, Button, Empty, Flex, Form, Input, InputNumber, Slider, Spin, Switch, Typography} from "antd";
import type {KonvaEventObject} from "konva/lib/Node";
import Konva from "konva";
import {memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type Ref} from "react";
import {useTranslation} from "react-i18next";
import {Arc, Circle, Ellipse, Group, Image as KonvaImage, Layer, Path, Rect, Stage, Text} from "react-konva";
import {useNavigate} from "react-router-dom";
import {
  getPlayerLeaderboard,
  ApiError,
  cancelPlayerStation,
  isAuthFailure,
  submitPlayerQrAction,
  submitStationScore,
  type LeaderboardEntryResponse,
} from "../api";
import {LanguageSwitch} from "../components/LanguageSwitch";
import {TeamV2QrBadge} from "../components/TeamV2QrBadge";
import {TeamV2StationDetailOverlay} from "../components/TeamV2StationDetailOverlay";
import {TeamV2FinalChallenge} from "../components/TeamV2FinalChallenge";
import {
  DEFAULT_TEAM_V2_OVERLAY_OPACITY,
  getTeamV2OverlayStyle,
} from "../components/teamV2OverlayOpacity";
import {
  getStationMarkerFontSize,
  getStationLabelLayouts,
  STATION_LABEL_HEIGHT,
  STATION_LABEL_WIDTH,
} from "./teamV2MarkerLayout";
import {getStationMarkerAppearance} from "../markerAppearance";
import {
  createLatestFrameScheduler,
  type LatestFrameScheduler,
} from "./teamV2FrameScheduler";
import {
  applyTeamV2MarkerAnimationFrame,
  getTeamV2CanvasPixelRatio,
  resetTeamV2MarkerAnimation,
} from "./teamV2MarkerAnimation";
import {getTeamV2LeaderboardRows} from "./teamV2Leaderboard";
import {
  clampTeamV2MapScale as clampScale,
  getTeamV2BaseMapScale as getBaseMapScale,
  getTeamV2DefaultMapTransform as getDefaultMapTransform,
  getTeamV2WheelZoomFactor,
  scaleTeamV2MapAtPoint,
  scaleTeamV2MapFromGesture,
  TEAM_V2_MAP_WORLD_HEIGHT as MAP_WORLD_HEIGHT,
  TEAM_V2_MAP_WORLD_WIDTH as MAP_WORLD_WIDTH,
} from "./teamV2MapTransform";
import {
  getActiveFullscreenElement,
  isStandaloneDisplayMode,
  TEAM_V2_FULLSCREEN_CHANGE_EVENTS,
  toggleLandscapeOrientation,
  toggleBrowserFullscreen,
  unlockLandscapeOrientation,
} from "./teamV2Fullscreen";
import {
  shouldAnimateTeamV2GatheringPoint,
  shouldShowTeamV2GatheringPoint,
  TEAM_V2_GATHERING_POINT,
} from "./teamV2FinalNotice";
import {
  TEAM_V2_DISPLAY_FONT_FAMILY,
  TEAM_V2_UI_FONT_FAMILY,
} from "./teamV2Typography";
import {
  TeamV2QrScanner,
  type TeamV2QrSubmitResult,
} from "../components/TeamV2QrScanner";
import {useStationPlayingCounts} from "../hooks/useStationPlayingCounts";
import {useTeamV2RuntimePolling} from "../hooks/useTeamV2RuntimePolling";
import {useVisibleOnlinePolling} from "../hooks/useVisibleOnlinePolling";
import {
  executePlayerMutation,
  fetchPlayerDatabase,
  loadPlayerMapImage,
  selectPlayerMapImageVariant,
} from "../playerData";
import {useMovementStore} from "../store";
import type {StationDefinition, SupportedLanguage, Team, TeamStation} from "../types";
import {
  getLocalizedTeamName,
  getStationDisplayCode,
  getStationReferencePointsDisplay,
  getStationScoreEntryMax,
  isStationReferenceExceeded,
} from "../utils";
import "./TeamGameplayV2Page.css";
import "./TeamGameplayV2Demo.css";

const PANEL_OPACITY_STORAGE_KEY = "movement-team-v2-panel-opacity-v2";
const V2_HUD_ACCENT = "#2FE4F0";
const ZALO_SUPPORT_URLS: readonly [string, string | null] = ["https://zalo.me/0909384697", null];

function formatFinalCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

const QR_ACTION_ERROR_KEYS: Readonly<Record<string, string>> = {
  PLAYER_QR_INVALID: "teamV2.qrErrors.invalid",
  PLAYER_QR_REVOKED: "teamV2.qrErrors.revoked",
  PLAYER_QR_EXPIRED: "teamV2.qrErrors.expired",
  PLAYER_QR_PURPOSE_MISMATCH: "teamV2.qrErrors.invalid",
  PLAYER_QR_STATION_MISMATCH: "teamV2.qrErrors.invalid",
  PLAYER_STATION_INACTIVE: "teamV2.qrErrors.stationInactive",
  PLAYER_STATIONS_CLOSED: "teamV2.qrErrors.stationsClosed",
  PLAYER_STATION_NOT_AVAILABLE: "teamV2.qrErrors.notAvailable",
  PLAYER_CANCEL_COOLDOWN_ACTIVE: "teamV2.qrErrors.cooldown",
  PLAYER_ACTIVE_STATION_CONFLICT: "teamV2.qrErrors.alreadyPlaying",
  PLAYER_PROGRESS_NOT_FOUND: "teamV2.qrErrors.notPlaying",
  PLAYER_STATION_NOT_PLAYING: "teamV2.qrErrors.notPlaying",
  PLAYER_CHECKOUT_CONFLICT: "teamV2.qrErrors.notPlaying",
};

function getQrActionErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "teamV2.qrErrors.generic";
  }
  if (error.status === 0) {
    return "teamV2.qrErrors.network";
  }
  if (error.status >= 500) {
    return "teamV2.qrErrors.server";
  }
  return (
    (error.backendCode ? QR_ACTION_ERROR_KEYS[error.backendCode] : undefined) ??
    "teamV2.qrErrors.generic"
  );
}

export type ViewportSize = {
  width: number;
  height: number;
};

export type MarkerViewModel = {
  station: StationDefinition;
  teamStation: TeamStation | null;
  x: number;
  y: number;
  code: string;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  isSelected: boolean;
  opacity: number;
};

export type MapTransform = {
  x: number;
  y: number;
  scale: number;
};

function applyMapTransformToStage(stage: Konva.Stage, transform: MapTransform) {
  stage.position({x: transform.x, y: transform.y});
  stage.scale({x: transform.scale, y: transform.scale});
  stage.batchDraw();
}

type ScoreFormValues = {
  score: number;
  reason?: string;
};

function readStoredPanelOpacity() {
  if (typeof window === "undefined") {
    return DEFAULT_TEAM_V2_OVERLAY_OPACITY;
  }
  const value = Number(window.localStorage.getItem(PANEL_OPACITY_STORAGE_KEY));
  return Number.isFinite(value) && value >= 50 && value <= 100 ?
      Math.round(value / 5) * 5
    : DEFAULT_TEAM_V2_OVERLAY_OPACITY;
}

function persistPanelOpacity(value: number) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PANEL_OPACITY_STORAGE_KEY, String(value));
}

function clampPercent(value: number) {
  return Math.max(4, Math.min(96, value));
}

function getStationPosition(station: StationDefinition, index: number, total: number) {
  if (typeof station.markerX === "number" && typeof station.markerY === "number") {
    return {x: station.markerX, y: station.markerY};
  }
  const columns = 5;
  const row = Math.floor(index / columns);
  const col = index % columns;
  const rows = Math.max(1, Math.ceil(total / columns));
  return {
    x: clampPercent(12 + col * (76 / Math.max(1, columns - 1))),
    y: clampPercent(14 + row * (72 / Math.max(1, rows - 1))),
  };
}

function getMarkerColors(marker: MarkerViewModel, hudAccent: string) {
  if (marker.isActive) {
    return {
      stroke: "#FFD45B",
      edgeEnd: "#FF67B3",
      glow: "#FFCB4B",
      edgeGradient: [0, "#FFD45B", 1, "#FF67B3"],
      fillGradient: [0, "#261C04", 1, "#130A17"],
      meta: "#FFF8D8",
    };
  }
  if (marker.isCompleted) {
    return {
      stroke: "#EEF4FF",
      edgeEnd: "#A89CC7",
      glow: "#FFFFFF",
      edgeGradient: [0, "#FFFFFF", 1, "#A89CC7"],
      fillGradient: [0, "#1F2531", 1, "#15111D"],
      meta: "#E8EAF0",
    };
  }
  if (marker.isLocked) {
    return {
      stroke: "#817A99",
      edgeEnd: "#854DA8",
      glow: "#8E62BA",
      edgeGradient: [0, "#8194AA", 1, "#854DA8"],
      fillGradient: [0, "#181823", 1, "#0E0B16"],
      meta: "#A9A4B9",
    };
  }
  return {
    stroke: "#76EFFF",
    edgeEnd: "#B04CFF",
    glow: hudAccent,
    edgeGradient: [0, "#76EFFF", 1, "#B04CFF"],
    fillGradient: [0, "#04121B", 1, "#100A20"],
    meta: "#76EFFF",
  };
}

const StationMarker = memo(function StationMarker({
  marker,
  hudAccent,
  size,
  x,
  y,
  pointsUnit,
  isInteracting,
  animationRef,
}: {
  marker: MarkerViewModel;
  hudAccent: string;
  size: number;
  x: number;
  y: number;
  pointsUnit: string;
  isInteracting: boolean;
  animationRef?: Ref<Konva.Group>;
}) {
  const cachedVisualRef = useRef<Konva.Group>(null);
  const colors = getMarkerColors(marker, hudAccent);
  const pinWidth = size;
  const pinHeight = size * 1.35;
  const markerCenterY = -pinHeight * 0.57;
  const pinScaleX = pinWidth / 58;
  const pinScaleY = pinHeight / 84;
  const pinBottomOffset = -54 * pinScaleY;
  const lockRadius = Math.max(5, size * 0.16);
  const points = getStationReferencePointsDisplay({
    maxPoints: marker.teamStation?.maxPoints ?? marker.station.maxPoints,
  });

  useLayoutEffect(() => {
    const node = cachedVisualRef.current;
    if (!node) {
      return;
    }
    node.clearCache();
    node.cache({
      pixelRatio: getTeamV2CanvasPixelRatio(globalThis.devicePixelRatio || 1),
    });
    node.getLayer()?.batchDraw();
    return () => {
      node.clearCache();
    };
  }, [
    hudAccent,
    isInteracting,
    marker.code,
    marker.isActive,
    marker.isCompleted,
    marker.isLocked,
    marker.isSelected,
    marker.station.maxPoints,
    marker.teamStation?.maxPoints,
    pointsUnit,
    size,
  ]);

  return (
    <Group
      x={x}
      y={y}
      opacity={marker.opacity}
      listening={false}>
      <Group ref={animationRef} listening={false}>
      <Group ref={cachedVisualRef} listening={false}>
      {marker.isActive && (
        <Group listening={false}>
          <Circle
            y={markerCenterY}
            radius={size * 0.9}
            stroke="#FFD447"
            strokeWidth={1}
            shadowColor="#FFB800"
            shadowBlur={isInteracting ? 0 : 18}
            opacity={0.22}
            listening={false}
          />
          <Ellipse
            y={size * 0.05}
            radiusX={size * 1.24}
            radiusY={size * 0.38}
            stroke="#FFB800"
            strokeWidth={1}
            opacity={0.32}
            listening={false}
          />
          <Ellipse
            y={size * 0.05}
            radiusX={size * 0.92}
            radiusY={size * 0.28}
            stroke="#FFD21A"
            strokeWidth={1.1}
            opacity={0.5}
            listening={false}
          />
          <Ellipse
            y={size * 0.05}
            radiusX={size * 0.6}
            radiusY={size * 0.17}
            stroke="#FFF0A6"
            strokeWidth={1.2}
            opacity={0.74}
            listening={false}
          />
        </Group>
      )}
      <Path
        y={pinBottomOffset}
        scaleX={pinScaleX}
        scaleY={pinScaleY}
        data="M 0 -30 C -19 -30 -29 -17 -29 1 C -29 19 -12 38 0 54 C 12 38 29 19 29 1 C 29 -17 19 -30 0 -30 Z"
        fillLinearGradientStartPoint={{x: -29, y: -30}}
        fillLinearGradientEndPoint={{x: 29, y: 54}}
        fillLinearGradientColorStops={colors.fillGradient}
        stroke={colors.stroke}
        strokeLinearGradientStartPoint={{x: -29, y: -30}}
        strokeLinearGradientEndPoint={{x: 29, y: 54}}
        strokeLinearGradientColorStops={colors.edgeGradient}
        strokeWidth={2.1 / Math.max(pinScaleX, pinScaleY)}
        shadowColor={colors.glow}
        shadowBlur={isInteracting ? 0 : marker.isSelected || marker.isActive ? 18 : 12}
        shadowOpacity={0.82}
        listening={false}
      />
      <Path
        y={pinBottomOffset}
        scaleX={pinScaleX * 0.9}
        scaleY={pinScaleY * 0.91}
        data="M 0 -30 C -19 -30 -29 -17 -29 1 C -29 19 -12 38 0 54 C 12 38 29 19 29 1 C 29 -17 19 -30 0 -30 Z"
        fillEnabled={false}
        stroke={colors.edgeEnd}
        strokeWidth={1.05 / Math.max(pinScaleX, pinScaleY)}
        opacity={0.78}
        listening={false}
      />
      <Text
        x={-size / 2}
        y={markerCenterY - size * 0.22}
        width={size}
        height={size * 0.44}
        text={marker.code}
        align="center"
        verticalAlign="middle"
        fontFamily={TEAM_V2_DISPLAY_FONT_FAMILY}
        fontSize={getStationMarkerFontSize(marker.code, size)}
        fontStyle="bold"
        fill="#FFFFFF"
        shadowColor={colors.glow}
        shadowBlur={3}
        listening={false}
      />
      {marker.isLocked && (
        <Group
          x={size * 0.31}
          y={-size * 0.53}
          listening={false}>
          <Circle
            radius={lockRadius}
            fill="#111827"
            stroke="#B05CFF"
            strokeWidth={1.4}
            shadowColor="#B05CFF"
            shadowBlur={5}
          />
          <Arc
            innerRadius={lockRadius * 0.34}
            outerRadius={lockRadius * 0.34}
            angle={180}
            rotation={180}
            y={-lockRadius * 0.14}
            stroke="#C3CED8"
            strokeWidth={1.3}
          />
          <Rect
            x={-lockRadius * 0.38}
            y={-lockRadius * 0.04}
            width={lockRadius * 0.76}
            height={lockRadius * 0.54}
            cornerRadius={1}
            fill="#C3CED8"
          />
        </Group>
      )}
      <Group x={-STATION_LABEL_WIDTH / 2} y={4} listening={false}>
        {(marker.isSelected || marker.isActive) && (
          <>
            <Rect
              x={5}
              y={5}
              width={STATION_LABEL_WIDTH - 10}
              height={STATION_LABEL_HEIGHT}
              stroke={colors.stroke}
              strokeLinearGradientStartPoint={{x: 0, y: 0}}
              strokeLinearGradientEndPoint={{x: STATION_LABEL_WIDTH - 10, y: STATION_LABEL_HEIGHT}}
              strokeLinearGradientColorStops={colors.edgeGradient}
              strokeWidth={1}
              cornerRadius={STATION_LABEL_HEIGHT / 2}
              opacity={marker.isActive ? 0.5 : 0.3}
            />
            <Rect
              x={10}
              y={10}
              width={STATION_LABEL_WIDTH - 20}
              height={STATION_LABEL_HEIGHT}
              stroke={colors.stroke}
              strokeLinearGradientStartPoint={{x: 0, y: 0}}
              strokeLinearGradientEndPoint={{x: STATION_LABEL_WIDTH - 20, y: STATION_LABEL_HEIGHT}}
              strokeLinearGradientColorStops={colors.edgeGradient}
              strokeWidth={1}
              cornerRadius={STATION_LABEL_HEIGHT / 2}
              opacity={0.16}
            />
          </>
        )}
        <Rect
          width={STATION_LABEL_WIDTH}
          height={STATION_LABEL_HEIGHT}
          fillLinearGradientStartPoint={{x: 0, y: 0}}
          fillLinearGradientEndPoint={{x: STATION_LABEL_WIDTH, y: STATION_LABEL_HEIGHT}}
          fillLinearGradientColorStops={colors.fillGradient}
          stroke={colors.stroke}
          strokeLinearGradientStartPoint={{x: 0, y: 0}}
          strokeLinearGradientEndPoint={{x: STATION_LABEL_WIDTH, y: STATION_LABEL_HEIGHT}}
          strokeLinearGradientColorStops={colors.edgeGradient}
          strokeWidth={1.2}
          cornerRadius={STATION_LABEL_HEIGHT / 2}
          shadowColor={colors.glow}
          shadowBlur={9}
          shadowOpacity={0.64}
        />
        <Text
          text={`${points} ${pointsUnit}`}
          x={4}
          width={STATION_LABEL_WIDTH - 8}
          height={STATION_LABEL_HEIGHT}
          fontFamily={TEAM_V2_UI_FONT_FAMILY}
          fontSize={9.5}
          fontStyle="bold"
          fill={colors.meta}
          align="center"
          verticalAlign="middle"
        />
      </Group>
      </Group>
      </Group>
    </Group>
  );
});

const MarkerHitArea = memo(function MarkerHitArea({
  markerId,
  size,
  x,
  y,
  onSelect,
}: {
  markerId: string;
  size: number;
  x: number;
  y: number;
  onSelect: (markerId: string) => void;
}) {
  const hitRadius = Math.max(22, size * 0.55);
  return (
    <Circle
      x={x}
      y={y - hitRadius}
      radius={hitRadius}
      fill="rgba(255,255,255,0.01)"
      onClick={(event) => {
        event.cancelBubble = true;
        onSelect(markerId);
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        onSelect(markerId);
      }}
      onMouseDown={(event) => {
        event.cancelBubble = true;
      }}
      onTouchStart={(event) => {
        event.cancelBubble = true;
      }}
      onMouseEnter={(event) => {
        const stage = event.target.getStage();
        if (stage) stage.container().style.cursor = "pointer";
      }}
      onMouseLeave={(event) => {
        const stage = event.target.getStage();
        if (stage) stage.container().style.cursor = "";
      }}
    />
  );
});

const GatheringPointMarker = memo(function GatheringPointMarker({
  x,
  y,
  size,
  label,
  isInteracting,
  animationRef,
}: {
  x: number;
  y: number;
  size: number;
  label: string;
  isInteracting: boolean;
  animationRef?: Ref<Konva.Group>;
}) {
  const cachedVisualRef = useRef<Konva.Group>(null);
  const pinWidth = size * 1.08;
  const pinHeight = size * 1.42;
  const markerCenterY = -pinHeight * 0.57;
  const pinScaleX = pinWidth / 58;
  const pinScaleY = pinHeight / 84;
  const pinBottomOffset = -54 * pinScaleY;
  const labelWidth = Math.max(104, Math.min(154, 52 + Array.from(label).length * 5.4));

  useLayoutEffect(() => {
    const node = cachedVisualRef.current;
    if (!node) {
      return;
    }
    node.clearCache();
    node.cache({
      pixelRatio: getTeamV2CanvasPixelRatio(globalThis.devicePixelRatio || 1),
    });
    node.getLayer()?.batchDraw();
    return () => {
      node.clearCache();
    };
  }, [isInteracting, label, size]);

  return (
    <Group x={x} y={y} listening={false}>
      <Group ref={animationRef} listening={false}>
      <Group ref={cachedVisualRef} listening={false}>
        <Circle
          y={markerCenterY}
          radius={size * 1.05}
          stroke="#FF42D0"
          strokeWidth={1.4}
          opacity={0.38}
          shadowColor="#FF2BC8"
          shadowBlur={isInteracting ? 0 : 24}
        />
        <Circle
          y={markerCenterY}
          radius={size * 0.76}
          stroke="#FF8AE1"
          strokeWidth={1.2}
          opacity={0.58}
        />
        <Path
          y={pinBottomOffset}
          scaleX={pinScaleX}
          scaleY={pinScaleY}
          data="M 0 -30 C -19 -30 -29 -17 -29 1 C -29 19 -12 38 0 54 C 12 38 29 19 29 1 C 29 -17 19 -30 0 -30 Z"
          fillLinearGradientStartPoint={{x: -29, y: -30}}
          fillLinearGradientEndPoint={{x: 29, y: 54}}
          fillLinearGradientColorStops={[0, "#360725", 0.55, "#1C071F", 1, "#090412"]}
          strokeLinearGradientStartPoint={{x: -29, y: -30}}
          strokeLinearGradientEndPoint={{x: 29, y: 54}}
          strokeLinearGradientColorStops={[0, "#FF8AE1", 0.5, "#FF2BC8", 1, "#B14CFF"]}
          strokeWidth={2.4 / Math.max(pinScaleX, pinScaleY)}
          shadowColor="#FF2BC8"
          shadowBlur={isInteracting ? 0 : 24}
          shadowOpacity={0.95}
        />
        <Text
          x={-size / 2}
          y={markerCenterY - size * 0.24}
          width={size}
          height={size * 0.48}
          text="X"
          align="center"
          verticalAlign="middle"
          fontFamily={TEAM_V2_DISPLAY_FONT_FAMILY}
          fontSize={size * 0.45}
          fontStyle="bold"
          fill="#FFFFFF"
          shadowColor="#FF42D0"
          shadowBlur={7}
        />
        <Group x={-labelWidth / 2} y={6} listening={false}>
          <Rect
            width={labelWidth}
            height={22}
            cornerRadius={11}
            fillLinearGradientStartPoint={{x: 0, y: 0}}
            fillLinearGradientEndPoint={{x: labelWidth, y: 22}}
            fillLinearGradientColorStops={[0, "#25051C", 1, "#13051D"]}
            strokeLinearGradientStartPoint={{x: 0, y: 0}}
            strokeLinearGradientEndPoint={{x: labelWidth, y: 22}}
            strokeLinearGradientColorStops={[0, "#FF75DA", 1, "#B14CFF"]}
            strokeWidth={1.4}
            shadowColor="#FF2BC8"
            shadowBlur={isInteracting ? 0 : 14}
          />
          <Text
            x={7}
            width={labelWidth - 14}
            height={22}
            text={label}
            align="center"
            verticalAlign="middle"
            fontFamily={TEAM_V2_UI_FONT_FAMILY}
            fontSize={10}
            fontStyle="bold"
            fill="#FFD9F5"
          />
        </Group>
      </Group>
      </Group>
    </Group>
  );
});

function DemoHudHeader({score, hideScore, onSettings}: {score: number; hideScore: boolean; onSettings: () => void}) {
  const {t} = useTranslation();
  return (
    <>
      <header className="team-v2-header team-v2-demo-header">
        <div className="team-v2-event-brand" aria-label="MOVEment 2026"><h1>MOVEment 2026</h1></div>
        <button type="button" className="team-v2-settings-button" aria-label={t("teamV2.openSettings")} title={t("teamV2.openSettings")} onClick={onSettings}>
          <SettingOutlined />
        </button>
        {!hideScore && <section className="team-v2-score" aria-label={`${t("common.totalScore")}: ${score}`}>
          <div className="team-v2-score-line"><strong>{score}</strong><span>{t("teamV2.pointsUnit")}</span></div>
        </section>}
      </header>
    </>
  );
}

function DemoMarkerLegend({open, onToggle}: {open: boolean; onToggle: () => void}) {
  const {t} = useTranslation();
  return (
    <div className={`team-v2-legend-control${open ? " is-open" : ""}`}>
      <button type="button" className="team-v2-legend-toggle" aria-label={t("teamV2.legendTitle")} title={t("teamV2.legendTitle")} aria-expanded={open} aria-controls="team-v2-marker-legend" onClick={onToggle}>
        <span className="team-v2-legend-icon" aria-hidden="true">i</span>
        <span className="team-v2-legend-label">{t("teamV2.legendTitle")}</span>
        <b aria-hidden="true">⌄</b>
      </button>
      {open && (
        <section id="team-v2-marker-legend" className="team-v2-marker-legend" aria-label={t("teamV2.legendTitle")}>
          <span className="is-active"><i />{t("teamV2.legendPlaying")}</span>
          <span><i />{t("teamV2.legendNotPlayed")}</span>
          <span className="is-completed"><i />{t("teamV2.legendCompleted")}</span>
          <span className="is-locked"><i>▣</i>{t("teamV2.legendLocked")}</span>
        </section>
      )}
    </div>
  );
}

function DemoFooter({
  activeStation,
  footerScale,
  onLeaderboard,
  onMyTeam,
  onScan,
}: {
  activeStation: TeamStation | null;
  footerScale: number;
  onLeaderboard: () => void;
  onMyTeam: () => void;
  onScan: () => void;
}) {
  const {t} = useTranslation();
  const footerFontCompensation = 1 / Math.sqrt(footerScale);
  return (
    <footer className="team-v2-bottom team-v2-demo-footer" style={{"--team-v2-footer-scale": footerScale, "--team-v2-footer-font-compensation": footerFontCompensation} as CSSProperties}>
      <button type="button" className="team-v2-footer-panel team-v2-leaderboard-chip" onClick={onLeaderboard}>
        <span className="team-v2-footer-content"><span className="team-v2-bottom-icon"><TrophyFilled /></span><span className="team-v2-bottom-copy"><strong>{t("teamV2.leaderboardControl")}</strong></span></span>
      </button>
      <div className="team-v2-scan-action">
        <TeamV2QrBadge ariaLabel={t("teamV2.openScanner")} onClick={onScan} />
        <strong>{t("teamV2.scan")}</strong>
        <small className={activeStation ? "is-active-context" : undefined}>{activeStation ? `${getStationDisplayCode(activeStation.stationId)} · ${activeStation.name}` : t("teamV2.scanGameHint")}</small>
      </div>
      <button type="button" className="team-v2-footer-panel team-v2-progress-panel" onClick={onMyTeam}>
        <span className="team-v2-footer-content"><span className="team-v2-bottom-icon"><TeamOutlined /></span><span className="team-v2-bottom-copy team-v2-my-team-copy"><strong>{t("teamV2.myTeam")}</strong></span></span>
      </button>
    </footer>
  );
}

function TeamOverviewOverlay({
  open,
  opacity,
  team,
  stations,
  language,
  onClose,
  onContinue,
}: {
  open: boolean;
  opacity: number;
  team: Team;
  stations: MarkerViewModel[];
  language: SupportedLanguage;
  onClose: () => void;
  onContinue: (stationId: string) => void;
}) {
  const {t} = useTranslation();
  if (!open) return null;

  const groups = [
    {key: "completed", title: t("teamV2.teamPanelCompleted"), items: stations.filter((item) => item.isCompleted)},
    {key: "active", title: t("teamV2.teamPanelActive"), items: stations.filter((item) => item.isActive)},
    {key: "available", title: t("teamV2.teamPanelAvailable"), items: stations.filter((item) => !item.isCompleted && !item.isActive)},
  ];
  const completed = groups[0].items.length;
  const progress = stations.length > 0 ? Math.round((completed / stations.length) * 100) : 0;
  const active = groups[1].items[0];

  return (
    <div
      className="team-v2-overlay-layer"
      style={getTeamV2OverlayStyle(opacity)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <section className="team-v2-team-panel" role="dialog" aria-modal="true" aria-labelledby="team-v2-team-panel-title">
        <header className="team-v2-team-panel__header">
          <strong id="team-v2-team-panel-title">{t("teamV2.myTeam")}</strong>
          <button type="button" onClick={onClose} aria-label={t("teamV2.closeOverlay")}><CloseOutlined /></button>
        </header>

        <div className="team-v2-team-panel__identity">
          <span className="team-v2-team-panel__emblem" aria-hidden="true"><TeamOutlined /></span>
          <div>
            <h2>{getLocalizedTeamName(team.name, language)}</h2>
            <span>{t("teamV2.teamPanelRank", {rank: team.rank ?? "—"})}</span>
          </div>
          <div className="team-v2-team-panel__metrics">
            <strong>{team.score} {t("teamV2.pointsUnit")}</strong>
            <small>{t("common.totalScore")}</small>
            <strong>{completed}/{stations.length}</strong>
            <small>{t("teamV2.teamPanelCompletedShort")}</small>
          </div>
        </div>

        <div className="team-v2-team-panel__progress">
          <div><span>{t("teamV2.teamPanelJourney")}</span><strong>{progress}%</strong></div>
          <i><b style={{width: `${progress}%`}} /></i>
        </div>

        {active && (
          <div className="team-v2-team-panel__active">
            <span aria-hidden="true">ϟ</span>
            <div><small>{t("teamV2.teamPanelActive")}</small><strong>{active.code}</strong><em>{active.station.name}</em></div>
            <button type="button" onClick={() => onContinue(active.station.id)}>{t("teamV2.teamPanelContinue")} ›</button>
          </div>
        )}

        <div className="team-v2-team-panel__stations">
          <strong>{t("teamV2.teamPanelStationList")}</strong>
          {groups.map((group) => (
            <section key={group.key} className={`is-${group.key}`}>
              <h3>{group.title} ({group.items.length})</h3>
              {group.items.map((item) => {
                const maxPoints = getStationReferencePointsDisplay({
                  maxPoints: item.teamStation?.maxPoints ?? item.station.maxPoints,
                });
                const points = item.isCompleted && (item.teamStation?.score ?? 0) > 0 ? item.teamStation!.score : maxPoints;
                return (
                  <button
                    type="button"
                    key={item.station.id}
                    onClick={() => onContinue(item.station.id)}>
                    <span>{item.isCompleted ? "♜" : item.isActive ? "ϟ" : "○"}</span>
                    <b>{item.code}</b>
                    <em>{item.station.name}</em>
                    <strong>{points} {t("teamV2.pointsUnit")}</strong>
                    <i>›</i>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function LeaderboardOverlay({
  open,
  opacity,
  activeTeam,
  language,
  onClose,
}: {
  open: boolean;
  opacity: number;
  activeTeam: Team | undefined;
  language: SupportedLanguage;
  onClose: () => void;
}) {
  const {t} = useTranslation();
  const logout = useMovementStore((state) => state.logout);
  const [rows, setRows] = useState<LeaderboardEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(false);
  const visibleRows = useMemo(
    () => getTeamV2LeaderboardRows(rows),
    [rows],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => () => unlockLandscapeOrientation(), []);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    try {
      const entries = await getPlayerLeaderboard();
      if (mountedRef.current) {
        setRows(entries);
      }
    } catch (error) {
      if (mountedRef.current && isAuthFailure(error)) {
        logout();
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [logout]);

  useVisibleOnlinePolling(refresh, {enabled: open});

  if (!open) {
    return null;
  }

  return (
    <div
      className="team-v2-overlay-layer"
      style={getTeamV2OverlayStyle(opacity)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <section
        className="team-v2-overlay team-v2-leaderboard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-v2-leaderboard-title">
        <div className="team-v2-overlay-header">
          <div>
            <span className="team-v2-kicker">{t("teamV2.rankKicker")}</span>
            <Typography.Title id="team-v2-leaderboard-title" level={3}>{t("leaderboard.title")}</Typography.Title>
          </div>
          <button type="button" className="team-v2-icon-button" onClick={onClose} aria-label={t("teamV2.closeOverlay")}>
            <CloseOutlined />
          </button>
        </div>
        {isLoading && rows.length === 0 ? (
          <div className="team-v2-empty"><Spin /></div>
        ) : rows.length === 0 ? (
          <Empty description={t("leaderboard.empty")} />
        ) : (
          <div className="team-v2-rank-list">
            {visibleRows.map((row) => {
              const isCurrent = String(row.teamId) === activeTeam?.id;
              return (
                <div key={row.teamId} className={`team-v2-rank-row${isCurrent ? " is-current" : ""}`}>
                  <span className="team-v2-rank-number">{row.rank}</span>
                  <div className="team-v2-rank-team">
                    <strong>{getLocalizedTeamName(row.teamName, language)}</strong>
                    <small>{row.completedStations} {t("common.stations")}</small>
                  </div>
                  <span className="team-v2-rank-score">{row.totalPoints}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function TeamGameplayV2Page() {
  const navigate = useNavigate();
  const {message, modal} = AntdApp.useApp();
  const {i18n, t} = useTranslation();
  const [scoreForm] = Form.useForm<ScoreFormValues>();
  const session = useMovementStore((state) => state.session);
  const teams = useMovementStore((state) => state.teams);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const stationDefinitions = useMovementStore((state) => state.stationDefinitions);
  const teamStations = useMovementStore((state) => state.teamStations);
  const finalSummary = useMovementStore((state) => state.finalSummary);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const clearSession = useMovementStore((state) => state.logout);
  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const activeTeamStations = useMemo(
    () => teamStations[activeTeamId] ?? [],
    [activeTeamId, teamStations],
  );
  const language = i18n.language === "en" ? "en" : "vi";
  useTeamV2RuntimePolling();
  const [panelOpacity, setPanelOpacity] = useState(readStoredPanelOpacity);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [isStationDetailOpen, setIsStationDetailOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isTeamPanelOpen, setIsTeamPanelOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [scoreStationId, setScoreStationId] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isFinalCompleted, setIsFinalCompleted] = useState(false);
  const handleFinalCompleted = useCallback(() => setIsFinalCompleted(true), []);
  const [finalClock, setFinalClock] = useState({seconds: 0, receivedAt: Date.now()});
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(
    () => Boolean(getActiveFullscreenElement()),
  );
  const [isStandaloneApp, setIsStandaloneApp] = useState(isStandaloneDisplayMode);
  const [isLandscapeLocked, setIsLandscapeLocked] = useState(false);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({width: 0, height: 0});
  const [mapTransform, setMapTransform] = useState<MapTransform>({x: 0, y: 0, scale: 1});
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const loadedMapWidthRef = useRef(0);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const backgroundLayerRef = useRef<Konva.Layer | null>(null);
  const staticMarkerLayerRef = useRef<Konva.Layer | null>(null);
  const activeMarkerLayerRef = useRef<Konva.Layer | null>(null);
  const interactionLayerRef = useRef<Konva.Layer | null>(null);
  const activeMarkerAnimationRef = useRef<Konva.Group | null>(null);
  const gatheringPointAnimationRef = useRef<Konva.Group | null>(null);
  const liveMapTransformRef = useRef<MapTransform>(mapTransform);
  const isSubmittingQrRef = useRef(false);
  const pinchRef = useRef<{
    distance: number;
    point: {x: number; y: number};
    transform: MapTransform;
  } | null>(null);
  const panRef = useRef<{
    clientX: number;
    clientY: number;
    transform: MapTransform;
    moved: boolean;
  } | null>(null);
  const lastTapAtRef = useRef(0);
  const previousViewportRef = useRef<ViewportSize | null>(null);
  const wheelCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalRefreshRequestedRef = useRef(false);
  const finalToastPhasesRef = useRef(new Set<string>());
  const mapTransformSchedulerRef = useRef<LatestFrameScheduler<MapTransform> | null>(null);
  const setStageNode = useCallback((stage: Konva.Stage | null) => {
    stageRef.current = stage;
    if (stage) {
      applyMapTransformToStage(stage, liveMapTransformRef.current);
    }
  }, []);
  useEffect(() => {
    const scheduler = createLatestFrameScheduler<MapTransform>({
      requestFrame: (callback) => requestAnimationFrame(callback),
      cancelFrame: (frameId) => cancelAnimationFrame(frameId),
      commit: (transform) => {
        const stage = stageRef.current;
        if (!stage) {
          return;
        }
        applyMapTransformToStage(stage, transform);
      },
    });
    mapTransformSchedulerRef.current = scheduler;
    return () => {
      if (wheelCommitTimerRef.current !== null) {
        clearTimeout(wheelCommitTimerRef.current);
        wheelCommitTimerRef.current = null;
      }
      scheduler.cancel();
      mapTransformSchedulerRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      applyMapTransformToStage(stage, mapTransform);
    }
  }, [mapTransform]);
  const playingCounts = useStationPlayingCounts(Boolean(session?.role === "user"));

  const scoreStation = activeTeamStations.find((station) => station.stationId === scoreStationId) ?? null;
  const selectedStation =
    activeTeamStations.find((station) => station.stationId === selectedStationId) ?? null;
  const activeStation =
    activeTeamStations.find((station) => station.status === "In Progress") ?? null;
  const isFinalMode = finalSummary?.phase === "FINAL_STARTED" && !finalSummary.pendingScoreStationId && !finalSummary.blockedByActiveStation;
  const secondsUntilFinal = Math.max(0, finalClock.seconds - Math.floor((Date.now() - finalClock.receivedAt) / 1000));
  const showFinalNotice = finalSummary?.phase === "NOTICE" || finalSummary?.phase === "STATIONS_CLOSED";
  const showGatheringPoint = shouldShowTeamV2GatheringPoint();
  const animateGatheringPoint = shouldAnimateTeamV2GatheringPoint(finalSummary?.phase);

  useEffect(() => {
    setFinalClock({seconds: finalSummary?.secondsUntilFinal ?? 0, receivedAt: Date.now()});
  }, [finalSummary?.secondsUntilFinal]);

  useEffect(() => {
    if (!showFinalNotice) return;
    const timer = window.setInterval(() => setFinalClock((clock) => ({...clock})), 1000);
    return () => window.clearInterval(timer);
  }, [showFinalNotice]);

  useEffect(() => {
    if (!finalSummary) return;
    if (finalSummary.phase === "FINAL_STARTED") {
      setIsStationDetailOpen(false);
      setIsLegendOpen(false);
      setIsTeamPanelOpen(false);
      setIsLeaderboardOpen(false);
      setIsScannerOpen(false);
      setIsSettingsOpen(false);
      setSelectedStationId(null);
    }
    if (finalSummary.pendingScoreStationId) {
      scoreForm.setFieldsValue({score: 0, reason: ""});
      setScoreStationId(finalSummary.pendingScoreStationId);
    }
    if ((finalSummary.phase === "NOTICE" || finalSummary.phase === "STATIONS_CLOSED") && !finalToastPhasesRef.current.has(finalSummary.phase)) {
      finalToastPhasesRef.current.add(finalSummary.phase);
      const toastKey = `team-v2-final-${finalSummary.phase}`;
      message.open({
        key: toastKey,
        type: "info",
        duration: 6,
        content: (
          <span className="team-v2-final-toast">
            <span>{finalSummary.phase === "STATIONS_CLOSED" ? t("teamV2.finalUrgentToast") : t("teamV2.finalNoticeToast")}</span>
            <button
              type="button"
              className="team-v2-final-toast-close"
              aria-label={t("common.close")}
              title={t("common.close")}
              onClick={() => message.destroy(toastKey)}
            >
              <CloseOutlined />
            </button>
          </span>
        ),
      });
    }
  }, [finalSummary, message, scoreForm, t]);

  useEffect(() => {
    if (!showFinalNotice || secondsUntilFinal > 0 || finalRefreshRequestedRef.current) return;
    finalRefreshRequestedRef.current = true;
    void fetchPlayerDatabase(language, {fresh: true}).then(loadDatabase).catch(() => undefined);
  }, [language, loadDatabase, secondsUntilFinal, showFinalNotice]);

  const markerViewModels = useMemo<MarkerViewModel[]>(() => {
    const byStationId = new Map(activeTeamStations.map((station) => [station.stationId, station]));
    return stationDefinitions.map((station, index): MarkerViewModel => {
      const position = getStationPosition(station, index, stationDefinitions.length);
      const teamStation = byStationId.get(station.id) ?? null;
      const isSelected = selectedStationId === station.id;
      const appearance = getStationMarkerAppearance(teamStation, isSelected);
      return {
        station,
        teamStation,
        x: (position.x / 100) * MAP_WORLD_WIDTH,
        y: (position.y / 100) * MAP_WORLD_HEIGHT,
        code: getStationDisplayCode(station.id),
        isActive: teamStation?.status === "In Progress",
        isCompleted: appearance.isCompleted,
        isLocked: appearance.isLocked,
        isSelected,
        opacity:
          appearance.isCompleted ? (isSelected ? 0.86 : 0.74) : appearance.opacity,
      };
    });
  }, [activeTeamStations, selectedStationId, stationDefinitions]);

  const markerScreenLayouts = useMemo(
    () => getStationLabelLayouts(markerViewModels, viewportSize, mapTransform),
    [mapTransform, markerViewModels, viewportSize],
  );
  const gatheringPointLayout = useMemo(() => {
    if (!showGatheringPoint) return null;
    const marker = {
      station: {id: TEAM_V2_GATHERING_POINT.id},
      x: (TEAM_V2_GATHERING_POINT.mapX / 100) * MAP_WORLD_WIDTH,
      y: (TEAM_V2_GATHERING_POINT.mapY / 100) * MAP_WORLD_HEIGHT,
    };
    return getStationLabelLayouts([marker], viewportSize, mapTransform).get(marker.station.id) ?? null;
  }, [mapTransform, showGatheringPoint, viewportSize]);
  const visibleMarkers = useMemo(
    () => markerViewModels.flatMap((marker) => {
      const layout = markerScreenLayouts.get(marker.station.id);
      return layout?.isInViewport ? [{marker, layout}] : [];
    }),
    [markerScreenLayouts, markerViewModels],
  );
  const staticVisibleMarkers = useMemo(
    () => visibleMarkers.filter(({marker}) => !marker.isActive),
    [visibleMarkers],
  );
  const activeVisibleMarkers = useMemo(
    () => visibleMarkers.filter(({marker}) => marker.isActive),
    [visibleMarkers],
  );
  const activeAnimatedMarkerId = activeVisibleMarkers[0]?.marker.station.id ?? null;
  const isGatheringPointAnimated = Boolean(
    animateGatheringPoint && gatheringPointLayout?.isInViewport,
  );
  const selectMarker = useCallback((stationId: string) => {
    setSelectedStationId(stationId);
    setIsStationDetailOpen(true);
  }, []);

  useEffect(() => {
    const layer = activeMarkerLayerRef.current;
    const nodes = {
      active: activeMarkerAnimationRef.current,
      gathering: animateGatheringPoint ? gatheringPointAnimationRef.current : null,
    };
    if (
      !layer ||
      isMapInteracting ||
      (!nodes.active && !nodes.gathering) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      resetTeamV2MarkerAnimation(nodes);
      layer?.batchDraw();
      return;
    }

    const animation = new Konva.Animation((frame) => {
      applyTeamV2MarkerAnimationFrame(frame?.time ?? 0, nodes);
    }, layer);
    const syncVisibility = () => {
      if (document.visibilityState === "hidden") {
        animation.stop();
        resetTeamV2MarkerAnimation(nodes);
        layer.batchDraw();
        return;
      }
      animation.start();
    };

    document.addEventListener("visibilitychange", syncVisibility);
    syncVisibility();
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      animation.stop();
      resetTeamV2MarkerAnimation(nodes);
      layer.batchDraw();
    };
  }, [
    activeAnimatedMarkerId,
    animateGatheringPoint,
    isMapInteracting,
    isGatheringPointAnimated,
  ]);

  useLayoutEffect(() => {
    if (!viewportSize.width || !viewportSize.height) {
      return;
    }
    const visualPixelRatio = getTeamV2CanvasPixelRatio(globalThis.devicePixelRatio || 1);
    for (const layer of [
      backgroundLayerRef.current,
      staticMarkerLayerRef.current,
      activeMarkerLayerRef.current,
    ]) {
      layer?.getCanvas().setPixelRatio(visualPixelRatio);
    }
    interactionLayerRef.current?.getCanvas().setPixelRatio(1);
    interactionLayerRef.current?.getHitCanvas().setPixelRatio(1);
    stageRef.current?.batchDraw();
  }, [viewportSize]);

  useLayoutEffect(() => {
    const element = mapViewportRef.current;
    if (!element) {
      return;
    }
    const scheduler = createLatestFrameScheduler<ViewportSize>({
      requestFrame: (callback) => requestAnimationFrame(callback),
      cancelFrame: (frameId) => cancelAnimationFrame(frameId),
      commit: (size) => {
        setViewportSize((current) =>
          current.width === size.width && current.height === size.height ? current : size,
        );
      },
    });
    const updateSize = () => {
      scheduler.schedule({
        width: Math.round(element.clientWidth),
        height: Math.round(element.clientHeight),
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      scheduler.cancel();
    };
  }, []);

  useLayoutEffect(() => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) {
      return;
    }
    const previousViewport = previousViewportRef.current;
    setMapTransform((current) => {
      if (!previousViewport) {
        const next = getDefaultMapTransform(viewportSize);
        liveMapTransformRef.current = next;
        return next;
      }
      const previousBaseScale = getBaseMapScale(previousViewport);
      const nextBaseScale = getBaseMapScale(viewportSize);
      const zoomRatio = current.scale / previousBaseScale;
      const worldCenter = {
        x: (previousViewport.width / 2 - current.x) / current.scale,
        y: (previousViewport.height / 2 - current.y) / current.scale,
      };
      const scale = clampScale(nextBaseScale * zoomRatio, viewportSize);
      const next = {
        scale,
        x: viewportSize.width / 2 - worldCenter.x * scale,
        y: viewportSize.height / 2 - worldCenter.y * scale,
      };
      liveMapTransformRef.current = next;
      return next;
    });
    previousViewportRef.current = viewportSize;
  }, [viewportSize]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsBrowserFullscreen(Boolean(getActiveFullscreenElement()));
      setIsStandaloneApp(isStandaloneDisplayMode());
    };

    TEAM_V2_FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, syncFullscreenState);
    });
    window.addEventListener("pageshow", syncFullscreenState);
    syncFullscreenState();

    return () => {
      TEAM_V2_FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
        document.removeEventListener(eventName, syncFullscreenState);
      });
      window.removeEventListener("pageshow", syncFullscreenState);
    };
  }, []);

  useEffect(() => {
    if (!viewportSize.width) {
      return;
    }
    let cancelled = false;
    const variant = selectPlayerMapImageVariant(
      viewportSize.width,
      globalThis.devicePixelRatio || 1,
      mapTransform.scale >= getBaseMapScale(viewportSize) * 2.4,
    );
    if (variant.width <= loadedMapWidthRef.current) {
      return;
    }
    void loadPlayerMapImage(variant.src).then((image) => {
      if (!cancelled && variant.width >= loadedMapWidthRef.current) {
        loadedMapWidthRef.current = variant.width;
        setMapImage(image);
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mapTransform.scale, viewportSize]);

  const scheduleMapTransform = (nextTransform: MapTransform) => {
    // Pointer events can arrive faster than the display refresh rate. During a
    // gesture, update Konva imperatively and keep React/culling work for release.
    liveMapTransformRef.current = nextTransform;
    mapTransformSchedulerRef.current?.schedule(nextTransform);
  };

  const beginMapInteraction = () => {
    setIsMapInteracting((current) => current || true);
  };

  const commitMapInteraction = () => {
    if (wheelCommitTimerRef.current !== null) {
      clearTimeout(wheelCommitTimerRef.current);
      wheelCommitTimerRef.current = null;
    }
    mapTransformSchedulerRef.current?.cancel();
    const nextTransform = liveMapTransformRef.current;
    setMapTransform(nextTransform);
    setIsMapInteracting(false);
  };

  const applyScaleAtPoint = (nextScale: number, point: {x: number; y: number}) => {
    const current = liveMapTransformRef.current;
    scheduleMapTransform(scaleTeamV2MapAtPoint(current, nextScale, point, viewportSize));
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) {
      return;
    }
    beginMapInteraction();
    const current = liveMapTransformRef.current;
    const nextScale = current.scale * getTeamV2WheelZoomFactor(
      event.evt.deltaY,
      event.evt.deltaMode,
    );
    applyScaleAtPoint(nextScale, pointer);
    if (wheelCommitTimerRef.current !== null) {
      clearTimeout(wheelCommitTimerRef.current);
    }
    wheelCommitTimerRef.current = setTimeout(() => {
      wheelCommitTimerRef.current = null;
      commitMapInteraction();
    }, 120);
  };

  const handleMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    if (event.evt.button !== 0) {
      return;
    }
    beginMapInteraction();
    panRef.current = {
      clientX: event.evt.clientX,
      clientY: event.evt.clientY,
      transform: mapTransform,
      moved: false,
    };
  };

  const handleMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    const panStart = panRef.current;
    if (!panStart || event.evt.buttons !== 1) {
      return;
    }
    panStart.moved = true;
    scheduleMapTransform({
      ...panStart.transform,
      x: panStart.transform.x + event.evt.clientX - panStart.clientX,
      y: panStart.transform.y + event.evt.clientY - panStart.clientY,
    });
  };

  const handleMouseUp = () => {
    panRef.current = null;
    commitMapInteraction();
  };

  const handleTouchStart = (event: KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches;
    if (touches.length === 2) {
      const [first, second] = [touches[0], touches[1]];
      const rect = event.target.getStage()?.container().getBoundingClientRect();
      const transform = liveMapTransformRef.current;
      pinchRef.current = {
        distance: Math.hypot(
          first.clientX - second.clientX,
          first.clientY - second.clientY,
        ),
        point: {
          x: (first.clientX + second.clientX) / 2 - (rect?.left ?? 0),
          y: (first.clientY + second.clientY) / 2 - (rect?.top ?? 0),
        },
        transform,
      };
      beginMapInteraction();
      panRef.current = null;
      return;
    }
    if (touches.length === 1) {
      beginMapInteraction();
      panRef.current = {
        clientX: touches[0].clientX,
        clientY: touches[0].clientY,
        transform: liveMapTransformRef.current,
        moved: false,
      };
    }
  };

  const handleTouchMove = (event: KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches;
    if (touches.length === 1 && panRef.current) {
      event.evt.preventDefault();
      const panStart = panRef.current;
      panStart.moved = true;
      scheduleMapTransform({
        ...panStart.transform,
        x: panStart.transform.x + touches[0].clientX - panStart.clientX,
        y: panStart.transform.y + touches[0].clientY - panStart.clientY,
      });
      return;
    }
    if (touches.length !== 2) {
      pinchRef.current = null;
      return;
    }
    event.evt.preventDefault();
    const [first, second] = [touches[0], touches[1]];
    const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    const rect = event.target.getStage()?.container().getBoundingClientRect();
    if (!rect) {
      return;
    }
    const center = {
      x: (first.clientX + second.clientX) / 2 - rect.left,
      y: (first.clientY + second.clientY) / 2 - rect.top,
    };
    if (!pinchRef.current) {
      pinchRef.current = {
        distance,
        point: center,
        transform: liveMapTransformRef.current,
      };
      return;
    }
    const pinchStart = pinchRef.current;
    scheduleMapTransform(scaleTeamV2MapFromGesture(
      pinchStart.transform,
      pinchStart.transform.scale * (distance / pinchStart.distance),
      pinchStart.point,
      center,
      viewportSize,
    ));
  };

  const resetMap = () => {
    if (wheelCommitTimerRef.current !== null) {
      clearTimeout(wheelCommitTimerRef.current);
      wheelCommitTimerRef.current = null;
    }
    mapTransformSchedulerRef.current?.cancel();
    const nextTransform = getDefaultMapTransform(viewportSize);
    liveMapTransformRef.current = nextTransform;
    setMapTransform(nextTransform);
    setIsMapInteracting(false);
  };

  const handleTouchEnd = (event: KonvaEventObject<TouchEvent>) => {
    const wasTap =
      !pinchRef.current &&
      Boolean(panRef.current) &&
      !panRef.current?.moved &&
      event.evt.changedTouches.length === 1;
    if (wasTap) {
      const now = Date.now();
      if (now - lastTapAtRef.current <= 320) {
        resetMap();
        lastTapAtRef.current = 0;
      } else {
        lastTapAtRef.current = now;
      }
    }
    pinchRef.current = null;
    panRef.current = null;
    commitMapInteraction();
  };

  const handleQrAction = async (rawToken: string): Promise<TeamV2QrSubmitResult> => {
    if (isSubmittingQrRef.current) {
      return {status: "rejected", message: t("teamV2.qrErrors.inProgress")};
    }
    const token = rawToken.trim();
    if (!token) {
      return {status: "rejected", message: t("teamV2.qrRequired")};
    }
    isSubmittingQrRef.current = true;
    try {
      const {result} = await executePlayerMutation(
        () => submitPlayerQrAction(token),
        language,
        {reconcile: "v2-runtime"},
      );
      setQrToken("");
      setIsScannerOpen(false);
      if (result.action === "CHECK_IN") {
        message.success(t("teamV2.checkInSuccess"));
        setSelectedStationId(null);
        return {status: "accepted"};
      }
      if (result.requiresScore) {
        scoreForm.setFieldsValue({score: 0, reason: ""});
        setScoreStationId(result.stationId);
        setSelectedStationId(null);
        message.success(t("teamV2.checkOutScoreRequired"));
        return {status: "accepted"};
      }
      setSelectedStationId(null);
      message.success(t("teamV2.checkOutSuccess"));
      return {status: "accepted"};
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        navigate("/login");
        return {status: "accepted"};
      }
      return {
        status: "rejected",
        message: t(getQrActionErrorKey(error)),
      };
    } finally {
      isSubmittingQrRef.current = false;
    }
  };

  const openSupport = (supportUrl: string) => {
    const supportWindow = window.open(supportUrl, "_blank", "noopener,noreferrer");
    if (supportWindow) {
      supportWindow.opener = null;
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      const result = await toggleBrowserFullscreen();
      if (result === "exited" && isLandscapeLocked) {
        unlockLandscapeOrientation();
        setIsLandscapeLocked(false);
      }
      if (result === "unsupported") {
        message.info(t("teamV2.fullscreenUnavailable"), 7);
      }
    } catch {
      message.warning(t("teamV2.fullscreenFailed"));
    }
  };

  const handleToggleLandscape = async () => {
    try {
      const result = await toggleLandscapeOrientation(isLandscapeLocked);
      if (result === "locked") setIsLandscapeLocked(true);
      if (result === "unlocked") setIsLandscapeLocked(false);
      if (result === "unsupported") message.info(t("teamV2.landscapeUnavailable"), 7);
    } catch {
      message.info(t("teamV2.landscapeUnavailable"), 7);
    }
  };

  if (!activeTeam) {
    return (
      <main className="team-v2-page">
        <div className="team-v2-empty"><Spin /></div>
      </main>
    );
  }

  const selectedPlayingCount = selectedStation ? (playingCounts[selectedStation.stationId] ?? 0) : 0;
  const footerScale = 1;
  return (
    <main className="team-v2-page">
      {!isFinalMode && <div
        className="team-v2-map-backdrop"
        ref={mapViewportRef}
        role="region"
        aria-label={t("teamV2.mapAriaLabel")}
        data-map-x={mapTransform.x.toFixed(2)}
        data-map-y={mapTransform.y.toFixed(2)}
        data-map-scale={mapTransform.scale.toFixed(4)}
        onDoubleClick={resetMap}>
        {viewportSize.width > 0 && viewportSize.height > 0 && (
          <Stage
            ref={setStageNode}
            width={viewportSize.width}
            height={viewportSize.height}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDblClick={resetMap}
            onDblTap={resetMap}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            <Layer ref={backgroundLayerRef} listening={false}>
              <Rect
                width={MAP_WORLD_WIDTH}
                height={MAP_WORLD_HEIGHT}
                fill="rgba(0, 0, 0, 0.01)"
                listening={false}
              />
              {mapImage && (
                <KonvaImage
                  image={mapImage}
                  width={MAP_WORLD_WIDTH}
                  height={MAP_WORLD_HEIGHT}
                  listening={false}
                />
              )}
            </Layer>
            <Layer
              ref={staticMarkerLayerRef}
              listening={false}
              x={-mapTransform.x / mapTransform.scale}
              y={-mapTransform.y / mapTransform.scale}
              scaleX={1 / mapTransform.scale}
              scaleY={1 / mapTransform.scale}>
              {staticVisibleMarkers.map(({marker, layout}) => (
                <StationMarker
                  key={`marker-${marker.station.id}`}
                  marker={marker}
                  hudAccent={V2_HUD_ACCENT}
                  size={layout.markerSize}
                  x={layout.anchorX}
                  y={layout.anchorY}
                  pointsUnit={t("teamV2.pointsUnit")}
                  isInteracting={isMapInteracting}
                />
              ))}
            </Layer>
            <Layer
              ref={activeMarkerLayerRef}
              listening={false}
              x={-mapTransform.x / mapTransform.scale}
              y={-mapTransform.y / mapTransform.scale}
              scaleX={1 / mapTransform.scale}
              scaleY={1 / mapTransform.scale}>
              {activeVisibleMarkers.map(({marker, layout}, index) => (
                <StationMarker
                  key={`marker-${marker.station.id}`}
                  marker={marker}
                  hudAccent={V2_HUD_ACCENT}
                  size={layout.markerSize}
                  x={layout.anchorX}
                  y={layout.anchorY}
                  pointsUnit={t("teamV2.pointsUnit")}
                  isInteracting={isMapInteracting}
                  animationRef={index === 0 ? activeMarkerAnimationRef : undefined}
                />
              ))}
              {gatheringPointLayout?.isInViewport && (
                <GatheringPointMarker
                  x={gatheringPointLayout.anchorX}
                  y={gatheringPointLayout.anchorY}
                  size={gatheringPointLayout.markerSize}
                  label={t("teamV2.gatheringPoint")}
                  isInteracting={isMapInteracting}
                  animationRef={animateGatheringPoint ? gatheringPointAnimationRef : undefined}
                />
              )}
            </Layer>
            <Layer
              ref={interactionLayerRef}
              x={-mapTransform.x / mapTransform.scale}
              y={-mapTransform.y / mapTransform.scale}
              scaleX={1 / mapTransform.scale}
              scaleY={1 / mapTransform.scale}>
              {visibleMarkers.map(({marker, layout}) => (
                <MarkerHitArea
                  key={`marker-hit-${marker.station.id}`}
                  markerId={marker.station.id}
                  size={layout.markerSize}
                  x={layout.anchorX}
                  y={layout.anchorY}
                  onSelect={selectMarker}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>}

      <DemoHudHeader
        score={activeTeam.score}
        hideScore={isFinalMode && isFinalCompleted}
        onSettings={() => {
          setIsLeaderboardOpen(false);
          setIsScannerOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {showFinalNotice && !isFinalMode && (
        <aside className="team-v2-final-notice" role="status">
          <strong>{finalSummary?.phase === "STATIONS_CLOSED" ? t("teamV2.finalUrgentTitle") : t("teamV2.finalNoticeTitle")}</strong>
          <p>{t("teamV2.finalNoticeDescription")}</p>
          <span>{t("teamV2.finalCountdown", {time: formatFinalCountdown(secondsUntilFinal)})}</span>
        </aside>
      )}

      {isFinalMode && <TeamV2FinalChallenge language={language} onCompleted={handleFinalCompleted} />}

      {!isFinalMode && <DemoMarkerLegend
        open={isLegendOpen}
        onToggle={() => setIsLegendOpen((current) => !current)}
      />}

      {!isFinalMode && selectedStation && isStationDetailOpen && (
        <TeamV2StationDetailOverlay
          station={selectedStation}
          playingTeamCount={selectedPlayingCount}
          opacity={panelOpacity}
          language={language}
          onClose={() => {
            setIsStationDetailOpen(false);
            setSelectedStationId(null);
          }}
          onRequestScan={() => {
            setQrToken("");
            setIsScannerOpen(true);
          }}
          onCancel={async () => {
            try {
              await executePlayerMutation(
                () => cancelPlayerStation(selectedStation.stationId),
                language,
                {reconcile: "v2-runtime"},
              );
              message.success(t("stationDetail.cancelled"));
              setSelectedStationId(null);
              setIsStationDetailOpen(false);
            } catch {
              message.error(t("errors.generic"));
            }
          }}
        />
      )}

      {!isFinalMode && <DemoFooter
        activeStation={activeStation}
        footerScale={footerScale}
        onLeaderboard={() => {
          setIsSettingsOpen(false);
          setIsScannerOpen(false);
          setIsLeaderboardOpen(true);
        }}
        onScan={() => {
          setIsSettingsOpen(false);
          setIsLeaderboardOpen(false);
          setQrToken("");
          setIsScannerOpen(true);
        }}
        onMyTeam={() => {
          setIsSettingsOpen(false);
          setIsLeaderboardOpen(false);
          setIsScannerOpen(false);
          setIsTeamPanelOpen(true);
        }}
      />}

      {!isFinalMode && <TeamOverviewOverlay
        open={isTeamPanelOpen}
        opacity={panelOpacity}
        team={activeTeam}
        stations={markerViewModels}
        language={language}
        onClose={() => setIsTeamPanelOpen(false)}
        onContinue={(stationId) => {
          setIsTeamPanelOpen(false);
          setSelectedStationId(stationId);
          setIsStationDetailOpen(true);
        }}
      />}

      {isSettingsOpen && (
        <div
          className="team-v2-overlay-layer"
          style={getTeamV2OverlayStyle(panelOpacity)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsSettingsOpen(false);
          }}>
          <section
            className="team-v2-overlay team-v2-settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-v2-settings-title">
            <div className="team-v2-overlay-header">
              <div>
                <span className="team-v2-kicker">{t("teamV2.setup")}</span>
                <Typography.Title id="team-v2-settings-title" level={3}>{t("nav.setting")}</Typography.Title>
              </div>
              <button type="button" className="team-v2-icon-button" onClick={() => setIsSettingsOpen(false)} aria-label={t("teamV2.closeOverlay")}>
                <CloseOutlined />
              </button>
            </div>
            <div className="team-v2-settings-body">
              <div className="team-v2-display-controls">
                {!isStandaloneApp && (
                  <div className="team-v2-setting-row">
                    <span>{t("teamV2.enterFullscreen")}</span>
                    <Switch className="team-v2-display-switch" checked={isBrowserFullscreen} onChange={() => void handleToggleFullscreen()} />
                  </div>
                )}
                <div className="team-v2-setting-row">
                  <span>{t("teamV2.lockLandscape")}</span>
                  <Switch className="team-v2-display-switch" checked={isLandscapeLocked} onChange={() => void handleToggleLandscape()} />
                </div>
              </div>
              <div className="team-v2-setting-row">
                <span>{t("language.switch")}</span>
                <LanguageSwitch onChange={(nextLanguage) => void fetchPlayerDatabase(nextLanguage).then(loadDatabase).catch(() => message.warning(t("stationData.refreshFailed")))} />
              </div>
              <div className="team-v2-team-card">
                <strong>{getLocalizedTeamName(activeTeam.name, language)}</strong>
                <span>#{activeTeam.id}</span>
                {activeTeam.captainName && <small>{activeTeam.captainName}</small>}
              </div>
              <div className="team-v2-setting-row vertical">
                <span>{t("teamV2.opacity", {value: panelOpacity})}</span>
                <Slider
                  min={50}
                  max={100}
                  step={5}
                  value={panelOpacity}
                  onChange={(value) => {
                    setPanelOpacity(value);
                    persistPanelOpacity(value);
                  }}
                />
              </div>
              <div className="team-v2-support-actions">
                <Button block icon={<CustomerServiceOutlined />} onClick={() => openSupport(ZALO_SUPPORT_URLS[0])}>
                  {t("teamV2.zaloSupport1")}
                </Button>
                <Button
                  block
                  icon={<CustomerServiceOutlined />}
                  disabled={!ZALO_SUPPORT_URLS[1]}
                  onClick={() => {
                    const supportUrl = ZALO_SUPPORT_URLS[1];
                    if (supportUrl) {
                      openSupport(supportUrl);
                    }
                  }}
                >
                  {t(ZALO_SUPPORT_URLS[1] ? "teamV2.zaloSupport2" : "teamV2.zaloSupport2Pending")}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      <LeaderboardOverlay
        open={isLeaderboardOpen}
        opacity={panelOpacity}
        activeTeam={activeTeam}
        language={language}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {!isFinalMode && isScannerOpen && (
        <div
          className="team-v2-overlay-layer team-v2-scanner-layer"
          style={getTeamV2OverlayStyle(panelOpacity)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsScannerOpen(false);
          }}>
          <section
            className="team-v2-overlay team-v2-scanner"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-v2-scanner-title">
            <div className="team-v2-overlay-header">
              <div>
                <span className="team-v2-kicker">{t("teamV2.scanKicker")}</span>
                <Typography.Title id="team-v2-scanner-title" level={3}>{t("teamV2.scanTitle")}</Typography.Title>
              </div>
              <button type="button" className="team-v2-icon-button" onClick={() => setIsScannerOpen(false)} aria-label={t("teamV2.closeOverlay")}>
                <CloseOutlined />
              </button>
            </div>
            <TeamV2QrScanner
              value={qrToken}
              onChange={setQrToken}
              onSubmitToken={handleQrAction}
              placeholder={t("teamV2.qrPlaceholder")}
            />
          </section>
        </div>
      )}

      {scoreStation && (
        <div
          className="team-v2-overlay-layer"
          style={getTeamV2OverlayStyle(panelOpacity)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setScoreStationId(null);
          }}>
          <section
            className="team-v2-overlay team-v2-score-entry"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-v2-score-title">
            <div className="team-v2-overlay-header">
              <div>
                <span className="team-v2-kicker">{getStationDisplayCode(scoreStation.stationId)}</span>
                <Typography.Title id="team-v2-score-title" level={3}>{t("stationDetail.enterScore")}</Typography.Title>
              </div>
              <button type="button" className="team-v2-icon-button" onClick={() => setScoreStationId(null)} aria-label={t("teamV2.closeOverlay")}>
                <CloseOutlined />
              </button>
            </div>
            <Form
              form={scoreForm}
              layout="vertical"
              onFinish={(values) => {
                modal.confirm({
                  centered: true,
                  title: t("stationDetail.confirmScoreTitle", {score: values.score}),
                  content: <Flex vertical gap={8}>
                    <Typography.Text>{t("stationDetail.confirmScoreContent", {
                      station: `${getStationDisplayCode(scoreStation.stationId)} - ${scoreStation.name}`,
                    })}</Typography.Text>
                    {isStationReferenceExceeded(scoreStation, values.score) && (
                      <Alert showIcon type="warning" message={t("stationDetail.referenceExceededWarning", {reference: getStationReferencePointsDisplay(scoreStation)})} />
                    )}
                  </Flex>,
                  okText: t("common.confirm"),
                  cancelText: t("common.cancel"),
                  onOk: async () => {
                    setIsSubmittingScore(true);
                    try {
                      await executePlayerMutation(
                        () => submitStationScore(
                          scoreStation.stationId,
                          values.score,
                          values.reason,
                        ),
                        language,
                        {reconcile: "v2-runtime"},
                      );
                      message.success(t("stationDetail.completedSuccess"));
                      setScoreStationId(null);
                      setSelectedStationId(null);
                    } catch {
                      message.error(t("stationDetail.scoreSubmissionFailed"));
                    } finally {
                      setIsSubmittingScore(false);
                    }
                  },
                });
              }}>
              <Form.Item label={t("stationDetail.inputScore")} name="score" initialValue={0} rules={[{required: true}]}>
                <InputNumber min={0} max={getStationScoreEntryMax(scoreStation)} className="full-width" />
              </Form.Item>
              <Form.Item label={t("stationDetail.reason")} name="reason">
                <Input.TextArea rows={2} placeholder={t("stationDetail.optionalNote")} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={isSubmittingScore}>
                {t("stationDetail.saveScore")}
              </Button>
            </Form>
          </section>
        </div>
      )}
    </main>
  );
}
