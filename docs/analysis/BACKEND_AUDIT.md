## 2026-07-24 Team Results Excel export and Team Color UI

- Added shared Team Results ranking/export logic with the confirmed comparator: `team.totalPoints` descending, `team.totalPlaySeconds` ascending, active completed Stations descending, correct Final submitted time ascending with nulls last, then numeric Team ID ascending.
- Added new Admin Team Results Excel endpoint `GET /api/admin/reports/team-results.xlsx` using ExcelJS, one worksheet, one row per non-deleted Team, active Station `Check-in`/`Check-out`/`Score` groups, HCMC filename/datetime conversion, numeric Excel date/duration formats, and `Content-Disposition` filename support.
- Kept legacy `/api/admin/reports/summary.xlsx` for compatibility; Admin Operations now downloads the new Team Results export.
- Added canonical `teamColor` API field with temporary `color` alias, strict Admin `#RRGGBB`/`null` validation, uppercase normalization, explicit clear behavior, missing-field unchanged update behavior, and conflicting alias rejection.
- Added scoped Team Color UI variables for Team-facing shell, Admin single-Team contexts, Admin Team list cards, and Team editor color input/preview without changing Admin map routes or `StationsMapPanel` behavior.
- Synchronized Business Rules, project spec, Feature routing, and the Excel/Team Color requirements document.
- Verification passed: targeted backend tests (`64/64`), full backend Jest suite (`120/120`), backend lint/build, frontend lint/build, `git diff --check`, and `graphify update .`. Frontend build retains the known non-blocking large-chunk warning. Graphify warned that `hooks.json` produced zero nodes and SQL extraction lacked `tree_sitter_sql`.
- Not performed: commit, push, deploy, Production migration/runtime verification, manual Excel/Google Sheets open check, manual browser Team Color review.

## 2026-07-24 Compact Admin headers and Team identity cleanup

- Reduced padding, icon size, title size, and spacing for Teams, Leaderboard, and Operations Center page headers.
- Removed the redundant Leaderboard and Teams header descriptions.
- Admin no longer sees `Current team` in the global header or a current-Team badge/style in the Team list.
- Player current-Team identity remains unchanged.
- Frontend lint and production build passed.

## 2026-07-24 Role-aware Leaderboard current-Team marker

- Leaderboard now derives the current Team marker only for Player sessions.
- Admin no longer sees `Your team` or the current-Team row highlight based on the last selected Admin Team.
- Player behavior remains unchanged.
- Frontend lint and production build passed.

## 2026-07-24 Admin Team-first Station navigation

- Removed the standalone Stations footer action for Admin while preserving it for Players.
- Admin login now opens `/teams`; selecting a Team opens `/teams/:teamId/stations`.
- Admin Station detail uses `/teams/:teamId/stations/:stationId`, preserving Team context for score/status actions and back navigation.
- Player `/stations`, `/stations/:stationId`, and map flows remain Player-only.
- Frontend lint and production build passed.

## 2026-07-24 Designated ST Station set

- Business designated exactly four `ST` Stations: `ST003`, `ST004`, `ST010`, and `ST047`.
- Added migration `20260724153000_designate_st_stations`, preserving `CIPHER`, assigning the designated set to `ST`, and assigning every other non-Cipher Game to `STANDARD`.
- Updated seed definitions so fresh databases use the same designated set.
- Applied the migration to the tester database. Result: `3 CIPHER`, `4 ST`, and `3 STANDARD`; the earlier `3 CIPHER` plus `7 ST` migration result is superseded.
- Verification passed: all `113` Backend tests, Backend/Frontend builds, migration status, two consecutive seed runs, and `db:verify`.

## 2026-07-24 Station Game Type constraint and video visibility

- Replaced free-text Station Game Type with the fixed values `CIPHER`, `ST`, and `STANDARD`.
- Added migration `20260724150000_constrain_station_game_types`: Legacy `CIPHER` values are preserved, other Games with a supported YouTube URL become `ST`, remaining Games become `STANDARD`, and a database `CHECK` constraint rejects other values.
- Backend DTO/service validation rejects unsupported types and rejects `ST` without a valid HTTPS YouTube URL.
- Admin Station create/edit uses a combobox. Player Station detail and map expose `Watch Video` only for `ST`; the Station list always renders the action but disables it unless the Station is `ST` with a usable URL.
- Updated local/test seed and production-like smoke inputs to use the canonical types.
- Applied the migration to the tester database. Result: `3 CIPHER`, `7 ST`, `0 STANDARD`; all seven non-Cipher seed Games have a valid stored YouTube URL.
- Verification passed: all `113` Backend tests, Backend/Frontend lint and build, migration status, two consecutive seed runs, `db:verify`, and local Backend/Frontend HTTP route checks.

## 2026-07-24 Admin Station game configuration edit

- Admin Station edit now accepts and persists `gameType` and integer `maxPoints`.
- The Station Game update and corresponding `team.maxPossiblePoints` delta run in the existing Station update transaction.
- The Station editor enables both fields for existing Stations and submits them through the audited Admin update API.
- Verification passed: targeted Admin service tests (`25/25`) and Backend/Frontend production builds.

## 2026-07-24 Admin Operations UI merge recovery

- Restored the responsive, styled local Admin Operations page that was replaced by the minimal remote version during merge conflict resolution.
- Preserved the remote Event/Final behavior by adding `finalStartsAt`, keeping the read-only current keyword plus optional keyword rotation, and describing Final opening independently from Event end.
- Retained loading/error handling, formatted dashboard metrics, structured operation lists, responsive tabs/forms, refresh control, and Excel export from the local UI version.

## 2026-07-24 Admin score-only correction

- Fixed Station Detail Admin score adjustment to always use the audited Admin correction endpoint instead of selecting the waiting-score submission endpoint from Frontend status.
- Admin score correction now always requires a non-empty reason in both the Admin DTO/service and the UI form.
- Correction is available only for an already `COMPLETED` progress. The UI disables the form otherwise, and the Backend independently rejects direct requests for non-completed progress.
- Admin correction updates only `scoreAchieved` and `scoreEnteredByUserId` on progress, adjusts Team total points by the score delta, and writes score/activity audit records. It preserves progress status plus Check-in, Check-out, and completion timestamps.
- The confirmation dialog now states that status and timestamps remain unchanged.
- Verification passed: all 109 Backend tests, including non-completed Admin correction rejection and Player score regression coverage, Backend/Frontend lint and build, diff check, Graphify update, and local tester container recreation. The tester API is healthy; the known non-blocking Frontend large-chunk warning remains.

## 2026-07-24 Scoring confirmation code removal

- Removed the scoring confirmation-code mechanism from the accepted Business Rules, Team score DTO/API, Player service, frontend Station score form, environment validation, seed/config, smoke scripts, and current operational documentation.
- Team score submission now requires a valid authenticated Team session and completed Check-out, while retaining backend score bounds, duplicate-completion protection, and the separate Admin correction/audit path.
- Added migration `20260724120000_remove_scoring_confirmation_code` to drop `event_config.scoring_code_hash`. Historical migration and audit records remain unchanged as history.
- Verification passed: Prisma Client generation and schema validation, all 107 Backend tests, Backend lint/build, Frontend lint/build, active-source reference scan, `git diff --check`, and Graphify update. The tester Backend/Frontend containers were recreated, all migrations applied, seed completed, the API became healthy, and its live OpenAPI document contains no `confirmationCode` or `TeamSubmitScoreDto`. The Frontend build retains the known non-blocking large-chunk warning.
- Production migration and deployment have not been performed.

## 2026-07-24 Tester runner Prisma Studio

