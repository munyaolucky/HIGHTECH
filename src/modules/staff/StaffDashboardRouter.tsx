import type { ElementType } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bed,
  Bell,
  BookMarked,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Bus,
  Calendar,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  Clock,
  CreditCard,
  FolderCheck,
  Gauge,
  Globe,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Megaphone,
  MessageSquare,
  Monitor,
  Package,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
  Vote,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  getStaffNavigation,
  hasStaffPermission,
  MODULE_PATH_TO_PORTAL_ROLE,
  STAFF_ACCOUNTS,
  type StaffRole,
  type StaffUserAccount,
} from '../../config/staff-navigation';
import type { PortalRole } from '../../types';
import RegistrationGeneratorPortal from '../../components/RegistrationGeneratorPortal';
import AdmissionsPortal from '../admissions/AdmissionsPortal';
import AIGovernancePortal from '../ai-governance/AIGovernancePortal';
import AISupportCentrePortal from '../ai-support/AISupportCentrePortal';
import CampusServicesPortal from '../campus-services/CampusServicesPortal';
import ChatbotAdminPortal from '../chatbot/ChatbotAdminPortal';
import ElectionsCommunityPortal from '../community/ElectionsCommunityPortal';
import DocumentManagementPortal from '../documents/DocumentManagementPortal';
import EngagementHubPortal from '../engagement/EngagementHubPortal';
import ExaminationPortal from '../examination/ExaminationPortal';
import FinancePortal from '../finance/FinancePortal';
import HostelsServicesPortal from '../hostels/HostelsServicesPortal';
import HRStaffPortal from '../hr/HRStaffPortal';
import LecturerPortal from '../lecturer/LecturerPortal';
import LibraryPortal from '../library/LibraryPortal';
import QualityReportsPortal from '../quality/QualityReportsPortal';
import ManualPortalRegistration from '../registration/ManualPortalRegistration';
import RegistrationWorkspace from '../registration/RegistrationWorkspace';
import RegistrarPortal from '../registrar/RegistrarPortal';
import NotificationCenterPage from '../notifications/NotificationCenterPage';
import CommunicationDashboard from '../communications/CommunicationDashboard';
import AccountSecurityPage from '../security/AccountSecurityPage';
import SignatureWorkspace from '../signatures/SignatureWorkspace';
import StudentManagementPage from '../sis/StudentManagementPage';
import PlatformBaselineWorkspace from '../catalogue/PlatformBaselineWorkspace';
import WebsiteCmsWorkspace from './website-cms/WebsiteCmsWorkspace';
import StaffEventsWorkspace, { type StaffEventsSection } from './events/StaffEventsWorkspace';
import HODAttendanceMonitor from './teaching/HODAttendanceMonitor';
import PrincipalAttendanceOversight from './teaching/PrincipalAttendanceOversight';
import AdminAttendancePolicyView from './teaching/AdminAttendancePolicyView';
import {
  DashboardEmpty,
  DashboardError,
  DashboardLoading,
} from './components/DashboardStates';
import StaffAdminDashboard from './components/StaffAdminDashboard';
import {
  StaffActivityPanel,
  StaffButton,
  StaffPageHeader,
  StaffPermissionNotice,
  StaffStatCard,
  StaffTaskList,
} from './components/StaffDashboardUI';
import { useStaffDashboard } from './hooks/useStaffDashboard';
import {
  StaffAccessDeniedView,
  StaffExecutiveApprovalsView,
  StaffOperationalModuleView,
} from './StaffOperationalViews';
import {
  StaffMessagesPage,
  StaffProfilePage,
  StaffSettingsPage,
  StaffSupportPage,
  StaffTasksPage,
} from './StaffSharedPages';

const statIconMap: Record<string, ElementType> = {
  Users,
  Building2,
  ClipboardCheck,
  Monitor,
  GraduationCap,
  BriefcaseBusiness,
  BookOpen,
  Wallet,
  CreditCard,
  UserPlus,
  AlertTriangle,
  Award,
  ShieldCheck,
  FolderCheck,
  HeartHandshake,
  Vote,
  Bed,
  CheckCircle,
  Wrench,
  Laptop,
  Calendar,
  ShoppingCart,
  Truck,
  Package,
  PackageCheck,
  Megaphone,
  MessageSquare,
  CalendarDays,
  Bell,
  Clock,
  Bus,
  Gauge,
  Globe,
  BookMarked,
};

