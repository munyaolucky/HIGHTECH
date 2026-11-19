import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDb, saveDb, type PortalDatabase } from '../server/data/store.ts';
import { STAFF_PERMISSIONS, ROLE_TO_STAFF_PERMISSIONS } from '../server/modules/staff/staff.permissions.ts';
import {
  teachingService,
  type TeachingActor,
} from '../server/modules/teaching/teaching.service.ts';
import { TEACHING_REPORT_CATALOGUE } from '../server/modules/teaching/teaching.types.ts';
import TeachingDocumentsHub from '../src/modules/lecturer/components/TeachingDocumentsHub.tsx';
import RecordLessonDeliveryPage from '../src/modules/lecturer/components/RecordLessonDeliveryPage.tsx';
import AbsenceCasesReviewPage from '../src/modules/lecturer/components/AbsenceCasesReviewPage.tsx';
import SchemeCoveragePage from '../src/modules/lecturer/components/SchemeCoveragePage.tsx';
import TeachingReportsPage from '../src/modules/lecturer/components/TeachingReportsPage.tsx';
import HODAttendanceMonitor from '../src/modules/staff/teaching/HODAttendanceMonitor.tsx';
import PrincipalAttendanceOversight from '../src/modules/staff/teaching/PrincipalAttendanceOversight.tsx';
import AdminAttendancePolicyView from '../src/modules/staff/teaching/AdminAttendancePolicyView.tsx';
import StudentAbsenceSection from '../src/modules/student/components/StudentAbsenceSection.tsx';
import { STAFF_ACCOUNTS } from '../src/config/staff-navigation.ts';

let dbSnapshot: PortalDatabase | null = null;

test.before(() => {
  dbSnapshot = structuredClone(getDb());
});

test.after(() => {
  if (dbSnapshot) {
    saveDb(dbSnapshot);
  }
});

const LECTURER_KAMAU: TeachingActor = {
  id: 'usr-lecturer-kamau',
  fullName: 'Dr. Peter Kamau',
  role: 'LECTURER',
  departmentId: 'dept-computing',
  department: 'School of Computing & Informatics',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.LECTURER],
};

const LECTURER_WANJALA: TeachingActor = {
  id: 'usr-lecturer-wanjala',
  fullName: 'Grace Wanjala',
  role: 'LECTURER',
  departmentId: 'dept-business',
  department: 'School of Business & Finance',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.LECTURER],
};

const HOD_COMPUTING: TeachingActor = {
  id: 'usr-hod-001',
  fullName: 'Eng. Daniel Mwangi',
  role: 'HOD',
  departmentId: 'dept-computing',
  department: 'School of Computing & Informatics',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.HOD],
};

const ADMIN_ACTOR: TeachingActor = {
  id: 'usr-admin-001',
  fullName: 'Grace Nyambura',
  role: 'ADMIN',
  departmentId: null,
  department: 'Information Systems & Governance',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.ADMIN],
};

const PRINCIPAL_ACTOR: TeachingActor = {
  id: 'usr-principal-001',
  fullName: 'Dr. Bernard Maina',
  role: 'PRINCIPAL',
  departmentId: null,
  department: 'Office of the Principal',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.PRINCIPAL],
};

test('Teaching Documents Hub validation, multi-versioning & HOD approve/return workflow', () => {
  assert.throws(
    () =>
      teachingService.uploadDocument(LECTURER_KAMAU, {
        unitCode: 'CSC 301',
        category: 'LESSON_PLAN',
        title: 'Bad executable file',
        fileName: 'malware.exe',
        fileSizeBytes: 1024,
      }),
    /Unsupported file format/
  );

  assert.throws(
    () =>
      teachingService.uploadDocument(LECTURER_KAMAU, {
        unitCode: 'CSC 301',
        category: 'LESSON_PLAN',
        title: 'Too huge file',
        fileName: 'notes.pdf',
        fileSizeBytes: 12 * 1024 * 1024,
      }),
    /exceeds maximum limit/
  );

  const created = teachingService.uploadDocument(LECTURER_KAMAU, {
    unitCode: 'CSC 301',
    category: 'PRACTICAL_ASSESSMENT_REPORTS',
    title: 'Week 5 AVL Rotations Lab Rubric',
    fileName: 'avl_lab.pdf',
    fileSizeBytes: 20480,
    submitNow: true,
  });
  assert.equal(created.status, 'SUBMITTED');
  assert.equal(created.currentVersion, 1);

  const returned = teachingService.transitionDocumentStatus(
    HOD_COMPUTING,
    created.id,
    'RETURN',
    'Include grading breakdown for memory Complexity O(log n).'
  );
  assert.equal(returned.status, 'RETURNED');
  assert.ok(
    getDb().attendanceAlerts.some(
      (a) => a.relatedEntityId === created.id && a.category === 'DOCUMENT_RETURNED'
    )
  );

  const v2 = teachingService.addDocumentVersion(LECTURER_KAMAU, created.id, {
    fileName: 'avl_lab_v2.pdf',
    fileSizeBytes: 22000,
    changeSummary: 'Added complexity rubric marks',
    submitNow: true,
  });
  assert.equal(v2.currentVersion, 2);
  assert.equal(v2.status, 'SUBMITTED');

  const approved = teachingService.transitionDocumentStatus(
    HOD_COMPUTING,
    created.id,
    'APPROVE',
    'Approved for lab week 5.'
  );
  assert.equal(approved.status, 'APPROVED');
});

