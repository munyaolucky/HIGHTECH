import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthProvider } from '../src/auth/AuthProvider.tsx';
import type { PortalUser } from '../src/auth/auth-types.ts';
import {
  getPortalType,
  getUserDashboardPath,
  hasAllUserPermissions,
  hasAnyUserPermission,
  hasAnyUserRole,
  hasUserPermission,
  isAccountActive,
  isStudentRole,
  resolveStaffPermissionsForRole,
} from '../src/auth/auth-utils.ts';
import { PermissionGate } from '../src/auth/PermissionGate.tsx';
import { ProtectedRoute } from '../src/auth/ProtectedRoute.tsx';
import { RoleGate } from '../src/auth/RoleGate.tsx';
import AccessDenied from '../src/components/portal/AccessDenied.tsx';
import SessionExpired from '../src/components/portal/SessionExpired.tsx';
import SessionLoading from '../src/components/portal/SessionLoading.tsx';
import ChangePasswordPage from '../src/modules/auth/ChangePasswordPage.tsx';
import CompleteProfilePage from '../src/modules/auth/CompleteProfilePage.tsx';
import PortalLoginPage from '../src/modules/auth/PortalLoginPage.tsx';
import StudentLoginPage from '../src/modules/auth/StudentLoginPage.tsx';
import CookieConsentBanner from '../src/website/components/CookieConsentBanner.tsx';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  canUseCookieCategory,
  getConsentNoticeReason,
  getConsentRecord,
  initializeAnalytics,
  initializeMarketing,
  loadOptionalScript,
  registerConsentGate,
  resetBlockedScriptEventsForTest,
  saveConsentPreferences,
  withdrawOptionalConsent,
} from '../src/lib/consent.ts';
import PublicGovernancePages from '../src/website/pages/PublicGovernancePages.tsx';
import ImplementationChecklistWorkspace from '../src/modules/catalogue/ImplementationChecklistWorkspace.tsx';
import { IMPLEMENTATION_CHECKLIST_AREAS } from '../src/data/implementationChecklist318.ts';

function makeUser(overrides: Partial<PortalUser> = {}): PortalUser {
  return {
    id: 'usr-1',
    uid: 'usr-1',
    fullName: 'Eng. Peter Kamau Njoroge',
    email: 'pkamau@hitech.ac.ke',
    registrationNumber: 'HCA/STAFF/2026/001',
    primaryRole: 'LECTURER',
    roles: ['LECTURER'],
    portalType: 'staff',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    requiresProfileCompletion: false,
    mfaEnabled: false,
    permissions: [
      'staff.portal.access',
      'lecturer.classes.read',
      'lecturer.attendance.mark',
    ],
    ...overrides,
  };
}

test('auth-utils classifies Student vs Staff roles and dashboard redirects cleanly', () => {
  const student = makeUser({
    id: 'stu-1',
    fullName: 'Amina Wanjiku',
    email: 'amina@students.hitech.ac.ke',
    registrationNumber: 'HCA/STU/2026/001',
    primaryRole: 'STUDENT',
    roles: ['STUDENT'],
    portalType: 'student',
    permissions: ['student.portal.access'],
  });

  const lecturer = makeUser();
  const forcedPasswordUser = makeUser({ mustChangePassword: true });
  const forcedProfileUser = makeUser({ requiresProfileCompletion: true });

  assert.equal(isStudentRole('STUDENT'), true);
  assert.equal(isStudentRole('LECTURER'), false);
  assert.equal(getPortalType('STUDENT'), 'student');
  assert.equal(getPortalType('REGISTRAR'), 'staff');

  assert.equal(getUserDashboardPath(null), '/portal/login');
  assert.equal(getUserDashboardPath(forcedPasswordUser), '/portal/change-password');
  assert.equal(getUserDashboardPath(forcedProfileUser), '/portal/complete-profile');
  assert.equal(getUserDashboardPath(student), '/portal/student');
  assert.equal(getUserDashboardPath(lecturer), '/portal/staff');

  assert.equal(isAccountActive(student), true);
  assert.equal(isAccountActive(makeUser({ accountStatus: 'SUSPENDED' })), false);
});

