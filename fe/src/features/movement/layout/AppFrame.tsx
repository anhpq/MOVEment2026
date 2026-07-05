import {
  EnvironmentOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {Button, Layout, Typography, Image, Flex} from "antd";
import type {PropsWithChildren} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {ROLE_LABELS} from "../constants";
import {useMovementStore} from "../store";
import logo from "../../../assets/ST-logo.png";
import "./AppFrame.scss";

type AppFrameProps = Readonly<PropsWithChildren>;

export function AppFrame({children}: AppFrameProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useMovementStore((state) => state.session);
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const logout = useMovementStore((state) => state.logout);

  const activeTeam = teams.find((team) => team.id === activeTeamId);
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
        <div className="full-width">
          <Flex
            gap={12}
            justify="space-between"
            align="center"
            className="header-content">
            <Image
              src={logo}
              alt="MOVEment 2026"
              preview={false}
              style={{height: 24}}
              className="margin-auto"
            />

            <Button
              color="danger"
              variant="filled"
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate("/login");
              }}>
              {ROLE_LABELS[session.role]}
            </Button>
          </Flex>
          <Flex gap={12} justify="space-between" align="center">
            <div className="brand-mark">MOVEment 2026</div>
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
              Map
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
              {location.pathname.startsWith("/system-config") ?
                "System Config"
              : ""}
            </Button>
          )}
        </Flex>
      </Layout.Footer>
    </Layout>
  );
}
