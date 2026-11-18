import type { RegistrationCategory, RegistrationStatus } from './registration.types';

export const CATEGORY_META: Record<
  RegistrationCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    numberFormat: string;
    registrarSummary: string;
    approverSummary: string;
  }
> = {
  STUDENT: {
    label: 'Student Enrolment',
    shortLabel: 'Student',
    description: '7-step academic onboarding, guardian capture & fee setup',
    numberFormat: 'HCA/STU/YYYY/0001',
    registrarSummary: 'Admissions Officer, Registrar',
    approverSummary: 'Chief Academic Registrar',
  },
  STAFF: {
    label: 'Staff & Faculty',
    shortLabel: 'Staff',
    description: 'Teaching, non-teaching, lecturers, librarians, finance & IT',
    numberFormat: 'HCA/STAFF/YYYY/0001',
    registrarSummary: 'HR Officer (Admin accounts by Super Admin)',
    approverSummary: 'College Principal or Independent HR Approver',
  },
  PARENT: {
    label: 'Parent / Guardian',
    shortLabel: 'Parent',
    description: 'Verified guardian portal linked to active student number',
    numberFormat: 'HCA/PAR/YYYY/0001',
    registrarSummary: 'Student Affairs, Registrar, Admissions',
    approverSummary: 'Registrar / Student Affairs Verification',
  },
  ALUMNI: {
    label: 'Alumni Member',
    shortLabel: 'Alumni',
    description: 'Graduated cohort network & transcript request portal',
    numberFormat: 'HCA/ALU/YYYY/0001',
    registrarSummary: 'Registrar, Student Affairs',
    approverSummary: 'Chief Academic Registrar',
  },
  CONTRACTOR: {
    label: 'Contractor / Vendor',
    shortLabel: 'Contractor',
    description: 'Time-bound external vendor with SLA & expiry date',
    numberFormat: 'HCA/CTR/YYYY/0001',
    registrarSummary: 'Procurement Officer, HOD, Admin',
    approverSummary: 'Department Head, Principal, Admin',
  },
  PARTNER: {
    label: 'Partner Institution',
    shortLabel: 'Partner',
    description: 'TVETA, attachment host, or academic MOU partner',
    numberFormat: 'HCA/PRT/YYYY/0001',
    registrarSummary: 'Procurement, Registrar, Principal, Admin',
    approverSummary: 'Principal / Registrar',
  },
  GUEST: {
    label: 'Guest / Visitor',
    shortLabel: 'Guest',
    description: 'Temporary campus pass with host verification & expiry',
    numberFormat: 'HCA/GST/YYYY/0001',
    registrarSummary: 'Receptionist, Security Officer',
    approverSummary: 'Security Officer / Admin (never staff role)',
  },
};

export const STATUS_BADGE_MAP: Record<
  RegistrationStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Draft',
    className:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  SUBMITTED: {
    label: 'Submitted',
    className:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    className:
      'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
  },
  APPROVED: {
    label: 'Approved (No Invite)',
    className:
      'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
  },
  INVITED: {
    label: 'Invited (Pending Activation)',
    className:
      'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  },
  ACTIVATED: {
    label: 'Portal Activated',
    className:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  REJECTED: {
    label: 'Rejected',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  },
  SUSPENDED: {
    label: 'Suspended',
    className:
      'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
  ARCHIVED: {
    label: 'Archived',
    className:
      'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
};

export const ACADEMIC_PROGRAMMES = [
  'Diploma in Information Communication Technology (Level 6)',
  'Diploma in Software Engineering & Cloud Systems',
  'Diploma in Business Information Technology',
  'Diploma in Cybersecurity & Digital Forensics',
  'Certificate in Information Communication Technology (Level 5)',
  'Diploma in Accountancy & Financial Management (KASNEB)',
  'Diploma in Supply Chain & Procurement Management',
];

export const ACADEMIC_INTAKES = [
  'September 2026 Intake',
  'January 2027 Intake',
  'May 2027 Intake',
];

export const STAFF_ROLE_OPTIONS = [
  { value: 'LECTURER', label: 'Lecturer (Teaching Faculty)' },
  { value: 'HOD', label: 'Head of Department (HOD)' },
  { value: 'LIBRARIAN', label: 'College Librarian' },
  { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
  { value: 'IT_SUPPORT', label: 'IT Support Officer' },
  { value: 'ICT_TECHNICIAN', label: 'ICT & Lab Technician' },
  { value: 'ADMISSIONS_OFFICER', label: 'Admissions Officer' },
  { value: 'EXAMINATIONS_OFFICER', label: 'Examinations Officer' },
  { value: 'STUDENT_AFFAIRS', label: 'Student Affairs Officer' },
  { value: 'HOSTEL_OFFICER', label: 'Hostel Officer' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
  { value: 'STORES_OFFICER', label: 'Stores Officer' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'SECURITY_OFFICER', label: 'Security Officer' },
  { value: 'TRANSPORT_OFFICER', label: 'Transport Officer' },
  { value: 'ADMIN', label: 'System Administrator (Requires Principal Approval)' },
];

export const ODPC_NOTICE_TEXT =
  'Kenya Data Protection Act (ODPC) Notice: Personal identification numbers and supporting verification records are collected strictly for institutional identity verification, academic/employment onboarding, and statutory compliance. National ID numbers are masked in directory views, never shared with unauthorized departments, and portal access is only activated after independent approval.';
