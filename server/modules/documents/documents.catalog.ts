import type { DocumentConfidentiality } from '../../data/store.ts';
import type { StaffRoleCode } from '../staff/staff.permissions.ts';

export type DmsModuleKey =
  | 'STUDENT'
  | 'LECTURER'
  | 'EXAMINATION'
  | 'ADMISSIONS_REGISTRAR'
  | 'FINANCE'
  | 'HR'
  | 'ADMIN_GOVERNANCE'
  | 'LIBRARY'
  | 'EVENTS';

export interface DocumentCategoryConfig {
  code: string;
  slug: string;
  name: string;
  moduleKey: DmsModuleKey;
  description: string;
  allowedMimeTypes: string[];
  maxSizeMb: number;
  defaultConfidentiality: DocumentConfidentiality;
  approvalRequired: boolean;
  isUnpublishedExamProtected: boolean;
  studentUploadAllowed: boolean;
  retentionDays: number;
  odpcBasis: string;
  active: boolean;
}

const STANDARD_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

const MEDIA_ARCHIVE_MIMES = [
  ...STANDARD_DOC_MIMES,
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
];

export const INITIAL_DOCUMENT_CATEGORIES: DocumentCategoryConfig[] = [
  // ── Core / Legacy Institutional Categories (Preserved for Backwards Compatibility) ──
  {
    code: 'ADMISSION_LETTER',
    slug: 'admissions',
    name: 'Admission Documents & Offer Letters',
    moduleKey: 'ADMISSIONS_REGISTRAR',
    description: 'KCSE certificates, result slips, ID/birth certificate, passport photos, and offer letters.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 3650,
    odpcBasis: 'Kenya Data Protection Act (2019) — Academic Admissions & Statutory Enrolment Record',
    active: true,
  },
  {
    code: 'TRANSCRIPT_CERTIFICATE',
    slug: 'certificates',
    name: 'Academic Records, Transcripts & Certificates',
    moduleKey: 'ADMISSIONS_REGISTRAR',
    description: 'Previous transcripts, academic evidence, official transcripts, and conferment certificates.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 36500, // Permanent institutional academic record
    odpcBasis: 'TVETA / KNEC / CUE Permanent Academic Credential Archive',
    active: true,
  },
  {
    code: 'FEE_STATEMENT',
    slug: 'finance',
    name: 'Fee Statements & Payment Evidence',
    moduleKey: 'FINANCE',
    description: 'Bank deposit slips, M-Pesa payment evidence, fee statements, invoices, and official receipts.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 2555,
    odpcBasis: 'Public Finance & Tax Audit Retention Mandate (7 Years)',
    active: true,
  },
  {
    code: 'EXAM_SCHEDULE',
    slug: 'examinations',
    name: 'Examination Papers, Schedules & Assessment Files',
    moduleKey: 'EXAMINATION',
    description: 'Examination schedules, question papers, marking schemes, moderation reports, and exam incidents.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 15,
    defaultConfidentiality: 'RESTRICTED',
    approvalRequired: true,
    isUnpublishedExamProtected: true,
    studentUploadAllowed: false,
    retentionDays: 2555,
    odpcBasis: 'Examination Integrity & KNEC/TVET CDACC Assessment Custody',
    active: true,
  },
  {
    code: 'EMPLOYMENT_CONTRACT',
    slug: 'hr',
    name: 'Staff HR Files, CVs & Employment Contracts',
    moduleKey: 'HR',
    description: 'Staff CVs, national IDs, certificates, contracts, appointment letters, leave/medical attachments, and appraisals.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 3650,
    odpcBasis: 'Kenya Employment Act & ODPC Confidential Personnel Record',
    active: true,
  },
  {
    code: 'INSTITUTIONAL_POLICY',
    slug: 'policies-forms',
    name: 'Institutional Policies, Circulars & Compliance',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'College policies, strategic plans, TVETA compliance dossiers, inspection reports, and circulars.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 15,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 3650,
    odpcBasis: 'Institutional Governance & Regulatory Compliance',
    active: true,
  },
  {
    code: 'OFFICIAL_MEMO',
    slug: 'administration',
    name: 'Official Memos & Administrative Records',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'Internal memos, meeting agendas & minutes, operational correspondence, and general circulars.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 2555,
    odpcBasis: 'Institutional Administrative Governance Archive',
    active: true,
  },
  {
    code: 'STUDENT_WELFARE_CONFIDENTIAL',
    slug: 'hostel-welfare',
    name: 'Counselling, Medical & Student Welfare (Restricted)',
    moduleKey: 'STUDENT',
    description: 'Confidential counselling referral records, welfare cases, medical notes, and hostel allocations.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'RESTRICTED',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 2555,
    odpcBasis: 'ODPC Sensitive Personal Health & Welfare Data Safeguard',
    active: true,
  },

  // ── Granular Student Module Categories ──
  {
    code: 'STUDENT_REGISTRATION_RECORD',
    slug: 'student-records',
    name: 'Student Registration & Clearance Records',
    moduleKey: 'STUDENT',
    description: 'Signed registration forms, transfer/deferral/withdrawal forms, graduation clearance, and student complaints evidence.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 3650,
    odpcBasis: 'Academic Registry Student Lifecycle Record',
    active: true,
  },
  {
    code: 'ABSENCE_EXPLANATION',
    slug: 'absence-explanations',
    name: 'Student Absence & Medical Evidence',
    moduleKey: 'STUDENT',
    description: 'Student absence explanation letters, doctor/clinic medical notes, and supporting evidence linked to attendance.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'RESTRICTED',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 1825,
    odpcBasis: 'Attendance Accountability & ODPC Sensitive Medical Safeguard',
    active: true,
  },
  {
    code: 'ASSIGNMENT_SUBMISSION',
    slug: 'student-submissions',
    name: 'Assignments & Coursework Submissions',
    moduleKey: 'STUDENT',
    description: 'Student written assignments, Word/PDF/PPTX/Excel submissions, and special exam evidence.',
    allowedMimeTypes: MEDIA_ARCHIVE_MIMES,
    maxSizeMb: 20,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 1825,
    odpcBasis: 'Academic Assessment & Internal Verification Evidence',
    active: true,
  },
  {
    code: 'PRACTICAL_PROJECT_FILE',
    slug: 'practical-projects',
    name: 'Practical Assessments & Project Files',
    moduleKey: 'STUDENT',
    description: 'Project archives (ZIP), source code, screenshots, demonstration videos (MP4), and lab reports.',
    allowedMimeTypes: MEDIA_ARCHIVE_MIMES,
    maxSizeMb: 25,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 1825,
    odpcBasis: 'TVET CDACC Practical Portfolio of Evidence (POE)',
    active: true,
  },
  {
    code: 'INDUSTRIAL_ATTACHMENT_DOC',
    slug: 'industrial-attachment',
    name: 'Industrial Attachment & Logbooks',
    moduleKey: 'STUDENT',
    description: 'Introduction letters, weekly logbooks, supervisor assessment forms, and employer evaluation reports.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 15,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 2555,
    odpcBasis: 'TVETA Mandatory Industrial Attachment Assessment Archive',
    active: true,
  },
  {
    code: 'SCHOLARSHIP_BURSARY_DOC',
    slug: 'scholarship',
    name: 'Scholarship, Bursary & Refund Supporting Docs',
    moduleKey: 'FINANCE',
    description: 'HELB/CDF/county bursary award letters, sponsorship letters, and fee refund evidence.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    retentionDays: 2555,
    odpcBasis: 'Student Financial Aid & Audit Trail Compliance',
    active: true,
  },

  // ── Granular Lecturer / Teaching Categories ──
  {
    code: 'LESSON_PLAN',
    slug: 'lesson-plans',
    name: 'Lesson Plans',
    moduleKey: 'LECTURER',
    description: 'Session-level lesson plans tied to unit timetable and course outline.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 1825,
    odpcBasis: 'TVET Academic Quality & Teaching Delivery Compliance',
    active: true,
  },
  {
    code: 'SCHEME_OF_WORK',
    slug: 'schemes-of-work',
    name: 'Schemes of Work',
    moduleKey: 'LECTURER',
    description: 'Term/semester schemes of work prepared before course delivery.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 1825,
    odpcBasis: 'Curriculum Planning & HOD Verification Archive',
    active: true,
  },
  {
    code: 'RECORD_OF_WORK',
    slug: 'records-of-work',
    name: 'Records of Work Covered',
    moduleKey: 'LECTURER',
    description: 'Daily and weekly teaching delivery records linked directly to timetable & attendance.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 1825,
    odpcBasis: 'Lecturer Accountability & Contact Hour Audit',
    active: true,
  },
  {
    code: 'LEARNING_MATERIAL',
    slug: 'teaching-notes',
    name: 'Teaching Notes, Handouts & Presentations',
    moduleKey: 'LECTURER',
    description: 'Lecture notes, handouts, slides, and approved student reading materials.',
    allowedMimeTypes: MEDIA_ARCHIVE_MIMES,
    maxSizeMb: 25,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 1825,
    odpcBasis: 'Instructional Content Repository',
    active: true,
  },
  {
    code: 'ATTENDANCE_REGISTER_DOC',
    slug: 'attendance',
    name: 'Class Attendance Sheets & Logs',
    moduleKey: 'LECTURER',
    description: 'Signed class attendance sheets and practical lab sign-in registers.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 2555,
    odpcBasis: '75% Examination Eligibility Audit Evidence',
    active: true,
  },
  {
    code: 'ACADEMIC_CLASS_RESOURCE',
    slug: 'academics',
    name: 'Class Activities, CATs & Marked Scripts',
    moduleKey: 'LECTURER',
    description: 'Exercises, CAT briefs, marking rubrics, and assessed candidate scripts.',
    allowedMimeTypes: MEDIA_ARCHIVE_MIMES,
    maxSizeMb: 20,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 2555,
    odpcBasis: 'Continuous Assessment & Moderation Record',
    active: true,
  },

  // ── Granular Admin / HOD / Principal Governance ──
  {
    code: 'DEPARTMENT_REPORT',
    slug: 'department-reports',
    name: 'Departmental Teaching & Performance Reports',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'Weekly/monthly departmental teaching reports, HOD moderation summaries, and performance analyses.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 15,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 2555,
    odpcBasis: 'Departmental & Academic Board Governance',
    active: true,
  },
  {
    code: 'MEETING_MINUTES',
    slug: 'meeting-minutes',
    name: 'Staff & Senate Meeting Agendas and Minutes',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'Departmental meetings, academic board, and management committee agendas & signed minutes.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 3650,
    odpcBasis: 'Official Institutional Decision Record',
    active: true,
  },
  {
    code: 'INSTITUTIONAL_REPORT',
    slug: 'institutional-reports',
    name: 'Institutional, TVETA & Accreditation Reports',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'TVETA compliance filings, KNEC/KASNEB correspondence, annual institutional & audit reports.',
    allowedMimeTypes: STANDARD_DOC_MIMES,
    maxSizeMb: 20,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 3650,
    odpcBasis: 'Regulatory Accreditation & Statutory Inspection Archive',
    active: true,
  },

  // ── Library & Digital E-Learning ──
  {
    code: 'LIBRARY_DIGITAL_RESOURCE',
    slug: 'library',
    name: 'Library E-Books, Research & Manuals',
    moduleKey: 'LIBRARY',
    description: 'E-books, reference papers, course manuals, learning videos (MP4), and audio materials (MP3/WAV).',
    allowedMimeTypes: MEDIA_ARCHIVE_MIMES,
    maxSizeMb: 25,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 3650,
    odpcBasis: 'Copyright-Compliant Institutional Digital Repository',
    active: true,
  },

  // ── Events & Corporate Communications ──
  {
    code: 'EVENT_MEDIA_PROGRAMME',
    slug: 'events',
    name: 'Events, Posters, Programmes & Participation Certificates',
    moduleKey: 'EVENTS',
    description: 'Event posters, programmes, attendance rosters, newsletters, event photos, and participation certificates.',
    allowedMimeTypes: MEDIA_ARCHIVE_MIMES,
    maxSizeMb: 20,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 1825,
    odpcBasis: 'Campus Events & Stakeholder Communications Archive',
    active: true,
  },
  {
    code: 'WEBSITE_MEDIA_ASSET',
    slug: 'website-media',
    name: 'Public Announcements & Website Media',
    moduleKey: 'EVENTS',
    description: 'Published announcements, prospectus brochures, newsletters, and public media assets.',
    allowedMimeTypes: MEDIA_ARCHIVE_MIMES,
    maxSizeMb: 15,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    retentionDays: 1825,
    odpcBasis: 'Public Institutional Communications Registry',
    active: true,
  },
];

