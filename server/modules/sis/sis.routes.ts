import crypto from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../../../src/db/index.ts';
import {
  notifications,
  registrationNumberSequences,
  studentChangeRequests,
  studentEmergencyContacts,
  studentGuardians,
  studentProfiles,
  studentStatusHistory,
  users,
} from '../../../src/db/schema.ts';
import { getDb } from '../../data/store.ts';
import { hashPasswordScrypt } from '../../lib/crypto.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import { requirePortalAuth } from '../../middleware/auth.ts';
import {
  commitBulkStudentsToPostgres,
  validateBulkStudentsForPostgres,
} from './sis.bulkImport.ts';

const router = Router();
router.use(requirePortalAuth);

const SIS_VIEW_ROLES = new Set([
  'ADMIN',
  'PRINCIPAL',
  'REGISTRAR',
  'ADMISSIONS_OFFICER',
  'HOD',
  'LECTURER',
  'FINANCE_OFFICER',
  'STUDENT_AFFAIRS',
  'LIBRARIAN',
  'EXAMINATIONS_OFFICER',
  'QUALITY_ASSURANCE',
]);

const SIS_CREATE_ROLES = new Set(['ADMIN', 'PRINCIPAL', 'REGISTRAR', 'ADMISSIONS_OFFICER']);
const SIS_APPROVE_ROLES = new Set(['PRINCIPAL', 'REGISTRAR', 'HOD']);
const FINANCE_ROLES = new Set(['FINANCE_OFFICER', 'REGISTRAR', 'PRINCIPAL']);
const WELFARE_ROLES = new Set(['STUDENT_AFFAIRS', 'PRINCIPAL']);

