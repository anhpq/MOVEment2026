import {FlagOutlined, ReloadOutlined, SaveOutlined} from "@ant-design/icons";
import {Alert, App as AntdApp, Button, Card, Checkbox, Empty, Flex, Form, Input, Select, Skeleton, Space, Table, Tag, Typography, type TableColumnsType} from "antd";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {getAdminEventConfig, getAdminFinalConfig, getAdminFinalSubmissions, updateAdminFinalConfig} from "../../../movement/api";
import {getLocalizedTeamName} from "../../../movement/utils";
import {parseAdminV2FinalConfig, parseAdminV2FinalSubmissions, toFinalConfigUpdate, type AdminV2FinalConfig, type AdminV2FinalSubmission, type FinalConfigFormValues} from "./adminV2FinalChallengeData";
import {isValidOptionalKeywordRotation} from "./finalChallengeValidation";

type FinalChallengeState = Readonly<{config: AdminV2FinalConfig | null; submissions: readonly AdminV2FinalSubmission[] | null; finalStartsAt: string | null; configError: boolean; submissionsError: boolean; refreshing: boolean}>;
const initialState: FinalChallengeState = {config: null, submissions: null, finalStartsAt: null, configError: false, submissionsError: false, refreshing: false};

function eventFinalStartsAt(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const finalStartsAt = (value as Record<string, unknown>).finalStartsAt;
  return typeof finalStartsAt === "string" && finalStartsAt.trim() ? finalStartsAt : null;
}
function formatSubmittedAt(value: string, language: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {dateStyle: "medium", timeStyle: "medium"}).format(date);
}

