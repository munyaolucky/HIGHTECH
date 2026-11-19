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

export interface PublicDepartmentRef {
  id: string;
  slug: string;
  name: string;
  isHod: boolean;
  roleInDepartment: string;
}

export interface PublicStaffSummary {
  id: string;
  slug: string;
  fullName: string;
  titlePrefix: string | null;
  officialTitle: string;
  positionTitle: string;
  designation: string;
  category: WebsiteStaffCategory;
  photoUrl: string | null;
  publicEmail: string | null;
  officeLocation: string | null;
  featured: boolean;
  displayOrder: number;
  departments: PublicDepartmentRef[];
}

export interface PublicStaffProfileDetail extends PublicStaffSummary {
  biography: string;
  academicQualifications: string[];
  professionalCertifications: string[];
  specializations: string[];
  subjectsTaught: string[];
  officeHours: string | null;
  linkedinUrl: string | null;
  seoTitle?: string;
  seoDescription?: string;
}

export interface DepartmentProgrammeItem {
  code: string;
  title: string;
  level: 'Diploma' | 'Certificate' | 'Professional' | 'Short Course';
  duration: string;
  entryRequirements: string;
  studyModes: string[];
  examiningBody: string;
}

export interface DepartmentAnnouncementItem {
  id: string;
  title: string;
  date: string;
  summary: string;
}

export interface DepartmentFaqItem {
  question: string;
  answer: string;
}

export interface PublicDepartmentSummary {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortDescription: string;
  bannerImageUrl: string | null;
  contactEmail: string | null;
  officeLocation: string | null;
  campusName: string;
  featured: boolean;
  displayOrder: number;
  programmeCount: number;
  staffCount: number;
  hod: {
    id: string;
    slug: string;
    fullName: string;
    officialTitle: string;
    photoUrl: string | null;
  } | null;
}

export interface PublicDepartmentDetail extends PublicDepartmentSummary {
  overview: string;
  programmes: DepartmentProgrammeItem[];
  facilities: string[];
  learningOutcomes: string[];
  careerOpportunities: string[];
  announcements: DepartmentAnnouncementItem[];
  faqs: DepartmentFaqItem[];
  staffMembers: PublicStaffSummary[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface CmsStaffProfileItem {
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
  updatedByName: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface DepartmentStaffAssignmentItem {
  id: string;
  departmentId: string;
  staffProfileId: string;
  isHod: boolean;
  roleInDepartment: string;
  isPrimaryDepartment: boolean;
  displayOrder: number;
}

export interface CmsDepartmentItem {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortDescription: string;
  overview: string;
  bannerImageUrl: string | null;
  hodStaffProfileId: string | null;
  contactEmail: string | null;
  officeLocation: string | null;
  campusName: string;
  programmes: DepartmentProgrammeItem[];
  facilities: string[];
  learningOutcomes: string[];
  careerOpportunities: string[];
  announcements: DepartmentAnnouncementItem[];
  faqs: DepartmentFaqItem[];
  featured: boolean;
  displayOrder: number;
  showOnPublicWebsite: boolean;
  status: WebsiteContentStatus;
  updatedByName: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  assignments: DepartmentStaffAssignmentItem[];
}

export interface CmsSummaryResponse {
  staff: {
    total: number;
    published: number;
    draft: number;
    pendingApproval: number;
    archived: number;
    withoutDepartment: number;
  };
  departments: {
    total: number;
    published: number;
    draft: number;
    pendingApproval: number;
    archived: number;
  };
  staffByDepartment: {
    departmentId: string;
    departmentName: string;
    status: WebsiteContentStatus;
    staffCount: number;
    hasHod: boolean;
  }[];
  pendingApprovals: {
    entityType: 'STAFF_PROFILE' | 'DEPARTMENT';
    id: string;
    title: string;
    subtitle: string;
    submittedAt: string;
    updatedByName: string;
  }[];
  recentAuditLogs: {
    id: string;
    entityType: string;
    entityLabel: string;
    action: string;
    actorName: string;
    actorRole: string;
    detail: string;
    createdAt: string;
  }[];
}
