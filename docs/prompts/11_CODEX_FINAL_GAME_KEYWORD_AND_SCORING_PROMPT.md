# CODEX FINAL GAME KEYWORD AND SCORING

## Purpose

Audit and implement the MOVEment 2026 Final Challenge.

This Prompt covers:

- Event Config integration;
- Final opening;
- keyword seed/config;
- uppercase normalization;
- multiple attempts;
- wrong-answer cooldown;
- atomic first-correct ranking;
- 10-to-1 Final bonus;
- duplicate and concurrency protection;
- leaderboard integration;
- verification and documentation sync.

## Mandatory Reading

```text
AGENTS.md
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/FEATURE_INDEX.md
docs/prompts/00_WORKFLOW.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

This Prompt is not the Business Rule Source of Truth.

## Confirmed Business Rules

1. Final keyword is:

```text
DISANVANHOA2026
```

2. Frontend and backend trim and uppercase input.
3. Backend validates the answer.
4. Final opens according to current Admin Event Config end time.
5. Do not hard-code `11:30`, `11:45`, or another fixed Final time.
6. A Team cannot start a new Station after Event end time.
7. A Team that checked in before Event end may finish that Station.
8. A Team with an active Station must finish it before entering Final.
9. Team does not need to complete every Station before Final.
10. Team may submit multiple attempts until correct or Event closes.
11. Wrong-answer cooldown increases from 1 second to a maximum of 10 seconds.
12. Backend enforces cooldown.
13. First correct database-confirmed submission receives rank 1.
14. Rank points are:

```text
Rank 1  = 10
Rank 2  = 9
...
Rank 10 = 1
Rank 11+ = 0
```

15. One Team receives at most one Final rank and one Final bonus.
16. One rank value cannot be assigned to multiple Teams.
17. Final bonus is included in total leaderboard score.

## Audit First

Inspect:

Backend:

- Event Config service;
- Final controller/service;
- submission DTO;
- answer normalization;
- cooldown storage;
- rank assignment;
- transaction and constraints;
- leaderboard;
- activity log;
- Team active-Station validation.

Frontend:

- Final route/page;
- availability state;
- active-Station blocking UX;
- input normalization;
- submit loading state;
- cooldown display;
- success/failure state;
- leaderboard refresh.

Database and seed:

- Event Config model;
- Final config/keyword model;
- Final submission model;
- unique constraints;
- indexes;
- migrations;
- seed idempotency.

Tests:

- Event-end availability;
- normalization;
- cooldown;
- duplicate requests;
- concurrent correct submissions;
- rank points;
- leaderboard.

## Required Audit Report

Report:

```text
1. Current Final opening rule
2. Any fixed-time Legacy behavior
3. Keyword storage
4. Seed behavior
5. Current cooldown behavior
6. Current rank assignment strategy
7. Unique constraints
8. Duplicate protection
9. Leaderboard integration
10. Existing tests and gaps
```

## Seed Requirements

Seed keyword/config using a stable unique key.

Seed must be idempotent.

Do not rely on frontend-only keyword.

Do not create duplicate Final configuration rows.

Store answer according to current secure configuration architecture. Do not expose answer/hash through public list APIs.

## Frontend Requirements

Input behavior:

```text
disanvanhoa2026 -> DISANVANHOA2026
DiSanVanHoa2026 -> DISANVANHOA2026
```

Frontend must:

- uppercase while typing;
- trim before submit;
- keep digits;
- disable submit while pending;
- prevent double-click;
- show backend cooldown;
- show safe error;
- not decide rank locally;
- not award points locally.

## Backend Validation

Backend must:

1. authenticate Team;
2. check Event Config;
3. check Final is open;
4. reject Team with active Station;
5. normalize answer;
6. enforce cooldown;
7. compare configured keyword;
8. atomically persist first correct submission;
9. atomically assign unique rank;
10. calculate bonus;
11. prevent duplicate award;
12. return normalized result.

## Wrong-Answer Cooldown

Use backend-authoritative cooldown.

Confirmed progression:

```text
minimum 1 second
increases after wrong attempts
maximum 10 seconds
```

The exact formula may follow current implementation if it satisfies the confirmed range and is documented.

Concurrent requests must not bypass cooldown.

## Ranking and Concurrency

Use a transaction, row lock, sequence, unique constraint, serializable operation, or equivalent database-safe strategy.

Guarantees:

- one rank per Team;
- one Team per rank;
- first committed correct submission wins;
- retry does not award twice;
- first-correct timestamp is not overwritten;
- rank 11+ records 0 bonus without duplicate rank behavior.

Do not calculate rank only by `count + 1` without concurrency protection.

## Required Tests

Backend:

- Final closed before Event end;
- Final opens at Event end;
- active-Station Team blocked;
- finished Station Team allowed;
- lowercase accepted;
- mixed case accepted;
- surrounding spaces handled;
- wrong keyword rejected;
- cooldown starts at 1 second;
- cooldown never exceeds 10 seconds;
- duplicate correct request does not award twice;
- concurrent submissions get unique ranks;
- rank 1 gets 10;
- rank 10 gets 1;
- rank 11 gets 0;
- leaderboard includes bonus.

Seed:

- keyword exists;
- repeated seed does not duplicate config.

Frontend:

- input uppercases;
- submit disables while pending;
- cooldown displays;
- success and error states render.

## Documentation Sync

After implementation:

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Update Source of Truth only when the Business Rule changes.

## Final Report

```text
1. Current behavior discovered
2. Fixed-time behavior removed or remaining
3. Keyword and seed changes
4. Event Config changes
5. Backend validation changes
6. Cooldown strategy
7. Ranking/concurrency strategy
8. Frontend changes
9. Leaderboard changes
10. Tests executed and results
11. Remaining risks
12. Local commit
```

Do not claim Production behavior is fixed without active-environment verification.
