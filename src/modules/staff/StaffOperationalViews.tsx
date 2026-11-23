import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Download,
  Lock,
  Plus,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  ALL_STAFF_ROLES,
  hasStaffPermission,
  STAFF_ACCOUNTS,
  type StaffUserAccount,
} from '../../config/staff-navigation';
import { COLLEGE_INFO } from '../../data/college';
import { campusServicesService } from '../../services/campusServicesService';
import { hrService } from '../../services/hrService';
import { buildSafeCsv } from '../../services/qualityDocsReportsService';
import {
  staffPortalService,
  type StaffOperationalEntry,
} from '../../services/staffPortalService';
import {
  StaffButton,
  StaffPageHeader,
  StaffSearchToolbar,
  StaffStatusTag,
} from './components/StaffDashboardUI';

interface OperationalWorkspaceConfig {
  title: string;
  description: string;
  breadcrumb: string;
  category: StaffOperationalEntry['category'];
  requiredPermission: string;
  createPermission: string;
  approvePermission?: string;
  addLabel: string;
  titlePlaceholder: string;
  detailPlaceholder: string;
}

const OPERATIONAL_CONFIGS: Record<string, OperationalWorkspaceConfig> = {
  '/staff/admin/approvals': {
    title: 'Institutional Workflows & Policy Approvals',
    description: 'Review governance workflow requests and institutional approvals.',
    breadcrumb: 'Workflows & Approvals',
    category: 'ADMIN_WORKFLOW',
    requiredPermission: 'admin.workflows.approve',
    createPermission: 'admin.workflows.approve',
    approvePermission: 'admin.workflows.approve',
    addLabel: 'Log Workflow Request',
    titlePlaceholder: 'e.g. Semester 2 Academic Calendar Addendum',
    detailPlaceholder: 'Affected campuses, policy reference, and effective date...',
  },
  '/staff/it/assets': {
    title: 'ICT Assets & Network Services Register',
    description: 'Track college servers, switches, UPS units, and workstation allocations.',
    breadcrumb: 'Assets & Network',
    category: 'IT_ASSET',
    requiredPermission: 'it.assets.manage',
    createPermission: 'it.assets.manage',
    approvePermission: 'it.assets.manage',
    addLabel: 'Register ICT Asset',
    titlePlaceholder: 'e.g. Core Fiber Switch · Academic Towers Floor 4',
    detailPlaceholder: 'Serial / Asset tag, VLAN assignment, and maintenance status...',
  },
  '/staff/tech/labs': {
    title: 'Computing Laboratories & Equipment Checks',
    description: 'Daily laboratory readiness, hardware fault checks, and workstation calibration.',
    breadcrumb: 'Lab Stations & Faults',
    category: 'ICT_LAB_CHECK',
    requiredPermission: 'tech.labs.manage',
    createPermission: 'tech.labs.manage',
    approvePermission: 'tech.faults.resolve',
    addLabel: 'Log Lab Inspection',
    titlePlaceholder: 'e.g. Computing Lab 3 · 40 Workstations Pre-Exam Check',
    detailPlaceholder: 'Power backup, projector, network throughput, or faulty station ID...',
  },
  '/staff/procurement/orders': {
    title: 'Procurement Requisitions & Purchase Orders (LPO)',
    description: 'Manage departmental purchase requisitions and local purchase orders.',
    breadcrumb: 'Requisitions & LPOs',
    category: 'PROCUREMENT_ORDER',
    requiredPermission: 'procurement.orders.create',
    createPermission: 'procurement.orders.create',
    approvePermission: 'procurement.orders.create',
    addLabel: 'Create Purchase Order',
    titlePlaceholder: 'e.g. 6kVA UPS Battery Rack Replacement · Lab 2',
    detailPlaceholder: 'Vendor quote reference, quantity, and unit estimate...',
  },
  '/staff/procurement/vendors': {
    title: 'Prequalified Vendors Registry',
    description: 'Maintain supplier compliance records and vendor onboarding.',
    breadcrumb: 'Prequalified Vendors',
    category: 'PROCUREMENT_ORDER',
    requiredPermission: 'procurement.vendors.manage',
    createPermission: 'procurement.vendors.manage',
    addLabel: 'Register Vendor Entry',
    titlePlaceholder: 'e.g. Savannah Power & Systems Ltd (Category: ICT Hardware)',
    detailPlaceholder: 'KRA PIN verification, tax compliance expiry, and primary contact...',
  },
  '/staff/stores/inventory': {
    title: 'Central Stores Inventory & Goods Received (GRN)',
    description: 'Record stock receipts and track physical stores balances.',
    breadcrumb: 'Stock Inventory & GRNs',
    category: 'STORES_STOCK',
    requiredPermission: 'stores.inventory.manage',
    createPermission: 'stores.goods.receive',
    approvePermission: 'stores.inventory.manage',
    addLabel: 'Log Goods Received (GRN)',
    titlePlaceholder: 'e.g. A4 Examination Answer Booklets (50 Cartons)',
    detailPlaceholder: 'Delivery note reference, bin location, and verified quantity...',
  },
  '/staff/stores/issues': {
    title: 'Department Stock Issues',
    description: 'Issue approved stationery, laboratory consumables, and supplies to departments.',
    breadcrumb: 'Department Stock Issues',
    category: 'STORES_STOCK',
    requiredPermission: 'stores.issues.manage',
    createPermission: 'stores.issues.manage',
    approvePermission: 'stores.issues.manage',
    addLabel: 'Log Stock Issue',
    titlePlaceholder: 'e.g. Cisco Cat6 Patch Cables (25 pcs) -> ICT Lab',
    detailPlaceholder: 'Requisition reference and receiving staff registration number...',
  },
  '/staff/reception/visitors': {
    title: 'Front Office Visitor & Enquiry Register',
    description: 'Record campus walk-in visitors, parent enquiries, and reception routing.',
    breadcrumb: 'Front Desk Visitor Log',
    category: 'RECEPTION_VISITOR',
    requiredPermission: 'reception.visitors.manage',
    createPermission: 'reception.visitors.manage',
    approvePermission: 'reception.visitors.manage',
    addLabel: 'Log Campus Visitor',
    titlePlaceholder: 'e.g. Parent Consultation · Office of the Registrar',
    detailPlaceholder: 'Visitor name, ID verification type, badge number, and host office...',
  },
  '/staff/security/incidents': {
    title: 'Gate Access Control & Security Incident Log',
    description: 'Track gate passes, evening lab escort checks, and campus security incidents.',
    breadcrumb: 'Gate & Incident Log',
    category: 'SECURITY_INCIDENT',
    requiredPermission: 'security.incidents.manage',
    createPermission: 'security.incidents.manage',
    approvePermission: 'security.incidents.manage',
    addLabel: 'Log Security Entry',
    titlePlaceholder: 'e.g. Evening Computing Lab Escort & Perimeter Sweep',
    detailPlaceholder: 'Gate / Block location, guard on shift, and action taken...',
  },
  '/staff/transport/fleet': {
    title: 'College Fleet & Inter-Campus Shuttle Schedule',
    description: 'Manage college buses, inter-campus shuttle trips, and fuel/service entries.',
    breadcrumb: 'Fleet & Trips',
    category: 'TRANSPORT_TRIP',
    requiredPermission: 'transport.fleet.manage',
    createPermission: 'transport.trips.manage',
    approvePermission: 'transport.fleet.manage',
    addLabel: 'Schedule Fleet Trip',
    titlePlaceholder: 'e.g. Nairobi Main -> Westlands Tech Park Morning Shuttle',
    detailPlaceholder: 'Vehicle registration, driver assignment, and departure window...',
  },
};