test('auth-utils enforces granular permissions and role membership checks', () => {
  const registrar = makeUser({
    primaryRole: 'REGISTRAR',
    roles: ['REGISTRAR'],
    permissions: ['staff.portal.access', 'registrar.records.manage', 'registrar.transcripts.issue'],
  });

  const admin = makeUser({
    primaryRole: 'ADMIN',
    roles: ['ADMIN'],
    permissions: ['*'],
  });

  assert.equal(hasUserPermission(registrar, 'registrar.transcripts.issue'), true);
  assert.equal(hasUserPermission(registrar, 'finance.mpesa.reconcile'), false);
  assert.equal(
    hasAnyUserPermission(registrar, ['finance.mpesa.reconcile', 'registrar.records.manage']),
    true
  );
  assert.equal(
    hasAllUserPermissions(registrar, ['registrar.records.manage', 'finance.mpesa.reconcile']),
    false
  );
  assert.equal(hasUserPermission(admin, 'finance.mpesa.reconcile'), true);
  assert.equal(hasAnyUserRole(registrar, ['ADMIN', 'REGISTRAR']), true);
  assert.equal(hasAnyUserRole(registrar, ['FINANCE_OFFICER']), false);

  const resolvedLecturer = resolveStaffPermissionsForRole('LECTURER', ['staff.profile.view', 'results.manage']);
  assert.equal(resolvedLecturer.includes('staff.profile.view'), true);
  assert.equal(resolvedLecturer.includes('results.manage'), true);
  assert.equal(resolvedLecturer.includes('lecturer.classes.read'), false);
  assert.deepEqual(resolveStaffPermissionsForRole('LECTURER'), []);
});

test('PermissionGate and RoleGate guard unauthorized UI elements cleanly', () => {
  const lecturer = makeUser();

  const allowedHtml = renderToStaticMarkup(
    React.createElement(
      PermissionGate,
      { permission: 'lecturer.attendance.mark', user: lecturer },
      React.createElement('span', null, 'Mark Attendance')
    )
  );
  assert.match(allowedHtml, /Mark Attendance/);

  const deniedHtml = renderToStaticMarkup(
    React.createElement(
      PermissionGate,
      {
        permission: 'admin.users.manage',
        user: lecturer,
        fallback: React.createElement('span', null, 'Restricted Control'),
      },
      React.createElement('span', null, 'Admin Delete Users')
    )
  );
  assert.doesNotMatch(deniedHtml, /Admin Delete Users/);
  assert.match(deniedHtml, /Restricted Control/);

  const roleHtml = renderToStaticMarkup(
    React.createElement(
      RoleGate,
      { roles: ['ADMIN', 'PRINCIPAL'], user: lecturer },
      React.createElement('span', null, 'Executive Only')
    )
  );
  assert.equal(roleHtml, '');
});

test('ProtectedRoute blocks wrong portal type and suspended accounts while allowing valid access', () => {
  const student = makeUser({
    primaryRole: 'STUDENT',
    roles: ['STUDENT'],
    portalType: 'student',
    permissions: ['student.portal.access'],
  });

  const wrongPortalHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ProtectedRoute,
        {
          portalType: 'staff',
          userOverride: student,
          onRedirect: () => {},
        },
        React.createElement('div', null, 'Secret Staff Screen')
      )
    )
  );
  assert.doesNotMatch(wrongPortalHtml, /Secret Staff Screen/);
  assert.match(wrongPortalHtml, /Wrong portal area/);

  const suspendedHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ProtectedRoute,
        {
          portalType: 'staff',
          userOverride: makeUser({ accountStatus: 'SUSPENDED' }),
          onRedirect: () => {},
        },
        React.createElement('div', null, 'Staff Screen')
      )
    )
  );
  assert.doesNotMatch(suspendedHtml, /Staff Screen/);
  assert.match(suspendedHtml, /Account not active/);

  const allowedHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ProtectedRoute,
        {
          portalType: 'staff',
          allowedRoles: ['LECTURER'],
          userOverride: makeUser(),
          onRedirect: () => {},
        },
        React.createElement('div', null, 'Authorized Staff Screen')
      )
    )
  );
  assert.match(allowedHtml, /Authorized Staff Screen/);
});

