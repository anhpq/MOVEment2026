import {
  CalendarOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Tabs,
  Typography,
} from "antd";
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  getAdminEventConfig,
  getAdminFinalConfig,
  updateAdminEventConfig,
  updateAdminFinalConfig,
} from "../../api";
import {StationsMapPanel} from "../../components/StationsMapPanel";
import "../AdminOperationsPage.css";

function isFiveMinutesBeforeFinal(eventEndTime?: string, finalStartsAt?: string) {
  const toMinutes = (value?: string) => {
    const [hours, minutes] = (value ?? "").split(":").map(Number);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
  };
  const eventEnd = toMinutes(eventEndTime);
  const finalStart = toMinutes(finalStartsAt);
  return eventEnd !== null && finalStart !== null && (finalStart - eventEnd + 1440) % 1440 === 5;
}

export function AdminV2ConfigView() {
  const {message} = App.useApp();
  const {t} = useTranslation();
  const [eventForm] = Form.useForm();
  const [finalForm] = Form.useForm();
  const eventEndTime = Form.useWatch("eventEndTime", eventForm);
  const finalStartsAt = Form.useWatch("finalStartsAt", eventForm);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [e, f] = await Promise.all([
        getAdminEventConfig(),
        getAdminFinalConfig(),
      ]);
      eventForm.setFieldsValue(e);
      finalForm.setFieldsValue({...f, answer: ""});
    } catch {
      message.error(t("ops.unableLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [eventForm, finalForm, message, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const tabs = [
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
              <Typography.Text>{t("ops.eventDescription")}</Typography.Text>
            </div>
          </div>
          <Form
            form={eventForm}
            layout="vertical"
            className="ops-form"
            onFinish={async (values) => {
              await updateAdminEventConfig(values);
              message.success(t("ops.eventUpdated"));
              await loadData();
            }}>
            <div className="ops-form-grid">
              <Form.Item name="eventEndTime" label={t("ops.stationStartsCloseAt")}>
                <Input />
              </Form.Item>
              <Form.Item name="finalStartsAt" label={t("ops.finalStartsAt")}>
                <Input />
              </Form.Item>
            </div>
            <div className="ops-info-note">{t("ops.eventNote")}</div>
            {!isFiveMinutesBeforeFinal(eventEndTime, finalStartsAt) && (
              <div className="ops-info-note ops-info-note-warning">
                {t("ops.stationCloseWarning")}
              </div>
            )}
            <div className="ops-form-grid">
              <Form.Item name="notifyBeforeMinutes" label={t("ops.notifyBefore")}>
                <InputNumber min={1} className="full-width" />
              </Form.Item>
            </div>
            <Form.Item name="timezone" label={t("ops.timezone")}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isLoading}>
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
        <Card className="ops-form-card">
          <div className="ops-section-heading">
            <ExperimentOutlined />
            <div>
              <Typography.Title level={3}>{t("ops.finalConfiguration")}</Typography.Title>
              <Typography.Text>{t("ops.finalDescription")}</Typography.Text>
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
                ...(typeof answer === "string" && answer.trim() ? {answer} : {}),
              });
              message.success(t("ops.finalUpdated"));
              await loadData();
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
            <div className="ops-info-note">{t("ops.finalNote")}</div>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isLoading}>
              {t("ops.saveFinal")}
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: "map",
      label: t("nav.map"),
      icon: <EnvironmentOutlined />,
      children: <StationsMapPanel editable />,
    },
  ];

  return (
    <section className="admin-v2-config" style={{padding: "16px 0"}}>
      <Tabs items={tabs} />
    </section>
  );
}
