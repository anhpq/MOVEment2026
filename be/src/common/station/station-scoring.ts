import { StationTrackingMode } from '@prisma/client';

export const TIME_STATION_AUTO_SCORE = 10;
export const SCORE_ENTRY_MAX = 105;

export function isReferenceExceeded(maxPoints: number | null, score: number) {
  return maxPoints !== null && score > maxPoints;
}

export function getStationPlaySeconds(
  trackingMode: StationTrackingMode,
  checkedInAt: Date | null,
  checkedOutAt: Date | null,
) {
  if (trackingMode === StationTrackingMode.SCORE || !checkedInAt || !checkedOutAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((checkedOutAt.getTime() - checkedInAt.getTime()) / 1000),
  );
}
