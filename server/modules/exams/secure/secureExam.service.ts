import crypto from 'node:crypto';
import { getDb, saveDb } from '../../../data/store.ts';
import type {
  CandidateExamSessionDto,
  ExamIncidentStatus,
  ExamSecurityEventType,
  ExamSecurityPolicy,
  SecureExamDefinitionRecord,
  SecureExamIncidentRecord,
  SecureExamSecurityEventRecord,
  SecureExamSessionRecord,
  ViolationResponseAction,
} from './secureExam.types.ts';

export class SecureExamHttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'SecureExamHttpError';
  }
}

const VALID_EVENT_TYPES = new Set<ExamSecurityEventType>([
  'TAB_HIDDEN',
  'WINDOW_BLUR',
  'FULLSCREEN_EXIT',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'CUT_ATTEMPT',
  'CONTEXT_MENU',
  'PROHIBITED_SHORTCUT',
  'DRAG_ATTEMPT',
  'CONNECTION_LOST',
  'CONNECTION_RESTORED',
]);

const VALID_INCIDENT_REVIEW_STATUSES = new Set<ExamIncidentStatus>([
  'UNDER_REVIEW',
  'DISMISSED',
  'CONFIRMED',
]);

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function appendAuditLog(
  sessionId: string | undefined,
  examId: string | undefined,
  actorId: string,
  actorName: string,
  action: string,
  detail: string
): void {
  const db = getDb();
  db.secureExamAuditLogs.unshift({
    id: createId('SECAUD'),
    sessionId,
    examId,
    actorId,
    actorName,
    action,
    detail,
    timestampIso: new Date().toISOString(),
  });
  if (db.secureExamAuditLogs.length > 500) {
    db.secureExamAuditLogs.length = 500;
  }
}

function computeObjectiveScore(
  exam: SecureExamDefinitionRecord,
  answers: SecureExamSessionRecord['answers']
): number {
  let total = 0;
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  for (const q of exam.questions) {
    if (!q.correctOptionIds || q.correctOptionIds.length === 0) continue;
    const val = answerMap.get(q.id);
    if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
      if (typeof val === 'string' && q.correctOptionIds.includes(val)) {
        total += q.marks;
      }
    } else if (q.type === 'MULTIPLE_CHOICE' && Array.isArray(val)) {
      const selected = new Set(val);
      const expected = new Set(q.correctOptionIds);
      if (
        selected.size === expected.size &&
        Array.from(expected).every((id) => selected.has(id))
      ) {
        total += q.marks;
      }
    }
  }
  return total;
}

function toFrontendStatus(
  status: SecureExamSessionRecord['status']
): CandidateExamSessionDto['status'] {
  if (status === 'SUBMITTED') return 'submitted';
  if (status === 'EXPIRED' || status === 'TERMINATED') return 'expired';
  return 'active';
}

function buildSessionDto(
  session: SecureExamSessionRecord,
  exam: SecureExamDefinitionRecord
): CandidateExamSessionDto {
  const db = getDb();
  const events = db.secureExamEvents.filter((e) => e.sessionId === session.id);
  const tabSwitchCount = events.filter((e) => e.eventType === 'TAB_HIDDEN').length;
  const fullscreenExitCount = events.filter((e) => e.eventType === 'FULLSCREEN_EXIT').length;

  return {
    id: session.id,
    status: toFrontendStatus(session.status),
    serverStatus: session.status,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    submittedAt: session.submittedAt,
    lastSavedAt: session.lastSavedAt,
    terminationReason: session.terminationReason,
    securityPolicy: { ...exam.securityPolicy },
    exam: {
      id: exam.id,
      code: exam.code,
      title: exam.title,
      subject: exam.subject,
      unitCode: exam.unitCode,
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      instructions: [...exam.instructions],
      startsAt: exam.startsAt,
      endsAt: exam.endsAt,
      questions: exam.questions.map((q) => ({
        id: q.id,
        number: q.number,
        type: q.type,
        instruction: q.instruction,
        text: q.text,
        marks: q.marks,
        options: q.options ? q.options.map((o) => ({ ...o })) : undefined,
      })),
    },
    answers: session.answers.map((a) => ({
      questionId: a.questionId,
      value: Array.isArray(a.value) ? [...a.value] : a.value,
      updatedAt: a.updatedAt,
    })),
    securityEventCount: events.length,
    tabSwitchCount,
    fullscreenExitCount,
  };
}