- Added Prisma Studio to `scripts/tester-run.ps1` so `npm run tester`, `tester:serve`, and `tester:smoke` start Backend API, Frontend preview, and Prisma Studio together.
- Added configurable `-PrismaStudioPort` with default `5555`, port availability checks, a tracked Prisma Studio background job, readiness probing, URL output, and `.tester-logs/prisma-studio.log` cleanup/log reporting.
- Verification passed: `npm run tester:smoke -- -SkipInstall -SkipSeed -ApiPort 3100 -FrontendPort 4273 -PrismaStudioPort 5655`, backend lint/build, frontend lint/build, and `git diff --check`. Frontend build retains the known non-blocking large-chunk warning. Production deploy, push, and destructive Git operations were not performed.

## 2026-07-24 Final start and Event end separation

- Changed the active Final opening path to use Admin Event Config `finalStartsAt` through `EventConfigService.isPastFinalStart()` instead of `eventEndTime`. `eventEndTime` now remains scoped to closing new Station check-ins.
- Added `finalStartsAt` update validation and public Event Config exposure. Admin Event Config UI now shows and submits `finalStartsAt` beside `eventEndTime`, and Player Final UI states Station close time separately from Final opening time.
- Preserved Station lifecycle behavior: new check-in after `eventEndTime` is blocked with a closed Station message, while Check-out and score submission for a Station already in progress remain allowed. Player Station list/map now keep backend `LOCKED` status and show a closed Station message instead of opening the QR check-in modal.
- Updated Business Rule, Feature routing, project analysis, and Final prompt documentation to separate `finalStartsAt` from `eventEndTime`.
- Verification passed: targeted Final/Player service tests, backend lint, backend build, frontend lint, frontend production build, `git diff --check`, and `graphify update .`. No migration or seed change was required because `event_config.final_starts_at` already exists. Graphify update warned that `hooks.json` produced zero nodes and SQL extraction lacked `tree_sitter_sql`; Production deploy, Production runtime verification, push, and physical/manual browser click-through were not performed.

## 2026-07-24 Team QR raw token display

- Changed Team QR Login storage so new, seed-repaired, replaced, and rotated QR Login records store `raw_token` in the backend database while preserving fingerprint/hash validation for Team QR login.
- Admin Team QR listing now returns `rawToken`, `qrLoginUrl`, and `loginUrl` when available so the UI can display/download existing Team QR Login without generating or rotating tokens.
- Added migration `000010_team_qr_raw_token`; local migration deploy and seed repair update active Team QR rows with raw token values. Existing pre-migration tokens without raw values cannot be recovered from hash and are repaired by seed/rotation/replacement.
- Verification passed: Prisma Client generation, local migration deploy, seed, `db:verify`, active Team QR raw-token count check, backend admin service tests, backend lint/build, frontend lint/build, and `git diff --check`. Production migration, deploy, and physical QR scan were not performed.

## 2026-07-23 Station QR raw token display

- Changed Station QR storage so new, seed-repaired, replaced, and rotated SQ1 Station QR records store `raw_token` in the backend database while preserving hash/fingerprint validation for Player Check-in/Check-out.
- Admin Station QR listing now returns `rawToken` when available so the UI can display and download existing Check-in/Check-out QR strings without generating or rotating tokens.
- Added migration `000009_station_qr_raw_token`; local migration deploy and seed repaired active SQ1 Station QR rows with raw token values. Existing pre-migration tokens without raw values cannot be recovered from hash and are repaired by seed/rotation/replacement.
- Verification passed: Prisma Client generation, local migration deploy, seed, `db:verify`, active SQ1 raw-token count check, backend admin service tests, backend lint/build, frontend lint/build, and `git diff --check`. Production migration, deploy, and physical QR scan were not performed.

## 2026-07-23 iOS QR camera lifecycle cleanup

- Fixed the frontend QR camera lifecycle for the Login QR scanner and shared Station QR scanner without changing backend APIs, QR token formats, authentication, scoring, or Station validation behavior.
- Added an idempotent cleanup path that invalidates the scanner run, marks scanner refs inactive, cancels `requestAnimationFrame`, clears the Login scan interval, cancels pending video metadata listeners, disposes QR frame detector resources, stops all `MediaStreamTrack`s from either the stored stream ref or `video.srcObject`, clears `streamRef`, pauses the video, clears `srcObject`, removes `src`, and calls `video.load()` for iOS camera release.
- Hardened pending-start behavior so stopping while `getUserMedia`, render RAF, metadata, or `video.play()` is still pending does not create late streams, duplicate decode callbacks, or false camera errors after a user-initiated stop.
- Preserved manual token input, camera permission/error messaging, native `BarcodeDetector` preference, `jsQR` fallback, Team QR parsing, Station QR backend validation, and duplicate frontend submit guards.
- Verification passed: frontend lint, frontend TypeScript/Vite build, and frontend `build:prod`. Manual iPhone Safari/Chrome HTTPS camera-indicator verification remains pending and was not performed in this Windows workspace.
- Graphify update was attempted after the source changes but could not run because the `graphify` CLI is not installed or available in PATH on this host.

## 2026-07-23 Seed diagnostics and tester runner completion

- Investigated the reported `npm run tester` stop at `Running seed command \`ts-node prisma/seed.ts\` ...` against local PostgreSQL `127.0.0.1:55432/movement`. Migrations were not the cause; `prisma migrate deploy` reported all 8 migrations applied.
- Added explicit seed phase logging and durations for database connection, admin account, stations, challenges, Station QR repair, teams, Event Config, Final event, completion, and Prisma disconnect. The seed entrypoint now uses a `main().then(...).catch(...)` structure that always awaits `prisma.$disconnect()` and sets `process.exitCode = 1` on failure without `process.exit(0)`.
- Root cause found during full tester verification: seed itself completed successfully and exited; `npm run tester` later failed because frontend `node_modules` was incomplete and missing installed package `jsqr` even though `fe/package.json` and lockfile already declared it. The tester dependency check only verified local binaries, so it skipped `npm ci`.
- Hardened `scripts/tester-run.ps1` to check required package directories such as `jsqr`, log elapsed time for each checked command, use IPv4 loopback health URLs for backend/frontend readiness, and include the last readiness error when a service does not respond.
- Changed root `npm run tester` into a smoke runner that starts backend/frontend, verifies readiness, stops jobs, and exits `0`. Added `npm run tester:serve` for the previous keep-open manual testing behavior.
- Verification passed: standalone `npm run seed` twice, `npm run db:verify`, direct DB query confirmed Final Challenge `answerHash` is plaintext `DISANVANHOA2026`, and full root `npm run tester` exited `0`. The known non-blocking frontend large-chunk warning remains.
- Graphify update was attempted after the source changes but could not run because the `graphify` CLI is not installed or available in PATH on this host.

## 2026-07-23 Final Challenge Plain Answer and Production Seed Override

- Changed Final Challenge validation so backend no longer bcrypt-hashes the configured keyword or submitted answer. The existing `final_challenges.answer_hash` compatibility column now stores the normalized plain-text keyword, and validation compares normalized submitted text directly against the normalized stored value.
- Preserved Final answer secrecy at API/log boundaries: public challenge/submission DTOs still omit the configured answer, and Admin update logs continue redacting submitted answer values.
- Added a dedicated Final Challenge seed policy with canonical answer `DISANVANHOA2026`, stable business key title `Final Cipher`, and a temporary Production override through `2026-08-21 23:59:59 Asia/Ho_Chi_Minh`. During the window, seed updates only seed-managed Final Challenge fields; starting `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`, Production seed preserves an existing record and creates only if missing.
- Verification passed: focused Final service tests, focused Final seed policy tests, backend typecheck, full backend Jest suite, backend lint, backend build, root smoke test, `git diff --check`, and frontend lint/build for cross-package safety. No database reset, Production migration, deploy, `.env` edit, or real Production mutation was performed.

## 2026-07-22 Conditional Backend Database Deployment

