/**
 * HI-TECH College Examination & LMS Assessment Engine Domain Types
 * Governs Question Bank Versioning, Random Pools, Timed CBT Snapshots,
 * Anonymous Rubric Marking, Controlled Release, Item Analysis,
 * Seating Rosters, Exam Incidents, and Supplementary Decisions.
 */

export type ExamRolePersona =
  | 'LECTURER_AUTHOR'
  | 'HOD_MODERATOR'
  | 'EXAM_OFFICER'
  | 'STUDENT_CANDIDATE';

export type QuestionLifecycleStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ARCHIVED';

export type EngineQuestionKind =
  | 'MCQ_SINGLE'
  | 'MCQ_MULTI'
  | 'TRUE_FALSE_UNCERTAIN'
  | 'FILL_BLANK_EXACT'
  | 'FILL_BLANK_FUZZY'
  | 'DROPDOWN_CLOZE'
  | 'MATCHING'
  | 'ORDERING'
  | 'NUMERIC_TOLERANCE'
  | 'FORMULA_SAFE'
  | 'HOTSPOT_GRID'
  | 'CODE_SANDBOX'
  | 'SQL_SANDBOX'
  | 'SHORT_ANSWER'
  | 'ESSAY_RUBRIC'
  | 'PRACTICAL_CHECKLIST'
  | 'FILE_UPLOAD'
  | 'SURVEY_RATING';

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  maxMarks: number;
}

