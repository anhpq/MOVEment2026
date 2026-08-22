export const RECOMMENDED_STATION_CLOSE_LEAD_MINUTES = 15;

function parseTimeToMinutes(value?: string) {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value?.trim() ?? "");
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function getRecommendedStationCloseTime(finalStartsAt?: string) {
  const finalStart = parseTimeToMinutes(finalStartsAt);
  if (finalStart === null || finalStart < RECOMMENDED_STATION_CLOSE_LEAD_MINUTES) return null;

  const closeTime = finalStart - RECOMMENDED_STATION_CLOSE_LEAD_MINUTES;
  const hours = Math.floor(closeTime / 60);
  const minutes = closeTime % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isRecommendedStationCloseTime(eventEndTime?: string, finalStartsAt?: string) {
  const eventEnd = parseTimeToMinutes(eventEndTime);
  const recommendedTime = getRecommendedStationCloseTime(finalStartsAt);
  const recommendedMinutes = parseTimeToMinutes(recommendedTime ?? undefined);
  return eventEnd !== null && recommendedMinutes !== null && eventEnd === recommendedMinutes;
}
