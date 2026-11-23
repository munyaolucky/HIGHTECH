import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after, beforeEach } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function installMemoryStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

installMemoryStorage();

const dbFilePath = path.join(process.cwd(), '.data', 'hitech-portal-db.json');
const hadExistingDbFile = fs.existsSync(dbFilePath);
const originalDbFileContents = hadExistingDbFile ? fs.readFileSync(dbFilePath, 'utf8') : null;

const { getDb, saveDb } = await import('../server/data/store.ts');
const { createSecureExamSeed } = await import('../server/modules/exams/secure/secureExam.seed.ts');
const { SecureExamHttpError, secureExamService } = await import(
  '../server/modules/exams/secure/secureExam.service.ts'
);

const { default: SecureExamLayout, formatExamCountdown } = await import(
  '../src/modules/student/exams/secure/SecureExamLayout.tsx'
);
const { default: PagesSecureExamLayout } = await import(
  '../src/modules/student/pages/exams/SecureExamLayout.tsx'
);
const { useExamSecurity } = await import(
  '../src/modules/student/hooks/useExamSecurity.ts'
);
const { default: SecureExamPage } = await import(
  '../src/modules/student/exams/secure/SecureExamPage.tsx'
);
const { default: OnlineExamsPage } = await import(
  '../src/modules/student/pages/exams/OnlineExamsPage.tsx'
);
const { default: SecureExamSupervisorPanel } = await import(
  '../src/modules/examination/SecureExamSupervisorPanel.tsx'
);
const { default: ExaminationSupervisorDashboard } = await import(
  '../src/modules/examination/ExaminationSupervisorDashboard.tsx'
);
const { default: IncidentReviewModal } = await import(
  '../src/modules/examination/components/IncidentReviewModal.tsx'
);
const {
  buildFallbackCatalog,
  buildInstructionSessionFromCatalog,
} = await import('../src/modules/student/exams/secure/secureExamData.ts');
const { mergeMessagesIdempotently, createSeededSupervisorPreviewMessages } = await import(
  '../src/modules/student/exams/secure/useExamMessaging.ts'
);
const { attachExamMessagingWebSocket } = await import(
  '../server/modules/exams/secure/examMessagingWs.ts'
);
const { createSessionToken, SESSION_COOKIE_NAME } = await import(
  '../server/middleware/auth.ts'
);
const { STAFF_PERMISSIONS } = await import(
  '../server/modules/staff/staff.permissions.ts'
);
const http = await import('node:http');
const { WebSocket } = await import('ws');

function resetSecureExamSlice(): void {
  const db = getDb();
  const fresh = createSecureExamSeed();
  db.secureExamDefinitions = fresh.secureExamDefinitions;
  db.secureExamSessions = fresh.secureExamSessions;
  db.secureExamEvents = fresh.secureExamEvents;
  db.secureExamIncidents = fresh.secureExamIncidents;
  db.secureExamAuditLogs = fresh.secureExamAuditLogs;
  db.secureExamMessages = fresh.secureExamMessages;
  saveDb(db);
}

beforeEach(() => {
  globalThis.localStorage.clear();
  resetSecureExamSlice();
});

after(() => {
  if (hadExistingDbFile && originalDbFileContents !== null) {
    fs.writeFileSync(dbFilePath, originalDbFileContents, 'utf8');
  } else if (!hadExistingDbFile && fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
  }
});