const SLUG_TO_CODE = new Map<string, string>();
const CODE_TO_CONFIG = new Map<string, DocumentCategoryConfig>();
for (const cat of INITIAL_DOCUMENT_CATEGORIES) {
  CODE_TO_CONFIG.set(cat.code, cat);
  SLUG_TO_CODE.set(cat.slug, cat.code);
  SLUG_TO_CODE.set(cat.code.toLowerCase(), cat.code);
}

// Explicit synonym aliases
SLUG_TO_CODE.set('other', 'OFFICIAL_MEMO');
SLUG_TO_CODE.set('examination_paper', 'EXAM_SCHEDULE');
SLUG_TO_CODE.set('marking_scheme', 'EXAM_SCHEDULE');
SLUG_TO_CODE.set('moderation_report', 'DEPARTMENT_REPORT');
SLUG_TO_CODE.set('supplier_invoice', 'FEE_STATEMENT');
SLUG_TO_CODE.set('leave_medical', 'EMPLOYMENT_CONTRACT');
SLUG_TO_CODE.set('graduation_clearance', 'STUDENT_REGISTRATION_RECORD');
SLUG_TO_CODE.set('complaint_evidence', 'STUDENT_REGISTRATION_RECORD');

export function normalizeDocumentCategoryCode(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (CODE_TO_CONFIG.has(trimmed)) return trimmed;
  const upper = trimmed.toUpperCase();
  if (CODE_TO_CONFIG.has(upper)) return upper;
  const lower = trimmed.toLowerCase();
  return SLUG_TO_CODE.get(lower) ?? null;
}

