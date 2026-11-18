import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type Request, type Response } from 'express';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db, isPostgresConfigured } from '../../../src/db/index.ts';
import {
  academicPeriods,
  academicRegistrations,
  campuses,
  departments,
  notifications,
  platformFeatures,
  programmes,
  signatureRequests,
  sprintBaselineTasks,
  studentProfiles,
  studentStatusHistory,
} from '../../../src/db/schema.ts';
import {
  DATABASE_DOMAINS_44,
  MASTER_FEATURES_84,
  SPRINT_1_BASELINE_TASKS,
} from '../../../src/data/platformMasterBlueprint.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import { requireAuth, requirePortalAuth } from '../../middleware/auth.ts';
import { getDb } from '../../data/store.ts';

const router = Router();

const GOVERNANCE_ROLES = new Set([
  'ADMIN',
  'PRINCIPAL',
  'REGISTRAR',
  'QUALITY_ASSURANCE',
  'IT_SUPPORT',
]);

function canGovernPlatform(req: Request): boolean {
  const role = req.staffUser?.role ?? req.portalUser?.primaryRole ?? '';
  return GOVERNANCE_ROLES.has(role.toUpperCase());
}

function maskHolderName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || 'Student';
  return `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase() ?? ''}.`;
}

// ----------------------------------------------------------------------------
// 1. SPRINT 1 PLATFORM BASELINE & REPOSITORY AUDIT SUMMARY
// ----------------------------------------------------------------------------
router.get('/baseline', async (_req: Request, res: Response) => {
  try {
    await ensurePostgresSeeded();

    let pgTables: Array<{ tableName: string; columnCount: number }> = [];
    if (isPostgresConfigured()) {
      const result = await db.execute(sql`
        SELECT table_name, COUNT(*)::int AS column_count
        FROM information_schema.columns
        WHERE table_schema = 'public'
        GROUP BY table_name
        ORDER BY table_name
      `);
      pgTables = (result.rows as Array<{ table_name: string; column_count: number }>).map(
        (r) => ({
          tableName: r.table_name,
          columnCount: Number(r.column_count),
        })
      );
    }

    const serverModulesDir = path.resolve(process.cwd(), 'server/modules');
    const webModulesDir = path.resolve(process.cwd(), 'src/modules');
    const servicesDir = path.resolve(process.cwd(), 'src/services');

    const backendModules = fs.existsSync(serverModulesDir)
      ? fs.readdirSync(serverModulesDir).sort()
      : [];
    const frontendModules = fs.existsSync(webModulesDir)
      ? fs.readdirSync(webModulesDir).sort()
      : [];
    const clientServices = fs.existsSync(servicesDir)
      ? fs.readdirSync(servicesDir).filter((f) => f.endsWith('.ts')).sort()
      : [];

    const features = isPostgresConfigured()
      ? await db.select().from(platformFeatures).orderBy(asc(platformFeatures.moduleNumber))
      : MASTER_FEATURES_84;

    const checklist = isPostgresConfigured()
      ? await db.select().from(sprintBaselineTasks).orderBy(asc(sprintBaselineTasks.orderIndex))
      : SPRINT_1_BASELINE_TASKS.map((t) => ({
          ...t,
          completedAt: t.completed ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        }));

    const statusCounts: Record<string, number> = {};
    const prioritySummary: Record<number, { total: number; verifiedOrTesting: number; inProgress: number; prototype: number; planned: number }> = {
      1: { total: 0, verifiedOrTesting: 0, inProgress: 0, prototype: 0, planned: 0 },
      2: { total: 0, verifiedOrTesting: 0, inProgress: 0, prototype: 0, planned: 0 },
      3: { total: 0, verifiedOrTesting: 0, inProgress: 0, prototype: 0, planned: 0 },
      4: { total: 0, verifiedOrTesting: 0, inProgress: 0, prototype: 0, planned: 0 },
    };

    for (const f of features) {
      statusCounts[f.status] = (statusCounts[f.status] ?? 0) + 1;
      const p = prioritySummary[f.priority as 1 | 2 | 3 | 4];
      if (p) {
        p.total += 1;
        if (f.status === 'Verified' || f.status === 'Released' || f.status === 'Testing') {
          p.verifiedOrTesting += 1;
        } else if (f.status === 'In progress') {
          p.inProgress += 1;
        } else if (f.status === 'Prototype' || f.status === 'Existing') {
          p.prototype += 1;
        } else {
          p.planned += 1;
        }
      }
    }

    const domainStatusCounts = {
      verified: DATABASE_DOMAINS_44.filter((d) => d.status === 'Verified').length,
      partial: DATABASE_DOMAINS_44.filter((d) => d.status === 'Partial').length,
      planned: DATABASE_DOMAINS_44.filter((d) => d.status === 'Planned').length,
    };

    res.json({
      success: true,
      data: {
        auditTimestamp: new Date().toISOString(),
        runtime: {
          stack: 'Unified Express + Vite + React 19 + Drizzle ORM + Cloud SQL PostgreSQL',
          port: Number(process.env.PORT ?? 3000),
          nodeVersion: process.version,
          postgresConnected: isPostgresConfigured(),
        },
        counts: {
          totalModules: features.length,
          totalSystems: 12,
          totalDatabaseDomains: DATABASE_DOMAINS_44.length,
          livePostgresTables: pgTables.length,
          backendRouteModules: backendModules.length,
          frontendModuleFolders: frontendModules.length,
          clientServicesRemaining: clientServices.length,
          sprintCompleted: checklist.filter((c) => c.completed).length,
          sprintTotal: checklist.length,
        },
        statusCounts,
        prioritySummary,
        domainStatusCounts,
        inventory: {
          pgTables,
          backendModules,
          frontendModules,
          clientServices,
        },
        checklist,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to compute platform baseline.',
    });
  }
});

// ----------------------------------------------------------------------------
// 2. CENTRAL FEATURE REGISTER (84 MODULES)
// ----------------------------------------------------------------------------
router.get('/features', async (req: Request, res: Response) => {
  try {
    await ensurePostgresSeeded();

    const priorityParam = req.query.priority ? Number(req.query.priority) : null;
    const statusParam = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const systemParam = typeof req.query.systemCode === 'string' ? req.query.systemCode.trim().toUpperCase() : '';
    const queryParam = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    const all = isPostgresConfigured()
      ? await db.select().from(platformFeatures).orderBy(asc(platformFeatures.moduleNumber))
      : MASTER_FEATURES_84;

    const filtered = all.filter((item) => {
      if (priorityParam && item.priority !== priorityParam) return false;
      if (statusParam && statusParam !== 'ALL' && item.status !== statusParam) return false;
      if (systemParam && systemParam !== 'ALL' && item.systemCode !== systemParam) return false;
      if (queryParam) {
        const hay = `${item.featureId} ${item.moduleName} ${item.description} ${item.systemName} ${item.assignedOwner}`.toLowerCase();
        if (!hay.includes(queryParam)) return false;
      }
      return true;
    });

    res.json({
      success: true,
      data: {
        total: filtered.length,
        features: filtered,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load feature register.',
    });
  }
});

router.patch('/features/:featureId', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canGovernPlatform(req)) {
      res.status(403).json({
        success: false,
        error: 'Access denied: updating Central Feature Register requires Admin, Principal, Registrar, QA, or IT Support role.',
      });
      return;
    }

    const { featureId } = req.params;
    const allowedStatuses = new Set([
      'Planned',
      'Existing',
      'Prototype',
      'In progress',
      'Blocked',
      'Testing',
      'Verified',
      'Released',
    ]);

    const {
      status,
      backendStatus,
      databaseStatus,
      frontendStatus,
      testStatus,
      assignedOwner,
      releaseVersion,
    } = req.body as Record<string, string | undefined>;

    if (status && !allowedStatuses.has(status)) {
      res.status(400).json({ success: false, error: `Invalid status value: ${status}` });
      return;
    }

    await ensurePostgresSeeded();
    if (!isPostgresConfigured()) {
      res.status(503).json({ success: false, error: 'PostgreSQL database is not configured.' });
      return;
    }

    const [existing] = await db
      .select()
      .from(platformFeatures)
      .where(eq(platformFeatures.featureId, featureId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ success: false, error: `Feature ${featureId} not found.` });
      return;
    }

    const [updated] = await db
      .update(platformFeatures)
      .set({
        ...(status ? { status } : {}),
        ...(backendStatus !== undefined ? { backendStatus: backendStatus.trim() } : {}),
        ...(databaseStatus !== undefined ? { databaseStatus: databaseStatus.trim() } : {}),
        ...(frontendStatus !== undefined ? { frontendStatus: frontendStatus.trim() } : {}),
        ...(testStatus !== undefined ? { testStatus: testStatus.trim() } : {}),
        ...(assignedOwner !== undefined ? { assignedOwner: assignedOwner.trim() } : {}),
        ...(releaseVersion !== undefined ? { releaseVersion: releaseVersion.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(platformFeatures.featureId, featureId))
      .returning();

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to update feature record.',
    });
  }
});

