/**
 * Hostels & Student Welfare Services Types
 * Compliant with HOSTELS-STUDENT-SERVICES.md
 */

export type HostelOperatorRole =
  | 'HOSTEL_OFFICER'
  | 'STUDENT_SERVICES_OFFICER'
  | 'FINANCE_OFFICER'
  | 'STUDENT';

export type OccupancyPolicy =
  | 'MIXED'
  | 'SINGLE_GENDER'
  | 'DESIGNATED_STUDENT_GROUP'
  | 'ACCESSIBILITY_FOCUSED'
  | 'STAFF_ONLY';

export type BedStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export type HostelApplicationStatus =
  | 'SUBMITTED'
  | 'WAITLISTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ALLOCATED';

export type AllocationStatus = 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type VisitorStatus = 'EXPECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

export type ChargeStatus = 'DRAFT' | 'APPROVED' | 'INVOICED' | 'REJECTED';

export type SupportRequestCategory =
  | 'COUNSELLING'
  | 'HEALTH_REFERRAL'
  | 'ACCOMMODATION_WELFARE'
  | 'FINANCIAL_AID'
  | 'GENERAL_SUPPORT';

export type SupportRequestStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type AnnouncementAudience = 'ALL_STUDENTS' | 'HOSTEL_RESIDENTS' | 'STAFF_ONLY';

export interface Hostel {
  id: string;
  code: string;
  name: string;
  branch: string;
  occupancyPolicy: OccupancyPolicy;
  shortDescription: string;
  wardenName: string;
  active: boolean;
}

export interface HostelRoom {
  id: string;
  hostelId: string;
  roomCode: string;
  floor: string;
  capacity: number;
  notes?: string;
}

export interface HostelBed {
  id: string;
  hostelId: string;
  roomId: string;
  bedCode: string;
  status: BedStatus;
}

export interface HostelApplication {
  id: string;
  reference: string;
  studentRegNo: string;
  studentName: string;
  branch: string;
  hostelId: string;
  startDate: string; // YYYY-MM-DD (Africa/Nairobi)
  endDate: string;
  reason: string;
  status: HostelApplicationStatus;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface HostelAllocation {
  id: string;
  applicationId: string;
  studentRegNo: string;
  studentName: string;
  hostelId: string;
  roomId: string;
  bedId: string;
  startDate: string;
  endDate: string;
  status: AllocationStatus;
  checkedInBy?: string;
  checkedInAt?: string;
  checkedOutBy?: string;
  checkedOutAt?: string;
}

export interface HostelMaintenanceRequest {
  id: string;
  reference: string;
  hostelId: string;
  roomId: string;
  bedId?: string;
  reportedByRegNo: string;
  reportedByName: string;
  issueTitle: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: MaintenanceStatus;
  resolutionNote?: string;
  createdAt: string;
}

export interface HostelVisitor {
  id: string;
  hostelId: string;
  allocationId: string;
  residentRegNo: string;
  residentName: string;
  visitorName: string;
  visitorIdNo: string;
  expectedDate: string;
  purpose: string;
  status: VisitorStatus;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface HostelCharge {
  id: string;
  chargeRef: string;
  allocationId: string;
  studentRegNo: string;
  studentName: string;
  description: string;
  amount: number;
  currency: 'KES';
  status: ChargeStatus;
  createdByActorId: string;
  createdByName: string;
  approvedByActorId?: string;
  approvedByName?: string;
  draftInvoiceRef?: string;
  createdAt: string;
}

export interface StudentServiceUpdate {
  id: string;
  author: string;
  note: string;
  createdAt: string;
}

export interface StudentServiceRequest {
  id: string;
  caseRef: string;
  studentRegNo: string;
  studentName: string;
  branch: string;
  category: SupportRequestCategory;
  restricted: boolean;
  subject: string;
  description: string;
  status: SupportRequestStatus;
  assignedToActorId?: string;
  assignedToName?: string;
  updates: StudentServiceUpdate[];
  createdAt: string;
}

export interface HostelAnnouncement {
  id: string;
  title: string;
  body: string;
  branch: string;
  hostelId?: string;
  audience: AnnouncementAudience;
  active: boolean;
  publishedBy: string;
  publishedAt: string;
}
