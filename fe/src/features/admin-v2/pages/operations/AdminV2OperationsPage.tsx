import {ArrowRightOutlined} from "@ant-design/icons";
import {Button, Card, Col, Row, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {adminV2OperationsRoutes} from "../../routes/adminV2RouteConfig";

export function AdminV2OperationsPage() {
  const {t} = useTranslation();

  return (
    <section className="admin-v2-operations" aria-labelledby="admin-v2-operations-title">
      <div>
        <Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text>
        <Typography.Title id="admin-v2-operations-title" level={1}>{t("adminV2.operations.title")}</Typography.Title>
        <Typography.Paragraph type="secondary">{t("adminV2.operations.description")}</Typography.Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        {adminV2OperationsRoutes.map((route) => {
          const Icon = route.icon;
          const label = t(route.labelKey);
          return (
            <Col key={route.key} xs={24} sm={12}>
              <Card className="admin-v2-operations__destination" title={<><Icon aria-hidden="true" /> {label}</>}>
                <Typography.Paragraph type="secondary">{t(`adminV2.operations.destinations.${route.key}`)}</Typography.Paragraph>
                <Link to={route.path}>
                  <Button icon={<ArrowRightOutlined />} type="primary">{t("adminV2.operations.open", {label})}</Button>
                </Link>
              </Card>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
