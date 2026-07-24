# MOVEment 2026 - Implementation Backlog

## 2026-07-24 Team Color palette and gradient buttons

- [x] Seed-managed Team 01-25 use 25 stable unique uppercase HEX colors without palette rotation.
- [x] Production seed repairs only `color` for existing `team01`...`team25` and silently skips missing fixtures without password, QR credential, progress, or other fixture updates.
- [x] Enabled primary buttons use Team gradients with white `#FFFFFF` text/icons in Team-context pages, footer, Modal, Drawer, and confirm overlays.
- [x] Disabled, danger, default, QR info modal, status, marker, and non-button semantics remain outside the gradient override.
- [x] Station list/detail primary actions from the latest pull remain covered by the shared selector; the disabled `Watch Video` action keeps its disabled style.
- [x] Team Editor valid create/edit preview and body theme owner cleanup are implemented; saved null color retains `#FF765C` Team-context fallback.
- [x] Targeted seed policy tests (`7/7`), Backend lint/build, Frontend lint/build, two consecutive local seed runs, `db:verify`, and Graphify update passed after the latest pull; diff hygiene is reviewed before commit.
- [ ] Manual browser review across Team 01/25, overlays, disabled states, route cleanup, and representative contrast colors remains pending.
- [ ] Production deployment/runtime verification remains pending and requires explicit approval.

## 2026-07-24 Team Results Excel export and Team Color UI

- [x] Added ExcelJS backend dependency and Team Results workbook generation.
- [x] Added shared Team Results comparator reused by Leaderboard and Excel export.
- [x] Leaderboard ranks all non-deleted Teams using the confirmed five-step comparator.
- [x] New Team Results export includes one worksheet, one row per non-deleted Team, active Station column groups, `Captain Name`, `Username`, `Total Play Time`, `Total Score`, `Computed Score`, Rank, and correct Final fields.
- [x] New export excludes `Team Color`, `Team Status`, `Total Stations`, `Final Challenge Status`, per-Station `Status`, per-Station `Duration`, QR/password/token fields, and Final answer text.
- [x] Admin Operations export button downloads `/api/admin/reports/team-results.xlsx` and preserves backend filename from `Content-Disposition` with fallback.
- [x] Backend CORS exposes `Content-Disposition`.
- [x] `teamColor` is canonical API field with compatibility `color` alias.
- [x] Admin create/update validates `#RRGGBB` or `null`, normalizes lowercase HEX, clears on `null`, leaves missing field unchanged, and rejects conflicting aliases.
- [x] Team-facing UI, Admin Team list cards, Admin Team editor, and Admin single-Team Station contexts use scoped Team Color vars with fallback `#FF765C`.
- [x] Admin map routes and `StationsMapPanel` Admin action behavior were left unchanged.
- [x] Targeted backend tests, full backend tests, backend lint/build, and frontend lint/build passed.
- [ ] Manual Excel/Google Sheets open verification remains pending.
- [ ] Manual Team Color browser review across light/dark colors, mobile/desktop, and route transitions remains pending.
- [ ] Production deployment/runtime verification remains pending and requires explicit approval.
- [x] Graphify update ran successfully; warnings remain for `hooks.json` zero nodes and missing optional `tree_sitter_sql` SQL extraction.

## 2026-07-24 Compact Admin headers and Team identity cleanup

- [x] Teams, Leaderboard, and Operations Center headers use compact spacing, icons, and titles.
- [x] Redundant Teams and Leaderboard header descriptions were removed.
- [x] Admin global header and Team list no longer imply that Admin belongs to a Team.
- [x] Player current-Team identity remains unchanged.
- [x] Frontend lint and production build passed.
- [ ] Manual responsive browser review remains pending.

## 2026-07-24 Role-aware Leaderboard current-Team marker

- [x] Admin Leaderboard does not show `Your team` or current-Team highlighting.
- [x] Player Leaderboard continues to identify the authenticated Team.
- [x] Frontend lint and production build passed.

## 2026-07-24 Admin Team-first Station navigation

