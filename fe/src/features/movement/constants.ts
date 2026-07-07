import type {Role, StationStatus} from "./types";

export enum ROLE {
  USER = "user",
  ADMIN = "admin",
  SYSTEM_ADMIN = "system-admin",
}

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
