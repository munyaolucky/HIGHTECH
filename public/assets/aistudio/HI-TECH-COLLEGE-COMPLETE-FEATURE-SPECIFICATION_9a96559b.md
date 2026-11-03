# HI-TECH College — Complete Integrated Digital College Management System

> **Document type:** Product feature specification and target-state blueprint. This document describes the intended product; it is not evidence that every feature is implemented, integrated, or production-ready. See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md) for current maturity and [VALIDATION-REPORT.md](./VALIDATION-REPORT.md) for verification evidence.

## Product goal

Provide one connected digital ecosystem for HI-TECH College: a public website, administration and academic workspaces, student and staff portals, finance and examination services, and mobile access. Authorized users work from shared institutional records, with access limited by role, campus, department, relationship, consent, and workflow state.

The platform is intended to support the student lifecycle from public enquiry and application through learning, assessment, completion, certification, and alumni engagement. It must also support the college's administrative, financial, staffing, quality-assurance, and operational work without treating planned capabilities as already delivered.

## Scope Baseline

- **Discovery method:** The user-provided integrated-system blueprint was consolidated with the repository's existing master feature specification, feature catalogue, implementation-status register, and domain documentation.
- **Total items discovered:** 26 product domains and shared platform capabilities.
- **Items in scope:** 26. The requested ecosystem includes public website, user portals, mobile access, governance, and shared services.
- **Explicit exclusion:** Transport management is outside this specification.
- **Target users:** Prospective applicants, students, parents/guardians, teaching and non-teaching staff, administrators, institutional leaders, alumni, employers, and public visitors.
- **Product boundary:** One institutionally governed platform with role-specific user experiences. Separate views do not imply separate or duplicated student records.

## Platform structure

| Surface | Primary users | Main purpose |
|---|---|---|
| Public college website | Public visitors, applicants, alumni, employers | Institutional information, programme discovery, enquiries, news, and admissions entry |
| Administration portal | Super administrators, administrators, principal, deputy principal, registrar, deans, HODs, specialist officers | College configuration, workflow oversight, records governance, approvals, and reporting |
| Academic portal | Deans, HODs, lecturers, trainers, examination officers, registrars | Curriculum, teaching, registration, attendance, assessment, examinations, and results |
| Student portal | Applicants and students | Application tracking, onboarding, studies, learning resources, fees, results, documents, and services |
| Staff portal | Lecturers, trainers, and non-teaching staff | Assigned teaching and operational work, staff self-service, communication, and approved records |
| Finance portal | Finance managers, accountants, cashiers, authorized approvers | Fees, billing, payments, receipts, reconciliation, accounting, and financial reporting |
| Examination and certification services | Examination officers, academic approvers, students, verifiers | Assessment operations, result controls, transcripts, credentials, and public verification |
| Mobile applications | Students, guardians, lecturers, staff | Supported mobile access to authorized services and notifications |
| Shared institutional services | All authorized clients and approved integrations | Identity, permissions, governed records, notifications, audit history, and external connections |

## Roles and access responsibilities

Roles describe typical responsibilities, not automatic access to all information. Permissions must be assigned explicitly and may be restricted by campus, department, relationship, ownership, consent, sensitivity, and workflow state.

| Role | Typical responsibilities |
|---|---|
| Super Administrator | Platform-wide configuration, security administration, role governance, integrations, and operational oversight |
| Institution Administrator | Institution-wide administrative operations within delegated permissions |
| Principal | Institutional leadership, oversight, and designated approvals |
| Deputy Principal | Delegated academic or administrative supervision |
| Registrar | Admissions, student registration, academic records, and authorized student lifecycle decisions |
| Academic Dean | Academic programme oversight, academic quality, and delegated academic approvals |
| Head of Department (HOD) | Department programmes, teaching assignments, departmental review, and delegated academic approvals |
| Examination Officer | Examination schedules, assessment administration, marks processing, moderation coordination, and controlled result workflows |
| Finance Manager | Finance operations, rate approvals, billing oversight, reconciliation, and financial reports |
| Accountant | Authorized accounting transactions, reconciliations, journals, and reports |
| Cashier | Authorized receipt of student payments and payment records; no unrestricted accounting access |
| HR Manager | Staff records, contracts, leave, attendance, and authorized personnel workflows |
| Lecturer | Assigned courses, learning resources, attendance, assessments, marking, and student feedback |
| Trainer | Assigned technical and practical instruction, competency evidence, and assessments |
| Librarian | Library catalogue, lending/resource operations, and approved library content |
| ICT Administrator | Authorized system, device, account, and technical operations |
| Student | Own profile, enrolment, courses, learning, assessments, released results, fees, documents, and services |
| Parent/Guardian | Only student-authorized and verified information within the active consent scope |
| Alumni | Approved graduate profile and alumni services |
| Guest | Publicly available website information and public forms |
| Employer | Verified employer services and its own job or internship records and applicants, where enabled |
| Quality Assurance Officer | Standards, evidence, reviews, findings, and corrective-action workflows within assigned scope |
| Specialist officers | Assigned operational duties such as admissions, hostels, student services, or procurement, limited to granted permissions |

