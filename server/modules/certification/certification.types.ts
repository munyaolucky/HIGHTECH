export type CertificationBodyCode =
  | 'ICDL'
  | 'KASNEB'
  | 'TVET_CDACC'
  | 'NITA'
  | 'KNEC'
  | 'HI_TECH_INTERNAL';

export type ProgressionStage =
  | 'REGISTERED'
  | 'MODULES_ASSIGNED'
  | 'LEARNING'
  | 'ASSESSMENT'
  | 'PASSED'
  | 'CERTIFICATION_ELIGIBLE'
  | 'CERTIFIED';

export type ModuleRequirementKind = 'MANDATORY' | 'OPTIONAL' | 'ELECTIVE';

export type QuestionBankType =
  | 'SINGLE_CHOICE_MCQ'
  | 'MULTIPLE_RESPONSE_MCQ'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'FILL_IN_BLANKS'
  | 'MATCHING'
  | 'ORDERING'
  | 'NUMERICAL'
  | 'PRACTICAL_TASK'
  | 'PROGRAMMING_CODE'
  | 'PRONUNCIATION_AUDIO'
  | 'SPELLING_LANGUAGE';

export type QuestionReviewStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';

export type PaperStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED';

export type InvigilatorSessionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'READY'
  | 'ATTENDANCE_IN_PROGRESS'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'UNDER_INVESTIGATION';

export type CandidateAttendanceStatus = 'PENDING' | 'PRESENT' | 'LATE' | 'ABSENT';

export type CreditTransactionType =
  | 'ALLOCATION'
  | 'RESERVATION'
  | 'COMMIT'
  | 'REFUND'
  | 'ADJUSTMENT';

export type CreditApprovalStatus = 'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED';

export type MarkingModerationStatus =
  | 'PENDING_MARKING'
  | 'AI_DRAFT_PENDING_HUMAN_REVIEW'
  | 'MODERATED'
  | 'APPROVED_FOR_RELEASE'
  | 'RELEASED';

export interface CertAcademicDepartment {
  id: string;
  code: string;
  name: string;
  hodName: string;
  hodStaffId: string;
  status: 'ACTIVE' | 'ARCHIVED';
  campusName: string;
  lecturerCount: number;
  programmeCount: number;
}

