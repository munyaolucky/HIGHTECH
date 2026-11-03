# HI-TECH College — Master Feature Specification

## Product goal

One integrated digital institution for public information, admissions, teaching, academic records, finance, learning, staff, facilities, student services and lifelong engagement. Every client uses shared services and a governed source of truth. Interfaces are adapted to the device rather than duplicating the core data model.

## 1. Public website and institutional identity

- Premium responsive homepage and institutional profile.
- Mission, vision, history, governance, campuses, departments and staff directory.
- Programme catalogue, qualifications, entry requirements, duration, study mode and published fees.
- Admissions requirements, application entry, forms and public downloads.
- News, events, announcements, calendars and campus gallery.
- Contact forms, public enquiry queue, SEO metadata, social sharing and accessibility.
- CMS drafts, preview, approval, publication scheduling, expiry, archival, role-scoped editing and revision history.
- Public content is sourced from approved academic and financial records rather than duplicate manual catalogues.

## 2. Accounts, security and permissions

- Student, parent/guardian, lecturer, registrar, finance, HR, librarian, administrator, principal, super administrator and other constrained specialist roles.
- Account invitations, activation, password reset, session management, token rotation, logout/revocation and security alerts.
- MFA for privileged users; optional identity-provider integration.
- Role- and attribute-based access using campus, department, ownership, enrollment, consent, workflow state and data sensitivity.
- Server authorization on every read, create, update, approval, export and download.
- Request IDs, audit history, rate limiting, secure configuration, threat modeling and incident response.

## 3. Institutional structure and academic calendars

- Multi-campus hierarchy, departments, academic programmes, qualifications, units/modules, cohorts, intakes and curriculum versions.
- Academic years, terms, semesters, module blocks, teaching periods, examination windows, deadlines, holidays and graduation dates.
- Effective-dated changes and history preservation.
- Campus-scoped operational settings, calendars, currencies and time zones.

## 4. Admissions and student lifecycle

- Configurable applications, eligibility checks, application fee rules, drafts, supporting documents, interviews, offers, waitlists and appeals.
- Registrar review, missing-document requests, decisions, offer acceptance and communication history.
- Admission number assignment, secure invitation, account activation and profile completion.
- Student status lifecycle, transfers, deferrals, suspensions, withdrawals, completion, graduation and alumni conversion.
- Student profile, verified identity/contact data, emergency contacts, documents and official record correction workflow.

## 5. Academics, teaching and assessment

- Programme curriculum, outcomes, prerequisites, credits, practical hours and grading policy.
- Course offerings, section capacity, lecturer assignment, unit registration, add/drop and waitlists.
- Timetable generation/validation, classroom/lab bookings, recurring schedules, conflict detection and publication.
- Attendance sessions, authorized corrections, absence explanations and attendance reports.
- Assignments, projects, CATs, examinations, practicals, rubrics, question banks and submission versions.
- Marks, moderation, approval, grade calculations, result release, appeals, supplementary exams, progression and graduation eligibility.
- Official transcripts and certificates must derive from approved records and use verifiable issue/revocation records.

## 6. E-learning and digital library

- Course resources including PDF, office documents, slides, audio, video, ebooks, journals and practical guides.
- Unit and course mapping, searchable metadata, licensing, publication approval and version history.
- Assignments, due dates, late policies, submissions, resubmissions, marking and feedback.
- Learning progress, reading lists, accessible media/captions, learning activities and student resource history.
- Library inventory, lending/reservations if enabled, catalogue, license controls, fines and usage analytics.
- Protected resources use per-resource access policies; public information is never blanket-blocked because a fee balance exists.

## 7. Finance and accounting

- Tuition and service fee catalogue with rate versions, approvals, effective dates, campus/programme rules, taxes and currencies.
- Invoices with immutable line snapshots, payment allocation, student statements and official receipts.
- Scholarships, sponsorships, bursaries, discounts, waivers, credit notes, refunds and approvals.
- M-Pesa adapter with verified callback, idempotent processing, reconciliation and exception handling.
- Budgets, cost centres, chart of accounts, journals, payables, receivables, bank reconciliation, period close and approved accounting exports.
- Financial reports distinguish billed, collected, settled, refunded and outstanding amounts; currency totals are not mixed.

