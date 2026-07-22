import type {Role, StationStatus} from "./types";

export const ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const satisfies Record<string, Role>;

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  admin: "Admin",
};

export const STATUS_ORDER: Record<StationStatus, number> = {
  "In Progress": 0,
  New: 1,
  Finished: 2,
};

export const DEFAULT_STATION_MAX_POINTS = 30;
