import {
  ArrowLeftOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {App as AntdApp, Button, Empty, Form, Input, InputNumber, Slider, Spin, Switch, Typography} from "antd";
import type {KonvaEventObject} from "konva/lib/Node";
import Konva from "konva";
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties} from "react";
import {useTranslation} from "react-i18next";
import {Arc, Circle, Ellipse, Group, Image as KonvaImage, Layer, Path, Rect, Stage, Text} from "react-konva";
import {useNavigate} from "react-router-dom";
import {
  getPlayerLeaderboard,
  ApiError,
  cancelPlayerStation,
  isAuthFailure,
  logout as logoutApi,
  submitPlayerQrAction,
  submitStationScore,
  type LeaderboardEntryResponse,
} from "../api";
import {LanguageSwitch} from "../components/LanguageSwitch";
import {TeamV2QrBadge} from "../components/TeamV2QrBadge";
import {TeamV2StationDetailOverlay} from "../components/TeamV2StationDetailOverlay";
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
import {getTeamV2LeaderboardRows} from "./teamV2Leaderboard";
import {
  getActiveFullscreenElement,
  isStandaloneDisplayMode,
  TEAM_V2_FULLSCREEN_CHANGE_EVENTS,
  toggleLandscapeOrientation,
  toggleBrowserFullscreen,
  unlockLandscapeOrientation,
} from "./teamV2Fullscreen";
import {
  TeamV2QrScanner,
  type TeamV2QrSubmitResult,
} from "../components/TeamV2QrScanner";
import {useStationPlayingCounts} from "../hooks/useStationPlayingCounts";
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
  getStationEffectiveMaxPoints,
} from "../utils";
import "./TeamGameplayV2Page.css";
import "./TeamGameplayV2Demo.css";

const PANEL_OPACITY_STORAGE_KEY = "movement-team-v2-panel-opacity-v2";
const V2_HUD_ACCENT = "#2FE4F0";
const MAP_WORLD_WIDTH = 2048;
const MAP_WORLD_HEIGHT = 1000;
const MIN_MAP_ZOOM = 0.8;
const MAX_MAP_ZOOM = 5;
const ZALO_SUPPORT_URL = "https://zalo.me/0909384697";

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

function getBaseMapScale(viewport: ViewportSize) {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return 1;
  }
  if (viewport.height > viewport.width) {
    return (viewport.height * 0.94) / MAP_WORLD_HEIGHT;
  }
  return Math.min(
    viewport.width / MAP_WORLD_WIDTH,
    viewport.height / MAP_WORLD_HEIGHT,
  );
}

function clampScale(value: number, viewport: ViewportSize) {
  const baseScale = getBaseMapScale(viewport);
  return Math.max(
    baseScale * MIN_MAP_ZOOM,
    Math.min(baseScale * MAX_MAP_ZOOM, value),
  );
}

function getDefaultMapTransform(viewport: ViewportSize): MapTransform {
  const scale = getBaseMapScale(viewport);
  return {
    scale,
    x: (viewport.width - MAP_WORLD_WIDTH * scale) / 2,
    y: (viewport.height - MAP_WORLD_HEIGHT * scale) / 2,
  };
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
      glow: "#FFCB4B",
      gradient: [0, "#FFF8B7", 0.42, "#FFD45B", 0.72, "#FFAD2F", 1, "#FF67B3"],
      inner: "rgba(65, 43, 3, 0.88)",
      meta: "#FFF8D8",
    };
  }
  if (marker.isCompleted) {
    return {
      stroke: "#EEF4FF",
      glow: "#FFFFFF",
      gradient: [0, "#FFFFFF", 0.58, "#CDD7E9", 1, "#A89CC7"],
      inner: "rgba(31, 37, 49, 0.9)",
      meta: "#E8EAF0",
    };
  }
  if (marker.isLocked) {
    return {
      stroke: "#817A99",
      glow: "#8E62BA",
      gradient: [0, "#8194AA", 0.5, "#665F86", 1, "#854DA8"],
      inner: "rgba(24, 24, 35, 0.9)",
      meta: "#A9A4B9",
    };
  }
  return {
    stroke: "#76EFFF",
    glow: hudAccent,
    gradient: [0, "#92F7FF", 0.46, "#4BDCFF", 0.76, "#6E82FF", 1, "#B04CFF"],
    inner: "rgba(4, 18, 27, 0.94)",
    meta: "#76EFFF",
  };
}

