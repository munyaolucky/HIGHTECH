/**
 * HR & Staff Management Types
 * Compliant with HR-STAFF-MANAGEMENT.md
 */

export type HROperatorRole = 'HR_OFFICER_PRIMARY' | 'HR_REVIEWER_INDEPENDENT' | 'STAFF_SELF_SERVICE';

export type StaffEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'ADJUNCT_TRAINER' | 'CONTRACT';
export type StaffEmploymentStatus = 'ACTIVE' | 'PROBATION' | 'ON_LEAVE' | 'TERMINATED';

export type StaffContractStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'TERMINATED';

export type StaffLeaveType = 'ANNUAL' | 'SICK' | 'STUDY' | 'COMPASSIONATE' | 'MATERNITY_PATERNITY';
export type StaffLeaveStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type StaffAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'REMOTE' | 'HALF_DAY' | 'ON_LEAVE';

export type StaffWorkloadType = 'TEACHING' | 'ADMINISTRATION' | 'PROJECTS' | 'SUPERVISION' | 'COMMITTEES';
export type StaffWorkloadStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface StaffMember {
  id: string;
  userId: string;
  employeeNumber: string; // e.g. HCA/STAFF/2026/001
  fullName: string;
  email: string;
  branch: string;
  department: string;
  jobTitle: string;
  employmentType: StaffEmploymentType;
  status: StaffEmploymentStatus;
  joiningDate: string;
  probationEndDate?: string;
  workLocation: string;
  linkedDocumentRefs: string[];
}

export interface StaffContract {
  id: string;
  contractNumber: string;
  staffId: string;
  staffName: string;
  position: string;
  employmentType: StaffEmploymentType;
  startDate: string;
  endDate: string;
  monthlySalaryKes: number;
  status: StaffContractStatus;
  createdByUserId: string;
  createdByName: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewNote?: string;
}

export interface StaffLeaveRequest {
  id: string;
  reference: string;
  staffId: string;
  staffName: string;
  leaveType: StaffLeaveType;
  startDate: string;
  endDate: string;
  requestedDays: number; // half-day increments (0.5)
  reason: string;
  status: StaffLeaveStatus;
  reviewedByName?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface StaffAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // Africa/Nairobi YYYY-MM-DD
  status: StaffAttendanceStatus;
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  note?: string;
}

export interface StaffWorkload {
  id: string;
  staffId: string;
  staffName: string;
  workloadType: StaffWorkloadType;
  courseOfferingCode?: string;
  title: string;
  weeklyHours: number;
  startDate: string;
  endDate: string;
  status: StaffWorkloadStatus;
}
