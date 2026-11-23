import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Ban,
  Building2,
  ClipboardCheck,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  KeyRound,
  MailCheck,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { StaffUserAccount } from '../../config/staff-navigation';
import {
  StaffButton,
  StaffPageHeader,
  StaffStatCard,
} from '../staff/components/StaffDashboardUI';
import {
  CATEGORY_META,
  STAFF_ROLE_OPTIONS,
  STATUS_BADGE_MAP,
} from './registration.config';
import ManualPortalRegistration from './ManualPortalRegistration';
import OtherUserRegistrationForm from './OtherUserRegistrationForm';
import RegistrationApprovalsPanel from './RegistrationApprovalsPanel';
import StaffRegistrationForm from './StaffRegistrationForm';
import StudentRegistrationWizard from './StudentRegistrationWizard';
import type {
  CreateRegistrationPayload,
  DuplicateClusterItem,
  InvitationDispatchResult,
  RegistrationAuditItem,
  RegistrationCategory,
  RegistrationRecordItem,
  RegistrationWorkspacePayload,
} from './registration.types';

type WorkspaceTab =
  | 'overview'
  | 'manual-registration'
  | 'register-student'
  | 'register-staff'
  | 'register-other'
  | 'directory'
  | 'approvals'
  | 'invitations'
  | 'bulk-import'
  | 'duplicates'
  | 'audit'
  | 'settings';

const SAMPLE_CSV = `category,fullName,email,phone,identificationNumber,campusId,programmeOrTitle,proposedRole
STUDENT,Lydia Chebet Korir,lkorir@applicant.hitech.ac.ke,+254711223344,39881122,cmp-nairobi,Diploma in Information Communication Technology (Level 6),STUDENT
STUDENT,Kevin Ochieng Otieno,kotieno@applicant.hitech.ac.ke,+254722334455,38774411,cmp-westlands,Diploma in Software Engineering & Cloud Systems,STUDENT`;

interface Props {
  user: StaffUserAccount;
  onOpenActivationPage?: (token?: string) => void;
}