test('Auth and Portal status screens render unified Navy/Red/Cream UI without anti-patterns', () => {
  const loginHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(PortalLoginPage, {
        onSuccessRedirect: () => {},
        onNavigateForgotPassword: () => {},
        onNavigateActivate: () => {},
        onNavigateHome: () => {},
      })
    )
  );

  assert.match(loginHtml, /Integrated Digital Portal/);
  assert.match(loginHtml, /Email or Registration Number/);
  assert.match(loginHtml, /Sign in with Google Workspace/);
  assert.doesNotMatch(loginHtml, /animate-pulse/);
  assert.equal(/\sstyle="/i.test(loginHtml), false);

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
        React.createElement(CompleteProfilePage, {
          onNavigate: () => {},
          onNavigateHome: () => {},
        })
      )
    ),
    renderToStaticMarkup(React.createElement(SessionLoading)),
    renderToStaticMarkup(React.createElement(AccessDenied)),
    renderToStaticMarkup(React.createElement(SessionExpired, { onSignIn: () => {} })),
  ];

  for (const html of pages) {
    assert.equal(html.includes('animate-pulse'), false);
    assert.equal(/\sstyle="/i.test(html), false);
  }
});

test('StudentLoginPage and CookieConsentBanner render cleanly without anti-patterns', () => {
  const studentLoginHtml = renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(StudentLoginPage, {
        onSuccessRedirect: () => {},
        onNavigateForgotPassword: () => {},
        onNavigateActivate: () => {},
        onNavigateApply: () => {},
        onNavigateHome: () => {},
        onNavigatePrivacy: () => {},
        onNavigateTerms: () => {},
        onNavigateContact: () => {},
        onNavigateUnifiedLogin: () => {},
      })
    )
  );

  assert.match(studentLoginHtml, /Student Portal/);
  assert.match(studentLoginHtml, /Student Login/);
  assert.match(studentLoginHtml, /Registration Number/);
  assert.match(studentLoginHtml, /Sign in with Google/);
  assert.match(studentLoginHtml, /Forgot Password\?/);
  assert.match(studentLoginHtml, /Activate Account/);
  assert.match(studentLoginHtml, /Secure Portal/);
  assert.doesNotMatch(studentLoginHtml, /animate-pulse/);
  assert.equal(/\sstyle="/i.test(studentLoginHtml), false);

  const cookieHtml = renderToStaticMarkup(
    React.createElement(CookieConsentBanner, {
      onNavigate: () => {},
    })
  );

  assert.match(cookieHtml, /Cookie Settings/);
  assert.match(cookieHtml, /Your Privacy Matters/);
  assert.match(cookieHtml, /Accept All/);
  assert.match(cookieHtml, /Reject Optional/);
  assert.match(cookieHtml, /Customize/);
  assert.doesNotMatch(cookieHtml, /animate-pulse/);
  assert.equal(/\sstyle="/i.test(cookieHtml), false);
});

test('consent helpers fail closed when unconsented and persist granular categories cleanly', () => {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
  };

  const prevStorage = (globalThis as Record<string, unknown>).localStorage;
  (globalThis as Record<string, unknown>).localStorage = mockLocalStorage;

  try {
    assert.equal(getConsentRecord(), null);
    assert.equal(canUseCookieCategory('necessary'), true);
    assert.equal(canUseCookieCategory('functional'), false);
    assert.equal(canUseCookieCategory('analytics'), false);
    assert.equal(canUseCookieCategory('marketing'), false);
    assert.equal(initializeAnalytics(), false);

    store.set('hitech-display-preferences:stu-1', '{"theme":"dark"}');

    saveConsentPreferences({ functional: true, analytics: true, marketing: false });
    assert.equal(canUseCookieCategory('functional'), true);
    assert.equal(canUseCookieCategory('analytics'), true);
    assert.equal(canUseCookieCategory('marketing'), false);
    assert.equal(initializeAnalytics(), true);
    assert.equal(store.has('hitech-display-preferences:stu-1'), true);

    saveConsentPreferences({ functional: false, analytics: false, marketing: false });
    assert.equal(canUseCookieCategory('functional'), false);
    assert.equal(initializeAnalytics(), false);
    assert.equal(store.has('hitech-display-preferences:stu-1'), false);
  } finally {
    if (prevStorage === undefined) {
      delete (globalThis as Record<string, unknown>).localStorage;
    } else {
      (globalThis as Record<string, unknown>).localStorage = prevStorage;
    }
  }
});

