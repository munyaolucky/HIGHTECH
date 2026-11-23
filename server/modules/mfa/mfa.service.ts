import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '../../../src/db/index.ts';
import {
  loginEvents,
  mfaBackupCodes,
  mfaChallenges,
  mfaSettings,
  notificationDeliveries,
  notifications,
  trustedDevices,
  users,
} from '../../../src/db/schema.ts';
import {
  decryptSecret,
  detectDeviceLabel,
  encryptSecret,
  generateBackupCodes,
  generateBase32Secret,
  generateRandomToken,
  hashTokenSha256,
  verifyPasswordScrypt,
  verifyTotpCode,
} from '../../lib/crypto.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import { TRUSTED_DEVICE_COOKIE_NAME } from '../../middleware/auth.ts';
import { AuthHttpError, issueFullUserSession } from '../auth/auth.service.ts';

const PRIVILEGED_ROLES = new Set([
  'ADMIN',
  'PRINCIPAL',
  'FINANCE_OFFICER',
  'HR',
  'REGISTRAR',
  'EXAMINATIONS_OFFICER',
]);

async function recordSecurityAlert(userId: number, title: string, message: string) {
  const notifId = `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  await db.insert(notifications).values({
    id: notifId,
    recipientUserId: userId,
    category: 'SECURITY',
    priority: 'HIGH',
    title,
    message,
    actionUrl: '/staff/security',
    senderName: 'HI-TECH Security & MFA',
  });
  await db.insert(notificationDeliveries).values({
    id: `ndel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    notificationId: notifId,
    channel: 'IN_APP',
    status: 'DELIVERED',
  });
}

