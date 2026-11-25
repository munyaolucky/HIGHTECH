import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import test, { after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) {
      return { format: 'module', shortCircuit: true, source: 'export default {};' };
    }
    return nextLoad(url, context);
  },
});

const dbFilePath = path.join(process.cwd(), '.data', 'hitech-portal-db.json');
const hadExistingDbFile = fs.existsSync(dbFilePath);
const originalDbFileContents = hadExistingDbFile ? fs.readFileSync(dbFilePath, 'utf8') : null;

const { db, isPostgresConfigured } = await import('../src/db/index.ts');
const {
  authSecurityAuditLogs,
  emailVerificationTokens,
  loginEvents,
  userSessions,
  users,
} = await import('../src/db/schema.ts');
const {
  generateNumericOtp,
  hashEmailVerificationCode,
  hashPasswordScrypt,
  hashTokenSha256,
  validatePasswordStrength,
  verifyTimingSafeHex,
} = await import('../server/lib/crypto.ts');
const {
  enforceAccountSecurityGate,
  getPortalSecurityBlock,
  isPathExemptFromSecurityGate,
} = await import('../server/middleware/auth.ts');
const {
  authService,
  AuthHttpError,
  setEmailOtpObserverForTests,
} = await import('../server/modules/auth/auth.service.ts');

const { AuthProvider } = await import('../src/auth/AuthProvider.tsx');
const { getUserDashboardPath } = await import('../src/auth/auth-utils.ts');
const { ProtectedRoute } = await import('../src/auth/ProtectedRoute.tsx');
const { default: ChangePasswordPage } = await import('../src/modules/auth/ChangePasswordPage.tsx');
const { default: VerifyEmailPage } = await import('../src/modules/auth/VerifyEmailPage.tsx');
const { default: ForgotPasswordPage } = await import('../src/modules/auth/ForgotPasswordPage.tsx');
const { default: ResetPasswordPage } = await import('../src/modules/auth/ResetPasswordPage.tsx');

import type { PortalUser } from '../src/auth/auth-types.ts';
import type { PortalSessionContext } from '../server/middleware/auth.ts';

const createdTestEmails: string[] = [];

after(async () => {
  setEmailOtpObserverForTests(null);
  if (isPostgresConfigured() && createdTestEmails.length > 0) {
    for (const email of createdTestEmails) {
      await db.delete(authSecurityAuditLogs).where(eq(authSecurityAuditLogs.email, email)).catch(() => {});
      await db.delete(loginEvents).where(eq(loginEvents.identifier, email)).catch(() => {});
      await db.delete(users).where(eq(users.email, email)).catch(() => {});
    }
  }
  if (hadExistingDbFile && originalDbFileContents !== null) {
    fs.writeFileSync(dbFilePath, originalDbFileContents, 'utf8');
  } else if (!hadExistingDbFile && fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
  }
});

function makePortalUser(overrides: Partial<PortalUser> = {}): PortalUser {
  return {
    id: 'usr-sec-1',
    uid: 'usr-sec-1',
    fullName: 'Grace Wambui',
    email: 'grace.wambui@hitech.ac.ke',
    registrationNumber: 'HCA/STU/2026/9001',
    primaryRole: 'STUDENT',
    roles: ['STUDENT'],
    portalType: 'student',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    emailVerified: true,
    emailVerificationRequired: false,
    requiresProfileCompletion: false,
    mfaEnabled: false,
    permissions: ['student.portal.access'],
    ...overrides,
  };
}

function createMockResponse() {
  const state: {
    statusCode: number;
    body: unknown;
    cookies: Record<string, string>;
  } = {
    statusCode: 200,
    body: null,
    cookies: {},
  };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      state.body = payload;
      return res;
    },
    cookie(name: string, value: string) {
      state.cookies[name] = value;
      return res;
    },
    clearCookie() {
      return res;
    },
  } as unknown as Response;
  return { res, state };
}

test('validatePasswordStrength requires 12+ characters, mixed case, digit, and symbol', () => {
  assert.match(validatePasswordStrength('Short@123') ?? '', /12 characters/);
  assert.match(validatePasswordStrength('alllowercase123!') ?? '', /uppercase/);
  assert.match(validatePasswordStrength('ALLUPPERCASE123!') ?? '', /lowercase/);
  assert.match(validatePasswordStrength('NoDigitsHere!@#') ?? '', /number/);
  assert.match(validatePasswordStrength('NoSpecialChars1234') ?? '', /special/);
  assert.equal(validatePasswordStrength('HiTech@2026Strong!'), null);
});

