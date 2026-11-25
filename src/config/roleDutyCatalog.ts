import {
  DOCUMENT_PERMISSIONS,
  ROLE_DOCUMENT_PERMISSIONS,
  STUDENT_DOCUMENT_PERMISSIONS,
} from '../../server/modules/documents/documents.permissions';
import {
  REGISTRATION_PERMISSIONS,
  ROLE_REGISTRATION_PERMISSIONS,
} from '../../server/modules/registration/registration.permissions';
import {
  ROLE_TO_STAFF_PERMISSIONS,
  type StaffRoleCode,
} from '../../server/modules/staff/staff.permissions';
import type { PortalRole } from '../types';
import {
  ALL_STAFF_ROLES,
  getStaffNavigation,
  MODULE_PATH_TO_PORTAL_ROLE,
  STAFF_ACCOUNTS,
  type StaffRole,
} from './staff-navigation';

export type InstitutionalUserRoleCode =
  | StaffRoleCode
  | 'STUDENT'
  | 'PARENT'
  | 'ALUMNI'
  | 'CONTRACTOR'
  | 'PARTNER'
  | 'GUEST';

export type RoleCategory = 'STAFF' | 'STUDENT' | 'STAKEHOLDER';

export type DutyWorkflowType =
  | 'APPROVAL'
  | 'OPERATIONS'
  | 'SUBMISSION'
  | 'OVERSIGHT'
  | 'SECURITY';

export interface RoleDutyDefinition {
  id: string;
  title: string;
  description: string;
  workflowType: DutyWorkflowType;
  targetPath: string;
  portalRole: PortalRole;
  studentSection?: string;
}

export interface RoleEventDefinition {
  id: string;
  eventType: string;
  channel: string;
  title: string;
  trigger: string;
  responsibility: 'EMITS' | 'REVIEWS' | 'MONITORS';
}

export interface RolePropertyDefinition {
  key: string;
  label: string;
  category: 'IDENTITY' | 'SECURITY' | 'SCOPE' | 'OPERATIONAL';
  description: string;
  defaultValue: string;
}

export interface RoleAccessiblePortal {
  id: string;
  label: string;
  path: string;
  portalRole: PortalRole;
  studentSection?: string;
}

export interface RoleDutyCatalogEntry {
  role: InstitutionalUserRoleCode;
  title: string;
  category: RoleCategory;
  regNoPrefix: string;
  department: string;
  defaultCampus: string;
  allowedCampuses: string[];
  portalDestination: string;
  primaryPortalRole: PortalRole;
  dataScopeSummary: string;
  restrictedFrom: string[];
  duties: RoleDutyDefinition[];
  events: RoleEventDefinition[];
  properties: RolePropertyDefinition[];
  permissions: {
    staffPermissions: string[];
    uiNavPermissions: string[];
    documentPermissions: string[];
    registrationPermissions: string[];
    portalCapabilities: string[];
  };
  accessiblePortals: RoleAccessiblePortal[];
}

const ALL_CAMPUSES = [
  'Nairobi Main Campus',
  'Westlands Technology Park Campus',
  'Mombasa Coastal Campus',
];

const STAFF_ROLE_PORTAL_MAP: Record<StaffRole, PortalRole> = {
  ADMIN: 'staff',
  PRINCIPAL: 'staff',
  REGISTRAR: 'registrar',
  FINANCE_OFFICER: 'finance',
  HR: 'hr',
  LECTURER: 'lecturer',
  LIBRARIAN: 'library',
  IT_SUPPORT: 'ai-support',
  HOD: 'staff',
  ADMISSIONS_OFFICER: 'admissions',
  EXAMINATIONS_OFFICER: 'examination',
  QUALITY_ASSURANCE: 'quality-reports',
  STUDENT_AFFAIRS: 'community',
  HOSTEL_OFFICER: 'hostels',
  ICT_TECHNICIAN: 'staff',
  PROCUREMENT_OFFICER: 'staff',
  STORES_OFFICER: 'staff',
  COMMUNICATIONS_OFFICER: 'engagement',
  RECEPTIONIST: 'staff',
  SECURITY_OFFICER: 'staff',
  TRANSPORT_OFFICER: 'staff',
};

