import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileUp,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { StaffButton, StaffStatusTag } from '../staff/components/StaffDashboardUI';
import {
  DMS_CATEGORY_CATALOG,
  formatBytesCompact,
  getCategoriesForModule,
  getDmsCategoryMeta,
  type DmsModuleKey,
  type DocumentCategory,
  type DocumentConfidentiality,
} from './dmsCatalog';

export interface UploadedDocumentResult {
  document: {
    id: string;
    documentNumber?: string | null;
    title: string;
    category: DocumentCategory;
    confidentiality: DocumentConfidentiality;
    status: string;
    currentVersion: number;
    originalFileName?: string | null;
    fileSizeBytes?: number;
    checksumSha256?: string | null;
    scanStatus?: string;
  };
  checksumSha256: string;
  scanStatus: string;
}

export interface UniversalDocumentUploaderProps {
  moduleKey?: DmsModuleKey | 'ALL';
  allowedCategories?: DocumentCategory[];
  fixedCategory?: DocumentCategory;
  isStudent?: boolean;
  defaultTitle?: string;
  defaultRecipient?: string;
  academicYear?: string;
  termLabel?: string;
  courseOrClass?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedStudentOrStaffId?: string;
  requestId?: string;
  submitNow?: boolean;
  lockConfidentiality?: boolean;
  compact?: boolean;
  submitLabel?: string;
  onUploaded?: (result: UploadedDocumentResult) => void | Promise<void>;
  onCancel?: () => void;
}

const DANGEROUS_EXT_RE = /\.(exe|bat|cmd|sh|ps1|vbs|js|mjs|cjs|dll|msi|scr|com|php|py|pl|rb)$/i;

function inferMimeType(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.xlsx'))
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.pptx'))
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.zip')) return 'application/zip';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'image/jpeg';
}

