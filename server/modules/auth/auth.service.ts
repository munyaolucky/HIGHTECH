import crypto from 'node:crypto';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '../../../src/db/index.ts';
import {
  authSecurityAuditLogs,
  emailVerificationTokens,
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
  generateNumericOtp,
  generateRandomToken,
  hashEmailVerificationCode,
  hashPasswordScrypt,
  hashTokenSha256,
  validatePasswordStrength,
  verifyPasswordScrypt,
  verifyTimingSafeHex,
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

export const EMAIL_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const EMAIL_OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const EMAIL_OTP_MAX_ATTEMPTS = 5;
export const EMAIL_OTP_WINDOW_MS = 30 * 60 * 1000;
export const EMAIL_OTP_MAX_SENDS_PER_WINDOW = 5;

export function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, Math.max(2, local.length - 2)))}@${domain}`;
}

export class AuthHttpError extends Error {
  statusCode: number;
  code?: string;
  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

type EmailOtpTestObserver = (payload: {
  userId: number;
  email: string;
  code: string;
  expiresAt: Date;
}) => void;

let emailOtpObserver: EmailOtpTestObserver | null = null;

export function setEmailOtpObserverForTests(observer: EmailOtpTestObserver | null): void {
  emailOtpObserver = observer;
}

export function serializePortalUser(userRow: typeof users.$inferSelect) {
  return {
    uid: userRow.uid,
    email: userRow.email,
    registrationNumber: userRow.registrationNumber,
    fullName: userRow.fullName,
    primaryRole: userRow.primaryRole,
    accountStatus: userRow.accountStatus,
    mustChangePassword: userRow.mustChangePassword,
    passwordChangedAt: userRow.passwordChangedAt ? userRow.passwordChangedAt.toISOString() : null,
    emailVerified: Boolean(userRow.emailVerifiedAt),
    emailVerifiedAt: userRow.emailVerifiedAt ? userRow.emailVerifiedAt.toISOString() : null,
    emailVerificationRequired: userRow.emailVerificationRequired,
    requiresProfileCompletion: userRow.requiresProfileCompletion,
    mfaEnabled: userRow.mfaEnabled,
    campusId: userRow.campusId,
    departmentId: userRow.departmentId,
  };
}

export function resolveSecurityRedirect(userRow: typeof users.$inferSelect): string {
  if (userRow.mustChangePassword) return '/portal/change-password';
  if (userRow.emailVerificationRequired && !userRow.emailVerifiedAt) {
    return '/portal/verify-email';
  }
  if (userRow.requiresProfileCompletion) return '/portal/complete-profile';
  return resolveDestinationForRole(userRow.primaryRole);
}

async function recordSecurityAudit(params: {
  userId?: number | null;
  actorUid?: string | null;
  email: string;
  eventType: string;
  detail: string;
  req?: Request;
}) {
  await db.insert(authSecurityAuditLogs).values({
    userId: params.userId ?? null,
    actorUid: params.actorUid ?? null,
    email: params.email.toLowerCase(),
    eventType: params.eventType,
    detail: params.detail,
    ipAddress: params.req?.ip || '127.0.0.1',
    userAgent: String(params.req?.headers['user-agent'] || '').slice(0, 240),
  });
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
    securityRedirect: resolveSecurityRedirect(userRow),
    mfaPolicyRecommended: PRIVILEGED_ROLES.has(userRow.primaryRole) && !userRow.mfaEnabled,
    user: serializePortalUser(userRow),
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
      emailVerifiedAt: null,
      emailVerificationRequired: true,
      requiresProfileCompletion: Boolean(reg.mustCompleteProfileOnFirstLogin),
      campusId: reg.campusId,
      departmentId: reg.departmentId,
    })
    .returning();

  return { reg, pgUser: inserted };
}

async function dispatchEmailVerificationCodeInternal(
  userRow: typeof users.$inferSelect,
  req: Request | undefined,
  options: { isResend: boolean; skipCooldownIfActive?: boolean }
) {
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - EMAIL_OTP_WINDOW_MS);

  const recentTokens = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.userId, userRow.id),
        gt(emailVerificationTokens.createdAt, windowCutoff)
      )
    )
    .orderBy(desc(emailVerificationTokens.createdAt));

  const latestToken = recentTokens[0];
  if (latestToken) {
    const elapsedMs = now.getTime() - latestToken.createdAt.getTime();
    if (elapsedMs < EMAIL_OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((EMAIL_OTP_COOLDOWN_MS - elapsedMs) / 1000);
      if (options.skipCooldownIfActive && !latestToken.usedAt && latestToken.expiresAt > now) {
        return {
          alreadyActive: true,
          email: userRow.email,
          maskedEmail: maskEmailAddress(userRow.email),
          expiresInSeconds: Math.max(1, Math.ceil((latestToken.expiresAt.getTime() - now.getTime()) / 1000)),
          cooldownSeconds: waitSeconds,
          message: 'A 6-digit verification code has already been sent to your registered email address.',
        };
      }
      throw new AuthHttpError(
        429,
        `Please wait ${waitSeconds} seconds before requesting another verification code.`,
        'OTP_COOLDOWN_ACTIVE'
      );
    }

    if (recentTokens.length >= EMAIL_OTP_MAX_SENDS_PER_WINDOW) {
      throw new AuthHttpError(
        429,
        'Too many verification code requests. Please wait 30 minutes before trying again.',
        'OTP_RATE_LIMITED'
      );
    }
  }

  // Invalidate any previous unused OTPs for this user
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(emailVerificationTokens.userId, userRow.id),
        isNull(emailVerificationTokens.usedAt)
      )
    );

  const rawCode = generateNumericOtp(6);
  const codeHash = hashEmailVerificationCode(userRow.id, rawCode);
  const expiresAt = new Date(now.getTime() + EMAIL_OTP_TTL_MS);
  const nextResendCount = latestToken ? latestToken.resendCount + (options.isResend ? 1 : 0) : 0;

  await db.insert(emailVerificationTokens).values({
    userId: userRow.id,
    email: userRow.email.toLowerCase(),
    codeHash,
    expiresAt,
    attempts: 0,
    resendCount: nextResendCount,
    requestedIp: req?.ip || '127.0.0.1',
  });

  await recordSecurityAudit({
    userId: userRow.id,
    actorUid: userRow.uid,
    email: userRow.email,
    eventType: options.isResend ? 'EMAIL_OTP_RESENT' : 'EMAIL_OTP_SENT',
    detail: `Issued 6-digit email verification OTP expiring in 10 minutes (hashed at rest).`,
    req,
  });

  await createSecurityNotification(
    userRow.id,
    'Email verification code sent',
    `A 6-digit verification code valid for 10 minutes was dispatched to ${maskEmailAddress(userRow.email)}.`,
    '/portal/verify-email'
  );

  if (emailOtpObserver) {
    emailOtpObserver({
      userId: userRow.id,
      email: userRow.email,
      code: rawCode,
      expiresAt,
    });
  }

  return {
    sent: true,
    email: userRow.email,
    maskedEmail: maskEmailAddress(userRow.email),
    expiresInSeconds: Math.round(EMAIL_OTP_TTL_MS / 1000),
    cooldownSeconds: Math.round(EMAIL_OTP_COOLDOWN_MS / 1000),
    message: `A 6-digit verification code has been sent to ${maskEmailAddress(userRow.email)}.`,
  };
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
        userRow.accountStatus === 'INVITED' || userRow.accountStatus === 'PENDING_ACTIVATION'
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
          maskedEmail: maskEmailAddress(userRow.email),
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

    // If user already passed temporary password change (or was created without temp password)
    // and still needs email verification, prepare an OTP automatically unless cooldown active.
    if (!userRow.mustChangePassword && userRow.emailVerificationRequired && !userRow.emailVerifiedAt) {
      await dispatchEmailVerificationCodeInternal(userRow, req, {
        isResend: false,
        skipCooldownIfActive: true,
      }).catch(() => undefined);
    }

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
    const verifiedFromGoogle = Boolean(decoded.email_verified);

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
        emailVerifiedAt: verifiedFromGoogle ? new Date() : null,
        emailVerificationRequired: !verifiedFromGoogle,
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

      await recordSecurityAudit({
        userId: userRow.id,
        actorUid: userRow.uid,
        email: userRow.email,
        eventType: 'PASSWORD_RECOVERY_REQUESTED',
        detail: 'Single-use 15-minute password recovery token issued (hashed at rest).',
        req,
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
        passwordChangedAt: now,
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

      await recordSecurityAudit({
        userId: userRow.id,
        actorUid: userRow.uid,
        email: userRow.email,
        eventType: 'PASSWORD_RECOVERY_COMPLETED',
        detail: 'Password updated via single-use recovery token and all existing sessions revoked.',
        req,
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
    newPassword: string,
    req?: Request,
    res?: Response
  ) {
    await ensurePostgresSeeded();

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, pgUserId))
      .limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    if (!verifyPasswordScrypt(currentPassword, userRow.passwordHash)) {
      await recordSecurityAudit({
        userId: userRow.id,
        actorUid: userRow.uid,
        email: userRow.email,
        eventType: 'PASSWORD_CHANGE_FAILED',
        detail: 'Rejected password change because current/temporary password did not match.',
        req,
      });
      throw new AuthHttpError(401, 'Current or temporary password is incorrect.');
    }

    const strengthErr = validatePasswordStrength(newPassword);
    if (strengthErr) {
      throw new AuthHttpError(400, strengthErr);
    }

    if (verifyPasswordScrypt(newPassword, userRow.passwordHash)) {
      throw new AuthHttpError(
        400,
        'Your new password must be different from your temporary or current password.'
      );
    }

    const wasFirstLoginChange = userRow.mustChangePassword;
    const newHash = hashPasswordScrypt(newPassword);
    const now = new Date();

    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        passwordChangedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userRow.id))
      .returning();

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

    // Revoke all old active sessions; if res is available, rotate into a clean fresh session
    await db
      .update(userSessions)
      .set({ revokedAt: now })
      .where(
        and(
          eq(userSessions.userId, userRow.id),
          isNull(userSessions.revokedAt)
        )
      );

    let rotatedSessionId = currentSessionId;
    if (res && req) {
      const rotated = await issueFullUserSession(res, updatedUser, {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: String(req.headers['user-agent'] || ''),
        rememberMe: false,
      });
      rotatedSessionId = rotated.sessionId;
    } else if (currentSessionId) {
      // Keep current session active when called without HTTP response context
      await db
        .update(userSessions)
        .set({ revokedAt: null })
        .where(eq(userSessions.id, currentSessionId));
    }

    await recordSecurityAudit({
      userId: userRow.id,
      actorUid: userRow.uid,
      email: userRow.email,
      eventType: wasFirstLoginChange ? 'FIRST_LOGIN_PASSWORD_CHANGED' : 'PASSWORD_CHANGED',
      detail: wasFirstLoginChange
        ? 'Completed mandatory first-login temporary password replacement and invalidated prior sessions.'
        : 'Updated portal password and invalidated prior sessions.',
      req,
    });

    await createSecurityNotification(
      userRow.id,
      'Account password changed',
      'Your HI-TECH College portal password was updated and previous active sessions were invalidated.',
      '/staff/security'
    );

    const needsEmailVerification =
      updatedUser.emailVerificationRequired && !updatedUser.emailVerifiedAt;
    if (needsEmailVerification) {
      await dispatchEmailVerificationCodeInternal(updatedUser, req, {
        isResend: false,
        skipCooldownIfActive: true,
      }).catch(() => undefined);
    }

    const nextStep = needsEmailVerification
      ? 'VERIFY_EMAIL'
      : updatedUser.requiresProfileCompletion
      ? 'COMPLETE_PROFILE'
      : 'DASHBOARD';

    return {
      message: needsEmailVerification
        ? 'Password updated. Please verify your email address using the 6-digit code sent to you.'
        : 'Password changed successfully.',
      nextStep,
      destination: resolveSecurityRedirect(updatedUser),
      requiresEmailVerification: needsEmailVerification,
      requiresProfileCompletion: updatedUser.requiresProfileCompletion,
      sessionId: rotatedSessionId,
      user: serializePortalUser(updatedUser),
    };
  },

  async sendEmailVerification(pgUserId: number, req?: Request, options?: { isResend?: boolean }) {
    await ensurePostgresSeeded();

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, pgUserId))
      .limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    if (userRow.emailVerifiedAt && !userRow.emailVerificationRequired) {
      return {
        alreadyVerified: true,
        email: userRow.email,
        maskedEmail: maskEmailAddress(userRow.email),
        emailVerifiedAt: userRow.emailVerifiedAt.toISOString(),
        destination: resolveSecurityRedirect(userRow),
        message: 'Your email address is already verified.',
      };
    }

    return dispatchEmailVerificationCodeInternal(userRow, req, {
      isResend: Boolean(options?.isResend),
      skipCooldownIfActive: !options?.isResend,
    });
  },

  async verifyEmailOtp(pgUserId: number, rawCode: string, req?: Request) {
    await ensurePostgresSeeded();

    const normalizedCode = rawCode.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new AuthHttpError(400, 'Enter the 6-digit numeric verification code.');
    }

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, pgUserId))
      .limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    if (userRow.emailVerifiedAt && !userRow.emailVerificationRequired) {
      return {
        verified: true,
        emailVerifiedAt: userRow.emailVerifiedAt.toISOString(),
        destination: resolveSecurityRedirect(userRow),
        nextStep: userRow.requiresProfileCompletion ? 'COMPLETE_PROFILE' : 'DASHBOARD',
        user: serializePortalUser(userRow),
        message: 'Your email address is already verified.',
      };
    }

    const [latestToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, userRow.id),
          isNull(emailVerificationTokens.usedAt)
        )
      )
      .orderBy(desc(emailVerificationTokens.createdAt))
      .limit(1);

    if (!latestToken) {
      throw new AuthHttpError(
        400,
        'No active verification code found. Please request a new 6-digit code.',
        'OTP_NOT_FOUND'
      );
    }

    const now = new Date();
    if (latestToken.expiresAt.getTime() < now.getTime()) {
      await db
        .update(emailVerificationTokens)
        .set({ usedAt: now })
        .where(eq(emailVerificationTokens.id, latestToken.id));
      await recordSecurityAudit({
        userId: userRow.id,
        actorUid: userRow.uid,
        email: userRow.email,
        eventType: 'EMAIL_VERIFY_FAILED',
        detail: 'Verification failed because 6-digit OTP expired (10-minute window exceeded).',
        req,
      });
      throw new AuthHttpError(
        400,
        'This verification code has expired. Please resend a fresh 6-digit code.',
        'OTP_EXPIRED'
      );
    }

    if (latestToken.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      await db
        .update(emailVerificationTokens)
        .set({ usedAt: now })
        .where(eq(emailVerificationTokens.id, latestToken.id));
      throw new AuthHttpError(
        429,
        'Too many invalid attempts for this verification code. Please resend a new 6-digit code.',
        'OTP_ATTEMPTS_EXCEEDED'
      );
    }

    const candidateHash = hashEmailVerificationCode(userRow.id, normalizedCode);
    if (!verifyTimingSafeHex(latestToken.codeHash, candidateHash)) {
      const nextAttempts = latestToken.attempts + 1;
      const lockedOut = nextAttempts >= EMAIL_OTP_MAX_ATTEMPTS;
      await db
        .update(emailVerificationTokens)
        .set({
          attempts: nextAttempts,
          ...(lockedOut ? { usedAt: now } : {}),
        })
        .where(eq(emailVerificationTokens.id, latestToken.id));

      await recordSecurityAudit({
        userId: userRow.id,
        actorUid: userRow.uid,
        email: userRow.email,
        eventType: 'EMAIL_VERIFY_FAILED',
        detail: `Invalid 6-digit email verification code entered (attempt ${nextAttempts}/${EMAIL_OTP_MAX_ATTEMPTS}).`,
        req,
      });

      if (lockedOut) {
        throw new AuthHttpError(
          429,
          'Maximum verification attempts reached. Please resend a new 6-digit code.',
          'OTP_ATTEMPTS_EXCEEDED'
        );
      }

      const remaining = EMAIL_OTP_MAX_ATTEMPTS - nextAttempts;
      throw new AuthHttpError(
        400,
        `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        'OTP_INVALID'
      );
    }

    await db
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(eq(emailVerificationTokens.id, latestToken.id));

    const [updatedUser] = await db
      .update(users)
      .set({
        emailVerifiedAt: now,
        emailVerificationRequired: false,
        updatedAt: now,
      })
      .where(eq(users.id, userRow.id))
      .returning();

    await recordSecurityAudit({
      userId: userRow.id,
      actorUid: userRow.uid,
      email: userRow.email,
      eventType: 'EMAIL_VERIFIED',
      detail: 'Email address verified via 6-digit OTP.',
      req,
    });

    await createSecurityNotification(
      userRow.id,
      'Email address verified',
      'Your HI-TECH College email address has been verified successfully.',
      resolveDestinationForRole(userRow.primaryRole)
    );

    const nextStep = updatedUser.mustChangePassword
      ? 'CHANGE_PASSWORD'
      : updatedUser.requiresProfileCompletion
      ? 'COMPLETE_PROFILE'
      : 'DASHBOARD';

    return {
      verified: true,
      emailVerifiedAt: now.toISOString(),
      nextStep,
      destination: resolveSecurityRedirect(updatedUser),
      user: serializePortalUser(updatedUser),
      message: 'Email verified successfully. Redirecting to your portal workspace.',
    };
  },

  async getSecurityStatus(pgUserId: number) {
    await ensurePostgresSeeded();

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, pgUserId))
      .limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    const activeSessions = await db
      .select({ id: userSessions.id })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, pgUserId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date())
        )
      );

    const [latestOtp] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, pgUserId))
      .orderBy(desc(emailVerificationTokens.createdAt))
      .limit(1);

    const nowMs = Date.now();
    const cooldownRemainingSeconds = latestOtp
      ? Math.max(0, Math.ceil((latestOtp.createdAt.getTime() + EMAIL_OTP_COOLDOWN_MS - nowMs) / 1000))
      : 0;

    return {
      ...serializePortalUser(userRow),
      maskedEmail: maskEmailAddress(userRow.email),
      destination: resolveDestinationForRole(userRow.primaryRole),
      securityRedirect: resolveSecurityRedirect(userRow),
      activeSessionsCount: activeSessions.length,
      cooldownRemainingSeconds,
      otpExpiresAt:
        latestOtp && !latestOtp.usedAt && latestOtp.expiresAt.getTime() > nowMs
          ? latestOtp.expiresAt.toISOString()
          : null,
    };
  },

  async listSecurityAuditLogs(limit = 50) {
    await ensurePostgresSeeded();
    const safeLimit = Math.min(200, Math.max(1, limit));
    const rows = await db
      .select()
      .from(authSecurityAuditLogs)
      .orderBy(desc(authSecurityAuditLogs.createdAt))
      .limit(safeLimit);

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      actorUid: row.actorUid,
      email: row.email,
      eventType: row.eventType,
      detail: row.detail,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
    }));
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

    if (userRow.mustChangePassword) {
      throw new AuthHttpError(
        403,
        'Change your temporary password before completing your profile.',
        'PASSWORD_CHANGE_REQUIRED'
      );
    }
    if (userRow.emailVerificationRequired && !userRow.emailVerifiedAt) {
      throw new AuthHttpError(
        403,
        'Verify your email address before completing your profile.',
        'EMAIL_VERIFICATION_REQUIRED'
      );
    }

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
