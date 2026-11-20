import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
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

const {
  resolveStudentSectionFromPath,
  STUDENT_ASSESSMENT_TYPES,
  STUDENT_SECTION_PATHS,
  studentPortalService,
} = await import('../src/services/studentPortalService.ts');
const { default: StudentSidebar, STUDENT_EXAM_SUBMENU_ITEMS } = await import(
  '../src/modules/student/components/StudentSidebar.tsx'
);
const { default: StudentExamDashboard } = await import(
  '../src/modules/student/pages/exams/StudentExamDashboard.tsx'
);
const { default: MyAssessmentsPage } = await import(
  '../src/modules/student/pages/exams/MyAssessmentsPage.tsx'
);
const { default: AssignmentsPage } = await import(
  '../src/modules/student/pages/exams/AssignmentsPage.tsx'
);
const { default: ExamTimetablePage } = await import(
  '../src/modules/student/pages/exams/ExamTimetablePage.tsx'
);
const { default: OnlineExamsPage } = await import(
  '../src/modules/student/pages/exams/OnlineExamsPage.tsx'
);
const { default: PracticalAssessmentsPage } = await import(
  '../src/modules/student/pages/exams/PracticalAssessmentsPage.tsx'
);
const { default: ResultsPage } = await import(
  '../src/modules/student/pages/exams/ResultsPage.tsx'
);
const { default: ExamClearancePage } = await import(
  '../src/modules/student/pages/exams/ExamClearancePage.tsx'
);
const { default: AssessmentHistoryPage } = await import(
  '../src/modules/student/pages/exams/AssessmentHistoryPage.tsx'
);
const { default: AppealsPage } = await import(
  '../src/modules/student/pages/exams/AppealsPage.tsx'
);
const { default: AcademicProgressPage } = await import(
  '../src/modules/student/pages/exams/AcademicProgressPage.tsx'
);

beforeEach(() => {
  globalThis.localStorage.clear();
});

