# PRD & Architecture

## 1. System Topology
- **Frontend Architecture:** React/Vite strictly enforcing Atomic Design principles (Atoms, Molecules, Organisms, Templates, Pages).
- **Monorepo:** `client/`, `backend/` (NestJS), `shared/` (TypeScript DTOs/Entities).
- **Design Principles:** Strict adherence to DRY, KISS, and YAGNI. Root limits via Prettier/ESLint.
- **Environment:** Root `docker-compose.yml` defining PostgreSQL and MinIO.

## 2. Core Entities
1. **User:** `id`, `email`, `role` (`user` | `admin`). Persisted via TypeORM/PostgreSQL.
2. **ExpenseReport:** `id`, `user_id` (FK), `status`, `total_amount` (computed dynamically). Persisted via TypeORM/PostgreSQL.
3. **ExpenseItem:** `id`, `report_id` (FK), `merchant|null`, `amount|null`, `date|null`, `aiStatus` (`PROCESSING`|`COMPLETED`|`FAILED`), `extractionError`, `receiptObjectKey`. Persisted via **in-memory repository** (`InMemoryExpenseItemsRepository`) — not TypeORM.

## 3. State Machine (Service Layer Enforcement)
Controllers strictly map DTOs. Transitions enforce role & state invariants:
- **DRAFT:** Entry state. Item CRUD allowed.
- **SUBMITTED:** System locks items. Admin action required.
- **APPROVED:** Terminal state.
- **REJECTED:** Reverts to `DRAFT` upon user modification.

## 4. Flow: AI Receipt Extraction
1. Client uploads file (`multipart/form-data`) via `POST /reports/:id/items`.
2. Backend streams to MinIO, persists `ExpenseItem` with `ai_status: PROCESSING`, instantly returns HTTP `202`.
3. Backend generates MinIO presigned URL, dispatches to LLM in background, then updates Entity to `COMPLETED` with extracted data.
4. Client polls via React Query (`GET /reports/:id/items`) until `ai_status` updates, seamlessly exposing data for user override.

## 5. API Interface
*Prefix: `/api/v1`*
- **Auth:** `POST /auth/login` | `POST /auth/signup` | `GET /auth/me`
- **Reports:** `GET /reports` | `POST /reports` | `GET /reports/:id` (metadata only — no items) | `PATCH /reports/:id` | `DELETE /reports/:id` | `PATCH /reports/:id/submit` (Draft → Submitted)
- **Items:** `GET /reports/:id/items` | `POST /reports/:id/items` | `PATCH /items/:id` | `DELETE /items/:id` (Locked outside Draft)
- **Admin:** `GET /admin/reports` | `PATCH /admin/reports/:id/approve` | `PATCH /admin/reports/:id/reject`

> ⚠️ `GET /reports/:id` does **not** include items in its response. Items are a separate resource — always fetch from `GET /reports/:id/items`.
