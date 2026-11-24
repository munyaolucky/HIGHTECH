import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  allocateDocumentReference,
  allocateDocumentRequestNumber,
  getDb,
  saveDb,
  type DocumentApprovalRecord,
  type DocumentAttachmentRecord,
  type DocumentAuditLogRecord,
  type DocumentCategory,
  type DocumentCommentRecord,
  type DocumentConfidentiality,
  type DocumentDesignConfig,
  type DocumentRecord,
  type DocumentRequestRecord,
  type DocumentRetentionPolicyRecord,
  type DocumentTemplateRecord,
  type DocumentWorkflowStatus,
  type PortalDatabase,
} from '../../data/store.ts';
import {
  canManageDocumentCategory,
  getDocumentCategoryConfig,
  isDocumentPolicyAllowedForCategory,
  isStaffDocumentRole,
  normalizeDocumentCategoryCode,
  type DmsModuleKey,
  type DocumentCategoryConfig,
} from './documents.catalog.ts';
import {
  canAccessDocument,
  canUploadToCategory,
  toDocumentUser,
  type DocumentActor,
} from './documents.policy.ts';
import { DOCUMENT_PERMISSIONS, hasDocumentPermission } from './documents.permissions.ts';
import {
  readPrivateDocumentFile,
  resolveSafeStoragePath,
  savePrivateDocumentFile,
  signDownloadToken,
  validateAndScanUpload,
  verifyDownloadToken,
} from './documents.storage.ts';

