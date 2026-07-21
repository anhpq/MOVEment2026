import {Navigate, Route, Routes} from "react-router-dom";
import {ProtectedRoute} from "./layout/ProtectedRoute";
import {LoginPage} from "./pages/LoginPage";
import {QrLoginPage} from "./pages/QrLoginPage";
import {StationDetailPage} from "./pages/StationDetailPage";
import {StationEditorPage} from "./pages/StationEditorPage";
import {StationListPage} from "./pages/StationListPage";
import {StationsMapPage} from "./pages/StationsMapPage";
import {SystemConfigPage} from "./pages/SystemConfigPage";
import {TeamEditorPage} from "./pages/TeamEditorPage";
import {TeamListPage} from "./pages/TeamListPage";
import {LeaderboardPage} from "./pages/LeaderboardPage";
import {FinalPage} from "./pages/FinalPage";
import {AdminOperationsPage} from "./pages/AdminOperationsPage";

export function MovementRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/qr-login" element={<QrLoginPage />} />
      <Route
        path="/stations"
        element={
          <ProtectedRoute>
            <StationListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stations/map"
        element={
          <ProtectedRoute allow={["user"]}>
            <StationsMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stations/:stationId"
        element={
          <ProtectedRoute>
            <StationDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>}
      />
      <Route
        path="/final"
        element={<ProtectedRoute allow={["user"]}><FinalPage /></ProtectedRoute>}
      />
      <Route
        path="/admin/operations"
        element={<ProtectedRoute allow={["admin"]}><AdminOperationsPage /></ProtectedRoute>}
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute allow={["admin"]}>
            <TeamListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-config"
        element={
          <ProtectedRoute allow={["admin"]}>
            <SystemConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-config/stations/new"
        element={
          <ProtectedRoute allow={["admin"]}>
            <StationEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-config/stations/:stationId"
        element={
          <ProtectedRoute allow={["admin"]}>
            <StationEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-config/teams/new"
        element={
          <ProtectedRoute allow={["admin"]}>
            <TeamEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-config/teams/:teamId"
        element={
          <ProtectedRoute allow={["admin"]}>
            <TeamEditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/stations" replace />} />
    </Routes>
  );
}
