export interface TeachingDocumentCategoryMeta {
  code: string;
  label: string;
}

export interface TeachingDocumentDTO {
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
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'ARCHIVED';
  currentVersion: number;
  uploadedById: string;
  uploadedByName: string;
  approvedByName: string | null;
  approvalComments: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    changeSummary: string;
    uploadedByName: string;
    createdAt: string;
  }>;
  approvals: Array<{
    id: string;
    reviewerName: string;
    reviewerRole: string;
    decision: string;
    comment: string | null;
    decidedAt: string;
  }>;
}

export interface LessonDeliveryDTO {
  id: string;
  assignmentId: string;
  attendanceSessionId: string;
  timetableEntryId: string | null;
  schemeTopicId: string | null;
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
  status: 'SCHEDULED' | 'CONDUCTED' | 'PARTIALLY_CONDUCTED' | 'NOT_CONDUCTED' | 'RESCHEDULED';
  hodReviewStatus: 'PENDING' | 'VERIFIED' | 'FLAGGED';
  hodReviewerName: string | null;
  hodReviewComments: string | null;
  hodReviewedAt: string | null;
  submittedAt: string | null;
  attendanceSummary: {
    sessionId: string;
    totalStudents: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number;
    locked: boolean;
  } | null;
  observations: Array<{
    id: string;
    observerName: string;
    observerRole: string;
    observationDate: string;
    pedagogyScore: number;
    preparationScore: number;
    engagementScore: number;
    strengths: string;
    recommendations: string;
  }>;
}

export interface AttendanceSessionDTO {
  id: string;
  assignmentId: string;
  departmentId: string;
  unitCode: string;
  unitTitle: string;
  classGroupId: string;
  lecturerId: string;
  lecturerName: string;
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
  records: Array<{
    id: string;
    sessionId: string;
    studentRegNo: string;
    studentName: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
    method: 'ROLL_CALL' | 'QR_CHECKIN';
    arrivalTime: string | null;
    departureTime: string | null;
    remarks: string;
    markedByName: string;
    markedAt: string;
  }>;
}

export interface AbsenceEvidenceMetaDTO {
  id: string;
  absenceCaseId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  description: string;
  isConfidentialMedical: boolean;
  accessRestricted: boolean;
  uploadedByName: string;
  uploadedByRole: string;
  createdAt: string;
}

export interface AbsenceCaseDTO {
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
  status: string;
  escalationLevel: 'NONE' | 'LECTURER' | 'HOD' | 'PRINCIPAL';
  assignedReviewerRole: string;
  createdAt: string;
  updatedAt: string;
  explanations: Array<{
    id: string;
    absenceCaseId: string;
    source: 'STUDENT_PORTAL' | 'TRAINER_VERBAL_ENTRY';
    category: string;
    reasonText: string;
    trainerRecordedNote: string | null;
    studentConfirmedAccuracy: boolean;
    studentConfirmedAt: string | null;
    submittedByName: string;
    submittedByRole: string;
    createdAt: string;
  }>;
  evidence: AbsenceEvidenceMetaDTO[];
  reviews: Array<{
    id: string;
    reviewerName: string;
    reviewerRole: string;
    decision: string;
    comment: string;
    createdAt: string;
  }>;
  escalations: Array<{
    id: string;
    fromRole: string;
    toRole: string;
    triggerRule: string;
    reason: string;
    resolved: boolean;
    resolvedByName: string | null;
    createdAt: string;
  }>;
}

export interface SchemeOfWorkDTO {
  id: string;
  unitCode: string;
  unitTitle: string;
  classGroupId: string;
  academicYear: string;
  term: string;
  title: string;
  lecturerName: string;
  status: string;
  totalTopics: number;
  coveredTopics: number;
  coveragePct: number;
  topics: Array<{
    id: string;
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
  }>;
  unfinishedTopics: Array<{ id: string; weekNumber: number; topicTitle: string }>;
}

