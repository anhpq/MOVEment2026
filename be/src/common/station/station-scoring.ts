import { StationTrackingMode } from '@prisma/client';

export const TIME_STATION_AUTO_SCORE = 10;

export function getEffectiveStationMaxPoints(
  trackingMode: StationTrackingMode,
  maxPoints: number,
) {
  return trackingMode === StationTrackingMode.TIME ? TIME_STATION_AUTO_SCORE : maxPoints;
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