// ----------------------------------------------------------------------------
// 3. SPRINT 1 CHECKLIST UPDATES
// ----------------------------------------------------------------------------
router.patch('/checklist/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canGovernPlatform(req)) {
      res.status(403).json({
        success: false,
        error: 'Access denied: updating Sprint checklist requires authorized governance staff.',
      });
      return;
    }

    const { id } = req.params;
    const { completed, evidenceSummary } = req.body as {
      completed?: boolean;
      evidenceSummary?: string;
    };

    await ensurePostgresSeeded();
    if (!isPostgresConfigured()) {
      res.status(503).json({ success: false, error: 'PostgreSQL database is not configured.' });
      return;
    }

    const [existing] = await db
      .select()
      .from(sprintBaselineTasks)
      .where(eq(sprintBaselineTasks.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Checklist task not found.' });
      return;
    }

    const nextCompleted = typeof completed === 'boolean' ? completed : existing.completed;
    const [updated] = await db
      .update(sprintBaselineTasks)
      .set({
        completed: nextCompleted,
        ...(typeof evidenceSummary === 'string'
          ? { evidenceSummary: evidenceSummary.trim() }
          : {}),
        verifiedBy: req.staffUser?.fullName || 'Authorized Officer',
        completedAt: nextCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(sprintBaselineTasks.id, id))
      .returning();

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to update sprint checklist.',
    });
  }
});

