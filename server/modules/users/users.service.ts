import crypto from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db, isPostgresConfigured } from '../../../src/db/index.ts';
import {
  campuses,
  departments,
  studentProfiles,
  userSessions,
  users,
} from '../../../src/db/schema.ts';
import {
  getDb,
  saveDb,
  type UserRegistrationRecord,
} from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import { STAFF_PERMISSIONS, type StaffRoleCode } from '../staff/staff.permissions.ts';
import {
  REGISTRATION_NUMBER_PREFIX,
  REGISTRATION_PERMISSIONS,
  type RegistrationCategory,
} from '../registration/registration.permissions.ts';

export type AccountCategory =
  | 'STUDENT'
  | 'STAFF'
  | 'PARENT'
  | 'ALUMNI'
  | 'CONTRACTOR'
  | 'PARTNER'
  | 'GUEST';

export type AccountStatus =
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'INVITATION_EXPIRED';

export interface PortalAccountDto {
  id: string;
  registrationNumber: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  category: AccountCategory;
  status: AccountStatus;
  roleNames: string[];
  campusName: string | null;
  departmentName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UsersDashboardResult {
  items: PortalAccountDto[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    total: number;
    active: number;
    pendingActivation: number;
    suspended: number;
    disabled: number;
  };
  permissions: string[];
}

export class UsersHttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Super Administrator',
  PRINCIPAL: 'College Principal',
  REGISTRAR: 'Academic Registrar',
  FINANCE_OFFICER: 'Finance Officer / Bursar',
  HR: 'HR & People Operations',
  LECTURER: 'Lecturer / Faculty',
  LIBRARIAN: 'College Librarian',
  IT_SUPPORT: 'IT Support Lead',
  HOD: 'Head of Department',
  ADMISSIONS_OFFICER: 'Admissions Officer',
  EXAMINATIONS_OFFICER: 'Examinations Officer',
  QUALITY_ASSURANCE: 'Quality Assurance Officer',
  STUDENT_AFFAIRS: 'Student Affairs & Welfare',
  HOSTEL_OFFICER: 'Hostel Warden',
  ICT_TECHNICIAN: 'ICT Lab Technician',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  STORES_OFFICER: 'Stores Officer',
  COMMUNICATIONS_OFFICER: 'Communications Officer',
  RECEPTIONIST: 'Front Office Receptionist',
  SECURITY_OFFICER: 'Security Officer',
  TRANSPORT_OFFICER: 'Transport Officer',
  STUDENT: 'Student Candidate',
  PARENT: 'Parent / Guardian',
  ALUMNI: 'Alumni Associate',
  CONTRACTOR: 'Campus Contractor',
  PARTNER: 'Industry Partner',
  GUEST: 'Guest Visitor',
};

function mapRoleToCategory(role: string): AccountCategory {
  const upper = role.toUpperCase();
  if (upper === 'STUDENT') return 'STUDENT';
  if (upper === 'PARENT') return 'PARENT';
  if (upper === 'ALUMNI') return 'ALUMNI';
  if (upper === 'CONTRACTOR') return 'CONTRACTOR';
  if (upper === 'PARTNER') return 'PARTNER';
  if (upper === 'GUEST') return 'GUEST';
  return 'STAFF';
}

function mapRawStatusToAccountStatus(rawStatus: string): AccountStatus {
  const upper = rawStatus.toUpperCase();
  if (
    upper === 'INVITED' ||
    upper === 'PENDING_ACTIVATION' ||
    upper === 'APPROVED' ||
    upper === 'SUBMITTED' ||
    upper === 'UNDER_REVIEW' ||
    upper === 'DRAFT'
  ) {
    return 'PENDING_ACTIVATION';
  }
  if (upper === 'SUSPENDED') return 'SUSPENDED';
  if (upper === 'DISABLED' || upper === 'ARCHIVED' || upper === 'REJECTED') {
    return 'DISABLED';
  }
  if (upper === 'INVITATION_EXPIRED') return 'INVITATION_EXPIRED';
  return 'ACTIVE';
}