function StationMarker({
  marker,
  hudAccent,
  size,
  x,
  y,
  pointsUnit,
  isInteracting,
  onSelect,
}: {
  marker: MarkerViewModel;
  hudAccent: string;
  size: number;
  x: number;
  y: number;
  pointsUnit: string;
  isInteracting: boolean;
  onSelect: () => void;
}) {
  const activeMarkerRef = useRef<Konva.Group>(null);
  const colors = getMarkerColors(marker, hudAccent);
  const pinWidth = size;
  const pinHeight = size * 1.35;
  const markerCenterY = -pinHeight * 0.57;
  const pinScaleX = pinWidth / 58;
  const pinScaleY = pinHeight / 84;
  const pinBottomOffset = -54 * pinScaleY;
  const hitRadius = Math.max(22, size * 0.55);
  const lockRadius = Math.max(5, size * 0.16);
  const points = getStationEffectiveMaxPoints({
    trackingMode: marker.teamStation?.trackingMode ?? marker.station.trackingMode ?? "BOTH",
    maxPoints: marker.teamStation?.maxPoints ?? marker.station.maxPoints,
  });

  useEffect(() => {
    const node = activeMarkerRef.current;
    if (!node || !marker.isActive || isInteracting || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frameId = 0;
    const animate = (time: number) => {
      const beat = Math.max(0, Math.sin((time / 1450) * Math.PI * 4));
      const scale = 1 + beat * 0.08;
      node.scale({x: scale, y: scale});
      node.opacity(0.84 + beat * 0.16);
      node.getLayer()?.batchDraw();
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
      node.scale({x: 1, y: 1});
      node.opacity(1);
    };
  }, [isInteracting, marker.isActive]);

  return (
    <Group
      x={x}
      y={y}
      opacity={marker.opacity}
      onClick={(event) => {
        event.cancelBubble = true;
        onSelect();
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        onSelect();
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
      }}>
      <Circle y={-hitRadius} radius={hitRadius} fill="rgba(255,255,255,0.01)" />
      <Group ref={activeMarkerRef} listening={false}>
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
        fill={marker.isActive ? "rgba(38, 28, 4, 0.96)" : marker.isCompleted ? "rgba(15, 18, 24, 0.96)" : "rgba(2, 9, 15, 0.97)"}
        stroke={colors.stroke}
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
        stroke={marker.isActive ? "#FF67B3" : marker.isCompleted ? "#A89CC7" : marker.isLocked ? "#665F86" : "#B04CFF"}
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
        fontFamily="Oxanium, Aptos, Segoe UI, sans-serif"
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
              strokeWidth={1}
              cornerRadius={STATION_LABEL_HEIGHT / 2}
              opacity={0.16}
            />
          </>
        )}
        <Rect
          width={STATION_LABEL_WIDTH}
          height={STATION_LABEL_HEIGHT}
          fill={marker.isActive ? "rgba(32, 26, 5, 0.97)" : "rgba(5, 31, 45, 0.96)"}
          stroke={colors.stroke}
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
          fontFamily="Space Grotesk, Aptos, Segoe UI, sans-serif"
          fontSize={9.5}
          fontStyle="bold"
          fill={colors.meta}
          align="center"
          verticalAlign="middle"
        />
      </Group>
      </Group>
    </Group>
  );
}

