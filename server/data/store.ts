import fs from 'node:fs';
import path from 'node:path';
import {
  ROLE_TO_STAFF_PERMISSIONS,
  type StaffPermission,
  type StaffRoleCode,
} from '../modules/staff/staff.permissions.ts';
import {
  ROLE_DOCUMENT_PERMISSIONS,
  type DocumentPermission,
} from '../modules/documents/documents.permissions.ts';
import {
  INITIAL_DOCUMENT_CATEGORIES,
  type DmsModuleKey,
  type DocumentCategoryConfig,
} from '../modules/documents/documents.catalog.ts';
import {
  REGISTRATION_NUMBER_PREFIX,
  type RegistrationCategory,
  type RegistrationStatus,
} from '../modules/registration/registration.permissions.ts';
import type {
  AdmissionApplicationRecord,
  DepartmentStaffAssignmentRecord,
  WebsiteAuditLogRecord,
  WebsiteDepartmentRecord,
  WebsiteStaffProfileRecord,
} from '../modules/website/website.types.ts';
import {
  SEED_ADMISSION_APPLICATIONS,
  SEED_DEPARTMENT_ASSIGNMENTS,
  SEED_WEBSITE_AUDIT_LOGS,
  SEED_WEBSITE_DEPARTMENTS,
  SEED_WEBSITE_STAFF,
} from '../modules/website/website.seed.ts';
import type {
  AbsenceEvidenceRecord,
  AbsenceExplanationRecord,
  AbsenceEscalationRecord,
  AbsenceReviewRecord,
  AcademicInterventionRecord,
  AttendanceAlertRecord,
  AttendanceCorrectionRequest,
  AttendancePolicyConfig,
  AttendanceSessionRecord,
  CatchUpLessonRecord,
  LessonDeliveryRecordItem,
  LessonObservationRecord,
  SchemeOfWorkRecord,
  StudentAbsenceCaseRecord,
  TeachingAuditLogRecord,
  TeachingDocumentApproval,
  TeachingDocumentItem,
  TeachingDocumentVersion,
  TimetableSessionSlot,
} from '../modules/teaching/teaching.types.ts';
import { createTeachingModuleSeed } from '../modules/teaching/teaching.seed.ts';
import type {
  CollegeEventRecord,
  EventAuditLogRecord,
  EventCertificateRecord,
  EventFeedbackRecord,
  EventInvitationRecord,
  EventMediaRecord,
  EventNotificationRecord,
  EventPaymentRecord,
  EventRegistrationRecord,
  EventScheduleItemRecord,
  EventSettingsRecord,
  EventSpeakerRecord,
  EventVenueRecord,
} from '../modules/events/events.types.ts';
import { createEventsModuleSeed } from '../modules/events/events.seed.ts';
import type {
  SecureExamAuditLogRecord,
  SecureExamDefinitionRecord,
  SecureExamIncidentRecord,
  SecureExamMessageRecord,
  SecureExamSecurityEventRecord,
  SecureExamSessionRecord,
} from '../modules/exams/secure/secureExam.types.ts';
import { createSecureExamSeed } from '../modules/exams/secure/secureExam.seed.ts';
import type {
  FinanceAuditLogRecord,
  FinanceClearanceRecord,
  FinanceFeeStructureRecord,
  FinanceLedgerChargeRecord,
  FinancePaymentPlanRecord,
  FinancePaymentRecord,
  FinanceReceiptRecord,
  FinanceRefundRequestRecord,
  FinanceStudentAccountRecord,
  MpesaTransactionRecord,
} from '../modules/finance/finance.types.ts';
import { createFinanceModuleSeed } from '../modules/finance/finance.seed.ts';

export type StaffTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'URGENT';

export interface StaffAccountRecord {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  officeLocation: string;
  bio: string;
  role: StaffRoleCode;
  roleTitle: string;
  departmentId: string;
  department: string;
  campusId: string;
  campus: string;
  allowedCampuses: string[];
  permissions: StaffPermission[];
  documentPermissions: DocumentPermission[];
  restrictedFrom: string[];
  assignedUnits?: string[];
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  updatedAt: string;
}

export interface CampusRecord {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  campusId: string;
  headStaffId?: string;
  active: boolean;
  createdAt: string;
}

export interface ProgrammeRecord {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  level: string;
  active: boolean;
}

export interface IntakeRecord {
  id: string;
  code: string;
  name: string;
  startDate: string;
  active: boolean;
}

export interface StudentAccountRecord {
  id: string;
  admissionNumber: string;
  fullName: string;
  email: string;
  programme: string;
  campusId: string;
  campusName: string;
  status: 'ACTIVE' | 'PROVISIONAL' | 'SUSPENDED';
  createdAt: string;
  createdById: string;
}

export interface StaffInvitationRecord {
  id: string;
  email: string;
  fullName: string;
  role: StaffRoleCode;
  departmentId: string;
  departmentName: string;
  campusId: string;
  campusName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedById: string;
  invitedByName: string;
  createdAt: string;
}

