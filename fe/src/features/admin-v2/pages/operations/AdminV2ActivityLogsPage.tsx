import {FilterOutlined, ReloadOutlined, SearchOutlined} from "@ant-design/icons";
import {Alert, Badge, Button, Descriptions, Drawer, Empty, Flex, Input, Select, Skeleton, Space, Table, Tag, Tooltip, Typography, type TableColumnsType} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {getLocalizedTeamName} from "../../../movement/utils";
import {getAdminV2ActivityLogData, safeActivityMetadata, type AdminV2ActivityLog, type AdminV2ActivityLogData} from "./adminV2ActivityLogsData";

type ActivityState = Readonly<{data: AdminV2ActivityLogData | null; error: boolean; refreshing: boolean}>;
const initialState: ActivityState = {data: null, error: false, refreshing: false};

const knownActions: Record<string, string> = {
  CHECK_IN: "checkIn", CHECK_OUT: "checkOut", CANCEL_STATION: "cancelStation", ABANDON_STATION: "abandonStation", SUBMIT_SCORE: "submitScore", EDIT_SCORE: "editScore", REOPEN_PROGRESS: "reopenProgress", FORCE_PROGRESS_STATUS: "forceProgressStatus",
  CREATE_TEAM: "createTeam", UPDATE_TEAM: "updateTeam", DELETE_TEAM: "deleteTeam", CREATE_STATION: "createStation", UPDATE_STATION: "updateStation", DEACTIVATE_STATION: "deactivateStation", EVENT_CONFIG_UPDATED: "eventConfigUpdated", FINAL_CONFIG_UPDATED: "finalConfigUpdated", FINAL_SUBMIT_CORRECT: "finalSubmitCorrect", FINAL_SUBMIT_WRONG: "finalSubmitWrong",
  USER_LOGIN: "userLogin", USER_LOGOUT: "userLogout", TEAM_QR_LOGIN: "teamQrLogin", QR_LOGIN_SUCCESS: "qrLoginSuccess", QR_LOGIN_REJECTED: "qrLoginRejected", TEAM_SESSION_REPLACED: "teamSessionReplaced", TEAM_LOGOUT: "teamLogout", QR_LOGIN_GENERATED: "qrLoginGenerated", QR_LOGIN_ROTATED: "qrLoginRotated", QR_LOGIN_REVOKED: "qrLoginRevoked", STATION_QR_GENERATED: "stationQrGenerated", STATION_QR_ROTATED: "stationQrRotated", STATION_QR_REVOKED: "stationQrRevoked", FINAL_STARTED_CANCEL_STATION: "finalStartedCancelStation", EXPORT_TEAM_RESULTS_REPORT: "exportTeamResults", EXPORT_SUMMARY_REPORT: "exportSummary",
};

