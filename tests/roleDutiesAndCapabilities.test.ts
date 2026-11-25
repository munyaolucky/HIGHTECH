import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test, { beforeEach } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Request, Response } from 'express';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) {
      return { format: 'module', shortCircuit: true, source: 'export default {};' };
    }
    if (/\.(jpg|jpeg|png|svg|webp|gif)$/i.test(url)) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export default "/stub-asset.jpg";',
      };
    }
    return nextLoad(url, context);
  },
});

function installMemoryStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

installMemoryStorage();

const {
  ALL_CATALOG_ROLES,
  ALL_ROLE_CATALOG_ENTRIES,
  ROLE_DUTY_CATALOG,
  resolveCatalogEntryForRole,
  resolveCatalogRoleForPortalShell,
} = await import('../src/config/roleDutyCatalog.ts');
const { ALL_STAFF_ROLES, STAFF_ACCOUNTS } = await import('../src/config/staff-navigation.ts');
const { ROLE_TO_STAFF_PERMISSIONS } = await import(
  '../server/modules/staff/staff.permissions.ts'
);
const {
  ROLE_DOCUMENT_PERMISSIONS,
  STUDENT_DOCUMENT_PERMISSIONS,
} = await import('../server/modules/documents/documents.permissions.ts');
const { ROLE_REGISTRATION_PERMISSIONS } = await import(
  '../server/modules/registration/registration.permissions.ts'
);
const { buildCapabilitiesForAuthenticatedRequest } = await import(
  '../server/modules/portal/capabilities.routes.ts'
);
const { requirePortalAuth } = await import('../server/middleware/auth.ts');
const { getDb } = await import('../server/data/store.ts');
const { ThemeProvider } = await import('../src/context/ThemeContext.tsx');
const { PortalShellProvider } = await import('../src/context/PortalShellContext.tsx');
const { getPortalShellConfig } = await import('../src/config/portalShellConfigs.ts');
const { default: AccountRoleWorkspace } = await import(
  '../src/components/portal/AccountRoleWorkspace.tsx'
);
const { default: StaffUserManagementPage } = await import(
  '../src/modules/users/StaffUserManagementPage.tsx'
);
const { default: StaffDashboardRouter } = await import(
  '../src/modules/staff/StaffDashboardRouter.tsx'
);
const { default: StudentSidebar } = await import(
  '../src/modules/student/components/StudentSidebar.tsx'
);
const { default: StudentSubPages } = await import(
  '../src/modules/student/components/StudentSubPages.tsx'
);
const { default: UserPortalShell } = await import('../src/components/UserPortalShell.tsx');