// ----------------------------------------------------------------------------
// 4. PRIORITY 1 ACADEMIC STRUCTURE (CAMPUSES, DEPARTMENTS, PROGRAMMES, PERIODS)
// ----------------------------------------------------------------------------
router.get('/academic-structure', async (_req: Request, res: Response) => {
  try {
    await ensurePostgresSeeded();
    if (!isPostgresConfigured()) {
      res.json({
        success: true,
        data: { campuses: [], departments: [], programmes: [], periods: [] },
      });
      return;
    }

    const [campusRows, deptRows, progRows, periodRows] = await Promise.all([
      db.select().from(campuses).orderBy(asc(campuses.code)),
      db.select().from(departments).orderBy(asc(departments.code)),
      db.select().from(programmes).orderBy(asc(programmes.code)),
      db.select().from(academicPeriods).orderBy(desc(academicPeriods.startDate)),
    ]);

    res.json({
      success: true,
      data: {
        campuses: campusRows,
        departments: deptRows,
        programmes: progRows,
        periods: periodRows,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load academic structure.',
    });
  }
});

router.post('/academic-structure/programmes', requireAuth, async (req: Request, res: Response) => {
  try {
    const role = req.staffUser?.role ?? '';
    if (!['ADMIN', 'REGISTRAR', 'PRINCIPAL'].includes(role)) {
      res.status(403).json({
        success: false,
        error: 'Only Administrator, Registrar, or Principal may register academic programmes.',
      });
      return;
    }

    const { code, title, level, examBody, departmentId, durationSemesters, tuitionPerSemesterKes, tvetaApproved } =
      req.body as {
        code?: string;
        title?: string;
        level?: string;
        examBody?: string;
        departmentId?: string;
        durationSemesters?: number;
        tuitionPerSemesterKes?: number;
        tvetaApproved?: boolean;
      };

    if (!code?.trim() || !title?.trim() || !departmentId?.trim()) {
      res.status(400).json({
        success: false,
        error: 'Programme code, title, and departmentId are required.',
      });
      return;
    }

    await ensurePostgresSeeded();

    const [dept] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId.trim()))
      .limit(1);

    if (!dept) {
      res.status(404).json({ success: false, error: 'Selected department does not exist.' });
      return;
    }

    const id = `prog-${crypto.randomUUID().slice(0, 8)}`;
    const [created] = await db
      .insert(programmes)
      .values({
        id,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        level: (level || 'DIPLOMA').toUpperCase(),
        examBody: (examBody || 'CDACC').toUpperCase(),
        departmentId: dept.id,
        durationSemesters: Number(durationSemesters) || 6,
        tuitionPerSemesterKes: Number(tuitionPerSemesterKes) || 28500,
        tvetaApproved: Boolean(tvetaApproved ?? true),
        active: true,
      })
      .returning();

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to create programme.',
    });
  }
});

