import {
  ArrowLeftOutlined,
  CloseOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  SettingOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {App as AntdApp, Button, Empty, Form, Input, InputNumber, Slider, Spin, Typography} from "antd";
import type {KonvaEventObject} from "konva/lib/Node";
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text} from "react-konva";
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

const PANEL_OPACITY_STORAGE_KEY = "movement-team-v2-panel-opacity";
const DEFAULT_PANEL_OPACITY = 85;
const V2_HUD_ACCENT = "#2FE4F0";
const MAP_WORLD_WIDTH = 2048;
const MAP_WORLD_HEIGHT = 1000;
const MIN_MAP_ZOOM = 0.8;
const MAX_MAP_ZOOM = 5;
const STATION_LABEL_WIDTH = 120;
const STATION_LABEL_HEIGHT = 44;
const MARKER_EXCLUSION_RADIUS = 32;
const MARKER_LABEL_GAP = 6;
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

type ViewportSize = {
  width: number;
  height: number;
};

type MarkerViewModel = {
  station: StationDefinition;
  teamStation: TeamStation | null;
  x: number;
  y: number;
  code: string;
  isActive: boolean;
  isCompleted: boolean;
  isSelected: boolean;
};

type MapTransform = {
  x: number;
  y: number;
  scale: number;
};

type MarkerScreenLayout = {
  marker: MarkerViewModel;
  anchorX: number;
  anchorY: number;
  labelX: number;
  labelY: number;
  isInViewport: boolean;
  hasConnector: boolean;
};

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ScoreFormValues = {
  score: number;
  reason?: string;
};

function readStoredPanelOpacity() {
  if (typeof window === "undefined") {
    return DEFAULT_PANEL_OPACITY;
  }
  const value = Number(window.localStorage.getItem(PANEL_OPACITY_STORAGE_KEY));
  return Number.isFinite(value) && value >= 50 && value <= 100 ?
      Math.round(value / 5) * 5
    : DEFAULT_PANEL_OPACITY;
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
  if (marker.isSelected) {
    return {
      fill: "rgba(32, 5, 29, 0.94)",
      stroke: "#FF3FD8",
      text: "#EAFCFF",
      glow: "#FF3FD8",
    };
  }
  if (marker.isActive) {
    return {
      fill: "rgba(3, 26, 32, 0.94)",
      stroke: "#2FE4F0",
      text: "#EAFCFF",
      glow: "#2FE4F0",
    };
  }
  if (marker.isCompleted) {
    return {
      fill: "rgba(3, 32, 21, 0.94)",
      stroke: "#4DFF8A",
      text: "#EAFCFF",
      glow: "#4DFF8A",
    };
  }
  return {
    fill: "rgba(3, 14, 20, 0.94)",
    stroke: hudAccent,
    text: "#EAFCFF",
    glow: hudAccent,
  };
}

function getIntersectionArea(first: Bounds, second: Bounds) {
  const width = Math.max(
    0,
    Math.min(first.x + first.width, second.x + second.width) -
      Math.max(first.x, second.x),
  );
  const height = Math.max(
    0,
    Math.min(first.y + first.height, second.y + second.height) -
      Math.max(first.y, second.y),
  );
  return width * height;
}

