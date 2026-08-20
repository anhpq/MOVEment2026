import type {Role} from "../types";

export const ADMIN_PRIMARY_PATH = "/admin";
export const ADMIN_V1_HOME_PATH = "/teams";
export const ADMIN_V1_LEGACY_PATH = "/admin-v1";
export const ADMIN_V2_HOME_PATH = "/admin-v2/dashboard";

export function getRoleHomePath(role: Role | null | undefined) {
  return role === "admin" ? ADMIN_PRIMARY_PATH : role === "user" ? "/team/v2" : "/login";
}
