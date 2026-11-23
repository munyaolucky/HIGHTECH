import {
  REGISTRATION_CATEGORIES,
  type RegistrationCategory,
  type RegistrationStatus,
} from './registration.permissions.ts';
import type { RegistrationDocumentChecklistItem } from '../../data/store.ts';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export interface RegistrationPayloadInput {
  category: RegistrationCategory;
  subType?: string;
  submitImmediately?: boolean;
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  identificationType?: 'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT';
  identificationNumber: string;
  campusId: string;
  departmentId?: string | null;
  proposedRole?: string;
  odpcConsentAccepted: boolean;
  documents?: RegistrationDocumentChecklistItem[];
  studentDetails?: {
    programmeId?: string;
    programme: string;
    intakeId?: string;
    intake: string;
    studyMode: 'FULL_TIME' | 'PART_TIME' | 'EVENING' | 'ONLINE' | 'HYBRID';
    previousInstitution: string;
    previousQualification: string;
    previousGrade: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    guardianRelationship: string;
    feeCategory: 'SELF_SPONSORED' | 'GOVERNMENT_KUCCPS' | 'HELB_LOAN' | 'SCHOLARSHIP' | 'CORPORATE';
    sponsorshipReference: string;
  };
  staffDetails?: {
    employeeType: 'TEACHING' | 'NON_TEACHING' | 'LECTURER' | 'LIBRARIAN' | 'FINANCE' | 'IT_SUPPORT' | 'ADMINISTRATOR';
    jobTitle: string;
    supervisorName: string;
    contractType: 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'TEMPORARY';
    startDate: string;
    endDate: string;
    highestQualification: string;
    specialization: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    teachingUnitsRequested?: string[];
    compensationBandConfidential?: string;
  };
  otherDetails?: {
    linkedStudentNumber?: string;
    linkedStudentName?: string;
    relationshipToStudent?: string;
    relationshipVerified?: boolean;
    graduationYear?: string;
    completedProgramme?: string;
    organizationName?: string;
    contractOrMouRef?: string;
    departmentSponsor?: string;
    accessExpiryDate?: string;
    hostStaffName?: string;
    visitPurpose?: string;
    visitorBadgeCode?: string;
  };
}

export interface ReviewDecisionInput {
  decision: 'UNDER_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  comment?: string;
  assignedRole?: string;
}

export interface ActivationConfirmInput {
  token: string;
  password: string;
}

export interface RoleAssignInput {
  assignedRole: string;
  assignedPermissions: string[];
}

