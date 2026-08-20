import {useTranslation} from "react-i18next";
import {NavLink, useLocation} from "react-router-dom";
import {Tooltip} from "antd";
import {
  adminV2OperationsRoutes,
  adminV2PrimaryRoutes,
  isAdminV2RouteActive,
  type AdminV2RouteDefinition,
} from "../routes/adminV2RouteConfig";

function NavigationLink({route, compact = false}: {route: AdminV2RouteDefinition; compact?: boolean}) {
  const {t} = useTranslation();
  const location = useLocation();
  const Icon = route.icon;
  const active = isAdminV2RouteActive(route, location.pathname);
  const label = t(route.labelKey);
  const link = (
    <NavLink
      aria-current={active ? "page" : undefined}
      className={`admin-v2-nav-link${active ? " is-active" : ""}${compact ? " is-compact" : ""}`}
      to={route.path}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );

  return compact ? <Tooltip placement="right" title={label}>{link}</Tooltip> : link;
}

export function AdminV2Sidebar() {
  const location = useLocation();
  const operationsOpen = location.pathname.startsWith("/admin-v2/operations");
  const {t} = useTranslation();

  return (
    <aside className="admin-v2-sidebar" aria-label={t("adminV2.navigationLabel")}>
      <div className="admin-v2-sidebar__brand">
        <strong>{t("adminV2.brand")}</strong>
        <span>{t("adminV2.console")}</span>
      </div>
      <nav className="admin-v2-sidebar__nav" aria-label={t("adminV2.navigationLabel")}>
        {adminV2PrimaryRoutes.map((route) => (
          <div className="admin-v2-sidebar__group" key={route.key}>
            <NavigationLink route={route} compact />
            {route.key === "operations" && operationsOpen && (
              <div className="admin-v2-sidebar__secondary" aria-label={t("adminV2.nav.operations")}>
                {adminV2OperationsRoutes.map((childRoute) => (
                  <NavigationLink key={childRoute.key} route={childRoute} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
