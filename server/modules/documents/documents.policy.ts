import type { Request } from 'express';
import type { DocumentRecipientRecord, DocumentRecord } from '../../data/store.ts';
import type { AuthenticatedSessionUser, PortalSessionContext } from '../../middleware/auth.ts';
import {
  canStudentUploadDocumentCategory,
  getDocumentCategoryConfig,
  isStaffDocumentRole,
} from './documents.catalog.ts';
import {
  DOCUMENT_PERMISSIONS,
  hasDocumentPermission,
  STUDENT_DOCUMENT_PERMISSIONS,
  type AuthenticatedDocumentUser,
} from './documents.permissions.ts';

export type DocumentAccessAction =
  | 'VIEW'
  | 'EDIT'
  | 'DELETE'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'REQUEST_CHANGES'
  | 'SIGN'
  | 'ISSUE'
  | 'SHARE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'REVOKE'
  | 'PRINT'
  | 'EXPORT';

export type DocumentActor = AuthenticatedSessionUser | {
  id: string;
  employeeNumber: string;
  registrationNumber?: string | null;
  fullName: string;
  email: string;
  role: string;
  roleTitle: string;
  departmentId: string | null;
  department: string;
  campusId: string | null;
  campus: string;
  permissions: string[];
  documentPermissions: string[];
};

export function resolveDocumentActor(req: Request): DocumentActor | null {
  if (req.staffUser) {
    return req.staffUser;
  }
  const p: PortalSessionContext | undefined = req.portalUser;
  if (!p) return null;
  const roleUpper = p.primaryRole.toUpperCase();
  const actorId = p.registrationNumber && roleUpper === 'STUDENT' ? p.uid : p.uid;
  return {
    id: actorId,
    employeeNumber: p.registrationNumber || p.uid,
    registrationNumber: p.registrationNumber,
    fullName: p.fullName,
    email: p.email,
    role: roleUpper,
    roleTitle: roleUpper === 'STUDENT' ? 'Registered Student' : roleUpper,
    departmentId: p.departmentId,
    department: roleUpper === 'STUDENT' ? 'Student Body' : 'Portal Member',
    campusId: p.campusId,
    campus: 'Nairobi Main Campus',
    permissions: [],
    documentPermissions:
      roleUpper === 'STUDENT'
        ? [...STUDENT_DOCUMENT_PERMISSIONS]
        : [DOCUMENT_PERMISSIONS.DOCUMENT_VIEW, DOCUMENT_PERMISSIONS.TEMPLATE_VIEW],
  };
}

export function toDocumentUser(user: DocumentActor): AuthenticatedDocumentUser {
  return {
    id: user.id,
    role: user.role as AuthenticatedDocumentUser['role'],
    fullName: user.fullName,
    employeeNumber: user.employeeNumber,
    registrationNumber: 'registrationNumber' in user ? user.registrationNumber : null,
    campusId: user.campusId,
    departmentId: user.departmentId,
    permissions: user.documentPermissions,
  };
}

function isRecipientGrantUnexpired(grant: DocumentRecipientRecord | undefined): boolean {
  if (!grant) return false;
  if (grant.expiresAt && new Date(grant.expiresAt).getTime() <= Date.now()) {
    return false;
  }
  return true;
}

function isRecipientAccessValid(
  grant: DocumentRecipientRecord | undefined,
  action: DocumentAccessAction
): boolean {
  if (!isRecipientGrantUnexpired(grant) || !grant) return false;
  if (action === 'VIEW') return grant.canView;
  if (action === 'EXPORT') return grant.canDownload;
  if (action === 'PRINT') return grant.canPrint;
  return false;
}

