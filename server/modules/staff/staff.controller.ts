import type { Request, Response } from 'express';
import { clearSessionCookie } from '../../middleware/auth.ts';
import {
  validateCampusCreate,
  validateDepartmentCreate,
  validatePaginationQuery,
  validateProfilePatch,
  validateStaffAccessUpdate,
  validateStaffInvitation,
  validateStudentCreate,
  validateTaskCreate,
  validateTaskUpdate,
  validateWorkflowDecision,
} from './staff.schemas.ts';
import { staffService } from './staff.service.ts';

export const staffController = {
  getSession(req: Request, res: Response): void {
    const staff = req.staffUser;

    if (!staff) {
      res.status(401).json({
        success: false,
        error: 'Staff authentication required.',
      });
      return;
    }

    res.json({
      success: true,
      data: staffService.getProfile(staff),
      permissions: staff.permissions,
      documentPermissions: staff.documentPermissions,
      registrationPermissions: staff.registrationPermissions,
    });
  },

  logout(_req: Request, res: Response): void {
    clearSessionCookie(res);

    res.json({
      success: true,
      message: 'Portal session cookies cleared.',
    });
  },

  getMe(req: Request, res: Response): void {
    res.json({
      success: true,
      data: staffService.getProfile(req.staffUser!),
    });
  },

  patchMe(req: Request, res: Response): void {
    const parsed = validateProfilePatch(req.body);
    if (!parsed.ok) {
      res.status(400).json({
        success: false,
        error: parsed.error,
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }
    try {
      const updated = staffService.updateOwnProfile(req.staffUser!, parsed.data);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to update profile.',
      });
    }
  },

  getDashboardSummary(req: Request, res: Response): void {
    const summary = staffService.getDashboardSummary(req.staffUser!);
    res.json({ success: true, data: summary });
  },

  getTasks(req: Request, res: Response): void {
    const q = validatePaginationQuery(req.query as Record<string, unknown>);
    const data = staffService.listTasks(req.staffUser!, q);
    res.json({ success: true, data });
  },

  createTask(req: Request, res: Response): void {
    const parsed = validateTaskCreate(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const task = staffService.createTask(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: task });
    } catch (err) {
      res.status(403).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create task.',
      });
    }
  },

  updateTask(req: Request, res: Response): void {
    const parsed = validateTaskUpdate(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    const updated = staffService.updateTaskStatus(
      req.staffUser!,
      String(req.params.id),
      parsed.data.status
    );
    if (!updated) {
      res.status(404).json({ success: false, error: 'Task not found in your scope.' });
      return;
    }
    res.json({ success: true, data: updated });
  },

  deleteTask(req: Request, res: Response): void {
    const removed = staffService.deleteTask(req.staffUser!, String(req.params.id));
    if (!removed) {
      res.status(404).json({ success: false, error: 'Task not found in your scope.' });
      return;
    }
    res.json({ success: true });
  },

  getActivity(req: Request, res: Response): void {
    const q = validatePaginationQuery(req.query as Record<string, unknown>);
    const data = staffService.listActivity(req.staffUser!, q);
    res.json({ success: true, data });
  },

  getPermissions(req: Request, res: Response): void {
    res.json({
      success: true,
      data: {
        role: req.staffUser!.role,
        permissions: req.staffUser!.permissions,
        documentPermissions: req.staffUser!.documentPermissions,
        registrationPermissions: req.staffUser!.registrationPermissions,
      },
    });
  },

  getDirectory(req: Request, res: Response): void {
    const q = validatePaginationQuery(req.query as Record<string, unknown>);
    const data = staffService.listDirectory(req.staffUser!, q);
    res.json({ success: true, data });
  },

  // ---------------- Admin Governance Controllers ----------------

  getAdminOverview(req: Request, res: Response): void {
    const data = staffService.getAdminOverview(req.staffUser!);
    res.json({ success: true, data });
  },

  createStaffInvitation(req: Request, res: Response): void {
    const parsed = validateStaffInvitation(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const result = staffService.createStaffInvitation(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create invitation.',
      });
    }
  },

  createStudentAccount(req: Request, res: Response): void {
    const parsed = validateStudentCreate(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const student = staffService.createStudentAccount(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: student });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create student account.',
      });
    }
  },

  updateStaffAccess(req: Request, res: Response): void {
    const parsed = validateStaffAccessUpdate(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const updated = staffService.updateStaffAccess(
        req.staffUser!,
        String(req.params.id),
        parsed.data
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to update staff access.',
      });
    }
  },

  createCampus(req: Request, res: Response): void {
    const parsed = validateCampusCreate(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const campus = staffService.createCampus(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: campus });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create campus.',
      });
    }
  },

  createDepartment(req: Request, res: Response): void {
    const parsed = validateDepartmentCreate(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const department = staffService.createDepartment(req.staffUser!, parsed.data);
      res.status(201).json({ success: true, data: department });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create department.',
      });
    }
  },

  decideWorkflow(req: Request, res: Response): void {
    const parsed = validateWorkflowDecision(req.body);
    if (!parsed.ok) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }
    try {
      const wf = staffService.decideWorkflow(
        req.staffUser!,
        String(req.params.id),
        parsed.data
      );
      res.json({ success: true, data: wf });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to decide workflow.',
      });
    }
  },
};
