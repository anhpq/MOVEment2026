import {LogoutOutlined, UserOutlined} from "@ant-design/icons";
import {Button, Popover, Space, Typography} from "antd";
import {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {useLocation, useNavigate} from "react-router-dom";
import {logout as logoutApi} from "../../movement/api";
import {LanguageSwitch} from "../../movement/components/LanguageSwitch";
import {useMovementStore} from "../../movement/store";
import {getAdminV2Route} from "../routes/adminV2RouteConfig";

function formatBuildTimestamp(value: string, language: "vi" | "en", unknown: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return unknown;
  }

  return date.toLocaleString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
  });
}

export function AdminV2Header() {
  const {i18n, t} = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const session = useMovementStore((state) => state.session);
  const clearSession = useMovementStore((state) => state.logout);
  const route = getAdminV2Route(location.pathname);
  const language = i18n.language === "en" ? "en" : "vi";
  const buildLabel = useMemo(() => {
    const formatted = formatBuildTimestamp(__APP_BUILD_TIMESTAMP__, language, t("adminV2.header.deploymentUnknown"));
    return formatted === t("adminV2.header.deploymentUnknown")
      ? formatted
      : t("adminV2.header.deployment", {value: formatted});
  }, [language, t]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // The local session must still be cleared if the remote logout request cannot complete.
    }
    clearSession();
    navigate("/login");
  };

  const accountPopover = (
    <Space aria-label={t("adminV2.header.account", {username: session?.username ?? ""})} className="admin-v2-account-menu" orientation="vertical" role="menu" size={4}>
      <Typography.Text strong>{t("adminV2.header.account", {username: session?.username ?? ""})}</Typography.Text>
      <Typography.Text type="secondary">{buildLabel}</Typography.Text>
      <Button danger icon={<LogoutOutlined />} onClick={() => void handleLogout()} role="menuitem" type="text">
        {t("adminV2.header.logout")}
      </Button>
    </Space>
  );

  return (
    <header className="admin-v2-header">
      <div className="admin-v2-header__context">
        <p>{t("adminV2.header.pageContext")}</p>
        <p className="admin-v2-header__title">{route ? t(route.labelKey) : t("adminV2.console")}</p>
      </div>
      <div className="admin-v2-header__actions">
        <LanguageSwitch />
        <span className="admin-v2-header__build" title={__APP_BUILD_TIMESTAMP__}>{buildLabel}</span>
        <span className="admin-v2-header__account" title={t("adminV2.header.account", {username: session?.username ?? ""})}>
          {session?.username}
        </span>
        <span className="admin-v2-header__mobile-account">
          <Popover content={accountPopover} placement="bottomRight" trigger="click">
            <Button aria-haspopup="menu" aria-label={t("adminV2.header.accountMenu")} icon={<UserOutlined />} type="text" />
          </Popover>
        </span>
        <Button className="admin-v2-header__logout" icon={<LogoutOutlined />} onClick={() => void handleLogout()} type="text">
          <span>{t("adminV2.header.logout")}</span>
        </Button>
      </div>
    </header>
  );
}
