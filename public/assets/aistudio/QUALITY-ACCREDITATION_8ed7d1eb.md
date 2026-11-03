# Quality Assurance & Accreditation

## Purpose

The Quality & Accreditation module provides a traceable register for accreditation frameworks, institutional standards, review cycles, evidence references, findings and corrective actions. It is intended to help quality officers coordinate review work; it is not a substitute for the institution's approved accreditation policy or external regulator requirements.

## Source status

The source includes a Prisma schema extension, API routes, a React workspace, permission mappings and focused business-rule tests. **The end-to-end workflow is not yet verified** because the package registry was unreachable during development and the repository has no committed baseline Prisma migration. Do not use this module for official accreditation records until schema validation, migration tests, branch-scope tests and workflow E2E tests pass.

## Roles and permissions

| Role | Intended capability |
|---|---|
| Super Administrator | Institution-wide quality administration and independent review |
| Administrator | Institution-wide quality administration and independent review |
| Principal | Quality management and independent review according to college policy |
| Registrar | View quality frameworks/reports; manage only through explicitly granted permissions |
| Quality Assurance Officer | Create/manage frameworks, reviews, evidence, findings and actions within assigned campus; cannot approve their own submissions |
| Other roles | No access unless explicitly granted through the central permission map |

Role permissions are a coarse server-side gate. Route-level checks also enforce campus scope, owner scope and workflow state. A hidden menu item is not an authorization boundary.

## Workflow

### Accreditation framework

1. Authorized quality staff create a framework with a unique code, authority, version and effective dates.
2. Standards are added to the draft framework.
3. The creator submits it for review; at least one standard is required.
4. A different user with the `quality:review` permission approves or rejects it with a reason for rejection.
5. Approved frameworks can be used for reviews and evidence while their effective-date window remains active.
6. A framework cannot be archived while it has active reviews.

### Review cycle

1. Create a review under an approved, currently effective framework.
2. Set a campus, review type, start/due dates and active staff lead.
3. Campus-scoped users can manage only reviews in their assigned campus; institution-wide reviews are reserved for global administrators.
4. The lead moves the review from planned to in progress, records evidence and findings, then submits it for independent review.
5. Approval is restricted to an authorized reviewer who is neither the review creator nor assigned lead.
6. A review cannot close while findings remain unresolved. Findings must be closed or formally accepted as risk under the configured workflow.

### Evidence

1. Create an evidence metadata record and optionally link it to a framework, review, standard and Document Centre record.
2. Linked documents must be approved, unexpired, within the appropriate campus scope and have an access policy suitable for sharing as quality evidence.
3. Owner-only and role-restricted documents cannot be attached as shared quality evidence. This avoids the quality screen becoming a path to disclose private document metadata.
4. Evidence is submitted for independent verification. A submitter cannot verify their own evidence.
5. Change requests and rejection require an explanatory note.

The current form creates evidence metadata; it does not upload new file bytes. Uploads continue to use the Document Centre. Document summaries are returned only when the attached document's access policy and campus scope allow it; evidence rows linked to another campus's document are hidden from non-global users unless they are the document owner or submitter.

### Findings and corrective actions

1. Findings are raised against an in-progress review, optionally linked to a standard, and assigned an active staff owner.
2. Findings include severity, description, root-cause notes, proposed corrective action and due date.
3. Corrective actions have separate owners, due dates and a completion note.
4. Action owners submit actions for review; authorized reviewers who are not the creator/owner verify or reject the action.
5. A finding cannot close until all actions are verified or cancelled and a closure note is recorded.
6. A review cannot close until its findings are closed or formally accepted as risk.

## API surface

Base path: `/api/quality` (all routes require authentication and module permissions).

| Method | Path | Permission / purpose |
|---|---|---|
| GET | `/overview` | `quality:view`; dashboard counts scoped to accessible review work |
| GET | `/branches` | `quality:view`; branches visible in the current scope |
| GET | `/eligible-staff` | `quality:view`; active eligible staff directory, campus-filtered |
| GET/POST | `/frameworks` | View or create frameworks |
| PATCH | `/frameworks/:id` | Update draft/rejected framework |
| POST | `/frameworks/:id/submit` | Submit framework for review |
| POST | `/frameworks/:id/review` | `quality:review`; independent approval/rejection |
| POST | `/frameworks/:id/archive` | Archive only when no active reviews remain |
| GET/POST | `/frameworks/:id/standards` | List/add framework standards |
| PATCH | `/standards/:id` | Update standard while its framework is draft/rejected |
| GET/POST | `/reviews` | List accessible reviews or create a review cycle |
| POST | `/reviews/:id/transition` | Enforce review state transitions and closing requirements |
| GET/POST | `/evidence` | List accessible evidence or create evidence metadata |
| POST | `/evidence/:id/submit` | Submit evidence for independent review |
| POST | `/evidence/:id/review` | `quality:review`; verify, request changes or reject |
| GET | `/standards/:id/evidence` | Evidence mapped to a standard and filtered by scope |
| GET | `/findings` | List findings for accessible reviews |
| POST | `/reviews/:id/findings` | Create finding on an in-progress review |
| POST | `/findings/:id/transition` | Enforce finding state transitions and verification |
| POST | `/findings/:id/actions` | Create corrective action |
| POST | `/actions/:id/transition` | Owner progress/completion and independent verification |

All request bodies are validated with Zod. Sensitive state changes generate audit events. Route response types and Prisma-generated types still need a formal dependency-backed typecheck.

## Data model

- `QualityFramework`: framework register, version, authority, status and effective dates.
- `QualityStandard`: standards belonging to a framework.
- `QualityReview`: scheduled programme/audit/compliance review, campus and lead.
- `QualityEvidence`: metadata and links to approved documents, standards and reviews.
- `QualityFinding`: finding severity, root-cause and closure workflow.
- `QualityAction`: assigned corrective action and independent verification.

New quality workflow enums are added to `apps/api/prisma/schema.prisma`. The `QUALITY_ASSURANCE_OFFICER` role is added to `UserRole` and the central permission map.

## Migration and verification

The repository currently does not contain a committed Prisma migration history. For a new empty database, install dependencies, run `npm run db:validate` and `npm run db:generate`, then generate and review the initial migration from the full schema:

```powershell
npm run db:validate
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name foundation
npm run typecheck
npm test
npm run build
npm run check:cross-platform
```

For an existing database, do not apply a fresh foundation migration blindly. Back up the database, recover and preserve its real migration history, generate a follow-up migration against that baseline and test both upgrade and rollback/recovery procedures in an isolated database.

## Remaining acceptance work

- Run generated-Prisma typechecking and formal schema validation.
- Create and commit reviewed migration history.
- Add database-backed integration tests for every endpoint and permission denial path.
- Test direct-object-ID and cross-campus attacks.
- Add framework/standard mapping to formal programme outcomes and assessment evidence.
- Add exportable evidence packs and approved report templates.
- Add notifications for due dates, review decisions and overdue corrective actions.
- Add retention policy for accreditation records and evidence versions.
- Perform an accessibility review of the web workspace.
- Verify operational backup/restore and audit retention before production use.
