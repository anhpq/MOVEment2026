import {
  CalendarOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileExcelOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
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
  getAdminEventConfig,
  getAdminFinalConfig,
  getAdminFinalSubmissions,
  getAdminScoreQueue,
  updateAdminEventConfig,
  updateAdminFinalConfig,
} from "../api";
import "./AdminOperationsPage.css";

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

export function AdminOperationsPage() {
  const {message} = App.useApp();
  const {t} = useTranslation();
  const [dashboard, setDashboard] = useState<OperationRecord>({});
  const [queue, setQueue] = useState<OperationRecord[]>([]);
  const [logs, setLogs] = useState<OperationRecord[]>([]);
  const [submissions, setSubmissions] = useState<OperationRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eventForm] = Form.useForm();
  const [finalForm] = Form.useForm();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [d, q, e, l, f, s] = await Promise.all([
        getAdminDashboard(),
        getAdminScoreQueue(),
        getAdminEventConfig(),
        getAdminActivityLogs(),
        getAdminFinalConfig(),
        getAdminFinalSubmissions(),
      ]);
      setDashboard(d);
      setQueue(q);
      setLogs(l);
      setSubmissions(s);
      eventForm.setFieldsValue(e);
      finalForm.setFieldsValue({...f, answer: ""});
    } catch {
      message.error(t("ops.unableLoad"));
    } finally {
      setIsRefreshing(false);
    }
  }, [eventForm, finalForm, message, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const metricEntries = Object.entries(dashboard).filter(
    ([, value]) => typeof value !== "object",
  );

  const tabs = [
    {
      key: "dashboard",
      label: t("ops.dashboard"),
      icon: <DashboardOutlined />,
      children: (
        <div className="ops-tab-panel">
          <Row gutter={[12, 12]}>
            {metricEntries.map(([key, value], index) => (
              <Col xs={24} sm={12} lg={6} key={key}>
                <Card className={`ops-metric-card metric-tone-${index % 4}`}>
                  <Typography.Text>{formatLabel(key)}</Typography.Text>
                  <Typography.Title level={3}>
                    {formatValue(value, t)}
                  </Typography.Title>
                </Card>
              </Col>
            ))}
          </Row>
          <Button
            className="ops-export-button"
            icon={<FileExcelOutlined />}
             onClick={() => void downloadAdminTeamResults()}>
            {t("ops.exportTeamResults")}
          </Button>
        </div>
      ),
    },
    {
      key: "queue",
      label: t("ops.scoreQueue", {count: queue.length}),
      icon: <UnorderedListOutlined />,
      children: (
        <OperationList items={queue} emptyText={t("ops.scoreQueueEmpty")} t={t} />
      ),
    },
    {
      key: "event",
      label: t("ops.eventConfig"),
      icon: <CalendarOutlined />,
      children: (
        <Card className="ops-form-card">
          <div className="ops-section-heading">
            <CalendarOutlined />
            <div>
              <Typography.Title level={3}>{t("ops.eventConfiguration")}</Typography.Title>
              <Typography.Text>
                {t("ops.eventDescription")}
              </Typography.Text>
            </div>
          </div>
          <Form
            form={eventForm}
            layout="vertical"
            className="ops-form"
            onFinish={async (values) => {
              await updateAdminEventConfig(values);
              message.success(t("ops.eventUpdated"));
              await refresh();
            }}>
            <div className="ops-form-grid">
              <Form.Item name="eventEndTime" label={t("ops.eventEnd")}>
                <Input />
              </Form.Item>
              <Form.Item name="finalStartsAt" label={t("ops.finalStartsAt")}>
                <Input />
              </Form.Item>
            </div>
            <div className="ops-info-note">
              {t("ops.eventNote")}
            </div>
            <div className="ops-form-grid">
              <Form.Item
                name="notifyBeforeMinutes"
                label={t("ops.notifyBefore")}>
                <InputNumber min={1} className="full-width" />
              </Form.Item>
              <Form.Item
                name="cancelCooldownMinutes"
                label={t("ops.cancelCooldown")}>
                <InputNumber min={0} className="full-width" />
              </Form.Item>
            </div>
            <Form.Item name="timezone" label={t("ops.timezone")}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {t("ops.saveEvent")}
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: "final",
      label: t("ops.finalConfig"),
      icon: <ExperimentOutlined />,
      children: (
        <div className="ops-tab-panel">
          <Card className="ops-form-card">
            <div className="ops-section-heading">
              <ExperimentOutlined />
              <div>
                <Typography.Title level={3}>
                  {t("ops.finalConfiguration")}
                </Typography.Title>
                <Typography.Text>
                  {t("ops.finalDescription")}
                </Typography.Text>
              </div>
            </div>
            <Form
              form={finalForm}
              layout="vertical"
              className="ops-form"
              onFinish={async (formValues) => {
                const values = {...formValues};
                const answer = values.answer;
                delete values.currentKeyword;
                delete values.answer;
                await updateAdminFinalConfig({
                  ...values,
                  ...(typeof answer === "string" && answer.trim() ?
                    {answer}
                  : {}),
                });
                message.success(t("ops.finalUpdated"));
                await refresh();
              }}>
              <Form.Item name="title" label={t("ops.title")}>
                <Input />
              </Form.Item>
              <Form.Item name="clueText" label={t("ops.clue")}>
                <Input.TextArea autoSize={{minRows: 3, maxRows: 6}} />
              </Form.Item>
              <div className="ops-form-grid">
                <Form.Item name="currentKeyword" label={t("ops.currentKeyword")}>
                  <Input readOnly />
                </Form.Item>
                <Form.Item name="answer" label={t("ops.newKeyword")}>
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
              </div>
              <div className="ops-info-note">
                {t("ops.finalNote")}
              </div>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {t("ops.saveFinal")}
              </Button>
            </Form>
          </Card>
          <Card
            className="ops-submissions-card"
            title={t("ops.finalSubmissions", {count: submissions.length})}>
            <OperationList
              items={submissions}
              emptyText={t("ops.noFinalSubmissions")}
              t={t}
            />
          </Card>
        </div>
      ),
    },
    {
      key: "logs",
      label: t("ops.activityLogs", {count: logs.length}),
      icon: <FileSearchOutlined />,
      children: (
        <OperationList items={logs} emptyText={t("ops.noActivityLogs")} t={t} />
      ),
    },
  ];

  return (
    <section className="admin-ops-page">
      <header className="admin-ops-hero">
        <span className="admin-ops-hero-icon">
          <DashboardOutlined />
        </span>
        <Typography.Title level={2}>{t("ops.operationsCenter")}</Typography.Title>
        <Button
          shape="circle"
          icon={<ReloadOutlined />}
          loading={isRefreshing}
          aria-label={t("ops.refreshAria")}
          onClick={() => void refresh()}
        />
      </header>
      <Tabs className="admin-ops-tabs" items={tabs} />
    </section>
  );
}
