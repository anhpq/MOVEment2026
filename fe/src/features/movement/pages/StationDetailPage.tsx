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
  YoutubeOutlined,
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
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import {
  formatDateTime,
  formatDurationFromMs,
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
import {fetchPlayerDatabase} from "../playerData";
import {fetchAdminDatabase} from "../adminData";
import {DEFAULT_STATION_MAX_POINTS} from "../constants";
import "./StationDetailPage.css";

type ScoreFormValues = {
  score: number;
  reason?: string;
};

export function StationDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{teamId?: string; stationId: string}>();
  const {modal, message} = AntdApp.useApp();
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
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

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
  const playingTeamCount =
    station ?
      Object.values(teamStations).filter((stations) =>
        stations.some(
          (item) =>
            item.stationId === station.stationId &&
            (item.backendStatus === "CHECKED_IN" ||
              item.backendStatus === "PLAYING"),
        ),
      ).length
    : 0;
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
        <Empty description="Không tìm thấy trạm" />
      </Card>
    );
  }

  const stationMaxPoints = station.maxPoints ?? DEFAULT_STATION_MAX_POINTS;
  const canAdminEditScore =
    session.role === "admin" &&
    station.backendStatus === "COMPLETED" &&
    Boolean(station.progressId);

  const openLinkInNewTab = (url: string | undefined) => {
    if (!url) {
      message.warning("Không có link video");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const refreshPlayerData = async () => {
    loadDatabase(await fetchPlayerDatabase());
  };

  const refreshAdminData = async () => {
    loadDatabase(await fetchAdminDatabase());
  };

  const navigateAfterTeamStationFinished = async () => {
    try {
      const final = await getPlayerFinal();
      navigate(
        final.isOpen && !final.blockedByActiveStation ? "/final" : "/stations",
      );
    } catch {
      navigate("/stations");
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
                {station.status}
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
              <small>Playing Teams</small>
              <strong>{playingTeamCount}</strong>
            </span>
          </div>
          <div className="station-detail-stat">
            <span className="station-detail-stat-icon">
              <StarFilled />
            </span>
            <span>
              <small>Score</small>
              <strong>{station.score}</strong>
            </span>
          </div>
          <div className="station-detail-stat">
            <span className="station-detail-stat-icon">
              <PlayCircleFilled />
            </span>
            <span>
              <small>Start Time</small>
              <strong>{formatDateTime(station.startTime)}</strong>
            </span>
          </div>
          <div className="station-detail-stat">
            <span className="station-detail-stat-icon">
              <FlagOutlined />
            </span>
            <span>
              <small>End Time</small>
              <strong>{formatDateTime(station.endTime)}</strong>
            </span>
          </div>
        </div>

        {station.gameType === "ST" && station.youtubeUrl && (
          <Button
            type="primary"
            className="full-width mt-4"
            icon={<YoutubeOutlined />}
            disabled={!station.youtubeUrl}
            onClick={() => openLinkInNewTab(station.youtubeUrl ?? undefined)}>
            Watch Video
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
            <Button
              type="primary"
              size="large"
              shape="round"
              icon={<CheckCircleOutlined />}
              onClick={() => setIsFinishScannerOpen(true)}>
              Finished
            </Button>
            <Button
              danger
              icon={<ReloadOutlined />}
              onClick={async () => {
                try {
                  await cancelPlayerStation(station.stationId);
                  await refreshPlayerData();
                  message.success("Station cancelled; cooldown applied");
                  navigate("/stations/map");
                } catch (error) {
                  message.error(
                    error instanceof Error ? error.message : "Cancel failed",
                  );
                }
              }}>
              Cancel Station
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
                <Typography.Title level={3}>Score adjustment</Typography.Title>
                <Typography.Text>
                  Update this team&apos;s score for the current Station.
                </Typography.Text>
              </div>
            </header>
            <Form
              form={adminForm}
              layout="vertical"
              onFinish={(values) => {
                modal.confirm({
                  centered: true,
                  title: "Save Score?",
                  content:
                    "Only the score will be updated. Status and timestamps will remain unchanged.",
                  okText: "Save",
                  cancelText: "Cancel",
                  onOk: async () => {
                    if (!station.progressId)
                      throw new Error("Progress record is unavailable");
                    try {
                      if (!values.reason?.trim())
                        throw new Error("Reason is required");
                      await editAdminProgressScore(
                        station.progressId,
                        values.score,
                        values.reason.trim(),
                      );
                      await refreshAdminData();
                      message.success("Score saved successfully");
                      navigate(adminStationListPath);
                    } catch (error) {
                      message.error(
                        error instanceof Error ?
                          error.message
                        : "Unable to save score",
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
                  description="Score correction is available only after this Station is completed."
                />
              )}
              <Form.Item
                label="Input Score"
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
                label="Reason"
                name="reason"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Reason is required",
                  },
                ]}>
                <Input.TextArea
                  rows={2}
                  disabled={!canAdminEditScore}
                  placeholder="Required for every Admin score change"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!canAdminEditScore}
                icon={<SaveOutlined />}>
                Save score
              </Button>
            </Form>
          </Card>

          <Card className="surface-card station-admin-reset-card">
            <header className="station-admin-tool-heading danger">
              <span className="station-admin-tool-icon">
                <WarningOutlined />
              </span>
              <div>
                <Typography.Title level={3}>Status reset</Typography.Title>
                <Typography.Text>
                  Return this Station to New and clear its start/end time.
                </Typography.Text>
              </div>
            </header>
            <Alert
              type="warning"
              showIcon
              description="This action changes progress state and cannot be undone from this screen."
            />
            <Button
              danger
              className="station-reset-button"
              icon={<ReloadOutlined />}
              onClick={() => {
                modal.confirm({
                  centered: true,
                  title: "Reset status?",
                  content:
                    "The status will revert to New and start/end time will be cleared.",
                  okText: "Reset",
                  cancelText: "Cancel",
                  onOk: async () => {
                    if (!station.progressId)
                      throw new Error("Progress record is unavailable");
                    try {
                      const reason = "Reset by admin from station detail";
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
                      message.success("Status reset successfully");
                      navigate(adminStationListPath);
                    } catch (error) {
                      message.error(
                        error instanceof Error ?
                          error.message
                        : "Unable to reset status",
                      );
                      throw error;
                    }
                  },
                });
              }}>
              Reset status
            </Button>
          </Card>
        </div>
      }

      <Modal
        centered
        title="Scan QR to Complete Station"
        open={isFinishScannerOpen}
        onCancel={() => {
          setCheckOutQrToken("");
          setIsFinishScannerOpen(false);
        }}
        onOk={async () => {
          if (session.role !== "user") {
            setIsFinishScannerOpen(false);
            scoreForm.setFieldsValue({score: station.score});
            setIsScoreModalOpen(true);
            return;
          }

          if (!checkOutQrToken.trim()) {
            message.warning("Please enter or scan the check-out QR token");
            return;
          }

          setIsSubmittingCheckOut(true);
          try {
            await checkOutStation(station.stationId, checkOutQrToken.trim());
            await refreshPlayerData();
            message.success("Check-out QR accepted");
            setCheckOutQrToken("");
            setIsFinishScannerOpen(false);
            if (station.trackingMode === "TIME") {
              message.success("Time-only station completed");
              await navigateAfterTeamStationFinished();
              return;
            }

            scoreForm.setFieldsValue({
              score: station.score,
              reason: "",
            });
            setIsScoreModalOpen(true);
          } catch (error: unknown) {
            message.error(
              error instanceof Error ? error.message : "Check-out failed",
            );
          } finally {
            setIsSubmittingCheckOut(false);
          }
        }}
        confirmLoading={isSubmittingCheckOut}
        okText="Submit check-out QR"
        cancelText="Close">
        <Flex vertical gap={12}>
          <QrTokenInput
            value={checkOutQrToken}
            placeholder="Check-out QR token"
            onChange={setCheckOutQrToken}
          />
          <Alert
            type="info"
            showIcon
            description="After a valid check-out QR, score can be entered on this team device."
          />
        </Flex>
      </Modal>

      <Modal
        centered
        title="Enter Score"
        open={isScoreModalOpen}
        onCancel={() => setIsScoreModalOpen(false)}
        footer={null}>
        <Form
          form={scoreForm}
          layout="vertical"
          onFinish={(values) => {
            modal.confirm({
              centered: true,
              title: "Confirm Station Completion",
              content: "The score will be submitted for this Station.",
              okText: "Confirm",
              cancelText: "Cancel",
              onOk: async () => {
                if (session.role !== "user") {
                  if (!station.progressId)
                    throw new Error("Progress record is unavailable");
                  try {
                    if (!values.reason?.trim())
                      throw new Error("Reason is required");
                    await editAdminProgressScore(
                      station.progressId,
                      values.score,
                      values.reason.trim(),
                    );
                    await refreshAdminData();
                    message.success("Station completed successfully");
                    setIsScoreModalOpen(false);
                    navigate(adminStationListPath);
                    return;
                  } catch (error) {
                    message.error(
                      error instanceof Error ?
                        error.message
                      : "Unable to submit score",
                    );
                    throw error;
                  }
                }

                setIsSubmittingScore(true);
                try {
                  await submitStationScore(
                    station.stationId,
                    values.score,
                    values.reason,
                  );
                  await refreshPlayerData();
                  message.success("Station completed successfully");
                  setIsScoreModalOpen(false);
                  await navigateAfterTeamStationFinished();
                } catch (error: unknown) {
                  message.error(
                    error instanceof Error ?
                      error.message
                    : "Score submission failed",
                  );
                } finally {
                  setIsSubmittingScore(false);
                }
              },
            });
          }}>
          <Form.Item
            label="Input Score"
            name="score"
            initialValue={0}
            rules={[{required: true}]}>
            <InputNumber min={0} max={stationMaxPoints} className="full-width" />
          </Form.Item>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea rows={2} placeholder="Optional note" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isSubmittingScore}>
            Save Score
          </Button>
        </Form>
      </Modal>
    </Flex>
  );
}
