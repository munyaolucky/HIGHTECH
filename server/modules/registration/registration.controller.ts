import type { Request, Response } from 'express';
import {
  validateActivationConfirm,
  validateCommentBody,
  validateListFilters,
  validatePublicActivationCheck,
  validatePublicActivationComplete,
  validateRegistrationCreate,
  validateReviewDecision,
  validateRoleAssign,
  validateStatusReason,
} from './registration.schemas.ts';
import { registrationService } from './registration.service.ts';
import { RegistrationHttpError } from './registration.types.ts';

function handleError(res: Response, err: unknown): void {
  if (err instanceof RegistrationHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  res.status(500).json({
    success: false,
    error: err instanceof Error ? err.message : 'Registration operation failed.',
  });
}

export const registrationController = {
  getLookups(req: Request, res: Response): void {
    try {
      const data = registrationService.getLookups(req.staffUser!);
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  listWorkspace(req: Request, res: Response): void {
    try {
      const filters = validateListFilters(req.query as Record<string, unknown>);
      const data = registrationService.getWorkspaceOverview(req.staffUser!, filters);
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const data = registrationService.getById(req.staffUser!, String(req.params.id));
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  getHistory(req: Request, res: Response): void {
    try {
      const data = registrationService.getHistory(req.staffUser!, String(req.params.id));
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  checkDuplicates(req: Request, res: Response): void {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const email = typeof raw.email === 'string' ? raw.email : '';
    const phone = typeof raw.phone === 'string' ? raw.phone : '';
    const identificationNumber =
      typeof raw.identificationNumber === 'string'
        ? raw.identificationNumber
        : typeof raw.nationalId === 'string'
        ? raw.nationalId
        : undefined;
    const data = registrationService.checkDuplicates(email, phone, identificationNumber);
    res.json({ success: true, data });
  },

  listDuplicates(req: Request, res: Response): void {
    try {
      const data = registrationService.listDuplicateClusters(req.staffUser!);
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  },

  create(req: Request, res: Response): void {
    const parsed = validateRegistrationCreate(req.body);
    if (!parsed.ok) {
      res.status(400).json({
        success: false,
        error: parsed.error,
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }
    try {
      const record = registrationService.createRegistration(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      handleError(res, err);
    }
  },

  update(req: Request, res: Response): void {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const updated = registrationService.updateRegistration(
        req.staffUser!,
        String(req.params.id),
        body
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  submit(req: Request, res: Response): void {
    try {
      const submitted = registrationService.submitRegistration(
        req.staffUser!,
        String(req.params.id)
      );
      res.json({ success: true, data: submitted });
    } catch (err) {
      handleError(res, err);
    }
  },

  approve(req: Request, res: Response): void {
    const parsed = validateCommentBody(req.body, false);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = registrationService.reviewRegistration(
        req.staffUser!,
        String(req.params.id),
        { decision: 'APPROVED', comment: parsed.data.comments }
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  reject(req: Request, res: Response): void {
    const parsed = validateCommentBody(req.body, true);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = registrationService.reviewRegistration(
        req.staffUser!,
        String(req.params.id),
        { decision: 'REJECTED', comment: parsed.data.comments }
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  requestChanges(req: Request, res: Response): void {
    const parsed = validateCommentBody(req.body, true);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = registrationService.reviewRegistration(
        req.staffUser!,
        String(req.params.id),
        { decision: 'CHANGES_REQUESTED', comment: parsed.data.comments }
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  verifyDocument(req: Request, res: Response): void {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const docIndex = Number(raw.docIndex);
    const verified = Boolean(raw.verified);
    if (!Number.isInteger(docIndex) || docIndex < 0) {
      res.status(400).json({ success: false, error: 'Valid docIndex is required.' });
      return;
    }
    try {
      const updated = registrationService.verifySupportingDocument(
        req.staffUser!,
        String(req.params.id),
        docIndex,
        verified
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  review(req: Request, res: Response): void {
    const parsed = validateReviewDecision(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = registrationService.reviewRegistration(
        req.staffUser!,
        String(req.params.id),
        parsed.data
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  sendInvitation(req: Request, res: Response): void {
    try {
      const result = registrationService.sendInvitation(req.staffUser!, String(req.params.id));
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      handleError(res, err);
    }
  },

  completeActivation(req: Request, res: Response): void {
    const parsed = validateActivationConfirm(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const expectedId = req.params.id ? String(req.params.id) : undefined;
      const result = registrationService.completeActivation(req.staffUser!, parsed.data, expectedId);
      res.json({ success: true, data: result });
    } catch (err) {
      handleError(res, err);
    }
  },

  validatePublicActivation(req: Request, res: Response): void {
    const parsed = validatePublicActivationCheck(req.body);
    if (!parsed.ok) {
      res.status(200).json({
        valid: false,
        status: 'INVALID',
        message: parsed.error,
      });
      return;
    }
    try {
      const result = registrationService.validatePublicActivation(parsed.data.token);
      res.json(result);
    } catch (err) {
      handleError(res, err);
    }
  },

  completePublicActivation(req: Request, res: Response): void {
    const parsed = validatePublicActivationComplete(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const result = registrationService.completePublicActivation(
        parsed.data.token,
        parsed.data.password
      );
      res.json({ success: true, ...result });
    } catch (err) {
      handleError(res, err);
    }
  },

  assignRole(req: Request, res: Response): void {
    const parsed = validateRoleAssign(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = registrationService.assignRoleAndPermissions(
        req.staffUser!,
        String(req.params.id),
        parsed.data
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  suspend(req: Request, res: Response): void {
    const parsed = validateStatusReason(req.body, 'suspension');
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = registrationService.suspendRegistration(
        req.staffUser!,
        String(req.params.id),
        parsed.data.reason
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  archive(req: Request, res: Response): void {
    const parsed = validateStatusReason(req.body, 'archiving');
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = registrationService.archiveRegistration(
        req.staffUser!,
        String(req.params.id),
        parsed.data.reason
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      handleError(res, err);
    }
  },

  bulkValidate(req: Request, res: Response): void {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const csvText = typeof raw.csvText === 'string' ? raw.csvText : '';
    try {
      const result = registrationService.bulkImportCsv(req.staffUser!, csvText, false);
      res.json({ success: true, data: result });
    } catch (err) {
      handleError(res, err);
    }
  },

  bulkSubmit(req: Request, res: Response): void {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const csvText = typeof raw.csvText === 'string' ? raw.csvText : '';
    try {
      const result = registrationService.bulkImportCsv(req.staffUser!, csvText, true);
      res.json({ success: true, data: result });
    } catch (err) {
      handleError(res, err);
    }
  },

  bulkImport(req: Request, res: Response): void {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const csvText = typeof raw.csvText === 'string' ? raw.csvText : '';
    const commit = Boolean(raw.commit);
    try {
      const result = registrationService.bulkImportCsv(req.staffUser!, csvText, commit);
      res.json({ success: true, data: result });
    } catch (err) {
      handleError(res, err);
    }
  },

  exportCsv(req: Request, res: Response): void {
    try {
      const filters = validateListFilters(req.query as Record<string, unknown>);
      const csv = registrationService.exportAuthorizedCsv(req.staffUser!, filters);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="hitech-registrations.csv"');
      res.send(csv);
    } catch (err) {
      handleError(res, err);
    }
  },

  listAuditLogs(req: Request, res: Response): void {
    try {
      const logs = registrationService.listAuditLogs(req.staffUser!);
      res.json({ success: true, data: logs });
    } catch (err) {
      handleError(res, err);
    }
  },
};