- [x] Admin footer no longer exposes a standalone Stations menu.
- [x] Admin login opens Teams, and selecting a Team opens that Team's Station/progress list.
- [x] Team context remains in Admin Station list/detail routes and after Admin score/status actions.
- [x] Player Station menu and routes remain available only to Players.
- [x] Frontend lint and production build passed.
- [ ] Manual Admin browser click-through remains pending.

## 2026-07-24 Designated ST Station set

- [x] `ST003`, `ST004`, `ST010`, and `ST047` are the designated `ST` Stations.
- [x] `ST002`, `ST005`, `ST006`, `ST017`, `ST029`, and `ST15A` are `STANDARD`.
- [x] Follow-up migration and seed definitions use the same explicit mapping.
- [x] Latest tester migration, two consecutive seed runs, and `db:verify` passed with `4 ST` and `6 STANDARD`.
- [x] All `113` Backend tests and Backend/Frontend builds passed.
- [ ] Production migration remains pending and requires explicit deployment approval.

## 2026-07-24 Station Game Type constraint and video visibility

- [x] Station Game Type is restricted to `ST` and `STANDARD` in Admin UI, Backend validation, and database constraint.
- [x] Legacy `CIPHER` Station data is migrated to `STANDARD`; Station cipher-answer UI, endpoint, DTO, service logic, and storage are removed.
- [x] Only `ST` with a valid HTTPS YouTube URL enables `Watch Video`; the Team/User Station list shows the action disabled for all other Stations, while Admin Station lists omit it.
- [x] Historical tester results containing `CIPHER` are superseded by the two-type Station Game Type rule.
- [x] All `113` Backend tests, Backend/Frontend lint and build, and local route health checks passed.
- [ ] Production migration and deployed browser verification remain pending and require explicit deployment approval.

## 2026-07-24 Admin Station game configuration edit

- [x] Existing Stations allow Admin to edit `gameType` and integer `maxPoints`.
- [x] Backend updates the active Game and synchronizes Team maximum totals transactionally.
- [x] Targeted Admin service tests (`25/25`) and Backend/Frontend production builds passed.

## 2026-07-24 Admin Operations UI merge recovery

- [x] Restored the local responsive Admin Operations UI after the merge selected the minimal remote component.
- [x] Integrated remote `finalStartsAt` Event Config behavior and current/new Final keyword handling.
- [x] Preserved structured dashboard, score queue, submissions, logs, refresh, error feedback, and Excel export.

## 2026-07-24 Admin score-only correction

- [x] Admin Station Detail always calls the score-correction endpoint and no longer falls into `Progress is not waiting for score` based on Frontend status.
- [x] Non-empty Admin correction reason is required by Frontend and Backend.
- [x] Admin correction is enabled only for `COMPLETED` progress and rejected otherwise by both UI and Backend.
- [x] Admin correction preserves progress status and all timestamps while updating score, Team total delta, and audit records.
- [x] All 109 Backend tests, including Player score regression coverage, Backend/Frontend lint and build, diff check, Graphify update, and local tester runtime verification passed.

## 2026-07-24 Scoring confirmation code removal

- [x] Updated the confirmed Business Rule so Team score submission after Check-out does not require a confirmation code.
- [x] Removed the confirmation-code field and verification from Backend and Frontend score submission.
- [x] Removed `SCORING_CODE` and its bcrypt hash from runtime configuration, environment validation, seed, and current smoke/deployment scripts.
- [x] Added a forward-only migration to drop `event_config.scoring_code_hash`.
- [x] Verified Prisma schema/client, all 107 Backend tests, Backend/Frontend lint and build, active-source reference scan, diff check, and Graphify update.
- [x] Recreated the local tester containers, applied all migrations, ran seed, confirmed the API is healthy, and confirmed the live OpenAPI document has no legacy scoring-code DTO or field.
- [ ] Apply and verify the migration in Production during an explicitly approved deployment.
## 2026-07-24 Tester runner Prisma Studio

