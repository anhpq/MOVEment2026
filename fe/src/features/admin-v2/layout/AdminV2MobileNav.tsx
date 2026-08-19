import {MoreOutlined} from "@ant-design/icons";
import {Button, Popover, Tooltip} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {NavLink, useLocation} from "react-router-dom";
import {adminV2PrimaryRoutes, isAdminV2RouteActive} from "../routes/adminV2RouteConfig";

export function AdminV2MobileNav() {
  const {t} = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobilePrimaryRoutes = adminV2PrimaryRoutes.filter((route) => ["dashboard", "teams", "stations", "operations"].includes(route.key));
  const mobileMoreRoutes = adminV2PrimaryRoutes.filter((route) => route.key === "leaderboard" || route.key === "settings");
  const moreActive = mobileMoreRoutes.some((route) => isAdminV2RouteActive(route, location.pathname));

  const moreMenu = (
    <div aria-label={t("adminV2.nav.moreMenu")} className="admin-v2-mobile-more-menu" role="menu">
      {mobileMoreRoutes.map((route) => {
        const Icon = route.icon;
        const active = isAdminV2RouteActive(route, location.pathname);
        return <NavLink aria-current={active ? "page" : undefined} className={`admin-v2-mobile-more-menu__link${active ? " is-active" : ""}`} key={route.key} onClick={() => setMoreOpen(false)} role="menuitem" to={route.path}><Icon aria-hidden="true" /><span>{t(route.labelKey)}</span></NavLink>;
      })}
    </div>
  );

  return (
    <nav className="admin-v2-mobile-nav" aria-label={t("adminV2.navigationLabel")}>
      {mobilePrimaryRoutes.map((route) => {
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
              <span aria-hidden="true" className="admin-v2-mobile-nav__label">{label}</span>
            </NavLink>
          </Tooltip>
        );
      })}
      <Popover content={moreMenu} onOpenChange={setMoreOpen} open={moreOpen} placement="topRight" trigger="click">
        <Tooltip placement="top" title={t("adminV2.nav.more")}>
          <Button aria-current={moreActive ? "page" : undefined} aria-expanded={moreOpen} aria-haspopup="menu" aria-label={t("adminV2.nav.more")} className={`admin-v2-mobile-nav__more${moreActive ? " is-active" : ""}`} type="text"><MoreOutlined aria-hidden="true" /><span aria-hidden="true" className="admin-v2-mobile-nav__label">{t("adminV2.nav.more")}</span></Button>
        </Tooltip>
      </Popover>
    </nav>
  );
}