async function allocateAtomicStudentNumber(): Promise<string> {
  const year = 2026;
  const result = await db.transaction(async (tx) => {
    const updated = await tx
      .update(registrationNumberSequences)
      .set({
        lastSequence: sql`${registrationNumberSequences.lastSequence} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(registrationNumberSequences.category, 'STU'),
          eq(registrationNumberSequences.academicYear, year)
        )
      )
      .returning();

    if (updated[0]) {
      return updated[0].lastSequence;
    }

    const [inserted] = await tx
      .insert(registrationNumberSequences)
      .values({ category: 'STU', academicYear: year, lastSequence: 10 })
      .returning();
    return inserted.lastSequence;
  });

  return `HCA/STU/${year}/${String(result).padStart(4, '0')}`;
}

function getTabPermissions(role: string, isOwnProfile: boolean) {
  return {
    canEditPersonal: isOwnProfile || ['ADMIN', 'REGISTRAR', 'ADMISSIONS_OFFICER'].includes(role),
    canViewFinance: isOwnProfile || FINANCE_ROLES.has(role),
    canViewWelfare: isOwnProfile || WELFARE_ROLES.has(role),
    canManageStatus: ['REGISTRAR', 'PRINCIPAL'].includes(role),
    canApproveChanges: SIS_APPROVE_ROLES.has(role),
    canRequestChanges:
      isOwnProfile || ['REGISTRAR', 'ADMISSIONS_OFFICER', 'STUDENT_AFFAIRS', 'HOD'].includes(role),
    canManageGuardians: isOwnProfile || ['REGISTRAR', 'ADMISSIONS_OFFICER', 'STUDENT_AFFAIRS'].includes(role),
    canViewAudit: ['REGISTRAR', 'PRINCIPAL', 'ADMIN', 'QUALITY_ASSURANCE'].includes(role),
  };
}

function sanitizeStudentRow(
  row: typeof studentProfiles.$inferSelect,
  role: string,
  isOwnProfile: boolean
) {
  const perms = getTabPermissions(role, isOwnProfile);
  return {
    ...row,
    feeBalanceKes: perms.canViewFinance ? row.feeBalanceKes : null,
    feeCategory: perms.canViewFinance ? row.feeCategory : 'RESTRICTED',
    welfareFlag: perms.canViewWelfare ? row.welfareFlag : null,
  };
}

router.get('/lookups', (_req, res) => {
  const store = getDb();
  res.json({
    success: true,
    data: {
      campuses: store.campuses,
      departments: store.departments,
      programmes: store.programmes,
      intakes: store.intakes,
    },
  });
});

router.get('/students', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    const portal = req.portalUser;
    const role = staff?.role ?? portal?.primaryRole ?? 'STUDENT';

    const allRows = await db
      .select()
      .from(studentProfiles)
      .orderBy(desc(studentProfiles.createdAt));

    // Strict record-level scoping: Students only see their own profile unless staff with SIS view
    const isStaffViewer = Boolean(staff && SIS_VIEW_ROLES.has(staff.role));
    let scoped = allRows;

    if (!isStaffViewer) {
      scoped = allRows.filter(
        (s) =>
          (portal?.pgUserId && s.userId === portal.pgUserId) ||
          (portal?.email && s.email.toLowerCase() === portal.email.toLowerCase())
      );
    } else if (staff && (staff.role === 'HOD' || staff.role === 'LECTURER') && staff.departmentId) {
      scoped = allRows.filter((s) => !s.departmentId || s.departmentId === staff.departmentId);
    }

    const search = String(req.query.search ?? '').trim().toLowerCase();
    const statusFilter = String(req.query.status ?? 'ALL').toUpperCase();
    const campusFilter = String(req.query.campusId ?? 'ALL');

    const filtered = scoped.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (campusFilter !== 'ALL' && s.campusId !== campusFilter) return false;
      if (search) {
        return (
          s.fullName.toLowerCase().includes(search) ||
          s.registrationNumber.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          (s.programmeName ?? '').toLowerCase().includes(search)
        );
      }
      return true;
    });

    const stats = {
      totalStudents: scoped.length,
      activeStudents: scoped.filter((s) => s.status === 'ACTIVE').length,
      admittedStudents: scoped.filter((s) => s.status === 'ADMITTED').length,
      deferredStudents: scoped.filter((s) => s.status === 'DEFERRED').length,
      completedOrGraduated: scoped.filter((s) =>
        ['COMPLETED', 'GRADUATED'].includes(s.status)
      ).length,
    };

    res.json({
      success: true,
      data: {
        items: filtered.map((r) =>
          sanitizeStudentRow(r, role, Boolean(portal?.pgUserId && r.userId === portal.pgUserId))
        ),
        stats,
        canCreate: SIS_CREATE_ROLES.has(role),
        canApproveChanges: SIS_APPROVE_ROLES.has(role),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch student records.',
    });
  }
});

router.post('/students', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    if (!staff || !SIS_CREATE_ROLES.has(staff.role)) {
      res.status(403).json({
        success: false,
        error: 'Creating student master records requires Admissions Officer, Registrar, Principal, or Admin role.',
      });
      return;
    }

    const fullName = String(req.body?.fullName ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const phoneNumber = String(req.body?.phoneNumber ?? '').trim();
    const gender = String(req.body?.gender ?? 'NOT_SPECIFIED').toUpperCase();
    const campusId = String(req.body?.campusId ?? 'cmp-nairobi');
    const programmeId = String(req.body?.programmeId ?? 'prog-dict-l6');
    const intakeName = String(req.body?.intakeName ?? 'September 2026 Intake');

    if (!fullName || !email) {
      res.status(400).json({ success: false, error: 'Full name and email are required.' });
      return;
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) {
      res.status(409).json({
        success: false,
        error: 'A central portal identity with this email already exists (duplicate protection).',
      });
      return;
    }

    const store = getDb();
    const campus = store.campuses.find((c) => c.id === campusId);
    const programme = store.programmes.find((p) => p.id === programmeId);
    const department = store.departments.find((d) => d.id === programme?.departmentId);

    const registrationNumber = await allocateAtomicStudentNumber();
    const uid = `acc-stu-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const defaultPass = hashPasswordScrypt(process.env.SEED_DEFAULT_PASSWORD || 'Hitech@2026!');

    const [createdUser] = await db
      .insert(users)
      .values({
        uid,
        email,
        registrationNumber,
        fullName,
        primaryRole: 'STUDENT',
        accountStatus: 'ACTIVE',
        passwordHash: defaultPass,
        mustChangePassword: true,
        requiresProfileCompletion: true,
        campusId: campus?.id ?? campusId,
        departmentId: department?.id ?? 'dept-computing',
      })
      .returning();

    const profileId = `sis-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const [profile] = await db
      .insert(studentProfiles)
      .values({
        id: profileId,
        userId: createdUser.id,
        registrationNumber,
        fullName,
        email,
        gender,
        phoneNumber: phoneNumber || null,
        campusId: campus?.id ?? campusId,
        campusName: campus?.name ?? 'Nairobi Main Campus',
        departmentId: department?.id ?? 'dept-computing',
        departmentName: department?.name ?? 'School of Computing & Informatics',
        programmeId: programme?.id ?? programmeId,
        programmeName: programme?.name ?? 'Diploma in Information Communication Technology (Level 6)',
        intakeName,
        admissionDate: new Date(),
        status: 'ADMITTED',
        profileCompleted: false,
      })
      .returning();

    await db.insert(studentStatusHistory).values({
      id: `sth-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      studentId: profileId,
      previousStatus: null,
      newStatus: 'ADMITTED',
      reason: 'Student profile created and official registration number generated.',
      changedById: staff.id,
      changedByName: staff.fullName,
    });

    if (req.body?.guardianName) {
      await db.insert(studentGuardians).values({
        id: `grd-${Date.now()}`,
        studentId: profileId,
        fullName: String(req.body.guardianName),
        relationship: String(req.body.guardianRelationship || 'Guardian'),
        phoneNumber: String(req.body.guardianPhone || ''),
        email: String(req.body.guardianEmail || ''),
        isPrimary: true,
        portalAccess: false,
      });
    }

    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create student record.',
    });
  }
});

