import {useCallback} from "react";
import {useTranslation} from "react-i18next";
import {isAuthFailure} from "../api";
import {reconcilePlayerDatabase} from "../playerData";
import {useMovementStore} from "../store";
import {useVisibleOnlinePolling} from "./useVisibleOnlinePolling";

export function usePlayerStatePolling() {
  const {i18n} = useTranslation();
  const sessionRole = useMovementStore((state) => state.session?.role);
  const logout = useMovementStore((state) => state.logout);
  const language = i18n.language === "en" ? "en" : "vi";

  const refresh = useCallback(async () => {
    try {
      await reconcilePlayerDatabase(language);
    } catch (error) {
      if (isAuthFailure(error)) {
        logout();
      }
      // Transient failures intentionally preserve the last-known projection.
    }
  }, [language, logout]);

  useVisibleOnlinePolling(refresh, {enabled: sessionRole === "user"});
}
