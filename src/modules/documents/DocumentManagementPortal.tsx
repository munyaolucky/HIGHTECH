import { useCallback, useEffect, useState } from 'react';
import {
  Archive,
  Award,
  CheckCircle2,
  Eye,
  FileCheck2,
  FilePlus2,
  FileText,
  FileUp,
  History,
  Lock,
  PenTool,
  QrCode,
  RotateCcw,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { StaffUserAccount } from '../../config/staff-navigation';
import {
  StaffButton,
  StaffPageHeader,
  StaffSearchToolbar,
  StaffStatCard,
  StaffStatusTag,
} from '../staff/components/StaffDashboardUI';
import { DashboardError, DashboardLoading } from '../staff/components/DashboardStates';
import DocumentDesigner, {
  type DesignerDraftPayload,
  type DocumentCategory,
  type DocumentConfidentiality,
  type DocumentDesignConfig,
  type DocumentTemplateItem,
} from './DocumentDesigner';
import DocumentUploadPage from './DocumentUploadPage';

interface DocumentRecordDto {
  id: string;
  referenceNumber: string | null;
  title: string;
  category: DocumentCategory;
  confidentiality: DocumentConfidentiality;
  status: string;
  ownerId: string;
  ownerName: string;
  departmentName: string | null;
  campusName: string | null;
  recipientLabel: string;
  subjectLine: string;
  bodyContent: string;
  metadataFields: Record<string, string>;
  design: DocumentDesignConfig;
  templateId: string | null;
  currentVersion: number;
  verificationHash: string | null;
  issuedAt: string | null;
  issuedByName: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentDetailDto {
  document: DocumentRecordDto;
  versions: {
    id: string;
    versionNumber: number;
    editedByName: string;
    changeNote: string;
    createdAt: string;
  }[];
  approvals: {
    id: string;
    stepOrder: number;
    reviewerName: string;
    reviewerRole: string;
    status: string;
    comment: string | null;
    decidedAt: string | null;
  }[];
  signatures: {
    id: string;
    signerName: string;
    signerTitle: string;
    signatureTitle: string;
    signatureDigest: string;
    signedAt: string;
  }[];
  recipients: {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    canDownload: boolean;
    canPrint: boolean;
    expiresAt: string | null;
  }[];
  auditLogs: {
    id: string;
    actorName: string;
    actorRole: string;
    action: string;
    detail: string;
    createdAt: string;
  }[];
  allowedActions: {
    canEdit: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canRequestChanges: boolean;
    canReject: boolean;
    canSign: boolean;
    canIssue: boolean;
    canShare: boolean;
    canArchive: boolean;
    canRestore: boolean;
    canRevoke: boolean;
    canPrint: boolean;
    canExport: boolean;
  };
}

type DocWorkspaceTab =
  | 'all'
  | 'mine'
  | 'pending_approvals'
  | 'issued'
  | 'shared'
  | 'archived'
  | 'upload'
  | 'designer'
  | 'templates'
  | 'verify'
  | 'audit';

export default function DocumentManagementPortal({ user }: { user: StaffUserAccount }) {
  const [tab, setTab] = useState<DocWorkspaceTab>('all');
  const [docs, setDocs] = useState<DocumentRecordDto[]>([]);
  const [stats, setStats] = useState({
    totalAccessible: 0,
    drafts: 0,
    pendingApprovals: 0,
    issued: 0,
    sharedWithMe: 0,
  });
  const [templates, setTemplates] = useState<DocumentTemplateItem[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<
    { id: string; fullName: string; role: string; roleTitle: string }[]
  >([]);
  const [auditLogs, setAuditLogs] = useState<
    { id: string; actorName: string; action: string; detail: string; createdAt: string }[]
  >([]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<DocumentDetailDto | null>(null);
  const [editingPayload, setEditingPayload] = useState<DesignerDraftPayload | null>(null);

  // Workflow inputs
  const [reviewComment, setReviewComment] = useState('');
  const [signatureTitle, setSignatureTitle] = useState(user.roleTitle);
  const [shareUserId, setShareUserId] = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareCanDownload, setShareCanDownload] = useState(true);
  const [revokeReason, setRevokeReason] = useState('');

  // Verify input
  const [verifyInput, setVerifyInput] = useState('HCA/DOC/2026/000001');
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    status: string;
    referenceNumber?: string | null;
    title?: string;
    issuedAt?: string | null;
    issuedByName?: string | null;
    message: string;
    signatures?: { signerName: string; signerTitle: string; signatureDigest: string }[];
  } | null>(null);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const viewParam =
        tab === 'mine' ||
        tab === 'pending_approvals' ||
        tab === 'issued' ||
        tab === 'shared' ||
        tab === 'archived'
          ? tab
          : 'all';

      const params = new URLSearchParams({
        view: viewParam,
        category: categoryFilter,
        search,
        pageSize: '25',
      });

      const [docsRes, tplRes, dirRes] = await Promise.all([
        fetch(`/api/documents?${params.toString()}`, { credentials: 'include' }),
        fetch('/api/documents/templates', { credentials: 'include' }),
        fetch('/api/staff/directory?pageSize=40', { credentials: 'include' }),
      ]);

      const docsJson = await docsRes.json();
      if (!docsRes.ok || !docsJson.success) {
        throw new Error(docsJson.error || `Failed to load documents (${docsRes.status})`);
      }

      setDocs(docsJson.data.items);
      setStats(docsJson.data.stats);

      const tplJson = await tplRes.json().catch(() => null);
      if (tplJson?.success) setTemplates(tplJson.data);

      const dirJson = await dirRes.json().catch(() => null);
      if (dirJson?.success) {
        setDirectoryUsers(dirJson.data.items);
        if (!shareUserId && dirJson.data.items.length > 0) {
          const other = dirJson.data.items.find((u: { id: string }) => u.id !== user.id);
          if (other) setShareUserId(other.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Document Management System.');
    } finally {
      setLoading(false);
    }
  }, [tab, categoryFilter, search, user.id, shareUserId]);

  useEffect(() => {
    if (tab === 'designer' || tab === 'verify' || tab === 'upload') return;
    loadList();
  }, [tab, loadList]);

  const loadAudit = useCallback(async () => {
    const res = await fetch('/api/documents/audit', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setAuditLogs(json.data);
    }
  }, []);

  useEffect(() => {
    if (tab === 'audit') loadAudit();
  }, [tab, loadAudit]);

  const openDocument = async (docId: string) => {
    setNotice(null);
    const res = await fetch(`/api/documents/${docId}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Could not open document.');
      return;
    }
    setSelectedDetail(json.data as DocumentDetailDto);
    setReviewComment('');
    setRevokeReason('');
  };

  const handleSaveDraft = async (payload: DesignerDraftPayload): Promise<string | null> => {
    setSaving(true);
    setNotice(null);
    try {
      const isUpdate = Boolean(payload.id);
      const res = await fetch(isUpdate ? `/api/documents/${payload.id}` : '/api/documents', {
        method: isUpdate ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotice(json.error || 'Failed to save draft.');
        return null;
      }
      setNotice(
        isUpdate
          ? `Saved revision v${json.data.currentVersion} for "${json.data.title}".`
          : `Created draft "${json.data.title}" (no reference issued until approved & issued).`
      );
      setEditingPayload(null);
      setTab('all');
      await openDocument(json.data.id);
      await loadList();
      return json.data.id as string;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmit = async (payload: DesignerDraftPayload) => {
    const savedId = await handleSaveDraft(payload);
    if (!savedId) return;
    await runWorkflowAction(savedId, 'submit', {});
  };

  const runWorkflowAction = async (
    docId: string,
    action:
      | 'submit'
      | 'approve'
      | 'request-changes'
      | 'reject'
      | 'sign'
      | 'issue'
      | 'share'
      | 'archive'
      | 'restore'
      | 'revoke',
    body: Record<string, unknown>
  ) => {
    setNotice(null);
    const res = await fetch(`/api/documents/${docId}/${action}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || `Action "${action}" failed.`);
      return;
    }
    setNotice(
      action === 'issue'
        ? `Issued official document ${json.data.referenceNumber} (${json.data.verificationHash}).`
        : `Completed action: ${action.replace('-', ' ').toUpperCase()}.`
    );
    await openDocument(docId);
    await loadList();
  };

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;
    const res = await fetch(`/api/documents/verify/${encodeURIComponent(verifyInput.trim())}`);
    const json = await res.json();
    if (json?.success) {
      setVerifyResult(json.data);
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Institutional Document Management & Issuance"
        description={`Permission-scoped repository, independent review workflow, digital signatures, and template A4 designer for ${user.roleTitle}.`}
        breadcrumb="Document Management"
        actions={
          <div className="flex flex-wrap gap-2">
            <StaffButton
              variant="secondary"
              onClick={() => {
                setSelectedDetail(null);
                setTab('upload');
              }}
            >
              <FileUp size={15} /> Upload File
            </StaffButton>
            <StaffButton
              variant="secondary"
              onClick={() => {
                setSelectedDetail(null);
                setTab('verify');
              }}
            >
              <QrCode size={15} /> Verify Ref / QR
            </StaffButton>
            <StaffButton
              onClick={() => {
                setSelectedDetail(null);
                setEditingPayload(null);
                setTab('designer');
              }}
            >
              <FilePlus2 size={15} /> Create With Designer
            </StaffButton>
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

      {/* KPI Strip (computed strictly from policy-filtered accessible records) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaffStatCard
          label="Accessible Documents"
          value={stats.totalAccessible}
          description="Within your RBAC & confidentiality scope"
          icon={FileText}
          onClick={() => {
            setSelectedDetail(null);
            setTab('all');
          }}
        />
        <StaffStatCard
          label="Drafts & Revisions"
          value={stats.drafts}
          description="Awaiting submission or changes"
          icon={PenTool}
          onClick={() => {
            setSelectedDetail(null);
            setTab('mine');
          }}
        />
        <StaffStatCard
          label="Pending My Approval"
          value={stats.pendingApprovals}
          description="Independent review queue (no self-approval)"
          icon={ShieldCheck}
          onClick={() => {
            setSelectedDetail(null);
            setTab('pending_approvals');
          }}
        />
        <StaffStatCard
          label="Issued Official Docs"
          value={stats.issued}
          description="Verified HCA/DOC serial numbers"
          icon={Award}
          onClick={() => {
            setSelectedDetail(null);
            setTab('issued');
          }}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="no-print flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
        {(
          [
            ['all', 'All Accessible'],
            ['mine', 'My Documents'],
            ['pending_approvals', 'Pending Approvals'],
            ['issued', 'Issued'],
            ['shared', 'Shared With Me'],
            ['templates', 'Templates'],
            ['upload', 'Upload File'],
            ['designer', 'A4 Designer'],
            ['verify', 'QR Verify'],
            ['archived', 'Archive'],
            ['audit', 'Audit Trail'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setSelectedDetail(null);
              if (key === 'designer') setEditingPayload(null);
              setTab(key);
            }}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              tab === key
                ? 'bg-[#102D50] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upload File View */}
      {tab === 'upload' && (
        <DocumentUploadPage
          onUploaded={async (docId) => {
            setTab('all');
            await loadList();
            await openDocument(docId);
          }}
          onCancel={() => setTab('all')}
        />
      )}

      {/* Designer View */}
      {tab === 'designer' && (
        <DocumentDesigner
          user={user}
          templates={templates}
          initialDoc={editingPayload}
          saving={saving}
          onSaveDraft={async (p) => {
            await handleSaveDraft(p);
          }}
          onSaveAndSubmit={handleSaveAndSubmit}
          onCancel={() => {
            setEditingPayload(null);
            setTab('all');
          }}
        />
      )}

      {/* Templates Library */}
      {tab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <article
              key={tpl.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                    {tpl.code}
                  </span>
                  <StaffStatusTag status={tpl.defaultConfidentiality} />
                </div>
                <h3 className="text-base font-bold text-[#102D50] dark:text-white">{tpl.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">{tpl.description}</p>
              </div>
              <StaffButton
                onClick={() => {
                  setEditingPayload({
                    title: `${tpl.name} — Draft`,
                    category: tpl.category,
                    confidentiality: tpl.defaultConfidentiality,
                    recipientLabel: 'Recipient Name',
                    subjectLine: tpl.subjectTemplate,
                    bodyContent: tpl.bodyTemplate,
                    metadataFields: { ...tpl.defaultFields },
                    design: { ...tpl.design },
                    templateId: tpl.id,
                  });
                  setTab('designer');
                }}
              >
                <FilePlus2 size={14} /> Use Template in Designer
              </StaffButton>
            </article>
          ))}
        </div>
      )}

      {/* Public/QR Document Verification */}
      {tab === 'verify' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <QrCode size={18} className="text-[#1769AA]" /> Verify Official HI-TECH College Document
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter an issued reference (e.g. <span className="font-mono">HCA/DOC/2026/000001</span>) or verification code to confirm authenticity. Confidential document bodies are never exposed.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder="HCA/DOC/2026/000001"
              className="flex-1 min-w-[220px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
            />
            <StaffButton onClick={handleVerify}>Verify Authenticity</StaffButton>
          </div>
          {verifyResult && (
            <div
              className={`rounded-xl border p-4 space-y-2 text-xs ${
                verifyResult.verified
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                  : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm">{verifyResult.message}</span>
                <StaffStatusTag status={verifyResult.status} />
              </div>
              {verifyResult.title && (
                <div>
                  <span className="font-semibold">Title: </span>
                  {verifyResult.title}
                </div>
              )}
              {verifyResult.issuedByName && (
                <div>
                  <span className="font-semibold">Issued By: </span>
                  {verifyResult.issuedByName} · {verifyResult.issuedAt?.slice(0, 10)}
                </div>
              )}
              {verifyResult.signatures && verifyResult.signatures.length > 0 && (
                <div>
                  <span className="font-semibold">Digital Signatures: </span>
                  {verifyResult.signatures
                    .map((s) => `${s.signerName} (${s.signatureDigest})`)
                    .join(', ')}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Global Audit Trail */}
      {tab === 'audit' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <History size={17} /> Immutable Document Audit Trail
          </h2>
          {auditLogs.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No audit log entries available for your permission scope.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400 mr-2">
                      [{log.action}]
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">{log.detail}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      — {log.actorName}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    {log.createdAt.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Document Register & Inspector */}
      {tab !== 'designer' && tab !== 'templates' && tab !== 'verify' && tab !== 'audit' && tab !== 'upload' && (
        <>
          {loading && docs.length === 0 ? (
            <DashboardLoading />
          ) : error ? (
            <DashboardError message={error} onRetry={loadList} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr] items-start">
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <StaffSearchToolbar
                  search={search}
                  onSearch={setSearch}
                  placeholder="Search reference, title, or recipient..."
                  actions={
                    <select
                      aria-label="Filter by category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="ADMISSION_LETTER">Admission Letters</option>
                      <option value="TRANSCRIPT_CERTIFICATE">Transcripts</option>
                      <option value="FEE_STATEMENT">Fee Statements</option>
                      <option value="EXAM_SCHEDULE">Exam Schedules</option>
                      <option value="EMPLOYMENT_CONTRACT">HR Contracts</option>
                      <option value="INSTITUTIONAL_POLICY">Policies</option>
                      <option value="OFFICIAL_MEMO">Official Memos</option>
                      <option value="STUDENT_WELFARE_CONFIDENTIAL">Confidential Welfare</option>
                    </select>
                  }
                />

                {docs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No authorized documents match this view. Click &ldquo;Create With Designer&rdquo; to compose a new draft.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {docs.map((doc) => {
                      const active = selectedDetail?.document.id === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => openDocument(doc.id)}
                          className={`w-full text-left py-4 px-3 rounded-xl transition-colors flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                            active
                              ? 'bg-[#eef4fd] dark:bg-slate-800/80'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                                {doc.referenceNumber ?? 'DRAFT · NO REF'}
                              </span>
                              <span className="text-slate-400" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                v{doc.currentVersion}
                              </span>
                              {doc.confidentiality !== 'PUBLIC' && (
                                <span className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                  <Lock size={10} /> {doc.confidentiality}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                              {doc.title}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              Owner: {doc.ownerName} · To: {doc.recipientLabel}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StaffStatusTag status={doc.status} />
                            <Eye size={15} className="text-slate-400" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Document Detail & Lifecycle Workflow Panel */}
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
                {!selectedDetail ? (
                  <div className="py-12 text-center space-y-2">
                    <FileCheck2 size={28} className="mx-auto text-slate-400" />
                    <p className="text-sm font-semibold text-[#102D50] dark:text-white">
                      Select a document to inspect
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Review immutable version history, independent approvals, digital signatures, sharing grants, and official issuance actions.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400">
                          {selectedDetail.document.referenceNumber ??
                            'UNISSUED DRAFT (Reference assigned only on issuance)'}
                        </span>
                        <StaffStatusTag status={selectedDetail.document.status} />
                      </div>
                      <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                        {selectedDetail.document.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Owner: {selectedDetail.document.ownerName} · Confidentiality:{' '}
                        {selectedDetail.document.confidentiality} · Version v
                        {selectedDetail.document.currentVersion}
                      </p>
                      {selectedDetail.document.verificationHash && (
                        <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                          Verification Code: {selectedDetail.document.verificationHash}
                        </p>
                      )}
                    </div>

                    {/* Preview snippet */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-1.5 text-xs">
                      <div className="font-bold text-[#102D50] dark:text-white uppercase">
                        {selectedDetail.document.subjectLine}
                      </div>
                      <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                        {selectedDetail.document.bodyContent}
                      </p>
                    </div>

                    {/* Lifecycle Actions (strictly permission-gated) */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-[#102D50] dark:text-white">
                        Authorized Lifecycle Actions
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedDetail.allowedActions.canEdit && (
                          <StaffButton
                            variant="secondary"
                            onClick={() => {
                              setEditingPayload({
                                ...selectedDetail.document,
                                signatures: selectedDetail.signatures,
                              });
                              setTab('designer');
                            }}
                          >
                            <PenTool size={14} /> Edit in A4 Designer
                          </StaffButton>
                        )}

                        {selectedDetail.allowedActions.canSubmit && (
                          <StaffButton
                            onClick={() =>
                              runWorkflowAction(selectedDetail.document.id, 'submit', {})
                            }
                          >
                            <Send size={14} /> Submit for Approval
                          </StaffButton>
                        )}

                        {selectedDetail.allowedActions.canIssue && (
                          <StaffButton
                            variant="success"
                            onClick={() =>
                              runWorkflowAction(selectedDetail.document.id, 'issue', {})
                            }
                          >
                            <Award size={14} /> Issue Official Reference
                          </StaffButton>
                        )}

                        {selectedDetail.allowedActions.canArchive &&
                          selectedDetail.document.status !== 'ARCHIVED' && (
                            <StaffButton
                              variant="secondary"
                              onClick={() =>
                                runWorkflowAction(selectedDetail.document.id, 'archive', {})
                              }
                            >
                              <Archive size={14} /> Archive
                            </StaffButton>
                          )}

                        {selectedDetail.allowedActions.canRestore &&
                          selectedDetail.document.status === 'ARCHIVED' && (
                            <StaffButton
                              variant="secondary"
                              onClick={() =>
                                runWorkflowAction(selectedDetail.document.id, 'restore', {})
                              }
                            >
                              <RotateCcw size={14} /> Restore
                            </StaffButton>
                          )}
                      </div>

                      {/* Independent Review Actions */}
                      {(selectedDetail.allowedActions.canApprove ||
                        selectedDetail.allowedActions.canRequestChanges ||
                        selectedDetail.allowedActions.canReject) && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 p-3 space-y-2">
                          <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                            Independent Review Decision
                          </div>
                          <input
                            type="text"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Review comment (required for changes/reject)..."
                            className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
                          />
                          <div className="flex flex-wrap gap-2">
                            {selectedDetail.allowedActions.canApprove && (
                              <StaffButton
                                variant="success"
                                onClick={() =>
                                  runWorkflowAction(selectedDetail.document.id, 'approve', {
                                    comment: reviewComment,
                                  })
                                }
                              >
                                <CheckCircle2 size={14} /> Approve
                              </StaffButton>
                            )}
                            {selectedDetail.allowedActions.canRequestChanges && (
                              <StaffButton
                                variant="secondary"
                                onClick={() =>
                                  runWorkflowAction(
                                    selectedDetail.document.id,
                                    'request-changes',
                                    { comment: reviewComment }
                                  )
                                }
                              >
                                Request Changes
                              </StaffButton>
                            )}
                            {selectedDetail.allowedActions.canReject && (
                              <StaffButton
                                variant="danger"
                                onClick={() =>
                                  runWorkflowAction(selectedDetail.document.id, 'reject', {
                                    comment: reviewComment,
                                  })
                                }
                              >
                                <XCircle size={14} /> Reject
                              </StaffButton>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Separate Digital Signature Action */}
                      {selectedDetail.allowedActions.canSign && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                          <div className="text-xs font-bold text-[#102D50] dark:text-white">
                            Apply Digital Signature (Separate From Approval &amp; Issuance)
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={signatureTitle}
                              onChange={(e) => setSignatureTitle(e.target.value)}
                              placeholder="Signer capacity / title..."
                              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
                            />
                            <StaffButton
                              onClick={() =>
                                runWorkflowAction(selectedDetail.document.id, 'sign', {
                                  signatureTitle,
                                })
                              }
                            >
                              <PenTool size={14} /> Sign Document
                            </StaffButton>
                          </div>
                        </div>
                      )}

                      {/* Share With Explicit Recipient */}
                      {selectedDetail.allowedActions.canShare && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                          <div className="text-xs font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                            <Share2 size={13} /> Grant Explicit Recipient Access
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <select
                              aria-label="Select recipient staff"
                              value={shareUserId}
                              onChange={(e) => setShareUserId(e.target.value)}
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs"
                            >
                              {directoryUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.fullName} ({u.role})
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              aria-label="Share expiry date"
                              value={shareExpiry}
                              onChange={(e) => setShareExpiry(e.target.value)}
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={shareCanDownload}
                                onChange={(e) => setShareCanDownload(e.target.checked)}
                                className="accent-[#1769AA]"
                              />
                              <span>Allow download</span>
                            </label>
                            <StaffButton
                              variant="secondary"
                              onClick={() =>
                                runWorkflowAction(selectedDetail.document.id, 'share', {
                                  userId: shareUserId,
                                  canView: true,
                                  canDownload: shareCanDownload,
                                  canPrint: true,
                                  expiresAt: shareExpiry ? `${shareExpiry}T23:59:59.000Z` : null,
                                })
                              }
                            >
                              Share Document
                            </StaffButton>
                          </div>
                        </div>
                      )}

                      {/* Revoke Issued Document */}
                      {selectedDetail.allowedActions.canRevoke && (
                        <div className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50/50 dark:bg-red-950/30 p-3 space-y-2">
                          <div className="text-xs font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                            <ShieldAlert size={13} /> Revoke Official Issuance
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={revokeReason}
                              onChange={(e) => setRevokeReason(e.target.value)}
                              placeholder="Mandatory revocation reason..."
                              className="flex-1 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
                            />
                            <StaffButton
                              variant="danger"
                              onClick={() =>
                                runWorkflowAction(selectedDetail.document.id, 'revoke', {
                                  comment: revokeReason,
                                })
                              }
                            >
                              Revoke
                            </StaffButton>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Versions, Approvals, Signatures */}
                    <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
                      <div>
                        <div className="font-bold text-[#102D50] dark:text-white mb-1">
                          Version History ({selectedDetail.versions.length})
                        </div>
                        <div className="space-y-1">
                          {selectedDetail.versions.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between text-slate-600 dark:text-slate-300"
                            >
                              <span>
                                <strong className="font-mono">v{v.versionNumber}</strong> —{' '}
                                {v.changeNote} ({v.editedByName})
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {v.createdAt.slice(0, 10)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedDetail.approvals.length > 0 && (
                        <div>
                          <div className="font-bold text-[#102D50] dark:text-white mb-1">
                            Approval Chain
                          </div>
                          {selectedDetail.approvals.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between gap-2 py-1 text-slate-600 dark:text-slate-300"
                            >
                              <span>
                                Step {a.stepOrder}: {a.reviewerName} ({a.reviewerRole})
                                {a.comment ? ` — "${a.comment}"` : ''}
                              </span>
                              <StaffStatusTag status={a.status} />
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedDetail.signatures.length > 0 && (
                        <div>
                          <div className="font-bold text-[#102D50] dark:text-white mb-1">
                            Digital Signatures
                          </div>
                          {selectedDetail.signatures.map((s) => (
                            <div
                              key={s.id}
                              className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400"
                            >
                              {s.signerName} ({s.signatureTitle}) · {s.signatureDigest}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