- [x] `npm run tester` starts Prisma Studio together with Backend API and Frontend preview.
- [x] Added configurable `-PrismaStudioPort` with default `5555`.
- [x] Runner checks Prisma Studio port availability, probes readiness, prints the Studio URL, logs to `.tester-logs/prisma-studio.log`, and stops the Studio job during cleanup.
- [x] Verified with `npm run tester:smoke -- -SkipInstall -SkipSeed -ApiPort 3100 -FrontendPort 4273 -PrismaStudioPort 5655`.
- [x] Backend lint/build, frontend lint/build, and `git diff --check` passed.
- [ ] Manual long-running `npm run tester` keep-open usage remains pending.

## 2026-07-24 Final start and Event end separation

- [x] Final Challenge opening is verified against Admin Event Config `finalStartsAt`, not `eventEndTime`.
- [x] Admin Event Config UI exposes `finalStartsAt` beside `eventEndTime`.
- [x] `eventEndTime` remains the Station close time for new check-ins.
- [x] Station Check-out and scoring remain allowed for Stations already started before `eventEndTime`.
- [x] Player Station list/map click on a locked Station now reports that the Station is closed instead of opening check-in.
- [x] Targeted backend Final/Player service tests, backend lint/build, frontend lint/build, and `git diff --check` passed.
- [ ] Production deployment/runtime verification remains open and requires explicit approval.
- [ ] Manual browser click-through after the deployed Event Config times remains pending.

## 2026-07-23 iOS QR camera lifecycle cleanup

- [x] Login QR scanner cleanup invalidates the run, clears RAF/timer resources, stops active media tracks, clears and reloads the video element, and disposes detector resources.
- [x] Shared Station QR scanner cleanup invalidates the run, clears RAF resources, stops active media tracks, clears and reloads the video element, and disposes detector resources.
- [x] Pending `loadedmetadata` listeners are cancelled on stop/unmount so scanner event listeners do not survive UI close.
- [x] Pending start paths guard against late streams, duplicate decode callbacks, and false errors after user stop.
- [x] Manual QR input, Team QR parsing, Station QR validation flow, native `BarcodeDetector`, and `jsQR` fallback are preserved.
- [x] Frontend lint, frontend build, and frontend build:prod passed.
- [ ] Manual HTTPS test on real iPhone Safari remains pending.
- [ ] Manual HTTPS test on real Chrome iOS remains pending.
- [ ] Confirm physical iOS camera indicator turns off after repeated open/stop cycles on device.

## 2026-07-23 Seed diagnostics and tester runner completion

- [x] Added seed phase logs for database connection, stations, challenges, teams, Final event, completion, and Prisma disconnect.
- [x] Verified standalone seed twice against local PostgreSQL without duplicate seed data or process hang.
- [x] Confirmed Final Challenge canonical keyword remains plaintext `DISANVANHOA2026` in the compatibility `answerHash` field.
- [x] Fixed tester dependency detection so incomplete frontend installs missing `jsqr` trigger `npm ci`.
- [x] Updated tester readiness checks to use IPv4 loopback URLs and report the last readiness error.
- [x] Made `npm run tester` complete as a smoke runner with exit code `0`; use `npm run tester:serve` for keep-open manual testing.
- [ ] The frontend large-chunk warning remains non-blocking and can be addressed in a separate performance/code-splitting task.

## 2026-07-23 Final Challenge plain answer and Production seed override

- [x] Final Challenge no longer hashes the canonical keyword before storing it in `answerHash`.
- [x] Final Challenge validation no longer hashes submitted answers and instead compares normalized submitted text to normalized stored text.
- [x] Public APIs and activity logs continue to avoid exposing the configured Final answer.
- [x] Production seed overwrites only seed-managed Final Challenge fields through `2026-08-21 23:59:59 Asia/Ho_Chi_Minh`.
- [x] Production seed preserves existing Final Challenge records starting `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`, while still creating the record if missing.
- [x] Seed policy tests cover production before cutoff, on August 21, after cutoff, non-production, repeated planning, missing record creation, and update field scope.
- [ ] Production deployment/runtime verification remains open and requires explicit approval.
- [ ] Plain-text Final answer storage increases database-read exposure risk and should be reviewed after the event/cutoff window.

