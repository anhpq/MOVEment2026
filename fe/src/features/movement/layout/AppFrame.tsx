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
import {useMovementStore} from "../store";
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

export function AppFrame({children}: AppFrameProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const logout = useMovementStore((state) => state.logout);

  const activeTeam = teams.find((team) => team.id === activeTeamId);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore backend logout errors and still clear local session
    }

    logout();
    navigate("/login");
  };
  const totalStation = useMovementStore(
    (state) => state.stationDefinitions.length,
  );
  const totalTeams = teams.length;

  if (!session) {
    return children;
  }

  return (
    <Layout className="mobile-shell">
      <Layout.Header className="shell-header">
        <div className="header-content">
          <div className="header-spacer" />
          <div className="app-brand" aria-label="Application branding">
            <RunningPersonIcon className="app-runner-mark" />
            <span>MOVEment 2026</span>
          </div>

          <Flex vertical align="flex-end" gap={2} className="account-cluster">
            <Button
              color="danger"
              variant="filled"
              icon={<LogoutOutlined />}
              onClick={handleLogout}>
              {ROLE_LABELS[session.role]}
            </Button>
            <Typography.Text className="deploy-stamp" title={__APP_BUILD_TIMESTAMP__}>
              {buildTimestampLabel}
            </Typography.Text>
            <Typography.Text className="brand-subtitle">
              Current team: <b>{activeTeam?.name ?? "No team"}</b>
            </Typography.Text>
          </Flex>
        </div>
      </Layout.Header>

      <Layout.Content className="page-stack">{children}</Layout.Content>
      <Layout.Footer className="shell-footer">
        <Flex gap={8} justify="center" align="center" className="full-width">
          {session.role !== "user" && (
            <Button
              size="large"
              shape="round"
              type={
                location.pathname.startsWith("/teams") ? "primary" : "default"
              }
              icon={<TeamOutlined />}
              onClick={() => navigate("/teams")}>
              {location.pathname.startsWith("/teams") ?
                `Teams (${totalTeams})`
              : totalTeams}
            </Button>
          )}
          <Button
            size="large"
            shape="round"
            type={
              (
                location.pathname.startsWith("/stations") &&
                !location.pathname.startsWith("/stations/map")
              ) ?
                "primary"
              : "default"
            }
            icon={<QrcodeOutlined />}
            onClick={() => navigate("/stations")}>
            {location.pathname.startsWith("/stations") ?
              `Stations (${totalStation})`
            : totalStation}
          </Button>
          <Button
            size="large"
            shape="round"
            type={
              location.pathname.startsWith("/leaderboard") ?
                "primary"
              : "default"
            }
            icon={<TrophyOutlined />}
            onClick={() => navigate("/leaderboard")}>
            {location.pathname.startsWith("/leaderboard") ? "Rank" : ""}
          </Button>
          {session.role === "user" && (
            <Button
              size="large"
              shape="round"
              type={
                location.pathname.startsWith("/final") ? "primary" : "default"
              }
              icon={<RubyOutlined />}
              onClick={() => navigate("/final")}>
              {location.pathname.startsWith("/final") ? "Final Cipher" : ""}
            </Button>
          )}
          {session.role === "user" && (
            <Button
              size="large"
              shape="round"
              type={
                location.pathname.startsWith("/stations/map") ?
                  "primary"
                : "default"
              }
              icon={<EnvironmentOutlined />}
              onClick={() => navigate("/stations/map")}>
              {location.pathname.startsWith("/stations/map") ? "Map" : ""}
            </Button>
          )}
          {session.role !== "user" && (
            <Button
              size="large"
              shape="round"
              type={
                location.pathname.startsWith("/admin/operations") ?
                  "primary"
                : "default"
              }
              icon={<DashboardOutlined />}
              onClick={() => navigate("/admin/operations")}>
              {location.pathname.startsWith("/admin/operations") ? "Ops" : ""}
            </Button>
          )}
          {session.role !== "user" && (
            <Button
              size="large"
              shape="round"
              type={
                location.pathname.startsWith("/system-config") ?
                  "primary"
                : "default"
              }
              icon={<SettingOutlined />}
              onClick={() => navigate("/system-config")}>
              {location.pathname.startsWith("/system-config") ? "Setting" : ""}
            </Button>
          )}
        </Flex>
      </Layout.Footer>
    </Layout>
  );
}