export interface CertProgramme {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  qualificationLevel: 'Professional' | 'Certificate' | 'Diploma' | 'Short Course';
  durationLabel: string;
  examBody: CertificationBodyCode;
  certificationTitle: string;
  requiredModulesCount: number;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface CertAcademicYearTerm {
  id: string;
  academicYear: string;
  termName: string;
  opensOn: string;
  closesOn: string;
  registrationOpenOn: string;
  registrationCloseOn: string;
  examStartOn: string;
  examEndOn: string;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
}

export interface CertModule {
  id: string;
  code: string;
  title: string;
  programmeId: string;
  programmeName: string;
  examBody: CertificationBodyCode;
  assessmentMode: 'Theory' | 'Practical' | 'Theory & Practical';
  trainingHours: number;
  passMarkPercent: number;
  creditCost: number;
  requirementKind: ModuleRequirementKind;
  prerequisiteModuleIds: string[];
  learningOutcomes: string[];
  studyMaterials: { title: string; kind: 'Notes' | 'Video' | 'Practical Lab'; duration: string }[];
  lecturerId: string;
  lecturerName: string;
}

export interface CertClassCohort {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  programmeId: string;
  programmeName: string;
  academicYear: string;
  termName: string;
  campusName: string;
  intakeName: string;
  studyMode: 'FULL_TIME' | 'PART_TIME' | 'EVENING' | 'WEEKEND' | 'ONLINE';
  capacity: number;
  enrolledStudentRegNos: string[];
  leadLecturerName: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export interface CertModuleAssignment {
  id: string;
  studentRegNo: string;
  studentName: string;
  programmeId: string;
  programmeName: string;
  classId: string;
  className: string;
  moduleId: string;
  moduleCode: string;
  moduleTitle: string;
  requirementKind: ModuleRequirementKind;
  progressPercent: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  examEligible: boolean;
  assignedByName: string;
  assignedAt: string;
}

export interface CertLecturerAllocation {
  id: string;
  moduleId: string;
  moduleCode: string;
  moduleTitle: string;
  classId: string;
  className: string;
  primaryLecturerId: string;
  primaryLecturerName: string;
  assistantLecturerName?: string;
  hodOversightName: string;
  teachingHours: number;
  timetableSummary: string;
}

export interface CreditPackage {
  id: string;
  code: string;
  name: string;
  credits: number;
  priceKes: number;
  examBody: CertificationBodyCode | 'ALL';
  validityDays: number;
  taxPercent: number;
  discountPercent: number;
  active: boolean;
}

export interface ExaminationCreditWallet {
  id: string;
  studentRegNo: string;
  studentName: string;
  programmeName: string;
  availableCredits: number;
  reservedCredits: number;
  consumedCredits: number;
  refundedCredits: number;
  lowCreditThreshold: number;
  status: 'ACTIVE' | 'FROZEN';
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  txRef: string;
  walletId: string;
  studentRegNo: string;
  studentName: string;
  type: CreditTransactionType;
  creditsDelta: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceSessionId?: string;
  referenceLabel?: string;
  reason: string;
  actorId: string;
  actorName: string;
  approvalStatus: CreditApprovalStatus;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface CreditReservation {
  id: string;
  walletId: string;
  studentRegNo: string;
  examId: string;
  examSessionId: string;
  idempotencyKey: string;
  creditsReserved: number;
  status: 'RESERVED' | 'COMMITTED' | 'REFUNDED' | 'RELEASED';
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProgressionRecord {
  studentRegNo: string;
  studentName: string;
  programmeId: string;
  programmeName: string;
  examBody: CertificationBodyCode;
  stage: ProgressionStage;
  assignedModulesCount: number;
  completedModulesCount: number;
  passedExamsCount: number;
  totalRequiredModules: number;
  progressPercent: number;
  eligibleForCertification: boolean;
  eligibilityBlockReason?: string;
  updatedAt: string;
}

export interface QuestionVersionSnapshot {
  version: number;
  prompt: string;
  marks: number;
  options?: string[];
  correctAnswerSummary: string;
  editedByName: string;
  changeNote: string;
  editedAt: string;
}

export interface QuestionBankEntry {
  id: string;
  code: string;
  examBody: CertificationBodyCode;
  programmeId: string;
  programmeName: string;
  moduleCode: string;
  moduleTitle: string;
  topic: string;
  questionType: QuestionBankType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  prompt: string;
  options?: string[];
  correctAnswerKey: string;
  rubricSummary: string;
  status: QuestionReviewStatus;
  version: number;
  aiAssistedDraft: boolean;
  authorId: string;
  authorName: string;
  reviewerName?: string;
  approvedByName?: string;
  approvedAt?: string;
  versions: QuestionVersionSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaperBlueprint {
  id: string;
  code: string;
  title: string;
  examBody: CertificationBodyCode;
  programmeId: string;
  moduleCode: string;
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  creditCost: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  negativeMarking: boolean;
  maxAttempts: number;
  questionIds: string[];
  status: PaperStatus;
  createdByName: string;
  approvedByName?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface InvigilatorCandidateAttendanceRow {
  studentRegNo: string;
  studentName: string;
  emailVerified: boolean;
  accountActive: boolean;
  moduleAssigned: boolean;
  creditsAvailable: number;
  workstation: string;
  attendanceStatus: CandidateAttendanceStatus;
  examConnectionState: 'NOT_STARTED' | 'ACTIVE' | 'DISCONNECTED' | 'SUBMITTED' | 'FLAGGED';
  lastHeartbeatAt?: string;
  verifiedAt?: string;
  verifiedByName?: string;
  lateMinutes?: number;
}

export interface InvigilatorSessionRecord {
  id: string;
  sessionRef: string;
  examId: string;
  paperId: string;
  examTitle: string;
  examBody: CertificationBodyCode;
  moduleCode: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  room: string;
  campusName: string;
  assignedInvigilatorId: string;
  assignedInvigilatorName: string;
  status: InvigilatorSessionStatus;
  candidates: InvigilatorCandidateAttendanceRow[];
  closureReport?: {
    submittedByName: string;
    submittedAt: string;
    registeredCount: number;
    presentCount: number;
    absentCount: number;
    startedCount: number;
    submittedCount: number;
    disconnectedCount: number;
    expiredCount: number;
    incidentCount: number;
    interventionCount: number;
    finalOutcome: string;
    notes: string;
  };
}

export interface ExamMarkingSubmission {
  id: string;
  attemptRef: string;
  examId: string;
  examTitle: string;
  examBody: CertificationBodyCode;
  moduleCode: string;
  studentRegNo: string;
  studentName: string;
  objectiveScore: number;
  manualScore: number;
  totalMarks: number;
  passMark: number;
  aiDraftScore?: number;
  aiDraftFeedback?: string;
  lecturerFeedback: string;
  practicalFeedback?: string;
  moderatorNote?: string;
  moderationStatus: MarkingModerationStatus;
  markedByName?: string;
  moderatedByName?: string;
  approvedByName?: string;
  submittedAt: string;
  releasedAt?: string;
}

export interface DigitalCertificateRecord {
  id: string;
  serialNumber: string;
  verificationCode: string;
  studentRegNo: string;
  studentName: string;
  programmeId: string;
  programmeName: string;
  examBody: CertificationBodyCode;
  qualificationTitle: string;
  issuedByName: string;
  issuedAt: string;
  status: 'ISSUED' | 'REVOKED';
  qrPayload: string;
}

export interface CertificationAuditLog {
  id: string;
  domain: 'ACADEMIC' | 'CREDITS' | 'PROGRESSION' | 'QUESTION_BANK' | 'INVIGILATOR' | 'MARKING' | 'CERTIFICATES';
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface CertificationModuleState {
  departments: CertAcademicDepartment[];
  programmes: CertProgramme[];
  academicPeriods: CertAcademicYearTerm[];
  modules: CertModule[];
  classes: CertClassCohort[];
  moduleAssignments: CertModuleAssignment[];
  lecturerAllocations: CertLecturerAllocation[];
  creditPackages: CreditPackage[];
  wallets: ExaminationCreditWallet[];
  creditTransactions: CreditTransaction[];
  creditReservations: CreditReservation[];
  progressions: CandidateProgressionRecord[];
  questionBank: QuestionBankEntry[];
  examPapers: ExamPaperBlueprint[];
  invigilatorSessions: InvigilatorSessionRecord[];
  markingSubmissions: ExamMarkingSubmission[];
  certificates: DigitalCertificateRecord[];
  auditLogs: CertificationAuditLog[];
  sequences: {
    txSeq: number;
    qSeq: number;
    paperSeq: number;
    certSeq: number;
  };
}
