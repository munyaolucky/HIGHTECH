/**
 * Campus Services Suite Types
 * Covers Digital Credentials Verification, Admissions CRM, Campus Appointments & Compliance/Data Quality
 */

export type CampusServicesRole =
  | 'REQUESTOR_STAFF'
  | 'APPROVER_REGISTRAR'
  | 'PUBLIC_OR_STUDENT';

export type CredentialStatus = 'REQUESTED' | 'APPROVED' | 'ISSUED' | 'REVOKED' | 'REPLACED';

export interface DigitalCredential {
  id: string;
  verificationCode: string; // e.g. HTC-2026-8419-K7 (checksummed)
  studentRegNo: string;
  firstName: string;
  lastName: string;
  programme: string;
  awardType: 'DIPLOMA_CERTIFICATE' | 'OFFICIAL_TRANSCRIPT' | 'CDACC_COMPETENCY';
  issueDate: string;
  completionDate: string;
  status: CredentialStatus;
  requestedByUserId: string;
  requestedByName: string;
  approvedByUserId?: string;
  approvedByName?: string;
  revokedReason?: string;
  replacedByCode?: string;
  verificationCount: number;
  lastVerifiedAt?: string;
}

export interface PublicCredentialVerificationResult {
  found: boolean;
  maskedHolderName?: string; // First name + last initial ONLY (privacy minimization)
  programme?: string;
  awardType?: string;
  issueDate?: string;
  completionDate?: string;
  status?: CredentialStatus;
  verificationCode?: string;
  verificationCount?: number;
}

export type CrmEnquiryStage = 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'CONVERTED' | 'CLOSED';

export interface AdmissionsEnquiry {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  programmeInterest: string;
  preferredCampus: string;
  intake: string;
  message: string;
  consentGiven: boolean;
  stage: CrmEnquiryStage;
  duplicateWarning?: string;
  followUpDate?: string;
  contactLogs: { id: string; actor: string; note: string; createdAt: string }[];
  createdAt: string;
}

export interface CampusServiceDefinition {
  id: string;
  code: string;
  name: string;
  office: string;
  campus: string;
  officeHoursEAT: string; // e.g. "08:30 - 16:00 EAT"
  slotMinutes: number;
  dailyLimitPerStudent: number;
  availableSlots: string[];
}

export interface CampusAppointment {
  id: string;
  bookingRef: string;
  serviceId: string;
  serviceName: string;
  studentRegNo: string;
  studentName: string;
  date: string;
  timeSlot: string;
  status: 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  outcomeNote?: string;
}

export interface InstitutionalPolicy {
  id: string;
  code: string;
  title: string;
  ownerRole: string;
  version: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED';
  creatorUserId: string;
  approvedByName?: string;
  acknowledgements: { userId: string; userName: string; acknowledgedAt: string }[];
}

export interface ComplianceObligation {
  id: string;
  regulator: 'TVETA' | 'KNEC' | 'ODPC_KENYA' | 'NITA';
  obligationTitle: string;
  dueDate: string;
  status: 'COMPLIANT' | 'ACTION_REQUIRED' | 'UNDER_REVIEW';
  evidenceRef: string;
}

export interface DataQualityFinding {
  id: string;
  severity: 'WARNING' | 'CRITICAL';
  ruleName: string;
  recordRef: string;
  detail: string;
}
