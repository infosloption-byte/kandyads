# Kandy Ads Deployment Guide

This repository has three deployable applications: the public Vite site in `frontend/`, the internal Admin Vite application in `admin/`, and the Fastify API in `backend/`.

## Deployment topology

Deploy the frontend and Admin as static Vite applications on a platform that supports SPA rewrites. Deploy the backend as a long-running Node.js service with network access to the production MySQL database.

The browser applications call the backend through:

```text
VITE_API_URL=https://<api-host>/api/v1
```

The backend must allow both deployed browser origins through `CORS_ORIGIN`.

## Production backend configuration

Set these environment variables on the backend service:

```text
NODE_ENV=production
PORT=<service-port>
DATABASE_URL=mysql://<user>:<password>@<host>:<port>/<database>
JWT_SECRET=<random-secret-at-least-16-characters>
CORS_ORIGIN=https://<public-site-host>,https://<admin-host>
```

Use a dedicated production database and credentials. Store secrets in the hosting provider's encrypted environment-variable store rather than in the repository.

## Database deployment

For a production database, use reviewed, version-controlled migrations. Do not use `prisma db push --accept-data-loss` as a production release mechanism.

Before applying migrations:

1. Confirm the target database and backup/restore path.
2. Review the migration SQL for destructive operations and compatibility with the production MySQL version.
3. Apply the migration during the planned release window.
4. Confirm the backend can start and the health endpoint returns HTTP 200.

The CI database currently uses MySQL 5.7 for compatibility coverage. Production may use a newer supported MySQL release only after validating Prisma behavior and migration compatibility.

## Backend build and start

From `backend/`:

```powershell
npm ci
npm run prisma:generate
npm run build
npm start
```

The service should expose `/health` and `/api/v1` after startup.

## Frontend deployment

From `frontend/`:

```powershell
npm ci
npm run build
```

Publish the generated `dist/` directory. Configure the host to rewrite application routes to `index.html` so direct navigation to paths such as `/quote` continues to work.

Set `VITE_API_URL` at build time to the production API base URL.

## Admin deployment

From `admin/`:

```powershell
npm ci
npm run build
npm run test
```

Publish the generated `dist/` directory and configure SPA rewrites. Set `VITE_API_URL` to the production API base URL.

## Release verification

After deployment, verify:

- `GET /health` returns `200`.
- The public site loads and `/quote` is reachable directly.
- Admin login succeeds and protected API calls use the production API.
- CORS allows the public and Admin origins and rejects unapproved browser origins.
- A read-only Admin screen loads from the API.
- A representative authenticated write operation succeeds and creates the expected audit record.
- Database-backed reports and inventory summaries load without errors.

## Rollback

Application rollback should restore the previous known-good frontend/Admin build and backend release. Database rollback must follow the migration's reviewed rollback procedure or restore from a verified backup; do not improvise destructive SQL in production.

Keep the previous application version available until post-release verification is complete.