export interface BulkImportRowInput {
  category: RegistrationCategory;
  fullName: string;
  email: string;
  phone: string;
  identificationNumber: string;
  campusId: string;
  departmentId?: string;
  programmeOrTitle?: string;
  proposedRole?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(val: unknown): string {
  return typeof val === 'string' ? val.trim() : '';
}

export function validateRegistrationCreate(
  body: unknown
): ValidationResult<RegistrationPayloadInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid registration payload.' };
  }
  const raw = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  const category = str(raw.category).toUpperCase() as RegistrationCategory;
  if (!REGISTRATION_CATEGORIES.includes(category)) {
    fieldErrors.category = 'Select a valid registration category.';
  }

  // Support both Phase 5 nested shape ({ personal, institution, student, staff, parent }) and wizard shape
  const personal = (raw.personal && typeof raw.personal === 'object'
    ? raw.personal
    : null) as Record<string, unknown> | null;
  const institution = (raw.institution && typeof raw.institution === 'object'
    ? raw.institution
    : null) as Record<string, unknown> | null;

  const fullName = personal
    ? str(personal.fullName) ||
      [str(personal.firstName), str(personal.middleName), str(personal.lastName)]
        .filter(Boolean)
        .join(' ')
    : str(raw.fullName);

  if (fullName.length < 3 || fullName.length > 120) {
    fieldErrors.fullName = 'Full name must be between 3 and 120 characters.';
  }

  const email = (personal ? str(personal.email) : str(raw.email)).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = 'Enter a valid institutional or personal email address.';
  }

  const phone = personal ? str(personal.phone) : str(raw.phone);
  if (phone.length < 7 || phone.length > 24) {
    fieldErrors.phone = 'Enter a valid mobile phone number.';
  }

  const identificationNumber = personal
    ? str(personal.identificationNumber) || str(personal.nationalId) || 'PENDING-ID'
    : str(raw.identificationNumber) || str(raw.nationalId);
  if (identificationNumber.length < 4 || identificationNumber.length > 32) {
    fieldErrors.identificationNumber =
      'Provide a valid National ID / Passport / Birth Certificate number.';
  }

  const campusId = (institution ? str(institution.campusId) : str(raw.campusId)) || 'cmp-nairobi';
  const departmentId = (institution ? str(institution.departmentId) : str(raw.departmentId)) || null;

  const odpcConsentAccepted =
    raw.odpcConsentAccepted === undefined ? Boolean(personal) : Boolean(raw.odpcConsentAccepted);
  if (!odpcConsentAccepted) {
    fieldErrors.odpcConsentAccepted = 'ODPC Data Protection disclosure acknowledgment is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: Object.values(fieldErrors)[0] ?? 'Please correct highlighted registration fields.',
      fieldErrors,
    };
  }

  const docsRaw = Array.isArray(raw.documents) ? raw.documents : [];
  const documents: RegistrationDocumentChecklistItem[] = [];
  for (const item of docsRaw) {
    if (item && typeof item === 'object') {
      const d = item as Record<string, unknown>;
      const fileName = str(d.fileName);
      const docType = str(d.docType);
      const mimeType = str(d.mimeType) || 'application/pdf';
      const sizeBytes = Number(d.sizeBytes) || 0;
      if (sizeBytes > 10 * 1024 * 1024) {
        return {
          ok: false,
          error: `Document ${fileName || docType} exceeds maximum allowed 10 MB limit.`,
        };
      }
      if (docType && fileName) {
        documents.push({
          docType,
          fileName,
          mimeType,
          sizeBytes,
          verified: Boolean(d.verified),
        });
      }
    }
  }

  const actionUpper = str(raw.action).toUpperCase();
  const submitImmediately =
    raw.submitImmediately !== undefined ? Boolean(raw.submitImmediately) : actionUpper === 'SUBMIT';

  // Normalize nested student/staff/parent blocks if supplied in Phase 5 or Manual Portal Registration shapes
  const nestedStudent =
    raw.student && typeof raw.student === 'object'
      ? (raw.student as Record<string, unknown>)
      : null;
  const nestedStaff =
    raw.staff && typeof raw.staff === 'object'
      ? (raw.staff as Record<string, unknown>)
      : null;
  const nestedParent =
    raw.parent && typeof raw.parent === 'object'
      ? (raw.parent as Record<string, unknown>)
      : null;
  const nestedOther =
    raw.other && typeof raw.other === 'object'
      ? (raw.other as Record<string, unknown>)
      : null;

  const instProgrammeId = institution ? str(institution.programmeId) : '';
  const instIntakeId = institution ? str(institution.intakeId) : '';

  const studentDetails = nestedStudent
    ? {
        programmeId: str(nestedStudent.programmeId) || instProgrammeId,
        programme: str(nestedStudent.programme) || str(nestedStudent.programmeId) || instProgrammeId,
        intakeId: str(nestedStudent.intakeId) || instIntakeId || 'int-sep-2026',
        intake: str(nestedStudent.intake) || str(nestedStudent.intakeId) || instIntakeId || 'September 2026 Intake',
        studyMode: (str(nestedStudent.studyMode).toUpperCase() || 'FULL_TIME') as
          | 'FULL_TIME'
          | 'PART_TIME'
          | 'EVENING'
          | 'ONLINE',
        previousInstitution: str(nestedStudent.previousInstitution) || 'Pending Verification',
        previousQualification: str(nestedStudent.previousQualification) || 'KCSE Certificate',
        previousGrade: str(nestedStudent.previousGrade) || 'Pending',
        guardianName: str(nestedStudent.guardianName) || 'Pending Guardian',
        guardianPhone: str(nestedStudent.guardianPhone) || phone,
        guardianEmail: str(nestedStudent.guardianEmail),
        guardianRelationship: str(nestedStudent.guardianRelationship) || 'Parent',
        feeCategory: (str(nestedStudent.feeCategory).toUpperCase() || 'SELF_SPONSORED') as
          | 'SELF_SPONSORED'
          | 'GOVERNMENT_KUCCPS'
          | 'HELB_LOAN'
          | 'SCHOLARSHIP'
          | 'CORPORATE',
        sponsorshipReference: str(nestedStudent.sponsorshipReference) || 'SELF',
      }
    : category === 'STUDENT' && instProgrammeId
    ? {
        programmeId: instProgrammeId,
        programme: str(institution?.programmeName) || instProgrammeId,
        intakeId: instIntakeId || 'int-sep-2026',
        intake: str(institution?.intakeName) || instIntakeId || 'September 2026 Intake',
        studyMode: 'FULL_TIME' as const,
        previousInstitution: 'Manual Portal Onboarding',
        previousQualification: 'Verified Entry Qualification',
        previousGrade: 'Pending Verification',
        guardianName: 'Pending Guardian Intake',
        guardianPhone: phone,
        guardianEmail: '',
        guardianRelationship: 'Parent',
        feeCategory: 'SELF_SPONSORED' as const,
        sponsorshipReference: 'MANUAL-REG',
      }
    : (raw.studentDetails as RegistrationPayloadInput['studentDetails']);

  const staffDetails = nestedStaff
    ? {
        employeeType: (str(nestedStaff.employeeType).toUpperCase() || 'NON_TEACHING') as
          | 'TEACHING'
          | 'NON_TEACHING'
          | 'LECTURER'
          | 'LIBRARIAN'
          | 'FINANCE'
          | 'IT_SUPPORT'
          | 'ADMINISTRATOR',
        jobTitle: str(nestedStaff.jobTitle),
        supervisorName: str(nestedStaff.supervisorName) || 'Department Head',
        contractType: (str(nestedStaff.employmentType || nestedStaff.contractType).toUpperCase() ||
          'FIXED_TERM') as 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP',
        startDate: str(nestedStaff.startDate) || new Date().toISOString().slice(0, 10),
        endDate: str(nestedStaff.endDate) || '',
        highestQualification: str(nestedStaff.highestQualification) || 'Verified Credential',
        specialization: str(nestedStaff.specialization) || 'General',
        emergencyContactName: str(nestedStaff.emergencyContactName) || 'Pending Contact',
        emergencyContactPhone: str(nestedStaff.emergencyContactPhone) || phone,
      }
    : (raw.staffDetails as RegistrationPayloadInput['staffDetails']);

  const otherDetails = nestedParent
    ? {
        linkedStudentNumber: str(nestedParent.studentId) || str(nestedParent.linkedStudentNumber),
        relationshipToStudent: str(nestedParent.relationship) || str(nestedParent.relationshipToStudent),
        relationshipVerified: false,
      }
    : nestedOther
    ? {
        organizationName: str(nestedOther.organizationName),
        contractOrMouRef: str(nestedOther.contractOrMouRef),
        departmentSponsor: str(nestedOther.departmentSponsor),
        accessExpiryDate: str(nestedOther.accessExpiryDate),
        hostStaffName: str(nestedOther.hostStaffName),
        visitPurpose: str(nestedOther.visitPurpose),
        graduationYear: str(nestedOther.graduationYear),
        completedProgramme: str(nestedOther.completedProgramme),
      }
    : (raw.otherDetails as RegistrationPayloadInput['otherDetails']);

  if (category === 'STUDENT' && !studentDetails && (submitImmediately || personal)) {
    return { ok: false, error: 'Student programme and academic details are required.' };
  }
  if (category === 'STAFF' && !staffDetails && (submitImmediately || personal)) {
    return { ok: false, error: 'Staff employment details are required.' };
  }
  if (category === 'PARENT' && !otherDetails && (submitImmediately || personal)) {
    return { ok: false, error: 'Parent relationship details are required.' };
  }

  if (category === 'STUDENT' && submitImmediately && studentDetails) {
    if (!studentDetails.programme || !studentDetails.intake) {
      return {
        ok: false,
        error: 'Submitted student registrations require programme and intake.',
      };
    }
  }

  if (category === 'STAFF' && submitImmediately && staffDetails) {
    if (!staffDetails.jobTitle || !staffDetails.startDate) {
      return {
        ok: false,
        error: 'Submitted staff registrations require job title and contract start date.',
      };
    }
  }

  if (category === 'PARENT' && submitImmediately && otherDetails) {
    if (!otherDetails.linkedStudentNumber || !otherDetails.relationshipToStudent) {
      return {
        ok: false,
        error: 'Parent/Guardian registration requires linked student ID/number and relationship.',
      };
    }
  }

  const idTypeRaw = str((personal ? personal.identificationType : undefined) ?? raw.identificationType).toUpperCase();
  const identificationType = (['NATIONAL_ID', 'PASSPORT', 'ALIEN_ID', 'BIRTH_CERT'].includes(
    idTypeRaw
  )
    ? idTypeRaw
    : 'NATIONAL_ID') as 'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT';

  return {
    ok: true,
    data: {
      category,
      subType: str(raw.subType) || category,
      submitImmediately,
      fullName,
      email,
      phone,
      gender: (personal ? str(personal.gender) : str(raw.gender)) || 'Prefer not to say',
      dateOfBirth: (personal ? str(personal.dateOfBirth) : str(raw.dateOfBirth)) || '2000-01-01',
      nationality: str(raw.nationality) || 'Kenyan',
      identificationType,
      identificationNumber,
      campusId,
      departmentId,
      proposedRole:
        str(institution?.role) || str(raw.proposedRole) || category,
      odpcConsentAccepted,
      documents,
      studentDetails,
      staffDetails,
      otherDetails,
    },
  };
}

