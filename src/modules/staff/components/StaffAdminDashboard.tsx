import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import {
  ALL_STAFF_ROLES,
  type StaffRole,
  type StaffUserAccount,
} from '../../../config/staff-navigation';
import {
  StaffButton,
  StaffPageHeader,
  StaffSearchToolbar,
  StaffStatusTag,
} from './StaffDashboardUI';
import { DashboardError, DashboardLoading } from './DashboardStates';

interface AdminStaffItem {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  role: StaffRole;
  roleTitle: string;
  departmentId: string;
  department: string;
  campusId: string;
  campus: string;
  permissions: string[];
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

interface AdminOverviewData {
  staffAccounts: AdminStaffItem[];
  studentAccounts: {
    id: string;
    admissionNumber: string;
    fullName: string;
    email: string;
    programme: string;
    campusName: string;
    status: string;
    createdAt: string;
  }[];
  invitations: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    departmentName: string;
    campusName: string;
    status: string;
    createdAt: string;
  }[];
  campuses: {
    id: string;
    code: string;
    name: string;
    address: string;
    phone: string;
    active: boolean;
  }[];
  departments: {
    id: string;
    code: string;
    name: string;
    campusId: string;
    active: boolean;
  }[];
  workflows: {
    id: string;
    reference: string;
    title: string;
    category: string;
    requestedByName: string;
    campusName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    decisionComment?: string;
    decidedByName?: string;
    createdAt: string;
  }[];
  auditLogs: {
    id: string;
    actorName: string;
    actorRole: string;
    action: string;
    description: string;
    createdAt: string;
  }[];
}

const KNOWN_PERMISSIONS = [
  'staff.profile.view',
  'staff.profile.update',
  'staff.dashboard.view',
  'staff.tasks.view',
  'staff.tasks.update',
  'staff.activity.view',
  'users.view',
  'users.create',
  'users.update',
  'students.view',
  'admissions.manage',
  'registration.manage',
  'academics.view',
  'examinations.manage',
  'results.manage',
  'results.approve',
  'finance.view',
  'finance.manage',
  'payments.reconcile',
  'hr.view',
  'hr.manage',
  'library.manage',
  'it.support.manage',
  'assets.manage',
  'reports.view',
  'reports.export',
];

export type AdminTab = 'users' | 'campuses' | 'approvals' | 'audit';

