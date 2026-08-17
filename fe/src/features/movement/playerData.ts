import {
  getPlayerCatalog,
  getPlayerDashboard,
  getPlayerFinal,
  getPlayerProgress,
  getPlayerState,
  getPlayerStationImages,
  getPlayerStations,
  isAuthFailure,
  isCompatibilityFallback,
  type PlayerCatalogStationResponse,
  type PlayerProgressResponse,
  type PlayerStateProgressResponse,
  type PlayerStationResponse,
} from "./api";
import {ApiError} from "./apiClient";
import {readStoredLanguage} from "./i18n";
import {
  clearSingleFlight,
  isReducedDataMode,
  runSingleFlight,
  StaleSessionResponseError,
} from "./runtimeCoordinator";
import {getSessionPrincipalKey} from "./sessionIdentity";
import {useMovementStore} from "./store";
import type {
  LocalDatabaseSeed,
  PlayerFinalSummary,
  SupportedLanguage,
  TeamStation,
} from "./types";

export type PlayerMapImageVariant = {
  src: string;
  width: number;
};

export const PLAYER_MAP_IMAGE_VARIANTS: PlayerMapImageVariant[] = [
  {src: "/images/map/suoitien-map-1280.webp", width: 1280},
  {src: "/images/map/suoitien-map-1920.webp", width: 1920},
  {src: "/images/map/suoitien-map-2950.webp", width: 2950},
];

const PLAYER_MAP_REDUCED_DATA_MAX_WIDTH = 1920;

type PlayerDataMode = "lean" | "legacy";
type SeedProgress = PlayerProgressResponse | PlayerStateProgressResponse;
type SeedStation = Omit<PlayerCatalogStationResponse, "imageCount"> & {
  imageCount: number;
  imageUrls: string[];
  progress: SeedProgress | null;
};

let playerDatabaseRequestSeq = 0;
let resolvedPlayerDataMode: PlayerDataMode | null = null;
let catalogCache: {
  language: SupportedLanguage;
  version: string;
  stations: PlayerCatalogStationResponse[];
} | null = null;

const playerMapImageCache = new Map<string, Promise<HTMLImageElement>>();
const stationImageUrlCache = new Map<string, Promise<string[]>>();

function getConfiguredPlayerDataMode(): PlayerDataMode | null {
  const value = import.meta.env.VITE_PLAYER_DATA_MODE?.trim().toLowerCase();
  return value === "legacy" || value === "lean" ? value : null;
}

function getCurrentDataSessionKey() {
  return getSessionPrincipalKey(useMovementStore.getState().session);
}

function assertCurrentDataSession(expectedKey: string | null) {
  if (!expectedKey || getCurrentDataSessionKey() !== expectedKey) {
    throw new StaleSessionResponseError();
  }
}

export function selectPlayerMapImageVariant(
  containerWidth: number,
  devicePixelRatio = globalThis.devicePixelRatio || 1,
  highZoom = false,
) {
  const variants =
    isReducedDataMode() ?
      PLAYER_MAP_IMAGE_VARIANTS.filter(
        (variant) => variant.width <= PLAYER_MAP_REDUCED_DATA_MAX_WIDTH,
      )
    : PLAYER_MAP_IMAGE_VARIANTS;

  if (highZoom) {
    return variants[variants.length - 1];
  }

  const targetWidth = Math.max(1, containerWidth) * Math.max(1, devicePixelRatio);
  return (
    variants.find((variant) => variant.width >= targetWidth) ??
    variants[variants.length - 1]
  );
}

function loadPlayerMapImageOnce(src: string) {
  const cached = playerMapImageCache.get(src);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new globalThis.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("PLAYER_MAP_IMAGE_LOAD_FAILED"));
    image.src = src;
  });
  playerMapImageCache.set(src, promise);
  void promise.catch(() => {
    if (playerMapImageCache.get(src) === promise) {
      playerMapImageCache.delete(src);
    }
  });
  return promise;
}

export async function loadPlayerMapImage(src: string) {
  try {
    return await loadPlayerMapImageOnce(src);
  } catch {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 300));
    return loadPlayerMapImageOnce(src);
  }
}

export function getPlayerDatabaseRequestSeq() {
  return playerDatabaseRequestSeq;
}

function mapProgressStatus(status: SeedProgress["status"]): TeamStation["status"] {
  if (status === "COMPLETED") return "Finished";
  if (status === "PLAYING" || status === "CHECKED_IN") return "In Progress";
  return "New";
}

