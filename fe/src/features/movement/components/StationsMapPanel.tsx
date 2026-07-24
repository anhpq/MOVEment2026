import {
  ReloadOutlined,
  YoutubeOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Modal,
  Select,
  Tag,
  Typography,
} from "antd";
import type {KonvaEventObject} from "konva/lib/Node";
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Stage,
  Text,
} from "react-konva";
import {useNavigate} from "react-router-dom";
import {fetchAdminDatabase} from "../adminData";
import {checkInStation, updateAdminStation} from "../api";
import {fetchPlayerDatabase, PLAYER_MAP_IMAGE_SRC} from "../playerData";
import {useMovementStore} from "../store";
import type {StationDefinition, TeamStation} from "../types";
import {
  formatDateTime,
  getDisabledReason,
  getStationStatusColor,
} from "../utils";
import {QrTokenInput} from "./QrTokenInput";
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

const MIN_MAP_SCALE = 0.55;
const MAX_MAP_SCALE = 4;
const USER_STATUS_LEGEND: Array<{label: TeamStation["status"]}> = [
  {label: "New"},
  {label: "In Progress"},
  {label: "Finished"},
];

function clampMapScale(value: number) {
  return Math.max(MIN_MAP_SCALE, Math.min(MAX_MAP_SCALE, value));
}

function getMarkerFill(status?: TeamStation["status"]) {
  return getStationStatusColor(status ?? "New");
}

