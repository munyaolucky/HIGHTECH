import { Router } from 'express';
import { requireAuth, requireDocumentPermission } from '../../middleware/auth.ts';
import { documentsController } from './documents.controller.ts';
import { DOCUMENT_PERMISSIONS } from './documents.permissions.ts';

const router = Router();

// Public-safe QR/reference authenticity check (returns metadata only, never confidential content)
router.get('/verify/:ref', documentsController.verify);

// Templates
router.get(
  '/templates',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.TEMPLATE_VIEW),
  documentsController.listTemplates
);
router.post(
  '/templates',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.TEMPLATE_MANAGE),
  documentsController.createTemplate
);

// Audit log view
router.get(
  '/audit',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.AUDIT_VIEW),
  documentsController.auditLogs
);

// Document CRUD & Lifecycle (each route guarded by explicit permission + resource policy)
router.get(
  '/',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.list
);
router.post(
  '/',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_CREATE),
  documentsController.create
);
router.post(
  '/upload',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_CREATE),
  documentsController.upload
);
router.get(
  '/:id',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.getById
);
router.patch(
  '/:id',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_EDIT),
  documentsController.update
);

router.post(
  '/:id/submit',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_SUBMIT),
  documentsController.submit
);
router.post(
  '/:id/approve',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE),
  documentsController.approve
);
router.post(
  '/:id/request-changes',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_REQUEST_CHANGES),
  documentsController.requestChanges
);
router.post(
  '/:id/reject',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_REJECT),
  documentsController.reject
);

router.post(
  '/:id/sign',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_SIGN),
  documentsController.sign
);
router.post(
  '/:id/issue',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_ISSUE),
  documentsController.issue
);
router.post(
  '/:id/share',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_SHARE),
  documentsController.share
);

router.post(
  '/:id/archive',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_ARCHIVE),
  documentsController.archive
);
router.post(
  '/:id/restore',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_RESTORE),
  documentsController.restore
);
router.post(
  '/:id/revoke',
  requireAuth,
  requireDocumentPermission(DOCUMENT_PERMISSIONS.DOCUMENT_REVOKE),
  documentsController.revoke
);

export default router;
