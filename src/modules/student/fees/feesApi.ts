import { studentPortalService, downloadStudentDocument } from '../../../services/studentPortalService';
import type {
  FeeStatementRow,
  FinanceClearanceRecord,
  FinanceFeeStructureRecord,
  FinancePaymentPlanRecord,
  FinancePaymentRecord,
  FinanceReceiptRecord,
  FinanceRefundRequestRecord,
  FinanceStudentAccountRecord,
  FinancialClearanceSummaryDto,
  MpesaTransactionRecord,
  SandboxCompleteResponse,
  StkPushInitiateResponse,
  StudentFeeStatementDto,
  StudentFeesOverviewDto,
  StudentPaymentListItem,
} from './fees.types';

const PREVIEW_STORAGE_KEY = 'hitech_student_fees_preview_v1';

interface PreviewFeesState {
  account: FinanceStudentAccountRecord;
  charges: {
    id: string;
    date: string;
    termLabel: string;
    description: string;
    amount: number;
  }[];
  payments: FinancePaymentRecord[];
  mpesaTransactions: MpesaTransactionRecord[];
  receipts: FinanceReceiptRecord[];
  feeStructures: FinanceFeeStructureRecord[];
  paymentPlans: FinancePaymentPlanRecord[];
  refundRequests: FinanceRefundRequestRecord[];
}