export interface ApprovalWorkflowRecord {
  id: string;
  reference: string;
  title: string;
  category: 'ACADEMIC_POLICY' | 'ROLE_CHANGE' | 'CAMPUS_CONFIG' | 'DOCUMENT_GOVERNANCE';
  requestedById: string;
  requestedByName: string;
  campusName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionComment?: string;
  decidedById?: string;
  decidedByName?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface ServerStaffTask {
  id: string;
  staffId: string;
  role: StaffRoleCode;
  title: string;
  description: string;
  dueAt?: string;
  status: StaffTaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAuditLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRoleCode | 'UNCONFIGURED';
  action: string;
  description: string;
  departmentId?: string;
  campusId?: string;
  isConfidential: boolean;
  confidentialScope?: 'WELFARE_COUNSELLING' | 'HR_PRIVATE' | 'FINANCE_PRIVATE';
  createdAt: string;
}

export type DocumentCategory =
  | 'ADMISSION_LETTER'
  | 'TRANSCRIPT_CERTIFICATE'
  | 'FEE_STATEMENT'
  | 'EXAM_SCHEDULE'
  | 'EMPLOYMENT_CONTRACT'
  | 'INSTITUTIONAL_POLICY'
  | 'OFFICIAL_MEMO'
  | 'STUDENT_WELFARE_CONFIDENTIAL'
  | 'STUDENT_REGISTRATION_RECORD'
  | 'ABSENCE_EXPLANATION'
  | 'ASSIGNMENT_SUBMISSION'
  | 'PRACTICAL_PROJECT_FILE'
  | 'INDUSTRIAL_ATTACHMENT_DOC'
  | 'SCHOLARSHIP_BURSARY_DOC'
  | 'LESSON_PLAN'
  | 'SCHEME_OF_WORK'
  | 'RECORD_OF_WORK'
  | 'LEARNING_MATERIAL'
  | 'ATTENDANCE_REGISTER_DOC'
  | 'ACADEMIC_CLASS_RESOURCE'
  | 'DEPARTMENT_REPORT'
  | 'MEETING_MINUTES'
  | 'INSTITUTIONAL_REPORT'
  | 'LIBRARY_DIGITAL_RESOURCE'
  | 'EVENT_MEDIA_PROGRAMME'
  | 'WEBSITE_MEDIA_ASSET';

export type DocumentConfidentiality = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type DocumentWorkflowStatus =
  | 'DRAFT'
  | 'UPLOADED'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'UNDER_VERIFICATION'
  | 'CHANGES_REQUESTED'
  | 'REQUIRES_CORRECTION'
  | 'APPROVED'
  | 'SIGNED'
  | 'ISSUED'
  | 'ARCHIVED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'REVOKED';

export interface DocumentDesignConfig {
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSizePt: number;
  accentColor: 'navy' | 'academic-blue' | 'gold' | 'crimson';
  alignment: 'left' | 'justify';
  showWatermark: boolean;
  watermarkText: string;
  showHeader: boolean;
  showFooter: boolean;
  showSignatureBlock: boolean;
  showQrBlock: boolean;
}

export interface DocumentRecord {
  id: string;
  documentNumber?: string | null;
  referenceNumber: string | null;
  title: string;
  category: DocumentCategory;
  moduleKey?: DmsModuleKey;
  originalFileName?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number;
  checksumSha256?: string | null;
  scanStatus?: 'VERIFIED_CLEAN' | 'QUARANTINED';
  description?: string;
  confidentiality: DocumentConfidentiality;
  status: DocumentWorkflowStatus;
  ownerId: string;
  ownerName: string;
  createdById: string;
  createdByName: string;
  uploadedByRole?: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  relatedStudentOrStaffId?: string | null;
  departmentId: string | null;
  departmentName: string | null;
  campusId: string | null;
  campusName: string | null;
  courseOrClass?: string | null;
  academicYear?: string;
  termLabel?: string;
  recipientLabel: string;
  recipientEmail?: string;
  subjectLine: string;
  bodyContent: string;
  metadataFields: Record<string, string>;
  design: DocumentDesignConfig;
  templateId: string | null;
  currentVersion: number;
  verificationHash: string | null;
  uploadedAt?: string;
  approvalOfficerId?: string | null;
  approvalOfficerName?: string | null;
  approvalDate?: string | null;
  retentionDate?: string | null;
  issuedAt: string | null;
  issuedById: string | null;
  issuedByName: string | null;
  revokedReason: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  fileName?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number;
  checksumSha256?: string | null;
  subjectLine: string;
  bodyContent: string;
  metadataFields: Record<string, string>;
  editedById: string;
  editedByName: string;
  changeNote: string;
  createdAt: string;
}

export interface DocumentAttachmentRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
  scanStatus: 'VERIFIED_CLEAN' | 'QUARANTINED';
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface DocumentPermissionRuleRecord {
  id: string;
  documentId: string;
  roleCode: string | null;
  userId: string | null;
  departmentId: string | null;
  scopeLevel: 'PERSONAL' | 'DEPARTMENT' | 'CAMPUS' | 'INSTITUTIONAL';
  canView: boolean;
  canDownload: boolean;
  canApprove: boolean;
  canEdit: boolean;
  grantedById: string;
  createdAt: string;
}

export interface DocumentApprovalRecord {
  id: string;
  documentId: string;
  stepOrder: number;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: StaffRoleCode;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  comment: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface DocumentCommentRecord {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface DocumentRecipientRecord {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userRole: string;
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
  grantedById: string;
  grantedByName: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface DocumentSignatureRecord {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerTitle: string;
  signatureTitle: string;
  signatureDigest: string;
  signedAt: string;
}

export interface DocumentTemplateRecord {
  id: string;
  code: string;
  name: string;
  category: DocumentCategory;
  moduleKey?: DmsModuleKey;
  defaultConfidentiality: DocumentConfidentiality;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
  defaultFields: Record<string, string>;
  design: DocumentDesignConfig;
  createdById: string;
  createdAt: string;
}

export interface DocumentAuditLogRecord {
  id: string;
  documentId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  detail: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DocumentRetentionPolicyRecord {
  id: string;
  categoryCode: string;
  moduleKey: DmsModuleKey;
  retentionDays: number;
  actionAfterExpiry: 'ARCHIVE' | 'REVIEW' | 'SECURE_PURGE';
  odpcBasis: string;
  active: boolean;
  updatedById: string | null;
  updatedAt: string;
}

export interface DocumentRequestRecord {
  id: string;
  requestNumber: string;
  targetUserId: string;
  targetUserName: string;
  targetRegNo: string | null;
  targetRole: string;
  requestedById: string;
  requestedByName: string;
  requestedByRole: string;
  categoryCode: string;
  moduleKey: DmsModuleKey;
  title: string;
  instructions: string;
  dueDate: string | null;
  status: 'OPEN' | 'SUBMITTED' | 'FULFILLED' | 'OVERDUE' | 'CANCELLED';
  fulfilledDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationDocumentChecklistItem {
  docType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  verified: boolean;
}

export interface RegistrationReviewEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  decision: 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'INVITED' | 'ACTIVATED' | 'DOCUMENT_VERIFIED';
  comment: string | null;
  createdAt: string;
}

export interface UserRegistrationRecord {
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
  identificationNumberHash: string;
  identificationType: 'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT';
  campusId: string;
  campusName: string;
  departmentId: string | null;
  departmentName: string | null;
  // Stage 1: Identity / Account (strictly separated)
  userAccountId: string | null;
  accountStatus: 'NOT_CREATED' | 'CREATED' | 'SUSPENDED';
  accountCreatedAt: string | null;
  // Stage 2: College Record (strictly separated)
  collegeRecordId: string | null;
  collegeRecordStatus: 'UNENROLLED' | 'PENDING_VERIFICATION' | 'ENROLLED' | 'SUSPENDED' | 'ARCHIVED';
  // Stage 3: Portal Access (strictly separated)
  portalAccessStatus: 'INACTIVE' | 'INVITED' | 'ACTIVATED' | 'SUSPENDED' | 'REVOKED';
  proposedRole: string;
  assignedRole: string | null;
  assignedPermissions: string[];
  mustChangePasswordOnFirstLogin?: boolean;
  mustCompleteProfileOnFirstLogin?: boolean;
  passwordHash?: string | null;
  // Category-specific structured payloads
  studentDetails?: {
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
  };
  staffDetails?: {
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
  };
  otherDetails?: {
    // Parent
    linkedStudentNumber?: string;
    linkedStudentName?: string;
    relationshipToStudent?: string;
    relationshipVerified?: boolean;
    // Alumni
    graduationYear?: string;
    completedProgramme?: string;
    // Contractor / Partner
    organizationName?: string;
    contractOrMouRef?: string;
    departmentSponsor?: string;
    accessExpiryDate?: string;
    // Guest
    hostStaffName?: string;
    visitPurpose?: string;
    visitorBadgeCode?: string;
  };
  documents: RegistrationDocumentChecklistItem[];
  odpcConsentAccepted: boolean;
  odpcConsentTimestamp: string | null;
  duplicateFlag: boolean;
  duplicateNotes: string | null;
  reviewerComment: string | null;
  reviewerHistory?: RegistrationReviewEvent[];
  createdById: string;
  createdByName: string;
  createdByRole: StaffRoleCode;
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

export interface ActivationInvitationRecord {
  id: string;
  registrationId: string;
  email: string;
  fullName: string;
  category: RegistrationCategory;
  assignedRole: string;
  tokenHash: string; // Stored strictly as SHA-256 hash — never plaintext
  tokenHint: string; // Masked suffix e.g. ****A1B2
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
  sentById: string;
  sentByName: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface RegistrationAuditLogRecord {
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

export interface NewsletterSubscriberRecord {
  id: string;
  email: string;
  source: string;
  status: 'ACTIVE';
  subscribedAt: string;
}

export interface CookieConsentAuditRecord {
  id: string;
  version: string;
  action: 'accept_all' | 'reject_optional' | 'customize' | 'withdraw';
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  recordedAt: string;
}

export interface PortalDatabase {
  sequences: {
    documentIssuedSeq: number;
    documentRequestSeq?: number;
    staffSeq: number;
    studentSeq: number;
    workflowSeq: number;
    registrationSeq: Record<RegistrationCategory, number>;
    eventRegSeq: number;
    eventCodeSeq: number;
    eventCertSeq: number;
    financeReceiptSeq?: number;
  };
  campuses: CampusRecord[];
  departments: DepartmentRecord[];
  programmes: ProgrammeRecord[];
  intakes: IntakeRecord[];
  staffAccounts: StaffAccountRecord[];
  studentAccounts: StudentAccountRecord[];
  staffInvitations: StaffInvitationRecord[];
  approvalWorkflows: ApprovalWorkflowRecord[];
  tasks: ServerStaffTask[];
  staffAuditLogs: StaffAuditLogRecord[];
  documentCategories: DocumentCategoryConfig[];
  documents: DocumentRecord[];
  documentVersions: DocumentVersionRecord[];
  documentAttachments: DocumentAttachmentRecord[];
  documentPermissions: DocumentPermissionRuleRecord[];
  documentApprovals: DocumentApprovalRecord[];
  documentComments: DocumentCommentRecord[];
  documentRecipients: DocumentRecipientRecord[];
  documentSignatures: DocumentSignatureRecord[];
  documentTemplates: DocumentTemplateRecord[];
  documentAuditLogs: DocumentAuditLogRecord[];
  documentRetentionPolicies: DocumentRetentionPolicyRecord[];
  documentRequests: DocumentRequestRecord[];
  registrations: UserRegistrationRecord[];
  activationInvitations: ActivationInvitationRecord[];
  registrationAuditLogs: RegistrationAuditLogRecord[];
  websiteDepartments: WebsiteDepartmentRecord[];
  websiteStaffProfiles: WebsiteStaffProfileRecord[];
  departmentStaffAssignments: DepartmentStaffAssignmentRecord[];
  websiteAuditLogs: WebsiteAuditLogRecord[];
  admissionApplications: AdmissionApplicationRecord[];
  newsletterSubscribers: NewsletterSubscriberRecord[];
  cookieConsentAudits: CookieConsentAuditRecord[];
  teachingTimetableSlots: TimetableSessionSlot[];
  teachingDocuments: TeachingDocumentItem[];
  teachingDocumentVersions: TeachingDocumentVersion[];
  teachingDocumentApprovals: TeachingDocumentApproval[];
  schemesOfWork: SchemeOfWorkRecord[];
  attendanceSessions: AttendanceSessionRecord[];
  attendanceCorrections: AttendanceCorrectionRequest[];
  lessonDeliveryRecords: LessonDeliveryRecordItem[];
  lessonObservations: LessonObservationRecord[];
  studentAbsenceCases: StudentAbsenceCaseRecord[];
  absenceExplanations: AbsenceExplanationRecord[];
  absenceEvidence: AbsenceEvidenceRecord[];
  absenceReviews: AbsenceReviewRecord[];
  absenceEscalations: AbsenceEscalationRecord[];
  catchUpLessons: CatchUpLessonRecord[];
  academicInterventions: AcademicInterventionRecord[];
  attendancePolicy: AttendancePolicyConfig;
  attendanceAlerts: AttendanceAlertRecord[];
  teachingAuditLogs: TeachingAuditLogRecord[];
  collegeEvents: CollegeEventRecord[];
  collegeEventSchedules: EventScheduleItemRecord[];
  collegeEventSpeakers: EventSpeakerRecord[];
  collegeEventRegistrations: EventRegistrationRecord[];
  collegeEventVenues: EventVenueRecord[];
  collegeEventPayments: EventPaymentRecord[];
  collegeEventInvitations: EventInvitationRecord[];
  collegeEventFeedbacks: EventFeedbackRecord[];
  collegeEventCertificates: EventCertificateRecord[];
  collegeEventMedia: EventMediaRecord[];
  collegeEventNotifications: EventNotificationRecord[];
  collegeEventAuditLogs: EventAuditLogRecord[];
  eventSettings: EventSettingsRecord;
  secureExamDefinitions: SecureExamDefinitionRecord[];
  secureExamSessions: SecureExamSessionRecord[];
  secureExamEvents: SecureExamSecurityEventRecord[];
  secureExamIncidents: SecureExamIncidentRecord[];
  secureExamAuditLogs: SecureExamAuditLogRecord[];
  secureExamMessages: SecureExamMessageRecord[];
  financeStudentAccounts: FinanceStudentAccountRecord[];
  financeLedgerCharges: FinanceLedgerChargeRecord[];
  financePayments: FinancePaymentRecord[];
  mpesaTransactions: MpesaTransactionRecord[];
  financeReceipts: FinanceReceiptRecord[];
  financeFeeStructures: FinanceFeeStructureRecord[];
  financePaymentPlans: FinancePaymentPlanRecord[];
  financeClearances: FinanceClearanceRecord[];
  financeRefundRequests: FinanceRefundRequestRecord[];
  financeAuditLogs: FinanceAuditLogRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'hitech-portal-db.json');

const SEED_CAMPUSES: CampusRecord[] = [
  {
    id: 'cmp-nairobi',
    code: 'NBO',
    name: 'Nairobi Main Campus',
    address: 'Academic Towers, Moi Avenue, Nairobi CBD',
    phone: '+254 700 100 201',
    active: true,
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'cmp-westlands',
    code: 'WST',
    name: 'Westlands Technology Park Campus',
    address: 'Waiyaki Way, Westlands, Nairobi',
    phone: '+254 700 100 202',
    active: true,
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'cmp-mombasa',
    code: 'MBA',
    name: 'Mombasa Coastal Campus',
    address: 'Nkrumah Road, Mombasa Island',
    phone: '+254 700 100 203',
    active: true,
    createdAt: '2026-01-05T08:00:00.000Z',
  },
];

const SEED_DEPARTMENTS: DepartmentRecord[] = [
  { id: 'dept-governance', code: 'GOV', name: 'Institutional Operations & Governance', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-principal', code: 'PRN', name: 'Office of the Principal', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-registry', code: 'REG', name: 'Academic Registry & Student Records', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-finance', code: 'FIN', name: 'Finance & Accounts', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-hr', code: 'HRD', name: 'Human Resources & Administration', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-computing', code: 'SCI', name: 'School of Computing & Informatics', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-library', code: 'LIB', name: 'Learning Resource Centre', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-ict', code: 'ICT', name: 'ICT Infrastructure & Help Desk', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-admissions', code: 'ADM', name: 'Admissions & Enrolment Desk', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-exams', code: 'EXM', name: 'Examinations & Quality Assessment', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-qa', code: 'QAS', name: 'Quality Assurance & Standards', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-welfare', code: 'SWL', name: 'Student Welfare & Campus Life', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-hostels', code: 'HST', name: 'Student Residences & Boarding', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-labs', code: 'LAB', name: 'Computing Laboratories & Maintenance', campusId: 'cmp-westlands', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-procurement', code: 'PRC', name: 'Procurement & Tendering', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-stores', code: 'STR', name: 'Central Stores & Assets', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-comms', code: 'COM', name: 'Corporate Communications & Marketing', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-reception', code: 'REC', name: 'Front Office & Client Services', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-security', code: 'SEC', name: 'Campus Safety & Access Control', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'dept-transport', code: 'TRN', name: 'Transport & Logistics', campusId: 'cmp-nairobi', active: true, createdAt: '2026-01-05T08:00:00.000Z' },
];

function makeStaff(
  partial: Omit<
    StaffAccountRecord,
    'permissions' | 'documentPermissions' | 'status' | 'updatedAt' | 'phone' | 'officeLocation' | 'bio'
  > & {
    phone?: string;
    officeLocation?: string;
    bio?: string;
  }
): StaffAccountRecord {
  return {
    ...partial,
    phone: partial.phone ?? '+254 700 100 200',
    officeLocation: partial.officeLocation ?? `${partial.campus} · Block A`,
    bio: partial.bio ?? `Authorized ${partial.roleTitle} serving in ${partial.department}.`,
    permissions: [...ROLE_TO_STAFF_PERMISSIONS[partial.role]],
    documentPermissions: [...ROLE_DOCUMENT_PERMISSIONS[partial.role]],
    status: 'ACTIVE',
    updatedAt: '2026-01-05T08:00:00.000Z',
  };
}

const SEED_STAFF: StaffAccountRecord[] = [
  makeStaff({
    id: 'usr-admin-001',
    employeeNumber: 'HCA/ADMIN/2026/001',
    fullName: 'Grace Nyambura',
    email: 'admin@hitech.ac.ke',
    role: 'ADMIN',
    roleTitle: 'System & Institutional Administrator',
    departmentId: 'dept-governance',
    department: 'Institutional Operations & Governance',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Confidential Student Counselling Notes', 'Private HR Medical Files', 'Direct Exam Script Altering'],
  }),
  makeStaff({
    id: 'usr-principal-001',
    employeeNumber: 'HCA/STAFF/2026/000',
    fullName: 'Dr. Samuel Karanja',
    email: 'principal@hitech.ac.ke',
    role: 'PRINCIPAL',
    roleTitle: 'College Principal',
    departmentId: 'dept-principal',
    department: 'Office of the Principal',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Raw Student Counselling Case Text', 'Individual Exam Answer Scripts'],
  }),
  makeStaff({
    id: 'usr-reg-001',
    employeeNumber: 'HCA/STAFF/2026/005',
    fullName: 'H. Oduor',
    email: 'registrar@hitech.ac.ke',
    role: 'REGISTRAR',
    roleTitle: 'Chief Academic Registrar',
    departmentId: 'dept-registry',
    department: 'Academic Registry & Student Records',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['HR Payroll & Salaries', 'M-Pesa Daraja Settlement Keys', 'Procurement Vendor Bids'],
  }),
  makeStaff({
    id: 'usr-fin-001',
    employeeNumber: 'HCA/STAFF/2026/006',
    fullName: 'D. Kiprop',
    email: 'finance@hitech.ac.ke',
    role: 'FINANCE_OFFICER',
    roleTitle: 'Senior Finance Officer',
    departmentId: 'dept-finance',
    department: 'Finance & Accounts',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Academic Grading & Exam Moderation', 'HR Disciplinary Records', 'Confidential Student Counselling'],
  }),
  makeStaff({
    id: 'usr-hr-primary',
    employeeNumber: 'HCA/STAFF/2026/002',
    fullName: 'Beatrice Wanjiku Mwangi',
    email: 'bwmwangi@hitech.ac.ke',
    role: 'HR',
    roleTitle: 'Human Resources Officer',
    departmentId: 'dept-hr',
    department: 'Human Resources & Administration',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Student Fee Balances & M-Pesa Ledger', 'Student Examination Marks', 'ICT Firewall Controls'],
  }),
  makeStaff({
    id: 'usr-lecturer-kamau',
    employeeNumber: 'HCA/STAFF/2026/001',
    fullName: 'Eng. Peter Kamau Njoroge',
    email: 'pkamau@hitech.ac.ke',
    role: 'LECTURER',
    roleTitle: 'Senior ICT & AI Lecturer',
    departmentId: 'dept-computing',
    department: 'School of Computing & Informatics',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus'],
    assignedUnits: [
      'CSC 301 · Advanced Data Structures & Algorithms',
      'ICT 2101 · Software Architecture',
      'AI 3102 · Applied Machine Learning',
      'NET 303 · Cybersecurity Architectures & Forensics',
      'ICT 1104 · Database Systems & SQL Administration',
    ],
    restrictedFrom: ['Student Fee Statements', 'Other Staff Salaries & Contracts', 'Institutional Admissions Decisions'],
  }),
  makeStaff({
    id: 'usr-lecturer-wanjala',
    employeeNumber: 'HCA/STAFF/2026/022',
    fullName: 'CPA Mercy Wanjala',
    email: 'mwanjala@hitech.ac.ke',
    role: 'LECTURER',
    roleTitle: 'Lecturer in Accountancy & Financial Reporting',
    departmentId: 'dept-finance',
    department: 'Finance & Accounts',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus'],
    assignedUnits: ['FIN 201 · Corporate Financial Reporting & IFRS'],
    restrictedFrom: ['Student Fee Statements', 'Other Staff Salaries & Contracts', 'Unassigned Computing Dept Cases'],
  }),
  makeStaff({
    id: 'usr-lib-001',
    employeeNumber: 'HCA/STAFF/2026/007',
    fullName: 'R. Achieng',
    email: 'library@hitech.ac.ke',
    role: 'LIBRARIAN',
    roleTitle: 'Senior College Librarian',
    departmentId: 'dept-library',
    department: 'Learning Resource Centre',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus'],
    restrictedFrom: ['Student Tuition Accounts', 'HR Contracts & Payroll', 'Student Counselling Records'],
  }),
  makeStaff({
    id: 'usr-it-001',
    employeeNumber: 'HCA/STAFF/2026/008',
    fullName: 'K. Mutiso',
    email: 'itsupport@hitech.ac.ke',
    role: 'IT_SUPPORT',
    roleTitle: 'IT Support & Systems Officer',
    departmentId: 'dept-ict',
    department: 'ICT Infrastructure & Help Desk',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['HR Payroll Figures', 'Student Counselling Notes', 'Changing Student Exam Grades'],
  }),
  makeStaff({
    id: 'usr-hod-001',
    employeeNumber: 'HCA/STAFF/2026/009',
    fullName: 'Dr. Margaret Wambui',
    email: 'hod.computing@hitech.ac.ke',
    role: 'HOD',
    roleTitle: 'Head of Department (Computing & Informatics)',
    departmentId: 'dept-computing',
    department: 'School of Computing & Informatics',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus'],
    restrictedFrom: ['Other Departments Private Files', 'Finance Treasury Controls', 'HR Payroll'],
  }),
  makeStaff({
    id: 'usr-adm-001',
    employeeNumber: 'HCA/STAFF/2026/010',
    fullName: 'Alice Mutua',
    email: 'admissions@hitech.ac.ke',
    role: 'ADMISSIONS_OFFICER',
    roleTitle: 'Senior Admissions Officer',
    departmentId: 'dept-admissions',
    department: 'Admissions & Enrolment Desk',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Enrolled Student Exam Marks', 'HR Contracts', 'Vendor Procurement'],
  }),
  makeStaff({
    id: 'usr-exam-001',
    employeeNumber: 'HCA/STAFF/2026/011',
    fullName: 'F. Kipkemoi',
    email: 'exams@hitech.ac.ke',
    role: 'EXAMINATIONS_OFFICER',
    roleTitle: 'Examinations & Assessment Officer',
    departmentId: 'dept-exams',
    department: 'Examinations & Quality Assessment',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Finance Cashbook & M-Pesa', 'HR Contracts', 'Hostel Welfare Notes'],
  }),
  makeStaff({
    id: 'usr-qa-officer',
    employeeNumber: 'HCA/STAFF/2026/012',
    fullName: 'C. Mwenda',
    email: 'qa@hitech.ac.ke',
    role: 'QUALITY_ASSURANCE',
    roleTitle: 'Quality Assurance & TVETA Compliance Officer',
    departmentId: 'dept-qa',
    department: 'Quality Assurance & Standards',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Private Student Counselling Records', 'HR Salary Figures'],
  }),
  makeStaff({
    id: 'usr-welfare',
    employeeNumber: 'HCA/STAFF/2026/013',
    fullName: 'L. Wambui',
    email: 'studentaffairs@hitech.ac.ke',
    role: 'STUDENT_AFFAIRS',
    roleTitle: 'Dean of Student Affairs & Welfare',
    departmentId: 'dept-welfare',
    department: 'Student Welfare & Campus Life',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Finance Ledger Disbursement', 'Staff Payroll', 'Exam Moderation Keys'],
  }),
  makeStaff({
    id: 'actor-hostel-1',
    employeeNumber: 'HCA/STAFF/2026/014',
    fullName: 'J. Mutua',
    email: 'hostels@hitech.ac.ke',
    role: 'HOSTEL_OFFICER',
    roleTitle: 'Accommodation & Hostel Officer',
    departmentId: 'dept-hostels',
    department: 'Student Residences & Boarding',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus'],
    restrictedFrom: ['Approving Own Accommodation Charges (Finance Only)', 'Student Exam Grades', 'Confidential Counselling Notes'],
  }),
  makeStaff({
    id: 'usr-tech-001',
    employeeNumber: 'HCA/STAFF/2026/015',
    fullName: 'Brian Kiptoo',
    email: 'labtech@hitech.ac.ke',
    role: 'ICT_TECHNICIAN',
    roleTitle: 'ICT & Computer Laboratory Technician',
    departmentId: 'dept-labs',
    department: 'Computing Laboratories & Maintenance',
    campusId: 'cmp-westlands',
    campus: 'Westlands Technology Park Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus'],
    restrictedFrom: ['User Role Privilege Escalation', 'Finance Ledgers', 'HR Contracts'],
  }),
  makeStaff({
    id: 'usr-proc-001',
    employeeNumber: 'HCA/STAFF/2026/016',
    fullName: 'E. Chebet',
    email: 'procurement@hitech.ac.ke',
    role: 'PROCUREMENT_OFFICER',
    roleTitle: 'Procurement & Supply Chain Officer',
    departmentId: 'dept-procurement',
    department: 'Procurement & Tendering',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Stores Physical Dispatch Sign-Off (Separation of Duties)', 'Student Academic Records', 'HR Payroll'],
  }),
  makeStaff({
    id: 'usr-store-001',
    employeeNumber: 'HCA/STAFF/2026/017',
    fullName: 'P. Onyango',
    email: 'stores@hitech.ac.ke',
    role: 'STORES_OFFICER',
    roleTitle: 'Central Stores & Inventory Officer',
    departmentId: 'dept-stores',
    department: 'Central Stores & Assets',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus'],
    restrictedFrom: ['Vendor Tender Awarding (Procurement Only)', 'Student Fee Ledgers', 'HR Salaries'],
  }),
  makeStaff({
    id: 'usr-comms-001',
    employeeNumber: 'HCA/STAFF/2026/018',
    fullName: 'N. Muthoni',
    email: 'communications@hitech.ac.ke',
    role: 'COMMUNICATIONS_OFFICER',
    roleTitle: 'Corporate Communications & PR Officer',
    departmentId: 'dept-comms',
    department: 'Corporate Communications & Marketing',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Confidential Student Welfare Cases', 'HR Personnel Files', 'Finance Bank Reconciliation'],
  }),
  makeStaff({
    id: 'usr-rec-001',
    employeeNumber: 'HCA/STAFF/2026/019',
    fullName: 'S. Akinyi',
    email: 'reception@hitech.ac.ke',
    role: 'RECEPTIONIST',
    roleTitle: 'Front Office & Enquiries Receptionist',
    departmentId: 'dept-reception',
    department: 'Front Office & Client Services',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus'],
    restrictedFrom: ['Student Academic Grades', 'Finance Fee Balances', 'Confidential Counselling Notes'],
  }),
  makeStaff({
    id: 'usr-sec-001',
    employeeNumber: 'HCA/STAFF/2026/020',
    fullName: 'Sgt. M. Kilonzo',
    email: 'security@hitech.ac.ke',
    role: 'SECURITY_OFFICER',
    roleTitle: 'Chief Campus Security Officer',
    departmentId: 'dept-security',
    department: 'Campus Safety & Access Control',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus', 'Mombasa Coastal Campus'],
    restrictedFrom: ['Student Academic Transcripts', 'HR Salaries', 'Finance Ledgers'],
  }),
  makeStaff({
    id: 'usr-trn-001',
    employeeNumber: 'HCA/STAFF/2026/021',
    fullName: 'J. Njuguna',
    email: 'transport@hitech.ac.ke',
    role: 'TRANSPORT_OFFICER',
    roleTitle: 'Fleet & Transport Operations Officer',
    departmentId: 'dept-transport',
    department: 'Transport & Logistics',
    campusId: 'cmp-nairobi',
    campus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus', 'Westlands Technology Park Campus'],
    restrictedFrom: ['Student Academic Marks', 'HR Contracts', 'Vendor Tender Approval'],
  }),
];

const SEED_TEMPLATES: DocumentTemplateRecord[] = [
  {
    id: 'tpl-admission',
    code: 'TPL-ADM-01',
    name: 'Official Admission Offer Letter',
    category: 'ADMISSION_LETTER',
    defaultConfidentiality: 'INTERNAL',
    description: 'Formal admission letter issued by Admissions & Office of the Registrar with reporting date and fee terms.',
    subjectTemplate: 'OFFER OF ADMISSION — {{programme}} ({{intake}})',
    bodyTemplate:
      'Dear {{recipientName}},\n\nFollowing your application and verification of your academic credentials, HI-TECH College is pleased to offer you provisional admission into the {{programme}} programme at {{campusName}}.\n\nRegistration Number: {{registrationNumber}}\nReporting Date: {{reportingDate}}\nTuition Fee Deposit Required: {{feeDeposit}}\n\nYou are required to present your original national identification document and academic certificates during physical registration at the Academic Registry.\n\nCongratulations on your admission to HI-TECH College.',
    defaultFields: {
      programme: 'Diploma in Information Communication Technology (Level 6)',
      intake: 'September 2026 Intake',
      campusName: 'Nairobi Main Campus',
      registrationNumber: 'HCA/STU/2026/0142',
      reportingDate: 'Monday, 7 September 2026',
      feeDeposit: 'KES 18,500',
    },
    design: {
      fontFamily: 'serif',
      fontSizePt: 11,
      accentColor: 'navy',
      alignment: 'left',
      showWatermark: false,
      watermarkText: 'HI-TECH COLLEGE',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: true,
    },
    createdById: 'usr-reg-001',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'tpl-transcript',
    code: 'TPL-REG-02',
    name: 'Official Academic Completion & Transcript Letter',
    category: 'TRANSCRIPT_CERTIFICATE',
    defaultConfidentiality: 'INTERNAL',
    description: 'Registrar-signed academic standing, unit completion, and verification summary.',
    subjectTemplate: 'OFFICIAL ACADEMIC CONFIRMATION & TRANSCRIPT — {{registrationNumber}}',
    bodyTemplate:
      'TO WHOM IT MAY CONCERN\n\nThis is to certify that {{recipientName}} (Admission No: {{registrationNumber}}) is a bona fide student of HI-TECH College pursuing {{programme}}.\n\nAcademic Standing: {{academicStanding}}\nCumulative Mean Grade: {{meanGrade}}\nCompleted Units Verified: {{unitsCompleted}}\n\nAny alteration renders this document invalid. Authenticity may be confirmed online via the HI-TECH College QR verification portal.',
    defaultFields: {
      registrationNumber: 'HCA/STU/2026/001',
      programme: 'Diploma in Information Communication Technology',
      academicStanding: 'Good Standing — Cleared for Trimester Progression',
      meanGrade: 'Credit Distinction (74%)',
      unitsCompleted: '12 of 14 Core Units',
    },
    design: {
      fontFamily: 'serif',
      fontSizePt: 11,
      accentColor: 'academic-blue',
      alignment: 'left',
      showWatermark: true,
      watermarkText: 'OFFICIAL TRANSCRIPT',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: true,
    },
    createdById: 'usr-reg-001',
    createdAt: '2026-01-10T09:10:00.000Z',
  },
  {
    id: 'tpl-hr-contract',
    code: 'TPL-HR-03',
    name: 'Staff Employment Appointment Letter',
    category: 'EMPLOYMENT_CONTRACT',
    defaultConfidentiality: 'CONFIDENTIAL',
    description: 'Confidential HR employment contract appointment subject to independent Principal sign-off.',
    subjectTemplate: 'LETTER OF APPOINTMENT — {{positionTitle}}',
    bodyTemplate:
      'Dear {{recipientName}},\n\nFurther to your successful interview, HI-TECH College appoints you to the position of {{positionTitle}} in the {{departmentName}}, effective {{startDate}}.\n\nEmployee Number: {{employeeNumber}}\nDuty Station: {{campusName}}\nContract Term: {{contractTerm}}\n\nThis appointment is governed by the HI-TECH College Human Resources Policy Manual and requires your signed acceptance within seven (7) working days.',
    defaultFields: {
      positionTitle: 'Senior ICT Lecturer',
      departmentName: 'School of Computing & Informatics',
      startDate: '1 October 2026',
      employeeNumber: 'HCA/STAFF/2026/025',
      campusName: 'Nairobi Main Campus',
      contractTerm: '3 Years Renewable',
    },
    design: {
      fontFamily: 'sans',
      fontSizePt: 11,
      accentColor: 'navy',
      alignment: 'left',
      showWatermark: true,
      watermarkText: 'CONFIDENTIAL · HR',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: true,
    },
    createdById: 'usr-hr-primary',
    createdAt: '2026-01-10T09:20:00.000Z',
  },
  {
    id: 'tpl-fee-statement',
    code: 'TPL-FIN-04',
    name: 'Official Tuition Fee Clearance & Statement Notice',
    category: 'FEE_STATEMENT',
    defaultConfidentiality: 'INTERNAL',
    description: 'Finance-verified fee balance and M-Pesa settlement confirmation letter.',
    subjectTemplate: 'FEE ACCOUNT STATEMENT & CLEARANCE — {{registrationNumber}}',
    bodyTemplate:
      'Student Name: {{recipientName}}\nRegistration Number: {{registrationNumber}}\nAcademic Term: {{academicTerm}}\n\nTotal Billed Tuition & Statutory Fees: {{totalBilled}}\nVerified M-Pesa / Bank Receipts: {{totalPaid}}\nOutstanding Balance: {{balance}}\n\nClearance Status: {{clearanceStatus}}\n\nIssued by the Office of the Senior Finance Officer, HI-TECH College.',
    defaultFields: {
      registrationNumber: 'HCA/STU/2026/001',
      academicTerm: 'Trimester 2 · 2026',
      totalBilled: 'KES 42,500',
      totalPaid: 'KES 42,500',
      balance: 'KES 0',
      clearanceStatus: 'CLEARED FOR EXAMINATIONS',
    },
    design: {
      fontFamily: 'sans',
      fontSizePt: 11,
      accentColor: 'gold',
      alignment: 'left',
      showWatermark: false,
      watermarkText: 'FINANCE VERIFIED',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: true,
    },
    createdById: 'usr-fin-001',
    createdAt: '2026-01-10T09:30:00.000Z',
  },
  {
    id: 'tpl-memo',
    code: 'TPL-GEN-05',
    name: 'Official Institutional Memorandum',
    category: 'OFFICIAL_MEMO',
    defaultConfidentiality: 'PUBLIC',
    description: 'Standard HI-TECH College institutional circular or departmental notice.',
    subjectTemplate: 'INTERNAL MEMORANDUM — {{memoTopic}}',
    bodyTemplate:
      'TO: {{recipientName}}\nFROM: {{senderOffice}}\nDATE: {{memoDate}}\nSUBJECT: {{memoTopic}}\n\n{{memoSummary}}\n\nAll concerned staff and heads of department are advised to take note and ensure compliance within the stated timelines.',
    defaultFields: {
      senderOffice: 'Office of the Chief Academic Registrar',
      memoDate: '14 November 2026',
      memoTopic: 'Trimester Examination Invigilation & Quality Compliance',
      memoSummary: 'Please submit verified class attendance schedules and CAT continuous assessment marks before the examination lock deadline.',
    },
    design: {
      fontFamily: 'sans',
      fontSizePt: 11,
      accentColor: 'navy',
      alignment: 'left',
      showWatermark: false,
      watermarkText: 'HI-TECH COLLEGE',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: true,
    },
    createdById: 'usr-admin-001',
    createdAt: '2026-01-10T09:40:00.000Z',
  },
];

function createSeedDatabase(): PortalDatabase {
  const now = new Date().toISOString();

  const sampleDoc1: DocumentRecord = {
    id: 'doc-seed-001',
    referenceNumber: 'HCA/DOC/2026/000001',
    title: 'TVETA Quality Assurance & Academic Calendar Charter 2026',
    category: 'INSTITUTIONAL_POLICY',
    confidentiality: 'PUBLIC',
    status: 'ISSUED',
    ownerId: 'usr-reg-001',
    ownerName: 'H. Oduor',
    createdById: 'usr-reg-001',
    createdByName: 'H. Oduor',
    departmentId: 'dept-registry',
    departmentName: 'Academic Registry & Student Records',
    campusId: 'cmp-nairobi',
    campusName: 'Nairobi Main Campus',
    recipientLabel: 'All Academic Departments & Campuses',
    subjectLine: 'OFFICIAL ACADEMIC CALENDAR & TVETA QUALITY CHARTER 2026',
    bodyContent:
      'This charter establishes the official 2026 academic calendar, unit registration deadlines, CAT continuous assessment windows, and TVETA institutional audit schedules across Nairobi Main, Westlands Technology Park, and Mombasa Coastal Campuses.',
    metadataFields: {
      effectiveTerm: '2026 Academic Year',
      authority: 'Academic Board & Office of the Principal',
    },
    design: {
      fontFamily: 'serif',
      fontSizePt: 11,
      accentColor: 'navy',
      alignment: 'left',
      showWatermark: false,
      watermarkText: 'OFFICIAL POLICY',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: true,
    },
    templateId: 'tpl-memo',
    currentVersion: 1,
    verificationHash: 'HCA-VER-8F29A1C4',
    issuedAt: '2026-02-01T10:00:00.000Z',
    issuedById: 'usr-principal-001',
    issuedByName: 'Dr. Samuel Karanja',
    revokedReason: null,
    archivedAt: null,
    createdAt: '2026-01-28T09:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  };

  // Confidential welfare document intentionally NOT visible to ADMIN or FINANCE_OFFICER
  const sampleDoc2: DocumentRecord = {
    id: 'doc-seed-002',
    referenceNumber: null,
    title: 'Confidential Student Counselling Intake Summary · Case SWL-2026-04',
    category: 'STUDENT_WELFARE_CONFIDENTIAL',
    confidentiality: 'CONFIDENTIAL',
    status: 'DRAFT',
    ownerId: 'usr-welfare',
    ownerName: 'L. Wambui',
    createdById: 'usr-welfare',
    createdByName: 'L. Wambui',
    departmentId: 'dept-welfare',
    departmentName: 'Student Welfare & Campus Life',
    campusId: 'cmp-nairobi',
    campusName: 'Nairobi Main Campus',
    recipientLabel: 'Office of the Dean of Student Affairs (Restricted)',
    subjectLine: 'CONFIDENTIAL WELFARE ASSESSMENT — CASE SWL-2026-04',
    bodyContent:
      'Restricted student welfare and counselling support plan. Access is strictly limited to the case owner and Student Affairs counselling office.',
    metadataFields: {
      caseCode: 'SWL-2026-04',
      protectionLevel: 'ODPC Strictly Confidential',
    },
    design: {
      fontFamily: 'sans',
      fontSizePt: 11,
      accentColor: 'crimson',
      alignment: 'left',
      showWatermark: true,
      watermarkText: 'CONFIDENTIAL',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: false,
    },
    templateId: null,
    currentVersion: 1,
    verificationHash: null,
    issuedAt: null,
    issuedById: null,
    issuedByName: null,
    revokedReason: null,
    archivedAt: null,
    createdAt: '2026-02-10T11:00:00.000Z',
    updatedAt: '2026-02-10T11:00:00.000Z',
  };

  const sampleDoc3: DocumentRecord = {
    id: 'doc-seed-003',
    referenceNumber: null,
    title: 'Trimester 2 Computing Lab Examination Schedule Draft',
    category: 'EXAM_SCHEDULE',
    confidentiality: 'INTERNAL',
    status: 'SUBMITTED',
    ownerId: 'usr-lecturer-kamau',
    ownerName: 'Eng. Peter Kamau Njoroge',
    createdById: 'usr-lecturer-kamau',
    createdByName: 'Eng. Peter Kamau Njoroge',
    departmentId: 'dept-computing',
    departmentName: 'School of Computing & Informatics',
    campusId: 'cmp-nairobi',
    campusName: 'Nairobi Main Campus',
    recipientLabel: 'School of Computing & Informatics Candidates',
    subjectLine: 'PROPOSED PRACTICAL EXAMINATION SCHEDULE — ICT 2101 / AI 3102',
    bodyContent:
      'Practical CBT sitting schedule for ICT 2101 (Software Architecture) and AI 3102 (Applied Machine Learning) at Nairobi Main Campus Computing Labs 1 & 2.',
    metadataFields: {
      unitCodes: 'ICT 2101, AI 3102',
      venue: 'Computing Labs 1 & 2',
    },
    design: {
      fontFamily: 'sans',
      fontSizePt: 11,
      accentColor: 'academic-blue',
      alignment: 'left',
      showWatermark: false,
      watermarkText: 'INTERNAL',
      showHeader: true,
      showFooter: true,
      showSignatureBlock: true,
      showQrBlock: true,
    },
    templateId: 'tpl-memo',
    currentVersion: 1,
    verificationHash: null,
    issuedAt: null,
    issuedById: null,
    issuedByName: null,
    revokedReason: null,
    archivedAt: null,
    createdAt: '2026-02-14T08:30:00.000Z',
    updatedAt: '2026-02-14T08:30:00.000Z',
  };

  return {
    sequences: {
      documentIssuedSeq: 1,
      documentRequestSeq: 2,
      staffSeq: 22,
      studentSeq: 145,
      workflowSeq: 2,
      registrationSeq: {
        STUDENT: 2,
        STAFF: 2,
        PARENT: 1,
        ALUMNI: 1,
        CONTRACTOR: 1,
        PARTNER: 0,
        GUEST: 1,
      },
      eventRegSeq: 12,
      eventCodeSeq: 8,
      eventCertSeq: 2,
    },
    campuses: SEED_CAMPUSES,
    departments: SEED_DEPARTMENTS,
    programmes: [
      { id: 'prog-dict-l6', code: 'DICT-L6', name: 'Diploma in Information Communication Technology (Level 6)', departmentId: 'dept-computing', level: 'Level 6 Diploma', active: true },
      { id: 'prog-dse-l6', code: 'DSE-L6', name: 'Diploma in Software Engineering & Cloud Systems', departmentId: 'dept-computing', level: 'Level 6 Diploma', active: true },
      { id: 'prog-dbit-l6', code: 'DBIT-L6', name: 'Diploma in Business Information Technology', departmentId: 'dept-computing', level: 'Level 6 Diploma', active: true },
      { id: 'prog-dcs-l6', code: 'DCS-L6', name: 'Diploma in Cybersecurity & Digital Forensics', departmentId: 'dept-computing', level: 'Level 6 Diploma', active: true },
      { id: 'prog-cict-l5', code: 'CICT-L5', name: 'Certificate in Information Communication Technology (Level 5)', departmentId: 'dept-computing', level: 'Level 5 Certificate', active: true },
      { id: 'prog-daf-l6', code: 'DAF-L6', name: 'Diploma in Accountancy & Financial Management (KASNEB)', departmentId: 'dept-finance', level: 'Level 6 Diploma', active: true },
      { id: 'prog-dscm-l6', code: 'DSCM-L6', name: 'Diploma in Supply Chain & Procurement Management', departmentId: 'dept-procurement', level: 'Level 6 Diploma', active: true },
    ],
    intakes: [
      { id: 'int-sep-2026', code: 'SEP-2026', name: 'September 2026 Intake', startDate: '2026-09-07', active: true },
      { id: 'int-jan-2027', code: 'JAN-2027', name: 'January 2027 Intake', startDate: '2027-01-11', active: true },
      { id: 'int-may-2027', code: 'MAY-2027', name: 'May 2027 Intake', startDate: '2027-05-04', active: true },
    ],
    staffAccounts: SEED_STAFF,
    studentAccounts: [
      {
        id: 'stu-001',
        admissionNumber: 'HCA/STU/2026/001',
        fullName: 'Brian Kiprop Mutai',
        email: 'bmutai@student.hitech.ac.ke',
        programme: 'Diploma in Information Communication Technology',
        campusId: 'cmp-nairobi',
        campusName: 'Nairobi Main Campus',
        status: 'ACTIVE',
        createdAt: '2026-01-15T09:00:00.000Z',
        createdById: 'usr-adm-001',
      },
      {
        id: 'stu-002',
        admissionNumber: 'HCA/STU/2026/002',
        fullName: 'Faith Wanjiru Kamau',
        email: 'fkamau@student.hitech.ac.ke',
        programme: 'Diploma in Business Information Technology',
        campusId: 'cmp-westlands',
        campusName: 'Westlands Technology Park Campus',
        status: 'ACTIVE',
        createdAt: '2026-01-16T09:00:00.000Z',
        createdById: 'usr-adm-001',
      },
    ],
    staffInvitations: [],
    approvalWorkflows: [
      {
        id: 'wf-001',
        reference: 'WF-2026-001',
        title: 'Westlands Campus Evening Lab Extension Policy',
        category: 'CAMPUS_CONFIG',
        requestedById: 'usr-tech-001',
        requestedByName: 'Brian Kiptoo',
        campusName: 'Westlands Technology Park Campus',
        status: 'PENDING',
        createdAt: '2026-02-12T10:15:00.000Z',
      },
      {
        id: 'wf-002',
        reference: 'WF-2026-002',
        title: 'Trimester 2 Academic Registration Grace Window',
        category: 'ACADEMIC_POLICY',
        requestedById: 'usr-reg-001',
        requestedByName: 'H. Oduor',
        campusName: 'Nairobi Main Campus',
        status: 'PENDING',
        createdAt: '2026-02-14T11:30:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'tsk-seed-adm-1',
        staffId: 'usr-admin-001',
        role: 'ADMIN',
        title: 'Review pending institutional workflow approvals',
        description: 'Verify campus lab schedule extension and academic calendar addendum.',
        dueAt: '2026-11-20',
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tsk-seed-hod-1',
        staffId: 'usr-hod-001',
        role: 'HOD',
        title: 'Review Computing Lab practical examination schedule',
        description: 'Inspect ICT 2101 / AI 3102 draft submitted by Eng. Peter Kamau Njoroge.',
        dueAt: '2026-11-18',
        status: 'URGENT',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tsk-seed-lec-1',
        staffId: 'usr-lecturer-kamau',
        role: 'LECTURER',
        title: 'Finalize ICT 2101 continuous assessment marks',
        description: 'Verify CAT 1 & CAT 2 moderation entries for Nairobi Main Cohort.',
        dueAt: '2026-11-19',
        status: 'IN_PROGRESS',
        createdAt: now,
        updatedAt: now,
      },
    ],
    staffAuditLogs: [
      {
        id: 'sal-1',
        actorId: 'usr-principal-001',
        actorName: 'Dr. Samuel Karanja',
        actorRole: 'PRINCIPAL',
        action: 'POLICY_ISSUED',
        description: 'Issued TVETA Quality Assurance & Academic Calendar Charter 2026 (HCA/DOC/2026/000001).',
        departmentId: 'dept-principal',
        campusId: 'cmp-nairobi',
        isConfidential: false,
        createdAt: '2026-02-01T10:00:00.000Z',
      },
      {
        id: 'sal-2',
        actorId: 'usr-welfare',
        actorName: 'L. Wambui',
        actorRole: 'STUDENT_AFFAIRS',
        action: 'WELFARE_CASE_LOGGED',
        description: 'Recorded confidential student counselling assessment note (SWL-2026-04).',
        departmentId: 'dept-welfare',
        campusId: 'cmp-nairobi',
        isConfidential: true,
        confidentialScope: 'WELFARE_COUNSELLING',
        createdAt: '2026-02-10T11:05:00.000Z',
      },
    ],
    documentCategories: INITIAL_DOCUMENT_CATEGORIES.map((c) => ({ ...c, allowedMimeTypes: [...c.allowedMimeTypes] })),
    documents: [sampleDoc1, sampleDoc2, sampleDoc3],
    documentVersions: [
      {
        id: 'ver-seed-1',
        documentId: 'doc-seed-001',
        versionNumber: 1,
        title: sampleDoc1.title,
        subjectLine: sampleDoc1.subjectLine,
        bodyContent: sampleDoc1.bodyContent,
        metadataFields: sampleDoc1.metadataFields,
        editedById: sampleDoc1.createdById,
        editedByName: sampleDoc1.createdByName,
        changeNote: 'Initial approved edition',
        createdAt: sampleDoc1.createdAt,
      },
      {
        id: 'ver-seed-2',
        documentId: 'doc-seed-002',
        versionNumber: 1,
        title: sampleDoc2.title,
        subjectLine: sampleDoc2.subjectLine,
        bodyContent: sampleDoc2.bodyContent,
        metadataFields: sampleDoc2.metadataFields,
        editedById: sampleDoc2.createdById,
        editedByName: sampleDoc2.createdByName,
        changeNote: 'Initial confidential draft',
        createdAt: sampleDoc2.createdAt,
      },
      {
        id: 'ver-seed-3',
        documentId: 'doc-seed-003',
        versionNumber: 1,
        title: sampleDoc3.title,
        subjectLine: sampleDoc3.subjectLine,
        bodyContent: sampleDoc3.bodyContent,
        metadataFields: sampleDoc3.metadataFields,
        editedById: sampleDoc3.createdById,
        editedByName: sampleDoc3.createdByName,
        changeNote: 'Submitted for department review',
        createdAt: sampleDoc3.createdAt,
      },
    ],
    documentAttachments: [],
    documentPermissions: [],
    documentApprovals: [
      {
        id: 'app-seed-1',
        documentId: 'doc-seed-001',
        stepOrder: 1,
        reviewerId: 'usr-principal-001',
        reviewerName: 'Dr. Samuel Karanja',
        reviewerRole: 'PRINCIPAL',
        status: 'APPROVED',
        comment: 'Approved for institutional publication.',
        decidedAt: '2026-02-01T09:50:00.000Z',
        createdAt: '2026-01-29T10:00:00.000Z',
      },
      {
        id: 'app-seed-3',
        documentId: 'doc-seed-003',
        stepOrder: 1,
        reviewerId: 'usr-hod-001',
        reviewerName: 'Dr. Margaret Wambui',
        reviewerRole: 'HOD',
        status: 'PENDING',
        comment: null,
        decidedAt: null,
        createdAt: '2026-02-14T08:30:00.000Z',
      },
    ],
    documentComments: [
      {
        id: 'dcmt-seed-1',
        documentId: 'doc-seed-003',
        authorId: 'usr-hod-001',
        authorName: 'Dr. Margaret Wambui',
        authorRole: 'HOD',
        body: 'Confirm lab workstation count before final Examinations Office sign-off.',
        isInternal: true,
        createdAt: '2026-02-14T09:15:00.000Z',
      },
    ],
    documentRecipients: [],
    documentSignatures: [
      {
        id: 'sig-seed-1',
        documentId: 'doc-seed-001',
        signerId: 'usr-principal-001',
        signerName: 'Dr. Samuel Karanja',
        signerTitle: 'College Principal',
        signatureTitle: 'Authorized Institutional Signatory',
        signatureDigest: 'SIG-HCA-0001-94F2A8C1',
        signedAt: '2026-02-01T09:55:00.000Z',
      },
    ],
    documentTemplates: SEED_TEMPLATES,
    documentAuditLogs: [
      {
        id: 'daud-1',
        documentId: 'doc-seed-001',
        actorId: 'usr-principal-001',
        actorName: 'Dr. Samuel Karanja',
        actorRole: 'PRINCIPAL',
        action: 'DOCUMENT_ISSUED',
        detail: 'Issued official reference HCA/DOC/2026/000001 after independent approval and signature.',
        createdAt: '2026-02-01T10:00:00.000Z',
      },
      {
        id: 'daud-2',
        documentId: 'doc-seed-003',
        actorId: 'usr-lecturer-kamau',
        actorName: 'Eng. Peter Kamau Njoroge',
        actorRole: 'LECTURER',
        action: 'DOCUMENT_SUBMITTED',
        detail: 'Submitted practical exam schedule draft to HOD (Dr. Margaret Wambui).',
        createdAt: '2026-02-14T08:30:00.000Z',
      },
    ],
    documentRetentionPolicies: INITIAL_DOCUMENT_CATEGORIES.map((cat) => ({
      id: `ret-${cat.code.toLowerCase()}`,
      categoryCode: cat.code,
      moduleKey: cat.moduleKey,
      retentionDays: cat.retentionDays,
      actionAfterExpiry: cat.retentionDays >= 18250 ? ('ARCHIVE' as const) : ('REVIEW' as const),
      odpcBasis: cat.odpcBasis,
      active: cat.active,
      updatedById: 'usr-admin-001',
      updatedAt: now,
    })),
    documentRequests: [
      {
        id: 'dreq-seed-001',
        requestNumber: 'HCA/DREQ/2026/0001',
        targetUserId: 'acc-stu-001',
        targetUserName: 'Brian Kiprop Mutai',
        targetRegNo: 'HCA/STU/2026/0001',
        targetRole: 'STUDENT',
        requestedById: 'usr-reg-001',
        requestedByName: 'H. Oduor',
        requestedByRole: 'REGISTRAR',
        categoryCode: 'STUDENT_REGISTRATION_RECORD',
        moduleKey: 'STUDENT',
        title: 'Signed Trimester 2 Unit Registration Confirmation Form',
        instructions: 'Upload your signed Trimester 2 registration confirmation and national ID copy for academic registry audit.',
        dueDate: '2026-12-05',
        status: 'OPEN',
        fulfilledDocumentId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dreq-seed-002',
        requestNumber: 'HCA/DREQ/2026/0002',
        targetUserId: 'usr-lecturer-kamau',
        targetUserName: 'Eng. Peter Kamau Njoroge',
        targetRegNo: 'HCA/STAFF/2026/004',
        targetRole: 'LECTURER',
        requestedById: 'usr-hod-001',
        requestedByName: 'Dr. Margaret Wambui',
        requestedByRole: 'HOD',
        categoryCode: 'SCHEME_OF_WORK',
        moduleKey: 'LECTURER',
        title: 'Trimester 3 Scheme of Work — ICT 2101',
        instructions: 'Submit approved Scheme of Work prior to Week 1 lecture commencement.',
        dueDate: '2026-12-01',
        status: 'OPEN',
        fulfilledDocumentId: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    registrations: [
      {
        id: 'reg-seed-stu-001',
        registrationNumber: 'HCA/STU/2026/0001',
        category: 'STUDENT',
        subType: 'REGULAR_STUDENT',
        status: 'ACTIVATED',
        fullName: 'Brian Kiprop Mutai',
        email: 'bmutai@student.hitech.ac.ke',
        phone: '+254712345678',
        gender: 'Male',
        dateOfBirth: '2004-05-14',
        nationality: 'Kenyan',
        identificationNumberMasked: '****4821',
        identificationNumberHash: 'seed-hash-stu-001',
        identificationType: 'NATIONAL_ID',
        campusId: 'cmp-nairobi',
        campusName: 'Nairobi Main Campus',
        departmentId: 'dept-computing',
        departmentName: 'School of Computing & Informatics',
        userAccountId: 'acc-stu-001',
        accountStatus: 'CREATED',
        accountCreatedAt: '2026-01-14T10:00:00.000Z',
        collegeRecordId: 'stu-001',
        collegeRecordStatus: 'ENROLLED',
        portalAccessStatus: 'ACTIVATED',
        proposedRole: 'STUDENT',
        assignedRole: 'STUDENT',
        assignedPermissions: ['student.portal.access', 'student.units.register'],
        studentDetails: {
          programme: 'Diploma in Information Communication Technology',
          intake: 'January 2026 Intake',
          studyMode: 'FULL_TIME',
          previousInstitution: 'Kapsabet Boys High School',
          previousQualification: 'KCSE Certificate',
          previousGrade: 'B-',
          guardianName: 'Josephat Mutai',
          guardianPhone: '+254722111333',
          guardianEmail: 'jmutai@example.co.ke',
          guardianRelationship: 'Father',
          feeCategory: 'SELF_SPONSORED',
          sponsorshipReference: 'SELF-2026-001',
        },
        documents: [
          { docType: 'National ID Copy', fileName: 'brian_id.pdf', mimeType: 'application/pdf', sizeBytes: 245000, verified: true },
          { docType: 'KCSE Certificate', fileName: 'kcse_slip.pdf', mimeType: 'application/pdf', sizeBytes: 412000, verified: true },
        ],
        odpcConsentAccepted: true,
        odpcConsentTimestamp: '2026-01-13T09:15:00.000Z',
        duplicateFlag: false,
        duplicateNotes: null,
        reviewerComment: 'Verified against KNEC/KUCCPS admission bundle.',
        createdById: 'usr-adm-001',
        createdByName: 'Alice Mutua',
        createdByRole: 'ADMISSIONS_OFFICER',
        submittedAt: '2026-01-13T09:20:00.000Z',
        reviewedById: 'usr-reg-001',
        reviewedByName: 'H. Oduor',
        reviewedAt: '2026-01-14T09:50:00.000Z',
        approvedById: 'usr-reg-001',
        approvedByName: 'H. Oduor',
        approvedAt: '2026-01-14T10:00:00.000Z',
        activatedAt: '2026-01-15T08:00:00.000Z',
        createdAt: '2026-01-13T09:15:00.000Z',
        updatedAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'reg-seed-stu-002',
        registrationNumber: null,
        category: 'STUDENT',
        subType: 'REGULAR_STUDENT',
        status: 'SUBMITTED',
        fullName: 'Mercy Chelangat Too',
        email: 'mchelangat@applicant.hitech.ac.ke',
        phone: '+254723889900',
        gender: 'Female',
        dateOfBirth: '2005-09-21',
        nationality: 'Kenyan',
        identificationNumberMasked: '****9032',
        identificationNumberHash: 'seed-hash-stu-002',
        identificationType: 'NATIONAL_ID',
        campusId: 'cmp-westlands',
        campusName: 'Westlands Technology Park Campus',
        departmentId: 'dept-computing',
        departmentName: 'School of Computing & Informatics',
        userAccountId: null,
        accountStatus: 'NOT_CREATED',
        accountCreatedAt: null,
        collegeRecordId: null,
        collegeRecordStatus: 'PENDING_VERIFICATION',
        portalAccessStatus: 'INACTIVE',
        proposedRole: 'STUDENT',
        assignedRole: null,
        assignedPermissions: [],
        studentDetails: {
          programme: 'Diploma in Software Engineering & Cloud Systems',
          intake: 'September 2026 Intake',
          studyMode: 'FULL_TIME',
          previousInstitution: 'Moi Girls Eldoret',
          previousQualification: 'KCSE Certificate',
          previousGrade: 'B+',
          guardianName: 'Esther Too',
          guardianPhone: '+254733445566',
          guardianEmail: 'etoo@example.co.ke',
          guardianRelationship: 'Mother',
          feeCategory: 'HELB_LOAN',
          sponsorshipReference: 'HELB-2026-7712',
        },
        documents: [
          { docType: 'National ID Copy', fileName: 'mercy_id.pdf', mimeType: 'application/pdf', sizeBytes: 198000, verified: true },
          { docType: 'KCSE Certificate', fileName: 'mercy_kcse.pdf', mimeType: 'application/pdf', sizeBytes: 318000, verified: false },
        ],
        odpcConsentAccepted: true,
        odpcConsentTimestamp: '2026-02-12T10:15:00.000Z',
        duplicateFlag: false,
        duplicateNotes: null,
        reviewerComment: null,
        createdById: 'usr-adm-001',
        createdByName: 'Alice Mutua',
        createdByRole: 'ADMISSIONS_OFFICER',
        submittedAt: '2026-02-12T10:20:00.000Z',
        reviewedById: null,
        reviewedByName: null,
        reviewedAt: null,
        approvedById: null,
        approvedByName: null,
        approvedAt: null,
        activatedAt: null,
        createdAt: '2026-02-12T10:15:00.000Z',
        updatedAt: '2026-02-12T10:20:00.000Z',
      },
      {
        id: 'reg-seed-stf-001',
        registrationNumber: null,
        category: 'STAFF',
        subType: 'LECTURER',
        status: 'SUBMITTED',
        fullName: 'Dr. Dennis Omondi Otieno',
        email: 'domondi@hitech.ac.ke',
        phone: '+254719442211',
        gender: 'Male',
        dateOfBirth: '1988-03-11',
        nationality: 'Kenyan',
        identificationNumberMasked: '****3317',
        identificationNumberHash: 'seed-hash-stf-001',
        identificationType: 'NATIONAL_ID',
        campusId: 'cmp-nairobi',
        campusName: 'Nairobi Main Campus',
        departmentId: 'dept-computing',
        departmentName: 'School of Computing & Informatics',
        userAccountId: null,
        accountStatus: 'NOT_CREATED',
        accountCreatedAt: null,
        collegeRecordId: null,
        collegeRecordStatus: 'PENDING_VERIFICATION',
        portalAccessStatus: 'INACTIVE',
        proposedRole: 'LECTURER',
        assignedRole: null,
        assignedPermissions: [],
        staffDetails: {
          employeeType: 'LECTURER',
          jobTitle: 'Senior Lecturer in Cybersecurity',
          supervisorName: 'Dr. Margaret Wambui (HOD)',
          contractType: 'FIXED_TERM',
          startDate: '2026-09-01',
          endDate: '2029-08-31',
          highestQualification: 'PhD Computer Science',
          specialization: 'Network Forensics & Applied Cryptography',
          emergencyContactName: 'Lilian Otieno',
          emergencyContactPhone: '+254720554433',
          teachingUnitsRequested: ['SEC 3201 · Network Forensics'],
          compensationBandConfidential: 'Scale L4 (HR & Principal Only)',
        },
        documents: [
          { docType: 'Signed Appointment Letter', fileName: 'appointment_draft.pdf', mimeType: 'application/pdf', sizeBytes: 512000, verified: true },
          { docType: 'Academic Transcripts', fileName: 'phd_cert.pdf', mimeType: 'application/pdf', sizeBytes: 820000, verified: true },
        ],
        odpcConsentAccepted: true,
        odpcConsentTimestamp: '2026-02-13T11:00:00.000Z',
        duplicateFlag: false,
        duplicateNotes: null,
        reviewerComment: null,
        createdById: 'usr-hr-primary',
        createdByName: 'Beatrice Wanjiku Mwangi',
        createdByRole: 'HR',
        submittedAt: '2026-02-13T11:05:00.000Z',
        reviewedById: null,
        reviewedByName: null,
        reviewedAt: null,
        approvedById: null,
        approvedByName: null,
        approvedAt: null,
        activatedAt: null,
        createdAt: '2026-02-13T11:00:00.000Z',
        updatedAt: '2026-02-13T11:05:00.000Z',
      },
      {
        id: 'reg-seed-par-001',
        registrationNumber: 'HCA/PAR/2026/0001',
        category: 'PARENT',
        subType: 'GUARDIAN',
        status: 'INVITED',
        fullName: 'Josephat Mutai',
        email: 'jmutai@example.co.ke',
        phone: '+254722111333',
        gender: 'Male',
        dateOfBirth: '1976-08-03',
        nationality: 'Kenyan',
        identificationNumberMasked: '****7104',
        identificationNumberHash: 'seed-hash-par-001',
        identificationType: 'NATIONAL_ID',
        campusId: 'cmp-nairobi',
        campusName: 'Nairobi Main Campus',
        departmentId: 'dept-welfare',
        departmentName: 'Student Welfare & Campus Life',
        userAccountId: 'acc-par-001',
        accountStatus: 'CREATED',
        accountCreatedAt: '2026-02-05T14:00:00.000Z',
        collegeRecordId: 'par-001',
        collegeRecordStatus: 'ENROLLED',
        portalAccessStatus: 'INVITED',
        proposedRole: 'PARENT',
        assignedRole: 'PARENT',
        assignedPermissions: ['parent.portal.view_linked_student'],
        otherDetails: {
          linkedStudentNumber: 'HCA/STU/2026/0001',
          linkedStudentName: 'Brian Kiprop Mutai',
          relationshipToStudent: 'Father',
          relationshipVerified: true,
        },
        documents: [
          { docType: 'Guardian National ID', fileName: 'guardian_id.pdf', mimeType: 'application/pdf', sizeBytes: 185000, verified: true },
        ],
        odpcConsentAccepted: true,
        odpcConsentTimestamp: '2026-02-04T09:00:00.000Z',
        duplicateFlag: false,
        duplicateNotes: null,
        reviewerComment: 'Guardian relationship verified by Student Affairs.',
        createdById: 'usr-welfare',
        createdByName: 'L. Wambui',
        createdByRole: 'STUDENT_AFFAIRS',
        submittedAt: '2026-02-04T09:10:00.000Z',
        reviewedById: 'usr-reg-001',
        reviewedByName: 'H. Oduor',
        reviewedAt: '2026-02-05T13:55:00.000Z',
        approvedById: 'usr-reg-001',
        approvedByName: 'H. Oduor',
        approvedAt: '2026-02-05T14:00:00.000Z',
        activatedAt: null,
        createdAt: '2026-02-04T09:00:00.000Z',
        updatedAt: '2026-02-05T14:15:00.000Z',
      },
      {
        id: 'reg-seed-ctr-001',
        registrationNumber: 'HCA/CTR/2026/0001',
        category: 'CONTRACTOR',
        subType: 'IT_VENDOR',
        status: 'APPROVED',
        fullName: 'Samuel Mwangi (Apex Fiber Systems)',
        email: 'smwangi@apexfiber.co.ke',
        phone: '+254701998877',
        gender: 'Male',
        dateOfBirth: '1984-11-19',
        nationality: 'Kenyan',
        identificationNumberMasked: '****6219',
        identificationNumberHash: 'seed-hash-ctr-001',
        identificationType: 'NATIONAL_ID',
        campusId: 'cmp-westlands',
        campusName: 'Westlands Technology Park Campus',
        departmentId: 'dept-procurement',
        departmentName: 'Procurement & Tendering',
        userAccountId: 'acc-ctr-001',
        accountStatus: 'CREATED',
        accountCreatedAt: '2026-02-11T15:00:00.000Z',
        collegeRecordId: 'ctr-001',
        collegeRecordStatus: 'ENROLLED',
        portalAccessStatus: 'INACTIVE',
        proposedRole: 'CONTRACTOR',
        assignedRole: 'CONTRACTOR',
        assignedPermissions: ['contractor.workorders.view'],
        otherDetails: {
          organizationName: 'Apex Fiber Systems Ltd',
          contractOrMouRef: 'LPO-2026-0419',
          departmentSponsor: 'ICT Infrastructure & Help Desk',
          accessExpiryDate: '2026-12-31',
        },
        documents: [
          { docType: 'Signed SLA / Contract', fileName: 'apex_sla.pdf', mimeType: 'application/pdf', sizeBytes: 420000, verified: true },
        ],
        odpcConsentAccepted: true,
        odpcConsentTimestamp: '2026-02-10T08:00:00.000Z',
        duplicateFlag: false,
        duplicateNotes: null,
        reviewerComment: 'Approved with strict campus expiry date.',
        createdById: 'usr-proc-001',
        createdByName: 'E. Chebet',
        createdByRole: 'PROCUREMENT_OFFICER',
        submittedAt: '2026-02-10T08:30:00.000Z',
        reviewedById: 'usr-principal-001',
        reviewedByName: 'Dr. Samuel Karanja',
        reviewedAt: '2026-02-11T14:50:00.000Z',
        approvedById: 'usr-principal-001',
        approvedByName: 'Dr. Samuel Karanja',
        approvedAt: '2026-02-11T15:00:00.000Z',
        activatedAt: null,
        createdAt: '2026-02-10T08:00:00.000Z',
        updatedAt: '2026-02-11T15:00:00.000Z',
      },
      {
        id: 'reg-seed-gst-001',
        registrationNumber: null,
        category: 'GUEST',
        subType: 'EXTERNAL_EXAMINER',
        status: 'DRAFT',
        fullName: 'Prof. Esther Njeri Kariuki',
        email: 'ekariuki@external-board.org',
        phone: '+254734112233',
        gender: 'Female',
        dateOfBirth: '1970-06-12',
        nationality: 'Kenyan',
        identificationNumberMasked: '****5508',
        identificationNumberHash: 'seed-hash-gst-001',
        identificationType: 'NATIONAL_ID',
        campusId: 'cmp-nairobi',
        campusName: 'Nairobi Main Campus',
        departmentId: 'dept-reception',
        departmentName: 'Front Office & Client Services',
        userAccountId: null,
        accountStatus: 'NOT_CREATED',
        accountCreatedAt: null,
        collegeRecordId: null,
        collegeRecordStatus: 'UNENROLLED',
        portalAccessStatus: 'INACTIVE',
        proposedRole: 'GUEST',
        assignedRole: null,
        assignedPermissions: [],
        otherDetails: {
          hostStaffName: 'H. Oduor (Chief Academic Registrar)',
          visitPurpose: 'TVETA External Moderation Review',
          accessExpiryDate: '2026-11-30',
          visitorBadgeCode: 'GST-TEMP-204',
        },
        documents: [],
        odpcConsentAccepted: true,
        odpcConsentTimestamp: '2026-02-14T07:45:00.000Z',
        duplicateFlag: false,
        duplicateNotes: null,
        reviewerComment: null,
        createdById: 'usr-rec-001',
        createdByName: 'S. Akinyi',
        createdByRole: 'RECEPTIONIST',
        submittedAt: null,
        reviewedById: null,
        reviewedByName: null,
        reviewedAt: null,
        approvedById: null,
        approvedByName: null,
        approvedAt: null,
        activatedAt: null,
        createdAt: '2026-02-14T07:45:00.000Z',
        updatedAt: '2026-02-14T07:45:00.000Z',
      },
    ],
    activationInvitations: [
      {
        id: 'inv-seed-par-001',
        registrationId: 'reg-seed-par-001',
        email: 'jmutai@example.co.ke',
        fullName: 'Josephat Mutai',
        category: 'PARENT',
        assignedRole: 'PARENT',
        tokenHash: '1b8b4e386d4234a5d2219a7fd5e3e1c9f62f2c3f059c5b2b6b8d0c41e18a2a19',
        tokenHint: '****AR01',
        status: 'PENDING',
        sentById: 'usr-reg-001',
        sentByName: 'H. Oduor',
        expiresAt: '2027-12-31T23:59:59.000Z',
        usedAt: null,
        createdAt: '2026-02-05T14:15:00.000Z',
      },
    ],
    registrationAuditLogs: [
      {
        id: 'raud-1',
        registrationId: 'reg-seed-stu-001',
        actorId: 'usr-reg-001',
        actorName: 'H. Oduor',
        actorRole: 'REGISTRAR',
        action: 'REGISTRATION_APPROVED',
        category: 'STUDENT',
        detail: 'Approved student registration and allocated HCA/STU/2026/0001.',
        isConfidential: false,
        createdAt: '2026-01-14T10:00:00.000Z',
      },
      {
        id: 'raud-2',
        registrationId: 'reg-seed-par-001',
        actorId: 'usr-reg-001',
        actorName: 'H. Oduor',
        actorRole: 'REGISTRAR',
        action: 'INVITATION_SENT',
        category: 'PARENT',
        detail: 'Dispatched single-use portal activation invitation for parent HCA/PAR/2026/0001.',
        isConfidential: false,
        createdAt: '2026-02-05T14:15:00.000Z',
      },
      {
        id: 'raud-3',
        registrationId: 'reg-seed-stf-001',
        actorId: 'usr-hr-primary',
        actorName: 'Beatrice Wanjiku Mwangi',
        actorRole: 'HR',
        action: 'REGISTRATION_SUBMITTED',
        category: 'STAFF',
        detail: 'Submitted staff onboarding file for Dr. Dennis Omondi Otieno (awaiting independent Principal approval).',
        isConfidential: true,
        createdAt: '2026-02-13T11:05:00.000Z',
      },
    ],
    websiteDepartments: SEED_WEBSITE_DEPARTMENTS.map((d) => ({ ...d })),
    websiteStaffProfiles: SEED_WEBSITE_STAFF.map((s) => ({ ...s })),
    departmentStaffAssignments: SEED_DEPARTMENT_ASSIGNMENTS.map((a) => ({ ...a })),
    websiteAuditLogs: SEED_WEBSITE_AUDIT_LOGS.map((l) => ({ ...l })),
    admissionApplications: SEED_ADMISSION_APPLICATIONS.map((a) => ({ ...a })),
    newsletterSubscribers: [],
    cookieConsentAudits: [],
    ...createTeachingModuleSeed(),
    ...(() => {
      const eventsSeed = createEventsModuleSeed();
      return {
        collegeEvents: eventsSeed.collegeEvents,
        collegeEventSchedules: eventsSeed.collegeEventSchedules,
        collegeEventSpeakers: eventsSeed.collegeEventSpeakers,
        collegeEventRegistrations: eventsSeed.collegeEventRegistrations,
        collegeEventVenues: eventsSeed.collegeEventVenues,
        collegeEventPayments: eventsSeed.collegeEventPayments,
        collegeEventInvitations: eventsSeed.collegeEventInvitations,
        collegeEventFeedbacks: eventsSeed.collegeEventFeedbacks,
        collegeEventCertificates: eventsSeed.collegeEventCertificates,
        collegeEventMedia: eventsSeed.collegeEventMedia,
        collegeEventNotifications: eventsSeed.collegeEventNotifications,
        collegeEventAuditLogs: eventsSeed.collegeEventAuditLogs,
        eventSettings: eventsSeed.eventSettings,
        ...createSecureExamSeed(),
        ...createFinanceModuleSeed(),
      };
    })(),
  };
}

let cachedDb: PortalDatabase | null = null;

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hydrateDatabaseDefaults(loaded: Partial<PortalDatabase>): PortalDatabase {
  const seed = createSeedDatabase();
  const baseStaff = Array.isArray(loaded.staffAccounts) ? loaded.staffAccounts : seed.staffAccounts;
  const mergedStaff = baseStaff.map((acc) => {
    const rolePerms = ROLE_TO_STAFF_PERMISSIONS[acc.role] ?? [];
    const existingSet = new Set(acc.permissions || []);
    for (const perm of rolePerms) {
      if (perm !== 'teaching.evidence.view_restricted' || acc.role !== 'ADMIN') {
        existingSet.add(perm);
      }
    }
    const roleDocPerms = ROLE_DOCUMENT_PERMISSIONS[acc.role] ?? [];
    const existingDocSet = new Set(acc.documentPermissions || []);
    for (const docPerm of roleDocPerms) {
      existingDocSet.add(docPerm);
    }
    return {
      ...acc,
      permissions: Array.from(existingSet),
      documentPermissions: Array.from(existingDocSet),
    };
  });
  for (const sAcc of seed.staffAccounts) {
    if (!mergedStaff.some((m) => m.id === sAcc.id)) {
      mergedStaff.push(sAcc);
    }
  }
  return {
    ...seed,
    ...loaded,
    staffAccounts: mergedStaff,
    sequences: {
      ...seed.sequences,
      ...(loaded.sequences ?? {}),
      registrationSeq: {
        ...seed.sequences.registrationSeq,
        ...(loaded.sequences?.registrationSeq ?? {}),
      },
    },
    programmes: Array.isArray(loaded.programmes) ? loaded.programmes : seed.programmes,
    intakes: Array.isArray(loaded.intakes) ? loaded.intakes : seed.intakes,
    registrations: Array.isArray(loaded.registrations) ? loaded.registrations : seed.registrations,
    activationInvitations: Array.isArray(loaded.activationInvitations)
      ? loaded.activationInvitations
      : seed.activationInvitations,
    registrationAuditLogs: Array.isArray(loaded.registrationAuditLogs)
      ? loaded.registrationAuditLogs
      : seed.registrationAuditLogs,
    websiteDepartments: Array.isArray(loaded.websiteDepartments)
      ? loaded.websiteDepartments
      : seed.websiteDepartments,
    websiteStaffProfiles: Array.isArray(loaded.websiteStaffProfiles)
      ? loaded.websiteStaffProfiles
      : seed.websiteStaffProfiles,
    departmentStaffAssignments: Array.isArray(loaded.departmentStaffAssignments)
      ? loaded.departmentStaffAssignments
      : seed.departmentStaffAssignments,
    websiteAuditLogs: Array.isArray(loaded.websiteAuditLogs)
      ? loaded.websiteAuditLogs
      : seed.websiteAuditLogs,
    admissionApplications: Array.isArray(loaded.admissionApplications)
      ? loaded.admissionApplications
      : seed.admissionApplications,
    newsletterSubscribers: Array.isArray(loaded.newsletterSubscribers)
      ? loaded.newsletterSubscribers
      : seed.newsletterSubscribers,
    cookieConsentAudits: Array.isArray(loaded.cookieConsentAudits)
      ? loaded.cookieConsentAudits
      : seed.cookieConsentAudits,
    teachingTimetableSlots: Array.isArray(loaded.teachingTimetableSlots)
      ? loaded.teachingTimetableSlots
      : seed.teachingTimetableSlots,
    teachingDocuments: Array.isArray(loaded.teachingDocuments)
      ? loaded.teachingDocuments
      : seed.teachingDocuments,
    teachingDocumentVersions: Array.isArray(loaded.teachingDocumentVersions)
      ? loaded.teachingDocumentVersions
      : seed.teachingDocumentVersions,
    teachingDocumentApprovals: Array.isArray(loaded.teachingDocumentApprovals)
      ? loaded.teachingDocumentApprovals
      : seed.teachingDocumentApprovals,
    schemesOfWork: Array.isArray(loaded.schemesOfWork)
      ? loaded.schemesOfWork
      : seed.schemesOfWork,
    attendanceSessions: Array.isArray(loaded.attendanceSessions)
      ? loaded.attendanceSessions
      : seed.attendanceSessions,
    attendanceCorrections: Array.isArray(loaded.attendanceCorrections)
      ? loaded.attendanceCorrections
      : seed.attendanceCorrections,
    lessonDeliveryRecords: Array.isArray(loaded.lessonDeliveryRecords)
      ? loaded.lessonDeliveryRecords
      : seed.lessonDeliveryRecords,
    lessonObservations: Array.isArray(loaded.lessonObservations)
      ? loaded.lessonObservations
      : seed.lessonObservations,
    studentAbsenceCases: Array.isArray(loaded.studentAbsenceCases)
      ? loaded.studentAbsenceCases
      : seed.studentAbsenceCases,
    absenceExplanations: Array.isArray(loaded.absenceExplanations)
      ? loaded.absenceExplanations
      : seed.absenceExplanations,
    absenceEvidence: Array.isArray(loaded.absenceEvidence)
      ? loaded.absenceEvidence
      : seed.absenceEvidence,
    absenceReviews: Array.isArray(loaded.absenceReviews)
      ? loaded.absenceReviews
      : seed.absenceReviews,
    absenceEscalations: Array.isArray(loaded.absenceEscalations)
      ? loaded.absenceEscalations
      : seed.absenceEscalations,
    catchUpLessons: Array.isArray(loaded.catchUpLessons)
      ? loaded.catchUpLessons
      : seed.catchUpLessons,
    academicInterventions: Array.isArray(loaded.academicInterventions)
      ? loaded.academicInterventions
      : seed.academicInterventions,
    attendancePolicy: loaded.attendancePolicy
      ? { ...seed.attendancePolicy, ...loaded.attendancePolicy }
      : seed.attendancePolicy,
    attendanceAlerts: Array.isArray(loaded.attendanceAlerts)
      ? loaded.attendanceAlerts
      : seed.attendanceAlerts,
    teachingAuditLogs: Array.isArray(loaded.teachingAuditLogs)
      ? loaded.teachingAuditLogs
      : seed.teachingAuditLogs,
    collegeEvents: (Array.isArray(loaded.collegeEvents) ? loaded.collegeEvents : seed.collegeEvents).map(
      (ev, idx) => ({
        ...ev,
        eventCode: ev.eventCode || `HTE-2026-${String(idx + 1).padStart(3, '0')}`,
        endDate: ev.endDate || ev.eventDate,
        timezone: ev.timezone || 'Africa/Nairobi',
        isMultiDay: ev.isMultiDay ?? false,
        recurrencePattern: ev.recurrencePattern || ('NONE' as const),
        campus: ev.campus || 'Nairobi Main Campus',
        venueId: ev.venueId ?? null,
        building: ev.building ?? '',
        room: ev.room ?? '',
        mapsLink: ev.mapsLink ?? '',
        onlinePlatform: ev.onlinePlatform ?? '',
        accessibilityInfo: ev.accessibilityInfo ?? '',
        parkingInfo: ev.parkingInfo ?? '',
        showContactPhonePublicly: ev.showContactPhonePublicly ?? true,
        language: ev.language || 'English',
        tags: Array.isArray(ev.tags) ? ev.tags : [],
        visibility: ev.visibility || ('PUBLIC' as const),
        waitlistCapacity: ev.waitlistCapacity ?? 25,
        checkedOutCount: ev.checkedOutCount ?? 0,
        registrationOpenDate: ev.registrationOpenDate || ev.createdAt || '2026-01-01T08:00:00.000Z',
        studentFeeAmount: ev.studentFeeAmount ?? (ev.isPaid ? Math.round((ev.feeAmount || 0) * 0.5) : 0),
        reminderHours: Array.isArray(ev.reminderHours) ? ev.reminderHours : [24, 2],
        confirmationMessage: ev.confirmationMessage ?? '',
        certificateEnabled: ev.certificateEnabled ?? false,
        certificateType: ev.certificateType || 'Certificate of Participation',
        certificateMinAttendance: ev.certificateMinAttendance ?? true,
        feedbackEnabled: ev.feedbackEnabled ?? true,
      })
    ),
    collegeEventSchedules: (Array.isArray(loaded.collegeEventSchedules)
      ? loaded.collegeEventSchedules
      : seed.collegeEventSchedules
    ).map((sc) => ({
      ...sc,
      dayNumber: sc.dayNumber ?? 1,
    })),
    collegeEventSpeakers: (Array.isArray(loaded.collegeEventSpeakers)
      ? loaded.collegeEventSpeakers
      : seed.collegeEventSpeakers
    ).map((sp) => ({
      ...sp,
      speakerRole: sp.speakerRole || ('Guest Speaker' as const),
      confirmationStatus: sp.confirmationStatus || ('CONFIRMED' as const),
    })),
    collegeEventRegistrations: (Array.isArray(loaded.collegeEventRegistrations)
      ? loaded.collegeEventRegistrations
      : seed.collegeEventRegistrations
    ).map((reg) => ({
      ...reg,
      ticketType: reg.ticketType || 'General Admission',
      paymentStatus: reg.paymentStatus || ('PAID' as const),
      amountDue: reg.amountDue ?? 0,
      amountPaid: reg.amountPaid ?? 0,
      checkedOut: reg.checkedOut ?? false,
      checkedOutAt: reg.checkedOutAt ?? null,
      organiserNotes: reg.organiserNotes ?? '',
      certificateCode: reg.certificateCode ?? null,
    })),
    collegeEventVenues: Array.isArray(loaded.collegeEventVenues)
      ? loaded.collegeEventVenues
      : seed.collegeEventVenues,
    collegeEventPayments: Array.isArray(loaded.collegeEventPayments)
      ? loaded.collegeEventPayments
      : seed.collegeEventPayments,
    collegeEventInvitations: Array.isArray(loaded.collegeEventInvitations)
      ? loaded.collegeEventInvitations
      : seed.collegeEventInvitations,
    collegeEventFeedbacks: Array.isArray(loaded.collegeEventFeedbacks)
      ? loaded.collegeEventFeedbacks
      : seed.collegeEventFeedbacks,
    collegeEventCertificates: Array.isArray(loaded.collegeEventCertificates)
      ? loaded.collegeEventCertificates
      : seed.collegeEventCertificates,
    collegeEventMedia: Array.isArray(loaded.collegeEventMedia)
      ? loaded.collegeEventMedia
      : seed.collegeEventMedia,
    collegeEventNotifications: Array.isArray(loaded.collegeEventNotifications)
      ? loaded.collegeEventNotifications
      : seed.collegeEventNotifications,
    collegeEventAuditLogs: Array.isArray(loaded.collegeEventAuditLogs)
      ? loaded.collegeEventAuditLogs
      : seed.collegeEventAuditLogs,
    eventSettings: loaded.eventSettings
      ? { ...seed.eventSettings, ...loaded.eventSettings }
      : seed.eventSettings,
    secureExamDefinitions: Array.isArray(loaded.secureExamDefinitions)
      ? loaded.secureExamDefinitions
      : seed.secureExamDefinitions,
    secureExamSessions: Array.isArray(loaded.secureExamSessions)
      ? loaded.secureExamSessions
      : seed.secureExamSessions,
    secureExamEvents: Array.isArray(loaded.secureExamEvents)
      ? loaded.secureExamEvents
      : seed.secureExamEvents,
    secureExamIncidents: Array.isArray(loaded.secureExamIncidents)
      ? loaded.secureExamIncidents
      : seed.secureExamIncidents,
    secureExamAuditLogs: Array.isArray(loaded.secureExamAuditLogs)
      ? loaded.secureExamAuditLogs
      : seed.secureExamAuditLogs,
    secureExamMessages: Array.isArray(loaded.secureExamMessages)
      ? loaded.secureExamMessages
      : seed.secureExamMessages,
    financeStudentAccounts: Array.isArray(loaded.financeStudentAccounts)
      ? loaded.financeStudentAccounts
      : seed.financeStudentAccounts,
    financeLedgerCharges: Array.isArray(loaded.financeLedgerCharges)
      ? loaded.financeLedgerCharges
      : seed.financeLedgerCharges,
    financePayments: Array.isArray(loaded.financePayments)
      ? loaded.financePayments
      : seed.financePayments,
    mpesaTransactions: Array.isArray(loaded.mpesaTransactions)
      ? loaded.mpesaTransactions
      : seed.mpesaTransactions,
    financeReceipts: Array.isArray(loaded.financeReceipts)
      ? loaded.financeReceipts
      : seed.financeReceipts,
    financeFeeStructures: Array.isArray(loaded.financeFeeStructures)
      ? loaded.financeFeeStructures
      : seed.financeFeeStructures,
    financePaymentPlans: Array.isArray(loaded.financePaymentPlans)
      ? loaded.financePaymentPlans
      : seed.financePaymentPlans,
    financeClearances: Array.isArray(loaded.financeClearances)
      ? loaded.financeClearances
      : seed.financeClearances,
    financeRefundRequests: Array.isArray(loaded.financeRefundRequests)
      ? loaded.financeRefundRequests
      : seed.financeRefundRequests,
    financeAuditLogs: Array.isArray(loaded.financeAuditLogs)
      ? loaded.financeAuditLogs
      : seed.financeAuditLogs,
    documentCategories: Array.isArray(loaded.documentCategories) && loaded.documentCategories.length > 0
      ? loaded.documentCategories
      : seed.documentCategories,
    documentAttachments: Array.isArray(loaded.documentAttachments)
      ? loaded.documentAttachments
      : seed.documentAttachments,
    documentPermissions: Array.isArray(loaded.documentPermissions)
      ? loaded.documentPermissions
      : seed.documentPermissions,
    documentComments: Array.isArray(loaded.documentComments)
      ? loaded.documentComments
      : seed.documentComments,
    documentRetentionPolicies: Array.isArray(loaded.documentRetentionPolicies) && loaded.documentRetentionPolicies.length > 0
      ? loaded.documentRetentionPolicies
      : seed.documentRetentionPolicies,
    documentRequests: Array.isArray(loaded.documentRequests)
      ? loaded.documentRequests
      : seed.documentRequests,
  };
}

let postgresSyncHook: ((db: PortalDatabase) => Promise<void>) | null = null;
let syncChain: Promise<void> = Promise.resolve();
let suppressSyncHook = false;

function isTestRunnerEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    Boolean(process.env.NODE_TEST_CONTEXT) ||
    process.execArgv.some((arg) => arg.includes('test')) ||
    process.argv.some((arg) => arg.includes('--test') || /\.test\.[cm]?[jt]sx?$/i.test(arg))
  );
}

export function registerPostgresSyncHook(
  hook: (db: PortalDatabase) => Promise<void>
): void {
  postgresSyncHook = hook;
}

export function hydrateDbFromSnapshot(snapshot: Partial<PortalDatabase>): PortalDatabase {
  const hydrated = hydrateDatabaseDefaults(snapshot);
  suppressSyncHook = true;
  try {
    saveDb(hydrated);
  } finally {
    suppressSyncHook = false;
  }
  return hydrated;
}

export function getDb(): PortalDatabase {
  if (cachedDb) return cachedDb;
  ensureDir();
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      cachedDb = hydrateDatabaseDefaults(JSON.parse(raw) as Partial<PortalDatabase>);
      return cachedDb;
    } catch {
      // fallback to fresh seed if corrupted
    }
  }
  cachedDb = createSeedDatabase();
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(db: PortalDatabase): void {
  ensureDir();
  cachedDb = db;
  const tmpPath = `${DB_PATH}.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);

  if (!suppressSyncHook && postgresSyncHook && !isTestRunnerEnvironment()) {
    const hook = postgresSyncHook;
    const snapshotCopy = JSON.parse(JSON.stringify(db)) as PortalDatabase;
    syncChain = syncChain
      .then(() => hook(snapshotCopy))
      .catch((err) => {
        console.error('Background PostgreSQL sync error:', err);
      });
  }
}

/**
 * Atomic sequential generator — invoked exclusively at issuance/approval points.
 */
export function allocateDocumentReference(db: PortalDatabase): string {
  db.sequences.documentIssuedSeq += 1;
  const year = new Date().getFullYear();
  return `HCA/DOC/${year}/${String(db.sequences.documentIssuedSeq).padStart(6, '0')}`;
}

export function allocateStudentAdmissionNumber(db: PortalDatabase): string {
  db.sequences.studentSeq += 1;
  const year = new Date().getFullYear();
  return `HCA/STU/${year}/${String(db.sequences.studentSeq).padStart(3, '0')}`;
}

export function allocateEmployeeNumber(db: PortalDatabase): string {
  db.sequences.staffSeq += 1;
  const year = new Date().getFullYear();
  return `HCA/STAFF/${year}/${String(db.sequences.staffSeq).padStart(3, '0')}`;
}

/**
 * Atomic category-specific college registration number generator.
 * Invoked ONLY when a registration is approved / account created — never on draft!
 */
export function allocateRegistrationNumber(
  db: PortalDatabase,
  category: RegistrationCategory
): string {
  const current = db.sequences.registrationSeq[category] ?? 0;
  const next = current + 1;
  db.sequences.registrationSeq[category] = next;
  const year = new Date().getFullYear();
  const prefix = REGISTRATION_NUMBER_PREFIX[category];
  return `${prefix}/${year}/${String(next).padStart(4, '0')}`;
}

export function allocateEventRegistrationNumber(db: PortalDatabase): string {
  const current = db.sequences.eventRegSeq ?? 12;
  const next = current + 1;
  db.sequences.eventRegSeq = next;
  const year = new Date().getFullYear();
  return `HTE-EVT-${year}-${String(next).padStart(4, '0')}`;
}

export function allocateEventCode(db: PortalDatabase): string {
  const current = db.sequences.eventCodeSeq ?? 8;
  const next = current + 1;
  db.sequences.eventCodeSeq = next;
  const year = new Date().getFullYear();
  return `HTE-${year}-${String(next).padStart(3, '0')}`;
}

export function allocateCertificateNumber(db: PortalDatabase): string {
  const current = db.sequences.eventCertSeq ?? 2;
  const next = current + 1;
  db.sequences.eventCertSeq = next;
  const year = new Date().getFullYear();
  return `HTE-CERT-${year}-${String(next).padStart(4, '0')}`;
}

export function allocateFinanceReceiptNumber(db: PortalDatabase): string {
  const current = db.sequences.financeReceiptSeq ?? 2;
  const next = current + 1;
  db.sequences.financeReceiptSeq = next;
  const year = new Date().getFullYear();
  return `RCT-${year}-${String(next).padStart(4, '0')}`;
}

export function allocateDocumentRequestNumber(db: PortalDatabase): string {
  const current = db.sequences.documentRequestSeq ?? 2;
  const next = current + 1;
  db.sequences.documentRequestSeq = next;
  const year = new Date().getFullYear();
  return `HCA/DREQ/${year}/${String(next).padStart(4, '0')}`;
}



