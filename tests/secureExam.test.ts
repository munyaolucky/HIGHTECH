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
const { default: SecureExamPage } = await import(
  '../src/modules/student/exams/secure/SecureExamPage.tsx'
);
const { default: OnlineExamsPage } = await import(
  '../src/modules/student/pages/exams/OnlineExamsPage.tsx'
);
const { default: SecureExamSupervisorPanel } = await import(
  '../src/modules/examination/SecureExamSupervisorPanel.tsx'
);
const {
  buildFallbackCatalog,
  buildInstructionSessionFromCatalog,
} = await import('../src/modules/student/exams/secure/secureExamData.ts');

function resetSecureExamSlice(): void {
  const db = getDb();
  const fresh = createSecureExamSeed();
  db.secureExamDefinitions = fresh.secureExamDefinitions;
  db.secureExamSessions = fresh.secureExamSessions;
  db.secureExamEvents = fresh.secureExamEvents;
  db.secureExamIncidents = fresh.secureExamIncidents;
  db.secureExamAuditLogs = fresh.secureExamAuditLogs;
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

  const layoutHtml = renderToStaticMarkup(
    React.createElement(
      SecureExamLayout,
      {
        title: 'Computer Networking CAT',
        subject: 'ICT 204',
        candidateName: 'Amina Wanjiku',
        candidateRegNo: 'HCA/STU/2026/001',
        durationMinutes: 60,
        remainingSeconds: 3522,
        saveState: 'saved',
        onSubmit: () => {},
      },
      React.createElement('div', null, 'Question content')
    )
  );
  assert.ok(layoutHtml.includes('HI-TECH COLLEGE'));
  assert.ok(layoutHtml.includes('SECURE EXAM MODE'));
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
});
