import type {AdminStationQrTokenResponse} from "./api";

const STATION_QR_TOKEN_CACHE_KEY = "movement-admin-station-qr-token-cache";

type StationQrTokenCache = Record<string, Partial<Record<AdminStationQrTokenResponse["purpose"], string>>>;

function readCache(): StationQrTokenCache {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.sessionStorage.getItem(STATION_QR_TOKEN_CACHE_KEY);
    return rawValue ? JSON.parse(rawValue) as StationQrTokenCache : {};
  } catch {
    window.sessionStorage.removeItem(STATION_QR_TOKEN_CACHE_KEY);
    return {};
  }
}

function writeCache(cache: StationQrTokenCache) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STATION_QR_TOKEN_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedStationQrToken(stationId: string, purpose: AdminStationQrTokenResponse["purpose"]) {
  return readCache()[stationId]?.[purpose] ?? "";
}

export function setCachedStationQrToken(
  stationId: string,
  purpose: AdminStationQrTokenResponse["purpose"],
  rawToken: string,
) {
  const normalizedToken = rawToken.trim();
  if (!normalizedToken) {
    return;
  }

  const cache = readCache();
  writeCache({
    ...cache,
    [stationId]: {
      ...cache[stationId],
      [purpose]: normalizedToken,
    },
  });
}

export function cacheStationQrTokens(stationId: string, tokens: AdminStationQrTokenResponse[]) {
  for (const token of tokens) {
    if (token.rawToken) {
      setCachedStationQrToken(stationId, token.purpose, token.rawToken);
    }
  }
}
