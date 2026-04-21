# Gradion Assessment

Expense report app with receipt upload, AI extraction, user review, and admin approval

**Stack:** NestJS · PostgreSQL · MinIO · React + Vite · TanStack Router · pnpm workspaces

![Home](context-layer/assets/home.png)

![Extract form](context-layer/assets/extract-form.png)

---

## Quick Start

**Prerequisites:** Node 20+, pnpm 9+, and Docker.

```bash
pnpm install
cp backend/.env.example backend/.env
cp client/.env.example client/.env
docker compose up -d                    # Starts Postgres, MinIO, and the demo seed
pnpm dev
```

- **Web App:** http://localhost:3000
- **API Server:** http://localhost:4000/api/v1

### Seeded Accounts

- **User:** david@openai.com / Password1!
- **User:** sarah@openai.com / Password1!
- **Admin:** admin@openai.com / password1!

### AI Receipt Extraction

Receipt uploads are processed server-side using **Gemini 2.5 Flash** (via the OpenAI-compatible endpoint). The flow:

```
Browser → POST /reports/:id/items (multipart)
  └─ Backend stores receipt in MinIO
  └─ Dispatches async extraction job
       └─ Gemini extracts merchant / amount / date / currency
       └─ Updates item aiStatus: PROCESSING → COMPLETED | FAILED
  └─ Client polls every 2 s until status settles
       └─ COMPLETED → pre-fills the review form
       └─ FAILED    → shows error + retry option
```

To enable AI extraction, set `AI_PROVIDER_API_KEY` in `backend/.env` (a free key is available at [Google AI Studio](https://aistudio.google.com/app/apikey)). Leave it blank to use the mock extractor and fill details manually.

---

## Available Commands

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `pnpm dev`          | Start backend + client in watch mode |
| `pnpm test`         | Run all tests (backend + client)     |
| `pnpm test:backend` | Run backend tests only               |
| `pnpm test:client`  | Run client tests only                |
| `pnpm build`        | Production build                     |
| `pnpm lint`         | Lint + Prettier check                |
| `pnpm format`       | Auto-format                          |

---

## Project Layout

- **backend/**: NestJS API handling business logic, state machines, and storage.
- **client/**: React and Vite UI built with Atomic Design components.
- **shared/**: Shared DTOs, enums, and types.

---

## Documentation

- [**AI Usage**](context-layer/AI_USAGE.md): Detailed notes on the AI tools and workflow used.
- [**Rules**](context-layer/RULES.md): Project conventions, migration policy, and implementation guardrails.
