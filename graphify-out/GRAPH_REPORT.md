# Graph Report - MOVEment2026  (2026-07-19)

## Corpus Check
- 121 files · ~146,260 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 895 nodes · 1587 edges · 71 communities (57 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec118ed5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- MOVEment 2026 - Current Specification
- graphify reference: query, path, explain
- Prompt 02 - Phân tích màn hình Player
- MOVEment 2026 - Implementation Backlog
- Workflow phân tích MOVEment 2026
- Prompt 03 - Phân tích flow trạm, QR và timer
- Prompt 04 - Phân tích chức năng Admin
- Prompt 05 - Phân tích database và API
- Prompt 06 - Phân tích UI reference và design direction
- Prompt 07 - Tạo backlog và tiêu chí nghiệm thu
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- Prompt 01 - Phân tích phạm vi sản phẩm
- React + TypeScript + Vite
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- MOVEment 2026 - Decisions
- README.md
- extraction-spec.md
- auth.controller.ts
- xlsx-report.ts
- TEAM_LOGIN_DATA.md
- QrTokenInput.tsx
- validate-environment.ts
- xlsx-report.ts
- init.sql
- player.service.spec.ts
- PrismaService
- player.controller.ts
- admin.controller.ts
- final.controller.ts
- vite
- eslint

## God Nodes (most connected - your core abstractions)
1. `AuthContext` - 33 edges
2. `AdminService` - 28 edges
3. `CurrentAuth` - 25 edges
4. `PrismaService` - 25 edges
5. `useMovementStore` - 25 edges
6. `PlayerService` - 24 edges
7. `AdminController` - 20 edges
8. `FinalService` - 19 edges
9. `compilerOptions` - 18 edges
10. `ActivityLogService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `AppModule`  [INFERRED]
  be/src/main.ts → be/src/app.module.ts
- `AdminController` --references--> `Roles()`  [EXTRACTED]
  be/src/modules/admin/admin.controller.ts → be/src/common/auth/auth.decorators.ts
- `App()` --calls--> `logout()`  [EXTRACTED]
  fe/src/App.tsx → fe/src/features/movement/api.ts
- `RankingTableProps` --references--> `Team`  [EXTRACTED]
  fe/src/components/common/RankingTable.tsx → fe/src/types/player.type.ts
- `AppFrame()` --calls--> `logout()`  [EXTRACTED]
  fe/src/features/movement/layout/AppFrame.tsx → fe/src/features/movement/api.ts

## Import Cycles
- None detected.

## Communities (71 total, 14 thin omitted)

### Community 0 - "AuthContext"
Cohesion: 0.07
Nodes (22): AuthContext, CurrentAuth, AdminController, Body, Controller, Get, Param, Patch (+14 more)

### Community 1 - "AdminService"
Cohesion: 0.22
Nodes (5): EventConfigController, Controller, Get, EventConfigService, Injectable

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (46): bcryptjs, dependencies, bcryptjs, class-transformer, class-validator, helmet, @nestjs/common, @nestjs/config (+38 more)

### Community 3 - "PlayerService"
Cohesion: 0.06
Nodes (37): main(), prisma, stations, teamColors, teams, AdminAuthContext, AuthType, isAdmin() (+29 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): @ant-design/icons, antd, dependencies, @ant-design/icons, antd, konva, lodash, react (+13 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (33): devDependencies, eslint, globals, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma (+25 more)

### Community 6 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, sass, @types/node (+11 more)

### Community 7 - "utils.ts"
Cohesion: 0.12
Nodes (27): createStoreState(), AuthAccount, LocalDatabase, LocalDatabaseSeed, MovementStore, Session, SqlProgressStatus, SqlStation (+19 more)

### Community 8 - "store.ts"
Cohesion: 0.14
Nodes (17): buildFinishedTeamStations(), buildPatchedTeamStations(), buildResetTeamStations(), buildStartedTeamStations(), buildTeamStationsWithoutStation(), buildTeamStationsWithUpdatedStation(), createFinishedStation(), createNewTeamStation() (+9 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "PlayerPage.tsx"
Cohesion: 0.22
Nodes (16): RankingTable(), RankingTableProps, TeamHeader(), TeamHeaderProps, StationDetailModal(), StationDetailModalProps, StationMap(), StationMapProps (+8 more)

### Community 11 - "StationsMapPanel.tsx"
Cohesion: 0.12
Nodes (30): apiGet(), getPlayerDashboard(), getPlayerProgress(), getPlayerStations(), PlayerProgressResponse, PlayerStationResponse, BarcodeDetectorConstructor, BarcodeDetectorLike (+22 more)

### Community 12 - "PrismaService"
Cohesion: 0.19
Nodes (13): AdminModule, Module, AuthModule, Module, EventConfigModule, Module, FinalModule, Module (+5 more)

### Community 13 - "FinalService"
Cohesion: 0.08
Nodes (24): ArrayMinSize, Roles(), SubmitFinalDto, IsInt, IsOptional, IsString, Min, UpdateFinalConfigDto (+16 more)

### Community 14 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+11 more)

### Community 15 - "useMovementStore"
Cohesion: 0.15
Nodes (16): App(), getMe(), useMovementBootstrap(), AppFrame(), ProtectedRoute(), ProtectedRouteProps, StationEditorPage(), StationsMapPage() (+8 more)

### Community 16 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 17 - "app.module.ts"
Cohesion: 0.25
Nodes (7): Backend Audit Status, Backend work still required, Maintenance findings, Next recommended task, P0 remaining work, P1 event-readiness checks, Verification completed

### Community 18 - "api.ts"
Cohesion: 0.13
Nodes (25): apiPost(), apiRequest(), AuthMeResponse, checkInStation(), checkOutStation(), getAccessToken(), getStoredSession(), LeaderboardEntryResponse (+17 more)

### Community 19 - "EventConfigService"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 21 - "UpdateFinalConfigDto"
Cohesion: 0.17
Nodes (10): Auth Smoke Test, Main APIs, MOVEment 2026 Backend, Production Deploy Notes, Report Export and Database Recovery Rehearsal, Seed Accounts, Setup, Two-Team Smoke Test (+2 more)

### Community 22 - "AppFrame.tsx"
Cohesion: 0.23
Nodes (9): ROLE_LABELS, STATUS_ORDER, AppFrameProps, QuickEditFormValues, StationListPage(), StationStatus, TeamStation, getDisabledReason() (+1 more)

### Community 23 - "exclude"
Cohesion: 0.22
Nodes (8): exclude, extends, prisma/**/*.ts, dist, node_modules, **/*.spec.ts, test, ./tsconfig.json

### Community 24 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 25 - "UpdateEventConfigDto"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 26 - "seed.ts"
Cohesion: 0.23
Nodes (4): ActivityLogService, Injectable, PrismaService, Injectable

### Community 33 - "MOVEment 2026 - Current Specification"
Cohesion: 0.25
Nodes (7): Auth, Event và Final, Luồng trạm, MOVEment 2026 - Current Specification, Phạm vi, Scoring, Trạng thái

### Community 34 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 35 - "Prompt 02 - Phân tích màn hình Player"
Cohesion: 0.33
Nodes (5): Context, Danh sách màn hình cần phân tích, Nhiệm vụ, Output mong muốn, Prompt 02 - Phân tích màn hình Player

### Community 36 - "MOVEment 2026 - Implementation Backlog"
Cohesion: 0.17
Nodes (11): 1. Chuẩn bị rehearsal database và API, 2. Chạy two-team station smoke, 3. Validate production env trên môi trường deploy, 4. Rehearse report export và database recovery, 5. Maintenance sau event-readiness, MOVEment 2026 - Implementation Backlog, Next execution checklist, P0 - Backend correctness (+3 more)

### Community 37 - "Workflow phân tích MOVEment 2026"
Cohesion: 0.40
Nodes (4): Cách sử dụng, Input nền tảng, Quy tắc phân tích, Workflow phân tích MOVEment 2026

### Community 38 - "Prompt 03 - Phân tích flow trạm, QR và timer"
Cohesion: 0.40
Nodes (4): Context nghiệp vụ, Nhiệm vụ, Output mong muốn, Prompt 03 - Phân tích flow trạm, QR và timer

### Community 39 - "Prompt 04 - Phân tích chức năng Admin"
Cohesion: 0.40
Nodes (4): Context, Nhiệm vụ, Output mong muốn, Prompt 04 - Phân tích chức năng Admin

### Community 40 - "Prompt 05 - Phân tích database và API"
Cohesion: 0.40
Nodes (4): Context kỹ thuật, Nhiệm vụ, Output mong muốn, Prompt 05 - Phân tích database và API

### Community 41 - "Prompt 06 - Phân tích UI reference và design direction"
Cohesion: 0.40
Nodes (4): Context UI hiện tại, Nhiệm vụ, Output mong muốn, Prompt 06 - Phân tích UI reference và design direction

### Community 42 - "Prompt 07 - Tạo backlog và tiêu chí nghiệm thu"
Cohesion: 0.40
Nodes (4): Context, Nhiệm vụ, Output mong muốn, Prompt 07 - Tạo backlog và tiêu chí nghiệm thu

### Community 43 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 44 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 45 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 46 - "Prompt 01 - Phân tích phạm vi sản phẩm"
Cohesion: 0.50
Nodes (3): Nhiệm vụ, Output mong muốn, Prompt 01 - Phân tích phạm vi sản phẩm

### Community 47 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 48 - "AGENTS.md"
Cohesion: 0.40
Nodes (4): Cost-aware request routing, Git autonomy, graphify, Project memory docs

### Community 55 - "auth.controller.ts"
Cohesion: 0.60
Nodes (5): Complete-Station(), Invoke-JsonRequest(), Login-Admin(), Login-Team(), Open-RehearsalWindow()

### Community 56 - "xlsx-report.ts"
Cohesion: 0.33
Nodes (5): Context, Output, Prompt 08 - Implementation Sync, Rules, Task

### Community 58 - "QrTokenInput.tsx"
Cohesion: 0.27
Nodes (8): QrActionDto, SubmitCipherDto, IsString, MinLength, mockActivityLog, mockEventConfig, mockPrisma, progress

### Community 59 - "validate-environment.ts"
Cohesion: 0.31
Nodes (8): AppModule, Module, Environment, parseCorsOrigin(), requiredProductionValue(), productionEnvironment, validateEnvironment(), bootstrap()

### Community 60 - "xlsx-report.ts"
Cohesion: 0.13
Nodes (5): LeaderboardController, Controller, Get, PlayerService, Injectable

### Community 61 - "init.sql"
Cohesion: 0.10
Nodes (30): ForceProgressStatusDto, ReopenProgressDto, SubmitScoreDto, TeamSubmitScoreDto, IsInt, IsOptional, IsString, Min (+22 more)

### Community 62 - "player.service.spec.ts"
Cohesion: 0.33
Nodes (6): scripts, build, build:prod, dev, lint, preview

### Community 64 - "PrismaService"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 66 - "admin.controller.ts"
Cohesion: 0.50
Nodes (3): MOVEment 2026 QR Payloads, Station QR payloads, Team login QR payloads

## Knowledge Gaps
- **303 isolated node(s):** `deploy.sh script`, `NODE_ENV`, `config`, `$schema`, `collection` (+298 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthContext` connect `AuthContext` to `FinalService`, `PlayerService`, `QrTokenInput.tsx`, `init.sql`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `seed.ts` to `AuthContext`, `AdminService`, `PlayerService`, `PrismaService`, `FinalService`, `QrTokenInput.tsx`, `xlsx-report.ts`, `init.sql`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `AdminService` connect `AuthContext` to `seed.ts`, `PrismaService`, `init.sql`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `deploy.sh script`, `NODE_ENV`, `config` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext` be split into smaller, more focused modules?**
  _Cohesion score 0.07122736418511066 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `PlayerService` be split into smaller, more focused modules?**
  _Cohesion score 0.06247086247086247 - nodes in this community are weakly interconnected._