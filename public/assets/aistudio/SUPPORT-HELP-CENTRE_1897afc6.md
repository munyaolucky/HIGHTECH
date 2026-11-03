# Help Centre and General Support Tickets

This module is separate from Student Services/Welfare case management. It is for ordinary account, academic portal, fees workflow, document, e-learning, library, hostel and technical support requests. Do not enter passwords, one-time codes or unnecessary sensitive information in ticket descriptions.

## UI

The `Help Centre` screen includes searchable FAQs, ticket creation, personal ticket history, authorized support queue, ticket replies, status transitions, ticket references and status counts. `Settings` provides browser-scoped appearance preferences and notification preferences saved through the authenticated API. `Feature Catalogue` exposes the broad capability map and labels source modules, prototypes and planned features separately.

## API

All `/api/support` routes require authentication.

- `GET /api/support/overview` — counts scoped to the current user's own tickets or the authorized support queue.
- `GET /api/support/tickets?status=OPEN&limit=50` — user's own tickets or support-team queue.
- `POST /api/support/tickets` — create a ticket with category, subject and description. Priority is assigned by the system; the requester cannot self-assign urgent priority.
- `GET /api/support/tickets/:id` — ticket detail and visible messages; internal notes are removed from non-support responses.
- `POST /api/support/tickets/:id/messages` — add a reply.
- `PATCH /api/support/tickets/:id/status` — support staff only, using explicitly allowed status transitions.
- `PATCH /api/support/tickets/:id/assignee` — support staff only, assigning an active support team member.

Support-manager roles are limited to Super Administrator, Administrator and Student Services Officer. Other staff can create and track their own support tickets but cannot browse the full support queue or internal notes. Student, parent and guest roles cannot administer support tickets. The access policy is coarse role-level authorization; campus-specific restrictions should be added if support teams become campus-scoped.

## Data model

`SupportTicket` contains requester, optional assignee, category, priority, status, subject, description, timestamps and message relations. `SupportTicketMessage` distinguishes public replies from internal notes. Audit events are created for ticket creation, status changes, assignment and replies. Ticket requesters cannot be deleted while tickets exist; preserve records according to the institution's approved retention policy.

## Database migration

For a brand-new, empty database, generate the initial migration from the full current Prisma schema:

```powershell
npm install
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name foundation
```

For a database that already has migration history, do not delete or replace that history. Generate a follow-up migration from the current schema with:

```powershell
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name support_help_centre
```

The ZIP source does not include generated migration files. Run the migration in a development database, inspect the SQL, test ticket access and internal-note privacy, then commit the migration before deployment.

## Verification checklist

- Requesters can only list their own tickets.
- An unrelated user receives not-found for another user's ticket.
- Authorized support staff can view and assign tickets.
- Internal notes are not included in non-staff API responses.
- Closed tickets cannot receive messages until reopened.
- Invalid status transitions are rejected.
- Input length validation and rate limits are active.
- Audit events do not contain ticket descriptions, passwords or one-time codes.
- All endpoints run against the generated Prisma client and a test PostgreSQL database.
