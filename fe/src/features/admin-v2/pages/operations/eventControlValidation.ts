export function validTimezone(value: string) {
  try { Intl.DateTimeFormat("en", {timeZone: value.trim()}); return true; } catch { return false; }
}

export const validNotifyBeforeMinutes = (value: unknown) => Number.isInteger(value) && (value as number) >= 1;
export const validCancelCooldownMinutes = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;
