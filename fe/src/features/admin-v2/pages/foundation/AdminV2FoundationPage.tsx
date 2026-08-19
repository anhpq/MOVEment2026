import {Alert, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {useLocation} from "react-router-dom";
import {getAdminV2Route, type AdminV2RouteKey} from "../../routes/adminV2RouteConfig";

type AdminV2FoundationPageProps = Readonly<{
  routeKey?: AdminV2RouteKey;
}>;

export function AdminV2FoundationPage({routeKey}: AdminV2FoundationPageProps) {
  const {t} = useTranslation();
  const location = useLocation();
  const route = routeKey
    ? getAdminV2Route(`/admin-v2/${routeKey === "dashboard" ? "dashboard" : routeKey}`)
    : getAdminV2Route(location.pathname);
  const isDashboard = route?.key === "dashboard";
  const title = route ? t(route.labelKey) : t("adminV2.nav.dashboard");

  return (
    <section className="admin-v2-foundation-page" aria-labelledby="admin-v2-page-title">
      <Typography.Text className="admin-v2-page-eyebrow">{t("adminV2.console")}</Typography.Text>
      <Typography.Title id="admin-v2-page-title" level={1}>{title}</Typography.Title>
      <Alert
        className="admin-v2-foundation-state"
        description={isDashboard ? t("adminV2.foundation.dashboardDescription") : t("adminV2.foundation.plannedDescription")}
        message={isDashboard ? t("adminV2.foundation.ready") : t("adminV2.foundation.plannedLabel")}
        showIcon
        type="info"
      />
    </section>
  );
}
