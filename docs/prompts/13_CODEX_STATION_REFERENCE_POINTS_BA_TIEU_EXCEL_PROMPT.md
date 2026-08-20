# CODEX STATION REFERENCE POINTS, BA TIEU RANKING, AND EXCEL EXECUTION

## Objective

Implement the approved plan in:

```text
docs/analysis/STATION_REFERENCE_POINTS_BA_TIEU_EXCEL_ANALYSIS.md
```

Do not stop after analysis. Implement the complete approved scope, validate it
in proportion to the cross-module risk, synchronize documentation, and create
a scoped local commit when safe.

## Mandatory Start

1. Read `AGENTS.md`.
2. Read `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`.
3. Read `docs/analysis/FEATURE_INDEX.md`.
4. Read the approved Feature Analysis above completely.
5. Read only the related project/Feature analyses routed by the index.
6. Read current Source Code before editing; use Graphify focused queries for
   cross-module tracing when `graphify-out/graph.json` exists.
7. Inspect `git status` and preserve every pre-existing user change. Never
   reset, revert, or stage unrelated files.

Classify this execution as:

```text
Business Rule Change + cross-module implementation
```

Because this changes confirmed Business Rules, update
`OPEN_QUESTIONS_AND_DECISIONS.md` before Source Code.

## Locked Decisions — Do Not Reopen

- Station `maxPoints` is reference/display data, not score validation.
- Every Team/Admin score write accepts integer `0..105`; no Admin override.
- `Team.maxPossiblePoints = 105 * 17 = 1785` and no longer sums references.
- Only `ST007` Vòng Quay Công Lý may have `maxPoints = null`; display `???`.
- Keep every canonical Station name/ID/order unchanged; do not add `Bonus`.
- Keep accepted Check-out timestamps real. SCORE contributes zero duration by
  calculation; never force Check-out equal to Check-in.
- ST009 Ba Tiêu Cuồng Phong becomes TIME, auto-completes at Check-out with
  provisional `10`, and never opens score entry.
- At `finalStartsAt`, rank completed ST009 attempts by duration milliseconds,
  then Check-out milliseconds, then Team ID. Final score is `26 - rank`, so
  ranks 1..25 receive 25..1.
- Excel normal Station Score cells are red when score exceeds a non-null
  reference. ST009 has Check-in, Check-out, Duration, Station Rank, Score and
  preserves milliseconds.

The exact 17 reference values, migration/backfill behavior, public interface
changes, Excel layout, edge cases, and acceptance tests are mandatory and are
specified in the Feature Analysis. Do not replace them with assumptions.

## Execution Phases

### 1. Business Rules and contracts

- Update Source of Truth first, then shared/Feature analyses.
- Define one Backend global score cap and an explicit API projection such as
  `scoreEntryMax`; do not keep using effective Station max as a validator.
- Make `maxPoints` nullable in types while enforcing null only for ST007.

### 2. Migration, canonical data, and reconciliation

- Add nullable reference points plus durable `stationRank` constraints/indexes.
- Update canonical references, ST009 tracking mode, and all Team
  `maxPossiblePoints` values without resetting QR/progress identity.
- Reconcile existing completed and pending ST009 data exactly as approved.
- Update seed, sync, reset, Team creation, and verification invariants.

### 3. Scoring and Final lifecycle

- Apply global `0..105` validation to Team submit, Admin pending-score submit,
  and Admin correction.
- Preserve non-blocking reference warnings and duplicate/concurrency safety.
- Finalize ST009 rank/score transactionally and idempotently; update Team totals
  by delta and create ScoreEvent/activity evidence.
- Close the exact `finalStartsAt` Check-out race and reconcile before Final,
  Leaderboard, and Excel reads.

### 4. Frontend and Excel

- Update V1/V2/Admin reference display, `???`, score input cap, and warnings.
- Keep ST009 out of pending-score UI.
- Implement the approved one-sheet Excel structure, Warnings column, red score
  fills, ST009 five-column group, and millisecond-safe numeric formats.

### 5. Verification and synchronization

- Add/adjust targeted tests before broad suites. Cover all acceptance cases in
  the Feature Analysis, including negative ST009 score deltas and concurrency.
- Run Prisma generation/migration checks, seed twice, `db:verify`, Backend tests,
  Frontend tests/i18n/font/lint/build, workbook reopen checks, diff checks, and
  Graphify update when available.
- Manually inspect Excel/Google Sheets and browser behavior when the environment
  allows; report skipped checks precisely.
- Update Prompt 12's stale TIME score and max-limit assumptions, then update
  audit/backlog with only verification that actually ran.

## Delivery Rules

- Make the smallest coherent patches; do not refactor unrelated modules.
- Do not expose secrets, reset gameplay, rotate QR, mutate Production, push,
  deploy, or open a PR without a separate explicit request.
- Review status and diff, stage only task files, and create a clear local commit
  after required verification passes. If unrelated staged changes cannot be
  isolated safely, leave the implementation uncommitted and report the blocker.

## Required Final Report

Report in Vietnamese, in the repository completion-report order:

1. Overall status.
2. Task classification and Feature scope.
3. Business Rules applied and conflicts reconciled.
4. Source Code, documentation, migration, and seed changes.
5. User-visible map/scoring/Ba Tiêu/Excel results.
6. Exact tests and verification results, including skipped/failed checks.
7. Remaining risks, Production considerations, and backlog.
8. Local commit hash if created.
9. Confirm that push, deploy, and destructive Git operations were not run.