router.post('/students/bulk-validate', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    if (!staff || !SIS_CREATE_ROLES.has(staff.role)) {
      res.status(403).json({
        success: false,
        error: 'Bulk student validation requires Registrar, Admissions Officer, Principal, or Admin role.',
      });
      return;
    }

    const csvText = typeof req.body?.csvText === 'string' ? req.body.csvText : '';
    const year = req.body?.year ? Number(req.body.year) : 2026;
    const result = await validateBulkStudentsForPostgres(csvText, year);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to validate student CSV.',
    });
  }
});

router.post('/students/bulk-import', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    if (!staff || !SIS_CREATE_ROLES.has(staff.role)) {
      res.status(403).json({
        success: false,
        error: 'Bulk student database import requires Registrar, Admissions Officer, Principal, or Admin role.',
      });
      return;
    }

    const csvText = typeof req.body?.csvText === 'string' ? req.body.csvText : '';
    const year = req.body?.year ? Number(req.body.year) : 2026;
    const commitValidOnly = Boolean(req.body?.commitValidOnly);

    const result = await commitBulkStudentsToPostgres(
      { id: staff.id, fullName: staff.fullName },
      csvText,
      year,
      commitValidOnly
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to import student CSV.';
    const status = message.includes('Validation found') || message.includes('CSV') || message.includes('No valid')
      ? 400
      : 500;
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

router.get('/students/:id', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    const portal = req.portalUser;
    const role = staff?.role ?? portal?.primaryRole ?? 'STUDENT';

    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, String(req.params.id)))
      .limit(1);

    if (!profile) {
      res.status(404).json({ success: false, error: 'Student profile not found.' });
      return;
    }

    const isOwn = Boolean(
      (portal?.pgUserId && profile.userId === portal.pgUserId) ||
        (portal?.email && profile.email.toLowerCase() === portal.email.toLowerCase())
    );
    if (!isOwn && !(staff && SIS_VIEW_ROLES.has(staff.role))) {
      res.status(403).json({ success: false, error: 'Access denied to this student profile.' });
      return;
    }

    const tabPerms = getTabPermissions(role, isOwn);
    const [portalAccount] = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        primaryRole: users.primaryRole,
        accountStatus: users.accountStatus,
        mfaEnabled: users.mfaEnabled,
        mustChangePassword: users.mustChangePassword,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, profile.userId))
      .limit(1);

    const guardians = await db
      .select()
      .from(studentGuardians)
      .where(eq(studentGuardians.studentId, profile.id));
    const emergencyContacts = await db
      .select()
      .from(studentEmergencyContacts)
      .where(eq(studentEmergencyContacts.studentId, profile.id));
    const statusHistory = await db
      .select()
      .from(studentStatusHistory)
      .where(eq(studentStatusHistory.studentId, profile.id))
      .orderBy(desc(studentStatusHistory.effectiveAt));
    const changeRequests = await db
      .select()
      .from(studentChangeRequests)
      .where(eq(studentChangeRequests.studentId, profile.id))
      .orderBy(desc(studentChangeRequests.createdAt));

    const store = getDb();
    const docs = store.documents.filter(
      (d) =>
        d.recipientEmail?.toLowerCase() === profile.email.toLowerCase() ||
        d.recipientLabel.toLowerCase().includes(profile.fullName.toLowerCase()) ||
        d.confidentiality === 'PUBLIC'
    );

    res.json({
      success: true,
      data: {
        profile: sanitizeStudentRow(profile, role, isOwn),
        portalAccount,
        guardians,
        emergencyContacts,
        statusHistory,
        changeRequests,
        documents: docs.map((d) => ({
          id: d.id,
          title: d.title,
          referenceNumber: d.referenceNumber,
          category: d.category,
          status: d.status,
          issuedAt: d.issuedAt,
        })),
        registeredUnits: [
          { code: 'ICT 2101', title: 'Software Architecture & Design', credits: 4, grade: 'A-' },
          { code: 'ICT 2104', title: 'Relational Databases & Cloud SQL', credits: 4, grade: 'A' },
          { code: 'AI 3102', title: 'Applied Machine Learning', credits: 3, grade: 'B+' },
        ],
        permissions: tabPerms,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load student master profile.',
    });
  }
});

