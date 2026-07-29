import type {Session} from "./types";

export const SESSION_STORAGE_KEY = "movement-session";

function hashSessionValue(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function isSessionExpired(session: Session, now = Date.now()) {
  const expiresAt = new Date(session.expiresAt).getTime();
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

export function parseStoredSession(value: string | null): Session | null {
  if (!value) {
    return null;
  }

  try {
    const session = JSON.parse(value) as Session;
    if (
      !session.expiresAt ||
      !session.username ||
      (session.role !== "user" && session.role !== "admin") ||
      isSessionExpired(session)
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function readStoredSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const session = parseStoredSession(
    window.localStorage.getItem(SESSION_STORAGE_KEY),
  );
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return session;
}

export function persistStoredSession(session: Session | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSessionPrincipalKey(session: Session | null) {
  if (!session) {
    return null;
  }

  const principal = session.teamId ?? session.username;
  const fingerprint = hashSessionValue(
    [
      session.role,
      principal,
      session.expiresAt,
      session.accessToken ?? "cookie-session",
    ].join("|"),
  );
  return `${session.role}:${principal}:${fingerprint}`;
}

export function getStoredSessionPrincipalKey() {
  return getSessionPrincipalKey(readStoredSession());
}