const STAFF_ROLE_DUTIES: Record<StaffRole, RoleDutyDefinition[]> = {
  ADMIN: [
    {
      id: 'adm-users',
      title: 'Provision Accounts & Assign Institutional Roles',
      description: 'Create staff/student/stakeholder accounts, manage activation invites, suspend or reactivate access, and inspect RBAC matrices.',
      workflowType: 'SECURITY',
      targetPath: '/staff/admin/users',
      portalRole: 'staff-users',
    },
    {
      id: 'adm-policy',
      title: 'Configure Attendance & Document Escalation Policies',
      description: 'Define 75% attendance thresholds, DMS access policies, and central registration number sequences.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/admin/attendance-policy',
      portalRole: 'staff',
    },
    {
      id: 'adm-campuses',
      title: 'Govern Campuses, Departments & Workflows',
      description: 'Maintain multi-campus structure, departmental assignments, and pending administrative workflow approvals.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/admin/campuses',
      portalRole: 'staff',
    },
    {
      id: 'adm-audit',
      title: 'Monitor Security & Authentication Audit Trails',
      description: 'Review password resets, first-login mandatory changes, OTP verifications, and platform-wide audit events.',
      workflowType: 'SECURITY',
      targetPath: '/staff/admin/audit',
      portalRole: 'staff',
    },
  ],
  PRINCIPAL: [
    {
      id: 'prin-approvals',
      title: 'Approve Executive Academic & Staff Decisions',
      description: 'Authorize escalated deferments, senior staff onboarding approvals, and institutional policy directives.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/principal/approvals',
      portalRole: 'staff',
    },
    {
      id: 'prin-oversight',
      title: 'Oversee Institutional Teaching & Attendance',
      description: 'Review missed-class escalations, faculty compliance across campuses, and executive teaching reports.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/principal/attendance',
      portalRole: 'staff',
    },
    {
      id: 'prin-performance',
      title: 'Review TVETA Quality & Performance KPIs',
      description: 'Track graduation readiness, institutional audit health, and programme outcomes across all schools.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/principal/performance',
      portalRole: 'quality-reports',
    },
    {
      id: 'prin-sign',
      title: 'Countersign Official Institutional Documents',
      description: 'Sign and issue governance resolutions, academic charters, and regulatory submissions.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/documents',
      portalRole: 'staff',
    },
  ],
  REGISTRAR: [
    {
      id: 'reg-transcripts',
      title: 'Verify & Issue Official Transcripts (TRX) & Certificates',
      description: 'Seal approved academic transcripts, completion letters, and graduation awards.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/module/registrar',
      portalRole: 'registrar',
    },
    {
      id: 'reg-records',
      title: 'Manage Nominal Roll, Deferments & Unit Changes',
      description: 'Approve student unit add/drop requests, academic deferments, programme transfers, and status changes.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/sis',
      portalRole: 'registrar',
    },
    {
      id: 'reg-admissions',
      title: 'Approve Student Enrolment & Reg Number Issuance',
      description: 'Convert verified applicants into active students with atomic HCA/STU registration numbers.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/admissions',
      portalRole: 'admissions',
    },
    {
      id: 'reg-docs',
      title: 'Govern Academic Registry Document Repository',
      description: 'Approve admission evidence, verify uploaded KCSE certificates, and issue official student records.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/documents',
      portalRole: 'staff',
    },
  ],
  FINANCE_OFFICER: [
    {
      id: 'fin-ledger',
      title: 'Reconcile M-Pesa STK Push & Bank Fee Collections',
      description: 'Monitor Lipa na M-Pesa settlements, verify bank deposit slips, and update student fee balances.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/finance',
      portalRole: 'finance',
    },
    {
      id: 'fin-approvals',
      title: 'Process Maker-Checker Clearances & Refund Requests',
      description: 'Review fee waiver authorizations, hostel charge drafts, overpayment refunds, and financial clearances.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/module/finance',
      portalRole: 'finance',
    },
    {
      id: 'fin-receipts',
      title: 'Issue Official Tuition Receipts & Fee Statements',
      description: 'Generate signed fee receipts, KES/USD financial statements, and bursar audit schedules.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/quality-reports',
      portalRole: 'quality-reports',
    },
  ],
  HR: [
    {
      id: 'hr-staff',
      title: 'Maintain Staff Registry, Contracts & Onboarding',
      description: 'Register new employees, manage academic/admin contracts, and trigger staff portal invitations.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/hr',
      portalRole: 'hr',
    },
    {
      id: 'hr-leave',
      title: 'Review Staff Leave & Workload Allocations',
      description: 'Approve annual/academic leave requests, track weekly teaching load hours, and resolve staff absences.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/hr/operations',
      portalRole: 'hr',
    },
    {
      id: 'hr-attendance',
      title: 'Monitor Staff Attendance & HR Document Policies',
      description: 'Audit staff attendance logs and manage restricted HR personnel files and policy templates.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/hr/attendance',
      portalRole: 'hr',
    },
  ],
  LECTURER: [
    {
      id: 'lect-teach',
      title: 'Deliver Classes & Mark Student Attendance',
      description: 'Manage assigned unit rosters, open QR attendance sessions, and log class delivery records.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/lecturer',
      portalRole: 'lecturer',
    },
    {
      id: 'lect-docs',
      title: 'Submit Lesson Plans, Schemes & Records of Work',
      description: 'Upload weekly teaching materials, notes, and schemes of work for HOD review.',
      workflowType: 'SUBMISSION',
      targetPath: '/staff/documents',
      portalRole: 'staff',
    },
    {
      id: 'lect-assess',
      title: 'Create CATs, Grade Assessments & Monitor CBT',
      description: 'Author assessment items, grade practicals/coursework, and submit marks for moderation.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/examination',
      portalRole: 'examination',
    },
    {
      id: 'lect-absence',
      title: 'Review Student Absence Explanations',
      description: 'Inspect assigned unit absence notes and escalate prolonged absences to HOD/Registrar.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/module/lecturer',
      portalRole: 'lecturer',
    },
  ],
  LIBRARIAN: [
    {
      id: 'lib-circ',
      title: 'Manage Book Circulation, Loans, Holds & Returns',
      description: 'Issue physical Dewey-catalogued books via barcode, enforce return deadlines, and manage reserve holds.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/library',
      portalRole: 'library',
    },
    {
      id: 'lib-digital',
      title: 'Curate Digital E-Books & Past Paper Repository',
      description: 'Publish approved e-resources, library policy guides, and open-access research collections.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/documents',
      portalRole: 'staff',
    },
  ],
  IT_SUPPORT: [
    {
      id: 'it-tickets',
      title: 'Resolve Helpdesk & Account Access Escalations',
      description: 'Triage support tickets, assist with MFA/password lockouts, and coordinate campus network fixes.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/ai-support',
      portalRole: 'ai-support',
    },
    {
      id: 'it-ai',
      title: 'Govern AI Support Quotas & Knowledge Base RAG',
      description: 'Manage chatbot vector indexing, prompt versions, PII masking safeguards, and AI incident alerts.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/module/ai-governance',
      portalRole: 'ai-governance',
    },
    {
      id: 'it-assets',
      title: 'Maintain ICT Asset Inventory & Activation Help',
      description: 'Track workstations/servers, resend account activation emails, and inspect IT audit trails.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/it/assets',
      portalRole: 'staff',
    },
  ],
  HOD: [
    {
      id: 'hod-teaching',
      title: 'Approve Departmental Schemes & Teaching Workloads',
      description: 'Monitor lecturer syllabus coverage, approve schemes of work, and verify weekly workload distribution.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/hod/attendance',
      portalRole: 'staff',
    },
    {
      id: 'hod-moderation',
      title: 'Moderate Departmental Examination Papers & Marks',
      description: 'Review assessment quality, confirm exam blueprints, and endorse departmental marks before release.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/module/examination',
      portalRole: 'examination',
    },
    {
      id: 'hod-attendance',
      title: 'Escalate Student & Lecturer Attendance Gaps',
      description: 'Review departmental attendance alerts and approve makeup/rescheduled class requests.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/hod/overview',
      portalRole: 'staff',
    },
  ],
  ADMISSIONS_OFFICER: [
    {
      id: 'adm-off-apps',
      title: 'Screen Applications & Verify Academic Documents',
      description: 'Evaluate KCSE/TVET qualifications, review uploaded certificates, and request missing documentation.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/admissions',
      portalRole: 'admissions',
    },
    {
      id: 'adm-off-offers',
      title: 'Issue Offer Letters & Convert Admitted Applicants',
      description: 'Generate formal admission offers and initiate student onboarding checklists and CRM follow-ups.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/module/campus-services',
      portalRole: 'campus-services',
    },
  ],
  EXAMINATIONS_OFFICER: [
    {
      id: 'exam-cbt',
      title: 'Configure Secure CBT Sessions & Live Proctoring',
      description: 'Schedule 63-format CBT exams, monitor active student sessions, and adjudicate security incidents.',
      workflowType: 'SECURITY',
      targetPath: '/staff/module/examination',
      portalRole: 'examination',
    },
    {
      id: 'exam-venues',
      title: 'Generate Conflict-Free Venues & Exam Cards',
      description: 'Allocate seating capacities, issue exam clearance permits, and verify 75% attendance eligibility.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/examination',
      portalRole: 'examination',
    },
    {
      id: 'exam-release',
      title: 'Moderate & Release Official Examination Results',
      description: 'Coordinate senate marks approval, process remarking appeals, and issue KNEC/CDACC result slips.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/module/registrar',
      portalRole: 'registrar',
    },
  ],
  QUALITY_ASSURANCE: [
    {
      id: 'qa-tveta',
      title: 'Conduct TVETA Accreditation & Institutional Audits',
      description: 'Track compliance checklists, inspect corrective action plans, and verify quality evidence logs.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/module/quality-reports',
      portalRole: 'quality-reports',
    },
    {
      id: 'qa-dms',
      title: 'Approve Institutional Policy & Compliance Documents',
      description: 'Govern DMS document lifecycle standards, archive controls, and export compliance datasets.',
      workflowType: 'APPROVAL',
      targetPath: '/staff/documents',
      portalRole: 'staff',
    },
  ],
  STUDENT_AFFAIRS: [
    {
      id: 'sa-welfare',
      title: 'Manage Confidential Student Welfare & Counselling',
      description: 'Coordinate restricted counselling referrals, hardship support, and dean-of-students welfare cases.',
      workflowType: 'SECURITY',
      targetPath: '/staff/module/hostels',
      portalRole: 'hostels',
    },
    {
      id: 'sa-community',
      title: 'Supervise SRC Elections, Clubs & Guardian Outreach',
      description: 'Oversee student council elections, ratify club charters, and manage guardian/career engagement.',
      workflowType: 'OVERSIGHT',
      targetPath: '/staff/module/community',
      portalRole: 'community',
    },
  ],
  HOSTEL_OFFICER: [
    {
      id: 'hos-beds',
      title: 'Allocate Hostel Beds & Track Resident Check-In/Out',
      description: 'Manage hall capacities, approve accommodation bookings, and inspect room handover checklists.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/hostels',
      portalRole: 'hostels',
    },
    {
      id: 'hos-maint',
      title: 'Log Residence Maintenance & Charge Drafts',
      description: 'Coordinate facility repairs and submit hostel billing drafts to Finance for approval.',
      workflowType: 'SUBMISSION',
      targetPath: '/staff/module/hostels',
      portalRole: 'hostels',
    },
  ],
  ICT_TECHNICIAN: [
    {
      id: 'tech-labs',
      title: 'Inspect Computer Labs & Practical Workstations',
      description: 'Verify exam lab readiness, maintain hardware workstations, and resolve classroom AV faults.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/tech/labs',
      portalRole: 'staff',
    },
    {
      id: 'tech-faults',
      title: 'Resolve Hardware Fault Tickets',
      description: 'Pick up escalated ICT hardware and printer tickets from the Help Centre queue.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/ai-support',
      portalRole: 'ai-support',
    },
  ],
  PROCUREMENT_OFFICER: [
    {
      id: 'proc-lpo',
      title: 'Prepare Requisitions & Local Purchase Orders (LPOs)',
      description: 'Process departmental purchase requests, verify quotes, and issue supplier purchase orders.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/procurement/orders',
      portalRole: 'staff',
    },
    {
      id: 'proc-vendors',
      title: 'Maintain Prequalified Vendors & Contractor Onboarding',
      description: 'Update supplier compliance records and submit contractor/partner registration drafts.',
      workflowType: 'SUBMISSION',
      targetPath: '/staff/procurement/vendors',
      portalRole: 'staff',
    },
  ],
  STORES_OFFICER: [
    {
      id: 'str-grn',
      title: 'Record Goods Received Notes (GRNs) & Stock Ledgers',
      description: 'Verify delivered supplies against LPOs and maintain real-time campus stock quantities.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/stores/inventory',
      portalRole: 'staff',
    },
    {
      id: 'str-issues',
      title: 'Dispatch Departmental Consumables & Track Issues',
      description: 'Fulfill approved departmental store requisitions and log stock issuance receipts.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/stores/issues',
      portalRole: 'staff',
    },
  ],
  COMMUNICATIONS_OFFICER: [
    {
      id: 'com-cms',
      title: 'Publish Website Profiles, News & Department Content',
      description: 'Maintain public college bulletins, staff directory profiles, and department showcases.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/website',
      portalRole: 'staff',
    },
    {
      id: 'com-broadcast',
      title: 'Send Institutional Notices & Event Communications',
      description: 'Coordinate campus announcements, stakeholder broadcasts, and event media highlights.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/module/engagement',
      portalRole: 'engagement',
    },
  ],
  RECEPTIONIST: [
    {
      id: 'rec-visitors',
      title: 'Register Campus Visitors & Issue Guest Passes',
      description: 'Log visitor check-ins/outs at front office and submit guest registration approvals.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/reception/visitors',
      portalRole: 'staff',
    },
    {
      id: 'rec-enquiries',
      title: 'Capture Walk-In Enquiries & Route Appointments',
      description: 'Record prospective student enquiries and schedule campus office appointments.',
      workflowType: 'SUBMISSION',
      targetPath: '/staff/module/campus-services',
      portalRole: 'campus-services',
    },
  ],
  SECURITY_OFFICER: [
    {
      id: 'sec-gates',
      title: 'Control Campus Gates & Approve Visitor Access',
      description: 'Monitor vehicle/pedestrian entry logs, verify hostel visitors, and approve guest clearances.',
      workflowType: 'SECURITY',
      targetPath: '/staff/security/incidents',
      portalRole: 'staff',
    },
    {
      id: 'sec-incidents',
      title: 'Log Safety Incidents & Night Escort Patrols',
      description: 'File campus incident reports, coordinate emergency response, and audit perimeter rounds.',
      workflowType: 'SECURITY',
      targetPath: '/staff/module/hostels',
      portalRole: 'hostels',
    },
  ],
  TRANSPORT_OFFICER: [
    {
      id: 'trn-fleet',
      title: 'Schedule Inter-Campus Shuttles & College Fleet',
      description: 'Assign drivers and buses to Nairobi, Westlands, and Mombasa campus trips and academic tours.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/transport/fleet',
      portalRole: 'staff',
    },
    {
      id: 'trn-fuel',
      title: 'Record Fuel Logs & Vehicle Maintenance Checks',
      description: 'Track odometer readings, fuel vouchers, and preventive fleet servicing schedules.',
      workflowType: 'OPERATIONS',
      targetPath: '/staff/transport/fleet',
      portalRole: 'staff',
    },
  ],
};

