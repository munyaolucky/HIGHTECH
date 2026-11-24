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
const {
  PRIVATE_DMS_STORAGE_ROOT,
  resolveSafeStoragePath,
  signDownloadToken,
  verifyDownloadToken,
} = await import('../server/modules/documents/documents.storage.ts');
const { STUDENT_DOCUMENT_PERMISSIONS } = await import(
  '../server/modules/documents/documents.permissions.ts'
);
const { DocumentAccessError, documentsService } = await import(
  '../server/modules/documents/documents.service.ts'
);
const { PortalShellProvider } = await import('../src/context/PortalShellContext.tsx');
const { default: UniversalDocumentUploader } = await import(
  '../src/modules/documents/UniversalDocumentUploader.tsx'
);
const { default: ModuleDocumentRepository } = await import(
  '../src/modules/documents/ModuleDocumentRepository.tsx'
);
const { default: DocumentUploadPage } = await import(
  '../src/modules/documents/DocumentUploadPage.tsx'
);
const { default: DocumentManagementPortal } = await import(
  '../src/modules/documents/DocumentManagementPortal.tsx'
);
const { default: StudentDmsWorkspace } = await import(
  '../src/modules/student/components/StudentDmsWorkspace.tsx'
);

import type { DocumentActor } from '../server/modules/documents/documents.policy.ts';

const createdStoragePaths: string[] = [];

function snapshotStorageFiles(): Set<string> {
  const files = new Set<string>();
  if (!fs.existsSync(PRIVATE_DMS_STORAGE_ROOT)) return files;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.add(full);
    }
  };
  walk(PRIVATE_DMS_STORAGE_ROOT);
  return files;
}

const initialStorageFiles = snapshotStorageFiles();

beforeEach(() => {
  globalThis.localStorage.clear();
});

after(() => {
  for (const rel of createdStoragePaths) {
    try {
      const abs = resolveSafeStoragePath(rel);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {
      // Ignore cleanup errors
    }
  }
  if (fs.existsSync(PRIVATE_DMS_STORAGE_ROOT)) {
    const walkClean = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkClean(full);
        else if (!initialStorageFiles.has(full)) fs.unlinkSync(full);
      }
    };
    walkClean(PRIVATE_DMS_STORAGE_ROOT);
  }
  if (hadExistingDbFile && originalDbFileContents !== null) {
    fs.writeFileSync(dbFilePath, originalDbFileContents, 'utf8');
  } else if (!hadExistingDbFile && fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
  }
});

function buildStaffActor(role: string): DocumentActor {
  const store = getDb();
  const matched = store.staffAccounts.find((s) => s.role === role);
  assert.ok(matched, `Expected seeded staff account for role ${role}`);
  return {
    id: matched.id,
    employeeNumber: matched.employeeNumber,
    fullName: matched.fullName,
    email: matched.email,
    role: matched.role,
    roleTitle: matched.roleTitle,
    departmentId: matched.departmentId,
    department: matched.department,
    campusId: matched.campusId,
    campus: matched.campus,
    permissions: matched.permissions,
    documentPermissions: matched.documentPermissions,
  };
}

function buildStudentActor(): DocumentActor {
  return {
    id: 'stu-test-001',
    employeeNumber: 'HCA/2026/CS/0101',
    registrationNumber: 'HCA/2026/CS/0101',
    fullName: 'Amina Wanjiku',
    email: 'amina.wanjiku@student.hitech.ac.ke',
    role: 'STUDENT',
    roleTitle: 'Registered Student',
    departmentId: 'dept-computing',
    department: 'School of Computing & ICT',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    permissions: [],
    documentPermissions: [...STUDENT_DOCUMENT_PERMISSIONS],
  };
}

function validPdfBase64(label = 'HI-TECH Valid PDF Payload'): string {
  return Buffer.from(`%PDF-1.4\n% ${label}\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF`, 'utf8').toString('base64');
}