function buildPlayerSeed(
  stations: SeedStation[],
  dashboardTeam: Awaited<ReturnType<typeof getPlayerDashboard>>["team"],
  completedStations: number,
  dataSessionKey: string,
  finalSummary?: PlayerFinalSummary,
): LocalDatabaseSeed {
  const teamId = String(dashboardTeam.id);

  return {
    dataSessionKey,
    ...(finalSummary ? {finalSummary} : {}),
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
        finish: completedStations,
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
      imageUrls: station.imageUrls,
      imageCount: station.imageCount,
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
        imageUrls: station.imageUrls,
        imageCount: station.imageCount,
        score: station.progress?.scoreAchieved ?? 0,
        startTime: station.progress?.checkedInAt ?? null,
        endTime:
          station.progress?.completedAt ??
          station.progress?.checkedOutAt ??
          null,
        nextCheckInAllowedAt: station.progress?.nextCheckInAllowedAt ?? null,
        teamId,
        stationId: station.id,
        progressId: station.progress?.id,
        maxPoints: station.game?.maxPoints,
        backendStatus: station.progress?.status ?? "AVAILABLE",
        gameType: station.game?.type,
      })),
    },
  };
}

function toPlayerFinalSummary(
  final: PlayerFinalSummary,
): PlayerFinalSummary {
  return {
    isOpen: final.isOpen,
    canSubmit: final.canSubmit,
    blockedByActiveStation: final.blockedByActiveStation,
    activeStationId: final.activeStationId,
    finalStartsAt: final.finalStartsAt,
    eventEndTime: final.eventEndTime,
    notifyBeforeMinutes: final.notifyBeforeMinutes,
    secondsUntilFinal: final.secondsUntilFinal,
    stationCheckInClosed: final.stationCheckInClosed,
    phase: final.phase,
    pendingScoreStationId: final.pendingScoreStationId,
  };
}

async function fetchLegacyPlayerFinalSummary() {
  try {
    return toPlayerFinalSummary(await getPlayerFinal());
  } catch (error) {
    if (isAuthFailure(error)) {
      throw error;
    }
    return undefined;
  }
}

function normalizeLegacyStations(
  stations: PlayerStationResponse[],
  progress: PlayerProgressResponse[],
): SeedStation[] {
  const progressByStation = new Map(
    progress.map((item) => [item.stationId, item]),
  );
  return stations.map((station) => ({
    id: station.id,
    name: station.name,
    description: station.description,
    mapX: station.mapX,
    mapY: station.mapY,
    trackingMode: station.trackingMode,
    imageCount: station.imageUrls.length,
    imageUrls: station.imageUrls,
    game: station.game,
    progress: progressByStation.get(station.id) ?? station.progress,
  }));
}

async function fetchLegacyPlayerDatabase(
  language: SupportedLanguage,
  dataSessionKey: string,
) {
  const [dashboard, stations, progress, finalSummary] = await Promise.all([
    getPlayerDashboard(),
    getPlayerStations(language),
    getPlayerProgress(language),
    fetchLegacyPlayerFinalSummary(),
  ]);
  assertCurrentDataSession(dataSessionKey);
  return buildPlayerSeed(
    normalizeLegacyStations(stations, progress),
    dashboard.team,
    dashboard.completedStations,
    dataSessionKey,
    finalSummary,
  );
}

async function getCatalogStations(
  language: SupportedLanguage,
  catalogVersion: string,
) {
  if (
    catalogCache?.language === language &&
    catalogCache.version === catalogVersion
  ) {
    return catalogCache.stations;
  }

  const catalog = await getPlayerCatalog(language);
  if (catalogCache?.version !== catalog.catalogVersion) {
    stationImageUrlCache.clear();
  }
  catalogCache = {
    language,
    version: catalog.catalogVersion,
    stations: catalog.stations,
  };
  return catalog.stations;
}

async function fetchLeanPlayerDatabase(
  language: SupportedLanguage,
  dataSessionKey: string,
) {
  const state = await getPlayerState();
  const stations = await getCatalogStations(language, state.catalogVersion);
  assertCurrentDataSession(dataSessionKey);
  const progressByStation = new Map(
    state.progress.map((item) => [item.stationId, item]),
  );
  return buildPlayerSeed(
    stations.map((station) => ({
      ...station,
      imageUrls: [],
      progress: progressByStation.get(station.id) ?? null,
    })),
    state.team,
    state.completedStations,
    dataSessionKey,
    toPlayerFinalSummary(state.final),
  );
}

