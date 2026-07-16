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
  InputNumber,
  Modal,
  Space,
  Typography,
} from "antd";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import {formatDateTime, formatDurationFromMs} from "../utils";

type ScoreFormValues = {
  score: number;
};

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
  const [adminForm] = Form.useForm<ScoreFormValues>();
  const [scoreForm] = Form.useForm<ScoreFormValues>();
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [isFinishScannerOpen, setIsFinishScannerOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

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
        onCancel={() => setIsFinishScannerOpen(false)}
        onOk={() => {
          setIsFinishScannerOpen(false);
          scoreForm.setFieldsValue({score: station.score});
          setIsScoreModalOpen(true);
        }}
        okText="Scan QR code successfully"
        cancelText="Close">
        <Alert
          type="info"
          showIcon
          description={
            <Flex vertical gap={4}>
              <Typography.Text strong>Camera mobile simulation</Typography.Text>
              <Typography.Text>
                After a successful scan, the app will prompt for score input
                before closing the game session.
              </Typography.Text>
            </Flex>
          }
        />
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
                "The score will be saved and the endTime will be updated according to the successful scan time.",
              okText: "Confirm",
              cancelText: "Cancel",
              onOk: () => {
                finishStation(activeTeamId, station.stationId, values.score);
                message.success("Station completed successfully");
                setIsScoreModalOpen(false);
                navigate("/stations");
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
          <Button type="primary" htmlType="submit" block>
            Save Score
          </Button>
        </Form>
      </Modal>
    </Flex>
  );
}
