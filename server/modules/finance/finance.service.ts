import crypto from 'node:crypto';
import {
  allocateFinanceReceiptNumber,
  getDb,
  saveDb,
  type PortalDatabase,
} from '../../data/store.ts';
import type {
  FinanceClearanceRecord,
  FinancePaymentPlanRecord,
  FinancePaymentRecord,
  FinanceReceiptRecord,
  FinanceRefundRequestRecord,
  FinanceStudentAccountRecord,
  MpesaTransactionRecord,
} from './finance.types.ts';
import { mpesaService } from './mpesa/mpesa.service.ts';
import { extractCallbackMetadata } from './mpesa/mpesa.utils.ts';
import {
  FinanceHttpError,
  validateBankReferenceInput,
  validateDarajaCallbackPayload,
  validatePaymentPlanRequestInput,
  validateRefundRequestInput,
  validateStkPushInput,
} from './mpesa/mpesa.validation.ts';

export interface FinanceStudentIdentity {
  studentId: string;
  studentRegNo: string;
  studentName: string;
  programme?: string;
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function appendFinanceAudit(
  db: PortalDatabase,
  actor: { id: string; name: string; role: string },
  action: string,
  detail: string,
  studentRegNo?: string
) {
  db.financeAuditLogs.unshift({
    id: createId('FINAUD'),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    studentRegNo,
    action,
    detail,
    createdAt: new Date().toISOString(),
  });
  if (db.financeAuditLogs.length > 500) {
    db.financeAuditLogs.length = 500;
  }
}

function ensureStudentAccount(
  db: PortalDatabase,
  identity: FinanceStudentIdentity
): FinanceStudentAccountRecord {
  const existing = db.financeStudentAccounts.find(
    (a) =>
      a.studentId === identity.studentId ||
      a.studentRegNo.toUpperCase() === identity.studentRegNo.toUpperCase()
  );
  if (existing) return existing;

  const account: FinanceStudentAccountRecord = {
    studentId: identity.studentId,
    studentRegNo: identity.studentRegNo,
    studentName: identity.studentName,
    programme: identity.programme || 'BSc. Computer Science',
    academicYear: '2026',
    termLabel: 'Academic Year 2026 · Semester 1',
    totalFees: 45000,
    nextInstalmentAmount: 15000,
    nextInstalmentDueDate: '2026-12-05',
    sponsorshipStatus: 'Self-Sponsored',
    updatedAt: new Date().toISOString(),
  };
  db.financeStudentAccounts.push(account);
  return account;
}

function computeAccountTotals(db: PortalDatabase, account: FinanceStudentAccountRecord) {
  const charges = db.financeLedgerCharges.filter(
    (c) =>
      c.studentId === account.studentId ||
      c.studentRegNo.toUpperCase() === account.studentRegNo.toUpperCase()
  );
  const chargeSum =
    charges.length > 0
      ? charges.reduce((sum, item) => sum + item.amount, 0)
      : account.totalFees;

  const payments = db.financePayments
    .filter(
      (p) =>
        p.studentId === account.studentId ||
        p.studentRegNo.toUpperCase() === account.studentRegNo.toUpperCase()
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalPaid = payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalFees = Math.max(0, chargeSum);
  const outstandingBalance = Math.max(0, totalFees - totalPaid);
  const progressPercent =
    totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 100;
  const nextInstalment =
    outstandingBalance === 0
      ? 0
      : Math.min(outstandingBalance, account.nextInstalmentAmount || outstandingBalance);

  return {
    totalFees,
    totalPaid,
    outstandingBalance,
    nextInstalment,
    progressPercent,
    charges,
    payments,
  };
}

function refreshClearanceStatuses(
  db: PortalDatabase,
  account: FinanceStudentAccountRecord,
  progressPercent: number,
  outstandingBalance: number
): FinanceClearanceRecord[] {
  const existing = db.financeClearances.filter(
    (c) =>
      c.studentId === account.studentId ||
      c.studentRegNo.toUpperCase() === account.studentRegNo.toUpperCase()
  );
  const nowIso = new Date().toISOString();

  if (existing.length === 0) {
    const defaults: FinanceClearanceRecord[] = [
      {
        id: createId('FCLR'),
        studentId: account.studentId,
        studentRegNo: account.studentRegNo,
        category: 'REGISTRATION',
        label: 'Semester Unit Registration Clearance',
        thresholdPercent: 40,
        status: progressPercent >= 40 ? 'CLEARED' : 'HOLD',
        requirementNote:
          progressPercent >= 40
            ? `Minimum 40% fee requirement satisfied (${progressPercent}% paid).`
            : `Requires 40% minimum fee payment (${progressPercent}% paid).`,
        checkedAt: nowIso,
        checkedBy: 'Automated Finance Ledger',
      },
      {
        id: createId('FCLR'),
        studentId: account.studentId,
        studentRegNo: account.studentRegNo,
        category: 'EXAMINATION',
        label: 'Mid-Term CATs & Final Examination Permit',
        thresholdPercent: 75,
        status:
          outstandingBalance === 0
            ? 'CLEARED'
            : progressPercent >= 75
            ? 'PROVISIONAL'
            : 'HOLD',
        requirementNote:
          outstandingBalance === 0
            ? '100% fees settled — eligible for stamped Final Examination Card.'
            : `${progressPercent}% paid — KES ${outstandingBalance.toLocaleString()} outstanding.`,
        checkedAt: nowIso,
        checkedBy: 'Automated Finance Ledger',
      },
      {
        id: createId('FCLR'),
        studentId: account.studentId,
        studentRegNo: account.studentRegNo,
        category: 'GRADUATION',
        label: 'Final Transcript & Graduation Financial Clearance',
        thresholdPercent: 100,
        status: outstandingBalance === 0 ? 'CLEARED' : 'PENDING',
        requirementNote:
          outstandingBalance === 0
            ? 'Zero balance verified.'
            : 'Requires 100% settlement of all tuition & examination fees.',
        checkedAt: nowIso,
        checkedBy: 'Automated Finance Ledger',
      },
    ];
    db.financeClearances.push(...defaults);
    return defaults;
  }

  for (const clr of existing) {
    clr.checkedAt = nowIso;
    if (clr.category === 'REGISTRATION') {
      clr.status = progressPercent >= 40 ? 'CLEARED' : 'HOLD';
      clr.requirementNote =
        progressPercent >= 40
          ? `Minimum 40% fee payment met (${progressPercent}% paid).`
          : `Requires at least 40% fee settlement (${progressPercent}% paid).`;
    } else if (clr.category === 'EXAMINATION') {
      if (outstandingBalance === 0) {
        clr.status = 'CLEARED';
        clr.requirementNote = '100% fees settled — Final Examination Card unlocked.';
      } else if (progressPercent >= 75) {
        clr.status = 'PROVISIONAL';
        clr.requirementNote = `${progressPercent}% paid (CAT threshold cleared). Clear KES ${outstandingBalance.toLocaleString()} for final exams.`;
      } else {
        clr.status = 'PROVISIONAL';
        clr.requirementNote = `${progressPercent}% paid — pay KES ${Math.max(
          0,
          Math.ceil(account.totalFees * 0.75) - Math.round((account.totalFees * progressPercent) / 100)
        ).toLocaleString()}+ to reach 75% CAT threshold.`;
      }
    } else if (clr.category === 'GRADUATION') {
      clr.status = outstandingBalance === 0 ? 'CLEARED' : 'PENDING';
      clr.requirementNote =
        outstandingBalance === 0
          ? '100% settled — ready for transcript & graduation clearance.'
          : 'Requires 100% settlement of all academic & graduation fees.';
    }
  }

  return existing;
}

function confirmPaymentAndIssueReceipt(
  db: PortalDatabase,
  payment: FinancePaymentRecord,
  receiptRef: string,
  actor: { id: string; name: string; role: string }
): FinanceReceiptRecord {
  const existingReceipt = db.financeReceipts.find((r) => r.paymentId === payment.id);
  if (existingReceipt) return existingReceipt;

  const account = db.financeStudentAccounts.find(
    (a) =>
      a.studentId === payment.studentId ||
      a.studentRegNo.toUpperCase() === payment.studentRegNo.toUpperCase()
  );

  const nowIso = new Date().toISOString();
  const receiptNumber = allocateFinanceReceiptNumber(db);
  const verificationCode = `VRF-${receiptRef.slice(-8).toUpperCase()}-${receiptNumber.slice(-2)}`;

  const receipt: FinanceReceiptRecord = {
    id: createId('RCT'),
    receiptNumber,
    paymentId: payment.id,
    studentId: payment.studentId,
    studentRegNo: payment.studentRegNo,
    studentName: payment.studentName,
    programme: account?.programme || 'BSc. Computer Science',
    academicYear: account?.academicYear || '2026',
    termLabel: account?.termLabel || 'Semester 1 (2026)',
    method: payment.method,
    referenceNumber: receiptRef,
    amount: payment.amount,
    description: payment.description,
    verificationCode,
    issuedAt: nowIso,
  };

  payment.status = 'CONFIRMED';
  payment.referenceNumber = receiptRef;
  payment.receiptId = receipt.id;
  payment.receiptNumber = receipt.receiptNumber;
  payment.paidAt = nowIso;
  payment.updatedAt = nowIso;

  db.financeReceipts.unshift(receipt);
  appendFinanceAudit(
    db,
    actor,
    'PAYMENT_CONFIRMED_RECEIPT_ISSUED',
    `Confirmed KES ${payment.amount.toLocaleString()} (${payment.method} · ${receiptRef}) -> ${receipt.receiptNumber}.`,
    payment.studentRegNo
  );

  if (account) {
    const totals = computeAccountTotals(db, account);
    refreshClearanceStatuses(db, account, totals.progressPercent, totals.outstandingBalance);
  }

  return receipt;
}

export const financeService = {
  getStudentOverview(identity: FinanceStudentIdentity) {
    const db = getDb();
    const account = ensureStudentAccount(db, identity);
    const totals = computeAccountTotals(db, account);
    const clearances = refreshClearanceStatuses(
      db,
      account,
      totals.progressPercent,
      totals.outstandingBalance
    );
    const examClearance = clearances.find((c) => c.category === 'EXAMINATION') ?? clearances[0];

    return {
      account,
      totalFees: totals.totalFees,
      totalPaid: totals.totalPaid,
      outstandingBalance: totals.outstandingBalance,
      nextInstalment: totals.nextInstalment,
      nextInstalmentDueDate: account.nextInstalmentDueDate,
      progressPercent: totals.progressPercent,
      clearanceStatus: examClearance?.status ?? 'PENDING',
      recentTransactions: totals.payments.slice(0, 6),
    };
  },

  getStudentStatement(identity: FinanceStudentIdentity, termFilter?: string) {
    const db = getDb();
    const account = ensureStudentAccount(db, identity);
    const totals = computeAccountTotals(db, account);

    const charges = termFilter
      ? totals.charges.filter((c) =>
          c.termLabel.toLowerCase().includes(termFilter.trim().toLowerCase())
        )
      : totals.charges;

    const confirmedPayments = totals.payments.filter((p) => p.status === 'CONFIRMED');

    type StatementRow = {
      id: string;
      date: string;
      reference: string;
      description: string;
      entryType: 'CHARGE' | 'PAYMENT' | 'CREDIT';
      debit: number;
      credit: number;
      runningBalance: number;
    };

    const rawRows: Omit<StatementRow, 'runningBalance'>[] = [
      ...charges.map((c) => ({
        id: c.id,
        date: c.postedAt,
        reference: c.id,
        description: c.description,
        entryType: (c.amount < 0 ? 'CREDIT' : 'CHARGE') as 'CHARGE' | 'CREDIT',
        debit: c.amount > 0 ? c.amount : 0,
        credit: c.amount < 0 ? Math.abs(c.amount) : 0,
      })),
      ...confirmedPayments.map((p) => ({
        id: p.id,
        date: p.paidAt || p.createdAt,
        reference: p.receiptNumber || p.referenceNumber,
        description: `${p.description} (${p.channelLabel})`,
        entryType: 'PAYMENT' as const,
        debit: 0,
        credit: p.amount,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    let running = 0;
    const entries: StatementRow[] = rawRows.map((row) => {
      running = Math.max(0, running + row.debit - row.credit);
      return { ...row, runningBalance: running };
    });

    return {
      account,
      totalFees: totals.totalFees,
      totalPaid: totals.totalPaid,
      outstandingBalance: totals.outstandingBalance,
      entries,
    };
  },

  listStudentPayments(
    identity: FinanceStudentIdentity,
    filters?: { status?: string; method?: string; search?: string }
  ) {
    const db = getDb();
    const account = ensureStudentAccount(db, identity);
    const totals = computeAccountTotals(db, account);
    const q = (filters?.search ?? '').trim().toLowerCase();

    const items = totals.payments.filter((p) => {
      if (filters?.status && filters.status !== 'ALL' && p.status !== filters.status) {
        return false;
      }
      if (filters?.method && filters.method !== 'ALL' && p.method !== filters.method) {
        return false;
      }
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q) ||
        (p.receiptNumber ?? '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });

    return items.map((p) => {
      const mpesa = db.mpesaTransactions.find((m) => m.paymentId === p.id);
      return {
        ...p,
        checkoutRequestId: mpesa?.checkoutRequestId,
        mpesaReceiptNumber: mpesa?.mpesaReceiptNumber,
        resultDesc: mpesa?.resultDesc,
      };
    });
  },

  getStudentPaymentById(identity: FinanceStudentIdentity, paymentId: string) {
    const db = getDb();
    const payment = db.financePayments.find(
      (p) =>
        p.id === paymentId &&
        (p.studentId === identity.studentId ||
          p.studentRegNo.toUpperCase() === identity.studentRegNo.toUpperCase())
    );
    if (!payment) {
      throw new FinanceHttpError(404, 'Payment record not found.');
    }
    const mpesa = db.mpesaTransactions.find((m) => m.paymentId === payment.id);
    const receipt = payment.receiptId
      ? db.financeReceipts.find((r) => r.id === payment.receiptId)
      : undefined;
    return { payment, mpesa, receipt };
  },

  async initiateMpesaStkPush(
    identity: FinanceStudentIdentity,
    body: unknown,
    idempotencyKeyHeader?: string
  ) {
    const { phoneNumber, amount, idempotencyKey } = validateStkPushInput(
      body,
      idempotencyKeyHeader
    );

    const db = getDb();
    const account = ensureStudentAccount(db, identity);
    const totals = computeAccountTotals(db, account);

    // Idempotency return for same key belonging to this student
    const existingByKey = db.financePayments.find(
      (p) =>
        p.idempotencyKey === idempotencyKey &&
        (p.studentId === account.studentId ||
          p.studentRegNo.toUpperCase() === account.studentRegNo.toUpperCase())
    );
    if (existingByKey) {
      const existingMpesa = db.mpesaTransactions.find(
        (m) => m.paymentId === existingByKey.id
      );
      return {
        payment: existingByKey,
        mpesaTransaction: existingMpesa,
        customerMessage:
          existingMpesa?.resultDesc || 'Existing M-Pesa STK request returned idempotently.',
        reusedIdempotencyKey: true,
      };
    }

    if (totals.outstandingBalance <= 0) {
      throw new FinanceHttpError(409, 'Your fee balance is already settled in full (KES 0).');
    }
    if (amount > totals.outstandingBalance) {
      throw new FinanceHttpError(
        400,
        `Payment amount KES ${amount.toLocaleString()} exceeds your outstanding fee balance of KES ${totals.outstandingBalance.toLocaleString()}.`
      );
    }

    const stk = await mpesaService.initiateStkPush({
      phoneNumber,
      amount,
      accountReference: account.studentRegNo,
      transactionDesc: 'College Fee',
    });

    const nowIso = new Date().toISOString();
    const paymentId = createId('TX');

    const payment: FinancePaymentRecord = {
      id: paymentId,
      studentId: account.studentId,
      studentRegNo: account.studentRegNo,
      studentName: account.studentName,
      method: 'MPESA',
      channelLabel: 'M-Pesa STK Push',
      referenceNumber: stk.checkoutRequestId,
      idempotencyKey,
      phoneNumber,
      amount,
      status: 'PENDING',
      description: `Fee payment — M-Pesa STK Push (${phoneNumber})`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const mpesaTx: MpesaTransactionRecord = {
      id: createId('MPESA'),
      paymentId,
      studentId: account.studentId,
      studentRegNo: account.studentRegNo,
      phoneNumber,
      amount,
      accountReference: account.studentRegNo,
      transactionDesc: 'College Fee Payment',
      merchantRequestId: stk.merchantRequestId,
      checkoutRequestId: stk.checkoutRequestId,
      status: 'PENDING',
      mode: stk.mode,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.financePayments.unshift(payment);
    db.mpesaTransactions.unshift(mpesaTx);
    appendFinanceAudit(
      db,
      { id: account.studentId, name: account.studentName, role: 'STUDENT' },
      'MPESA_STK_INITIATED',
      `Initiated KES ${amount.toLocaleString()} M-Pesa STK Push (${stk.mode}) to ${phoneNumber}.`,
      account.studentRegNo
    );
    saveDb(db);

    return {
      payment,
      mpesaTransaction: mpesaTx,
      customerMessage: stk.customerMessage,
      reusedIdempotencyKey: false,
    };
  },

  processMpesaCallback(body: unknown) {
    const parsed = validateDarajaCallbackPayload(body);
    const db = getDb();

    const mpesaTx = db.mpesaTransactions.find(
      (m) => m.checkoutRequestId === parsed.checkoutRequestId
    );
    if (!mpesaTx) {
      // Acknowledge cleanly so Safaricom Daraja does not retry unknown synthetic tests infinitely,
      // while reporting not-matched for audit logs
      return { processed: false, status: 'NOT_FOUND', checkoutRequestId: parsed.checkoutRequestId };
    }

    const payment = db.financePayments.find((p) => p.id === mpesaTx.paymentId);
    if (!payment) {
      throw new FinanceHttpError(404, 'Linked fee payment record not found.');
    }

    // Strict idempotency guard: never credit a ledger twice for the same M-Pesa CheckoutRequestID
    if (mpesaTx.status === 'CONFIRMED' || payment.status === 'CONFIRMED') {
      const receipt = db.financeReceipts.find((r) => r.paymentId === payment.id);
      return {
        processed: true,
        alreadyProcessed: true,
        status: payment.status,
        payment,
        receipt,
      };
    }

    const nowIso = new Date().toISOString();
    mpesaTx.callbackReceivedAt = nowIso;
    mpesaTx.resultCode = parsed.resultCode;
    mpesaTx.resultDesc = parsed.resultDesc;
    mpesaTx.rawCallback = body;
    mpesaTx.updatedAt = nowIso;

    if (parsed.resultCode === 0) {
      const meta = extractCallbackMetadata(parsed.callbackItems);
      const receiptNumberMpesa =
        meta.mpesaReceiptNumber ||
        `MP${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Guard against duplicate M-Pesa receipt replay across distinct CheckoutRequestIDs
      const duplicateReceipt = db.mpesaTransactions.find(
        (m) =>
          m.id !== mpesaTx.id &&
          m.mpesaReceiptNumber &&
          m.mpesaReceiptNumber === receiptNumberMpesa
      );
      if (duplicateReceipt) {
        throw new FinanceHttpError(409, 'Duplicate M-Pesa receipt number already settled.');
      }

      if (meta.amount !== undefined && meta.amount > 0) {
        payment.amount = Math.round(meta.amount);
        mpesaTx.amount = payment.amount;
      }

      mpesaTx.mpesaReceiptNumber = receiptNumberMpesa;
      mpesaTx.transactionDate = meta.transactionDate || nowIso;
      mpesaTx.status = 'CONFIRMED';

      const receipt = confirmPaymentAndIssueReceipt(db, payment, receiptNumberMpesa, {
        id: 'system-mpesa-callback',
        name: 'Safaricom Daraja Callback',
        role: 'SYSTEM',
      });
      saveDb(db);

      return {
        processed: true,
        alreadyProcessed: false,
        status: 'CONFIRMED',
        payment,
        receipt,
      };
    }

    const isCancelled = parsed.resultCode === 1032;
    mpesaTx.status = isCancelled ? 'CANCELLED' : 'FAILED';
    payment.status = isCancelled ? 'CANCELLED' : 'FAILED';
    payment.failureReason = parsed.resultDesc;
    payment.updatedAt = nowIso;

    appendFinanceAudit(
      db,
      { id: 'system-mpesa-callback', name: 'Safaricom Daraja Callback', role: 'SYSTEM' },
      isCancelled ? 'MPESA_STK_CANCELLED' : 'MPESA_STK_FAILED',
      `Checkout ${mpesaTx.checkoutRequestId} ended with code ${parsed.resultCode}: ${parsed.resultDesc}.`,
      payment.studentRegNo
    );
    saveDb(db);

    return {
      processed: true,
      alreadyProcessed: false,
      status: payment.status,
      payment,
    };
  },

  completeSandboxStkPayment(
    identity: FinanceStudentIdentity,
    paymentId: string,
    outcome: 'SUCCESS' | 'CANCELLED' | 'FAILED' = 'SUCCESS'
  ) {
    const db = getDb();
    const payment = db.financePayments.find(
      (p) =>
        p.id === paymentId &&
        (p.studentId === identity.studentId ||
          p.studentRegNo.toUpperCase() === identity.studentRegNo.toUpperCase())
    );
    if (!payment) {
      throw new FinanceHttpError(404, 'M-Pesa payment session not found.');
    }
    const mpesaTx = db.mpesaTransactions.find((m) => m.paymentId === payment.id);
    if (!mpesaTx) {
      throw new FinanceHttpError(404, 'M-Pesa transaction metadata not found.');
    }

    if (mpesaTx.mode !== 'SANDBOX_SIMULATOR') {
      throw new FinanceHttpError(
        409,
        'Live Daraja transactions can only be settled by Safaricom callback.'
      );
    }

    const fakeCode = `Q${crypto.randomBytes(4).toString('hex').toUpperCase()}`.slice(0, 10);
    const callbackPayload =
      outcome === 'SUCCESS'
        ? {
            Body: {
              stkCallback: {
                MerchantRequestID: mpesaTx.merchantRequestId,
                CheckoutRequestID: mpesaTx.checkoutRequestId,
                ResultCode: 0,
                ResultDesc: 'The service request is processed successfully.',
                CallbackMetadata: {
                  Item: [
                    { Name: 'Amount', Value: payment.amount },
                    { Name: 'MpesaReceiptNumber', Value: fakeCode },
                    { Name: 'TransactionDate', Value: Date.now().toString() },
                    { Name: 'PhoneNumber', Value: mpesaTx.phoneNumber },
                  ],
                },
              },
            },
          }
        : {
            Body: {
              stkCallback: {
                MerchantRequestID: mpesaTx.merchantRequestId,
                CheckoutRequestID: mpesaTx.checkoutRequestId,
                ResultCode: outcome === 'CANCELLED' ? 1032 : 1037,
                ResultDesc:
                  outcome === 'CANCELLED'
                    ? 'Request cancelled by user.'
                    : 'DS timeout user cannot be reached.',
              },
            },
          };

    return this.processMpesaCallback(callbackPayload);
  },

  submitBankReference(identity: FinanceStudentIdentity, body: unknown) {
    const input = validateBankReferenceInput(body);
    const db = getDb();
    const account = ensureStudentAccount(db, identity);

    const dupRef = db.financePayments.find(
      (p) =>
        p.method === 'BANK' &&
        p.referenceNumber.toUpperCase() === input.referenceNumber.toUpperCase() &&
        p.status !== 'FAILED' &&
        p.status !== 'CANCELLED'
    );
    if (dupRef) {
      throw new FinanceHttpError(
        409,
        `Bank reference ${input.referenceNumber} has already been submitted.`
      );
    }

    const nowIso = new Date().toISOString();
    const payment: FinancePaymentRecord = {
      id: createId('TX'),
      studentId: account.studentId,
      studentRegNo: account.studentRegNo,
      studentName: account.studentName,
      method: 'BANK',
      channelLabel: `${input.bankName} Deposit`,
      bankName: input.bankName,
      referenceNumber: input.referenceNumber,
      amount: input.amount,
      status: 'PENDING',
      description: input.notes
        ? `Bank deposit (${input.bankName} · ${input.depositedAt}): ${input.notes}`
        : `Bank deposit / EFT (${input.bankName} · ${input.depositedAt})`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.financePayments.unshift(payment);
    appendFinanceAudit(
      db,
      { id: account.studentId, name: account.studentName, role: 'STUDENT' },
      'BANK_REFERENCE_SUBMITTED',
      `Submitted ${input.bankName} deposit ref ${input.referenceNumber} for KES ${input.amount.toLocaleString()} (awaiting Finance verification).`,
      account.studentRegNo
    );
    saveDb(db);

    return payment;
  },

  listStudentReceipts(identity: FinanceStudentIdentity) {
    const db = getDb();
    ensureStudentAccount(db, identity);
    return db.financeReceipts
      .filter(
        (r) =>
          r.studentId === identity.studentId ||
          r.studentRegNo.toUpperCase() === identity.studentRegNo.toUpperCase()
      )
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  },

  getStudentReceipt(identity: FinanceStudentIdentity, receiptId: string) {
    const db = getDb();
    const receipt = db.financeReceipts.find(
      (r) =>
        (r.id === receiptId || r.receiptNumber === receiptId) &&
        (r.studentId === identity.studentId ||
          r.studentRegNo.toUpperCase() === identity.studentRegNo.toUpperCase())
    );
    if (!receipt) {
      throw new FinanceHttpError(404, 'Receipt not found.');
    }
    return receipt;
  },

  listFeeStructures(programmeCode?: string) {
    const db = getDb();
    if (!programmeCode) return db.financeFeeStructures;
    return db.financeFeeStructures.filter((s) =>
      s.programmeCode.toLowerCase().includes(programmeCode.trim().toLowerCase())
    );
  },

  getPaymentPlans(identity: FinanceStudentIdentity) {
    const db = getDb();
    ensureStudentAccount(db, identity);
    return db.financePaymentPlans.filter(
      (p) =>
        p.studentId === identity.studentId ||
        p.studentRegNo.toUpperCase() === identity.studentRegNo.toUpperCase()
    );
  },

  requestPaymentPlan(identity: FinanceStudentIdentity, body: unknown) {
    const { instalmentCount, requestedNotes } = validatePaymentPlanRequestInput(body);
    const db = getDb();
    const account = ensureStudentAccount(db, identity);
    const totals = computeAccountTotals(db, account);

    if (totals.outstandingBalance <= 0) {
      throw new FinanceHttpError(409, 'You have no outstanding fee balance requiring a payment plan.');
    }

    const baseAmount = Math.floor(totals.outstandingBalance / instalmentCount);
    const remainder = totals.outstandingBalance - baseAmount * instalmentCount;
    const now = Date.now();
    const instalments = Array.from({ length: instalmentCount }, (_, idx) => ({
      id: createId('INST'),
      label: `Requested Instalment ${idx + 1} of ${instalmentCount}`,
      dueDate: new Date(now + (idx + 1) * 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      amount: idx === instalmentCount - 1 ? baseAmount + remainder : baseAmount,
      paidAmount: 0,
      status: 'UPCOMING' as const,
    }));

    const nowIso = new Date().toISOString();
    const plan: FinancePaymentPlanRecord = {
      id: createId('FPLAN'),
      studentId: account.studentId,
      studentRegNo: account.studentRegNo,
      studentName: account.studentName,
      termLabel: account.termLabel,
      totalCoveredAmount: totals.outstandingBalance,
      instalments,
      status: 'PENDING_APPROVAL',
      requestedNotes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.financePaymentPlans.unshift(plan);
    appendFinanceAudit(
      db,
      { id: account.studentId, name: account.studentName, role: 'STUDENT' },
      'PAYMENT_PLAN_REQUESTED',
      `Requested ${instalmentCount}-instalment plan covering KES ${totals.outstandingBalance.toLocaleString()}.`,
      account.studentRegNo
    );
    saveDb(db);
    return plan;
  },

  getFinancialClearance(identity: FinanceStudentIdentity) {
    const db = getDb();
    const account = ensureStudentAccount(db, identity);
    const totals = computeAccountTotals(db, account);
    const items = refreshClearanceStatuses(
      db,
      account,
      totals.progressPercent,
      totals.outstandingBalance
    );
    saveDb(db);

    return {
      progressPercent: totals.progressPercent,
      outstandingBalance: totals.outstandingBalance,
      totalFees: totals.totalFees,
      totalPaid: totals.totalPaid,
      items,
    };
  },

  listRefundRequests(identity: FinanceStudentIdentity) {
    const db = getDb();
    ensureStudentAccount(db, identity);
    return db.financeRefundRequests
      .filter(
        (r) =>
          r.studentId === identity.studentId ||
          r.studentRegNo.toUpperCase() === identity.studentRegNo.toUpperCase()
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  submitRefundRequest(identity: FinanceStudentIdentity, body: unknown) {
    const input = validateRefundRequestInput(body);
    const db = getDb();
    const account = ensureStudentAccount(db, identity);
    const totals = computeAccountTotals(db, account);

    if (input.amount > totals.totalPaid) {
      throw new FinanceHttpError(
        400,
        `Requested refund KES ${input.amount.toLocaleString()} exceeds verified paid fees (KES ${totals.totalPaid.toLocaleString()}).`
      );
    }

    const nowIso = new Date().toISOString();
    const refund: FinanceRefundRequestRecord = {
      id: createId('RFD'),
      studentId: account.studentId,
      studentRegNo: account.studentRegNo,
      studentName: account.studentName,
      amount: input.amount,
      reason: input.reason,
      payoutChannel: input.payoutChannel,
      payoutAccount: input.payoutAccount,
      supportingReference: input.supportingReference,
      status: 'PENDING',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.financeRefundRequests.unshift(refund);
    appendFinanceAudit(
      db,
      { id: account.studentId, name: account.studentName, role: 'STUDENT' },
      'REFUND_REQUEST_SUBMITTED',
      `Submitted refund request ${refund.id} for KES ${input.amount.toLocaleString()} via ${input.payoutChannel}.`,
      account.studentRegNo
    );
    saveDb(db);
    return refund;
  },

  // =========================================================================
  // STAFF FINANCE OFFICER / ACCOUNTS OPERATIONS
  // =========================================================================

  getStaffFinanceDashboard() {
    const db = getDb();
    const totalCollections = db.financePayments
      .filter((p) => p.status === 'CONFIRMED')
      .reduce((sum, p) => sum + p.amount, 0);

    const accountsWithTotals = db.financeStudentAccounts.map((acc) => {
      const totals = computeAccountTotals(db, acc);
      return {
        ...acc,
        totalFees: totals.totalFees,
        totalPaid: totals.totalPaid,
        outstandingBalance: totals.outstandingBalance,
        progressPercent: totals.progressPercent,
      };
    });

    const totalOutstanding = accountsWithTotals.reduce(
      (sum, acc) => sum + acc.outstandingBalance,
      0
    );

    return {
      metrics: {
        totalCollections,
        totalOutstanding,
        confirmedReceipts: db.financeReceipts.length,
        pendingBankVerifications: db.financePayments.filter(
          (p) => p.method === 'BANK' && p.status === 'PENDING'
        ).length,
        pendingMpesaCallbacks: db.mpesaTransactions.filter((m) => m.status === 'PENDING')
          .length,
        pendingPlans: db.financePaymentPlans.filter((p) => p.status === 'PENDING_APPROVAL')
          .length,
        pendingRefunds: db.financeRefundRequests.filter((r) => r.status === 'PENDING')
          .length,
      },
      studentAccounts: accountsWithTotals,
      payments: db.financePayments,
      mpesaTransactions: db.mpesaTransactions,
      receipts: db.financeReceipts,
      feeStructures: db.financeFeeStructures,
      paymentPlans: db.financePaymentPlans,
      refundRequests: db.financeRefundRequests,
      auditLogs: db.financeAuditLogs.slice(0, 120),
    };
  },

  verifyBankPayment(input: {
    paymentId: string;
    decision: 'CONFIRM' | 'REJECT';
    notes?: string;
    actor: { id: string; name: string; role: string };
  }) {
    const db = getDb();
    const payment = db.financePayments.find((p) => p.id === input.paymentId);
    if (!payment) {
      throw new FinanceHttpError(404, 'Payment record not found.');
    }
    if (payment.status !== 'PENDING') {
      throw new FinanceHttpError(409, `Payment is already ${payment.status}.`);
    }

    if (input.decision === 'CONFIRM') {
      payment.verifiedById = input.actor.id;
      payment.verifiedByName = input.actor.name;
      const receipt = confirmPaymentAndIssueReceipt(
        db,
        payment,
        payment.referenceNumber,
        input.actor
      );
      saveDb(db);
      return { payment, receipt };
    }

    payment.status = 'FAILED';
    payment.failureReason = input.notes?.trim() || 'Bank reference could not be verified.';
    payment.verifiedById = input.actor.id;
    payment.verifiedByName = input.actor.name;
    payment.updatedAt = new Date().toISOString();
    appendFinanceAudit(
      db,
      input.actor,
      'BANK_PAYMENT_REJECTED',
      `Rejected bank payment ${payment.referenceNumber}: ${payment.failureReason}`,
      payment.studentRegNo
    );
    saveDb(db);
    return { payment };
  },

  recordStaffManualPayment(input: {
    studentRegNo: string;
    amount: number;
    method: 'MPESA' | 'BANK' | 'CASH' | 'SCHOLARSHIP';
    referenceNumber: string;
    description?: string;
    actor: { id: string; name: string; role: string };
  }) {
    const regNo = String(input.studentRegNo ?? '').trim().toUpperCase();
    const amount = Math.round(Number(input.amount));
    const ref = String(input.referenceNumber ?? '').trim().toUpperCase();
    if (!regNo || !ref || !Number.isFinite(amount) || amount < 50) {
      throw new FinanceHttpError(
        400,
        'Student registration number, reference number, and valid amount (>= KES 50) are required.'
      );
    }

    const db = getDb();
    const account = db.financeStudentAccounts.find(
      (a) => a.studentRegNo.toUpperCase() === regNo
    );
    if (!account) {
      throw new FinanceHttpError(404, `Student fee account ${regNo} not found.`);
    }

    const nowIso = new Date().toISOString();
    const payment: FinancePaymentRecord = {
      id: createId('TX'),
      studentId: account.studentId,
      studentRegNo: account.studentRegNo,
      studentName: account.studentName,
      method: input.method,
      channelLabel: `${input.method} · Finance Desk`,
      referenceNumber: ref,
      amount,
      status: 'PENDING',
      description:
        input.description?.trim() ||
        `Verified ${input.method} fee settlement recorded by ${input.actor.name}`,
      verifiedById: input.actor.id,
      verifiedByName: input.actor.name,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.financePayments.unshift(payment);
    const receipt = confirmPaymentAndIssueReceipt(db, payment, ref, input.actor);
    saveDb(db);
    return { payment, receipt };
  },

  reviewPaymentPlan(input: {
    planId: string;
    decision: 'APPROVE' | 'REJECT';
    notes?: string;
    actor: { id: string; name: string; role: string };
  }) {
    const db = getDb();
    const plan = db.financePaymentPlans.find((p) => p.id === input.planId);
    if (!plan) {
      throw new FinanceHttpError(404, 'Payment plan not found.');
    }
    plan.status = input.decision === 'APPROVE' ? 'ACTIVE' : 'REJECTED';
    plan.reviewerNotes = input.notes?.trim() || undefined;
    plan.reviewedByName = input.actor.name;
    plan.updatedAt = new Date().toISOString();

    appendFinanceAudit(
      db,
      input.actor,
      input.decision === 'APPROVE' ? 'PAYMENT_PLAN_APPROVED' : 'PAYMENT_PLAN_REJECTED',
      `Payment plan ${plan.id} marked ${plan.status}.`,
      plan.studentRegNo
    );
    saveDb(db);
    return plan;
  },

  reviewRefundRequest(input: {
    refundId: string;
    decision: 'APPROVE' | 'REJECT' | 'DISBURSE';
    notes?: string;
    actor: { id: string; name: string; role: string };
  }) {
    const db = getDb();
    const refund = db.financeRefundRequests.find((r) => r.id === input.refundId);
    if (!refund) {
      throw new FinanceHttpError(404, 'Refund request not found.');
    }

    const nowIso = new Date().toISOString();
    refund.status =
      input.decision === 'APPROVE'
        ? 'APPROVED'
        : input.decision === 'DISBURSE'
        ? 'DISBURSED'
        : 'REJECTED';
    refund.reviewerNotes = input.notes?.trim() || refund.reviewerNotes;
    refund.reviewedByName = input.actor.name;
    refund.reviewedAt = nowIso;
    refund.updatedAt = nowIso;

    appendFinanceAudit(
      db,
      input.actor,
      `REFUND_${refund.status}`,
      `Refund ${refund.id} (KES ${refund.amount.toLocaleString()}) marked ${refund.status}.`,
      refund.studentRegNo
    );
    saveDb(db);
    return refund;
  },
};
