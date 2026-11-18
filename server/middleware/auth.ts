import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, isPostgresConfigured } from '../../src/db/index.ts';
import { userSessions, users } from '../../src/db/schema.ts';
import { getDb } from '../data/store.ts';
import { ensurePostgresSeeded } from '../lib/pg-sync.ts';
import { hashTokenSha256 } from '../lib/crypto.ts';
import type { StaffPermission, StaffRoleCode } from '../modules/staff/staff.permissions.ts';
import type { DocumentPermission } from '../modules/documents/documents.permissions.ts';
import {
  ROLE_REGISTRATION_PERMISSIONS,
  type RegistrationPermission,
} from '../modules/registration/registration.permissions.ts';

export interface AuthenticatedSessionUser {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  officeLocation: string;
  bio: string;
  role: StaffRoleCode | 'UNCONFIGURED';
  roleTitle: string;
  departmentId: string | null;
  department: string;
  campusId: string | null;
  campus: string;
  allowedCampuses: string[];
  permissions: string[];
  documentPermissions: string[];
  registrationPermissions: string[];
  restrictedFrom: string[];
  assignedUnits?: string[];
}

export interface PortalSessionContext {
  pgUserId: number;
  uid: string;
  email: string;
  registrationNumber: string | null;
  fullName: string;
  primaryRole: string;
  accountStatus: string;
  mustChangePassword: boolean;
  requiresProfileCompletion: boolean;
  mfaEnabled: boolean;
  campusId: string | null;
  departmentId: string | null;
  sessionId: string | null;
  destination: string;
}

declare global {
  namespace Express {
    interface Request {
      staffUser?: AuthenticatedSessionUser;
      portalUser?: PortalSessionContext;
    }
  }
}

export const SESSION_COOKIE_NAME = 'hitech_staff_session';
export const PORTAL_SESSION_COOKIE_NAME = 'hitech_portal_session';
export const TRUSTED_DEVICE_COOKIE_NAME = 'hitech_trusted_device';

const SESSION_SECRET = process.env.SESSION_SECRET || 'hitech-college-dev-session-secret-2026';

interface SessionPayload {
  userId: string;
  role: StaffRoleCode | 'UNCONFIGURED';
  iat: number;
}

function signPayload(payloadB64: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
}

export function createSessionToken(payload: SessionPayload): string {
  const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = signPayload(b64);
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [b64, sig] = token.split('.', 2);
  if (!b64 || !sig) return null;
  const expected = signPayload(b64);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

export function setSessionCookie(
  res: Response,
  userId: string,
  role: StaffRoleCode | 'UNCONFIGURED'
): void {
  const token = createSessionToken({ userId, role, iat: Date.now() });
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 12,
  });
}