function appendDocAudit(
  db: PortalDatabase,
  documentId: string,
  actor: Pick<DocumentActor, 'id' | 'fullName' | 'role'>,
  action: string,
  detail: string,
  ipAddress = '127.0.0.1'
): void {
  const entry: DocumentAuditLogRecord = {
    id: `daud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    documentId,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    detail,
    ipAddress,
    createdAt: new Date().toISOString(),
  };
  db.documentAuditLogs.unshift(entry);
}

function computeRetentionIso(retentionDays: number): string {
  const ms = Math.max(30, retentionDays) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
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
    user: DocumentActor,
    filters: {
      view?: string;
      status?: string;
      category?: string;
      moduleKey?: string;
      confidentiality?: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
      academicYear?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const db = getDb();
    const docUser = toDocumentUser(user);
    const normalizedFilterCat =
      filters.category && filters.category !== 'ALL'
        ? normalizeDocumentCategoryCode(filters.category) ?? filters.category
        : undefined;

    const accessibleAll = db.documents.filter((doc) =>
      canAccessDocument(docUser, doc, db.documentRecipients, 'VIEW').allowed
    );

    const accessible = accessibleAll.filter((doc) => {
      const view = (filters.view ?? 'all').toLowerCase();
      const isMine =
        doc.ownerId === user.id ||
        doc.createdById === user.id ||
        ('registrationNumber' in user &&
          Boolean(user.registrationNumber) &&
          doc.relatedStudentOrStaffId === user.registrationNumber);

      if (view === 'mine' && !isMine) {
        return false;
      }
      if (view === 'pending_approvals' || view === 'verification') {
        const isPending =
          doc.status === 'UPLOADED' ||
          doc.status === 'SUBMITTED' ||
          doc.status === 'PENDING_REVIEW' ||
          doc.status === 'UNDER_REVIEW' ||
          doc.status === 'UNDER_VERIFICATION';
        if (view === 'pending_approvals') {
          const canApproveThis = canAccessDocument(
            docUser,
            doc,
            db.documentRecipients,
            'APPROVE'
          ).allowed;
          if (!isPending || !canApproveThis) return false;
        } else if (!isPending && doc.status !== 'REQUIRES_CORRECTION' && doc.status !== 'CHANGES_REQUESTED') {
          return false;
        }
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
      if (normalizedFilterCat && doc.category !== normalizedFilterCat) {
        return false;
      }
      if (filters.moduleKey && filters.moduleKey !== 'ALL') {
        const catCfg = getDocumentCategoryConfig(doc.category, db.documentCategories);
        const docMod = doc.moduleKey ?? catCfg?.moduleKey ?? 'ADMIN_GOVERNANCE';
        if (docMod !== filters.moduleKey.toUpperCase()) return false;
      }
      if (
        filters.confidentiality &&
        filters.confidentiality !== 'ALL' &&
        doc.confidentiality !== filters.confidentiality
      ) {
        return false;
      }
      if (filters.relatedEntityType && doc.relatedEntityType !== filters.relatedEntityType) {
        return false;
      }
      if (filters.relatedEntityId && doc.relatedEntityId !== filters.relatedEntityId) {
        return false;
      }
      if (filters.academicYear && filters.academicYear !== 'ALL' && doc.academicYear !== filters.academicYear) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.referenceNumber ?? '').toLowerCase().includes(q) ||
          (doc.documentNumber ?? '').toLowerCase().includes(q) ||
          (doc.originalFileName ?? '').toLowerCase().includes(q) ||
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

    const stats = {
      totalAccessible: accessibleAll.length,
      drafts: accessibleAll.filter(
        (d) =>
          d.status === 'DRAFT' ||
          d.status === 'UPLOADED' ||
          d.status === 'CHANGES_REQUESTED' ||
          d.status === 'REQUIRES_CORRECTION'
      ).length,
      pendingApprovals: accessibleAll.filter(
        (d) =>
          (d.status === 'UPLOADED' ||
            d.status === 'SUBMITTED' ||
            d.status === 'PENDING_REVIEW' ||
            d.status === 'UNDER_REVIEW' ||
            d.status === 'UNDER_VERIFICATION') &&
          canAccessDocument(docUser, d, db.documentRecipients, 'APPROVE').allowed
      ).length,
      pendingVerification: accessibleAll.filter(
        (d) =>
          d.status === 'UPLOADED' ||
          d.status === 'SUBMITTED' ||
          d.status === 'PENDING_REVIEW' ||
          d.status === 'UNDER_VERIFICATION'
      ).length,
      issued: accessibleAll.filter((d) => d.status === 'ISSUED').length,
      sharedWithMe: db.documentRecipients.filter(
        (r) =>
          r.userId === user.id &&
          (!r.expiresAt || new Date(r.expiresAt).getTime() > Date.now())
      ).length,
      totalBytes: accessibleAll.reduce((sum, d) => sum + (d.fileSizeBytes ?? 0), 0),
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

  getDocumentDetail(user: DocumentActor, docId: string) {
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
    const attachments = (db.documentAttachments ?? []).filter((a) => a.documentId === doc.id);
    const approvals = db.documentApprovals
      .filter((a) => a.documentId === doc.id)
      .sort((a, b) => a.stepOrder - b.stepOrder);
    const comments = (db.documentComments ?? [])
      .filter((c) => {
        if (c.documentId !== doc.id) return false;
        if (c.isInternal && !isStaffDocumentRole(user.role)) return false;
        return true;
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const signatures = db.documentSignatures.filter((s) => s.documentId === doc.id);
    const recipients = db.documentRecipients.filter((r) => r.documentId === doc.id);
    const auditLogs =
      hasDocumentPermission(docUser.permissions, DOCUMENT_PERMISSIONS.AUDIT_VIEW) ||
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

    const categoryConfig = getDocumentCategoryConfig(doc.category, db.documentCategories) ?? null;

    return {
      document: doc,
      versions,
      attachments,
      comments,
      approvals,
      signatures,
      recipients,
      auditLogs,
      allowedActions,
      categoryConfig,
    };
  },

  createDraft(
    user: DocumentActor,
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
      moduleKey?: DmsModuleKey;
      originalFileName?: string | null;
      storagePath?: string | null;
      mimeType?: string | null;
      fileSizeBytes?: number;
      checksumSha256?: string | null;
      scanStatus?: 'VERIFIED_CLEAN' | 'QUARANTINED';
      description?: string;
      relatedEntityType?: string | null;
      relatedEntityId?: string | null;
      relatedStudentOrStaffId?: string | null;
      courseOrClass?: string | null;
      academicYear?: string;
      termLabel?: string;
      status?: DocumentWorkflowStatus;
    }
  ): DocumentRecord {
    const db = getDb();
    const docUser = toDocumentUser(user);
    const uploadCheck = canUploadToCategory(docUser, input.category);
    if (!uploadCheck.allowed) {
      throw new DocumentAccessError(403, uploadCheck.reason ?? 'Category permission denied.');
    }
    if (!isDocumentPolicyAllowedForCategory(input.category, input.confidentiality)) {
      throw new DocumentAccessError(
        400,
        `Confidentiality level ${input.confidentiality} is prohibited for category ${input.category}.`
      );
    }

    const catCfg = getDocumentCategoryConfig(input.category, db.documentCategories);
    const now = new Date().toISOString();
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isStudent = !isStaffDocumentRole(user.role);
    const resolvedEntityOwner = isStudent
      ? ('registrationNumber' in user && user.registrationNumber ? user.registrationNumber : user.id)
      : input.relatedStudentOrStaffId ?? user.id;

    // Drafts NEVER receive an official HCA/DOC reference number (assigned strictly on issuance)
    const doc: DocumentRecord = {
      id: docId,
      documentNumber: `DMS-${new Date().getFullYear()}-${String(db.documents.length + 1).padStart(4, '0')}`,
      referenceNumber: null,
      title: input.title,
      category: input.category,
      moduleKey: input.moduleKey ?? catCfg?.moduleKey ?? 'ADMIN_GOVERNANCE',
      originalFileName: input.originalFileName ?? null,
      storagePath: input.storagePath ?? null,
      mimeType: input.mimeType ?? null,
      fileSizeBytes: input.fileSizeBytes ?? 0,
      checksumSha256: input.checksumSha256 ?? null,
      scanStatus: input.scanStatus ?? 'VERIFIED_CLEAN',
      description: input.description,
      confidentiality: input.confidentiality,
      status: input.status ?? 'DRAFT',
      ownerId: user.id,
      ownerName: user.fullName,
      createdById: user.id,
      createdByName: user.fullName,
      uploadedByRole: user.role,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      relatedStudentOrStaffId: resolvedEntityOwner,
      departmentId: user.departmentId,
      departmentName: user.department,
      campusId: user.campusId,
      campusName: user.campus,
      courseOrClass: input.courseOrClass ?? null,
      academicYear: input.academicYear ?? String(new Date().getFullYear()),
      termLabel: input.termLabel ?? 'Term 1',
      recipientLabel: input.recipientLabel,
      recipientEmail: input.recipientEmail,
      subjectLine: input.subjectLine,
      bodyContent: input.bodyContent,
      metadataFields: input.metadataFields,
      design: input.design,
      templateId: input.templateId,
      currentVersion: 1,
      verificationHash: null,
      uploadedAt: now,
      retentionDate: computeRetentionIso(catCfg?.retentionDays ?? 2555),
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
      id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      documentId: doc.id,
      versionNumber: 1,
      title: doc.title,
      fileName: doc.originalFileName ?? null,
      storagePath: doc.storagePath ?? null,
      mimeType: doc.mimeType ?? null,
      fileSizeBytes: doc.fileSizeBytes ?? 0,
      checksumSha256: doc.checksumSha256 ?? null,
      subjectLine: doc.subjectLine,
      bodyContent: doc.bodyContent,
      metadataFields: doc.metadataFields,
      editedById: user.id,
      editedByName: user.fullName,
      changeNote: input.originalFileName
        ? `Uploaded initial file "${input.originalFileName}"`
        : 'Initial draft created',
      createdAt: now,
    });
    appendDocAudit(
      db,
      doc.id,
      user,
      input.originalFileName ? 'DOCUMENT_UPLOADED' : 'DRAFT_CREATED',
      `${input.originalFileName ? 'Uploaded' : 'Created'} "${doc.title}" (${doc.category} · ${doc.confidentiality}).`
    );
    saveDb(db);
    return doc;
  },

  uploadDocument(
    user: DocumentActor,
    input: {
      title: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      contentBase64?: string;
      category: DocumentCategory | string;
      confidentiality?: DocumentConfidentiality;
      recipientLabel: string;
      description?: string;
      moduleKey?: string;
      academicYear?: string;
      termLabel?: string;
      courseOrClass?: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
      relatedStudentOrStaffId?: string;
      submitNow?: boolean;
      requestId?: string;
    }
  ) {
    const db = getDb();
    const docUser = toDocumentUser(user);
    const normalizedCat = (normalizeDocumentCategoryCode(input.category) ??
      input.category) as DocumentCategory;
    const catCfg = getDocumentCategoryConfig(normalizedCat, db.documentCategories);
    if (!catCfg || !catCfg.active) {
      throw new DocumentAccessError(400, 'Selected document category does not exist or is disabled.');
    }

    const uploadPerm = canUploadToCategory(docUser, catCfg.code);
    if (!uploadPerm.allowed) {
      throw new DocumentAccessError(403, uploadPerm.reason ?? 'Upload category denied.');
    }

    const confidentiality = input.confidentiality ?? catCfg.defaultConfidentiality;
    if (!isDocumentPolicyAllowedForCategory(catCfg.code, confidentiality)) {
      throw new DocumentAccessError(
        400,
        `Confidentiality "${confidentiality}" cannot be applied to "${catCfg.name}".`
      );
    }

    // 1. Magic-byte, MIME, size & malware/script quarantine check
    const scan = validateAndScanUpload({
      fileName: input.fileName,
      mimeType: input.mimeType,
      declaredSizeBytes: input.sizeBytes,
      contentBase64: input.contentBase64,
      maxSizeMb: catCfg.maxSizeMb,
      allowedMimeTypes: catCfg.allowedMimeTypes,
    });

    if (!scan.ok) {
      appendDocAudit(
        db,
        'quarantine-event',
        user,
        'DOCUMENT_QUARANTINED',
        `Blocked upload "${input.fileName}" (${catCfg.code}): ${scan.error}`
      );
      saveDb(db);
      throw new DocumentAccessError(422, scan.error ?? 'File failed security validation.');
    }

    const academicYear = input.academicYear || String(new Date().getFullYear());
    const moduleKey = (input.moduleKey as DmsModuleKey) || catCfg.moduleKey;

    // 2. Persist binary strictly outside public/ inside .data/private-dms-storage
    const stored = savePrivateDocumentFile({
      academicYear,
      moduleKey,
      fileName: input.fileName,
      contentBase64: input.contentBase64,
      title: input.title,
    });

    const initialStatus: DocumentWorkflowStatus = input.submitNow
      ? 'SUBMITTED'
      : catCfg.approvalRequired
      ? 'UPLOADED'
      : 'APPROVED';

    const doc = this.createDraft(user, {
      title: input.title,
      category: catCfg.code as DocumentCategory,
      confidentiality,
      recipientLabel: input.recipientLabel || catCfg.name,
      subjectLine: `UPLOADED RECORD — ${input.fileName}`,
      bodyContent:
        input.description?.trim() ||
        `Uploaded institutional file "${input.fileName}" (${input.mimeType}, ${(
          scan.byteLength / 1024
        ).toFixed(1)} KB). Verified clean and integrity-hashed.`,
      metadataFields: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: String(scan.byteLength),
        checksumSha256: stored.checksumSha256,
        scanStatus: 'VERIFIED_CLEAN',
        moduleKey,
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
      moduleKey,
      originalFileName: input.fileName,
      storagePath: stored.storagePath,
      mimeType: input.mimeType,
      fileSizeBytes: scan.byteLength,
      checksumSha256: stored.checksumSha256,
      scanStatus: 'VERIFIED_CLEAN',
      description: input.description,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      relatedStudentOrStaffId: input.relatedStudentOrStaffId ?? null,
      courseOrClass: input.courseOrClass ?? null,
      academicYear,
      termLabel: input.termLabel ?? 'Term 1',
      status: initialStatus,
    });

    const freshDb = getDb();
    // 3. Bridge Absence Case upload directly to Student Absence Workflow
    if (input.relatedEntityType === 'ABSENCE_CASE' && input.relatedEntityId) {
      const absCase = freshDb.studentAbsenceCases.find((c) => c.id === input.relatedEntityId);
      if (absCase) {
        const isStudent = !isStaffDocumentRole(user.role);
        if (
          isStudent &&
          absCase.studentRegNo !== user.id &&
          absCase.studentRegNo !== ('registrationNumber' in user ? user.registrationNumber : null)
        ) {
          throw new DocumentAccessError(
            403,
            'Students can only attach absence evidence to their own absence cases.'
          );
        }
        freshDb.absenceEvidence.unshift({
          id: `abev-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          absenceCaseId: absCase.id,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSizeBytes: scan.byteLength,
          fileContentBase64: input.contentBase64 || Buffer.from(`DMS:${doc.id}`).toString('base64'),
          description: input.description?.trim() || input.title,
          isConfidentialMedical: confidentiality === 'RESTRICTED' || confidentiality === 'CONFIDENTIAL',
          uploadedById: user.id,
          uploadedByName: user.fullName,
          uploadedByRole: user.role,
          createdAt: new Date().toISOString(),
        });
        if (['AWAITING_EXPLANATION', 'EXPLANATION_SUBMITTED'].includes(absCase.status)) {
          absCase.status = 'DOCUMENT_SUBMITTED';
        }
        absCase.updatedAt = new Date().toISOString();
      }
    }

    // 4. Fulfill open Document Request if linked
    if (input.requestId) {
      const reqRecord = (freshDb.documentRequests ?? []).find((r) => r.id === input.requestId);
      if (reqRecord) {
        reqRecord.status = catCfg.approvalRequired ? 'SUBMITTED' : 'FULFILLED';
        reqRecord.fulfilledDocumentId = doc.id;
        reqRecord.updatedAt = new Date().toISOString();
      }
    }

    if (input.submitNow) {
      const targetDoc = freshDb.documents.find((d) => d.id === doc.id);
      if (targetDoc) {
        const reviewer = freshDb.staffAccounts.find(
          (s) =>
            s.id !== user.id &&
            s.documentPermissions.includes(DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE) &&
            canManageDocumentCategory(s.role, catCfg.code)
        ) ??
          freshDb.staffAccounts.find(
            (s) =>
              s.id !== user.id &&
              s.documentPermissions.includes(DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE)
          );
        if (reviewer) {
          freshDb.documentApprovals.push({
            id: `app-${Date.now()}`,
            documentId: targetDoc.id,
            stepOrder: 1,
            reviewerId: reviewer.id,
            reviewerName: reviewer.fullName,
            reviewerRole: reviewer.role,
            status: 'PENDING',
            comment: 'Submitted directly upon DMS upload.',
            decidedAt: null,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    saveDb(freshDb);
    return {
      document: doc,
      checksumSha256: stored.checksumSha256,
      scanStatus: 'VERIFIED_CLEAN',
    };
  },

  addNewVersion(
    user: DocumentActor,
    docId: string,
    input: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      contentBase64?: string;
      changeNote?: string;
    }
  ) {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'EDIT');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Version upload denied.');
    }

    const catCfg = getDocumentCategoryConfig(doc.category, db.documentCategories);
    const scan = validateAndScanUpload({
      fileName: input.fileName,
      mimeType: input.mimeType,
      declaredSizeBytes: input.sizeBytes,
      contentBase64: input.contentBase64,
      maxSizeMb: catCfg?.maxSizeMb ?? 15,
      allowedMimeTypes: catCfg?.allowedMimeTypes,
    });
    if (!scan.ok) {
      throw new DocumentAccessError(422, scan.error ?? 'Uploaded revision failed security check.');
    }

    const stored = savePrivateDocumentFile({
      academicYear: doc.academicYear || String(new Date().getFullYear()),
      moduleKey: doc.moduleKey || catCfg?.moduleKey || 'ADMIN_GOVERNANCE',
      fileName: input.fileName,
      contentBase64: input.contentBase64,
      title: doc.title,
    });

    const now = new Date().toISOString();
    doc.currentVersion += 1;
    doc.originalFileName = input.fileName;
    doc.storagePath = stored.storagePath;
    doc.mimeType = input.mimeType;
    doc.fileSizeBytes = scan.byteLength;
    doc.checksumSha256 = stored.checksumSha256;
    doc.scanStatus = 'VERIFIED_CLEAN';
    doc.updatedAt = now;

    const versionRecord = {
      id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      documentId: doc.id,
      versionNumber: doc.currentVersion,
      title: doc.title,
      fileName: input.fileName,
      storagePath: stored.storagePath,
      mimeType: input.mimeType,
      fileSizeBytes: scan.byteLength,
      checksumSha256: stored.checksumSha256,
      subjectLine: doc.subjectLine,
      bodyContent: doc.bodyContent,
      metadataFields: { ...doc.metadataFields, fileName: input.fileName, checksumSha256: stored.checksumSha256 },
      editedById: user.id,
      editedByName: user.fullName,
      changeNote: input.changeNote?.trim() || `Uploaded file revision v${doc.currentVersion}`,
      createdAt: now,
    };
    db.documentVersions.unshift(versionRecord);
    appendDocAudit(
      db,
      doc.id,
      user,
      'VERSION_UPLOADED',
      `Uploaded v${doc.currentVersion} ("${input.fileName}", SHA-256 ${stored.checksumSha256.slice(0, 12)}...).`
    );
    saveDb(db);
    return { document: doc, version: versionRecord };
  },

  addAttachment(
    user: DocumentActor,
    docId: string,
    input: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      contentBase64?: string;
    }
  ): DocumentAttachmentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'EDIT');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Attachment upload denied.');
    }

    const catCfg = getDocumentCategoryConfig(doc.category, db.documentCategories);
    const scan = validateAndScanUpload({
      fileName: input.fileName,
      mimeType: input.mimeType,
      declaredSizeBytes: input.sizeBytes,
      contentBase64: input.contentBase64,
      maxSizeMb: catCfg?.maxSizeMb ?? 15,
      allowedMimeTypes: catCfg?.allowedMimeTypes,
    });
    if (!scan.ok) {
      throw new DocumentAccessError(422, scan.error ?? 'Attachment quarantined.');
    }

    const stored = savePrivateDocumentFile({
      academicYear: doc.academicYear || String(new Date().getFullYear()),
      moduleKey: doc.moduleKey || catCfg?.moduleKey || 'ADMIN_GOVERNANCE',
      fileName: input.fileName,
      contentBase64: input.contentBase64,
      title: `${doc.title} attachment`,
    });

    const att: DocumentAttachmentRecord = {
      id: `datt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      documentId: doc.id,
      versionNumber: doc.currentVersion,
      fileName: input.fileName,
      storagePath: stored.storagePath,
      mimeType: input.mimeType,
      fileSizeBytes: scan.byteLength,
      checksumSha256: stored.checksumSha256,
      scanStatus: 'VERIFIED_CLEAN',
      uploadedById: user.id,
      uploadedByName: user.fullName,
      createdAt: new Date().toISOString(),
    };
    db.documentAttachments.unshift(att);
    appendDocAudit(db, doc.id, user, 'ATTACHMENT_ADDED', `Attached "${input.fileName}".`);
    saveDb(db);
    return att;
  },

  updateDraft(
    user: DocumentActor,
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

    if (
      patch.confidentiality !== undefined &&
      !isDocumentPolicyAllowedForCategory(doc.category, patch.confidentiality)
    ) {
      throw new DocumentAccessError(
        400,
        `Confidentiality "${patch.confidentiality}" is not allowed for ${doc.category}.`
      );
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
      fileName: doc.originalFileName ?? null,
      storagePath: doc.storagePath ?? null,
      mimeType: doc.mimeType ?? null,
      fileSizeBytes: doc.fileSizeBytes ?? 0,
      checksumSha256: doc.checksumSha256 ?? null,
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
    user: DocumentActor,
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
            canManageDocumentCategory(s.role, doc.category)
        ) ??
        db.staffAccounts.find(
          (s) =>
            s.id !== user.id &&
            s.documentPermissions.includes(DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE) &&
            (s.role === 'PRINCIPAL' || s.role === 'REGISTRAR' || s.role === 'HOD')
        ) ??
        db.staffAccounts.find((s) => s.id !== user.id);
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

  approveDocument(user: DocumentActor, docId: string, comment: string): DocumentRecord {
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
        reviewerRole: (user.role === 'UNCONFIGURED' ? 'ADMIN' : user.role) as DocumentApprovalRecord['reviewerRole'],
        status: 'APPROVED',
        comment: comment || 'Approved.',
        decidedAt: now,
        createdAt: now,
      });
    }

    doc.status = 'APPROVED';
    doc.approvalOfficerId = user.id;
    doc.approvalOfficerName = user.fullName;
    doc.approvalDate = now;
    doc.updatedAt = now;

    for (const reqItem of db.documentRequests ?? []) {
      if (reqItem.fulfilledDocumentId === doc.id) {
        reqItem.status = 'FULFILLED';
        reqItem.updatedAt = now;
      }
    }

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

  requestChanges(user: DocumentActor, docId: string, comment: string): DocumentRecord {
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

  rejectDocument(user: DocumentActor, docId: string, comment: string): DocumentRecord {
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
    doc.approvalOfficerId = user.id;
    doc.approvalOfficerName = user.fullName;
    doc.approvalDate = now;
    doc.updatedAt = now;
    appendDocAudit(db, doc.id, user, 'DOCUMENT_REJECTED', `Rejected document: "${comment}".`);
    saveDb(db);
    return doc;
  },

  verifyTransition(
    user: DocumentActor,
    docId: string,
    action: 'START_VERIFICATION' | 'APPROVE' | 'REJECT' | 'REQUIRES_CORRECTION' | 'MARK_EXPIRED',
    comment: string
  ): DocumentRecord {
    if (action === 'APPROVE') {
      return this.approveDocument(user, docId, comment);
    }
    if (action === 'REJECT') {
      return this.rejectDocument(user, docId, comment || 'Rejected during verification.');
    }
    if (action === 'REQUIRES_CORRECTION') {
      return this.requestChanges(user, docId, comment || 'Corrections required.');
    }

    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');
    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'APPROVE');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Verification access denied.');
    }

    doc.status = action === 'START_VERIFICATION' ? 'UNDER_VERIFICATION' : 'EXPIRED';
    doc.updatedAt = new Date().toISOString();
    appendDocAudit(db, doc.id, user, `VERIFICATION_${action}`, comment || `Status set to ${doc.status}.`);
    saveDb(db);
    return doc;
  },

  signDocument(user: DocumentActor, docId: string, signatureTitle: string): DocumentRecord {
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

  issueDocument(user: DocumentActor, docId: string): DocumentRecord {
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
    user: DocumentActor,
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

  issueSignedDownloadUrl(
    user: DocumentActor,
    docId: string,
    attachmentId?: string,
    versionNumber?: number
  ) {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'EXPORT');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Download permission denied.');
    }

    let fileName = doc.originalFileName || `${doc.referenceNumber || doc.id}.txt`;
    let mimeType = doc.mimeType || 'text/plain; charset=utf-8';
    if (attachmentId) {
      const att = (db.documentAttachments ?? []).find(
        (a) => a.id === attachmentId && a.documentId === doc.id
      );
      if (!att) throw new DocumentAccessError(404, 'Attachment not found.');
      fileName = att.fileName;
      mimeType = att.mimeType;
    } else if (versionNumber) {
      const ver = db.documentVersions.find(
        (v) => v.documentId === doc.id && v.versionNumber === versionNumber
      );
      if (!ver) throw new DocumentAccessError(404, 'Version not found.');
      fileName = ver.fileName || fileName;
      mimeType = ver.mimeType || mimeType;
    }

    const { token, expiresAt } = signDownloadToken({
      docId: doc.id,
      attachmentId,
      version: versionNumber,
      userId: user.id,
    });

    appendDocAudit(
      db,
      doc.id,
      user,
      'DOWNLOAD_URL_ISSUED',
      `Issued 5-minute HMAC signed download link for "${fileName}".`
    );
    saveDb(db);

    return {
      url: `/api/documents/download?token=${encodeURIComponent(token)}`,
      token,
      expiresAt,
      fileName,
      mimeType,
    };
  },

  streamAuthorizedDownload(token: string, actor?: DocumentActor | null) {
    const payload = verifyDownloadToken(token);
    if (!payload) {
      throw new DocumentAccessError(403, 'Download link is invalid or has expired.');
    }

    const db = getDb();
    const doc = db.documents.find((d) => d.id === payload.docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    if (actor) {
      if (actor.id !== payload.userId && actor.role !== 'REGISTRAR' && actor.role !== 'PRINCIPAL') {
        throw new DocumentAccessError(403, 'Signed download token belongs to another user.');
      }
      const check = canAccessDocument(toDocumentUser(actor), doc, db.documentRecipients, 'EXPORT');
      if (!check.allowed) {
        throw new DocumentAccessError(403, check.reason ?? 'Download denied.');
      }
    }

    let storagePath = doc.storagePath;
    let fileName = doc.originalFileName || `${doc.referenceNumber || doc.id}.txt`;
    let mimeType = doc.mimeType || 'text/plain; charset=utf-8';

    if (payload.attachmentId) {
      const att = (db.documentAttachments ?? []).find(
        (a) => a.id === payload.attachmentId && a.documentId === doc.id
      );
      if (!att) throw new DocumentAccessError(404, 'Attachment not found.');
      storagePath = att.storagePath;
      fileName = att.fileName;
      mimeType = att.mimeType;
    } else if (payload.version) {
      const ver = db.documentVersions.find(
        (v) => v.documentId === doc.id && v.versionNumber === payload.version
      );
      if (ver) {
        storagePath = ver.storagePath ?? storagePath;
        fileName = ver.fileName || fileName;
        mimeType = ver.mimeType || mimeType;
      }
    }

    let buffer = storagePath ? readPrivateDocumentFile(storagePath) : null;
    if (!buffer) {
      const textRecord = [
        'HI-TECH COLLEGE INTEGRATED ACADEMIC PORTAL — OFFICIAL DOCUMENT EXPORT',
        `Reference: ${doc.referenceNumber ?? doc.documentNumber ?? doc.id}`,
        `Title: ${doc.title}`,
        `Category: ${doc.category} (${doc.confidentiality})`,
        `Status: ${doc.status}`,
        `Subject: ${doc.subjectLine}`,
        '------------------------------------------------------------',
        doc.bodyContent,
      ].join('\n');
      buffer = Buffer.from(textRecord, 'utf8');
      mimeType = 'text/plain; charset=utf-8';
      if (!fileName.endsWith('.txt')) {
        fileName = `${fileName.replace(/\.[^.]+$/, '')}.txt`;
      }
    }

    const logActor = actor ?? {
      id: payload.userId,
      fullName: 'Verified Token Recipient',
      role: 'AUTHORIZED_RECIPIENT',
    };
    appendDocAudit(
      db,
      doc.id,
      logActor,
      'DOCUMENT_DOWNLOADED',
      `Downloaded "${fileName}" (${buffer.byteLength} bytes) via signed URL.`
    );
    saveDb(db);

    return { buffer, fileName, mimeType };
  },

  listComments(user: DocumentActor, docId: string): DocumentCommentRecord[] {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'VIEW');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Access denied.');
    }

    const staff = isStaffDocumentRole(user.role);
    return (db.documentComments ?? [])
      .filter((c) => c.documentId === doc.id && (staff || !c.isInternal))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  addComment(
    user: DocumentActor,
    docId: string,
    body: string,
    isInternal = false
  ): DocumentCommentRecord {
    const db = getDb();
    const doc = db.documents.find((d) => d.id === docId);
    if (!doc) throw new DocumentAccessError(404, 'Document not found.');

    const check = canAccessDocument(toDocumentUser(user), doc, db.documentRecipients, 'VIEW');
    if (!check.allowed) {
      throw new DocumentAccessError(403, check.reason ?? 'Access denied.');
    }

    const cleanBody = String(body || '').trim();
    if (cleanBody.length < 2) {
      throw new DocumentAccessError(400, 'Comment must be at least 2 characters.');
    }

    const comment: DocumentCommentRecord = {
      id: `dcmt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      documentId: doc.id,
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      body: cleanBody.slice(0, 1000),
      isInternal: isStaffDocumentRole(user.role) ? Boolean(isInternal) : false,
      createdAt: new Date().toISOString(),
    };
    db.documentComments.push(comment);
    appendDocAudit(
      db,
      doc.id,
      user,
      'COMMENT_ADDED',
      `Added ${comment.isInternal ? 'internal review note' : 'comment'}.`
    );
    saveDb(db);
    return comment;
  },

  archiveDocument(user: DocumentActor, docId: string): DocumentRecord {
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

  restoreDocument(user: DocumentActor, docId: string): DocumentRecord {
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

  revokeDocument(user: DocumentActor, docId: string, reason: string): DocumentRecord {
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
        (d.verificationHash && d.verificationHash.toUpperCase() === cleanRef) ||
        (d.documentNumber && d.documentNumber.toUpperCase() === cleanRef)
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

    return {
      verified: doc.status === 'ISSUED',
      status: doc.status,
      referenceNumber: doc.referenceNumber,
      verificationHash: doc.verificationHash,
      title:
        doc.confidentiality === 'CONFIDENTIAL' || doc.confidentiality === 'RESTRICTED'
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
    user: DocumentActor,
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

  listGlobalAuditLogs(user: DocumentActor) {
    const db = getDb();
    const docUser = toDocumentUser(user);
    if (!hasDocumentPermission(docUser.permissions, DOCUMENT_PERMISSIONS.AUDIT_VIEW)) {
      throw new DocumentAccessError(403, 'Audit log access requires documents.audit.view.');
    }
    return db.documentAuditLogs.filter((log) => {
      if (log.documentId === 'quarantine-event' || log.documentId === 'system-backup-check') {
        return true;
      }
      const doc = db.documents.find((d) => d.id === log.documentId);
      if (!doc) return false;
      return canAccessDocument(docUser, doc, db.documentRecipients, 'VIEW').allowed;
    });
  },

  // ── System Configuration, Categories, Retention & Backups (Admin / Principal / QA) ──
  listCategories(): DocumentCategoryConfig[] {
    return getDb().documentCategories;
  },

  updateCategoryConfig(
    user: DocumentActor,
    code: string,
    patch: {
      maxSizeMb?: number;
      approvalRequired?: boolean;
      active?: boolean;
      retentionDays?: number;
      defaultConfidentiality?: DocumentConfidentiality;
    }
  ): DocumentCategoryConfig {
    if (!hasDocumentPermission(user.documentPermissions, DOCUMENT_PERMISSIONS.CONFIG_MANAGE)) {
      throw new DocumentAccessError(403, 'Requires documents.config.manage permission.');
    }
    const db = getDb();
    const norm = normalizeDocumentCategoryCode(code) ?? code.toUpperCase();
    const cat = db.documentCategories.find((c) => c.code === norm);
    if (!cat) throw new DocumentAccessError(404, `Document category "${code}" not found.`);

    if (patch.maxSizeMb !== undefined) {
      cat.maxSizeMb = Math.max(1, Math.min(30, Math.round(patch.maxSizeMb)));
    }
    if (patch.approvalRequired !== undefined) cat.approvalRequired = Boolean(patch.approvalRequired);
    if (patch.active !== undefined) cat.active = Boolean(patch.active);
    if (patch.retentionDays !== undefined) {
      cat.retentionDays = Math.max(30, Math.min(36500, Math.round(patch.retentionDays)));
      const ret = db.documentRetentionPolicies.find((r) => r.categoryCode === cat.code);
      if (ret) {
        ret.retentionDays = cat.retentionDays;
        ret.updatedById = user.id;
        ret.updatedAt = new Date().toISOString();
      }
    }
    if (patch.defaultConfidentiality !== undefined) {
      if (!isDocumentPolicyAllowedForCategory(cat.code, patch.defaultConfidentiality)) {
        throw new DocumentAccessError(
          400,
          `Confidentiality ${patch.defaultConfidentiality} is disallowed for ${cat.code}.`
        );
      }
      cat.defaultConfidentiality = patch.defaultConfidentiality;
    }
    appendDocAudit(
      db,
      'system-config',
      user,
      'CATEGORY_CONFIG_UPDATED',
      `Updated DMS policy for ${cat.code} (maxSizeMb=${cat.maxSizeMb}MB, retentionDays=${cat.retentionDays}).`
    );
    saveDb(db);
    return cat;
  },

  listRetentionPolicies(): DocumentRetentionPolicyRecord[] {
    return getDb().documentRetentionPolicies;
  },

  updateRetentionPolicy(
    user: DocumentActor,
    categoryCode: string,
    patch: {
      retentionDays?: number;
      actionAfterExpiry?: 'ARCHIVE' | 'REVIEW' | 'SECURE_PURGE';
      active?: boolean;
    }
  ): DocumentRetentionPolicyRecord {
    if (!hasDocumentPermission(user.documentPermissions, DOCUMENT_PERMISSIONS.CONFIG_MANAGE)) {
      throw new DocumentAccessError(403, 'Requires documents.config.manage permission.');
    }
    const db = getDb();
    const norm = normalizeDocumentCategoryCode(categoryCode) ?? categoryCode.toUpperCase();
    const policy = db.documentRetentionPolicies.find((p) => p.categoryCode === norm);
    if (!policy) throw new DocumentAccessError(404, 'Retention policy not found.');

    if (patch.retentionDays !== undefined) {
      policy.retentionDays = Math.max(30, Math.min(36500, Math.round(patch.retentionDays)));
    }
    if (patch.actionAfterExpiry !== undefined) {
      policy.actionAfterExpiry = patch.actionAfterExpiry;
    }
    if (patch.active !== undefined) {
      policy.active = Boolean(patch.active);
    }
    policy.updatedById = user.id;
    policy.updatedAt = new Date().toISOString();
    saveDb(db);
    return policy;
  },

  listRequests(user: DocumentActor) {
    const db = getDb();
    const all = db.documentRequests ?? [];
    if (!isStaffDocumentRole(user.role)) {
      const regNo = 'registrationNumber' in user ? user.registrationNumber : null;
      return all.filter(
        (r) =>
          r.targetUserId === user.id ||
          (Boolean(regNo) && r.targetRegNo === regNo)
      );
    }
    if (
      user.role === 'ADMIN' ||
      user.role === 'PRINCIPAL' ||
      user.role === 'REGISTRAR' ||
      user.role === 'QUALITY_ASSURANCE'
    ) {
      return all;
    }
    return all.filter(
      (r) =>
        r.requestedById === user.id ||
        r.targetUserId === user.id ||
        canManageDocumentCategory(user.role as Parameters<typeof canManageDocumentCategory>[0], r.categoryCode)
    );
  },

  createDocumentRequest(
    user: DocumentActor,
    input: {
      targetUserId: string;
      targetUserName: string;
      targetRegNo?: string;
      targetRole?: string;
      categoryCode: string;
      title: string;
      instructions: string;
      dueDate?: string | null;
    }
  ): DocumentRequestRecord {
    if (!isStaffDocumentRole(user.role)) {
      throw new DocumentAccessError(403, 'Only authorized college officers may issue document requests.');
    }
    const db = getDb();
    const norm = normalizeDocumentCategoryCode(input.categoryCode) ?? input.categoryCode;
    const catCfg = getDocumentCategoryConfig(norm, db.documentCategories);
    if (!catCfg) throw new DocumentAccessError(400, 'Invalid request document category.');

    const now = new Date().toISOString();
    const reqRecord: DocumentRequestRecord = {
      id: `dreq-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      requestNumber: allocateDocumentRequestNumber(db),
      targetUserId: input.targetUserId,
      targetUserName: input.targetUserName,
      targetRegNo: input.targetRegNo ?? null,
      targetRole: input.targetRole ?? 'STUDENT',
      requestedById: user.id,
      requestedByName: user.fullName,
      requestedByRole: user.role,
      categoryCode: catCfg.code,
      moduleKey: catCfg.moduleKey,
      title: input.title.trim(),
      instructions: input.instructions.trim(),
      dueDate: input.dueDate ?? null,
      status: 'OPEN',
      fulfilledDocumentId: null,
      createdAt: now,
      updatedAt: now,
    };
    db.documentRequests.unshift(reqRecord);
    appendDocAudit(
      db,
      'document-requests',
      user,
      'DOCUMENT_REQUEST_CREATED',
      `Requested "${reqRecord.title}" (${reqRecord.requestNumber}) from ${reqRecord.targetUserName}.`
    );
    saveDb(db);
    return reqRecord;
  },

  runBackupIntegrityCheck(user: DocumentActor) {
    if (!hasDocumentPermission(user.documentPermissions, DOCUMENT_PERMISSIONS.CONFIG_MANAGE)) {
      throw new DocumentAccessError(403, 'Backup integrity verification requires documents.config.manage.');
    }
    const db = getDb();
    let storedFilesCount = 0;
    let verifiedCount = 0;
    let missingCount = 0;
    let mismatchCount = 0;
    let totalBytes = 0;

    for (const doc of db.documents) {
      if (!doc.storagePath) continue;
      storedFilesCount += 1;
      try {
        const abs = resolveSafeStoragePath(doc.storagePath);
        if (!fs.existsSync(abs)) {
          missingCount += 1;
          continue;
        }
        const buf = fs.readFileSync(abs);
        totalBytes += buf.byteLength;
        const sha = crypto.createHash('sha256').update(buf).digest('hex');
        if (doc.checksumSha256 && sha !== doc.checksumSha256) {
          mismatchCount += 1;
        } else {
          verifiedCount += 1;
        }
      } catch {
        missingCount += 1;
      }
    }

    const report = {
      checkedAt: new Date().toISOString(),
      checkedBy: user.fullName,
      totalDocumentRecords: db.documents.length,
      storedBinaryFiles: storedFilesCount,
      verifiedChecksums: verifiedCount,
      missingFiles: missingCount,
      checksumMismatches: mismatchCount,
      totalStoredBytes: totalBytes,
      status: missingCount === 0 && mismatchCount === 0 ? 'HEALTHY' : 'ATTENTION_REQUIRED',
    };

    appendDocAudit(
      db,
      'system-backup-check',
      user,
      'BACKUP_INTEGRITY_CHECK',
      `Verified ${verifiedCount}/${storedFilesCount} stored DMS files (status=${report.status}).`
    );
    saveDb(db);
    return report;
  },
};
