import {
  ArrowLeftOutlined,
  CameraOutlined,
  CloseOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  SettingOutlined,
  StarFilled,
  TeamOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {App as AntdApp, Button, Empty, Form, Input, InputNumber, Slider, Spin, Tag, Typography} from "antd";
import type {KonvaEventObject} from "konva/lib/Node";
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text} from "react-konva";
import {useNavigate} from "react-router-dom";
import {
  getLeaderboard,
  isAuthFailure,
  logout as logoutApi,
  submitPlayerQrAction,
  submitStationScore,
  type LeaderboardEntryResponse,
} from "../api";
import {LanguageSwitch} from "../components/LanguageSwitch";
import {QrTokenInput} from "../components/QrTokenInput";
import {useStationPlayingCounts} from "../hooks/useStationPlayingCounts";
import {
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
const V2_HUD_ACCENT = "#1677FF";
const MAP_WORLD_WIDTH = 2048;
const MAP_WORLD_HEIGHT = 1000;
const MIN_MAP_ZOOM = 0.8;
const MAX_MAP_ZOOM = 5;
const STATION_LABEL_WIDTH = 120;
const STATION_LABEL_HEIGHT = 44;
const ZALO_SUPPORT_URL = "https://zalo.me/0909384697";

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
      fill: "rgba(32, 3, 30, 0.96)",
      stroke: "#ff20df",
      text: "#ffffff",
      glow: "#ff20df",
    };
  }
  if (marker.isActive) {
    return {
      fill: "rgba(2, 27, 31, 0.96)",
      stroke: "#00f5ff",
      text: "#ffffff",
      glow: "#00f5ff",
    };
  }
  if (marker.isCompleted) {
    return {
      fill: "rgba(3, 34, 20, 0.96)",
      stroke: "#00f574",
      text: "#ffffff",
      glow: "#00f574",
    };
  }
  return {
    fill: "rgba(3, 13, 20, 0.96)",
    stroke: hudAccent,
    text: "#ffffff",
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
  const visibleMarkers = screenMarkers
    .filter(({anchorX, anchorY}) =>
      anchorX >= -24 &&
      anchorX <= viewport.width + 24 &&
      anchorY >= -24 &&
      anchorY <= viewport.height + 24,
    )
    .sort((first, second) => {
      const firstPriority = Number(first.marker.isSelected) * 2 + Number(first.marker.isActive);
      const secondPriority = Number(second.marker.isSelected) * 2 + Number(second.marker.isActive);
      return secondPriority - firstPriority || first.anchorY - second.anchorY || first.anchorX - second.anchorX;
    });
  const isPortrait = viewport.height > viewport.width;
  const safeTop = isPortrait ? 116 : 88;
  const safeBottom = isPortrait ? 124 : 84;
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
    x: anchorX - 25,
    y: anchorY - 25,
    width: 50,
    height: 50,
  }));
  const hudReservedBounds: Bounds[] = isPortrait ? [] : [
    {
      x: viewport.width / 2 - 145,
      y: viewport.height - 148,
      width: 290,
      height: 148,
    },
  ];
  const placed: Bounds[] = [];
  const layouts = new Map<string, MarkerScreenLayout>();
  const offsets = [
    {x: -STATION_LABEL_WIDTH / 2, y: -STATION_LABEL_HEIGHT - 34},
    {x: 34, y: -STATION_LABEL_HEIGHT / 2},
    {x: -STATION_LABEL_WIDTH / 2, y: 34},
    {x: -STATION_LABEL_WIDTH - 34, y: -STATION_LABEL_HEIGHT / 2},
    {x: 28, y: -STATION_LABEL_HEIGHT - 28},
    {x: 28, y: 28},
    {x: -STATION_LABEL_WIDTH - 28, y: 28},
    {x: -STATION_LABEL_WIDTH - 28, y: -STATION_LABEL_HEIGHT - 28},
  ];

  if (!isPortrait && visibleMarkers.length >= 12) {
    const columns = Math.max(
      1,
      Math.floor((safeArea.width + 8) / (STATION_LABEL_WIDTH + 8)),
    );
    const rows = Math.min(
      4,
      Math.max(
        1,
        Math.floor((safeArea.height + 4) / (STATION_LABEL_HEIGHT + 4)),
      ),
    );
    const horizontalGap =
      columns > 1 ?
        (safeArea.width - columns * STATION_LABEL_WIDTH) / (columns - 1)
      : 0;
    const verticalGap =
      rows > 1 ?
        (safeArea.height - rows * STATION_LABEL_HEIGHT) / (rows - 1)
      : 0;
    const availableSlots: Bounds[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const slot = {
          x: safeArea.x + column * (STATION_LABEL_WIDTH + horizontalGap),
          y: safeArea.y + row * (STATION_LABEL_HEIGHT + verticalGap),
          width: STATION_LABEL_WIDTH,
          height: STATION_LABEL_HEIGHT,
        };
        if (
          hudReservedBounds.every(
            (reserved) => getIntersectionArea(slot, reserved) === 0,
          )
        ) {
          availableSlots.push(slot);
        }
      }
    }
    if (availableSlots.length >= visibleMarkers.length) {
      for (const screenMarker of visibleMarkers) {
        let bestSlotIndex = 0;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (let index = 0; index < availableSlots.length; index += 1) {
          const slot = availableSlots[index];
          const distance = Math.hypot(
            slot.x + slot.width / 2 - screenMarker.anchorX,
            slot.y + slot.height / 2 - screenMarker.anchorY,
          );
          if (distance < bestDistance) {
            bestDistance = distance;
            bestSlotIndex = index;
          }
        }
        const [slot] = availableSlots.splice(bestSlotIndex, 1);
        placed.push(slot);
        layouts.set(screenMarker.marker.station.id, {
          ...screenMarker,
          labelX: slot.x,
          labelY: slot.y,
          isInViewport: true,
        });
      }
    }
  }

  const clampCandidate = (candidate: Bounds): Bounds => ({
    ...candidate,
    x: Math.min(
      safeArea.x + safeArea.width - candidate.width,
      Math.max(safeArea.x, candidate.x),
    ),
    y: Math.min(
      safeArea.y + safeArea.height - candidate.height,
      Math.max(safeArea.y, candidate.y),
    ),
  });

  for (const screenMarker of visibleMarkers) {
    if (layouts.has(screenMarker.marker.station.id)) {
      continue;
    }
    const directCandidates = offsets.map((offset) =>
      clampCandidate({
        x: screenMarker.anchorX + offset.x,
        y: screenMarker.anchorY + offset.y,
        width: STATION_LABEL_WIDTH,
        height: STATION_LABEL_HEIGHT,
      }),
    );
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
    const candidates = [...directCandidates, ...gridCandidates];
    let bestCandidate = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const centerX = candidate.x + candidate.width / 2;
      const centerY = candidate.y + candidate.height / 2;
      const distance = Math.hypot(
        centerX - screenMarker.anchorX,
        centerY - screenMarker.anchorY,
      );
      const labelOverlap = placed.reduce(
        (total, existing) => total + getIntersectionArea(candidate, existing),
        0,
      );
      const markerOverlap = markerBounds.reduce(
        (total, markerBoundsItem) =>
          total + getIntersectionArea(candidate, markerBoundsItem),
        0,
      );
      const hudOverlap = hudReservedBounds.reduce(
        (total, reserved) => total + getIntersectionArea(candidate, reserved),
        0,
      );
      const score =
        labelOverlap * 1_000 +
        hudOverlap * 2_000 +
        markerOverlap * 8 +
        distance;
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
      if (score === distance) {
        break;
      }
    }
    placed.push(bestCandidate);
    layouts.set(screenMarker.marker.station.id, {
      ...screenMarker,
      labelX: bestCandidate.x,
      labelY: bestCandidate.y,
      isInViewport: true,
    });
  }

  for (const screenMarker of screenMarkers) {
    if (!layouts.has(screenMarker.marker.station.id)) {
      layouts.set(screenMarker.marker.station.id, {
        ...screenMarker,
        labelX: screenMarker.anchorX + 34,
        labelY: screenMarker.anchorY - STATION_LABEL_HEIGHT / 2,
        isInViewport: false,
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
        fill="rgba(2, 7, 13, 0.96)"
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
        fill="#f7fbff"
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
        fill="#00ff72"
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

  return (
    <Line
      points={[anchorX, anchorY, connectorX, connectorY]}
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
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      if (
        cancelled ||
        isFetchingRef.current ||
        document.visibilityState !== "visible"
      ) {
        return;
      }
      isFetchingRef.current = true;
      setIsLoading(true);
      try {
        const entries = await getLeaderboard();
        if (!cancelled) {
          setRows(entries);
        }
      } catch (error) {
        if (!cancelled && isAuthFailure(error)) {
          logout();
        }
      } finally {
        isFetchingRef.current = false;
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [logout, open]);

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
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [scoreStationId, setScoreStationId] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({width: 0, height: 0});
  const [mapTransform, setMapTransform] = useState<MapTransform>({x: 0, y: 0, scale: 1});
  const loadedMapWidthRef = useRef(0);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const isRefreshingRef = useRef(false);
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
    activeTeamStations.find((station) => station.stationId === selectedStationId) ??
    activeTeamStations.find((station) => station.status === "In Progress") ??
    null;

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

  const refreshPlayerData = useCallback(async () => {
    if (isRefreshingRef.current || document.visibilityState !== "visible") {
      return;
    }
    isRefreshingRef.current = true;
    try {
      loadDatabase(await fetchPlayerDatabase(language));
    } catch (error) {
      if (isAuthFailure(error)) {
        clearSession();
        navigate("/login");
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [clearSession, language, loadDatabase, navigate]);

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

  useEffect(() => {
    void refreshPlayerData();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshPlayerData();
      }
    };
    const timer = window.setInterval(() => void refreshPlayerData(), 5000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshPlayerData]);

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

  const handleQrAction = async (rawToken: string) => {
    if (isSubmittingQrRef.current) {
      return;
    }
    const token = rawToken.trim();
    if (!token) {
      message.warning(t("teamV2.qrRequired"));
      return;
    }
    isSubmittingQrRef.current = true;
    setIsSubmittingQr(true);
    try {
      const result = await submitPlayerQrAction(token);
      await refreshPlayerData();
      setQrToken("");
      setIsScannerOpen(false);
      if (result.action === "CHECK_IN") {
        message.success(t("teamV2.checkInSuccess"));
        navigate(`/stations/${result.stationId}?from=team-v2`);
        return;
      }
      if (result.requiresScore) {
        scoreForm.setFieldsValue({score: 0, reason: ""});
        setScoreStationId(result.stationId);
        message.success(t("teamV2.checkOutScoreRequired"));
        return;
      }
      message.success(t("teamV2.checkOutSuccess"));
    } catch {
      message.error(t("teamV2.qrActionFailed"));
    } finally {
      isSubmittingQrRef.current = false;
      setIsSubmittingQr(false);
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
  const selectedMaxPoints = selectedStation ? getStationEffectiveMaxPoints(selectedStation) : 0;
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
                return layout?.isInViewport ? (
                  <TeamMarkerConnector
                    key={`connector-${marker.station.id}`}
                    layout={layout}
                    hudAccent={V2_HUD_ACCENT}
                  />
                ) : null;
              })}
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
          <span className="team-v2-event-brand">MOVEment 2026</span>
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
        <div
          className="team-v2-overlay-layer"
          style={{opacity: panelOpacity / 100}}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedStationId(null);
          }}>
          <section
            className="team-v2-overlay team-v2-preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-v2-preview-title">
            <div className="team-v2-preview-title">
              <span className="team-v2-station-code">{getStationDisplayCode(selectedStation.stationId)}</span>
              <div>
                <Typography.Title id="team-v2-preview-title" level={4}>{selectedStation.name}</Typography.Title>
                <Tag>{t(`status.${selectedStation.status}`)}</Tag>
              </div>
              <button type="button" className="team-v2-icon-button" onClick={() => setSelectedStationId(null)} aria-label={t("teamV2.closeOverlay")}>
                <CloseOutlined />
              </button>
            </div>
            <div className="team-v2-preview-stats">
              <span><StarFilled /> {selectedStation.score}/{selectedMaxPoints}</span>
              <span><TeamOutlined /> {selectedPlayingCount}</span>
            </div>
            <Button
              type="primary"
              block
              onClick={() => navigate(`/stations/${selectedStation.stationId}?from=team-v2`)}>
              {t("teamV2.openStationDetail")}
            </Button>
          </section>
        </div>
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
          <button
            type="button"
            className="team-v2-scan-button"
            onClick={() => {
              setIsSettingsOpen(false);
              setIsLeaderboardOpen(false);
              setIsScannerOpen(true);
            }}
            aria-label={t("teamV2.openScanner")}>
            <QrcodeOutlined />
          </button>
          <strong>{t("teamV2.scanGameQr")}</strong>
          <small>{t("teamV2.scanGameHint")}</small>
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
            <QrTokenInput
              value={qrToken}
              onChange={setQrToken}
              onScan={(value) => void handleQrAction(value)}
              placeholder={t("teamV2.qrPlaceholder")}
            />
            <Button
              type="primary"
              block
              loading={isSubmittingQr}
              icon={<CameraOutlined />}
              onClick={() => void handleQrAction(qrToken)}>
              {t("teamV2.submitQr")}
            </Button>
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
                      await submitStationScore(scoreStation.stationId, values.score, values.reason);
                      await refreshPlayerData();
                      message.success(t("stationDetail.completedSuccess"));
                      setScoreStationId(null);
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
