import crypto from 'node:crypto';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '../../../src/db/index.ts';
import {
  loginEvents,
  mfaChallenges,
  notificationDeliveries,
  notifications,
  passwordRecoveryTokens,
  studentProfiles,
  trustedDevices,
  userSessions,
  users,
} from '../../../src/db/schema.ts';
import { getOrCreateUser } from '../../../src/db/users.ts';
import { adminAuth } from '../../../src/lib/firebase-admin.ts';
import { getDb, saveDb } from '../../data/store.ts';
import {
  detectDeviceLabel,
  generateRandomToken,
  hashPasswordScrypt,
  hashTokenSha256,
  validatePasswordStrength,
  verifyPasswordScrypt,
} from '../../lib/crypto.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  clearSessionCookie,
  parseCookies,
  resolveDestinationForRole,
  setPortalSessionCookie,
  setSessionCookie,
} from '../../middleware/auth.ts';
import type { StaffRoleCode } from '../staff/staff.permissions.ts';

const PRIVILEGED_ROLES = new Set([
  'ADMIN',
  'PRINCIPAL',
  'FINANCE_OFFICER',
  'HR',
  'REGISTRAR',
  'EXAMINATIONS_OFFICER',
]);

export class AuthHttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function issueFullUserSession(
  res: Response,
  userRow: typeof users.$inferSelect,
  reqMeta: { ipAddress: string; userAgent: string; rememberMe: boolean }
) {
  const rawToken = generateRandomToken('HTC-SES', 32);
  const tokenHash = hashTokenSha256(rawToken);
  const sessionId = `ses-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const ttlMs = reqMeta.rememberMe ? 1000 * 60 * 60 * 24 * 14 : 1000 * 60 * 60 * 12;
  const expiresAt = new Date(Date.now() + ttlMs);

  await db.insert(userSessions).values({
    id: sessionId,
    userId: userRow.id,
    tokenHash,
    deviceLabel: detectDeviceLabel(reqMeta.userAgent),
    ipAddress: reqMeta.ipAddress,
    userAgent: reqMeta.userAgent.slice(0, 240),
    rememberMe: reqMeta.rememberMe,
    expiresAt,
  });

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userRow.id));

  setPortalSessionCookie(res, rawToken, reqMeta.rememberMe);

  // Also bind legacy staff cookie if account maps to a staff record
  const store = getDb();
  const matchedStaff = store.staffAccounts.find(
    (s) => s.id === userRow.uid || s.email.toLowerCase() === userRow.email.toLowerCase()
  );
  if (matchedStaff) {
    setSessionCookie(res, matchedStaff.id, matchedStaff.role);
  }

  return {
    sessionId,
    destination: resolveDestinationForRole(userRow.primaryRole),
    mfaPolicyRecommended: PRIVILEGED_ROLES.has(userRow.primaryRole) && !userRow.mfaEnabled,
    user: {
      uid: userRow.uid,
      email: userRow.email,
      registrationNumber: userRow.registrationNumber,
      fullName: userRow.fullName,
      primaryRole: userRow.primaryRole,
      mustChangePassword: userRow.mustChangePassword,
      requiresProfileCompletion: userRow.requiresProfileCompletion,
      mfaEnabled: userRow.mfaEnabled,
      campusId: userRow.campusId,
      departmentId: userRow.departmentId,
    },
  };
}

async function createSecurityNotification(
  userId: number,
  title: string,
  message: string,
  actionUrl = '/staff/security'
) {
  const notifId = `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  await db.insert(notifications).values({
    id: notifId,
    recipientUserId: userId,
    category: 'SECURITY',
    priority: 'HIGH',
    title,
    message,
    actionUrl,
    senderName: 'HI-TECH Security & Identity',
  });
  await db.insert(notificationDeliveries).values({
    id: `ndel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    notificationId: notifId,
    channel: 'IN_APP',
    status: 'DELIVERED',
  });
}

async function syncActivatedRegistrationIntoPg(identifier: string) {
  const store = getDb();
  const clean = identifier.trim().toLowerCase();
  const reg = store.registrations.find(
    (r) =>
      r.email.toLowerCase() === clean ||
      (r.registrationNumber && r.registrationNumber.toLowerCase() === clean)
  );
  if (!reg) return { reg, pgUser: null };
  if (reg.status !== 'ACTIVATED' || reg.portalAccessStatus !== 'ACTIVATED') {
    return { reg, pgUser: null };
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, reg.email.toLowerCase()))
    .limit(1);

  if (existing) return { reg, pgUser: existing };

  const [inserted] = await db
    .insert(users)
    .values({
      uid: reg.userAccountId ?? reg.id,
      email: reg.email.toLowerCase(),
      registrationNumber: reg.registrationNumber,
      fullName: reg.fullName,
      primaryRole: reg.assignedRole ?? reg.proposedRole,
      accountStatus: 'ACTIVE',
      passwordHash: reg.passwordHash ?? null,
      mustChangePassword: Boolean(reg.mustChangePasswordOnFirstLogin),
      requiresProfileCompletion: Boolean(reg.mustCompleteProfileOnFirstLogin),
      campusId: reg.campusId,
      departmentId: reg.departmentId,
    })
    .returning();

  return { reg, pgUser: inserted };
}

export const authService = {
  async loginWithCredentials(
    req: Request,
    res: Response,
    input: { identifier: string; password: string; rememberMe?: boolean }
  ) {
    await ensurePostgresSeeded();

    const identifier = input.identifier.trim();
    const password = input.password;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const deviceLabel = detectDeviceLabel(userAgent);

    if (!identifier || !password) {
      throw new AuthHttpError(400, 'Please enter your email or registration number and password.');
    }

    const cleanLower = identifier.toLowerCase();
    const cleanUpper = identifier.toUpperCase();

    // Check PostgreSQL first
    let [userRow] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, cleanLower), eq(users.registrationNumber, cleanUpper)))
      .limit(1);

    if (!userRow) {
      const synced = await syncActivatedRegistrationIntoPg(identifier);
      if (synced.reg && synced.reg.status !== 'ACTIVATED') {
        await db.insert(loginEvents).values({
          identifier,
          authMethod: 'PASSWORD',
          outcome: 'BLOCKED',
          failureReason: `ACCOUNT_STATUS_${synced.reg.status}`,
          ipAddress,
          deviceLabel,
        });
        throw new AuthHttpError(
          403,
          'Your account has not been activated yet. Please complete activation using your invitation link.'
        );
      }
      if (synced.pgUser) {
        userRow = synced.pgUser;
      }
    }

    if (!userRow) {
      await db.insert(loginEvents).values({
        identifier,
        authMethod: 'PASSWORD',
        outcome: 'FAILED',
        failureReason: 'INVALID_CREDENTIALS',
        ipAddress,
        deviceLabel,
      });
      throw new AuthHttpError(401, 'Invalid email/registration number or password.');
    }

    if (userRow.accountStatus !== 'ACTIVE') {
      await db.insert(loginEvents).values({
        userId: userRow.id,
        identifier,
        authMethod: 'PASSWORD',
        outcome: 'BLOCKED',
        failureReason: `ACCOUNT_${userRow.accountStatus}`,
        ipAddress,
        deviceLabel,
      });
      throw new AuthHttpError(
        403,
        userRow.accountStatus === 'INVITED'
          ? 'Your account is pending activation. Please check your invitation link.'
          : 'This account is currently suspended or disabled. Contact Institutional Administration.'
      );
    }

    if (!verifyPasswordScrypt(password, userRow.passwordHash)) {
      await db.insert(loginEvents).values({
        userId: userRow.id,
        identifier,
        authMethod: 'PASSWORD',
        outcome: 'FAILED',
        failureReason: 'WRONG_PASSWORD',
        ipAddress,
        deviceLabel,
      });
      throw new AuthHttpError(401, 'Invalid email/registration number or password.');
    }

    // Check MFA & Trusted Device
    if (userRow.mfaEnabled) {
      const cookies = parseCookies(req.headers.cookie);
      const trustedToken = cookies[TRUSTED_DEVICE_COOKIE_NAME];
      let deviceTrusted = false;

      if (trustedToken) {
        const deviceHash = hashTokenSha256(trustedToken);
        const [trusted] = await db
          .select()
          .from(trustedDevices)
          .where(
            and(
              eq(trustedDevices.userId, userRow.id),
              eq(trustedDevices.deviceTokenHash, deviceHash),
              isNull(trustedDevices.revokedAt),
              gt(trustedDevices.expiresAt, new Date())
            )
          )
          .limit(1);
        if (trusted) {
          deviceTrusted = true;
          await db
            .update(trustedDevices)
            .set({ lastUsedAt: new Date() })
            .where(eq(trustedDevices.id, trusted.id));
        }
      }

      if (!deviceTrusted) {
        const challengeToken = generateRandomToken('MFA', 24);
        const challengeHash = hashTokenSha256(challengeToken);
        await db.insert(mfaChallenges).values({
          id: `mfac-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          userId: userRow.id,
          challengeTokenHash: challengeHash,
          rememberMe: Boolean(input.rememberMe),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        await db.insert(loginEvents).values({
          userId: userRow.id,
          identifier,
          authMethod: 'PASSWORD',
          outcome: 'MFA_CHALLENGE',
          ipAddress,
          deviceLabel,
        });

        return {
          mfaRequired: true,
          challengeToken,
          methods: ['TOTP', 'EMAIL_OTP', 'BACKUP_CODE'],
          maskedEmail: userRow.email.replace(/(.{2}).+(@.+)/, '$1***$2'),
        };
      }
    }

    await db.insert(loginEvents).values({
      userId: userRow.id,
      identifier,
      authMethod: 'PASSWORD',
      outcome: 'SUCCESS',
      ipAddress,
      deviceLabel,
    });

    const sessionResult = await issueFullUserSession(res, userRow, {
      ipAddress,
      userAgent,
      rememberMe: Boolean(input.rememberMe),
    });

    return {
      mfaRequired: false,
      ...sessionResult,
    };
  },

  async loginWithFirebaseToken(req: Request, res: Response, idToken: string) {
    await ensurePostgresSeeded();

    if (!idToken) {
      throw new AuthHttpError(400, 'Missing Firebase ID token.');
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      throw new AuthHttpError(401, 'Invalid or expired Google Sign-In credential.');
    }

    const email = decoded.email;
    if (!email) {
      throw new AuthHttpError(400, 'Google account did not supply a verified email address.');
    }

    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const deviceLabel = detectDeviceLabel(userAgent);

    // Link to existing institutional user if email matches, otherwise create scoped user
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const userRow =
      existing ??
      (await getOrCreateUser(decoded.uid, email, {
        fullName: decoded.name || email.split('@')[0],
        primaryRole: 'STUDENT',
        accountStatus: 'ACTIVE',
      }));

    if (userRow.accountStatus !== 'ACTIVE') {
      throw new AuthHttpError(
        403,
        'This portal account is suspended or pending administrative activation.'
      );
    }

    await db.insert(loginEvents).values({
      userId: userRow.id,
      identifier: email,
      authMethod: 'GOOGLE',
      outcome: 'SUCCESS',
      ipAddress,
      deviceLabel,
    });

    const sessionResult = await issueFullUserSession(res, userRow, {
      ipAddress,
      userAgent,
      rememberMe: false,
    });

    return {
      mfaRequired: false,
      ...sessionResult,
    };
  },

  async requestPasswordRecovery(req: Request, identifier: string) {
    await ensurePostgresSeeded();

    const clean = identifier.trim();
    if (!clean) {
      throw new AuthHttpError(400, 'Please enter your email or registration number.');
    }

    const cleanLower = clean.toLowerCase();
    const cleanUpper = clean.toUpperCase();

    const [userRow] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, cleanLower), eq(users.registrationNumber, cleanUpper)))
      .limit(1);

    if (userRow && userRow.accountStatus === 'ACTIVE') {
      // Invalidate previous active recovery tokens for this user
      await db
        .update(passwordRecoveryTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordRecoveryTokens.userId, userRow.id),
            isNull(passwordRecoveryTokens.usedAt)
          )
        );

      const rawToken = generateRandomToken('REC', 24);
      const tokenHash = hashTokenSha256(rawToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.insert(passwordRecoveryTokens).values({
        userId: userRow.id,
        tokenHash,
        expiresAt,
        requestedIp: req.ip || '127.0.0.1',
      });

      await createSecurityNotification(
        userRow.id,
        'Password recovery requested',
        'A password recovery link valid for 15 minutes was requested for your account. If this was not you, revoke your active sessions immediately.',
        '/staff/security'
      );
    }

    // Strict anti-enumeration response — never leaks whether account exists or raw token
    return {
      message:
        'If an active HI-TECH College portal account matches those details, a single-use 15-minute password recovery link has been dispatched.',
    };
  },

  async completePasswordRecovery(req: Request, token: string, newPassword: string) {
    await ensurePostgresSeeded();

    if (!token.trim()) {
      throw new AuthHttpError(400, 'Recovery token is required.');
    }
    const strengthErr = validatePasswordStrength(newPassword);
    if (strengthErr) {
      throw new AuthHttpError(400, strengthErr);
    }

    const tokenHash = hashTokenSha256(token);
    const [tokenRow] = await db
      .select()
      .from(passwordRecoveryTokens)
      .where(eq(passwordRecoveryTokens.tokenHash, tokenHash))
      .limit(1);

    if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt.getTime() < Date.now()) {
      throw new AuthHttpError(
        400,
        'This password recovery link is invalid, expired, or has already been used.'
      );
    }

    const newHash = hashPasswordScrypt(newPassword);
    const now = new Date();

    await db
      .update(passwordRecoveryTokens)
      .set({ usedAt: now })
      .where(eq(passwordRecoveryTokens.id, tokenRow.id));

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: now,
      })
      .where(eq(users.id, tokenRow.userId));

    // Sync to JSON registration store if applicable
    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRow.userId))
      .limit(1);

    if (userRow) {
      const store = getDb();
      const reg = store.registrations.find(
        (r) => r.email.toLowerCase() === userRow.email.toLowerCase()
      );
      if (reg) {
        reg.passwordHash = newHash;
        reg.mustChangePasswordOnFirstLogin = false;
        reg.updatedAt = now.toISOString();
        saveDb(store);
      }

      // Revoke all existing sessions for security
      await db
        .update(userSessions)
        .set({ revokedAt: now })
        .where(and(eq(userSessions.userId, userRow.id), isNull(userSessions.revokedAt)));

      await db.insert(loginEvents).values({
        userId: userRow.id,
        identifier: userRow.email,
        authMethod: 'PASSWORD_RESET',
        outcome: 'SUCCESS',
        ipAddress: req.ip || '127.0.0.1',
        deviceLabel: detectDeviceLabel(req.headers['user-agent']),
      });

      await createSecurityNotification(
        userRow.id,
        'Password successfully reset',
        'Your HI-TECH College portal password was reset and all previous active sessions were signed out.',
        '/staff/security'
      );
    }

    return { message: 'Password updated successfully. You may now sign in with your new password.' };
  },

  async changePassword(
    pgUserId: number,
    currentSessionId: string | null,
    currentPassword: string,
    newPassword: string
  ) {
    await ensurePostgresSeeded();

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, pgUserId))
      .limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    if (!verifyPasswordScrypt(currentPassword, userRow.passwordHash)) {
      throw new AuthHttpError(401, 'Current password is incorrect.');
    }

    const strengthErr = validatePasswordStrength(newPassword);
    if (strengthErr) {
      throw new AuthHttpError(400, strengthErr);
    }

    const newHash = hashPasswordScrypt(newPassword);
    const now = new Date();

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: now,
      })
      .where(eq(users.id, userRow.id));

    // Sync to store registration if present
    const store = getDb();
    const reg = store.registrations.find(
      (r) => r.email.toLowerCase() === userRow.email.toLowerCase()
    );
    if (reg) {
      reg.passwordHash = newHash;
      reg.mustChangePasswordOnFirstLogin = false;
      reg.updatedAt = now.toISOString();
      saveDb(store);
    }

    // Revoke other active sessions
    const sessions = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userRow.id), isNull(userSessions.revokedAt)));
    for (const s of sessions) {
      if (s.id !== currentSessionId) {
        await db.update(userSessions).set({ revokedAt: now }).where(eq(userSessions.id, s.id));
      }
    }

    await createSecurityNotification(
      userRow.id,
      'Account password changed',
      'Your HI-TECH College portal password was changed. Other active sessions were signed out.',
      '/staff/security'
    );

    return { message: 'Password changed successfully.' };
  },

  async completeOnboardingProfile(
    pgUserId: number,
    input: { phoneNumber?: string; address?: string; fullName?: string }
  ) {
    await ensurePostgresSeeded();

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, pgUserId))
      .limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    const now = new Date();
    await db
      .update(users)
      .set({
        fullName: input.fullName?.trim() || userRow.fullName,
        requiresProfileCompletion: false,
        updatedAt: now,
      })
      .where(eq(users.id, userRow.id));

    await db
      .update(studentProfiles)
      .set({
        phoneNumber: input.phoneNumber?.trim() || undefined,
        address: input.address?.trim() || undefined,
        profileCompleted: true,
        updatedAt: now,
      })
      .where(eq(studentProfiles.userId, userRow.id));

    return { completed: true };
  },

  async logoutSession(sessionId: string | null, res: Response) {
    if (sessionId) {
      await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.id, sessionId));
    }
    clearSessionCookie(res);
  },

  async logoutAllSessions(pgUserId: number, res: Response) {
    await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(userSessions.userId, pgUserId), isNull(userSessions.revokedAt)));
    clearSessionCookie(res);
  },

  getStaffRoleCodes(): StaffRoleCode[] {
    return [
      'ADMIN',
      'PRINCIPAL',
      'REGISTRAR',
      'FINANCE_OFFICER',
      'HR',
      'LECTURER',
      'LIBRARIAN',
      'IT_SUPPORT',
      'HOD',
      'ADMISSIONS_OFFICER',
      'EXAMINATIONS_OFFICER',
      'QUALITY_ASSURANCE',
      'STUDENT_AFFAIRS',
      'HOSTEL_OFFICER',
      'ICT_TECHNICIAN',
      'PROCUREMENT_OFFICER',
      'STORES_OFFICER',
      'COMMUNICATIONS_OFFICER',
      'RECEPTIONIST',
      'SECURITY_OFFICER',
      'TRANSPORT_OFFICER',
    ];
  },
};