export default function RegistrationWorkspace({ user, onOpenActivationPage }: Props) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [otherInitialCategory, setOtherInitialCategory] = useState<RegistrationCategory>('PARENT');
  const [workspace, setWorkspace] = useState<RegistrationWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RegistrationCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail modal & action states
  const [selectedRecord, setSelectedRecord] = useState<RegistrationRecordItem | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [assignRoleValue, setAssignRoleValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Activation token dispatch & tester
  const [activationToken, setActivationToken] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [lastDispatchedInvite, setLastDispatchedInvite] = useState<{
    email: string;
    fullName: string;
    token: string;
    expiresAt: string;
  } | null>(null);

  // Bulk CSV
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [bulkPreview, setBulkPreview] = useState<{
    committed: boolean;
    importedCount: number;
    validRows: {
      rowNumber: number;
      category: string;
      fullName: string;
      email: string;
      campusId: string;
      duplicateWarning: string | null;
    }[];
    errors: { rowNumber: number; error: string; raw: string }[];
  } | null>(null);

  // Duplicates & audit
  const [duplicates, setDuplicates] = useState<DuplicateClusterItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<RegistrationAuditItem[]>([]);

  const perms = workspace?.references.registrationPermissions ?? [];
  const can = (p: string) => perms.includes(p);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/registrations?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Unable to load registration workspace (${res.status})`);
      }
      setWorkspace(json.data as RegistrationWorkspacePayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch registration data.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const loadDuplicates = useCallback(async () => {
    const res = await fetch('/api/registrations/duplicates', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setDuplicates(json.data as DuplicateClusterItem[]);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    const res = await fetch('/api/registrations/audit', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setAuditLogs(json.data as RegistrationAuditItem[]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'duplicates') loadDuplicates().catch(() => {});
    if (activeTab === 'audit') loadAuditLogs().catch(() => {});
  }, [activeTab, loadDuplicates, loadAuditLogs]);

  function notify(tone: 'success' | 'error', message: string) {
    setToast({ tone, message });
  }

  async function handleCreateRegistration(payload: CreateRegistrationPayload) {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.error || 'Failed to save registration.');
    }
    notify(
      'success',
      payload.submitImmediately
        ? `Submitted ${payload.category} registration for ${payload.fullName} into the approval queue.`
        : `Saved ${payload.category} draft for ${payload.fullName}.`
    );
    await loadWorkspace();
    setActiveTab('directory');
  }

  async function handleSubmitDraft(record: RegistrationRecordItem) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${record.id}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to submit registration.');
      }
      notify('success', `Submitted ${record.fullName} for independent approval.`);
      setSelectedRecord(json.data as RegistrationRecordItem);
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Submission error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyDocument(id: string, docIndex: number, verified: boolean) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${id}/verify-document`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docIndex, verified }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Unable to update document verification.');
      }
      const updated = json.data as RegistrationRecordItem;
      if (selectedRecord?.id === updated.id) setSelectedRecord(updated);
      notify(
        'success',
        verified ? 'Supporting document marked as verified.' : 'Document verification cleared.'
      );
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Document verification error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove(id: string, comments?: string) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: comments?.trim() || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Approval rejected.');
      }
      const updated = json.data as RegistrationRecordItem;
      notify(
        'success',
        `Approved ${updated.fullName}. Allocated ${updated.registrationNumber}. Portal access stays INACTIVE until invited.`
      );
      if (selectedRecord?.id === updated.id) setSelectedRecord(updated);
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Unable to approve registration.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestChanges(id: string, comments: string) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${id}/request-changes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Request changes failed.');
      }
      const updated = json.data as RegistrationRecordItem;
      notify('success', `Returned ${updated.fullName} for corrections.`);
      if (selectedRecord?.id === updated.id) setSelectedRecord(updated);
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Unable to request changes.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string, comments: string) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Rejection failed.');
      }
      const updated = json.data as RegistrationRecordItem;
      notify('success', `Rejected registration for ${updated.fullName}.`);
      if (selectedRecord?.id === updated.id) setSelectedRecord(updated);
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Unable to reject registration.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendInvitation(record: RegistrationRecordItem) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${record.id}/invite`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Unable to send activation invitation.');
      }
      const dispatch = json.data as InvitationDispatchResult;
      const oneTimeToken = dispatch.oneTimeActivationToken;
      if (oneTimeToken) {
        setLastDispatchedInvite({
          email: record.email,
          fullName: record.fullName,
          token: oneTimeToken,
          expiresAt: dispatch.invitation.expiresAt,
        });
        setActivationToken(oneTimeToken);
      }
      notify(
        'success',
        `Dispatched 72h single-use activation invitation to ${record.email}. Only the cryptographic hash is persisted in the database.`
      );
      setSelectedRecord(dispatch.registration);
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Invitation dispatch failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteActivation(e: React.FormEvent) {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/registrations/invitations/activate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activationToken.trim(),
          password: activationPassword,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Activation failed.');
      }
      const reg = json.data.registration as RegistrationRecordItem;
      notify(
        'success',
        `Portal access ACTIVATED for ${reg.fullName} (${reg.registrationNumber ?? reg.id}).`
      );
      setActivationToken('');
      setActivationPassword('');
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Unable to complete activation.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignRole(record: RegistrationRecordItem) {
    if (!assignRoleValue.trim()) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${record.id}/assign-role`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedRole: assignRoleValue,
          assignedPermissions: [],
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Unable to assign role.');
      }
      notify('success', `Assigned role ${assignRoleValue} to ${record.fullName}.`);
      setSelectedRecord(json.data as RegistrationRecordItem);
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Role update failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSuspendOrArchive(
    record: RegistrationRecordItem,
    mode: 'suspend' | 'archive'
  ) {
    if (actionReason.trim().length < 5) {
      notify('error', `Provide a clear ${mode} reason (at least 5 characters).`);
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/registrations/${record.id}/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionReason.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to ${mode} record.`);
      }
      notify('success', `${record.fullName} marked as ${mode === 'suspend' ? 'SUSPENDED' : 'ARCHIVED'}.`);
      setActionReason('');
      setSelectedRecord(json.data as RegistrationRecordItem);
      await loadWorkspace();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkImport(commit: boolean) {
    try {
      setActionLoading(true);
      const endpoint = commit
        ? '/api/registrations/bulk/submit'
        : '/api/registrations/bulk/validate';
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'CSV import failed.');
      }
      setBulkPreview(json.data);
      if (commit) {
        notify(
          'success',
          `Imported ${json.data.importedCount} draft registration(s) pending verification & approval.`
        );
        await loadWorkspace();
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'CSV import error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExportCsv() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);

    const res = await fetch(`/api/registrations/export?${params.toString()}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      notify('error', json?.error || 'CSV export unauthorized.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hitech-registrations.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('success', 'Downloaded authorized registration directory CSV (IDs masked).');
  }

  const summary = workspace?.summary;
  const items = workspace?.items ?? [];
  const pendingQueue = items.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status));
  const allowedRegCats = workspace?.references.allowedRegisterCategories ?? [];
  const allowedAppCats = workspace?.references.allowedApproveCategories ?? [];
  const campuses = workspace?.references.campuses ?? [];
  const departments = workspace?.references.departments ?? [];

  const navTabs: { id: WorkspaceTab; label: string; badge?: number; visible: boolean }[] = [
    { id: 'overview', label: 'Overview', visible: true },
    {
      id: 'manual-registration',
      label: 'Manual Portal Registration',
      visible: can('users.registration.create') && allowedRegCats.length > 0,
    },
    {
      id: 'register-student',
      label: 'Student Wizard',
      visible: allowedRegCats.includes('STUDENT'),
    },
    {
      id: 'register-staff',
      label: 'Register Staff',
      visible: allowedRegCats.includes('STAFF'),
    },
    {
      id: 'register-other',
      label: 'Register Others',
      visible: allowedRegCats.some((c) =>
        ['PARENT', 'ALUMNI', 'CONTRACTOR', 'PARTNER', 'GUEST'].includes(c)
      ),
    },
    { id: 'directory', label: 'User Directory', badge: items.length, visible: true },
    {
      id: 'approvals',
      label: 'Pending Approvals',
      badge: pendingQueue.length,
      visible:
        can('users.registration.approve') ||
        pendingQueue.length > 0 ||
        items.some((r) => r.status === 'CHANGES_REQUESTED'),
    },
    {
      id: 'invitations',
      label: 'Activation & Invites',
      badge: workspace?.invitations.filter((i) => i.status === 'PENDING').length ?? 0,
      visible: can('users.invitation.send') || can('users.registration.activate'),
    },
    { id: 'bulk-import', label: 'Bulk CSV Import', visible: can('users.registration.import') },
    {
      id: 'duplicates',
      label: 'Duplicates',
      badge: summary?.duplicateAlerts ?? 0,
      visible: true,
    },
    { id: 'audit', label: 'Audit Trail', visible: can('users.audit.view') },
    { id: 'settings', label: 'Numbering & RBAC', visible: true },
  ];

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Central User Registration & Onboarding"
        description="Controlled institutional onboarding separating identity account creation, college record enrolment, and portal access activation."
        breadcrumb="USER REGISTRATION"
        actions={
          <div className="flex flex-wrap gap-2">
            <StaffButton variant="secondary" onClick={loadWorkspace} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </StaffButton>
            {allowedRegCats.includes('STUDENT') && (
              <StaffButton onClick={() => setActiveTab('register-student')}>
                <UserPlus size={14} />
                <span>Register Student</span>
              </StaffButton>
            )}
          </div>
        }
      />

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200'
          }`}
        >
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xs">
        {navTabs
          .filter((t) => t.visible)
          .map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#102D50] text-white dark:bg-[#1769AA]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{t.label}</span>
                {typeof t.badge === 'number' && t.badge > 0 && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StaffStatCard
              label="Authorized Scope Records"
              value={summary.total}
              description={`${summary.drafts} draft(s) in preparation`}
              icon={Users}
            />
            <StaffStatCard
              label="Pending Verification / Approval"
              value={summary.pendingApproval}
              description="Awaiting independent approver"
              icon={ClipboardCheck}
            />
            <StaffStatCard
              label="Invited (Awaiting Activation)"
              value={summary.invitedPendingActivation}
              description={`${summary.approvedAwaitingInvite} approved, invite not yet sent`}
              icon={MailCheck}
            />
            <StaffStatCard
              label="Activated Portal Accounts"
              value={summary.activated}
              description="Identity + Record + Active Access"
              icon={UserCheck}
            />
          </div>

          {/* 3-Stage Separation Banner */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#102D50] dark:text-white">
              <ShieldCheck size={17} className="text-[#1769AA]" />
              <span>3-Stage Institutional Onboarding Architecture</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                <div className="font-bold text-[#102D50] dark:text-blue-200">
                  1. Identity Account Creation
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Captures verified personal data & duplicate checks without granting student or
                  employee privileges.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                <div className="font-bold text-[#102D50] dark:text-blue-200">
                  2. College Record Approval
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Independent approver verifies documents & assigns atomic registration number (e.g.
                  HCA/STU/2026/0001).
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                <div className="font-bold text-[#102D50] dark:text-blue-200">
                  3. Controlled Portal Activation
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Dispatches single-use 72h expiring activation link; user sets initial credentials
                  before portal access turns ACTIVE.
                </p>
              </div>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(Object.keys(CATEGORY_META) as RegistrationCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const canRegisterThis = allowedRegCats.includes(cat);
              const count = summary.byCategory[cat] ?? 0;
              return (
                <div
                  key={cat}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[#102D50] dark:text-white">
                        {meta.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-300 tabular-nums">
                        {count}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {meta.description}
                    </p>
                    <div className="mt-3 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Numbering:{' '}
                        </span>
                        <span className="font-mono">{meta.numberFormat}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Approver:{' '}
                        </span>
                        {meta.approverSummary}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter(cat);
                        setActiveTab('directory');
                      }}
                      className="text-xs font-semibold text-[#1769AA] dark:text-blue-300 hover:underline"
                    >
                      View Records
                    </button>
                    {canRegisterThis ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (cat === 'STUDENT') setActiveTab('register-student');
                          else if (cat === 'STAFF') setActiveTab('register-staff');
                          else {
                            setOtherInitialCategory(cat);
                            setActiveTab('register-other');
                          }
                        }}
                        className="rounded-lg bg-[#102D50] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1769AA]"
                      >
                        Register {meta.shortLabel}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">View / Approve Scope</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: MANUAL PORTAL REGISTRATION */}
      {activeTab === 'manual-registration' && (
        <ManualPortalRegistration
          userRole={user.role}
          canCreate={can('users.registration.create')}
          allowedCategories={allowedRegCats}
          campuses={campuses}
          departments={departments}
          programmes={workspace?.references.programmes ?? []}
          intakes={workspace?.references.intakes ?? []}
          totalAccounts={summary?.total ?? 0}
          pendingActivation={summary?.invitedPendingActivation ?? 0}
          approvedAwaitingInvite={summary?.approvedAwaitingInvite ?? 0}
          onCreated={async (created) => {
            notify(
              'success',
              `Saved ${created.fullName} (${created.category}) in registration status ${created.status}.`
            );
            await loadWorkspace();
          }}
          onNavigateToApprovals={() => setActiveTab('approvals')}
          onCancel={() => setActiveTab('overview')}
        />
      )}

      {/* TAB: REGISTER STUDENT */}
      {activeTab === 'register-student' && (
        <StudentRegistrationWizard
          campuses={campuses}
          departments={departments}
          onSubmit={handleCreateRegistration}
          onCancel={() => setActiveTab('overview')}
        />
      )}

      {/* TAB: REGISTER STAFF */}
      {activeTab === 'register-staff' && (
        <StaffRegistrationForm
          actorRole={user.role}
          campuses={campuses}
          departments={departments}
          onSubmit={handleCreateRegistration}
          onCancel={() => setActiveTab('overview')}
        />
      )}

      {/* TAB: REGISTER OTHER */}
      {activeTab === 'register-other' && (
        <OtherUserRegistrationForm
          allowedCategories={allowedRegCats}
          campuses={campuses}
          departments={departments}
          initialCategory={otherInitialCategory}
          onSubmit={handleCreateRegistration}
          onCancel={() => setActiveTab('overview')}
        />
      )}

      {/* TAB: USER DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, reg no., campus..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as RegistrationCategory | 'ALL')
                }
                aria-label="Filter by category"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Categories</option>
                {(Object.keys(CATEGORY_META) as RegistrationCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].shortLabel}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                {Object.keys(STATUS_BADGE_MAP).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_BADGE_MAP[st as keyof typeof STATUS_BADGE_MAP].label}
                  </option>
                ))}
              </select>
            </div>
            {can('users.registration.export') && (
              <StaffButton variant="secondary" onClick={handleExportCsv}>
                <Download size={14} />
                <span>Export Masked CSV</span>
              </StaffButton>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-3">Reg. Number</th>
                  <th className="py-3 pr-3">Person & Contact</th>
                  <th className="py-3 pr-3">Category / Masked ID</th>
                  <th className="py-3 pr-3">Account · Record · Portal</th>
                  <th className="py-3 pr-3">Workflow Status</th>
                  <th className="py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No registration records match your current scope and filters.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => {
                    const badge = STATUS_BADGE_MAP[r.status];
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 pr-3 font-mono font-semibold text-[#102D50] dark:text-blue-200 whitespace-nowrap">
                          {r.registrationNumber ?? 'UNASSIGNED'}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-bold text-slate-900 dark:text-white">{r.fullName}</div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {r.email} · {r.campusName}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            {r.category} ({r.proposedRole})
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            ID: {r.identificationNumberMasked}
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          <div>Acct: {r.accountStatus}</div>
                          <div>Rec: {r.collegeRecordStatus}</div>
                          <div>Access: {r.portalAccessStatus}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {r.duplicateFlag && (
                            <div className="mt-1 text-[10px] font-bold text-amber-600">
                              Duplicate Warning
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(r);
                              setAssignRoleValue(r.assignedRole ?? r.proposedRole);
                              setActionReason('');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-[#1769AA] dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye size={13} /> Open File
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PENDING APPROVALS */}
      {activeTab === 'approvals' && (
        <RegistrationApprovalsPanel
          items={items}
          allowedApproveCategories={allowedAppCats}
          user={user}
          canReject={can('users.registration.reject')}
          actionLoading={actionLoading}
          onVerifyDocument={handleVerifyDocument}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={handleRequestChanges}
          onInspectFullFile={(record) => {
            setSelectedRecord(record);
            setAssignRoleValue(record.assignedRole ?? record.proposedRole);
            setActionReason('');
          }}
        />
      )}

      {/* TAB: ACTIVATION & INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <h2 className="text-base font-extrabold text-[#102D50] dark:text-white">
              Approved Accounts & Single-Use Activation Invitations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Approved records stay INACTIVE until an authorized officer sends an expiring
              single-use activation link (never plain passwords over email).
            </p>

            {/* Approved awaiting invite */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Approved — Ready to Dispatch Invitation
              </div>
              {items.filter((r) => r.status === 'APPROVED').length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-400">
                  No approved records waiting for initial invitation.
                </div>
              ) : (
                items
                  .filter((r) => r.status === 'APPROVED')
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.fullName}{' '}
                          <span className="font-mono text-[#1769AA]">{r.registrationNumber}</span>
                        </div>
                        <div className="text-slate-500">
                          {r.email} · Role: {r.assignedRole ?? r.proposedRole}
                        </div>
                      </div>
                      <StaffButton
                        disabled={!can('users.invitation.send') || actionLoading}
                        onClick={() => handleSendInvitation(r)}
                      >
                        <Send size={13} /> Send Activation Invite
                      </StaffButton>
                    </div>
                  ))
              )}
            </div>

            {lastDispatchedInvite && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    One-Time Activation Token Dispatched for {lastDispatchedInvite.fullName}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastDispatchedInvite(null)}
                    aria-label="Dismiss dispatched token"
                    className="text-emerald-700 dark:text-emerald-300"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300">
                  Sent to {lastDispatchedInvite.email} (expires{' '}
                  {lastDispatchedInvite.expiresAt.slice(0, 16).replace('T', ' ')}). This token is
                  shown once and is never stored in plaintext in the database:
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-3 py-2">
                  <span className="font-mono font-bold text-[#102D50] dark:text-blue-200 break-all">
                    {lastDispatchedInvite.token}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActivationToken(lastDispatchedInvite.token)}
                      className="rounded-lg bg-[#102D50] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1769AA]"
                    >
                      Load Token Here
                    </button>
                    {onOpenActivationPage && (
                      <button
                        type="button"
                        onClick={() => onOpenActivationPage(lastDispatchedInvite.token)}
                        className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                      >
                        Open /activate-account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Active invitations list */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Dispatched Activation Tokens (Hashed at Rest)
              </div>
              <div className="space-y-2">
                {(workspace?.invitations ?? []).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.fullName} ({inv.category} · {inv.assignedRole})
                      </div>
                      <div className="text-slate-500">
                        {inv.email} · Hint:{' '}
                        <span className="font-mono font-semibold text-[#102D50] dark:text-blue-300">
                          {inv.tokenHint}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                          inv.status === 'PENDING'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : inv.status === 'USED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Complete Activation Form */}
          <form
            onSubmit={handleCompleteActivation}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs h-fit"
          >
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#102D50] dark:text-white">
              <KeyRound size={17} className="text-[#E8B44A]" />
              <span>Verify Token & Activate Portal Access</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Completes the final stage (`INVITED -&gt; ACTIVATED`) using a single-use token and
              initial password verification.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Single-Use Activation Token
              </label>
              <input
                value={activationToken}
                onChange={(e) => setActivationToken(e.target.value)}
                placeholder="e.g. HCA-INV-PAR001"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Portal Password (Min 8 chars)
              </label>
              <input
                type="password"
                value={activationPassword}
                onChange={(e) => setActivationPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={!can('users.registration.activate') || actionLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#12568E] disabled:opacity-50"
            >
              <UserCheck size={14} />
              <span>Activate Portal Account</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB: BULK CSV IMPORT */}
      {activeTab === 'bulk-import' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <FileSpreadsheet size={17} /> Bulk CSV Registration Import
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Validates categories against your role permissions and checks duplicates before
                creating DRAFT registrations (never auto-approved or auto-activated).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCsvText(SAMPLE_CSV)}
              className="text-xs font-semibold text-[#1769AA] hover:underline"
            >
              Reset Sample CSV
            </button>
          </div>

          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs text-slate-800 dark:text-slate-200"
          />

          <div className="flex flex-wrap gap-2">
            <StaffButton variant="secondary" onClick={() => handleBulkImport(false)} disabled={actionLoading}>
              Validate & Preview CSV
            </StaffButton>
            <StaffButton onClick={() => handleBulkImport(true)} disabled={actionLoading}>
              Commit Valid Rows as Drafts
            </StaffButton>
          </div>

          {bulkPreview && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-100">
                Preview Result: {bulkPreview.validRows.length} valid row(s),{' '}
                {bulkPreview.errors.length} rejected row(s)
              </div>
              {bulkPreview.validRows.map((row) => (
                <div
                  key={row.rowNumber}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 px-3.5 py-2"
                >
                  <span>
                    Row {row.rowNumber}: <strong>{row.fullName}</strong> ({row.category} ·{' '}
                    {row.email})
                  </span>
                  {row.duplicateWarning && (
                    <span className="font-semibold text-amber-600">{row.duplicateWarning}</span>
                  )}
                </div>
              ))}
              {bulkPreview.errors.map((errRow, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 px-3.5 py-2 text-red-700 dark:text-red-300"
                >
                  Row {errRow.rowNumber}: {errRow.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DUPLICATES */}
      {activeTab === 'duplicates' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <AlertTriangle size={17} className="text-amber-500" /> Duplicate Identity &
                Cross-Record Detector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Flags matching email addresses, normalized phone numbers, or hashed national IDs
                across registrations, students, and staff.
              </p>
            </div>
            <StaffButton variant="secondary" onClick={loadDuplicates}>
              Re-scan Records
            </StaffButton>
          </div>
          {duplicates.length === 0 ? (
            <div className="py-10 text-center text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
              No active duplicate registration alerts detected in your authorized scope.
            </div>
          ) : (
            <div className="space-y-3">
              {duplicates.map((cluster) => (
                <div
                  key={cluster.record.id}
                  className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-4 text-xs space-y-2"
                >
                  <div className="font-bold text-slate-900 dark:text-white">
                    {cluster.record.fullName} ({cluster.record.category} · {cluster.record.status})
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {cluster.record.duplicateNotes}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(cluster.record)}
                    className="font-semibold text-[#1769AA] hover:underline"
                  >
                    Inspect Record
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
            <History size={17} /> Registration Governance & Audit Log
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-bold text-[#1769AA] dark:text-blue-300">
                    {log.action}
                  </span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-800 dark:text-slate-200">{log.detail}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {log.actorName} ({log.actorRole}) · {log.createdAt.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: NUMBERING & RBAC SETTINGS */}
      {activeTab === 'settings' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-base font-extrabold text-[#102D50] dark:text-white">
            <Settings2 size={17} /> Institutional Number Sequences & Authority Matrix
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500">
                  <th className="py-2.5 pr-4">Category</th>
                  <th className="py-2.5 pr-4">Number Format (Assigned Only on Approval)</th>
                  <th className="py-2.5 pr-4">Who Can Register</th>
                  <th className="py-2.5">Who Can Approve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(Object.keys(CATEGORY_META) as RegistrationCategory[]).map((cat) => (
                  <tr key={cat}>
                    <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">
                      {CATEGORY_META[cat].label}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[#1769AA] dark:text-blue-300">
                      {CATEGORY_META[cat].numberFormat}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                      {CATEGORY_META[cat].registrarSummary}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {CATEGORY_META[cat].approverSummary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD DETAIL & LIFECYCLE INSPECTOR MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-extrabold text-[#102D50] dark:text-white">
                    {selectedRecord.fullName}
                  </h3>
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                      STATUS_BADGE_MAP[selectedRecord.status].className
                    }`}
                  >
                    {STATUS_BADGE_MAP[selectedRecord.status].label}
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs text-slate-500">
                  {selectedRecord.registrationNumber ?? 'NO REGISTRATION NO. YET'} ·{' '}
                  {selectedRecord.category} · ID {selectedRecord.identificationNumberMasked}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Separated 3-Stage Status */}
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[11px] text-slate-400">1. Identity Account</div>
                <div className="mt-1 font-bold text-slate-900 dark:text-white">
                  {selectedRecord.accountStatus}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  {selectedRecord.userAccountId ?? 'Pending approval'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[11px] text-slate-400">2. College Record</div>
                <div className="mt-1 font-bold text-slate-900 dark:text-white">
                  {selectedRecord.collegeRecordStatus}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  {selectedRecord.collegeRecordId ?? 'Pending enrolment'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[11px] text-slate-400">3. Portal Access</div>
                <div className="mt-1 font-bold text-slate-900 dark:text-white">
                  {selectedRecord.portalAccessStatus}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  Role: {selectedRecord.assignedRole ?? selectedRecord.proposedRole}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 p-4 text-xs">
              <div>
                <span className="text-slate-400">Email & Phone</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRecord.email} · {selectedRecord.phone}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Campus & Department</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRecord.campusName} · {selectedRecord.departmentName ?? 'Institutional'}
                </div>
              </div>
              {selectedRecord.studentDetails && (
                <>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Programme & Intake</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.studentDetails.programme} ({selectedRecord.studentDetails.intake})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Guardian Contact</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.studentDetails.guardianName} (
                      {selectedRecord.studentDetails.guardianPhone})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Fee Setup</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.studentDetails.feeCategory} ·{' '}
                      {selectedRecord.studentDetails.sponsorshipReference}
                    </div>
                  </div>
                </>
              )}
              {selectedRecord.staffDetails && (
                <>
                  <div>
                    <span className="text-slate-400">Job Title & Type</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.staffDetails.jobTitle} ({selectedRecord.staffDetails.employeeType})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Compensation Scale</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.staffDetails.compensationBandConfidential ?? 'Restricted'}
                    </div>
                  </div>
                </>
              )}
              {selectedRecord.otherDetails && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Stakeholder Details</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {[
                      selectedRecord.otherDetails.linkedStudentNumber &&
                        `Student: ${selectedRecord.otherDetails.linkedStudentNumber}`,
                      selectedRecord.otherDetails.relationshipToStudent &&
                        `Relation: ${selectedRecord.otherDetails.relationshipToStudent}`,
                      selectedRecord.otherDetails.organizationName &&
                        `Org: ${selectedRecord.otherDetails.organizationName}`,
                      selectedRecord.otherDetails.contractOrMouRef &&
                        `Ref: ${selectedRecord.otherDetails.contractOrMouRef}`,
                      selectedRecord.otherDetails.hostStaffName &&
                        `Host: ${selectedRecord.otherDetails.hostStaffName}`,
                      selectedRecord.otherDetails.accessExpiryDate &&
                        `Expires: ${selectedRecord.otherDetails.accessExpiryDate}`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Standard stakeholder record'}
                  </div>
                </div>
              )}
            </div>

            {/* Actions inside modal */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex flex-wrap gap-2">
                {['DRAFT', 'CHANGES_REQUESTED'].includes(selectedRecord.status) &&
                  can('users.registration.submit') && (
                    <StaffButton
                      disabled={actionLoading}
                      onClick={() => handleSubmitDraft(selectedRecord)}
                    >
                      <Send size={13} /> Submit for Approval
                    </StaffButton>
                  )}

                {['APPROVED', 'INVITED'].includes(selectedRecord.status) &&
                  can('users.invitation.send') && (
                    <StaffButton
                      disabled={actionLoading}
                      onClick={() => handleSendInvitation(selectedRecord)}
                    >
                      <MailCheck size={13} />{' '}
                      {selectedRecord.status === 'INVITED'
                        ? 'Re-issue Activation Invite'
                        : 'Send Activation Invite'}
                    </StaffButton>
                  )}
              </div>

              {['APPROVED', 'INVITED', 'ACTIVATED'].includes(selectedRecord.status) &&
                can('users.roles.assign') &&
                selectedRecord.category !== 'GUEST' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={assignRoleValue}
                      onChange={(e) => setAssignRoleValue(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="PARENT">PARENT</option>
                      <option value="ALUMNI">ALUMNI</option>
                      <option value="CONTRACTOR">CONTRACTOR</option>
                      {STAFF_ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.value}
                        </option>
                      ))}
                    </select>
                    <StaffButton
                      variant="secondary"
                      disabled={actionLoading}
                      onClick={() => handleAssignRole(selectedRecord)}
                    >
                      <Building2 size={13} /> Update Assigned Role
                    </StaffButton>
                  </div>
                )}

              {(can('users.registration.suspend') || can('users.registration.archive')) &&
                !['ARCHIVED', 'REJECTED'].includes(selectedRecord.status) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <input
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Mandatory reason to suspend or archive..."
                      className="flex-1 min-w-[200px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                    />
                    {can('users.registration.suspend') && selectedRecord.status !== 'SUSPENDED' && (
                      <StaffButton
                        variant="danger"
                        disabled={actionLoading}
                        onClick={() => handleSuspendOrArchive(selectedRecord, 'suspend')}
                      >
                        <Ban size={13} /> Suspend
                      </StaffButton>
                    )}
                    {can('users.registration.archive') && (
                      <StaffButton
                        variant="secondary"
                        disabled={actionLoading}
                        onClick={() => handleSuspendOrArchive(selectedRecord, 'archive')}
                      >
                        <Archive size={13} /> Archive
                      </StaffButton>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
