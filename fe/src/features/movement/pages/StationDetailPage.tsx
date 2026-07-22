import {
  CheckCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Typography,
} from "antd";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import {formatDateTime, formatDurationFromMs} from "../utils";
import {
  checkOutStation,
  cancelPlayerStation,
  submitCipherAnswer,
  editAdminProgressScore,
  forceAdminProgressStatus,
  getPlayerFinal,
  reopenAdminProgress,
  submitAdminProgressScore,
  submitStationScore,
} from "../api";
import {QrTokenInput} from "../components/QrTokenInput";
import {fetchPlayerDatabase} from "../playerData";
import {fetchAdminDatabase} from "../adminData";
import {DEFAULT_STATION_MAX_POINTS} from "../constants";

type ScoreFormValues = {
  score: number;
  confirmationCode: string;
  reason?: string;
};

export function StationDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{stationId: string}>();
  const {modal, message} = AntdApp.useApp();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
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

  const team = teams.find((item) => item.id === activeTeamId);
  const station = (teamStations[activeTeamId] ?? []).find(
    (item) => item.stationId === params.stationId,
  );
  const stationStartTime = station?.startTime ?? null;
  const playingTeamCount = station
    ? Object.values(teamStations).filter((stations) =>
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
      navigate(final.isOpen && !final.blockedByActiveStation ? "/final" : "/stations");
    } catch {
      navigate("/stations");
    }
  };

  return (
    <Flex vertical gap={16} className="full-width">
      <Card className="surface-card compact-card">
        <Typography.Title level={3} className="section-title">
          {station.name}
        </Typography.Title>
        <Typography.Paragraph>
          {station.description}
        </Typography.Paragraph>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Playing Teams" span={2}>
            {playingTeamCount}
          </Descriptions.Item>
          <Descriptions.Item label="Score">{station.score}</Descriptions.Item>
          <Descriptions.Item label="Start Time">
            {formatDateTime(station.startTime)}
          </Descriptions.Item>
          <Descriptions.Item label="End Time">
            {formatDateTime(station.endTime)}
          </Descriptions.Item>
        </Descriptions>

        {station.youtubeUrl && (
          <Button
            type="primary"
            className="full-width mt-4"
            icon={<YoutubeOutlined />}
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
            {station.gameType === "CIPHER" && (
              <Button onClick={() => {
                const answer = window.prompt("Enter cipher answer");
                if (answer) void submitCipherAnswer(station.stationId, answer)
                  .then(() => message.success("Cipher answer accepted"))
                  .catch((error: unknown) => message.error(error instanceof Error ? error.message : "Wrong answer"));
              }}>Submit Cipher</Button>
            )}
            <Button danger icon={<ReloadOutlined />} onClick={async () => {
              try {
                await cancelPlayerStation(station.stationId);
                await refreshPlayerData();
                message.success("Station cancelled; cooldown applied");
                navigate("/stations/map");
              } catch (error) {
                message.error(error instanceof Error ? error.message : "Cancel failed");
              }
            }}>Cancel Station</Button>
          </Flex>
        </Card>
      : <Card className="surface-card">
          <Form
            form={adminForm}
            layout="vertical"
            onFinish={(values) => {
              modal.confirm({
                centered: true,
                title: "Save Score?",
                content:
                  "The score and endTime will be updated to the current time.",
                okText: "Save",
                cancelText: "Cancel",
                onOk: async () => {
                  if (!station.progressId) throw new Error("Progress record is unavailable");
                  try {
                    if (station.backendStatus === "COMPLETED") {
                      if (!values.reason?.trim()) throw new Error("Reason is required when editing score");
                      await editAdminProgressScore(station.progressId, values.score, values.reason.trim());
                    } else {
                      await submitAdminProgressScore(station.progressId, values.score, values.reason?.trim());
                    }
                    await refreshAdminData();
                    message.success("Score saved successfully");
                    navigate("/stations");
                  } catch (error) {
                    message.error(error instanceof Error ? error.message : "Unable to save score");
                    throw error;
                  }
                },
              });
            }}>
            <Form.Item
              label="Input Score"
              name="score"
              rules={[{required: true}]}>
              <InputNumber min={0} max={stationMaxPoints} className="full-width" />
            </Form.Item>
            <Form.Item label="Reason" name="reason" rules={[{required: station.backendStatus === "COMPLETED"}]}>
              <Input.TextArea rows={2} placeholder="Required when editing an existing score" />
            </Form.Item>
            <Space className="full-width" size={12}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save
              </Button>
              <Button
                danger
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
                      if (!station.progressId) throw new Error("Progress record is unavailable");
                      try {
                        const reason = "Reset by admin from station detail";
                        if (station.backendStatus === "COMPLETED") {
                          await reopenAdminProgress(station.progressId, reason);
                        } else {
                          await forceAdminProgressStatus(station.progressId, "AVAILABLE", reason);
                        }
                        await refreshAdminData();
                        message.success("Status reset successfully");
                        navigate("/stations");
                      } catch (error) {
                        message.error(error instanceof Error ? error.message : "Unable to reset status");
                        throw error;
                      }
                    },
                  });
                }}>
                Reset Status
              </Button>
            </Space>
          </Form>
        </Card>
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
              confirmationCode: "",
              reason: "",
            });
            setIsScoreModalOpen(true);
          } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : "Check-out failed");
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
            description="After a valid check-out QR, staff can enter score and confirmation code on this team device."
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
              content:
                "The score will be submitted with the staff confirmation code.",
              okText: "Confirm",
              cancelText: "Cancel",
              onOk: async () => {
                if (session.role !== "user") {
                  if (!station.progressId) throw new Error("Progress record is unavailable");
                  try {
                    if (station.backendStatus === "COMPLETED") {
                      if (!values.reason?.trim()) throw new Error("Reason is required when editing score");
                      await editAdminProgressScore(station.progressId, values.score, values.reason.trim());
                    } else {
                      await submitAdminProgressScore(station.progressId, values.score, values.reason?.trim());
                    }
                    await refreshAdminData();
                    message.success("Station completed successfully");
                    setIsScoreModalOpen(false);
                    navigate("/stations");
                    return;
                  } catch (error) {
                    message.error(error instanceof Error ? error.message : "Unable to submit score");
                    throw error;
                  }
                }

                setIsSubmittingScore(true);
                try {
                  await submitStationScore(
                    station.stationId,
                    values.score,
                    values.confirmationCode,
                    values.reason,
                  );
                  await refreshPlayerData();
                  message.success("Station completed successfully");
                  setIsScoreModalOpen(false);
                  await navigateAfterTeamStationFinished();
                } catch (error: unknown) {
                  message.error(
                    error instanceof Error ? error.message : "Score submission failed",
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
          <Form.Item
            label="Confirmation Code"
            name="confirmationCode"
            rules={[{required: session.role === "user"}]}>
            <Input.Password placeholder="Staff confirmation code" />
          </Form.Item>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea rows={2} placeholder="Optional note" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={isSubmittingScore}>
            Save Score
          </Button>
        </Form>
      </Modal>
    </Flex>
  );
}
