import {
  ArrowLeftOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {App as AntdApp, Button, Empty, Form, Input, InputNumber, Slider, Spin, Typography} from "antd";
import type {KonvaEventObject} from "konva/lib/Node";
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties} from "react";
import {useTranslation} from "react-i18next";
import {Arc, Circle, Group, Image as KonvaImage, Layer, Path, Rect, Stage, Text} from "react-konva";
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
  getNonOverlappingStationLabelIds,
  getStationMarkerFontSize,
  getStationLabelLayouts,
  STATION_LABEL_HEIGHT,
  STATION_LABEL_WIDTH,
  type MarkerScreenLayout,
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
  toggleBrowserFullscreen,
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
    return (viewport.height * 0.78) / MAP_WORLD_HEIGHT;
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
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
      stroke: "#FFD447",
      glow: "#FFB800",
      usesSilverPurple: false,
    };
  }
  if (marker.isCompleted) {
    return {
      stroke: "#8FA4B8",
      glow: "#58738C",
      usesSilverPurple: true,
    };
  }
  if (marker.isLocked) {
    return {
      stroke: "#778698",
      glow: "#526276",
      usesSilverPurple: true,
    };
  }
  return {
    stroke: hudAccent,
    glow: hudAccent,
    usesSilverPurple: false,
  };
}