const STAFF_ROLE_EVENTS: Record<StaffRole, RoleEventDefinition[]> = {
  ADMIN: [
    { id: 'ev-adm-1', eventType: 'USER_ACCOUNT_PROVISIONED', channel: 'system_admin', title: 'Account Provisioning & Role Assignment', trigger: 'New user created or role permissions updated', responsibility: 'EMITS' },
    { id: 'ev-adm-2', eventType: 'EMAIL_VERIFICATION_COMPLETED', channel: 'security_audit', title: 'First-Login Password & Email OTP Audit', trigger: 'User replaces temporary password or verifies 6-digit OTP', responsibility: 'MONITORS' },
    { id: 'ev-adm-3', eventType: 'ATTENDANCE_POLICY_UPDATED', channel: 'academic', title: 'Institutional Threshold Policy Sync', trigger: 'Admin adjusts attendance or DMS retention policy', responsibility: 'EMITS' },
  ],
  PRINCIPAL: [
    { id: 'ev-pri-1', eventType: 'EXECUTIVE_APPROVAL_DECIDED', channel: 'academic', title: 'Executive Workflow Sign-off', trigger: 'Principal approves/rejects escalated deferment or senior hire', responsibility: 'EMITS' },
    { id: 'ev-pri-2', eventType: 'ATTENDANCE_ESCALATION_ALERT', channel: 'quality', title: 'Missed-Class & Compliance Escalation', trigger: 'Chronic attendance gap escalated from HOD', responsibility: 'REVIEWS' },
  ],
  REGISTRAR: [
    { id: 'ev-reg-1', eventType: 'DEFERMENT_REQUEST_SUBMITTED', channel: 'academic', title: 'Student Deferment / Transfer Queue', trigger: 'Student requests academic leave, unit swap, or transfer', responsibility: 'REVIEWS' },
    { id: 'ev-reg-2', eventType: 'TRANSCRIPT_SEALED_ISSUED', channel: 'academic', title: 'Official Transcript (TRX) Issuance', trigger: 'Registrar seals verified transcript or graduation award', responsibility: 'EMITS' },
    { id: 'ev-reg-3', eventType: 'APPLICANT_CONVERTED_TO_STUDENT', channel: 'admissions', title: 'Enrolment Conversion & HCA/STU Sequence', trigger: 'Admissions conversion finalized into SIS', responsibility: 'REVIEWS' },
  ],
  FINANCE_OFFICER: [
    { id: 'ev-fin-1', eventType: 'MPESA_STK_SETTLEMENT', channel: 'finance', title: 'Lipa na M-Pesa STK Settlement Callback', trigger: 'Safaricom Daraja payment confirmation received', responsibility: 'MONITORS' },
    { id: 'ev-fin-2', eventType: 'FEE_RECEIPT_ISSUED', channel: 'finance', title: 'Official Receipt & Financial Clearance Update', trigger: 'Payment verified or refund approved', responsibility: 'EMITS' },
    { id: 'ev-fin-3', eventType: 'HOSTEL_CHARGE_DRAFT_SUBMITTED', channel: 'hostels', title: 'Hostel Accommodation Billing Approval', trigger: 'Hostel Officer posts bed allocation charge draft', responsibility: 'REVIEWS' },
  ],
  HR: [
    { id: 'ev-hr-1', eventType: 'FACULTY_LEAVE_SUBMITTED', channel: 'hr', title: 'Staff Leave & Absence Approval Queue', trigger: 'Lecturer or officer applies for leave', responsibility: 'REVIEWS' },
    { id: 'ev-hr-2', eventType: 'STAFF_CONTRACT_ACTIVATED', channel: 'hr', title: 'Employee Onboarding & Contract Sign-off', trigger: 'New staff contract issued and verified', responsibility: 'EMITS' },
  ],
  LECTURER: [
    { id: 'ev-lec-1', eventType: 'ATTENDANCE_REGISTER_LOCKED', channel: 'faculty', title: 'Class Session QR Attendance Recorded', trigger: 'Lecturer closes live session attendance register', responsibility: 'EMITS' },
    { id: 'ev-lec-2', eventType: 'STUDENT_ABSENCE_SUBMITTED', channel: 'faculty', title: 'Student Absence Note Submitted', trigger: 'Student uploads medical/absence proof for unit', responsibility: 'REVIEWS' },
    { id: 'ev-lec-3', eventType: 'ASSESSMENT_MARKS_SUBMITTED', channel: 'examination', title: 'CAT & Practical Marks Uploaded', trigger: 'Lecturer publishes graded coursework to moderation', responsibility: 'EMITS' },
  ],
  LIBRARIAN: [
    { id: 'ev-lib-1', eventType: 'LIBRARY_HOLD_PLACED', channel: 'library', title: 'OPAC Book Hold & Reservation Request', trigger: 'Student places reservation on Dewey title', responsibility: 'REVIEWS' },
    { id: 'ev-lib-2', eventType: 'LIBRARY_CLEARANCE_SIGNED', channel: 'library', title: 'Overdue Notice & Clearance Status', trigger: 'Book returned or clearance cleared', responsibility: 'EMITS' },
  ],
  IT_SUPPORT: [
    { id: 'ev-it-1', eventType: 'SUPPORT_TICKET_ESCALATED', channel: 'ai_support', title: 'Portal / AI Escalated Support Ticket', trigger: 'Student or staff escalates unresolved helpdesk issue', responsibility: 'REVIEWS' },
    { id: 'ev-it-2', eventType: 'RAG_KNOWLEDGE_REINDEXED', channel: 'ai_support', title: 'Knowledge Vector Index & Prompt Rollback', trigger: 'AI Governance updates knowledge policy or prompt', responsibility: 'EMITS' },
  ],
  HOD: [
    { id: 'ev-hod-1', eventType: 'SCHEME_OF_WORK_SUBMITTED', channel: 'faculty', title: 'Lecturer Scheme of Work Review', trigger: 'Lecturer uploads scheme or lesson plan to DMS', responsibility: 'REVIEWS' },
    { id: 'ev-hod-2', eventType: 'EXAM_PAPER_MODERATED', channel: 'examination', title: 'Departmental Exam Paper Moderation', trigger: 'HOD approves moderated paper for CBT delivery', responsibility: 'EMITS' },
  ],
  ADMISSIONS_OFFICER: [
    { id: 'ev-ao-1', eventType: 'NEW_APPLICATION_RECEIVED', channel: 'admissions', title: 'Online Applicant Submission', trigger: 'Applicant completes web application & uploads KCSE slip', responsibility: 'REVIEWS' },
    { id: 'ev-ao-2', eventType: 'ADMISSION_OFFER_EXTENDED', channel: 'admissions', title: 'Offer Letter Issued', trigger: 'Admissions officer approves eligibility checklist', responsibility: 'EMITS' },
  ],
  EXAMINATIONS_OFFICER: [
    { id: 'ev-ex-1', eventType: 'EXAM_SECURITY_INCIDENT', channel: 'examination', title: 'CBT Security Event (Tab Hidden / Fullscreen Exit)', trigger: 'Secure exam monitor detects focus loss or copy attempt', responsibility: 'REVIEWS' },
    { id: 'ev-ex-2', eventType: 'CBT_SUPERVISOR_INSTRUCTION', channel: 'examination', title: 'Live Exam Supervisor Message', trigger: 'Student requests help or supervisor sends directive', responsibility: 'EMITS' },
    { id: 'ev-ex-3', eventType: 'EXAM_RESULTS_PUBLISHED', channel: 'examination', title: 'Senate-Approved Results Release', trigger: 'Moderated grades released to Student Portal', responsibility: 'EMITS' },
  ],
  QUALITY_ASSURANCE: [
    { id: 'ev-qa-1', eventType: 'TVETA_AUDIT_FINDING_LOGGED', channel: 'quality', title: 'TVETA Compliance & Audit Finding', trigger: 'Quality inspection records action item or clearance', responsibility: 'EMITS' },
    { id: 'ev-qa-2', eventType: 'INSTITUTIONAL_DOCUMENT_ARCHIVED', channel: 'quality', title: 'DMS Policy Verification & Archive', trigger: 'Controlled policy reaches approval or expiry review', responsibility: 'REVIEWS' },
  ],
  STUDENT_AFFAIRS: [
    { id: 'ev-sa-1', eventType: 'WELFARE_CASE_REFERRED', channel: 'hostels', title: 'Confidential Welfare Referral', trigger: 'Student submits counselling or hardship request', responsibility: 'REVIEWS' },
    { id: 'ev-sa-2', eventType: 'SRC_ELECTION_TALLIED', channel: 'community', title: 'SRC Secret-Ballot Tally & Club Charter', trigger: 'Electoral window closes or club submits registration', responsibility: 'MONITORS' },
  ],
  HOSTEL_OFFICER: [
    { id: 'ev-ho-1', eventType: 'HOSTEL_BED_BOOKED', channel: 'hostels', title: 'Accommodation Application Received', trigger: 'Student books room/bed in residence', responsibility: 'REVIEWS' },
    { id: 'ev-ho-2', eventType: 'HOSTEL_CHECKIN_RECORDED', channel: 'hostels', title: 'Resident Check-In & Repair Ticket', trigger: 'Warden checks in student or logs room repair', responsibility: 'EMITS' },
  ],
  ICT_TECHNICIAN: [
    { id: 'ev-tec-1', eventType: 'LAB_INSPECTION_LOGGED', channel: 'ai_support', title: 'Exam Lab Workstation Certification', trigger: 'Technician completes pre-CBT lab check', responsibility: 'EMITS' },
    { id: 'ev-tec-2', eventType: 'HARDWARE_FAULT_ASSIGNED', channel: 'ai_support', title: 'Hardware Repair Assignment', trigger: 'IT Support assigns workstation/projector ticket', responsibility: 'REVIEWS' },
  ],
  PROCUREMENT_OFFICER: [
    { id: 'ev-pr-1', eventType: 'LPO_REQUISITION_CREATED', channel: 'finance', title: 'Purchase Requisition & LPO Issue', trigger: 'Procurement generates supplier order', responsibility: 'EMITS' },
    { id: 'ev-pr-2', eventType: 'CONTRACTOR_ONBOARDING_SUBMITTED', channel: 'system_admin', title: 'Vendor / Contractor Portal Draft', trigger: 'Procurement submits vendor portal registration', responsibility: 'EMITS' },
  ],
  STORES_OFFICER: [
    { id: 'ev-st-1', eventType: 'GOODS_RECEIVED_NOTE_POSTED', channel: 'finance', title: 'GRN Stock Intake Confirmation', trigger: 'Stores verifies delivery against LPO', responsibility: 'EMITS' },
    { id: 'ev-st-2', eventType: 'DEPARTMENT_STOCK_ISSUED', channel: 'academic', title: 'Consumables Dispatch Recorded', trigger: 'Lab or department collects approved supplies', responsibility: 'EMITS' },
  ],
  COMMUNICATIONS_OFFICER: [
    { id: 'ev-cm-1', eventType: 'COLLEGE_BULLETIN_PUBLISHED', channel: 'engagement', title: 'Campus Broadcast & Website News Published', trigger: 'Communications publishes notice or event highlight', responsibility: 'EMITS' },
    { id: 'ev-cm-2', eventType: 'WEBSITE_PROFILE_REVIEW', channel: 'engagement', title: 'Public Staff Directory Update', trigger: 'CMS profile edit queued for publication', responsibility: 'REVIEWS' },
  ],
  RECEPTIONIST: [
    { id: 'ev-rc-1', eventType: 'CAMPUS_VISITOR_SIGNED_IN', channel: 'engagement', title: 'Front Desk Visitor & Guest Registration', trigger: 'Visitor arrives at Main Campus reception', responsibility: 'EMITS' },
    { id: 'ev-rc-2', eventType: 'PROSPECTIVE_ENQUIRY_LOGGED', channel: 'admissions', title: 'Walk-In Admissions Enquiry', trigger: 'Prospective applicant requests course info', responsibility: 'EMITS' },
  ],
  SECURITY_OFFICER: [
    { id: 'ev-sc-1', eventType: 'GATE_ACCESS_INCIDENT', channel: 'system_admin', title: 'Campus Gate Incident & Night Patrol Alert', trigger: 'Security logs gate anomaly or emergency patrol', responsibility: 'EMITS' },
    { id: 'ev-sc-2', eventType: 'GUEST_ACCESS_APPROVED', channel: 'hostels', title: 'Guest & Hostel Visitor Clearance', trigger: 'Receptionist submits temporary visitor request', responsibility: 'REVIEWS' },
  ],
  TRANSPORT_OFFICER: [
    { id: 'ev-tr-1', eventType: 'SHUTTLE_TRIP_DISPATCHED', channel: 'engagement', title: 'Inter-Campus Shuttle & Field Trip Dispatch', trigger: 'Fleet schedule confirmed for Nairobi/Westlands/Mombasa', responsibility: 'EMITS' },
    { id: 'ev-tr-2', eventType: 'VEHICLE_MAINTENANCE_DUE', channel: 'system_admin', title: 'Fleet Service & Fuel Variance Alert', trigger: 'Odometer threshold or fuel variance recorded', responsibility: 'MONITORS' },
  ],
};

