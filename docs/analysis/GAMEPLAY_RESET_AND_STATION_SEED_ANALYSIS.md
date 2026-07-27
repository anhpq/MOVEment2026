# Gameplay Reset and Station Seed Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Out of scope / pending explicit execution |
| Browser/Manual Verification | Pending verification |

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
- Commit `d0b15023` added reset invariants and safe output behavior.
- Reset preserves Team/User identity, recreates canonical gameplay state, uses
  non-expiring Team QR, and verifies exact Station/QR/progress/config counts.
- Production execution was intentionally not performed by the implementation
  task and must never be inferred from local verification.

## Decisions and Stale Assumptions

- Never use `prisma migrate reset` for Production gameplay reset.
- `maxPossiblePoints = 300`; historical `267`/`287` values are superseded.
- Team QR is reusable and non-expiring; historical TTL rotation requirements
  are superseded.
- Normal Production seed remains non-destructive. Explicit guarded commands own
  destructive reset/sync behavior.
- When canonical Station gameplay inventory already matches, normal seed may
  update only `name_en` and `description_en` for the 17 canonical Stations. This
  translation-only repair does not reset progress, games, scoring, or QR tokens
  and does not require destructive replacement confirmation.
- Do not print raw token, QR URL, password, or database secret.

## Interfaces and Data

- Canonical Station IDs: exact 17 Station records with one active Game each.
- Canonical Station content includes Vietnamese `name`/`description` plus
  provisional English `name_en`/`description_en`.
- Exact 34 Station QR records: one check-in and one check-out per Station.
- One progress row per Team and Station after reset.
- One active non-expiring Team QR per Team after gameplay reset.

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
4. Reset review: enforce backup/confirmation in the executable path.
5. Invariant review: verify exact post-reset state inside the transaction.
6. Security review: suppress raw secrets and token material.
7. Consolidation review: replace obsolete score/TTL assumptions with current rules.

## Provenance

- `.kilo/plans/1784893315958-production-gameplay-reset-station-seed-plan.md`
- `.kilo/plans/1784900699642-station-seed-replacement-plan.md`
- `.kilo/plans/1784901710471-replace-stations-seed-production-sync.md`
