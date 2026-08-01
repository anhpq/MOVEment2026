# MOVEment 2026 - Feature Index

## Purpose

This file is the main navigation index for MOVEment 2026 documentation.

Codex, Claude Code, ChatGPT, and developers should use this file to determine:

- which documents must be read for a Feature;
- which Prompt is responsible for implementation;
- which documents must be updated after a change;
- where conflicts must be reported;
- which files are historical references only.

This file is a navigation document.

It is **not** the Source of Truth for Business Rules.

The official Business Rule Source of Truth is:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

---

## Global Reading Priority

Before implementing or changing any Feature, use this order:

1. Read `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`.
2. Read this file and locate the relevant Feature.
3. Read the listed Feature-specific analysis documents.
4. Read `docs/analysis/PROJECT_ANALYSIS_SPEC.md` when the change affects shared flow or project-wide behavior.
5. Read `docs/analysis/BACKEND_AUDIT.md` to understand current implementation history.
6. Read the relevant Prompt only after understanding the confirmed Business Rules.
7. Inspect the current Source Code before making changes.

If documentation conflicts:

```text
OPEN_QUESTIONS_AND_DECISIONS.md wins.
```

If Source Code conflicts with confirmed Business Rules:

1. Report the conflict.
2. Do not silently preserve the old behavior.
3. Implement only after the required scope is understood.
4. Update related documentation after verification.

---

## Documentation Roles

| File | Role |
| --- | --- |
| `OPEN_QUESTIONS_AND_DECISIONS.md` | Source of Truth for confirmed Business Rules. |
| `FEATURE_INDEX.md` | Navigation and document routing by Feature. |
| `PROJECT_ANALYSIS_SPEC.md` | Project-wide functional analysis and shared flow. |
| `BACKEND_AUDIT.md` | Technical implementation history and audit notes. |
| `IMPLEMENTATION_BACKLOG.md` | Remaining work, gaps, risks, and implementation priorities. |
| `AGENT_SKILLS_ANALYSIS.md` | Project-local skill inventory, admission decisions, overrides, and validation evidence. |
| `TEAM_LOGIN_DATA.md` | Team login and local/test account data reference. |
| `QR_LOGIN.md` | Feature analysis for Automatic URL QR Login. |
| `QR_PAYLOADS.md` | QR payload formats, Legacy formats, and migration references. |
| `IOS_SAFARI_QR_CAMERA_FIX.md` | Browser and camera compatibility analysis for iOS QR scanning. |
| `*_ANALYSIS.md` | Feature implementation analysis, status, verification, provenance, and seven-round decision log. |
| `docs/prompts/*.md` | Task execution instructions. Prompt files are not Business Rule sources. |

---

## Feature Analysis Lifecycle

- Feature plans live directly in `docs/analysis` as `*_ANALYSIS.md` files.
- `.kilo/plans` is not a planning source or destination.
- Completed analysis remains in place and records implementation, runtime, and
  browser/manual verification statuses separately.
- A Feature Analysis is not a Business Rule authority. When it conflicts with
  `OPEN_QUESTIONS_AND_DECISIONS.md`, the confirmed Business Rule wins.
- Every new or materially revised plan follows the seven-round Plan Mode workflow
  defined in `AGENTS.md` and `docs/prompts/00_WORKFLOW.md`.