function expireSessionIfOverdue(session: SecureExamSessionRecord, exam?: SecureExamDefinitionRecord): boolean {
  if (session.status !== 'ACTIVE') return false;
  const now = Date.now();
  const expiresMs = new Date(session.expiresAt).getTime();
  if (Number.isNaN(expiresMs) || expiresMs > now) return false;

  const nowIso = new Date(now).toISOString();
  session.status = 'EXPIRED';
  session.submittedAt = nowIso;
  session.updatedAt = nowIso;
  if (exam) {
    session.totalMarksAwarded = computeObjectiveScore(exam, session.answers);
  }
  appendAuditLog(
    session.id,
    session.examId,
    'system-expiry-worker',
    'Server Expiry Timer',
    'SESSION_EXPIRED',
    `Auto-finalized expired session ${session.id} while retaining ${session.answers.length} saved answer(s).`
  );
  return true;
}

export const secureExamService = {
  listAvailableExamsForStudent(studentId: string) {
    const db = getDb();
    this.expireActiveSessions();
    const now = Date.now();

    return db.secureExamDefinitions
      .filter((exam) => exam.isPublished)
      .map((exam) => {
        const mySessions = db.secureExamSessions.filter(
          (s) => s.examId === exam.id && s.studentId === studentId
        );
        const activeSession = mySessions.find((s) => s.status === 'ACTIVE');
        const latestSession = mySessions[0];
        const opensAt = new Date(exam.startsAt).getTime();
        const closesAt = new Date(exam.endsAt).getTime();

        return {
          id: exam.id,
          code: exam.code,
          title: exam.title,
          subject: exam.subject,
          unitCode: exam.unitCode,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          questionCount: exam.questions.length,
          startsAt: exam.startsAt,
          endsAt: exam.endsAt,
          windowOpen: now >= opensAt && now < closesAt,
          securityLevel: exam.securityPolicy.securityLevel,
          securityPolicy: exam.securityPolicy,
          attemptsUsed: mySessions.length,
          maxAttempts: exam.maxAttempts,
          activeSessionId: activeSession?.id ?? null,
          latestStatus: latestSession?.status ?? null,
        };
      });
  },

  startExamSession(input: {
    examId: string;
    studentId: string;
    studentRegNo: string;
    studentName: string;
    nowMs?: number;
  }): CandidateExamSessionDto {
    const examId = String(input.examId ?? '').trim();
    if (!examId) {
      throw new SecureExamHttpError(400, 'examId is required.');
    }

    const db = getDb();
    const exam = db.secureExamDefinitions.find((e) => e.id === examId);
    if (!exam) {
      throw new SecureExamHttpError(404, 'Examination not found.');
    }
    if (!exam.isPublished) {
      throw new SecureExamHttpError(403, 'Examination is not available.');
    }

    const nowMs = input.nowMs ?? Date.now();
    const startsMs = new Date(exam.startsAt).getTime();
    const endsMs = new Date(exam.endsAt).getTime();

    if (!Number.isNaN(startsMs) && nowMs < startsMs) {
      throw new SecureExamHttpError(403, 'Examination has not started yet.');
    }
    if (!Number.isNaN(endsMs) && nowMs >= endsMs) {
      throw new SecureExamHttpError(403, 'Examination window has closed.');
    }

    // Expire overdue active sessions before checking attempts
    const existingActive = db.secureExamSessions.find(
      (s) => s.examId === exam.id && s.studentId === input.studentId && s.status === 'ACTIVE'
    );
    if (existingActive) {
      const expired = expireSessionIfOverdue(existingActive, exam);
      if (!expired) {
        existingActive.lastHeartbeatAt = new Date(nowMs).toISOString();
        saveDb(db);
        return buildSessionDto(existingActive, exam);
      }
    }

    const previousAttempts = db.secureExamSessions.filter(
      (s) => s.examId === exam.id && s.studentId === input.studentId
    );
    if (previousAttempts.length >= exam.maxAttempts) {
      throw new SecureExamHttpError(
        409,
        `Maximum examination attempts (${exam.maxAttempts}) reached for this paper.`
      );
    }

    const durationMs = exam.durationMinutes * 60 * 1000;
    const durationExpiryMs = nowMs + durationMs;
    const effectiveExpiryMs =
      !Number.isNaN(endsMs) && endsMs < durationExpiryMs ? endsMs : durationExpiryMs;

    const nowIso = new Date(nowMs).toISOString();
    const session: SecureExamSessionRecord = {
      id: createId('EXAMSESS'),
      examId: exam.id,
      studentId: input.studentId,
      studentRegNo: input.studentRegNo,
      studentName: input.studentName,
      attemptNumber: previousAttempts.length + 1,
      status: 'ACTIVE',
      startedAt: nowIso,
      expiresAt: new Date(effectiveExpiryMs).toISOString(),
      lastHeartbeatAt: nowIso,
      connectionLost: false,
      answers: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.secureExamSessions.unshift(session);
    appendAuditLog(
      session.id,
      exam.id,
      input.studentId,
      input.studentName,
      'SESSION_STARTED',
      `Attempt #${session.attemptNumber} started for ${exam.title} (expires ${session.expiresAt}).`
    );
    saveDb(db);

    return buildSessionDto(session, exam);
  },

  getStudentSession(sessionId: string, studentId: string): CandidateExamSessionDto {
    const db = getDb();
    const session = db.secureExamSessions.find(
      (s) => s.id === sessionId && s.studentId === studentId
    );
    if (!session) {
      throw new SecureExamHttpError(404, 'Exam session not found.');
    }

    const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
    if (!exam) {
      throw new SecureExamHttpError(404, 'Examination definition not found.');
    }

    const changed = expireSessionIfOverdue(session, exam);
    session.lastHeartbeatAt = new Date().toISOString();
    if (changed || session.connectionLost) {
      session.connectionLost = false;
      saveDb(db);
    }
    return buildSessionDto(session, exam);
  },

  getSessionStatus(sessionId: string, studentId: string) {
    const dto = this.getStudentSession(sessionId, studentId);
    return {
      id: dto.id,
      status: dto.status,
      serverStatus: dto.serverStatus,
      expiresAt: dto.expiresAt,
      submittedAt: dto.submittedAt ?? null,
      lastSavedAt: dto.lastSavedAt ?? null,
      answeredCount: dto.answers.length,
      totalQuestions: dto.exam.questions.length,
      securityEventCount: dto.securityEventCount,
    };
  },

  saveSessionAnswers(
    sessionId: string,
    studentId: string,
    answersInput: { questionId: string; value: string | string[] }[],
    nowMs?: number
  ) {
    if (!Array.isArray(answersInput) || answersInput.length > 300) {
      throw new SecureExamHttpError(400, 'Answers payload must be an array of at most 300 items.');
    }

    const db = getDb();
    const session = db.secureExamSessions.find(
      (s) => s.id === sessionId && s.studentId === studentId
    );
    if (!session) {
      throw new SecureExamHttpError(404, 'Exam session not found.');
    }

    const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
    if (!exam) {
      throw new SecureExamHttpError(404, 'Examination definition not found.');
    }

    const currentNowMs = nowMs ?? Date.now();
    if (session.status !== 'ACTIVE') {
      throw new SecureExamHttpError(409, 'Exam session is not active.');
    }
    const expiresMs = new Date(session.expiresAt).getTime();
    if (!Number.isNaN(expiresMs) && expiresMs <= currentNowMs) {
      expireSessionIfOverdue(session, exam);
      saveDb(db);
      throw new SecureExamHttpError(410, 'Exam session has expired.');
    }

    const validQuestionIds = new Set(exam.questions.map((q) => q.id));
    const nowIso = new Date(currentNowMs).toISOString();

    for (const ans of answersInput) {
      if (!ans || typeof ans.questionId !== 'string' || !validQuestionIds.has(ans.questionId)) {
        throw new SecureExamHttpError(
          400,
          'An answer refers to an invalid examination question.'
        );
      }
      if (typeof ans.value === 'string') {
        if (ans.value.length > 30000) {
          throw new SecureExamHttpError(400, 'Answer response exceeds maximum allowed length (30,000 characters).');
        }
      } else if (Array.isArray(ans.value)) {
        if (ans.value.length > 100 || ans.value.some((v) => typeof v !== 'string')) {
          throw new SecureExamHttpError(400, 'Multiple-choice answer format is invalid.');
        }
      } else {
        throw new SecureExamHttpError(400, 'Invalid answer value format.');
      }
    }

    for (const ans of answersInput) {
      const normalizedValue = Array.isArray(ans.value) ? [...ans.value] : ans.value;
      const existing = session.answers.find((a) => a.questionId === ans.questionId);
      if (existing) {
        existing.value = normalizedValue;
        existing.updatedAt = nowIso;
        existing.savedAt = nowIso;
      } else {
        session.answers.push({
          questionId: ans.questionId,
          value: normalizedValue,
          updatedAt: nowIso,
          savedAt: nowIso,
        });
      }
    }

    session.lastSavedAt = nowIso;
    session.lastHeartbeatAt = nowIso;
    session.connectionLost = false;
    session.updatedAt = nowIso;
    saveDb(db);

    return {
      saved: true,
      savedAt: nowIso,
      answeredCount: session.answers.length,
    };
  },

  recordSecurityEvent(
    sessionId: string,
    studentId: string,
    input: {
      type: ExamSecurityEventType;
      occurredAt: string;
      details?: string;
    }
  ) {
    if (!VALID_EVENT_TYPES.has(input.type)) {
      throw new SecureExamHttpError(400, `Unsupported security event type: ${String(input.type)}`);
    }

    const db = getDb();
    const session = db.secureExamSessions.find(
      (s) => s.id === sessionId && s.studentId === studentId
    );
    if (!session) {
      throw new SecureExamHttpError(404, 'Exam session not found.');
    }

    if (session.status !== 'ACTIVE') {
      throw new SecureExamHttpError(409, 'Exam session is not active.');
    }

    const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
    if (!exam) {
      throw new SecureExamHttpError(404, 'Examination definition not found.');
    }

    const receivedAt = new Date().toISOString();
    const policy = exam.securityPolicy;
    const priorEvents = db.secureExamEvents.filter((e) => e.sessionId === session.id);

    let responseTriggered: ViolationResponseAction = 'WARNING_AND_LOG';
    let studentWarningMessage: string | null = null;
    let createOrEscalateIncident = false;
    let incidentSeverity: SecureExamIncidentRecord['severity'] = 'LOW';

    if (input.type === 'CONNECTION_LOST') {
      session.connectionLost = true;
      responseTriggered = 'WARNING_AND_LOG';
    } else if (input.type === 'CONNECTION_RESTORED') {
      session.connectionLost = false;
      responseTriggered = 'WARNING_AND_LOG';
    } else if (input.type === 'TAB_HIDDEN') {
      const nextCount = priorEvents.filter((e) => e.eventType === 'TAB_HIDDEN').length + 1;
      if (nextCount >= policy.tabSwitchSupervisorAt) {
        responseTriggered = 'NOTIFY_SUPERVISOR';
        createOrEscalateIncident = true;
        incidentSeverity = 'HIGH';
        studentWarningMessage =
          `Tab switch #${nextCount} recorded. Examination supervisor has been notified for review.`;
      } else if (nextCount >= policy.tabSwitchIncidentAt) {
        responseTriggered = 'WARNING_AND_LOG';
        createOrEscalateIncident = true;
        incidentSeverity = 'MEDIUM';
        studentWarningMessage =
          `Warning (${nextCount}): Tab switching detected and logged to the examination audit trail.`;
      } else {
        responseTriggered = 'WARNING';
        studentWarningMessage =
          'Warning: Switching browser tabs during an examination is monitored. Stay on the exam tab.';
      }
    } else if (input.type === 'FULLSCREEN_EXIT') {
      const nextFsCount =
        priorEvents.filter((e) => e.eventType === 'FULLSCREEN_EXIT').length + 1;
      if (nextFsCount >= policy.fullscreenExitSupervisorAt) {
        responseTriggered = 'SUPERVISOR_REVIEW';
        createOrEscalateIncident = true;
        incidentSeverity = 'MEDIUM';
        studentWarningMessage =
          `Repeated fullscreen exit (#${nextFsCount}) logged for supervisor review. Re-enter fullscreen immediately.`;
      } else {
        responseTriggered = 'WARNING_AND_LOG';
        studentWarningMessage =
          'Fullscreen mode exited. Please return to fullscreen immediately to continue.';
      }
    } else if (
      input.type === 'COPY_ATTEMPT' ||
      input.type === 'PASTE_ATTEMPT' ||
      input.type === 'CUT_ATTEMPT' ||
      input.type === 'PROHIBITED_SHORTCUT' ||
      input.type === 'CONTEXT_MENU' ||
      input.type === 'DRAG_ATTEMPT'
    ) {
      responseTriggered = 'BLOCK_AND_LOG';
      if (input.type === 'COPY_ATTEMPT' || input.type === 'PASTE_ATTEMPT' || input.type === 'CUT_ATTEMPT') {
        createOrEscalateIncident = true;
        incidentSeverity = 'LOW';
      }
      studentWarningMessage =
        input.type === 'PROHIBITED_SHORTCUT'
          ? 'Prohibited keyboard shortcut blocked and recorded.'
          : 'Clipboard and context-menu actions are disabled in Secure Exam Mode.';
    } else if (input.type === 'WINDOW_BLUR') {
      responseTriggered = 'WARNING_AND_LOG';
    }

    const eventRecord: SecureExamSecurityEventRecord = {
      id: createId('SECEV'),
      sessionId: session.id,
      eventType: input.type,
      occurredAt: input.occurredAt,
      receivedAt,
      details: input.details?.slice(0, 500),
      responseTriggered,
    };

    db.secureExamEvents.push(eventRecord);
    session.lastHeartbeatAt = receivedAt;
    session.updatedAt = receivedAt;

    if (policy.logSecurityIncidents && createOrEscalateIncident) {
      const existingIncident = db.secureExamIncidents.find(
        (inc) => inc.sessionId === session.id && inc.status !== 'DISMISSED'
      );
      const totalSessionEvents = priorEvents.length + 1;
      if (existingIncident) {
        existingIncident.eventCount = totalSessionEvents;
        if (
          incidentSeverity === 'HIGH' ||
          (incidentSeverity === 'MEDIUM' && existingIncident.severity === 'LOW')
        ) {
          existingIncident.severity = incidentSeverity;
        }
        existingIncident.summary = `${totalSessionEvents} security event(s) recorded (latest: ${input.type.replace(/_/g, ' ')}).`;
        existingIncident.updatedAt = receivedAt;
      } else {
        db.secureExamIncidents.unshift({
          id: createId('INC'),
          sessionId: session.id,
          examId: exam.id,
          examTitle: exam.title,
          studentId: session.studentId,
          studentRegNo: session.studentRegNo,
          studentName: session.studentName,
          status: 'OPEN',
          severity: incidentSeverity,
          summary: `${input.type.replace(/_/g, ' ')} threshold reached (${totalSessionEvents} event(s) logged).`,
          eventCount: totalSessionEvents,
          createdAt: receivedAt,
          updatedAt: receivedAt,
        });
      }
    }

    saveDb(db);

    return {
      recorded: true,
      eventId: eventRecord.id,
      receivedAt,
      responseTriggered,
      warningMessage: studentWarningMessage,
    };
  },

  submitSession(sessionId: string, studentId: string, nowMs?: number): CandidateExamSessionDto {
    const db = getDb();
    const session = db.secureExamSessions.find(
      (s) => s.id === sessionId && s.studentId === studentId
    );
    if (!session) {
      throw new SecureExamHttpError(404, 'Exam session not found.');
    }

    const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
    if (!exam) {
      throw new SecureExamHttpError(404, 'Examination definition not found.');
    }

    if (session.status === 'TERMINATED') {
      throw new SecureExamHttpError(409, 'Exam session was terminated by the examination supervisor.');
    }

    // Idempotent submission: return already-submitted/expired session cleanly
    if (session.status === 'SUBMITTED' || session.status === 'EXPIRED') {
      return buildSessionDto(session, exam);
    }

    const currentNowMs = nowMs ?? Date.now();
    const currentNowIso = new Date(currentNowMs).toISOString();
    const expiresMs = new Date(session.expiresAt).getTime();
    const expired = !Number.isNaN(expiresMs) && expiresMs <= currentNowMs;

    session.status = expired ? 'EXPIRED' : 'SUBMITTED';
    session.submittedAt = currentNowIso;
    session.updatedAt = currentNowIso;
    session.connectionLost = false;
    session.totalMarksAwarded = computeObjectiveScore(exam, session.answers);

    appendAuditLog(
      session.id,
      exam.id,
      studentId,
      session.studentName,
      expired ? 'SESSION_SUBMITTED_ON_EXPIRY' : 'SESSION_SUBMITTED',
      `Finalized ${session.answers.length} saved answer(s). Auto-scored objective marks: ${session.totalMarksAwarded}.`
    );
    saveDb(db);

    return buildSessionDto(session, exam);
  },

  expireActiveSessions(nowMs?: number) {
    const db = getDb();
    const currentMs = nowMs ?? Date.now();
    let expiredCount = 0;

    for (const session of db.secureExamSessions) {
      if (session.status !== 'ACTIVE') continue;
      const expiresMs = new Date(session.expiresAt).getTime();
      if (!Number.isNaN(expiresMs) && expiresMs <= currentMs) {
        const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
        if (expireSessionIfOverdue(session, exam)) {
          expiredCount++;
        }
      }
    }

    if (expiredCount > 0) {
      saveDb(db);
    }

    return {
      expiredCount,
      checkedAt: new Date(currentMs).toISOString(),
    };
  },

  // =========================================================================
  // SUPERVISOR & LECTURER / ADMIN SECURITY WORKSPACE
  // =========================================================================

  getSupervisorOverview() {
    const db = getDb();
    this.expireActiveSessions();

    const nowMs = Date.now();
    const sessions = db.secureExamSessions.map((session) => {
      const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
      const events = db.secureExamEvents.filter((e) => e.sessionId === session.id);
      const incidents = db.secureExamIncidents.filter((i) => i.sessionId === session.id);
      const lastBeatMs = session.lastHeartbeatAt
        ? new Date(session.lastHeartbeatAt).getTime()
        : new Date(session.updatedAt).getTime();
      const isDisconnected =
        session.status === 'ACTIVE' &&
        (Boolean(session.connectionLost) || nowMs - lastBeatMs > 3 * 60 * 1000);

      return {
        id: session.id,
        examId: session.examId,
        examTitle: exam?.title ?? session.examId,
        unitCode: exam?.unitCode ?? 'EXAM',
        studentRegNo: session.studentRegNo,
        studentName: session.studentName,
        attemptNumber: session.attemptNumber,
        status: session.status,
        isDisconnected,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        submittedAt: session.submittedAt ?? null,
        lastSavedAt: session.lastSavedAt ?? null,
        answeredCount: session.answers.length,
        totalQuestions: exam?.questions.length ?? 0,
        securityEventCount: events.length,
        tabSwitchCount: events.filter((e) => e.eventType === 'TAB_HIDDEN').length,
        fullscreenExitCount: events.filter((e) => e.eventType === 'FULLSCREEN_EXIT').length,
        openIncidentCount: incidents.filter(
          (i) => i.status === 'OPEN' || i.status === 'UNDER_REVIEW'
        ).length,
      };
    });

    const counts = {
      total: sessions.length,
      active: sessions.filter((s) => s.status === 'ACTIVE' && !s.isDisconnected).length,
      disconnected: sessions.filter((s) => s.isDisconnected).length,
      submitted: sessions.filter((s) => s.status === 'SUBMITTED').length,
      expired: sessions.filter((s) => s.status === 'EXPIRED' || s.status === 'TERMINATED').length,
      openIncidents: db.secureExamIncidents.filter(
        (i) => i.status === 'OPEN' || i.status === 'UNDER_REVIEW'
      ).length,
    };

    return {
      counts,
      exams: db.secureExamDefinitions.map((e) => ({
        id: e.id,
        code: e.code,
        title: e.title,
        unitCode: e.unitCode,
        durationMinutes: e.durationMinutes,
        totalMarks: e.totalMarks,
        isPublished: e.isPublished,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        questionCount: e.questions.length,
        securityPolicy: e.securityPolicy,
      })),
      sessions,
      incidents: db.secureExamIncidents,
      auditLogs: db.secureExamAuditLogs.slice(0, 60),
    };
  },

  inspectSupervisorSession(sessionId: string) {
    const db = getDb();
    this.expireActiveSessions();

    const session = db.secureExamSessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new SecureExamHttpError(404, 'Exam session not found.');
    }
    const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
    const events = db.secureExamEvents
      .filter((e) => e.sessionId === session.id)
      .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
    const incidents = db.secureExamIncidents.filter((i) => i.sessionId === session.id);
    const logs = db.secureExamAuditLogs.filter((l) => l.sessionId === session.id);

    return {
      session,
      examTitle: exam?.title ?? session.examId,
      unitCode: exam?.unitCode ?? 'EXAM',
      totalQuestions: exam?.questions.length ?? 0,
      events,
      incidents,
      logs,
    };
  },

  supervisorInterveneSession(input: {
    sessionId: string;
    action: 'FORCE_SUBMIT' | 'TERMINATE';
    reason: string;
    actorId: string;
    actorName: string;
  }) {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new SecureExamHttpError(
        400,
        'Provide a clear supervisor intervention reason (minimum 5 characters).'
      );
    }

    const db = getDb();
    const session = db.secureExamSessions.find((s) => s.id === input.sessionId);
    if (!session) {
      throw new SecureExamHttpError(404, 'Exam session not found.');
    }
    if (session.status !== 'ACTIVE') {
      throw new SecureExamHttpError(409, `Session is already ${session.status}.`);
    }

    const exam = db.secureExamDefinitions.find((e) => e.id === session.examId);
    const nowIso = new Date().toISOString();

    session.status = input.action === 'FORCE_SUBMIT' ? 'SUBMITTED' : 'TERMINATED';
    session.submittedAt = nowIso;
    session.updatedAt = nowIso;
    session.terminatedBy = input.actorName;
    session.terminationReason = input.reason.trim();
    if (exam) {
      session.totalMarksAwarded = computeObjectiveScore(exam, session.answers);
    }

    appendAuditLog(
      session.id,
      session.examId,
      input.actorId,
      input.actorName,
      input.action === 'FORCE_SUBMIT' ? 'SUPERVISOR_FORCE_SUBMIT' : 'SUPERVISOR_TERMINATED',
      `${input.action} by ${input.actorName}: ${input.reason.trim()}`
    );
    saveDb(db);

    return session;
  },

  reviewIncident(input: {
    incidentId: string;
    status: ExamIncidentStatus;
    reviewerNotes?: string;
    actorId: string;
    actorName: string;
  }) {
    if (!VALID_INCIDENT_REVIEW_STATUSES.has(input.status)) {
      throw new SecureExamHttpError(400, 'Invalid incident review status.');
    }

    const db = getDb();
    const incident = db.secureExamIncidents.find((i) => i.id === input.incidentId);
    if (!incident) {
      throw new SecureExamHttpError(404, 'Examination incident not found.');
    }

    const nowIso = new Date().toISOString();
    incident.status = input.status;
    incident.reviewedById = input.actorId;
    incident.reviewedByName = input.actorName;
    incident.reviewerNotes = input.reviewerNotes?.trim() || undefined;
    incident.reviewedAt = nowIso;
    incident.updatedAt = nowIso;

    appendAuditLog(
      incident.sessionId,
      incident.examId,
      input.actorId,
      input.actorName,
      'INCIDENT_REVIEWED',
      `Incident ${incident.id} marked ${input.status} by ${input.actorName}${
        incident.reviewerNotes ? ` (${incident.reviewerNotes})` : ''
      }.`
    );
    saveDb(db);

    return incident;
  },

  updateExamSecurityPolicy(input: {
    examId: string;
    policyPatch: Partial<ExamSecurityPolicy>;
    actorId: string;
    actorName: string;
  }) {
    const db = getDb();
    const exam = db.secureExamDefinitions.find((e) => e.id === input.examId);
    if (!exam) {
      throw new SecureExamHttpError(404, 'Examination not found.');
    }

    const updated: ExamSecurityPolicy = {
      ...exam.securityPolicy,
      ...input.policyPatch,
    };
    if (
      updated.requireSafeExamBrowser ||
      updated.restrictToManagedDevices
    ) {
      updated.securityLevel = 'LEVEL_2_LOCKED';
    } else if (input.policyPatch.securityLevel) {
      updated.securityLevel = input.policyPatch.securityLevel;
    }

    exam.securityPolicy = updated;
    exam.updatedAt = new Date().toISOString();

    appendAuditLog(
      undefined,
      exam.id,
      input.actorId,
      input.actorName,
      'SECURITY_POLICY_UPDATED',
      `Updated security config for ${exam.title} (${updated.securityLevel}).`
    );
    saveDb(db);

    return exam;
  },
};
