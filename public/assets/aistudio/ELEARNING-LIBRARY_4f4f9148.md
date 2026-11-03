# E-learning & Digital Library

This module adds a development foundation for course learning resources and the digital library. It reuses the existing users, branches, course units, course offerings, lecturer assignments, student enrolments and audit log. It is not a replacement for the cross-college Document Centre, which will manage admissions, HR, finance, hostel and general administrative records separately.

## Included workflows

### Learning resources and library catalogue

1. An authorized lecturer or academic manager creates a course resource linked to a course unit or offering. A librarian or approved library manager creates library catalogue entries.
2. The resource is saved as `DRAFT` and is not visible in published catalogues.
3. A permitted creator uploads a supported file or records an HTTP/HTTPS link, then submits the item for review.
4. An authorized reviewer publishes or rejects the item with a review note. The requester cannot approve their own resource.
5. Published items are accessible according to their saved policy. Access is re-evaluated on every API request and is not implemented only as a hidden UI button.
6. Authorized students can record progress. Resource metadata, approval state and stored file identity remain separate so updates don't require putting file bytes in PostgreSQL.

Resource types include PDF, video, audio, ebook, slides, document, image, link, text, ZIP and other. Course content is linked to an offering or unit. Library items may be institution-wide or optionally linked to a branch.

### Access policies

- `PUBLIC`: published resources are available without login.
- `REGISTERED`: available to any authenticated non-guest account.
- `ENROLLED`: for e-learning items, available to enrolled students in the linked offering/unit and permitted staff managing the resource.
- `STAFF_ONLY`: available to authenticated staff roles in this starter; refine to department-specific staff if required.
- `LICENSED`: requires a current individual grant and will deny access after a configured licence expiry date.
- `APPROVAL_REQUIRED`: requires an active individual access grant created by a permitted reviewer.

Library resources should not use `ENROLLED`; the API rejects that combination. If an item uses `LICENSED` or `APPROVAL_REQUIRED`, a user can request access and an authorized library manager can approve/reject the request and set an optional grant expiry. Public metadata can be discoverable for restricted items but file access stays protected.

The general public catalogue endpoints only expose resources that are explicitly `PUBLISHED` with a `PUBLIC` access policy. Do not store confidential student data or records in this module as a workaround for the planned Document Centre.

### Assignments and submissions

- A lecturer assigned to a course offering or an academic manager can create an assignment, set a due date, maximum score, late-submission policy and whether text responses are accepted.
- Authorized staff publish the assignment.
- Enrolled students submit a text response and/or supported file. The API checks enrollment, assignment status and the deadline rule.
- Re-submissions create a new numbered version; earlier versions remain available for the audit/history workflow.
- Assigned lecturers and academic managers can review the latest submission per student, securely download an attached file, record a score that does not exceed the assignment maximum, and leave feedback.
- Marks from these learning assignments are not automatically merged into formal exam results or the weighted course grade. That integration should be a separate explicitly approved academic rule.

## API routes

All routes are mounted under `/api/learning`. Unless identified as public, routes require a valid authenticated account.

| Method | Route | Purpose |
|---|---|---|
| GET | `/public/resources` | Public-only published catalogue |
| GET | `/public/resources/:id/download` | Download a public published file |
| GET | `/overview` | Module counters for permitted managers |
| GET | `/context` | Authorized offerings and units for the current user |
| GET | `/resources?scope=ELEARNING\|LIBRARY&q=...` | Search resource catalogue; manager/creator draft view is permission-limited |
| POST | `/resources` | Create a draft resource |
| POST | `/resources/:id/upload` | Upload one permitted file to an editable draft/rejected resource |
| POST | `/resources/:id/submit` | Submit an editable resource for review |
| POST | `/resources/:id/review` | Publish or reject a submitted resource |
| POST | `/resources/:id/archive` | Archive a resource under applicable role/scope rules |
| GET | `/resources/:id/download` | Permission-checked download |
| GET | `/resources/:id/preview` | Permission-checked safe MIME preview |
| GET | `/resources/:id/stream` | Permission-checked audio/video stream, including byte ranges |
| POST | `/resources/:id/request-access` | Request access to a licensed/restricted library item |
| GET | `/access-requests` | List pending access requests for library managers |
| POST | `/access-requests/:id/review` | Approve/reject access and optionally set expiry |
| POST | `/resources/:id/progress` | Record a student's progress percentage |
| GET | `/my/progress` | List the authenticated user's progress |
| GET | `/assignments` | List assignments visible to current user/enrolments |
| POST | `/offerings/:id/assignments` | Create a course assignment |
| POST | `/assignments/:id/publish` | Publish a draft assignment |
| POST | `/assignments/:id/submissions` | Submit or resubmit student work |
| GET | `/assignments/:id/submissions` | View latest submissions (authorized teaching staff) |
| GET | `/submissions/:id/download` | Download submission if owner or authorized staff |
| PATCH | `/submissions/:id/grade` | Mark a submission and record feedback |