| Analysis | Feature coverage |
| --- | --- |
| `EVENT_TIMING_AND_FINAL_ANALYSIS.md` | Event start/end, Final start, and Station lock behavior. |
| `EXCEL_EXPORT_AND_TEAM_COLOR_ANALYSIS.md` | Team Results Excel export and Team Color UI. |
| `GAMEPLAY_RESET_AND_STATION_SEED_ANALYSIS.md` | Guarded gameplay reset and canonical Station seed/sync. |
| `STATION_MAP_ANALYSIS.md` | Station map markers, position persistence, and WebP delivery. |
| `STATION_MEDIA_GALLERY_ANALYSIS.md` | Ordered Station image URLs, Admin management, Player gallery, and action layout. |
| `STATION_QR_AND_SCORING_ANALYSIS.md` | Station QR auto-submit, checkout, and scoring. |
| `TEAM_GAMEPLAY_V2_ANALYSIS.md` | Parallel Team Gameplay V2 screen, unified QR action, dedicated persistent scanner, QR badge, V2-owned Station Detail/gallery overlays, responsive HUD, and V2 navigation. |
| `TEAM_QR_AND_PLAYER_NAVIGATION_ANALYSIS.md` | Reusable Team QR, live counts, polling, and bottom navigation. |
| `TEAM_RUNTIME_STABILITY_AND_DATA_LOADING_ANALYSIS.md` | Lean Team APIs, adaptive polling, error resilience, concurrency hardening, and Team bundle/data budgets. |
| `FRONTEND_LOCALIZATION_ANALYSIS.md` | Vietnamese/English Frontend localization. |
| `AGENT_SKILLS_ANALYSIS.md` | Codex project-local skills, runtime-skill boundaries, admission gate, and workflow validation. |

---

# Feature Routing

## 1. Authentication and Session

### Scope

- Admin login.
- Team username/password login.
- Team QR Login.
- One active session per Team.
- Session revoke when Team logs in again.
- Authentication error handling.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/BACKEND_AUDIT.md
```

### Read When QR Login Is Included

```text
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
```

### Relevant Prompts

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

### Must Update After Change

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Update `TEAM_LOGIN_DATA.md` only when local/test Team data changes.

---

## 2. Automatic URL QR Login

### Scope

- Team QR URL format.
- `/qr-login` frontend route.
- Token extraction.
- Backend QR authentication endpoint.
- Team session creation.
- Redirect after successful login.
- Token revoke and rotation.
- Missing token repair.
- Seed token generation.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Relevant Prompt

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

### Important Rule

Automatic URL QR Login is different from Legacy token-only QR Login.

Do not merge both flows silently.

Any migration or compatibility behavior must be documented explicitly.

### Must Update After Change

```text
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Update `OPEN_QUESTIONS_AND_DECISIONS.md` only when Business Rules change.

---

## 3. QR Camera Scanning

### Scope

- Camera permission.
- HTTPS and secure context.
- `navigator.mediaDevices.getUserMedia`.
- Native `BarcodeDetector`.
- `jsQR` fallback.
- Safari on iPhone.
- Chrome on iOS.
- Manual token entry fallback.
- Camera error and retry UX.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
docs/analysis/QR_LOGIN.md
docs/analysis/BACKEND_AUDIT.md
```

### Related Prompt

Use the Prompt responsible for the QR Feature being changed.

Do not create a new QR camera Prompt unless the work is large enough to require a separate execution task.

### Must Update After Change

```text
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 4. Team and Seed Data

### Scope

- Local/test Admin account.
- Local/test Team accounts.
- Team QR tokens.
- Seed idempotency.
- Missing token repair.
- Environment safety.
- Generated example data.
- Credentials and token reporting for local use.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Related Prompt

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

### Important Rule

Exact sample values are implementation/test data, not Business Rules.

Codex may generate Team names, usernames, passwords, IDs, QR tokens, and other test values when they are not explicitly fixed.

Generated values must:

- follow the required schema;
- follow the confirmed token format;
- remain unique;
- remain safe for local/test use;
- not be automatically introduced into Production.

### Must Update After Change

