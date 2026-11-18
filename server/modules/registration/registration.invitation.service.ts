import crypto from 'node:crypto';
import {
  getDb,
  saveDb,
  type ActivationInvitationRecord,
} from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import { appendRegistrationAudit, pushReviewerEvent } from './registration.approval.service.ts';
import { REGISTRATION_PERMISSIONS } from './registration.permissions.ts';
import { canViewRegistrationRecord, sanitizeRecordForViewer } from './registration.policy.ts';
import { RegistrationHttpError, type InvitationDispatchResponse } from './registration.types.ts';

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export const registrationInvitationService = {
  issueInvitation(
    actor: AuthenticatedSessionUser,
    registrationId: string
  ): InvitationDispatchResponse {
    if (
      !actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.INVITATION_SEND) &&
      !actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.ACTIVATE)
    ) {
      throw new RegistrationHttpError(403, 'Missing users.invitation.send permission.');
    }

    const db = getDb();
    const record = db.registrations.find((r) => r.id === registrationId);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(403, 'Access denied to dispatch invitation for this record.');
    }
    if (!['APPROVED', 'INVITED'].includes(record.status)) {
      throw new RegistrationHttpError(
        409,
        `Activation invitations can only be sent after formal approval (current status: ${record.status}).`
      );
    }

    // Revoke prior pending invitations for this registration
    for (const existing of db.activationInvitations) {
      if (existing.registrationId === record.id && existing.status === 'PENDING') {
        existing.status = 'REVOKED';
      }
    }

    // Cryptographically random single-use token (256-bit entropy)
    const rawToken = `HCA-ACT-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    const tokenHash = hashToken(rawToken);
    const tokenHint = `****${rawToken.slice(-4)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();

    const invitation: ActivationInvitationRecord = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      registrationId: record.id,
      email: record.email,
      fullName: record.fullName,
      category: record.category,
      assignedRole: record.assignedRole ?? record.proposedRole,
      tokenHash,
      tokenHint,
      status: 'PENDING',
      sentById: actor.id,
      sentByName: actor.fullName,
      expiresAt,
      usedAt: null,
      createdAt: now.toISOString(),
    };

    db.activationInvitations.unshift(invitation);
    record.status = 'INVITED';
    record.portalAccessStatus = 'INVITED';
    record.updatedAt = now.toISOString();

    pushReviewerEvent(
      record,
      actor,
      'INVITED',
      `Issued single-use 72h activation link (token hint ${tokenHint}).`
    );
    appendRegistrationAudit(
      db,
      actor,
      'INVITATION_SENT',
      record.category,
      `Dispatched cryptographically random 72h activation token (${tokenHint}) to ${record.email} (${record.registrationNumber}).`,
      record.id
    );
    saveDb(db);

    return {
      invitation,
      registration: sanitizeRecordForViewer(actor, record),
      oneTimeActivationToken: rawToken,
      activationUrl: `/activate-account?token=${encodeURIComponent(rawToken)}`,
    };
  },

  validatePublicInvitation(token: string):
    | { valid: true; expiresAt: string }
    | { valid: false; status: 'INVALID' | 'EXPIRED' | 'USED' | 'REVOKED'; message: string } {
    const db = getDb();
    const tokenHash = hashToken(token);
    const invitation = db.activationInvitations.find((inv) => inv.tokenHash === tokenHash);

    if (!invitation) {
      return {
        valid: false,
        status: 'INVALID',
        message: 'Invalid or unrecognized activation link.',
      };
    }

    if (invitation.status === 'USED') {
      return {
        valid: false,
        status: 'USED',
        message: 'This activation link has already been used.',
      };
    }

    if (invitation.status === 'REVOKED') {
      return {
        valid: false,
        status: 'REVOKED',
        message: 'This activation link has been revoked by an authorized administrator.',
      };
    }

    if (
      invitation.status === 'EXPIRED' ||
      new Date(invitation.expiresAt).getTime() < Date.now()
    ) {
      if (invitation.status !== 'EXPIRED') {
        invitation.status = 'EXPIRED';
        saveDb(db);
      }
      return {
        valid: false,
        status: 'EXPIRED',
        message:
          'This activation link has expired. Contact College Admissions or HR for a new invitation.',
      };
    }

    return {
      valid: true,
      expiresAt: invitation.expiresAt,
    };
  },

  completePublicActivation(token: string, userChosenPassword: string) {
    const db = getDb();
    const tokenHash = hashToken(token);
    const invitation = db.activationInvitations.find((inv) => inv.tokenHash === tokenHash);

    if (!invitation) {
      throw new RegistrationHttpError(
        404,
        'Activation link is invalid or does not exist.'
      );
    }

    if (invitation.status === 'USED') {
      throw new RegistrationHttpError(
        409,
        'This activation link has already been used. Please sign in to the portal.'
      );
    }

    if (invitation.status === 'REVOKED') {
      throw new RegistrationHttpError(
        410,
        'This activation link has been revoked. Request a fresh invitation from Admissions or HR.'
      );
    }

    if (
      invitation.status === 'EXPIRED' ||
      new Date(invitation.expiresAt).getTime() < Date.now()
    ) {
      invitation.status = 'EXPIRED';
      saveDb(db);
      throw new RegistrationHttpError(
        410,
        'This activation link has expired. Contact Admissions or HR for a fresh invitation.'
      );
    }

    const record = db.registrations.find((r) => r.id === invitation.registrationId);
    if (!record) {
      throw new RegistrationHttpError(404, 'Linked registration record missing.');
    }
    if (['SUSPENDED', 'REJECTED', 'ARCHIVED'].includes(record.status)) {
      throw new RegistrationHttpError(
        409,
        `Cannot activate an account in ${record.status} status.`
      );
    }

    const now = new Date().toISOString();
    invitation.status = 'USED';
    invitation.usedAt = now;

    record.passwordHash = hashPassword(userChosenPassword);
    record.mustChangePasswordOnFirstLogin = false;
    record.mustCompleteProfileOnFirstLogin = true;
    record.status = 'ACTIVATED';
    record.portalAccessStatus = 'ACTIVATED';
    record.activatedAt = now;
    record.updatedAt = now;

    if (record.category === 'STUDENT' && record.collegeRecordId) {
      const stu = db.studentAccounts.find((s) => s.id === record.collegeRecordId);
      if (stu) stu.status = 'ACTIVE';
    } else if (record.category === 'STAFF' && record.collegeRecordId) {
      const stf = db.staffAccounts.find((s) => s.id === record.collegeRecordId);
      if (stf) {
        stf.status = 'ACTIVE';
        stf.updatedAt = now;
      }
    }

    const selfActor: AuthenticatedSessionUser = {
      id: record.userAccountId ?? record.id,
      employeeNumber: record.registrationNumber ?? record.id,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      officeLocation: record.campusName,
      bio: 'Self-service portal activation',
      role: (record.assignedRole ?? record.proposedRole ?? 'UNCONFIGURED') as AuthenticatedSessionUser['role'],
      roleTitle: record.assignedRole ?? record.proposedRole,
      departmentId: record.departmentId ?? 'dept-self',
      department: record.departmentName ?? 'Self-Activation',
      campusId: record.campusId,
      campus: record.campusName,
      allowedCampuses: [record.campusName],
      permissions: [],
      documentPermissions: [],
      registrationPermissions: [],
      restrictedFrom: [],
    };

    pushReviewerEvent(
      record,
      selfActor,
      'ACTIVATED',
      'Account activated via public single-use activation portal.'
    );
    appendRegistrationAudit(
      db,
      selfActor,
      'PORTAL_ACCESS_ACTIVATED',
      record.category,
      `Self-service portal activation completed for ${record.fullName} (${record.registrationNumber ?? record.id}); single-use token consumed.`,
      record.id
    );
    saveDb(db);

    return {
      activated: true,
      registrationNumber: record.registrationNumber,
      assignedRole: record.assignedRole ?? record.proposedRole,
    };
  },

  activateAccount(
    actor: AuthenticatedSessionUser,
    token: string,
    userChosenPassword: string,
    expectedRegistrationId?: string
  ) {
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.ACTIVATE)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.activate permission.');
    }

    const db = getDb();
    const tokenHash = hashToken(token);
    const invitation = db.activationInvitations.find(
      (inv) =>
        inv.tokenHash === tokenHash &&
        inv.status === 'PENDING' &&
        (!expectedRegistrationId || inv.registrationId === expectedRegistrationId)
    );

    if (!invitation) {
      throw new RegistrationHttpError(
        404,
        'Activation token is invalid, expired, revoked, or already consumed.'
      );
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      invitation.status = 'EXPIRED';
      saveDb(db);
      throw new RegistrationHttpError(
        410,
        'Activation token has expired. Issue a fresh activation invitation.'
      );
    }

    const record = db.registrations.find((r) => r.id === invitation.registrationId);
    if (!record) {
      throw new RegistrationHttpError(404, 'Linked registration record missing.');
    }
    if (['SUSPENDED', 'REJECTED', 'ARCHIVED'].includes(record.status)) {
      throw new RegistrationHttpError(409, `Cannot activate a ${record.status} record.`);
    }

    const now = new Date().toISOString();
    // Single-use enforcement: immediately revoke/mark USED
    invitation.status = 'USED';
    invitation.usedAt = now;

    // Store hashed user-chosen password (never plaintext) & require profile completion on first login
    record.passwordHash = hashPassword(userChosenPassword);
    record.mustChangePasswordOnFirstLogin = false;
    record.mustCompleteProfileOnFirstLogin = true;
    record.status = 'ACTIVATED';
    record.portalAccessStatus = 'ACTIVATED';
    record.activatedAt = now;
    record.updatedAt = now;

    if (record.category === 'STUDENT' && record.collegeRecordId) {
      const stu = db.studentAccounts.find((s) => s.id === record.collegeRecordId);
      if (stu) stu.status = 'ACTIVE';
    } else if (record.category === 'STAFF' && record.collegeRecordId) {
      const stf = db.staffAccounts.find((s) => s.id === record.collegeRecordId);
      if (stf) {
        stf.status = 'ACTIVE';
        stf.updatedAt = now;
      }
    }

    pushReviewerEvent(
      record,
      actor,
      'ACTIVATED',
      'User completed single-use token activation and configured credentials.'
    );
    appendRegistrationAudit(
      db,
      actor,
      'PORTAL_ACCESS_ACTIVATED',
      record.category,
      `Activated portal account for ${record.fullName} (${record.registrationNumber}); single-use token consumed and revoked.`,
      record.id
    );
    saveDb(db);

    return {
      invitation,
      registration: sanitizeRecordForViewer(actor, record),
    };
  },
};