Request bodies use Zod validation in the API. `scope` must be `ELEARNING` or `LIBRARY`. Resource status transitions are enforced so an item cannot be published directly from arbitrary states. Student-facing APIs only expose the signed-in student's own progress and submission context.

## Private file storage and safety

The server stores uploaded bytes under `PRIVATE_FILE_STORAGE_DIR` (default `./private-files`, relative to the API process's working directory), split into temporary uploads and random-key objects. Only metadata such as display filename, MIME type, size, SHA-256 digest and uploader is stored in PostgreSQL. The randomized storage key is never returned to the frontend. The directory must never be exposed as a static web asset path.

The upload path currently has these controls:

- one file per request, at most 30 MB;
- allowlisted extensions and MIME types;
- basic signature/content validation for supported formats;
- generated server-side storage names and sanitized display filenames;
- private, no-store download/preview responses and `X-Content-Type-Options: nosniff`;
- server-side access checks for download, preview, stream and submission download;
- byte-range responses for audio/video streaming;
- transaction-based metadata writes and audit events.

**Not implemented yet:** antivirus/malware scanning, a quarantine state, extraction/scanning of archives and Office containers, a production-grade object-storage adapter, resumable/multipart uploads, file retention/deletion jobs, content-disarm-and-reconstruction, DRM, watermarking, and disaster recovery. Signature checks do not prove a file is safe. Before storing real user files, introduce a malware scanner and quarantine the uploaded object until a scan has passed. Keep the storage private, configure backups/retention, and use production-grade object storage where appropriate.

The current accepted file types are PDF, JPEG, PNG, WebP, MP4, WebM, MP3, WAV, plain UTF-8 text, ZIP, EPUB, DOCX, PPTX and XLSX. SVG, HTML, executable files and arbitrary MIME types are intentionally disallowed. The `accept` attribute in the web form is only a UI aid; the server validation is authoritative.

## Roles and permissions

- **Super Administrator / Administrator:** global module management and approved access workflows.
- **Principal / Registrar:** academic management controls; library controls as explicitly present in the starter permission map.
- **Lecturer:** course content and assignments only for an offering they are assigned to teach.
- **Librarian:** library catalogue, library resource approvals and restricted-item access requests.
- **Student:** published resources they are entitled to, their own progress, submission and released marking feedback.
- **Parent / Guest:** no direct access to private course submissions or ungranted restricted resources.

Role checks alone do not finish the future campus/department policy. Before production, every role that can manage data across campuses should be restricted by the appropriate branch/department/object scope. Keep learner files and marks confidential and do not include them in public search or catalogue APIs.

## Local setup and migration

Run from the monorepo root after setting up PostgreSQL and copying `.env.example` to `.env` as described in `README.md`.

For a fresh database, generate the first migration from the included current schema:

```powershell
npm install
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name foundation
```

For a database that already has existing migration history, keep that history and generate a follow-up migration instead:

```powershell
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name elearning_library
```

Never delete or recreate a migration directory when it has already been applied to a database containing data. Commit migrations with the application source before deployment.

## Validation and test status

File-policy unit tests are provided in `apps/api/src/services/learning-file-policy.test.ts`. After dependency installation, run:

```powershell
npm run typecheck
npm test
npm run build
```

The source has been syntax-transpiled and project JSON config files parsed in the current build environment. Package installation timed out on a package registry connection error, so no claim is made that generated Prisma types, schema validation, live PostgreSQL migrations, API integration tests or full production builds have passed. Those checks are required before this module can be relied on.
