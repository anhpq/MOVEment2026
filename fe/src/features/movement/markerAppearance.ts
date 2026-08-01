import type {TeamStation} from "./types";

export const COMPLETED_MARKER_OPACITY = 0.4;
export const SELECTED_COMPLETED_MARKER_OPACITY = 0.7;

export type StationMarkerStateSource = Pick<
  TeamStation,
  "status" | "backendStatus"
>;

export type StationMarkerAppearance = {
  isCompleted: boolean;
  isLocked: boolean;
  opacity: number;
  usesSilverPurple: boolean;
};

export function isStationMarkerCompleted(
  station?: StationMarkerStateSource | null,
) {
  if (!station) {
    return false;
  }

  if (station.backendStatus !== undefined) {
    return station.backendStatus === "COMPLETED";
  }

  return station.status === "Finished";
}

export function isStationMarkerLocked(
  station?: StationMarkerStateSource | null,
) {
  return station?.backendStatus === "LOCKED";
}

export function getStationMarkerAppearance(
  station?: StationMarkerStateSource | null,
  isSelected = false,
): StationMarkerAppearance {
  const isLocked = isStationMarkerLocked(station);
  const isCompleted = !isLocked && isStationMarkerCompleted(station);

  return {
    isCompleted,
    isLocked,
    opacity:
      isCompleted ?
        isSelected ? SELECTED_COMPLETED_MARKER_OPACITY : COMPLETED_MARKER_OPACITY
      : 1,
    usesSilverPurple: isLocked || isCompleted,
  };
}
