# Phase 20 — Stabilization, Migration Readiness and Release Gates

## Purpose

This phase prioritizes reliable installation and deployment over adding another large business module. It adds dependency-free repository checks and makes the API/operations dashboard distinguish a reachable database from a database with a usable Prisma migration history.

## Implemented in this phase

- `scripts/project-preflight.mjs`: static source/repository checks that run without installing the project dependencies.
- `scripts/project-preflight.test.mjs`: Node's built-in test suite for the preflight, including schema-parser negative cases.
- Root commands: `npm run preflight`, `npm run preflight:strict`, `npm run test:preflight`, and `npm run verify:source`.
- `apps/api/src/services/schema-readiness.ts`: evaluates the Prisma migration ledger without returning SQL or connection-error details to callers.
- API `/api/health/ready`: readiness now checks database connectivity, migration history and writable private storage.
- API `/api/operations/status`: returns the migration readiness summary to authorized operations users.
- Operations Console: displays a dedicated Database Migrations status card.
- CI: runs static preflight, its regression tests and cross-platform source checks before dependency installation.

## Commands

```powershell
npm run preflight
npm run test:preflight
npm run check:cross-platform
npx prisma validate
npm run db:generate
npm run typecheck
npm test
npm run build
```

Run `npx prisma validate` from `apps/api` so Prisma loads that workspace's environment. Repository preflight, its regression tests and cross-platform checks require Node.js; dependency-backed commands require successful package installation and, for database-backed checks, a reachable PostgreSQL instance and generated Prisma client.

## Strict release gate

```powershell
npm run preflight:strict
```

Strict mode must pass before production release. The repository has a root `package-lock.json` and three Prisma migration files; all three apply to the local database. Do not create a new baseline against a populated database. For a fresh empty database, use the official Prisma CLI to review migration application. For a populated database, back up data, preserve its existing history, and create a reviewed upgrade/baselining plan.

## Current verification evidence — 2026-11-02

- Official Prisma 6.19 validation and client generation pass; the local database reports all three migrations applied and the schema up to date.
- API, web, and mobile typechecks pass; API and web production builds pass.
- The API source suite passes 225 tests, the preflight regression suite passes 6 tests, and cross-platform source checks pass 48 checks.
- `npm ci` could not replace a Windows native dependency file that remained locked; `npm install` restored dependencies for the successful checks. Re-run clean install in an unlocked workspace.
- Standard source preflight currently reports runtime `.env` files in the local working tree. Their contents were not inspected or changed; keep them private and do not include them in source archives.
- Fresh-database migration, strict preflight in a clean source tree, full API end-to-end/security tests, restore drills, and production deployment remain unverified.

## Still required before production

1. Resolve dependency installation and commit a reviewed root `package-lock.json`.
2. Run Prisma validation and client generation with the official Prisma CLI.
3. Test all three migration files against a fresh database and validate the upgrade path.
4. Run API/web/mobile typechecks and production builds.
5. Run unit tests, API integration tests and end-to-end core workflows.
6. Verify campus and object-level authorization, upload scanning, payment callbacks, guardian consent and election secrecy.
7. Run backup/restore drills, device/browser tests, accessibility checks and deployment acceptance.

## Readiness semantics

`/api/health/live` means the process is running. `/api/health/ready` means the database responds, at least one successful Prisma migration exists with no incomplete migration, and private storage is writable. A database created with `prisma db push` but without migration history is intentionally not migration-ready for controlled production rollout.
