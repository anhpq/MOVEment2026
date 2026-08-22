import {CrownFilled, FileExcelOutlined, QrcodeOutlined, SearchOutlined} from "@ant-design/icons";
import {Alert, App as AntdApp, Avatar, Badge, Button, Empty, Flex, Input, Skeleton, Space, Table, Tag, Tooltip, Typography, type TableColumnsType} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {downloadAdminTeamResults, getLeaderboard, prepareAdminQrCodeExport, type LeaderboardEntryResponse} from "../../../movement/api";
import {getLocalizedTeamName} from "../../../movement/utils";
import {downloadQrCodeZip} from "./qrCodeExport";

type LeaderboardState = Readonly<{
  rows: readonly LeaderboardEntryResponse[] | null;
  error: boolean;
  refreshing: boolean;
}>;

const initialState: LeaderboardState = {rows: null, error: false, refreshing: false};

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

function formatDuration(seconds: number, t: (key: string, options?: Record<string, number>) => string) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0
    ? t("adminV2.leaderboard.duration.hoursMinutes", {hours, minutes})
    : t("adminV2.leaderboard.duration.minutes", {minutes});
}

function rankColor(rank: number) {
  return rank === 1 ? "gold" : rank === 2 ? "blue" : rank === 3 ? "orange" : undefined;
}

function RankCell({rank, t}: Readonly<{rank: number; t: (key: string) => string}>) {
  const color = rankColor(rank);
  const label = rank <= 3 ? t(`adminV2.leaderboard.rank.${rank}`) : undefined;
  return (
    <Space size="small">
      <Badge color={color} status={color ? "processing" : "default"} />
      <Tag color={color} icon={rank === 1 ? <CrownFilled /> : undefined}>{label ?? `#${rank}`}</Tag>
    </Space>
  );
}

