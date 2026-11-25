import crypto from 'node:crypto';
import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db, isPostgresConfigured } from '../../../src/db/index.ts';
import {
  registrationNumberSequences,
  studentProfiles,
  studentStatusHistory,
  users,
} from '../../../src/db/schema.ts';
import { getDb, saveDb } from '../../data/store.ts';
import { hashPasswordScrypt } from '../../lib/crypto.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import { requireAuth, requirePermission } from '../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../staff/staff.permissions.ts';
import type {
  AdmissionApplicationRecord,
  AdmissionWorkflowStatus,
} from '../website/website.types.ts';

const router = Router();

const ALLOWED_ADMISSION_STATUSES: Set<AdmissionWorkflowStatus> = new Set([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCUMENTS_REQUIRED',
  'APPROVED',
  'OFFER_SENT',
  'OFFER_ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'REGISTERED',
]);

async function allocateStudentRegNumber(): Promise<string> {
  const year = 2026;
  if (isPostgresConfigured()) {
    await ensurePostgresSeeded();
    const seq = await db.transaction(async (tx) => {
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
      if (updated[0]) return updated[0].lastSequence;
      const [inserted] = await tx
        .insert(registrationNumberSequences)
        .values({ category: 'STU', academicYear: year, lastSequence: 25 })
        .returning();
      return inserted.lastSequence;
    });
    return `HCA/STU/${year}/${String(seq).padStart(4, '0')}`;
  }

  const store = getDb();
  store.sequences.studentSeq += 1;
  saveDb(store);
  return `HCA/STU/${year}/${String(store.sequences.studentSeq).padStart(4, '0')}`;
}

function createApplicationFromBody(body: Record<string, unknown>, initialStatus: AdmissionWorkflowStatus): AdmissionApplicationRecord {
  const store = getDb();
  const fullName = String(body.applicantName ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? body.phoneNumber ?? '').trim();
  if (!fullName || !email) {
    throw new Error('Applicant full name and email are required.');
  }

  const parts = fullName.split(/\s+/);
  const firstName = parts[0] || fullName;
  const lastName = parts.slice(1).join(' ') || parts[0] || '';
  const now = new Date().toISOString();
  const appNum = `APP-2026-${String(108 + store.admissionApplications.length).padStart(4, '0')}`;

  const record: AdmissionApplicationRecord = {
    id: `adm-app-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    applicationNumber: appNum,
    applicantName: fullName,
    firstName,
    lastName,
    email,
    phone,
    nationalIdOrIndex: String(body.nationalIdOrIndex ?? 'KCSE-PENDING').trim(),
    programmeName: String(body.programmeName ?? body.targetProgramme ?? 'Diploma in Information Communication Technology (DICT)').trim(),
    departmentName: body.departmentName ? String(body.departmentName) : undefined,
    campusName: String(body.campusName ?? body.targetCampus ?? 'Nairobi Main Campus').trim(),
    intakeName: String(body.intakeName ?? body.intake ?? 'September 2026 Intake').trim(),
    studyMode: String(body.studyMode ?? 'Full-time').trim(),
    meanGrade: String(body.meanGrade ?? 'C+').trim(),
    status: initialStatus,
    missingDocumentsNote: null,
    documents: Array.isArray(body.documents)
      ? (body.documents as { name: string; status: 'VERIFIED' | 'PENDING' | 'MISSING' }[])
      : [
          { name: 'KCSE Result Slip', status: 'PENDING' },
          { name: 'National ID Copy', status: 'PENDING' },
          { name: 'Passport Photo', status: 'PENDING' },
        ],
    offerLetterRef: null,
    submittedAt: now,
    updatedAt: now,
  };

  store.admissionApplications.unshift(record);
  saveDb(store);
  return record;
}

// Public online application endpoint from website /apply
router.post('/apply', (req, res) => {
  try {
    const created = createApplicationFromBody(req.body ?? {}, 'SUBMITTED');
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to submit online application.',
    });
  }
});

// Authenticated Staff Admissions Queue
router.get(
  '/',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.STUDENTS_VIEW),
  (req, res) => {
    const store = getDb();
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : 'ALL';
    const campus = typeof req.query.campus === 'string' ? req.query.campus : 'ALL';

    const all = store.admissionApplications;
    const filtered = all.filter((app) => {
      if (status !== 'ALL' && app.status !== status) return false;
      if (campus !== 'ALL' && app.campusName !== campus) return false;
      if (q) {
        const hay = `${app.applicationNumber} ${app.applicantName} ${app.email} ${app.programmeName}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });

    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 20) || 20));
    const total = filtered.length;

    res.json({
      success: true,
      data: {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        summary: {
          total: all.length,
          submittedOrReview: all.filter((a) => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length,
          documentsRequired: all.filter((a) => a.status === 'DOCUMENTS_REQUIRED').length,
          offersAndAccepted: all.filter((a) => ['APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(a.status)).length,
          registered: all.filter((a) => a.status === 'REGISTERED').length,
        },
      },
    });
  }
);

router.post(
  '/',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.ADMISSIONS_MANAGE),
  (req, res) => {
    try {
      const created = createApplicationFromBody(req.body ?? {}, 'UNDER_REVIEW');
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unable to create admission record.',
      });
    }
  }
);

