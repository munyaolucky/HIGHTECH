# HI-TECH College — Prioritized Implementation Backlog

**Backlog version:** 1.1  |  **Based on:** source review and verification on 2026-11-02  |  **Scope:** platform stabilization + advanced feature expansion

## Important status semantics

“Present in source” means related code is present, **not** that the feature has passed production verification. The current workspace has module routes/screens, PWA/mobile scaffolding, a root lockfile, and three Prisma migrations; the local database reports all three applied. Clean lockfile installation, fresh-database migration, provider-backed email, comprehensive authorization, end-to-end workflow, restore and deployment tests remain verification gates.

### Snapshot of the source audit

| Observation | Result |
|---|---|
| Module route files | 16 files under `apps/api/src/routes` |
| Main web screens/components | 20 TS/TSX files under `apps/web/src` (top level) |
| Mobile source | Expo workspace and API client present |
| Focused rule tests | 14 service test files |
| Prisma migration files | 3 migration files; local database reports all applied |
| Runtime verification | API/web builds and workspace typechecks pass; 225 API source tests and 48 cross-platform checks pass; production database and full end-to-end validation remain outstanding |

## Release gates

| Priority | Goal | Exit gate |
|---|---|---|
| P0 | Stabilize current source | Clean install, valid schema/migration, typecheck/build, critical API/permission tests, restore drill and core accessibility review |
| P1 | Finish critical college operations | Admissions, academic rules, finance integration, secure documents, reporting scope and notification delivery pass E2E tests |
| P2 | Add enterprise capabilities | Quality/accreditation source is present but requires validation; procurement/assets, research, advising, governance, search and advanced analytics need implementation and acceptance |
| P3 | Expand devices and specialized capabilities | Native watch, immersive learning, synchronized canvas and resilience targets are tested on supported hardware/infrastructure |

## Backlog by priority

### P0 — Stabilize before adding more modules (16 items)

| ID | Workstream / item | Source assessment | Dependencies | Acceptance summary |
|---|---|---|---|---|
| STAB-001 | **Build & release:** Make dependency installation reproducible and complete | Validation gate outstanding | Registry/network; supported Node.js; lockfile policy | Clean clone installs from the committed lockfile on supported Node LTS without manual package edits. |
| STAB-002 | **Database:** Validate the full Prisma schema and generate client | Passed locally; clean-install reproduction pending | STAB-001 | prisma validate and generate complete without errors; schema is reviewed and reproducible. |
| STAB-003 | **Database:** Create and apply a reviewed baseline migration | 3 migrations applied to local database; fresh-database gate outstanding | STAB-002; approved schema | Fresh PostgreSQL database reaches current schema via committed migrations; migration history is preserved on upgrade. |
| STAB-004 | **Build & release:** Pass full API, web and mobile typechecks and production builds | Passed locally; clean-install reproduction pending | STAB-001; STAB-002; STAB-003 | All workspace typechecks and production builds pass with no ignored errors. |
| STAB-005 | **Testing:** Build automated API integration-test suite | Partial foundation | STAB-001; STAB-003; test fixtures | Critical endpoints have success, validation, unauthorized, cross-campus and concurrent-request tests. |
| STAB-006 | **Testing:** Add end-to-end tests for critical college journeys | Missing / planned | STAB-004; test accounts/fixtures | Automated tests cover apply-to-admit, enrolment-to-results, invoice-to-payment, document review, guardian revocation and staff leave. |
| SEC-001 | **Security:** Enforce row-level campus/department authorization across all APIs | Partial foundation | Identity model; campus relationships | Every protected read/write/export applies server-derived scope; cross-campus access fails unless explicitly granted. |
| SEC-002 | **Security:** Perform a full authorization and role matrix audit | Partial foundation | SEC-001 | Each role/action has defined allow/deny behavior; no route trusts client-supplied role or campus scope. |
| SEC-003 | **Identity:** Verify session rotation, revocation, recovery and MFA for privileged roles | Partial foundation | STAB-005 | Refresh reuse is detected, revoked sessions cannot refresh, reset tokens are single-use and privileged accounts can use MFA. |
| SEC-004 | **File security:** Adopt private production object storage and malware scanning/quarantine | Partial foundation | Document policy; secrets management | Files are private by default, scanned before approval, quarantine is isolated, signed links expire, and download authorization is rechecked. |
| SEC-005 | **Privacy:** Complete privacy, retention and safeguarding review | Partial foundation | Data inventory; legal/institutional policy | Each sensitive domain has owner, purpose, access scope, retention period, export/deletion rules and incident process. |
| OPS-001 | **Reliability:** Prove backup and restoration for database and private files | Partial foundation | Private storage; database; secrets | Restoration recreates a consistent database and file state within agreed RPO/RTO; recovery procedure is documented. |
| OPS-002 | **Configuration:** Validate environment variables, secret storage and environment separation | Partial foundation | STAB-001 | No secrets committed; missing production settings fail safely; dev/staging/prod use separate credentials and origins. |
| OPS-003 | **Observability:** Verify structured logs, request IDs, health/readiness and alerting | Partial foundation | STAB-004 | Health reports dependency readiness; logs contain correlation IDs but not secrets/ballots/private content; alerts fire on test failures. |
| UX-001 | **Accessibility:** Run accessibility and responsive QA on core workflows | Missing / planned | STAB-004 | Critical paths support keyboard, screen-reader labels, contrast, zoom and mobile navigation. |
| DATA-001 | **Data management:** Create safe seed fixtures and deterministic local setup guide | Partial foundation | STAB-003 | Fresh developer setup yields safe synthetic data, predictable roles and repeatable test conditions; no real personal data in fixtures. |

