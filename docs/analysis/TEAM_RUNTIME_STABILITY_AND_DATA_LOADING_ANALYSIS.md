# Team Runtime Stability and Data Loading Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed locally |
| Runtime/Production Verification | Production-like local smoke completed; Production not performed |
| Browser/Manual Verification | Pending physical/responsive manual verification |

## Follow-up hot-path audit - 2026-08-02

The current local database is approximately `9.8 MiB` with `25` Teams, `17`
Stations, `425` progress rows, `69` Team sessions, `217` activity logs, and no
Final submissions. Current inventory does not justify a general index migration.

Confirmed priorities:

1. `JwtAuthGuard` validates the Team session and updates `lastSeenAt` on every
   authenticated Team request. Local PostgreSQL statistics show `292` updates
   and `28` dead tuples across `69` session rows. Preserve per-request revoke
   validation, but throttle the write with a conditional update when the stored
   heartbeat is at least 60 seconds old.
2. Every `/api/player/state` poll recomputes the shared catalog hash and full
   lean leaderboard. At the normal 15-second interval, 25 continuously visible
   Teams can produce about 100 state polls per minute. Add a bounded 5-15 second
   single-flight cache for shared projections and explicitly invalidate it
   after gameplay, scoring, Final, Station/media, Team, or Event Config changes.
3. `EventConfigService.getConfig()` uses `upsert({ update: {} })` on a hot read
   path. Normal reads should use `findUnique`, with creation limited to a
   missing-row fallback or startup/seed path; cache only if Admin updates
   invalidate it.

Deferred until growth evidence exists:

- a Final-submission index including `teamId`, because the local table is empty;
- Activity Log actor/time or created-time indexes, because the local table has
  only 217 rows;
- timer micro-optimizations and progress-matrix lookup maps, because they have
  lower impact than the request/DB hot paths above.

Required evidence before completion: Prisma/PostgreSQL query counts, WAL or
tuple-update rate, p95 `/api/player/state`, cache hit rate, mutation-to-read
freshness, and `EXPLAIN (ANALYZE, BUFFERS)` for any proposed index.

## Network Transfer Optimization - 2026-08-01

- Admin System Config now loads QR metadata through one
  `GET /api/admin/qr-status-summary` request instead of issuing one Team-token
  request per Team and one Station-token request per Station. With the canonical
  25-Team/17-Station inventory, initial page loading drops from 43 requests to
  2 requests including the progress matrix. Raw QR tokens are still fetched
  only after the Admin explicitly opens a QR preview. The live local matrix
  dropped from the 101,512-byte baseline to 75,993 bytes (25.1% smaller), and
  the new summary measured 1,767 bytes.
- Station List now consumes the Final availability already returned by
  `/api/player/state` and no longer polls `/api/player/final` separately. Its
  closed-overlay steady state drops from about 12 to 8 periodic GET requests
  per minute.
- Browsers reporting `saveData`, `2g`, or `slow-2g` use a 30-second default
  polling interval instead of 15 seconds, reducing the same Station List steady
  state to about 4 periodic GET requests per minute. Reduced-data map selection
  is capped at the 1920-pixel WebP variant instead of downloading the
  419,146-byte 2950-pixel variant.
- Player playing-count and leaderboard responses, plus Admin QR summary, use
  private revalidation so unchanged responses can return `304` without a body.
  Bodyless GET requests no longer send an unnecessary JSON `Content-Type`
  header. Cross-origin CORS preflight results are reusable for 10 minutes,
  avoiding repeated OPTIONS requests on the OBS/API split-origin path.
- Nginx enables gzip for text, JavaScript, CSS, SVG, and proxied JSON; Vite
  fingerprinted assets cache for one year, stable media for 30 days, and SPA
  HTML revalidates. The OBS deploy path applies the equivalent cache metadata.
- Verification passed: Backend Jest `164/164`, lint, and build; Frontend Vitest
  `55/55`, i18n parity `395`, lint, production build, and bundle gate at
  `203.38 KiB` initial gzip JavaScript. A local real OPTIONS request returned
  `204` with `Access-Control-Max-Age: 600`; unchanged Admin matrix and QR
  summary requests each returned `304` with zero body bytes. Deployment and
  live cache/gzip header verification were not performed.

## Resume Completion — 2026-07-29

- Reviewed mutation reconciliation, session-principal isolation, polling guards,
  and lean-to-legacy fallback behavior after the checkpoint.
- Added deterministic Node v26-compatible Web Storage setup for Vitest plus
  automated coverage for hidden/offline polling, non-overlap, and exactly one
  state reconciliation after a successful or unknown-outcome mutation.
- Production-like HTTPS smoke passed against a disposable PostgreSQL database:
  all 18 migrations, seed twice, `db:verify`, auth/QR/scoring/Final/leaderboard,
  secret scanning, and production environment guards.
- Canonical payloads measured `3,885` bytes for `/api/player/state` and `5,908`
  bytes for `/api/player/catalog?lang=vi`; catalog contained 17 Stations and no
  `imageUrls`.
- Final validation passed: Backend Jest `162/162`, lint, build; Frontend Vitest
  `19/19`, i18n parity `388`, lint, production build, and bundle gate at
  `203.27–203.28 KiB` initial gzip JavaScript.
- Production runtime and physical iOS/Android verification remain unperformed.

## Execution Checkpoint — 2026-07-29 17:12 Asia/Saigon

This historical checkpoint was resumed and completed by the verification and
documentation pass recorded above.

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
  polling, or 30 seconds when the browser reports reduced-data/2G conditions.
  Catalog reloads only when locale or catalog version changes.
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
- Visible Team V2 and Station List steady state emits at most eight periodic GET
  requests per minute with closed overlays, or four in reduced-data mode;
  hidden tabs emit none.
- Canonical Admin System Config bootstrap emits two GET requests, and QR status
  summary responses contain no raw token or token hash.
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
  conditional `304`, gzip/cache-header checks, responsive Team V1/V2 review,
  and bundle-budget verification.
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
