import assert from 'node:assert/strict';
import test from 'node:test';

import type { Request, Response, NextFunction } from 'express';

import {
  requirePermission,
  requireStaffPortalAuth,
} from '../server/middleware/auth.ts';

import {
  STAFF_PERMISSIONS,
} from '../server/modules/staff/staff.permissions.ts';

import {
  resolveStaffPermissionsForRole,
} from '../src/auth/auth-utils.ts';

import staffRoutes from '../server/modules/staff/staff.routes.ts';

test('server permissions do not inherit revoked role defaults', () => {
  const permissions = resolveStaffPermissionsForRole(
    'ADMIN',
    ['staff.dashboard.view']
  );

  assert.deepEqual(
    permissions,
    ['staff.dashboard.view']
  );

  assert.equal(
    permissions.includes(STAFF_PERMISSIONS.USERS_CREATE),
    false
  );
});

test('empty server permissions grant no permissions', () => {
  assert.deepEqual(
    resolveStaffPermissionsForRole('ADMIN', []),
    []
  );
});

test('missing server permissions fail closed', () => {
  assert.deepEqual(
    resolveStaffPermissionsForRole('ADMIN'),
    []
  );
});

test('duplicate permissions are removed', () => {
  assert.deepEqual(
    resolveStaffPermissionsForRole('LECTURER', [
      'staff.dashboard.view',
      'staff.dashboard.view',
      'staff.profile.view',
    ]),
    [
      'staff.dashboard.view',
      'staff.profile.view',
    ]
  );
});

test('staff dashboard permission rejects unauthorized users', () => {
  let statusCode = 200;
  let responseBody: unknown;
  let nextCalled = false;

  const req = {
    staffUser: {
      permissions: [],
    },
  } as unknown as Request;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;

  const next: NextFunction = () => {
    nextCalled = true;
  };

  requirePermission(
    STAFF_PERMISSIONS.DASHBOARD_VIEW
  )(req, res, next);

  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
  assert.ok(responseBody);
});

test('staff dashboard permission accepts assigned permissions', () => {
  let nextCalled = false;

  const req = {
    staffUser: {
      permissions: [
        STAFF_PERMISSIONS.DASHBOARD_VIEW,
      ],
    },
  } as unknown as Request;

  const res = {
    status() {
      return this;
    },
    json() {
      return this;
    },
  } as unknown as Response;

  const next: NextFunction = () => {
    nextCalled = true;
  };

  requirePermission(
    STAFF_PERMISSIONS.DASHBOARD_VIEW
  )(req, res, next);

  assert.equal(nextCalled, true);
});

test('staff session creation endpoint is removed', () => {
  const layers = (
    staffRoutes as unknown as {
      stack: Array<{
        route?: {
          path?: string;
          methods?: {
            post?: boolean;
          };
        };
      }>;
    }
  ).stack;

  const sessionCreationRoute = layers.find(
    (layer) =>
      layer.route?.path === '/session' &&
      layer.route.methods?.post
  );

  assert.equal(sessionCreationRoute, undefined);
});

test('staff session inspection endpoint remains available as GET', () => {
  const layers = (
    staffRoutes as unknown as {
      stack: Array<{
        route?: {
          path?: string;
          methods?: {
            get?: boolean;
          };
        };
      }>;
    }
  ).stack;

  const sessionRoute = layers.find(
    (layer) =>
      layer.route?.path === '/session' &&
      layer.route.methods?.get
  );

  assert.ok(sessionRoute);
});

test('requireStaffPortalAuth rejects missing or unauthenticated requests fail-closed', async () => {
  let statusCode = 200;
  const captured: { body: { code?: string; success?: boolean } | null } = {
    body: null,
  };
  let nextCalled = false;

  const req = { headers: {} } as unknown as Request;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: { code?: string; success?: boolean }) {
      captured.body = payload;
      return this;
    },
  } as unknown as Response;

  await requireStaffPortalAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 401);
  assert.equal(captured.body?.success, false);
  assert.equal(captured.body?.code, 'STAFF_PORTAL_AUTH_REQUIRED');
  assert.equal(nextCalled, false);
});
