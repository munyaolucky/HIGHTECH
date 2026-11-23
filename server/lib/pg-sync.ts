import crypto from 'node:crypto';
import { count, eq } from 'drizzle-orm';
import { db, isPostgresConfigured } from '../../src/db/index.ts';
import {
  academicPeriods,
  academicRegistrations,
  campuses,
  departments,
  financeAuditLogs,
  financeClearances,
  financeFeeStructures,
  financeLedgerCharges,
  financePaymentPlans,
  financePayments,
  financeReceipts,
  financeRefundRequests,
  financeStudentAccounts,
  mpesaTransactions,
  notificationPreferences,
  notificationTemplates,
  notifications,
  platformFeatures,
  portalStateSnapshots,
  programmes,
  registrationNumberSequences,
  secureExamAuditLogs,
  secureExamDefinitions,
  secureExamIncidents,
  secureExamMessages,
  secureExamSecurityEvents,
  secureExamSessions,
  signatureAuditEvents,
  signatureRequests,
  documentSigners,
  signingAuthorities,
  signingCertificates,
  sprintBaselineTasks,
  studentEmergencyContacts,
  studentGuardians,
  studentProfiles,
  studentStatusHistory,
  users,
} from '../../src/db/schema.ts';
import {
  MASTER_FEATURES_84,
  SPRINT_1_BASELINE_TASKS,
} from '../../src/data/platformMasterBlueprint.ts';
import {
  getDb,
  hydrateDbFromSnapshot,
  registerPostgresSyncHook,
  type PortalDatabase,
} from '../data/store.ts';
import { hashPasswordScrypt } from './crypto.ts';

let seedPromise: Promise<void> | null = null;

// Seeded institutional credential hash used for newly seeded accounts in preview/dev
const DEFAULT_SEEDED_HASH = hashPasswordScrypt(
  process.env.SEED_DEFAULT_PASSWORD || 'Hitech@2026!'
);

