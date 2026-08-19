import {ArrowLeftOutlined, DownloadOutlined, EditOutlined, QrcodeOutlined} from "@ant-design/icons";
import QRCode from "qrcode";
import {Alert, App as AntdApp, Button, Card, ColorPicker, Descriptions, Divider, Drawer, Empty, Flex, Form, Input, Skeleton, Space, Tag, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {getAdminTeamQrLoginTokens, updateAdminTeam, type AdminQrLoginTokenResponse} from "../../../movement/api";
import {buildTeamQrLoginUrl, cacheTeamQrPayload, getCachedTeamQrToken} from "../../../movement/teamQrTokenCache";
import {normalizeTeamColor} from "../../../movement/teamTheme";
import {getLocalizedTeamName} from "../../../movement/utils";
import {getAdminV2TeamsList, type AdminV2TeamListItem} from "./adminV2TeamsData";

type TeamEditValues = {name: string; username: string; captainName?: string; password?: string; teamColor?: string | null};

function formatDuration(seconds: number, t: (key: string, options?: Record<string, number>) => string) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? t("adminV2.teams.duration.hoursMinutes", {hours, minutes}) : t("adminV2.teams.duration.minutes", {minutes});
}

function qrPayload(teamId: string, token: AdminQrLoginTokenResponse) {
  const cachedToken = getCachedTeamQrToken(teamId);
  return token.qrLoginUrl || token.loginUrl || (token.rawToken ? buildTeamQrLoginUrl(token.rawToken) : "") || (cachedToken ? buildTeamQrLoginUrl(cachedToken) : "");
}

