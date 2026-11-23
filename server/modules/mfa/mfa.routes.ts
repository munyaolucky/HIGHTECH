import { Router, type Response } from 'express';
import { requirePortalAuth } from '../../middleware/auth.ts';
import { AuthHttpError } from '../auth/auth.service.ts';
import { mfaService } from './mfa.service.ts';

const router = Router();

function sendError(res: Response, err: unknown) {
  if (err instanceof AuthHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'MFA request failed.';
  res.status(500).json({ success: false, error: message });
}

router.post('/verify', async (req, res) => {
  try {
    const result = await mfaService.verifyChallenge(req, res, {
      challengeToken: String(req.body?.challengeToken ?? ''),
      code: String(req.body?.code ?? ''),
      method: (req.body?.method ?? 'TOTP') as 'TOTP' | 'BACKUP_CODE' | 'EMAIL_OTP',
      trustDevice: Boolean(req.body?.trustDevice),
    });
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/email-otp/send', async (req, res) => {
  try {
    const result = await mfaService.sendEmailOtpForChallenge(String(req.body?.challengeToken ?? ''));
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/status', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) throw new AuthHttpError(400, 'Portal user context required.');
    const result = await mfaService.getStatus(req.portalUser.pgUserId);
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/enroll/start', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) throw new AuthHttpError(400, 'Portal user context required.');
    const result = await mfaService.startEnrollment(req.portalUser.pgUserId);
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/enroll/confirm', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) throw new AuthHttpError(400, 'Portal user context required.');
    const result = await mfaService.confirmEnrollment(
      req.portalUser.pgUserId,
      String(req.body?.code ?? '')
    );
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/disable', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) throw new AuthHttpError(400, 'Portal user context required.');
    const result = await mfaService.disableMfa(
      req.portalUser.pgUserId,
      String(req.body?.currentPassword ?? '')
    );
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/backup-codes/regenerate', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) throw new AuthHttpError(400, 'Portal user context required.');
    const result = await mfaService.regenerateBackupCodes(
      req.portalUser.pgUserId,
      String(req.body?.currentPassword ?? '')
    );
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/devices', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) throw new AuthHttpError(400, 'Portal user context required.');
    const status = await mfaService.getStatus(req.portalUser.pgUserId);
    res.json({ success: true, data: status.trustedDevices });
  } catch (err) {
    sendError(res, err);
  }
});

router.delete('/devices/:id', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) throw new AuthHttpError(400, 'Portal user context required.');
    const result = await mfaService.revokeTrustedDevice(
      req.portalUser.pgUserId,
      String(req.params.id)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