function formatRoleLabel(role: string): string {
  const upper = role.toUpperCase();
  return ROLE_LABELS[upper] ?? upper.replace(/_/g, ' ');
}

function resolveActorUiPermissions(actor: AuthenticatedSessionUser): string[] {
  const perms = new Set<string>(['users.view', 'users.registration.view', 'users.roles.view']);
  const canCreate =
    actor.permissions.includes(STAFF_PERMISSIONS.USERS_CREATE) ||
    actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.CREATE);
  const canUpdate = actor.permissions.includes(STAFF_PERMISSIONS.USERS_UPDATE);

  if (canCreate) perms.add('users.registration.create');
  if (actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.APPROVE)) {
    perms.add('users.registration.approve');
  }
  if (canUpdate || actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.INVITATION_SEND)) {
    perms.add('users.registration.resend_invite');
  }
  if (canUpdate || actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.SUSPEND)) {
    perms.add('users.account.suspend');
  }
  if (canUpdate || actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.ACTIVATE)) {
    perms.add('users.account.reactivate');
  }
  if (actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.ROLES_ASSIGN)) {
    perms.add('users.roles.assign');
  }
  if (
    actor.permissions.includes(STAFF_PERMISSIONS.REPORTS_EXPORT) ||
    actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.EXPORT) ||
    actor.permissions.includes(STAFF_PERMISSIONS.USERS_VIEW)
  ) {
    perms.add('users.export');
  }
  if (actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.AUDIT_VIEW)) {
    perms.add('users.audit.view');
  }
  return Array.from(perms);
}

export function canAccessUsersModule(actor: AuthenticatedSessionUser): boolean {
  return (
    actor.permissions.includes(STAFF_PERMISSIONS.USERS_VIEW) ||
    actor.permissions.includes(STAFF_PERMISSIONS.USERS_CREATE) ||
    actor.permissions.includes(STAFF_PERMISSIONS.USERS_UPDATE) ||
    actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.VIEW)
  );
}

export function canManageUsersAction(
  actor: AuthenticatedSessionUser,
  regPermission: string
): boolean {
  return (
    actor.permissions.includes(STAFF_PERMISSIONS.USERS_UPDATE) ||
    actor.registrationPermissions.includes(regPermission)
  );
}

export function canCreateUserAccount(actor: AuthenticatedSessionUser): boolean {
  return (
    actor.permissions.includes(STAFF_PERMISSIONS.USERS_CREATE) ||
    actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.CREATE)
  );
}