## 2026-07-22 Conditional backend database deployment completion

- [x] Backend Production workflow supports independent manual deployment inputs for `base_commit`, `target_commit`, and `force_database_steps`.
- [x] Backend deploy resolves the complete deployed commit range from explicit input or protected server marker instead of assuming `HEAD~1`.
- [x] Application-only backend changes skip `prisma migrate deploy`, Production seed, and database-specific verification while preserving install, build, restart, and health checks.
- [x] Schema or migration changes run Prisma Client generation, `prisma migrate deploy`, and `db:verify`.
- [x] Seed-only changes run Production-safe seed and `db:verify` without running `prisma migrate deploy`.
- [x] Combined migration/schema and seed changes run migration before seed and then `db:verify`.
- [x] `force_database_steps=true` runs migration, seed, and `db:verify` regardless of detected changes.
- [x] Deployment marker updates only after required database steps, build, restart, post-restart verification when required, and backend health pass.
- [ ] Actual Production deployment remains open and requires explicit approval.
- [ ] First conditional Production deploy must provide `base_commit` if `/opt/movement/deploy-markers/movement-api.commit` is not already present.

## 2026-07-22 Staged Production deployment workflow completion

- [x] Production backend deployment is manual-only through `workflow_dispatch`, with explicit backup confirmation and backend deploy confirmation inputs.
- [x] Production frontend deployment is manual-only through a separate Nginx workflow, with explicit frontend deploy confirmation input.
- [x] Automatic `push` triggers were removed from both Production deployment workflows, so merging or fast-forwarding `develop` into `master` cannot start backend and frontend deploy phases in parallel.
- [x] Backend Phase 1 preserves the existing fail-fast deploy script: migrations, Production-safe seed, `db:verify`, and build must pass before the backend restart; post-restart `db:verify` and backend health check remain required.
- [x] Frontend Phase 2 builds with `VITE_API_BASE_URL` unset for same-origin `/api`, syncs assets to the Nginx document root, validates Nginx config, reloads Nginx, and checks HTTPS, `/api`, SPA fallback, `/qr-login`, and missing asset behavior.
- [ ] Actual Production backend deployment remains open and requires explicit approval.
- [ ] Actual Production frontend deployment remains open and requires explicit approval after backend verification.

## 2026-07-22 Production-like integration verification completion

- [x] Audited current local tester, Docker Compose, Vite preview proxy, production Nginx config, CORS config, environment guards, migration/seed path, and existing smoke coverage.
- [x] Added `scripts/production-like-smoke.ps1` as a disposable HTTPS same-origin integration harness for a clean database, production-mode backend startup, and local HTTPS reverse proxy.
- [x] The smoke applies clean migrations through `000008`, runs seed twice, runs `db:verify`, starts the backend with `NODE_ENV=production`, serves the frontend build over HTTPS, proxies same-origin `/api`, verifies `/qr-login` direct navigation and refresh, and checks CORS allow/deny behavior.
- [x] The live smoke verifies reusable Team QR login, one-active-session replacement, revoked/rotated Team QR behavior, SQ1 Station Check-in/Check-out, wrong-purpose and revoked Station token failures, independent Station QR rotation, `SCORE`/`TIME`/`BOTH`, Final Event Config opening, cooldown, rank bonuses, leaderboard totals, and tracked/log secret scans.
- [x] Backend full Jest suite, backend lint/build, frontend lint/build, Prisma Client generation, Docker Compose config render, production-like smoke, production environment guard spec, static tracked-file secret search, production-like log secret scan, and `git diff --check` passed.
- [x] Docker daemon remained unavailable on this host, so the smoke used its local PostgreSQL disposable-database fallback and dropped the temporary database during cleanup.
- [ ] Actual Production deployment/runtime verification remains open and was not performed.

## 2026-07-22 Final Challenge completion