function DemoHudHeader({score, onSettings}: {score: number; onSettings: () => void}) {
  const {t} = useTranslation();
  return (
    <>
      <header className="team-v2-header team-v2-demo-header">
        <div className="team-v2-event-brand" aria-label="MOVEment 2026"><h1>MOVEment 2026</h1></div>
        <button type="button" className="team-v2-settings-button" aria-label={t("teamV2.openSettings")} title={t("teamV2.openSettings")} onClick={onSettings}>
          <SettingOutlined />
        </button>
      </header>
      <section className="team-v2-score" aria-label={`${t("common.totalScore")}: ${score}`}>
        <div className="team-v2-score-line"><strong>{score}</strong><span>{t("teamV2.pointsUnit")}</span></div>
        <small>{t("common.totalScore")}</small>
      </section>
    </>
  );
}

function DemoMarkerLegend({open, onToggle}: {open: boolean; onToggle: () => void}) {
  const {t} = useTranslation();
  return (
    <div className={`team-v2-legend-control${open ? " is-open" : ""}`}>
      <button type="button" className="team-v2-legend-toggle" aria-expanded={open} aria-controls="team-v2-marker-legend" onClick={onToggle}>
        <span aria-hidden="true">i</span>{t("teamV2.legendTitle")}<b aria-hidden="true">⌄</b>
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
                const maxPoints = getStationEffectiveMaxPoints({
                  trackingMode: item.teamStation?.trackingMode ?? item.station.trackingMode ?? "BOTH",
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
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const clearSession = useMovementStore((state) => state.logout);
  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const activeTeamStations = useMemo(
    () => teamStations[activeTeamId] ?? [],
    [activeTeamId, teamStations],
  );
  const language = i18n.language === "en" ? "en" : "vi";
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
  const liveMapTransformRef = useRef<MapTransform>(mapTransform);
  const isSubmittingQrRef = useRef(false);
  const pinchRef = useRef<{distance: number; scale: number} | null>(null);
  const panRef = useRef<{
    clientX: number;
    clientY: number;
    transform: MapTransform;
    moved: boolean;
  } | null>(null);
  const lastTapAtRef = useRef(0);
  const previousViewportRef = useRef<ViewportSize | null>(null);
  const mapTransformSchedulerRef = useRef<LatestFrameScheduler<MapTransform> | null>(null);
  useEffect(() => {
    const scheduler = createLatestFrameScheduler<MapTransform>({
      requestFrame: (callback) => requestAnimationFrame(callback),
      cancelFrame: (frameId) => cancelAnimationFrame(frameId),
      commit: (transform) => {
        const stage = stageRef.current;
        if (!stage) {
          return;
        }
        stage.position({x: transform.x, y: transform.y});
        stage.scale({x: transform.scale, y: transform.scale});
        stage.batchDraw();
      },
    });
    mapTransformSchedulerRef.current = scheduler;
    return () => {
      scheduler.cancel();
      mapTransformSchedulerRef.current = null;
    };
  }, []);
  const playingCounts = useStationPlayingCounts(Boolean(session?.role === "user"));

  const scoreStation = activeTeamStations.find((station) => station.stationId === scoreStationId) ?? null;
  const selectedStation =
    activeTeamStations.find((station) => station.stationId === selectedStationId) ?? null;
  const activeStation =
    activeTeamStations.find((station) => station.status === "In Progress") ?? null;

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

  useLayoutEffect(() => {
    const element = mapViewportRef.current;
    if (!element) {
      return;
    }
    const updateSize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setViewportSize((current) =>
        current.width === width && current.height === height ? current : {width, height},
      );
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
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
    mapTransformSchedulerRef.current?.cancel();
    const nextTransform = liveMapTransformRef.current;
    setMapTransform(nextTransform);
    setIsMapInteracting(false);
  };

  const applyScaleAtPoint = (nextScale: number, point: {x: number; y: number}) => {
    const current = liveMapTransformRef.current;
    const clampedScale = clampScale(nextScale, viewportSize);
    const worldPoint = {
      x: (point.x - current.x) / current.scale,
      y: (point.y - current.y) / current.scale,
    };
    scheduleMapTransform({
      scale: clampedScale,
      x: point.x - worldPoint.x * clampedScale,
      y: point.y - worldPoint.y * clampedScale,
    });
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) {
      return;
    }
    const current = mapTransformSchedulerRef.current?.peek() ?? mapTransform;
    const nextScale = event.evt.deltaY > 0 ? current.scale / 1.08 : current.scale * 1.08;
    applyScaleAtPoint(nextScale, pointer);
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
      pinchRef.current = {
        distance: Math.hypot(
          first.clientX - second.clientX,
          first.clientY - second.clientY,
        ),
        scale: liveMapTransformRef.current.scale,
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
      pinchRef.current = {distance, scale: liveMapTransformRef.current.scale};
      return;
    }
    applyScaleAtPoint(pinchRef.current.scale * (distance / pinchRef.current.distance), center);
  };

  const resetMap = () => {
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

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Keep logout available offline; backend session validation remains authoritative.
    }
    clearSession();
    navigate("/login");
  };

  const openSupport = () => {
    const supportWindow = window.open(ZALO_SUPPORT_URL, "_blank", "noopener,noreferrer");
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
      <div
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
            ref={stageRef}
            width={viewportSize.width}
            height={viewportSize.height}
            x={mapTransform.x}
            y={mapTransform.y}
            scaleX={mapTransform.scale}
            scaleY={mapTransform.scale}
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
            <Layer>
              <Rect
                width={MAP_WORLD_WIDTH}
                height={MAP_WORLD_HEIGHT}
                fill="rgba(0, 0, 0, 0.01)"
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
              x={-mapTransform.x / mapTransform.scale}
              y={-mapTransform.y / mapTransform.scale}
              scaleX={1 / mapTransform.scale}
              scaleY={1 / mapTransform.scale}>
              {[...markerViewModels].sort((a, b) => Number(a.isActive) - Number(b.isActive)).map((marker) => {
                const layout = markerScreenLayouts.get(marker.station.id);
                return layout?.isInViewport ? (
                  <StationMarker
                    key={`marker-${marker.station.id}`}
                    marker={marker}
                    hudAccent={V2_HUD_ACCENT}
                    size={layout.markerSize}
                    x={layout.anchorX}
                    y={layout.anchorY}
                    pointsUnit={t("teamV2.pointsUnit")}
                    isInteracting={isMapInteracting}
                    onSelect={() => {
                      setSelectedStationId(marker.station.id);
                      setIsStationDetailOpen(true);
                    }}
                  />
                ) : null;
              })}
            </Layer>
          </Stage>
        )}
      </div>

      <DemoHudHeader
        score={activeTeam.score}
        onSettings={() => {
          setIsLeaderboardOpen(false);
          setIsScannerOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      <DemoMarkerLegend
        open={isLegendOpen}
        onToggle={() => setIsLegendOpen((current) => !current)}
      />

      {selectedStation && isStationDetailOpen && (
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

      <DemoFooter
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
      />

      <TeamOverviewOverlay
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
      />

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
              <Button icon={<CustomerServiceOutlined />} onClick={openSupport}>
                {t("teamV2.zaloSupport")}
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/stations/map")}>
                {t("teamV2.backToV1")}
              </Button>
              <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                {t("auth.logout")}
              </Button>
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

      {isScannerOpen && (
        <div
          className="team-v2-overlay-layer"
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
                  content: t("stationDetail.confirmScoreContent", {
                    station: `${getStationDisplayCode(scoreStation.stationId)} - ${scoreStation.name}`,
                  }),
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
                <InputNumber min={0} max={getStationEffectiveMaxPoints(scoreStation)} className="full-width" />
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