- Added commit-range database change detection to the manual `Deploy Backend (ECS)` workflow. The workflow now accepts optional `base_commit`, optional `target_commit`, and boolean `force_database_steps` inputs while preserving the `master` branch guard and backup/deploy confirmation gates.
- Backend deployment now resolves the target commit from the input or `origin/master`, resolves the base commit from input or protected server marker `/opt/movement/deploy-markers/movement-api.commit`, and stops safely when neither base source is available. It does not compare only `HEAD~1`.
- `be/deploy/deploy.sh` classifies the complete deployed range with `be/deploy/plan-database-steps.js`. Schema/migration paths trigger Prisma migrate and `db:verify`; seed and database-verification paths trigger Production-safe seed and `db:verify`; `force_database_steps=true` runs migration, seed, and `db:verify` regardless of detected changes.
- Application-only backend changes now skip `prisma migrate deploy`, Production seed, and database-specific verification while still installing dependencies, running Prisma Client generation for build safety, building, restarting `movement-api`, checking backend health, and updating the deployed marker only after success.
- Failure behavior remains fail-fast: failed migration, seed, database verification, build, restart, or health check stops the deployment before marker update. Migration, seed, and pre-restart database verification failures occur before backend restart.
- No frontend deployment behavior, application Business Rules, QR behavior, Station scoring, Final Challenge behavior, Production secrets, Production state, push, or deploy action was changed or performed.

## 2026-07-22 Staged Production Deployment Workflow

- Converted Production deployment from push-triggered workflows to two independent manual phases. `Deploy Backend (ECS)` is now Phase 1 and can only run by `workflow_dispatch` with explicit `BACKUP_CONFIRMED` and `deploy-backend` inputs.
- Preserved the existing backend ECS deployment script and branch strategy. The backend workflow still defaults to `master`, rejects any non-`master` Production deploy branch, requires host `be/.env`, runs Prisma generate, `prisma migrate deploy`, Production-safe seed, `db:verify`, build, backend restart through PM2/systemd, post-restart `db:verify`, and then checks local backend `/api/docs`.
- Replaced the frontend OBS production workflow with a separate manual `Deploy Frontend (Nginx)` Phase 2 workflow. It defaults to `master`, requires exact `deploy-frontend` input, uses the `production-frontend` environment gate, builds with `VITE_API_BASE_URL` unset so browser requests stay same-origin `/api`, syncs `fe/dist` to `/var/www/movement/current`, validates and reloads Nginx, and checks HTTPS root, `/api/docs`, `/qr-login`, refresh-style `/qr-login?token=...`, and missing asset `404`.
- Removed automatic `push` triggers from both Production deployment workflows so fast-forwarding `develop` into `master` cannot accidentally start backend and frontend deployments in parallel. GitHub Environments `production-backend` and `production-frontend` are referenced for approval gates; required reviewers must be configured in repository settings.
- No application Business Rules, QR behavior, Station scoring, Final Challenge behavior, database migrations, seed source, production secrets, DNS, server files, or Production state were changed. No deploy, push, Production migration, Production access, or QR token lifecycle action was performed.

## 2026-07-22 Production-like Integration Verification

- Audited current runner options before changing files. Existing `npm.cmd run tester` and `docker-compose.tester.yml` verify local HTTP same-origin behavior through Vite preview, but neither provided a disposable HTTPS-origin reverse-proxy smoke. The checked-in production Nginx config targets the real `heroes.nalth.top` host and was not used or modified.
- Added disposable harness `scripts/production-like-smoke.ps1` to fill the verification gap without changing product behavior. The harness tries Docker PostgreSQL first, falls back to a random clean database on the local PostgreSQL service when Docker is unavailable, runs Prisma generate/deploy through migration `000008`, seed twice, `db:verify`, starts the backend with `NODE_ENV=production` and runtime-generated non-production secrets, serves the built frontend over local HTTPS, proxies same-origin `/api`, and exercises Team QR, SQ1 Station QR, Station scoring, Final Challenge, leaderboard, CORS, SPA fallback, and tracked/log secret scans.
- The live smoke found and fixed a CORS configuration issue: passing a single string to Nest/CORS caused the configured origin to be echoed even for a disallowed request origin. `main.ts` now uses `buildCorsOrigin()` with an allow-list callback for configured origins while retaining wildcard behavior for explicit/unset development use.
- Production-like smoke passed using HTTPS origin `https://127.0.0.1:4443`, API origin `http://127.0.0.1:3100`, and a disposable database `movement_smoke_20260722220523`. It verified clean migrations through `000008`, seed idempotency, `db:verify`, production-mode backend startup, direct and refresh `/qr-login` SPA fallback, same-origin `/api/docs`, missing-asset 404, configured-origin CORS allow and disallowed-origin deny, reusable Team QR login, one-active-session replacement, revoked/rotated Team QR behavior, new Station QR pair creation, SQ1 Check-in/Check-out, wrong-purpose and revoked-token failures, independent Station QR rotation, `SCORE`/`TIME`/`BOTH` scoring behavior, invalid/over-max/negative score rejection, duplicate score rejection, Final before/after Event end, active-Station Final block, keyword normalization, cooldown rejection, rank 1/10/11 points, duplicate Final idempotency, and leaderboard total including Station score plus Final bonus once.
- Verification passed: Docker Compose config render, backend full Jest suite (89), backend lint, backend build, frontend lint, frontend production build, Prisma Client generation, production-like smoke, production environment guard spec, `git diff --check`, static tracked-file raw-secret search, and production-like log secret scan. Docker daemon remained inaccessible on this host, so the smoke used the local PostgreSQL fallback instead of a Docker database container.
- Not performed: actual Production mutation, production deployment, push, physical QR scan, browser UI click-through beyond HTTPS route fetches, or destructive Git history operations. Business Rules, Team QR token design, Station QR schema/provisioning rules, Station scoring rules, Final Challenge rules, and production deployment configuration were not redesigned.

## 2026-07-22 Final Challenge Event Config, Keyword, Cooldown, and Ranking

- Historical note: this 2026-07-22 verification used Admin Event Config `eventEndTime` through `EventConfigService.isPastEventEnd()` for Final opening; that behavior was superseded on 2026-07-24 by the `finalStartsAt` rule. Active Source Code no longer depends on fixed `11:30` or `11:45` values.
- Changed current Event Config database defaults from fixed event rehearsal times to neutral `23:59` defaults through Prisma schema, init SQL, and migration `000008_final_event_defaults`. Runtime Final availability remains controlled by the persisted Admin Event Config row, not by a hard-coded Final start value.
- Repaired local/test seed behavior for the official Final keyword `DISANVANHOA2026`: seed now creates new active Final challenges with that keyword and repairs an existing active challenge when its hash does not match, while repeated seed preserves an already-valid hash.
- Backend and frontend now trim and uppercase Final answers before submission/validation. Backend bcrypt comparison remains authoritative; the frontend does not contain the authoritative keyword and performs only input UX normalization.
- Moved wrong-answer cooldown enforcement into the serializable Final submission transaction so retries, concurrent requests, and multiple-tab attempts re-check current cooldown state before creating a new submission. Cooldown continues to derive from wrong `final_submissions` history and increases from 1 second to a maximum of 10 seconds.
- Preserved eligibility rules: a Team does not need to complete all Stations before Final, but a Team with active `CHECKED_IN`/`PLAYING` progress is blocked until that Station is finished. Station Check-in after Event end and Check-out for a Station started before Event end remain governed by the existing Player flow.
- Preserved ranking and bonus rules: first correct database-confirmed submission determines rank; ranks 1 through 10 award 10 down to 1 points; rank 11 and later award 0. Existing unique `(final_challenge_id, winner_rank)` constraint prevents duplicate non-null ranks, and service-level idempotency prevents one Team from receiving a second Final rank or bonus.
- Verification passed: focused Final service tests (17), full backend Jest suite (87), backend lint, backend build, local Prisma migration deploy, seed twice, `db:verify`, direct active Final keyword hash check, frontend lint, and frontend production build. Static search confirmed no active Source Code path contains fixed `11:30` or `11:45`; frontend source does not contain `DISANVANHOA2026`.
- Not performed: Production migration, production smoke, physical QR scan, manual browser double-click test, push, or deploy. Team QR Login, Station QR token schema/provisioning, Station tracking/scoring Business Rules, Final close scheduling, and production deployment configuration were not changed.

