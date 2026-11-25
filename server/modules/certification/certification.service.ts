import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { getDb, saveDb } from '../../data/store.ts';
import type {
  CandidateAttendanceStatus,
  CandidateProgressionRecord,
  CertAcademicDepartment,
  CertAcademicYearTerm,
  CertClassCohort,
  CertLecturerAllocation,
  CertModule,
  CertModuleAssignment,
  CertProgramme,
  CertificationAuditLog,
  CertificationBodyCode,
  CertificationModuleState,
  CreditPackage,
  CreditReservation,
  CreditTransaction,
  DigitalCertificateRecord,
  ExamMarkingSubmission,
  ExamPaperBlueprint,
  ExaminationCreditWallet,
  InvigilatorSessionRecord,
  ModuleRequirementKind,
  ProgressionStage,
  QuestionBankEntry,
  QuestionBankType,
  QuestionReviewStatus,
} from './certification.types.ts';

export class CertificationHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface CertificationActor {
  id: string;
  name: string;
  role: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function getState(): CertificationModuleState {
  return getDb().certificationState;
}

function commitState(
  domain: CertificationAuditLog['domain'],
  actor: CertificationActor,
  action: string,
  detail: string
): void {
  const db = getDb();
  db.certificationState.auditLogs.unshift({
    id: nextId('caud'),
    domain,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    detail,
    createdAt: nowIso(),
  });
  if (db.certificationState.auditLogs.length > 300) {
    db.certificationState.auditLogs = db.certificationState.auditLogs.slice(0, 300);
  }
  saveDb(db);
}

function nextTxRef(state: CertificationModuleState): string {
  state.sequences.txSeq += 1;
  return `CR-${String(state.sequences.txSeq).padStart(4, '0')}`;
}

function stripQuestionAnswerKey(q: QuestionBankEntry) {
  return {
    id: q.id,
    code: q.code,
    examBody: q.examBody,
    programmeId: q.programmeId,
    programmeName: q.programmeName,
    moduleCode: q.moduleCode,
    moduleTitle: q.moduleTitle,
    topic: q.topic,
    questionType: q.questionType,
    difficulty: q.difficulty,
    marks: q.marks,
    prompt: q.prompt,
    options: q.options ? [...q.options] : undefined,
    status: q.status,
    version: q.version,
  };
}

function ensureWallet(
  state: CertificationModuleState,
  studentRegNo: string,
  studentName: string,
  programmeName = 'ICDL Certification'
): ExaminationCreditWallet {
  const normReg = studentRegNo.trim().toUpperCase();
  let wallet = state.wallets.find((w) => w.studentRegNo.toUpperCase() === normReg);
  if (!wallet) {
    wallet = {
      id: nextId('wlt'),
      studentRegNo: normReg,
      studentName: studentName.trim() || normReg,
      programmeName,
      availableCredits: 0,
      reservedCredits: 0,
      consumedCredits: 0,
      refundedCredits: 0,
      lowCreditThreshold: 5,
      status: 'ACTIVE',
      updatedAt: nowIso(),
    };
    state.wallets.unshift(wallet);
  }
  return wallet;
}

export const certificationService = {
  // ============================================================================
  // 1. ADMINISTRATOR ANALYTICS & 8-SECTION CANDIDATE MANAGEMENT
  // ============================================================================
  getAdminAnalytics() {
    const db = getDb();
    const state = db.certificationState;
    const activeSessions = state.invigilatorSessions.filter(
      (s) => s.status === 'IN_PROGRESS' || s.status === 'ATTENDANCE_IN_PROGRESS' || s.status === 'SCHEDULED'
    );
    const totalAvailableCredits = state.wallets.reduce((sum, w) => sum + w.availableCredits, 0);
    const totalReservedCredits = state.wallets.reduce((sum, w) => sum + w.reservedCredits, 0);
    const totalConsumedCredits = state.wallets.reduce((sum, w) => sum + w.consumedCredits, 0);
    const lowCreditWallets = state.wallets.filter((w) => w.availableCredits <= w.lowCreditThreshold);
    const pendingAdjustments = state.creditTransactions.filter(
      (tx) => tx.approvalStatus === 'PENDING_APPROVAL'
    );
    const pendingAiReviews = state.markingSubmissions.filter(
      (m) => m.moderationStatus === 'AI_DRAFT_PENDING_HUMAN_REVIEW'
    );
    const uniqueCandidates = new Set<string>([
      ...state.wallets.map((w) => w.studentRegNo.toUpperCase()),
      ...state.progressions.map((p) => p.studentRegNo.toUpperCase()),
    ]);

    return {
      totalCandidates: uniqueCandidates.size,
      activeProgrammes: state.programmes.filter((p) => p.status === 'ACTIVE').length,
      totalModules: state.modules.length,
      activeClasses: state.classes.filter((c) => c.status === 'ACTIVE').length,
      activeExamSessions: activeSessions.length,
      certificatesAwarded: state.certificates.filter((c) => c.status === 'ISSUED').length,
      creditSummary: {
        totalAvailableCredits,
        totalReservedCredits,
        totalConsumedCredits,
        lowCreditAlertCount: lowCreditWallets.length,
        pendingApprovalCount: pendingAdjustments.length,
      },
      questionBankSummary: {
        total: state.questionBank.length,
        approved: state.questionBank.filter((q) => q.status === 'APPROVED').length,
        underReview: state.questionBank.filter((q) => q.status === 'UNDER_REVIEW').length,
        draft: state.questionBank.filter((q) => q.status === 'DRAFT').length,
      },
      pendingAiReviewCount: pendingAiReviews.length,
      recentAuditLogs: state.auditLogs.slice(0, 12),
    };
  },

  listCandidates() {
    const db = getDb();
    const state = db.certificationState;
    const regNos = Array.from(
      new Set<string>([
        ...state.wallets.map((w) => w.studentRegNo.toUpperCase()),
        ...state.progressions.map((p) => p.studentRegNo.toUpperCase()),
      ])
    );

    return regNos.map((regNo) => {
      const wallet = state.wallets.find((w) => w.studentRegNo.toUpperCase() === regNo);
      const prog = state.progressions.find((p) => p.studentRegNo.toUpperCase() === regNo);
      const sisMatch = db.registrations.find(
        (r) => (r.registrationNumber || '').toUpperCase() === regNo
      );
      const cls = state.classes.find((c) =>
        c.enrolledStudentRegNos.some((r) => r.toUpperCase() === regNo)
      );
      const assignedModules = state.moduleAssignments.filter(
        (m) => m.studentRegNo.toUpperCase() === regNo
      );
      const certs = state.certificates.filter(
        (c) => c.studentRegNo.toUpperCase() === regNo && c.status === 'ISSUED'
      );

      return {
        studentRegNo: regNo,
        fullName: prog?.studentName || wallet?.studentName || sisMatch?.fullName || regNo,
        email: sisMatch?.email || `${regNo.toLowerCase().replace(/[^a-z0-9]/g, '.')}@students.hitech.ac.ke`,
        programmeId: prog?.programmeId || cls?.programmeId || 'prog-icdl-001',
        programmeName: prog?.programmeName || wallet?.programmeName || 'ICDL Certification',
        examBody: prog?.examBody || 'ICDL',
        className: cls?.name || 'ICDL NOV 2026 A',
        emailVerified: true,
        mustChangePassword: false,
        accountStatus: sisMatch?.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
        availableCredits: wallet?.availableCredits ?? 0,
        reservedCredits: wallet?.reservedCredits ?? 0,
        assignedModulesCount: assignedModules.length,
        progressionStage: prog?.stage || 'REGISTERED',
        progressPercent: prog?.progressPercent ?? 0,
        eligibleForCertification: prog?.eligibleForCertification ?? false,
        certificatesCount: certs.length,
      };
    });
  },

  getCandidateDetail(studentRegNo: string) {
    const db = getDb();
    const state = db.certificationState;
    const normReg = studentRegNo.trim().toUpperCase();
    const listEntry = this.listCandidates().find((c) => c.studentRegNo === normReg);
    if (!listEntry) {
      throw new CertificationHttpError(404, `Candidate ${studentRegNo} was not found.`);
    }

    const sisMatch = db.registrations.find(
      (r) => (r.registrationNumber || '').toUpperCase() === normReg
    );
    const enrolledClasses = state.classes.filter((c) =>
      c.enrolledStudentRegNos.some((r) => r.toUpperCase() === normReg)
    );
    const assignedModules = state.moduleAssignments.filter(
      (m) => m.studentRegNo.toUpperCase() === normReg
    );
    const wallet = state.wallets.find((w) => w.studentRegNo.toUpperCase() === normReg) || null;
    const transactions = state.creditTransactions.filter(
      (tx) => tx.studentRegNo.toUpperCase() === normReg
    );
    const progression =
      state.progressions.find((p) => p.studentRegNo.toUpperCase() === normReg) || null;
    const examSessions = state.invigilatorSessions
      .filter((s) => s.candidates.some((c) => c.studentRegNo.toUpperCase() === normReg))
      .map((s) => ({
        sessionId: s.id,
        sessionRef: s.sessionRef,
        examTitle: s.examTitle,
        moduleCode: s.moduleCode,
        scheduledDate: s.scheduledDate,
        startTime: s.startTime,
        room: s.room,
        sessionStatus: s.status,
        candidateRow: s.candidates.find((c) => c.studentRegNo.toUpperCase() === normReg) || null,
      }));
    const results = state.markingSubmissions.filter(
      (m) => m.studentRegNo.toUpperCase() === normReg
    );
    const certificates = state.certificates.filter(
      (c) => c.studentRegNo.toUpperCase() === normReg
    );

    return {
      profile: {
        ...listEntry,
        phone: sisMatch?.phone || '+254 712 345 678',
        campusName: sisMatch?.campusName || enrolledClasses[0]?.campusName || 'Nairobi Main Campus',
      },
      enrolledClasses,
      assignedModules,
      progression,
      wallet,
      transactions,
      examSessions,
      results,
      certificates,
    };
  },

  enrollOrImportCandidates(
    payload: {
      candidates: Array<{
        studentRegNo: string;
        fullName: string;
        programmeId: string;
        classId?: string;
        initialCredits?: number;
      }>;
    },
    actor: CertificationActor
  ) {
    const state = getState();
    const items = Array.isArray(payload.candidates) ? payload.candidates : [];
    if (items.length === 0) {
      throw new CertificationHttpError(400, 'At least one candidate record is required.');
    }

    const imported: Array<{ studentRegNo: string; fullName: string; assignedModules: number }> = [];
    for (const item of items) {
      const regNo = String(item.studentRegNo || '').trim().toUpperCase();
      const fullName = String(item.fullName || '').trim();
      if (!regNo || !fullName) {
        throw new CertificationHttpError(400, 'Each candidate requires studentRegNo and fullName.');
      }
      const prog =
        state.programmes.find((p) => p.id === item.programmeId) || state.programmes[0];
      const cls =
        state.classes.find((c) => c.id === item.classId) ||
        state.classes.find((c) => c.programmeId === prog.id) ||
        state.classes[0];

      if (cls && !cls.enrolledStudentRegNos.some((r) => r.toUpperCase() === regNo)) {
        cls.enrolledStudentRegNos.push(regNo);
      }

      const wallet = ensureWallet(state, regNo, fullName, prog.name);
      const initialCredits = Math.max(0, Math.floor(Number(item.initialCredits || 0)));
      if (initialCredits > 0) {
        const before = wallet.availableCredits;
        wallet.availableCredits += initialCredits;
        wallet.updatedAt = nowIso();
        state.creditTransactions.unshift({
          id: nextId('ctx'),
          txRef: nextTxRef(state),
          walletId: wallet.id,
          studentRegNo: regNo,
          studentName: fullName,
          type: 'ALLOCATION',
          creditsDelta: initialCredits,
          balanceBefore: before,
          balanceAfter: wallet.availableCredits,
          referenceLabel: 'Candidate Import Allocation',
          reason: `Initial credit grant on candidate import (${prog.code})`,
          actorId: actor.id,
          actorName: actor.name,
          approvalStatus: 'COMPLETED',
          approvedByName: actor.name,
          approvedAt: nowIso(),
          createdAt: nowIso(),
        });
      }

      const programmeModules = state.modules.filter((m) => m.programmeId === prog.id);
      let assignedCount = 0;
      for (const mod of programmeModules) {
        const exists = state.moduleAssignments.some(
          (a) => a.studentRegNo.toUpperCase() === regNo && a.moduleId === mod.id
        );
        if (!exists) {
          state.moduleAssignments.push({
            id: nextId('mas'),
            studentRegNo: regNo,
            studentName: fullName,
            programmeId: prog.id,
            programmeName: prog.name,
            classId: cls?.id || '',
            className: cls?.name || 'Cohort A',
            moduleId: mod.id,
            moduleCode: mod.code,
            moduleTitle: mod.title,
            requirementKind: mod.requirementKind,
            progressPercent: 0,
            status: 'NOT_STARTED',
            examEligible: mod.prerequisiteModuleIds.length === 0,
            assignedByName: actor.name,
            assignedAt: nowIso(),
          });
          assignedCount += 1;
        }
      }

      this.recomputeProgressionInternal(state, regNo, fullName, prog);
      imported.push({ studentRegNo: regNo, fullName, assignedModules: assignedCount });
    }

    commitState(
      'ACADEMIC',
      actor,
      'CANDIDATES_IMPORTED',
      `Registered/imported ${imported.length} candidate(s) into certification programme cohorts.`
    );

    return { importedCount: imported.length, imported };
  },

  // ============================================================================
  // 2. ACADEMIC STRUCTURE (DEPARTMENTS, PROGRAMMES, PERIODS, MODULES, CLASSES)
  // ============================================================================
  getAcademicCatalog() {
    const state = getState();
    return {
      departments: state.departments,
      programmes: state.programmes,
      academicPeriods: state.academicPeriods,
      modules: state.modules,
      classes: state.classes,
      moduleAssignments: state.moduleAssignments,
      lecturerAllocations: state.lecturerAllocations,
    };
  },

  createDepartment(
    input: { code: string; name: string; hodName: string; campusName?: string },
    actor: CertificationActor
  ): CertAcademicDepartment {
    const state = getState();
    const code = String(input.code || '').trim().toUpperCase();
    const name = String(input.name || '').trim();
    if (!code || !name) {
      throw new CertificationHttpError(400, 'Department code and name are required.');
    }
    if (state.departments.some((d) => d.code.toUpperCase() === code)) {
      throw new CertificationHttpError(409, `Department code ${code} already exists.`);
    }
    const dept: CertAcademicDepartment = {
      id: nextId('cdept'),
      code,
      name,
      hodName: String(input.hodName || 'Pending HOD').trim(),
      hodStaffId: actor.id,
      status: 'ACTIVE',
      campusName: String(input.campusName || 'Nairobi Main Campus').trim(),
      lecturerCount: 0,
      programmeCount: 0,
    };
    state.departments.push(dept);
    commitState('ACADEMIC', actor, 'DEPARTMENT_CREATED', `Created department ${code} — ${name}`);
    return dept;
  },

  createProgramme(
    input: {
      code: string;
      name: string;
      departmentId: string;
      qualificationLevel?: CertProgramme['qualificationLevel'];
      durationLabel?: string;
      examBody: CertificationBodyCode;
      certificationTitle?: string;
      requiredModulesCount?: number;
    },
    actor: CertificationActor
  ): CertProgramme {
    const state = getState();
    const code = String(input.code || '').trim().toUpperCase();
    const name = String(input.name || '').trim();
    const dept = state.departments.find((d) => d.id === input.departmentId);
    if (!code || !name || !dept) {
      throw new CertificationHttpError(400, 'Valid code, name, and department are required.');
    }
    if (state.programmes.some((p) => p.code.toUpperCase() === code)) {
      throw new CertificationHttpError(409, `Programme code ${code} already exists.`);
    }
    const prog: CertProgramme = {
      id: nextId('prog'),
      code,
      name,
      departmentId: dept.id,
      departmentName: dept.name,
      qualificationLevel: input.qualificationLevel || 'Certificate',
      durationLabel: input.durationLabel || '6 Months',
      examBody: input.examBody || 'ICDL',
      certificationTitle: input.certificationTitle || `${name} Certificate`,
      requiredModulesCount: Math.max(1, Number(input.requiredModulesCount || 4)),
      status: 'ACTIVE',
    };
    state.programmes.push(prog);
    dept.programmeCount += 1;
    commitState('ACADEMIC', actor, 'PROGRAMME_CREATED', `Created programme ${code} (${prog.examBody})`);
    return prog;
  },

  createAcademicPeriod(
    input: Omit<CertAcademicYearTerm, 'id'>,
    actor: CertificationActor
  ): CertAcademicYearTerm {
    const state = getState();
    if (!input.academicYear || !input.termName) {
      throw new CertificationHttpError(400, 'Academic year and term name are required.');
    }
    const period: CertAcademicYearTerm = {
      id: nextId('term'),
      ...input,
    };
    state.academicPeriods.unshift(period);
    commitState(
      'ACADEMIC',
      actor,
      'ACADEMIC_PERIOD_CREATED',
      `Opened academic period ${period.academicYear} — ${period.termName}`
    );
    return period;
  },

  createModule(
    input: {
      code: string;
      title: string;
      programmeId: string;
      assessmentMode?: CertModule['assessmentMode'];
      trainingHours?: number;
      passMarkPercent?: number;
      creditCost?: number;
      requirementKind?: ModuleRequirementKind;
      prerequisiteModuleIds?: string[];
      lecturerName?: string;
    },
    actor: CertificationActor
  ): CertModule {
    const state = getState();
    const prog = state.programmes.find((p) => p.id === input.programmeId);
    const code = String(input.code || '').trim().toUpperCase();
    const title = String(input.title || '').trim();
    if (!prog || !code || !title) {
      throw new CertificationHttpError(400, 'Valid programme, module code, and title are required.');
    }
    const mod: CertModule = {
      id: nextId('mod'),
      code,
      title,
      programmeId: prog.id,
      programmeName: prog.name,
      examBody: prog.examBody,
      assessmentMode: input.assessmentMode || 'Theory & Practical',
      trainingHours: Math.max(4, Number(input.trainingHours || 24)),
      passMarkPercent: Math.min(95, Math.max(30, Number(input.passMarkPercent || 70))),
      creditCost: Math.max(1, Number(input.creditCost || 1)),
      requirementKind: input.requirementKind || 'MANDATORY',
      prerequisiteModuleIds: Array.isArray(input.prerequisiteModuleIds)
        ? input.prerequisiteModuleIds
        : [],
      learningOutcomes: [`Demonstrate applied mastery in ${title}`],
      studyMaterials: [{ title: `${code} Core Study Guide`, kind: 'Notes', duration: '45 min' }],
      lecturerId: 'usr-lect-001',
      lecturerName: input.lecturerName || 'Dr. Peter Otieno',
    };
    state.modules.push(mod);
    commitState('ACADEMIC', actor, 'MODULE_CREATED', `Added module ${code} to ${prog.name}`);
    return mod;
  },

  createClassCohort(
    input: {
      code: string;
      name: string;
      programmeId: string;
      academicYear?: string;
      termName?: string;
      campusName?: string;
      intakeName?: string;
      studyMode?: CertClassCohort['studyMode'];
      capacity?: number;
      leadLecturerName?: string;
    },
    actor: CertificationActor
  ): CertClassCohort {
    const state = getState();
    const prog = state.programmes.find((p) => p.id === input.programmeId);
    const code = String(input.code || '').trim().toUpperCase();
    const name = String(input.name || '').trim();
    if (!prog || !code || !name) {
      throw new CertificationHttpError(400, 'Programme, class code, and class name are required.');
    }
    const cls: CertClassCohort = {
      id: nextId('cls'),
      code,
      name,
      departmentId: prog.departmentId,
      departmentName: prog.departmentName,
      programmeId: prog.id,
      programmeName: prog.name,
      academicYear: input.academicYear || '2026',
      termName: input.termName || 'Term 3 (September – December 2026)',
      campusName: input.campusName || 'Nairobi Main Campus',
      intakeName: input.intakeName || 'November 2026',
      studyMode: input.studyMode || 'FULL_TIME',
      capacity: Math.max(5, Number(input.capacity || 40)),
      enrolledStudentRegNos: [],
      leadLecturerName: input.leadLecturerName || 'Dr. Peter Otieno',
      status: 'ACTIVE',
    };
    state.classes.unshift(cls);
    commitState('ACADEMIC', actor, 'CLASS_CREATED', `Created cohort ${name} (${code})`);
    return cls;
  },

  assignModulesToStudentOrClass(
    input: {
      targetType: 'STUDENT' | 'CLASS';
      studentRegNo?: string;
      classId?: string;
      moduleIds: string[];
    },
    actor: CertificationActor
  ) {
    const state = getState();
    const modules = state.modules.filter((m) => input.moduleIds.includes(m.id));
    if (modules.length === 0) {
      throw new CertificationHttpError(400, 'Select at least one valid module to assign.');
    }

    let regNos: string[] = [];
    let resolvedClass: CertClassCohort | undefined;
    if (input.targetType === 'CLASS') {
      resolvedClass = state.classes.find((c) => c.id === input.classId);
      if (!resolvedClass) {
        throw new CertificationHttpError(404, 'Target class cohort not found.');
      }
      regNos = [...resolvedClass.enrolledStudentRegNos];
    } else {
      const reg = String(input.studentRegNo || '').trim().toUpperCase();
      if (!reg) throw new CertificationHttpError(400, 'studentRegNo is required.');
      regNos = [reg];
      resolvedClass = state.classes.find((c) =>
        c.enrolledStudentRegNos.some((r) => r.toUpperCase() === reg)
      );
    }

    let createdCount = 0;
    for (const regNo of regNos) {
      const candidateWallet = state.wallets.find((w) => w.studentRegNo.toUpperCase() === regNo);
      const candidateProg = state.progressions.find((p) => p.studentRegNo.toUpperCase() === regNo);
      const studentName = candidateProg?.studentName || candidateWallet?.studentName || regNo;

      for (const mod of modules) {
        const exists = state.moduleAssignments.some(
          (a) => a.studentRegNo.toUpperCase() === regNo && a.moduleId === mod.id
        );
        if (!exists) {
          const assignment: CertModuleAssignment = {
            id: nextId('mas'),
            studentRegNo: regNo,
            studentName,
            programmeId: mod.programmeId,
            programmeName: mod.programmeName,
            classId: resolvedClass?.id || '',
            className: resolvedClass?.name || 'Cohort A',
            moduleId: mod.id,
            moduleCode: mod.code,
            moduleTitle: mod.title,
            requirementKind: mod.requirementKind,
            progressPercent: 0,
            status: 'NOT_STARTED',
            examEligible: mod.prerequisiteModuleIds.length === 0,
            assignedByName: actor.name,
            assignedAt: nowIso(),
          };
          state.moduleAssignments.push(assignment);
          createdCount += 1;
        }
      }
      this.recomputeProgressionInternal(state, regNo, studentName);
    }

    commitState(
      'ACADEMIC',
      actor,
      'MODULES_ASSIGNED',
      `Assigned ${modules.map((m) => m.code).join(', ')} (${createdCount} new assignment rows).`
    );

    return { assignedRowsCreated: createdCount, targetCandidates: regNos.length };
  },

  allocateLecturer(
    input: {
      moduleId: string;
      classId: string;
      primaryLecturerName: string;
      assistantLecturerName?: string;
      hodOversightName?: string;
      teachingHours?: number;
      timetableSummary?: string;
    },
    actor: CertificationActor
  ): CertLecturerAllocation {
    const state = getState();
    const mod = state.modules.find((m) => m.id === input.moduleId);
    const cls = state.classes.find((c) => c.id === input.classId);
    if (!mod || !cls) {
      throw new CertificationHttpError(400, 'Valid module and class are required.');
    }
    const alloc: CertLecturerAllocation = {
      id: nextId('lalloc'),
      moduleId: mod.id,
      moduleCode: mod.code,
      moduleTitle: mod.title,
      classId: cls.id,
      className: cls.name,
      primaryLecturerId: actor.id,
      primaryLecturerName: String(input.primaryLecturerName || '').trim() || mod.lecturerName,
      assistantLecturerName: input.assistantLecturerName?.trim() || undefined,
      hodOversightName: input.hodOversightName?.trim() || 'Prof. Mary Wangui',
      teachingHours: Math.max(4, Number(input.teachingHours || mod.trainingHours)),
      timetableSummary: input.timetableSummary?.trim() || 'Mon & Wed · 10:00 AM – 12:00 PM',
    };
    state.lecturerAllocations.unshift(alloc);
    commitState(
      'ACADEMIC',
      actor,
      'LECTURER_ALLOCATED',
      `Allocated ${alloc.primaryLecturerName} to ${mod.code} (${cls.name})`
    );
    return alloc;
  },

  // ============================================================================
  // 3. EXAMINATION CREDIT WALLET, ATOMIC RESERVE/COMMIT & IMMUTABLE LEDGER
  // ============================================================================
  listCreditOverview() {
    const state = getState();
    return {
      packages: state.creditPackages,
      wallets: state.wallets,
      ledger: state.creditTransactions,
      reservations: state.creditReservations,
      alerts: this.getLowCreditAlerts(),
    };
  },

  getLowCreditAlerts() {
    const state = getState();
    return state.wallets
      .filter((w) => w.availableCredits <= w.lowCreditThreshold)
      .map((w) => {
        const severity =
          w.availableCredits === 0
            ? 'CRITICAL_ZERO'
            : w.availableCredits <= 1
            ? 'URGENT_ONE_LEFT'
            : w.availableCredits <= 3
            ? 'WARNING_THREE_LEFT'
            : 'LOW_FIVE_THRESHOLD';
        return {
          walletId: w.id,
          studentRegNo: w.studentRegNo,
          studentName: w.studentName,
          programmeName: w.programmeName,
          availableCredits: w.availableCredits,
          reservedCredits: w.reservedCredits,
          threshold: w.lowCreditThreshold,
          severity,
          message:
            w.availableCredits === 0
              ? 'Zero examination credits remaining. Exam launch blocked until topped up.'
              : `${w.availableCredits} examination credit(s) left (threshold ${w.lowCreditThreshold}).`,
        };
      });
  },

  createCreditPackage(
    input: Omit<CreditPackage, 'id'>,
    actor: CertificationActor
  ): CreditPackage {
    const state = getState();
    const pkg: CreditPackage = {
      id: nextId('cpkg'),
      ...input,
      code: String(input.code || '').trim().toUpperCase(),
      credits: Math.max(1, Math.floor(Number(input.credits || 1))),
      priceKes: Math.max(0, Number(input.priceKes || 0)),
    };
    if (!pkg.code || !pkg.name) {
      throw new CertificationHttpError(400, 'Package code and name are required.');
    }
    state.creditPackages.unshift(pkg);
    commitState('CREDITS', actor, 'CREDIT_PACKAGE_CREATED', `Created package ${pkg.code} (${pkg.credits} credits)`);
    return pkg;
  },

  allocateCredits(
    input: {
      studentRegNo: string;
      studentName?: string;
      credits: number;
      packageId?: string;
      reason?: string;
    },
    actor: CertificationActor
  ) {
    const state = getState();
    const credits = Math.floor(Number(input.credits));
    if (!Number.isFinite(credits) || credits <= 0) {
      throw new CertificationHttpError(400, 'Allocation credits must be a positive integer.');
    }
    const regNo = String(input.studentRegNo || '').trim().toUpperCase();
    if (!regNo) {
      throw new CertificationHttpError(400, 'studentRegNo is required.');
    }
    const pkg = input.packageId
      ? state.creditPackages.find((p) => p.id === input.packageId)
      : undefined;
    const wallet = ensureWallet(state, regNo, input.studentName || regNo);
    const before = wallet.availableCredits;
    wallet.availableCredits = before + credits;
    wallet.updatedAt = nowIso();

    const tx: CreditTransaction = {
      id: nextId('ctx'),
      txRef: nextTxRef(state),
      walletId: wallet.id,
      studentRegNo: wallet.studentRegNo,
      studentName: wallet.studentName,
      type: 'ALLOCATION',
      creditsDelta: credits,
      balanceBefore: before,
      balanceAfter: wallet.availableCredits,
      referenceLabel: pkg ? pkg.code : 'Direct Allocation',
      reason: input.reason?.trim() || `Allocated ${credits} examination credit(s)`,
      actorId: actor.id,
      actorName: actor.name,
      approvalStatus: 'COMPLETED',
      approvedByName: actor.name,
      approvedAt: nowIso(),
      createdAt: nowIso(),
    };
    state.creditTransactions.unshift(tx);
    commitState(
      'CREDITS',
      actor,
      'CREDITS_ALLOCATED',
      `Allocated +${credits} credit(s) to ${wallet.studentRegNo} (balance ${wallet.availableCredits}).`
    );
    return { wallet, transaction: tx };
  },

  reserveCredits(
    input: {
      studentRegNo: string;
      studentName?: string;
      examId: string;
      examSessionId: string;
      creditsRequired: number;
      idempotencyKey?: string;
    },
    actor: CertificationActor
  ): { wallet: ExaminationCreditWallet; reservation: CreditReservation; deduplicated: boolean } {
    const state = getState();
    const regNo = String(input.studentRegNo || '').trim().toUpperCase();
    const creditsRequired = Math.max(1, Math.floor(Number(input.creditsRequired || 1)));
    const key = (input.idempotencyKey || `${regNo}:${input.examSessionId}`).trim();

    const existing = state.creditReservations.find((r) => r.idempotencyKey === key);
    const wallet = ensureWallet(state, regNo, input.studentName || regNo);
    if (existing && (existing.status === 'RESERVED' || existing.status === 'COMMITTED')) {
      return { wallet, reservation: existing, deduplicated: true };
    }

    if (wallet.status === 'FROZEN') {
      throw new CertificationHttpError(403, 'Examination credit wallet is currently frozen.');
    }
    if (wallet.availableCredits < creditsRequired) {
      throw new CertificationHttpError(
        409,
        `Insufficient examination credits: available ${wallet.availableCredits}, required ${creditsRequired}.`
      );
    }

    const before = wallet.availableCredits;
    wallet.availableCredits = before - creditsRequired;
    wallet.reservedCredits += creditsRequired;
    wallet.updatedAt = nowIso();

    const reservation: CreditReservation = {
      id: nextId('cres'),
      walletId: wallet.id,
      studentRegNo: wallet.studentRegNo,
      examId: input.examId,
      examSessionId: input.examSessionId,
      idempotencyKey: key,
      creditsReserved: creditsRequired,
      status: 'RESERVED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.creditReservations.unshift(reservation);

    state.creditTransactions.unshift({
      id: nextId('ctx'),
      txRef: nextTxRef(state),
      walletId: wallet.id,
      studentRegNo: wallet.studentRegNo,
      studentName: wallet.studentName,
      type: 'RESERVATION',
      creditsDelta: -creditsRequired,
      balanceBefore: before,
      balanceAfter: wallet.availableCredits,
      referenceSessionId: input.examSessionId,
      referenceLabel: input.examId,
      reason: `Reserved ${creditsRequired} credit(s) prior to exam launch`,
      actorId: actor.id,
      actorName: actor.name,
      approvalStatus: 'COMPLETED',
      approvedByName: actor.name,
      approvedAt: nowIso(),
      createdAt: nowIso(),
    });

    commitState(
      'CREDITS',
      actor,
      'CREDITS_RESERVED',
      `Reserved ${creditsRequired} credit(s) for ${wallet.studentRegNo} (session ${input.examSessionId}).`
    );
    return { wallet, reservation, deduplicated: false };
  },

  commitReservedCredits(
    input: { reservationId?: string; idempotencyKey?: string },
    actor: CertificationActor
  ): { wallet: ExaminationCreditWallet; reservation: CreditReservation; deduplicated: boolean } {
    const state = getState();
    const reservation = state.creditReservations.find(
      (r) =>
        (input.reservationId && r.id === input.reservationId) ||
        (input.idempotencyKey && r.idempotencyKey === input.idempotencyKey)
    );
    if (!reservation) {
      throw new CertificationHttpError(404, 'Credit reservation not found.');
    }
    const wallet = state.wallets.find((w) => w.id === reservation.walletId);
    if (!wallet) {
      throw new CertificationHttpError(404, 'Wallet for reservation not found.');
    }
    if (reservation.status === 'COMMITTED') {
      return { wallet, reservation, deduplicated: true };
    }
    if (reservation.status !== 'RESERVED') {
      throw new CertificationHttpError(
        409,
        `Cannot commit reservation in ${reservation.status} state.`
      );
    }
    if (wallet.reservedCredits < reservation.creditsReserved) {
      throw new CertificationHttpError(409, 'Reserved credit balance inconsistency detected.');
    }

    wallet.reservedCredits -= reservation.creditsReserved;
    wallet.consumedCredits += reservation.creditsReserved;
    wallet.updatedAt = nowIso();
    reservation.status = 'COMMITTED';
    reservation.updatedAt = nowIso();

    state.creditTransactions.unshift({
      id: nextId('ctx'),
      txRef: nextTxRef(state),
      walletId: wallet.id,
      studentRegNo: wallet.studentRegNo,
      studentName: wallet.studentName,
      type: 'COMMIT',
      creditsDelta: 0,
      balanceBefore: wallet.availableCredits,
      balanceAfter: wallet.availableCredits,
      referenceSessionId: reservation.examSessionId,
      referenceLabel: reservation.examId,
      reason: `Committed ${reservation.creditsReserved} reserved credit(s) on verified exam launch`,
      actorId: actor.id,
      actorName: actor.name,
      approvalStatus: 'COMPLETED',
      approvedByName: actor.name,
      approvedAt: nowIso(),
      createdAt: nowIso(),
    });

    commitState(
      'CREDITS',
      actor,
      'CREDITS_COMMITTED',
      `Committed ${reservation.creditsReserved} credit(s) for ${wallet.studentRegNo} (${reservation.examSessionId}).`
    );
    return { wallet, reservation, deduplicated: false };
  },

  refundCredits(
    input: {
      studentRegNo: string;
      credits: number;
      reason: string;
      referenceSessionId?: string;
      reservationId?: string;
    },
    actor: CertificationActor
  ) {
    const state = getState();
    const credits = Math.floor(Number(input.credits));
    if (!Number.isFinite(credits) || credits <= 0) {
      throw new CertificationHttpError(400, 'Refund credits must be a positive integer.');
    }
    if (!input.reason || input.reason.trim().length < 5) {
      throw new CertificationHttpError(400, 'A clear audit reason is required for credit refunds.');
    }
    const wallet = state.wallets.find(
      (w) => w.studentRegNo.toUpperCase() === input.studentRegNo.trim().toUpperCase()
    );
    if (!wallet) {
      throw new CertificationHttpError(404, 'Candidate credit wallet not found.');
    }

    if (input.reservationId) {
      const res = state.creditReservations.find((r) => r.id === input.reservationId);
      if (res && res.status === 'RESERVED' && wallet.reservedCredits >= res.creditsReserved) {
        wallet.reservedCredits -= res.creditsReserved;
        res.status = 'REFUNDED';
        res.updatedAt = nowIso();
      } else if (res && res.status === 'COMMITTED') {
        res.status = 'REFUNDED';
        res.updatedAt = nowIso();
      }
    }

    const before = wallet.availableCredits;
    wallet.availableCredits = before + credits;
    wallet.refundedCredits += credits;
    wallet.updatedAt = nowIso();

    const tx: CreditTransaction = {
      id: nextId('ctx'),
      txRef: nextTxRef(state),
      walletId: wallet.id,
      studentRegNo: wallet.studentRegNo,
      studentName: wallet.studentName,
      type: 'REFUND',
      creditsDelta: credits,
      balanceBefore: before,
      balanceAfter: wallet.availableCredits,
      referenceSessionId: input.referenceSessionId,
      reason: input.reason.trim(),
      actorId: actor.id,
      actorName: actor.name,
      approvalStatus: 'COMPLETED',
      approvedByName: actor.name,
      approvedAt: nowIso(),
      createdAt: nowIso(),
    };
    state.creditTransactions.unshift(tx);

    commitState(
      'CREDITS',
      actor,
      'CREDITS_REFUNDED',
      `Issued compensating refund of +${credits} credit(s) to ${wallet.studentRegNo}: ${input.reason}`
    );
    return { wallet, transaction: tx };
  },

  requestCreditAdjustment(
    input: { studentRegNo: string; creditsDelta: number; reason: string },
    actor: CertificationActor
  ): CreditTransaction {
    const state = getState();
    const delta = Math.trunc(Number(input.creditsDelta));
    if (!Number.isFinite(delta) || delta === 0) {
      throw new CertificationHttpError(400, 'creditsDelta must be a non-zero integer.');
    }
    const wallet = state.wallets.find(
      (w) => w.studentRegNo.toUpperCase() === input.studentRegNo.trim().toUpperCase()
    );
    if (!wallet) {
      throw new CertificationHttpError(404, 'Candidate credit wallet not found.');
    }
    if (wallet.availableCredits + delta < 0) {
      throw new CertificationHttpError(
        400,
        'Adjustment would result in a negative examination credit balance.'
      );
    }

    const tx: CreditTransaction = {
      id: nextId('ctx'),
      txRef: nextTxRef(state),
      walletId: wallet.id,
      studentRegNo: wallet.studentRegNo,
      studentName: wallet.studentName,
      type: 'ADJUSTMENT',
      creditsDelta: delta,
      balanceBefore: wallet.availableCredits,
      balanceAfter: wallet.availableCredits, // applied only after approval
      reason: String(input.reason || '').trim() || 'Manual administrative credit adjustment',
      actorId: actor.id,
      actorName: actor.name,
      approvalStatus: 'PENDING_APPROVAL',
      createdAt: nowIso(),
    };
    state.creditTransactions.unshift(tx);
    commitState(
      'CREDITS',
      actor,
      'CREDIT_ADJUSTMENT_REQUESTED',
      `Requested credit adjustment (${delta > 0 ? '+' : ''}${delta}) for ${wallet.studentRegNo}`
    );
    return tx;
  },

  approveCreditAdjustment(
    txId: string,
    decision: 'APPROVED' | 'REJECTED',
    actor: CertificationActor
  ) {
    const state = getState();
    const tx = state.creditTransactions.find((t) => t.id === txId);
    if (!tx) {
      throw new CertificationHttpError(404, 'Credit adjustment transaction not found.');
    }
    if (tx.approvalStatus !== 'PENDING_APPROVAL') {
      throw new CertificationHttpError(409, 'Transaction is no longer pending approval.');
    }
    if (tx.actorId === actor.id && actor.role !== 'ADMIN' && actor.role !== 'PRINCIPAL') {
      throw new CertificationHttpError(
        403,
        'Maker-checker separation requires a second authorized approver.'
      );
    }
    const wallet = state.wallets.find((w) => w.id === tx.walletId);
    if (!wallet) {
      throw new CertificationHttpError(404, 'Wallet not found.');
    }

    if (decision === 'REJECTED') {
      tx.approvalStatus = 'REJECTED';
      tx.approvedByName = actor.name;
      tx.approvedAt = nowIso();
      commitState(
        'CREDITS',
        actor,
        'CREDIT_ADJUSTMENT_REJECTED',
        `Rejected adjustment ${tx.txRef} for ${tx.studentRegNo}`
      );
      return { wallet, transaction: tx };
    }

    if (wallet.availableCredits + tx.creditsDelta < 0) {
      throw new CertificationHttpError(409, 'Insufficient balance to apply negative adjustment.');
    }

    const before = wallet.availableCredits;
    wallet.availableCredits = before + tx.creditsDelta;
    wallet.updatedAt = nowIso();
    tx.balanceBefore = before;
    tx.balanceAfter = wallet.availableCredits;
    tx.approvalStatus = 'COMPLETED';
    tx.approvedByName = actor.name;
    tx.approvedAt = nowIso();

    commitState(
      'CREDITS',
      actor,
      'CREDIT_ADJUSTMENT_APPROVED',
      `Approved adjustment ${tx.txRef} (${tx.creditsDelta > 0 ? '+' : ''}${tx.creditsDelta}) for ${wallet.studentRegNo}`
    );
    return { wallet, transaction: tx };
  },

  // ============================================================================
  // 4. STUDENT PROGRESSION ENGINE
  // ============================================================================
  recomputeProgressionInternal(
    state: CertificationModuleState,
    studentRegNo: string,
    studentName?: string,
    programmeOverride?: CertProgramme
  ): CandidateProgressionRecord {
    const normReg = studentRegNo.trim().toUpperCase();
    const existing = state.progressions.find((p) => p.studentRegNo.toUpperCase() === normReg);
    const prog =
      programmeOverride ||
      state.programmes.find((p) => p.id === existing?.programmeId) ||
      state.programmes[0];

    const assignments = state.moduleAssignments.filter(
      (a) => a.studentRegNo.toUpperCase() === normReg && a.programmeId === prog.id
    );
    const mandatoryModules = state.modules.filter(
      (m) => m.programmeId === prog.id && m.requirementKind === 'MANDATORY'
    );
    const totalRequired = Math.max(
      prog.requiredModulesCount,
      mandatoryModules.length || 1
    );

    const releasedPasses = state.markingSubmissions.filter((m) => {
      if (m.studentRegNo.toUpperCase() !== normReg) return false;
      if (m.moderationStatus !== 'RELEASED') return false;
      return m.objectiveScore + m.manualScore >= m.passMark;
    });

    const completedModulesCount = assignments.filter((a) => a.status === 'COMPLETED').length;
    const passedModuleCodes = new Set(releasedPasses.map((r) => r.moduleCode.toUpperCase()));
    const allMandatoryPassed = mandatoryModules.every(
      (mod) =>
        passedModuleCodes.has(mod.code.toUpperCase()) ||
        assignments.some(
          (a) => a.moduleId === mod.id && a.status === 'COMPLETED' && a.progressPercent >= 100
        )
    );
    const passedExamsCount = Math.max(passedModuleCodes.size, completedModulesCount);

    const hasCertificate = state.certificates.some(
      (c) => c.studentRegNo.toUpperCase() === normReg && c.programmeId === prog.id && c.status === 'ISSUED'
    );

    const eligibleForCertification =
      assignments.length > 0 &&
      completedModulesCount >= totalRequired &&
      passedExamsCount >= totalRequired &&
      allMandatoryPassed;

    let stage: ProgressionStage = 'REGISTERED';
    if (hasCertificate) {
      stage = 'CERTIFIED';
    } else if (eligibleForCertification) {
      stage = 'CERTIFICATION_ELIGIBLE';
    } else if (passedExamsCount > 0 && completedModulesCount >= totalRequired) {
      stage = 'PASSED';
    } else if (
      state.invigilatorSessions.some((s) =>
        s.candidates.some(
          (c) => c.studentRegNo.toUpperCase() === normReg && c.examConnectionState !== 'NOT_STARTED'
        )
      ) ||
      passedExamsCount > 0
    ) {
      stage = 'ASSESSMENT';
    } else if (assignments.some((a) => a.progressPercent > 0)) {
      stage = 'LEARNING';
    } else if (assignments.length > 0) {
      stage = 'MODULES_ASSIGNED';
    }

    const progressPercent = Math.min(
      100,
      Math.round((completedModulesCount / Math.max(1, totalRequired)) * 100)
    );

    const blockReason = eligibleForCertification || hasCertificate
      ? undefined
      : `Requires ${totalRequired} passed mandatory modules (${completedModulesCount}/${totalRequired} completed, ${passedExamsCount}/${totalRequired} passed).`;

    const updated: CandidateProgressionRecord = {
      studentRegNo: normReg,
      studentName: studentName || existing?.studentName || normReg,
      programmeId: prog.id,
      programmeName: prog.name,
      examBody: prog.examBody,
      stage,
      assignedModulesCount: assignments.length,
      completedModulesCount,
      passedExamsCount,
      totalRequiredModules: totalRequired,
      progressPercent,
      eligibleForCertification: eligibleForCertification || hasCertificate,
      eligibilityBlockReason: blockReason,
      updatedAt: nowIso(),
    };

    if (existing) {
      Object.assign(existing, updated);
    } else {
      state.progressions.push(updated);
    }
    return existing || updated;
  },

  listProgressions() {
    const state = getState();
    return state.progressions;
  },

  recomputeProgression(studentRegNo: string, actor: CertificationActor) {
    const state = getState();
    const record = this.recomputeProgressionInternal(state, studentRegNo);
    commitState(
      'PROGRESSION',
      actor,
      'PROGRESSION_RECOMPUTED',
      `Progression for ${record.studentRegNo} set to ${record.stage} (${record.progressPercent}%).`
    );
    return record;
  },

  // ============================================================================
  // 5. CENTRAL QUESTION BANK, VERSIONING, AI DRAFT & EXAM PAPER BUILDER
  // ============================================================================
  listQuestions(
    filters: {
      examBody?: string;
      programmeId?: string;
      moduleCode?: string;
      status?: string;
      stripAnswerKey?: boolean;
    } = {}
  ) {
    const state = getState();
    const items = state.questionBank.filter((q) => {
      if (filters.examBody && q.examBody !== filters.examBody) return false;
      if (filters.programmeId && q.programmeId !== filters.programmeId) return false;
      if (filters.moduleCode && q.moduleCode !== filters.moduleCode) return false;
      if (filters.status && q.status !== filters.status) return false;
      return true;
    });

    if (filters.stripAnswerKey) {
      return items.map(stripQuestionAnswerKey);
    }
    return items;
  },

  createQuestion(
    input: {
      code?: string;
      examBody: CertificationBodyCode;
      programmeId: string;
      moduleCode: string;
      topic: string;
      questionType: QuestionBankType;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      marks: number;
      prompt: string;
      options?: string[];
      correctAnswerKey: string;
      rubricSummary?: string;
      aiAssistedDraft?: boolean;
    },
    actor: CertificationActor
  ): QuestionBankEntry {
    const state = getState();
    const prog = state.programmes.find((p) => p.id === input.programmeId) || state.programmes[0];
    const mod = state.modules.find((m) => m.code === input.moduleCode);
    if (!input.prompt?.trim() || !input.correctAnswerKey?.trim()) {
      throw new CertificationHttpError(400, 'Question prompt and answer key are required.');
    }
    state.sequences.qSeq += 1;
    const code =
      input.code?.trim().toUpperCase() ||
      `${input.moduleCode.replace(/\s+/g, '')}-Q${String(state.sequences.qSeq).padStart(2, '0')}`;
    const marks = Math.max(1, Math.min(100, Math.floor(Number(input.marks || 5))));
    const timestamp = nowIso();

    const q: QuestionBankEntry = {
      id: nextId('qb'),
      code,
      examBody: input.examBody || prog.examBody,
      programmeId: prog.id,
      programmeName: prog.name,
      moduleCode: input.moduleCode,
      moduleTitle: mod?.title || input.moduleCode,
      topic: String(input.topic || 'Core Topic').trim(),
      questionType: input.questionType || 'SINGLE_CHOICE_MCQ',
      difficulty: input.difficulty || 'MEDIUM',
      marks,
      prompt: input.prompt.trim(),
      options: Array.isArray(input.options) ? input.options : undefined,
      correctAnswerKey: input.correctAnswerKey.trim(),
      rubricSummary: input.rubricSummary?.trim() || `Standard ${marks}-mark rubric.`,
      status: 'DRAFT', // Strictly starts as DRAFT even when AI-assisted
      version: 1,
      aiAssistedDraft: Boolean(input.aiAssistedDraft),
      authorId: actor.id,
      authorName: actor.name,
      versions: [
        {
          version: 1,
          prompt: input.prompt.trim(),
          marks,
          options: Array.isArray(input.options) ? input.options : undefined,
          correctAnswerSummary: input.correctAnswerKey.trim(),
          editedByName: actor.name,
          changeNote: input.aiAssistedDraft ? 'AI-assisted draft creation' : 'Initial draft created',
          editedAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.questionBank.unshift(q);
    commitState('QUESTION_BANK', actor, 'QUESTION_CREATED', `Created draft question ${q.code} v1`);
    return q;
  },

  editQuestion(
    questionId: string,
    updates: {
      prompt?: string;
      marks?: number;
      options?: string[];
      correctAnswerKey?: string;
      rubricSummary?: string;
      changeNote?: string;
    },
    actor: CertificationActor
  ): QuestionBankEntry {
    const state = getState();
    const q = state.questionBank.find((item) => item.id === questionId);
    if (!q) {
      throw new CertificationHttpError(404, 'Question bank item not found.');
    }

    const wasApproved = q.status === 'APPROVED';
    const nextPrompt = updates.prompt?.trim() || q.prompt;
    const nextMarks = updates.marks ? Math.max(1, Math.floor(Number(updates.marks))) : q.marks;
    const nextOptions = updates.options ?? q.options;
    const nextKey = updates.correctAnswerKey?.trim() || q.correctAnswerKey;

    if (wasApproved) {
      // Immutable version snapshot: editing an approved question preserves history & increments version back to DRAFT
      q.version += 1;
      q.status = 'DRAFT';
      q.approvedByName = undefined;
      q.approvedAt = undefined;
      q.versions.push({
        version: q.version,
        prompt: nextPrompt,
        marks: nextMarks,
        options: nextOptions,
        correctAnswerSummary: nextKey,
        editedByName: actor.name,
        changeNote: updates.changeNote?.trim() || `Created v${q.version} revision from approved item`,
        editedAt: nowIso(),
      });
    } else {
      const latest = q.versions[q.versions.length - 1];
      if (latest) {
        latest.prompt = nextPrompt;
        latest.marks = nextMarks;
        latest.options = nextOptions;
        latest.correctAnswerSummary = nextKey;
        latest.editedAt = nowIso();
      }
    }

    q.prompt = nextPrompt;
    q.marks = nextMarks;
    q.options = nextOptions;
    q.correctAnswerKey = nextKey;
    if (updates.rubricSummary) q.rubricSummary = updates.rubricSummary.trim();
    q.updatedAt = nowIso();

    commitState(
      'QUESTION_BANK',
      actor,
      wasApproved ? 'APPROVED_QUESTION_NEW_VERSION' : 'QUESTION_UPDATED',
      `Updated ${q.code} (v${q.version}, status ${q.status})`
    );
    return q;
  },

  reviewQuestion(
    questionId: string,
    targetStatus: QuestionReviewStatus,
    actor: CertificationActor
  ): QuestionBankEntry {
    const state = getState();
    const q = state.questionBank.find((item) => item.id === questionId);
    if (!q) {
      throw new CertificationHttpError(404, 'Question bank item not found.');
    }
    if (targetStatus === 'APPROVED') {
      if (q.authorId === actor.id && actor.role !== 'ADMIN' && actor.role !== 'EXAMINATIONS_OFFICER') {
        throw new CertificationHttpError(
          403,
          'Independent moderation requires a reviewer other than the question author.'
        );
      }
      q.approvedByName = actor.name;
      q.approvedAt = nowIso();
    } else if (targetStatus === 'UNDER_REVIEW') {
      q.reviewerName = actor.name;
    }
    q.status = targetStatus;
    q.updatedAt = nowIso();
    commitState(
      'QUESTION_BANK',
      actor,
      `QUESTION_${targetStatus}`,
      `Transitioned ${q.code} v${q.version} to ${targetStatus}`
    );
    return q;
  },

  async generateAiDraftQuestions(
    input: {
      programmeId: string;
      moduleCode: string;
      topic: string;
      count?: number;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    },
    actor: CertificationActor
  ) {
    const state = getState();
    const prog = state.programmes.find((p) => p.id === input.programmeId) || state.programmes[0];
    const count = Math.min(5, Math.max(1, Number(input.count || 2)));
    const difficulty = input.difficulty || 'MEDIUM';

    let generatedItems: Array<{
      prompt: string;
      questionType: QuestionBankType;
      options?: string[];
      correctAnswerKey: string;
      marks: number;
    }> = [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Generate ${count} ${difficulty} certification exam draft question(s) for module ${input.moduleCode} (${prog.name}) on topic "${input.topic}". Return JSON array of {prompt, questionType: "SINGLE_CHOICE_MCQ", options: [4 strings], correctAnswerKey, marks: 5}.`,
          config: { responseMimeType: 'application/json' },
        });
        const parsed = JSON.parse(response.text || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          generatedItems = parsed.slice(0, count);
        }
      } catch {
        // Fallback to deterministic structured academic generator below
      }
    }

    if (generatedItems.length === 0) {
      for (let idx = 0; idx < count; idx += 1) {
        generatedItems.push({
          prompt: `[AI Draft] In ${input.moduleCode} (${input.topic}), which institutional control best satisfies verification requirement #${idx + 1}?`,
          questionType: 'SINGLE_CHOICE_MCQ',
          options: [
            `Apply validated ${input.topic} audit procedure`,
            'Bypass server verification and trust browser state',
            'Skip documentation and archive logs',
            'Allow unauthenticated access during maintenance',
          ],
          correctAnswerKey: `Apply validated ${input.topic} audit procedure`,
          marks: 5,
        });
      }
    }

    const created: QuestionBankEntry[] = generatedItems.map((item) =>
      this.createQuestion(
        {
          examBody: prog.examBody,
          programmeId: prog.id,
          moduleCode: input.moduleCode,
          topic: input.topic,
          questionType: item.questionType || 'SINGLE_CHOICE_MCQ',
          difficulty,
          marks: item.marks || 5,
          prompt: item.prompt,
          options: item.options,
          correctAnswerKey: item.correctAnswerKey,
          rubricSummary: 'AI-assisted draft — mandatory human moderator review before approval.',
          aiAssistedDraft: true,
        },
        actor
      )
    );

    return {
      createdCount: created.length,
      requiresHumanReview: true,
      questions: created,
    };
  },

  listExamPapers() {
    return getState().examPapers;
  },

  createExamPaper(
    input: {
      code?: string;
      title: string;
      examBody: CertificationBodyCode;
      programmeId: string;
      moduleCode: string;
      durationMinutes: number;
      totalMarks: number;
      passMark: number;
      creditCost?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
      negativeMarking?: boolean;
      maxAttempts?: number;
      questionIds: string[];
    },
    actor: CertificationActor
  ): ExamPaperBlueprint {
    const state = getState();
    const questionIds = Array.isArray(input.questionIds) ? input.questionIds : [];
    if (questionIds.length === 0) {
      throw new CertificationHttpError(400, 'An exam paper must contain at least one approved question.');
    }

    const selectedQuestions = questionIds.map((id) => {
      const q = state.questionBank.find((item) => item.id === id);
      if (!q) {
        throw new CertificationHttpError(404, `Question ${id} not found.`);
      }
      if (q.status !== 'APPROVED') {
        throw new CertificationHttpError(
          400,
          `Question ${q.code} is ${q.status}; only APPROVED questions can be added to a paper.`
        );
      }
      return q;
    });

    const computedMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
    const totalMarks = Number(input.totalMarks);
    if (computedMarks !== totalMarks) {
      throw new CertificationHttpError(
        400,
        `Question marks total (${computedMarks}) must match exam paper total marks (${totalMarks}).`
      );
    }
    if (Number(input.passMark) > totalMarks || Number(input.passMark) <= 0) {
      throw new CertificationHttpError(400, 'Pass mark must be between 1 and totalMarks.');
    }

    state.sequences.paperSeq += 1;
    const paper: ExamPaperBlueprint = {
      id: nextId('paper'),
      code:
        input.code?.trim().toUpperCase() ||
        `PPR-${input.moduleCode.replace(/\s+/g, '')}-${String(state.sequences.paperSeq).padStart(2, '0')}`,
      title: String(input.title || '').trim(),
      examBody: input.examBody,
      programmeId: input.programmeId,
      moduleCode: input.moduleCode,
      durationMinutes: Math.max(10, Number(input.durationMinutes || 60)),
      totalMarks,
      passMark: Number(input.passMark),
      creditCost: Math.max(1, Number(input.creditCost || 1)),
      randomizeQuestions: input.randomizeQuestions ?? true,
      randomizeOptions: input.randomizeOptions ?? true,
      negativeMarking: Boolean(input.negativeMarking),
      maxAttempts: Math.max(1, Number(input.maxAttempts || 1)),
      questionIds,
      status: 'DRAFT',
      createdByName: actor.name,
      createdAt: nowIso(),
    };

    state.examPapers.unshift(paper);
    commitState(
      'QUESTION_BANK',
      actor,
      'EXAM_PAPER_CREATED',
      `Built exam paper ${paper.code} (${selectedQuestions.length} questions, ${totalMarks} marks)`
    );
    return paper;
  },

  publishExamPaper(
    paperId: string,
    targetStatus: 'APPROVED' | 'PUBLISHED',
    actor: CertificationActor
  ): ExamPaperBlueprint {
    const state = getState();
    const paper = state.examPapers.find((p) => p.id === paperId);
    if (!paper) {
      throw new CertificationHttpError(404, 'Exam paper not found.');
    }
    paper.status = targetStatus;
    paper.approvedByName = actor.name;
    if (targetStatus === 'PUBLISHED') {
      paper.publishedAt = nowIso();
    }
    commitState('QUESTION_BANK', actor, `PAPER_${targetStatus}`, `Paper ${paper.code} -> ${targetStatus}`);
    return paper;
  },

  // ============================================================================
  // 6. INVIGILATOR PORTAL OPERATIONS
  // ============================================================================
  getInvigilatorDashboard() {
    const db = getDb();
    const state = db.certificationState;
    const sessions = state.invigilatorSessions;
    const totalCandidates = sessions.reduce((sum, s) => sum + s.candidates.length, 0);
    const activeCandidates = sessions.reduce(
      (sum, s) => sum + s.candidates.filter((c) => c.examConnectionState === 'ACTIVE').length,
      0
    );
    const openIncidents = db.secureExamIncidents.filter(
      (inc) => inc.status !== 'DISMISSED'
    ).length;

    return {
      kpis: {
        scheduledSessions: sessions.length,
        registeredCandidates: totalCandidates,
        activeCandidates,
        openIncidents,
      },
      sessions,
    };
  },

  getInvigilatorSessionDetail(sessionId: string) {
    const state = getState();
    const sess = state.invigilatorSessions.find((s) => s.id === sessionId || s.sessionRef === sessionId);
    if (!sess) {
      throw new CertificationHttpError(404, 'Invigilator session not found.');
    }
    return sess;
  },

  verifyCandidateCheckIn(
    sessionId: string,
    input: {
      studentRegNo: string;
      workstation?: string;
      attendanceStatus?: CandidateAttendanceStatus;
      qrToken?: string;
    },
    actor: CertificationActor
  ) {
    const state = getState();
    const sess = this.getInvigilatorSessionDetail(sessionId);
    const regNo = String(input.studentRegNo || input.qrToken || '').trim().toUpperCase();
    const row = sess.candidates.find((c) => c.studentRegNo.toUpperCase() === regNo);
    if (!row) {
      throw new CertificationHttpError(404, `Candidate ${regNo} is not rostered for ${sess.sessionRef}.`);
    }

    const wallet = state.wallets.find((w) => w.studentRegNo.toUpperCase() === regNo);
    if (wallet) {
      row.creditsAvailable = wallet.availableCredits;
    }

    if (!row.emailVerified || !row.accountActive) {
      throw new CertificationHttpError(
        403,
        'Candidate identity gate failed: account must be active with verified email.'
      );
    }
    if (input.attendanceStatus !== 'ABSENT' && row.creditsAvailable <= 0) {
      throw new CertificationHttpError(
        409,
        'Candidate has 0 available examination credits and cannot be checked in as PRESENT.'
      );
    }

    if (input.workstation?.trim()) {
      row.workstation = input.workstation.trim().toUpperCase();
    }
    row.attendanceStatus = input.attendanceStatus || 'PRESENT';
    row.verifiedAt = nowIso();
    row.verifiedByName = actor.name;
    if (sess.status === 'SCHEDULED' || sess.status === 'READY') {
      sess.status = 'ATTENDANCE_IN_PROGRESS';
    }

    commitState(
      'INVIGILATOR',
      actor,
      'CANDIDATE_CHECKED_IN',
      `Verified ${row.studentRegNo} (${row.attendanceStatus}) at workstation ${row.workstation} in ${sess.sessionRef}`
    );
    return sess;
  },

  controlInvigilatorSession(
    sessionId: string,
    action: 'START' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'INVESTIGATE',
    reason: string | undefined,
    actor: CertificationActor
  ): InvigilatorSessionRecord {
    const sess = this.getInvigilatorSessionDetail(sessionId);
    const map: Record<typeof action, InvigilatorSessionRecord['status']> = {
      START: 'IN_PROGRESS',
      PAUSE: 'PAUSED',
      RESUME: 'IN_PROGRESS',
      CANCEL: 'CANCELLED',
      INVESTIGATE: 'UNDER_INVESTIGATION',
    };
    sess.status = map[action];
    commitState(
      'INVIGILATOR',
      actor,
      `SESSION_${action}`,
      `Invigilator session ${sess.sessionRef} transitioned to ${sess.status}${reason ? `: ${reason}` : ''}`
    );
    return sess;
  },

  submitSessionClosureReport(
    sessionId: string,
    input: { finalOutcome: string; notes: string },
    actor: CertificationActor
  ): InvigilatorSessionRecord {
    const db = getDb();
    const sess = this.getInvigilatorSessionDetail(sessionId);
    const registeredCount = sess.candidates.length;
    const presentCount = sess.candidates.filter(
      (c) => c.attendanceStatus === 'PRESENT' || c.attendanceStatus === 'LATE'
    ).length;
    const absentCount = sess.candidates.filter((c) => c.attendanceStatus === 'ABSENT').length;
    const startedCount = sess.candidates.filter(
      (c) => c.examConnectionState !== 'NOT_STARTED'
    ).length;
    const submittedCount = sess.candidates.filter(
      (c) => c.examConnectionState === 'SUBMITTED'
    ).length;
    const disconnectedCount = sess.candidates.filter(
      (c) => c.examConnectionState === 'DISCONNECTED'
    ).length;
    const relatedIncidents = db.secureExamIncidents.filter(
      (inc) => inc.examId === sess.examId
    ).length;
    const interventions = db.secureExamMessages.filter(
      (msg) => msg.senderRole === 'SUPERVISOR'
    ).length;

    sess.status = 'COMPLETED';
    sess.closureReport = {
      submittedByName: actor.name,
      submittedAt: nowIso(),
      registeredCount,
      presentCount,
      absentCount,
      startedCount,
      submittedCount,
      disconnectedCount,
      expiredCount: 0,
      incidentCount: relatedIncidents,
      interventionCount: interventions,
      finalOutcome: String(input.finalOutcome || 'CONCLUDED_NORMALLY').trim(),
      notes: String(input.notes || '').trim() || 'Session completed cleanly with verified attendance.',
    };

    commitState(
      'INVIGILATOR',
      actor,
      'SESSION_CLOSURE_REPORT_SUBMITTED',
      `Submitted closure report for ${sess.sessionRef} (${presentCount}/${registeredCount} present)`
    );
    return sess;
  },

  // ============================================================================
  // 7. MARKING, AI-ASSISTED DRAFT REVIEW & QR DIGITAL CERTIFICATES
  // ============================================================================
  listMarkingSubmissions(studentRegNoFilter?: string) {
    const state = getState();
    if (studentRegNoFilter) {
      const norm = studentRegNoFilter.trim().toUpperCase();
      return state.markingSubmissions.filter(
        (m) => m.studentRegNo.toUpperCase() === norm && m.moderationStatus === 'RELEASED'
      );
    }
    return state.markingSubmissions;
  },

  generateAiMarkingDraft(submissionId: string, actor: CertificationActor): ExamMarkingSubmission {
    const state = getState();
    const sub = state.markingSubmissions.find((m) => m.id === submissionId);
    if (!sub) {
      throw new CertificationHttpError(404, 'Marking submission not found.');
    }
    if (sub.moderationStatus === 'RELEASED') {
      throw new CertificationHttpError(409, 'Released submissions cannot be overwritten by AI drafts.');
    }
    const remainingMarks = Math.max(0, sub.totalMarks - sub.objectiveScore);
    sub.aiDraftScore = Math.round(remainingMarks * 0.78);
    sub.aiDraftFeedback = `AI Marking Draft (${sub.moduleCode}): Suggested manual/practical score ${sub.aiDraftScore}/${remainingMarks}. Pending mandatory human lecturer verification before moderation.`;
    sub.moderationStatus = 'AI_DRAFT_PENDING_HUMAN_REVIEW';

    commitState(
      'MARKING',
      actor,
      'AI_MARKING_DRAFT_GENERATED',
      `Generated AI draft for ${sub.attemptRef} — strictly awaiting human review.`
    );
    return sub;
  },

  saveHumanMarking(
    submissionId: string,
    input: { manualScore: number; lecturerFeedback: string; practicalFeedback?: string },
    actor: CertificationActor
  ): ExamMarkingSubmission {
    const state = getState();
    const sub = state.markingSubmissions.find((m) => m.id === submissionId);
    if (!sub) {
      throw new CertificationHttpError(404, 'Marking submission not found.');
    }
    const maxManual = Math.max(0, sub.totalMarks - sub.objectiveScore);
    const score = Math.max(0, Math.min(maxManual, Math.round(Number(input.manualScore || 0))));

    sub.manualScore = score;
    sub.lecturerFeedback = String(input.lecturerFeedback || '').trim() || 'Reviewed and verified by lecturer.';
    if (input.practicalFeedback !== undefined) {
      sub.practicalFeedback = input.practicalFeedback.trim();
    }
    sub.markedByName = actor.name;
    sub.moderationStatus = 'MODERATED';

    commitState(
      'MARKING',
      actor,
      'HUMAN_MARKING_SAVED',
      `Saved human-verified score (${sub.objectiveScore + sub.manualScore}/${sub.totalMarks}) for ${sub.attemptRef}`
    );
    return sub;
  },

  approveAndReleaseResult(
    submissionId: string,
    moderatorNote: string | undefined,
    actor: CertificationActor
  ): ExamMarkingSubmission {
    const state = getState();
    const sub = state.markingSubmissions.find((m) => m.id === submissionId);
    if (!sub) {
      throw new CertificationHttpError(404, 'Marking submission not found.');
    }
    if (sub.moderationStatus === 'AI_DRAFT_PENDING_HUMAN_REVIEW' || sub.moderationStatus === 'PENDING_MARKING') {
      throw new CertificationHttpError(
        409,
        'AI drafts and unmarked scripts cannot be released until human marking verification is completed.'
      );
    }

    sub.moderatorNote = moderatorNote?.trim() || 'Approved for candidate release.';
    sub.moderatedByName = sub.moderatedByName || actor.name;
    sub.approvedByName = actor.name;
    sub.moderationStatus = 'RELEASED';
    sub.releasedAt = nowIso();

    const totalScore = sub.objectiveScore + sub.manualScore;
    if (totalScore >= sub.passMark) {
      const assignment = state.moduleAssignments.find(
        (a) =>
          a.studentRegNo.toUpperCase() === sub.studentRegNo.toUpperCase() &&
          a.moduleCode.toUpperCase() === sub.moduleCode.toUpperCase()
      );
      if (assignment) {
        assignment.progressPercent = 100;
        assignment.status = 'COMPLETED';
        assignment.examEligible = true;
      }
    }

    this.recomputeProgressionInternal(state, sub.studentRegNo, sub.studentName);
    commitState(
      'MARKING',
      actor,
      'RESULT_RELEASED',
      `Released ${sub.attemptRef} (${totalScore}/${sub.totalMarks}) for ${sub.studentRegNo}`
    );
    return sub;
  },

  listCertificates(studentRegNoFilter?: string) {
    const state = getState();
    if (studentRegNoFilter) {
      const norm = studentRegNoFilter.trim().toUpperCase();
      return state.certificates.filter((c) => c.studentRegNo.toUpperCase() === norm);
    }
    return state.certificates;
  },

  issueCertificate(
    input: { studentRegNo: string; programmeId: string },
    actor: CertificationActor
  ): DigitalCertificateRecord {
    const state = getState();
    const regNo = String(input.studentRegNo || '').trim().toUpperCase();
    const prog = state.programmes.find((p) => p.id === input.programmeId);
    if (!regNo || !prog) {
      throw new CertificationHttpError(400, 'Valid studentRegNo and programmeId are required.');
    }

    const progression = this.recomputeProgressionInternal(state, regNo, undefined, prog);
    if (!progression.eligibleForCertification) {
      throw new CertificationHttpError(
        400,
        progression.eligibilityBlockReason ||
          'Candidate is not eligible for certification until all required modules pass.'
      );
    }

    const existingIssued = state.certificates.find(
      (c) =>
        c.studentRegNo.toUpperCase() === regNo &&
        c.programmeId === prog.id &&
        c.status === 'ISSUED'
    );
    if (existingIssued) {
      return existingIssued;
    }

    state.sequences.certSeq += 1;
    const serialNumber = `HCA-CERT-2026-${String(state.sequences.certSeq).padStart(4, '0')}`;
    const verificationCode = `VRF-${prog.examBody.slice(0, 4)}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const cert: DigitalCertificateRecord = {
      id: nextId('cert'),
      serialNumber,
      verificationCode,
      studentRegNo: regNo,
      studentName: progression.studentName,
      programmeId: prog.id,
      programmeName: prog.name,
      examBody: prog.examBody,
      qualificationTitle: prog.certificationTitle,
      issuedByName: actor.name,
      issuedAt: nowIso(),
      status: 'ISSUED',
      qrPayload: `https://portal.hitech.ac.ke/verify/${serialNumber}?code=${verificationCode}`,
    };

    state.certificates.unshift(cert);
    progression.stage = 'CERTIFIED';
    progression.updatedAt = nowIso();

    commitState(
      'CERTIFICATES',
      actor,
      'CERTIFICATE_ISSUED',
      `Issued digital certificate ${serialNumber} to ${regNo} (${prog.certificationTitle})`
    );
    return cert;
  },

  verifyCertificatePublic(serialOrCode: string) {
    const query = String(serialOrCode || '').trim().toUpperCase();
    if (!query) {
      throw new CertificationHttpError(400, 'Certificate serial or verification code is required.');
    }
    const cert = getState().certificates.find(
      (c) =>
        c.serialNumber.toUpperCase() === query ||
        c.verificationCode.toUpperCase() === query
    );
    if (!cert) {
      throw new CertificationHttpError(404, 'Certificate record not found.');
    }
    return {
      verified: cert.status === 'ISSUED',
      status: cert.status,
      serialNumber: cert.serialNumber,
      verificationCode: cert.verificationCode,
      recipientName: cert.studentName,
      studentRegNo: cert.studentRegNo,
      qualificationTitle: cert.qualificationTitle,
      programmeName: cert.programmeName,
      examBody: cert.examBody,
      issuedByName: cert.issuedByName,
      issuedAt: cert.issuedAt,
      institution: 'HI-TECH College Kenya',
    };
  },

  // ============================================================================
  // 8. CANDIDATE PORTAL AGGREGATION & PRE-FLIGHT EXAM LAUNCH
  // ============================================================================
  getCandidateDashboard(studentRegNo: string, studentName: string) {
    const db = getDb();
    const state = db.certificationState;
    const normReg = studentRegNo.trim().toUpperCase();
    const wallet = ensureWallet(state, normReg, studentName);
    const progression = this.recomputeProgressionInternal(state, normReg, studentName);

    const assignedModules = state.moduleAssignments
      .filter((a) => a.studentRegNo.toUpperCase() === normReg)
      .map((assignment) => {
        const mod = state.modules.find((m) => m.id === assignment.moduleId);
        const prereqs = (mod?.prerequisiteModuleIds || []).map((pid) => {
          const pMod = state.modules.find((m) => m.id === pid);
          const pAssign = state.moduleAssignments.find(
            (a) => a.studentRegNo.toUpperCase() === normReg && a.moduleId === pid
          );
          return {
            moduleId: pid,
            moduleCode: pMod?.code || pid,
            moduleTitle: pMod?.title || 'Prerequisite',
            completed: pAssign?.status === 'COMPLETED',
          };
        });
        const prereqsMet = prereqs.every((p) => p.completed);
        return {
          ...assignment,
          examBody: mod?.examBody || 'ICDL',
          assessmentMode: mod?.assessmentMode || 'Theory & Practical',
          trainingHours: mod?.trainingHours || 24,
          passMarkPercent: mod?.passMarkPercent || 75,
          creditCost: mod?.creditCost || 1,
          lecturerName: mod?.lecturerName || 'Dr. Peter Otieno',
          learningOutcomes: mod?.learningOutcomes || [],
          studyMaterials: mod?.studyMaterials || [],
          prerequisites: prereqs,
          prerequisitesMet: prereqsMet,
        };
      });

    const upcomingExams = state.invigilatorSessions
      .filter((s) => s.status !== 'CANCELLED')
      .map((sess) => {
        const candidateRow = sess.candidates.find(
          (c) => c.studentRegNo.toUpperCase() === normReg
        );
        const paper = state.examPapers.find((p) => p.id === sess.paperId);
        const mod = state.modules.find((m) => m.code === sess.moduleCode);
        const modAssign = assignedModules.find((a) => a.moduleCode === sess.moduleCode);
        const creditCost = paper?.creditCost ?? mod?.creditCost ?? 1;
        const alreadyReserved = state.creditReservations.some(
          (r) =>
            r.studentRegNo.toUpperCase() === normReg &&
            r.examSessionId === sess.sessionRef &&
            (r.status === 'RESERVED' || r.status === 'COMMITTED')
        );

        const readinessChecks = [
          {
            id: 'account-active',
            label: 'Active student account & verified email',
            passed: candidateRow ? candidateRow.accountActive && candidateRow.emailVerified : true,
          },
          {
            id: 'module-assigned',
            label: `Enrolled & assigned to ${sess.moduleCode}`,
            passed: Boolean(modAssign || candidateRow?.moduleAssigned),
          },
          {
            id: 'prerequisites',
            label: 'Module prerequisites satisfied',
            passed: modAssign ? modAssign.prerequisitesMet : true,
          },
          {
            id: 'credits',
            label: `Sufficient exam credits (${wallet.availableCredits} available, needs ${creditCost})`,
            passed: alreadyReserved || wallet.availableCredits >= creditCost,
          },
          {
            id: 'session-open',
            label: `Invigilator session status (${sess.status})`,
            passed: sess.status === 'IN_PROGRESS' || sess.status === 'ATTENDANCE_IN_PROGRESS' || sess.status === 'SCHEDULED' || sess.status === 'READY',
          },
        ];

        return {
          sessionId: sess.id,
          sessionRef: sess.sessionRef,
          examId: sess.examId,
          examTitle: sess.examTitle,
          examBody: sess.examBody,
          moduleCode: sess.moduleCode,
          scheduledDate: sess.scheduledDate,
          startTime: sess.startTime,
          durationMinutes: sess.durationMinutes,
          room: sess.room,
          workstation: candidateRow?.workstation || 'ONLINE-SELF',
          attendanceStatus: candidateRow?.attendanceStatus || 'PENDING',
          connectionState: candidateRow?.examConnectionState || 'NOT_STARTED',
          creditCost,
          alreadyReservedOrCommitted: alreadyReserved,
          // Answer keys strictly stripped for candidate portal
          paperPreview: paper
            ? {
                id: paper.id,
                code: paper.code,
                title: paper.title,
                totalMarks: paper.totalMarks,
                passMark: paper.passMark,
                questionCount: paper.questionIds.length,
                sampleQuestions: state.questionBank
                  .filter((q) => paper.questionIds.includes(q.id))
                  .map(stripQuestionAnswerKey),
              }
            : null,
          readinessChecks,
          readyToLaunch: readinessChecks.every((c) => c.passed),
        };
      });

    const transactions = state.creditTransactions.filter(
      (tx) => tx.studentRegNo.toUpperCase() === normReg
    );
    const results = this.listMarkingSubmissions(normReg);
    const certificates = this.listCertificates(normReg);

    return {
      candidate: {
        studentRegNo: normReg,
        studentName: progression.studentName,
        programmeName: progression.programmeName,
        examBody: progression.examBody,
      },
      kpis: {
        assignedModules: assignedModules.length,
        completedModules: assignedModules.filter((m) => m.status === 'COMPLETED').length,
        upcomingExams: upcomingExams.length,
        certificatesEarned: certificates.filter((c) => c.status === 'ISSUED').length,
        availableCredits: wallet.availableCredits,
      },
      progression,
      wallet,
      lowCreditAlert:
        wallet.availableCredits <= wallet.lowCreditThreshold
          ? {
              severity: wallet.availableCredits === 0 ? 'CRITICAL' : 'WARNING',
              availableCredits: wallet.availableCredits,
              threshold: wallet.lowCreditThreshold,
              message:
                wallet.availableCredits === 0
                  ? 'You have 0 examination credits remaining. Request credit allocation before starting an exam.'
                  : `Low credit alert: ${wallet.availableCredits} examination credit(s) left.`,
            }
          : null,
      transactions,
      assignedModules,
      upcomingExams,
      results,
      certificates,
    };
  },

  launchCandidateExam(
    examOrSessionId: string,
    student: { studentRegNo: string; studentName: string; id: string },
    idempotencyKey?: string
  ) {
    const state = getState();
    const normReg = student.studentRegNo.trim().toUpperCase();
    const sess = state.invigilatorSessions.find(
      (s) =>
        s.id === examOrSessionId ||
        s.sessionRef === examOrSessionId ||
        s.examId === examOrSessionId
    );
    if (!sess) {
      throw new CertificationHttpError(404, 'Examination session not found.');
    }

    const paper = state.examPapers.find((p) => p.id === sess.paperId);
    const creditCost = paper?.creditCost ?? 1;
    const key = idempotencyKey?.trim() || `${normReg}:${sess.sessionRef}`;

    const actor: CertificationActor = {
      id: student.id,
      name: student.studentName,
      role: 'STUDENT',
    };

    // Atomic reserve -> commit with idempotency so network reconnects never double-deduct
    const reserved = this.reserveCredits(
      {
        studentRegNo: normReg,
        studentName: student.studentName,
        examId: sess.examId,
        examSessionId: sess.sessionRef,
        creditsRequired: creditCost,
        idempotencyKey: key,
      },
      actor
    );
    const committed = this.commitReservedCredits(
      { reservationId: reserved.reservation.id },
      actor
    );

    const row = sess.candidates.find((c) => c.studentRegNo.toUpperCase() === normReg);
    if (row) {
      row.creditsAvailable = committed.wallet.availableCredits;
      row.attendanceStatus = row.attendanceStatus === 'PENDING' ? 'PRESENT' : row.attendanceStatus;
      row.examConnectionState = 'ACTIVE';
      row.lastHeartbeatAt = nowIso();
    }

    commitState(
      'INVIGILATOR',
      actor,
      'CANDIDATE_EXAM_LAUNCHED',
      `${normReg} launched ${sess.examTitle} (${sess.sessionRef}); deduplicated=${committed.deduplicated}`
    );

    return {
      sessionRef: sess.sessionRef,
      examId: sess.examId,
      examTitle: sess.examTitle,
      wallet: committed.wallet,
      reservation: committed.reservation,
      deduplicated: committed.deduplicated,
      questions: paper
        ? state.questionBank
            .filter((q) => paper.questionIds.includes(q.id))
            .map(stripQuestionAnswerKey)
        : [],
    };
  },
};