## User Scenarios & Testing

### User Story 1 — Discover the college and apply (Priority: P1)

As a prospective student, I want to learn about HI-TECH College, compare current programmes, and submit an application so that I can take an informed first step toward enrolment.

**Why this priority:** Public discovery and admissions form the entry point to the student lifecycle.

**Independent Test:** Use public pages and a configured open intake to submit an application, receive a reference, and confirm the application is available to authorized admissions staff.

**Acceptance Scenarios:**

1. **Given** a published programme and open intake, **When** a visitor searches the programme catalogue and selects that programme, **Then** the visitor sees the published programme details and can start the associated application.
2. **Given** an open intake and a valid applicant who accepts the privacy notice, **When** the applicant submits required information, **Then** the system records the application and displays a reference without implying admission has been granted.
3. **Given** no open intake, **When** a visitor opens the application flow, **Then** the system explains that applications are closed and does not accept an invalid application.

### User Story 2 — Review an application and onboard a student (Priority: P1)

As an authorized registrar, I want to review applications, request missing information, record decisions, and enroll admitted applicants so that student records are created through a controlled process.

**Why this priority:** Reliable admissions is necessary to create accurate student records and grant access safely.

**Independent Test:** Submit a test application, review it through valid workflow states, issue an offer, accept or decline it through its single-use link, and verify that only an accepted offer creates the student account.

**Acceptance Scenarios:**

1. **Given** a submitted application, **When** a registrar records a missing-document request, **Then** the application status and review history reflect the request.
2. **Given** an admitted applicant and an available intake place, **When** an authorized registrar issues an offer and the applicant accepts it before expiry, **Then** the system creates the student record and a secure account-activation flow.
3. **Given** an invalid or unauthorized status transition, **When** a user attempts it, **Then** the system rejects the change and preserves the previous record.
4. **Given** an admitted applicant with an issued offer, **When** the applicant declines or the offer expires, **Then** no student account is created and the response link cannot be reused.

### User Story 3 — Manage academic delivery and examination (Priority: P1)

As an academic leader or lecturer, I want to manage assigned programmes, class delivery, attendance, assessment, and controlled results so that student achievement is recorded consistently.

**Why this priority:** Teaching, assessment, and authorized academic records are core college operations.

**Independent Test:** Configure a programme offering, register a test student, record attendance and marks, complete required review, and release results to that student.

**Acceptance Scenarios:**

1. **Given** a published course offering, **When** a student registers within the permitted period, **Then** the registration is linked to the student, course, and academic period.
2. **Given** an assessment awaiting moderation, **When** an authorized reviewer approves it, **Then** the result remains hidden from the student until an authorized release.
3. **Given** a released result, **When** the student opens their academic portal, **Then** they see only their own approved result and its relevant course and period.

### User Story 4 — View and complete student services (Priority: P1)

As a student, I want one secure place to view my timetable, learning work, released results, fees, documents, and service requests so that I can manage my college journey.

**Why this priority:** A student-facing portal reduces fragmented processes and gives students access to their own current records.

**Independent Test:** Sign in as a test student and verify that each displayed record belongs to that student and that unsupported actions are clearly unavailable.

**Acceptance Scenarios:**

1. **Given** a student with published timetable entries and learning tasks, **When** they open their portal, **Then** the portal presents the assigned information for the correct academic period.
2. **Given** an unreleased result or another student's record, **When** a student attempts to view it, **Then** the system does not disclose it.
3. **Given** an available support or appointment service, **When** the student submits a request, **Then** the student receives a reference and can view the request's allowed status.

### User Story 5 — Manage staff and college administration (Priority: P1)

As an administrator or department leader, I want to oversee assigned institutional workflows and approvals so that college operations remain accountable and appropriately scoped.

**Why this priority:** Administrative control and authorization are required across all portals and records.

**Independent Test:** Use accounts with different roles and scopes to verify allowed actions, denied actions, approval separation, and audit history.

**Acceptance Scenarios:**

1. **Given** an administrator with campus-scoped permissions, **When** they view records, **Then** records outside their assigned scope are not returned.
2. **Given** a workflow requiring independent approval, **When** its initiator attempts to approve their own submission, **Then** the system rejects the approval.
3. **Given** an authorized change to an institutional record, **When** it is saved, **Then** the record history identifies the actor, action, and time.

### User Story 6 — Process fees and payments (Priority: P1)

