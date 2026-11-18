export type RegistrationCategory =
  | 'STUDENT'
  | 'STAFF'
  | 'PARENT'
  | 'ALUMNI'
  | 'CONTRACTOR'
  | 'PARTNER'
  | 'GUEST';

export type RegistrationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'INVITED'
  | 'ACTIVATED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface RegistrationDocumentItem {
  docType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  verified: boolean;
}

export interface StudentRegistrationDetails {
  programmeId?: string;
  programme: string;
  intakeId?: string;
  intake: string;
  studyMode: 'FULL_TIME' | 'PART_TIME' | 'EVENING' | 'ONLINE' | 'HYBRID';
  previousInstitution: string;
  previousQualification: string;
  previousGrade: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
  feeCategory: 'SELF_SPONSORED' | 'GOVERNMENT_KUCCPS' | 'HELB_LOAN' | 'SCHOLARSHIP' | 'CORPORATE';
  sponsorshipReference: string;
}

export interface StaffRegistrationDetails {
  employeeType: 'TEACHING' | 'NON_TEACHING' | 'LECTURER' | 'LIBRARIAN' | 'FINANCE' | 'IT_SUPPORT' | 'ADMINISTRATOR';
  jobTitle: string;
  supervisorName: string;
  contractType: 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'TEMPORARY';
  startDate: string;
  endDate: string;
  highestQualification: string;
  specialization: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  teachingUnitsRequested?: string[];
  compensationBandConfidential?: string;
}

export interface OtherRegistrationDetails {
  linkedStudentNumber?: string;
  linkedStudentName?: string;
  relationshipToStudent?: string;
  relationshipVerified?: boolean;
  graduationYear?: string;
  completedProgramme?: string;
  organizationName?: string;
  contractOrMouRef?: string;
  departmentSponsor?: string;
  accessExpiryDate?: string;
  hostStaffName?: string;
  visitPurpose?: string;
  visitorBadgeCode?: string;
}

export interface RegistrationReviewEventItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  decision:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'CHANGES_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'INVITED'
    | 'ACTIVATED'
    | 'DOCUMENT_VERIFIED';
  comment: string | null;
  createdAt: string;
}

export interface RegistrationRecordItem {
  id: string;
  registrationNumber: string | null;
  category: RegistrationCategory;
  subType: string;
  status: RegistrationStatus;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  identificationNumberMasked: string;
  identificationType: 'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT';
  campusId: string;
  campusName: string;
  departmentId: string | null;
  departmentName: string | null;
  // Stage 1: Identity Account
  userAccountId: string | null;
  accountStatus: 'NOT_CREATED' | 'CREATED' | 'SUSPENDED';
  accountCreatedAt: string | null;
  // Stage 2: College Record
  collegeRecordId: string | null;
  collegeRecordStatus: 'UNENROLLED' | 'PENDING_VERIFICATION' | 'ENROLLED' | 'SUSPENDED' | 'ARCHIVED';
  // Stage 3: Portal Access
  portalAccessStatus: 'INACTIVE' | 'INVITED' | 'ACTIVATED' | 'SUSPENDED' | 'REVOKED';
  proposedRole: string;
  assignedRole: string | null;
  assignedPermissions: string[];
  mustChangePasswordOnFirstLogin?: boolean;
  mustCompleteProfileOnFirstLogin?: boolean;
  studentDetails?: StudentRegistrationDetails;
  staffDetails?: StaffRegistrationDetails;
  otherDetails?: OtherRegistrationDetails;
  documents: RegistrationDocumentItem[];
  odpcConsentAccepted: boolean;
  odpcConsentTimestamp: string | null;
  duplicateFlag: boolean;
  duplicateNotes: string | null;
  reviewerComment: string | null;
  reviewerHistory?: RegistrationReviewEventItem[];
  createdById: string;
  createdByName: string;
  createdByRole: string;
  submittedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationInvitationItem {
  id: string;
  registrationId: string;
  email: string;
  fullName: string;
  category: RegistrationCategory;
  assignedRole: string;
  tokenHint: string;
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
  sentById: string;
  sentByName: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface InvitationDispatchResult {
  invitation: ActivationInvitationItem;
  registration: RegistrationRecordItem;
  oneTimeActivationToken: string;
  activationUrl: string;
}

export interface RegistrationHistoryItem {
  registrationId: string;
  registrationNumber: string | null;
  status: RegistrationStatus;
  reviewerHistory: RegistrationReviewEventItem[];
  auditLogs: RegistrationAuditItem[];
}

export interface RegistrationAuditItem {
  id: string;
  registrationId: string | null;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: RegistrationCategory | 'SYSTEM';
  detail: string;
  isConfidential: boolean;
  createdAt: string;
}

export interface DuplicateMatchItem {
  matchedRegistrationId: string | null;
  matchedName: string;
  matchedEmail: string;
  matchedReason: string;
  matchedStatus: string;
}

export interface DuplicateClusterItem {
  record: RegistrationRecordItem;
  matches: DuplicateMatchItem[];
}

export interface ReferenceCampus {
  id: string;
  code: string;
  name: string;
}

export interface ReferenceDepartment {
  id: string;
  code: string;
  name: string;
  campusId: string;
}

export interface ReferenceProgramme {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  level: string;
  active: boolean;
}

export interface ReferenceIntake {
  id: string;
  code: string;
  name: string;
  startDate: string;
  active: boolean;
}

export interface RegistrationWorkspacePayload {
  summary: {
    total: number;
    drafts: number;
    pendingApproval: number;
    approvedAwaitingInvite: number;
    invitedPendingActivation: number;
    activated: number;
    suspendedOrRejected: number;
    duplicateAlerts: number;
    byCategory: Record<RegistrationCategory, number>;
  };
  items: RegistrationRecordItem[];
  invitations: ActivationInvitationItem[];
  references: {
    campuses: ReferenceCampus[];
    departments: ReferenceDepartment[];
    programmes?: ReferenceProgramme[];
    intakes?: ReferenceIntake[];
    allowedRegisterCategories: RegistrationCategory[];
    allowedApproveCategories: RegistrationCategory[];
    registrationPermissions: string[];
    numberFormats: Record<RegistrationCategory, string>;
  };
}

export interface CreateRegistrationPayload {
  category: RegistrationCategory;
  subType?: string;
  submitImmediately?: boolean;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  identificationType: 'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT';
  identificationNumber: string;
  campusId: string;
  departmentId: string | null;
  proposedRole: string;
  odpcConsentAccepted: boolean;
  documents: RegistrationDocumentItem[];
  studentDetails?: StudentRegistrationDetails;
  staffDetails?: StaffRegistrationDetails;
  otherDetails?: OtherRegistrationDetails;
}
