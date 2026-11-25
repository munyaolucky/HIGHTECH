import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Coins,
  FileCheck2,
  GraduationCap,
  Layers,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';

export type AdminCertTab =
  | 'overview'
  | 'candidates'
  | 'academic'
  | 'credits'
  | 'progression'
  | 'question-bank'
  | 'results-certificates';

interface AdminCertificationWorkspaceProps {
  initialTab?: AdminCertTab;
  userRole: string;
  userName: string;
  onBack?: () => void;
}

const QUESTION_TYPES = [
  'SINGLE_CHOICE_MCQ',
  'MULTIPLE_RESPONSE_MCQ',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
  'FILL_IN_BLANKS',
  'MATCHING',
  'ORDERING',
  'NUMERICAL',
  'PRACTICAL_TASK',
  'PROGRAMMING_CODE',
  'PRONUNCIATION_AUDIO',
  'SPELLING_LANGUAGE',
] as const;

const EXAM_BODIES = [
  'ICDL',
  'TVET_CDACC',
  'KNEC',
  'KASNEB',
  'NITA',
  'HI_TECH_INTERNAL',
] as const;

const PROGRESSION_STAGES = [
  'REGISTERED',
  'MODULES_ASSIGNED',
  'LEARNING',
  'ASSESSMENT',
  'PASSED',
  'CERTIFICATION_ELIGIBLE',
  'CERTIFIED',
] as const;

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response.' }));
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export default function AdminCertificationWorkspace({
  initialTab = 'overview',
  userRole,
  userName,
  onBack,
}: AdminCertificationWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminCertTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidateReg, setSelectedCandidateReg] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>(null);
  const [creditData, setCreditData] = useState<any>(null);
  const [progressions, setProgressions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [markings, setMarkings] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [qbBodyFilter, setQbBodyFilter] = useState('ALL');
  const [qbStatusFilter, setQbStatusFilter] = useState('ALL');

  // Forms
  const [bulkImportText, setBulkImportText] = useState(
    'HCA/STU/2026/088, Dennis Mutua, prog-icdl-001, cls-icdl-2026-a, 10\nHCA/STU/2026/089, Esther Chebet, prog-icdl-001, cls-icdl-2026-a, 8'
  );
  const [showImportBox, setShowImportBox] = useState(false);

  const [newProg, setNewProg] = useState({
    code: '',
    name: '',
    departmentId: 'cdept-ict',
    examBody: 'ICDL',
    requiredModulesCount: 4,
  });
  const [newClass, setNewClass] = useState({
    code: '',
    name: '',
    programmeId: 'prog-icdl-001',
    campusName: 'Nairobi Main Campus',
    studyMode: 'FULL_TIME',
    capacity: 40,
  });
  const [assignForm, setAssignForm] = useState({
    targetType: 'STUDENT' as 'STUDENT' | 'CLASS',
    studentRegNo: 'HCA/STU/2026/001',
    classId: 'cls-icdl-2026-a',
    moduleId: 'mod-icdl-m04',
  });

  const [creditActionForm, setCreditActionForm] = useState({
    studentRegNo: 'HCA/STU/2026/014',
    credits: 5,
    reason: 'Term 3 examination credit top-up',
  });

  const [newQForm, setNewQForm] = useState({
    examBody: 'ICDL',
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    topic: 'Formulas & Functions',
    questionType: 'SINGLE_CHOICE_MCQ',
    difficulty: 'MEDIUM',
    marks: 5,
    prompt: '',
    optionsRaw: 'Option A | Option B | Option C | Option D',
    correctAnswerKey: 'Option A',
  });

  const [aiDraftForm, setAiDraftForm] = useState({
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    topic: 'Spreadsheet Auditing & Pivot Charts',
    count: 2,
    difficulty: 'MEDIUM',
  });

  const [paperForm, setPaperForm] = useState({
    title: 'ICDL Spreadsheets Mock Paper',
    examBody: 'ICDL',
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    durationMinutes: 45,
    totalMarks: 10,
    passMark: 7,
    creditCost: 1,
    questionIds: ['qb-icdl-01', 'qb-icdl-02'] as string[],
  });

  const [verifyInput, setVerifyInput] = useState('HCA-CERT-2026-0001');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        ana,
        cand,
        cat,
        cred,
        prog,
        qb,
        pprs,
        mrk,
        certs,
      ] = await Promise.all([
        apiJson<any>('/api/admin/analytics'),
        apiJson<any[]>('/api/admin/candidates').catch(() => []),
        apiJson<any>('/api/academic/catalog'),
        apiJson<any>('/api/exam-credits/overview'),
        apiJson<any[]>('/api/admin/progressions'),
        apiJson<any[]>('/api/exam-admin/questions'),
        apiJson<any[]>('/api/exam-admin/papers'),
        apiJson<any[]>('/api/exam-admin/marking'),
        apiJson<any[]>('/api/exam-admin/certificates'),
      ]);
      setAnalytics(ana);
      setCandidates(cand);
      setCatalog(cat);
      setCreditData(cred);
      setProgressions(prog);
      setQuestions(qb);
      setPapers(pprs);
      setMarkings(mrk);
      setCertificates(certs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certification workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const loadCandidateDetail = async (regNo: string) => {
    setSelectedCandidateReg(regNo);
    try {
      const detail = await apiJson<any>(`/api/admin/candidates/${encodeURIComponent(regNo)}`);
      setCandidateDetail(detail);
    } catch (err) {
      setBanner({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to load candidate detail.',
      });
    }
  };

  const notifyOk = (text: string) => setBanner({ type: 'ok', text });
  const notifyErr = (err: unknown) =>
    setBanner({ type: 'err', text: err instanceof Error ? err.message : 'Operation failed.' });

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lines = bulkImportText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const parsed = lines.map((line) => {
        const [studentRegNo, fullName, programmeId, classId, initialCredits] = line
          .split(',')
          .map((s) => s.trim());
        return {
          studentRegNo,
          fullName,
          programmeId: programmeId || 'prog-icdl-001',
          classId: classId || 'cls-icdl-2026-a',
          initialCredits: Number(initialCredits || 0),
        };
      });
      const res = await apiJson<{ importedCount: number }>('/api/admin/candidates/import', {
        method: 'POST',
        body: JSON.stringify({ candidates: parsed }),
      });
      notifyOk(`Imported ${res.importedCount} candidate(s) with programme modules and credit wallets.`);
      setShowImportBox(false);
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleAllocateCredits = async (mode: 'allocate' | 'refund' | 'adjust') => {
    try {
      if (mode === 'allocate') {
        await apiJson('/api/exam-credits/allocate', {
          method: 'POST',
          body: JSON.stringify(creditActionForm),
        });
        notifyOk(`Allocated +${creditActionForm.credits} credit(s) to ${creditActionForm.studentRegNo}.`);
      } else if (mode === 'refund') {
        await apiJson('/api/exam-credits/refund', {
          method: 'POST',
          body: JSON.stringify(creditActionForm),
        });
        notifyOk(`Refunded +${creditActionForm.credits} credit(s) to ${creditActionForm.studentRegNo}.`);
      } else {
        await apiJson('/api/exam-credits/adjustments', {
          method: 'POST',
          body: JSON.stringify({
            studentRegNo: creditActionForm.studentRegNo,
            creditsDelta: creditActionForm.credits,
            reason: creditActionForm.reason,
          }),
        });
        notifyOk(`Submitted credit adjustment for maker-checker approval.`);
      }
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleApproveAdjustment = async (txId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await apiJson(`/api/exam-credits/adjustments/${txId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      notifyOk(`Credit adjustment marked ${decision}.`);
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const options =
        newQForm.questionType === 'SINGLE_CHOICE_MCQ' ||
        newQForm.questionType === 'MULTIPLE_RESPONSE_MCQ'
          ? newQForm.optionsRaw.split('|').map((s) => s.trim()).filter(Boolean)
          : newQForm.questionType === 'TRUE_FALSE'
          ? ['True', 'False']
          : undefined;
      await apiJson('/api/exam-admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          ...newQForm,
          options,
        }),
      });
      setNewQForm((p) => ({ ...p, prompt: '' }));
      notifyOk('Created new question bank item in DRAFT status.');
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleGenerateAiDraft = async () => {
    try {
      const res = await apiJson<{ createdCount: number }>('/api/exam-admin/questions/ai-draft', {
        method: 'POST',
        body: JSON.stringify(aiDraftForm),
      });
      notifyOk(
        `Generated ${res.createdCount} AI-assisted DRAFT question(s). Review and approve before exam use.`
      );
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleReviewQuestion = async (id: string, status: 'UNDER_REVIEW' | 'APPROVED' | 'DRAFT') => {
    try {
      await apiJson(`/api/exam-admin/questions/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      notifyOk(`Question status updated to ${status}.`);
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleNewRevisionFromApproved = async (q: any) => {
    try {
      await apiJson(`/api/exam-admin/questions/${q.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          prompt: `${q.prompt} (Updated Revision)`,
          changeNote: `Created v${q.version + 1} revision by ${userName}`,
        }),
      });
      notifyOk(`Created immutable v${q.version + 1} draft revision from approved question ${q.code}.`);
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleBuildPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiJson('/api/exam-admin/papers', {
        method: 'POST',
        body: JSON.stringify(paperForm),
      });
      notifyOk('Created exam paper blueprint. Ready for publication.');
      await loadAll();
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleVerifyCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiJson<any>(
        `/api/public/verify-certificate/${encodeURIComponent(verifyInput.trim())}`
      );
      setVerifyResult(data);
    } catch (err) {
      setVerifyResult(null);
      notifyErr(err);
    }
  };

  const tabs: { id: AdminCertTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview', label: 'Analytics Overview', icon: ShieldCheck },
    { id: 'candidates', label: 'Candidates & SIS', icon: Users },
    { id: 'academic', label: 'Classes, Modules & Programmes', icon: Layers },
    { id: 'credits', label: 'Exam Credit Wallet & Ledger', icon: Coins },
    { id: 'progression', label: 'Student Progression', icon: GraduationCap },
    { id: 'question-bank', label: 'Question Bank & Papers', icon: BookOpen },
    { id: 'results-certificates', label: 'Marking & QR Certificates', icon: Award },
  ];

  const filteredQuestions = questions.filter((q) => {
    if (qbBodyFilter !== 'ALL' && q.examBody !== qbBodyFilter) return false;
    if (qbStatusFilter !== 'ALL' && q.status !== qbStatusFilter) return false;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      return (
        q.code.toLowerCase().includes(term) ||
        q.moduleCode.toLowerCase().includes(term) ||
        q.prompt.toLowerCase().includes(term) ||
        q.topic.toLowerCase().includes(term)
      );
    }
    return true;
  });

  if (loading && !analytics) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading Administrator Certification Platform...
        </p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 space-y-3">
        <h2 className="text-base font-bold text-red-900 dark:text-red-300">
          Unable to load Administrator Certification Portal
        </h2>
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1769AA] dark:text-blue-400">
              01 · Administrator Portal · Digital Certification &amp; Examination Operations
            </p>
            <h1 className="text-2xl font-bold text-[#102D50] dark:text-white tracking-tight">
              HI-TECH College Certification, Credits &amp; Question Governance
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Unified management of ICDL, TVET CDACC, KNEC, KASNEB &amp; NITA cohorts, immutable
              examination credit wallets, progression gates, versioned question banks, and QR certificates.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void loadAll()}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw size={14} /> Refresh Data
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-2 rounded-xl bg-[#102D50] text-white text-xs font-semibold hover:bg-[#173f6e] whitespace-nowrap shrink-0"
              >
                Role Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Navigation Strip */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#102D50] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium flex items-center justify-between gap-4 ${
            banner.type === 'ok'
              ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================================
          TAB 1: ANALYTICS OVERVIEW
          ==================================================================== */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Candidates', value: analytics.totalCandidates, sub: `${analytics.activeClasses} active cohorts` },
              { label: 'Certification Programmes', value: analytics.activeProgrammes, sub: `${analytics.totalModules} modules` },
              { label: 'Active Exam Sessions', value: analytics.activeExamSessions, sub: 'Scheduled or in progress' },
              { label: 'Certificates Awarded', value: analytics.certificatesAwarded, sub: 'QR verifiable records' },
              { label: 'Available Exam Credits', value: analytics.creditSummary.totalAvailableCredits, sub: `${analytics.creditSummary.totalReservedCredits} reserved · ${analytics.creditSummary.totalConsumedCredits} used` },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="mt-2 text-2xl font-bold text-[#102D50] dark:text-white font-mono tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Credit Alerts & Pending Governance */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  Governance Queues &amp; Low-Credit Threshold Alerts
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('credits')}
                  className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Open Credit Ledger
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
                  <span className="text-amber-800 dark:text-amber-300 block">Low-Credit Wallets</span>
                  <strong className="text-lg font-mono tabular-nums text-amber-900 dark:text-amber-200">
                    {analytics.creditSummary.lowCreditAlertCount}
                  </strong>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
                  <span className="text-blue-800 dark:text-blue-300 block">Pending Credit Approvals</span>
                  <strong className="text-lg font-mono tabular-nums text-blue-900 dark:text-blue-200">
                    {analytics.creditSummary.pendingApprovalCount}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <span className="text-slate-600 dark:text-slate-300 block">AI Drafts Pending Human</span>
                  <strong className="text-lg font-mono tabular-nums text-slate-900 dark:text-white">
                    {analytics.pendingAiReviewCount}
                  </strong>
                </div>
              </div>
              <div className="space-y-2">
                {(creditData?.alerts || []).map((al: any) => (
                  <div
                    key={al.walletId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {al.studentName}
                      </span>{' '}
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        ({al.studentRegNo})
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">{al.message}</p>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-amber-700 dark:text-amber-300 shrink-0">
                      {al.availableCredits} cr
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Certification &amp; Ledger Audit Trail
              </h2>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(analytics.recentAuditLogs || []).map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                        {log.domain} · {log.action}
                      </span>
                      <span className="font-mono text-slate-400">
                        {String(log.createdAt).slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">{log.detail}</p>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                      Actor: {log.actorName} ({log.actorRole})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: CANDIDATES & 8-SECTION CANDIDATE DETAIL
          ==================================================================== */}
      {activeTab === 'candidates' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reg no, name, programme..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowImportBox((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-[#102D50] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Upload size={14} /> Bulk CSV / Cohort Import
            </button>
          </div>

          {showImportBox && (
            <form
              onSubmit={handleBulkImport}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Bulk Candidate Import (CSV: RegNo, FullName, ProgrammeId, ClassId, InitialCredits)
              </h3>
              <textarea
                rows={4}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-mono text-slate-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportBox(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1769AA] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Import &amp; Provision Wallets
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Candidate</th>
                      <th className="py-3 px-4 font-semibold">Programme &amp; Class</th>
                      <th className="py-3 px-4 font-semibold text-right">Credits</th>
                      <th className="py-3 px-4 font-semibold">Progression</th>
                      <th className="py-3 px-4 font-semibold text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {candidates
                      .filter(
                        (c) =>
                          !searchQuery.trim() ||
                          c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.programmeName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((c) => (
                        <tr
                          key={c.studentRegNo}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                            selectedCandidateReg === c.studentRegNo ? 'bg-blue-50/60 dark:bg-slate-800/60' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{c.fullName}</div>
                            <div className="font-mono text-slate-500 dark:text-slate-400">{c.studentRegNo}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{c.programmeName}</div>
                            <div className="text-slate-500 dark:text-slate-400">{c.className} · {c.examBody}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {c.availableCredits}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#1769AA] dark:text-blue-400">
                              {c.progressionStage}
                            </div>
                            <div className="font-mono tabular-nums text-slate-500">
                              {c.progressPercent}% ({c.assignedModulesCount} mods)
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => void loadCandidateDetail(c.studentRegNo)}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                            >
                              8-Section View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 8-Section Candidate Detail Panel */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              {!candidateDetail ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  Select a candidate to inspect their 8-section record: profile, programme, assigned
                  modules, learning progress, credit wallet &amp; ledger, scheduled exams, results, and certificates.
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                      {candidateDetail.profile.fullName}
                    </h3>
                    <p className="font-mono text-slate-500 dark:text-slate-400">
                      {candidateDetail.profile.studentRegNo} · {candidateDetail.profile.campusName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
                      <span className="text-slate-500 block">1–2. Programme &amp; Class</span>
                      <strong className="text-slate-900 dark:text-white">
                        {candidateDetail.profile.programmeName}
                      </strong>
                      <span className="block text-slate-600 dark:text-slate-300">
                        {candidateDetail.profile.className}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
                      <span className="text-slate-500 block">4. Progression Stage</span>
                      <strong className="text-[#1769AA] dark:text-blue-400">
                        {candidateDetail.progression?.stage}
                      </strong>
                      <span className="block font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {candidateDetail.progression?.progressPercent ?? 0}% complete
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      3. Assigned Modules ({candidateDetail.assignedModules.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {candidateDetail.assignedModules.map((m: any) => (
                        <div key={m.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span>{m.moduleCode} — {m.moduleTitle}</span>
                          <span className="font-mono tabular-nums font-semibold">
                            {m.status} ({m.progressPercent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                      5. Credit Wallet &amp; Ledger ({candidateDetail.wallet?.availableCredits ?? 0} available)
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                      Reserved: {candidateDetail.wallet?.reservedCredits ?? 0} · Consumed:{' '}
                      {candidateDetail.wallet?.consumedCredits ?? 0} · Transactions:{' '}
                      {candidateDetail.transactions.length}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                      6–8. Exams ({candidateDetail.examSessions.length}), Results ({candidateDetail.results.length}) &amp; Certificates ({candidateDetail.certificates.length})
                    </h4>
                    {candidateDetail.certificates.map((cert: any) => (
                      <div key={cert.id} className="font-mono text-emerald-700 dark:text-emerald-300">
                        {cert.serialNumber} · {cert.qualificationTitle} ({cert.verificationCode})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: ACADEMIC STRUCTURE (CLASSES, MODULES & PROGRAMMES)
          ==================================================================== */}
      {activeTab === 'academic' && catalog && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Certification Programmes ({catalog.programmes.length}) &amp; Create Programme
            </h2>
            <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
              {catalog.programmes.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex justify-between">
                  <div>
                    <strong className="text-slate-900 dark:text-white">{p.name}</strong>
                    <p className="text-slate-500">{p.code} · {p.examBody} · {p.departmentName}</p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-[#1769AA] dark:text-blue-400">
                    {p.requiredModulesCount} req mods
                  </span>
                </div>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiJson('/api/academic/programmes', {
                    method: 'POST',
                    body: JSON.stringify(newProg),
                  });
                  setNewProg((p) => ({ ...p, code: '', name: '' }));
                  notifyOk('Created certification programme.');
                  await loadAll();
                } catch (err) {
                  notifyErr(err);
                }
              }}
              className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs"
            >
              <input
                required
                placeholder="Code e.g. DATA-201"
                value={newProg.code}
                onChange={(e) => setNewProg({ ...newProg, code: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                required
                placeholder="Programme Name"
                value={newProg.name}
                onChange={(e) => setNewProg({ ...newProg, name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <select
                value={newProg.examBody}
                onChange={(e) => setNewProg({ ...newProg, examBody: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {EXAM_BODIES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-[#102D50] text-white font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Add Programme
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Class Cohorts ({catalog.classes.length}) &amp; Module Assignment
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {catalog.classes.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex justify-between">
                  <div>
                    <strong className="text-slate-900 dark:text-white">{c.name}</strong>
                    <p className="text-slate-500">{c.programmeName} · {c.campusName} · {c.studyMode}</p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold">
                    {c.enrolledStudentRegNos.length}/{c.capacity}
                  </span>
                </div>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiJson('/api/academic/classes', {
                    method: 'POST',
                    body: JSON.stringify(newClass),
                  });
                  setNewClass((p) => ({ ...p, code: '', name: '' }));
                  notifyOk('Created class cohort.');
                  await loadAll();
                } catch (err) {
                  notifyErr(err);
                }
              }}
              className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800"
            >
              <input
                required
                placeholder="Class Code (e.g. ICDL-DEC-26)"
                value={newClass.code}
                onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                required
                placeholder="Class Name"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <select
                value={newClass.programmeId}
                onChange={(e) => setNewClass({ ...newClass, programmeId: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {catalog.programmes.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button type="submit" className="px-3 py-2 rounded-lg bg-[#1769AA] text-white font-semibold">
                Create Class
              </button>
            </form>

            {/* Assign module to candidate or cohort */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiJson<any>('/api/academic/module-assignments', {
                    method: 'POST',
                    body: JSON.stringify({
                      targetType: assignForm.targetType,
                      studentRegNo: assignForm.studentRegNo,
                      classId: assignForm.classId,
                      moduleIds: [assignForm.moduleId],
                    }),
                  });
                  notifyOk(`Assigned module (${res.assignedRowsCreated} new record(s) created).`);
                  await loadAll();
                } catch (err) {
                  notifyErr(err);
                }
              }}
              className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800"
            >
              <select
                value={assignForm.targetType}
                onChange={(e) => setAssignForm({ ...assignForm, targetType: e.target.value as 'STUDENT' | 'CLASS' })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="STUDENT">Assign to Candidate</option>
                <option value="CLASS">Assign to Whole Class</option>
              </select>
              {assignForm.targetType === 'STUDENT' ? (
                <input
                  value={assignForm.studentRegNo}
                  onChange={(e) => setAssignForm({ ...assignForm, studentRegNo: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              ) : (
                <select
                  value={assignForm.classId}
                  onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {catalog.classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <select
                value={assignForm.moduleId}
                onChange={(e) => setAssignForm({ ...assignForm, moduleId: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {catalog.modules.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.code} — {m.title} ({m.requirementKind})</option>
                ))}
              </select>
              <button type="submit" className="px-3 py-2 rounded-lg bg-[#102D50] text-white font-semibold">
                Assign Module
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: EXAMINATION CREDIT WALLET & IMMUTABLE LEDGER
          ==================================================================== */}
      {activeTab === 'credits' && creditData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Credit Controls */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Allocate, Refund or Request Adjustment
              </h2>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Candidate Reg No</label>
                <input
                  value={creditActionForm.studentRegNo}
                  onChange={(e) => setCreditActionForm({ ...creditActionForm, studentRegNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Credits</label>
                <input
                  type="number"
                  min={1}
                  value={creditActionForm.credits}
                  onChange={(e) => setCreditActionForm({ ...creditActionForm, credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Audit Reason</label>
                <input
                  value={creditActionForm.reason}
                  onChange={(e) => setCreditActionForm({ ...creditActionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleAllocateCredits('allocate')}
                  className="px-3 py-2 rounded-lg bg-[#102D50] text-white font-semibold whitespace-nowrap shrink-0"
                >
                  Allocate Credits
                </button>
                <button
                  type="button"
                  onClick={() => void handleAllocateCredits('refund')}
                  className="px-3 py-2 rounded-lg bg-emerald-700 text-white font-semibold whitespace-nowrap shrink-0"
                >
                  Compensating Refund
                </button>
                <button
                  type="button"
                  onClick={() => void handleAllocateCredits('adjust')}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                >
                  Request Maker-Checker Adj
                </button>
              </div>
            </div>

            {/* Candidate Wallets */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                  Candidate Examination Credit Wallets ({creditData.wallets.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-4">Candidate</th>
                      <th className="py-2.5 px-4 text-right">Available</th>
                      <th className="py-2.5 px-4 text-right">Reserved</th>
                      <th className="py-2.5 px-4 text-right">Consumed</th>
                      <th className="py-2.5 px-4 text-right">Refunded</th>
                      <th className="py-2.5 px-4">Threshold Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {creditData.wallets.map((w: any) => (
                      <tr key={w.id}>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{w.studentName}</div>
                          <div className="font-mono text-slate-500">{w.studentRegNo}</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-[#102D50] dark:text-white">
                          {w.availableCredits}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{w.reservedCredits}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{w.consumedCredits}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{w.refundedCredits}</td>
                        <td className="py-2.5 px-4">
                          {w.availableCredits <= w.lowCreditThreshold ? (
                            <span className="font-semibold text-amber-700 dark:text-amber-300">
                              Low Credit ({w.availableCredits} &le; {w.lowCreditThreshold})
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400">Healthy</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Immutable Ledger */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Immutable Append-Only Credit Ledger ({creditData.ledger.length} entries)
              </h2>
              <span className="text-xs text-slate-500">Logged as {userRole}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4">Tx Ref</th>
                    <th className="py-2.5 px-4">Candidate</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Delta</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {creditData.ledger.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#1769AA] dark:text-blue-400">
                        {tx.txRef}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-slate-900 dark:text-white">{tx.studentName}</span>{' '}
                        <span className="font-mono text-slate-500">({tx.studentRegNo})</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">{tx.type}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                        {tx.creditsDelta > 0 ? `+${tx.creditsDelta}` : tx.creditsDelta}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {tx.balanceBefore} &rarr; {tx.balanceAfter}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{tx.reason}</td>
                      <td className="py-2.5 px-4">
                        {tx.approvalStatus === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleApproveAdjustment(tx.id, 'APPROVED')}
                              className="px-2 py-1 rounded bg-emerald-700 text-white font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleApproveAdjustment(tx.id, 'REJECTED')}
                              className="px-2 py-1 rounded bg-red-700 text-white font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {tx.approvalStatus}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: STUDENT PROGRESSION ENGINE
          ==================================================================== */}
      {activeTab === 'progression' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Student Progression Engine &amp; Certification Eligibility Gate
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Lifecycle: {PROGRESSION_STAGES.join(' → ')}. Certification remains locked until all required modules pass.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {progressions.map((p) => (
              <div
                key={p.studentRegNo}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-slate-900 dark:text-white">{p.studentName}</strong>
                    <span className="font-mono text-slate-500">{p.studentRegNo}</span>
                    <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                      Stage: {p.stage}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {p.programmeName} ({p.examBody}) ·{' '}
                    <span className="font-mono tabular-nums">
                      {p.completedModulesCount}/{p.totalRequiredModules} modules completed · {p.progressPercent}%
                    </span>
                  </p>
                  {p.eligibilityBlockReason && (
                    <p className="text-amber-700 dark:text-amber-300">{p.eligibilityBlockReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await apiJson(`/api/admin/progressions/${encodeURIComponent(p.studentRegNo)}/recompute`, {
                          method: 'POST',
                        });
                        notifyOk(`Recomputed progression stage for ${p.studentRegNo}.`);
                        await loadAll();
                      } catch (err) {
                        notifyErr(err);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap shrink-0"
                  >
                    Recompute Stage
                  </button>
                  {p.eligibleForCertification && p.stage !== 'CERTIFIED' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const cert = await apiJson<any>('/api/exam-admin/certificates/issue', {
                            method: 'POST',
                            body: JSON.stringify({
                              studentRegNo: p.studentRegNo,
                              programmeId: p.programmeId,
                            }),
                          });
                          notifyOk(`Issued digital certificate ${cert.serialNumber}.`);
                          await loadAll();
                        } catch (err) {
                          notifyErr(err);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold whitespace-nowrap shrink-0"
                    >
                      Issue Digital Certificate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: CENTRAL QUESTION BANK, VERSIONING & PAPER BUILDER
          ==================================================================== */}
      {activeTab === 'question-bank' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Question Draft */}
            <form
              onSubmit={handleCreateQuestion}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
            >
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Author Question Bank Item (Starts as DRAFT)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <select
                  value={newQForm.examBody}
                  onChange={(e) => setNewQForm({ ...newQForm, examBody: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {EXAM_BODIES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <input
                  value={newQForm.moduleCode}
                  onChange={(e) => setNewQForm({ ...newQForm, moduleCode: e.target.value })}
                  placeholder="Module Code"
                  className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <select
                  value={newQForm.questionType}
                  onChange={(e) => setNewQForm({ ...newQForm, questionType: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <textarea
                required
                rows={2}
                placeholder="Enter question stem..."
                value={newQForm.prompt}
                onChange={(e) => setNewQForm({ ...newQForm, prompt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={newQForm.correctAnswerKey}
                  onChange={(e) => setNewQForm({ ...newQForm, correctAnswerKey: e.target.value })}
                  placeholder="Correct Answer Key"
                  className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <input
                  type="number"
                  min={1}
                  value={newQForm.marks}
                  onChange={(e) => setNewQForm({ ...newQForm, marks: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#102D50] text-white font-semibold"
                >
                  Save Draft Question
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerateAiDraft()}
                  className="px-3.5 py-2 rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-[#1769AA] dark:text-blue-300 font-semibold flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> AI Draft Questions (Human Review Required)
                </button>
              </div>
            </form>

            {/* Exam Paper Builder */}
            <form
              onSubmit={handleBuildPaper}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
            >
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Exam Paper Builder (Validates Question Marks == Total Marks)
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  required
                  value={paperForm.title}
                  onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                  placeholder="Paper Title"
                  className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <label className="block">
                  <span className="text-slate-500">Total Marks</span>
                  <input
                    type="number"
                    value={paperForm.totalMarks}
                    onChange={(e) => setPaperForm({ ...paperForm, totalMarks: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-500">Pass Mark</span>
                  <input
                    type="number"
                    value={paperForm.passMark}
                    onChange={(e) => setPaperForm({ ...paperForm, passMark: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </label>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                {questions
                  .filter((q) => q.status === 'APPROVED')
                  .map((q) => (
                    <label key={q.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paperForm.questionIds.includes(q.id)}
                        onChange={(e) => {
                          setPaperForm((prev) => ({
                            ...prev,
                            questionIds: e.target.checked
                              ? [...prev.questionIds, q.id]
                              : prev.questionIds.filter((id) => id !== q.id),
                          }));
                        }}
                      />
                      <span className="font-mono font-bold">{q.code}</span>
                      <span className="truncate flex-1">{q.prompt}</span>
                      <span className="font-mono tabular-nums">{q.marks}m</span>
                    </label>
                  ))}
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1769AA] text-white font-semibold"
              >
                Validate Marks &amp; Build Paper
              </button>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                {papers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="font-mono">{p.code} · {p.title} ({p.totalMarks}m)</span>
                    {p.status !== 'PUBLISHED' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiJson(`/api/exam-admin/papers/${p.id}/publish`, {
                            method: 'POST',
                            body: JSON.stringify({ status: 'PUBLISHED' }),
                          });
                          notifyOk(`Published paper ${p.code}.`);
                          await loadAll();
                        }}
                        className="text-[#1769AA] font-semibold hover:underline"
                      >
                        Publish
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold">PUBLISHED</span>
                    )}
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* Question Bank Directory */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Central Question Bank ({filteredQuestions.length})
              </h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={qbBodyFilter}
                  onChange={(e) => setQbBodyFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="ALL">All Bodies</option>
                  {EXAM_BODIES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  value={qbStatusFilter}
                  onChange={(e) => setQbStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                </select>
              </div>
            </div>
            <div className="space-y-2.5">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-slate-500 dark:text-slate-400">
                      <strong className="text-[#102D50] dark:text-white">{q.code}</strong>
                      <span>v{q.version}</span>
                      <span>· {q.examBody} · {q.moduleCode}</span>
                      <span>· {q.questionType}</span>
                      <span className="tabular-nums">· {q.marks} marks</span>
                      <span className="font-semibold text-[#1769AA] dark:text-blue-400">{q.status}</span>
                      {q.aiAssistedDraft && <span className="text-amber-700 dark:text-amber-300">· AI Draft</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{q.prompt}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {q.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => void handleReviewQuestion(q.id, 'UNDER_REVIEW')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
                      >
                        Submit Review
                      </button>
                    )}
                    {(q.status === 'DRAFT' || q.status === 'UNDER_REVIEW') && (
                      <button
                        type="button"
                        onClick={() => void handleReviewQuestion(q.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold"
                      >
                        Approve Item
                      </button>
                    )}
                    {q.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => void handleNewRevisionFromApproved(q)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
                      >
                        Create v{q.version + 1} Revision
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 7: MARKING, MODERATION & QR DIGITAL CERTIFICATES
          ==================================================================== */}
      {activeTab === 'results-certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Marking & AI-Assisted Review Gate */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <FileCheck2 size={16} /> Marking &amp; Human Moderation Queue
            </h2>
            <div className="space-y-3 text-xs">
              {markings.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white">
                      {m.attemptRef} · {m.studentName} ({m.studentRegNo})
                    </strong>
                    <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                      {m.moderationStatus}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {m.examTitle} · Objective: <strong className="font-mono tabular-nums">{m.objectiveScore}</strong> ·
                    Manual: <strong className="font-mono tabular-nums">{m.manualScore}</strong> /{' '}
                    <span className="font-mono tabular-nums">{m.totalMarks}</span> (Pass {m.passMark})
                  </p>
                  {m.aiDraftFeedback && (
                    <p className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2.5 text-amber-900 dark:text-amber-200">
                      {m.aiDraftFeedback}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {m.moderationStatus !== 'RELEASED' && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await apiJson(`/api/exam-admin/marking/${m.id}/grade`, {
                                method: 'POST',
                                body: JSON.stringify({
                                  manualScore: m.aiDraftScore || 38,
                                  lecturerFeedback: 'Verified by human lecturer.',
                                }),
                              });
                              notifyOk(`Human marking verified for ${m.attemptRef}.`);
                              await loadAll();
                            } catch (err) {
                              notifyErr(err);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#102D50] text-white font-semibold"
                        >
                          Verify Human Score
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await apiJson(`/api/exam-admin/marking/${m.id}/approve-release`, {
                                method: 'POST',
                                body: JSON.stringify({ moderatorNote: 'Approved for release' }),
                              });
                              notifyOk(`Released result for ${m.attemptRef}.`);
                              await loadAll();
                            } catch (err) {
                              notifyErr(err);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold"
                        >
                          Approve &amp; Release
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Certificates & QR Verification */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <QrCode size={16} /> Digital Certificates &amp; QR Verification
            </h2>
            <form onSubmit={handleVerifyCertificate} className="flex gap-2 text-xs">
              <input
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Serial or code (e.g. HCA-CERT-2026-0001)"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[#1769AA] text-white font-semibold whitespace-nowrap shrink-0"
              >
                Verify Serial
              </button>
            </form>
            {verifyResult && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={15} /> Authentic HI-TECH Digital Certificate
                </div>
                <p className="text-emerald-900 dark:text-emerald-200">
                  Recipient: <strong>{verifyResult.recipientName}</strong> ({verifyResult.studentRegNo})
                </p>
                <p className="font-mono text-emerald-800 dark:text-emerald-300">
                  {verifyResult.serialNumber} · {verifyResult.qualificationTitle} ({verifyResult.examBody})
                </p>
              </div>
            )}
            <div className="space-y-2 text-xs">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1"
                >
                  <div className="flex justify-between font-mono font-bold text-[#102D50] dark:text-white">
                    <span>{cert.serialNumber}</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{cert.status}</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {cert.studentName} ({cert.studentRegNo}) — {cert.qualificationTitle}
                  </p>
                  <p className="font-mono text-slate-500 truncate">{cert.qrPayload}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