router.post('/academic-structure/periods', requireAuth, async (req: Request, res: Response) => {
  try {
    const role = req.staffUser?.role ?? '';
    if (!['ADMIN', 'REGISTRAR'].includes(role)) {
      res.status(403).json({
        success: false,
        error: 'Only Administrator or Registrar may configure academic periods.',
      });
      return;
    }

    const { academicYear, semesterName, intakeCode, startDate, endDate, status } = req.body as {
      academicYear?: string;
      semesterName?: string;
      intakeCode?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    };

    if (!academicYear?.trim() || !semesterName?.trim() || !intakeCode?.trim() || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'academicYear, semesterName, intakeCode, startDate, and endDate are required.',
      });
      return;
    }

    await ensurePostgresSeeded();

    const [created] = await db
      .insert(academicPeriods)
      .values({
        id: `term-${crypto.randomUUID().slice(0, 8)}`,
        academicYear: academicYear.trim(),
        semesterName: semesterName.trim(),
        intakeCode: intakeCode.trim().toUpperCase(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationOpen: status !== 'CLOSED',
        isCurrent: status === 'ACTIVE',
        status: (status || 'UPCOMING').toUpperCase(),
      })
      .returning();

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to create academic period.',
    });
  }
});

// ----------------------------------------------------------------------------
// 5. ACADEMIC REGISTRATION (SEMESTER ENROLMENT — FEAT-016)
// ----------------------------------------------------------------------------
const ACADEMIC_REG_STAFF_SUBMIT_ROLES = new Set([
  'ADMIN',
  'PRINCIPAL',
  'REGISTRAR',
  'ADMISSIONS_OFFICER',
  'HOD',
]);

const ACADEMIC_REG_APPROVE_ROLES = new Set([
  'REGISTRAR',
  'ADMIN',
  'PRINCIPAL',
  'HOD',
]);

const FEE_CLEARANCE_THRESHOLD_KES = 20000;

interface AcademicUnitInput {
  code: string;
  title: string;
  credits: number;
}

function normalizeUnitsInput(rawUnits: unknown): { ok: true; units: AcademicUnitInput[]; totalCredits: number } | { ok: false; error: string } {
  if (!Array.isArray(rawUnits) || rawUnits.length === 0) {
    return { ok: false, error: 'At least one academic unit is required.' };
  }
  if (rawUnits.length > 8) {
    return { ok: false, error: 'Maximum of 8 academic units allowed per trimester registration.' };
  }
  const seen = new Set<string>();
  const units: AcademicUnitInput[] = [];
  let totalCredits = 0;

  for (const item of rawUnits) {
    if (!item || typeof item !== 'object') {
      return { ok: false, error: 'Invalid academic unit entry.' };
    }
    const rawCode = String((item as Record<string, unknown>).code ?? '').trim().toUpperCase();
    const rawTitle = String((item as Record<string, unknown>).title ?? '').trim();
    const credits = Number((item as Record<string, unknown>).credits ?? 0);

    if (!rawCode || !rawTitle) {
      return { ok: false, error: 'Each unit must include both code and title.' };
    }
    if (!Number.isInteger(credits) || credits < 1 || credits > 6) {
      return { ok: false, error: `Unit ${rawCode} must have an integer credit load between 1 and 6.` };
    }
    if (seen.has(rawCode)) {
      return { ok: false, error: `Duplicate unit code ${rawCode} is not permitted in the same period.` };
    }
    seen.add(rawCode);
    units.push({ code: rawCode, title: rawTitle, credits });
    totalCredits += credits;
  }

  if (totalCredits < 1 || totalCredits > 24) {
    return { ok: false, error: `Total credit load (${totalCredits}) must be between 1 and 24 credits.` };
  }

  return { ok: true, units, totalCredits };
}

