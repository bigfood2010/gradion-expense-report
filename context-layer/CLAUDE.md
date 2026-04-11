# CLAUDE.md

## Repository layout
Full-stack expense report app; three owned packages plus reference UI.
- `backend/` — NestJS, service-owned state machine, async receipt extraction via polling.
- `client/` — React + Vite, Atomic Design component hierarchy.
- `shared/` — authoritative DTOs, enums, and cross-package types.
- `quiet-cost-main/` — reference UI only; do not copy or modify its implementation.

## Source material
The scaffold was synthesised from these planning docs — consult them before adding features.
- `context-layer/prd.md` and `context-layer/implement-plan.md` for domain + API design.
- `context-layer/UI-PRD.md` for layout intent.
- `context-layer/requirement/gradion-assessment-fullstack-engineer.md` for acceptance criteria.

## AI scaffold corrections
Key decisions locked in during AI-assisted setup that must not regress.
- Receipt extraction is async/polling — never make it a blocking upload flow.
- The backend state machine is service-owned — controllers must not hold state logic.
- Root workspace stays lean: no new tooling unless the task explicitly requires it.
> `CLAUDE.md` and `DECISIONS.md` are intentional AI workflow artifacts — keep them.
