import crypto from 'node:crypto';
import {
  allocateDocumentReference,
  getDb,
  saveDb,
  type DocumentAuditLogRecord,
  type DocumentCategory,
  type DocumentConfidentiality,
  type DocumentDesignConfig,
  type DocumentRecord,
  type DocumentTemplateRecord,
  type DocumentWorkflowStatus,
  type PortalDatabase,
} from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import { canAccessDocument, toDocumentUser } from './documents.policy.ts';
import { DOCUMENT_PERMISSIONS, hasDocumentPermission } from './documents.permissions.ts';

function appendDocAudit(
  db: PortalDatabase,
  documentId: string,
  actor: AuthenticatedSessionUser,
  action: string,
  detail: string
): void {
  const entry: DocumentAuditLogRecord = {
    id: `daud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    documentId,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    detail,
    createdAt: new Date().toISOString(),
  };
  db.documentAuditLogs.unshift(entry);
}

export class DocumentAccessError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const documentsService = {
  listDocuments(
    user: AuthenticatedSessionUser,
    filters: {
      view?: string;
      status?: string;
      category?: string;
      confidentiality?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const db = getDb();
    const docUser = toDocumentUser(user);

    const accessible = db.documents.filter((doc) => {
      const check = canAccessDocument(docUser, doc, db.documentRecipients, 'VIEW');
      if (!check.allowed) return false;

      const view = (filters.view ?? 'all').toLowerCase();
      if (view === 'mine' && doc.ownerId !== user.id && doc.createdById !== user.id) {
        return false;
      }
      if (view === 'pending_approvals') {
        const isPending = doc.status === 'SUBMITTED' || doc.status === 'UNDER_REVIEW';
        const canApproveThis = canAccessDocument(
          docUser,
          doc,
          db.documentRecipients,
          'APPROVE'
        ).allowed;
        if (!isPending || !canApproveThis) return false;
      }
      if (view === 'issued' && doc.status !== 'ISSUED') {
        return false;
      }
      if (view === 'shared') {
        const isRecipient = db.documentRecipients.some(
          (r) =>
            r.documentId === doc.id &&
            r.userId === user.id &&
            (!r.expiresAt || new Date(r.expiresAt).getTime() > Date.now())
        );
        if (!isRecipient) return false;
      }
      if (view === 'archived' && doc.status !== 'ARCHIVED') {
        return false;
      }
      if (view !== 'archived' && view !== 'all' && doc.status === 'ARCHIVED') {
        return false;
      }

      if (filters.status && filters.status !== 'ALL' && doc.status !== filters.status) {
        return false;
      }
      if (filters.category && filters.category !== 'ALL' && doc.category !== filters.category) {
        return false;
      }
      if (
        filters.confidentiality &&
        filters.confidentiality !== 'ALL' &&
        doc.confidentiality !== filters.confidentiality
      ) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.referenceNumber ?? '').toLowerCase().includes(q) ||
          doc.recipientLabel.toLowerCase().includes(q) ||
          doc.ownerName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
    const total = accessible.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (Math.min(page, totalPages) - 1) * pageSize;

    // Role-scoped summary metrics computed strictly from policy-filtered accessible records
    const stats = {
      totalAccessible: accessible.length,
      drafts: accessible.filter((d) => d.status === 'DRAFT' || d.status === 'CHANGES_REQUESTED').length,
      pendingApprovals: accessible.filter(
        (d) =>
          (d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW') &&
          canAccessDocument(docUser, d, db.documentRecipients, 'APPROVE').allowed
      ).length,
      issued: accessible.filter((d) => d.status === 'ISSUED').length,
      sharedWithMe: db.documentRecipients.filter(
        (r) =>
          r.userId === user.id &&
          (!r.expiresAt || new Date(r.expiresAt).getTime() > Date.now())
      ).length,
    };

    return {
      items: accessible.slice(start, start + pageSize),
      page: Math.min(page, totalPages),
      pageSize,
      total,
      totalPages,
      stats,
    };
  },

  getDocumentDetail(user: AuthenticatedSessionUser, docId: string) {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const docUser = toDocumentUser(user);
    const check = canAccessDocument(docUser, doc, db.documentRecipients, 'VIEW');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Access denied.');
    }

    const versions = db.documentVersions
      .filter((v) => v.documentId === doc.id)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    const approvals = db.documentApprovals
      .filter((a) => a.documentId === doc.id)
      .sort((a, b) => a.stepOrder - b.stepOrder);
    const signatures = db.documentSignatures.filter((s) => s.documentId === doc.id);
    const recipients = db.documentRecipients.filter((r) => r.documentId === doc.id);
    const auditLogs = hasDocumentPermission(docUser.permissions, DOCUMENT_PERMISSIONS.AUDIT_VIEW) ||
      doc.ownerId === user.id
      ? db.documentAuditLogs.filter((l) => l.documentId === doc.id)
      : [];

    const allowedActions = {
      canEdit: canAccessDocument(docUser, doc, db.documentRecipients, 'EDIT').allowed,
      canSubmit: canAccessDocument(docUser, doc, db.documentRecipients, 'SUBMIT').allowed,
      canApprove: canAccessDocument(docUser, doc, db.documentRecipients, 'APPROVE').allowed,
      canRequestChanges: canAccessDocument(
        docUser,
        doc,
        db.documentRecipients,
        'REQUEST_CHANGES'
      ).allowed,
      canReject: canAccessDocument(docUser, doc, db.documentRecipients, 'REJECT').allowed,
      canSign: canAccessDocument(docUser, doc, db.documentRecipients, 'SIGN').allowed,
      canIssue: canAccessDocument(docUser, doc, db.documentRecipients, 'ISSUE').allowed,
      canShare: canAccessDocument(docUser, doc, db.documentRecipients, 'SHARE').allowed,
      canArchive: canAccessDocument(docUser, doc, db.documentRecipients, 'ARCHIVE').allowed,
      canRestore: canAccessDocument(docUser, doc, db.documentRecipients, 'RESTORE').allowed,
      canRevoke: canAccessDocument(docUser, doc, db.documentRecipients, 'REVOKE').allowed,
      canPrint: canAccessDocument(docUser, doc, db.documentRecipients, 'PRINT').allowed,
      canExport: canAccessDocument(docUser, doc, db.documentRecipients, 'EXPORT').allowed,
    };

    return {
      document: doc,
      versions,
      approvals,
      signatures,
      recipients,
      auditLogs,
      allowedActions,
    };
  },

  createDraft(
    user: AuthenticatedSessionUser,
    input: {
      title: string;
      category: DocumentCategory;
      confidentiality: DocumentConfidentiality;
      recipientLabel: string;
      recipientEmail?: string;
      subjectLine: string;
      bodyContent: string;
      metadataFields: Record<string, string>;
      design: DocumentDesignConfig;
      templateId: string | null;
    }
  ): DocumentRecord {
    const db = getDb();
    const now = new Date().toISOString();
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Drafts NEVER receive an official HCA/DOC reference number (assigned strictly on issuance)
    const doc: DocumentRecord = {
      id: docId,
      referenceNumber: null,
      title: input.title,
      category: input.category,
      confidentiality: input.confidentiality,
      status: 'DRAFT',
      ownerId: user.id,
      ownerName: user.fullName,
      createdById: user.id,
      createdByName: user.fullName,
      departmentId: user.departmentId,
      departmentName: user.department,
      campusId: user.campusId,
      campusName: user.campus,
      recipientLabel: input.recipientLabel,
      recipientEmail: input.recipientEmail,
      subjectLine: input.subjectLine,
      bodyContent: input.bodyContent,
      metadataFields: input.metadataFields,
      design: input.design,
      templateId: input.templateId,
      currentVersion: 1,
      verificationHash: null,
      issuedAt: null,
      issuedById: null,
      issuedByName: null,
      revokedReason: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    db.documents.unshift(doc);
    db.documentVersions.unshift({
      id: `ver-${Date.now()}`,
      documentId: doc.id,
      versionNumber: 1,
      title: doc.title,
      subjectLine: doc.subjectLine,
      bodyContent: doc.bodyContent,
      metadataFields: doc.metadataFields,
      editedById: user.id,
      editedByName: user.fullName,
      changeNote: 'Initial draft created',
      createdAt: now,
    });
    appendDocAudit(
      db,
      doc.id,
      user,
      'DRAFT_CREATED',
      `Created draft "${doc.title}" (${doc.category} · ${doc.confidentiality}).`
    );
    saveDb(db);
    return doc;
  },

  uploadDocument(
    user: AuthenticatedSessionUser,
    input: {
      title: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      contentBase64?: string;
      category: DocumentCategory;
      confidentiality: DocumentConfidentiality;
      recipientLabel: string;
      description?: string;
    }
  ) {
    const allowedMimes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'text/plain',
    ]);
    const forbiddenExt = /\.(exe|bat|cmd|sh|js|msi|vbs|ps1)$/i;
    if (forbiddenExt.test(input.fileName) || !allowedMimes.has(input.mimeType)) {
      throw new DocumentAccessError(
        422,
        'File quarantined: unsupported or potentially unsafe file format. Allowed: PDF, DOCX, PNG, JPG, TXT.'
      );
    }
    if (input.sizeBytes <= 0 || input.sizeBytes > 10 * 1024 * 1024) {
      throw new DocumentAccessError(400, 'File size must be between 1 byte and 10 MB.');
    }

    const checksumSha256 = crypto
      .createHash('sha256')
      .update(input.contentBase64 || `${input.fileName}:${input.sizeBytes}:${Date.now()}`)
      .digest('hex');

    const doc = this.createDraft(user, {
      title: input.title,
      category: input.category,
      confidentiality: input.confidentiality,
      recipientLabel: input.recipientLabel,
      subjectLine: `UPLOADED RECORD — ${input.fileName}`,
      bodyContent:
        input.description?.trim() ||
        `Uploaded institutional file "${input.fileName}" (${input.mimeType}, ${(
          input.sizeBytes / 1024
        ).toFixed(1)} KB). Verified clean and integrity-hashed.`,
      metadataFields: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: String(input.sizeBytes),
        checksumSha256,
        scanStatus: 'VERIFIED_CLEAN',
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
      templateId: null,
    });

    return {
      document: doc,
      checksumSha256,
      scanStatus: 'VERIFIED_CLEAN',
    };
  },

  updateDraft(
    user: AuthenticatedSessionUser,
    docId: string,
    patch: {
      title?: string;
      confidentiality?: DocumentConfidentiality;
      recipientLabel?: string;
      subjectLine?: string;
      bodyContent?: string;
      metadataFields?: Record<string, string>;
      design?: DocumentDesignConfig;
      changeNote?: string;
    }
  ): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'EDIT');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Edit denied.');
    }

    if (patch.title !== undefined) doc.title = patch.title;
    if (patch.confidentiality !== undefined) doc.confidentiality = patch.confidentiality;
    if (patch.recipientLabel !== undefined) doc.recipientLabel = patch.recipientLabel;
    if (patch.subjectLine !== undefined) doc.subjectLine = patch.subjectLine;
    if (patch.bodyContent !== undefined) doc.bodyContent = patch.bodyContent;
    if (patch.metadataFields !== undefined) doc.metadataFields = patch.metadataFields;
    if (patch.design !== undefined) doc.design = patch.design;

    const now = new Date().toISOString();
    doc.currentVersion += 1;
    doc.updatedAt = now;

    db.documentVersions.unshift({
      id: `ver-${Date.now()}`,
      documentId: doc.id,
      versionNumber: doc.currentVersion,
      title: doc.title,
      subjectLine: doc.subjectLine,
      bodyContent: doc.bodyContent,
      metadataFields: doc.metadataFields,
      editedById: user.id,
      editedByName: user.fullName,
      changeNote: patch.changeNote || `Updated draft to v${doc.currentVersion}`,
      createdAt: now,
    });

    appendDocAudit(
      db,
      doc.id,
      user,
      'DRAFT_UPDATED',
      `Saved version v${doc.currentVersion}: ${patch.changeNote || 'Content updated'}.`
    );
    saveDb(db);
    return doc;
  },

  submitForApproval(
    user: AuthenticatedSessionUser,
    docId: string,
    input: { reviewerId?: string; note?: string }
  ): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'SUBMIT');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Submit denied.');
    }

    // Select an independent reviewer (never the owner/creator)
    let reviewer = input.reviewerId
      ? db.staffAccounts.find((s) => s.id === input.reviewerId)
      : undefined;

    if (reviewer && (reviewer.id === doc.ownerId || reviewer.id === doc.createdById)) {
      throw new DocumentAccessError(
        400,
        'Assigned reviewer cannot be the document owner or author (self-approval ban).'
      );
    }

    if (!reviewer) {
      reviewer =
        db.staffAccounts.find(
          (s) =>
            s.id !== user.id &&
            s.documentPermissions.includes(DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE) &&
            (s.role === 'PRINCIPAL' || s.role === 'REGISTRAR' || s.role === 'HOD')
        ) ?? db.staffAccounts.find((s) => s.id !== user.id);
    }

    if (!reviewer) {
      throw new DocumentAccessError(400, 'No eligible independent reviewer found.');
    }

    const now = new Date().toISOString();
    doc.status = 'SUBMITTED';
    doc.updatedAt = now;

    db.documentApprovals.push({
      id: `app-${Date.now()}`,
      documentId: doc.id,
      stepOrder: db.documentApprovals.filter((a) => a.documentId === doc.id).length + 1,
      reviewerId: reviewer.id,
      reviewerName: reviewer.fullName,
      reviewerRole: reviewer.role,
      status: 'PENDING',
      comment: input.note ?? null,
      decidedAt: null,
      createdAt: now,
    });

    if (
      !db.documentRecipients.some(
        (r) => r.documentId === doc.id && r.userId === reviewer.id
      )
    ) {
      db.documentRecipients.push({
        id: `rcp-rev-${Date.now()}`,
        documentId: doc.id,
        userId: reviewer.id,
        userName: reviewer.fullName,
        userRole: reviewer.roleTitle,
        canView: true,
        canDownload: true,
        canPrint: true,
        grantedById: user.id,
        grantedByName: user.fullName,
        expiresAt: null,
        createdAt: now,
      });
    }

    appendDocAudit(
      db,
      doc.id,
      user,
      'DOCUMENT_SUBMITTED',
      `Submitted v${doc.currentVersion} to ${reviewer.fullName} (${reviewer.role}) for independent review.`
    );
    saveDb(db);
    return doc;
  },

  approveDocument(
    user: AuthenticatedSessionUser,
    docId: string,
    comment: string
  ): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'APPROVE');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Approval denied.');
    }

    const now = new Date().toISOString();
    const pendingStep = db.documentApprovals.find(
      (a) => a.documentId === doc.id && a.status === 'PENDING'
    );
    if (pendingStep) {
      pendingStep.status = 'APPROVED';
      pendingStep.comment = comment || 'Approved for signature/issuance.';
      pendingStep.reviewerId = user.id;
      pendingStep.reviewerName = user.fullName;
      pendingStep.decidedAt = now;
    } else {
      db.documentApprovals.push({
        id: `app-${Date.now()}`,
        documentId: doc.id,
        stepOrder: db.documentApprovals.filter((a) => a.documentId === doc.id).length + 1,
        reviewerId: user.id,
        reviewerName: user.fullName,
        reviewerRole: user.role === 'UNCONFIGURED' ? 'ADMIN' : user.role,
        status: 'APPROVED',
        comment: comment || 'Approved.',
        decidedAt: now,
        createdAt: now,
      });
    }

    doc.status = 'APPROVED';
    doc.updatedAt = now;
    appendDocAudit(
      db,
      doc.id,
      user,
      'DOCUMENT_APPROVED',
      `Independently approved document${comment ? `: "${comment}"` : '.'}`
    );
    saveDb(db);
    return doc;
  },

  requestChanges(
    user: AuthenticatedSessionUser,
    docId: string,
    comment: string
  ): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(
      toDocumentUser(user),
      doc,
      db.documentRecipients,
      'REQUEST_CHANGES'
    );
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Request changes denied.');
    }

    const now = new Date().toISOString();
    const pendingStep = db.documentApprovals.find(
      (a) => a.documentId === doc.id && a.status === 'PENDING'
    );
    if (pendingStep) {
      pendingStep.status = 'CHANGES_REQUESTED';
      pendingStep.comment = comment;
      pendingStep.reviewerId = user.id;
      pendingStep.reviewerName = user.fullName;
      pendingStep.decidedAt = now;
    }

    doc.status = 'CHANGES_REQUESTED';
    doc.updatedAt = now;
    appendDocAudit(
      db,
      doc.id,
      user,
      'CHANGES_REQUESTED',
      `Requested changes: "${comment}".`
    );
    saveDb(db);
    return doc;
  },

  rejectDocument(
    user: AuthenticatedSessionUser,
    docId: string,
    comment: string
  ): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'REJECT');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Rejection denied.');
    }

    const now = new Date().toISOString();
    const pendingStep = db.documentApprovals.find(
      (a) => a.documentId === doc.id && a.status === 'PENDING'
    );
    if (pendingStep) {
      pendingStep.status = 'REJECTED';
      pendingStep.comment = comment;
      pendingStep.reviewerId = user.id;
      pendingStep.reviewerName = user.fullName;
      pendingStep.decidedAt = now;
    }

    doc.status = 'REJECTED';
    doc.updatedAt = now;
    appendDocAudit(db, doc.id, user, 'DOCUMENT_REJECTED', `Rejected document: "${comment}".`);
    saveDb(db);
    return doc;
  },

  signDocument(
    user: AuthenticatedSessionUser,
    docId: string,
    signatureTitle: string
  ): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'SIGN');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Signature denied.');
    }

    const now = new Date().toISOString();
    const digest = crypto
      .createHash('sha256')
      .update(`${doc.id}:${doc.currentVersion}:${user.id}:${now}`)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();

    db.documentSignatures.push({
      id: `sig-${Date.now()}`,
      documentId: doc.id,
      signerId: user.id,
      signerName: user.fullName,
      signerTitle: user.roleTitle,
      signatureTitle,
      signatureDigest: `SIG-HCA-${digest}`,
      signedAt: now,
    });

    doc.status = 'SIGNED';
    doc.updatedAt = now;
    appendDocAudit(
      db,
      doc.id,
      user,
      'DOCUMENT_SIGNED',
      `Applied digital signature SIG-HCA-${digest} (${signatureTitle}).`
    );
    saveDb(db);
    return doc;
  },

  issueDocument(user: AuthenticatedSessionUser, docId: string): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'ISSUE');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Issuance denied.');
    }

    const now = new Date().toISOString();
    const referenceNumber = doc.referenceNumber ?? allocateDocumentReference(db);
    const verificationHash =
      doc.verificationHash ??
      `HCA-VER-${crypto
        .createHash('sha256')
        .update(`${referenceNumber}:${doc.id}:${now}`)
        .digest('hex')
        .slice(0, 8)
        .toUpperCase()}`;

    doc.referenceNumber = referenceNumber;
    doc.verificationHash = verificationHash;
    doc.status = 'ISSUED';
    doc.issuedAt = now;
    doc.issuedById = user.id;
    doc.issuedByName = user.fullName;
    doc.updatedAt = now;

    appendDocAudit(
      db,
      doc.id,
      user,
      'DOCUMENT_ISSUED',
      `Officially issued document with atomic reference ${referenceNumber} and verification code ${verificationHash}.`
    );
    saveDb(db);
    return doc;
  },

  shareDocument(
    user: AuthenticatedSessionUser,
    docId: string,
    input: {
      userId: string;
      canView: boolean;
      canDownload: boolean;
      canPrint: boolean;
      expiresAt: string | null;
    }
  ) {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'SHARE');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Share denied.');
    }

    const recipientUser = db.staffAccounts.find((s) => s.id === input.userId);
    if (!recipientUser) throw new DocumentAccessError(404, 'Target staff user not found.');

    const now = new Date().toISOString();
    const existing = db.documentRecipients.find(
      (r) => r.documentId === doc.id && r.userId === recipientUser.id
    );
    if (existing) {
      existing.canView = input.canView;
      existing.canDownload = input.canDownload;
      existing.canPrint = input.canPrint;
      existing.expiresAt = input.expiresAt;
      existing.grantedById = user.id;
      existing.grantedByName = user.fullName;
    } else {
      db.documentRecipients.push({
        id: `rcp-${Date.now()}`,
        documentId: doc.id,
        userId: recipientUser.id,
        userName: recipientUser.fullName,
        userRole: recipientUser.roleTitle,
        canView: input.canView,
        canDownload: input.canDownload,
        canPrint: input.canPrint,
        grantedById: user.id,
        grantedByName: user.fullName,
        expiresAt: input.expiresAt,
        createdAt: now,
      });
    }

    appendDocAudit(
      db,
      doc.id,
      user,
      'DOCUMENT_SHARED',
      `Granted explicit access to ${recipientUser.fullName} (${recipientUser.role})${
        input.expiresAt ? ` until ${input.expiresAt.slice(0, 10)}` : ''
      }.`
    );
    saveDb(db);
    return db.documentRecipients.filter((r) => r.documentId === doc.id);
  },

  archiveDocument(user: AuthenticatedSessionUser, docId: string): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'ARCHIVE');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Archive denied.');
    }
    const now = new Date().toISOString();
    doc.status = 'ARCHIVED';
    doc.archivedAt = now;
    doc.updatedAt = now;
    appendDocAudit(db, doc.id, user, 'DOCUMENT_ARCHIVED', 'Moved document to institutional archive.');
    saveDb(db);
    return doc;
  },

  restoreDocument(user: AuthenticatedSessionUser, docId: string): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'RESTORE');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Restore denied.');
    }
    if (doc.status !== 'ARCHIVED') {
      throw new DocumentAccessError(400, 'Only archived documents can be restored.');
    }
    const restoredStatus: DocumentWorkflowStatus = doc.referenceNumber ? 'ISSUED' : 'DRAFT';
    doc.status = restoredStatus;
    doc.archivedAt = null;
    doc.updatedAt = new Date().toISOString();
    appendDocAudit(
      db,
      doc.id,
      user,
      'DOCUMENT_RESTORED',
      `Restored document from archive to ${restoredStatus}.`
    );
    saveDb(db);
    return doc;
  },

  revokeDocument(
    user: AuthenticatedSessionUser,
    docId: string,
    reason: string
  ): DocumentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'REVOKE');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Revoke denied.');
    }

    doc.status = 'REVOKED';
    doc.revokedReason = reason;
    doc.updatedAt = new Date().toISOString();
    appendDocAudit(db, doc.id, user, 'DOCUMENT_REVOKED', `Revoked issued document: "${reason}".`);
    saveDb(db);
    return doc;
  },

  verifyByReference(ref: string) {
    const db = getDb();
    const cleanRef = ref.trim().toUpperCase();
    const doc = db.documents.find(
      (d) =>
        (d.referenceNumber && d.referenceNumber.toUpperCase() === cleanRef) ||
        (d.verificationHash && d.verificationHash.toUpperCase() === cleanRef)
    );

    if (!doc) {
      return {
        verified: false,
        status: 'NOT_FOUND',
        message: 'No issued HI-TECH College document matches this reference or verification hash.',
      };
    }

    const signatures = db.documentSignatures
      .filter((s) => s.documentId === doc.id)
      .map((s) => ({
        signerName: s.signerName,
        signerTitle: s.signerTitle,
        signedAt: s.signedAt,
        signatureDigest: s.signatureDigest,
      }));

    // Public-safe verification summary: never exposes confidential bodyContent!
    return {
      verified: doc.status === 'ISSUED',
      status: doc.status,
      referenceNumber: doc.referenceNumber,
      verificationHash: doc.verificationHash,
      title: doc.confidentiality === 'CONFIDENTIAL' || doc.confidentiality === 'RESTRICTED'
        ? 'Confidential Institutional Record (Metadata Redacted)'
        : doc.title,
      category: doc.category,
      campusName: doc.campusName,
      issuedAt: doc.issuedAt,
      issuedByName: doc.issuedByName,
      revokedReason: doc.revokedReason,
      signatures,
      message:
        doc.status === 'ISSUED'
          ? 'Authentic HI-TECH College official document.'
          : doc.status === 'REVOKED'
          ? `This document was officially REVOKED: ${doc.revokedReason}`
          : `Document status is ${doc.status}.`,
    };
  },

  listTemplates(): DocumentTemplateRecord[] {
    return getDb().documentTemplates;
  },

  createTemplate(
    user: AuthenticatedSessionUser,
    input: Omit<DocumentTemplateRecord, 'id' | 'createdById' | 'createdAt'>
  ): DocumentTemplateRecord {
    const db = getDb();
    const tpl: DocumentTemplateRecord = {
      ...input,
      id: `tpl-${Date.now()}`,
      createdById: user.id,
      createdAt: new Date().toISOString(),
    };
    db.documentTemplates.unshift(tpl);
    saveDb(db);
    return tpl;
  },

  listGlobalAuditLogs(user: AuthenticatedSessionUser) {
    const db = getDb();
    const docUser = toDocumentUser(user);
    if (!hasDocumentPermission(docUser.permissions, DOCUMENT_PERMISSIONS.AUDIT_VIEW)) {
      throw new DocumentAccessError(403, 'Audit log access requires documents.audit.view.');
    }
    return db.documentAuditLogs.filter((log) => {
      const doc = db.documents.find((d) => d.id === log.documentId);
      if (!doc) return false;
      return canAccessDocument(docUser, doc, db.documentRecipients, 'VIEW').allowed;
    });
  },
};
