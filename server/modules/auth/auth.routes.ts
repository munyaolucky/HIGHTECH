import { Router, type NextFunction, type Request, type Response } from 'express';
import { requirePortalAuth } from '../../middleware/auth.ts';
import { AuthHttpError, authService } from './auth.service.ts';

const router = Router();

const authRateBuckets = new Map<string, number[]>();
function rateLimitAuth(maxPer15Min: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'local'}:${req.path}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const recent = (authRateBuckets.get(key) ?? []).filter((ts) => now - ts < windowMs);
    if (recent.length >= maxPer15Min) {
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please wait a few minutes before trying again.',
      });
      return;
    }
    recent.push(now);
    authRateBuckets.set(key, recent);
    next();
  };
}

function handleAuthError(res: Response, err: unknown) {
  if (err instanceof AuthHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Authentication request failed.';
  res.status(500).json({ success: false, error: message });
}

router.post('/login', rateLimitAuth(30), async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body ?? {};
    const result = await authService.loginWithCredentials(req, res, {
      identifier: String(identifier ?? ''),
      password: String(password ?? ''),
      rememberMe: Boolean(rememberMe),
    });
    res.json({ success: true, data: result });
  } catch (err) {
    handleAuthError(res, err);
  }
});

router.post('/firebase', rateLimitAuth(30), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const idToken = bearerToken || String(req.body?.idToken ?? '');
    const result = await authService.loginWithFirebaseToken(req, res, idToken);
    res.json({ success: true, data: result });
  } catch (err) {
    handleAuthError(res, err);
  }
});

router.get('/me', requirePortalAuth, (req, res) => {
  if (req.portalUser) {
    res.json({
      success: true,
      data: {
        authenticated: true,
        ...req.portalUser,
        staffPermissions: req.staffUser?.permissions ?? [],
        permissions: req.staffUser?.permissions ?? [],
        roleTitle: req.staffUser?.roleTitle ?? undefined,
        department: req.staffUser?.department ?? undefined,
        campus: req.staffUser?.campus ?? undefined,
      },
    });
    return;
  }
  if (req.staffUser) {
    res.json({
      success: true,
      data: {
        authenticated: true,
        uid: req.staffUser.id,
        email: req.staffUser.email,
        registrationNumber: req.staffUser.employeeNumber,
        fullName: req.staffUser.fullName,
        primaryRole: req.staffUser.role,
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
        requiresProfileCompletion: false,
        mfaEnabled: false,
        destination: '/portal/staff',
        campusId: req.staffUser.campusId,
        departmentId: req.staffUser.departmentId,
        roleTitle: req.staffUser.roleTitle,
        department: req.staffUser.department,
        campus: req.staffUser.campus,
        staffPermissions: req.staffUser.permissions,
        permissions: req.staffUser.permissions,
      },
    });
    return;
  }
  res.status(401).json({ success: false, error: 'Not authenticated.' });
});

router.post('/logout', async (req, res) => {
  try {
    await authService.logoutSession(req.portalUser?.sessionId ?? null, res);
    res.json({ success: true, data: { loggedOut: true } });
  } catch (err) {
    handleAuthError(res, err);
  }
});

router.post('/logout-all', requirePortalAuth, async (req, res) => {
  try {
    if (req.portalUser?.pgUserId) {
      await authService.logoutAllSessions(req.portalUser.pgUserId, res);
    } else {
      await authService.logoutSession(null, res);
    }
    res.json({ success: true, data: { loggedOutAll: true } });
  } catch (err) {
    handleAuthError(res, err);
  }
});

router.post('/password-recovery/request', rateLimitAuth(15), async (req, res) => {
  try {
    const identifier = String(req.body?.identifier ?? '');
    const result = await authService.requestPasswordRecovery(req, identifier);
    res.json({ success: true, data: result });
  } catch (err) {
    handleAuthError(res, err);
  }
});

router.post('/password-recovery/complete', rateLimitAuth(15), async (req, res) => {
  try {
    const token = String(req.body?.token ?? '');
    const newPassword = String(req.body?.newPassword ?? '');
    const result = await authService.completePasswordRecovery(req, token, newPassword);
    res.json({ success: true, data: result });
  } catch (err) {
    handleAuthError(res, err);
  }
});

router.post('/password/change', requirePortalAuth, async (req, res) => {
  try {
    if (!req.portalUser?.pgUserId) {
      throw new AuthHttpError(400, 'Password changes require an active user account.');
    }
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');
    const result = await authService.changePassword(
      req.portalUser.pgUserId,
      req.portalUser.sessionId,
      currentPassword,
      newPassword
    );
    res.json({ success: true, data: result });
  } catch (err) {
    handleAuthError(res, err);
  }
});

const handleCompleteProfile = async (req: Request, res: Response) => {
  try {
    if (!req.portalUser?.pgUserId) {
      throw new AuthHttpError(400, 'Profile completion requires an active portal session.');
    }
    const result = await authService.completeOnboardingProfile(req.portalUser.pgUserId, {
      fullName: req.body?.fullName,
      phoneNumber: req.body?.phoneNumber ?? req.body?.phone,
      address: req.body?.address,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    handleAuthError(res, err);
  }
};

router.post('/complete-profile', requirePortalAuth, handleCompleteProfile);
router.post('/profile/complete', requirePortalAuth, handleCompleteProfile);

export default router;
