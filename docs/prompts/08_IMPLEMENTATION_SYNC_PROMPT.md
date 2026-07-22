# CODEX IMPLEMENTATION SYNC

## Purpose

Synchronize MOVEment 2026 documentation after implementation or verification.

Use this Prompt only after Source Code, migration, seed, test, smoke test, or production verification has actually been performed.

This Prompt must not invent Business Rules, implementation status, test results, or deployment results.

## Mandatory Reading

Read:

```text
AGENTS.md
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/FEATURE_INDEX.md
docs/prompts/00_WORKFLOW.md
```

Then read only the Feature documents selected by `FEATURE_INDEX.md`.

Always inspect:

```text
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

## Sync Rules

1. Direct user request defines the current task.
2. `OPEN_QUESTIONS_AND_DECISIONS.md` defines confirmed Business Rules.
3. Source Code defines current implementation, not desired Business Rules.
4. Test output defines verification status.
5. Historical audit entries must not be rewritten as though they never happened.
6. Unverified behavior must remain `NOT VERIFIED`.
7. A documentation-only change must not mark a code backlog item completed.
8. Update Prompt files only when the repeatable checklist changes.

## Required Classification

Classify each item as:

```text
CONFIRMED_IMPLEMENTED
CONFIRMED_NOT_IMPLEMENTED
PARTIALLY_IMPLEMENTED
VERIFIED
NOT_VERIFIED
BLOCKED
LEGACY
DOCUMENTATION_ONLY
```

## Files to Update

Update only affected files.

Business Rule change:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

Shared behavior change:

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
```

Feature implementation or verification:

```text
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Team login, seed, or QR inventory:

```text
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
```

iOS camera behavior:

```text
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
```

Feature routing change:

```text
docs/analysis/FEATURE_INDEX.md
```

## Audit Update

Add a dated entry containing:

```text
Feature
Task classification
Current behavior before change
Files changed
Migration or seed changed
Tests executed
Exact results
Manual verification
Known gaps
Graphify status when relevant
Commit hash when available
```

Do not delete old audit evidence.

## Backlog Update

For each Acceptance item:

- mark `[x]` only when implementation and required verification are complete;
- keep `[ ]` when only documentation changed;
- add an explicit dependency when blocked;
- replace obsolete Legacy acceptance examples with current official formats;
- preserve external deployment handoff items until verified on the active environment.

## Conflict Handling

When documentation and implementation conflict:

1. record the confirmed Business Rule;
2. record the observed implementation;
3. classify the difference as an Implementation Gap;
4. do not rewrite audit history;
5. do not mark the gap complete;
6. route future implementation through the smallest relevant Feature Prompt.

## Required Verification

For documentation sync:

```text
git diff --check
review changed Markdown
check repository-relative paths
check Source of Truth consistency
```

For implementation sync, include the actual commands that ran.

Do not write `tests passed` without command output.

## Final Report

Report:

```text
1. Feature synchronized
2. Source evidence reviewed
3. Business Rules used
4. Implementation status
5. Verification status
6. Documentation files changed
7. Backlog items changed
8. Audit entry added
9. Conflicts remaining
10. Actions not performed
```
