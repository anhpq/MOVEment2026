import {EditOutlined, DeleteOutlined} from "@ant-design/icons";
import {App as AntdApp, Button, Card, Flex, List, Tabs, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import {StationsMapPanel} from "../components/StationsMapPanel";
import {useMovementStore} from "../store";

export function SystemConfigPage() {
  const navigate = useNavigate();
  const {modal, message} = AntdApp.useApp();
  const stationDefinitions = useMovementStore(
    (state) => state.stationDefinitions,
  );
  const teams = useMovementStore((state) => state.teams);
  const totalStations = useMovementStore(
    (state) => state.stationDefinitions.length,
  );
  const deleteStationDefinition = useMovementStore(
    (state) => state.deleteStationDefinition,
  );
  const deleteTeam = useMovementStore((state) => state.deleteTeam);

  return (
    <Tabs
      defaultActiveKey="stations"
      items={[
        {
          key: "stations",
          label: "Station list (" + stationDefinitions.length + ")",
          children: (
            <Flex vertical gap={16} className="full-width">
              <Button
                type="primary"
                onClick={() => navigate("/system-config/stations/new")}>
                Add new Station
              </Button>
              <List
                className="card-list"
                dataSource={stationDefinitions}
                renderItem={(station) => (
                  <List.Item>
                    <Card className="surface-card station-card">
                      <div className="station-row">
                        <Flex vertical gap={4}>
                          <Typography.Title level={4} className="card-title">
                            {station.name}
                          </Typography.Title>
                          <Typography.Text className="muted-copy compact-copy">
                            {station.id}
                          </Typography.Text>
                          <Typography.Text className="muted-copy compact-copy">
                            {station.description}
                          </Typography.Text>
                        </Flex>
                        <Flex gap={8} className="full-width">
                          <Button
                            icon={<EditOutlined />}
                            onClick={() =>
                              navigate(`/system-config/stations/${station.id}`)
                            }>
                            Edit
                          </Button>
                          <Button
                            color="danger"
                            variant="filled"
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              modal.confirm({
                                centered: true,
                                title: "Delete station?",
                                content:
                                  "All progress for this station will be removed from the dummy data.",
                                okText: "Delete",
                                cancelText: "Cancel",
                                onOk: () => {
                                  deleteStationDefinition(station.id);
                                  message.success(
                                    "Station deleted successfully",
                                  );
                                },
                              });
                            }}>
                            Delete
                          </Button>
                        </Flex>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            </Flex>
          ),
        },
        {
          key: "teams",
          label: "Team list (" + teams.length + ")",
          children: (
            <Flex vertical gap={16} className="full-width">
              <Button
                type="primary"
                onClick={() => navigate("/system-config/teams/new")}>
                Add new Team
              </Button>
              <List
                className="card-list"
                dataSource={teams}
                renderItem={(team) => (
                  <List.Item>
                    <Card className="surface-card station-card">
                      <div className="station-row">
                        <Flex vertical gap={4}>
                          <Typography.Title level={4} className="card-title">
                            {team.name}
                          </Typography.Title>
                          <Typography.Text className="muted-copy compact-copy">
                            {team.id} · Score {team.score}
                          </Typography.Text>
                          <Typography.Text className="muted-copy compact-copy">
                            Finish {team.finish}/{totalStations} in{" "}
                            {team.totalTimeMinutes} min
                          </Typography.Text>
                        </Flex>
                        <Flex gap={8} className="full-width">
                          <Button
                            icon={<EditOutlined />}
                            onClick={() =>
                              navigate(`/system-config/teams/${team.id}`)
                            }>
                            Edit
                          </Button>
                          <Button
                            color="danger"
                            variant="filled"
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              modal.confirm({
                                centered: true,
                                title: "Delete team?",
                                content:
                                  "Team will be removed from the system and all progress will be lost.",
                                okText: "Delete",
                                cancelText: "Cancel",
                                onOk: () => {
                                  deleteTeam(team.id);
                                  message.success("Team deleted successfully");
                                },
                              });
                            }}>
                            Delete
                          </Button>
                        </Flex>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            </Flex>
          ),
        },
        {
          key: "map",
          label: "Map",
          children: <StationsMapPanel editable />,
        },
      ]}
    />
  );
}
