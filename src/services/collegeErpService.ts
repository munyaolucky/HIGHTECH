import {
  INITIAL_ADMISSIONS,
  INITIAL_BOOK_LOANS,
  INITIAL_LIBRARY_BOOKS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_TRANSACTIONS,
  INITIAL_TRANSCRIPTS,
} from '../data/mockCollegeData';
import {
  AdmissionApplication,
  BookLoan,
  FeeTransaction,
  LibraryBook,
  TranscriptRecord,
} from '../types';
import { registrationService } from './registrationService';

const STORAGE_KEY = 'hitech_erp_shared_ledger_v1';
const SYNC_EVENT = 'hitech-erp-sync';

export interface CollegeErpState {
  applications: AdmissionApplication[];
  transactions: FeeTransaction[];
  books: LibraryBook[];
  loans: BookLoan[];
  transcripts: TranscriptRecord[];
  activeStudentRegNo: string;
}

function buildInitialErpState(): CollegeErpState {
  return {
    applications: [...INITIAL_ADMISSIONS],
    transactions: [...INITIAL_TRANSACTIONS],
    books: [...INITIAL_LIBRARY_BOOKS],
    loans: [...INITIAL_BOOK_LOANS],
    transcripts: [...INITIAL_TRANSCRIPTS],
    activeStudentRegNo: INITIAL_STUDENT_PROFILE.registrationNumber,
  };
}

function loadState(): CollegeErpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildInitialErpState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as CollegeErpState;
  } catch {
    return buildInitialErpState();
  }
}

function saveState(state: CollegeErpState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage limits
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  }
}

export function subscribeErpSync(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SYNC_EVENT, listener);
  return () => window.removeEventListener(SYNC_EVENT, listener);
}