export default function UniversalDocumentUploader({
  moduleKey = 'ALL',
  allowedCategories,
  fixedCategory,
  isStudent = false,
  defaultTitle = '',
  defaultRecipient = 'Academic Registry',
  academicYear: initialYear = String(new Date().getFullYear()),
  termLabel: initialTerm = 'Term 1',
  courseOrClass: initialCourse = '',
  relatedEntityType,
  relatedEntityId,
  relatedStudentOrStaffId,
  requestId,
  submitNow: initialSubmitNow = true,
  lockConfidentiality = false,
  compact = false,
  submitLabel,
  onUploaded,
  onCancel,
}: UniversalDocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableCategories = useMemo(() => {
    if (fixedCategory) {
      const found = getDmsCategoryMeta(fixedCategory);
      return found ? [found] : DMS_CATEGORY_CATALOG.slice(0, 1);
    }
    const list = getCategoriesForModule(moduleKey, isStudent, allowedCategories);
    return list.length > 0 ? list : getCategoriesForModule('ALL', isStudent);
  }, [fixedCategory, moduleKey, isStudent, allowedCategories]);

  const [category, setCategory] = useState<DocumentCategory>(
    fixedCategory ?? availableCategories[0]?.code ?? 'OFFICIAL_MEMO'
  );

  const activeCategoryMeta = useMemo(
    () => getDmsCategoryMeta(category) ?? availableCategories[0] ?? DMS_CATEGORY_CATALOG[0],
    [category, availableCategories]
  );

  const [title, setTitle] = useState(defaultTitle);
  const [confidentiality, setConfidentiality] = useState<DocumentConfidentiality>(
    activeCategoryMeta.defaultConfidentiality
  );
  const [recipientLabel, setRecipientLabel] = useState(defaultRecipient);
  const [academicYear, setAcademicYear] = useState(initialYear);
  const [termLabel, setTermLabel] = useState(initialTerm);
  const [courseOrClass, setCourseOrClass] = useState(initialCourse);
  const [description, setDescription] = useState('');
  const [submitNow, setSubmitNow] = useState(initialSubmitNow);

  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    contentBase64: string;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadedDocumentResult | null>(null);

  useEffect(() => {
    if (fixedCategory) {
      setCategory(fixedCategory);
      const meta = getDmsCategoryMeta(fixedCategory);
      if (meta) setConfidentiality(meta.defaultConfidentiality);
    }
  }, [fixedCategory]);

  const disallowPublic =
    activeCategoryMeta.isUnpublishedExamProtected ||
    activeCategoryMeta.code === 'STUDENT_WELFARE_CONFIDENTIAL' ||
    activeCategoryMeta.code === 'ABSENCE_EXPLANATION' ||
    activeCategoryMeta.code === 'EMPLOYMENT_CONTRACT';

  const handleCategoryChange = (nextCode: DocumentCategory) => {
    setCategory(nextCode);
    const meta = getDmsCategoryMeta(nextCode);
    if (meta && !lockConfidentiality) {
      setConfidentiality(meta.defaultConfidentiality);
    }
  };

  const handleFilePicked = (file: File | undefined) => {
    setError(null);
    setResult(null);
    if (!file) return;

    const segments = file.name.split('.');
    if (segments.length >= 3 && DANGEROUS_EXT_RE.test(`.${segments[segments.length - 1]}`)) {
      setSelectedFile(null);
      setError('Blocked locally: suspicious double-extension executable filename.');
      return;
    }
    if (DANGEROUS_EXT_RE.test(file.name)) {
      setSelectedFile(null);
      setError('Blocked locally: executable and script files are quarantined by college security.');
      return;
    }

    const ext = `.${(segments[segments.length - 1] ?? '').toLowerCase()}`;
    const allowedList = activeCategoryMeta.acceptedExtensions.split(',');
    if (!allowedList.includes(ext)) {
      setSelectedFile(null);
      setError(
        `File type ${ext || '(unknown)'} is not permitted for "${activeCategoryMeta.name}". Allowed: ${activeCategoryMeta.acceptedExtensions}`
      );
      return;
    }

    const maxBytes = activeCategoryMeta.maxSizeMb * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes) {
      setSelectedFile(null);
      setError(
        `File size (${formatBytesCompact(file.size)}) must be between 1 byte and ${activeCategoryMeta.maxSizeMb} MB.`
      );
      return;
    }

    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }

    const mimeType = inferMimeType(file);
    setReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setSelectedFile({
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
        contentBase64: base64Part,
      });
      setReadingFile(false);
    };
    reader.onerror = () => {
      setReadingFile(false);
      setSelectedFile(null);
      setError('Failed to read selected file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file before uploading.');
      return;
    }
    if (readingFile) {
      setError('Please wait while the file finishes loading.');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || selectedFile.fileName.replace(/\.[^.]+$/, ''),
          fileName: selectedFile.fileName,
          mimeType: selectedFile.mimeType,
          sizeBytes: selectedFile.sizeBytes,
          contentBase64: selectedFile.contentBase64,
          category,
          confidentiality,
          recipientLabel: recipientLabel.trim() || activeCategoryMeta.name,
          description: description.trim() || undefined,
          moduleKey: activeCategoryMeta.moduleKey,
          academicYear,
          termLabel,
          courseOrClass: courseOrClass.trim() || undefined,
          relatedEntityType,
          relatedEntityId,
          relatedStudentOrStaffId,
          requestId,
          submitNow,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Document upload was rejected by security validation.');
        return;
      }
      const uploaded = json.data as UploadedDocumentResult;
      setResult(uploaded);
      setSelectedFile(null);
      setDescription('');
      if (!defaultTitle) setTitle('');
      if (onUploaded) {
        await onUploaded(uploaded);
      }
    } catch {
      setError('Network error while uploading document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={compact ? 'space-y-4' : 'grid gap-6 xl:grid-cols-[1.35fr_1fr] items-start'}>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <FileUp size={17} className="text-[#1769AA]" />
              {fixedCategory ? activeCategoryMeta.name : 'Upload Institutional Document'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {activeCategoryMeta.description}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
            Max {activeCategoryMeta.maxSizeMb} MB
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-800 dark:text-red-200 flex items-start gap-2">
            <ShieldAlert size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result && compact && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 size={15} /> Uploaded &amp; Verified Clean
              </span>
              <StaffStatusTag status={result.scanStatus} />
            </div>
            <div className="text-slate-700 dark:text-slate-200">
              <strong>{result.document.title}</strong> ({result.document.documentNumber ?? result.document.id})
            </div>
            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all">
              SHA-256: {result.checksumSha256}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilePicked(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-5 text-center cursor-pointer hover:border-[#1769AA] transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={activeCategoryMeta.acceptedExtensions}
              onChange={(e) => handleFilePicked(e.target.files?.[0])}
              className="hidden"
            />
            <FileUp size={24} className="mx-auto text-[#1769AA]" />
            <p className="mt-2 text-xs sm:text-sm font-bold text-[#102D50] dark:text-white">
              {readingFile
                ? 'Reading file...'
                : selectedFile
                ? selectedFile.fileName
                : 'Click to browse or drag & drop file here'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {selectedFile
                ? `${selectedFile.mimeType} · ${formatBytesCompact(selectedFile.sizeBytes)}`
                : `Accepted: ${activeCategoryMeta.acceptedExtensions.replaceAll(',', ', ')} (up to ${activeCategoryMeta.maxSizeMb} MB)`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Document Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. KCSE Certificate / Medical Note / Lesson Plan"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Target Office / Recipient
              <input
                type="text"
                value={recipientLabel}
                onChange={(e) => setRecipientLabel(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {!fixedCategory && (
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Document Category
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as DocumentCategory)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Confidentiality Level
              <select
                value={confidentiality}
                disabled={lockConfidentiality}
                onChange={(e) =>
                  setConfidentiality(e.target.value as DocumentConfidentiality)
                }
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white disabled:opacity-60"
              >
                {!disallowPublic && <option value="PUBLIC">PUBLIC</option>}
                <option value="INTERNAL">INTERNAL (Authorized Staff / Owner)</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL (Scoped Office &amp; Owner)</option>
                <option value="RESTRICTED">RESTRICTED (Strict Need-To-Know Only)</option>
              </select>
            </label>
          </div>

          {!compact && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Academic Year
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Term / Semester
                <select
                  value={termLabel}
                  onChange={(e) => setTermLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                  <option value="Annual">Annual / Full Year</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Course / Unit (Optional)
                <input
                  type="text"
                  value={courseOrClass}
                  onChange={(e) => setCourseOrClass(e.target.value)}
                  placeholder="e.g. DICT-202 / CS-101"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </label>
            </div>
          )}

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            Notes / Summary Description
            <textarea
              rows={compact ? 2 : 3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context or explanation recorded in DMS audit history..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </label>

          {activeCategoryMeta.approvalRequired && (
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={submitNow}
                onChange={(e) => setSubmitNow(e.target.checked)}
                className="accent-[#1769AA]"
              />
              <span>Submit immediately to designated officer/HOD for verification &amp; approval</span>
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <StaffButton type="submit" disabled={uploading || readingFile || !selectedFile}>
              <FileUp size={14} />{' '}
              {uploading
                ? 'Scanning & Encrypting...'
                : submitLabel ?? 'Upload & Register Document'}
            </StaffButton>
            {onCancel && (
              <StaffButton variant="secondary" onClick={onCancel}>
                Cancel
              </StaffButton>
            )}
          </div>
        </form>
      </section>

      {!compact && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h4 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <ShieldCheck size={17} className="text-[#1769AA]" /> Security Scan &amp; Storage Safeguards
          </h4>

          {result ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 size={15} /> Stored in Private Vault
                </span>
                <StaffStatusTag status={result.scanStatus} />
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Document Title</div>
                <div className="font-bold text-[#102D50] dark:text-white">
                  {result.document.title} (v{result.document.currentVersion})
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">SHA-256 Digest</div>
                <div className="font-mono break-all text-[11px] bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 mt-1">
                  {result.checksumSha256}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 flex items-start gap-2.5">
                <Lock size={15} className="shrink-0 text-[#1769AA] mt-0.5" />
                <div>
                  <strong>Magic-Byte &amp; Malware Quarantine:</strong> Binary signatures, double extensions, and executable payloads are verified server-side before saving.
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
                <strong>Private Storage &amp; Signed Links:</strong> Uploaded files live outside public web folders and download exclusively via short-lived HMAC signed URLs.
              </div>
              {activeCategoryMeta.isUnpublishedExamProtected && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-amber-900 dark:text-amber-200">
                  <strong>Exam Custody Rule:</strong> Unpublished examination papers and marking schemes are isolated from all student accounts until official release.
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
