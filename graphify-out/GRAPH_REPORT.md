# Graph Report - MOVEment2026  (2026-07-24)

## Corpus Check
- 169 files · ~215,179 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2048 nodes · 3314 edges · 188 communities (154 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.63)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d976286`
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
- apiGet
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
- vite.config.ts
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
- routes.tsx
- PrismaService
- .log
- admin.controller.ts
- admin.service.ts
- Change Classification
- UpdateStationDto
- scripts
- package.json
- UpdateEventConfigDto
- @eslint/js
- eslint-plugin-react-hooks
- @types/react
- package.json
- apiGet
- eslint
- helmet
- store.ts
- @nestjs/config
- @nestjs/platform-express
- @nestjs/swagger
- @prisma/client
- rxjs
- swagger-ui-express
- vite
- eslint
- .getPublicConfig
- admin.controller.ts
- jwt-auth.guard.ts
- 16. Manual Device Test Matrix
- 5. Scanner State Machine
- 3. Task Classification
- 16. Frontend Requirements
- 10. Final Challenge
- eslint-plugin-react-hooks
- 1. Authentication and Session
- 2. Automatic URL QR Login
- 4. Team and Seed Data
- 5. Station Management
- 7. Station Tracking Mode
- 8. Station Scoring
- 5. Team QR Token Policy
- 8. Token Storage Model
- 12. Migration Strategy
- 7. Database Mapping
- 7. Database and Migration Requirements
- Prompt 02 - Phân tích màn hình Player
- scripts
- AuthService
- 11. Leaderboard
- Feature Routing
- 3. QR Camera Scanning
- 6. Station Check-in and Check-out
- 9. Event Config and Event Time
- AuthController
- 23. Verification Matrix
- 10. Format không được sử dụng
- 11. Legacy Compatibility
- 18. Verification Matrix
- 3. Automatic URL Team QR Login
- 4. Station QR Format
- 8. Payload Classification
- 13. Seed Requirements
- 20. Required Tests
- Prompt 03 - Phân tích flow trạm, QR và timer
- Prompt 04 - Phân tích chức năng Admin
- Prompt 05 - Phân tích database và API
- Prompt 06 - Phân tích UI reference và design direction
- Prompt 07 - Tạo backlog và tiêu chí nghiệm thu
- 15. Current Implementation Status
- 3. Root Cause đã xác nhận
- 4. Accepted Architecture
- 7. Video Element Requirements
- 8. Frame Decoding
- 12. Frontend Public Route
- 17. Seed Behavior
- 2. Phân biệt các loại QR
- 9. Raw Token và Reprint Strategy
- 13. QR Artifact Labeling
- 14. Rotation và Revocation
- 2. Namespace và Versioning
- 7. Graphify Workflow
- 14. Raw Token and QR Artifact Strategy
- Prompt 01 - Phân tích phạm vi sản phẩm
- MOVEment 2026 — All Required Markdown Files
- 13. Feature Integration
- 6. Automatic Token Provisioning
- 16. API Validation Flow
- 6. Automatic Provisioning
- 9. Generated Data và Seed Workflow
- UpdateEventConfigDto
- CreateStationDto
- .getPublicConfig
- LeaderboardController
- .generateTeamQrLoginToken
- package.json
- init.sql
- migration.sql
- MOVEment 2026 - Automatic URL QR Login
- CODEX QR AUTO LOGIN AND SEED TOKENS
- validate-environment.ts
- final-challenge-seed.ts
- Get
- .logout
- UpdateFinalConfigDto
- migration.sql
- konva
- eslint
- player.service.spec.ts
- ts-jest
- migration.sql
- migration.sql
- migration.sql
- migration.sql
- migration.sql
- migration.sql
- migration.sql
- migration.sql
- migration.sql
- jest
- ts-jest
- typescript

## God Nodes (most connected - your core abstractions)
1. `AdminService` - 56 edges
2. `AuthContext` - 48 edges
3. `CurrentAuth` - 40 edges
4. `AdminController` - 39 edges
5. `PrismaService` - 39 edges
6. `MOVEment 2026 - Implementation Backlog` - 35 edges
7. `useMovementStore` - 29 edges
8. `Backend Audit Status` - 26 edges
9. `FinalService` - 24 edges
10. `PlayerService` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Invoke-PostgresAdminSql()` --calls--> `node`  [INFERRED]
  scripts/production-like-smoke.ps1 → fe/tsconfig.node.json
- `Invoke-SmokeRequest()` --calls--> `node`  [INFERRED]
  scripts/production-like-smoke.ps1 → fe/tsconfig.node.json
- `main()` --calls--> `planFinalChallengeSeed()`  [EXTRACTED]
  be/prisma/seed.ts → be/prisma/final-challenge-seed.ts
- `main()` --calls--> `buildQrLoginUrl()`  [EXTRACTED]
  be/prisma/seed.ts → be/src/common/qr/qr-token.ts
- `main()` --calls--> `createQrTokenFingerprint()`  [EXTRACTED]
  be/prisma/seed.ts → be/src/common/qr/qr-token.ts

## Import Cycles
- None detected.

## Communities (188 total, 34 thin omitted)

