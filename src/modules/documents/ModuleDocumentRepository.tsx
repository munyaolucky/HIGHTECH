import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  FileUp,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Upload,
  XCircle,
} from 'lucide-react';
import { StaffButton, StaffStatusTag } from '../staff/components/StaffDashboardUI';
import {
  formatBytesCompact,
  getDmsCategoryMeta,
  type DmsModuleKey,
  type DocumentCategory,
  type DocumentConfidentiality,
} from './dmsCatalog';
import UniversalDocumentUploader from './UniversalDocumentUploader';

interface ModuleDocItem {
  id: string;
  documentNumber?: string | null;
  referenceNumber: string | null;
  title: string;
  category: DocumentCategory;
  confidentiality: DocumentConfidentiality;
  status: string;
  ownerName: string;
  recipientLabel: string;
  originalFileName?: string | null;
  fileSizeBytes?: number;
  currentVersion: number;
  checksumSha256?: string | null;
  courseOrClass?: string | null;
  academicYear?: string;
  termLabel?: string;
  createdAt: string;
}

interface ModuleDocDetail {
  document: ModuleDocItem & {
    subjectLine: string;
    bodyContent: string;
    verificationHash: string | null;
  };
  versions: {
    id: string;
    versionNumber: number;
    fileName?: string | null;
    fileSizeBytes?: number;
    editedByName: string;
    changeNote: string;
    createdAt: string;
  }[];
  comments: {
    id: string;
    authorName: string;
    authorRole: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
  }[];
  allowedActions: {
    canEdit: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canRequestChanges: boolean;
    canReject: boolean;
    canExport: boolean;
  };
}

export interface ModuleDocumentRepositoryProps {
  moduleKey?: DmsModuleKey | 'ALL';
  allowedCategories?: DocumentCategory[];
  fixedCategory?: DocumentCategory;
  title: string;
  description: string;
  isStudentView?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedStudentOrStaffId?: string;
  defaultRecipient?: string;
  courseOrClass?: string;
  submitNowDefault?: boolean;
  compact?: boolean;
  securityBanner?: string;
  onDocumentChanged?: () => void | Promise<void>;
}

