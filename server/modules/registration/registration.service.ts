import {
  getDb,
  saveDb,
  type PortalDatabase,
  type UserRegistrationRecord,
} from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import { ROLE_TO_STAFF_PERMISSIONS, type StaffRoleCode } from '../staff/staff.permissions.ts';
import {
  appendRegistrationAudit,
  pushReviewerEvent,
  registrationApprovalService,
} from './registration.approval.service.ts';
import { registrationInvitationService } from './registration.invitation.service.ts';
import {
  CATEGORY_APPROVE_ROLES,
  CATEGORY_REGISTER_ROLES,
  REGISTRATION_CATEGORIES,
  REGISTRATION_NUMBER_PREFIX,
  REGISTRATION_PERMISSIONS,
  type RegistrationCategory,
} from './registration.permissions.ts';
import {
  canRegisterCategory,
  canViewRegistrationRecord,
  hashIdentificationNumber,
  maskIdentificationNumber,
  sanitizeRecordForViewer,
  type SanitizedRegistrationRecord,
} from './registration.policy.ts';
import {
  parseCsvRows,
  type ActivationConfirmInput,
  type RegistrationPayloadInput,
  type ReviewDecisionInput,
  type RoleAssignInput,
} from './registration.schemas.ts';
import {
  RegistrationHttpError,
  type DuplicateMatchInfo,
  type RegistrationHistoryResponse,
  type RegistrationListFilters,
  type RegistrationLookupsPayload,
} from './registration.types.ts';

function normalizePhoneTail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function defaultRoleForCategory(category: RegistrationCategory, proposedRole?: string): string {
  if (proposedRole && proposedRole.trim()) return proposedRole.trim().toUpperCase();
  switch (category) {
    case 'STUDENT':
      return 'STUDENT';
    case 'STAFF':
      return 'LECTURER';
    case 'PARENT':
      return 'PARENT';
    case 'ALUMNI':
      return 'ALUMNI';
    case 'CONTRACTOR':
      return 'CONTRACTOR';
    case 'PARTNER':
      return 'PARTNER';
    case 'GUEST':
      return 'GUEST';
  }
}

function defaultPortalPermissionsForRole(role: string): string[] {
  const upper = role.toUpperCase();
  if (upper === 'STUDENT') return ['student.portal.access', 'student.units.register', 'student.results.view'];
  if (upper === 'PARENT') return ['parent.portal.view_linked_student', 'parent.fees.view'];
  if (upper === 'ALUMNI') return ['alumni.portal.access', 'alumni.transcript_requests.create'];
  if (upper === 'CONTRACTOR') return ['contractor.workorders.view', 'contractor.campus_pass.view'];
  if (upper === 'PARTNER') return ['partner.mou.view'];
  if (upper === 'GUEST') return ['guest.visitor_pass.view'];
  if (upper in ROLE_TO_STAFF_PERMISSIONS) {
    return [...ROLE_TO_STAFF_PERMISSIONS[upper as StaffRoleCode]];
  }
  return ['portal.basic.access'];
}

function findDuplicateMatches(
  db: PortalDatabase,
  email: string,
  phone: string,
  idNumber?: string,
  excludeId?: string
): DuplicateMatchInfo[] {
  const matches: DuplicateMatchInfo[] = [];
  const normEmail = email.trim().toLowerCase();
  const phoneTail = normalizePhoneTail(phone);
  const idHash = idNumber ? hashIdentificationNumber(idNumber) : null;

  for (const reg of db.registrations) {
    if (excludeId && reg.id === excludeId) continue;
    if (reg.status === 'ARCHIVED' || reg.status === 'REJECTED') continue;
    const reasons: string[] = [];
    if (normEmail && reg.email.toLowerCase() === normEmail) reasons.push('Email');
    if (phoneTail && phoneTail.length >= 7 && normalizePhoneTail(reg.phone) === phoneTail) {
      reasons.push('Phone');
    }
    if (idHash && reg.identificationNumberHash === idHash) reasons.push('National ID / Passport');
    if (reasons.length > 0) {
      matches.push({
        matchedRegistrationId: reg.id,
        matchedName: reg.fullName,
        matchedEmail: reg.email,
        matchedReason: reasons.join(' + '),
        matchedStatus: reg.status,
      });
    }
  }

  for (const staff of db.staffAccounts) {
    if (normEmail && staff.email.toLowerCase() === normEmail) {
      matches.push({
        matchedRegistrationId: null,
        matchedName: staff.fullName,
        matchedEmail: staff.email,
        matchedReason: `Existing Staff Account (${staff.employeeNumber})`,
        matchedStatus: staff.status,
      });
    }
  }

  for (const stu of db.studentAccounts) {
    if (normEmail && stu.email.toLowerCase() === normEmail) {
      matches.push({
        matchedRegistrationId: null,
        matchedName: stu.fullName,
        matchedEmail: stu.email,
        matchedReason: `Existing Student Account (${stu.admissionNumber})`,
        matchedStatus: stu.status,
      });
    }
  }

  return matches;
}

