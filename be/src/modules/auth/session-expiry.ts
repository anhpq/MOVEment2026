export const SESSION_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const HCMC_UTC_OFFSET_HOURS = 7;
const SESSION_CUTOFF_HOUR = 22;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the next daily 22:00 cutoff in Asia/Ho_Chi_Minh.
 * A session created exactly at or after 22:00 expires at 22:00 the next day.
 */
export function getNextSessionExpiry(now = new Date()) {
  const hcmNow = new Date(
    now.getTime() + HCMC_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
  const cutoffUtcMs = Date.UTC(
    hcmNow.getUTCFullYear(),
    hcmNow.getUTCMonth(),
    hcmNow.getUTCDate(),
    SESSION_CUTOFF_HOUR - HCMC_UTC_OFFSET_HOURS,
  );

  return new Date(
    now.getTime() >= cutoffUtcMs ? cutoffUtcMs + DAY_MS : cutoffUtcMs,
  );
}

export function toJwtExpirySeconds(expiresAt: Date) {
  return Math.floor(expiresAt.getTime() / 1000);
}