function createPreviewState(): PreviewFeesState {
  const profile = studentPortalService.getState().profile;
  const studentId = 'stu-sample-001';
  const regNo = profile.registrationNumber || 'HCA/STU/2026/001';
  const fullName = profile.fullName || 'Amina Wanjiku';

  return {
    account: {
      studentId,
      studentRegNo: regNo,
      studentName: fullName,
      programme: profile.programme || 'BSc. Computer Science',
      academicYear: '2026',
      termLabel: 'Academic Year 2026 · Semester 1',
      totalFees: 45000,
      nextInstalmentAmount: 5000,
      nextInstalmentDueDate: '2026-12-05',
      sponsorshipStatus: 'Self-Sponsored',
      updatedAt: '2026-11-20T10:00:00.000Z',
    },
    charges: [
      {
        id: 'CHG-2026-001',
        date: '2026-09-04T08:00:00.000Z',
        termLabel: 'Academic Year 2026 · Semester 1',
        description: 'Semester 1 Tuition Fee (BSc. Computer Science)',
        amount: 32000,
      },
      {
        id: 'CHG-2026-002',
        date: '2026-09-04T08:05:00.000Z',
        termLabel: 'Academic Year 2026 · Semester 1',
        description: 'ICT & Networking Laboratory Practical Fee',
        amount: 7500,
      },
      {
        id: 'CHG-2026-003',
        date: '2026-09-04T08:10:00.000Z',
        termLabel: 'Academic Year 2026 · Semester 1',
        description: 'Examination & Assessment Processing Fee',
        amount: 3500,
      },
      {
        id: 'CHG-2026-004',
        date: '2026-09-04T08:15:00.000Z',
        termLabel: 'Academic Year 2026 · Semester 1',
        description: 'Digital Library & Student Union Subscription',
        amount: 2000,
      },
    ],
    payments: [
      {
        id: 'TX-001',
        studentId,
        studentRegNo: regNo,
        studentName: fullName,
        method: 'MPESA',
        channelLabel: 'M-Pesa STK Push',
        referenceNumber: 'QWE82KLM',
        phoneNumber: '254712345678',
        amount: 10000,
        status: 'CONFIRMED',
        description: 'Tuition & Lab Instalment 2 (M-Pesa Paybill 890123)',
        receiptId: 'RCT-2026-002',
        receiptNumber: 'RCT-2026-002',
        createdAt: '2026-11-20T09:15:00.000Z',
        updatedAt: '2026-11-20T09:15:30.000Z',
        paidAt: '2026-11-20T09:15:30.000Z',
      },
      {
        id: 'TX-002',
        studentId,
        studentRegNo: regNo,
        studentName: fullName,
        method: 'MPESA',
        channelLabel: 'M-Pesa STK Push',
        referenceNumber: 'QWE12RTY',
        phoneNumber: '254712345678',
        amount: 20000,
        status: 'CONFIRMED',
        description: 'Registration & First Tuition Instalment (M-Pesa)',
        receiptId: 'RCT-2026-001',
        receiptNumber: 'RCT-2026-001',
        createdAt: '2026-11-10T11:30:00.000Z',
        updatedAt: '2026-11-10T11:30:40.000Z',
        paidAt: '2026-11-10T11:30:40.000Z',
      },
    ],
    mpesaTransactions: [
      {
        id: 'MPESA-001',
        paymentId: 'TX-001',
        studentId,
        studentRegNo: regNo,
        phoneNumber: '254712345678',
        amount: 10000,
        accountReference: regNo,
        transactionDesc: 'College Fee Instalment 2',
        merchantRequestId: '29115-34620561-1',
        checkoutRequestId: 'ws_CO_2011202609150001',
        mpesaReceiptNumber: 'QWE82KLM',
        transactionDate: '20261120091530',
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        status: 'CONFIRMED',
        mode: 'SANDBOX_SIMULATOR',
        callbackReceivedAt: '2026-11-20T09:15:30.000Z',
        createdAt: '2026-11-20T09:15:00.000Z',
        updatedAt: '2026-11-20T09:15:30.000Z',
      },
      {
        id: 'MPESA-002',
        paymentId: 'TX-002',
        studentId,
        studentRegNo: regNo,
        phoneNumber: '254712345678',
        amount: 20000,
        accountReference: regNo,
        transactionDesc: 'College Fee Registration',
        merchantRequestId: '29115-34610012-2',
        checkoutRequestId: 'ws_CO_1011202611300002',
        mpesaReceiptNumber: 'QWE12RTY',
        transactionDate: '20261110113040',
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        status: 'CONFIRMED',
        mode: 'SANDBOX_SIMULATOR',
        callbackReceivedAt: '2026-11-10T11:30:40.000Z',
        createdAt: '2026-11-10T11:30:00.000Z',
        updatedAt: '2026-11-10T11:30:40.000Z',
      },
    ],
    receipts: [
      {
        id: 'RCT-2026-002',
        receiptNumber: 'RCT-2026-002',
        paymentId: 'TX-001',
        studentId,
        studentRegNo: regNo,
        studentName: fullName,
        programme: profile.programme || 'BSc. Computer Science',
        academicYear: '2026',
        termLabel: 'Academic Year 2026 · Semester 1',
        method: 'MPESA',
        referenceNumber: 'QWE82KLM',
        amount: 10000,
        description: 'Tuition & Lab Instalment 2 (M-Pesa Paybill 890123)',
        verificationCode: 'VRF-QWE82KLM-02',
        issuedAt: '2026-11-20T09:15:30.000Z',
      },
      {
        id: 'RCT-2026-001',
        receiptNumber: 'RCT-2026-001',
        paymentId: 'TX-002',
        studentId,
        studentRegNo: regNo,
        studentName: fullName,
        programme: profile.programme || 'BSc. Computer Science',
        academicYear: '2026',
        termLabel: 'Academic Year 2026 · Semester 1',
        method: 'MPESA',
        referenceNumber: 'QWE12RTY',
        amount: 20000,
        description: 'Registration & First Tuition Instalment (M-Pesa)',
        verificationCode: 'VRF-QWE12RTY-01',
        issuedAt: '2026-11-10T11:30:40.000Z',
      },
    ],
    feeStructures: [
      {
        id: 'FS-BCS-2026-S1',
        programmeCode: 'BCS-Y2S1',
        programmeName: 'BSc. Computer Science (Year 2 · Semester 1)',
        academicYear: '2026',
        termLabel: 'Semester 1 (Sep – Dec 2026)',
        items: [
          { code: 'TUI-101', label: 'Core Tuition Fee (6 Credit Units)', amount: 32000 },
          { code: 'LAB-102', label: 'ICT & Networking Lab Usage', amount: 7500 },
          { code: 'EXM-103', label: 'Internal & CBT Examination Fee', amount: 3500 },
          { code: 'LIB-104', label: 'Digital Library & Student Union', amount: 2000 },
        ],
        totalAmount: 45000,
        active: true,
      },
      {
        id: 'FS-DCS-2026-S1',
        programmeCode: 'DCS-L6',
        programmeName: 'Diploma in Cyber Security (TVET CDACC Level 6)',
        academicYear: '2026',
        termLabel: 'Term 3 (Sep – Dec 2026)',
        items: [
          { code: 'TUI-201', label: 'Diploma Tuition Fee', amount: 26000 },
          { code: 'LAB-202', label: 'Security Operations Sandbox Lab', amount: 6500 },
          { code: 'EXM-203', label: 'CDACC Competency Assessment Fee', amount: 4000 },
          { code: 'LIB-204', label: 'Library & Student Welfare', amount: 1500 },
        ],
        totalAmount: 38000,
        active: true,
      },
      {
        id: 'FS-CIT-2026-S1',
        programmeCode: 'CIT-L5',
        programmeName: 'Certificate in Information Technology (KNEC Level 5)',
        academicYear: '2026',
        termLabel: 'Term 3 (Sep – Dec 2026)',
        items: [
          { code: 'TUI-301', label: 'Certificate Tuition Fee', amount: 19000 },
          { code: 'LAB-302', label: 'Computer Hardware & Maintenance Lab', amount: 4500 },
          { code: 'EXM-303', label: 'KNEC Examination Registration', amount: 3000 },
          { code: 'LIB-304', label: 'Library & Student ID', amount: 1500 },
        ],
        totalAmount: 28000,
        active: true,
      },
    ],
    paymentPlans: [
      {
        id: 'FPLAN-2026-001',
        studentId,
        studentRegNo: regNo,
        studentName: fullName,
        termLabel: 'Academic Year 2026 · Semester 1',
        totalCoveredAmount: 45000,
        status: 'ACTIVE',
        requestedNotes: 'Three-part semester fee settlement schedule approved by Bursar.',
        reviewedByName: 'Grace Muthoni (Finance Officer)',
        instalments: [
          {
            id: 'INST-1',
            label: 'Instalment 1 — Registration Deposit (45%)',
            dueDate: '2026-11-10',
            amount: 20000,
            paidAmount: 20000,
            status: 'PAID',
          },
          {
            id: 'INST-2',
            label: 'Instalment 2 — Mid-Semester (22%)',
            dueDate: '2026-11-20',
            amount: 10000,
            paidAmount: 10000,
            status: 'PAID',
          },
          {
            id: 'INST-3',
            label: 'Instalment 3 — Pre-Exam Balance (KES 5,000 due first)',
            dueDate: '2026-12-05',
            amount: 15000,
            paidAmount: 0,
            status: 'DUE',
          },
        ],
        createdAt: '2026-11-01T08:00:00.000Z',
        updatedAt: '2026-11-20T09:15:30.000Z',
      },
    ],
    refundRequests: [
      {
        id: 'RFD-2026-001',
        studentId,
        studentRegNo: regNo,
        studentName: fullName,
        amount: 1500,
        reason: 'Duplicate library caution deposit adjustment from Summer 2026 bridge unit.',
        payoutChannel: 'MPESA',
        payoutAccount: '254712345678',
        supportingReference: 'QWE12RTY',
        status: 'APPROVED',
        reviewerNotes: 'Verified against Summer ledger — scheduled for fee credit / payout batch.',
        reviewedByName: 'Grace Muthoni (Finance Officer)',
        reviewedAt: '2026-11-18T14:20:00.000Z',
        createdAt: '2026-11-16T10:05:00.000Z',
        updatedAt: '2026-11-18T14:20:00.000Z',
      },
    ],
  };
}

