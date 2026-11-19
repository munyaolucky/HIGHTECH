import crypto from 'node:crypto';
import path from 'node:path';
import { getDb, saveDb } from '../../data/store.ts';
import type { StaffRoleCode } from '../staff/staff.permissions.ts';
import { STAFF_PERMISSIONS } from '../staff/staff.permissions.ts';
import {
  ABSENCE_REASON_CATEGORIES,
  ALLOWED_TEACHING_DOC_EXTENSIONS,
  ATTENDANCE_MARK_STATUSES,
  LESSON_DELIVERY_STATUSES,
  MAX_EVIDENCE_BYTES,
  MAX_TEACHING_DOC_BYTES,
  TEACHING_DOCUMENT_CATEGORIES,
  TEACHING_DOCUMENT_CATEGORY_LABELS,
  TEACHING_REPORT_CATALOGUE,
  type AbsenceCaseStatus,
  type AbsenceEvidenceRecord,
  type AbsenceReasonCategory,
  type AcademicInterventionRecord,
  type AttendanceAlertRecord,
  type AttendanceMarkStatus,
  type AttendancePolicyConfig,
  type AttendanceSessionRecord,
  type CatchUpLessonRecord,
  type LessonDeliveryRecordItem,
  type LessonDeliveryStatus,
  type LessonObservationRecord,
  type StudentAbsenceCaseRecord,
  type TeachingDocumentCategory,
  type TeachingDocumentItem,
  type TeachingReportKey,
} from './teaching.types.ts';

export class TeachingHttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface TeachingActor {
  id: string;
  fullName: string;
  role: StaffRoleCode | 'STUDENT' | string;
  departmentId: string | null;
  department: string;
  permissions: string[];
  registrationNumber?: string | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeText(val: unknown, maxLen = 1000): string {
  return String(val ?? '')
    .trim()
    .slice(0, maxLen);
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

function addAudit(
  actor: TeachingActor,
  action: string,
  entityType: string,
  entityId: string,
  detail: string
): void {
  const db = getDb();
  db.teachingAuditLogs.unshift({
    id: `taud-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: String(actor.role),
    action,
    entityType,
    entityId,
    detail,
    createdAt: nowIso(),
  });
}

function pushAlert(alert: Omit<AttendanceAlertRecord, 'id' | 'read' | 'createdAt'>): void {
  const db = getDb();
  db.attendanceAlerts.unshift({
    id: `alt-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    ...alert,
    read: false,
    createdAt: nowIso(),
  });
}

export function canViewRestrictedMedicalEvidence(
  actor: TeachingActor,
  absCase: StudentAbsenceCaseRecord
): boolean {
  const role = String(actor.role).toUpperCase();
  if (role === 'ADMIN') return false; // Strict governance separation: IT/System Admin never views confidential medical files
  if (role === 'STUDENT') {
    return (
      actor.id === absCase.studentRegNo ||
      actor.registrationNumber === absCase.studentRegNo
    );
  }
  if (role === 'STUDENT_AFFAIRS' || role === 'PRINCIPAL') {
    return true;
  }
  if (role === 'HOD') {
    return !actor.departmentId || actor.departmentId === absCase.departmentId;
  }
  if (role === 'LECTURER') {
    return absCase.lecturerId === actor.id;
  }
  return false;
}

function sanitizeEvidenceForActor(
  actor: TeachingActor,
  absCase: StudentAbsenceCaseRecord,
  ev: AbsenceEvidenceRecord
) {
  const allowed = !ev.isConfidentialMedical || canViewRestrictedMedicalEvidence(actor, absCase);
  if (!allowed) {
    return {
      id: ev.id,
      absenceCaseId: ev.absenceCaseId,
      fileName: 'Confidential Medical Record (Restricted)',
      mimeType: 'application/octet-stream',
      fileSizeBytes: ev.fileSizeBytes,
      description: 'Restricted medical documentation visible only to Student, Assigned Trainer, HOD, Welfare & Principal.',
      isConfidentialMedical: true,
      accessRestricted: true,
      uploadedByName: ev.uploadedByName,
      uploadedByRole: ev.uploadedByRole,
      createdAt: ev.createdAt,
    };
  }
  return {
    id: ev.id,
    absenceCaseId: ev.absenceCaseId,
    fileName: ev.fileName,
    mimeType: ev.mimeType,
    fileSizeBytes: ev.fileSizeBytes,
    description: ev.description,
    isConfidentialMedical: ev.isConfidentialMedical,
    accessRestricted: false,
    uploadedByName: ev.uploadedByName,
    uploadedByRole: ev.uploadedByRole,
    createdAt: ev.createdAt,
  };
}

function validateFileUpload(
  fileName: string,
  fileSizeBytes: number,
  maxBytes: number
): { cleanName: string; ext: string } {
  const cleanName = path.basename(sanitizeText(fileName, 160));
  if (!cleanName) {
    throw new TeachingHttpError(400, 'File name is required.');
  }
  const ext = path.extname(cleanName).toLowerCase();
  if (!ALLOWED_TEACHING_DOC_EXTENSIONS.has(ext)) {
    throw new TeachingHttpError(
      400,
      `Unsupported file format (${ext || 'unknown'}). Allowed: PDF, DOCX, PPTX, XLSX, TXT, CSV, PNG, JPG, ZIP.`
    );
  }
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    throw new TeachingHttpError(400, 'Uploaded file cannot be empty.');
  }
  if (fileSizeBytes > maxBytes) {
    throw new TeachingHttpError(
      400,
      `File size exceeds maximum limit of ${Math.round(maxBytes / (1024 * 1024))} MB.`
    );
  }
  return { cleanName, ext };
}

function recomputeSessionStats(session: AttendanceSessionRecord): void {
  const total = session.records.length;
  const present = session.records.filter((r) => r.status === 'PRESENT').length;
  const late = session.records.filter((r) => r.status === 'LATE').length;
  const absent = session.records.filter((r) => r.status === 'ABSENT').length;
  const excused = session.records.filter((r) => r.status === 'EXCUSED').length;
  session.totalStudents = total;
  session.presentCount = present;
  session.lateCount = late;
  session.absentCount = absent;
  session.excusedCount = excused;
  session.attendanceRate =
    total > 0 ? Math.round(((present + excused + late * 0.5) / total) * 100) : 100;
}

function evaluateAbsenceThresholdsAndCreateCase(
  actor: TeachingActor,
  session: AttendanceSessionRecord,
  recordId: string,
  studentRegNo: string,
  studentName: string,
  linkedLessonId: string | null
): StudentAbsenceCaseRecord {
  const db = getDb();
  const existing = db.studentAbsenceCases.find(
    (c) => c.attendanceSessionId === session.id && c.studentRegNo === studentRegNo
  );
  if (existing) return existing;

  const priorUnitCases = db.studentAbsenceCases.filter(
    (c) => c.studentRegNo === studentRegNo && c.unitCode === session.unitCode
  ).length;
  const priorTermCases = db.studentAbsenceCases.filter(
    (c) => c.studentRegNo === studentRegNo
  ).length;

  // Check consecutive absences across most recent sessions for same unit
  const unitSessions = db.attendanceSessions
    .filter((s) => s.unitCode === session.unitCode)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  let consecutive = 0;
  for (const s of unitSessions) {
    const rec = s.records.find((r) => r.studentRegNo === studentRegNo);
    if (rec && rec.status === 'ABSENT') {
      consecutive += 1;
    } else if (rec) {
      break;
    }
  }
  consecutive = Math.max(1, consecutive);
  const unitAbsenceCount = priorUnitCases + 1;
  const termAbsenceCount = priorTermCases + 1;

  const policy = db.attendancePolicy;
  let escalationLevel: StudentAbsenceCaseRecord['escalationLevel'] = 'NONE';
  let status: AbsenceCaseStatus = 'AWAITING_EXPLANATION';
  let assignedReviewerRole = 'LECTURER';

  if (termAbsenceCount >= policy.unresolvedPrincipalEscalation) {
    escalationLevel = 'PRINCIPAL';
    status = 'ESCALATED';
    assignedReviewerRole = 'PRINCIPAL';
  } else if (
    unitAbsenceCount >= policy.unitAbsenceHodAlert ||
    termAbsenceCount >= policy.termAbsenceHodEscalation
  ) {
    escalationLevel = 'HOD';
    assignedReviewerRole = 'HOD';
  } else if (consecutive >= policy.consecutiveAbsenceTrainerAlert) {
    escalationLevel = 'LECTURER';
  }

  const slot = db.teachingTimetableSlots.find((s) => s.assignmentId === session.assignmentId);

  const absCase: StudentAbsenceCaseRecord = {
    id: `abs-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    attendanceSessionId: session.id,
    attendanceRecordId: recordId,
    lessonDeliveryId: linkedLessonId,
    studentRegNo,
    studentName,
    departmentId: session.departmentId,
    departmentName: slot?.departmentName ?? 'School of Computing & Informatics',
    courseName: slot?.courseName ?? 'Diploma Programme',
    unitCode: session.unitCode,
    unitTitle: session.unitTitle,
    classGroupId: session.classGroupId,
    lecturerId: session.lecturerId,
    lecturerName: session.lecturerName,
    absenceDate: session.sessionDate,
    consecutiveAbsenceCount: consecutive,
    unitAbsenceCount,
    termAbsenceCount,
    status,
    escalationLevel,
    assignedReviewerRole,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db.studentAbsenceCases.unshift(absCase);

  // Student notification on every recorded absence
  pushAlert({
    targetRole: 'STUDENT',
    targetUserId: null,
    targetStudentRegNo: studentRegNo,
    departmentId: session.departmentId,
    severity: 'WARNING',
    category: 'ABSENCE_EXPLANATION_REQUIRED',
    title: `Absence recorded in ${session.unitCode} (${session.sessionDate})`,
    message: `You were marked absent for ${session.unitCode} (${session.unitTitle}). Submit your explanation or supporting note in the Student Portal.`,
    relatedEntityId: absCase.id,
  });

  if (consecutive >= policy.consecutiveAbsenceTrainerAlert) {
    pushAlert({
      targetRole: 'LECTURER',
      targetUserId: session.lecturerId,
      targetStudentRegNo: null,
      departmentId: session.departmentId,
      severity: 'WARNING',
      category: 'CONSECUTIVE_ABSENCE',
      title: `${consecutive} Consecutive Absences — ${studentName}`,
      message: `${studentRegNo} missed ${consecutive} consecutive sessions in ${session.unitCode}. Follow up or record verbal explanation.`,
      relatedEntityId: absCase.id,
    });
  }

  if (
    unitAbsenceCount >= policy.unitAbsenceHodAlert ||
    termAbsenceCount >= policy.termAbsenceHodEscalation
  ) {
    db.absenceEscalations.unshift({
      id: `abesc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      absenceCaseId: absCase.id,
      fromRole: 'LECTURER',
      toRole: escalationLevel === 'PRINCIPAL' ? 'PRINCIPAL' : 'HOD',
      triggerRule:
        escalationLevel === 'PRINCIPAL'
          ? 'THRESHOLD_TERM_CHRONIC_ABSENCE'
          : 'THRESHOLD_UNIT_ABSENCE_HOD',
      reason: `${studentName} (${studentRegNo}) reached ${unitAbsenceCount} absences in ${session.unitCode} (${termAbsenceCount} term total).`,
      escalatedById: actor.id,
      escalatedByName: actor.fullName,
      resolved: false,
      resolvedByName: null,
      resolvedAt: null,
      createdAt: nowIso(),
    });

    pushAlert({
      targetRole: 'HOD',
      targetUserId: null,
      targetStudentRegNo: null,
      departmentId: session.departmentId,
      severity: 'CRITICAL',
      category: 'UNIT_ABSENCE_THRESHOLD',
      title: `HOD Escalation: ${studentName} (${unitAbsenceCount} unit absences)`,
      message: `${studentRegNo} crossed HOD threshold in ${session.unitCode}.`,
      relatedEntityId: absCase.id,
    });
  }

  if (termAbsenceCount >= policy.unresolvedPrincipalEscalation) {
    pushAlert({
      targetRole: 'PRINCIPAL',
      targetUserId: null,
      targetStudentRegNo: null,
      departmentId: session.departmentId,
      severity: 'CRITICAL',
      category: 'CHRONIC_ABSENCE_ESCALATION',
      title: `Principal Escalation: Chronic Term Absence (${termAbsenceCount} sessions)`,
      message: `${studentName} (${studentRegNo}) exceeded institutional absence threshold (${termAbsenceCount} term absences).`,
      relatedEntityId: absCase.id,
    });
  }

  return absCase;
}

