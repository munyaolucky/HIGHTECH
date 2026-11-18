import {
  INITIAL_DIGITAL_RESOURCES,
  INITIAL_EXAMS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_STUDENT_UNITS,
} from '../data/mockCollegeData';
import {
  BookLoan,
  DigitalResource,
  ExamRecord,
  FeeTransaction,
  LibraryBook,
  StudentProfile,
  TranscriptRecord,
  UnitCourse,
} from '../types';
import { collegeErpService } from './collegeErpService';

export type StudentPortalSection =
  | 'dashboard'
  | 'profile'
  | 'programme'
  | 'academic-progress'
  | 'course-registration'
  | 'timetable'
  | 'calendar'
  | 'attendance'
  | 'elearning'
  | 'examinations'
  | 'results'
  | 'finance'
  | 'receipts'
  | 'library'
  | 'attachment'
  | 'clearance'
  | 'campus-life'
  | 'student-id'
  | 'documents'
  | 'appeals'
  | 'support'
  | 'notifications'
  | 'settings'
  | 'college-information'
  | 'mobile-companion';

export interface StudentContactSettings {
  phoneNumber: string;
  email: string;
  residenceAddress: string;
  nextOfKinName: string;
  nextOfKinRelation: string;
  nextOfKinPhone: string;
  mfaEnabled: boolean;
  smsAlertsEnabled: boolean;
  highContrastMode: boolean;
}

export type PortalOnboardingStage =
  | 'INVITED'
  | 'PENDING'
  | 'INCOMPLETE'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'VERIFIED'
  | 'SUSPENDED'
  | 'GRADUATED';

export interface OnboardingSubmissionEntry {
  id: string;
  stage: PortalOnboardingStage;
  summary: string;
  reviewerNote?: string;
  actor: string;
  timestampIso: string;
}

export interface StudentAssignmentTask {
  id: string;
  unitCode: string;
  title: string;
  dueDate: string;
  dueLabel: string;
  lecturerName: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  submissionNote?: string;
  attachmentName?: string;
  attachmentSize?: string;
  submittedAt?: string;
  scoreLabel?: string;
}