export function setPortalSessionCookie(
  res: Response,
  rawSessionToken: string,
  rememberMe: boolean
): void {
  res.cookie(PORTAL_SESSION_COOKIE_NAME, rawSessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 14 : 1000 * 60 * 60 * 12,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.clearCookie(PORTAL_SESSION_COOKIE_NAME, { path: '/' });
}

export function resolveDestinationForRole(role: string): string {
  const upper = role.toUpperCase();
  if (upper === 'STUDENT') return '/portal/student';
  if (upper === 'PARENT') return '/portal/engagement';
  if (upper === 'ALUMNI' || upper === 'CONTRACTOR' || upper === 'PARTNER' || upper === 'GUEST') {
    return '/portal/campus-services';
  }
  return '/portal/staff';
}

function buildStaffSessionFromAccount(accountId: string): AuthenticatedSessionUser | null {
  const dbStore = getDb();
  const account = dbStore.staffAccounts.find(
    (s) => s.id === accountId && s.status !== 'SUSPENDED'
  );
  if (!account) return null;
  return {
    id: account.id,
    employeeNumber: account.employeeNumber,
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    officeLocation: account.officeLocation,
    bio: account.bio,
    role: account.role,
    roleTitle: account.roleTitle,
    departmentId: account.departmentId,
    department: account.department,
    campusId: account.campusId,
    campus: account.campus,
    allowedCampuses: account.allowedCampuses,
    permissions: account.permissions,
    documentPermissions: account.documentPermissions,
    registrationPermissions: [...(ROLE_REGISTRATION_PERMISSIONS[account.role] ?? [])],
    restrictedFrom: account.restrictedFrom,
    assignedUnits: account.assignedUnits,
  };
}

async function resolveSessionContext(req: Request): Promise<{
  portalUser?: PortalSessionContext;
  staffUser?: AuthenticatedSessionUser;
}> {
  const cookies = parseCookies(req.headers.cookie);

  // 1. Check PostgreSQL unified portal session cookie first
  const portalToken = cookies[PORTAL_SESSION_COOKIE_NAME];
  if (portalToken && isPostgresConfigured()) {
    try {
      await ensurePostgresSeeded();
      const tokenHash = hashTokenSha256(portalToken);
      const rows = await db
        .select({
          session: userSessions,
          user: users,
        })
        .from(userSessions)
        .innerJoin(users, eq(userSessions.userId, users.id))
        .where(
          and(
            eq(userSessions.tokenHash, tokenHash),
            isNull(userSessions.revokedAt),
            gt(userSessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (rows[0] && rows[0].user.accountStatus === 'ACTIVE') {
        const { session, user } = rows[0];
        await db
          .update(userSessions)
          .set({ lastActiveAt: new Date() })
          .where(eq(userSessions.id, session.id));

        const portalUser: PortalSessionContext = {
          pgUserId: user.id,
          uid: user.uid,
          email: user.email,
          registrationNumber: user.registrationNumber,
          fullName: user.fullName,
          primaryRole: user.primaryRole,
          accountStatus: user.accountStatus,
          mustChangePassword: user.mustChangePassword,
          requiresProfileCompletion: user.requiresProfileCompletion,
          mfaEnabled: user.mfaEnabled,
          campusId: user.campusId,
          departmentId: user.departmentId,
          sessionId: session.id,
          destination: resolveDestinationForRole(user.primaryRole),
        };

        const staffUser =
          buildStaffSessionFromAccount(user.uid) ??
          (() => {
            const store = getDb();
            const matchByEmail = store.staffAccounts.find(
              (s) => s.email.toLowerCase() === user.email.toLowerCase() && s.status !== 'SUSPENDED'
            );
            return matchByEmail ? buildStaffSessionFromAccount(matchByEmail.id) : null;
          })() ??
          undefined;

        return { portalUser, staffUser };
      }
    } catch (err) {
      console.error('Portal session validation error:', err);
    }
  }

  // 2. Fallback to signed staff session cookie (for role-switcher / existing staff APIs)
  const payload = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
  if (!payload) return {};

  if (payload.role === 'UNCONFIGURED') {
    const staffUser: AuthenticatedSessionUser = {
      id: 'usr-unconfigured',
      employeeNumber: 'HCA/PENDING/000',
      fullName: 'Unconfigured Staff Account',
      email: 'pending@hitech.ac.ke',
      phone: '',
      officeLocation: 'Unassigned',
      bio: 'Pending role assignment by System Administrator.',
      role: 'UNCONFIGURED',
      roleTitle: 'Unconfigured Role',
      departmentId: null,
      department: 'Unassigned',
      campusId: null,
      campus: 'Nairobi Main Campus',
      allowedCampuses: [],
      permissions: [],
      documentPermissions: [],
      registrationPermissions: [],
      restrictedFrom: ['All college operational workspaces until role is provisioned'],
    };
    return { staffUser };
  }

  const staffUser = buildStaffSessionFromAccount(payload.userId);
  if (!staffUser) return {};

  let portalUser: PortalSessionContext | undefined;
  if (isPostgresConfigured()) {
    try {
      await ensurePostgresSeeded();
      const [pgUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, staffUser.email.toLowerCase()))
        .limit(1);
      if (pgUser) {
        portalUser = {
          pgUserId: pgUser.id,
          uid: pgUser.uid,
          email: pgUser.email,
          registrationNumber: pgUser.registrationNumber,
          fullName: pgUser.fullName,
          primaryRole: pgUser.primaryRole,
          accountStatus: pgUser.accountStatus,
          mustChangePassword: pgUser.mustChangePassword,
          requiresProfileCompletion: pgUser.requiresProfileCompletion,
          mfaEnabled: pgUser.mfaEnabled,
          campusId: pgUser.campusId,
          departmentId: pgUser.departmentId,
          sessionId: null,
          destination: resolveDestinationForRole(pgUser.primaryRole),
        };
      }
    } catch {
      // Ignore PG lookup failures in fallback
    }
  }

  return { staffUser, portalUser };
}

/**
 * Derives authenticated staff identity strictly from signed HttpOnly session cookie
 * or unified PostgreSQL session cookie.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { staffUser, portalUser } = await resolveSessionContext(req);
  if (portalUser) req.portalUser = portalUser;

  if (!staffUser) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to the HI-TECH College Portal.',
    });
    return;
  }

  req.staffUser = staffUser;
  next();
}

/**
 * Derives any authenticated portal user (Student, Staff, Parent, Alumni, etc.)
 * from PostgreSQL session or staff session cookie.
 */
export async function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { staffUser, portalUser } = await resolveSessionContext(req);
  if (staffUser) req.staffUser = staffUser;
  if (portalUser) req.portalUser = portalUser;

  if (!portalUser && !staffUser) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to the HI-TECH College Portal.',
    });
    return;
  }

  next();
}

export function requirePermission(permission: StaffPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.staffUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (!user.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Access denied: requires ${permission} permission.`,
      });
      return;
    }
    next();
  };
}

export function requireDocumentPermission(permission: DocumentPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.staffUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (!user.documentPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Document permission denied: requires ${permission}.`,
      });
      return;
    }
    next();
  };
}

export function requireRegistrationPermission(permission: RegistrationPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.staffUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (!user.registrationPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Registration permission denied: requires ${permission}.`,
      });
      return;
    }
    next();
  };
}
