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
  getPlayerDashboard,
  getPlayerProgress,
  getPlayerStations,
  submitStationScore,
  type PlayerProgressResponse,
  type PlayerStationResponse,
} from "../api";
import {QrTokenInput} from "../components/QrTokenInput";

type ScoreFormValues = {
  score: number;
  confirmationCode: string;
  reason?: string;
};

function mapProgressStatus(status: PlayerProgressResponse["status"]) {
  if (status === "COMPLETED") return "Finish" as const;
  if (status === "PLAYING" || status === "CHECKED_IN") return "In Progress" as const;
  return "New" as const;
}

function buildPlayerSeed(
  stations: PlayerStationResponse[],
  dashboardTeam: Awaited<ReturnType<typeof getPlayerDashboard>>["team"],
) {
  const teamId = String(dashboardTeam.id);
  return {
    activeTeamId: teamId,
    teams: [
      {
        id: teamId,
        name: dashboardTeam.name,
        username: dashboardTeam.username ?? `team${dashboardTeam.id}`,
        password: "",
        score: dashboardTeam.totalPoints,
        finish: 0,
        totalTimeMinutes: Math.round(dashboardTeam.totalPlaySeconds / 60),
      },
    ],
    stationDefinitions: stations.map((station) => ({
      id: station.id,
      name: station.name,
      description: station.description ?? station.game?.clueText ?? null,
      durationMinutes: 0,
      trackingMode: station.trackingMode ?? "BOTH",
      youtubeUrl: station.game?.mediaUrl ?? null,
      markerX: station.mapX,
      markerY: station.mapY,
    })),
    teamStations: {
      [teamId]: stations.map((station) => ({
        id: `${teamId}-${station.id}`,
        name: station.name,
        status: mapProgressStatus(station.progress?.status ?? "AVAILABLE"),
        description: station.description ?? station.game?.clueText ?? null,
        durationMinutes: 0,
        trackingMode: station.trackingMode ?? "BOTH",
        youtubeUrl: station.game?.mediaUrl ?? null,
        score: station.progress?.scoreAchieved ?? station.game?.maxPoints ?? 0,
        startTime: station.progress?.checkedInAt ?? null,
        endTime: station.progress?.completedAt ?? station.progress?.checkedOutAt ?? null,
        teamId,
        stationId: station.id,
      })),
    },
  };
}

export function StationDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{stationId: string}>();
  const {modal, message} = AntdApp.useApp();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const teamStations = useMovementStore((state) => state.teamStations);
  const finishStation = useMovementStore((state) => state.finishStation);
  const resetStation = useMovementStore((state) => state.resetStation);
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

  const openLinkInNewTab = (url: string | undefined) => {
    if (!url) {
      message.warning("Không có link video");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const refreshPlayerData = async () => {
    const [dashboard, stations, progress] = await Promise.all([
      getPlayerDashboard(),
      getPlayerStations(),
      getPlayerProgress(),
    ]);
    const progressByStation = new Map(progress.map((item) => [item.stationId, item]));
    loadDatabase(
      buildPlayerSeed(
        stations.map((item) => ({
          ...item,
          progress: progressByStation.get(item.id) ?? item.progress,
        })),
        dashboard.team,
      ),
    );
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
            2
          </Descriptions.Item>
          <Descriptions.Item label="Estimated Duration">
            {station.durationMinutes ? `${station.durationMinutes} minutes` : "N/A"}
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
              Finish
            </Button>
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
                onOk: () => {
                  finishStation(activeTeamId, station.stationId, values.score);
                  message.success("Score saved successfully");
                  navigate("/stations");
                },
              });
            }}>
            <Form.Item
              label="Input Score"
              name="score"
              rules={[{required: true}]}>
              <InputNumber min={0} max={1000} className="full-width" />
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
                    onOk: () => {
                      resetStation(activeTeamId, station.stationId);
                      message.success("Status reset successfully");
                      navigate("/stations");
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
            if (station.trackingMode === "TIME") {
              finishStation(activeTeamId, station.stationId, 0);
              message.success("Time-only station completed");
              navigate("/stations");
              return;
            }
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
              navigate("/stations");
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
                  finishStation(activeTeamId, station.stationId, values.score);
                  message.success("Station completed successfully");
                  setIsScoreModalOpen(false);
                  navigate("/stations");
                  return;
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
                  navigate("/stations");
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
            <InputNumber min={0} max={1000} className="full-width" />
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