- [x] Historical 2026-07-22 verification used Admin Event Config `eventEndTime` for Final opening; this was superseded on 2026-07-24 by `finalStartsAt` as the Final opening rule.
- [x] Active Source Code no longer uses fixed `11:30` or `11:45`; remaining matches are historical documentation warnings or the original baseline migration.
- [x] Local/test seed creates or repairs the active Final keyword hash for `DISANVANHOA2026` and remains idempotent when run repeatedly.
- [x] Backend and frontend trim and uppercase answer input; backend remains the authoritative validator and frontend source does not contain the official answer.
- [x] Wrong-answer cooldown is backend-enforced inside the serializable submission transaction and increases from 1 second to maximum 10 seconds.
- [x] Final eligibility is verified for configured Event end, active Station blocking, no all-Station completion requirement, and existing Station lifecycle regression.
- [x] Final ranking and bonus are verified for rank 1, rank 2, rank 10, rank 11, duplicate correct submission, retry, and unique-rank concurrency protection.
- [x] Leaderboard integration remains through `team.totalPoints`, so Final bonus is included once when awarded.
- [ ] Production migration and production-like Final smoke remain open.
- [ ] Manual browser double-click/multiple-tab UX verification remains open.

## 2026-07-22 Station tracking and scoring completion

- [x] Re-verified `SCORE`, `TIME`, and `BOTH` behavior after SQ1 Station QR migration.
- [x] `TIME` records real duration, auto-completes with score `0`, and does not require Team score submission.
- [x] `SCORE` contributes no play duration and requires Team-device score submission after Check-out.
- [x] `BOTH` records real duration and requires Team-device score submission after Check-out.
- [x] Station max score now defaults to `30` at database and Admin creation service layers.
- [x] Backend service validation rejects non-integer, negative, and above-max scores for Team and Admin score paths.
- [x] Duplicate/stale/concurrent Team score submission is covered by tests and the transaction claim.
- [x] Frontend score input uses Station max score as UX validation only; backend remains authoritative.
- [x] Admin score correction remains a separate audited flow.
- [ ] Production migration and production-like Station scoring smoke remain open.

## 2026-07-22 Secure Station QR completion

- [x] Station QR now uses official SQ1 opaque token format for new creation, Admin rotation, and local/test seed repair.
- [x] Station creation provisions one `CHECK_IN` and one `CHECK_OUT` token atomically with Station/Game/progress creation.
- [x] Player Check-in/Check-out resolves Station and purpose from the database token record after fingerprint/hash/lifecycle validation.
- [x] Admin can inspect, rotate, and revoke Station `CHECK_IN` and `CHECK_OUT` independently.
- [x] Local/test seed repairs missing or Legacy Station QR tokens by purpose and preserves existing active SQ1 tokens across repeated runs.
- [x] Reprint strategy stores raw Station QR tokens in the protected backend database for new, repaired, replaced, or rotated SQ1 tokens so Admin can view and print Check-in/Check-out QR string values; tracked files still must not contain raw tokens.
- [x] Legacy predictable Station QR generation is removed from new creation, seed repair, and smoke script paths; active Legacy DB rows remain compatibility-only.
- [ ] Production migration, production QR reissue, and physical QR scan verification remain open.
- [ ] Legacy Station QR compatibility window and removal date remain open.

## 2026-07-22 Automatic URL Team QR completion

- [x] Reusable controlled Team QR login, usage auditing, and one-active-session replacement are implemented and locally verified.
- [x] Team creation provisioning, idempotent local/test seed repair, and distinct Admin generate/rotate/revoke actions are implemented.
- [x] New Team and seed data no longer generate predictable Legacy Team QR credentials; existing Legacy credentials and endpoint remain for compatibility.
- [x] Reprint strategy stores raw Team QR Login tokens in the protected backend database for new, repaired, replaced, or rotated tokens so Admin can view and print QR Login string/URL values; tracked files still must not contain raw tokens.
- [ ] Production migration and deployed QR flow verification remain open.
- [ ] Station QR migration remains out of scope and open.