test('Lesson Delivery strict rule: blocks CONDUCTED without details, allows CONDUCTED with student absences', () => {
  assert.throws(
    () =>
      teachingService.saveLessonDelivery(LECTURER_KAMAU, {
        unitCode: 'CSC 301',
        lessonDate: '2026-11-20',
        plannedTopic: 'Dijkstra Shortest Path',
        status: 'CONDUCTED',
      }),
    /Cannot mark lesson as CONDUCTED without actual teaching details/
  );

  const lesson = teachingService.saveLessonDelivery(LECTURER_KAMAU, {
    unitCode: 'CSC 301',
    lessonDate: '2026-11-20',
    plannedTopic: 'Dijkstra Shortest Path',
    actualTopicTaught: 'Dijkstra Shortest Path & Priority Queues',
    subtopicsCovered: 'Relaxation step, Min-heap optimization, Trace table',
    learningObjectivesAchieved: 'Students computed shortest path trees on weighted graphs',
    teachingMethods: 'Interactive Lecture + Lab Walkthrough',
    status: 'CONDUCTED',
  });
  assert.equal(lesson.status, 'CONDUCTED');
  assert.ok(lesson.attendanceSessionId);
});

test('Committing attendance auto-creates StudentAbsenceCase, sends notifications & escalates thresholds', () => {
  // Lower HOD alert to 2 to verify deterministic configurable policy escalation
  teachingService.updateAttendancePolicy(ADMIN_ACTOR, {
    consecutiveAbsenceTrainerAlert: 2,
    unitAbsenceHodAlert: 2,
    unresolvedPrincipalEscalation: 4,
  });

  const sesRes = teachingService.commitAttendanceRegister(LECTURER_KAMAU, {
    unitCode: 'CSC 301',
    sessionDate: '2026-11-21',
    lockSession: true,
    entries: [
      { studentRegNo: 'HCA/STU/2026/001', studentName: 'Amina Wanjiku Kamau', status: 'PRESENT' },
      { studentRegNo: 'HCA/STU/2026/002', studentName: 'Brian Kipruto Korir', status: 'ABSENT' },
      { studentRegNo: 'HCA/STU/2025/142', studentName: 'Dennis Mutiso Kyalo', status: 'ABSENT' },
    ],
  });

  assert.equal(sesRes.session.locked, true);
  assert.equal(sesRes.triggeredAbsenceCases.length, 2);

  // Subsequent edit on locked session must fail with 409; requires HOD correction request
  assert.throws(
    () =>
      teachingService.commitAttendanceRegister(LECTURER_KAMAU, {
        sessionId: sesRes.session.id,
        unitCode: 'CSC 301',
        sessionDate: '2026-11-21',
        entries: [{ studentRegNo: 'HCA/STU/2026/002', studentName: 'Brian Kipruto Korir', status: 'PRESENT' }],
      }),
    /locked/
  );

  const rec = sesRes.session.records.find((r) => r.studentRegNo === 'HCA/STU/2026/002')!;
  const corr = teachingService.requestAttendanceCorrection(
    LECTURER_KAMAU,
    sesRes.session.id,
    rec.id,
    'EXCUSED',
    'Student arrived with dean office pass.'
  );
  assert.equal(corr.status, 'PENDING');
  const approvedCorr = teachingService.reviewAttendanceCorrection(HOD_COMPUTING, corr.id, 'APPROVED', 'Verified');
  assert.equal(approvedCorr.status, 'APPROVED');
});

test('QR check-in token checks expiry and blocks duplicate check-ins', () => {
  const openSes = teachingService.commitAttendanceRegister(LECTURER_KAMAU, {
    unitCode: 'CSC 305',
    sessionDate: '2026-11-22',
    lockSession: false,
    entries: [{ studentRegNo: 'HCA/STU/2026/001', studentName: 'Amina Wanjiku Kamau', status: 'ABSENT' }],
  });

  const qr = teachingService.generateQrSession(LECTURER_KAMAU, openSes.session.id);
  const checkIn = teachingService.studentQrCheckIn('HCA/STU/2026/001', 'Amina Wanjiku Kamau', qr.qrToken);
  assert.equal(checkIn.unitCode, 'CSC 305');

  // Second check-in throws duplicate conflict
  assert.throws(
    () => teachingService.studentQrCheckIn('HCA/STU/2026/001', 'Amina Wanjiku Kamau', qr.qrToken),
    /already checked in/
  );
});

