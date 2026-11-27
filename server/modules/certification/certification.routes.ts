import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  requireAuth,
  requirePermission,
  requirePortalAuth,
} from '../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../staff/staff.permissions.ts';
import {
  CertificationHttpError,
  certificationService,
  type CertificationActor,
} from './certification.service.ts';

function handleError(res: Response, err: unknown): void {
  if (err instanceof CertificationHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected certification platform error.';
  res.status(500).json({ success: false, error: message });
}

function getStaffActor(req: Request): CertificationActor {
  if (!req.staffUser) {
    throw new CertificationHttpError(401, 'Authenticated staff session required.');
  }
  return {
    id: req.staffUser.id,
    name: req.staffUser.fullName,
    role: req.staffUser.role,
  };
}

function resolveCandidateIdentity(req: Request): {
  id: string;
  studentRegNo: string;
  studentName: string;
} {
  if (req.portalUser) {
    const regNo = (req.portalUser.registrationNumber || req.portalUser.uid).toUpperCase();
    const requestedReg = typeof req.query.studentRegNo === 'string'
      ? req.query.studentRegNo.trim().toUpperCase()
      : undefined;
    if (
      req.portalUser.primaryRole.toUpperCase() === 'STUDENT' &&
      requestedReg &&
      requestedReg !== regNo
    ) {
      throw new CertificationHttpError(
        403,
        'Candidates can only access their own learning, credit, exam, and certificate records.'
      );
    }
    return {
      id: req.portalUser.uid,
      studentRegNo: regNo,
      studentName: req.portalUser.fullName,
    };
  }
  if (req.staffUser) {
    return {
      id: req.staffUser.id,
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Amina Wanjiku',
    };
  }
  throw new CertificationHttpError(401, 'Candidate authentication required.');
}

// ============================================================================
// 1. ADMIN PORTAL ANALYTICS, CANDIDATES & PROGRESSION (/api/admin)
// ============================================================================
export const adminCertificationRoutes = Router();
adminCertificationRoutes.use(requireAuth);

adminCertificationRoutes.get('/analytics', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.getAdminAnalytics() });
  } catch (err) {
    handleError(res, err);
  }
});

adminCertificationRoutes.get(
  '/candidates',
  requirePermission(
    STAFF_PERMISSIONS.USERS_VIEW,
    STAFF_PERMISSIONS.STUDENTS_VIEW,
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE
  ),
  (_req, res) => {
    try {
      res.json({ success: true, data: certificationService.listCandidates() });
    } catch (err) {
      handleError(res, err);
    }
  }
);

adminCertificationRoutes.get(
  '/candidates/:regNo',
  requirePermission(
    STAFF_PERMISSIONS.USERS_VIEW,
    STAFF_PERMISSIONS.STUDENTS_VIEW,
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE
  ),
  (req, res) => {
    try {
      const regNo = decodeURIComponent(String(req.params.regNo || ''));
      res.json({ success: true, data: certificationService.getCandidateDetail(regNo) });
    } catch (err) {
      handleError(res, err);
    }
  }
);

adminCertificationRoutes.post(
  '/candidates/import',
  requirePermission(
    STAFF_PERMISSIONS.USERS_CREATE,
    STAFF_PERMISSIONS.REGISTRATION_MANAGE,
    STAFF_PERMISSIONS.ADMISSIONS_MANAGE
  ),
  (req, res) => {
    try {
      const data = certificationService.enrollOrImportCandidates(
        req.body || {},
        getStaffActor(req)
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

adminCertificationRoutes.get('/progressions', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.listProgressions() });
  } catch (err) {
    handleError(res, err);
  }
});

adminCertificationRoutes.post(
  '/progressions/:regNo/recompute',
  requirePermission(
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE,
    STAFF_PERMISSIONS.RESULTS_APPROVE,
    STAFF_PERMISSIONS.REGISTRATION_MANAGE
  ),
  (req, res) => {
    try {
      const regNo = decodeURIComponent(String(req.params.regNo || ''));
      const data = certificationService.recomputeProgression(regNo, getStaffActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

// ============================================================================
// 2. ACADEMIC STRUCTURE: DEPARTMENTS, PROGRAMMES, MODULES, CLASSES (/api/academic)
// ============================================================================
export const academicCertificationRoutes = Router();
academicCertificationRoutes.use(requireAuth);

academicCertificationRoutes.get('/catalog', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.getAcademicCatalog() });
  } catch (err) {
    handleError(res, err);
  }
});

