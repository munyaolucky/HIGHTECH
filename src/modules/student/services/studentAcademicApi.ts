export type AcademicUnitStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StudentRegisteredUnit {
  code: string;
  title: string;
  credits: number;
}

export interface StudentAcademicRegistration {
  id: string;
  academicPeriodId: string;
  academicYear: string;
  semesterName: string;
  intakeCode: string;
  startDate: string;
  endDate: string;
  periodStatus: string;
  isCurrent: boolean;
  registrationOpen: boolean;
  approvalStatus: AcademicUnitStatus;
  totalCredits: number;
  feeThresholdCleared: boolean;
  registeredAt: string;
  units: StudentRegisteredUnit[];
}

export interface StudentAcademicUnitsResponse {
  student: {
    registrationNumber: string;
    fullName: string;
    programmeName: string | null;
    campusName: string | null;
    studentStatus: string;
    feeBalanceKes: number;
  };
  registrations: StudentAcademicRegistration[];
}

export async function getMyRegisteredUnits(): Promise<StudentAcademicUnitsResponse> {
  const response = await fetch('/api/student/academic/units', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success || !result?.data) {
    throw new Error(
      result?.error || 'Unable to load your registered academic units.'
    );
  }

  return result.data as StudentAcademicUnitsResponse;
}
