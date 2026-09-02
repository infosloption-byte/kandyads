# Kandy Ads Development Guide

## Repository layout

- `frontend/` — public customer-facing React/Vite website.
- `admin/` — internal operations React/Vite application.
- `backend/` — Fastify + TypeScript API with Prisma/MySQL.
- `TASKS.md` — authoritative implementation checklist.

## Prerequisites

Use Node.js 20+ for parity with CI. The backend requires a MySQL database reachable through `DATABASE_URL`.

## Backend local setup

From `backend/`:

```powershell
npm install
Copy-Item .env.example .env
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm run build
npm run test
```

Set `KANDYADS_TEST_MODE=1` when running integration tests. Never point tests at production. The repository test script runs test files with concurrency disabled because integration tests share one database and some fixtures are mutable.

A typical PowerShell test session is:

```powershell
$env:KANDYADS_TEST_MODE="1"
npm run test
```

## Backend environment

Required backend variables are defined in `backend/.env.example` and validated at startup:

- `NODE_ENV` — `development`, `staging`, or `production`.
- `PORT` — API listener port; defaults to `4000`.
- `DATABASE_URL` — MySQL connection string.
- `JWT_SECRET` — signing secret, minimum 16 characters.
- `CORS_ORIGIN` — comma-separated browser origins allowed to call the API.

Do not commit `.env` files or real credentials.

## Frontend and Admin

Both Vite applications use `VITE_API_URL` when present and otherwise default to `http://localhost:4000/api/v1`.

Run the public site from `frontend/`:

```powershell
npm install
npm run dev
```

Run the Admin application from `admin/`:

```powershell
npm install
npm run dev
```

For deployed builds, set `VITE_API_URL` to the public backend API base, including `/api/v1`.

## Testing rules

Every new backend module must ship with integration tests covering the happy path, validation failure, missing related records, authorization boundaries where applicable, business-rule/state transitions, and transaction side effects where applicable.

Integration tests must create their own mutable fixtures. Seeded records may be used for read-only discovery, but tests must not depend on a specific mutable seeded row surviving another test file.

For any failing full-suite test, first rerun the affected file in isolation and then the full suite. An isolated pass combined with a full-suite failure is treated as a fixture/lifecycle race until proven otherwise.

## Database changes

Development schema changes should be represented by version-controlled Prisma migrations when practical. Some capability/work-breakdown tables are intentionally provisioned with SQL because the stable Prisma client path does not yet declare those models. When adding such tables, update CI provisioning as part of the same change.

Do not use MySQL-incompatible `INSERT ... RETURNING` statements.

## Release workflow

Before merging a functional batch:

```powershell
# backend
cd backend
npm run build
$env:KANDYADS_TEST_MODE="1"
npm run test

# public site
cd ..\frontend
npm run build

# admin
cd ..\admin
npm run build
```

Review `TASKS.md` before starting the next batch and mark only completed items.
