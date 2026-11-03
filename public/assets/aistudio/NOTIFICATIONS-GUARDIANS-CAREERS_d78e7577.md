# Notifications, Optional Guardian Access & Career Services

## Capabilities in the current source

- Per-user in-app notifications with unread counts, single/all read actions, category preferences and internal relative links.
- Notification broadcast to active users by selected role or explicit user IDs, with per-user category/preferences applied.
- An email/SMS outbox and operations worker that process queued requests when a provider is configured; queued entries are not proof of delivery.
- Optional parent/guardian access controlled by explicit student consent, a one-time email invitation, selected scopes, consent expiry, permission changes and immediate revocation.
- Parent web and mobile views for approved student summaries, attendance, released results, fees/receipts, timetable, assignments, published examinations, announcements and current/reserved accommodation.
- Parent meeting requests and complaints tied to an active student relationship; administrators can review campus-scoped links/invitations, revoke access with a recorded reason, and view consent/account counts.
- Career employer onboarding and verification, job/internship opportunities, moderated publishing, student internal applications, external-application links, application status updates and review notes.
- Responsive **Notifications & Careers** portal area integrated with the current application shell.

## API routes

### Notifications (`/api/notifications`)

| Method and route | Access | Purpose |
|---|---|---|
| `GET /` | Authenticated user | Own notifications and unread count; optional `unreadOnly=true` and bounded `limit` |
| `PATCH /:id/read` | Authenticated user | Mark own notification read |
| `POST /read-all` | Authenticated user | Mark own unread notifications read |
| `GET /preferences` | Authenticated user | Get own category/channel preferences |
| `PUT /preferences` | Authenticated user | Update own explicit preferences |
| `POST /broadcast` | `notifications:manage` | Broadcast to active users by role or explicit user IDs; delivery channels follow preferences |
| `GET /outbox` | `notifications:manage` | Inspect queued/failed/sent email/SMS delivery records |

The API only creates queued Email/SMS outbox rows. A separately configured provider and retry worker are required to actually deliver messages, update delivery status, record provider IDs and handle bounces/complaints. Users have email/SMS disabled by default until they opt in; in-app notices are enabled by default. Security notifications remain in the in-app inbox.

### Guardian portal (`/api/guardians`)

| Method and route | Access | Purpose |
|---|---|---|
| `POST /accounts` | `guardians:manage` | Create a separate Parent account and development activation URL |
| `GET /student-links` | Student | View own pending invitations, links, scopes and consent choice |
| `POST /invitations` | Student | Invite an existing Parent account using chosen scopes; onboarding choice must be YES |
| `POST /invitations/accept` | Active Parent | Accept a one-time invitation using matching account email |
| `POST /invitations/complete` | Public one-time token | Create/activate a Parent account and accept an invitation |
| `PUT /student-consent` | Student | Enable, defer or withdraw guardian sharing |
| `PATCH /links/:id/scopes` | Owning Student | Change scopes on an active link |
| `DELETE /links/:id` | Owning Student | Revoke a link and clear granted scopes |
| `DELETE /invitations/:id` | Owning Student | Cancel a pending invitation |
| `GET /me/students` | Parent | Read only linked students and data for granted scopes |
| `GET /api/parent/me` | Parent | Read own parent account profile |
| `GET /api/parent/students` | Parent | Read linked student summaries filtered by active link, expiry and scopes |
| `GET /api/parent/students/:id/{overview,attendance,academics,fees}` | Parent | Read a linked student's authorized overview and scoped academic/financial data |
| `GET/POST /api/parent/meetings` | Parent | List meeting requests or request a meeting for an authorized student |
| `GET/POST /api/parent/complaints` | Parent | Track or submit a complaint associated with an authorized student |
| `GET /api/guardians/admin/{summary,links,invitations}` | `guardians:manage` | Review consent/account counts and relationships within the staff campus scope |
| `POST /api/guardians/admin/{links,invitations}/:id/revoke` | `guardians:manage` | Suspend a link or cancel an invitation with a required, audited reason |

