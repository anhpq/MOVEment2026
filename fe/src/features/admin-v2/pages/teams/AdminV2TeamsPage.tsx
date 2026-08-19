import {MoreOutlined, SearchOutlined} from "@ant-design/icons";
import {Alert, Avatar, Badge, Button, Dropdown, Empty, Flex, Input, Select, Skeleton, Space, Table, Tag, Tooltip, Typography, type TableColumnsType} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {getAdminV2TeamsList, type AdminV2TeamActivityStatus, type AdminV2TeamListItem} from "./adminV2TeamsData";

type TeamsState = Readonly<{
  teams: readonly AdminV2TeamListItem[] | null;
  qrStatusUnavailable: boolean;
  error: boolean;
  refreshing: boolean;
}>;

const initialState: TeamsState = {teams: null, qrStatusUnavailable: false, error: false, refreshing: false};

function formatDuration(seconds: number, t: (key: string, options?: Record<string, number>) => string) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return t("adminV2.teams.duration.hoursMinutes", {hours, minutes});
  return t("adminV2.teams.duration.minutes", {minutes});
}

function StatusCell({status, qrStatus}: Readonly<{status: AdminV2TeamActivityStatus; qrStatus: AdminV2TeamListItem["qrStatus"]}>) {
  const {t} = useTranslation();
  const statusColor = status === "IN_PROGRESS" ? "processing" : status === "COMPLETED" ? "success" : "default";
  const qrColor = qrStatus === "ACTIVE" ? "success" : qrStatus === "NONE" ? "warning" : "default";
  return (
    <Space direction="vertical" size={2}>
      <Badge status={statusColor} text={t(`adminV2.teams.activity.${status}`)} />
      <Tag color={qrColor}>{t(`adminV2.teams.qr.${qrStatus}`)}</Tag>
    </Space>
  );
}

