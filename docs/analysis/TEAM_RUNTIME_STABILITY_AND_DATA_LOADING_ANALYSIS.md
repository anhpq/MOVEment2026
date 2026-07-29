# Team Runtime Stability and Data Loading Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | In progress |
| Runtime/Production Verification | Not performed |
| Browser/Manual Verification | Pending |

## Execution Checkpoint — 2026-07-29 17:12 Asia/Saigon

Work is intentionally paused so the workstation can be shut down. The current
working state is captured in a local checkpoint commit for continuation.

### Completed before pause

- Added lean Player catalog/state/lazy-images/leaderboard APIs with explicit
  Prisma projections, catalog hashing, cache headers, and authoritative Team
  totals.
- Added request correlation/timing/response-size logging and stable Player
  action error codes.
- Added conditional/idempotent check-in, check-out, cancel, and score
  transitions; unified QR action now performs QR bcrypt verification once.
- Added the PostgreSQL partial unique index plus duplicate-data preflight for
  one active Station per Team.
- Implemented the Frontend coordinator/session/error-resilience, adaptive
  polling, lazy route/heavy-module loading, QR/map/gallery fallbacks, bundle
  cleanup, and Frontend tests. Integration review is not yet complete.
- Removed the unreferenced runtime PNG and unused React Query/Lodash
  dependencies.
- Reverted `.github/workflows/fe-deploy.yml`; all deploy files are clean and
  must remain unchanged per the latest direct user instruction.

### Validation completed before pause

- Backend full Jest: `162/162` PASS.
- Backend lint and build: PASS.
- Frontend Vitest: `15/15` PASS.
- Frontend lint: PASS; i18n parity: `388` keys PASS.
- Frontend production build and bundle gate: PASS; initial static JavaScript
  `203.27 KiB gzip` against the `420 KiB` limit; Admin `qrcode`, map, and scanner
  chunks are absent from the initial graph.
- Disposable PostgreSQL: all `18` migrations applied; seed ran twice;
  `db:verify` passed with `25 Teams / 17 Stations / 425 progress rows / 34
  active Station QR tokens / 25 active Team QR tokens`.
- The active-progress unique invariant rejected two active rows, and the
  migration preflight failed with the intended explicit duplicate-data error.
- `npm audit` still reports two high-severity React Router advisories affecting
  unstable RSC APIs; the project does not use RSC, and the available automated
  fix is breaking, so no forced dependency upgrade was applied in this
  checkpoint.

### Required work after resume

1. Stop/reconcile any unfinished worker state and review the complete Frontend
   diff file by file, especially mutation reconciliation, session principal
   changes, polling guards, and lean-to-legacy fallback behavior.
2. Run the full Backend and Frontend validation suites again after that review.
3. Run production-like authenticated API smoke and record `/player/state` and
   catalog payload sizes; verify request-count, hidden/offline, and mutation
   POST-plus-one-refresh gates.
4. Perform responsive Team V1/V2 browser smoke when feasible. Physical iOS,
   Android, and Production runtime remain `Not verified` unless actually run.
5. Synchronize the routed analysis files, `BACKEND_AUDIT.md`, and
   `IMPLEMENTATION_BACKLOG.md`; do not edit Business Rules or deploy files.
6. Run `graphify update .`, remove generated `graphify-out/.vocab.txt`, review
   `git diff`/`git status`, and create scoped local commits. Do not push or
   deploy.

## Objective and Scope

Reduce Team-side payload, request frequency, bundle weight, and transient-error
impact across Login, Station List/Map/Detail, Team Gameplay V2, Leaderboard, and
Final without changing confirmed authentication, QR, scoring, Final, or ranking
Business Rules. Admin behavior and the existing Player APIs remain compatible.

## Confirmed Findings

- Player bootstrap currently requests dashboard, Stations, and progress in
  parallel even though the responses duplicate progress, Station, Game, and
  image data.
- `/player/me` computes full progress and full leaderboard ranking, and Team V2
  repeats the three-request bootstrap every five seconds.
- Frontend normalization recomputes Team totals from Station rows, which can
  discard Final bonus and incorrectly count `SCORE` duration.
- Transient `/auth/me` failures currently clear a valid local session.
- Player mutations and projection refresh share one `try` block, so a committed
  action may be presented as failed when the follow-up refresh fails.
- PostgreSQL does not currently enforce the one-active-Station-per-Team
  invariant across concurrent requests.