As a finance officer, I want to publish approved fee rates, issue accurate invoices, record payments, and reconcile them so that students and the college can rely on correct financial records.

**Why this priority:** Fees and payment handling have direct financial impact and require clear accountability.

**Independent Test:** Configure an approved rate, create an invoice for a test student, record or simulate a payment, reconcile it, and verify the resulting statement and receipt.

**Acceptance Scenarios:**

1. **Given** an effective approved rate, **When** an authorized finance user creates an invoice, **Then** the invoice preserves the rate, currency, billing period, and line amounts used at issue time.
2. **Given** an unverified, duplicate, or mismatched provider callback, **When** it is received, **Then** the transaction is not silently treated as a settled payment.
3. **Given** payment records in different currencies, **When** a report is generated, **Then** the report keeps the currency totals distinct or uses an explicitly approved conversion.

### User Story 7 — Use mobile access and receive notices (Priority: P2)

As a student, guardian, lecturer, or staff member, I want to use supported mobile experiences and receive privacy-safe notifications so that I can access timely college information away from a desktop.

**Why this priority:** Mobile access improves reach but depends on stable identity, permissions, and notification delivery.

**Independent Test:** Complete supported portal journeys on mobile web and a configured mobile client; verify that notification content and destinations respect recipient permissions.

**Acceptance Scenarios:**

1. **Given** a user on a supported mobile device, **When** they navigate an available portal workflow, **Then** controls remain usable without horizontal page overflow.
2. **Given** a notification containing sensitive information, **When** it is sent to a lock screen, **Then** it uses a privacy-safe preview and does not expose protected grades, balances, or welfare details.
3. **Given** a user who has withdrawn optional notification consent, **When** an optional channel delivery is scheduled, **Then** the delivery is suppressed.

### User Story 8 — Govern institutional quality, records, and services (Priority: P2)

As an institutional leader or quality officer, I want to review evidence, reports, policy actions, and operational status so that the college can demonstrate oversight and identify corrective work.

**Why this priority:** Governance and assurance depend on reliable evidence, scoped reports, and traceable actions.

**Independent Test:** Create an evidence review, assign a corrective action, export a scoped report, and verify the audit trail and permissions.

**Acceptance Scenarios:**

1. **Given** a quality review with evidence and findings, **When** an authorized reviewer completes review, **Then** findings, owners, deadlines, and approval history remain available to authorized users.
2. **Given** a report request for a restricted campus or department, **When** a user without that scope requests it, **Then** the system denies or excludes unauthorized records.
3. **Given** a scheduled operational backup, **When** a restore drill is performed, **Then** the responsible operator can verify the restored data and record the drill outcome.

### Edge Cases

- An intake closes, reaches capacity, or becomes inactive while an applicant is completing a form.
- A user has more than one role, changes departments, or loses permission while a session is active.
- A student is a minor, changes guardian, revokes consent, or has a guardian relationship disputed.
- Two authorized users update the same application, payment, grade, room allocation, or inventory item concurrently.
- A callback, notification, or integration message arrives more than once, out of order, with invalid signatures, or after a timeout.
- A result, invoice, or credential is corrected, replaced, reversed, revoked, or put under legal hold after it was issued.
- A file is oversized, malformed, infected, unsupported, or quarantined; a user requests access after their permission is revoked.
- A report has no matching records, includes multiple currencies, or contains fields the requesting role cannot access.
- A user loses connectivity during a submission or a mobile device has an outdated application version.
- The email/SMS/push provider, payment provider, storage service, or database is unavailable.
- A timetable has no conflict-free allocation, or a booking overlaps with another room or equipment reservation.
- An election reaches a tie, dispute, cancellation, or recount request without an approved policy for resolution.

## Requirements

Requirements below describe the target product. Their presence does not indicate that they are implemented. Each item must be verified against implementation status and release gates before being represented as available.

### Functional Requirements

#### Shared platform, accounts, and governance

- **REQ-001**: The platform MUST provide role-appropriate public website, administration, academic, student, staff, finance, examination/certification, and mobile experiences over governed institutional records.
- **REQ-002**: The platform MUST maintain one authoritative identity and record for each person and institutional entity, and MUST link related activity rather than creating duplicate records for each client.
- **REQ-003**: The platform MUST support the named institutional roles and allow authorized administrators to assign one or more roles and permissions to an account.
- **REQ-004**: The platform MUST restrict each action and returned record by granted permission, campus, department, ownership, enrolment, guardian consent, workflow state, and data sensitivity where applicable.
- **REQ-005**: The platform MUST support account invitation, activation, suspension, deactivation, email-based password recovery, forced password change, session management, sign-out, and authorized session revocation; students MUST be able to sign in using their registered email or unique admission number.
- **REQ-006**: The platform MUST support multi-factor authentication for privileged roles and MUST record login attempts, security events, active-device/session details, and administrative account changes.
- **REQ-007**: The platform MUST allow workflows to require designated approvals and MUST prevent self-approval where separation of duties is required.
- **REQ-008**: The platform MUST record an attributable, time-stamped history for sensitive administrative, academic, financial, document, security, and approval actions.
- **REQ-009**: The platform MUST support temporary and delegated access with explicit permissions, scope, expiry, and revocation.