async function fetchPlayerDatabaseUncoordinated(
  language: SupportedLanguage,
  dataSessionKey: string,
) {
  const configuredMode = getConfiguredPlayerDataMode();
  if (configuredMode === "legacy" || resolvedPlayerDataMode === "legacy") {
    return fetchLegacyPlayerDatabase(language, dataSessionKey);
  }

  try {
    const seed = await fetchLeanPlayerDatabase(language, dataSessionKey);
    resolvedPlayerDataMode = "lean";
    return seed;
  } catch (error) {
    if (!isCompatibilityFallback(error)) {
      throw error;
    }
    resolvedPlayerDataMode = "legacy";
    return fetchLegacyPlayerDatabase(language, dataSessionKey);
  }
}

export function fetchPlayerDatabase(
  language: SupportedLanguage = readStoredLanguage(),
  {fresh = false}: {fresh?: boolean} = {},
): Promise<LocalDatabaseSeed> {
  const dataSessionKey = getCurrentDataSessionKey();
  if (!dataSessionKey) {
    return Promise.reject(new StaleSessionResponseError());
  }

  const flightKey = `player-database:${dataSessionKey}:${language}`;
  if (fresh) {
    clearSingleFlight(flightKey);
  }
  return runSingleFlight(flightKey, async () => {
    const requestSeq = ++playerDatabaseRequestSeq;
    const seed = await fetchPlayerDatabaseUncoordinated(language, dataSessionKey);
    assertCurrentDataSession(dataSessionKey);
    if (requestSeq !== playerDatabaseRequestSeq) {
      throw new Error("STALE_PLAYER_DATABASE_RESPONSE");
    }
    return seed;
  });
}

export async function reconcilePlayerDatabase(
  language: SupportedLanguage = readStoredLanguage(),
  options: {fresh?: boolean} = {},
) {
  const seed = await fetchPlayerDatabase(language, options);
  const currentKey = getCurrentDataSessionKey();
  if (!currentKey || seed.dataSessionKey !== currentKey) {
    throw new StaleSessionResponseError();
  }
  useMovementStore.getState().loadDatabase(seed);
  return seed;
}

function isMutationOutcomeUnknown(error: unknown) {
  return error instanceof ApiError && error.retryable;
}

export async function executePlayerMutation<T>(
  mutation: () => Promise<T>,
  language: SupportedLanguage = readStoredLanguage(),
) {
  let result: T;
  try {
    result = await mutation();
  } catch (error) {
    if (isAuthFailure(error)) {
      useMovementStore.getState().logout();
    } else if (isMutationOutcomeUnknown(error)) {
      try {
        await reconcilePlayerDatabase(language, {fresh: true});
      } catch (reconciliationError) {
        if (isAuthFailure(reconciliationError)) {
          useMovementStore.getState().logout();
        }
      }
    }
    throw error;
  }

  try {
    await reconcilePlayerDatabase(language, {fresh: true});
    return {result, reconciled: true as const};
  } catch (reconciliationError) {
    if (isAuthFailure(reconciliationError)) {
      useMovementStore.getState().logout();
    }
    return {
      result,
      reconciled: false as const,
      reconciliationError,
    };
  }
}

export function fetchPlayerStationImageUrls(
  stationId: string,
  language: SupportedLanguage = readStoredLanguage(),
) {
  const dataSessionKey = getCurrentDataSessionKey();
  if (!dataSessionKey) {
    return Promise.reject(new StaleSessionResponseError());
  }
  const key = `${dataSessionKey}:${stationId}`;
  const cached = stationImageUrlCache.get(key);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    const useLegacy =
      getConfiguredPlayerDataMode() === "legacy" ||
      resolvedPlayerDataMode === "legacy";
    let imageUrls: string[];
    if (useLegacy) {
      const stations = await getPlayerStations(language);
      imageUrls = stations.find((station) => station.id === stationId)?.imageUrls ?? [];
    } else {
      try {
        imageUrls = (await getPlayerStationImages(stationId)).imageUrls;
      } catch (error) {
        if (!isCompatibilityFallback(error)) {
          throw error;
        }
        resolvedPlayerDataMode = "legacy";
        const stations = await getPlayerStations(language);
        imageUrls = stations.find((station) => station.id === stationId)?.imageUrls ?? [];
      }
    }
    assertCurrentDataSession(dataSessionKey);
    return imageUrls;
  })();
  stationImageUrlCache.set(key, request);
  void request.catch(() => {
    if (stationImageUrlCache.get(key) === request) {
      stationImageUrlCache.delete(key);
    }
  });
  return request;
}

export function resetPlayerRuntimeCachesForTests() {
  resolvedPlayerDataMode = null;
  catalogCache = null;
  playerDatabaseRequestSeq = 0;
  playerMapImageCache.clear();
  stationImageUrlCache.clear();
}