## 8. Document Centre and digital records

- Secure single/bulk upload, metadata, categories, versioning, preview, authorized download, temporary sharing and access audit.
- Type/size validation, malware scan, quarantine, private object storage and signed/short-lived download access.
- Review/approval lifecycle, rejection reasons, replacement, expiry, retention, archival, legal hold and controlled deletion.
- OCR/search indexing, templates, official letters, transcript/certificate generation, signature and QR verification where authorized.
- Preserve immutable history for official issued records and sensitive financial/academic transactions.

## 9. Human resources

- Staff records, employee identifiers, positions, departments, campuses, reporting lines and employment history.
- Contracts, effective dates, renewal/probation reminders, qualification documents and approvals.
- Leave rules/accrual, holiday calendars, attendance, schedules, workload, lecturer allocation and staff self-service.
- Recruitment, onboarding, performance reviews, training, payroll, payslips and statutory deduction configuration as later verified capabilities.
- Confidential compensation and personnel documents are strictly restricted.

## 10. Hostels, facilities and student welfare

- Hostels, buildings, floors, rooms, beds, occupancy, allocation, waiting lists, eligibility and stay dates.
- Check-in/out, room transfer, maintenance, visitor register, residence rules, emergency contacts and announcements.
- Accommodation charges integrate with finance; reservations and charges maintain history.
- Student support requests, counselling appointment coordination, referrals, welfare, accessibility accommodations, financial aid and follow-ups.
- Sensitive health, counselling, safeguarding and incident records have separate restrictive permissions and retention policies.
- Facilities/equipment booking, work orders, inspection schedules and maintenance history.

## 11. Elections, clubs, events and community

- Election configuration, nominations, candidate review, eligibility snapshots, secret ballot, duplicate-vote prevention, result publication and disputes.
- Preserve ballot secrecy against direct database relations and logs; independent election security review is required before official use.
- Clubs, societies, memberships, events, attendance, volunteer projects and service-hour records.
- Alumni profiles with publication consent, career mentoring, community outreach and partnerships.

## 12. Parent/guardian portal

- Optional student-consented invitation and separate guardian account.
- Identity and relationship verification; special rules for minors/legal guardians.
- Granular, revocable scopes for notices, attendance, released results, academic progress, fees and hostel data.
- Access history and immediate revocation; no automatic access to all documents, private communications, counselling, credentials or ballots.

## 13. Careers and employer services

- Employer registration and verification.
- Jobs, internships, eligibility, deadlines and moderation.
- Student CV/portfolio, applications, supporting documents, shortlisting, interviews, offers and status tracking.
- Placement monitoring, career counselling, employer events, alumni mentoring and outcome analytics.

## 14. Notifications and communication

- In-app inbox, unread count, preferences and role/campus-targeted notices.
- Transactional email/SMS adapters, push notification integration, templates and scheduled reminders.
- Delivery queue, atomic claims, bounded retry/backoff, dead-letter handling and delivery history.
- Quiet hours, consent/opt-out/suppression, localization, privacy-safe previews and recipient permission checks.
- Do not expose sensitive grades, financial details or welfare information in lock-screen notifications.

## 15. Reports and analytics

- Role-specific dashboards and aggregate reports across admissions, enrollment, academic performance, attendance, finance, staff, hostels, library and operations.
- Filters by campus, department, programme, cohort and academic period.
- CSV/XLSX/PDF output where implemented and approved; export logging and row-level permission scope.
- Scheduled reports and execution history.
- Data freshness indicators, reconciliation and aggregate trend reporting.
- Predictive analytics must be explainable and subject to human review; never make high-stakes automated decisions solely from a risk score.

## 16. Quality assurance and accreditation

- Accreditation/awarding-body register, programme approval/renewal dates and conditions.
- Mapping programme outcomes to standards and assessments.
- Evidence register, evidence owners, review deadlines, self-assessment reports and inspection packs.
- Internal audits, survey feedback, moderation reports, corrective/preventive actions and effectiveness reviews.

## 17. Curriculum competency and student success

