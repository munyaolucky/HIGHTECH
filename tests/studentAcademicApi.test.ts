import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDb } from '../server/data/store.ts';
import platformRoutes, {
  studentAcademicRoutes as platformStudentAcademicRoutes,
} from '../server/modules/platform/platform.routes.ts';
import {
  studentAcademicRoutes as teachingStudentAcademicRoutes,
} from '../server/modules/teaching/teaching.routes.ts';
import {
  resolveAcademicStudentIdentity,
  studentAcademicRoutes,
} from '../server/modules/student/studentAcademic.routes.ts';
import {
  StudentAcademicHttpError,
  studentAcademicService,
  type StoreData,
  type StudentAcademicIdentity,
} from '../server/modules/student/studentAcademic.service.ts';
import { isPostgresConfigured } from '../src/db/index.ts';
import CloudSqlAcademicRegistrationCard from '../src/modules/student/components/CloudSqlAcademicRegistrationCard.tsx';
import { getMyRegisteredUnits } from '../src/modules/student/services/studentAcademicApi.ts';
import {
  buildOfficialRegistrationFilename,
  exportOfficialRegistrationPdfBytes,
  extractApprovedRegistrations,
  type OfficialRegistrationPdfInput,
} from '../src/modules/student/services/registrationPdf.ts';

const STUDENT_AMINA: StudentAcademicIdentity = {
  studentId: 'uid-stu-001',
  pgUserId: 1001,
  studentRegNo: 'HCA/STU/2026/001',
  studentName: 'Amina Wanjiku Kamau',
  departmentId: 'dept-computing',
};

function createTestStore(): StoreData {
  const base = getDb();
  const cloned = structuredClone(base);

  // Ensure deterministic markingSubmissions across all moderation states
  cloned.certificationState.markingSubmissions = [
    {
      id: 'sub-rel-1',
      attemptRef: 'ATT-REL-001',
      examId: 'exam-icdl-1',
      examTitle: 'Computer Essentials Theory & Lab',
      examBody: 'ICDL',
      moduleCode: 'ICDL-101',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Amina Wanjiku Kamau',
      objectiveScore: 42,
      manualScore: 34,
      totalMarks: 100,
      passMark: 50,
      aiDraftScore: 30,
      aiDraftFeedback: 'INTERNAL AI DRAFT NOTE',
      lecturerFeedback: 'Strong foundational mastery.',
      practicalFeedback: 'All practical tasks verified.',
      moderatorNote: 'INTERNAL MODERATOR NOTE',
      moderationStatus: 'RELEASED',
      markedByName: 'Eng. Peter Kamau',
      moderatedByName: 'HOD Computing',
      approvedByName: 'Academic Registrar',
      submittedAt: '2026-05-10T10:00:00.000Z',
      releasedAt: '2026-05-12T12:00:00.000Z',
    },
    {
      id: 'sub-unrel-ai',
      attemptRef: 'ATT-UNREL-002',
      examId: 'exam-icdl-2',
      examTitle: 'Spreadsheets & Data Modeling',
      examBody: 'ICDL',
      moduleCode: 'ICDL-103',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Amina Wanjiku Kamau',
      objectiveScore: 20,
      manualScore: 15,
      totalMarks: 100,
      passMark: 50,
      aiDraftScore: 15,
      aiDraftFeedback: 'UNRELEASED AI DRAFT',
      lecturerFeedback: 'Pending final moderation.',
      moderationStatus: 'AI_DRAFT_PENDING_HUMAN_REVIEW',
      submittedAt: '2026-05-14T10:00:00.000Z',
    },
    {
      id: 'sub-unrel-mod',
      attemptRef: 'ATT-UNREL-003',
      examId: 'exam-icdl-3',
      examTitle: 'Database Systems Exam',
      examBody: 'ICDL',
      moduleCode: 'ICDL-104',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Amina Wanjiku Kamau',
      objectiveScore: 10,
      manualScore: 10,
      totalMarks: 100,
      passMark: 50,
      lecturerFeedback: 'Not yet released by Academic Board.',
      moderationStatus: 'MODERATED',
      submittedAt: '2026-05-15T10:00:00.000Z',
    },
    {
      id: 'sub-other-student-rel',
      attemptRef: 'ATT-OTHER-009',
      examId: 'exam-icdl-1',
      examTitle: 'Computer Essentials Theory & Lab',
      examBody: 'ICDL',
      moduleCode: 'ICDL-101',
      studentRegNo: 'HCA/STU/2026/014',
      studentName: 'Another Candidate',
      objectiveScore: 48,
      manualScore: 48,
      totalMarks: 100,
      passMark: 50,
      lecturerFeedback: 'Other student record.',
      moderationStatus: 'RELEASED',
      submittedAt: '2026-05-10T10:00:00.000Z',
      releasedAt: '2026-05-12T12:00:00.000Z',
    },
  ];

  return cloned;
}

