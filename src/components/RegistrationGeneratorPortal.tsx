import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Hash,
  Sparkles,
  Search,
  CheckCircle2,
  Copy,
  Printer,
  RefreshCw,
  Users,
  Award,
  BookOpen,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  QrCode,
  FileCheck,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  registrationService,
  VALID_RECORD_TYPES,
} from "../services/registrationService";
import { RegistrationRecordType, RegistrationIssuance } from "../types";
import BulkStudentCsvImport, {
  type BulkCommittedStudent,
} from "../modules/registration/BulkStudentCsvImport";

export default function RegistrationGeneratorPortal() {
  const [activeMode, setActiveMode] = useState<"single" | "bulk-csv">("single");
  const [selectedType, setSelectedType] = useState<RegistrationRecordType>("STAFF");
  const [year, setYear] = useState<number>(2026);
  const [institutionCode, setInstitutionCode] = useState<string>("HCA");
  const [recipientName, setRecipientName] = useState<string>("Dr. Amina Cherotich");
  const [identifierRef, setIdentifierRef] = useState<string>("ID-34901823");
  const [department, setDepartment] = useState<string>("School of Computing & Informatics");
  const [programmeOrRole, setProgrammeOrRole] = useState<string>("Senior Systems Analyst");
  const [campus, setCampus] = useState<string>("Nairobi Main Campus");

  // State trackers
  const [issuances, setIssuances] = useState<RegistrationIssuance[]>([]);
  const [sequenceSummary, setSequenceSummary] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<RegistrationIssuance | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [formError, setFormError] = useState<string | null>(null);

  // Verification tool state
  const [verifyInput, setVerifyInput] = useState<string>("HCA/STAFF/2026/001");
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Active preview
  const [nextPreview, setNextPreview] = useState<{ nextSequence: number; nextRegNo: string }>({
    nextSequence: 1,
    nextRegNo: "HCA/STAFF/2026/001",
  });

  const refreshData = () => {
    setIssuances(registrationService.getAllIssuances());
    setSequenceSummary(registrationService.getSequenceSummary(year, institutionCode));
    const preview = registrationService.peekNextSequence(selectedType, year, institutionCode);
    setNextPreview(preview);
  };

  useEffect(() => {
    refreshData();
  }, [selectedType, year, institutionCode]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setFormError("Please provide the recipient or holder name.");
      return;
    }
    setFormError(null);

    const newIssuance = registrationService.generateNextRegistrationNumber({
      recordType: selectedType,
      year,
      institutionCode,
      recipientName,
      identifierReference: identifierRef,
      department,
      programmeOrRole,
      campus,
      issuedBy: "Central Automated Issuance Engine",
    });

    setLastGenerated(newIssuance);
    refreshData();

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore in environments without canvas
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerify = () => {
    const parsed = registrationService.parseAndValidate(verifyInput);
    if (!parsed.isValid) {
      setVerifyResult({
        isValid: false,
        error: parsed.error,
      });
      return;
    }

    const lookup = registrationService.lookupIssuance(verifyInput);
    setVerifyResult({
      isValid: true,
      foundInLedger: !!lookup,
      record: lookup,
      parsed,
    });
  };

  // Filter issuances for list
  const filteredIssuances = issuances.filter((i) => {
    const matchesSearch =
      !searchFilter ||
      i.registrationNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      i.recipientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      i.identifierReference.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === "ALL" || i.recordType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#084c9e] to-[#0866d7] text-white p-6 sm:p-8 rounded-2xl shadow-md border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-10">
          <Hash size={240} />
        </div>

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-bold tracking-wide">
            <Sparkles size={14} />
            <span>CENTRAL REGISTRATION SERVICE · MODULE ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Central Automatic Registration Number Generator
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Standard Format: <code className="bg-black/30 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">HCA/&lt;TYPE&gt;/&lt;YEAR&gt;/&lt;SEQ&gt;</code> (e.g. <span className="text-white font-mono font-bold">HCA/STAFF/2026/001</span>).
            Enforces strict independent atomic sequences per type and academic year with verifiable anti-collision registry.
          </p>
        </div>
      </div>

      {/* MODE SWITCHER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveMode("single")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeMode === "single"
                ? "bg-[#102D50] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Hash size={15} />
            <span>Single Issuance &amp; Sequence Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("bulk-csv")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeMode === "bulk-csv"
                ? "bg-[#102D50] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Bulk Student CSV Import</span>
            <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-[#102D50]">
              Registrar Batch
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-500 px-2">
          Total Ledger Issuances: <strong className="text-[#102D50]">{issuances.length}</strong>
        </span>
      </div>

      {activeMode === "bulk-csv" ? (
        <BulkStudentCsvImport
          academicYear={year}
          onYearChange={setYear}
          onStudentsCommitted={(students: BulkCommittedStudent[]) => {
            registrationService.recordCommittedStudentIssuances(students);
            refreshData();
          }}
        />
      ) : (
        /* GENERATOR + LIVE STATUS GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GENERATOR CARD (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Hash className="text-blue-600" size={20} />
                Generate New Official Number
              </h2>
              <p className="text-xs text-slate-500">Atomic sequence allocation with instant ledger persistence</p>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded border border-blue-200">
              Institution: {institutionCode}
            </span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={14} /> {formError}
                </span>
                <button type="button" onClick={() => setFormError(null)} className="underline">
                  Dismiss
                </button>
              </div>
            )}
            {/* Record Type Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Record Type Category (<code className="text-blue-600 font-mono font-bold">&lt;TYPE&gt;</code>)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VALID_RECORD_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedType === t.type
                        ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <span className="font-mono font-bold text-xs">{t.type}</span>
                    <span className="text-[11px] text-slate-500 truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Year & Institution Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Year (<code className="text-blue-600 font-mono font-bold">&lt;YEAR&gt;</code>)
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2026}>2026 (Active Academic Year)</option>
                  <option value={2025}>2025 (Prior Year)</option>
                  <option value={2027}>2027 (Future Intake)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Code (<code className="text-blue-600 font-mono font-bold">HCA</code>)
                </label>
                <input
                  type="text"
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  readOnly
                />
              </div>
            </div>

            {/* Holder Name & National ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient / Holder Full Name *
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Amina Wanjiku"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National ID / KCSE Index / Birth Ref
                </label>
                <input
                  type="text"
                  value={identifierRef}
                  onChange={(e) => setIdentifierRef(e.target.value)}
                  placeholder="e.g. ID-38190241"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Department & Programme/Role */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option>School of Computing & Informatics</option>
                  <option>Cyber Security & Forensics</option>
                  <option>Artificial Intelligence & Data</option>
                  <option>Business & Technology Management</option>
                  <option>Office of the Academic Registrar</option>
                  <option>Finance & Accounts Directorate</option>
                  <option>Central Library Services</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role or Programme</label>
                <input
                  type="text"
                  value={programmeOrRole}
                  onChange={(e) => setProgrammeOrRole(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  placeholder="e.g. Senior Lecturer"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus</label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option>Nairobi Main Campus</option>
                  <option>Mombasa Campus</option>
                  <option>Kisumu Campus</option>
                  <option>Nakuru Campus</option>
                  <option>Thika Campus</option>
                </select>
              </div>
            </div>

            {/* NEXT NUMBER PREVIEW BOX */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#092c60] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <small className="text-amber-400 font-bold text-[10px] tracking-wider uppercase block">
                  NEXT ATOMIC SEQUENCE PREVIEW
                </small>
                <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-wider">
                  {nextPreview.nextRegNo}
                </div>
                <p className="text-[11px] text-blue-200">
                  Sequence: #{nextPreview.nextSequence} · Type: {selectedType} · Year: {year}
                </p>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 transform active:scale-95"
              >
                <Sparkles size={16} />
                Generate &amp; Issue Number
              </button>
            </div>
          </form>

          {/* Last Generated Banner */}
          {lastGenerated && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Successfully Issued Official Number
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">
                  {new Date(lastGenerated.issuedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-base font-mono font-black text-blue-900">
                    {lastGenerated.registrationNumber}
                  </span>
                  <div className="text-xs text-slate-700">
                    <strong>{lastGenerated.recipientName}</strong> · {lastGenerated.programmeOrRole} ({lastGenerated.campus})
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(lastGenerated.registrationNumber, lastGenerated.id)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedId === lastGenerated.id ? "Copied!" : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SEQUENCE COUNTER MATRIX & VERIFICATION (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SEQUENCE MATRIX */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-600" />
                Active Year {year} Sequence Ledger
              </h3>
              <span className="text-[10px] text-slate-500">Atomic Counters</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {sequenceSummary.map((s) => (
                <div
                  key={s.type}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    selectedType === s.type
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                      {s.type}
                    </span>
                    <div>
                      <strong className="text-slate-800 block text-[11px]">{s.label}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">Next: {s.nextRegistrationNumber}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-blue-900">
                      Seq #{s.currentSequence}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{s.totalIssued} Issued</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VERIFY REGISTRATION NUMBER TOOL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600" />
                Registration Number Authenticity Checker
              </h3>
              <p className="text-xs text-slate-500">Verify validity against format rules and central ledger</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value.trim().toUpperCase())}
                placeholder="e.g. HCA/STAFF/2026/001"
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleVerify}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5"
              >
                <Search size={14} /> Verify
              </button>
            </div>

            {verifyResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  verifyResult.isValid && verifyResult.foundInLedger
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : verifyResult.isValid
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                {verifyResult.isValid ? (
                  <>
                    <div className="flex items-center gap-2 font-bold">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <span>Valid Canonical Registration Format</span>
                    </div>
                    <div className="text-[11px] grid grid-cols-2 gap-1 font-mono pt-1 border-t border-slate-200">
                      <div>Prefix: <strong>{verifyResult.parsed.institutionCode}</strong></div>
                      <div>Type: <strong>{verifyResult.parsed.recordType}</strong></div>
                      <div>Year: <strong>{verifyResult.parsed.year}</strong></div>
                      <div>Sequence: <strong>#{verifyResult.parsed.sequenceNumber}</strong></div>
                    </div>
                    {verifyResult.foundInLedger ? (
                      <div className="pt-2 border-t border-emerald-200 text-[11px]">
                        <span className="font-bold text-emerald-800">Ledger Status: ACTIVE &amp; RECORDED</span>
                        <p className="text-slate-700 mt-0.5">
                          Issued to: <strong>{verifyResult.record.recipientName}</strong> ({verifyResult.record.programmeOrRole})
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-800 pt-1">
                        Format is valid, but this number has not yet been committed to the active database.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-start gap-2 text-red-700">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Invalid Registration Number</strong>
                      <span>{verifyResult.error}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ISSUED NUMBERS AUDIT REGISTER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              Central Registration Issuance Register
            </h3>
            <p className="text-xs text-slate-500">Immutable ledger of all generated institution numbers</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search number, name, ID..."
                className="text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg w-52"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">All Record Types</option>
              {VALID_RECORD_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.type} - {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Registration Number</th>
                <th className="p-4">Type</th>
                <th className="p-4">Recipient Name</th>
                <th className="p-4">Identifier Ref</th>
                <th className="p-4">Department &amp; Role</th>
                <th className="p-4">Campus</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredIssuances.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <span className="font-mono font-bold text-blue-900 text-sm bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200">
                      {item.registrationNumber}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-700">
                    {item.recordType}
                  </td>
                  <td className="p-4 font-bold text-slate-900">{item.recipientName}</td>
                  <td className="p-4 font-mono text-slate-500">{item.identifierReference}</td>
                  <td className="p-4">
                    <strong className="text-slate-800 block">{item.programmeOrRole}</strong>
                    <span className="text-[11px] text-slate-500">{item.department}</span>
                  </td>
                  <td className="p-4 text-slate-600">{item.campus}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 font-bold rounded text-[11px] bg-emerald-100 text-emerald-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleCopy(item.registrationNumber, item.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                    >
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => {
                        setVerifyInput(item.registrationNumber);
                        handleVerify();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