export interface QuestionItem {
  id: string;
  code: string; // e.g., C10a, D12, Q-CSC301-01
  version: number;
  parentQuestionId?: string;
  unitCode: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  catalogueTypeId: number; // Maps to 1..63 in QUESTION_TYPES_63_COMPLETE
  kind: EngineQuestionKind;
  autoMarkable: boolean;
  marks: number;
  prompt: string;
  passageSegments?: string[]; // Used for Dropdown Cloze
  options?: string[];
  correctOptions?: string[]; // Multiple choice / multi-response
  correctText?: string; // Fill blank / exact / fuzzy / keyword regex
  acceptedSynonyms?: string[];
  clozeChoices?: string[][]; // Options per blank
  clozeAnswers?: string[];
  matchingPairs?: { left: string; right: string }[];
  orderingSequence?: string[]; // Canonical correct sequence
  numericTarget?: number;
  numericTolerance?: number; // Percentage tolerance e.g. 2 means +/- 2%
  formulaVariables?: Record<string, number>; // Test bindings e.g. { x: 4, y: 2 }
  formulaTargetExpression?: string; // Expected formula string
  hotspotTarget?: { row: number; col: number; label: string };
  starterCode?: string;
  expectedCodePattern?: string;
  checklistSteps?: string[];
  rubricCriteria?: RubricCriterion[];
  status: QuestionLifecycleStatus;
  authorId: string;
  authorName: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewNote?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface RandomPoolRule {
  id: string;
  label: string;
  unitCode: string;
  topic?: string;
  count: number;
  marksPerQuestion: number;
}

export interface AssessmentDefinition {
  id: string;
  code: string;
  title: string;
  unitCode: string;
  assessmentKind: 'QUIZ' | 'CAT' | 'EXAMINATION' | 'ASSIGNMENT' | 'PRACTICAL' | 'COMPETENCY';
  examBody: 'HI-TECH INTERNAL' | 'TVET CDACC' | 'KNEC' | 'KASNEB';
  totalMarks: number;
  passMarkPercent: number;
  durationMinutes: number;
  closingTimeIso: string; // Earlier of time limit & closing time applies
  authorId: string;
  authorName: string;
  publisherId?: string;
  publisherName?: string;
  publishedAt?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'MARKING' | 'RELEASED';
  fixedQuestionIds: string[];
  randomPools: RandomPoolRule[];
  isSampleConverted?: boolean;
  sourceNote?: string;
}

export interface CandidateQuestionSnapshot {
  snapshotId: string;
  questionId: string;
  code: string;
  version: number;
  kind: EngineQuestionKind;
  catalogueTypeId: number;
  autoMarkable: boolean;
  marks: number;
  prompt: string;
  passageSegments?: string[];
  options?: string[];
  clozeChoices?: string[][];
  matchingLefts?: string[];
  matchingRightsShuffled?: string[];
  orderingItemsShuffled?: string[];
  formulaVariables?: Record<string, number>;
  starterCode?: string;
  checklistSteps?: string[];
  rubricCriteria?: RubricCriterion[];
}

export type CandidateResponseValue =
  | string
  | string[]
  | Record<string, string>
  | { row: number; col: number }
  | boolean[];

export interface QuestionMarkRecord {
  questionId: string;
  code: string;
  maxMarks: number;
  awardedMarks: number | null; // null when awaiting manual marking
  autoMarked: boolean;
  provisionalKeywordHint?: string;
  rubricScores?: Record<string, number>;
  markerNote?: string;
}

export interface ExamAttempt {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  unitCode: string;
  anonymousScriptId: string; // e.g., ANON-2026-4091
  studentRegNo: string; // Hidden in anonymous marking queue until release
  studentName: string; // Hidden in anonymous marking queue until release
  extraTimePercent: number; // Accessibility accommodation (0, 25, 50)
  startedAtIso: string;
  effectiveDeadlineIso: string;
  lastAutosavedAtIso?: string;
  submittedAtIso?: string;
  graceAppliedSeconds?: number;
  ignoredLateSaveCount: number;
  frozenQuestions: CandidateQuestionSnapshot[];
  responses: Record<string, CandidateResponseValue>;
  questionMarks: QuestionMarkRecord[];
  totalAwarded: number;
  maxPossibleMarks: number;
  hasUnmarkedItems: boolean;
  passFailOutcome: 'PASS' | 'FAIL' | null; // Strictly null while any question is unmarked or unreleased
  moderationStatus: 'AUTO_PENDING_HUMAN' | 'MARKED_AWAITING_MODERATOR' | 'MODERATED' | 'RELEASED';
  moderatedBy?: string;
  releasedBy?: string;
  releasedAtIso?: string;
}

export interface ItemAnalysisStat {
  questionId: string;
  code: string;
  promptSnippet: string;
  kind: EngineQuestionKind;
  attemptsCount: number;
  maxMarks: number;
  meanScore: number;
  difficultyIndex: number; // p-value 0..1 (higher = easier)
  discriminationIndex: number; // D-index -1..+1
  optionCounts?: Record<string, number>;
}

export interface ExamSeatAllocation {
  id: string;
  examId: string;
  unitCode: string;
  examDate: string;
  timeWindow: string;
  venue: string;
  seatNumber: string;
  studentRegNo: string;
  studentName: string;
  attendancePercent: number;
  feeClearedPercent: number;
  permitStatus: 'CLEARED' | 'BLOCKED_FEE' | 'BLOCKED_ATTENDANCE';
  checkedIn: boolean;
}

export interface ExamIncidentRecord {
  id: string;
  examId: string;
  unitCode: string;
  venue: string;
  studentRegNo?: string;
  category: 'DEVICE_FAILURE' | 'LATE_ARRIVAL' | 'MALPRACTICE_SUSPECTED' | 'MEDICAL_EMERGENCY' | 'PAPER_ERRATA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  recordedBy: string;
  recordedAtIso: string;
  resolutionStatus: 'OPEN' | 'UNDER_INQUIRY' | 'RESOLVED';
  resolutionNote?: string;
}

export interface SupplementaryDecision {
  id: string;
  studentRegNo: string;
  studentName: string;
  unitCode: string;
  originalScore: number;
  decisionType: 'SUPPLEMENTARY' | 'SPECIAL_EXAM' | 'RETAKE';
  reason: string;
  proposedById: string;
  proposedByName: string;
  approvedById?: string;
  approvedByName?: string;
  status: 'PENDING_BOARD' | 'APPROVED' | 'REJECTED';
  scheduledDate?: string;
}
