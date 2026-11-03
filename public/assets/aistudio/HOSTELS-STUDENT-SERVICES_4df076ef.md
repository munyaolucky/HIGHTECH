# Hostels & Student Services

This module adds residence inventory, student accommodation applications and allocations, check-in/check-out, maintenance, visitor records, accommodation charges, residence announcements and private student support requests. It is a development foundation and must pass database/runtime/security verification before live use.

## Roles and boundaries

- `SUPER_ADMIN` and `ADMIN`: global configuration in the current starter permissions.
- `PRINCIPAL` and `REGISTRAR`: residence and student-support management under the current coarse role policy.
- `HOSTEL_OFFICER`: residence operations, records, maintenance, visitor and allocation workflows.
- `STUDENT_SERVICES_OFFICER`: support cases and welfare workflows; restricted requests are limited to the requester and currently assigned handler.
- `FINANCE_OFFICER`: accommodation charges and finance approval/invoicing endpoints; cannot create a charge through the hostel route unless the role has `hostel:manage`.
- `STUDENT`: public residence catalogue, own applications/allocations/maintenance/visitor/charge records and own support requests.

The permissions in `services/permissions.ts` are starter role-level rules. Full row-level campus, staff assignment and department scoping is not yet consistently enforced across every endpoint. Review that policy before enabling multiple campuses with different operators.

## Residence workflow

1. Staff creates a hostel under an active branch and chooses an occupancy policy.
2. Staff adds rooms and individual bed codes. Duplicate codes inside the same parent are rejected.
3. A student submits a date-bounded accommodation application for their own active student record.
4. Residence staff reviews, waitlists, approves or rejects it.
5. After approval, staff selects a serviceable bed and allocates an inclusive date window. The API checks overlapping bed and student allocations inside a serializable transaction.
6. Check-in is allowed only when the start date has arrived, the stay has not expired, and the bed has no other active resident. Check-out records the actor and timestamp and preserves an upcoming reservation where present.
7. Bed/room maintenance status changes are refused where they conflict with reserved or occupied allocations.

Student-facing catalogue records expose only active student-eligible hostels, a short description and available-bed counts. Room details, bed statuses, warden identities and maintenance/visitor details are not included in the student catalogue.

`STAFF_ONLY` residences are hidden from students and cannot be selected by a student application or allocated from that application. `SINGLE_GENDER`, `DESIGNATED_STUDENT_GROUP` and `ACCESSIBILITY_FOCUSED` policies are stored for review, but the platform does not yet infer sensitive eligibility attributes or automatically enforce those policy types. Staff must configure and apply appropriate lawful criteria in the approved college process.

## API routes

Base path: `/api/hostels`. Authenticated routes are mounted behind `requireAuth`.

### Inventory and overview

- `GET /overview`
- `GET /reference-data`
- `GET /`
- `POST /`
- `PATCH /:hostelId`
- `POST /:hostelId/rooms`
- `PATCH /rooms/:roomId`
- `PATCH /beds/:bedId/status`

### Applications and allocations

- `GET /applications`
- `POST /applications`
- `PATCH /applications/:applicationId/review`
- `POST /applications/:applicationId/allocate`
- `GET /allocations`
- `POST /allocations/:allocationId/check-in`
- `POST /allocations/:allocationId/check-out`

### Maintenance and visitors

- `GET /maintenance`, `POST /maintenance`, `PATCH /maintenance/:requestId`
- `GET /visitors`, `POST /visitors`, `PATCH /visitors/:visitorId/status`

### Accommodation billing

- `GET /charges`, `POST /charges`
- `POST /charges/:chargeId/approve`
- `POST /charges/:chargeId/invoice`

A charge starts as a draft. A different Finance-authorized account must approve it; the charge-creation endpoint and approval endpoint are separate. Invoice creation creates a **draft** student invoice plus a snapshot invoice line. It does not collect payment or issue the invoice; use the Finance module's separately authorized invoice issuance and payment workflow.

### Student services and announcements

- `GET /student-services/requests`, `POST /student-services/requests`
- `GET /student-services/unassigned-sensitive`
- `PATCH /student-services/requests/:requestId/assign`
- `POST /student-services/requests/:requestId/updates`
- `PATCH /student-services/requests/:requestId/status`
- `GET /announcements`, `POST /announcements`
- `PATCH /announcements/:announcementId/status`

Health and counselling referrals, or any request explicitly flagged sensitive, are marked `RESTRICTED`. The unassigned sensitive queue returns only a case reference, type/status, branch and admission number—no description or conversation. The full case is not available through the usual list until assigned; after assignment, the record is visible to the requester and assigned handler. This is an application-level control, not encryption at rest or a substitute for the college's safeguarding/privacy process.

Student announcements are restricted to the student's recorded branch. Hostel-resident announcements are additionally filtered through residence allocations. Non-manager staff can view campus-wide `STAFF_ONLY` and `ALL_STUDENTS` announcements for their staff-profile branch where one is present.

## Business rules and security details

- Server-side authorization is required for mutations; UI visibility is not authorization.
- Students cannot submit on another student's behalf or access another student's private residence records.
- Students can request maintenance only for the residence/room/bed where they have a current allocation.
- Visitor registration for a resident requires an allocation that covers the expected visit date. Only expected visitors can be checked in; only checked-in visitors can be checked out.
- Application and allocation date ranges are inclusive. Allocations use serializable transactions and reject overlapping bed/student dates.
- Finance must separately approve each draft charge; the charge creator cannot approve that same charge.
- Sensitive state changes, allocations, check-in/out, visitor changes, charge approvals/invoicing and student-support changes create audit events.
- Rate limits apply to POST submissions for applications, maintenance, visitors and student-service requests. Other methods are not affected by those specific rate limiters.
- College calendar dates use `Africa/Nairobi` for server-side stay checks. Date-only UI values are preserved as calendar dates independently of the browser's timezone.

## Database models added

`Hostel`, `HostelRoom`, `HostelBed`, `HostelApplication`, `HostelAllocation`, `HostelMaintenanceRequest`, `HostelVisitor`, `HostelCharge`, `StudentServiceRequest`, `StudentServiceUpdate`, and `HostelAnnouncement`, plus the related role/enums and inverse relations to `User`, `Branch`, `Student`, and `StudentInvoice`.

## Local migration

No generated Prisma migration is included in this source archive.

- **Empty/new database:** generate one initial migration from the current full schema using the root setup flow and `--name foundation`.
- **Existing database from existing schema history:** preserve the original migration directory and generate a follow-up migration:

```powershell
npm install
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name hostels_student_services
npm run typecheck
npm test
npm run build
```

Never replace an existing migration history with a foundation migration when a database already has data.

## Verification and remaining work

Source-level syntax-transpilation and static configuration checks have been run in the current environment. Package installation timed out on a package-registry connection error, so generated Prisma typechecking, Prisma schema validation, generated migrations, live PostgreSQL constraints, API integration tests and full web/API production builds are still unverified. Verify them locally before depending on the feature.

Before production, add and test branch-scoped row authorization for every object lookup; malware/abuse monitoring for support submissions; confidential-case access logging and retention rules; encrypted database/storage backups and recovery; escalation/notification delivery; emergency contact and incident flows; check-in/out operational controls; end-to-end tests for concurrent overlapping allocations; occupancy-policy eligibility workflows; automated charge/invoice issue and reconciliation integration; and formal privacy/safeguarding approval for counselling and health-related records.
