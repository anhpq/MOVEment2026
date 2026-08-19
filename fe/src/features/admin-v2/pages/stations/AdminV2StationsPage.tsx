import {EyeOutlined, SearchOutlined} from "@ant-design/icons";
import {Alert, Badge, Button, Empty, Flex, Input, Select, Skeleton, Space, Table, Tag, Tooltip, Typography, type TableColumnsType} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {getStationDisplayCode} from "../../../movement/utils";
import {getAdminV2StationsList, type AdminV2StationListItem, type AdminV2StationQrStatus} from "./adminV2StationsData";

type StationsState = Readonly<{
  stations: readonly AdminV2StationListItem[] | null;
  qrStatusUnavailable: boolean;
  error: boolean;
  refreshing: boolean;
}>;

const initialState: StationsState = {stations: null, qrStatusUnavailable: false, error: false, refreshing: false};

function useNarrowAdminV2Layout() {
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia?.("(max-width: 768px)").matches ?? false);
  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(max-width: 768px)");
    if (!mediaQuery) return undefined;
    const update = () => setIsNarrow(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);
  return isNarrow;
}

function QrStatusCell({status, activeCount}: Readonly<{status: AdminV2StationQrStatus; activeCount: number | null}>) {
  const {t} = useTranslation();
  const color = status === "ACTIVE" ? "success" : status === "UNAVAILABLE" ? "default" : "warning";
  return <Space direction="vertical" size={2}><Badge status={color} text={t(`adminV2.stations.qr.${status}`)} />{activeCount !== null && <Tag>{t("adminV2.stations.qr.activeCount", {count: activeCount})}</Tag>}</Space>;
}

