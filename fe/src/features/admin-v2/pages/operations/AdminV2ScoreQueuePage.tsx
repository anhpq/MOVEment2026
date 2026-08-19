import {SearchOutlined} from "@ant-design/icons";
import {App as AntdApp, Alert, Badge, Button, Empty, Flex, Form, Input, InputNumber, Modal, Skeleton, Space, Table, Tag, Tooltip, Typography, type TableColumnsType} from "antd";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {getAdminScoreQueue, submitAdminProgressScore, type AdminScoreQueueItemResponse} from "../../../movement/api";
import {DEFAULT_STATION_MAX_POINTS} from "../../../movement/constants";
import {getLocalizedTeamName} from "../../../movement/utils";
import {isScoreWithinRange} from "./scoreQueueValidation";

type QueueState = Readonly<{items: readonly AdminScoreQueueItemResponse[] | null; error: boolean; refreshing: boolean}>;
type ScoreValues = Readonly<{score: number; reason: string}>;

const initialState: QueueState = {items: null, error: false, refreshing: false};

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

function getEffectiveMaxScore(item: AdminScoreQueueItemResponse) {
  return item.station.trackingMode === "TIME" ? 10 : item.game.maxPoints ?? DEFAULT_STATION_MAX_POINTS;
}

function formatDateTime(value: string | null, language: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {dateStyle: "medium", timeStyle: "short"}).format(date);
}

function stationName(item: AdminScoreQueueItemResponse, language: "vi" | "en") {
  return language === "en" && item.station.nameEn?.trim() ? item.station.nameEn : item.station.name;
}