const ROLE_DASHBOARD_META: Record<
  StaffRole,
  { title: string; description: string; primaryActionLabel?: string; primaryActionPath?: string }
> = {
  ADMIN: {
    title: 'Administration Dashboard',
    description: 'Manage authorized college operations, user roles, campuses, and institutional services.',
    primaryActionLabel: 'Users & Role Access',
    primaryActionPath: '/staff/admin/users',
  },
  PRINCIPAL: {
    title: 'Principal Dashboard',
    description: 'Monitor institutional performance, accreditation readiness, and executive approvals.',
    primaryActionLabel: 'Executive Approvals',
    primaryActionPath: '/staff/principal/approvals',
  },
  REGISTRAR: {
    title: 'Registrar Dashboard',
    description: 'Manage student records, admissions verification, academic registration, and official transcripts.',
    primaryActionLabel: 'Open Registrar Desk',
    primaryActionPath: '/staff/module/registrar',
  },
  FINANCE_OFFICER: {
    title: 'Finance Dashboard',
    description: 'Manage student accounts, M-Pesa reconciliation, receipts, and maker-checker approvals.',
    primaryActionLabel: 'Open Finance Ledger',
    primaryActionPath: '/staff/module/finance',
  },
  HR: {
    title: 'Human Resources Dashboard',
    description: 'Manage authorized employee records, independent-review contracts, leave, and attendance.',
    primaryActionLabel: 'Open HR Registry',
    primaryActionPath: '/staff/module/hr',
  },
  LECTURER: {
    title: 'Lecturer Dashboard',
    description: 'Manage assigned teaching units, lesson plans, student attendance, and CAT assessments.',
    primaryActionLabel: 'Open Teaching Workspace',
    primaryActionPath: '/staff/module/lecturer',
  },
  LIBRARIAN: {
    title: 'Library Dashboard',
    description: 'Manage physical book circulation, barcodes, reservations, and digital repository resources.',
    primaryActionLabel: 'Open Library Desk',
    primaryActionPath: '/staff/module/library',
  },
  IT_SUPPORT: {
    title: 'IT Support Dashboard',
    description: 'Manage Help Centre tickets, ICT assets, AI governance quotas, and knowledge policies.',
    primaryActionLabel: 'Open Help Centre',
    primaryActionPath: '/staff/module/ai-support',
  },
  HOD: {
    title: 'Head of Department Dashboard',
    description: 'Oversee department teaching workloads, scheme compliance, and assessment moderation.',
    primaryActionLabel: 'Review Teaching Roster',
    primaryActionPath: '/staff/module/lecturer',
  },
  ADMISSIONS_OFFICER: {
    title: 'Admissions Officer Dashboard',
    description: 'Verify applicant checklists, extend admission offers, and convert accepted applicants.',
    primaryActionLabel: 'Open Admissions Pipeline',
    primaryActionPath: '/staff/module/admissions',
  },
  EXAMINATIONS_OFFICER: {
    title: 'Examinations Officer Dashboard',
    description: 'Coordinate CBT assessments, conflict-free venue seating, incidents, and results release.',
    primaryActionLabel: 'Open Examinations Engine',
    primaryActionPath: '/staff/module/examination',
  },
  QUALITY_ASSURANCE: {
    title: 'Quality Assurance Dashboard',
    description: 'Track TVETA compliance frameworks, audit cycles, corrective actions, and evidence review.',
    primaryActionLabel: 'Open Quality & Audits',
    primaryActionPath: '/staff/module/quality-reports',
  },
  STUDENT_AFFAIRS: {
    title: 'Student Affairs Dashboard',
    description: 'Manage student welfare counselling cases, SRC elections, clubs, and career services.',
    primaryActionLabel: 'Open Welfare & Support',
    primaryActionPath: '/staff/module/hostels',
  },
  HOSTEL_OFFICER: {
    title: 'Hostel Officer Dashboard',
    description: 'Manage residences, bed allocations, resident check-in/out, visitors, and charge drafts.',
    primaryActionLabel: 'Open Hostels Desk',
    primaryActionPath: '/staff/module/hostels',
  },
  ICT_TECHNICIAN: {
    title: 'ICT & Lab Technician Dashboard',
    description: 'Monitor laboratory workstation readiness, hardware faults, and support escalations.',
    primaryActionLabel: 'Log Lab Inspection',
    primaryActionPath: '/staff/tech/labs',
  },
  PROCUREMENT_OFFICER: {
    title: 'Procurement Officer Dashboard',
    description: 'Manage purchase requisitions, local purchase orders (LPO), and prequalified vendors.',
    primaryActionLabel: 'Open Requisitions & LPOs',
    primaryActionPath: '/staff/procurement/orders',
  },
  STORES_OFFICER: {
    title: 'Stores Officer Dashboard',
    description: 'Record goods received notes (GRN), stock balances, and departmental consumables issues.',
    primaryActionLabel: 'Open Stock & GRNs',
    primaryActionPath: '/staff/stores/inventory',
  },
  COMMUNICATIONS_OFFICER: {
    title: 'Communications Dashboard',
    description: 'Publish college-wide bulletins, event updates, and stakeholder notifications.',
    primaryActionLabel: 'Open Notices & Broadcasts',
    primaryActionPath: '/staff/module/engagement',
  },
  RECEPTIONIST: {
    title: 'Front Office & Reception Dashboard',
    description: 'Log campus visitors, capture walk-in enquiries, and manage office appointments.',
    primaryActionLabel: 'Open Visitor Register',
    primaryActionPath: '/staff/reception/visitors',
  },
  SECURITY_OFFICER: {
    title: 'Campus Security Dashboard',
    description: 'Monitor gate access logs, hostel visitor verification, night escorts, and incident reports.',
    primaryActionLabel: 'Open Gate & Incident Log',
    primaryActionPath: '/staff/security/incidents',
  },
  TRANSPORT_OFFICER: {
    title: 'Transport & Fleet Dashboard',
    description: 'Coordinate inter-campus shuttles, vehicle trip logs, and fleet maintenance tracking.',
    primaryActionLabel: 'Open Fleet & Trips',
    primaryActionPath: '/staff/transport/fleet',
  },
};