## 2026-07-22 Station Tracking Mode and Station Scoring

- Verified current tracking behavior after the SQ1 Station QR migration: `SCORE` Check-out sets `checked_out_at` to `checked_in_at` and waits for Team-device score entry; `TIME` Check-out records real duration, completes immediately with score `0`, and does not require score submission; `BOTH` Check-out records real duration and waits for score entry.
- Added the official Station score default to the database layer: `games.max_points` now has Prisma and SQL default `30` through migration `000007_station_score_defaults`, and Admin Station creation applies the same default when `maxPoints` is omitted.
- Hardened backend score validation in both Team score submission and Admin audited correction. The service layer now rejects non-integer, negative, and above-max scores even if controller/frontend DTO validation is bypassed.
- Preserved scoring-code security: Team score submission still verifies only against the bcrypt hash in `event_config.scoring_code_hash`; the raw code is not returned by API responses or exposed in the frontend bundle. Admin score correction remains a separate Admin-guarded audited flow and does not use the Team scoring-code path.
- Preserved duplicate/concurrency protection for Team score submission through the conditional transaction claim on `completed_at IS NULL` and `checked_out_at IS NOT NULL`; focused tests now cover stale/concurrent duplicate submission awarding score only once.
- Updated frontend score UX to use the Station's configured max score, falling back to `30`, instead of a hard-coded `1000`. The existing Team Check-out modal logic still skips score entry for `TIME` and opens score entry only for `SCORE`/`BOTH`.
- Verification passed: focused Player/Admin service tests (32), full backend Jest suite (77), backend lint, backend build, Prisma Client generation, local migration deploy, seed twice, `db:verify`, frontend lint, frontend production build, and disposable local API smoke using SQ1 Check-in/Check-out plus Team score submission for two Teams. The smoke reset/reopened local/test progress targets through audited Admin APIs and rotated only local/test Station QR tokens needed to obtain raw SQ1 payloads.
- Not performed: Production migration, production smoke, physical QR scan, push, or deploy. Team QR Login, Station QR token format, Final Challenge, deployment, and production configuration were not changed.

## 2026-07-22 Secure Station QR provisioning and migration

- Migrated Station QR issuance from predictable `MV26-STATION-<stationId>-<purpose>` generation to official SQ1 opaque tokens: `MV26-SQ1-I-<randomToken>` and `MV26-SQ1-O-<randomToken>`. The random portion is generated from 16 cryptographically secure random bytes and encoded as 26-character uppercase Base32, giving 128 bits of entropy.
- Added `qr_tokens.schema_version`, `revoked_at`, `updated_at`, lifecycle consistency, and partial unique index `qr_tokens_one_active_per_station_purpose` so each Station/purpose can have at most one active token. Existing rows are marked `LEGACY`; duplicate active rows are deactivated during migration.
- Station creation now creates Station, Game, one `CHECK_IN` SQ1 token, one `CHECK_OUT` SQ1 token, Team progress rows, and Team max-point updates in one transaction. If either token cannot be created, Station creation rolls back with the transaction.
- Player Check-in/Check-out now looks up the token by SHA-256 fingerprint, verifies bcrypt hash and lifecycle, then uses the database token record as the source of truth for Station and purpose. The route Station ID is only checked against the resolved token Station to reject mismatched screen/token use.
- Admin now supports Station QR status, independent `CHECK_IN` rotate/revoke, and independent `CHECK_OUT` rotate/revoke. Rotate returns the raw token once; revoke marks only the selected purpose inactive/revoked.
- Local/test seed repairs missing or Legacy Station QR tokens by purpose, preserves existing active SQ1 tokens on repeated runs, and writes newly generated raw Station tokens only to ignored local artifact `.tester-logs/dev-station-qr-tokens.txt`. Production-mode seed emitted no raw Station QR token output in local verification.
- Reprint strategy selected: rotate-to-reprint. Raw Station tokens are not stored plaintext or encrypted and no protected QR artifact is stored, so reprinting an unavailable raw token requires rotating that Station/purpose.
- Legacy predictable Station QR compatibility is retained only when an active Legacy database record still exists. New Station creation, seed repair, and smoke scripts no longer generate predictable Station QR payloads.
- Local migration `000006_secure_station_qr_tokens` applied successfully. Initial seed converted the 10 seeded Stations to 20 active SQ1 tokens; a repeated seed preserved the active token inventory digest. A simulated missing `ST002 CHECK_OUT` token repair created one replacement row, restored exactly one active `CHECK_OUT`, and left no duplicate active Station/purpose rows.
- Verification passed: Prisma Client generation, migration deploy, seed repeated idempotency, missing-token repair, production-mode local seed guard, `db:verify`, focused Station QR/Admin/Player/helper tests (24), full backend Jest suite (65), backend build, backend lint, frontend lint, and frontend production build. The frontend build retains the known non-blocking large-chunk warning.
- Not performed: Production migration, production printed QR reissue, manual camera scan on physical devices, live Admin QR printing workflow, push, or deploy. Team QR Login, Final Challenge, and Station scoring Business Rules were not changed.

## 2026-07-22 Reusable Automatic URL Team QR Login

- Migrated Automatic URL Team QR Login from one-time consumption to a reusable controlled token. Successful login now updates `last_used_at` and `usage_count` without setting `consumed_at`; password and QR login continue to share the one-active-session-per-Team replacement path.
- Added `qr_login_tokens.is_active`, a partial unique index enforcing at most one active token per Team, nonnegative usage validation, and an active/not-revoked consistency check. The migration activates only the newest valid unconsumed token per Team; consumed, revoked, and expired history is not reactivated.
- Team creation now provisions the secure Automatic URL token in the Team transaction and returns its raw URL once. New Team creation and local/test seed no longer generate predictable Legacy Team QR credentials; existing `Team.loginQr*` values and `POST /api/auth/team-qr-login` remain available for already-issued Legacy QR compatibility.
- Local/test seed repairs a missing token, deactivates stale active records before replacement, preserves a valid active token on repeated runs, and continues to write newly generated URLs only to the ignored local artifact. Production-mode seed does not generate or print Automatic URL tokens.
- Admin generate, rotate, revoke, and status operations are distinct. Generate refuses to replace a valid active token, rotate revokes the old token before returning a replacement URL, and revoke marks the token inactive without deleting the Team. Raw-token strategy remains display-once with rotation required for reprint.
- Admin UI now shows the automatically provisioned URL once after Team creation, exposes separate Generate and Rotate actions, reports unbounded usage count, and describes the credential as reusable while active. Legacy consumed-token errors remain mapped for compatibility.
- Local migration `000005_reusable_qr_login_tokens` applied successfully. The first seed repaired 25 expired Team tokens; a second seed preserved the same 25-token inventory digest. A simulated missing-token repair produced one replacement and retained exactly one active token for each of 25 Teams with no duplicate active rows.
- Verification passed: Prisma Client generation, migration deploy, focused Auth/Admin tests (17), full backend Jest suite (56), backend build, backend lint, seed twice, missing-token repair, production-mode local seed guard, `db:verify`, frontend lint, and frontend production build. The frontend build retains the known non-blocking large-chunk warning.
- Not performed: Production migration, Production QR issuance, deployed `/qr-login` verification, manual browser/phone login, push, or deploy. Station QR implementation was not changed.

