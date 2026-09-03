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

- [ ] Confirm the target database and backup/restore path.
- [ ] Take a verified database backup and confirm it is readable.
- [ ] Review migration SQL for destructive operations and production MySQL compatibility.
- [ ] Record the application commit and migration state.
- [ ] Apply Prisma migrations with `npm run prisma:migrate:deploy` from `backend/`.
- [ ] Apply any explicitly documented raw-SQL migrations when they are not represented in Prisma migration history.
- [ ] Confirm the backend starts and `/health` returns HTTP 200.

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
```

Publish the generated `dist/` directory and configure SPA rewrites. Set `VITE_API_URL` to the production API base URL.

## Release checklist

- [ ] Backend integration tests pass against a dedicated non-production database.
- [ ] Backend production build passes.
- [ ] Admin production build passes.
- [ ] Public frontend production build passes.
- [ ] Production environment variables are configured.
- [ ] Database backup is verified before migration.
- [ ] Health check returns `200`.
- [ ] Admin login and protected API calls work.
- [ ] Public `/quote` and `/contact` workflows work.
- [ ] Notifications and audit records work.
- [ ] Representative reports, inventory summaries, PDF downloads and CSV exports work.
- [ ] Backend logs and database health are monitored after release.
- [ ] Deployed commit SHA and migration state are recorded.

## Rollback

Application rollback should restore the previous known-good frontend/Admin build and backend release. Do not blindly reverse production database migrations. Use a reviewed forward-fix migration or restore from a verified backup when database rollback is required.

Keep the previous application version available until post-release verification is complete.