test('generateNumericOtp and HMAC verification helpers match safely without plaintext storage', () => {
  const otp = generateNumericOtp(6);
  assert.match(otp, /^\d{6}$/);
  const hashA = hashEmailVerificationCode(42, otp);
  const hashB = hashEmailVerificationCode(42, otp);
  const wrongUserHash = hashEmailVerificationCode(99, otp);
  assert.equal(hashA.length, 64);
  assert.notEqual(hashA, otp);
  assert.equal(verifyTimingSafeHex(hashA, hashB), true);
  assert.equal(verifyTimingSafeHex(hashA, wrongUserHash), false);
});

test('getUserDashboardPath and ProtectedRoute strictly enforce Change Password -> Verify Email -> Profile -> Dashboard', () => {
  const step1 = makePortalUser({
    mustChangePassword: true,
    emailVerified: false,
    emailVerificationRequired: true,
    requiresProfileCompletion: true,
  });
  const step2 = makePortalUser({
    mustChangePassword: false,
    emailVerified: false,
    emailVerificationRequired: true,
    requiresProfileCompletion: true,
  });
  const step3 = makePortalUser({
    mustChangePassword: false,
    emailVerified: true,
    emailVerificationRequired: false,
    requiresProfileCompletion: true,
  });
  const step4 = makePortalUser();

  assert.equal(getUserDashboardPath(step1), '/portal/change-password');
  assert.equal(getUserDashboardPath(step2), '/portal/verify-email');
  assert.equal(getUserDashboardPath(step3), '/portal/complete-profile');
  assert.equal(getUserDashboardPath(step4), '/portal/student');

  // ProtectedRoute blocks student workspace when email verification pending
  const blockedDashboardHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ProtectedRoute,
        { portalType: 'student', userOverride: step2, onRedirect: () => {} },
        React.createElement('div', null, 'Protected Student Portal')
      )
    )
  );
  assert.doesNotMatch(blockedDashboardHtml, /Protected Student Portal/);
  assert.match(blockedDashboardHtml, /Email verification required/);

  // ProtectedRoute allows VerifyEmailPage when allowEmailVerification is true and password already changed
  const allowedVerifyHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ProtectedRoute,
        { allowEmailVerification: true, userOverride: step2, onRedirect: () => {} },
        React.createElement('div', null, 'Email OTP Verification Screen')
      )
    )
  );
  assert.match(allowedVerifyHtml, /Email OTP Verification Screen/);

  // ProtectedRoute blocks VerifyEmailPage if mustChangePassword is still true
  const blockedVerifyHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ProtectedRoute,
        { allowEmailVerification: true, userOverride: step1, onRedirect: () => {} },
        React.createElement('div', null, 'Email OTP Verification Screen')
      )
    )
  );
  assert.doesNotMatch(blockedVerifyHtml, /Email OTP Verification Screen/);
  assert.match(blockedVerifyHtml, /Password update required/);

  // ProtectedRoute allows ChangePasswordPage even while emailVerificationRequired is true when mustChangePassword is true
  const allowedChangePassHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ProtectedRoute,
        { allowPasswordChange: true, userOverride: step1, onRedirect: () => {} },
        React.createElement('div', null, 'Force Change Password Screen')
      )
    )
  );
  assert.match(allowedChangePassHtml, /Force Change Password Screen/);
});

test('Security gate middleware classifies exemptions and blocks unverified / temp-password sessions', () => {
  assert.equal(isPathExemptFromSecurityGate('/auth/email/verify'), true);
  assert.equal(isPathExemptFromSecurityGate('/auth/password/change'), true);
  assert.equal(isPathExemptFromSecurityGate('/health'), true);
  assert.equal(isPathExemptFromSecurityGate('/users'), false);
  assert.equal(isPathExemptFromSecurityGate('/student/fees'), false);

  const baseCtx: PortalSessionContext = {
    pgUserId: 1,
    uid: 'u1',
    email: 'test@hitech.ac.ke',
    registrationNumber: 'HCA/STU/2026/001',
    fullName: 'Test User',
    primaryRole: 'STUDENT',
    accountStatus: 'ACTIVE',
    mustChangePassword: true,
    passwordChangedAt: null,
    emailVerified: false,
    emailVerifiedAt: null,
    emailVerificationRequired: true,
    requiresProfileCompletion: false,
    mfaEnabled: false,
    campusId: null,
    departmentId: null,
    sessionId: 'ses-1',
    destination: '/portal/student',
  };

  assert.equal(getPortalSecurityBlock(baseCtx)?.code, 'PASSWORD_CHANGE_REQUIRED');
  assert.equal(
    getPortalSecurityBlock({ ...baseCtx, mustChangePassword: false })?.code,
    'EMAIL_VERIFICATION_REQUIRED'
  );
  assert.equal(
    getPortalSecurityBlock({
      ...baseCtx,
      mustChangePassword: false,
      emailVerified: true,
      emailVerificationRequired: false,
    }),
    null
  );
});

