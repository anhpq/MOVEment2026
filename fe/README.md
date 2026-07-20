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

The frontend expects the backend API at:

```text
http://localhost:3000
```

Override it with:

```powershell
$env:VITE_API_BASE_URL="http://localhost:3000"
npm run dev
```

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