### Community 0 - "AuthContext"
Cohesion: 0.06
Nodes (31): 10. Conditional Database Deployment, 11. Expected Migration Review, 12. Backend Stop Conditions, 13. Backend Post-Deploy Verification, 14. Frontend Manual Workflow, 15. Frontend Post-Deploy Verification, 16. Non-Destructive Production Smoke, 17. QR Reissue Plan (+23 more)

### Community 1 - "AdminService"
Cohesion: 0.08
Nodes (29): AuthContext, isTeam(), CurrentAuth, AdminController, Body, Controller, Get, Param (+21 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (29): bcryptjs, dependencies, bcryptjs, class-transformer, class-validator, exceljs, helmet, @nestjs/common (+21 more)

### Community 3 - "PlayerService"
Cohesion: 0.19
Nodes (16): getPlayerDashboard(), getPlayerProgress(), getPlayerStations(), loginWithQrToken(), PlayerProgressResponse, PlayerStationResponse, ProtectedRoute(), ProtectedRouteProps (+8 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): @ant-design/icons, antd, dependencies, @ant-design/icons, antd, jsqr, lodash, react (+13 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, globals, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma, source-map-support (+19 more)

### Community 6 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint-plugin-react-refresh, devDependencies, eslint, eslint-plugin-react-refresh, globals, @types/node, @types/qrcode, @types/react (+11 more)

### Community 7 - "utils.ts"
Cohesion: 0.11
Nodes (16): AdminAuthContext, AuthType, isAdmin(), TeamAuthContext, Roles(), JwtAuthGuard, JwtPayload, Injectable (+8 more)

### Community 8 - "store.ts"
Cohesion: 0.09
Nodes (25): AuthController, mockAuthService, Body, Controller, Post, AuthService, PrismaSessionClient, mockJwtService (+17 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "PlayerPage.tsx"
Cohesion: 0.17
Nodes (11): name, private, scripts, db:reset, db:verify, tester, tester:docker, tester:no-seed (+3 more)

### Community 11 - "apiGet"
Cohesion: 0.13
Nodes (14): GAME_TYPES, GameType, isSupportedYoutubeUrl(), IsEnum, IsIn, IsInt, IsNumber, IsOptional (+6 more)

### Community 12 - "PrismaService"
Cohesion: 0.14
Nodes (13): 10. Cleanup Contract, 12. Development Diagnostics, 14. Manual Fallback, 17. Automated Verification Checklist, 18. Acceptance Criteria, 19. Known Remaining Risk, 1. Mục tiêu, 20. Documentation Update Rules (+5 more)

### Community 13 - "FinalService"
Cohesion: 0.21
Nodes (13): cellXml(), columnName(), crc32(), crcTable, createWorkbookXlsx(), escapeXml(), sanitizeSheetName(), sheetXml() (+5 more)

### Community 14 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+11 more)

### Community 15 - "useMovementStore"
Cohesion: 0.14
Nodes (25): loginTeam(), loginTeamWithQr(), loginUser(), isAuthFailure(), cameraErrorMessages, CameraFailureCategory, getCameraFailureCategory(), logCameraDiagnostic() (+17 more)

### Community 16 - "compilerOptions"
Cohesion: 0.06
Nodes (28): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+20 more)

### Community 17 - "app.module.ts"
Cohesion: 0.08
Nodes (25): 2026-07-22 Conditional Backend Database Deployment, 2026-07-22 Final Challenge Event Config, Keyword, Cooldown, and Ranking, 2026-07-22 Production-like Integration Verification, 2026-07-22 Reusable Automatic URL Team QR Login, 2026-07-22 Secure Station QR provisioning and migration, 2026-07-22 Source of Truth and QR documentation reconciliation, 2026-07-22 Staged Production Deployment Workflow, 2026-07-22 Station Tracking Mode and Station Scoring (+17 more)

### Community 18 - "api.ts"
Cohesion: 0.10
Nodes (37): AdminCreatedStationResponse, AdminOneTimeTeamQrResponse, AdminProgressMatrixResponse, AdminQrLoginTokenResponse, AdminStationUpdateInput, AdminTeamResponse, AuthMeResponse, cancelPlayerStation() (+29 more)

### Community 19 - "EventConfigService"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 21 - "UpdateFinalConfigDto"
Cohesion: 0.14
Nodes (12): Auth Smoke Test, Main APIs, MOVEment 2026 Backend, Production Deploy Notes, Report Export and Database Recovery Rehearsal, Seed Accounts, Setup, Two-Team Smoke Test (+4 more)

### Community 22 - "AppFrame.tsx"
Cohesion: 0.24
Nodes (10): App(), getLeaderboard(), getMe(), LeaderboardEntryResponse, useMovementBootstrap(), LeaderboardPage(), StationsMapPage(), TeamListPage() (+2 more)

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
Cohesion: 0.05
Nodes (36): 10. Verification Requirements, 11. Documentation Synchronization, 12. Git Strategy, 13. Stop Conditions, 14. Final Combined Report, 15. Definition of Done, 1. Mandatory Authority Order, 2. Execution Scope (+28 more)

### Community 33 - "MOVEment 2026 - Current Specification"
Cohesion: 0.08
Nodes (24): Actors, Admin, Audit and Logging, Authentication and Session, Authority, Check-in, Check-out, Current Known Implementation Gaps (+16 more)

### Community 34 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 35 - "Prompt 02 - Phân tích màn hình Player"
Cohesion: 0.29
Nodes (10): createUniqueStationQrToken(), buildQrLoginUrl(), createQrTokenFingerprint(), createSecureQrLoginToken(), createSecureStationQrToken(), isOfficialQrLoginToken(), isOfficialStationQrToken(), isOfficialStationQrTokenForPurpose() (+2 more)

### Community 36 - "MOVEment 2026 - Implementation Backlog"
Cohesion: 0.06
Nodes (35): 2026-07-22 Automatic URL Team QR completion, 2026-07-22 Conditional backend database deployment completion, 2026-07-22 Final Challenge completion, 2026-07-22 Production-like integration verification completion, 2026-07-22 Secure Station QR completion, 2026-07-22 Staged Production deployment workflow completion, 2026-07-22 Station tracking and scoring completion, 2026-07-23 Final Challenge plain answer and Production seed override (+27 more)

### Community 37 - "Workflow phân tích MOVEment 2026"
Cohesion: 0.14
Nodes (13): 10. Verification Matrix, 12. Git Workflow, 13. Required Completion Report, 14. Known Conflict Checklist, 15. Fast Path cho Task Nhỏ, 16. Definition of Done, 2. Mandatory Start Workflow, 4. Prompt Selection Strategy (+5 more)

### Community 38 - "Prompt 03 - Phân tích flow trạm, QR và timer"
Cohesion: 0.10
Nodes (19): Admin Correction, Audit First, Backend Score Validation, `BOTH`, Check-out Flow, CODEX STATION SCORE ENTRY LIMITS, Confirmed Business Rules, Database and Config (+11 more)

### Community 39 - "Prompt 04 - Phân tích chức năng Admin"
Cohesion: 0.11
Nodes (18): 10. Backend QR Login Endpoint, 11. Safe Backend Errors, 12. Team Creation Provisioning, 15. Admin Requirements, 17. Frontend Error Messages, 18. Legacy Compatibility, 19. Deployment Requirements, 1. Mandatory Reading (+10 more)

### Community 40 - "Prompt 05 - Phân tích database và API"
Cohesion: 0.13
Nodes (14): Audit First, Backend Validation, CODEX FINAL GAME KEYWORD AND SCORING, Confirmed Business Rules, Documentation Sync, Final Report, Frontend Requirements, Mandatory Reading (+6 more)

### Community 41 - "Prompt 06 - Phân tích UI reference và design direction"
Cohesion: 0.09
Nodes (22): Acceptance Criteria, Admin Team Detail and Team Context, Admin Team List, Backend Validation, Default and Accessibility, Excel, Excel Format, Explicitly Out of Scope (+14 more)

### Community 42 - "Prompt 07 - Tạo backlog và tiêu chí nghiệm thu"
Cohesion: 0.17
Nodes (11): Automatic URL QR Login and Seed Tokens, Current Known Documentation Conflicts, Documentation and Workflow, Documentation Roles, Final Challenge, Global Reading Priority, MOVEment 2026 - Feature Index, Prompt Routing (+3 more)

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
Cohesion: 0.18
Nodes (11): 11. Error Handling, Camera API Unavailable, Camera Constraint Error, Camera In Use, Camera Not Found, Permission Denied, QR Not Detected, Scanner Initialization Error (+3 more)

### Community 47 - "React + TypeScript + Vite"
Cohesion: 0.25
Nodes (7): API Configuration, Build And Preview, Frontend Routes, Local Development, MOVEment 2026 Frontend, Verification, What This App Does

### Community 48 - "AGENTS.md"
Cohesion: 0.04
Nodes (44): 10. Documentation Synchronization, 11. Git Autonomy, 12. Completion Report, 13. Definition of Done, 1. Instruction Priority, 2. Mandatory Task Start, 3. Request Classification, 4. Request Routing and Delegation (+36 more)

### Community 51 - "MOVEment 2026 - Decisions"
Cohesion: 0.05
Nodes (37): 10.1 General Policy, 10.2 Seed Scope, 10.3 Seed Idempotency, 10.4 Automatic Seed Token Generation, 10.5 Environment Safety, 10. Team Color, 11. QR Camera Scanning, 12. Generated Data và Seed Data (+29 more)

### Community 55 - "auth.controller.ts"
Cohesion: 0.60
Nodes (5): Complete-Station(), Invoke-JsonRequest(), Login-Admin(), Login-Team(), Open-RehearsalWindow()

### Community 56 - "xlsx-report.ts"
Cohesion: 0.17
Nodes (11): Audit Update, Backlog Update, CODEX IMPLEMENTATION SYNC, Conflict Handling, Files to Update, Final Report, Mandatory Reading, Purpose (+3 more)

### Community 57 - "TEAM_LOGIN_DATA.md"
Cohesion: 0.08
Nodes (23): 10. Reusable Token Rule, 11. Legacy Login Data, 12. Current Implementation Gap, 13. Local/Test Verification, 14. Production Safety Checklist, 15. Documentation Update Rules, 1. Environment Scope, 2. Local/Test Team Accounts (+15 more)

### Community 58 - "QrTokenInput.tsx"
Cohesion: 0.27
Nodes (4): Ensure-Dependencies(), Invoke-Checked(), Step(), Test-LocalBin()

### Community 59 - "validate-environment.ts"
Cohesion: 0.28
Nodes (15): downloadAdminTeamResults(), getAdminActivityLogs(), getAdminDashboard(), getAdminEventConfig(), getAdminFinalConfig(), getAdminFinalSubmissions(), getAdminScoreQueue(), updateAdminEventConfig() (+7 more)

### Community 60 - "xlsx-report.ts"
Cohesion: 0.18
Nodes (14): buildTeamResultsWorkbook(), dateToHcmcExcelSerial(), formatHcmcTimestampForFileName(), getColumnWidth(), getHcmcDateParts(), pad(), secondsToExcelDuration(), ProgressWithStation (+6 more)

### Community 61 - "init.sql"
Cohesion: 0.29
Nodes (6): Build Frontend, Install Nginx Config, Manual GitHub Workflow, Nginx Frontend Deploy, Publish Static Files, Verify

### Community 62 - "routes.tsx"
Cohesion: 0.08
Nodes (25): 2026-07-20 Admin integration verification, 2026-07-20 Agent and Markdown docs refresh, 2026-07-20 Backend production CI/CD, 2026-07-20 BE host bootstrap (production ECS host), 2026-07-20 Docker frontend API proxy fix, 2026-07-20 heroes.nalth.top SPA routing fallback, 2026-07-20 Login 405 object-storage investigation, 2026-07-20 Remaining feature integration (+17 more)

### Community 64 - "PrismaService"
Cohesion: 0.15
Nodes (25): qrcode, displayStatus(), fetchAdminDatabase(), AdminStationQrTokenResponse, createAdminStation(), deleteAdminStation(), deleteAdminTeam(), getAdminProgressMatrix() (+17 more)

### Community 65 - ".log"
Cohesion: 0.22
Nodes (12): AdminModule, Module, AuthModule, Module, EventConfigModule, Module, FinalModule, Module (+4 more)

### Community 66 - "admin.controller.ts"
Cohesion: 0.20
Nodes (9): 15. Seed Rules, 19. Known Implementation Gaps, 1. QR Payload Families, 20. Acceptance Criteria, 21. Documentation Update Rules, 5. Station QR Pair, 9. Camera và Manual Input, MOVEment 2026 - QR Payloads (+1 more)

### Community 67 - "admin.service.ts"
Cohesion: 0.10
Nodes (10): LeaderboardController, Controller, Get, PlayerService, mockActivityLog, mockEventConfig, mockPrisma, mockTeamResults (+2 more)

### Community 68 - "Change Classification"
Cohesion: 0.39
Nodes (8): CreateTeamDto, IsOptional, IsString, Matches, MaxLength, MinLength, UpdateTeamDto, ValidateIf

### Community 70 - "UpdateStationDto"
Cohesion: 0.12
Nodes (20): buildFinishedTeamStations(), buildPatchedTeamStations(), buildResetTeamStations(), buildStartedTeamStations(), buildTeamStationsWithoutStation(), buildTeamStationsWithUpdatedStation(), createFinishedStation(), createNewTeamStation() (+12 more)

### Community 71 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, build:prod, dev, lint, preview (+2 more)

### Community 72 - "package.json"
Cohesion: 0.22
Nodes (18): createAdminTeam(), updateAdminTeam(), TeamEditorPage(), buildTeamQrLoginUrl(), cacheTeamQrPayload(), getCachedTeamQrToken(), readCache(), setCachedTeamQrToken() (+10 more)

### Community 74 - "@eslint/js"
Cohesion: 0.12
Nodes (16): 10. Backend Endpoint, 11. Team Session Policy, 13. URL Token Removal, 14. Duplicate Request Protection, 16. Admin Token Management, 18. Local Browser Test, 19. Physical Phone LAN Test, 1. Mục tiêu (+8 more)

### Community 75 - "eslint-plugin-react-hooks"
Cohesion: 0.22
Nodes (17): apiDownloadBlob(), apiDownloadFile(), ApiError, apiRequest(), buildApiUrl(), fetchApi(), getAccessToken(), getConfiguredApiBaseUrl() (+9 more)

### Community 76 - "@types/react"
Cohesion: 0.40
Nodes (5): 13. Team Color UI, Must Update After Change, Out of Scope, Required Reading, Scope

### Community 77 - "package.json"
Cohesion: 0.25
Nodes (7): Phase 0 - Preflight, Phase 1 - Backend, Phase 2 - Frontend, Post-Deploy Checks, Production Staged Deployment, Rollback, Stop Conditions

### Community 78 - "apiGet"
Cohesion: 0.13
Nodes (11): IsInt, IsOptional, IsString, Matches, Min, UpdateEventConfigDto, EventConfigController, Controller (+3 more)

### Community 79 - "eslint"
Cohesion: 0.47
Nodes (5): assertAtLeast(), assertExact(), Check, main(), prisma

### Community 80 - "helmet"
Cohesion: 0.33
Nodes (5): mockActivityLog, mockConfig, mockPrisma, mockTeamResults, team

### Community 81 - "store.ts"
Cohesion: 0.08
Nodes (45): checkInStation(), buildFallbackPositions(), buildMarkerPosition(), clampMapScale(), clampPercent(), getMarkerFill(), MarkerPosition, StationsMapPanel() (+37 more)

### Community 82 - "@nestjs/config"
Cohesion: 0.22
Nodes (9): 15. Safe Error Mapping, Disabled Team, Expired Token, Invalid Token, Missing Token, Network Error, Rate Limited, Revoked Token (+1 more)

### Community 83 - "@nestjs/platform-express"
Cohesion: 0.22
Nodes (9): `08_IMPLEMENTATION_SYNC_PROMPT.md`, `09_CODEX_MASTER_EXECUTION_PROMPT.md`, `10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md`, `11_CODEX_FINAL_GAME_KEYWORD_AND_SCORING_PROMPT.md`, `12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md`, 5.2 Synchronization Prompt, 5.3 Master Execution Prompt, 5.4 Feature Execution Prompts (+1 more)

### Community 84 - "@nestjs/swagger"
Cohesion: 0.22
Nodes (9): 11. Documentation Synchronization, Chỉ cập nhật khi Business Rule thay đổi, Cập nhật khi Feature routing thay đổi, Cập nhật khi iOS camera behavior thay đổi, Cập nhật khi QR Login flow thay đổi, Cập nhật khi shared project behavior thay đổi, Cập nhật khi Team login hoặc seed credentials thay đổi, Cập nhật Prompt khi (+1 more)

### Community 85 - "@prisma/client"
Cohesion: 0.22
Nodes (9): 1.1 Direct User Request, 1.2 `AGENTS.md`, 1.3 Business Rule Source of Truth, 1.4 Feature Routing, 1.5 Project và Feature Analysis, 1.6 Audit và Backlog, 1.7 Prompt Files, 1.8 Source Code (+1 more)

### Community 86 - "rxjs"
Cohesion: 0.22
Nodes (9): 5.1 Backend, 5.2 Database, 5.3 Team Creation, 5.4 Seed, 5.5 Frontend, 5.6 Admin, 5.7 Deployment, 5.8 Tests (+1 more)

### Community 87 - "swagger-ui-express"
Cohesion: 0.25
Nodes (8): 17. Safe Errors, Expired Token, Inactive Station, Inactive Team, Invalid Token, Revoked Token, Unknown Format, Wrong Station Purpose

### Community 89 - "eslint"
Cohesion: 0.25
Nodes (8): `01_PRODUCT_SCOPE_PROMPT.md`, `02_PLAYER_SCREENS_PROMPT.md`, `03_STATION_QR_FLOW_PROMPT.md`, `04_ADMIN_FUNCTIONS_PROMPT.md`, `05_DATABASE_API_PROMPT.md`, `06_UI_REFERENCE_PROMPT.md`, `07_ACCEPTANCE_BACKLOG_PROMPT.md`, 5.1 Foundation Analysis Prompts

### Community 90 - ".getPublicConfig"
Cohesion: 0.25
Nodes (8): 3.1 QR Format, 3.2 Token Security, 3.3 Reusable Controlled Token, 3.4 One Active Session per Team, 3.5 Automatic Provisioning, 3.6 Seed Repair, 3.7 Production Safety, 3. Confirmed Business Rules

### Community 91 - "admin.controller.ts"
Cohesion: 0.40
Nodes (5): Business Rule Change, Change Classification, Documentation Reconciliation, Implementation Fix, Refactor

### Community 92 - "jwt-auth.guard.ts"
Cohesion: 0.11
Nodes (10): ActivityLogService, Injectable, PrismaModule, Module, PrismaService, Injectable, compareTeamResultRows(), TeamResultsService (+2 more)

### Community 93 - "16. Manual Device Test Matrix"
Cohesion: 0.29
Nodes (7): 16.1 iPhone Safari trên Production HTTPS, 16.2 iPhone Chrome trên iOS, 16.3 Permission Denied, 16.4 Repeated Open and Close, 16.5 Navigation and Unmount, 16.6 Duplicate QR Frame, 16. Manual Device Test Matrix

### Community 94 - "5. Scanner State Machine"
Cohesion: 0.29
Nodes (7): 5. Scanner State Machine, `active`, `decoding`, `error`, `idle`, `requestingPermission`, `success`

### Community 95 - "3. Task Classification"
Cohesion: 0.29
Nodes (7): 3.1 Business Rule Change, 3.2 Implementation Fix, 3.3 Documentation Reconciliation, 3.4 Analysis hoặc Audit, 3.5 Refactor, 3.6 New Feature, 3. Task Classification

### Community 96 - "16. Frontend Requirements"
Cohesion: 0.29
Nodes (7): 16.1 Public Route, 16.2 Flow, 16.3 URL Cleanup, 16.4 Duplicate Protection, 16.5 Success, 16.6 Failure, 16. Frontend Requirements

### Community 97 - "10. Final Challenge"
Cohesion: 0.33
Nodes (6): 10. Final Challenge, Confirmed Rules, Must Update After Change, Relevant Prompt, Required Reading, Scope

### Community 99 - "1. Authentication and Session"
Cohesion: 0.33
Nodes (6): 1. Authentication and Session, Must Update After Change, Read When QR Login Is Included, Relevant Prompts, Required Reading, Scope

### Community 100 - "2. Automatic URL QR Login"
Cohesion: 0.33
Nodes (6): 2. Automatic URL QR Login, Important Rule, Must Update After Change, Relevant Prompt, Required Reading, Scope

### Community 101 - "4. Team and Seed Data"
Cohesion: 0.33
Nodes (6): 4. Team and Seed Data, Important Rule, Must Update After Change, Related Prompt, Required Reading, Scope

### Community 102 - "5. Station Management"
Cohesion: 0.33
Nodes (6): 5. Station Management, Important Rule, Must Update After Change, Required Reading, Scope, Token Format

### Community 103 - "7. Station Tracking Mode"
Cohesion: 0.33
Nodes (6): 7. Station Tracking Mode, Confirmed Behavior, Must Update After Change, Relevant Prompt, Required Reading, Scope

### Community 104 - "8. Station Scoring"
Cohesion: 0.33
Nodes (6): 8. Station Scoring, Confirmed Rules, Must Update After Change, Relevant Prompt, Required Reading, Scope

### Community 105 - "5. Team QR Token Policy"
Cohesion: 0.33
Nodes (6): 5.1 Một active token cho mỗi Team, 5.2 Reusable Controlled Token, 5.3 Không phải Permanent Secret, 5.4 Rotation, 5.5 Revocation, 5. Team QR Token Policy

### Community 106 - "8. Token Storage Model"
Cohesion: 0.33
Nodes (6): 8. Token Storage Model, `expires_at`, `last_used_at`, `token_fingerprint`, `token_hash`, `usage_count`

### Community 107 - "12. Migration Strategy"
Cohesion: 0.33
Nodes (6): 12. Migration Strategy, Phase 1 — Inventory, Phase 2 — Provision New Tokens, Phase 3 — Reissue QR, Phase 4 — Compatibility Window, Phase 5 — Disable Legacy

### Community 108 - "7. Database Mapping"
Cohesion: 0.33
Nodes (6): 7.1 Team QR Token Record, 7.2 Station QR Token Record, 7.3 Fingerprint, 7.4 Secure Hash, 7.5 Raw Token Retrieval, 7. Database Mapping

### Community 109 - "7. Database and Migration Requirements"
Cohesion: 0.33
Nodes (6): 7.1 Target Token Model, 7.2 Remove One-Time Consumption as the Default Policy, 7.3 Constraints, 7.4 Atomic Operations, 7.5 Migration Safety, 7. Database and Migration Requirements

### Community 110 - "Prompt 02 - Phân tích màn hình Player"
Cohesion: 0.33
Nodes (5): Context, Danh sách màn hình cần phân tích, Nhiệm vụ, Output mong muốn, Prompt 02 - Phân tích màn hình Player

### Community 111 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:reset, db:verify, lint, prisma:deploy, prisma:generate, prisma:migrate (+7 more)

### Community 112 - "AuthService"
Cohesion: 0.22
Nodes (5): changedFiles, detectedMigrationChanges, detectedSeedChanges, fs, input

### Community 113 - "11. Leaderboard"
Cohesion: 0.40
Nodes (5): 11. Leaderboard, Confirmed Ordering, Must Update After Change, Required Reading, Scope

### Community 114 - "Feature Routing"
Cohesion: 0.22
Nodes (9): 12. Team Results Excel Export, 14. Git and Delivery Rules, Confirmed Rules, Feature Routing, Must Update After Change, Required Reading, Required Reading, Scope (+1 more)

### Community 115 - "3. QR Camera Scanning"
Cohesion: 0.40
Nodes (5): 3. QR Camera Scanning, Must Update After Change, Related Prompt, Required Reading, Scope

### Community 116 - "6. Station Check-in and Check-out"
Cohesion: 0.40
Nodes (5): 6. Station Check-in and Check-out, Business Rules to Confirm Before Work, Must Update After Change, Required Reading, Scope

### Community 117 - "9. Event Config and Event Time"
Cohesion: 0.40
Nodes (5): 9. Event Config and Event Time, Confirmed Rules, Must Update After Change, Required Reading, Scope

### Community 118 - "AuthController"
Cohesion: 0.18
Nodes (15): @prisma/client, devQrArtifactPath, devStationQrArtifactPath, ensureStationQrToken(), formatDuration(), logSeed(), main(), prisma (+7 more)

### Community 119 - "23. Verification Matrix"
Cohesion: 0.40
Nodes (5): 23. Verification Matrix, Backend, Deployment, Frontend, Seed

### Community 120 - "10. Format không được sử dụng"
Cohesion: 0.40
Nodes (5): 10.1 Predictable Team QR, 10.2 Credential QR, 10.3 Predictable Station QR, 10.4 Encoded Database ID, 10. Format không được sử dụng

### Community 121 - "11. Legacy Compatibility"
Cohesion: 0.40
Nodes (5): 11.1 Legacy Team Token, 11.2 Legacy Station Token, 11.3 Legacy Status, 11.4 Compatibility Rules, 11. Legacy Compatibility

### Community 122 - "18. Verification Matrix"
Cohesion: 0.40
Nodes (5): 18. Verification Matrix, Parser, Seed, Station QR, Team QR

### Community 123 - "3. Automatic URL Team QR Login"
Cohesion: 0.40
Nodes (5): 3.1 Official Payload Format, 3.2 Trusted URL Requirements, 3.3 Raw Team Token, 3.4 Reusable Controlled Token, 3. Automatic URL Team QR Login

### Community 124 - "4. Station QR Format"
Cohesion: 0.40
Nodes (5): 4.1 Official Format, 4.2 Purpose Code, 4.3 Backend Authority, 4.4 Random Token, 4. Station QR Format

### Community 125 - "8. Payload Classification"
Cohesion: 0.40
Nodes (5): 8.1 Automatic URL Team QR Login, 8.2 Station QR, 8.3 Legacy Payload, 8.4 Unknown Payload, 8. Payload Classification

### Community 126 - "13. Seed Requirements"
Cohesion: 0.40
Nodes (5): 13.1 Local/Test, 13.2 Idempotency, 13.3 Missing-Token Repair, 13.4 Production Guard, 13. Seed Requirements

### Community 127 - "20. Required Tests"
Cohesion: 0.40
Nodes (5): 20.1 Backend, 20.2 Seed, 20.3 Frontend, 20.4 Migration, 20. Required Tests

### Community 128 - "Prompt 03 - Phân tích flow trạm, QR và timer"
Cohesion: 0.40
Nodes (4): Context nghiệp vụ, Nhiệm vụ, Output mong muốn, Prompt 03 - Phân tích flow trạm, QR và timer

### Community 129 - "Prompt 04 - Phân tích chức năng Admin"
Cohesion: 0.40
Nodes (4): Context, Nhiệm vụ, Output mong muốn, Prompt 04 - Phân tích chức năng Admin

### Community 130 - "Prompt 05 - Phân tích database và API"
Cohesion: 0.40
Nodes (4): Context kỹ thuật, Nhiệm vụ, Output mong muốn, Prompt 05 - Phân tích database và API

### Community 131 - "Prompt 06 - Phân tích UI reference và design direction"
Cohesion: 0.40
Nodes (4): Context UI hiện tại, Nhiệm vụ, Output mong muốn, Prompt 06 - Phân tích UI reference và design direction

### Community 132 - "Prompt 07 - Tạo backlog và tiêu chí nghiệm thu"
Cohesion: 0.40
Nodes (4): Context, Nhiệm vụ, Output mong muốn, Prompt 07 - Tạo backlog và tiêu chí nghiệm thu

### Community 133 - "15. Current Implementation Status"
Cohesion: 0.40
Nodes (5): 15. Current Implementation Status, 2026-07-23 lifecycle cleanup verification, Automated Verification đã ghi nhận, Chưa xác nhận trên thiết bị thật, Implemented

### Community 134 - "3. Root Cause đã xác nhận"
Cohesion: 0.50
Nodes (4): 3.1 Native Decoder bị dùng sai như Camera Capability, 3.2 Scanner Lifecycle không ổn định, 3.3 Decode bắt đầu quá sớm, 3. Root Cause đã xác nhận

### Community 135 - "4. Accepted Architecture"
Cohesion: 0.50
Nodes (4): 4.1 Shared QR Detection Layer, 4.2 Decoder Selection, 4.3 Camera Constraints, 4. Accepted Architecture

### Community 136 - "7. Video Element Requirements"
Cohesion: 0.50
Nodes (4): 7. Video Element Requirements, `autoPlay`, `muted`, `playsInline`

### Community 137 - "8. Frame Decoding"
Cohesion: 0.50
Nodes (4): 8.1 Canvas Fallback, 8.2 Decode Scheduling, 8.3 Overlapping Work, 8. Frame Decoding

### Community 138 - "12. Frontend Public Route"
Cohesion: 0.50
Nodes (4): 12. Frontend Public Route, Error, Loading, Success

### Community 139 - "17. Seed Behavior"
Cohesion: 0.50
Nodes (4): 17. Seed Behavior, Idempotency, Local/Test Seed, Production Safety

### Community 140 - "2. Phân biệt các loại QR"
Cohesion: 0.50
Nodes (4): 2. Phân biệt các loại QR, Station Check-in QR, Station Check-out QR, Team QR Login

### Community 141 - "9. Raw Token và Reprint Strategy"
Cohesion: 0.50
Nodes (4): 9. Raw Token và Reprint Strategy, Option A — Encrypted Raw Token, Option B — Protected QR Artifact, Option C — One-time Display + Rotate to Reprint

### Community 142 - "13. QR Artifact Labeling"
Cohesion: 0.50
Nodes (4): 13. QR Artifact Labeling, Station Check-in Label, Station Check-out Label, Team QR Label

### Community 143 - "14. Rotation và Revocation"
Cohesion: 0.50
Nodes (4): 14. Rotation và Revocation, Compromise Response, Station Token, Team Token

### Community 144 - "2. Namespace và Versioning"
Cohesion: 0.50
Nodes (4): 2.1 Station QR, 2.2 Team QR Login, 2.3 Future Versioning, 2. Namespace và Versioning

### Community 145 - "7. Graphify Workflow"
Cohesion: 0.50
Nodes (4): 7. Graphify Workflow, Có thể bỏ qua Graphify khi, Nên dùng Graphify khi, Nếu Graphify không khả dụng

### Community 146 - "14. Raw Token and QR Artifact Strategy"
Cohesion: 0.50
Nodes (4): 14. Raw Token and QR Artifact Strategy, Strategy A — Encrypted Raw Token, Strategy B — Protected QR Artifact, Strategy C — Display Once and Rotate to Reprint

### Community 147 - "Prompt 01 - Phân tích phạm vi sản phẩm"
Cohesion: 0.50
Nodes (3): Nhiệm vụ, Output mong muốn, Prompt 01 - Phân tích phạm vi sản phẩm

### Community 148 - "MOVEment 2026 — All Required Markdown Files"
Cohesion: 0.33
Nodes (6): assert, expect(), path, plan(), script, { spawnSync }

### Community 149 - "13. Feature Integration"
Cohesion: 0.67
Nodes (3): 13.1 Login QR Scanner, 13.2 Station QR Scanner, 13. Feature Integration

### Community 150 - "6. Automatic Token Provisioning"
Cohesion: 0.67
Nodes (3): 6. Automatic Token Provisioning, Khi tạo Team mới, Missing Token Repair

### Community 151 - "16. API Validation Flow"
Cohesion: 0.67
Nodes (3): 16.1 Team QR Login, 16.2 Station QR, 16. API Validation Flow

### Community 152 - "6. Automatic Provisioning"
Cohesion: 0.67
Nodes (3): 6.1 Khi tạo Team, 6.2 Khi tạo Station, 6. Automatic Provisioning

### Community 153 - "9. Generated Data và Seed Workflow"
Cohesion: 0.67
Nodes (3): 9. Generated Data và Seed Workflow, Khi tạo Station mới, Khi tạo Team mới

### Community 154 - "UpdateEventConfigDto"
Cohesion: 0.20
Nodes (14): AdminScoreDto, ForceProgressStatusDto, ReopenProgressDto, SubmitScoreDto, IsEnum, IsInt, IsOptional, IsString (+6 more)

### Community 155 - "CreateStationDto"
Cohesion: 0.17
Nodes (12): CreateStationDto, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl (+4 more)

### Community 156 - ".getPublicConfig"
Cohesion: 0.67
Nodes (3): Backend work still required, P0 remaining work, P1 event-readiness checks

### Community 160 - "package.json"
Cohesion: 0.33
Nodes (5): description, license, name, private, version

### Community 161 - "init.sql"
Cohesion: 0.32
Nodes (12): "activity_logs", "event_config", "final_challenges", "final_submissions", "games", "qr_tokens", "score_events", "stations" (+4 more)

### Community 162 - "migration.sql"
Cohesion: 0.32
Nodes (12): "activity_logs", "event_config", "final_challenges", "final_submissions", "games", "qr_tokens", "score_events", "stations" (+4 more)

### Community 165 - "validate-environment.ts"
Cohesion: 0.30
Nodes (9): AppModule, Module, buildCorsOrigin(), Environment, parseCorsOrigin(), requiredProductionValue(), productionEnvironment, validateEnvironment() (+1 more)

### Community 166 - "final-challenge-seed.ts"
Cohesion: 0.25
Nodes (9): ExistingFinalChallenge, FINAL_CHALLENGE_SEED_POINTS_BY_RANK, FinalChallengeSeedAction, getCanonicalFinalChallengeSeedData(), isFinalChallengeProductionOverrideEnabled(), normalizeFinalAnswer(), planFinalChallengeSeed(), SeedEnvironment (+1 more)

### Community 167 - "Get"
Cohesion: 0.24
Nodes (8): logout(), RunningPersonIcon(), RunningPersonIconProps, ROLE_LABELS, AppFrame(), AppFrameProps, buildTimestampLabel, getRouteTeamContextId()

### Community 169 - "UpdateFinalConfigDto"
Cohesion: 0.19
Nodes (10): SubmitFinalDto, IsOptional, IsString, UpdateFinalConfigDto, challenge, mockActivityLog, mockEventConfig, mockPrisma (+2 more)

## Knowledge Gaps
- **1024 isolated node(s):** `deploy.sh script`, `fs`, `input`, `changedFiles`, `detectedMigrationChanges` (+1019 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`, `AuthController`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `AuthController` to `dependencies`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `createQrTokenFingerprint()` connect `Prompt 02 - Phân tích màn hình Player` to `store.ts`, `UpdateEventConfigDto`, `.generateTeamQrLoginToken`, `AuthController`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `deploy.sh script`, `fs`, `input` to the rest of the system?**
  _1024 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `AdminService` be split into smaller, more focused modules?**
  _Cohesion score 0.08458208458208458 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._