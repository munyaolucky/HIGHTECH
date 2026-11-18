import crypto from 'node:crypto';
import type { UserRegistrationRecord } from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import {
  CATEGORY_APPROVE_ROLES,
  CATEGORY_REGISTER_ROLES,
  REGISTRATION_PERMISSIONS,
  type RegistrationCategory,
} from './registration.permissions.ts';
import type { StaffRoleCode } from '../staff/staff.permissions.ts';

export function maskIdentificationNumber(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '');
  if (cleaned.length <= 4) return '****';
  return `****${cleaned.slice(-4)}`;
}

export function hashIdentificationNumber(raw: string): string {
  const normalized = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return crypto.createHash('sha256').update(`hitech-id-salt:${normalized}`).digest('hex');
}

export function canRegisterCategory(
  actor: AuthenticatedSessionUser,
  category: RegistrationCategory,
  proposedRole?: string
): { allowed: boolean; reason?: string } {
  if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.CREATE)) {
    return {
      allowed: false,
      reason: 'Your role lacks users.registration.create permission.',
    };
  }
  if (actor.role === 'UNCONFIGURED') {
    return { allowed: false, reason: 'Unconfigured accounts cannot create registrations.' };
  }

  const allowedRoles = CATEGORY_REGISTER_ROLES[category];
  if (!allowedRoles.includes(actor.role)) {
    return {
      allowed: false,
      reason: `${actor.roleTitle} is not authorized to register ${category} records.`,
    };
  }

  // Enforce strict separation between HR staff onboarding and Admin account creation
  if (category === 'STAFF') {
    const normalizedProposed = (proposedRole ?? '').toUpperCase();
    if (normalizedProposed === 'ADMIN' && actor.role !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Only an authorized Administrator may register an Administrator account (approved by Principal).',
      };
    }
    if (normalizedProposed !== 'ADMIN' && actor.role === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Teaching and non-teaching staff records must be registered by Human Resources (HR), not System Admin.',
      };
    }
  }

  return { allowed: true };
}

export function canApproveRecord(
  actor: AuthenticatedSessionUser,
  record: UserRegistrationRecord
): { allowed: boolean; reason?: string } {
  if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.APPROVE)) {
    return {
      allowed: false,
      reason: 'Your role lacks users.registration.approve permission.',
    };
  }
  if (actor.role === 'UNCONFIGURED') {
    return { allowed: false, reason: 'Unconfigured accounts cannot approve registrations.' };
  }

  // Strict separation of duties: applicant creator cannot self-approve
  if (record.createdById === actor.id) {
    return {
      allowed: false,
      reason: 'Separation of duties violation: the staff member who initiated a registration cannot approve it.',
    };
  }

  // Administrator registrations must be approved by the Principal
  if (record.category === 'STAFF' && record.proposedRole.toUpperCase() === 'ADMIN') {
    if (actor.role !== 'PRINCIPAL') {
      return {
        allowed: false,
        reason: 'Administrator onboarding requires Principal approval.',
      };
    }
    return { allowed: true };
  }

  const approvers = CATEGORY_APPROVE_ROLES[record.category];
  if (!approvers.includes(actor.role)) {
    return {
      allowed: false,
      reason: `${actor.roleTitle} is not an authorized approver for ${record.category} registrations.`,
    };
  }

  // HOD contractor approvals apply to their own department
  if (actor.role === 'HOD' && record.category === 'CONTRACTOR') {
    if (record.departmentId && actor.departmentId && record.departmentId !== actor.departmentId) {
      return {
        allowed: false,
        reason: 'Heads of Department can only approve contractors sponsored by their own department.',
      };
    }
  }

  return { allowed: true };
}

export function canViewRegistrationRecord(
  actor: AuthenticatedSessionUser,
  record: UserRegistrationRecord
): boolean {
  if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.VIEW)) {
    return false;
  }
  if (actor.role === 'UNCONFIGURED') return false;

  // Creator can always monitor records they initiated
  if (record.createdById === actor.id) return true;

  const role: StaffRoleCode = actor.role;
  switch (role) {
    case 'PRINCIPAL':
    case 'REGISTRAR':
      return true;
    case 'ADMIN':
      // Admin manages system accounts, contractors, partners, students admissions directory & governance,
      // but cannot inspect confidential HR staff files in draft/pending or confidential welfare notes
      if (record.category === 'STAFF' && record.proposedRole !== 'ADMIN' && record.status === 'DRAFT') {
        return false;
      }
      return true;
    case 'HR':
      return record.category === 'STAFF';
    case 'ADMISSIONS_OFFICER':
      return record.category === 'STUDENT' || record.category === 'PARENT';
    case 'STUDENT_AFFAIRS':
      return record.category === 'PARENT' || record.category === 'ALUMNI' || record.category === 'STUDENT';
    case 'PROCUREMENT_OFFICER':
      return record.category === 'CONTRACTOR' || record.category === 'PARTNER';
    case 'HOD':
      return (
        (record.category === 'STAFF' && record.departmentId === actor.departmentId) ||
        record.category === 'CONTRACTOR'
      );
    case 'RECEPTIONIST':
    case 'SECURITY_OFFICER':
      return record.category === 'GUEST' || record.category === 'CONTRACTOR';
    case 'IT_SUPPORT':
      return ['APPROVED', 'INVITED', 'ACTIVATED', 'SUSPENDED'].includes(record.status);
    default:
      return false;
  }
}

export type SanitizedRegistrationRecord = Omit<
  UserRegistrationRecord,
  'identificationNumberHash' | 'passwordHash'
>;

export function sanitizeRecordForViewer(
  actor: AuthenticatedSessionUser,
  record: UserRegistrationRecord
): SanitizedRegistrationRecord {
  const { identificationNumberHash: _hash, passwordHash: _pwHash, ...rest } = record;
  // Strip confidential HR compensation band from everyone except HR & Principal
  if (
    rest.staffDetails?.compensationBandConfidential &&
    actor.role !== 'HR' &&
    actor.role !== 'PRINCIPAL'
  ) {
    return {
      ...rest,
      staffDetails: {
        ...rest.staffDetails,
        compensationBandConfidential: 'Restricted (HR & Principal Only)',
      },
    };
  }
  return rest;
}