export interface AttendancePolicyDTO {
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

export interface TeachingReportResultDTO {
  key: string;
  title: string;
  audience: string;
  generatedAt: string;
  generatedBy: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  totalRows: number;
  catalogue: Array<{ key: string; title: string; audience: string }>;
}

export const TEACHING_DOCUMENT_CATEGORY_LIST: TeachingDocumentCategoryMeta[] = [
  { code: 'LESSON_PLAN', label: 'Lesson Plan' },
  { code: 'SCHEME_OF_WORK', label: 'Scheme of Work' },
  { code: 'RECORD_OF_WORK', label: 'Record of Work' },
  { code: 'CLASS_NOTES', label: 'Class Notes' },
  { code: 'TEACHING_MATERIALS', label: 'Teaching Materials' },
  { code: 'ASSIGNMENTS', label: 'Assignments' },
  { code: 'CAT_ASSESSMENT', label: 'CAT / Assessment' },
  { code: 'PRACTICAL_RECORDS', label: 'Practical Records' },
  { code: 'STUDENT_HANDOUTS', label: 'Student Handouts' },
  { code: 'OTHER_DOCUMENTS', label: 'Other Documents' },
  { code: 'LESSON_OBSERVATION_FORMS', label: 'Lesson Observation Forms' },
  { code: 'DEPARTMENTAL_MEETING_MINUTES', label: 'Departmental Meeting Minutes' },
  { code: 'INDUSTRIAL_ATTACHMENT_SUPERVISION', label: 'Industrial Attachment Supervision' },
  { code: 'PRACTICAL_ASSESSMENT_REPORTS', label: 'Practical Assessment Reports' },
  { code: 'STUDENT_PROGRESS_RECORDS', label: 'Student Progress Records' },
  { code: 'ACADEMIC_INTERVENTION_REPORTS', label: 'Academic Intervention Reports' },
  { code: 'EXAM_MODERATION_DOCS', label: 'Exam Moderation Docs' },
];

export const TEACHING_REPORT_ITEMS = [
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

export const TEACHING_CHECKLIST_ITEMS = [
  'Lecturer Dashboard — "My Teaching & Documents" KPI summary',
  'Teaching Documents Upload (17 categories + multi-version control)',
  'Document Approval / Return Workflow with HOD Review Comments',
  'Record Today’s Lesson with Mandatory Details for CONDUCTED Status',
  'Lesson Delivery History linked directly to Attendance Registers',
  'Scheme of Work & Topic Coverage % Tracker + Unfinished Topics',
  'Live Interactive Roll-Call Register & Locked Session Amendments',
  'Dynamic Expiring QR Attendance Code & Anti-Duplicate Check-In',
  'Auto-Creation of Student Absence Cases & Notifications on Absence',
  'Student Portal Option A: Explanation & Medical Evidence Upload',
  'Student Portal Option B: Confirm Accuracy of Trainer Verbal Note',
  'Lecturer / Trainer Verbal Note Entry & Absence Case Recommendation',
  'Medical Confidentiality RBAC (Admin Blocked, Restricted Medical Only)',
  'Configurable Attendance Escalation Policy Engine (Consecutive / Unit / Term)',
  'HOD Department Attendance, Documents & Lesson Verification Monitor',
  'Principal & Registrar Institutional Oversight & Escalation Resolution',
  'Catch-Up Lessons, Missed Practicals & Academic Intervention Tracking',
  'All 14 Teaching & Attendance Reports with Formula-Safe CSV Export',
] as const;

export async function readFileAsBase64(file: File): Promise<{
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileContentBase64: string;
}> {
  if (file.size > 3 * 1024 * 1024) {
    throw new Error('File exceeds 3 MB limit.');
  }
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
    fileContentBase64: btoa(binary),
  };
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    const err = new Error(payload?.error || `Request failed (${res.status})`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return payload.data as T;
}

export const teachingModuleApi = {
  // Ensure lecturer cookie session exists when running standalone /portal/lecturer
  async ensureLecturerSession(): Promise<void> {
    try {
      await apiJson('/api/teaching/summary');
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        await fetch('/api/staff/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'LECTURER', explicitSwitch: false }),
        });
      }
    }
  },

