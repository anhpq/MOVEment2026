import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  FormOutlined,
  RightOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {Alert, Button, Card, Col, Empty, Flex, List, Row, Skeleton, Statistic, Tag, Typography} from "antd";
import {useCallback, useEffect, useState, type ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {isFiveMinutesBeforeFinal} from "../../../movement/eventTimeRecommendation";
import {
  getAdminV2DashboardData,
  type AdminV2ActivityLog,
  type AdminV2DashboardData,
  type AdminV2EventConfig,
} from "./adminV2DashboardData";

type DashboardState = Readonly<{
  data: Partial<AdminV2DashboardData>;
  errors: readonly string[];
  isLoading: boolean;
  isRefreshing: boolean;
}>;

const initialState: DashboardState = {data: {}, errors: [], isLoading: true, isRefreshing: false};

type MetricProps = Readonly<{
  label: string;
  value: number | undefined;
  isLoading: boolean;
  hasError: boolean;
  icon: ReactNode;
}>;

function Metric({label, value, isLoading, hasError, icon}: MetricProps) {
  return (
    <Card className="admin-v2-dashboard__metric" size="small">
      <Flex align="center" gap="middle" justify="space-between">
        <span className="admin-v2-dashboard__metric-icon" aria-hidden="true">{icon}</span>
        {isLoading && value === undefined ? <Skeleton active paragraph={false} title={{width: 52}} /> :
          value !== undefined ? <Statistic title={label} value={value} /> :
          <div><Typography.Text type="secondary">{label}</Typography.Text><Typography.Text className="admin-v2-dashboard__metric-unavailable">{hasError ? "—" : ""}</Typography.Text></div>}
      </Flex>
    </Card>
  );
}

function eventState(config: AdminV2EventConfig) {
  if (config.isPastFinalStart) return "finalStarted" as const;
  if (config.isPastEventEnd) return "stationsClosed" as const;
  if (config.secondsUntilFinal <= config.notifyBeforeMinutes * 60) return "finalNotice" as const;
  return "stationsOpen" as const;
}

function activityTranslationKey(action: string) {
  const actionKeys: Record<string, string> = {
    CHECK_IN: "checkIn",
    CHECK_OUT: "checkOut",
    SCORE_SUBMITTED: "scoreSubmitted",
    SCORE_UPDATED: "scoreUpdated",
    SCORE_REOPENED: "scoreReopened",
    EVENT_CONFIG_UPDATED: "eventConfigUpdated",
    FINAL_SUBMITTED: "finalSubmitted",
    FINAL_CONFIG_UPDATED: "finalConfigUpdated",
    CREATE_TEAM: "teamCreated",
    UPDATE_TEAM: "teamUpdated",
    DELETE_TEAM: "teamDeleted",
    CREATE_STATION: "stationCreated",
    UPDATE_STATION: "stationUpdated",
    DELETE_STATION: "stationDeleted",
  };
  return actionKeys[action];
}

function RecentActivity({logs, isLoading, hasError}: Readonly<{logs: readonly AdminV2ActivityLog[] | undefined; isLoading: boolean; hasError: boolean}>) {
  const {t, i18n} = useTranslation();

  if (isLoading && logs === undefined) {
    return <Skeleton active paragraph={{rows: 4}} />;
  }
  if (hasError && logs === undefined) {
    return <Alert showIcon type="error" title={t("adminV2.dashboard.loadSectionError")} />;
  }
  if (!logs?.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("adminV2.dashboard.noRecentActivity")} />;
  }

  return (
    <List
      className="admin-v2-dashboard__activity"
      dataSource={logs.slice(0, 5)}
      renderItem={(log) => {
        const key = activityTranslationKey(log.action);
        const time = new Intl.DateTimeFormat(i18n.language === "vi" ? "vi-VN" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(log.createdAt));
        return (
          <List.Item>
            <List.Item.Meta
              avatar={<ClockCircleOutlined />}
              title={key ? t(`adminV2.dashboard.activity.${key}`) : t("adminV2.dashboard.activity.unknown", {action: log.action})}
              description={t("adminV2.dashboard.activity.at", {time})}
            />
          </List.Item>
        );
      }}
    />
  );
}

