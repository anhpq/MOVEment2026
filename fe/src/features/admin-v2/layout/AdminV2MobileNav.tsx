import {Tooltip} from "antd";
import {useTranslation} from "react-i18next";
import {NavLink, useLocation} from "react-router-dom";
import {adminV2PrimaryRoutes, isAdminV2RouteActive} from "../routes/adminV2RouteConfig";

export function AdminV2MobileNav() {
  const {t} = useTranslation();
  const location = useLocation();

  return (
    <nav className="admin-v2-mobile-nav" aria-label={t("adminV2.navigationLabel")}>
      {adminV2PrimaryRoutes.map((route) => {
        const Icon = route.icon;
        const active = isAdminV2RouteActive(route, location.pathname);
        const label = t(route.labelKey);
        return (
          <Tooltip key={route.key} placement="top" title={label}>
            <NavLink
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`admin-v2-mobile-nav__link${active ? " is-active" : ""}`}
              to={route.path}
            >
              <Icon aria-hidden="true" />
            </NavLink>
          </Tooltip>
        );
      })}
    </nav>
  );
}
