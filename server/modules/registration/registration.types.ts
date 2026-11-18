import type { RegistrationCategory, RegistrationStatus } from './registration.permissions.ts';
import type {
  ActivationInvitationRecord,
  CampusRecord,
  DepartmentRecord,
  IntakeRecord,
  ProgrammeRecord,
  RegistrationAuditLogRecord,
  RegistrationReviewEvent,
} from '../../data/store.ts';
import type { SanitizedRegistrationRecord } from './registration.policy.ts';

export class RegistrationHttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface DuplicateMatchInfo {
  matchedRegistrationId: string | null;
  matchedName: string;
  matchedEmail: string;
  matchedReason: string;
  matchedStatus: string;
}

export interface RegistrationLookupsPayload {
  campuses: CampusRecord[];
  departments: DepartmentRecord[];
  programmes: ProgrammeRecord[];
  intakes: IntakeRecord[];
  allowedRegisterCategories: RegistrationCategory[];
  allowedApproveCategories: RegistrationCategory[];
  registrationPermissions: string[];
  numberFormats: Record<RegistrationCategory, string>;
}

export interface RegistrationListFilters {
  page: number;
  pageSize: number;
  search: string;
  category: RegistrationCategory | 'ALL';
  status: RegistrationStatus | 'ALL';
  campusId?: string;
  departmentId?: string;
}

export interface RegistrationHistoryResponse {
  registrationId: string;
  registrationNumber: string | null;
  status: RegistrationStatus;
  reviewerHistory: RegistrationReviewEvent[];
  auditLogs: RegistrationAuditLogRecord[];
}

export interface InvitationDispatchResponse {
  invitation: ActivationInvitationRecord;
  registration: SanitizedRegistrationRecord;
  /** Delivered once through the outbound notification channel; never stored in plaintext in DB. */
  oneTimeActivationToken: string;
  activationUrl: string;
}
