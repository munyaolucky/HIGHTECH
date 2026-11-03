# Reports & Analytics

## Included

- Authenticated `/api/reports/overview` with bounded date filters and an optional campus filter.
- Role-permission-gated aggregate sections for academics, admissions, finance, HR, hostels, documents, digital library/e-learning, student/community and CMS.
- Monthly student-record and admission-submission trends, attendance status counts and record-attendance rate, finance summaries by currency, HR leave/attendance, bed inventory/hostel applications, document and learning-resource workflow counts, events/projects and CMS workflows.
- CSV exports at `/api/reports/export?type=...` for enrolments, admissions, finance, attendance, staff, hostels, documents, library, community and CMS.
- Spreadsheet formula-injection protection when text cells begin with formula prefixes; CSV fields are always quoted and quotes are doubled.
- Responsive React reports workspace with date and campus filters, role-permitted export options, trend charts and aggregate status tables.

## API

### `GET /api/reports/overview`

Requires authentication and `reports:view` permission. Optional query parameters:

- `branchId`: selected campus ID.
- `from`: inclusive UTC date in `YYYY-MM-DD` format.
- `to`: inclusive UTC date in `YYYY-MM-DD` format.

Defaults to the 365-day window ending on the current UTC date. Invalid dates, reversed windows and ranges longer than 731 days are rejected. The date `to` becomes an exclusive next-day timestamp at the database boundary.

The response includes the filter echo, active campus choices, role-authorized metrics, module sections and `allowedExports`. Finance values are grouped by currency; no attempt is made to add KES, USD, GBP, EUR or other currency totals together. Trend series use the database's month bucket and return counts only, not personal identifiers.

### `GET /api/reports/export?type=<type>`

Requires `reports:view` plus the relevant module permission:

| Export type | Additional permission | Contents |
|---|---|---|
| `enrolments` | `admissions:manage` | New student-record counts by campus/programme |
| `admissions` | `admissions:manage` | Applications grouped by campus/status |
| `finance` | `finance:manage` | Invoice/payment aggregate sums by currency/status; no student names or invoice identifiers |
| `attendance` | `academic:manage` | Attendance records grouped by status |
| `staff` | `hr:manage` | Staff-profile counts by campus/employment status; no personal or salary details |
| `hostels` | `hostel:manage` | Bed status and application status aggregates |
| `documents` | `documents:manage` | Document category/status aggregates; no titles, filenames or owner details |
| `library` | `library:manage` | Resource scope/status aggregates |
| `community` | `community:manage` | Club/event/project status aggregates |
| `cms` | `cms:manage` | Content-type/status aggregates |

CSV exports use a UTF-8 BOM for spreadsheet compatibility, a filtered date window, and attachment filenames that include the report type and dates.

## Interpretation notes

- “New student records” means student records created in the date range, not a definitive count of admitted/active students. The overall Student records KPI is an all-time current-record count.
- Admission trends use submission timestamps and application statuses. Status counts can include applications that were created in the period and changed status later; the report does not claim a full status-change history because all transitions are not stored in a dedicated immutable event table.
- Finance invoice aggregates use invoice currency and issued date; confirmed-payment aggregates use the payment's stored currency. Because transaction currencies can differ from invoice currencies, these are reported in separate groups and must not be compared as if converted to one currency.
- Attendance rate is `(PRESENT + LATE) / (all attendance records minus EXCUSED records)`. It is a record-based rate, not a unique-student or scheduled-contact-hour metric.
- Bed occupancy is based on bed records marked OCCUPIED divided by registered beds in scope. It does not use a date-specific allocation occupancy calculation.
- Public form submissions are not campus-scoped because the current `CmsForm` model has no `branchId`.

## Security and known limitations

Reports require `reports:view`; exports additionally require the module-specific permission listed above. Exports are deliberately aggregate-only: finance exports do not expose personal financial transactions, HR exports do not include names/salary, and document exports do not reveal titles/owners.

**Branch-level authorization is not yet enforced.** The project does not yet have a standard campus-scope grant attached to every administrative user/role. `branchId` is currently an aggregate filter, not an authorization boundary. Before multi-campus production use, implement and test an explicit per-user/per-role campus access policy and derive permitted branch IDs on the server; do not trust a caller-supplied `branchId` as proof of access.

The query range is bounded to 731 days and monthly SQL uses static allow-listed table/column names with parameterized date and branch values. This module introduces no new Prisma models, so it requires no database migration by itself. It does depend on the full schema from the the current schema already being migrated.

## Validation and verification

Pure helper tests cover date input validation, maximum range enforcement, month labels, CSV quoting and spreadsheet formula protection. In this environment, TypeScript/TSX syntax transpilation was available, but the npm package registry connection timed out. As a result, Prisma-generated-client typechecking, API database integration tests, migration execution and the full production build remain unverified. Run `npm install`, `npm run db:generate`, `npm run typecheck`, `npm test`, and `npm run build` in a network-enabled local environment before using reports operationally.
