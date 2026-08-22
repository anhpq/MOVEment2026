import {
  DashboardOutlined,
  FlagOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

type AdminV2Icon = typeof DashboardOutlined;

export type AdminV2RouteKey =
  | "dashboard"
  | "teams"
  | "stations"
  | "leaderboard"
  | "operations"
  | "scoreQueue"
  | "eventControl"
  | "finalChallenge"
  | "activityLogs"
  | "eventPreparation"
  | "settings";

export type AdminV2RouteDefinition = Readonly<{
  key: AdminV2RouteKey;
  path: string;
  labelKey: string;
  icon: AdminV2Icon;
  iconTone?: "cyan";
  parentKey?: "operations";
}>;

export const adminV2PrimaryRoutes: readonly AdminV2RouteDefinition[] = [
  {key: "dashboard", path: "/admin-v2/dashboard", labelKey: "adminV2.nav.dashboard", icon: DashboardOutlined},
  {key: "teams", path: "/admin-v2/teams", labelKey: "adminV2.nav.teams", icon: TeamOutlined},
  {key: "stations", path: "/admin-v2/stations", labelKey: "adminV2.nav.stations", icon: EnvironmentOutlined},
  {key: "leaderboard", path: "/admin-v2/leaderboard", labelKey: "adminV2.nav.leaderboard", icon: TrophyOutlined},
  {key: "operations", path: "/admin-v2/operations", labelKey: "adminV2.nav.operations", icon: ToolOutlined},
  {key: "settings", path: "/admin-v2/settings", labelKey: "adminV2.nav.settings", icon: SettingOutlined},
];

export const adminV2OperationsRoutes: readonly AdminV2RouteDefinition[] = [
  {key: "scoreQueue", path: "/admin-v2/operations/score-queue", labelKey: "adminV2.nav.scoreQueue", icon: UnorderedListOutlined, parentKey: "operations"},
  {key: "eventControl", path: "/admin-v2/operations/event-control", labelKey: "adminV2.nav.eventControl", icon: DashboardOutlined, parentKey: "operations"},
  {key: "finalChallenge", path: "/admin-v2/operations/final-challenge", labelKey: "adminV2.nav.finalChallenge", icon: FlagOutlined, parentKey: "operations"},
  {key: "activityLogs", path: "/admin-v2/operations/activity-logs", labelKey: "adminV2.nav.activityLogs", icon: HistoryOutlined, parentKey: "operations"},
  {key: "eventPreparation", path: "/admin-v2/operations/event-preparation", labelKey: "adminV2.nav.eventPreparation", icon: SafetyCertificateOutlined, parentKey: "operations"},
];

export const adminV2Routes = [...adminV2PrimaryRoutes, ...adminV2OperationsRoutes] as const;

export function getAdminV2Route(pathname: string) {
  return adminV2Routes.find((route) => route.path === pathname)
    ?? adminV2PrimaryRoutes.find((route) => isAdminV2RouteActive(route, pathname));
}

export function isAdminV2RouteActive(route: AdminV2RouteDefinition, pathname: string) {
  if (route.parentKey) return pathname === route.path;
  return pathname === route.path || (["teams", "stations", "operations"] as const).includes(route.key as "teams" | "stations" | "operations")
    && pathname.startsWith(`${route.path}/`);
}