export function AdminV2FinalChallengePage() {
  const {message} = AntdApp.useApp();
  const {t, i18n} = useTranslation();
  const [form] = Form.useForm<FinalConfigFormValues>();
  const [state, setState] = useState(initialState);
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "correct" | "incorrect">("all");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const saveLock = useRef(false);
  const language = i18n.language === "en" ? "en" : "vi";

  const refresh = useCallback(async () => {
    setState((current) => ({...current, refreshing: true}));
    const [configResult, submissionsResult, eventConfigResult] = await Promise.allSettled([getAdminFinalConfig(), getAdminFinalSubmissions(), getAdminEventConfig()]);
    setState((current) => {
      const config = configResult.status === "fulfilled" ? parseAdminV2FinalConfig(configResult.value) : null;
      const submissions = submissionsResult.status === "fulfilled" ? parseAdminV2FinalSubmissions(submissionsResult.value) : null;
      const finalStartsAt = eventConfigResult.status === "fulfilled" ? eventFinalStartsAt(eventConfigResult.value) : null;
      if (config) form.setFieldsValue({title: config.title, clueText: config.clueText, isActive: config.isActive, answer: undefined});
      return {config: config ?? current.config, submissions: submissions ?? current.submissions, finalStartsAt: finalStartsAt ?? current.finalStartsAt, configError: !config, submissionsError: !submissions, refreshing: false};
    });
  }, [form]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);

  const save = useCallback(async (values: FinalConfigFormValues) => {
    if (saving || saveLock.current) return;
    saveLock.current = true; setSaving(true); setSaveError(false);
    try { await updateAdminFinalConfig(toFinalConfigUpdate(values)); message.success(t("adminV2.finalChallenge.saveSuccess")); await refresh(); }
    catch { setSaveError(true); message.error(t("adminV2.finalChallenge.saveError")); }
    finally { saveLock.current = false; setSaving(false); }
  }, [message, refresh, saving, t]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(language);
    return (state.submissions ?? []).filter((submission) => {
      const matchesResult = resultFilter === "all" || (resultFilter === "correct" ? submission.isCorrect : !submission.isCorrect);
      const matchesQuery = !normalizedQuery || [submission.team.id.toString(), submission.team.name, getLocalizedTeamName(submission.team.name, language), submission.answerSubmitted].some((value) => value.toLocaleLowerCase(language).includes(normalizedQuery));
      return matchesResult && matchesQuery;
    });
  }, [language, query, resultFilter, state.submissions]);
  const columns = useMemo<TableColumnsType<AdminV2FinalSubmission>>(() => [
    {title: t("adminV2.finalChallenge.columns.team"), key: "team", width: 210, render: (_, submission) => <Space orientation="vertical" size={0}><Typography.Text strong>{getLocalizedTeamName(submission.team.name, language)}</Typography.Text><Typography.Text type="secondary">#{submission.team.id}</Typography.Text></Space>},
    {title: t("adminV2.finalChallenge.columns.answer"), dataIndex: "answerSubmitted", width: 220, render: (answer: string) => <Typography.Text ellipsis={{tooltip: answer}}>{answer}</Typography.Text>},
    {title: t("adminV2.finalChallenge.columns.result"), key: "result", width: 130, render: (_, submission) => <Tag color={submission.isCorrect ? "success" : "error"}>{submission.isCorrect ? t("adminV2.finalChallenge.result.correct") : t("adminV2.finalChallenge.result.incorrect")}</Tag>},
    {title: t("adminV2.finalChallenge.columns.rank"), dataIndex: "winnerRank", align: "right", width: 95, render: (rank: number | null) => rank ?? t("adminV2.finalChallenge.notAvailable")},
    {title: t("adminV2.finalChallenge.columns.points"), dataIndex: "pointsAwarded", align: "right", width: 110},
    {title: t("adminV2.finalChallenge.columns.submittedAt"), dataIndex: "submittedAt", width: 205, render: (value: string) => formatSubmittedAt(value, language)},
  ], [language, t]);
  const isInitialLoading = state.config === null && state.submissions === null && !state.configError && !state.submissionsError;
  const schedule = state.finalStartsAt;

  return <section className="admin-v2-final-challenge" aria-labelledby="admin-v2-final-challenge-title">
    <Flex align="flex-start" className="admin-v2-final-challenge__heading" gap="middle" justify="space-between" wrap><div><Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.nav.operations")}</Typography.Text><Typography.Title id="admin-v2-final-challenge-title" level={1}>{t("adminV2.finalChallenge.title")}</Typography.Title><Typography.Paragraph type="secondary">{t("adminV2.finalChallenge.subtitle")}</Typography.Paragraph></div><Button icon={<ReloadOutlined />} loading={state.refreshing} onClick={() => void refresh()}>{t("adminV2.finalChallenge.refresh")}</Button></Flex>
    {isInitialLoading && <Skeleton active paragraph={{rows: 14}} title />}
    {state.configError && <Alert action={<Button onClick={() => void refresh()}>{t("adminV2.finalChallenge.retry")}</Button>} description={t("adminV2.finalChallenge.configErrorDescription")} showIcon title={t("adminV2.finalChallenge.configError")} type="error" />}
    {state.submissionsError && <Alert action={<Button onClick={() => void refresh()}>{t("adminV2.finalChallenge.retry")}</Button>} description={state.submissions === null ? t("adminV2.finalChallenge.submissionsErrorDescription") : t("adminV2.finalChallenge.submissionsStaleDescription")} showIcon title={state.submissions === null ? t("adminV2.finalChallenge.submissionsError") : t("adminV2.finalChallenge.submissionsStale")} type={state.submissions === null ? "error" : "warning"} />}
    {saveError && <Alert showIcon title={t("adminV2.finalChallenge.saveError")} type="error" />}
    {state.config && <Form form={form} layout="vertical" onFinish={(values) => void save(values)}><Card title={<Space><FlagOutlined />{t("adminV2.finalChallenge.configTitle")}</Space>}><Typography.Paragraph type="secondary">{t("adminV2.finalChallenge.configDescription")}</Typography.Paragraph><div className="admin-v2-final-challenge__summary"><div><Typography.Text type="secondary">{t("adminV2.finalChallenge.opensAt")}</Typography.Text><Typography.Text strong>{schedule ?? t("adminV2.finalChallenge.notAvailable")}</Typography.Text></div><div><Typography.Text type="secondary">{t("adminV2.finalChallenge.maxWinners")}</Typography.Text><Typography.Text strong>{state.config.maxWinners}</Typography.Text></div><div><Typography.Text type="secondary">{t("adminV2.finalChallenge.scoring")}</Typography.Text><Space size={[4, 4]} wrap>{state.config.pointsByRank.map((points, index) => <Tag key={index}>{t("adminV2.finalChallenge.rankPoints", {rank: index + 1, points})}</Tag>)}</Space></div></div><div className="admin-v2-final-challenge__form-grid"><Form.Item label={t("adminV2.finalChallenge.fields.title")} name="title"><Input /></Form.Item><Form.Item label={t("adminV2.finalChallenge.fields.active")} name="isActive" valuePropName="checked"><Checkbox>{t("adminV2.finalChallenge.fields.activeHint")}</Checkbox></Form.Item></div><Form.Item label={t("adminV2.finalChallenge.fields.clue")} name="clueText"><Input.TextArea autoSize={{minRows: 3, maxRows: 6}} /></Form.Item><div className="admin-v2-final-challenge__form-grid"><Form.Item label={t("adminV2.finalChallenge.fields.currentKeyword")}><Input aria-label={t("adminV2.finalChallenge.fields.currentKeyword")} readOnly value={state.config.currentKeyword} /></Form.Item><Form.Item extra={t("adminV2.finalChallenge.fields.answerHint")} label={t("adminV2.finalChallenge.fields.answer")} name="answer" rules={[{validator: (_, value) => isValidOptionalKeywordRotation(value) ? Promise.resolve() : Promise.reject(new Error(t("adminV2.finalChallenge.fields.answerInvalid")))}]}><Input.Password autoComplete="new-password" /></Form.Item></div><Alert description={t("adminV2.finalChallenge.answerSafetyDescription")} showIcon title={t("adminV2.finalChallenge.answerSafetyTitle")} type="info" /><Flex className="admin-v2-final-challenge__form-actions" justify="end"><Button disabled={saving} htmlType="submit" icon={<SaveOutlined />} loading={saving} type="primary">{t("adminV2.finalChallenge.save")}</Button></Flex></Card></Form>}
    {state.submissions !== null && <Card title={t("adminV2.finalChallenge.submissionsTitle", {count: state.submissions.length})}><Flex className="admin-v2-final-challenge__filters" gap="middle" wrap><Input.Search allowClear aria-label={t("adminV2.finalChallenge.searchLabel")} onChange={(event) => setQuery(event.target.value)} placeholder={t("adminV2.finalChallenge.searchPlaceholder")} value={query} /><Select aria-label={t("adminV2.finalChallenge.resultFilter")} onChange={setResultFilter} options={[{label: t("adminV2.finalChallenge.allResults"), value: "all"}, {label: t("adminV2.finalChallenge.result.correct"), value: "correct"}, {label: t("adminV2.finalChallenge.result.incorrect"), value: "incorrect"}]} value={resultFilter} /></Flex><Table className="admin-v2-final-challenge__table" columns={columns} dataSource={rows} locale={{emptyText: <Empty description={state.submissions.length === 0 ? t("adminV2.finalChallenge.empty") : t("adminV2.finalChallenge.noMatches")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}} pagination={{hideOnSinglePage: true, pageSize: 20, showSizeChanger: false}} rowKey="id" scroll={{x: 970}} /></Card>}
  </section>;
}
