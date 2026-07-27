import {App as AntdApp, ConfigProvider} from "antd";
import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import {useTranslation} from "react-i18next";
import {BrowserRouter} from "react-router-dom";
import "./features/movement/i18n";
import App from "./App";

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
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
