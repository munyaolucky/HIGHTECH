# Finance & Fee Management

This module adds finance models and APIs to the shared platform. The implementation is a development foundation and is **not a live payment gateway**. No M-Pesa STK push, Daraja callback signature validation, bank-statement import, tax compliance workflow or refund payout integration is enabled.

## Included workflows

- Fee categories and service catalogue (tuition, registration, examination, certification, lab, library, hostel and other college-defined charges).
- Versioned service rates scoped by branch, optional program and optional academic period, with currency, billing unit, tax percentage, effective dates, draft/submission/approval/publication status.
- Two-person rate approval: a rate author cannot approve their own rate; only published, currently effective rates are accepted when drafting an invoice.
- Draft invoice creation from one or more published service rates. Invoice lines snapshot service code/name, unit, quantity, unit price, tax and line totals so later fee changes do not rewrite historical invoices.
- Explicit issue and void actions. An invoice with confirmed payments cannot be voided through the normal route.
- Student invoice list, outstanding balance calculation and payment-request creation restricted to the currently authenticated student's own invoices.
- Pending payment ledger. Finance must verify receipt before confirming a payment. Confirmation is transactional and checks the current invoice balance to reduce overpayment from concurrent attempts.
- Discount/waiver/scholarship/credit-note request with separate approval and an outstanding-balance guard.
- Manual reconciliation log. A manually entered reconciliation entry does not prove payment-provider verification.
- Dashboard aggregates and audit records for finance mutations.

## Roles

- `SUPER_ADMIN`, `ADMIN`, and `FINANCE_OFFICER`: service catalog, rate lifecycle, invoices, payment ledger, adjustment requests and reconciliation via `finance:manage`.
- `SUPER_ADMIN`, `ADMIN`, and `PRINCIPAL`: approve or reject rate and adjustment requests. The requester cannot approve their own request.
- `STUDENT`: read only their own non-void invoices and initiate a pending payment request for their own payable invoice.

Parent/guardian statements and sponsorship permissions are not part of this module. Branch scope is checked for rates/invoices, but full row-level campus authorization across every finance endpoint remains a production-hardening requirement.

## API endpoints

All endpoints are mounted at `/api/finance` and require an authenticated account unless stated otherwise.

### Overview and services

- `GET /overview` — counts and financial aggregates; requires `finance:manage`.
- `GET /categories`, `POST /categories` — list/create categories.
- `GET /services?q=...`, `POST /services`, `PATCH /services/:id` — list/create/update services.
- `GET /rates?status=...&branchId=...` — list rates.
- `POST /services/:id/rates` — create a new draft rate version.
- `POST /rates/:id/submit` — submit draft for approval.
- `POST /rates/:id/approve` with `{ "decision": "APPROVE" | "REJECT", "note": "..." }` — reviewer action.
- `POST /rates/:id/publish` — publish an approved rate if its effective window does not conflict with a published rate in the same scope/currency.
- `POST /rates/:id/retire` — retire a published rate.

### Invoices and adjustments

- `GET /invoices?q=...&status=...&studentId=...&branchId=...` — finance invoice ledger.
- `GET /me/invoices` — the authenticated student's own invoices only.
- `POST /invoices` — create a draft invoice from published rates. Body: `studentId`, `branchId`, optional `academicPeriodId`, `currencyCode`, optional `dueAt` / `notes`, and `lines: [{ serviceRateId, quantity }]`.
- `POST /invoices/:id/issue` — issue a non-empty draft invoice.
- `POST /invoices/:id/void` with `{ "reason": "..." }` — void only when no confirmed payments exist.
- `POST /invoices/:id/adjustments` with `{ "type": "DISCOUNT" | "WAIVER" | "SCHOLARSHIP" | "CREDIT_NOTE", "amount": 250, "reason": "..." }` — request an adjustment.
- `GET /adjustments` — list requests for Finance.
- `POST /adjustments/:id/review` with `{ "decision": "APPROVE" | "REJECT", "note": "..." }` — separate approval. Approval updates the invoice's discount total and status without rewriting invoice line snapshots.

### Payments and reconciliation

- `GET /payments?status=...&invoiceId=...` — Finance payment ledger.
- `POST /payments` — create a `PENDING` payment record. Body: `invoiceId`, `amount`, `method`, unique `idempotencyKey`, optional `provider` and `externalReference`.
- `POST /payments/:id/confirm` — Finance confirmation after checking actual funds; supports optional provider reference and transaction currency/exchange rate metadata.
- `POST /payments/:id/fail` — mark an unconfirmed pending attempt failed with a reason.
- `POST /payments/:id/reconciliation` — record a manual statement comparison.
- `GET /reconciliation?status=...` — list reconciliation history.

Currency is stored explicitly on rates, invoices and payment records. Invoice currency is not silently changed based on a user's location. If foreign-currency payments are later accepted, configure and preserve the source transaction currency, conversion rate, and institution-approved accounting currency policy.

## Local migration and verification

If using the latest project against a **brand-new** PostgreSQL database, run the normal foundation migration command from `README.md`. If earlier schema changes have already been migrated locally, preserve their `apps/api/prisma/migrations` directory and create a **new** migration:

```powershell
npm install
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name finance_fee_management
npm run typecheck
npm test
npm run build
```

Do not delete or regenerate migration history on a database that contains data. Commit generated migrations before deploying to shared environments.

## Before production

1. Integrate M-Pesa Daraja server-side STK push and validate the provider's callback authenticity. Keep idempotency/replay protection and reconcile callback events before confirmation.
2. Add payment event inbox records with unique provider event IDs, retries and reconciliation for callback delivery.
3. Add refund/chargeback workflows and accounting journal entries; do not reverse a confirmed payment just by editing its status.
4. Add campus-scoped finance permissions, approval thresholds, audit review, maker/checker enforcement, and export controls.
5. Have Finance approve currency, rounding, tax, credit-note, waiver, refund and overdue-invoice policies before use with real student accounts.
6. Run full schema validation, generated-client typecheck, migration tests, API integration tests and backup/restore drills against a disposable test database.
