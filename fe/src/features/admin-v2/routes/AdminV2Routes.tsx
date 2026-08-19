import {Navigate, Route, Routes} from "react-router-dom";
import {AdminV2DashboardPage} from "../pages/dashboard/AdminV2DashboardPage";
import {AdminV2LeaderboardPage} from "../pages/leaderboard/AdminV2LeaderboardPage";
import {AdminV2NotFoundPage} from "../pages/foundation/AdminV2NotFoundPage";
import {AdminV2TeamsPage} from "../pages/teams/AdminV2TeamsPage";
import {AdminV2TeamDetailPage} from "../pages/teams/AdminV2TeamDetailPage";
import {AdminV2StationsPage} from "../pages/stations/AdminV2StationsPage";
import {AdminV2StationDetailPage} from "../pages/stations/AdminV2StationDetailPage";
import {AdminV2StationMapPage} from "../pages/stations/AdminV2StationMapPage";
import {AdminV2ScoreQueuePage} from "../pages/operations/AdminV2ScoreQueuePage";
import {AdminV2EventControlPage} from "../pages/operations/AdminV2EventControlPage";
import {AdminV2FinalChallengePage} from "../pages/operations/AdminV2FinalChallengePage";
import {AdminV2ActivityLogsPage} from "../pages/operations/AdminV2ActivityLogsPage";
import {AdminV2OperationsPage} from "../pages/operations/AdminV2OperationsPage";
import {AdminV2SettingsPage} from "../pages/settings/AdminV2SettingsPage";

export function AdminV2Routes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminV2DashboardPage />} />
      <Route path="teams" element={<AdminV2TeamsPage />} />
      <Route path="teams/:teamId" element={<AdminV2TeamDetailPage />} />
      <Route path="teams/:teamId/edit" element={<AdminV2TeamDetailPage />} />
      <Route path="teams/:teamId/qr" element={<AdminV2TeamDetailPage />} />
      <Route path="stations" element={<AdminV2StationsPage />} />
      <Route path="stations/:stationId" element={<AdminV2StationDetailPage />} />
      <Route path="stations/:stationId/edit" element={<AdminV2StationDetailPage />} />
      <Route path="stations/:stationId/qr" element={<AdminV2StationDetailPage />} />
      <Route path="stations/map" element={<AdminV2StationMapPage />} />
      <Route path="leaderboard" element={<AdminV2LeaderboardPage />} />
      <Route path="operations" element={<AdminV2OperationsPage />} />
      <Route path="operations/score-queue" element={<AdminV2ScoreQueuePage />} />
      <Route path="operations/event-control" element={<AdminV2EventControlPage />} />
      <Route path="operations/final-challenge" element={<AdminV2FinalChallengePage />} />
      <Route path="operations/activity-logs" element={<AdminV2ActivityLogsPage />} />
      <Route path="settings" element={<AdminV2SettingsPage />} />
      <Route path="*" element={<AdminV2NotFoundPage />} />
    </Routes>
  );
}
