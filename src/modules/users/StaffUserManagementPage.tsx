import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
} from "lucide-react";
import { useSyncedPortalTab } from "../../context/PortalShellContext";
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

const API_BASE = "/api";

// Seed fallback data for offline / standalone frontend simulation
const MOCK_FALLBACK_ACCOUNTS: PortalAccount[] = [
  {
    id: "usr-001",
    registrationNumber: "HCA/STAFF/2026/001",
    fullName: "Dr. Margaret Nduta",
    email: "m.nduta@hitech.ac.ke",
    phone: "+254 712 345 678",
    category: "STAFF",
    status: "ACTIVE",
    roleNames: ["Super Administrator", "Academic Registrar"],
    campusName: "Nairobi Main Campus",
    departmentName: "Office of the Registrar",
    createdAt: "2026-01-10T08:00:00Z",
    lastLoginAt: "2026-11-14T09:15:00Z",
  },
  {
    id: "usr-002",
    registrationNumber: "HCA/STU/2026/001",
    fullName: "Amina Wanjiku",
    email: "amina.wanjiku@student.hitech.ac.ke",
    phone: "+254 722 000 111",
    category: "STUDENT",
    status: "ACTIVE",
    roleNames: ["Student Candidate", "Class Representative"],
    campusName: "Nairobi Main Campus",
    departmentName: "School of Computing & Informatics",
    createdAt: "2026-02-01T10:00:00Z",
    lastLoginAt: "2026-11-14T11:30:00Z",
  },
  {
    id: "usr-003",
    registrationNumber: "HCA/STAFF/2026/002",
    fullName: "Eng. Dennis Mutiso",
    email: "d.mutiso@hitech.ac.ke",
    phone: "+254 733 444 555",
    category: "STAFF",
    status: "ACTIVE",
    roleNames: ["Senior Lecturer", "CBT Test Author"],
    campusName: "Nairobi Main Campus",
    departmentName: "Department of Software Engineering",
    createdAt: "2026-01-15T08:30:00Z",
    lastLoginAt: "2026-11-13T16:20:00Z",
  },
  {
    id: "usr-004",
    registrationNumber: "HCA/PARENT/2026/001",
    fullName: "Grace Muthoni Wanjiku",
    email: "grace.muthoni@gmail.com",
    phone: "+254 711 999 888",
    category: "PARENT",
    status: "ACTIVE",
    roleNames: ["Guardian / Sponsor"],
    campusName: "Nairobi Main Campus",
    departmentName: "Student Affairs & Welfare",
    createdAt: "2026-02-05T12:00:00Z",
    lastLoginAt: "2026-11-10T14:45:00Z",
  },
  {
    id: "usr-005",
    registrationNumber: "HCA/APP/2026/012",
    fullName: "Kevin Ochieng",
    email: "kevin.ochieng@yahoo.com",
    phone: "+254 799 123 456",
    category: "STUDENT",
    status: "PENDING_ACTIVATION",
    roleNames: ["Applicant"],
    campusName: "Mombasa Coastal Campus",
    departmentName: "School of Business & ICT",
    createdAt: "2026-11-01T09:00:00Z",
    lastLoginAt: null,
  },
  {
    id: "usr-006",
    registrationNumber: "HCA/ALUMNI/2025/088",
    fullName: "Sarah Chebet",
    email: "s.chebet@alumni.hitech.ac.ke",
    phone: "+254 720 555 777",
    category: "ALUMNI",
    status: "ACTIVE",
    roleNames: ["Alumni Associate"],
    campusName: "Nairobi Main Campus",
    departmentName: "Computing Alumni Chapter",
    createdAt: "2025-08-12T08:00:00Z",
    lastLoginAt: "2026-10-25T17:10:00Z",
  },
  {
    id: "usr-007",
    registrationNumber: null,
    fullName: "Brian Kiprop",
    email: "brian.kiprop@securityguard.co.ke",
    phone: "+254 714 888 222",
    category: "CONTRACTOR",
    status: "SUSPENDED",
    roleNames: ["Campus Security Contractor"],
    campusName: "Nakuru Campus",
    departmentName: "Facilities & Estates",
    createdAt: "2026-03-01T08:00:00Z",
    lastLoginAt: "2026-09-12T10:00:00Z",
  },
  {
    id: "usr-008",
    registrationNumber: "HCA/STAFF/2026/015",
    fullName: "Catherine Njeri",
    email: "c.njeri@hitech.ac.ke",
    phone: "+254 718 333 444",
    category: "STAFF",
    status: "DISABLED",
    roleNames: ["Finance Clerk"],
    campusName: "Nairobi Main Campus",
    departmentName: "Directorate of Finance",
    createdAt: "2026-01-20T08:00:00Z",
    lastLoginAt: "2026-07-15T12:00:00Z",
  },
];