## Rules

- `[x]` means implementation and required verification are complete.
- `[ ]` means incomplete, not verified, or blocked.
- Documentation-only reconciliation does not complete Source Code work.
- Historical audit evidence remains in `BACKEND_AUDIT.md`.
- Use the smallest relevant Feature Prompt.

## P0 — QR Security and Provisioning

- [x] Migrate Automatic URL Team QR Login from one-time consumption to reusable controlled token behavior.
- [x] Ensure successful QR login does not consume the active Team token.
- [x] Preserve one-active-session-per-Team behavior for password and QR login.
- [x] Automatically provision a secure Team QR token in every Team creation path.
- [x] Add idempotent missing-Team-token repair.
- [x] Ensure Admin can generate, rotate, revoke, and inspect Team QR token status.
- [x] Select and document raw-token reprint strategy: display once and rotate to reprint.
- [x] Remove predictable Team QR generation for new data while retaining existing Legacy credentials for compatibility.
- [x] Migrate Station QR to `MV26-SQ1-I/O-<randomToken>`.
- [x] Automatically provision one Check-in and one Check-out token when creating a Station.
- [x] Roll back Station creation when the complete QR pair cannot be created.
- [x] Support independent Station Check-in and Check-out rotation/revocation.
- [x] Update database constraints and indexes for token uniqueness and active-token invariants.
- [x] Update seed, fixtures, and smoke scripts that hard-code Legacy QR payloads.
- [ ] Define and verify Legacy compatibility removal conditions.

Acceptance:

- Team token is random, opaque, reusable while valid, revocable, and rotatable.
- Station token does not expose Station ID/code.
- Database token record determines Station and purpose.
- Repeated seed does not rotate valid tokens or create duplicates.
- Production logs and tracked files contain no raw token.

## P0 — Authentication and Session

- [x] Admin username/password authentication exists.
- [x] Team username/password authentication exists.
- [x] New Team login replaces previous active Team session.
- [x] Verify session replacement after reusable Automatic URL QR migration.
- [x] Verify inactive Team and revoked/expired QR behavior after migration.
- [x] Verify QR rate limiting on the active implementation.

## P0 — Station Flow and Scoring

- [x] One active Station per Team is implemented.
- [x] Active Stations initialize as `AVAILABLE`.
- [x] Cancel returns to `AVAILABLE` with cooldown.
- [x] Tracking modes `SCORE`, `TIME`, and `BOTH` exist in historical verified implementation.
- [x] `TIME` auto-completes with score 0 in historical verification.
- [x] `SCORE` and `BOTH` require score entry in historical verification.
- [x] Backend score limits and confirmation-code flow have historical verification.
- [x] Re-run Station flow verification after Station QR migration.
- [x] Verify new Station creation automatically provisions both secure QR tokens.
- [x] Verify duplicate score submissions after migration.
- [ ] Verify duplicate Check-out after migration in a production-like smoke environment.

## P0 — Final Challenge

- [x] Final keyword `DISANVANHOA2026` is created or repaired by local/test seed.
- [x] Uppercase normalization is implemented in backend validation and frontend input UX.
- [x] Final opens from Admin Event Config end time.
- [x] Top-10 bonus and concurrency/idempotency are covered by focused tests.
- [x] Re-run Final verification after documentation, QR, and Station scoring migration work.
- [x] Confirm no active code path still uses fixed `11:30` or `11:45`.
- [x] Confirm cooldown progression is backend-enforced from 1 to maximum 10 seconds.
- [ ] Production-like Final smoke remains open.

## P0 — Documentation and Prompt Consistency

