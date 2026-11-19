export const TEACHING_DOCUMENT_CATEGORIES = [
  // Core 10 categories
  'LESSON_PLAN',
  'SCHEME_OF_WORK',
  'RECORD_OF_WORK',
  'CLASS_NOTES',
  'TEACHING_MATERIALS',
  'ASSIGNMENTS',
  'CAT_ASSESSMENT',
  'PRACTICAL_RECORDS',
  'STUDENT_HANDOUTS',
  'OTHER_DOCUMENTS',
  // Phase 2 advanced categories
  'LESSON_OBSERVATION_FORMS',
  'DEPARTMENTAL_MEETING_MINUTES',
  'INDUSTRIAL_ATTACHMENT_SUPERVISION',
  'PRACTICAL_ASSESSMENT_REPORTS',
  'STUDENT_PROGRESS_RECORDS',
  'ACADEMIC_INTERVENTION_REPORTS',
  'EXAM_MODERATION_DOCS',
] as const;

export type TeachingDocumentCategory = (typeof TEACHING_DOCUMENT_CATEGORIES)[number];

export const TEACHING_DOCUMENT_CATEGORY_LABELS: Record<TeachingDocumentCategory, string> = {
  LESSON_PLAN: 'Lesson Plan',
  SCHEME_OF_WORK: 'Scheme of Work',
  RECORD_OF_WORK: 'Record of Work',
  CLASS_NOTES: 'Class Notes',
  TEACHING_MATERIALS: 'Teaching Materials',
  ASSIGNMENTS: 'Assignments',
  CAT_ASSESSMENT: 'CAT / Assessment',
  PRACTICAL_RECORDS: 'Practical Records',
  STUDENT_HANDOUTS: 'Student Handouts',
  OTHER_DOCUMENTS: 'Other Documents',
  LESSON_OBSERVATION_FORMS: 'Lesson Observation Forms',
  DEPARTMENTAL_MEETING_MINUTES: 'Departmental Meeting Minutes',
  INDUSTRIAL_ATTACHMENT_SUPERVISION: 'Industrial Attachment Supervision',
  PRACTICAL_ASSESSMENT_REPORTS: 'Practical Assessment Reports',
  STUDENT_PROGRESS_RECORDS: 'Student Progress Records',
  ACADEMIC_INTERVENTION_REPORTS: 'Academic Intervention Reports',
  EXAM_MODERATION_DOCS: 'Exam Moderation Docs',
};

export const TEACHING_DOCUMENT_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'RETURNED',
  'ARCHIVED',
] as const;

export type TeachingDocumentStatus = (typeof TEACHING_DOCUMENT_STATUSES)[number];

export const LESSON_DELIVERY_STATUSES = [
  'SCHEDULED',
  'CONDUCTED',
  'PARTIALLY_CONDUCTED',
  'NOT_CONDUCTED',
  'RESCHEDULED',
] as const;

export type LessonDeliveryStatus = (typeof LESSON_DELIVERY_STATUSES)[number];

export const ATTENDANCE_MARK_STATUSES = [
  'PRESENT',
  'LATE',
  'ABSENT',
  'EXCUSED',
] as const;

export type AttendanceMarkStatus = (typeof ATTENDANCE_MARK_STATUSES)[number];

export const ABSENCE_CASE_STATUSES = [
  'AWAITING_EXPLANATION',
  'EXPLANATION_SUBMITTED',
  'DOCUMENT_SUBMITTED',
  'UNDER_REVIEW',
  'RECOMMENDED',
  'APPROVED',
  'REJECTED',
  'ESCALATED',
  'CLOSED',
] as const;

export type AbsenceCaseStatus = (typeof ABSENCE_CASE_STATUSES)[number];

export const ABSENCE_REASON_CATEGORIES = [
  'MEDICAL',
  'FAMILY_EMERGENCY',
  'OFFICIAL_DUTY',
  'TRANSPORT',
  'FINANCIAL',
  'OTHER',
] as const;

export type AbsenceReasonCategory = (typeof ABSENCE_REASON_CATEGORIES)[number];

export const ALLOWED_TEACHING_DOC_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
  '.zip',
]);

export const MAX_TEACHING_DOC_BYTES = 3 * 1024 * 1024; // 3 MB for in-JSON/DB safe inline payload validation
export const MAX_EVIDENCE_BYTES = 3 * 1024 * 1024;

export interface TeachingDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileContentBase64: string;
  changeSummary: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface TeachingDocumentApproval {
  id: string;
  documentId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  decision: 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'ARCHIVED';
  comment: string | null;
  decidedAt: string;
}