test('ChangePasswordPage, VerifyEmailPage, ForgotPasswordPage, and ResetPasswordPage render cleanly without anti-patterns', () => {
  const pages = [
    renderToStaticMarkup(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(ChangePasswordPage, {
          onNavigate: () => {},
          onNavigateHome: () => {},
        })
      )
    ),
    renderToStaticMarkup(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(VerifyEmailPage, {
          onNavigate: () => {},
          onNavigateHome: () => {},
        })
      )
    ),
    renderToStaticMarkup(
      React.createElement(ForgotPasswordPage, { onBackToLogin: () => {} })
    ),
    renderToStaticMarkup(
      React.createElement(ResetPasswordPage, { onBackToLogin: () => {} })
    ),
  ];

  assert.match(pages[0], /Create your new password/);
  assert.match(pages[0], /At least 12 characters/);
  assert.match(pages[0], /Show passwords/);

  assert.match(pages[1], /Verify your email address/);
  assert.match(pages[1], /6-digit verification code/);
  assert.match(pages[1], /Resend verification/);

  assert.match(pages[3], /At least 12 characters/);

  for (const html of pages) {
    assert.equal(html.includes('animate-pulse'), false);
    assert.equal(/\sstyle="/i.test(html), false);
  }
});

test('Backend first-login password change, OTP hashing/expiry/lockout/cooldown, and security gate work end-to-end', async (t) => {
  if (!isPostgresConfigured()) {
    t.skip('Cloud SQL PostgreSQL is not configured in this environment.');
    return;
  }

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `security.flow.${suffix}@students.hitech.ac.ke`;
  const regNo = `HCA/STU/2026/SEC${suffix.slice(-5)}`;
  const tempPass = 'TempPass@2026!';
  const newPass = 'SecureCollege#2026!';
  createdTestEmails.push(email);

  const [createdUser] = await db
    .insert(users)
    .values({
      uid: `sec-test-${suffix}`,
      email,
      registrationNumber: regNo,
      fullName: 'Security Flow Candidate',
      primaryRole: 'STUDENT',
      accountStatus: 'ACTIVE',
      passwordHash: hashPasswordScrypt(tempPass),
      mustChangePassword: true,
      emailVerifiedAt: null,
      emailVerificationRequired: true,
      requiresProfileCompletion: false,
      campusId: 'cmp-nairobi',
      departmentId: 'dept-computing',
    })
    .returning();

  const rawSessionToken = `HTC-TEST-SES-${suffix}`;
  const sessionId = `ses-sec-${suffix}`;
  await db.insert(userSessions).values({
    id: sessionId,
    userId: createdUser.id,
    tokenHash: hashTokenSha256(rawSessionToken),
    deviceLabel: 'Test Runner',
    ipAddress: '127.0.0.1',
    userAgent: 'node:test',
    rememberMe: false,
    expiresAt: new Date(Date.now() + 3600_000),
  });

  // 1. Security gate blocks protected route while mustChangePassword=true
  {
    const { res, state } = createMockResponse();
    let calledNext = false;
    await enforceAccountSecurityGate(
      {
        path: '/student/fees',
        headers: { cookie: `hitech_portal_session=${rawSessionToken}` },
      } as unknown as Request,
      res,
      () => {
        calledNext = true;
      }
    );
    assert.equal(calledNext, false);
    assert.equal(state.statusCode, 403);
    assert.equal((state.body as { code?: string }).code, 'PASSWORD_CHANGE_REQUIRED');
  }

  // 2. Rejects reusing temporary password
  await assert.rejects(
    () => authService.changePassword(createdUser.id, sessionId, tempPass, tempPass),
    (err: unknown) => err instanceof AuthHttpError && err.statusCode === 400
  );

  // 3. Rejects wrong temporary password
  await assert.rejects(
    () => authService.changePassword(createdUser.id, sessionId, 'WrongTemp@2026!', newPass),
    (err: unknown) => err instanceof AuthHttpError && err.statusCode === 401
  );

  // Capture generated OTP strictly via test observer
  let capturedOtp = '';
  setEmailOtpObserverForTests(({ userId, code }) => {
    if (userId === createdUser.id) {
      capturedOtp = code;
    }
  });

  // 4. Successful first-login password change advances to VERIFY_EMAIL and dispatches hashed OTP
  const changeRes = await authService.changePassword(createdUser.id, sessionId, tempPass, newPass);
  assert.equal(changeRes.nextStep, 'VERIFY_EMAIL');
  assert.equal(changeRes.destination, '/portal/verify-email');
  assert.equal(changeRes.requiresEmailVerification, true);
  assert.match(capturedOtp, /^\d{6}$/);

  const [storedToken] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, createdUser.id))
    .orderBy(desc(emailVerificationTokens.createdAt))
    .limit(1);
  assert.ok(storedToken);
  assert.notEqual(storedToken.codeHash, capturedOtp);

  // 5. Security gate now returns EMAIL_VERIFICATION_REQUIRED
  {
    const { res, state } = createMockResponse();
    let calledNext = false;
    await enforceAccountSecurityGate(
      {
        path: '/student/fees',
        headers: { cookie: `hitech_portal_session=${rawSessionToken}` },
      } as unknown as Request,
      res,
      () => {
        calledNext = true;
      }
    );
    assert.equal(calledNext, false);
    assert.equal(state.statusCode, 403);
    assert.equal((state.body as { code?: string }).code, 'EMAIL_VERIFICATION_REQUIRED');
  }

  // 6. Resend cooldown blocks immediate resend (429)
  await assert.rejects(
    () => authService.sendEmailVerification(createdUser.id, undefined, { isResend: true }),
    (err: unknown) => err instanceof AuthHttpError && err.statusCode === 429
  );

  // 7. 5 wrong OTP attempts lock out token (429 OTP_ATTEMPTS_EXCEEDED)
  const wrongOtp = capturedOtp === '000000' ? '111111' : '000000';
  for (let i = 1; i <= 4; i += 1) {
    await assert.rejects(
      () => authService.verifyEmailOtp(createdUser.id, wrongOtp),
      (err: unknown) => err instanceof AuthHttpError && err.statusCode === 400 && err.code === 'OTP_INVALID'
    );
  }
  await assert.rejects(
    () => authService.verifyEmailOtp(createdUser.id, wrongOtp),
    (err: unknown) =>
      err instanceof AuthHttpError && err.statusCode === 429 && err.code === 'OTP_ATTEMPTS_EXCEEDED'
  );

  // 8. Expired OTP is rejected cleanly
  await db
    .update(emailVerificationTokens)
    .set({ createdAt: new Date(Date.now() - 120_000) })
    .where(eq(emailVerificationTokens.userId, createdUser.id));

  await db.insert(emailVerificationTokens).values({
    userId: createdUser.id,
    email,
    codeHash: hashEmailVerificationCode(createdUser.id, '123456'),
    createdAt: new Date(Date.now() - 660_000),
    expiresAt: new Date(Date.now() - 60_000),
  });
  await assert.rejects(
    () => authService.verifyEmailOtp(createdUser.id, '123456'),
    (err: unknown) =>
      err instanceof AuthHttpError && err.statusCode === 400 && err.code === 'OTP_EXPIRED'
  );

  // 9. Fresh OTP after cooldown elapses verifies email and unlocks dashboard access
  const freshSend = await authService.sendEmailVerification(createdUser.id, undefined, {
    isResend: false,
  });
  assert.equal(freshSend.email, email);
  assert.match(capturedOtp, /^\d{6}$/);

  const verifyRes = await authService.verifyEmailOtp(createdUser.id, capturedOtp);
  assert.equal(verifyRes.verified, true);
  assert.equal(verifyRes.destination, '/portal/student');

  // 10. Security gate now allows protected requests
  {
    const { res } = createMockResponse();
    let calledNext = false;
    await enforceAccountSecurityGate(
      {
        path: '/student/fees',
        headers: { cookie: `hitech_portal_session=${rawSessionToken}` },
      } as unknown as Request,
      res,
      () => {
        calledNext = true;
      }
    );
    assert.equal(calledNext, true);
  }

  // 11. Forgot password returns identical anti-enumeration response for existing & unknown emails
  const mockReq = { ip: '127.0.0.1', headers: {} } as unknown as Request;
  const knownRecovery = await authService.requestPasswordRecovery(mockReq, email);
  const unknownRecovery = await authService.requestPasswordRecovery(
    mockReq,
    `unknown.${suffix}@example.invalid`
  );
  assert.equal(knownRecovery.message, unknownRecovery.message);
});
