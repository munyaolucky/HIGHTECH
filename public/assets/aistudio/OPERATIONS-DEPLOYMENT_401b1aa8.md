# Production Integrations & Operations

This module provides a production-oriented operations foundation. It is not a certification that the full college platform is ready for real student data; the complete dependency build, Prisma validation, migrations, load tests, security review and restore drill must pass in a controlled environment first.

## Added capabilities

- **Provider adapters:** Resend email and Twilio SMS. Credentials are read only from environment variables. The admin console reports whether required configuration values are present; it never returns the secrets themselves.
- **Notification delivery worker:** Run `npm run worker:operations` in a separate process. Queued rows are claimed atomically, moved through `PROCESSING`, and then marked `SENT`, `FAILED`, retried as `QUEUED`, or moved to `DEAD_LETTER`. Retry delays use capped exponential backoff. A stale processing row can be requeued after `STALE_DELIVERY_MINUTES`.
- **Scheduled aggregate reports:** Admins can create daily, weekly and monthly aggregate reports scoped optionally to a campus. Recipients are validated against the permission required for the selected report. Report executions are auditable. Worker leases reduce the chance of two workers executing the same scheduled report at the same time.
- **Readiness and health:** `GET /api/health/live` is a process liveness endpoint; `GET /api/health/ready` checks database connectivity and writable private-file storage. Authenticated Super Administrators and Administrators can open `Operations & Integrations` for queue status, worker heartbeats, configuration status and aggregate runtime metrics.
- **Request correlation:** HTTP responses include `X-Request-ID`. API request completions are logged as JSON with request ID, route, method, status and duration. Unhandled errors return a correlation ID and do not expose SQL, stack traces, credentials or request bodies.
- **Optional error webhook:** `ERROR_TRACKING_WEBHOOK_URL` can point to a controlled event collector. Only a minimized event (request ID, route, method, response status, error class and timestamp) is sent; no query/body, stack, token or student record content is sent.
- **Deployment automation:** GitHub Actions runs Prisma validation, client generation, type checking, unit tests, builds and Docker image builds. Production Docker Compose includes PostgreSQL, API, operations worker and static web/Nginx services.
- **Backup and restore scripts:** database backups use PostgreSQL custom format; private uploads are backed up separately. Restore scripts require both a command-line confirmation switch and a typed confirmation.

## Local configuration

Copy `apps/api/.env.example` to `apps/api/.env` and set the base application values. Blank optional provider fields are valid and mean that integration is disabled.

### Email with Resend

Set `RESEND_API_KEY` and `EMAIL_FROM` to an address accepted by the configured sender domain. For live delivery, verify the sender domain and provider account first. Email delivery rows only enter the queue when the recipient's email notification preference and relevant category preference are enabled.

### SMS with Twilio

Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM_NUMBER`. Recipients must have a valid phone number accepted by the provider, typically in E.164 format. SMS messages are truncated to a conservative length by the adapter; test with approved test numbers before enabling real messaging.

Do not put secrets in source, build arguments, client-side variables or screenshots. For deployments, use the environment/secret manager and rotate credentials if they are exposed.

## Run the API and worker

In one terminal, run the API and web app:

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
# Edit apps/api/.env before starting. For a new database, see the first-time setup in README.md.
npm run db:generate
npm run dev
```

In a second terminal:

```powershell
npm run worker:operations
```

The API and worker must use the same `DATABASE_URL`, private-file storage volume and provider configuration. Use a unique `OPERATIONS_WORKER_ID` per worker replica. The worker updates heartbeat rows, claims work atomically, and handles delivery jobs and due report schedules. Start it under a process manager or container restart policy in production.

## Operational APIs

All `/api/operations/*` routes require an authenticated user with the `operations:manage` permission (currently Super Administrator and Administrator roles).

- `GET /api/operations/status` — readiness, provider-configuration flags, worker heartbeats and delivery queue status.
- `GET /api/operations/metrics` — process uptime/memory and operational record counts.
- `GET /api/operations/scheduled-reports` — schedules and recent execution status.
- `POST /api/operations/scheduled-reports` — create a schedule.
- `PATCH /api/operations/scheduled-reports/:id` — edit its name, recipient list, enabled flag or next-run time.
- `POST /api/operations/scheduled-reports/:id/run` — request a manual run using the same lease mechanism as the background worker.
- `GET /api/operations/scheduled-reports/:id/executions` — inspect execution history.
- `POST /api/operations/scheduled-reports/:id/enable` and `/disable` — enable or disable execution.
- `GET /api/operations/notification-outbox` — review deliveries and retry/error metadata (message body is not returned here).
- `POST /api/operations/notification-outbox/:id/requeue` — reset only `FAILED` or `DEAD_LETTER` rows for another attempt.

Scheduled reports use rolling 30-day aggregate windows. Finance report values remain separated by currency. Report emails contain aggregate summaries rather than CSV attachments and recipients are revalidated against their current role permission at execution time.

## Delivery semantics and limitations

Delivery is **at least once**, not exactly once. A provider may accept a message immediately before the network connection fails; in that case a retry can produce a duplicate. Monitor provider delivery logs and consider provider-supported idempotency if available for your provider/account. A delivery stuck in `PROCESSING` beyond the stale threshold is requeued, which likewise can duplicate a message if a provider accepted it before the worker crashed.

