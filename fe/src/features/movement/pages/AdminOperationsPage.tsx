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

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function OperationList({
  items,
  emptyText,
}: {
  items: OperationRecord[];
  emptyText: string;
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
                {titleEntry ? formatValue(titleEntry[1]) : `Record ${index + 1}`}
              </Typography.Text>
              <div className="ops-record-fields">
                {entries
                  .filter(([key]) => key !== titleEntry?.[0])
                  .map(([key, value]) => (
                    <div className="ops-record-field" key={key}>
                      <span>{formatLabel(key)}</span>
                      <strong title={formatValue(value)}>
                        {formatValue(value)}
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
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to load operations",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [eventForm, finalForm, message]);

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
      label: "Dashboard",
      icon: <DashboardOutlined />,
      children: (
        <div className="ops-tab-panel">
          <Row gutter={[12, 12]}>
            {metricEntries.map(([key, value], index) => (
              <Col xs={24} sm={12} lg={6} key={key}>
                <Card className={`ops-metric-card metric-tone-${index % 4}`}>
                  <Typography.Text>{formatLabel(key)}</Typography.Text>
                  <Typography.Title level={3}>
                    {formatValue(value)}
                  </Typography.Title>
                </Card>
              </Col>
            ))}
          </Row>
          <Button
            className="ops-export-button"
            icon={<FileExcelOutlined />}
             onClick={() => void downloadAdminTeamResults()}>
            Export Team Results
          </Button>
        </div>
      ),
    },
    {
      key: "queue",
      label: `Score Queue (${queue.length})`,
      icon: <UnorderedListOutlined />,
      children: (
        <OperationList items={queue} emptyText="Score queue is empty" />
      ),
    },
    {
      key: "event",
      label: "Event Config",
      icon: <CalendarOutlined />,
      children: (
        <Card className="ops-form-card">
          <div className="ops-section-heading">
            <CalendarOutlined />
            <div>
              <Typography.Title level={3}>Event configuration</Typography.Title>
              <Typography.Text>
                Timing and operational rules for the current event.
              </Typography.Text>
            </div>
          </div>
          <Form
            form={eventForm}
            layout="vertical"
            className="ops-form"
            onFinish={async (values) => {
              await updateAdminEventConfig(values);
              message.success("Event config updated");
              await refresh();
            }}>
            <div className="ops-form-grid">
              <Form.Item name="eventEndTime" label="Event end">
                <Input />
              </Form.Item>
              <Form.Item name="finalStartsAt" label="Final starts at">
                <Input />
              </Form.Item>
            </div>
            <div className="ops-info-note">
              Event end closes new Station check-ins. Final starts at opens the
              Final Challenge.
            </div>
            <div className="ops-form-grid">
              <Form.Item
                name="notifyBeforeMinutes"
                label="Notify before (minutes)">
                <InputNumber min={1} className="full-width" />
              </Form.Item>
              <Form.Item
                name="cancelCooldownMinutes"
                label="Cancel cooldown (minutes)">
                <InputNumber min={0} className="full-width" />
              </Form.Item>
            </div>
            <Form.Item name="timezone" label="Timezone">
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Save event config
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: "final",
      label: "Final Config",
      icon: <ExperimentOutlined />,
      children: (
        <div className="ops-tab-panel">
          <Card className="ops-form-card">
            <div className="ops-section-heading">
              <ExperimentOutlined />
              <div>
                <Typography.Title level={3}>
                  Final Challenge configuration
                </Typography.Title>
                <Typography.Text>
                  Configure the clue and optionally rotate the keyword.
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
                message.success("Final config updated");
                await refresh();
              }}>
              <Form.Item name="title" label="Title">
                <Input />
              </Form.Item>
              <Form.Item name="clueText" label="Clue">
                <Input.TextArea autoSize={{minRows: 3, maxRows: 6}} />
              </Form.Item>
              <div className="ops-form-grid">
                <Form.Item name="currentKeyword" label="Current keyword">
                  <Input readOnly />
                </Form.Item>
                <Form.Item name="answer" label="New keyword">
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
              </div>
              <div className="ops-info-note">
                Final opens at the Final starts at time configured in Event
                Config. Bonus: Rank 1 = 10, Rank 10 = 1, Rank 11+ = 0.
              </div>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Final config
              </Button>
            </Form>
          </Card>
          <Card
            className="ops-submissions-card"
            title={`Final submissions (${submissions.length})`}>
            <OperationList
              items={submissions}
              emptyText="No Final submissions yet"
            />
          </Card>
        </div>
      ),
    },
    {
      key: "logs",
      label: `Activity Logs (${logs.length})`,
      icon: <FileSearchOutlined />,
      children: <OperationList items={logs} emptyText="No activity logs" />,
    },
  ];

  return (
    <section className="admin-ops-page">
      <header className="admin-ops-hero">
        <span className="admin-ops-hero-icon">
          <DashboardOutlined />
        </span>
        <Typography.Title level={2}>Operations Center</Typography.Title>
        <Button
          shape="circle"
          icon={<ReloadOutlined />}
          loading={isRefreshing}
          aria-label="Refresh operations data"
          onClick={() => void refresh()}
        />
      </header>
      <Tabs className="admin-ops-tabs" items={tabs} />
    </section>
  );
}