export const teachingService = {
  getLecturerDashboardSummary(actor: TeachingActor) {
    const db = getDb();
    const isDeptOrExec = ['HOD', 'PRINCIPAL', 'REGISTRAR', 'QUALITY_ASSURANCE'].includes(
      String(actor.role)
    );
    const timetable = isDeptOrExec
      ? db.teachingTimetableSlots
      : db.teachingTimetableSlots.filter((t) => t.lecturerId === actor.id);

    const todayClasses = timetable.filter((t) => t.isToday);
    const lessons = isDeptOrExec
      ? db.lessonDeliveryRecords
      : db.lessonDeliveryRecords.filter((l) => l.lecturerId === actor.id || l.actualTrainerId === actor.id);
    const docs = isDeptOrExec
      ? db.teachingDocuments
      : db.teachingDocuments.filter((d) => d.uploadedById === actor.id);
    const absenceCases = db.studentAbsenceCases.filter((c) => {
      if (isDeptOrExec) {
        return actor.role === 'HOD' && actor.departmentId ? c.departmentId === actor.departmentId : true;
      }
      return c.lecturerId === actor.id;
    });
    const pendingCases = absenceCases.filter((c) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status));

    const alerts = db.attendanceAlerts.filter((a) => {
      if (actor.role === 'LECTURER') {
        return a.targetRole === 'LECTURER' && (!a.targetUserId || a.targetUserId === actor.id);
      }
      if (actor.role === 'HOD') {
        return a.targetRole === 'HOD' && (!actor.departmentId || a.departmentId === actor.departmentId);
      }
      return a.targetRole === actor.role;
    });

    return {
      kpis: {
        todaysClassesCount: todayClasses.length,
        lessonsRecordedCount: lessons.filter((l) => l.status !== 'SCHEDULED').length,
        documentsUploadedCount: docs.length,
        absenceCasesToReviewCount: pendingCases.length,
      },
      timetable,
      alerts,
      policy: db.attendancePolicy,
      documentCategories: TEACHING_DOCUMENT_CATEGORIES.map((code) => ({
        code,
        label: TEACHING_DOCUMENT_CATEGORY_LABELS[code],
      })),
    };
  },

  listDocuments(
    actor: TeachingActor,
    filters?: { category?: string; status?: string; unitCode?: string; search?: string }
  ) {
    const db = getDb();
    let docs = [...db.teachingDocuments];
    if (actor.role === 'LECTURER') {
      docs = docs.filter((d) => d.uploadedById === actor.id);
    } else if (actor.role === 'HOD' && actor.departmentId) {
      docs = docs.filter((d) => d.departmentId === actor.departmentId);
    }

    if (filters?.category && filters.category !== 'ALL') {
      docs = docs.filter((d) => d.category === filters.category);
    }
    if (filters?.status && filters.status !== 'ALL') {
      docs = docs.filter((d) => d.status === filters.status);
    }
    if (filters?.unitCode && filters.unitCode !== 'ALL') {
      docs = docs.filter((d) => d.unitCode === filters.unitCode);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.unitCode.toLowerCase().includes(q) ||
          d.uploadedByName.toLowerCase().includes(q)
      );
    }

    return docs.map((doc) => ({
      ...doc,
      categoryLabel: TEACHING_DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category,
      versions: db.teachingDocumentVersions
        .filter((v) => v.documentId === doc.id)
        .sort((a, b) => b.versionNumber - a.versionNumber)
        .map(({ fileContentBase64: _b64, ...meta }) => meta),
      approvals: db.teachingDocumentApprovals.filter((ap) => ap.documentId === doc.id),
    }));
  },

  uploadDocument(
    actor: TeachingActor,
    input: {
      assignmentId?: string;
      unitCode: string;
      unitTitle?: string;
      courseName?: string;
      classGroupId?: string;
      academicYear?: string;
      term?: string;
      category: string;
      title: string;
      description?: string;
      fileName: string;
      mimeType?: string;
      fileSizeBytes: number;
      fileContentBase64?: string;
      submitNow?: boolean;
      expiresAt?: string | null;
    }
  ) {
    const category = String(input.category || '').toUpperCase() as TeachingDocumentCategory;
    if (!TEACHING_DOCUMENT_CATEGORIES.includes(category)) {
      throw new TeachingHttpError(400, `Invalid teaching document category: ${input.category}`);
    }
    const title = sanitizeText(input.title, 200);
    if (!title) throw new TeachingHttpError(400, 'Document title is required.');

    const { cleanName } = validateFileUpload(
      input.fileName,
      Number(input.fileSizeBytes || 0),
      MAX_TEACHING_DOC_BYTES
    );

    const db = getDb();
    const slot =
      db.teachingTimetableSlots.find(
        (s) => s.assignmentId === input.assignmentId || s.unitCode === input.unitCode
      ) ?? db.teachingTimetableSlots[0];

    const id = `tdoc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = nowIso();
    const initialStatus = input.submitNow ? 'SUBMITTED' : 'DRAFT';

    const doc: TeachingDocumentItem = {
      id,
      assignmentId: input.assignmentId || slot?.assignmentId || 'asg-csc301',
      departmentId: actor.departmentId || slot?.departmentId || 'dept-computing',
      departmentName: actor.department || slot?.departmentName || 'School of Computing & Informatics',
      courseName: sanitizeText(input.courseName || slot?.courseName || 'Diploma in ICT', 160),
      classGroupId: sanitizeText(input.classGroupId || slot?.classGroupId || 'DICT-2026-A', 60),
      unitCode: sanitizeText(input.unitCode || slot?.unitCode || 'CSC 301', 40),
      unitTitle: sanitizeText(input.unitTitle || slot?.unitTitle || 'Course Unit', 160),
      academicYear: sanitizeText(input.academicYear || '2026', 20),
      term: sanitizeText(input.term || 'Term 3 / Semester 1', 40),
      category,
      title,
      description: sanitizeText(input.description, 500),
      status: initialStatus,
      currentVersion: 1,
      uploadedById: actor.id,
      uploadedByName: actor.fullName,
      approvedById: null,
      approvedByName: null,
      approvalComments: null,
      expiresAt: input.expiresAt || null,
      createdAt: now,
      updatedAt: now,
    };

    db.teachingDocuments.unshift(doc);
    db.teachingDocumentVersions.unshift({
      id: `tdver-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      documentId: id,
      versionNumber: 1,
      fileName: cleanName,
      mimeType: sanitizeText(input.mimeType || 'application/pdf', 120),
      fileSizeBytes: Number(input.fileSizeBytes),
      fileContentBase64: String(
        input.fileContentBase64 || Buffer.from(`HI-TECH Document: ${title}`).toString('base64')
      ),
      changeSummary: 'Initial upload',
      uploadedById: actor.id,
      uploadedByName: actor.fullName,
      createdAt: now,
    });

    if (initialStatus === 'SUBMITTED') {
      db.teachingDocumentApprovals.unshift({
        id: `tdapp-${Date.now()}`,
        documentId: id,
        reviewerId: actor.id,
        reviewerName: actor.fullName,
        reviewerRole: String(actor.role),
        decision: 'SUBMITTED',
        comment: 'Submitted for HOD review',
        decidedAt: now,
      });
    }

    addAudit(actor, 'TEACHING_DOCUMENT_UPLOADED', 'TeachingDocument', id, `Uploaded ${category}: ${title} (${cleanName})`);
    saveDb(db);
    return this.listDocuments(actor).find((d) => d.id === id)!;
  },

  addDocumentVersion(
    actor: TeachingActor,
    docId: string,
    input: {
      fileName: string;
      mimeType?: string;
      fileSizeBytes: number;
      fileContentBase64?: string;
      changeSummary?: string;
      submitNow?: boolean;
    }
  ) {
    const db = getDb();
    const doc = db.teachingDocuments.find((d) => d.id === docId);
    if (!doc) throw new TeachingHttpError(404, 'Teaching document not found.');
    if (actor.role === 'LECTURER' && doc.uploadedById !== actor.id) {
      throw new TeachingHttpError(403, 'You may only upload new versions for your own teaching documents.');
    }

    const { cleanName } = validateFileUpload(
      input.fileName,
      Number(input.fileSizeBytes || 0),
      MAX_TEACHING_DOC_BYTES
    );

    const nextVer = doc.currentVersion + 1;
    const now = nowIso();
    doc.currentVersion = nextVer;
    doc.updatedAt = now;
    if (input.submitNow || doc.status === 'RETURNED') {
      doc.status = 'SUBMITTED';
    }

    db.teachingDocumentVersions.unshift({
      id: `tdver-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      documentId: doc.id,
      versionNumber: nextVer,
      fileName: cleanName,
      mimeType: sanitizeText(input.mimeType || 'application/pdf', 120),
      fileSizeBytes: Number(input.fileSizeBytes),
      fileContentBase64: String(
        input.fileContentBase64 || Buffer.from(`HI-TECH Document v${nextVer}: ${doc.title}`).toString('base64')
      ),
      changeSummary: sanitizeText(input.changeSummary || `Version ${nextVer} update`, 300),
      uploadedById: actor.id,
      uploadedByName: actor.fullName,
      createdAt: now,
    });

    addAudit(actor, 'TEACHING_DOCUMENT_VERSION_ADDED', 'TeachingDocument', doc.id, `Added v${nextVer} (${cleanName})`);
    saveDb(db);
    return this.listDocuments(actor).find((d) => d.id === doc.id)!;
  },

  transitionDocumentStatus(
    actor: TeachingActor,
    docId: string,
    action: 'SUBMIT' | 'APPROVE' | 'RETURN' | 'ARCHIVE',
    comment?: string
  ) {
    const db = getDb();
    const doc = db.teachingDocuments.find((d) => d.id === docId);
    if (!doc) throw new TeachingHttpError(404, 'Teaching document not found.');

    const cleanComment = sanitizeText(comment, 400);
    const now = nowIso();

    if (action === 'SUBMIT') {
      if (actor.role === 'LECTURER' && doc.uploadedById !== actor.id) {
        throw new TeachingHttpError(403, 'You cannot submit another lecturer’s document.');
      }
      doc.status = 'SUBMITTED';
      doc.updatedAt = now;
    } else if (action === 'APPROVE') {
      if (!actor.permissions.includes(STAFF_PERMISSIONS.TEACHING_DOCUMENTS_APPROVE)) {
        throw new TeachingHttpError(403, 'Only authorized HOD or Principal may approve teaching documents.');
      }
      if (actor.role === 'HOD' && actor.departmentId && doc.departmentId !== actor.departmentId) {
        throw new TeachingHttpError(403, 'HOD may only approve documents inside their own department.');
      }
      doc.status = 'APPROVED';
      doc.approvedById = actor.id;
      doc.approvedByName = actor.fullName;
      doc.approvalComments = cleanComment || 'Approved by academic reviewer.';
      doc.updatedAt = now;
    } else if (action === 'RETURN') {
      if (!actor.permissions.includes(STAFF_PERMISSIONS.TEACHING_DOCUMENTS_APPROVE)) {
        throw new TeachingHttpError(403, 'Only authorized HOD or Principal may return teaching documents.');
      }
      if (!cleanComment) {
        throw new TeachingHttpError(400, 'Please include review comments explaining requested revisions.');
      }
      doc.status = 'RETURNED';
      doc.approvalComments = cleanComment;
      doc.updatedAt = now;

      pushAlert({
        targetRole: 'LECTURER',
        targetUserId: doc.uploadedById,
        targetStudentRegNo: null,
        departmentId: doc.departmentId,
        severity: 'WARNING',
        category: 'DOCUMENT_RETURNED',
        title: `Revision requested: ${doc.title}`,
        message: `${actor.fullName} returned ${doc.unitCode} (${TEACHING_DOCUMENT_CATEGORY_LABELS[doc.category]}): ${cleanComment}`,
        relatedEntityId: doc.id,
      });
    } else if (action === 'ARCHIVE') {
      doc.status = 'ARCHIVED';
      doc.updatedAt = now;
    } else {
      throw new TeachingHttpError(400, `Unsupported document action: ${action}`);
    }

    db.teachingDocumentApprovals.unshift({
      id: `tdapp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      documentId: doc.id,
      reviewerId: actor.id,
      reviewerName: actor.fullName,
      reviewerRole: String(actor.role),
      decision: action === 'SUBMIT' ? 'SUBMITTED' : action === 'APPROVE' ? 'APPROVED' : action === 'RETURN' ? 'RETURNED' : 'ARCHIVED',
      comment: cleanComment || null,
      decidedAt: now,
    });

    addAudit(actor, `TEACHING_DOCUMENT_${action}`, 'TeachingDocument', doc.id, `${action} on ${doc.title}`);
    saveDb(db);
    return this.listDocuments(actor).find((d) => d.id === doc.id)!;
  },

  downloadDocument(actor: TeachingActor, docId: string, versionNumber?: number) {
    const db = getDb();
    const doc = db.teachingDocuments.find((d) => d.id === docId);
    if (!doc) throw new TeachingHttpError(404, 'Teaching document not found.');
    if (actor.role === 'LECTURER' && doc.uploadedById !== actor.id) {
      throw new TeachingHttpError(403, 'Access denied to another lecturer’s draft/document.');
    }
    const targetVer = versionNumber || doc.currentVersion;
    const ver = db.teachingDocumentVersions.find(
      (v) => v.documentId === doc.id && v.versionNumber === targetVer
    );
    if (!ver) throw new TeachingHttpError(404, 'Requested document version not found.');
    return { doc, version: ver };
  },

  listSchemes(actor: TeachingActor) {
    const db = getDb();
    let schemes = [...db.schemesOfWork];
    if (actor.role === 'LECTURER') {
      schemes = schemes.filter((s) => s.lecturerId === actor.id);
    } else if (actor.role === 'HOD' && actor.departmentId) {
      schemes = schemes.filter((s) => s.departmentId === actor.departmentId);
    }
    return schemes.map((s) => {
      const totalTopics = s.topics.length;
      const coveredTopics = s.topics.filter((t) => t.covered).length;
      const coveragePct = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;
      return {
        ...s,
        totalTopics,
        coveredTopics,
        coveragePct,
        unfinishedTopics: s.topics.filter((t) => !t.covered),
      };
    });
  },

  createScheme(
    actor: TeachingActor,
    input: {
      unitCode: string;
      unitTitle: string;
      classGroupId: string;
      academicYear?: string;
      term?: string;
      title: string;
      topics: Array<{
        weekNumber: number;
        plannedDate: string;
        topicTitle: string;
        subtopics?: string;
        learningOutcomes?: string;
        activities?: string;
        resources?: string;
      }>;
    }
  ) {
    const db = getDb();
    const id = `sch-${Date.now()}`;
    const schemeId = id;
    const topics = (input.topics || []).map((t, idx) => ({
      id: `${schemeId}-t-${idx + 1}`,
      schemeId,
      weekNumber: Number(t.weekNumber || idx + 1),
      plannedDate: sanitizeText(t.plannedDate || '2026-11-25', 20),
      topicTitle: sanitizeText(t.topicTitle, 200),
      subtopics: sanitizeText(t.subtopics, 300),
      learningOutcomes: sanitizeText(t.learningOutcomes, 300),
      activities: sanitizeText(t.activities, 200),
      resources: sanitizeText(t.resources, 200),
      covered: false,
      actualCoveredDate: null,
      lessonDeliveryId: null,
      remarks: '',
    }));

    if (!input.unitCode || !input.title || topics.length === 0) {
      throw new TeachingHttpError(400, 'Unit code, scheme title, and at least one weekly topic are required.');
    }

    const slot = db.teachingTimetableSlots.find((s) => s.unitCode === input.unitCode);
    const scheme = {
      id,
      assignmentId: slot?.assignmentId || 'asg-custom',
      departmentId: actor.departmentId || slot?.departmentId || 'dept-computing',
      unitCode: sanitizeText(input.unitCode, 40),
      unitTitle: sanitizeText(input.unitTitle || slot?.unitTitle || input.unitCode, 160),
      classGroupId: sanitizeText(input.classGroupId || slot?.classGroupId || 'DICT-2026-A', 60),
      academicYear: sanitizeText(input.academicYear || '2026', 20),
      term: sanitizeText(input.term || 'Term 3 / Semester 1', 40),
      title: sanitizeText(input.title, 200),
      lecturerId: actor.id,
      lecturerName: actor.fullName,
      status: 'SUBMITTED' as const,
      topics,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.schemesOfWork.unshift(scheme);
    addAudit(actor, 'SCHEME_CREATED', 'SchemeOfWork', id, `Created scheme of work ${scheme.title}`);
    saveDb(db);
    return this.listSchemes(actor).find((s) => s.id === id)!;
  },

  toggleTopicCoverage(
    actor: TeachingActor,
    schemeId: string,
    topicId: string,
    covered: boolean,
    lessonDeliveryId?: string | null,
    remarks?: string
  ) {
    const db = getDb();
    const scheme = db.schemesOfWork.find((s) => s.id === schemeId);
    if (!scheme) throw new TeachingHttpError(404, 'Scheme of Work not found.');
    if (actor.role === 'LECTURER' && scheme.lecturerId !== actor.id) {
      throw new TeachingHttpError(403, 'Cannot update another lecturer’s scheme.');
    }
    const topic = scheme.topics.find((t) => t.id === topicId);
    if (!topic) throw new TeachingHttpError(404, 'Scheme topic not found.');

    topic.covered = covered;
    topic.actualCoveredDate = covered ? nowIso().slice(0, 10) : null;
    topic.lessonDeliveryId = covered ? lessonDeliveryId ?? topic.lessonDeliveryId : null;
    if (remarks !== undefined) topic.remarks = sanitizeText(remarks, 300);
    scheme.updatedAt = nowIso();

    addAudit(actor, 'SCHEME_TOPIC_UPDATED', 'SchemeOfWork', schemeId, `Marked "${topic.topicTitle}" ${covered ? 'COVERED' : 'PENDING'}`);
    saveDb(db);
    return this.listSchemes(actor).find((s) => s.id === schemeId)!;
  },

  listLessons(
    actor: TeachingActor,
    filters?: { status?: string; unitCode?: string; departmentId?: string }
  ) {
    const db = getDb();
    let list = [...db.lessonDeliveryRecords];
    if (actor.role === 'LECTURER') {
      list = list.filter((l) => l.lecturerId === actor.id || l.actualTrainerId === actor.id);
    } else if (actor.role === 'HOD' && actor.departmentId) {
      list = list.filter((l) => l.departmentId === actor.departmentId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((l) => l.status === filters.status);
    }
    if (filters?.unitCode && filters.unitCode !== 'ALL') {
      list = list.filter((l) => l.unitCode === filters.unitCode);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      list = list.filter((l) => l.departmentId === filters.departmentId);
    }

    return list.map((lesson) => {
      const att = db.attendanceSessions.find((s) => s.id === lesson.attendanceSessionId) ?? null;
      return {
        ...lesson,
        attendanceSummary: att
          ? {
              sessionId: att.id,
              totalStudents: att.totalStudents,
              presentCount: att.presentCount,
              lateCount: att.lateCount,
              absentCount: att.absentCount,
              excusedCount: att.excusedCount,
              attendanceRate: att.attendanceRate,
              locked: att.locked,
            }
          : null,
        observations: db.lessonObservations.filter((o) => o.lessonDeliveryId === lesson.id),
      };
    });
  },

  saveLessonDelivery(
    actor: TeachingActor,
    input: {
      id?: string;
      assignmentId?: string;
      attendanceSessionId?: string;
      timetableEntryId?: string;
      schemeTopicId?: string | null;
      unitCode: string;
      unitTitle?: string;
      courseName?: string;
      classGroupId?: string;
      lessonDate: string;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      roomName?: string;
      plannedTopic: string;
      actualTopicTaught?: string;
      subtopicsCovered?: string;
      learningObjectivesAchieved?: string;
      teachingMethods?: string;
      practicalsDone?: string;
      pagesOrSectionsCovered?: string;
      challengesFaced?: string;
      homeworkAssigned?: string;
      nextLessonPlan?: string;
      supportingDocumentIds?: string[];
      trainerRemarks?: string;
      status: string;
      actualTrainerId?: string;
      actualTrainerName?: string;
    }
  ) {
    const db = getDb();
    const status = String(input.status || 'SCHEDULED').toUpperCase() as LessonDeliveryStatus;
    if (!LESSON_DELIVERY_STATUSES.includes(status)) {
      throw new TeachingHttpError(400, `Invalid lesson status: ${input.status}`);
    }

    const plannedTopic = sanitizeText(input.plannedTopic, 200);
    if (!plannedTopic) throw new TeachingHttpError(400, 'Planned topic is required.');

    const actualTopicTaught = sanitizeText(input.actualTopicTaught, 240);
    const subtopicsCovered = sanitizeText(input.subtopicsCovered, 400);
    const learningObjectivesAchieved = sanitizeText(input.learningObjectivesAchieved, 500);
    const teachingMethods = sanitizeText(input.teachingMethods, 300);
    const challengesFaced = sanitizeText(input.challengesFaced, 400);

    // STRICT RULE: Cannot mark lesson CONDUCTED without actual teaching details
    if (status === 'CONDUCTED') {
      if (!actualTopicTaught || !subtopicsCovered || !learningObjectivesAchieved || !teachingMethods) {
        throw new TeachingHttpError(
          400,
          'Cannot mark lesson as CONDUCTED without actual teaching details: actual topic taught, subtopics covered, learning objectives achieved, and teaching methods used are required.'
        );
      }
    }
    if (status === 'PARTIALLY_CONDUCTED' && (!actualTopicTaught || !challengesFaced)) {
      throw new TeachingHttpError(
        400,
        'Partially conducted lessons require actual topic covered and explanation of remaining gap in challenges.'
      );
    }
    if ((status === 'NOT_CONDUCTED' || status === 'RESCHEDULED') && !challengesFaced) {
      throw new TeachingHttpError(
        400,
        'Unconducted or rescheduled lessons require a clear reason in challenges/remarks.'
      );
    }

    const slot =
      db.teachingTimetableSlots.find(
        (s) =>
          s.id === input.timetableEntryId ||
          s.assignmentId === input.assignmentId ||
          s.unitCode === input.unitCode
      ) ?? db.teachingTimetableSlots[0];

    // Resolve or auto-create linked AttendanceSession so strict chain always holds
    let attSession = input.attendanceSessionId
      ? db.attendanceSessions.find((s) => s.id === input.attendanceSessionId)
      : db.attendanceSessions.find(
          (s) => s.unitCode === (input.unitCode || slot?.unitCode) && s.sessionDate === input.lessonDate
        );

    if (!attSession) {
      const sesId = `att-ses-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      attSession = {
        id: sesId,
        assignmentId: input.assignmentId || slot?.assignmentId || 'asg-csc301',
        departmentId: actor.departmentId || slot?.departmentId || 'dept-computing',
        unitCode: sanitizeText(input.unitCode || slot?.unitCode || 'CSC 301', 40),
        unitTitle: sanitizeText(input.unitTitle || slot?.unitTitle || 'Course Unit', 160),
        classGroupId: sanitizeText(input.classGroupId || slot?.classGroupId || 'DICT-2026-A', 60),
        timetableEntryId: input.timetableEntryId || slot?.id || null,
        lecturerId: actor.id,
        lecturerName: actor.fullName,
        substituteLecturerId:
          input.actualTrainerId && input.actualTrainerId !== actor.id ? input.actualTrainerId : null,
        substituteLecturerName:
          input.actualTrainerId && input.actualTrainerId !== actor.id
            ? sanitizeText(input.actualTrainerName, 120)
            : null,
        sessionDate: sanitizeText(input.lessonDate || nowIso().slice(0, 10), 20),
        startTime: sanitizeText(input.startTime || slot?.startTime || '08:00', 20),
        endTime: sanitizeText(input.endTime || slot?.endTime || '10:00', 20),
        roomName: sanitizeText(input.roomName || slot?.roomName || 'Computer Lab 3B', 100),
        qrToken: null,
        qrExpiresAt: null,
        locked: false,
        submittedAt: null,
        totalStudents: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        excusedCount: 0,
        attendanceRate: 100,
        records: [],
        createdAt: nowIso(),
      };
      db.attendanceSessions.unshift(attSession);
    }

    const now = nowIso();
    const isSub = Boolean(input.actualTrainerId && input.actualTrainerId !== actor.id);
    const existing = input.id ? db.lessonDeliveryRecords.find((l) => l.id === input.id) : null;

    if (existing) {
      if (actor.role === 'LECTURER' && existing.lecturerId !== actor.id && existing.actualTrainerId !== actor.id) {
        throw new TeachingHttpError(403, 'You cannot edit another lecturer’s lesson delivery record.');
      }
      Object.assign(existing, {
        attendanceSessionId: attSession.id,
        schemeTopicId: input.schemeTopicId ?? existing.schemeTopicId,
        plannedTopic,
        actualTopicTaught,
        subtopicsCovered,
        learningObjectivesAchieved,
        teachingMethods,
        practicalsDone: sanitizeText(input.practicalsDone, 300),
        pagesOrSectionsCovered: sanitizeText(input.pagesOrSectionsCovered, 200),
        challengesFaced,
        homeworkAssigned: sanitizeText(input.homeworkAssigned, 300),
        nextLessonPlan: sanitizeText(input.nextLessonPlan, 300),
        supportingDocumentIds: Array.isArray(input.supportingDocumentIds)
          ? input.supportingDocumentIds
          : existing.supportingDocumentIds,
        trainerRemarks: sanitizeText(input.trainerRemarks, 400),
        status,
        actualTrainerId: input.actualTrainerId || existing.actualTrainerId,
        actualTrainerName: input.actualTrainerName || existing.actualTrainerName,
        isSubstitute: isSub,
        submittedAt: status !== 'SCHEDULED' ? existing.submittedAt || now : null,
        updatedAt: now,
      });

      if (status === 'CONDUCTED' && existing.schemeTopicId) {
        for (const sch of db.schemesOfWork) {
          const top = sch.topics.find((t) => t.id === existing.schemeTopicId);
          if (top) {
            top.covered = true;
            top.actualCoveredDate = existing.lessonDate;
            top.lessonDeliveryId = existing.id;
          }
        }
      }

      addAudit(actor, 'LESSON_DELIVERY_UPDATED', 'LessonDeliveryRecord', existing.id, `Updated ${existing.unitCode} (${status})`);
      saveDb(db);
      return this.listLessons(actor).find((l) => l.id === existing.id)!;
    }

    const id = `ldr-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const record: LessonDeliveryRecordItem = {
      id,
      assignmentId: input.assignmentId || slot?.assignmentId || 'asg-csc301',
      attendanceSessionId: attSession.id,
      timetableEntryId: input.timetableEntryId || slot?.id || null,
      schemeTopicId: input.schemeTopicId || null,
      academicYear: '2026',
      term: 'Term 3 / Semester 1',
      departmentId: actor.departmentId || slot?.departmentId || 'dept-computing',
      departmentName: actor.department || slot?.departmentName || 'School of Computing & Informatics',
      courseName: sanitizeText(input.courseName || slot?.courseName || 'Diploma in ICT', 160),
      classGroupId: sanitizeText(input.classGroupId || slot?.classGroupId || 'DICT-2026-A', 60),
      unitCode: sanitizeText(input.unitCode || slot?.unitCode || 'CSC 301', 40),
      unitTitle: sanitizeText(input.unitTitle || slot?.unitTitle || 'Course Unit', 160),
      lecturerId: actor.id,
      lecturerName: actor.fullName,
      actualTrainerId: input.actualTrainerId || actor.id,
      actualTrainerName: sanitizeText(input.actualTrainerName || actor.fullName, 120),
      isSubstitute: isSub,
      lessonDate: sanitizeText(input.lessonDate || now.slice(0, 10), 20),
      startTime: sanitizeText(input.startTime || slot?.startTime || '08:00', 20),
      endTime: sanitizeText(input.endTime || slot?.endTime || '10:00', 20),
      durationMinutes: Number(input.durationMinutes || 120),
      roomName: sanitizeText(input.roomName || slot?.roomName || 'Computer Lab 3B', 100),
      plannedTopic,
      actualTopicTaught,
      subtopicsCovered,
      learningObjectivesAchieved,
      teachingMethods,
      practicalsDone: sanitizeText(input.practicalsDone, 300),
      pagesOrSectionsCovered: sanitizeText(input.pagesOrSectionsCovered, 200),
      challengesFaced,
      homeworkAssigned: sanitizeText(input.homeworkAssigned, 300),
      nextLessonPlan: sanitizeText(input.nextLessonPlan, 300),
      supportingDocumentIds: Array.isArray(input.supportingDocumentIds) ? input.supportingDocumentIds : [],
      trainerRemarks: sanitizeText(input.trainerRemarks, 400),
      status,
      hodReviewStatus: status === 'NOT_CONDUCTED' ? 'FLAGGED' : 'PENDING',
      hodReviewerName: null,
      hodReviewComments: null,
      hodReviewedAt: null,
      submittedAt: status !== 'SCHEDULED' ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    db.lessonDeliveryRecords.unshift(record);

    if (status === 'CONDUCTED' && record.schemeTopicId) {
      for (const sch of db.schemesOfWork) {
        const top = sch.topics.find((t) => t.id === record.schemeTopicId);
        if (top) {
          top.covered = true;
          top.actualCoveredDate = record.lessonDate;
          top.lessonDeliveryId = record.id;
        }
      }
    }

    if (status === 'NOT_CONDUCTED') {
      pushAlert({
        targetRole: 'HOD',
        targetUserId: null,
        targetStudentRegNo: null,
        departmentId: record.departmentId,
        severity: 'CRITICAL',
        category: 'UNCONDUCTED_LESSON',
        title: `Unconducted Lesson: ${record.unitCode} (${record.lessonDate})`,
        message: `${actor.fullName} logged ${record.unitCode} as NOT CONDUCTED: ${challengesFaced}`,
        relatedEntityId: record.id,
      });
    }

    addAudit(actor, 'LESSON_DELIVERY_RECORDED', 'LessonDeliveryRecord', id, `Recorded ${record.unitCode} status=${status}`);
    saveDb(db);
    return this.listLessons(actor).find((l) => l.id === id)!;
  },

  hodReviewLesson(
    actor: TeachingActor,
    lessonId: string,
    reviewStatus: 'VERIFIED' | 'FLAGGED',
    comments?: string
  ) {
    if (!['HOD', 'PRINCIPAL'].includes(String(actor.role))) {
      throw new TeachingHttpError(403, 'Only HOD or Principal may verify lesson delivery records.');
    }
    const db = getDb();
    const lesson = db.lessonDeliveryRecords.find((l) => l.id === lessonId);
    if (!lesson) throw new TeachingHttpError(404, 'Lesson delivery record not found.');
    if (actor.role === 'HOD' && actor.departmentId && lesson.departmentId !== actor.departmentId) {
      throw new TeachingHttpError(403, 'HOD may only review lessons within their department.');
    }
    lesson.hodReviewStatus = reviewStatus;
    lesson.hodReviewerName = actor.fullName;
    lesson.hodReviewComments = sanitizeText(comments, 400);
    lesson.hodReviewedAt = nowIso();
    lesson.updatedAt = nowIso();

    addAudit(actor, `LESSON_DELIVERY_${reviewStatus}`, 'LessonDeliveryRecord', lesson.id, `Reviewed by ${actor.fullName}`);
    saveDb(db);
    return this.listLessons(actor).find((l) => l.id === lessonId)!;
  },

  listObservations(actor: TeachingActor): LessonObservationRecord[] {
    const db = getDb();
    if (actor.role === 'LECTURER') {
      return db.lessonObservations.filter((o) => o.lecturerId === actor.id);
    }
    return db.lessonObservations;
  },

  createObservation(
    actor: TeachingActor,
    input: {
      lessonDeliveryId: string;
      pedagogyScore: number;
      preparationScore: number;
      engagementScore: number;
      strengths: string;
      recommendations: string;
    }
  ) {
    if (!['HOD', 'PRINCIPAL', 'QUALITY_ASSURANCE'].includes(String(actor.role))) {
      throw new TeachingHttpError(403, 'Only HOD, Principal, or Quality Assurance may submit lesson observations.');
    }
    const db = getDb();
    const lesson = db.lessonDeliveryRecords.find((l) => l.id === input.lessonDeliveryId);
    if (!lesson) throw new TeachingHttpError(404, 'Referenced lesson delivery record not found.');

    const obs: LessonObservationRecord = {
      id: `obs-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      lessonDeliveryId: lesson.id,
      unitCode: lesson.unitCode,
      lecturerId: lesson.lecturerId,
      lecturerName: lesson.lecturerName,
      observerId: actor.id,
      observerName: actor.fullName,
      observerRole: String(actor.role),
      observationDate: nowIso().slice(0, 10),
      pedagogyScore: Math.min(5, Math.max(1, Number(input.pedagogyScore || 4))),
      preparationScore: Math.min(5, Math.max(1, Number(input.preparationScore || 4))),
      engagementScore: Math.min(5, Math.max(1, Number(input.engagementScore || 4))),
      strengths: sanitizeText(input.strengths, 500),
      recommendations: sanitizeText(input.recommendations, 500),
      createdAt: nowIso(),
    };
    db.lessonObservations.unshift(obs);
    addAudit(actor, 'LESSON_OBSERVATION_CREATED', 'LessonObservation', obs.id, `Observed ${lesson.unitCode}`);
    saveDb(db);
    return obs;
  },

  listAttendanceSessions(actor: TeachingActor) {
    const db = getDb();
    let sessions = [...db.attendanceSessions];
    if (actor.role === 'LECTURER') {
      sessions = sessions.filter((s) => s.lecturerId === actor.id || s.substituteLecturerId === actor.id);
    } else if (actor.role === 'HOD' && actor.departmentId) {
      sessions = sessions.filter((s) => s.departmentId === actor.departmentId);
    }
    return {
      sessions,
      corrections: db.attendanceCorrections.filter((c) =>
        sessions.some((s) => s.id === c.sessionId)
      ),
    };
  },

  commitAttendanceRegister(
    actor: TeachingActor,
    input: {
      sessionId?: string;
      assignmentId?: string;
      unitCode: string;
      unitTitle?: string;
      classGroupId?: string;
      sessionDate: string;
      startTime?: string;
      endTime?: string;
      roomName?: string;
      lockSession?: boolean;
      entries: Array<{
        studentRegNo: string;
        studentName: string;
        status: string;
        arrivalTime?: string | null;
        departureTime?: string | null;
        remarks?: string;
      }>;
    }
  ) {
    if (!actor.permissions.includes(STAFF_PERMISSIONS.ATTENDANCE_MARK)) {
      throw new TeachingHttpError(403, 'Attendance register submission requires teaching.attendance.mark permission.');
    }
    if (!Array.isArray(input.entries) || input.entries.length === 0) {
      throw new TeachingHttpError(400, 'At least one student attendance entry is required.');
    }

    const db = getDb();
    const now = nowIso();
    let session = input.sessionId
      ? db.attendanceSessions.find((s) => s.id === input.sessionId)
      : undefined;

    if (session?.locked) {
      throw new TeachingHttpError(
        409,
        'This attendance register has been locked after submission. Submit an HOD amendment request to alter marks.'
      );
    }

    const slot =
      db.teachingTimetableSlots.find(
        (s) => s.assignmentId === input.assignmentId || s.unitCode === input.unitCode
      ) ?? db.teachingTimetableSlots[0];

    if (!session) {
      session = {
        id: `att-ses-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        assignmentId: input.assignmentId || slot?.assignmentId || 'asg-csc301',
        departmentId: actor.departmentId || slot?.departmentId || 'dept-computing',
        unitCode: sanitizeText(input.unitCode || slot?.unitCode || 'CSC 301', 40),
        unitTitle: sanitizeText(input.unitTitle || slot?.unitTitle || 'Course Unit', 160),
        classGroupId: sanitizeText(input.classGroupId || slot?.classGroupId || 'DICT-2026-A', 60),
        timetableEntryId: slot?.id || null,
        lecturerId: actor.id,
        lecturerName: actor.fullName,
        substituteLecturerId: null,
        substituteLecturerName: null,
        sessionDate: sanitizeText(input.sessionDate || now.slice(0, 10), 20),
        startTime: sanitizeText(input.startTime || slot?.startTime || '08:00', 20),
        endTime: sanitizeText(input.endTime || slot?.endTime || '10:00', 20),
        roomName: sanitizeText(input.roomName || slot?.roomName || 'Computer Lab 3B', 100),
        qrToken: null,
        qrExpiresAt: null,
        locked: false,
        submittedAt: null,
        totalStudents: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        excusedCount: 0,
        attendanceRate: 100,
        records: [],
        createdAt: now,
      };
      db.attendanceSessions.unshift(session);
    } else if (actor.role === 'LECTURER' && session.lecturerId !== actor.id) {
      throw new TeachingHttpError(403, 'You cannot submit an attendance register belonging to another lecturer.');
    }

    const updatedRecords = input.entries.map((entry) => {
      const st = String(entry.status || 'PRESENT').toUpperCase() as AttendanceMarkStatus;
      if (!ATTENDANCE_MARK_STATUSES.includes(st)) {
        throw new TeachingHttpError(400, `Invalid attendance mark status: ${entry.status}`);
      }
      const existingRec = session!.records.find((r) => r.studentRegNo === entry.studentRegNo);
      return {
        id: existingRec?.id ?? `atr-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        sessionId: session!.id,
        studentRegNo: sanitizeText(entry.studentRegNo, 40),
        studentName: sanitizeText(entry.studentName, 120),
        status: st,
        method: existingRec?.method ?? ('ROLL_CALL' as const),
        arrivalTime: entry.arrivalTime ?? existingRec?.arrivalTime ?? (st === 'PRESENT' ? session!.startTime : null),
        departureTime: entry.departureTime ?? existingRec?.departureTime ?? null,
        remarks: sanitizeText(entry.remarks, 240),
        markedById: actor.id,
        markedByName: actor.fullName,
        markedAt: now,
      };
    });

    session.records = updatedRecords;
    if (input.lockSession) {
      session.locked = true;
      session.submittedAt = now;
    }
    recomputeSessionStats(session);

    const linkedLesson = db.lessonDeliveryRecords.find((l) => l.attendanceSessionId === session!.id);
    const createdCases: StudentAbsenceCaseRecord[] = [];
    for (const rec of session.records) {
      if (rec.status === 'ABSENT') {
        const absCase = evaluateAbsenceThresholdsAndCreateCase(
          actor,
          session,
          rec.id,
          rec.studentRegNo,
          rec.studentName,
          linkedLesson?.id ?? null
        );
        createdCases.push(absCase);
      }
    }

    addAudit(
      actor,
      input.lockSession ? 'ATTENDANCE_SUBMITTED_AND_LOCKED' : 'ATTENDANCE_DRAFT_SAVED',
      'AttendanceSession',
      session.id,
      `${session.unitCode} (${session.sessionDate}): P=${session.presentCount}, L=${session.lateCount}, A=${session.absentCount}, E=${session.excusedCount}. Absence cases linked=${createdCases.length}`
    );
    saveDb(db);
    return { session, triggeredAbsenceCases: createdCases };
  },

  generateQrSession(actor: TeachingActor, sessionId: string) {
    if (!actor.permissions.includes(STAFF_PERMISSIONS.ATTENDANCE_MARK)) {
      throw new TeachingHttpError(403, 'QR generation requires teaching.attendance.mark permission.');
    }
    const db = getDb();
    const session = db.attendanceSessions.find((s) => s.id === sessionId);
    if (!session) throw new TeachingHttpError(404, 'Attendance session not found.');
    if (session.locked) {
      throw new TeachingHttpError(409, 'Cannot generate QR code for an already locked session.');
    }
    const policy = db.attendancePolicy;
    const token = `${session.unitCode.replaceAll(' ', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + policy.qrValidityMinutes * 60 * 1000).toISOString();
    session.qrToken = token;
    session.qrExpiresAt = expiresAt;
    addAudit(actor, 'ATTENDANCE_QR_GENERATED', 'AttendanceSession', session.id, `Generated QR token ${token} valid for ${policy.qrValidityMinutes} mins`);
    saveDb(db);
    return { sessionId: session.id, qrToken: token, qrExpiresAt: expiresAt };
  },

  studentQrCheckIn(studentRegNo: string, studentName: string, qrTokenInput: string) {
    const db = getDb();
    if (!db.attendancePolicy.allowQrCheckIn) {
      throw new TeachingHttpError(403, 'QR attendance self check-in is currently disabled by institution policy.');
    }
    const token = sanitizeText(qrTokenInput, 80).toUpperCase();
    if (!token) throw new TeachingHttpError(400, 'Session check-in code / QR token is required.');

    const session = db.attendanceSessions.find((s) => (s.qrToken || '').toUpperCase() === token);
    if (!session) {
      throw new TeachingHttpError(404, 'Invalid attendance session code. Verify the code displayed by your lecturer.');
    }
    if (session.locked) {
      throw new TeachingHttpError(409, 'Attendance register for this lesson has already been locked by your lecturer.');
    }
    if (session.qrExpiresAt && new Date(session.qrExpiresAt).getTime() < Date.now()) {
      throw new TeachingHttpError(410, 'This QR check-in token has expired. Ask your lecturer to generate a new session token or mark you manually.');
    }

    const existingRec = session.records.find((r) => r.studentRegNo === studentRegNo);
    if (existingRec && existingRec.method === 'QR_CHECKIN' && existingRec.status === 'PRESENT') {
      throw new TeachingHttpError(409, 'You have already checked in for this class session.');
    }

    const now = nowIso();
    if (existingRec) {
      existingRec.status = 'PRESENT';
      existingRec.method = 'QR_CHECKIN';
      existingRec.arrivalTime = now.slice(11, 16);
      existingRec.remarks = 'Checked in via live QR/Session code';
      existingRec.markedAt = now;
    } else {
      session.records.push({
        id: `atr-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        sessionId: session.id,
        studentRegNo,
        studentName,
        status: 'PRESENT',
        method: 'QR_CHECKIN',
        arrivalTime: now.slice(11, 16),
        departureTime: null,
        remarks: 'Checked in via live QR/Session code',
        markedById: studentRegNo,
        markedByName: studentName,
        markedAt: now,
      });
    }
    recomputeSessionStats(session);

    // Close open AWAITING_EXPLANATION absence case if student checked in live before lock
    const openCase = db.studentAbsenceCases.find(
      (c) => c.attendanceSessionId === session.id && c.studentRegNo === studentRegNo && c.status === 'AWAITING_EXPLANATION'
    );
    if (openCase) {
      openCase.status = 'CLOSED';
      openCase.updatedAt = now;
    }

    saveDb(db);
    return {
      sessionId: session.id,
      unitCode: session.unitCode,
      unitTitle: session.unitTitle,
      sessionDate: session.sessionDate,
      checkedInAt: now,
    };
  },

  requestAttendanceCorrection(
    actor: TeachingActor,
    sessionId: string,
    recordId: string,
    requestedStatus: string,
    reason: string
  ) {
    const db = getDb();
    const session = db.attendanceSessions.find((s) => s.id === sessionId);
    if (!session) throw new TeachingHttpError(404, 'Attendance session not found.');
    const rec = session.records.find((r) => r.id === recordId);
    if (!rec) throw new TeachingHttpError(404, 'Attendance student record not found.');

    const reqSt = String(requestedStatus).toUpperCase() as AttendanceMarkStatus;
    if (!ATTENDANCE_MARK_STATUSES.includes(reqSt)) {
      throw new TeachingHttpError(400, `Invalid status: ${requestedStatus}`);
    }
    const cleanReason = sanitizeText(reason, 400);
    if (!cleanReason) throw new TeachingHttpError(400, 'Reason for locked attendance amendment is required.');

    const corr = {
      id: `attc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      sessionId,
      recordId,
      studentRegNo: rec.studentRegNo,
      studentName: rec.studentName,
      previousStatus: rec.status,
      requestedStatus: reqSt,
      reason: cleanReason,
      requestedById: actor.id,
      requestedByName: actor.fullName,
      status: 'PENDING' as const,
      reviewedById: null,
      reviewedByName: null,
      reviewNote: null,
      reviewedAt: null,
      createdAt: nowIso(),
    };
    db.attendanceCorrections.unshift(corr);
    addAudit(actor, 'ATTENDANCE_CORRECTION_REQUESTED', 'AttendanceSession', sessionId, `Requested ${rec.studentRegNo}: ${rec.status} -> ${reqSt}`);
    saveDb(db);
    return corr;
  },

  reviewAttendanceCorrection(
    actor: TeachingActor,
    correctionId: string,
    decision: 'APPROVED' | 'REJECTED',
    note?: string
  ) {
    if (!actor.permissions.includes(STAFF_PERMISSIONS.ATTENDANCE_AMEND_APPROVE)) {
      throw new TeachingHttpError(403, 'Only authorized HOD or Principal may approve locked attendance amendments.');
    }
    const db = getDb();
    const corr = db.attendanceCorrections.find((c) => c.id === correctionId);
    if (!corr) throw new TeachingHttpError(404, 'Correction request not found.');
    if (corr.status !== 'PENDING') {
      throw new TeachingHttpError(409, 'Correction request already decided.');
    }

    const now = nowIso();
    corr.status = decision;
    corr.reviewedById = actor.id;
    corr.reviewedByName = actor.fullName;
    corr.reviewNote = sanitizeText(note, 300) || null;
    corr.reviewedAt = now;

    if (decision === 'APPROVED') {
      const session = db.attendanceSessions.find((s) => s.id === corr.sessionId);
      const rec = session?.records.find((r) => r.id === corr.recordId);
      if (session && rec) {
        rec.status = corr.requestedStatus;
        rec.remarks = `${rec.remarks ? `${rec.remarks} · ` : ''}Amended by ${actor.fullName}`;
        recomputeSessionStats(session);
      }
    }

    addAudit(actor, `ATTENDANCE_CORRECTION_${decision}`, 'AttendanceCorrection', corr.id, `${corr.studentRegNo} -> ${corr.requestedStatus}`);
    saveDb(db);
    return corr;
  },

  // ABSENCE CASES — STUDENT & STAFF WORKFLOWS
  listMyAbsenceCases(studentRegNo: string, studentActor?: TeachingActor) {
    const db = getDb();
    const cases = db.studentAbsenceCases.filter((c) => c.studentRegNo === studentRegNo);
    const actor: TeachingActor = studentActor ?? {
      id: studentRegNo,
      fullName: studentRegNo,
      role: 'STUDENT',
      departmentId: null,
      department: 'Student',
      permissions: [],
      registrationNumber: studentRegNo,
    };

    const attendanceHistory: Array<{
      sessionId: string;
      date: string;
      unitCode: string;
      unitTitle: string;
      status: AttendanceMarkStatus;
      method: string;
      roomName: string;
    }> = [];
    for (const s of db.attendanceSessions) {
      const rec = s.records.find((r) => r.studentRegNo === studentRegNo);
      if (rec) {
        attendanceHistory.push({
          sessionId: s.id,
          date: s.sessionDate,
          unitCode: s.unitCode,
          unitTitle: s.unitTitle,
          status: rec.status,
          method: rec.method,
          roomName: s.roomName,
        });
      }
    }

    const totalSessions = attendanceHistory.length;
    const attendedSessions = attendanceHistory.filter((a) => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
    const lateSessions = attendanceHistory.filter((a) => a.status === 'LATE').length;
    const overallAttendancePct =
      totalSessions > 0 ? Math.round(((attendedSessions + lateSessions * 0.5) / totalSessions) * 100) : 100;

    return {
      studentRegNo,
      overallAttendancePct,
      minimumRequiredPct: db.attendancePolicy.minimumExamAttendancePct,
      activeQrSessions: db.attendanceSessions
        .filter((s) => !s.locked && s.qrToken && (!s.qrExpiresAt || new Date(s.qrExpiresAt).getTime() > Date.now()))
        .map((s) => ({
          sessionId: s.id,
          unitCode: s.unitCode,
          unitTitle: s.unitTitle,
          roomName: s.roomName,
          startTime: s.startTime,
        })),
      attendanceHistory,
      cases: cases.map((c) => ({
        ...c,
        explanations: db.absenceExplanations.filter((e) => e.absenceCaseId === c.id),
        evidence: db.absenceEvidence
          .filter((ev) => ev.absenceCaseId === c.id)
          .map((ev) => sanitizeEvidenceForActor(actor, c, ev)),
        reviews: db.absenceReviews.filter((r) => r.absenceCaseId === c.id),
        escalations: db.absenceEscalations.filter((es) => es.absenceCaseId === c.id),
      })),
      catchUpLessons: db.catchUpLessons.filter((cu) => cu.studentRegNo === studentRegNo),
      alerts: db.attendanceAlerts.filter(
        (a) => a.targetRole === 'STUDENT' && a.targetStudentRegNo === studentRegNo
      ),
    };
  },

  submitStudentExplanation(
    studentRegNo: string,
    studentName: string,
    caseId: string,
    input: { category: string; reasonText: string }
  ) {
    const db = getDb();
    const absCase = db.studentAbsenceCases.find((c) => c.id === caseId);
    if (!absCase) throw new TeachingHttpError(404, 'Absence case not found.');
    if (absCase.studentRegNo !== studentRegNo) {
      throw new TeachingHttpError(403, 'Students may only submit explanations for their own absence cases.');
    }

    const cat = String(input.category || 'OTHER').toUpperCase() as AbsenceReasonCategory;
    if (!ABSENCE_REASON_CATEGORIES.includes(cat)) {
      throw new TeachingHttpError(400, `Invalid absence reason category: ${input.category}`);
    }
    const reasonText = sanitizeText(input.reasonText, 800);
    if (reasonText.length < 5) {
      throw new TeachingHttpError(400, 'Please enter a meaningful explanation (at least 5 characters).');
    }

    const now = nowIso();
    const exp = {
      id: `abexp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      absenceCaseId: absCase.id,
      source: 'STUDENT_PORTAL' as const,
      category: cat,
      reasonText,
      trainerRecordedNote: null,
      studentConfirmedAccuracy: true,
      studentConfirmedAt: now,
      submittedById: studentRegNo,
      submittedByName: studentName,
      submittedByRole: 'STUDENT',
      createdAt: now,
    };
    db.absenceExplanations.unshift(exp);
    if (absCase.status === 'AWAITING_EXPLANATION') {
      absCase.status = 'EXPLANATION_SUBMITTED';
    }
    absCase.updatedAt = now;

    pushAlert({
      targetRole: 'LECTURER',
      targetUserId: absCase.lecturerId,
      targetStudentRegNo: null,
      departmentId: absCase.departmentId,
      severity: 'INFO',
      category: 'STUDENT_EXPLANATION_SUBMITTED',
      title: `Explanation submitted by ${absCase.studentName}`,
      message: `${absCase.studentRegNo} explained absence for ${absCase.unitCode} (${absCase.absenceDate}). Ready for review.`,
      relatedEntityId: absCase.id,
    });

    addAudit(
      { id: studentRegNo, fullName: studentName, role: 'STUDENT', departmentId: absCase.departmentId, department: absCase.departmentName, permissions: [] },
      'STUDENT_EXPLANATION_SUBMITTED',
      'StudentAbsenceCase',
      absCase.id,
      `Submitted ${cat} explanation`
    );
    saveDb(db);
    return exp;
  },

  confirmTrainerVerbalNote(studentRegNo: string, studentName: string, caseId: string, explanationId: string) {
    const db = getDb();
    const absCase = db.studentAbsenceCases.find((c) => c.id === caseId);
    if (!absCase) throw new TeachingHttpError(404, 'Absence case not found.');
    if (absCase.studentRegNo !== studentRegNo) {
      throw new TeachingHttpError(403, 'You may only confirm verbal notes on your own absence record.');
    }
    const exp = db.absenceExplanations.find(
      (e) => e.id === explanationId && e.absenceCaseId === absCase.id
    );
    if (!exp) throw new TeachingHttpError(404, 'Trainer verbal explanation entry not found.');

    exp.studentConfirmedAccuracy = true;
    exp.studentConfirmedAt = nowIso();
    absCase.updatedAt = nowIso();
    addAudit(
      { id: studentRegNo, fullName: studentName, role: 'STUDENT', departmentId: absCase.departmentId, department: absCase.departmentName, permissions: [] },
      'TRAINER_NOTE_CONFIRMED_BY_STUDENT',
      'StudentAbsenceCase',
      absCase.id,
      `Student confirmed trainer verbal record accuracy`
    );
    saveDb(db);
    return exp;
  },

  recordTrainerVerbalExplanation(
    actor: TeachingActor,
    caseId: string,
    input: { category: string; reasonText: string; trainerRecordedNote?: string }
  ) {
    if (!actor.permissions.includes(STAFF_PERMISSIONS.ABSENCE_REVIEW)) {
      throw new TeachingHttpError(403, 'Permission teaching.absence.review required.');
    }
    const db = getDb();
    const absCase = db.studentAbsenceCases.find((c) => c.id === caseId);
    if (!absCase) throw new TeachingHttpError(404, 'Absence case not found.');
    if (actor.role === 'LECTURER' && absCase.lecturerId !== actor.id) {
      throw new TeachingHttpError(403, 'Trainers may only record verbal explanations for their assigned class sessions.');
    }

    const cat = String(input.category || 'OTHER').toUpperCase() as AbsenceReasonCategory;
    if (!ABSENCE_REASON_CATEGORIES.includes(cat)) {
      throw new TeachingHttpError(400, `Invalid category: ${input.category}`);
    }
    const reasonText = sanitizeText(input.reasonText, 800);
    if (!reasonText) throw new TeachingHttpError(400, 'Verbal explanation summary is required.');

    const now = nowIso();
    const exp = {
      id: `abexp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      absenceCaseId: absCase.id,
      source: 'TRAINER_VERBAL_ENTRY' as const,
      category: cat,
      reasonText,
      trainerRecordedNote: sanitizeText(input.trainerRecordedNote || reasonText, 500),
      studentConfirmedAccuracy: false,
      studentConfirmedAt: null,
      submittedById: actor.id,
      submittedByName: actor.fullName,
      submittedByRole: String(actor.role),
      createdAt: now,
    };
    db.absenceExplanations.unshift(exp);
    if (absCase.status === 'AWAITING_EXPLANATION') {
      absCase.status = 'EXPLANATION_SUBMITTED';
    }
    absCase.updatedAt = now;

    pushAlert({
      targetRole: 'STUDENT',
      targetUserId: null,
      targetStudentRegNo: absCase.studentRegNo,
      departmentId: absCase.departmentId,
      severity: 'INFO',
      category: 'CONFIRM_TRAINER_NOTE',
      title: `Confirm trainer note for ${absCase.unitCode}`,
      message: `${actor.fullName} recorded your verbal absence reason. Please review and confirm accuracy in the Student Portal.`,
      relatedEntityId: absCase.id,
    });

    addAudit(actor, 'TRAINER_VERBAL_EXPLANATION_RECORDED', 'StudentAbsenceCase', absCase.id, `Recorded Option B verbal note`);
    saveDb(db);
    return exp;
  },

  uploadAbsenceEvidence(
    actor: TeachingActor,
    caseId: string,
    input: {
      fileName: string;
      mimeType?: string;
      fileSizeBytes: number;
      fileContentBase64?: string;
      description: string;
      isConfidentialMedical?: boolean;
    }
  ) {
    const db = getDb();
    const absCase = db.studentAbsenceCases.find((c) => c.id === caseId);
    if (!absCase) throw new TeachingHttpError(404, 'Absence case not found.');

    const role = String(actor.role).toUpperCase();
    if (role === 'STUDENT' && absCase.studentRegNo !== actor.id && absCase.studentRegNo !== actor.registrationNumber) {
      throw new TeachingHttpError(403, 'Students may only upload evidence for their own absence cases.');
    }
    if (role === 'ADMIN') {
      throw new TeachingHttpError(403, 'System Admin accounts do not handle student medical/absence evidence.');
    }
    if (role === 'LECTURER' && absCase.lecturerId !== actor.id) {
      throw new TeachingHttpError(403, 'Unassigned lecturers cannot upload evidence to this case.');
    }

    const { cleanName } = validateFileUpload(
      input.fileName,
      Number(input.fileSizeBytes || 0),
      MAX_EVIDENCE_BYTES
    );

    const now = nowIso();
    const ev: AbsenceEvidenceRecord = {
      id: `abev-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      absenceCaseId: absCase.id,
      fileName: cleanName,
      mimeType: sanitizeText(input.mimeType || 'application/pdf', 120),
      fileSizeBytes: Number(input.fileSizeBytes),
      fileContentBase64: String(
        input.fileContentBase64 || Buffer.from(`Confidential Evidence: ${cleanName}`).toString('base64')
      ),
      description: sanitizeText(input.description || 'Supporting absence documentation', 300),
      isConfidentialMedical: input.isConfidentialMedical !== false,
      uploadedById: actor.id,
      uploadedByName: actor.fullName,
      uploadedByRole: String(actor.role),
      createdAt: now,
    };

    db.absenceEvidence.unshift(ev);
    if (['AWAITING_EXPLANATION', 'EXPLANATION_SUBMITTED'].includes(absCase.status)) {
      absCase.status = 'DOCUMENT_SUBMITTED';
    }
    absCase.updatedAt = now;
    addAudit(actor, 'ABSENCE_EVIDENCE_UPLOADED', 'StudentAbsenceCase', absCase.id, `Attached ${cleanName} (confidential=${ev.isConfidentialMedical})`);
    saveDb(db);
    return sanitizeEvidenceForActor(actor, absCase, ev);
  },

  downloadAbsenceEvidence(actor: TeachingActor, caseId: string, evId: string) {
    const db = getDb();
    const absCase = db.studentAbsenceCases.find((c) => c.id === caseId);
    if (!absCase) throw new TeachingHttpError(404, 'Absence case not found.');
    const ev = db.absenceEvidence.find((e) => e.id === evId && e.absenceCaseId === absCase.id);
    if (!ev) throw new TeachingHttpError(404, 'Absence evidence file not found.');

    if (ev.isConfidentialMedical && !canViewRestrictedMedicalEvidence(actor, absCase)) {
      throw new TeachingHttpError(
        403,
        'Restricted access: Confidential medical evidence is accessible only to the student, assigned trainer, department HOD, Student Affairs, and Principal.'
      );
    }

    return ev;
  },

  listStaffAbsenceCases(
    actor: TeachingActor,
    filters?: { status?: string; escalationLevel?: string; unitCode?: string; search?: string }
  ) {
    const db = getDb();
    let cases = [...db.studentAbsenceCases];

    if (actor.role === 'LECTURER') {
      cases = cases.filter((c) => c.lecturerId === actor.id);
    } else if (actor.role === 'HOD' && actor.departmentId) {
      cases = cases.filter((c) => c.departmentId === actor.departmentId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      cases = cases.filter((c) => c.status === filters.status);
    }
    if (filters?.escalationLevel && filters.escalationLevel !== 'ALL') {
      cases = cases.filter((c) => c.escalationLevel === filters.escalationLevel);
    }
    if (filters?.unitCode && filters.unitCode !== 'ALL') {
      cases = cases.filter((c) => c.unitCode === filters.unitCode);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      cases = cases.filter(
        (c) =>
          c.studentName.toLowerCase().includes(q) ||
          c.studentRegNo.toLowerCase().includes(q) ||
          c.unitCode.toLowerCase().includes(q)
      );
    }

    return cases.map((c) => ({
      ...c,
      explanations: db.absenceExplanations.filter((e) => e.absenceCaseId === c.id),
      evidence: db.absenceEvidence
        .filter((ev) => ev.absenceCaseId === c.id)
        .map((ev) => sanitizeEvidenceForActor(actor, c, ev)),
      reviews: db.absenceReviews.filter((r) => r.absenceCaseId === c.id),
      escalations: db.absenceEscalations.filter((es) => es.absenceCaseId === c.id),
    }));
  },

  reviewAbsenceCase(
    actor: TeachingActor,
    caseId: string,
    decision: 'UNDER_REVIEW' | 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CLOSED',
    comment: string,
    escalateToRole?: 'HOD' | 'PRINCIPAL'
  ) {
    if (!actor.permissions.includes(STAFF_PERMISSIONS.ABSENCE_REVIEW)) {
      throw new TeachingHttpError(403, 'Permission teaching.absence.review required.');
    }
    const db = getDb();
    const absCase = db.studentAbsenceCases.find((c) => c.id === caseId);
    if (!absCase) throw new TeachingHttpError(404, 'Absence case not found.');

    if (actor.role === 'LECTURER' && absCase.lecturerId !== actor.id) {
      throw new TeachingHttpError(403, 'Lecturers may only review absence cases for their assigned classes.');
    }
    if (actor.role === 'LECTURER' && (decision === 'APPROVED' || decision === 'CLOSED')) {
      // Lecturers recommend; final formal excusal/approval can be completed by HOD/Principal or approved cleanly if minor
      // To preserve clean multi-level workflow: allow HOD/Principal/Student Affairs for final APPROVED when escalated
      if (absCase.escalationLevel === 'HOD' || absCase.escalationLevel === 'PRINCIPAL') {
        throw new TeachingHttpError(
          403,
          'Escalated absence cases require HOD or Principal approval. Use RECOMMEND or ESCALATED.'
        );
      }
    }

    const cleanComment = sanitizeText(comment, 600);
    if (!cleanComment) throw new TeachingHttpError(400, 'Review comment is required.');

    const now = nowIso();
    absCase.status = decision;
    absCase.updatedAt = now;

    db.absenceReviews.unshift({
      id: `abrev-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      absenceCaseId: absCase.id,
      reviewerId: actor.id,
      reviewerName: actor.fullName,
      reviewerRole: String(actor.role),
      decision,
      comment: cleanComment,
      createdAt: now,
    });

    if (decision === 'RECOMMENDED') {
      absCase.escalationLevel = 'HOD';
      absCase.assignedReviewerRole = 'HOD';
      pushAlert({
        targetRole: 'HOD',
        targetUserId: null,
        targetStudentRegNo: null,
        departmentId: absCase.departmentId,
        severity: 'INFO',
        category: 'ABSENCE_RECOMMENDED',
        title: `Recommended for Excusal: ${absCase.studentName}`,
        message: `${actor.fullName} recommended ${absCase.unitCode} case for HOD approval: ${cleanComment}`,
        relatedEntityId: absCase.id,
      });
    }

    if (decision === 'ESCALATED') {
      const target = escalateToRole || (actor.role === 'HOD' ? 'PRINCIPAL' : 'HOD');
      absCase.escalationLevel = target;
      absCase.assignedReviewerRole = target;
      db.absenceEscalations.unshift({
        id: `abesc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        absenceCaseId: absCase.id,
        fromRole: String(actor.role),
        toRole: target,
        triggerRule: 'MANUAL_STAFF_ESCALATION',
        reason: cleanComment,
        escalatedById: actor.id,
        escalatedByName: actor.fullName,
        resolved: false,
        resolvedByName: null,
        resolvedAt: null,
        createdAt: now,
      });
      pushAlert({
        targetRole: target,
        targetUserId: null,
        targetStudentRegNo: null,
        departmentId: absCase.departmentId,
        severity: 'CRITICAL',
        category: 'MANUAL_ESCALATION',
        title: `Escalated Absence Case: ${absCase.studentName}`,
        message: `${actor.fullName} escalated ${absCase.studentRegNo} (${absCase.unitCode}): ${cleanComment}`,
        relatedEntityId: absCase.id,
      });
    }

    if (decision === 'APPROVED') {
      // Mark linked AttendanceRecord as EXCUSED and resolve escalations
      const ses = db.attendanceSessions.find((s) => s.id === absCase.attendanceSessionId);
      const rec = ses?.records.find((r) => r.id === absCase.attendanceRecordId);
      if (ses && rec) {
        rec.status = 'EXCUSED';
        rec.remarks = `${rec.remarks ? `${rec.remarks} · ` : ''}Excused (${actor.fullName})`;
        recomputeSessionStats(ses);
      }
      for (const esc of db.absenceEscalations.filter((e) => e.absenceCaseId === absCase.id && !e.resolved)) {
        esc.resolved = true;
        esc.resolvedByName = actor.fullName;
        esc.resolvedAt = now;
      }
      pushAlert({
        targetRole: 'STUDENT',
        targetUserId: null,
        targetStudentRegNo: absCase.studentRegNo,
        departmentId: absCase.departmentId,
        severity: 'INFO',
        category: 'ABSENCE_APPROVED',
        title: `Absence Excused — ${absCase.unitCode}`,
        message: `Your absence for ${absCase.unitCode} (${absCase.absenceDate}) was approved by ${actor.fullName}. Complete any scheduled catch-up materials.`,
        relatedEntityId: absCase.id,
      });
    }

    if (decision === 'REJECTED') {
      pushAlert({
        targetRole: 'STUDENT',
        targetUserId: null,
        targetStudentRegNo: absCase.studentRegNo,
        departmentId: absCase.departmentId,
        severity: 'WARNING',
        category: 'ABSENCE_REJECTED',
        title: `Absence Explanation Not Approved — ${absCase.unitCode}`,
        message: `${actor.fullName}: ${cleanComment}`,
        relatedEntityId: absCase.id,
      });
    }

    addAudit(actor, `ABSENCE_CASE_${decision}`, 'StudentAbsenceCase', absCase.id, `${absCase.studentRegNo}: ${cleanComment}`);
    saveDb(db);
    return this.listStaffAbsenceCases(actor).find((c) => c.id === absCase.id)!;
  },

  listCatchUps(actor: TeachingActor): CatchUpLessonRecord[] {
    const db = getDb();
    if (actor.role === 'LECTURER') {
      return db.catchUpLessons.filter((c) => c.trainerId === actor.id);
    }
    return db.catchUpLessons;
  },

  createCatchUp(
    actor: TeachingActor,
    input: {
      studentRegNo: string;
      studentName: string;
      absenceCaseId?: string | null;
      unitCode: string;
      unitTitle?: string;
      missedLessonDate: string;
      scheduledDate: string;
      scheduledTime: string;
      roomOrLink: string;
      materialsAttached?: string;
    }
  ) {
    const db = getDb();
    const cu: CatchUpLessonRecord = {
      id: `cup-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      studentRegNo: sanitizeText(input.studentRegNo, 40),
      studentName: sanitizeText(input.studentName, 120),
      absenceCaseId: input.absenceCaseId || null,
      unitCode: sanitizeText(input.unitCode, 40),
      unitTitle: sanitizeText(input.unitTitle || input.unitCode, 160),
      missedLessonDate: sanitizeText(input.missedLessonDate, 20),
      scheduledDate: sanitizeText(input.scheduledDate, 20),
      scheduledTime: sanitizeText(input.scheduledTime, 40),
      trainerId: actor.id,
      trainerName: actor.fullName,
      roomOrLink: sanitizeText(input.roomOrLink, 160),
      materialsAttached: sanitizeText(input.materialsAttached, 200),
      status: 'SCHEDULED',
      completionNotes: '',
      createdAt: nowIso(),
    };
    db.catchUpLessons.unshift(cu);
    pushAlert({
      targetRole: 'STUDENT',
      targetUserId: null,
      targetStudentRegNo: cu.studentRegNo,
      departmentId: actor.departmentId,
      severity: 'INFO',
      category: 'CATCH_UP_SCHEDULED',
      title: `Catch-Up Lesson Scheduled — ${cu.unitCode}`,
      message: `Makeup session on ${cu.scheduledDate} (${cu.scheduledTime}) at ${cu.roomOrLink}.`,
      relatedEntityId: cu.id,
    });
    addAudit(actor, 'CATCHUP_LESSON_SCHEDULED', 'CatchUpLesson', cu.id, `${cu.studentRegNo} · ${cu.unitCode}`);
    saveDb(db);
    return cu;
  },

  updateCatchUpStatus(
    actor: TeachingActor,
    catchUpId: string,
    status: 'SCHEDULED' | 'COMPLETED' | 'MISSED',
    completionNotes?: string
  ) {
    const db = getDb();
    const cu = db.catchUpLessons.find((c) => c.id === catchUpId);
    if (!cu) throw new TeachingHttpError(404, 'Catch-up lesson not found.');
    cu.status = status;
    if (completionNotes !== undefined) cu.completionNotes = sanitizeText(completionNotes, 300);
    addAudit(actor, 'CATCHUP_STATUS_UPDATED', 'CatchUpLesson', cu.id, `Updated catch-up status -> ${status}`);
    saveDb(db);
    return cu;
  },

  listInterventions(actor: TeachingActor): AcademicInterventionRecord[] {
    const db = getDb();
    if (actor.role === 'HOD' && actor.departmentId) {
      return db.academicInterventions.filter((i) => i.departmentId === actor.departmentId);
    }
    return db.academicInterventions;
  },

  createIntervention(
    actor: TeachingActor,
    input: {
      studentRegNo: string;
      studentName: string;
      unitCode: string;
      triggerReason: string;
      interventionPlan: string;
      followUpDate: string;
    }
  ) {
    const db = getDb();
    const intv: AcademicInterventionRecord = {
      id: `intv-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      studentRegNo: sanitizeText(input.studentRegNo, 40),
      studentName: sanitizeText(input.studentName, 120),
      unitCode: sanitizeText(input.unitCode, 40),
      departmentId: actor.departmentId || 'dept-computing',
      triggerReason: sanitizeText(input.triggerReason, 300),
      interventionPlan: sanitizeText(input.interventionPlan, 500),
      ownerId: actor.id,
      ownerName: actor.fullName,
      status: 'OPEN',
      followUpDate: sanitizeText(input.followUpDate, 20),
      outcomeNotes: '',
      createdAt: nowIso(),
    };
    db.academicInterventions.unshift(intv);
    addAudit(actor, 'ACADEMIC_INTERVENTION_CREATED', 'AcademicIntervention', intv.id, `${intv.studentRegNo} · ${intv.unitCode}`);
    saveDb(db);
    return intv;
  },

  // MANAGEMENT / HOD / PRINCIPAL OVERSIGHT
  getManagementDashboard(actor: TeachingActor) {
    const db = getDb();
    const isDeptScoped = actor.role === 'HOD' && Boolean(actor.departmentId);
    const deptFilter = isDeptScoped ? actor.departmentId : null;

    const sessions = deptFilter
      ? db.attendanceSessions.filter((s) => s.departmentId === deptFilter)
      : db.attendanceSessions;
    const lessons = deptFilter
      ? db.lessonDeliveryRecords.filter((l) => l.departmentId === deptFilter)
      : db.lessonDeliveryRecords;
    const docs = deptFilter
      ? db.teachingDocuments.filter((d) => d.departmentId === deptFilter)
      : db.teachingDocuments;
    const cases = deptFilter
      ? db.studentAbsenceCases.filter((c) => c.departmentId === deptFilter)
      : db.studentAbsenceCases;
    const escalations = db.absenceEscalations.filter((es) =>
      cases.some((c) => c.id === es.absenceCaseId)
    );
    const alerts = db.attendanceAlerts.filter((a) => {
      if (actor.role === 'HOD') {
        return a.targetRole === 'HOD' && (!deptFilter || a.departmentId === deptFilter);
      }
      if (actor.role === 'PRINCIPAL' || actor.role === 'REGISTRAR') {
        return a.targetRole === 'PRINCIPAL' || a.targetRole === 'HOD' || a.severity === 'CRITICAL';
      }
      return !deptFilter || a.departmentId === deptFilter;
    });

    const overallAttendancePct =
      sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.attendanceRate, 0) / sessions.length)
        : 100;

    // Department comparison summary
    const deptMap = new Map<
      string,
      {
        departmentId: string;
        departmentName: string;
        sessionsCount: number;
        avgAttendancePct: number;
        lessonsRecorded: number;
        unconductedLessons: number;
        openAbsences: number;
        escalatedCount: number;
      }
    >();

    for (const s of sessions) {
      const slot = db.teachingTimetableSlots.find((sl) => sl.departmentId === s.departmentId);
      const cur = deptMap.get(s.departmentId) ?? {
        departmentId: s.departmentId,
        departmentName: slot?.departmentName ?? s.departmentId,
        sessionsCount: 0,
        avgAttendancePct: 0,
        lessonsRecorded: 0,
        unconductedLessons: 0,
        openAbsences: 0,
        escalatedCount: 0,
      };
      cur.avgAttendancePct =
        cur.sessionsCount === 0
          ? s.attendanceRate
          : Math.round((cur.avgAttendancePct * cur.sessionsCount + s.attendanceRate) / (cur.sessionsCount + 1));
      cur.sessionsCount += 1;
      deptMap.set(s.departmentId, cur);
    }

    for (const l of lessons) {
      const cur = deptMap.get(l.departmentId);
      if (cur) {
        if (l.status !== 'SCHEDULED') cur.lessonsRecorded += 1;
        if (l.status === 'NOT_CONDUCTED') cur.unconductedLessons += 1;
      }
    }
    for (const c of cases) {
      const cur = deptMap.get(c.departmentId);
      if (cur) {
        if (!['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status)) cur.openAbsences += 1;
        if (c.escalationLevel === 'HOD' || c.escalationLevel === 'PRINCIPAL') cur.escalatedCount += 1;
      }
    }

    return {
      kpis: {
        overallAttendancePct,
        sessionsHeld: sessions.length,
        lessonsConducted: lessons.filter((l) => l.status === 'CONDUCTED').length,
        unconductedLessons: lessons.filter((l) => l.status === 'NOT_CONDUCTED').length,
        pendingDocumentApprovals: docs.filter((d) => d.status === 'SUBMITTED').length,
        openAbsenceCases: cases.filter((c) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(c.status)).length,
        escalatedToHod: cases.filter((c) => c.escalationLevel === 'HOD').length,
        escalatedToPrincipal: cases.filter((c) => c.escalationLevel === 'PRINCIPAL').length,
        pendingCorrections: db.attendanceCorrections.filter((c) => c.status === 'PENDING').length,
      },
      policy: db.attendancePolicy,
      departmentComparison: Array.from(deptMap.values()),
      repeatedAbsentees: cases.filter(
        (c) =>
          c.unitAbsenceCount >= db.attendancePolicy.unitAbsenceHodAlert ||
          c.consecutiveAbsenceCount >= db.attendancePolicy.consecutiveAbsenceTrainerAlert
      ),
      pendingDocuments: docs
        .filter((d) => d.status === 'SUBMITTED' || d.status === 'RETURNED')
        .map((d) => ({
          ...d,
          categoryLabel: TEACHING_DOCUMENT_CATEGORY_LABELS[d.category] ?? d.category,
        })),
      pendingLessons: lessons.map((l) => ({
        ...l,
        attendanceRate:
          sessions.find((s) => s.id === l.attendanceSessionId)?.attendanceRate ?? null,
      })),
      escalations,
      pendingCorrections: db.attendanceCorrections.filter((c) => c.status === 'PENDING'),
      alerts,
      observations: db.lessonObservations,
      interventions: this.listInterventions(actor),
    };
  },

  getAttendancePolicy(): AttendancePolicyConfig {
    return getDb().attendancePolicy;
  },

  updateAttendancePolicy(
    actor: TeachingActor,
    patch: Partial<Omit<AttendancePolicyConfig, 'id' | 'updatedAt' | 'updatedByName'>>
  ): AttendancePolicyConfig {
    if (!actor.permissions.includes(STAFF_PERMISSIONS.POLICY_CONFIGURE)) {
      throw new TeachingHttpError(403, 'Requires teaching.policy.configure permission.');
    }
    const db = getDb();
    const cur = db.attendancePolicy;
    const minAtt = patch.minimumExamAttendancePct ?? cur.minimumExamAttendancePct;
    if (minAtt < 50 || minAtt > 100) {
      throw new TeachingHttpError(400, 'Minimum exam attendance must be between 50% and 100%.');
    }

    db.attendancePolicy = {
      ...cur,
      ...patch,
      updatedByName: actor.fullName,
      updatedAt: nowIso(),
    };
    addAudit(
      actor,
      'ATTENDANCE_POLICY_UPDATED',
      'AttendancePolicy',
      cur.id,
      `Updated thresholds: examMin=${db.attendancePolicy.minimumExamAttendancePct}%, HODUnit=${db.attendancePolicy.unitAbsenceHodAlert}, PrincipalTerm=${db.attendancePolicy.unresolvedPrincipalEscalation}`
    );
    saveDb(db);
    return db.attendancePolicy;
  },

  generateReport(actor: TeachingActor, reportKey: TeachingReportKey) {
    const db = getDb();
    const meta = TEACHING_REPORT_CATALOGUE.find((r) => r.key === reportKey);
    if (!meta) throw new TeachingHttpError(404, `Unknown teaching report: ${reportKey}`);

    const isHod = actor.role === 'HOD' && Boolean(actor.departmentId);
    const isLecturer = actor.role === 'LECTURER';

    const lessons = db.lessonDeliveryRecords.filter((l) =>
      isLecturer ? l.lecturerId === actor.id : isHod ? l.departmentId === actor.departmentId : true
    );
    const sessions = db.attendanceSessions.filter((s) =>
      isLecturer ? s.lecturerId === actor.id : isHod ? s.departmentId === actor.departmentId : true
    );
    const docs = db.teachingDocuments.filter((d) =>
      isLecturer ? d.uploadedById === actor.id : isHod ? d.departmentId === actor.departmentId : true
    );
    const cases = db.studentAbsenceCases.filter((c) =>
      isLecturer ? c.lecturerId === actor.id : isHod ? c.departmentId === actor.departmentId : true
    );
    const schemes = db.schemesOfWork.filter((s) =>
      isLecturer ? s.lecturerId === actor.id : isHod ? s.departmentId === actor.departmentId : true
    );

    let columns: string[] = [];
    let rows: Array<Array<string | number>> = [];

    switch (reportKey) {
      case 'daily_lesson_delivery':
        columns = ['Date', 'Unit', 'Class', 'Trainer', 'Status', 'Actual Topic Taught', 'Attendance %'];
        rows = lessons.map((l) => {
          const att = sessions.find((s) => s.id === l.attendanceSessionId);
          return [l.lessonDate, l.unitCode, l.classGroupId, l.actualTrainerName, l.status, l.actualTopicTaught || l.plannedTopic, att ? `${att.attendanceRate}%` : 'N/A'];
        });
        break;
      case 'weekly_teaching_summary':
        columns = ['Unit', 'Course', 'Conducted', 'Partial', 'Unconducted', 'Total Sessions'];
        rows = Array.from(
          lessons.reduce((map, l) => {
            const cur = map.get(l.unitCode) ?? { course: l.courseName, cond: 0, part: 0, uncond: 0, total: 0 };
            cur.total += 1;
            if (l.status === 'CONDUCTED') cur.cond += 1;
            if (l.status === 'PARTIALLY_CONDUCTED') cur.part += 1;
            if (l.status === 'NOT_CONDUCTED') cur.uncond += 1;
            map.set(l.unitCode, cur);
            return map;
          }, new Map<string, { course: string; cond: number; part: number; uncond: number; total: number }>())
        ).map(([unit, v]) => [unit, v.course, v.cond, v.part, v.uncond, v.total]);
        break;
      case 'topic_syllabus_coverage':
        columns = ['Unit Code', 'Scheme Title', 'Total Weeks/Topics', 'Covered', 'Coverage %', 'Unfinished Topics'];
        rows = schemes.map((s) => {
          const cov = s.topics.filter((t) => t.covered).length;
          const pct = s.topics.length ? Math.round((cov / s.topics.length) * 100) : 0;
          const pending = s.topics.filter((t) => !t.covered).map((t) => t.topicTitle).join('; ') || 'All complete';
          return [s.unitCode, s.title, s.topics.length, cov, `${pct}%`, pending];
        });
        break;
      case 'lecturer_lesson_submission':
        columns = ['Lecturer', 'Unit', 'Date', 'Delivery Status', 'HOD Verification', 'Submitted At'];
        rows = lessons.map((l) => [l.lecturerName, l.unitCode, l.lessonDate, l.status, l.hodReviewStatus, l.submittedAt || 'Pending']);
        break;
      case 'student_daily_attendance':
        columns = ['Date', 'Unit', 'Reg No', 'Student Name', 'Status', 'Method', 'Arrival'];
        rows = sessions.flatMap((s) =>
          s.records.map((r) => [s.sessionDate, s.unitCode, r.studentRegNo, r.studentName, r.status, r.method, r.arrivalTime || '-'])
        );
        break;
      case 'unit_attendance_summary':
        columns = ['Unit Code', 'Unit Title', 'Sessions', 'Present', 'Late', 'Absent', 'Excused', 'Rate %'];
        rows = sessions.map((s) => [s.unitCode, s.unitTitle, s.totalStudents, s.presentCount, s.lateCount, s.absentCount, s.excusedCount, `${s.attendanceRate}%`]);
        break;
      case 'course_class_attendance':
        columns = ['Class Group', 'Unit', 'Session Date', 'Enrolled', 'Attended', 'Attendance Rate %'];
        rows = sessions.map((s) => [s.classGroupId, s.unitCode, s.sessionDate, s.totalStudents, s.presentCount + s.excusedCount, `${s.attendanceRate}%`]);
        break;
      case 'absenteeism_log':
        columns = ['Absence Date', 'Reg No', 'Student Name', 'Unit', 'Trainer', 'Unit Absences', 'Status'];
        rows = cases.map((c) => [c.absenceDate, c.studentRegNo, c.studentName, c.unitCode, c.lecturerName, c.unitAbsenceCount, c.status]);
        break;
      case 'absence_reasons_evidence':
        columns = ['Case ID', 'Reg No', 'Student Name', 'Unit', 'Explanation Category', 'Medical Evidence Access', 'Case Status'];
        rows = cases.map((c) => {
          const exp = db.absenceExplanations.find((e) => e.absenceCaseId === c.id);
          const evs = db.absenceEvidence.filter((e) => e.absenceCaseId === c.id);
          const evLabel =
            evs.length === 0
              ? 'None attached'
              : canViewRestrictedMedicalEvidence(actor, c)
              ? evs.map((e) => e.fileName).join(', ')
              : 'Restricted (Medical Confidentiality)';
          return [c.id, c.studentRegNo, c.studentName, c.unitCode, exp?.category ?? 'PENDING', evLabel, c.status];
        });
        break;
      case 'repeated_chronic_absenteeism':
        columns = ['Reg No', 'Student Name', 'Unit', 'Consecutive', 'Unit Absences', 'Term Total', 'Escalation Level'];
        rows = cases
          .filter(
            (c) =>
              c.consecutiveAbsenceCount >= db.attendancePolicy.consecutiveAbsenceTrainerAlert ||
              c.unitAbsenceCount >= db.attendancePolicy.unitAbsenceHodAlert
          )
          .map((c) => [c.studentRegNo, c.studentName, c.unitCode, c.consecutiveAbsenceCount, c.unitAbsenceCount, c.termAbsenceCount, c.escalationLevel]);
        break;
      case 'department_attendance_comparison': {
        const mgmt = this.getManagementDashboard(actor);
        columns = ['Department', 'Sessions', 'Avg Attendance %', 'Lessons Recorded', 'Unconducted', 'Open Absences', 'Escalated'];
        rows = mgmt.departmentComparison.map((d) => [
          d.departmentName,
          d.sessionsCount,
          `${d.avgAttendancePct}%`,
          d.lessonsRecorded,
          d.unconductedLessons,
          d.openAbsences,
          d.escalatedCount,
        ]);
        break;
      }
      case 'uploaded_documents_compliance':
        columns = ['Category', 'Document Title', 'Unit', 'Lecturer', 'Version', 'Approval Status', 'Updated At'];
        rows = docs.map((d) => [
          TEACHING_DOCUMENT_CATEGORY_LABELS[d.category] ?? d.category,
          d.title,
          d.unitCode,
          d.uploadedByName,
          `v${d.currentVersion}`,
          d.status,
          d.updatedAt.slice(0, 10),
        ]);
        break;
      case 'unconducted_missed_lessons':
        columns = ['Date', 'Unit', 'Class', 'Trainer', 'Status', 'Reason / Challenges', 'HOD Review'];
        rows = lessons
          .filter((l) => l.status === 'NOT_CONDUCTED' || l.status === 'PARTIALLY_CONDUCTED' || l.status === 'RESCHEDULED')
          .map((l) => [l.lessonDate, l.unitCode, l.classGroupId, l.actualTrainerName, l.status, l.challengesFaced || l.trainerRemarks, l.hodReviewStatus]);
        break;
      case 'term_academic_teaching_summary':
        columns = ['Academic Year / Term', 'Total Units Covered', 'Lessons Recorded', 'Documents Uploaded', 'Absence Cases', 'Escalations'];
        rows = [
          [
            '2026 / Term 3',
            new Set(lessons.map((l) => l.unitCode)).size,
            lessons.filter((l) => l.status !== 'SCHEDULED').length,
            docs.length,
            cases.length,
            cases.filter((c) => c.escalationLevel === 'HOD' || c.escalationLevel === 'PRINCIPAL').length,
          ],
        ];
        break;
    }

    return {
      key: meta.key,
      title: meta.title,
      audience: meta.audience,
      generatedAt: nowIso(),
      generatedBy: actor.fullName,
      columns,
      rows,
      totalRows: rows.length,
      catalogue: TEACHING_REPORT_CATALOGUE,
    };
  },

  exportReportCsv(actor: TeachingActor, reportKey: TeachingReportKey): { fileName: string; csv: string } {
    const rep = this.generateReport(actor, reportKey);
    const header = rep.columns.map(escapeCsvCell).join(',');
    const body = rep.rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
    return {
      fileName: `hitech_${reportKey}_${nowIso().slice(0, 10)}.csv`,
      csv: `${header}\n${body}`,
    };
  },
};
