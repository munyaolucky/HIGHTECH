import {
  Award,
  BarChart3,
  BedDouble,
  Bell,
  BookMarked,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  Database,
  FileArchive,
  FileCheck,
  FileCheck2,
  FileSignature,
  FileText,
  GraduationCap,
  Hash,
  Headphones,
  Heart,
  HeartHandshake,
  HelpCircle,
  KeyRound,
  Layers,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  Play,
  Printer,
  QrCode,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Vote,
  Wrench,
} from 'lucide-react';
import { UserPortalConfig } from '../components/UserPortalShell';
import { collegeErpService } from '../services/collegeErpService';
import { examAssessmentService } from '../services/examAssessmentService';
import { hostelsService } from '../services/hostelsService';
import { hrService } from '../services/hrService';
import { registrationService } from '../services/registrationService';
import { studentPortalService } from '../services/studentPortalService';
import { PortalRole } from '../types';

export type ShellRoleKey = Exclude<PortalRole, 'website' | 'student' | 'lecturer' | 'staff'>;

export function getPortalShellConfig(role: ShellRoleKey): UserPortalConfig {
  const erpState = collegeErpService.getState();
  const studentState = studentPortalService.getState();
  const studentFin = studentPortalService.getFinancialSummary();
  const examState = examAssessmentService.getState();
  const hostelState = hostelsService.getState();
  const hrState = hrService.getState();
  const issuances = registrationService.getAllIssuances();

  switch (role) {
    case 'registrar':
      return {
        role,
        portalTitle: 'Academic Registrar Dashboard',
        portalSubtitle: 'Student Registry, Unit/Deferment Approvals, Transcripts & Verification',
        userName: 'Dr. Kiprop Chemweno',
        userRegNo: 'HCA/STAFF/2026/001',
        userTitle: 'Chief Academic Registrar',
        department: 'Office of the Academic Registrar',
        campus: 'Nairobi Main Campus',
        defaultTab: 'students',
        quickStats: [
          {
            label: 'Enrolled Students (STU)',
            value: String(registrationService.getAllIssuances({ recordType: 'STU' }).length),
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Pending Student Requests',
            value: String(
              studentState.unitChanges.length + studentState.defermentRequests.length
            ),
            toneClass: 'text-amber-700',
          },
          {
            label: 'Issued Transcripts (TRX)',
            value: String(erpState.transcripts.length),
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Central Reg Records',
            value: String(issuances.length),
            toneClass: 'text-[#0866d7]',
          },
        ],
        navItems: [
          {
            id: 'students',
            label: 'Enrolled Student Registry',
            description: 'Inspect student cohorts, GPA, attendance, and nominal roll status',
            keywords: 'students cohort registry gpa enrollment',
            icon: Users,
            group: 'Academic Records',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'academic_reg',
            label: 'Semester Unit Registrations',
            description: 'Live Cloud SQL trimester unit registration, fee clearance & Registrar approvals',
            keywords: 'semester trimester units credits fee threshold academic registration',
            icon: BookOpen,
            group: 'Academic Records',
            gradientClass: 'bg-indigo-700',
          },
          {
            id: 'requests',
            label: 'Unit & Leave Approvals',
            description: 'Approve or reject student unit add/drop and deferment requests',
            keywords: 'requests unit change deferment leave transfer approve',
            icon: ClipboardCheck,
            group: 'Academic Records',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'transcripts',
            label: 'Transcript Issuance (TRX)',
            description: 'Manage Registrar-verified official academic transcripts',
            keywords: 'transcript trx grades academic record',
            icon: FileText,
            group: 'Certification',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'certificates',
            label: 'Certificate Conferment',
            description: 'Issue official HCA/CERT/2026 credentials for graduands',
            keywords: 'certificate graduation conferment award',
            icon: Award,
            group: 'Certification',
            gradientClass: 'bg-purple-700',
          },
          {
            id: 'verification',
            label: 'Document Verification Desk',
            description: 'Verify transcripts, receipts, and HCA registration numbers',
            keywords: 'verify qr authenticity lookup check',
            icon: FileCheck,
            group: 'Verification',
            gradientClass: 'bg-slate-800',
          },
        ],
        relatedPortals: [
          { role: 'admissions', label: 'Admissions Office' },
          { role: 'generator', label: 'Central Reg Generator' },
          { role: 'examination', label: 'Examinations & CBT' },
        ],
      };

    case 'finance':
      return {
        role,
        portalTitle: 'Finance & Cash Office Portal',
        portalSubtitle: 'Tuition Collections, Lipa na M-Pesa STK Reconciliation & Receipts',
        userName: 'CPA Beatrice Muthoni',
        userRegNo: 'HCA/STAFF/2026/004',
        userTitle: 'Chief Finance Officer & Bursar',
        department: 'Finance, Bursar & M-Pesa Treasury',
        campus: 'Nairobi Main Campus',
        defaultTab: 'overview',
        quickStats: [
          {
            label: 'Total Fee Collections',
            value: `KES ${erpState.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}`,
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Issued Receipts',
            value: `${erpState.transactions.length} RCT`,
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Amina Wanjiku Balance',
            value: `KES ${studentFin.balance.toLocaleString()}`,
            toneClass: 'text-[#0866d7]',
          },
          {
            label: 'Daraja Paybill',
            value: '890123',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'overview',
            label: 'Financial Overview',
            description: 'Monthly collection targets and M-Pesa / bank split metrics',
            keywords: 'overview budget collections analytics',
            icon: BarChart3,
            group: 'Treasury',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'transactions',
            label: 'Official Receipts Ledger',
            description: 'View immutable tuition payment receipts across portals',
            keywords: 'receipts transactions rct ledger',
            icon: Receipt,
            group: 'Treasury',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'feestructure',
            label: 'Programme Fee Structures',
            description: 'Standard Degree, Diploma, Certificate & CDACC billing tiers',
            keywords: 'fee structure tuition billing charges',
            icon: CreditCard,
            group: 'Billing',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'stk_push',
            label: 'Lipa na M-Pesa STK Simulator',
            description: 'Dispatch STK payment and post live receipt to student accounts',
            keywords: 'mpesa stk push daraja pay settlement',
            icon: Smartphone,
            group: 'Billing',
            gradientClass: 'bg-teal-700',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Portal (Fee View)' },
          { role: 'registrar', label: 'Academic Registrar' },
          { role: 'hostels', label: 'Hostels Billing' },
        ],
      };

    case 'admissions':
      return {
        role,
        portalTitle: 'Admissions & Enrolment Desk',
        portalSubtitle: 'Applicant Pipeline, Offer Letters & One-Click Student Registration',
        userName: 'Grace Wangari',
        userRegNo: 'HCA/STAFF/2026/007',
        userTitle: 'Senior Admissions Officer',
        department: 'Admissions & Marketing',
        campus: 'Nairobi Main Campus',
        defaultTab: 'applications',
        quickStats: [
          {
            label: 'Total Applications',
            value: String(erpState.applications.length),
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Under Review',
            value: String(erpState.applications.filter((a) => a.status === 'UNDER_REVIEW').length),
            toneClass: 'text-amber-700',
          },
          {
            label: 'Offers / Accepted',
            value: String(
              erpState.applications.filter((a) => a.status === 'OFFER_MADE' || a.status === 'ACCEPTED').length
            ),
            toneClass: 'text-purple-700',
          },
          {
            label: 'Converted to STU',
            value: String(erpState.applications.filter((a) => a.status === 'REGISTERED').length),
            toneClass: 'text-emerald-700',
          },
        ],
        navItems: [
          {
            id: 'applications',
            label: 'Application Review Queue',
            description: 'Review applicants, dispatch offers, and convert to student IDs',
            keywords: 'applications queue offers convert student',
            icon: Users,
            group: 'Admissions',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'new_apply',
            label: 'Direct Application Entry',
            description: 'Capture walk-in or direct applicant records with APP Reg ID',
            keywords: 'new application form walkin admit',
            icon: FileText,
            group: 'Admissions',
            gradientClass: 'bg-emerald-700',
          },
        ],
        relatedPortals: [
          { role: 'registrar', label: 'Registrar Portal' },
          { role: 'generator', label: 'Central Reg Generator' },
          { role: 'campus-services', label: 'Admissions CRM Pipeline' },
        ],
      };

    case 'library':
      return {
        role,
        portalTitle: 'Central Library Management',
        portalSubtitle: 'Physical Book Inventory, Circulation Borrowing, Holds & E-Library',
        userName: 'Samuel Ochieng',
        userRegNo: 'HCA/LIB/2026/002',
        userTitle: 'Chief College Librarian',
        department: 'Library & Information Services',
        campus: 'Nairobi Main Campus',
        defaultTab: 'catalogue',
        quickStats: [
          {
            label: 'Catalogue Titles',
            value: String(erpState.books.length),
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Available Copies',
            value: String(erpState.books.reduce((s, b) => s + b.availableCopies, 0)),
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Active Student Loans',
            value: String(erpState.loans.filter((l) => l.status === 'BORROWED').length),
            toneClass: 'text-amber-700',
          },
          {
            label: 'Total Returned',
            value: String(erpState.loans.filter((l) => l.status === 'RETURNED').length),
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'catalogue',
            label: 'Physical Books Catalogue',
            description: 'Search ISBN, Dewey call numbers, shelf bays, and availability',
            keywords: 'books catalogue isbn search shelves',
            icon: BookMarked,
            group: 'Holdings',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'circulation',
            label: 'Borrowing & Returns Desk',
            description: 'Issue books by barcode, track holds, and process returns',
            keywords: 'circulation borrow loan return hold desk',
            icon: Clock,
            group: 'Circulation',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'digital',
            label: 'Digital E-Books & Journals',
            description: 'Open watermarked PDF reader and download research packs',
            keywords: 'digital ebooks pdf journals manuals',
            icon: BookOpen,
            group: 'Digital Repository',
            gradientClass: 'bg-purple-700',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Library View' },
          { role: 'registrar', label: 'Library Clearance Audit' },
        ],
      };

    case 'examination':
      return {
        role,
        portalTitle: 'Examinations & CBT Engine',
        portalSubtitle: '63 Question Formats, Seating Permits, Live CBT Runner & Moderation',
        userName: 'Prof. Mary Wangui',
        userRegNo: 'HCA/STAFF/2026/003',
        userTitle: 'Chief Examinations & Moderation Officer',
        department: 'Examinations & Assessment Directorate',
        campus: 'Nairobi Main Campus',
        defaultTab: 'questions',
        quickStats: [
          {
            label: 'Question Bank Items',
            value: String(examState.questions.length),
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Published Assessments',
            value: String(examState.assessments.length),
            toneClass: 'text-blue-700',
          },
          {
            label: 'Candidate Attempts',
            value: String(examState.attempts.length),
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Seat Allocations',
            value: String(examState.seatingAllocations.length),
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'schedule',
            label: 'Seating & Exam Permits',
            description: 'Conflict-free seating checks and fee/attendance clearance',
            keywords: 'schedule venue seating permit hall card',
            icon: Calendar,
            group: 'Operations',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'questions',
            label: 'Question Bank & 63 Formats',
            description: 'Author, moderate, and approve 63 interactive question types',
            keywords: 'questions bank 63 types moderation',
            icon: FileCheck2,
            group: 'Authoring',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'studio',
            label: 'Assessment Blueprint Studio',
            description: 'Build fixed and random-pool CATs, practicals & final exams',
            keywords: 'studio blueprint cat exam assembly',
            icon: Layers,
            group: 'Authoring',
            gradientClass: 'bg-purple-700',
          },
          {
            id: 'runner',
            label: 'Live CBT Exam Runner',
            description: 'Timed server-clock exam delivery with autosave & formula eval',
            keywords: 'cbt runner test timer candidate student exam',
            icon: Play,
            group: 'Delivery',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'marking',
            label: 'Anonymous Marking & Release',
            description: 'Grade scripts anonymously, run item analysis & release marks',
            keywords: 'marking rubric moderation release results',
            icon: Award,
            group: 'Grading',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'incidents',
            label: 'Incidents & Supplementary Board',
            description: 'Log hall incidents and record senate supplementary rulings',
            keywords: 'incidents malpractice board supplementary senate',
            icon: ShieldAlert,
            group: 'Governance',
            gradientClass: 'bg-red-700',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Exams View' },
          { role: 'lecturer', label: 'Lecturer Portal' },
          { role: 'registrar', label: 'Registrar Transcripts' },
        ],
      };

    case 'hostels':
      return {
        role,
        portalTitle: 'Hostels & Student Welfare',
        portalSubtitle: 'Residence Inventory, Bed Allocations, Charges & Confidential Counselling',
        userName: 'Faith Njoroge',
        userRegNo: 'HCA/STAFF/2026/009',
        userTitle: 'Hostels Warden & Student Welfare Lead',
        department: 'Accommodation & Dean of Students',
        campus: 'Nairobi Main Campus',
        defaultTab: 'inventory',
        quickStats: [
          {
            label: 'Active Residences',
            value: String(hostelState.hostels.length),
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Bed Inventory',
            value: String(hostelState.beds.length),
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Hostel Applications',
            value: String(hostelState.applications.length),
            toneClass: 'text-blue-700',
          },
          {
            label: 'Welfare Cases',
            value: String(hostelState.supportRequests.length),
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'inventory',
            label: 'Hostels, Rooms & Beds',
            description: 'Inspect hostel occupancy policies, rooms, and bed readiness',
            keywords: 'hostels rooms beds inventory',
            icon: BedDouble,
            group: 'Accommodation',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'allocations',
            label: 'Applications & Bed Check-In',
            description: 'Approve hostel bookings and assign physical beds to students',
            keywords: 'allocations check-in applications assign',
            icon: ClipboardCheck,
            group: 'Accommodation',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'maintenance-visitors',
            label: 'Maintenance & Visitor Gate',
            description: 'Track room repair tickets and campus residence visitor logs',
            keywords: 'maintenance repair visitors gate log',
            icon: Wrench,
            group: 'Operations',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'billing',
            label: 'Residence Billing & Charges',
            description: 'Prepare and approve hostel fees & damage charges',
            keywords: 'billing charges invoices finance clearance',
            icon: Receipt,
            group: 'Operations',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'welfare',
            label: 'Confidential Welfare & Counselling',
            description: 'Manage restricted student welfare, counselling & health cases',
            keywords: 'welfare counselling health support aid',
            icon: HeartHandshake,
            group: 'Welfare',
            gradientClass: 'bg-purple-700',
          },
          {
            id: 'announcements',
            label: 'Hostel Announcements',
            description: 'Publish notices for residents across campus residences',
            keywords: 'announcements notices resident alerts',
            icon: Megaphone,
            group: 'Communications',
            gradientClass: 'bg-teal-700',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Support & Clearance' },
          { role: 'finance', label: 'Finance & Cash Office' },
        ],
      };

    case 'hr':
      return {
        role,
        portalTitle: 'HR & Staff People Operations',
        portalSubtitle: 'Staff Registry, Contract Governance, Leave Approvals & Teaching Workloads',
        userName: 'Beatrice Wanjiku',
        userRegNo: 'HCA/STAFF/2026/005',
        userTitle: 'Senior HR & People Operations Officer',
        department: 'Human Resources Directorate',
        campus: 'Nairobi Main Campus',
        defaultTab: 'directory',
        quickStats: [
          {
            label: 'Active Staff Members',
            value: String(hrState.staff.length),
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Employment Contracts',
            value: String(hrState.contracts.length),
            toneClass: 'text-blue-700',
          },
          {
            label: 'Leave Applications',
            value: String(hrState.leaveRequests.length),
            toneClass: 'text-amber-700',
          },
          {
            label: 'Assigned Workloads',
            value: String(hrState.workloads.length),
            toneClass: 'text-emerald-700',
          },
        ],
        navItems: [
          {
            id: 'directory',
            label: 'Staff Directory & Onboarding',
            description: 'Manage HCA/STAFF personnel records and role assignments',
            keywords: 'staff directory hr onboarding profiles',
            icon: Users,
            group: 'People',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'contracts',
            label: 'Independent Contracts Review',
            description: 'Submit and independently review fixed-term & permanent contracts',
            keywords: 'contracts employment review approve',
            icon: FileSignature,
            group: 'Governance',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'leave',
            label: 'Leave Approvals Desk',
            description: 'Process annual, medical, and academic study leave requests',
            keywords: 'leave annual medical approval holidays',
            icon: CalendarClock,
            group: 'Time Off',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'attendance',
            label: 'Staff Attendance Register',
            description: 'Record daily campus sign-ins across academic & support units',
            keywords: 'attendance clockin daily register',
            icon: Clock,
            group: 'Operations',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'workloads',
            label: 'Faculty Teaching Workloads',
            description: 'Audit weekly lecturer lecture & laboratory contact hours',
            keywords: 'workloads teaching hours lecturers allocation',
            icon: Layers,
            group: 'Academic HR',
            gradientClass: 'bg-purple-700',
          },
        ],
        relatedPortals: [
          { role: 'lecturer', label: 'Lecturer Portal' },
          { role: 'generator', label: 'Central Reg Generator' },
        ],
      };

    case 'community':
      return {
        role,
        portalTitle: 'SRC Elections & Campus Community',
        portalSubtitle: 'Secret-Ballot SRC Voting, Student Societies, Events & Alumni Mentorship',
        userName: 'Alex Kipchoge',
        userRegNo: 'HCA/STU/2026/014',
        userTitle: 'SRC Electoral Chair & Clubs Coordinator',
        department: 'Student Representative Council & Deanery',
        campus: 'Nairobi Main Campus',
        defaultTab: 'elections',
        quickStats: [
          {
            label: 'Ballots Recorded',
            value: String(0),
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Registered Societies',
            value: 'Active Clubs',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'SRC Voting Protocol',
            value: 'Secret Ballot',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Alumni Mentors',
            value: 'Directory Live',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'elections',
            label: 'SRC Secret Ballot Booth',
            description: 'Vote anonymously, view cryptographic receipts & file disputes',
            keywords: 'elections src voting ballot disputes',
            icon: Vote,
            group: 'Governance',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'clubs',
            label: 'Campus Clubs & Societies',
            description: 'Approve club memberships and oversee student society leadership',
            keywords: 'clubs societies memberships leadership',
            icon: Users,
            group: 'Student Life',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'events-volunteers',
            label: 'Events RSVP & Volunteering',
            description: 'Coordinate campus hackathons, events, and civic volunteer hours',
            keywords: 'events rsvp volunteering community service',
            icon: Heart,
            group: 'Student Life',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'alumni',
            label: 'Alumni & Mentorship Directory',
            description: 'Connect graduating students with industry alumni mentors',
            keywords: 'alumni mentors graduates network',
            icon: GraduationCap,
            group: 'Network',
            gradientClass: 'bg-purple-700',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Portal (Clubs & Voting)' },
          { role: 'engagement', label: 'Notices & Careers Hub' },
        ],
      };

    case 'engagement':
      return {
        role,
        portalTitle: 'Notices, Parent Consent & Careers',
        portalSubtitle: 'Stakeholder Messaging, Revocable Guardian Links & Attachment Placements',
        userName: 'Mercy Cheptoo',
        userRegNo: 'HCA/STAFF/2026/011',
        userTitle: 'Student Engagement & Industry Liaison Officer',
        department: 'Stakeholder Relations & Career Services',
        campus: 'Nairobi Main Campus',
        defaultTab: 'notifications',
        quickStats: [
          {
            label: 'Guardian Consent Mode',
            value: 'Revocable Opt-In',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Broadcast Channels',
            value: 'Inbox & SMS',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Attachment Employers',
            value: 'Active Partners',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Compliance Standard',
            value: 'DPA 2019',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'notifications',
            label: 'Announcements & Outbox',
            description: 'Read official college notices and manage outbound notifications',
            keywords: 'notifications inbox outbox broadcasts alerts',
            icon: Bell,
            group: 'Communications',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'guardians',
            label: 'Parent & Guardian Portal',
            description: 'Manage student-authorized parent links & granular sharing permissions',
            keywords: 'parent guardian consent link privacy',
            icon: Users,
            group: 'Stakeholders',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'careers',
            label: 'Internship & Career Board',
            description: 'Post graduate jobs & review industrial attachment applications',
            keywords: 'careers internships jobs attachment placement',
            icon: Briefcase,
            group: 'Placements',
            gradientClass: 'bg-blue-700',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Portal (Attachment & Guardians)' },
          { role: 'admissions', label: 'Admissions Desk' },
        ],
      };

    case 'quality-reports':
      return {
        role,
        portalTitle: 'Quality Assurance, Vault & Reports',
        portalSubtitle: 'TVETA Accreditation Self-Audit, Document Vault & Safe CSV Exports',
        userName: 'Dr. Benson Mwangi',
        userRegNo: 'HCA/STAFF/2026/006',
        userTitle: 'Director of Quality Assurance & Institutional Research',
        department: 'Quality Assurance & Regulatory Affairs',
        campus: 'Nairobi Main Campus',
        defaultTab: 'documents',
        quickStats: [
          {
            label: 'Accreditation Body',
            value: 'TVETA & CUE',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Export Safeguard',
            value: 'Formula Safe',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Multi-Currency Ready',
            value: 'KES / USD',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Document Policies',
            value: 'RBAC Controlled',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'documents',
            label: 'Institutional Document Vault',
            description: 'Upload and enforce access rules on official statutory policies',
            keywords: 'documents vault policies senate uploads',
            icon: FileArchive,
            group: 'Governance',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'quality',
            label: 'TVETA Accreditation Audit',
            description: 'Conduct compliance checks with independent principal sign-off',
            keywords: 'tveta quality accreditation audit compliance',
            icon: ShieldCheck,
            group: 'Accreditation',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'reports',
            label: 'Cross-Portal Analytics & CSV',
            description: 'Generate formula-safe multi-currency institutional CSV exports',
            keywords: 'reports analytics csv export multi-currency',
            icon: BarChart3,
            group: 'Reporting',
            gradientClass: 'bg-blue-700',
          },
        ],
        relatedPortals: [
          { role: 'registrar', label: 'Registrar Portal' },
          { role: 'finance', label: 'Finance Reports' },
        ],
      };

    case 'ai-support':
      return {
        role,
        portalTitle: 'AI Support & Helpdesk Centre',
        portalSubtitle: 'Role-Scoped Assistants, PII Masking, Knowledge Guides & Ticket Queue',
        userName: 'Dennis Kemboi',
        userRegNo: 'HCA/STAFF/2026/008',
        userTitle: 'Lead Campus Support & Helpdesk Officer',
        department: 'ICT & Student Support Services',
        campus: 'Nairobi Main Campus',
        defaultTab: 'assistant',
        quickStats: [
          {
            label: 'Support Roles Covered',
            value: '7 User Personas',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'PII Auto-Redaction',
            value: 'Enabled',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'SLA Resolution Target',
            value: '< 4 Hours',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Knowledge Desk',
            value: 'Indexed Live',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'assistant',
            label: '7-Role AI Help Assistant',
            description: 'Launch role-scoped guidance for students, faculty & staff',
            keywords: 'assistant chat guidance pii redaction',
            icon: Bot,
            group: 'AI Desk',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'knowledge',
            label: 'Help Centre Knowledge Base',
            description: 'Browse verified institutional SOPs and self-service guides',
            keywords: 'knowledge articles guides sop faq',
            icon: BookOpen,
            group: 'Self-Service',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'tickets',
            label: 'Helpdesk Ticket Queue',
            description: 'Resolve student & staff ICT, fee, exam, and portal tickets',
            keywords: 'tickets helpdesk resolve support escalate',
            icon: LifeBuoy,
            group: 'Tickets',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'quota-privacy',
            label: 'Quotas & Privacy Logs',
            description: 'Monitor daily assistant limits and automated PII scrubbing logs',
            keywords: 'quota privacy redaction audit',
            icon: ShieldAlert,
            group: 'Governance',
            gradientClass: 'bg-slate-800',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Support Tab' },
          { role: 'chatbot-admin', label: 'Chatbot & AI Desk' },
          { role: 'ai-governance', label: 'AI Governance Centre' },
        ],
      };

    case 'campus-services':
      return {
        role,
        portalTitle: 'Credentials, CRM & Appointments',
        portalSubtitle: 'QR Certificate Authenticator, Admissions CRM & Campus Booking Queue',
        userName: 'Miriam Akinyi',
        userRegNo: 'HCA/STAFF/2026/012',
        userTitle: 'Campus Records & Services Coordinator',
        department: 'Registrar & Front-Desk Operations',
        campus: 'Nairobi Main Campus',
        defaultTab: 'credentials',
        quickStats: [
          {
            label: 'Credential Lookup',
            value: 'QR & Code Live',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Admissions Funnel',
            value: 'CRM Tracked',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Front-Desk Bookings',
            value: 'Queue Open',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Compliance Posture',
            value: 'Active Audits',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'credentials',
            label: 'QR Credential Verification',
            description: 'Verify diplomas, transcripts & certificates by QR or reference',
            keywords: 'qr credentials verify certificate diploma',
            icon: QrCode,
            group: 'Verification',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'crm',
            label: 'Admissions CRM Pipeline',
            description: 'Track prospective enquiries from lead stage to formal enrolment',
            keywords: 'crm leads prospects admissions funnel',
            icon: TrendingUp,
            group: 'Admissions',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'appointments',
            label: 'Campus Appointments Desk',
            description: 'Book and manage Registrar, Finance & Counselling appointments',
            keywords: 'appointments queue schedule visits desk',
            icon: Calendar,
            group: 'Front Office',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'compliance',
            label: 'Statutory Policy Compliance',
            description: 'Review institutional DPA, examination, and safety sign-offs',
            keywords: 'compliance policy statutory checklist',
            icon: ShieldCheck,
            group: 'Governance',
            gradientClass: 'bg-purple-700',
          },
        ],
        relatedPortals: [
          { role: 'registrar', label: 'Registrar Verification' },
          { role: 'admissions', label: 'Admissions Portal' },
        ],
      };

    case 'chatbot-admin':
      return {
        role,
        portalTitle: 'Chatbot & Controlled RAG Desk',
        portalSubtitle: 'Curate Knowledge Base Articles, Resolve Escalations & Tune Responses',
        userName: 'Dennis Kemboi',
        userRegNo: 'HCA/ADMIN/2026/002',
        userTitle: 'Conversational AI & RAG Content Lead',
        department: 'Digital Campus Experience Unit',
        campus: 'Nairobi Main Campus',
        defaultTab: 'knowledge',
        quickStats: [
          {
            label: 'Desk Role',
            value: 'Curator & Admin',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Retrieval Mode',
            value: 'Citation RAG',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Fallback Conversion',
            value: '1-Click Publish',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Escalation Handoff',
            value: 'Human-in-Loop',
            toneClass: 'text-amber-700',
          },
        ],
        navItems: [
          {
            id: 'knowledge',
            label: 'Knowledge Base Manager',
            description: 'Create, publish, and cite authoritative FAQ articles',
            keywords: 'knowledge articles faq citations',
            icon: BookOpen,
            group: 'Knowledge',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'escalations',
            label: 'Live Escalations Queue',
            description: 'Claim and resolve complex student queries handed off by the bot',
            keywords: 'escalations queue assign resolve chat',
            icon: MessageSquare,
            group: 'Escalations',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'analytics',
            label: 'Conversation Analytics',
            description: 'Inspect resolution rates, top student intents & feedback trends',
            keywords: 'analytics telemetry ratings satisfaction',
            icon: BarChart3,
            group: 'Insights',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'settings',
            label: 'Chatbot Personality & Limits',
            description: 'Configure welcome prompts, fallback text, and confidence thresholds',
            keywords: 'settings config thresholds prompts',
            icon: Settings,
            group: 'Configuration',
            gradientClass: 'bg-slate-800',
          },
        ],
        relatedPortals: [
          { role: 'ai-governance', label: 'AI Governance Centre' },
          { role: 'ai-support', label: 'AI Support & Help Centre' },
        ],
      };

    case 'ai-governance':
      return {
        role,
        portalTitle: 'AI Governance & Prompt Control',
        portalSubtitle: 'Quotas, Prompt Version Rollback, Vector Indexing & Cost Telemetry',
        userName: 'Eng. Grace Kamau',
        userRegNo: 'HCA/ADMIN/2026/001',
        userTitle: 'Chief AI Governance & Platform Architect',
        department: 'Institutional Digital Governance',
        campus: 'Nairobi Main Campus',
        defaultTab: 'controls',
        quickStats: [
          {
            label: 'Modules Covered',
            value: 'Mod 40–42',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Governance Posture',
            value: 'Audited',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Prompt Versioning',
            value: 'Rollback Ready',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Emergency Kill Switch',
            value: 'Armed & Safe',
            toneClass: 'text-amber-700',
          },
        ],
        navItems: [
          {
            id: 'controls',
            label: 'Providers & Token Quotas',
            description: 'Health checks, emergency kill switches & per-department quotas',
            keywords: 'controls providers quotas health',
            icon: ShieldCheck,
            group: 'Platform Controls',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'prompts',
            label: 'Prompt Registry & Rollback',
            description: 'Publish immutable prompt templates and roll back revisions',
            keywords: 'prompts templates versions rollback',
            icon: Sparkles,
            group: 'Prompts',
            gradientClass: 'bg-purple-700',
          },
          {
            id: 'indexing',
            label: 'Knowledge Vector Indexing',
            description: 'Queue, retry, and re-index institutional RAG knowledge documents',
            keywords: 'indexing jobs reindex embeddings rag',
            icon: Database,
            group: 'RAG Pipeline',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'performance',
            label: 'Latency, Usage & Alerts',
            description: 'Analyze latency percentiles, token burn & incident alerts',
            keywords: 'performance latency alerts cost',
            icon: BarChart3,
            group: 'Telemetry',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'audit',
            label: 'Immutable Governance Audit',
            description: 'Export CSV audit trail of every AI configuration action',
            keywords: 'audit csv export compliance log',
            icon: FileCheck2,
            group: 'Compliance',
            gradientClass: 'bg-slate-800',
          },
        ],
        relatedPortals: [
          { role: 'chatbot-admin', label: 'Chatbot & AI Desk' },
          { role: 'ai-support', label: 'AI Support & Helpdesk' },
        ],
      };

    case 'generator':
      return {
        role,
        portalTitle: 'Central Reg Number Generator',
        portalSubtitle: 'Atomic HCA/<TYPE>/<YEAR>/<SEQ> Authority Across 11 Institutional Types',
        userName: 'Central Registry Controller',
        userRegNo: 'HCA/ADMIN/2026/003',
        userTitle: 'Identity & Certification Issuance Controller',
        department: 'Central Registration Authority',
        campus: 'All Campuses',
        defaultTab: 'generate',
        quickStats: [
          {
            label: 'Format Standard',
            value: 'HCA/<TYPE>/<YR>/<SEQ>',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Total Issued IDs',
            value: String(issuances.length),
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Record Categories',
            value: '11 Types',
            toneClass: 'text-blue-700',
          },
          {
            label: 'Sequence Engine',
            value: 'Collision-Free',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'generate',
            label: 'Issue New Reg Number',
            description: 'Generate atomic STU, STAFF, LECT, CERT, APP & LIB identifiers',
            keywords: 'generate issue sequence reg number hca',
            icon: Hash,
            group: 'Registry Engine',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'registry',
            label: 'Issued Registry Directory',
            description: 'Search and inspect all issued credentials across categories and years',
            keywords: 'registry issued directory search history log',
            icon: Users,
            group: 'Audit & Records',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'verify',
            label: 'Verification & Audit Desk',
            description: 'Verify registration authenticity and inspect status records',
            keywords: 'verify audit check authenticity validate',
            icon: FileCheck,
            group: 'Verification',
            gradientClass: 'bg-emerald-700',
          },
        ],
        relatedPortals: [
          { role: 'admissions', label: 'Admissions Conversion' },
          { role: 'registrar', label: 'Registrar Portal' },
          { role: 'hr', label: 'HR Staff Directory' },
        ],
      };

    case 'staff-users':
      return {
        role,
        portalTitle: 'Staff User Management',
        portalSubtitle: 'Platform Account Administration, Role Assignment & Access Governance',
        userName: 'System Administrator',
        userRegNo: 'HCA/ADMIN/2026/010',
        userTitle: 'Platform User Administration Lead',
        department: 'ICT & Systems Administration',
        campus: 'Nairobi Main Campus',
        defaultTab: 'accounts',
        quickStats: [
          {
            label: 'Total Accounts',
            value: 'All Users',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Active Sessions',
            value: 'Live',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Pending Invitations',
            value: 'Review',
            toneClass: 'text-amber-700',
          },
          {
            label: 'Security Posture',
            value: 'Monitored',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'accounts',
            label: 'User Accounts Registry',
            description: 'View, search, and manage platform user accounts across all roles',
            keywords: 'accounts users registry manage search',
            icon: Users,
            group: 'Administration',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'roles',
            label: 'Role & Permission Assignment',
            description: 'Assign institutional roles and manage granular access permissions',
            keywords: 'roles permissions access assignment rbac',
            icon: KeyRound,
            group: 'Governance',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'invitations',
            label: 'Activation & Invitations',
            description: 'Send account activation links and manage pending invitations',
            keywords: 'invitations activation email onboarding',
            icon: UserCheck,
            group: 'Onboarding',
            gradientClass: 'bg-emerald-700',
          },
        ],
        relatedPortals: [
          { role: 'hr', label: 'HR & Staff Directory' },
          { role: 'ai-governance', label: 'AI Governance Centre' },
        ],
      };

    case 'catalogue':
      return {
        role,
        portalTitle: 'Master Architecture Blueprint',
        portalSubtitle: 'Complete 84-Module Digital Specification, 44 DB Domains, 63 Question Types & RBAC Matrix',
        userName: 'Lead Systems Architect',
        userRegNo: 'HCA/ADMIN/2026/000',
        userTitle: 'Enterprise Architecture & Delivery Lead',
        department: 'HI-TECH Digital Transformation Office',
        campus: 'Executive Boardroom',
        defaultTab: 'modules',
        quickStats: [
          {
            label: 'System Modules',
            value: '84 Modules',
            toneClass: 'text-[#092c60]',
          },
          {
            label: 'Exam Question Formats',
            value: '63 Types',
            toneClass: 'text-blue-700',
          },
          {
          {
            label: 'Active ERP Portals',
            value: '20 Portals',
            toneClass: 'text-emerald-700',
          },
          {
            label: 'Database Domains',
            value: '44 Domains',
            toneClass: 'text-teal-700',
          },
          {
            label: 'Documentation',
            value: 'Print / PDF Ready',
            toneClass: 'text-purple-700',
          },
        ],
        navItems: [
          {
            id: 'modules',
            label: '84 Modules & Register',
            description: 'Browse full technical & functional scope of every college module',
            keywords: 'modules specification directory features',
            icon: Layers,
            group: 'Architecture',
            gradientClass: 'bg-[#092c60]',
          },
          {
            id: 'questions63',
            label: '63 CBT Question Formats',
            description: 'Complete catalogue of objective, coding & rubric assessment types',
            keywords: 'questions 63 formats exam assessment',
            icon: HelpCircle,
            group: 'Architecture',
            gradientClass: 'bg-blue-700',
          },
          {
            id: 'rbac',
            label: 'RBAC Permissions Matrix',
            description: 'Role-based security boundaries across students, staff & senate',
            keywords: 'rbac permissions security access matrix',
            icon: KeyRound,
            group: 'Governance',
            gradientClass: 'bg-emerald-700',
          },
          {
            id: 'phases',
            label: 'Phased Rollout Roadmap',
            description: 'Milestones from admissions onboarding to full AI governance',
            keywords: 'phases rollout roadmap timeline',
            icon: CheckCircle2,
            group: 'Delivery',
            gradientClass: 'bg-purple-700',
          },
          {
            id: 'budget',
            label: 'Licensing & Cost Estimates',
            description: 'Infrastructure & implementation TCO breakdown in KES',
            keywords: 'budget cost licensing financial',
            icon: CreditCard,
            group: 'Delivery',
            gradientClass: 'bg-amber-600',
          },
          {
            id: 'print_view',
            label: 'Full Printable Blueprint',
            description: 'Combined stakeholder specification formatted for print or PDF',
            keywords: 'print pdf specification export',
            icon: Printer,
            group: 'Export',
            gradientClass: 'bg-slate-800',
          },
        ],
        relatedPortals: [
          { role: 'student', label: 'Student Portal' },
          { role: 'registrar', label: 'Registrar Portal' },
          { role: 'examination', label: 'Examinations & CBT' },
        ],
      };

    default: {
      const _exhaustive: never = role;
      throw new Error(`Unknown portal role: ${_exhaustive}`);
    }
  }
}