- Competency frameworks, programme/unit outcomes, assessment-to-competency mapping and practical evidence.
- Recognition of prior learning, skill portfolios and verified mastery.
- Academic advising, study plans, progression checks and graduation pathways.
- Early-support indicators for missed assessments/attendance declines with human review and documented intervention.

## 18. Research, procurement and assets

- Research proposals, ethics approval, grants, milestones, supervisors, outputs, IP disclosures and institutional repository.
- Purchase requisitions, budgets, suppliers, quotation review, purchase orders, receiving, invoice matching and approval.
- Inventory, serial-number/QR asset tracking, stock moves, warranty, maintenance, assignment, transfer and controlled disposal.

## 19. Advanced planning and facilities

- Timetable optimization subject to room, cohort, lecturer, accessibility and equipment constraints.
- Alternative timetable comparison and explainable conflicts.
- Classroom/lab booking, equipment booking, work orders, preventive maintenance, safety inspections and utilization reporting.

## 20. Integration hub and APIs

- Versioned API contracts, OpenAPI documentation, scoped service accounts, webhook signing, replay protection, idempotency keys and usage limits.
- Provider registry, credential rotation, connection checks, retries, error queues and integration health metrics.
- Candidate providers: M-Pesa Daraja, email/SMS, object storage, identity providers, e-signatures, calendar, video learning, accounting exports and push notifications.
- Every live integration requires credentials, environment-specific settings, sandbox and failure-path tests.

## 21. AI and automation governance

- Permission-aware policy/knowledge search and student support assistant.
- Staff assistance for lesson drafts, metadata suggestions, report summaries and help-centre discovery.
- Approved provider/model registry, usage and cost controls, evaluation set, source references, prompt-injection defense and sensitive-data redaction.
- Human approval for admissions, grades, payments, disciplinary cases, certificates and any other consequential action.
- AI must not autonomously change official college records.

## 22. Cross-platform and experiential learning

- Responsive web app, installable PWA, React Native/Expo mobile client and shared API contracts.
- Watch companion for timetable, deadlines and urgent announcements; standalone native watch apps require separate delivery.
- Interactive learning canvas with validated import/export, undo/redo and versioning; server synchronization/collaboration requires implementation.
- 3D/WebXR campus/lab prototype, capability detection, device/browser fallback and accessible alternatives.

## 23. Operations, security and resilience

- Separate development/test/staging/production environments.
- Dependency lockfile, CI checks, typechecking, unit/integration/E2E tests and vulnerability scanning.
- Secure secrets, HTTPS, authorization tests, rate limits, request IDs, structured logs, health/readiness checks and alerts.
- Database and private-file backups, restore drills, recovery objectives, deployment rollback and incident response.
- Data inventory, classification, retention, legal holds, access/export logging, data quality and authorized correction workflows.
- Accessibility testing, responsive/mobile QA, load/concurrency tests and formal go-live sign-off.

## 24. Explicit non-goals

- Transport management.
- Treating all catalogue features as already implemented.
- Claiming provider integrations are live without credentials and successful live tests.
- Making automated high-stakes academic, financial, disciplinary or welfare decisions without human authorization.

## Acceptance standard

A feature is complete only when its data model/migration, server permissions, input validation, user interface, audit/retention behavior, tests, cross-module integration, operational configuration and documentation are verified. Source presence alone is not completion.


## 25. Help Centre, service desk and searchable feature catalogue

- Searchable FAQs and user guidance for common academic, finance, account and document questions.
- Authenticated support tickets with generated reference numbers, category, subject, description, status, timestamps and message history.
- Ticket requester access limited to their own records; internal notes are filtered from requester-facing responses.
- Support-team queues, status transitions, assignment and controlled administrative actions.
- Ticket ownership checks, validation and audit logging on sensitive actions.
- Searchable feature catalogue that labels source-included capabilities, prototypes and planned work without implying production verification.
- User settings for appearance and authenticated notification preferences.
- Future requirements: service-level targets, escalation rules, attachments with malware scanning, notification delivery proof, satisfaction surveys, department-specific queues, knowledge article approval and live operational dashboards.

The current help centre is a foundation. It must pass Prisma validation, migration tests, authorization tests and end-to-end testing before production use.
