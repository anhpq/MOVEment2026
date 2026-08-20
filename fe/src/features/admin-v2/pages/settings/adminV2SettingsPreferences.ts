export type AdminV2NavigationDensity = "comfortable" | "compact";

export type AdminV2SettingsPreferences = Readonly<{
  navigationDensity: AdminV2NavigationDensity;
}>;

const SETTINGS_STORAGE_KEY = "movement.admin-v2.settings";
const defaultPreferences: AdminV2SettingsPreferences = {navigationDensity: "comfortable"};

export function readAdminV2SettingsPreferences(): AdminV2SettingsPreferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}");
    if (typeof stored === "object" && stored !== null && (stored as {navigationDensity?: unknown}).navigationDensity === "compact") {
      return {navigationDensity: "compact"};
    }
  } catch {
    // A malformed local preference must never prevent access to Admin Settings.
  }
  return defaultPreferences;
}

export function saveAdminV2SettingsPreferences(preferences: AdminV2SettingsPreferences) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
  applyAdminV2SettingsPreferences(preferences);
}

export function resetAdminV2SettingsPreferences() {
  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  applyAdminV2SettingsPreferences(defaultPreferences);
  return defaultPreferences;
}

export function applyAdminV2SettingsPreferences(preferences: AdminV2SettingsPreferences) {
  document.documentElement.dataset.adminV2NavigationDensity = preferences.navigationDensity;
}
