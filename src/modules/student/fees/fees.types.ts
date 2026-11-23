export type FeePaymentMethod = 'MPESA' | 'BANK' | 'CARD' | 'CASH' | 'SCHOLARSHIP';

export type FeePaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export interface FinanceStudentAccountRecord {
  studentId: string;
  studentRegNo: string;
  studentName: string;
  programme: string;
  academicYear: string;
  termLabel: string;
  totalFees: number;
  nextInstalmentAmount: number;
  nextInstalmentDueDate: string;
  sponsorshipStatus: string;
  updatedAt: string;
}

export interface FinancePaymentRecord {
  id: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  method: FeePaymentMethod;
  channelLabel: string;
  referenceNumber: string;
  idempotencyKey?: string;
  phoneNumber?: string;
  bankName?: string;
  amount: number;
  status: FeePaymentStatus;
  description: string;
  receiptId?: string;
  receiptNumber?: string;
  failureReason?: string;
  verifiedById?: string;
  verifiedByName?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface StudentPaymentListItem extends FinancePaymentRecord {
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  resultDesc?: string;
}

export interface MpesaTransactionRecord {
  id: string;
  paymentId: string;
  studentId: string;
  studentRegNo: string;
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  resultCode?: number;
  resultDesc?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  mode: 'LIVE_DARAJA' | 'SANDBOX_SIMULATOR';
  callbackReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceReceiptRecord {
  id: string;
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  programme: string;
  academicYear: string;
  termLabel: string;
  method: FeePaymentMethod;
  referenceNumber: string;
  amount: number;
  description: string;
  verificationCode: string;
  issuedAt: string;
}

export interface FinanceFeeStructureRecord {
  id: string;
  programmeCode: string;
  programmeName: string;
  academicYear: string;
  termLabel: string;
  items: {
    code: string;
    label: string;
    amount: number;
  }[];
  totalAmount: number;
  active: boolean;
}

export interface FinancePaymentPlanInstalment {
  id: string;
  label: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'DUE' | 'UPCOMING' | 'OVERDUE';
}

export interface FinancePaymentPlanRecord {
  id: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  termLabel: string;
  totalCoveredAmount: number;
  instalments: FinancePaymentPlanInstalment[];
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'COMPLETED' | 'REJECTED';
  requestedNotes?: string;
  reviewerNotes?: string;
  reviewedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceClearanceRecord {
  id: string;
  studentId: string;
  studentRegNo: string;
  category: 'EXAMINATION' | 'REGISTRATION' | 'GRADUATION' | 'LIBRARY';
  label: string;
  thresholdPercent: number;
  status: 'CLEARED' | 'PROVISIONAL' | 'PENDING' | 'HOLD';
  requirementNote: string;
  checkedAt: string;
  checkedBy: string;
}

export interface FinanceRefundRequestRecord {
  id: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  amount: number;
  reason: string;
  payoutChannel: 'MPESA' | 'BANK';
  payoutAccount: string;
  supportingReference?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  reviewerNotes?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFeesOverviewDto {
  account: FinanceStudentAccountRecord;
  totalFees: number;
  totalPaid: number;
  outstandingBalance: number;
  nextInstalment: number;
  nextInstalmentDueDate: string;
  progressPercent: number;
  clearanceStatus: FinanceClearanceRecord['status'];
  recentTransactions: FinancePaymentRecord[];
  source: 'server' | 'preview';
}

export interface FeeStatementRow {
  id: string;
  date: string;
  reference: string;
  description: string;
  entryType: 'CHARGE' | 'PAYMENT' | 'CREDIT';
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface StudentFeeStatementDto {
  account: FinanceStudentAccountRecord;
  totalFees: number;
  totalPaid: number;
  outstandingBalance: number;
  entries: FeeStatementRow[];
  source: 'server' | 'preview';
}

export interface StkPushInitiateResponse {
  payment: FinancePaymentRecord;
  mpesaTransaction?: MpesaTransactionRecord;
  customerMessage: string;
  reusedIdempotencyKey: boolean;
  source: 'server' | 'preview';
}

export interface SandboxCompleteResponse {
  processed: boolean;
  alreadyProcessed?: boolean;
  status: FeePaymentStatus;
  payment?: FinancePaymentRecord;
  receipt?: FinanceReceiptRecord;
  source: 'server' | 'preview';
}

export interface FinancialClearanceSummaryDto {
  progressPercent: number;
  outstandingBalance: number;
  totalFees: number;
  totalPaid: number;
  items: FinanceClearanceRecord[];
  source: 'server' | 'preview';
}

export interface FinanceAuditLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  studentRegNo?: string;
  action: string;
  detail: string;
  createdAt: string;
}