export function getDocumentCategoryConfig(
  raw: string | undefined | null,
  customCategories?: DocumentCategoryConfig[]
): DocumentCategoryConfig | undefined {
  const normalized = normalizeDocumentCategoryCode(raw) ?? String(raw ?? '').trim().toUpperCase();
  if (customCategories) {
    const match = customCategories.find(
      (c) => c.code === normalized || c.slug === String(raw ?? '').trim().toLowerCase()
    );
    if (match) return match;
  }
  return CODE_TO_CONFIG.get(normalized);
}

export function isKnownDocumentCategory(raw: string): boolean {
  return normalizeDocumentCategoryCode(raw) !== null;
}

export function canStudentUploadDocumentCategory(raw: string): boolean {
  const cfg = getDocumentCategoryConfig(raw);
  return Boolean(cfg?.studentUploadAllowed);
}

export function isStaffDocumentRole(role: string): boolean {
  const upper = role.toUpperCase();
  return !['STUDENT', 'PARENT', 'GUEST', 'ALUMNI'].includes(upper);
}

const MANAGED_SLUGS_BY_ROLE: Partial<Record<StaffRoleCode, readonly string[]>> = {
  ADMIN: INITIAL_DOCUMENT_CATEGORIES.map((c) => c.slug),
  PRINCIPAL: INITIAL_DOCUMENT_CATEGORIES.map((c) => c.slug),
  REGISTRAR: [
    'admissions',
    'student-records',
    'academics',
    'certificates',
    'policies-forms',
    'student-submissions',
    'scholarship',
    'examinations',
    'attendance',
    'industrial-attachment',
    'administration',
    'absence-explanations',
    'department-reports',
    'meeting-minutes',
    'institutional-reports',
  ],
  QUALITY_ASSURANCE: [
    'administration',
    'department-reports',
    'institutional-reports',
    'policies-forms',
    'academics',
    'attendance',
    'examinations',
    'meeting-minutes',
  ],
  FINANCE_OFFICER: ['finance', 'scholarship'],
  HR: ['hr', 'meeting-minutes'],
  HOD: [
    'academics',
    'student-submissions',
    'lesson-plans',
    'schemes-of-work',
    'records-of-work',
    'teaching-notes',
    'attendance',
    'practical-projects',
    'industrial-attachment',
    'absence-explanations',
    'department-reports',
    'meeting-minutes',
    'examinations',
  ],
  LECTURER: [
    'academics',
    'student-submissions',
    'lesson-plans',
    'schemes-of-work',
    'records-of-work',
    'teaching-notes',
    'attendance',
    'practical-projects',
    'industrial-attachment',
    'absence-explanations',
    'examinations',
  ],
  EXAMINATIONS_OFFICER: [
    'examinations',
    'academics',
    'practical-projects',
    'department-reports',
    'certificates',
  ],
  ADMISSIONS_OFFICER: ['admissions', 'student-records', 'certificates'],
  LIBRARIAN: ['library', 'website-media', 'policies-forms', 'teaching-notes'],
  HOSTEL_OFFICER: ['hostel-welfare', 'student-records'],
  STUDENT_AFFAIRS: [
    'hostel-welfare',
    'student-records',
    'student-submissions',
    'events',
    'scholarship',
    'absence-explanations',
  ],
  COMMUNICATIONS_OFFICER: ['events', 'website-media', 'policies-forms', 'administration'],
};

export function managedDocumentCategories(role: StaffRoleCode): string[] {
  return [...(MANAGED_SLUGS_BY_ROLE[role] ?? ['administration'])];
}

export function canManageDocumentCategory(role: StaffRoleCode, rawCategory: string): boolean {
  const cfg = getDocumentCategoryConfig(rawCategory);
  if (!cfg) return false;
  return managedDocumentCategories(role).includes(cfg.slug);
}

export function isDocumentPolicyAllowedForCategory(
  rawCategory: string,
  confidentiality: DocumentConfidentiality
): boolean {
  const cfg = getDocumentCategoryConfig(rawCategory);
  if (!cfg) return false;
  // Unpublished exam papers & restricted health/counselling records must NEVER be set PUBLIC
  if (cfg.isUnpublishedExamProtected && confidentiality === 'PUBLIC') {
    return false;
  }
  if (
    (cfg.code === 'STUDENT_WELFARE_CONFIDENTIAL' ||
      cfg.code === 'ABSENCE_EXPLANATION' ||
      cfg.code === 'EMPLOYMENT_CONTRACT') &&
    confidentiality === 'PUBLIC'
  ) {
    return false;
  }
  return true;
}
