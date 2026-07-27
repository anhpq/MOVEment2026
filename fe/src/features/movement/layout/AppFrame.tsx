import {
  DashboardOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {App as AntdApp, Button, Flex, Layout, Typography} from "antd";
import type {PropsWithChildren} from "react";
import {useMemo, useRef} from "react";
import {useTranslation} from "react-i18next";
import {useLocation, useNavigate} from "react-router-dom";
import {logout as logoutApi} from "../api";
import {LanguageSwitch} from "../components/LanguageSwitch";
import {RunningPersonIcon} from "../components/RunningPersonIcon";
import {useBodyTeamTheme} from "../hooks/useBodyTeamTheme";
import {fetchPlayerDatabase} from "../playerData";
import {useMovementStore} from "../store";
import {getTeamThemeVars} from "../teamTheme";
import {getLocalizedTeamName} from "../utils";
import {FixedBottomNavigation, type FixedBottomNavigationItem} from "./FixedBottomNavigation";
import "./AppFrame.scss";

type AppFrameProps = Readonly<PropsWithChildren>;

function formatBuildTimestamp(
  value: string,
  language: "vi" | "en",
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("common.deployUnknown");
  }
  const formatted = date.toLocaleString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return t("common.deploy", {value: formatted});
}

function getRouteTeamContextId(pathname: string, role: string | undefined) {
  if (role !== "admin") {
    return null;
  }
  const stationMatch = /^\/teams\/([^/]+)\/stations(?:\/[^/]+)?$/.exec(pathname);
  if (stationMatch?.[1]) {
    return stationMatch[1];
  }
  const editorMatch = /^\/system-config\/teams\/([^/]+)$/.exec(pathname);
  if (editorMatch?.[1] && editorMatch[1] !== "new") {
    return editorMatch[1];
  }
  return null;
}

export function AppFrame({children}: AppFrameProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {message} = AntdApp.useApp();
  const {i18n, t} = useTranslation();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const logout = useMovementStore((state) => state.logout);
  const stationLocaleRequestRef = useRef(0);

  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const routeTeamId = getRouteTeamContextId(location.pathname, session?.role);
  const themedTeam = session?.role === "user" ? activeTeam : teams.find((team) => team.id === routeTeamId);
  const teamThemeVars = getTeamThemeVars(themedTeam?.teamColor);
  const shellClassName = themedTeam ? "mobile-shell team-themed-shell" : "mobile-shell";
  const language = i18n.language === "en" ? "en" : "vi";
  const activeTeamName =
    activeTeam ? getLocalizedTeamName(activeTeam.name, language) : t("common.noTeam");
  const buildTimestampLabel = useMemo(
    () => formatBuildTimestamp(__APP_BUILD_TIMESTAMP__, language, t),
    [language, t],
  );
  useBodyTeamTheme(
    themedTeam ? `app-frame:${themedTeam.id}` : "app-frame:none",
    themedTeam ? teamThemeVars : null,
  );

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore backend logout errors and still clear local session
    }

    logout();
    navigate("/login");
  };
  const handleLanguageChange = async (language: "vi" | "en") => {
    if (session?.role !== "user") {
      return;
    }
    const requestId = stationLocaleRequestRef.current + 1;
    stationLocaleRequestRef.current = requestId;
    try {
      const seed = await fetchPlayerDatabase(language);
      if (stationLocaleRequestRef.current === requestId) {
        loadDatabase(seed);
      }
    } catch (error) {
      if (
        stationLocaleRequestRef.current === requestId &&
        !(error instanceof Error && error.message === "STALE_PLAYER_DATABASE_RESPONSE")
      ) {
        message.warning(t("stationData.refreshFailed"));
      }
    }
  };
  if (!session) {
    return children;
  }

  const navItems: FixedBottomNavigationItem[] = session.role !== "user" ? [
    {
      key: "teams",
      label: t("nav.teams"),
      icon: <TeamOutlined />,
      active: location.pathname.startsWith("/teams"),
      onClick: () => navigate("/teams"),
    },
    {
      key: "rank",
      label: t("nav.rank"),
      icon: <TrophyOutlined />,
      active: location.pathname.startsWith("/leaderboard"),
      onClick: () => navigate("/leaderboard"),
    },
    {
      key: "ops",
      label: t("nav.ops"),
      icon: <DashboardOutlined />,
      active: location.pathname.startsWith("/admin/operations"),
      onClick: () => navigate("/admin/operations"),
    },
    {
      key: "setting",
      label: t("nav.setting"),
      icon: <SettingOutlined />,
      active: location.pathname.startsWith("/system-config"),
      onClick: () => navigate("/system-config"),
    },
  ] : [
    {
      key: "stations",
      label: t("nav.stations"),
      icon: <QrcodeOutlined />,
      active: location.pathname.startsWith("/stations") && !location.pathname.startsWith("/stations/map"),
      onClick: () => navigate("/stations"),
    },
    {
      key: "rank",
      label: t("nav.rank"),
      icon: <TrophyOutlined />,
      active: location.pathname.startsWith("/leaderboard"),
      onClick: () => navigate("/leaderboard"),
    },
    {
      key: "final",
      label: t("nav.final"),
      icon: <FlagOutlined />,
      active: location.pathname.startsWith("/final"),
      onClick: () => navigate("/final"),
    },
    {
      key: "map",
      label: t("nav.map"),
      icon: <EnvironmentOutlined />,
      active: location.pathname.startsWith("/stations/map"),
      onClick: () => navigate("/stations/map"),
    },
  ];

  return (
    <Layout className={shellClassName} style={teamThemeVars}>
      <Layout.Header className="shell-header">
        <div className="header-content">
          <div className="header-spacer" />
          <div className="app-brand" aria-label="Application branding">
            <RunningPersonIcon className="app-runner-mark" />
            <span className="brand-title">MOVEment 2026</span>
          </div>

          <Flex vertical align="flex-end" gap={2} className="account-cluster">
            {session.role === "admin" && (
              <Button
                color="danger"
                variant="filled"
                icon={<LogoutOutlined />}
                onClick={handleLogout}>
                {t("common.admin")}
              </Button>
            )}
            {session.role === "user" && (
              <Button
                className="team-identity-button"
                color="danger"
                variant="filled"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                title={`${t("auth.logout")} ${activeTeamName}`}>
                {activeTeamName}
              </Button>
            )}
            <Typography.Text className="deploy-stamp" title={__APP_BUILD_TIMESTAMP__}>
              {buildTimestampLabel}
            </Typography.Text>
            <LanguageSwitch onChange={handleLanguageChange} />
          </Flex>
        </div>
      </Layout.Header>

      <Layout.Content className="page-stack">{children}</Layout.Content>
      <Layout.Footer className="shell-footer">
        <FixedBottomNavigation items={navItems} />
      </Layout.Footer>
    </Layout>
  );
}
