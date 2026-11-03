# HI-TECH College — Unified Feature Catalogue

This document is the concise index of the whole product. The complete, traceable target-state requirements are in [HI-TECH-COLLEGE-COMPLETE-FEATURE-SPECIFICATION.md](./HI-TECH-COLLEGE-COMPLETE-FEATURE-SPECIFICATION.md); supporting domain requirements are in [MASTER-FEATURE-SPECIFICATION.md](./MASTER-FEATURE-SPECIFICATION.md). Implementation maturity and known gaps are recorded in [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md); prioritized engineering tasks are in [IMPLEMENTATION-BACKLOG.md](./IMPLEMENTATION-BACKLOG.md) and its CSV companion.

## User experiences

- **Public website:** Institutional information, programme and fee discovery, CMS-published news/events, enquiries, contact forms, and application entry.
- **Administration portal:** Role-scoped college structure, governance, approvals, student lifecycle, staff, finance, operations, quality, and reporting.
- **Academic and examination portals:** Curriculum, registration, timetable, attendance, assessments, examinations, moderation, controlled results, transcripts, and credentials.
- **Student portal:** Sign-in with email or admission number; secure activation/password recovery; own admissions/onboarding, profile, learning, timetable, attendance, released results, fee statements, documents, notifications, and student services.
- **Staff portal:** Assigned teaching and operational work, HR self-service, communication, and approved staff records.
- **Finance portal:** Approved rates, invoices, payment recording, reconciliation, accounting, and financial reports.
- **Website CMS and admissions:** Managed page layouts/navigation, SEO, multilingual publishing, site search/analytics, newsletter/forms, application review and offers, applicant communications, and recruitment reporting.
- **Mobile access:** Responsive web/PWA and companion mobile source; standalone native watch and production AR/VR are not implied.
- **Shared services:** Accounts, permissions, notifications, audit history, governed records, provider integrations, and operational resilience.

## Platform-wide foundation

- Shared web, API, database and mobile workspaces.
- Responsive UI, PWA scaffold, Expo mobile scaffold, shared API integration and device-oriented prototypes.
- Authentication/session foundation, single-use email account activation and password-reset links, role definitions, validation middleware, rate limits, request IDs, audit concepts and operational health endpoints.
- PostgreSQL/Prisma data model spanning the major institutional domains.
- Docker/Compose, CI, worker, backup/restore and deployment templates.

## College and academic operations

- Campuses, departments, programmes, qualifications, curriculum versions, units, academic years, periods and intakes.
- Admissions applications, application review, expiring single-use offer acceptance/decline, account/student creation after acceptance and onboarding.
- Offering setup, lecturer/class assignment, unit registration, academic calendars, lesson planning, timetables, attendance, assessments, marks, moderation and result release.
- Academic calendar/teaching operations, LMS course delivery and virtual classrooms, detailed examination and practical formats/security, grading/progression policy, and graduation/credentials are specified in REQ-067–REQ-070 and REQ-080; provider- or lab-dependent capabilities require configuration and acceptance testing.

## Finance and institutional operations

- Configurable service rates, approvals, invoice snapshots, payment records, adjustments and manual reconciliation foundations.
- Staff/HR recruitment, employment, leave, attendance, shifts, payroll, performance, and lifecycle records.
- Hostel inventory, accommodation applications, bed allocation, maintenance, visitors, inspections, charges, and student support cases.
- Procurement, stock/assets, ICT assets, library circulation, detailed accounting, and finance controls are included in the target specification; their delivery status remains as described by the implementation status register.
- Quality assurance and accreditation: source-backed framework and standards register, campus-scoped review cycles, evidence metadata, findings and corrective-action workflows. Generated-client typecheck, formal migrations, live route tests and programme-outcome mapping remain outstanding.

## Learning and documents

- E-learning across online/in-person/hybrid delivery, learning resources and activities, assignments, feedback, and configured virtual classrooms.
- Library cataloguing/circulation and document/records management, including metadata, uploads, permissions, review, versions, sharing, signatures where configured, preview, and authorized downloads.
- The full production file-security lifecycle still requires object-storage integration, malware scanning/quarantine, retention enforcement and tested recovery.
- The local canvas and WebXR lab are prototypes; collaborative server-side canvas and production AR/VR learning are not yet delivered.

## Student/community services

- Elections and secret-ballot source design, clubs, events, volunteering and alumni profiles.
- Parent/guardian invitations with student-controlled scopes.
- Career and internship listings, employer workflows and student applications.
- In-app notification and provider-backed email/SMS foundations; external credentials and live delivery tests are still required.

## Public website, analytics and integrations

- Institutional homepage/profile, published programmes and fees, CMS pages/news/events, public forms and approved media.
- Role-sensitive aggregate reporting and CSV output.
- Integration worker, scheduled reports, health/metrics endpoints, request correlation, backups and deployment templates.
- The premium reference-inspired public design is included; actual college photographs and final content must be supplied by the institution.

## Explicitly excluded

- Transport management.

Detailed functional coverage for the pasted non-transport catalogue is tracked in REQ-064–REQ-080 of the complete specification. These are target-state requirements, not a claim that the features are already implemented.

## Important status rule

A feature listed above is not automatically production-ready. Use `IMPLEMENTATION-STATUS.md` as the source of truth for what is present, partial/prototype, dependent on credentials/infrastructure, or not implemented. Do not use real student data until the clean build, migration, authorization tests, privacy review, backup/restore and deployment gates have passed.
