import {
  getPlayerDashboard,
  getPlayerProgress,
  getPlayerStations,
  type PlayerProgressResponse,
  type PlayerStationResponse,
} from "./api";
import type {LocalDatabaseSeed, TeamStation} from "./types";

export const PLAYER_MAP_IMAGE_SRC = "/images/map/suoitien-map1.png";

export function preloadPlayerMapImage() {
  const image = new globalThis.Image();
  image.src = PLAYER_MAP_IMAGE_SRC;
}

function mapProgressStatus(
  status: PlayerProgressResponse["status"],
): TeamStation["status"] {
  if (status === "COMPLETED") return "Finished";
  if (status === "PLAYING" || status === "CHECKED_IN") return "In Progress";
  return "New";
}

function buildPlayerSeed(
  stations: PlayerStationResponse[],
  dashboardTeam: Awaited<ReturnType<typeof getPlayerDashboard>>["team"],
): LocalDatabaseSeed {
  const teamId = String(dashboardTeam.id);

  return {
    activeTeamId: teamId,
    teams: [
      {
        id: teamId,
        name: dashboardTeam.name,
        username: dashboardTeam.username ?? `team${dashboardTeam.id}`,
        password: "",
        score: dashboardTeam.totalPoints,
        finish: stations.filter(
          (station) => station.progress?.status === "COMPLETED",
        ).length,
        totalTimeMinutes: Math.round(dashboardTeam.totalPlaySeconds / 60),
      },
    ],
    stationDefinitions: stations.map((station) => ({
      id: station.id,
      name: station.name,
      description: station.description ?? station.game?.clueText ?? null,
      durationMinutes: 0,
      trackingMode: station.trackingMode ?? "BOTH",
      youtubeUrl: station.game?.mediaUrl ?? null,
      gameType: station.game?.type,
      maxPoints: station.game?.maxPoints,
      markerX: station.mapX,
      markerY: station.mapY,
    })),
    teamStations: {
      [teamId]: stations.map((station) => ({
        id: `${teamId}-${station.id}`,
        name: station.name,
        status: mapProgressStatus(station.progress?.status ?? "AVAILABLE"),
        description: station.description ?? station.game?.clueText ?? null,
        durationMinutes: 0,
        trackingMode: station.trackingMode ?? "BOTH",
        youtubeUrl: station.game?.mediaUrl ?? null,
        score:
          station.progress?.scoreAchieved ?? station.game?.maxPoints ?? 0,
        startTime: station.progress?.checkedInAt ?? null,
        endTime:
          station.progress?.completedAt ??
          station.progress?.checkedOutAt ??
          null,
        teamId,
        stationId: station.id,
        maxPoints: station.game?.maxPoints,
        backendStatus: station.progress?.status ?? "AVAILABLE",
        gameType: station.game?.type,
      })),
    },
  };
}

export async function fetchPlayerDatabase(): Promise<LocalDatabaseSeed> {
  const [dashboard, stations, progress] = await Promise.all([
    getPlayerDashboard(),
    getPlayerStations(),
    getPlayerProgress(),
  ]);
  const progressByStation = new Map(
    progress.map((item) => [item.stationId, item]),
  );

  return buildPlayerSeed(
    stations.map((station) => ({
      ...station,
      progress: progressByStation.get(station.id) ?? station.progress,
    })),
    dashboard.team,
  );
}
