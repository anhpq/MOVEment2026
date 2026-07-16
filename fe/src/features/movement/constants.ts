import type {Role, StationStatus} from "./types";

export const ROLE = {
  USER: "user",
  ADMIN: "admin",
  SYSTEM_ADMIN: "system-admin",
} as const satisfies Record<string, Role>;

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  admin: "Admin",
  "system-admin": "System Admin",
};

export const STATUS_ORDER: Record<StationStatus, number> = {
  "In Progress": 0,
  New: 1,
  Finish: 2,
};