export interface UnitChangeItem {
  id: string;
  action: 'ADD' | 'DROP' | 'SWAP';
  unitCode: string;
  reason: string;
  status: 'PENDING_REGISTRAR' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface DefermentRequestItem {
  id: string;
  type: 'ACADEMIC_LEAVE' | 'DEFERMENT' | 'CAMPUS_TRANSFER';
  targetSemester: string;
  reason: string;
  status: 'SUBMITTED_TO_DEAN' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedBy?: string;
}

export interface AttendanceSessionRecord {
  id: string;
  unitCode: string;
  sessionTitle: string;
  date: string;
  method: 'QR_CHECKIN' | 'LECTURER_ROLL' | 'BIOMETRIC';
  status: 'PRESENT' | 'EXCUSED';
}

export interface ELearningMaterial {
  id: string;
  unitCode: string;
  title: string;
  format: 'SLIDES_PDF' | 'RECORDED_CLASS' | 'LAB_MANUAL';
  durationOrSize: string;
  lecturerName: string;
  completed: boolean;
}

export interface FeeStructureLine {
  code: string;
  voteHead: string;
  amount: number;
}

export interface AttachmentPlacement {
  companyName: string;
  supervisorName: string;
  supervisorPhone: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'NOT_STARTED';
}

export interface AttachmentLogEntry {
  id: string;
  weekNumber: number;
  summary: string;
  skillsApplied: string;
  loggedAt: string;
  status: 'VERIFIED' | 'PENDING_SUPERVISOR';
}

export interface LecturerMessageItem {
  id: string;
  unitCode: string;
  recipientName: string;
  subject: string;
  body: string;
  direction: 'OUTBOUND' | 'INBOUND';
  sentAt: string;
}

export interface OnboardingStepItem {
  stepNumber: number;
  title: string;
  owner: string;
  status: 'COMPLETED' | 'ACTIVE';
}

export interface StudentAuditEntry {
  id: string;
  module: string;
  action: string;
  detail: string;
  timestampIso: string;
}

export interface StudentAppealItem {
  id: string;
  category: 'GRADE_REMARKING' | 'ATTENDANCE_CORRECTION' | 'FEE_WAIVER_REVIEW' | 'EXAM_MISSED';
  unitCode: string;
  subject: string;
  evidenceRef: string;
  reason: string;
  status: 'Under Review' | 'Approved' | 'Rejected' | 'Pending';
  submittedAt: string;
  reviewerComment?: string;
}

export interface StudentUploadedDocument {
  id: string;
  docType: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  verificationStatus: 'Approved' | 'Under Review' | 'Pending';
  verifiedBy: string;
}

export interface StudentPortalState {
  profile: StudentProfile;
  contact: StudentContactSettings;
  onboardingStage: PortalOnboardingStage;
  onboardingReviewerNote?: string;
  onboardingDraftSavedAt?: string;
  onboardingSubmissions: OnboardingSubmissionEntry[];
  semesterReported: boolean;
  semesterReportedAt: string;
  semesterTotalBilled: number;
  feeStructure: FeeStructureLine[];
  sponsorshipStatus: string;
  transactions: FeeTransaction[];
  units: UnitCourse[];
  assignments: StudentAssignmentTask[];
  unitChanges: UnitChangeItem[];
  defermentRequests: DefermentRequestItem[];
  attendanceSessions: AttendanceSessionRecord[];
  elearningMaterials: ELearningMaterial[];
  attachmentPlacement: AttachmentPlacement;
  attachmentLogs: AttachmentLogEntry[];
  clearanceSubmittedAt?: string;
  reservedBookIds: string[];
  messages: LecturerMessageItem[];
  onboardingSteps: OnboardingStepItem[];
  appeals: StudentAppealItem[];
  uploadedDocuments: StudentUploadedDocument[];
  auditLog: StudentAuditEntry[];
}

const STORAGE_KEY = 'hitech_student_portal_v3';

const INITIAL_FEE_STRUCTURE: FeeStructureLine[] = [
  { code: 'VH-01', voteHead: 'Semester 1 Tuition & Instruction Fee', amount: 45000 },
  { code: 'VH-02', voteHead: 'Computer Labs, Cloud & ICT Access', amount: 6000 },
  { code: 'VH-03', voteHead: 'Internal & Examination Assessment Fee', amount: 6500 },
  { code: 'VH-04', voteHead: 'Library, Student Activity & Medical Cover', amount: 5000 },
];

const INITIAL_ONBOARDING: OnboardingStepItem[] = [
  { stepNumber: 1, title: 'Admission Invitation Issued', owner: 'Admissions Office', status: 'COMPLETED' },
  { stepNumber: 2, title: 'Portal Account Activated', owner: 'Student Self-Service', status: 'COMPLETED' },
  { stepNumber: 3, title: 'Security Password Configured', owner: 'Student Self-Service', status: 'COMPLETED' },
  { stepNumber: 4, title: 'Personal & Next-of-Kin Profile Completed', owner: 'Student Self-Service', status: 'COMPLETED' },
  { stepNumber: 5, title: 'KCSE & National ID Documents Uploaded', owner: 'Student Self-Service', status: 'COMPLETED' },
  { stepNumber: 6, title: 'Registrar Document Verification Approved', owner: 'Registrar Office', status: 'COMPLETED' },
  { stepNumber: 7, title: 'Registration Number Issued (HCA/STU/2026/001)', owner: 'Central Reg Engine', status: 'COMPLETED' },
  { stepNumber: 8, title: 'Academic Units Selected (6 Units)', owner: 'Student Self-Service', status: 'COMPLETED' },
  { stepNumber: 9, title: 'Tuition Instalments Verified', owner: 'Finance & Accounts', status: 'COMPLETED' },
  { stepNumber: 10, title: 'Semester 1 Registration Finalized', owner: 'Academic Registry', status: 'COMPLETED' },
  { stepNumber: 11, title: 'Timetable, Library & LMS Unlocked', owner: 'HI-TECH ERP', status: 'COMPLETED' },
];

const INITIAL_ASSIGNMENTS: StudentAssignmentTask[] = [
  {
    id: 'asg-1',
    unitCode: 'SWE 304',
    title: 'Web Technologies & Cloud REST API Lab',
    dueDate: '2026-11-14',
    dueLabel: 'Tomorrow · 11:59 PM',
    lecturerName: 'Eunice Mutua',
    status: 'PENDING',
  },
  {
    id: 'asg-2',
    unitCode: 'CSC 302',
    title: 'Distributed Database Partitioning & Indexing Case Study',
    dueDate: '2026-11-19',
    dueLabel: '19 Nov 2026 · 5:00 PM',
    lecturerName: 'Prof. Mary Wangui',
    status: 'PENDING',
  },
  {
    id: 'asg-3',
    unitCode: 'CSC 301',
    title: 'Balanced AVL & Red-Black Tree Complexity Report',
    dueDate: '2026-10-28',
    dueLabel: '28 Oct 2026',
    lecturerName: 'Dr. Peter Otieno',
    status: 'GRADED',
    submissionNote: 'Submitted empirical benchmark suite.',
    submittedAt: '2026-10-27T18:40:00Z',
    scoreLabel: '28 / 30 CAT Marks',
  },
];

const INITIAL_ATTENDANCE_SESSIONS: AttendanceSessionRecord[] = [
  { id: 'att-1', unitCode: 'CSC 301', sessionTitle: 'Week 9: Balanced Trees Lab', date: '2026-11-10', method: 'QR_CHECKIN', status: 'PRESENT' },
  { id: 'att-2', unitCode: 'SWE 304', sessionTitle: 'Week 9: Microservice Gateways', date: '2026-11-09', method: 'BIOMETRIC', status: 'PRESENT' },
  { id: 'att-3', unitCode: 'NET 303', sessionTitle: 'Week 8: Firewall Packet Capture', date: '2026-11-06', method: 'QR_CHECKIN', status: 'PRESENT' },
  { id: 'att-4', unitCode: 'CSC 302', sessionTitle: 'Week 8: Raft Consensus Seminar', date: '2026-11-05', method: 'LECTURER_ROLL', status: 'PRESENT' },
];

const INITIAL_ELEARNING: ELearningMaterial[] = [
  { id: 'el-1', unitCode: 'CSC 301', title: 'Module 4: Red-Black & B-Tree Balancing Slides', format: 'SLIDES_PDF', durationOrSize: '3.2 MB PDF', lecturerName: 'Dr. Peter Otieno', completed: true },
  { id: 'el-2', unitCode: 'SWE 304', title: 'Live Workshop Recording: Containerized TypeScript APIs', format: 'RECORDED_CLASS', durationOrSize: '54 mins HD', lecturerName: 'Eunice Mutua', completed: false },
  { id: 'el-3', unitCode: 'NET 303', title: 'Cyber Lab Workbook: Wireshark TLS Handshake Analysis', format: 'LAB_MANUAL', durationOrSize: '4.6 MB PDF', lecturerName: 'Eng. David Kiprono', completed: false },
  { id: 'el-4', unitCode: 'CSC 302', title: 'Module 5: Sharding, Consistent Hashing & MVCC', format: 'SLIDES_PDF', durationOrSize: '2.9 MB PDF', lecturerName: 'Prof. Mary Wangui', completed: true },
  { id: 'el-5', unitCode: 'MAT 205', title: 'Graph Theory & Combinatorics Problem Set Solutions', format: 'LAB_MANUAL', durationOrSize: '1.8 MB PDF', lecturerName: 'Dr. Samuel Kiarie', completed: false },
];

const INITIAL_MESSAGES: LecturerMessageItem[] = [
  {
    id: 'msg-1',
    unitCode: 'CSC 301',
    recipientName: 'Dr. Peter Otieno',
    subject: 'CAT 1 Review & Lab Session Room Change',
    body: 'Please bring your lab workbook to Tech Wing Lab 3B for Monday tree traversal practical.',
    direction: 'INBOUND',
    sentAt: '2026-11-10T09:15:00Z',
  },
  {
    id: 'msg-2',
    unitCode: 'NET 303',
    recipientName: 'Eng. David Kiprono',
    subject: 'Wireshark Packet Capture Dataset Uploaded',
    body: 'The forensic PCAP exercise is now accessible in Digital Library and E-Learning lab manuals.',
    direction: 'INBOUND',
    sentAt: '2026-11-08T13:20:00Z',
  },
];

const INITIAL_APPEALS: StudentAppealItem[] = [
  {
    id: 'apl-1',
    category: 'ATTENDANCE_CORRECTION',
    unitCode: 'SWE 304',
    subject: 'Medical Excusal for Week 6 Cloud Lab',
    evidenceRef: 'CLINIC_NOTE_2026_104.pdf',
    reason: 'Attended outpatient clinic on Tuesday afternoon; signed lecturer excusal attached.',
    status: 'Approved',
    submittedAt: '2026-10-20T11:30:00Z',
    reviewerComment: 'Verified against medical clinic slip. Session excused by HOD.',
  },
];

const INITIAL_UPLOADED_DOCS: StudentUploadedDocument[] = [
  {
    id: 'udoc-1',
    docType: 'KCSE Official Result Slip',
    fileName: 'Amina_Wanjiku_KCSE_2023.pdf',
    uploadedAt: '2026-01-08',
    verificationStatus: 'Approved',
    verifiedBy: 'Academic Registrar',
  },
  {
    id: 'udoc-2',
    docType: 'National Identification Card (Front & Back)',
    fileName: 'National_ID_39104218.pdf',
    uploadedAt: '2026-01-08',
    verificationStatus: 'Approved',
    verifiedBy: 'Admissions Desk',
  },
  {
    id: 'udoc-3',
    docType: 'Signed Medical & Student Code Declaration',
    fileName: 'Medical_Fitness_Form_2026.pdf',
    uploadedAt: '2026-01-10',
    verificationStatus: 'Under Review',
    verifiedBy: 'Dean of Students Desk',
  },
];

function buildInitialState(): StudentPortalState {
  const ownTransactions = collegeErpService.getStudentTransactions(
    INITIAL_STUDENT_PROFILE.registrationNumber
  );
  const semesterTotalBilled = INITIAL_FEE_STRUCTURE.reduce((sum, line) => sum + line.amount, 0);

  return {
    profile: { ...INITIAL_STUDENT_PROFILE },
    contact: {
      phoneNumber: INITIAL_STUDENT_PROFILE.phoneNumber,
      email: INITIAL_STUDENT_PROFILE.email,
      residenceAddress: 'Kasarani Academic Gardens, Nairobi',
      nextOfKinName: 'Grace Njeri Wanjiku',
      nextOfKinRelation: 'Mother / Guardian',
      nextOfKinPhone: '+254 722 910 445',
      mfaEnabled: true,
      smsAlertsEnabled: true,
      highContrastMode: false,
    },
    onboardingStage: 'VERIFIED',
    onboardingReviewerNote: undefined,
    onboardingDraftSavedAt: '2026-01-12T08:40:00Z',
    onboardingSubmissions: [
      {
        id: 'onb-init-1',
        stage: 'VERIFIED',
        summary: 'Student contact profile, Next of Kin details, and Registrar identity verification approved.',
        actor: 'Dr. Kiprop Chemweno (Academic Registrar)',
        timestampIso: '2026-01-12T08:45:00Z',
      },
    ],
    semesterReported: true,
    semesterReportedAt: '2026-01-12T08:45:00Z',
    semesterTotalBilled,
    feeStructure: INITIAL_FEE_STRUCTURE,
    sponsorshipStatus: 'Self-Sponsored / HELB Loan Pending Verification',
    transactions: ownTransactions,
    units: [...INITIAL_STUDENT_UNITS],
    assignments: INITIAL_ASSIGNMENTS,
    unitChanges: [],
    defermentRequests: [],
    attendanceSessions: INITIAL_ATTENDANCE_SESSIONS,
    elearningMaterials: INITIAL_ELEARNING,
    attachmentPlacement: {
      companyName: 'Safaricom Cloud & Digital Labs',
      supervisorName: 'Eng. Victor Kimani',
      supervisorPhone: '+254 722 100 908',
      startDate: '2026-05-04',
      endDate: '2026-07-31',
      status: 'ACTIVE',
    },
    attachmentLogs: [
      {
        id: 'attlog-1',
        weekNumber: 1,
        summary: 'Completed Linux server hardening, SSH key rotation, and Nginx reverse-proxy lab.',
        skillsApplied: 'Ubuntu Server, Nginx, TLS, Bash',
        loggedAt: '2026-11-08',
        status: 'VERIFIED',
      },
    ],
    reservedBookIds: [],
    messages: INITIAL_MESSAGES,
    onboardingSteps: INITIAL_ONBOARDING,
    appeals: INITIAL_APPEALS,
    uploadedDocuments: INITIAL_UPLOADED_DOCS,
    auditLog: [
      {
        id: 'aud-init-1',
        module: 'Security',
        action: 'SESSION_INITIALIZED',
        detail: `Authenticated student session for ${INITIAL_STUDENT_PROFILE.registrationNumber}`,
        timestampIso: '2026-11-13T08:00:00Z',
      },
    ],
  };
}

function loadState(): StudentPortalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildInitialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<StudentPortalState>;
    const defaults = buildInitialState();
    return {
      ...defaults,
      ...parsed,
      contact: { ...defaults.contact, ...(parsed.contact ?? {}) },
      onboardingStage: parsed.onboardingStage ?? defaults.onboardingStage,
      onboardingSubmissions: parsed.onboardingSubmissions ?? defaults.onboardingSubmissions,
      appeals: parsed.appeals ?? defaults.appeals,
      uploadedDocuments: parsed.uploadedDocuments ?? defaults.uploadedDocuments,
    };
  } catch {
    return buildInitialState();
  }
}

