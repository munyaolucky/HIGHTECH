# Admissions & Student Onboarding

## Scope represented in the current source

- Public list of open intakes and a public application form. Only active programs/campuses and intakes marked `OPEN` with a non-expired application deadline are returned.
- Application reference, applicant contact/education details, submission consent timestamp and version, intake/program/branch linking, application status and internal review notes.
- Protected admissions dashboard API for summary metrics, paginated/filtered application lists, application details, status changes, capacity-aware admission decisions, and checklist requirements.
- Document requirement register with review statuses and internal notes. **This is a checklist/verification register, not file upload storage.** The Document Centre provides the shared document workflow, but this checklist does not itself upload binary files.
- Staff-issued admission offers with a seven-day default expiry, single-use hashed response token, and provider-backed email link. Accepting a valid offer creates the invited `STUDENT` account, admission number, student record, draft onboarding profile, and hashed activation token; declining creates no account.
- One-time account activation endpoint. Activation tokens are stored as hashes, expire after 48 hours, can only be consumed once, and set a new password before changing the invited account to active. Raw activation links are not returned by the admissions API.
- Student sign-in accepts the registered email or case-insensitive admission number. Email-based password reset uses a single-use token that expires after 30 minutes and revokes existing refresh sessions after a successful reset; invited users can request an activation resend. Account-link requests are privacy-preserving and protected by IP and per-account throttles.
- Student self-service onboarding profile and submission, optional guardian-portal preference (`NO`, `YES`, `DECIDE_LATER`), and admissions-team review with verification or a change request.
- Role/permission middleware, input validation, rate limiting on public application submission, audit writes for workflow changes, and unit tests for admission-state transition rules.

## Application status workflow

`SUBMITTED -> UNDER_REVIEW | INCOMPLETE | ELIGIBLE | ADMITTED | WAITLISTED | REJECTED | WITHDRAWN`

`INCOMPLETE -> SUBMITTED | UNDER_REVIEW | REJECTED | WITHDRAWN`

`ELIGIBLE -> ADMITTED | WAITLISTED | REJECTED | WITHDRAWN`

`WAITLISTED -> ADMITTED | REJECTED | WITHDRAWN`

`ADMITTED -> WITHDRAWN` through a status edit. An authorized staff member issues an expiring offer; acceptance atomically creates the student account/record and moves the application to `ENROLLED`. Declining moves the application to `WITHDRAWN` without creating an account. Withdrawing an application revokes any issued response token. Terminal `REJECTED`, `WITHDRAWN` and `ENROLLED` states do not allow ordinary status transitions.

Admission decisions enforce the intake's configured capacity against manually registered student records and current admitted/enrolled applications. For production-grade concurrency guarantees, a follow-up test should verify parallel admit/enroll operations under PostgreSQL serializable transactions or locking.

## API endpoints

Public:

- `GET /api/admissions/open-intakes`
- `POST /api/admissions/apply` — rate limited; consent is required
- `POST /api/admissions/offer-response` — rate limited; accepts or declines a valid, single-use offer
- `POST /api/auth/activate` — one-time invitation token and new password
- `POST /api/auth/password-reset/request` — privacy-preserving email request
- `POST /api/auth/password-reset/complete` — consumes a single-use reset token
- `POST /api/auth/activation/resend` — privacy-preserving activation resend request
- `POST /api/auth/login` — accepts email/admission number and password; legacy `{ email, password }` clients remain supported

Student account:

- `GET /api/admissions/onboarding/me`
- `PUT /api/admissions/onboarding/me`
- `POST /api/admissions/onboarding/me/submit`

Requires `admissions:manage` permission:

- `GET /api/admissions/overview`
- `GET /api/admissions/applications?search=&status=&intakeId=&page=1&pageSize=25`
- `GET /api/admissions/applications/:id`
- `PATCH /api/admissions/applications/:id/status`
- `POST /api/admissions/applications/:id/documents`
- `PATCH /api/admissions/documents/:id`
- `POST /api/admissions/applications/:id/offer`
- `GET /api/admissions/onboarding?status=&search=`
- `PATCH /api/admissions/onboarding/:studentId/review`

## Activation delivery limitation

Offer issuance requires a configured email provider and returns `503 OFFER_DELIVERY_NOT_CONFIGURED` otherwise. Offer links and activation links are sent directly through the provider; their raw tokens are not stored in the database or returned to the admissions UI. Password-reset and activation-resend requests use generic responses to limit account enumeration. Provider delivery, retry/bounce handling, live applicant testing, observability and an approved operations procedure remain production gates.

## Privacy and policy setup required

- Replace the draft admissions privacy notice/version (`ADMISSIONS_PRIVACY_NOTICE_VERSION`) with the final version approved by the college, and publish the notice linked from the application page.
- Review which personal fields are necessary; only collect DOB, nationality and statements where the admissions policy supports them.
- Configure minors/legal guardian rules and verification. The guardian preference does not create parent access and does not authorize sharing any student data by itself.
- Define retention periods, deletion/hold rules, admissions review rules and appeals with the college.
- Do not use this development flow with real applicants until a production security and privacy review, email activation delivery, observability and backups are completed.

## First-time database migration

For a new database, the latest schema can be used to generate the first migration:

```powershell
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name foundation
```

If the existing college schema has already been migrated, keep the existing `apps/api/prisma/migrations` history and create a new migration:

```powershell
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name admissions_onboarding
```

Commit the generated migration directory before deploying or sharing the project. The generation environment could not install packages during source generation, so migration generation and Prisma schema validation were not completed here.

## Verification checklist

After installing dependencies and configuring a disposable local PostgreSQL database:

1. Run `npm run db:generate` and `npm run db:migrate --workspace @hitech/api -- --name admissions_onboarding` (use `foundation` for a brand-new database).
2. Run `npm run typecheck`, `npm run build` and `npm test`.
3. Create a campus, program and `OPEN` intake from Academic Management.
4. Submit a public application, then sign into the staff portal and find its reference.
5. Verify valid and invalid status transitions; confirm `ENROLLED` cannot be set via the ordinary status route.
6. Add document checklist requirements and verify each status change appears in the detail view.
7. Admit and enroll a test applicant in development; activate once, verify the token cannot be reused, and confirm the new account has `STUDENT` role.
8. Sign in as the student, save and submit onboarding, test registrar verification/change request, and confirm students cannot query other students' profiles.
9. Verify `STUDENT` accounts receive 403 on admissions staff endpoints and public submission refuses closed, inactive or full intakes.
