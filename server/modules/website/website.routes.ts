import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../staff/staff.permissions.ts';
import { websiteService } from './website.service.ts';

const router = Router();
router.use(requireAuth);

router.get(
  '/summary',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_CONTENT_VIEW),
  (_req, res) => {
    res.json({ success: true, data: websiteService.getCmsSummary() });
  }
);

router.get(
  '/staff',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_STAFF_VIEW),
  (req, res) => {
    const data = websiteService.listCmsStaff({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      departmentId: typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined,
    });
    res.json({ success: true, data });
  }
);

router.post(
  '/staff',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_STAFF_CREATE),
  (req, res) => {
    try {
      const created = websiteService.createStaffProfile(req.staffUser!, req.body ?? {});
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create staff profile.',
      });
    }
  }
);

router.patch(
  '/staff/:id',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_STAFF_EDIT),
  (req, res) => {
    try {
      const updated = websiteService.updateStaffProfile(
        req.staffUser!,
        String(req.params.id),
        req.body ?? {}
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to update staff profile.',
      });
    }
  }
);

router.post(
  '/staff/:id/submit',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_STAFF_EDIT),
  (req, res) => {
    try {
      const updated = websiteService.transitionStaffStatus(
        req.staffUser!,
        String(req.params.id),
        'SUBMIT'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.post(
  '/staff/:id/approve',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_CONTENT_APPROVE),
  (req, res) => {
    try {
      const updated = websiteService.transitionStaffStatus(
        req.staffUser!,
        String(req.params.id),
        'APPROVE'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.post(
  '/staff/:id/publish',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_STAFF_PUBLISH),
  (req, res) => {
    try {
      const updated = websiteService.transitionStaffStatus(
        req.staffUser!,
        String(req.params.id),
        'PUBLISH'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.post(
  '/staff/:id/archive',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_STAFF_ARCHIVE),
  (req, res) => {
    try {
      const updated = websiteService.transitionStaffStatus(
        req.staffUser!,
        String(req.params.id),
        'ARCHIVE'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.get(
  '/staff/export/csv',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_STAFF_VIEW),
  (req, res) => {
    const csv = websiteService.exportPublicDirectoryCsv(req.staffUser!);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hitech-public-staff-directory.csv"');
    res.send(csv);
  }
);

router.get(
  '/departments',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_DEPT_VIEW),
  (req, res) => {
    const data = websiteService.listCmsDepartments({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    });
    res.json({ success: true, data });
  }
);

router.post(
  '/departments',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_DEPT_CREATE),
  (req, res) => {
    try {
      const created = websiteService.createDepartment(req.staffUser!, req.body ?? {});
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create department.',
      });
    }
  }
);

router.patch(
  '/departments/:id',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_DEPT_EDIT),
  (req, res) => {
    try {
      const updated = websiteService.updateDepartment(
        req.staffUser!,
        String(req.params.id),
        req.body ?? {}
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to update department.',
      });
    }
  }
);

router.post(
  '/departments/:id/submit',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_DEPT_EDIT),
  (req, res) => {
    try {
      const updated = websiteService.transitionDepartmentStatus(
        req.staffUser!,
        String(req.params.id),
        'SUBMIT'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.post(
  '/departments/:id/approve',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_CONTENT_APPROVE),
  (req, res) => {
    try {
      const updated = websiteService.transitionDepartmentStatus(
        req.staffUser!,
        String(req.params.id),
        'APPROVE'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.post(
  '/departments/:id/publish',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_DEPT_PUBLISH),
  (req, res) => {
    try {
      const updated = websiteService.transitionDepartmentStatus(
        req.staffUser!,
        String(req.params.id),
        'PUBLISH'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.post(
  '/departments/:id/archive',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_DEPT_EDIT),
  (req, res) => {
    try {
      const updated = websiteService.transitionDepartmentStatus(
        req.staffUser!,
        String(req.params.id),
        'ARCHIVE'
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }
);

router.post(
  '/departments/:id/assign-staff',
  requirePermission(STAFF_PERMISSIONS.WEBSITE_DEPT_ASSIGN_STAFF),
  (req, res) => {
    try {
      const assignments = Array.isArray(req.body?.assignments) ? req.body.assignments : [];
      const result = websiteService.assignStaffToDepartment(
        req.staffUser!,
        String(req.params.id),
        assignments
      );
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to assign department staff.',
      });
    }
  }
);

export default router;