export function StaffAccessDeniedView({
  title = 'Access restricted',
  message,
  onBack,
}: {
  title?: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 p-6 space-y-3">
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-base">
        <Lock size={18} />
        <span>{title}</span>
      </div>
      <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
      <div>
        <StaffButton variant="secondary" onClick={onBack}>
          Return to Dashboard
        </StaffButton>
      </div>
    </div>
  );
}

export function StaffAdminUsersView({
  user,
  onBack,
}: {
  user: StaffUserAccount;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  if (!hasStaffPermission(user.permissions, 'admin.users.manage')) {
    return (
      <StaffAccessDeniedView
        message="Your current role does not hold admin.users.manage permission."
        onBack={onBack}
      />
    );
  }

  const rows = ALL_STAFF_ROLES.map((r) => STAFF_ACCOUNTS[r]).filter(
    (acc) =>
      !search.trim() ||
      acc.fullName.toLowerCase().includes(search.toLowerCase()) ||
      acc.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
      acc.employeeNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Accounts & RBAC Permission Matrix"
        description="Inspect role scopes, campus bounds, and separation-of-duties restrictions across all 21 staff identities."
        breadcrumb="Users & Role Access"
      />
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <StaffSearchToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search staff name, role, or HCA number..."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4">Staff No</th>
                <th className="py-3 pr-4">Name &amp; Role</th>
                <th className="py-3 pr-4">Department</th>
                <th className="py-3 pr-4">Scope Summary</th>
                <th className="py-3">Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((acc) => (
                <tr key={acc.role} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#1769AA] dark:text-blue-400 whitespace-nowrap">
                    {acc.employeeNumber}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {acc.fullName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {acc.roleTitle}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">
                    {acc.department}
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                    {acc.dataScopeSummary}
                  </td>
                  <td className="py-3 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                    {acc.permissions.length} grants
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StaffAdminCampusesView({
  user,
  onBack,
}: {
  user: StaffUserAccount;
  onBack: () => void;
}) {
  if (!hasStaffPermission(user.permissions, 'admin.campuses.read')) {
    return (
      <StaffAccessDeniedView
        message="Your current role does not hold admin.campuses.read permission."
        onBack={onBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Campuses & Institutional Departments"
        description="Accredited HI-TECH College campus branches and active operational units."
        breadcrumb="Campuses & Departments"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {COLLEGE_INFO.campuses.map((c) => (
          <article
            key={c.name}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2"
          >
            <div className="flex items-center gap-2 text-[#1769AA] dark:text-blue-400">
              <Building2 size={18} />
              <span className="text-xs font-semibold">Accredited Campus</span>
            </div>
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">{c.name}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">{c.address}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{c.phone}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function StaffAdminAuditView({
  user,
  onBack,
}: {
  user: StaffUserAccount;
  onBack: () => void;
}) {
  if (!hasStaffPermission(user.permissions, 'admin.audit.read')) {
    return (
      <StaffAccessDeniedView
        message="Audit logs require admin.audit.read permission."
        onBack={onBack}
      />
    );
  }
  const campusSrv = campusServicesService.getState();
  const staffState = staffPortalService.getState();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Governance & Audit Logs"
        description="Read-only institutional compliance flags and recent Staff Workspace audit events."
        breadcrumb="Audit & Governance"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <ShieldCheck size={17} /> Data Quality &amp; Compliance Checks
          </h2>
          {campusSrv.dataQualityFindings.map((dq) => (
            <div
              key={dq.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {dq.ruleName}
                </span>
                <StaffStatusTag status={dq.severity} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{dq.detail}</p>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Record: {dq.recordRef}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white">
            Staff Portal Session Audit Trail
          </h2>
          {staffState.activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No session actions recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffState.activities.slice(0, 10).map((a) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-800 dark:text-slate-200">
                    <span className="font-mono font-semibold text-[#1769AA] dark:text-blue-400 mr-1.5">
                      [{a.role}]
                    </span>
                    {a.title}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function StaffExecutiveApprovalsView({
  user,
  onBack,
}: {
  user: StaffUserAccount;
  onBack: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  void tick;

  if (!hasStaffPermission(user.permissions, 'principal.approvals.manage')) {
    return (
      <StaffAccessDeniedView
        message="Executive approvals require principal.approvals.manage permission."
        onBack={onBack}
      />
    );
  }

  const hrState = hrService.getState();
  const pendingContracts = hrState.contracts.filter((c) => c.status === 'SUBMITTED');
  const pendingPolicies = campusServicesService
    .getState()
    .policies.filter((p) => p.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Principal Executive Approvals"
        description="Independent sign-off queue for submitted employment contracts and institutional policies."
        breadcrumb="Executive Approvals"
      />

      {feedback && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white">
            Submitted HR Contracts ({pendingContracts.length})
          </h2>
          {pendingContracts.length === 0 ? (
            <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
              No employment contracts awaiting independent review.
            </p>
          ) : (
            pendingContracts.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400">
                    {c.contractNumber} · {c.staffName}
                  </span>
                  <StaffStatusTag status={c.status} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {c.position} · {c.startDate} to {c.endDate} · Created by {c.createdByName}
                </p>
                <div className="flex gap-2 pt-1">
                  <StaffButton
                    variant="success"
                    onClick={() => {
                      const res = hrService.reviewContract({
                        contractId: c.id,
                        decision: 'APPROVE',
                        reviewerUserId: user.id,
                        reviewerName: `${user.fullName} (${user.roleTitle})`,
                        note: 'Approved by Office of the Principal.',
                      });
                      setFeedback(res.ok ? `Approved ${c.contractNumber}.` : res.error ?? 'Denied');
                      setTick((t) => t + 1);
                    }}
                  >
                    Approve Contract
                  </StaffButton>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white">
            Institutional Policies ({pendingPolicies.length})
          </h2>
          {pendingPolicies.length === 0 ? (
            <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
              All pending policies have been reviewed.
            </p>
          ) : (
            pendingPolicies.map((pol) => (
              <div
                key={pol.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400">
                    {pol.code} {pol.version}
                  </span>
                  <StaffStatusTag status={pol.status} />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{pol.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Owner: {pol.ownerRole}
                </p>
                <StaffButton
                  variant="success"
                  onClick={() => {
                    const res = campusServicesService.approvePolicy(
                      pol.id,
                      user.id,
                      `${user.fullName} (Principal)`
                    );
                    setFeedback(res.ok ? `Approved policy ${pol.code}.` : res.error ?? 'Denied');
                    setTick((t) => t + 1);
                  }}
                >
                  Approve Policy
                </StaffButton>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export function StaffOperationalModuleView({
  path,
  user,
  activeCampus,
  onBack,
}: {
  path: string;
  user: StaffUserAccount;
  activeCampus: string;
  onBack: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  void tick;
  const cfg = OPERATIONAL_CONFIGS[path];
  if (!cfg) {
    return (
      <StaffAccessDeniedView
        title="Module view unavailable"
        message="This operational workspace route is not configured for your session."
        onBack={onBack}
      />
    );
  }

  if (!hasStaffPermission(user.permissions, cfg.requiredPermission)) {
    return (
      <StaffAccessDeniedView
        message={`Your role (${user.roleTitle}) does not hold the "${cfg.requiredPermission}" permission required to view this module.`}
        onBack={onBack}
      />
    );
  }

  const canCreate = hasStaffPermission(user.permissions, cfg.createPermission);
  const canApprove =
    Boolean(cfg.approvePermission) && hasStaffPermission(user.permissions, cfg.approvePermission);

  const entries = staffPortalService.getOperationalEntries(cfg.category);
  const filtered = entries.filter((e) => {
    const matchesQ =
      !search.trim() ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.reference.toLowerCase().includes(search.toLowerCase()) ||
      e.detail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === 'ALL' || e.status === filter;
    return matchesQ && matchesStatus;
  });

  const exportCsv = () => {
    const csv = buildSafeCsv(
      ['Reference', 'Title', 'Detail', 'Campus', 'Status', 'Logged By', 'Date'],
      filtered.map((e) => [
        e.reference,
        e.title,
        e.detail,
        e.campus,
        e.status,
        e.createdBy,
        e.createdAt.slice(0, 10),
      ])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hitech-${cfg.category.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title={cfg.title}
        description={cfg.description}
        breadcrumb={cfg.breadcrumb}
        actions={
          <StaffButton variant="secondary" onClick={exportCsv}>
            <Download size={15} /> Export CSV
          </StaffButton>
        }
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <StaffSearchToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search reference or description..."
            filterOptions={['ALL', 'OPEN', 'IN_PROGRESS', 'APPROVED', 'COMPLETED']}
            activeFilter={filter}
            onFilterChange={setFilter}
          />

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No records logged yet in {cfg.breadcrumb}. Use the action panel to log the first entry.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                        {entry.reference}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{entry.campus}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {entry.detail}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <StaffStatusTag status={entry.status} />
                    {canApprove && entry.status === 'OPEN' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            staffPortalService.updateOperationalEntryStatus(
                              entry.id,
                              'COMPLETED',
                              user.role
                            );
                            setNotice(`${entry.reference} marked completed.`);
                            setTick((t) => t + 1);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          <CheckCircle2 size={13} /> Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            staffPortalService.updateOperationalEntryStatus(
                              entry.id,
                              'REJECTED',
                              user.role
                            );
                            setNotice(`${entry.reference} rejected.`);
                            setTick((t) => t + 1);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Plus size={17} /> {cfg.addLabel}
          </h2>
          {canCreate ? (
            <>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Record Title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={cfg.titlePlaceholder}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Operational Details
                <textarea
                  rows={3}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder={cfg.detailPlaceholder}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                />
              </label>
              <StaffButton
                onClick={() => {
                  const res = staffPortalService.addOperationalEntry({
                    role: user.role,
                    category: cfg.category,
                    title,
                    detail,
                    campus: activeCampus,
                  });
                  if (res.ok) {
                    setTitle('');
                    setDetail('');
                    setNotice('Entry recorded in operational register.');
                    setTick((t) => t + 1);
                  } else {
                    setNotice(res.error ?? 'Failed to add entry.');
                  }
                }}
              >
                Save Entry
              </StaffButton>
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Read-only view: your current role does not include creation privileges for this log.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