export const collegeErpService = {
  getState(): CollegeErpState {
    return loadState();
  },

  // --------------------------------------------------------------------------
  // UNIFIED ADMISSIONS -> CENTRAL REGISTRATION PIPELINE
  // --------------------------------------------------------------------------
  submitOnlineApplication(input: {
    applicantName: string;
    email: string;
    phoneNumber: string;
    nationalIdOrIndex: string;
    targetProgramme: string;
    targetCampus: string;
    intake: string;
    meanGrade: string;
  }): AdmissionApplication {
    const state = loadState();
    const issuance = registrationService.generateNextRegistrationNumber({
      recordType: 'APP',
      year: 2026,
      recipientName: input.applicantName,
      identifierReference: input.nationalIdOrIndex,
      department: 'Admissions & Registry',
      programmeOrRole: input.targetProgramme,
      campus: input.targetCampus,
      issuedBy: 'Online Admissions Portal',
    });

    const newApp: AdmissionApplication = {
      id: `app-${Date.now()}`,
      applicationReference: issuance.registrationNumber,
      applicantName: input.applicantName.trim(),
      email: input.email.trim(),
      phoneNumber: input.phoneNumber.trim(),
      nationalIdOrIndex: input.nationalIdOrIndex.trim(),
      targetProgramme: input.targetProgramme,
      targetCampus: input.targetCampus,
      intake: input.intake,
      meanGrade: input.meanGrade,
      submittedAt: new Date().toISOString(),
      applicationFeePaid: true,
      status: 'UNDER_REVIEW',
    };

    state.applications.unshift(newApp);
    saveState(state);
    return newApp;
  },

  makeAdmissionOffer(appId: string): { ok: boolean; offerRef?: string; error?: string } {
    const state = loadState();
    const target = state.applications.find((a) => a.id === appId);
    if (!target) return { ok: false, error: 'Application not found.' };
    const offerRef = `OFFER-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    target.status = 'OFFER_MADE';
    target.offerLetterRef = offerRef;
    saveState(state);
    return { ok: true, offerRef };
  },

  acceptAdmissionOffer(appId: string): { ok: boolean; error?: string } {
    const state = loadState();
    const target = state.applications.find((a) => a.id === appId);
    if (!target) return { ok: false, error: 'Application not found.' };
    target.status = 'ACCEPTED';
    saveState(state);
    return { ok: true };
  },

  convertApplicationToStudent(appId: string): { ok: boolean; studentRegNo?: string; error?: string } {
    const state = loadState();
    const target = state.applications.find((a) => a.id === appId);
    if (!target) return { ok: false, error: 'Application not found.' };
    if (target.generatedStudentRegNo) {
      return { ok: true, studentRegNo: target.generatedStudentRegNo };
    }

    const issuance = registrationService.generateNextRegistrationNumber({
      recordType: 'STU',
      year: 2026,
      recipientName: target.applicantName,
      identifierReference: target.nationalIdOrIndex,
      department: 'School of Computing & Informatics',
      programmeOrRole: target.targetProgramme,
      campus: target.targetCampus,
      issuedBy: 'Admissions-to-Registration Converter',
    });

    target.status = 'REGISTERED';
    target.generatedStudentRegNo = issuance.registrationNumber;
    saveState(state);
    return { ok: true, studentRegNo: issuance.registrationNumber };
  },

  // --------------------------------------------------------------------------
  // UNIFIED FINANCE & FEE RECEIPT LEDGER (FINANCE PORTAL <-> STUDENT PORTAL)
  // --------------------------------------------------------------------------
  getStudentTransactions(regNo: string): FeeTransaction[] {
    const state = loadState();
    return state.transactions.filter(
      (tx) => tx.studentRegNo.toUpperCase() === regNo.trim().toUpperCase()
    );
  },

  recordFeePayment(input: {
    studentRegNo: string;
    studentName: string;
    amount: number;
    paymentMethod?: FeeTransaction['paymentMethod'];
    description?: string;
    phoneOrRef?: string;
  }): { ok: boolean; transaction?: FeeTransaction; error?: string } {
    if (!Number.isFinite(input.amount) || input.amount < 100) {
      return { ok: false, error: 'Minimum fee settlement amount is KES 100.' };
    }

    const state = loadState();
    const seq = String(state.transactions.length + 1).padStart(4, '0');
    const receiptNumber = `RCT-2026-${seq}`;
    const mpesaCode = `T${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const newTx: FeeTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(16).slice(2, 5)}`,
      receiptNumber,
      studentRegNo: input.studentRegNo.trim().toUpperCase(),
      studentName: input.studentName.trim(),
      amount: Math.round(input.amount),
      paymentMethod: input.paymentMethod ?? 'M-PESA',
      referenceNumber: mpesaCode,
      timestamp: new Date().toISOString(),
      semester: '2026 / Semester 1',
      description:
        input.description ||
        `Lipa na M-Pesa STK Settlement (${input.phoneOrRef ?? 'Direct'})`,
      status: 'COMPLETED',
    };

    state.transactions.unshift(newTx);
    saveState(state);
    return { ok: true, transaction: newTx };
  },

  // --------------------------------------------------------------------------
  // UNIFIED LIBRARY CATALOGUE & CIRCULATION (LIBRARY PORTAL <-> STUDENT PORTAL)
  // --------------------------------------------------------------------------
  getLoansForStudent(regNo: string): BookLoan[] {
    const state = loadState();
    return state.loans.filter(
      (l) => l.borrowerRegNo.toUpperCase() === regNo.trim().toUpperCase()
    );
  },

  issueOrReserveBook(input: {
    barcode: string;
    studentRegNo: string;
    studentName: string;
  }): { ok: boolean; loan?: BookLoan; error?: string } {
    const state = loadState();
    const book = state.books.find((b) => b.barcode === input.barcode);
    if (!book || book.availableCopies <= 0) {
      return { ok: false, error: 'No copies are currently available for checkout or hold.' };
    }

    const alreadyActive = state.loans.some(
      (l) =>
        l.barcode === input.barcode &&
        l.borrowerRegNo.toUpperCase() === input.studentRegNo.toUpperCase() &&
        l.status === 'BORROWED'
    );
    if (alreadyActive) {
      return { ok: false, error: 'Student already holds an active loan for this barcode.' };
    }

    book.availableCopies -= 1;
    const newLoan: BookLoan = {
      id: `loan-${Date.now()}`,
      barcode: book.barcode,
      bookTitle: book.title,
      borrowerName: input.studentName,
      borrowerRegNo: input.studentRegNo.toUpperCase(),
      borrowDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'BORROWED',
      fineAmount: 0,
    };

    state.loans.unshift(newLoan);
    saveState(state);
    return { ok: true, loan: newLoan };
  },

  returnLibraryBook(loanId: string): { ok: boolean; error?: string } {
    const state = loadState();
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan || loan.status === 'RETURNED') {
      return { ok: false, error: 'Active loan record not found.' };
    }
    loan.status = 'RETURNED';
    loan.returnDate = new Date().toISOString().slice(0, 10);
    const book = state.books.find((b) => b.barcode === loan.barcode);
    if (book && book.availableCopies < book.totalCopies) {
      book.availableCopies += 1;
    }
    saveState(state);
    return { ok: true };
  },

  // --------------------------------------------------------------------------
  // UNIFIED TRANSCRIPTS & VERIFICATION (REGISTRAR PORTAL <-> STUDENT PORTAL)
  // --------------------------------------------------------------------------
  issueOfficialTranscript(input: {
    studentRegNo: string;
    studentName: string;
    programme: string;
    cgpa: number;
    issuedBy: string;
  }): TranscriptRecord {
    const state = loadState();
    const seq = String(state.transcripts.length + 1).padStart(4, '0');
    const trx: TranscriptRecord = {
      issuanceReference: `TRX-2026-${seq}`,
      studentRegNo: input.studentRegNo.trim().toUpperCase(),
      studentName: input.studentName.trim(),
      programme: input.programme.trim(),
      issueDate: new Date().toISOString().slice(0, 10),
      issuedBy: input.issuedBy,
      verificationCode: `VRF-HCA-${Math.floor(10000 + Math.random() * 90000)}-2026`,
      status: 'ISSUED',
      cgpa: input.cgpa,
    };
    state.transcripts.unshift(trx);
    saveState(state);
    return trx;
  },

  verifyCredentialAnywhere(queryRaw: string): {
    valid: boolean;
    type?: string;
    holder?: string;
    reference?: string;
    detail?: string;
    status?: string;
  } {
    const clean = queryRaw.trim().toUpperCase();
    if (!clean) return { valid: false };

    const state = loadState();
    const trx = state.transcripts.find(
      (t) =>
        t.issuanceReference.toUpperCase() === clean ||
        t.verificationCode.toUpperCase() === clean
    );
    if (trx) {
      return {
        valid: true,
        type: 'Official Academic Transcript',
        holder: `${trx.studentName} (${trx.studentRegNo})`,
        reference: `${trx.issuanceReference} · Code ${trx.verificationCode}`,
        detail: `${trx.programme} · CGPA ${trx.cgpa.toFixed(2)}`,
        status: trx.status,
      };
    }

    const rct = state.transactions.find(
      (tx) =>
        tx.receiptNumber.toUpperCase() === clean ||
        tx.referenceNumber.toUpperCase() === clean
    );
    if (rct) {
      return {
        valid: true,
        type: 'Official Tuition Fee Receipt',
        holder: `${rct.studentName} (${rct.studentRegNo})`,
        reference: `${rct.receiptNumber} · Ref ${rct.referenceNumber}`,
        detail: `KES ${rct.amount.toLocaleString()} (${rct.paymentMethod})`,
        status: rct.status,
      };
    }

    const reg = registrationService.lookupIssuance(clean);
    if (reg) {
      return {
        valid: true,
        type: `${reg.recordType} Registration Credential`,
        holder: reg.recipientName,
        reference: reg.registrationNumber,
        detail: `${reg.programmeOrRole || reg.department} · ${reg.campus}`,
        status: reg.status,
      };
    }

    return { valid: false };
  },
};