```text
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 5. Station Management

### Scope

- Create Station.
- Update Station.
- Activate or deactivate Station.
- Tracking mode.
- Max score.
- Station QR provisioning.
- Missing QR repair.
- QR rotation and revoke.
- Admin Station configuration.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Important Rule

When a new Station is created, the system must automatically create:

```text
1 CHECK_IN token
1 CHECK_OUT token
```

The user must not be required to manually create raw Station QR tokens.

### Token Format

```text
MV26-SQ1-<purposeCode>-<randomToken>
```

`purposeCode`:

```text
I = CHECK_IN
O = CHECK_OUT
```

The database token record, not the visible purpose code, is the Source of Truth for Station and purpose mapping.

### Must Update After Change

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 6. Station Check-in and Check-out

### Scope

- Scan Check-in QR.
- Scan Check-out QR.
- Validate token.
- Resolve Station and purpose from database.
- Validate Team state.
- Validate Event time.
- Prevent a Team from playing multiple Stations simultaneously.
- Complete, cancel, or reject Station flow.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Business Rules to Confirm Before Work

- Team may play only one Station at a time.
- Check-in and Check-out tokens are independent.
- Backend determines purpose from database.
- Token must be active and valid.
- Team cannot start a new Station after Event end time.
- A Station started before Event end time may be completed.

### Must Update After Change

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 7. Station Tracking Mode

### Scope

```text
SCORE
TIME
BOTH
```

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
```

### Confirmed Behavior

| Mode | Time | Score input |
| --- | --- | --- |
| `SCORE` | Stores accepted Check-out QR scan time but does not contribute duration under the confirmed Business Rule. | Required after Check-out. |
| `TIME` | Uses real Check-in to accepted Check-out QR scan duration. | Not required; score completes as `10`. |
| `BOTH` | Uses real Check-in to accepted Check-out QR scan duration. | Required after Check-out. |

### Relevant Prompt

```text
docs/prompts/12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md
```

### Must Update After Change

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 8. Station Scoring

### Scope

- Score entry after Check-out.
- Score submission after a valid Check-out without a confirmation code.
- Station maximum score.
- Default maximum score.
- Backend validation.
- Duplicate submission protection.
- Completion and score transaction behavior.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Relevant Prompt

```text
docs/prompts/12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md
```

### Confirmed Rules

- Default max score is `30` unless the Station has its own configuration.
- Score cannot be negative.
- Score cannot exceed effective Station max score; `TIME` effective max is `10`.
- Backend is the final validation authority.
- Duplicate submissions must not create duplicate completion or score records.
- The retired scoring-code field, hash, configuration, and UI must not be reintroduced.
- Admin score correction always requires a non-empty reason and preserves
  progress status plus all Check-in, Check-out, and completion timestamps.
- Admin score correction is available only for an already `COMPLETED` progress.

### Must Update After Change

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 9. Event Config and Event Time

### Scope

- Event start time.
- Event end time.
- Final start time.
- Admin Event Config.
- Station start restrictions.
- Final opening time.
- Behavior for a Station already in progress.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Confirmed Rules

- Do not hard-code `11:30`, `11:45`, or another fixed time.
- Final opens according to the configured `finalStartsAt` time.
- `eventEndTime` closes new Station check-ins and does not open Final.
- A Team cannot begin a new Station after Event end time.
- A Team that started before Event end time may finish the current Station.
- A Team with an active Station must finish it before entering Final.

### Must Update After Change

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 10. Final Challenge

### Scope

- Final opening.
- Final keyword.
- Keyword normalization.
- Multiple attempts.
- Wrong-answer cooldown.
- First-correct ordering.
- Final rank.
- Final points.
- Duplicate submission protection.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Relevant Prompt

```text
docs/prompts/11_CODEX_FINAL_GAME_KEYWORD_AND_SCORING_PROMPT.md
```

### Confirmed Rules

- Final keyword: `DISANVANHOA2026`.
- Frontend and backend normalize to uppercase.
- Backend determines correctness.
- Database-confirmed first-correct order determines rank.
- Top 10 receive points from 10 down to 1.
- Rank 11 and later receive 0 Final points.
- Wrong-answer cooldown increases from 1 second to a maximum of 10 seconds.
- A Team must never receive Final rank or bonus twice.

### Must Update After Change

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 11. Leaderboard

### Scope