export function AdminV2DashboardPage() {
  const {t} = useTranslation();
  const [state, setState] = useState(initialState);
  const refresh = useCallback(async () => {
    setState((current) => ({...current, isLoading: Object.keys(current.data).length === 0, isRefreshing: true}));
    const result = await getAdminV2DashboardData();
    setState((current) => ({
      data: {...current.data, ...result.data},
      errors: result.errors,
      isLoading: false,
      isRefreshing: false,
    }));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const dashboardError = state.errors.includes("dashboard");
  const scoreQueueError = state.errors.includes("scoreQueue");
  const finalSubmissionsError = state.errors.includes("finalSubmissions");
  const eventConfig = state.data.eventConfig;
  const attention = [
    state.data.pendingScoreCount && state.data.pendingScoreCount > 0 ? {
      key: "pendingScores",
      count: state.data.pendingScoreCount,
      to: "/admin-v2/operations/score-queue",
      type: "warning" as const,
    } : null,
    eventConfig && !isFiveMinutesBeforeFinal(eventConfig.eventEndTime, eventConfig.finalStartsAt) ? {
      key: "timing",
      to: "/admin-v2/operations/event-control",
      type: "warning" as const,
    } : null,
    state.data.finalSubmissionCount && state.data.finalSubmissionCount > 0 ? {
      key: "finalSubmissions",
      count: state.data.finalSubmissionCount,
      to: "/admin-v2/operations/final-challenge",
      type: "info" as const,
    } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const isInitialLoading = state.isLoading && Object.keys(state.data).length === 0;

  return (
    <section className="admin-v2-dashboard" aria-labelledby="admin-v2-dashboard-title">
      <Flex align="flex-start" className="admin-v2-dashboard__heading" gap="middle" justify="space-between" wrap>
        <div>
          <Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text>
          <Typography.Title id="admin-v2-dashboard-title" level={1}>{t("adminV2.dashboard.title")}</Typography.Title>
          <Typography.Paragraph type="secondary">{t("adminV2.dashboard.subtitle")}</Typography.Paragraph>
        </div>
        <Button loading={state.isRefreshing} onClick={() => void refresh()}>{t("adminV2.dashboard.refresh")}</Button>
      </Flex>

      {state.errors.length > 0 && <Alert className="admin-v2-dashboard__partial-error" showIcon type="warning" title={t("adminV2.dashboard.partialData")} description={t("adminV2.dashboard.partialDataDescription")} action={<Button size="small" onClick={() => void refresh()}>{t("adminV2.dashboard.retry")}</Button>} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card className="admin-v2-dashboard__overview" title={t("adminV2.dashboard.eventOverview")} extra={<Link to="/admin-v2/operations/event-control">{t("adminV2.dashboard.openEventControl")} <RightOutlined /></Link>}>
            {isInitialLoading && !eventConfig ? <Skeleton active paragraph={{rows: 3}} /> :
              eventConfig ? <Flex gap="middle" vertical>
                <Flex align="center" gap="small" wrap>
                  <Tag color={eventState(eventConfig) === "finalStarted" ? "purple" : eventState(eventConfig) === "stationsClosed" ? "orange" : "blue"}>{t(`adminV2.dashboard.eventState.${eventState(eventConfig)}`)}</Tag>
                  <Typography.Text type="secondary">{eventConfig.timezone}</Typography.Text>
                </Flex>
                <Row gutter={[16, 12]}>
                  <Col xs={24} sm={12}><Typography.Text type="secondary">{t("adminV2.dashboard.stationCloseTime")}</Typography.Text><Typography.Title level={3}>{eventConfig.eventEndTime}</Typography.Title></Col>
                  <Col xs={24} sm={12}><Typography.Text type="secondary">{t("adminV2.dashboard.finalStartTime")}</Typography.Text><Typography.Title level={3}>{eventConfig.finalStartsAt}</Typography.Title></Col>
                </Row>
              </Flex> : <Alert showIcon type="error" title={t("adminV2.dashboard.loadSectionError")} />}
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="admin-v2-dashboard__attention" title={<><ExclamationCircleOutlined /> {t("adminV2.dashboard.needsAttention")}</>}>
            {isInitialLoading ? <Skeleton active paragraph={{rows: 3}} /> : attention.length > 0 ? <List dataSource={attention} renderItem={(item) => <List.Item actions={[<Link aria-label={t("adminV2.dashboard.review")} key={item.key} to={item.to}>{t("adminV2.dashboard.review")} <RightOutlined /></Link>]}><List.Item.Meta title={t(`adminV2.dashboard.attention.${item.key}`, {count: item.count})} description={t(`adminV2.dashboard.attention.${item.key}Description`)} /></List.Item>} /> : <Alert showIcon type="success" title={t("adminV2.dashboard.noAttention")} />}
          </Card>
        </Col>
      </Row>

      <section aria-labelledby="admin-v2-dashboard-metrics">
        <Typography.Title id="admin-v2-dashboard-metrics" level={2}>{t("adminV2.dashboard.keyMetrics")}</Typography.Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8} xl={4}><Metric label={t("adminV2.dashboard.metrics.teams")} value={state.data.teamCount} isLoading={isInitialLoading} hasError={dashboardError} icon={<TeamOutlined />} /></Col>
          <Col xs={24} sm={12} lg={8} xl={4}><Metric label={t("adminV2.dashboard.metrics.stations")} value={state.data.stationCount} isLoading={isInitialLoading} hasError={dashboardError} icon={<EnvironmentOutlined />} /></Col>
          <Col xs={24} sm={12} lg={8} xl={4}><Metric label={t("adminV2.dashboard.metrics.activeTeams")} value={state.data.activePlayingCount} isLoading={isInitialLoading} hasError={dashboardError} icon={<TeamOutlined />} /></Col>
          <Col xs={24} sm={12} lg={8} xl={4}><Metric label={t("adminV2.dashboard.metrics.completedAttempts")} value={state.data.completedCount} isLoading={isInitialLoading} hasError={dashboardError} icon={<TrophyOutlined />} /></Col>
          <Col xs={24} sm={12} lg={8} xl={4}><Metric label={t("adminV2.dashboard.metrics.pendingScores")} value={state.data.pendingScoreCount} isLoading={isInitialLoading} hasError={scoreQueueError} icon={<FormOutlined />} /></Col>
          <Col xs={24} sm={12} lg={8} xl={4}><Metric label={t("adminV2.dashboard.metrics.finalSubmissions")} value={state.data.finalSubmissionCount} isLoading={isInitialLoading} hasError={finalSubmissionsError} icon={<FlagOutlined />} /></Col>
        </Row>
      </section>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title={t("adminV2.dashboard.quickActions")}>
            <Row gutter={[12, 12]}>
              {[
                ["teams", "/admin-v2/teams", <TeamOutlined />],
                ["stations", "/admin-v2/stations", <EnvironmentOutlined />],
                ["scoreQueue", "/admin-v2/operations/score-queue", <UnorderedListOutlined />],
                ["stationMap", "/admin-v2/stations/map", <EnvironmentOutlined />],
                ["eventControl", "/admin-v2/operations/event-control", <SettingOutlined />],
                ["finalChallenge", "/admin-v2/operations/final-challenge", <FlagOutlined />],
              ].map(([key, to, icon]) => <Col key={String(key)} xs={24} sm={12}><Link className="admin-v2-dashboard__quick-action" to={String(to)}><span>{icon}</span>{t(`adminV2.dashboard.actions.${key}`)}<RightOutlined /></Link></Col>)}
            </Row>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title={t("adminV2.dashboard.recentActivity")} extra={<Link to="/admin-v2/operations/activity-logs">{t("adminV2.dashboard.viewAll")} <RightOutlined /></Link>}>
            <RecentActivity logs={state.data.latestLogs} isLoading={isInitialLoading} hasError={dashboardError} />
          </Card>
        </Col>
      </Row>
    </section>
  );
}
