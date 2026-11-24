import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  History,
  Send,
  Upload,
} from 'lucide-react';
import {
  readFileAsBase64,
  TEACHING_DOCUMENT_CATEGORY_LIST,
  teachingModuleApi,
  type TeachingDocumentDTO,
} from '../../../services/teachingModuleApi';
import ModuleDocumentRepository from '../../documents/ModuleDocumentRepository';

const UNIT_OPTIONS = [
  { code: 'CSC 301', title: 'Data Structures & Algorithms', assignmentId: 'asg-csc301', classGroupId: 'DICT-2026-A' },
  { code: 'CSC 305', title: 'Database Management Systems', assignmentId: 'asg-csc305', classGroupId: 'DICT-2026-A' },
  { code: 'CSC 312', title: 'Web Application Engineering', assignmentId: 'asg-csc312', classGroupId: 'DICT-2026-B' },
];

export default function TeachingDocumentsHub() {
  const [docs, setDocs] = useState<TeachingDocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [unitCode, setUnitCode] = useState('CSC 301');
  const [category, setCategory] = useState('LESSON_PLAN');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitNow, setSubmitNow] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Versioning modal/panel state
  const [versionTargetDoc, setVersionTargetDoc] = useState<TeachingDocumentDTO | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionSummary, setVersionSummary] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await teachingModuleApi.ensureLecturerSession();
      const rows = await teachingModuleApi.listDocuments({
        category: categoryFilter,
        status: statusFilter,
        search,
      });
      setDocs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load teaching documents.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please provide a document title.');
    setUploading(true);
    setError(null);
    try {
      const unitMeta = UNIT_OPTIONS.find((u) => u.code === unitCode) ?? UNIT_OPTIONS[0];
      let filePayload = {
        fileName: `${unitCode.replace(/\s+/g, '')}_${category.toLowerCase()}.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 24576,
        fileContentBase64: btoa(`HI-TECH Teaching Document: ${title}`),
      };
      if (selectedFile) {
        filePayload = await readFileAsBase64(selectedFile);
      }

      await teachingModuleApi.uploadDocument({
        assignmentId: unitMeta.assignmentId,
        unitCode: unitMeta.code,
        unitTitle: unitMeta.title,
        classGroupId: unitMeta.classGroupId,
        category,
        title: title.trim(),
        description: description.trim(),
        submitNow,
        ...filePayload,
      });
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setShowUpload(false);
      setNotice(`Uploaded "${title.trim()}" successfully.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTargetDoc) return;
    setUploading(true);
    setError(null);
    try {
      let filePayload = {
        fileName: `${versionTargetDoc.unitCode.replace(/\s+/g, '')}_v${versionTargetDoc.currentVersion + 1}.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 26800,
        fileContentBase64: btoa(`Updated revision v${versionTargetDoc.currentVersion + 1}: ${versionTargetDoc.title}`),
      };
      if (versionFile) {
        filePayload = await readFileAsBase64(versionFile);
      }
      await teachingModuleApi.addDocumentVersion(versionTargetDoc.id, {
        ...filePayload,
        changeSummary: versionSummary.trim() || `Updated to version ${versionTargetDoc.currentVersion + 1}`,
        submitNow: true,
      });
      setVersionTargetDoc(null);
      setVersionFile(null);
      setVersionSummary('');
      setNotice('Uploaded revised version and submitted for HOD verification.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add document version.');
    } finally {
      setUploading(false);
    }
  };

  const handleTransition = async (docId: string, action: 'SUBMIT' | 'ARCHIVE') => {
    try {
      setError(null);
      await teachingModuleApi.transitionDocumentStatus(docId, action);
      setNotice(action === 'SUBMIT' ? 'Document submitted to HOD.' : 'Document archived.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const returnedDocs = docs.filter((d) => d.status === 'RETURNED');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-400">
            Academic Compliance &amp; Document Vault
          </p>
          <h1 className="text-xl font-bold text-[#102D50] dark:text-white mt-0.5">
            Teaching Documents Hub
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Upload, version, and submit all 17 core &amp; advanced academic documents for HOD review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUpload((s) => !s)}
          className="px-4 py-2 rounded-xl bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
        >
          <Upload size={15} />
          {showUpload ? 'Close Upload Form' : 'Upload Teaching Document'}
        </button>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-[#B83232] dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {returnedDocs.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-[#F5EBDD]/60 dark:bg-amber-950/30 p-4 text-xs space-y-1.5">
          <strong className="text-[#102D50] dark:text-amber-200 block">
            Action Needed: {returnedDocs.length} document(s) returned by HOD for revision
          </strong>
          {returnedDocs.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-slate-700 dark:text-slate-200">
              <span>
                <span className="font-mono font-bold">{d.unitCode}</span> · {d.title}:{' '}
                <em>&ldquo;{d.approvalComments}&rdquo;</em>
              </span>
              <button
                type="button"
                onClick={() => setVersionTargetDoc(d)}
                className="font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
              >
                Upload Revised Version
              </button>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs"
        >
          <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <FilePlus2 size={16} className="text-[#1769AA]" />
            New Teaching Document Upload
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Course Unit</label>
              <select
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Document Category (17 Types)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {TEACHING_DOCUMENT_CATEGORY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Document Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Week 5 Graph Algorithms Lab Manual"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Notes / Scope Summary</label>
              <input
                type="text"
                placeholder="Topic scope, rubric notes, or cohort instructions"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Attachment (PDF, DOCX, PPTX, XLSX, ZIP — max 3 MB)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.zip"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={submitNow}
                onChange={(e) => setSubmitNow(e.target.checked)}
                className="rounded border-slate-300"
              />
              Submit immediately for HOD review
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-[#1769AA] hover:bg-[#12558a] text-white font-semibold disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Save Teaching Document'}
            </button>
          </div>
        </form>
      )}

      {versionTargetDoc && (
        <form
          onSubmit={handleAddVersion}
          className="rounded-2xl border-2 border-[#1769AA] bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <History size={16} className="text-[#1769AA]" />
              Add New Version (v{versionTargetDoc.currentVersion + 1}) — {versionTargetDoc.title}
            </h2>
            <button
              type="button"
              onClick={() => setVersionTargetDoc(null)}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Revision Summary</label>
              <input
                type="text"
                required
                placeholder="Addressed HOD feedback on practical rubric"
                value={versionSummary}
                onChange={(e) => setVersionSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Updated File (optional demo PDF)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.zip"
                onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-[#102D50] text-white font-semibold"
          >
            Upload v{versionTargetDoc.currentVersion + 1} &amp; Resubmit
          </button>
        </form>
      )}

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <select
          aria-label="Filter by document category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="ALL">All 17 Document Categories</option>
          {TEACHING_DOCUMENT_CATEGORY_LIST.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by approval status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="ALL">All Approval Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted (Awaiting HOD)</option>
          <option value="APPROVED">Approved</option>
          <option value="RETURNED">Returned for Revision</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search document title or unit code..."
          aria-label="Search teaching documents"
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* DOCUMENTS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-300">
            Loading teaching documents repository...
          </div>
        ) : docs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <FolderOpen size={24} className="mx-auto text-slate-400" />
            <p>No teaching documents match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Title &amp; Unit</th>
                  <th className="py-3 px-4 font-semibold">Version</th>
                  <th className="py-3 px-4 font-semibold">Status &amp; HOD Feedback</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-[#102D50] dark:text-blue-300 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText size={13} className="text-[#1769AA]" />
                        {doc.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 dark:text-white block">{doc.title}</strong>
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {doc.unitCode} · {doc.classGroupId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-200">
                      v{doc.currentVersion}
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {doc.versions[0]?.fileName ?? 'file.pdf'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          doc.status === 'APPROVED'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : doc.status === 'RETURNED'
                            ? 'text-[#B83232] dark:text-red-400'
                            : doc.status === 'SUBMITTED'
                            ? 'text-[#1769AA] dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                      {doc.approvalComments && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 max-w-xs">
                          {doc.approvalComments}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={teachingModuleApi.getDocumentDownloadUrl(doc.id, doc.currentVersion)}
                          download
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 font-medium"
                        >
                          <Download size={12} /> File
                        </a>
                        <button
                          type="button"
                          onClick={() => setVersionTargetDoc(doc)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[#102D50] dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                        >
                          + Version
                        </button>
                        {doc.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleTransition(doc.id, 'SUBMIT')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#1769AA] text-white font-medium inline-flex items-center gap-1"
                          >
                            <Send size={12} /> Submit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModuleDocumentRepository
        moduleKey="LECTURER"
        allowedCategories={[
          'LESSON_PLAN',
          'SCHEME_OF_WORK',
          'RECORD_OF_WORK',
          'LEARNING_MATERIAL',
          'ATTENDANCE_REGISTER_DOC',
          'ACADEMIC_CLASS_RESOURCE',
          'EXAM_SCHEDULE',
          'DEPARTMENT_REPORT',
        ]}
        defaultRecipient="Head of Department"
        title="Centralised Teaching Documents DMS Repository"
        description="Unified Central DMS vault with full SHA-256 verification, revision threads, signed downloads, and HOD/Principal review."
      />
    </div>
  );
}
