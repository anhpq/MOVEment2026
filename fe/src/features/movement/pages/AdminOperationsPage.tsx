import {App, Button, Card, Col, Form, Input, InputNumber, List, Row, Space, Tabs, Typography} from "antd";
import {useCallback, useEffect, useState} from "react";
import {
  downloadAdminSummary,
  getAdminActivityLogs,
  getAdminDashboard,
  getAdminEventConfig,
  getAdminFinalConfig,
  getAdminFinalSubmissions,
  getAdminScoreQueue,
  updateAdminEventConfig,
  updateAdminFinalConfig,
} from "../api";

const JsonList = ({items}: {items: Array<Record<string, unknown>>}) =>
  <List dataSource={items} renderItem={(item) =>
    <List.Item><Typography.Text code>{JSON.stringify(item)}</Typography.Text></List.Item>} />;

export function AdminOperationsPage() {
  const {message} = App.useApp();
  const [dashboard, setDashboard] = useState<Record<string, unknown>>({});
  const [queue, setQueue] = useState<Array<Record<string, unknown>>>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [submissions, setSubmissions] = useState<Array<Record<string, unknown>>>([]);
  const [eventForm] = Form.useForm();
  const [finalForm] = Form.useForm();
  const refresh = useCallback(async () => {
    const [d, q, e, l, f, s] = await Promise.all([
      getAdminDashboard(), getAdminScoreQueue(), getAdminEventConfig(),
      getAdminActivityLogs(), getAdminFinalConfig(), getAdminFinalSubmissions(),
    ]);
    setDashboard(d); setQueue(q); setLogs(l); setSubmissions(s);
    eventForm.setFieldsValue(e); finalForm.setFieldsValue({
      ...f,
      pointsByRank: Array.isArray(f.pointsByRank) ? f.pointsByRank.join(",") : "",
    });
  }, [eventForm, finalForm]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  return <Tabs items={[
    {key: "dashboard", label: "Dashboard", children:
      <Row gutter={[12, 12]}>{Object.entries(dashboard).filter(([,v]) => typeof v !== "object").map(([k,v]) =>
        <Col xs={12} md={6} key={k}><Card><Typography.Text>{k}</Typography.Text><Typography.Title level={3}>{String(v)}</Typography.Title></Card></Col>)}
        <Col span={24}><Button onClick={() => void downloadAdminSummary()}>Export Excel</Button></Col>
      </Row>},
    {key: "queue", label: `Score Queue (${queue.length})`, children: <JsonList items={queue} />},
    {key: "event", label: "Event Config", children:
      <Card><Form form={eventForm} layout="vertical" onFinish={async (v) => {
        await updateAdminEventConfig(v); message.success("Event config updated"); await refresh();
      }}>
        <Form.Item name="eventEndTime" label="Event end"><Input /></Form.Item>
        <Form.Item name="finalStartsAt" label="Final starts"><Input /></Form.Item>
        <Form.Item name="notifyBeforeMinutes" label="Notify before"><InputNumber min={1} /></Form.Item>
        <Form.Item name="cancelCooldownMinutes" label="Cancel cooldown"><InputNumber min={0} /></Form.Item>
        <Form.Item name="timezone" label="Timezone"><Input /></Form.Item>
        <Button type="primary" htmlType="submit">Save event config</Button>
      </Form></Card>},
    {key: "final", label: "Final Config", children:
      <Space direction="vertical" className="full-width">
        <Card><Form form={finalForm} layout="vertical" onFinish={async (v) => {
          const pointsByRank = String(v.pointsByRank).split(",").map(Number);
          await updateAdminFinalConfig({...v, pointsByRank});
          message.success("Final config updated"); await refresh();
        }}>
          <Form.Item name="title" label="Title"><Input /></Form.Item>
          <Form.Item name="clueText" label="Clue"><Input.TextArea /></Form.Item>
          <Form.Item name="answer" label="New answer"><Input.Password /></Form.Item>
          <Form.Item name="startsAt" label="Starts at (ISO)"><Input /></Form.Item>
          <Form.Item name="maxWinners" label="Max winners"><InputNumber min={1} /></Form.Item>
          <Form.Item name="pointsByRank" label="Points by rank (CSV)"><Input /></Form.Item>
          <Button type="primary" htmlType="submit">Save Final config</Button>
        </Form></Card>
        <Card title={`Submissions (${submissions.length})`}><JsonList items={submissions} /></Card>
      </Space>},
    {key: "logs", label: `Activity Logs (${logs.length})`, children: <JsonList items={logs} />},
  ]} />;
}
