import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FilePlus2,
  FileSpreadsheet,
  FolderTree,
  History,
  LayoutDashboard,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';

export type ExamAdminNavSection =
  | 'dashboard'
  | 'question-bank'
  | 'categories'
  | 'create-question'
  | 'question-review'
  | 'papers'
  | 'templates'
  | 'ai-assistant'
  | 'version-history'
  | 'reports';

export interface ExamAdminQuestionBankWorkspaceProps {
  userRole: string;
  userName: string;
  catalog?: any;
  initialView?: ExamAdminNavSection;
  onRefreshParent?: () => Promise<void> | void;
  onNotify?: (type: 'ok' | 'err', message: string) => void;
}

export const QUESTION_BANK_TYPES = [
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
  'KASNEB',
  'TVET_CDACC',
  'NITA',
  'KNEC',
  'HI_TECH_INTERNAL',
] as const;

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

async function examAdminApi<T>(url: string, init?: RequestInit): Promise<T> {
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

function formatTypeLabel(qType: string): string {
  return qType
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export default function ExamAdminQuestionBankWorkspace({
  userRole,
  userName,
  catalog,
  initialView = 'dashboard',
  onRefreshParent,
  onNotify,
}: ExamAdminQuestionBankWorkspaceProps) {
  const [activeView, setActiveView] = useState<ExamAdminNavSection>(initialView);
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [categoriesData, setCategoriesData] = useState<{ topics: any[]; hierarchy: any[] }>({
    topics: [],
    hierarchy: [],
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  // 9-dimension filters + search
  const [filters, setFilters] = useState({
    examBody: 'ALL',
    departmentId: 'ALL',
    programmeId: 'ALL',
    moduleCode: 'ALL',
    topic: '',
    questionType: 'ALL',
    difficulty: 'ALL',
    status: 'ALL',
    authorId: 'ALL',
    search: '',
  });

  // Modals / Inspections
  const [selectedVersionQuestionId, setSelectedVersionQuestionId] = useState<string>('');
  const [versionDetail, setVersionDetail] = useState<any>(null);
  const [paperPreview, setPaperPreview] = useState<any>(null);
  const [previewWithKeys, setPreviewWithKeys] = useState(true);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importJsonText, setImportJsonText] = useState(
    JSON.stringify(
      [
        {
          title: 'ICDL Cyber Security Password Hygiene',
          examBody: 'ICDL',
          programmeId: 'prog-icdl-001',
          moduleCode: 'ICDL-M04',
          topic: 'Data Security',
          questionType: 'SINGLE_CHOICE_MCQ',
          difficulty: 'EASY',
          marks: 4,
          prompt: 'Which practice best protects a college spreadsheet containing candidate records?',
          options: [
            'Encrypt the file and restrict access to authorised staff',
            'Share the file on a public link',
            'Disable workstation lock screens',
            'Store passwords inside cell A1',
          ],
          correctAnswerKey: 'Encrypt the file and restrict access to authorised staff',
        },
      ],
      null,
      2
    )
  );
  const [exportedCsvPreview, setExportedCsvPreview] = useState<{ filename: string; count: number; csv: string } | null>(null);

  // Create Question Form (supports all 13 types)
  const [qForm, setQForm] = useState({
    title: '',
    examBody: 'ICDL',
    departmentId: 'cdept-ict',
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    topic: 'Formulas & Functions',
    questionType: 'SINGLE_CHOICE_MCQ',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    marks: 5,
    prompt: '',
    optionsRaw: 'Option A | Option B | Option C | Option D',
    correctAnswerKey: 'Option A',
    correctAnswersRaw: 'Option A | Option B',
    matchingRaw: 'SUM = Adds range | COUNT = Counts numeric cells | IF = Logical branch',
    orderingRaw: 'Verify identity | Check credit balance | Start exam timer | Submit script',
    numericalTolerance: 0.05,
    practicalChecklistRaw: 'Open dataset | Apply formula | Format currency KES | Save PDF',
    programmingLanguage: 'Python 3',
    starterCode: 'def solve(items):\n    return 0',
    audioReferencePhrase: 'Institutional examination integrity verification',
    acceptedSpellingsRaw: 'accommodation | accomodation',
    rubricSummary: '',
    explanationForLecturer: '',
  });

  // Review Queue comment state
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  // Categories / Topic creation
  const [topicForm, setTopicForm] = useState({
    examBody: 'ICDL',
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    name: '',
    learningOutcome: '',
  });

  // Template Creation Form
  const [tplForm, setTplForm] = useState({
    name: '',
    examBody: 'ICDL',
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    durationMinutes: 60,
    totalMarks: 20,
    passMark: 14,
    targetQuestionCount: 4,
    creditCost: 1,
    randomizeQuestions: true,
    randomizeOptions: true,
    negativeMarking: false,
    negativeMarkingPenalty: 0.25,
    maxAttempts: 1,
    easyPct: 30,
    mediumPct: 50,
    hardPct: 20,
  });

  // Exam Paper Builder Form
  const [paperForm, setPaperForm] = useState({
    title: 'ICDL Spreadsheets Assessment Paper',
    examBody: 'ICDL',
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    templateId: '',
    durationMinutes: 45,
    totalMarks: 10,
    passMark: 7,
    creditCost: 1,
    randomizeQuestions: true,
    randomizeOptions: true,
    negativeMarking: false,
    negativeMarkingPenalty: 0.25,
    maxAttempts: 1,
    autoSelectTopic: '',
    easyPct: 30,
    mediumPct: 50,
    hardPct: 20,
    questionIds: [] as string[],
  });

  // AI Question Assistant
  const [aiForm, setAiForm] = useState({
    examBody: 'ICDL',
    programmeId: 'prog-icdl-001',
    moduleCode: 'ICDL-M04',
    topic: 'Pivot Tables & Lookup Functions',
    questionType: 'SINGLE_CHOICE_MCQ',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    count: 2,
  });
  const [aiResult, setAiResult] = useState<any>(null);

  const canApproveQuestions = userRole !== 'LECTURER';

  const emitNotify = useCallback(
    (type: 'ok' | 'err', msg: string) => {
      if (onNotify) onNotify(type, msg);
    },
    [onNotify]
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, qs, cats, tpls, pprs, rep] = await Promise.all([
        examAdminApi<any>('/api/exam-admin/dashboard'),
        examAdminApi<any[]>('/api/exam-admin/question-bank'),
        examAdminApi<{ topics: any[]; hierarchy: any[] }>('/api/exam-admin/categories'),
        examAdminApi<any[]>('/api/exam-admin/templates'),
        examAdminApi<any[]>('/api/exam-admin/papers'),
        examAdminApi<any>('/api/exam-admin/reports'),
      ]);
      setDashboard(dash);
      setQuestions(qs);
      setCategoriesData(cats);
      setTemplates(tpls);
      setPapers(pprs);
      setReports(rep);
      if (!selectedVersionQuestionId && qs.length > 0) {
        setSelectedVersionQuestionId(qs[0].id);
      }
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Unable to load Question Bank data.');
    } finally {
      setLoading(false);
    }
  }, [emitNotify, selectedVersionQuestionId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const loadVersionHistory = useCallback(async (questionId: string) => {
    if (!questionId) return;
    try {
      const detail = await examAdminApi<any>(`/api/exam-admin/questions/${questionId}/versions`);
      setVersionDetail(detail);
    } catch {
      setVersionDetail(null);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'version-history' && selectedVersionQuestionId) {
      void loadVersionHistory(selectedVersionQuestionId);
    }
  }, [activeView, selectedVersionQuestionId, loadVersionHistory]);

  const authorsList = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      if (q.authorId && q.authorName) map.set(q.authorId, q.authorName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filters.examBody !== 'ALL' && q.examBody !== filters.examBody) return false;
      if (filters.departmentId !== 'ALL' && q.departmentId !== filters.departmentId) return false;
      if (filters.programmeId !== 'ALL' && q.programmeId !== filters.programmeId) return false;
      if (filters.moduleCode !== 'ALL' && q.moduleCode !== filters.moduleCode) return false;
      if (filters.topic.trim() && !q.topic.toLowerCase().includes(filters.topic.trim().toLowerCase())) {
        return false;
      }
      if (filters.questionType !== 'ALL' && q.questionType !== filters.questionType) return false;
      if (filters.difficulty !== 'ALL' && q.difficulty !== filters.difficulty) return false;
      if (filters.status !== 'ALL' && q.status !== filters.status) return false;
      if (filters.authorId !== 'ALL' && q.authorId !== filters.authorId) return false;
      if (filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
        const hay = `${q.code} ${q.title} ${q.prompt} ${q.topic} ${q.moduleCode} ${q.authorName}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [questions, filters]);

  const approvedQuestions = useMemo(
    () => questions.filter((q) => q.status === 'APPROVED'),
    [questions]
  );

  const selectedPaperMarks = useMemo(() => {
    return approvedQuestions
      .filter((q) => paperForm.questionIds.includes(q.id))
      .reduce((sum, q) => sum + Number(q.marks || 0), 0);
  }, [approvedQuestions, paperForm.questionIds]);

  const refreshAll = async () => {
    await loadWorkspace();
    if (onRefreshParent) await onRefreshParent();
  };

  // Action Handlers
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const qType = qForm.questionType;
      const options =
        qType === 'SINGLE_CHOICE_MCQ' || qType === 'MULTIPLE_RESPONSE_MCQ'
          ? qForm.optionsRaw.split('|').map((s) => s.trim()).filter(Boolean)
          : qType === 'TRUE_FALSE'
          ? ['True', 'False']
          : undefined;
      const correctAnswers =
        qType === 'MULTIPLE_RESPONSE_MCQ'
          ? qForm.correctAnswersRaw.split('|').map((s) => s.trim()).filter(Boolean)
          : undefined;
      const matchingPairs =
        qType === 'MATCHING'
          ? qForm.matchingRaw
              .split('|')
              .map((pair) => {
                const [left, right] = pair.split('=').map((s) => s.trim());
                return left && right ? { left, right } : null;
              })
              .filter(Boolean)
          : undefined;
      const orderingItems =
        qType === 'ORDERING'
          ? qForm.orderingRaw.split('|').map((s) => s.trim()).filter(Boolean)
          : undefined;
      const practicalChecklist =
        qType === 'PRACTICAL_TASK'
          ? qForm.practicalChecklistRaw.split('|').map((s) => s.trim()).filter(Boolean)
          : undefined;
      const acceptedSpellings =
        qType === 'SPELLING_LANGUAGE'
          ? qForm.acceptedSpellingsRaw.split('|').map((s) => s.trim()).filter(Boolean)
          : undefined;

      const created = await examAdminApi<any>('/api/exam-admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          title: qForm.title || qForm.prompt.slice(0, 68),
          examBody: qForm.examBody,
          departmentId: qForm.departmentId,
          programmeId: qForm.programmeId,
          moduleCode: qForm.moduleCode,
          topic: qForm.topic,
          questionType: qType,
          difficulty: qForm.difficulty,
          marks: Number(qForm.marks),
          prompt: qForm.prompt,
          options,
          correctAnswerKey: qForm.correctAnswerKey,
          correctAnswers,
          matchingPairs,
          orderingItems,
          numericalTolerance: qType === 'NUMERICAL' ? Number(qForm.numericalTolerance) : undefined,
          practicalChecklist,
          programmingLanguage: qType === 'PROGRAMMING_CODE' ? qForm.programmingLanguage : undefined,
          starterCode: qType === 'PROGRAMMING_CODE' ? qForm.starterCode : undefined,
          audioReferencePhrase: qType === 'PRONUNCIATION_AUDIO' ? qForm.audioReferencePhrase : undefined,
          acceptedSpellings,
          rubricSummary: qForm.rubricSummary,
          explanationForLecturer: qForm.explanationForLecturer,
        }),
      });
      setQForm((prev) => ({ ...prev, title: '', prompt: '' }));
      emitNotify('ok', `Created question ${created.code} in DRAFT status.`);
      await refreshAll();
      setActiveView('question-bank');
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Unable to save question.');
    }
  };

  const handleReviewTransition = async (
    questionId: string,
    status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED'
  ) => {
    try {
      const comment = reviewComments[questionId] || '';
      const endpoint =
        status === 'APPROVED'
          ? `/api/exam-admin/questions/${questionId}/approve`
          : `/api/exam-admin/questions/${questionId}/review`;
      await examAdminApi(endpoint, {
        method: 'POST',
        body: JSON.stringify({ status, comment }),
      });
      emitNotify('ok', `Question transitioned to ${status}.`);
      await refreshAll();
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Unable to update question status.');
    }
  };

  const handleCreateRevision = async (q: any) => {
    try {
      const updated = await examAdminApi<any>(`/api/exam-admin/questions/${q.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          prompt: `${q.prompt} (v${q.version + 1} Revision)`,
          changeNote: `New v${q.version + 1} revision initiated by ${userName}`,
        }),
      });
      emitNotify('ok', `Created immutable v${updated.version} draft revision for ${updated.code}.`);
      setSelectedVersionQuestionId(updated.id);
      await refreshAll();
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Unable to create revision.');
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.examBody !== 'ALL') params.set('examBody', filters.examBody);
      if (filters.status !== 'ALL') params.set('status', filters.status);
      if (filters.difficulty !== 'ALL') params.set('difficulty', filters.difficulty);
      if (filters.questionType !== 'ALL') params.set('questionType', filters.questionType);
      const data = await examAdminApi<{ filename: string; count: number; csv: string }>(
        `/api/exam-admin/questions/export?${params.toString()}`
      );
      setExportedCsvPreview(data);
      if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', data.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      emitNotify('ok', `Exported ${data.count} filtered question(s) to CSV.`);
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Export failed.');
    }
  };

  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJsonText);
      const list = Array.isArray(parsed) ? parsed : parsed.questions || [];
      const res = await examAdminApi<{ importedCount: number }>('/api/exam-admin/questions/import', {
        method: 'POST',
        body: JSON.stringify({ questions: list }),
      });
      setShowImportPanel(false);
      emitNotify('ok', `Imported ${res.importedCount} question(s) strictly as DRAFT for review.`);
      await refreshAll();
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Batch import failed.');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await examAdminApi('/api/exam-admin/topics', {
        method: 'POST',
        body: JSON.stringify(topicForm),
      });
      setTopicForm((prev) => ({ ...prev, name: '', learningOutcome: '' }));
      emitNotify('ok', 'Added category topic to question hierarchy.');
      await refreshAll();
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Failed to create topic.');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await examAdminApi('/api/exam-admin/templates', {
        method: 'POST',
        body: JSON.stringify({
          ...tplForm,
          difficultyDistribution: {
            EASY: Number(tplForm.easyPct),
            MEDIUM: Number(tplForm.mediumPct),
            HARD: Number(tplForm.hardPct),
          },
        }),
      });
      setTplForm((prev) => ({ ...prev, name: '' }));
      emitNotify('ok', 'Saved reusable examination blueprint template.');
      await refreshAll();
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Failed to create template.');
    }
  };

  const handleApplyTemplate = (tplId: string) => {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setPaperForm((prev) => ({
      ...prev,
      templateId: tpl.id,
      title: `${tpl.name} (${new Date().toISOString().slice(0, 10)})`,
      examBody: tpl.examBody,
      programmeId: tpl.programmeId,
      moduleCode: tpl.moduleCode,
      durationMinutes: tpl.durationMinutes,
      totalMarks: tpl.totalMarks,
      passMark: tpl.passMark,
      creditCost: tpl.creditCost,
      randomizeQuestions: tpl.randomizeQuestions,
      randomizeOptions: tpl.randomizeOptions,
      negativeMarking: tpl.negativeMarking,
      negativeMarkingPenalty: tpl.negativeMarkingPenalty,
      maxAttempts: tpl.maxAttempts,
      easyPct: tpl.difficultyDistribution?.EASY ?? 30,
      mediumPct: tpl.difficultyDistribution?.MEDIUM ?? 50,
      hardPct: tpl.difficultyDistribution?.HARD ?? 20,
    }));
    emitNotify('ok', `Applied blueprint template ${tpl.code}.`);
  };

  const handleBuildPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await examAdminApi<any>('/api/exam-admin/papers', {
        method: 'POST',
        body: JSON.stringify({
          ...paperForm,
          difficultyDistribution: {
            EASY: Number(paperForm.easyPct),
            MEDIUM: Number(paperForm.mediumPct),
            HARD: Number(paperForm.hardPct),
          },
        }),
      });
      emitNotify('ok', `Built paper ${created.code} (${created.totalMarks} marks).`);
      await refreshAll();
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Failed to build examination paper.');
    }
  };

  const handleLoadPaperPreview = async (paperId: string, withKeys: boolean) => {
    try {
      setPreviewWithKeys(withKeys);
      const data = await examAdminApi<any>(
        `/api/exam-admin/papers/${paperId}/preview?includeAnswerKey=${withKeys ? 'true' : 'false'}`
      );
      setPaperPreview(data);
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'Unable to preview paper.');
    }
  };

  const handleGenerateAi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await examAdminApi<any>('/api/exam-admin/ai/generate', {
        method: 'POST',
        body: JSON.stringify(aiForm),
      });
      setAiResult(data);
      emitNotify(
        'ok',
        `Generated ${data.createdCount} AI draft question(s). Human review is required before approval.`
      );
      await refreshAll();
    } catch (err) {
      emitNotify('err', err instanceof Error ? err.message : 'AI question generation failed.');
    }
  };

  const navItems: {
    id: ExamAdminNavSection;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
    { id: 'categories', label: 'Categories & Topics', icon: FolderTree },
    { id: 'create-question', label: 'Create Questions', icon: FilePlus2 },
    { id: 'question-review', label: 'Question Review', icon: ClipboardCheck },
    { id: 'papers', label: 'Examination Papers', icon: FileSpreadsheet },
    { id: 'templates', label: 'Examination Templates', icon: Layers },
    { id: 'ai-assistant', label: 'AI Question Assistant', icon: Sparkles },
    { id: 'version-history', label: 'Version History', icon: History },
    { id: 'reports', label: 'Assessment Reports', icon: BarChart3 },
  ];

  const kpis = dashboard?.kpis || {
    totalQuestions: questions.length,
    approvedQuestions: approvedQuestions.length,
    awaitingReviewQuestions: questions.filter((q) => q.status === 'UNDER_REVIEW').length,
    draftQuestions: questions.filter((q) => q.status === 'DRAFT').length,
    totalPapers: papers.length,
    publishedPapers: papers.filter((p) => p.status === 'PUBLISHED').length,
    topicsCount: categoriesData.topics.length,
    templatesCount: templates.length,
  };

  const departmentsList = catalog?.departments || [];
  const programmesList = catalog?.programmes || [];
  const modulesList = catalog?.modules || [];

  return (
    <div className="space-y-5">
      {/* Sub-navigation Rail for Sprint 1.7 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-400">
              Examination Administration &amp; Central Question Bank
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Multi-body item bank for ICDL, KASNEB, TVET CDACC, NITA, KNEC &amp; internal assessments
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <RefreshCw size={13} />
            Sync Bank
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#102D50] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================
          VIEW 1: DASHBOARD
          ================================================================== */}
      {activeView === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Question Bank Entries
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#102D50] dark:text-white">
                {kpis.totalQuestions}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {kpis.draftQuestions} draft · {kpis.topicsCount} topics
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Approved Questions
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {kpis.approvedQuestions}
              </p>
              <p className="mt-1 text-xs text-slate-500">Paper-eligible items</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Awaiting Review
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300">
                {kpis.awaitingReviewQuestions}
              </p>
              <p className="mt-1 text-xs text-slate-500">Moderation queue</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Examination Papers
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#1769AA] dark:text-blue-400">
                {kpis.totalPapers}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {kpis.publishedPapers} published · {kpis.templatesCount} templates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                  Question Bank Distribution by Examination Body
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveView('create-question')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#102D50] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <Plus size={13} /> Author Question
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-4">Examination Body</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                      <th className="py-2.5 px-4 text-right">Approved</th>
                      <th className="py-2.5 px-4 text-right">Review</th>
                      <th className="py-2.5 px-4 text-right">Draft</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(dashboard?.byExamBody || []).map((row: any) => (
                      <tr key={row.examBody}>
                        <td className="py-2.5 px-4 font-bold text-[#102D50] dark:text-white">
                          {row.examBody}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.total}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          {row.approved}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-700 dark:text-amber-300">
                          {row.underReview}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          {row.draft}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Recent Question Bank Activity
              </h3>
              <div className="space-y-2.5 text-xs">
                {(dashboard?.recentActivity || []).slice(0, 6).map((log: any) => (
                  <div
                    key={log.id}
                    className="pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{log.action}</p>
                    <p className="text-slate-600 dark:text-slate-400">{log.detail}</p>
                    <p className="font-mono text-slate-400 mt-0.5">
                      {log.actorName} ({log.actorRole})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 2: CENTRAL QUESTION BANK (9 FILTERS + EXPORT + IMPORT)
          ================================================================== */}
      {activeView === 'question-bank' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                  Central Question Bank ({filteredQuestions.length} of {questions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Filter by body, department, programme, module, topic, question type, difficulty, status, and author.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleExportCsv()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                >
                  <Download size={13} /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportPanel((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                >
                  <Upload size={13} /> Batch Import
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('create-question')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102D50] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <Plus size={13} /> New Question
                </button>
              </div>
            </div>

            {showImportPanel && (
              <form
                onSubmit={handleBatchImport}
                className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-[#102D50] dark:text-white">
                    JSON Question Batch Import (All imported items strictly start as DRAFT)
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowImportPanel(false)}
                    className="text-slate-500 hover:underline"
                  >
                    Close
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1769AA] text-white font-semibold"
                >
                  Import Questions as DRAFT
                </button>
              </form>
            )}

            {exportedCsvPreview && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs flex items-center justify-between">
                <span>
                  Prepared CSV <strong>{exportedCsvPreview.filename}</strong> ({exportedCsvPreview.count} rows, formula-safe).
                </span>
                <button
                  type="button"
                  onClick={() => setExportedCsvPreview(null)}
                  className="text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* 9 Filter Controls + Search */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
              <div className="relative col-span-2 sm:col-span-1">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search code, title, stem..."
                  className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <select
                aria-label="Filter by examination body"
                value={filters.examBody}
                onChange={(e) => setFilters({ ...filters, examBody: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Bodies</option>
                {EXAM_BODIES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                aria-label="Filter by department"
                value={filters.departmentId}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                aria-label="Filter by programme"
                value={filters.programmeId}
                onChange={(e) => setFilters({ ...filters, programmeId: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Programmes</option>
                {programmesList.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
              </select>
              <select
                aria-label="Filter by module"
                value={filters.moduleCode}
                onChange={(e) => setFilters({ ...filters, moduleCode: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Modules</option>
                {modulesList.map((m: any) => (
                  <option key={m.id} value={m.code}>{m.code} — {m.title}</option>
                ))}
              </select>
              <input
                aria-label="Filter by topic"
                value={filters.topic}
                onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                placeholder="Topic contains..."
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <select
                aria-label="Filter by question type"
                value={filters.questionType}
                onChange={(e) => setFilters({ ...filters, questionType: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Question Types</option>
                {QUESTION_BANK_TYPES.map((t) => (
                  <option key={t} value={t}>{formatTypeLabel(t)}</option>
                ))}
              </select>
              <select
                aria-label="Filter by difficulty"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Difficulties</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                aria-label="Filter by status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
              <select
                aria-label="Filter by author"
                value={filters.authorId}
                onChange={(e) => setFilters({ ...filters, authorId: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Authors</option>
                {authorsList.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
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
                      <span>· {q.examBody}</span>
                      <span>· {q.moduleCode}</span>
                      <span>· {q.topic}</span>
                      <span>· {q.questionType}</span>
                      <span>· {q.difficulty}</span>
                      <span className="tabular-nums">· {q.marks}m</span>
                      <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                        · {q.status}
                      </span>
                      {q.aiAssistedDraft && (
                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                          · AI Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {q.title || q.prompt}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">{q.prompt}</p>
                    <p className="text-slate-500">
                      Author: {q.authorName} · Key: <span className="font-mono">{q.correctAnswerKey}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVersionQuestionId(q.id);
                        setActiveView('version-history');
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap shrink-0"
                    >
                      History ({q.versions?.length || 1})
                    </button>
                    {q.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => void handleReviewTransition(q.id, 'UNDER_REVIEW')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap shrink-0"
                      >
                        Submit Review
                      </button>
                    )}
                    {(q.status === 'DRAFT' || q.status === 'UNDER_REVIEW') && canApproveQuestions && (
                      <button
                        type="button"
                        onClick={() => void handleReviewTransition(q.id, 'APPROVED')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold whitespace-nowrap shrink-0"
                      >
                        Approve
                      </button>
                    )}
                    {q.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => void handleCreateRevision(q)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap shrink-0"
                      >
                        New v{q.version + 1} Draft
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-500">
                  No questions match the current multi-dimensional filter criteria.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 3: CATEGORIES & TOPICS HIERARCHY
          ================================================================== */}
      {activeView === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={handleCreateTopic}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Add Curriculum Topic
            </h3>
            <label className="block">
              <span className="text-slate-600 dark:text-slate-300">Examination Body</span>
              <select
                value={topicForm.examBody}
                onChange={(e) => setTopicForm({ ...topicForm, examBody: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {EXAM_BODIES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-slate-600 dark:text-slate-300">Module</span>
              <select
                value={topicForm.moduleCode}
                onChange={(e) => setTopicForm({ ...topicForm, moduleCode: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {modulesList.map((m: any) => (
                  <option key={m.id} value={m.code}>{m.code} — {m.title}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-slate-600 dark:text-slate-300">Topic Name</span>
              <input
                required
                value={topicForm.name}
                onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                placeholder="e.g. Pivot Tables & Lookup Functions"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </label>
            <label className="block">
              <span className="text-slate-600 dark:text-slate-300">Learning Outcome</span>
              <textarea
                rows={2}
                value={topicForm.learningOutcome}
                onChange={(e) => setTopicForm({ ...topicForm, learningOutcome: e.target.value })}
                placeholder="Competency assessed by this topic..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </label>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#102D50] text-white font-semibold"
            >
              Create Topic
            </button>
          </form>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Examination Body → Programme → Module → Topics ({categoriesData.topics.length})
            </h3>
            <div className="space-y-3 text-xs">
              {categoriesData.topics.map((t: any) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-mono text-slate-500">
                      {t.code} · {t.examBody} · {t.programmeName} · {t.moduleCode}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-slate-600 dark:text-slate-300">{t.learningOutcome}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <p className="font-bold text-[#102D50] dark:text-white">
                      {t.questionCount} questions
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400">
                      {t.approvedCount} approved
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 4: CREATE QUESTIONS WORKSPACE (ALL 13 TYPES + LIVE PREVIEW)
          ================================================================== */}
      {activeView === 'create-question' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleCreateQuestion}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Question Authoring Editor (Starts in DRAFT)
            </h3>
            <input
              value={qForm.title}
              onChange={(e) => setQForm({ ...qForm, title: e.target.value })}
              placeholder="Short Question Title (e.g. Excel VLOOKUP Exact Match)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <select
                value={qForm.examBody}
                onChange={(e) => setQForm({ ...qForm, examBody: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {EXAM_BODIES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                value={qForm.moduleCode}
                onChange={(e) => setQForm({ ...qForm, moduleCode: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {modulesList.map((m: any) => (
                  <option key={m.id} value={m.code}>{m.code}</option>
                ))}
              </select>
              <input
                value={qForm.topic}
                onChange={(e) => setQForm({ ...qForm, topic: e.target.value })}
                placeholder="Topic"
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <select
                value={qForm.questionType}
                onChange={(e) => setQForm({ ...qForm, questionType: e.target.value })}
                className="col-span-2 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {QUESTION_BANK_TYPES.map((t) => (
                  <option key={t} value={t}>{formatTypeLabel(t)}</option>
                ))}
              </select>
              <select
                value={qForm.difficulty}
                onChange={(e) =>
                  setQForm({ ...qForm, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })
                }
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <textarea
              required
              rows={3}
              value={qForm.prompt}
              onChange={(e) => setQForm({ ...qForm, prompt: e.target.value })}
              placeholder="Enter full examination question stem / prompt..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />

            {(qForm.questionType === 'SINGLE_CHOICE_MCQ' ||
              qForm.questionType === 'MULTIPLE_RESPONSE_MCQ') && (
              <input
                value={qForm.optionsRaw}
                onChange={(e) => setQForm({ ...qForm, optionsRaw: e.target.value })}
                placeholder="Options separated by | (pipe)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            )}

            {qForm.questionType === 'MULTIPLE_RESPONSE_MCQ' && (
              <input
                value={qForm.correctAnswersRaw}
                onChange={(e) => setQForm({ ...qForm, correctAnswersRaw: e.target.value })}
                placeholder="Multiple correct answers separated by |"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            )}

            {qForm.questionType === 'MATCHING' && (
              <input
                value={qForm.matchingRaw}
                onChange={(e) => setQForm({ ...qForm, matchingRaw: e.target.value })}
                placeholder="Matching pairs: TermA = DefA | TermB = DefB"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            )}

            {qForm.questionType === 'ORDERING' && (
              <input
                value={qForm.orderingRaw}
                onChange={(e) => setQForm({ ...qForm, orderingRaw: e.target.value })}
                placeholder="Sequence steps in correct order separated by |"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            )}

            {qForm.questionType === 'NUMERICAL' && (
              <label className="block">
                <span className="text-slate-600 dark:text-slate-300">Accepted Numerical Tolerance (+/-)</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={qForm.numericalTolerance}
                  onChange={(e) =>
                    setQForm({ ...qForm, numericalTolerance: Number(e.target.value) })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </label>
            )}

            {qForm.questionType === 'PRACTICAL_TASK' && (
              <input
                value={qForm.practicalChecklistRaw}
                onChange={(e) => setQForm({ ...qForm, practicalChecklistRaw: e.target.value })}
                placeholder="Checklist items separated by |"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            )}

            {qForm.questionType === 'PROGRAMMING_CODE' && (
              <div className="space-y-2">
                <input
                  value={qForm.programmingLanguage}
                  onChange={(e) => setQForm({ ...qForm, programmingLanguage: e.target.value })}
                  placeholder="Language (e.g. Python 3, SQL, JavaScript)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <textarea
                  rows={3}
                  value={qForm.starterCode}
                  onChange={(e) => setQForm({ ...qForm, starterCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            )}

            {qForm.questionType === 'PRONUNCIATION_AUDIO' && (
              <input
                value={qForm.audioReferencePhrase}
                onChange={(e) => setQForm({ ...qForm, audioReferencePhrase: e.target.value })}
                placeholder="Spoken reference phrase"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            )}

            {qForm.questionType === 'SPELLING_LANGUAGE' && (
              <input
                value={qForm.acceptedSpellingsRaw}
                onChange={(e) => setQForm({ ...qForm, acceptedSpellingsRaw: e.target.value })}
                placeholder="Accepted spellings separated by |"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <input
                required
                value={qForm.correctAnswerKey}
                onChange={(e) => setQForm({ ...qForm, correctAnswerKey: e.target.value })}
                placeholder="Primary Answer Key"
                className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                min={1}
                value={qForm.marks}
                onChange={(e) => setQForm({ ...qForm, marks: Number(e.target.value) })}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <input
              value={qForm.rubricSummary}
              onChange={(e) => setQForm({ ...qForm, rubricSummary: e.target.value })}
              placeholder="Marking rubric summary"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={qForm.explanationForLecturer}
              onChange={(e) => setQForm({ ...qForm, explanationForLecturer: e.target.value })}
              placeholder="Explanation / rationale for lecturers & moderators"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#102D50] text-white font-semibold"
            >
              Save Question to Bank (DRAFT)
            </button>
          </form>

          {/* Live Question Preview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                <Eye size={15} /> Live Candidate &amp; Moderator Preview
              </h3>
              <span className="font-mono text-xs text-slate-500">
                {qForm.examBody} · {qForm.moduleCode} · {qForm.marks}m
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 space-y-3 text-xs">
              <div className="font-mono text-slate-500">
                {formatTypeLabel(qForm.questionType)} · {qForm.difficulty} · {qForm.topic}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {qForm.title || 'Untitled Question Preview'}
              </p>
              <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                {qForm.prompt || 'Type a question stem on the left to preview candidate rendering.'}
              </p>
              {(qForm.questionType === 'SINGLE_CHOICE_MCQ' ||
                qForm.questionType === 'MULTIPLE_RESPONSE_MCQ') && (
                <ul className="space-y-1.5 pt-1">
                  {qForm.optionsRaw
                    .split('|')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((opt, idx) => (
                      <li
                        key={idx}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </li>
                    ))}
                </ul>
              )}
              {qForm.questionType === 'TRUE_FALSE' && (
                <div className="flex gap-3 pt-1">
                  <span className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                    True
                  </span>
                  <span className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                    False
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <p>
                  <strong>Key (Admin/Lecturer Only):</strong>{' '}
                  <span className="font-mono">{qForm.correctAnswerKey}</span>
                </p>
                {qForm.rubricSummary && <p>Rubric: {qForm.rubricSummary}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 5: QUESTION REVIEW QUEUE
          ================================================================== */}
      {activeView === 'question-review' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Question Moderation &amp; Approval Queue
              </h3>
              <p className="text-xs text-slate-500">
                Workflow: DRAFT → UNDER_REVIEW → APPROVED. Lecturers may submit drafts; HOD/Examinations Officer/Principal/Admin approve.
              </p>
            </div>
            {!canApproveQuestions && (
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Role {userRole}: Draft &amp; Submit only (Approval locked)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {questions
              .filter((q) => q.status === 'DRAFT' || q.status === 'UNDER_REVIEW')
              .map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-slate-500">
                      <strong className="text-[#102D50] dark:text-white">{q.code}</strong> · v{q.version} ·{' '}
                      {q.examBody} · {q.moduleCode} · {q.status} · Author: {q.authorName}
                    </div>
                    <span className="font-mono tabular-nums font-bold">{q.marks} marks</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{q.prompt}</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Key: <span className="font-mono">{q.correctAnswerKey}</span> · Rubric: {q.rubricSummary}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      value={reviewComments[q.id] || ''}
                      onChange={(e) =>
                        setReviewComments({ ...reviewComments, [q.id]: e.target.value })
                      }
                      placeholder="Reviewer moderation comment..."
                      className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    {q.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => void handleReviewTransition(q.id, 'UNDER_REVIEW')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap shrink-0"
                      >
                        Move to Under Review
                      </button>
                    )}
                    {canApproveQuestions && (
                      <button
                        type="button"
                        onClick={() => void handleReviewTransition(q.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold whitespace-nowrap shrink-0"
                      >
                        Approve Question
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleReviewTransition(q.id, 'DRAFT')}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold whitespace-nowrap shrink-0"
                    >
                      Return to Draft
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 6: EXAMINATION PAPERS BUILDER & PREVIEW
          ================================================================== */}
      {activeView === 'papers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleBuildPaper}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Examination Paper Builder
            </h3>

            {templates.length > 0 && (
              <label className="block">
                <span className="text-slate-600 dark:text-slate-300">Apply Blueprint Template</span>
                <select
                  value={paperForm.templateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Manual Paper Configuration</option>
                  {templates.map((tpl: any) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.code} — {tpl.name} ({tpl.totalMarks}m)
                    </option>
                  ))}
                </select>
              </label>
            )}

            <input
              required
              value={paperForm.title}
              onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
              placeholder="Examination Paper Title"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />

            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-slate-500">Total Marks</span>
                <input
                  type="number"
                  value={paperForm.totalMarks}
                  onChange={(e) => setPaperForm({ ...paperForm, totalMarks: Number(e.target.value) })}
                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </label>
              <label className="block">
                <span className="text-slate-500">Pass Mark</span>
                <input
                  type="number"
                  value={paperForm.passMark}
                  onChange={(e) => setPaperForm({ ...paperForm, passMark: Number(e.target.value) })}
                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </label>
              <label className="block">
                <span className="text-slate-500">Duration (min)</span>
                <input
                  type="number"
                  value={paperForm.durationMinutes}
                  onChange={(e) =>
                    setPaperForm({ ...paperForm, durationMinutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-4 py-1 text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={paperForm.randomizeQuestions}
                  onChange={(e) =>
                    setPaperForm({ ...paperForm, randomizeQuestions: e.target.checked })
                  }
                />
                Randomize questions
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={paperForm.randomizeOptions}
                  onChange={(e) =>
                    setPaperForm({ ...paperForm, randomizeOptions: e.target.checked })
                  }
                />
                Randomize options
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={paperForm.negativeMarking}
                  onChange={(e) =>
                    setPaperForm({ ...paperForm, negativeMarking: e.target.checked })
                  }
                />
                Negative marking
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Select Approved Questions Only ({approvedQuestions.length} available)
                </span>
                <span
                  className={`font-mono tabular-nums font-bold ${
                    paperForm.questionIds.length > 0 && selectedPaperMarks === paperForm.totalMarks
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  Selected: {selectedPaperMarks} / {paperForm.totalMarks} marks
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2 space-y-1">
                {approvedQuestions.map((q) => (
                  <label key={q.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paperForm.questionIds.includes(q.id)}
                      onChange={(e) =>
                        setPaperForm((prev) => ({
                          ...prev,
                          questionIds: e.target.checked
                            ? [...prev.questionIds, q.id]
                            : prev.questionIds.filter((id) => id !== q.id),
                        }))
                      }
                    />
                    <span className="font-mono font-bold">{q.code}</span>
                    <span className="truncate flex-1">{q.title || q.prompt}</span>
                    <span className="font-mono text-slate-500">{q.difficulty}</span>
                    <span className="font-mono tabular-nums font-semibold">{q.marks}m</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-slate-500">
                Leave checkboxes empty to auto-select approved questions matching module and difficulty mix.
              </p>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1769AA] text-white font-semibold"
            >
              Build Exam Paper Blueprint
            </button>
          </form>

          {/* Existing Papers & Preview */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Examination Papers ({papers.length})
              </h3>
              <div className="space-y-2.5">
                {papers.map((p: any) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono font-bold text-[#102D50] dark:text-white">
                          {p.code} · {p.status}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
                        <p className="text-slate-500 font-mono tabular-nums">
                          {p.questionIds?.length || 0} questions · {p.totalMarks} marks (pass {p.passMark}) ·{' '}
                          {p.durationMinutes} min
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleLoadPaperPreview(p.id, true)}
                          className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap shrink-0"
                        >
                          Preview
                        </button>
                        {p.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await examAdminApi(`/api/exam-admin/papers/${p.id}/submit-approval`, {
                                  method: 'POST',
                                  body: JSON.stringify({ comment: 'Submitted from Paper Builder' }),
                                });
                                emitNotify('ok', `Submitted paper ${p.code} for approval.`);
                                await refreshAll();
                              } catch (err) {
                                emitNotify('err', err instanceof Error ? err.message : 'Submit failed.');
                              }
                            }}
                            className="px-2.5 py-1 rounded border border-blue-300 dark:border-blue-800 text-[#1769AA] dark:text-blue-300 font-semibold whitespace-nowrap shrink-0"
                          >
                            Submit Approval
                          </button>
                        )}
                        {p.status !== 'PUBLISHED' && canApproveQuestions && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await examAdminApi(`/api/exam-admin/papers/${p.id}/publish`, {
                                  method: 'POST',
                                  body: JSON.stringify({ status: 'PUBLISHED' }),
                                });
                                emitNotify('ok', `Published paper ${p.code}.`);
                                await refreshAll();
                              } catch (err) {
                                emitNotify('err', err instanceof Error ? err.message : 'Publish failed.');
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold whitespace-nowrap shrink-0"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {paperPreview && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#102D50] dark:text-white">
                    Paper Preview: {paperPreview.paper.code}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void handleLoadPaperPreview(paperPreview.paper.id, !previewWithKeys)
                      }
                      className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 font-semibold"
                    >
                      {previewWithKeys ? 'Hide Answer Keys' : 'Show Answer Keys'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperPreview(null)}
                      className="text-slate-500 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {paperPreview.questions.map((pq: any) => (
                    <div
                      key={pq.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1"
                    >
                      <p className="font-mono text-slate-500">
                        Q{pq.position} · {pq.code} · {pq.marks}m · {pq.difficulty}
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">{pq.prompt}</p>
                      {pq.correctAnswerKey && (
                        <p className="font-mono text-emerald-700 dark:text-emerald-400">
                          Key: {pq.correctAnswerKey}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 7: EXAMINATION TEMPLATES
          ================================================================== */}
      {activeView === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={handleCreateTemplate}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Create Exam Paper Template
            </h3>
            <input
              required
              value={tplForm.name}
              onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
              placeholder="Template Name"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={tplForm.examBody}
                onChange={(e) => setTplForm({ ...tplForm, examBody: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {EXAM_BODIES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                value={tplForm.moduleCode}
                onChange={(e) => setTplForm({ ...tplForm, moduleCode: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {modulesList.map((m: any) => (
                  <option key={m.id} value={m.code}>{m.code}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-slate-500">Total Marks</span>
                <input
                  type="number"
                  value={tplForm.totalMarks}
                  onChange={(e) => setTplForm({ ...tplForm, totalMarks: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </label>
              <label className="block">
                <span className="text-slate-500">Pass Mark</span>
                <input
                  type="number"
                  value={tplForm.passMark}
                  onChange={(e) => setTplForm({ ...tplForm, passMark: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </label>
              <label className="block">
                <span className="text-slate-500">Minutes</span>
                <input
                  type="number"
                  value={tplForm.durationMinutes}
                  onChange={(e) =>
                    setTplForm({ ...tplForm, durationMinutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#102D50] text-white font-semibold"
            >
              Save Template Blueprint
            </button>
          </form>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Reusable Examination Templates ({templates.length})
            </h3>
            <div className="space-y-3">
              {templates.map((tpl: any) => (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-mono text-slate-500">
                      {tpl.code} · {tpl.examBody} · {tpl.moduleCode}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{tpl.name}</p>
                    <p className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                      {tpl.totalMarks} marks (pass {tpl.passMark}) · {tpl.durationMinutes}m · Mix E/M/H:{' '}
                      {tpl.difficultyDistribution?.EASY}/{tpl.difficultyDistribution?.MEDIUM}/
                      {tpl.difficultyDistribution?.HARD}%
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyTemplate(tpl.id);
                      setActiveView('papers');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#1769AA] text-white font-semibold whitespace-nowrap shrink-0"
                  >
                    Use in Paper Builder
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 8: AI QUESTION ASSISTANT
          ================================================================== */}
      {activeView === 'ai-assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleGenerateAi}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#1769AA]" />
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                AI Question Assistant (Drafts Strictly Require Human Review)
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Generate draft questions, distractor suggestions, marking rubrics, and lecturer explanations with automatic similarity detection. Drafts can never auto-publish.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={aiForm.examBody}
                onChange={(e) => setAiForm({ ...aiForm, examBody: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {EXAM_BODIES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                value={aiForm.moduleCode}
                onChange={(e) => setAiForm({ ...aiForm, moduleCode: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {modulesList.map((m: any) => (
                  <option key={m.id} value={m.code}>{m.code}</option>
                ))}
              </select>
            </div>
            <input
              required
              value={aiForm.topic}
              onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
              placeholder="Syllabus Topic"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={aiForm.questionType}
                onChange={(e) => setAiForm({ ...aiForm, questionType: e.target.value })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {QUESTION_BANK_TYPES.map((t) => (
                  <option key={t} value={t}>{formatTypeLabel(t)}</option>
                ))}
              </select>
              <select
                value={aiForm.difficulty}
                onChange={(e) =>
                  setAiForm({ ...aiForm, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })
                }
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={5}
                value={aiForm.count}
                onChange={(e) => setAiForm({ ...aiForm, count: Number(e.target.value) })}
                className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769AA] text-white font-semibold"
            >
              <Send size={13} /> Generate AI Drafts
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
              Generated AI Draft Output &amp; Duplicate Check
            </h3>
            {aiResult ? (
              <div className="space-y-3">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Created {aiResult.createdCount} draft(s) — Status locked to DRAFT pending moderation.
                </p>
                {aiResult.similarityWarnings?.length > 0 && (
                  <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1 text-amber-800 dark:text-amber-300">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Similarity / Duplicate Warning
                    </p>
                    {aiResult.similarityWarnings.map((w: any, idx: number) => (
                      <p key={idx}>
                        Draft {w.draftCode} shares {w.similarityPercent}% token overlap with existing item{' '}
                        <strong>{w.existingCode}</strong>.
                      </p>
                    ))}
                  </div>
                )}
                {aiResult.questions.map((q: any) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-1"
                  >
                    <p className="font-mono text-slate-500">
                      {q.code} · {q.status} · {q.marks}m
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">{q.prompt}</p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Key: <span className="font-mono">{q.correctAnswerKey}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">
                Submit topic criteria on the left to generate structured question drafts saved directly into the moderation queue.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW 9: IMMUTABLE VERSION HISTORY
          ================================================================== */}
      {activeView === 'version-history' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Question Version History &amp; Audit Trail
              </h3>
              <p className="text-slate-500">
                Inspect immutable version snapshots, author attribution, moderation comments, and papers referencing each version.
              </p>
            </div>
            <select
              aria-label="Select question for version history"
              value={selectedVersionQuestionId}
              onChange={(e) => setSelectedVersionQuestionId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.code} (v{q.version} · {q.status}) — {q.title || q.prompt.slice(0, 40)}
                </option>
              ))}
            </select>
          </div>

          {versionDetail ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-bold text-[#102D50] dark:text-white">
                    {versionDetail.code} · Current v{versionDetail.currentVersion} ({versionDetail.status})
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {versionDetail.title}
                  </p>
                  <p className="text-slate-500">
                    Original Author: {versionDetail.authorName} · Created:{' '}
                    {new Date(versionDetail.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="font-mono text-slate-600 dark:text-slate-300">
                  Linked Papers: {versionDetail.examPaperIds?.length || 0}
                </p>
              </div>

              <div className="space-y-2.5">
                {versionDetail.versions.map((ver: any) => (
                  <div
                    key={ver.version}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-slate-500">
                      <strong className="text-[#102D50] dark:text-white">
                        Version v{ver.version} · {ver.marks}m
                      </strong>
                      <span>
                        Edited by {ver.editedByName} · {new Date(ver.editedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white">{ver.prompt}</p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Change Note: {ver.changeNote} · Answer Summary:{' '}
                      <span className="font-mono">{ver.correctAnswerSummary}</span>
                    </p>
                    {ver.approvedByName && (
                      <p className="text-emerald-700 dark:text-emerald-400">
                        Approved by {ver.approvedByName}
                        {ver.reviewerComment ? ` — "${ver.reviewerComment}"` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Select a question above to inspect its version history.</p>
          )}
        </div>
      )}

      {/* ==================================================================
          VIEW 10: ASSESSMENT REPORTS
          ================================================================== */}
      {activeView === 'reports' && (
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-slate-500 font-semibold uppercase">Manual Authors</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#102D50] dark:text-white">
                {reports?.manualAuthorCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-slate-500 font-semibold uppercase">AI-Assisted Drafts</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#1769AA] dark:text-blue-400">
                {reports?.aiAssistedDraftCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-slate-500 font-semibold uppercase">Published Papers</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {reports?.summary?.publishedPapers ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-slate-500 font-semibold uppercase">Audit Events</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-white">
                {reports?.auditLogs?.length ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Module Question Bank Readiness Report
              </h3>
              <CheckCircle2 size={15} className="text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4">Module</th>
                    <th className="py-2.5 px-4">Exam Body</th>
                    <th className="py-2.5 px-4 text-right">Total Questions</th>
                    <th className="py-2.5 px-4 text-right">Approved</th>
                    <th className="py-2.5 px-4 text-right">Approved Marks Pool</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(reports?.byModule || []).map((row: any) => (
                    <tr key={row.moduleCode}>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <span className="font-mono">{row.moduleCode}</span> — {row.moduleTitle}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{row.examBody}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.totalQuestions}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {row.approvedQuestions}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {row.totalMarksAvailable}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
