import {
  allocateEmployeeNumber,
  allocateStudentAdmissionNumber,
  getDb,
  saveDb,
  type PortalDatabase,
  type ServerStaffTask,
  type StaffAccountRecord,
  type StaffAuditLogRecord,
  type StaffTaskStatus,
} from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import {
  ROLE_DOCUMENT_PERMISSIONS,
} from '../documents/documents.permissions.ts';
import {
  hasStaffPermission,
  STAFF_PERMISSIONS,
  type StaffPermission,
  type StaffRoleCode,
} from './staff.permissions.ts';
import type {
  PaginatedResult,
  StaffDashboardSummary,
  StaffProfileDto,
} from './staff.types.ts';

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

function recordAudit(
  db: PortalDatabase,
  actor: AuthenticatedSessionUser,
  action: string,
  description: string,
  opts?: { isConfidential?: boolean; confidentialScope?: StaffAuditLogRecord['confidentialScope'] }
): void {
  db.staffAuditLogs.unshift({
    id: `sal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    description,
    departmentId: actor.departmentId ?? undefined,
    campusId: actor.campusId ?? undefined,
    isConfidential: Boolean(opts?.isConfidential),
    confidentialScope: opts?.confidentialScope,
    createdAt: new Date().toISOString(),
  });
}

function getVisibleActivities(db: PortalDatabase, user: AuthenticatedSessionUser): StaffAuditLogRecord[] {
  return db.staffAuditLogs.filter((entry) => {
    // Strictly exclude confidential counselling/welfare/HR private records from ordinary activity feeds
    if (entry.isConfidential) {
      if (entry.confidentialScope === 'WELFARE_COUNSELLING') {
        return user.role === 'STUDENT_AFFAIRS' || entry.actorId === user.id;
      }
      if (entry.confidentialScope === 'HR_PRIVATE') {
        return user.role === 'HR' || entry.actorId === user.id;
      }
      if (entry.confidentialScope === 'FINANCE_PRIVATE') {
        return user.role === 'FINANCE_OFFICER' || entry.actorId === user.id;
      }
      return entry.actorId === user.id;
    }

    if (user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      return true;
    }
    if (user.role === 'HOD') {
      return entry.departmentId === user.departmentId || entry.actorId === user.id;
    }
    return entry.actorId === user.id || entry.actorRole === user.role;
  });
}

function buildRoleStatistics(
  db: PortalDatabase,
  user: AuthenticatedSessionUser
): StaffDashboardSummary['statistics'] {
  const perms = user.permissions;
  const openTasks = db.tasks.filter(
    (t) => t.staffId === user.id && t.status !== 'COMPLETED'
  ).length;

  switch (user.role) {
    case 'ADMIN': {
      const pendingWorkflows = db.approvalWorkflows.filter((w) => w.status === 'PENDING').length;
      const activeCampuses = db.campuses.filter((c) => c.active).length;
      return [
        {
          key: 'staff_accounts',
          label: 'Staff Accounts',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.USERS_VIEW)
            ? db.staffAccounts.length
            : '—',
          description: `${db.staffInvitations.filter((i) => i.status === 'PENDING').length} pending invitations`,
        },
        {
          key: 'student_accounts',
          label: 'Student Accounts',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.USERS_VIEW)
            ? db.studentAccounts.length
            : '—',
          description: 'Registered portal student records',
        },
        {
          key: 'campuses',
          label: 'Active Campuses',
          value: activeCampuses,
          description: `${db.departments.length} departments configured`,
        },
        {
          key: 'workflows',
          label: 'Pending Approvals',
          value: pendingWorkflows,
          description: 'Governance & calendar workflows',
        },
      ];
    }

    case 'PRINCIPAL': {
      const awaitingDocApproval = db.documents.filter(
        (d) => d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW'
      ).length;
      const issuedDocs = db.documents.filter((d) => d.status === 'ISSUED').length;
      return [
        {
          key: 'departments',
          label: 'Academic & Admin Units',
          value: db.departments.length,
          description: `Across ${db.campuses.filter((c) => c.active).length} campuses`,
        },
        {
          key: 'staff_headcount',
          label: 'Authorized Staff',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.USERS_VIEW)
            ? db.staffAccounts.filter((s) => s.status === 'ACTIVE').length
            : '—',
          description: 'Active establishment roster',
        },
        {
          key: 'pending_approvals',
          label: 'Documents in Review',
          value: awaitingDocApproval,
          description: `${db.approvalWorkflows.filter((w) => w.status === 'PENDING').length} policy workflows pending`,
        },
        {
          key: 'issued_docs',
          label: 'Issued Official Documents',
          value: issuedDocs,
          description: 'Verified institutional issuances',
        },
      ];
    }

    case 'REGISTRAR': {
      const issuedDocs = db.documents.filter((d) => d.status === 'ISSUED').length;
      const pendingApprovals = db.documents.filter((d) => d.status === 'SUBMITTED').length;
      return [
        {
          key: 'registered_students',
          label: 'Student Registry',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.STUDENTS_VIEW)
            ? db.studentAccounts.length
            : '—',
          description: 'Verified student accounts',
        },
        {
          key: 'pending_approvals',
          label: 'Registry Approvals',
          value: pendingApprovals,
          description: 'Documents awaiting sign-off',
        },
        {
          key: 'issued_docs',
          label: 'Issued Transcripts & Letters',
          value: issuedDocs,
          description: 'HCA/DOC atomic sequence',
        },
        {
          key: 'open_tasks',
          label: 'Open Registrar Tasks',
          value: openTasks,
          description: 'Assigned action items',
        },
      ];
    }

    case 'FINANCE_OFFICER': {
      const feeDocs = db.documents.filter((d) => d.category === 'FEE_STATEMENT').length;
      return [
        {
          key: 'fee_statements',
          label: 'Fee Documents',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.FINANCE_VIEW) ? feeDocs : '—',
          description: 'Statements & clearance letters',
        },
        {
          key: 'student_accounts',
          label: 'Billable Student Accounts',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.STUDENTS_VIEW)
            ? db.studentAccounts.length
            : '—',
          description: 'Active fee-bearing profiles',
        },
        {
          key: 'reconciled_batches',
          label: 'M-Pesa Reconciliation',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.PAYMENTS_RECONCILE) ? 0 : '—',
          description: 'Live Daraja webhooks synced',
        },
        {
          key: 'open_tasks',
          label: 'Finance Tasks',
          value: openTasks,
          description: 'Assigned financial reviews',
        },
      ];
    }

    case 'HR': {
      const activeStaff = db.staffAccounts.filter((s) => s.status === 'ACTIVE').length;
      const hrDocs = db.documents.filter((d) => d.category === 'EMPLOYMENT_CONTRACT').length;
      const pendingInvites = db.staffInvitations.filter((i) => i.status === 'PENDING').length;
      return [
        {
          key: 'active_staff',
          label: 'Active Staff Roster',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.HR_VIEW) ? activeStaff : '—',
          description: 'Verified personnel files',
        },
        {
          key: 'pending_invites',
          label: 'Pending Onboarding Invites',
          value: pendingInvites,
          description: 'Awaiting staff activation',
        },
        {
          key: 'hr_contracts',
          label: 'Employment Documents',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.HR_MANAGE) ? hrDocs : '—',
          description: 'Appointments & contracts',
        },
        {
          key: 'open_tasks',
          label: 'HR Tasks',
          value: openTasks,
          description: 'Assigned HR actions',
        },
      ];
    }

    case 'LECTURER': {
      // Strictly scoped to this lecturer's assigned units and authored docs/tasks
      const assignedUnitCount = user.assignedUnits?.length ?? 0;
      const myDocs = db.documents.filter(
        (d) => d.ownerId === user.id || d.createdById === user.id
      ).length;
      return [
        {
          key: 'assigned_units',
          label: 'Assigned Teaching Units',
          value: hasStaffPermission(perms, STAFF_PERMISSIONS.ACADEMICS_VIEW)
            ? assignedUnitCount
            : '—',
          description: user.assignedUnits?.join(' · ') || 'No assigned units',
        },
        {
          key: 'authored_docs',
          label: 'My Academic Drafts',
          value: myDocs,
          description: 'Schedules, notes & submissions',
        },
        {
          key: 'open_tasks',
          label: 'Teaching Action Items',
          value: openTasks,
          description: 'Assigned to your unit roster',
        },
        {
          key: 'campus_scope',
          label: 'Campus Assignment',
          value: user.campus,
          description: user.department,
        },
      ];
    }

    case 'HOD': {
      // Strictly scoped to HOD's department
      const deptStaff = db.staffAccounts.filter(
        (s) => s.departmentId === user.departmentId
      ).length;
      const deptDocsPending = db.documents.filter(
        (d) => d.departmentId === user.departmentId && d.status === 'SUBMITTED'
      ).length;
      return [
        {
          key: 'dept_staff',
          label: 'Department Staff',
          value: deptStaff,
          description: user.department,
        },
        {
          key: 'dept_approvals',
          label: 'Department Approvals',
          value: deptDocsPending,
          description: 'Submitted by department staff',
        },
        {
          key: 'open_tasks',
          label: 'HOD Action Queue',
          value: openTasks,
          description: 'Department oversight tasks',
        },
        {
          key: 'campus_scope',
          label: 'Home Campus',
          value: user.campus,
          description: 'Authorized department boundary',
        },
      ];
    }

    default: {
      const myDocs = db.documents.filter(
        (d) => d.ownerId === user.id || d.createdById === user.id
      ).length;
      const deptDocs = user.departmentId
        ? db.documents.filter((d) => d.departmentId === user.departmentId).length
        : 0;
      return [
        {
          key: 'open_tasks',
          label: 'Open Assigned Tasks',
          value: openTasks,
          description: 'Active action items in your queue',
        },
        {
          key: 'my_documents',
          label: 'My Documents',
          value: myDocs,
          description: 'Owned or authored records',
        },
        {
          key: 'dept_documents',
          label: 'Department Documents',
          value: deptDocs,
          description: user.department,
        },
        {
          key: 'campus_scope',
          label: 'Authorized Campus',
          value: user.campus,
          description: user.roleTitle,
        },
      ];
    }
  }
}

export const staffService = {
  getProfile(user: AuthenticatedSessionUser): StaffProfileDto {
    return {
      id: user.id,
      employeeNumber: user.employeeNumber,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      officeLocation: user.officeLocation,
      bio: user.bio,
      role: user.role,
      roleTitle: user.roleTitle,
      department: user.department,
      campus: user.campus,
      allowedCampuses: user.allowedCampuses,
      restrictedFrom: user.restrictedFrom,
      assignedUnits: user.assignedUnits,
    };
  },

  updateOwnProfile(
    user: AuthenticatedSessionUser,
    patch: { phone?: string; officeLocation?: string; bio?: string }
  ): StaffProfileDto {
    const db = getDb();
    const record = db.staffAccounts.find((s) => s.id === user.id);
    if (!record) {
      throw new Error('Staff account record not found.');
    }
    if (patch.phone !== undefined) record.phone = patch.phone;
    if (patch.officeLocation !== undefined) record.officeLocation = patch.officeLocation;
    if (patch.bio !== undefined) record.bio = patch.bio;
    record.updatedAt = new Date().toISOString();

    recordAudit(
      db,
      user,
      'PROFILE_UPDATED',
      `Updated permitted staff profile contact/office details for ${user.employeeNumber}.`
    );
    saveDb(db);

    return {
      ...user,
      phone: record.phone,
      officeLocation: record.officeLocation,
      bio: record.bio,
    };
  },

  getDashboardSummary(user: AuthenticatedSessionUser): StaffDashboardSummary {
    const db = getDb();
    const statistics = buildRoleStatistics(db, user);
    const myTasks = db.tasks
      .filter((t) => t.staffId === user.id || t.role === user.role)
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueAt: t.dueAt,
        status: t.status,
      }));

    const activities = getVisibleActivities(db, user)
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        createdAt: a.createdAt,
      }));

    return {
      staff: {
        id: user.id,
        employeeNumber: user.employeeNumber,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        campus: user.campus,
      },
      statistics,
      tasks: myTasks,
      activities,
    };
  },

  listTasks(
    user: AuthenticatedSessionUser,
    opts: { page: number; pageSize: number; search: string; status: string }
  ): PaginatedResult<ServerStaffTask> {
    const db = getDb();
    const filtered = db.tasks.filter((t) => {
      if (t.staffId !== user.id && t.role !== user.role) return false;
      if (opts.status !== 'ALL' && t.status !== opts.status) return false;
      if (opts.search) {
        const q = opts.search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return paginate(filtered, opts.page, opts.pageSize);
  },

  createTask(
    user: AuthenticatedSessionUser,
    input: { title: string; description: string; dueAt?: string; status: StaffTaskStatus }
  ): ServerStaffTask {
    if (user.role === 'UNCONFIGURED') {
      throw new Error('Unconfigured account cannot create tasks.');
    }
    const db = getDb();
    const now = new Date().toISOString();
    const task: ServerStaffTask = {
      id: `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      staffId: user.id,
      role: user.role,
      title: input.title,
      description: input.description,
      dueAt: input.dueAt,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.unshift(task);
    recordAudit(db, user, 'TASK_CREATED', `Created task "${task.title}".`);
    saveDb(db);
    return task;
  },

  updateTaskStatus(
    user: AuthenticatedSessionUser,
    taskId: string,
    status: StaffTaskStatus
  ): ServerStaffTask | null {
    const db = getDb();
    const target = db.tasks.find(
      (t) => t.id === taskId && (t.staffId === user.id || t.role === user.role)
    );
    if (!target) return null;
    target.status = status;
    target.updatedAt = new Date().toISOString();
    recordAudit(db, user, 'TASK_UPDATED', `Updated task "${target.title}" to ${status}.`);
    saveDb(db);
    return target;
  },

  deleteTask(user: AuthenticatedSessionUser, taskId: string): boolean {
    const db = getDb();
    const idx = db.tasks.findIndex(
      (t) => t.id === taskId && (t.staffId === user.id || t.role === user.role)
    );
    if (idx === -1) return false;
    const [removed] = db.tasks.splice(idx, 1);
    recordAudit(db, user, 'TASK_DELETED', `Deleted task "${removed.title}".`);
    saveDb(db);
    return true;
  },

  listActivity(
    user: AuthenticatedSessionUser,
    opts: { page: number; pageSize: number }
  ): PaginatedResult<StaffAuditLogRecord> {
    const db = getDb();
    const visible = getVisibleActivities(db, user);
    return paginate(visible, opts.page, opts.pageSize);
  },

  listDirectory(
    user: AuthenticatedSessionUser,
    opts: { page: number; pageSize: number; search: string }
  ): PaginatedResult<
    Pick<
      StaffAccountRecord,
      'id' | 'employeeNumber' | 'fullName' | 'email' | 'role' | 'roleTitle' | 'department' | 'campus' | 'status'
    >
  > {
    const db = getDb();
    const canViewAll =
      hasStaffPermission(user.permissions, STAFF_PERMISSIONS.USERS_VIEW) ||
      hasStaffPermission(user.permissions, STAFF_PERMISSIONS.HR_VIEW);

    const scoped = db.staffAccounts.filter((acc) => {
      if (!canViewAll && acc.departmentId !== user.departmentId && acc.id !== user.id) {
        return false;
      }
      if (opts.search) {
        const q = opts.search.toLowerCase();
        return (
          acc.fullName.toLowerCase().includes(q) ||
          acc.employeeNumber.toLowerCase().includes(q) ||
          acc.roleTitle.toLowerCase().includes(q) ||
          acc.department.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const mapped = scoped.map((acc) => ({
      id: acc.id,
      employeeNumber: acc.employeeNumber,
      fullName: acc.fullName,
      email: acc.email,
      role: acc.role,
      roleTitle: acc.roleTitle,
      department: acc.department,
      campus: acc.campus,
      status: acc.status,
    }));

    return paginate(mapped, opts.page, opts.pageSize);
  },

  // ---------------- Administrator Governance Operations ----------------

  getAdminOverview(user: AuthenticatedSessionUser) {
    const db = getDb();
    return {
      staffAccounts: db.staffAccounts.map((s) => ({
        id: s.id,
        employeeNumber: s.employeeNumber,
        fullName: s.fullName,
        email: s.email,
        role: s.role,
        roleTitle: s.roleTitle,
        departmentId: s.departmentId,
        department: s.department,
        campusId: s.campusId,
        campus: s.campus,
        permissions: s.permissions,
        status: s.status,
      })),
      studentAccounts: db.studentAccounts,
      invitations: db.staffInvitations,
      campuses: db.campuses,
      departments: db.departments,
      workflows: db.approvalWorkflows,
      auditLogs: getVisibleActivities(db, user).slice(0, 25),
    };
  },

  createStaffInvitation(
    actor: AuthenticatedSessionUser,
    input: {
      fullName: string;
      email: string;
      role: StaffRoleCode;
      departmentId: string;
      campusId: string;
    }
  ) {
    const db = getDb();
    const campus = db.campuses.find((c) => c.id === input.campusId);
    const department = db.departments.find((d) => d.id === input.departmentId);
    if (!campus || !department) {
      throw new Error('Selected campus or department does not exist.');
    }
    if (
      db.staffAccounts.some((s) => s.email.toLowerCase() === input.email) ||
      db.staffInvitations.some(
        (i) => i.email.toLowerCase() === input.email && i.status === 'PENDING'
      )
    ) {
      throw new Error('An account or active invitation already exists for that email.');
    }

    const now = new Date().toISOString();
    const employeeNumber = allocateEmployeeNumber(db);
    const newStaffId = `usr-stf-${Date.now()}`;
    const roleTitle = input.role
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

    const invitation = {
      id: `inv-${Date.now()}`,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      departmentId: department.id,
      departmentName: department.name,
      campusId: campus.id,
      campusName: campus.name,
      status: 'PENDING' as const,
      invitedById: actor.id,
      invitedByName: actor.fullName,
      createdAt: now,
    };

    const staffRecord: StaffAccountRecord = {
      id: newStaffId,
      employeeNumber,
      fullName: input.fullName,
      email: input.email,
      phone: '+254 700 000 000',
      officeLocation: `${campus.name} · New Hire`,
      bio: `Invited ${roleTitle} in ${department.name}.`,
      role: input.role,
      roleTitle,
      departmentId: department.id,
      department: department.name,
      campusId: campus.id,
      campus: campus.name,
      allowedCampuses: [campus.name],
      permissions: [...getDefaultStaffPermsForRole(input.role)],
      documentPermissions: [...ROLE_DOCUMENT_PERMISSIONS[input.role]],
      restrictedFrom: ['Confidential Student Counselling Notes', 'Private HR Medical Files'],
      status: 'INVITED',
      updatedAt: now,
    };

    db.staffInvitations.unshift(invitation);
    db.staffAccounts.unshift(staffRecord);
    recordAudit(
      db,
      actor,
      'STAFF_INVITED',
      `Created staff invitation for ${input.fullName} (${employeeNumber}) as ${input.role}.`
    );
    saveDb(db);
    return { invitation, staff: staffRecord };
  },

  createStudentAccount(
    actor: AuthenticatedSessionUser,
    input: { fullName: string; email: string; programme: string; campusId: string }
  ) {
    const db = getDb();
    const campus = db.campuses.find((c) => c.id === input.campusId);
    if (!campus) throw new Error('Selected campus does not exist.');
    if (db.studentAccounts.some((s) => s.email.toLowerCase() === input.email)) {
      throw new Error('A student account with this email already exists.');
    }

    const student = {
      id: `stu-${Date.now()}`,
      admissionNumber: allocateStudentAdmissionNumber(db),
      fullName: input.fullName,
      email: input.email,
      programme: input.programme,
      campusId: campus.id,
      campusName: campus.name,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      createdById: actor.id,
    };
    db.studentAccounts.unshift(student);
    recordAudit(
      db,
      actor,
      'STUDENT_CREATED',
      `Provisioned student account ${student.admissionNumber} for ${student.fullName}.`
    );
    saveDb(db);
    return student;
  },

  updateStaffAccess(
    actor: AuthenticatedSessionUser,
    targetStaffId: string,
    input: {
      role: StaffRoleCode;
      permissions: StaffPermission[];
      status?: 'ACTIVE' | 'SUSPENDED';
    }
  ): StaffAccountRecord {
    const db = getDb();
    const target = db.staffAccounts.find((s) => s.id === targetStaffId);
    if (!target) {
      throw new Error('Target staff account not found.');
    }
    target.role = input.role;
    target.permissions = [...input.permissions];
    target.documentPermissions = [...ROLE_DOCUMENT_PERMISSIONS[input.role]];
    if (input.status) {
      target.status = input.status;
    }
    target.updatedAt = new Date().toISOString();

    recordAudit(
      db,
      actor,
      'STAFF_ACCESS_UPDATED',
      `Updated role/permissions for ${target.fullName} (${target.employeeNumber}) to ${input.role} with ${input.permissions.length} grants.`
    );
    saveDb(db);
    return target;
  },

  createCampus(
    actor: AuthenticatedSessionUser,
    input: { code: string; name: string; address: string; phone: string }
  ) {
    const db = getDb();
    if (db.campuses.some((c) => c.code === input.code || c.name.toLowerCase() === input.name.toLowerCase())) {
      throw new Error('A campus with this code or name already exists.');
    }
    const campus = {
      id: `cmp-${Date.now()}`,
      code: input.code,
      name: input.name,
      address: input.address,
      phone: input.phone,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.campuses.push(campus);
    recordAudit(db, actor, 'CAMPUS_CREATED', `Added accredited campus ${campus.name} (${campus.code}).`);
    saveDb(db);
    return campus;
  },

  createDepartment(
    actor: AuthenticatedSessionUser,
    input: { code: string; name: string; campusId: string }
  ) {
    const db = getDb();
    const campus = db.campuses.find((c) => c.id === input.campusId);
    if (!campus) throw new Error('Host campus not found.');
    const dept = {
      id: `dept-${Date.now()}`,
      code: input.code,
      name: input.name,
      campusId: campus.id,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.departments.push(dept);
    recordAudit(
      db,
      actor,
      'DEPARTMENT_CREATED',
      `Added department ${dept.name} (${dept.code}) at ${campus.name}.`
    );
    saveDb(db);
    return dept;
  },

  decideWorkflow(
    actor: AuthenticatedSessionUser,
    workflowId: string,
    input: { decision: 'APPROVED' | 'REJECTED'; comment: string }
  ) {
    const db = getDb();
    const wf = db.approvalWorkflows.find((w) => w.id === workflowId);
    if (!wf) throw new Error('Workflow record not found.');
    if (wf.status !== 'PENDING') throw new Error('Workflow has already been decided.');
    if (wf.requestedById === actor.id) {
      throw new Error('Self-approval is prohibited: another authorized reviewer must decide this workflow.');
    }
    wf.status = input.decision;
    wf.decisionComment = input.comment;
    wf.decidedById = actor.id;
    wf.decidedByName = actor.fullName;
    wf.decidedAt = new Date().toISOString();

    recordAudit(
      db,
      actor,
      `WORKFLOW_${input.decision}`,
      `${input.decision} workflow ${wf.reference} (${wf.title}).`
    );
    saveDb(db);
    return wf;
  },
};

import { ROLE_TO_STAFF_PERMISSIONS } from './staff.permissions.ts';
function getDefaultStaffPermsForRole(role: StaffRoleCode): StaffPermission[] {
  return ROLE_TO_STAFF_PERMISSIONS[role];
}
