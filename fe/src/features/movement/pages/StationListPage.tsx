import {EditOutlined, SaveOutlined, YoutubeOutlined} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Form,
  InputNumber,
  List,
  Modal,
  Select,
  Tag,
  Typography,
  Descriptions,
} from "antd";
import find from "lodash/find";
import sortBy from "lodash/sortBy";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {STATUS_ORDER} from "../constants";
import {useMovementStore} from "../store";
import type {TeamStation} from "../types";
import {
  formatDateTime,
  getDisabledReason,
  getStationStatusColor,
} from "../utils";

type QuickEditFormValues = Pick<TeamStation, "status" | "score">;

export function StationListPage() {
  const navigate = useNavigate();
  const {modal, message} = AntdApp.useApp();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const teamStations = useMovementStore((state) => state.teamStations);
  const startStation = useMovementStore((state) => state.startStation);
  const patchTeamStation = useMovementStore((state) => state.patchTeamStation);
  const [editingStation, setEditingStation] = useState<TeamStation | null>(
    null,
  );
  const [scanTarget, setScanTarget] = useState<TeamStation | null>(null);
  const [quickEditForm] = Form.useForm<QuickEditFormValues>();

  const team = teams.find((item) => item.id === activeTeamId);
  const sortedStations = sortBy(teamStations[activeTeamId] ?? [], [
    (station) => STATUS_ORDER[station.status],
    (station) => station.name,
  ]);
  const activeStation = find(
    sortedStations,
    (station) => station.status === "In Progress",
  );

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

    setScanTarget(station);
  };

  const openLinkInNewTab = (url: string) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  return (
    <Flex vertical gap={16} className="full-width">
      <Alert
        type="info"
        description={
          <>
            <Typography.Title level={4} className="section-title">
              {team.name}
            </Typography.Title>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Total Score">
                {team.score}
              </Descriptions.Item>
              <Descriptions.Item label="Finish">
                {team.finish}/{sortedStations.length}
              </Descriptions.Item>
            </Descriptions>
          </>
        }
      />

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

                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="Playing Teams" span={2}>
                        2
                      </Descriptions.Item>
                      <Descriptions.Item label="Estimated Duration">
                        {station.duration ?
                          `${station.duration} minutes`
                        : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Score">
                        {station.score}
                      </Descriptions.Item>
                      <Descriptions.Item label="Start Time">
                        {formatDateTime(station.startTime)}
                      </Descriptions.Item>
                      <Descriptions.Item label="End Time">
                        {formatDateTime(station.endTime)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Flex
                      justify="space-between"
                      gap={8}
                      className="full-width mt-4">
                      {station.youtubeUrl && (
                        <Button
                          severity="primary"
                          icon={<YoutubeOutlined />}
                          onClick={() => openLinkInNewTab(station.youtubeUrl)}>
                          Watch Video
                        </Button>
                      )}
                      <Button
                        type="primary"
                        onClick={() => handleStationClick(station)}>
                        {session.role === "user" ? "Play" : "Edit"}
                      </Button>
                    </Flex>
                  </div>

                  {(session.role === "admin" ||
                    session.role === "system-admin") && (
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
                "This change will overwrite the current dummy data status.",
              okText: "Save",
              cancelText: "Cancel",
              onOk: () => {
                const now = new Date().toISOString();
                patchTeamStation(
                  editingStation.teamId,
                  editingStation.stationId,
                  {
                    status: values.status,
                    score: values.score,
                    startTime:
                      values.status === "New" ?
                        null
                      : (editingStation.startTime ?? now),
                    endTime:
                      values.status === "Finish" ?
                        (editingStation.endTime ?? now)
                      : null,
                  },
                );
                message.success("Station updated successfully");
                setEditingStation(null);
              },
            });
          }}>
          <Form.Item label="Status" name="status" rules={[{required: true}]}>
            <Select
              options={[
                {label: "New", value: "New"},
                {label: "In Progress", value: "In Progress"},
                {label: "Finish", value: "Finish"},
              ]}
            />
          </Form.Item>
          <Form.Item label="Score" name="score" rules={[{required: true}]}>
            <InputNumber min={0} max={1000} className="full-width" />
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
        onCancel={() => setScanTarget(null)}
        onOk={() => {
          if (!scanTarget) {
            return;
          }

          startStation(scanTarget.teamId, scanTarget.stationId);
          message.success("Scan QR code successfully");
          const stationId = scanTarget.stationId;
          setScanTarget(null);
          navigate(`/stations/${stationId}`);
        }}
        okText="Scan QR code successfully"
        cancelText="Close">
        <Flex vertical gap={12} className="full-width">
          <Typography.Text>
            Simulate phone camera for station{" "}
            <strong>{scanTarget?.name}</strong>.
          </Typography.Text>
          <Alert
            type="success"
            showIcon
            description={
              <Flex vertical gap={4}>
                <Typography.Text strong>User Flow</Typography.Text>
                <Typography.Text>
                  After a successful scan, the status will change to In Progress
                  and navigate to the Station Detail screen.
                </Typography.Text>
              </Flex>
            }
          />
        </Flex>
      </Modal>
    </Flex>
  );
}
