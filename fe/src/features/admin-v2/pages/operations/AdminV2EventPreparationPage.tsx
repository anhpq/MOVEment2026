import {DeleteOutlined, QrcodeOutlined, ReloadOutlined, SafetyCertificateOutlined} from "@ant-design/icons";
import {Alert, App as AntdApp, Button, Card, Checkbox, Descriptions, Flex, Input, Modal, Skeleton, Space, Tag, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  getAdminEventPreparation,
  resetAdminGameplay,
  rotateAdminEventPreparationQr,
  type AdminEventPreparationStatus,
} from "../../../movement/api";

type EventPreparationAction = "rotate" | "reset" | null;

const confirmationPhrase = "RESET MOVEMENT2026 GAMEPLAY";

function formatHcmcDate(value: string, language: "vi" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function AdminV2EventPreparationPage() {
  const {message} = AntdApp.useApp();
  const {i18n, t} = useTranslation();
  const language = i18n.language === "en" ? "en" : "vi";
  const [status, setStatus] = useState<AdminEventPreparationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [action, setAction] = useState<EventPreparationAction>(null);
  const [confirmation, setConfirmation] = useState("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientNow, setClientNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setStatus(await getAdminEventPreparation());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setClientNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const resetEnabled = useMemo(() => {
    if (!status?.resetEnabled || !status.inventory.ready) return false;
    const serverNow = new Date(status.serverNow).getTime();
    const cutoff = new Date(status.resetCutoff).getTime();
    if (!Number.isFinite(serverNow) || !Number.isFinite(cutoff)) return false;
    return clientNow + (serverNow - Date.now()) < cutoff;
  }, [clientNow, status]);

  const closeAction = () => {
    if (submitting) return;
    setAction(null);
    setConfirmation("");
    setBackupConfirmed(false);
  };

  const submit = async () => {
    if (!action || submitting) return;
    setSubmitting(true);
    try {
      if (action === "rotate") {
        const result = await rotateAdminEventPreparationQr(confirmation, backupConfirmed);
        message.success(t("adminV2.eventPreparation.rotateSuccess", {teams: result.teamQrTokens, stations: result.stationQrTokens}));
      } else {
        const result = await resetAdminGameplay(confirmation, backupConfirmed);
        message.success(t("adminV2.eventPreparation.resetSuccess", {rows: result.progressRows}));
      }
      setAction(null);
      setConfirmation("");
      setBackupConfirmed(false);
      await refresh();
    } catch {
      message.error(t(action === "rotate" ? "adminV2.eventPreparation.rotateError" : "adminV2.eventPreparation.resetError"));
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const inventory = status?.inventory;
  const canConfirm = confirmation.trim() === confirmationPhrase && backupConfirmed;
  const title = action === "rotate"
    ? t("adminV2.eventPreparation.rotateTitle")
    : t("adminV2.eventPreparation.resetTitle");

  if (loading && !status) return <Skeleton active paragraph={{rows: 11}} title />;
  if (loadError && !status) {
    return <Alert action={<Button onClick={() => void refresh()}>{t("adminV2.eventPreparation.retry")}</Button>} description={t("adminV2.eventPreparation.loadErrorDescription")} showIcon title={t("adminV2.eventPreparation.loadError")} type="error" />;
  }

  return <section className="admin-v2-event-preparation" aria-labelledby="admin-v2-event-preparation-title">
    <Flex className="admin-v2-event-preparation__heading" gap="middle" justify="space-between" wrap>
      <div>
        <Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.nav.operations")}</Typography.Text>
        <Typography.Title id="admin-v2-event-preparation-title" level={1}>{t("adminV2.eventPreparation.title")}</Typography.Title>
        <Typography.Paragraph type="secondary">{t("adminV2.eventPreparation.subtitle")}</Typography.Paragraph>
      </div>
      <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void refresh()}>{t("adminV2.eventPreparation.refresh")}</Button>
    </Flex>

    {loadError && <Alert showIcon title={t("adminV2.eventPreparation.stale")} type="warning" />}
    {inventory && !inventory.ready && <Alert description={inventory.issues.join(", ")} showIcon title={t("adminV2.eventPreparation.inventoryInvalid")} type="error" />}
    {status && !resetEnabled && <Alert description={t("adminV2.eventPreparation.resetClosedDescription", {cutoff: formatHcmcDate(status.resetCutoff, language)})} showIcon title={t("adminV2.eventPreparation.resetClosed")} type="warning" />}

    <Card title={<Space><SafetyCertificateOutlined />{t("adminV2.eventPreparation.inventoryTitle")}</Space>}>
      <Descriptions column={{xs: 1, sm: 2}} items={[
        {key: "teams", label: t("adminV2.eventPreparation.teams"), children: inventory?.teams ?? "—"},
        {key: "stations", label: t("adminV2.eventPreparation.stations"), children: inventory?.activeStations ?? "—"},
        {key: "games", label: t("adminV2.eventPreparation.games"), children: inventory?.activeGames ?? "—"},
        {key: "teamQr", label: t("adminV2.eventPreparation.teamQr"), children: inventory?.activeTeamQrTokens ?? "—"},
        {key: "stationQr", label: t("adminV2.eventPreparation.stationQr"), children: inventory?.activeStationQrTokens ?? "—"},
        {key: "ready", label: t("adminV2.eventPreparation.status"), children: <Tag color={inventory?.ready ? "success" : "error"}>{inventory?.ready ? t("adminV2.eventPreparation.ready") : t("adminV2.eventPreparation.notReady")}</Tag>},
      ]} />
    </Card>

    <div className="admin-v2-event-preparation__actions">
      <Card title={<Space><QrcodeOutlined />{t("adminV2.eventPreparation.rotateCardTitle")}</Space>}>
        <Typography.Paragraph type="secondary">{t("adminV2.eventPreparation.rotateDescription")}</Typography.Paragraph>
        <Button disabled={!inventory?.ready} icon={<QrcodeOutlined />} onClick={() => setAction("rotate")} type="primary">{t("adminV2.eventPreparation.rotate")}</Button>
      </Card>
      <Card className="admin-v2-event-preparation__reset-card" title={<Space><DeleteOutlined />{t("adminV2.eventPreparation.resetCardTitle")}</Space>}>
        <Typography.Paragraph type="secondary">{t("adminV2.eventPreparation.resetDescription", {cutoff: status ? formatHcmcDate(status.resetCutoff, language) : "—"})}</Typography.Paragraph>
        <Button danger disabled={!resetEnabled} icon={<DeleteOutlined />} onClick={() => setAction("reset")}>{t("adminV2.eventPreparation.reset")}</Button>
      </Card>
    </div>

    <Modal destroyOnHidden okButtonProps={{danger: action === "reset", disabled: !canConfirm, loading: submitting}} okText={action === "rotate" ? t("adminV2.eventPreparation.rotate") : t("adminV2.eventPreparation.reset")} onCancel={closeAction} onOk={() => void submit()} open={action !== null} title={title}>
      <Space className="admin-v2-event-preparation__confirmation" direction="vertical" size="middle">
        <Typography.Paragraph>{action === "rotate" ? t("adminV2.eventPreparation.rotateConfirm") : t("adminV2.eventPreparation.resetConfirm")}</Typography.Paragraph>
        <Typography.Text code>{confirmationPhrase}</Typography.Text>
        <Input aria-label={t("adminV2.eventPreparation.confirmationLabel")} onChange={(event) => setConfirmation(event.target.value)} placeholder={t("adminV2.eventPreparation.confirmationPlaceholder")} value={confirmation} />
        <Checkbox checked={backupConfirmed} onChange={(event) => setBackupConfirmed(event.target.checked)}>{t("adminV2.eventPreparation.backupConfirmed")}</Checkbox>
      </Space>
    </Modal>
  </section>;
}