async function runSeed(): Promise<void> {
  if (!isPostgresConfigured()) return;

  const store = getDb();

  // 1. Sync Staff Accounts into PostgreSQL `users`
  for (const staff of store.staffAccounts) {
    await db
      .insert(users)
      .values({
        uid: staff.id,
        email: staff.email.toLowerCase(),
        registrationNumber: staff.employeeNumber,
        fullName: staff.fullName,
        primaryRole: staff.role,
        accountStatus: staff.status,
        passwordHash: DEFAULT_SEEDED_HASH,
        mustChangePassword: false,
        requiresProfileCompletion: false,
        mfaEnabled: false,
        campusId: staff.campusId,
        departmentId: staff.departmentId,
      })
      .onConflictDoNothing();
  }

  // 2. Sync Student & Demo Users into PostgreSQL `users`
  const seededStudents = [
    {
      uid: 'acc-stu-001',
      email: 'bmutai@student.hitech.ac.ke',
      registrationNumber: 'HCA/STU/2026/0001',
      fullName: 'Brian Kiprop Mutai',
      campusId: 'cmp-nairobi',
      campusName: 'Nairobi Main Campus',
      departmentId: 'dept-computing',
      departmentName: 'School of Computing & Informatics',
      programmeId: 'prog-dict-l6',
      programmeName: 'Diploma in Information Communication Technology (Level 6)',
      intakeName: 'January 2026 Intake',
      status: 'ACTIVE',
      feeBalanceKes: 0,
      attendanceRatePct: 94,
      meanGradeLabel: 'Credit Distinction (76%)',
      phoneNumber: '+254712345678',
      gender: 'MALE',
      dob: '2004-05-14',
      guardianName: 'Josephat Mutai',
      guardianPhone: '+254722111333',
      guardianEmail: 'jmutai@example.co.ke',
      guardianRelationship: 'Father',
    },
    {
      uid: 'acc-stu-amina',
      email: 'awanjiku@student.hitech.ac.ke',
      registrationNumber: 'HCA/STU/2026/001',
      fullName: 'Amina Wanjiku Kamau',
      campusId: 'cmp-nairobi',
      campusName: 'Nairobi Main Campus',
      departmentId: 'dept-computing',
      departmentName: 'School of Computing & Informatics',
      programmeId: 'prog-dict-l6',
      programmeName: 'Diploma in Computer Science & ICT',
      intakeName: 'January 2026 Intake',
      status: 'ACTIVE',
      feeBalanceKes: 12500,
      attendanceRatePct: 96,
      meanGradeLabel: 'Distinction (81%)',
      phoneNumber: '+254711223344',
      gender: 'FEMALE',
      dob: '2004-08-22',
      guardianName: 'Grace Kamau',
      guardianPhone: '+254722445566',
      guardianEmail: 'gkamau@example.co.ke',
      guardianRelationship: 'Mother',
    },
    {
      uid: 'acc-stu-002',
      email: 'fomondi@student.hitech.ac.ke',
      registrationNumber: 'HCA/STU/2026/0002',
      fullName: 'Faith Akinyi Omondi',
      campusId: 'cmp-westlands',
      campusName: 'Westlands Technology Park Campus',
      departmentId: 'dept-computing',
      departmentName: 'School of Computing & Informatics',
      programmeId: 'prog-dse-l6',
      programmeName: 'Diploma in Software Engineering & Cloud Systems',
      intakeName: 'May 2026 Intake',
      status: 'ADMITTED',
      feeBalanceKes: 18500,
      attendanceRatePct: 89,
      meanGradeLabel: 'Pending Term 1',
      phoneNumber: '+254714556677',
      gender: 'FEMALE',
      dob: '2005-02-19',
      guardianName: 'George Omondi',
      guardianPhone: '+254720998877',
      guardianEmail: 'gomondi@example.co.ke',
      guardianRelationship: 'Father',
    },
    {
      uid: 'acc-stu-003',
      email: 'kkipchoge@student.hitech.ac.ke',
      registrationNumber: 'HCA/STU/2026/0003',
      fullName: 'Kelvin Kipchoge Ruto',
      campusId: 'cmp-mombasa',
      campusName: 'Mombasa Coastal Campus',
      departmentId: 'dept-registry',
      departmentName: 'Academic Registry & Student Records',
      programmeId: 'prog-dict-l6',
      programmeName: 'Certificate in Information Communication Technology',
      intakeName: 'January 2026 Intake',
      status: 'DEFERRED',
      feeBalanceKes: 4200,
      attendanceRatePct: 78,
      meanGradeLabel: 'Credit (68%)',
      phoneNumber: '+254718223399',
      gender: 'MALE',
      dob: '2003-11-04',
      guardianName: 'Esther Ruto',
      guardianPhone: '+254723112200',
      guardianEmail: 'eruto@example.co.ke',
      guardianRelationship: 'Mother',
    },
  ];

  for (const stu of seededStudents) {
    await db
      .insert(users)
      .values({
        uid: stu.uid,
        email: stu.email,
        registrationNumber: stu.registrationNumber,
        fullName: stu.fullName,
        primaryRole: 'STUDENT',
        accountStatus: 'ACTIVE',
        passwordHash: DEFAULT_SEEDED_HASH,
        mustChangePassword: false,
        requiresProfileCompletion: false,
        mfaEnabled: false,
        campusId: stu.campusId,
        departmentId: stu.departmentId,
      })
      .onConflictDoNothing();

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.email, stu.email))
      .limit(1);

    if (userRow) {
      const profileId = `sis-${stu.uid}`;
      await db
        .insert(studentProfiles)
        .values({
          id: profileId,
          userId: userRow.id,
          admissionId: `adm-${stu.uid}`,
          registrationNumber: stu.registrationNumber,
          fullName: stu.fullName,
          email: stu.email,
          dateOfBirth: new Date(stu.dob),
          gender: stu.gender,
          nationality: 'Kenyan',
          phoneNumber: stu.phoneNumber,
          address: `${stu.campusName}, Kenya`,
          campusId: stu.campusId,
          campusName: stu.campusName,
          departmentId: stu.departmentId,
          departmentName: stu.departmentName,
          programmeId: stu.programmeId,
          programmeName: stu.programmeName,
          intakeName: stu.intakeName,
          studyMode: 'FULL_TIME',
          feeCategory: 'SELF_SPONSORED',
          feeBalanceKes: stu.feeBalanceKes,
          attendanceRatePct: stu.attendanceRatePct,
          meanGradeLabel: stu.meanGradeLabel,
          admissionDate: new Date('2026-01-12T08:00:00Z'),
          status: stu.status,
          profileCompleted: true,
        })
        .onConflictDoNothing();

      await db
        .insert(studentGuardians)
        .values({
          id: `grd-${stu.uid}`,
          studentId: profileId,
          fullName: stu.guardianName,
          relationship: stu.guardianRelationship,
          phoneNumber: stu.guardianPhone,
          email: stu.guardianEmail,
          isPrimary: true,
          portalAccess: true,
          consentRecordedAt: new Date('2026-01-12T08:00:00Z'),
        })
        .onConflictDoNothing();

      await db
        .insert(studentEmergencyContacts)
        .values({
          id: `emc-${stu.uid}`,
          studentId: profileId,
          fullName: stu.guardianName,
          relationship: stu.guardianRelationship,
          phoneNumber: stu.guardianPhone,
        })
        .onConflictDoNothing();

      await db
        .insert(studentStatusHistory)
        .values({
          id: `sth-${stu.uid}-init`,
          studentId: profileId,
          previousStatus: 'ADMITTED',
          newStatus: stu.status,
          reason: 'Initial academic enrolment verified by Academic Registry.',
          changedById: 'usr-reg-001',
          changedByName: 'H. Oduor',
          effectiveAt: new Date('2026-01-14T10:00:00Z'),
        })
        .onConflictDoNothing();
    }
  }

  // 3. Seed Registration Number Sequences
  await db
    .insert(registrationNumberSequences)
    .values([
      { category: 'STU', academicYear: 2026, lastSequence: 4 },
      { category: 'STAFF', academicYear: 2026, lastSequence: 22 },
      { category: 'PAR', academicYear: 2026, lastSequence: 2 },
      { category: 'ALU', academicYear: 2026, lastSequence: 1 },
    ])
    .onConflictDoNothing();

  // 4. Sync activated registrations from JSON store
  for (const reg of store.registrations) {
    if (reg.status === 'ACTIVATED' && reg.passwordHash) {
      await db
        .insert(users)
        .values({
          uid: reg.userAccountId ?? reg.id,
          email: reg.email.toLowerCase(),
          registrationNumber: reg.registrationNumber,
          fullName: reg.fullName,
          primaryRole: reg.assignedRole ?? reg.proposedRole,
          accountStatus: reg.portalAccessStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          passwordHash: reg.passwordHash,
          mustChangePassword: Boolean(reg.mustChangePasswordOnFirstLogin),
          requiresProfileCompletion: Boolean(reg.mustCompleteProfileOnFirstLogin),
          campusId: reg.campusId,
          departmentId: reg.departmentId,
        })
        .onConflictDoNothing();
    }
  }

  // 5. Seed Notification Templates & Initial Notifications
  const [{ value: tplCount }] = await db.select({ value: count() }).from(notificationTemplates);
  if (Number(tplCount) === 0) {
    await db
      .insert(notificationTemplates)
      .values([
        {
          id: 'ntpl-sec-login',
          code: 'SECURITY_LOGIN_ALERT',
          category: 'SECURITY',
          titleTemplate: 'New portal sign-in detected',
          bodyTemplate: 'A sign-in to your HI-TECH College account occurred from {{device}}.',
          channels: ['IN_APP', 'EMAIL'],
          mandatory: true,
        },
        {
          id: 'ntpl-acad-reg',
          code: 'ACADEMIC_REGISTRATION_APPROVED',
          category: 'ACADEMIC',
          titleTemplate: 'Academic registration confirmed',
          bodyTemplate: 'Your unit registration for {{term}} has been verified by the Registrar.',
          channels: ['IN_APP', 'EMAIL'],
          mandatory: false,
        },
        {
          id: 'ntpl-doc-sign',
          code: 'DOCUMENT_SIGNATURE_REQUIRED',
          category: 'DOCUMENT',
          titleTemplate: 'Document awaiting your digital signature',
          bodyTemplate: '{{documentTitle}} requires your institutional sign-off.',
          channels: ['IN_APP', 'EMAIL', 'PUSH'],
          mandatory: false,
        },
        {
          id: 'ntpl-fin-clear',
          code: 'FINANCE_FEE_CLEARANCE',
          category: 'FINANCE',
          titleTemplate: 'Fee receipt & clearance posted',
          bodyTemplate: 'Your M-Pesa/Bank tuition receipt {{receiptNo}} has been reconciled.',
          channels: ['IN_APP', 'EMAIL', 'SMS'],
          mandatory: false,
        },
      ])
      .onConflictDoNothing();
  }

  const [{ value: notifCount }] = await db.select({ value: count() }).from(notifications);
  if (Number(notifCount) === 0) {
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@hitech.ac.ke'))
      .limit(1);
    const [principalUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'principal@hitech.ac.ke'))
      .limit(1);
    const [registrarUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'registrar@hitech.ac.ke'))
      .limit(1);

    const initialNotifs: Array<typeof notifications.$inferInsert> = [];
    if (adminUser) {
      initialNotifs.push(
        {
          id: 'notif-seed-admin-1',
          recipientUserId: adminUser.id,
          category: 'SECURITY',
          priority: 'HIGH',
          title: 'Privileged MFA Policy Active',
          message:
            'Multi-Factor Authentication (TOTP + backup recovery codes) is available in Account Security for Administrator, Principal, Registrar, and Finance roles.',
          actionUrl: '/staff/security',
          senderName: 'Information Security Office',
        },
        {
          id: 'notif-seed-admin-2',
          recipientUserId: adminUser.id,
          category: 'DOCUMENT',
          priority: 'NORMAL',
          title: 'Signing Authority Certificate Active',
          message:
            'HI-TECH College Institutional Root CA certificate CA-2026-001 is active for digital document signing.',
          actionUrl: '/staff/signatures',
          senderName: 'Institutional Document Governance',
        }
      );
      await db
        .insert(notificationPreferences)
        .values([
          { userId: adminUser.id, category: 'SECURITY', inAppEnabled: true, emailEnabled: true, smsEnabled: false, pushEnabled: true },
          { userId: adminUser.id, category: 'ACADEMIC', inAppEnabled: true, emailEnabled: true, smsEnabled: false, pushEnabled: true },
          { userId: adminUser.id, category: 'DOCUMENT', inAppEnabled: true, emailEnabled: true, smsEnabled: false, pushEnabled: true },
          { userId: adminUser.id, category: 'FINANCE', inAppEnabled: true, emailEnabled: true, smsEnabled: false, pushEnabled: false },
        ])
        .onConflictDoNothing();
    }
    if (principalUser) {
      initialNotifs.push({
        id: 'notif-seed-prn-1',
        recipientUserId: principalUser.id,
        category: 'DOCUMENT',
        priority: 'HIGH',
        title: 'Digital Signature Request Pending Review',
        message: 'Academic Board Charter 2026 Addendum is awaiting institutional approval signature.',
        actionUrl: '/staff/signatures',
        senderName: 'Academic Registry',
      });
    }
    if (registrarUser) {
      initialNotifs.push({
        id: 'notif-seed-reg-1',
        recipientUserId: registrarUser.id,
        category: 'ACADEMIC',
        priority: 'NORMAL',
        title: 'SIS Student Records Synchronized',
        message: '4 student master profiles and enrolment checklists are ready in Student Information System.',
        actionUrl: '/staff/sis',
        senderName: 'Student Information System',
      });
    }
    if (initialNotifs.length > 0) {
      await db.insert(notifications).values(initialNotifs).onConflictDoNothing();
    }
  }

  // 6. Seed Signing Authorities, Root Certificate & Initial Signature Request
  const [{ value: certCount }] = await db.select({ value: count() }).from(signingCertificates);
  if (Number(certCount) === 0) {
    const fingerprint = crypto
      .createHash('sha256')
      .update('HI-TECH-COLLEGE-ROOT-CA-2026')
      .digest('hex')
      .toUpperCase();
    await db
      .insert(signingCertificates)
      .values({
        id: 'cert-hca-2026-001',
        serialNumber: 'HCA-CA-2026-0001',
        subjectName: 'HI-TECH College Institutional Signatory Authority',
        issuerName: 'HI-TECH College Institutional Root CA',
        fingerprintSha256: fingerprint,
        status: 'ACTIVE',
        expiresAt: new Date('2028-12-31T23:59:59Z'),
      })
      .onConflictDoNothing();
  }

  const [{ value: authCount }] = await db.select({ value: count() }).from(signingAuthorities);
  if (Number(authCount) === 0) {
    await db
      .insert(signingAuthorities)
      .values([
        {
          id: 'sauth-principal',
          staffId: 'usr-principal-001',
          fullName: 'Dr. Samuel Karanja',
          roleTitle: 'College Principal',
          departmentName: 'Office of the Principal',
          authorizedCategories: ['INSTITUTIONAL_POLICY', 'EMPLOYMENT_CONTRACT', 'TRANSCRIPT_CERTIFICATE', 'OFFICIAL_MEMO'],
          maxApprovalLevel: 'EXECUTIVE',
          active: true,
        },
        {
          id: 'sauth-registrar',
          staffId: 'usr-reg-001',
          fullName: 'H. Oduor',
          roleTitle: 'Chief Academic Registrar',
          departmentName: 'Academic Registry & Student Records',
          authorizedCategories: ['ADMISSION_LETTER', 'TRANSCRIPT_CERTIFICATE', 'OFFICIAL_MEMO'],
          maxApprovalLevel: 'INSTITUTIONAL',
          active: true,
        },
        {
          id: 'sauth-finance',
          staffId: 'usr-fin-001',
          fullName: 'D. Kiprop',
          roleTitle: 'Senior Finance Officer',
          departmentName: 'Finance & Accounts',
          authorizedCategories: ['FEE_STATEMENT', 'OFFICIAL_MEMO'],
          maxApprovalLevel: 'FINANCIAL',
          active: true,
        },
        {
          id: 'sauth-hr',
          staffId: 'usr-hr-primary',
          fullName: 'Beatrice Wanjiku Mwangi',
          roleTitle: 'Human Resources Officer',
          departmentName: 'Human Resources & Administration',
          authorizedCategories: ['EMPLOYMENT_CONTRACT', 'OFFICIAL_MEMO'],
          maxApprovalLevel: 'DEPARTMENTAL',
          active: true,
        },
      ])
      .onConflictDoNothing();
  }

  const [{ value: sigReqCount }] = await db.select({ value: count() }).from(signatureRequests);
  if (Number(sigReqCount) === 0) {
    const reqId = 'sreq-seed-001';
    const checksum = crypto
      .createHash('sha256')
      .update('doc-seed-003:v1:computing-exam-schedule')
      .digest('hex');

    await db
      .insert(signatureRequests)
      .values({
        id: reqId,
        documentId: 'doc-seed-003',
        documentTitle: 'Trimester 2 Computing Lab Examination Schedule Draft',
        documentReference: 'HCA/EXM/2026/DRAFT-03',
        versionNumber: 1,
        versionChecksumSha256: checksum,
        signingMode: 'SEQUENTIAL',
        status: 'PENDING',
        verificationCode: 'HCA-SIG-9A41C7E2',
        requestedById: 'usr-lecturer-kamau',
        requestedByName: 'Eng. Peter Kamau Njoroge',
        notes: 'Sequential sign-off required by Chief Academic Registrar and College Principal prior to student publication.',
      })
      .onConflictDoNothing();

    await db
      .insert(documentSigners)
      .values([
        {
          id: 'dsgn-seed-1',
          requestId: reqId,
          stepOrder: 1,
          signerStaffId: 'usr-reg-001',
          signerName: 'H. Oduor',
          signerRole: 'REGISTRAR',
          signerTitle: 'Chief Academic Registrar',
          status: 'PENDING',
        },
        {
          id: 'dsgn-seed-2',
          requestId: reqId,
          stepOrder: 2,
          signerStaffId: 'usr-principal-001',
          signerName: 'Dr. Samuel Karanja',
          signerRole: 'PRINCIPAL',
          signerTitle: 'College Principal',
          status: 'PENDING',
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(signatureAuditEvents)
      .values({
        id: 'saud-seed-1',
        requestId: reqId,
        actorId: 'usr-lecturer-kamau',
        actorName: 'Eng. Peter Kamau Njoroge',
        eventType: 'REQUEST_CREATED',
        detail: `Initiated sequential signing chain pinned to SHA-256 ${checksum.slice(0, 12)}...`,
      })
      .onConflictDoNothing();
  }

  // 7. Seed Institutional Academic Structure (Campuses, Departments, Programmes, Periods, Academic Registrations)
  const [{ value: campusCount }] = await db.select({ value: count() }).from(campuses);
  if (Number(campusCount) === 0) {
    await db
      .insert(campuses)
      .values([
        {
          id: 'cmp-nairobi',
          code: 'NBO',
          name: 'Nairobi Main Campus',
          address: 'Tom Mboya Street, Hi-Tech Plaza, Nairobi CBD',
          phone: '+254 720 100 200',
          email: 'nairobi@hitech.ac.ke',
          isMain: true,
          active: true,
        },
        {
          id: 'cmp-westlands',
          code: 'WST',
          name: 'Westlands Technology Park Campus',
          address: 'Waiyaki Way Innovation Centre, Westlands, Nairobi',
          phone: '+254 720 100 201',
          email: 'westlands@hitech.ac.ke',
          isMain: false,
          active: true,
        },
        {
          id: 'cmp-mombasa',
          code: 'MBA',
          name: 'Mombasa Coastal Campus',
          address: 'Moi Avenue Meridian Complex, Mombasa',
          phone: '+254 720 100 202',
          email: 'mombasa@hitech.ac.ke',
          isMain: false,
          active: true,
        },
      ])
      .onConflictDoNothing();
  }

  const [{ value: deptCount }] = await db.select({ value: count() }).from(departments);
  if (Number(deptCount) === 0) {
    await db
      .insert(departments)
      .values([
        {
          id: 'dept-computing',
          code: 'SCI',
          name: 'School of Computing & Informatics',
          facultyName: 'Faculty of Applied Computing & AI',
          campusId: 'cmp-nairobi',
          hodName: 'Eng. Peter Kamau Njoroge',
          active: true,
        },
        {
          id: 'dept-engineering',
          code: 'ENG',
          name: 'School of Electrical & Robotics Engineering',
          facultyName: 'Faculty of Applied Technology',
          campusId: 'cmp-westlands',
          hodName: 'Eng. Mercy Wambui',
          active: true,
        },
        {
          id: 'dept-business',
          code: 'BUS',
          name: 'School of Business & Accounting',
          facultyName: 'Faculty of Management Sciences',
          campusId: 'cmp-nairobi',
          hodName: 'CPA John Mutiso',
          active: true,
        },
        {
          id: 'dept-registry',
          code: 'REG',
          name: 'Academic Registry & Student Records',
          facultyName: 'Central Academic Administration',
          campusId: 'cmp-mombasa',
          hodName: 'H. Oduor',
          active: true,
        },
      ])
      .onConflictDoNothing();
  }

  const [{ value: progCount }] = await db.select({ value: count() }).from(programmes);
  if (Number(progCount) === 0) {
    await db
      .insert(programmes)
      .values([
        {
          id: 'prog-dict-l6',
          code: 'DICT-L6',
          title: 'Diploma in Information Communication Technology (Level 6)',
          level: 'DIPLOMA',
          examBody: 'CDACC',
          departmentId: 'dept-computing',
          durationSemesters: 6,
          tuitionPerSemesterKes: 28500,
          tvetaApproved: true,
          active: true,
        },
        {
          id: 'prog-dse-l6',
          code: 'DSE-L6',
          title: 'Diploma in Software Engineering & Cloud Systems',
          level: 'DIPLOMA',
          examBody: 'CDACC',
          departmentId: 'dept-computing',
          durationSemesters: 6,
          tuitionPerSemesterKes: 32000,
          tvetaApproved: true,
          active: true,
        },
        {
          id: 'prog-cict-l5',
          code: 'CICT-L5',
          title: 'Certificate in Information Communication Technology (Level 5)',
          level: 'CERTIFICATE',
          examBody: 'KNEC',
          departmentId: 'dept-computing',
          durationSemesters: 4,
          tuitionPerSemesterKes: 22500,
          tvetaApproved: true,
          active: true,
        },
        {
          id: 'prog-dbm-l6',
          code: 'DBM-L6',
          title: 'Diploma in Business Management & Entrepreneurship',
          level: 'DIPLOMA',
          examBody: 'KNEC',
          departmentId: 'dept-business',
          durationSemesters: 6,
          tuitionPerSemesterKes: 25000,
          tvetaApproved: true,
          active: true,
        },
        {
          id: 'prog-cpa',
          code: 'CPA-SEC',
          title: 'Certified Public Accountants (CPA Sections 1–6)',
          level: 'PROFESSIONAL',
          examBody: 'KASNEB',
          departmentId: 'dept-business',
          durationSemesters: 6,
          tuitionPerSemesterKes: 26500,
          tvetaApproved: true,
          active: true,
        },
      ])
      .onConflictDoNothing();
  }

  const [{ value: periodCount }] = await db.select({ value: count() }).from(academicPeriods);
  if (Number(periodCount) === 0) {
    await db
      .insert(academicPeriods)
      .values([
        {
          id: 'term-2026-jan',
          academicYear: '2026',
          semesterName: 'Trimester 1 (Jan–Apr 2026)',
          intakeCode: '2026-JAN',
          startDate: new Date('2026-01-12T00:00:00Z'),
          endDate: new Date('2026-04-24T23:59:59Z'),
          registrationOpen: false,
          isCurrent: false,
          status: 'CLOSED',
        },
        {
          id: 'term-2026-may',
          academicYear: '2026',
          semesterName: 'Trimester 2 (May–Aug 2026)',
          intakeCode: '2026-MAY',
          startDate: new Date('2026-05-04T00:00:00Z'),
          endDate: new Date('2026-08-21T23:59:59Z'),
          registrationOpen: true,
          isCurrent: true,
          status: 'ACTIVE',
        },
        {
          id: 'term-2026-sep',
          academicYear: '2026',
          semesterName: 'Trimester 3 (Sep–Dec 2026)',
          intakeCode: '2026-SEP',
          startDate: new Date('2026-09-07T00:00:00Z'),
          endDate: new Date('2026-12-18T23:59:59Z'),
          registrationOpen: true,
          isCurrent: false,
          status: 'UPCOMING',
        },
      ])
      .onConflictDoNothing();
  }

  const [{ value: acadRegCount }] = await db.select({ value: count() }).from(academicRegistrations);
  if (Number(acadRegCount) === 0) {
    await db
      .insert(academicRegistrations)
      .values([
        {
          id: 'areg-seed-001',
          studentProfileId: 'sis-acc-stu-001',
          academicPeriodId: 'term-2026-may',
          unitsJson: [
            { code: 'ICT-201', title: 'Database Systems & PostgreSQL Administration', credits: 4 },
            { code: 'ICT-204', title: 'Web Systems Engineering & REST APIs', credits: 4 },
            { code: 'ICT-207', title: 'Systems Analysis & Software Architecture', credits: 3 },
          ],
          totalCredits: 11,
          feeThresholdCleared: true,
          approvalStatus: 'APPROVED',
          approvedByName: 'H. Oduor',
        },
        {
          id: 'areg-seed-002',
          studentProfileId: 'sis-acc-stu-amina',
          academicPeriodId: 'term-2026-may',
          unitsJson: [
            { code: 'ICT-201', title: 'Database Systems & PostgreSQL Administration', credits: 4 },
            { code: 'ICT-204', title: 'Web Systems Engineering & REST APIs', credits: 4 },
            { code: 'ICT-209', title: 'Applied Cybersecurity & Network Defense', credits: 4 },
          ],
          totalCredits: 12,
          feeThresholdCleared: true,
          approvalStatus: 'APPROVED',
          approvedByName: 'H. Oduor',
        },
      ])
      .onConflictDoNothing();
  }

  // 8. Seed Central Feature Register (84 Modules) & Sprint 1 Baseline Checklist (10 Items)
  const [{ value: featCount }] = await db.select({ value: count() }).from(platformFeatures);
  if (Number(featCount) === 0) {
    await db
      .insert(platformFeatures)
      .values(
        MASTER_FEATURES_84.map((f) => ({
          featureId: f.featureId,
          moduleNumber: f.moduleNumber,
          systemCode: f.systemCode,
          systemName: f.systemName,
          moduleName: f.moduleName,
          description: f.description,
          priority: f.priority,
          status: f.status,
          backendStatus: f.backendStatus,
          databaseStatus: f.databaseStatus,
          frontendStatus: f.frontendStatus,
          testStatus: f.testStatus,
          dependencies: f.dependencies,
          assignedOwner: f.assignedOwner,
          acceptanceCriteria: f.acceptanceCriteria,
          releaseVersion: f.releaseVersion,
          portalPath: f.portalPath,
        }))
      )
      .onConflictDoNothing();
  } else {
    const feat16 = MASTER_FEATURES_84.find((f) => f.featureId === 'FEAT-016');
    if (feat16) {
      await db
        .update(platformFeatures)
        .set({
          status: feat16.status,
          backendStatus: feat16.backendStatus,
          databaseStatus: feat16.databaseStatus,
          frontendStatus: feat16.frontendStatus,
          testStatus: feat16.testStatus,
          updatedAt: new Date(),
        })
        .where(eq(platformFeatures.featureId, 'FEAT-016'));
    }
  }

  const [{ value: sprintCount }] = await db.select({ value: count() }).from(sprintBaselineTasks);
  if (Number(sprintCount) === 0) {
    await db
      .insert(sprintBaselineTasks)
      .values(
        SPRINT_1_BASELINE_TASKS.map((t) => ({
          id: t.id,
          sprintCode: t.sprintCode,
          orderIndex: t.orderIndex,
          title: t.title,
          category: t.category,
          completed: t.completed,
          evidenceSummary: t.evidenceSummary,
          verifiedBy: t.verifiedBy,
          completedAt: t.completed ? new Date() : null,
        }))
      )
      .onConflictDoNothing();
  }

  // 9. Hydrate or Seed Unified Portal Snapshot + Relational Finance & Secure Exam Tables
  const isTestEnv =
    process.env.NODE_ENV === 'test' ||
    process.execArgv.some((arg) => arg.includes('test')) ||
    process.argv.some((arg) => arg.includes('--test'));

  if (!isTestEnv) {
    const existingSnapshot = await db
      .select()
      .from(portalStateSnapshots)
      .where(eq(portalStateSnapshots.snapshotKey, 'primary'))
      .limit(1);

    if (existingSnapshot[0]?.payload) {
      hydrateDbFromSnapshot(existingSnapshot[0].payload as Partial<PortalDatabase>);
    } else {
      await syncPortalStoreToPostgres(getDb());
    }

    registerPostgresSyncHook(syncPortalStoreToPostgres);
  }
}

export async function syncPortalStoreToPostgres(storeData: PortalDatabase): Promise<void> {
  if (!isPostgresConfigured()) return;

  try {
    await db
      .insert(portalStateSnapshots)
      .values({
        snapshotKey: 'primary',
        payload: storeData as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: portalStateSnapshots.snapshotKey,
        set: {
          payload: storeData as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });

    for (const acc of storeData.financeStudentAccounts) {
      await db
        .insert(financeStudentAccounts)
        .values({
          studentId: acc.studentId,
          studentRegNo: acc.studentRegNo,
          studentName: acc.studentName,
          programme: acc.programme,
          academicYear: acc.academicYear,
          termLabel: acc.termLabel,
          totalFees: acc.totalFees,
          nextInstalmentAmount: acc.nextInstalmentAmount,
          nextInstalmentDueDate: acc.nextInstalmentDueDate,
          sponsorshipStatus: acc.sponsorshipStatus,
          updatedAt: acc.updatedAt,
        })
        .onConflictDoUpdate({
          target: financeStudentAccounts.studentId,
          set: {
            studentName: acc.studentName,
            programme: acc.programme,
            totalFees: acc.totalFees,
            nextInstalmentAmount: acc.nextInstalmentAmount,
            nextInstalmentDueDate: acc.nextInstalmentDueDate,
            sponsorshipStatus: acc.sponsorshipStatus,
            updatedAt: acc.updatedAt,
          },
        });
    }

    for (const chg of storeData.financeLedgerCharges) {
      await db
        .insert(financeLedgerCharges)
        .values(chg)
        .onConflictDoNothing();
    }

    for (const pay of storeData.financePayments) {
      await db
        .insert(financePayments)
        .values({
          id: pay.id,
          studentId: pay.studentId,
          studentRegNo: pay.studentRegNo,
          studentName: pay.studentName,
          method: pay.method,
          channelLabel: pay.channelLabel,
          referenceNumber: pay.referenceNumber,
          idempotencyKey: pay.idempotencyKey ?? null,
          phoneNumber: pay.phoneNumber ?? null,
          bankName: pay.bankName ?? null,
          amount: pay.amount,
          status: pay.status,
          description: pay.description,
          receiptId: pay.receiptId ?? null,
          receiptNumber: pay.receiptNumber ?? null,
          failureReason: pay.failureReason ?? null,
          verifiedById: pay.verifiedById ?? null,
          verifiedByName: pay.verifiedByName ?? null,
          createdAt: pay.createdAt,
          updatedAt: pay.updatedAt,
          paidAt: pay.paidAt ?? null,
        })
        .onConflictDoUpdate({
          target: financePayments.id,
          set: {
            referenceNumber: pay.referenceNumber,
            status: pay.status,
            receiptId: pay.receiptId ?? null,
            receiptNumber: pay.receiptNumber ?? null,
            failureReason: pay.failureReason ?? null,
            verifiedById: pay.verifiedById ?? null,
            verifiedByName: pay.verifiedByName ?? null,
            updatedAt: pay.updatedAt,
            paidAt: pay.paidAt ?? null,
          },
        });
    }

    for (const tx of storeData.mpesaTransactions) {
      await db
        .insert(mpesaTransactions)
        .values({
          id: tx.id,
          paymentId: tx.paymentId,
          studentId: tx.studentId,
          studentRegNo: tx.studentRegNo,
          phoneNumber: tx.phoneNumber,
          amount: tx.amount,
          accountReference: tx.accountReference,
          transactionDesc: tx.transactionDesc,
          merchantRequestId: tx.merchantRequestId,
          checkoutRequestId: tx.checkoutRequestId,
          mpesaReceiptNumber: tx.mpesaReceiptNumber ?? null,
          transactionDate: tx.transactionDate ?? null,
          resultCode: tx.resultCode ?? null,
          resultDesc: tx.resultDesc ?? null,
          status: tx.status,
          mode: tx.mode,
          callbackReceivedAt: tx.callbackReceivedAt ?? null,
          rawCallback: tx.rawCallback ?? null,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
        })
        .onConflictDoUpdate({
          target: mpesaTransactions.id,
          set: {
            mpesaReceiptNumber: tx.mpesaReceiptNumber ?? null,
            transactionDate: tx.transactionDate ?? null,
            resultCode: tx.resultCode ?? null,
            resultDesc: tx.resultDesc ?? null,
            status: tx.status,
            callbackReceivedAt: tx.callbackReceivedAt ?? null,
            rawCallback: tx.rawCallback ?? null,
            updatedAt: tx.updatedAt,
          },
        });
    }

    for (const rct of storeData.financeReceipts) {
      await db
        .insert(financeReceipts)
        .values(rct)
        .onConflictDoNothing();
    }

    for (const fs of storeData.financeFeeStructures) {
      await db
        .insert(financeFeeStructures)
        .values(fs)
        .onConflictDoNothing();
    }

    for (const plan of storeData.financePaymentPlans) {
      await db
        .insert(financePaymentPlans)
        .values({
          id: plan.id,
          studentId: plan.studentId,
          studentRegNo: plan.studentRegNo,
          studentName: plan.studentName,
          termLabel: plan.termLabel,
          totalCoveredAmount: plan.totalCoveredAmount,
          instalments: plan.instalments as unknown as Record<string, unknown>[],
          status: plan.status,
          requestedNotes: plan.requestedNotes ?? null,
          reviewerNotes: plan.reviewerNotes ?? null,
          reviewedByName: plan.reviewedByName ?? null,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        })
        .onConflictDoUpdate({
          target: financePaymentPlans.id,
          set: {
            instalments: plan.instalments as unknown as Record<string, unknown>[],
            status: plan.status,
            reviewerNotes: plan.reviewerNotes ?? null,
            reviewedByName: plan.reviewedByName ?? null,
            updatedAt: plan.updatedAt,
          },
        });
    }

    for (const clr of storeData.financeClearances) {
      await db
        .insert(financeClearances)
        .values(clr)
        .onConflictDoUpdate({
          target: financeClearances.id,
          set: {
            status: clr.status,
            requirementNote: clr.requirementNote,
            checkedAt: clr.checkedAt,
            checkedBy: clr.checkedBy,
          },
        });
    }

    for (const ref of storeData.financeRefundRequests) {
      await db
        .insert(financeRefundRequests)
        .values({
          id: ref.id,
          studentId: ref.studentId,
          studentRegNo: ref.studentRegNo,
          studentName: ref.studentName,
          amount: ref.amount,
          reason: ref.reason,
          payoutChannel: ref.payoutChannel,
          payoutAccount: ref.payoutAccount,
          supportingReference: ref.supportingReference ?? null,
          status: ref.status,
          reviewerNotes: ref.reviewerNotes ?? null,
          reviewedByName: ref.reviewedByName ?? null,
          reviewedAt: ref.reviewedAt ?? null,
          createdAt: ref.createdAt,
          updatedAt: ref.updatedAt,
        })
        .onConflictDoUpdate({
          target: financeRefundRequests.id,
          set: {
            status: ref.status,
            reviewerNotes: ref.reviewerNotes ?? null,
            reviewedByName: ref.reviewedByName ?? null,
            reviewedAt: ref.reviewedAt ?? null,
            updatedAt: ref.updatedAt,
          },
        });
    }

    for (const log of storeData.financeAuditLogs.slice(0, 100)) {
      await db
        .insert(financeAuditLogs)
        .values({
          id: log.id,
          actorId: log.actorId,
          actorName: log.actorName,
          actorRole: log.actorRole,
          studentRegNo: log.studentRegNo ?? null,
          action: log.action,
          detail: log.detail,
          createdAt: log.createdAt,
        })
        .onConflictDoNothing();
    }

    for (const exam of storeData.secureExamDefinitions) {
      await db
        .insert(secureExamDefinitions)
        .values({
          id: exam.id,
          code: exam.code,
          title: exam.title,
          subject: exam.subject,
          unitCode: exam.unitCode,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          isPublished: exam.isPublished,
          startsAt: exam.startsAt,
          endsAt: exam.endsAt,
          maxAttempts: exam.maxAttempts,
          instructions: exam.instructions,
          securityPolicy: exam.securityPolicy as unknown as Record<string, unknown>,
          questions: exam.questions as unknown as Record<string, unknown>[],
          updatedAt: exam.updatedAt,
        })
        .onConflictDoUpdate({
          target: secureExamDefinitions.id,
          set: {
            isPublished: exam.isPublished,
            securityPolicy: exam.securityPolicy as unknown as Record<string, unknown>,
            updatedAt: exam.updatedAt,
          },
        });
    }

    for (const ses of storeData.secureExamSessions) {
      await db
        .insert(secureExamSessions)
        .values({
          id: ses.id,
          examId: ses.examId,
          studentId: ses.studentId,
          studentRegNo: ses.studentRegNo,
          studentName: ses.studentName,
          attemptNumber: ses.attemptNumber,
          status: ses.status,
          startedAt: ses.startedAt,
          expiresAt: ses.expiresAt,
          submittedAt: ses.submittedAt ?? null,
          lastSavedAt: ses.lastSavedAt ?? null,
          lastHeartbeatAt: ses.lastHeartbeatAt ?? null,
          connectionLost: Boolean(ses.connectionLost),
          terminationReason: ses.terminationReason ?? null,
          terminatedBy: ses.terminatedBy ?? null,
          totalMarksAwarded: ses.totalMarksAwarded ?? null,
          timeAdjustments: (ses.timeAdjustments ?? []) as unknown as Record<string, unknown>[],
          answers: ses.answers as unknown as Record<string, unknown>[],
          createdAt: ses.createdAt,
          updatedAt: ses.updatedAt,
        })
        .onConflictDoUpdate({
          target: secureExamSessions.id,
          set: {
            status: ses.status,
            expiresAt: ses.expiresAt,
            submittedAt: ses.submittedAt ?? null,
            lastSavedAt: ses.lastSavedAt ?? null,
            lastHeartbeatAt: ses.lastHeartbeatAt ?? null,
            connectionLost: Boolean(ses.connectionLost),
            terminationReason: ses.terminationReason ?? null,
            terminatedBy: ses.terminatedBy ?? null,
            totalMarksAwarded: ses.totalMarksAwarded ?? null,
            timeAdjustments: (ses.timeAdjustments ?? []) as unknown as Record<string, unknown>[],
            answers: ses.answers as unknown as Record<string, unknown>[],
            updatedAt: ses.updatedAt,
          },
        });
    }

    for (const ev of storeData.secureExamEvents.slice(0, 200)) {
      await db
        .insert(secureExamSecurityEvents)
        .values({
          id: ev.id,
          sessionId: ev.sessionId,
          eventType: ev.eventType,
          occurredAt: ev.occurredAt,
          receivedAt: ev.receivedAt,
          details: ev.details ?? null,
          responseTriggered: ev.responseTriggered,
        })
        .onConflictDoNothing();
    }

    for (const inc of storeData.secureExamIncidents) {
      await db
        .insert(secureExamIncidents)
        .values({
          id: inc.id,
          sessionId: inc.sessionId,
          examId: inc.examId,
          examTitle: inc.examTitle,
          studentId: inc.studentId,
          studentRegNo: inc.studentRegNo,
          studentName: inc.studentName,
          status: inc.status,
          severity: inc.severity,
          summary: inc.summary,
          eventCount: inc.eventCount,
          reviewedById: inc.reviewedById ?? null,
          reviewedByName: inc.reviewedByName ?? null,
          reviewerNotes: inc.reviewerNotes ?? null,
          reviewedAt: inc.reviewedAt ?? null,
          createdAt: inc.createdAt,
          updatedAt: inc.updatedAt,
        })
        .onConflictDoUpdate({
          target: secureExamIncidents.id,
          set: {
            status: inc.status,
            severity: inc.severity,
            summary: inc.summary,
            eventCount: inc.eventCount,
            reviewedById: inc.reviewedById ?? null,
            reviewedByName: inc.reviewedByName ?? null,
            reviewerNotes: inc.reviewerNotes ?? null,
            reviewedAt: inc.reviewedAt ?? null,
            updatedAt: inc.updatedAt,
          },
        });
    }

    for (const msg of storeData.secureExamMessages.slice(0, 200)) {
      await db
        .insert(secureExamMessages)
        .values(msg)
        .onConflictDoUpdate({
          target: secureExamMessages.id,
          set: {
            readByStudent: msg.readByStudent,
            readBySupervisor: msg.readBySupervisor,
          },
        });
    }

    for (const log of storeData.secureExamAuditLogs.slice(0, 100)) {
      await db
        .insert(secureExamAuditLogs)
        .values({
          id: log.id,
          sessionId: log.sessionId ?? null,
          examId: log.examId ?? null,
          actorId: log.actorId,
          actorName: log.actorName,
          action: log.action,
          detail: log.detail,
          timestampIso: log.timestampIso,
        })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error('Database sync failed in syncPortalStoreToPostgres:', error);
    throw new Error('Database synchronization failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function ensurePostgresSeeded(): Promise<void> {
  if (!isPostgresConfigured()) return;
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      console.error('Deferred Postgres seed error:', err);
    });
  }
  await seedPromise;
}
