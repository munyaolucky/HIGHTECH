import { Router, type Request, type Response } from 'express';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db, isPostgresConfigured } from '../../../src/db/index.ts';
import {
  authSecurityAuditLogs,
  loginEvents,
  notifications,
  studentProfiles,
  userSessions,
} from '../../../src/db/schema.ts';
import {
  resolveCatalogEntryForRole,
  type RoleDutyCatalogEntry,
} from '../../../src/config/roleDutyCatalog.ts';
import { getDb } from '../../data/store.ts';
import { requirePortalAuth } from '../../middleware/auth.ts';

const router = Router();

export interface LivePortalEventItem {
  id: string;
  source: 'AUTH_LOGIN' | 'SECURITY_AUDIT' | 'NOTIFICATION' | 'STAFF_AUDIT';
  eventType: string;
  title: string;
  detail: string;
  severity: 'INFO' | 'ACTION_REQUIRED' | 'CRITICAL' | 'SUCCESS';
  timestampIso: string;
}

export interface MyPortalCapabilitiesPayload {
  role: string;
  title: string;
  category: RoleDutyCatalogEntry['category'];
  dataScopeSummary: string;
  restrictedFrom: string[];
  accountProperties: {
    uid: string;
    fullName: string;
    email: string;
    registrationNumber: string;
    primaryRole: string;
    roleTitle: string;
    accountStatus: string;
    department: string;
    campus: string;
    allowedCampuses: string[];
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    mustChangePassword: boolean;
    passwordChangedAt: string | null;
    mfaEnabled: boolean;
    requiresProfileCompletion: boolean;
    activeSessionsCount: number;
    portalDestination: string;
    studentMetrics?: {
      programmeName: string | null;
      intakeName: string | null;
      studyMode: string | null;
      feeBalanceKes: number;
      attendanceRatePct: number;
      meanGradeLabel: string | null;
      academicStatus: string;
    };
  };
  duties: RoleDutyCatalogEntry['duties'];
  roleEvents: RoleDutyCatalogEntry['events'];
  liveEvents: LivePortalEventItem[];
  propertyDefinitions: RoleDutyCatalogEntry['properties'];
  permissions: RoleDutyCatalogEntry['permissions'];
  accessiblePortals: RoleDutyCatalogEntry['accessiblePortals'];
}

