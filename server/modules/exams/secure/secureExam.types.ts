export type SecureExamSessionStatus = 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED';

export type SecureExamQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER';

export type ExamSecurityEventType =
  | 'TAB_HIDDEN'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CUT_ATTEMPT'
  | 'CONTEXT_MENU'
  | 'PROHIBITED_SHORTCUT'
  | 'DRAG_ATTEMPT'
  | 'CONNECTION_LOST'
  | 'CONNECTION_RESTORED';

export type ExamIncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'DISMISSED' | 'CONFIRMED';

export type ExamIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type ViolationResponseAction =
  | 'WARNING'
  | 'WARNING_AND_LOG'
  | 'NOTIFY_SUPERVISOR'
  | 'SUPERVISOR_REVIEW'
  | 'BLOCK_AND_LOG';

export interface ExamSecurityPolicy {
  securityLevel: 'LEVEL_1_WEB' | 'LEVEL_2_LOCKED';
  requireFullscreen: boolean;
  disableCopy: boolean;
  disablePaste: boolean;
  disableCut: boolean;
  disableRightClick: boolean;
  blockProhibitedShortcuts: boolean;
  trackTabSwitching: boolean;
  trackFullscreenExit: boolean;
  autoSaveAnswers: boolean;
  autoSubmitOnExpiry: boolean;
  logSecurityIncidents: boolean;
  requireWebcamMonitoring: boolean;
  requireScreenRecording: boolean;
  restrictToManagedDevices: boolean;
  requireSafeExamBrowser: boolean;
  tabSwitchWarningAt: number;
  tabSwitchIncidentAt: number;
  tabSwitchSupervisorAt: number;
  fullscreenExitSupervisorAt: number;
}

export interface SecureExamOption {
  id: string;
  text: string;
}

export interface SecureExamQuestionRecord {
  id: string;
  number: number;
  type: SecureExamQuestionType;
  instruction?: string;
  text: string;
  marks: number;
  options?: SecureExamOption[];
  correctOptionIds?: string[];
}

export interface SecureExamDefinitionRecord {
  id: string;
  code: string;
  title: string;
  subject: string;
  unitCode: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  startsAt: string;
  endsAt: string;
  maxAttempts: number;
  instructions: string[];
  securityPolicy: ExamSecurityPolicy;
  questions: SecureExamQuestionRecord[];
  updatedAt: string;
}

export interface SecureExamAnswerRecord {
  questionId: string;
  value: string | string[];
  updatedAt: string;
  savedAt: string;
}

export interface SecureExamSessionRecord {
  id: string;
  examId: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  attemptNumber: number;
  status: SecureExamSessionStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  lastSavedAt?: string;
  lastHeartbeatAt?: string;
  connectionLost?: boolean;
  terminationReason?: string;
  terminatedBy?: string;
  totalMarksAwarded?: number;
  timeAdjustments?: SecureExamTimeAdjustmentRecord[];
  answers: SecureExamAnswerRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface SecureExamTimeAdjustmentRecord {
  id: string;
  sessionId: string;
  examId: string;
  studentId: string;
  additionalSeconds: number;
  reason: string;
  adjustedById: string;
  adjustedByName: string;
  previousExpiresAt: string;
  newExpiresAt: string;
  createdAt: string;
}

export interface SecureExamSecurityEventRecord {
  id: string;
  sessionId: string;
  eventType: ExamSecurityEventType;
  occurredAt: string;
  receivedAt: string;
  details?: string;
  responseTriggered: ViolationResponseAction;
}

export interface SecureExamIncidentRecord {
  id: string;
  sessionId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  status: ExamIncidentStatus;
  severity: ExamIncidentSeverity;
  summary: string;
  eventCount: number;
  reviewedById?: string;
  reviewedByName?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecureExamAuditLogRecord {
  id: string;
  sessionId?: string;
  examId?: string;
  actorId: string;
  actorName: string;
  action: string;
  detail: string;
  timestampIso: string;
}

export interface CandidateSanitizedQuestion {
  id: string;
  number: number;
  type: SecureExamQuestionType;
  instruction?: string;
  text: string;
  marks: number;
  options?: SecureExamOption[];
}

export interface CandidateExamSessionDto {
  id: string;
  status: 'instructions' | 'active' | 'submitted' | 'expired';
  serverStatus: SecureExamSessionStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  lastSavedAt?: string;
  terminationReason?: string;
  securityPolicy: ExamSecurityPolicy;
  exam: {
    id: string;
    code: string;
    title: string;
    subject: string;
    unitCode: string;
    durationMinutes: number;
    totalMarks: number;
    instructions: string[];
    startsAt: string;
    endsAt: string;
    questions: CandidateSanitizedQuestion[];
  };
  answers: {
    questionId: string;
    value: string | string[];
    updatedAt: string;
  }[];
  securityEventCount: number;
  tabSwitchCount: number;
  fullscreenExitCount: number;
}

export type ExamMessageSenderRole = 'STUDENT' | 'SUPERVISOR';

export type ExamMessageKind = 'HELP_REQUEST' | 'SUPERVISOR_INSTRUCTION' | 'GENERAL_NOTE';

export type ExamMessagePriority = 'NORMAL' | 'URGENT';

export interface SecureExamMessageRecord {
  id: string;
  sessionId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  senderRole: ExamMessageSenderRole;
  senderId: string;
  senderName: string;
  kind: ExamMessageKind;
  priority: ExamMessagePriority;
  body: string;
  createdAt: string;
  readByStudent: boolean;
  readBySupervisor: boolean;
}