- Total score.
- Total play duration.
- Number of completed Stations.
- Final bonus.
- Tie-break rules.
- Recalculation and caching.
- API output.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
```

### Confirmed Ordering

1. Total score descending from `team.totalPoints`.
2. Total play duration ascending from `team.totalPlaySeconds`.
3. Completed Station count descending.
4. Correct Final submitted time ascending, nulls last.
5. Team Code ascending, currently numeric `Team.id`.

Leaderboard ranks all non-deleted Teams and shares comparator logic with Team Results Excel export.

### Must Update After Change

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 12. Team Results Excel Export

### Scope

- Admin Team Results `.xlsx` export.
- One worksheet, one row per non-deleted Team.
- Active Station column groups.
- Excel/Leaderboard rank consistency.
- HCMC datetime/duration Excel formats.
- Export download filename handling.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/EXCEL_EXPORT_AND_TEAM_COLOR_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Must Update After Change

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/EXCEL_EXPORT_AND_TEAM_COLOR_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 13. Team Color UI

### Scope

- `Team.color` / `teamColor` API mapping.
- Admin create/update color validation and clear behavior.
- Team-facing scoped theme.
- Team/user `/stations/map` action theming.
- Admin Team list per-card scoped theme.
- Admin single-Team context shell/header/nav scoped theme.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/EXCEL_EXPORT_AND_TEAM_COLOR_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Out of Scope

- Admin map routes.
- `StationsMapPanel` Admin action behavior.

### Must Update After Change

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/EXCEL_EXPORT_AND_TEAM_COLOR_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 14. Frontend Localization

### Scope

- Vietnamese and English runtime language switching.
- Team and Admin Frontend copy, validation, messages, status labels, and ARIA text.
- Persisted language preference, HTML language, Ant Design locale, and formatting.
- Responsive language control before and after authentication.
- Backend-projected Player Station localization via `lang=vi|en`.
- Admin bilingual Station create/update fields and canonical Station seed EN content.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/FRONTEND_LOCALIZATION_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Important Boundaries

- `Station.name` and `Station.description` remain Vietnamese canonical/default.
- Player Station APIs return localized `name`/`description` while preserving the
  public response shape.
- Admin Station APIs return and edit both VI and EN Station fields.
- Excel export, backend operational consumers, Team names, Station IDs,
- Excel export, backend operational consumers, Station IDs, usernames, tokens,
  enum/API values, `Game.title`, and `clueText` remain outside localization for
  this scope.
- Team display names are localized only at the Frontend display layer for raw
  seed-style names `Team NN`/`Đội NN`; database, API, seed, Team IDs, and custom
  Team names remain unchanged.
- Final navigation may stay `Final`, but the full heading is localized as
  `Thử thách cuối cùng` / `Final Challenge`; Final UI uses a flag icon.
- Station UI ordering is status order `In Progress`, `New`, `Finished`, then
  natural ascending `stationId`; Station collections without status sort by ID.
- Team Color rules remain unchanged.

### Must Update After Change

```text
docs/analysis/FRONTEND_LOCALIZATION_ANALYSIS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 15. Station Media Gallery

### Scope

- Ordered Station image URL persistence.
- Admin Station create/edit gallery management.
- Player Station List, Map drawer, and Detail gallery preview.
- Player media/action layout and `In Progress` action copy.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/STATION_MEDIA_GALLERY_ANALYSIS.md
docs/analysis/FRONTEND_LOCALIZATION_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Confirmed Rules

- A Station owns at most 10 ordered HTTPS image URLs without captions.
- Admin create/update uses `imageUrls`; update omission preserves and an empty array clears.
- Player/Admin responses expose ordered `imageUrls` only.
- Image actions are independent of Station Game Type and disabled when empty.
- Backend validates URL input without fetching external resources.

### Must Update After Change

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/STATION_MEDIA_GALLERY_ANALYSIS.md
docs/analysis/FRONTEND_LOCALIZATION_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

---

## 16. Team Gameplay V2

### Scope

- Parallel Team-only `/team/v2` gameplay screen.
- Fullscreen responsive neon HUD with exact `MOVEment 2026` center brand and
  centered/near-fullscreen Settings, scanner, score, preview, and Leaderboard overlays.
