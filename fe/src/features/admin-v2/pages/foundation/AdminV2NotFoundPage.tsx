import {ArrowLeftOutlined} from "@ant-design/icons";
import {Button, Result, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";

export function AdminV2NotFoundPage() {
  const {t} = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="admin-v2-not-found" aria-labelledby="admin-v2-not-found-title">
      <Result
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin-v2/dashboard")} type="primary">{t("adminV2.notFound.backToDashboard")}</Button>}
        status="404"
        subTitle={t("adminV2.notFound.description")}
        title={<Typography.Title id="admin-v2-not-found-title" level={1}>{t("adminV2.notFound.title")}</Typography.Title>}
      />
    </section>
  );
}
