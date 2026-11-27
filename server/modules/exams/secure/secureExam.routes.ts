import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import {
  requireAuth,
  requirePermission,
  requirePortalAuth,
} from '../../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../../staff/staff.permissions.ts';
import { SecureExamHttpError, secureExamService } from './secureExam.service.ts';
import { examMessagingHub } from './examMessagingWs.ts';
import { examEventsStream } from './examEventsStream.ts';
import type {
  ExamIncidentStatus,
  ExamMessageKind,
  ExamMessagePriority,
  ExamSecurityEventType,
  ExamSecurityPolicy,
} from './secureExam.types.ts';

function handleSecureExamError(res: Response, err: unknown): void {
  if (err instanceof SecureExamHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected secure examination error.';
  res.status(500).json({ success: false, error: message });
}

export function resolveStudentIdentity(req: Request): {
  studentId: string;
  studentRegNo: string;
  studentName: string;
} {
  const portal = req.portalUser;

  if (!portal) {
    if (req.staffUser) {
      throw new SecureExamHttpError(
        403,
        'Staff accounts cannot access student candidate sessions.'
      );
    }

    throw new SecureExamHttpError(
      401,
      'Student portal authentication required.'
    );
  }

  if (portal.primaryRole.toUpperCase() !== 'STUDENT') {
    throw new SecureExamHttpError(
      403,
      'Only registered student accounts can access candidate examination sessions.'
    );
  }

  if (!portal.registrationNumber?.trim()) {
    throw new SecureExamHttpError(
      403,
      'Your student account is not linked to an official registration number.'
    );
  }

  if (!portal.uid?.trim()) {
    throw new SecureExamHttpError(
      403,
      'Your student account has no valid institutional identity.'
    );
  }

  return {
    studentId: portal.uid,
    studentRegNo: portal.registrationNumber.trim(),
    studentName: portal.fullName,
  };
}

function requireStudentCandidate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    resolveStudentIdentity(req);
    next();
  } catch (error) {
    if (error instanceof SecureExamHttpError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Unable to verify examination candidate identity.',
    });
  }
}

// ============================================================================
// STUDENT SECURE EXAM SESSION ROUTES (/api/student/exam-sessions)
// ============================================================================
export const studentSecureExamRoutes = Router();

studentSecureExamRoutes.use(requirePortalAuth, requireStudentCandidate);

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

studentSecureExamRoutes.get('/:sessionId/messages', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const messages = secureExamService.listSessionMessages(
      String(req.params.sessionId),
      identity.studentId
    );
    res.json({ success: true, data: { messages } });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.post('/:sessionId/messages', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const message = secureExamService.sendStudentHelpMessage({
      sessionId: String(req.params.sessionId),
      studentId: identity.studentId,
      kind: req.body?.kind as ExamMessageKind | undefined,
      priority: req.body?.priority as ExamMessagePriority | undefined,
      body: String(req.body?.body ?? ''),
    });
    examMessagingHub.broadcastMessage(message);
    res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    handleSecureExamError(res, err);
  }
});

studentSecureExamRoutes.post('/:sessionId/messages/read', (req, res) => {
  try {
    const identity = resolveStudentIdentity(req);
    const sessionId = String(req.params.sessionId);
    const result = secureExamService.markSessionMessagesRead({
      sessionId,
      readerRole: 'STUDENT',
      studentId: identity.studentId,
    });
    examMessagingHub.broadcastReadReceipt(sessionId, 'STUDENT');
    res.json({ success: true, data: result });
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
  '/sessions/:sessionId/extend-time',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const data = secureExamService.extendSessionTime({
        sessionId: String(req.params.sessionId),
        additionalSeconds: Number(req.body?.additionalSeconds),
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
  '/sessions/:sessionId/restore',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const data = secureExamService.restoreSession({
        sessionId: String(req.params.sessionId),
        reason: String(req.body?.reason ?? ''),
        graceSeconds:
          req.body?.graceSeconds !== undefined ? Number(req.body.graceSeconds) : undefined,
        actorId: actor.id,
        actorName: actor.fullName,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.get(
  '/events',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    const unsubscribe = examEventsStream.subscribe(res);
    req.on('close', unsubscribe);
  }
);

supervisorSecureExamRoutes.get(
  '/:examId/events',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    const unsubscribe = examEventsStream.subscribe(res, String(req.params.examId));
    req.on('close', unsubscribe);
  }
);

supervisorSecureExamRoutes.get(
  '/reports',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    try {
      const examId =
        typeof req.query.examId === 'string' && req.query.examId.trim()
          ? req.query.examId.trim()
          : undefined;
      const data = secureExamService.getExamReports(examId);
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.get(
  '/:examId/reports/attendance',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    try {
      const data = secureExamService.getExamReports(String(req.params.examId));
      res.json({ success: true, data: { attendance: data.attendance } });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.get(
  '/:examId/reports/security',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    try {
      const data = secureExamService.getExamReports(String(req.params.examId));
      res.json({ success: true, data: { incidents: data.incidents } });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.get(
  '/audit',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    try {
      const examId =
        typeof req.query.examId === 'string' && req.query.examId.trim()
          ? req.query.examId.trim()
          : undefined;
      const data = secureExamService.getExamReports(examId);
      res.json({ success: true, data: { auditLogs: data.auditLogs } });
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

supervisorSecureExamRoutes.get(
  '/messages',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    try {
      const sessionId =
        typeof req.query.sessionId === 'string' && req.query.sessionId.trim()
          ? req.query.sessionId.trim()
          : undefined;
      const data = secureExamService.listAllSupervisorMessages(sessionId);
      res.json({ success: true, data });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.post(
  '/sessions/:sessionId/messages',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const message = secureExamService.sendSupervisorMessage({
        sessionId: String(req.params.sessionId),
        actorId: actor.id,
        actorName: actor.fullName,
        kind: req.body?.kind as ExamMessageKind | undefined,
        priority: req.body?.priority as ExamMessagePriority | undefined,
        body: String(req.body?.body ?? ''),
      });
      examMessagingHub.broadcastMessage(message);
      res.status(201).json({ success: true, data: { message } });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.post(
  '/sessions/:sessionId/messages/read',
  requirePermission(STAFF_PERMISSIONS.ACADEMICS_VIEW),
  (req, res) => {
    try {
      const sessionId = String(req.params.sessionId);
      const result = secureExamService.markSessionMessagesRead({
        sessionId,
        readerRole: 'SUPERVISOR',
      });
      examMessagingHub.broadcastReadReceipt(sessionId, 'SUPERVISOR');
      res.json({ success: true, data: result });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

supervisorSecureExamRoutes.post(
  '/exams/:examId/broadcast-instruction',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const actor = req.staffUser!;
      const messages = secureExamService.broadcastSupervisorInstruction({
        examId: String(req.params.examId),
        actorId: actor.id,
        actorName: actor.fullName,
        priority: req.body?.priority as ExamMessagePriority | undefined,
        body: String(req.body?.body ?? ''),
      });
      examMessagingHub.broadcastMessages(messages);
      res.status(201).json({ success: true, data: { messages, count: messages.length } });
    } catch (err) {
      handleSecureExamError(res, err);
    }
  }
);

