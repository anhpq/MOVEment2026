import {Navigate, Route, Routes} from "react-router-dom";
import {LazyRouteBoundary} from "./routing/LazyRouteBoundary";
import {lazyRoute} from "./routing/lazyRoute";
import {useMovementStore} from "./store";

function RoleAwareFallback() {
  const role = useMovementStore((state) => state.session?.role);
  return <Navigate to={role === "admin" ? "/teams" : role === "user" ? "/team/v2" : "/login"} replace />;
}

const ProtectedRoute = lazyRoute(() =>
  import("./layout/ProtectedRoute").then(({ProtectedRoute: component}) => ({
    default: component,
  })),
);
const LoginPage = lazyRoute(() =>
  import("./pages/LoginPage").then(({LoginPage: component}) => ({default: component})),
);
const QrLoginPage = lazyRoute(() =>
  import("./pages/QrLoginPage").then(({QrLoginPage: component}) => ({default: component})),
);
const StationDetailPage = lazyRoute(() =>
  import("./pages/StationDetailPage").then(({StationDetailPage: component}) => ({
    default: component,
  })),
);
const StationEditorPage = lazyRoute(() =>
  import("./pages/StationEditorPage").then(({StationEditorPage: component}) => ({
    default: component,
  })),
);
const StationListPage = lazyRoute(() =>
  import("./pages/StationListPage").then(({StationListPage: component}) => ({
    default: component,
  })),
);
const StationsMapPage = lazyRoute(() =>
  import("./pages/StationsMapPage").then(({StationsMapPage: component}) => ({
    default: component,
  })),
);
const SystemConfigPage = lazyRoute(() =>
  import("./pages/SystemConfigPage").then(({SystemConfigPage: component}) => ({
    default: component,
  })),
);
const TeamEditorPage = lazyRoute(() =>
  import("./pages/TeamEditorPage").then(({TeamEditorPage: component}) => ({
    default: component,
  })),
);
const TeamListPage = lazyRoute(() =>
  import("./pages/TeamListPage").then(({TeamListPage: component}) => ({
    default: component,
  })),
);
const TeamGameplayV2Page = lazyRoute(() =>
  import("./pages/TeamGameplayV2Page").then(({TeamGameplayV2Page: component}) => ({
    default: component,
  })),
);
const LeaderboardPage = lazyRoute(() =>
  import("./pages/LeaderboardPage").then(({LeaderboardPage: component}) => ({
    default: component,
  })),
);
const FinalPage = lazyRoute(() =>
  import("./pages/FinalPage").then(({FinalPage: component}) => ({default: component})),
);
const AdminOperationsPage = lazyRoute(() =>
  import("./pages/AdminOperationsPage").then(({AdminOperationsPage: component}) => ({
    default: component,
  })),
);
const AdminV2Entry = lazyRoute(() =>
  import("../admin-v2/AdminV2Entry").then(({AdminV2Entry: component}) => ({
    default: component,
  })),
);

export function MovementRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LazyRouteBoundary><LoginPage /></LazyRouteBoundary>}
      />
      <Route
        path="/qr-login"
        element={<LazyRouteBoundary><QrLoginPage /></LazyRouteBoundary>}
      />
      <Route
        path="/stations"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["user"]}>
              <StationListPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/stations/map"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["user"]}>
              <StationsMapPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/team/v2"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["user"]} fullscreen>
              <TeamGameplayV2Page />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/stations/:stationId"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["user"]}>
              <StationDetailPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute><LeaderboardPage /></ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/final"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["user"]}><FinalPage /></ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/admin/operations"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}><AdminOperationsPage /></ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/teams"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <TeamListPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/teams/:teamId/stations"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <StationListPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/teams/:teamId/stations/:stationId"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <StationDetailPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/system-config"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <SystemConfigPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/system-config/stations/new"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <StationEditorPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/system-config/stations/:stationId"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <StationEditorPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/system-config/teams/new"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <TeamEditorPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/system-config/teams/:teamId"
        element={
          <LazyRouteBoundary>
            <ProtectedRoute allow={["admin"]}>
              <TeamEditorPage />
            </ProtectedRoute>
          </LazyRouteBoundary>
        }
      />
      <Route
        path="/admin-v2/*"
        element={<LazyRouteBoundary><AdminV2Entry /></LazyRouteBoundary>}
      />
      <Route path="*" element={<RoleAwareFallback />} />
    </Routes>
  );
}
