# Gradion Assessment

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
docker compose up -d                    # Starts Postgres and MinIO, seeds default accounts
pnpm dev
```

- **Web App:** http://localhost:3000
- **API Server:** http://localhost:4000/api/v1

### Seeded Accounts

- **User:** user@example.com / password
- **Admin:** admin@example.com / password

### AI Pre-fill

The receipt upload form can auto-fill merchant, amount, and date using Gemini. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to `client/.env`:

```
VITE_GEMINI_API_KEY=your-key-here
```

Skip this if you want to enter details manually.

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
- [**Decisions & Trade-offs**](context-layer/DECISIONS.md): Architectural choices and future roadmap.
- [**Technical Walkthrough**](context-layer/WALKTHROUGH.md): Detailed setup, API reference, and examples.
