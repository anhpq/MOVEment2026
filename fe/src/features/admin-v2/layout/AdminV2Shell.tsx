import type {PropsWithChildren} from "react";
import {useEffect} from "react";
import {useTranslation} from "react-i18next";
import {AdminV2Header} from "./AdminV2Header";
import {AdminV2MobileNav} from "./AdminV2MobileNav";
import {AdminV2Sidebar} from "./AdminV2Sidebar";
import {applyAdminV2SettingsPreferences, readAdminV2SettingsPreferences} from "../pages/settings/adminV2SettingsPreferences";

export function AdminV2Shell({children}: PropsWithChildren) {
  const {t} = useTranslation();
  useEffect(() => { applyAdminV2SettingsPreferences(readAdminV2SettingsPreferences()); }, []);

  return (
    <div className="admin-v2-root">
      <a className="admin-v2-skip-link" href="#admin-v2-main">{t("adminV2.skipToContent")}</a>
      <AdminV2Sidebar />
      <div className="admin-v2-workspace">
        <AdminV2Header />
        <main className="admin-v2-main" id="admin-v2-main" tabIndex={-1}>{children}</main>
      </div>
      <AdminV2MobileNav />
    </div>
  );
}
