import {
  EditFilled,
  EditOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Tag,
  Typography,
  Descriptions,
} from "antd";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {STATUS_ORDER} from "../constants";
import {useMovementStore} from "../store";
import type {TeamStation} from "../types";
import {
  checkInStation,
  editAdminProgressScore,
  forceAdminProgressStatus,
  getPlayerFinal,
} from "../api";
import {QrTokenInput} from "../components/QrTokenInput";
import {fetchPlayerDatabase} from "../playerData";
import {fetchAdminDatabase} from "../adminData";
import {
  formatDateTime,
  getDisabledReason,
  getStationStatusColor,
} from "../utils";

type QuickEditFormValues = Pick<TeamStation, "status" | "score"> & {
  reason: string;
};

export function StationListPage() {
  const navigate = useNavigate();
  const {modal, message} = AntdApp.useApp();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const teamStations = useMovementStore((state) => state.teamStations);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const [editingStation, setEditingStation] = useState<TeamStation | null>(
    null,
  );
  const [scanTarget, setScanTarget] = useState<TeamStation | null>(null);
  const [checkInQrToken, setCheckInQrToken] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [isFinalReady, setIsFinalReady] = useState(false);
  const [quickEditForm] = Form.useForm<QuickEditFormValues>();

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
      <Alert
        className="active-team"
        type="warning"
        description={
          <>
            <Typography.Title level={4} className="section-title">
              {team.name}
            </Typography.Title>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Total Score">
                {team.score}
              </Descriptions.Item>
              <Descriptions.Item label="Finished">
                {team.finish}/{sortedStations.length}
              </Descriptions.Item>
            </Descriptions>
          </>
        }
      />

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
              <Card className="surface-card station-card">
                <div className="station-row">
                  <div className="full-width">
                    <Flex
                      gap={8}
                      justify="space-between"
                      align="center"
                      className="full-width">
                      <Typography.Title level={4} className="card-title">
                        {station.name}
                      </Typography.Title>
                      <Tag color={getStationStatusColor(station.status)}>
                        {station.status}
                      </Tag>
                    </Flex>
                    <Typography.Paragraph className="muted-copy compact-copy">
                      {station.description}
                    </Typography.Paragraph>

                    <Descriptions column={4} size="small">
                      <Descriptions.Item label="Playing Teams" span={3}>
                        {playingTeamCount(station.stationId)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Score">
                        {station.score}
                      </Descriptions.Item>
                      <Descriptions.Item label="Start Time" span={2}>
                        {formatDateTime(station.startTime)}
                      </Descriptions.Item>
                      <Descriptions.Item label="End Time" span={2}>
                        {formatDateTime(station.endTime)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Flex
                      justify="space-between"
                      gap={8}
                      className="full-width mt-4">
                      {station.youtubeUrl && (
                        <Button
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
                        type="primary"
                        icon={
                          session.role === "user" ?
                            <PlayCircleOutlined />
                          : <EditFilled />
                        }
                        onClick={() => handleStationClick(station)}>
                        {session.role === "user" ? "Play" : "View & Edit"}
                      </Button>
                    </Flex>
                  </div>

                  {session.role === "admin" && (
                    <Button
                      icon={<EditOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        quickEditForm.setFieldsValue({
                          status: station.status,
                          score: station.score,
                        });
                        setEditingStation(station);
                      }}>
                      Quick Update
                    </Button>
                  )}
                </div>
              </Card>
            </List.Item>
          );
        }}
      />

      <Drawer
        title="Quick Update Station"
        placement="bottom"
        open={Boolean(editingStation)}
        onClose={() => setEditingStation(null)}
        destroyOnHidden>
        <Form
          form={quickEditForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editingStation) {
              return;
            }

            modal.confirm({
              centered: true,
              title: "Confirm Station Update",
              content:
                "This change will be saved to the backend and recorded in the audit log.",
              okText: "Save",
              cancelText: "Cancel",
              onOk: async () => {
                if (!editingStation.progressId)
                  throw new Error("Progress record is unavailable");
                try {
                  if (values.status === "Finished") {
                    if (editingStation.backendStatus !== "COMPLETED") {
                      throw new Error(
                        "Complete check-out before assigning a finished score",
                      );
                    }
                    await editAdminProgressScore(
                      editingStation.progressId,
                      values.score,
                      values.reason,
                    );
                  } else {
                    await forceAdminProgressStatus(
                      editingStation.progressId,
                      values.status === "New" ? "AVAILABLE" : "PLAYING",
                      values.reason,
                    );
                  }
                  loadDatabase(await fetchAdminDatabase());
                  message.success("Station updated successfully");
                  setEditingStation(null);
                } catch (error) {
                  message.error(
                    error instanceof Error ?
                      error.message
                    : "Unable to update station",
                  );
                  throw error;
                }
              },
            });
          }}>
          <Form.Item label="Status" name="status" rules={[{required: true}]}>
            <Select
              options={[
                {label: "New", value: "New"},
                {label: "In Progress", value: "In Progress"},
                {label: "Finished", value: "Finished"},
              ]}
            />
          </Form.Item>
          <Form.Item label="Score" name="score" rules={[{required: true}]}>
            <InputNumber min={0} max={1000} className="full-width" />
          </Form.Item>
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{required: true, message: "Reason is required for audit"}]}>
            <Input placeholder="Reason for this admin change" maxLength={500} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            block>
            Save changes
          </Button>
        </Form>
      </Drawer>

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
