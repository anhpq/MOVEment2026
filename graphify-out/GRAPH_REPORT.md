# Graph Report - MOVEment2026  (2026-07-20)

## Corpus Check
- 124 files · ~147,172 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 994 nodes · 1877 edges · 72 communities (57 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `15bb3f91`
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
- validate-environment.ts
- xlsx-report.ts
- init.sql
- PrismaService
- admin.controller.ts
- scripts
- package.json
- @eslint/js
- eslint-plugin-react-hooks
- @types/react
- xlsx-report.ts

## God Nodes (most connected - your core abstractions)
1. `AuthContext` - 39 edges
2. `AdminService` - 34 edges
3. `CurrentAuth` - 31 edges
4. `PrismaService` - 31 edges
5. `AdminController` - 26 edges
6. `PlayerService` - 25 edges
7. `useMovementStore` - 25 edges
8. `FinalService` - 19 edges
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
- `fetchAdminDatabase()` --calls--> `getAdminProgressMatrix()`  [EXTRACTED]
  fe/src/features/movement/adminData.ts → fe/src/features/movement/api.ts

## Import Cycles
- None detected.

## Communities (72 total, 15 thin omitted)

### Community 0 - "AuthContext"
Cohesion: 0.10
Nodes (23): AuthContext, isTeam(), CurrentAuth, AdminController, Body, Controller, Get, Param (+15 more)

### Community 1 - "AdminService"
Cohesion: 0.19
Nodes (4): ActivityLogService, Injectable, EventConfigService, Injectable

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (46): bcryptjs, dependencies, bcryptjs, class-transformer, class-validator, helmet, @nestjs/common, @nestjs/config (+38 more)

### Community 3 - "PlayerService"
Cohesion: 0.14
Nodes (17): buildFinishedTeamStations(), buildPatchedTeamStations(), buildResetTeamStations(), buildStartedTeamStations(), buildTeamStationsWithoutStation(), buildTeamStationsWithUpdatedStation(), createFinishedStation(), createNewTeamStation() (+9 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): @ant-design/icons, antd, dependencies, @ant-design/icons, antd, konva, lodash, react (+13 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (33): devDependencies, eslint, globals, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma (+25 more)

### Community 6 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint-plugin-react-refresh, devDependencies, eslint, eslint-plugin-react-refresh, globals, sass, @types/node, @types/react-dom (+11 more)

### Community 7 - "utils.ts"
Cohesion: 0.17
Nodes (13): logout(), ROLE_LABELS, STATUS_ORDER, AppFrame(), AppFrameProps, ProtectedRoute(), ProtectedRouteProps, MovementStore (+5 more)

### Community 8 - "store.ts"
Cohesion: 0.07
Nodes (32): main(), prisma, stations, teamColors, teams, JwtAuthGuard, JwtPayload, Injectable (+24 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "PlayerPage.tsx"
Cohesion: 0.25
Nodes (7): name, private, scripts, tester, tester:docker, tester:no-seed, version

### Community 11 - "StationsMapPanel.tsx"
Cohesion: 0.14
Nodes (23): checkInStation(), BarcodeDetectorConstructor, BarcodeDetectorLike, getBarcodeDetector(), QrTokenInput(), QrTokenInputProps, buildFallbackPositions(), buildMarkerPosition() (+15 more)

### Community 12 - "PrismaService"
Cohesion: 0.10
Nodes (24): AppModule, Module, Environment, parseCorsOrigin(), requiredProductionValue(), productionEnvironment, validateEnvironment(), bootstrap() (+16 more)

### Community 13 - "FinalService"
Cohesion: 0.07
Nodes (29): ArrayMinSize, AdminAuthContext, AuthType, isAdmin(), TeamAuthContext, Roles(), RolesGuard, Injectable (+21 more)

### Community 14 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+11 more)

### Community 15 - "useMovementStore"
Cohesion: 0.16
Nodes (19): App(), displayStatus(), fetchAdminDatabase(), createAdminStation(), createAdminTeam(), updateAdminStation(), updateAdminTeam(), useMovementBootstrap() (+11 more)

### Community 16 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 17 - "app.module.ts"
Cohesion: 0.13
Nodes (14): 2026-07-20 Admin integration verification, 2026-07-20 Agent and Markdown docs refresh, 2026-07-20 Login 405 object-storage investigation, 2026-07-20 Remaining feature integration, 2026-07-20 Runtime test-data cleanup, 2026-07-20 Tester Docker compose runner, 2026-07-20 Tester one-command runner, Backend Audit Status (+6 more)

### Community 18 - "api.ts"
Cohesion: 0.06
Nodes (74): AdminProgressMatrixResponse, AdminStationUpdateInput, AdminTeamResponse, apiDelete(), ApiError, apiGet(), apiPatch(), apiPost() (+66 more)

### Community 19 - "EventConfigService"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 21 - "UpdateFinalConfigDto"
Cohesion: 0.14
Nodes (12): Auth Smoke Test, Main APIs, MOVEment 2026 Backend, Production Deploy Notes, Report Export and Database Recovery Rehearsal, Seed Accounts, Setup, Two-Team Smoke Test (+4 more)

### Community 22 - "AppFrame.tsx"
Cohesion: 0.14
Nodes (5): LeaderboardController, Controller, Get, PlayerService, Injectable

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
Cohesion: 0.15
Nodes (20): createStoreState(), AuthAccount, LocalDatabase, SqlTeam, SqlTeamStationProgress, SqlUser, Team, buildTeamStationsFromSqlProgress() (+12 more)

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
Cohesion: 0.29
Nodes (6): Build And Preview, Frontend Routes, Local Development, MOVEment 2026 Frontend, Verification, What This App Does

### Community 48 - "AGENTS.md"
Cohesion: 0.22
Nodes (8): Git Autonomy, Graphify, MOVEment2026 Agent Instructions, Priority Order, Project Docs, Request Routing, Source Work, Verification

### Community 55 - "auth.controller.ts"
Cohesion: 0.60
Nodes (5): Complete-Station(), Invoke-JsonRequest(), Login-Admin(), Login-Team(), Open-RehearsalWindow()

### Community 56 - "xlsx-report.ts"
Cohesion: 0.33
Nodes (5): Context, Output, Prompt 08 - Implementation Sync, Rules, Task

### Community 59 - "validate-environment.ts"
Cohesion: 0.40
Nodes (4): mockActivityLog, mockEventConfig, mockPrisma, progress

### Community 64 - "PrismaService"
Cohesion: 0.20
Nodes (15): ForceProgressStatusDto, ReopenProgressDto, SubmitScoreDto, TeamSubmitScoreDto, IsEnum, IsInt, IsOptional, IsString (+7 more)

### Community 66 - "admin.controller.ts"
Cohesion: 0.50
Nodes (3): MOVEment 2026 QR Payloads, Station QR payloads, Team login QR payloads

### Community 71 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, build:prod, dev, lint, preview

### Community 72 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 80 - "xlsx-report.ts"
Cohesion: 0.06
Nodes (45): CreateStationDto, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Matches (+37 more)

## Knowledge Gaps
- **325 isolated node(s):** `deploy.sh script`, `NODE_ENV`, `config`, `$schema`, `collection` (+320 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthContext` connect `AuthContext` to `store.ts`, `PrismaService`, `xlsx-report.ts`, `FinalService`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `store.ts` to `PrismaService`, `AdminService`, `PrismaService`, `FinalService`, `xlsx-report.ts`, `AppFrame.tsx`, `xlsx-report.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `AdminService` connect `xlsx-report.ts` to `xlsx-report.ts`, `AdminService`, `PrismaService`, `store.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `deploy.sh script`, `NODE_ENV`, `config` to the rest of the system?**
  _325 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext` be split into smaller, more focused modules?**
  _Cohesion score 0.10286382232612508 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `PlayerService` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._