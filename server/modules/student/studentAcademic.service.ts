import { desc, eq } from 'drizzle-orm';
import { db, isPostgresConfigured } from '../../../src/db/index.ts';
import {
  academicPeriods,
  academicRegistrations,
  attendanceRecords,
  attendanceSessions,
  studentProfiles,
} from '../../../src/db/schema.ts';
import { getDb } from '../../data/store.ts';
import type { ExamMarkingSubmission } from '../certification/certification.types.ts';
import type { AttendanceMarkStatus } from '../teaching/teaching.types.ts';

export type StoreData = ReturnType<typeof getDb>;

export class StudentAcademicHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface StudentAcademicIdentity {
  studentId: string;
  pgUserId?: number | null;
  studentRegNo: string;
  studentName: string;
  departmentId?: string | null;
}

export interface AcademicServiceDependencies {
  store?: StoreData;
  pgEnabled?: boolean;
}

export interface StudentRegisteredUnitView {
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

export interface StudentTimetableSlotView {
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

export interface StudentAttendanceUnitSummary {
  unitCode: string;
  unitTitle: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRatePct: number;
  examEligible: boolean;
}

export interface StudentAttendanceSessionEntry {
  sessionId: string;
  unitCode: string;
  unitTitle: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomName: string;
  lecturerName: string;
  status: AttendanceMarkStatus;
  method: string;
  arrivalTime: string | null;
  remarks: string;
  markedAt: string;
}

export interface StudentAssessmentView {
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
}

export interface StudentReleasedResultView {
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
}

export interface StudentExamTimetableEntry {
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
}

function normalizeCode(code: string | null | undefined): string {
  return String(code ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function normalizeRegNo(regNo: string | null | undefined): string {
  return String(regNo ?? '').trim().toUpperCase();
}

function resolveGradeFromPercent(pct: number): { grade: string; gradePoints: number } {
  if (pct >= 70) return { grade: 'A', gradePoints: 4.0 };
  if (pct >= 60) return { grade: 'B', gradePoints: 3.0 };
  if (pct >= 50) return { grade: 'C', gradePoints: 2.0 };
  if (pct >= 40) return { grade: 'D', gradePoints: 1.0 };
  return { grade: 'E', gradePoints: 0.0 };
}

function isAttendedStatus(status: string): boolean {
  const norm = status.trim().toUpperCase();
  return norm === 'PRESENT' || norm === 'LATE' || norm === 'EXCUSED';
}

function dayOrder(day: string): number {
  const norm = day.trim().toLowerCase();
  const map: Record<string, number> = {
    today: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };
  return map[norm] ?? 99;
}

async function fetchPgStudentProfile(identity: StudentAcademicIdentity) {
  const normReg = normalizeRegNo(identity.studentRegNo);
  const allProfiles = await db.select().from(studentProfiles);
  return (
    allProfiles.find(
      (p) =>
        normalizeRegNo(p.registrationNumber) === normReg ||
        (identity.pgUserId && p.userId === identity.pgUserId)
    ) ?? null
  );
}

async function fetchPgRegistrations(
  identity: StudentAcademicIdentity,
  pgProfileId: string | null
) {
  if (!pgProfileId) {
    const profile = await fetchPgStudentProfile(identity);
    pgProfileId = profile?.id ?? null;
  }
  if (!pgProfileId) return [];

  return db
    .select({
      registration: academicRegistrations,
      academicYear: academicPeriods.academicYear,
      semesterName: academicPeriods.semesterName,
      intakeCode: academicPeriods.intakeCode,
      programmeName: studentProfiles.programmeName,
      registrationNumber: studentProfiles.registrationNumber,
    })
    .from(academicRegistrations)
    .innerJoin(academicPeriods, eq(academicRegistrations.academicPeriodId, academicPeriods.id))
    .innerJoin(studentProfiles, eq(academicRegistrations.studentProfileId, studentProfiles.id))
    .where(eq(academicRegistrations.studentProfileId, pgProfileId))
    .orderBy(desc(academicRegistrations.createdAt));
}

async function fetchPgStudentAttendance(identity: StudentAcademicIdentity) {
  const normReg = normalizeRegNo(identity.studentRegNo);
  const rows = await db
    .select({
      record: attendanceRecords,
      session: attendanceSessions,
    })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
    .orderBy(desc(attendanceSessions.sessionDate));

  return rows.filter((row) => normalizeRegNo(row.record.studentRegNo) === normReg);
}

export const studentAcademicService = {
  async getUnits(
    identity: StudentAcademicIdentity,
    deps?: AcademicServiceDependencies
  ): Promise<{
    studentRegNo: string;
    studentName: string;
    programmeName: string | null;
    totalRegisteredCredits: number;
    units: StudentRegisteredUnitView[];
  }> {
    const store = deps?.store ?? getDb();
    const usePg = deps?.pgEnabled ?? isPostgresConfigured();
    const normReg = normalizeRegNo(identity.studentRegNo);

    let pgProfile: typeof studentProfiles.$inferSelect | null = null;
    let pgRegs: Awaited<ReturnType<typeof fetchPgRegistrations>> = [];

    if (usePg) {
      pgProfile = await fetchPgStudentProfile(identity);
      pgRegs = await fetchPgRegistrations(identity, pgProfile?.id ?? null);
    }

    const certState = store.certificationState;
    const certModulesByCode = new Map(
      certState.modules.map((m) => [normalizeCode(m.code), m])
    );
    const certAssignments = certState.moduleAssignments.filter(
      (a) => normalizeRegNo(a.studentRegNo) === normReg
    );
    const studentCohorts = certState.classes.filter((c) =>
      c.enrolledStudentRegNos.some((r) => normalizeRegNo(r) === normReg)
    );

    const unitsByNormCode = new Map<string, StudentRegisteredUnitView>();
    let totalRegisteredCredits = 0;

    for (const row of pgRegs) {
      totalRegisteredCredits += row.registration.totalCredits;
      const units = Array.isArray(row.registration.unitsJson) ? row.registration.unitsJson : [];
      for (const u of units) {
        const key = normalizeCode(u.code);
        const modMeta = certModulesByCode.get(key);
        const slot = store.teachingTimetableSlots.find(
          (s) => normalizeCode(s.unitCode) === key
        );
        unitsByNormCode.set(key, {
          id: `${row.registration.id}:${u.code}`,
          code: u.code,
          title: u.title,
          credits: u.credits,
          source: 'ACADEMIC_REGISTRATION',
          academicYear: row.academicYear,
          semesterName: row.semesterName,
          intakeCode: row.intakeCode,
          approvalStatus: row.registration.approvalStatus,
          programmeName: row.programmeName ?? modMeta?.programmeName ?? null,
          classGroup: studentCohorts[0]?.name ?? slot?.classGroupId ?? null,
          lecturerName: modMeta?.lecturerName ?? slot?.lecturerName ?? null,
          progressPercent: null,
          moduleStatus: row.registration.approvalStatus === 'APPROVED' ? 'REGISTERED' : row.registration.approvalStatus,
          examEligible: row.registration.feeThresholdCleared && row.registration.approvalStatus === 'APPROVED',
        });
      }
    }

    for (const assignment of certAssignments) {
      const key = normalizeCode(assignment.moduleCode);
      const modMeta = certModulesByCode.get(key);
      const slot = store.teachingTimetableSlots.find(
        (s) => normalizeCode(s.unitCode) === key
      );
      const existing = unitsByNormCode.get(key);
      if (existing) {
        existing.progressPercent = assignment.progressPercent;
        existing.moduleStatus = assignment.status;
        existing.examEligible = existing.examEligible && assignment.examEligible;
        existing.classGroup = assignment.className || existing.classGroup;
        existing.lecturerName = existing.lecturerName || modMeta?.lecturerName || slot?.lecturerName || null;
      } else {
        const credits = modMeta ? Math.max(1, Math.round(modMeta.trainingHours / 15)) : 3;
        totalRegisteredCredits += credits;
        unitsByNormCode.set(key, {
          id: assignment.id,
          code: assignment.moduleCode,
          title: assignment.moduleTitle,
          credits,
          source: 'CERTIFICATION_MODULE',
          academicYear: certState.academicPeriods.find((p) => p.status === 'OPEN')?.academicYear ?? null,
          semesterName: certState.academicPeriods.find((p) => p.status === 'OPEN')?.termName ?? null,
          intakeCode: null,
          approvalStatus: 'APPROVED',
          programmeName: assignment.programmeName,
          classGroup: assignment.className,
          lecturerName: modMeta?.lecturerName ?? slot?.lecturerName ?? null,
          progressPercent: assignment.progressPercent,
          moduleStatus: assignment.status,
          examEligible: assignment.examEligible,
        });
      }
    }

    const progression = certState.progressions.find(
      (p) => normalizeRegNo(p.studentRegNo) === normReg
    );

    return {
      studentRegNo: identity.studentRegNo,
      studentName: pgProfile?.fullName ?? identity.studentName,
      programmeName:
        pgProfile?.programmeName ??
        pgRegs[0]?.programmeName ??
        progression?.programmeName ??
        certAssignments[0]?.programmeName ??
        null,
      totalRegisteredCredits,
      units: Array.from(unitsByNormCode.values()),
    };
  },

  async getTimetable(
    identity: StudentAcademicIdentity,
    deps?: AcademicServiceDependencies
  ): Promise<{
    studentRegNo: string;
    programmeName: string | null;
    slots: StudentTimetableSlotView[];
  }> {
    const store = deps?.store ?? getDb();
    const { programmeName, units } = await this.getUnits(identity, deps);
    const registeredCodes = new Set(units.map((u) => normalizeCode(u.code)));
    const classGroups = new Set(
      units.map((u) => (u.classGroup ?? '').trim().toUpperCase()).filter(Boolean)
    );

    const matchingSlots = store.teachingTimetableSlots.filter((slot) => {
      if (registeredCodes.has(normalizeCode(slot.unitCode))) {
        return true;
      }
      if (classGroups.has(slot.classGroupId.trim().toUpperCase())) {
        return true;
      }
      if (
        programmeName &&
        slot.courseName.trim().toLowerCase() === programmeName.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    const sorted = [...matchingSlots]
      .sort((a, b) => {
        const d = dayOrder(a.dayOfWeek) - dayOrder(b.dayOfWeek);
        if (d !== 0) return d;
        return a.startTime.localeCompare(b.startTime);
      })
      .map((slot) => ({
        id: slot.id,
        unitCode: slot.unitCode,
        unitTitle: slot.unitTitle,
        courseName: slot.courseName,
        classGroupId: slot.classGroupId,
        lecturerName: slot.lecturerName,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomName: slot.roomName,
        sessionType: slot.sessionType,
        isToday: slot.isToday,
      }));

    return {
      studentRegNo: identity.studentRegNo,
      programmeName,
      slots: sorted,
    };
  },

  async getAttendance(
    identity: StudentAcademicIdentity,
    deps?: AcademicServiceDependencies
  ): Promise<{
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
    unitSummaries: StudentAttendanceUnitSummary[];
    sessions: StudentAttendanceSessionEntry[];
    absenceCasesCount: number;
  }> {
    const store = deps?.store ?? getDb();
    const usePg = deps?.pgEnabled ?? isPostgresConfigured();
    const normReg = normalizeRegNo(identity.studentRegNo);
    const minPct = store.attendancePolicy?.minimumExamAttendancePct ?? 75;

    const entriesBySessionId = new Map<string, StudentAttendanceSessionEntry>();

    if (usePg) {
      const pgRows = await fetchPgStudentAttendance(identity);
      for (const { record, session } of pgRows) {
        entriesBySessionId.set(session.id, {
          sessionId: session.id,
          unitCode: session.unitCode,
          unitTitle: session.unitTitle,
          sessionDate: session.sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
          roomName: session.roomName,
          lecturerName: session.lecturerName,
          status: (record.status.toUpperCase() as AttendanceMarkStatus) || 'PRESENT',
          method: record.method,
          arrivalTime: record.arrivalTime ?? null,
          remarks: record.remarks ?? '',
          markedAt:
            record.markedAt instanceof Date
              ? record.markedAt.toISOString()
              : String(record.markedAt),
        });
      }
    }

    for (const session of store.attendanceSessions) {
      if (entriesBySessionId.has(session.id)) continue;
      const studentRecord = session.records.find(
        (r) => normalizeRegNo(r.studentRegNo) === normReg
      );
      if (!studentRecord) continue;

      entriesBySessionId.set(session.id, {
        sessionId: session.id,
        unitCode: session.unitCode,
        unitTitle: session.unitTitle,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        roomName: session.roomName,
        lecturerName: session.lecturerName,
        status: studentRecord.status,
        method: studentRecord.method,
        arrivalTime: studentRecord.arrivalTime,
        remarks: studentRecord.remarks,
        markedAt: studentRecord.markedAt,
      });
    }

    const sessions = Array.from(entriesBySessionId.values()).sort((a, b) =>
      b.sessionDate.localeCompare(a.sessionDate)
    );

    const byUnit = new Map<
      string,
      {
        unitCode: string;
        unitTitle: string;
        totalSessions: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
        excusedCount: number;
      }
    >();

    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    for (const s of sessions) {
      if (s.status === 'PRESENT') present += 1;
      else if (s.status === 'LATE') late += 1;
      else if (s.status === 'EXCUSED') excused += 1;
      else absent += 1;

      const key = normalizeCode(s.unitCode);
      const bucket = byUnit.get(key) ?? {
        unitCode: s.unitCode,
        unitTitle: s.unitTitle,
        totalSessions: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        excusedCount: 0,
      };
      bucket.totalSessions += 1;
      if (s.status === 'PRESENT') bucket.presentCount += 1;
      else if (s.status === 'LATE') bucket.lateCount += 1;
      else if (s.status === 'EXCUSED') bucket.excusedCount += 1;
      else bucket.absentCount += 1;
      byUnit.set(key, bucket);
    }

    const unitSummaries: StudentAttendanceUnitSummary[] = Array.from(byUnit.values()).map((u) => {
      const attended = u.presentCount + u.lateCount + u.excusedCount;
      const rate =
        u.totalSessions > 0 ? Math.round((attended / u.totalSessions) * 100) : 100;
      return {
        ...u,
        attendanceRatePct: rate,
        examEligible: rate >= minPct,
      };
    });

    const totalSessions = sessions.length;
    const totalAttended = present + late + excused;
    const overallAttendanceRatePct =
      totalSessions > 0
        ? Math.round((totalAttended / totalSessions) * 100)
        : 100;

    const absenceCasesCount = store.studentAbsenceCases.filter(
      (c) => normalizeRegNo(c.studentRegNo) === normReg
    ).length;

    return {
      studentRegNo: identity.studentRegNo,
      studentName: identity.studentName,
      readOnly: true,
      minimumExamAttendancePct: minPct,
      overallAttendanceRatePct,
      meetsExamThreshold:
        totalSessions === 0 || overallAttendanceRatePct >= minPct,
      totals: {
        sessionsRecorded: totalSessions,
        present,
        late,
        absent,
        excused,
      },
      unitSummaries,
      sessions,
      absenceCasesCount,
    };
  },

  async getAssessments(
    identity: StudentAcademicIdentity,
    deps?: AcademicServiceDependencies
  ): Promise<{
    studentRegNo: string;
    assessments: StudentAssessmentView[];
  }> {
    const store = deps?.store ?? getDb();
    const normReg = normalizeRegNo(identity.studentRegNo);
    const { units } = await this.getUnits(identity, deps);
    const unitCodes = new Set(units.map((u) => normalizeCode(u.code)));

    const publishedExams = store.secureExamDefinitions.filter((exam) => {
      if (!exam.isPublished) return false;
      if (unitCodes.size === 0) return true;
      return unitCodes.has(normalizeCode(exam.unitCode)) || exam.isPublished;
    });

    const sessionsByExamId = new Map(
      store.secureExamSessions
        .filter((s) => normalizeRegNo(s.studentRegNo) === normReg)
        .map((s) => [s.examId, s])
    );

    const assessments: StudentAssessmentView[] = publishedExams.map((exam) => {
      const attempt = sessionsByExamId.get(exam.id);
      return {
        id: exam.id,
        code: exam.code,
        title: exam.title,
        unitCode: exam.unitCode,
        subject: exam.subject,
        kind: 'CBT_EXAM',
        assessmentMode: 'Online Secure CBT',
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        startsAt: exam.startsAt,
        endsAt: exam.endsAt,
        maxAttempts: exam.maxAttempts,
        status: attempt ? attempt.status : 'AVAILABLE',
        examEligible: true,
      };
    });

    const modById = new Map(store.certificationState.modules.map((m) => [m.id, m]));
    for (const assignment of store.certificationState.moduleAssignments) {
      if (normalizeRegNo(assignment.studentRegNo) !== normReg) continue;
      const alreadyListed = assessments.some(
        (a) => normalizeCode(a.unitCode) === normalizeCode(assignment.moduleCode)
      );
      if (alreadyListed) continue;
      const mod = modById.get(assignment.moduleId);
      assessments.push({
        id: `mod-assess:${assignment.id}`,
        code: assignment.moduleCode,
        title: `${assignment.moduleTitle} Assessment`,
        unitCode: assignment.moduleCode,
        subject: assignment.programmeName,
        kind: 'MODULE_ASSESSMENT',
        assessmentMode: mod?.assessmentMode ?? 'Theory & Practical',
        durationMinutes: null,
        totalMarks: 100,
        startsAt: null,
        endsAt: null,
        maxAttempts: 1,
        status: assignment.status,
        examEligible: assignment.examEligible,
      });
    }

    return {
      studentRegNo: identity.studentRegNo,
      assessments,
    };
  },

  async getResults(
    identity: StudentAcademicIdentity,
    deps?: AcademicServiceDependencies
  ): Promise<{
    studentRegNo: string;
    studentName: string;
    releasedOnly: true;
    results: StudentReleasedResultView[];
  }> {
    const store = deps?.store ?? getDb();
    const normReg = normalizeRegNo(identity.studentRegNo);

    // Strictly only expose officially RELEASED examination results.
    // PENDING_MARKING, AI_DRAFT_PENDING_HUMAN_REVIEW, MODERATED, APPROVED_FOR_RELEASE remain blocked.
    const releasedSubmissions = store.certificationState.markingSubmissions.filter(
      (sub: ExamMarkingSubmission) =>
        normalizeRegNo(sub.studentRegNo) === normReg &&
        sub.moderationStatus === 'RELEASED'
    );

    const results: StudentReleasedResultView[] = releasedSubmissions
      .sort((a, b) =>
        (b.releasedAt ?? b.submittedAt).localeCompare(a.releasedAt ?? a.submittedAt)
      )
      .map((sub) => {
        const totalScore = sub.objectiveScore + sub.manualScore;
        const maxMarks = Math.max(1, sub.totalMarks);
        const percentage = Math.round((totalScore / maxMarks) * 1000) / 10;
        const { grade, gradePoints } = resolveGradeFromPercent(percentage);
        return {
          id: sub.id,
          attemptRef: sub.attemptRef,
          examId: sub.examId,
          examTitle: sub.examTitle,
          examBody: sub.examBody,
          moduleCode: sub.moduleCode,
          objectiveScore: sub.objectiveScore,
          manualScore: sub.manualScore,
          totalScore,
          totalMarks: sub.totalMarks,
          percentage,
          passMark: sub.passMark,
          passed: totalScore >= sub.passMark,
          grade,
          gradePoints,
          lecturerFeedback: sub.lecturerFeedback,
          practicalFeedback: sub.practicalFeedback ?? null,
          moderationStatus: 'RELEASED',
          approvedByName: sub.approvedByName ?? null,
          moderatedByName: sub.moderatedByName ?? null,
          releasedAt: sub.releasedAt ?? null,
          submittedAt: sub.submittedAt,
        };
      });

    return {
      studentRegNo: identity.studentRegNo,
      studentName: identity.studentName,
      releasedOnly: true,
      results,
    };
  },

  async getProgress(
    identity: StudentAcademicIdentity,
    deps?: AcademicServiceDependencies
  ): Promise<{
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
  }> {
    const store = deps?.store ?? getDb();
    const normReg = normalizeRegNo(identity.studentRegNo);

    const [unitsData, resultsData, attendanceData] = await Promise.all([
      this.getUnits(identity, deps),
      this.getResults(identity, deps),
      this.getAttendance(identity, deps),
    ]);

    const creditLookup = new Map(
      unitsData.units.map((u) => [normalizeCode(u.code), Math.max(1, u.credits)])
    );

    let weightedPointsSum = 0;
    let totalWeight = 0;
    let percentageSum = 0;
    let passedCount = 0;

    for (const r of resultsData.results) {
      const weight = creditLookup.get(normalizeCode(r.moduleCode)) ?? 3;
      weightedPointsSum += r.gradePoints * weight;
      totalWeight += weight;
      percentageSum += r.percentage;
      if (r.passed) passedCount += 1;
    }

    const gpa =
      totalWeight > 0 ? Number((weightedPointsSum / totalWeight).toFixed(2)) : null;
    const averagePercentage =
      resultsData.results.length > 0
        ? Number((percentageSum / resultsData.results.length).toFixed(1))
        : null;

    const progression = store.certificationState.progressions.find(
      (p) => normalizeRegNo(p.studentRegNo) === normReg
    );

    const completedModulesCount = unitsData.units.filter(
      (u) => u.moduleStatus === 'COMPLETED'
    ).length;

    const progressPercent = progression
      ? progression.progressPercent
      : unitsData.units.length > 0
        ? Math.round((completedModulesCount / unitsData.units.length) * 100)
        : 0;

    return {
      studentRegNo: identity.studentRegNo,
      studentName: unitsData.studentName,
      programmeName: unitsData.programmeName,
      gpa,
      gpaScale: 4.0,
      averagePercentage,
      releasedResultsCount: resultsData.results.length,
      passedAssessmentsCount: passedCount,
      registeredUnitsCount: unitsData.units.length,
      totalRegisteredCredits: unitsData.totalRegisteredCredits,
      completedModulesCount,
      attendanceRatePct: attendanceData.overallAttendanceRatePct,
      meetsExamAttendanceThreshold: attendanceData.meetsExamThreshold,
      certificationStage: progression?.stage ?? null,
      progressPercent,
      eligibleForCertification: Boolean(progression?.eligibleForCertification),
    };
  },

  async getExamTimetable(
    identity: StudentAcademicIdentity,
    deps?: AcademicServiceDependencies
  ): Promise<{
    studentRegNo: string;
    entries: StudentExamTimetableEntry[];
  }> {
    const store = deps?.store ?? getDb();
    const normReg = normalizeRegNo(identity.studentRegNo);
    const { units } = await this.getUnits(identity, deps);
    const registeredModuleCodes = new Set(units.map((u) => normalizeCode(u.code)));

    const entries: StudentExamTimetableEntry[] = [];

    for (const session of store.certificationState.invigilatorSessions) {
      if (session.status === 'CANCELLED' || session.status === 'DRAFT') {
        continue;
      }

      const myCandidateRow = session.candidates.find(
        (c) => normalizeRegNo(c.studentRegNo) === normReg
      );
      const matchesUnit = registeredModuleCodes.has(normalizeCode(session.moduleCode));

      if (!myCandidateRow && !matchesUnit) {
        continue;
      }

      entries.push({
        id: session.id,
        reference: session.sessionRef,
        title: session.examTitle,
        moduleCode: session.moduleCode,
        examBody: session.examBody,
        kind: 'INVIGILATED_SITTING',
        scheduledDate: session.scheduledDate,
        startTime: session.startTime,
        durationMinutes: session.durationMinutes,
        room: session.room,
        campusName: session.campusName,
        status: session.status,
        candidateAttendanceStatus: myCandidateRow?.attendanceStatus ?? null,
        workstation: myCandidateRow?.workstation ?? null,
      });
    }

    for (const exam of store.secureExamDefinitions) {
      if (!exam.isPublished) continue;
      const alreadyCovered = entries.some(
        (e) =>
          normalizeCode(e.moduleCode) === normalizeCode(exam.unitCode) &&
          e.title.toLowerCase() === exam.title.toLowerCase()
      );
      if (alreadyCovered) continue;

      entries.push({
        id: exam.id,
        reference: exam.code,
        title: exam.title,
        moduleCode: exam.unitCode,
        examBody: 'HI_TECH_INTERNAL',
        kind: 'SECURE_CBT_WINDOW',
        scheduledDate: exam.startsAt.slice(0, 10),
        startTime: exam.startsAt.slice(11, 16) || '08:00',
        durationMinutes: exam.durationMinutes,
        room: 'Secure CBT Portal (Online)',
        campusName: 'Online / Main Campus Lab',
        status: 'SCHEDULED',
        candidateAttendanceStatus: null,
        workstation: null,
      });
    }

    entries.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

    return {
      studentRegNo: identity.studentRegNo,
      entries,
    };
  },
};

export { isAttendedStatus };
