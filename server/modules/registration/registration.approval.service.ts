import {
  getDb,
  saveDb,
  type PortalDatabase,
  type RegistrationAuditLogRecord,
  type RegistrationReviewEvent,
  type UserRegistrationRecord,
} from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import { ROLE_DOCUMENT_PERMISSIONS } from '../documents/documents.permissions.ts';
import { ROLE_TO_STAFF_PERMISSIONS, type StaffRoleCode } from '../staff/staff.permissions.ts';
import { allocateUniqueInstitutionalNumber } from './registration.numbering.service.ts';
import { REGISTRATION_PERMISSIONS, type RegistrationCategory } from './registration.permissions.ts';
import {
  canApproveRecord,
  canViewRegistrationRecord,
  sanitizeRecordForViewer,
  type SanitizedRegistrationRecord,
} from './registration.policy.ts';
import { RegistrationHttpError } from './registration.types.ts';

function defaultPortalPermissionsForRole(role: string): string[] {
  const upper = role.toUpperCase();
  if (upper === 'STUDENT') return ['student.portal.access', 'student.units.register', 'student.results.view'];
  if (upper === 'PARENT') return ['parent.portal.view_linked_student', 'parent.fees.view'];
  if (upper === 'ALUMNI') return ['alumni.portal.access', 'alumni.transcript_requests.create'];
  if (upper === 'CONTRACTOR') return ['contractor.workorders.view', 'contractor.campus_pass.view'];
  if (upper === 'PARTNER') return ['partner.mou.view'];
  if (upper === 'GUEST') return ['guest.visitor_pass.view'];
  if (upper in ROLE_TO_STAFF_PERMISSIONS) {
    return [...ROLE_TO_STAFF_PERMISSIONS[upper as StaffRoleCode]];
  }
  return ['portal.basic.access'];
}

export function appendRegistrationAudit(
  db: PortalDatabase,
  actor: AuthenticatedSessionUser,
  action: string,
  category: RegistrationCategory | 'SYSTEM',
  detail: string,
  registrationId: string | null = null,
  isConfidential = false
): void {
  const entry: RegistrationAuditLogRecord = {
    id: `raud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    registrationId,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    category,
    detail,
    isConfidential,
    createdAt: new Date().toISOString(),
  };
  db.registrationAuditLogs.unshift(entry);
  if (db.registrationAuditLogs.length > 500) {
    db.registrationAuditLogs = db.registrationAuditLogs.slice(0, 500);
  }
}

export function pushReviewerEvent(
  record: UserRegistrationRecord,
  actor: AuthenticatedSessionUser,
  decision: RegistrationReviewEvent['decision'],
  comment: string | null
): void {
  if (!Array.isArray(record.reviewerHistory)) {
    record.reviewerHistory = [];
  }
  record.reviewerHistory.unshift({
    id: `revh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    decision,
    comment,
    createdAt: new Date().toISOString(),
  });
}

