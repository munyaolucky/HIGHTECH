import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive,
  Award,
  CheckCircle2,
  ClipboardList,
  DatabaseBackup,
  Download,
  Eye,
  FileCheck2,
  FilePlus2,
  FileText,
  FileUp,
  History,
  Lock,
  MessageSquare,
  Paperclip,
  PenTool,
  QrCode,
  RotateCcw,
  Send,
  Settings2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Upload,
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
import {
  DMS_CATEGORY_CATALOG,
  formatBytesCompact,
  getDmsCategoryMeta,
} from './dmsCatalog';
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
  documentNumber?: string | null;
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
  originalFileName?: string | null;
  fileSizeBytes?: number;
  checksumSha256?: string | null;
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
    fileName?: string | null;
    fileSizeBytes?: number;
    editedByName: string;
    changeNote: string;
    createdAt: string;
  }[];
  attachments?: {
    id: string;
    fileName: string;
    fileSizeBytes: number;
    uploadedByName: string;
    createdAt: string;
  }[];
  comments?: {
    id: string;
    authorName: string;
    authorRole: string;
    body: string;
    isInternal: boolean;
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

interface CategoryConfigDto {
  code: string;
  slug: string;
  name: string;
  moduleKey: string;
  maxSizeMb: number;
  defaultConfidentiality: DocumentConfidentiality;
  approvalRequired: boolean;
  isUnpublishedExamProtected: boolean;
  studentUploadAllowed: boolean;
  retentionDays: number;
  active: boolean;
}

interface DocumentRequestDto {
  id: string;
  requestNumber: string;
  targetUserId: string;
  targetUserName: string;
  targetRegNo: string | null;
  categoryCode: string;
  title: string;
  instructions: string;
  dueDate: string | null;
  status: string;
  requestedByName: string;
  fulfilledDocumentId: string | null;
  createdAt: string;
}

interface BackupReportDto {
  checkedAt: string;
  checkedBy: string;
  totalDocumentRecords: number;
  storedBinaryFiles: number;
  verifiedChecksums: number;
  missingFiles: number;
  checksumMismatches: number;
  totalStoredBytes: number;
  status: string;
}

export type DocWorkspaceTab =
  | 'mine'
  | 'upload'
  | 'pending_approvals'
  | 'shared'
  | 'archived'
  | 'verify'
  | 'all'
  | 'issued'
  | 'requests'
  | 'templates'
  | 'designer'
  | 'audit'
  | 'config';

export default function DocumentManagementPortal({
  user,
  initialTab = 'all',
}: {
  user: StaffUserAccount;
  initialTab?: DocWorkspaceTab;
}) {
  const canManageConfig =
    user.role === 'ADMIN' ||
    user.role === 'PRINCIPAL' ||
    user.role === 'QUALITY_ASSURANCE' ||
    user.documentPermissions.includes('documents.config.manage');

  const revisionInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<DocWorkspaceTab>(
    initialTab === 'config' && !canManageConfig ? 'all' : initialTab
  );
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
  const [requests, setRequests] = useState<DocumentRequestDto[]>([]);
  const [categoriesConfig, setCategoriesConfig] = useState<CategoryConfigDto[]>([]);
  const [backupReport, setBackupReport] = useState<BackupReportDto | null>(null);

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
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [signatureTitle, setSignatureTitle] = useState(user.roleTitle);
  const [shareUserId, setShareUserId] = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareCanDownload, setShareCanDownload] = useState(true);
  const [revokeReason, setRevokeReason] = useState('');

  // Document Request creator
  const [reqTargetName, setReqTargetName] = useState('Brian Kiprop Mutai');
  const [reqTargetRegNo, setReqTargetRegNo] = useState('HCA-2026-0041');
  const [reqCategory, setReqCategory] = useState<DocumentCategory>('STUDENT_REGISTRATION_RECORD');
  const [reqTitle, setReqTitle] = useState('');
  const [reqInstructions, setReqInstructions] = useState('');
  const [reqDueDate, setReqDueDate] = useState('');

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

  useEffect(() => {
    setTab(initialTab === 'config' && !canManageConfig ? 'all' : initialTab);
  }, [initialTab, canManageConfig]);

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
        pageSize: '30',
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
    if (
      tab === 'designer' ||
      tab === 'verify' ||
      tab === 'upload' ||
      tab === 'requests' ||
      tab === 'config' ||
      tab === 'audit'
    ) {
      return;
    }
    void loadList();
  }, [tab, loadList]);

  const loadAudit = useCallback(async () => {
    const res = await fetch('/api/documents/audit', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setAuditLogs(json.data);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    const res = await fetch('/api/documents/requests', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setRequests(json.data);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    const res = await fetch('/api/documents/config/categories', { credentials: 'include' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setCategoriesConfig(json.data);
    }
  }, []);

  useEffect(() => {
    if (tab === 'audit') void loadAudit();
    if (tab === 'requests') void loadRequests();
    if (tab === 'config' && canManageConfig) void loadConfig();
  }, [tab, loadAudit, loadRequests, loadConfig, canManageConfig]);

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
    setCommentText('');
  };

  const triggerSignedDownload = async (docId: string, attachmentId?: string, version?: number) => {
    setNotice(null);
    const qs = new URLSearchParams();
    if (attachmentId) qs.set('attachmentId', attachmentId);
    if (version) qs.set('version', String(version));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await fetch(`/api/documents/${docId}/download-url${suffix}`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Signed download denied.');
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = json.data.url;
    anchor.download = json.data.fileName || 'document';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleUploadChildFile = (mode: 'version' | 'attachment', file: File | undefined) => {
    if (!file || !selectedDetail) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const contentBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setSaving(true);
      try {
        const endpoint =
          mode === 'version'
            ? `/api/documents/${selectedDetail.document.id}/versions`
            : `/api/documents/${selectedDetail.document.id}/attachments`;
        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            sizeBytes: file.size,
            contentBase64,
            changeNote: mode === 'version' ? `Uploaded revision "${file.name}"` : undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setNotice(json.error || `Failed to upload ${mode}.`);
          return;
        }
        setNotice(
          mode === 'version'
            ? `Uploaded revision v${json.data.document.currentVersion} cleanly.`
            : `Attached "${file.name}" cleanly.`
        );
        await openDocument(selectedDetail.document.id);
        await loadList();
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetail || commentText.trim().length < 2) return;
    const res = await fetch(`/api/documents/${selectedDetail.document.id}/comments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentText.trim(), isInternal: commentInternal }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Could not post comment.');
      return;
    }
    setCommentText('');
    await openDocument(selectedDetail.document.id);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch('/api/documents/requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: reqTargetRegNo.trim() || 'stu-001',
          targetUserName: reqTargetName.trim(),
          targetRegNo: reqTargetRegNo.trim() || undefined,
          targetRole: 'STUDENT',
          categoryCode: reqCategory,
          title: reqTitle.trim(),
          instructions: reqInstructions.trim(),
          dueDate: reqDueDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotice(json.error || 'Failed to issue document request.');
        return;
      }
      setNotice(`Issued document request ${json.data.requestNumber} to ${json.data.targetUserName}.`);
      setReqTitle('');
      setReqInstructions('');
      await loadRequests();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategoryPolicy = async (
    code: string,
    patch: { maxSizeMb?: number; approvalRequired?: boolean; active?: boolean; retentionDays?: number }
  ) => {
    const res = await fetch(`/api/documents/config/categories/${code}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Failed to update category policy.');
      return;
    }
    setNotice(`Updated DMS policy for ${code}.`);
    await loadConfig();
  };

  const handleRunBackupCheck = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch('/api/documents/config/backup-check', {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotice(json.error || 'Backup integrity verification failed.');
        return;
      }
      setBackupReport(json.data as BackupReportDto);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;
    const res = await fetch(`/api/documents/verify/${encodeURIComponent(verifyInput.trim())}`);
    const json = await res.json();
    if (json?.success) {
      setVerifyResult(json.data);
    }
  };

  const navTabs: [DocWorkspaceTab, string][] = [
    ['mine', 'My Documents'],
    ['upload', 'Upload Centre'],
    ['pending_approvals', 'Pending Approval'],
    ['shared', 'Shared Documents'],
    ['archived', 'Document Archive'],
    ['verify', 'Verification'],
    ['all', 'All Accessible'],
    ['issued', 'Issued Official'],
    ['requests', 'Document Requests'],
    ['templates', 'Templates'],
    ['designer', 'A4 Designer'],
    ['audit', 'Audit Trail'],
    ...(canManageConfig ? ([['config', 'System Config & Backups']] as [DocWorkspaceTab, string][]) : []),
  ];

  const isListView =
    tab !== 'designer' &&
    tab !== 'templates' &&
    tab !== 'verify' &&
    tab !== 'audit' &&
    tab !== 'upload' &&
    tab !== 'requests' &&
    tab !== 'config';

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Centralised Document Management System (DMS)"
        description={`Unified secure upload, verification, approval workflow, digital signatures, and A4 official issuance for ${user.roleTitle}.`}
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
              <FileUp size={15} /> Upload Centre
            </StaffButton>
            <StaffButton
              variant="secondary"
              onClick={() => {
                setSelectedDetail(null);
                setTab('verify');
              }}
            >
              <QrCode size={15} /> Verification
            </StaffButton>
            <StaffButton
              onClick={() => {
                setSelectedDetail(null);
                setEditingPayload(null);
                setTab('designer');
              }}
            >
              <FilePlus2 size={15} /> A4 Designer
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

      {/* KPI Strip */}
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
          label="Drafts & Corrections"
          value={stats.drafts}
          description="Awaiting submission or update"
          icon={PenTool}
          onClick={() => {
            setSelectedDetail(null);
            setTab('mine');
          }}
        />
        <StaffStatCard
          label="Pending Approval"
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
        {navTabs.map(([key, label]) => (
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

      {/* Upload Centre */}
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

      {/* Verification */}
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
            <StaffButton onClick={() => void handleVerify()}>Verify Authenticity</StaffButton>
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

      {/* Document Requests */}
      {tab === 'requests' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <ClipboardList size={17} className="text-[#1769AA]" /> Outstanding Document Requests
            </h2>
            {requests.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No document requests logged yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <div key={r.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                        {r.requestNumber} · {r.targetUserName} {r.targetRegNo ? `(${r.targetRegNo})` : ''}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">{r.title}</div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{r.instructions}</p>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Requested by {r.requestedByName}
                        {r.dueDate ? ` · Due ${r.dueDate.slice(0, 10)}` : ''}
                      </div>
                    </div>
                    <StaffStatusTag status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Request Document From Student / Staff
            </h3>
            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Student / Recipient Name
                  <input
                    type="text"
                    required
                    value={reqTargetName}
                    onChange={(e) => setReqTargetName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Registration / Staff No.
                  <input
                    type="text"
                    required
                    value={reqTargetRegNo}
                    onChange={(e) => setReqTargetRegNo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono"
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Required Document Category
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as DocumentCategory)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                >
                  {DMS_CATEGORY_CATALOG.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Request Title
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. Certified KCSE Result Slip"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Instructions &amp; Due Date
                <textarea
                  rows={2}
                  required
                  value={reqInstructions}
                  onChange={(e) => setReqInstructions(e.target.value)}
                  placeholder="Specify scan clarity, certification stamp, or submission deadline..."
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </label>
              <input
                type="date"
                value={reqDueDate}
                onChange={(e) => setReqDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
              <StaffButton type="submit" disabled={saving}>
                <Send size={14} /> Issue Document Request
              </StaffButton>
            </form>
          </section>
        </div>
      )}

      {/* System Config & Backups (Admin / Principal / QA only) */}
      {tab === 'config' && canManageConfig && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                  <DatabaseBackup size={18} className="text-[#1769AA]" /> Private Vault Integrity &amp; Backup Audit
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verifies stored files outside public/ against registered SHA-256 checksums. Super Admin retains governance configuration without overriding restricted medical, welfare, or HR confidentiality.
                </p>
              </div>
              <StaffButton onClick={() => void handleRunBackupCheck()} disabled={saving}>
                <ShieldCheck size={14} /> Run Backup Integrity Check
              </StaffButton>
            </div>

            {backupReport && (
              <div className="grid gap-3 sm:grid-cols-4 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                <div>
                  <div className="text-slate-500">Vault Status</div>
                  <div className="mt-1">
                    <StaffStatusTag status={backupReport.status} />
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Verified Checksums</div>
                  <div className="mt-1 font-bold text-[#102D50] dark:text-white tabular-nums">
                    {backupReport.verifiedChecksums} / {backupReport.storedBinaryFiles}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Missing / Mismatches</div>
                  <div className="mt-1 font-bold text-[#102D50] dark:text-white tabular-nums">
                    {backupReport.missingFiles} missing · {backupReport.checksumMismatches} mismatch
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Private Storage Footprint</div>
                  <div className="mt-1 font-bold text-[#102D50] dark:text-white tabular-nums">
                    {formatBytesCompact(backupReport.totalStoredBytes)}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Settings2 size={16} className="text-[#1769AA]" /> Category Limits, Retention Policies &amp; Approval Rules ({categoriesConfig.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Module</th>
                    <th className="py-2 pr-3">Default Policy</th>
                    <th className="py-2 pr-3">Max MB</th>
                    <th className="py-2 pr-3">Retention (Days)</th>
                    <th className="py-2 pr-3">Approval</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoriesConfig.map((cat) => (
                    <tr key={cat.code}>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-white">
                        {cat.name}
                        <div className="font-mono text-[10px] text-slate-400">{cat.code}</div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px]">{cat.moduleKey}</td>
                      <td className="py-2.5 pr-3">
                        <StaffStatusTag status={cat.defaultConfidentiality} />
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        <select
                          aria-label={`Max size for ${cat.code}`}
                          value={cat.maxSizeMb}
                          onChange={(e) =>
                            void handleUpdateCategoryPolicy(cat.code, {
                              maxSizeMb: Number(e.target.value),
                            })
                          }
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs"
                        >
                          {[5, 10, 15, 20, 25, 30].map((mb) => (
                            <option key={mb} value={mb}>
                              {mb} MB
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{cat.retentionDays}d</td>
                      <td className="py-2.5 pr-3">
                        <button
                          type="button"
                          onClick={() =>
                            void handleUpdateCategoryPolicy(cat.code, {
                              approvalRequired: !cat.approvalRequired,
                            })
                          }
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold"
                        >
                          {cat.approvalRequired ? 'Required' : 'Direct'}
                        </button>
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleUpdateCategoryPolicy(cat.code, { active: !cat.active })
                          }
                          className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                            cat.active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {cat.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Global Audit Trail */}
      {tab === 'audit' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <History size={17} /> Immutable Document &amp; Security Audit Trail
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
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                    {log.createdAt.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Document Register & Inspector */}
      {isListView && (
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
                  placeholder="Search reference, title, filename, or recipient..."
                  actions={
                    <select
                      aria-label="Filter by category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <option value="ALL">All Categories</option>
                      {DMS_CATEGORY_CATALOG.map((cat) => (
                        <option key={cat.code} value={cat.code}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  }
                />

                {docs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No authorized documents match this view.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {docs.map((doc) => {
                      const active = selectedDetail?.document.id === doc.id;
                      const catMeta = getDmsCategoryMeta(doc.category);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => void openDocument(doc.id)}
                          className={`w-full text-left py-4 px-3 rounded-xl transition-colors flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                            active
                              ? 'bg-[#eef4fd] dark:bg-slate-800/80'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                                {doc.referenceNumber ?? doc.documentNumber ?? 'DRAFT · NO REF'}
                              </span>
                              <span className="text-slate-400" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {catMeta?.name ?? doc.category}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                v{doc.currentVersion}
                                {doc.fileSizeBytes ? ` · ${formatBytesCompact(doc.fileSizeBytes)}` : ''}
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
                      Download via signed URLs, review version history, post verification comments, approve, sign, or issue.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400">
                          {selectedDetail.document.referenceNumber ??
                            selectedDetail.document.documentNumber ??
                            'UNISSUED DRAFT'}
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
                      {selectedDetail.document.checksumSha256 && (
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all">
                          SHA-256: {selectedDetail.document.checksumSha256}
                        </p>
                      )}
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
                      <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                        {selectedDetail.document.bodyContent}
                      </p>
                    </div>

                    {/* Lifecycle & File Actions */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-[#102D50] dark:text-white">
                        Authorized Document Actions
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedDetail.allowedActions.canExport && (
                          <StaffButton
                            variant="secondary"
                            onClick={() => void triggerSignedDownload(selectedDetail.document.id)}
                          >
                            <Download size={14} /> Signed Download
                          </StaffButton>
                        )}

                        {selectedDetail.allowedActions.canEdit && (
                          <>
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
                            <input
                              ref={revisionInputRef}
                              type="file"
                              className="hidden"
                              onChange={(e) => handleUploadChildFile('version', e.target.files?.[0])}
                            />
                            <StaffButton
                              variant="secondary"
                              disabled={saving}
                              onClick={() => revisionInputRef.current?.click()}
                            >
                              <Upload size={14} /> New Version
                            </StaffButton>
                            <input
                              ref={attachmentInputRef}
                              type="file"
                              className="hidden"
                              onChange={(e) => handleUploadChildFile('attachment', e.target.files?.[0])}
                            />
                            <StaffButton
                              variant="secondary"
                              disabled={saving}
                              onClick={() => attachmentInputRef.current?.click()}
                            >
                              <Paperclip size={14} /> Add Attachment
                            </StaffButton>
                          </>
                        )}

                        {selectedDetail.allowedActions.canSubmit && (
                          <StaffButton
                            onClick={() =>
                              void runWorkflowAction(selectedDetail.document.id, 'submit', {})
                            }
                          >
                            <Send size={14} /> Submit for Approval
                          </StaffButton>
                        )}

                        {selectedDetail.allowedActions.canIssue && (
                          <StaffButton
                            variant="success"
                            onClick={() =>
                              void runWorkflowAction(selectedDetail.document.id, 'issue', {})
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
                                void runWorkflowAction(selectedDetail.document.id, 'archive', {})
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
                                void runWorkflowAction(selectedDetail.document.id, 'restore', {})
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
                            placeholder="Review comment (required for correction/reject)..."
                            className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
                          />
                          <div className="flex flex-wrap gap-2">
                            {selectedDetail.allowedActions.canApprove && (
                              <StaffButton
                                variant="success"
                                onClick={() =>
                                  void runWorkflowAction(selectedDetail.document.id, 'approve', {
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
                                  void runWorkflowAction(
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
                                  void runWorkflowAction(selectedDetail.document.id, 'reject', {
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
                            Apply Digital Signature
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
                                void runWorkflowAction(selectedDetail.document.id, 'sign', {
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
                                void runWorkflowAction(selectedDetail.document.id, 'share', {
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
                                void runWorkflowAction(selectedDetail.document.id, 'revoke', {
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

                    {/* Versions, Attachments, Comments, Approvals, Signatures */}
                    <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
                      <div>
                        <div className="font-bold text-[#102D50] dark:text-white mb-1">
                          Version History ({selectedDetail.versions.length})
                        </div>
                        <div className="space-y-1">
                          {selectedDetail.versions.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300"
                            >
                              <span>
                                <strong className="font-mono">v{v.versionNumber}</strong> —{' '}
                                {v.changeNote} ({v.editedByName})
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-[11px] text-slate-400">
                                  {v.createdAt.slice(0, 10)}
                                </span>
                                {selectedDetail.allowedActions.canExport && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void triggerSignedDownload(
                                        selectedDetail.document.id,
                                        undefined,
                                        v.versionNumber
                                      )
                                    }
                                    className="text-[#1769AA] hover:underline"
                                  >
                                    Download
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedDetail.attachments && selectedDetail.attachments.length > 0 && (
                        <div>
                          <div className="font-bold text-[#102D50] dark:text-white mb-1">
                            Supporting Attachments ({selectedDetail.attachments.length})
                          </div>
                          <div className="space-y-1">
                            {selectedDetail.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300"
                              >
                                <span className="truncate">
                                  {att.fileName} ({formatBytesCompact(att.fileSizeBytes)})
                                </span>
                                {selectedDetail.allowedActions.canExport && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void triggerSignedDownload(selectedDetail.document.id, att.id)
                                    }
                                    className="text-[#1769AA] hover:underline shrink-0"
                                  >
                                    Download
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

                      {/* Comments */}
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                        <div className="font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                          <MessageSquare size={13} /> Comments &amp; Review Thread (
                          {selectedDetail.comments?.length ?? 0})
                        </div>
                        {selectedDetail.comments && selectedDetail.comments.length > 0 && (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {selectedDetail.comments.map((c) => (
                              <div
                                key={c.id}
                                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1.5 text-[11px]"
                              >
                                <div className="flex justify-between text-slate-500">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {c.authorName} ({c.authorRole})
                                  </span>
                                  <span>{c.isInternal ? 'Staff Only' : c.createdAt.slice(0, 10)}</span>
                                </div>
                                <p className="mt-0.5 text-slate-700 dark:text-slate-300">{c.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <form onSubmit={handleAddComment} className="space-y-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write review comment or note..."
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={commentInternal}
                                onChange={(e) => setCommentInternal(e.target.checked)}
                                className="accent-[#1769AA]"
                              />
                              <span>Internal staff note</span>
                            </label>
                            <StaffButton type="submit" variant="secondary" disabled={commentText.trim().length < 2}>
                              Post Comment
                            </StaffButton>
                          </div>
                        </form>
                      </div>
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