function buildCommonProperties(
  roleTitle: string,
  regPrefix: string,
  department: string,
  campus: string,
  allowedCampuses: string[],
  scopeSummary: string
): RolePropertyDefinition[] {
  return [
    {
      key: 'uid',
      label: 'Institutional UID',
      category: 'IDENTITY',
      description: 'Immutable unique identity key linking PostgreSQL user record, sessions, and audit trails.',
      defaultValue: 'usr-<role>-001',
    },
    {
      key: 'registrationNumber',
      label: 'Registration / Employee Number',
      category: 'IDENTITY',
      description: 'Atomic college identifier issued by the Central Registration Engine.',
      defaultValue: `${regPrefix}/2026/...`,
    },
    {
      key: 'primaryRole',
      label: 'Primary Role Assignment',
      category: 'IDENTITY',
      description: 'Authoritative server-verified role governing portal destination and RBAC grants.',
      defaultValue: roleTitle,
    },
    {
      key: 'department',
      label: 'Department / Directorate',
      category: 'SCOPE',
      description: 'Organizational unit owning operational queues, documents, and reporting lines.',
      defaultValue: department,
    },
    {
      key: 'campus',
      label: 'Primary & Allowed Campuses',
      category: 'SCOPE',
      description: 'Multi-campus boundary enforced across dashboards, rosters, and documents.',
      defaultValue: `${campus} (${allowedCampuses.length} campus scope)`,
    },
    {
      key: 'emailVerified',
      label: 'Email Verification Status',
      category: 'SECURITY',
      description: 'Mandatory 6-digit OTP email verification gate prior to normal portal operations.',
      defaultValue: 'Required (10-minute OTP TTL)',
    },
    {
      key: 'mustChangePassword',
      label: 'First-Login Password Policy',
      category: 'SECURITY',
      description: 'Enforces 12+ char replacement of temporary passwords on initial sign-in.',
      defaultValue: 'Enforced on first login',
    },
    {
      key: 'mfaEnabled',
      label: 'Multi-Factor Authentication (MFA)',
      category: 'SECURITY',
      description: 'TOTP / Email OTP challenge & trusted device bindings protecting sensitive actions.',
      defaultValue: 'Configurable in Security Centre',
    },
    {
      key: 'dataScopeSummary',
      label: 'Authorized Data Boundary',
      category: 'OPERATIONAL',
      description: 'Explicit functional coverage and confidentiality isolation summary.',
      defaultValue: scopeSummary,
    },
  ];
}