function saveState(state: StudentPortalState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage limits
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hitech-erp-sync'));
  }
}

function appendAudit(state: StudentPortalState, module: string, action: string, detail: string): void {
  state.auditLog.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    module,
    action,
    detail,
    timestampIso: new Date().toISOString(),
  });
}

export function downloadStudentDocument(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const studentPortalService = {
  getState(): StudentPortalState {
    const state = loadState();
    const syncedTx = collegeErpService.getStudentTransactions(state.profile.registrationNumber);
    state.transactions = syncedTx;
    const totalPaid = syncedTx.reduce((acc, tx) => acc + tx.amount, 0);
    state.profile.feeBalance = Math.max(0, state.semesterTotalBilled - totalPaid);
    return state;
  },

  getFinancialSummary() {
    const state = this.getState();
    const totalPaid = state.transactions.reduce((acc, tx) => acc + tx.amount, 0);
    const totalBilled = state.semesterTotalBilled;
    const balance = Math.max(0, totalBilled - totalPaid);
    const percentPaid = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 100;
    return {
      totalBilled,
      totalPaid,
      balance,
      percentPaid,
      examCleared: balance === 0,
    };
  },

  getStaticResources(): {
    books: LibraryBook[];
    loans: BookLoan[];
    digitalResources: DigitalResource[];
    exams: ExamRecord[];
    transcripts: TranscriptRecord[];
  } {
    const state = loadState();
    const erpState = collegeErpService.getState();
    return {
      books: erpState.books,
      loans: erpState.loans.filter(
        (l) => l.borrowerRegNo.toUpperCase() === state.profile.registrationNumber.toUpperCase()
      ),
      digitalResources: INITIAL_DIGITAL_RESOURCES,
      exams: INITIAL_EXAMS,
      transcripts: erpState.transcripts.filter(
        (t) => t.studentRegNo.toUpperCase() === state.profile.registrationNumber.toUpperCase()
      ),
    };
  },

  confirmSemesterReporting(): { ok: boolean } {
    const state = loadState();
    state.semesterReported = true;
    state.semesterReportedAt = new Date().toISOString();
    appendAudit(state, 'Registration', 'NOMINAL_ROLL_REPORTED', `Reported for ${state.profile.academicYear} ${state.profile.semester}`);
    saveState(state);
    return { ok: true };
  },

  submitDefermentOrTransfer(input: {
    type: 'ACADEMIC_LEAVE' | 'DEFERMENT' | 'CAMPUS_TRANSFER';
    targetSemester: string;
    reason: string;
  }): { ok: boolean; error?: string } {
    if (input.reason.trim().length < 10) {
      return { ok: false, error: 'Provide a clear reason (at least 10 characters) for Academic Registry review.' };
    }
    const state = loadState();
    state.defermentRequests.unshift({
      id: `def-${Date.now()}`,
      type: input.type,
      targetSemester: input.targetSemester,
      reason: input.reason.trim(),
      status: 'SUBMITTED_TO_DEAN',
      requestedAt: new Date().toISOString(),
    });
    appendAudit(state, 'Academic Leave', input.type, `${input.targetSemester} submitted to Dean & Registrar`);
    saveState(state);
    return { ok: true };
  },

  checkInAttendanceCode(unitCode: string, sessionCode: string): { ok: boolean; error?: string } {
    const code = sessionCode.trim().toUpperCase();
    if (code.length < 4) {
      return { ok: false, error: 'Enter the 4+ character lecturer session code displayed in class.' };
    }
    const state = loadState();
    state.attendanceSessions.unshift({
      id: `att-${Date.now()}`,
      unitCode,
      sessionTitle: `Live QR Check-In (${code})`,
      date: new Date().toISOString().slice(0, 10),
      method: 'QR_CHECKIN',
      status: 'PRESENT',
    });
    const unit = state.units.find((u) => u.code === unitCode);
    if (unit && unit.attendance < 100) {
      unit.attendance = Math.min(100, unit.attendance + 1);
    }
    state.profile.attendanceRate = Math.round(
      state.units.reduce((sum, u) => sum + u.attendance, 0) / state.units.length
    );
    appendAudit(state, 'Attendance', 'QR_CLASS_CHECKIN', `Marked present for ${unitCode} using code ${code}`);
    saveState(state);
    return { ok: true };
  },

  toggleELearningComplete(materialId: string): void {
    const state = loadState();
    const item = state.elearningMaterials.find((m) => m.id === materialId);
    if (!item) return;
    item.completed = !item.completed;
    appendAudit(state, 'E-Learning', item.completed ? 'MATERIAL_COMPLETED' : 'MATERIAL_REOPENED', item.title);
    saveState(state);
  },

  saveAttachmentPlacement(placement: AttachmentPlacement): { ok: boolean; error?: string } {
    if (!placement.companyName.trim() || !placement.supervisorName.trim()) {
      return { ok: false, error: 'Host company and workplace supervisor name are required.' };
    }
    const state = loadState();
    state.attachmentPlacement = { ...placement, status: 'ACTIVE' };
    appendAudit(state, 'Attachment', 'PLACEMENT_UPDATED', `Updated industrial placement at ${placement.companyName}`);
    saveState(state);
    return { ok: true };
  },

  addAttachmentLog(summary: string, skillsApplied: string): { ok: boolean; error?: string } {
    if (summary.trim().length < 10) {
      return { ok: false, error: 'Logbook weekly summary must describe tasks performed (10+ characters).' };
    }
    const state = loadState();
    const nextWeek = state.attachmentLogs.length + 1;
    state.attachmentLogs.unshift({
      id: `attlog-${Date.now()}`,
      weekNumber: nextWeek,
      summary: summary.trim(),
      skillsApplied: skillsApplied.trim() || 'Core Industry Skills',
      loggedAt: new Date().toISOString().slice(0, 10),
      status: 'PENDING_SUPERVISOR',
    });
    appendAudit(state, 'Attachment', 'LOGBOOK_SUBMITTED', `Week ${nextWeek} attachment logbook saved`);
    saveState(state);
    return { ok: true };
  },

  submitClearance(): { ok: boolean } {
    const state = loadState();
    state.clearanceSubmittedAt = new Date().toISOString();
    appendAudit(state, 'Clearance', 'CLEARANCE_INITIATED', 'Submitted multi-department student clearance checklist');
    saveState(state);
    return { ok: true };
  },

  getProfileCompletion(candidateContact?: Partial<StudentContactSettings>): {
    percent: number;
    completedCount: number;
    totalCount: number;
    missingFields: string[];
  } {
    const state = loadState();
    const contact = { ...state.contact, ...(candidateContact ?? {}) };
    const hasKcseDoc = state.uploadedDocuments.some((d) =>
      d.docType.toLowerCase().includes('kcse')
    );
    const hasIdDoc = state.uploadedDocuments.some((d) =>
      d.docType.toLowerCase().includes('national id')
    );

    const checklist: [string, boolean][] = [
      ['Student Email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())],
      ['Mobile Phone', contact.phoneNumber.trim().length >= 9],
      ['Residence Address', contact.residenceAddress.trim().length >= 5],
      ['Next of Kin Full Name', contact.nextOfKinName.trim().length >= 3],
      ['Next of Kin Relationship', contact.nextOfKinRelation.trim().length >= 3],
      ['Next of Kin Phone', contact.nextOfKinPhone.trim().length >= 9],
      ['KCSE Result Slip', hasKcseDoc],
      ['National ID Copy', hasIdDoc],
    ];

    const completedCount = checklist.filter(([, ok]) => ok).length;
    const totalCount = checklist.length;
    const missingFields = checklist.filter(([, ok]) => !ok).map(([label]) => label);
    return {
      percent: Math.round((completedCount / totalCount) * 100),
      completedCount,
      totalCount,
      missingFields,
    };
  },

  saveOnboardingDraft(patch: Partial<StudentContactSettings>): { ok: boolean; savedAt: string } {
    const state = loadState();
    const savedAt = new Date().toISOString();
    state.contact = { ...state.contact, ...patch };
    if (patch.phoneNumber?.trim()) state.profile.phoneNumber = patch.phoneNumber.trim();
    if (patch.email?.trim()) state.profile.email = patch.email.trim();
    state.onboardingDraftSavedAt = savedAt;
    if (
      state.onboardingStage === 'INVITED' ||
      state.onboardingStage === 'PENDING' ||
      state.onboardingStage === 'RETURNED'
    ) {
      state.onboardingStage = 'INCOMPLETE';
    }
    appendAudit(state, 'Profile', 'ONBOARDING_DRAFT_SAVED', 'Saved partial profile & Next-of-Kin draft');
    saveState(state);
    return { ok: true, savedAt };
  },

  submitOnboardingProfile(patch: Partial<StudentContactSettings>): {
    ok: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
  } {
    const state = loadState();
    const merged: StudentContactSettings = { ...state.contact, ...patch };
    const fieldErrors: Record<string, string> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merged.email.trim())) {
      fieldErrors.email = 'Enter a valid student email address (e.g. name@students.hitech.ac.ke).';
    }
    if (merged.phoneNumber.replace(/\s+/g, '').length < 9) {
      fieldErrors.phoneNumber = 'Enter a valid Kenyan mobile phone number (minimum 9 digits).';
    }
    if (merged.residenceAddress.trim().length < 5) {
      fieldErrors.residenceAddress = 'Enter your current residential estate, street, or town (minimum 5 characters).';
    }
    if (merged.nextOfKinName.trim().length < 3) {
      fieldErrors.nextOfKinName = 'Enter the full legal name of your parent or Next of Kin.';
    }
    if (merged.nextOfKinRelation.trim().length < 3) {
      fieldErrors.nextOfKinRelation = 'Specify relationship (e.g. Mother, Father, Guardian, Spouse).';
    }
    if (merged.nextOfKinPhone.replace(/\s+/g, '').length < 9) {
      fieldErrors.nextOfKinPhone = 'Enter a reachable Next of Kin emergency phone number (minimum 9 digits).';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        error: `Please correct ${Object.keys(fieldErrors).length} highlighted field(s) before submitting your profile.`,
        fieldErrors,
      };
    }

    state.contact = {
      ...merged,
      email: merged.email.trim(),
      phoneNumber: merged.phoneNumber.trim(),
      residenceAddress: merged.residenceAddress.trim(),
      nextOfKinName: merged.nextOfKinName.trim(),
      nextOfKinRelation: merged.nextOfKinRelation.trim(),
      nextOfKinPhone: merged.nextOfKinPhone.trim(),
    };
    state.profile.email = state.contact.email;
    state.profile.phoneNumber = state.contact.phoneNumber;

    const nextStage: PortalOnboardingStage =
      state.onboardingStage === 'VERIFIED' ? 'VERIFIED' : 'SUBMITTED';
    state.onboardingStage = nextStage;
    state.onboardingReviewerNote =
      nextStage === 'SUBMITTED'
        ? 'Submitted to Academic Registrar for verification.'
        : state.onboardingReviewerNote;

    state.onboardingSubmissions.unshift({
      id: `onb-${Date.now()}`,
      stage: nextStage,
      summary:
        nextStage === 'VERIFIED'
          ? 'Updated verified contact and Next-of-Kin record.'
          : 'Submitted complete personal and Next-of-Kin onboarding profile for Registrar verification.',
      actor: state.profile.fullName,
      timestampIso: new Date().toISOString(),
    });
    appendAudit(
      state,
      'Profile',
      nextStage === 'VERIFIED' ? 'CONTACT_UPDATED' : 'ONBOARDING_SUBMITTED',
      'Submitted validated student contact & Next-of-Kin record'
    );
    saveState(state);
    return { ok: true };
  },

  setOnboardingStage(stage: PortalOnboardingStage, reviewerNote?: string): { ok: boolean } {
    const state = loadState();
    state.onboardingStage = stage;
    state.onboardingReviewerNote = reviewerNote;
    if (stage === 'SUSPENDED') {
      state.profile.status = 'SUSPENDED';
    } else if (stage === 'GRADUATED') {
      state.profile.status = 'GRADUATED';
    } else if (stage === 'VERIFIED') {
      state.profile.status = 'ACTIVE';
    }
    state.onboardingSubmissions.unshift({
      id: `onb-${Date.now()}`,
      stage,
      summary: `Onboarding / portal standing set to ${stage}.`,
      reviewerNote,
      actor: 'Academic Registry Workflow',
      timestampIso: new Date().toISOString(),
    });
    appendAudit(state, 'Profile', 'ONBOARDING_STAGE_CHANGED', `Portal onboarding stage updated to ${stage}`);
    saveState(state);
    return { ok: true };
  },

  updateContactDetails(patch: Partial<StudentContactSettings>): {
    ok: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
  } {
    return this.submitOnboardingProfile(patch);
  },

  updateSecurityFlags(patch: {
    mfaEnabled?: boolean;
    smsAlertsEnabled?: boolean;
    highContrastMode?: boolean;
    passwordRotated?: boolean;
  }): void {
    const state = loadState();
    if (patch.mfaEnabled !== undefined) state.contact.mfaEnabled = patch.mfaEnabled;
    if (patch.smsAlertsEnabled !== undefined) state.contact.smsAlertsEnabled = patch.smsAlertsEnabled;
    if (patch.highContrastMode !== undefined) state.contact.highContrastMode = patch.highContrastMode;
    if (patch.passwordRotated) {
      appendAudit(state, 'Security', 'PASSWORD_ROTATED', 'Student rotated portal sign-in password');
    } else {
      appendAudit(state, 'Security', 'PREFERENCES_UPDATED', 'Updated MFA or notification alert preferences');
    }
    saveState(state);
  },

  submitUnitChangeRequest(input: {
    action: 'ADD' | 'DROP' | 'SWAP';
    unitCode: string;
    reason: string;
  }): { ok: boolean; error?: string } {
    if (!input.unitCode.trim() || input.reason.trim().length < 5) {
      return { ok: false, error: 'Select a unit code and provide a brief academic reason.' };
    }
    const state = loadState();
    state.unitChanges.unshift({
      id: `uc-${Date.now()}`,
      action: input.action,
      unitCode: input.unitCode.trim(),
      reason: input.reason.trim(),
      status: 'PENDING_REGISTRAR',
      requestedAt: new Date().toISOString(),
    });
    appendAudit(state, 'Registration', 'UNIT_CHANGE_REQUESTED', `${input.action} ${input.unitCode} sent to Registrar`);
    saveState(state);
    return { ok: true };
  },

  submitAssignment(
    assignmentId: string,
    submissionNote: string,
    attachment?: { fileName: string; fileSize: string }
  ): { ok: boolean; error?: string } {
    const trimmedNote = submissionNote.trim();
    if (trimmedNote.length < 6 && !attachment?.fileName) {
      return { ok: false, error: 'Provide a submission note (6+ chars), repository URL, or attach a lab/report file.' };
    }
    const state = loadState();
    const target = state.assignments.find((a) => a.id === assignmentId);
    if (!target) return { ok: false, error: 'Assignment record not found.' };
    if (target.status !== 'PENDING') return { ok: false, error: 'Assignment was already submitted.' };
    target.status = 'SUBMITTED';
    target.submissionNote = trimmedNote || `Uploaded file: ${attachment?.fileName}`;
    if (attachment?.fileName) {
      target.attachmentName = attachment.fileName;
      target.attachmentSize = attachment.fileSize;
    }
    target.submittedAt = new Date().toISOString();
    appendAudit(
      state,
      'Assignments',
      'ASSIGNMENT_SUBMITTED',
      `${target.unitCode}: ${target.title}${attachment?.fileName ? ` (${attachment.fileName})` : ''}`
    );
    saveState(state);
    return { ok: true };
  },

  recordMpesaPayment(phone: string, amountKes: number): { ok: boolean; receiptNumber?: string; transaction?: FeeTransaction; error?: string } {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      return { ok: false, error: 'Enter a valid M-Pesa phone number (e.g. 0712345678).' };
    }
    const state = loadState();
    const posted = collegeErpService.recordFeePayment({
      studentRegNo: state.profile.registrationNumber,
      studentName: state.profile.fullName,
      amount: amountKes,
      paymentMethod: 'M-PESA',
      phoneOrRef: cleanPhone,
      description: `Lipa na M-Pesa STK Settlement (${cleanPhone})`,
    });
    if (!posted.ok || !posted.transaction) {
      return { ok: false, error: posted.error ?? 'M-Pesa settlement failed.' };
    }

    const syncedTx = collegeErpService.getStudentTransactions(state.profile.registrationNumber);
    state.transactions = syncedTx;
    const totalPaid = syncedTx.reduce((acc, tx) => acc + tx.amount, 0);
    state.profile.feeBalance = Math.max(0, state.semesterTotalBilled - totalPaid);
    appendAudit(
      state,
      'Finance',
      'MPESA_PAYMENT_VERIFIED',
      `Receipt ${posted.transaction.receiptNumber} (${posted.transaction.referenceNumber}) for KES ${posted.transaction.amount.toLocaleString()}`
    );
    saveState(state);
    return { ok: true, receiptNumber: posted.transaction.receiptNumber, transaction: posted.transaction };
  },

  reserveBook(bookId: string): { ok: boolean; error?: string } {
    const state = loadState();
    const book = collegeErpService.getState().books.find((b) => b.id === bookId);
    if (!book) {
      return { ok: false, error: 'Book copy not found in library catalogue.' };
    }
    const res = collegeErpService.issueOrReserveBook({
      barcode: book.barcode,
      studentRegNo: state.profile.registrationNumber,
      studentName: state.profile.fullName,
    });
    if (!res.ok) return { ok: false, error: res.error };

    if (!state.reservedBookIds.includes(bookId)) {
      state.reservedBookIds.push(bookId);
    }
    appendAudit(state, 'Library', 'BOOK_HOLD_PLACED', `Reserved "${book.title}" (${book.barcode})`);
    saveState(state);
    return { ok: true };
  },

  reviewUnitChangeRequest(requestId: string, decision: 'APPROVED' | 'REJECTED'): { ok: boolean } {
    const state = loadState();
    const req = state.unitChanges.find((u) => u.id === requestId);
    if (!req) return { ok: false };
    req.status = decision;
    if (decision === 'APPROVED') {
      const code = req.unitCode.split('—')[0].trim();
      const title = req.unitCode.split('—')[1]?.trim() || req.unitCode;
      if (req.action === 'ADD' && !state.units.some((u) => u.code === code)) {
        state.units.push({
          code,
          title,
          credits: 3,
          lecturerName: 'Assigned Departmental Lecturer',
          day: 'Friday',
          time: '2:00 PM - 5:00 PM',
          room: 'Lecture Hall 204',
          attendance: 100,
        });
        state.profile.registeredCourses = state.units.length;
      } else if (req.action === 'DROP') {
        state.units = state.units.filter((u) => u.code !== code);
        state.profile.registeredCourses = state.units.length;
      }
    }
    appendAudit(state, 'Registrar', `UNIT_CHANGE_${decision}`, `${req.action} ${req.unitCode}`);
    saveState(state);
    return { ok: true };
  },

  reviewDefermentRequest(requestId: string, decision: 'APPROVED' | 'REJECTED'): { ok: boolean } {
    const state = loadState();
    const req = state.defermentRequests.find((d) => d.id === requestId);
    if (!req) return { ok: false };
    req.status = decision;
    req.reviewedBy = 'Dr. Kiprop Chemweno (Chief Academic Registrar)';
    if (decision === 'APPROVED' && req.type === 'DEFERMENT') {
      state.profile.status = 'DEFERRED';
    }
    appendAudit(state, 'Registrar', `LEAVE_REQUEST_${decision}`, `${req.type} (${req.targetSemester})`);
    saveState(state);
    return { ok: true };
  },

  replyFromFaculty(unitCode: string, senderName: string, subject: string, body: string): void {
    const state = loadState();
    state.messages.unshift({
      id: `msg-${Date.now()}`,
      unitCode,
      recipientName: senderName,
      subject,
      body,
      direction: 'INBOUND',
      sentAt: new Date().toISOString(),
    });
    appendAudit(state, 'Communication', 'FACULTY_REPLY_RECEIVED', `${senderName}: ${subject}`);
    saveState(state);
  },

  sendLecturerMessage(unitCode: string, subject: string, body: string): { ok: boolean; error?: string } {
    if (!subject.trim() || !body.trim()) {
      return { ok: false, error: 'Both message subject and body are required.' };
    }
    const state = loadState();
    const unit = state.units.find((u) => u.code === unitCode);
    const recipientName = unit?.lecturerName ?? 'Course Lecturer';
    state.messages.unshift({
      id: `msg-${Date.now()}`,
      unitCode,
      recipientName,
      subject: subject.trim(),
      body: body.trim(),
      direction: 'OUTBOUND',
      sentAt: new Date().toISOString(),
    });
    appendAudit(state, 'Communication', 'LECTURER_MESSAGED', `Sent message to ${recipientName} (${unitCode})`);
    saveState(state);
    return { ok: true };
  },

  submitAppeal(input: {
    category: StudentAppealItem['category'];
    unitCode: string;
    subject: string;
    evidenceRef: string;
    reason: string;
  }): { ok: boolean; error?: string } {
    if (!input.subject.trim() || input.reason.trim().length < 10) {
      return { ok: false, error: 'Provide a clear appeal subject and detailed academic justification (min 10 chars).' };
    }
    const state = loadState();
    state.appeals.unshift({
      id: `apl-${Date.now()}`,
      category: input.category,
      unitCode: input.unitCode.trim() || 'GENERAL',
      subject: input.subject.trim(),
      evidenceRef: input.evidenceRef.trim() || 'Student_Statement_2026.pdf',
      reason: input.reason.trim(),
      status: 'Under Review',
      submittedAt: new Date().toISOString(),
    });
    appendAudit(state, 'Appeals', 'APPEAL_SUBMITTED', `${input.category} · ${input.unitCode}: ${input.subject}`);
    saveState(state);
    return { ok: true };
  },

  cancelAppeal(appealId: string): { ok: boolean; error?: string } {
    const state = loadState();
    const target = state.appeals.find((a) => a.id === appealId);
    if (!target) return { ok: false, error: 'Appeal record not found.' };
    if (target.status === 'Approved') {
      return { ok: false, error: 'Approved academic appeals cannot be withdrawn.' };
    }
    state.appeals = state.appeals.filter((a) => a.id !== appealId);
    appendAudit(state, 'Appeals', 'APPEAL_WITHDRAWN', `Withdrew appeal: ${target.subject}`);
    saveState(state);
    return { ok: true };
  },

  uploadOrReplaceDocument(
    docId: string | null,
    docType: string,
    fileName: string,
    fileSize?: string
  ): { ok: boolean; error?: string } {
    if (!fileName.trim() || !docType.trim()) {
      return { ok: false, error: 'Specify document category and select a file or reference.' };
    }
    const state = loadState();
    const today = new Date().toISOString().slice(0, 10);
    if (docId) {
      const existing = state.uploadedDocuments.find((d) => d.id === docId);
      if (existing) {
        existing.fileName = fileName.trim();
        existing.fileSize = fileSize ?? existing.fileSize;
        existing.uploadedAt = today;
        existing.verificationStatus = 'Under Review';
        existing.verifiedBy = 'Pending Registrar Audit';
        appendAudit(state, 'Documents', 'DOCUMENT_REPLACED', `Replaced ${existing.docType} (${fileName.trim()})`);
        saveState(state);
        return { ok: true };
      }
    }
    state.uploadedDocuments.unshift({
      id: `udoc-${Date.now()}`,
      docType: docType.trim(),
      fileName: fileName.trim(),
      fileSize,
      uploadedAt: today,
      verificationStatus: 'Pending',
      verifiedBy: 'Awaiting Admissions Queue',
    });
    appendAudit(state, 'Documents', 'DOCUMENT_UPLOADED', `Uploaded ${docType.trim()} (${fileName.trim()})`);
    saveState(state);
    return { ok: true };
  },
};
