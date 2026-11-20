export type ExamStatus = 'instructions' | 'active' | 'submitted' | 'expired';

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER';

export interface ExamOption {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  number: number;
  type: QuestionType;
  instruction?: string;
  text: string;
  marks: number;
  options?: ExamOption[];
}

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

export interface ExamDefinition {
  id: string;
  code?: string;
  title: string;
  subject: string;
  unitCode?: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string[];
  questions: ExamQuestion[];
  startsAt: string;
  endsAt: string;
}

export type ExamAnswerValue = string | string[];

export interface ExamAnswer {
  questionId: string;
  value: ExamAnswerValue;
  updatedAt: string;
}

export type SecurityEventType =
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

export interface ExamSecurityEvent {
  type: SecurityEventType;
  occurredAt: string;
  details?: string;
}

export interface ExamSession {
  id: string;
  exam: ExamDefinition;
  status: ExamStatus;
  candidateName?: string;
  candidateRegNo?: string;
  startedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
  lastSavedAt?: string;
  terminationReason?: string;
  answers: ExamAnswer[];
  securityPolicy?: ExamSecurityPolicy;
  localPreviewMode?: boolean;
}