function buildStaffCatalogEntry(role: StaffRole): RoleDutyCatalogEntry {
  const acct = STAFF_ACCOUNTS[role];
  const { roleItems, sharedItems } = getStaffNavigation(role, acct.permissions);
  const allNav = [...roleItems, ...sharedItems];

  const accessiblePortals: RoleAccessiblePortal[] = allNav.map((item) => {
    const moduleMeta = MODULE_PATH_TO_PORTAL_ROLE[item.path];
    return {
      id: item.path,
      label: item.label,
      path: item.path,
      portalRole: moduleMeta?.portal ?? STAFF_ROLE_PORTAL_MAP[role],
    };
  });

  return {
    role,
    title: acct.roleTitle,
    category: 'STAFF',
    regNoPrefix: role === 'ADMIN' ? 'HCA/ADMIN' : role === 'LECTURER' ? 'HCA/LECT' : role === 'LIBRARIAN' ? 'HCA/LIB' : 'HCA/STAFF',
    department: acct.department,
    defaultCampus: acct.campus,
    allowedCampuses: acct.allowedCampuses,
    portalDestination: '/portal/staff',
    primaryPortalRole: STAFF_ROLE_PORTAL_MAP[role],
    dataScopeSummary: acct.dataScopeSummary,
    restrictedFrom: acct.restrictedFrom,
    duties: STAFF_ROLE_DUTIES[role],
    events: STAFF_ROLE_EVENTS[role],
    properties: buildCommonProperties(
      acct.roleTitle,
      role === 'ADMIN' ? 'HCA/ADMIN' : role === 'LECTURER' ? 'HCA/LECT' : 'HCA/STAFF',
      acct.department,
      acct.campus,
      acct.allowedCampuses,
      acct.dataScopeSummary
    ),
    permissions: {
      staffPermissions: [...(ROLE_TO_STAFF_PERMISSIONS[role] ?? [])],
      uiNavPermissions: [...acct.permissions],
      documentPermissions: [...(ROLE_DOCUMENT_PERMISSIONS[role] ?? [])],
      registrationPermissions: [...(ROLE_REGISTRATION_PERMISSIONS[role] ?? [])],
      portalCapabilities: allNav.map((n) => `${n.label} (${n.path})`),
    },
    accessiblePortals,
  };
}

const NON_STAFF_ENTRIES: Record<
  'STUDENT' | 'PARENT' | 'ALUMNI' | 'CONTRACTOR' | 'PARTNER' | 'GUEST',
  RoleDutyCatalogEntry
