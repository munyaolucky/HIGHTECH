import type { StudentProfile } from '../../types';

export interface StudentMasterRecord {
  id: string;
  registrationNumber: string;
  admissionId?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  campusId?: string | null;
  campusName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  programmeId?: string | null;
  programmeName?: string | null;
  intakeName?: string | null;
  feeBalanceKes?: number | null;
  attendanceRatePct?: number | null;
  admissionDate?: string | null;
  status: string;
}

function normalizeStatus(value: string): StudentProfile['status'] {
  const status = value.toUpperCase();

  if (status === 'DEFERRED') return 'DEFERRED';
  if (status === 'SUSPENDED') return 'SUSPENDED';
  if (status === 'GRADUATED') return 'GRADUATED';

  return 'ACTIVE';
}

export function mapStudentMasterRecord(
  record: StudentMasterRecord
): StudentProfile {
  if (
    !record.id ||
    !record.registrationNumber ||
    !record.fullName ||
    !record.email
  ) {
    throw new Error('The institutional student record is incomplete.');
  }

  return {
    id: record.id,
    registrationNumber: record.registrationNumber,
    admissionNumber: record.admissionId || record.registrationNumber,

    fullName: record.fullName,
    email: record.email,
    phoneNumber: record.phoneNumber ?? '',

    // The database stores a national ID hash, not the original ID.
    // Never substitute or fabricate the ID.
    nationalId: '',

    programme: record.programmeName ?? 'Not assigned',
    department: record.departmentName ?? 'Not assigned',
    campus: record.campusName ?? 'Not assigned',

    // These are not supplied by the current SIS list endpoint.
    // They must be populated by their respective academic APIs.
    academicYear: 'Not synchronized',
    semester: record.intakeName ?? 'Not assigned',
    registeredCourses: 0,
    gpa: 0,
    libraryFines: 0,

    attendanceRate: Math.min(
      100,
      Math.max(0, Number(record.attendanceRatePct ?? 0))
    ),

    feeBalance: Math.max(0, Number(record.feeBalanceKes ?? 0)),

    admissionDate: record.admissionDate ?? '',
    status: normalizeStatus(record.status),
  };
}