test('resolveAcademicStudentIdentity rejects unauthenticated requests with 401', () => {
  assert.throws(
    () =>
      resolveAcademicStudentIdentity({
        query: {},
      } as unknown as Request),
    (err: unknown) => err instanceof StudentAcademicHttpError && err.statusCode === 401
  );
});

test('resolveAcademicStudentIdentity rejects staff and non-student portal accounts with 403', () => {
  assert.throws(
    () =>
      resolveAcademicStudentIdentity({
        staffUser: { id: 'stf-1', role: 'LECTURER' },
        query: {},
      } as unknown as Request),
    (err: unknown) => err instanceof StudentAcademicHttpError && err.statusCode === 403
  );

  assert.throws(
    () =>
      resolveAcademicStudentIdentity({
        portalUser: {
          uid: 'usr-lect-1',
          primaryRole: 'LECTURER',
          registrationNumber: 'HCA/STF/001',
          fullName: 'Lecturer One',
        },
        query: {},
      } as unknown as Request),
    (err: unknown) => err instanceof StudentAcademicHttpError && err.statusCode === 403
  );
});

test('resolveAcademicStudentIdentity rejects missing registrationNumber or cross-student query overrides with 403', () => {
  assert.throws(
    () =>
      resolveAcademicStudentIdentity({
        portalUser: {
          uid: 'uid-stu-001',
          primaryRole: 'STUDENT',
          registrationNumber: '',
          fullName: 'No Reg Student',
        },
        query: {},
      } as unknown as Request),
    (err: unknown) => err instanceof StudentAcademicHttpError && err.statusCode === 403
  );

  assert.throws(
    () =>
      resolveAcademicStudentIdentity({
        portalUser: {
          uid: 'uid-stu-001',
          primaryRole: 'STUDENT',
          registrationNumber: 'HCA/STU/2026/001',
          fullName: 'Amina Wanjiku Kamau',
        },
        query: { studentRegNo: 'HCA/STU/2026/014' },
      } as unknown as Request),
    (err: unknown) => err instanceof StudentAcademicHttpError && err.statusCode === 403
  );

  assert.throws(
    () =>
      resolveAcademicStudentIdentity({
        portalUser: {
          uid: 'uid-stu-001',
          primaryRole: 'STUDENT',
          registrationNumber: 'HCA/STU/2026/001',
          fullName: 'Amina Wanjiku Kamau',
        },
        query: { studentId: 'uid-stu-999' },
      } as unknown as Request),
    (err: unknown) => err instanceof StudentAcademicHttpError && err.statusCode === 403
  );
});