export function AdminV2LeaderboardPage() {
  const {message} = AntdApp.useApp();
  const {t, i18n} = useTranslation();
  const isNarrow = useNarrowAdminV2Layout();
  const [state, setState] = useState(initialState);
  const [query, setQuery] = useState("");
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingQr, setExportingQr] = useState(false);

  const refresh = useCallback(async () => {
    setState((current) => ({...current, error: false, refreshing: true}));
    try {
      const rows = await getLeaderboard();
      setState({rows, error: false, refreshing: false});
    } catch {
      setState((current) => ({...current, error: true, refreshing: false}));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const rows = useMemo(() => {
    const language = i18n.language === "en" ? "en" : "vi";
    const normalizedQuery = query.trim().toLocaleLowerCase(language);
    if (!normalizedQuery) return state.rows ?? [];
    return (state.rows ?? []).filter((row) => {
      const localizedName = getLocalizedTeamName(row.teamName, language);
      return [row.teamName, localizedName, String(row.teamId)]
        .some((value) => value.toLocaleLowerCase(language).includes(normalizedQuery));
    });
  }, [i18n.language, query, state.rows]);

  const columns = useMemo<TableColumnsType<LeaderboardEntryResponse>>(() => [
    {
      title: t("adminV2.leaderboard.columns.rank"), dataIndex: "rank", width: 108,
      render: (rank: number) => <RankCell rank={rank} t={t} />,
    },
    {
      title: t("adminV2.leaderboard.columns.team"), key: "team", width: 290,
      render: (_, row) => {
        const name = getLocalizedTeamName(row.teamName, i18n.language === "en" ? "en" : "vi");
        return <Link className="admin-v2-leaderboard__team-link" to={`/admin-v2/teams/${row.teamId}`}><Badge color={rankColor(row.rank)} dot={row.rank <= 3}><Avatar className="admin-v2-leaderboard__avatar">{name.slice(0, 1)}</Avatar></Badge><Tooltip title={name}><Typography.Text ellipsis strong>{name}</Typography.Text></Tooltip></Link>;
      },
    },
    {title: t("adminV2.leaderboard.columns.score"), dataIndex: "totalPoints", align: "right", width: 120, render: (score: number) => <Typography.Text strong>{score}</Typography.Text>},
    {title: t("adminV2.leaderboard.columns.stations"), dataIndex: "completedStations", align: "right", width: 168},
    {
      title: t("adminV2.leaderboard.columns.time"), dataIndex: "totalPlaySeconds", align: "right", width: 154,
      hidden: isNarrow,
      render: (seconds: number) => formatDuration(seconds, t),
    },
  ], [i18n.language, isNarrow, t]);

  const isInitialLoading = state.rows === null && !state.error;
  const hasStaleData = state.error && state.rows !== null;
  const exportExcel = async () => {
    setExportingExcel(true);
    try {
      await downloadAdminTeamResults();
    } catch {
      message.error(t("adminV2.leaderboard.exportExcelError"));
    } finally {
      setExportingExcel(false);
    }
  };
  const exportQr = async () => {
    setExportingQr(true);
    try {
      const data = await prepareAdminQrCodeExport();
      const result = await downloadQrCodeZip(data);
      message.success(t("adminV2.leaderboard.exportQrSuccess", result));
    } catch {
      message.error(t("adminV2.leaderboard.exportQrError"));
    } finally {
      setExportingQr(false);
    }
  };
  return (
    <section className="admin-v2-leaderboard" aria-labelledby="admin-v2-leaderboard-title">
      <Flex align="flex-start" className="admin-v2-leaderboard__heading" gap="middle" justify="space-between" wrap>
        <div>
          <Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text>
          <Typography.Title id="admin-v2-leaderboard-title" level={1}>{t("adminV2.leaderboard.title")}</Typography.Title>
          <Typography.Paragraph type="secondary">{state.rows === null ? t("adminV2.leaderboard.loadingCount") : t("adminV2.leaderboard.count", {count: state.rows.length})}</Typography.Paragraph>
        </div>
        <Space wrap>
          <Button className="admin-v2-leaderboard__export-excel" icon={<FileExcelOutlined aria-hidden="true" />} loading={exportingExcel} onClick={() => void exportExcel()}>{t("adminV2.leaderboard.exportExcel")}</Button>
          <Button className="admin-v2-leaderboard__export-qr" icon={<QrcodeOutlined aria-hidden="true" />} loading={exportingQr} onClick={() => void exportQr()}>{t("adminV2.leaderboard.exportQr")}</Button>
          <Button loading={state.refreshing} onClick={() => void refresh()}>{t("adminV2.leaderboard.refresh")}</Button>
        </Space>
      </Flex>

      {state.error && <Alert action={<Button size="small" onClick={() => void refresh()}>{t("adminV2.leaderboard.retry")}</Button>} className="admin-v2-leaderboard__alert" description={hasStaleData ? t("adminV2.leaderboard.staleDescription") : t("adminV2.leaderboard.errorDescription")} showIcon title={hasStaleData ? t("adminV2.leaderboard.stale") : t("adminV2.leaderboard.error")} type={hasStaleData ? "warning" : "error"} />}

      {isInitialLoading ? <Skeleton active paragraph={{rows: 8}} title /> : state.rows !== null && <>
        <Flex className="admin-v2-leaderboard__filters" gap="small" wrap>
          <Input.Search allowClear aria-label={t("adminV2.leaderboard.searchLabel")} onChange={(event) => setQuery(event.target.value)} placeholder={t("adminV2.leaderboard.searchPlaceholder")} prefix={<SearchOutlined />} value={query} />
        </Flex>
        <Table className="admin-v2-leaderboard__table" columns={columns} dataSource={rows} locale={{emptyText: <Empty description={state.rows.length === 0 ? t("adminV2.leaderboard.empty") : t("adminV2.leaderboard.noMatches")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}} pagination={{hideOnSinglePage: true, pageSize: 20, showSizeChanger: false}} rowKey="teamId" scroll={{x: isNarrow ? 660 : 840}} />
      </>}
    </section>
  );
}
