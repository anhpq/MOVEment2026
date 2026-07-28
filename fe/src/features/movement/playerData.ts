import {
  getPlayerDashboard,
  getPlayerProgress,
  getPlayerStations,
  type PlayerProgressResponse,
  type PlayerStationResponse,
} from "./api";
import type {LocalDatabaseSeed, TeamStation} from "./types";
import type {SupportedLanguage} from "./types";
import {readStoredLanguage} from "./i18n";

export type PlayerMapImageVariant = {
  src: string;
  width: number;
};

export const PLAYER_MAP_IMAGE_VARIANTS: PlayerMapImageVariant[] = [
  {src: "/images/map/suoitien-map-1280.webp", width: 1280},
  {src: "/images/map/suoitien-map-1920.webp", width: 1920},
  {src: "/images/map/suoitien-map-2950.webp", width: 2950},
];

export const PLAYER_MAP_IMAGE_SRC = PLAYER_MAP_IMAGE_VARIANTS[0].src;
let playerDatabaseRequestSeq = 0;

const playerMapImageCache = new Map<string, Promise<HTMLImageElement>>();

export function selectPlayerMapImageVariant(
  containerWidth: number,
  devicePixelRatio = globalThis.devicePixelRatio || 1,
  highZoom = false,
) {
  if (highZoom) {
    return PLAYER_MAP_IMAGE_VARIANTS[PLAYER_MAP_IMAGE_VARIANTS.length - 1];
  }

  const targetWidth = Math.max(1, containerWidth) * Math.max(1, devicePixelRatio);
  return (
    PLAYER_MAP_IMAGE_VARIANTS.find((variant) => variant.width >= targetWidth) ??
    PLAYER_MAP_IMAGE_VARIANTS[PLAYER_MAP_IMAGE_VARIANTS.length - 1]
  );
}

export function loadPlayerMapImage(src: string) {
  const cached = playerMapImageCache.get(src);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new globalThis.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load map image ${src}`));
    image.src = src;
  });
  playerMapImageCache.set(src, promise);
  return promise;
}

export function preloadPlayerMapImage() {
  void loadPlayerMapImage(PLAYER_MAP_IMAGE_SRC).catch(() => undefined);
}

export function getPlayerDatabaseRequestSeq() {
  return playerDatabaseRequestSeq;
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
        captainName: dashboardTeam.captainName ?? undefined,
        maxPossiblePoints: dashboardTeam.maxPossiblePoints,
        status: dashboardTeam.status,
        rank: dashboardTeam.rank,
        teamColor: dashboardTeam.teamColor ?? dashboardTeam.color ?? null,
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
      nameEn: station.nameEn,
      description: station.description ?? station.game?.clueText ?? null,
      descriptionEn: station.descriptionEn,
      durationMinutes: 0,
      trackingMode: station.trackingMode ?? "BOTH",
      youtubeUrl: station.game?.mediaUrl ?? null,
      imageUrls: station.imageUrls,
      gameType: station.game?.type,
      maxPoints: station.game?.maxPoints,
      markerX: station.mapX,
      markerY: station.mapY,
    })),
    teamStations: {
      [teamId]: stations.map((station) => ({
        id: `${teamId}-${station.id}`,
        name: station.name,
        nameEn: station.nameEn,
        status: mapProgressStatus(station.progress?.status ?? "AVAILABLE"),
        description: station.description ?? station.game?.clueText ?? null,
        descriptionEn: station.descriptionEn,
        durationMinutes: 0,
        trackingMode: station.trackingMode ?? "BOTH",
        youtubeUrl: station.game?.mediaUrl ?? null,
        imageUrls: station.imageUrls,
        score: station.progress?.scoreAchieved ?? 0,
        startTime: station.progress?.checkedInAt ?? null,
        endTime:
          station.progress?.completedAt ??
          station.progress?.checkedOutAt ??
          null,
        nextCheckInAllowedAt: station.progress?.nextCheckInAllowedAt ?? null,
        teamId,
        stationId: station.id,
        maxPoints: station.game?.maxPoints,
        backendStatus: station.progress?.status ?? "AVAILABLE",
        gameType: station.game?.type,
      })),
    },
  };
}

export async function fetchPlayerDatabase(language: SupportedLanguage = readStoredLanguage()): Promise<LocalDatabaseSeed> {
  const requestSeq = ++playerDatabaseRequestSeq;
  const [dashboard, stations, progress] = await Promise.all([
    getPlayerDashboard(),
    getPlayerStations(language),
    getPlayerProgress(language),
  ]);
  if (requestSeq !== playerDatabaseRequestSeq) {
    throw new Error("STALE_PLAYER_DATABASE_RESPONSE");
  }
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
