# Backend Audit Status

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

## Next recommended task

Validate production CORS and secrets in the deployed environment. This cannot be marked complete from the local workspace without the real deploy target, production frontend origin, and production secret values.
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
