import type { Request, Response } from 'express';
import {
  validateCommentDecision,
  validateCreateDocument,
  validateCreateTemplate,
  validateShareDocument,
  validateSignDocument,
  validateSubmitDocument,
  validateUpdateDocument,
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

export const documentsController = {
  list(req: Request, res: Response): void {
    try {
      const data = documentsService.listDocuments(req.staffUser!, {
        view: req.query.view ? String(req.query.view) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        category: req.query.category ? String(req.query.category) : undefined,
        confidentiality: req.query.confidentiality
          ? String(req.query.confidentiality)
          : undefined,
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
      const data = documentsService.getDocumentDetail(req.staffUser!, String(req.params.id));
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
      const doc = documentsService.createDraft(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  upload(req: Request, res: Response): void {
    try {
      const body = req.body ?? {};
      const title = String(body.title ?? '').trim();
      const fileName = String(body.fileName ?? '').trim();
      const mimeType = String(body.mimeType ?? 'application/pdf').trim();
      const sizeBytes = Number(body.sizeBytes ?? 0);
      if (!title || !fileName) {
        res.status(400).json({ success: false, error: 'Document title and file name are required.' });
        return;
      }
      const result = documentsService.uploadDocument(req.staffUser!, {
        title,
        fileName,
        mimeType,
        sizeBytes,
        contentBase64: body.contentBase64 ? String(body.contentBase64) : undefined,
        category: body.category || 'OFFICIAL_MEMO',
        confidentiality: body.confidentiality || 'INTERNAL',
        recipientLabel: String(body.recipientLabel || 'Academic Registry'),
        description: body.description ? String(body.description) : undefined,
      });
      res.status(201).json({ success: true, data: result });
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
      const doc = documentsService.updateDraft(
        req.staffUser!,
        String(req.params.id),
        parsed.data
      );
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
      const doc = documentsService.submitForApproval(
        req.staffUser!,
        String(req.params.id),
        parsed.data
      );
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
      const doc = documentsService.approveDocument(
        req.staffUser!,
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
      const doc = documentsService.requestChanges(
        req.staffUser!,
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
      const doc = documentsService.rejectDocument(
        req.staffUser!,
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
      const doc = documentsService.signDocument(
        req.staffUser!,
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
      const doc = documentsService.issueDocument(req.staffUser!, String(req.params.id));
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
      const recipients = documentsService.shareDocument(
        req.staffUser!,
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
      const doc = documentsService.archiveDocument(req.staffUser!, String(req.params.id));
      res.json({ success: true, data: doc });
    } catch (err) {
      handleError(res, err);
    }
  },

  restore(req: Request, res: Response): void {
    try {
      const doc = documentsService.restoreDocument(req.staffUser!, String(req.params.id));
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
      const doc = documentsService.revokeDocument(
        req.staffUser!,
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
      const tpl = documentsService.createTemplate(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: tpl });
    } catch (err) {
      handleError(res, err);
    }
  },

  auditLogs(req: Request, res: Response): void {
    try {
      const logs = documentsService.listGlobalAuditLogs(req.staffUser!);
      res.json({ success: true, data: logs });
    } catch (err) {
      handleError(res, err);
    }
  },
};
