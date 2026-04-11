# Gradion Assessment

A full-stack expense report system. Users create reports with receipt uploads; AI pre-fills receipt fields; admins approve or reject submissions.

![Home](context-layer/assets/home.png)

![Extract form](context-layer/assets/extract-form.png)

**Stack:** NestJS · PostgreSQL · MinIO · React + Vite · TanStack Router · pnpm workspaces

---

## Quick start

**Prerequisites:** Node 20+, pnpm 9+, Docker

```bash
pnpm install
cp backend/.env.example backend/.env    # set AI_PROVIDER_API_KEY (optional, see below)
docker compose up -d                    # starts Postgres + MinIO, seeds default accounts
pnpm dev
```

- **App:** http://localhost:3000
- **API:** http://localhost:4000/api/v1

**Default accounts** (seeded automatically):

| Role | Email | Password |
|------|-------|----------|
| User | user@example.com | password |
| Admin | admin@example.com | password |

---

## AI receipt extraction (optional)

1. Go to **https://aistudio.google.com/apikey** and create a free API key.
2. Add it to `backend/.env`:
   ```
   AI_PROVIDER_API_KEY=your-key-here
   ```
3. Restart (`pnpm dev`). Without a key the app falls back to a mock extractor.

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start backend + client in watch mode |
| `pnpm test` | Run all tests (backend + client) |
| `pnpm test:backend` | Run backend tests only |
| `pnpm test:client` | Run client tests only |
| `pnpm build` | Production build |
| `pnpm lint` | Lint + Prettier check |
| `pnpm format` | Auto-format |

---

## Structure

```
backend/   NestJS API — business logic, state machine, storage
client/    React + Vite UI — Atomic Design components
shared/    DTOs, enums, and types shared across packages
```

---

## AI usage

Used Claude and GitHub Copilot for scaffolding: NestJS modules, TypeORM boilerplate, React shells, test generation, and the Gemini extraction integration. All output reviewed before merging.

Three bugs I caught and fixed:

- **Wrong seed role** — `admin@example.com` was seeded with `role: 'user'`, so the JWT carried the wrong role and every admin request returned 403.
- **`$NaN` report totals** — `reports.map(mapReport)` passes the array index as the optional `totals?` argument. `0 ?? buildTotals(report)` short-circuits on `0`, so all totals rendered as `$NaN`. Fixed with `reports.map((r) => mapReport(r))`.
- **Wrong post-login redirect** — redirect always went to `/`, so admins landed on the user dashboard. Fixed by reading the role from the JWT and routing to `/admin`.

---

## Docs

- [`DECISIONS.md`](./DECISIONS.md) — stack choices, trade-offs, "if I had one more day"
- [`context-layer/WALKTHROUGH.md`](./context-layer/WALKTHROUGH.md) — full local setup, API reference, curl examples
