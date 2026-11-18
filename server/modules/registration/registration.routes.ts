import { Router, type NextFunction, type Request, type Response } from 'express';
import { requireAuth, requireRegistrationPermission } from '../../middleware/auth.ts';
import { registrationController } from './registration.controller.ts';
import { REGISTRATION_PERMISSIONS } from './registration.permissions.ts';

const router = Router();

const activationRateBuckets = new Map<string, number[]>();
function activationRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'local';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const recent = (activationRateBuckets.get(ip) ?? []).filter((ts) => now - ts < windowMs);
  if (recent.length >= 40) {
    res.status(429).json({
      success: false,
      error: 'Too many activation attempts. Please wait a few minutes and try again.',
    });
    return;
  }
  recent.push(now);
  activationRateBuckets.set(ip, recent);
  next();
}

// Public single-use activation endpoints (unauthenticated by design; protected by token hash & rate limiter)
router.post('/activation/validate', activationRateLimiter, registrationController.validatePublicActivation);
router.post('/activation/complete', activationRateLimiter, registrationController.completePublicActivation);

router.use(requireAuth);

router.get(
  '/lookups',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.VIEW),
  registrationController.getLookups
);

router.get(
  '/',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.VIEW),
  registrationController.listWorkspace
);

router.get(
  '/duplicates',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.VIEW),
  registrationController.listDuplicates
);

router.post(
  '/duplicates/check',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.VIEW),
  registrationController.checkDuplicates
);

router.get(
  '/export',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.EXPORT),
  registrationController.exportCsv
);

router.get(
  '/audit',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.AUDIT_VIEW),
  registrationController.listAuditLogs
);

router.post(
  '/bulk/validate',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.IMPORT),
  registrationController.bulkValidate
);

router.post(
  '/bulk/submit',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.IMPORT),
  registrationController.bulkSubmit
);

router.post(
  '/bulk-import',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.IMPORT),
  registrationController.bulkImport
);

router.post(
  '/invitations/activate',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.ACTIVATE),
  registrationController.completeActivation
);

router.get(
  '/:id',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.VIEW),
  registrationController.getById
);

router.get(
  '/:id/history',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.VIEW),
  registrationController.getHistory
);

router.post(
  '/',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.CREATE),
  registrationController.create
);

router.patch(
  '/:id',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.EDIT),
  registrationController.update
);

router.post(
  '/:id/submit',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.SUBMIT),
  registrationController.submit
);

router.post(
  '/:id/approve',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.APPROVE),
  registrationController.approve
);

router.post(
  '/:id/reject',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.REJECT),
  registrationController.reject
);

router.post(
  '/:id/request-changes',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.APPROVE),
  registrationController.requestChanges
);

router.post(
  '/:id/verify-document',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.VIEW),
  registrationController.verifyDocument
);

router.post(
  '/:id/review',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.APPROVE),
  registrationController.review
);

router.post(
  '/:id/invite',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.INVITATION_SEND),
  registrationController.sendInvitation
);

router.post(
  '/:id/resend-invite',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.INVITATION_SEND),
  registrationController.sendInvitation
);

router.post(
  '/:id/activate',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.ACTIVATE),
  registrationController.completeActivation
);

router.post(
  '/:id/assign-role',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.ROLES_ASSIGN),
  registrationController.assignRole
);

router.post(
  '/:id/suspend',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.SUSPEND),
  registrationController.suspend
);

router.post(
  '/:id/archive',
  requireRegistrationPermission(REGISTRATION_PERMISSIONS.ARCHIVE),
  registrationController.archive
);

export default router;
