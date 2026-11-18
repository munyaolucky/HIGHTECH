import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

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

const { studentPortalService } = await import('../src/services/studentPortalService.ts');
const { examAssessmentService } = await import('../src/services/examAssessmentService.ts');

beforeEach(() => {
  globalThis.localStorage.clear();
});

test('saveOnboardingDraft persists partial fields without validation errors and tracks timestamp', () => {
  studentPortalService.setOnboardingStage('INVITED');
  const draft = studentPortalService.saveOnboardingDraft({
    email: 'partial-not-valid',
    residenceAddress: 'Ro',
    nextOfKinRelation: 'Uncle',
  });

  assert.equal(draft.ok, true);
  assert.ok(draft.savedAt);

  const state = studentPortalService.getState();
  assert.equal(state.onboardingStage, 'INCOMPLETE');
  assert.equal(state.contact.email, 'partial-not-valid');
  assert.equal(state.contact.nextOfKinRelation, 'Uncle');
  assert.equal(state.onboardingDraftSavedAt, draft.savedAt);
});

test('submitOnboardingProfile returns structured fieldErrors on invalid fields and succeeds when valid', () => {
  studentPortalService.setOnboardingStage('INCOMPLETE');

  const invalid = studentPortalService.submitOnboardingProfile({
    email: 'bad-email',
    phoneNumber: '123',
    residenceAddress: 'ab',
    nextOfKinName: 'A',
    nextOfKinRelation: 'X',
    nextOfKinPhone: '45',
  });

  assert.equal(invalid.ok, false);
  assert.ok(invalid.fieldErrors);
  assert.ok(invalid.fieldErrors.email);
  assert.ok(invalid.fieldErrors.phoneNumber);
  assert.ok(invalid.fieldErrors.residenceAddress);
  assert.ok(invalid.fieldErrors.nextOfKinName);
  assert.ok(invalid.fieldErrors.nextOfKinRelation);
  assert.ok(invalid.fieldErrors.nextOfKinPhone);

  const valid = studentPortalService.submitOnboardingProfile({
    email: 'amina.wanjiku@students.hitech.ac.ke',
    phoneNumber: '+254 712 345 678',
    residenceAddress: 'Kasarani Academic Gardens, Nairobi',
    nextOfKinName: 'Grace Njeri Wanjiku',
    nextOfKinRelation: 'Mother / Guardian',
    nextOfKinPhone: '+254 722 910 445',
  });

  assert.equal(valid.ok, true);
  const updated = studentPortalService.getState();
  assert.equal(updated.onboardingStage, 'SUBMITTED');
  assert.equal(updated.onboardingSubmissions[0]?.stage, 'SUBMITTED');
});

test('getProfileCompletion reflects missing vs complete items accurately', () => {
  const full = studentPortalService.getProfileCompletion();
  assert.equal(full.percent, 100);
  assert.equal(full.missingFields.length, 0);

  const partial = studentPortalService.getProfileCompletion({
    email: 'invalid',
    nextOfKinRelation: '',
  });
  assert.ok(partial.percent < 100);
  assert.ok(partial.missingFields.includes('Student Email'));
  assert.ok(partial.missingFields.includes('Next of Kin Relationship'));
});

test('setOnboardingStage supports all 8 documented landing states cleanly', () => {
  const stages = [
    'INVITED',
    'PENDING',
    'INCOMPLETE',
    'SUBMITTED',
    'RETURNED',
    'VERIFIED',
    'SUSPENDED',
    'GRADUATED',
  ] as const;

  for (const stage of stages) {
    const res = studentPortalService.setOnboardingStage(stage, `Note for ${stage}`);
    assert.equal(res.ok, true);
    const st = studentPortalService.getState();
    assert.equal(st.onboardingStage, stage);
    assert.equal(st.onboardingReviewerNote, `Note for ${stage}`);
    if (stage === 'SUSPENDED') assert.equal(st.profile.status, 'SUSPENDED');
    if (stage === 'GRADUATED') assert.equal(st.profile.status, 'GRADUATED');
    if (stage === 'VERIFIED') assert.equal(st.profile.status, 'ACTIVE');
  }
});