#### Public website and content management

- **REQ-010**: The public website MUST provide a responsive homepage, college profile, history, vision, mission, values, governance, leadership, campus locations, departments, facilities, and approved staff directory.
- **REQ-011**: The public website MUST provide searchable published programmes, courses, qualifications, short courses, professional certifications, technical/vocational offerings, entry requirements, study modes, durations, and current published fees.
- **REQ-012**: The public website MUST provide admissions information, application access, application tracking entry, FAQs, contact information, downloads, library/e-learning information, and career information approved for public release.
- **REQ-013**: The public website MUST provide approved news, announcements, events, calendars, galleries, student/alumni stories with consent, testimonials with approval, and campus information.
- **REQ-014**: Authorized content managers MUST be able to draft, review, approve, preview, publish, schedule, expire, revise, archive, and restore eligible content while preserving version history and review attribution.
- **REQ-015**: The website MUST provide public enquiry, complaints/feedback, newsletter, and configurable CMS form journeys only when their form, consent text, and publication state are approved.
- **REQ-016**: Public catalogue details MUST derive from approved academic and financial records; editorial pages MUST NOT silently override authoritative programme, fee, or admissions records.
- **REQ-017**: The website MUST provide student, staff, parent/guardian portal entry points, social sharing, privacy notice, terms, cookie preferences, and accessible navigation.

#### Admissions and student lifecycle

- **REQ-018**: An eligible visitor MUST be able to submit an application to an active programme and open intake, provide required applicant information, acknowledge the current privacy notice, and receive a non-admission reference.
- **REQ-019**: Authorized admissions staff MUST be able to search, filter, review, and update applications using configured status transitions, checklists, notes, missing-information requests, decisions, offers, waitlists, and appeals.
- **REQ-020**: The system MUST prevent admissions decisions from exceeding configured intake capacity and MUST preserve decision and communication history.
- **REQ-021**: The system MUST create the student record, assign an institutionally valid admission identifier, and initiate account activation only after the applicant accepts a valid, unexpired admission offer; an offer response link MUST be single-use.
- **REQ-022**: The student lifecycle MUST support configured states and controlled transitions for onboarding, active study, transfer, deferral, suspension, withdrawal, completion, graduation, and alumni status.
- **REQ-023**: Students MUST be able to view and update permitted profile details, complete onboarding, submit corrections for review, manage their own document requests, and track their own admission or service requests.

#### Administration, institutional structure, academics, and examinations

- **REQ-024**: Authorized administrators MUST be able to manage campuses, departments, programmes, qualifications, curriculum versions, units, cohorts, academic years, terms, semesters, intakes, and effective-dated institutional settings.
- **REQ-025**: Authorized academic staff MUST be able to define course offerings, capacity, prerequisites, credits, outcomes, practical requirements, assigned teaching staff, registration windows, and add/drop rules.
- **REQ-026**: The platform MUST support unit registration, authorized corrections, waitlisting where enabled, and student/department views of each registration state.
- **REQ-027**: Authorized staff MUST be able to create and publish timetables, examination windows, recurring sessions, room/lab bookings, deadlines, and academic calendars with conflict detection.
- **REQ-028**: Lecturers and trainers MUST be able to record attendance for assigned classes, submit corrections with reasons, review attendance summaries, and process permitted absence explanations.
- **REQ-029**: Authorized academic staff MUST be able to create assignments, CATs, examinations, practical assessments, rubrics, question banks, timed attempts, marking workflows, feedback, and resubmission rules according to approved policy.
- **REQ-030**: The system MUST calculate results using configured grading and weighting rules, support moderation and approval, record appeals/supplementary outcomes, and prevent results from being visible before authorized release.
- **REQ-031**: The system MUST support academic progression checks, advising plans, competency/outcome mapping, practical evidence, recognition of prior learning where approved, and graduation eligibility review.
- **REQ-032**: The system MUST issue transcripts, certificates, and other official academic credentials only from approved records, preserve issue/replacement/revocation history, and provide an authorized verification method.

#### Student, staff, and learning services