### P1 — Finish core operational workflows (25 items)

| ID | Workstream / item | Source assessment | Dependencies | Acceptance summary |
|---|---|---|---|---|
| ADM-001 | **Admissions:** Complete applicant identity/document verification and offer acceptance | Offer issue/response and post-acceptance account creation implemented in source; required-document gate present | STAB-003; SEC-001; DOC-001 | Applicant can submit required real files, receive an offer, accept/decline it and progress to student creation with full audit history. Binary upload, applicant identity verification, provider-backed live delivery and route/database integration tests remain outstanding. |
| ADM-002 | **Admissions:** Deliver transactional admission email and reminders | Offer delivery path implemented; provider credentials and remaining templates are outstanding | Notification worker; template policy | Submission, offer and missing-document notices send with retry and delivery history. |
| ACA-001 | **Academics:** Implement approved grading scales, credit rules, prerequisites and progression | Partial foundation | ACA structure; registrar-approved academic policy | Progression and completion use versioned, configured rules; prohibited enrolment paths are rejected. |
| ACA-002 | **Examinations:** Complete exam seating, papers, exam incident and supplementary workflows | Missing / planned | ACA-001; room inventory | Exam rosters avoid conflicts, papers are permission-restricted, incidents and supplementary decisions are auditable. |
| ACA-003 | **Records & certification:** Generate verified transcripts, completion letters and certificates | Missing / planned | ACA-001; student lifecycle; document storage | Only authorized approved results drive official records; each issue has unique ID, version, issuer and verification status. |
| FIN-001 | **Payments:** Implement live M-Pesa Daraja STK Push and verified callbacks | External credential or infrastructure | FIN base; callback security; secret manager | Initiation, signed/verified callback, idempotent application, timeout reconciliation and duplicate callback behavior are tested. |
| FIN-002 | **Finance:** Finish receipt issuance, refunds, reversals and bank reconciliation | Partial foundation | FIN-001; accounting policy | Every receipt maps to confirmed payment; refunds require approval and reverse ledger effects without deleting history. |
| FIN-003 | **Accounting:** Implement chart of accounts, journals and period close | Missing / planned | Finance domain; approved accounting design | Balanced journal rules, approvals, period close and controlled reopen are tested. |
| DOC-001 | **Documents:** Add antivirus scanning, quarantine and object storage | Partial foundation | SEC-004 | Unscanned files are not published; quarantine, scan results and safe file lifecycle are enforced. |
| DOC-002 | **Documents:** Enforce retention, legal hold, archival and verified deletion | Partial foundation | SEC-005; DOC-001 | Scheduled retention jobs respect holds, approvals and recovery policy; deletion is auditable and irreversible only when permitted. |
| DOC-003 | **Credentials:** Add certificate signatures, QR verification and revocation | Missing / planned | ACA-003; DOC-001 | Public verification reveals minimal data, confirms validity and detects revoked/superseded credentials. |
| LEARN-001 | **E-learning:** Finish accessibility, caption/transcript and resource licence enforcement | Partial foundation | DOC-001; content taxonomy | Restricted/licensed resources obey permissions; published videos meet institutional caption/transcript requirements where applicable. |
| LEARN-002 | **E-learning:** Synchronize learning progress and assignments across devices | Partial foundation | API contract; mobile authentication | Progress, submissions and feedback persist server-side and are consistent across web and mobile. |
| HR-001 | **HR:** Complete leave accrual, holiday calendars and staff onboarding | Partial foundation | HR base; institutional HR policies | Balances calculate against versioned policy, overlaps are prevented and onboarding/offboarding is auditable. |
| HR-002 | **Payroll:** Implement payroll and payslip controls | Missing / planned | Finance accounting; HR contracts; access controls | Payroll periods, approved earnings/deductions, reviewed outputs and payslip distribution have segregation of duties. |
| HOST-001 | **Hostels:** Harden allocation concurrency, occupancy eligibility and safeguarding | Partial foundation | SEC-001; hostels base | Concurrent requests cannot allocate one bed twice; eligibility rules are explicit; sensitive cases have strict access and escalation. |
| ELEC-001 | **Elections:** Complete independent election-security review and recount procedures | Partial foundation | SEC-001; election policy | Eligibility and ballot storage are separated; no normal admin view links person to choice; recount and dispute process is documented. |
| CMS-001 | **CMS:** Add page versioning, rollback, rich-text editor and link/accessibility checks | Partial foundation | CMS base; media security | Published revisions can be restored; editor sanitizes content; broken links and missing alt text are flagged before publishing. |
| REPORT-001 | **Reports:** Enforce server-derived campus scope in reports and exports | Partial foundation | SEC-001 | Clients cannot broaden their scope by changing a campus query; exported rows match authorized data. |
| REPORT-002 | **Reports:** Add scheduled report delivery and XLSX/PDF export | Partial foundation | OPS worker; REPORT-001 | Schedules honor recipient permissions and timezone; files expire safely; failed runs are retried and audited. |
| NOTIF-001 | **Communications:** Activate production email/SMS and push-token delivery | External credential or infrastructure | STAB-001; worker; preference policies | Provider credentials are environment-managed; token registration/revocation works; events honor preferences and templates. |
| GUARD-001 | **Parent portal:** Complete guardian identity/relationship verification and minors policy | Partial foundation | SEC-001; institution policy | Separate accounts, expiry/revocation, guardian relationship checks and age-appropriate consent are verified. |
| CAREER-001 | **Careers:** Complete employer verification, moderation and recruitment operations | Partial foundation | SEC-001 | Employers are verified before posting; applications are private to student and authorized recruitment staff; status transitions audited. |
| MOB-001 | **Mobile:** Build and test mobile release artifacts; implement native staff workflows | Partial foundation | STAB-004; API auth | Android build succeeds; iOS build is verified on macOS/EAS; logout/session expiry and core screens pass device tests. |
| SUPPORT-001 | **Help Centre:** Validate the support ticket workflow and add service-level escalation | Source present — validation pending | STAB-002; SEC-001; notification worker | Requesters see only their own tickets and public messages; authorized support staff manage assignment/status; transitions, internal notes, audit events and escalation are covered by tests. |