export function AdminV2TeamsPage() {
  const {t, i18n} = useTranslation();
  const [state, setState] = useState(initialState);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminV2TeamActivityStatus>("ALL");
  const [qrFilter, setQrFilter] = useState<"ALL" | AdminV2TeamListItem["qrStatus"]>("ALL");

  const refresh = useCallback(async () => {
    setState((current) => ({...current, refreshing: true, error: false}));
    try {
      const result = await getAdminV2TeamsList();
      setState({teams: result.teams, qrStatusUnavailable: result.qrStatusUnavailable, error: false, refreshing: false});
    } catch {
      setState((current) => ({...current, error: true, refreshing: false}));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const teams = useMemo(() => (state.teams ?? []).filter((team) => {
    const normalizedQuery = query.trim().toLocaleLowerCase(i18n.language === "vi" ? "vi" : "en");
    const matchesQuery = !normalizedQuery || [team.name, team.username, team.captainName]
      .some((value) => value.toLocaleLowerCase(i18n.language === "vi" ? "vi" : "en").includes(normalizedQuery));
    return matchesQuery && (statusFilter === "ALL" || team.activityStatus === statusFilter) && (qrFilter === "ALL" || team.qrStatus === qrFilter);
  }), [i18n.language, query, qrFilter, state.teams, statusFilter]);

  const columns = useMemo<TableColumnsType<AdminV2TeamListItem>>(() => [
    {
      title: t("adminV2.teams.columns.team"), key: "team", fixed: "left", width: 250,
      render: (_, team) => <Space size="middle"><Avatar className="admin-v2-teams__avatar" style={{backgroundColor: team.color ?? undefined}}>{team.name.slice(0, 1)}</Avatar><div><Typography.Text strong>{team.name}</Typography.Text><Typography.Text className="admin-v2-teams__id" type="secondary">#{team.id}</Typography.Text></div></Space>,
    },
    {
      title: t("adminV2.teams.columns.captain"), key: "captain", width: 210,
      render: (_, team) => <Space direction="vertical" size={0}><Typography.Text>{team.captainName || t("adminV2.teams.notAvailable")}</Typography.Text><Typography.Text type="secondary">{team.username}</Typography.Text></Space>,
    },
    {title: t("adminV2.teams.columns.score"), dataIndex: "totalPoints", align: "right", width: 110},
    {
      title: t("adminV2.teams.columns.stationsCompleted"), key: "completedStations", align: "right", width: 170,
      render: (_, team) => `${team.completedStations}/${team.stationCount}`,
    },
    {title: t("adminV2.teams.columns.status"), key: "status", width: 170, render: (_, team) => <StatusCell status={team.activityStatus} qrStatus={team.qrStatus} />},
    {
      title: t("adminV2.teams.columns.time"), key: "time", width: 180,
      render: (_, team) => <Space direction="vertical" size={0}><Typography.Text>{formatDuration(team.totalPlaySeconds, t)}</Typography.Text><Typography.Text type="secondary">{team.lastActivityAt ? t("adminV2.teams.lastActivity", {time: new Intl.DateTimeFormat(i18n.language === "vi" ? "vi-VN" : "en-US", {dateStyle: "medium", timeStyle: "short"}).format(new Date(team.lastActivityAt))}) : t("adminV2.teams.noActivity")}</Typography.Text></Space>,
    },
    {
      title: t("adminV2.teams.columns.actions"), key: "actions", fixed: "right", align: "center", width: 96,
      render: (_, team) => <Tooltip title={t("adminV2.teams.actions.phaseFourHint")}><Dropdown menu={{items: [{key: "details", label: t("adminV2.teams.actions.viewDetails"), disabled: true}]}} trigger={["click"]}><Button aria-label={t("adminV2.teams.actions.openFor", {team: team.name})} icon={<MoreOutlined />} /></Dropdown></Tooltip>,
    },
  ], [i18n.language, t]);

  const isInitialLoading = state.teams === null && !state.error;
  return (
    <section className="admin-v2-teams" aria-labelledby="admin-v2-teams-title">
      <Flex align="flex-start" className="admin-v2-teams__heading" gap="middle" justify="space-between" wrap>
        <div><Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text><Typography.Title id="admin-v2-teams-title" level={1}>{t("adminV2.teams.title")}</Typography.Title><Typography.Paragraph type="secondary">{state.teams ? t("adminV2.teams.count", {count: state.teams.length}) : t("adminV2.teams.loadingCount")}</Typography.Paragraph></div>
        <Button loading={state.refreshing} onClick={() => void refresh()}>{t("adminV2.teams.refresh")}</Button>
      </Flex>

      {state.error && <Alert action={<Button size="small" onClick={() => void refresh()}>{t("adminV2.teams.retry")}</Button>} className="admin-v2-teams__alert" description={t("adminV2.teams.errorDescription")} showIcon title={t("adminV2.teams.error")} type="error" />}
      {state.qrStatusUnavailable && <Alert className="admin-v2-teams__alert" description={t("adminV2.teams.qrUnavailableDescription")} showIcon title={t("adminV2.teams.qrUnavailable")} type="warning" />}

      {isInitialLoading ? <Skeleton active paragraph={{rows: 8}} title /> : !state.error && <>
        <Flex className="admin-v2-teams__filters" gap="small" wrap>
          <Input.Search allowClear aria-label={t("adminV2.teams.searchLabel")} onChange={(event) => setQuery(event.target.value)} placeholder={t("adminV2.teams.searchPlaceholder")} prefix={<SearchOutlined />} value={query} />
          <Select aria-label={t("adminV2.teams.activityFilter")} onChange={setStatusFilter} options={[{label: t("adminV2.teams.allActivities"), value: "ALL"}, ...(["IN_PROGRESS", "COMPLETED", "NO_ACTIVITY"] as const).map((value) => ({label: t(`adminV2.teams.activity.${value}`), value}))]} value={statusFilter} />
          <Select aria-label={t("adminV2.teams.qrFilter")} disabled={state.qrStatusUnavailable} onChange={setQrFilter} options={[{label: t("adminV2.teams.allQrStatuses"), value: "ALL"}, ...(["ACTIVE", "NONE"] as const).map((value) => ({label: t(`adminV2.teams.qr.${value}`), value}))]} value={qrFilter} />
        </Flex>
        <Table className="admin-v2-teams__table" columns={columns} dataSource={teams} locale={{emptyText: <Empty description={state.teams?.length === 0 ? t("adminV2.teams.empty") : t("adminV2.teams.noMatches")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}} pagination={{hideOnSinglePage: true, pageSize: 20, showSizeChanger: false}} rowKey="id" scroll={{x: 1180}} />
      </>}
    </section>
  );
}