- **REQ-033**: The student portal MUST present the signed-in student's timetable, registered units, learning tasks, attendance, released results, academic history, documents, current statements, and eligible student services without exposing another student's records.
- **REQ-034**: The staff portal MUST present assigned teaching, assessment, timetable, attendance, communication, and permitted staff self-service workflows according to the user's role and assignments.
- **REQ-035**: Authorized users MUST be able to publish approved learning materials and library catalogue items with access rules, formats, metadata, licensing, versions, and associated courses or units.
- **REQ-036**: Students MUST be able to access authorized learning materials, submit assignments, resubmit where allowed, review feedback, and see their permitted learning progress and reading activity.
- **REQ-037**: Library workflows MUST support searchable cataloguing and, when enabled by policy, lending, reservations, circulation, renewals, returns, fines, licensing, and usage reporting.
- **REQ-038**: The Document Centre MUST support authorized upload, metadata, review, versioning, preview, download, expiry, replacement, sharing, and access history for institutional files.
- **REQ-039**: Document handling MUST enforce file type and size policies, private storage, malware scanning/quarantine, permission checks, retention, legal holds, and controlled deletion before the service is approved for real sensitive records.

#### Finance, HR, procurement, facilities, and welfare

- **REQ-040**: Authorized finance staff MUST be able to configure versioned fee/service rates with currency, billing unit, campus/programme scope, effective dates, taxes, and approval history.
- **REQ-041**: The finance portal MUST support invoices with immutable issued-line snapshots, student statements, payment allocation, discounts, sponsorships, bursaries, waivers, adjustments, credit notes, refunds, and official receipts under configured approvals.
- **REQ-042**: Payment integrations MUST verify provider callbacks, prevent duplicate settlement, flag amount/reference mismatches, support reconciliation and exception handling, and clearly distinguish simulated from live transactions.
- **REQ-043**: Authorized finance staff MUST be able to manage budgets, cost centres, chart of accounts, balanced journals, payables, receivables, bank reconciliation, period close, and approved accounting exports as those capabilities are delivered.
- **REQ-044**: Financial reports MUST distinguish billed, collected, settled, outstanding, adjusted, and refunded amounts and MUST not aggregate different currencies without an approved conversion.
- **REQ-045**: Authorized HR staff MUST be able to manage staff profiles, positions, reporting lines, employment history, contracts, leave, attendance, workload, qualifications, recruitment/onboarding, performance, training, payroll, and payslips within the approved delivery scope.
- **REQ-046**: The platform MUST restrict compensation, payroll, personnel files, and confidential staff decisions to explicitly authorized users and record access to sensitive HR records.
- **REQ-047**: Authorized procurement and asset users MUST be able to manage supplier records, requisitions, budget checks, approvals, quotations, purchase orders, receiving, invoice matching, inventory, asset assignment, maintenance, transfers, and disposal.
- **REQ-048**: Authorized residence/facility staff MUST be able to manage hostels, rooms, beds, eligibility, applications, allocations, occupancy, check-in/out, transfers, visitors, maintenance, facility bookings, inspections, and accommodation charges.
- **REQ-049**: Students MUST be able to submit and track approved welfare, accessibility, counselling-coordination, financial-aid, or service requests; sensitive case details MUST use separately restricted permissions and records.

#### Community, guardians, careers, quality, and reporting

- **REQ-050**: Guardian access MUST require identity/relationship checks appropriate to policy, student-approved scopes, recorded access, and immediate revocation; it MUST NOT imply access to private student communications, counselling records, ballots, or unreleased results.
- **REQ-051**: Authorized staff MUST be able to manage clubs, memberships, events, volunteering, service hours, alumni profiles, mentoring, and community outreach with appropriate publication consent.
- **REQ-052**: The careers service MUST support verified employers, moderated jobs/internships, eligibility, deadlines, student portfolios, applications, supporting files, shortlisting, interviews, offers, placement follow-up, and outcome reports where enabled.
- **REQ-053**: Election workflows MUST support configuration, nominations, eligibility checks, candidate review, secret ballots, duplicate-vote prevention, result controls, disputes, and audit while preserving ballot secrecy; official election use requires independent security approval.
- **REQ-054**: Quality and accreditation workflows MUST support standards, programme mapping, evidence ownership, review schedules, self-assessments, inspections, findings, corrective actions, and effectiveness review.
- **REQ-055**: Authorized users MUST be able to access role-specific reports and dashboards filtered by permitted campus, department, programme, cohort, and academic period, with logged exports and visible data-freshness context.
- **REQ-056**: The platform MUST support scheduled reports and approved CSV/XLSX/PDF exports only where the export format and permissions are available; exports MUST enforce the same data scope as interactive views.

#### Communications, integrations, AI, mobile, and operations