function appendUserAudit(
  actor: AuthenticatedSessionUser,
  action: string,
  description: string
): void {
  const store = getDb();
  store.staffAuditLogs.unshift({
    id: `sal-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    description,
    departmentId: actor.departmentId ?? undefined,
    campusId: actor.campusId ?? undefined,
    isConfidential: false,
    createdAt: new Date().toISOString(),
  });
  saveDb(store);
}

export const usersService = {
  async listAccounts(
    actor: AuthenticatedSessionUser,
    filters: {
      page?: number;
      pageSize?: number;
      search?: string;
      category?: string;
      status?: string;
    }
  ): Promise<UsersDashboardResult> {
    if (!canAccessUsersModule(actor)) {
      throw new UsersHttpError(403, 'Access denied: requires users.view permission.');
    }

    const store = getDb();
    const byEmail = new Map<string, PortalAccountDto>();

    if (isPostgresConfigured()) {
      const [pgUsers, pgCampuses, pgDepartments, pgStudents] = await Promise.all([
        db.select().from(users).orderBy(desc(users.createdAt)),
        db.select().from(campuses),
        db.select().from(departments),
        db.select({ userId: studentProfiles.userId, phoneNumber: studentProfiles.phoneNumber }).from(studentProfiles),
      ]);

      const campusMap = new Map(pgCampuses.map((c) => [c.id, c.name]));
      const deptMap = new Map(pgDepartments.map((d) => [d.id, d.name]));
      const studentPhoneMap = new Map(pgStudents.map((s) => [s.userId, s.phoneNumber]));
      const staffByEmail = new Map(store.staffAccounts.map((s) => [s.email.toLowerCase(), s]));

      for (const row of pgUsers) {
        const emailLower = row.email.toLowerCase();
        const matchedStaff = staffByEmail.get(emailLower);
        const roleLabel = matchedStaff?.roleTitle ?? formatRoleLabel(row.primaryRole);
        byEmail.set(emailLower, {
          id: row.uid,
          registrationNumber: row.registrationNumber ?? null,
          fullName: row.fullName,
          email: row.email,
          phone: matchedStaff?.phone ?? studentPhoneMap.get(row.id) ?? null,
          category: mapRoleToCategory(row.primaryRole),
          status: mapRawStatusToAccountStatus(row.accountStatus),
          roleNames: [roleLabel],
          campusName:
            matchedStaff?.campus ?? (row.campusId ? campusMap.get(row.campusId) ?? row.campusId : null),
          departmentName:
            matchedStaff?.department ??
            (row.departmentId ? deptMap.get(row.departmentId) ?? row.departmentId : null),
          createdAt: row.createdAt.toISOString(),
          lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
        });
      }
    } else {
      for (const staff of store.staffAccounts) {
        byEmail.set(staff.email.toLowerCase(), {
          id: staff.id,
          registrationNumber: staff.employeeNumber,
          fullName: staff.fullName,
          email: staff.email,
          phone: staff.phone,
          category: 'STAFF',
          status: mapRawStatusToAccountStatus(staff.status),
          roleNames: [staff.roleTitle],
          campusName: staff.campus,
          departmentName: staff.department,
          createdAt: staff.updatedAt,
          lastLoginAt: null,
        });
      }
      for (const stu of store.studentAccounts) {
        const emailLower = stu.email.toLowerCase();
        if (!byEmail.has(emailLower)) {
          byEmail.set(emailLower, {
            id: stu.id,
            registrationNumber: stu.admissionNumber,
            fullName: stu.fullName,
            email: stu.email,
            phone: null,
            category: 'STUDENT',
            status: mapRawStatusToAccountStatus(stu.status),
            roleNames: ['Student Candidate'],
            campusName: stu.campusName,
            departmentName: stu.programme,
            createdAt: stu.createdAt,
            lastLoginAt: null,
          });
        }
      }
    }

    // Merge registration pipeline accounts (pending invitations, unactivated records, etc.)
    for (const reg of store.registrations) {
      if (reg.status === 'ARCHIVED') continue;
      const emailLower = reg.email.toLowerCase();
      if (byEmail.has(emailLower)) {
        const existing = byEmail.get(emailLower)!;
        if (!existing.phone && reg.phone) existing.phone = reg.phone;
        if (reg.portalAccessStatus === 'SUSPENDED') {
          existing.status = 'SUSPENDED';
        }
        continue;
      }

      const roleName = formatRoleLabel(reg.assignedRole ?? reg.proposedRole);
      let status: AccountStatus = mapRawStatusToAccountStatus(reg.status);
      if (reg.portalAccessStatus === 'SUSPENDED') status = 'SUSPENDED';
      else if (reg.status === 'ACTIVATED') status = 'ACTIVE';

      byEmail.set(emailLower, {
        id: reg.userAccountId ?? reg.id,
        registrationNumber: reg.registrationNumber ?? null,
        fullName: reg.fullName,
        email: reg.email,
        phone: reg.phone ?? null,
        category: reg.category,
        status,
        roleNames: [roleName],
        campusName: reg.campusName ?? null,
        departmentName: reg.departmentName ?? null,
        createdAt: reg.createdAt,
        lastLoginAt: reg.activatedAt ?? null,
      });
    }

    const allAccounts = Array.from(byEmail.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const summary = {
      total: allAccounts.length,
      active: allAccounts.filter((u) => u.status === 'ACTIVE').length,
      pendingActivation: allAccounts.filter(
        (u) => u.status === 'PENDING_ACTIVATION' || u.status === 'INVITATION_EXPIRED'
      ).length,
      suspended: allAccounts.filter((u) => u.status === 'SUSPENDED').length,
      disabled: allAccounts.filter((u) => u.status === 'DISABLED').length,
    };

    const search = filters.search?.trim().toLowerCase() ?? '';
    const category = filters.category?.trim().toUpperCase() ?? 'ALL';
    const status = filters.status?.trim().toUpperCase() ?? 'ALL';

    const filtered = allAccounts.filter((u) => {
      if (category && category !== 'ALL' && u.category !== category) return false;
      if (status && status !== 'ALL' && u.status !== status) return false;
      if (search) {
        const hay = `${u.fullName} ${u.email} ${u.registrationNumber ?? ''} ${u.roleNames.join(' ')} ${
          u.departmentName ?? ''
        }`.toLowerCase();
        return hay.includes(search);
      }
      return true;
    });

    const pageSize = Math.min(50, Math.max(1, Number(filters.pageSize ?? 10) || 10));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, Number(filters.page ?? 1) || 1), totalPages);
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      summary,
      permissions: resolveActorUiPermissions(actor),
    };
  },

  async createAccount(
    actor: AuthenticatedSessionUser,
    input: {
      fullName: string;
      email: string;
      phone?: string;
      category: RegistrationCategory;
      role?: string;
      campusId?: string;
      departmentId?: string;
    }
  ): Promise<PortalAccountDto> {
    if (!canCreateUserAccount(actor)) {
      throw new UsersHttpError(403, 'Access denied: requires users.create permission.');
    }

    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const phone = (input.phone ?? '').trim();
    if (!fullName || fullName.length < 3) {
      throw new UsersHttpError(400, 'Full name (at least 3 characters) is required.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new UsersHttpError(400, 'A valid email address is required.');
    }

    const store = getDb();
    const duplicateInStore =
      store.staffAccounts.some((s) => s.email.toLowerCase() === email) ||
      store.registrations.some(
        (r) => r.email.toLowerCase() === email && r.status !== 'REJECTED' && r.status !== 'ARCHIVED'
      );
    if (duplicateInStore) {
      throw new UsersHttpError(409, 'An account with this email already exists in the portal.');
    }

    if (isPostgresConfigured()) {
      const existingPg = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existingPg[0]) {
        throw new UsersHttpError(409, 'An account with this email already exists in Cloud SQL.');
      }
    }

    const campus =
      store.campuses.find((c) => c.id === input.campusId) ??
      store.campuses.find((c) => c.active) ??
      store.campuses[0];
    const department =
      store.departments.find((d) => d.id === input.departmentId) ?? store.departments[0];

    const category = input.category;
    const roleUpper = (input.role?.trim() || (category === 'STAFF' ? 'LECTURER' : category)).toUpperCase();
    const prefix = REGISTRATION_NUMBER_PREFIX[category] ?? 'HCA/USR';

    store.sequences.staffSeq += 1;
    const regNo = `${prefix}/2026/${String(store.sequences.staffSeq).padStart(3, '0')}`;
    const uid = `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const actorRoleCode: StaffRoleCode =
      actor.role === 'UNCONFIGURED' ? 'ADMIN' : actor.role;

    const regRecord: UserRegistrationRecord = {
      id: `reg-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      registrationNumber: regNo,
      category,
      subType: roleUpper,
      status: 'INVITED',
      fullName,
      email,
      phone: phone || '+254700000000',
      gender: 'UNSPECIFIED',
      dateOfBirth: '',
      nationality: 'Kenyan',
      identificationNumberMasked: 'Pending KYC',
      identificationNumberHash: crypto.createHash('sha256').update(uid).digest('hex'),
      identificationType: 'NATIONAL_ID',
      campusId: campus?.id ?? 'cmp-nairobi',
      campusName: campus?.name ?? 'Nairobi Main Campus',
      departmentId: department?.id ?? 'dept-computing',
      departmentName: department?.name ?? 'School of Computing & Informatics',
      userAccountId: uid,
      accountStatus: 'CREATED',
      accountCreatedAt: now,
      collegeRecordId: null,
      collegeRecordStatus: 'PENDING_VERIFICATION',
      portalAccessStatus: 'INVITED',
      proposedRole: roleUpper,
      assignedRole: roleUpper,
      assignedPermissions: [],
      mustChangePasswordOnFirstLogin: true,
      mustCompleteProfileOnFirstLogin: true,
      documents: [],
      odpcConsentAccepted: true,
      odpcConsentTimestamp: now,
      duplicateFlag: false,
      duplicateNotes: null,
      reviewerComment: null,
      createdById: actor.id,
      createdByName: actor.fullName,
      createdByRole: actorRoleCode,
      submittedAt: now,
      reviewedById: actor.id,
      reviewedByName: actor.fullName,
      reviewedAt: now,
      approvedById: actor.id,
      approvedByName: actor.fullName,
      approvedAt: now,
      activatedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    store.registrations.unshift(regRecord);
    saveDb(store);

    if (isPostgresConfigured()) {
      await db.insert(users).values({
        uid,
        email,
        registrationNumber: regNo,
        fullName,
        primaryRole: roleUpper,
        accountStatus: 'PENDING_ACTIVATION',
        passwordHash: null,
        mustChangePassword: true,
        requiresProfileCompletion: true,
        mfaEnabled: false,
        campusId: regRecord.campusId,
        departmentId: regRecord.departmentId,
      });
    }

    appendUserAudit(
      actor,
      'USER_ACCOUNT_REGISTERED',
      `Registered ${fullName} (${regNo} · ${roleUpper}) and queued activation invitation.`
    );

    return {
      id: uid,
      registrationNumber: regNo,
      fullName,
      email,
      phone: phone || null,
      category,
      status: 'PENDING_ACTIVATION',
      roleNames: [formatRoleLabel(roleUpper)],
      campusName: regRecord.campusName,
      departmentName: regRecord.departmentName,
      createdAt: now,
      lastLoginAt: null,
    };
  },

  async resendInvitation(actor: AuthenticatedSessionUser, targetId: string): Promise<{ message: string }> {
    if (!canManageUsersAction(actor, REGISTRATION_PERMISSIONS.INVITATION_SEND)) {
      throw new UsersHttpError(403, 'Access denied: insufficient permission to resend invitations.');
    }

    const store = getDb();
    let foundEmail: string | null = null;
    let foundName: string | null = null;

    if (isPostgresConfigured()) {
      const [pgUser] = await db
        .select()
        .from(users)
        .where(eq(users.uid, targetId))
        .limit(1);
      if (pgUser) {
        if (pgUser.accountStatus === 'ACTIVE') {
          throw new UsersHttpError(400, 'This account is already activated.');
        }
        foundEmail = pgUser.email;
        foundName = pgUser.fullName;
        await db
          .update(users)
          .set({ accountStatus: 'PENDING_ACTIVATION', updatedAt: new Date() })
          .where(eq(users.id, pgUser.id));
      }
    }

    const reg = store.registrations.find(
      (r) =>
        r.id === targetId ||
        r.userAccountId === targetId ||
        (foundEmail && r.email.toLowerCase() === foundEmail.toLowerCase())
    );
    if (reg) {
      foundEmail = reg.email;
      foundName = reg.fullName;
      reg.status = 'INVITED';
      reg.updatedAt = new Date().toISOString();
      saveDb(store);
    }

    if (!foundEmail) {
      throw new UsersHttpError(404, 'Portal account not found.');
    }

    appendUserAudit(
      actor,
      'RESEND_USER_INVITATION',
      `Resent activation invitation to ${foundName ?? foundEmail} (${foundEmail}).`
    );

    return { message: `Activation invitation resent to ${foundEmail}.` };
  },

  async suspendAccount(actor: AuthenticatedSessionUser, targetId: string): Promise<{ message: string }> {
    if (!canManageUsersAction(actor, REGISTRATION_PERMISSIONS.SUSPEND)) {
      throw new UsersHttpError(403, 'Access denied: insufficient permission to suspend accounts.');
    }

    if (targetId === actor.id) {
      throw new UsersHttpError(400, 'You cannot suspend your own currently signed-in account.');
    }

    const store = getDb();
    let matchedName: string | null = null;
    let matchedEmail: string | null = null;

    if (isPostgresConfigured()) {
      const [pgUser] = await db
        .select()
        .from(users)
        .where(eq(users.uid, targetId))
        .limit(1);
      if (pgUser) {
        if (pgUser.email.toLowerCase() === actor.email.toLowerCase()) {
          throw new UsersHttpError(400, 'You cannot suspend your own currently signed-in account.');
        }
        matchedName = pgUser.fullName;
        matchedEmail = pgUser.email;
        await db
          .update(users)
          .set({ accountStatus: 'SUSPENDED', updatedAt: new Date() })
          .where(eq(users.id, pgUser.id));
        await db
          .update(userSessions)
          .set({ revokedAt: new Date() })
          .where(eq(userSessions.userId, pgUser.id));
      }
    }

    const staff = store.staffAccounts.find(
      (s) => s.id === targetId || (matchedEmail && s.email.toLowerCase() === matchedEmail.toLowerCase())
    );
    if (staff) {
      if (staff.email.toLowerCase() === actor.email.toLowerCase()) {
        throw new UsersHttpError(400, 'You cannot suspend your own currently signed-in account.');
      }
      staff.status = 'SUSPENDED';
      matchedName = staff.fullName;
      matchedEmail = staff.email;
    }

    const reg = store.registrations.find(
      (r) =>
        r.id === targetId ||
        r.userAccountId === targetId ||
        (matchedEmail && r.email.toLowerCase() === matchedEmail.toLowerCase())
    );
    if (reg) {
      reg.portalAccessStatus = 'SUSPENDED';
      reg.updatedAt = new Date().toISOString();
      matchedName = matchedName ?? reg.fullName;
      matchedEmail = matchedEmail ?? reg.email;
    }

    if (!matchedEmail) {
      throw new UsersHttpError(404, 'Portal account not found.');
    }

    saveDb(store);
    appendUserAudit(
      actor,
      'SUSPEND_USER_ACCOUNT',
      `Suspended portal access for ${matchedName} (${matchedEmail}).`
    );

    return { message: `Account for ${matchedName} has been suspended.` };
  },

  async reactivateAccount(actor: AuthenticatedSessionUser, targetId: string): Promise<{ message: string }> {
    if (!canManageUsersAction(actor, REGISTRATION_PERMISSIONS.ACTIVATE)) {
      throw new UsersHttpError(403, 'Access denied: insufficient permission to reactivate accounts.');
    }

    const store = getDb();
    let matchedName: string | null = null;
    let matchedEmail: string | null = null;

    if (isPostgresConfigured()) {
      const [pgUser] = await db
        .select()
        .from(users)
        .where(eq(users.uid, targetId))
        .limit(1);
      if (pgUser) {
        matchedName = pgUser.fullName;
        matchedEmail = pgUser.email;
        await db
          .update(users)
          .set({ accountStatus: 'ACTIVE', updatedAt: new Date() })
          .where(eq(users.id, pgUser.id));
      }
    }

    const staff = store.staffAccounts.find(
      (s) => s.id === targetId || (matchedEmail && s.email.toLowerCase() === matchedEmail.toLowerCase())
    );
    if (staff) {
      staff.status = 'ACTIVE';
      matchedName = staff.fullName;
      matchedEmail = staff.email;
    }

    const reg = store.registrations.find(
      (r) =>
        r.id === targetId ||
        r.userAccountId === targetId ||
        (matchedEmail && r.email.toLowerCase() === matchedEmail.toLowerCase())
    );
    if (reg) {
      reg.portalAccessStatus = 'ACTIVATED';
      if (reg.status === 'SUSPENDED') reg.status = 'ACTIVATED';
      reg.updatedAt = new Date().toISOString();
      matchedName = matchedName ?? reg.fullName;
      matchedEmail = matchedEmail ?? reg.email;
    }

    if (!matchedEmail) {
      throw new UsersHttpError(404, 'Portal account not found.');
    }

    saveDb(store);
    appendUserAudit(
      actor,
      'REACTIVATE_USER_ACCOUNT',
      `Reactivated portal access for ${matchedName} (${matchedEmail}).`
    );

    return { message: `Account for ${matchedName} has been reactivated.` };
  },
};
