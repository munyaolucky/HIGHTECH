import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  ShieldAlert,
  Sparkles,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface BulkCommittedStudent {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  programmeName: string;
  campusName: string;
  intakeName: string;
  status: string;
  issuedAt: string;
}

interface ValidationRow {
  rowNumber: number;
  valid: boolean;
  status: 'VALID' | 'WARNING' | 'ERROR';
  errors: string[];
  warnings: string[];
  previewRegistrationNumber: string | null;
  data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    nationalId: string;
    gender: string;
    campusId: string;
    campusName: string;
    departmentId: string;
    departmentName: string;
    programmeId: string;
    programmeName: string;
    intakeName: string;
    studyMode: string;
  };
}

interface ValidationResponseData {
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
    year: number;
  };
  rows: ValidationRow[];
  allowedCampuses: Array<{ id: string; code: string; name: string }>;
  allowedProgrammes: Array<{ id: string; code: string; title: string }>;
}

interface BulkCommitResponseData {
  importedCount: number;
  skippedCount: number;
  year: number;
  createdStudents: BulkCommittedStudent[];
  errors: Array<{ rowNumber: number; fullName: string; email: string; errors: string[] }>;
}

const CSV_TEMPLATE_TEXT = [
  'fullName,email,phoneNumber,nationalId,programme,campus,intake,gender,studyMode',
  'Mercy Chelangat Korir,mkorir2026@student.hitech.ac.ke,+254712340001,ID-39201411,DICT-L6,Nairobi Main Campus,September 2026 Intake,FEMALE,FULL_TIME',
  'Daniel Mwangi Njoroge,dnjoroge2026@student.hitech.ac.ke,+254723450002,ID-38492018,DSE-L6,Westlands Technology Park Campus,September 2026 Intake,MALE,FULL_TIME',
  'Fatuma Hassan Ali,fali2026@student.hitech.ac.ke,+254734560003,ID-40192837,CICT-L5,Mombasa Coastal Campus,September 2026 Intake,FEMALE,PART_TIME',
].join('\n');