### P2 — Advanced institutional capabilities (20 items)

| ID | Workstream / item | Source assessment | Dependencies | Acceptance summary |
|---|---|---|---|---|
| QA-001 | **Quality assurance:** Validate and complete accreditation evidence and corrective-action management | Source present — validation pending | Document Centre; curriculum map; baseline migration | Frameworks and standards can be approved by an independent reviewer; reviews are campus-scoped; only shareable approved documents can be linked; findings and actions require independent verification; migrations and end-to-end tests pass. |
| CUR-001 | **Curriculum:** Implement outcome-to-assessment mapping and competency tracking | Missing / planned | ACA-001 | Every defined programme outcome maps to units and assessments; attainment reports show evidence and version. |
| ADV-001 | **Student success:** Add academic advising and human-reviewed early-support workflows | Missing / planned | Academic results/attendance; case privacy | Indicators create a review task, not an automatic sanction; support plans and outcomes are auditable. |
| RES-001 | **Research:** Add research proposals, ethics approvals, projects and repository | Missing / planned | Document Centre; role model | Proposals, ethics decisions, grants, milestones and outputs have appropriate restricted access and audit. |
| PROC-001 | **Procurement:** Implement requisitions, supplier review, purchase orders and three-way match | Missing / planned | Accounting/finance; RBAC | Purchase requests follow approval limits; received goods and supplier invoices reconcile to orders. |
| ASSET-001 | **Assets:** Implement inventory, serial tracking, maintenance and disposal | Missing / planned | PROC-001; facilities | Assets have ownership, location, warranty, transfers, maintenance and approved disposal history. |
| FAC-001 | **Facilities:** Add room/equipment booking and preventive maintenance work orders | Partial foundation | Academic timetable; asset register | Rooms/equipment are reserved without conflicts and maintenance work orders have SLA/status/history. |
| AID-001 | **Financial aid:** Add scholarship/sponsorship applications, award rules and reconciliation | Partial foundation | Finance; admissions; student records | Eligibility, independent review, awards, disbursements, renewals and sponsor reporting remain separate from payments. |
| SEARCH-001 | **Knowledge management:** Implement unified permission-aware search | Missing / planned | SEC-001; document/resource taxonomies | Search indexes only permitted content and snippets; permission changes invalidate access promptly. |
| API-001 | **Developer platform:** Publish OpenAPI contracts, version policies and sandbox instructions | Missing / planned | Stable API; STAB-004 | Documented endpoint schemas, auth, errors and pagination match implementation; contract tests detect drift. |
| I18N-001 | **Localization:** Implement translation infrastructure and locale-aware formatting | Missing / planned | Design system; content workflow | UI strings are translatable, dates/numbers format by user locale and time-zone-sensitive events use explicit timezone. |
| A11Y-002 | **Accessibility:** Implement WCAG-oriented content editor and accessibility gate | Missing / planned | CMS-001; A11Y-001 | Publishing flags missing alt text, heading structure and form labels; keyboard and contrast checks pass critical templates. |
| AI-001 | **AI assistant:** Add permission-aware AI knowledge assistant with citations and human handoff | Missing / planned | SEC-001; search; provider controls | Assistant answers from approved content with source citations, respects permissions, has rate/cost limits and human escalation. |
| AI-002 | **AI governance:** Create AI registry, evaluations, usage budget and consequential-action guardrails | Missing / planned | AI-001; data governance | Every AI feature has an owner, allowed data scope, eval set, cost cap and prohibited action list. |
| ANALYTICS-001 | **Analytics:** Add controlled retention/attrition and academic planning analysis | Partial foundation | REPORT-001; data quality | Metrics have documented definitions, freshness indicators and reviewable aggregation; no automated high-stakes decisions. |
| GOV-001 | **Data governance:** Create data inventory, owners, classifications and lineage | Missing / planned | SEC-005; integration registry | Sensitive datasets have owner, purpose, allowed users, source of truth and retention policy. |
| COMMS-001 | **Communications:** Add communication campaigns, quiet hours and suppression policies | Partial foundation | NOTIF-001; consent records | Campaigns honor targeting, time windows, preferences, rate limits and audit with delivery metrics. |
| ELECT-002 | **Elections:** Add ranked/multi-seat voting methods if institutional policy requires | Missing / planned | ELEC-001; approved election rules | Only institution-approved voting methods can be enabled and each has recountable, tested tally logic. |
| CANVAS-001 | **Learning canvas:** Move canvas from local browser storage to server-synced projects and permissions | Partial prototype | Auth; document/resource permissions | Users can save, share, revoke access and version canvas projects across devices. |
| CANVAS-002 | **Learning canvas:** Add collaborative editing, comments, undo/redo and conflict handling | Missing / planned | CANVAS-001 | Concurrent edits converge or show conflict; permissions are enforced per project; edit history is recoverable. |

