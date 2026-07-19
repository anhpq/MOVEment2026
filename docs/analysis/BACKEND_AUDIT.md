# Backend Audit Status

Last updated: 2026-07-19

## Verification completed

- `npm ci` completed and Prisma Client was generated with `npm run prisma:generate`.
- `npm test -- --runInBand`: **32 passed**, across auth service/controller, JWT guard, production environment validation, Player QR/scoring flow, and Final scoring/idempotency/retry handling.
- `npm run build`: **passed**.
- `npm run lint`: **passed** after adding the backend ESLint flat configuration.
- Production startup validation now rejects missing or development-default `DATABASE_URL`, `JWT_SECRET`, `SCORING_CODE`, and wildcard `CORS_ORIGIN` when `NODE_ENV=production`.
- Runtime CORS now accepts a comma-separated `CORS_ORIGIN` list while production validation rejects wildcard origins, including wildcard entries inside a list.
- `npm run prisma:deploy` applied the initial migration against local PostgreSQL at `127.0.0.1:55432/movement`.
- `npm run seed` completed and created 25 team accounts (`team01/team01` through `team25/team25`), 10 stations, and 20 station QR tokens.
- Team login smoke test passed for `team01/team01`, and `GET /api/auth/me` returned a `TEAM` session for `team01`.
- Two-team API smoke script added at `be/scripts/smoke-two-team.ps1`; run it against a freshly seeded or disposable rehearsal database because it mutates station progress and scores.
- Report export helper added at `be/scripts/export-summary-report.ps1`; README now documents export verification plus PostgreSQL backup/restore rehearsal commands.
- Two-team API smoke test passed against the local API after opening the rehearsal event window to `23:59`: `team01` completed `ST002` for 25 points and `team02` completed `ST047` for 30 points.
- Report export passed against the local API and produced a non-empty `.xlsx` workbook.
- Database recovery rehearsal passed: `pg_dump` created a custom-format backup, `pg_restore` restored it into `movement_restore_codex_20260719`, a temporary API on port `3001` returned admin dashboard data, and report export from the restored database produced a non-empty workbook.
- Frontend build passed after QR login support was added. Frontend lint passes with one existing `StationMap.tsx` hook dependency warning.

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
- Prisma warns that `package.json#prisma` is deprecated; migrate to `prisma.config.ts` before Prisma 7.
- The `ts-jest` configuration was migrated from deprecated `globals` to `transform`.

## Next recommended task

Validate production CORS and secrets in the deployed environment, then plan the Prisma 7 config migration.
