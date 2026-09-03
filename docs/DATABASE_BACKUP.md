# Kandy Ads Database Backup / Restore Plan

## Backup policy

- Use automated MySQL backups from the production database provider at least daily.
- Retain daily backups for at least 14 days and longer-term weekly backups according to the hosting policy.
- Take an on-demand backup immediately before production schema migrations or major releases.
- Encrypt backups at rest and restrict access to the operations/database administrators.

## Backup verification

A backup is not considered verified until a restore test has successfully opened the database and basic integrity checks have passed.

At least monthly:

1. Restore the latest backup into an isolated MySQL instance.
2. Run Prisma client generation against the restored schema.
3. Start the backend against the restored database in a non-production environment.
4. Check `/health`, authentication, a representative CRM read, an inventory summary and a finance report.
5. Record restore date, backup identifier, database version and test result.

## Migration safety

Before every production migration:

1. Record the current application commit and database migration state.
2. Create and verify a fresh backup.
3. Review Prisma and any raw SQL migration for destructive changes.
4. Apply migrations with `npm run prisma:migrate:deploy` from `backend/`.
5. Run post-migration health and read-only smoke checks.

## Restore procedure

1. Stop or isolate application writes.
2. Identify the last known-good verified backup.
3. Restore it into a controlled database instance.
4. Verify schema and representative application reads.
5. Point the backend at the restored database only after verification.
6. Resume traffic and monitor logs.
7. Record the incident and data-loss window.

Never commit database credentials or backup files to this repository.