export const registrationApprovalService = {
  toggleDocumentVerification(
    actor: AuthenticatedSessionUser,
    id: string,
    docIndex: number,
    verified: boolean
  ): SanitizedRegistrationRecord {
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(403, 'Access denied to inspect this registration.');
    }
    if (
      !actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.APPROVE) &&
      !actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.EDIT)
    ) {
      throw new RegistrationHttpError(403, 'Missing permission to verify supporting documents.');
    }
    if (!record.documents[docIndex]) {
      throw new RegistrationHttpError(404, 'Supporting document item not found.');
    }

    record.documents[docIndex].verified = verified;
    record.updatedAt = new Date().toISOString();
    pushReviewerEvent(
      record,
      actor,
      'DOCUMENT_VERIFIED',
      `${verified ? 'Verified' : 'Unverified'} document: ${record.documents[docIndex].docType}`
    );
    appendRegistrationAudit(
      db,
      actor,
      'DOCUMENT_VERIFICATION_UPDATED',
      record.category,
      `${verified ? 'Verified' : 'Unchecked'} "${record.documents[docIndex].docType}" on registration for ${record.fullName}.`,
      record.id
    );
    saveDb(db);
    return sanitizeRecordForViewer(actor, record);
  },

  decideRegistration(
    actor: AuthenticatedSessionUser,
    id: string,
    decision: 'UNDER_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED',
    comment?: string,
    assignedRoleOverride?: string
  ): SanitizedRegistrationRecord {
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }

    if (decision === 'REJECTED' && !actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.REJECT)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.reject permission.');
    }

    const authCheck = canApproveRecord(actor, record);
    if (!authCheck.allowed) {
      throw new RegistrationHttpError(403, authCheck.reason ?? 'Not authorized to decide this category.');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(record.status)) {
      throw new RegistrationHttpError(
        409,
        `Registration must be SUBMITTED or UNDER_REVIEW to be decided (currently ${record.status}).`
      );
    }

    if ((decision === 'REJECTED' || decision === 'CHANGES_REQUESTED') && (!comment || comment.trim().length < 5)) {
      throw new RegistrationHttpError(
        400,
        'Mandatory comments (at least 5 characters) are required when rejecting or requesting changes.'
      );
    }

    const now = new Date().toISOString();
    record.reviewedById = actor.id;
    record.reviewedByName = actor.fullName;
    record.reviewedAt = now;
    record.reviewerComment = comment?.trim() || record.reviewerComment;
    record.updatedAt = now;

    if (decision === 'UNDER_REVIEW') {
      record.status = 'UNDER_REVIEW';
      pushReviewerEvent(record, actor, 'UNDER_REVIEW', comment?.trim() || 'Moved to active review');
      appendRegistrationAudit(
        db,
        actor,
        'REGISTRATION_UNDER_REVIEW',
        record.category,
        `Marked ${record.fullName} as UNDER_REVIEW.`,
        record.id
      );
    } else if (decision === 'CHANGES_REQUESTED') {
      record.status = 'CHANGES_REQUESTED';
      record.collegeRecordStatus = 'UNENROLLED';
      pushReviewerEvent(record, actor, 'CHANGES_REQUESTED', comment!.trim());
      appendRegistrationAudit(
        db,
        actor,
        'REGISTRATION_CHANGES_REQUESTED',
        record.category,
        `Requested corrections for ${record.fullName}: ${comment!.trim()}`,
        record.id
      );
    } else if (decision === 'REJECTED') {
      record.status = 'REJECTED';
      record.collegeRecordStatus = 'UNENROLLED';
      record.accountStatus = 'NOT_CREATED';
      record.portalAccessStatus = 'INACTIVE';
      pushReviewerEvent(record, actor, 'REJECTED', comment!.trim());
      appendRegistrationAudit(
        db,
        actor,
        'REGISTRATION_REJECTED',
        record.category,
        `Rejected ${record.category} registration for ${record.fullName}: ${comment!.trim()}`,
        record.id
      );
    } else if (decision === 'APPROVED') {
      // Parent relationship verification guard
      if (record.category === 'PARENT' && record.otherDetails?.linkedStudentNumber) {
        const linkedStudent = db.registrations.find(
          (r) =>
            r.category === 'STUDENT' &&
            r.registrationNumber === record.otherDetails?.linkedStudentNumber
        );
        if (linkedStudent) {
          record.otherDetails.linkedStudentName = linkedStudent.fullName;
        }
        record.otherDetails.relationshipVerified = true;
      }

      // Atomic unique institutional number generation ONLY on approval
      const regNumber = record.registrationNumber ?? allocateUniqueInstitutionalNumber(db, record.category);
      const assignedRole = (assignedRoleOverride ?? record.proposedRole).toUpperCase();
      const assignedPermissions = defaultPortalPermissionsForRole(assignedRole);

      record.registrationNumber = regNumber;
      record.status = 'APPROVED';
      record.approvedById = actor.id;
      record.approvedByName = actor.fullName;
      record.approvedAt = now;

      // Stage 1: Linked Identity Account created (no login active yet)
      record.userAccountId = record.userAccountId ?? `acc-${Date.now().toString(36)}`;
      record.accountStatus = 'CREATED';
      record.accountCreatedAt = record.accountCreatedAt ?? now;
      record.mustChangePasswordOnFirstLogin = true;
      record.mustCompleteProfileOnFirstLogin = true;

      // Stage 2: Linked College Record created (uses existing studentAccounts / staffAccounts models)
      record.collegeRecordStatus = 'ENROLLED';
      if (record.category === 'STUDENT' && !record.collegeRecordId) {
        const stuId = `stu-${Date.now().toString(36)}`;
        record.collegeRecordId = stuId;
        db.studentAccounts.unshift({
          id: stuId,
          admissionNumber: regNumber,
          fullName: record.fullName,
          email: record.email,
          programme: record.studentDetails?.programme ?? 'Certificate Programme',
          campusId: record.campusId,
          campusName: record.campusName,
          status: 'PROVISIONAL',
          createdAt: now,
          createdById: actor.id,
        });
      } else if (record.category === 'STAFF' && !record.collegeRecordId) {
        const stfId = `stf-${Date.now().toString(36)}`;
        record.collegeRecordId = stfId;
        const staffRoleCode: StaffRoleCode =
          assignedRole in ROLE_TO_STAFF_PERMISSIONS
            ? (assignedRole as StaffRoleCode)
            : 'LECTURER';
        db.staffAccounts.push({
          id: stfId,
          employeeNumber: regNumber,
          fullName: record.fullName,
          email: record.email,
          phone: record.phone,
          officeLocation: `${record.campusName} · Pending Desk`,
          bio: `${record.staffDetails?.jobTitle ?? 'Staff Member'} (${record.departmentName ?? 'College Staff'}).`,
          role: staffRoleCode,
          roleTitle: record.staffDetails?.jobTitle ?? staffRoleCode,
          departmentId: record.departmentId ?? 'dept-governance',
          department: record.departmentName ?? 'Institutional Operations & Governance',
          campusId: record.campusId,
          campus: record.campusName,
          allowedCampuses: [record.campusName],
          permissions: [...ROLE_TO_STAFF_PERMISSIONS[staffRoleCode]],
          documentPermissions: [...ROLE_DOCUMENT_PERMISSIONS[staffRoleCode]],
          restrictedFrom: ['Unassigned cross-department confidential records'],
          assignedUnits: record.staffDetails?.teachingUnitsRequested,
          status: 'INVITED',
          updatedAt: now,
        });
      } else if (!record.collegeRecordId) {
        record.collegeRecordId = `${record.category.toLowerCase()}-${Date.now().toString(36)}`;
      }

      // Stage 3: Portal Access stays strictly INACTIVE until invitation & token activation
      record.assignedRole = assignedRole;
      record.assignedPermissions = assignedPermissions;
      record.portalAccessStatus = 'INACTIVE';

      pushReviewerEvent(
        record,
        actor,
        'APPROVED',
        comment?.trim() || `Approved & allocated institutional number ${regNumber}.`
      );
      appendRegistrationAudit(
        db,
        actor,
        'REGISTRATION_APPROVED',
        record.category,
        `Approved ${record.category} registration for ${record.fullName}; allocated ${regNumber}. Portal access stays INACTIVE pending invitation.`,
        record.id,
        record.category === 'STAFF'
      );
    }

    saveDb(db);
    return sanitizeRecordForViewer(actor, record);
  },
};