`FAILED` indicates a non-retryable error (for example, a missing provider configuration or recipient address). `DEAD_LETTER` indicates that the retryable delivery reached the configured maximum. Fix the cause before manually requeuing. Do not store complete provider response bodies or credentials in the `lastError` field.

The worker uses the Resend REST API and Twilio Messages REST API. It does not support inbound email/SMS, provider delivery webhooks, push notifications, attachments, message templates, quiet hours, unsubscribe management or consent/legal compliance workflows for marketing communications. Use only transactional/college communications covered by approved policy, honour preferences, and configure appropriate consent and opt-out handling before any SMS/email rollout.

## Database migration strategy

This archive intentionally does not invent a migration history. For a brand-new database, follow README first-time setup and generate a single `foundation` migration from the full schema. If a working database already has earlier migration files, preserve all previous migration files and generate a follow-up migration named `operations_integrations`:

```powershell
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name operations_integrations
npm run typecheck
npm test
npm run build
```

Never delete/recreate migration history or run a fresh foundation migration against a database with existing college data. Back up first and use a test copy to validate the migration.

## Production Compose deployment

1. Copy `.env.production.example` to `.env.production` and fill every required value with real secrets using a secret manager where possible. The example password and JWT secret are not production secrets. Keep this file out of version control.
2. Use a URL-safe PostgreSQL password for `DATABASE_URL`, or percent-encode special characters correctly. Keep the app's DB credentials least-privileged.
3. Run schema migration in a separate controlled step from a trusted deployment shell. The Compose startup does **not** automatically apply migrations.
4. `scripts/deploy.ps1` (Windows) or `scripts/deploy.sh` (Linux/macOS) builds and starts the services and checks API readiness. The web container listens on the configured host port and is intended to sit behind a TLS-terminating reverse proxy. Keep PostgreSQL private; the production Compose file does not publish its port.
5. Set `WEB_ORIGIN` and `PUBLIC_APP_URL` to the actual HTTPS origin. Verify the external proxy forwards secure context and request IDs appropriately. Do not expose the web port directly over public plaintext HTTP while secure cookies are enabled.
6. Review container logs and the Operations & Integrations screen. The operations worker must show a recent heartbeat before expecting queued messages or scheduled reports to run.

### Environment variables

Required in production: `DATABASE_URL`, `JWT_ACCESS_SECRET` (at least 32 characters), `WEB_ORIGIN`, `PUBLIC_APP_URL`, `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`. `COOKIE_SECURE=true` is mandatory for production. Provider and worker tuning variables are described in `.env.production.example`.

## Backups and recovery

The database and uploaded files are separate assets; back up both, preferably in one coordinated window:

```powershell
./scripts/backup.ps1 -Component Database
./scripts/backup.ps1 -Component PrivateFiles
```

Linux/macOS:

```bash
./scripts/backup.sh database
./scripts/backup.sh private-files
```

Backups are written to `./backups/`, which is ignored by Git. The scripts do not delete old backups. Encrypt before off-site transfer, enforce a documented retention schedule, restrict access to backups, and verify file hashes after transfer. Consider application-consistent snapshots; pause uploads or run backups during a quiet period if strict consistency between document metadata and stored files is important.

Database restore requires an explicit confirmation:

```powershell
./scripts/restore-database.ps1 -BackupFile ./backups/hitech-database-example.dump -ConfirmRestore
```

The shell equivalent is `scripts/restore-database.sh <backup.dump> --confirm-restore`. Restoring replaces objects in the configured target DB. Perform restores into an isolated recovery environment first, then verify key student/application/invoice counts and health checks before touching the production database.

Private-file restore requires `scripts/restore-private-files.ps1 -ArchiveFile <archive.tar.gz> -ConfirmRestore`. Pause upload/download services and the worker first. Restore only archives whose content was verified, compare hashes/file manifests, then verify that referenced files exist and authorized downloads work. The DB and private uploads must be restored to a compatible point in time.

The supplied scripts create local backups; they do not encrypt, replicate off-site, schedule backups automatically, monitor backup age or prove restoration. Configure an external scheduler and immutable/off-site destination, alert on failures, and test recovery at least quarterly or according to the college's approved RPO/RTO.

## CI and pre-production checklist

GitHub Actions is in `.github/workflows/ci.yml`. It runs validation, generated-client typechecking, tests/build and Docker image builds. Before go-live, additionally run database migration tests on a disposable DB, route/authorization tests, load tests, OWASP/security review, accessibility audit, backup restoration, provider sandbox/live test, email/SMS consent review, dependency scanning and a staged rollback rehearsal.

## Known limitations

- Not all earlier modules enforce server-derived branch/campus scope; role-level permissions are not enough for multi-campus privacy.
- Scheduled report summaries are aggregate-only and are not downloadable attachments; advanced custom report definitions are not implemented.
- Metrics are authenticated JSON for the college console, not a Prometheus/OpenTelemetry endpoint.
- Error tracking is JSON stdout plus an optional generic webhook, not a fully featured vendor SDK or alerting policy.
- This module provides deployment templates but has not been built/run against a live database in the source-generation environment. Do not claim the whole application is production-verified until CI passes in your environment.
