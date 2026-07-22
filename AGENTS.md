# MOVEment2026 Agent Instructions

## Role of This File

`AGENTS.md` is the **Source of Truth for Agent Operational Instructions** in this repository.

It defines:

- how agents must start a task;
- how requests are classified and routed;
- which documentation must be read;
- when Graphify should be used;
- how Source Code may be changed;
- how verification must be performed;
- when documentation must be synchronized;
- which Git actions are allowed or prohibited.

`AGENTS.md` is **not** the Source of Truth for product Business Rules.

Confirmed Business Rules are stored in:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

Feature-specific document routing is stored in:

```text
docs/analysis/FEATURE_INDEX.md
```

Prompt selection and execution workflow are stored in:

```text
docs/prompts/00_WORKFLOW.md
```

---

# 1. Instruction Priority

Apply repository guidance in this order:

1. Current direct user request.
2. `AGENTS.md` for agent operational behavior.
3. `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md` for confirmed Business Rules.
4. `docs/analysis/FEATURE_INDEX.md` for Feature routing.
5. Relevant project and Feature analysis documents.
6. Relevant Prompt file.
7. Graphify output when useful.
8. Current Source Code and configuration.

These levels have different responsibilities.

Do not interpret this list as permission to ignore Source Code.

Always inspect the current implementation before changing it.

If Source Code conflicts with a confirmed Business Rule:

1. Report the conflict clearly.
2. Follow the confirmed Business Rule for the requested implementation.
3. Do not silently preserve stale behavior.
4. Update the relevant documentation after verification.

Graphify is advisory only.

Graphify must not override:

- direct user instructions;
- `AGENTS.md`;
- confirmed Business Rules;
- security requirements;
- architecture decisions already accepted by the project;
- verified Source Code behavior.

---

# 2. Mandatory Task Start

Before substantive implementation, verification, audit, or documentation reconciliation:

1. Read `AGENTS.md`.
2. Read `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`.
3. Read `docs/analysis/FEATURE_INDEX.md`.
4. Classify the task.
5. Locate the Feature in `FEATURE_INDEX.md`.
6. Read only the relevant analysis documents.
7. Read `docs/prompts/00_WORKFLOW.md` when Prompt selection or workflow is relevant.
8. Choose the smallest suitable Prompt.
9. Inspect the current Source Code.
10. Compare direct request, Business Rules, documentation, and implementation.
11. Report meaningful conflicts before making risky changes.
12. Make the smallest safe change that satisfies the task.

Do not read every document or every Source Code file for a narrowly scoped task.

Do not run a Master Prompt when one Feature Prompt is sufficient.

---

# 3. Request Classification

Classify the request before substantive work.

Supported classifications:

```text
Business Rule Change
Implementation Fix
Documentation Reconciliation
Analysis or Audit
Refactor
New Feature
Small Scoped Change
```

## Business Rule Change

Examples:

- changing Final scoring;
- changing Station score limits;
- changing session policy;
- changing token lifecycle;
- changing when Final opens.

Required behavior:

1. Update `OPEN_QUESTIONS_AND_DECISIONS.md` first.
2. Update related analysis documents.
3. Update Prompt files only when the repeatable workflow changes.
4. Change implementation.
5. Verify.
6. Update audit and backlog.

## Implementation Fix

Examples:

- QR auto-login does not redirect;
- a Station is created without QR tokens;
- max score is not enforced;
- duplicate Final rank is created.

Required behavior:

1. Confirm the existing Business Rule.
2. Inspect the current implementation.
3. Find the root cause.
4. Implement the smallest safe fix.
5. Add or update tests where appropriate.
6. Verify.
7. Update audit and backlog.

Do not edit the Business Rule Source of Truth when the rule itself did not change.

## Documentation Reconciliation

Examples:

- two documents specify different QR formats;
- Legacy Staff behavior remains in a Prompt;
- fixed Final times remain in old analysis;
- document paths are incorrect.

Required behavior:

1. Do not modify Source Code unless explicitly requested.
2. Use `OPEN_QUESTIONS_AND_DECISIONS.md` as the Business Rule authority.
3. List meaningful conflicts.
4. Synchronize the affected documents.
5. Record unresolved implementation gaps in `IMPLEMENTATION_BACKLOG.md`.
6. Review the documentation diff.

## Analysis or Audit

Required behavior:

- inspect all relevant layers;
- separate confirmed facts from inference;
- identify unknowns;
- do not claim verification that was not performed;
- do not modify code when the user requested analysis only.

## Refactor

Required behavior:

- confirm that no Business Rule change is intended;
- preserve externally visible behavior;
- keep scope bounded;
- verify affected paths;
- update audit documentation when architecture changes meaningfully.

## New Feature

Required behavior:

1. Confirm Business Rules.
2. Add the Feature to `FEATURE_INDEX.md`.
3. Create or update Feature analysis when required.
4. Add Acceptance Criteria and backlog.
5. Implement.
6. Verify.
7. Synchronize documentation.

---

# 4. Request Routing and Delegation

Keep the task in the primary agent when it is:

- ambiguous;
- multi-component;
- architectural;
- authentication or security related;
- database or configuration related;
- dependency sensitive;
- externally consequential;
- likely to cause regressions;
- dependent on cross-module context.

Delegate only when the work is:

- clearly bounded;
- reversible or read-only;
- low-risk;
- limited to one small area;
- independently verifiable.

If uncertain, keep the task in the primary agent.

Do not split one simple task across multiple workers.

## Default Model Lanes

- Bug fix, refactor, code review, or scoped Feature implementation: GPT-5.5 lane, or the lowest-cost capable lane when explicitly configured.
- Architecture design, root-cause analysis, security review, broad research, or long specification work: GPT-5.6 lane in the primary agent.
- Do not downgrade authentication, security, database migration, or destructive tasks to an incapable lane merely to save quota.

Model selection does not change documentation priority or verification requirements.

---

# 5. Project Documentation

## Required Core Documents

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/FEATURE_INDEX.md
docs/prompts/00_WORKFLOW.md
```

## Shared Project Analysis

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
```

Read when the task affects:

- multiple Features;
- shared domain behavior;
- Player flow;
- Admin flow;
- Event timing;
- leaderboard;
- end-to-end behavior.

## Implementation Status