router.patch('/students/:id', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    const portal = req.portalUser;
    const role = staff?.role ?? portal?.primaryRole ?? 'STUDENT';

    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, String(req.params.id)))
      .limit(1);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Student profile not found.' });
      return;
    }
    const isOwn = Boolean(portal?.pgUserId && profile.userId === portal.pgUserId);
    const perms = getTabPermissions(role, isOwn);
    if (!perms.canEditPersonal) {
      res.status(403).json({ success: false, error: 'Not authorized to update personal details.' });
      return;
    }

    const [updated] = await db
      .update(studentProfiles)
      .set({
        phoneNumber: req.body?.phoneNumber !== undefined ? String(req.body.phoneNumber) : profile.phoneNumber,
        alternatePhone: req.body?.alternatePhone !== undefined ? String(req.body.alternatePhone) : profile.alternatePhone,
        address: req.body?.address !== undefined ? String(req.body.address) : profile.address,
        nationality: req.body?.nationality !== undefined ? String(req.body.nationality) : profile.nationality,
        profileCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.id, profile.id))
      .returning();

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update student profile.',
    });
  }
});

router.post('/students/:id/guardians', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    const portal = req.portalUser;
    const role = staff?.role ?? portal?.primaryRole ?? 'STUDENT';

    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, String(req.params.id)))
      .limit(1);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    const isOwn = Boolean(portal?.pgUserId && profile.userId === portal.pgUserId);
    if (!getTabPermissions(role, isOwn).canManageGuardians) {
      res.status(403).json({ success: false, error: 'Not authorized to manage guardian links.' });
      return;
    }

    const [created] = await db
      .insert(studentGuardians)
      .values({
        id: `grd-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        studentId: profile.id,
        fullName: String(req.body?.fullName ?? '').trim(),
        relationship: String(req.body?.relationship ?? 'Guardian').trim(),
        phoneNumber: String(req.body?.phoneNumber ?? '').trim(),
        email: String(req.body?.email ?? '').trim(),
        portalAccess: Boolean(req.body?.portalAccess),
        consentRecordedAt: req.body?.portalAccess ? new Date() : null,
      })
      .returning();

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add guardian.',
    });
  }
});

router.post('/students/:id/change-requests', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    const portal = req.portalUser;
    const role = staff?.role ?? portal?.primaryRole ?? 'STUDENT';

    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, String(req.params.id)))
      .limit(1);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Student profile not found.' });
      return;
    }

    const isOwn = Boolean(portal?.pgUserId && profile.userId === portal.pgUserId);
    if (!getTabPermissions(role, isOwn).canRequestChanges) {
      res.status(403).json({ success: false, error: 'Not authorized to submit lifecycle change requests.' });
      return;
    }

    const changeType = String(req.body?.changeType ?? 'DEFERMENT').toUpperCase();
    const reason = String(req.body?.reason ?? '').trim();
    if (!reason) {
      res.status(400).json({ success: false, error: 'Please provide a reason for this request.' });
      return;
    }

    const [created] = await db
      .insert(studentChangeRequests)
      .values({
        id: `scr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        studentId: profile.id,
        changeType,
        status: 'REQUESTED',
        reason,
        requestedById: staff?.id ?? portal?.uid ?? 'self',
        requestedByName: staff?.fullName ?? portal?.fullName ?? profile.fullName,
        effectiveDate: req.body?.effectiveDate ? new Date(String(req.body.effectiveDate)) : new Date(),
        metadata: req.body?.metadata ?? {},
      })
      .returning();

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit change request.',
    });
  }
});