Invitation token values are stored as hashes. Invitations expire after seven days, are accepted once, and must match the invited email. Account setup from the one-time invitation verifies possession of the email link; an already active Parent account must sign in to accept. New consent links expire after one year; older links with no expiry remain usable only until explicitly revoked. Every parent data route verifies the authenticated Parent, active unexpired relationship and required scope. Re-invitation after revocation reactivates the unique student/guardian link row with the new invitation and selected scopes.

The guardian relationship is optional. Parent access is not a condition of student activation or college services. Parent permissions do not include student passwords/security codes, private messages, safeguarding/counselling records, unrestricted documents or secret ballots. Rules for minors and legally authorized guardians must be reviewed against the college's documented policies and relevant law before production use.

### Careers (`/api/careers`)

| Method and route | Access | Purpose |
|---|---|---|
| `GET /opportunities/public` | Public | List currently open, non-expired, published opportunities |
| `GET /opportunities` | Student or authorized career manager | List open opportunities for students; broader permitted list for managers |
| `GET /employers` | `careers:manage` | List employers in allowed campus scope |
| `POST /employers` | `careers:manage` | Create employer record for verification |
| `PATCH /employers/:id/status` | `careers:manage` | Verify, reject or suspend employer |
| `POST /opportunities` | `careers:manage` | Create draft job/internship opportunity |
| `PATCH /opportunities/:id/status` | `careers:manage` | Submit for review, open, close, reject or archive according to the workflow |
| `GET /my-applications` | Student | View own applications and statuses |
| `POST /opportunities/:id/apply` | Eligible Student | Submit in-platform application with cover letter |
| `GET /applications` | `careers:manage` | List applications in current manager scope |
| `PATCH /applications/:id` | `careers:manage` | Update application status and private review notes |

External application opportunities direct students to the employer's external application page; the college does not record an internal cover-letter application for those listings. Internal job applications use a unique application constraint to prevent duplicate applications. Opportunity publication requires review and, when an employer is attached, a verified employer. Staff branch scoping is applied in selected employer/opportunity/application operations, but the platform does not yet have a consistent campus authorization policy across every module.

## Data model additions

- `Notification`, `NotificationPreference`, `NotificationDelivery`
- `GuardianInvitation`, `GuardianLink`
- `CareerEmployer`, `CareerOpportunity`, `CareerApplication`
- Enums for notification categories/channels/statuses, guardian scopes/statuses, employer/opportunity/application statuses and employment types.

The parent portal migration is `apps/api/prisma/migrations/20261102100000_parent_portal`; it adds guardian scopes/consent expiry and student associations for meeting requests and support tickets. Apply it with `npm run db:deploy` in a provisioned deployment after a verified backup and migration review. The invitation, relationship and access data use the existing `GuardianInvitation` and `GuardianLink` models.

## Run and verify locally

```powershell
npm install
npm run db:generate
# New empty database only: generate the foundation migration from the full schema.
# Existing database: create/apply the follow-up notifications_guardians_careers migration.
npm run typecheck
npm test
npm run build
```

The rule tests cover optional student consent, self-invitation prevention, role/email/expiry checks, notification preferences and security notices, opportunity publication eligibility, and internal versus external applications.

## Production blockers and limitations

- Email/SMS delivery still depends on correctly configured provider credentials and a running operations worker. Production guardian invitations are rejected when email delivery is unavailable; development may return a one-time link.
- Verify email delivery, token expiry/replay, and provider retry behavior with staging accounts before launch.
- Employer/contact claims and job listings require a documented verification process, abuse reporting and moderation.
- Guardian scopes are deliberately narrow; legal guardian rules for minors and access under institutional policy require review.
- Campus/branch authorization is enforced in guardian administrator review routes, but authorization across the overall platform still needs broader review.
- Notification broadcasts should be run in batches with operational limits and delivery monitoring at larger scale.
- The current source was validated with Prisma schema validation, generated client, workspace typechecking, API tests, web build and cross-platform checks. A clean PostgreSQL migration rehearsal, live email-provider tests, visual device QA and full database integration/security review are still required before production.
