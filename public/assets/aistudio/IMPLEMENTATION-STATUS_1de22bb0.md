# HI-TECH College — Implementation Status Register

This register is the source-of-truth summary for what is present in the consolidated repository. **Present in source does not mean production-ready or end-to-end verified.** Latest verification: all 272 API tests pass, API typecheck/build pass, all six web tests pass, mobile typecheck and cross-platform source checks pass. The web typecheck and browser startup remain blocked by existing web-wide type errors and lecturer API imports. The new institution migration has not been applied. Clean lockfile installation, fresh-database migration, provider-backed delivery, full authorization, integration/E2E, restore and deployment validation remain release gates.

## Status definitions

- **Source present — validation pending:** related API/UI/data code is in the repository, but complete dependency-backed and database testing remains outstanding.
- **Partial/prototype:** some workflows or UI exist, but one or more material integration, policy, security or product requirements are missing.
- **Credential/infrastructure dependent:** source adapters exist but require a provider account, credentials, DNS, HTTPS or external infrastructure to operate live.
- **Not implemented / planned:** the feature is not materially represented as an operational workflow in the current source and needs development.

## Domain inventory

| Domain | Source status | Important gaps or acceptance requirements |
|---|---|---|
| Repository/workspaces | Source present — validation pending | Clean install, reproducible lockfile, typecheck/build and CI pass. |
| Authentication and sessions | Partial / validation pending | Email or admission-number sign-in, hashed single-use password-reset tokens, activation resend, request throttles, and session revocation on password reset are implemented. Live email-provider delivery, full integration/security tests and MFA remain outstanding. |
| Multi-tenant foundation | Partial — source and migration drafted; not deployed | An `Institution` tenant, institution-owned users/campuses, HI-TECH backfill, institution-scoped auth context, pending/active/suspended status gating, and institution-aware campus code uniqueness are defined. Non-default tenant access is intentionally restricted to the currently scoped governance endpoints until legacy operational modules receive tenant filters. User ownership for all legacy operational tables, cross-tenant constraints, tenant bootstrap/admin invitations, full route-by-route isolation, and a production migration rehearsal remain outstanding. The migration has not been applied to any database. |
| Super Admin / user access governance | Partial — platform institution governance, account administration and audit review source present | Super Administrators can search institutions, register pending tenants, review status, approve/reject/suspend/archive through audited transitions, and do platform-level account governance without default access to institution operational modules. Tenant administrators can be invited to active institutions through verified-email activation, and see accounts and audit activity scoped to their institution. Configurable platform policies, approval workflows, notifications, and full database-backed authorization/integration validation remain outstanding. |
| Institution Admin portal | Partial — tenant-scoped overview, institution profile and campus-management source present | Institution administrators receive scoped account, student, staffing, campus, programme and intake counts, active-campus rosters, and metadata-minimized audit activity; they can update their institution contact/location profile and manage institution-scoped campus records. Tenant navigation withholds operational workspaces whose routes are not yet tenant-safe. Configurable institutional policies, approval-flow design, committee governance, full scoped administration and database-backed runtime validation remain outstanding. |
| Campus/department/programme structure | Partial — campus scoping started | Campus listings, creation and updates are tenant-aware; non-default tenants remain blocked from other legacy structure endpoints until all related campus, department, programme and academic-period queries/mutations are consistently scoped. |
| Admissions and onboarding | Partial | Required document checklist items must be verified or formally waived before admission. Offer issue/email, single-use accept/decline, post-acceptance account creation, and email-verified applicant status links with a two-hour expiry are implemented in source. The applicant tracking migration is not yet applied. Binary applicant document upload, identity verification, configured live delivery, fresh-database migration validation and end-to-end/database integration tests remain outstanding. |
| Student lifecycle | Partial | Complete status transitions, transfers, deferrals, completion and record governance need validation/extension. |
| Academic operations | Source present — validation pending | Approved grading scales, examination workflows, progression/certification, concurrency and migration tests. |
| Finance and invoices | Partial | Current finance foundation and manual confirmation exist; live M-Pesa, automated callback/reconciliation, accounting ledger, refunds and official receipt lifecycle require further implementation. |
| E-learning/library | Partial | Resource/assignment foundations exist; malware scanning, production object storage, robust licence enforcement and server-synchronized progress need completion. |
| Document Centre | Partial | Upload/review/version/download code exists; production-grade private object storage, antivirus/quarantine, retention enforcement and complete scope testing are outstanding. |
| HR/staff | Partial | Staff, contract, leave, attendance and workload foundations; payroll, statutory rules, accruals, recruiting and comprehensive permissions need work. |
| Hostels/welfare | Partial | Inventory/allocation/maintenance/support foundations; sensitive-case safeguarding, policy enforcement and full campus scope need review. |
| Elections/community | Partial/prototype | Ballot data separation exists; independent security review, election procedures, concurrency/recount tests and ranked/multi-seat methods are not complete. |
| Public website/CMS | Source present — validation pending | Design and CMS flows exist; revision rollback, full accessibility checks, content analytics and launch QA remain. |
| Reports/analytics | Partial | Aggregate reports and CSV exports exist; campus authorization, additional export formats, data reconciliation and custom reporting need validation. |
| Notifications | Partial / credential dependent | In-app flows and delivery worker/adapters exist; provider credentials, delivery callbacks, opt-out/consent and live provider tests are needed. |
| Help Centre, settings and feature catalogue | Source present — validation pending | Authenticated support ticket schema/routes/screens, FAQ search, requester ownership and internal-note filtering are present; schema migration, authorization tests, attachments, SLA escalation and notification delivery need validation or implementation. |
| Parent/guardian portal | Source present — validation pending | Student-controlled consent, one-time email invitations, one-year consent expiry, scoped Parent web/mobile dashboards, meeting/complaint workflows, and campus-scoped audited administrator review are implemented. Relationship authenticity and guardian authority for minors still require institutional/legal policy, plus staging email and database integration tests. |
| Careers and employers | Partial | Opportunities/applications source exists; production employer verification and notification/placement operations need validation. |
| Alumni portal | Partial — core web/mobile workflows added | Graduated-record eligibility, private profile editing with review reset, consent-filtered directory, verified qualifications, document requests, campus opportunities, career applications and application status, and alumni/career event registration are available through `/api/alumni`, the careers API, the web portal and the mobile app. Applicant-facing career history excludes internal review notes. Association chapters, mentorship matching, contributions/donations, employment surveys, graduate-outcome reporting and provider-backed communication remain to be implemented or validated. |
| Operations and scheduled reports | Source present — validation pending | Worker, health endpoints, backup scripts and deployment templates exist; must test in runtime, CI and restore drills. |
| PWA | Source present — validation pending | Manifest and limited service worker exist; cross-browser install/offline/update testing remains. |
| React Native mobile | Partial/prototype | Student consent, guardian invitations/scope management, Parent academic/attendance/fee/timetable/assignment/exam summaries, meetings and complaints, plus alumni profile, qualification requests, careers and event registration, are implemented alongside existing mobile authentication; device QA, invitation deep-link integration, push-token registration, staff workflows and store release remain. |
| Smartwatch | Prototype | Watch-sized companion API/UI exists; no standalone native watchOS/Wear OS package. |
| Interactive canvas | Prototype | Local canvas and JSON import/export exist; server synchronization, collaboration and project sharing are outstanding. |
| AR/VR lab | Prototype | WebGL/WebXR prototype exists; equipment-specific testing and production instructional content are outstanding. |
| AI assistant | Source present — validation pending / provider credential dependent | Knowledge article workflow, role-filtered lexical retrieval, private conversation history, citations, usage quota and explicit support-ticket handoff added. Optional OpenAI-compatible provider needs credentials, provider privacy approval, evaluation, token-level cost controls and complete API/database tests. |
| Accreditation/quality assurance | Source present — validation pending | Frameworks, standards, reviews, evidence metadata, findings, corrective actions and permission gates are present; formal Prisma validation, migrations, DB route tests, end-to-end tests and programme-outcome mapping remain outstanding. |
| Procurement/assets | Not implemented as a complete workflow | Needs requisitions, suppliers, purchasing, receiving, inventory and asset lifecycle. |
| Research/innovation | Not implemented as a complete workflow | Needs proposals, ethics approvals, grants, milestones, publications and IP records. |
| Advanced institutional accounting | Not implemented as a complete ledger | Needs chart of accounts, journals, payables, financial close and approved accounting reconciliation. |
| Payroll | Not implemented as a complete workflow | Needs approved payroll rules, statutory updates, payslips, approvals and reconciliation. |
| Automated timetable optimization | Not implemented as a full optimizer | Needs hard/soft constraints, explainable conflicts, generation and scheduler acceptance tests. |
| Collaborative canvas/production ARVR | Not implemented as production services | Needs synchronization, auth/permissions, content pipeline, device testing and safety/accessibility assessment. |

