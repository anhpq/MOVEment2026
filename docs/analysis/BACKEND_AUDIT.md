# Backend Audit Status

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