- **REQ-057**: The platform MUST support an in-app inbox, unread state, notification preferences, role/campus-targeted notices, privacy-safe previews, consent/opt-out handling, and delivery history.
- **REQ-058**: Email, SMS, push, payment, identity, calendar, storage, signature, and accounting integrations MUST use authorized configuration, credential rotation, signed webhooks where appropriate, replay protection, idempotency, bounded retries, and observable failures.
- **REQ-059**: AI assistance MUST respect user permissions, identify supporting sources, protect sensitive information, apply prompt-injection safeguards, and require human approval before any consequential academic, admissions, finance, disciplinary, welfare, or credential action.
- **REQ-060**: The platform MUST provide responsive web and supported mobile-client access, and MUST identify PWA, smartwatch, canvas, and immersive-learning prototypes distinctly from separately released native applications or production simulators.
- **REQ-061**: The platform MUST provide searchable FAQs, support tickets with reference numbers, requester-only views, staff queues, internal notes hidden from requesters, assignments, status history, and audited administrative actions.
- **REQ-062**: The platform MUST provide separate development, test, staging, and production configuration; health/readiness visibility; structured operational logs; backup and restore procedures; incident response; and release verification.
- **REQ-063**: The platform MUST support data classification, retention schedules, consent records, authorized data correction/export, legal holds, secure deletion, and privacy review for personal and sensitive information.

#### Detailed requirements from the college feature catalogue

The following requirements make the detailed catalogue explicit and testable. They extend the requirements above; transport management remains out of scope.

