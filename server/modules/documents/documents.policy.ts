import type { DocumentRecipientRecord, DocumentRecord } from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import {
  DOCUMENT_PERMISSIONS,
  hasDocumentPermission,
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

export function toDocumentUser(user: AuthenticatedSessionUser): AuthenticatedDocumentUser {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    employeeNumber: user.employeeNumber,
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

/**
 * Strongly-typed zero-bypass document policy engine.
 * - Super Admin / ADMIN never automatically bypass CONFIDENTIAL or RESTRICTED records.
 * - Confidential Student Welfare & HR Contracts require owner/recipient or domain authority.
 * - Self-approval is strictly prohibited.
 * - APPROVE, SIGN, and ISSUE require distinct permissions.
 */
export function canAccessDocument(
  user: AuthenticatedDocumentUser,
  doc: DocumentRecord,
  recipientGrants: DocumentRecipientRecord[],
  action: DocumentAccessAction = 'VIEW'
): { allowed: boolean; reason?: string } {
  const isOwner = doc.ownerId === user.id || doc.createdById === user.id;
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

  // 2. Confidentiality enforcement (No Super Admin bypass!)
  if (doc.confidentiality === 'CONFIDENTIAL' || doc.confidentiality === 'RESTRICTED') {
    const isConfidentialDomainAuthorized =
      (doc.category === 'STUDENT_WELFARE_CONFIDENTIAL' && user.role === 'STUDENT_AFFAIRS') ||
      (doc.category === 'EMPLOYMENT_CONTRACT' &&
        (user.role === 'HR' || user.role === 'PRINCIPAL')) ||
      (doc.category === 'FEE_STATEMENT' && user.role === 'FINANCE_OFFICER');

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

  // 3. Action-specific workflow rules
  if (action === 'APPROVE' || action === 'REJECT' || action === 'REQUEST_CHANGES') {
    if (isOwner) {
      return {
        allowed: false,
        reason: 'Self-approval is prohibited: another authorized reviewer must evaluate this document.',
      };
    }
    if (doc.status !== 'SUBMITTED' && doc.status !== 'UNDER_REVIEW') {
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
    if (doc.status !== 'DRAFT' && doc.status !== 'CHANGES_REQUESTED') {
      return {
        allowed: false,
        reason: `Only DRAFT or CHANGES_REQUESTED documents can be submitted (currently ${doc.status}).`,
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

  // 4. Read/Print/Export scope checks for PUBLIC / INTERNAL documents
  if (isOwner) return { allowed: true };
  if (isRecipientAccessValid(activeRecipientGrant, action)) return { allowed: true };
  if (doc.confidentiality === 'PUBLIC' && (doc.status === 'ISSUED' || doc.status === 'APPROVED')) {
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
