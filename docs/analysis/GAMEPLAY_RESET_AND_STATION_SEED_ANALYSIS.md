# Gameplay Reset and Station Seed Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed 2026-08-21 |
| Runtime/Production Verification | Out of scope / pending explicit execution |
| Browser/Manual Verification | Pending protected-admin verification |

## Objective and Scope

Maintain one canonical 17-Station dataset, safe local/test seed behavior, an
explicit Station synchronization command, and a guarded gameplay-reset command.
Normal Production seed/deploy must not trigger destructive replacement.

## Business Rule References

- `OPEN_QUESTIONS_AND_DECISIONS.md`: seed safety and guarded gameplay reset.
- `PROJECT_ANALYSIS_SPEC.md`: canonical Station and gameplay state behavior.
- Backend reset/sync runbooks for operational execution.

## Current Implementation

- Canonical Station data and replacement helpers are shared by seed/sync paths.
- `npm run reset:gameplay` is dry-run by default; execute mode enforces
  confirmation and backup guards at the executable entrypoint.
- Reset preserves Team/User identity, QR credentials, Station/Game/media/map,
  Event Config, and Final config. It clears only rehearsal progress, scoring,
  Final submissions, sessions, Team QR usage metadata, and application logs.
- Reset recreates `AVAILABLE` progress from the active Station/Game inventory,
  validates the canonical 17-Station/34-Station-QR inventory first, and never
  restores the obsolete fixed `11:30`/`11:45` Event Config values.
- Admin V2 `/admin-v2/operations/event-preparation` uses protected status,
  reset, and bulk-rotation APIs. Reset rejects at/after
  `2026-08-27 06:00:00 Asia/Ho_Chi_Minh`; both reset and rotation require a
  typed confirmation and backup acknowledgement.
- Bulk rotation is a separate transaction: old Team/Station QR are revoked,
  Team sessions are invalidated, one Team QR plus each Station QR pair is
  regenerated, and the Admin exports PNGs with a payload-free `manifest.csv`.
- Production execution was intentionally not performed by the implementation
  task and must never be inferred from local verification.

## Decisions and Stale Assumptions

- Never use `prisma migrate reset` for Production gameplay reset.
- `maxPossiblePoints = 1785`; historical `267`/`287`/`300` values and sums of Station references are superseded.
- Team QR is reusable and non-expiring; historical TTL rotation requirements
  are superseded.
- Normal Production seed remains non-destructive. Explicit guarded commands own
  destructive reset/sync behavior.
- Normal local/test seed updates canonical Station/Game content in place when
  the stable Station inventory exists. Content-only changes such as localized
  descriptions, media URLs, points, and map coordinates must not invoke the
  destructive replacement helper or rotate Station QR tokens.
- When the canonical Station inventory exists, normal local/test seed may update
  canonical Station and active Game content for the 17 Station IDs in place.
  This content synchronization does not reset progress, scoring, or QR tokens
  and does not require destructive replacement confirmation.
- Canonical tracking modes are synchronized in place: `ST009` is `TIME`; the
  other 16 Stations are `SCORE`. This does not rotate their CHECK_IN/CHECK_OUT
  QR tokens.
- Do not print raw token, QR URL, password, or database secret.

## Interfaces and Data

- Canonical Station IDs: exact 17 Station records with one active Game each.
- Canonical Station content includes Vietnamese `name`/`description` plus
  provisional English `name_en`/`description_en`.
- Exact 34 Station QR records: one check-in and one check-out per Station.
- One progress row per Team and Station after reset.
- One active non-expiring Team QR per Team is preserved after gameplay reset.

## Verification and Risks

- Disposable-database reset, seed/idempotency, Backend tests, lint, and build are
  recorded in `BACKEND_AUDIT.md` and `IMPLEMENTATION_BACKLOG.md`.
- Production mutation remains outside this analysis until separately authorized.
- Browser/map persistence and real operational backup/restore rehearsal remain
  pending where backlog says they were not run.

## Decision Log

1. Dataset review: use one canonical 17-Station source.
2. Seed review: keep normal Production seed non-destructive.
3. Sync review: require explicit confirmation for Station replacement.
4. Reset review: enforce backup/confirmation in the executable path and Admin UI.
5. Invariant review: verify exact post-reset state inside the transaction while preserving QR/configuration.
6. Security review: suppress raw secrets and token material; ZIP manifest is payload-free.
7. Cutoff review: deny reset at/after 06:00 Asia/Ho_Chi_Minh on 2026-08-27.
8. Consolidation review: replace obsolete score/TTL assumptions with current rules.

## Provenance

- `.kilo/plans/1784893315958-production-gameplay-reset-station-seed-plan.md`
- `.kilo/plans/1784900699642-station-seed-replacement-plan.md`
- `.kilo/plans/1784901710471-replace-stations-seed-production-sync.md`