  getSummary: () => apiJson<any>('/api/teaching/summary'),

  listDocuments: (params?: { category?: string; status?: string; unitCode?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.status) qs.set('status', params.status);
    if (params?.unitCode) qs.set('unitCode', params.unitCode);
    if (params?.search) qs.set('search', params.search);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiJson<TeachingDocumentDTO[]>(`/api/teaching/documents${suffix}`);
  },
  uploadDocument: (body: Record<string, unknown>) =>
    apiJson<TeachingDocumentDTO>('/api/teaching/documents', { method: 'POST', body: JSON.stringify(body) }),
  addDocumentVersion: (docId: string, body: Record<string, unknown>) =>
    apiJson<TeachingDocumentDTO>(`/api/teaching/documents/${docId}/version`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  transitionDocumentStatus: (
    docId: string,
    action: 'SUBMIT' | 'APPROVE' | 'RETURN' | 'ARCHIVE',
    comment?: string
  ) =>
    apiJson<TeachingDocumentDTO>(`/api/teaching/documents/${docId}/status`, {
      method: 'POST',
      body: JSON.stringify({ action, comment }),
    }),
  getDocumentDownloadUrl: (docId: string, version?: number) =>
    `/api/teaching/documents/${docId}/download${version ? `?version=${version}` : ''}`,

  listSchemes: () => apiJson<SchemeOfWorkDTO[]>('/api/teaching/schemes'),
  createScheme: (body: Record<string, unknown>) =>
    apiJson<SchemeOfWorkDTO>('/api/teaching/schemes', { method: 'POST', body: JSON.stringify(body) }),
  toggleSchemeTopic: (
    schemeId: string,
    topicId: string,
    covered: boolean,
    lessonDeliveryId?: string | null,
    remarks?: string
  ) =>
    apiJson<SchemeOfWorkDTO>(`/api/teaching/schemes/${schemeId}/topics/${topicId}`, {
      method: 'PATCH',
      body: JSON.stringify({ covered, lessonDeliveryId, remarks }),
    }),

  listLessons: (params?: { status?: string; unitCode?: string; departmentId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.unitCode) qs.set('unitCode', params.unitCode);
    if (params?.departmentId) qs.set('departmentId', params.departmentId);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiJson<LessonDeliveryDTO[]>(`/api/teaching/lessons${suffix}`);
  },
  saveLessonDelivery: (body: Record<string, unknown>) =>
    apiJson<LessonDeliveryDTO>('/api/teaching/lessons', { method: 'POST', body: JSON.stringify(body) }),
  hodReviewLesson: (lessonId: string, reviewStatus: 'VERIFIED' | 'FLAGGED', comments?: string) =>
    apiJson<LessonDeliveryDTO>(`/api/teaching/lessons/${lessonId}/hod-review`, {
      method: 'POST',
      body: JSON.stringify({ reviewStatus, comments }),
    }),

  listObservations: () => apiJson<any[]>('/api/teaching/observations'),
  createObservation: (body: Record<string, unknown>) =>
    apiJson<any>('/api/teaching/observations', { method: 'POST', body: JSON.stringify(body) }),

  listAttendance: () =>
    apiJson<{ sessions: AttendanceSessionDTO[]; corrections: any[] }>('/api/teaching/attendance'),
  commitAttendance: (body: Record<string, unknown>) =>
    apiJson<{ session: AttendanceSessionDTO; triggeredAbsenceCases: AbsenceCaseDTO[] }>(
      '/api/teaching/attendance',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  generateQr: (sessionId: string) =>
    apiJson<{ sessionId: string; qrToken: string; qrExpiresAt: string }>(
      `/api/teaching/attendance/${sessionId}/qr`,
      { method: 'POST', body: JSON.stringify({}) }
    ),
  requestCorrection: (
    sessionId: string,
    recordId: string,
    requestedStatus: string,
    reason: string
  ) =>
    apiJson<any>(`/api/teaching/attendance/${sessionId}/corrections`, {
      method: 'POST',
      body: JSON.stringify({ recordId, requestedStatus, reason }),
    }),
  reviewCorrection: (correctionId: string, decision: 'APPROVED' | 'REJECTED', note?: string) =>
    apiJson<any>(`/api/teaching/attendance/corrections/${correctionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    }),

  listCatchUps: () => apiJson<any[]>('/api/teaching/catch-ups'),
  createCatchUp: (body: Record<string, unknown>) =>
    apiJson<any>('/api/teaching/catch-ups', { method: 'POST', body: JSON.stringify(body) }),
  updateCatchUpStatus: (
    catchUpId: string,
    status: 'SCHEDULED' | 'COMPLETED' | 'MISSED',
    completionNotes?: string
  ) =>
    apiJson<any>(`/api/teaching/catch-ups/${catchUpId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, completionNotes }),
    }),