academicCertificationRoutes.post(
  '/departments',
  requirePermission(
    STAFF_PERMISSIONS.USERS_CREATE,
    STAFF_PERMISSIONS.ACADEMICS_VIEW,
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE
  ),
  (req, res) => {
    try {
      const data = certificationService.createDepartment(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

academicCertificationRoutes.post(
  '/programmes',
  requirePermission(
    STAFF_PERMISSIONS.USERS_CREATE,
    STAFF_PERMISSIONS.ACADEMICS_VIEW,
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE
  ),
  (req, res) => {
    try {
      const data = certificationService.createProgramme(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

academicCertificationRoutes.post(
  '/periods',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.REGISTRATION_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createAcademicPeriod(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

academicCertificationRoutes.post(
  '/modules',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.TEACHING_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createModule(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

academicCertificationRoutes.post(
  '/classes',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.REGISTRATION_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createClassCohort(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

academicCertificationRoutes.post(
  '/module-assignments',
  requirePermission(
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE,
    STAFF_PERMISSIONS.REGISTRATION_MANAGE,
    STAFF_PERMISSIONS.TEACHING_MANAGE
  ),
  (req, res) => {
    try {
      const data = certificationService.assignModulesToStudentOrClass(
        req.body || {},
        getStaffActor(req)
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

academicCertificationRoutes.post(
  '/lecturer-allocations',
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.TEACHING_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.allocateLecturer(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

// ============================================================================
// 3. EXAMINATION CREDIT WALLET & IMMUTABLE LEDGER (/api/exam-credits)
// ============================================================================
export const examCreditRoutes = Router();
examCreditRoutes.use(requireAuth);

examCreditRoutes.get('/overview', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.listCreditOverview() });
  } catch (err) {
    handleError(res, err);
  }
});

examCreditRoutes.get('/alerts', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.getLowCreditAlerts() });
  } catch (err) {
    handleError(res, err);
  }
});

examCreditRoutes.post(
  '/packages',
  requirePermission(STAFF_PERMISSIONS.CREDITS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createCreditPackage(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examCreditRoutes.post(
  '/allocate',
  requirePermission(STAFF_PERMISSIONS.CREDITS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.allocateCredits(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examCreditRoutes.post(
  '/reserve',
  requirePermission(STAFF_PERMISSIONS.CREDITS_MANAGE, STAFF_PERMISSIONS.INVIGILATE_SESSIONS),
  (req, res) => {
    try {
      const data = certificationService.reserveCredits(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examCreditRoutes.post(
  '/commit',
  requirePermission(STAFF_PERMISSIONS.CREDITS_MANAGE, STAFF_PERMISSIONS.INVIGILATE_SESSIONS),
  (req, res) => {
    try {
      const data = certificationService.commitReservedCredits(req.body || {}, getStaffActor(req));
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examCreditRoutes.post(
  '/refund',
  requirePermission(STAFF_PERMISSIONS.CREDITS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.refundCredits(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examCreditRoutes.post(
  '/adjustments',
  requirePermission(STAFF_PERMISSIONS.CREDITS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.requestCreditAdjustment(
        req.body || {},
        getStaffActor(req)
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examCreditRoutes.post(
  '/adjustments/:txId/approve',
  requirePermission(STAFF_PERMISSIONS.CREDITS_APPROVE),
  (req, res) => {
    try {
      const decision = req.body?.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
      const data = certificationService.approveCreditAdjustment(
        String(req.params.txId),
        decision,
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

function requireExamBankAccess(req: Request, res: Response, next: NextFunction): void {
  if (req.portalUser?.primaryRole?.toUpperCase() === 'STUDENT') {
    res.status(403).json({
      success: false,
      error: 'Candidates cannot access the confidential question bank or examination administration.',
    });
    return;
  }
  const user = req.staffUser;
  if (!user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }
  const perms = user.permissions || [];
  const hasExamBankPerm =
    perms.includes(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE) ||
    perms.includes(STAFF_PERMISSIONS.RESULTS_MANAGE) ||
    perms.includes(STAFF_PERMISSIONS.RESULTS_APPROVE);
  const isInvigilatorOnly =
    String(user.role).toUpperCase() === 'INVIGILATOR' ||
    (perms.includes(STAFF_PERMISSIONS.INVIGILATE_SESSIONS) && !hasExamBankPerm);
  if (isInvigilatorOnly || !hasExamBankPerm) {
    res.status(403).json({
      success: false,
      error: 'Access denied: Examination Administration requires academic/exam management privileges.',
    });
    return;
  }
  next();
}

function buildQuestionFilters(req: Request) {
  return {
    examBody: typeof req.query.examBody === 'string' && req.query.examBody !== 'ALL' ? req.query.examBody : undefined,
    departmentId: typeof req.query.departmentId === 'string' && req.query.departmentId !== 'ALL' ? req.query.departmentId : undefined,
    programmeId: typeof req.query.programmeId === 'string' && req.query.programmeId !== 'ALL' ? req.query.programmeId : undefined,
    moduleCode: typeof req.query.moduleCode === 'string' && req.query.moduleCode !== 'ALL' ? req.query.moduleCode : undefined,
    topic: typeof req.query.topic === 'string' && req.query.topic !== 'ALL' ? req.query.topic : undefined,
    topicId: typeof req.query.topicId === 'string' && req.query.topicId !== 'ALL' ? req.query.topicId : undefined,
    questionType: typeof req.query.questionType === 'string' && req.query.questionType !== 'ALL' ? req.query.questionType : undefined,
    difficulty: typeof req.query.difficulty === 'string' && req.query.difficulty !== 'ALL' ? req.query.difficulty : undefined,
    status: typeof req.query.status === 'string' && req.query.status !== 'ALL' ? req.query.status : undefined,
    authorId: typeof req.query.authorId === 'string' && req.query.authorId !== 'ALL' ? req.query.authorId : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
  };
}

// ============================================================================
// 4. QUESTION BANK, EXAM PAPERS, MARKING & CERTIFICATES (/api/exam-admin)
// ============================================================================
export const examAdminRoutes = Router();
examAdminRoutes.use(requireAuth);

examAdminRoutes.get('/dashboard', requireExamBankAccess, (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.getExamAdminDashboard() });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.get('/question-bank', requireExamBankAccess, (req, res) => {
  try {
    res.json({ success: true, data: certificationService.listQuestions(buildQuestionFilters(req)) });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.get('/questions', requireExamBankAccess, (req, res) => {
  try {
    res.json({ success: true, data: certificationService.listQuestions(buildQuestionFilters(req)) });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.get('/questions/export', requireExamBankAccess, (req, res) => {
  try {
    const exported = certificationService.exportQuestionsCsv(buildQuestionFilters(req));
    res.json({ success: true, data: exported });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/questions/import',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.importQuestionsBatch(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/questions/ai-draft',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  async (req, res) => {
    try {
      const data = await certificationService.generateAiDraftQuestions(
        req.body || {},
        getStaffActor(req)
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/questions/:questionId', requireExamBankAccess, (req, res) => {
  try {
    const data = certificationService.getQuestionById(String(req.params.questionId));
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.get('/questions/:questionId/versions', requireExamBankAccess, (req, res) => {
  try {
    const data = certificationService.getQuestionVersions(String(req.params.questionId));
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/questions',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createQuestion(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.patch(
  '/questions/:questionId',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.editQuestion(
        String(req.params.questionId),
        req.body || {},
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/questions/:questionId/review',
  requireExamBankAccess,
  requirePermission(
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE,
    STAFF_PERMISSIONS.RESULTS_APPROVE,
    STAFF_PERMISSIONS.RESULTS_MANAGE
  ),
  (req, res) => {
    try {
      const status = String(req.body?.status || 'UNDER_REVIEW').toUpperCase();
      if (!['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED'].includes(status)) {
        throw new CertificationHttpError(400, 'Invalid question status transition.');
      }
      const actor = getStaffActor(req);
      if (
        status === 'APPROVED' &&
        !req.staffUser?.permissions.includes(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE) &&
        !req.staffUser?.permissions.includes(STAFF_PERMISSIONS.RESULTS_APPROVE)
      ) {
        throw new CertificationHttpError(403, 'Approval permission required to approve questions.');
      }
      const data = certificationService.reviewQuestion(
        String(req.params.questionId),
        status as 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED',
        actor,
        typeof req.body?.comment === 'string' ? req.body.comment : undefined
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/questions/:questionId/approve',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_APPROVE),
  (req, res) => {
    try {
      const data = certificationService.reviewQuestion(
        String(req.params.questionId),
        'APPROVED',
        getStaffActor(req),
        typeof req.body?.comment === 'string' ? req.body.comment : undefined
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/categories', requireExamBankAccess, (req, res) => {
  try {
    const data = certificationService.listCategoriesAndTopics({
      examBody: typeof req.query.examBody === 'string' ? req.query.examBody : undefined,
      departmentId: typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined,
      programmeId: typeof req.query.programmeId === 'string' ? req.query.programmeId : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/categories',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createTopic(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/topics', requireExamBankAccess, (req, res) => {
  try {
    const data = certificationService.listCategoriesAndTopics({
      examBody: typeof req.query.examBody === 'string' ? req.query.examBody : undefined,
      departmentId: typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined,
      programmeId: typeof req.query.programmeId === 'string' ? req.query.programmeId : undefined,
    });
    res.json({ success: true, data: data.topics });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/topics',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createTopic(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/templates', requireExamBankAccess, (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.listExamTemplates() });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/templates',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_APPROVE),
  (req, res) => {
    try {
      const data = certificationService.createExamTemplate(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/papers', requireExamBankAccess, (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.listExamPapers() });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/papers',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.createExamPaper(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/papers/:paperId/questions',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.updatePaperQuestions(
        String(req.params.paperId),
        req.body || {},
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/papers/:paperId/preview', requireExamBankAccess, (req, res) => {
  try {
    const includeAnswerKey = req.query.includeAnswerKey !== 'false';
    const seed = typeof req.query.seed === 'string' ? req.query.seed : undefined;
    const data = certificationService.previewExamPaper(String(req.params.paperId), {
      seed,
      includeAnswerKey,
    });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/papers/:paperId/submit-approval',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.submitPaperForApproval(
        String(req.params.paperId),
        typeof req.body?.comment === 'string' ? req.body.comment : undefined,
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/papers/:paperId/publish',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_APPROVE),
  (req, res) => {
    try {
      const target = req.body?.status === 'APPROVED' ? 'APPROVED' : 'PUBLISHED';
      const data = certificationService.publishExamPaper(
        String(req.params.paperId),
        target,
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/ai/generate',
  requireExamBankAccess,
  requirePermission(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE, STAFF_PERMISSIONS.RESULTS_MANAGE),
  async (req, res) => {
    try {
      const data = await certificationService.generateAiDraftQuestions(
        req.body || {},
        getStaffActor(req)
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/reports', requireExamBankAccess, (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.getExamAdminReports() });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.get('/marking', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.listMarkingSubmissions() });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.post(
  '/marking/:submissionId/ai-draft',
  requirePermission(STAFF_PERMISSIONS.RESULTS_MANAGE, STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.generateAiMarkingDraft(
        String(req.params.submissionId),
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/marking/:submissionId/grade',
  requirePermission(STAFF_PERMISSIONS.RESULTS_MANAGE, STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.saveHumanMarking(
        String(req.params.submissionId),
        req.body || {},
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/marking/:submissionId/approve-release',
  requirePermission(STAFF_PERMISSIONS.RESULTS_APPROVE, STAFF_PERMISSIONS.EXAMINATIONS_MANAGE),
  (req, res) => {
    try {
      const data = certificationService.approveAndReleaseResult(
        String(req.params.submissionId),
        typeof req.body?.moderatorNote === 'string' ? req.body.moderatorNote : undefined,
        getStaffActor(req)
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.get('/certificates', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.listCertificates() });
  } catch (err) {
    handleError(res, err);
  }
});

examAdminRoutes.get(
  '/certificates/eligibility/:studentRegNo',
  requirePermission(
    STAFF_PERMISSIONS.CERTIFICATES_ISSUE,
    STAFF_PERMISSIONS.EXAMINATIONS_MANAGE,
    STAFF_PERMISSIONS.RESULTS_MANAGE,
    STAFF_PERMISSIONS.RESULTS_APPROVE
  ),
  (req, res) => {
    try {
      const programmeId =
        typeof req.query.programmeId === 'string' && req.query.programmeId.trim()
          ? req.query.programmeId.trim()
          : undefined;
      const data = certificationService.checkCertificationEligibility(
        String(req.params.studentRegNo),
        programmeId
      );
      res.json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

examAdminRoutes.post(
  '/certificates/issue',
  requirePermission(STAFF_PERMISSIONS.CERTIFICATES_ISSUE),
  (req, res) => {
    try {
      const data = certificationService.issueCertificate(req.body || {}, getStaffActor(req));
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleError(res, err);
    }
  }
);

// ============================================================================
// 5. INVIGILATOR PORTAL OPERATIONS (/api/invigilator)
// ============================================================================
export const invigilatorRoutes = Router();
invigilatorRoutes.use(requireAuth);
invigilatorRoutes.use(
  requirePermission(STAFF_PERMISSIONS.INVIGILATE_SESSIONS, STAFF_PERMISSIONS.EXAMINATIONS_MANAGE)
);

invigilatorRoutes.get('/dashboard', (_req, res) => {
  try {
    res.json({ success: true, data: certificationService.getInvigilatorDashboard() });
  } catch (err) {
    handleError(res, err);
  }
});

invigilatorRoutes.get('/sessions/:sessionId', (req, res) => {
  try {
    res.json({
      success: true,
      data: certificationService.getInvigilatorSessionDetail(String(req.params.sessionId)),
    });
  } catch (err) {
    handleError(res, err);
  }
});

invigilatorRoutes.post('/sessions/:sessionId/checkin', (req, res) => {
  try {
    const data = certificationService.verifyCandidateCheckIn(
      String(req.params.sessionId),
      req.body || {},
      getStaffActor(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

invigilatorRoutes.post('/sessions/:sessionId/control', (req, res) => {
  try {
    const action = String(req.body?.action || '').toUpperCase();
    if (!['START', 'PAUSE', 'RESUME', 'CANCEL', 'INVESTIGATE'].includes(action)) {
      throw new CertificationHttpError(400, 'Invalid invigilator session control action.');
    }
    const data = certificationService.controlInvigilatorSession(
      String(req.params.sessionId),
      action as 'START' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'INVESTIGATE',
      typeof req.body?.reason === 'string' ? req.body.reason : undefined,
      getStaffActor(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

invigilatorRoutes.post('/sessions/:sessionId/closure-report', (req, res) => {
  try {
    const data = certificationService.submitSessionClosureReport(
      String(req.params.sessionId),
      req.body || {},
      getStaffActor(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

// ============================================================================
// 6. CANDIDATE PORTAL ROUTES (/api/candidate) — OWNERSHIP ENFORCED
// ============================================================================
export const candidateCertificationRoutes = Router();
candidateCertificationRoutes.use(requirePortalAuth);

candidateCertificationRoutes.get('/dashboard', (req, res) => {
  try {
    const student = resolveCandidateIdentity(req);
    res.json({
      success: true,
      data: certificationService.getCandidateDashboard(
        student.studentRegNo,
        student.studentName
      ),
    });
  } catch (err) {
    handleError(res, err);
  }
});

candidateCertificationRoutes.get('/modules', (req, res) => {
  try {
    const student = resolveCandidateIdentity(req);
    const dashboard = certificationService.getCandidateDashboard(
      student.studentRegNo,
      student.studentName
    );
    res.json({ success: true, data: dashboard.assignedModules });
  } catch (err) {
    handleError(res, err);
  }
});

candidateCertificationRoutes.get('/credits', (req, res) => {
  try {
    const student = resolveCandidateIdentity(req);
    const dashboard = certificationService.getCandidateDashboard(
      student.studentRegNo,
      student.studentName
    );
    res.json({
      success: true,
      data: {
        wallet: dashboard.wallet,
        lowCreditAlert: dashboard.lowCreditAlert,
        transactions: dashboard.transactions,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

candidateCertificationRoutes.get('/examinations', (req, res) => {
  try {
    const student = resolveCandidateIdentity(req);
    const dashboard = certificationService.getCandidateDashboard(
      student.studentRegNo,
      student.studentName
    );
    res.json({ success: true, data: dashboard.upcomingExams });
  } catch (err) {
    handleError(res, err);
  }
});

candidateCertificationRoutes.post('/examinations/:examOrSessionId/launch', (req, res) => {
  try {
    const student = resolveCandidateIdentity(req);
    const idempotencyKey =
      typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey : undefined;
    const data = certificationService.launchCandidateExam(
      String(req.params.examOrSessionId),
      student,
      idempotencyKey
    );
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

candidateCertificationRoutes.get('/results', (req, res) => {
  try {
    const student = resolveCandidateIdentity(req);
    res.json({
      success: true,
      data: certificationService.listMarkingSubmissions(student.studentRegNo),
    });
  } catch (err) {
    handleError(res, err);
  }
});

candidateCertificationRoutes.get('/certificates', (req, res) => {
  try {
    const student = resolveCandidateIdentity(req);
    res.json({
      success: true,
      data: certificationService.listCertificates(student.studentRegNo),
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ============================================================================
// 7. PUBLIC DIGITAL CERTIFICATE VERIFICATION (/api/public/verify-certificate)
// ============================================================================
export const publicCertVerifyRoutes = Router();

publicCertVerifyRoutes.get('/:serialOrCode', (req, res) => {
  try {
    const data = certificationService.verifyCertificatePublic(
      decodeURIComponent(String(req.params.serialOrCode || ''))
    );
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});