test('script blocking gates, policy version enforcement, and consent withdrawal work deterministically', () => {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
  };

  const prevStorage = (globalThis as Record<string, unknown>).localStorage;
  (globalThis as Record<string, unknown>).localStorage = mockLocalStorage;
  resetBlockedScriptEventsForTest();

  let analyticsRuns = 0;
  let analyticsDeactivated = 0;
  let marketingRuns = 0;

  try {
    // 1. Outdated policy version triggers re-consent notice and fails closed
    store.set(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: '2025-01-old',
        functional: true,
        analytics: true,
        marketing: true,
        updatedAt: new Date().toISOString(),
      })
    );
    assert.equal(getConsentNoticeReason(), 'policy_updated');
    assert.equal(getConsentRecord(), null);
    assert.equal(initializeAnalytics(), false);
    assert.equal(initializeMarketing(), false);
    assert.equal(
      loadOptionalScript({
        id: 'test-ga',
        src: 'https://example.invalid/ga.js',
        category: 'analytics',
      }),
      false
    );

    // 2. Register consent gates while unconsented -> stay blocked
    const unregisterAnalytics = registerConsentGate({
      id: 'analytics-gate',
      category: 'analytics',
      activate: () => {
        analyticsRuns += 1;
      },
      deactivate: () => {
        analyticsDeactivated += 1;
      },
    });
    const unregisterMarketing = registerConsentGate({
      id: 'marketing-gate',
      category: 'marketing',
      activate: () => {
        marketingRuns += 1;
      },
    });
    assert.equal(analyticsRuns, 0);
    assert.equal(marketingRuns, 0);

    // 3. Approve analytics only -> analytics gate runs, marketing remains blocked
    saveConsentPreferences({ functional: true, analytics: true, marketing: false });
    assert.equal(getConsentNoticeReason(), null);
    assert.equal(analyticsRuns, 1);
    assert.equal(marketingRuns, 0);
    assert.equal(
      loadOptionalScript({
        id: 'test-ga',
        src: 'https://example.invalid/ga.js',
        category: 'analytics',
      }),
      true
    );

    // 4. Withdraw consent -> analytics deactivated immediately and cleared
    store.set('hitech.learning-canvas.v1.stu-1', '{"nodes":[]}');
    const withdrawn = withdrawOptionalConsent();
    assert.equal(withdrawn.version, CONSENT_VERSION);
    assert.equal(withdrawn.analytics, false);
    assert.equal(analyticsDeactivated, 1);
    assert.equal(store.has('hitech.learning-canvas.v1.stu-1'), false);

    unregisterAnalytics();
    unregisterMarketing();
  } finally {
    resetBlockedScriptEventsForTest();
    if (prevStorage === undefined) {
      delete (globalThis as Record<string, unknown>).localStorage;
    } else {
      (globalThis as Record<string, unknown>).localStorage = prevStorage;
    }
  }
});

test('Cookie Policy, Sitemap, 404 Governance views, and Master Checklist render cleanly', () => {
  for (const page of ['cookie-policy', 'sitemap', 'not-found'] as const) {
    const html = renderToStaticMarkup(
      React.createElement(PublicGovernancePages, {
        page,
        onNavigate: () => {},
        onOpenPortalModal: () => {},
        onOpenCookieSettings: () => {},
        onSwitchToERP: () => {},
      })
    );
    assert.equal(html.length > 200, true);
    assert.doesNotMatch(html, /animate-pulse/);
    assert.equal(/\sstyle="/i.test(html), false);
  }

  assert.equal(IMPLEMENTATION_CHECKLIST_AREAS.length, 15);
  const checklistHtml = renderToStaticMarkup(
    React.createElement(ImplementationChecklistWorkspace)
  );
  assert.match(checklistHtml, /Implementation Progress Register/);
  assert.match(checklistHtml, /Recommended Implementation Order/);
  assert.match(checklistHtml, /Reset Progress Tracker/);
  assert.doesNotMatch(checklistHtml, /animate-pulse/);
  assert.equal(/\sstyle="/i.test(checklistHtml), false);
});
