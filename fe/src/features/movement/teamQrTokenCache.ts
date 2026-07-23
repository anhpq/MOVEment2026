const TEAM_QR_TOKEN_CACHE_KEY = "movement-admin-team-qr-token-cache";

type TeamQrTokenCache = Record<string, string>;

function readCache(): TeamQrTokenCache {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.sessionStorage.getItem(TEAM_QR_TOKEN_CACHE_KEY);
    return rawValue ? JSON.parse(rawValue) as TeamQrTokenCache : {};
  } catch {
    window.sessionStorage.removeItem(TEAM_QR_TOKEN_CACHE_KEY);
    return {};
  }
}

function writeCache(cache: TeamQrTokenCache) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(TEAM_QR_TOKEN_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedTeamQrToken(teamId: string) {
  return readCache()[teamId] ?? "";
}

export function setCachedTeamQrToken(teamId: string, rawToken: string) {
  const normalizedToken = rawToken.trim();
  if (!normalizedToken) {
    return;
  }

  writeCache({...readCache(), [teamId]: normalizedToken});
}

export function cacheTeamQrPayload(teamId: string, payload: string) {
  const value = payload.trim();
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);
    const token = url.searchParams.get("token")?.trim();
    if (token) {
      setCachedTeamQrToken(teamId, token);
      return;
    }
  } catch {
    setCachedTeamQrToken(teamId, value);
  }
}

export function buildTeamQrLoginUrl(rawToken: string) {
  const url = new URL("/qr-login", window.location.origin);
  url.searchParams.set("token", rawToken.trim());
  return url.toString();
}
