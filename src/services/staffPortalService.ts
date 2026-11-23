import { hasStaffPermission, STAFF_ACCOUNTS, type StaffRole } from '../config/staff-navigation';
import { aiSupportCentreService } from './aiSupportCentreService';
import { campusServicesService } from './campusServicesService';
import { collegeErpService } from './collegeErpService';
import { communityService } from './communityService';
import { engagementService } from './engagementService';
import { examAssessmentService } from './examAssessmentService';
import { hostelsService } from './hostelsService';
import { hrService } from './hrService';
import { qualityDocsReportsService } from './qualityDocsReportsService';
import { registrationService } from './registrationService';

const STORAGE_KEY = 'hitech_staff_portal_workspace_v1';

export type StaffTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'URGENT';

export interface StaffTask {
  id: string;
  role: StaffRole;
  title: string;
  description: string;
  due?: string;
  status: StaffTaskStatus;
  createdAt: string;
}

export interface StaffActivityItem {
  id: string;
  role: StaffRole;
  title: string;
  time: string;
  type: 'success' | 'pending' | 'alert';
}

export interface StaffMessage {
  id: string;
  fromName: string;
  fromRole: StaffRole;
  toRole: StaffRole;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface StaffOperationalEntry {
  id: string;
  category:
    | 'PROCUREMENT_ORDER'
    | 'STORES_STOCK'
    | 'TRANSPORT_TRIP'
    | 'SECURITY_INCIDENT'
    | 'RECEPTION_VISITOR'
    | 'ICT_LAB_CHECK'
    | 'ADMIN_WORKFLOW'
    | 'IT_ASSET';
  reference: string;
  title: string;
  detail: string;
  campus: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  createdBy: string;
  createdAt: string;
}

export interface StaffStatMetric {
  label: string;
  value: string | number;
  description: string;
  iconKey: string;
  trend?: string;
  targetPath?: string;
}

interface StaffPortalState {
  tasks: StaffTask[];
  activities: StaffActivityItem[];
  messages: StaffMessage[];
  operationalEntries: StaffOperationalEntry[];
  profileOverrides: Partial<Record<StaffRole, { phone?: string; office?: string; bio?: string }>>;
}

const INITIAL_STATE: StaffPortalState = {
  tasks: [],
  activities: [],
  messages: [
    {
      id: 'smsg-1',
      fromName: 'H. Oduor (Chief Academic Registrar)',
      fromRole: 'REGISTRAR',
      toRole: 'EXAMINATIONS_OFFICER',
      subject: 'Trimester 2 Examination Schedule & Clearance Gate',
      body: 'Please verify unit registration lock status for all Diploma in ICT Level 6 candidates prior to issuing CBT sitting cards.',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'smsg-2',
      fromName: 'J. Mutua (Hostel Officer)',
      fromRole: 'HOSTEL_OFFICER',
      toRole: 'FINANCE_OFFICER',
      subject: 'Accommodation Charge Draft HCHG-2026-010 Ready for Independent Review',
      body: 'Draft Term 3 accommodation charge submitted under maker-checker separation rules. Please review and authorize.',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],
  operationalEntries: [],
  profileOverrides: {},
};

function loadState(): StaffPortalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as StaffPortalState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: StaffPortalState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage limits
  }
}

function formatShortTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 16);
  }
}

