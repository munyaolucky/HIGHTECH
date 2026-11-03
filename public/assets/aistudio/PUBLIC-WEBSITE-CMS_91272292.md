# Public Website & Content Management System

The CMS and public website are part of the shared HI-TECH College Platform monorepo. It provides public-facing pages and catalogues plus an authenticated editing, review and publishing workspace.

## Public website

- Open the public website from the sign-in screen using **Visit the public college website**.
- The home screen lists active programmes from the Academic Structure tables, latest published CMS news and announcements, and published general pages.
- The programme catalogue reads only active programs and active branches.
- The fee catalogue reads published, currently effective `ServiceRate` rows and includes currency, billing unit, branch, program and academic period information. It is informational; issued student invoices remain authoritative.
- News, announcements and events come from public CMS content. Pages, search results and featured images are fetched through public endpoints.
- The **Contact & forms** view includes a direct enquiry flow backed by the rate-limited public admissions CRM endpoint, alongside CMS-published forms. Visitors can return to the college website after an enquiry or online application.
- Public forms use a constrained schema: text, textarea, email, phone, select and checkbox. The server rejects unknown keys, invalid types, invalid email addresses, invalid select values, missing required fields and oversized answers.
- Form submission returns a reference. If `consentNotice` exists, the API requires explicit consent.

## Content lifecycle

`DRAFT -> PENDING_REVIEW -> APPROVED -> PUBLISHED` or `SCHEDULED`; review may reject content and managers may archive it. Only authenticated CMS managers can publish or schedule approved items. A contributor cannot review their own content or media. The public API serves published/scheduled content only when `isPublic` is enabled and the publication/expiry window allows it. Body content is rendered as escaped text rather than executing author-provided HTML or scripts.

Content contributor type restrictions currently include:

- Finance Officer: fee/general content.
- HR Officer: staff profile/general content.
- Lecturer: course, event, news/general content.
- Librarian: library, news/general content.
- Hostel Officer: hostel, announcement/general content.
- Student Services Officer: announcement, event/general content.
- CMS managers (Super Admin, Admin, Principal, Registrar): all content categories.

The current authorization model is role-level. It does not yet implement comprehensive per-branch/campus ownership checks for CMS records. Configure contributor responsibilities and access before use with real content.

## Media library

CMS media accepts JPG, PNG and WEBP images up to 10 MB. SVG and arbitrary HTML are not accepted. Files are stored under `PRIVATE_FILE_STORAGE_DIR` inside `tmp` and `objects`, using a random storage key, with hash and metadata in `StoredFile`. Uploaded media remains private until an independent authorized reviewer approves it; public media is returned by `/api/cms/public/media/:id` only when its status and public flag allow it. The server sends `X-Content-Type-Options: nosniff` and a short cache lifetime.

The signature check is lightweight validation, **not antivirus scanning**. Configure malware scanning/quarantine, private object storage, backups and observability before public production deployment. Ensure uploaded image usage is licensed and that alt text describes the image appropriately.

## Database models

- `CmsContent`: pages, news, announcements, events, programme/fee information pages and other CMS content.
- `CmsMediaAsset`: image metadata, approval and public visibility.
- `CmsForm`: field definitions, public/approval state and consent notice.
- `CmsFormSubmission`: private form response, contact information, reference and review status.

Form submission data may include personal information. Review permissions and retention policies, do not export it to public pages, and restrict access to form owners/authorized reviewers. Automated record deletion and email notifications are not implemented in the current implementation.

## API endpoints

Public endpoints (no account required):

- `GET /api/cms/public/content`
- `GET /api/cms/public/content/:slug`
- `GET /api/cms/public/catalogue/programs`
- `GET /api/cms/public/catalogue/fees`
- `GET /api/cms/public/forms`
- `GET /api/cms/public/forms/:slug`
- `POST /api/cms/public/forms/:slug/submissions` (rate-limited)
- `GET /api/cms/public/media/:id`

Authenticated endpoints:

- `GET /api/cms/overview`
- `GET/POST /api/cms/content`
- `PATCH /api/cms/content/:id`
- `POST /api/cms/content/:id/submit-review`
- `POST /api/cms/content/:id/review`
- `POST /api/cms/content/:id/publish`
- `POST /api/cms/content/:id/archive`
- `GET/POST /api/cms/forms`
- `POST /api/cms/forms/:id/submit-review`
- `POST /api/cms/forms/:id/review`
- `POST /api/cms/forms/:id/publish`
- `GET /api/cms/forms/:id/submissions`
- `PATCH /api/cms/forms/:formId/submissions/:submissionId`
- `GET/POST /api/cms/media`
- `POST /api/cms/media/:id/review`
- `POST /api/cms/media/:id/archive`

## Current limitations

- Full rich-text/WYSIWYG authoring, public page history/rollback, a published-page revision workflow, link checker, complete accessibility/language metadata workflow, custom domain/SEO deployment integration, SMTP notifications, preview links for drafts, analytics, form attachments and automated retention are not implemented yet.
- Programme details are served from active academic master data; the CMS editor does not rewrite program or fee records directly.
- A `COURSE` or `FEES` CMS page is editorial content, not an official program/rate master record.
- CMS media uploads use local private storage. Do not expose that directory through static web hosting.
- The package registry timeout prevented dependency installation in the generation environment. Run Prisma schema validation, generated-client typechecking, migrations, tests and full web/API builds in the local environment before use.

## Migration and checks

No generated migration is included. For a brand-new empty database, generate one `foundation` migration from the current complete Prisma schema. For an existing database, keep its migration history and generate the follow-up migration `public_website_cms`; back up and test against a copy first.

```powershell
npm install
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name public_website_cms
npm run typecheck
npm test
npm run build
```

Public site information should be reviewed by the college before launch. Replace sample or draft content with verified institutional information. Do not publish unapproved fees, accreditation claims, staff details, student information or copyrighted media.