> = {
  STUDENT: {
    role: 'STUDENT',
    title: 'Student Candidate',
    category: 'STUDENT',
    regNoPrefix: 'HCA/STU',
    department: 'School of Computing & Informatics (Programme-Scoped)',
    defaultCampus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus'],
    portalDestination: '/portal/student',
    primaryPortalRole: 'student',
    dataScopeSummary: 'Self-service student record · Unit registration, attendance QR, M-Pesa fees, secure CBT exams, DMS evidence uploads & guardian consent.',
    restrictedFrom: [
      'Other Students Academic or Fee Records',
      'Staff Administrative & HR Modules',
      'Raw Exam Question Banks & Marking Keys',
      'Direct Grade Modification (Read-only verified transcripts)',
    ],
    duties: [
      {
        id: 'stu-units',
        title: 'Register Semester Units & View Weekly Timetable',
        description: 'Confirm enrolled course units, submit add/drop or deferment requests, and monitor lecture venues.',
        workflowType: 'SUBMISSION',
        targetPath: '/portal/student/registration',
        portalRole: 'student',
        studentSection: 'course-registration',
      },
      {
        id: 'stu-fees',
        title: 'Settle Tuition Fees via M-Pesa STK & Track Clearance',
        description: 'Pay balances via Safaricom Daraja STK Push, inspect fee statements/receipts, and meet financial clearance thresholds.',
        workflowType: 'OPERATIONS',
        targetPath: '/portal/student/fees/pay',
        portalRole: 'student',
        studentSection: 'fees-pay',
      },
      {
        id: 'stu-exams',
        title: 'Complete Assignments, Practicals & Secure CBT Exams',
        description: 'Submit coursework, attend proctored fullscreen CBT sittings, verify 75% exam cards, and view approved results.',
        workflowType: 'SUBMISSION',
        targetPath: '/portal/student/exams/online',
        portalRole: 'student',
        studentSection: 'exams-online',
      },
      {
        id: 'stu-dms',
        title: 'Upload Admission, Absence & Attachment Documents',
        description: 'Submit KCSE slips, medical absence explanations, industrial attachment logbooks, and fee payment evidence.',
        workflowType: 'SUBMISSION',
        targetPath: '/portal/student/documents',
        portalRole: 'student',
        studentSection: 'documents',
      },
      {
        id: 'stu-life',
        title: 'Borrow Library Resources, Vote in SRC & Link Guardians',
        description: 'Reserve OPAC books, cast secret SRC ballots, book hostels, and grant or revoke parent portal consent.',
        workflowType: 'OPERATIONS',
        targetPath: '/portal/student/settings',
        portalRole: 'student',
        studentSection: 'settings',
      },
    ],
    events: [
      { id: 'ev-stu-1', eventType: 'MPESA_STK_CONFIRMED', channel: 'finance', title: 'Tuition M-Pesa Payment Confirmed', trigger: 'Student completes M-Pesa STK payment', responsibility: 'MONITORS' },
      { id: 'ev-stu-2', eventType: 'CBT_SECURITY_WARNING', channel: 'examination', title: 'Exam Security Focus / Fullscreen Alert', trigger: 'Browser visibility change or copy attempt during CBT', responsibility: 'MONITORS' },
      { id: 'ev-stu-3', eventType: 'ABSENCE_EXPLANATION_FILED', channel: 'faculty', title: 'Class Absence Proof Submitted', trigger: 'Student uploads absence note for lecturer review', responsibility: 'EMITS' },
      { id: 'ev-stu-4', eventType: 'TRANSCRIPT_RELEASED', channel: 'academic', title: 'Approved Grades & Exam Permit Available', trigger: 'Registrar publishes semester marks or clearance', responsibility: 'MONITORS' },
    ],
    properties: [
      ...buildCommonProperties(
        'Student Candidate',
        'HCA/STU',
        'Enrolled Academic Programme',
        'Nairobi Main Campus',
        ['Nairobi Main Campus'],
        'Personal student academic, fee, exam, hostel & DMS records'
      ),
      {
        key: 'attendanceRatePct',
        label: 'Class Attendance Standing',
        category: 'OPERATIONAL',
        description: 'Must remain at or above 75% per unit to unlock formal examination card clearance.',
        defaultValue: '92% (75% minimum required)',
      },
      {
        key: 'feeBalanceKes',
        label: 'Fee Balance & Clearance Standing',
        category: 'OPERATIONAL',
        description: 'Live KES fee statement balance governing exam permit & graduation clearance.',
        defaultValue: 'Live KES ledger balance',
      },
    ],
    permissions: {
      staffPermissions: [],
      uiNavPermissions: [
        'student.dashboard.view',
        'student.units.register',
        'student.attendance.checkin',
        'student.fees.pay',
        'student.receipts.download',
        'student.cbt.take',
        'student.results.view',
        'student.appeals.submit',
        'student.library.borrow',
        'student.attachment.submit',
        'student.hostel.apply',
        'student.src.vote',
        'student.guardian.consent',
      ],
      documentPermissions: [...STUDENT_DOCUMENT_PERMISSIONS],
      registrationPermissions: [],
      portalCapabilities: [
        'Academic Unit Registration & Deferment Requests',
        'Lipa na M-Pesa STK Fees, Statements & Official Receipts',
        '63-Format Secure CBT Exams & Supervisor Help Chat',
        'Document Uploads (Admissions, Finance, Absence, Practicals, Attachment)',
        'Digital Library OPAC, Hostel Booking & SRC Elections',
      ],
    },
    accessiblePortals: [
      { id: '/portal/student', label: 'Student Dashboard', path: '/portal/student', portalRole: 'student', studentSection: 'dashboard' },
      { id: '/portal/student/registration', label: 'Course Registration', path: '/portal/student/registration', portalRole: 'student', studentSection: 'course-registration' },
      { id: '/portal/student/fees', label: 'Fees & M-Pesa Payments', path: '/portal/student/fees', portalRole: 'student', studentSection: 'fees-overview' },
      { id: '/portal/student/exams', label: 'Exams & CBT Assessments', path: '/portal/student/exams', portalRole: 'student', studentSection: 'examinations' },
      { id: '/portal/student/documents', label: 'Student Document Centre', path: '/portal/student/documents', portalRole: 'student', studentSection: 'documents' },
      { id: '/portal/student/library', label: 'Digital Library', path: '/portal/student/library', portalRole: 'student', studentSection: 'library' },
      { id: '/portal/student/settings', label: 'Security & Guardian Consent', path: '/portal/student/settings', portalRole: 'student', studentSection: 'settings' },
    ],
  },
  PARENT: {
    role: 'PARENT',
    title: 'Parent / Guardian',
    category: 'STAKEHOLDER',
    regNoPrefix: 'HCA/PAR',
    department: 'Stakeholder Relations & Guardian Engagement',
    defaultCampus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus'],
    portalDestination: '/portal/engagement',
    primaryPortalRole: 'engagement',
    dataScopeSummary: 'Consent-gated guardian access · Linked student fee statements, attendance summaries, and official college announcements.',
    restrictedFrom: [
      'Unlinked Student Records',
      'Private Student Welfare Counselling Notes',
      'CBT Exam Attempts & Direct Unit Drop Controls',
      'Internal Staff Operations',
    ],
    duties: [
      {
        id: 'par-fees',
        title: 'Monitor Linked Student Fee Statements & Pay Tuition',
        description: 'Inspect billed fee schedules, download payment receipts, and remit fees for consented wards.',
        workflowType: 'OPERATIONS',
        targetPath: '/portal/engagement',
        portalRole: 'engagement',
      },
      {
        id: 'par-progress',
        title: 'Review Consent-Approved Academic & Attendance Progress',
        description: 'View ward attendance standing and official term broadcasts once student guardian consent is active.',
        workflowType: 'OVERSIGHT',
        targetPath: '/portal/engagement',
        portalRole: 'engagement',
      },
      {
        id: 'par-comms',
        title: 'Receive Official College Notices & Welfare Alerts',
        description: 'Stay informed on academic calendar dates, fee deadlines, and graduation invitations.',
        workflowType: 'SUBMISSION',
        targetPath: '/portal/engagement',
        portalRole: 'engagement',
      },
    ],
    events: [
      { id: 'ev-par-1', eventType: 'GUARDIAN_CONSENT_GRANTED', channel: 'engagement', title: 'Student Guardian Consent Activated / Revoked', trigger: 'Student enables or revokes parent visibility in Settings', responsibility: 'MONITORS' },
      { id: 'ev-par-2', eventType: 'FEE_INVOICE_POSTED', channel: 'finance', title: 'Semester Fee Statement & Receipt Alert', trigger: 'New term fee billed or M-Pesa receipt confirmed', responsibility: 'MONITORS' },
    ],
    properties: buildCommonProperties(
      'Parent / Guardian',
      'HCA/PAR',
      'Guardian & Parent Engagement',
      'Nairobi Main Campus',
      ['Nairobi Main Campus'],
      'Consent-scoped guardian visibility for linked students'
    ),
    permissions: {
      staffPermissions: [],
      uiNavPermissions: ['guardian.portal.access', 'guardian.fees.view', 'guardian.attendance.view', 'guardian.notices.view'],
      documentPermissions: [DOCUMENT_PERMISSIONS.DOCUMENT_VIEW, DOCUMENT_PERMISSIONS.DOCUMENT_PRINT],
      registrationPermissions: [],
      portalCapabilities: ['Engagement Hub (Guardian Portal)', 'Consent-Scoped Fee & Attendance Overview', 'Institutional Announcements'],
    },
    accessiblePortals: [
      { id: '/portal/engagement', label: 'Guardian Engagement Hub', path: '/portal/engagement', portalRole: 'engagement' },
    ],
  },
  ALUMNI: {
    role: 'ALUMNI',
    title: 'Alumni Member',
    category: 'STAKEHOLDER',
    regNoPrefix: 'HCA/ALU',
    department: 'Alumni Relations & Career Services',
    defaultCampus: 'Nairobi Main Campus',
    allowedCampuses: ALL_CAMPUSES,
    portalDestination: '/portal/campus-services',
    primaryPortalRole: 'campus-services',
    dataScopeSummary: 'Alumni & graduate services · Transcript/certificate verification requests, alumni mentorship, and career board postings.',
    restrictedFrom: ['Current Student Registers', 'Active CBT Examinations', 'Staff HR & Finance Controls'],
    duties: [
      {
        id: 'alu-certs',
        title: 'Request Certified Transcript Copies & Credential Verification',
        description: 'Download alumni records, request duplicate certificates, and verify academic credentials for employers.',
        workflowType: 'SUBMISSION',
        targetPath: '/portal/campus-services',
        portalRole: 'campus-services',
      },
      {
        id: 'alu-mentor',
        title: 'Offer Mentorship & Industrial Attachment Leads',
        description: 'Connect graduating students with internship opportunities and join alumni chapters.',
        workflowType: 'OPERATIONS',
        targetPath: '/portal/community',
        portalRole: 'community',
      },
    ],
    events: [
      { id: 'ev-alu-1', eventType: 'CREDENTIAL_VERIFICATION_COMPLETED', channel: 'academic', title: 'Alumni Transcript / Verification Ready', trigger: 'Registrar certifies alumni verification request', responsibility: 'MONITORS' },
      { id: 'ev-alu-2', eventType: 'ALUMNI_EVENT_PUBLISHED', channel: 'engagement', title: 'Homecoming & Career Fair Invite', trigger: 'Communications publishes alumni gathering', responsibility: 'MONITORS' },
    ],
    properties: buildCommonProperties(
      'Alumni Member',
      'HCA/ALU',
      'Alumni Association',
      'Nairobi Main Campus',
      ALL_CAMPUSES,
      'Alumni credentials, verification requests & community mentorship'
    ),
    permissions: {
      staffPermissions: [],
      uiNavPermissions: ['alumni.portal.access', 'alumni.credentials.request', 'alumni.community.participate'],
      documentPermissions: [DOCUMENT_PERMISSIONS.DOCUMENT_VIEW, DOCUMENT_PERMISSIONS.DOCUMENT_PRINT, DOCUMENT_PERMISSIONS.DOCUMENT_EXPORT],
      registrationPermissions: [],
      portalCapabilities: ['Campus Services & Credential Verification', 'Alumni Community & Mentorship'],
    },
    accessiblePortals: [
      { id: '/portal/campus-services', label: 'Alumni Credentials & Services', path: '/portal/campus-services', portalRole: 'campus-services' },
      { id: '/portal/community', label: 'Alumni & Community Hub', path: '/portal/community', portalRole: 'community' },
    ],
  },
  CONTRACTOR: {
    role: 'CONTRACTOR',
    title: 'Campus Contractor / Vendor',
    category: 'STAKEHOLDER',
    regNoPrefix: 'HCA/CTR',
    department: 'Facilities, Procurement & Campus Works',
    defaultCampus: 'Nairobi Main Campus',
    allowedCampuses: ALL_CAMPUSES,
    portalDestination: '/portal/campus-services',
    primaryPortalRole: 'campus-services',
    dataScopeSummary: 'Scoped vendor/contractor portal · Gate pass authorizations, LPO/delivery status, and facility compliance uploads.',
    restrictedFrom: ['Student Academic/Welfare Data', 'HR Employee Records', 'Internal Grading & Admissions'],
    duties: [
      {
        id: 'ctr-deliveries',
        title: 'Track LPO Deliveries & Campus Gate Passes',
        description: 'Coordinate scheduled deliveries with Stores/Security and maintain valid site access clearances.',
        workflowType: 'OPERATIONS',
        targetPath: '/portal/campus-services',
        portalRole: 'campus-services',
      },
      {
        id: 'ctr-compliance',
        title: 'Submit Tax, Insurance & Safety Compliance Documents',
        description: 'Upload required KRA/safety certificates and maintenance sign-off reports.',
        workflowType: 'SUBMISSION',
        targetPath: '/portal/campus-services',
        portalRole: 'campus-services',
      },
    ],
    events: [
      { id: 'ev-ctr-1', eventType: 'CONTRACTOR_GATE_PASS_ISSUED', channel: 'system_admin', title: 'Site Access Permit Approved', trigger: 'Security/Procurement validates contractor access', responsibility: 'MONITORS' },
    ],
    properties: buildCommonProperties(
      'Campus Contractor / Vendor',
      'HCA/CTR',
      'External Contractors & Suppliers',
      'Nairobi Main Campus',
      ALL_CAMPUSES,
      'Scoped supplier deliveries, compliance certificates & campus gate passes'
    ),
    permissions: {
      staffPermissions: [],
      uiNavPermissions: ['contractor.portal.access', 'contractor.compliance.submit'],
      documentPermissions: [DOCUMENT_PERMISSIONS.DOCUMENT_VIEW, DOCUMENT_PERMISSIONS.DOCUMENT_CREATE, DOCUMENT_PERMISSIONS.DOCUMENT_SUBMIT],
      registrationPermissions: [],
      portalCapabilities: ['Campus Services Vendor Desk', 'Compliance Document Submission'],
    },
    accessiblePortals: [
      { id: '/portal/campus-services', label: 'Contractor Services Desk', path: '/portal/campus-services', portalRole: 'campus-services' },
    ],
  },
  PARTNER: {
    role: 'PARTNER',
    title: 'Industry & Attachment Partner',
    category: 'STAKEHOLDER',
    regNoPrefix: 'HCA/PRT',
    department: 'Industry Partnerships & Career Placement',
    defaultCampus: 'Nairobi Main Campus',
    allowedCampuses: ALL_CAMPUSES,
    portalDestination: '/portal/campus-services',
    primaryPortalRole: 'campus-services',
    dataScopeSummary: 'Industry liaison scope · Internship/industrial attachment placements, employer evaluations & curriculum advisory.',
    restrictedFrom: ['Student Personal Fee Ledgers', 'Internal Staff HR Files', 'Unassigned Student Records'],
    duties: [
      {
        id: 'prt-attach',
        title: 'Post Internship Slots & Submit Employer Evaluations',
        description: 'Coordinate industrial attachment placements and upload employer assessment forms for hosted students.',
        workflowType: 'SUBMISSION',
        targetPath: '/portal/campus-services',
        portalRole: 'campus-services',
      },
      {
        id: 'prt-events',
        title: 'Participate in Career Fairs & Industry Advisory Forums',
        description: 'Register employer representatives for campus recruitment drives and TVET curriculum panels.',
        workflowType: 'OPERATIONS',
        targetPath: '/portal/engagement',
        portalRole: 'engagement',
      },
    ],
    events: [
      { id: 'ev-prt-1', eventType: 'ATTACHMENT_EVALUATION_REQUESTED', channel: 'engagement', title: 'Student Attachment Logbook Sign-Off', trigger: 'Student completes industrial attachment block', responsibility: 'REVIEWS' },
    ],
    properties: buildCommonProperties(
      'Industry & Attachment Partner',
      'HCA/PRT',
      'Industry & Career Partnerships',
      'Nairobi Main Campus',
      ALL_CAMPUSES,
      'Attachment supervision, internship listings & employer evaluations'
    ),
    permissions: {
      staffPermissions: [],
      uiNavPermissions: ['partner.portal.access', 'partner.attachments.evaluate', 'partner.jobs.publish'],
      documentPermissions: [DOCUMENT_PERMISSIONS.DOCUMENT_VIEW, DOCUMENT_PERMISSIONS.DOCUMENT_CREATE, DOCUMENT_PERMISSIONS.DOCUMENT_SUBMIT],
      registrationPermissions: [],
      portalCapabilities: ['Partner Attachment Supervision', 'Career & Industry Engagement Hub'],
    },
    accessiblePortals: [
      { id: '/portal/campus-services', label: 'Partner Placements Desk', path: '/portal/campus-services', portalRole: 'campus-services' },
      { id: '/portal/engagement', label: 'Career & Engagement Hub', path: '/portal/engagement', portalRole: 'engagement' },
    ],
  },
  GUEST: {
    role: 'GUEST',
    title: 'Registered Campus Guest',
    category: 'STAKEHOLDER',
    regNoPrefix: 'HCA/GST',
    department: 'Public Events & Campus Visitors',
    defaultCampus: 'Nairobi Main Campus',
    allowedCampuses: ['Nairobi Main Campus'],
    portalDestination: '/portal/campus-services',
    primaryPortalRole: 'campus-services',
    dataScopeSummary: 'Time-limited visitor scope · Public event passes, campus visit permits & public document access only.',
    restrictedFrom: ['All Student, Staff, Finance, Exam & Internal Administrative Modules'],
    duties: [
      {
        id: 'gst-pass',
        title: 'Present Visitor Pass & Check In at Reception/Gate',
        description: 'Use temporary digital badge for scheduled meetings, open days, or public college events.',
        workflowType: 'SECURITY',
        targetPath: '/portal/campus-services',
        portalRole: 'campus-services',
      },
      {
        id: 'gst-public',
        title: 'Browse Public College Prospectus & Event Programmes',
        description: 'Access approved public library resources, open-day brochures, and campus map details.',
        workflowType: 'OPERATIONS',
        targetPath: '/portal/campus-services',
        portalRole: 'campus-services',
      },
    ],
    events: [
      { id: 'ev-gst-1', eventType: 'VISITOR_PASS_EXPIRING', channel: 'system_admin', title: 'Temporary Guest Pass Check-Out Reminder', trigger: 'Scheduled visit window concludes', responsibility: 'MONITORS' },
    ],
    properties: buildCommonProperties(
      'Registered Campus Guest',
      'HCA/GST',
      'Campus Visitors & Open Events',
      'Nairobi Main Campus',
      ['Nairobi Main Campus'],
      'Temporary visitor pass & public college brochures only'
    ),
    permissions: {
      staffPermissions: [],
      uiNavPermissions: ['guest.portal.access', 'guest.pass.view'],
      documentPermissions: [DOCUMENT_PERMISSIONS.DOCUMENT_VIEW],
      registrationPermissions: [],
      portalCapabilities: ['Temporary Visitor Pass', 'Public Events & Prospectus Access'],
    },
    accessiblePortals: [
      { id: '/portal/campus-services', label: 'Guest & Visitor Desk', path: '/portal/campus-services', portalRole: 'campus-services' },
    ],
  },
};