export function canUploadToCategory(
  user: AuthenticatedDocumentUser,
  categoryCode: string
): { allowed: boolean; reason?: string } {
  const cfg = getDocumentCategoryConfig(categoryCode);
  if (!cfg || !cfg.active) {
    return { allowed: false, reason: 'Selected document category is inactive or unknown.' };
  }
  if (!isStaffDocumentRole(user.role)) {
    if (user.role !== 'STUDENT') {
      return { allowed: false, reason: 'Your portal role is not permitted to upload documents.' };
    }
    if (!canStudentUploadDocumentCategory(cfg.code)) {
      return {
        allowed: false,
        reason: `Students cannot upload records to restricted category "${cfg.name}".`,
      };
    }
  }
  return { allowed: true };
}

function isDomainOfficeAuthorized(
  user: AuthenticatedDocumentUser,
  doc: DocumentRecord
): boolean {
  return (
    (doc.category === 'STUDENT_WELFARE_CONFIDENTIAL' && user.role === 'STUDENT_AFFAIRS') ||
    (doc.category === 'ABSENCE_EXPLANATION' &&
      (user.role === 'STUDENT_AFFAIRS' ||
        user.role === 'REGISTRAR' ||
        user.role === 'PRINCIPAL' ||
        (user.role === 'HOD' &&
          (!doc.departmentId || !user.departmentId || doc.departmentId === user.departmentId)))) ||
    (doc.category === 'EMPLOYMENT_CONTRACT' &&
      (user.role === 'HR' || user.role === 'PRINCIPAL')) ||
    ((doc.category === 'FEE_STATEMENT' || doc.category === 'SCHOLARSHIP_BURSARY_DOC') &&
      user.role === 'FINANCE_OFFICER') ||
    ((doc.category === 'ADMISSION_LETTER' ||
      doc.category === 'STUDENT_REGISTRATION_RECORD' ||
      doc.category === 'TRANSCRIPT_CERTIFICATE') &&
      (user.role === 'ADMISSIONS_OFFICER' || user.role === 'REGISTRAR')) ||
    (doc.category === 'EXAM_SCHEDULE' &&
      (user.role === 'EXAMINATIONS_OFFICER' ||
        user.role === 'REGISTRAR' ||
        user.role === 'PRINCIPAL' ||
        (user.role === 'HOD' &&
          (!doc.departmentId || !user.departmentId || doc.departmentId === user.departmentId))))
  );
}

/**
 * Strongly-typed zero-bypass document policy engine.
 * - Super Admin / ADMIN never automatically bypass CONFIDENTIAL or RESTRICTED records.
 * - Confidential Student Welfare, Medical Absence Evidence, & HR Contracts require owner/recipient or domain authority.
 * - Unpublished examination papers & marking schemes are strictly isolated from students & non-exam roles.
 * - Self-approval is strictly prohibited.
 */
