export type WebsiteContentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'ARCHIVED';

export const WEBSITE_STAFF_CATEGORIES = [
  'College leadership',
  "Principal's office",
  'Deputy Principal',
  'Registrar',
  'Heads of Departments',
  'Lecturers and trainers',
  'ICT and technical support',
  'Finance and administration',
  'Human Resource',
  'Library staff',
  'Student affairs and welfare',
  'Admissions and marketing',
  'Quality assurance',
  'Examination and certification office',
  'Support and maintenance staff',
] as const;

export type WebsiteStaffCategory = (typeof WEBSITE_STAFF_CATEGORIES)[number];

export interface WebsiteStaffProfileRecord {
  id: string;
  slug: string;
  fullName: string;
  titlePrefix: string | null;
  officialTitle: string;
  positionTitle: string;
  designation: string;
  category: WebsiteStaffCategory;
  primaryDepartmentId: string | null;
  secondaryDepartmentIds: string[];
  photoUrl: string | null;
  biography: string;
  academicQualifications: string[];
  professionalCertifications: string[];
  specializations: string[];
  subjectsTaught: string[];
  publicEmail: string | null;
  officeLocation: string | null;
  officeHours: string | null;
  linkedinUrl: string | null;
  featured: boolean;
  displayOrder: number;
  showOnPublicWebsite: boolean;
  status: WebsiteContentStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedById: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  // STRICTLY CONFIDENTIAL INTERNAL HR FIELDS — NEVER EXPOSED BY PUBLIC API
  privatePhone?: string;
  personalAddress?: string;
  employmentContractType?: string;
  salaryBandConfidential?: string;
}

export interface WebsiteDepartmentProgrammeItem {
  code: string;
  title: string;
  level: 'Diploma' | 'Certificate' | 'Professional' | 'Short Course';
  duration: string;
  entryRequirements: string;
  studyModes: string[];
  examiningBody: string;
}

export interface WebsiteDepartmentAnnouncement {
  id: string;
  title: string;
  date: string;
  summary: string;
}

export interface WebsiteDepartmentFaq {
  question: string;
  answer: string;
}

export interface WebsiteDepartmentRecord {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortDescription: string;
  overview: string;
  visionMission?: string;
  bannerImageUrl: string | null;
  hodStaffProfileId: string | null;
  contactEmail: string | null;
  officeLocation: string | null;
  campusName: string;
  programmes: WebsiteDepartmentProgrammeItem[];
  facilities: string[];
  learningOutcomes: string[];
  careerOpportunities: string[];
  announcements: WebsiteDepartmentAnnouncement[];
  faqs: WebsiteDepartmentFaq[];
  featured: boolean;
  displayOrder: number;
  showOnPublicWebsite: boolean;
  status: WebsiteContentStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedById: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface DepartmentStaffAssignmentRecord {
  id: string;
  departmentId: string;
  staffProfileId: string;
  isHod: boolean;
  roleInDepartment: string;
  isPrimaryDepartment: boolean;
  displayOrder: number;
  assignedById: string;
  assignedAt: string;
}

export interface WebsiteAuditLogRecord {
  id: string;
  entityType: 'STAFF_PROFILE' | 'DEPARTMENT' | 'ASSIGNMENT';
  entityId: string;
  entityLabel: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  detail: string;
  createdAt: string;
}

export type AdmissionWorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'APPROVED'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'REGISTERED';

export interface AdmissionApplicationRecord {
  id: string;
  applicationNumber: string;
  applicantName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalIdOrIndex: string;
  programmeName: string;
  departmentName?: string;
  campusName: string;
  intakeName: string;
  studyMode: string;
  meanGrade: string;
  status: AdmissionWorkflowStatus;
  missingDocumentsNote?: string | null;
  documents: { name: string; status: 'VERIFIED' | 'PENDING' | 'MISSING' }[];
  offerLetterRef?: string | null;
  offerIssuedAt?: string | null;
  acceptedAt?: string | null;
  reviewedByName?: string | null;
  approvedByName?: string | null;
  generatedStudentRegNo?: string | null;
  linkedStudentId?: string | null;
  submittedAt: string;
  updatedAt: string;
}
