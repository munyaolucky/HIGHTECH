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

export type DocumentCategory =
  | 'ADMISSION_LETTER'
  | 'TRANSCRIPT_CERTIFICATE'
  | 'FEE_STATEMENT'
  | 'EXAM_SCHEDULE'
  | 'EMPLOYMENT_CONTRACT'
  | 'INSTITUTIONAL_POLICY'
  | 'OFFICIAL_MEMO'
  | 'STUDENT_WELFARE_CONFIDENTIAL'
  | 'STUDENT_REGISTRATION_RECORD'
  | 'ABSENCE_EXPLANATION'
  | 'ASSIGNMENT_SUBMISSION'
  | 'PRACTICAL_PROJECT_FILE'
  | 'INDUSTRIAL_ATTACHMENT_DOC'
  | 'SCHOLARSHIP_BURSARY_DOC'
  | 'LESSON_PLAN'
  | 'SCHEME_OF_WORK'
  | 'RECORD_OF_WORK'
  | 'LEARNING_MATERIAL'
  | 'ATTENDANCE_REGISTER_DOC'
  | 'ACADEMIC_CLASS_RESOURCE'
  | 'DEPARTMENT_REPORT'
  | 'MEETING_MINUTES'
  | 'INSTITUTIONAL_REPORT'
  | 'LIBRARY_DIGITAL_RESOURCE'
  | 'EVENT_MEDIA_PROGRAMME'
  | 'WEBSITE_MEDIA_ASSET';

export type DocumentConfidentiality = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface DmsCategoryMeta {
  code: DocumentCategory;
  slug: string;
  name: string;
  moduleKey: DmsModuleKey;
  description: string;
  maxSizeMb: number;
  defaultConfidentiality: DocumentConfidentiality;
  approvalRequired: boolean;
  isUnpublishedExamProtected: boolean;
  studentUploadAllowed: boolean;
  acceptedExtensions: string;
}

const STANDARD_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt';
const MEDIA_ARCHIVE_EXTENSIONS = `${STANDARD_EXTENSIONS},.zip,.mp4,.mp3,.wav`;

