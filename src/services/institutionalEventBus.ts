/**
 * HI-TECH College Institutional Event Bus & Channel Dispatcher
 * Dispatches and routes typed operational events to designated staff members and roles
 */

import { PortalRole } from '../types';

export type InstitutionalChannel =
  | 'academic'      // Dr. Kiprop Chemweno (Registrar) - Transcripts, Unit Changes, Deferments, Certs
  | 'finance'       // CPA Beatrice Muthoni (CFO & Bursar) - Fee Collections, Lipa na M-Pesa, Receipts
  | 'admissions'    // Grace Wangari (Senior Admissions Officer) - Applications, Offer Letters, Conversion
  | 'examination'   // Prof. Mary Wangui (Exams Director) - CBT Runs, Incidents, Moderation, Permits
  | 'faculty'       // Dr. Peter Otieno (Senior Lecturer) - Roster, Attendance, Class Requests, Grading
  | 'library'       // Samuel Ochieng (Chief Librarian) - Book Loans, Holds, Returns, Overdue Fines
  | 'hostels'       // Faith Njoroge (Hostels Warden & Welfare Lead) - Bed Allocations, Repairs, Welfare
  | 'hr'            // Beatrice Wanjiku (Senior HR Officer) - Leave Approvals, Contracts, Workloads
  | 'community'     // Alex Kipchoge (SRC Electoral Chair) - SRC Ballots, Disputes, Clubs & Societies
  | 'engagement'    // Mercy Cheptoo (Student Engagement Officer) - Broadcasts, Guardians, Attachments
  | 'quality'       // Dr. Benson Mwangi (Director of Quality) - TVETA Accreditation, Vault, CSV Audits
  | 'ai_support'    // AI Support Desk Lead - Chatbot RAG, Prompt Rollbacks, Escalated Tickets
  | 'system_admin'; // System Administrator - RBAC Roles, User Accounts, Invitations, System Audit

export interface StaffChannelAssignment {
  channel: InstitutionalChannel;
  role: PortalRole;
  staffName: string;
  staffRegNo: string;
  staffTitle: string;
  department: string;
  channelDescription: string;
}