## Verification already available in source

- `scripts/check-cross-platform.mjs` checks cross-client source contracts such as mobile workspace registration, session handling, PWA behavior, companion API integration and prototype boundaries.
- API service modules include focused unit tests for admissions, academic results, CMS rules, document policy, election rules, engagement, finance calculation, hostels, HR, learning file policy, operations, permissions, reports, support-ticket rules and watch companion rules.
- JSON/manifest/CSS parsing, TypeScript/TSX syntax transpilation and ZIP integrity checks were performed during archive generation.

### Verification evidence — 2026-11-02

- `npx prisma validate` and `npm run db:generate` passed with Prisma 6.19.0.
- `prisma migrate status` reports all three migrations applied and the local database schema up to date; this does not verify a fresh database.
- `npm run typecheck` passed for API, web, and mobile.
- `npm run build` passed for API and web. Vite reported existing dynamic-import and large-chunk warnings.
- `npm run test --workspace @hitech/api` passed 33 API source test files (225 tests), including offer issue/response, email/admission-number sign-in, and password recovery coverage.
- `npm run test:preflight` passed all 6 tests after updating expectations for the migration history and locally present environment files.
- `npm run check:cross-platform` passed all 48 source checks.
- API `/api/health/live` and `/api/health/ready` returned healthy responses during a local startup smoke test.
- `prisma migrate deploy` applied `20261102090000_offer_response_token`; a subsequent deploy found no pending migrations.
- Admissions workflow tests cover the required-document gate, offer response eligibility and post-acceptance account creation.
- A clean `npm ci` could not complete because Windows refused to replace a native dependency file in use. `npm install` restored the dependencies sufficiently for the checks above, but a clean-install gate remains open.
- `npm run verify:source` remains blocked because local runtime environment files were detected; their contents were not inspected or changed.