export const DMS_CATEGORY_CATALOG: DmsCategoryMeta[] = [
  {
    code: 'ADMISSION_LETTER',
    slug: 'admissions',
    name: 'Admission Documents & Offer Letters',
    moduleKey: 'ADMISSIONS_REGISTRAR',
    description: 'KCSE certificates, result slips, ID/birth certificate, passport photos, and offer letters.',
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'TRANSCRIPT_CERTIFICATE',
    slug: 'certificates',
    name: 'Academic Records, Transcripts & Certificates',
    moduleKey: 'ADMISSIONS_REGISTRAR',
    description: 'Previous transcripts, academic evidence, official transcripts, and conferment certificates.',
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'STUDENT_REGISTRATION_RECORD',
    slug: 'student-records',
    name: 'Student Registration & Clearance Records',
    moduleKey: 'STUDENT',
    description: 'Signed registration forms, transfer/deferral/withdrawal forms, graduation clearance, and complaints evidence.',
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'FEE_STATEMENT',
    slug: 'finance',
    name: 'Fee Statements & Payment Evidence',
    moduleKey: 'FINANCE',
    description: 'Bank deposit slips, M-Pesa payment evidence, fee statements, invoices, and official receipts.',
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'SCHOLARSHIP_BURSARY_DOC',
    slug: 'scholarship',
    name: 'Scholarship, Bursary & Refund Supporting Docs',
    moduleKey: 'FINANCE',
    description: 'HELB/CDF/county bursary award letters, sponsorship letters, and fee refund evidence.',
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'ABSENCE_EXPLANATION',
    slug: 'absence-explanations',
    name: 'Student Absence & Medical Evidence',
    moduleKey: 'STUDENT',
    description: 'Absence explanation letters, doctor/clinic medical notes, and supporting evidence linked to attendance.',
    maxSizeMb: 10,
    defaultConfidentiality: 'RESTRICTED',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'ASSIGNMENT_SUBMISSION',
    slug: 'student-submissions',
    name: 'Assignments & Coursework Submissions',
    moduleKey: 'STUDENT',
    description: 'Written assignments, Word/PDF/PPTX/Excel submissions, and special exam consideration evidence.',
    maxSizeMb: 20,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: MEDIA_ARCHIVE_EXTENSIONS,
  },
  {
    code: 'PRACTICAL_PROJECT_FILE',
    slug: 'practical-projects',
    name: 'Practical Assessments & Project Files',
    moduleKey: 'STUDENT',
    description: 'Project archives (ZIP), source code, screenshots, demonstration videos (MP4), and lab reports.',
    maxSizeMb: 25,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: MEDIA_ARCHIVE_EXTENSIONS,
  },
  {
    code: 'INDUSTRIAL_ATTACHMENT_DOC',
    slug: 'industrial-attachment',
    name: 'Industrial Attachment & Logbooks',
    moduleKey: 'STUDENT',
    description: 'Introduction letters, weekly logbooks, supervisor assessment forms, and employer evaluation reports.',
    maxSizeMb: 15,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'STUDENT_WELFARE_CONFIDENTIAL',
    slug: 'hostel-welfare',
    name: 'Counselling, Medical & Student Welfare (Restricted)',
    moduleKey: 'STUDENT',
    description: 'Confidential counselling referral records, welfare cases, medical notes, and hostel allocations.',
    maxSizeMb: 10,
    defaultConfidentiality: 'RESTRICTED',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: true,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'LESSON_PLAN',
    slug: 'lesson-plans',
    name: 'Lesson Plans',
    moduleKey: 'LECTURER',
    description: 'Session-level lesson plans tied to unit timetable and course outline.',
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'SCHEME_OF_WORK',
    slug: 'schemes-of-work',
    name: 'Schemes of Work',
    moduleKey: 'LECTURER',
    description: 'Term/semester schemes of work prepared before course delivery.',
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'RECORD_OF_WORK',
    slug: 'records-of-work',
    name: 'Records of Work Covered',
    moduleKey: 'LECTURER',
    description: 'Daily and weekly teaching delivery records linked directly to timetable & attendance.',
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'LEARNING_MATERIAL',
    slug: 'teaching-notes',
    name: 'Teaching Notes, Handouts & Presentations',
    moduleKey: 'LECTURER',
    description: 'Lecture notes, handouts, slides, and approved student reading materials.',
    maxSizeMb: 25,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: MEDIA_ARCHIVE_EXTENSIONS,
  },
  {
    code: 'ATTENDANCE_REGISTER_DOC',
    slug: 'attendance',
    name: 'Class Attendance Sheets & Logs',
    moduleKey: 'LECTURER',
    description: 'Signed class attendance sheets and practical lab sign-in registers.',
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'ACADEMIC_CLASS_RESOURCE',
    slug: 'academics',
    name: 'Class Activities, CATs & Marked Scripts',
    moduleKey: 'LECTURER',
    description: 'Exercises, CAT briefs, marking rubrics, and assessed candidate scripts.',
    maxSizeMb: 20,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: MEDIA_ARCHIVE_EXTENSIONS,
  },
  {
    code: 'EXAM_SCHEDULE',
    slug: 'examinations',
    name: 'Examination Papers, Schedules & Assessment Files',
    moduleKey: 'EXAMINATION',
    description: 'Examination timetables, question papers, marking schemes, and moderation records.',
    maxSizeMb: 15,
    defaultConfidentiality: 'RESTRICTED',
    approvalRequired: true,
    isUnpublishedExamProtected: true,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'EMPLOYMENT_CONTRACT',
    slug: 'hr',
    name: 'Staff HR Files, CVs & Employment Contracts',
    moduleKey: 'HR',
    description: 'Staff CVs, national IDs, certificates, contracts, appointment letters, leave attachments, and appraisals.',
    maxSizeMb: 10,
    defaultConfidentiality: 'CONFIDENTIAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'INSTITUTIONAL_POLICY',
    slug: 'policies-forms',
    name: 'Institutional Policies, Circulars & Compliance',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'College policies, strategic plans, TVETA compliance dossiers, inspection reports, and circulars.',
    maxSizeMb: 15,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'OFFICIAL_MEMO',
    slug: 'administration',
    name: 'Official Memos & Administrative Records',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'Internal memos, operational correspondence, and administrative directives.',
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'DEPARTMENT_REPORT',
    slug: 'department-reports',
    name: 'Departmental Teaching & Performance Reports',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'Weekly/monthly departmental teaching reports, HOD moderation summaries, and performance analyses.',
    maxSizeMb: 15,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'MEETING_MINUTES',
    slug: 'meeting-minutes',
    name: 'Staff & Senate Meeting Agendas and Minutes',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'Departmental meetings, academic board, and management committee agendas & signed minutes.',
    maxSizeMb: 10,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'INSTITUTIONAL_REPORT',
    slug: 'institutional-reports',
    name: 'Institutional, TVETA & Accreditation Reports',
    moduleKey: 'ADMIN_GOVERNANCE',
    description: 'TVETA compliance filings, KNEC/KASNEB correspondence, annual institutional & audit reports.',
    maxSizeMb: 20,
    defaultConfidentiality: 'INTERNAL',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: STANDARD_EXTENSIONS,
  },
  {
    code: 'LIBRARY_DIGITAL_RESOURCE',
    slug: 'library',
    name: 'Library E-Books, Research & Manuals',
    moduleKey: 'LIBRARY',
    description: 'E-books, reference papers, course manuals, learning videos (MP4), and audio materials (MP3/WAV).',
    maxSizeMb: 25,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: MEDIA_ARCHIVE_EXTENSIONS,
  },
  {
    code: 'EVENT_MEDIA_PROGRAMME',
    slug: 'events',
    name: 'Events, Posters, Programmes & Certificates',
    moduleKey: 'EVENTS',
    description: 'Event posters, programmes, attendance rosters, newsletters, event photos, and participation certificates.',
    maxSizeMb: 20,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: false,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: MEDIA_ARCHIVE_EXTENSIONS,
  },
  {
    code: 'WEBSITE_MEDIA_ASSET',
    slug: 'website-media',
    name: 'Public Announcements & Website Media',
    moduleKey: 'EVENTS',
    description: 'Published announcements, prospectus brochures, newsletters, and public media assets.',
    maxSizeMb: 15,
    defaultConfidentiality: 'PUBLIC',
    approvalRequired: true,
    isUnpublishedExamProtected: false,
    studentUploadAllowed: false,
    acceptedExtensions: MEDIA_ARCHIVE_EXTENSIONS,
  },
];

export function getDmsCategoryMeta(codeOrSlug: string): DmsCategoryMeta | undefined {
  const clean = codeOrSlug.trim();
  return DMS_CATEGORY_CATALOG.find(
    (c) => c.code === clean || c.slug === clean.toLowerCase()
  );
}

export function getCategoriesForModule(
  moduleKey?: DmsModuleKey | 'ALL',
  isStudent = false,
  allowedCategories?: DocumentCategory[]
): DmsCategoryMeta[] {
  return DMS_CATEGORY_CATALOG.filter((cat) => {
    if (isStudent && !cat.studentUploadAllowed) return false;
    if (allowedCategories && allowedCategories.length > 0) {
      return allowedCategories.includes(cat.code);
    }
    if (!moduleKey || moduleKey === 'ALL') return true;
    return cat.moduleKey === moduleKey;
  });
}

export function formatBytesCompact(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
