# Staff & HR Management

## Current module scope

This is a development foundation for staff directory and day-to-day HR operations. It uses the existing `User`, `Staff`, `Branch`, `Department`, `CourseOffering`, `Document`, and `AuditLog` records rather than introducing another user/account store.

Implemented workflows include:

- Staff profile creation from an existing eligible, unlinked staff-role user account; unique employee number; campus/department validation; employment type/status; joining date; probation end date; work location.
- Staff directory search and staff detail view, including linked HR-category documents.
- Staff contracts with contract number, position, employment type, effective dates, optional confidential compensation, currency/pay frequency and terms; draft submission; independent review; approval; and activation.
- Leave requests with date range, leave type, requested day count in half-day increments, reason, no-overlap validation against existing submitted/approved requests, review decision and cancellation of the employee's own submitted request.
- Attendance records with one row per employee and date; Present, Absent, Late, Remote, Half Day and On Leave; optional check-in/out timestamps and a validation rule that check-out must be after check-in.
- Workload records for teaching, administration, projects, supervision, committees and other work; optional link to an academic course offering; weekly hours; effective dates; planned/active/completed/cancelled statuses.
- Employee self-service for personal staff profile, current contract data, own leave, attendance and workload.
- Document Centre linking for personnel documents through `Document.staffId`, restricted to HR category and an owner matching the selected staff record.
- Audit events for profile, contract, leave, attendance and workload changes.

## Permissions

`hr:manage` is currently assigned to `SUPER_ADMIN`, `ADMIN`, and `HR_OFFICER`. Those roles can manage staff records, see HR overview/reference data and candidate accounts, and work with organization-wide contract, leave, attendance and workload views. The principal/registrar/finance/lecturer/librarian roles can access only their own HR self-service data unless separately authorized. Student, parent and guest roles cannot submit leave or access staff-only management features.

API authorization is enforced server-side. Do not treat a hidden menu item as an access-control boundary. The current starter does not yet have comprehensive branch-scoped filtering for HR managers; deploy only after deciding and implementing campus/department scope for each authorized role. Contract compensation is confidential HR data and should not be copied into general reports or shared documents without a valid basis.

Contract review requires an independent reviewer: neither the contract creator nor the employee whose contract it is may approve/reject it. Rejections require a reason. Contract activation requires an approved contract within its effective date window and rejects date overlap with another active contract for that employee. Marking a staff profile as terminated also marks its active contracts as terminated inside the same database transaction. Leave review also prevents a user from approving their own request; rejection requires a reason. Attendance date summaries use `Africa/Nairobi` as the college timezone in this starter.

## API route catalogue

All endpoints are under `/api/hr` and require a valid bearer access token.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/overview` | HR manager |
| GET | `/me` | Current signed-in staff member |
| GET | `/reference-data` | HR manager |
| GET | `/user-candidates` | HR manager |
| GET / POST | `/staff` | HR manager |
| GET / PATCH | `/staff/:staffId` | HR manager |
| GET | `/contracts` | HR manager |
| POST | `/staff/:staffId/contracts` | HR manager |
| POST | `/contracts/:contractId/submit` | HR manager |
| POST | `/contracts/:contractId/review` | Independent HR manager; body includes `decision: APPROVE\|REJECT`, rejection requires `note` |
| POST | `/contracts/:contractId/activate` | HR manager, after approval and effective-date checks |
| GET | `/leave` | HR manager sees all; other staff sees their own records |
| POST | `/leave` | Staff self-service only |
| POST | `/leave/:leaveId/review` | HR manager excluding the employee; rejection requires `note` |
| POST | `/leave/:leaveId/cancel` | Owner of a draft/submitted request |
| GET | `/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD` | HR manager sees all; staff sees own records |
| POST | `/attendance` | HR manager |
| PATCH | `/attendance/:attendanceId` | HR manager |
| GET | `/workloads` | HR manager sees all; staff sees own records |
| POST | `/workloads` | HR manager |
| PATCH | `/workloads/:workloadId` | HR manager |

Most request bodies use strict Zod schemas; invalid or unknown fields are rejected. The exact response shape is available in the route handlers and corresponding functions/types in `apps/web/src/lib/api.ts`.

## Database additions

The Prisma schema adds:

- `StaffEmploymentType`, `StaffContractStatus`, `StaffLeaveType`, `StaffLeaveStatus`, `StaffAttendanceStatus`, `StaffWorkloadType`, and `StaffWorkloadStatus` enums.
- Additional `Staff` fields for employment type, joining date, probation end date and work location.
- `StaffContract`, `StaffLeaveRequest`, `StaffAttendance`, and `StaffWorkload` models.
- `Document.staffId` relationship for HR-category document linking.
- Relations from contracts, leave reviews, attendance records, workloads and academic course offerings.

A generated migration is not included in the ZIP. For an empty new database, create the first migration from the current full schema using `npm run db:migrate --workspace @hitech/api -- --name foundation`. For a database that already uses migrations from existing schema history, preserve the entire `apps/api/prisma/migrations` history and generate a follow-up migration named `staff_hr_management`. Never delete or regenerate migration history against a database with data.

## Local setup and verification

```powershell
npm install
npm run db:generate
# Empty database only:
npm run db:migrate --workspace @hitech/api -- --name foundation
# Existing database with existing schema history instead uses:
# npm run db:migrate --workspace @hitech/api -- --name staff_hr_management
npm run typecheck
npm test
npm run build
```

The HR rule unit tests are in `apps/api/src/services/hr-rules.test.ts` and cover inclusive date ranges, leave day validation, overlapping leave, attendance time order, independent review, contract states/effective dates and workload date ranges.

## Known limitations before production

- The current archive does not contain generated migration files. Generate and commit migrations in the actual development environment.
- During preparation, npm package installation timed out at the package registry; therefore generated Prisma client checking, schema validation, applied migrations, live API integration tests, and the final production build have not been verified here. Source syntax/configuration and ZIP integrity checks are separate and do not prove runtime correctness.
- Candidate accounts must already exist. A staff account provisioning/invitation workflow still needs to be completed as part of user administration and secure email delivery.
- There is no payroll calculation, payslip, pension/tax/statutory deduction engine, automated clock-in device integration, biometric tracking, shift scheduling, leave balance accrual, holiday calendar, overtime engine or appraisal/performance-review workflow in the current implementation.
- Leave day count is validated against the calendar interval, not a working-day/holiday calendar. Configure approved college policy before operational use.
- HR document linking reuses Document Centre, but antivirus scanning, production object storage, retention automation, encryption and full branch/department-level data scoping remain operational prerequisites.
- Add concurrency/integration tests for contract activation overlaps, leave review race cases, uniqueness, audit failures and database transactions before live use.
- Keep compensation access restricted. Review applicable employment, privacy, records-retention and data-protection requirements with the college before storing real personnel records.
