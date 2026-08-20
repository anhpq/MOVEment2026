# Station Reference Points, Ba Tiêu Ranking, and Excel Analysis

## Status

| Area | Status |
| --- | --- |
| Business decisions | Approved on 2026-08-19 |
| Implementation | Completed locally across schema, Backend, Frontend, seed and Excel |
| Automated verification | Backend Jest `201/201`, Frontend Vitest `163/163`, Prisma/seed checks, i18n/font/lint/build and workbook reopen coverage passed on 2026-08-20 |
| Runtime/Production verification | Not run |

## Objective

Decouple Station reference points from score-entry validation, introduce a
global score-entry cap of `105`, finalize Ba Tiêu Cuồng Phong scores by Station
rank at `finalStartsAt`, and make Team Results Excel auditable at millisecond
precision.

This document is the approved implementation plan. During execution,
`OPEN_QUESTIONS_AND_DECISIONS.md` must be updated before Source Code because the
approved behavior changes existing Business Rules.

## Locked Business Decisions

### Score concepts

- `Game.maxPoints` is a Station reference/display value. It does not reject a
  valid score merely because the submitted score is higher.
- Every Team and Admin score write accepts integers from `0` through `105`.
  Backend is authoritative; Admin correction has no override above `105`.
- `Team.maxPossiblePoints` is fixed at `105 * 17 = 1785`. It is no longer the
  sum of Station `maxPoints` values and must not change when a reference value
  or tracking mode changes.
- `SCORE` keeps the real accepted Check-out timestamp but contributes zero play
  duration. Do not restore the historical `checkedInAt = checkedOutAt` behavior.

### Canonical Station references

| ID | Station | Reference points | Tracking note |
| --- | --- | ---: | --- |
| `ST001` | Thủy Lộ Ký Ức | 20 | `SCORE` |
| `ST002` | Ngự Ảnh Tái Hiện | 20 | `SCORE` |
| `ST003` | Vạn Vật Ghi Tâm | 36 | `SCORE` |
| `ST004` | Thiên Địa Chao Đảo | 15 | `SCORE` |
| `ST005` | Phi Thuyền Xuyên Không | 105 | `SCORE` |
| `ST006` | Tâm Đầu Ý Lon | 20 | `SCORE` |
| `ST007` | Vòng Quay Công Lý | Unknown / `null` | `SCORE`; display `???` |
| `ST008` | Song Tâm Dẫn Ngọc | 36 | `SCORE` |
| `ST009` | Ba Tiêu Cuồng Phong | 25 | Change to `TIME` |
| `ST010` | Bách Thú Quy Hội | 15 | `SCORE` |
| `ST011` | Mê Trận Đồng Tâm | 20 | `SCORE` |
| `ST012` | Trụ Vững Càn Khôn | 40 | `SCORE` |
| `ST013` | Liên Hoàn Thần Chưởng | 36 | `SCORE` |
| `ST014` | Hỏa Nhãn Kim Tinh | 10 | `SCORE` |
| `ST015` | Tam Sao Thất Vậy | 30 | `SCORE` |
| `ST016` | Vạn Ly Trường Thành | 30 | `SCORE` |
| `ST017` | Nhất Nhịp Đồng Tâm | 20 | `SCORE` |

- Keep all canonical Station names, IDs, and sort order unchanged. Do not add a
  `Bonus` prefix or badge to Vòng Quay Công Lý.
- `maxPoints` becomes nullable at the storage/API type level, but only `ST007`
  may use `null`. Admin must require a numeric reference for every other
  Station.
- New noncanonical Stations retain the reference default `30`.

### Ba Tiêu Cuồng Phong

- `ST009` Check-out records real millisecond timestamps, completes immediately
  with provisional score `10`, and never opens Team score entry.
- At configured `finalStartsAt`, rank completed ST009 attempts by:
  1. play duration (`checkedOutAt - checkedInAt`) ascending in milliseconds;
  2. `checkedOutAt` ascending in milliseconds;
  3. numeric `Team.id` ascending.
- At most 25 Teams exist. For every completed Team, final Station score is
  `26 - stationRank`: ranks 1..25 receive 25..1. A Team that did not complete
  ST009 receives no Station rank or ST009 score.
- Finalization changes the provisional score by delta, including negative
  deltas for ranks 17..25, and updates `team.totalPoints` atomically.
- Store `stationRank` on progress. A non-null rank is the durable idempotency
  marker; the same Final lifecycle must not award or deduct twice.
- Existing completed ST009 data is normalized to provisional `10` before
  Final. Existing checked-out pending ST009 data is auto-completed with `10`
  and its real duration. At or after Final, reconciliation ranks and finalizes
  it before Leaderboard/Excel reads.
- An Admin correction after finalization may change score within `0..105` and
  preserves `stationRank`; lifecycle must not overwrite it again.

## Implementation Changes

### Database, seed, and invariants

- Add a migration making `games.max_points` nullable and adding nullable
  `team_station_progress.station_rank`.
- Enforce Station rank range 1..25 and uniqueness per Station. Enforce that a
  null reference is accepted only for `ST007`.
- Update canonical Station reference values and change ST009 tracking mode to
  `TIME` without resetting progress, QR records, media, or Station identity.
- Backfill every Team to `maxPossiblePoints = 1785`; Team creation, seed,
  Station sync, reset, and verification must use the same invariant.
- Remove reference-point delta updates from Station edit/deactivate paths.

### Backend and API