function assertCleanMarkup(html: string, label: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${label}: must not include animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${label}: must not include inline style attributes`);
}

beforeEach(() => {
  globalThis.localStorage.clear();
});

test('roleDutyCatalog defines all 27 institutional roles with verified duties, events, properties, portals, and permissions', () => {
  assert.equal(ALL_STAFF_ROLES.length, 21);
  assert.equal(ALL_CATALOG_ROLES.length, 27);
  assert.equal(ALL_ROLE_CATALOG_ENTRIES.length, 27);

  for (const staffRole of ALL_STAFF_ROLES) {
    assert.ok(ALL_CATALOG_ROLES.includes(staffRole), `Missing staff role in catalog: ${staffRole}`);
    const entry = ROLE_DUTY_CATALOG[staffRole];
    assert.equal(entry.category, 'STAFF');
    assert.deepEqual(
      entry.permissions.staffPermissions,
      ROLE_TO_STAFF_PERMISSIONS[staffRole],
      `staffPermissions mismatch for ${staffRole}`
    );
    assert.deepEqual(
      entry.permissions.documentPermissions,
      ROLE_DOCUMENT_PERMISSIONS[staffRole],
      `documentPermissions mismatch for ${staffRole}`
    );
    assert.deepEqual(
      entry.permissions.registrationPermissions,
      ROLE_REGISTRATION_PERMISSIONS[staffRole] ?? [],
      `registrationPermissions mismatch for ${staffRole}`
    );
  }

  const nonStaffRoles = ['STUDENT', 'PARENT', 'ALUMNI', 'CONTRACTOR', 'PARTNER', 'GUEST'] as const;
  for (const role of nonStaffRoles) {
    assert.ok(ALL_CATALOG_ROLES.includes(role), `Missing non-staff role in catalog: ${role}`);
  }

  assert.deepEqual(
    ROLE_DUTY_CATALOG.STUDENT.permissions.documentPermissions,
    STUDENT_DOCUMENT_PERMISSIONS
  );

  for (const entry of ALL_ROLE_CATALOG_ENTRIES) {
    assert.ok(entry.duties.length >= 2, `${entry.role} must define duties`);
    assert.ok(entry.events.length >= 1, `${entry.role} must define events`);
    assert.ok(entry.properties.length >= 4, `${entry.role} must define properties`);
    assert.ok(entry.accessiblePortals.length >= 1, `${entry.role} must define accessiblePortals`);
    assert.ok(entry.restrictedFrom.length >= 1, `${entry.role} must define restrictedFrom`);
    assert.ok(entry.permissions.portalCapabilities.length >= 2, `${entry.role} must define portalCapabilities`);
  }

  assert.equal(resolveCatalogEntryForRole('student').role, 'STUDENT');
  assert.equal(resolveCatalogEntryForRole('unknown-role').role, 'STUDENT');
  assert.equal(resolveCatalogRoleForPortalShell('examination'), 'EXAMINATIONS_OFFICER');
  assert.equal(resolveCatalogRoleForPortalShell('student'), 'STUDENT');
});

test('SSR rendering of AccountRoleWorkspace and all portal integrations is clean without anti-patterns', () => {
  const sampleRoles = [
    'ADMIN',
    'LECTURER',
    'EXAMINATIONS_OFFICER',
    'STUDENT',
    'PARENT',
    'GUEST',
  ] as const;

  for (const role of sampleRoles) {
    const html = renderToStaticMarkup(
      React.createElement(AccountRoleWorkspace, {
        roleOverride: role,
        onNavigatePath: () => {},
        onSwitchPortal: () => {},
      })
    );
    const escapedTitle = ROLE_DUTY_CATALOG[role].title.replaceAll('&', '&amp;');
    assert.ok(html.includes(escapedTitle), `Missing title for ${role}`);
    assert.ok(html.includes('Duties &amp; Workflows'));
    assert.ok(html.includes('Events &amp; Activity'));
    assert.ok(html.includes('Properties &amp; Scope'));
    assert.ok(html.includes('Permissions'));
    assert.ok(html.includes('Portals &amp; Modules'));
    assertCleanMarkup(html, `AccountRoleWorkspace(${role})`);
  }

  const umHtml = renderToStaticMarkup(
    React.createElement(PortalShellProvider, {
      currentRole: 'staff-users',
      children: React.createElement(StaffUserManagementPage),
    })
  );
  assert.ok(umHtml.includes('Role &amp; Permission Matrix'));
  assertCleanMarkup(umHtml, 'StaffUserManagementPage');

  const staffRouterHtml = renderToStaticMarkup(
    React.createElement(StaffDashboardRouter, {
      role: 'REGISTRAR',
      user: STAFF_ACCOUNTS.REGISTRAR,
      activePath: '/staff/duties',
      activeCampus: 'Nairobi Main Campus',
      onNavigate: () => {},
      onSwitchPortal: () => {},
    })
  );
  assert.ok(staffRouterHtml.includes('My Duties, Events, Properties &amp; Permissions'));
  assert.ok(staffRouterHtml.includes('Academic Registrar'));
  assertCleanMarkup(staffRouterHtml, 'StaffDashboardRouter(/staff/duties)');

  const studentSidebarHtml = renderToStaticMarkup(
    React.createElement(StudentSidebar, {
      activePage: 'role-capabilities',
      studentName: 'Amina Wanjiku',
      registrationNumber: 'HCA/2026/BCS/0104',
      sidebarOpen: true,
      sidebarCollapsed: false,
      onToggleCollapse: () => {},
      onCloseMobile: () => {},
      onNavigate: () => {},
      onLogoutClick: () => {},
    })
  );
  assert.ok(studentSidebarHtml.includes('My Duties &amp; Access'));
  assertCleanMarkup(studentSidebarHtml, 'StudentSidebar');

  const studentSubPagesHtml = renderToStaticMarkup(
    React.createElement(ThemeProvider, {
      children: React.createElement(StudentSubPages, {
        activeSection: 'role-capabilities',
        onBackToDashboard: () => {},
        onNavigate: () => {},
        onNotify: () => {},
        onRefresh: () => {},
        onSwitchPortal: () => {},
      }),
    })
  );
  assert.ok(studentSubPagesHtml.includes('My Duties, Events, Properties &amp; Permissions'));
  assert.ok(studentSubPagesHtml.includes('Student Candidate'));
  assertCleanMarkup(studentSubPagesHtml, 'StudentSubPages(role-capabilities)');

  const shellConfig = getPortalShellConfig('registrar');
  const shellHtml = renderToStaticMarkup(
    React.createElement(ThemeProvider, {
      children: React.createElement(PortalShellProvider, {
        currentRole: 'registrar',
        children: React.createElement(UserPortalShell, {
          config: shellConfig,
          onSwitchPortal: () => {},
          onLogout: () => {},
          children: React.createElement('div', null, 'Portal Workspace'),
        }),
      }),
    })
  );
  assert.ok(shellHtml.includes('Duties &amp; Permissions'));
  assertCleanMarkup(shellHtml, 'UserPortalShell');
});

test('requirePortalAuth rejects unauthenticated calls with 401 and buildCapabilitiesForAuthenticatedRequest isolates caller scope', async () => {
  let statusCode = 0;
  let jsonBody: unknown = null;
  let nextCalled = false;

  const unauthReq = { headers: {} } as unknown as Request;
  const mockRes = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return this;
    },
  } as unknown as Response;

  await requirePortalAuth(unauthReq, mockRes, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
  assert.deepEqual(jsonBody, {
    success: false,
    error: 'Authentication required. Please sign in to the HI-TECH College Portal.',
  });

  // Seed two staff audit entries for distinct actors to confirm strict caller isolation
  const store = getDb();
  const originalLogs = [...store.staffAuditLogs];
  try {
    store.staffAuditLogs.unshift(
      {
        id: 'audit-test-other',
        actorId: 'stf-other-999',
        actorName: 'Other User',
        actorRole: 'FINANCE_OFFICER',
        action: 'OTHER_USER_SECRET_ACTION',
        description: 'Private finance log for another staff member',
        isConfidential: true,
        createdAt: '2026-11-25T09:00:00.000Z',
      },
      {
        id: 'audit-test-caller',
        actorId: STAFF_ACCOUNTS.LECTURER.id,
        actorName: STAFF_ACCOUNTS.LECTURER.fullName,
        actorRole: 'LECTURER',
        action: 'CALLER_LECTURER_ACTION',
        description: 'Caller lecturer submitted attendance',
        isConfidential: false,
        createdAt: '2026-11-25T10:00:00.000Z',
      }
    );

    const lecturerReq = {
      staffUser: {
        ...STAFF_ACCOUNTS.LECTURER,
        registrationPermissions: [],
      },
    } as unknown as Request;

    const payload = await buildCapabilitiesForAuthenticatedRequest(lecturerReq);
    assert.equal(payload.role, 'LECTURER');
    assert.equal(payload.accountProperties.uid, STAFF_ACCOUNTS.LECTURER.id);
    assert.ok(payload.duties.length > 0);
    assert.ok(
      payload.liveEvents.some((evt) => evt.eventType === 'CALLER_LECTURER_ACTION'),
      'Expected caller own staff audit event to be included'
    );
    assert.equal(
      payload.liveEvents.some((evt) => evt.eventType === 'OTHER_USER_SECRET_ACTION'),
      false,
      'Must never leak another staff member audit event'
    );
  } finally {
    store.staffAuditLogs = originalLogs;
  }
});
