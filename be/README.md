# MOVEment 2026 Backend

NestJS + Prisma + PostgreSQL API for the event game flow.

## Setup

```bash
cd be
npm install
copy .env.example .env
npm run prisma:generate
npm run seed
npm run start:dev
```

Swagger UI is available after the API starts:

```text
http://localhost:3000/api/docs
```

Use the **Authorize** button with the JWT returned from
`POST /api/auth/login` or `POST /api/auth/team-login`.

Local development uses PostgreSQL at:

```text
postgresql://postgres:postgres@127.0.0.1:55432/movement
```

On this machine, port `5432` is already used by a local PostgreSQL process, so
the Docker dev database is exposed on `55432`.

If Prisma migrate fails because of the local schema-engine issue, bootstrap the
database with the checked-in SQL:

```bash
docker cp prisma/init.sql movement-postgres-dev:/tmp/init.sql
docker exec movement-postgres-dev psql -U postgres -d movement -f /tmp/init.sql
```

## Main APIs

- `POST /api/auth/team-login`
- `POST /api/auth/team-qr-login`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/event-config`
- `GET /api/player/me`
- `GET /api/player/stations`
- `GET /api/player/progress`
- `GET /api/player/activity-log`
- `POST /api/player/stations/:stationId/check-in`
- `POST /api/player/stations/:stationId/check-out`
- `POST /api/player/stations/:stationId/score`
- `POST /api/player/stations/:stationId/cancel`
- `POST /api/player/stations/:stationId/submit-cipher`
- `GET /api/leaderboard`
- `GET /api/player/final`
- `POST /api/player/final/submit`
- `GET /api/admin/dashboard`
- `GET /api/admin/teams`
- `POST /api/admin/teams`
- `PATCH /api/admin/teams/:teamId`
- `DELETE /api/admin/teams/:teamId`
- `GET /api/admin/teams/:teamId/progress`
- `GET /api/admin/score-queue`
- `GET /api/admin/progress-matrix`
- `POST /api/admin/stations`
- `PATCH /api/admin/stations/:stationId`
- `DELETE /api/admin/stations/:stationId`
- `POST /api/admin/progress/:progressId/score`
- `PATCH /api/admin/progress/:progressId/score`
- `POST /api/admin/progress/:progressId/reopen`
- `PATCH /api/admin/progress/:progressId/status`
- `GET /api/admin/event-config`
- `PATCH /api/admin/event-config`
- `GET /api/admin/activity-logs`
- `GET /api/admin/final-config`
- `PATCH /api/admin/final-config`
- `GET /api/admin/final/submissions`
- `GET /api/admin/reports/summary.xlsx`

## Seed Accounts

- Admin: `admin` / `admin123`
- Team accounts: `team01` / `team01` through `team25` / `team25`

## Auth Smoke Test

```powershell
$team = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/team-login -ContentType 'application/json' -Body '{"username":"team01","password":"team01","deviceLabel":"local-test"}'
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/auth/me -Headers @{ Authorization = "Bearer $($team.accessToken)" }
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/logout -Headers @{ Authorization = "Bearer $($team.accessToken)" }
```

Team logout revokes the active `team_sessions` row. Admin logout records
an activity log; the client should delete the JWT.

Score flow:

1. Team checks in and checks out at a station.
2. Staff enters the score on the device already signed in with the team account.
3. Staff confirms with `SCORING_CODE`; the backend stores only its bcrypt hash.
4. Client submits `score` and `confirmationCode` to `POST /api/player/stations/:stationId/score`.
5. Admin can still handle exceptions through the admin score queue and edit endpoint.

The development seed scoring code is `2468`. Set a strong `SCORING_CODE` before
seeding any shared or production database.

QR seed token format:

- Check-in: `MV26-STATION-ST002-CHECK_IN`
- Check-out: `MV26-STATION-ST002-CHECK_OUT`

Replace `ST002` with any seeded station id.

Both check-in and check-out reject requests without a QR token.

## Two-Team Smoke Test

After applying migrations, running seed, and starting the API, run the two-team
station flow smoke test from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File be/scripts/smoke-two-team.ps1 -ApiBaseUrl http://localhost:3000 -ScoringCode 2468
```

The script logs in `team01` and `team02`, completes `ST002` and `ST047` with
seed QR tokens, submits staff scores with the scoring code, and verifies each
team dashboard reflects the points. It opens the rehearsal event window by
setting `eventEndTime` to `23:59` through the admin API before station actions.
Run it against a freshly seeded or disposable rehearsal database because it
intentionally mutates event config, station progress, and scores.

## Report Export and Database Recovery Rehearsal

After the API is running with an admin account, export the summary workbook:

```powershell
powershell -ExecutionPolicy Bypass -File be/scripts/export-summary-report.ps1 -ApiBaseUrl http://localhost:3000 -Username admin -Password admin123
```

For PostgreSQL recovery rehearsal, take a compressed backup before smoke tests or
event operations:

```bash
pg_dump "$DATABASE_URL" --format=custom --file movement-backup.dump
```

Restore into a disposable database first, never directly over production:

```bash
createdb movement_restore
pg_restore --dbname movement_restore --clean --if-exists movement-backup.dump
```

Then point a temporary API instance at the restored database and verify
`GET /api/admin/dashboard` and the report export script both succeed.

## Production Deploy Notes

Run database initialization before restarting the API:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run db:verify
npm run build
```

`be/deploy/deploy.sh` and the backend GitHub Actions SSH deploy template both
run these steps before restarting the process manager. Production deploy must
fail if migration, seed, verification, or build fails. Do not run
`prisma migrate reset` in production.

For local development only, a disposable database can be reset and reseeded:

```bash
npm run db:reset
```

Production must set non-development values for `DATABASE_URL`, `JWT_SECRET`,
`SCORING_CODE`, and `CORS_ORIGIN`. `CORS_ORIGIN` may be one frontend origin or a
comma-separated list, for example:

```text
CORS_ORIGIN=https://movement.example,https://admin.movement.example
```
