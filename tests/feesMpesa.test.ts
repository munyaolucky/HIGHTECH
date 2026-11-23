import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after, beforeEach } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function installMemoryStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

installMemoryStorage();

const dbFilePath = path.join(process.cwd(), '.data', 'hitech-portal-db.json');
const hadExistingDbFile = fs.existsSync(dbFilePath);
const originalDbFileContents = hadExistingDbFile ? fs.readFileSync(dbFilePath, 'utf8') : null;

const { getDb, saveDb } = await import('../server/data/store.ts');
const { createFinanceModuleSeed } = await import('../server/modules/finance/finance.seed.ts');
const { financeService } = await import('../server/modules/finance/finance.service.ts');
const {
  normalizeKenyanPhoneNumber,
  generateDarajaTimestamp,
  generateDarajaPassword,
  extractCallbackMetadata,
} = await import('../server/modules/finance/mpesa/mpesa.utils.ts');
const { FinanceHttpError } = await import('../server/modules/finance/mpesa/mpesa.validation.ts');

const {
  resolveStudentSectionFromPath,
  STUDENT_SECTION_PATHS,
} = await import('../src/services/studentPortalService.ts');
const { default: StudentSidebar, STUDENT_FEES_SUBMENU_ITEMS } = await import(
  '../src/modules/student/components/StudentSidebar.tsx'
);
const { default: StudentFeesDashboard } = await import(
  '../src/modules/student/fees/pages/StudentFeesDashboard.tsx'
);
const { default: FeeStatementPage } = await import(
  '../src/modules/student/fees/pages/FeeStatementPage.tsx'
);
const { default: FeePaymentPage } = await import(
  '../src/modules/student/fees/pages/FeePaymentPage.tsx'
);
const { default: PaymentHistoryPage } = await import(
  '../src/modules/student/fees/pages/PaymentHistoryPage.tsx'
);
const { default: ReceiptsPage } = await import(
  '../src/modules/student/fees/pages/ReceiptsPage.tsx'
);
const { default: FeeStructurePage } = await import(
  '../src/modules/student/fees/pages/FeeStructurePage.tsx'
);
const { default: PaymentPlansPage } = await import(
  '../src/modules/student/fees/pages/PaymentPlansPage.tsx'
);
const { default: FinancialClearancePage } = await import(
  '../src/modules/student/fees/pages/FinancialClearancePage.tsx'
);
const { default: RefundRequestsPage } = await import(
  '../src/modules/student/fees/pages/RefundRequestsPage.tsx'
);
const { default: FinancePortal } = await import(
  '../src/modules/finance/FinancePortal.tsx'
);
const { ToastProvider } = await import('../src/shared/components/toast/ToastProvider.tsx');
const { AutoSaveToast } = await import('../src/shared/components/auto-save/AutoSaveToast.tsx');

function resetFinanceSlice(): void {
  const db = getDb();
  const seed = createFinanceModuleSeed();
  db.financeStudentAccounts = seed.financeStudentAccounts;
  db.financeLedgerCharges = seed.financeLedgerCharges;
  db.financePayments = seed.financePayments;
  db.mpesaTransactions = seed.mpesaTransactions;
  db.financeReceipts = seed.financeReceipts;
  db.financeFeeStructures = seed.financeFeeStructures;
  db.financePaymentPlans = seed.financePaymentPlans;
  db.financeClearances = seed.financeClearances;
  db.financeRefundRequests = seed.financeRefundRequests;
  db.financeAuditLogs = seed.financeAuditLogs;
  saveDb(db);
}

beforeEach(() => {
  globalThis.localStorage.clear();
  resetFinanceSlice();
});

after(() => {
  if (hadExistingDbFile && originalDbFileContents !== null) {
    fs.writeFileSync(dbFilePath, originalDbFileContents, 'utf8');
  } else if (!hadExistingDbFile && fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
  }
});

