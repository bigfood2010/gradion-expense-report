# Walkthrough

---

## Prerequisites

Node.js ≥ 20, pnpm ≥ 9, Docker + Docker Compose v2.

---

## 1. Install

Resolves all workspace packages (`backend`, `client`, `shared`) from the root.

```bash
pnpm install
```

---

## 2. Environment variables

Backend config lives at `backend/.env` — copy the committed example and set two secrets.

```bash
cp backend/.env.example backend/.env
```

```dotenv
JWT_SECRET=replace-with-a-long-random-string-at-least-24-chars
AI_PROVIDER_API_KEY=replace-me   # optional — leave blank if unused
```

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Runtime mode |
| `PORT` | `4000` | Backend HTTP port |
| `DATABASE_URL` | `postgresql://gradion_user:secure_pass@localhost:5432/expense_system?schema=public` | Full Postgres connection string (only var read by NestJS) |
| `MINIO_ENDPOINT` | `localhost` | MinIO host |
| `MINIO_PORT` | `9000` | MinIO API port |
| `MINIO_USE_SSL` | `false` | Enable TLS for MinIO |
| `MINIO_ROOT_USER` | `gradion_minio` | MinIO access key |
| `MINIO_ROOT_PASSWORD` | `secure_minio_pass` | MinIO secret key |
| `MINIO_BUCKET_NAME` | `receipts` | Bucket for receipt files |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | Public base URL for receipt links |
| `JWT_SECRET` | *(required)* | Signs access tokens — must be ≥ 24 chars |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime (e.g. `1h`, `7d`) |
| `AI_PROVIDER_API_KEY` | *(optional)* | External AI key — mock extractor used if blank |
| `CLIENT_ORIGIN` | *(optional)* | CORS allow-list, comma-separated. Defaults to `localhost:3000` in dev. |

The client needs no `.env` — falls back to `http://localhost:4000/api/v1`. To override:

```bash
# client/.env  (optional)
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

---

## 3. Start infrastructure

Postgres and MinIO run in Docker; `minio-setup` auto-creates the `receipts` bucket on first boot.

```bash
docker compose up -d
docker compose ps
```

| Service | URL |
|---|---|
| Postgres | `localhost:5432` |
| MinIO API | `localhost:9000` |
| MinIO Console | `http://localhost:9001` (user: `gradion_minio` / pass: `secure_minio_pass`) |

---

## 4. Database migrations

`docker compose up -d` runs migrations automatically via the `seed` service — no manual step needed for a fresh setup. The commands below are for development iteration (after pulling schema changes, or when running without Docker).

```bash
cd backend
pnpm migration:run    # apply pending
pnpm migration:show   # check status
pnpm migration:revert # roll back last
```

---

## 5. Start

**Option A — everything at once (recommended):** builds `shared` first, then starts `backend` + `client` in watch mode.

```bash
pnpm dev
```

**Option B — individually:**

```bash
cd shared && pnpm build   # or pnpm dev for watch
cd backend && pnpm dev    # NestJS on :4000
cd client && pnpm dev     # Vite on :3000
```

| App | URL |
|---|---|
| Client UI | `http://localhost:3000` |
| Backend API | `http://localhost:4000/api/v1` |
| Health check | `http://localhost:4000/health` |

---

## 6. API reference

All routes prefixed `/api/v1`. Protected routes require `Authorization: Bearer <token>` or the `access_token` HTTP-only cookie (set by login/signup).

### Auth (public)

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | `{ email, password }` | Register + receive token |
| `POST` | `/api/v1/auth/login` | `{ email, password }` | Login + receive token |
| `POST` | `/api/v1/auth/logout` | — | Clear auth cookie |
| `GET` | `/api/v1/auth/me` | — | Return current user |

### Expense reports (user)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/reports` | List own reports (filterable by `?status=`) |
| `POST` | `/api/v1/reports` | Create a new DRAFT report |
| `GET` | `/api/v1/reports/:reportId` | Get report metadata (title, status, totalAmount — **no items**) |
| `PATCH` | `/api/v1/reports/:reportId` | Update title / description |
| `DELETE` | `/api/v1/reports/:reportId` | Delete a DRAFT report |
| `PATCH` | `/api/v1/reports/:reportId/submit` | Transition DRAFT → SUBMITTED |

### Expense reports (admin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/reports` | List all users' reports |
| `PATCH` | `/api/v1/admin/reports/:reportId/approve` | Transition SUBMITTED → APPROVED |
| `PATCH` | `/api/v1/admin/reports/:reportId/reject` | Transition SUBMITTED → REJECTED |

### Expense items

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/reports/:reportId/items` | List items for a report |
| `POST` | `/api/v1/reports/:reportId/items` | Upload a receipt (multipart `receipt` field) → returns item with `aiStatus: PROCESSING` |
| `PATCH` | `/api/v1/items/:itemId` | Update merchant / amount / date |
| `DELETE` | `/api/v1/items/:itemId` | Delete an item (only allowed when report is DRAFT) |

### Health

```bash
curl http://localhost:4000/health
```

---

## 7. Key workflows

### Register and create a report

```bash
# 1. Sign up
curl -s -c cookies.txt -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Password1!"}'

# 2. Create a draft report
curl -s -b cookies.txt -X POST http://localhost:4000/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{"title":"April expenses"}'
```

### Upload a receipt

```bash
curl -s -b cookies.txt -X POST \
  http://localhost:4000/api/v1/reports/<reportId>/items \
  -F "receipt=@/path/to/receipt.pdf"
# Response includes item.id and aiStatus: "PROCESSING"
# Poll GET /api/v1/reports/<reportId>/items until aiStatus is "COMPLETED"
```

### Submit → Approve workflow

```bash
# User submits
curl -s -b cookies.txt -X PATCH \
  http://localhost:4000/api/v1/reports/<reportId>/submit

# Admin approves (requires admin account)
curl -s -b admin-cookies.txt -X PATCH \
  http://localhost:4000/api/v1/admin/reports/<reportId>/approve
```

---

## 8. Testing

```bash
# All workspaces
pnpm test

# Backend only (unit + integration)
pnpm test:backend

# Client only
pnpm test:client

# Watch mode
cd backend && pnpm test -- --watch
```

---

## 9. Other useful commands

```bash
# Type-check without emitting
pnpm --filter backend typecheck
pnpm --filter client typecheck

# Build all packages for production
pnpm build

# Format all files
pnpm format

# Lint all packages
pnpm lint
```
