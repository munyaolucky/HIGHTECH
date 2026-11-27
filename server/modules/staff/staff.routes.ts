import { Router } from 'express';

import {
  requireStaffPortalAuth,
  requirePermission,
} from '../../middleware/auth.ts';

import { staffController } from './staff.controller.ts';
import { STAFF_PERMISSIONS } from './staff.permissions.ts';

const router = Router();

// Session management
router.get(
  '/session',
  requireStaffPortalAuth,
  staffController.getSession
);

router.post(
  '/logout',
  staffController.logout
);

// Staff profile
router.get(
  '/me',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.PROFILE_VIEW),
  staffController.getMe
);

router.patch(
  '/me',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.PROFILE_UPDATE),
  staffController.patchMe
);

// Dashboard
router.get(
  '/dashboard/summary',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.DASHBOARD_VIEW),
  staffController.getDashboardSummary
);

// Tasks
router.get(
  '/tasks',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_VIEW),
  staffController.getTasks
);

router.post(
  '/tasks',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_UPDATE),
  staffController.createTask
);

router.patch(
  '/tasks/:id',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_UPDATE),
  staffController.updateTask
);

router.delete(
  '/tasks/:id',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.TASK_UPDATE),
  staffController.deleteTask
);

// Activity
router.get(
  '/activity',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.ACTIVITY_VIEW),
  staffController.getActivity
);

// Permissions
router.get(
  '/permissions',
  requireStaffPortalAuth,
  staffController.getPermissions
);

// Staff directory
router.get(
  '/directory',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.PROFILE_VIEW),
  staffController.getDirectory
);

// Administration
router.get(
  '/admin/overview',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_VIEW),
  staffController.getAdminOverview
);

router.post(
  '/admin/invitations',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_CREATE),
  staffController.createStaffInvitation
);

router.post(
  '/admin/students',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_CREATE),
  staffController.createStudentAccount
);

router.patch(
  '/admin/staff/:id/access',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.updateStaffAccess
);

router.post(
  '/admin/campuses',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.createCampus
);

router.post(
  '/admin/departments',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.createDepartment
);

router.post(
  '/admin/workflows/:id/decide',
  requireStaffPortalAuth,
  requirePermission(STAFF_PERMISSIONS.USERS_UPDATE),
  staffController.decideWorkflow
);

export default router;
