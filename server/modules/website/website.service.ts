import crypto from 'node:crypto';
import { getDb, saveDb } from '../../data/store.ts';
import type { AuthenticatedSessionUser } from '../../middleware/auth.ts';
import {
  WEBSITE_STAFF_CATEGORIES,
  type DepartmentStaffAssignmentRecord,
  type WebsiteAuditLogRecord,
  type WebsiteContentStatus,
  type WebsiteDepartmentRecord,
  type WebsiteStaffCategory,
  type WebsiteStaffProfileRecord,
} from './website.types.ts';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

function makeUniqueSlug(base: string, existingSlugs: Set<string>): string {
  const clean = slugify(base);
  if (!existingSlugs.has(clean)) return clean;
  let idx = 2;
  while (existingSlugs.has(`${clean}-${idx}`)) idx += 1;
  return `${clean}-${idx}`;
}

function escapeCsvCell(raw: string | null | undefined): string {
  const value = String(raw ?? '');
  const trimmed = value.replace(/\r?\n/g, ' ').trim();
  const safe = /^[=+\-@\t\r]/.test(trimmed) ? `'${trimmed}` : trimmed;
  return `"${safe.replace(/"/g, '""')}"`;
}

function appendWebsiteAudit(
  actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
  entry: Omit<WebsiteAuditLogRecord, 'id' | 'actorId' | 'actorName' | 'actorRole' | 'createdAt'>
): void {
  const db = getDb();
  db.websiteAuditLogs.unshift({
    id: `waud-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    ...entry,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    createdAt: new Date().toISOString(),
  });
  if (db.websiteAuditLogs.length > 200) {
    db.websiteAuditLogs.length = 200;
  }
}

export interface PublicStaffSummary {
  id: string;
  slug: string;
  fullName: string;
  titlePrefix: string | null;
  officialTitle: string;
  positionTitle: string;
  designation: string;
  category: WebsiteStaffCategory;
  photoUrl: string | null;
  publicEmail: string | null;
  officeLocation: string | null;
  featured: boolean;
  displayOrder: number;
  departments: {
    id: string;
    slug: string;
    name: string;
    isHod: boolean;
    roleInDepartment: string;
  }[];
}

export interface PublicStaffProfileDetail extends PublicStaffSummary {
  biography: string;
  academicQualifications: string[];
  professionalCertifications: string[];
  specializations: string[];
  subjectsTaught: string[];
  officeHours: string | null;
  linkedinUrl: string | null;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PublicDepartmentSummary {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortDescription: string;
  bannerImageUrl: string | null;
  contactEmail: string | null;
  officeLocation: string | null;
  campusName: string;
  featured: boolean;
  displayOrder: number;
  programmeCount: number;
  staffCount: number;
  hod: {
    id: string;
    slug: string;
    fullName: string;
    officialTitle: string;
    photoUrl: string | null;
  } | null;
}

export interface PublicDepartmentDetail extends PublicDepartmentSummary {
  overview: string;
  programmes: WebsiteDepartmentRecord['programmes'];
  facilities: string[];
  learningOutcomes: string[];
  careerOpportunities: string[];
  announcements: WebsiteDepartmentRecord['announcements'];
  faqs: WebsiteDepartmentRecord['faqs'];
  staffMembers: PublicStaffSummary[];
  seoTitle?: string;
  seoDescription?: string;
}

function isPubliclyVisible(rec: { status: WebsiteContentStatus; showOnPublicWebsite: boolean }): boolean {
  return rec.status === 'PUBLISHED' && rec.showOnPublicWebsite === true;
}

function resolveStaffDepartmentsForPublic(
  staff: WebsiteStaffProfileRecord,
  publishedDepartmentsById: Map<string, WebsiteDepartmentRecord>,
  assignments: DepartmentStaffAssignmentRecord[]
) {
  const result: {
    id: string;
    slug: string;
    name: string;
    isHod: boolean;
    roleInDepartment: string;
  }[] = [];
  const seen = new Set<string>();

  for (const a of assignments) {
    if (a.staffProfileId !== staff.id) continue;
    const dept = publishedDepartmentsById.get(a.departmentId);
    if (!dept || seen.has(dept.id)) continue;
    seen.add(dept.id);
    result.push({
      id: dept.id,
      slug: dept.slug,
      name: dept.name,
      isHod: a.isHod || dept.hodStaffProfileId === staff.id,
      roleInDepartment: a.roleInDepartment || staff.positionTitle,
    });
  }

  const fallbackIds = [
    ...(staff.primaryDepartmentId ? [staff.primaryDepartmentId] : []),
    ...staff.secondaryDepartmentIds,
  ];
  for (const deptId of fallbackIds) {
    const dept = publishedDepartmentsById.get(deptId);
    if (!dept || seen.has(dept.id)) continue;
    seen.add(dept.id);
    result.push({
      id: dept.id,
      slug: dept.slug,
      name: dept.name,
      isHod: dept.hodStaffProfileId === staff.id,
      roleInDepartment: dept.hodStaffProfileId === staff.id ? 'Head of Department' : staff.positionTitle,
    });
  }

  return result;
}

function toPublicStaffSummary(
  staff: WebsiteStaffProfileRecord,
  publishedDepartmentsById: Map<string, WebsiteDepartmentRecord>,
  assignments: DepartmentStaffAssignmentRecord[]
): PublicStaffSummary {
  // Explicit allowlist projection: never copies phone, personalAddress, salary, or audit fields
  return {
    id: staff.id,
    slug: staff.slug,
    fullName: staff.fullName,
    titlePrefix: staff.titlePrefix,
    officialTitle: staff.officialTitle,
    positionTitle: staff.positionTitle,
    designation: staff.designation,
    category: staff.category,
    photoUrl: staff.photoUrl,
    publicEmail: staff.publicEmail,
    officeLocation: staff.officeLocation,
    featured: staff.featured,
    displayOrder: staff.displayOrder,
    departments: resolveStaffDepartmentsForPublic(staff, publishedDepartmentsById, assignments),
  };
}

function toPublicStaffDetail(
  staff: WebsiteStaffProfileRecord,
  publishedDepartmentsById: Map<string, WebsiteDepartmentRecord>,
  assignments: DepartmentStaffAssignmentRecord[]
): PublicStaffProfileDetail {
  return {
    ...toPublicStaffSummary(staff, publishedDepartmentsById, assignments),
    biography: staff.biography,
    academicQualifications: [...staff.academicQualifications],
    professionalCertifications: [...staff.professionalCertifications],
    specializations: [...staff.specializations],
    subjectsTaught: [...staff.subjectsTaught],
    officeHours: staff.officeHours,
    linkedinUrl: staff.linkedinUrl,
    seoTitle: staff.seoTitle ?? `${staff.fullName} — ${staff.officialTitle} | HI-TECH College`,
    seoDescription: staff.seoDescription ?? staff.biography.slice(0, 155),
  };
}

export const websiteService = {
  // =========================================================================
  // PUBLIC READ-ONLY ENDPOINTS (STRICTLY PUBLISHED & PUBLIC-SAFE PROJECTION)
  // =========================================================================
  listPublicStaff(params: {
    q?: string;
    category?: string;
    departmentId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const db = getDb();
    const publishedDepts = db.websiteDepartments.filter(isPubliclyVisible);
    const deptById = new Map(publishedDepts.map((d) => [d.id, d]));

    const publishedStaff = db.websiteStaffProfiles
      .filter(isPubliclyVisible)
      .map((s) => toPublicStaffSummary(s, deptById, db.departmentStaffAssignments));

    const q = (params.q ?? '').trim().toLowerCase();
    const category = (params.category ?? '').trim();
    const departmentId = (params.departmentId ?? '').trim();

    const filtered = publishedStaff
      .filter((s) => {
        if (category && category !== 'ALL' && s.category !== category) return false;
        if (
          departmentId &&
          departmentId !== 'ALL' &&
          !s.departments.some((d) => d.id === departmentId || d.slug === departmentId)
        ) {
          return false;
        }
        if (q) {
          const hay = `${s.fullName} ${s.officialTitle} ${s.positionTitle} ${s.designation} ${s.category} ${s.departments.map((d) => d.name).join(' ')}`.toLowerCase();
          return hay.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.displayOrder - b.displayOrder || a.fullName.localeCompare(b.fullName);
      });

    const page = Math.max(1, Number(params.page ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(params.pageSize ?? 12) || 12));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      categories: [...WEBSITE_STAFF_CATEGORIES],
      departments: publishedDepts
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((d) => ({ id: d.id, slug: d.slug, name: d.name })),
    };
  },

  getPublicStaffBySlug(slug: string): PublicStaffProfileDetail | null {
    const db = getDb();
    const publishedDepts = db.websiteDepartments.filter(isPubliclyVisible);
    const deptById = new Map(publishedDepts.map((d) => [d.id, d]));

    const staff = db.websiteStaffProfiles.find((s) => s.slug === slug && isPubliclyVisible(s));
    if (!staff) return null;

    return toPublicStaffDetail(staff, deptById, db.departmentStaffAssignments);
  },

  listPublicDepartments(params: { q?: string; page?: number; pageSize?: number }) {
    const db = getDb();
    const publishedDepts = db.websiteDepartments.filter(isPubliclyVisible);
    const deptById = new Map(publishedDepts.map((d) => [d.id, d]));
    const publishedStaffById = new Map(
      db.websiteStaffProfiles.filter(isPubliclyVisible).map((s) => [s.id, s])
    );

    const summaries: PublicDepartmentSummary[] = publishedDepts.map((dept) => {
      const hodProfile = dept.hodStaffProfileId ? publishedStaffById.get(dept.hodStaffProfileId) : undefined;
      const memberIds = new Set<string>();
      for (const a of db.departmentStaffAssignments) {
        if (a.departmentId === dept.id && publishedStaffById.has(a.staffProfileId)) {
          memberIds.add(a.staffProfileId);
        }
      }
      for (const s of publishedStaffById.values()) {
        if (s.primaryDepartmentId === dept.id || s.secondaryDepartmentIds.includes(dept.id)) {
          memberIds.add(s.id);
        }
      }

      return {
        id: dept.id,
        slug: dept.slug,
        code: dept.code,
        name: dept.name,
        shortDescription: dept.shortDescription,
        bannerImageUrl: dept.bannerImageUrl,
        contactEmail: dept.contactEmail,
        officeLocation: dept.officeLocation,
        campusName: dept.campusName,
        featured: dept.featured,
        displayOrder: dept.displayOrder,
        programmeCount: dept.programmes.length,
        staffCount: memberIds.size,
        hod: hodProfile
          ? {
              id: hodProfile.id,
              slug: hodProfile.slug,
              fullName: hodProfile.fullName,
              officialTitle: hodProfile.officialTitle,
              photoUrl: hodProfile.photoUrl,
            }
          : null,
      };
    });

    const q = (params.q ?? '').trim().toLowerCase();
    const filtered = summaries
      .filter((d) => {
        if (!q) return true;
        return `${d.name} ${d.code} ${d.shortDescription} ${d.campusName}`.toLowerCase().includes(q);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));

    const page = Math.max(1, Number(params.page ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(params.pageSize ?? 12) || 12));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Also include map reference to prevent unused warning
    void deptById;

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  getPublicDepartmentBySlug(slug: string): PublicDepartmentDetail | null {
    const db = getDb();
    const publishedDepts = db.websiteDepartments.filter(isPubliclyVisible);
    const deptById = new Map(publishedDepts.map((d) => [d.id, d]));
    const dept = publishedDepts.find((d) => d.slug === slug);
    if (!dept) return null;

    const publishedStaff = db.websiteStaffProfiles.filter(isPubliclyVisible);
    const publishedStaffById = new Map(publishedStaff.map((s) => [s.id, s]));

    const assignmentByStaffId = new Map<string, DepartmentStaffAssignmentRecord>();
    for (const a of db.departmentStaffAssignments) {
      if (a.departmentId === dept.id) assignmentByStaffId.set(a.staffProfileId, a);
    }

    const memberProfiles = publishedStaff.filter(
      (s) =>
        assignmentByStaffId.has(s.id) ||
        s.primaryDepartmentId === dept.id ||
        s.secondaryDepartmentIds.includes(dept.id) ||
        dept.hodStaffProfileId === s.id
    );

    const staffMembers = memberProfiles
      .map((s) => toPublicStaffSummary(s, deptById, db.departmentStaffAssignments))
      .sort((a, b) => {
        const aHod = a.id === dept.hodStaffProfileId;
        const bHod = b.id === dept.hodStaffProfileId;
        if (aHod !== bHod) return aHod ? -1 : 1;
        return a.displayOrder - b.displayOrder;
      });

    const hodProfile = dept.hodStaffProfileId ? publishedStaffById.get(dept.hodStaffProfileId) : undefined;

    return {
      id: dept.id,
      slug: dept.slug,
      code: dept.code,
      name: dept.name,
      shortDescription: dept.shortDescription,
      overview: dept.overview,
      bannerImageUrl: dept.bannerImageUrl,
      contactEmail: dept.contactEmail,
      officeLocation: dept.officeLocation,
      campusName: dept.campusName,
      programmes: [...dept.programmes],
      facilities: [...dept.facilities],
      learningOutcomes: [...dept.learningOutcomes],
      careerOpportunities: [...dept.careerOpportunities],
      announcements: [...dept.announcements],
      faqs: [...dept.faqs],
      featured: dept.featured,
      displayOrder: dept.displayOrder,
      programmeCount: dept.programmes.length,
      staffCount: staffMembers.length,
      hod: hodProfile
        ? {
            id: hodProfile.id,
            slug: hodProfile.slug,
            fullName: hodProfile.fullName,
            officialTitle: hodProfile.officialTitle,
            photoUrl: hodProfile.photoUrl,
          }
        : null,
      staffMembers,
      seoTitle: dept.seoTitle ?? `${dept.name} | HI-TECH College`,
      seoDescription: dept.seoDescription ?? dept.shortDescription,
    };
  },

  // =========================================================================
  // STAFF CMS WORKSPACE OPERATIONS
  // =========================================================================
  getCmsSummary() {
    const db = getDb();
    const staff = db.websiteStaffProfiles;
    const departments = db.websiteDepartments;

    const staffByDept = departments.map((dept) => {
      const assignedIds = new Set(
        db.departmentStaffAssignments
          .filter((a) => a.departmentId === dept.id)
          .map((a) => a.staffProfileId)
      );
      for (const s of staff) {
        if (s.primaryDepartmentId === dept.id || s.secondaryDepartmentIds.includes(dept.id)) {
          assignedIds.add(s.id);
        }
      }
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        status: dept.status,
        staffCount: assignedIds.size,
        hasHod: Boolean(dept.hodStaffProfileId),
      };
    });

    const staffWithoutDepartment = staff.filter(
      (s) =>
        !s.primaryDepartmentId &&
        s.secondaryDepartmentIds.length === 0 &&
        !db.departmentStaffAssignments.some((a) => a.staffProfileId === s.id)
    ).length;

    return {
      staff: {
        total: staff.length,
        published: staff.filter((s) => s.status === 'PUBLISHED').length,
        draft: staff.filter((s) => s.status === 'DRAFT').length,
        pendingApproval: staff.filter((s) => s.status === 'PENDING_APPROVAL').length,
        archived: staff.filter((s) => s.status === 'ARCHIVED').length,
        withoutDepartment: staffWithoutDepartment,
      },
      departments: {
        total: departments.length,
        published: departments.filter((d) => d.status === 'PUBLISHED').length,
        draft: departments.filter((d) => d.status === 'DRAFT').length,
        pendingApproval: departments.filter((d) => d.status === 'PENDING_APPROVAL').length,
        archived: departments.filter((d) => d.status === 'ARCHIVED').length,
      },
      staffByDepartment: staffByDept,
      pendingApprovals: [
        ...staff
          .filter((s) => s.status === 'PENDING_APPROVAL')
          .map((s) => ({
            entityType: 'STAFF_PROFILE' as const,
            id: s.id,
            title: s.fullName,
            subtitle: `${s.officialTitle} · ${s.category}`,
            submittedAt: s.submittedAt ?? s.updatedAt,
            updatedByName: s.updatedByName,
          })),
        ...departments
          .filter((d) => d.status === 'PENDING_APPROVAL')
          .map((d) => ({
            entityType: 'DEPARTMENT' as const,
            id: d.id,
            title: d.name,
            subtitle: `${d.code} · ${d.campusName}`,
            submittedAt: d.submittedAt ?? d.updatedAt,
            updatedByName: d.updatedByName,
          })),
      ],
      recentAuditLogs: db.websiteAuditLogs.slice(0, 20),
    };
  },

  listCmsStaff(filters: { q?: string; status?: string; category?: string; departmentId?: string }) {
    const db = getDb();
    const q = (filters.q ?? '').trim().toLowerCase();
    const status = (filters.status ?? 'ALL').toUpperCase();
    const category = (filters.category ?? 'ALL').trim();
    const departmentId = (filters.departmentId ?? 'ALL').trim();

    const items = db.websiteStaffProfiles
      .filter((s) => {
        if (status !== 'ALL' && s.status !== status) return false;
        if (category !== 'ALL' && s.category !== category) return false;
        if (
          departmentId !== 'ALL' &&
          s.primaryDepartmentId !== departmentId &&
          !s.secondaryDepartmentIds.includes(departmentId) &&
          !db.departmentStaffAssignments.some(
            (a) => a.staffProfileId === s.id && a.departmentId === departmentId
          )
        ) {
          return false;
        }
        if (q) {
          const hay = `${s.fullName} ${s.officialTitle} ${s.designation} ${s.category} ${s.publicEmail ?? ''}`.toLowerCase();
          return hay.includes(q);
        }
        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder || a.fullName.localeCompare(b.fullName));

    return {
      items,
      categories: [...WEBSITE_STAFF_CATEGORIES],
      departments: db.websiteDepartments.map((d) => ({ id: d.id, name: d.name, slug: d.slug, status: d.status })),
    };
  },

  createStaffProfile(
    actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
    input: Partial<WebsiteStaffProfileRecord>
  ): WebsiteStaffProfileRecord {
    const db = getDb();
    const fullName = String(input.fullName ?? '').trim();
    const officialTitle = String(input.officialTitle ?? '').trim();
    if (!fullName || !officialTitle) {
      throw new Error('Staff full name and official title are required.');
    }

    const slugs = new Set(db.websiteStaffProfiles.map((s) => s.slug));
    const slug = makeUniqueSlug(input.slug || fullName, slugs);
    const now = new Date().toISOString();

    const record: WebsiteStaffProfileRecord = {
      id: `wstaff-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      slug,
      fullName,
      titlePrefix: input.titlePrefix ?? null,
      officialTitle,
      positionTitle: String(input.positionTitle ?? officialTitle).trim(),
      designation: String(input.designation ?? '').trim(),
      category: (input.category && WEBSITE_STAFF_CATEGORIES.includes(input.category)
        ? input.category
        : 'Lecturers and trainers') as WebsiteStaffCategory,
      primaryDepartmentId: input.primaryDepartmentId || null,
      secondaryDepartmentIds: Array.isArray(input.secondaryDepartmentIds)
        ? input.secondaryDepartmentIds
        : [],
      photoUrl: input.photoUrl ?? null,
      biography: String(input.biography ?? '').trim(),
      academicQualifications: Array.isArray(input.academicQualifications)
        ? input.academicQualifications.filter(Boolean)
        : [],
      professionalCertifications: Array.isArray(input.professionalCertifications)
        ? input.professionalCertifications.filter(Boolean)
        : [],
      specializations: Array.isArray(input.specializations) ? input.specializations.filter(Boolean) : [],
      subjectsTaught: Array.isArray(input.subjectsTaught) ? input.subjectsTaught.filter(Boolean) : [],
      publicEmail: input.publicEmail ? String(input.publicEmail).trim() : null,
      officeLocation: input.officeLocation ? String(input.officeLocation).trim() : null,
      officeHours: input.officeHours ? String(input.officeHours).trim() : null,
      linkedinUrl: input.linkedinUrl ? String(input.linkedinUrl).trim() : null,
      featured: Boolean(input.featured),
      displayOrder: Number(input.displayOrder) || db.websiteStaffProfiles.length + 1,
      showOnPublicWebsite: input.showOnPublicWebsite ?? false,
      status: 'DRAFT',
      submittedAt: null,
      approvedAt: null,
      approvedById: null,
      approvedByName: null,
      publishedAt: null,
      archivedAt: null,
      updatedById: actor.id,
      updatedByName: actor.fullName,
      createdAt: now,
      updatedAt: now,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    };

    db.websiteStaffProfiles.push(record);
    appendWebsiteAudit(actor, {
      entityType: 'STAFF_PROFILE',
      entityId: record.id,
      entityLabel: record.fullName,
      action: 'STAFF_CREATED_DRAFT',
      detail: `Created draft staff profile for ${record.fullName} (${record.category}).`,
    });
    saveDb(db);
    return record;
  },

  updateStaffProfile(
    actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
    id: string,
    input: Partial<WebsiteStaffProfileRecord>
  ): WebsiteStaffProfileRecord {
    const db = getDb();
    const idx = db.websiteStaffProfiles.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Staff profile not found.');

    const current = db.websiteStaffProfiles[idx];
    const now = new Date().toISOString();

    const updated: WebsiteStaffProfileRecord = {
      ...current,
      fullName: input.fullName !== undefined ? String(input.fullName).trim() : current.fullName,
      titlePrefix: input.titlePrefix !== undefined ? input.titlePrefix : current.titlePrefix,
      officialTitle: input.officialTitle !== undefined ? String(input.officialTitle).trim() : current.officialTitle,
      positionTitle: input.positionTitle !== undefined ? String(input.positionTitle).trim() : current.positionTitle,
      designation: input.designation !== undefined ? String(input.designation).trim() : current.designation,
      category:
        input.category && WEBSITE_STAFF_CATEGORIES.includes(input.category)
          ? input.category
          : current.category,
      primaryDepartmentId:
        input.primaryDepartmentId !== undefined ? input.primaryDepartmentId : current.primaryDepartmentId,
      secondaryDepartmentIds: Array.isArray(input.secondaryDepartmentIds)
        ? input.secondaryDepartmentIds
        : current.secondaryDepartmentIds,
      photoUrl: input.photoUrl !== undefined ? input.photoUrl : current.photoUrl,
      biography: input.biography !== undefined ? String(input.biography) : current.biography,
      academicQualifications: Array.isArray(input.academicQualifications)
        ? input.academicQualifications.filter(Boolean)
        : current.academicQualifications,
      professionalCertifications: Array.isArray(input.professionalCertifications)
        ? input.professionalCertifications.filter(Boolean)
        : current.professionalCertifications,
      specializations: Array.isArray(input.specializations)
        ? input.specializations.filter(Boolean)
        : current.specializations,
      subjectsTaught: Array.isArray(input.subjectsTaught)
        ? input.subjectsTaught.filter(Boolean)
        : current.subjectsTaught,
      publicEmail: input.publicEmail !== undefined ? input.publicEmail : current.publicEmail,
      officeLocation: input.officeLocation !== undefined ? input.officeLocation : current.officeLocation,
      officeHours: input.officeHours !== undefined ? input.officeHours : current.officeHours,
      linkedinUrl: input.linkedinUrl !== undefined ? input.linkedinUrl : current.linkedinUrl,
      featured: input.featured !== undefined ? Boolean(input.featured) : current.featured,
      displayOrder: input.displayOrder !== undefined ? Number(input.displayOrder) : current.displayOrder,
      showOnPublicWebsite:
        input.showOnPublicWebsite !== undefined ? Boolean(input.showOnPublicWebsite) : current.showOnPublicWebsite,
      seoTitle: input.seoTitle !== undefined ? input.seoTitle : current.seoTitle,
      seoDescription: input.seoDescription !== undefined ? input.seoDescription : current.seoDescription,
      updatedById: actor.id,
      updatedByName: actor.fullName,
      updatedAt: now,
    };

    db.websiteStaffProfiles[idx] = updated;
    appendWebsiteAudit(actor, {
      entityType: 'STAFF_PROFILE',
      entityId: updated.id,
      entityLabel: updated.fullName,
      action: 'STAFF_UPDATED',
      detail: `Updated staff profile fields for ${updated.fullName}.`,
    });
    saveDb(db);
    return updated;
  },

  transitionStaffStatus(
    actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
    id: string,
    targetAction: 'SUBMIT' | 'APPROVE' | 'PUBLISH' | 'ARCHIVE' | 'RETURN_TO_DRAFT'
  ): WebsiteStaffProfileRecord {
    const db = getDb();
    const record = db.websiteStaffProfiles.find((s) => s.id === id);
    if (!record) throw new Error('Staff profile not found.');

    const now = new Date().toISOString();
    if (targetAction === 'SUBMIT') {
      record.status = 'PENDING_APPROVAL';
      record.submittedAt = now;
    } else if (targetAction === 'APPROVE') {
      record.status = 'PUBLISHED';
      record.showOnPublicWebsite = true;
      record.approvedAt = now;
      record.approvedById = actor.id;
      record.approvedByName = actor.fullName;
      record.publishedAt = now;
    } else if (targetAction === 'PUBLISH') {
      record.status = 'PUBLISHED';
      record.showOnPublicWebsite = true;
      record.publishedAt = now;
      record.approvedAt = record.approvedAt ?? now;
      record.approvedById = record.approvedById ?? actor.id;
      record.approvedByName = record.approvedByName ?? actor.fullName;
    } else if (targetAction === 'ARCHIVE') {
      record.status = 'ARCHIVED';
      record.showOnPublicWebsite = false;
      record.archivedAt = now;
    } else if (targetAction === 'RETURN_TO_DRAFT') {
      record.status = 'DRAFT';
      record.showOnPublicWebsite = false;
    }

    record.updatedById = actor.id;
    record.updatedByName = actor.fullName;
    record.updatedAt = now;

    appendWebsiteAudit(actor, {
      entityType: 'STAFF_PROFILE',
      entityId: record.id,
      entityLabel: record.fullName,
      action: `STAFF_${targetAction}`,
      detail: `Changed status of ${record.fullName} to ${record.status}.`,
    });
    saveDb(db);
    return record;
  },

  listCmsDepartments(filters: { q?: string; status?: string }) {
    const db = getDb();
    const q = (filters.q ?? '').trim().toLowerCase();
    const status = (filters.status ?? 'ALL').toUpperCase();

    const items = db.websiteDepartments
      .filter((d) => {
        if (status !== 'ALL' && d.status !== status) return false;
        if (q) {
          return `${d.name} ${d.code} ${d.shortDescription}`.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
      .map((dept) => ({
        ...dept,
        assignments: db.departmentStaffAssignments.filter((a) => a.departmentId === dept.id),
      }));

    return {
      items,
      staffOptions: db.websiteStaffProfiles.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        officialTitle: s.officialTitle,
        category: s.category,
        status: s.status,
      })),
    };
  },

  createDepartment(
    actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
    input: Partial<WebsiteDepartmentRecord>
  ): WebsiteDepartmentRecord {
    const db = getDb();
    const name = String(input.name ?? '').trim();
    const code = String(input.code ?? '').trim().toUpperCase() || `DEPT-${db.websiteDepartments.length + 1}`;
    if (!name) throw new Error('Department name is required.');

    const slugs = new Set(db.websiteDepartments.map((d) => d.slug));
    const slug = makeUniqueSlug(input.slug || name, slugs);
    const now = new Date().toISOString();

    const dept: WebsiteDepartmentRecord = {
      id: `wdept-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      slug,
      code,
      name,
      shortDescription: String(input.shortDescription ?? '').trim(),
      overview: String(input.overview ?? '').trim(),
      bannerImageUrl: input.bannerImageUrl ?? '/src/assets/images/hitech_innovation_campus_1794981896251.jpg',
      hodStaffProfileId: input.hodStaffProfileId ?? null,
      contactEmail: input.contactEmail ?? null,
      officeLocation: input.officeLocation ?? null,
      campusName: String(input.campusName ?? 'Nairobi Main Campus'),
      programmes: Array.isArray(input.programmes) ? input.programmes : [],
      facilities: Array.isArray(input.facilities) ? input.facilities.filter(Boolean) : [],
      learningOutcomes: Array.isArray(input.learningOutcomes) ? input.learningOutcomes.filter(Boolean) : [],
      careerOpportunities: Array.isArray(input.careerOpportunities) ? input.careerOpportunities.filter(Boolean) : [],
      announcements: Array.isArray(input.announcements) ? input.announcements : [],
      faqs: Array.isArray(input.faqs) ? input.faqs : [],
      featured: Boolean(input.featured),
      displayOrder: Number(input.displayOrder) || db.websiteDepartments.length + 1,
      showOnPublicWebsite: false,
      status: 'DRAFT',
      submittedAt: null,
      approvedAt: null,
      approvedById: null,
      approvedByName: null,
      publishedAt: null,
      archivedAt: null,
      updatedById: actor.id,
      updatedByName: actor.fullName,
      createdAt: now,
      updatedAt: now,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    };

    db.websiteDepartments.push(dept);
    appendWebsiteAudit(actor, {
      entityType: 'DEPARTMENT',
      entityId: dept.id,
      entityLabel: dept.name,
      action: 'DEPARTMENT_CREATED_DRAFT',
      detail: `Created draft department page for ${dept.name} (${dept.code}).`,
    });
    saveDb(db);
    return dept;
  },

  updateDepartment(
    actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
    id: string,
    input: Partial<WebsiteDepartmentRecord>
  ): WebsiteDepartmentRecord {
    const db = getDb();
    const idx = db.websiteDepartments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Department not found.');

    const current = db.websiteDepartments[idx];
    const updated: WebsiteDepartmentRecord = {
      ...current,
      code: input.code !== undefined ? String(input.code).trim().toUpperCase() : current.code,
      name: input.name !== undefined ? String(input.name).trim() : current.name,
      shortDescription:
        input.shortDescription !== undefined ? String(input.shortDescription).trim() : current.shortDescription,
      overview: input.overview !== undefined ? String(input.overview) : current.overview,
      bannerImageUrl: input.bannerImageUrl !== undefined ? input.bannerImageUrl : current.bannerImageUrl,
      hodStaffProfileId:
        input.hodStaffProfileId !== undefined ? input.hodStaffProfileId : current.hodStaffProfileId,
      contactEmail: input.contactEmail !== undefined ? input.contactEmail : current.contactEmail,
      officeLocation: input.officeLocation !== undefined ? input.officeLocation : current.officeLocation,
      campusName: input.campusName !== undefined ? String(input.campusName) : current.campusName,
      programmes: Array.isArray(input.programmes) ? input.programmes : current.programmes,
      facilities: Array.isArray(input.facilities) ? input.facilities.filter(Boolean) : current.facilities,
      learningOutcomes: Array.isArray(input.learningOutcomes)
        ? input.learningOutcomes.filter(Boolean)
        : current.learningOutcomes,
      careerOpportunities: Array.isArray(input.careerOpportunities)
        ? input.careerOpportunities.filter(Boolean)
        : current.careerOpportunities,
      announcements: Array.isArray(input.announcements) ? input.announcements : current.announcements,
      faqs: Array.isArray(input.faqs) ? input.faqs : current.faqs,
      featured: input.featured !== undefined ? Boolean(input.featured) : current.featured,
      displayOrder: input.displayOrder !== undefined ? Number(input.displayOrder) : current.displayOrder,
      showOnPublicWebsite:
        input.showOnPublicWebsite !== undefined ? Boolean(input.showOnPublicWebsite) : current.showOnPublicWebsite,
      seoTitle: input.seoTitle !== undefined ? input.seoTitle : current.seoTitle,
      seoDescription: input.seoDescription !== undefined ? input.seoDescription : current.seoDescription,
      updatedById: actor.id,
      updatedByName: actor.fullName,
      updatedAt: new Date().toISOString(),
    };

    db.websiteDepartments[idx] = updated;
    appendWebsiteAudit(actor, {
      entityType: 'DEPARTMENT',
      entityId: updated.id,
      entityLabel: updated.name,
      action: 'DEPARTMENT_UPDATED',
      detail: `Updated public content and settings for department ${updated.name}.`,
    });
    saveDb(db);
    return updated;
  },

  transitionDepartmentStatus(
    actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
    id: string,
    targetAction: 'SUBMIT' | 'APPROVE' | 'PUBLISH' | 'ARCHIVE' | 'RETURN_TO_DRAFT'
  ): WebsiteDepartmentRecord {
    const db = getDb();
    const dept = db.websiteDepartments.find((d) => d.id === id);
    if (!dept) throw new Error('Department not found.');

    const now = new Date().toISOString();
    if (targetAction === 'SUBMIT') {
      dept.status = 'PENDING_APPROVAL';
      dept.submittedAt = now;
    } else if (targetAction === 'APPROVE' || targetAction === 'PUBLISH') {
      dept.status = 'PUBLISHED';
      dept.showOnPublicWebsite = true;
      dept.publishedAt = now;
      dept.approvedAt = dept.approvedAt ?? now;
      dept.approvedById = actor.id;
      dept.approvedByName = actor.fullName;
    } else if (targetAction === 'ARCHIVE') {
      dept.status = 'ARCHIVED';
      dept.showOnPublicWebsite = false;
      dept.archivedAt = now;
    } else if (targetAction === 'RETURN_TO_DRAFT') {
      dept.status = 'DRAFT';
      dept.showOnPublicWebsite = false;
    }

    dept.updatedById = actor.id;
    dept.updatedByName = actor.fullName;
    dept.updatedAt = now;

    appendWebsiteAudit(actor, {
      entityType: 'DEPARTMENT',
      entityId: dept.id,
      entityLabel: dept.name,
      action: `DEPARTMENT_${targetAction}`,
      detail: `Transitioned ${dept.name} status to ${dept.status}.`,
    });
    saveDb(db);
    return dept;
  },

  assignStaffToDepartment(
    actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>,
    departmentId: string,
    assignments: {
      staffProfileId: string;
      isHod: boolean;
      roleInDepartment?: string;
      isPrimaryDepartment?: boolean;
      displayOrder?: number;
    }[]
  ) {
    const db = getDb();
    const dept = db.websiteDepartments.find((d) => d.id === departmentId);
    if (!dept) throw new Error('Department not found.');

    const hodCount = assignments.filter((a) => a.isHod).length;
    if (hodCount > 1) {
      throw new Error('Only one Head of Department (HOD) may be assigned per academic department.');
    }

    const now = new Date().toISOString();
    const validStaffIds = new Set(db.websiteStaffProfiles.map((s) => s.id));
    for (const item of assignments) {
      if (!validStaffIds.has(item.staffProfileId)) {
        throw new Error(`Referenced staff profile ${item.staffProfileId} does not exist.`);
      }
    }

    // Replace assignments for this department transactionally
    db.departmentStaffAssignments = db.departmentStaffAssignments.filter(
      (a) => a.departmentId !== departmentId
    );

    const newAssignments: DepartmentStaffAssignmentRecord[] = assignments.map((item, idx) => ({
      id: `dsa-${Date.now()}-${idx}-${crypto.randomBytes(2).toString('hex')}`,
      departmentId,
      staffProfileId: item.staffProfileId,
      isHod: Boolean(item.isHod),
      roleInDepartment: String(item.roleInDepartment || (item.isHod ? 'Head of Department' : 'Faculty Member')).trim(),
      isPrimaryDepartment: Boolean(item.isPrimaryDepartment),
      displayOrder: item.displayOrder ?? idx + 1,
      assignedById: actor.id,
      assignedAt: now,
    }));

    db.departmentStaffAssignments.push(...newAssignments);
    const hodEntry = newAssignments.find((a) => a.isHod);
    dept.hodStaffProfileId = hodEntry ? hodEntry.staffProfileId : null;
    dept.updatedById = actor.id;
    dept.updatedByName = actor.fullName;
    dept.updatedAt = now;

    appendWebsiteAudit(actor, {
      entityType: 'ASSIGNMENT',
      entityId: dept.id,
      entityLabel: dept.name,
      action: 'DEPARTMENT_STAFF_ASSIGNED',
      detail: `Updated department staff roster (${newAssignments.length} member(s), HOD: ${hodEntry ? hodEntry.staffProfileId : 'None'}).`,
    });
    saveDb(db);
    return { department: dept, assignments: newAssignments };
  },

  exportPublicDirectoryCsv(actor: Pick<AuthenticatedSessionUser, 'id' | 'fullName' | 'role'>): string {
    const db = getDb();
    const deptMap = new Map(db.websiteDepartments.map((d) => [d.id, d.name]));
    const headers = [
      'Full Name',
      'Official Title',
      'Category',
      'Designation',
      'Primary Department',
      'Public Email',
      'Office Location',
      'Office Hours',
    ];
    const rows = db.websiteStaffProfiles
      .filter(isPubliclyVisible)
      .map((s) =>
        [
          escapeCsvCell(s.fullName),
          escapeCsvCell(s.officialTitle),
          escapeCsvCell(s.category),
          escapeCsvCell(s.designation),
          escapeCsvCell(s.primaryDepartmentId ? deptMap.get(s.primaryDepartmentId) ?? '' : ''),
          escapeCsvCell(s.publicEmail),
          escapeCsvCell(s.officeLocation),
          escapeCsvCell(s.officeHours),
        ].join(',')
      );

    appendWebsiteAudit(actor, {
      entityType: 'STAFF_PROFILE',
      entityId: 'export-csv',
      entityLabel: 'Public Staff Directory CSV',
      action: 'DIRECTORY_CSV_EXPORTED',
      detail: `Exported ${rows.length} published public staff records to CSV (private HR fields excluded).`,
    });
    saveDb(db);
    return [headers.map((h) => escapeCsvCell(h)).join(','), ...rows].join('\r\n');
  },
};