router.post('/change-requests/:requestId/decide', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    if (!staff || !SIS_APPROVE_ROLES.has(staff.role)) {
      res.status(403).json({
        success: false,
        error: 'Only Registrar, Principal, or HOD may approve or reject student lifecycle transitions.',
      });
      return;
    }

    const decision = String(req.body?.decision ?? '').toUpperCase();
    const reviewComment = String(req.body?.comment ?? '').trim();
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      res.status(400).json({ success: false, error: 'Decision must be APPROVED or REJECTED.' });
      return;
    }

    const [changeReq] = await db
      .select()
      .from(studentChangeRequests)
      .where(eq(studentChangeRequests.id, String(req.params.requestId)))
      .limit(1);

    if (!changeReq) {
      res.status(404).json({ success: false, error: 'Change request not found.' });
      return;
    }

    const [student] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, changeReq.studentId))
      .limit(1);

    if (!student) {
      res.status(404).json({ success: false, error: 'Linked student record missing.' });
      return;
    }

    const now = new Date();
    const finalReqStatus = decision === 'APPROVED' ? 'COMPLETED' : 'REJECTED';

    await db.transaction(async (tx) => {
      await tx
        .update(studentChangeRequests)
        .set({
          status: finalReqStatus,
          reviewedById: staff.id,
          reviewedByName: staff.fullName,
          reviewComment: reviewComment || (decision === 'APPROVED' ? 'Approved by Academic Registry' : 'Declined'),
          reviewedAt: now,
          completedAt: decision === 'APPROVED' ? now : null,
          updatedAt: now,
        })
        .where(eq(studentChangeRequests.id, changeReq.id));

      if (decision === 'APPROVED') {
        let nextStatus = student.status;
        let nextCampusName = student.campusName;
        let nextCampusId = student.campusId;
        let nextProgrammeName = student.programmeName;
        let nextProgrammeId = student.programmeId;
        let completionDate = student.completionDate;
        let graduationDate = student.graduationDate;

        const meta = (changeReq.metadata ?? {}) as Record<string, string>;
        const store = getDb();

        if (changeReq.changeType === 'DEFERMENT') {
          nextStatus = 'DEFERRED';
        } else if (changeReq.changeType === 'RESUMPTION') {
          nextStatus = 'ACTIVE';
        } else if (changeReq.changeType === 'WITHDRAWAL') {
          nextStatus = 'WITHDRAWN';
        } else if (changeReq.changeType === 'GRADUATION') {
          nextStatus = 'GRADUATED';
          completionDate = completionDate ?? now;
          graduationDate = now;
        } else if (changeReq.changeType === 'PROGRAMME_TRANSFER' && meta.targetProgrammeId) {
          const prog = store.programmes.find((p) => p.id === meta.targetProgrammeId);
          if (prog) {
            nextProgrammeId = prog.id;
            nextProgrammeName = prog.name;
          }
        } else if (changeReq.changeType === 'CAMPUS_TRANSFER' && meta.targetCampusId) {
          const cmp = store.campuses.find((c) => c.id === meta.targetCampusId);
          if (cmp) {
            nextCampusId = cmp.id;
            nextCampusName = cmp.name;
          }
        }

        await tx
          .update(studentProfiles)
          .set({
            status: nextStatus,
            campusId: nextCampusId,
            campusName: nextCampusName,
            programmeId: nextProgrammeId,
            programmeName: nextProgrammeName,
            completionDate,
            graduationDate,
            updatedAt: now,
          })
          .where(eq(studentProfiles.id, student.id));

        await tx.insert(studentStatusHistory).values({
          id: `sth-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          studentId: student.id,
          previousStatus: student.status,
          newStatus: nextStatus,
          reason: `${changeReq.changeType}: ${changeReq.reason}${reviewComment ? ` (${reviewComment})` : ''}`,
          changedById: staff.id,
          changedByName: staff.fullName,
          effectiveAt: now,
        });
      }
    });

    await db.insert(notifications).values({
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      recipientUserId: student.userId,
      category: 'ACADEMIC',
      priority: 'HIGH',
      title: `SIS Request ${decision === 'APPROVED' ? 'Approved' : 'Declined'}: ${changeReq.changeType.replaceAll('_', ' ')}`,
      message: `Your ${changeReq.changeType.replaceAll('_', ' ').toLowerCase()} request was ${decision.toLowerCase()} by ${staff.fullName}.`,
      senderName: 'Office of the Academic Registrar',
    });

    res.json({ success: true, data: { status: finalReqStatus } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to process change request decision.',
    });
  }
});

router.get('/reports/enrolment', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const staff = req.staffUser;
    if (!staff || !SIS_VIEW_ROLES.has(staff.role)) {
      res.status(403).json({ success: false, error: 'SIS reports require authorized staff access.' });
      return;
    }
    const rows = await db.select().from(studentProfiles);

    const byCampus: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byProgramme: Record<string, number> = {};

    for (const s of rows) {
      const cName = s.campusName || 'Unassigned Campus';
      byCampus[cName] = (byCampus[cName] ?? 0) + 1;
      byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
      const pName = s.programmeName || 'Unassigned Programme';
      byProgramme[pName] = (byProgramme[pName] ?? 0) + 1;
    }

    res.json({
      success: true,
      data: {
        totalRecords: rows.length,
        byCampus,
        byStatus,
        byProgramme,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to compute enrolment reports.',
    });
  }
});

export default router;
