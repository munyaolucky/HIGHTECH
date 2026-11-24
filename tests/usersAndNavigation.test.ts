import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import test, { after, beforeEach } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { eq } from 'drizzle-orm';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) {
      return { format: 'module', shortCircuit: true, source: 'export default {};' };
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

const dbFilePath = path.join(process.cwd(), '.data', 'hitech-portal-db.json');
const hadExistingDbFile = fs.existsSync(dbFilePath);
const originalDbFileContents = hadExistingDbFile ? fs.readFileSync(dbFilePath, 'utf8') : null;

const { db, isPostgresConfigured } = await import('../src/db/index.ts');
const { users } = await import('../src/db/schema.ts');
const { getDb } = await import('../server/data/store.ts');
const { STAFF_PERMISSIONS } = await import('../server/modules/staff/staff.permissions.ts');
const { ROLE_REGISTRATION_PERMISSIONS } = await import(
  '../server/modules/registration/registration.permissions.ts'
);
const { UsersHttpError, usersService } = await import(
  '../server/modules/users/users.service.ts'
);
const { PortalShellProvider } = await import('../src/context/PortalShellContext.tsx');
const { ThemeProvider } = await import('../src/context/ThemeContext.tsx');
const { getPortalShellConfig } = await import('../src/config/portalShellConfigs.ts');
const { default: StaffUserManagementPage, sanitizeCsvCell } = await import(
  '../src/modules/users/StaffUserManagementPage.tsx'
);
const { default: GlobalPortalSwitcherModal } = await import(
  '../src/components/GlobalPortalSwitcherModal.tsx'
);
const { default: StaffEventFeedPane } = await import(
  '../src/components/StaffEventFeedPane.tsx'
);
const { default: StaffIdentityDrawer } = await import(
  '../src/components/StaffIdentityDrawer.tsx'
);
const { default: UserPortalShell } = await import(
  '../src/components/UserPortalShell.tsx'
);

import type { AuthenticatedSessionUser } from '../server/middleware/auth.ts';

const createdTestEmails: string[] = [];

beforeEach(() => {
  globalThis.localStorage.clear();
});

after(async () => {
  if (isPostgresConfigured() && createdTestEmails.length > 0) {
    for (const email of createdTestEmails) {
      await db.delete(users).where(eq(users.email, email)).catch(() => {});
    }
  }
  if (hadExistingDbFile && originalDbFileContents !== null) {
    fs.writeFileSync(dbFilePath, originalDbFileContents, 'utf8');
  } else if (!hadExistingDbFile && fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
  }
});

function buildTestActor(role: 'ADMIN' | 'LECTURER'): AuthenticatedSessionUser {
  const store = getDb();
  const matched =
    store.staffAccounts.find((s) => s.role === role) ?? store.staffAccounts[0];
  return {
    id: matched.id,
    employeeNumber: matched.employeeNumber,
    fullName: matched.fullName,
    email: matched.email,
    phone: matched.phone,
    officeLocation: matched.officeLocation,
    bio: matched.bio,
    role: matched.role,
    roleTitle: matched.roleTitle,
    departmentId: matched.departmentId,
    department: matched.department,
    campusId: matched.campusId,
    campus: matched.campus,
    allowedCampuses: matched.allowedCampuses,
    permissions:
      role === 'ADMIN'
        ? matched.permissions
        : matched.permissions.filter(
            (p) =>
              p !== STAFF_PERMISSIONS.USERS_VIEW &&
              p !== STAFF_PERMISSIONS.USERS_CREATE &&
              p !== STAFF_PERMISSIONS.USERS_UPDATE
          ),
    documentPermissions: matched.documentPermissions,
    registrationPermissions:
      role === 'ADMIN' ? [...(ROLE_REGISTRATION_PERMISSIONS.ADMIN ?? [])] : [],
    restrictedFrom: matched.restrictedFrom,
  };
}

function assertCleanMarkup(html: string, label: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${label}: must not include animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${label}: must not include inline style attributes`);
}

test('usersService enforces RBAC, self-suspension guard, duplicate checks, and lifecycle transitions', async () => {
  const adminActor = buildTestActor('ADMIN');
  const lecturerActor = buildTestActor('LECTURER');

  // Unprivileged actor cannot list or create accounts
  await assert.rejects(
    () => usersService.listAccounts(lecturerActor, { page: 1, pageSize: 10 }),
    (err: unknown) => err instanceof UsersHttpError && err.statusCode === 403
  );
  await assert.rejects(
    () =>
      usersService.createAccount(lecturerActor, {
        fullName: 'Unauthorized User',
        email: 'unauth@hitech.ac.ke',
        category: 'STAFF',
      }),
    (err: unknown) => err instanceof UsersHttpError && err.statusCode === 403
  );

  // Admin lists accounts cleanly
  const listed = await usersService.listAccounts(adminActor, { page: 1, pageSize: 10 });
  assert.ok(listed.total >= 1);
  assert.ok(listed.permissions.includes('users.view'));
  assert.ok(listed.permissions.includes('users.registration.create'));

  // Self-suspension is blocked
  await assert.rejects(
    () => usersService.suspendAccount(adminActor, adminActor.id),
    (err: unknown) => err instanceof UsersHttpError && err.statusCode === 400
  );

  // Create invalid email rejected
  await assert.rejects(
    () =>
      usersService.createAccount(adminActor, {
        fullName: 'Valid Name',
        email: 'not-an-email',
        category: 'STAFF',
      }),
    (err: unknown) => err instanceof UsersHttpError && err.statusCode === 400
  );

  // Create disposable test account -> resend invite -> suspend -> reactivate
  const uniqueEmail = `test-um-${Date.now()}@hitech.ac.ke`;
  createdTestEmails.push(uniqueEmail);

  const created = await usersService.createAccount(adminActor, {
    fullName: 'Dr. Test Invigilator',
    email: uniqueEmail,
    phone: '+254712000999',
    category: 'STAFF',
    role: 'LECTURER',
    campusId: 'cmp-nairobi',
    departmentId: 'dept-computing',
  });
  assert.equal(created.email, uniqueEmail);
  assert.equal(created.status, 'PENDING_ACTIVATION');
  assert.ok(created.registrationNumber?.startsWith('HCA/STAFF/'));

  // Duplicate email returns 409
  await assert.rejects(
    () =>
      usersService.createAccount(adminActor, {
        fullName: 'Dr. Test Invigilator Duplicate',
        email: uniqueEmail,
        category: 'STAFF',
      }),
    (err: unknown) => err instanceof UsersHttpError && err.statusCode === 409
  );

  // Resend invitation succeeds
  const resent = await usersService.resendInvitation(adminActor, created.id);
  assert.ok(resent.message.includes(uniqueEmail));

  // Lecturer cannot suspend
  await assert.rejects(
    () => usersService.suspendAccount(lecturerActor, created.id),
    (err: unknown) => err instanceof UsersHttpError && err.statusCode === 403
  );

  // Suspend then reactivate
  const suspended = await usersService.suspendAccount(adminActor, created.id);
  assert.ok(suspended.message.includes('suspended'));

  const filteredSuspended = await usersService.listAccounts(adminActor, {
    search: uniqueEmail,
    status: 'SUSPENDED',
  });
  assert.equal(filteredSuspended.items[0]?.status, 'SUSPENDED');

  const reactivated = await usersService.reactivateAccount(adminActor, created.id);
  assert.ok(reactivated.message.includes('reactivated'));

  const filteredActive = await usersService.listAccounts(adminActor, {
    search: uniqueEmail,
    status: 'ACTIVE',
  });
  assert.equal(filteredActive.items[0]?.status, 'ACTIVE');
});

test('sanitizeCsvCell neutralizes spreadsheet formula injection payloads', () => {
  assert.equal(sanitizeCsvCell('=cmd|"/C calc"!A0'), '"\'=cmd|""/C calc""!A0"');
  assert.equal(sanitizeCsvCell('+SUM(A1:A2)'), '"\'+SUM(A1:A2)"');
  assert.equal(sanitizeCsvCell('-1+1'), '"\'-1+1"');
  assert.equal(sanitizeCsvCell('@HYPERLINK("http://evil")'), '"\'@HYPERLINK(""http://evil"")"');
  assert.equal(sanitizeCsvCell('Amina Wanjiku'), '"Amina Wanjiku"');
});

test('SSR rendering of User Management, Global Switcher, Staff Event Feed, Identity Drawer, and Portal Shell is clean', () => {
  const umHtml = renderToStaticMarkup(
    React.createElement(PortalShellProvider, {
      currentRole: 'staff-users',
      children: React.createElement(StaffUserManagementPage),
    })
  );
  assert.ok(umHtml.includes('User Management'));
  assert.ok(umHtml.includes('User Accounts Registry'));
  assert.ok(umHtml.includes('Role &amp; Permission Matrix'));
  assertCleanMarkup(umHtml, 'StaffUserManagementPage');

  const umSource = fs.readFileSync(
    path.join(process.cwd(), 'src/modules/users/StaffUserManagementPage.tsx'),
    'utf8'
  );
  assert.equal(umSource.includes('MOCK_FALLBACK_ACCOUNTS'), false);
  assert.equal(umSource.includes('localAccountsState'), false);
  assert.equal(umSource.includes('window.confirm'), false);
  assert.equal(umSource.includes('window.alert'), false);
  assert.equal(umSource.includes('window.location.href'), false);

  const switcherHtml = renderToStaticMarkup(
    React.createElement(GlobalPortalSwitcherModal, {
      isOpen: true,
      onClose: () => {},
      currentRole: 'registrar',
      onSelectRole: () => {},
    })
  );
  assert.ok(switcherHtml.includes('Institutional Portal Hub'));
  assert.ok(switcherHtml.includes('Staff User Management'));
  assertCleanMarkup(switcherHtml, 'GlobalPortalSwitcherModal');

  const feedHtml = renderToStaticMarkup(
    React.createElement(StaffEventFeedPane, {
      isOpen: true,
      onClose: () => {},
      currentRole: 'registrar',
      onNavigateTab: () => {},
      onSwitchPortal: () => {},
    })
  );
  assert.ok(feedHtml.includes('Staff Channel &amp; Event Feed'));
  assert.ok(feedHtml.includes('Dr. Kiprop Chemweno'));
  assertCleanMarkup(feedHtml, 'StaffEventFeedPane');

  const drawerHtml = renderToStaticMarkup(
    React.createElement(StaffIdentityDrawer, {
      isOpen: true,
      onClose: () => {},
      currentRole: 'registrar',
      onSwitchPortal: () => {},
      onLogout: () => {},
    })
  );
  assert.ok(drawerHtml.includes('Staff Identity &amp; Channel Hub'));
  assert.ok(drawerHtml.includes('Institutional Staff Personas'));
  assertCleanMarkup(drawerHtml, 'StaffIdentityDrawer');

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
  assert.ok(shellHtml.includes('Academic Registrar Dashboard'));
  assert.ok(shellHtml.includes('Channel Alerts'));
  assert.ok(shellHtml.includes('Open Staff Channel Event Feed'));
  assert.ok(shellHtml.includes('Open Staff Identity &amp; Channel Hub'));
  assertCleanMarkup(shellHtml, 'UserPortalShell');
});
