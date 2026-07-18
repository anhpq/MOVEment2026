# Graph Report - .  (2026-07-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 659 nodes · 1300 edges · 33 communities (29 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- AuthContext
- AdminService
- dependencies
- PlayerService
- dependencies
- devDependencies
- devDependencies
- utils.ts
- store.ts
- compilerOptions
- PlayerPage.tsx
- StationsMapPanel.tsx
- PrismaService
- FinalService
- compilerOptions
- useMovementStore
- compilerOptions
- app.module.ts
- api.ts
- EventConfigService
- xlsx-report.ts
- UpdateFinalConfigDto
- AppFrame.tsx
- exclude
- nest-cli.json
- UpdateEventConfigDto
- seed.ts
- deploy.sh
- tsconfig.json
- jest.config.ts
- deploy.sh

## God Nodes (most connected - your core abstractions)
1. `AuthContext` - 33 edges
2. `AdminService` - 28 edges
3. `CurrentAuth` - 25 edges
4. `PrismaService` - 25 edges
5. `useMovementStore` - 25 edges
6. `PlayerService` - 23 edges
7. `AdminController` - 20 edges
8. `FinalService` - 18 edges
9. `compilerOptions` - 18 edges
10. `ActivityLogService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `AppModule`  [INFERRED]
  be/src/main.ts → be/src/app.module.ts
- `AdminController` --references--> `Roles()`  [EXTRACTED]
  be/src/modules/admin/admin.controller.ts → be/src/common/auth/auth.decorators.ts
- `App()` --calls--> `getMe()`  [EXTRACTED]
  fe/src/App.tsx → fe/src/features/movement/api.ts
- `App()` --calls--> `logout()`  [EXTRACTED]
  fe/src/App.tsx → fe/src/features/movement/api.ts
- `RankingTableProps` --references--> `Team`  [EXTRACTED]
  fe/src/components/common/RankingTable.tsx → fe/src/types/player.type.ts

## Import Cycles
- None detected.

## Communities (33 total, 4 thin omitted)

### Community 0 - "AuthContext"
Cohesion: 0.07
Nodes (39): AdminAuthContext, AuthContext, AuthType, isAdmin(), isTeam(), TeamAuthContext, CurrentAuth, Roles() (+31 more)

### Community 1 - "AdminService"
Cohesion: 0.08
Nodes (15): SubmitScoreDto, IsInt, IsOptional, Min, AdminController, Body, Controller, Get (+7 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (48): bcryptjs, dependencies, bcryptjs, class-transformer, class-validator, helmet, @nestjs/common, @nestjs/config (+40 more)

### Community 3 - "PlayerService"
Cohesion: 0.10
Nodes (16): ForceProgressStatusDto, ReopenProgressDto, TeamSubmitScoreDto, IsString, MinLength, QrActionDto, SubmitCipherDto, IsString (+8 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): @ant-design/icons, antd, dependencies, @ant-design/icons, antd, konva, lodash, react (+23 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma, source-map-support (+21 more)

### Community 6 - "devDependencies"
Cohesion: 0.07
Nodes (27): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+19 more)

### Community 7 - "utils.ts"
Cohesion: 0.14
Nodes (25): createStoreState(), AuthAccount, LocalDatabase, LocalDatabaseSeed, SqlProgressStatus, SqlStation, SqlTeam, SqlTeamStationProgress (+17 more)

### Community 8 - "store.ts"
Cohesion: 0.12
Nodes (19): buildFinishedTeamStations(), buildPatchedTeamStations(), buildResetTeamStations(), buildStartedTeamStations(), buildTeamStationsWithoutStation(), buildTeamStationsWithUpdatedStation(), createFinishedStation(), createNewTeamStation() (+11 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "PlayerPage.tsx"
Cohesion: 0.22
Nodes (16): RankingTable(), RankingTableProps, TeamHeader(), TeamHeaderProps, StationDetailModal(), StationDetailModalProps, StationMap(), StationMapProps (+8 more)

### Community 11 - "StationsMapPanel.tsx"
Cohesion: 0.16
Nodes (19): buildFallbackPositions(), buildMarkerPosition(), clampMapScale(), clampPercent(), getMarkerFill(), MarkerPosition, StationsMapPanel(), StationsMapPanelProps (+11 more)

### Community 12 - "PrismaService"
Cohesion: 0.19
Nodes (6): ActivityLogService, Injectable, EventConfigModule, Module, PrismaService, Injectable

### Community 13 - "FinalService"
Cohesion: 0.19
Nodes (6): FinalController, Controller, Get, UseGuards, FinalService, Injectable

### Community 14 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+11 more)

### Community 15 - "useMovementStore"
Cohesion: 0.21
Nodes (11): App(), useMovementBootstrap(), StationEditorPage(), StationsMapPage(), SystemConfigPage(), TeamEditorPage(), TeamListPage(), MovementRoutes() (+3 more)

### Community 16 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 17 - "app.module.ts"
Cohesion: 0.14
Nodes (14): AppModule, Module, bootstrap(), AdminModule, Module, AuthModule, Module, FinalModule (+6 more)

### Community 18 - "api.ts"
Cohesion: 0.21
Nodes (15): apiGet(), apiPost(), apiRequest(), AuthMeResponse, getAccessToken(), getMe(), getStoredSession(), loginTeam() (+7 more)

### Community 19 - "EventConfigService"
Cohesion: 0.19
Nodes (5): EventConfigController, Controller, Get, EventConfigService, Injectable

### Community 20 - "xlsx-report.ts"
Cohesion: 0.26
Nodes (13): cellXml(), columnName(), crc32(), crcTable, createWorkbookXlsx(), escapeXml(), sanitizeSheetName(), sheetXml() (+5 more)

### Community 21 - "UpdateFinalConfigDto"
Cohesion: 0.21
Nodes (10): ArrayMinSize, SubmitFinalDto, IsInt, IsOptional, IsString, Min, UpdateFinalConfigDto, IsArray (+2 more)

### Community 22 - "AppFrame.tsx"
Cohesion: 0.23
Nodes (9): logout(), ROLE_LABELS, STATUS_ORDER, AppFrame(), AppFrameProps, ProtectedRoute(), ProtectedRouteProps, Role (+1 more)

### Community 23 - "exclude"
Cohesion: 0.22
Nodes (8): exclude, extends, prisma/**/*.ts, dist, node_modules, **/*.spec.ts, test, ./tsconfig.json

### Community 24 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 25 - "UpdateEventConfigDto"
Cohesion: 0.33
Nodes (6): IsInt, IsOptional, IsString, Min, UpdateEventConfigDto, Matches

### Community 26 - "seed.ts"
Cohesion: 0.40
Nodes (3): prisma, stations, teams

## Knowledge Gaps
- **174 isolated node(s):** `deploy.sh script`, `NODE_ENV`, `config`, `$schema`, `collection` (+169 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthContext` connect `AuthContext` to `AdminService`, `PlayerService`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `AdminService` connect `AdminService` to `AuthContext`, `EventConfigService`, `PlayerService`, `PrismaService`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `PrismaService` to `AuthContext`, `AdminService`, `PlayerService`, `FinalService`, `app.module.ts`, `EventConfigService`, `UpdateFinalConfigDto`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `deploy.sh script`, `NODE_ENV`, `config` to the rest of the system?**
  _174 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext` be split into smaller, more focused modules?**
  _Cohesion score 0.06751054852320675 - nodes in this community are weakly interconnected._
- **Should `AdminService` be split into smaller, more focused modules?**
  _Cohesion score 0.08244897959183674 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._