function useNarrowLayout() {
  const [narrow, setNarrow] = useState(() => window.matchMedia?.("(max-width: 768px)").matches ?? false);
  useEffect(() => { const query = window.matchMedia?.("(max-width: 768px)"); if (!query) return undefined; const update = () => setNarrow(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  return narrow;
}

function formatDateTime(value: string, language: string, fallback: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {dateStyle: "medium", timeStyle: "short"}).format(date);
}

function metadataReference(log: AdminV2ActivityLog, key: "teamId" | "stationId") {
  const metadata = log.metadata !== null && typeof log.metadata === "object" && !Array.isArray(log.metadata) ? log.metadata as Record<string, unknown> : null;
  const value = metadata?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

export function AdminV2ActivityLogsPage() {
  const {t, i18n} = useTranslation();
  const language = i18n.language === "en" ? "en" : "vi";
  const isNarrow = useNarrowLayout();
  const [state, setState] = useState(initialState);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<string | undefined>();
  const [actorType, setActorType] = useState<string | undefined>();
  const [selected, setSelected] = useState<AdminV2ActivityLog | null>(null);
  const refresh = useCallback(async () => { setState((current) => ({...current, error: false, refreshing: true})); try { const data = await getAdminV2ActivityLogData(); setState({data, error: false, refreshing: false}); } catch { setState((current) => ({...current, error: true, refreshing: false})); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  const target = useCallback((log: AdminV2ActivityLog) => {
    const teamId = log.entityType === "TEAM" ? log.entityId : metadataReference(log, "teamId");
    const stationId = log.entityType === "STATION" ? log.entityId : metadataReference(log, "stationId");
    if (teamId) return t("adminV2.activityLogs.teamTarget", {name: getLocalizedTeamName(state.data?.teamNames.get(teamId) ?? teamId, language), id: teamId});
    if (stationId) { const station = state.data?.stationNames.get(stationId); return t("adminV2.activityLogs.stationTarget", {name: language === "en" && station?.nameEn ? station.nameEn : station?.name ?? stationId, id: stationId}); }
    return t("adminV2.activityLogs.entityTarget", {type: log.entityType, id: log.entityId});
  }, [language, state.data, t]);
  const actor = useCallback((log: AdminV2ActivityLog) => log.actorType === "TEAM" ? t("adminV2.activityLogs.teamActor", {name: getLocalizedTeamName(state.data?.teamNames.get(log.actorId) ?? log.actorId, language), id: log.actorId}) : t(`adminV2.activityLogs.actors.${log.actorType}`, {id: log.actorId, defaultValue: t("adminV2.activityLogs.actors.unknown", {type: log.actorType, id: log.actorId})}), [language, state.data, t]);
  const title = useCallback((log: AdminV2ActivityLog) => { const key = knownActions[log.action]; return key ? t(`adminV2.activityLogs.actions.${key}`) : t("adminV2.activityLogs.unknownAction", {action: log.action}); }, [t]);
  const actionOptions = useMemo(() => Array.from(new Set(state.data?.logs.map((log) => log.action) ?? [])).map((value) => ({value, label: knownActions[value] ? t(`adminV2.activityLogs.actions.${knownActions[value]}`) : value})), [state.data, t]);
  const actorOptions = useMemo(() => Array.from(new Set(state.data?.logs.map((log) => log.actorType) ?? [])).map((value) => ({value, label: t(`adminV2.activityLogs.actorTypes.${value}`, {defaultValue: value})})), [state.data, t]);
  const rows = useMemo(() => { const normalized = query.trim().toLocaleLowerCase(language); return (state.data?.logs ?? []).filter((log) => (!action || log.action === action) && (!actorType || log.actorType === actorType) && (!normalized || [title(log), target(log), actor(log), log.action, log.entityType, log.entityId].some((value) => value.toLocaleLowerCase(language).includes(normalized)))); }, [action, actor, actorType, language, query, state.data, target, title]);
  const columns = useMemo<TableColumnsType<AdminV2ActivityLog>>(() => [
    {title: t("adminV2.activityLogs.columns.timestamp"), dataIndex: "createdAt", width: 174, render: (value) => formatDateTime(value, language, t("adminV2.activityLogs.invalidDate"))},
    {title: t("adminV2.activityLogs.columns.activity"), key: "activity", width: 270, render: (_, log) => <Space orientation="vertical" size={2}><Typography.Text strong>{title(log)}</Typography.Text><Typography.Text type="secondary">{target(log)}</Typography.Text></Space>},
    {title: t("adminV2.activityLogs.columns.actor"), key: "actor", width: 190, hidden: isNarrow, render: (_, log) => actor(log)},
    {title: t("adminV2.activityLogs.columns.action"), dataIndex: "action", width: 180, hidden: isNarrow, render: (value) => <Tag>{value}</Tag>},
    {title: t("adminV2.activityLogs.columns.details"), key: "details", fixed: "right", width: 110, render: (_, log) => <Tooltip title={t("adminV2.activityLogs.detailsHint")}><Button aria-label={t("adminV2.activityLogs.openDetailsFor", {action: title(log)})} onClick={() => setSelected(log)}>{t("adminV2.activityLogs.details")}</Button></Tooltip>},
  ], [actor, isNarrow, language, t, target, title]);
  const initialLoading = state.data === null && !state.error;
  const stale = state.data !== null && state.error;
  return <section className="admin-v2-activity-logs" aria-labelledby="admin-v2-activity-logs-title">
    <Flex align="flex-start" className="admin-v2-activity-logs__heading" gap="middle" justify="space-between" wrap><div><Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text><Typography.Title id="admin-v2-activity-logs-title" level={1}>{t("adminV2.activityLogs.title")}</Typography.Title><Typography.Paragraph type="secondary">{state.data === null ? t("adminV2.activityLogs.loadingCount") : t("adminV2.activityLogs.count", {count: state.data.logs.length, visible: rows.length})}</Typography.Paragraph></div><Badge count={state.data?.logs.length ?? 0} overflowCount={100} showZero><Button icon={<ReloadOutlined />} loading={state.refreshing} onClick={() => void refresh()}>{t("adminV2.activityLogs.refresh")}</Button></Badge></Flex>
    {state.error && <Alert action={<Button size="small" onClick={() => void refresh()}>{t("adminV2.activityLogs.retry")}</Button>} className="admin-v2-activity-logs__alert" description={t(stale ? "adminV2.activityLogs.staleDescription" : "adminV2.activityLogs.errorDescription")} showIcon title={t(stale ? "adminV2.activityLogs.stale" : "adminV2.activityLogs.error")} type={stale ? "warning" : "error"} />}
    {initialLoading ? <Skeleton active paragraph={{rows: 8}} title /> : state.data && <><Flex className="admin-v2-activity-logs__filters" gap="small" wrap><Input.Search allowClear aria-label={t("adminV2.activityLogs.searchLabel")} onChange={(event) => setQuery(event.target.value)} placeholder={t("adminV2.activityLogs.searchPlaceholder")} prefix={<SearchOutlined />} value={query} /><Select allowClear aria-label={t("adminV2.activityLogs.actionFilter")} options={actionOptions} placeholder={<><FilterOutlined /> {t("adminV2.activityLogs.actionFilter")}</>} onChange={setAction} value={action} /><Select allowClear aria-label={t("adminV2.activityLogs.actorFilter")} options={actorOptions} placeholder={t("adminV2.activityLogs.actorFilter")} onChange={setActorType} value={actorType} /></Flex><Table className="admin-v2-activity-logs__table" columns={columns} dataSource={rows} locale={{emptyText: <Empty description={state.data.logs.length === 0 ? t("adminV2.activityLogs.empty") : t("adminV2.activityLogs.noMatches")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}} pagination={{hideOnSinglePage: true, pageSize: 20, showSizeChanger: false}} rowKey="id" scroll={{x: isNarrow ? 620 : 920}} /></>}
    <Drawer destroyOnHidden onClose={() => setSelected(null)} open={selected !== null} size="large" title={t("adminV2.activityLogs.detailsTitle")}>{selected && <Space className="admin-v2-activity-logs__drawer" orientation="vertical" size="large"><div><Typography.Title level={4}>{title(selected)}</Typography.Title><Typography.Text type="secondary">{formatDateTime(selected.createdAt, language, t("adminV2.activityLogs.invalidDate"))}</Typography.Text></div><Descriptions column={1} items={[{key: "actor", label: t("adminV2.activityLogs.columns.actor"), children: actor(selected)}, {key: "target", label: t("adminV2.activityLogs.target"), children: target(selected)}, {key: "action", label: t("adminV2.activityLogs.columns.action"), children: <Tag>{selected.action}</Tag>}, {key: "entity", label: t("adminV2.activityLogs.entity"), children: `${selected.entityType} · ${selected.entityId}`}]} /><Typography.Title level={5}>{t("adminV2.activityLogs.technicalDetails")}</Typography.Title><pre className="admin-v2-activity-logs__metadata">{JSON.stringify(safeActivityMetadata(selected.metadata), null, 2) ?? "—"}</pre></Space>}</Drawer>
  </section>;
}
