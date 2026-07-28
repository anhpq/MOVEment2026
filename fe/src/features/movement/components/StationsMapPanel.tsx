import {
  FlagOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StarFilled,
  TeamOutlined,
  YoutubeOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Modal,
  Select,
  Tag,
  Typography,
} from "antd";
import Konva from "konva";
import type {KonvaEventObject} from "konva/lib/Node";
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  Arc,
  Circle,
  Image as KonvaImage,
  Layer,
  Path,
  Rect,
  Stage,
  Group,
  Text,
} from "react-konva";
import {useNavigate} from "react-router-dom";
import {fetchAdminDatabase} from "../adminData";
import {checkInStation, updateAdminStation} from "../api";
import {
  fetchPlayerDatabase,
  loadPlayerMapImage,
  selectPlayerMapImageVariant,
} from "../playerData";
import {useStationPlayingCounts} from "../hooks/useStationPlayingCounts";
import {useMovementStore} from "../store";
import type {StationDefinition, TeamStation} from "../types";
import {
  formatCooldownRemaining,
  formatDateTime,
  getDisabledReason,
  getStationCooldownRemainingSeconds,
  getStationDisplayCode,
  getStationEffectiveMaxPoints,
  getStationStatusColor,
  compareStationIds,
} from "../utils";
import {QrTokenInput} from "./QrTokenInput";
import {StationImageGallery} from "./StationImageGallery";
import "./StationsMapPanel.css";

type StationsMapPanelProps = Readonly<{
  editable?: boolean;
}>;