- **REQ-064**: Authorized website managers MUST be able to compose pages from managed sections; edit shared headers, footers, and menus; manage image/video assets; and configure page titles, meta descriptions, keywords, multilingual content, site search, accessibility settings, website analytics, and newsletter subscriptions. Content changes MUST follow the approval and publishing controls in REQ-014, and CMS backup/restore MUST preserve supported content, assets, and publication state.
- **REQ-065**: Admissions MUST support applicant accounts and reference numbers; collection of personal details and academic history; programme, campus, and intake selection; configurable supporting-document requirements including academic certificates, identity documents, and photographs; application-fee rules; interviews and qualification verification; approval, rejection, conditional offers, waitlisting, offer letters, acceptance and cancellation; applicant communications; tracking; and recruitment/conversion reports. Each transition and decision MUST be authorized and auditable.
- **REQ-066**: The student information service MUST support institutionally unique student identifiers; emergency contacts; appropriately restricted guardian, medical, and welfare data; student ID cards; configurable student clearance and disciplinary workflows; searchable/filterable records; and authorized bulk import/export with validation, access controls, and an auditable result. It MUST retain academic history and controlled transfer/status history.
- **REQ-067**: Academic operations MUST support schools/faculties, study modes, course levels/categories, examining bodies and configurable external examining-body workflows (including KNEC, KASNEB, TVET, or NITA where applicable), accreditation records, core/elective units, unit codes/descriptions/credits/prerequisites, lecturer and class allocation, and unit withdrawal/completion tracking. Academic calendars MUST include registration deadlines, CAT/examination periods, holidays, graduation dates, academic events, and configurable reminders. Teaching staff MUST be able to manage course outlines, lesson plans, schemes of work, teaching notes, learning objectives, practical sessions, and group projects for assigned offerings.
- **REQ-068**: The learning service MUST support online, in-person, and hybrid delivery; live and recorded sessions; announcements; course/topic/lesson organization; PDFs, office documents, slides, audio, video, and approved external links; student progress and lesson completion; learning pathways, bookmarks, notes/highlights, forums, group activities, reminders, and completion certificates where configured. Lecturer tools MUST support course-material publication, quizzes, assignment creation/marking, feedback, progress monitoring, and reports. Virtual-classroom capabilities such as live audio/video, screen and presentation sharing, whiteboards, chat, attendance, recordings, breakout rooms, and Q&A MUST be enabled only through a configured, approved service.
- **REQ-069**: The assessment service MUST support CATs, assignments, end-of-semester, practical, oral, programming, networking, computer-application/ICDL-style, research-project, group, and competency-based assessments. Supported question/task types MUST include objective, short/long text, essay, numeric/calculation, matching, ordering, fill-in/cloze, image/audio/video, language, file/practical, programming/networking/configuration, drag-and-drop/hotspot/labeling, and case/scenario formats where appropriate. It MUST support question banks, randomized questions/options, timed and section-based attempts, multi-stage, adaptive and branching assessments, and institution-approved AI-assisted authoring/marking subject to qualified human review. Exam operations MUST support student booking where applicable, eligibility checks, room and invigilator allocation, rescheduling, attendance, and clash detection. Security controls may include access restrictions, auto-submission, supported browser controls, access/device/IP logs, identity checks, invigilation, plagiarism review, and incident reporting; each control MUST be disclosed and configured under approved policy. Computer practicals may cover office applications (including Word, Excel, PowerPoint, and Access), computer maintenance, networking/Packet Tracer, programming, databases, graphic design, CAD/CAM, file management, and internet/email tasks. Desktop-application practicals MUST use a separately secured practical client or controlled lab integration; a browser alone MUST NOT be represented as controlling arbitrary installed applications.
- **REQ-070**: Academic policy MUST be configurable for percentage, letter, pass/fail, and competency grading; grade boundaries; weighted averages and unit aggregation; GPA; progression and award classification; supplementary/retake/repeat rules; academic warnings/probation; and academic-board approval. All calculated outcomes MUST retain the applied policy/version and any authorized correction history.
- **REQ-071**: Student finance MUST support configurable programme, unit, semester/term, registration, examination, application, library, laboratory, accommodation, and custom charges; payment plans/installments; arrears and fee-clearance tracking; and approved scholarships, discounts, and sponsorships. Payment channels MUST be configurable for institution-approved M-Pesa Daraja/STK Push/Paybill, bank, cash, and supported card providers, with verification, receipts, reconciliation, allocation, failure handling, refunds/reversals, and duplicate detection. Accounting and reporting MUST include cashbook/petty cash, income and expenditure, trial balance, balance sheet, profit and loss, collection periods, revenue by programme, expenditure by department, payment methods, cashier activity, balances, refunds, and financial statements, subject to delivered capabilities and authorization.
- **REQ-072**: HR MUST support recruitment and job advertisements, applicant screening/interviews, onboarding, employee numbers, contracts and staff documents, positions and qualifications, leave, shifts, attendance, payroll components and payslips, performance and training, disciplinary workflows, promotion/transfer, resignation/retirement, clearance, and former-staff records. Confidential HR and compensation data MUST remain scope-restricted as required by REQ-046.
- **REQ-073**: Library workflows MUST support ISBN, author/publisher/category, copy, barcode/QR, and digital-resource records; search; reservations, borrowing, returns, renewals, overdue, fines, lost/damaged items; borrower history; e-books, journals, research papers and past examination papers; online reading; and library attendance where enabled. Any access restrictions based on student status, balances, or discipline MUST follow approved policy, preserve exceptions, and not block materials designated as freely accessible.
- **REQ-074**: Student support MUST provide configured counselling and academic/career guidance coordination, mentorship, disability accommodations, complaints/suggestions, welfare and financial-assistance/scholarship applications, emergency support, medical referrals, lost-and-found, clubs/sports/recreation, student leadership/elections, community engagement, disciplinary cases, appeals, and case tracking. Sensitive case details MUST use separately restricted access and approved handling policies.
- **REQ-075**: Accommodation MUST support hostel/building/room/bed inventories, applications and availability, eligibility and allocations, fees/payment status, check-in/out, room transfers, maintenance and complaints, visitor registration, attendance where approved, inspections, damage reports, and accommodation clearance, with history and role-based access.
- **REQ-076**: Procurement and inventory MUST support supplier registration/approval, requisitions and approvals, purchase orders, goods-received records, supplier invoices/payment tracking, categories and stores, stock adjustments/audits/reorder levels, consumables and equipment, asset assignment/transfer/maintenance/disposal, and laboratory, computer, and furniture inventories.
- **REQ-077**: ICT asset operations MUST support computer, laptop, printer, network-device, server, and software-licence inventories; allocation and assignment; repair requests; ICT helpdesk tickets and incidents; maintenance schedules; authorized network/service and internet-usage monitoring under approved privacy policy; account administration; backup tracking; cybersecurity incident reporting; antivirus and update tracking; depreciation; and IT audit reports.
- **REQ-078**: The communication centre MUST support internal messages and targeted student, lecturer, and department announcements; configurable email, SMS, push, and institution-approved WhatsApp/Telegram integrations; consent- and scope-controlled guardian notices; fee, examination, assignment, attendance, admission, result, and emergency notices; bulk sends, templates, and delivery tracking. Sensitive content MUST follow REQ-004 and REQ-057.
- **REQ-079**: Records management MUST support student, staff, admissions, academic, financial, contract, policy, meeting-minute, and correspondence records; document approval and version history; controlled sharing/downloads; digital signatures when an approved provider is configured; expiry reminders; retention schedules; and access audit, in addition to the protections in REQ-038, REQ-039, and REQ-063.
- **REQ-080**: Graduation operations MUST support completion and fee/library/department/examination clearance, graduation applications and lists, ceremony administration, approved certificate templates and numbering, certificate/transcript generation, QR or other authorized verification, reprints/replacements, reasoned revocation, an issuance register, graduate records, and alumni registration. Each issued credential MUST be traceable to approved academic records and retain its issue/replacement/revocation history.

### Key Entities