export function validateReviewDecision(body: unknown): ValidationResult<ReviewDecisionInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid review payload.' };
  }
  const raw = body as Record<string, unknown>;
  const decision = str(raw.decision).toUpperCase() as ReviewDecisionInput['decision'];
  if (!['UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(decision)) {
    return { ok: false, error: 'Decision must be UNDER_REVIEW, APPROVED, CHANGES_REQUESTED, or REJECTED.' };
  }
  const comment = str(raw.comment);
  if ((decision === 'CHANGES_REQUESTED' || decision === 'REJECTED') && comment.length < 5) {
    return { ok: false, error: 'A clear reason/comment (at least 5 characters) is mandatory when requesting changes or rejecting.' };
  }
  return {
    ok: true,
    data: {
      decision,
      comment: comment || undefined,
      assignedRole: str(raw.assignedRole) || undefined,
    },
  };
}

export function validateActivationConfirm(body: unknown): ValidationResult<ActivationConfirmInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid activation payload.' };
  }
  const raw = body as Record<string, unknown>;
  const token = str(raw.token);
  const password = str(raw.password);
  if (token.length < 6) {
    return { ok: false, error: 'Valid activation token is required.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Initial password must be at least 8 characters long.' };
  }
  return { ok: true, data: { token, password } };
}

