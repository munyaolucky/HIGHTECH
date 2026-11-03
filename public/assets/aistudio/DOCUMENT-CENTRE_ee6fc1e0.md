# Document Centre

## Purpose and boundary

The Document Centre manages college-wide institutional documents. It is distinct from `/api/learning`, which manages course resources and assignment submissions. The Document Centre can associate a record with a student and campus where the caller is permitted to do so, but it does not replace admission checklist records or the learning-resource licensing model.

## Web screen

The **Document Centre** menu opens a responsive workspace with overview counters, search by title/reference/description, category filters, All/My uploads/Needs review/Expiring soon views, upload/bulk upload, preview/download, versions/review history, approve/reject/request-changes, replacement upload, restricted/archive actions, and secure access grants.

The UI is a connected client for the Express API. It is not a substitute for backend authorization: every document endpoint applies category and role checks independently.

## Categories and role permissions

Categories are `admissions`, `student-records`, `academics`, `student-submissions`, `finance`, `library`, `hr`, `hostel-welfare`, `website-media`, `policies-forms`, `certificates`, `scholarship`, and `other`.

- Super Administrator, Administrator and Principal manage all document categories in the starter permission map.
- Registrar manages admissions, student records, academics, certificates, policies/forms, student submissions, scholarship and hostel/welfare.
- Finance Officer manages finance and scholarship.
- HR Officer manages HR.
- Lecturer manages academics and student submissions.
- Librarian manages library, website media and policies/forms.
- Students can upload their own records only in the configured student-upload categories. Parent and guest roles cannot upload through this service.

These category-level permissions are a development starting point. Campus/branch record-level enforcement and special access for minors/safeguarding/counselling files must be completed before production deployment.

## Access policy

Every upload defaults to `OWNER_ONLY` and starts in `PENDING_REVIEW`. Sensitive categories remain owner-only for ordinary readers unless a named access grant is issued. Authorized category managers can review and administer records in their scopes.

Broad policies (`AUTHENTICATED`, `STAFF_ONLY`, `ROLE_RESTRICTED`) are limited by the service to `academics`, `library`, `website-media` and `policies-forms`. `PUBLIC` is narrower and only allowed for `library`, `website-media` and `policies-forms`. Legacy or manually created broad-policy records outside permitted categories are denied to ordinary readers; the public endpoints also query only the public allowlist. A named grant can provide explicit access to an individual; shares for confidential categories require an expiry date. `canDownload=false` still permits authorized preview where the file type supports it, but does not allow downloading.

## Lifecycle and versions

- Initial upload validates metadata and file signature and creates a private stored-file record and version 1.
- Uploads enter `PENDING_REVIEW`; they do not automatically become official verified documents.
- A category manager can approve, reject or request changes. The owner and the uploader of the current version cannot review/approve that version.
- An owner can upload a replacement after rejection/change request. The replacement creates a new version and returns the document to pending review; prior versions remain in history.
- A metadata change to an approved manager-owned document returns it to pending review.
- Managers can restrict or archive. Archived records are hidden from ordinary users and cannot be restored via the current UI/API; any restore feature should be a separate audited workflow.
- `expiresAt` controls access expiry. `retentionUntil` is recorded and validated as future metadata, but no automatic retention/deletion worker is implemented.

## Upload/storage controls

- Private filesystem storage is configured by `PRIVATE_FILE_STORAGE_DIR` (default `./private-files` in development) and is not mounted as static web content.
- Single-file uploads: one file, maximum 30 MB.
- Staff bulk uploads: maximum 10 files, maximum 30 MB each and 100 MB combined per request.
- The current allowlist includes PDF, JPEG/PNG/WebP, MP4/WebM, MP3/WAV, TXT, ZIP, EPUB, DOCX, PPTX and XLSX. Type/extension pair and lightweight signature checks are applied; ZIP-based formats receive only container-signature validation.
- Random storage keys are used instead of user-supplied paths; file names are sanitized; hashes are recorded to identify likely duplicates.
- Preview and download endpoints enforce authorization and set `nosniff`, private/no-store cache headers, content disposition and basic range support.

**This is not antivirus scanning.** Do not accept real student or staff records until antivirus/quarantine, production private object storage, storage encryption, verified backups/restoration, data-retention enforcement and monitoring are in place. File signature checks do not prove a file is benign, authentic or legally distributable.

## API routes

Base: `/api/documents`

Public routes (no sign-in, but only approved unexpired public-category documents):

- `GET /public` — published public catalogue.
- `GET /public/:id/preview` — preview supported safe MIME types.
- `GET /public/:id/download` — download if that record permits downloading.

Authenticated routes:

- `GET /categories` — categories plus caller's upload/manage flags.
- `GET /overview` — visible-category counts, own uploads and upcoming expiry counts.
- `GET /?q=&category=&status=&view=all|mine|pending|expiring&page=1&pageSize=30` — role-filtered document list.
- `POST /` — one-file `multipart/form-data` upload (`file` field, title, category, optional descriptive/access/date metadata).
- `POST /bulk` — staff-only bulk `multipart/form-data` upload (`files[]` field, category and optional title prefix/metadata).
- `GET /:id` — authorized document detail, version and permitted review history.
- `PATCH /:id/metadata` — permitted metadata changes.
- `POST /:id/resubmit` — resubmit a draft/rejected/change-requested record.
- `POST /:id/versions` — upload a replacement file version.
- `POST /:id/review` — approve/reject/request changes with a note.
- `PATCH /:id/status` — restrict or archive.
- `POST /:id/grants` — grant a particular active account preview/download access; confidential-category shares require expiry.
- `DELETE /:id/grants/:grantId` — revoke an active grant.
- `GET /:id/preview` — authorized inline preview for supported MIME types.
- `GET /:id/download?version=N` — authorized current or historical version download.

Every request must use the existing authenticated API client and the same-origin/cookie-or-bearer auth configuration. Never expose `storageKey` or filesystem paths as public URLs.

## Database models added

- `Document`: metadata, owner, category, access policy, status, student/campus relationship, current version, expiry and retention metadata.
- `DocumentVersion`: immutable link between a document, stored file, version number and uploader.
- `DocumentReview`: review decisions and notes.
- `DocumentAccessGrant`: per-user grants, optional expiration, download flag and revocation.
- Relations to the existing `StoredFile`, `User`, `Student`, `Branch` and `AuditLog` models.

## Migration and validation

From the project root on Windows PowerShell:

```powershell
npm install
npm run db:generate
```

For a new, empty database with no previous migration history, generate the first migration from the full current schema:

```powershell
npm run db:migrate --workspace @hitech/api -- --name foundation
```

For an existing local database initialized by earlier project versions, preserve that database's existing `apps/api/prisma/migrations` directory and create a new migration named `document_centre` instead. The starter ZIP does not include generated environment-specific migration history; do not delete or replace migrations that have already been applied to a database containing data.

After package installation and migration, run:

```powershell
npm run typecheck
npm test
npm run build
```

The policy unit tests are in `apps/api/src/services/document-policy.test.ts`. Add API integration tests for users reading documents they do not own, expired/revoked grants, public-category allowlists, role/category boundaries, student/campus mismatch, uploader-review separation, archived records, oversized/spoofed uploads, range requests and storage cleanup on failed transactions.

## Verification status for this archive

Source TypeScript/TSX files passed syntax-transpilation checks and JSON config files parsed successfully. Package installation timed out due a package registry connection problem, so Prisma schema validation, generated-client typechecking, migrations, database/API integration tests and full production builds have not been verified in this environment. Do not treat syntax parsing as runtime or production validation.