function assertNoAntiPatterns(html: string, context: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${context}: must not contain animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${context}: must not contain inline style attributes`);
}

test('M-Pesa Daraja utils validate Kenyan phone numbers, generate base64 password, and parse callback metadata', () => {
  assert.equal(normalizeKenyanPhoneNumber('0712345678'), '254712345678');
  assert.equal(normalizeKenyanPhoneNumber('+254712345678'), '254712345678');
  assert.equal(normalizeKenyanPhoneNumber('254112345678'), '254112345678');
  assert.equal(normalizeKenyanPhoneNumber('0800123456'), null);

  const ts = generateDarajaTimestamp(new Date('2026-11-23T08:30:15Z'));
  assert.match(ts, /^\d{14}$/);
  const pwd = generateDarajaPassword('174379', 'samplepasskey', ts);
  assert.equal(Buffer.from(pwd, 'base64').toString('utf8'), `174379samplepasskey${ts}`);

  const meta = extractCallbackMetadata([
    { Name: 'Amount', Value: 5000 },
    { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
    { Name: 'TransactionDate', Value: 20261123083100 },
    { Name: 'PhoneNumber', Value: 254712345678 },
  ]);
  assert.equal(meta.amount, 5000);
  assert.equal(meta.mpesaReceiptNumber, 'NLJ7RT61SV');
  assert.equal(meta.phoneNumber, '254712345678');
});

test('financeService calculates balances accurately, enforces STK idempotency & no double-credit callbacks, and checks student ownership', async () => {
  const identity = {
    studentId: 'stu-sample-001',
    studentRegNo: 'HCA/STU/2026/001',
    studentName: 'Amina Wanjiku',
  };

  const overview = financeService.getStudentOverview(identity);
  assert.equal(overview.totalFees, 45000);
  assert.equal(overview.totalPaid, 30000);
  assert.equal(overview.outstandingBalance, 15000);
  assert.equal(overview.nextInstalment, 5000);
  assert.equal(overview.progressPercent, 67);

  // Overpayment above balance is rejected with 400
  await assert.rejects(
    () =>
      financeService.initiateMpesaStkPush(
        identity,
        { phoneNumber: '0712345678', amount: 25000 },
        'idem-overpay'
      ),
    (err: unknown) => err instanceof FinanceHttpError && err.statusCode === 400
  );

  // Valid STK push creates PENDING transaction + returns same session on duplicate Idempotency-Key
  const firstPush = await financeService.initiateMpesaStkPush(
    identity,
    { phoneNumber: '0712345678', amount: 5000 },
    'idem-key-001'
  );
  assert.equal(firstPush.reusedIdempotencyKey, false);
  assert.equal(firstPush.payment.status, 'PENDING');

  const secondPush = await financeService.initiateMpesaStkPush(
    identity,
    { phoneNumber: '0712345678', amount: 5000 },
    'idem-key-001'
  );
  assert.equal(secondPush.reusedIdempotencyKey, true);
  assert.equal(secondPush.payment.id, firstPush.payment.id);

  // Daraja callback confirms payment and issues immutable receipt
  const checkoutId = firstPush.mpesaTransaction!.checkoutRequestId;
  const callbackBody = {
    Body: {
      stkCallback: {
        MerchantRequestID: firstPush.mpesaTransaction!.merchantRequestId,
        CheckoutRequestID: checkoutId,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 5000 },
            { Name: 'MpesaReceiptNumber', Value: 'QWE99NEW' },
            { Name: 'TransactionDate', Value: 20261123084500 },
            { Name: 'PhoneNumber', Value: 254712345678 },
          ],
        },
      },
    },
  };

  const firstCb = financeService.processMpesaCallback(callbackBody);
  assert.equal(firstCb.alreadyProcessed, false);
  assert.equal(firstCb.status, 'CONFIRMED');
  assert.ok(firstCb.receipt?.receiptNumber);

  // Duplicate callback must NOT double-credit student balance
  const duplicateCb = financeService.processMpesaCallback(callbackBody);
  assert.equal(duplicateCb.alreadyProcessed, true);

  const afterOverview = financeService.getStudentOverview(identity);
  assert.equal(afterOverview.totalPaid, 35000);
  assert.equal(afterOverview.outstandingBalance, 10000);

  // Other student cannot read first student's payment or receipt
  const otherStudent = {
    studentId: 'stu-other-999',
    studentRegNo: 'HCA/STU/2026/999',
    studentName: 'Other Candidate',
  };
  assert.throws(
    () => financeService.getStudentPaymentById(otherStudent, firstPush.payment.id),
    (err: unknown) => err instanceof FinanceHttpError && err.statusCode === 404
  );

  // Bank deposit submission + Staff verification workflow
  const bankTx = financeService.submitBankReference(identity, {
    bankName: 'KCB Bank Kenya',
    referenceNumber: 'KCB5500112',
    amount: 4000,
    depositedAt: '2026-11-23',
    notes: 'Moi Ave Branch counter slip',
  });
  assert.equal(bankTx.status, 'PENDING');

  const verified = financeService.verifyBankPayment({
    paymentId: bankTx.id,
    decision: 'CONFIRM',
    actor: { id: 'staff-fin-1', name: 'Grace Muthoni', role: 'FINANCE_OFFICER' },
  });
  assert.equal(verified.payment.status, 'CONFIRMED');
  assert.ok(verified.receipt?.receiptNumber);

  const finalOverview = financeService.getStudentOverview(identity);
  assert.equal(finalOverview.totalPaid, 39000);
  assert.equal(finalOverview.outstandingBalance, 6000);
});

test('Fees & Payments routes, StudentSidebar submenu, ToastProvider/AutoSaveToast, and all 9 pages render cleanly via SSR', () => {
  assert.equal(STUDENT_FEES_SUBMENU_ITEMS.length, 9);

  const expectedRoutes: [string, string][] = [
    ['/portal/student/finance', 'finance'],
    ['/portal/student/receipts', 'receipts'],
    ['/portal/student/fees', 'fees-overview'],
    ['/portal/student/fees/statement', 'fees-statement'],
    ['/portal/student/fees/pay', 'fees-pay'],
    ['/portal/student/fees/history', 'fees-history'],
    ['/portal/student/fees/receipts', 'fees-receipts'],
    ['/portal/student/fees/structure', 'fees-structure'],
    ['/portal/student/fees/plans', 'fees-plans'],
    ['/portal/student/fees/clearance', 'fees-clearance'],
    ['/portal/student/fees/refunds', 'fees-refunds'],
  ];

  for (const [pathname, expectedSection] of expectedRoutes) {
    assert.equal(resolveStudentSectionFromPath(pathname), expectedSection);
    assert.equal(
      STUDENT_SECTION_PATHS[expectedSection as keyof typeof STUDENT_SECTION_PATHS],
      pathname
    );
  }

  const sidebarHtml = renderToStaticMarkup(
    React.createElement(StudentSidebar, {
      activePage: 'fees-pay',
      studentName: 'Amina Wanjiku',
      registrationNumber: 'HCA/STU/2026/001',
      sidebarOpen: true,
      sidebarCollapsed: false,
      onToggleCollapse: () => {},
      onCloseMobile: () => {},
      onNavigate: () => {},
      onLogoutClick: () => {},
    })
  );
  assertNoAntiPatterns(sidebarHtml, 'StudentSidebar Fees');
  assert.match(sidebarHtml, /Fees &amp; Payments/);
  for (const item of STUDENT_FEES_SUBMENU_ITEMS) {
    assert.ok(sidebarHtml.includes(item.path), `Sidebar missing Fees path ${item.path}`);
  }

  const feesPages: [string, React.ComponentType<Record<string, unknown>>, RegExp][] = [
    ['StudentFeesDashboard', StudentFeesDashboard, /KES 45,000/],
    ['FeeStatementPage', FeeStatementPage, /Fee Statement/],
    ['FeePaymentPage', FeePaymentPage, /Safaricom M-Pesa Express/],
    ['PaymentHistoryPage', PaymentHistoryPage, /Payment History/],
    ['ReceiptsPage', ReceiptsPage, /Official Receipts/],
    ['FeeStructurePage', FeeStructurePage, /Fee Structure/],
    ['PaymentPlansPage', PaymentPlansPage, /Payment Plans/],
    ['FinancialClearancePage', FinancialClearancePage, /Financial Clearance/],
    ['RefundRequestsPage', RefundRequestsPage, /Refund Requests/],
  ];

  for (const [name, Component, pattern] of feesPages) {
    const html = renderToStaticMarkup(React.createElement(Component, {}));
    assertNoAntiPatterns(html, name);
    assert.match(html, pattern, `${name} did not emit expected content`);
  }

  const staffFinanceHtml = renderToStaticMarkup(React.createElement(FinancePortal, {}));
  assertNoAntiPatterns(staffFinanceHtml, 'FinancePortal');
  assert.match(staffFinanceHtml, /HI-TECH College Finance/);

  const toastWrapHtml = renderToStaticMarkup(
    React.createElement(
      ToastProvider,
      null,
      React.createElement(AutoSaveToast, {
        state: { status: 'saved', lastSavedAt: '2026-11-23T08:30:00.000Z' },
      })
    )
  );
  assertNoAntiPatterns(toastWrapHtml, 'ToastProvider+AutoSaveToast');
  assert.match(toastWrapHtml, /Saved/);
});