function assertNoAntiPatterns(html: string, context: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${context}: must not contain animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${context}: must not contain inline style attributes`);
}

test('resolveStudentSectionFromPath maps all 11 Exam & Assessment routes and core student portal paths', () => {
  const expectedPairs: [string, string][] = [
    ['/portal/student', 'dashboard'],
    ['/portal/student/learning', 'elearning'],
    ['/portal/student/timetable', 'timetable'],
    ['/portal/student/exams', 'examinations'],
    ['/portal/student/exams/assessments', 'exams-assessments'],
    ['/portal/student/exams/assignments', 'exams-assignments'],
    ['/portal/student/exams/timetable', 'exams-timetable'],
    ['/portal/student/exams/online', 'exams-online'],
    ['/portal/student/exams/practical', 'exams-practical'],
    ['/portal/student/exams/results', 'exams-results'],
    ['/portal/student/exams/clearance', 'exams-clearance'],
    ['/portal/student/exams/history', 'exams-history'],
    ['/portal/student/exams/appeals', 'exams-appeals'],
    ['/portal/student/exams/progress', 'exams-progress'],
    ['/portal/student/library', 'library'],
    ['/portal/student/finance', 'finance'],
    ['/portal/student/support', 'support'],
  ];

  for (const [path, section] of expectedPairs) {
    assert.equal(resolveStudentSectionFromPath(path), section);
    assert.equal(STUDENT_SECTION_PATHS[section as keyof typeof STUDENT_SECTION_PATHS], path);
  }
});

test('studentPortalService seeds all 14 assessment types and persists assessment/practical/notice actions', () => {
  const state = studentPortalService.getState();
  const presentTypes = new Set(state.assessments.map((a) => a.assessmentType));
  for (const typeName of STUDENT_ASSESSMENT_TYPES) {
    assert.equal(presentTypes.has(typeName), true, `Missing seeded assessment type: ${typeName}`);
  }

  const summary = studentPortalService.getExamDashboardSummary();
  assert.ok(summary.pendingAssessments >= 1);
  assert.ok(summary.upcomingExams >= 1);
  assert.ok(summary.averageScore > 0);
  assert.ok(summary.releasedResults >= 1);

  const pendingAsm = state.assessments.find((a) => a.status === 'Pending');
  assert.ok(pendingAsm);

  const started = studentPortalService.startAssessment(pendingAsm.id);
  assert.equal(started.ok, true);
  assert.equal(
    studentPortalService.getState().assessments.find((a) => a.id === pendingAsm.id)?.status,
    'In progress'
  );

  const submitted = studentPortalService.submitAssessmentWork(
    pendingAsm.id,
    'Completed submission notes and rubric analysis.',
    { fileName: 'submission_proof.pdf', fileSize: '420 KB' }
  );
  assert.equal(submitted.ok, true);
  assert.equal(
    studentPortalService.getState().assessments.find((a) => a.id === pendingAsm.id)?.status,
    'Submitted'
  );

  const practical = state.assessments.find((a) => a.assessmentType === 'Practical');
  assert.ok(practical);
  const pracSave = studentPortalService.savePracticalEvidence(
    practical.id,
    [true, true, true],
    'Lab circuit verification recorded.',
    { fileName: 'lab_evidence.pdf', fileSize: '1.1 MB' },
    true
  );
  assert.equal(pracSave.ok, true);

  const unreadNotice = state.examNotices.find((n) => !n.acknowledged);
  assert.ok(unreadNotice);
  studentPortalService.acknowledgeExamNotice(unreadNotice.id);
  assert.equal(
    studentPortalService.getState().examNotices.find((n) => n.id === unreadNotice.id)?.acknowledged,
    true
  );
});

test('StudentSidebar renders collapsible Exams & Assessments submenu with all 11 items and active state', () => {
  assert.equal(STUDENT_EXAM_SUBMENU_ITEMS.length, 11);

  const html = renderToStaticMarkup(
    React.createElement(StudentSidebar, {
      activePage: 'exams-online',
      studentName: 'Amina Wanjiku',
      registrationNumber: 'HCA/STU/2026/001',
      unreadNotificationsCount: 2,
      pendingAssessmentsCount: 4,
      sidebarOpen: true,
      sidebarCollapsed: false,
      onToggleCollapse: () => {},
      onCloseMobile: () => {},
      onNavigate: () => {},
      onLogoutClick: () => {},
    })
  );

  assertNoAntiPatterns(html, 'StudentSidebar');
  assert.match(html, /HI-TECH COLLEGE/);
  assert.match(html, /Student Portal/);
  assert.match(html, /Exams &amp; Assessments/);
  for (const item of STUDENT_EXAM_SUBMENU_ITEMS) {
    assert.ok(html.includes(item.path), `Sidebar missing path ${item.path}`);
  }
  assert.match(html, /aria-current="page"/);
});

test('All 11 Exams & Assessments workspace pages render cleanly via SSR without anti-patterns', () => {
  const sharedProps = {
    onNavigate: () => {},
    onNotify: () => {},
    onRefresh: () => {},
    onSwitchPortal: () => {},
  };

  const pages: [string, React.ComponentType<typeof sharedProps>, RegExp][] = [
    ['StudentExamDashboard', StudentExamDashboard, /Exams &amp; Assessments/],
    ['MyAssessmentsPage', MyAssessmentsPage, /My Assessments/],
    ['AssignmentsPage', AssignmentsPage, /Assignments &amp; Coursework/],
    ['ExamTimetablePage', ExamTimetablePage, /Examination Timetable/],
    ['OnlineExamsPage', OnlineExamsPage, /Online Exams \(CBT Sessions\)/],
    ['PracticalAssessmentsPage', PracticalAssessmentsPage, /Practical &amp; Competency Assessments/],
    ['ResultsPage', ResultsPage, /Results &amp; Grades/],
    ['ExamClearancePage', ExamClearancePage, /Exam Clearance &amp; Hall Permit/],
    ['AssessmentHistoryPage', AssessmentHistoryPage, /Assessment History/],
    ['AppealsPage', AppealsPage, /Appeals &amp; Remarking/],
    ['AcademicProgressPage', AcademicProgressPage, /Certificates &amp; Academic Progress/],
  ];

  for (const [name, Component, pattern] of pages) {
    const html = renderToStaticMarkup(React.createElement(Component, sharedProps));
    assertNoAntiPatterns(html, name);
    assert.match(html, pattern, `${name} did not emit expected heading`);
  }

  const myAssessmentsHtml = renderToStaticMarkup(
    React.createElement(MyAssessmentsPage, sharedProps)
  );
  for (const column of [
    'Assessment Name',
    'Unit',
    'Type',
    'Total Marks',
    'Deadline',
    'Status',
    'Action',
  ]) {
    assert.ok(
      myAssessmentsHtml.includes(`>${column}</th>`),
      `MyAssessmentsPage missing column header: ${column}`
    );
  }
  assert.match(myAssessmentsHtml, /aria-label="Search assessments"/);
  assert.match(myAssessmentsHtml, /aria-label="Filter by assessment type"/);
  assert.match(myAssessmentsHtml, /aria-label="Filter by unit code"/);
  assert.match(myAssessmentsHtml, />Open</);

  const timetableHtml = renderToStaticMarkup(
    React.createElement(ExamTimetablePage, sharedProps)
  );
  assert.match(timetableHtml, /List View/);
  assert.match(timetableHtml, /Calendar View/);
  assert.match(timetableHtml, /Online CBT Portal/);
  assert.match(timetableHtml, /Open Online Exam/);

  const dashboardHtml = renderToStaticMarkup(
    React.createElement(StudentExamDashboard, sharedProps)
  );
  for (const label of [
    'Pending Assessments',
    'Upcoming Exams',
    'Average Score',
    'Released Results',
    'Upcoming Assessment Schedule',
    'Exam Calendar Preview',
  ]) {
    assert.ok(
      dashboardHtml.includes(label),
      `StudentExamDashboard missing expected label: ${label}`
    );
  }
});
