export interface CurriculumUnitOption {
  code: string;
  title: string;
  credits: number;
  department: string;
}

export const HITECH_CURRICULUM_UNITS: CurriculumUnitOption[] = [
  {
    code: 'ICT-201',
    title: 'Database Systems & PostgreSQL Administration',
    credits: 4,
    department: 'Computing & Informatics',
  },
  {
    code: 'ICT-204',
    title: 'Web Systems Engineering & REST APIs',
    credits: 4,
    department: 'Computing & Informatics',
  },
  {
    code: 'ICT-207',
    title: 'Systems Analysis & Software Architecture',
    credits: 3,
    department: 'Computing & Informatics',
  },
  {
    code: 'ICT-209',
    title: 'Applied Cybersecurity & Network Defense',
    credits: 4,
    department: 'Computing & Informatics',
  },
  {
    code: 'ICT-310',
    title: 'Cloud Infrastructure & DevOps Automation',
    credits: 3,
    department: 'Computing & Informatics',
  },
  {
    code: 'BUS-202',
    title: 'Management Accounting & Institutional Finance',
    credits: 3,
    department: 'Business & Accounting',
  },
  {
    code: 'BUS-205',
    title: 'Entrepreneurship & Business Plan Development',
    credits: 3,
    department: 'Business & Accounting',
  },
  {
    code: 'COM-101',
    title: 'Technical Communication & Professional Ethics',
    credits: 2,
    department: 'General Studies',
  },
];

export interface AcademicRegistrationApiRecord {
  id: string;
  studentProfileId: string;
  academicPeriodId: string;
  unitsJson: Array<{ code: string; title: string; credits: number }>;
  totalCredits: number;
  feeThresholdCleared: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  approvedByName: string | null;
  createdAt: string;
  updatedAt: string;
  studentName: string;
  registrationNumber: string;
  programmeName: string | null;
  campusName: string | null;
  studentStatus: string;
  feeBalanceKes: number;
  academicYear: string;
  semesterName: string;
  intakeCode: string;
  registrationOpen: boolean;
}

export interface AcademicPeriodApiRecord {
  id: string;
  academicYear: string;
  semesterName: string;
  intakeCode: string;
  startDate: string;
  endDate: string;
  registrationOpen: boolean;
  isCurrent: boolean;
  status: string;
}