  listInterventions: () => apiJson<any[]>('/api/teaching/interventions'),
  createIntervention: (body: Record<string, unknown>) =>
    apiJson<any>('/api/teaching/interventions', { method: 'POST', body: JSON.stringify(body) }),

  // Absence Staff & Student
  listStaffAbsenceCases: (params?: { status?: string; escalationLevel?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.escalationLevel) qs.set('escalationLevel', params.escalationLevel);
    if (params?.search) qs.set('search', params.search);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiJson<AbsenceCaseDTO[]>(`/api/absence/cases${suffix}`);
  },
  recordTrainerVerbalNote: (
    caseId: string,
    category: string,
    reasonText: string,
    trainerRecordedNote?: string
  ) =>
    apiJson<any>(`/api/absence/${caseId}/trainer-note`, {
      method: 'POST',
      body: JSON.stringify({ category, reasonText, trainerRecordedNote }),
    }),
  reviewAbsenceCase: (
    caseId: string,
    decision: 'UNDER_REVIEW' | 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CLOSED',
    comment: string,
    escalateToRole?: 'HOD' | 'PRINCIPAL'
  ) =>
    apiJson<AbsenceCaseDTO>(`/api/absence/${caseId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, comment, escalateToRole }),
    }),
  uploadAbsenceEvidence: (caseId: string, body: Record<string, unknown>) =>
    apiJson<AbsenceEvidenceMetaDTO>(`/api/absence/${caseId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getAbsenceEvidenceDownloadUrl: (caseId: string, evId: string) =>
    `/api/absence/${caseId}/evidence/${evId}`,

  // Student Portal Self-Service
  getMyAbsenceCases: () => apiJson<any>('/api/absence/my-cases'),
  studentQrCheckIn: (qrToken: string) =>
    apiJson<any>('/api/absence/qr-checkin', { method: 'POST', body: JSON.stringify({ qrToken }) }),
  submitStudentExplanation: (caseId: string, category: string, reasonText: string) =>
    apiJson<any>(`/api/absence/${caseId}/explanation`, {
      method: 'POST',
      body: JSON.stringify({ category, reasonText }),
    }),
  confirmTrainerVerbalNote: (caseId: string, explanationId: string) =>
    apiJson<any>(`/api/absence/${caseId}/confirm-trainer-note`, {
      method: 'POST',
      body: JSON.stringify({ explanationId }),
    }),

  // Management Oversight & Reports
  getManagementDashboard: () => apiJson<any>('/api/management/attendance'),
  getAttendancePolicy: () => apiJson<AttendancePolicyDTO>('/api/management/attendance-policy'),
  updateAttendancePolicy: (patch: Partial<AttendancePolicyDTO>) =>
    apiJson<AttendancePolicyDTO>('/api/management/attendance-policy', {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
  generateReport: (reportKey: string) =>
    apiJson<TeachingReportResultDTO>(
      `/api/management/teaching-reports?reportKey=${encodeURIComponent(reportKey)}`
    ),
  getReportCsvDownloadUrl: (reportKey: string) =>
    `/api/management/teaching-reports/${encodeURIComponent(reportKey)}/export`,
};
