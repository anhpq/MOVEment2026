import {
  DeleteOutlined,
  EditOutlined,
  QrcodeOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Button,
  Card,
  Flex,
  Input,
  List,
  Select,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {fetchAdminDatabase} from "../adminData";
import {
  deleteAdminStation,
  deleteAdminTeam,
  generateAdminTeamQrLoginToken,
  getAdminStationQrTokens,
  getAdminTeamQrLoginTokens,
  revokeAdminQrLoginToken,
  revokeAdminStationQrToken,
  rotateAdminStationQrToken,
  rotateAdminTeamQrLoginToken,
  updateAdminStation,
} from "../api";
import {StationsMapPanel} from "../components/StationsMapPanel";
import {useMovementStore} from "../store";
import type {StationTrackingMode} from "../types";

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
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const [qrBusyTeamId, setQrBusyTeamId] = useState<string | null>(null);
  const [qrBusyStationId, setQrBusyStationId] = useState<string | null>(null);

  const handleTrackingModeChange = async (
    station: (typeof stationDefinitions)[number],
    trackingMode: StationTrackingMode,
  ) => {
    await updateAdminStation(station.id, {trackingMode});
    loadDatabase(await fetchAdminDatabase());
    message.success("Station tracking mode updated");
  };

  const handleIssueQrLogin = async (
    team: (typeof teams)[number],
    rotate: boolean,
  ) => {
    setQrBusyTeamId(team.id);
    try {
      const token =
        rotate ?
          await rotateAdminTeamQrLoginToken(team.id)
        : await generateAdminTeamQrLoginToken(team.id);
      modal.info({
        centered: true,
        width: 680,
        title: `QR login for ${team.name}`,
        content: (
          <Flex vertical gap={12}>
            <Typography.Text>
              This reusable URL is shown only now. Rotate the token when a new
              QR is required.
            </Typography.Text>
            <Input.TextArea
              value={token.qrLoginUrl ?? token.loginUrl}
              readOnly
              autoSize
            />
            <Typography.Text className="muted-copy compact-copy">
              Expires at {new Date(token.expiresAt).toLocaleString("vi-VN")}
            </Typography.Text>
          </Flex>
        ),
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to issue QR login",
      );
    } finally {
      setQrBusyTeamId(null);
    }
  };

  const handleShowQrStatus = async (team: (typeof teams)[number]) => {
    setQrBusyTeamId(team.id);
    try {
      const tokens = await getAdminTeamQrLoginTokens(team.id);
      modal.info({
        centered: true,
        width: 720,
        title: `QR login status for ${team.name}`,
        content: (
          <List
            dataSource={tokens.slice(0, 5)}
            locale={{emptyText: "No QR login tokens generated"}}
            renderItem={(token) => (
              <List.Item>
                <Flex vertical gap={4} className="full-width">
                  <Flex justify="space-between" align="center">
                    <Typography.Text>#{token.id}</Typography.Text>
                    <Tag>{token.status}</Tag>
                  </Flex>
                  <Typography.Text className="muted-copy compact-copy">
                    Expires {new Date(token.expiresAt).toLocaleString("vi-VN")}{" "}
                    · Uses {token.usageCount}
                  </Typography.Text>
                </Flex>
              </List.Item>
            )}
          />
        ),
      });
    } catch (error) {
      message.error(
        error instanceof Error ?
          error.message
        : "Unable to load QR login status",
      );
    } finally {
      setQrBusyTeamId(null);
    }
  };

  const handleRevokeActiveQr = async (team: (typeof teams)[number]) => {
    setQrBusyTeamId(team.id);
    try {
      const tokens = await getAdminTeamQrLoginTokens(team.id);
      const activeToken = tokens.find((token) => token.status === "ACTIVE");
      if (!activeToken) {
        message.info("No active QR login token to revoke");
        return;
      }
      await revokeAdminQrLoginToken(activeToken.id);
      message.success("QR login token revoked");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to revoke QR login",
      );
    } finally {
      setQrBusyTeamId(null);
    }
  };

  const handleShowStationQrStatus = async (
    station: (typeof stationDefinitions)[number],
  ) => {
    setQrBusyStationId(station.id);
    try {
      const tokens = await getAdminStationQrTokens(station.id);
      modal.info({
        centered: true,
        width: 720,
        title: `Station QR status for ${station.name}`,
        content: (
          <List
            dataSource={tokens}
            locale={{emptyText: "No Station QR tokens generated"}}
            renderItem={(token) => (
              <List.Item>
                <Flex vertical gap={4} className="full-width">
                  <Flex justify="space-between" align="center">
                    <Typography.Text>{token.purpose}</Typography.Text>
                    <Tag>{token.status}</Tag>
                  </Flex>
                  <Typography.Text className="muted-copy compact-copy">
                    {token.schemaVersion} · #{token.id}
                  </Typography.Text>
                </Flex>
              </List.Item>
            )}
          />
        ),
      });
    } catch (error) {
      message.error(
        error instanceof Error ?
          error.message
        : "Unable to load Station QR status",
      );
    } finally {
      setQrBusyStationId(null);
    }
  };

  const handleRotateStationQr = async (
    station: (typeof stationDefinitions)[number],
    purpose: "CHECK_IN" | "CHECK_OUT",
  ) => {
    setQrBusyStationId(station.id);
    try {
      const token = await rotateAdminStationQrToken(station.id, purpose);
      modal.info({
        centered: true,
        width: 680,
        title: `${purpose} QR for ${station.name}`,
        content: (
          <Flex vertical gap={12}>
            <Typography.Text>
              This Station QR token is shown only now. Rotate this purpose to
              reprint later.
            </Typography.Text>
            <Input.TextArea value={token.rawToken} readOnly autoSize />
          </Flex>
        ),
      });
      loadDatabase(await fetchAdminDatabase());
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to rotate Station QR",
      );
    } finally {
      setQrBusyStationId(null);
    }
  };

  const handleRevokeStationQr = async (
    station: (typeof stationDefinitions)[number],
    purpose: "CHECK_IN" | "CHECK_OUT",
  ) => {
    setQrBusyStationId(station.id);
    try {
      await revokeAdminStationQrToken(station.id, purpose);
      message.success(`${purpose} QR revoked`);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to revoke Station QR",
      );
    } finally {
      setQrBusyStationId(null);
    }
  };

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
                        <Flex
                          vertical
                          gap={4}
                          className="station-content full-width">
                          <Flex gap={8} className="full-width">
                            <Typography.Title level={4} className="card-title full-width">
                              {station.name}
                            </Typography.Title>
                            <Button
                              shape="circle"
                              variant="filled"
                              className="delete-icon-button"
                              icon={<EditOutlined />}
                              onClick={() =>
                                navigate(
                                  `/system-config/stations/${station.id}`,
                                )
                              }></Button>

                            <Button
                              shape="circle"
                              color="danger"
                              variant="filled"
                              className="delete-icon-button"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                modal.confirm({
                                  centered: true,
                                  title: "Delete station?",
                                  content:
                                    "The station and its QR tokens will be deactivated. Historical progress is retained.",
                                  okText: "Delete",
                                  cancelText: "Cancel",
                                  onOk: async () => {
                                    await deleteAdminStation(station.id);
                                    loadDatabase(await fetchAdminDatabase());
                                    message.success(
                                      "Station deactivated successfully",
                                    );
                                  },
                                });
                              }}></Button>
                          </Flex>
                          <Typography.Text className="muted-copy compact-copy">
                            {station.id}
                          </Typography.Text>
                          <Typography.Text className="muted-copy compact-copy">
                            {station.description}
                          </Typography.Text>
                          <Select
                            className="full-width"
                            value={station.trackingMode ?? "BOTH"}
                            options={[
                              {value: "BOTH", label: "Both time and score"},
                              {value: "SCORE", label: "Score only"},
                              {value: "TIME", label: "Time only"},
                            ]}
                            onChange={(value) =>
                              void handleTrackingModeChange(station, value)
                            }
                          />
                        </Flex>
                        <Flex gap={8} className="station-actions" wrap>
                          <Button
                            icon={<SyncOutlined />}
                            loading={qrBusyStationId === station.id}
                            onClick={() =>
                              void handleRotateStationQr(station, "CHECK_IN")
                            }>
                            Rotate IN
                          </Button>
                          <Button
                            icon={<SyncOutlined />}
                            loading={qrBusyStationId === station.id}
                            onClick={() =>
                              void handleRotateStationQr(station, "CHECK_OUT")
                            }>
                            Rotate OUT
                          </Button>
                          <Button
                            icon={<StopOutlined />}
                            loading={qrBusyStationId === station.id}
                            onClick={() =>
                              void handleRevokeStationQr(station, "CHECK_IN")
                            }>
                            Revoke IN
                          </Button>
                          <Button
                            icon={<StopOutlined />}
                            loading={qrBusyStationId === station.id}
                            onClick={() =>
                              void handleRevokeStationQr(station, "CHECK_OUT")
                            }>
                            Revoke OUT
                          </Button>
                          <Button
                            icon={<QrcodeOutlined />}
                            loading={qrBusyStationId === station.id}
                            onClick={() =>
                              void handleShowStationQrStatus(station)
                            }>
                            QR status
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
                        <Flex
                          vertical
                          gap={4}
                          className="station-content full-width">
                          <Flex align="center" gap={8} className="full-width">
                            <Typography.Title
                              level={4}
                              className="card-title full-width">
                              {team.name}
                            </Typography.Title>
                            <Button
                              shape="circle"
                              variant="filled"
                              className="delete-icon-button"
                              icon={<EditOutlined />}
                              onClick={() =>
                                navigate(`/system-config/teams/${team.id}`)
                              }></Button>
                            <Button
                              shape="circle"
                              color="danger"
                              variant="filled"
                              className="delete-icon-button"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                modal.confirm({
                                  centered: true,
                                  title: "Delete team?",
                                  content:
                                    "Team will be removed from the system and all progress will be lost.",
                                  okText: "Delete",
                                  cancelText: "Cancel",
                                  onOk: async () => {
                                    try {
                                      await deleteAdminTeam(team.id);
                                      loadDatabase(await fetchAdminDatabase());
                                      message.success(
                                        "Team deleted successfully",
                                      );
                                    } catch (error) {
                                      message.error(
                                        error instanceof Error ?
                                          error.message
                                        : "Unable to delete team",
                                      );
                                      throw error;
                                    }
                                  },
                                });
                              }}></Button>
                          </Flex>
                          <Typography.Text className="muted-copy compact-copy">
                            {team.id} · Score {team.score}
                          </Typography.Text>
                          <Typography.Text className="muted-copy compact-copy">
                            Finished {team.finish}/{totalStations} in{" "}
                            {team.totalTimeMinutes} min
                          </Typography.Text>
                        </Flex>
                        <Flex gap={8} className="station-actions" wrap>
                          <Button
                            icon={<SyncOutlined />}
                            loading={qrBusyTeamId === team.id}
                            onClick={() => void handleIssueQrLogin(team, true)}>
                            Rotate QR
                          </Button>
                          <Button
                            icon={<StopOutlined />}
                            loading={qrBusyTeamId === team.id}
                            onClick={() => void handleRevokeActiveQr(team)}>
                            Revoke QR
                          </Button>
                          <Button
                            icon={<QrcodeOutlined />}
                            loading={qrBusyTeamId === team.id}
                            onClick={() =>
                              void handleIssueQrLogin(team, false)
                            }>
                            Generate QR
                          </Button>
                          <Button
                            icon={<QrcodeOutlined />}
                            loading={qrBusyTeamId === team.id}
                            onClick={() => void handleShowQrStatus(team)}>
                            QR status
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
