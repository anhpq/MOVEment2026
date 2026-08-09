# MOVEment 2026 - Agent Skills Analysis

## Status

| Area | Status |
| --- | --- |
| Runtime inventory | Completed on 2026-08-01 |
| Admission review | Completed |
| Project-local update | Graphify `0.9.31` merged with project overrides |
| Structural validation | Passed |
| Real workflow validation | Passed |

## Objective

Keep only skills that measurably reduce errors or repeated work without
duplicating existing capabilities or loading unnecessary context.

This document governs agent tooling only. It does not define product Business
Rules and does not override `AGENTS.md`.

## Admission Gate

A candidate is accepted only when all checks pass:

1. It addresses an observed error pattern or repeated repository workflow.
2. It does not duplicate an active runtime skill, repository script, Prompt, or
   operational instruction.
3. Its trigger metadata and loaded body are proportional to the task; detailed
   material uses progressive disclosure when needed.
4. It passes at least one real repository workflow with an observable result.

## Accepted Inventory

| Skill | Source | Decision | Evidence |
| --- | --- | --- | --- |
| `graphify` | Project-local `.codex/skills/graphify` based on runtime `0.9.31` | Keep and update | `AGENTS.md` requires Graphify-first codebase work; focused queries in this audit narrowed the stack, workflow, and skill configuration before raw reads. |

Graphify remains project-local because the repository requires command-resolution
fallbacks and workflow behavior that differ from the generic runtime copy.

## Graphify Update Policy

The project copy is based on runtime skill version `0.9.31` with these decisions:

- Accept manifest stamping fixes so failed or omitted semantic extraction is
  retried instead of silently marked current.
- Retain console entrypoint, saved-interpreter, and `python -m graphify` fallback
  order required by `AGENTS.md`.
- Retain count-only reporting for sensitive skipped files to avoid unnecessary
  filename disclosure and context expansion.
- Do not copy upstream files whose only difference is line endings.

## Rejected Runtime Candidates

| Candidate group | Decision | Reason |
| --- | --- | --- |
| `aspnet-core`, Expo, React Native skills | Reject | The project is NestJS, Prisma, React, Vite, and Ant Design; these skills target a different stack. |
| `review-agent` | Reject project copy | Its defect-first review workflow overlaps the active Codex review instructions and repository review rules. |
| `security-threat-model` | Use runtime only | It is already available globally and triggers only for explicit threat-model requests; no project override is needed. |
| `skill-creator`, `skill-installer`, `plugin-creator`, `openai-docs`, `imagegen` | Use runtime only | These are generic system capabilities already available to Codex; copying them would add maintenance and duplicate discovery metadata. |
| Documents, PDF, presentations, spreadsheets, and artifact templates | Use runtime only when requested | They are artifact workflows, not recurring application-development workflows for this repository. |
| `i-have-adhd` | Reject project copy | It is a user communication preference, not a repository capability. |

## Deferred Candidates

### Visual Verification

Repeated responsive Chrome verification is observable in the audit history, but
the repository has no project-owned Playwright/Puppeteer dependency or stable
browser automation script. Physical iOS/Android verification also cannot be
replaced by a skill. Reconsider only after a deterministic browser workflow is
added and can be tested on a real authenticated screen.

### NestJS or Prisma Guidance

Do not add a generic framework skill yet. Current tests, migration/seed scripts,
Feature analysis, and deployment gates already cover the repeated workflows, and
no non-overlapping error reduction has been demonstrated.

## Validation Workflow

1. Run the official `skill-creator` structural validator against the project
   Graphify folder.
2. Confirm installed Graphify CLI and project skill versions are aligned.
3. Run a focused `graphify query` against the current graph.
4. Forward-test the project-local skill with a fresh read-only agent on a real
   codebase question.
5. Review the diff and confirm no unrelated runtime skill was copied.

## Validation Results

- Official `skill-creator` `quick_validate.py` result: `Skill is valid!`.
- Installed CLI reports `graphify 0.9.31`; the manifest helper and
  `save_manifest` parameters used by the updated skill exist in that runtime.
- `graphify update .` completed with `2761` nodes, `4665` edges, and `210`
  communities, then a focused query found the new skill-governance documents.
- A fresh read-only agent used `query` and `explain` to trace the real Station
  playing-count flow from Frontend polling hook through API, controller, and
  service. Graphify identified the five source locations before targeted raw
  reads confirmed the route, interval, authorization, and Prisma conditions.
- Diff review confirms no generic runtime skill was copied into `.codex/skills`.

## Remaining Tooling Risks

- Graphify reports that `hooks.json` produces zero nodes and will retry it.
- The optional SQL parser is not installed, so `19` SQL files do not contribute
  AST nodes. This is a Graphify dependency gap, not a reason to add another
  project skill.
- Community labels changed after the graph rebuild; focused queries remain
  functional, but an LLM-backed relabel was not run.

## Decision Log

| Concern | Decision | Effect |
| --- | --- | --- |
| Distribution | Hybrid, selective vendoring | Keep only critical/project-overridden skills in the repo. |
| Agent target | Codex-first | Update `.codex`; do not create unverified cross-agent adapters. |
| Evidence threshold | One real workflow plus baseline | Reject descriptive-only candidates. |
| Initial scope | Graphify only | Defer visual automation and add no generic framework skill. |
