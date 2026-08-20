---
type: "query"
date: "2026-08-20T03:53:59.032930+00:00"
question: "Trace current Admin V1 and Admin V2 routes, authentication guards, and Admin V2 navigation links for the controlled cutover"
contributor: "graphify"
outcome: "useful"
source_nodes: ["routes.tsx", "AdminV2Routes.tsx", "adminV2RouteConfig.tsx", "LoginPage.tsx", "ProtectedRoute.tsx"]
---

# Q: Trace current Admin V1 and Admin V2 routes, authentication guards, and Admin V2 navigation links for the controlled cutover

## Answer

Expanded from the query via graph vocabulary: admin, routing, routes, navigation, dashboard, teams, stations, leaderboard, operations, settings, authentication, legacy. Verified routes.tsx as the shared registry, AdminV2Entry and ProtectedRoute as the existing authorization chain, AdminV2Routes.tsx as the V2 child tree, adminV2RouteConfig.tsx as the V2-only navigation source, and LoginPage.tsx as the Admin post-login destination. The controlled cutover centralizes Admin home at /admin, redirects it to /admin-v2/dashboard, and preserves /admin-v1 as the legacy entry to unchanged V1 /teams.

## Outcome

- Signal: useful

## Source Nodes

- routes.tsx
- AdminV2Routes.tsx
- adminV2RouteConfig.tsx
- LoginPage.tsx
- ProtectedRoute.tsx