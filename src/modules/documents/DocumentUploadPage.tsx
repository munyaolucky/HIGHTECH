import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileCheck2,
  FileUp,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { StaffButton, StaffStatusTag } from '../staff/components/StaffDashboardUI';
import type { DocumentCategory, DocumentConfidentiality } from './DocumentDesigner';

interface UploadResponseData {
  document: {
    id: string;
    title: string;
    category: string;
    confidentiality: string;
    status: string;
    currentVersion: number;
  };
  checksumSha256: string;
  scanStatus: string;
}

const ALLOWED_EXTENSIONS = /\.(pdf|docx|png|jpg|jpeg|txt)$/i;

export default function DocumentUploadPage({
  onUploaded,
  onCancel,
}: {
  onUploaded: (docId: string) => void;
  onCancel?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('OFFICIAL_MEMO');
  const [confidentiality, setConfidentiality] = useState<DocumentConfidentiality>('INTERNAL');
  const [recipientLabel, setRecipientLabel] = useState('Academic Registry');
  const [description, setDescription] = useState('');

  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    contentBase64?: string;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponseData | null>(null);

  const handleFilePicked = (file: File | undefined) => {
    setError(null);
    setResult(null);
    if (!file) return;

    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      setSelectedFile(null);
      setError(
        'File quarantined locally: only PDF, DOCX, PNG, JPG, and TXT files are permitted by college security policy.'
      );
      return;
    }

    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setError('File size must be between 1 byte and 10 MB.');
      return;
    }

    const mimeType =
      file.type ||
      (file.name.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : file.name.toLowerCase().endsWith('.docx')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : file.name.toLowerCase().endsWith('.png')
        ? 'image/png'
        : file.name.toLowerCase().endsWith('.txt')
        ? 'text/plain'
        : 'image/jpeg');

    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setSelectedFile({
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
        contentBase64: base64Part.slice(0, 120000),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Select a file to upload.');
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
          title,
          fileName: selectedFile.fileName,
          mimeType: selectedFile.mimeType,
          sizeBytes: selectedFile.sizeBytes,
          contentBase64: selectedFile.contentBase64,
          category,
          confidentiality,
          recipientLabel,
          description,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Document upload failed.');
        return;
      }
      setResult(json.data as UploadResponseData);
    } catch {
      setError('Network error while uploading document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr] items-start">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <FileUp size={18} className="text-[#1769AA]" /> Upload &amp; Integrity-Verify Document
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Uploaded files undergo MIME/extension quarantine validation, receive a SHA-256 checksum, and enter the DMS approval &amp; digital signature pipeline.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-800 dark:text-red-200 flex items-start gap-2">
            <ShieldAlert size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilePicked(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-6 text-center cursor-pointer hover:border-[#1769AA] transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
              onChange={(e) => handleFilePicked(e.target.files?.[0])}
              className="hidden"
            />
            <FileUp size={28} className="mx-auto text-[#1769AA]" />
            <p className="mt-2 text-sm font-bold text-[#102D50] dark:text-white">
              {selectedFile
                ? selectedFile.fileName
                : 'Click to select file or drag & drop here'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedFile
                ? `${selectedFile.mimeType} · ${(selectedFile.sizeBytes / 1024).toFixed(1)} KB`
                : 'Allowed: PDF, DOCX, PNG, JPG, TXT (max 10 MB)'}
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
                placeholder="e.g. Senate Accreditation Compliance Dossier"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Target Recipient / Office
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="OFFICIAL_MEMO">Official Memo</option>
                <option value="INSTITUTIONAL_POLICY">Institutional Policy</option>
                <option value="ADMISSION_LETTER">Admission Letter</option>
                <option value="TRANSCRIPT_CERTIFICATE">Transcript / Certificate</option>
                <option value="FEE_STATEMENT">Fee Statement</option>
                <option value="EXAM_SCHEDULE">Exam Schedule</option>
                <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
                <option value="STUDENT_WELFARE_CONFIDENTIAL">Confidential Welfare</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Confidentiality Policy
              <select
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value as DocumentConfidentiality)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="INTERNAL">INTERNAL (College Staff)</option>
                <option value="DEPARTMENTAL">DEPARTMENTAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="RESTRICTED">RESTRICTED (Owner &amp; Named Recipients)</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            Description / Summary Notes
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional summary notes recorded in version v1..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <StaffButton type="submit" disabled={uploading || !selectedFile}>
              <FileUp size={14} /> {uploading ? 'Scanning & Hashing...' : 'Upload & Register Draft'}
            </StaffButton>
            {onCancel && (
              <StaffButton variant="secondary" onClick={onCancel}>
                Back to Repository
              </StaffButton>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
          <ShieldCheck size={17} className="text-[#1769AA]" /> Security Scan &amp; Integrity Status
        </h3>

        {result ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 size={15} /> Upload Registered
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
            <StaffButton onClick={() => onUploaded(result.document.id)}>
              <FileCheck2 size={14} /> Open Document in Inspector
            </StaffButton>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 flex items-start gap-2.5">
              <Lock size={15} className="shrink-0 text-[#1769AA] mt-0.5" />
              <div>
                <strong>Quarantine Protection:</strong> Executable scripts (`.exe`, `.bat`, `.sh`, `.js`, `.ps1`) and disallowed MIME types are blocked automatically.
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
              <strong>Immutable Digest:</strong> Every uploaded file receives a SHA-256 fingerprint before approval or digital signature workflows begin.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