export function validatePublicActivationCheck(body: unknown): ValidationResult<{ token: string }> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid activation token request.' };
  }
  const token = str((body as Record<string, unknown>).token);
  if (token.length < 20) {
    return { ok: false, error: 'Invalid activation token format.' };
  }
  return { ok: true, data: { token } };
}

export function validatePublicActivationComplete(
  body: unknown
): ValidationResult<{ token: string; password: string }> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid activation payload.' };
  }
  const raw = body as Record<string, unknown>;
  const token = str(raw.token);
  const password = str(raw.password);
  const confirmPassword = str(raw.confirmPassword);

  if (token.length < 20) {
    return { ok: false, error: 'Invalid or incomplete activation token.' };
  }
  if (password.length < 12) {
    return { ok: false, error: 'Password must be at least 12 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: 'Password must include at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, error: 'Password must include at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: 'Password must include at least one number.' };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Passwords do not match.' };
  }

  return { ok: true, data: { token, password } };
}

export function validateRoleAssign(body: unknown): ValidationResult<RoleAssignInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid role assignment payload.' };
  }
  const raw = body as Record<string, unknown>;
  const assignedRole = str(raw.assignedRole).toUpperCase();
  if (!assignedRole) {
    return { ok: false, error: 'Target portal role is required.' };
  }
  const assignedPermissions = Array.isArray(raw.assignedPermissions)
    ? raw.assignedPermissions.map((p) => String(p).trim()).filter(Boolean)
    : [];
  return { ok: true, data: { assignedRole, assignedPermissions } };
}

export function validateStatusReason(body: unknown, label: string): ValidationResult<{ reason: string }> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: `Provide a ${label} reason.` };
  }
  const reason = str((body as Record<string, unknown>).reason);
  if (reason.length < 5) {
    return { ok: false, error: `${label} reason must be at least 5 characters.` };
  }
  return { ok: true, data: { reason } };
}