<!-- DOC_RECONCILIATION_2026-07-22 -->
## 2026-07-22 Source of Truth and QR documentation reconciliation

- Documentation-only reconciliation completed. No Source Code, migration, database, seed runtime, deployment, or production environment was changed by this documentation step.
- Established `OPEN_QUESTIONS_AND_DECISIONS.md` as the Business Rule Source of Truth, `FEATURE_INDEX.md` as Feature routing, `AGENTS.md` as Agent Operational Instructions, and `00_WORKFLOW.md` as Prompt selection workflow.
- Updated QR documentation to require Automatic URL Team QR Login with a reusable controlled opaque token and Station QR format `MV26-SQ1-I/O-<randomToken>`.
- Updated documentation to require automatic Team token provisioning and automatic Station Check-in/Check-out token provisioning.
- Updated Event and Final documentation to use Admin Event Config end time instead of fixed `11:30`/`11:45`.
- Updated Station scoring documentation for `SCORE`, `TIME`, and `BOTH`, with default max score `30`, backend authority, hashed scoring-code handling, and duplicate protection.
- Historical audit entries containing predictable QR values remain preserved as evidence of previously verified Legacy behavior; they are not the current desired Business Rule.
- Known implementation gaps remain open: one-time Automatic URL token consumption, predictable Team/Station QR generation, Legacy seed/smoke fixtures, Production CORS/login verification, and real iPhone HTTPS camera verification.
- Verification for this documentation step: generated replacement Markdown files and an idempotent PowerShell apply script. Source Code tests were not run because Source Code was not modified.

# Backend Audit Status

## 2026-07-21 iOS QR camera fallback

- Root cause confirmed in the current frontend: `LoginPage` returned before opening the camera when `BarcodeDetector` was unavailable, and `QrTokenInput` disabled the camera button from the same native-detector check. iPhone Safari and Chrome iOS do not expose `BarcodeDetector`, so camera QR scan could not start even when `getUserMedia` was available over HTTPS.
- Added shared frontend QR detection that gates camera availability on `navigator.mediaDevices.getUserMedia`, opens the rear-preferred camera with `facingMode: {ideal: "environment"}`, prefers native `BarcodeDetector`, and falls back to canvas-frame `jsQR` decoding for iOS/WebKit browsers.
- Login QR and station check-in/check-out QR inputs now share the detector helper, keep `muted`/`playsInline` video elements, avoid overlapping frame decode work, stop streams/timers/animation frames on stop/success/error/unmount, and preserve Paste QR/manual token entry.
- Verification: `npm.cmd install jsqr`, frontend lint, and frontend production build (`tsc -b && vite build`) passed. No frontend test files are present. Real iPhone Safari/Chrome iOS HTTPS camera verification is pending manual device testing.

## 2026-07-21 iOS QR camera lifecycle audit

- Root cause confirmed after the first fallback fix: station QR camera start was driven by a React effect after toggling `isCameraOpen`, so lifecycle cleanup could stop the stream during normal modal rerenders; the video also lacked `autoPlay` and decoding could begin before loaded metadata/non-zero dimensions. This matches the iPhone Safari symptom where a black preview appears briefly and the scanner resets without a decode.
- Reworked `QrTokenInput` so `getUserMedia` runs from the button handler, scanner state is explicit (`idle`, `requestingPermission`, `active`, `decoding`, `success`, `error`), start/stop are idempotent, streams/scanner runs live in refs, and decoding starts only after `loadedmetadata`, successful `video.play()`, and non-zero `videoWidth`/`videoHeight`.
- Added Vietnamese safe error categories for denied permission, missing camera, camera in use, browser/camera constraint failure, video playback failure, and QR scanner initialization failure. Development-only console diagnostics log secure context, `mediaDevices`, selected camera label after permission, stream state, video ready state/dimensions, play success/failure, and stop reason.
- Login QR video was aligned with iOS requirements by adding `autoPlay` and waiting for metadata before `video.play()`.
- Verification: frontend lint, standalone TypeScript build, frontend production build, and `build:prod` passed. Real iPhone Safari HTTPS verification is still pending on device.

## 2026-07-21 QR automatic login

- Added a separate one-time QR login flow instead of reusing the legacy predictable team QR token format. The legacy `POST /api/auth/team-qr-login` remains for compatibility; new HTTPS QR URLs exchange an opaque token through `POST /api/auth/qr-login`.
- Added `qr_login_tokens` with a unique SHA-256 token hash, team association, expiry, consumed/revoked timestamps, usage counters, creator, and last-used metadata. Raw QR tokens are returned only in the admin generation response and are not stored in the database.
- Backend exchange consumes tokens with a conditional update inside a transaction before issuing the normal team JWT/session. Concurrent scans/replay attempts cannot both create sessions; the losing request is rejected as consumed.
- Admin can generate, inspect, and revoke QR login tokens from the team list in System Config. Generation rotates outstanding active QR login tokens for the team and builds the URL from `FRONTEND_PUBLIC_URL`.
- Frontend added public `/qr-login`, removes `?token=` from the visible URL immediately, prevents duplicate submissions in the page lifecycle, maps safe backend error codes to user-friendly Vietnamese messages, and redirects successful team QR login to the normal team map flow.
- Deployment config now requires `FRONTEND_PUBLIC_URL` to be HTTPS in production and documents `QR_LOGIN_TOKEN_TTL_MINUTES`. Existing Nginx SPA fallback covers `/qr-login`; `/api/` remains a separate reverse proxy and must not be rewritten to `index.html`.
- Verification: `npm.cmd --prefix be run prisma:generate`, backend build, full backend Jest suite (47 tests), and frontend build passed. Frontend has no existing test runner, so QR route behavior is build-verified only.

## 2026-07-21 QR login URL and seed structure

- Standardized generated QR URLs on `FRONTEND_PUBLIC_URL` with `PUBLIC_FRONTEND_URL` kept as a backward-compatible fallback. The URL builder normalizes trailing slashes and always emits `/qr-login?token=...`.
- Development seed now creates missing one-time `QrLoginToken` records for seeded teams only outside production, stores hashes only, and writes newly generated raw URLs to ignored local artifact `.tester-logs/dev-qr-login-urls.txt`. Re-running seed preserves active QR tokens and does not rotate printed QR codes.
- Production deploy still runs seed, but `NODE_ENV=production` prevents seed from generating or logging raw QR login secrets. Production QR generation remains an authenticated Admin action.
- Added Admin route aliases matching the public runbook: `POST /api/admin/teams/:teamId/qr-login`, `POST /api/admin/teams/:teamId/qr-login/rotate`, and `DELETE /api/admin/teams/:teamId/qr-login`.
- Added `docs/analysis/QR_LOGIN.md` covering local browser QR, physical-phone LAN QR, production HTTPS QR, Team 1 development QR generation, regeneration/revocation, and raw-token security warnings.

## 2026-07-21 Final Challenge event-end flow

- Replaced the legacy Final opening rule with server-side event end time from Admin Event Config. `FinalService` now uses `EventConfigService.isPastEventEnd()` and blocks Final submission until the event has ended.
- Preserved station lifecycle requirements: new station check-in remains blocked after event end, while existing station check-out and score submission still work. Final entry is blocked while the team has an active `CHECKED_IN`/`PLAYING` station.
- Added wrong-answer cooldown without a database migration by deriving state from existing incorrect `final_submissions`: cooldown seconds are `min(wrongAttemptCount, 10)`. Bonus points now use the fixed rank formula `max(11 - rank, 0)`.
- Frontend Final page now polls `/api/player/final`, shows active-station blocking, wrong-attempt cooldown, and correct rank/bonus result. Station list polls for Final availability and shows an automatic CTA when the team is free.
- Historical note: Admin UI did not expose Final start time in this 2026-07-21 implementation, and Final opened from Event Config event end time. This was superseded on 2026-07-24 by exposing `finalStartsAt` in Admin Event Config.
- Verification: backend build/lint passed, full backend Jest suite passed (41 tests), frontend lint/build passed. Vite still reports the known large chunk warning.