type MarkerPosition = {
  x: number;
  y: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

type TeamStationWithMeta = TeamStation & {
  description?: string | null;
};

type MarkerUiState = "active" | "completed" | "available" | "locked";

const MIN_MAP_SCALE = 0.55;
const MAX_MAP_SCALE = 4;
const USER_STATUS_LEGEND: Array<{label: TeamStation["status"]}> = [
  {label: "New"},
  {label: "In Progress"},
  {label: "Finished"},
];

// Visual theme per marker state, mirrors the palette that used to live in CSS
// custom properties (--locked-*, --available-*, --current-*, --completed-*).
const MARKER_THEME: Record<
  MarkerUiState,
  {from: string; to: string; ring: string; glow: string; text: string; radius: number}
> = {
  locked: {
    from: "#f2b155",
    to: "#c67c1f",
    ring: "#ffe0a3",
    glow: "rgba(198,124,31,0.35)",
    text: "#3a2a12",
    radius: 20,
  },
  available: {
    from: "#22c3d6",
    to: "#0e7c8a",
    ring: "#a3ecf5",
    glow: "rgba(34,195,214,0.45)",
    text: "#f0fbff",
    radius: 20,
  },
  active: {
    from: "#f04fa0",
    to: "#c21f78",
    ring: "#ffb3dd",
    glow: "rgba(240,79,160,0.55)",
    text: "#3a0a24",
    radius: 24,
  },
  completed: {
    from: "#3ddc7a",
    to: "#1e8449",
    ring: "#a8f5c4",
    glow: "rgba(61,220,122,0.4)",
    text: "#04321f",
    radius: 20,
  },
};

function clampMapScale(value: number) {
  return Math.max(MIN_MAP_SCALE, Math.min(MAX_MAP_SCALE, value));
}

function getMarkerFill(status?: TeamStation["status"]) {
  return getStationStatusColor(status ?? "New");
}

function getMarkerUiState(teamStation?: TeamStationWithMeta): MarkerUiState {
  switch (teamStation?.backendStatus) {
    case "CHECKED_IN":
    case "PLAYING":
      return "active";
    case "COMPLETED":
      return "completed";
    case "LOCKED":
      return "locked";
    case "AVAILABLE":
      return "available";
    default:
      break;
  }

  switch (teamStation?.status) {
    case "In Progress":
      return "active";
    case "Finished":
      return "completed";
    case "New":
    default:
      return "available";
  }
}

function clampPercent(value: number) {
  return Math.max(2, Math.min(98, value));
}

function isValidMapCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function buildMarkerPosition(
  station: StationDefinition,
  fallback: MarkerPosition,
) {
  if (
    typeof station.markerX === "number" &&
    typeof station.markerY === "number"
  ) {
    return {x: station.markerX, y: station.markerY};
  }

  return fallback;
}

function buildFallbackPositions(stations: StationDefinition[]) {
  const latitudeValues = stations
    .map((station) => station.latitude)
    .filter((value): value is number => typeof value === "number");
  const longitudeValues = stations
    .map((station) => station.longitude)
    .filter((value): value is number => typeof value === "number");

  const minLat = Math.min(...latitudeValues);
  const maxLat = Math.max(...latitudeValues);
  const minLon = Math.min(...longitudeValues);
  const maxLon = Math.max(...longitudeValues);
  const hasBounds =
    latitudeValues.length >= 2 &&
    longitudeValues.length >= 2 &&
    Number.isFinite(minLat) &&
    Number.isFinite(maxLat) &&
    Number.isFinite(minLon) &&
    Number.isFinite(maxLon) &&
    maxLat > minLat &&
    maxLon > minLon;

  return stations.reduce<Record<string, MarkerPosition>>(
    (acc, station, index) => {
      if (
        hasBounds &&
        typeof station.latitude === "number" &&
        typeof station.longitude === "number"
      ) {
        const normalizedX =
          ((station.longitude - minLon) / (maxLon - minLon)) * 72 + 14;
        const normalizedY =
          (1 - (station.latitude - minLat) / (maxLat - minLat)) * 68 + 16;
        acc[station.id] = {
          x: clampPercent(normalizedX),
          y: clampPercent(normalizedY),
        };
        return acc;
      }

      const total = Math.max(1, stations.length);
      const row = Math.floor(index / 4);
      const col = index % 4;
      const gridX = 18 + col * (64 / Math.min(4, total));
      const gridY = 20 + row * 16;
      acc[station.id] = {x: clampPercent(gridX), y: clampPercent(gridY)};
      return acc;
    },
    {},
  );
}

type StationMarkerProps = {
  x: number;
  y: number;
  code: string;
  uiState: MarkerUiState;
  animate: boolean;
  onSelect: () => void;
};

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof globalThis.matchMedia === "function" ?
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false,
  );

  useEffect(() => {
    if (typeof globalThis.matchMedia !== "function") {
      return;
    }

    const mediaQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Native Konva marker. Drawn directly on the canvas (instead of an HTML
 * <button> overlay) so it correctly pans/zooms with the Stage transform and
 * can use canvas-only effects (shadow glow, radial gradient, animated rings).
 */
function StationMarker({
  x,
  y,
  code,
  uiState,
  animate,
  onSelect,
}: StationMarkerProps) {
  const groupRef = useRef<Konva.Group | null>(null);
  const pulseRef = useRef<Konva.Circle | null>(null);
  const spinRef = useRef<Konva.Circle | null>(null);
  const theme = MARKER_THEME[uiState];
  const radius = theme.radius;

  useEffect(() => {
    const shouldPulse = animate && uiState === "active";
    const shouldSpin = uiState === "active";

    if (!animate || (!shouldPulse && !shouldSpin)) {
      return;
    }

    const layer = groupRef.current?.getLayer() ?? undefined;
    const animation = new Konva.Animation((frame) => {
      if (!frame) {
        return;
      }

      if (shouldPulse && pulseRef.current) {
        const cycle = (frame.time % 2000) / 2000;
        pulseRef.current.radius(radius + cycle * radius * 0.9);
        pulseRef.current.opacity(0.55 * (1 - cycle));
      }

      if (shouldSpin && spinRef.current) {
        spinRef.current.rotation((frame.time / 40) % 360);
      }
    }, layer);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animate, radius, uiState]);

  return (
    <Group
      ref={groupRef}
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
      onMouseEnter={(event) => {
        const stage = event.target.getStage();
        if (stage) {
          stage.container().style.cursor = "pointer";
        }
      }}
      onMouseLeave={(event) => {
        const stage = event.target.getStage();
        if (stage) {
          stage.container().style.cursor = "";
        }
      }}>
      {(uiState === "available" || uiState === "active") && (
        <Circle
          ref={pulseRef}
          radius={radius}
          stroke={theme.ring}
          strokeWidth={2}
          opacity={0.5}
          listening={false}
        />
      )}

      {uiState === "active" && (
        <Circle
          ref={spinRef}
          radius={radius + 8}
          stroke={theme.ring}
          strokeWidth={1.5}
          dash={[6, 5]}
          opacity={0.6}
          listening={false}
        />
      )}

      <Circle
        radius={radius}
        fillRadialGradientStartPoint={{x: -radius * 0.35, y: -radius * 0.4}}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{x: 0, y: 0}}
        fillRadialGradientEndRadius={radius * 1.3}
        fillRadialGradientColorStops={[0, theme.from, 1, theme.to]}
        stroke={theme.ring}
        strokeWidth={2}
        shadowColor={theme.glow}
        shadowBlur={16}
        shadowOpacity={0.9}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      />

      {uiState !== "completed" && uiState !== "locked" && (
        <Text
          text={code}
          fontSize={11}
          fontStyle="700"
          fill={theme.text}
          width={radius * 2}
          height={radius * 2}
          offsetX={radius}
          offsetY={radius}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}

      {uiState === "completed" && (
        <Path
          data="M -6 0 L -1.5 5 L 7 -6"
          stroke={theme.text}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}

      {uiState === "locked" && (
        <>
          <Text
            text={code}
            fontSize={11}
            fontStyle="700"
            fill={theme.text}
            opacity={0.75}
            width={radius * 2}
            height={radius * 2}
            offsetX={radius}
            offsetY={radius}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
          <Group x={radius * 0.62} y={radius * 0.62} listening={false}>
            <Circle radius={9} fill="#1e293b" stroke="#0b1220" strokeWidth={1.5} />
            <Arc
              innerRadius={3}
              outerRadius={3}
              angle={180}
              rotation={180}
              y={-1.5}
              stroke="#94a3b8"
              strokeWidth={1.4}
            />
            <Rect x={-3.5} y={-1} width={7} height={5} cornerRadius={1} fill="#94a3b8" />
          </Group>
        </>
      )}
    </Group>
  );
}

export function StationsMapPanel({editable = false}: StationsMapPanelProps) {
  const navigate = useNavigate();
  const {modal, message} = AntdApp.useApp();
  const {i18n, t} = useTranslation();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const stationDefinitions = useMovementStore(
    (state) => state.stationDefinitions,
  );
  const teamStations = useMovementStore((state) => state.teamStations);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);

  const [selectedStationId, setSelectedStationId] = useState<
    string | undefined
  >(stationDefinitions[0]?.id);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [mapScale, setMapScale] = useState(1);
  const [mapPosition, setMapPosition] = useState({x: 0, y: 0});
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [scanTarget, setScanTarget] = useState<TeamStationWithMeta | null>(
    null,
  );
  const [qrToken, setQrToken] = useState("");
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const isSubmittingQrRef = useRef(false);
  const loadedMapWidthRef = useRef(0);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const language = i18n.language === "en" ? "en" : "vi";

  const mapWorldSize = useMemo(
    () => ({
      width: viewportSize.height * 2.5,
      height: viewportSize.height,
    }),
    [viewportSize.height],
  );

  const activeTeamStations = useMemo(
    () => (teamStations[activeTeamId] ?? []) as TeamStationWithMeta[],
    [activeTeamId, teamStations],
  );

  const activeStation = useMemo(
    () =>
      activeTeamStations.find((station) => station.status === "In Progress"),
    [activeTeamStations],
  );

  const activeTeamStationById = useMemo(
    () =>
      activeTeamStations.reduce<Record<string, TeamStationWithMeta>>(
        (acc, station) => {
          acc[station.stationId] = station;
          return acc;
        },
        {},
      ),
    [activeTeamStations],
  );

  const fallbackPositions = useMemo(
    () => buildFallbackPositions(stationDefinitions),
    [stationDefinitions],
  );

  const markerViewModels = useMemo(
    () =>
      stationDefinitions.map((station) => {
        const position = buildMarkerPosition(
          station,
          fallbackPositions[station.id],
        );
        const teamStation = activeTeamStationById[station.id];
        const markerX = (position.x / 100) * mapWorldSize.width;
        const markerY = (position.y / 100) * mapWorldSize.height;
        const uiState = getMarkerUiState(teamStation);

        return {
          station,
          markerX,
          markerY,
          teamStation,
          uiState,
        };
      }),
    [
      activeTeamStationById,
      fallbackPositions,
      mapWorldSize.height,
      mapWorldSize.width,
      stationDefinitions,
    ],
  );

  const focusedStation = useMemo(
    () =>
      stationDefinitions.find((station) => station.id === focusedStationId) ??
      null,
    [focusedStationId, stationDefinitions],
  );

  const focusedTeamStation = useMemo(() => {
    if (!focusedStation) {
      return null;
    }

    return activeTeamStationById[focusedStation.id] ?? null;
  }, [activeTeamStationById, focusedStation]);

  const focusedStationDisplayCode =
    focusedTeamStation ?
      getStationDisplayCode(focusedTeamStation.stationId)
    : "";

  const playingCounts = useStationPlayingCounts(
    session?.role === "user" && Boolean(focusedStationId),
  );
  const focusedPlayingTeamCount = focusedTeamStation ?
    (playingCounts[focusedTeamStation.stationId] ?? 0)
  : 0;

  const resolvedSelectedStationId = useMemo(() => {
    if (!selectedStationId) {
      return stationDefinitions[0]?.id;
    }

    if (
      stationDefinitions.some((station) => station.id === selectedStationId)
    ) {
      return selectedStationId;
    }

    return stationDefinitions[0]?.id;
  }, [selectedStationId, stationDefinitions]);

  const selectedStation = useMemo(
    () =>
      stationDefinitions.find(
        (station) => station.id === resolvedSelectedStationId,
      ) ?? null,
    [resolvedSelectedStationId, stationDefinitions],
  );
  const focusedCooldownRemaining = focusedTeamStation ?
    getStationCooldownRemainingSeconds(focusedTeamStation, nowMs)
  : 0;
  const isFocusedCooldownActive =
    session?.role === "user" &&
    focusedTeamStation?.status !== "In Progress" &&
    focusedCooldownRemaining > 0;

  useEffect(() => {
    if (!viewportSize.width) {
      return;
    }

    let cancelled = false;
    const variant = selectPlayerMapImageVariant(
      viewportSize.width,
      globalThis.devicePixelRatio || 1,
      mapScale >= 2.5,
    );

    if (variant.width <= loadedMapWidthRef.current) {
      return;
    }

    void loadPlayerMapImage(variant.src)
      .then((image) => {
        if (!cancelled && variant.width >= loadedMapWidthRef.current) {
          loadedMapWidthRef.current = variant.width;
          setMapImage(image);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [mapScale, viewportSize.width]);

  useEffect(() => {
    if (!focusedStationId) {
      return;
    }

    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [focusedStationId]);

  useLayoutEffect(() => {
    const element = mapViewportRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;

      setViewportSize((current) =>
        current.width === width && current.height === height ?
          current
        : {width, height},
      );
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const applyScaleAtPoint = (
    nextScale: number,
    focalPoint: {x: number; y: number},
  ) => {
    const clampedScale = clampMapScale(nextScale);
    const worldPoint = {
      x: (focalPoint.x - mapPosition.x) / mapScale,
      y: (focalPoint.y - mapPosition.y) / mapScale,
    };

    setMapScale(clampedScale);
    setMapPosition({
      x: focalPoint.x - worldPoint.x * clampedScale,
      y: focalPoint.y - worldPoint.y * clampedScale,
    });
  };

  const handleResetTransform = () => {
    setMapScale(2);
    setMapPosition({x: -mapWorldSize.width / 2, y: -mapWorldSize.height});
  };

  const handleZoomIn = () => {
    const scale = clampMapScale(mapScale * 1.2);
    setMapScale(scale);
  };

  const handleZoomOut = () => {
    const scale = clampMapScale(mapScale / 1.2);
    setMapScale(scale);
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return;
    }

    const scaleBy = 1.08;
    const nextScale =
      event.evt.deltaY > 0 ? mapScale / scaleBy : mapScale * scaleBy;
    applyScaleAtPoint(nextScale, pointer);
  };

  const handleMapClick = (
    event: KonvaEventObject<globalThis.MouseEvent | TouchEvent>,
  ) => {
    if (!editable) {
      return;
    }

    if (!selectedStation) {
      message.warning(t("map.selectStation"));
      return;
    }

    if (!viewportSize.width || !viewportSize.height) {
      return;
    }

    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return;
    }

    const markerX = clampPercent(
      ((pointer.x - mapPosition.x) / mapScale / mapWorldSize.width) * 100,
    );
    const markerY = clampPercent(
      ((pointer.y - mapPosition.y) / mapScale / mapWorldSize.height) * 100,
    );
    const stationSnapshot = selectedStation;
    const nextMarker = {mapX: markerX, mapY: markerY};

    if (
      !isValidMapCoordinate(nextMarker.mapX) ||
      !isValidMapCoordinate(nextMarker.mapY)
    ) {
      message.error(t("map.markerFinite"));
      return;
    }

    modal.confirm({
      centered: true,
      title: t("map.updateMarkerTitle"),
      content: t("map.updateMarkerContent", {station: stationSnapshot.name}),
      okText: t("common.update"),
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await updateAdminStation(stationSnapshot.id, nextMarker);
          loadDatabase(await fetchAdminDatabase());
          message.success(t("map.updatedMarker", {station: stationSnapshot.name}));
        } catch (error: unknown) {
          loadDatabase(await fetchAdminDatabase());
          message.error(
            error instanceof Error ?
              error.message
            : t("map.updateMarkerFailed"),
          );
          throw error;
        }
      },
    });
  };

  if (!stationDefinitions.length) {
    return (
      <Card className="surface-card">
        <Empty description={t("map.noMapData")} />
      </Card>
    );
  }

  const openLinkInNewTab = (url: string) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const refreshPlayerData = async () => {
    loadDatabase(await fetchPlayerDatabase());
  };

  const submitCheckInQr = async (rawToken: string) => {
    if (!scanTarget || isSubmittingQrRef.current) {
      return;
    }

    if (session?.role !== "user") {
      setScanTarget(null);
      message.info(t("map.adminNoSimulate"));
      return;
    }

    const token = rawToken.trim();
    if (!token) {
      message.warning(t("errors.checkInRequired"));
      return;
    }

    isSubmittingQrRef.current = true;
    setIsSubmittingQr(true);
    try {
      await checkInStation(scanTarget.stationId, token);
      await refreshPlayerData();
      message.success(t("map.checkInAccepted"));
      const stationId = scanTarget.stationId;
      setFocusedStationId(null);
      setScanTarget(null);
      setQrToken("");
      navigate(`/stations/${stationId}`);
    } catch {
      message.error(t("errors.checkInFailed"));
    } finally {
      isSubmittingQrRef.current = false;
      setIsSubmittingQr(false);
    }
  };

  return (
    <div className="movement-map-card">
      <div className="movement-map-shell">
        <div className="movement-map-controls">
          {session?.role === "user" && (
            <Flex className="movement-map-legend" wrap>
              {USER_STATUS_LEGEND.map((item) => (
                <span key={item.label} className="movement-map-legend-item">
                  <span
                    className="movement-map-legend-dot"
                    style={{backgroundColor: getMarkerFill(item.label)}}
                  />
                  {t(`status.${item.label}`)}
                </span>
              ))}
            </Flex>
          )}

          {editable && (
            <div className="movement-map-toolbar">
              <Select
                value={resolvedSelectedStationId}
                style={{minWidth: 240, flex: 1}}
                placeholder={t("map.selectStation")}
                options={[...stationDefinitions].sort((left, right) =>
                  compareStationIds(left.id, right.id),
                ).map((station) => ({
                  label: `${getStationDisplayCode(station.id)} - ${station.name}`,
                  value: station.id,
                }))}
                onChange={setSelectedStationId}
              />
              <Tag color="gold">{t("map.clickToPlace")}</Tag>
            </div>
          )}
        </div>
        <div className="movement-map-zoom-controls">
          <Flex gap={8} vertical justify="center" align="center">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetTransform}></Button>
            <Button icon={<ZoomInOutlined />} onClick={handleZoomIn}></Button>
            <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut}></Button>
          </Flex>
        </div>

        <div ref={mapViewportRef} className="movement-map-viewport">
          {viewportSize.width > 0 && viewportSize.height > 0 && (
            <Stage
              width={viewportSize.width}
              height={viewportSize.height}
              x={mapPosition.x}
              y={mapPosition.y}
              scaleX={mapScale}
              scaleY={mapScale}
              draggable
              onDragStart={() => {
                setIsDraggingMap(true);
              }}
              onDragEnd={(event) => {
                setMapPosition(event.target.position());
                setIsDraggingMap(false);
              }}
              onWheel={handleWheel}
              onClick={handleMapClick}
              onTap={handleMapClick}
              style={{cursor: editable ? "crosshair" : "grab"}}>
              <Layer listening={false}>
                {mapImage && (
                  <KonvaImage
                    image={mapImage}
                    width={mapWorldSize.width}
                    height={mapWorldSize.height}
                    listening={false}
                  />
                )}
              </Layer>

              <Layer>
                {markerViewModels.map(({station, markerX, markerY, uiState}) => (
                  <StationMarker
                    key={station.id}
                    x={markerX}
                    y={markerY}
                    code={getStationDisplayCode(station.id)}
                    uiState={uiState}
                    animate={!isDraggingMap && !prefersReducedMotion}
                    onSelect={() => {
                      setNowMs(Date.now());
                      setFocusedStationId(station.id);
                    }}
                  />
                ))}
              </Layer>
            </Stage>
          )}
        </div>
      </div>

      <Drawer
        title={
          focusedStation ?
            `${getStationDisplayCode(focusedStation.id)} - ${focusedStation.name}`
          : t("map.stationDetails")
        }
        open={Boolean(focusedStation)}
        onClose={() => setFocusedStationId(null)}
        placement="bottom"
        destroyOnHidden>
        {focusedStation && focusedTeamStation && (
          <Card className="surface-card station-card station-showcase-card movement-map-station-card">
            <div className="station-showcase-header">
              <div
                className={`station-showcase-avatar${
                  focusedStationDisplayCode.length > 2 ?
                    " station-showcase-avatar-compact"
                  : ""
                }`}
                aria-label={t("common.stationLabel", {code: focusedStationDisplayCode})}>
                {focusedStationDisplayCode}
              </div>
              <div className="station-showcase-heading">
                <Flex gap={8} align="center" className="full-width">
                  <Typography.Title level={4} className="card-title">
                    {focusedTeamStation.name}
                  </Typography.Title>
                  <Tag color={getStationStatusColor(focusedTeamStation.status)}>
                    {t(`status.${focusedTeamStation.status}`)}
                  </Tag>
                  {isFocusedCooldownActive && (
                    <Tag color="orange">
                      {t("common.cooldown", {
                        time: formatCooldownRemaining(focusedCooldownRemaining),
                      })}
                    </Tag>
                  )}
                </Flex>
                <Typography.Paragraph className="muted-copy compact-copy">
                  {focusedTeamStation.description}
                </Typography.Paragraph>
              </div>
            </div>

            <div className="station-stats">
              <div className="station-stat">
                <TeamOutlined />
                <span>
                  <small>{t("common.playingTeams")}</small>
                  <strong>{focusedPlayingTeamCount}</strong>
                </span>
              </div>
              <div className="station-stat">
                <StarFilled />
                <span>
                  <small>{t("common.scoreMax")}</small>
                  <strong>
                    {focusedTeamStation.score} / {getStationEffectiveMaxPoints(focusedTeamStation)}
                  </strong>
                </span>
              </div>
              <div className="station-stat">
                <PlayCircleOutlined />
                <span>
                  <small>{t("common.startTime")}</small>
                  <strong>{formatDateTime(focusedTeamStation.startTime, language)}</strong>
                </span>
              </div>
              <div className="station-stat">
                <FlagOutlined />
                <span>
                  <small>{t("common.endTime")}</small>
                  <strong>{formatDateTime(focusedTeamStation.endTime, language)}</strong>
                </span>
              </div>
            </div>

            <div className="station-showcase-actions movement-map-actions">
              <Button
                block
                className="station-media-button station-youtube-button"
                icon={<YoutubeOutlined />}
                disabled={
                  focusedTeamStation.gameType !== "ST" ||
                  !focusedTeamStation.youtubeUrl
                }
                onClick={() =>
                  openLinkInNewTab(focusedTeamStation.youtubeUrl as string)
                }>
                {t("common.watchVideo")}
              </Button>
              {session?.role === "user" && (
                <StationImageGallery imageUrls={focusedTeamStation.imageUrls} />
              )}
              <Button
                block
                type="primary"
                className={
                  session?.role === "user" ? "station-gameplay-button" : undefined
                }
                icon={<PlayCircleOutlined />}
                disabled={isFocusedCooldownActive}
                onClick={() => {
                  const disabledReason = getDisabledReason(
                    focusedTeamStation,
                    activeStation,
                    nowMs,
                    t,
                  );

                  if (disabledReason) {
                    message.warning(disabledReason);
                    return;
                  }

                  if (focusedTeamStation.status === "In Progress") {
                    navigate(`/stations/${focusedTeamStation.stationId}`);
                    return;
                  }

                  setScanTarget(focusedTeamStation);
                }}>
                {isFocusedCooldownActive ?
                  t("common.cooldown", {
                    time: formatCooldownRemaining(focusedCooldownRemaining),
                  })
                : session?.role === "user" && focusedTeamStation.status === "In Progress" ?
                  t("status.In Progress")
                : t("common.play")}
              </Button>
            </div>
          </Card>
        )}
      </Drawer>

      <Modal
        centered
        title={t("map.scanStartGameTitle")}
        open={Boolean(scanTarget)}
        onCancel={() => {
          setQrToken("");
          setScanTarget(null);
        }}
        onOk={() => void submitCheckInQr(qrToken)}
        confirmLoading={isSubmittingQr}
        okText={t("stationsPage.submitCheckIn")}
        cancelText={t("common.close")}>
        <Flex vertical gap={12} style={{width: "100%"}}>
          <Typography.Text>
            {t("map.scanStartGameDescription", {
              station: scanTarget ?
                `${getStationDisplayCode(scanTarget.stationId)} - ${scanTarget.name}`
              : "",
            })}
          </Typography.Text>
          <QrTokenInput
            value={qrToken}
            placeholder={t("stationsPage.checkInPlaceholder")}
            onChange={setQrToken}
            onScan={(value) => void submitCheckInQr(value)}
          />
          <Alert
            type="info"
            showIcon
            description={t("map.scanHelp")}
          />
        </Flex>
      </Modal>
    </div>
  );
}
