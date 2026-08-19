import {Navigate, Route, Routes} from "react-router-dom";
import {AdminV2DashboardPage} from "../pages/dashboard/AdminV2DashboardPage";
import {AdminV2FoundationPage} from "../pages/foundation/AdminV2FoundationPage";
import {AdminV2NotFoundPage} from "../pages/foundation/AdminV2NotFoundPage";
import {AdminV2TeamsPage} from "../pages/teams/AdminV2TeamsPage";

export function AdminV2Routes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminV2DashboardPage />} />
      <Route path="teams" element={<AdminV2TeamsPage />} />
      <Route path="stations" element={<AdminV2FoundationPage />} />
      <Route path="stations/map" element={<AdminV2FoundationPage />} />
      <Route path="leaderboard" element={<AdminV2FoundationPage />} />
      <Route path="operations" element={<AdminV2FoundationPage />} />
      <Route path="operations/score-queue" element={<AdminV2FoundationPage />} />
      <Route path="operations/event-control" element={<AdminV2FoundationPage />} />
      <Route path="operations/final-challenge" element={<AdminV2FoundationPage />} />
      <Route path="operations/activity-logs" element={<AdminV2FoundationPage />} />
      <Route path="settings" element={<AdminV2FoundationPage />} />
      <Route path="*" element={<AdminV2NotFoundPage />} />
    </Routes>
  );
}