export interface TeachingDocumentItem {
  id: string;
  assignmentId: string;
  departmentId: string;
  departmentName: string;
  courseName: string;
  classGroupId: string;
  unitCode: string;
  unitTitle: string;
  academicYear: string;
  term: string;
  category: TeachingDocumentCategory;
  title: string;
  description: string;
  status: TeachingDocumentStatus;
  currentVersion: number;
  uploadedById: string;
  uploadedByName: string;
  approvedById: string | null;
  approvedByName: string | null;
  approvalComments: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchemeTopicItem {
  id: string;
  schemeId: string;
  weekNumber: number;
  plannedDate: string;
  topicTitle: string;
  subtopics: string;
  learningOutcomes: string;
  activities: string;
  resources: string;
  covered: boolean;
  actualCoveredDate: string | null;
  lessonDeliveryId: string | null;
  remarks: string;
}

export interface SchemeOfWorkRecord {
  id: string;
  assignmentId: string;
  departmentId: string;
  unitCode: string;
  unitTitle: string;
  classGroupId: string;
  academicYear: string;
  term: string;
  title: string;
  lecturerId: string;
  lecturerName: string;
  status: TeachingDocumentStatus;
  topics: SchemeTopicItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSessionStudentRecord {
  id: string;
  sessionId: string;
  studentRegNo: string;
  studentName: string;
  status: AttendanceMarkStatus;
  method: 'ROLL_CALL' | 'QR_CHECKIN';
  arrivalTime: string | null;
  departureTime: string | null;
  remarks: string;
  markedById: string;
  markedByName: string;
  markedAt: string;
}

export interface AttendanceSessionRecord {
  id: string;
  assignmentId: string;
  departmentId: string;
  unitCode: string;
  unitTitle: string;
  classGroupId: string;
  timetableEntryId: string | null;
  lecturerId: string;
  lecturerName: string;
  substituteLecturerId: string | null;
  substituteLecturerName: string | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomName: string;
  qrToken: string | null;
  qrExpiresAt: string | null;
  locked: boolean;
  submittedAt: string | null;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
  records: AttendanceSessionStudentRecord[];
  createdAt: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  sessionId: string;
  recordId: string;
  studentRegNo: string;
  studentName: string;
  previousStatus: AttendanceMarkStatus;
  requestedStatus: AttendanceMarkStatus;
  reason: string;
  requestedById: string;
  requestedByName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface LessonDeliveryRecordItem {
  id: string;
  assignmentId: string;
  attendanceSessionId: string;
  timetableEntryId: string | null;
  schemeTopicId: string | null;
  academicYear: string;
  term: string;
  departmentId: string;
  departmentName: string;
  courseName: string;
  classGroupId: string;
  unitCode: string;
  unitTitle: string;
  lecturerId: string;
  lecturerName: string;
  actualTrainerId: string;
  actualTrainerName: string;
  isSubstitute: boolean;
  lessonDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  roomName: string;
  plannedTopic: string;
  actualTopicTaught: string;
  subtopicsCovered: string;
  learningObjectivesAchieved: string;
  teachingMethods: string;
  practicalsDone: string;
  pagesOrSectionsCovered: string;
  challengesFaced: string;
  homeworkAssigned: string;
  nextLessonPlan: string;
  supportingDocumentIds: string[];
  trainerRemarks: string;
  status: LessonDeliveryStatus;
  hodReviewStatus: 'PENDING' | 'VERIFIED' | 'FLAGGED';
  hodReviewerName: string | null;
  hodReviewComments: string | null;
  hodReviewedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonObservationRecord {
  id: string;
  lessonDeliveryId: string;
  unitCode: string;
  lecturerId: string;
  lecturerName: string;
  observerId: string;
  observerName: string;
  observerRole: string;
  observationDate: string;
  pedagogyScore: number;
  preparationScore: number;
  engagementScore: number;
  strengths: string;
  recommendations: string;
  createdAt: string;
}

export interface AbsenceExplanationRecord {
  id: string;
  absenceCaseId: string;
  source: 'STUDENT_PORTAL' | 'TRAINER_VERBAL_ENTRY';
  category: AbsenceReasonCategory;
  reasonText: string;
  trainerRecordedNote: string | null;
  studentConfirmedAccuracy: boolean;
  studentConfirmedAt: string | null;
  submittedById: string;
  submittedByName: string;
  submittedByRole: string;
  createdAt: string;
}

export interface AbsenceEvidenceRecord {
  id: string;
  absenceCaseId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileContentBase64: string;
  description: string;
  isConfidentialMedical: boolean;
  uploadedById: string;
  uploadedByName: string;
  uploadedByRole: string;
  createdAt: string;
}

export interface AbsenceReviewRecord {
  id: string;
  absenceCaseId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  decision: 'UNDER_REVIEW' | 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CLOSED';
  comment: string;
  createdAt: string;
}

export interface AbsenceEscalationRecord {
  id: string;
  absenceCaseId: string;
  fromRole: string;
  toRole: string;
  triggerRule: string;
  reason: string;
  escalatedById: string;
  escalatedByName: string;
  resolved: boolean;
  resolvedByName: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface StudentAbsenceCaseRecord {
  id: string;
  attendanceSessionId: string;
  attendanceRecordId: string;
  lessonDeliveryId: string | null;
  studentRegNo: string;
  studentName: string;
  departmentId: string;
  departmentName: string;
  courseName: string;
  unitCode: string;
  unitTitle: string;
  classGroupId: string;
  lecturerId: string;
  lecturerName: string;
  absenceDate: string;
  consecutiveAbsenceCount: number;
  unitAbsenceCount: number;
  termAbsenceCount: number;
  status: AbsenceCaseStatus;
  escalationLevel: 'NONE' | 'LECTURER' | 'HOD' | 'PRINCIPAL';
  assignedReviewerRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatchUpLessonRecord {
  id: string;
  studentRegNo: string;
  studentName: string;
  absenceCaseId: string | null;
  unitCode: string;
  unitTitle: string;
  missedLessonDate: string;
  scheduledDate: string;
  scheduledTime: string;
  trainerId: string;
  trainerName: string;
  roomOrLink: string;
  materialsAttached: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED';
  completionNotes: string;
  createdAt: string;
}

export interface AcademicInterventionRecord {
  id: string;
  studentRegNo: string;
  studentName: string;
  unitCode: string;
  departmentId: string;
  triggerReason: string;
  interventionPlan: string;
  ownerId: string;
  ownerName: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  followUpDate: string;
  outcomeNotes: string;
  createdAt: string;
}

export interface AttendancePolicyConfig {
  id: string;
  policyName: string;
  minimumExamAttendancePct: number;
  lateThresholdMinutes: number;
  consecutiveAbsenceTrainerAlert: number;
  unitAbsenceHodAlert: number;
  termAbsenceHodEscalation: number;
  unresolvedPrincipalEscalation: number;
  lessonRecordOverdueHours: number;
  allowQrCheckIn: boolean;
  qrValidityMinutes: number;
  updatedByName: string;
  updatedAt: string;
}

export interface AttendanceAlertRecord {
  id: string;
  targetRole: 'STUDENT' | 'LECTURER' | 'HOD' | 'REGISTRAR' | 'PRINCIPAL' | 'STUDENT_AFFAIRS';
  targetUserId: string | null;
  targetStudentRegNo: string | null;
  departmentId: string | null;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  title: string;
  message: string;
  relatedEntityId: string | null;
  read: boolean;
  createdAt: string;
}

export interface TeachingAuditLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
  createdAt: string;
}

export interface TimetableSessionSlot {
  id: string;
  assignmentId: string;
  departmentId: string;
  departmentName: string;
  courseName: string;
  classGroupId: string;
  unitCode: string;
  unitTitle: string;
  lecturerId: string;
  lecturerName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  sessionType: 'Lecture' | 'Lab Practical' | 'Tutorial';
  isToday: boolean;
}

export const TEACHING_REPORT_CATALOGUE = [
  { key: 'daily_lesson_delivery', title: '1. Daily Lesson Delivery Report', audience: 'Lecturer / HOD' },
  { key: 'weekly_teaching_summary', title: '2. Weekly Teaching Summary', audience: 'Lecturer / HOD' },
  { key: 'topic_syllabus_coverage', title: '3. Topic & Syllabus Coverage Report', audience: 'HOD / QA' },
  { key: 'lecturer_lesson_submission', title: '4. Lecturer Lesson Record Submission Report', audience: 'HOD / Principal' },
  { key: 'student_daily_attendance', title: '5. Student Daily Attendance Report', audience: 'Lecturer / Student' },
  { key: 'unit_attendance_summary', title: '6. Unit / Subject Attendance Summary', audience: 'Lecturer / Registrar' },
  { key: 'course_class_attendance', title: '7. Course / Class Attendance Report', audience: 'HOD / Registrar' },
  { key: 'absenteeism_log', title: '8. Student Absenteeism Log', audience: 'Lecturer / HOD' },
  { key: 'absence_reasons_evidence', title: '9. Student Absence Reasons & Evidence Report', audience: 'HOD / Principal / Welfare' },
  { key: 'repeated_chronic_absenteeism', title: '10. Repeated / Chronic Absenteeism Alert Report', audience: 'HOD / Principal' },
  { key: 'department_attendance_comparison', title: '11. Department Attendance Comparison Report', audience: 'Principal / Registrar' },
  { key: 'uploaded_documents_compliance', title: '12. Uploaded Teaching Documents Compliance Report', audience: 'HOD / QA' },
  { key: 'unconducted_missed_lessons', title: '13. Unconducted / Missed Lessons Report', audience: 'HOD / Principal' },
  { key: 'term_academic_teaching_summary', title: '14. Term / Semester Academic Teaching Summary', audience: 'Principal / Registrar' },
] as const;

export type TeachingReportKey = (typeof TEACHING_REPORT_CATALOGUE)[number]['key'];
