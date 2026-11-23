export type FeePaymentMethod = 'MPESA' | 'BANK' | 'CARD' | 'CASH' | 'SCHOLARSHIP';

export type FeePaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export interface FinanceLedgerChargeRecord {
  id: string;
  studentId: string;
  studentRegNo: string;
  termLabel: string;
  academicYear: string;
  category: 'TUITION' | 'ICT_LAB' | 'EXAMINATION' | 'LIBRARY' | 'WELFARE' | 'ADJUSTMENT';
  description: string;
  amount: number;
  postedAt: string;
}

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
  rawCallback?: unknown;
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