function assertNoAntiPatterns(html: string, context: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${context}: must not contain animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${context}: must not contain inline style attributes`);
}

test('secureExamService enforces server deadlines, student ownership, and invalid question validation', () => {
  const available = secureExamService.listAvailableExamsForStudent('stu-001');
  assert.ok(available.length >= 2);
  assert.equal(available[0].title, 'Computer Networking CAT');

  const nowMs = Date.now();
  const session = secureExamService.startExamSession({
    examId: 'sec-exam-net-cat',
    studentId: 'stu-001',
    studentRegNo: 'HCA/STU/2026/001',
    studentName: 'Amina Wanjiku',
    nowMs,
  });

  assert.equal(session.status, 'active');
  assert.equal(session.exam.questions.length, 5);
  assert.equal(
    new Date(session.expiresAt).getTime() - new Date(session.startedAt).getTime(),
    60 * 60 * 1000
  );

  // Starting again while active resumes the same authoritative session
  const resumed = secureExamService.startExamSession({
    examId: 'sec-exam-net-cat',
    studentId: 'stu-001',
    studentRegNo: 'HCA/STU/2026/001',
    studentName: 'Amina Wanjiku',
    nowMs: nowMs + 5000,
  });
  assert.equal(resumed.id, session.id);

  // Other student cannot read or save into stu-001's session
  assert.throws(
    () => secureExamService.getStudentSession(session.id, 'stu-other'),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 404
  );
  assert.throws(
    () =>
      secureExamService.saveSessionAnswers(session.id, 'stu-other', [
        { questionId: 'net-q2', value: 'opt-c' },
      ]),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 404
  );

  // Unknown question ID is rejected
  assert.throws(
    () =>
      secureExamService.saveSessionAnswers(session.id, 'stu-001', [
        { questionId: 'non-existent-q', value: 'hacked' },
      ]),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 400
  );

  // Valid answers save cleanly
  const saved = secureExamService.saveSessionAnswers(session.id, 'stu-001', [
    { questionId: 'net-q2', value: 'opt-c' },
    { questionId: 'net-q1', value: '1. Packet forwarding, 2. Path selection, 3. Subnet isolation.' },
  ]);
  assert.equal(saved.saved, true);
  assert.equal(saved.answeredCount, 2);

  // After deadline expires, saving fails with 410 and marks session EXPIRED while keeping answers
  assert.throws(
    () =>
      secureExamService.saveSessionAnswers(
        session.id,
        'stu-001',
        [{ questionId: 'net-q4', value: 'opt-true' }],
        nowMs + 61 * 60 * 1000
      ),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 410
  );

  // Idempotent submission returns finalized session without error
  const submittedFirst = secureExamService.submitSession(session.id, 'stu-001');
  const submittedSecond = secureExamService.submitSession(session.id, 'stu-001');
  assert.equal(submittedFirst.id, submittedSecond.id);
  assert.equal(submittedSecond.answers.length, 2);
});

test('secureExamService applies graduated policy without disqualifying on first tab switch', () => {
  const session = secureExamService.startExamSession({
    examId: 'sec-exam-csc301',
    studentId: 'stu-002',
    studentRegNo: 'HCA/STU/2026/002',
    studentName: 'Mercy Nyambura',
  });

  // 1st tab switch -> warning only, no incident created
  const ev1 = secureExamService.recordSecurityEvent(session.id, 'stu-002', {
    type: 'TAB_HIDDEN',
    occurredAt: new Date().toISOString(),
  });
  assert.equal(ev1.responseTriggered, 'WARNING');
  assert.ok(ev1.warningMessage);
  assert.equal(
    getDb().secureExamIncidents.some((i) => i.sessionId === session.id),
    false
  );

  // Session remains active
  assert.equal(secureExamService.getStudentSession(session.id, 'stu-002').serverStatus, 'ACTIVE');

  // 2nd tab switch -> WARNING_AND_LOG + opens incident
  const ev2 = secureExamService.recordSecurityEvent(session.id, 'stu-002', {
    type: 'TAB_HIDDEN',
    occurredAt: new Date().toISOString(),
  });
  assert.equal(ev2.responseTriggered, 'WARNING_AND_LOG');
  const incident = getDb().secureExamIncidents.find((i) => i.sessionId === session.id);
  assert.ok(incident);
  assert.equal(incident.status, 'OPEN');
  assert.equal(incident.severity, 'MEDIUM');

  // 3rd tab switch -> NOTIFY_SUPERVISOR + escalates incident to HIGH
  const ev3 = secureExamService.recordSecurityEvent(session.id, 'stu-002', {
    type: 'TAB_HIDDEN',
    occurredAt: new Date().toISOString(),
  });
  assert.equal(ev3.responseTriggered, 'NOTIFY_SUPERVISOR');
  assert.equal(incident.severity, 'HIGH');

  // Copy attempt -> BLOCK_AND_LOG
  const copyEv = secureExamService.recordSecurityEvent(session.id, 'stu-002', {
    type: 'COPY_ATTEMPT',
    occurredAt: new Date().toISOString(),
  });
  assert.equal(copyEv.responseTriggered, 'BLOCK_AND_LOG');
});

test('supervisor overview, inspection, intervention, incident review, and 15-toggle policy config work end-to-end', () => {
  const overview = secureExamService.getSupervisorOverview();
  assert.ok(overview.sessions.some((s) => s.id === 'EXAM-SESSION-001'));
  assert.ok(overview.incidents.some((i) => i.id === 'INC-2026-001'));
  assert.ok(overview.securityEvents.length >= 3);
  assert.equal(overview.securityEvents[0].studentName, 'Brian Kipkorir');
  assert.equal(overview.securityEvents[0].examTitle, 'Computer Networking CAT');

  const inspected = secureExamService.inspectSupervisorSession('EXAM-SESSION-001');
  assert.equal(inspected.events.length, 3);
  assert.equal(inspected.events[0].eventType, 'TAB_HIDDEN');

  // Reject missing intervention reason
  assert.throws(
    () =>
      secureExamService.supervisorInterveneSession({
        sessionId: 'EXAM-SESSION-001',
        action: 'TERMINATE',
        reason: 'bad',
        actorId: 'staff-01',
        actorName: 'Dr. Kiprop Chemweno',
      }),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 400
  );

  const terminated = secureExamService.supervisorInterveneSession({
    sessionId: 'EXAM-SESSION-001',
    action: 'TERMINATE',
    reason: 'Confirmed external device usage in Exam Centre A-1.',
    actorId: 'staff-01',
    actorName: 'Dr. Kiprop Chemweno',
  });
  assert.equal(terminated.status, 'TERMINATED');

  const reviewed = secureExamService.reviewIncident({
    incidentId: 'INC-2026-001',
    status: 'CONFIRMED',
    reviewerNotes: 'Invigilator report verified.',
    actorId: 'staff-01',
    actorName: 'Dr. Kiprop Chemweno',
  });
  assert.equal(reviewed.status, 'CONFIRMED');
  assert.equal(reviewed.reviewerNotes, 'Invigilator report verified.');

  const updatedExam = secureExamService.updateExamSecurityPolicy({
    examId: 'sec-exam-net-cat',
    policyPatch: {
      requireSafeExamBrowser: true,
      restrictToManagedDevices: true,
      tabSwitchSupervisorAt: 4,
    },
    actorId: 'staff-01',
    actorName: 'Dr. Kiprop Chemweno',
  });
  assert.equal(updatedExam.securityPolicy.securityLevel, 'LEVEL_2_LOCKED');
  assert.equal(updatedExam.securityPolicy.requireSafeExamBrowser, true);
  assert.equal(updatedExam.securityPolicy.tabSwitchSupervisorAt, 4);
});

test('SSR rendering of isolated SecureExamLayout, SecureExamPage stages, OnlineExamsPage, and Supervisor Panel has clean markup', () => {
  assert.equal(formatExamCountdown(3522), '00:58:42');

  assert.equal(typeof useExamSecurity, 'function');
  assert.equal(SecureExamLayout, PagesSecureExamLayout);

  const layoutHtml = renderToStaticMarkup(
    React.createElement(PagesSecureExamLayout, {
      title: 'Computer Networking CAT',
      subject: 'ICT 204',
      candidateName: 'Amina Wanjiku',
      candidateRegNo: 'HCA/STU/2026/001',
      durationMinutes: 60,
      remainingSeconds: 3522,
      saveState: 'saved',
      isFullscreen: false,
      onReenterFullscreen: () => {},
      onSubmit: () => {},
      children: React.createElement('div', null, 'Question content'),
    })
  );
  assert.ok(layoutHtml.includes('HI-TECH COLLEGE'));
  assert.ok(layoutHtml.includes('SECURE EXAM MODE'));
  assert.ok(layoutHtml.includes('data-secure-exam-shell="locked"'));
  assert.ok(layoutHtml.includes('Re-enter Fullscreen'));
  assert.ok(layoutHtml.includes('00:58:42'));
  assert.ok(layoutHtml.includes('All answers saved'));
  assert.equal(layoutHtml.includes('Digital Library'), false);
  assertNoAntiPatterns(layoutHtml, 'SecureExamLayout');

  const catalog = buildFallbackCatalog();
  const instructionSession = buildInstructionSessionFromCatalog(
    catalog[0],
    { name: 'Amina Wanjiku', regNo: 'HCA/STU/2026/001' },
    true
  );

  const instructionsHtml = renderToStaticMarkup(
    React.createElement(SecureExamPage, {
      initialSession: instructionSession,
      onExitPortal: () => {},
    })
  );
  assert.ok(instructionsHtml.includes('Enter secure examination'));
  assert.ok(instructionsHtml.includes('Level 1 — Web Secure Mode'));
  assertNoAntiPatterns(instructionsHtml, 'SecureExamPage instructions');

  const activeHtml = renderToStaticMarkup(
    React.createElement(SecureExamPage, {
      initialSession: {
        ...instructionSession,
        status: 'active',
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      onExitPortal: () => {},
    })
  );
  assert.ok(activeHtml.includes('Question navigator'));
  assert.ok(activeHtml.includes('Explain three core functions of a router'));
  assert.ok(activeHtml.includes('Review and submit'));
  assertNoAntiPatterns(activeHtml, 'SecureExamPage active');

  const onlineHtml = renderToStaticMarkup(
    React.createElement(OnlineExamsPage, {
      onNavigate: () => {},
      onNotify: () => {},
      onRefresh: () => {},
    })
  );
  assert.ok(onlineHtml.includes('Launch Secure Exam Mode'));
  assert.ok(onlineHtml.includes('Computer Networking CAT'));
  assertNoAntiPatterns(onlineHtml, 'OnlineExamsPage');

  const supervisorHtml = renderToStaticMarkup(
    React.createElement(SecureExamSupervisorPanel, {
      onNotify: () => {},
    })
  );
  assert.ok(supervisorHtml.includes('Live Candidate Sessions'));
  assert.ok(supervisorHtml.includes('Security Incidents Review Queue'));
  assert.ok(supervisorHtml.includes('Require Safe Exam Browser'));
  assert.ok(supervisorHtml.includes('Block prohibited keyboard shortcuts'));
  assertNoAntiPatterns(supervisorHtml, 'SecureExamSupervisorPanel');

  const dashboardHtml = renderToStaticMarkup(
    React.createElement(ExaminationSupervisorDashboard, {
      onNotify: () => {},
    })
  );
  assert.ok(dashboardHtml.includes('Active Exam Sessions'));
  assert.ok(dashboardHtml.includes('Connection Status'));
  assert.ok(dashboardHtml.includes('Dedicated Security Log Viewer'));
  assert.ok(dashboardHtml.includes('Incident Reports Queue'));
  assert.ok(dashboardHtml.includes('Brian Kipkorir'));
  assertNoAntiPatterns(dashboardHtml, 'ExaminationSupervisorDashboard');

  const closedModalHtml = renderToStaticMarkup(
    React.createElement(IncidentReviewModal, {
      isOpen: false,
      incident: null,
      onClose: () => {},
    })
  );
  assert.equal(closedModalHtml, '');

  const overviewForModal = secureExamService.getSupervisorOverview();
  const sampleIncident = overviewForModal.incidents[0];
  const sampleEvents = overviewForModal.securityEvents.filter(
    (ev) => ev.sessionId === sampleIncident.sessionId
  );
  const openModalHtml = renderToStaticMarkup(
    React.createElement(IncidentReviewModal, {
      isOpen: true,
      incident: sampleIncident,
      events: sampleEvents,
      serverConnected: false,
      onClose: () => {},
    })
  );
  assert.ok(openModalHtml.includes('Tab Hidden'));
  assert.ok(openModalHtml.includes('Fullscreen Exit'));
  assert.ok(openModalHtml.includes('Dismiss'));
  assert.ok(openModalHtml.includes('Under Review'));
  assert.ok(openModalHtml.includes('Confirmed'));
  assertNoAntiPatterns(openModalHtml, 'IncidentReviewModal');

  // Verify SecureExamLayout messaging UI (Ask Supervisor trigger + unread supervisor instruction banner)
  const seededPreviewMsgs = createSeededSupervisorPreviewMessages();
  const layoutMessagingHtml = renderToStaticMarkup(
    React.createElement(PagesSecureExamLayout, {
      title: 'Computer Networking CAT',
      subject: 'ICT 204',
      candidateName: 'Brian Kipkorir',
      candidateRegNo: 'HCA/STU/2026/014',
      durationMinutes: 60,
      remainingSeconds: 1800,
      saveState: 'saved',
      messages: seededPreviewMsgs,
      messagingConnection: 'connected',
      onSendHelpMessage: () => {},
      onMarkMessagesRead: () => {},
      onSubmit: () => {},
      children: React.createElement('div', null, 'Question workspace'),
    })
  );
  assert.ok(layoutMessagingHtml.includes('Ask Supervisor'));
  assert.ok(layoutMessagingHtml.includes('Supervisor Instruction'));
  assert.ok(layoutMessagingHtml.includes('Click Re-enter Fullscreen and continue your assessment'));
  assertNoAntiPatterns(layoutMessagingHtml, 'SecureExamLayout messaging');

  // Verify ExaminationSupervisorDashboard renders messaging interface
  assert.ok(dashboardHtml.includes('Candidate Help Requests &amp; Direct Instructions'));
  assert.ok(dashboardHtml.includes('Help Requests'));
  assert.ok(dashboardHtml.includes('Broadcast to Exam Cohort'));
  assert.ok(dashboardHtml.includes('Send Instruction'));
});

test('secureExamService enforces messaging ownership, cohort broadcast, read state, and idempotent merging', () => {
  const session = secureExamService.startExamSession({
    examId: 'sec-exam-net-cat',
    studentId: 'stu-chat-1',
    studentRegNo: 'HCA/STU/2026/099',
    studentName: 'Grace Muthoni',
  });

  // Blank message is rejected
  assert.throws(
    () =>
      secureExamService.sendStudentHelpMessage({
        sessionId: session.id,
        studentId: 'stu-chat-1',
        body: '   ',
      }),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 400
  );

  // Another student cannot read or send in stu-chat-1's session
  assert.throws(
    () => secureExamService.listSessionMessages(session.id, 'stu-other'),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 404
  );
  assert.throws(
    () =>
      secureExamService.sendStudentHelpMessage({
        sessionId: session.id,
        studentId: 'stu-other',
        body: 'Unauthorized help request',
      }),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 404
  );

  const helpMsg = secureExamService.sendStudentHelpMessage({
    sessionId: session.id,
    studentId: 'stu-chat-1',
    priority: 'URGENT',
    body: 'Diagram in Question 1 is not visible on screen.',
  });
  assert.equal(helpMsg.senderRole, 'STUDENT');
  assert.equal(helpMsg.priority, 'URGENT');
  assert.equal(helpMsg.readBySupervisor, false);

  const supReply = secureExamService.sendSupervisorMessage({
    sessionId: session.id,
    actorId: 'usr-exam-01',
    actorName: 'Dr. Kiprop Chemweno',
    priority: 'URGENT',
    body: 'Refresh once safely — your answers and timer stay intact.',
  });
  assert.equal(supReply.senderRole, 'SUPERVISOR');
  assert.equal(supReply.readByStudent, false);

  const broadcast = secureExamService.broadcastSupervisorInstruction({
    examId: 'sec-exam-net-cat',
    actorId: 'usr-exam-01',
    actorName: 'Dr. Kiprop Chemweno',
    priority: 'NORMAL',
    body: 'All candidates: Question 3 asks for three distinct TCP protocols.',
  });
  assert.ok(broadcast.length >= 2);

  const readRes = secureExamService.markSessionMessagesRead({
    sessionId: session.id,
    readerRole: 'STUDENT',
    studentId: 'stu-chat-1',
  });
  assert.equal(readRes.updatedCount, 2);

  // Idempotent merge prevents duplicates
  const thread = secureExamService.listSessionMessages(session.id, 'stu-chat-1');
  const merged = mergeMessagesIdempotently(thread, [thread[0], helpMsg]);
  assert.equal(merged.length, thread.length);
});

test('examMessagingWs enforces cookie auth, room isolation, and real-time message delivery over WebSocket', async () => {
  const server = http.createServer((_req, res) => {
    res.statusCode = 404;
    res.end();
  });
  attachExamMessagingWebSocket(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  // Pick a real staff account from store with EXAMINATIONS_MANAGE permission
  const db = getDb();
  const supervisorStaff =
    db.staffAccounts.find((s) => s.permissions.includes(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE)) ??
    db.staffAccounts[0];
  assert.ok(supervisorStaff);

  const staffToken = createSessionToken({
    userId: supervisorStaff.id,
    role: supervisorStaff.role,
    iat: Date.now(),
  });
  const staffCookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(staffToken)}`;

  const studentSession = secureExamService.startExamSession({
    examId: 'sec-exam-net-cat',
    studentId: supervisorStaff.id,
    studentRegNo: supervisorStaff.employeeNumber,
    studentName: supervisorStaff.fullName,
  });

  try {
    // Unauthenticated WebSocket upgrade must be rejected
    await assert.rejects(
      () =>
        new Promise<void>((resolve, reject) => {
          const unauthWs = new WebSocket(`ws://127.0.0.1:${port}/ws/exam-messages?role=supervisor`);
          unauthWs.on('open', () => {
            unauthWs.close();
            resolve();
          });
          unauthWs.on('error', (err) => reject(err));
        })
    );

    const supWs = new WebSocket(`ws://127.0.0.1:${port}/ws/exam-messages?role=supervisor`, {
      headers: { Cookie: staffCookie },
    });
    const stuWs = new WebSocket(
      `ws://127.0.0.1:${port}/ws/exam-messages?role=student&sessionId=${encodeURIComponent(
        studentSession.id
      )}`,
      { headers: { Cookie: staffCookie } }
    );

    const supReceived: unknown[] = [];
    const stuReceived: unknown[] = [];

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        supWs.on('message', (raw) => {
          supReceived.push(JSON.parse(raw.toString('utf8')));
          if (supReceived.length === 1) resolve();
        });
        supWs.on('error', reject);
      }),
      new Promise<void>((resolve, reject) => {
        stuWs.on('message', (raw) => {
          stuReceived.push(JSON.parse(raw.toString('utf8')));
          if (stuReceived.length === 1) resolve();
        });
        stuWs.on('error', reject);
      }),
    ]);

    assert.equal((supReceived[0] as { type: string }).type, 'exam:messages:init');
    assert.equal((stuReceived[0] as { type: string }).type, 'exam:messages:init');

    // Supervisor sends direct instruction via WebSocket -> student receives immediately
    const receivedByStudentPromise = new Promise<{
      type: string;
      message: { body: string; senderRole: string };
    }>((resolve) => {
      stuWs.on('message', (raw) => {
        const parsed = JSON.parse(raw.toString('utf8')) as {
          type: string;
          message: { body: string; senderRole: string };
        };
        if (parsed.type === 'exam:message:created') resolve(parsed);
      });
    });

    supWs.send(
      JSON.stringify({
        type: 'exam:message:send',
        sessionId: studentSession.id,
        priority: 'URGENT',
        body: 'Proceed directly to Question 2 while Question 1 image refreshes.',
      })
    );

    const delivered = await receivedByStudentPromise;
    assert.equal(delivered.type, 'exam:message:created');
    assert.equal(delivered.message.senderRole, 'SUPERVISOR');
    assert.ok(delivered.message.body.includes('Proceed directly to Question 2'));

    supWs.terminate();
    stuWs.terminate();
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Phase 10B supervisor time extension, session restoration, reports, SSE pub/sub, and dashboard UI work cleanly', async () => {
  // Reject invalid bounds or short justification on extendSessionTime
  assert.throws(
    () =>
      secureExamService.extendSessionTime({
        sessionId: 'EXAM-SESSION-001',
        additionalSeconds: 30,
        reason: 'Valid reason',
        actorId: 'staff-01',
        actorName: 'Dr. Kiprop Chemweno',
      }),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 400
  );

  assert.throws(
    () =>
      secureExamService.extendSessionTime({
        sessionId: 'EXAM-SESSION-001',
        additionalSeconds: 600,
        reason: 'no',
        actorId: 'staff-01',
        actorName: 'Dr. Kiprop Chemweno',
      }),
    (err: unknown) => err instanceof SecureExamHttpError && err.statusCode === 400
  );

  const beforeExpiryMs = new Date(
    getDb().secureExamSessions.find((s) => s.id === 'EXAM-SESSION-001')!.expiresAt
  ).getTime();

  const extended = secureExamService.extendSessionTime({
    sessionId: 'EXAM-SESSION-001',
    additionalSeconds: 900,
    reason: 'Approved 15-minute accommodation after lab power switchover.',
    actorId: 'staff-01',
    actorName: 'Dr. Kiprop Chemweno',
  });
  assert.ok(new Date(extended.expiresAt).getTime() >= beforeExpiryMs + 900 * 1000);
  assert.equal(extended.timeAdjustments?.length, 1);

  // Simulate expired session and restore it
  const db = getDb();
  const target = db.secureExamSessions.find((s) => s.id === 'EXAM-SESSION-001')!;
  target.status = 'EXPIRED';
  target.expiresAt = new Date(Date.now() - 60_000).toISOString();
  saveDb(db);

  const restored = secureExamService.restoreSession({
    sessionId: 'EXAM-SESSION-001',
    reason: 'Campus Wi-Fi drop verified by invigilator.',
    graceSeconds: 600,
    actorId: 'staff-01',
    actorName: 'Dr. Kiprop Chemweno',
  });
  assert.equal(restored.status, 'ACTIVE');
  assert.ok(new Date(restored.expiresAt).getTime() > Date.now());

  const reports = secureExamService.getExamReports('sec-exam-net-cat');
  assert.ok(reports.attendance.length >= 1);
  assert.ok(reports.attendance.some((a) => a.sessionId === 'EXAM-SESSION-001'));
  assert.ok(reports.auditLogs.some((a) => a.action === 'SUPERVISOR_EXTEND_TIME'));

  // SSE examEventsStream pub/sub check
  const { examEventsStream } = await import('../server/modules/exams/secure/examEventsStream.ts');
  const chunks: string[] = [];
  const fakeRes = {
    setHeader() {},
    flushHeaders() {},
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
  };
  const unsubscribe = examEventsStream.subscribe(fakeRes as never, 'sec-exam-net-cat');
  examEventsStream.publish('supervisor.action', {
    examId: 'sec-exam-net-cat',
    sessionId: 'EXAM-SESSION-001',
    action: 'EXTEND_TIME',
  });
  examEventsStream.publish('supervisor.action', {
    examId: 'other-exam',
    sessionId: 'EXAM-OTHER',
    action: 'EXTEND_TIME',
  });
  unsubscribe();
  assert.equal(chunks.some((c) => c.includes('event: connected')), true);
  assert.equal(chunks.some((c) => c.includes('EXAM-SESSION-001')), true);
  assert.equal(chunks.some((c) => c.includes('EXAM-OTHER')), false);

  // Dashboard SSR renders Phase 10B controls cleanly
  const dashboardHtml = renderToStaticMarkup(
    React.createElement(ExaminationSupervisorDashboard, { onNotify: () => {} })
  );
  assertNoAntiPatterns(dashboardHtml, 'ExaminationSupervisorDashboard Phase 10B');
  assert.ok(dashboardHtml.includes('Inspect / Time'));
  assert.ok(dashboardHtml.includes('Attendance &amp; Security Reports (CSV)'));
  assert.ok(dashboardHtml.includes('Supervisor Audit Trail'));
});


