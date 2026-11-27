import assert from 'node:assert/strict';
import test from 'node:test';

import { mapStudentMasterRecord } from '../src/modules/student/studentProfileAdapter.ts';

const validRecord = {
  id: 'student-db-001',
  registrationNumber: 'HCA/STU/2026/001',
  admissionId: 'ADM-2026-001',
  fullName: 'Test Student',
  email: 'student@example.com',
  phoneNumber: '+254700000000',
  campusId: 'campus-kitengela',
  campusName: 'Kitengela Campus',
  departmentId: 'department-ict',
  departmentName: 'Information Technology',
  programmeId: 'programme-ict',
  programmeName: 'Diploma in ICT',
  intakeName: 'September 2026',
  feeBalanceKes: 18000,
  attendanceRatePct: 88,
  admissionDate: '2026-09-01T00:00:00.000Z',
  status: 'ACTIVE',
};

test('maps the authenticated database student record', () => {
  const profile = mapStudentMasterRecord(validRecord);

  assert.equal(profile.id, 'student-db-001');
  assert.equal(profile.registrationNumber, 'HCA/STU/2026/001');
  assert.equal(profile.fullName, 'Test Student');
  assert.equal(profile.campus, 'Kitengela Campus');
  assert.equal(profile.feeBalance, 18000);
  assert.equal(profile.attendanceRate, 88);
});

test('does not fabricate a national identification number', () => {
  const profile = mapStudentMasterRecord(validRecord);

  assert.equal(profile.nationalId, '');
});

test('normalizes attendance percentage safely', () => {
  const low = mapStudentMasterRecord({
    ...validRecord,
    attendanceRatePct: -10,
  });

  const high = mapStudentMasterRecord({
    ...validRecord,
    attendanceRatePct: 150,
  });

  assert.equal(low.attendanceRate, 0);
  assert.equal(high.attendanceRate, 100);
});

test('rejects incomplete student identity', () => {
  assert.throws(
    () =>
      mapStudentMasterRecord({
        ...validRecord,
        registrationNumber: '',
      }),
    /institutional student record is incomplete/i
  );
});

test('does not convert missing fee balance into a negative value', () => {
  const profile = mapStudentMasterRecord({
    ...validRecord,
    feeBalanceKes: null,
  });

  assert.equal(profile.feeBalance, 0);
});

test('maps student status correctly', () => {
  assert.equal(
    mapStudentMasterRecord({
      ...validRecord,
      status: 'SUSPENDED',
    }).status,
    'SUSPENDED'
  );

  assert.equal(
    mapStudentMasterRecord({
      ...validRecord,
      status: 'GRADUATED',
    }).status,
    'GRADUATED'
  );
});