export function AdminV2StationsPage() {
  const {t, i18n} = useTranslation();
  const isNarrow = useNarrowAdminV2Layout();
  const [state, setState] = useState(initialState);
  const [query, setQuery] = useState("");
  const [gameType, setGameType] = useState<string>("ALL");
  const [trackingMode, setTrackingMode] = useState<string>("ALL");
  const [qrStatus, setQrStatus] = useState<"ALL" | AdminV2StationQrStatus>("ALL");

  const refresh = useCallback(async () => {
    setState((current) => ({...current, refreshing: true, error: false}));
    try {
      const result = await getAdminV2StationsList();
      setState({stations: result.stations, qrStatusUnavailable: result.qrStatusUnavailable, error: false, refreshing: false});
    } catch {
      setState((current) => ({...current, error: true, refreshing: false}));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const stations = useMemo(() => (state.stations ?? []).filter((station) => {
    const normalizedQuery = query.trim().toLocaleLowerCase(i18n.language === "vi" ? "vi" : "en");
    const localizedName = i18n.language === "en" ? station.nameEn || station.name : station.name;
    return (!normalizedQuery || [station.id, getStationDisplayCode(station.id), station.name, localizedName].some((value) => value.toLocaleLowerCase(i18n.language === "vi" ? "vi" : "en").includes(normalizedQuery)))
      && (gameType === "ALL" || station.gameType === gameType)
      && (trackingMode === "ALL" || station.trackingMode === trackingMode)
      && (qrStatus === "ALL" || station.qrStatus === qrStatus);
  }), [gameType, i18n.language, qrStatus, query, state.stations, trackingMode]);

  const gameTypes = useMemo(() => [...new Set((state.stations ?? []).map((station) => station.gameType).filter((value) => value !== null))], [state.stations]);
  const trackingModes = useMemo(() => [...new Set((state.stations ?? []).map((station) => station.trackingMode))], [state.stations]);
  const columns = useMemo<TableColumnsType<AdminV2StationListItem>>(() => [
    {title: t("adminV2.stations.columns.station"), key: "station", fixed: isNarrow ? undefined : "left", width: 260, render: (_, station) => <Space direction="vertical" size={0}><Typography.Text strong>{getStationDisplayCode(station.id)}</Typography.Text><Typography.Text>{i18n.language === "en" ? station.nameEn || station.name : station.name}</Typography.Text><Typography.Text type="secondary">{station.id}</Typography.Text></Space>},
    {title: t("adminV2.stations.columns.gameType"), key: "gameType", width: 130, render: (_, station) => station.gameType ? <Tag>{station.gameType}</Tag> : t("adminV2.stations.notAvailable")},
    {title: t("adminV2.stations.columns.trackingMode"), dataIndex: "trackingMode", width: 150, render: (value) => <Tag color="blue">{value}</Tag>},
    {title: t("adminV2.stations.columns.maxPoints"), key: "maxPoints", align: "right", width: 120, render: (_, station) => station.maxPoints ?? t("adminV2.stations.notAvailable")},
    {title: t("adminV2.stations.columns.playingTeams"), dataIndex: "playingTeamCount", align: "right", width: 145},
    {title: t("adminV2.stations.columns.qr"), key: "qr", width: 170, render: (_, station) => <QrStatusCell activeCount={station.activeQrCount} status={station.qrStatus} />},
    {title: t("adminV2.stations.columns.actions"), key: "actions", fixed: isNarrow ? undefined : "right", align: "center", width: 100, render: (_, station) => <Tooltip title={t("adminV2.stations.actions.viewDetails")}><Link to={`/admin-v2/stations/${station.id}`}><Button aria-label={t("adminV2.stations.actions.viewDetails")} icon={<EyeOutlined />} type="text" /></Link></Tooltip>},
  ], [i18n.language, isNarrow, t]);

  const isInitialLoading = state.stations === null && !state.error;
  return <section className="admin-v2-stations" aria-labelledby="admin-v2-stations-title">
    <Flex align="flex-start" className="admin-v2-stations__heading" gap="middle" justify="space-between" wrap>
      <div><Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text><Typography.Title id="admin-v2-stations-title" level={1}>{t("adminV2.stations.title")}</Typography.Title><Typography.Paragraph type="secondary">{state.stations ? t("adminV2.stations.count", {count: state.stations.length}) : t("adminV2.stations.loadingCount")}</Typography.Paragraph></div>
      <Button loading={state.refreshing} onClick={() => void refresh()}>{t("adminV2.stations.refresh")}</Button>
    </Flex>
    {state.error && <Alert action={<Button size="small" onClick={() => void refresh()}>{t("adminV2.stations.retry")}</Button>} className="admin-v2-stations__alert" description={t("adminV2.stations.errorDescription")} showIcon title={t("adminV2.stations.error")} type="error" />}
    {state.qrStatusUnavailable && <Alert className="admin-v2-stations__alert" description={t("adminV2.stations.qrUnavailableDescription")} showIcon title={t("adminV2.stations.qrUnavailable")} type="warning" />}
    {isInitialLoading ? <Skeleton active paragraph={{rows: 8}} title /> : !state.error && <><Flex className="admin-v2-stations__filters" gap="small" wrap>
      <Input.Search allowClear aria-label={t("adminV2.stations.searchLabel")} onChange={(event) => setQuery(event.target.value)} placeholder={t("adminV2.stations.searchPlaceholder")} prefix={<SearchOutlined />} value={query} />
      <Select aria-label={t("adminV2.stations.gameTypeFilter")} onChange={setGameType} options={[{label: t("adminV2.stations.allGameTypes"), value: "ALL"}, ...gameTypes.map((value) => ({label: value, value}))]} value={gameType} />
      <Select aria-label={t("adminV2.stations.trackingModeFilter")} onChange={setTrackingMode} options={[{label: t("adminV2.stations.allTrackingModes"), value: "ALL"}, ...trackingModes.map((value) => ({label: value, value}))]} value={trackingMode} />
      <Select aria-label={t("adminV2.stations.qrFilter")} disabled={state.qrStatusUnavailable} onChange={setQrStatus} options={[{label: t("adminV2.stations.allQrStatuses"), value: "ALL"}, ...(["ACTIVE", "EXPIRED", "REVOKED", "INACTIVE"] as const).map((value) => ({label: t(`adminV2.stations.qr.${value}`), value}))]} value={qrStatus} />
    </Flex><Table className="admin-v2-stations__table" columns={columns} dataSource={stations} locale={{emptyText: <Empty description={state.stations?.length === 0 ? t("adminV2.stations.empty") : t("adminV2.stations.noMatches")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}} pagination={{hideOnSinglePage: true, pageSize: 20, showSizeChanger: false}} rowKey="id" scroll={{x: 1075}} /></>}
  </section>;
}
