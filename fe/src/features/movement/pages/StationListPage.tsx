import {
  CheckCircleFilled,
  EditFilled,
  FlagOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
  StarFilled,
  TeamOutlined,
  UsergroupAddOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Empty,
  Flex,
  List,
  Modal,
  Tag,
  Typography,
} from "antd";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {STATUS_ORDER} from "../constants";
import {useMovementStore} from "../store";
import type {TeamStation} from "../types";
import {checkInStation, getPlayerFinal} from "../api";
import {QrTokenInput} from "../components/QrTokenInput";
import {fetchPlayerDatabase} from "../playerData";
import {
  formatDateTime,
  getDisabledReason,
  getStationStatusColor,
} from "../utils";

export function StationListPage() {
  const navigate = useNavigate();
  const {message} = AntdApp.useApp();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const teamStations = useMovementStore((state) => state.teamStations);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const [scanTarget, setScanTarget] = useState<TeamStation | null>(null);
  const [checkInQrToken, setCheckInQrToken] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [isFinalReady, setIsFinalReady] = useState(false);

  const team = teams.find((item) => item.id === activeTeamId);
  const sortedStations = [...(teamStations[activeTeamId] ?? [])].sort(
    (left, right) =>
      STATUS_ORDER[left.status] - STATUS_ORDER[right.status] ||
      left.name.localeCompare(right.name),
  );
  const activeStation = sortedStations.find(
    (station) => station.status === "In Progress",
  );
  const playingTeamCount = (stationId: string) =>
    Object.values(teamStations).filter((stations) =>
      stations.some(
        (item) =>
          item.stationId === stationId &&
          (item.backendStatus === "CHECKED_IN" ||
            item.backendStatus === "PLAYING"),
      ),
    ).length;

  useEffect(() => {
    if (session?.role !== "user") {
      return;
    }

    let cancelled = false;
    const checkFinal = async () => {
      try {
        const final = await getPlayerFinal();
        if (!cancelled) {
          setIsFinalReady(final.isOpen && !final.blockedByActiveStation);
        }
      } catch {
        if (!cancelled) {
          setIsFinalReady(false);
        }
      }
    };

    void checkFinal();
    const timer = window.setInterval(() => void checkFinal(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session?.role]);

  if (!session || !team) {
    return null;
  }

  const handleStationClick = (station: TeamStation) => {
    if (session.role !== "user") {
      navigate(`/stations/${station.stationId}`);
      return;
    }

    const disabledReason = getDisabledReason(station, activeStation);
    if (disabledReason) {
      message.warning(disabledReason);
      return;
    }

    if (station.status === "In Progress") {
      navigate(`/stations/${station.stationId}`);
      return;
    }

    setCheckInQrToken("");
    setScanTarget(station);
  };

  const openLinkInNewTab = (url: string) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  return (
    <Flex vertical gap={16} className="full-width">
      <section className="station-team-hero">
        <div className="station-team-avatar" aria-hidden="true">
          <UsergroupAddOutlined />
        </div>
        <div className="station-team-summary">
          <Typography.Title level={2}>{team.name}</Typography.Title>
          <div className="station-team-metrics">
            <div className="station-team-metric">
              <span className="station-metric-icon">
                <StarFilled />
              </span>
              <span>
                <small>Total Score</small>
                <strong>{team.score}</strong>
              </span>
            </div>
            <div className="station-team-metric">
              <span className="station-metric-icon">
                <CheckCircleFilled />
              </span>
              <span>
                <small>Finished</small>
                <strong>
                  {team.finish} / {sortedStations.length}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {session.role === "user" && isFinalReady && (
        <Alert
          type="success"
          showIcon
          message="Final Challenge is open"
          description="Your team is free to enter the Final Challenge."
          action={
            <Button onClick={() => navigate("/final")}>Enter Final</Button>
          }
        />
      )}

      <List
        className="card-list"
        dataSource={sortedStations}
        locale={{emptyText: <Empty description="No stations available" />}}
        renderItem={(station) => {
          return (
            <List.Item>
              <Card className="surface-card station-card station-showcase-card">
                <div className="station-showcase-header">
                  <div className="station-showcase-avatar" aria-hidden="true">
                    <PlayCircleFilled />
                  </div>
                  <div className="station-showcase-heading">
                    <Flex gap={8} align="center" className="full-width">
                      <Typography.Title level={4} className="card-title">
                        {station.name}
                      </Typography.Title>
                      <Tag color={getStationStatusColor(station.status)}>
                        {station.status}
                      </Tag>
                    </Flex>
                  </div>
                </div>

                <div className="station-stats">
                  <div className="station-stat">
                    <TeamOutlined />
                    <span>
                      <small>Playing Teams</small>
                      <strong>{playingTeamCount(station.stationId)}</strong>
                    </span>
                  </div>
                  <div className="station-stat">
                    <StarFilled />
                    <span>
                      <small>Score</small>
                      <strong>{station.score}</strong>
                    </span>
                  </div>
                  <div className="station-stat">
                    <PlayCircleOutlined />
                    <span>
                      <small>Start Time</small>
                      <strong>{formatDateTime(station.startTime)}</strong>
                    </span>
                  </div>
                  <div className="station-stat">
                    <FlagOutlined />
                    <span>
                      <small>End Time</small>
                      <strong>{formatDateTime(station.endTime)}</strong>
                    </span>
                  </div>
                </div>

                <div className="station-showcase-actions">
                      {station.youtubeUrl && (
                        <Button
                          block
                          type="primary"
                          icon={<YoutubeOutlined />}
                          disabled={!station.youtubeUrl}
                          onClick={() =>
                            openLinkInNewTab(station.youtubeUrl as string)
                          }>
                          Watch Video
                        </Button>
                      )}
                      <Button
                        block
                        type={station.youtubeUrl ? "default" : "primary"}
                        icon={
                          session.role === "user" ?
                            <PlayCircleOutlined />
                          : <EditFilled />
                        }
                        onClick={() => handleStationClick(station)}>
                        {session.role === "user" ? "Play" : "View & Edit"}
                      </Button>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />

      <Modal
        centered
        title="Scan QR to Start"
        open={Boolean(scanTarget)}
        onCancel={() => {
          setCheckInQrToken("");
          setScanTarget(null);
        }}
        onOk={async () => {
          if (!scanTarget) {
            return;
          }

          if (!checkInQrToken.trim()) {
            message.warning("Please scan or enter the check-in QR token");
            return;
          }

          setIsSubmittingCheckIn(true);
          try {
            await checkInStation(scanTarget.stationId, checkInQrToken.trim());
            loadDatabase(await fetchPlayerDatabase());
            message.success("QR code scanned successfully");
            const stationId = scanTarget.stationId;
            setCheckInQrToken("");
            setScanTarget(null);
            navigate(`/stations/${stationId}`);
          } catch (error: unknown) {
            message.error(
              error instanceof Error ? error.message : "Check-in failed",
            );
          } finally {
            setIsSubmittingCheckIn(false);
          }
        }}
        confirmLoading={isSubmittingCheckIn}
        okText="Submit Check-in QR"
        cancelText="Close">
        <Flex vertical gap={12} className="full-width">
          <Typography.Text>
            Scan the check-in QR code for station{" "}
            <strong>{scanTarget?.name}</strong>.
          </Typography.Text>
          <QrTokenInput
            value={checkInQrToken}
            placeholder="Check-in QR token"
            onChange={setCheckInQrToken}
          />
          <Alert
            type="info"
            showIcon
            description={
              <Flex vertical gap={4}>
                <Typography.Text strong>User Flow</Typography.Text>
                <Typography.Text>
                  After the backend accepts the QR, the status changes to In
                  Progress and the Station Detail screen opens.
                </Typography.Text>
              </Flex>
            }
          />
        </Flex>
      </Modal>
    </Flex>
  );
}
