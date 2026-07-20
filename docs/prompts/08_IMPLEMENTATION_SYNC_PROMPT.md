# Prompt 08 - Implementation Sync

## Context

Use this prompt after a coding, database, deployment, verification, or smoke-test task. Its job is to keep project memory accurate so the next run starts from the real current state instead of stale assumptions.

Read these first:

- `docs/analysis/PROJECT_ANALYSIS_SPEC.md`
- `docs/analysis/IMPLEMENTATION_BACKLOG.md`
- `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`
- Any focused audit/runbook file related to the task, such as `BACKEND_AUDIT.md` or `TEAM_LOGIN_DATA.md`

## Task

Summarize what changed and decide which analysis files must be updated.

Update only the files whose facts changed:

- `IMPLEMENTATION_BACKLOG.md`: check off completed P0/P1 items, add newly discovered gaps, or move priorities.
- `BACKEND_AUDIT.md`: record backend verification, DB migration/seed state, smoke tests, known warnings, and next recommended backend task.
- `OPEN_QUESTIONS_AND_DECISIONS.md`: record new product/technical decisions, especially when they override older prompts.
- `PROJECT_ANALYSIS_SPEC.md`: update only when accepted product behavior or core flow changed.
- Focused runbooks such as `TEAM_LOGIN_DATA.md`: update credentials, QR payloads, local setup steps, and smoke-test data.

## Rules

- Do not rewrite prompts for ordinary implementation work.
- Update `docs/prompts/` only when the workflow, checklist, or repeatable task pattern changes.
- Keep verification claims concrete: include command names, pass/fail status, and relevant counts such as team/station/token totals.
- Mark anything unverified as unverified.
- If a code change affects Graphify, routing, DB setup, auth, QR, scoring, or deployment, make the corresponding docs update in the same task.

## Output

Return a concise implementation sync note:

- Files updated
- Verification completed
- Remaining gaps
- Suggested commit title and detail