```text
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Use these files to understand:

- what was implemented;
- what was verified;
- known failures;
- outstanding risks;
- remaining Acceptance Criteria;
- operational handoff details.

## Account and Seed Data

```text
docs/analysis/TEAM_LOGIN_DATA.md
```

Read when the task affects:

- Team accounts;
- username/password login;
- Team QR Login;
- local/test credentials;
- seed behavior;
- generated token inventory.

## QR Feature Documents

```text
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
```

Read only when relevant to the requested QR Feature.

Do not treat Legacy QR examples as active Business Rules without checking `OPEN_QUESTIONS_AND_DECISIONS.md`.

---

# 6. Prompt Usage

Prompt files are execution checklists.

Prompt files are not Business Rule sources.

Use the smallest Prompt that fully covers the task.

Prompt routing is defined in:

```text
docs/prompts/00_WORKFLOW.md
docs/analysis/FEATURE_INDEX.md
```

Rules:

- Do not run `09_CODEX_MASTER_EXECUTION_PROMPT.md` for a single small Feature.
- Do not run all Prompts sequentially by default.
- Do not let an old Prompt override a confirmed Business Rule.
- Update a Prompt only when its repeatable workflow or checklist changes.
- Do not rewrite Prompts after every ordinary code fix.
- Use repository-root-relative document paths in Prompts.

---

# 7. Graphify

This project may contain a knowledge graph under:

```text
graphify-out/
```

Use Graphify when it will reduce raw Source Code browsing for:

- architecture review;
- dependency tracing;
- cross-module analysis;
- call-path discovery;
- broad refactor planning;
- identifying related modules.

Recommended commands when available:

```text
graphify query "<focused question>"
graphify path "<A>" "<B>"
graphify explain "<concept>"
```

If `graphify-out/graph.json` is missing and Graphify is required:

```text
graphify . --code-only
```

## Graphify Rules

- If the user explicitly types `/graphify`, use the installed Graphify workflow before other project analysis for that request.
- Prefer focused `query`, `path`, or `explain` operations over reading the entire graph report.
- Prefer `graphify-out/wiki/index.md` for broad navigation when it exists.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when focused commands are insufficient.
- Dirty generated Graphify files are not automatically an error.
- Do not run Graphify for a small documentation edit or obvious single-file fix.
- Do not stop the task merely because Graphify is unavailable.
- If Graphify is unavailable, inspect documentation and Source Code directly.
- Report Graphify unavailability only when Graphify would have been materially useful.
- Never claim Graphify was updated unless the update command actually succeeded.

After meaningful Source Code changes, run when available:

```text
graphify update .
```

If the existing graph cannot be updated:

```text
graphify . --code-only
```

Do not regenerate Graphify output unnecessarily for documentation-only work.

---

# 8. Source Code Work

Read Source Code only after the applicable instructions and Feature context are clear.

When editing:

- preserve existing framework choices and project structure;
- preserve naming and module boundaries unless the task requires change;
- keep changes narrowly scoped;
- avoid unrelated refactors;
- avoid metadata churn;
- do not revert user changes;
- do not modify Source Code for a documentation-only request;
- do not hard-code secrets or exposed raw tokens;
- do not hard-code Event time when Event Config is authoritative;
- do not generate predictable QR tokens from Team ID or Station ID;
- do not decide Station QR purpose only from the visible payload purpose code;
- use backend validation for security and Business Rules;
- treat frontend validation as UX support;
- use transactions when one operation must create several records atomically;
- return safe user-facing errors without stack traces or secrets.

## Generated Team and Station Data

When Business Rules permit automatic generation:

- Codex may generate local/test example data.
- Exact sample values are not Business Rules unless the user explicitly fixes them.
- Generated values must follow schema, format, uniqueness, security, idempotency, and environment-safety rules.
- Creating a Team must provision its required Team QR Login token.
- Creating a Station must provision one `CHECK_IN` token and one `CHECK_OUT` token.
- The user must not be required to manually invent raw QR tokens.
- Production secrets must not be introduced through local/test seed behavior.

Detailed token policy remains in:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

---

# 9. Verification

Verify in proportion to risk.

## Documentation-Only Change

At minimum:

- review the diff;
- check headings;
- check repository-relative paths;
- check cross-document consistency;
- check that no Business Rule was accidentally changed;
- check rendered Markdown when useful.

## Narrow Source Code Change

At minimum:

- run the smallest relevant test, build, lint, or typecheck;
- inspect the affected error path;
- verify no unrelated files changed.

## Authentication, QR, Session, or Security Change

Verify relevant cases such as:

- valid token;
- invalid token;
- revoked token;
- expired token when expiry applies;
- inactive Team or Station;
- duplicate request;
- active-session revoke behavior;
- wrong QR purpose;
- missing token;
- safe error response;
- frontend auth-state and redirect behavior.

## Database or Seed Change

Verify:

- migration or schema validity;
- required constraints and indexes;
- transaction behavior;
- seed output;
- environment guard;
- seed idempotency by running it more than once when possible;
- missing-token repair behavior;
- no duplicate active token creation.

## Cross-Module or User-Facing Change

Broaden verification across affected backend, frontend, database, routing, and deployment paths.

If verification cannot run:

1. State the exact command or check that could not run.
2. State the exact reason.
3. State what remains unverified.
4. Do not claim the task fully passed verification.

---

# 10. Documentation Synchronization

After implementation or verification, update only the documents affected by the work.

Use `FEATURE_INDEX.md` to determine the required files.

General rules:

- Update `OPEN_QUESTIONS_AND_DECISIONS.md` only when a Business Rule changes.
- Update `PROJECT_ANALYSIS_SPEC.md` when shared behavior changes.
- Update Feature-specific analysis when that Feature behavior changes.
- Update `BACKEND_AUDIT.md` after meaningful implementation or verification.
- Update `IMPLEMENTATION_BACKLOG.md` when status, gap, risk, or Acceptance Criteria changes.
- Update `TEAM_LOGIN_DATA.md` when account, credential, seed, or Team QR inventory changes.
- Update `FEATURE_INDEX.md` when documentation routing or Feature inventory changes.
- Update Prompt files only when repeatable execution workflow changes.

Do not claim documentation is synchronized unless the related files were actually reviewed.

---

# 11. Git Autonomy

The user allows Codex to create local Git commits for completed project work without asking again when:

- the commit contains only in-scope changes;
- verification appropriate to the risk has completed;
- relevant documentation is synchronized;
- no secret or unrelated file is staged;
- known failures are not hidden.

Before committing:

1. Review `git status`.
2. Review the diff.
3. Stage only task-related files.
4. Verify the work.
5. Use a clear imperative commit title.
6. Use a detailed bullet body when useful.

Commit message format:

```text
<short imperative title>

- <specific completed change>
- <verification or smoke-test result>
- <documentation or Graphify update when relevant>
```

Do not automatically:

- push;
- deploy;
- open a Pull Request;
- force push;
- reset;
- rewrite history;
- delete branches;
- run destructive Git commands.

These actions require an explicit user request.

---

# 12. Completion Report

After completing a task, report:

```text
1. Task classification
2. Feature and scope
3. Business Rules followed
4. Conflicts found
5. Source Code files changed
6. Documentation files changed
7. Migration or seed changes
8. Tests and verification performed
9. Verification not performed
10. Remaining risks or backlog
11. Local commit created
12. Actions not performed: push, deploy, destructive Git operations
```

The report must distinguish:

```text
Completed
Partially completed
Not verified
Blocked
Out of scope
```

Do not claim a test passed unless it actually ran.

Do not claim a deployment change is active unless the active environment was verified.

---

# 13. Definition of Done

A task is Done only when:

- the direct user request is satisfied;
- confirmed Business Rules are followed;
- meaningful conflicts are reported;
- implementation scope is appropriate;
- relevant verification has run;
- affected documentation is synchronized;
- no secrets are exposed;
- no unrelated change is included;
- remaining risk is clearly reported;
- the final report accurately reflects what was done.

If these conditions cannot be met, report the task as partial or blocked instead of fully complete.