export default function StaffAdminDashboard({
  user,
  initialTab = 'users',
  onChanged,
}: {
  user: StaffUserAccount;
  initialTab?: AdminTab;
  onChanged?: () => void;
}) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Invite Staff form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('LECTURER');
  const [inviteCampusId, setInviteCampusId] = useState('cmp-nairobi');
  const [inviteDeptId, setInviteDeptId] = useState('dept-computing');

  // Create Student form
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuProgramme, setStuProgramme] = useState(
    'Diploma in Information Communication Technology'
  );
  const [stuCampusId, setStuCampusId] = useState('cmp-nairobi');

  // Campus & Department forms
  const [campusCode, setCampusCode] = useState('');
  const [campusName, setCampusName] = useState('');
  const [campusAddress, setCampusAddress] = useState('');
  const [campusPhone, setCampusPhone] = useState('');

  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptCampusId, setDeptCampusId] = useState('cmp-nairobi');

  // Selected staff for RBAC permission editing
  const [editingStaff, setEditingStaff] = useState<AdminStaffItem | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>('LECTURER');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // Workflow decision comment
  const [wfComment, setWfComment] = useState<Record<string, string>>({});

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/staff/admin/overview', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      setData(json.data as AdminOverviewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleInviteStaff = async () => {
    setNotice(null);
    const res = await fetch('/api/staff/admin/invitations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: inviteName,
        email: inviteEmail,
        role: inviteRole,
        campusId: inviteCampusId,
        departmentId: inviteDeptId,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Failed to create staff invitation.');
      return;
    }
    setInviteName('');
    setInviteEmail('');
    setNotice(
      `Provisioned staff invitation for ${json.data.staff.fullName} (${json.data.staff.employeeNumber}).`
    );
    await fetchOverview();
    onChanged?.();
  };

  const handleCreateStudent = async () => {
    setNotice(null);
    const res = await fetch('/api/staff/admin/students', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: stuName,
        email: stuEmail,
        programme: stuProgramme,
        campusId: stuCampusId,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Failed to provision student account.');
      return;
    }
    setStuName('');
    setStuEmail('');
    setNotice(
      `Created student account ${json.data.admissionNumber} for ${json.data.fullName}.`
    );
    await fetchOverview();
    onChanged?.();
  };

  const handleSaveStaffAccess = async () => {
    if (!editingStaff) return;
    setNotice(null);
    const res = await fetch(`/api/staff/admin/staff/${editingStaff.id}/access`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: editRole,
        permissions: editPermissions,
        status: editStatus,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Unable to update staff access.');
      return;
    }
    setNotice(
      `Updated RBAC grants for ${editingStaff.fullName} (${editPermissions.length} active permissions).`
    );
    setEditingStaff(null);
    await fetchOverview();
    onChanged?.();
  };

  const handleCreateCampus = async () => {
    setNotice(null);
    const res = await fetch('/api/staff/admin/campuses', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: campusCode,
        name: campusName,
        address: campusAddress,
        phone: campusPhone,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Could not add campus.');
      return;
    }
    setCampusCode('');
    setCampusName('');
    setCampusAddress('');
    setCampusPhone('');
    setNotice(`Added accredited campus: ${json.data.name}.`);
    await fetchOverview();
    onChanged?.();
  };

  const handleCreateDepartment = async () => {
    setNotice(null);
    const res = await fetch('/api/staff/admin/departments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: deptCode,
        name: deptName,
        campusId: deptCampusId,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Could not add department.');
      return;
    }
    setDeptCode('');
    setDeptName('');
    setNotice(`Created department ${json.data.name} (${json.data.code}).`);
    await fetchOverview();
    onChanged?.();
  };

  const handleWorkflowDecision = async (
    workflowId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    setNotice(null);
    const res = await fetch(`/api/staff/admin/workflows/${workflowId}/decide`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        comment: wfComment[workflowId] || `${decision} by System Administrator`,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Unable to decide workflow.');
      return;
    }
    setNotice(`Workflow ${json.data.reference} marked ${decision}.`);
    await fetchOverview();
    onChanged?.();
  };

  if (loading && !data) return <DashboardLoading />;
  if (error) return <DashboardError message={error} onRetry={fetchOverview} />;
  if (!data) return null;

  const filteredStaff = data.staffAccounts.filter(
    (s) =>
      !search.trim() ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="System & Institutional Administration"
        description={`Authenticated governance console for ${user.fullName} — provision users, assign granular RBAC permissions, manage campuses, and review workflows.`}
        breadcrumb="Administration"
        actions={
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {(
              [
                ['users', 'Users & RBAC'],
                ['campuses', 'Campuses & Depts'],
                ['approvals', 'Workflows'],
                ['audit', 'Governance Audit'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === key
                    ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {notice && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Staff Invitation Form */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#1769AA] dark:text-blue-400" />
                Invite New Staff Member
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Full Name
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Dr. Miriam Njeri"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Institutional Email
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="mnjeri@hitech.ac.ke"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Staff Role
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {ALL_STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Campus
                  <select
                    value={inviteCampusId}
                    onChange={(e) => setInviteCampusId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {data.campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Department
                  <select
                    value={inviteDeptId}
                    onChange={(e) => setInviteDeptId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {data.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <StaffButton onClick={handleInviteStaff}>
                <Plus size={15} /> Create Staff Invitation
              </StaffButton>
            </section>

            {/* Student Account Form */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-[#1769AA] dark:text-blue-400" />
                Create Student Portal Account
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Student Full Name
                  <input
                    type="text"
                    value={stuName}
                    onChange={(e) => setStuName(e.target.value)}
                    placeholder="e.g. Kelvin Otieno"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Student Email
                  <input
                    type="email"
                    value={stuEmail}
                    onChange={(e) => setStuEmail(e.target.value)}
                    placeholder="kotieno@student.hitech.ac.ke"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Academic Programme
                  <input
                    type="text"
                    value={stuProgramme}
                    onChange={(e) => setStuProgramme(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Host Campus
                  <select
                    value={stuCampusId}
                    onChange={(e) => setStuCampusId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {data.campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <StaffButton variant="secondary" onClick={handleCreateStudent}>
                <Plus size={15} /> Provision Student Account
              </StaffButton>
            </section>
          </div>

          {/* RBAC Permission Editor Drawer */}
          {editingStaff && (
            <section className="rounded-2xl border-2 border-[#1769AA] bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                    <KeyRound size={17} className="text-[#1769AA]" />
                    Edit Role &amp; Granular Permissions · {editingStaff.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {editingStaff.employeeNumber} · {editingStaff.email}
                  </p>
                </div>
                <StaffButton variant="secondary" onClick={() => setEditingStaff(null)}>
                  Cancel
                </StaffButton>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Assigned Staff Role
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as StaffRole)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {ALL_STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Account Status
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </label>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Granular Staff Permission Grants ({editPermissions.length} selected)
                </p>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {KNOWN_PERMISSIONS.map((perm) => {
                    const checked = editPermissions.includes(perm);
                    return (
                      <label
                        key={perm}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-mono cursor-pointer transition-colors ${
                          checked
                            ? 'border-[#1769AA] bg-[#eef4fd] dark:bg-blue-950/40 text-[#102D50] dark:text-blue-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setEditPermissions((prev) =>
                              prev.includes(perm)
                                ? prev.filter((p) => p !== perm)
                                : [...prev, perm]
                            )
                          }
                          className="accent-[#1769AA]"
                        />
                        <span className="truncate">{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <StaffButton onClick={handleSaveStaffAccess}>
                  Save Role &amp; Permissions
                </StaffButton>
              </div>
            </section>
          )}

          {/* Staff Accounts Directory Table */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                <Users size={17} /> Staff Directory &amp; Role Assignments ({data.staffAccounts.length})
              </h2>
            </div>

            <StaffSearchToolbar
              search={search}
              onSearch={setSearch}
              placeholder="Search staff name, HCA number, role, or department..."
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 pr-4">Staff No</th>
                    <th className="py-3 pr-4">Name &amp; Email</th>
                    <th className="py-3 pr-4">Role &amp; Department</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Grants</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#1769AA] dark:text-blue-400 whitespace-nowrap">
                        {s.employeeNumber}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {s.fullName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{s.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{s.role.replaceAll('_', ' ')}</div>
                        <div className="text-slate-500 dark:text-slate-400">{s.department}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <StaffStatusTag status={s.status} />
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {s.permissions.length}
                      </td>
                      <td className="py-3 text-right">
                        <StaffButton
                          variant="secondary"
                          onClick={() => {
                            setEditingStaff(s);
                            setEditRole(s.role);
                            setEditPermissions(s.permissions);
                            setEditStatus(s.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');
                          }}
                        >
                          Edit Access
                        </StaffButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Accounts Summary */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="mb-3 text-base font-bold text-[#102D50] dark:text-white">
              Registered Student Portal Accounts ({data.studentAccounts.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4">Admission No</th>
                    <th className="py-2.5 pr-4">Student</th>
                    <th className="py-2.5 pr-4">Programme</th>
                    <th className="py-2.5 pr-4">Campus</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.studentAccounts.map((st) => (
                    <tr key={st.id}>
                      <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[#1769AA] dark:text-blue-400">
                        {st.admissionNumber}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {st.fullName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{st.email}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600 dark:text-slate-300">
                        {st.programme}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600 dark:text-slate-300">
                        {st.campusName}
                      </td>
                      <td className="py-2.5">
                        <StaffStatusTag status={st.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'campuses' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {data.campuses.map((c) => (
              <article
                key={c.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#1769AA] dark:text-blue-400">
                    <Building2 size={16} /> {c.code}
                  </span>
                  <StaffStatusTag status={c.active ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <h2 className="text-base font-bold text-[#102D50] dark:text-white">{c.name}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">{c.address}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{c.phone}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white">
                Add Accredited Campus
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Campus Code
                  <input
                    type="text"
                    value={campusCode}
                    onChange={(e) => setCampusCode(e.target.value)}
                    placeholder="e.g. ELD"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Campus Name
                  <input
                    type="text"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    placeholder="Eldoret Innovation Campus"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Physical Address
                  <input
                    type="text"
                    value={campusAddress}
                    onChange={(e) => setCampusAddress(e.target.value)}
                    placeholder="Uganda Road, Eldoret"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Phone Contact
                  <input
                    type="text"
                    value={campusPhone}
                    onChange={(e) => setCampusPhone(e.target.value)}
                    placeholder="+254 700 100 209"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </label>
              </div>
              <StaffButton onClick={handleCreateCampus}>
                <Plus size={15} /> Register Campus
              </StaffButton>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white">
                Add Institutional Department
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Dept Code
                  <input
                    type="text"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="ENG"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">
                  Department Name
                  <input
                    type="text"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="School of Electrical Engineering"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Host Campus
                <select
                  value={deptCampusId}
                  onChange={(e) => setDeptCampusId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  {data.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <StaffButton variant="secondary" onClick={handleCreateDepartment}>
                <Plus size={15} /> Create Department
              </StaffButton>
            </section>
          </div>
        </div>
      )}

      {tab === 'approvals' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#1769AA]" />
            Institutional Governance Workflows ({data.workflows.length})
          </h2>
          <div className="space-y-3">
            {data.workflows.map((wf) => (
              <div
                key={wf.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400 mr-2">
                      {wf.reference}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {wf.title}
                    </span>
                  </div>
                  <StaffStatusTag status={wf.status} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Requested by {wf.requestedByName} · {wf.campusName} · Category: {wf.category}
                </p>
                {wf.decisionComment && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Decision note: {wf.decisionComment} ({wf.decidedByName})
                  </p>
                )}
                {wf.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={wfComment[wf.id] ?? ''}
                      onChange={(e) =>
                        setWfComment((prev) => ({ ...prev, [wf.id]: e.target.value }))
                      }
                      placeholder="Review note / rejection reason..."
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex gap-2">
                      <StaffButton
                        variant="success"
                        onClick={() => handleWorkflowDecision(wf.id, 'APPROVED')}
                      >
                        <CheckCircle2 size={14} /> Approve
                      </StaffButton>
                      <StaffButton
                        variant="danger"
                        onClick={() => handleWorkflowDecision(wf.id, 'REJECTED')}
                      >
                        <XCircle size={14} /> Reject
                      </StaffButton>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'audit' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#1769AA]" />
              Institutional Audit Trail
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Confidential counselling &amp; private HR records excluded
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-mono font-semibold text-[#1769AA] dark:text-blue-400 mr-2">
                    [{log.action}]
                  </span>
                  <span>{log.description}</span>
                  <span className="ml-2 text-slate-500 dark:text-slate-400">
                    ({log.actorName} · {log.actorRole})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                  {log.createdAt.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