export async function buildCapabilitiesForAuthenticatedRequest(
  req: Request
): Promise<MyPortalCapabilitiesPayload> {
  const portalUser = req.portalUser;
  const staffUser = req.staffUser;

  const effectiveRole = (portalUser?.primaryRole ?? staffUser?.role ?? 'STUDENT').toUpperCase();
  const catalog = resolveCatalogEntryForRole(effectiveRole);

  const liveEvents: LivePortalEventItem[] = [];
  let activeSessionsCount = portalUser?.sessionId ? 1 : 0;
  let studentMetrics: MyPortalCapabilitiesPayload['accountProperties']['studentMetrics'] | undefined;

  if (portalUser?.pgUserId && isPostgresConfigured()) {
    try {
      const [loginRows, auditRows, notifRows, sessionRows] = await Promise.all([
        db
          .select({
            id: loginEvents.id,
            authMethod: loginEvents.authMethod,
            outcome: loginEvents.outcome,
            failureReason: loginEvents.failureReason,
            deviceLabel: loginEvents.deviceLabel,
            createdAt: loginEvents.createdAt,
          })
          .from(loginEvents)
          .where(eq(loginEvents.userId, portalUser.pgUserId))
          .orderBy(desc(loginEvents.createdAt))
          .limit(8),
        db
          .select({
            id: authSecurityAuditLogs.id,
            eventType: authSecurityAuditLogs.eventType,
            detail: authSecurityAuditLogs.detail,
            createdAt: authSecurityAuditLogs.createdAt,
          })
          .from(authSecurityAuditLogs)
          .where(eq(authSecurityAuditLogs.userId, portalUser.pgUserId))
          .orderBy(desc(authSecurityAuditLogs.createdAt))
          .limit(8),
        db
          .select({
            id: notifications.id,
            category: notifications.category,
            priority: notifications.priority,
            title: notifications.title,
            message: notifications.message,
            createdAt: notifications.createdAt,
          })
          .from(notifications)
          .where(eq(notifications.recipientUserId, portalUser.pgUserId))
          .orderBy(desc(notifications.createdAt))
          .limit(8),
        db
          .select({ id: userSessions.id })
          .from(userSessions)
          .where(
            and(
              eq(userSessions.userId, portalUser.pgUserId),
              isNull(userSessions.revokedAt),
              gt(userSessions.expiresAt, new Date())
            )
          ),
      ]);

      activeSessionsCount = sessionRows.length;

      for (const row of loginRows) {
        liveEvents.push({
          id: `login-${row.id}`,
          source: 'AUTH_LOGIN',
          eventType: `LOGIN_${row.outcome}`,
          title: `Portal Sign-In (${row.authMethod}) — ${row.outcome}`,
          detail: row.failureReason
            ? `${row.deviceLabel} · ${row.failureReason}`
            : `Authenticated via ${row.deviceLabel}`,
          severity:
            row.outcome === 'SUCCESS'
              ? 'SUCCESS'
              : row.outcome === 'FAILED' || row.outcome === 'BLOCKED'
              ? 'CRITICAL'
              : 'INFO',
          timestampIso: row.createdAt.toISOString(),
        });
      }

      for (const row of auditRows) {
        liveEvents.push({
          id: `sec-${row.id}`,
          source: 'SECURITY_AUDIT',
          eventType: row.eventType,
          title: row.eventType.replaceAll('_', ' '),
          detail: row.detail,
          severity:
            row.eventType.includes('FAILED') || row.eventType.includes('SUSPEND')
              ? 'CRITICAL'
              : 'INFO',
          timestampIso: row.createdAt.toISOString(),
        });
      }

      for (const row of notifRows) {
        liveEvents.push({
          id: `notif-${row.id}`,
          source: 'NOTIFICATION',
          eventType: `NOTICE_${row.category}`,
          title: row.title,
          detail: row.message,
          severity:
            row.priority === 'CRITICAL'
              ? 'CRITICAL'
              : row.priority === 'HIGH'
              ? 'ACTION_REQUIRED'
              : 'INFO',
          timestampIso: row.createdAt.toISOString(),
        });
      }

      if (effectiveRole === 'STUDENT') {
        const [studentRow] = await db
          .select({
            programmeName: studentProfiles.programmeName,
            intakeName: studentProfiles.intakeName,
            studyMode: studentProfiles.studyMode,
            feeBalanceKes: studentProfiles.feeBalanceKes,
            attendanceRatePct: studentProfiles.attendanceRatePct,
            meanGradeLabel: studentProfiles.meanGradeLabel,
            status: studentProfiles.status,
          })
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, portalUser.pgUserId))
          .limit(1);

        if (studentRow) {
          studentMetrics = {
            programmeName: studentRow.programmeName,
            intakeName: studentRow.intakeName,
            studyMode: studentRow.studyMode,
            feeBalanceKes: studentRow.feeBalanceKes,
            attendanceRatePct: studentRow.attendanceRatePct,
            meanGradeLabel: studentRow.meanGradeLabel,
            academicStatus: studentRow.status,
          };
        }
      }
    } catch {
      // Fall back gracefully if Cloud SQL query fails in test or offline context
    }
  }

  // Include user-scoped staff operational audit logs (never leaking other users' records)
  if (staffUser) {
    const store = getDb();
    const myAuditRows = store.staffAuditLogs
      .filter((log) => log.actorId === staffUser.id)
      .slice(0, 8);
    for (const row of myAuditRows) {
      liveEvents.push({
        id: `staff-audit-${row.id}`,
        source: 'STAFF_AUDIT',
        eventType: row.action,
        title: row.action.replaceAll('_', ' '),
        detail: row.description,
        severity: 'INFO',
        timestampIso: row.createdAt,
      });
    }
  }

  liveEvents.sort(
    (a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime()
  );

  const mergedPermissions = {
    staffPermissions: catalog.permissions.staffPermissions,
    uiNavPermissions:
      staffUser?.permissions && staffUser.permissions.length > 0
        ? staffUser.permissions
        : catalog.permissions.uiNavPermissions,
    documentPermissions:
      staffUser?.documentPermissions && staffUser.documentPermissions.length > 0
        ? staffUser.documentPermissions
        : catalog.permissions.documentPermissions,
    registrationPermissions:
      staffUser?.registrationPermissions && staffUser.registrationPermissions.length > 0
        ? staffUser.registrationPermissions
        : catalog.permissions.registrationPermissions,
    portalCapabilities: catalog.permissions.portalCapabilities,
  };

  return {
    role: effectiveRole,
    title: staffUser?.roleTitle ?? catalog.title,
    category: catalog.category,
    dataScopeSummary: catalog.dataScopeSummary,
    restrictedFrom:
      staffUser?.restrictedFrom && staffUser.restrictedFrom.length > 0
        ? staffUser.restrictedFrom
        : catalog.restrictedFrom,
    accountProperties: {
      uid: portalUser?.uid ?? staffUser?.id ?? 'unassigned',
      fullName: portalUser?.fullName ?? staffUser?.fullName ?? 'Portal User',
      email: portalUser?.email ?? staffUser?.email ?? '',
      registrationNumber:
        portalUser?.registrationNumber ??
        staffUser?.employeeNumber ??
        `${catalog.regNoPrefix}/2026/001`,
      primaryRole: effectiveRole,
      roleTitle: staffUser?.roleTitle ?? catalog.title,
      accountStatus: portalUser?.accountStatus ?? 'ACTIVE',
      department: staffUser?.department ?? portalUser?.departmentId ?? catalog.department,
      campus: staffUser?.campus ?? portalUser?.campusId ?? catalog.defaultCampus,
      allowedCampuses:
        staffUser?.allowedCampuses && staffUser.allowedCampuses.length > 0
          ? staffUser.allowedCampuses
          : catalog.allowedCampuses,
      emailVerified: portalUser?.emailVerified ?? true,
      emailVerifiedAt: portalUser?.emailVerifiedAt ?? null,
      mustChangePassword: portalUser?.mustChangePassword ?? false,
      passwordChangedAt: portalUser?.passwordChangedAt ?? null,
      mfaEnabled: portalUser?.mfaEnabled ?? false,
      requiresProfileCompletion: portalUser?.requiresProfileCompletion ?? false,
      activeSessionsCount,
      portalDestination: portalUser?.destination ?? catalog.portalDestination,
      ...(studentMetrics ? { studentMetrics } : {}),
    },
    duties: catalog.duties,
    roleEvents: catalog.events,
    liveEvents: liveEvents.slice(0, 20),
    propertyDefinitions: catalog.properties,
    permissions: mergedPermissions,
    accessiblePortals: catalog.accessiblePortals,
  };
}

router.get('/my-capabilities', requirePortalAuth, async (req: Request, res: Response) => {
  try {
    const payload = await buildCapabilitiesForAuthenticatedRequest(req);
    res.json({ success: true, data: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to load portal capabilities.';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
