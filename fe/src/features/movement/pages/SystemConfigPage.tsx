import {
  DeleteOutlined,
  EditOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Button,
  Card,
  Flex,
  List,
  Select,
  Tabs,
  Tag,
  Typography,
} from "antd";
import QRCode from "qrcode";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {fetchAdminDatabase} from "../adminData";
import {
  deleteAdminStation,
  deleteAdminTeam,
  generateAdminStationQrTokens,
  generateAdminTeamQrLoginToken,
  getAdminStationQrTokens,
  getAdminTeamQrLoginTokens,
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
  const [teamQrStatus, setTeamQrStatus] = useState<Record<string, string>>({});
  const [stationQrStatus, setStationQrStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const loadQrStatus = async () => {
      const [teamEntries, stationEntries] = await Promise.all([
        Promise.all(teams.map(async (team) => {
          const tokens = await getAdminTeamQrLoginTokens(team.id);
          return [team.id, tokens.find((token) => token.status === "ACTIVE")?.status ?? tokens[0]?.status ?? "NONE"] as const;
        })),
        Promise.all(stationDefinitions.map(async (station) => {
          const tokens = await getAdminStationQrTokens(station.id);
          const activeCount = tokens.filter((token) => token.status === "ACTIVE").length;
          return [station.id, activeCount ? `ACTIVE x${activeCount}` : tokens[0]?.status ?? "NONE"] as const;
        })),
      ]);
      if (!cancelled) {
        setTeamQrStatus(Object.fromEntries(teamEntries));
        setStationQrStatus(Object.fromEntries(stationEntries));
      }
    };
    void loadQrStatus().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [stationDefinitions, teams]);

  const handleTrackingModeChange = async (
    station: (typeof stationDefinitions)[number],
    trackingMode: StationTrackingMode,
  ) => {
    await updateAdminStation(station.id, {trackingMode});
    loadDatabase(await fetchAdminDatabase());
    message.success("Station tracking mode updated");
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const showOneTimeQrPreview = async (params: {
    title: string;
    payload: string;
    filename: string;
    context: string;
  }) => {
    const dataUrl = await QRCode.toDataURL(params.payload, {width: 320, margin: 2});
    modal.info({
      centered: true,
      width: 520,
      title: params.title,
      content: (
        <Flex vertical gap={12} align="center">
          <img src={dataUrl} alt={`${params.context} QR`} width={260} height={260} />
          <Typography.Text>{params.context}</Typography.Text>
          <Typography.Text type="warning">
            Save or download this QR now. For security, the token cannot be viewed again.
          </Typography.Text>
          <Button type="primary" onClick={() => downloadDataUrl(dataUrl, params.filename)}>
            Download PNG
          </Button>
        </Flex>
      ),
      afterClose: () => {
        URL.revokeObjectURL(dataUrl);
      },
    });
  };

  const handleGenerateTeamQr = async (team: (typeof teams)[number]) => {
    modal.confirm({
      centered: true,
      title: "Generate new Team QR?",
      content: "The current Team QR login token will be replaced and cannot be viewed again.",
      okText: "Generate QR",
      cancelText: "Cancel",
      onOk: async () => {
        setQrBusyTeamId(team.id);
        try {
          const token = await generateAdminTeamQrLoginToken(team.id);
          await showOneTimeQrPreview({
            title: `QR login for ${team.name}`,
            payload: token.qrLoginUrl ?? token.loginUrl ?? token.rawToken,
            filename: `team-${team.id}-qr.png`,
            context: `${team.name} · Team QR login · ${token.status}`,
          });
          loadDatabase(await fetchAdminDatabase());
        } catch (error) {
          message.error(error instanceof Error ? error.message : "Unable to generate Team QR");
        } finally {
          setQrBusyTeamId(null);
        }
      },
    });
  };

  const handleGenerateStationQr = async (station: (typeof stationDefinitions)[number]) => {
    modal.confirm({
      centered: true,
      title: "Generate new Station QR?",
      content: "The current Station QR tokens will be replaced and cannot be viewed again.",
      okText: "Generate QR",
      cancelText: "Cancel",
      onOk: async () => {
        setQrBusyStationId(station.id);
        try {
          const result = await generateAdminStationQrTokens(station.id);
          const previews = await Promise.all(result.qrTokens.map(async (token) => {
            if (!token.rawToken) {
              throw new Error("Generated Station QR token is unavailable");
            }
            return {
              token,
              dataUrl: await QRCode.toDataURL(token.rawToken, {width: 260, margin: 2}),
            };
          }));
          modal.info({
            centered: true,
            width: 720,
            title: `Station QR for ${station.name}`,
            content: (
              <Flex vertical gap={12}>
                <Typography.Text type="warning">
                  Save or download this QR now. For security, the token cannot be viewed again.
                </Typography.Text>
                <Flex gap={16} wrap justify="center">
                  {previews.map(({token, dataUrl}) => (
                    <Flex key={token.purpose} vertical gap={8} align="center">
                      <img src={dataUrl} alt={`${station.name} ${token.purpose} QR`} width={220} height={220} />
                      <Typography.Text>{token.purpose} · {token.status}</Typography.Text>
                      <Button onClick={() => downloadDataUrl(dataUrl, `station-${station.id}-${token.purpose.toLowerCase()}-qr.png`)}>
                        Download PNG
                      </Button>
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            ),
          });
          loadDatabase(await fetchAdminDatabase());
        } catch (error) {
          message.error(error instanceof Error ? error.message : "Unable to generate Station QR");
        } finally {
          setQrBusyStationId(null);
        }
      },
    });
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
                        <Flex gap={8} className="station-actions" wrap align="center">
                          <Tag>QR {stationQrStatus[station.id] ?? "loading"}</Tag>
                          <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            loading={qrBusyStationId === station.id}
                            onClick={() => void handleGenerateStationQr(station)}>
                            Generate QR
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
                        <Flex gap={8} className="station-actions" wrap align="center">
                          <Tag>QR {teamQrStatus[team.id] ?? "loading"}</Tag>
                          <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            loading={qrBusyTeamId === team.id}
                            onClick={() => void handleGenerateTeamQr(team)}>
                            Generate QR
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