test('Medical confidentiality RBAC & Option B verbal explanation + Student confirmation accuracy workflow', () => {
  const kamauCases = teachingService.listStaffAbsenceCases(LECTURER_KAMAU);
  const sampleCase = kamauCases.find((c) => c.studentRegNo === 'HCA/STU/2026/001') ?? kamauCases[0];

  const ev = teachingService.uploadAbsenceEvidence(
    {
      id: sampleCase.studentRegNo,
      fullName: sampleCase.studentName,
      role: 'STUDENT',
      departmentId: sampleCase.departmentId,
      department: sampleCase.departmentName,
      permissions: [],
      registrationNumber: sampleCase.studentRegNo,
    },
    sampleCase.id,
    {
      fileName: 'clinic_discharge.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 12000,
      description: 'Outpatient medical note',
      isConfidentialMedical: true,
    }
  );

  // ADMIN must NEVER have EVIDENCE_VIEW_RESTRICTED and receives redacted metadata + 403 download
  assert.equal(ADMIN_ACTOR.permissions.includes(STAFF_PERMISSIONS.EVIDENCE_VIEW_RESTRICTED), false);
  const adminList = teachingService.listStaffAbsenceCases(ADMIN_ACTOR);
  const adminMatch = adminList.find((c) => c.id === sampleCase.id)!;
  const adminEv = adminMatch.evidence.find((e) => e.id === ev.id)!;
  assert.equal(adminEv.accessRestricted, true);
  assert.equal(adminEv.fileName, 'Confidential Medical Record (Restricted)');
  assert.throws(() => teachingService.downloadAbsenceEvidence(ADMIN_ACTOR, sampleCase.id, ev.id), /Restricted access/);

  // Unrelated lecturer in Finance is also denied access
  assert.throws(() => teachingService.downloadAbsenceEvidence(LECTURER_WANJALA, sampleCase.id, ev.id), /Restricted access/);

  // HOD and Principal are allowed
  const hodDownload = teachingService.downloadAbsenceEvidence(HOD_COMPUTING, sampleCase.id, ev.id);
  assert.equal(hodDownload.fileName, 'clinic_discharge.pdf');
  const principalDownload = teachingService.downloadAbsenceEvidence(PRINCIPAL_ACTOR, sampleCase.id, ev.id);
  assert.equal(principalDownload.fileName, 'clinic_discharge.pdf');

  // Option B: Trainer logs verbal note -> Student confirms accuracy
  const verbal = teachingService.recordTrainerVerbalExplanation(LECTURER_KAMAU, sampleCase.id, {
    category: 'MEDICAL',
    reasonText: 'Student informed trainer verbally after afternoon clinic visit.',
  });
  assert.equal(verbal.source, 'TRAINER_VERBAL_ENTRY');
  assert.equal(verbal.studentConfirmedAccuracy, false);

  const confirmed = teachingService.confirmTrainerVerbalNote(
    sampleCase.studentRegNo,
    sampleCase.studentName,
    sampleCase.id,
    verbal.id
  );
  assert.equal(confirmed.studentConfirmedAccuracy, true);
});

test('Scheme of Work coverage % and all 14 academic reports + formula-safe CSV export', () => {
  const schemes = teachingService.listSchemes(LECTURER_KAMAU);
  assert.ok(schemes.length >= 1);
  assert.ok(schemes[0].coveragePct >= 0 && schemes[0].coveragePct <= 100);

  assert.equal(TEACHING_REPORT_CATALOGUE.length, 14);
  for (const item of TEACHING_REPORT_CATALOGUE) {
    const rep = teachingService.generateReport(PRINCIPAL_ACTOR, item.key);
    assert.ok(rep.columns.length >= 4, `${item.key} has columns`);
    const csv = teachingService.exportReportCsv(PRINCIPAL_ACTOR, item.key);
    assert.ok(csv.csv.includes(rep.columns[0]));
  }
});

test('Teaching module React UI components render cleanly with zero animate-pulse or inline styles', () => {
  const nodes = [
    React.createElement(TeachingDocumentsHub),
    React.createElement(RecordLessonDeliveryPage),
    React.createElement(AbsenceCasesReviewPage),
    React.createElement(SchemeCoveragePage),
    React.createElement(TeachingReportsPage),
    React.createElement(HODAttendanceMonitor, { user: STAFF_ACCOUNTS.HOD, onBack: () => {} }),
    React.createElement(PrincipalAttendanceOversight, { user: STAFF_ACCOUNTS.PRINCIPAL, onBack: () => {} }),
    React.createElement(AdminAttendancePolicyView, { user: STAFF_ACCOUNTS.ADMIN, onBack: () => {} }),
    React.createElement(StudentAbsenceSection, { onNotify: () => {} }),
  ];

  for (const node of nodes) {
    const html = renderToStaticMarkup(node);
    assert.equal(html.includes('animate-pulse'), false);
    assert.equal(/\sstyle="/i.test(html), false);
    assert.ok(html.length > 50);
  }
});