export const STAFF_CHANNEL_REGISTRY: Record<InstitutionalChannel, StaffChannelAssignment> = {
  academic: {
    channel: 'academic',
    role: 'registrar',
    staffName: 'Dr. Kiprop Chemweno',
    staffRegNo: 'HCA/STAFF/2026/001',
    staffTitle: 'Chief Academic Registrar',
    department: 'Office of the Academic Registrar',
    channelDescription: 'Official transcripts (TRX), deferments, unit changes & graduation awards',
  },
  finance: {
    channel: 'finance',
    role: 'finance',
    staffName: 'CPA Beatrice Muthoni',
    staffRegNo: 'HCA/STAFF/2026/004',
    staffTitle: 'Chief Finance Officer & Bursar',
    department: 'Finance, Bursar & M-Pesa Treasury',
    channelDescription: 'Tuition collections, Lipa na M-Pesa STK push & official receipts ledger',
  },
  admissions: {
    channel: 'admissions',
    role: 'admissions',
    staffName: 'Grace Wangari',
    staffRegNo: 'HCA/STAFF/2026/007',
    staffTitle: 'Senior Admissions Officer',
    department: 'Admissions & Marketing',
    channelDescription: 'Applicant review queue, offer letters & one-click student conversion',
  },
  examination: {
    channel: 'examination',
    role: 'examination',
    staffName: 'Prof. Mary Wangui',
    staffRegNo: 'HCA/STAFF/2026/003',
    staffTitle: 'Chief Examinations & Moderation Officer',
    department: 'Examinations & Assessment Directorate',
    channelDescription: '63 CBT question formats, seating permits, timed exam delivery & senate marks release',
  },
  faculty: {
    channel: 'faculty',
    role: 'lecturer',
    staffName: 'Dr. Peter Otieno',
    staffRegNo: 'HCA/LECT/2026/001',
    staffTitle: 'Senior Lecturer & Computing Director',
    department: 'Faculty of Computing & Informatics',
    channelDescription: 'Classroom teaching rosters, attendance registers, lesson plans & rubric assessments',
  },
  library: {
    channel: 'library',
    role: 'library',
    staffName: 'Samuel Ochieng',
    staffRegNo: 'HCA/LIB/2026/002',
    staffTitle: 'Chief College Librarian',
    department: 'Library & Information Services',
    channelDescription: 'Physical Dewey inventory, barcode borrowing, returns, holds & digital repository',
  },
  hostels: {
    channel: 'hostels',
    role: 'hostels',
    staffName: 'Faith Njoroge',
    staffRegNo: 'HCA/STAFF/2026/009',
    staffTitle: 'Hostels Warden & Student Welfare Lead',
    department: 'Accommodation & Dean of Students',
    channelDescription: 'Residence inventory, bed bookings, room check-in & confidential welfare counselling',
  },
  hr: {
    channel: 'hr',
    role: 'hr',
    staffName: 'Beatrice Wanjiku',
    staffRegNo: 'HCA/STAFF/2026/005',
    staffTitle: 'Senior HR & People Operations Officer',
    department: 'Human Resources Directorate',
    channelDescription: 'Staff registry, contracts governance, leave approvals & weekly teaching workloads',
  },
  community: {
    channel: 'community',
    role: 'community',
    staffName: 'Alex Kipchoge',
    staffRegNo: 'HCA/STU/2026/014',
    staffTitle: 'SRC Electoral Chair & Clubs Coordinator',
    department: 'Student Representative Council',
    channelDescription: 'Secret-ballot voting, cryptographic receipts, societies & alumni mentorship',
  },
  engagement: {
    channel: 'engagement',
    role: 'engagement',
    staffName: 'Mercy Cheptoo',
    staffRegNo: 'HCA/STAFF/2026/011',
    staffTitle: 'Student Engagement & Industry Liaison Officer',
    department: 'Stakeholder Relations & Career Services',
    channelDescription: 'Institutional announcements, parent consent permissions & internship placements',
  },
  quality: {
    channel: 'quality',
    role: 'quality-reports',
    staffName: 'Dr. Benson Mwangi',
    staffRegNo: 'HCA/STAFF/2026/006',
    staffTitle: 'Director of Quality Assurance',
    department: 'Quality Assurance & Regulatory Affairs',
    channelDescription: 'TVETA accreditation self-audit, institutional document vault & CSV analytics exports',
  },
  ai_support: {
    channel: 'ai_support',
    role: 'ai-support',
    staffName: 'System AI Desk Lead',
    staffRegNo: 'HCA/STAFF/2026/012',
    staffTitle: 'AI Support Services & RAG Controller',
    department: 'AI Support Centre',
    channelDescription: '7-Role AI assistants, knowledge base indexing, PII masking & support escalations',
  },
  system_admin: {
    channel: 'system_admin',
    role: 'staff-users',
    staffName: 'System Administrator',
    staffRegNo: 'HCA/ADMIN/2026/010',
    staffTitle: 'Platform User Administration Lead',
    department: 'ICT & Systems Administration',
    channelDescription: 'Platform user accounts, security roles, activation invitations & RBAC governance',
  },
};