function readPreviewState(): PreviewFeesState {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as PreviewFeesState;
      }
    }
  } catch {
    // fallback below
  }
  const initial = createPreviewState();
  savePreviewState(initial);
  return initial;
}

function savePreviewState(state: PreviewFeesState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore SSR or quota errors
  }
}

function computePreviewTotals(state: PreviewFeesState) {
  const totalFees = state.charges.reduce((s, c) => s + c.amount, 0) || state.account.totalFees;
  const totalPaid = state.payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((s, p) => s + p.amount, 0);
  const outstandingBalance = Math.max(0, totalFees - totalPaid);
  const progressPercent =
    totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 100;
  const nextInstalment =
    outstandingBalance === 0
      ? 0
      : Math.min(outstandingBalance, state.account.nextInstalmentAmount || outstandingBalance);
  return { totalFees, totalPaid, outstandingBalance, progressPercent, nextInstalment };
}

function buildPreviewClearances(state: PreviewFeesState): FinanceClearanceRecord[] {
  const totals = computePreviewTotals(state);
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'FCLR-REG',
      studentId: state.account.studentId,
      studentRegNo: state.account.studentRegNo,
      category: 'REGISTRATION',
      label: 'Semester Unit Registration Clearance',
      thresholdPercent: 40,
      status: totals.progressPercent >= 40 ? 'CLEARED' : 'HOLD',
      requirementNote:
        totals.progressPercent >= 40
          ? `Minimum 40% tuition threshold satisfied (${totals.progressPercent}% paid).`
          : `Requires 40% minimum payment (${totals.progressPercent}% paid).`,
      checkedAt: nowIso,
      checkedBy: 'Automated Finance Ledger',
    },
    {
      id: 'FCLR-EXM',
      studentId: state.account.studentId,
      studentRegNo: state.account.studentRegNo,
      category: 'EXAMINATION',
      label: 'Mid-Term CATs & Final Examination Permit',
      thresholdPercent: 75,
      status:
        totals.outstandingBalance === 0
          ? 'CLEARED'
          : totals.progressPercent >= 75
          ? 'PROVISIONAL'
          : 'PROVISIONAL',
      requirementNote:
        totals.outstandingBalance === 0
          ? '100% fees settled — Final Examination Card unlocked.'
          : `${totals.progressPercent}% paid — KES ${totals.outstandingBalance.toLocaleString()} outstanding before end-term exams.`,
      checkedAt: nowIso,
      checkedBy: 'Automated Finance Ledger',
    },
    {
      id: 'FCLR-LIB',
      studentId: state.account.studentId,
      studentRegNo: state.account.studentRegNo,
      category: 'LIBRARY',
      label: 'Library & Laboratory Deposit Clearance',
      thresholdPercent: 50,
      status: totals.progressPercent >= 50 ? 'CLEARED' : 'PENDING',
      requirementNote: 'No overdue book fines; lab caution deposit verified.',
      checkedAt: nowIso,
      checkedBy: 'Chief Librarian · Finance Sync',
    },
    {
      id: 'FCLR-GRD',
      studentId: state.account.studentId,
      studentRegNo: state.account.studentRegNo,
      category: 'GRADUATION',
      label: 'Official Transcript & Graduation Clearance',
      thresholdPercent: 100,
      status: totals.outstandingBalance === 0 ? 'CLEARED' : 'PENDING',
      requirementNote:
        totals.outstandingBalance === 0
          ? 'Zero fee balance verified.'
          : 'Requires 100% settlement of semester fee balance.',
      checkedAt: nowIso,
      checkedBy: 'Automated Finance Ledger',
    },
  ];
}

