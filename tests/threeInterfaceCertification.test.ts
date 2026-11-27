import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import test, { after, beforeEach } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) {
      return { format: 'module', shortCircuit: true, source: 'export default {};' };
    }
    if (/\.(jpg|jpeg|png|svg|webp|gif)$/i.test(url)) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export default "/stub-asset.jpg";',
      };
    }
    return nextLoad(url, context);
  },
});

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
const { createCertificationSeed } = await import(
  '../server/modules/certification/certification.seed.ts'
);
const { CertificationHttpError, certificationService } = await import(
  '../server/modules/certification/certification.service.ts'
);
const { ThemeProvider } = await import('../src/context/ThemeContext.tsx');
const { resolveStudentSectionFromPath, STUDENT_SECTION_PATHS } = await import(
  '../src/services/studentPortalService.ts'
);
const { default: AdminCertificationWorkspace } = await import(
  '../src/modules/certification/AdminCertificationWorkspace.tsx'
);
const { default: InvigilatorPortalWorkspace } = await import(
  '../src/modules/examination/InvigilatorPortalWorkspace.tsx'
);
const { default: CandidateCertificationPortal } = await import(
  '../src/modules/student/pages/exams/CandidateCertificationPortal.tsx'
);
const { default: StudentSidebar } = await import(
  '../src/modules/student/components/StudentSidebar.tsx'
);
const { default: StudentSubPages } = await import(
  '../src/modules/student/components/StudentSubPages.tsx'
);

const adminActor = { id: 'usr-admin-001', name: 'Grace Nyambura', role: 'ADMIN' };
const financeMaker = { id: 'usr-fin-001', name: 'Faith Mutua', role: 'FINANCE_OFFICER' };
const financeChecker = { id: 'usr-fin-002', name: 'Daniel Kipchoge', role: 'FINANCE_OFFICER' };
const lecturerAuthor = { id: 'usr-lect-001', name: 'Dr. Peter Otieno', role: 'LECTURER' };
const examModerator = { id: 'usr-exam-001', name: 'James Mwangi', role: 'EXAMINATIONS_OFFICER' };
const invigilatorActor = { id: 'usr-inv-001', name: 'Beatrice Chebet', role: 'EXAMINATIONS_OFFICER' };