test('resolveAcademicStudentIdentity accepts authenticated STUDENT matching own identifiers', () => {
  const identity = resolveAcademicStudentIdentity({
    portalUser: {
      uid: 'uid-stu-001',
      pgUserId: 'pg-stu-001',
      primaryRole: 'STUDENT',
      registrationNumber: 'HCA/STU/2026/001',
      fullName: 'Amina Wanjiku Kamau',
      departmentId: 'dept-computing',
    },
    query: { studentRegNo: 'hca/stu/2026/001' },
  } as unknown as Request);

  assert.equal(identity.studentId, 'uid-stu-001');
  assert.equal(identity.studentRegNo, 'HCA/STU/2026/001');
});

test('getResults strictly excludes unreleased marks and other students records', async () => {
  const store = createTestStore();
  const data = await studentAcademicService.getResults(STUDENT_AMINA, {
    store,
    pgEnabled: false,
  });

  assert.equal(data.releasedOnly, true);
  assert.equal(data.results.length, 1);
  assert.equal(data.results[0].id, 'sub-rel-1');
  assert.equal(data.results[0].totalScore, 76);
  assert.equal(data.results[0].grade, 'A');
  assert.equal(data.results[0].gradePoints, 4.0);
  assert.equal('aiDraftScore' in data.results[0], false);
  assert.equal('moderatorNote' in data.results[0], false);
});

test('getProgress calculates GPA strictly from released results only', async () => {
  const store = createTestStore();
  const progress = await studentAcademicService.getProgress(STUDENT_AMINA, {
    store,
    pgEnabled: false,
  });

  assert.equal(progress.releasedResultsCount, 1);
  assert.equal(progress.passedAssessmentsCount, 1);
  // Only sub-rel-1 (76% -> 4.0) is released; sub-unrel-ai & sub-unrel-mod (35% & 20%) must NOT lower GPA
  assert.equal(progress.gpa, 4.0);
  assert.equal(progress.averagePercentage, 76);
  assert.ok(progress.registeredUnitsCount > 0);
});

test('getAttendance returns read-only attendance scoped strictly to authenticated student', async () => {
  const store = createTestStore();
  const attendance = await studentAcademicService.getAttendance(STUDENT_AMINA, {
    store,
    pgEnabled: false,
  });

  assert.equal(attendance.readOnly, true);
  assert.equal(attendance.studentRegNo, 'HCA/STU/2026/001');
  assert.ok(attendance.sessions.length > 0);
  assert.ok(attendance.unitSummaries.length > 0);

  // Verify HCA/STU/2026/002-only session is not leaked to HCA/STU/2026/001
  const leaked = attendance.sessions.find((s) =>
    store.attendanceSessions.some(
      (raw) =>
        raw.id === s.sessionId &&
        !raw.records.some((r) => r.studentRegNo.toUpperCase() === 'HCA/STU/2026/001')
    )
  );
  assert.equal(leaked, undefined);
});

test('getUnits, getTimetable, getAssessments, and getExamTimetable strip secret fields and scope to student', async () => {
  const store = createTestStore();

  const [units, timetable, assessments, examTimetable] = await Promise.all([
    studentAcademicService.getUnits(STUDENT_AMINA, { store, pgEnabled: false }),
    studentAcademicService.getTimetable(STUDENT_AMINA, { store, pgEnabled: false }),
    studentAcademicService.getAssessments(STUDENT_AMINA, { store, pgEnabled: false }),
    studentAcademicService.getExamTimetable(STUDENT_AMINA, { store, pgEnabled: false }),
  ]);

  assert.ok(units.units.length > 0);
  assert.ok(timetable.slots.length >= 0);
  assert.ok(assessments.assessments.length > 0);
  assert.ok(examTimetable.entries.length > 0);

  // Ensure CBT definitions do not leak questions or correct answer keys
  const serializedAssessments = JSON.stringify(assessments);
  assert.equal(serializedAssessments.includes('correctOptionIds'), false);

  const serializedExamTimetable = JSON.stringify(examTimetable);
  assert.equal(serializedExamTimetable.includes('HCA/STU/2026/014'), false);
  assert.equal(serializedExamTimetable.includes('HCA/STU/2026/025'), false);
});

