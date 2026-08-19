# CODEX STATION SCORE ENTRY LIMITS

> Superseded for Station reference points and Ba Tiêu by
> `13_CODEX_STATION_REFERENCE_POINTS_BA_TIEU_EXCEL_PROMPT.md` (2026-08-19).
> Do not treat a Station reference/max value as a score-entry hard cap, and do
> not treat TIME's provisional `10` as the final ST009 score.

## Purpose

Audit and implement Station tracking-mode and score-entry behavior.

This Prompt covers:

- `SCORE`, `TIME`, and `BOTH`;
- Check-out result handling;
- score-entry modal;
- per-Station reference points;
- default noncanonical reference 30 and global score-entry cap 105;
- score submission without a confirmation code;
- duplicate protection;
- transaction behavior;
- leaderboard integration;
- tests and documentation sync.

## Mandatory Reading

```text
AGENTS.md
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/FEATURE_INDEX.md
docs/prompts/00_WORKFLOW.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

## Confirmed Business Rules

Each Station has:

```text
tracking_mode = SCORE | TIME | BOTH
```

Behavior:

| Mode | Duration | Score entry |
| --- | --- | --- |
| `SCORE` | Does not contribute play duration under the confirmed rule. | Required after Check-out. |
| `TIME` | Real Check-in to Check-out duration. | No modal; backend completes provisionally with score `10`. |
| `BOTH` | Real Check-in to Check-out duration. | Required after Check-out. |

Additional rules:

1. Default noncanonical Station reference is `30`; only ST007 may be null/displayed as `???`.
2. Each Station may configure reference points, which are display data rather than a validation cap.
3. Team/Admin score writes accept integers from `0` to the global `scoreEntryMax = 105`.
4. Backend is authoritative.
5. Frontend min/max is UX only.
6. Score entry occurs on the device logged into the Team account.
7. There is no Staff account or Staff role.
8. Score submission does not require a scoring confirmation code.
9. The retired scoring-code field, hash, configuration, and UI must not be reintroduced.
10. Duplicate request must not create duplicate score or completion.
11. Admin score correction remains a separate audited flow.

## Audit First

Inspect:

Backend:

- Station model/service;
- tracking mode;
- Check-in and Check-out;
- progress state;
- score endpoint;
- DTO validation;
- post-Check-out state validation;
- transaction boundary;
- idempotency;
- leaderboard;
- Admin override.

Frontend:

- QR Check-out flow;
- Station state refresh;
- score modal;
- Team session;
- reference-point display and explicit score-entry cap;
- score input without a confirmation-code field;
- loading and duplicate guard;
- TIME-mode completion UX.

Database and seed:

- tracking mode column;
- nullable reference field/default and global score cap;
- progress timestamps;
- score/completion fields;
- score event/audit table;
- migration;
- Station seed.

Tests:

- each tracking mode;
- score limits;
- duplicate submit;
- score submission without the retired confirmation-code field;
- leaderboard.

## Required Audit Report

```text
1. Existing tracking-mode behavior
2. Existing reference-point field
3. Existing default
4. Check-out response shape
5. When modal opens
6. Confirmation that the retired scoring-code mechanism is absent
7. Completion transaction
8. Duplicate protection
9. Admin correction behavior
10. Tests and gaps
```

## Database and Config

Use existing naming where possible.

A Station reference field equivalent to:

```text
maxScore
```

must default to:

```text
30
```

Migration/backfill must permit null only for ST007 and preserve the canonical reference table.

Do not duplicate the default literal across unrelated frontend components.

Preferred sources:

- database default;
- backend domain constant;
- seed default;
- API-provided value.

## Check-out Flow

### `TIME`

After valid Check-out:

1. record real `checked_out_at`;
2. calculate duration;
3. complete progress;
4. persist provisional score `10`;
5. do not open score modal;
6. refresh Team progress.

### `BOTH`

After valid Check-out:

1. record real `checked_out_at`;
2. preserve duration;
3. leave progress awaiting score without inventing a new official status;
4. open score modal;
5. submit score;
6. complete progress transactionally.

### `SCORE`

After valid Check-out:

1. follow the confirmed no-duration behavior;
2. leave progress awaiting score;
3. open score modal;
4. submit score;
5. complete progress transactionally.

Do not create official statuses named:

```text
WAITING_SCORE
CANCELLED
REOPENED
```

Waiting for score may be derived from timestamps and completion state.

## Score Modal

For `SCORE` and `BOTH` only:

- show Station name;
- show allowed range `0–{scoreEntryMax}`;
- show a non-blocking warning above a non-null Station reference;
- use numeric integer input;
- do not render or require a confirmation code;
- prevent negative value;
- prevent value above the global cap `105`;
- disable submit while pending;
- prevent double-click;
- show safe backend errors;
- close only after success;
- refresh progress and leaderboard-relevant state.

Do not automatically prefill max score unless current UX explicitly requires it.

## Backend Score Validation

Backend must validate:

1. authenticated Team session;
2. Team owns the progress;
3. correct Station;
4. Check-out already completed;
5. progress not already completed;
6. tracking mode accepts score;
7. integer score;
8. score >= 0;
9. score <= global `scoreEntryMax` (`105`);
10. Event/state rules;
11. duplicate request safety.

Complete score, progress, score event, and activity log in one transaction where applicable.

## Retired Scoring Code

Station score submission must not require or accept a scoring confirmation code.

Remove legacy scoring-code fields from DTOs, database/config, environment validation, seed data, frontend UI, tests, and operational scripts.

Do not:

- return the code through API;
- log the code;
- expose it in frontend bundle;
- seed a Production default code;
- treat frontend validation as security.

## Idempotency

Protect against:

- double-click;
- network retry;
- multiple tabs;
- repeated API request;
- stale modal;
- concurrent score submit;
- Check-out retry.

Use unique constraints, state transition checks, transaction locking, idempotency key, or equivalent.

## Admin Correction

Admin score edit is separate from normal Team completion.

Admin correction must:

- require Admin;
- allow correction only when progress is already `COMPLETED`;
- require a non-empty reason;
- change only score fields and Team total delta;
- preserve progress status and all progress timestamps;
- create score event;
- create activity log;
- keep Admin correction separate from Team score submission;
- recalculate leaderboard consistently.

## Required Tests

Tracking mode:

- `TIME` completes provisionally with score 10 and no score endpoint;
- `BOTH` records duration and requires score;
- `SCORE` does not contribute duration and requires score.

Limits:

- missing noncanonical reference defaults to 30;
- custom/null-ST007 reference display works;
- 0 accepted;
- 105 accepted, including above-reference values;
- negative rejected;
- 106 rejected;
- decimal rejected when integer required;
- frontend bypass still rejected by backend.

Security/state:

- score submission succeeds without a confirmation code after valid Check-out;
- retired confirmation-code fields are absent;
- score before Check-out rejected;
- `TIME` score submit rejected;
- duplicate submit does not duplicate completion;
- concurrent submit awards once;
- Admin correction audited.

## Documentation Sync

After implementation:

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Update Source of Truth only when Business Rules change.

## Final Report

```text
1. Current behavior discovered
2. Tracking-mode changes
3. Database/default changes
4. Seed changes
5. Check-out response changes
6. Modal changes
7. Backend validation
8. Retired scoring-code removal
9. Duplicate strategy
10. Admin correction behavior
11. Tests and results
12. Remaining risks
13. Local commit
```
