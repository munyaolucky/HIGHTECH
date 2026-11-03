# Academic Operations

## Scope

This module connects teaching and assessment workflows to the college master data and student records. It is a functional implementation scaffold that still requires full schema/client validation, migration generation and runtime testing before live use.

## Data flow

1. A registrar, principal or administrator creates a `CourseOffering` for one active unit, academic period and campus.
2. An active `LECTURER` Staff account is assigned to the offering.
3. A manager enrols a student by student-record ID, or a student self-registers from the signed-in catalogue. The student must belong to the program that owns the unit. Offerings can restrict enrolments using capacity.
4. Staff add weekly `TimetableSlot` entries. The API checks overlapping time and effective-date windows against other timetable slots, room names and assigned lecturers.
5. Staff create an `AttendanceSession` for an offering/date and record `PRESENT`, `ABSENT`, `LATE` or `EXCUSED` for currently enrolled students. There can be one attendance session per offering/date in this initial model.
6. Staff create assessments as drafts, publish them, enter marks during the published/marking states, then close assessments.
7. Calculate weighted results only when the closed/marking/released assessment weights total 100% and all currently enrolled students have marks for each included assessment.
8. Submit draft scores. An authorized reviewer approves results and can attach the approved grade/notes. A separate release action makes a result visible in the student's portal.

## Permissions

- Creating offerings, assigning lecturers, staff enrolment and academic master-data lookups: `SUPER_ADMIN`, `ADMIN`, `PRINCIPAL`, `REGISTRAR` as configured in the current role policy.
- An active `LECTURER` can work with an offering only if their Staff record is assigned to it. This applies to reads and writes in academic operations routes.
- Students can browse only offerings for their own recorded program, self-register only where an offering is open/in progress and within capacity, and retrieve their own enrolled units, assessment details, attendance and released results.
- Result approval/release is restricted to manager/moderator roles, separate from lecturer submission.
- Every important write records an audit event without storing submitted passwords or other authentication secrets in audit metadata.

## API endpoints

All listed routes use `/api/academic` as the prefix.

| Method | Path | Purpose |
|---|---|---|
| GET | `/overview` | Aggregated offering, registration, assessment, result and attendance counts |
| GET | `/offerings` | Authorized offering list |
| POST | `/offerings` | Create offering |
| GET | `/offerings/:id` | Offering details |
| POST | `/offerings/:id/lecturers` | Assign or update lecturer/lead flag |
| POST | `/offerings/:id/enrolments` | Staff enrol a student |
| POST | `/offerings/:id/enrolments/me` | Student self-registration |
| PATCH | `/enrolments/:id` | Change enrolment status |
| GET/POST | `/offerings/:id/timetable` | List or add timetable slots |
| GET/POST | `/offerings/:id/attendance` | List or record attendance sessions |
| GET/POST | `/offerings/:id/assessments` | List/create assessments |
| PATCH | `/assessments/:id/status` | Publish, move to marking or close an assessment |
| POST | `/assessments/:id/marks` | Save or revise marks while marking is open |
| POST | `/offerings/:id/results/calculate` | Calculate weighted scores |
| POST | `/offerings/:id/results/submit` | Submit draft results for moderation |
| GET | `/offerings/:id/results` | Retrieve offering results for authorized academic staff |
| PATCH | `/results/:id/approve` | Approve submitted result and optionally record grade/review note |
| POST | `/results/:id/release` | Release approved result to student portal |
| GET | `/catalog` | Signed-in student's own-program offering catalogue |
| GET | `/me` | Signed-in student's own academic summary |

## Important validation rules

- A unit must be active and belong to the offering campus through its program.
- The academic period must belong to the same campus and remain inside its academic-year dates.
- Section code must be unique for a unit and period.
- A lecturer must have an active staff record, active user account and `LECTURER` role; staff with an explicit different branch cannot be assigned across branches.
- Enrolments require a currently active student account, matching unit program and open/in-progress offering.
- Start/end times must be ordered; weekly timetable overlap is checked by weekday, time and effective date range.
- Attendance records must refer to active enrolments in the offering; a student cannot be duplicated in a session.
- Marks cannot exceed the assessment maximum or be entered while marking is not open. Approved/released results block changes to underlying marks.
- Result calculation requires eligible assessment weights to total 100% and requires every currently enrolled student to have a mark for each included assessment.
- Result release requires prior approval.

## Remaining work before production

- Generate and commit Prisma migrations from the complete schema, then verify applying them on a clean PostgreSQL instance.
- Complete TypeScript semantic typecheck and integration/end-to-end testing using installed dependencies and generated Prisma client.
- Implement a student-directory search by admission number/name so staff do not need to paste internal IDs into enrolment.
- Implement branch-scope policies for manager roles and more granular role permissions.
- Add configurable college grading scales with effective dates/academic year/program and grade points; require the proper approved grade scale for grade assignment.
- Complete curriculum prerequisite, credit-load, registration-window, timetable date and venue entity policies.
- Add student assignments/submissions, practical evidence and rubric, exam papers/seating, supplementary/resit rules, result corrections/reopening with independent authorization, progression, completion and graduation.
- Add notification service for timetable, assessment deadline, attendance and result release.
- Add accessible print/export for attendance registers, mark sheets and result sheets.
- Define retention, privacy, safeguarding and regulatory policies before using real student data.

## Local verification

From the repository root:

```powershell
npm install
npm run db:generate
# Brand-new database: generate the baseline using the current complete schema.
npm run db:migrate --workspace @hitech/api -- --name foundation
npm run typecheck
npm test
npm run build
```

When adding this version to an earlier local project with migration history, preserve that history and instead generate a follow-up migration named `academic_operations`. Do not delete migration history to force the schema onto an existing database.