export const registrationService = {
  getLookups(actor: AuthenticatedSessionUser): RegistrationLookupsPayload {
    const db = getDb();
    const allowedCampuses = db.campuses.filter(
      (c) =>
        c.active &&
        (actor.allowedCampuses.length === 0 || actor.allowedCampuses.includes(c.name))
    );
    const allowedRegisterCategories = REGISTRATION_CATEGORIES.filter(
      (cat) =>
        actor.role !== 'UNCONFIGURED' &&
        actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.CREATE) &&
        CATEGORY_REGISTER_ROLES[cat].includes(actor.role)
    );
    const allowedApproveCategories = REGISTRATION_CATEGORIES.filter(
      (cat) =>
        actor.role !== 'UNCONFIGURED' &&
        actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.APPROVE) &&
        CATEGORY_APPROVE_ROLES[cat].includes(actor.role)
    );
    return {
      campuses: allowedCampuses.length > 0 ? allowedCampuses : db.campuses.filter((c) => c.active),
      departments: db.departments.filter((d) => d.active),
      programmes: db.programmes.filter((p) => p.active),
      intakes: db.intakes.filter((i) => i.active),
      allowedRegisterCategories,
      allowedApproveCategories,
      registrationPermissions: actor.registrationPermissions,
      numberFormats: REGISTRATION_NUMBER_PREFIX,
    };
  },

  getWorkspaceOverview(
    actor: AuthenticatedSessionUser,
    filters: RegistrationListFilters
  ) {
    const db = getDb();
    const scoped = db.registrations.filter((r) => canViewRegistrationRecord(actor, r));

    const summary = {
      total: scoped.length,
      drafts: scoped.filter((r) => r.status === 'DRAFT' || r.status === 'CHANGES_REQUESTED').length,
      pendingApproval: scoped.filter(
        (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
      ).length,
      approvedAwaitingInvite: scoped.filter((r) => r.status === 'APPROVED').length,
      invitedPendingActivation: scoped.filter((r) => r.status === 'INVITED').length,
      activated: scoped.filter((r) => r.status === 'ACTIVATED').length,
      suspendedOrRejected: scoped.filter(
        (r) => r.status === 'SUSPENDED' || r.status === 'REJECTED'
      ).length,
      duplicateAlerts: scoped.filter((r) => r.duplicateFlag).length,
      byCategory: REGISTRATION_CATEGORIES.reduce<Record<RegistrationCategory, number>>(
        (acc, cat) => {
          acc[cat] = scoped.filter((r) => r.category === cat).length;
          return acc;
        },
        {
          STUDENT: 0,
          STAFF: 0,
          PARENT: 0,
          ALUMNI: 0,
          CONTRACTOR: 0,
          PARTNER: 0,
          GUEST: 0,
        }
      ),
    };

    const filteredAll = scoped
      .filter((r) => {
        if (filters.category !== 'ALL' && r.category !== filters.category) return false;
        if (filters.status !== 'ALL' && r.status !== filters.status) return false;
        if (filters.campusId && r.campusId !== filters.campusId) return false;
        if (filters.departmentId && r.departmentId !== filters.departmentId) return false;
        if (filters.search) {
          const hay = [
            r.fullName,
            r.email,
            r.phone,
            r.registrationNumber ?? '',
            r.campusName,
            r.departmentName ?? '',
            r.proposedRole,
            r.category,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(filters.search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const start = (filters.page - 1) * filters.pageSize;
    const paged = filteredAll
      .slice(start, start + filters.pageSize)
      .map((r) => sanitizeRecordForViewer(actor, r));

    const lookups = this.getLookups(actor);
    const visibleInvitations = db.activationInvitations
      .filter((inv) => scoped.some((r) => r.id === inv.registrationId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      summary,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: filteredAll.length,
        totalPages: Math.max(1, Math.ceil(filteredAll.length / filters.pageSize)),
      },
      items: paged,
      invitations: visibleInvitations,
      references: {
        campuses: lookups.campuses,
        departments: lookups.departments,
        programmes: lookups.programmes,
        intakes: lookups.intakes,
        allowedRegisterCategories: lookups.allowedRegisterCategories,
        allowedApproveCategories: lookups.allowedApproveCategories,
        registrationPermissions: lookups.registrationPermissions,
        numberFormats: lookups.numberFormats,
      },
    };
  },

  getById(actor: AuthenticatedSessionUser, id: string): SanitizedRegistrationRecord {
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(
        403,
        'Access denied: your role cannot inspect this registration record.'
      );
    }
    return sanitizeRecordForViewer(actor, record);
  },

  getHistory(actor: AuthenticatedSessionUser, id: string): RegistrationHistoryResponse {
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(
        403,
        'Access denied: your role cannot inspect history for this record.'
      );
    }
    const auditLogs = db.registrationAuditLogs.filter((log) => {
      if (log.registrationId !== id) return false;
      if (log.isConfidential && actor.role !== 'HR' && actor.role !== 'PRINCIPAL') {
        return false;
      }
      return true;
    });
    return {
      registrationId: record.id,
      registrationNumber: record.registrationNumber,
      status: record.status,
      reviewerHistory: record.reviewerHistory ?? [],
      auditLogs,
    };
  },

  checkDuplicates(email: string, phone: string, identificationNumber?: string) {
    const db = getDb();
    const matches = findDuplicateMatches(db, email, phone, identificationNumber);
    return {
      hasDuplicates: matches.length > 0,
      matches,
    };
  },

  listDuplicateClusters(actor: AuthenticatedSessionUser) {
    const db = getDb();
    const scoped = db.registrations.filter((r) => canViewRegistrationRecord(actor, r));
    const clusters: {
      record: SanitizedRegistrationRecord;
      matches: DuplicateMatchInfo[];
    }[] = [];

    for (const reg of scoped) {
      if (reg.status === 'ARCHIVED' || reg.status === 'REJECTED') continue;
      const matches = findDuplicateMatches(db, reg.email, reg.phone, undefined, reg.id).filter(
        (m) => m.matchedRegistrationId !== null || reg.duplicateFlag
      );
      if (reg.duplicateFlag || matches.length > 0) {
        clusters.push({
          record: sanitizeRecordForViewer(actor, reg),
          matches,
        });
      }
    }

    return clusters;
  },

  createRegistration(
    actor: AuthenticatedSessionUser,
    input: RegistrationPayloadInput
  ): SanitizedRegistrationRecord {
    const authCheck = canRegisterCategory(actor, input.category, input.proposedRole);
    if (!authCheck.allowed) {
      throw new RegistrationHttpError(403, authCheck.reason ?? 'Unauthorized registration category.');
    }

    const db = getDb();
    const campus = db.campuses.find((c) => c.id === input.campusId && c.active);
    if (!campus) {
      throw new RegistrationHttpError(400, 'Selected campus does not exist or is inactive.');
    }
    if (actor.allowedCampuses.length > 0 && !actor.allowedCampuses.includes(campus.name)) {
      throw new RegistrationHttpError(
        403,
        `Campus scope violation: ${actor.roleTitle} is not authorized to register records for ${campus.name}.`
      );
    }

    let dept = null;
    if (input.departmentId) {
      dept = db.departments.find((d) => d.id === input.departmentId && d.active) ?? null;
      if (!dept) {
        throw new RegistrationHttpError(400, 'Selected department does not exist or is inactive.');
      }
    }

    let resolvedStudentDetails = input.studentDetails;
    if (input.category === 'STUDENT' && input.studentDetails) {
      const prog = input.studentDetails.programmeId
        ? db.programmes.find((p) => p.id === input.studentDetails?.programmeId && p.active)
        : db.programmes.find((p) => p.name === input.studentDetails?.programme && p.active);
      if (input.studentDetails.programmeId && !prog) {
        throw new RegistrationHttpError(400, 'Selected programmeId does not exist.');
      }

      const intakeRec = input.studentDetails.intakeId
        ? db.intakes.find((i) => i.id === input.studentDetails?.intakeId && i.active)
        : db.intakes.find((i) => i.name === input.studentDetails?.intake && i.active);
      if (input.studentDetails.intakeId && !intakeRec) {
        throw new RegistrationHttpError(400, 'Selected intakeId does not exist.');
      }

      resolvedStudentDetails = {
        ...input.studentDetails,
        programmeId: prog?.id ?? input.studentDetails.programmeId,
        programme: prog?.name ?? input.studentDetails.programme,
        intakeId: intakeRec?.id ?? input.studentDetails.intakeId,
        intake: intakeRec?.name ?? input.studentDetails.intake,
      };
    }

    const duplicates = findDuplicateMatches(
      db,
      input.email,
      input.phone,
      input.identificationNumber
    );
    const hasHardDuplicate = duplicates.some((d) =>
      d.matchedReason.includes('Email') || d.matchedReason.includes('National ID')
    );

    if (input.submitImmediately && hasHardDuplicate) {
      throw new RegistrationHttpError(
        409,
        `Duplicate identity detected (${duplicates[0].matchedReason} matches ${duplicates[0].matchedName}). Resolve duplicate before submitting.`
      );
    }

    const now = new Date().toISOString();
    const proposedRole = defaultRoleForCategory(input.category, input.proposedRole);

    const record: UserRegistrationRecord = {
      id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      registrationNumber: null,
      category: input.category,
      subType: input.subType || input.category,
      status: input.submitImmediately ? 'SUBMITTED' : 'DRAFT',
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      gender: input.gender || 'Prefer not to say',
      dateOfBirth: input.dateOfBirth || '2000-01-01',
      nationality: input.nationality || 'Kenyan',
      identificationNumberMasked: maskIdentificationNumber(input.identificationNumber),
      identificationNumberHash: hashIdentificationNumber(input.identificationNumber),
      identificationType: input.identificationType || 'NATIONAL_ID',
      campusId: campus.id,
      campusName: campus.name,
      departmentId: dept?.id ?? null,
      departmentName: dept?.name ?? null,
      userAccountId: null,
      accountStatus: 'NOT_CREATED',
      accountCreatedAt: null,
      collegeRecordId: null,
      collegeRecordStatus: input.submitImmediately ? 'PENDING_VERIFICATION' : 'UNENROLLED',
      portalAccessStatus: 'INACTIVE',
      proposedRole,
      assignedRole: null,
      assignedPermissions: [],
      mustChangePasswordOnFirstLogin: true,
      mustCompleteProfileOnFirstLogin: true,
      passwordHash: null,
      studentDetails: input.category === 'STUDENT' ? resolvedStudentDetails : undefined,
      staffDetails: input.category === 'STAFF' ? input.staffDetails : undefined,
      otherDetails:
        input.category !== 'STUDENT' && input.category !== 'STAFF' ? input.otherDetails : undefined,
      documents: input.documents ?? [],
      odpcConsentAccepted: input.odpcConsentAccepted,
      odpcConsentTimestamp: input.odpcConsentAccepted ? now : null,
      duplicateFlag: duplicates.length > 0,
      duplicateNotes:
        duplicates.length > 0
          ? `Potential match with ${duplicates.map((d) => `${d.matchedName} (${d.matchedReason})`).join('; ')}`
          : null,
      reviewerComment: null,
      reviewerHistory: [],
      createdById: actor.id,
      createdByName: actor.fullName,
      createdByRole: actor.role as StaffRoleCode,
      submittedAt: input.submitImmediately ? now : null,
      reviewedById: null,
      reviewedByName: null,
      reviewedAt: null,
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      activatedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    if (input.submitImmediately) {
      pushReviewerEvent(record, actor, 'SUBMITTED', 'Submitted for independent verification and approval.');
    }

    db.registrations.unshift(record);
    appendRegistrationAudit(
      db,
      actor,
      input.submitImmediately ? 'REGISTRATION_SUBMITTED' : 'REGISTRATION_DRAFT_CREATED',
      record.category,
      `${input.submitImmediately ? 'Submitted' : 'Saved draft'} ${record.category} registration for ${record.fullName}.`,
      record.id,
      record.category === 'STAFF'
    );
    saveDb(db);

    return sanitizeRecordForViewer(actor, record);
  },

  updateRegistration(
    actor: AuthenticatedSessionUser,
    id: string,
    input: Partial<RegistrationPayloadInput>
  ): SanitizedRegistrationRecord {
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(403, 'Access denied to this registration record.');
    }
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.EDIT)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.edit permission.');
    }
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(record.status)) {
      throw new RegistrationHttpError(
        409,
        `Cannot edit a registration in ${record.status} status.`
      );
    }

    const now = new Date().toISOString();
    if (input.fullName) record.fullName = input.fullName;
    if (input.email) record.email = input.email.toLowerCase();
    if (input.phone) record.phone = input.phone;
    if (input.gender) record.gender = input.gender;
    if (input.dateOfBirth) record.dateOfBirth = input.dateOfBirth;
    if (input.nationality) record.nationality = input.nationality;
    if (input.identificationNumber) {
      record.identificationNumberMasked = maskIdentificationNumber(input.identificationNumber);
      record.identificationNumberHash = hashIdentificationNumber(input.identificationNumber);
    }
    if (input.campusId) {
      const campus = db.campuses.find((c) => c.id === input.campusId && c.active);
      if (!campus) {
        throw new RegistrationHttpError(400, 'Selected campus does not exist.');
      }
      record.campusId = campus.id;
      record.campusName = campus.name;
    }
    if (input.departmentId !== undefined) {
      const dept = input.departmentId
        ? db.departments.find((d) => d.id === input.departmentId && d.active) ?? null
        : null;
      if (input.departmentId && !dept) {
        throw new RegistrationHttpError(400, 'Selected department does not exist.');
      }
      record.departmentId = dept?.id ?? null;
      record.departmentName = dept?.name ?? null;
    }
    if (input.studentDetails && record.category === 'STUDENT') {
      record.studentDetails = { ...record.studentDetails, ...input.studentDetails };
    }
    if (input.staffDetails && record.category === 'STAFF') {
      record.staffDetails = { ...record.staffDetails, ...input.staffDetails };
    }
    if (input.otherDetails && record.category !== 'STUDENT' && record.category !== 'STAFF') {
      record.otherDetails = { ...record.otherDetails, ...input.otherDetails };
    }
    if (input.documents) {
      record.documents = input.documents;
    }

    const duplicates = findDuplicateMatches(db, record.email, record.phone, undefined, record.id);
    record.duplicateFlag = duplicates.length > 0;
    record.duplicateNotes =
      duplicates.length > 0
        ? `Potential match with ${duplicates.map((d) => `${d.matchedName} (${d.matchedReason})`).join('; ')}`
        : null;
    record.updatedAt = now;

    appendRegistrationAudit(
      db,
      actor,
      'REGISTRATION_UPDATED',
      record.category,
      `Updated ${record.category} registration details for ${record.fullName}.`,
      record.id,
      record.category === 'STAFF'
    );
    saveDb(db);

    return sanitizeRecordForViewer(actor, record);
  },

  submitRegistration(actor: AuthenticatedSessionUser, id: string): SanitizedRegistrationRecord {
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.SUBMIT)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.submit permission.');
    }
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(403, 'Access denied to submit this registration.');
    }
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(record.status)) {
      throw new RegistrationHttpError(
        409,
        `Only DRAFT or CHANGES_REQUESTED registrations can be submitted (currently ${record.status}).`
      );
    }

    const duplicates = findDuplicateMatches(db, record.email, record.phone, undefined, record.id);
    const hasHardDuplicate = duplicates.some((d) =>
      d.matchedReason.includes('Email') || d.matchedReason.includes('National ID')
    );
    if (hasHardDuplicate) {
      record.duplicateFlag = true;
      record.duplicateNotes = `Blocked on submit: ${duplicates[0].matchedReason} matches ${duplicates[0].matchedName}`;
      saveDb(db);
      throw new RegistrationHttpError(409, record.duplicateNotes);
    }

    const now = new Date().toISOString();
    record.status = 'SUBMITTED';
    record.collegeRecordStatus = 'PENDING_VERIFICATION';
    record.submittedAt = now;
    record.updatedAt = now;
    pushReviewerEvent(record, actor, 'SUBMITTED', 'Submitted to independent approval queue.');

    appendRegistrationAudit(
      db,
      actor,
      'REGISTRATION_SUBMITTED',
      record.category,
      `Submitted ${record.category} registration for ${record.fullName} into approval queue.`,
      record.id,
      record.category === 'STAFF'
    );
    saveDb(db);

    return sanitizeRecordForViewer(actor, record);
  },

  reviewRegistration(
    actor: AuthenticatedSessionUser,
    id: string,
    input: ReviewDecisionInput
  ): SanitizedRegistrationRecord {
    return registrationApprovalService.decideRegistration(
      actor,
      id,
      input.decision,
      input.comment,
      input.assignedRole
    );
  },

  verifySupportingDocument(
    actor: AuthenticatedSessionUser,
    id: string,
    docIndex: number,
    verified: boolean
  ): SanitizedRegistrationRecord {
    return registrationApprovalService.toggleDocumentVerification(actor, id, docIndex, verified);
  },

  sendInvitation(actor: AuthenticatedSessionUser, id: string) {
    return registrationInvitationService.issueInvitation(actor, id);
  },

  validatePublicActivation(token: string) {
    return registrationInvitationService.validatePublicInvitation(token);
  },

  completePublicActivation(token: string, password: string) {
    return registrationInvitationService.completePublicActivation(token, password);
  },

  completeActivation(
    actor: AuthenticatedSessionUser,
    input: ActivationConfirmInput,
    expectedRegistrationId?: string
  ) {
    return registrationInvitationService.activateAccount(
      actor,
      input.token,
      input.password,
      expectedRegistrationId
    );
  },

  assignRoleAndPermissions(
    actor: AuthenticatedSessionUser,
    id: string,
    input: RoleAssignInput
  ): SanitizedRegistrationRecord {
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.ROLES_ASSIGN)) {
      throw new RegistrationHttpError(403, 'Missing users.roles.assign permission.');
    }
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) {
      throw new RegistrationHttpError(404, 'Registration record not found.');
    }
    if (!['APPROVED', 'INVITED', 'ACTIVATED'].includes(record.status)) {
      throw new RegistrationHttpError(
        409,
        'Portal roles can only be assigned after formal registration approval.'
      );
    }

    if (
      input.assignedPermissions.length > 0 &&
      !actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.PERMISSIONS_MANAGE)
    ) {
      throw new RegistrationHttpError(
        403,
        'Modifying granular permissions requires users.permissions.manage.'
      );
    }

    if (record.category === 'GUEST' && input.assignedRole !== 'GUEST') {
      throw new RegistrationHttpError(
        403,
        'Guest/Visitor records cannot be assigned staff or student portal roles.'
      );
    }

    const now = new Date().toISOString();
    record.assignedRole = input.assignedRole;
    record.assignedPermissions =
      input.assignedPermissions.length > 0
        ? input.assignedPermissions
        : defaultPortalPermissionsForRole(input.assignedRole);
    record.updatedAt = now;

    appendRegistrationAudit(
      db,
      actor,
      'ROLE_PERMISSIONS_UPDATED',
      record.category,
      `Assigned role ${record.assignedRole} (${record.assignedPermissions.length} permissions) to ${record.fullName}.`,
      record.id
    );
    saveDb(db);

    return sanitizeRecordForViewer(actor, record);
  },

  suspendRegistration(
    actor: AuthenticatedSessionUser,
    id: string,
    reason: string
  ): SanitizedRegistrationRecord {
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.SUSPEND)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.suspend permission.');
    }
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) throw new RegistrationHttpError(404, 'Registration record not found.');
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(403, 'Access denied to suspend this registration.');
    }

    const now = new Date().toISOString();
    record.status = 'SUSPENDED';
    record.portalAccessStatus = 'SUSPENDED';
    record.accountStatus = record.accountStatus === 'CREATED' ? 'SUSPENDED' : 'NOT_CREATED';
    record.collegeRecordStatus =
      record.collegeRecordStatus === 'ENROLLED' ? 'SUSPENDED' : record.collegeRecordStatus;
    record.reviewerComment = reason;
    record.updatedAt = now;

    if (record.category === 'STUDENT' && record.collegeRecordId) {
      const stu = db.studentAccounts.find((s) => s.id === record.collegeRecordId);
      if (stu) stu.status = 'SUSPENDED';
    } else if (record.category === 'STAFF' && record.collegeRecordId) {
      const stf = db.staffAccounts.find((s) => s.id === record.collegeRecordId);
      if (stf) stf.status = 'SUSPENDED';
    }

    for (const inv of db.activationInvitations) {
      if (inv.registrationId === record.id && inv.status === 'PENDING') {
        inv.status = 'REVOKED';
      }
    }

    appendRegistrationAudit(
      db,
      actor,
      'REGISTRATION_SUSPENDED',
      record.category,
      `Suspended ${record.fullName} (${record.registrationNumber ?? record.id}): ${reason}`,
      record.id
    );
    saveDb(db);

    return sanitizeRecordForViewer(actor, record);
  },

  archiveRegistration(
    actor: AuthenticatedSessionUser,
    id: string,
    reason: string
  ): SanitizedRegistrationRecord {
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.ARCHIVE)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.archive permission.');
    }
    const db = getDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) throw new RegistrationHttpError(404, 'Registration record not found.');
    if (!canViewRegistrationRecord(actor, record)) {
      throw new RegistrationHttpError(403, 'Access denied to archive this registration.');
    }

    const now = new Date().toISOString();
    record.status = 'ARCHIVED';
    record.portalAccessStatus = 'REVOKED';
    record.collegeRecordStatus = 'ARCHIVED';
    record.reviewerComment = reason;
    record.updatedAt = now;

    appendRegistrationAudit(
      db,
      actor,
      'REGISTRATION_ARCHIVED',
      record.category,
      `Archived ${record.fullName}: ${reason}`,
      record.id
    );
    saveDb(db);

    return sanitizeRecordForViewer(actor, record);
  },

  bulkImportCsv(actor: AuthenticatedSessionUser, csvText: string, commit: boolean) {
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.IMPORT)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.import permission.');
    }
    const parsed = parseCsvRows(csvText);
    if (!parsed.ok) {
      throw new RegistrationHttpError(400, parsed.error ?? 'Invalid CSV format.');
    }

    const db = getDb();
    const validPreview: {
      rowNumber: number;
      category: RegistrationCategory;
      fullName: string;
      email: string;
      campusId: string;
      duplicateWarning: string | null;
    }[] = [];
    const errors = [...parsed.rowErrors];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const authCheck = canRegisterCategory(actor, row.category, row.proposedRole);
      if (!authCheck.allowed) {
        errors.push({
          rowNumber: i + 2,
          error: authCheck.reason ?? `Not authorized to import ${row.category}`,
          raw: `${row.fullName} (${row.email})`,
        });
        continue;
      }

      const campus = db.campuses.find((c) => c.id === row.campusId) ?? db.campuses[0];
      const duplicates = findDuplicateMatches(db, row.email, row.phone, row.identificationNumber);
      validPreview.push({
        rowNumber: i + 2,
        category: row.category,
        fullName: row.fullName,
        email: row.email,
        campusId: campus.id,
        duplicateWarning:
          duplicates.length > 0
            ? `${duplicates[0].matchedReason} (${duplicates[0].matchedName})`
            : null,
      });

      if (commit) {
        this.createRegistration(actor, {
          category: row.category,
          fullName: row.fullName,
          email: row.email,
          phone: row.phone,
          identificationNumber: row.identificationNumber,
          campusId: campus.id,
          departmentId: row.departmentId ?? null,
          proposedRole: row.proposedRole,
          odpcConsentAccepted: true,
          submitImmediately: false,
          studentDetails:
            row.category === 'STUDENT'
              ? {
                  programme: row.programmeOrTitle || 'Diploma in Information Communication Technology',
                  intake: 'September 2026 Intake',
                  studyMode: 'FULL_TIME',
                  previousInstitution: 'Verified via Bulk Import',
                  previousQualification: 'KCSE Certificate',
                  previousGrade: 'Pending Verification',
                  guardianName: 'Pending Guardian Intake',
                  guardianPhone: row.phone,
                  guardianEmail: row.email,
                  guardianRelationship: 'Guardian',
                  feeCategory: 'SELF_SPONSORED',
                  sponsorshipReference: 'BULK-IMPORT',
                }
              : undefined,
          staffDetails:
            row.category === 'STAFF'
              ? {
                  employeeType: 'NON_TEACHING',
                  jobTitle: row.programmeOrTitle || 'College Staff Member',
                  supervisorName: 'Department Head',
                  contractType: 'FIXED_TERM',
                  startDate: '2026-09-01',
                  endDate: '2029-08-31',
                  highestQualification: 'Verified Credential',
                  specialization: 'General Administration',
                  emergencyContactName: 'Pending HR Verification',
                  emergencyContactPhone: row.phone,
                }
              : undefined,
        });
      }
    }

    if (commit && validPreview.length > 0) {
      appendRegistrationAudit(
        db,
        actor,
        'BULK_IMPORT_COMMITTED',
        'SYSTEM',
        `Imported ${validPreview.length} DRAFT registration(s) via validated CSV import (${errors.length} rejected).`,
        null
      );
      saveDb(db);
    }

    return {
      committed: commit,
      importedCount: commit ? validPreview.length : 0,
      validRows: validPreview,
      errors,
    };
  },

  exportAuthorizedCsv(
    actor: AuthenticatedSessionUser,
    filters: RegistrationListFilters
  ): string {
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.EXPORT)) {
      throw new RegistrationHttpError(403, 'Missing users.registration.export permission.');
    }
    const { items } = this.getWorkspaceOverview(actor, { ...filters, page: 1, pageSize: 100 });
    const header = [
      'RegistrationNumber',
      'Category',
      'FullName',
      'Email',
      'Phone',
      'MaskedID',
      'Campus',
      'Department',
      'Status',
      'AccountStatus',
      'CollegeRecordStatus',
      'PortalAccessStatus',
      'AssignedRole',
    ].join(',');

    const esc = (v: string | null | undefined) =>
      `"${String(v ?? '').replace(/"/g, '""')}"`;

    const rows = items.map((r) =>
      [
        esc(r.registrationNumber ?? 'PENDING'),
        esc(r.category),
        esc(r.fullName),
        esc(r.email),
        esc(r.phone),
        esc(r.identificationNumberMasked),
        esc(r.campusName),
        esc(r.departmentName ?? ''),
        esc(r.status),
        esc(r.accountStatus),
        esc(r.collegeRecordStatus),
        esc(r.portalAccessStatus),
        esc(r.assignedRole ?? r.proposedRole),
      ].join(',')
    );

    const db = getDb();
    appendRegistrationAudit(
      db,
      actor,
      'DIRECTORY_EXPORTED',
      'SYSTEM',
      `Exported ${items.length} authorized registration record(s) with ODPC ID masking.`,
      null
    );
    saveDb(db);

    return [header, ...rows].join('\n');
  },

  listAuditLogs(actor: AuthenticatedSessionUser) {
    if (!actor.registrationPermissions.includes(REGISTRATION_PERMISSIONS.AUDIT_VIEW)) {
      throw new RegistrationHttpError(403, 'Missing users.audit.view permission.');
    }
    const db = getDb();
    return db.registrationAuditLogs.filter((log) => {
      if (log.isConfidential && actor.role !== 'HR' && actor.role !== 'PRINCIPAL') {
        return false;
      }
      return true;
    });
  },
};