### P3 — Future-facing capabilities (10 items)

| ID | Workstream / item | Source assessment | Dependencies | Acceptance summary |
|---|---|---|---|---|
| WATCH-001 | **Wearables:** Build native Wear OS/watchOS companion and publish tested releases | Partial prototype | MOB-001; NOTIF-001 | Watch app shows minimum necessary timetable/reminders and handles revoked sessions; store/device tests pass. |
| XR-001 | **AR/VR:** Expand WebXR demo into guided, assessed learning labs | Partial prototype | Learning resource model; competency model | Lab tasks have objectives, steps, checkpoints, progress persistence and accessible non-immersive equivalent. |
| XR-002 | **AR/VR:** Build campus virtual tour and facility information experience | Missing / planned | Approved campus assets; content CMS | Each campus can publish reviewed scenes, captions, safety/accessibility notes and updated points of interest. |
| CANVAS-003 | **Learning tools:** Add guided network simulations with scoring and instructor analytics | Partial prototype | CANVAS-001; competency framework | Students complete reproducible tasks; scoring is explainable, resettable and attached to authorized course activity. |
| MOB-002 | **Mobile:** Add offline learning packages with conflict-safe sync | Missing / planned | MOB-001; LEARN-002 | Only explicitly licensed non-sensitive materials are stored offline; sync conflicts are surfaced and private server data is not cached. |
| COMM-001 | **Student community:** Add peer learning groups, mentoring and skills passport | Missing / planned | CAREER-001; CUR-001 | Students manage opt-in portfolios, mentoring matches, permissions and achievements with moderation. |
| RESILIENCE-001 | **Reliability:** Set SLOs, error budgets, performance/load targets and incident exercises | Partial foundation | OPS-001; OPS-003 | Defined service objectives have dashboards, alerts, load tests and completed incident/restore exercises. |
| FIN-004 | **Finance:** Add forecasting and scenario modelling separate from actual ledger | Missing / planned | FIN-003; analytics governance | Forecasts show assumptions and remain visibly separate from actual accounting balances. |
| PROC-002 | **Enterprise services:** Add vendor contracts, renewal alerts and performance scorecards | Missing / planned | PROC-001 | Contract obligations, expiry alerts and vendor scorecards follow procurement policy with full audit. |
| RESEARCH-002 | **Research:** Add research repository, publication metadata and grant outcomes | Missing / planned | RES-001; document permissions | Public outputs are reviewed for rights and privacy; restricted datasets remain protected; grant outcomes are reportable. |