function assertCleanMarkup(html: string, label: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${label}: must not include animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${label}: must not include inline style attributes`);
}

test('DMS security quarantine blocks double extensions, spoofed magic bytes, EICAR, scripts, and category size overruns', () => {
  const student = buildStudentActor();
  const admin = buildStaffActor('ADMIN');

  // 1. Double extension
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'Double Ext Slip',
        category: 'FEE_STATEMENT',
        fileName: 'slip.pdf.exe',
        mimeType: 'application/pdf',
        sizeBytes: 120,
        contentBase64: validPdfBase64(),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 422
  );

  // 2. Spoofed PDF with MZ PE executable header
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'Spoofed EXE as PDF',
        category: 'FEE_STATEMENT',
        fileName: 'receipt.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 64,
        contentBase64: Buffer.from('MZ\x90\x00ThisIsExecutable', 'latin1').toString('base64'),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 422
  );

  // 3. Spoofed PDF without %PDF- magic bytes
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'Plain Text Disguised as PDF',
        category: 'FEE_STATEMENT',
        fileName: 'fake.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 40,
        contentBase64: Buffer.from('Hello not a real PDF document', 'utf8').toString('base64'),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 422
  );

  // 4. EICAR test signature inside .txt
  const eicar = ['X5O!P%@AP[4\\PZX54(P^)7CC)7}$', 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'].join('');
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'EICAR Test File',
        category: 'ASSIGNMENT_SUBMISSION',
        fileName: 'notes.txt',
        mimeType: 'text/plain',
        sizeBytes: eicar.length,
        contentBase64: Buffer.from(eicar, 'utf8').toString('base64'),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 422
  );

  // 5. Embedded <script> tag inside .txt
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'XSS Payload File',
        category: 'ASSIGNMENT_SUBMISSION',
        fileName: 'xss.txt',
        mimeType: 'text/plain',
        sizeBytes: 42,
        contentBase64: Buffer.from('hello <script>alert(1)</script>', 'utf8').toString('base64'),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 422
  );

  // Verify quarantine events logged
  const auditLogs = documentsService.listGlobalAuditLogs(admin);
  assert.ok(auditLogs.some((l) => l.action === 'DOCUMENT_QUARANTINED'));

  // 6. Per-category maxSizeMb enforcement
  const origFeeCap =
    documentsService.listCategories().find((c) => c.code === 'FEE_STATEMENT')?.maxSizeMb ?? 10;
  documentsService.updateCategoryConfig(admin, 'FEE_STATEMENT', { maxSizeMb: 1 });
  const oversized = Buffer.alloc(1024 * 1024 + 512, 0x41);
  Buffer.from('%PDF-1.4\n').copy(oversized, 0);
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'Oversized Fee Slip',
        category: 'FEE_STATEMENT',
        fileName: 'oversized.pdf',
        mimeType: 'application/pdf',
        sizeBytes: oversized.byteLength,
        contentBase64: oversized.toString('base64'),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 422
  );
  documentsService.updateCategoryConfig(admin, 'FEE_STATEMENT', { maxSizeMb: origFeeCap });
});

test('DMS enforces private storage outside public/, blocks path traversal, and verifies HMAC signed download URLs', () => {
  const lecturer = buildStaffActor('LECTURER');

  assert.throws(
    () => resolveSafeStoragePath('../../public/index.html'),
    /Path traversal rejected|escapes private DMS root/i
  );
  assert.equal(PRIVATE_DMS_STORAGE_ROOT.includes(`${path.sep}public`), false);

  const uploaded = documentsService.uploadDocument(lecturer, {
    title: 'OOP Lecture Handout',
    category: 'LEARNING_MATERIAL',
    confidentiality: 'INTERNAL',
    moduleKey: 'LECTURER',
    fileName: 'oop-week1.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 128,
    contentBase64: validPdfBase64('OOP Lecture Handout Content'),
  });
  assert.ok(uploaded.document.storagePath);
  createdStoragePaths.push(uploaded.document.storagePath);

  const absStored = resolveSafeStoragePath(uploaded.document.storagePath);
  assert.ok(absStored.startsWith(PRIVATE_DMS_STORAGE_ROOT));
  assert.equal(fs.existsSync(absStored), true);

  // Issue signed URL and download
  const signed = documentsService.issueSignedDownloadUrl(lecturer, uploaded.document.id);
  assert.ok(signed.url.startsWith('/api/documents/download?token='));
  assert.ok(verifyDownloadToken(signed.token));

  const stream = documentsService.streamAuthorizedDownload(signed.token, lecturer);
  assert.ok(stream.buffer.toString('utf8').includes('OOP Lecture Handout Content'));

  // Audit trail records DOCUMENT_DOWNLOADED
  const detail = documentsService.getDocumentDetail(lecturer, uploaded.document.id);
  assert.ok(detail.auditLogs.some((a) => a.action === 'DOCUMENT_DOWNLOADED'));

  // Tampered & expired HMAC tokens are rejected
  const tamperedToken = `${signed.token}tamper`;
  assert.equal(verifyDownloadToken(tamperedToken), null);
  assert.throws(
    () => documentsService.streamAuthorizedDownload(tamperedToken, lecturer),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 403
  );

  // Manually craft expired token payload with invalid/past expiry
  const expiredB64 = Buffer.from(
    JSON.stringify({ docId: uploaded.document.id, userId: lecturer.id, exp: Date.now() - 5000 }),
    'utf8'
  ).toString('base64url');
  assert.equal(verifyDownloadToken(`${expiredB64}.bad`), null);

  // Valid helper with short TTL check
  const fresh = signDownloadToken({ docId: uploaded.document.id, userId: lecturer.id }, 60);
  assert.equal(verifyDownloadToken(fresh.token)?.docId, uploaded.document.id);
});

test('DMS enforces RBAC, unpublished exam isolation, Super Admin confidentiality restriction, and self-approval ban', () => {
  const student = buildStudentActor();
  const lecturer = buildStaffActor('LECTURER');
  const admin = buildStaffActor('ADMIN');
  const registrar = buildStaffActor('REGISTRAR');
  const hr = buildStaffActor('HR');
  const studentAffairs = buildStaffActor('STUDENT_AFFAIRS');
  const examsOfficer = buildStaffActor('EXAMINATIONS_OFFICER');

  // Student allowed upload
  const assignment = documentsService.uploadDocument(student, {
    title: 'Database Systems Assignment 1',
    category: 'ASSIGNMENT_SUBMISSION',
    moduleKey: 'STUDENT',
    fileName: 'db-assign1.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 90,
    contentBase64: validPdfBase64('Student Assignment 1'),
  });
  if (assignment.document.storagePath) createdStoragePaths.push(assignment.document.storagePath);

  // Student blocked from restricted staff/exam categories
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'Unauthorized Exam Paper Upload',
        category: 'EXAM_SCHEDULE',
        fileName: 'exam.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 90,
        contentBase64: validPdfBase64(),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 403
  );
  assert.throws(
    () =>
      documentsService.uploadDocument(student, {
        title: 'Unauthorized HR Upload',
        category: 'EMPLOYMENT_CONTRACT',
        fileName: 'contract.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 90,
        contentBase64: validPdfBase64(),
      }),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 403
  );

  // Unpublished exam isolation
  const examPaper = documentsService.uploadDocument(examsOfficer, {
    title: 'CS302 Final Examination Paper (Draft)',
    category: 'EXAM_SCHEDULE',
    confidentiality: 'RESTRICTED',
    moduleKey: 'EXAMINATION',
    fileName: 'cs302-final.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    contentBase64: validPdfBase64('CONFIDENTIAL EXAM PAPER'),
  });
  if (examPaper.document.storagePath) createdStoragePaths.push(examPaper.document.storagePath);

  assert.throws(
    () => documentsService.getDocumentDetail(student, examPaper.document.id),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 403
  );
  assert.throws(
    () => documentsService.issueSignedDownloadUrl(student, examPaper.document.id),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 403
  );
  const studentListing = documentsService.listDocuments(student, { pageSize: 100 });
  assert.equal(
    studentListing.items.some((d) => d.id === examPaper.document.id),
    false
  );

  // Confidential Welfare, Medical Absence, and HR Contracts blocked from Super Admin (ADMIN)
  const welfareDoc = documentsService.uploadDocument(student, {
    title: 'Confidential Counselling Referral',
    category: 'STUDENT_WELFARE_CONFIDENTIAL',
    confidentiality: 'RESTRICTED',
    moduleKey: 'STUDENT',
    fileName: 'welfare-note.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 90,
    contentBase64: validPdfBase64('Welfare Note'),
  });
  if (welfareDoc.document.storagePath) createdStoragePaths.push(welfareDoc.document.storagePath);

  const medicalDoc = documentsService.uploadDocument(student, {
    title: 'Clinical Medical Sick-Off Note',
    category: 'ABSENCE_EXPLANATION',
    confidentiality: 'RESTRICTED',
    moduleKey: 'STUDENT',
    fileName: 'medical-note.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 90,
    contentBase64: validPdfBase64('Medical Note'),
  });
  if (medicalDoc.document.storagePath) createdStoragePaths.push(medicalDoc.document.storagePath);

  const hrContract = documentsService.uploadDocument(hr, {
    title: 'Confidential Lecturer Employment Contract',
    category: 'EMPLOYMENT_CONTRACT',
    confidentiality: 'RESTRICTED',
    moduleKey: 'HR',
    fileName: 'lecturer-contract.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 90,
    contentBase64: validPdfBase64('HR Contract'),
  });
  if (hrContract.document.storagePath) createdStoragePaths.push(hrContract.document.storagePath);

  for (const restrictedId of [
    welfareDoc.document.id,
    medicalDoc.document.id,
    hrContract.document.id,
    examPaper.document.id,
  ]) {
    assert.throws(
      () => documentsService.getDocumentDetail(admin, restrictedId),
      (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 403,
      `ADMIN must not bypass confidential boundary for ${restrictedId}`
    );
  }

  // Domain-authorized offices CAN inspect their domain's confidential record
  assert.equal(
    documentsService.getDocumentDetail(studentAffairs, welfareDoc.document.id).document.id,
    welfareDoc.document.id
  );
  assert.equal(
    documentsService.getDocumentDetail(registrar, medicalDoc.document.id).document.id,
    medicalDoc.document.id
  );
  assert.equal(
    documentsService.getDocumentDetail(hr, hrContract.document.id).document.id,
    hrContract.document.id
  );

  // ADMIN CAN manage system configuration & run backup integrity check
  const backupReport = documentsService.runBackupIntegrityCheck(admin);
  assert.equal(backupReport.status, 'HEALTHY');
  assert.ok(backupReport.verifiedChecksums >= 1);

  // Self-approval ban enforced
  const lessonPlan = documentsService.uploadDocument(lecturer, {
    title: 'Week 4 Lesson Plan',
    category: 'LESSON_PLAN',
    moduleKey: 'LECTURER',
    fileName: 'week4-plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 90,
    contentBase64: validPdfBase64('Lesson Plan'),
    submitNow: true,
  });
  if (lessonPlan.document.storagePath) createdStoragePaths.push(lessonPlan.document.storagePath);

  assert.throws(
    () => documentsService.approveDocument(lecturer, lessonPlan.document.id, 'Self approve'),
    (err: unknown) => err instanceof DocumentAccessError && err.statusCode === 403
  );
});

test('Absence workflow bridge updates studentAbsenceCases to DOCUMENT_SUBMITTED and logs absenceEvidence', () => {
  const student = buildStudentActor();
  const db = getDb();
  const caseId = `abscase-dms-${Date.now()}`;
  const now = new Date().toISOString();

  db.studentAbsenceCases.unshift({
    id: caseId,
    studentRegNo: student.registrationNumber!,
    studentName: student.fullName,
    courseCode: 'CS-301',
    courseTitle: 'Distributed Systems',
    departmentId: 'dept-computing',
    missedLessonsCount: 3,
    absencePercentage: 18,
    status: 'AWAITING_EXPLANATION',
    explanationText: null,
    explanationCategory: null,
    submittedAt: null,
    hodDecisionBy: null,
    hodDecisionNote: null,
    hodDecidedAt: null,
    principalDecisionBy: null,
    principalDecisionNote: null,
    principalDecidedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  saveDb(db);

  const uploaded = documentsService.uploadDocument(student, {
    title: 'Hospital Outpatient Medical Note',
    category: 'ABSENCE_EXPLANATION',
    confidentiality: 'RESTRICTED',
    moduleKey: 'STUDENT',
    relatedEntityType: 'ABSENCE_CASE',
    relatedEntityId: caseId,
    fileName: 'hospital-note.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 110,
    contentBase64: validPdfBase64('Outpatient Certificate'),
  });
  if (uploaded.document.storagePath) createdStoragePaths.push(uploaded.document.storagePath);

  const updatedDb = getDb();
  const updatedCase = updatedDb.studentAbsenceCases.find((c) => c.id === caseId);
  assert.ok(updatedCase);
  assert.equal(updatedCase.status, 'DOCUMENT_SUBMITTED');

  const evidence = updatedDb.absenceEvidence.find((e) => e.absenceCaseId === caseId);
  assert.ok(evidence);
  assert.equal(evidence.fileName, 'hospital-note.pdf');
  assert.equal(evidence.isConfidentialMedical, true);
});

test('SSR and static source hygiene for unified DMS components', () => {
  const filesToInspect = [
    'src/modules/documents/UniversalDocumentUploader.tsx',
    'src/modules/documents/ModuleDocumentRepository.tsx',
    'src/modules/documents/DocumentUploadPage.tsx',
    'src/modules/documents/DocumentManagementPortal.tsx',
    'src/modules/student/components/StudentDmsWorkspace.tsx',
  ];

  for (const rel of filesToInspect) {
    const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
    assert.equal(src.includes('animate-pulse'), false, `${rel} must not contain animate-pulse`);
    assert.equal(/\sstyle=\{/.test(src) || /\sstyle="/.test(src), false, `${rel} must not contain inline styles`);
    assert.equal(src.includes('window.alert'), false, `${rel} must not call window.alert`);
    assert.equal(src.includes('window.confirm'), false, `${rel} must not call window.confirm`);
    assert.equal(src.includes('window.open'), false, `${rel} must not call window.open`);
  }

  const uploaderHtml = renderToStaticMarkup(
    React.createElement(UniversalDocumentUploader, {
      moduleKey: 'STUDENT',
      isStudent: true,
    })
  );
  assert.ok(uploaderHtml.includes('Upload Institutional Document'));
  assertCleanMarkup(uploaderHtml, 'UniversalDocumentUploader');

  const repoHtml = renderToStaticMarkup(
    React.createElement(ModuleDocumentRepository, {
      moduleKey: 'ALL',
      title: 'Document Repository',
      description: 'Centralised institutional document vault',
      isStudentView: true,
    })
  );
  assert.ok(repoHtml.includes('Document Repository'));
  assertCleanMarkup(repoHtml, 'ModuleDocumentRepository');

  const uploadPageHtml = renderToStaticMarkup(
    React.createElement(DocumentUploadPage, {
      onUploaded: () => {},
      onCancel: () => {},
    })
  );
  assert.ok(uploadPageHtml.includes('Upload Institutional Document'));
  assertCleanMarkup(uploadPageHtml, 'DocumentUploadPage');

  const studentWorkspaceHtml = renderToStaticMarkup(
    React.createElement(StudentDmsWorkspace, {
      onNotify: () => {},
    })
  );
  assert.ok(studentWorkspaceHtml.includes('My Central Document Vault'));
  assertCleanMarkup(studentWorkspaceHtml, 'StudentDmsWorkspace');

  const adminUser = buildStaffActor('ADMIN');
  const hubHtml = renderToStaticMarkup(
    React.createElement(PortalShellProvider, {
      currentRole: 'admin',
      children: React.createElement(DocumentManagementPortal, {
        user: adminUser as Parameters<typeof DocumentManagementPortal>[0]['user'],
        initialTab: 'config',
      }),
    })
  );
  assert.ok(hubHtml.includes('Document Management'));
  assertCleanMarkup(hubHtml, 'DocumentManagementPortal');
});
