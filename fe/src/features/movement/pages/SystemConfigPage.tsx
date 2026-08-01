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
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {fetchAdminDatabase} from "../adminData";
import {
  deleteAdminStation,
  deleteAdminTeam,
  getAdminQrStatusSummary,
  getAdminStationQrTokens,
  getAdminTeamQrLoginTokens,
  updateAdminStation,
} from "../api";
import {buildAdminQrStatusRecords} from "../adminQrStatus";
import {StationsMapPanel} from "../components/StationsMapPanel";
import {
  cacheStationQrTokens,
  getCachedStationQrToken,
} from "../stationQrTokenCache";
import {useMovementStore} from "../store";
import {
  buildTeamQrLoginUrl,
  cacheTeamQrPayload,
  getCachedTeamQrToken,
} from "../teamQrTokenCache";
import type {StationDefinition, StationTrackingMode} from "../types";
import {getLocalizedTeamName} from "../utils";

function getLocalizedStationDisplay(
  station: StationDefinition,
  language: "vi" | "en",
) {
  if (language !== "en") {
    return {
      name: station.name,
      description: station.description,
    };
  }
  return {
    name: station.nameEn?.trim() || station.name,
    description: station.descriptionEn?.trim() || station.description,
  };
}

export function SystemConfigPage() {
  const navigate = useNavigate();
  const {modal, message} = AntdApp.useApp();
  const {i18n, t} = useTranslation();
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
  const language = i18n.language === "en" ? "en" : "vi";

  const formatQrStatus = (status: string | undefined) => {
    if (!status) {
      return t("systemConfig.qrStatus.loading");
    }
    const activeCount = /^ACTIVE x(\d+)$/.exec(status);
    if (activeCount) {
      return t("systemConfig.qrStatus.activeCount", {
        count: Number(activeCount[1]),
      });
    }
    const statusKeys: Record<string, string> = {
      ACTIVE: "active",
      CONSUMED: "consumed",
      INACTIVE: "inactive",
      NONE: "none",
      REVOKED: "revoked",
    };
    const statusKey = statusKeys[status];
    return statusKey ? t(`systemConfig.qrStatus.${statusKey}`) : status;
  };

  useEffect(() => {
    if (teams.length === 0 && stationDefinitions.length === 0) {
      return;
    }

    let cancelled = false;
    const loadQrStatus = async () => {
      const summary = await getAdminQrStatusSummary();
      const {teamStatuses, stationStatuses} = buildAdminQrStatusRecords(
        summary,
        teams.map((team) => team.id),
        stationDefinitions.map((station) => station.id),
      );
      if (!cancelled) {
        setTeamQrStatus(teamStatuses);
        setStationQrStatus(stationStatuses);
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
    try {
      await updateAdminStation(station.id, {trackingMode});
      loadDatabase(await fetchAdminDatabase());
      message.success(t("systemConfig.trackingModeUpdated"));
    } catch {
      message.error(t("systemConfig.trackingModeUpdateFailed"));
    }
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
          <img
            src={dataUrl}
            alt={t("systemConfig.qrCodeAlt", {context: params.context})}
            width={260}
            height={260}
          />
          <Typography.Text>{params.context}</Typography.Text>
          <Typography.Text type="warning">
            {t("systemConfig.saveQrSecurely")}
          </Typography.Text>
          <Button type="primary" onClick={() => downloadDataUrl(dataUrl, params.filename)}>
            {t("systemConfig.downloadPng")}
          </Button>
        </Flex>
      ),
      afterClose: () => {
        URL.revokeObjectURL(dataUrl);
      },
    });
  };

  const handleOpenTeamQr = async (team: (typeof teams)[number]) => {
    setQrBusyTeamId(team.id);
    try {
      const teamName = getLocalizedTeamName(team.name, language);
      const tokens = await getAdminTeamQrLoginTokens(team.id);
      const token = tokens.find((item) => item.status === "ACTIVE");
      const cachedToken = getCachedTeamQrToken(team.id);
      const payload =
        token?.qrLoginUrl ||
        token?.loginUrl ||
        (token?.rawToken ? buildTeamQrLoginUrl(token.rawToken) : "") ||
        (token && cachedToken ? buildTeamQrLoginUrl(cachedToken) : "");
      if (!payload) {
        message.warning(t("systemConfig.teamQrMissing"));
        return;
      }
      cacheTeamQrPayload(team.id, payload);
      await showOneTimeQrPreview({
        title: t("systemConfig.teamQrTitle", {team: teamName}),
        payload,
        filename: `team-${team.id}-qr.png`,
        context: t("systemConfig.teamQrContext", {team: teamName}),
      });
    } catch {
      message.error(t("systemConfig.openTeamQrFailed"));
    } finally {
      setQrBusyTeamId(null);
    }
  };

  const handleOpenStationQr = async (station: (typeof stationDefinitions)[number]) => {
    setQrBusyStationId(station.id);
    try {
      const stationDisplay = getLocalizedStationDisplay(station, language);
      const tokens = await getAdminStationQrTokens(station.id);
      const activeTokens = tokens.filter((token) => token.status === "ACTIVE");
      const tokensWithRawValue = activeTokens.map((token) => ({
        ...token,
        rawToken: token.rawToken ?? getCachedStationQrToken(station.id, token.purpose),
      })).filter((token) => token.rawToken);
      if (!tokensWithRawValue.length) {
        message.warning(t("systemConfig.stationQrMissing"));
        return;
      }

      cacheStationQrTokens(station.id, tokensWithRawValue);
      const previews = await Promise.all(tokensWithRawValue.map(async (token) => ({
        token,
        dataUrl: await QRCode.toDataURL(token.rawToken ?? "", {width: 260, margin: 2}),
      })));
      modal.info({
        centered: true,
        width: 720,
        title: t("systemConfig.stationQrTitle", {station: stationDisplay.name}),
        content: (
          <Flex vertical gap={12}>
            <Typography.Text>
              {t("systemConfig.stationQrDescription")}
            </Typography.Text>
            <Flex gap={16} wrap justify="center">
              {previews.map(({token, dataUrl}) => (
                <Flex key={token.purpose} vertical gap={8} align="center">
                  <img
                    src={dataUrl}
                    alt={t("systemConfig.stationQrAlt", {
                      purpose: token.purpose,
                      station: stationDisplay.name,
                    })}
                    width={220}
                    height={220}
                  />
                  <Typography.Text>{token.purpose} · {token.status}</Typography.Text>
                  <Button onClick={() => downloadDataUrl(dataUrl, `station-${station.id}-${token.purpose.toLowerCase()}-qr.png`)}>
                    {t("systemConfig.downloadPng")}
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Flex>
        ),
      });
    } catch {
      message.error(t("systemConfig.openStationQrFailed"));
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
          label: t("systemConfig.stationList", {
            count: stationDefinitions.length,
          }),
          children: (
            <Flex vertical gap={16} className="full-width">
              <Button
                type="primary"
                onClick={() => navigate("/system-config/stations/new")}>
                {t("systemConfig.addStation")}
              </Button>
              <List
                className="card-list"
                dataSource={stationDefinitions}
                renderItem={(station) => {
                  const stationDisplay = getLocalizedStationDisplay(
                    station,
                    language,
                  );
                  return (
                    <List.Item>
                      <Card className="surface-card station-card">
                        <div className="station-row">
                          <Flex
                            vertical
                            gap={4}
                            className="full-width">
                            <Flex gap={8} className="full-width">
                              <Typography.Title level={4} className="card-title full-width">
                                {stationDisplay.name}
                              </Typography.Title>
                              <Button
                                shape="circle"
                                variant="filled"
                                className="delete-icon-button"
                                icon={<EditOutlined />}
                                aria-label={t("systemConfig.editStationAria", {
                                  station: stationDisplay.name,
                                })}
                                title={t("systemConfig.editStationAria", {
                                  station: stationDisplay.name,
                                })}
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
                                aria-label={t("systemConfig.deleteStationAria", {
                                  station: stationDisplay.name,
                                })}
                                title={t("systemConfig.deleteStationAria", {
                                  station: stationDisplay.name,
                                })}
                                onClick={() => {
                                  modal.confirm({
                                    centered: true,
                                    title: t("systemConfig.deleteStationTitle"),
                                    content: t("systemConfig.deleteStationContent"),
                                    okText: t("systemConfig.delete"),
                                    cancelText: t("common.cancel"),
                                    onOk: async () => {
                                      try {
                                        await deleteAdminStation(station.id);
                                        loadDatabase(await fetchAdminDatabase());
                                        message.success(
                                          t("systemConfig.stationDeactivated"),
                                        );
                                      } catch (error) {
                                        message.error(
                                          t("systemConfig.deleteStationFailed"),
                                        );
                                        throw error;
                                      }
                                    },
                                  });
                                }}></Button>
                            </Flex>
                            <Typography.Text className="muted-copy compact-copy">
                              {station.id}
                            </Typography.Text>
                            <Typography.Text className="muted-copy compact-copy">
                              {stationDisplay.description}
                            </Typography.Text>
                            <Select
                              className="full-width"
                              value={station.trackingMode ?? "BOTH"}
                              options={[
                                {value: "BOTH", label: t("stationEditor.both")},
                                {value: "SCORE", label: t("stationEditor.scoreOnly")},
                                {value: "TIME", label: t("stationEditor.timeOnly")},
                              ]}
                              onChange={(value) =>
                                void handleTrackingModeChange(station, value)
                              }
                            />
                          </Flex>
                          <Flex gap={8} className="station-actions" wrap align="center">
                            <Tag>QR {formatQrStatus(stationQrStatus[station.id])}</Tag>
                            <Button
                              type="primary"
                              icon={<QrcodeOutlined />}
                              loading={qrBusyStationId === station.id}
                              onClick={() => void handleOpenStationQr(station)}>
                              {t("systemConfig.showQr")}
                            </Button>
                          </Flex>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            </Flex>
          ),
        },
        {
          key: "teams",
          label: t("systemConfig.teamList", {count: teams.length}),
          children: (
            <Flex vertical gap={16} className="full-width">
              <Button
                type="primary"
                onClick={() => navigate("/system-config/teams/new")}>
                {t("systemConfig.addTeam")}
              </Button>
              <List
                className="card-list"
                dataSource={teams}
                renderItem={(team) => {
                  const teamName = getLocalizedTeamName(team.name, language);
                  return (
                    <List.Item>
                      <Card className="surface-card station-card">
                        <div className="station-row">
                          <Flex
                            vertical
                            gap={4}
                            className="full-width">
                            <Flex align="center" gap={8} className="full-width">
                              <Typography.Title
                                level={4}
                                className="card-title full-width">
                                {teamName}
                              </Typography.Title>
                              <Button
                                shape="circle"
                                variant="filled"
                                className="delete-icon-button"
                                icon={<EditOutlined />}
                                aria-label={t("systemConfig.editTeamAria", {
                                  team: teamName,
                                })}
                                title={t("systemConfig.editTeamAria", {
                                  team: teamName,
                                })}
                                onClick={() =>
                                  navigate(`/system-config/teams/${team.id}`)
                                }></Button>
                              <Button
                                shape="circle"
                                color="danger"
                                variant="filled"
                                className="delete-icon-button"
                                icon={<DeleteOutlined />}
                                aria-label={t("systemConfig.deleteTeamAria", {
                                  team: teamName,
                                })}
                                title={t("systemConfig.deleteTeamAria", {
                                  team: teamName,
                                })}
                                onClick={() => {
                                  modal.confirm({
                                    centered: true,
                                    title: t("systemConfig.deleteTeamTitle"),
                                    content: t("systemConfig.deleteTeamContent"),
                                    okText: t("systemConfig.delete"),
                                    cancelText: t("common.cancel"),
                                    onOk: async () => {
                                      try {
                                        await deleteAdminTeam(team.id);
                                        loadDatabase(await fetchAdminDatabase());
                                        message.success(
                                          t("systemConfig.teamDeleted"),
                                        );
                                      } catch (error) {
                                        message.error(
                                          t("systemConfig.deleteTeamFailed"),
                                        );
                                        throw error;
                                      }
                                    },
                                  });
                                }}></Button>
                            </Flex>
                            <Typography.Text className="muted-copy compact-copy">
                              {t("systemConfig.teamScore", {
                                id: team.id,
                                score: team.score,
                              })}
                            </Typography.Text>
                            <Typography.Text className="muted-copy compact-copy">
                              {t("systemConfig.teamProgress", {
                                finished: team.finish,
                                minutes: team.totalTimeMinutes,
                                total: totalStations,
                              })}
                            </Typography.Text>
                          </Flex>
                          <Flex gap={8} className="station-actions" wrap align="center">
                            <Tag>QR {formatQrStatus(teamQrStatus[team.id])}</Tag>
                            <Button
                              type="primary"
                              icon={<QrcodeOutlined />}
                              loading={qrBusyTeamId === team.id}
                              onClick={() => void handleOpenTeamQr(team)}>
                              {t("systemConfig.showQr")}
                            </Button>
                          </Flex>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            </Flex>
          ),
        },
        {
          key: "map",
          label: t("nav.map"),
          children: <StationsMapPanel editable />,
        },
      ]}
    />
  );
}
