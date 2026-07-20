# MOVEment 2026 Frontend

React + TypeScript + Vite frontend for the MOVEment 2026 station game.

## What This App Does

- Team players log in, view the station map/list, scan QR tokens, check in/out, submit scores, view leaderboard, and access the Final Challenge.
- Admin users manage teams, stations, score/status overrides, event config, activity logs, reports, Final config, and submissions.
- Runtime data comes from the backend API. Legacy local dummy database fallbacks have been removed.

## Frontend Routes

- `/login`: admin/team login and team QR login.
- `/stations`: protected station list.
- `/stations/map`: team station map.
- `/stations/:stationId`: protected station detail/check-in/check-out/score flow.
- `/leaderboard`: protected leaderboard.
- `/final`: team Final Challenge.
- `/admin/operations`: admin dashboard, score queue, config, logs, reports, and Final operations.
- `/teams`: admin team list.
- `/system-config`: admin system config.
- `/system-config/stations/new`: admin create station.
- `/system-config/stations/:stationId`: admin edit station.
- `/system-config/teams/new`: admin create team.
- `/system-config/teams/:teamId`: admin edit team.

## Local Development

From `fe/`:

```powershell
npm install
npm run dev
```

By default the frontend calls the API with relative paths such as:

```text
/api/auth/team-login
```

Vite development proxies `/api` to the local backend at `http://localhost:3000`
through `vite.config.ts`. For local preview modes that do not use the Vite dev
proxy, set an explicit API origin:

```powershell
$env:VITE_API_BASE_URL="http://localhost:3000"
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## API Configuration

- Local dev: leave `VITE_API_BASE_URL` unset and run the Vite dev server; `/api`
  is proxied to the backend.
- Staging/production with reverse proxy: leave `VITE_API_BASE_URL` unset and
  configure HTTPS Nginx so `/api/*` proxies to the backend service.
- Static hosting without reverse proxy: set `VITE_API_BASE_URL` to an HTTPS API
  origin. Do not use a raw IP address or HTTP URL for deployed HTTPS builds.

See `deploy/nginx/movement.conf` for the recommended production same-origin
reverse-proxy configuration.

## Build And Preview

```powershell
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Tester-friendly root commands are documented in the repo root `README.md`:

- `npm.cmd run tester`
- `npm.cmd run tester:no-seed`
- `npm.cmd run tester:docker`

## Verification

Common frontend checks:

```powershell
npm run lint
npm run build
```

The production build may report a known non-blocking Vite large chunk warning.