- **Person and Account:** A natural person and their sign-in identity, lifecycle state, security methods, sessions, and device history.
- **Role and Permission Grant:** A named institutional responsibility and its action, data, campus, department, relationship, and expiry scopes.
- **Campus and Department:** The institutional hierarchy used to organize people, programmes, services, records, and reporting.
- **Programme, Curriculum, and Unit:** An approved academic offering, its effective-dated curriculum, and teachable/assessable units.
- **Academic Period and Intake:** A scheduled study period and its admissions/registration capacity, dates, and status.
- **Application and Student Record:** An applicant's submission and review history, and the governed student identity created upon authorized enrolment.
- **Course Offering and Registration:** A scheduled delivery of a unit and a student's authorized participation in it.
- **Assessment and Result:** An assessment definition, submission/marking history, moderation and approval state, and released outcome.
- **Invoice, Payment, and Journal:** Financial obligations, receipts/settlements, reconciliation state, and approved accounting records.
- **Document and Evidence Item:** A protected file or record with metadata, classification, versions, approvals, retention, and access history.
- **Staff Record and Contract:** Employment relationship, assignment, contract period, and confidential HR data.
- **Service Request and Notification:** A tracked user request or routed notice with requester, scope, status, consent, and delivery history.
- **Quality Review and Corrective Action:** A standards-based review, evidence, finding, assigned owner, deadline, and verified outcome.
- **Integration Event:** A signed or otherwise authenticated message with provider, idempotency reference, processing result, and retry history.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At least 90% of first-time test applicants complete a valid online application without staff assistance, and the median completion time is under 10 minutes.
- **SC-002**: At least 95% of authorized staff users can locate a test application or student record within 2 minutes using the permitted search and filters.
- **SC-003**: 100% of tested role/scope combinations deny access to records and actions outside the granted permissions.
- **SC-004**: 100% of tested released-grade journeys show only approved results to the correct student; unreleased results remain inaccessible.
- **SC-005**: At least 99% of valid, non-duplicate payment test events are matched to the correct student, invoice, amount, and currency; invalid or mismatched events are held for review.
- **SC-006**: At least 90% of test users complete core student tasks—view timetable, find a learning resource, view a released result, and locate a fee statement—within 3 minutes per task.
- **SC-007**: All required reports and exports in the acceptance suite match their approved source totals and enforce the requester's campus/department scope.
- **SC-008**: All high-risk actions in acceptance tests have attributable history, and no tested sensitive action is missing actor, action, target, or timestamp.
- **SC-009**: A representative production backup can be restored within the institution-approved recovery time and data-loss objectives, with a recorded successful restore drill before go-live.
- **SC-010**: At least 90% of representative users rate the core portal journeys usable on supported desktop and mobile layouts, with no critical accessibility blockers in the agreed test set.
- **SC-011**: At least 95% of valid support requests receive a reference number and appear in the authorized service queue within 1 minute under normal operating conditions.
- **SC-012**: No launch communication or user interface labels a feature live until its agreed implementation, security, integration, and acceptance gates have passed.

## Assumptions and Constraints

- This specification describes a target integrated product. Existing repositories and module screens may implement only a subset; status must be checked separately.
- Institution leaders define the final role/permission matrix, approval thresholds, academic calendars, fee policy, retention schedules, safeguarding rules, and data-sharing policy before production use.
- Kenyan institution context is assumed for privacy, contact formats, time-zone defaults, and payment-provider examples; legal and regulatory policies require review by the college's authorized advisers.
- Email, SMS, push, payment providers, identity systems, object storage, and other external services require institution-owned accounts, credentials, agreements, and successful environment-specific testing.
- The college supplies verified institutional text, approved photography, contact details, public policies, and publication consent. Illustrative or sample material is not official content.
- Transport management is not included.
- High-stakes decisions remain under authorized human review. AI-generated material is advisory and does not update official records without an approved human action.

## Implementation maturity boundary

The current source maturity is summarized in [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md). Some foundations and screens are present, several workflows are partial or prototype-only, provider-dependent features require credentials, and some capabilities remain planned. Production readiness requires all applicable build, migration, authorization, privacy, integration, operational, and end-to-end gates in that register; source presence alone is insufficient.

## Related documentation

- [Unified Feature Catalogue](./FEATURE-CATALOGUE.md)
- [Master Feature Specification](./MASTER-FEATURE-SPECIFICATION.md)
- [Implementation Status Register](./IMPLEMENTATION-STATUS.md)
- [Implementation Backlog](./IMPLEMENTATION-BACKLOG.md)
- [Admissions and Onboarding](./ADMISSIONS-ONBOARDING.md)
- [Public Website and CMS](./PUBLIC-WEBSITE-CMS.md)
- [Cross-Platform Architecture](./CROSS-PLATFORM-ARCHITECTURE.md)