## 2026-07-21 Deployment database initialization audit

- Root cause confirmed: production backend deploy refreshed code, installed dependencies, built the backend, ran `prisma migrate deploy`, and restarted PM2/systemd, but never executed the Prisma seed. Local tester and Docker tester did run seed, so CI/CD differed from local setup and deploy could be green with an initialized schema but missing admin/team/station/progress seed data.
- Fixed `be/deploy/deploy.sh` to run `prisma generate`, `prisma migrate deploy`, `prisma db seed`, seed verification, backend build, process restart, and a post-restart seed verification. The deploy script uses `set -euo pipefail`, so migration, seed, verification, or build failures fail the deployment.
- Added `db:reset` for local development only and `db:verify` for deployment smoke checks. Production must not use `migrate reset`; seed remains idempotent and is executed after migrations against the configured `DATABASE_URL`.
- Aligned `be/deploy/.env.example` with the production Nginx/API expectation: `PORT=8080`, `CORS_ORIGIN=https://heroes.nalth.top`, and `JWT_EXPIRES_IN`.
- Verification: `npm run prisma:generate`, `npm run prisma:deploy`, `npm run prisma:seed`, `npm run db:verify`, and `npm run build` passed locally against `127.0.0.1:55432/movement`. `db:verify` reported 25 teams, 10 active stations, 250 progress rows, and 20 station QR fingerprints.

## 2026-07-21 Local tester fail-fast fix

- Root cause confirmed: backend dependencies are installed inside `be/`, not through a root npm workspace. The required local dev/runtime packages are already declared in `be/package.json`: `prisma`, `@prisma/client`, `ts-node`, `@nestjs/cli`, and `typescript`.
- Fixed `scripts/tester-run.ps1` so it detects incomplete `node_modules` installs by checking required local binaries, runs `npm ci` in the affected app directory, checks `$LASTEXITCODE` after each npm command, and stops immediately with the failed command name and exit code.
- The runner now fails if backend/frontend ports are already occupied, throws if readiness checks do not pass, and clears `VITE_API_BASE_URL` for the frontend build so local tester traffic stays same-origin through `/api`.
- Verification: backend Prisma generate/deploy, seed, backend build, and frontend build passed locally. User smoke confirmed `http://localhost:4173/api/docs` serves Swagger through the frontend preview proxy.

## 2026-07-20 Docker frontend API proxy fix

- Root cause confirmed: `fe/vite.config.ts` proxied `/api` to `http://localhost:3000`, which points at the frontend container when Vite preview runs inside Docker; `docker-compose.tester.yml` also set client-side `VITE_API_BASE_URL=http://localhost:3000`.
- Fixed Vite config to use server-side `API_PROXY_TARGET`, defaulting to `http://localhost:3000` for host-local Vite runs, and applied the same proxy to both `server.proxy` and `preview.proxy`.
- Docker frontend now sets `API_PROXY_TARGET=http://api:3000` and no longer sets `VITE_API_BASE_URL`, so browser requests stay same-origin `/api/...` and Docker service URLs are not exposed in the bundle.
- Added an API healthcheck for `GET http://127.0.0.1:3000/api/docs` and made the frontend wait for the API service to be healthy before starting preview. Backend route `POST /api/auth/team-login` exists in `AuthController`, and the API command applies Prisma deploy/seed before `start:prod`.
- Verification: frontend lint/build passed; `docker compose -f docker-compose.tester.yml config` validated the resolved compose model; built bundle search found no `api:3000`, `localhost:3000`, or `/api/api`. Live compose smoke could not run on this machine because Docker daemon is not running (`docker_engine` pipe missing).

## 2026-07-20 heroes.nalth.top SPA routing fallback

- Confirmed frontend uses React Router `BrowserRouter` in `fe/src/main.tsx`; `/login`, `/teams`, `/stations`, and related paths are client-side routes in `fe/src/features/movement/routes.tsx`, not physical files in `fe/dist`.
- Production check before applying the config: `GET https://heroes.nalth.top/` returned `200 text/html`, while `GET https://heroes.nalth.top/login` returned `404 text/html`; `GET https://heroes.nalth.top/api/docs` also returned `404 text/html`. This indicates the live web server/static host is serving the root document but is not applying SPA history fallback or the `/api` reverse proxy.
- Updated `deploy/nginx/movement.conf` for `heroes.nalth.top`: `/api/` is a separate reverse proxy to the local Nest backend, static assets use `try_files $uri =404`, and `location /` uses `try_files $uri $uri/ /index.html` so BrowserRouter routes refresh correctly.
- Added `deploy/nginx/README.md` with build, publish, Nginx install/reload, and verification commands.
- Verification in repo: frontend lint/build passed; `fe/dist` contains `index.html` and assets but no physical `/login`, `/teams`, or `/stations` files. Nginx binary is not installed in this workspace, so `nginx -t` must be run on the server after copying the config.

## 2026-07-20 Login 405 object-storage investigation

- Traced login, QR login, QR paste, station check-in, and station check-out requests. Frontend API calls are centralized in `fe/src/features/movement/api.ts` and target `VITE_API_BASE_URL` plus `/api/...` paths.
- Confirmed backend routes accept `POST /api/auth/team-login`, `POST /api/auth/login`, `POST /api/auth/team-qr-login`, `POST /api/player/stations/:stationId/check-in`, and `POST /api/player/stations/:stationId/check-out`.
- Root-cause finding: a 405 response with `Code=MethodNotAllowed`, `Method=POST`, and `ResourceType=OBJECT` indicates the login POST reached static object storage instead of the Nest backend API. The failing runtime URL is `POST <VITE_API_BASE_URL>/api/auth/team-login` first for username/password team login, then `POST <VITE_API_BASE_URL>/api/auth/login` during admin fallback; QR login uses `POST <VITE_API_BASE_URL>/api/auth/team-qr-login`.
- Recommended deployment fix: build frontend with `VITE_API_BASE_URL` set to the backend API/proxy origin, or configure the production reverse proxy so `/api/*` goes to the ECS/API service rather than the OBS/static bucket. Direct blob uploads are not present in the runtime app; OBS usage is limited to the frontend deploy script, so no frontend upload endpoint needs POST-to-PUT correction.
- Frontend error handling now strips raw HTML/XML/object-storage bodies from user-facing messages and preserves method/status/URL in a sanitized `ApiError`. Login fallback from team to admin now only happens on auth failures, so infrastructure/routing errors are not masked by a second request.
- After pulling deploy workflows, confirmed `.github/workflows/fe-deploy.yml` builds with `vars.VITE_API_BASE_URL`. Added a workflow guard so FE deploy fails if that repository variable is missing/empty or points to OBS/static hosting; frontend code also ignores blank env values instead of using a same-origin API base.
- Production-standard refactor: frontend API calls now default to relative `/api/...` paths, with `VITE_API_BASE_URL` only as an optional environment override. Added `deploy/nginx/movement.conf` for HTTPS same-origin frontend hosting plus `/api` reverse proxy to the local Nest process. Deployed HTTPS builds reject insecure HTTP API overrides to avoid mixed-content failures.
- API client structure split endpoint contracts from HTTP/config/error handling in `fe/src/features/movement/apiClient.ts`; user-facing errors are sanitized and mapped to short operator-friendly messages.
- Verification: frontend lint and production build passed; Vite reported the known large chunk warning. Repo search found no hardcoded public backend IP URLs outside generated build artifacts.

## 2026-07-20 Remaining feature integration