test('submitAssignment accepts real file attachment with or without note and blocks duplicate submissions', () => {
  const stateBefore = studentPortalService.getState();
  const pending = stateBefore.assignments.find((a) => a.status === 'PENDING');
  assert.ok(pending);

  const empty = studentPortalService.submitAssignment(pending.id, 'hi');
  assert.equal(empty.ok, false);

  const okFileOnly = studentPortalService.submitAssignment(pending.id, '', {
    fileName: 'cloud_rest_api_lab.pdf',
    fileSize: '420 KB',
  });
  assert.equal(okFileOnly.ok, true);

  const stateAfter = studentPortalService.getState();
  const submitted = stateAfter.assignments.find((a) => a.id === pending.id);
  assert.equal(submitted?.status, 'SUBMITTED');
  assert.equal(submitted?.attachmentName, 'cloud_rest_api_lab.pdf');
  assert.equal(submitted?.attachmentSize, '420 KB');

  const duplicate = studentPortalService.submitAssignment(pending.id, 'Retry submission');
  assert.equal(duplicate.ok, false);
});

test('uploadOrReplaceDocument records file metadata and sets Under Review on replace', () => {
  const initialDocs = studentPortalService.getState().uploadedDocuments;
  assert.ok(initialDocs.length > 0);
  const targetDoc = initialDocs[0];

  const replaced = studentPortalService.uploadOrReplaceDocument(
    targetDoc.id,
    targetDoc.docType,
    'Updated_KCSE_Certified.pdf',
    '1.4 MB'
  );
  assert.equal(replaced.ok, true);

  const afterReplace = studentPortalService
    .getState()
    .uploadedDocuments.find((d) => d.id === targetDoc.id);
  assert.equal(afterReplace?.fileName, 'Updated_KCSE_Certified.pdf');
  assert.equal(afterReplace?.fileSize, '1.4 MB');
  assert.equal(afterReplace?.verificationStatus, 'Under Review');

  const uploadedNew = studentPortalService.uploadOrReplaceDocument(
    null,
    'Industrial Attachment Insurance Letter',
    'NITA_Cover_2026.pdf',
    '310 KB'
  );
  assert.equal(uploadedNew.ok, true);
  assert.equal(studentPortalService.getState().uploadedDocuments[0]?.fileName, 'NITA_Cover_2026.pdf');
});

test('submitUnitChangeRequest and submitAppeal enforce validation before persisting', () => {
  const badUnit = studentPortalService.submitUnitChangeRequest({
    action: 'ADD',
    unitCode: 'AI 310',
    reason: 'no',
  });
  assert.equal(badUnit.ok, false);

  const goodUnit = studentPortalService.submitUnitChangeRequest({
    action: 'ADD',
    unitCode: 'AI 310 — Applied Machine Learning',
    reason: 'Elective aligns with final-year project track.',
  });
  assert.equal(goodUnit.ok, true);

  const badAppeal = studentPortalService.submitAppeal({
    category: 'GRADE_REMARKING',
    unitCode: 'CSC 301',
    subject: 'CAT',
    evidenceRef: '',
    reason: 'short',
  });
  assert.equal(badAppeal.ok, false);

  const goodAppeal = studentPortalService.submitAppeal({
    category: 'GRADE_REMARKING',
    unitCode: 'CSC 301',
    subject: 'CAT 2 Question 3 Remarking Request',
    evidenceRef: 'CAT2_Script_Scan.pdf',
    reason: 'Step 2 Big-O derivation was correct per class marking scheme.',
  });
  assert.equal(goodAppeal.ok, true);
});

test('examAssessmentService marks FILE_UPLOAD questions as manual-marking (autoMarkable === false)', () => {
  const res = examAssessmentService.createDraftQuestion(
    {
      code: 'Q-FILE-TEST-1',
      unitCode: 'SWE 304',
      topic: 'Cloud Deployment Architecture',
      difficulty: 'MEDIUM',
      catalogueTypeId: 14,
      kind: 'FILE_UPLOAD',
      marks: 15,
      prompt: 'Upload your Terraform deployment diagram and IAM policy PDF.',
    },
    'LECTURER_AUTHOR'
  );
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.question.kind, 'FILE_UPLOAD');
    assert.equal(res.question.autoMarkable, false);
  }
});
