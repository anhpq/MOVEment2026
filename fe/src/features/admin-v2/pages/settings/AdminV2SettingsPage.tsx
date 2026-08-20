import {SaveOutlined, UndoOutlined} from "@ant-design/icons";
import {Alert, App as AntdApp, Button, Card, Divider, Flex, Form, Select, Space, Typography} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {readAdminV2SettingsPreferences, resetAdminV2SettingsPreferences, saveAdminV2SettingsPreferences, type AdminV2SettingsPreferences} from "./adminV2SettingsPreferences";

export function AdminV2SettingsPage() {
  const {i18n, t} = useTranslation();
  const {message} = AntdApp.useApp();
  const [form] = Form.useForm<AdminV2SettingsPreferences>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const language = i18n.language === "en" ? "en" : "vi";

  const save = async (values: AdminV2SettingsPreferences) => {
    if (saving) return;
    setSaving(true); setSaveError(false); setSaveSucceeded(false);
    try {
      saveAdminV2SettingsPreferences(values);
      setSaveSucceeded(true);
      message.success(t("adminV2.settings.saveSuccess"));
    } catch {
      setSaveError(true);
      message.error(t("adminV2.settings.saveError"));
    } finally { setSaving(false); }
  };

  const reset = () => {
    form.setFieldsValue(resetAdminV2SettingsPreferences());
    setSaveError(false); setSaveSucceeded(false);
  };

  return <section className="admin-v2-settings" aria-labelledby="admin-v2-settings-title">
    <div className="admin-v2-settings__heading">
      <Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text>
      <Typography.Title id="admin-v2-settings-title" level={1}>{t("adminV2.settings.title")}</Typography.Title>
      <Typography.Paragraph type="secondary">{t("adminV2.settings.subtitle")}</Typography.Paragraph>
    </div>
    <Alert showIcon title={t("adminV2.settings.scope.title")} description={t("adminV2.settings.scope.description")} type="info" />
    {saveError && <Alert showIcon title={t("adminV2.settings.saveError")} type="error" />}
    {saveSucceeded && <Alert showIcon title={t("adminV2.settings.saveSuccess")} type="success" />}
    <Form form={form} initialValues={readAdminV2SettingsPreferences()} layout="vertical" onFinish={save}>
      <Card title={t("adminV2.settings.preferences.title")}>
        <Typography.Paragraph type="secondary">{t("adminV2.settings.preferences.description")}</Typography.Paragraph>
        <Form.Item label={t("adminV2.settings.preferences.language")}>
          <Select disabled value={language} options={[{label: t("adminV2.settings.preferences.vietnamese"), value: "vi"}, {label: t("adminV2.settings.preferences.english"), value: "en"}]} />
        </Form.Item>
        <Typography.Text type="secondary">{t("adminV2.settings.preferences.languageHelp")}</Typography.Text>
        <Divider />
        <Form.Item label={t("adminV2.settings.preferences.density")} name="navigationDensity" rules={[{required: true, message: t("adminV2.settings.preferences.densityRequired")}]}>
          <Select options={[{label: t("adminV2.settings.preferences.comfortable"), value: "comfortable"}, {label: t("adminV2.settings.preferences.compact"), value: "compact"}]} />
        </Form.Item>
        <Typography.Text type="secondary">{t("adminV2.settings.preferences.densityHelp")}</Typography.Text>
      </Card>
      <Card title={t("adminV2.settings.diagnostics.title")}>
        <Space orientation="vertical" size={4}>
          <Typography.Text>{t("adminV2.settings.diagnostics.build", {value: __APP_BUILD_TIMESTAMP__ || t("adminV2.settings.diagnostics.unknown")})}</Typography.Text>
          <Typography.Text type="secondary">{t("adminV2.settings.diagnostics.api")}</Typography.Text>
        </Space>
      </Card>
      <Flex className="admin-v2-settings__form-actions" gap="small" justify="end" wrap>
        <Button disabled={saving} icon={<UndoOutlined />} onClick={reset}>{t("adminV2.settings.reset")}</Button>
        <Button disabled={saving} htmlType="submit" icon={<SaveOutlined />} loading={saving} type="primary">{t("adminV2.settings.save")}</Button>
      </Flex>
    </Form>
  </section>;
}