router.patch(
  '/:id/status',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.ADMISSIONS_MANAGE),
  (req, res) => {
    const store = getDb();
    const app = store.admissionApplications.find((a) => a.id === String(req.params.id));
    if (!app) {
      res.status(404).json({ success: false, error: 'Admission application not found.' });
      return;
    }

    const nextStatus = String(req.body?.status ?? '').toUpperCase() as AdmissionWorkflowStatus;
    if (!ALLOWED_ADMISSION_STATUSES.has(nextStatus)) {
      res.status(400).json({ success: false, error: 'Invalid admission workflow status.' });
      return;
    }

    const now = new Date().toISOString();
    app.status = nextStatus;
    app.updatedAt = now;
    app.reviewedByName = req.staffUser!.fullName;

    if (nextStatus === 'DOCUMENTS_REQUIRED') {
      app.missingDocumentsNote =
        String(req.body?.missingDocumentsNote ?? 'Additional certified academic documents required.').trim();
    } else {
      app.missingDocumentsNote = null;
    }

    if (nextStatus === 'APPROVED') {
      app.approvedByName = req.staffUser!.fullName;
    }

    if (nextStatus === 'OFFER_SENT' && !app.offerLetterRef) {
      app.offerLetterRef = `HCA/OFR/2026/${String(store.admissionApplications.length + 20).padStart(4, '0')}`;
      app.offerIssuedAt = now;
      app.approvedByName = app.approvedByName ?? req.staffUser!.fullName;
    }

    if (nextStatus === 'OFFER_ACCEPTED') {
      app.acceptedAt = now;
    }

    saveDb(store);
    res.json({ success: true, data: app });
  }
);

router.post(
  '/:id/convert',
  requireAuth,
  requirePermission(STAFF_PERMISSIONS.REGISTRATION_MANAGE),
  async (req, res) => {
    try {
      const store = getDb();
      const app = store.admissionApplications.find((a) => a.id === String(req.params.id));
      if (!app) {
        res.status(404).json({ success: false, error: 'Admission application not found.' });
        return;
      }

      if (!['APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(app.status)) {
        res.status(400).json({
          success: false,
          error: 'Only approved or offer-accepted applicants may be converted into registered students.',
        });
        return;
      }

      if (app.generatedStudentRegNo) {
        res.json({ success: true, data: app });
        return;
      }

      const registrationNumber = await allocateStudentRegNumber();
      let linkedStudentId: string | null = null;

      if (isPostgresConfigured()) {
        await ensurePostgresSeeded();
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, app.email.toLowerCase()))
          .limit(1);

        let userId = existingUser[0]?.id;
        if (!userId) {
          const [createdUser] = await db
            .insert(users)
            .values({
              uid: `acc-stu-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
              email: app.email.toLowerCase(),
              registrationNumber,
              fullName: app.applicantName,
              primaryRole: 'STUDENT',
              accountStatus: 'ACTIVE',
              passwordHash: hashPasswordScrypt(process.env.SEED_DEFAULT_PASSWORD || 'Hitech@2026!'),
              mustChangePassword: true,
              emailVerifiedAt: null,
              emailVerificationRequired: true,
              requiresProfileCompletion: true,
              campusId: 'cmp-nairobi',
              departmentId: 'dept-computing',
            })
            .returning();
          userId = createdUser.id;
        }

        const profileId = `sis-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
        await db.insert(studentProfiles).values({
          id: profileId,
          userId,
          registrationNumber,
          fullName: app.applicantName,
          email: app.email.toLowerCase(),
          phoneNumber: app.phone || null,
          campusId: 'cmp-nairobi',
          campusName: app.campusName,
          departmentId: 'dept-computing',
          departmentName: app.departmentName ?? 'School of Computing & Informatics',
          programmeId: 'prog-dict-l6',
          programmeName: app.programmeName,
          intakeName: app.intakeName,
          admissionDate: new Date(),
          status: 'ADMITTED',
          profileCompleted: false,
        });

        await db.insert(studentStatusHistory).values({
          id: `sth-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          studentId: profileId,
          previousStatus: null,
          newStatus: 'ADMITTED',
          reason: `Converted from Admissions Application ${app.applicationNumber}.`,
          changedById: req.staffUser!.id,
          changedByName: req.staffUser!.fullName,
        });
        linkedStudentId = profileId;
      }

      app.status = 'REGISTERED';
      app.generatedStudentRegNo = registrationNumber;
      app.linkedStudentId = linkedStudentId;
      app.updatedAt = new Date().toISOString();
      saveDb(store);

      res.json({ success: true, data: app });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to convert applicant into student.',
      });
    }
  }
);

export default router;