export const ROLE_DUTY_CATALOG: Record<InstitutionalUserRoleCode, RoleDutyCatalogEntry> = {
  ...ALL_STAFF_ROLES.reduce(
    (acc, role) => {
      acc[role] = buildStaffCatalogEntry(role);
      return acc;
    },
    {} as Record<StaffRoleCode, RoleDutyCatalogEntry>
  ),
  ...NON_STAFF_ENTRIES,
};

export const ALL_CATALOG_ROLES: InstitutionalUserRoleCode[] = [
  ...ALL_STAFF_ROLES,
  'STUDENT',
  'PARENT',
  'ALUMNI',
  'CONTRACTOR',
  'PARTNER',
  'GUEST',
];

export const ALL_ROLE_CATALOG_ENTRIES: RoleDutyCatalogEntry[] = ALL_CATALOG_ROLES.map(
  (role) => ROLE_DUTY_CATALOG[role]
);

export function resolveCatalogEntryForRole(role: string | undefined | null): RoleDutyCatalogEntry {
  const upper = String(role ?? 'STUDENT').trim().toUpperCase() as InstitutionalUserRoleCode;
  return ROLE_DUTY_CATALOG[upper] ?? ROLE_DUTY_CATALOG.STUDENT;
}

export function resolveCatalogRoleForPortalShell(portalRole: PortalRole): InstitutionalUserRoleCode {
  switch (portalRole) {
    case 'student':
      return 'STUDENT';
    case 'registrar':
      return 'REGISTRAR';
    case 'finance':
      return 'FINANCE_OFFICER';
    case 'admissions':
      return 'ADMISSIONS_OFFICER';
    case 'library':
      return 'LIBRARIAN';
    case 'examination':
      return 'EXAMINATIONS_OFFICER';
    case 'hostels':
      return 'HOSTEL_OFFICER';
    case 'hr':
      return 'HR';
    case 'lecturer':
      return 'LECTURER';
    case 'quality-reports':
      return 'QUALITY_ASSURANCE';
    case 'ai-support':
    case 'chatbot-admin':
    case 'ai-governance':
      return 'IT_SUPPORT';
    case 'community':
      return 'STUDENT_AFFAIRS';
    case 'engagement':
      return 'COMMUNICATIONS_OFFICER';
    case 'campus-services':
      return 'ADMISSIONS_OFFICER';
    case 'generator':
    case 'staff-users':
    case 'staff':
    case 'catalogue':
    default:
      return 'ADMIN';
  }
}

export { DOCUMENT_PERMISSIONS, REGISTRATION_PERMISSIONS };
