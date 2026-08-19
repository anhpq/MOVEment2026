import {ArrowLeftOutlined, DownloadOutlined, EditOutlined, PlusOutlined, QrcodeOutlined} from "@ant-design/icons";
import QRCode from "qrcode";
import {Alert, App as AntdApp, Button, Card, Descriptions, Divider, Drawer, Empty, Flex, Form, Image, Input, InputNumber, Select, Skeleton, Space, Tag, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {getAdminProgressMatrix, getAdminStationQrTokens, updateAdminStation, type AdminStationQrTokenResponse, type AdminStationUpdateInput} from "../../../movement/api";
import {getCachedStationQrToken, cacheStationQrTokens} from "../../../movement/stationQrTokenCache";
import type {GameType, StationTrackingMode} from "../../../movement/types";
import {getStationDisplayCode} from "../../../movement/utils";

type Station = Awaited<ReturnType<typeof getAdminProgressMatrix>>["stations"][number];
type StationFormValues = Required<Pick<AdminStationUpdateInput, "name" | "nameEn" | "trackingMode" | "mapX" | "mapY" | "gameType" | "maxPoints">> & {description?: string; descriptionEn?: string; mediaUrl?: string; imageUrls: string[]};
type QrPreview = Readonly<{token: AdminStationQrTokenResponse; dataUrl: string}>;

function download(dataUrl: string, filename: string) { const link = document.createElement("a"); link.href = dataUrl; link.download = filename; link.click(); }
function isHttpsUrl(value: string) { try { return new URL(value).protocol === "https:"; } catch { return false; } }

export function AdminV2StationDetailPage() {
  const {t, i18n} = useTranslation();
  const {message} = AntdApp.useApp();
  const {stationId} = useParams<{stationId: string}>();
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm<StationFormValues>();
  const [station, setStation] = useState<Station | null | undefined>(undefined);
  const [tokens, setTokens] = useState<readonly AdminStationQrTokenResponse[]>([]);
  const [previews, setPreviews] = useState<readonly QrPreview[]>([]);
  const [playingTeamCount, setPlayingTeamCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorOpen = location.pathname.endsWith("/edit");
  const qrFocused = location.pathname.endsWith("/qr");
  const language = i18n.language === "en" ? "en" : "vi";
  const displayName = station ? (language === "en" ? station.nameEn || station.name : station.name) : "";
  const date = useCallback((value: string | null | undefined) => value ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {dateStyle: "medium", timeStyle: "short"}).format(new Date(value)) : t("adminV2.stations.notAvailable"), [language, t]);

  const refresh = useCallback(async () => {
    if (!stationId) { setStation(null); return; }
    setRefreshing(true); setLoadError(false); setQrError(false);
    try {
      const matrix = await getAdminProgressMatrix();
      const nextStation = matrix.stations.find((item) => item.id === stationId) ?? null;
      setStation(nextStation);
      const stationIndex = matrix.stations.findIndex((item) => item.id === stationId);
      setPlayingTeamCount(stationIndex < 0 ? 0 : matrix.rows.filter((row) => {
        const status = row.cells[stationIndex]?.status;
        return status === "CHECKED_IN" || status === "PLAYING";
      }).length);
      if (nextStation) {
        try { setTokens(await getAdminStationQrTokens(nextStation.id)); } catch { setTokens([]); setQrError(true); }
      }
    } catch { setLoadError(true); } finally { setRefreshing(false); }
  }, [stationId]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  useEffect(() => {
    let cancelled = false;
    const active = tokens.filter((token) => token.status === "ACTIVE").map((token) => ({...token, rawToken: token.rawToken ?? getCachedStationQrToken(token.stationId, token.purpose)})).filter((token) => token.rawToken);
    cacheStationQrTokens(stationId ?? "", active);
    void Promise.all(active.map(async (token) => ({token, dataUrl: await QRCode.toDataURL(token.rawToken ?? "", {width: 420, margin: 2})}))).then((value) => { if (!cancelled) setPreviews(value); }).catch(() => { if (!cancelled) setPreviews([]); });
    return () => { cancelled = true; };
  }, [stationId, tokens]);

  const openEditor = () => navigate(`/admin-v2/stations/${stationId ?? ""}/edit`);
  const closeEditor = () => { form.resetFields(); navigate(`/admin-v2/stations/${stationId ?? ""}`); };
  const save = async (values: StationFormValues) => {
    if (!station) return;
    setSaving(true);
    try {
      await updateAdminStation(station.id, {name: values.name.trim(), nameEn: values.nameEn.trim(), description: values.description?.trim() || null, descriptionEn: values.descriptionEn?.trim() || null, trackingMode: values.trackingMode, gameType: values.gameType, maxPoints: values.maxPoints, mediaUrl: values.mediaUrl?.trim() || null, mapX: values.mapX, mapY: values.mapY, imageUrls: values.imageUrls.map((url) => url.trim())});
      message.success(t("adminV2.stations.detail.saveSuccess")); closeEditor(); await refresh();
    } catch { message.error(t("adminV2.stations.detail.saveError")); } finally { setSaving(false); }
  };
  useEffect(() => { if (station && editorOpen) form.setFieldsValue({name: station.name, nameEn: station.nameEn, description: station.description ?? "", descriptionEn: station.descriptionEn ?? "", trackingMode: station.trackingMode, gameType: station.games?.[0]?.type ?? "STANDARD", maxPoints: station.games?.[0]?.maxPoints ?? 0, mediaUrl: station.games?.[0]?.mediaUrl ?? "", mapX: station.mapX ?? 0, mapY: station.mapY ?? 0, imageUrls: station.imageUrls ?? []}); }, [editorOpen, form, station]);

  const qrByPurpose = useMemo(() => new Map(previews.map((preview) => [preview.token.purpose, preview])), [previews]);
  if (station === undefined && !loadError) return <Skeleton active paragraph={{rows: 12}} title />;
  if (loadError) return <Alert action={<Button onClick={() => void refresh()}>{t("adminV2.stations.detail.retry")}</Button>} description={t("adminV2.stations.errorDescription")} showIcon title={t("adminV2.stations.detail.loadError")} type="error" />;
  if (!station) return <Empty description={t("adminV2.stations.detail.notFound")}><Link to="/admin-v2/stations"><Button>{t("adminV2.stations.detail.back")}</Button></Link></Empty>;
  const game = station.games?.[0];
  const purposeLabel = (purpose: AdminStationQrTokenResponse["purpose"]) => t(`adminV2.stations.detail.${purpose === "CHECK_IN" ? "checkIn" : "checkOut"}`);
  const qrPanel = (purpose: AdminStationQrTokenResponse["purpose"]) => {
    const token = tokens.find((item) => item.purpose === purpose && item.status === "ACTIVE") ?? tokens.find((item) => item.purpose === purpose);
    const preview = qrByPurpose.get(purpose);
    return <Card key={purpose} className="admin-v2-station-detail__qr-card" title={<Space><QrcodeOutlined />{purposeLabel(purpose)}</Space>}><Space direction="vertical" size="small"><Tag color={token?.status === "ACTIVE" ? "success" : "default"}>{token?.status === "ACTIVE" ? t("adminV2.stations.detail.active") : token ? t("adminV2.stations.detail.inactive") : t("adminV2.stations.detail.qrMissing", {purpose: purposeLabel(purpose)})}</Tag>{token && <Typography.Text type="secondary">{t("adminV2.stations.detail.created", {time: date(token.createdAt)})}</Typography.Text>}{token?.updatedAt && <Typography.Text type="secondary">{t("adminV2.stations.detail.updated", {time: date(token.updatedAt)})}</Typography.Text>}{token?.expiresAt ? <Typography.Text type="secondary">{t("adminV2.stations.detail.expires", {time: date(token.expiresAt)})}</Typography.Text> : token && <Typography.Text type="secondary">{t("adminV2.stations.detail.noExpiry")}</Typography.Text>}{preview ? <><Image alt={`${displayName} ${purposeLabel(purpose)} QR`} preview src={preview.dataUrl} width={208} /> <Button icon={<DownloadOutlined />} onClick={() => download(preview.dataUrl, `station-${station.id}-${purpose.toLowerCase()}-qr.png`)}>{t("adminV2.stations.detail.download")}</Button></> : token?.status === "ACTIVE" && <Alert description={t("adminV2.stations.detail.previewUnavailable")} showIcon type="info" />}</Space></Card>;
  };

  return <section className="admin-v2-station-detail" aria-labelledby="admin-v2-station-detail-title">
    <Flex className="admin-v2-station-detail__heading" gap="middle" justify="space-between" wrap><div><Link className="admin-v2-station-detail__back" to="/admin-v2/stations"><ArrowLeftOutlined /> {t("adminV2.stations.detail.back")}</Link><Typography.Title id="admin-v2-station-detail-title" level={1}>{getStationDisplayCode(station.id)} · {displayName}</Typography.Title><Typography.Text type="secondary">{station.id}</Typography.Text></div><Space wrap><Button loading={refreshing} onClick={() => void refresh()}>{t("adminV2.stations.detail.refresh")}</Button><Button icon={<QrcodeOutlined />} onClick={() => navigate(`/admin-v2/stations/${station.id}/qr`)}>{t("adminV2.stations.detail.qr")}</Button><Button icon={<EditOutlined />} onClick={openEditor} type="primary">{t("adminV2.stations.detail.edit")}</Button></Space></Flex>
    <div className="admin-v2-station-detail__grid"><Card title={t("adminV2.stations.detail.information")}><Descriptions column={{xs: 1, sm: 2}} items={[{key: "id", label: t("adminV2.stations.detail.stationId"), children: station.id}, {key: "playing", label: t("adminV2.stations.detail.playingTeams"), children: playingTeamCount}, {key: "nameVi", label: t("adminV2.stations.detail.nameVi"), children: station.name}, {key: "nameEn", label: t("adminV2.stations.detail.nameEn"), children: station.nameEn}, {key: "descriptionVi", label: t("adminV2.stations.detail.descriptionVi"), children: station.description || t("adminV2.stations.detail.noDescription")}, {key: "descriptionEn", label: t("adminV2.stations.detail.descriptionEn"), children: station.descriptionEn || t("adminV2.stations.detail.noDescription")}]} /></Card><Card title={t("adminV2.stations.detail.gameplay")}><Descriptions column={{xs: 1, sm: 2}} items={[{key: "type", label: t("adminV2.stations.detail.gameType"), children: game?.type ?? t("adminV2.stations.notAvailable")}, {key: "tracking", label: t("adminV2.stations.detail.trackingMode"), children: station.trackingMode}, {key: "points", label: t("adminV2.stations.detail.maxPoints"), children: game?.maxPoints ?? t("adminV2.stations.notAvailable")}, {key: "video", label: t("adminV2.stations.detail.youtube"), children: game?.mediaUrl ? <a href={game.mediaUrl} rel="noreferrer" target="_blank">{game.mediaUrl}</a> : t("adminV2.stations.detail.noVideo")}]} /></Card><Card title={t("adminV2.stations.detail.media")}><Typography.Paragraph type="secondary">{t("adminV2.stations.detail.images")}</Typography.Paragraph>{station.imageUrls.length ? <Image.PreviewGroup><Flex gap="small" wrap>{station.imageUrls.map((url) => <Image alt="" className="admin-v2-station-detail__image" key={url} src={url} width={120} />)}</Flex></Image.PreviewGroup> : <Empty description={t("adminV2.stations.detail.noImages")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}</Card><Card title={t("adminV2.stations.detail.map")}><Descriptions column={{xs: 1, sm: 2}} items={[{key: "x", label: t("adminV2.stations.detail.mapX"), children: station.mapX ?? t("adminV2.stations.notAvailable")}, {key: "y", label: t("adminV2.stations.detail.mapY"), children: station.mapY ?? t("adminV2.stations.notAvailable")}]} /></Card><Card className={qrFocused ? "admin-v2-station-detail__qr admin-v2-station-detail__qr--focused" : "admin-v2-station-detail__qr"} title={t("adminV2.stations.detail.qrTitle")}><Typography.Paragraph type="secondary">{t("adminV2.stations.detail.qrDescription")}</Typography.Paragraph>{qrError ? <Alert showIcon title={t("adminV2.stations.detail.qrUnavailable")} type="warning" /> : <Flex gap="middle" wrap>{qrPanel("CHECK_IN")}{qrPanel("CHECK_OUT")}</Flex>}</Card></div>
    <Drawer destroyOnHidden onClose={closeEditor} open={editorOpen} title={t("adminV2.stations.detail.editTitle")} width={540}><Typography.Paragraph type="secondary">{t("adminV2.stations.detail.editDescription")}</Typography.Paragraph><Form form={form} layout="vertical" onFinish={save}><Form.Item label={t("adminV2.stations.detail.stationId")}><Input disabled value={station.id} /></Form.Item><Divider>{t("adminV2.stations.detail.information")}</Divider><Form.Item label={t("adminV2.stations.detail.nameVi")} name="name" rules={[{required: true, message: t("adminV2.stations.detail.required")}, {max: 120}]}><Input /></Form.Item><Form.Item label={t("adminV2.stations.detail.descriptionVi")} name="description" rules={[{max: 500}]}><Input.TextArea autoSize={{minRows: 2, maxRows: 5}} /></Form.Item><Form.Item label={t("adminV2.stations.detail.nameEn")} name="nameEn" rules={[{required: true, message: t("adminV2.stations.detail.required")}, {max: 120}]}><Input /></Form.Item><Form.Item label={t("adminV2.stations.detail.descriptionEn")} name="descriptionEn" rules={[{max: 500}]}><Input.TextArea autoSize={{minRows: 2, maxRows: 5}} /></Form.Item><Divider>{t("adminV2.stations.detail.gameplay")}</Divider><Form.Item label={t("adminV2.stations.detail.trackingMode")} name="trackingMode" rules={[{required: true, message: t("adminV2.stations.detail.required")}]}><Select options={(["SCORE", "TIME", "BOTH"] satisfies StationTrackingMode[]).map((value) => ({label: value, value}))} /></Form.Item><Form.Item label={t("adminV2.stations.detail.gameType")} name="gameType" rules={[{required: true, message: t("adminV2.stations.detail.required")}]}><Select options={(["ST", "STANDARD"] satisfies GameType[]).map((value) => ({label: value === "STANDARD" ? "Standard" : value, value}))} /></Form.Item><Form.Item label={t("adminV2.stations.detail.maxPoints")} name="maxPoints" rules={[{required: true, message: t("adminV2.stations.detail.required")}]}><InputNumber min={0} precision={0} style={{width: "100%"}} /></Form.Item><Form.Item dependencies={["gameType"]} label={t("adminV2.stations.detail.youtube")} name="mediaUrl" rules={[{type: "url", message: t("adminV2.stations.detail.validUrl")}, ({getFieldValue}) => ({validator: async (_, value) => { if (getFieldValue("gameType") !== "ST" || value?.trim()) return; throw new Error(t("adminV2.stations.detail.stVideoRequired")); }})]}><Input /></Form.Item><Divider>{t("adminV2.stations.detail.media")}</Divider><Form.List name="imageUrls">{(fields, {add, remove}) => <Space direction="vertical" size="small" style={{width: "100%"}}>{fields.map((field) => <Flex gap="small" key={field.key}><Form.Item {...field} rules={[{required: true, message: t("adminV2.stations.detail.required")}, {validator: async (_, value) => { if (!isHttpsUrl(value ?? "")) throw new Error(t("adminV2.stations.detail.httpsImage")); const urls = form.getFieldValue("imageUrls") as string[]; if (urls.filter((url) => url === value).length > 1) throw new Error(t("adminV2.stations.detail.duplicateImage")); }}]} style={{flex: 1, marginBottom: 0}}><Input placeholder={t("adminV2.stations.detail.imageUrl")} /></Form.Item><Button danger onClick={() => remove(field.name)}>{t("adminV2.stations.detail.removeImage")}</Button></Flex>)}<Typography.Text type="secondary">{t("adminV2.stations.detail.imageHelp")}</Typography.Text><Button disabled={fields.length >= 10} icon={<PlusOutlined />} onClick={() => add("")}>{t("adminV2.stations.detail.addImage")}</Button></Space>}</Form.List><Divider>{t("adminV2.stations.detail.map")}</Divider><Typography.Paragraph type="secondary">{t("adminV2.stations.detail.mapHint")}</Typography.Paragraph><Form.Item label={t("adminV2.stations.detail.mapX")} name="mapX" rules={[{required: true, message: t("adminV2.stations.detail.required")}]}><InputNumber max={100} min={0} style={{width: "100%"}} /></Form.Item><Form.Item label={t("adminV2.stations.detail.mapY")} name="mapY" rules={[{required: true, message: t("adminV2.stations.detail.required")}]}><InputNumber max={100} min={0} style={{width: "100%"}} /></Form.Item><Divider /><Flex className="admin-v2-station-detail__form-actions" gap="small" justify="end"><Button onClick={closeEditor}>{t("adminV2.stations.detail.cancel")}</Button><Button htmlType="submit" loading={saving} type="primary">{t("adminV2.stations.detail.save")}</Button></Flex></Form></Drawer>
  </section>;
}