export default function ModuleDocumentRepository({
  moduleKey = 'ALL',
  allowedCategories,
  fixedCategory,
  title,
  description,
  isStudentView = false,
  relatedEntityType,
  relatedEntityId,
  relatedStudentOrStaffId,
  defaultRecipient,
  courseOrClass,
  submitNowDefault = true,
  compact = false,
  securityBanner,
  onDocumentChanged,
}: ModuleDocumentRepositoryProps) {
  const revisionInputRef = useRef<HTMLInputElement | null>(null);
  const [docs, setDocs] = useState<ModuleDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showUploader, setShowUploader] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<ModuleDocDetail | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [busyAction, setBusyAction] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        pageSize: '30',
      });
      if (moduleKey && moduleKey !== 'ALL') params.set('moduleKey', moduleKey);
      if (fixedCategory) params.set('category', fixedCategory);
      if (relatedEntityType) params.set('relatedEntityType', relatedEntityType);
      if (relatedEntityId) params.set('relatedEntityId', relatedEntityId);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load module documents.');
      }
      let items: ModuleDocItem[] = json.data.items ?? [];
      if (allowedCategories && allowedCategories.length > 0) {
        items = items.filter((d) => allowedCategories.includes(d.category));
      }
      setDocs(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch documents.');
    } finally {
      setLoading(false);
    }
  }, [moduleKey, fixedCategory, relatedEntityType, relatedEntityId, search, allowedCategories]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const openDocument = async (docId: string) => {
    setNotice(null);
    const res = await fetch(`/api/documents/${docId}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Unable to inspect selected document.');
      return;
    }
    setSelectedDetail(json.data as ModuleDocDetail);
  };

  const triggerSignedDownload = async (docId: string, versionNumber?: number) => {
    setNotice(null);
    const q = versionNumber ? `?version=${versionNumber}` : '';
    const res = await fetch(`/api/documents/${docId}/download-url${q}`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Download authorization denied.');
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = json.data.url;
    anchor.download = json.data.fileName || 'document';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetail || commentText.trim().length < 2) return;
    setBusyAction(true);
    try {
      const res = await fetch(`/api/documents/${selectedDetail.document.id}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: commentText.trim(),
          isInternal: isStudentView ? false : commentInternal,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotice(json.error || 'Could not post comment.');
        return;
      }
      setCommentText('');
      await openDocument(selectedDetail.document.id);
    } finally {
      setBusyAction(false);
    }
  };

  const handleReviewAction = async (action: 'approve' | 'request-changes' | 'reject') => {
    if (!selectedDetail) return;
    setBusyAction(true);
    try {
      const res = await fetch(`/api/documents/${selectedDetail.document.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: reviewComment.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotice(json.error || 'Review action failed.');
        return;
      }
      setReviewComment('');
      setNotice(`Document updated (${action.replace('-', ' ').toUpperCase()}).`);
      await loadDocuments();
      await openDocument(selectedDetail.document.id);
      if (onDocumentChanged) await onDocumentChanged();
    } finally {
      setBusyAction(false);
    }
  };

  const handleRevisionUpload = (file: File | undefined) => {
    if (!file || !selectedDetail) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const contentBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setBusyAction(true);
      try {
        const res = await fetch(`/api/documents/${selectedDetail.document.id}/versions`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            sizeBytes: file.size,
            contentBase64,
            changeNote: `Uploaded revision "${file.name}"`,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setNotice(json.error || 'Failed to upload revision.');
          return;
        }
        setNotice(`Uploaded revision v${json.data.document.currentVersion}.`);
        await loadDocuments();
        await openDocument(selectedDetail.document.id);
        if (onDocumentChanged) await onDocumentChanged();
      } finally {
        setBusyAction(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-[#1769AA]" /> {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StaffButton variant="secondary" onClick={() => void loadDocuments()}>
              <RefreshCw size={14} /> Refresh
            </StaffButton>
            <StaffButton onClick={() => setShowUploader((v) => !v)}>
              <FileUp size={14} /> {showUploader ? 'Hide Uploader' : 'Upload File'}
            </StaffButton>
          </div>
        </div>

        {securityBanner && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{securityBanner}</span>
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-4 py-2.5 text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {showUploader && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <UniversalDocumentUploader
              moduleKey={moduleKey}
              allowedCategories={allowedCategories}
              fixedCategory={fixedCategory}
              isStudent={isStudentView}
              defaultRecipient={defaultRecipient}
              courseOrClass={courseOrClass}
              relatedEntityType={relatedEntityType}
              relatedEntityId={relatedEntityId}
              relatedStudentOrStaffId={relatedStudentOrStaffId}
              submitNow={submitNowDefault}
              compact={compact}
              onUploaded={async (res) => {
                setNotice(`Registered "${res.document.title}" (SHA-256 verified clean).`);
                setShowUploader(false);
                await loadDocuments();
                await openDocument(res.document.id);
                if (onDocumentChanged) await onDocumentChanged();
              }}
              onCancel={() => setShowUploader(false)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter documents by title, filename, or reference..."
            className="w-full sm:max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {docs.length} authorized record{docs.length === 1 ? '' : 's'}
          </span>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            {error}
          </div>
        ) : loading && docs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Loading authorized documents...
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No documents uploaded for this section yet. Click &ldquo;Upload File&rdquo; to register a record.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] items-start">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {docs.map((doc) => {
                const catMeta = getDmsCategoryMeta(doc.category);
                const selected = selectedDetail?.document.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    className={`p-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                      selected
                        ? 'bg-[#eef4fd] dark:bg-slate-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                          {doc.referenceNumber ?? doc.documentNumber ?? doc.id}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {catMeta?.name ?? doc.category}
                        </span>
                        {doc.confidentiality !== 'PUBLIC' && (
                          <span className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <Lock size={9} /> {doc.confidentiality}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white truncate">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {doc.originalFileName ? `${doc.originalFileName} · ` : ''}
                        {formatBytesCompact(doc.fileSizeBytes)} · v{doc.currentVersion} · {doc.ownerName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StaffStatusTag status={doc.status} />
                      <button
                        type="button"
                        onClick={() => void openDocument(doc.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye size={13} /> Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => void triggerSignedDownload(doc.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#102D50] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#173d6b]"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inspector */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 space-y-4">
              {!selectedDetail ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  Select any document to inspect checksums, upload a revision, download via signed URL, or view comments.
                </div>
              ) : (
                <>
                  <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400">
                        {selectedDetail.document.referenceNumber ??
                          selectedDetail.document.documentNumber ??
                          selectedDetail.document.id}
                      </span>
                      <StaffStatusTag status={selectedDetail.document.status} />
                    </div>
                    <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                      {selectedDetail.document.title}
                    </h3>
                    {selectedDetail.document.checksumSha256 && (
                      <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 break-all">
                        SHA-256: {selectedDetail.document.checksumSha256}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {selectedDetail.document.bodyContent}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedDetail.allowedActions.canExport && (
                      <StaffButton
                        variant="secondary"
                        onClick={() => void triggerSignedDownload(selectedDetail.document.id)}
                      >
                        <Download size={13} /> Signed Download
                      </StaffButton>
                    )}
                    {selectedDetail.allowedActions.canEdit && (
                      <>
                        <input
                          ref={revisionInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => handleRevisionUpload(e.target.files?.[0])}
                        />
                        <StaffButton
                          variant="secondary"
                          disabled={busyAction}
                          onClick={() => revisionInputRef.current?.click()}
                        >
                          <Upload size={13} /> Upload v{selectedDetail.document.currentVersion + 1}
                        </StaffButton>
                      </>
                    )}
                  </div>

                  {(selectedDetail.allowedActions.canApprove ||
                    selectedDetail.allowedActions.canRequestChanges ||
                    selectedDetail.allowedActions.canReject) && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-3 space-y-2">
                      <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Independent Officer Review
                      </div>
                      <input
                        type="text"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Verification note or correction reason..."
                        className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        {selectedDetail.allowedActions.canApprove && (
                          <StaffButton
                            variant="success"
                            disabled={busyAction}
                            onClick={() => void handleReviewAction('approve')}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </StaffButton>
                        )}
                        {selectedDetail.allowedActions.canRequestChanges && (
                          <StaffButton
                            variant="secondary"
                            disabled={busyAction}
                            onClick={() => void handleReviewAction('request-changes')}
                          >
                            Request Correction
                          </StaffButton>
                        )}
                        {selectedDetail.allowedActions.canReject && (
                          <StaffButton
                            variant="danger"
                            disabled={busyAction}
                            onClick={() => void handleReviewAction('reject')}
                          >
                            <XCircle size={13} /> Reject
                          </StaffButton>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <div className="text-xs font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                      <MessageSquare size={13} /> Review Notes &amp; Comments ({selectedDetail.comments.length})
                    </div>
                    {selectedDetail.comments.length > 0 && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {selectedDetail.comments.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {c.authorName} ({c.authorRole})
                              </span>
                              <span>{c.isInternal ? 'Staff Note' : c.createdAt.slice(0, 10)}</span>
                            </div>
                            <p className="mt-0.5 text-slate-700 dark:text-slate-300">{c.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add review note or comment..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {!isStudentView ? (
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={commentInternal}
                              onChange={(e) => setCommentInternal(e.target.checked)}
                              className="accent-[#1769AA]"
                            />
                            <span>Internal staff note only</span>
                          </label>
                        ) : (
                          <span />
                        )}
                        <StaffButton type="submit" variant="secondary" disabled={busyAction || commentText.trim().length < 2}>
                          Post Note
                        </StaffButton>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