export default function StaffDashboardRouter({
  role,
  user,
  activePath,
  activeCampus,
  onNavigate,
  onSwitchPortal,
  onOpenActivationPage,
  onOpenPublicPreview,
}: {
  role: StaffRole | 'UNCONFIGURED';
  user: StaffUserAccount | null;
  activePath: string;
  activeCampus: string;
  onNavigate: (path: string) => void;
  onSwitchPortal?: (role: PortalRole) => void;
  onOpenActivationPage?: (token?: string) => void;
  onOpenPublicPreview?: (publicPath: string) => void;
}) {
  const { data: dashboardData, loading, error, refetch } = useStaffDashboard(role);

  // Handle unconfigured or missing role safely
  if (role === 'UNCONFIGURED' || !user || !STAFF_ACCOUNTS[role]) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 p-6">
        <h1 className="text-lg font-bold text-amber-900 dark:text-amber-300">
          Dashboard not configured
        </h1>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
          Your account role does not yet have a dedicated dashboard or active permission scope.
          Contact the system administrator or select a valid staff role in the sidebar.
        </p>
      </div>
    );
  }

  const handleInternalPortalSwitch = (targetPortal: PortalRole) => {
    const matchingEntry = Object.entries(MODULE_PATH_TO_PORTAL_ROLE).find(
      ([, meta]) => meta.portal === targetPortal
    );
    if (matchingEntry) {
      onNavigate(matchingEntry[0]);
      return;
    }
    onSwitchPortal?.(targetPortal);
  };

  // Shared staff pages
  if (activePath === '/staff/profile') return <StaffProfilePage user={user} />;
  if (activePath === '/staff/tasks') return <StaffTasksPage user={user} />;
  if (activePath === '/staff/messages') return <StaffMessagesPage user={user} />;
  if (activePath === '/staff/notifications') {
    return <NotificationCenterPage onNavigatePath={onNavigate} />;
  }
  if (activePath === '/staff/security') {
    return <AccountSecurityPage />;
  }
  if (activePath === '/staff/communications') {
    if (!hasStaffPermission(user.permissions, 'comms.broadcast.manage')) {
      return (
        <StaffAccessDeniedView
          message="Institutional broadcasts require Communications, Registrar, Student Affairs, IT Support, Principal, or Admin role."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <CommunicationDashboard user={user} />;
  }
  if (
    activePath === '/staff/website' ||
    activePath === '/staff/website/staff' ||
    activePath === '/staff/website/departments' ||
    activePath === '/staff/website/approvals'
  ) {
    if (!hasStaffPermission(user.permissions, 'website.content.view')) {
      return (
        <StaffAccessDeniedView
          message="Website Staff & Department Content Management requires Admin, Principal, Registrar, HR, HOD, or Communications privileges."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    const cmsTab =
      activePath === '/staff/website/staff'
        ? 'staff'
        : activePath === '/staff/website/departments'
        ? 'departments'
        : activePath === '/staff/website/approvals'
        ? 'approvals'
        : 'overview';
    return (
      <WebsiteCmsWorkspace
        user={user}
        initialTab={cmsTab}
        onNavigate={onNavigate}
        onOpenPublicPreview={onOpenPublicPreview}
      />
    );
  }
  if (activePath === '/staff/events' || activePath.startsWith('/staff/events/')) {
    if (!hasStaffPermission(user.permissions, 'event.view')) {
      return (
        <StaffAccessDeniedView
          message="College Events Management & Check-In requires event.view authorization."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    const subSegment = activePath.replace(/^\/staff\/events\/?/, '').split('/')[0] || 'overview';
    const sectionMap: Record<string, StaffEventsSection> = {
      overview: 'overview',
      all: 'events',
      events: 'events',
      create: 'create',
      registrations: 'registrations',
      checkin: 'checkin',
      'check-in': 'checkin',
      venues: 'venues',
      payments: 'payments',
      invitations: 'invitations',
      certificates: 'certificates',
      feedback: 'feedback',
      media: 'media',
      reports: 'reports',
      settings: 'settings',
      logs: 'logs',
      audit: 'logs',
    };
    const initialSection: StaffEventsSection = sectionMap[subSegment] || 'overview';
    return (
      <StaffEventsWorkspace
        user={user}
        initialSection={initialSection}
        onBack={() => onNavigate('/staff/dashboard')}
        onOpenPublicPreview={onOpenPublicPreview}
      />
    );
  }
  if (activePath === '/staff/sis') {
    if (!hasStaffPermission(user.permissions, 'sis.students.read')) {
      return (
        <StaffAccessDeniedView
          message="Your role does not have authorization to view Student Information System master records."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <StudentManagementPage user={user} />;
  }
  if (activePath === '/staff/signatures') {
    if (!hasStaffPermission(user.permissions, 'staff.documents.read')) {
      return (
        <StaffAccessDeniedView
          message="Your account lacks permission to access Digital Signatures."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <SignatureWorkspace user={user} />;
  }
  if (activePath === '/staff/documents') {
    if (!hasStaffPermission(user.permissions, 'staff.documents.read')) {
      return (
        <StaffAccessDeniedView
          message="Your account lacks permission to access College Documents."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <DocumentManagementPortal user={user} />;
  }
  if (activePath === '/staff/registration') {
    if (!hasStaffPermission(user.permissions, 'staff.registration.view')) {
      return (
        <StaffAccessDeniedView
          message="Your role does not have permission to access Central User Registration & Onboarding."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <RegistrationWorkspace user={user} onOpenActivationPage={onOpenActivationPage} />;
  }
  if (activePath === '/staff/admin/users/manual-registration') {
    if (!hasStaffPermission(user.permissions, 'staff.registration.view')) {
      return (
        <StaffAccessDeniedView
          message="Manual Portal User Registration requires authorized registration permissions."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return (
      <ManualPortalRegistration
        userRole={user.role}
        onNavigateToApprovals={() => onNavigate('/staff/registration')}
        onCancel={() => onNavigate('/staff/dashboard')}
      />
    );
  }
  if (activePath === '/staff/support') {
    if (!hasStaffPermission(user.permissions, 'staff.support.access')) {
      return (
        <StaffAccessDeniedView
          message="Your account lacks permission to access the Staff Support Centre."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <StaffSupportPage user={user} />;
  }
  if (activePath === '/staff/settings') return <StaffSettingsPage user={user} />;

  // Role-specific Governance & Operational views
  if (
    activePath === '/staff/admin/users' ||
    activePath === '/staff/admin/campuses' ||
    activePath === '/staff/admin/approvals' ||
    activePath === '/staff/admin/audit'
  ) {
    if (!hasStaffPermission(user.permissions, 'admin.users.manage') && !hasStaffPermission(user.permissions, 'admin.campuses.read') && !hasStaffPermission(user.permissions, 'admin.audit.read')) {
      return (
        <StaffAccessDeniedView
          message="Administration governance views require explicit ADMIN privileges."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    const adminTab =
      activePath === '/staff/admin/campuses'
        ? 'campuses'
        : activePath === '/staff/admin/approvals'
        ? 'approvals'
        : activePath === '/staff/admin/audit'
        ? 'audit'
        : 'users';
    return <StaffAdminDashboard user={user} initialTab={adminTab} onChanged={refetch} />;
  }
  if (activePath === '/staff/admin/baseline') {
    if (!hasStaffPermission(user.permissions, 'platform.baseline.read')) {
      return (
        <StaffAccessDeniedView
          message="Access to the 84-Module Central Feature Register and Sprint 1 Baseline requires Administrator, Principal, Registrar, Quality Assurance, or IT Support privileges."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return (
      <div className="space-y-6">
        <StaffPageHeader
          title="Central Feature Register & Sprint 1 Baseline"
          description="Reconciled 12 Systems (A–L), 84 functional modules, 44 PostgreSQL domains, and institutional academic structure governance."
          breadcrumb="Governance / Feature Register"
          actions={
            <StaffButton variant="secondary" onClick={() => onNavigate('/staff/dashboard')}>
              Back to Role Dashboard
            </StaffButton>
          }
        />
        <PlatformBaselineWorkspace />
      </div>
    );
  }
  if (activePath === '/staff/principal/approvals') {
    return (
      <StaffExecutiveApprovalsView user={user} onBack={() => onNavigate('/staff/dashboard')} />
    );
  }
  if (activePath === '/staff/principal/performance') {
    if (!hasStaffPermission(user.permissions, 'principal.performance.read')) {
      return (
        <StaffAccessDeniedView
          message="Institutional performance overview requires principal.performance.read permission."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <QualityReportsPortal />;
  }
  if (activePath === '/staff/hr/operations' || activePath === '/staff/hr/attendance') {
    if (!hasStaffPermission(user.permissions, 'hr.staff.read')) {
      return (
        <StaffAccessDeniedView
          message="HR operations require hr.staff.read permission."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <HRStaffPortal />;
  }
  if (activePath === '/staff/hod/overview') {
    if (!hasStaffPermission(user.permissions, 'hod.department.read')) {
      return (
        <StaffAccessDeniedView
          message="Department overview requires hod.department.read permission."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <ExaminationPortal />;
  }
  if (activePath === '/staff/hod/attendance') {
    if (!hasStaffPermission(user.permissions, 'teaching.reports.view')) {
      return (
        <StaffAccessDeniedView
          message="Department Teaching & Attendance Monitor requires HOD or authorized teaching.reports.view permission."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <HODAttendanceMonitor user={user} onBack={() => onNavigate('/staff/dashboard')} />;
  }
  if (activePath === '/staff/principal/attendance') {
    if (!hasStaffPermission(user.permissions, 'teaching.reports.view')) {
      return (
        <StaffAccessDeniedView
          message="Institutional Teaching & Attendance Oversight requires Principal or Registrar reporting permission."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <PrincipalAttendanceOversight user={user} onBack={() => onNavigate('/staff/dashboard')} />;
  }
  if (activePath === '/staff/admin/attendance-policy') {
    if (!hasStaffPermission(user.permissions, 'teaching.policy.configure')) {
      return (
        <StaffAccessDeniedView
          message="Attendance & Escalation Policy governance requires teaching.policy.configure permission."
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }
    return <AdminAttendancePolicyView user={user} onBack={() => onNavigate('/staff/dashboard')} />;
  }

  // Generic operational logs (Procurement, Stores, Fleet, Security, Reception, Lab Tech, IT Assets)
  if (
    activePath.startsWith('/staff/it/') ||
    activePath.startsWith('/staff/tech/') ||
    activePath.startsWith('/staff/procurement/') ||
    activePath.startsWith('/staff/stores/') ||
    activePath.startsWith('/staff/reception/') ||
    activePath.startsWith('/staff/security/') ||
    activePath.startsWith('/staff/transport/')
  ) {
    return (
      <StaffOperationalModuleView
        path={activePath}
        user={user}
        activeCampus={activeCampus}
        onBack={() => onNavigate('/staff/dashboard')}
      />
    );
  }

  // Embedded ERP Domain Modules (permission-checked against role's authorized nav!)
  const moduleMeta = MODULE_PATH_TO_PORTAL_ROLE[activePath];
  if (moduleMeta) {
    const { roleItems } = getStaffNavigation(user.role, user.permissions);
    const navMatch = roleItems.find((item) => item.path === activePath);
    if (!navMatch || !hasStaffPermission(user.permissions, navMatch.permission)) {
      return (
        <StaffAccessDeniedView
          message={`Access denied: ${user.roleTitle} does not have authorization to open ${moduleMeta.title}.`}
          onBack={() => onNavigate('/staff/dashboard')}
        />
      );
    }

    const renderModule = () => {
      switch (moduleMeta.portal) {
        case 'registrar':
          return <RegistrarPortal onSwitchPortal={handleInternalPortalSwitch} />;
        case 'admissions':
          return <AdmissionsPortal onSwitchPortal={handleInternalPortalSwitch} />;
        case 'generator':
          return <RegistrationGeneratorPortal />;
        case 'finance':
          return <FinancePortal onSwitchPortal={handleInternalPortalSwitch} />;
        case 'hr':
          return <HRStaffPortal />;
        case 'lecturer':
          return <LecturerPortal />;
        case 'library':
          return <LibraryPortal onSwitchPortal={handleInternalPortalSwitch} />;
        case 'examination':
          return <ExaminationPortal />;
        case 'hostels':
          return <HostelsServicesPortal />;
        case 'quality-reports':
          return <QualityReportsPortal />;
        case 'ai-support':
          return <AISupportCentrePortal />;
        case 'ai-governance':
          return <AIGovernancePortal />;
        case 'chatbot-admin':
          return <ChatbotAdminPortal />;
        case 'campus-services':
          return <CampusServicesPortal />;
        case 'community':
          return <ElectionsCommunityPortal />;
        case 'engagement':
          return <EngagementHubPortal />;
        default:
          return null;
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-[#102D50] dark:text-white">{moduleMeta.title}</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Scoped to {user.roleTitle}</span>
          </div>
          <StaffButton variant="secondary" onClick={() => onNavigate('/staff/dashboard')}>
            Back to Role Dashboard
          </StaffButton>
        </div>
        {renderModule()}
      </div>
    );
  }

  // Default: Authenticated Role-aware Dashboard (/staff/dashboard)
  const config = ROLE_DASHBOARD_META[user.role];

  if (loading && !dashboardData) return <DashboardLoading />;
  if (error) return <DashboardError message={error} onRetry={refetch} />;
  if (!dashboardData) {
    return (
      <DashboardEmpty
        title="No dashboard summary available"
        description="Your account does not currently have summary data returned from the server."
      />
    );
  }

  const statIconKeyMap: Record<string, ElementType> = {
    staff_accounts: Users,
    student_accounts: GraduationCap,
    campuses: Building2,
    workflows: ClipboardCheck,
    departments: Building2,
    staff_headcount: Users,
    pending_approvals: ClipboardCheck,
    issued_docs: Award,
    registered_students: Users,
    open_tasks: ClipboardCheck,
    fee_statements: Wallet,
    reconciled_batches: CreditCard,
    active_staff: Users,
    pending_invites: UserPlus,
    hr_contracts: BriefcaseBusiness,
    assigned_units: GraduationCap,
    authored_docs: BookOpen,
    campus_scope: Building2,
    dept_staff: Users,
    dept_approvals: ClipboardCheck,
    my_documents: BookOpen,
    dept_documents: FolderCheck,
  };

  const formattedActivities = dashboardData.activities.map((a) => ({
    id: a.id,
    title: `${a.action.replaceAll('_', ' ')} · ${a.description}`,
    time: a.createdAt.slice(0, 16).replace('T', ' '),
    type: a.action.includes('REJECT') || a.action.includes('DELETE')
      ? ('alert' as const)
      : a.action.includes('APPROV') || a.action.includes('ISSUE') || a.action.includes('CREATE')
      ? ('success' as const)
      : ('pending' as const),
  }));

  const { roleItems } = getStaffNavigation(user.role, user.permissions);
  const quickActionItems = roleItems
    .filter((item) => item.path !== '/staff/dashboard')
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title={`Welcome, ${dashboardData.staff.fullName}`}
        description={`${config.title} · ${config.description}`}
        breadcrumb={config.title}
        actions={
          config.primaryActionPath && config.primaryActionLabel ? (
            <StaffButton onClick={() => onNavigate(config.primaryActionPath!)}>
              <span>{config.primaryActionLabel}</span>
              <ArrowRight size={15} />
            </StaffButton>
          ) : undefined
        }
      />

      <section>
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">
              Workspace overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Authenticated server scope ({dashboardData.staff.campus ?? activeCampus}).
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {dashboardData.staff.employeeNumber}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardData.statistics.map((stat) => {
            const Icon = statIconKeyMap[stat.key] ?? statIconMap[stat.key] ?? Monitor;
            return (
              <StaffStatCard
                key={stat.key}
                label={stat.label}
                value={stat.value}
                description={stat.description ?? ''}
                icon={Icon}
              />
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <StaffTaskList
          tasks={dashboardData.tasks}
          onViewAll={() => onNavigate('/staff/tasks')}
          onQuickCreate={() => onNavigate('/staff/tasks')}
          onUpdateStatus={async (taskId, status) => {
            await fetch(`/api/staff/tasks/${taskId}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            });
            refetch();
          }}
        />
        <StaffActivityPanel items={formattedActivities} />
      </section>

      {quickActionItems.length > 0 && (
        <section
          aria-labelledby="staff-quick-actions-heading"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="staff-quick-actions-heading"
                className="text-base font-bold text-[#102D50] dark:text-white"
              >
                Role Quick Actions
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Permitted workspaces for {user.roleTitle}
              </p>
            </div>
            <span className="rounded-lg bg-[#F5EBDD] dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-[#102D50] dark:text-blue-300">
              {quickActionItems.length} Active Modules
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {quickActionItems.map((action) => (
              <button
                key={action.path}
                type="button"
                onClick={() => onNavigate(action.path)}
                className="min-h-[48px] flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-slate-800/70 px-4 py-3 text-left text-xs font-semibold text-[#102D50] dark:text-slate-100 hover:border-[#1769AA] hover:bg-blue-50/70 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="truncate">{action.label}</span>
                <ArrowRight size={14} className="shrink-0 text-[#1769AA] dark:text-blue-400" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      <StaffPermissionNotice
        roleTitle={user.roleTitle}
        dataScopeSummary={user.dataScopeSummary}
        restrictedFrom={user.restrictedFrom}
      />
    </div>
  );
}
