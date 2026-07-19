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
- Frontend build passed after QR login support was added. Frontend lint passes with one existing `StationMap.tsx` hook dependency warning.

## Backend work still required

### P0 remaining work

- [x] Automated coverage exists for auth, QR check-in/check-out, score confirmation rejection/acceptance, Final rank award, same-team idempotency, and Final transaction retry behavior.

### P1 event-readiness checks

- [x] Validate migration and seed against a clean database.
- [ ] Run an end-to-end smoke test using two simultaneous team sessions.
- [x] Add `prisma migrate deploy` to the deployment path.
- [ ] Validate production CORS and secrets in the deployed environment.
- [ ] Rehearse report export and database recovery.

## Maintenance findings

- `npm ci` reported **2 high-severity dependency vulnerabilities**. Triage with `npm audit` before upgrading or applying fixes.
- Prisma warns that `package.json#prisma` is deprecated; migrate to `prisma.config.ts` before Prisma 7.
- The `ts-jest` configuration was migrated from deprecated `globals` to `transform`.

## Next recommended task

Run a two-team end-to-end smoke test with real frontend sessions, then rehearse report export and database recovery.