- Retain `maxPoints` for compatibility but redefine it as `number | null`
  reference points. Add an explicit `scoreEntryMax: 105` projection so clients
  do not infer the input cap from `maxPoints`.
- Replace effective-Station-max validation with one shared global score helper
  used by Team submit, Admin pending-score submit, and Admin correction.
- Derive `referenceExceeded` as `maxPoints != null && score > maxPoints` for
  UI/audit use; it is a warning, not a rejection.
- Extend Final lifecycle reconciliation to cancel unfinished attempts first,
  normalize/finalize ST009 transactionally, and remain safe under retries and
  multiple Backend instances.
- Reconcile Final lifecycle before Final, Leaderboard, and Team Results reads.
  Tighten the Check-out cutoff so a request cannot cross `finalStartsAt` after
  a preflight check and still be accepted.
- Write ScoreEvent and SYSTEM activity evidence for provisional normalization
  and rank finalization without logging secrets.

### Frontend

- V1/V2 map markers display Station reference points. ST007 displays exactly
  `???`; related list/detail surfaces must not silently fall back to `30`.
- Score forms use `scoreEntryMax = 105`. When input exceeds a non-null
  reference, show a clear non-blocking warning in the existing confirmation.
- Admin forms permit an unknown reference only for ST007 and use
  `Điểm tham chiếu` / `Reference points` terminology where `Max Points` would
  imply a hard validation limit.
- ST009 Check-out follows the existing TIME success flow and does not show a
  score modal.

### Team Results Excel

- Keep one worksheet, one Team row, freeze header, AutoFilter, numeric cells,
  safe content, and the shared Leaderboard comparator.
- Add base column `Warnings` immediately after `Computed Score`.
- Normal Stations retain `Check-in`, `Check-out`, and `Score`. A completed
  Score cell gets red background plus white bold text when its score exceeds a
  non-null reference. ST007 is never compared against an unknown reference.
- ST009 uses five columns in this order: `Check-in`, `Check-out`, `Duration`,
  `Station Rank`, `Score`.
- ST009 Check-in/out format is `dd/mm/yyyy hh:mm:ss.000`; Duration is a numeric
  Excel duration with `[h]:mm:ss.000`. Preserve the millisecond fraction during
  Excel serial conversion.
- Before Final, a completed ST009 row has score `10`, blank Station Rank, and a
  provisional warning. After Final reconciliation, Rank and Score are final.
- `Total Score`, `Computed Score`, Excel Rank, and UI Leaderboard Rank must come
  from the same post-reconciliation snapshot.

## Validation and Acceptance

### Backend

- Accept `0` and `105`; reject `106`, negative, decimal, missing, and invalid
  values through Team and both Admin score paths.
- Accept a score above reference but at most `105`; persist it once and derive
  the warning.
- Accept `maxPoints = null` only for ST007.
- Verify ST009 TIME Check-out auto-completes with `10`, real duration, no
  pending score, one score event, and duplicate protection.
- Verify millisecond ordering, both tie-breaks, ranks 1..25, scores 25..1,
  positive/zero/negative deltas, idempotency, concurrency, no-completion case,
  and exact Final cutoff behavior.
- Verify old completed/pending ST009 reconciliation and Admin post-Final
  correction preservation.
- Verify Team creation, seed, reset, sync, and database checks use `1785`.

### Excel and Frontend

- Test ST009 headers, millisecond serials, duration format, rank, provisional
  warning, final score, and normal-Station red fills by reopening the generated
  workbook with ExcelJS.
- Test `???` on V1/V2 map and no fallback in list/detail/Admin displays.
- Test the `0..105` input range and non-blocking reference warning in Team and
  Admin paths.
- Run targeted/full Backend Jest, Prisma generation, migration validation,
  seed twice, `db:verify`, Frontend Vitest, i18n parity, font guard, lint,
  production builds, `git diff --check`, and `graphify update .`.
- Manually open the generated workbook in Excel or Google Sheets and smoke V1/
  V2 map plus score confirmation. Report any unavailable manual/Production
  verification instead of claiming it passed.

## Documentation Synchronization

Execution must update, in order:

1. `OPEN_QUESTIONS_AND_DECISIONS.md`.
2. Shared project specification and affected scoring, map, Excel, Event/Final,
   seed/reset, and Team V2 analyses.
3. Prompt 12 where it still treats Station max as a hard cap and contains the
   stale `TIME = 0` statement.
4. `BACKEND_AUDIT.md` and `IMPLEMENTATION_BACKLOG.md` with actual evidence.

While touching Event timing analysis, reconcile its stale Final cooldown line
`1, 3, 5, ...` to the confirmed `3, 5, 10, 15, 20, ...` rule without changing
unrelated Final implementation.

## Decision Log

1. Station max review: retain `maxPoints` as display/reference data only.
2. Hard-cap review: use `105` for every Team/Admin score write.
3. Team aggregate review: set `maxPossiblePoints` to fixed `1785`.
4. Unknown reference review: only ST007 may be null and display `???`.
5. SCORE timing review: keep real timestamps and zero duration contribution.
6. Ba Tiêu flow review: TIME auto-score 10, then Final rank score 25..1.
7. Tie review: duration ms, Check-out ms, then Team ID.
8. Excel review: red over-reference cells and five auditable ST009 columns.
9. Naming review: keep canonical Vòng Quay Công Lý name unchanged.
10. Delivery review: no push, deploy, or Production mutation without a separate
    explicit request.