function clampPercent(value: number) {
  return Math.max(2, Math.min(98, value));
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

export function StationsMapPanel({editable = false}: StationsMapPanelProps) {
  const navigate = useNavigate();
  const {modal, message} = AntdApp.useApp();
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
  const [scanTarget, setScanTarget] = useState<TeamStationWithMeta | null>(
    null,
  );
  const [qrToken, setQrToken] = useState("");
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);

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

  const markers = useMemo(
    () =>
      stationDefinitions.map((station) => ({
        station,
        position: buildMarkerPosition(station, fallbackPositions[station.id]),
      })),
    [fallbackPositions, stationDefinitions],
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

  useEffect(() => {
    let cancelled = false;
    const image = new globalThis.Image();

    image.src = PLAYER_MAP_IMAGE_SRC;
    image.onload = () => {
      if (!cancelled) {
        setMapImage(image);
      }
    };

    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const element = mapViewportRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      setViewportSize({
        width: element.clientHeight * 2.5,
        height: element.clientHeight,
      });
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
    setMapPosition({x: -viewportSize.width / 2, y: -viewportSize.height});
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
      message.warning("Please select a station before placing a marker");
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
      ((pointer.x - mapPosition.x) / mapScale / viewportSize.width) * 100,
    );
    const markerY = clampPercent(
      ((pointer.y - mapPosition.y) / mapScale / viewportSize.height) * 100,
    );

    modal.confirm({
      centered: true,
      title: "Update marker position?",
      content: `${selectedStation.name} will be updated with the new position.`,
      okText: "Update",
      cancelText: "Cancel",
      onOk: async () => {
        await updateAdminStation(selectedStation.id, {
          mapX: markerX,
          mapY: markerY,
        });
        loadDatabase(await fetchAdminDatabase());
        message.success(`Updated position for station ${selectedStation.name}`);
      },
    });
  };

  if (!stationDefinitions.length) {
    return (
      <Card className="surface-card">
        <Empty description="No station data available to display the map" />
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
                  {item.label}
                </span>
              ))}
            </Flex>
          )}

          {editable && (
            <div className="movement-map-toolbar">
              <Select
                value={resolvedSelectedStationId}
                style={{minWidth: 240, flex: 1}}
                placeholder="Select a station to place a marker"
                options={stationDefinitions.map((station) => ({
                  label: `${station.id} - ${station.name}`,
                  value: station.id,
                }))}
                onChange={setSelectedStationId}
              />
              <Tag color="gold">Click on the map to place a marker</Tag>
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
              onDragEnd={(event) => {
                setMapPosition(event.target.position());
              }}
              onWheel={handleWheel}
              onClick={handleMapClick}
              onTap={handleMapClick}
              style={{cursor: editable ? "crosshair" : "grab"}}>
              <Layer>
                {mapImage && (
                  <KonvaImage
                    image={mapImage}
                    width={viewportSize.width}
                    height={viewportSize.height}
                  />
                )}

                {markers.map(({station, position}) => {
                  const markerX = (position.x / 100) * viewportSize.width;
                  const markerY = (position.y / 100) * viewportSize.height;
                  const teamStation = activeTeamStationById[station.id];
                  const markerFill =
                    session?.role === "user" ?
                      getMarkerFill(teamStation?.status)
                    : "#0f4ea8";

                  return (
                    <Group
                      key={station.id}
                      x={markerX}
                      y={markerY}
                      onClick={(event) => {
                        event.cancelBubble = true;
                        setFocusedStationId(station.id);
                      }}
                      onTap={(event) => {
                        event.cancelBubble = true;
                        setFocusedStationId(station.id);
                      }}>
                      <Circle
                        radius={14}
                        fill={markerFill}
                        stroke="#ffffff"
                        strokeWidth={2}
                        shadowColor="rgba(0,0,0,0.3)"
                        shadowBlur={10}
                      />
                      <Text
                        text={station.id}
                        x={-26}
                        y={-7}
                        width={52}
                        align="center"
                        fill="#ffffff"
                        fontStyle="700"
                        fontSize={8}
                      />
                    </Group>
                  );
                })}
              </Layer>
            </Stage>
          )}
        </div>
      </div>

      <Drawer
        title={focusedStation?.name ?? "Station Details"}
        open={Boolean(focusedStation)}
        onClose={() => setFocusedStationId(null)}
        placement="bottom"
        destroyOnHidden>
        {focusedStation && (
          <Flex vertical gap={12} style={{width: "100%"}}>
            {focusedTeamStation && (
              <>
                <Typography.Paragraph className="muted-copy compact-copy">
                  {focusedTeamStation.description}
                </Typography.Paragraph>

                <Descriptions size="small">
                  <Descriptions.Item label="Playing Teams" span={2}>
                    {
                      Object.values(teamStations).filter((stations) =>
                        stations.some(
                          (item) =>
                            item.stationId === focusedTeamStation.stationId &&
                            (item.backendStatus === "CHECKED_IN" ||
                              item.backendStatus === "PLAYING"),
                        ),
                      ).length
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Score">
                    {focusedTeamStation.score}
                  </Descriptions.Item>
                  <Descriptions.Item label="Start Time">
                    {formatDateTime(focusedTeamStation.startTime)}
                  </Descriptions.Item>
                  <Descriptions.Item label="End Time">
                    {formatDateTime(focusedTeamStation.endTime)}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {focusedTeamStation && (
              <Flex justify="space-between" gap={8} className="full-width">
                {focusedTeamStation.gameType === "ST" &&
                  focusedTeamStation.youtubeUrl && (
                  <Button
                    className="full-width"
                    icon={<YoutubeOutlined />}
                    disabled={!focusedTeamStation.youtubeUrl}
                    onClick={() =>
                      openLinkInNewTab(focusedTeamStation.youtubeUrl as string)
                    }>
                    Watch Video
                  </Button>
                )}
                <Button
                  type="primary"
                  className="full-width"
                  onClick={() => {
                    const disabledReason = getDisabledReason(
                      focusedTeamStation,
                      activeStation,
                    );

                    if (disabledReason) {
                      message.warning(disabledReason);
                      return;
                    }

                    if (focusedTeamStation.status === "In Progress") {
                      // Navigate to the station detail page if the station is already in progress
                      navigate(`/stations/${focusedTeamStation.stationId}`);
                      return;
                    }

                    setScanTarget(focusedTeamStation);
                  }}>
                  Play
                </Button>
              </Flex>
            )}
          </Flex>
        )}
      </Drawer>

      <Modal
        centered
        title="Scan QR to Start Game"
        open={Boolean(scanTarget)}
        onCancel={() => {
          setQrToken("");
          setScanTarget(null);
        }}
        onOk={async () => {
          if (!scanTarget) {
            return;
          }

          if (session?.role !== "user") {
            setScanTarget(null);
            message.info("Admin cannot simulate team QR check-in");
            return;
          }

          if (!qrToken.trim()) {
            message.warning("Please enter or scan the check-in QR token");
            return;
          }

          setIsSubmittingQr(true);
          try {
            await checkInStation(scanTarget.stationId, qrToken.trim());
            await refreshPlayerData();
            message.success("Check-in QR accepted");
            const stationId = scanTarget.stationId;
            setFocusedStationId(null);
            setScanTarget(null);
            setQrToken("");
            navigate(`/stations/${stationId}`);
          } catch (error: unknown) {
            message.error(
              error instanceof Error ? error.message : "Check-in failed",
            );
          } finally {
            setIsSubmittingQr(false);
          }
        }}
        confirmLoading={isSubmittingQr}
        okText="Submit check-in QR"
        cancelText="Close">
        <Flex vertical gap={12} style={{width: "100%"}}>
          <Typography.Text>
            Scan or enter the check-in QR token for station{" "}
            <strong>{scanTarget?.name}</strong>.
          </Typography.Text>
          <QrTokenInput
            value={qrToken}
            placeholder="Check-in QR token"
            onChange={setQrToken}
          />
          <Alert
            type="info"
            showIcon
            description="Camera scanning can paste the decoded token here; manual entry remains available for rehearsal devices."
          />
        </Flex>
      </Modal>
    </div>
  );
}
