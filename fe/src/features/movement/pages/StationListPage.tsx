import {
  CheckCircleFilled,
  EditFilled,
  FlagOutlined,
  PlayCircleOutlined,
  StarFilled,
  TeamOutlined,
  UsergroupAddOutlined,
  YoutubeFilled,
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
import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import type {TeamStation} from "../types";
import {checkInStation} from "../api";
import {QrTokenInput} from "../components/QrTokenInput";
import {StationImageGallery} from "../components/StationImageGallery";
import {useStationPlayingCounts} from "../hooks/useStationPlayingCounts";
import {executePlayerMutation} from "../playerData";
import {
  compareTeamStations,
  formatCooldownRemaining,
  formatDateTime,
  getDisabledReason,
  getLocalizedTeamName,
  getStationCooldownRemainingSeconds,
  getStationDisplayCode,
  getStationEffectiveMaxPoints,
  getStationStatusColor,
} from "../utils";

export function StationListPage() {
  const navigate = useNavigate();
  const params = useParams<{teamId: string}>();
  const {message} = AntdApp.useApp();
  const {i18n, t} = useTranslation();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const setActiveTeam = useMovementStore((state) => state.setActiveTeam);
  const teams = useMovementStore((state) => state.teams);
  const teamStations = useMovementStore((state) => state.teamStations);
  const finalSummary = useMovementStore((state) => state.finalSummary);
  const [scanTarget, setScanTarget] = useState<TeamStation | null>(null);
  const [checkInQrToken, setCheckInQrToken] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const isSubmittingCheckInRef = useRef(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const selectedTeamId =
    session?.role === "admin" && params.teamId ? params.teamId : activeTeamId;
  const team = teams.find((item) => item.id === selectedTeamId);
  const language = i18n.language === "en" ? "en" : "vi";
  const localizedTeamName = team ? getLocalizedTeamName(team.name, language) : "";
  const sortedStations = [...(teamStations[selectedTeamId] ?? [])].sort(
    compareTeamStations,
  );
  const activeStation = sortedStations.find(
    (station) => station.status === "In Progress",
  );
  const playingCounts = useStationPlayingCounts(session?.role === "user");
  const playingTeamCount = (stationId: string) => playingCounts[stationId] ?? 0;
  const isFinalReady = Boolean(
    finalSummary?.isOpen && !finalSummary.blockedByActiveStation,
  );

  useEffect(() => {
    if (
      session?.role === "admin" &&
      params.teamId &&
      teams.some((item) => item.id === params.teamId) &&
      activeTeamId !== params.teamId
    ) {
      setActiveTeam(params.teamId);
    }
  }, [
    activeTeamId,
    params.teamId,
    session?.role,
    setActiveTeam,
    teams,
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!session || !team) {
    return null;
  }

  const handleStationClick = (station: TeamStation) => {
    if (session.role !== "user") {
      navigate(`/teams/${selectedTeamId}/stations/${station.stationId}`);
      return;
    }

    const disabledReason = getDisabledReason(station, activeStation, nowMs, t);
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

  const submitCheckInQr = async (rawToken: string) => {
    if (!scanTarget || isSubmittingCheckInRef.current) {
      return;
    }

    const token = rawToken.trim();
    if (!token) {
      message.warning(t("errors.checkInRequired"));
      return;
    }

    isSubmittingCheckInRef.current = true;
    setIsSubmittingCheckIn(true);
    try {
      await executePlayerMutation(
        () => checkInStation(scanTarget.stationId, token),
        language,
      );
      message.success(t("stationsPage.qrScanned"));
      const stationId = scanTarget.stationId;
      setCheckInQrToken("");
      setScanTarget(null);
      navigate(`/stations/${stationId}`);
    } catch {
      message.error(t("errors.checkInFailed"));
    } finally {
      isSubmittingCheckInRef.current = false;
      setIsSubmittingCheckIn(false);
    }
  };

  return (
    <Flex vertical gap={16} className="full-width">
      <section className="station-team-hero">
        <div className="station-team-identity">
          <div className="station-team-avatar" aria-hidden="true">
            <UsergroupAddOutlined />
          </div>
          <Typography.Title level={2}>{localizedTeamName}</Typography.Title>
        </div>

        <div className="station-team-metrics">
          <div className="station-team-metric">
            <span className="station-metric-icon">
              <StarFilled />
            </span>
            <span>
              <small>{t("common.totalScore")}</small>
              <strong>{team.score}</strong>
            </span>
          </div>
          <div className="station-team-metric">
            <span className="station-metric-icon">
              <CheckCircleFilled />
            </span>
            <span>
              <small>{t("common.finished")}</small>
              <strong>
                {team.finish} / {sortedStations.length}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {session.role === "user" && isFinalReady && (
        <Alert
          type="success"
          showIcon
          message={t("stationsPage.finalOpen")}
          description={t("stationsPage.finalOpenDescription")}
          action={
            <Button onClick={() => navigate("/final")}>
              {t("stationsPage.enterFinal")}
            </Button>
          }
        />
      )}

      <List
        className="card-list"
        dataSource={sortedStations}
        locale={{emptyText: <Empty description={t("stationsPage.empty")} />}}
        renderItem={(station) => {
          const stationDisplayCode = getStationDisplayCode(station.stationId);
          const cooldownRemaining = getStationCooldownRemainingSeconds(
            station,
            nowMs,
          );
          const isCooldownActive =
            session.role === "user" &&
            station.status !== "In Progress" &&
            cooldownRemaining > 0;

          return (
            <List.Item>
              <Card className="surface-card station-card station-showcase-card">
                <div className="station-showcase-header">
                  <div
                    className={`station-showcase-avatar${
                      stationDisplayCode.length > 2 ?
                        " station-showcase-avatar-compact"
                      : ""
                    }`}
                    aria-label={t("common.stationLabel", {code: stationDisplayCode})}>
                    {stationDisplayCode}
                  </div>
                  <div className="station-showcase-heading">
                    <Flex gap={8} align="center" className="full-width">
                      <Typography.Title level={4} className="card-title">
                        {station.name}
                      </Typography.Title>
                      <Tag color={getStationStatusColor(station.status)}>
                        {t(`status.${station.status}`)}
                      </Tag>
                      {isCooldownActive && (
                        <Tag color="orange">
                          {t("common.cooldown", {
                            time: formatCooldownRemaining(cooldownRemaining),
                          })}
                        </Tag>
                      )}
                    </Flex>
                    <Typography.Paragraph className="muted-copy compact-copy">
                      {station.description}
                    </Typography.Paragraph>
                  </div>
                </div>

                <div className="station-stats">
                  <div className="station-stat">
                    <TeamOutlined />
                    <span>
                      <small>{t("common.playingTeams")}</small>
                      <strong>{playingTeamCount(station.stationId)}</strong>
                    </span>
                  </div>
                  <div className="station-stat">
                    <StarFilled />
                    <span>
                      <small>{t("common.scoreMax")}</small>
                      <strong>
                        {station.score} / {getStationEffectiveMaxPoints(station)}
                      </strong>
                    </span>
                  </div>
                  <div className="station-stat">
                    <PlayCircleOutlined />
                    <span>
                      <small>{t("common.startTime")}</small>
                      <strong>{formatDateTime(station.startTime, language)}</strong>
                    </span>
                  </div>
                  <div className="station-stat">
                    <FlagOutlined />
                    <span>
                      <small>{t("common.endTime")}</small>
                      <strong>{formatDateTime(station.endTime, language)}</strong>
                    </span>
                  </div>
                </div>

                <div
                  className={`station-showcase-actions ${
                    session.role === "admin" ? "admin-edit-only" : ""
                  }`}>
                  {session.role === "user" && (
                    <Button
                      block
                      className="station-media-button station-youtube-button"
                      icon={<YoutubeFilled />}
                      disabled={
                        station.gameType !== "ST" || !station.youtubeUrl
                      }
                      onClick={() =>
                        openLinkInNewTab(station.youtubeUrl as string)
                      }>
                      {t("common.watchVideo")}
                    </Button>
                  )}
                  {session.role === "user" && (
                    <StationImageGallery
                      stationId={station.stationId}
                      imageCount={station.imageCount}
                      imageUrls={station.imageUrls}
                    />
                  )}
                  <Button
                    block
                    type="primary"
                    className={
                      session.role === "user" ? "station-gameplay-button" : undefined
                    }
                    icon={
                      session.role === "user" ?
                        <PlayCircleOutlined />
                      : <EditFilled />
                    }
                    disabled={isCooldownActive}
                    onClick={() => handleStationClick(station)}>
                    {session.role === "user" ?
                      isCooldownActive ?
                        t("common.cooldown", {
                          time: formatCooldownRemaining(cooldownRemaining),
                        })
                      : station.status === "In Progress" ?
                        t("status.In Progress")
                      : t("common.play")
                    : t("common.viewEdit")}
                  </Button>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />

      <Modal
        centered
        className="station-qr-modal"
        destroyOnHidden
        footer={null}
        title={t("stationsPage.scanStartTitle")}
        open={Boolean(scanTarget)}
        onCancel={() => {
          setCheckInQrToken("");
          setScanTarget(null);
        }}
        >
        <Flex vertical gap={12} className="full-width">
          {scanTarget && (
            <div className="station-qr-identity">
              <span>{getStationDisplayCode(scanTarget.stationId)}</span>
              <strong>{scanTarget.name}</strong>
            </div>
          )}
          <Typography.Text type="secondary">
            {t("stationsPage.scanStartDescriptionShort")}
          </Typography.Text>
          <QrTokenInput
            value={checkInQrToken}
            placeholder={t("stationsPage.checkInPlaceholder")}
            onChange={setCheckInQrToken}
            onScan={(value) => void submitCheckInQr(value)}
            cameraFirst
            onSubmit={() => void submitCheckInQr(checkInQrToken)}
            submitLabel={t("stationsPage.confirmCode")}
            submitting={isSubmittingCheckIn}
          />
        </Flex>
      </Modal>
    </Flex>
  );
}