export function validateListFilters(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
  search: string;
  category: RegistrationCategory | 'ALL';
  status: RegistrationStatus | 'ALL';
  campusId?: string;
  departmentId?: string;
} {
  const pageNum = Number(query.page);
  const pageSizeNum = Number(query.pageSize);
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? Math.floor(pageNum) : 1;
  const pageSize =
    Number.isFinite(pageSizeNum) && pageSizeNum >= 1 && pageSizeNum <= 100
      ? Math.floor(pageSizeNum)
      : 50;

  const search = str(query.search).toLowerCase();
  const catRaw = str(query.category).toUpperCase();
  const category = REGISTRATION_CATEGORIES.includes(catRaw as RegistrationCategory)
    ? (catRaw as RegistrationCategory)
    : 'ALL';
  const validStatuses: RegistrationStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'INVITED',
    'ACTIVATED',
    'REJECTED',
    'SUSPENDED',
    'ARCHIVED',
  ];
  const stRaw = str(query.status).toUpperCase();
  const status = validStatuses.includes(stRaw as RegistrationStatus)
    ? (stRaw as RegistrationStatus)
    : 'ALL';
  const campusId = str(query.campusId) || undefined;
  const departmentId = str(query.departmentId) || undefined;
  return { page, pageSize, search, category, status, campusId, departmentId };
}

export function validateCommentBody(body: unknown, required: boolean): ValidationResult<{ comments: string }> {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const comments = str(raw.comments ?? raw.comment);
  if (required && comments.length < 5) {
    return {
      ok: false,
      error: 'Comments (at least 5 characters) are required for rejection or correction requests.',
    };
  }
  return { ok: true, data: { comments } };
}

export function parseCsvRows(csvText: string): {
  ok: boolean;
  error?: string;
  rows: BulkImportRowInput[];
  rowErrors: { rowNumber: number; error: string; raw: string }[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return {
      ok: false,
      error: 'CSV must contain a header row and at least one registration row.',
      rows: [],
      rowErrors: [],
    };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idxOf = (names: string[]) => headers.findIndex((h) => names.includes(h));

  const catIdx = idxOf(['category', 'user_category', 'usercategory']);
  const nameIdx = idxOf(['fullname', 'full_name', 'name']);
  const emailIdx = idxOf(['email']);
  const phoneIdx = idxOf(['phone', 'mobile']);
  const idIdx = idxOf(['identificationnumber', 'id_number', 'identification_number', 'national_id', 'idnumber']);
  const campusIdx = idxOf(['campusid', 'campus_id', 'campus']);
  const deptIdx = idxOf(['departmentid', 'department_id', 'department']);
  const progIdx = idxOf(['programmeortitle', 'programme', 'job_title', 'jobtitle', 'programme_or_title']);
  const roleIdx = idxOf(['proposedrole', 'proposed_role', 'role']);

  if (nameIdx === -1 || emailIdx === -1 || phoneIdx === -1 || idIdx === -1) {
    return {
      ok: false,
      error: 'CSV header must include fullName, email, phone, and identificationNumber columns.',
      rows: [],
      rowErrors: [],
    };
  }

  const rows: BulkImportRowInput[] = [];
  const rowErrors: { rowNumber: number; error: string; raw: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const cat = ((catIdx >= 0 ? cols[catIdx] : 'STUDENT') || 'STUDENT').toUpperCase() as RegistrationCategory;
    const fullName = cols[nameIdx] ?? '';
    const email = (cols[emailIdx] ?? '').toLowerCase();
    const phone = cols[phoneIdx] ?? '';
    const identificationNumber = cols[idIdx] ?? '';
    const campusId = (campusIdx >= 0 ? cols[campusIdx] : 'cmp-nairobi') || 'cmp-nairobi';

    if (!REGISTRATION_CATEGORIES.includes(cat)) {
      rowErrors.push({ rowNumber: i + 1, error: `Invalid category "${cat}"`, raw: lines[i] });
      continue;
    }
    if (fullName.length < 3) {
      rowErrors.push({ rowNumber: i + 1, error: 'Full name too short', raw: lines[i] });
      continue;
    }
    if (!EMAIL_REGEX.test(email)) {
      rowErrors.push({ rowNumber: i + 1, error: 'Invalid email address', raw: lines[i] });
      continue;
    }
    if (identificationNumber.length < 4) {
      rowErrors.push({ rowNumber: i + 1, error: 'Invalid identification number', raw: lines[i] });
      continue;
    }

    rows.push({
      category: cat,
      fullName,
      email,
      phone: phone || '+254700000000',
      identificationNumber,
      campusId,
      departmentId: deptIdx >= 0 ? cols[deptIdx] || undefined : undefined,
      programmeOrTitle: progIdx >= 0 ? cols[progIdx] || undefined : undefined,
      proposedRole: roleIdx >= 0 ? cols[roleIdx] || undefined : undefined,
    });
  }

  return { ok: true, rows, rowErrors };
}
