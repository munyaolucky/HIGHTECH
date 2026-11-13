/**
 * Notifications, Guardian Access, Careers, Document Centre, Quality Assurance & Executive Reports Types
 */

// --- Notifications, Guardians & Careers ---
export type EngagementRole = 'STUDENT' | 'PARENT_GUARDIAN' | 'CAREERS_NOTIFICATIONS_MANAGER';

export type NotificationCategory = 'ACADEMIC' | 'FINANCE' | 'WELFARE' | 'CAREERS' | 'SECURITY';

export interface NotificationItem {
  id: string;
  recipientId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  relativeLink?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  category: NotificationCategory;
  inApp: boolean; // Security always true
  emailOptIn: boolean;
  smsOptIn: boolean;
}

export interface NotificationOutboxItem {
  id: string;
  channel: 'EMAIL' | 'SMS';
  recipientAddress: string;
  subject: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  createdAt: string;
}

export type GuardianScope = 'OVERVIEW' | 'ATTENDANCE' | 'ACADEMICS' | 'FEES' | 'ACCOMMODATION';

export interface GuardianInvitation {
  id: string;
  studentRegNo: string;
  studentName: string;
  parentEmail: string;
  scopes: GuardianScope[];
  tokenPreview: string;
  expiresAt: string; // 7 days
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
}

export interface GuardianLink {
  id: string;
  studentRegNo: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  scopes: GuardianScope[];
  consentExpiresAt: string; // 1 year
  status: 'ACTIVE' | 'REVOKED';
  revokedReason?: string;
}

export interface ParentMeetingRequest {
  id: string;
  studentRegNo: string;
  parentEmail: string;
  topic: string;
  preferredDate: string;
  status: 'REQUESTED' | 'SCHEDULED' | 'COMPLETED';
}

export interface ParentComplaint {
  id: string;
  studentRegNo: string;
  parentEmail: string;
  subject: string;
  details: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
}

export interface CareerEmployer {
  id: string;
  name: string;
  industry: string;
  branchScope: string;
  contactEmail: string;
  status: 'PENDING' | 'VERIFIED' | 'SUSPENDED';
}

export type OpportunityApplicationMode = 'INTERNAL_PLATFORM' | 'EXTERNAL_LINK';

export interface CareerOpportunity {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  employmentType: 'INTERNSHIP' | 'ATTACHMENT' | 'FULL_TIME' | 'GRADUATE_TRAINEE';
  location: string;
  applicationMode: OpportunityApplicationMode;
  externalUrl?: string;
  deadline: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'OPEN' | 'CLOSED';
}

export interface CareerApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  studentRegNo: string;
  studentName: string;
  coverLetter: string;
  status: 'SUBMITTED' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED';
  reviewNotes?: string;
  submittedAt: string;
}

// --- Document Centre ---
export type DocumentCategory =
  | 'admissions'
  | 'student-records'
  | 'academics'
  | 'student-submissions'
  | 'finance'
  | 'library'
  | 'hr'
  | 'hostel-welfare'
  | 'website-media'
  | 'policies-forms'
  | 'certificates'
  | 'scholarship'
  | 'other';

export type DocumentAccessPolicy = 'OWNER_ONLY' | 'AUTHENTICATED' | 'STAFF_ONLY' | 'PUBLIC';
export type DocumentStatus = 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'RESTRICTED' | 'ARCHIVED';

export interface DocumentGrant {
  id: string;
  granteeEmail: string;
  canDownload: boolean;
  expiresAt: string;
}

export interface InstitutionalDocument {
  id: string;
  reference: string;
  title: string;
  category: DocumentCategory;
  branch: string;
  fileName: string;
  mimeType: string;
  fileSizeKb: number;
  version: number;
  accessPolicy: DocumentAccessPolicy;
  status: DocumentStatus;
  ownerUserId: string;
  ownerName: string;
  uploaderUserId: string;
  reviewedByName?: string;
  reviewNote?: string;
  expiresAt?: string;
  grants: DocumentGrant[];
  createdAt: string;
}

// --- Quality Assurance & TVETA Accreditation ---
export type QualityOperatorRole = 'QA_CREATOR' | 'QUALITY_REVIEWER_PRINCIPAL' | 'DOCUMENTS_MANAGER';

export interface QualityFramework {
  id: string;
  code: string;
  title: string;
  authority: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  createdByUserId: string;
  createdByName: string;
  reviewedByName?: string;
  rejectionReason?: string;
  standards: { id: string; code: string; statement: string }[];
}

export interface QualityReviewCycle {
  id: string;
  code: string;
  frameworkId: string;
  branch: string;
  title: string;
  leadUserId: string;
  leadName: string;
  creatorUserId: string;
  startDate: string;
  dueDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED_CLOSED';
  reviewedByName?: string;
}

export interface QualityEvidence {
  id: string;
  reviewId: string;
  standardCode: string;
  documentId: string;
  documentTitle: string;
  summary: string;
  submittedByUserId: string;
  submittedByName: string;
  status: 'PENDING' | 'VERIFIED' | 'CHANGES_REQUESTED' | 'REJECTED';
  verifiedByName?: string;
  reviewNote?: string;
}

export interface QualityAction {
  id: string;
  title: string;
  ownerName: string;
  dueDate: string;
  status: 'OPEN' | 'SUBMITTED_FOR_VERIFICATION' | 'VERIFIED' | 'CANCELLED';
  creatorUserId: string;
  completionNote?: string;
}

export interface QualityFinding {
  id: string;
  reviewId: string;
  standardCode: string;
  severity: 'MINOR' | 'MODERATE' | 'CRITICAL';
  description: string;
  rootCause: string;
  status: 'OPEN' | 'IN_REMEDIATION' | 'CLOSED' | 'RISK_ACCEPTED';
  closureNote?: string;
  actions: QualityAction[];
}
