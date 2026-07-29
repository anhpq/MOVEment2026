import {
  CheckCircleOutlined,
  EditOutlined,
  FlagOutlined,
  PlayCircleFilled,
  ReloadOutlined,
  SaveOutlined,
  StarFilled,
  TeamOutlined,
  WarningOutlined,
  YoutubeFilled,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Tag,
  Typography,
} from "antd";
import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {useMovementStore} from "../store";
import {
  formatDateTime,
  formatDurationFromMs,
  getStationEffectiveMaxPoints,
  getStationStatusColor,
} from "../utils";
import {
  checkOutStation,
  cancelPlayerStation,
  editAdminProgressScore,
  forceAdminProgressStatus,
  getPlayerFinal,
  reopenAdminProgress,
  submitStationScore,
} from "../api";
import {QrTokenInput} from "../components/QrTokenInput";
import {StationImageGallery} from "../components/StationImageGallery";
import {useStationPlayingCounts} from "../hooks/useStationPlayingCounts";
import {executePlayerMutation} from "../playerData";
import {fetchAdminDatabase} from "../adminData";
import "./StationDetailPage.css";

type ScoreFormValues = {
  score: number;
  reason?: string;
};

export function StationDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{teamId?: string; stationId: string}>();
  const [searchParams] = useSearchParams();
  const {modal, message} = AntdApp.useApp();
  const {i18n, t} = useTranslation();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const setActiveTeam = useMovementStore((state) => state.setActiveTeam);
  const teams = useMovementStore((state) => state.teams);
  const teamStations = useMovementStore((state) => state.teamStations);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const [adminForm] = Form.useForm<ScoreFormValues>();
  const [scoreForm] = Form.useForm<ScoreFormValues>();
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [isFinishScannerOpen, setIsFinishScannerOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [checkOutQrToken, setCheckOutQrToken] = useState("");
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
  const isSubmittingCheckOutRef = useRef(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const language = i18n.language === "en" ? "en" : "vi";
  const isFromTeamV2 =
    session?.role === "user" && searchParams.get("from") === "team-v2";

  const selectedTeamId =
    session?.role === "admin" && params.teamId ? params.teamId : activeTeamId;
  const adminStationListPath = `/teams/${selectedTeamId}/stations`;
  const team = teams.find((item) => item.id === selectedTeamId);
  const station = (teamStations[selectedTeamId] ?? []).find(
    (item) => item.stationId === params.stationId,
  );
  const stationStartTime = station?.startTime ?? null;

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
  const playingCounts = useStationPlayingCounts(session?.role === "user");
  const playingTeamCount = station ? (playingCounts[station.stationId] ?? 0) : 0;
  const canShowLiveClock = Boolean(
    stationStartTime && session?.role === "user",
  );
  const elapsed =
    canShowLiveClock ?
      formatDurationFromMs(
        clockTick - new Date(stationStartTime as string).getTime(),
      )
    : "00:00:00";

  useEffect(() => {
    if (!canShowLiveClock) {
      return;
    }

    const timer = globalThis.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, [canShowLiveClock]);

  useEffect(() => {
    adminForm.setFieldsValue({score: station?.score ?? 0});
  }, [adminForm, station]);

  if (!session || !team) {
    return null;
  }

  if (!station) {
    return (
      <Card className="surface-card">
        <Empty description={t("stationDetail.notFound")} />
      </Card>
    );
  }

  const stationMaxPoints = getStationEffectiveMaxPoints(station);
  const canAdminEditScore =
    session.role === "admin" &&
    station.backendStatus === "COMPLETED" &&
    Boolean(station.progressId);

  const openLinkInNewTab = (url: string | undefined) => {
    if (!url) {
      message.warning(t("common.noVideo"));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const refreshAdminData = async () => {
    loadDatabase(await fetchAdminDatabase());
  };

  const navigateAfterTeamStationFinished = async () => {
    if (isFromTeamV2) {
      navigate("/team/v2");
      return;
    }

    try {
      const final = await getPlayerFinal();
      navigate(
        final.isOpen && !final.blockedByActiveStation ? "/final" : "/stations",
      );
    } catch {
      navigate("/stations");
    }
  };

  const submitCheckOutQr = async (rawToken: string) => {
    if (session.role !== "user") {
      setIsFinishScannerOpen(false);
      scoreForm.setFieldsValue({score: station.score});
      setIsScoreModalOpen(true);
      return;
    }

    if (isSubmittingCheckOutRef.current) {
      return;
    }

    const token = rawToken.trim();
    if (!token) {
      message.warning(t("errors.checkOutRequired"));
      return;
    }

    isSubmittingCheckOutRef.current = true;
    setIsSubmittingCheckOut(true);
    try {
      await executePlayerMutation(
        () => checkOutStation(station.stationId, token),
        language,
      );
      setCheckOutQrToken("");
      setIsFinishScannerOpen(false);
      if (station.trackingMode === "TIME") {
        message.success(t("stationDetail.timeCompleted"));
        await navigateAfterTeamStationFinished();
        return;
      }

      message.success(t("stationDetail.checkOutAccepted"));
      scoreForm.setFieldsValue({
        score: 0,
        reason: "",
      });
      setIsScoreModalOpen(true);
    } catch {
      message.error(t("errors.checkOutFailed"));
    } finally {
      isSubmittingCheckOutRef.current = false;
      setIsSubmittingCheckOut(false);
    }
  };

  return (
    <Flex vertical gap={16} className="full-width">
      <Card className="surface-card station-detail-hero">
        <header className="station-detail-heading">
          <span className="station-detail-avatar" aria-hidden="true">
            <PlayCircleFilled />
          </span>
          <div className="station-detail-copy">
            <div className="station-detail-title-row">
              <Typography.Title level={2}>{station.name}</Typography.Title>
              <Tag color={getStationStatusColor(station.status)}>
                {t(`status.${station.status}`)}
              </Tag>
            </div>
            <Typography.Paragraph>
              {station.description}
            </Typography.Paragraph>
          </div>
        </header>

        <div className="station-detail-stats">
          <div className="station-detail-stat">
            <span className="station-detail-stat-icon">
              <TeamOutlined />
            </span>
            <span>
              <small>{t("common.playingTeams")}</small>
              <strong>{playingTeamCount}</strong>
            </span>
          </div>
          <div className="station-detail-stat">
            <span className="station-detail-stat-icon">
              <StarFilled />
            </span>
            <span>
              <small>{t("common.scoreMax")}</small>
              <strong>
                {station.score} / {stationMaxPoints}
              </strong>
            </span>
          </div>
          <div className="station-detail-stat">
            <span className="station-detail-stat-icon">
              <PlayCircleFilled />
            </span>
            <span>
              <small>{t("common.startTime")}</small>
              <strong>{formatDateTime(station.startTime, language)}</strong>
            </span>
          </div>
          <div className="station-detail-stat">
            <span className="station-detail-stat-icon">
              <FlagOutlined />
            </span>
            <span>
              <small>{t("common.endTime")}</small>
              <strong>{formatDateTime(station.endTime, language)}</strong>
            </span>
          </div>
        </div>

        {session.role === "admin" && station.gameType === "ST" && station.youtubeUrl && (
          <Button
            type="primary"
            className="full-width mt-4"
            icon={<YoutubeFilled />}
            disabled={!station.youtubeUrl}
            onClick={() => openLinkInNewTab(station.youtubeUrl ?? undefined)}>
            {t("common.watchVideo")}
          </Button>
        )}
      </Card>

      {session.role === "user" ?
        <Card className="surface-card">
          <Flex
            vertical
            gap={16}
            align="center"
            justify="center"
            className="full-width">
            <Typography.Title level={2} className="section-title live-clock">
              {elapsed}
            </Typography.Title>
            <div className="station-showcase-actions station-detail-player-actions">
              <Button
                block
                className="station-media-button station-youtube-button"
                icon={<YoutubeFilled />}
                disabled={station.gameType !== "ST" || !station.youtubeUrl}
                onClick={() => openLinkInNewTab(station.youtubeUrl ?? undefined)}>
                {t("common.watchVideo")}
              </Button>
              <StationImageGallery
                stationId={station.stationId}
                imageCount={station.imageCount}
                imageUrls={station.imageUrls}
              />
              <Button
                block
                type="primary"
                size="large"
                className="station-gameplay-button"
                icon={<CheckCircleOutlined />}
                onClick={() => setIsFinishScannerOpen(true)}>
                {t("stationDetail.completedButton")}
              </Button>
            </div>
            <Button
              danger
              icon={<ReloadOutlined />}
              onClick={async () => {
                try {
                  await executePlayerMutation(
                    () => cancelPlayerStation(station.stationId),
                    language,
                  );
                  message.success(t("stationDetail.cancelled"));
                  navigate(isFromTeamV2 ? "/team/v2" : "/stations/map");
                } catch {
                  message.error(
                    t("errors.generic"),
                  );
                }
              }}>
              {t("stationDetail.cancelStation")}
            </Button>
          </Flex>
        </Card>
      : <div className="station-admin-tools">
          <Card className="surface-card station-admin-score-card">
            <header className="station-admin-tool-heading">
              <span className="station-admin-tool-icon">
                <EditOutlined />
              </span>
              <div>
                <Typography.Title level={3}>{t("stationDetail.scoreAdjustment")}</Typography.Title>
                <Typography.Text>
                  {t("stationDetail.scoreAdjustmentDescription")}
                </Typography.Text>
              </div>
            </header>
            <Form
              form={adminForm}
              layout="vertical"
              onFinish={(values) => {
                modal.confirm({
                  centered: true,
                  title: t("stationDetail.saveScoreTitle"),
                  content: t("stationDetail.saveScoreContent"),
                  okText: t("common.save"),
                  cancelText: t("common.cancel"),
                  onOk: async () => {
                      if (!station.progressId)
                      throw new Error(t("errors.progressUnavailable"));
                    try {
                      if (!values.reason?.trim())
                        throw new Error(t("errors.reasonRequired"));
                      await editAdminProgressScore(
                        station.progressId,
                        values.score,
                        values.reason.trim(),
                      );
                      await refreshAdminData();
                      message.success(t("stationDetail.scoreSaved"));
                      navigate(adminStationListPath);
                    } catch (error) {
                      message.error(
                        t("errors.saveScoreFailed"),
                      );
                      throw error;
                    }
                  },
                });
              }}>
              {!canAdminEditScore && (
                <Alert
                  className="mb-4"
                  type="info"
                  showIcon
                  description={t("stationDetail.correctionOnlyCompleted")}
                />
              )}
              <Form.Item
                label={t("stationDetail.inputScore")}
                name="score"
                rules={[{required: true}]}>
                <InputNumber
                  min={0}
                  max={stationMaxPoints}
                  disabled={!canAdminEditScore}
                  className="full-width"
                />
              </Form.Item>
              <Form.Item
                label={t("stationDetail.reason")}
                name="reason"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t("errors.reasonRequired"),
                  },
                ]}>
                <Input.TextArea
                  rows={2}
                  disabled={!canAdminEditScore}
                  placeholder={t("stationDetail.reasonPlaceholder")}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!canAdminEditScore}
                icon={<SaveOutlined />}>
                {t("stationDetail.saveScore")}
              </Button>
            </Form>
          </Card>

          <Card className="surface-card station-admin-reset-card">
            <header className="station-admin-tool-heading danger">
              <span className="station-admin-tool-icon">
                <WarningOutlined />
              </span>
              <div>
                <Typography.Title level={3}>{t("stationDetail.statusReset")}</Typography.Title>
                <Typography.Text>
                  {t("stationDetail.statusResetDescription")}
                </Typography.Text>
              </div>
            </header>
            <Alert
              type="warning"
              showIcon
              description={t("stationDetail.resetWarning")}
            />
            <Button
              danger
              className="station-reset-button"
              icon={<ReloadOutlined />}
              onClick={() => {
                modal.confirm({
                  centered: true,
                  title: t("stationDetail.resetStatusTitle"),
                  content: t("stationDetail.resetStatusContent"),
                  okText: t("common.reset"),
                  cancelText: t("common.cancel"),
                  onOk: async () => {
                      if (!station.progressId)
                      throw new Error(t("errors.progressUnavailable"));
                    try {
                      const reason = t("stationDetail.resetReason");
                      if (station.backendStatus === "COMPLETED") {
                        await reopenAdminProgress(station.progressId, reason);
                      } else {
                        await forceAdminProgressStatus(
                          station.progressId,
                          "AVAILABLE",
                          reason,
                        );
                      }
                      await refreshAdminData();
                      message.success(t("stationDetail.resetSuccess"));
                      navigate(adminStationListPath);
                    } catch (error) {
                      message.error(
                        t("errors.resetStatusFailed"),
                      );
                      throw error;
                    }
                  },
                });
              }}>
              {t("stationDetail.statusReset")}
            </Button>
          </Card>
        </div>
      }

      <Modal
        centered
        title={t("stationDetail.scanCompleteTitle")}
        open={isFinishScannerOpen}
        onCancel={() => {
          setCheckOutQrToken("");
          setIsFinishScannerOpen(false);
        }}
        onOk={() => void submitCheckOutQr(checkOutQrToken)}
        confirmLoading={isSubmittingCheckOut}
        okText={t("stationDetail.submitCheckOut")}
        cancelText={t("common.close")}>
        <Flex vertical gap={12}>
          <QrTokenInput
            value={checkOutQrToken}
            placeholder={t("stationDetail.checkOutPlaceholder")}
            onChange={setCheckOutQrToken}
            onScan={(value) => void submitCheckOutQr(value)}
          />
          <Alert
            type="info"
            showIcon
            description={t("stationDetail.checkOutHelp")}
          />
        </Flex>
      </Modal>

      <Modal
        centered
        title={t("stationDetail.enterScore")}
        open={isScoreModalOpen}
        onCancel={() => setIsScoreModalOpen(false)}
        footer={null}>
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
                if (session.role !== "user") {
                  if (!station.progressId)
                    throw new Error(t("errors.progressUnavailable"));
                  try {
                    if (!values.reason?.trim())
                      throw new Error(t("errors.reasonRequired"));
                    await editAdminProgressScore(
                      station.progressId,
                      values.score,
                      values.reason.trim(),
                    );
                    await refreshAdminData();
                    message.success(t("stationDetail.completedSuccess"));
                    setIsScoreModalOpen(false);
                    navigate(adminStationListPath);
                    return;
                  } catch (error) {
                    message.error(
                      error instanceof Error ?
                        error.message
                      : t("stationDetail.scoreSubmissionFailed"),
                    );
                    throw error;
                  }
                }

                setIsSubmittingScore(true);
                try {
                  await executePlayerMutation(
                    () => submitStationScore(
                      station.stationId,
                      values.score,
                      values.reason,
                    ),
                    language,
                  );
                  message.success(t("stationDetail.completedSuccess"));
                  setIsScoreModalOpen(false);
                  await navigateAfterTeamStationFinished();
                } catch {
                  message.error(t("stationDetail.scoreSubmissionFailed"));
                } finally {
                  setIsSubmittingScore(false);
                }
              },
            });
          }}>
          <Form.Item
            label={t("stationDetail.inputScore")}
            name="score"
            initialValue={0}
            rules={[{required: true}]}>
            <InputNumber min={0} max={stationMaxPoints} className="full-width" />
          </Form.Item>
          <Form.Item label={t("stationDetail.reason")} name="reason">
            <Input.TextArea rows={2} placeholder={t("stationDetail.optionalNote")} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isSubmittingScore}>
            {t("stationDetail.saveScore")}
          </Button>
        </Form>
      </Modal>
    </Flex>
  );
}
