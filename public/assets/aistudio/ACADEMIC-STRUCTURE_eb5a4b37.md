# Academic Structure Module

## Purpose

Provide a single authoritative catalogue of campuses, departments, qualifications/programs, academic years, academic periods, course units and intakes. Future admission, enrollment, examination, fee, timetable and certification features must reference these records instead of maintaining separate copies.

## User interface

Open **Academic Management** after signing in with a role assigned `structure:manage`. The UI provides:

- Overview totals and a searchable table for each record type.
- Create forms with validation, relationship-aware dropdowns and active/status actions.
- Responsive table and form layouts for desktop and small screens.
- Error/success messages and explicit refresh controls.
- Status updates or deactivation in place of destructive deletion.

The UI reads and writes the API. It contains no seeded mock master data.

## Data model

- `Branch`: campus/business location.
- `Department`: department within a branch.
- `Program`: qualification, award level, awarding body, duration, study mode, curriculum version, credits, entry requirements and accreditation metadata.
- `AcademicYear`: campus-scoped year range and lifecycle status.
- `AcademicPeriod`: term/semester/module block plus registration, teaching, assessment and fee-related deadline dates.
- `CourseUnit`: program curriculum unit, type, level, credits, hours, prerequisites and learning outcomes.
- `Intake`: campus/program application group, deadline, expected start/end, capacity and lifecycle status.
- `Student.intakeId`: optional relation reserved for subsequent admissions integration; current admission workflow is not implemented.

## API authorization

| Permission | Roles in the starter policy | Use |
|---|---|---|
| `structure:manage` | Super Administrator, Administrator, Principal, Registrar | Read and edit department/program/year/period/unit/intake master data |
| `branches:manage` | Super Administrator, Administrator | Create/update/deactivate campuses |

Every endpoint also requires an active signed-in account. Do not rely on the client hiding controls as authorization. Additional branch-scope checks must be implemented before delegated campus administrators are introduced.

## Validation and invariants

- Campus code is unique globally. Department/program codes are unique within their campus. Year code is unique within a campus. Period and unit codes are unique within their parent academic year/program. Intake code is unique within its campus.
- Program department must belong to the same campus as the program.
- Intake program and academic year, if assigned, must belong to the chosen campus.
- Academic period date range must sit within the academic year date range.
- Intake end date cannot precede start date.
- Codes and text are trimmed and size-limited; date-only inputs use `YYYY-MM-DD` and are parsed server-side.
- Writes produce audit entries. Existing historical records should be deactivated/archived rather than deleted.

## Endpoint summary

`/api/structure/overview`

`/api/structure/branches`

`/api/structure/departments`

`/api/structure/programs`

`/api/structure/academic-years`

`/api/structure/periods`

`/api/structure/units`

`/api/structure/intakes`

Each catalogue supports `GET` and `POST` at the collection route plus `PATCH /:id` for edits, except collection routes where create/update permission differs. `GET` list routes return `{ "items": [...] }` and create/update returns `{ "item": ... }`. List routes accept an optional `q` search term; supported filters include `branchId`, `departmentId`, `academicYearId` or `programId` for applicable resources.

## Not yet implemented

- A checked-in SQL migration and a tested migration-upgrade path from all earlier versions.
- Automated API/database tests for CRUD, duplicate codes, cross-campus references, date constraints and audit logging.
- Enforcing a single `CURRENT` academic year per campus with a database-backed/transactional constraint (the API currently checks before writes but that check alone is not race-proof).
- Full record editing through forms; parent relationship selectors stay locked where changing the parent would reclassify existing records. Separate row actions handle activation and lifecycle status.
- Course cohort, unit-offering, lecturer assignment, timetable, enrollment and prerequisite enforcement.
- Multi-campus row-level authorization for delegated administrators.
