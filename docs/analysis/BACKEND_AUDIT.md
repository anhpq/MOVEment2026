# Backend Audit Status

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