These checks do **not** prove database migration against a fresh or production-like database, live API workflows, full authorization coverage, restore readiness, or production deployment.

## Release acceptance gates

### Gate A — Reproducible build

- Install dependencies from the repository root on a clean machine.
- Commit and use a reviewed lockfile.
- Pass API, web and mobile typechecks/builds.
- Pass `npm run check:cross-platform` and unit tests.
- Fix all type/runtime errors; no unsupported claims of validation.

### Gate B — Database integrity

- Run `npm run db:validate` and `npm run db:generate`.
- Create a reviewed initial migration for an empty database.
- Commit the migration directory.
- Test fresh installation and upgrade from a backed-up representative database.
- Test constraints and transactional behavior under concurrent requests.

### Gate C — Security and privacy

- Enforce campus/department/ownership scope in every endpoint and export.
- Test role allow/deny matrix and direct object-ID attacks.
- Complete file malware scanning, quarantine, private storage and retention policies.
- Test session/token lifecycle, CSRF/CORS, secret handling, rate limiting and audit logs.
- Review guardian access, welfare data, HR records, financial data and ballot secrecy.

### Gate D — End-to-end college journeys

- Apply → review → offer → accept → activate → register.
- Register units → attendance → assessment → moderation → released results.
- Fee rate → invoice → payment request → confirmation/provider callback → reconciliation → receipt.
- Upload → scan → review → authorize download → version → retention.
- Guardian invite → verify → share scopes → revoke → verify denial.
- Staff leave submission → approval → balance/attendance consistency.

### Gate E — Deployment readiness

- HTTPS and secure secrets.
- Production provider verification.
- Backup and restore drill for database and private files.
- Monitoring and alerting.
- Accessibility, mobile browser and device testing.
- Load, concurrency and incident-response tests.
- Approved legal/institutional policy and launch sign-off.

