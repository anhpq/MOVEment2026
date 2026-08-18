import {
  DashboardOutlined,
  ExperimentOutlined,
  FileExcelOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Tabs,
  Typography,
} from "antd";
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  downloadAdminTeamResults,
  getAdminActivityLogs,
  getAdminDashboard,
  getAdminFinalSubmissions,
  getAdminScoreQueue,
} from "../../api";
import "../AdminOperationsPage.css";

type OperationRecord = Record<string, unknown>;

function formatLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(
  value: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? t("ops.yes") : t("ops.no");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function OperationList({
  items,
  emptyText,
  t,
}: {
  items: OperationRecord[];
  emptyText: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <List
      className="ops-record-list"
      dataSource={items}
      locale={{emptyText: <Empty description={emptyText} />}}
      renderItem={(item, index) => {
        const entries = Object.entries(item);
        const titleEntry =
          entries.find(([key]) =>
            ["teamName", "stationName", "action", "type", "status"].includes(
              key,
            ),
          ) ?? entries[0];

        return (
          <List.Item className="ops-record">
            <div className="ops-record-index">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="ops-record-content">
              <Typography.Text className="ops-record-title" strong>
                {titleEntry ?
                  formatValue(titleEntry[1], t)
                : t("ops.record", {index: index + 1})}
              </Typography.Text>
              <div className="ops-record-fields">
                {entries
                  .filter(([key]) => key !== titleEntry?.[0])
                  .map(([key, value]) => (
                    <div className="ops-record-field" key={key}>
                      <span>{formatLabel(key)}</span>
                      <strong title={formatValue(value, t)}>
                        {formatValue(value, t)}
                      </strong>
                    </div>
                  ))}
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
}

export function AdminV2OperationsView() {
  const {message} = App.useApp();
  const {t} = useTranslation();
  const [dashboard, setDashboard] = useState<OperationRecord>({});
  const [queue, setQueue] = useState<OperationRecord[]>([]);
  const [logs, setLogs] = useState<OperationRecord[]>([]);
  const [submissions, setSubmissions] = useState<OperationRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [d, q, l, s] = await Promise.all([
        getAdminDashboard(),
        getAdminScoreQueue(),
        getAdminActivityLogs(),
        getAdminFinalSubmissions(),
      ]);
      setDashboard(d);
      setQueue(q);
      setLogs(l);
      setSubmissions(s);
    } catch {
      message.error(t("ops.unableLoad"));
    } finally {
      setIsRefreshing(false);
    }
  }, [message, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const metricEntries = Object.entries(dashboard).filter(
    ([, value]) => typeof value !== "object",
  );

  const tabs = [
    {
      key: "queue",
      label: `${t("ops.scoreQueue", {count: queue.length})}`,
      icon: <UnorderedListOutlined />,
      children: (
        <OperationList items={queue} emptyText={t("ops.scoreQueueEmpty")} t={t} />
      ),
    },
    {
      key: "final-submissions",
      label: `${t("ops.finalSubmissions", {count: submissions.length})}`,
      icon: <ExperimentOutlined />,
      children: (
        <OperationList
          items={submissions}
          emptyText={t("ops.noFinalSubmissions")}
          t={t}
        />
      ),
    },
    {
      key: "logs",
      label: `${t("ops.activityLogs", {count: logs.length})}`,
      icon: <FileSearchOutlined />,
      children: (
        <OperationList items={logs} emptyText={t("ops.noActivityLogs")} t={t} />
      ),
    },
  ];

  return (
    <section className="admin-ops-page admin-v2-ops">
      <header className="admin-ops-hero">
        <span className="admin-ops-hero-icon">
          <DashboardOutlined />
        </span>
        <div style={{flex: 1}}>
          <Typography.Title level={2} style={{margin: 0}}>
            {t("ops.operationsCenter")} (Admin V2)
          </Typography.Title>
        </div>
        <Button
          shape="circle"
          icon={<ReloadOutlined />}
          loading={isRefreshing}
          aria-label={t("ops.refreshAria")}
          onClick={() => void refresh()}
        />
      </header>

      {/* Metrics Banner */}
      <Card className="admin-v2-metrics-banner" style={{marginBottom: 16}}>
        <Row gutter={[12, 12]} align="middle">
          {metricEntries.map(([key, value], index) => (
            <Col xs={12} sm={6} key={key}>
              <Card className={`ops-metric-card metric-tone-${index % 4}`} size="small">
                <Typography.Text type="secondary">{formatLabel(key)}</Typography.Text>
                <Typography.Title level={3} style={{margin: 0}}>
                  {formatValue(value, t)}
                </Typography.Title>
              </Card>
            </Col>
          ))}
        </Row>

        <div style={{marginTop: 16, display: "flex", justifyContent: "flex-end"}}>
          <Button
            type="primary"
            className="ops-export-button"
            icon={<FileExcelOutlined />}
            onClick={() => void downloadAdminTeamResults()}>
            {t("ops.exportTeamResults")}
          </Button>
        </div>
      </Card>

      {/* Lower Tabs */}
      <Tabs className="admin-ops-tabs" items={tabs} />
    </section>
  );
}