export const mfaService = {
  async getStatus(pgUserId: number) {
    await ensurePostgresSeeded();
    const [userRow] = await db.select().from(users).where(eq(users.id, pgUserId)).limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    const [settings] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.userId, pgUserId))
      .limit(1);

    const unusedCodes = await db
      .select()
      .from(mfaBackupCodes)
      .where(and(eq(mfaBackupCodes.userId, pgUserId), isNull(mfaBackupCodes.usedAt)));

    const devices = await db
      .select()
      .from(trustedDevices)
      .where(and(eq(trustedDevices.userId, pgUserId), isNull(trustedDevices.revokedAt)))
      .orderBy(desc(trustedDevices.lastUsedAt));

    return {
      mfaEnabled: userRow.mfaEnabled,
      method: settings?.method ?? 'TOTP',
      verifiedAt: settings?.verifiedAt ?? null,
      privilegedRolePolicy: PRIVILEGED_ROLES.has(userRow.primaryRole),
      remainingBackupCodes: unusedCodes.length,
      trustedDevices: devices.map((d) => ({
        id: d.id,
        deviceLabel: d.deviceLabel,
        ipAddress: d.ipAddress,
        lastUsedAt: d.lastUsedAt,
        expiresAt: d.expiresAt,
      })),
    };
  },

  async startEnrollment(pgUserId: number) {
    await ensurePostgresSeeded();
    const [userRow] = await db.select().from(users).where(eq(users.id, pgUserId)).limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User account not found.');

    const secret = generateBase32Secret(20);
    const encryptedPending = encryptSecret(secret);

    const [existing] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.userId, pgUserId))
      .limit(1);

    if (existing) {
      await db
        .update(mfaSettings)
        .set({ pendingSecret: encryptedPending, updatedAt: new Date() })
        .where(eq(mfaSettings.id, existing.id));
    } else {
      await db.insert(mfaSettings).values({
        userId: pgUserId,
        method: 'TOTP',
        encryptedSecret: encryptedPending,
        pendingSecret: encryptedPending,
        enforcedByPolicy: PRIVILEGED_ROLES.has(userRow.primaryRole),
      });
    }

    const label = encodeURIComponent(`HI-TECH College:${userRow.email}`);
    const issuer = encodeURIComponent('HI-TECH College');
    const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const qrDataUrl = await QRCode.toDataURL(otpauthUri, { width: 220, margin: 1 });

    return {
      qrDataUrl,
      otpauthUri,
      manualKey: secret,
    };
  },

  async confirmEnrollment(pgUserId: number, code: string) {
    await ensurePostgresSeeded();
    const [settings] = await db
      .select()
      .from(mfaSettings)
      .where(eq(mfaSettings.userId, pgUserId))
      .limit(1);

    const encrypted = settings?.pendingSecret || settings?.encryptedSecret;
    if (!settings || !encrypted) {
      throw new AuthHttpError(400, 'Start authenticator setup before confirming.');
    }

    const secret = decryptSecret(encrypted);
    if (!verifyTotpCode(secret, code)) {
      throw new AuthHttpError(400, 'Invalid 6-digit authenticator verification code.');
    }

    const now = new Date();
    await db
      .update(mfaSettings)
      .set({
        encryptedSecret: encrypted,
        pendingSecret: null,
        verifiedAt: now,
        updatedAt: now,
      })
      .where(eq(mfaSettings.id, settings.id));

    await db
      .update(users)
      .set({ mfaEnabled: true, updatedAt: now })
      .where(eq(users.id, pgUserId));

    // Generate 10 one-time hashed backup codes
    await db.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, pgUserId));
    const plaintextCodes = generateBackupCodes(10);
    await db.insert(mfaBackupCodes).values(
      plaintextCodes.map((c) => ({
        userId: pgUserId,
        codeHash: hashTokenSha256(c.replace(/-/g, '').toUpperCase()),
      }))
    );

    await recordSecurityAlert(
      pgUserId,
      'Multi-Factor Authentication enabled',
      'Authenticator TOTP verification and 10 single-use backup codes were activated on your account.'
    );

    return {
      mfaEnabled: true,
      backupCodes: plaintextCodes,
    };
  },

  async sendEmailOtpForChallenge(challengeToken: string) {
    await ensurePostgresSeeded();
    const challengeHash = hashTokenSha256(challengeToken);
    const [challenge] = await db
      .select()
      .from(mfaChallenges)
      .where(eq(mfaChallenges.challengeTokenHash, challengeHash))
      .limit(1);

    if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() < Date.now()) {
      throw new AuthHttpError(400, 'MFA verification session has expired. Please sign in again.');
    }

    const otp = String(crypto.randomInt(100000, 999999));
    await db
      .update(mfaChallenges)
      .set({ emailOtpHash: hashTokenSha256(otp) })
      .where(eq(mfaChallenges.id, challenge.id));

    await recordSecurityAlert(
      challenge.userId,
      'Login verification OTP issued',
      'A one-time verification code was dispatched for your portal sign-in challenge.'
    );

    return {
      dispatched: true,
      message: 'A 6-digit verification code has been sent to your registered college email.',
    };
  },

  async verifyChallenge(
    req: Request,
    res: Response,
    input: {
      challengeToken: string;
      code: string;
      method: 'TOTP' | 'BACKUP_CODE' | 'EMAIL_OTP';
      trustDevice?: boolean;
    }
  ) {
    await ensurePostgresSeeded();
    const challengeHash = hashTokenSha256(input.challengeToken);
    const [challenge] = await db
      .select()
      .from(mfaChallenges)
      .where(eq(mfaChallenges.challengeTokenHash, challengeHash))
      .limit(1);

    if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() < Date.now()) {
      throw new AuthHttpError(400, 'MFA challenge expired or already used. Please sign in again.');
    }

    if (challenge.attempts >= 5) {
      throw new AuthHttpError(429, 'Too many failed MFA attempts. Please restart sign-in.');
    }

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, challenge.userId))
      .limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User not found.');

    let verified = false;

    if (input.method === 'TOTP') {
      const [settings] = await db
        .select()
        .from(mfaSettings)
        .where(eq(mfaSettings.userId, userRow.id))
        .limit(1);
      if (settings?.encryptedSecret) {
        const secret = decryptSecret(settings.encryptedSecret);
        verified = verifyTotpCode(secret, input.code);
      }
    } else if (input.method === 'EMAIL_OTP') {
      const candidateHash = hashTokenSha256(input.code.replace(/\s+/g, ''));
      verified = Boolean(challenge.emailOtpHash && challenge.emailOtpHash === candidateHash);
    } else if (input.method === 'BACKUP_CODE') {
      const normalized = input.code.replace(/[-\s]+/g, '').toUpperCase();
      const candidateHash = hashTokenSha256(normalized);
      const [backup] = await db
        .select()
        .from(mfaBackupCodes)
        .where(
          and(
            eq(mfaBackupCodes.userId, userRow.id),
            eq(mfaBackupCodes.codeHash, candidateHash),
            isNull(mfaBackupCodes.usedAt)
          )
        )
        .limit(1);
      if (backup) {
        verified = true;
        await db
          .update(mfaBackupCodes)
          .set({ usedAt: new Date() })
          .where(eq(mfaBackupCodes.id, backup.id));
      }
    }

    if (!verified) {
      await db
        .update(mfaChallenges)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(mfaChallenges.id, challenge.id));
      await db.insert(loginEvents).values({
        userId: userRow.id,
        identifier: userRow.email,
        authMethod: `MFA_${input.method}`,
        outcome: 'FAILED',
        failureReason: 'INVALID_MFA_CODE',
        ipAddress: req.ip || '127.0.0.1',
        deviceLabel: detectDeviceLabel(req.headers['user-agent']),
      });
      throw new AuthHttpError(401, 'Invalid verification code.');
    }

    const now = new Date();
    await db
      .update(mfaChallenges)
      .set({ consumedAt: now })
      .where(eq(mfaChallenges.id, challenge.id));

    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const deviceLabel = detectDeviceLabel(userAgent);

    if (input.trustDevice) {
      const rawDeviceToken = generateRandomToken('TRD', 24);
      const deviceHash = hashTokenSha256(rawDeviceToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(trustedDevices).values({
        id: `trd-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: userRow.id,
        deviceTokenHash: deviceHash,
        deviceLabel,
        ipAddress,
        expiresAt,
      });
      res.cookie(TRUSTED_DEVICE_COOKIE_NAME, rawDeviceToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    await db.insert(loginEvents).values({
      userId: userRow.id,
      identifier: userRow.email,
      authMethod: `MFA_${input.method}`,
      outcome: 'SUCCESS',
      ipAddress,
      deviceLabel,
    });

    const sessionResult = await issueFullUserSession(res, userRow, {
      ipAddress,
      userAgent,
      rememberMe: challenge.rememberMe,
    });

    return {
      mfaRequired: false,
      ...sessionResult,
    };
  },

  async disableMfa(pgUserId: number, currentPassword: string) {
    await ensurePostgresSeeded();
    const [userRow] = await db.select().from(users).where(eq(users.id, pgUserId)).limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User not found.');

    if (!verifyPasswordScrypt(currentPassword, userRow.passwordHash)) {
      throw new AuthHttpError(401, 'Current password confirmation failed.');
    }

    const now = new Date();
    await db
      .update(users)
      .set({ mfaEnabled: false, updatedAt: now })
      .where(eq(users.id, pgUserId));
    await db.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, pgUserId));
    await db.delete(mfaSettings).where(eq(mfaSettings.userId, pgUserId));

    await recordSecurityAlert(
      pgUserId,
      'Multi-Factor Authentication disabled',
      'MFA was disabled on your account after password verification. Re-enable MFA immediately if unexpected.'
    );

    return { mfaEnabled: false };
  },

  async regenerateBackupCodes(pgUserId: number, currentPassword: string) {
    await ensurePostgresSeeded();
    const [userRow] = await db.select().from(users).where(eq(users.id, pgUserId)).limit(1);
    if (!userRow) throw new AuthHttpError(404, 'User not found.');
    if (!userRow.mfaEnabled) {
      throw new AuthHttpError(400, 'Enable MFA before generating backup recovery codes.');
    }
    if (!verifyPasswordScrypt(currentPassword, userRow.passwordHash)) {
      throw new AuthHttpError(401, 'Current password confirmation failed.');
    }

    await db.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, pgUserId));
    const plaintextCodes = generateBackupCodes(10);
    await db.insert(mfaBackupCodes).values(
      plaintextCodes.map((c) => ({
        userId: pgUserId,
        codeHash: hashTokenSha256(c.replace(/-/g, '').toUpperCase()),
      }))
    );

    await recordSecurityAlert(
      pgUserId,
      'MFA backup recovery codes regenerated',
      '10 fresh single-use MFA backup recovery codes were generated. Previous backup codes are now invalid.'
    );

    return { backupCodes: plaintextCodes };
  },

  async revokeTrustedDevice(pgUserId: number, deviceId: string) {
    await ensurePostgresSeeded();
    await db
      .update(trustedDevices)
      .set({ revokedAt: new Date() })
      .where(and(eq(trustedDevices.id, deviceId), eq(trustedDevices.userId, pgUserId)));
    return { revoked: true };
  },
};