| AI Support Centre | `ai-assistant.ts`, `assistant-rules.ts`, `AISupportCentre.tsx`, `AI-SUPPORT-CENTRE.md` | Source present; validation pending; provider credential dependent | Formal migration, AI quality/privacy evaluation, semantic retrieval, retention/cost monitoring, integration tests. |


## Advanced operations suite (added in this build)

Status words follow this register: **Typechecked + unit-tested rules** means the business rules have automated tests and the routes/screens compile and render against mocked data. **None of these routes has been run against a live PostgreSQL database**, and live M-Pesa needs Safaricom credentials and a public HTTPS callback.

| Module | What exists | Verified here | Still needed |
| --- | --- | --- | --- |
| M-Pesa Daraja (STK push, paybill confirmation) | Initiation, public callbacks verified by secret + known request, idempotent settlement, amount-mismatch hold, unmatched-receipt queue, simulation mode for local testing | Phone/callback parsing and secret comparison tested; routes typechecked | Daraja sandbox run, URL registration for paybill, public HTTPS URL |
| Refunds | Request, separate approval, payout recording, invoice rollback | Routes typechecked | Live database test |
| Statement reconciliation | Import statement lines, match by reference, flag differences | Matching logic tested | Live database test |
| General ledger | Chart of accounts, periods, balanced journals, post/reverse, trial balance, close/reopen | Journal, period and trial-balance rules tested | Auto-posting from fees and payments; statutory reports |
| Procurement | Suppliers, requisition value tiers, purchase orders, goods receipts, three-way invoice match | Tier, receipt and match rules tested | Stock counts, quotations (RFQ) |
| Asset register | Tags, assignment/transfer, maintenance, approved disposal, straight-line book value | Transition and depreciation rules tested | QR labels, bulk import |
| Research hub | Proposals, ethics gate for human participants, milestones, grants, outputs | Transition, ethics and funding rules tested | Document uploads, repository publishing |
| Timetable planner | Clash detection, explainable proposal generator, apply with re-validation | Generator and clash rules tested | Lecturer availability entry screen; heuristic, not a proven optimiser |

New environment settings: `FINANCE_ENFORCE_MAKER_CHECKER`, `MPESA_*` (see `apps/api/.env.example`).
New permissions: `procurement:manage`, `procurement:approve`, `research:manage`, `research:review`, `planning:manage`.


## Campus services suite (added in this build)

Same rule as above: rules are unit-tested; routes and screens are typechecked and rendered against mocked data; nothing has run against a live database.

| Module | What exists | Still needed |
| --- | --- | --- |
| Digital credentials | Request, separate approval, issue; checksummed codes; QR on the student view; public verification page (`/?verify=CODE`) showing only first name and last initial, programme, dates and state; revoke and replace; verification counter | Printable letter/certificate templates, e-signature provider, bulk issuing |
| Admissions CRM | Public enquiry form (`/?enquire=1`) with consent, honeypot and rate limit; staff pipeline, duplicate warnings, follow-up dates, contact log, funnel statistics | Automated reminder emails/SMS (needs notification providers), campaign tracking, link to application records |
| Appointments and service catalogue | Services with office hours (Nairobi time), free-slot generation, booking limits, cancellation, office queue, outcomes | Calendar sync, reminders, per-staff availability |
| Policies, compliance and data quality | Policy register with approval and acknowledgements, obligations register with evidence, read-only duplicate and missing-field checks on student records | Document attachments, retention scheduling, resolution workflow for findings |

New permissions: `credentials:manage`, `credentials:approve`, `crm:manage`, `compliance:manage`, `appointments:manage`.
Public URLs: `/?verify=<code>` and `/?enquire=1`. Public API: `GET /api/public/credentials/verify/:code`, `POST /api/public/crm/enquiry`.


## Assessment engine and cookie consent (added in this build)

| Module | What exists | Still needed |
| --- | --- | --- |
| LMS assessment engine | 18 question types, question bank with review and versions, assessment builder with random pools, timed attempts with autosave, anonymous marking queue, controlled release, item analysis, sample papers converted from your document | See `LMS-ASSESSMENT-ENGINE.md` |
| Cookie consent | Banner, settings panel, persistent withdraw button, public cookie policy, consent-gated preference storage | Legal review of the policy text; add the DPO contact |

New permissions: `lms:author`, `lms:mark`, `lms:approve`, `lms:release`.
