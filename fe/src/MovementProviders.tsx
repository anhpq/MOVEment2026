import {App as AntdApp, ConfigProvider} from "antd";
import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import {useTranslation} from "react-i18next";
import {useEffect} from "react";
import {BrowserRouter} from "react-router-dom";
import "./features/movement/i18n";
import {useMovementStore} from "./features/movement/store";
import App from "./App";

function SessionExpirySync() {
  const session = useMovementStore((state) => state.session);
  const clearSession = useMovementStore((state) => state.logout);

  useEffect(() => {
    if (!session) {
      return;
    }

    const expiresAt = new Date(session.expiresAt).getTime();
    const remainingMs = expiresAt - Date.now();
    if (!Number.isFinite(expiresAt) || remainingMs <= 0) {
      clearSession();
      return;
    }

    const timeoutId = window.setTimeout(clearSession, remainingMs);
    return () => window.clearTimeout(timeoutId);
  }, [clearSession, session]);

  return null;
}

export function MovementProviders() {
  const {i18n} = useTranslation();

  return (
    <ConfigProvider
      locale={i18n.language === "en" ? enUS : viVN}
      theme={{
        token: {
          colorPrimary: "#ff7a59",
          colorInfo: "#1677ff",
          colorSuccess: "#2f9e44",
          colorWarning: "#f59f00",
          borderRadius: 18,
          fontFamily: "Aptos, Segoe UI Variable, Segoe UI, sans-serif",
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <SessionExpirySync />
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
