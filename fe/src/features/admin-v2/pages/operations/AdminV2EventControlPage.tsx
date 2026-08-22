import {ClockCircleOutlined, SaveOutlined} from "@ant-design/icons";
import dayjs, {type Dayjs} from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {Alert, App as AntdApp, Button, Card, Divider, Flex, Form, Input, InputNumber, Skeleton, Space, TimePicker, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {getAdminEventConfig, updateAdminEventConfig} from "../../../movement/api";
import {formatAdminV2ServerTime, parseAdminV2EventConfig, type AdminV2EventConfig} from "./adminV2EventControlData";
import {validCancelCooldownMinutes, validNotifyBeforeMinutes, validTimezone} from "./eventControlValidation";

type EventControlFormValues = Readonly<{
  eventEndTime: Dayjs;
  finalStartsAt: Dayjs;
  notifyBeforeMinutes: number;
  cancelCooldownMinutes: number;
  timezone: string;
}>;

type ServerClock = Readonly<{
  serverNow: string;
  receivedAt: number;
}>;

const time = (value: string) => dayjs(value, "HH:mm", true);
dayjs.extend(customParseFormat);
const timeValue = (value: Dayjs) => value.format("HH:mm");

export function AdminV2EventControlPage() {
  const {i18n, t} = useTranslation();
  const {message} = AntdApp.useApp();
  const [form] = Form.useForm<EventControlFormValues>();
  const [config, setConfig] = useState<AdminV2EventConfig | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [serverClock, setServerClock] = useState<ServerClock | null>(null);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const eventEndTime = Form.useWatch("eventEndTime", form);
  const finalStartsAt = Form.useWatch("finalStartsAt", form);
  const currentEnd = eventEndTime?.isValid() ? timeValue(eventEndTime) : config?.eventEndTime;
  const currentFinal = finalStartsAt?.isValid() ? timeValue(finalStartsAt) : config?.finalStartsAt;

  const refresh = useCallback(async () => {
    setLoading(true); setLoadError(false);
    try {
      const next = parseAdminV2EventConfig(await getAdminEventConfig());
      if (!next) throw new Error("invalid event configuration");
      setConfig(next);
      setServerClock(next.serverNow ? {serverNow: next.serverNow, receivedAt: Date.now()} : null);
      form.setFieldsValue({eventEndTime: time(next.eventEndTime), finalStartsAt: time(next.finalStartsAt), notifyBeforeMinutes: next.notifyBeforeMinutes, cancelCooldownMinutes: next.cancelCooldownMinutes, timezone: next.timezone});
    } catch { setLoadError(true); } finally { setLoading(false); }
  }, [form]);

  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);

  useEffect(() => {
    if (!serverClock) return undefined;
    const timer = window.setInterval(() => setClockTick(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [serverClock]);

  const phase = useMemo(() => {
    if (!config) return null;
    if (config.isPastFinalStart) return "finalStarted";
    if (config.isPastEventEnd) return "stationClosed";
    return "stationOpen";
  }, [config]);
  const displayedServerNow = useMemo(() => {
    if (!config || !serverClock) return undefined;
    const sourceTime = new Date(serverClock.serverNow).getTime();
    if (!Number.isFinite(sourceTime)) return undefined;
    return formatAdminV2ServerTime(
      new Date(sourceTime + Math.max(0, clockTick - serverClock.receivedAt)).toISOString(),
      config.timezone,
      i18n.language,
    );
  }, [clockTick, config, i18n.language, serverClock]);

  const save = async (values: EventControlFormValues) => {
    if (saving) return;
    setSaving(true); setSaveError(false);
    try {
      await updateAdminEventConfig({eventEndTime: timeValue(values.eventEndTime), finalStartsAt: timeValue(values.finalStartsAt), notifyBeforeMinutes: values.notifyBeforeMinutes, cancelCooldownMinutes: values.cancelCooldownMinutes, timezone: values.timezone.trim()});
      message.success(t("adminV2.eventControl.saveSuccess"));
      await refresh();
    } catch { setSaveError(true); message.error(t("adminV2.eventControl.saveError")); } finally { setSaving(false); }
  };

  if (loading && !config) return <Skeleton active paragraph={{rows: 12}} title />;
  if (loadError && !config) return <Alert action={<Button onClick={() => void refresh()}>{t("adminV2.eventControl.retry")}</Button>} description={t("adminV2.eventControl.loadErrorDescription")} showIcon title={t("adminV2.eventControl.loadError")} type="error" />;

  return <section className="admin-v2-event-control" aria-labelledby="admin-v2-event-control-title">
    <Flex className="admin-v2-event-control__heading" gap="middle" justify="space-between" wrap>
      <div><Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.nav.operations")}</Typography.Text><Typography.Title id="admin-v2-event-control-title" level={1}>{t("adminV2.eventControl.title")}</Typography.Title><Typography.Paragraph type="secondary">{t("adminV2.eventControl.subtitle")}</Typography.Paragraph></div>
      <Button loading={loading} onClick={() => void refresh()}>{t("adminV2.eventControl.refresh")}</Button>
    </Flex>
    {loadError && <Alert showIcon title={t("adminV2.eventControl.stale")} type="warning" />}
    {saveError && <Alert showIcon title={t("adminV2.eventControl.saveError")} type="error" />}
    <Form form={form} layout="vertical" onFinish={save}>
      <Card title={<Space><ClockCircleOutlined />{t("adminV2.eventControl.timeline.title")}</Space>}>
        <Typography.Paragraph type="secondary">{t("adminV2.eventControl.timeline.description")}</Typography.Paragraph>
        <div className="admin-v2-event-control__timeline">
          <div><Typography.Text type="secondary">{t("adminV2.eventControl.stationAccess.closeAt")}</Typography.Text><Typography.Title level={2}>{currentEnd ?? "—"}</Typography.Title></div>
          <div className="admin-v2-event-control__timeline-gap"><span aria-hidden="true">↓</span></div>
          <div><Typography.Text type="secondary">{t("adminV2.eventControl.finalTiming.opensAt")}</Typography.Text><Typography.Title level={2}>{currentFinal ?? "—"}</Typography.Title></div>
        </div>
        {phase && <Alert showIcon type="info" title={t(`adminV2.eventControl.phase.${phase}`)} description={displayedServerNow ? t("adminV2.eventControl.serverNow", {serverNow: displayedServerNow, timezone: config?.timezone}) : undefined} />}
      </Card>

      <div className="admin-v2-event-control__grid">
        <Card title={t("adminV2.eventControl.stationAccess.title")}><Typography.Paragraph type="secondary">{t("adminV2.eventControl.stationAccess.description")}</Typography.Paragraph><Form.Item label={t("adminV2.eventControl.stationAccess.closeAt")} name="eventEndTime" rules={[{required: true, message: t("adminV2.eventControl.requiredTime")}]}><TimePicker allowClear={false} format="HH:mm" minuteStep={1} style={{width: "100%"}} /></Form.Item></Card>
        <Card title={t("adminV2.eventControl.finalTiming.title")}><Typography.Paragraph type="secondary">{t("adminV2.eventControl.finalTiming.description")}</Typography.Paragraph><Form.Item label={t("adminV2.eventControl.finalTiming.opensAt")} name="finalStartsAt" rules={[{required: true, message: t("adminV2.eventControl.requiredTime")}]}><TimePicker allowClear={false} format="HH:mm" minuteStep={1} style={{width: "100%"}} /></Form.Item></Card>
      </div>
      <Card title={t("adminV2.eventControl.notifications.title")}><Typography.Paragraph type="secondary">{t("adminV2.eventControl.notifications.description")}</Typography.Paragraph><Flex gap="middle" wrap><Form.Item label={t("adminV2.eventControl.notifications.notifyBefore")} name="notifyBeforeMinutes" rules={[{required: true, message: t("adminV2.eventControl.notifications.notifyBounds")}, {validator: async (_, value) => { if (validNotifyBeforeMinutes(value)) return; throw new Error(t("adminV2.eventControl.notifications.notifyBounds")); }}]}><InputNumber min={1} precision={0} style={{width: "100%"}} /></Form.Item><Form.Item label={t("adminV2.eventControl.notifications.cooldown")} name="cancelCooldownMinutes" rules={[{required: true, message: t("adminV2.eventControl.notifications.cooldownBounds")}, {validator: async (_, value) => { if (validCancelCooldownMinutes(value)) return; throw new Error(t("adminV2.eventControl.notifications.cooldownBounds")); }}]}><InputNumber min={0} precision={0} style={{width: "100%"}} /></Form.Item></Flex></Card>
      <Card title={t("adminV2.eventControl.timezone.title")}><Typography.Paragraph type="secondary">{t("adminV2.eventControl.timezone.description")}</Typography.Paragraph><Form.Item label={t("adminV2.eventControl.timezone.label")} name="timezone" rules={[{required: true, message: t("adminV2.eventControl.timezone.required")}, {validator: async (_, value) => { if (validTimezone(value ?? "")) return; throw new Error(t("adminV2.eventControl.timezone.invalid")); }}]}><Input autoComplete="off" /></Form.Item></Card>
      <Divider />
      <Flex className="admin-v2-event-control__form-actions" justify="end"><Button disabled={saving} htmlType="submit" icon={<SaveOutlined />} loading={saving} type="primary">{t("adminV2.eventControl.save")}</Button></Flex>
    </Form>
  </section>;
}