function assertCleanMarkup(html: string, context: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${context}: must not contain animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${context}: must not contain inline style attributes`);
  assert.equal(html.includes('border-l-4'), false, `${context}: must not contain border-l-4`);
}

beforeEach(() => {
  globalThis.localStorage.clear();
  const db = getDb();
  db.certificationState = createCertificationSeed();
  saveDb(db);
});

after(() => {
  if (hadExistingDbFile && originalDbFileContents !== null) {
    fs.writeFileSync(dbFilePath, originalDbFileContents, 'utf8');
  } else if (!hadExistingDbFile && fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
  }
});

test('Examination Credit Wallet enforces atomic reserve, idempotent commit, refunds, low-credit alerts, and maker-checker adjustments', () => {
  const initialOverview = certificationService.listCreditOverview();
  assert.ok(initialOverview.alerts.some((a) => a.studentRegNo === 'HCA/STU/2026/014'));

  // Import a zero-credit candidate via official API and verify reserve is blocked (409)
  certificationService.enrollOrImportCandidates(
    {
      candidates: [
        {
          studentRegNo: 'HCA/STU/2026/099',
          fullName: 'Samuel Kiprop',
          programmeId: 'prog-icdl-001',
          initialCredits: 0,
        },
      ],
    },
    adminActor
  );

  assert.throws(
    () =>
      certificationService.reserveCredits(
        {
          studentRegNo: 'HCA/STU/2026/099',
          examId: 'exm-icdl-m04',
          examSessionId: 'EXM-2026-001',
          creditsRequired: 1,
          idempotencyKey: 'HCA/STU/2026/099:EXM-2026-001',
        },
        adminActor
      ),
    (err: unknown) => err instanceof CertificationHttpError && err.statusCode === 409
  );

  // Allocate +2 credits and perform idempotent reserve & commit
  const alloc = certificationService.allocateCredits(
    { studentRegNo: 'HCA/STU/2026/099', credits: 2, reason: 'Term 3 exam credit allocation' },
    financeMaker
  );
  assert.equal(alloc.wallet.availableCredits, 2);

  const key = 'HCA/STU/2026/099:EXM-TEST-101';
  const res1 = certificationService.reserveCredits(
    {
      studentRegNo: 'HCA/STU/2026/099',
      examId: 'exm-icdl-m04',
      examSessionId: 'EXM-TEST-101',
      creditsRequired: 1,
      idempotencyKey: key,
    },
    adminActor
  );
  assert.equal(res1.deduplicated, false);
  assert.equal(res1.wallet.availableCredits, 1);
  assert.equal(res1.wallet.reservedCredits, 1);

  const commit1 = certificationService.commitReservedCredits({ idempotencyKey: key }, adminActor);
  assert.equal(commit1.deduplicated, false);
  assert.equal(commit1.wallet.availableCredits, 1);
  assert.equal(commit1.wallet.reservedCredits, 0);

  // Re-calling commit or reserve with same idempotencyKey never double-charges
  const commit2 = certificationService.commitReservedCredits({ idempotencyKey: key }, adminActor);
  assert.equal(commit2.deduplicated, true);
  assert.equal(commit2.wallet.availableCredits, 1);

  const res2 = certificationService.reserveCredits(
    {
      studentRegNo: 'HCA/STU/2026/099',
      examId: 'exm-icdl-m04',
      examSessionId: 'EXM-TEST-101',
      creditsRequired: 1,
      idempotencyKey: key,
    },
    adminActor
  );
  assert.equal(res2.deduplicated, true);
  assert.equal(res2.wallet.availableCredits, 1);

  // Compensating refund restores credit cleanly
  const refunded = certificationService.refundCredits(
    {
      studentRegNo: 'HCA/STU/2026/099',
      credits: 1,
      reason: 'Power outage interruption during lab exam',
      reservationId: res1.reservation.id,
    },
    adminActor
  );
  assert.equal(refunded.wallet.availableCredits, 2);
  assert.equal(refunded.wallet.refundedCredits, 1);

  // Negative adjustment exceeding balance is rejected (400)
  assert.throws(
    () =>
      certificationService.requestCreditAdjustment(
        { studentRegNo: 'HCA/STU/2026/099', creditsDelta: -10, reason: 'Over-deduction test' },
        financeMaker
      ),
    (err: unknown) => err instanceof CertificationHttpError && err.statusCode === 400
  );

  // Maker-checker blocks self-approval by non-Admin/Principal (403) and accepts second officer
  const pendingTx = certificationService.requestCreditAdjustment(
    { studentRegNo: 'HCA/STU/2026/099', creditsDelta: -1, reason: 'Duplicate voucher reversal' },
    financeMaker
  );
  assert.equal(pendingTx.approvalStatus, 'PENDING_APPROVAL');

  assert.throws(
    () => certificationService.approveCreditAdjustment(pendingTx.id, 'APPROVED', financeMaker),
    (err: unknown) => err instanceof CertificationHttpError && err.statusCode === 403
  );

  const approved = certificationService.approveCreditAdjustment(
    pendingTx.id,
    'APPROVED',
    financeChecker
  );
  assert.equal(approved.transaction.approvalStatus, 'COMPLETED');
  assert.equal(approved.wallet.availableCredits, 1);
});

test('Progression Engine blocks premature certificate issuance and verifies QR certificate for eligible candidates', () => {
  // HCA/STU/2026/001 has incomplete modules — certificate issuance must be blocked (400)
  assert.throws(
    () =>
      certificationService.issueCertificate(
        { studentRegNo: 'HCA/STU/2026/001', programmeId: 'prog-icdl-001' },
        adminActor
      ),
    (err: unknown) => err instanceof CertificationHttpError && err.statusCode === 400
  );

  // HCA/STU/2026/025 has completed all required ICDL modules -> eligible / certified
  const db = getDb();
  const existingCertIdx = db.certificationState.certificates.findIndex(
    (c) => c.studentRegNo === 'HCA/STU/2026/025'
  );
  if (existingCertIdx >= 0) {
    db.certificationState.certificates.splice(existingCertIdx, 1);
  }
  const cert = certificationService.issueCertificate(
    { studentRegNo: 'HCA/STU/2026/025', programmeId: 'prog-icdl-001' },
    adminActor
  );
  assert.match(cert.serialNumber, /^HCA-CERT-2026-\d{4}$/);
  assert.equal(cert.status, 'ISSUED');

  const verified = certificationService.verifyCertificatePublic(cert.serialNumber);
  assert.equal(verified.verified, true);
  assert.equal(verified.studentRegNo, 'HCA/STU/2026/025');

  const prog = certificationService
    .listProgressions()
    .find((p) => p.studentRegNo === 'HCA/STU/2026/025');
  assert.equal(prog?.stage, 'CERTIFIED');
});

test('Question Bank immutable versioning, answer-key stripping, paper total marks validation, and AI moderation gates', async () => {
  const approvedQ = certificationService
    .listQuestions({ status: 'APPROVED' })
    .find((q) => 'correctAnswerKey' in q) as any;
  assert.ok(approvedQ, 'Expected at least one approved question in seed');
  const originalVersion = approvedQ.version;

  // Editing an APPROVED question creates a new version snapshot and resets to DRAFT
  const edited = certificationService.editQuestion(
    approvedQ.id,
    { prompt: `${approvedQ.prompt} [Revised]`, changeNote: 'Updated wording for 2026 syllabus' },
    lecturerAuthor
  );
  assert.equal(edited.version, originalVersion + 1);
  assert.equal(edited.status, 'DRAFT');
  assert.equal(edited.versions.length, originalVersion + 1);

  // Stripping answer keys removes correctAnswerKey for candidates
  const stripped = certificationService.listQuestions({ stripAnswerKey: true });
  assert.ok(stripped.length > 0);
  for (const item of stripped) {
    assert.equal('correctAnswerKey' in item, false, 'Candidate question view must strip answer keys');
  }

  // AI draft questions strictly start as DRAFT
  const aiDrafts = await certificationService.generateAiDraftQuestions(
    {
      programmeId: 'prog-icdl-001',
      moduleCode: 'ICDL-M04',
      topic: 'Pivot Tables',
      count: 2,
    },
    lecturerAuthor
  );
  assert.equal(aiDrafts.requiresHumanReview, true);
  assert.equal(aiDrafts.createdCount, 2);
  for (const q of aiDrafts.questions) {
    assert.equal(q.status, 'DRAFT');
    assert.equal(q.aiAssistedDraft, true);
  }

  // Exam paper creation rejects mismatched totalMarks (400) and non-APPROVED questions (400)
  assert.throws(
    () =>
      certificationService.createExamPaper(
        {
          title: 'Invalid Draft Paper',
          examBody: 'ICDL',
          programmeId: 'prog-icdl-001',
          moduleCode: 'ICDL-M04',
          durationMinutes: 60,
          totalMarks: 20,
          passMark: 10,
          questionIds: [aiDrafts.questions[0].id],
        },
        examModerator
      ),
    (err: unknown) => err instanceof CertificationHttpError && err.statusCode === 400
  );

  // Approve two questions and verify mismatched totalMarks throws 400 while matching totalMarks succeeds
  const approvedList = certificationService.listQuestions({ status: 'APPROVED' }) as any[];
  const q1 = approvedList[0];
  assert.ok(q1);
  assert.throws(
    () =>
      certificationService.createExamPaper(
        {
          title: 'Mismatched Marks Paper',
          examBody: 'ICDL',
          programmeId: 'prog-icdl-001',
          moduleCode: q1.moduleCode,
          durationMinutes: 60,
          totalMarks: q1.marks + 50,
          passMark: q1.marks,
          questionIds: [q1.id],
        },
        examModerator
      ),
    (err: unknown) => err instanceof CertificationHttpError && err.statusCode === 400
  );

  const validPaper = certificationService.createExamPaper(
    {
      title: 'Valid Moderated Paper',
      examBody: 'ICDL',
      programmeId: 'prog-icdl-001',
      moduleCode: q1.moduleCode,
      durationMinutes: 60,
      totalMarks: q1.marks,
      passMark: Math.max(1, Math.floor(q1.marks * 0.7)),
      questionIds: [q1.id],
    },
    examModerator
  );
  assert.equal(validPaper.totalMarks, q1.marks);

  // AI marking draft cannot be released without human verification (409)
  const pendingSub = certificationService
    .listMarkingSubmissions()
    .find((m) => m.moderationStatus !== 'RELEASED');
  assert.ok(pendingSub);
  certificationService.generateAiMarkingDraft(pendingSub.id, lecturerAuthor);
  assert.throws(
    () => certificationService.approveAndReleaseResult(pendingSub.id, 'Bypass attempt', examModerator),
    (err: unknown) => err instanceof CertificationHttpError && err.statusCode === 409
  );

  certificationService.saveHumanMarking(
    pendingSub.id,
    { manualScore: 20, lecturerFeedback: 'Verified spreadsheet formulas manually.' },
    lecturerAuthor
  );
  const released = certificationService.approveAndReleaseResult(
    pendingSub.id,
    'Moderated and approved',
    examModerator
  );
  assert.equal(released.moderationStatus, 'RELEASED');
});

test('Invigilator operations enforce credit check-in gate, session controls, and closure report submission', () => {
  const invDash = certificationService.getInvigilatorDashboard();
  assert.ok(invDash.kpis.scheduledSessions >= 2);

  const sess = invDash.sessions[0];
  const checkedIn = certificationService.verifyCandidateCheckIn(
    sess.id,
    { studentRegNo: 'HCA/STU/2026/001', workstation: 'PC-22', attendanceStatus: 'PRESENT' },
    invigilatorActor
  );
  const row = checkedIn.candidates.find((c) => c.studentRegNo === 'HCA/STU/2026/001');
  assert.equal(row?.attendanceStatus, 'PRESENT');
  assert.equal(row?.workstation, 'PC-22');

  const paused = certificationService.controlInvigilatorSession(
    sess.id,
    'PAUSE',
    'Network switch reset',
    invigilatorActor
  );
  assert.equal(paused.status, 'PAUSED');

  const closed = certificationService.submitSessionClosureReport(
    sess.id,
    { finalOutcome: 'CONCLUDED_NORMALLY', notes: 'All scripts submitted cleanly.' },
    invigilatorActor
  );
  assert.equal(closed.status, 'COMPLETED');
  assert.equal(closed.closureReport?.finalOutcome, 'CONCLUDED_NORMALLY');
});

test('Three-interface UI components and Student certification-hub integration render cleanly via SSR', () => {
  assert.equal(resolveStudentSectionFromPath('/portal/student/certification'), 'certification-hub');
  assert.equal(STUDENT_SECTION_PATHS['certification-hub'], '/portal/student/certification');

  const adminHtml = renderToStaticMarkup(
    React.createElement(AdminCertificationWorkspace, {
      initialTab: 'overview',
      userRole: 'ADMIN',
      userName: 'Grace Nyambura',
    })
  );
  assertCleanMarkup(adminHtml, 'AdminCertificationWorkspace');

  const invHtml = renderToStaticMarkup(
    React.createElement(InvigilatorPortalWorkspace, {})
  );
  assertCleanMarkup(invHtml, 'InvigilatorPortalWorkspace');

  const candHtml = renderToStaticMarkup(
    React.createElement(CandidateCertificationPortal, { initialTab: 'overview' })
  );
  assertCleanMarkup(candHtml, 'CandidateCertificationPortal');

  const sidebarHtml = renderToStaticMarkup(
    React.createElement(StudentSidebar, {
      activePage: 'certification-hub',
      studentName: 'Amina Wanjiku',
      registrationNumber: 'HCA/STU/2026/001',
      sidebarOpen: true,
      sidebarCollapsed: false,
      onToggleCollapse: () => {},
      onCloseMobile: () => {},
      onNavigate: () => {},
      onLogoutClick: () => {},
    })
  );
  assert.ok(sidebarHtml.includes('/portal/student/certification'));
  assertCleanMarkup(sidebarHtml, 'StudentSidebar(certification-hub)');

  const subPageHtml = renderToStaticMarkup(
    React.createElement(ThemeProvider, {
      children: React.createElement(StudentSubPages, {
        activeSection: 'certification-hub',
        onBackToDashboard: () => {},
        onNavigate: () => {},
        onNotify: () => {},
        onRefresh: () => {},
      }),
    })
  );
  assert.ok(subPageHtml.includes('Certification Hub'));
  assertCleanMarkup(subPageHtml, 'StudentSubPages(certification-hub)');
});
