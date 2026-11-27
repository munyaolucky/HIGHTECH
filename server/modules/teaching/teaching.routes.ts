import { Router, type Request, type Response } from 'express';
import {
  requireAuth,
  requirePermission,
  requirePortalAuth,
} from '../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../staff/staff.permissions.ts';
import {
  TeachingHttpError,
  teachingService,
  type TeachingActor,
} from './teaching.service.ts';
import type { TeachingReportKey } from './teaching.types.ts';

function toTeachingActor(req: Request): TeachingActor {
  if (req.staffUser) {
    return {
      id: req.staffUser.id,
      fullName: req.staffUser.fullName,
      role: req.staffUser.role,
      departmentId: req.staffUser.departmentId,
      department: req.staffUser.department,
      permissions: req.staffUser.permissions,
      registrationNumber: req.portalUser?.registrationNumber ?? null,
    };
  }
  if (req.portalUser) {
    return {
      id: req.portalUser.registrationNumber || req.portalUser.uid,
      fullName: req.portalUser.fullName,
      role: req.portalUser.primaryRole.toUpperCase(),
      departmentId: req.portalUser.departmentId,
      department: 'Student',
      permissions: [],
      registrationNumber: req.portalUser.registrationNumber,
    };
  }
  throw new TeachingHttpError(401, 'Authentication required.');
}

function requireStudentPortalIdentity(req: Request): {
  regNo: string;
  fullName: string;
  actor: TeachingActor;
} {
  if (req.staffUser) {
    throw new TeachingHttpError(403, 'Student self-service endpoints are restricted to student accounts.');
  }
  if (!req.portalUser || !req.portalUser.registrationNumber) {
    throw new TeachingHttpError(
      401,
      'Student sign-in required. Sign in with your student registration number to access your absence cases and live check-in.'
    );
  }
  if (req.portalUser.primaryRole.toUpperCase() !== 'STUDENT') {
    throw new TeachingHttpError(403, 'Student self-service endpoints are restricted to student accounts.');
  }
  return {
    regNo: req.portalUser.registrationNumber,
    fullName: req.portalUser.fullName,
    actor: toTeachingActor(req),
  };
}