export default function BulkStudentCsvImport({
  academicYear,
  onYearChange,
  onStudentsCommitted,
}: {
  academicYear: number;
  onYearChange: (year: number) => void;
  onStudentsCommitted?: (students: BulkCommittedStudent[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [csvText, setCsvText] = useState<string>(CSV_TEMPLATE_TEXT);
  const [fileName, setFileName] = useState<string>('sample-student-intake.csv');
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const [validationResult, setValidationResult] = useState<ValidationResponseData | null>(null);
  const [validatedSnapshot, setValidatedSnapshot] = useState<{ csv: string; year: number } | null>(
    null
  );
  const [rowFilter, setRowFilter] = useState<'ALL' | 'VALID' | 'ERROR'>('ALL');
  const [commitValidOnly, setCommitValidOnly] = useState(false);

  const [commitResult, setCommitResult] = useState<BulkCommitResponseData | null>(null);
  const [copiedReg, setCopiedReg] = useState<string | null>(null);

  const isStaleValidation =
    validationResult !== null &&
    (validatedSnapshot?.csv !== csvText || validatedSnapshot?.year !== academicYear);

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_TEXT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hitech-student-bulk-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadFreshSample = () => {
    const suffix = String(Date.now()).slice(-4);
    const sample = [
      'fullName,email,phoneNumber,nationalId,programme,campus,intake,gender,studyMode',
      `Mercy Chelangat Korir,mercy.korir.${suffix}@student.hitech.ac.ke,+25471234${suffix},ID-41${suffix}01,DICT-L6,Nairobi Main Campus,September ${academicYear} Intake,FEMALE,FULL_TIME`,
      `Daniel Mwangi Njoroge,daniel.njoroge.${suffix}@student.hitech.ac.ke,+25472345${suffix},ID-41${suffix}02,DSE-L6,Westlands Technology Park Campus,September ${academicYear} Intake,MALE,FULL_TIME`,
      `Fatuma Hassan Ali,fatuma.ali.${suffix}@student.hitech.ac.ke,+25473456${suffix},ID-41${suffix}03,CICT-L5,Mombasa Coastal Campus,September ${academicYear} Intake,FEMALE,PART_TIME`,
      `Kevin Ochieng Otieno,kevin.otieno.${suffix}@student.hitech.ac.ke,+25471988${suffix},ID-41${suffix}04,DBM-L6,Nairobi Main Campus,September ${academicYear} Intake,MALE,EVENING`,
    ].join('\n');
    setFileName(`student-intake-sample-${suffix}.csv`);
    setCsvText(sample);
    setValidationResult(null);
    setCommitResult(null);
    setErrorBanner(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
      setErrorBanner('Please select a valid .csv spreadsheet file.');
      return;
    }
    const text = await file.text();
    setFileName(file.name);
    setCsvText(text);
    setValidationResult(null);
    setCommitResult(null);
    setErrorBanner(null);
    setAuthRequired(false);
  };

  const handleValidate = async () => {
    setErrorBanner(null);
    setCommitResult(null);
    setAuthRequired(false);
    setValidating(true);

    try {
      const res = await fetch('/api/sis/students/bulk-validate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, year: academicYear }),
      });

      const json = await res.json();
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setErrorBanner(
          json.error ||
            'Registrar, Admissions Officer, Principal, or Administrator session required to validate against Cloud SQL.'
        );
        return;
      }

      if (!res.ok || !json.success) {
        setErrorBanner(json.error || 'Failed to validate CSV batch.');
        setValidationResult(null);
        return;
      }

      setValidationResult(json.data as ValidationResponseData);
      setValidatedSnapshot({ csv: csvText, year: academicYear });
      setRowFilter('ALL');
      setCommitValidOnly(false);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Network error validating CSV.');
    } finally {
      setValidating(false);
    }
  };

  const handleCommit = async () => {
    if (!validationResult || isStaleValidation) return;
    setErrorBanner(null);
    setAuthRequired(false);
    setCommitting(true);

    try {
      const res = await fetch('/api/sis/students/bulk-import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText,
          year: academicYear,
          commitValidOnly,
        }),
      });

      const json = await res.json();
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setErrorBanner(
          json.error ||
            'Registrar, Admissions Officer, Principal, or Administrator authorization is required to commit students.'
        );
        return;
      }

      if (!res.ok || !json.success) {
        setErrorBanner(json.error || 'Failed to commit student records to database.');
        return;
      }

      const data = json.data as BulkCommitResponseData;
      setCommitResult(data);
      onStudentsCommitted?.(data.createdStudents);

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore in headless environments
      }
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Network error committing students.');
    } finally {
      setCommitting(false);
    }
  };

  const handleExportCommittedCsv = () => {
    if (!commitResult || commitResult.createdStudents.length === 0) return;
    const header = 'RegistrationNumber,FullName,Email,Programme,Campus,Intake,Status,IssuedAt';
    const lines = commitResult.createdStudents.map((s) =>
      [
        s.registrationNumber,
        `"${s.fullName.replaceAll('"', '""')}"`,
        s.email,
        `"${s.programmeName.replaceAll('"', '""')}"`,
        `"${s.campusName.replaceAll('"', '""')}"`,
        `"${s.intakeName.replaceAll('"', '""')}"`,
        s.status,
        s.issuedAt,
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hitech-bulk-imported-students-${commitResult.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (regNo: string) => {
    navigator.clipboard.writeText(regNo);
    setCopiedReg(regNo);
    setTimeout(() => setCopiedReg(null), 1800);
  };

  const filteredRows = (validationResult?.rows ?? []).filter((r) => {
    if (rowFilter === 'VALID') return r.valid;
    if (rowFilter === 'ERROR') return !r.valid;
    return true;
  });

  const canCommit =
    Boolean(validationResult) &&
    !isStaleValidation &&
    (validationResult?.summary.validCount ?? 0) > 0 &&
    ((validationResult?.summary.errorCount ?? 0) === 0 || commitValidOnly);

  return (
    <div className="space-y-6">
      {/* UPLOAD & TEMPLATE CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#102D50] flex items-center gap-2">
              <FileSpreadsheet className="text-[#1769AA]" size={20} />
              <span>Bulk Student CSV Import &amp; Pre-Commit Validation</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload multiple student admissions at once, verify against Cloud SQL duplicates and
              programme/campus rules, preview atomic <span className="font-mono font-bold">HCA/STU/{academicYear}/XXXX</span> numbers, then commit transactionally.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Registration Academic Year"
              value={academicYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#102D50]"
            >
              <option value={2026}>2026 Intake Year</option>
              <option value={2025}>2025 Prior Year</option>
              <option value={2027}>2027 Future Year</option>
            </select>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-[#102D50] transition"
            >
              <Download size={14} />
              <span>Download Template</span>
            </button>

            <button
              type="button"
              onClick={handleLoadFreshSample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 text-xs font-bold text-[#1769AA] transition"
            >
              <Sparkles size={14} />
              <span>Load Fresh Sample</span>
            </button>
          </div>
        </div>

        {errorBanner && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-[#B83232] shrink-0 mt-0.5" />
                <span>{errorBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="underline font-semibold shrink-0"
              >
                Dismiss
              </button>
            </div>
            {authRequired && (
              <div className="text-[11px] text-rose-800 pl-6">
                Open this generator from the <strong>Staff Portal (Registrar or Admin role)</strong>{' '}
                or sign in via <a href="/portal/login" className="underline font-bold">/portal/login</a>{' '}
                to validate and commit student records to PostgreSQL.
              </div>
            )}
          </div>
        )}

        {/* DROPZONE + RAW CSV EDITOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1769AA] bg-[#F4F7FB] hover:bg-blue-50/40 p-6 text-center transition flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#1769AA] shadow-xs">
                <Upload size={18} />
              </div>
              <div className="text-xs font-extrabold text-[#102D50]">
                Choose CSV File to Upload
              </div>
              <p className="text-[11px] text-slate-500">
                Active file: <span className="font-mono font-semibold text-slate-700">{fileName}</span>
              </p>
              <span className="text-[10px] text-slate-400">
                Max 500 student rows per batch · UTF-8 CSV
              </span>
            </button>

            <div className="rounded-xl border border-slate-200 bg-[#F5EBDD]/50 p-3.5 text-[11px] text-[#102D50] space-y-1.5">
              <div className="font-black uppercase tracking-wide text-[10px] text-[#102D50]">
                Accepted CSV Columns
              </div>
              <p className="leading-relaxed text-slate-700">
                Required: <code className="font-mono font-bold">fullName</code>,{' '}
                <code className="font-mono font-bold">email</code>
                <br />
                Optional: <code className="font-mono">phoneNumber</code>,{' '}
                <code className="font-mono">nationalId</code>,{' '}
                <code className="font-mono">programme</code>,{' '}
                <code className="font-mono">campus</code>,{' '}
                <code className="font-mono">intake</code>,{' '}
                <code className="font-mono">gender</code>,{' '}
                <code className="font-mono">studyMode</code>
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="bulk-student-csv-editor"
                className="text-xs font-bold text-[#102D50]"
              >
                CSV Data Preview &amp; Inline Correction Editor
              </label>
              <span className="text-[11px] text-slate-500">
                {Math.max(0, csvText.trim().split(/\r?\n/).filter(Boolean).length - 1)} data row(s) detected
              </span>
            </div>

            <textarea
              id="bulk-student-csv-editor"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white p-3 font-mono text-[11px] text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#1769AA] outline-none"
              placeholder="Paste CSV rows here or upload a .csv file..."
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {isStaleValidation ? (
                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  CSV or year modified — re-validate before committing to PostgreSQL.
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Step 1: Validate against Cloud SQL → Step 2: Review feedback → Step 3: Commit batch
                </span>
              )}

              <button
                type="button"
                disabled={validating || !csvText.trim()}
                onClick={handleValidate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-5 py-2.5 text-xs font-extrabold shadow-sm transition disabled:opacity-50"
              >
                {validating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>{validating ? 'Validating Batch...' : 'Validate CSV Batch'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRE-COMMIT VALIDATION FEEDBACK TABLE */}
      {validationResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#102D50] flex items-center gap-2">
                <Database size={18} className="text-[#1769AA]" />
                <span>Pre-Commit Validation Report ({validationResult.summary.year})</span>
              </h3>
              <p className="text-xs text-slate-500">
                No database writes have occurred yet. Review row validation status and assigned{' '}
                <span className="font-mono font-bold">HCA/STU</span> previews below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <Filter size={14} className="text-slate-400" />
              {(['ALL', 'VALID', 'ERROR'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRowFilter(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    rowFilter === tab
                      ? 'bg-[#102D50] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL'
                    ? `All (${validationResult.summary.totalRows})`
                    : tab === 'VALID'
                    ? `Valid (${validationResult.summary.validCount})`
                    : `Errors (${validationResult.summary.errorCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Summary Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-[#F4F7FB] p-3.5">
              <div className="text-[11px] font-bold uppercase text-slate-500">Total Parsed Rows</div>
              <div className="text-2xl font-black text-[#102D50] mt-1">
                {validationResult.summary.totalRows}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="text-[11px] font-bold uppercase text-emerald-700">Ready to Commit</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {validationResult.summary.validCount}
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <div className="text-[11px] font-bold uppercase text-amber-700">Auto-Default Warnings</div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {validationResult.summary.warningCount}
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
              <div className="text-[11px] font-bold uppercase text-rose-700">Errors / Duplicates</div>
              <div className="text-2xl font-black text-[#B83232] mt-1">
                {validationResult.summary.errorCount}
              </div>
            </div>
          </div>

          {/* Row-by-row Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Row</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Preview Reg No</th>
                  <th className="p-3">Student &amp; Email</th>
                  <th className="p-3">Programme &amp; Campus</th>
                  <th className="p-3">Validation Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={
                      row.status === 'ERROR'
                        ? 'bg-rose-50/50'
                        : row.status === 'WARNING'
                        ? 'bg-amber-50/30'
                        : 'hover:bg-slate-50/70'
                    }
                  >
                    <td className="p-3 font-mono font-bold text-slate-500">#{row.rowNumber}</td>
                    <td className="p-3">
                      {row.status === 'VALID' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          <CheckCircle2 size={12} /> VALID
                        </span>
                      ) : row.status === 'WARNING' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                          <AlertTriangle size={12} /> WARNING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-black text-[#B83232]">
                          <XCircle size={12} /> ERROR
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {row.previewRegistrationNumber ? (
                        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[#102D50]">
                          {row.previewRegistrationNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{row.data.fullName || '—'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {row.data.email || 'Missing email'}
                      </div>
                      {row.data.nationalId && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {row.data.nationalId}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{row.data.programmeName}</div>
                      <div className="text-[11px] text-slate-500">
                        {row.data.campusName} · {row.data.intakeName}
                      </div>
                    </td>
                    <td className="p-3 space-y-1 max-w-xs">
                      {row.errors.length === 0 && row.warnings.length === 0 && (
                        <span className="text-emerald-700 font-semibold">
                          Passed all uniqueness and programme checks.
                        </span>
                      )}
                      {row.errors.map((err, idx) => (
                        <div key={idx} className="text-[#B83232] font-semibold leading-snug">
                          • {err}
                        </div>
                      ))}
                      {row.warnings.map((warn, idx) => (
                        <div key={idx} className="text-amber-700 leading-snug">
                          • {warn}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Commit Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#F4F7FB] p-4">
            <div className="space-y-1 text-xs">
              {validationResult.summary.errorCount > 0 && validationResult.summary.validCount > 0 ? (
                <label className="inline-flex items-center gap-2 font-bold text-[#102D50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commitValidOnly}
                    onChange={(e) => setCommitValidOnly(e.target.checked)}
                    className="accent-[#1769AA]"
                  />
                  <span>
                    Skip {validationResult.summary.errorCount} invalid row(s) and commit only the{' '}
                    {validationResult.summary.validCount} valid student record(s)
                  </span>
                </label>
              ) : validationResult.summary.validCount === 0 ? (
                <span className="font-bold text-[#B83232]">
                  Fix validation errors in the CSV editor above and re-validate before committing.
                </span>
              ) : (
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  All {validationResult.summary.validCount} student record(s) passed Cloud SQL
                  validation and are ready to commit.
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={!canCommit || committing}
              onClick={handleCommit}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 text-xs font-black shadow-sm transition disabled:opacity-45"
            >
              {committing ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
              <span>
                {committing
                  ? 'Committing to Cloud SQL...'
                  : `Commit ${validationResult.summary.validCount} Student(s) to Database`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* POST-COMMIT CONFIRMATION LEDGER */}
      {commitResult && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-700" />
                <span>
                  Successfully Committed {commitResult.importedCount} Student Record(s) to Cloud SQL
                </span>
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Portal logins, student master profiles, status history, and atomic{' '}
                <span className="font-mono font-bold">HCA/STU</span> numbers were persisted
                transactionally ({commitResult.skippedCount} skipped).
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCommittedCsv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 px-4 py-2 text-xs font-extrabold text-emerald-900 transition"
            >
              <Download size={14} />
              <span>Export Issued Numbers CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {commitResult.createdStudents.map((stu) => (
              <div
                key={stu.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-mono font-black text-[#102D50] text-sm">
                    {stu.registrationNumber}
                  </div>
                  <div className="font-bold text-slate-900 truncate">{stu.fullName}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {stu.email} · {stu.programmeName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(stu.registrationNumber)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 text-[11px] font-bold text-[#1769AA] shrink-0"
                >
                  <Copy size={12} />
                  <span>{copiedReg === stu.registrationNumber ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
