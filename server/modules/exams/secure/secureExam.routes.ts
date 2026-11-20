import { Router, type Request, type Response } from 'express';
import {
  requireAuth,
  requirePermission,
  requirePortalAuth,
} from '../../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../../staff/staff.permissions.ts';
import { SecureExamHttpError, secureExamService } from './secureExam.service.ts';
import type { ExamIncidentStatus, ExamSecurityEventType, ExamSecurityPolicy } from './secureExam.types.ts';

function handleSecureExamError(res: Response, err: unknown): void {
  if (err instanceof SecureExamHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected secure examination error.';
  res.status(500).json({ success: false, error: message });
}

function resolveStudentIdentity(req: Request): {
  studentId: string;
  studentRegNo: string;
  studentName: string;
} {
  if (req.portalUser) {
    return {
      studentId: req.portalUser.uid,
      studentRegNo: req.portalUser.registrationNumber || req.portalUser.uid,
      studentName: req.portalUser.fullName,
    };
  }
  if (req.staffUser) {
    // Allows authenticated staff previews/testing when signed into staff sandbox
    return {
      studentId: req.staffUser.id,
      studentRegNo: req.staffUser.employeeNumber,
      studentName: req.staffUser.fullName,
    };
  }
  throw new SecureExamHttpError(401, 'Authentication required.');
}

// ============================================================================
// STUDENT SECURE EXAM SESSION ROUTES (/api/student/exam-sessions)
// ============================================================================
export const studentSecureExamRoutes = Router();

studentSecureExamRoutes.use(requirePortalAuth);

studentSecureExamRoutes.get('/exams', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = secureExamService.listAvailableExamsForStudent(identity.studentId);
    res.json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.post('/start', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = secureExamService.startExamSession({
      examId: String(req.body?.examId ?? ''),
      ...identity,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.post('/:examId/start', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = secureExamService.startExamSession({
      examId: String(req.params.examId),
      ...identity,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.get('/:sessionId', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = secureExamService.getStudentSession(
      String(req.params.sessionId),
      identity.studentId
    );
    res.json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.get('/:sessionId/status', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = secureExamService.getSessionStatus(
      String(req.params.sessionId),
      identity.studentId
    );
    res.json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.put('/:sessionId/answers', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const data = secureExamService.saveSessionAnswers(
      String(req.params.sessionId),
      identity.studentId,
      answers
    );
    res.json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.post('/:sessionId/security-events', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = secureExamService.recordSecurityEvent(
      String(req.params.sessionId),
      identity.studentId,
      {
        type: String(req.body?.type ?? '') as ExamSecurityEventType,
        occurredAt:
          typeof req.body?.occurredAt === 'string' && req.body.occurredAt
            ? req.body.occurredAt
            : new Date().toISOString(),
        details: typeof req.body?.details === 'string' ? req.body.details : undefined,
      }
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.post('/:sessionId/submit', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const data = secureExamService.submitSession(
      String(req.params.sessionId),
      identity.studentId
    );
    res.json({ success: true, data });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

// ============================================================================
// EXAMINATION SUPERVISOR & SECURITY CONFIG ROUTES (/api/exams/supervisor)
// ============================================================================
export const supervisorSecureExamRoutes = Router();

supervisorSecureExamRoutes.use(requireAuth);

supervisorSecureExamRoutes.get(
  '/sessions',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (_req, res) => {
    try {
      const data = secureExamService.getSupervisorOverview();
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.get(
  '/sessions/:sessionId',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    try {
      const data = secureExamService.inspectSupervisorSession(String(req.params.sessionId));
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.post(
  '/sessions/:sessionId/intervene',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const action = req.body?.action === 'FORCE_SUBMIT' ? 'FORCE_SUBMIT' : 'TERMINATE';
      const data = secureExamService.supervisorInterveneSession({
        sessionId: String(req.params.sessionId),
        action,
        reason: String(req.body?.reason ?? ''),
        actorId: actor.id,
        actorName: actor.fullName,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.post(
  '/incidents/:incidentId/review',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const data = secureExamService.reviewIncident({
        incidentId: String(req.params.incidentId),
        status: String(req.body?.status ?? '') as ExamIncidentStatus,
        reviewerNotes: typeof req.body?.reviewerNotes === 'string' ? req.body.reviewerNotes : undefined,
        actorId: actor.id,
        actorName: actor.fullName,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.put(
  '/exams/:examId/security-config',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const patch = (req.body?.securityPolicy ?? req.body ?? {}) as Partial<ExamSecurityPolicy>;
      const data = secureExamService.updateExamSecurityPolicy({
        examId: String(req.params.examId),
        policyPatch: patch,
        actorId: actor.id,
        actorName: actor.fullName,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.post(
  '/expire-overdue',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (_req, res) => {
    try {
      const data = secureExamService.expireActiveSessions();
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);