function handleTeachingError(res: Response, err: unknown): void {
  if (err instanceof TeachingHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected teaching module error.';
  res.status(500).json({ success: false, error: message });
}

// 1. /api/teaching/*
export const teachingRoutes = Router();
teachingRoutes.use(requireAuth);

teachingRoutes.get(
  '/summary',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.getLecturerDashboardSummary(toTeachingActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/documents',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.listDocuments(toTeachingActor(req), {
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
        unitCode: req.query.unitCode as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/documents',
  requirePermission(STAFF_PERMISSIONS.TEACHING_DOCUMENTS_SUBMIT),
  (req, res) => {
    try {
      const data = teachingService.uploadDocument(toTeachingActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/documents/:id/version',
  requirePermission(STAFF_PERMISSIONS.TEACHING_DOCUMENTS_SUBMIT),
  (req, res) => {
    try {
      const data = teachingService.addDocumentVersion(
        toTeachingActor(req),
        req.params.id,
        req.body || {}
      );
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/documents/:id/status',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const { action, comment } = req.body || {};
      const data = teachingService.transitionDocumentStatus(
        toTeachingActor(req),
        req.params.id,
        String(action || '').toUpperCase() as 'SUBMIT' | 'APPROVE' | 'RETURN' | 'ARCHIVE',
        comment
      );
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/documents/:id/download',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const versionNumber = req.query.version ? Number(req.query.version) : undefined;
      const { version } = teachingService.downloadDocument(
        toTeachingActor(req),
        req.params.id,
        versionNumber
      );
      const buf = Buffer.from(version.fileContentBase64, 'base64');
      res.setHeader('Content-Type', version.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(version.fileName)}"`
      );
      res.send(buf);
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/schemes',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.listSchemes(toTeachingActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/schemes',
  requirePermission(STAFF_PERMISSIONS.TEACHING_MANAGE),
  (req, res) => {
    try {
      const data = teachingService.createScheme(toTeachingActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.patch(
  '/schemes/:id/topics/:topicId',
  requirePermission(STAFF_PERMISSIONS.TEACHING_MANAGE),
  (req, res) => {
    try {
      const { covered, lessonDeliveryId, remarks } = req.body || {};
      const data = teachingService.toggleTopicCoverage(
        toTeachingActor(req),
        req.params.id,
        req.params.topicId,
        Boolean(covered),
        lessonDeliveryId,
        remarks
      );
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/lessons',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.listLessons(toTeachingActor(req), {
        status: req.query.status as string | undefined,
        unitCode: req.query.unitCode as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/lessons',
  requirePermission(STAFF_PERMISSIONS.TEACHING_MANAGE),
  (req, res) => {
    try {
      const data = teachingService.saveLessonDelivery(toTeachingActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/lessons/:id/hod-review',
  requirePermission(STAFF_PERMISSIONS.TEACHING_DOCUMENTS_APPROVE),
  (req, res) => {
    try {
      const { reviewStatus, comments } = req.body || {};
      const normalized = String(reviewStatus || 'VERIFIED').toUpperCase();
      if (normalized !== 'VERIFIED' && normalized !== 'FLAGGED') {
        throw new TeachingHttpError(400, 'reviewStatus must be VERIFIED or FLAGGED.');
      }
      const data = teachingService.hodReviewLesson(
        toTeachingActor(req),
        req.params.id,
        normalized,
        comments
      );
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/observations',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.listObservations(toTeachingActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/observations',
  requirePermission(STAFF_PERMISSIONS.TEACHING_DOCUMENTS_APPROVE),
  (req, res) => {
    try {
      const data = teachingService.createObservation(toTeachingActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/attendance',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.listAttendanceSessions(toTeachingActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/attendance',
  requirePermission(STAFF_PERMISSIONS.ATTENDANCE_MARK),
  (req, res) => {
    try {
      const data = teachingService.commitAttendanceRegister(toTeachingActor(req), req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/attendance/:sessionId/qr',
  requirePermission(STAFF_PERMISSIONS.ATTENDANCE_MARK),
  (req, res) => {
    try {
      const data = teachingService.generateQrSession(toTeachingActor(req), req.params.sessionId);
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/attendance/:sessionId/corrections',
  requirePermission(STAFF_PERMISSIONS.ATTENDANCE_MARK),
  (req, res) => {
    try {
      const { recordId, requestedStatus, reason } = req.body || {};
      const data = teachingService.requestAttendanceCorrection(
        toTeachingActor(req),
        req.params.sessionId,
        String(recordId || ''),
        String(requestedStatus || ''),
        String(reason || '')
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/attendance/corrections/:id/review',
  requirePermission(STAFF_PERMISSIONS.ATTENDANCE_AMEND_APPROVE),
  (req, res) => {
    try {
      const { decision, note } = req.body || {};
      const normalized = String(decision || 'APPROVED').toUpperCase();
      if (normalized !== 'APPROVED' && normalized !== 'REJECTED') {
        throw new TeachingHttpError(400, 'Decision must be APPROVED or REJECTED.');
      }
      const data = teachingService.reviewAttendanceCorrection(
        toTeachingActor(req),
        req.params.id,
        normalized,
        note
      );
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/catch-ups',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.listCatchUps(toTeachingActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/catch-ups',
  requirePermission(STAFF_PERMISSIONS.TEACHING_MANAGE),
  (req, res) => {
    try {
      const data = teachingService.createCatchUp(toTeachingActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.patch(
  '/catch-ups/:id',
  requirePermission(STAFF_PERMISSIONS.TEACHING_MANAGE),
  (req, res) => {
    try {
      const { status, completionNotes } = req.body || {};
      const st = String(status || 'COMPLETED').toUpperCase() as 'SCHEDULED' | 'COMPLETED' | 'MISSED';
      if (!['SCHEDULED', 'COMPLETED', 'MISSED'].includes(st)) {
        throw new TeachingHttpError(400, 'Status must be SCHEDULED, COMPLETED, or MISSED.');
      }
      const data = teachingService.updateCatchUpStatus(
        toTeachingActor(req),
        req.params.id,
        st,
        completionNotes
      );
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.get(
  '/interventions',
  requirePermission(STAFF_PERMISSIONS.TEACHING_VIEW),
  (req, res) => {
    try {
      const data = teachingService.listInterventions(toTeachingActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

teachingRoutes.post(
  '/interventions',
  requirePermission(STAFF_PERMISSIONS.ABSENCE_REVIEW),
  (req, res) => {
    try {
      const data = teachingService.createIntervention(toTeachingActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

// 2. /api/absence/*
export const absenceRoutes = Router();

absenceRoutes.get('/my-cases', requirePortalAuth, (req, res) => {
  try {
    const { regNo, actor } = requireStudentPortalIdentity(req);
    const data = teachingService.listMyAbsenceCases(regNo, actor);
    res.json({ success: true, data });
  } catch (err) {
    handleTeachingError(res, err);
  }
});

absenceRoutes.post('/qr-checkin', requirePortalAuth, (req, res) => {
  try {
    const { regNo, fullName } = requireStudentPortalIdentity(req);
    const qrToken = String(req.body?.qrToken || req.body?.code || '');
    const data = teachingService.studentQrCheckIn(regNo, fullName, qrToken);
    res.json({ success: true, data });
  } catch (err) {
    handleTeachingError(res, err);
  }
});

absenceRoutes.post('/:id/explanation', requirePortalAuth, (req, res) => {
  try {
    const { regNo, fullName } = requireStudentPortalIdentity(req);
    const data = teachingService.submitStudentExplanation(
      regNo,
      fullName,
      req.params.id,
      req.body || {}
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleTeachingError(res, err);
  }
});

absenceRoutes.post('/:id/confirm-trainer-note', requirePortalAuth, (req, res) => {
  try {
    const { regNo, fullName } = requireStudentPortalIdentity(req);
    const explanationId = String(req.body?.explanationId || '');
    const data = teachingService.confirmTrainerVerbalNote(
      regNo,
      fullName,
      req.params.id,
      explanationId
    );
    res.json({ success: true, data });
  } catch (err) {
    handleTeachingError(res, err);
  }
});

absenceRoutes.post('/:id/evidence', requirePortalAuth, (req, res) => {
  try {
    const actor = toTeachingActor(req);
    const data = teachingService.uploadAbsenceEvidence(actor, req.params.id, req.body || {});
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleTeachingError(res, err);
  }
});

absenceRoutes.get('/:id/evidence/:evId', requirePortalAuth, (req, res) => {
  try {
    const actor = toTeachingActor(req);
    const ev = teachingService.downloadAbsenceEvidence(actor, req.params.id, req.params.evId);
    const buf = Buffer.from(ev.fileContentBase64, 'base64');
    res.setHeader('Content-Type', ev.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(ev.fileName)}"`
    );
    res.send(buf);
  } catch (err) {
    handleTeachingError(res, err);
  }
});

absenceRoutes.get(
  '/cases',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.ABSENCE_REVIEW),
  (req, res) => {
    try {
      const data = teachingService.listStaffAbsenceCases(toTeachingActor(req), {
        status: req.query.status as string | undefined,
        escalationLevel: req.query.escalationLevel as string | undefined,
        unitCode: req.query.unitCode as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

absenceRoutes.post(
  '/:id/trainer-note',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.ABSENCE_REVIEW),
  (req, res) => {
    try {
      const data = teachingService.recordTrainerVerbalExplanation(
        toTeachingActor(req),
        req.params.id,
        req.body || {}
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

absenceRoutes.post(
  '/:id/review',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.ABSENCE_REVIEW),
  (req, res) => {
    try {
      const { decision, comment, escalateToRole } = req.body || {};
      const data = teachingService.reviewAbsenceCase(
        toTeachingActor(req),
        req.params.id,
        String(decision || 'UNDER_REVIEW').toUpperCase() as
          | 'UNDER_REVIEW'
          | 'RECOMMENDED'
          | 'APPROVED'
          | 'REJECTED'
          | 'ESCALATED'
          | 'CLOSED',
        String(comment || ''),
        escalateToRole
      );
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

/**
 * Student academic self-service endpoints.
 *
 * Candidate identity is always resolved from the authenticated portal
 * session. The client cannot choose a registration number.
 */
export const studentAcademicRoutes = Router();

studentAcademicRoutes.get('/attendance', requirePortalAuth, (req, res) => {
  try {
    const { regNo, actor } = requireStudentPortalIdentity(req);
    const attendance = teachingService.listMyAbsenceCases(regNo, actor);

    res.json({
      success: true,
      data: {
        studentRegNo: attendance.studentRegNo,
        overallAttendancePct: attendance.overallAttendancePct,
        minimumRequiredPct: attendance.minimumRequiredPct,
        attendanceHistory: attendance.attendanceHistory,
        activeQrSessions: attendance.activeQrSessions,
        absenceCases: attendance.cases,
        catchUpLessons: attendance.catchUpLessons,
        alerts: attendance.alerts,
      },
    });
  } catch (err) {
    handleTeachingError(res, err);
  }
});

// 3. /api/management/*
export const managementRoutes = Router();
managementRoutes.use(requireAuth);

managementRoutes.get(
  '/attendance',
  requirePermission(STAFF_PERMISSIONS.TEACHING_REPORTS_VIEW),
  (req, res) => {
    try {
      const data = teachingService.getManagementDashboard(toTeachingActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

managementRoutes.get('/attendance-policy', (req, res) => {
  const perms = req.staffUser?.permissions ?? [];
  if (
    !perms.includes(STAFF_PERMISSIONS.TEACHING_VIEW) &&
    !perms.includes(STAFF_PERMISSIONS.POLICY_CONFIGURE)
  ) {
    res.status(403).json({
      success: false,
      error: 'Access denied: requires teaching.view or teaching.policy.configure permission.',
    });
    return;
  }
  try {
    const data = teachingService.getAttendancePolicy();
    res.json({ success: true, data });
  } catch (err) {
    handleTeachingError(res, err);
  }
});

managementRoutes.put(
  '/attendance-policy',
  requirePermission(STAFF_PERMISSIONS.POLICY_CONFIGURE),
  (req, res) => {
    try {
      const data = teachingService.updateAttendancePolicy(toTeachingActor(req), req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

managementRoutes.get(
  '/teaching-reports',
  requirePermission(STAFF_PERMISSIONS.TEACHING_REPORTS_VIEW),
  (req, res) => {
    try {
      const key = String(req.query.reportKey || 'daily_lesson_delivery') as TeachingReportKey;
      const data = teachingService.generateReport(toTeachingActor(req), key);
      res.json({ success: true, data });
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);

managementRoutes.get(
  '/teaching-reports/:reportKey/export',
  requirePermission(STAFF_PERMISSIONS.TEACHING_REPORTS_VIEW),
  (req, res) => {
    try {
      const key = String(req.params.reportKey || 'daily_lesson_delivery') as TeachingReportKey;
      const { fileName, csv } = teachingService.exportReportCsv(toTeachingActor(req), key);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(csv);
    } catch (err) {
      handleTeachingError(res, err);
    }
  }
);