export function AdminV2ScoreQueuePage() {
  const {message} = AntdApp.useApp();
  const {t, i18n} = useTranslation();
  const isNarrow = useNarrowAdminV2Layout();
  const [state, setState] = useState(initialState);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminScoreQueueItemResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState(false);
  const submissionLock = useRef(false);
  const [form] = Form.useForm<ScoreValues>();
  const scoreToRecord = Form.useWatch("score", form);
  const language = i18n.language === "en" ? "en" : "vi";

  const refresh = useCallback(async () => {
    setState((current) => ({...current, error: false, refreshing: true}));
    try {
      const items = await getAdminScoreQueue();
      setState({items, error: false, refreshing: false});
    } catch {
      setState((current) => ({...current, error: true, refreshing: false}));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(language);
    if (!normalizedQuery) return state.items ?? [];
    return (state.items ?? []).filter((item) => [item.stationId, stationName(item, language), item.station.name, item.station.nameEn, item.team.name, getLocalizedTeamName(item.team.name, language)]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase(language).includes(normalizedQuery)));
  }, [language, query, state.items]);

  const openReview = useCallback((item: AdminScoreQueueItemResponse) => {
    setMutationError(false);
    form.setFieldsValue({score: item.scoreAchieved, reason: ""});
    setSelected(item);
  }, [form]);

  const submit = useCallback(async (values: ScoreValues) => {
    if (!selected || submitting || submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setMutationError(false);
    try {
      await submitAdminProgressScore(selected.id, values.score, values.reason.trim());
      setState((current) => ({...current, items: current.items?.filter((item) => item.id !== selected.id) ?? null}));
      setSelected(null);
      message.success(t("adminV2.scoreQueue.modal.success"));
      await refresh();
    } catch {
      setMutationError(true);
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }, [message, refresh, selected, submitting, t]);

  const columns = useMemo<TableColumnsType<AdminScoreQueueItemResponse>>(() => [
    {title: t("adminV2.scoreQueue.columns.team"), key: "team", width: 190, render: (_, item) => <Typography.Text strong>{getLocalizedTeamName(item.team.name, language)}</Typography.Text>},
    {title: t("adminV2.scoreQueue.columns.station"), key: "station", width: 210, render: (_, item) => <Space orientation="vertical" size={0}><Typography.Text strong>{item.stationId}</Typography.Text><Typography.Text type="secondary">{stationName(item, language)}</Typography.Text></Space>},
    {title: t("adminV2.scoreQueue.columns.currentScore"), dataIndex: "scoreAchieved", align: "right", width: 128},
    {title: t("adminV2.scoreQueue.columns.maxScore"), key: "maxScore", align: "right", width: 118, render: (_, item) => getEffectiveMaxScore(item)},
    {title: t("adminV2.scoreQueue.columns.checkedOut"), dataIndex: "checkedOutAt", width: 180, hidden: isNarrow, render: (value: string | null) => formatDateTime(value, language, t("adminV2.scoreQueue.noDate"))},
    {title: t("adminV2.scoreQueue.columns.status"), dataIndex: "status", width: 125, render: (status: AdminScoreQueueItemResponse["status"]) => <Tag>{t(`adminV2.scoreQueue.status.${status}`, {defaultValue: status})}</Tag>},
    {title: t("adminV2.scoreQueue.columns.note"), dataIndex: "notes", width: 200, hidden: isNarrow, render: (note: string | null | undefined) => <Typography.Text ellipsis={{tooltip: note}}>{note?.trim() || t("adminV2.scoreQueue.noNote")}</Typography.Text>},
    {title: t("adminV2.scoreQueue.columns.actions"), key: "actions", fixed: "right", width: 132, render: (_, item) => item.station.trackingMode === "TIME" ? <Tooltip title={t("adminV2.scoreQueue.timeOnly")}><Button disabled>{t("adminV2.scoreQueue.review")}</Button></Tooltip> : <Button type="primary" onClick={() => openReview(item)}>{t("adminV2.scoreQueue.review")}</Button>},
  ], [isNarrow, language, openReview, t]);

  const isInitialLoading = state.items === null && !state.error;
  const hasStaleData = state.error && state.items !== null;
  const maxScore = selected ? getEffectiveMaxScore(selected) : 0;
  const selectedStationName = selected ? stationName(selected, language) : "";

  return <section className="admin-v2-score-queue" aria-labelledby="admin-v2-score-queue-title">
    <Flex align="flex-start" className="admin-v2-score-queue__heading" gap="middle" justify="space-between" wrap>
      <div><Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text><Typography.Title id="admin-v2-score-queue-title" level={1}>{t("adminV2.scoreQueue.title")}</Typography.Title><Typography.Paragraph type="secondary">{state.items === null ? t("adminV2.scoreQueue.loadingCount") : t("adminV2.scoreQueue.count", {count: state.items.length})}</Typography.Paragraph></div>
      <Badge count={state.items?.length ?? 0} overflowCount={999} showZero><Button loading={state.refreshing} onClick={() => void refresh()}>{t("adminV2.scoreQueue.refresh")}</Button></Badge>
    </Flex>
    {state.error && <Alert action={<Button size="small" onClick={() => void refresh()}>{t("adminV2.scoreQueue.retry")}</Button>} className="admin-v2-score-queue__alert" description={hasStaleData ? t("adminV2.scoreQueue.staleDescription") : t("adminV2.scoreQueue.errorDescription")} showIcon title={hasStaleData ? t("adminV2.scoreQueue.stale") : t("adminV2.scoreQueue.error")} type={hasStaleData ? "warning" : "error"} />}
    {isInitialLoading ? <Skeleton active paragraph={{rows: 8}} title /> : state.items !== null && <>
      <Input.Search allowClear aria-label={t("adminV2.scoreQueue.searchLabel")} className="admin-v2-score-queue__search" onChange={(event) => setQuery(event.target.value)} placeholder={t("adminV2.scoreQueue.searchPlaceholder")} prefix={<SearchOutlined />} value={query} />
      <Table className="admin-v2-score-queue__table" columns={columns} dataSource={rows} locale={{emptyText: <Empty description={state.items.length === 0 ? t("adminV2.scoreQueue.empty") : t("adminV2.scoreQueue.noMatches")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}} pagination={{hideOnSinglePage: true, pageSize: 20, showSizeChanger: false}} rowKey="id" scroll={{x: isNarrow ? 800 : 1280}} />
    </>}
    <Modal cancelButtonProps={{disabled: submitting}} cancelText={t("adminV2.scoreQueue.modal.cancel")} confirmLoading={submitting} destroyOnHidden onCancel={() => !submitting && setSelected(null)} okText={submitting ? t("adminV2.scoreQueue.modal.saving") : t("adminV2.scoreQueue.modal.save")} onOk={() => form.submit()} open={selected !== null} title={t("adminV2.scoreQueue.modal.title")} width={560}>
      {selected && <Form form={form} layout="vertical" onFinish={(values) => void submit(values)}>
        <Typography.Paragraph type="secondary">{t("adminV2.scoreQueue.modal.description")}</Typography.Paragraph>
        <div className="admin-v2-score-queue__review-summary"><div><Typography.Text type="secondary">{t("adminV2.scoreQueue.modal.team")}</Typography.Text><Typography.Text strong>{getLocalizedTeamName(selected.team.name, language)}</Typography.Text></div><div><Typography.Text type="secondary">{t("adminV2.scoreQueue.modal.station")}</Typography.Text><Typography.Text strong>{selected.stationId} · {selectedStationName}</Typography.Text></div><div><Typography.Text type="secondary">{t("adminV2.scoreQueue.modal.submittedScore")}</Typography.Text><Typography.Text strong>{selected.scoreAchieved}</Typography.Text></div><div><Typography.Text type="secondary">{t("adminV2.scoreQueue.modal.maxScore")}</Typography.Text><Typography.Text strong>{maxScore}</Typography.Text></div><div><Typography.Text type="secondary">{t("adminV2.scoreQueue.modal.result")}</Typography.Text><Typography.Text strong>{scoreToRecord ?? selected.scoreAchieved}</Typography.Text></div></div>
        {selected.notes?.trim() && <Alert className="admin-v2-score-queue__note" description={selected.notes} showIcon title={t("adminV2.scoreQueue.modal.note")} type="info" />}
        {mutationError && <Alert className="admin-v2-score-queue__mutation-error" showIcon title={t("adminV2.scoreQueue.modal.failure")} type="error" />}
        <Form.Item label={t("adminV2.scoreQueue.modal.score")} name="score" rules={[{required: true, message: t("adminV2.scoreQueue.modal.scoreRequired")}, {validator: (_, value: unknown) => isScoreWithinRange(value, maxScore) ? Promise.resolve() : Promise.reject(new Error(typeof value === "number" && Number.isInteger(value) ? t("adminV2.scoreQueue.modal.scoreRange", {max: maxScore}) : t("adminV2.scoreQueue.modal.scoreInteger")))}]}><InputNumber aria-label={t("adminV2.scoreQueue.modal.score")} max={maxScore} min={0} precision={0} step={1} style={{width: "100%"}} /></Form.Item>
        <Form.Item label={t("adminV2.scoreQueue.modal.reason")} name="reason" rules={[{required: true, whitespace: true, message: t("adminV2.scoreQueue.modal.reasonRequired")}, {max: 500, message: t("adminV2.scoreQueue.modal.reasonTooLong")}]}><Input.TextArea aria-label={t("adminV2.scoreQueue.modal.reason")} autoSize={{minRows: 3, maxRows: 6}} maxLength={500} placeholder={t("adminV2.scoreQueue.modal.reasonPlaceholder")} /></Form.Item>
      </Form>}
    </Modal>
  </section>;
}
