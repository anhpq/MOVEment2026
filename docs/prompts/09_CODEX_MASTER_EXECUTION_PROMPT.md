# CODEX MULTI-FEATURE EXECUTION ORCHESTRATOR

## Purpose

This Prompt coordinates a **broad, explicitly requested execution** across multiple MOVEment 2026 Features.

It is an orchestrator only.

It must not replace:

- `AGENTS.md`;
- the Business Rule Source of Truth;
- `FEATURE_INDEX.md`;
- Feature-specific analysis documents;
- Feature-specific Prompts;
- current Source Code inspection.

Do not use this Prompt for a single small Feature, one bugfix, one documentation edit, or one isolated refactor.

For narrowly scoped work, use the smallest relevant Feature Prompt.

---

# 1. Mandatory Authority Order

Before doing any audit, implementation, migration, seed, test, or documentation update, read in this order:

```text
AGENTS.md
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/FEATURE_INDEX.md
docs/prompts/00_WORKFLOW.md
```

Then read the analysis documents and Feature Prompts relevant to the selected execution scope.

Rules:

1. The current direct user request defines the requested scope.
2. `AGENTS.md` controls Agent Operational Instructions.
3. `OPEN_QUESTIONS_AND_DECISIONS.md` controls confirmed Business Rules.
4. `FEATURE_INDEX.md` controls document routing by Feature.
5. `00_WORKFLOW.md` controls Prompt selection and execution workflow.
6. Feature Prompts are implementation checklists only.
7. Graphify is advisory.
8. Source Code is the current implementation and must be inspected before modification.

If a Feature Prompt or current implementation conflicts with a confirmed Business Rule:

1. Report the conflict.
2. Follow `OPEN_QUESTIONS_AND_DECISIONS.md`.
3. Do not silently preserve stale behavior.
4. Update related documentation after implementation and verification.

---

# 2. Execution Scope

Execute only the Features explicitly included in the current user request.

Supported Feature scopes include:

```text
DOCUMENTATION_RECONCILIATION
QR_AUTO_LOGIN
TEAM_QR_TOKEN_AND_SEED
STATION_QR_PROVISIONING
QR_CAMERA_IOS
FINAL_CHALLENGE
STATION_TRACKING_MODE
STATION_SCORING
EVENT_CONFIG
LEADERBOARD
MULTI_FEATURE_VERIFICATION
```

Do not assume `ALL`.

If the user asks for a broad implementation without naming exact Features:

1. Inspect `FEATURE_INDEX.md`.
2. Derive the smallest reasonable Feature set from the requested outcome.
3. State the derived scope before changing Source Code.
4. Do not include unrelated Features.

If the requested scope contains only one Feature, stop using this Master Prompt and route to the relevant Feature Prompt instead.

---

# 3. Feature Prompt Routing

Use repository-root-relative paths.

## Automatic URL QR Login and Team QR Seed

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

Use for:

- `/qr-login?token=...`;
- Team QR Login token generation;
- Team seed tokens;
- token lookup;
- token rotate or revoke;
- authentication exchange;
- public routing;
- auth-state update;
- redirect after login;
- QR Login deployment checks.

---

## Final Challenge

```text
docs/prompts/11_CODEX_FINAL_GAME_KEYWORD_AND_SCORING_PROMPT.md
```

Use for:

- Final keyword;
- answer normalization;
- backend validation;
- first-correct ordering;
- Final rank;
- Final points;
- wrong-answer cooldown;
- duplicate and concurrency protection;
- leaderboard Final bonus.

---

## Station Score Entry and Limits

```text
docs/prompts/12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md
```

Use for:

- score modal after Check-out;
- `SCORE`, `TIME`, and `BOTH`;
- Station max score;
- default max score;
- scoring-code verification;
- backend score validation;
- duplicate completion or score prevention.

---

## Documentation Synchronization

```text
docs/prompts/08_IMPLEMENTATION_SYNC_PROMPT.md
```

