import { Router, type NextFunction, type Request, type Response } from 'express';
import { requirePortalAuth } from '../../middleware/auth.ts';
import { documentsController } from './documents.controller.ts';
import { DOCUMENT_PERMISSIONS, type DocumentPermission } from './documents.permissions.ts';
import { resolveDocumentActor } from './documents.policy.ts';

function requireActorDocPermission(permission: DocumentPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const actor = resolveDocumentActor(req);
    if (!actor) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (!actor.documentPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Document permission denied: requires ${permission}.`,
      });
      return;
    }
    next();
  };
}

const router = Router();

// Public-safe QR/reference authenticity check (returns metadata only, never confidential content)
router.get('/verify/:ref', documentsController.verify);

// Signed time-limited HMAC download stream (enforces token validity + actor check when signed in)
router.get('/download', documentsController.downloadSigned);

// Categories, Retention Policies & System Config
router.get(
  '/config/categories',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.listCategories
);
router.patch(
  '/config/categories/:code',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.CONFIG_MANAGE),
  documentsController.updateCategory
);
router.get(
  '/config/retention',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.CONFIG_MANAGE),
  documentsController.listRetentionPolicies
);
router.patch(
  '/config/retention/:code',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.CONFIG_MANAGE),
  documentsController.updateRetentionPolicy
);
router.post(
  '/config/backup-check',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.CONFIG_MANAGE),
  documentsController.runBackupCheck
);

// Document Requests
router.get(
  '/requests',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.listRequests
);
router.post(
  '/requests',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_CREATE),
  documentsController.createRequest
);

// Templates
router.get(
  '/templates',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.TEMPLATE_VIEW),
  documentsController.listTemplates
);
router.post(
  '/templates',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.TEMPLATE_MANAGE),
  documentsController.createTemplate
);

// Audit log view
router.get(
  '/audit',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.AUDIT_VIEW),
  documentsController.auditLogs
);

// Document CRUD & Lifecycle (each route guarded by explicit permission + resource policy)
router.get(
  '/',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.list
);
router.post(
  '/',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_CREATE),
  documentsController.create
);
router.post(
  '/upload',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_CREATE),
  documentsController.upload
);
router.get(
  '/:id',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.getById
);
router.patch(
  '/:id',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_EDIT),
  documentsController.update
);

router.post(
  '/:id/versions',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_EDIT),
  documentsController.uploadVersion
);
router.post(
  '/:id/attachments',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_EDIT),
  documentsController.addAttachment
);
router.get(
  '/:id/download-url',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_EXPORT),
  documentsController.issueDownloadUrl
);
router.get(
  '/:id/comments',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.listComments
);
router.post(
  '/:id/comments',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_VIEW),
  documentsController.addComment
);
router.post(
  '/:id/verify',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE),
  documentsController.verifyTransition
);

router.post(
  '/:id/submit',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_SUBMIT),
  documentsController.submit
);
router.post(
  '/:id/approve',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_APPROVE),
  documentsController.approve
);
router.post(
  '/:id/request-changes',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_REQUEST_CHANGES),
  documentsController.requestChanges
);
router.post(
  '/:id/reject',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_REJECT),
  documentsController.reject
);

router.post(
  '/:id/sign',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_SIGN),
  documentsController.sign
);
router.post(
  '/:id/issue',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_ISSUE),
  documentsController.issue
);
router.post(
  '/:id/share',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_SHARE),
  documentsController.share
);

router.post(
  '/:id/archive',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_ARCHIVE),
  documentsController.archive
);
router.post(
  '/:id/restore',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_RESTORE),
  documentsController.restore
);
router.post(
  '/:id/revoke',
  requirePortalAuth,
  requireActorDocPermission(DOCUMENT_PERMISSIONS.DOCUMENT_REVOKE),
  documentsController.revoke
);

export default router;