export interface InstitutionalEvent {
  id: string;
  channel: InstitutionalChannel;
  title: string;
  summary: string;
  severity: 'INFO' | 'ACTION_REQUIRED' | 'CRITICAL' | 'SUCCESS';
  sourceRole: string;
  targetStaffName: string;
  targetStaffRegNo: string;
  timestampIso: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  actionLabel?: string;
  actionTab?: string;
  actionRole?: PortalRole;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'hitech_institutional_events_v2';
const EVENT_BUS_SYNC_EVENT = 'hitech-channel-event-sync';

const SEED_EVENTS: InstitutionalEvent[] = [
  {
    id: 'evt-acad-1',
    channel: 'academic',
    title: 'Student Deferment Request Pending Approval',
    summary: 'Amina Wanjiku (HCA/STU/2026/001) filed a Medical Deferment request for Trimester 2 with attached hospital clearance.',
    severity: 'ACTION_REQUIRED',
    sourceRole: 'Student Portal (HCA/STU/2026/001)',
    targetStaffName: 'Dr. Kiprop Chemweno',
    targetStaffRegNo: 'HCA/STAFF/2026/001',
    timestampIso: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'PENDING',
    actionLabel: 'Review & Approve Request',
    actionTab: 'requests',
    actionRole: 'registrar',
  },
  {
    id: 'evt-acad-2',
    channel: 'academic',
    title: 'Official Transcript (TRX) Verification Required',
    summary: 'Transcript TRX-2026-0001 for Faith Chebet (GPA 3.82) generated and awaiting Registrar seal.',
    severity: 'ACTION_REQUIRED',
    sourceRole: 'Examination Board',
    targetStaffName: 'Dr. Kiprop Chemweno',
    targetStaffRegNo: 'HCA/STAFF/2026/001',
    timestampIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'PENDING',
    actionLabel: 'Sign & Seal Transcript',
    actionTab: 'transcripts',
    actionRole: 'registrar',
  },
  {
    id: 'evt-fin-1',
    channel: 'finance',
    title: 'Lipa na M-Pesa STK Settlement Received',
    summary: 'Payment receipt RCT-2026-0142 (KES 45,000) posted automatically via Daraja Paybill 890123 for student tuition.',
    severity: 'SUCCESS',
    sourceRole: 'M-Pesa STK Gateway (Safaricom Daraja)',
    targetStaffName: 'CPA Beatrice Muthoni',
    targetStaffRegNo: 'HCA/STAFF/2026/004',
    timestampIso: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'ACKNOWLEDGED',
    actionLabel: 'Inspect Receipt Ledger',
    actionTab: 'transactions',
    actionRole: 'finance',
  },
  {
    id: 'evt-adm-1',
    channel: 'admissions',
    title: 'New Online Application Awaiting Review',
    summary: 'Kevin Ochieng submitted application APP-2026-0842 for Diploma in Software Engineering with Mean Grade C+.',
    severity: 'ACTION_REQUIRED',
    sourceRole: 'Public Website Admissions Portal',
    targetStaffName: 'Grace Wangari',
    targetStaffRegNo: 'HCA/STAFF/2026/007',
    timestampIso: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: 'PENDING',
    actionLabel: 'Review Application',
    actionTab: 'applications',
    actionRole: 'admissions',
  },
  {
    id: 'evt-exam-1',
    channel: 'examination',
    title: 'Candidate CBT Attempt Completed',
    summary: 'Candidate Amina Wanjiku completed CSC 301 Data Structures test (Score: 88% - 44/50). Auto-graded successfully.',
    severity: 'SUCCESS',
    sourceRole: 'Student CBT Exam Runner',
    targetStaffName: 'Prof. Mary Wangui',
    targetStaffRegNo: 'HCA/STAFF/2026/003',
    timestampIso: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    status: 'ACKNOWLEDGED',
    actionLabel: 'Open CBT Marking Studio',
    actionTab: 'marking',
    actionRole: 'examination',
  },
  {
    id: 'evt-hostel-1',
    channel: 'hostels',
    title: 'Bed Allocation Application Submitted',
    summary: 'Student Brian Omondi submitted accommodation booking for Kilimanjaro Residence Room 102 Bed B-02.',
    severity: 'ACTION_REQUIRED',
    sourceRole: 'Student Accommodation Desk',
    targetStaffName: 'Faith Njoroge',
    targetStaffRegNo: 'HCA/STAFF/2026/009',
    timestampIso: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    status: 'PENDING',
    actionLabel: 'Assign & Approve Bed',
    actionTab: 'allocations',
    actionRole: 'hostels',
  },
  {
    id: 'evt-hr-1',
    channel: 'hr',
    title: 'Faculty Academic Leave Request',
    summary: 'Dr. Peter Otieno applied for 4 days of academic research leave for IEEE ICT Conference attendance.',
    severity: 'ACTION_REQUIRED',
    sourceRole: 'Faculty Portal (HCA/LECT/2026/001)',
    targetStaffName: 'Beatrice Wanjiku',
    targetStaffRegNo: 'HCA/STAFF/2026/005',
    timestampIso: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'PENDING',
    actionLabel: 'Approve Faculty Leave',
    actionTab: 'leave',
    actionRole: 'hr',
  },
  {
    id: 'evt-lib-1',
    channel: 'library',
    title: 'Circulation Hold Placed on Dewey 005.133',
    summary: 'Reserve hold placed on "Modern Software Engineering Principles" by student HCA/STU/2026/001.',
    severity: 'INFO',
    sourceRole: 'Central Library OPAC',
    targetStaffName: 'Samuel Ochieng',
    targetStaffRegNo: 'HCA/LIB/2026/002',
    timestampIso: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    status: 'ACKNOWLEDGED',
    actionLabel: 'View Circulation Desk',
    actionTab: 'circulation',
    actionRole: 'library',
  },
  {
    id: 'evt-sys-1',
    channel: 'system_admin',
    title: 'Account Invitation Awaiting Email Activation',
    summary: '1 newly provisioned staff account (HCA/STAFF/2026/014) pending user verification.',
    severity: 'INFO',
    sourceRole: 'Platform User Provisioning',
    targetStaffName: 'System Administrator',
    targetStaffRegNo: 'HCA/ADMIN/2026/010',
    timestampIso: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    status: 'PENDING',
    actionLabel: 'Manage Account Invitations',
    actionTab: 'invitations',
    actionRole: 'staff-users',
  },
];

class InstitutionalEventBusService {
  private events: InstitutionalEvent[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.events = JSON.parse(raw);
      } else {
        this.events = [...SEED_EVENTS];
        this.persist();
      }
    } catch {
      this.events = [...SEED_EVENTS];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch {
      // storage quota fallback
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_BUS_SYNC_EVENT));
      window.dispatchEvent(new CustomEvent('hitech-erp-sync'));
    }
  }

  public getAllEvents(): InstitutionalEvent[] {
    return [...this.events].sort(
      (a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime()
    );
  }

  public getEventsForChannel(channel: InstitutionalChannel): InstitutionalEvent[] {
    return this.getAllEvents().filter((e) => e.channel === channel);
  }

  public getEventsForRole(role: PortalRole): InstitutionalEvent[] {
    const channelEntry = Object.values(STAFF_CHANNEL_REGISTRY).find((c) => c.role === role);
    if (!channelEntry) return [];
    return this.getEventsForChannel(channelEntry.channel);
  }

  public getUnreadCountForRole(role: PortalRole): number {
    return this.getEventsForRole(role).filter((e) => e.status === 'PENDING').length;
  }

  public getTotalPendingCount(): number {
    return this.events.filter((e) => e.status === 'PENDING').length;
  }

  public publish(eventData: Omit<InstitutionalEvent, 'id' | 'timestampIso' | 'status'> & { id?: string; status?: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' }): InstitutionalEvent {
    const channelDef = STAFF_CHANNEL_REGISTRY[eventData.channel];
    const newEvent: InstitutionalEvent = {
      id: eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel: eventData.channel,
      title: eventData.title,
      summary: eventData.summary,
      severity: eventData.severity,
      sourceRole: eventData.sourceRole,
      targetStaffName: eventData.targetStaffName || channelDef?.staffName || 'Institutional Officer',
      targetStaffRegNo: eventData.targetStaffRegNo || channelDef?.staffRegNo || 'HCA/STAFF/2026/001',
      timestampIso: new Date().toISOString(),
      status: eventData.status || 'PENDING',
      actionLabel: eventData.actionLabel,
      actionTab: eventData.actionTab,
      actionRole: eventData.actionRole || channelDef?.role,
      metadata: eventData.metadata,
    };

    this.events.unshift(newEvent);
    // Keep max 100 historical events
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
    this.persist();
    return newEvent;
  }

  public markStatus(eventId: string, status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'): boolean {
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) return false;
    ev.status = status;
    this.persist();
    return true;
  }

  public markChannelAllResolved(channel: InstitutionalChannel): void {
    this.events.forEach((e) => {
      if (e.channel === channel) e.status = 'RESOLVED';
    });
    this.persist();
  }

  public subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_BUS_SYNC_EVENT, listener);
    return () => window.removeEventListener(EVENT_BUS_SYNC_EVENT, listener);
  }
}

export const institutionalEventBus = new InstitutionalEventBusService();