Use only after implementation or verification when documentation needs synchronization.

This Prompt must not invent new Business Rules.

---

# 4. Required Analysis Documents

Always use `FEATURE_INDEX.md` to select the exact documents.

Common documents include:

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
```

Do not read every file automatically.

Read only the documents required for the selected Features and shared dependencies.

---

# 5. Pre-Implementation Gate

Before modifying Source Code, complete the following gate.

## 5.1 Scope Report

Report:

```text
Selected Features
Excluded Features
Relevant Business Rules
Relevant analysis documents
Relevant Feature Prompts
Expected backend scope
Expected frontend scope
Expected database or seed scope
Expected deployment scope
```

## 5.2 Conflict Report

Compare:

- direct user request;
- `OPEN_QUESTIONS_AND_DECISIONS.md`;
- relevant Feature analysis;
- relevant Prompt;
- current Source Code.

Classify every meaningful conflict as:

```text
DOCUMENTATION_CONFLICT
IMPLEMENTATION_GAP
LEGACY_BEHAVIOR
UNRESOLVED_BUSINESS_DECISION
SECURITY_RISK
DEPLOYMENT_MISMATCH
```

Do not treat an unresolved Business Rule as permission to guess.

When an unresolved decision blocks safe implementation:

1. State the decision required.
2. Continue only with independent, non-blocked work.
3. Do not implement speculative behavior.

## 5.3 Current Implementation Inventory

Inspect only relevant areas.

Possible layers:

```text
Backend controllers
Backend services
Authentication and guards
Database schema
Migrations
Seed modules
Frontend routes
Frontend pages and components
Auth store or context
API clients
Validation
Nginx or reverse proxy
Environment configuration
Deployment workflow
Tests and smoke scripts
```

Report confirmed current behavior before changing it.

---

# 6. Execution Strategy

Use an audit-first, Feature-by-Feature workflow.

For each selected Feature:

1. Read its required documents.
2. Read its Feature Prompt.
3. Inspect the current implementation.
4. Identify conflicts and gaps.
5. Define the smallest safe implementation.
6. Implement only that Feature's scoped changes.
7. Add or update relevant tests.
8. Run Feature-level verification.
9. Update Feature documentation.
10. Review the diff.
11. Mark the Feature:
   - `COMPLETED`;
   - `PARTIAL`;
   - `BLOCKED`;
   - `NOT_VERIFIED`.
12. Continue to the next Feature only when doing so is safe.

Do not mix multiple Features into one large unverified code change.

---

# 7. Phase Order for Broad Execution

When multiple Features are selected, use dependency-aware ordering.

Recommended order:

```text
Phase 0 — Documentation and Business Rule validation
Phase 1 — Database schema, migrations, constraints, and token model
Phase 2 — Seed and generated-data behavior
Phase 3 — Backend domain and API behavior
Phase 4 — Frontend routes, state, and UI
Phase 5 — Feature-level tests
Phase 6 — Cross-Feature integration verification
Phase 7 — Documentation synchronization
Phase 8 — Git review and local commits
```

This is a dependency order, not permission to modify every layer.

Skip phases that are not relevant.

---

# 8. Cross-Feature Rules

## 8.1 Authentication and Session

All Team login methods must use the confirmed Team session policy.

A new successful Team login must revoke the previous active Team session when that is the confirmed Business Rule.

Do not create a separate incompatible session system for QR Login.

---

## 8.2 Team QR and Station QR Are Different Features

Do not confuse:

```text
Team QR Login
Station CHECK_IN QR
Station CHECK_OUT QR
```

Team QR Login authenticates a Team.

Station QR performs Station gameplay actions.

Their token models, payload formats, validation purpose, and lifecycle may differ.

Do not reuse a token across these purposes.

---

## 8.3 Automatic Token Generation

When creating a Team:

1. Create the Team.
2. Generate the required Team QR Login token.
3. Ensure uniqueness.
4. Persist the secure lookup and verification data.
5. Return or create the required QR artifact safely.

When creating a Station:

1. Create the Station.
2. Generate one independent `CHECK_IN` token.
3. Generate one independent `CHECK_OUT` token.
4. Bind both tokens to the Station and correct database purpose.
5. Roll back if the complete Station QR set cannot be created.

The user must not be required to invent raw QR tokens.

---

## 8.4 Station QR Format

Confirmed Station QR format:

```text
MV26-SQ1-<purposeCode>-<randomToken>
```

Where:

```text
I = CHECK_IN
O = CHECK_OUT
```

The random portion must be cryptographically secure, unique, and not derived from `stationId`.

The backend must resolve Station and purpose from the database token record.

Do not trust the visible `I` or `O` as the authoritative purpose.

Do not use decimal, hexadecimal, Base64, or another direct encoding of `stationId` as the secret portion.

---

## 8.5 Seed

Seed must be:

- idempotent;
- environment safe;
- able to repair missing required token records;
- unable to create unnecessary duplicate active tokens;
- safe to run repeatedly in local/test;
- prevented from introducing local/test secrets into Production automatically.

Generated example values may vary as long as they follow confirmed schema, format, security, and uniqueness rules.

---

## 8.6 Event Config

Do not hard-code fixed Event or Final times when Admin Event Config is authoritative.

A Team must not start a new Station after Event end time.

A Station started before Event end time may be completed according to the confirmed Business Rule.

A Team with an active Station must complete it before entering Final.

---

## 8.7 Backend Authority

Backend must enforce:

- authentication;
- active session;
- QR token validity;
- token revoke and expiry behavior;
- Station state;
- Event time;
- max score;
- Final cooldown;
- ranking uniqueness;
- duplicate protection.

Frontend validation is UX support, not the final authority.

---

# 9. Database and Migration Rules

Before adding a model, field, constraint, or index:

1. Inspect the existing schema.
2. Reuse established naming when appropriate.
3. Check current migrations.
4. Identify existing production data impact.
5. Define backfill or safe default behavior.
6. Use unique constraints for invariants that require uniqueness.
7. Use transactions for atomic multi-record operations.
8. Avoid destructive migration behavior unless explicitly approved.

For token records, evaluate:

- unique fingerprint;
- secure verification hash;
- active state;
- purpose;
- owning Team or Station;
- revoke timestamp;
- optional expiry;
- rotation history or replacement relationship;
- safe QR artifact retrieval strategy.

Do not claim a migration is safe without inspecting existing data assumptions.

---

# 10. Verification Requirements

Verification must be proportional to risk.

## QR Login

Cover relevant cases:

- valid token;
- invalid token;
- missing token;
- revoked token;
- expired token when applicable;
- inactive Team;
- previous session revoke;
- auth-state update;
- redirect;
- page refresh;
- direct route navigation;
- safe visible error.

## Station QR

Cover relevant cases:

- valid Check-in;
- valid Check-out;
- wrong purpose;
- inactive token;
- revoked token;
- duplicate scan;
- Team already playing another Station;
- scan after Event end time;
- completion of a Station started before Event end;
- token uniqueness;
- automatic token creation for a new Station.

## Final Challenge

Cover relevant cases:

- lowercase or mixed-case normalization;
- correct answer;
- wrong answer;
- increasing cooldown;
- concurrent correct submissions;
- unique rank;
- duplicate request;
- one bonus per Team;
- rank 1 through rank 10 points;
- rank 11 and later receive zero Final bonus.

## Station Scoring

Cover relevant cases:

- `SCORE`;
- `TIME`;
- `BOTH`;
- default max score;
- custom max score;
- negative score;
- score above max;
- invalid scoring code;
- duplicate submission;
- backend transaction behavior.

## Seed

When environment permits:

1. Run seed once.
2. Record created or repaired data.
3. Run seed again.
4. Confirm no unintended duplicate records or active tokens.
5. Confirm printed or existing reusable tokens are not rotated unexpectedly.

Do not report a test as passed unless it actually ran.

---

# 11. Documentation Synchronization

After each completed Feature, update only the relevant documents identified by `FEATURE_INDEX.md`.

General rules:

- Update `OPEN_QUESTIONS_AND_DECISIONS.md` only when a Business Rule changes.
- Update `PROJECT_ANALYSIS_SPEC.md` when shared behavior changes.
- Update Feature analysis when Feature behavior changes.
- Update `BACKEND_AUDIT.md` after meaningful implementation or verification.
- Update `IMPLEMENTATION_BACKLOG.md` when status, gap, risk, or Acceptance Criteria changes.
- Update `TEAM_LOGIN_DATA.md` when Team account, credential, seed, or Team QR inventory changes.
- Update `QR_LOGIN.md` and `QR_PAYLOADS.md` when QR Login behavior or format changes.
- Update `IOS_SAFARI_QR_CAMERA_FIX.md` when browser camera behavior changes.
- Update `FEATURE_INDEX.md` only when Feature routing changes.
- Update Prompt files only when repeatable workflow changes.

Do not mark documentation synchronized unless the affected files were reviewed.

---

# 12. Git Strategy

Local commits are allowed according to `AGENTS.md`.

For a broad multi-Feature execution, prefer separate commits when Features are independently verifiable.

Example:

```text
Implement secure QR auto-login