- Shared map canvas reuse with existing Suoi Tien WebP variants and Station coordinates.
- Unified Team Station QR action through the V2-only persistent camera scanner
  and manual fallback, plus the fixed cyan/red inline-SVG QR badge.
- V2-owned near-fullscreen Station Detail and gallery presentation inside the
  map route; no navigation through Player Station Detail V1.
- V2-specific VI/EN copy, fixed V2 palette isolated from Team Color, and
  overlay opacity persistence.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/TEAM_GAMEPLAY_V2_ANALYSIS.md
docs/analysis/STATION_MAP_ANALYSIS.md
docs/analysis/STATION_QR_AND_SCORING_ANALYSIS.md
docs/analysis/TEAM_QR_AND_PLAYER_NAVIGATION_ANALYSIS.md
docs/analysis/FRONTEND_LOCALIZATION_ANALYSIS.md
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Confirmed Boundaries

- Do not change database schema, seed, scoring authority, or default login redirect.
- Keep `/stations/map` and existing player check-in/check-out endpoints compatible.
- Backend resolves Station QR purpose from the token record, not Frontend input.
- Admin users must not access the Team Gameplay V2 route.
- V2 HUD/marker/overlay/control colors use the fixed V2 palette and must not be
  overridden by `Team.color`, inherited `--team-*`, or global theme styling.

### Must Update After Change

```text
docs/analysis/TEAM_GAMEPLAY_V2_ANALYSIS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Update `OPEN_QUESTIONS_AND_DECISIONS.md` only when a Business Rule changes.

---

## 17. Team Runtime Stability and Data Loading

### Scope

- Lean Player catalog/state/images/leaderboard APIs.
- Team bootstrap, polling, caching, session ownership, and stale-data behavior.
- Gameplay mutation reconciliation and concurrency protection.
- Team route/code splitting, lazy media loading, and bundle budgets.
- Safe localized Team/Login errors and request correlation.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/TEAM_RUNTIME_STABILITY_AND_DATA_LOADING_ANALYSIS.md
docs/analysis/TEAM_GAMEPLAY_V2_ANALYSIS.md
docs/analysis/TEAM_QR_AND_PLAYER_NAVIGATION_ANALYSIS.md
docs/analysis/STATION_QR_AND_SCORING_ANALYSIS.md
docs/analysis/STATION_MAP_ANALYSIS.md
docs/analysis/FRONTEND_LOCALIZATION_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

### Confirmed Boundaries

- Preserve authentication, QR, scoring, Final, leaderboard, and localization
  Business Rules.
- Keep existing Player APIs available during the compatibility window.
- Backend aggregates remain authoritative; Frontend-derived totals are not a
  replacement.
- Do not queue or automatically replay Team gameplay mutations.

### Must Update After Change

```text
docs/analysis/TEAM_RUNTIME_STABILITY_AND_DATA_LOADING_ANALYSIS.md
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/TEAM_GAMEPLAY_V2_ANALYSIS.md
docs/analysis/TEAM_QR_AND_PLAYER_NAVIGATION_ANALYSIS.md
docs/analysis/STATION_QR_AND_SCORING_ANALYSIS.md
docs/analysis/STATION_MAP_ANALYSIS.md
docs/analysis/FRONTEND_LOCALIZATION_ANALYSIS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Update `OPEN_QUESTIONS_AND_DECISIONS.md` only if a Business Rule changes.

---

## 18. Git and Delivery Rules

### Scope

- Local commits.
- Verification before commit.
- Commit title and details.
- Push restrictions.
- Deployment restrictions.
- History rewrite restrictions.