function StationMarker({
  marker,
  hudAccent,
  size,
  x,
  y,
  onSelect,
}: {
  marker: MarkerViewModel;
  hudAccent: string;
  size: number;
  x: number;
  y: number;
  onSelect: () => void;
}) {
  const {t} = useTranslation();
  const colors = getMarkerColors(marker, hudAccent);
  const markerCenterY = -size * 0.9;
  const hitRadius = Math.max(22, size * 0.51);
  const lockRadius = Math.max(5, size * 0.16);

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
      {marker.isActive && (
        <>
          <Circle
            y={-1}
            radius={size * 0.52}
            scaleY={0.2}
            stroke="#FFD447"
            strokeWidth={2}
            shadowColor="#FFB800"
            shadowBlur={18}
            opacity={0.95}
            listening={false}
          />
          <Circle
            y={-1}
            radius={size * 0.72}
            scaleY={0.2}
            stroke="#FFB800"
            strokeWidth={1.2}
            opacity={0.48}
            listening={false}
          />
          <Group y={-size * 1.78} listening={false}>
            <Rect
              x={-size * 0.48}
              width={size * 0.96}
              height={Math.max(14, size * 0.25)}
              cornerRadius={9}
              fill="rgba(25, 20, 3, 0.94)"
              stroke="#FFD447"
              strokeWidth={1}
              shadowColor="#FFB800"
              shadowBlur={10}
            />
            <Text
              width={size * 0.96}
              x={-size * 0.48}
              height={Math.max(14, size * 0.25)}
              text={`⚡ ${t("teamV2.activeStation")}`}
              align="center"
              verticalAlign="middle"
              fontFamily="Aptos, Segoe UI, sans-serif"
              fontSize={Math.max(7, size * 0.115)}
              fontStyle="bold"
              fill="#FFF2A8"
            />
          </Group>
          <Group x={size * 0.38} y={-size * 1.18} listening={false}>
            <Circle
              radius={Math.max(6, size * 0.13)}
              fill="#241A00"
              stroke="#FFD447"
              strokeWidth={1.4}
              shadowColor="#FFB800"
              shadowBlur={9}
            />
            <Path
              x={-3.5}
              y={-5}
              data="M5 0 L1 6 H4 L2 11 L8 4 H5 Z"
              fill="#FFE36E"
            />
          </Group>
        </>
      )}
      <Path
        x={-size / 2}
        y={-size * 1.52}
        scaleX={size / 80}
        scaleY={size / 80}
        data="M40 0 C17 0 0 18 0 42 C0 70 14 94 40 122 C66 94 80 70 80 42 C80 18 63 0 40 0 Z"
        fill="rgba(3, 14, 20, 0.98)"
        stroke={colors.glow}
        strokeWidth={10}
        opacity={0.28}
        shadowColor={colors.glow}
        shadowBlur={marker.isSelected || marker.isActive ? 30 : 18}
        listening={false}
      />
      <Path
        x={-size / 2}
        y={-size * 1.52}
        scaleX={size / 80}
        scaleY={size / 80}
        data="M40 0 C17 0 0 18 0 42 C0 70 14 94 40 122 C66 94 80 70 80 42 C80 18 63 0 40 0 Z"
        fill="rgba(3, 14, 20, 0.96)"
        stroke={colors.stroke}
        strokeWidth={3.6}
        shadowColor={colors.glow}
        shadowBlur={marker.isSelected || marker.isActive ? 18 : 10}
        shadowOpacity={0.82}
        listening={false}
      />
      <Circle
        y={markerCenterY}
        radius={size * 0.34}
        fill="rgba(2, 9, 15, 0.86)"
        shadowColor="#000000"
        shadowBlur={8}
        listening={false}
      />
      <Text
        x={-size / 2}
        y={markerCenterY - size * 0.25}
        width={size}
        height={size * 0.5}
        text={marker.code}
        align="center"
        verticalAlign="middle"
        fontFamily="Aptos, Segoe UI, sans-serif"
        fontSize={getStationMarkerFontSize(marker.code, size)}
        fontStyle="bold"
        fill="#FFFFFF"
        shadowColor={colors.glow}
        shadowBlur={3}
        listening={false}
      />
      {marker.isLocked && (
        <Group
          x={size * 0.35}
          y={-size * 1.16}
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
    </Group>
  );
}

function StationMarkerLabel({
  layout,
  hudAccent,
  pointsUnit,
  onSelect,
}: {
  layout: MarkerScreenLayout<MarkerViewModel>;
  hudAccent: string;
  pointsUnit: string;
  onSelect: () => void;
}) {
  const {marker, labelX, labelY, labelScale} = layout;
  const colors = getMarkerColors(marker, hudAccent);
  const points = getStationEffectiveMaxPoints({
    trackingMode: marker.teamStation?.trackingMode ?? marker.station.trackingMode ?? "BOTH",
    maxPoints: marker.teamStation?.maxPoints ?? marker.station.maxPoints,
  });

  return (
    <Group
      x={labelX}
      y={labelY}
      opacity={marker.opacity}
      scaleX={labelScale}
      scaleY={labelScale}
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
      }}>
      {(marker.isSelected || marker.isActive) && (
        <>
          <Rect
            x={5}
            y={6}
            width={STATION_LABEL_WIDTH - 10}
            height={STATION_LABEL_HEIGHT}
            stroke={colors.stroke}
            strokeWidth={1}
            cornerRadius={STATION_LABEL_HEIGHT / 2}
            opacity={marker.isActive ? 0.52 : 0.34}
            listening={false}
          />
          <Rect
            x={10}
            y={11}
            width={STATION_LABEL_WIDTH - 20}
            height={STATION_LABEL_HEIGHT}
            stroke={colors.stroke}
            strokeWidth={1}
            cornerRadius={STATION_LABEL_HEIGHT / 2}
            opacity={0.18}
            listening={false}
          />
        </>
      )}
      <Rect
        width={STATION_LABEL_WIDTH}
        height={STATION_LABEL_HEIGHT}
        fill={marker.isActive ? "rgba(28, 21, 2, 0.96)" : "rgba(3, 14, 20, 0.94)"}
        stroke={colors.stroke}
        strokeWidth={1.2}
        cornerRadius={STATION_LABEL_HEIGHT / 2}
        shadowColor={colors.glow}
        shadowBlur={12}
        shadowOpacity={0.72}
      />
      {marker.isLocked ? (
        <Group x={STATION_LABEL_WIDTH / 2} y={STATION_LABEL_HEIGHT / 2} listening={false}>
          <Arc
            innerRadius={4}
            outerRadius={4}
            angle={180}
            rotation={180}
            y={-2}
            stroke="#E7EDF2"
            strokeWidth={1.8}
          />
          <Rect x={-5} y={-1} width={10} height={8} cornerRadius={2} fill="#E7EDF2" />
        </Group>
      ) : marker.isCompleted ? (
        <Group x={STATION_LABEL_WIDTH / 2} y={STATION_LABEL_HEIGHT / 2} listening={false}>
          <Path
            x={-7}
            y={-7}
            data="M2 1 H12 V5 C12 8 10 10 7 11 C4 10 2 8 2 5 Z M2 3 H0 V5 C0 7 2 8 4 8 M12 3 H14 V5 C14 7 12 8 10 8 M7 11 V14 M3 14 H11"
            stroke="#D5E0E9"
            strokeWidth={1.5}
            lineCap="round"
            lineJoin="round"
          />
        </Group>
      ) : (
        <Text
          text={`${points} ${pointsUnit}`}
          x={4}
          y={0}
          width={STATION_LABEL_WIDTH - 8}
          height={STATION_LABEL_HEIGHT}
          fontFamily="Aptos, Segoe UI, sans-serif"
          fontSize={10.5}
          fontStyle="bold"
          fill={marker.isActive ? "#FFE36E" : "#4DFF8A"}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}
    </Group>
  );
}

