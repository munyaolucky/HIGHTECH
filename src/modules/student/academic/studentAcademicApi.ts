async function fetchAcademicJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
  };
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error || `Academic request failed (${response.status}).`);
  }
  return payload.data;
}

export interface StudentRegisteredUnitDto {
  id: string;
  code: string;
  title: string;
  credits: number;
  source: 'ACADEMIC_REGISTRATION' | 'CERTIFICATION_MODULE';
  academicYear: string | null;
  semesterName: string | null;
  intakeCode: string | null;
  approvalStatus: string;
  programmeName: string | null;
  classGroup: string | null;
  lecturerName: string | null;
  progressPercent: number | null;
  moduleStatus: string;
  examEligible: boolean;
}

export interface StudentTimetableSlotDto {
  id: string;
  unitCode: string;
  unitTitle: string;
  courseName: string;
  classGroupId: string;
  lecturerName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  sessionType: string;
  isToday: boolean;
}

export interface StudentAttendanceResponse {
  studentRegNo: string;
  studentName: string;
  readOnly: true;
  minimumExamAttendancePct: number;
  overallAttendanceRatePct: number;
  meetsExamThreshold: boolean;
  totals: {
    sessionsRecorded: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
  };
  unitSummaries: Array<{
    unitCode: string;
    unitTitle: string;
    totalSessions: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRatePct: number;
    examEligible: boolean;
  }>;
  sessions: Array<{
    sessionId: string;
    unitCode: string;
    unitTitle: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    roomName: string;
    lecturerName: string;
    status: string;
    method: string;
    arrivalTime: string | null;
    remarks: string;
    markedAt: string;
  }>;
  absenceCasesCount: number;
}

export interface StudentProgressResponse {
  studentRegNo: string;
  studentName: string;
  programmeName: string | null;
  gpa: number | null;
  gpaScale: number;
  averagePercentage: number | null;
  releasedResultsCount: number;
  passedAssessmentsCount: number;
  registeredUnitsCount: number;
  totalRegisteredCredits: number;
  completedModulesCount: number;
  attendanceRatePct: number;
  meetsExamAttendanceThreshold: boolean;
  certificationStage: string | null;
  progressPercent: number;
  eligibleForCertification: boolean;
}

export const studentAcademicApi = {
  getUnits() {
    return fetchAcademicJson<{
      studentRegNo: string;
      studentName: string;
      programmeName: string | null;
      totalRegisteredCredits: number;
      units: StudentRegisteredUnitDto[];
    }>('/api/student/academic/units');
  },
  getTimetable() {
    return fetchAcademicJson<{
      studentRegNo: string;
      programmeName: string | null;
      slots: StudentTimetableSlotDto[];
    }>('/api/student/academic/timetable');
  },
  getAttendance() {
    return fetchAcademicJson<StudentAttendanceResponse>('/api/student/academic/attendance');
  },
  getAssessments() {
    return fetchAcademicJson<{
      studentRegNo: string;
      assessments: Array<{
        id: string;
        code: string;
        title: string;
        unitCode: string;
        subject: string;
        kind: 'CBT_EXAM' | 'MODULE_ASSESSMENT';
        assessmentMode: string;
        durationMinutes: number | null;
        totalMarks: number | null;
        startsAt: string | null;
        endsAt: string | null;
        maxAttempts: number | null;
        status: string;
        examEligible: boolean;
      }>;
    }>('/api/student/academic/assessments');
  },
  getResults() {
    return fetchAcademicJson<{
      studentRegNo: string;
      studentName: string;
      releasedOnly: true;
      results: Array<{
        id: string;
        attemptRef: string;
        examId: string;
        examTitle: string;
        examBody: string;
        moduleCode: string;
        objectiveScore: number;
        manualScore: number;
        totalScore: number;
        totalMarks: number;
        percentage: number;
        passMark: number;
        passed: boolean;
        grade: string;
        gradePoints: number;
        lecturerFeedback: string;
        practicalFeedback: string | null;
        moderationStatus: 'RELEASED';
        approvedByName: string | null;
        moderatedByName: string | null;
        releasedAt: string | null;
        submittedAt: string;
      }>;
    }>('/api/student/academic/results');
  },
  getProgress() {
    return fetchAcademicJson<StudentProgressResponse>('/api/student/academic/progress');
  },
  getExamTimetable() {
    return fetchAcademicJson<{
      studentRegNo: string;
      entries: Array<{
        id: string;
        reference: string;
        title: string;
        moduleCode: string;
        examBody: string;
        kind: 'INVIGILATED_SITTING' | 'SECURE_CBT_WINDOW';
        scheduledDate: string;
        startTime: string;
        durationMinutes: number;
        room: string;
        campusName: string;
        status: string;
        candidateAttendanceStatus: string | null;
        workstation: string | null;
      }>;
    }>('/api/student/academic/exam-timetable');
  },
};