export function formatKes(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString()}`;
}

export function normalizeKenyanPhoneClient(rawPhone: string): string {
  const digits = rawPhone.replace(/[\s()-]/g, '').trim();
  const normalized = digits.startsWith('+') ? digits.slice(1) : digits;
  if (/^0[17]\d{8}$/.test(normalized)) {
    return `254${normalized.slice(1)}`;
  }
  if (/^254[17]\d{8}$/.test(normalized)) {
    return normalized;
  }
  throw new Error('Enter a valid Kenyan phone number (e.g. 0712345678 or 254712345678).');
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  const formulaSafe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [
    headers.map((h) => escapeCsvCell(h)).join(','),
    ...rows.map((r) => r.map((c) => escapeCsvCell(c)).join(',')),
  ];
  downloadStudentDocument(filename, lines.join('\r\n'));
}

function isExplicitPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;

  return new URLSearchParams(window.location.search).get('preview') === '1';
}

async function fetchJsonOrFallback<T>(
  url: string,
  options: RequestInit | undefined,
  fallback: () => T
): Promise<{ data: T; source: 'server' | 'preview' }> {
  const previewAllowed = isExplicitPreviewMode();

  if (typeof fetch !== 'function') {
    if (previewAllowed) {
      return {
        data: fallback(),
        source: 'preview',
      };
    }

    throw new Error('The financial service is unavailable.');
  }

  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    const payload = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: T;
      error?: string;
    };

    if (res.status === 401 || res.status === 403) {
      if (previewAllowed) {
        return {
          data: fallback(),
          source: 'preview',
        };
      }

      throw new Error(
        res.status === 401
          ? 'Please sign in to access your financial records.'
          : 'You are not authorized to access these financial records.'
      );
    }

    if (!res.ok || !payload.success || payload.data === undefined) {
      throw new Error(
        payload.error || `Financial request failed with HTTP ${res.status}.`
      );
    }

    return {
      data: payload.data,
      source: 'server',
    };
  } catch (error) {
    if (error instanceof TypeError && previewAllowed) {
      return {
        data: fallback(),
        source: 'preview',
      };
    }

    throw error;
  }
}

export const studentFeesApi = {
  async getOverview(): Promise<StudentFeesOverviewDto> {
    const res = await fetchJsonOrFallback<Omit<StudentFeesOverviewDto, 'source'>>(
      '/api/student/fees/overview',
      undefined,
      () => {
        const state = readPreviewState();
        const totals = computePreviewTotals(state);
        const clearances = buildPreviewClearances(state);
        const examClr = clearances.find((c) => c.category === 'EXAMINATION');
        return {
          account: state.account,
          totalFees: totals.totalFees,
          totalPaid: totals.totalPaid,
          outstandingBalance: totals.outstandingBalance,
          nextInstalment: totals.nextInstalment,
          nextInstalmentDueDate: state.account.nextInstalmentDueDate,
          progressPercent: totals.progressPercent,
          clearanceStatus: examClr?.status ?? 'PROVISIONAL',
          recentTransactions: state.payments.slice(0, 6),
        };
      }
    );
    return { ...res.data, source: res.source };
  },

  async getStatement(term?: string): Promise<StudentFeeStatementDto> {
    const query = term ? `?term=${encodeURIComponent(term)}` : '';
    const res = await fetchJsonOrFallback<Omit<StudentFeeStatementDto, 'source'>>(
      `/api/student/fees/statement${query}`,
      undefined,
      () => {
        const state = readPreviewState();
        const totals = computePreviewTotals(state);
        const charges = term
          ? state.charges.filter((c) => c.termLabel.toLowerCase().includes(term.toLowerCase()))
          : state.charges;
        const confirmed = state.payments.filter((p) => p.status === 'CONFIRMED');
        const raw = [
          ...charges.map((c) => ({
            id: c.id,
            date: c.date,
            reference: c.id,
            description: c.description,
            entryType: 'CHARGE' as const,
            debit: c.amount,
            credit: 0,
          })),
          ...confirmed.map((p) => ({
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
        const entries: FeeStatementRow[] = raw.map((r) => {
          running = Math.max(0, running + r.debit - r.credit);
          return { ...r, runningBalance: running };
        });
        return {
          account: state.account,
          totalFees: totals.totalFees,
          totalPaid: totals.totalPaid,
          outstandingBalance: totals.outstandingBalance,
          entries,
        };
      }
    );
    return { ...res.data, source: res.source };
  },

  async listPayments(filters?: {
    status?: string;
    method?: string;
    search?: string;
  }): Promise<{ payments: StudentPaymentListItem[]; source: 'server' | 'preview' }> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.method && filters.method !== 'ALL') params.set('method', filters.method);
    if (filters?.search?.trim()) params.set('search', filters.search.trim());
    const qs = params.toString();

    const res = await fetchJsonOrFallback<{ payments: StudentPaymentListItem[] }>(
      `/api/student/fees/payments${qs ? `?${qs}` : ''}`,
      undefined,
      () => {
        const state = readPreviewState();
        const q = (filters?.search ?? '').trim().toLowerCase();
        const filtered = state.payments
          .filter((p) => {
            if (filters?.status && filters.status !== 'ALL' && p.status !== filters.status) return false;
            if (filters?.method && filters.method !== 'ALL' && p.method !== filters.method) return false;
            if (!q) return true;
            return (
              p.id.toLowerCase().includes(q) ||
              p.referenceNumber.toLowerCase().includes(q) ||
              (p.receiptNumber ?? '').toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
            );
          })
          .map((p) => {
            const mpesa = state.mpesaTransactions.find((m) => m.paymentId === p.id);
            return {
              ...p,
              checkoutRequestId: mpesa?.checkoutRequestId,
              mpesaReceiptNumber: mpesa?.mpesaReceiptNumber,
              resultDesc: mpesa?.resultDesc,
            };
          });
        return { payments: filtered };
      }
    );
    return { payments: res.data.payments, source: res.source };
  },

  async initiateMpesaStkPush(
    input: { phoneNumber: string; amount: number },
    idempotencyKey = generateIdempotencyKey()
  ): Promise<StkPushInitiateResponse> {
    const phone = normalizeKenyanPhoneClient(input.phoneNumber);
    const amount = Math.round(Number(input.amount));
    if (!Number.isFinite(amount) || amount < 100 || amount > 500000) {
      throw new Error('Payment amount must be between KES 100 and KES 500,000.');
    }

    const res = await fetchJsonOrFallback<Omit<StkPushInitiateResponse, 'source'>>(
      '/api/student/fees/payments/mpesa/stk-push',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ phoneNumber: phone, amount, idempotencyKey }),
      },
      () => {
        const state = readPreviewState();
        const existing = state.payments.find((p) => p.idempotencyKey === idempotencyKey);
        if (existing) {
          const m = state.mpesaTransactions.find((tx) => tx.paymentId === existing.id);
          return {
            payment: existing,
            mpesaTransaction: m,
            customerMessage: 'Existing M-Pesa STK Push session returned.',
            reusedIdempotencyKey: true,
          };
        }
        const totals = computePreviewTotals(state);
        if (totals.outstandingBalance <= 0) {
          throw new Error('Your fee balance is already settled in full (KES 0).');
        }
        if (amount > totals.outstandingBalance) {
          throw new Error(
            `Amount KES ${amount.toLocaleString()} exceeds outstanding balance KES ${totals.outstandingBalance.toLocaleString()}.`
          );
        }

        const nowIso = new Date().toISOString();
        const idNum = Math.floor(100 + Math.random() * 899);
        const paymentId = `TX-${idNum}`;
        const checkoutId = `ws_CO_${Date.now()}`;
        const payment: FinancePaymentRecord = {
          id: paymentId,
          studentId: state.account.studentId,
          studentRegNo: state.account.studentRegNo,
          studentName: state.account.studentName,
          method: 'MPESA',
          channelLabel: 'M-Pesa STK Push',
          referenceNumber: checkoutId,
          idempotencyKey,
          phoneNumber: phone,
          amount,
          status: 'PENDING',
          description: `Fee payment — M-Pesa STK Push (${phone})`,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const mpesaTx: MpesaTransactionRecord = {
          id: `MPESA-${idNum}`,
          paymentId,
          studentId: state.account.studentId,
          studentRegNo: state.account.studentRegNo,
          phoneNumber: phone,
          amount,
          accountReference: state.account.studentRegNo,
          transactionDesc: 'College Fee Payment',
          merchantRequestId: `MRQ-${idNum}`,
          checkoutRequestId: checkoutId,
          status: 'PENDING',
          mode: 'SANDBOX_SIMULATOR',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.payments.unshift(payment);
        state.mpesaTransactions.unshift(mpesaTx);
        savePreviewState(state);
        return {
          payment,
          mpesaTransaction: mpesaTx,
          customerMessage: `STK Push sent to +${phone}. Enter M-Pesa PIN to complete KES ${amount.toLocaleString()}.`,
          reusedIdempotencyKey: false,
        };
      }
    );
    return { ...res.data, source: res.source };
  },

  async completeSandboxStkPayment(
    paymentId: string,
    outcome: 'SUCCESS' | 'CANCELLED' | 'FAILED' = 'SUCCESS'
  ): Promise<SandboxCompleteResponse> {
    const res = await fetchJsonOrFallback<Omit<SandboxCompleteResponse, 'source'>>(
      `/api/student/fees/payments/mpesa/${encodeURIComponent(paymentId)}/sandbox-complete`,
      {
        method: 'POST',
        body: JSON.stringify({ outcome }),
      },
      () => {
        const state = readPreviewState();
        const payment = state.payments.find((p) => p.id === paymentId);
        if (!payment) {
          throw new Error('Pending M-Pesa payment session not found.');
        }
        const mpesaTx = state.mpesaTransactions.find((m) => m.paymentId === payment.id);
        if (payment.status === 'CONFIRMED') {
          const receipt = state.receipts.find((r) => r.paymentId === payment.id);
          return { processed: true, alreadyProcessed: true, status: payment.status, payment, receipt };
        }

        const nowIso = new Date().toISOString();
        if (outcome !== 'SUCCESS') {
          const status = outcome === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
          payment.status = status;
          payment.failureReason =
            outcome === 'CANCELLED' ? 'Cancelled by candidate on handset.' : 'STK timeout.';
          payment.updatedAt = nowIso;
          if (mpesaTx) {
            mpesaTx.status = status;
            mpesaTx.resultCode = outcome === 'CANCELLED' ? 1032 : 1037;
            mpesaTx.resultDesc = payment.failureReason;
            mpesaTx.updatedAt = nowIso;
          }
          savePreviewState(state);
          return { processed: true, alreadyProcessed: false, status, payment };
        }

        const mpesaCode = `QWE${Math.floor(10 + Math.random() * 89)}MP`;
        const nextNum = state.receipts.length + 1;
        const receiptNumber = `RCT-2026-${String(nextNum).padStart(3, '0')}`;
        const receipt: FinanceReceiptRecord = {
          id: receiptNumber,
          receiptNumber,
          paymentId: payment.id,
          studentId: state.account.studentId,
          studentRegNo: state.account.studentRegNo,
          studentName: state.account.studentName,
          programme: state.account.programme,
          academicYear: state.account.academicYear,
          termLabel: state.account.termLabel,
          method: 'MPESA',
          referenceNumber: mpesaCode,
          amount: payment.amount,
          description: payment.description,
          verificationCode: `VRF-${mpesaCode}-${String(nextNum).padStart(2, '0')}`,
          issuedAt: nowIso,
        };

        payment.status = 'CONFIRMED';
        payment.referenceNumber = mpesaCode;
        payment.receiptId = receipt.id;
        payment.receiptNumber = receipt.receiptNumber;
        payment.paidAt = nowIso;
        payment.updatedAt = nowIso;

        if (mpesaTx) {
          mpesaTx.status = 'CONFIRMED';
          mpesaTx.mpesaReceiptNumber = mpesaCode;
          mpesaTx.resultCode = 0;
          mpesaTx.resultDesc = 'The service request is processed successfully.';
          mpesaTx.callbackReceivedAt = nowIso;
          mpesaTx.updatedAt = nowIso;
        }
        state.receipts.unshift(receipt);
        savePreviewState(state);

        // Mirror confirmed payment into studentPortalService so dashboard KPI stays synced in preview
        try {
          studentPortalService.recordMpesaPayment(payment.phoneNumber || '0712345678', payment.amount);
        } catch {
          // ignore if studentPortalService balance differs
        }

        return {
          processed: true,
          alreadyProcessed: false,
          status: 'CONFIRMED',
          payment,
          receipt,
        };
      }
    );
    return { ...res.data, source: res.source };
  },

  async submitBankReference(input: {
    bankName: string;
    referenceNumber: string;
    amount: number;
    depositedAt: string;
    notes?: string;
  }): Promise<{ payment: FinancePaymentRecord; source: 'server' | 'preview' }> {
    const res = await fetchJsonOrFallback<{ payment: FinancePaymentRecord }>(
      '/api/student/fees/payments/bank-reference',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      () => {
        const refClean = input.referenceNumber.trim().toUpperCase();
        if (refClean.length < 5) {
          throw new Error('Bank deposit reference must be at least 5 characters.');
        }
        const amount = Math.round(Number(input.amount));
        if (!Number.isFinite(amount) || amount < 100) {
          throw new Error('Bank deposit amount must be at least KES 100.');
        }
        const state = readPreviewState();
        if (
          state.payments.some(
            (p) =>
              p.method === 'BANK' &&
              p.referenceNumber.toUpperCase() === refClean &&
              p.status !== 'FAILED' &&
              p.status !== 'CANCELLED'
          )
        ) {
          throw new Error(`Bank reference ${refClean} has already been submitted.`);
        }

        const nowIso = new Date().toISOString();
        const payment: FinancePaymentRecord = {
          id: `TX-${Math.floor(100 + Math.random() * 899)}`,
          studentId: state.account.studentId,
          studentRegNo: state.account.studentRegNo,
          studentName: state.account.studentName,
          method: 'BANK',
          channelLabel: `${input.bankName} Deposit`,
          bankName: input.bankName,
          referenceNumber: refClean,
          amount,
          status: 'PENDING',
          description: input.notes?.trim()
            ? `Bank deposit (${input.bankName} · ${input.depositedAt}): ${input.notes.trim()}`
            : `Bank deposit (${input.bankName} · ${input.depositedAt})`,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.payments.unshift(payment);
        savePreviewState(state);
        return { payment };
      }
    );
    return { payment: res.data.payment, source: res.source };
  },

  async listReceipts(): Promise<{ receipts: FinanceReceiptRecord[]; source: 'server' | 'preview' }> {
    const res = await fetchJsonOrFallback<{ receipts: FinanceReceiptRecord[] }>(
      '/api/student/fees/receipts',
      undefined,
      () => ({ receipts: readPreviewState().receipts })
    );
    return { receipts: res.data.receipts, source: res.source };
  },

  async listFeeStructures(
    programme?: string
  ): Promise<{ structures: FinanceFeeStructureRecord[]; source: 'server' | 'preview' }> {
    const qs = programme ? `?programme=${encodeURIComponent(programme)}` : '';
    const res = await fetchJsonOrFallback<{ structures: FinanceFeeStructureRecord[] }>(
      `/api/student/fees/structure${qs}`,
      undefined,
      () => {
        const list = readPreviewState().feeStructures;
        return {
          structures: programme
            ? list.filter((s) =>
                s.programmeCode.toLowerCase().includes(programme.toLowerCase())
              )
            : list,
        };
      }
    );
    return { structures: res.data.structures, source: res.source };
  },

  async getPaymentPlans(): Promise<{ plans: FinancePaymentPlanRecord[]; source: 'server' | 'preview' }> {
    const res = await fetchJsonOrFallback<{ plans: FinancePaymentPlanRecord[] }>(
      '/api/student/fees/payment-plans',
      undefined,
      () => ({ plans: readPreviewState().paymentPlans })
    );
    return { plans: res.data.plans, source: res.source };
  },

  async requestPaymentPlan(input: {
    instalmentCount: number;
    requestedNotes: string;
  }): Promise<{ plan: FinancePaymentPlanRecord; source: 'server' | 'preview' }> {
    const res = await fetchJsonOrFallback<{ plan: FinancePaymentPlanRecord }>(
      '/api/student/fees/payment-plans',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      () => {
        const state = readPreviewState();
        const totals = computePreviewTotals(state);
        if (totals.outstandingBalance <= 0) {
          throw new Error('No outstanding fee balance requiring a payment plan.');
        }
        const count = Math.min(6, Math.max(2, Math.round(Number(input.instalmentCount))));
        if (!input.requestedNotes || input.requestedNotes.trim().length < 5) {
          throw new Error('Provide a brief justification for your payment plan request.');
        }
        const baseAmt = Math.floor(totals.outstandingBalance / count);
        const rem = totals.outstandingBalance - baseAmt * count;
        const now = Date.now();
        const plan: FinancePaymentPlanRecord = {
          id: `FPLAN-${Math.floor(100 + Math.random() * 899)}`,
          studentId: state.account.studentId,
          studentRegNo: state.account.studentRegNo,
          studentName: state.account.studentName,
          termLabel: state.account.termLabel,
          totalCoveredAmount: totals.outstandingBalance,
          status: 'PENDING_APPROVAL',
          requestedNotes: input.requestedNotes.trim(),
          instalments: Array.from({ length: count }, (_, idx) => ({
            id: `INST-${Date.now()}-${idx + 1}`,
            label: `Requested Instalment ${idx + 1} of ${count}`,
            dueDate: new Date(now + (idx + 1) * 14 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
            amount: idx === count - 1 ? baseAmt + rem : baseAmt,
            paidAmount: 0,
            status: 'UPCOMING',
          })),
          createdAt: new Date(now).toISOString(),
          updatedAt: new Date(now).toISOString(),
        };
        state.paymentPlans.unshift(plan);
        savePreviewState(state);
        return { plan };
      }
    );
    return { plan: res.data.plan, source: res.source };
  },

  async getFinancialClearance(): Promise<FinancialClearanceSummaryDto> {
    const res = await fetchJsonOrFallback<Omit<FinancialClearanceSummaryDto, 'source'>>(
      '/api/student/fees/clearance',
      undefined,
      () => {
        const state = readPreviewState();
        const totals = computePreviewTotals(state);
        return {
          progressPercent: totals.progressPercent,
          outstandingBalance: totals.outstandingBalance,
          totalFees: totals.totalFees,
          totalPaid: totals.totalPaid,
          items: buildPreviewClearances(state),
        };
      }
    );
    return { ...res.data, source: res.source };
  },

  async listRefundRequests(): Promise<{
    requests: FinanceRefundRequestRecord[];
    source: 'server' | 'preview';
  }> {
    const res = await fetchJsonOrFallback<{ requests: FinanceRefundRequestRecord[] }>(
      '/api/student/fees/refund-requests',
      undefined,
      () => ({ requests: readPreviewState().refundRequests })
    );
    return { requests: res.data.requests, source: res.source };
  },

  async submitRefundRequest(input: {
    amount: number;
    reason: string;
    payoutChannel: 'MPESA' | 'BANK';
    payoutAccount: string;
    supportingReference?: string;
  }): Promise<{ request: FinanceRefundRequestRecord; source: 'server' | 'preview' }> {
    const res = await fetchJsonOrFallback<{ request: FinanceRefundRequestRecord }>(
      '/api/student/fees/refund-requests',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      () => {
        const state = readPreviewState();
        const totals = computePreviewTotals(state);
        const amount = Math.round(Number(input.amount));
        if (!Number.isFinite(amount) || amount < 100) {
          throw new Error('Refund amount must be at least KES 100.');
        }
        if (amount > totals.totalPaid) {
          throw new Error(
            `Requested refund KES ${amount.toLocaleString()} exceeds verified paid fees (${formatKes(totals.totalPaid)}).`
          );
        }
        if (!input.reason || input.reason.trim().length < 8) {
          throw new Error('Provide a clear reason for your refund request (min 8 characters).');
        }
        if (!input.payoutAccount || input.payoutAccount.trim().length < 5) {
          throw new Error('Provide a valid payout M-Pesa number or bank account.');
        }

        const nowIso = new Date().toISOString();
        const request: FinanceRefundRequestRecord = {
          id: `RFD-${Math.floor(100 + Math.random() * 899)}`,
          studentId: state.account.studentId,
          studentRegNo: state.account.studentRegNo,
          studentName: state.account.studentName,
          amount,
          reason: input.reason.trim(),
          payoutChannel: input.payoutChannel,
          payoutAccount: input.payoutAccount.trim(),
          supportingReference: input.supportingReference?.trim() || undefined,
          status: 'PENDING',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.refundRequests.unshift(request);
        savePreviewState(state);
        return { request };
      }
    );
    return { request: res.data.request, source: res.source };
  },

  getSyncOverview(): StudentFeesOverviewDto {
    const state = readPreviewState();
    const totals = computePreviewTotals(state);
    const clearances = buildPreviewClearances(state);
    const examClr = clearances.find((c) => c.category === 'EXAMINATION');
    return {
      account: state.account,
      totalFees: totals.totalFees,
      totalPaid: totals.totalPaid,
      outstandingBalance: totals.outstandingBalance,
      nextInstalment: totals.nextInstalment,
      nextInstalmentDueDate: state.account.nextInstalmentDueDate,
      progressPercent: totals.progressPercent,
      clearanceStatus: examClr?.status ?? 'PROVISIONAL',
      recentTransactions: state.payments.slice(0, 6),
      source: 'preview',
    };
  },

  getSyncStatement(): StudentFeeStatementDto {
    const state = readPreviewState();
    const totals = computePreviewTotals(state);
    const confirmed = state.payments.filter((p) => p.status === 'CONFIRMED');
    const raw = [
      ...state.charges.map((c) => ({
        id: c.id,
        date: c.date,
        reference: c.id,
        description: c.description,
        entryType: 'CHARGE' as const,
        debit: c.amount,
        credit: 0,
      })),
      ...confirmed.map((p) => ({
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
    const entries: FeeStatementRow[] = raw.map((r) => {
      running = Math.max(0, running + r.debit - r.credit);
      return { ...r, runningBalance: running };
    });
    return {
      account: state.account,
      totalFees: totals.totalFees,
      totalPaid: totals.totalPaid,
      outstandingBalance: totals.outstandingBalance,
      entries,
      source: 'preview',
    };
  },

  getSyncPayments(): StudentPaymentListItem[] {
    const state = readPreviewState();
    return state.payments.map((p) => {
      const mpesa = state.mpesaTransactions.find((m) => m.paymentId === p.id);
      return {
        ...p,
        checkoutRequestId: mpesa?.checkoutRequestId,
        mpesaReceiptNumber: mpesa?.mpesaReceiptNumber,
        resultDesc: mpesa?.resultDesc,
      };
    });
  },

  getSyncReceipts(): FinanceReceiptRecord[] {
    return readPreviewState().receipts;
  },

  getSyncStructures(): FinanceFeeStructureRecord[] {
    return readPreviewState().feeStructures;
  },

  getSyncPlans(): FinancePaymentPlanRecord[] {
    return readPreviewState().paymentPlans;
  },

  getSyncClearance(): FinancialClearanceSummaryDto {
    const state = readPreviewState();
    const totals = computePreviewTotals(state);
    return {
      progressPercent: totals.progressPercent,
      outstandingBalance: totals.outstandingBalance,
      totalFees: totals.totalFees,
      totalPaid: totals.totalPaid,
      items: buildPreviewClearances(state),
      source: 'preview',
    };
  },

  getSyncRefunds(): FinanceRefundRequestRecord[] {
    return readPreviewState().refundRequests;
  },
};