function LegendCard({pointsUnit}: {pointsUnit: string}) {
  const {t} = useTranslation();
  const items = [
    {status: "default", label: t("teamV2.legendNotPlayed")},
    {status: "active", label: t("teamV2.legendPlaying")},
    {status: "completed", label: t("teamV2.legendCompleted")},
  ] as const;

  return (
    <aside className="team-v2-legend" aria-label={t("teamV2.legendTitle")}>
      <strong className="team-v2-legend__title">{t("teamV2.legendTitle")}</strong>
      <div className="team-v2-legend__list">
        {items.map((item) => (
          <div key={item.status} className={`team-v2-legend__item is-${item.status}`}>
            <span className="team-v2-legend__pin" aria-hidden="true"><i /></span>
            <span className="team-v2-legend__label">{item.label}</span>
            <span className="team-v2-legend__pill">
              {item.status === "completed" ? <TrophyFilled /> : `10 ${pointsUnit}`}
            </span>
          </div>
        ))}
      </div>
    </aside>
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
    () => getTeamV2LeaderboardRows(rows, activeTeam?.id),
    [activeTeam?.id, rows],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [scoreStationId, setScoreStationId] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(
    () => Boolean(getActiveFullscreenElement()),
  );
  const [isStandaloneApp, setIsStandaloneApp] = useState(isStandaloneDisplayMode);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({width: 0, height: 0});
  const [mapTransform, setMapTransform] = useState<MapTransform>({x: 0, y: 0, scale: 1});
  const loadedMapWidthRef = useRef(0);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
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
  if (mapTransformSchedulerRef.current == null) {
    mapTransformSchedulerRef.current = createLatestFrameScheduler<MapTransform>({
      requestFrame: (callback) => requestAnimationFrame(callback),
      cancelFrame: (frameId) => cancelAnimationFrame(frameId),
      commit: setMapTransform,
    });
  }
  const playingCounts = useStationPlayingCounts(Boolean(session?.role === "user"));

  const completedCount = activeTeamStations.filter((station) => station.status === "Finished").length;
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
        opacity: appearance.opacity,
      };
    });
  }, [activeTeamStations, selectedStationId, stationDefinitions]);

  const markerScreenLayouts = useMemo(
    () => getStationLabelLayouts(markerViewModels, viewportSize, mapTransform),
    [mapTransform, markerViewModels, viewportSize],
  );
  const visibleMarkerLabelIds = useMemo(
    () => getNonOverlappingStationLabelIds(markerScreenLayouts, viewportSize),
    [markerScreenLayouts, viewportSize],
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
        return getDefaultMapTransform(viewportSize);
      }
      const previousBaseScale = getBaseMapScale(previousViewport);
      const nextBaseScale = getBaseMapScale(viewportSize);
      const zoomRatio = current.scale / previousBaseScale;
      const worldCenter = {
        x: (previousViewport.width / 2 - current.x) / current.scale,
        y: (previousViewport.height / 2 - current.y) / current.scale,
      };
      const scale = clampScale(nextBaseScale * zoomRatio, viewportSize);
      return {
        scale,
        x: viewportSize.width / 2 - worldCenter.x * scale,
        y: viewportSize.height / 2 - worldCenter.y * scale,
      };
    });
    previousViewportRef.current = viewportSize;
  }, [viewportSize]);

  useEffect(() => {
    const scheduler = mapTransformSchedulerRef.current;
    return () => scheduler?.cancel();
  }, []);

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
    // Pointer events can arrive faster than the display refresh rate. Keep only
    // the latest transform and commit at most once per animation frame.
    mapTransformSchedulerRef.current?.schedule(nextTransform);
  };

  const applyScaleAtPoint = (nextScale: number, point: {x: number; y: number}) => {
    const current = mapTransformSchedulerRef.current?.peek() ?? mapTransform;
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
        scale: mapTransform.scale,
      };
      panRef.current = null;
      return;
    }
    if (touches.length === 1) {
      panRef.current = {
        clientX: touches[0].clientX,
        clientY: touches[0].clientY,
        transform: mapTransform,
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
      pinchRef.current = {distance, scale: mapTransform.scale};
      return;
    }
    applyScaleAtPoint(pinchRef.current.scale * (distance / pinchRef.current.distance), center);
  };

  const resetMap = () => {
    mapTransformSchedulerRef.current?.cancel();
    setMapTransform(getDefaultMapTransform(viewportSize));
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
      if (result === "unsupported") {
        message.info(t("teamV2.fullscreenUnavailable"), 7);
      }
    } catch {
      message.warning(t("teamV2.fullscreenFailed"));
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
  const isPrimaryOverlayOpen =
    isSettingsOpen || isLeaderboardOpen || isScannerOpen || isStationDetailOpen || Boolean(scoreStation);
  const footerScale = clamp(
    Math.min(
      (viewportSize.width - 24) / 336,
      viewportSize.height > viewportSize.width ? viewportSize.height / 900 : 1.5,
    ),
    0.82,
    1.5,
  );
  const footerFontCompensation = 1;

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
              {markerViewModels.map((marker) => {
                const layout = markerScreenLayouts.get(marker.station.id);
                return layout?.isInViewport && visibleMarkerLabelIds.has(marker.station.id) ? (
                  <StationMarkerLabel
                    key={`label-${marker.station.id}`}
                    layout={layout}
                    hudAccent={V2_HUD_ACCENT}
                    pointsUnit={t("teamV2.pointsUnit")}
                    onSelect={() => {
                      setSelectedStationId(marker.station.id);
                      setIsStationDetailOpen(false);
                    }}
                  />
                ) : null;
              })}
            </Layer>
            <Layer
              x={-mapTransform.x / mapTransform.scale}
              y={-mapTransform.y / mapTransform.scale}
              scaleX={1 / mapTransform.scale}
              scaleY={1 / mapTransform.scale}>
              {markerViewModels.map((marker) => {
                const layout = markerScreenLayouts.get(marker.station.id);
                return layout?.isInViewport ? (
                  <StationMarker
                    key={`marker-${marker.station.id}`}
                    marker={marker}
                    hudAccent={V2_HUD_ACCENT}
                    size={layout.markerSize * (marker.isActive ? 1.18 : 1)}
                    x={layout.anchorX}
                    y={layout.anchorY}
                    onSelect={() => {
                      setSelectedStationId(marker.station.id);
                      setIsStationDetailOpen(false);
                    }}
                  />
                ) : null;
              })}
            </Layer>
          </Stage>
        )}
      </div>

      <LegendCard pointsUnit={t("teamV2.pointsUnit")} />

      <header className="team-v2-header">
        <div className="team-v2-center-score">
          <div className="team-v2-event-banner" aria-label="MOVEment 2026">
            <span className="team-v2-event-rail is-left" aria-hidden="true" />
            <span className="team-v2-event-brand">
              <span>MOVEment</span>
              <small>2026</small>
            </span>
            <span className="team-v2-event-rail is-right" aria-hidden="true" />
          </div>
          <div className="team-v2-score" aria-label={`${t("common.totalScore")}: ${activeTeam.score}`}>
            <strong>{activeTeam.score}</strong>
            <span>{t("teamV2.pointsUnit")}</span>
            <small>{t("common.totalScore")}</small>
          </div>
        </div>
        <div className="team-v2-header-actions">
          {!isStandaloneApp && (
            <button
              type="button"
              className="team-v2-fullscreen-button"
              aria-label={t(
                isBrowserFullscreen ? "teamV2.exitFullscreen" : "teamV2.enterFullscreen",
              )}
              aria-pressed={isBrowserFullscreen}
              title={t(
                isBrowserFullscreen ? "teamV2.exitFullscreen" : "teamV2.enterFullscreen",
              )}
              onClick={() => void handleToggleFullscreen()}>
              {isBrowserFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
          )}
          <button
            type="button"
            className="team-v2-settings-button"
            aria-label={t("teamV2.openSettings")}
            title={t("teamV2.openSettings")}
            onClick={() => {
              setIsLeaderboardOpen(false);
              setIsScannerOpen(false);
              setIsSettingsOpen(true);
            }}>
            <SettingOutlined />
          </button>
        </div>
      </header>

      {selectedStation && !isPrimaryOverlayOpen && (
        <section className="team-v2-station-preview" aria-label={t("teamV2.stationPreview")}>
          <div className="team-v2-station-preview__visual">
            {selectedStation.imageUrls?.[0] ? (
              <img src={selectedStation.imageUrls[0]} alt="" loading="lazy" decoding="async" />
            ) : (
              <strong>{getStationDisplayCode(selectedStation.stationId)}</strong>
            )}
          </div>
          <div className="team-v2-station-preview__content">
            <span>{getStationDisplayCode(selectedStation.stationId)}</span>
            <h2>{selectedStation.name}</h2>
            <strong>{getStationEffectiveMaxPoints(selectedStation)} {t("teamV2.pointsUnit")}</strong>
            {selectedStation.description && <p>{selectedStation.description}</p>}
            <button type="button" onClick={() => setIsStationDetailOpen(true)}>
              {t("teamV2.viewMission")}
            </button>
          </div>
          <button
            type="button"
            className="team-v2-station-preview__close"
            aria-label={t("teamV2.closeStationPreview")}
            onClick={() => setSelectedStationId(null)}>
            <CloseOutlined />
          </button>
        </section>
      )}

      {selectedStation && isStationDetailOpen && (
        <TeamV2StationDetailOverlay
          station={selectedStation}
          playingTeamCount={selectedPlayingCount}
          opacity={panelOpacity}
          language={language}
          onClose={() => setIsStationDetailOpen(false)}
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

      <footer
        className="team-v2-bottom"
        style={{
          "--team-v2-footer-scale": footerScale,
          "--team-v2-footer-font-compensation": footerFontCompensation,
        } as CSSProperties}>
        <span className="team-v2-footer-rail is-left" aria-hidden="true" />
        <button
          type="button"
          className="team-v2-footer-panel team-v2-leaderboard-chip"
          onClick={() => {
            setIsSettingsOpen(false);
            setIsScannerOpen(false);
            setIsLeaderboardOpen(true);
          }}>
          <span className="team-v2-bottom-icon"><TrophyFilled /></span>
          <span className="team-v2-bottom-copy">
            <strong>{t("teamV2.leaderboardControl")}</strong>
          </span>
        </button>
        <div className="team-v2-scan-action">
          <TeamV2QrBadge
            ariaLabel={t("teamV2.openScanner")}
            onClick={() => {
              setIsSettingsOpen(false);
              setIsLeaderboardOpen(false);
              setQrToken("");
              setIsScannerOpen(true);
            }}
          />
          <strong>{t("teamV2.scan")}</strong>
          <small className={activeStation ? "is-active-context" : undefined}>
            {activeStation ?
              `${getStationDisplayCode(activeStation.stationId)} · ${activeStation.name}`
            : t("teamV2.scanGameHint")}
          </small>
        </div>
        <section
          className="team-v2-footer-panel team-v2-progress-panel"
          aria-label={`${t("teamV2.teamLabel")} ${activeTeam.id}, ${t("teamV2.stationCount", {count: completedCount})}`}>
          <span className="team-v2-bottom-icon"><TeamOutlined /></span>
          <span className="team-v2-bottom-copy team-v2-my-team-copy">
            <strong>{t("teamV2.myTeam")}</strong>
          </span>
        </section>
        <span className="team-v2-footer-rail is-right" aria-hidden="true" />
      </footer>

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
