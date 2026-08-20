export type AdminV2EventConfig = Readonly<{
  eventEndTime: string;
  finalStartsAt: string;
  notifyBeforeMinutes: number;
  cancelCooldownMinutes: number;
  timezone: string;
  serverNow?: string;
  isPastEventEnd?: boolean;
  isPastFinalStart?: boolean;
  secondsUntilFinal?: number;
}>;

function string(value: unknown) { return typeof value === "string" ? value : ""; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }

export function parseAdminV2EventConfig(value: unknown): AdminV2EventConfig | null {
  if (!value || typeof value !== "object") return null;
  const config = value as Record<string, unknown>;
  const eventEndTime = string(config.eventEndTime);
  const finalStartsAt = string(config.finalStartsAt);
  const timezone = string(config.timezone);
  const notifyBeforeMinutes = number(config.notifyBeforeMinutes);
  const cancelCooldownMinutes = number(config.cancelCooldownMinutes);
  if (!eventEndTime || !finalStartsAt || !timezone || notifyBeforeMinutes === null || cancelCooldownMinutes === null) return null;
  return {
    eventEndTime, finalStartsAt, timezone, notifyBeforeMinutes, cancelCooldownMinutes,
    serverNow: string(config.serverNow) || undefined,
    isPastEventEnd: typeof config.isPastEventEnd === "boolean" ? config.isPastEventEnd : undefined,
    isPastFinalStart: typeof config.isPastFinalStart === "boolean" ? config.isPastFinalStart : undefined,
    secondsUntilFinal: number(config.secondsUntilFinal) ?? undefined,
  };
}