## Source inventory and mapping

| Module | Source evidence | Assessment | Main outstanding work noted in docs |
|---|---|---|---|
| Foundation/authentication | `apps/api/src/routes/auth.ts`, `middleware/require-auth.ts`, `apps/web/src/App.tsx` | Scaffold present; runtime unverified | Session security verification, full permission matrix, build and integration tests. |
| Academic structure | `college-structure.ts`, `AcademicStructure.tsx` | Partial foundation | Branch scope, progression/course cohorts, migration and database tests. |
| Admissions/onboarding | `admissions.ts`, `Admissions.tsx`, `StudentOnboarding.tsx`, `PublicApply.tsx` | Partial foundation | Production email credentials, real file uploads, identity verification and end-to-end offer acceptance validation. |
| Academic operations | `academic-operations.ts`, `AcademicOperations.tsx` | Partial foundation | Grade scales, prerequisites/credits, examination seating, progression and E2E tests. |
| Finance | `finance.ts`, `Finance.tsx` | Partial foundation | Live Daraja callbacks, refunds, bank import, accounting ledger and production controls. |
| E-learning/library | `learning.ts`, `Learning.tsx` | Partial foundation | Malware scanning, object storage, licensing/accessibility and branch-scoped authorization. |
| Documents | `documents.ts`, `Documents.tsx` | Partial foundation | Antivirus, production object storage, enforced retention, official signatures/QR. |
| HR | `hr.ts`, `StaffHR.tsx` | Partial foundation | Payroll, leave accrual/holidays, staff invitations, branch access. |
| Hostels/welfare | `hostels.ts`, `HostelsWelfare.tsx` | Partial foundation | Concurrent allocation, eligibility, safeguarding and branch authorization. |
| Elections/community | `elections-community.ts`, `ElectionsCommunity.tsx` | Partial foundation | Independent security review, ranked/multi-seat voting, concurrency, branch permissions. |
| CMS/public site | `cms.ts`, `WebsiteCMS.tsx`, `PublicWebsite.tsx` | Present in source; CMS advanced editing partial | Version rollback, rich-text editor, link/accessibility checks and branch scope. |
| Reports | `reports.ts`, `ReportsAnalytics.tsx` | Partial foundation | Server-derived campus scopes, scheduled reports and XLSX/PDF. |
| Notifications/guardians/careers | `notifications.ts`, `guardians-careers.ts`, `Engagement.tsx` | Partial foundation | Live provider delivery, push registration, guardian/legal verification, branch scoping. |
| Operations | `operations.ts`, `OperationsConsole.tsx`, `operations-worker.ts` | Development foundation | Production worker deployment, alert wiring, restore drills and operational acceptance. |
| Mobile/PWA | `apps/mobile`, PWA manifest and service worker | Partial foundation | Full build/device tests, native staff workflows, push registration and release packaging. |
| Canvas/AR/VR | `ExperientialLearning.tsx`, `LabScene.tsx`, `companion.ts` | Prototype | Server sync, collaborative edit, native watch app and headset testing. |