function getStationLabelLayouts(
  markers: MarkerViewModel[],
  viewport: ViewportSize,
  transform: MapTransform,
) {
  const screenMarkers = markers.map((marker) => ({
    marker,
    anchorX: transform.x + marker.x * transform.scale,
    anchorY: transform.y + marker.y * transform.scale,
  }));
  const visibleMarkers = screenMarkers.filter(({anchorX, anchorY}) =>
      anchorX >= -24 &&
      anchorX <= viewport.width + 24 &&
      anchorY >= -24 &&
      anchorY <= viewport.height + 24,
    );
  const isPortrait = viewport.height > viewport.width;
  const safeTop = isPortrait ? 126 : 116;
  const safeBottom = isPortrait ? 104 : 96;
  const safeArea = {
    x: 8,
    y: Math.min(safeTop, Math.max(8, viewport.height / 3)),
    width: Math.max(STATION_LABEL_WIDTH, viewport.width - 16),
    height: Math.max(
      STATION_LABEL_HEIGHT,
      viewport.height - safeTop - safeBottom,
    ),
  };
  const markerBounds = visibleMarkers.map(({anchorX, anchorY}) => ({
    x: anchorX - MARKER_EXCLUSION_RADIUS - MARKER_LABEL_GAP,
    y: anchorY - MARKER_EXCLUSION_RADIUS - MARKER_LABEL_GAP,
    width: (MARKER_EXCLUSION_RADIUS + MARKER_LABEL_GAP) * 2,
    height: (MARKER_EXCLUSION_RADIUS + MARKER_LABEL_GAP) * 2,
  }));
  const hudReservedBounds: Bounds[] = isPortrait ? [] : [
    {
      x: viewport.width / 2 - 145,
      y: viewport.height - 148,
      width: 290,
      height: 148,
    },
  ];
  const layouts = new Map<string, MarkerScreenLayout>();
  const isCandidateValid = (candidate: Bounds) =>
    candidate.x >= safeArea.x &&
    candidate.y >= safeArea.y &&
    candidate.x + candidate.width <= safeArea.x + safeArea.width &&
    candidate.y + candidate.height <= safeArea.y + safeArea.height &&
    markerBounds.every((markerBound) => getIntersectionArea(candidate, markerBound) === 0) &&
    hudReservedBounds.every((reserved) => getIntersectionArea(candidate, reserved) === 0);

  for (const screenMarker of visibleMarkers) {
    const distanceFromMarker = MARKER_EXCLUSION_RADIUS + MARKER_LABEL_GAP;
    const directCandidates: Bounds[] = [
      {
        x: screenMarker.anchorX - STATION_LABEL_WIDTH / 2,
        y: screenMarker.anchorY - distanceFromMarker - STATION_LABEL_HEIGHT,
        width: STATION_LABEL_WIDTH,
        height: STATION_LABEL_HEIGHT,
      },
      {
        x: screenMarker.anchorX - STATION_LABEL_WIDTH / 2,
        y: screenMarker.anchorY + distanceFromMarker,
        width: STATION_LABEL_WIDTH,
        height: STATION_LABEL_HEIGHT,
      },
      {
        x: screenMarker.anchorX + distanceFromMarker,
        y: screenMarker.anchorY - STATION_LABEL_HEIGHT / 2,
        width: STATION_LABEL_WIDTH,
        height: STATION_LABEL_HEIGHT,
      },
      {
        x: screenMarker.anchorX - distanceFromMarker - STATION_LABEL_WIDTH,
        y: screenMarker.anchorY - STATION_LABEL_HEIGHT / 2,
        width: STATION_LABEL_WIDTH,
        height: STATION_LABEL_HEIGHT,
      },
    ];
    const gridCandidates: Bounds[] = [];
    for (
      let y = safeArea.y;
      y <= safeArea.y + safeArea.height - STATION_LABEL_HEIGHT;
      y += 12
    ) {
      for (
        let x = safeArea.x;
        x <= safeArea.x + safeArea.width - STATION_LABEL_WIDTH;
        x += 16
      ) {
        gridCandidates.push({
          x,
          y,
          width: STATION_LABEL_WIDTH,
          height: STATION_LABEL_HEIGHT,
        });
      }
    }
    gridCandidates.sort((first, second) => {
      const firstDistance = Math.hypot(
        first.x + first.width / 2 - screenMarker.anchorX,
        first.y + first.height / 2 - screenMarker.anchorY,
      );
      const secondDistance = Math.hypot(
        second.x + second.width / 2 - screenMarker.anchorX,
        second.y + second.height / 2 - screenMarker.anchorY,
      );
      return firstDistance - secondDistance;
    });
    const candidates = [...directCandidates, ...gridCandidates];
    const candidateIndex = candidates.findIndex(isCandidateValid);
    const bestCandidate = candidateIndex >= 0 ? candidates[candidateIndex] : directCandidates[0];
    layouts.set(screenMarker.marker.station.id, {
      ...screenMarker,
      labelX: bestCandidate.x,
      labelY: bestCandidate.y,
      isInViewport: true,
      hasConnector: candidateIndex !== 0,
    });
  }

  for (const screenMarker of screenMarkers) {
    if (!layouts.has(screenMarker.marker.station.id)) {
      layouts.set(screenMarker.marker.station.id, {
        ...screenMarker,
        labelX: screenMarker.anchorX + 34,
        labelY: screenMarker.anchorY - STATION_LABEL_HEIGHT / 2,
        isInViewport: false,
        hasConnector: false,
      });
    }
  }

  return layouts;
}