### Required Reading

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/prompts/00_WORKFLOW.md
```

### Confirmed Rules

- Codex may create a local commit after task completion and verification.
- Commit title must be clear.
- Commit details should use bullets.
- Do not push automatically.
- Do not deploy automatically.
- Do not force-push, reset, or rewrite history without explicit user approval.

---

## 19. Agent Skills and Tooling

### Scope

- Skills stored under `.codex/skills`.
- Skills supplied by the host runtime on `D:`.
- Skill overlap, trigger/context cost, project overrides, and validation.

### Required Reading

```text
AGENTS.md
docs/analysis/AGENT_SKILLS_ANALYSIS.md
docs/prompts/00_WORKFLOW.md
```

### Admission Rule

A project-local skill must reduce an observed error or repeated workflow, avoid
functional overlap, keep context proportional, and pass at least one real
repository workflow. Generic runtime skills are not copied without a documented
project override or reproducibility need.

### Must Update After Change

```text
docs/analysis/AGENT_SKILLS_ANALYSIS.md
```

Update `AGENTS.md` or `docs/prompts/00_WORKFLOW.md` only when the repeatable
agent workflow changes.

---

# Prompt Routing

## Documentation and Workflow

```text
docs/prompts/00_WORKFLOW.md
docs/prompts/09_CODEX_MASTER_EXECUTION_PROMPT.md
```

## Automatic URL QR Login and Seed Tokens

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

## Final Challenge

```text
docs/prompts/11_CODEX_FINAL_GAME_KEYWORD_AND_SCORING_PROMPT.md
```

## Station Score Entry and Limits

```text
docs/prompts/12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md
```

Do not run the Master Prompt automatically when only one Feature needs work.

Use the smallest relevant Feature Prompt.

---

# Change Classification

Before implementation, classify the requested work.

## Business Rule Change

Examples:

- Change Final scoring.
- Change Station max score policy.
- Change one-active-session behavior.
- Change when Final opens.

Required action:

1. Update `OPEN_QUESTIONS_AND_DECISIONS.md` first.
2. Update related analysis.
3. Update Prompt if needed.
4. Change Source Code.
5. Verify.
6. Update `BACKEND_AUDIT.md`.

---

## Documentation Reconciliation

Examples:

- Two documents describe different QR formats.
- An old Prompt still describes a removed Staff role.
- Fixed Event times remain in old analysis.

Required action:

1. Do not change Source Code unless explicitly requested.
2. Follow the Source of Truth.
3. Update affected documents.
4. Record unresolved conflicts in `IMPLEMENTATION_BACKLOG.md`.

---

## Implementation Fix

Examples:

- Code does not enforce max score.
- QR auto-login does not redirect.
- Duplicate Final requests create duplicate rank.
- New Station does not receive both QR tokens.

Required action:

1. Confirm Business Rule.
2. Inspect current implementation.
3. Implement the smallest safe change.
4. Add or update tests.
5. Verify.
6. Update `BACKEND_AUDIT.md`.
7. Update backlog status.

---

## Refactor

Examples:

- Remove duplicate token generation logic.
- Move QR validation into a shared service.
- Improve transaction boundaries.
- Improve naming without changing behavior.

Required action:

1. Confirm no Business Rule change is intended.
2. Preserve externally visible behavior.
3. Run relevant tests.
4. Update `BACKEND_AUDIT.md` when architecture changes meaningfully.

---

# Required Completion Report

After completing a task, Codex must report:

```text
1. Feature changed
2. Business Rules followed
3. Conflicts found
4. Source Code files changed
5. Documentation files changed
6. Tests or verification performed
7. Remaining risks or backlog items
8. Local commit created, if any
```

Do not claim a test passed unless it was actually run.

Do not claim documentation is synchronized unless the related files were reviewed.

---

# Current Known Documentation Conflicts

The following conflict categories must be checked during future work:

1. Legacy Team QR token versus Automatic URL QR Login.
2. One-time QR token versus reusable, revocable, rotatable QR token.
3. Fixed Final time versus Event Config end time.
4. Predictable Station QR payload versus Opaque Random Token.
5. Historical Staff or Station Manager references versus the confirmed no-Staff-role model.
6. Prompt paths that are not repository-root-relative.

This section is a routing warning only.

Confirmed decisions remain in:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```