router.get('/academic-registrations', requirePortalAuth, async (req: Request, res: Response) => {
  try {
    await ensurePostgresSeeded();
    if (!isPostgresConfigured()) {
      res.json({ success: true, data: [] });
      return;
    }

    const isStudent =
      req.portalUser?.primaryRole === 'STUDENT' && !req.staffUser;

    const statusFilter = String(req.query.status ?? 'ALL').trim().toUpperCase();
    const periodFilter = String(req.query.periodId ?? 'ALL').trim();
    const search = String(req.query.search ?? '').trim().toLowerCase();

    const rows = await db
      .select({
        registration: academicRegistrations,
        studentUserId: studentProfiles.userId,
        studentName: studentProfiles.fullName,
        registrationNumber: studentProfiles.registrationNumber,
        programmeName: studentProfiles.programmeName,
        campusName: studentProfiles.campusName,
        studentStatus: studentProfiles.status,
        feeBalanceKes: studentProfiles.feeBalanceKes,
        academicYear: academicPeriods.academicYear,
        semesterName: academicPeriods.semesterName,
        intakeCode: academicPeriods.intakeCode,
        registrationOpen: academicPeriods.registrationOpen,
      })
      .from(academicRegistrations)
      .innerJoin(studentProfiles, eq(academicRegistrations.studentProfileId, studentProfiles.id))
      .innerJoin(academicPeriods, eq(academicRegistrations.academicPeriodId, academicPeriods.id))
      .orderBy(desc(academicRegistrations.createdAt));

    const scoped = isStudent && req.portalUser
      ? rows.filter(
          (r) =>
            r.studentUserId === req.portalUser?.pgUserId ||
            (req.portalUser?.registrationNumber &&
              r.registrationNumber.toUpperCase() === req.portalUser.registrationNumber.toUpperCase())
        )
      : rows;

    const filtered = scoped.filter((r) => {
      if (statusFilter !== 'ALL' && r.registration.approvalStatus.toUpperCase() !== statusFilter) {
        return false;
      }
      if (periodFilter !== 'ALL' && r.registration.academicPeriodId !== periodFilter) {
        return false;
      }
      if (search) {
        const hay = `${r.studentName} ${r.registrationNumber} ${r.programmeName ?? ''} ${r.intakeCode} ${r.semesterName}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    res.json({
      success: true,
      data: filtered.map((r) => ({
        ...r.registration,
        studentName: r.studentName,
        registrationNumber: r.registrationNumber,
        programmeName: r.programmeName,
        campusName: r.campusName,
        studentStatus: r.studentStatus,
        feeBalanceKes: r.feeBalanceKes,
        academicYear: r.academicYear,
        semesterName: r.semesterName,
        intakeCode: r.intakeCode,
        registrationOpen: r.registrationOpen,
      })),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load academic registrations.',
    });
  }
});

router.post('/academic-registrations', requirePortalAuth, async (req: Request, res: Response) => {
  try {
    await ensurePostgresSeeded();
    if (!isPostgresConfigured()) {
      res.status(503).json({ success: false, error: 'PostgreSQL is not configured.' });
      return;
    }

    const isStudent =
      req.portalUser?.primaryRole === 'STUDENT' && !req.staffUser;

    if (!isStudent && (!req.staffUser || !ACADEMIC_REG_STAFF_SUBMIT_ROLES.has(req.staffUser.role))) {
      res.status(403).json({
        success: false,
        error: 'Only authenticated students or authorized Registry/Admissions/HOD staff can submit semester registrations.',
      });
      return;
    }

    const {
      studentProfileId,
      registrationNumber,
      academicPeriodId,
      units: rawUnits,
      autoApprove,
    } = req.body as {
      studentProfileId?: string;
      registrationNumber?: string;
      academicPeriodId?: string;
      units?: unknown;
      autoApprove?: boolean;
    };

    if (!academicPeriodId?.trim()) {
      res.status(400).json({ success: false, error: 'academicPeriodId is required.' });
      return;
    }

    const unitValidation = normalizeUnitsInput(rawUnits);
    if (!unitValidation.ok) {
      res.status(400).json({ success: false, error: unitValidation.error });
      return;
    }

    // Resolve target student profile safely
    let student: typeof studentProfiles.$inferSelect | undefined;
    if (isStudent && req.portalUser) {
      const [own] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, req.portalUser.pgUserId))
        .limit(1);

      if (!own && req.portalUser.registrationNumber) {
        const [byReg] = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.registrationNumber, req.portalUser.registrationNumber))
          .limit(1);
        student = byReg;
      } else {
        student = own;
      }

      if (!student) {
        res.status(404).json({ success: false, error: 'No linked student profile found for your account.' });
        return;
      }

      if (
        (studentProfileId && studentProfileId.trim() !== student.id) ||
        (registrationNumber &&
          registrationNumber.trim().toUpperCase() !== student.registrationNumber.toUpperCase())
      ) {
        res.status(403).json({
          success: false,
          error: 'Students may only submit academic unit registrations for their own profile.',
        });
        return;
      }
    } else {
      if (studentProfileId?.trim()) {
        const [found] = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.id, studentProfileId.trim()))
          .limit(1);
        student = found;
      } else if (registrationNumber?.trim()) {
        const [found] = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.registrationNumber, registrationNumber.trim().toUpperCase()))
          .limit(1);
        student = found;
      } else {
        res.status(400).json({
          success: false,
          error: 'studentProfileId or registrationNumber is required when submitting as staff.',
        });
        return;
      }

      if (!student) {
        res.status(404).json({ success: false, error: 'Target student profile not found in Cloud SQL SIS.' });
        return;
      }
    }

    // Validate academic period exists & registration is open
    const [period] = await db
      .select()
      .from(academicPeriods)
      .where(eq(academicPeriods.id, academicPeriodId.trim()))
      .limit(1);

    if (!period) {
      res.status(404).json({ success: false, error: 'Selected academic period does not exist.' });
      return;
    }
    if (!period.registrationOpen) {
      res.status(400).json({
        success: false,
        error: `Registration is currently closed for ${period.semesterName} (${period.intakeCode}).`,
      });
      return;
    }

    // Duplicate non-rejected registration guard
    const existingRows = await db
      .select()
      .from(academicRegistrations)
      .where(
        and(
          eq(academicRegistrations.studentProfileId, student.id),
          eq(academicRegistrations.academicPeriodId, period.id)
        )
      );

    const activeOrPending = existingRows.find((r) => r.approvalStatus !== 'REJECTED');
    if (activeOrPending) {
      res.status(409).json({
        success: false,
        error: `Student ${student.registrationNumber} already has a ${activeOrPending.approvalStatus} registration for ${period.intakeCode}.`,
      });
      return;
    }

    const feeThresholdCleared = student.feeBalanceKes <= FEE_CLEARANCE_THRESHOLD_KES;
    const canInstantApprove =
      Boolean(req.staffUser && ['ADMIN', 'PRINCIPAL', 'REGISTRAR'].includes(req.staffUser.role)) &&
      feeThresholdCleared &&
      autoApprove !== false;

    const approvalStatus = canInstantApprove ? 'APPROVED' : 'PENDING';
    const approvedByName = canInstantApprove && req.staffUser ? req.staffUser.fullName : null;
    const id = `areg-${crypto.randomUUID().slice(0, 8)}`;

    const created = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(academicRegistrations)
        .values({
          id,
          studentProfileId: student.id,
          academicPeriodId: period.id,
          unitsJson: unitValidation.units,
          totalCredits: unitValidation.totalCredits,
          feeThresholdCleared,
          approvalStatus,
          approvedByName,
        })
        .returning();

      if (approvalStatus === 'APPROVED' && student.status === 'ADMITTED') {
        await tx
          .update(studentProfiles)
          .set({ status: 'ACTIVE', updatedAt: new Date() })
          .where(eq(studentProfiles.id, student.id));

        await tx.insert(studentStatusHistory).values({
          id: `ssh-${crypto.randomUUID().slice(0, 8)}`,
          studentId: student.id,
          previousStatus: student.status,
          newStatus: 'ACTIVE',
          reason: `Academic registration confirmed for ${period.intakeCode} (${unitValidation.totalCredits} credits)`,
          changedById: req.staffUser?.id ?? String(req.portalUser?.pgUserId ?? 'system'),
          changedByName: approvedByName ?? 'Academic Registry',
        });
      }

      if (student.userId) {
        await tx.insert(notifications).values({
          id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
          recipientUserId: student.userId,
          category: 'ACADEMICS',
          priority: feeThresholdCleared ? 'NORMAL' : 'HIGH',
          title:
            approvalStatus === 'APPROVED'
              ? `Semester Registration Approved: ${period.intakeCode}`
              : `Semester Registration Submitted: ${period.intakeCode}`,
          message: `${unitValidation.units.length} units (${unitValidation.totalCredits} credits) logged for ${period.semesterName}. ${
            feeThresholdCleared
              ? 'Fee clearance threshold satisfied.'
              : `Outstanding balance KES ${student.feeBalanceKes.toLocaleString()} exceeds KES ${FEE_CLEARANCE_THRESHOLD_KES.toLocaleString()} — pending Registrar fee clearance review.`
          }`,
          actionUrl: '/portal/student',
          senderName: approvedByName ?? 'Office of the Academic Registrar',
        });
      }

      return inserted;
    });

    res.status(201).json({
      success: true,
      data: {
        ...created,
        studentName: student.fullName,
        registrationNumber: student.registrationNumber,
        programmeName: student.programmeName,
        campusName: student.campusName,
        studentStatus: approvalStatus === 'APPROVED' && student.status === 'ADMITTED' ? 'ACTIVE' : student.status,
        feeBalanceKes: student.feeBalanceKes,
        academicYear: period.academicYear,
        semesterName: period.semesterName,
        intakeCode: period.intakeCode,
        registrationOpen: period.registrationOpen,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to submit academic registration.',
    });
  }
});

router.patch('/academic-registrations/:id/decision', requirePortalAuth, async (req: Request, res: Response) => {
  try {
    await ensurePostgresSeeded();
    if (!isPostgresConfigured()) {
      res.status(503).json({ success: false, error: 'PostgreSQL is not configured.' });
      return;
    }

    if (!req.staffUser || !ACADEMIC_REG_APPROVE_ROLES.has(req.staffUser.role)) {
      res.status(403).json({
        success: false,
        error: 'Only Registrar, Principal, Admin, or HOD may approve or reject semester registrations.',
      });
      return;
    }

    const regId = String(req.params.id || '').trim();
    const { decision, feeThresholdOverride, comment } = req.body as {
      decision?: string;
      feeThresholdOverride?: boolean;
      comment?: string;
    };

    const normalizedDecision = String(decision ?? '').trim().toUpperCase();
    if (normalizedDecision !== 'APPROVED' && normalizedDecision !== 'REJECTED') {
      res.status(400).json({
        success: false,
        error: "decision must be either 'APPROVED' or 'REJECTED'.",
      });
      return;
    }

    const [existing] = await db
      .select({
        registration: academicRegistrations,
        student: studentProfiles,
        period: academicPeriods,
      })
      .from(academicRegistrations)
      .innerJoin(studentProfiles, eq(academicRegistrations.studentProfileId, studentProfiles.id))
      .innerJoin(academicPeriods, eq(academicRegistrations.academicPeriodId, academicPeriods.id))
      .where(eq(academicRegistrations.id, regId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Academic registration record not found.' });
      return;
    }

    const effectiveFeeCleared =
      existing.registration.feeThresholdCleared ||
      existing.student.feeBalanceKes <= FEE_CLEARANCE_THRESHOLD_KES ||
      Boolean(feeThresholdOverride);

    if (normalizedDecision === 'APPROVED' && !effectiveFeeCleared) {
      res.status(400).json({
        success: false,
        error: `Student fee balance (KES ${existing.student.feeBalanceKes.toLocaleString()}) exceeds KES ${FEE_CLEARANCE_THRESHOLD_KES.toLocaleString()}. Set feeThresholdOverride=true to grant Registrar clearance.`,
      });
      return;
    }

    const approverName = req.staffUser.fullName;
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(academicRegistrations)
        .set({
          approvalStatus: normalizedDecision,
          feeThresholdCleared:
            normalizedDecision === 'APPROVED' ? effectiveFeeCleared : existing.registration.feeThresholdCleared,
          approvedByName: approverName,
          updatedAt: new Date(),
        })
        .where(eq(academicRegistrations.id, regId))
        .returning();

      if (normalizedDecision === 'APPROVED' && existing.student.status === 'ADMITTED') {
        await tx
          .update(studentProfiles)
          .set({ status: 'ACTIVE', updatedAt: new Date() })
          .where(eq(studentProfiles.id, existing.student.id));

        await tx.insert(studentStatusHistory).values({
          id: `ssh-${crypto.randomUUID().slice(0, 8)}`,
          studentId: existing.student.id,
          previousStatus: existing.student.status,
          newStatus: 'ACTIVE',
          reason: `Academic registration approved for ${existing.period.intakeCode}${
            feeThresholdOverride ? ' (with Registrar fee clearance override)' : ''
          }`,
          changedById: req.staffUser!.id,
          changedByName: approverName,
        });
      }

      if (existing.student.userId) {
        await tx.insert(notifications).values({
          id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
          recipientUserId: existing.student.userId,
          category: 'ACADEMICS',
          priority: normalizedDecision === 'REJECTED' ? 'HIGH' : 'NORMAL',
          title: `Academic Registration ${normalizedDecision}: ${existing.period.intakeCode}`,
          message:
            normalizedDecision === 'APPROVED'
              ? `Your ${existing.registration.totalCredits}-credit registration for ${existing.period.semesterName} was approved by ${approverName}.${
                  comment?.trim() ? ` Note: ${comment.trim()}` : ''
                }`
              : `Your registration for ${existing.period.semesterName} was declined by ${approverName}.${
                  comment?.trim() ? ` Reason: ${comment.trim()}` : ' Please contact the Academic Registry.'
                }`,
          actionUrl: '/portal/student',
          senderName: approverName,
        });
      }

      return row;
    });

    res.json({
      success: true,
      data: {
        ...updated,
        studentName: existing.student.fullName,
        registrationNumber: existing.student.registrationNumber,
        programmeName: existing.student.programmeName,
        campusName: existing.student.campusName,
        studentStatus:
          normalizedDecision === 'APPROVED' && existing.student.status === 'ADMITTED'
            ? 'ACTIVE'
            : existing.student.status,
        feeBalanceKes: existing.student.feeBalanceKes,
        academicYear: existing.period.academicYear,
        semesterName: existing.period.semesterName,
        intakeCode: existing.period.intakeCode,
        registrationOpen: existing.period.registrationOpen,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to record academic registration decision.',
    });
  }
});

// ----------------------------------------------------------------------------
// 6. UNIFIED PUBLIC CREDENTIAL & DOCUMENT VERIFICATION (/verify)
// ----------------------------------------------------------------------------
router.get('/verify/:code', async (req: Request, res: Response) => {
  try {
    const rawCode = decodeURIComponent(req.params.code || '').trim();
    if (!rawCode) {
      res.status(400).json({ success: false, error: 'Verification code or reference is required.' });
      return;
    }

    await ensurePostgresSeeded();

    // 1. Check PostgreSQL Digital Signature Requests (e.g. HCA-SIG-9A41C7E2)
    if (isPostgresConfigured()) {
      const [sigReq] = await db
        .select()
        .from(signatureRequests)
        .where(eq(signatureRequests.verificationCode, rawCode.toUpperCase()))
        .limit(1);

      if (sigReq) {
        res.json({
          success: true,
          data: {
            verified: true,
            sourceType: 'DIGITAL_SIGNATURE',
            code: sigReq.verificationCode,
            title: sigReq.documentTitle,
            reference: sigReq.documentReference,
            status: sigReq.status,
            checksumSha256: sigReq.versionChecksumSha256,
            issuedAt: sigReq.completedAt ?? sigReq.createdAt,
            holderMasked: sigReq.requestedByName,
          },
        });
        return;
      }

      // 2. Check Student Registration Number (privacy-minimized confirmation only)
      const [stu] = await db
        .select({
          registrationNumber: studentProfiles.registrationNumber,
          fullName: studentProfiles.fullName,
          programmeName: studentProfiles.programmeName,
          campusName: studentProfiles.campusName,
          status: studentProfiles.status,
          admissionDate: studentProfiles.admissionDate,
        })
        .from(studentProfiles)
        .where(eq(studentProfiles.registrationNumber, rawCode.toUpperCase()))
        .limit(1);

      if (stu) {
        res.json({
          success: true,
          data: {
            verified: true,
            sourceType: 'STUDENT_REGISTRATION',
            code: stu.registrationNumber,
            title: stu.programmeName || 'Accredited HI-TECH College Programme',
            reference: stu.campusName || 'HI-TECH College',
            status: stu.status,
            issuedAt: stu.admissionDate,
            holderMasked: maskHolderName(stu.fullName),
          },
        });
        return;
      }
    }

    // 3. Check Managed Institutional Documents Store (e.g. DOC-2026-...)
    const docStore = getDb();
    const matchedDoc = docStore.documents.find(
      (d) =>
        (d.referenceNumber && d.referenceNumber.toLowerCase() === rawCode.toLowerCase()) ||
        (d.verificationHash && d.verificationHash.toLowerCase() === rawCode.toLowerCase())
    );
    if (matchedDoc && (matchedDoc.status === 'ISSUED' || matchedDoc.status === 'SIGNED' || matchedDoc.status === 'APPROVED')) {
      res.json({
        success: true,
        data: {
          verified: true,
          sourceType: 'INSTITUTIONAL_DOCUMENT',
          code: matchedDoc.verificationHash || matchedDoc.referenceNumber || matchedDoc.id,
          title: matchedDoc.title,
          reference: matchedDoc.referenceNumber || matchedDoc.id,
          status: matchedDoc.status,
          issuedAt: matchedDoc.issuedAt || matchedDoc.updatedAt,
          holderMasked: matchedDoc.departmentName || matchedDoc.category,
        },
      });
      return;
    }

    res.status(404).json({
      success: false,
      error: `No verified institutional credential, digital signature, or active record matched "${rawCode}".`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to verify reference code.',
    });
  }
});

export default router;