test('studentAcademicRoutes registers all expected read-only endpoints', () => {
  const layers = (
    studentAcademicRoutes as unknown as {
      stack: Array<{
        route?: {
          path?: string;
          methods?: Record<string, boolean>;
        };
      }>;
    }
  ).stack;

  const expectedPaths = [
    '/units',
    '/timetable',
    '/attendance',
    '/assessments',
    '/results',
    '/progress',
    '/exam-timetable',
  ];

  for (const path of expectedPaths) {
    const route = layers.find((l) => l.route?.path === path && l.route.methods?.get);
    assert.ok(route, `Expected GET ${path} to be registered on studentAcademicRoutes`);
  }
});

type RouteLayer = {
  route?: {
    path?: string;
    methods?: Record<string, boolean>;
    stack?: Array<{
      handle: (req: Request, res: Response) => unknown | Promise<unknown>;
    }>;
  };
};

function getFinalRouteHandler(router: unknown, routePath: string) {
  const stack = (router as { stack: RouteLayer[] }).stack;
  const layer = stack.find(
    (entry) => entry.route?.path === routePath && entry.route.methods?.get
  );
  assert.ok(layer?.route?.stack?.length, `Missing GET handler for ${routePath}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function createMockRes() {
  const state: { statusCode: number; body: unknown } = {
    statusCode: 200,
    body: null,
  };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
  } as unknown as Response;
  return { res, state };
}

test('Phase 2.2 teaching GET /attendance enforces student identity and returns clean attendance payload', async () => {
  const handler = getFinalRouteHandler(teachingStudentAcademicRoutes, '/attendance');

  // 1. Authenticated student -> 200
  const okMock = createMockRes();
  await handler(
    {
      portalUser: {
        uid: 'uid-stu-001',
        pgUserId: 1001,
        primaryRole: 'STUDENT',
        registrationNumber: 'HCA/STU/2026/001',
        fullName: 'Amina Wanjiku Kamau',
        departmentId: 'dept-computing',
      },
      query: {},
    } as unknown as Request,
    okMock.res
  );
  assert.equal(okMock.state.statusCode, 200);
  const okBody = okMock.state.body as {
    success: boolean;
    data: {
      studentRegNo: string;
      overallAttendancePct: number;
      minimumRequiredPct: number;
      attendanceHistory: unknown[];
      activeQrSessions: unknown[];
      absenceCases: unknown[];
      catchUpLessons: unknown[];
      alerts: unknown[];
    };
  };
  assert.equal(okBody.success, true);
  assert.equal(okBody.data.studentRegNo, 'HCA/STU/2026/001');
  assert.equal(typeof okBody.data.overallAttendancePct, 'number');
  assert.equal(typeof okBody.data.minimumRequiredPct, 'number');
  assert.equal(Array.isArray(okBody.data.attendanceHistory), true);
  assert.equal(Array.isArray(okBody.data.activeQrSessions), true);
  assert.equal(Array.isArray(okBody.data.absenceCases), true);
  assert.equal(Array.isArray(okBody.data.catchUpLessons), true);
  assert.equal(Array.isArray(okBody.data.alerts), true);

  // 2. Staff account -> 403
  const staffMock = createMockRes();
  await handler(
    {
      staffUser: { id: 'usr-lecturer-kamau', role: 'LECTURER', permissions: [] },
      portalUser: {
        uid: 'usr-lecturer-kamau',
        primaryRole: 'LECTURER',
        registrationNumber: 'HCA/STF/001',
        fullName: 'Lecturer',
      },
      query: {},
    } as unknown as Request,
    staffMock.res
  );
  assert.equal(staffMock.state.statusCode, 403);

  // 3. Student without registration number -> 401
  const noRegMock = createMockRes();
  await handler(
    {
      portalUser: {
        uid: 'uid-stu-noreg',
        primaryRole: 'STUDENT',
        registrationNumber: null,
        fullName: 'No Reg Student',
      },
      query: {},
    } as unknown as Request,
    noRegMock.res
  );
  assert.equal(noRegMock.state.statusCode, 401);
});

test('Phase 2.3 & 2.4 platform GET /units and GET /academic-registrations enforce RBAC and student scoping', async () => {
  const unitsHandler = getFinalRouteHandler(platformStudentAcademicRoutes, '/units');
  const regHandler = getFinalRouteHandler(platformRoutes, '/academic-registrations');

  // Non-student / unauthorized portal roles receive 403 on both /units and /academic-registrations
  for (const role of ['PARENT', 'GUEST', 'LIBRARIAN']) {
    const uMock = createMockRes();
    await unitsHandler(
      {
        portalUser: {
          uid: `uid-${role.toLowerCase()}`,
          pgUserId: 999999,
          primaryRole: role,
          registrationNumber: null,
          fullName: `${role} User`,
        },
        query: {},
      } as unknown as Request,
      uMock.res
    );
    assert.equal(uMock.state.statusCode, 403);

    const rMock = createMockRes();
    await regHandler(
      {
        portalUser: {
          uid: `uid-${role.toLowerCase()}`,
          pgUserId: 999999,
          primaryRole: role,
          registrationNumber: null,
          fullName: `${role} User`,
        },
        query: {},
      } as unknown as Request,
      rMock.res
    );
    assert.equal(rMock.state.statusCode, 403);
  }

  if (isPostgresConfigured()) {
    // Student with no linked profile -> 404 on /units
    const missingMock = createMockRes();
    await unitsHandler(
      {
        portalUser: {
          uid: 'uid-missing-student',
          pgUserId: 987654321,
          primaryRole: 'STUDENT',
          registrationNumber: 'HCA/STU/NONEXISTENT/999',
          fullName: 'Unlinked Student',
        },
        query: {},
      } as unknown as Request,
      missingMock.res
    );
    assert.equal(missingMock.state.statusCode, 404);

    // Seeded student HCA/STU/2026/001 -> 200 on /units with own registrations
    const seededMock = createMockRes();
    await unitsHandler(
      {
        portalUser: {
          uid: 'uid-amina',
          pgUserId: 0,
          primaryRole: 'STUDENT',
          registrationNumber: 'HCA/STU/2026/001',
          fullName: 'Amina Wanjiku Kamau',
        },
        query: {},
      } as unknown as Request,
      seededMock.res
    );
    assert.equal(seededMock.state.statusCode, 200);
    const body = seededMock.state.body as {
      success: boolean;
      data: {
        student: { registrationNumber: string };
        registrations: Array<{ approvalStatus: string; units: unknown[] }>;
      };
    };
    assert.equal(body.success, true);
    assert.equal(body.data.student.registrationNumber, 'HCA/STU/2026/001');
    assert.equal(Array.isArray(body.data.registrations), true);
  }
});

test('Phase 2.4 CloudSqlAcademicRegistrationCard and studentAcademicApi service render cleanly via SSR', () => {
  assert.equal(typeof getMyRegisteredUnits, 'function');

  const cardHtml = renderToStaticMarkup(
    React.createElement(CloudSqlAcademicRegistrationCard, { onNotify: () => {} })
  );
  assert.ok(cardHtml.includes('Approved registrations'));
  assert.ok(cardHtml.includes('Pending review'));
  assert.ok(cardHtml.includes('Rejected'));
  assert.ok(cardHtml.includes('Approved credits'));
  assert.ok(cardHtml.includes('Official PDF'));
  assert.ok(cardHtml.includes('disabled=""') || cardHtml.includes('disabled'));
});

test('Official registration PDF strictly filters APPROVED registrations and generates valid PDF bytes', () => {
  const mixedInput: OfficialRegistrationPdfInput = {
    student: {
      registrationNumber: 'HCA/STU/2026/001',
      fullName: 'Amina Wanjiku Kamau',
      programmeName: 'Diploma in ICT & Software Engineering',
      campusName: 'Nairobi Main Campus',
      studentStatus: 'ACTIVE',
    },
    registrations: [
      {
        id: 'reg-approved-1',
        academicYear: '2026/2027',
        semesterName: 'Trimester 1',
        intakeCode: 'MAY-2026',
        approvalStatus: 'APPROVED',
        totalCredits: 7,
        feeThresholdCleared: true,
        registeredAt: '2026-05-02T09:00:00.000Z',
        approvedByName: 'Academic Registrar',
        units: [
          { code: 'ICT-201', title: 'Database Systems & SQL', credits: 4 },
          { code: 'COM-101', title: 'Technical Communication', credits: 3 },
        ],
      },
      {
        id: 'reg-pending-1',
        academicYear: '2026/2027',
        semesterName: 'Trimester 2',
        intakeCode: 'SEP-2026',
        approvalStatus: 'PENDING',
        totalCredits: 4,
        feeThresholdCleared: false,
        units: [{ code: 'ICT-999-PEND', title: 'Pending Unapproved Unit', credits: 4 }],
      },
      {
        id: 'reg-rejected-1',
        academicYear: '2025/2026',
        semesterName: 'Trimester 3',
        intakeCode: 'JAN-2026',
        approvalStatus: 'REJECTED',
        totalCredits: 3,
        feeThresholdCleared: false,
        units: [{ code: 'ICT-888-REJ', title: 'Rejected Unit', credits: 3 }],
      },
    ],
  };

  const summary = extractApprovedRegistrations(mixedInput);
  assert.equal(summary.approvedRegistrations.length, 1);
  assert.equal(summary.approvedRegistrations[0].id, 'reg-approved-1');
  assert.equal(summary.totalApprovedUnits, 2);
  assert.equal(summary.totalApprovedCredits, 7);

  const pdfBytes = exportOfficialRegistrationPdfBytes(mixedInput);
  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.byteLength > 500);
  const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
  assert.equal(header, '%PDF-');

  const rawPdfAscii = Buffer.from(pdfBytes).toString('latin1');
  assert.equal(rawPdfAscii.includes('ICT-201'), true);
  assert.equal(rawPdfAscii.includes('ICT-999-PEND'), false);
  assert.equal(rawPdfAscii.includes('ICT-888-REJ'), false);

  assert.equal(
    buildOfficialRegistrationFilename('HCA/STU/2026/001'),
    'Official-Registration-HCA-STU-2026-001.pdf'
  );
});

test('Official registration PDF rejects export when only PENDING or REJECTED registrations exist', () => {
  const noApprovedInput: OfficialRegistrationPdfInput = {
    student: {
      registrationNumber: 'HCA/STU/2026/001',
      fullName: 'Amina Wanjiku Kamau',
    },
    registrations: [
      {
        id: 'reg-pending-only',
        academicYear: '2026/2027',
        semesterName: 'Trimester 2',
        intakeCode: 'SEP-2026',
        approvalStatus: 'PENDING',
        totalCredits: 4,
        feeThresholdCleared: false,
        units: [{ code: 'ICT-204', title: 'Network Architecture', credits: 4 }],
      },
      {
        id: 'reg-rejected-only',
        academicYear: '2025/2026',
        semesterName: 'Trimester 1',
        intakeCode: 'JAN-2026',
        approvalStatus: 'REJECTED',
        totalCredits: 3,
        feeThresholdCleared: false,
        units: [{ code: 'ICT-101', title: 'Intro to Computing', credits: 3 }],
      },
    ],
  };

  assert.throws(() => extractApprovedRegistrations(noApprovedInput), /APPROVED/);
  assert.throws(() => exportOfficialRegistrationPdfBytes(noApprovedInput), /APPROVED/);
});
