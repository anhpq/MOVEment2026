import {ProtectedRoute} from "../movement/layout/ProtectedRoute";
import {ensureAdminV2Resources} from "./i18n/resources";
import {AdminV2Shell} from "./layout/AdminV2Shell";
import {AdminV2Routes} from "./routes/AdminV2Routes";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/admin-v2.css";

export function AdminV2Entry() {
  ensureAdminV2Resources();

  return (
    <ProtectedRoute allow={["admin"]} fullscreen>
      <AdminV2Shell>
        <AdminV2Routes />
      </AdminV2Shell>
    </ProtectedRoute>
  );
}
