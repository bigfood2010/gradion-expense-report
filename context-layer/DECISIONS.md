# Decisions

## Stack choices

**NestJS + TypeORM + Postgres + React/Vite, in a pnpm monorepo.**

- NestJS: module-scoped DI and decorators keep domain boundaries explicit — reports, receipts, and auth are self-contained modules with their own services, controllers, and guards, which maps directly to the assessment's review surfaces.
- TypeORM: entity-first schema with migrations gives reviewers a runnable, reproducible DB without manual SQL; `@OneToMany` on Report/Item/Receipt models the domain accurately with minimal ceremony.
- Postgres + MinIO: transactional state transitions need ACID guarantees; binary blobs belong in object storage, not a DB row.
- React + Vite: fast ESM-native dev loop; React Query owns server state (polling, caching, background refetch) so component state stays presentational.
- pnpm workspaces: `shared/` Zod schemas and DTOs are imported by both `backend/` and `client/` via workspace protocol without publishing — no symlink hacks, no build step.

## Monorepo shape

**Root is intentionally thin; workspace boundaries are fixed to `backend/`, `client/`, and `shared/`.**

- Matches the PRD's three-layer model with no extra abstraction.
- Cross-workspace imports are explicit via `@gradion/shared`, not path aliasing.
- Avoids the “everything in one app” drift that makes assessment repos hard to finish cleanly.

## Rejected → resubmit

**On the next user edit, status transitions REJECTED → DRAFT, not REJECTED → SUBMITTED directly.**

- Preserves two distinct intents: “I want to correct this” and “I am done and submitting.”
- Keeps submission as a deliberate user action; the service layer has a clean one-transition-per-intent log.
- A direct re-submit is faster to build but collapses correction and confirmation into a single ambiguous side effect.

## AI extraction

**Receipt extraction is async: upload returns 202, item enters PROCESSING, client polls to COMPLETED or FAILED.**

- LLM latency and storage I/O are variable; blocking the upload endpoint couples response time directly to external service SLAs.
- The UI already needs a visible in-progress state, so async polling adds no extra client complexity.
- FAILED is a first-class state: items can be retried or manually corrected without client-side guessing.

## Storage and local infra

**Postgres + MinIO are sufficient for local delivery; Docker Compose is explicit rather than scripted.**

- MinIO is bootstrapped with a `receipts` bucket so reviewers need zero manual setup.
- A readable compose file signals clearer intent than a wrapper script in an assessment repo.

## Form library

**React Hook Form v7 + Zod v4, over manual `useState` or a UI-library form system.**

- RHF uses uncontrolled inputs (refs, not state), eliminating re-renders until submit or explicit `watch()`; critical for the item-editing drawer where AI pre-fill fires `reset()` and `setValue()` in bulk.
- Zod is TypeScript-first: `z.infer<typeof schema>` derives the form type from the schema, eliminating manual interface duplication.
- Schemas live in `shared/` and are reused on the backend via `ZodValidationPipe` — one source of truth for client and server validation.

*Caveat: Zod v4 is not yet in wide production adoption; v3 is the safe fallback if a downstream dep conflicts.*

---

## If you had one more day

The three things I would build next, in priority order.

**1. A durable job queue for receipt processing.**

Right now, AI extraction runs as a fire-and-forget promise inside the upload handler. If the process crashes after writing PROCESSING to the database but before the LLM call completes, that item stays PROCESSING indefinitely — there is no retry, no timeout, and no recovery path. A reviewer who uploads a receipt and then restarts the server gets a permanently broken item with no way to rescue it from the UI. That is not a polish gap; it is a correctness gap that makes the feature unsafe to rely on.

The fix is a durable job queue — BullMQ over Redis is the idiomatic NestJS choice — with at-least-once delivery, a configurable retry policy, and a dead-letter queue for items that exhaust retries. The state machine transitions originate from the job processor, not the controller, so the controller returns 202 immediately and the processor drives PROCESSING → COMPLETED or PROCESSING → FAILED with a stored error reason. This single change makes extraction production-worthy rather than demo-worthy. It also unlocks horizontal scaling: multiple processor replicas can drain the queue without any coordination logic in the service layer.

**2. Confidence scores on AI-extracted fields.**

The LLM currently returns vendor, amount, and date as flat strings. In practice, a receipts model has wildly variable confidence: a clean digital PDF parses precisely, a photo of a crumpled handwritten receipt may not. Returning and storing a per-field confidence value (a float 0–1, or a low/medium/high enum derived from the model's structured output) enables two things the product needs. First, the submitter sees which fields were filled with low certainty and knows where to double-check before submitting — reducing incorrect claims without adding friction to the happy path. Second, the approver can see at a glance whether an item was auto-filled confidently or is flagged for scrutiny, which makes the review queue faster to process.

The implementation surface is small: one `confidence` column per extracted field on the receipt item table, a structured output schema in the extraction prompt, and a visual indicator (amber text, an icon) in the item drawer. The prompt engineering is the riskiest part; the schema and UI changes are straightforward. The value-to-effort ratio is high because it makes the AI feature honest about its own limits, and trust in automation is always a function of visible uncertainty.

**3. A Playwright E2E test for the submit → approve flow.**

The happy path — employee submits a report, manager approves it — is the single most important flow in the product and the one most likely to break silently across a refactor. Unit tests on the service layer verify individual state transitions, but they cannot catch a broken API contract, a misconfigured RBAC guard, or a regression in the submit button handler. Integration tests are not enough either: the frontend and backend can each pass their own tests while failing to compose.

A single Playwright test that seeds two users (employee and manager), submits a report end-to-end, verifies the report appears in the manager's review queue, and confirms the approval state change reflected in the employee's view would give the project a safety net that makes every subsequent change cheaper to ship with confidence. It also doubles as living documentation of the expected UX flow — more reliable than prose because it breaks when the product diverges from it.

I would not build all three on day two. The job queue ships first because it fixes data correctness. Confidence scores ship second because they make the extraction feature trustworthy, not just functional. The E2E test ships third because a correct, trustworthy feature still needs a regression harness before it goes near production.
