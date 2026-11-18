import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.ts';
import { staffController } from './staff.controller.ts';
import { STAFF_PERMISSIONS } from './staff.permissions.ts';

const router = Router();

// Session synchronization (binds authenticated HttpOnly cookie)
router.post('/session', staffController.switchSession);
router.post('/logout', staffController.logout);
router.get('/session', requireAuth, staffController.getSession);

// Core Staff Portal API Contract
router.get(
  '/me',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.PROFILE_VIEW),
  staffController.getMe
);

router.patch(
  '/me',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.PROFILE_UPDATE),
  staffController.patchMe
);

router.get(
  '/dashboard/summary',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.DASHBOARD_VIEW),
  staffController.getDashboardSummary
);

router.get(
  '/tasks',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_VIEW),
  staffController.getTasks
);

router.post(
  '/tasks',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_UPDATE),
  staffController.createTask
);

router.patch(
  '/tasks/:id',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_UPDATE),
  staffController.updateTask
);

router.delete(
  '/tasks/:id',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_UPDATE),
  staffController.deleteTask
);

router.get(
  '/activity',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.ACTIVITY_VIEW),
  staffController.getActivity
);

router.get('/permissions', requireAuth, staffController.getPermissions);

router.get(
  '/directory',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.PROFILE_VIEW),
  staffController.getDirectory
);

// Administrator Governance Endpoints (strict RBAC gated)
router.get(
  '/admin/overview',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_VIEW),
  staffController.getAdminOverview
);

router.post(
  '/admin/invitations',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_CREATE),
  staffController.createStaffInvitation
);

router.post(
  '/admin/students',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_CREATE),
  staffController.createStudentAccount
);

router.patch(
  '/admin/staff/:id/access',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.updateStaffAccess
);

router.post(
  '/admin/campuses',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.createCampus
);

router.post(
  '/admin/departments',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.createDepartment
);

router.post(
  '/admin/workflows/:id/decide',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.decideWorkflow
);

export default router;