- generate and validate reusable Team QR tokens
- preserve one-active-session behavior
- verify direct QR route and redirect
```

```text
Harden Final Challenge scoring

- enforce atomic rank assignment
- apply 10-to-1 Final bonus
- verify duplicate and concurrent submissions
```

```text
Enforce Station score limits

- apply per-Station max score
- validate SCORE, TIME, and BOTH flows
- prevent duplicate completion records
```

Before each commit:

1. Review `git status`.
2. Review the scoped diff.
3. Stage only related files.
4. Confirm relevant verification.
5. Include documentation generated by that Feature when appropriate.

Do not automatically:

- push;
- deploy;
- open a Pull Request;
- force push;
- reset;
- rewrite history;
- delete branches;
- run destructive Git commands.

---

# 13. Stop Conditions

Stop the affected Feature and report when:

- a required Business Rule is unresolved;
- a destructive migration would be required without approval;
- a production secret is exposed;
- the active database or environment cannot be identified safely;
- existing user changes would need to be overwritten;
- verification reveals a major regression;
- the requested scope conflicts with a direct security rule;
- implementing one Feature would silently change an unrelated Feature.

Continue only with independent work that remains safe.

---

# 14. Final Combined Report

After all selected Features are processed, provide:

```text
1. Execution scope selected
2. Features completed
3. Features partial, blocked, or not verified
4. Business Rules followed
5. Documentation conflicts found
6. Implementation gaps found
7. Security risks found
8. Source Code files changed by Feature
9. Documentation files changed by Feature
10. Database migrations changed
11. Seed behavior changed
12. API behavior changed
13. Frontend routes and UI changed
14. Tests and verification commands executed
15. Exact verification results
16. Manual verification still required
17. Remaining backlog and risks
18. Local commits created
19. Actions not performed: push, deploy, PR, destructive Git operations
```

Do not claim:

- tests passed when they were not run;
- production is fixed when only local behavior was verified;
- documentation is synchronized when relevant files were not reviewed;
- all Features are complete when any selected Feature is partial or blocked.

---

# 15. Definition of Done

The selected multi-Feature execution is Done only when:

- the requested scope was followed;
- no unrelated Feature was silently added;
- confirmed Business Rules were followed;
- conflicts were reported;
- each completed Feature was independently verified;
- cross-Feature integration was verified when required;
- affected documentation was synchronized;
- no secret was exposed;
- no unrelated change was committed;
- final reporting is accurate.

Otherwise report:

```text
PARTIALLY COMPLETED
BLOCKED
NOT VERIFIED
```

instead of claiming full completion.
