import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { requirePortalAuth } from '../../middleware/auth.ts';
import {
  StudentAcademicHttpError,
  studentAcademicService,
  type StudentAcademicIdentity,
} from './studentAcademic.service.ts';

function normalizeIdentifier(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function assertNoCrossStudentOverride(
  req: Request,
  identity: StudentAcademicIdentity
): void {
  const allowedIds = new Set(
    [
      identity.studentId,
      identity.pgUserId != null ? String(identity.pgUserId) : null,
      identity.studentRegNo,
    ]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim().toUpperCase())
  );

  const queryCandidates = [
    req.query?.studentId,
    req.query?.studentRegNo,
    req.query?.regNo,
    req.query?.studentProfileId,
  ];

  for (const candidate of queryCandidates) {
    if (candidate === undefined || candidate === null || candidate === '') {
      continue;
    }
    const normalized = normalizeIdentifier(
      Array.isArray(candidate) ? candidate[0] : candidate
    );
    if (normalized && !allowedIds.has(normalized)) {
      throw new StudentAcademicHttpError(
        403,
        'Access denied: students cannot query academic records belonging to another student.'
      );
    }
  }
}

export function resolveAcademicStudentIdentity(
  req: Request
): StudentAcademicIdentity {
  const portal = req.portalUser;

  if (!portal) {
    if (req.staffUser) {
      throw new StudentAcademicHttpError(
        403,
        'Staff accounts cannot access student self-service academic records.'
      );
    }
    throw new StudentAcademicHttpError(
      401,
      'Student portal authentication required.'
    );
  }

  if (portal.primaryRole.toUpperCase() !== 'STUDENT') {
    throw new StudentAcademicHttpError(
      403,
      'Only authenticated student accounts can access student academic records.'
    );
  }

  const regNo = portal.registrationNumber?.trim();
  const uid = portal.uid?.trim();
  if (!regNo || !uid) {
    throw new StudentAcademicHttpError(
      403,
      'Your student account is not linked to an official registration number.'
    );
  }

  const identity: StudentAcademicIdentity = {
    studentId: uid,
    pgUserId: portal.pgUserId ?? null,
    studentRegNo: regNo,
    studentName: portal.fullName,
    departmentId: portal.departmentId ?? null,
  };

  assertNoCrossStudentOverride(req, identity);
  return identity;
}

function handleAcademicError(res: Response, err: unknown): void {
  if (err instanceof StudentAcademicHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message =
    err instanceof Error ? err.message : 'Unexpected student academic service error.';
  res.status(500).json({ success: false, error: message });
}

function requireStudentAcademicAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      throw new StudentAcademicHttpError(
        403,
        'Student academic records are read-only from the student portal.'
      );
    }
    resolveAcademicStudentIdentity(req);
    next();
  } catch (err) {
    handleAcademicError(res, err);
  }
}

export const studentAcademicRoutes = Router();
studentAcademicRoutes.use(requirePortalAuth, requireStudentAcademicAccess);

studentAcademicRoutes.get('/units', async (req, res) => {
  try {
    const identity = resolveAcademicStudentIdentity(req);
    const data = await studentAcademicService.getUnits(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleAcademicError(res, err);
  }
});

studentAcademicRoutes.get('/timetable', async (req, res) => {
  try {
    const identity = resolveAcademicStudentIdentity(req);
    const data = await studentAcademicService.getTimetable(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleAcademicError(res, err);
  }
});

studentAcademicRoutes.get('/attendance', async (req, res) => {
  try {
    const identity = resolveAcademicStudentIdentity(req);
    const data = await studentAcademicService.getAttendance(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleAcademicError(res, err);
  }
});

studentAcademicRoutes.get('/assessments', async (req, res) => {
  try {
    const identity = resolveAcademicStudentIdentity(req);
    const data = await studentAcademicService.getAssessments(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleAcademicError(res, err);
  }
});

studentAcademicRoutes.get('/results', async (req, res) => {
  try {
    const identity = resolveAcademicStudentIdentity(req);
    const data = await studentAcademicService.getResults(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleAcademicError(res, err);
  }
});

studentAcademicRoutes.get('/progress', async (req, res) => {
  try {
    const identity = resolveAcademicStudentIdentity(req);
    const data = await studentAcademicService.getProgress(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleAcademicError(res, err);
  }
});

studentAcademicRoutes.get('/exam-timetable', async (req, res) => {
  try {
    const identity = resolveAcademicStudentIdentity(req);
    const data = await studentAcademicService.getExamTimetable(identity);
    res.json({ success: true, data });
  } catch (err) {
    handleAcademicError(res, err);
  }
});