export const staffPortalService = {
  getState(): StaffPortalState {
    return loadState();
  },

  getTasksForRole(role: StaffRole): StaffTask[] {
    const state = loadState();
    return state.tasks.filter((t) => t.role === role);
  },

  addTask(input: {
    role: StaffRole;
    title: string;
    description: string;
    due?: string;
    status?: StaffTaskStatus;
  }): { ok: boolean; error?: string } {
    if (!input.title.trim()) {
      return { ok: false, error: 'Enter a task title.' };
    }
    const state = loadState();
    const task: StaffTask = {
      id: `tsk-${Date.now()}`,
      role: input.role,
      title: input.title.trim(),
      description: input.description.trim() || 'Assigned operational action item.',
      due: input.due?.trim() || undefined,
      status: input.status ?? 'PENDING',
      createdAt: new Date().toISOString(),
    };
    state.tasks.unshift(task);
    state.activities.unshift({
      id: `act-${Date.now()}`,
      role: input.role,
      title: `Created task: ${task.title}`,
      time: formatShortTime(task.createdAt),
      type: 'pending',
    });
    saveState(state);
    return { ok: true };
  },

  updateTaskStatus(taskId: string, status: StaffTaskStatus, role: StaffRole): void {
    const state = loadState();
    const target = state.tasks.find((t) => t.id === taskId && t.role === role);
    if (!target) return;
    target.status = status;
    state.activities.unshift({
      id: `act-${Date.now()}`,
      role,
      title: `Updated "${target.title}" to ${status.replaceAll('_', ' ')}`,
      time: formatShortTime(new Date().toISOString()),
      type: status === 'COMPLETED' ? 'success' : status === 'URGENT' ? 'alert' : 'pending',
    });
    saveState(state);
  },

  deleteTask(taskId: string, role: StaffRole): void {
    const state = loadState();
    const removed = state.tasks.find((t) => t.id === taskId && t.role === role);
    state.tasks = state.tasks.filter((t) => !(t.id === taskId && t.role === role));
    if (removed) {
      state.activities.unshift({
        id: `act-${Date.now()}`,
        role,
        title: `Removed task: ${removed.title}`,
        time: formatShortTime(new Date().toISOString()),
        type: 'alert',
      });
    }
    saveState(state);
  },

  getMessagesForRole(role: StaffRole): StaffMessage[] {
    const state = loadState();
    return state.messages.filter((m) => m.toRole === role || m.fromRole === role);
  },

  sendMessage(input: {
    fromRole: StaffRole;
    toRole: StaffRole;
    subject: string;
    body: string;
  }): { ok: boolean; error?: string } {
    if (!input.subject.trim() || !input.body.trim()) {
      return { ok: false, error: 'Provide both a message subject and body.' };
    }
    const sender = STAFF_ACCOUNTS[input.fromRole];
    const state = loadState();
    state.messages.unshift({
      id: `smsg-${Date.now()}`,
      fromName: `${sender.fullName} (${sender.roleTitle})`,
      fromRole: input.fromRole,
      toRole: input.toRole,
      subject: input.subject.trim(),
      body: input.body.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    });
    state.activities.unshift({
      id: `act-${Date.now()}`,
      role: input.fromRole,
      title: `Sent message "${input.subject.trim()}" to ${input.toRole.replaceAll('_', ' ')}`,
      time: formatShortTime(new Date().toISOString()),
      type: 'success',
    });
    saveState(state);
    return { ok: true };
  },

  markMessageRead(messageId: string): void {
    const state = loadState();
    const msg = state.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.read = true;
      saveState(state);
    }
  },

  updateProfileOverride(
    role: StaffRole,
    patch: { phone?: string; office?: string; bio?: string }
  ): void {
    const state = loadState();
    state.profileOverrides[role] = {
      ...state.profileOverrides[role],
      ...patch,
    };
    state.activities.unshift({
      id: `act-${Date.now()}`,
      role,
      title: 'Updated personal contact & office details',
      time: formatShortTime(new Date().toISOString()),
      type: 'success',
    });
    saveState(state);
  },

  getOperationalEntries(category: StaffOperationalEntry['category']): StaffOperationalEntry[] {
    const state = loadState();
    return state.operationalEntries.filter((e) => e.category === category);
  },

  addOperationalEntry(input: {
    role: StaffRole;
    category: StaffOperationalEntry['category'];
    title: string;
    detail: string;
    campus: string;
  }): { ok: boolean; error?: string } {
    if (!input.title.trim()) {
      return { ok: false, error: 'Enter a clear title or item description.' };
    }
    const state = loadState();
    const prefixMap: Record<StaffOperationalEntry['category'], string> = {
      PROCUREMENT_ORDER: 'LPO',
      STORES_STOCK: 'GRN',
      TRANSPORT_TRIP: 'FLT',
      SECURITY_INCIDENT: 'SEC',
      RECEPTION_VISITOR: 'VST',
      ICT_LAB_CHECK: 'LAB',
      ADMIN_WORKFLOW: 'ADM',
      IT_ASSET: 'AST',
    };
    const count = state.operationalEntries.filter((e) => e.category === input.category).length + 1;
    const reference = `${prefixMap[input.category]}-2026-${String(count).padStart(3, '0')}`;
    const actor = STAFF_ACCOUNTS[input.role];
    state.operationalEntries.unshift({
      id: `op-${Date.now()}`,
      category: input.category,
      reference,
      title: input.title.trim(),
      detail: input.detail.trim() || 'Recorded via Staff Workspace.',
      campus: input.campus,
      status: 'OPEN',
      createdBy: `${actor.fullName} (${actor.employeeNumber})`,
      createdAt: new Date().toISOString(),
    });
    state.activities.unshift({
      id: `act-${Date.now()}`,
      role: input.role,
      title: `Logged ${reference}: ${input.title.trim()}`,
      time: formatShortTime(new Date().toISOString()),
      type: 'pending',
    });
    saveState(state);
    return { ok: true };
  },

  updateOperationalEntryStatus(
    entryId: string,
    status: StaffOperationalEntry['status'],
    role: StaffRole
  ): void {
    const state = loadState();
    const target = state.operationalEntries.find((e) => e.id === entryId);
    if (!target) return;
    target.status = status;
    state.activities.unshift({
      id: `act-${Date.now()}`,
      role,
      title: `Transitioned ${target.reference} to ${status}`,
      time: formatShortTime(new Date().toISOString()),
      type: status === 'APPROVED' || status === 'COMPLETED' ? 'success' : status === 'REJECTED' ? 'alert' : 'pending',
    });
    saveState(state);
  },

  /**
   * Role-scoped dashboard summary built strictly from authorized existing services.
   * Any metric without a connected live datastore intentionally displays "—" rather than fabricated figures.
   */
  getRoleDashboardSummary(
    role: StaffRole,
    permissions: string[]
  ): {
    stats: StaffStatMetric[];
    activities: StaffActivityItem[];
  } {
    const state = loadState();
    const roleActivities = state.activities.filter((a) => a.role === role);

    const erp = collegeErpService.getState();
    const hr = hrService.getState();
    const hostels = hostelsService.getState();
    const quality = qualityDocsReportsService.getState();
    const support = aiSupportCentreService.getState();
    const campusSrv = campusServicesService.getState();
    const community = communityService.getState();
    const engagement = engagementService.getState();
    const exams = examAssessmentService.getState();
    const issuances = registrationService.getAllIssuances();

    const opCount = (cat: StaffOperationalEntry['category']) =>
      state.operationalEntries.filter((e) => e.category === cat).length;

    const activities: StaffActivityItem[] = [...roleActivities];

    switch (role) {
      case 'ADMIN': {
        const pendingPolicies = campusSrv.policies.filter((p) => p.status === 'PENDING_APPROVAL').length;
        return {
          stats: [
            {
              label: 'Staff Accounts Registry',
              value: hasStaffPermission(permissions, 'admin.users.manage') ? ALL_STAFF_COUNT() : '—',
              description: 'Configured role-scoped accounts',
              iconKey: 'Users',
              targetPath: '/staff/admin/users',
            },
            {
              label: 'Accredited Campuses',
              value: hasStaffPermission(permissions, 'admin.campuses.read') ? 3 : '—',
              description: 'Nairobi · Westlands · Mombasa',
              iconKey: 'Building2',
              targetPath: '/staff/admin/campuses',
            },
            {
              label: 'Pending Policy Approvals',
              value: hasStaffPermission(permissions, 'admin.workflows.approve') ? pendingPolicies : '—',
              description: 'Institutional governance queue',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/admin/approvals',
            },
            {
              label: 'Issued HCA Identifiers',
              value: hasStaffPermission(permissions, 'erp.generator.access') ? issuances.length : '—',
              description: 'Central Registration Registry',
              iconKey: 'Monitor',
              targetPath: '/staff/module/generator',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'PRINCIPAL': {
        const pendingContracts = hr.contracts.filter((c) => c.status === 'SUBMITTED').length;
        const openFindings = quality.findings.filter((f) => f.status !== 'CLOSED').length;
        return {
          stats: [
            {
              label: 'Active Review Cycles',
              value: hasStaffPermission(permissions, 'principal.reports.read') ? quality.reviews.length : '—',
              description: 'TVETA & QMS institutional audits',
              iconKey: 'GraduationCap',
              targetPath: '/staff/module/quality-reports',
            },
            {
              label: 'Open Quality Findings',
              value: hasStaffPermission(permissions, 'principal.reports.read') ? openFindings : '—',
              description: 'Corrective action items',
              iconKey: 'Building2',
              targetPath: '/staff/module/quality-reports',
            },
            {
              label: 'Independent Approvals',
              value: hasStaffPermission(permissions, 'principal.approvals.manage')
                ? pendingContracts + campusSrv.policies.filter((p) => p.status === 'PENDING_APPROVAL').length
                : '—',
              description: 'Contracts & policies awaiting sign-off',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/principal/approvals',
            },
            {
              label: 'Compliance Obligations',
              value: hasStaffPermission(permissions, 'principal.performance.read') ? campusSrv.obligations.length : '—',
              description: 'TVETA & ODPC regulatory trackers',
              iconKey: 'BriefcaseBusiness',
              targetPath: '/staff/module/campus-services',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'REGISTRAR': {
        const pendingApps = erp.applications.filter(
          (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
        ).length;
        return {
          stats: [
            {
              label: 'Admissions Pipeline',
              value: hasStaffPermission(permissions, 'registrar.admissions.manage') ? erp.applications.length : '—',
              description: `${pendingApps} awaiting review`,
              iconKey: 'Users',
              targetPath: '/staff/module/admissions',
            },
            {
              label: 'Issued Transcripts (TRX)',
              value: hasStaffPermission(permissions, 'registrar.transcripts.issue') ? erp.transcripts.length : '—',
              description: 'Verified academic transcripts',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/registrar',
            },
            {
              label: 'Digital Credentials',
              value: hasStaffPermission(permissions, 'registrar.records.manage') ? campusSrv.credentials.length : '—',
              description: 'QR-verifiable awards & requests',
              iconKey: 'BookOpen',
              targetPath: '/staff/module/campus-services',
            },
            {
              label: 'HCA Registrations',
              value: hasStaffPermission(permissions, 'erp.generator.access') ? issuances.length : '—',
              description: 'Atomic central registry entries',
              iconKey: 'GraduationCap',
              targetPath: '/staff/module/generator',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'FINANCE_OFFICER': {
        const totalKes = erp.transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const draftCharges = hostels.charges.filter((c) => c.status === 'DRAFT').length;
        return {
          stats: [
            {
              label: 'Recorded Receipts (KES)',
              value: hasStaffPermission(permissions, 'finance.accounts.read')
                ? `KES ${totalKes.toLocaleString()}`
                : '—',
              description: `${erp.transactions.length} ledger receipts`,
              iconKey: 'Wallet',
              targetPath: '/staff/module/finance',
            },
            {
              label: 'M-Pesa / Bank Receipts',
              value: hasStaffPermission(permissions, 'finance.mpesa.reconcile') ? erp.transactions.length : '—',
              description: 'Reconciled settlement entries',
              iconKey: 'CreditCard',
              targetPath: '/staff/module/finance',
            },
            {
              label: 'Hostel Charges Pending',
              value: hasStaffPermission(permissions, 'finance.approvals.manage') ? draftCharges : '—',
              description: 'Maker-checker approval queue',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/hostels',
            },
            {
              label: 'USD Ledger Totals',
              value: '—',
              description: 'Separate USD ledger (no mixed FX)',
              iconKey: 'Wallet',
              targetPath: '/staff/module/quality-reports',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'HR': {
        const activeStaff = hr.staff.filter((s) => s.status !== 'TERMINATED').length;
        const pendingContracts = hr.contracts.filter((c) => c.status === 'SUBMITTED').length;
        const pendingLeave = hr.leaveRequests.filter((l) => l.status === 'SUBMITTED').length;
        hr.auditLog.slice(0, 3).forEach((log) => {
          activities.push({
            id: log.id,
            role: 'HR',
            title: `${log.actor}: ${log.action}`,
            time: formatShortTime(log.timestamp),
            type: 'success',
          });
        });
        return {
          stats: [
            {
              label: 'Employee Records',
              value: hasStaffPermission(permissions, 'hr.staff.read') ? activeStaff : '—',
              description: 'Active & probation staff profiles',
              iconKey: 'Users',
              targetPath: '/staff/module/hr',
            },
            {
              label: 'Leave Applications',
              value: hasStaffPermission(permissions, 'hr.leave.review') ? pendingLeave : '—',
              description: 'Submitted awaiting review',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/hr',
            },
            {
              label: 'Contracts in Review',
              value: hasStaffPermission(permissions, 'hr.contracts.manage') ? pendingContracts : '—',
              description: 'Independent reviewer required',
              iconKey: 'BriefcaseBusiness',
              targetPath: '/staff/module/hr',
            },
            {
              label: 'Daily Attendance Logs',
              value: hasStaffPermission(permissions, 'hr.attendance.manage') ? hr.attendance.length : '—',
              description: 'Africa/Nairobi attendance records',
              iconKey: 'Building2',
              targetPath: '/staff/module/hr',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'LECTURER': {
        const publishedExams = exams.assessments.length;
        return {
          stats: [
            {
              label: 'Assigned Workloads',
              value: hasStaffPermission(permissions, 'lecturer.classes.read')
                ? hr.workloads.filter((w) => w.staffId === 'stf-1').length
                : '—',
              description: 'Active teaching & supervision units',
              iconKey: 'GraduationCap',
              targetPath: '/staff/module/lecturer',
            },
            {
              label: 'Question Bank Items',
              value: hasStaffPermission(permissions, 'lecturer.assessments.manage') ? exams.questions.length : '—',
              description: 'Peer-reviewed CBT bank items',
              iconKey: 'BookOpen',
              targetPath: '/staff/module/examination',
            },
            {
              label: 'Assessment Windows',
              value: hasStaffPermission(permissions, 'lecturer.assessments.manage') ? publishedExams : '—',
              description: 'CAT & practical assessments',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/examination',
            },
            {
              label: 'Student Groups',
              value: '—',
              description: 'Open Teaching Workspace for class rosters',
              iconKey: 'Users',
              targetPath: '/staff/module/lecturer',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'LIBRARIAN': {
        const activeLoans = erp.loans.filter((l) => l.status === 'BORROWED' || l.status === 'OVERDUE').length;
        return {
          stats: [
            {
              label: 'Physical Titles',
              value: hasStaffPermission(permissions, 'library.catalogue.manage') ? erp.books.length : '—',
              description: 'Barcoded catalogue titles',
              iconKey: 'BookOpen',
              targetPath: '/staff/module/library',
            },
            {
              label: 'Active Book Loans',
              value: hasStaffPermission(permissions, 'library.circulation.manage') ? activeLoans : '—',
              description: '14-day student & staff loans',
              iconKey: 'Users',
              targetPath: '/staff/module/library',
            },
            {
              label: 'Approved Documents',
              value: hasStaffPermission(permissions, 'library.digital.manage')
                ? quality.documents.filter((d) => d.status === 'APPROVED').length
                : '—',
              description: 'Repository policies & manuals',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/quality-reports',
            },
            {
              label: 'Overdue Items',
              value: erp.loans.filter((l) => l.status === 'OVERDUE').length,
              description: 'Tracked circulation exceptions',
              iconKey: 'BookOpen',
              targetPath: '/staff/module/library',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'IT_SUPPORT': {
        const openTickets = support.tickets.filter((t) => t.status !== 'CLOSED').length;
        const aiMsgs = Object.values(support.quota.usedCounts).reduce((a, b) => a + b, 0);
        support.auditLog.slice(0, 3).forEach((log) => {
          activities.push({
            id: log.id,
            role: 'IT_SUPPORT',
            title: `${log.actor}: ${log.action}`,
            time: formatShortTime(log.timestamp),
            type: 'pending',
          });
        });
        return {
          stats: [
            {
              label: 'Open Support Tickets',
              value: hasStaffPermission(permissions, 'it.tickets.manage') ? openTickets : '—',
              description: 'Active Help Centre queue',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/ai-support',
            },
            {
              label: 'Tracked ICT Assets',
              value: opCount('IT_ASSET') > 0 ? opCount('IT_ASSET') : '—',
              description: opCount('IT_ASSET') > 0 ? 'Logged in Assets register' : 'Log ICT assets below',
              iconKey: 'Monitor',
              targetPath: '/staff/it/assets',
            },
            {
              label: 'AI Support Queries',
              value: hasStaffPermission(permissions, 'it.ai.governance') ? aiMsgs : '—',
              description: `Month quota (${support.quota.monthKey})`,
              iconKey: 'Monitor',
              targetPath: '/staff/module/ai-governance',
            },
            {
              label: 'Published KB Articles',
              value: support.articles.filter((a) => a.status === 'PUBLISHED').length,
              description: 'PII-filtered RAG knowledge base',
              iconKey: 'BriefcaseBusiness',
              targetPath: '/staff/module/chatbot-admin',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'HOD': {
        return {
          stats: [
            {
              label: 'Department Workloads',
              value: hr.workloads.filter((w) => w.status === 'ACTIVE').length,
              description: 'Assigned teaching & supervision',
              iconKey: 'BookOpen',
              targetPath: '/staff/module/lecturer',
            },
            {
              label: 'CBT Questions',
              value: exams.questions.length,
              description: 'Moderation & rubric review pool',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/examination',
            },
            {
              label: 'Assessments',
              value: exams.assessments.length,
              description: 'Department examination drafts',
              iconKey: 'GraduationCap',
              targetPath: '/staff/module/examination',
            },
            {
              label: 'Department Staff Count',
              value: '—',
              description: 'Connect HR department roster view',
              iconKey: 'Users',
              targetPath: '/staff/hod/overview',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'ADMISSIONS_OFFICER': {
        return {
          stats: [
            {
              label: 'Active Applications',
              value: erp.applications.length,
              description: 'Submitted intake dossiers',
              iconKey: 'UserPlus',
              targetPath: '/staff/module/admissions',
            },
            {
              label: 'Enquiries CRM',
              value: campusSrv.enquiries.length,
              description: 'Prospective student enquiries',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/campus-services',
            },
            {
              label: 'Offers Extended',
              value: erp.applications.filter((a) => a.status === 'OFFER_MADE' || a.status === 'ACCEPTED').length,
              description: 'Awaiting acceptance or conversion',
              iconKey: 'GraduationCap',
              targetPath: '/staff/module/admissions',
            },
            {
              label: 'Converted Students',
              value: erp.applications.filter((a) => a.status === 'REGISTERED').length,
              description: 'Issued HCA/STU numbers',
              iconKey: 'Users',
              targetPath: '/staff/module/admissions',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'EXAMINATIONS_OFFICER': {
        return {
          stats: [
            {
              label: 'CBT Assessments',
              value: exams.assessments.length,
              description: 'Active exam definitions',
              iconKey: 'GraduationCap',
              targetPath: '/staff/module/examination',
            },
            {
              label: 'Seating Allocations',
              value: exams.seatingAllocations.length,
              description: 'Conflict-free venue seats',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/examination',
            },
            {
              label: 'Exam Incidents',
              value: exams.incidents.length,
              description: 'Invigilation reports logged',
              iconKey: 'AlertTriangle',
              targetPath: '/staff/module/examination',
            },
            {
              label: 'Transcripts Issued',
              value: erp.transcripts.length,
              description: 'Official TRX records',
              iconKey: 'Award',
              targetPath: '/staff/module/registrar',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'QUALITY_ASSURANCE': {
        return {
          stats: [
            {
              label: 'Quality Frameworks',
              value: quality.frameworks.length,
              description: 'TVETA & KNQA standards',
              iconKey: 'ShieldCheck',
              targetPath: '/staff/module/quality-reports',
            },
            {
              label: 'Audit Review Cycles',
              value: quality.reviews.length,
              description: 'Campus readiness audits',
              iconKey: 'FolderCheck',
              targetPath: '/staff/module/quality-reports',
            },
            {
              label: 'Open Findings',
              value: quality.findings.filter((f) => f.status !== 'CLOSED').length,
              description: 'Corrective action verification',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/module/quality-reports',
            },
            {
              label: 'Data Quality Alerts',
              value: campusSrv.dataQualityFindings.length,
              description: 'Read-only hygiene flags',
              iconKey: 'AlertTriangle',
              targetPath: '/staff/module/campus-services',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'STUDENT_AFFAIRS': {
        const openCases = hostels.supportRequests.filter((r) => r.status !== 'CLOSED').length;
        return {
          stats: [
            {
              label: 'Welfare & Support Cases',
              value: openCases,
              description: 'Counselling & student services',
              iconKey: 'HeartHandshake',
              targetPath: '/staff/module/hostels',
            },
            {
              label: 'Active SRC Elections',
              value: community.elections.length,
              description: 'Secret-ballot student polls',
              iconKey: 'Vote',
              targetPath: '/staff/module/community',
            },
            {
              label: 'Registered Clubs',
              value: community.clubs.length,
              description: 'Student societies & chapters',
              iconKey: 'Users',
              targetPath: '/staff/module/community',
            },
            {
              label: 'Career Opportunities',
              value: engagement.opportunities.length,
              description: 'Verified industrial attachments',
              iconKey: 'BriefcaseBusiness',
              targetPath: '/staff/module/engagement',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'HOSTEL_OFFICER': {
        const availBeds = hostels.beds.filter((b) => b.status === 'AVAILABLE').length;
        return {
          stats: [
            {
              label: 'Managed Residences',
              value: hostels.hostels.length,
              description: `${hostels.rooms.length} rooms · ${hostels.beds.length} beds`,
              iconKey: 'Bed',
              targetPath: '/staff/module/hostels',
            },
            {
              label: 'Available Beds',
              value: availBeds,
              description: 'Ready for approved allocation',
              iconKey: 'CheckCircle',
              targetPath: '/staff/module/hostels',
            },
            {
              label: 'Maintenance Tickets',
              value: hostels.maintenance.length,
              description: 'Room & bed repair queue',
              iconKey: 'Wrench',
              targetPath: '/staff/module/hostels',
            },
            {
              label: 'Expected Visitors',
              value: hostels.visitors.length,
              description: 'Resident guest check-ins',
              iconKey: 'Users',
              targetPath: '/staff/module/hostels',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'ICT_TECHNICIAN': {
        return {
          stats: [
            {
              label: 'Lab Checks Logged',
              value: opCount('ICT_LAB_CHECK') > 0 ? opCount('ICT_LAB_CHECK') : '—',
              description: 'Workstation & UPS readiness logs',
              iconKey: 'Laptop',
              targetPath: '/staff/tech/labs',
            },
            {
              label: 'Open Help Desk Queue',
              value: support.tickets.filter((t) => t.status !== 'CLOSED').length,
              description: 'Hardware & campus Wi-Fi incidents',
              iconKey: 'Wrench',
              targetPath: '/staff/module/ai-support',
            },
            {
              label: 'Hardware Assets',
              value: '—',
              description: 'Connect live lab inventory data',
              iconKey: 'Monitor',
              targetPath: '/staff/tech/labs',
            },
            {
              label: 'Preventive Schedules',
              value: '—',
              description: 'Connect maintenance calendar',
              iconKey: 'Calendar',
              targetPath: '/staff/tech/labs',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'PROCUREMENT_OFFICER': {
        return {
          stats: [
            {
              label: 'Purchase Orders (LPO)',
              value: opCount('PROCUREMENT_ORDER') > 0 ? opCount('PROCUREMENT_ORDER') : '—',
              description: 'Logged LPOs & requisitions',
              iconKey: 'ShoppingCart',
              targetPath: '/staff/procurement/orders',
            },
            {
              label: 'Prequalified Vendors',
              value: '—',
              description: 'Connect vendor master registry',
              iconKey: 'Truck',
              targetPath: '/staff/procurement/vendors',
            },
            {
              label: 'Pending Tender Bids',
              value: '—',
              description: 'Connect tendering backend',
              iconKey: 'ClipboardCheck',
              targetPath: '/staff/procurement/orders',
            },
            {
              label: 'Spend Commitments',
              value: '—',
              description: 'Connect ERP finance commitments',
              iconKey: 'Wallet',
              targetPath: '/staff/procurement/orders',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'STORES_OFFICER': {
        return {
          stats: [
            {
              label: 'Goods Received (GRN)',
              value: opCount('STORES_STOCK') > 0 ? opCount('STORES_STOCK') : '—',
              description: 'Recorded stock receipts',
              iconKey: 'Package',
              targetPath: '/staff/stores/inventory',
            },
            {
              label: 'Department Issues',
              value: '—',
              description: 'Connect stores issue ledger',
              iconKey: 'PackageCheck',
              targetPath: '/staff/stores/issues',
            },
            {
              label: 'Low Stock Alerts',
              value: '—',
              description: 'Connect live stock thresholds',
              iconKey: 'AlertTriangle',
              targetPath: '/staff/stores/inventory',
            },
            {
              label: 'Asset Tagging Queue',
              value: '—',
              description: 'Connect fixed asset register',
              iconKey: 'Package',
              targetPath: '/staff/stores/inventory',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'COMMUNICATIONS_OFFICER': {
        return {
          stats: [
            {
              label: 'Broadcast Notices',
              value: engagement.notifications.length,
              description: 'Published in-app notices',
              iconKey: 'Megaphone',
              targetPath: '/staff/module/engagement',
            },
            {
              label: 'Queued Outbox Alerts',
              value: engagement.outbox.length,
              description: 'Email & SMS stakeholder queue',
              iconKey: 'Mail',
              targetPath: '/staff/module/engagement',
            },
            {
              label: 'Campus Events',
              value: community.events.length,
              description: 'Approved institutional calendar',
              iconKey: 'Calendar',
              targetPath: '/staff/module/community',
            },
            {
              label: 'Media Releases',
              value: '—',
              description: 'Connect website CMS press feed',
              iconKey: 'Globe',
              targetPath: '/staff/documents',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'RECEPTIONIST': {
        return {
          stats: [
            {
              label: 'Logged Front Desk Visitors',
              value: opCount('RECEPTION_VISITOR') > 0 ? opCount('RECEPTION_VISITOR') : '—',
              description: 'Daily campus walk-in register',
              iconKey: 'BookMarked',
              targetPath: '/staff/reception/visitors',
            },
            {
              label: 'Prospective Enquiries',
              value: campusSrv.enquiries.length,
              description: 'Public enquiry submissions',
              iconKey: 'MessageSquare',
              targetPath: '/staff/module/campus-services',
            },
            {
              label: 'Campus Appointments',
              value: campusSrv.appointments.length,
              description: 'Scheduled office consultations',
              iconKey: 'CalendarDays',
              targetPath: '/staff/module/campus-services',
            },
            {
              label: 'Call Routing Queue',
              value: '—',
              description: 'Connect PBX telephony log',
              iconKey: 'Bell',
              targetPath: '/staff/reception/visitors',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'SECURITY_OFFICER': {
        return {
          stats: [
            {
              label: 'Security & Gate Logs',
              value: opCount('SECURITY_INCIDENT') > 0 ? opCount('SECURITY_INCIDENT') : '—',
              description: 'Recorded gate & patrol entries',
              iconKey: 'AlertTriangle',
              targetPath: '/staff/security/incidents',
            },
            {
              label: 'Expected Hostel Visitors',
              value: hostels.visitors.length,
              description: 'Authorized resident guest list',
              iconKey: 'ShieldCheck',
              targetPath: '/staff/module/hostels',
            },
            {
              label: 'Active Gate Passes',
              value: '—',
              description: 'Connect RFID/biometric gate feed',
              iconKey: 'ShieldCheck',
              targetPath: '/staff/security/incidents',
            },
            {
              label: 'Escort & Patrol Shifts',
              value: '—',
              description: 'Connect guard roster schedule',
              iconKey: 'Clock',
              targetPath: '/staff/security/incidents',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }

      case 'TRANSPORT_OFFICER': {
        return {
          stats: [
            {
              label: 'Scheduled Trips & Logs',
              value: opCount('TRANSPORT_TRIP') > 0 ? opCount('TRANSPORT_TRIP') : '—',
              description: 'Inter-campus shuttles & field trips',
              iconKey: 'Bus',
              targetPath: '/staff/transport/fleet',
            },
            {
              label: 'Active Fleet Vehicles',
              value: '—',
              description: 'Connect fleet asset database',
              iconKey: 'Truck',
              targetPath: '/staff/transport/fleet',
            },
            {
              label: 'Fuel & Mileage Entries',
              value: '—',
              description: 'Connect transport fuel logbook',
              iconKey: 'Gauge',
              targetPath: '/staff/transport/fleet',
            },
            {
              label: 'Service Due Vehicles',
              value: '—',
              description: 'Connect workshop maintenance schedule',
              iconKey: 'Wrench',
              targetPath: '/staff/transport/fleet',
            },
          ],
          activities: activities.slice(0, 6),
        };
      }
    }
  },
};

function ALL_STAFF_COUNT(): number {
  return Object.keys(STAFF_ACCOUNTS).length;
}
