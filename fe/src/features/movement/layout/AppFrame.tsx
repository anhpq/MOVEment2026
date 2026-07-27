import {
  DashboardOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  RubyOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {Button, Flex, Layout, Typography} from "antd";
import type {PropsWithChildren} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {logout as logoutApi} from "../api";
import {RunningPersonIcon} from "../components/RunningPersonIcon";
import {ROLE_LABELS} from "../constants";
import {useBodyTeamTheme} from "../hooks/useBodyTeamTheme";
import {useMovementStore} from "../store";
import {getTeamThemeVars} from "../teamTheme";
import {FixedBottomNavigation, type FixedBottomNavigationItem} from "./FixedBottomNavigation";
import "./AppFrame.scss";

type AppFrameProps = Readonly<PropsWithChildren>;

function formatBuildTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Deploy: unknown";
  }
  return `Deploy: ${date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

const buildTimestampLabel = formatBuildTimestamp(__APP_BUILD_TIMESTAMP__);

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
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const logout = useMovementStore((state) => state.logout);

  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const routeTeamId = getRouteTeamContextId(location.pathname, session?.role);
  const themedTeam = session?.role === "user" ? activeTeam : teams.find((team) => team.id === routeTeamId);
  const teamThemeVars = getTeamThemeVars(themedTeam?.teamColor);
  const shellClassName = themedTeam ? "mobile-shell team-themed-shell" : "mobile-shell";
  const activeTeamName = activeTeam?.name ?? "No team";
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
  if (!session) {
    return children;
  }

  const navItems: FixedBottomNavigationItem[] = session.role !== "user" ? [
    {
      key: "teams",
      label: "Teams",
      icon: <TeamOutlined />,
      active: location.pathname.startsWith("/teams"),
      onClick: () => navigate("/teams"),
    },
    {
      key: "rank",
      label: "Rank",
      icon: <TrophyOutlined />,
      active: location.pathname.startsWith("/leaderboard"),
      onClick: () => navigate("/leaderboard"),
    },
    {
      key: "ops",
      label: "Ops",
      icon: <DashboardOutlined />,
      active: location.pathname.startsWith("/admin/operations"),
      onClick: () => navigate("/admin/operations"),
    },
    {
      key: "setting",
      label: "Setting",
      icon: <SettingOutlined />,
      active: location.pathname.startsWith("/system-config"),
      onClick: () => navigate("/system-config"),
    },
  ] : [
    {
      key: "stations",
      label: "Stations",
      icon: <QrcodeOutlined />,
      active: location.pathname.startsWith("/stations") && !location.pathname.startsWith("/stations/map"),
      onClick: () => navigate("/stations"),
    },
    {
      key: "rank",
      label: "Rank",
      icon: <TrophyOutlined />,
      active: location.pathname.startsWith("/leaderboard"),
      onClick: () => navigate("/leaderboard"),
    },
    {
      key: "final",
      label: "Final",
      icon: <RubyOutlined />,
      active: location.pathname.startsWith("/final"),
      onClick: () => navigate("/final"),
    },
    {
      key: "map",
      label: "Map",
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
                {ROLE_LABELS[session.role]}
              </Button>
            )}
            {session.role === "user" && (
              <Button
                className="team-identity-button"
                color="danger"
                variant="filled"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                title={`Logout ${activeTeamName}`}>
                {activeTeamName}
              </Button>
            )}
            <Typography.Text className="deploy-stamp" title={__APP_BUILD_TIMESTAMP__}>
              {buildTimestampLabel}
            </Typography.Text>
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
