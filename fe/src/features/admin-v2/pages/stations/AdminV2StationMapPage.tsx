import {EnvironmentOutlined, SaveOutlined, SearchOutlined} from "@ant-design/icons";
import {Alert, Button, Card, Empty, Flex, Input, Select, Skeleton, Space, Tooltip, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState, type MouseEvent} from "react";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {updateAdminStation} from "../../../movement/api";
import {getStationDisplayCode} from "../../../movement/utils";
import {getAdminV2StationsList, type AdminV2StationListItem} from "./adminV2StationsData";

type Coordinate = Readonly<{x: number; y: number}>;
type MapState = Readonly<{stations: readonly AdminV2StationListItem[] | null; error: boolean; refreshing: boolean}>;

const initialState: MapState = {stations: null, error: false, refreshing: false};
const emptyStations: readonly AdminV2StationListItem[] = [];
const isCoordinate = (value: number | null): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
const toMapPercent = (offset: number, length: number) => Math.max(0, Math.min(100, (offset / length) * 100));

export function AdminV2StationMapPage() {
  const {t, i18n} = useTranslation();
  const [state, setState] = useState(initialState);
  const [selectedId, setSelectedId] = useState<string>();
  const [drafts, setDrafts] = useState<Record<string, Coordinate>>({});
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setState((current) => ({...current, refreshing: true, error: false}));
    try {
      const result = await getAdminV2StationsList();
      setState({stations: result.stations, error: false, refreshing: false});
      setSelectedId((current) => current && result.stations.some((station) => station.id === current) ? current : result.stations[0]?.id);
    } catch {
      setState((current) => ({...current, error: true, refreshing: false}));
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  const stations = state.stations ?? emptyStations;
  const selected = stations.find((station) => station.id === selectedId) ?? null;
  const selectedCoordinate = selected ? drafts[selected.id] ?? (isCoordinate(selected.mapX) && isCoordinate(selected.mapY) ? {x: selected.mapX, y: selected.mapY} : null) : null;
  const hasDraft = selected ? Boolean(drafts[selected.id]) : false;
  const language = i18n.language === "en" ? "en" : "vi";
  const filteredStations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language);
    return stations.filter((station) => !normalized || [station.id, getStationDisplayCode(station.id), station.name, station.nameEn].some((value) => value.toLocaleLowerCase(language).includes(normalized)));
  }, [language, query, stations]);

  const selectStation = (id: string) => { setSelectedId(id); setQuery(""); };
  const setDraftFromMap = (event: MouseEvent<HTMLDivElement>) => {
    if (!selected) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = toMapPercent(event.clientX - bounds.left, bounds.width);
    const y = toMapPercent(event.clientY - bounds.top, bounds.height);
    setDrafts((current) => ({...current, [selected.id]: {x, y}}));
  };
  const save = async () => {
    if (!selected || !hasDraft || !selectedCoordinate) return;
    setState((current) => ({...current, refreshing: true}));
    try {
      await updateAdminStation(selected.id, {mapX: selectedCoordinate.x, mapY: selectedCoordinate.y});
      setDrafts((current) => { const next = {...current}; delete next[selected.id]; return next; });
      await refresh();
    } catch {
      setState((current) => ({...current, refreshing: false, error: true}));
    }
  };
  const cancel = () => selected && setDrafts((current) => { const next = {...current}; delete next[selected.id]; return next; });

  return <section className="admin-v2-station-map" aria-labelledby="admin-v2-station-map-title">
    <Flex align="flex-start" className="admin-v2-station-map__heading" gap="middle" justify="space-between" wrap>
      <div><Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text><Typography.Title id="admin-v2-station-map-title" level={1}>{t("adminV2.stations.mapPage.title")}</Typography.Title><Typography.Paragraph type="secondary">{t("adminV2.stations.mapPage.description", {count: stations.length})}</Typography.Paragraph></div>
      <Button loading={state.refreshing} onClick={() => void refresh()}>{t("adminV2.stations.refresh")}</Button>
    </Flex>
    {state.error && <Alert action={<Button size="small" onClick={() => void refresh()}>{t("adminV2.stations.retry")}</Button>} description={t("adminV2.stations.mapPage.errorDescription")} showIcon title={t("adminV2.stations.mapPage.error")} type="error" />}
    {state.stations === null && !state.error ? <Skeleton active paragraph={{rows: 9}} /> : stations.length === 0 ? <Empty description={t("adminV2.stations.empty")} /> : <div className="admin-v2-station-map__layout">
      <Card className="admin-v2-station-map__controls" title={t("adminV2.stations.mapPage.selectorTitle")}>
        <Space direction="vertical" size="middle" style={{width: "100%"}}>
          <Input allowClear aria-label={t("adminV2.stations.mapPage.searchLabel")} onChange={(event) => setQuery(event.target.value)} placeholder={t("adminV2.stations.mapPage.searchPlaceholder")} prefix={<SearchOutlined />} value={query} />
          <Select aria-label={t("adminV2.stations.mapPage.selectorTitle")} onChange={selectStation} options={filteredStations.map((station) => ({value: station.id, label: `${getStationDisplayCode(station.id)} · ${language === "en" ? station.nameEn || station.name : station.name}`}))} showSearch={false} value={selected?.id} />
          <div className="admin-v2-station-map__station-list">{filteredStations.map((station) => <Button block className={station.id === selected?.id ? "is-selected" : ""} key={station.id} onClick={() => selectStation(station.id)} type="text">{getStationDisplayCode(station.id)} · {language === "en" ? station.nameEn || station.name : station.name}</Button>)}</div>
        </Space>
      </Card>
      <Card className="admin-v2-station-map__map-card" title={t("adminV2.stations.mapPage.mapTitle")}>
        <Alert className="admin-v2-station-map__hint" description={t("adminV2.stations.mapPage.editHint")} showIcon type="info" />
        <div aria-label={t("adminV2.stations.mapPage.mapTitle")} className="admin-v2-station-map__canvas" onClick={setDraftFromMap} role="application">
          <picture><source srcSet="/images/map/suoitien-map-1280.webp 1280w, /images/map/suoitien-map-1920.webp 1920w, /images/map/suoitien-map-2950.webp 2950w" sizes="(max-width: 768px) 100vw, 75vw" type="image/webp" /><img alt="" src="/images/map/suoitien-map-1920.webp" /></picture>
          {stations.map((station) => {
            const coordinate = drafts[station.id] ?? (isCoordinate(station.mapX) && isCoordinate(station.mapY) ? {x: station.mapX, y: station.mapY} : null);
            if (!coordinate) return null;
            const label = getStationDisplayCode(station.id);
            return <Tooltip key={station.id} title={`${label} · ${language === "en" ? station.nameEn || station.name : station.name}`}><button aria-label={t("adminV2.stations.mapPage.selectMarker", {station: label})} className={`admin-v2-station-map__marker ${station.id === selected?.id ? "is-selected" : ""} ${drafts[station.id] ? "is-pending" : ""}`} onClick={(event) => { event.stopPropagation(); selectStation(station.id); }} style={{left: `${coordinate.x}%`, top: `${coordinate.y}%`}} type="button">{label}</button></Tooltip>;
          })}
        </div>
      </Card>
      {selected && <Card className="admin-v2-station-map__info" title={t("adminV2.stations.mapPage.infoTitle")}>
        <Space direction="vertical" size="small" style={{width: "100%"}}><Typography.Title level={4}>{getStationDisplayCode(selected.id)} · {language === "en" ? selected.nameEn || selected.name : selected.name}</Typography.Title><Typography.Text type="secondary">{selected.id}</Typography.Text><Typography.Text>{t("adminV2.stations.mapPage.coordinates", {x: selectedCoordinate?.x.toFixed(2) ?? "—", y: selectedCoordinate?.y.toFixed(2) ?? "—"})}</Typography.Text>{hasDraft && <Typography.Text type="warning">{t("adminV2.stations.mapPage.pending")}</Typography.Text>}<Flex gap="small" wrap><Button aria-label={t("adminV2.stations.mapPage.save")} disabled={!hasDraft} loading={state.refreshing} icon={<SaveOutlined />} onClick={() => void save()} type="primary">{t("adminV2.stations.mapPage.save")}</Button><Button aria-label={t("adminV2.stations.mapPage.cancel")} disabled={!hasDraft} onClick={cancel}>{t("adminV2.stations.mapPage.cancel")}</Button><Link to={`/admin-v2/stations/${selected.id}/edit`}><Button aria-label={t("adminV2.stations.mapPage.editStation")} icon={<EnvironmentOutlined />}>{t("adminV2.stations.mapPage.editStation")}</Button></Link></Flex></Space>
      </Card>}
    </div>}
  </section>;
}
