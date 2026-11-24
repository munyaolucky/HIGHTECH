import type { Request, Response } from 'express';
import { resolveSessionContextFromCookieHeader } from '../../middleware/auth.ts';
import { resolveDocumentActor } from './documents.policy.ts';
import {
  validateCommentDecision,
  validateCreateDocument,
  validateCreateTemplate,
  validateShareDocument,
  validateSignDocument,
  validateSubmitDocument,
  validateUpdateDocument,
  validateUploadDocument,
} from './documents.schemas.ts';
import { DocumentAccessError, documentsService } from './documents.service.ts';

function handleError(res: Response, err: unknown): void {
  if (err instanceof DocumentAccessError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  res.status(400).json({
    success: false,
    error: err instanceof Error ? err.message : 'Document operation failed.',
  });
}

function getActorOrThrow(req: Request) {
  const actor = resolveDocumentActor(req);
  if (!actor) {
    throw new DocumentAccessError(401, 'Authentication required.');
  }
  return actor;
}

export const documentsController = {
  list(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const data = documentsService.listDocuments(actor, {
        view: req.query.view ? String(req.query.view) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        category: req.query.category ? String(req.query.category) : undefined,
        moduleKey: req.query.moduleKey ? String(req.query.moduleKey) : undefined,
        confidentiality: req.query.confidentiality
          ? String(req.query.confidentiality)
          : undefined,
        relatedEntityType: req.query.relatedEntityType
          ? String(req.query.relatedEntityType)
          : undefined,
        relatedEntityId: req.query.relatedEntityId
          ? String(req.query.relatedEntityId)
          : undefined,
        academicYear: req.query.academicYear ? String(req.query.academicYear) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 12,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const data = documentsService.getDocumentDetail(actor, String(req.params.id));
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  create(req: Request, res: Response): void {
    const parsed = validateCreateDocument(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.createDraft(actor, parsed.data);
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  upload(req: Request, res: Response): void {
    const parsed = validateUploadDocument(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const result = documentsService.uploadDocument(actor, parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      handleError(res, err);
    }
  },

  uploadVersion(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const body = req.body ?? {};
      const fileName = String(body.fileName ?? '').trim();
      const mimeType = String(body.mimeType ?? 'application/pdf').trim();
      const sizeBytes = Number(body.sizeBytes ?? 0);
      if (!fileName) {
        res.status(400).json({ success: false, error: 'Revision file name is required.' });
        return;
      }
      const data = documentsService.addNewVersion(actor, String(req.params.id), {
        fileName,
        mimeType,
        sizeBytes,
        contentBase64: body.contentBase64 ? String(body.contentBase64) : undefined,
        changeNote: body.changeNote ? String(body.changeNote) : undefined,
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  addAttachment(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const body = req.body ?? {};
      const fileName = String(body.fileName ?? '').trim();
      const mimeType = String(body.mimeType ?? 'application/pdf').trim();
      const sizeBytes = Number(body.sizeBytes ?? 0);
      if (!fileName) {
        res.status(400).json({ success: false, error: 'Attachment file name is required.' });
        return;
      }
      const data = documentsService.addAttachment(actor, String(req.params.id), {
        fileName,
        mimeType,
        sizeBytes,
        contentBase64: body.contentBase64 ? String(body.contentBase64) : undefined,
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  issueDownloadUrl(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const attachmentId = req.query.attachmentId ? String(req.query.attachmentId) : undefined;
      const version = req.query.version ? Number(req.query.version) : undefined;
      const data = documentsService.issueSignedDownloadUrl(
        actor,
        String(req.params.id),
        attachmentId,
        version
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  async downloadSigned(req: Request, res: Response): Promise<void> {
    try {
      const token = String(req.query.token ?? '');
      const { staffUser, portalUser } = await resolveSessionContextFromCookieHeader(
        req.headers.cookie
      );
      if (staffUser) req.staffUser = staffUser;
      if (portalUser) req.portalUser = portalUser;
      const actor = resolveDocumentActor(req);
      const { buffer, fileName, mimeType } = documentsService.streamAuthorizedDownload(token, actor);
      res.setHeader('Content-Type', mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"`
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(buffer);
    } catch (err) {
      handleError(res, err);
    }
  },

  listComments(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const data = documentsService.listComments(actor, String(req.params.id));
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  addComment(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const body = req.body ?? {};
      const data = documentsService.addComment(
        actor,
        String(req.params.id),
        String(body.body ?? ''),
        Boolean(body.isInternal)
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  verifyTransition(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const body = req.body ?? {};
      const action = String(body.action ?? 'START_VERIFICATION').toUpperCase() as
        | 'START_VERIFICATION'
        | 'APPROVE'
        | 'REJECT'
        | 'REQUIRES_CORRECTION'
        | 'MARK_EXPIRED';
      const data = documentsService.verifyTransition(
        actor,
        String(req.params.id),
        action,
        String(body.comment ?? '')
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  update(req: Request, res: Response): void {
    const parsed = validateUpdateDocument(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.updateDraft(actor, String(req.params.id), parsed.data);
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  submit(req: Request, res: Response): void {
    const parsed = validateSubmitDocument(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.submitForApproval(actor, String(req.params.id), parsed.data);
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  approve(req: Request, res: Response): void {
    const parsed = validateCommentDecision(req.body, false);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.approveDocument(
        actor,
        String(req.params.id),
        parsed.data.comment
      );
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  requestChanges(req: Request, res: Response): void {
    const parsed = validateCommentDecision(req.body, true);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.requestChanges(
        actor,
        String(req.params.id),
        parsed.data.comment
      );
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  reject(req: Request, res: Response): void {
    const parsed = validateCommentDecision(req.body, true);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.rejectDocument(
        actor,
        String(req.params.id),
        parsed.data.comment
      );
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  sign(req: Request, res: Response): void {
    const parsed = validateSignDocument(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.signDocument(
        actor,
        String(req.params.id),
        parsed.data.signatureTitle
      );
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  issue(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.issueDocument(actor, String(req.params.id));
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  share(req: Request, res: Response): void {
    const parsed = validateShareDocument(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const recipients = documentsService.shareDocument(
        actor,
        String(req.params.id),
        parsed.data
      );
      res.json({ success: true, data: recipients });
    } catch (err) {
      handleError(res, err);
    }
  },

  archive(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.archiveDocument(actor, String(req.params.id));
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  restore(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.restoreDocument(actor, String(req.params.id));
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  revoke(req: Request, res: Response): void {
    const parsed = validateCommentDecision(req.body, true);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const doc = documentsService.revokeDocument(
        actor,
        String(req.params.id),
        parsed.data.comment
      );
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  verify(req: Request, res: Response): void {
    const result = documentsService.verifyByReference(String(req.params.ref ?? ''));
    res.json({ success: true, data: result });
  },

  listTemplates(_req: Request, res: Response): void {
    res.json({ success: true, data: documentsService.listTemplates() });
  },

  createTemplate(req: Request, res: Response): void {
    const parsed = validateCreateTemplate(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const actor = getActorOrThrow(req);
      const tpl = documentsService.createTemplate(actor, parsed.data);
      res.status(201).json({ success: true, data: tpl });
    } catch (err) {
      handleError(res, err);
    }
  },

  auditLogs(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const logs = documentsService.listGlobalAuditLogs(actor);
      res.json({ success: true, data: logs });
    } catch (err) {
      handleError(res, err);
    }
  },

  listCategories(_req: Request, res: Response): void {
    res.json({ success: true, data: documentsService.listCategories() });
  },

  updateCategory(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const updated = documentsService.updateCategoryConfig(
        actor,
        String(req.params.code),
        req.body ?? {}
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  listRetentionPolicies(_req: Request, res: Response): void {
    res.json({ success: true, data: documentsService.listRetentionPolicies() });
  },

  updateRetentionPolicy(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const updated = documentsService.updateRetentionPolicy(
        actor,
        String(req.params.code),
        req.body ?? {}
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  runBackupCheck(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const report = documentsService.runBackupIntegrityCheck(actor);
      res.json({ success: true, data: report });
    } catch (err) {
      handleError(res, err);
    }
  },

  listRequests(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const data = documentsService.listRequests(actor);
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  createRequest(req: Request, res: Response): void {
    try {
      const actor = getActorOrThrow(req);
      const body = req.body ?? {};
      const data = documentsService.createDocumentRequest(actor, {
        targetUserId: String(body.targetUserId ?? ''),
        targetUserName: String(body.targetUserName ?? ''),
        targetRegNo: body.targetRegNo ? String(body.targetRegNo) : undefined,
        targetRole: body.targetRole ? String(body.targetRole) : 'STUDENT',
        categoryCode: String(body.categoryCode ?? ''),
        title: String(body.title ?? ''),
        instructions: String(body.instructions ?? ''),
        dueDate: body.dueDate ? String(body.dueDate) : null,
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },
};