- The frontend build is one 543.72 kB gzip JavaScript chunk and eagerly imports
  Team and Admin pages together.

## Target Interfaces

- `GET /api/player/catalog?lang=vi|en`: versioned active Station catalog with
  localized content, map/scoring metadata, and `imageCount`; no progress or raw
  image URL list.
- `GET /api/player/state`: authoritative Team aggregates, minimal progress rows,
  Final availability, server time, and catalog version.
- `GET /api/player/stations/:stationId/images`: lazy ordered image URLs.
- `GET /api/player/leaderboard`: minimal Team leaderboard projection.
- Existing Player and global Leaderboard endpoints remain available for
  compatibility.

## Implementation Decisions

- Dynamic Team state uses visible/online-only, non-overlapping 15-second
  polling. Catalog reloads only when locale or catalog version changes.
- Playing counts and leaderboard poll only while their consumer is visible.
- Last-known data remains visible on transient failure; mutations are never
  automatically replayed.
- GET requests use bounded retry; mutations reconcile state before a manual
  retry when their result is unknown.
- Backend totals remain authoritative. Station-derived totals are diagnostic
  only and never overwrite `team.totalPoints` or `team.totalPlaySeconds`.
- A PostgreSQL partial unique index and conditional service transitions enforce
  one active Station per Team and idempotent action handling.
- Frontend routes and heavy scanner/gallery/map modules load on demand.
- Rollout is Backend/migration first, Frontend second, with a temporary
  `lean|legacy` frontend data-mode switch.

## Acceptance Criteria

- Canonical 17-Station `/player/state` is at most 8 kB uncompressed; catalog is
  at most 32 kB and contains no `imageUrls`.
- Visible Team V2 steady state emits at most eight periodic GET requests per
  minute with closed overlays; hidden tabs emit none.
- Each gameplay mutation emits one POST and at most one state reconciliation
  GET.
- Team UI preserves Backend total points, including Final bonus, and Backend
  total play time, including the zero-duration `SCORE` rule.
- Concurrent different-Station check-ins leave exactly one active progress row.
- Team/Login UI never renders raw Backend error text, stack traces, or secrets.
- Team initial JavaScript is at most 420 kB gzip; Admin QR code modules are not
  part of the Team request graph; the unused public PNG is absent from `dist`.
- Legacy Player endpoints, V1 QR flow, Admin routes, and confirmed Business
  Rules do not regress.

## Verification Plan

- Backend unit/contract/concurrency tests, Prisma migration deploy on disposable
  PostgreSQL, two seed runs, and `db:verify`.
- Frontend unit/component tests for request coordination, auth/session changes,
  stale/error recovery, mutation reconciliation, QR duplicate guards, map
  retry, and safe localized errors.
- Full Backend Jest/lint/build and Frontend test/i18n/lint/build.
- Production-like API/browser smoke, response-size/request-count checks,
  responsive Team V1/V2 review, and bundle-budget verification.
- Production and physical-device verification remain explicitly unverified
  unless separately authorized and actually performed.

## Seven-Round Decision Log

1. Scope: all Team routes, prioritizing `/team/v2`.
2. Freshness: adaptive HTTP; own actions update immediately and passive dynamic
   state may be 10-15 seconds stale.
3. API: add lean interfaces and keep existing APIs compatible.
4. Offline/error behavior: preserve last-known data and do not queue mutations.
5. Correctness: include database and service concurrency hardening.
6. Delivery: split routes and heavy UI modules; remove unused runtime assets and
   dependencies.
7. Rollout: measurable Backend-first deployment with a temporary legacy switch.

## Documentation Routing

After implementation and verification update:

- `PROJECT_ANALYSIS_SPEC.md`;
- `TEAM_GAMEPLAY_V2_ANALYSIS.md`;
- `TEAM_QR_AND_PLAYER_NAVIGATION_ANALYSIS.md`;
- `STATION_QR_AND_SCORING_ANALYSIS.md`;
- `STATION_MAP_ANALYSIS.md`;
- `FRONTEND_LOCALIZATION_ANALYSIS.md`;
- `BACKEND_AUDIT.md`;
- `IMPLEMENTATION_BACKLOG.md`;
- deployment handoff documentation when rollout behavior changes.

`OPEN_QUESTIONS_AND_DECISIONS.md` is not changed because this work preserves all
confirmed Business Rules.