- [x] Business Rule Source of Truth created.
- [x] Feature Index created.
- [x] Workflow converted to Feature-based routing.
- [x] `AGENTS.md` operational authority clarified.
- [x] Master Prompt converted to Multi-Feature Orchestrator.
- [x] iOS QR Camera analysis synchronized.
- [x] QR Login analysis synchronized.
- [x] QR payload analysis synchronized.
- [x] Team login data removed hard-coded raw QR tokens.
- [x] QR Login Prompt synchronized.
- [x] Final Prompt synchronized.
- [x] Station Scoring Prompt synchronized.
- [x] Implementation Sync Prompt synchronized.
- [x] Project Analysis Spec synchronized.
- [ ] Run repository-wide Markdown link/path review after applying the bundle.
- [ ] Inspect prompts `01`–`07` before using them; treat Legacy assumptions as historical input unless reconciled.

## P1 — iOS QR Camera

- [x] Camera capability uses `getUserMedia`.
- [x] Native `BarcodeDetector` preferred.
- [x] `jsQR` fallback added in historical implementation.
- [x] Scanner lifecycle and cleanup improved in historical implementation.
- [ ] Manual Production HTTPS test on iPhone Safari.
- [ ] Manual Production HTTPS test on Chrome iOS.
- [ ] Confirm repeated open/close does not leak camera tracks.
- [ ] Confirm one QR frame produces one API request.

## P1 — Production Readiness

- [x] Production config fail-fast behavior has historical verification.
- [x] Database backup/restore and report export have historical verification.
- [x] Split Production deploy into independent manual backend and frontend phases.
- [ ] Merge and run the latest backend deployment workflow on the intended branch.
- [ ] Verify login through frontend HTTPS same-origin `/api`.
- [ ] Verify active Production CORS configuration.
- [ ] Verify `/qr-login` direct navigation and refresh in Production.
- [ ] Verify Production seed does not generate or print raw QR secrets.
- [x] Verify migrated reusable Team QR behavior in Production or a production-like environment.
- [x] Verify secure Station QR pair generation in a production-like environment.
- [x] Run disposable production-like smoke with clean database, HTTPS same-origin `/api`, CORS allow/deny, `/qr-login` direct/refresh, Station scoring, Final, leaderboard, and secret/log scans.

## P2 — Legacy Removal

- [ ] Inventory Legacy Team QR endpoint and parser usage.
- [ ] Inventory Legacy Station QR parser and seed usage.
- [ ] Reissue printed Team QR codes.
- [ ] Reissue printed Station Check-in and Check-out QR codes.
- [ ] Update tester documentation and rehearsal instructions.
- [x] Disable Legacy Team token generation for new Team and seed data; Station Legacy generation remains open.
- [ ] Disable Legacy parser/endpoints after compatibility window.
- [ ] Remove obsolete migration fields only after safe deployment and rollback review.

## P2 — Leaderboard presentation

- [x] Differentiate gold, silver, and bronze podium colors across rank and points styling.
- [ ] Perform final visual review on representative desktop and mobile devices.

## P2 — Shared header presentation

- [x] Keep the Team page label visible beside its icon on mobile.
- [x] Reduce shared shell and primary page-header sizing consistently.
- [ ] Perform final visual review on representative desktop and mobile devices.

## P2 — Team Station list presentation

- [x] Compact the mobile shell header, Team summary, and Station cards.
- [x] Balance the Team identity and equal-width score/progress metrics.
- [x] Keep the shell brand responsive and align both Team metrics to identical content axes.
- [x] Keep Player `Play` as the white secondary Station action.
- [x] Keep `Watch Video | Play` in a stable two-column row and disable unavailable video actions.
- [x] Make disabled Station video actions visually distinct from enabled primary actions.
- [x] Hide Station video actions from Admin Team Station lists and expand `View & Edit` to the full action row.
- [x] Keep every Admin `View & Edit` action primary regardless of Station video metadata.
- [x] Redesign Station detail identity and metrics for clearer hierarchy and balanced mobile spacing.
- [x] Apply scoped Team-color accents without changing Station behavior.
- [ ] Perform final visual review on representative mobile devices.

## Next Execution Order

1. Run Production-like smoke tests.
2. Run `docs/prompts/08_IMPLEMENTATION_SYNC_PROMPT.md`.
3. Review diff, run `git diff --check`, and create scoped local commits.
4. Do not push or deploy without explicit user request.