## Recommended execution plan

1. **Freeze feature expansion temporarily.** Use the latest consolidated archive as the audit baseline and create a source-control branch for stabilization.
2. **Resolve toolchain and database validity.** Complete clean dependency installation, Prisma validation/generation, baseline migration, seed workflow and typechecks.
3. **Build a test matrix from the API routes.** For every module, test anonymous access, permitted role, wrong role, wrong campus, wrong owner, invalid state transition, duplicate request and concurrency where relevant.
4. **Complete core end-to-end journeys.** Admissions → activation → registration → assessments/results; invoice → payment → receipt/reconciliation; upload → scan → review → authorized download; guardian consent → access → revoke.
5. **Finish external integrations using sandbox credentials.** Validate payment callbacks, email/SMS, push notifications and private object storage before enabling production settings.
6. **Run a security and privacy review.** Prioritize campus/row-level authorization, file exposure, confidential welfare/HR records, ballot secrecy and report exports.
7. **Only then begin P2/P3 expansion.** Add accreditation, procurement, research, AI, synchronized canvas and native wearable/immersive experiences after core release gates pass.

## Definition of Done

A backlog item is not “Done” solely because a route or screen exists. It must have a defined owner, acceptance criteria, validated schema/migration if applicable, server-side authorization, loading/empty/error states, automated tests, cross-module integration tests, audit/retention behavior, documentation, and a passing build in CI. External services also require sandbox tests and a documented production configuration.

## Backlog fields

The accompanying CSV contains unique IDs, priority, workstream, backlog item, source assessment, source evidence, dependencies, acceptance criteria, verification method, target release and external dependencies. It can be imported into a project tracker or opened in a spreadsheet.

**Current assessment:** this is an engineering backlog derived from the source archive. It is not a statement that any feature has passed production validation.

## Incremental update — AI Support Centre

The current source now includes an AI Support Centre foundation. These items extend the existing backlog without replacing the previous P0/P1/P2/P3 counts.

| ID | Work item | Source assessment | Dependencies | Acceptance criteria |
|---|---|---|---|---|
| AI-001 | Governed college knowledge articles and visibility policies | Implemented in source; validation pending | Schema migration; approved content owners | Only approved, in-window, role-visible articles can be retrieved by an ordinary user. |
| AI-002 | Independent review and publication workflow | Implemented in source; permission review required | AI-001; role matrix | Article creator cannot approve their own article; all decisions are audited. |
| AI-003 | Private chat history, citations and monthly quota | Implemented in source; database tests pending | AI-001; schema migration | Users can access only their own conversations; cited articles are re-filtered against current permissions. |
| AI-004 | Optional OpenAI-compatible provider with knowledge-only fallback | Implemented in source; credentials/provider tests pending | AI-001; provider configuration; privacy approval | With no key, no external call is made; provider failures fall back safely; timeout and quota behavior are tested. |
| AI-005 | Explicit human-support handoff | Implemented in source; support integration test pending | Support-ticket migration; role/ownership tests | Ticket is created for the requester; transcript inclusion defaults off and is only attached after explicit choice. |
| AI-006 | Evaluate grounding, jailbreak resistance and provider data handling | Missing / planned | Test set; approved policy corpus; provider terms review | Evaluation checks citation faithfulness, refusal when evidence is absent, prompt-injection resilience, sensitive-data handling and retention. |
| AI-007 | Semantic retrieval and article quality feedback | Missing / planned | AI-006; approved embedding/search architecture | Better retrieval is demonstrably more accurate while enforcing the same article permissions before returning content. |
| AI-008 | AI retention, deletion and cost/abuse monitoring | Partial foundation | Privacy/retention policy; provider usage data | Configured conversation retention is enforced; usage and cost indicators and abuse alerts are available to authorized operators. |

### AI Support Centre caveats

The external model adapter receives the current question after basic redaction plus approved article excerpts. Basic redaction is not a guarantee that all personal information is removed. Obtain privacy/provider approval before sending user content to an external service. The assistant is not connected to private student grades, invoice balances or document contents and must not claim to retrieve them. Lexical retrieval is a first implementation, not semantic search. Provider credentials, a reviewed migration, formal Prisma validation and end-to-end tests remain required before production.