export function canAccessDocument(
  user: AuthenticatedDocumentUser,
  doc: DocumentRecord,
  recipientGrants: DocumentRecipientRecord[],
  action: DocumentAccessAction = 'VIEW'
): { allowed: boolean; reason?: string } {
  const isOwner =
    doc.ownerId === user.id ||
    doc.createdById === user.id ||
    (Boolean(user.registrationNumber) &&
      (doc.relatedStudentOrStaffId === user.registrationNumber ||
        doc.ownerId === user.registrationNumber));

  const activeRecipientGrant = recipientGrants.find(
    (g) => g.documentId === doc.id && g.userId === user.id
  );

  // 1. Check baseline action permission
  const requiredPermMap: Record<DocumentAccessAction, string> = {
    VIEW: DOCUMENT_PERMISSIONS.DOCUMENT_VIEW,
    EDIT: DOCUMENT_PERMISSIONS.DOCUMENT_EDIT,
    DELETE: DOCUMENT_PERMISSIONS.DOCUMENT_DELETE,
    SUBMIT: DOCUMENT_PERMISSIONS.DOCUMENT_SUBMIT,
    APPROVE: DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE,
    REJECT: DOCUMENT_PERMISSIONS.DOCUMENT_REJECT,
    REQUEST_CHANGES: DOCUMENT_PERMISSIONS.DOCUMENT_REQUEST_CHANGES,
    SIGN: DOCUMENT_PERMISSIONS.DOCUMENT_SIGN,
    ISSUE: DOCUMENT_PERMISSIONS.DOCUMENT_ISSUE,
    SHARE: DOCUMENT_PERMISSIONS.DOCUMENT_SHARE,
    ARCHIVE: DOCUMENT_PERMISSIONS.DOCUMENT_ARCHIVE,
    RESTORE: DOCUMENT_PERMISSIONS.DOCUMENT_RESTORE,
    REVOKE: DOCUMENT_PERMISSIONS.DOCUMENT_REVOKE,
    PRINT: DOCUMENT_PERMISSIONS.DOCUMENT_PRINT,
    EXPORT: DOCUMENT_PERMISSIONS.DOCUMENT_EXPORT,
  };

  const reqPerm = requiredPermMap[action];
  if (!hasDocumentPermission(user.permissions, reqPerm as typeof DOCUMENT_PERMISSIONS.DOCUMENT_VIEW)) {
    return { allowed: false, reason: `Missing required permission: ${reqPerm}.` };
  }

  // 2. Unpublished Examination Isolation (strictly blocks students & unauthorized roles)
  const catConfig = getDocumentCategoryConfig(doc.category);
  const isUnpublishedExam =
    (doc.category === 'EXAM_SCHEDULE' || Boolean(catConfig?.isUnpublishedExamProtected)) &&
    !(doc.status === 'ISSUED' && (doc.confidentiality === 'PUBLIC' || doc.confidentiality === 'INTERNAL'));

  if (isUnpublishedExam) {
    const examAuthorizedRoles = new Set([
      'EXAMINATIONS_OFFICER',
      'REGISTRAR',
      'PRINCIPAL',
      'QUALITY_ASSURANCE',
    ]);
    const isSameDeptFaculty =
      (user.role === 'HOD' || user.role === 'LECTURER') &&
      Boolean(doc.departmentId) &&
      user.departmentId === doc.departmentId;

    if (!isOwner && !examAuthorizedRoles.has(user.role) && !isSameDeptFaculty && !isRecipientAccessValid(activeRecipientGrant, action)) {
      return {
        allowed: false,
        reason:
          'Examination integrity boundary: unpublished exam papers, schedules, and marking schemes are isolated from students and unauthorized staff.',
      };
    }
  }

  // 3. Confidentiality enforcement (No Super Admin bypass!)
  const isConfidentialDomainAuthorized = isDomainOfficeAuthorized(user, doc);
  if (doc.confidentiality === 'CONFIDENTIAL' || doc.confidentiality === 'RESTRICTED') {
    const hasValidShare =
      action === 'EXPORT' || action === 'PRINT' || action === 'VIEW'
        ? isRecipientAccessValid(activeRecipientGrant, action)
        : isRecipientGrantUnexpired(activeRecipientGrant) && Boolean(activeRecipientGrant?.canView);

    if (!isOwner && !isConfidentialDomainAuthorized && !hasValidShare) {
      return {
        allowed: false,
        reason:
          'Confidentiality boundary: access is restricted to the document owner, authorized domain office, or explicit unexpired recipients.',
      };
    }
  }

  // 4. Action-specific workflow rules
  if (action === 'APPROVE' || action === 'REJECT' || action === 'REQUEST_CHANGES') {
    if (isOwner) {
      return {
        allowed: false,
        reason: 'Self-approval is prohibited: another authorized reviewer must evaluate this document.',
      };
    }
    const reviewableStatuses = new Set([
      'UPLOADED',
      'SUBMITTED',
      'PENDING_REVIEW',
      'UNDER_REVIEW',
      'UNDER_VERIFICATION',
    ]);
    if (!reviewableStatuses.has(doc.status)) {
      return {
        allowed: false,
        reason: `Document cannot be reviewed while in ${doc.status} status.`,
      };
    }
    // HOD scope check
    if (
      user.role === 'HOD' &&
      doc.departmentId &&
      user.departmentId &&
      doc.departmentId !== user.departmentId
    ) {
      return {
        allowed: false,
        reason: 'HOD review authority is scoped strictly to your own department.',
      };
    }
    return { allowed: true };
  }

  if (action === 'SIGN') {
    if (doc.status !== 'APPROVED' && doc.status !== 'SIGNED') {
      return {
        allowed: false,
        reason: 'Document must be independently APPROVED before digital signature.',
      };
    }
    return { allowed: true };
  }

  if (action === 'ISSUE') {
    if (doc.status !== 'APPROVED' && doc.status !== 'SIGNED') {
      return {
        allowed: false,
        reason:
          'Only APPROVED or SIGNED documents can be officially issued with an HCA/DOC reference.',
      };
    }
    return { allowed: true };
  }

  if (action === 'EDIT') {
    if (doc.status === 'ISSUED' || doc.status === 'REVOKED' || doc.status === 'ARCHIVED') {
      return {
        allowed: false,
        reason: 'Issued, revoked, or archived documents are immutable and cannot be edited.',
      };
    }
    const canEditAll = hasDocumentPermission(
      user.permissions,
      DOCUMENT_PERMISSIONS.DOCUMENT_EDIT_ALL
    );
    if (!isOwner && !canEditAll) {
      return {
        allowed: false,
        reason: 'Only the document owner or authorized Registrar editor may modify this draft.',
      };
    }
    return { allowed: true };
  }

  if (action === 'SUBMIT') {
    if (!isOwner) {
      return { allowed: false, reason: 'Only the document owner can submit this draft for review.' };
    }
    if (
      doc.status !== 'DRAFT' &&
      doc.status !== 'UPLOADED' &&
      doc.status !== 'CHANGES_REQUESTED' &&
      doc.status !== 'REQUIRES_CORRECTION'
    ) {
      return {
        allowed: false,
        reason: `Only DRAFT, UPLOADED, or CHANGES_REQUESTED documents can be submitted (currently ${doc.status}).`,
      };
    }
    return { allowed: true };
  }

  if (action === 'SHARE') {
    if (!isOwner && !hasDocumentPermission(user.permissions, DOCUMENT_PERMISSIONS.DOCUMENT_VIEW_ALL)) {
      return { allowed: false, reason: 'Only owner or institutional custodian may share documents.' };
    }
    return { allowed: true };
  }

  if (action === 'REVOKE') {
    if (doc.status !== 'ISSUED') {
      return { allowed: false, reason: 'Only ISSUED official documents can be revoked.' };
    }
    return { allowed: true };
  }

  // 5. Read/Print/Export scope checks for PUBLIC / INTERNAL documents
  if (isOwner) return { allowed: true };
  if (isRecipientAccessValid(activeRecipientGrant, action)) return { allowed: true };
  if (doc.confidentiality === 'PUBLIC' && (doc.status === 'ISSUED' || doc.status === 'APPROVED')) {
    return { allowed: true };
  }
  if (!isStaffDocumentRole(user.role)) {
    // Non-staff (e.g. students) only view PUBLIC issued/approved or their own/explicitly shared docs
    return {
      allowed: false,
      reason: 'Access denied: students may only access their own records, shared files, or public issued notices.',
    };
  }
  if (isConfidentialDomainAuthorized) {
    return { allowed: true };
  }
  if (hasDocumentPermission(user.permissions, DOCUMENT_PERMISSIONS.DOCUMENT_VIEW_ALL)) {
    return { allowed: true };
  }
  if (
    hasDocumentPermission(user.permissions, DOCUMENT_PERMISSIONS.DOCUMENT_VIEW_CAMPUS) &&
    doc.campusId &&
    user.campusId === doc.campusId
  ) {
    return { allowed: true };
  }
  if (
    hasDocumentPermission(user.permissions, DOCUMENT_PERMISSIONS.DOCUMENT_VIEW_DEPARTMENT) &&
    doc.departmentId &&
    user.departmentId === doc.departmentId
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Access denied: document falls outside your authorized role, department, or campus scope.',
  };
}
