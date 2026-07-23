# MOVEment 2026

MOVEment 2026 is a station-based event game system.

- `fe/`: React + TypeScript + Vite frontend.
- `be/`: NestJS + Prisma + PostgreSQL backend API.
- `docs/analysis/`: accepted product scope, backlog, decisions, and audit notes.
- `docs/prompts/`: analysis workflow prompts and checklists.

## Roles And Login

- `ADMIN`: manages event operations, teams, stations, scores, reopen/status overrides, config, logs, and report export.
- `TEAM`: logs in with username/password or a team QR token. Each team can have only one active device session.
- There is no Staff or Station Manager account. After team check-out, staff enters the score on the team device and confirms with the scoring code.

See backend details in [be/README.md](be/README.md).

## Tester One-Command Run

From the repo root, testers can build everything and start the local test app for interactive local testing:

```powershell
npm.cmd run tester
```

The command installs missing dependencies, prepares Prisma, applies migrations,
seeds the local database, builds backend and frontend, verifies health, then keeps these services running until `Ctrl+C`:

- Frontend: `http://localhost:4173`
- API docs: `http://localhost:3000/api/docs`

Use one-shot smoke verification when the app should stop after health checks:

```powershell
npm.cmd run tester:smoke
```

Seed accounts:

- Admin: `admin` / `admin123`
- Team: `team01` / `team01` through `team25` / `team25`

Use this variant when the database already has test data and should not be
reseeded:

```powershell
npm.cmd run tester:no-seed
```

The script refuses to migrate/seed a non-local database by default. Only use
`-AllowRemoteDatabase` for a disposable test database.

## Tester Docker Run

If the tester has Docker Desktop, they can run the whole app with PostgreSQL in
Docker:

```powershell
docker compose -f docker-compose.tester.yml up --build
```

This starts:

- PostgreSQL container, exposed on host port `55432`
- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:4173`

The Docker frontend uses same-origin browser requests such as
`/api/auth/team-login`. Vite preview proxies those requests inside Docker to
`http://api:3000` via the server-side `API_PROXY_TARGET` environment variable.
That Docker service URL is not exposed in the browser bundle.

The first run installs dependencies inside Docker volumes, applies migrations,
seeds local test data, and builds both apps. Keep the terminal open while
testing. Press `Ctrl+C` to stop the app.

Useful Docker smoke checks:

```powershell
docker compose -f docker-compose.tester.yml exec frontend node -e "fetch('http://api:3000/api/docs').then(r => console.log(r.status))"
curl.exe -i http://localhost:3000/api/docs
curl.exe -i -X POST http://localhost:4173/api/auth/team-login -H "Content-Type: application/json" -d "{\"username\":\"team01\",\"password\":\"team01\",\"deviceLabel\":\"curl\"}"
```

To remove the tester database and start fresh:

```powershell
docker compose -f docker-compose.tester.yml down -v
```