function TeamMarker({
  marker,
  hudAccent,
  x,
  y,
  onSelect,
}: {
  marker: MarkerViewModel;
  hudAccent: string;
  x: number;
  y: number;
  onSelect: () => void;
}) {
  const colors = getMarkerColors(marker, hudAccent);

  return (
    <Group
      x={x}
      y={y}
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
      <Circle radius={24} fill="rgba(255,255,255,0.01)" />
      {(marker.isActive || marker.isSelected) && (
        <Circle
          radius={32}
          stroke={colors.stroke}
          strokeWidth={1.5}
          dash={[5, 5]}
          opacity={0.65}
          listening={false}
        />
      )}
      <Circle
        radius={17}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        shadowColor={colors.glow}
        shadowBlur={18}
        shadowOpacity={0.9}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      />
      <Text
        text={marker.code}
        fontSize={11}
        fontStyle="700"
        fill={colors.text}
        width={34}
        height={34}
        offsetX={17}
        offsetY={17}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
}

function TeamMarkerLabel({
  layout,
  hudAccent,
  pointsUnit,
  onSelect,
}: {
  layout: MarkerScreenLayout;
  hudAccent: string;
  pointsUnit: string;
  onSelect: () => void;
}) {
  const {marker, labelX, labelY} = layout;
  const colors = getMarkerColors(marker, hudAccent);
  const label = marker.teamStation?.name ?? marker.station.name;
  const points = getStationEffectiveMaxPoints({
    trackingMode: marker.teamStation?.trackingMode ?? marker.station.trackingMode ?? "BOTH",
    maxPoints: marker.teamStation?.maxPoints ?? marker.station.maxPoints,
  });

  return (
    <Group
      x={labelX}
      y={labelY}
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
      <Rect
        width={STATION_LABEL_WIDTH}
        height={STATION_LABEL_HEIGHT}
        fill="rgba(3, 14, 20, 0.92)"
        stroke={colors.stroke}
        strokeWidth={1.2}
        cornerRadius={4}
        shadowColor={colors.glow}
        shadowBlur={12}
        shadowOpacity={0.72}
      />
      <Text
        text={`${marker.code} · ${label.toLocaleUpperCase()}`}
        x={6}
        y={4}
        width={STATION_LABEL_WIDTH - 12}
        height={24}
        fontFamily="Aptos, Segoe UI, sans-serif"
        fontSize={8.5}
        fontStyle="bold"
        fill="#EAFCFF"
        align="center"
        verticalAlign="middle"
        wrap="word"
        listening={false}
      />
      <Text
        text={`${points} ${pointsUnit}`}
        x={6}
        y={29}
        width={STATION_LABEL_WIDTH - 12}
        fontFamily="Aptos, Segoe UI, sans-serif"
        fontSize={9.5}
        fontStyle="bold"
        fill="#4DFF8A"
        align="center"
        listening={false}
      />
    </Group>
  );
}

function TeamMarkerConnector({
  layout,
  hudAccent,
}: {
  layout: MarkerScreenLayout;
  hudAccent: string;
}) {
  const {marker, anchorX, anchorY, labelX, labelY} = layout;
  const colors = getMarkerColors(marker, hudAccent);
  const connectorX = Math.max(labelX, Math.min(labelX + STATION_LABEL_WIDTH, anchorX));
  const connectorY = Math.max(labelY, Math.min(labelY + STATION_LABEL_HEIGHT, anchorY));
  const deltaX = connectorX - anchorX;
  const deltaY = connectorY - anchorY;
  const distance = Math.hypot(deltaX, deltaY) || 1;
  const startX = anchorX + (deltaX / distance) * MARKER_EXCLUSION_RADIUS;
  const startY = anchorY + (deltaY / distance) * MARKER_EXCLUSION_RADIUS;

  return (
    <Line
      points={[startX, startY, connectorX, connectorY]}
      stroke={colors.stroke}
      strokeWidth={1.2}
      opacity={0.72}
      shadowColor={colors.glow}
      shadowBlur={8}
      listening={false}
    />
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
      style={{opacity: opacity / 100}}
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
            {rows.map((row) => {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [scoreStationId, setScoreStationId] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
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
  const playingCounts = useStationPlayingCounts(Boolean(session?.role === "user"));

  const completedCount = activeTeamStations.filter((station) => station.status === "Finished").length;
  const scoreStation = activeTeamStations.find((station) => station.stationId === scoreStationId) ?? null;
  const selectedStation =
    activeTeamStations.find((station) => station.stationId === selectedStationId) ?? null;
  const activeStation =
    activeTeamStations.find((station) => station.status === "In Progress") ?? null;

  const markerViewModels = useMemo<MarkerViewModel[]>(() => {
    const byStationId = new Map(activeTeamStations.map((station) => [station.stationId, station]));
    return stationDefinitions.map((station, index) => {
      const position = getStationPosition(station, index, stationDefinitions.length);
      const teamStation = byStationId.get(station.id) ?? null;
      return {
        station,
        teamStation,
        x: (position.x / 100) * MAP_WORLD_WIDTH,
        y: (position.y / 100) * MAP_WORLD_HEIGHT,
        code: getStationDisplayCode(station.id),
        isActive: teamStation?.status === "In Progress",
        isCompleted: teamStation?.status === "Finished",
        isSelected: selectedStationId === station.id,
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

  const applyScaleAtPoint = (nextScale: number, point: {x: number; y: number}) => {
    setMapTransform((current) => {
      const clampedScale = clampScale(nextScale, viewportSize);
      const worldPoint = {
        x: (point.x - current.x) / current.scale,
        y: (point.y - current.y) / current.scale,
      };
      return {
        scale: clampedScale,
        x: point.x - worldPoint.x * clampedScale,
        y: point.y - worldPoint.y * clampedScale,
      };
    });
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) {
      return;
    }
    const nextScale = event.evt.deltaY > 0 ? mapTransform.scale / 1.08 : mapTransform.scale * 1.08;
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
    setMapTransform({
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
      setMapTransform({
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

  if (!activeTeam) {
    return (
      <main className="team-v2-page">
        <div className="team-v2-empty"><Spin /></div>
      </main>
    );
  }

  const selectedPlayingCount = selectedStation ? (playingCounts[selectedStation.stationId] ?? 0) : 0;
  const isPrimaryOverlayOpen =
    isSettingsOpen || isLeaderboardOpen || isScannerOpen || Boolean(scoreStation);

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
                return layout?.isInViewport && layout.hasConnector ? (
                  <TeamMarkerConnector
                    key={`connector-${marker.station.id}`}
                    layout={layout}
                    hudAccent={V2_HUD_ACCENT}
                  />
                ) : null;
              })}
              {markerViewModels.map((marker) => {
                const layout = markerScreenLayouts.get(marker.station.id);
                return layout?.isInViewport ? (
                  <TeamMarkerLabel
                    key={`label-${marker.station.id}`}
                    layout={layout}
                    hudAccent={V2_HUD_ACCENT}
                    pointsUnit={t("teamV2.pointsUnit")}
                    onSelect={() => setSelectedStationId(marker.station.id)}
                  />
                ) : null;
              })}
            </Layer>
            <Layer
              x={-mapTransform.x / mapTransform.scale}
              y={-mapTransform.y / mapTransform.scale}
              scaleX={1 / mapTransform.scale}
              scaleY={1 / mapTransform.scale}>
              {markerViewModels.map((marker) => (
                <TeamMarker
                  key={`marker-${marker.station.id}`}
                  marker={marker}
                  hudAccent={V2_HUD_ACCENT}
                  x={markerScreenLayouts.get(marker.station.id)?.anchorX ?? 0}
                  y={markerScreenLayouts.get(marker.station.id)?.anchorY ?? 0}
                  onSelect={() => setSelectedStationId(marker.station.id)}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>

      <header className="team-v2-header">
        <div className="team-v2-team">
          <Typography.Title level={2}>
            {getLocalizedTeamName(activeTeam.name, language)}
          </Typography.Title>
          <div className="team-v2-team-meta">
            <span>#{activeTeam.id}</span>
            {activeTeam.captainName && (
              <span>{t("teamV2.captain")}: {activeTeam.captainName}</span>
            )}
          </div>
        </div>
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
          </div>
        </div>
        <button
          type="button"
          className="team-v2-settings-button"
          aria-label={t("teamV2.openSettings")}
          onClick={() => {
            setIsLeaderboardOpen(false);
            setIsScannerOpen(false);
            setIsSettingsOpen(true);
          }}>
          <SettingOutlined />
        </button>
      </header>

      {selectedStation && !isPrimaryOverlayOpen && (
        <TeamV2StationDetailOverlay
          station={selectedStation}
          playingTeamCount={selectedPlayingCount}
          opacity={panelOpacity}
          language={language}
          onClose={() => setSelectedStationId(null)}
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
            } catch {
              message.error(t("errors.generic"));
            }
          }}
        />
      )}

      <footer className="team-v2-bottom">
        <button type="button" className="team-v2-bottom-chip team-v2-progress-chip">
          <span className="team-v2-bottom-icon"><CompassOutlined /></span>
          <span className="team-v2-bottom-copy">
            <small>{t("teamV2.progress")}</small>
            <strong>{completedCount}/17</strong>
            <em>{t("teamV2.stationsCompleted")}</em>
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
          <strong>{activeStation ? t("status.In Progress") : t("teamV2.scanGameQr")}</strong>
          <small className={activeStation ? "is-active-context" : undefined}>
            {activeStation ?
              `${getStationDisplayCode(activeStation.stationId)} · ${activeStation.name}`
            : t("teamV2.scanGameHint")}
          </small>
        </div>
        <button
          type="button"
          className="team-v2-bottom-chip team-v2-leaderboard-chip"
          onClick={() => {
            setIsSettingsOpen(false);
            setIsScannerOpen(false);
            setIsLeaderboardOpen(true);
          }}>
          <span className="team-v2-bottom-icon"><TrophyFilled /></span>
          <span className="team-v2-bottom-copy">
            <strong>{t("nav.rank")}</strong>
          </span>
        </button>
      </footer>

      {isSettingsOpen && (
        <div
          className="team-v2-overlay-layer"
          style={{opacity: panelOpacity / 100}}
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
          style={{opacity: panelOpacity / 100}}
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
          style={{opacity: panelOpacity / 100}}
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
                  title: t("stationDetail.confirmCompletion"),
                  content: t("stationDetail.confirmCompletionContent"),
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
