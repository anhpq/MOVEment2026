# MOVEment2026 Agent Instructions

These instructions are the first source of truth for agents working in this repository.

## Priority Order

Always apply project guidance in this order:

1. Read and apply `AGENTS.md` first.
2. Review the relevant project docs second.
3. Use Graphify only when it is useful for the task.
4. Read source files last, after the guidance and context are clear.
5. Make small, scoped edits that match the existing project structure.

Graphify is advisory only. It must not override `AGENTS.md`, privacy rules, architecture docs, or direct user instructions.

Do not run Graphify for small/simple tasks where `AGENTS.md`, project docs, or a narrowly scoped file edit are sufficient.

## Request Routing

Before substantive work, classify the request by scope and risk.

- Keep ambiguous, multi-component, architecture, dependency/configuration/data, authentication/security, external-action, or regression-risk work in the primary agent.
- Delegate only when the request is clearly bounded, reversible or read-only, low-risk, affects one small area, and has straightforward local verification.
- If uncertain, keep the task in the primary agent.
- Do not split one simple task across multiple workers.

Default model lanes:

- Fix bug, refactor, review PR, or write a new feature: GPT-5.5 lane; if unavailable, use the lowest-cost capable worker/model.
- Architecture design, research/root-cause analysis, or long spec work: GPT-5.6 lane in the primary agent unless the user explicitly asks for delegation.

## Project Docs

Before implementation, verification, or documentation updates, review the relevant docs:

- `docs/analysis/PROJECT_ANALYSIS_SPEC.md`: product scope and accepted behavior.
- `docs/analysis/IMPLEMENTATION_BACKLOG.md`: P0/P1 status, acceptance gaps, and remaining handoff work.
- `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`: current decisions that override stale prompts or notes.
- `docs/analysis/BACKEND_AUDIT.md`: backend/frontend verification history, operational findings, and handoff status.
- `docs/analysis/TEAM_LOGIN_DATA.md`: team login data, when the task touches accounts or seed credentials.
- `docs/prompts/00_WORKFLOW.md`: prompt/checklist index for analysis, API, UI, QR, admin, backlog, or implementation sync work.

After implementation or verification, update the matching `docs/analysis/` file when status, decisions, credentials, smoke-test results, acceptance gaps, or operational runbooks changed.

Update `docs/prompts/` only when the repeatable workflow/checklist itself changed. Do not rewrite prompts for ordinary code changes.

## Graphify

This project has a knowledge graph in `graphify-out/` with god nodes, community structure, and cross-file relationships.

Use Graphify for architecture, dependency tracing, broad codebase understanding, or refactor planning when it will reduce raw source browsing:

- Run `graphify query "<focused question>"` when `graphify-out/graph.json` exists.
- Use `graphify path "<A>" "<B>"` for relationships.
- Use `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/graph.json` is absent and Graphify is needed, create a local graph with `graphify . --code-only`.

Rules:

- If the user explicitly types `/graphify`, use the installed Graphify skill or instructions before doing anything else for that request.
- Dirty `graphify-out/` files are expected after hooks or incremental updates and are not a reason to skip Graphify.
- Skip Graphify only when the task is small/simple, about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, prefer it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After code modifications, run `graphify update .` when Graphify is available. If update cannot use the existing graph, regenerate with `graphify . --code-only`.
- If Graphify is unavailable, record that clearly in the final response and, when relevant, in the matching analysis doc.

## Source Work

Read source files only after the applicable instructions, docs, and optional Graphify context are clear.

When editing:

- Preserve existing patterns, framework choices, naming, and module boundaries.
- Keep changes narrowly scoped to the requested outcome.
- Avoid unrelated refactors and metadata churn.
- Do not modify source code when the user asked only for documentation, explanation, or review.
- Do not revert user changes unless the user explicitly asks.

## Verification

Verify in proportion to risk:

- Documentation-only changes: review the diff and affected rendered/linked content when useful.
- Narrow code changes: run the smallest relevant build/test/lint.
- Cross-module or user-facing changes: broaden verification to the affected backend/frontend paths.

If a verification step cannot run, state the exact reason in the final response.

## Git Autonomy

The user allows Codex to create local git commits for completed project work without asking again when the commit includes only in-scope changes and relevant generated Graphify/doc updates.

Before committing:

- Review `git status`.
- Stage only the files related to the completed task.
- Verify the work in proportion to risk.
- Use a clear commit title and a detailed body.
- Do not commit if tests/verification are failing unless the commit explicitly documents a known failing state requested by the user.

Do not push, deploy, open PRs, rewrite history, reset, or run destructive git commands unless the user explicitly asks.

Commit message format:

```text
<short imperative title>

- <specific completed change>
- <verification or smoke-test result when relevant>
- <docs/analysis/Graphify update when relevant>
```
