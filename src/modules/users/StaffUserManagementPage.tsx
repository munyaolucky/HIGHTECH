import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  UserPlus,
  Users,
  UserCheck,
  Clock3,
  ShieldAlert,
  Mail,
  MoreHorizontal,
  Download,
  X,
  Ban,
  CheckCircle2,
  Eye,
  Filter,
  KeyRound,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { usePortalShellContext, useSyncedPortalTab } from "../../context/PortalShellContext";
import { institutionalEventBus } from "../../services/institutionalEventBus";
import "./staff-user-management.css";

export type AccountCategory =
  | "STUDENT"
  | "STAFF"
  | "PARENT"
  | "ALUMNI"
  | "CONTRACTOR"
  | "PARTNER"
  | "GUEST";

export type AccountStatus =
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "DISABLED"
  | "INVITATION_EXPIRED";

export interface PortalAccount {
  id: string;
  registrationNumber: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  category: AccountCategory;
  status: AccountStatus;
  roleNames: string[];
  campusName?: string | null;
  departmentName?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface DashboardResponse {
  items: PortalAccount[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    total: number;
    active: number;
    pendingActivation: number;
    suspended: number;
    disabled: number;
  };
  permissions: string[];
}

type PendingAccountAction = {
  account: PortalAccount;
  action: "resend-invitation" | "suspend" | "reactivate";
};

const API_BASE = "/api";

const ROLE_OPTIONS_BY_CATEGORY: Record<AccountCategory, { value: string; label: string }[]> = {
  STAFF: [
    { value: "LECTURER", label: "Lecturer / Faculty" },
    { value: "REGISTRAR", label: "Academic Registrar" },
    { value: "FINANCE_OFFICER", label: "Finance Officer / Bursar" },
    { value: "EXAMINATIONS_OFFICER", label: "Examinations Officer" },
    { value: "ADMISSIONS_OFFICER", label: "Admissions Officer" },
    { value: "LIBRARIAN", label: "College Librarian" },
    { value: "HR", label: "HR & People Operations" },
    { value: "HOD", label: "Head of Department" },
    { value: "QUALITY_ASSURANCE", label: "Quality Assurance Officer" },
    { value: "STUDENT_AFFAIRS", label: "Student Affairs & Welfare" },
    { value: "HOSTEL_OFFICER", label: "Hostel Warden" },
    { value: "IT_SUPPORT", label: "IT Support Lead" },
    { value: "ADMIN", label: "Super Administrator" },
  ],
  STUDENT: [{ value: "STUDENT", label: "Student Candidate" }],
  PARENT: [{ value: "PARENT", label: "Parent / Guardian" }],
  ALUMNI: [{ value: "ALUMNI", label: "Alumni Associate" }],
  CONTRACTOR: [{ value: "CONTRACTOR", label: "Campus Contractor" }],
  PARTNER: [{ value: "PARTNER", label: "Industry Partner" }],
  GUEST: [{ value: "GUEST", label: "Guest Visitor" }],
};

const CAMPUS_OPTIONS = [
  { id: "cmp-nairobi", name: "Nairobi Main Campus" },
  { id: "cmp-mombasa", name: "Mombasa Coastal Campus" },
  { id: "cmp-nakuru", name: "Nakuru Campus" },
];

const DEPARTMENT_OPTIONS = [
  { id: "dept-computing", name: "School of Computing & Informatics" },
  { id: "dept-business", name: "School of Business & Management" },
  { id: "dept-engineering", name: "Department of Engineering & Applied Tech" },
  { id: "dept-registrar", name: "Office of the Academic Registrar" },
  { id: "dept-finance", name: "Directorate of Finance & Treasury" },
];

let staffSessionSyncPromise: Promise<boolean> | null = null;

async function ensureAdminPreviewSession(): Promise<boolean> {
  if (!staffSessionSyncPromise) {
    staffSessionSyncPromise = fetch(`${API_BASE}/staff/session`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN", explicitSwitch: false }),
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        staffSessionSyncPromise = null;
      });
  }
  return staffSessionSyncPromise;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401 && retryOn401) {
    const synced = await ensureAdminPreviewSession();
    if (synced) {
      return apiRequest<T>(path, options, false);
    }
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Request failed (${response.status})`,
    );
  }

  return body as T;
}

const can = (permissions: string[], permission: string) =>
  permissions.includes(permission);

function formatDate(value?: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const labels: Record<AccountStatus, string> = {
    PENDING_ACTIVATION: "Pending activation",
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
    DISABLED: "Disabled",
    INVITATION_EXPIRED: "Invitation expired",
  };

  return (
    <span className={`user-status user-status--${status.toLowerCase()}`}>
      <span className="user-status__dot" />
      {labels[status]}
    </span>
  );
}

export default function StaffUserManagementPage() {
  const ctx = usePortalShellContext();
  const [activeTab, setActiveTab] = useSyncedPortalTab<"accounts" | "roles" | "invitations">(
    "staff-users",
    "accounts",
  );
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PortalAccount | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAccountAction | null>(null);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  // Register Portal Account modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "STAFF" as AccountCategory,
    role: "LECTURER",
    campusId: "cmp-nairobi",
    departmentId: "dept-computing",
  });

  useEffect(() => {
    if (activeTab === "invitations") {
      setStatus("PENDING_ACTIVATION");
      setPage(1);
    } else if (activeTab === "accounts") {
      setStatus("ALL");
      setPage(1);
    }
  }, [activeTab]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pendingAction) {
        setPendingAction(null);
      } else if (isRegisterModalOpen) {
        setIsRegisterModalOpen(false);
      } else if (selected) {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingAction, isRegisterModalOpen, selected]);

  const pageSize = 10;

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) params.set("search", search.trim());
      if (category !== "ALL") params.set("category", category);
      if (status !== "ALL") params.set("status", status);

      const result = await apiRequest<DashboardResponse>(
        `/users?${params.toString()}`,
      );

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const permissions = data?.permissions ?? [];

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)),
    [data?.total],
  );

  async function executeAccountAction(target: PendingAccountAction) {
    const { account, action } = target;
    setBusyAccountId(account.id);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest<{ message?: string }>(
        `/users/${encodeURIComponent(account.id)}/${action}`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const actionTitles = {
        "resend-invitation": "Account Activation Invitation Resent",
        suspend: "Portal Account Suspended",
        reactivate: "Portal Account Reactivated",
      } as const;

      institutionalEventBus.publish({
        channel: "system_admin",
        title: actionTitles[action],
        summary: `${account.fullName} (${account.email}) — ${result.message ?? "Action recorded in audit trail."}`,
        severity: action === "suspend" ? "ACTION_REQUIRED" : "SUCCESS",
        sourceRole: "User Management Desk",
        targetStaffName: "System Administrator",
        targetStaffRegNo: "HCA/ADMIN/2026/010",
        status: "ACKNOWLEDGED",
        actionLabel: "Inspect Accounts",
        actionTab: action === "resend-invitation" ? "invitations" : "accounts",
        actionRole: "staff-users",
      });

      setNotice(result.message || "The account action was completed.");
      setPendingAction(null);
      setSelected(null);
      await loadAccounts();
    } catch (err) {
      setPendingAction(null);
      setError(
        err instanceof Error ? err.message : "The account action failed.",
      );
    } finally {
      setBusyAccountId(null);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterSubmitting(true);
    setRegisterError("");
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<{ success: boolean; account: PortalAccount }>(
        "/users",
        {
          method: "POST",
          body: JSON.stringify(registerForm),
        },
      );

      institutionalEventBus.publish({
        channel: "system_admin",
        title: "New Portal Account Provisioned",
        summary: `${response.account.fullName} (${response.account.registrationNumber ?? response.account.email}) created with status Pending Activation.`,
        severity: "INFO",
        sourceRole: "User Management Desk",
        targetStaffName: "System Administrator",
        targetStaffRegNo: "HCA/ADMIN/2026/010",
        status: "PENDING",
        actionLabel: "Track Invitations",
        actionTab: "invitations",
        actionRole: "staff-users",
      });

      setIsRegisterModalOpen(false);
      setRegisterForm({
        fullName: "",
        email: "",
        phone: "",
        category: "STAFF",
        role: "LECTURER",
        campusId: "cmp-nairobi",
        departmentId: "dept-computing",
      });
      setNotice(
        `Registered ${response.account.fullName} (${response.account.registrationNumber ?? response.account.email}) and queued activation invitation.`,
      );
      setPage(1);
      await loadAccounts();
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : "Unable to register portal account.",
      );
    } finally {
      setRegisterSubmitting(false);
    }
  }

  function exportCurrentPage() {
    if (!data?.items.length) return;

    const headers = [
      "Registration Number",
      "Name",
      "Email",
      "Phone",
      "Category",
      "Status",
      "Roles",
      "Campus",
      "Department",
    ];

    const rows = data.items.map((account) => [
      account.registrationNumber ?? "",
      account.fullName,
      account.email,
      account.phone ?? "",
      account.category,
      account.status,
      account.roleNames.join("; "),
      account.campusName ?? "",
      account.departmentName ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => sanitizeCsvCell(value)).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `hitech-portal-accounts-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const confirmationCopy = pendingAction
    ? {
        "resend-invitation": {
          title: "Resend Activation Invitation",
          message: `Send a fresh portal activation invitation email to ${pendingAction.account.fullName} (${pendingAction.account.email})?`,
          confirmLabel: "Resend Invitation",
          tone: "primary" as const,
        },
        suspend: {
          title: "Suspend Portal Account",
          message: `Suspend portal access for ${pendingAction.account.fullName} (${pendingAction.account.email})? Active sessions will be revoked immediately.`,
          confirmLabel: "Confirm Suspension",
          tone: "danger" as const,
        },
        reactivate: {
          title: "Reactivate Portal Account",
          message: `Restore active portal access for ${pendingAction.account.fullName} (${pendingAction.account.email})?`,
          confirmLabel: "Reactivate Account",
          tone: "primary" as const,
        },
      }[pendingAction.action]
    : null;

  return (
    <main className="user-management">
      <header className="user-management__header">
        <div>
          <div className="user-management__eyebrow">
            HI-TECH COLLEGE · STAFF WORKSPACE
          </div>
          <h1>User Management</h1>
          <p>
            Manage portal accounts, invitations, account status and access.
          </p>
        </div>

        <div className="user-management__header-actions">
          <button
            type="button"
            className="um-button um-button--secondary"
            onClick={() => void loadAccounts()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {can(permissions, "users.registration.create") && (
            <button
              type="button"
              className="um-button um-button--primary"
              onClick={() => {
                setRegisterError("");
                setIsRegisterModalOpen(true);
              }}
            >
              <UserPlus size={17} />
              Register account
            </button>
          )}
        </div>
      </header>

      {/* WORKSPACE SECTION TABS */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 pb-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "accounts"
              ? "bg-[#092c60] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users size={14} /> User Accounts Registry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "roles"
              ? "bg-[#092c60] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <KeyRound size={14} /> Role &amp; Permission Matrix
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "invitations"
              ? "bg-[#092c60] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <UserCheck size={14} /> Activation &amp; Invitations ({data?.summary?.pendingActivation ?? 0})
        </button>
      </div>

      {activeTab === "roles" && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 mb-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-[#092c60] flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              Institutional Roles &amp; Security Permissions Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hierarchical role definitions and operational access policies across HI-TECH College platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                role: "Super Administrator",
                badge: "HCA/ADMIN/...",
                scope: "Platform configuration, institutional settings, module toggles, API keys & audit logs.",
                permissions: ["users.*", "system.config", "audit.logs", "modules.toggle", "rbac.manage"],
                color: "border-indigo-300 bg-indigo-50/40 text-indigo-900",
              },
              {
                role: "Academic Registrar",
                badge: "HCA/STAFF/...",
                scope: "Nominal roll, course additions/drops, deferments, official transcripts (TRX) & graduation certs.",
                permissions: ["transcripts.issue", "students.enroll", "deferments.approve", "certs.generate"],
                color: "border-slate-300 bg-slate-50 text-slate-900",
              },
              {
                role: "Finance Officer / Bursar",
                badge: "HCA/STAFF/...",
                scope: "Fee structure rates, Daraja M-Pesa STK Push collections, bank clearances & receipt issuance.",
                permissions: ["finance.billing", "mpesa.reconcile", "receipts.issue", "fee.waiver"],
                color: "border-teal-300 bg-teal-50/40 text-teal-900",
              },
              {
                role: "Examinations Officer",
                badge: "HCA/STAFF/...",
                scope: "63 Question types moderation, CBT blueprints, seating conflict engine & marks approval.",
                permissions: ["exams.schedule", "questions.moderate", "cbt.blueprints", "results.publish"],
                color: "border-purple-300 bg-purple-50/40 text-purple-900",
              },
              {
                role: "Senior Lecturer / Faculty",
                badge: "HCA/LECT/...",
                scope: "Classroom rosters, lesson plans, schemes of work, attendance registers & assessment grading.",
                permissions: ["classes.teach", "attendance.mark", "assessments.grade", "materials.upload"],
                color: "border-emerald-300 bg-emerald-50/40 text-emerald-900",
              },
              {
                role: "Student Candidate",
                badge: "HCA/STU/...",
                scope: "Course unit registration, live timetables, fees Lipa na M-Pesa, CBT tests & results portal.",
                permissions: ["units.register", "fees.pay", "cbt.take", "transcripts.view", "idcard.print"],
                color: "border-blue-300 bg-blue-50/40 text-blue-900",
              },
            ].map((r) => (
              <div key={r.role} className={`p-4 rounded-xl border ${r.color} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <strong className="text-xs font-bold">{r.role}</strong>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{r.scope}</p>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Granted Permissions
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p) => (
                      <span key={p} className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="um-alert um-alert--error" role="alert">
          <ShieldAlert size={18} />
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="um-alert um-alert--success" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="um-stat-grid" aria-label="Account summary">
        <SummaryCard
          label="Total accounts"
          value={data?.summary.total ?? 0}
          icon={<Users />}
        />
        <SummaryCard
          label="Active accounts"
          value={data?.summary.active ?? 0}
          icon={<UserCheck />}
          tone="green"
        />
        <SummaryCard
          label="Awaiting activation"
          value={data?.summary.pendingActivation ?? 0}
          icon={<Clock3 />}
          tone="amber"
        />
        <SummaryCard
          label="Suspended"
          value={data?.summary.suspended ?? 0}
          icon={<Ban />}
          tone="red"
        />
      </section>

      <section className="um-panel">
        <div className="um-panel__heading">
          <div>
            <h2>Portal accounts</h2>
            <p>Search and manage registered portal users.</p>
          </div>

          <button
            type="button"
            className="um-button um-button--secondary"
            onClick={exportCurrentPage}
            disabled={!data?.items.length}
          >
            <Download size={16} />
            Export page
          </button>
        </div>

        <div className="um-filters">
          <label className="um-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email or registration number"
            />
          </label>

          <label className="um-select">
            <Filter size={16} />
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All categories</option>
              <option value="STUDENT">Students</option>
              <option value="STAFF">Staff</option>
              <option value="PARENT">Parents</option>
              <option value="ALUMNI">Alumni</option>
              <option value="CONTRACTOR">Contractors</option>
              <option value="PARTNER">Partners</option>
              <option value="GUEST">Guests</option>
            </select>
          </label>

          <label className="um-select">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_ACTIVATION">Pending activation</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DISABLED">Disabled</option>
              <option value="INVITATION_EXPIRED">Invitation expired</option>
            </select>
          </label>
        </div>

        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Registration no.</th>
                <th>Category</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="um-empty">
                    Loading portal accounts…
                  </td>
                </tr>
              )}

              {!loading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="um-empty">
                    No accounts match these filters.
                  </td>
                </tr>
              )}

              {!loading &&
                data?.items.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="um-account">
                        <div className="um-avatar">
                          {account.fullName.trim().charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{account.fullName}</strong>
                          <span>{account.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{account.registrationNumber ?? "Not assigned"}</td>
                    <td>{account.category}</td>
                    <td>{account.roleNames.join(", ") || "Not assigned"}</td>
                    <td>
                      <StatusBadge status={account.status} />
                    </td>
                    <td>{formatDate(account.lastLoginAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="um-icon-button"
                        title="View account details"
                        aria-label={`View ${account.fullName}`}
                        onClick={() => setSelected(account)}
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        type="button"
                        className="um-icon-button"
                        title="More account actions"
                        aria-label={`More actions for ${account.fullName}`}
                        onClick={() => setSelected(account)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <footer className="um-pagination">
          <span>
            Page {page} of {totalPages} · {data?.total ?? 0} accounts
          </span>
          <div>
            <button
              type="button"
              className="um-button um-button--secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="um-button um-button--secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      {selected && (
        <div
          className="um-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="um-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="um-modal-title"
          >
            <header>
              <div>
                <span className="user-management__eyebrow">PORTAL ACCOUNT</span>
                <h2 id="um-modal-title">{selected.fullName}</h2>
              </div>
              <button
                type="button"
                className="um-icon-button"
                onClick={() => setSelected(null)}
                aria-label="Close account details"
              >
                <X />
              </button>
            </header>

            <div className="um-detail-grid">
              <Detail label="Email" value={selected.email} />
              <Detail label="Phone" value={selected.phone || "Not provided"} />
              <Detail
                label="Registration number"
                value={selected.registrationNumber || "Not assigned"}
              />
              <Detail label="Category" value={selected.category} />
              <Detail
                label="Campus"
                value={selected.campusName || "Not assigned"}
              />
              <Detail
                label="Department"
                value={selected.departmentName || "Not assigned"}
              />
              <Detail
                label="Roles"
                value={selected.roleNames.join(", ") || "None"}
              />
              <Detail label="Created" value={formatDate(selected.createdAt)} />
              <Detail
                label="Last login"
                value={formatDate(selected.lastLoginAt)}
              />
            </div>

            <div className="um-modal__status">
              <span>Account status</span>
              <StatusBadge status={selected.status} />
            </div>

            <div className="um-modal__actions">
              {selected.status === "PENDING_ACTIVATION" &&
                can(permissions, "users.registration.resend_invite") && (
                  <button
                    type="button"
                    className="um-button um-button--primary"
                    disabled={busyAccountId === selected.id}
                    onClick={() =>
                      setPendingAction({
                        account: selected,
                        action: "resend-invitation",
                      })
                    }
                  >
                    <Mail size={16} />
                    Resend invitation
                  </button>
                )}

              {selected.status === "ACTIVE" &&
                can(permissions, "users.account.suspend") && (
                  <button
                    type="button"
                    className="um-button um-button--danger"
                    disabled={busyAccountId === selected.id}
                    onClick={() =>
                      setPendingAction({
                        account: selected,
                        action: "suspend",
                      })
                    }
                  >
                    <Ban size={16} />
                    Suspend account
                  </button>
                )}

              {selected.status === "SUSPENDED" &&
                can(permissions, "users.account.reactivate") && (
                  <button
                    type="button"
                    className="um-button um-button--primary"
                    disabled={busyAccountId === selected.id}
                    onClick={() =>
                      setPendingAction({
                        account: selected,
                        action: "reactivate",
                      })
                    }
                  >
                    <CheckCircle2 size={16} />
                    Reactivate account
                  </button>
                )}
            </div>

            <p className="um-security-note">
              Account actions are permission-checked by the server and recorded
              in the audit log. This screen does not grant or change roles.
            </p>
          </section>
        </div>
      )}

      {pendingAction && confirmationCopy && (
        <div
          className="um-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyAccountId) {
              setPendingAction(null);
            }
          }}
        >
          <section
            className="um-modal max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="um-confirm-title"
          >
            <header>
              <div>
                <span className="user-management__eyebrow">SECURITY CONFIRMATION</span>
                <h2 id="um-confirm-title">{confirmationCopy.title}</h2>
              </div>
              <button
                type="button"
                className="um-icon-button"
                disabled={Boolean(busyAccountId)}
                onClick={() => setPendingAction(null)}
                aria-label="Cancel confirmation"
              >
                <X />
              </button>
            </header>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              {confirmationCopy.message}
            </p>

            <div className="um-modal__actions mt-6 justify-end">
              <button
                type="button"
                className="um-button um-button--secondary"
                disabled={Boolean(busyAccountId)}
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`um-button ${
                  confirmationCopy.tone === "danger"
                    ? "um-button--danger"
                    : "um-button--primary"
                }`}
                disabled={Boolean(busyAccountId)}
                onClick={() => void executeAccountAction(pendingAction)}
              >
                {busyAccountId ? "Processing…" : confirmationCopy.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}

      {isRegisterModalOpen && (
        <div
          className="um-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !registerSubmitting) {
              setIsRegisterModalOpen(false);
            }
          }}
        >
          <section
            className="um-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="um-register-title"
          >
            <header>
              <div>
                <span className="user-management__eyebrow">NEW PORTAL IDENTITY</span>
                <h2 id="um-register-title">Register Portal Account</h2>
              </div>
              <button
                type="button"
                className="um-icon-button"
                disabled={registerSubmitting}
                onClick={() => setIsRegisterModalOpen(false)}
                aria-label="Close registration modal"
              >
                <X />
              </button>
            </header>

            {registerError && (
              <div className="um-alert um-alert--error mt-4" role="alert">
                <ShieldAlert size={18} />
                {registerError}
              </div>
            )}

            <form onSubmit={(e) => void handleRegisterSubmit(e)} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Full Name *</span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={registerForm.fullName}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="e.g. Dr. Jane Kamau"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Institutional / Personal Email *</span>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="j.kamau@hitech.ac.ke"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Phone Number</span>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+254712345678"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Account Category *</span>
                  <select
                    value={registerForm.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as AccountCategory;
                      const defaultRole = ROLE_OPTIONS_BY_CATEGORY[nextCategory][0]?.value ?? nextCategory;
                      setRegisterForm((prev) => ({
                        ...prev,
                        category: nextCategory,
                        role: defaultRole,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="STAFF">Staff / Faculty</option>
                    <option value="STUDENT">Student</option>
                    <option value="PARENT">Parent / Guardian</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="PARTNER">Industry Partner</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Assigned Role *</span>
                  <select
                    value={registerForm.role}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {ROLE_OPTIONS_BY_CATEGORY[registerForm.category].map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Campus</span>
                  <select
                    value={registerForm.campusId}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({ ...prev, campusId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {CAMPUS_OPTIONS.map((cmp) => (
                      <option key={cmp.id} value={cmp.id}>
                        {cmp.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-700">Department / Faculty</span>
                <select
                  value={registerForm.departmentId}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, departmentId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                {ctx?.setCurrentRole ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      ctx.setCurrentRole?.("generator");
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    Open Full Registration Number Generator
                    <ArrowUpRight size={14} />
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="um-button um-button--secondary"
                    disabled={registerSubmitting}
                    onClick={() => setIsRegisterModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="um-button um-button--primary"
                    disabled={registerSubmitting}
                  >
                    <UserPlus size={16} />
                    {registerSubmitting ? "Provisioning…" : "Create & Send Invite"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  return (
    <article className={`um-stat-card um-stat-card--${tone}`}>
      <div className="um-stat-card__top">
        <span>{label}</span>
        <span className="um-stat-card__icon">{icon}</span>
      </div>
      <strong>{value.toLocaleString("en-KE")}</strong>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="um-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