function download(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function AdminV2TeamDetailPage() {
  const {t, i18n} = useTranslation();
  const {message, modal} = AntdApp.useApp();
  const {teamId: teamIdParam} = useParams<{teamId: string}>();
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm<TeamEditValues>();
  const [team, setTeam] = useState<AdminV2TeamListItem | null | undefined>(undefined);
  const [tokens, setTokens] = useState<readonly AdminQrLoginTokenResponse[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrImage, setQrImage] = useState({payload: "", dataUrl: ""});
  const teamId = Number(teamIdParam);
  const editorOpen = location.pathname.endsWith("/edit");
  const qrFocused = location.pathname.endsWith("/qr");
  const language = i18n.language === "en" ? "en" : "vi";

  const refresh = useCallback(async () => {
    if (!Number.isInteger(teamId) || teamId < 1) {
      setTeam(null);
      return;
    }
    setRefreshing(true);
    setLoadError(false);
    setQrError(false);
    try {
      const list = await getAdminV2TeamsList();
      const nextTeam = list.teams.find((item) => item.id === teamId) ?? null;
      setTeam(nextTeam);
      if (nextTeam) {
        try {
          setTokens(await getAdminTeamQrLoginTokens(String(teamId)));
        } catch {
          setTokens([]);
          setQrError(true);
        }
      }
    } catch {
      setLoadError(true);
    } finally {
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const activeToken = useMemo(() => tokens.find((token) => token.status === "ACTIVE"), [tokens]);
  const activePayload = activeToken ? qrPayload(String(teamId), activeToken) : "";
  const qrDataUrl = qrImage.payload === activePayload ? qrImage.dataUrl : "";
  const teamName = team ? getLocalizedTeamName(team.name, language) : "";
  const date = useCallback((value: string | null | undefined) => value ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {dateStyle: "medium", timeStyle: "short"}).format(new Date(value)) : t("adminV2.teams.noActivity"), [language, t]);

  useEffect(() => {
    if (!activePayload) return undefined;
    cacheTeamQrPayload(String(teamId), activePayload);
    let cancelled = false;
    void QRCode.toDataURL(activePayload, {width: 420, margin: 2}).then((dataUrl) => { if (!cancelled) setQrImage({payload: activePayload, dataUrl}); }).catch(() => { if (!cancelled) setQrImage({payload: activePayload, dataUrl: ""}); });
    return () => { cancelled = true; };
  }, [activePayload, teamId]);

  const openEditor = () => {
    if (!team) return;
    form.setFieldsValue({name: team.name, username: team.username, captainName: team.captainName, password: "", teamColor: team.color});
    form.resetFields(["password"]);
    navigate(`/admin-v2/teams/${team.id}/edit`);
  };
  const finishCloseEditor = () => {
    form.resetFields();
    navigate(`/admin-v2/teams/${teamId}`);
  };
  const closeEditor = () => {
    if (form.isFieldsTouched()) {
      modal.confirm({title: t("adminV2.teams.detail.unsavedTitle"), content: t("adminV2.teams.detail.unsavedContent"), okText: t("adminV2.teams.detail.discard"), cancelText: t("common.cancel"), onOk: finishCloseEditor});
      return;
    }
    finishCloseEditor();
  };
  const save = async (values: TeamEditValues) => {
    if (!team) return;
    setSaving(true);
    try {
      await updateAdminTeam(String(team.id), {name: values.name.trim(), username: values.username.trim(), captainName: values.captainName?.trim() || undefined, teamColor: normalizeTeamColor(values.teamColor) ?? null, ...(values.password?.trim() ? {password: values.password} : {})});
      message.success(t("adminV2.teams.detail.saveSuccess"));
      form.resetFields();
      navigate(`/admin-v2/teams/${team.id}`);
      await refresh();
    } catch {
      message.error(t("adminV2.teams.detail.saveError"));
    } finally { setSaving(false); }
  };
  if (team === undefined && !loadError) return <Skeleton active paragraph={{rows: 10}} title />;
  if (loadError) return <Alert action={<Button onClick={() => void refresh()}>{t("adminV2.teams.detail.retry")}</Button>} description={t("adminV2.teams.errorDescription")} showIcon title={t("adminV2.teams.detail.loadError")} type="error" />;
  if (!team) return <Empty description={t("adminV2.teams.detail.notFound")}><Link to="/admin-v2/teams"><Button>{t("adminV2.teams.detail.back")}</Button></Link></Empty>;

  return <section className="admin-v2-team-detail" aria-labelledby="admin-v2-team-detail-title">
    <Flex className="admin-v2-team-detail__heading" gap="middle" justify="space-between" wrap>
      <div><Link className="admin-v2-team-detail__back" to="/admin-v2/teams"><ArrowLeftOutlined /> {t("adminV2.teams.detail.back")}</Link><Flex align="center" gap="small"><span aria-hidden className="admin-v2-team-detail__color" style={{background: team.color ?? undefined}} /><Typography.Title id="admin-v2-team-detail-title" level={1}>{teamName}</Typography.Title></Flex><Typography.Text type="secondary">#{team.id}</Typography.Text></div>
      <Space wrap><Button loading={refreshing} onClick={() => void refresh()}>{t("adminV2.teams.detail.refresh")}</Button><Button icon={<QrcodeOutlined />} onClick={() => navigate(`/admin-v2/teams/${team.id}/qr`)}>{t("adminV2.teams.detail.qrTitle")}</Button><Button aria-label={t("adminV2.teams.detail.edit")} icon={<EditOutlined />} onClick={openEditor} type="primary">{t("adminV2.teams.detail.edit")}</Button></Space>
    </Flex>
    <div className="admin-v2-team-detail__grid">
      <Card title={t("adminV2.teams.detail.information")}><Descriptions column={{xs: 1, sm: 2}} items={[{key: "id", label: t("adminV2.teams.detail.teamId"), children: `#${team.id}`}, {key: "captain", label: t("adminV2.teams.detail.captain"), children: team.captainName || t("adminV2.teams.notAvailable")}, {key: "username", label: t("adminV2.teams.detail.username"), children: team.username}, {key: "color", label: t("adminV2.teams.detail.color"), children: <Space><span aria-hidden className="admin-v2-team-detail__swatch" style={{background: team.color ?? undefined}} />{team.color ?? t("adminV2.teams.notAvailable")}</Space>}]} /></Card>
      <Card title={t("adminV2.teams.detail.performance")}><Descriptions column={{xs: 1, sm: 2}} items={[{key: "score", label: t("adminV2.teams.detail.score"), children: team.totalPoints}, {key: "stations", label: t("adminV2.teams.detail.stations"), children: `${team.completedStations}/${team.stationCount}`}, {key: "time", label: t("adminV2.teams.detail.totalTime"), children: formatDuration(team.totalPlaySeconds, t)}, {key: "activity", label: t("adminV2.teams.detail.activity"), children: t(`adminV2.teams.activity.${team.activityStatus}`)}, {key: "last", label: t("adminV2.teams.detail.lastActivity"), children: date(team.lastActivityAt)}]} /></Card>
      <Card className={`admin-v2-team-detail__qr${qrFocused ? " admin-v2-team-detail__qr--focused" : ""}`} title={<Space><QrcodeOutlined />{t("adminV2.teams.detail.qrTitle")}</Space>}><Typography.Paragraph type="secondary">{t("adminV2.teams.detail.qrDescription")}</Typography.Paragraph>{qrError ? <Alert showIcon title={t("adminV2.teams.detail.qrUnavailable")} type="warning" /> : activeToken ? <><Flex className="admin-v2-team-detail__qr-content" gap="large" wrap><div>{qrDataUrl ? <img alt={`${teamName} QR`} height={208} src={qrDataUrl} width={208} /> : <Skeleton.Image active />}</div><Space direction="vertical" size="small"><Tag color="success">{activeToken.status}</Tag><Typography.Text>{t("adminV2.teams.detail.usage", {count: activeToken.usageCount})}</Typography.Text><Typography.Text type="secondary">{t("adminV2.teams.detail.created", {time: date(activeToken.createdAt)})}</Typography.Text><Typography.Text type="secondary">{activeToken.lastUsedAt ? t("adminV2.teams.detail.lastUsed", {time: date(activeToken.lastUsedAt)}) : t("adminV2.teams.detail.neverUsed")}</Typography.Text><Typography.Text type="secondary">{activeToken.expiresAt ? `${t("adminV2.teams.detail.expires")}: ${date(activeToken.expiresAt)}` : t("adminV2.teams.detail.noExpiry")}</Typography.Text>{qrDataUrl && <Button aria-label={t("adminV2.teams.detail.download")} icon={<DownloadOutlined />} onClick={() => download(qrDataUrl, `team-${team.id}-qr.png`)}>{t("adminV2.teams.detail.download")}</Button>}</Space></Flex><Alert className="admin-v2-team-detail__security" description={t("adminV2.teams.detail.security")} showIcon type="warning" /></> : <Empty description={t("adminV2.teams.detail.qrMissing")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}</Card>
    </div>
    <Drawer destroyOnHidden onClose={closeEditor} open={editorOpen} title={t("adminV2.teams.detail.editTitle")} width={520}><Typography.Paragraph type="secondary">{t("adminV2.teams.detail.editDescription")}</Typography.Paragraph><Form form={form} layout="vertical" onFinish={save}><Form.Item label={t("adminV2.teams.detail.name")} name="name" rules={[{required: true}]}><Input /></Form.Item><Form.Item label={t("adminV2.teams.detail.captain")} name="captainName"><Input /></Form.Item><Form.Item label={t("adminV2.teams.detail.username")} name="username" rules={[{required: true}]}><Input autoComplete="username" /></Form.Item><Form.Item extra={t("adminV2.teams.detail.passwordHint")} label={t("adminV2.teams.detail.password")} name="password"><Input.Password autoComplete="new-password" /></Form.Item><Form.Item label={t("adminV2.teams.detail.color")} name="teamColor"><ColorPicker format="hex" onChangeComplete={(value) => form.setFieldValue("teamColor", value.toHexString())} /></Form.Item><Divider /><Flex justify="end" gap="small"><Button onClick={closeEditor}>{t("common.cancel")}</Button><Button htmlType="submit" loading={saving} type="primary">{t("adminV2.teams.detail.save")}</Button></Flex></Form></Drawer>
  </section>;
}
