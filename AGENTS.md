## graphify

## Cost-aware request routing

Before doing substantive work, classify the request by scope and risk.

- Route request categories by this default model lane:
  - Fix bug: GPT-5.5
  - Refactor: GPT-5.5
  - Review PR: GPT-5.5
  - Write a new feature: GPT-5.5
  - Architecture design: GPT-5.6
  - Research/root-cause analysis: GPT-5.6
  - Write a long spec: GPT-5.6
- When the exact GPT-5.5 model ID is not available in the current Codex runtime, treat the GPT-5.5 lane as the lowest-cost capable worker/model available, such as `simple_worker`.
- Keep GPT-5.6 lane work in the primary agent unless the user explicitly asks for delegation.
- Delegate to the `simple_worker` agent when the request is clearly bounded, reversible or read-only, affects at most one small area, has no external side effect, and needs only straightforward verification. Examples: explain a local error, rename a symbol in one file, make a trivial style/text correction, or run a focused read-only check.
- Keep work with the primary agent when it is ambiguous, spans multiple components, needs design judgment, changes dependencies/configuration/data, touches authentication/security, makes external changes, or could cause material regression.
- If unsure, treat the request as non-simple. Do not split one simple task across multiple workers.

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- Before any raw source read, text search, codebase analysis, or code change, first use Graphify. Run `graphify query "<focused question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/graph.json` is absent, create the local graph first with `graphify . --code-only`. Read raw source only if the graph result does not answer the focused question or a source-level edit is necessary.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After every code modification, run `graphify update .` to keep the graph current. If an update cannot use the existing graph, regenerate with `graphify . --code-only`.
