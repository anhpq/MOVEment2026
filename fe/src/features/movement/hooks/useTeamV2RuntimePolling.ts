import {useCallback} from "react";
import {useTranslation} from "react-i18next";
import {isAuthFailure} from "../api";
import {reconcileTeamV2Runtime} from "../playerData";
import {shouldPollTeamRuntime} from "../runtimeCoordinator";
import {useMovementStore} from "../store";
import {useVisibleOnlinePolling} from "./useVisibleOnlinePolling";

export function useTeamV2RuntimePolling() {
  const {i18n} = useTranslation();
  const sessionRole = useMovementStore((state) => state.session?.role);
  const finalPhase = useMovementStore((state) => state.finalSummary?.phase);
  const logout = useMovementStore((state) => state.logout);
  const language = i18n.language === "en" ? "en" : "vi";

  const refresh = useCallback(async () => {
    try {
      await reconcileTeamV2Runtime(language);
    } catch (error) {
      if (isAuthFailure(error)) {
        logout();
      }
    }
  }, [language, logout]);

  useVisibleOnlinePolling(refresh, {
    enabled: shouldPollTeamRuntime(sessionRole, finalPhase),
  });
}