- Added audited Admin Station create/update/deactivate APIs. Creation provisions a game, two purpose-specific QR tokens, and AVAILABLE progress for every team; deactivation preserves history and disables game/QR use.
- Added frontend Player leaderboard, station cancel, cipher submission, and Final Challenge routes.
- Added Admin Operations UI for dashboard, score queue, event config, activity logs, report export, Final config and submissions.
- Removed the legacy `system-admin` role and remaining Admin simulated check-in branch; map marker/media changes now persist through the backend.
- Backend build, frontend build/lint and read-only runtime smoke checks passed.
- The current backend `node_modules` is production-only/incomplete, so backend lint/tests could not be rerun locally (`typescript-eslint` and `jest` are absent). This does not affect the successful Nest build or runtime smoke result; rerun `npm ci` before the full backend quality gate.

## 2026-07-20 Runtime test-data cleanup

- Removed the legacy frontend dummy dataset/page/components and `public/assets/database.json`.
- Removed credential-bearing QR rehearsal fallback and demo credentials from the login screen; QR login now accepts only team QR tokens.
- Removed generated fake station scores/timestamps from the local normalization fallback.
- Replaced hard-coded `Playing Teams = 2` with a count derived from backend progress state.
- Removed the unsupported estimated-duration field from station cards and the Admin station editor.
- PostgreSQL rehearsal seed and automated test fixtures remain intentionally isolated from production runtime data.

Last updated: 2026-07-19

## Verification completed

- `npm ci` completed and Prisma Client was generated with `npm run prisma:generate`.
- `npm test -- --runInBand`: **36 passed**, across auth service/controller, team QR login, JWT guard, production environment validation, Player QR/scoring flow, and Final scoring/idempotency/retry handling.
- `npm run build`: **passed**.
- `npm run lint`: **passed** after adding the backend ESLint flat configuration.
- Prisma config has been migrated from deprecated `package.json#prisma` to `be/prisma.config.ts`; `npm run prisma:generate`, `npm run prisma:deploy`, and `npm run seed` all load the new config without the Prisma 7 deprecation warning.
- Production startup validation now rejects missing or development-default `DATABASE_URL`, `JWT_SECRET`, `SCORING_CODE`, and wildcard `CORS_ORIGIN` when `NODE_ENV=production`.
- Runtime CORS now accepts a comma-separated `CORS_ORIGIN` list while production validation rejects wildcard origins, including wildcard entries inside a list.
- `npm run prisma:deploy` applied the initial migration against local PostgreSQL at `127.0.0.1:55432/movement`.
- `npm run seed` completed and created 25 team accounts (`Team 01` through `Team 25`, usernames/passwords `team01/team01` through `team25/team25`), 25 unique team QR login tokens, 10 stations, and 20 unique station QR tokens.
- Team login smoke test passed for `team01/team01`, QR login token `MV26-TEAM-01-LOGIN`, and `GET /api/auth/me` returned a `TEAM` session for `team01`.
- QR uniqueness DB check passed after seed: 25/25 team QR fingerprints are non-null and unique; 20/20 station QR fingerprints are non-null and unique.
- QR login replacement smoke passed on temporary API port `3002`: first `MV26-TEAM-01-LOGIN` session was rejected with HTTP 401 after the second QR login for the same team.
- Station QR smoke passed on temporary API port `3002`: `team25` logged in with `MV26-TEAM-25-LOGIN`, checked in to `ST002` with `MV26-STATION-ST002-CHECK_IN`, and checked out with `MV26-STATION-ST002-CHECK_OUT`.
- Station tracking mode requirement added: DB stores `SCORE`, `TIME`, or `BOTH`; `SCORE` stations keep check-in and check-out timestamps equal so no play duration is accumulated, while `TIME` stations auto-complete at check-out with score 0 and accumulated duration.
- Station tracking mode smoke passed on temporary API port `3002`: admin patched `ST002` to `SCORE`, `team24` checked in/out with station QR tokens, and backend returned equal `checkedInAt`/`checkedOutAt`; `ST002` was patched back to `BOTH` afterward.
- Time-only station smoke passed on temporary API port `3002`: admin patched `ST047` to `TIME`, `team23` checked in/out with station QR tokens, backend auto-completed the progress with score 0 and real start/end timestamps, then `ST047` was patched back to `BOTH`.
- Two-team API smoke script added at `be/scripts/smoke-two-team.ps1`; run it against a freshly seeded or disposable rehearsal database because it mutates station progress and scores.
- Report export helper added at `be/scripts/export-summary-report.ps1`; README now documents export verification plus PostgreSQL backup/restore rehearsal commands.
- Two-team API smoke test passed against the local API after opening the rehearsal event window to `23:59`: `team01` completed `ST002` for 25 points and `team02` completed `ST047` for 30 points.
- Report export passed against the local API and produced a non-empty `.xlsx` workbook.
- Database recovery rehearsal passed: `pg_dump` created a custom-format backup, `pg_restore` restored it into `movement_restore_codex_20260719`, a temporary API on port `3001` returned admin dashboard data, and report export from the restored database produced a non-empty workbook.
- Frontend lint now passes cleanly after fixing `StationMap.tsx` hook dependencies and the `StationsMapPanel.tsx` effect-state lint violation.
- Frontend production build passes; Vite still reports a non-blocking large chunk warning for the bundled app.
- Player startup bootstrap was consolidated on 2026-07-19: team, station, and progress APIs load in parallel through one shared mapper; authenticated player routes wait for backend data instead of rendering the local seed; login no longer races the persisted-session redirect; and the large map image begins preloading immediately after team authentication. Frontend lint and production build both pass after the change.
- Player bootstrap regression fixed on 2026-07-20: `normalizeSqlTeams()` now distinguishes normalized frontend `Team` objects (`id`/`name`) from raw SQL team rows (`team_id`/`team_name`) before calling SQL-only normalization. This removes the post-login `Cannot read properties of undefined (reading 'trim')` error. Frontend lint and production build pass.
- Station list check-in flow was corrected on 2026-07-20: the former simulated success action now uses the shared camera/manual QR input, submits the decoded token to the backend check-in endpoint, refreshes player data, and navigates only after backend acceptance. Frontend lint and production build pass.
- Initial station availability was corrected on 2026-07-20: seed now creates every active team/station progress as `AVAILABLE` instead of opening only the first two stations. Existing `LOCKED` progress rows in the local rehearsal API were force-opened through the audited admin status endpoint; the one-active-station and event-time guards remain authoritative.
- Frontend completed-state copy was standardized on 2026-07-20: the player/admin UI now displays `Finished` consistently while the backend/API status remains `COMPLETED`.

## Backend work still required

### P0 remaining work

- [x] Automated coverage exists for auth, QR check-in/check-out, score confirmation rejection/acceptance, Final rank award, same-team idempotency, and Final transaction retry behavior.

### P1 event-readiness checks

- [x] Validate migration and seed against a clean database.
- [x] Run an end-to-end smoke test using two simultaneous team sessions.
- [x] Add `prisma migrate deploy` to the deployment path.
- [ ] Validate production CORS and secrets in the deployed environment.
- [x] Rehearse report export and database recovery.

## Maintenance findings

- `npm audit fix` upgraded `@nestjs/platform-express` to `11.1.28` and `multer` to `2.2.0`; `npm audit --audit-level=high` now reports 0 vulnerabilities.
- Prisma 7 readiness item complete: seed config now lives in `be/prisma.config.ts`, and `be/package.json` no longer uses deprecated `package.json#prisma`.
- The `ts-jest` configuration was migrated from deprecated `globals` to `transform`.

## 2026-07-20 Backend production CI/CD

- Re-enabled [`.github/workflows/be-deploy.yml`](../../.github/workflows/be-deploy.yml): push/merge to `master` on `be/**` (or the workflow file) deploys via SSH to Huawei ECS; `workflow_dispatch` supported for manual runs.
- Workflow sets `DEPLOY_BRANCH=master` and calls `be/deploy/deploy.sh` (`npm ci --include=dev` so Nest CLI is available for build).
- Host path: `/opt/movement/app` → refresh `master` → require `be/.env` → build → `prisma migrate deploy` → PM2 (`movement-api`).