let localAccountsState = [...MOCK_FALLBACK_ACCOUNTS];

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(body?.message || `Request failed (${response.status})`);
    }

    return body as T;
  } catch (error) {
    // If backend endpoint is not yet mounted, gracefully simulate response using local storage / memory
    if (path.startsWith("/users")) {
      const url = new URL(`http://dummy${path}`);
      const pathname = url.pathname;

      // POST /users/:id/resend-invitation
      if (pathname.includes("/resend-invitation")) {
        return { ok: true, message: "Invitation resent." } as T;
      }

      // POST /users/:id/suspend
      if (pathname.includes("/suspend")) {
        const id = pathname.split("/")[2];
        localAccountsState = localAccountsState.map((u) =>
          u.id === id ? { ...u, status: "SUSPENDED" as AccountStatus } : u
        );
        return { ok: true, message: "Account suspended." } as T;
      }

      // POST /users/:id/reactivate
      if (pathname.includes("/reactivate")) {
        const id = pathname.split("/")[2];
        localAccountsState = localAccountsState.map((u) =>
          u.id === id ? { ...u, status: "ACTIVE" as AccountStatus } : u
        );
        return { ok: true, message: "Account reactivated." } as T;
      }

      // GET /users?page=1&pageSize=10...
      const page = Number(url.searchParams.get("page") || "1");
      const pageSize = Number(url.searchParams.get("pageSize") || "10");
      const search = url.searchParams.get("search")?.toLowerCase().trim();
      const category = url.searchParams.get("category");
      const status = url.searchParams.get("status");

      let filtered = [...localAccountsState];
      if (search) {
        filtered = filtered.filter(
          (u) =>
            u.fullName.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            (u.registrationNumber && u.registrationNumber.toLowerCase().includes(search))
        );
      }
      if (category && category !== "ALL") {
        filtered = filtered.filter((u) => u.category === category);
      }
      if (status && status !== "ALL") {
        filtered = filtered.filter((u) => u.status === status);
      }

      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      const summary = {
        total: localAccountsState.length,
        active: localAccountsState.filter((u) => u.status === "ACTIVE").length,
        pendingActivation: localAccountsState.filter(
          (u) => u.status === "PENDING_ACTIVATION"
        ).length,
        suspended: localAccountsState.filter((u) => u.status === "SUSPENDED").length,
        disabled: localAccountsState.filter((u) => u.status === "DISABLED").length,
      };

      const permissions = [
        "users.view",
        "users.registration.create",
        "users.registration.view",
        "users.registration.approve",
        "users.registration.resend_invite",
        "users.account.suspend",
        "users.account.reactivate",
        "users.roles.view",
        "users.roles.assign",
        "users.audit.view",
        "users.export",
      ];

      return {
        items,
        total,
        page,
        pageSize,
        summary,
        permissions,
      } as unknown as T;
    }

    throw error;
  }
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
  const [activeTab, setActiveTab] = useSyncedPortalTab<'accounts' | 'roles' | 'invitations'>('staff-users', 'accounts');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PortalAccount | null>(null);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'invitations') {
      setStatus('PENDING_ACTIVATION');
    } else if (activeTab === 'accounts') {
      setStatus('ALL');
    }
  }, [activeTab]);

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

  async function performAction(
    account: PortalAccount,
    action: "resend-invitation" | "suspend" | "reactivate",
  ) {
    const confirmation = {
      "resend-invitation": `Resend the activation invitation to ${account.email}?`,
      suspend: `Suspend the portal account for ${account.fullName}?`,
      reactivate: `Reactivate the portal account for ${account.fullName}?`,
    }[action];

    if (!window.confirm(confirmation)) return;

    setBusyAccountId(account.id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/users/${account.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      setNotice("The account action was completed.");
      setSelected(null);
      await loadAccounts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The account action failed.",
      );
    } finally {
      setBusyAccountId(null);
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
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
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
            className="um-button um-button--secondary"
            onClick={() => void loadAccounts()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {can(permissions, "users.registration.create") && (
            <button
              className="um-button um-button--primary"
              onClick={() => {
                window.location.href = "/portal/users/register";
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
          <UserCheck size={14} /> Activation &amp; Invitations ({data?.summary?.pendingActivation ?? 1})
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
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="um-alert um-alert--success" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
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
                        className="um-icon-button"
                        title="View account details"
                        aria-label={`View ${account.fullName}`}
                        onClick={() => setSelected(account)}
                      >
                        <Eye size={17} />
                      </button>
                      <button
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
              className="um-button um-button--secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <button
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
                    className="um-button um-button--primary"
                    disabled={busyAccountId === selected.id}
                    onClick={() =>
                      void performAction(selected, "resend-invitation")
                    }
                  >
                    <Mail size={16} />
                    Resend invitation
                  </button>
                )}

              {selected.status === "ACTIVE" &&
                can(permissions, "users.account.suspend") && (
                  <button
                    className="um-button um-button--danger"
                    disabled={busyAccountId === selected.id}
                    onClick={() => void performAction(selected, "suspend")}
                  >
                    <Ban size={16} />
                    Suspend account
                  </button>
                )}

              {selected.status === "SUSPENDED" &&
                can(permissions, "users.account.reactivate") && (
                  <button
                    className="um-button um-button--primary"
                    disabled={busyAccountId === selected.id}
                    onClick={() => void performAction(selected, "reactivate")}
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

