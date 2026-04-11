# AGENTS.md

## Code navigation
Use the knowledge graph before grepping — it understands call chains and dependencies.
- Start with `search_graph` or `get_architecture` for concept/symbol discovery.
- Use `trace_call_path` to follow a function through layers before touching it.
- Fall back to shell search only for plain-text configs or when MCP returns nothing.

## Editing rules
Change only what's needed; keep layers clean and types canonical.
- Business rules belong in services (`backend/src/**/**.service.ts`), not controllers.
- All cross-package types must live in `shared/` — never duplicate them in `backend/` or `client/`.
- Prefer targeted, explicit changes over refactoring unrelated code.
- Do not alter `quiet-cost-main/` — it is reference material, not editable source.

## Before you commit
Verify scope so changes don't silently break adjacent flows.
- Run `gitnexus_impact` on every symbol you modified; address all d=1 callers.
- Run `gitnexus_detect_changes()` and confirm only expected files appear.
> Ignore HIGH/CRITICAL risk warnings only with explicit user approval.