## 2026-07-20 BE host bootstrap (production ECS host)

- One-time host setup completed on Ubuntu 22.04 as `root` (PEM `backend_test_poc.pem`).
- Runtime present: Node 20.20.2, npm 10.8.2, pm2 7.0.3, git 2.34.1; `pm2-root` systemd enabled.
- Git checkout repaired: clean `master` clone at `/opt/movement/app` (previous empty `.git` tree moved aside). Host git uses HTTPS credentials (`url.insteadOf` + `/root/.git-credentials`) because the GitHub token lacked deploy-key/admin scopes.
- Production `be/.env` restored and completed: `PORT=8080`, `SCORING_CODE` set (non-`2468`), `CORS_ORIGIN` set to the frontend HTTPS origin. Existing `DATABASE_URL`/`JWT_SECRET` preserved. Postgres role `movement` granted LOGIN and password synced to `.env`.
- Legacy Python API `movement-be.service` (uvicorn on `:8080`) stopped/disabled so Nest can bind the FE-facing port.
- Manual deploy smoke: migrations applied, `pm2` process `movement-api` online, backend `/api/docs` returned **200** on the ECS host.
- GitHub secrets `ECS_HOST` / `ECS_USER` / `ECS_SSH_KEY` refreshed to this host + PEM. `*.pem` added to `.gitignore`.
- Remaining: merge latest workflow + `deploy.sh` fix to `master`, run Actions `workflow_dispatch`, then confirm browser CORS login from the OBS FE origin. Note `SCORING_CODE` lives only on the host `.env` (not in git).

## Next recommended task

Run Actions **Deploy Backend (ECS)** after merging the workflow/`deploy.sh` changes, then validate login/CORS from the frontend HTTPS origin through same-origin `/api`.

## 2026-07-20 Admin integration verification

- Admin bootstrap now reads `/api/admin/progress-matrix`; the local JSON seed is no longer the source of truth for the Admin role.
- Team create/update/delete are backed by audited Admin endpoints. Creation initializes AVAILABLE progress for every active station and generates a team login QR credential; deletion removes related sessions, progress, scores and final submissions transactionally.
- Station quick status/score updates now use the existing audited progress status and score endpoints. `COMPLETED` remains score-driven and cannot be forced directly.
- Backend build, frontend build and frontend lint passed.
- Runtime smoke test passed against the rehearsal database: Admin login, 25-team/10-station progress matrix, team create (10 progress rows initialized), update, and transactional delete.

## 2026-07-20 Tester one-command runner

- Added root `npm.cmd run tester` / `npm.cmd run tester:no-seed` commands through `scripts/tester-run.ps1`.
- The runner prepares local env, installs missing dependencies, runs Prisma generate/deploy, optionally seeds the local database, builds backend/frontend, then starts the API on `http://localhost:3000` and frontend preview on `http://localhost:4173`.
- The runner refuses to migrate/seed non-local database URLs unless explicitly run with `-AllowRemoteDatabase`.
- Verification passed: PowerShell syntax check, root npm script listing, backend build, and frontend build. Frontend build still reports the known non-blocking Vite large chunk warning.
- Graphify update was attempted after the code/doc change but could not run because `graphify` is not installed, the Windows Python alias is unusable, and `graphifyy` is not present in the local `uv` cache. Installing `graphifyy` from PyPI requires explicit user approval for the external package fetch.

## 2026-07-20 Tester Docker compose runner

- Added `docker-compose.tester.yml` so testers can run PostgreSQL, backend API, and frontend preview with Docker Desktop.
- The compose runner uses a dedicated PostgreSQL volume, applies Prisma migrations, seeds test data, builds backend/frontend, and exposes frontend on `http://localhost:4173` and API docs on `http://localhost:3000/api/docs`.
- Added root `npm.cmd run tester:docker` as a convenience wrapper around `docker compose -f docker-compose.tester.yml up --build`.
- Verification note: root npm script listing passed. Docker compose config/runtime verification could not be run on this machine because Docker CLI is not installed.

## 2026-07-20 Agent and Markdown docs refresh

- Standardized `AGENTS.md` into a clearer agent contract: `AGENTS.md` first, relevant project docs second, Graphify only when useful, source files last, and small scoped edits.
- Clarified that Graphify is advisory and must not override direct user instructions, privacy rules, `AGENTS.md`, or architecture docs.
- Replaced the frontend template README with MOVEment-specific frontend run/build/verification notes.
- Updated the backlog execution checklist so Graphify update follows `AGENTS.md` and runs when useful/available rather than being treated as an unconditional first step.
- Compared Markdown docs against backend controllers, frontend routes, frontend API client, and Prisma schema. Updated `be/README.md` API route list and `fe/README.md` frontend route list to match source.
- Verification: reviewed Markdown diffs; no source code changed. `graphify update .` completed and regenerated `graphify-out/` artifacts, with warnings that `hooks.json` produced zero nodes and SQL extraction needs `tree_sitter_sql`.

## 2026-07-24 Leaderboard podium palette

- Refined the Leaderboard podium styling without changing ranking or scoring behavior.
- Rank 1 now uses a distinct bright gold/amber palette, rank 2 a cool silver palette, and rank 3 a darker brown/copper palette across the row, rank badge, side accent, and points badge.
- Frontend lint and production build passed. The existing non-blocking Vite large-chunk warning remains.

## 2026-07-24 Compact shared headers

- Added the visible `Team` label beside the icon on `/teams`, including mobile layouts.
- Reduced the shared shell branding and the Teams, Leaderboard, Operation Center, and Final page headers by one visual step.
- Frontend lint and production build passed. The existing non-blocking Vite large-chunk warning remains.

## 2026-07-24 Remove Station Cipher game type

- Station Game Type now supports only `ST` and `STANDARD`; the Admin combobox labels are `ST` and `Standard`.
- Removed the Station cipher-answer button, frontend API call, backend route/DTO/service logic, and the `games.answer_hash` column. Final Challenge remains unchanged.
- Added and applied migration `20260724190000_remove_station_cipher_game_type`; Legacy `CIPHER` Games become `STANDARD`, and the database constraint rejects values outside `ST`/`STANDARD`.
- Tester database verification passed with `4 ST`, `6 STANDARD`, no `games.answer_hash` column, two consecutive seed runs, and `db:verify`.
- Backend build and all 120 tests passed. Frontend lint and production build passed; the known non-blocking Vite large-chunk warning remains.

## 2026-07-24 Compact Team Station list

- Redesigned the mobile `/teams/:teamId/stations` presentation without changing Station behavior.
- Converted the shell header and Team summary to compact horizontal layouts, hid secondary deploy/current-team copy on narrow screens, and reduced Station card padding, icons, metrics, and actions.
- Added scoped Team-color accents to the Team summary and Station cards.
- Frontend lint and production build passed; localhost route smoke returned `200`. The known non-blocking Vite large-chunk warning remains.
- Follow-up refinement aligns the Team icon and name in one centered identity row and places Score/Finished in an equal-width glass metric bar below for better visual balance.
- Responsive follow-up removes the mobile header spacer, constrains the brand with fluid sizing/ellipsis, and gives both Team metrics identical icon/content grids with left-aligned copy.
- Player `Play` remains the white right-side action on `/stations`; Admin `View & Edit` styling is unchanged.
- Station cards consistently render `Watch Video | Play` on desktop and mobile, with `Watch Video` disabled for non-`ST` Stations or missing URLs.
- Disabled Station video actions use an explicit neutral visual state so the shared primary-button styling cannot make unavailable video look interactive.
