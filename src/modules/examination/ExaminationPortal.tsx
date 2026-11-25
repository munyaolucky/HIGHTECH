import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Code2,
  EyeOff,
  FileCheck2,
  GitBranch,
  Layers,
  Lock,
  MapPin,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_EXAMS } from '../../data/mockCollegeData';
import { QUESTION_TYPES_63_COMPLETE } from '../../data/masterFeatureCatalogue';
import {
  CandidateResponseValue,
  EngineQuestionKind,
  ExamAttempt,
  ExamIncidentRecord,
  ExamRolePersona,
  SupplementaryDecision,
} from '../../types/examAssessment';
import {
  examAssessmentService,
  ROLE_ACTORS,
} from '../../services/examAssessmentService';
import QuestionRunnerWidget from './components/QuestionRunnerWidget';
import { useSyncedPortalTab } from '../../context/PortalShellContext';
import SecureExamSupervisorPanel from './SecureExamSupervisorPanel';
import ExaminationSupervisorDashboard from './ExaminationSupervisorDashboard';
import InvigilatorPortalWorkspace from './InvigilatorPortalWorkspace';
import ModuleDocumentRepository from '../documents/ModuleDocumentRepository';

type ExamTab =
  | 'schedule'
  | 'questions'
  | 'studio'
  | 'runner'
  | 'marking'
  | 'incidents'
  | 'invigilator'
  | 'supervisor-dashboard'
  | 'supervisor'
  | 'exam_files';

export default function ExaminationPortal() {
  const [role, setRole] = useState<ExamRolePersona>('LECTURER_AUTHOR');
  const [activeTab, setActiveTab] = useSyncedPortalTab<ExamTab>('examination', 'questions');
  const [, setVersionTick] = useState(0);
  const refresh = () => setVersionTick((n) => n + 1);

  const state = examAssessmentService.getState();

  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const notify = (type: 'ok' | 'err', text: string) => setBanner({ type, text });

  // --------------------------------------------------------------------------
  // Tab 1: Seating Roster & Exam Permit Form State
  // --------------------------------------------------------------------------
  const [seatForm, setSeatForm] = useState({
    unitCode: 'CSC 301',
    examDate: '2026-03-24',
    timeWindow: '09:00 AM - 12:00 PM',
    venue: 'Examination Centre Room A-1',
    seatNumber: 'A1-R01-S04',
    studentRegNo: 'HCA/STU/2026/025',
    studentName: 'Mercy Nyambura',
    attendancePercent: 90,
    feeClearedPercent: 100,
  });

  // --------------------------------------------------------------------------
  // Tab 2: Question Bank & 63 Formats Registry State
  // --------------------------------------------------------------------------
  const [qSubView, setQSubView] = useState<'bank' | 'catalogue63'>('bank');
  const [qStatusFilter, setQStatusFilter] = useState<'ALL' | 'DRAFT' | 'IN_REVIEW' | 'APPROVED'>('ALL');
  const [qSearch, setQSearch] = useState('');
  const [cat63Filter, setCat63Filter] = useState('ALL');
  const [showNewQForm, setShowNewQForm] = useState(false);
  const [newQ, setNewQ] = useState<{
    code: string;
    unitCode: string;
    topic: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    kind: EngineQuestionKind;
    catalogueTypeId: number;
    marks: number;
    prompt: string;
    optionsRaw: string;
    correctAnswerRaw: string;
    formulaExpr: string;
  }>({
    code: 'CSC301-Q08',
    unitCode: 'CSC 301',
    topic: 'Graph Traversal',
    difficulty: 'MEDIUM',
    kind: 'MCQ_SINGLE',
    catalogueTypeId: 1,
    marks: 10,
    prompt: '',
    optionsRaw: 'Breadth-First Search | Depth-First Search | Kruskal MST | Floyd-Warshall',
    correctAnswerRaw: 'Breadth-First Search',
    formulaExpr: '2 * n + 1',
  });

  // --------------------------------------------------------------------------
  // Tab 3: Assessment Studio State
  // --------------------------------------------------------------------------
  const [newAsm, setNewAsm] = useState({
    code: 'ASM-CSC301-CAT2',
    title: 'CSC 301 Graphs & Recurrence CAT 2',
    unitCode: 'CSC 301',
    assessmentKind: 'CAT' as 'QUIZ' | 'CAT' | 'EXAMINATION' | 'ASSIGNMENT' | 'PRACTICAL' | 'COMPETENCY',
    examBody: 'HI-TECH INTERNAL' as 'HI-TECH INTERNAL' | 'TVET CDACC' | 'KNEC' | 'KASNEB',
    durationMinutes: 30,
    passMarkPercent: 50,
    selectedQuestionIds: ['q-csc-01', 'q-csc-05'] as string[],
    randomPoolUnit: '',
    randomPoolCount: 0,
  });

  // --------------------------------------------------------------------------
  // Tab 4: Live CBT Runner State (Candidate Isolation + Server Deadline)
  // --------------------------------------------------------------------------
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('asm-csc301-cbt');
  const [extraTimePct, setExtraTimePct] = useState<number>(0);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [nowClock, setNowClock] = useState(() => Date.now());
  const [graceMessage, setGraceMessage] = useState<string | null>(null);

  const activeAttempt: ExamAttempt | undefined = state.attempts.find((a) => a.id === activeAttemptId);

  useEffect(() => {
    if (!activeAttempt || activeAttempt.submittedAtIso) return;
    const timer = window.setInterval(() => setNowClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeAttempt]);

  const remainingSeconds = useMemo(() => {
    if (!activeAttempt) return 0;
    const diff = Math.floor((new Date(activeAttempt.effectiveDeadlineIso).getTime() - nowClock) / 1000);
    return Math.max(0, diff);
  }, [activeAttempt, nowClock]);

  // --------------------------------------------------------------------------
  // Tab 5: Anonymous Marking & Item Analysis State
  // --------------------------------------------------------------------------
  const [markingAttemptId, setMarkingAttemptId] = useState<string>('att-anon-4091');
  const [rubricDrafts, setRubricDrafts] = useState<Record<string, Record<string, number>>>({});
  const [markerNotes, setMarkerNotes] = useState<Record<string, string>>({});
  const [analysisAssessmentId, setAnalysisAssessmentId] = useState<string>('asm-csc301-cbt');

  // --------------------------------------------------------------------------
  // Tab 6: Incidents & Supplementary Form State
  // --------------------------------------------------------------------------
  const [incForm, setIncForm] = useState({
    unitCode: 'CSC 301',
    venue: 'Examination Centre Room A-1',
    studentRegNo: '',
    category: 'DEVICE_FAILURE' as ExamIncidentRecord['category'],
    severity: 'MEDIUM' as ExamIncidentRecord['severity'],
    summary: '',
  });
  const [supForm, setSupForm] = useState({
    studentRegNo: 'HCA/STU/2026/018',
    studentName: 'Brian Kiprop',
    unitCode: 'CSC 301',
    originalScore: 34,
    decisionType: 'SUPPLEMENTARY' as SupplementaryDecision['decisionType'],
    reason: '',
    scheduledDate: '2026-05-18',
  });

  // Filtered Question Bank
  const filteredBank = state.questions.filter((q) => {
    const matchesStatus = qStatusFilter === 'ALL' || q.status === qStatusFilter;
    const term = qSearch.toLowerCase();
    const matchesTerm =
      !term ||
      q.code.toLowerCase().includes(term) ||
      q.unitCode.toLowerCase().includes(term) ||
      q.topic.toLowerCase().includes(term) ||
      q.prompt.toLowerCase().includes(term);
    return matchesStatus && matchesTerm;
  });

  const catalogueCategories = ['ALL', ...Array.from(new Set(QUESTION_TYPES_63_COMPLETE.map((c) => c.category)))];
  const filtered63 = QUESTION_TYPES_63_COMPLETE.filter((item) => {
    const matchesCat = cat63Filter === 'ALL' || item.category === cat63Filter;
    const term = qSearch.toLowerCase();
    const matchesTerm =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term);
    return matchesCat && matchesTerm;
  });

  const itemAnalysis = examAssessmentService.computeItemAnalysis(analysisAssessmentId);

  // Handlers
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const options =
      newQ.kind === 'MCQ_SINGLE' || newQ.kind === 'MCQ_MULTI'
        ? newQ.optionsRaw.split('|').map((s) => s.trim()).filter(Boolean)
        : newQ.kind === 'TRUE_FALSE_UNCERTAIN'
        ? ['True', 'False', 'Cannot Determine']
        : undefined;

    const correctOptions =
      newQ.kind === 'MCQ_SINGLE' || newQ.kind === 'TRUE_FALSE_UNCERTAIN'
        ? [newQ.correctAnswerRaw.trim()]
        : newQ.kind === 'MCQ_MULTI'
        ? newQ.correctAnswerRaw.split('|').map((s) => s.trim()).filter(Boolean)
        : undefined;

    const res = examAssessmentService.createDraftQuestion(
      {
        code: newQ.code,
        unitCode: newQ.unitCode,
        topic: newQ.topic,
        difficulty: newQ.difficulty,
        catalogueTypeId: newQ.catalogueTypeId,
        kind: newQ.kind,
        marks: newQ.marks,
        prompt: newQ.prompt,
        options,
        correctOptions,
        correctText:
          newQ.kind === 'FILL_BLANK_EXACT' || newQ.kind === 'FILL_BLANK_FUZZY' || newQ.kind === 'SHORT_ANSWER'
            ? newQ.correctAnswerRaw.trim()
            : undefined,
        formulaVariables: newQ.kind === 'FORMULA_SAFE' ? { n: 5 } : undefined,
        formulaTargetExpression: newQ.kind === 'FORMULA_SAFE' ? newQ.formulaExpr : undefined,
        numericTarget: newQ.kind === 'NUMERIC_TOLERANCE' ? Number(newQ.correctAnswerRaw) || 0 : undefined,
        numericTolerance: newQ.kind === 'NUMERIC_TOLERANCE' ? 2 : undefined,
      },
      role
    );
    if (!res.ok) return notify('err', res.error);
    notify('ok', `Created draft question ${res.question.code} v1. Submit for independent review before publishing.`);
    setNewQ((prev) => ({ ...prev, prompt: '' }));
    setShowNewQForm(false);
    refresh();
  };

  const handleLaunchAttempt = (assessmentId: string) => {
    const res = examAssessmentService.startAttempt(assessmentId, extraTimePct);
    if (!res.ok) return notify('err', res.error);
    setActiveAttemptId(res.attempt.id);
    setCurrentQIdx(0);
    setGraceMessage(null);
    setActiveTab('runner');
    notify('ok', `Frozen snapshot generated for ${res.attempt.anonymousScriptId} (+${extraTimePct}% extra time).`);
    refresh();
  };

  const handleCandidateResponse = (questionId: string, val: CandidateResponseValue, simulateLate = false) => {
    if (!activeAttempt) return;
    const res = examAssessmentService.saveAttemptAnswer(
      activeAttempt.id,
      questionId,
      val,
      simulateLate ? 999999 : 0
    );
    if (!res.ok) {
      setGraceMessage(res.error);
      notify('err', res.error);
    } else {
      setGraceMessage(`Autosaved at ${new Date(res.savedAtIso).toLocaleTimeString()}`);
    }
    refresh();
  };

  const handleSubmitAttempt = () => {
    if (!activeAttempt) return;
    const res = examAssessmentService.submitAttempt(activeAttempt.id);
    if (!res.ok) return notify('err', res.error);
    if (!res.attempt.hasUnmarkedItems && res.attempt.moderationStatus === 'RELEASED') {
      try {
        confetti({ particleCount: 55, spread: 45, origin: { y: 0.6 } });
      } catch {
        // Ignore visual effect issues
      }
    }
    notify(
      'ok',
      `Attempt ${res.attempt.anonymousScriptId} submitted. Objective items auto-scored; awaiting controlled release.`
    );
    refresh();
  };

  const formatMMSS = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const tabs: { id: ExamTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'schedule', label: 'Schedule & Seating', icon: Calendar },
    { id: 'questions', label: 'Question Bank & 63 Formats', icon: Layers },
    { id: 'studio', label: 'Assessment Studio', icon: BookOpen },
    { id: 'runner', label: 'Live CBT Runner', icon: Code2 },
    { id: 'marking', label: 'Anonymous Marking & Analysis', icon: ClipboardCheck },
    { id: 'incidents', label: 'Incidents & Supplementary', icon: ShieldAlert },
    { id: 'exam_files', label: 'Examination Files & Papers', icon: FileCheck2 },
    { id: 'invigilator', label: 'Invigilator Operations', icon: UserCheck },
    { id: 'supervisor-dashboard', label: 'Supervisor Dashboard', icon: Activity },
    { id: 'supervisor', label: 'Secure Exam Supervisor & Config', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* WORKSPACE HEADER WITH ACTIVE PERSONA SWITCHER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              Module 23 · HI-TECH Examination &amp; LMS Assessment Engine
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#092c60]">
              Examinations, Question Governance &amp; CBT Operations
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Governs KNEC, TVET CDACC, KASNEB, and Internal assessments with independent question approval,
              snapshot-frozen CBT delivery, anonymous rubric marking, item analysis, and clash-free venue seating.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div>
              <label htmlFor="exam-role-select" className="block text-[11px] font-medium text-slate-500 mb-1">
                Active Institutional Role
              </label>
              <select
                id="exam-role-select"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as ExamRolePersona);
                  setBanner(null);
                }}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-[#092c60]"
              >
                <option value="LECTURER_AUTHOR">Lecturer / Author (Dr. Peter Otieno)</option>
                <option value="HOD_MODERATOR">HOD / Chief Moderator (Prof. Mary Wangui)</option>
                <option value="EXAM_OFFICER">Exam Officer / Registrar (Dr. Kiprop Chemweno)</option>
                <option value="STUDENT_CANDIDATE">Student Candidate (Amina Wanjiku)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                examAssessmentService.resetDemoState();
                setActiveAttemptId(null);
                notify('ok', 'Assessment engine state reset to institutional baseline.');
                refresh();
              }}
              className="mt-4 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw size={14} /> Reset Baseline
            </button>
          </div>
        </div>

        {/* Clean Unboxed KPI Summary Strip */}
        <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Approved Bank Items</span>
            <strong className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {state.questions.filter((q) => q.status === 'APPROVED').length}
            </strong>
            <span className="text-slate-500 ml-1.5">
              / {state.questions.length} total
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Published Assessments</span>
            <strong className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {state.assessments.filter((a) => a.status === 'PUBLISHED').length}
            </strong>
            <span className="text-slate-500 ml-1.5">live now</span>
          </div>
          <div>
            <span className="text-slate-500 block">Awaiting Anonymous Marking</span>
            <strong className="text-lg font-bold text-amber-700 font-mono tabular-nums">
              {state.attempts.filter((a) => a.hasUnmarkedItems).length}
            </strong>
            <span className="text-slate-500 ml-1.5">scripts</span>
          </div>
          <div>
            <span className="text-slate-500 block">Cleared Exam Seats</span>
            <strong className="text-lg font-bold text-emerald-700 font-mono tabular-nums">
              {state.seatingAllocations.filter((s) => s.permitStatus === 'CLEARED').length}
            </strong>
            <span className="text-slate-500 ml-1.5">
              ({state.seatingAllocations.filter((s) => s.permitStatus !== 'CLEARED').length} held)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Open Incidents</span>
            <strong className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {state.incidents.filter((i) => i.resolutionStatus !== 'RESOLVED').length}
            </strong>
            <span className="text-slate-500 ml-1.5">logged</span>
          </div>
          <div>
            <span className="text-slate-500 block">Catalogue Types</span>
            <strong className="text-lg font-bold text-[#092c60] font-mono tabular-nums">63</strong>
            <span className="text-slate-500 ml-1.5">18 active engine</span>
          </div>
        </div>
      </div>

      {/* GLOBAL FEEDBACK BANNER */}
      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-4 ${
            banner.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SEGMENTED WORKSPACE NAVIGATION */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#092c60] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          TAB 1: SCHEDULE, SEATING ROSTER & PERMIT CLEARANCE (ACA-002)
          ==================================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INITIAL_EXAMS.map((ex) => (
              <div
                key={ex.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {ex.examBody} · {ex.courseCode} · {ex.candidatesCount} Candidates
                  </p>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{ex.courseTitle}</h3>
                </div>
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 tabular-nums">
                  <div className="flex justify-between">
                    <span>Session Date</span>
                    <strong className="text-slate-900 font-mono">
                      {ex.examDate} ({ex.time})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned Hall</span>
                    <strong className="text-slate-900">{ex.room}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration / Total</span>
                    <span className="font-mono">
                      {ex.durationMinutes} min · {ex.totalMarks} marks
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conflict-Checked Seat Allocation Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = examAssessmentService.assignSeatWithClashCheck(seatForm, role);
                if (!res.ok) return notify('err', res.error);
                notify(
                  'ok',
                  `Allocated ${res.seat.seatNumber} to ${res.seat.studentRegNo} (${res.seat.permitStatus}).`
                );
                refresh();
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={16} className="text-[#0875e8]" /> Allocate Candidate Exam Seat
              </h3>
              <p className="text-xs text-slate-500">
                Prevents duplicate seat numbers or overlapping candidate schedules and verifies 75% attendance + 100% fee clearance.
              </p>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Unit Code</label>
                  <input
                    type="text"
                    value={seatForm.unitCode}
                    onChange={(e) => setSeatForm({ ...seatForm, unitCode: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Seat Code</label>
                  <input
                    type="text"
                    value={seatForm.seatNumber}
                    onChange={(e) => setSeatForm({ ...seatForm, seatNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 mb-1">Examination Venue</label>
                  <select
                    value={seatForm.venue}
                    onChange={(e) => setSeatForm({ ...seatForm, venue: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="Examination Centre Room A-1">Examination Centre Room A-1</option>
                    <option value="Main Assembly Hall">Main Assembly Hall</option>
                    <option value="Complex Block B">Complex Block B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Student Reg No</label>
                  <input
                    type="text"
                    value={seatForm.studentRegNo}
                    onChange={(e) => setSeatForm({ ...seatForm, studentRegNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={seatForm.studentName}
                    onChange={(e) => setSeatForm({ ...seatForm, studentName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Attendance %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={seatForm.attendancePercent}
                    onChange={(e) => setSeatForm({ ...seatForm, attendancePercent: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Fee Cleared %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={seatForm.feeClearedPercent}
                    onChange={(e) => setSeatForm({ ...seatForm, feeClearedPercent: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#092c60] hover:bg-[#0d3a7d] text-white text-xs font-semibold rounded-xl transition"
              >
                Validate Clash &amp; Assign Seat
              </button>
            </form>

            {/* Seating Roster Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Examination Hall Seating &amp; Permit Gate</h3>
                  <p className="text-xs text-slate-500">
                    Candidates require CLEARED permit status for hall admission
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-600 tabular-nums">
                  {state.seatingAllocations.length} seats assigned
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Seat</th>
                      <th className="py-2.5 px-4 font-semibold">Candidate</th>
                      <th className="py-2.5 px-4 font-semibold">Session &amp; Venue</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Att / Fee</th>
                      <th className="py-2.5 px-4 font-semibold">Permit Gate</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.seatingAllocations.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-[#092c60] tabular-nums">
                          {s.seatNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{s.studentName}</div>
                          <div className="font-mono text-slate-500">{s.studentRegNo}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div>{s.unitCode} · {s.venue}</div>
                          <div className="text-slate-500 font-mono">{s.examDate} · {s.timeWindow}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {s.attendancePercent}% / {s.feeClearedPercent}%
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              s.permitStatus === 'CLEARED'
                                ? 'text-emerald-700'
                                : 'text-red-700'
                            }`}
                          >
                            {s.permitStatus === 'CLEARED'
                              ? s.checkedIn
                                ? 'Checked In'
                                : 'Cleared'
                              : s.permitStatus === 'BLOCKED_FEE'
                              ? 'Held: Fee < 100%'
                              : 'Held: Att < 75%'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const res = examAssessmentService.toggleSeatCheckIn(s.id, role);
                              if (!res.ok) notify('err', res.error);
                              refresh();
                            }}
                            className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-100"
                          >
                            {s.checkedIn ? 'Undo Check-in' : 'Check In'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: QUESTION BANK GOVERNANCE + COMPLETE 63 FORMATS REGISTRY
          ==================================================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQSubView('bank')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
                  qSubView === 'bank'
                    ? 'bg-[#092c60] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Governed Question Bank ({state.questions.length})
              </button>
              <button
                type="button"
                onClick={() => setQSubView('catalogue63')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
                  qSubView === 'catalogue63'
                    ? 'bg-[#092c60] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                63 Configurable Question Formats ({QUESTION_TYPES_63_COMPLETE.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  placeholder="Search code, unit, topic or format..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-64"
                />
              </div>
              {qSubView === 'bank' && (
                <button
                  type="button"
                  onClick={() => setShowNewQForm((s) => !s)}
                  className="px-3.5 py-1.5 bg-[#0875e8] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus size={14} /> New Question Draft
                </button>
              )}
            </div>
          </div>

          {qSubView === 'bank' && (
            <>
              {/* Author Draft Modal / Panel */}
              {showNewQForm && (
                <form
                  onSubmit={handleCreateQuestion}
                  className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Author New Question Bank Item (Starts as DRAFT · Immutable Once Approved)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewQForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Question Code</label>
                      <input
                        type="text"
                        required
                        value={newQ.code}
                        onChange={(e) => setNewQ({ ...newQ, code: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Unit Code</label>
                      <input
                        type="text"
                        required
                        value={newQ.unitCode}
                        onChange={(e) => setNewQ({ ...newQ, unitCode: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Topic</label>
                      <input
                        type="text"
                        required
                        value={newQ.topic}
                        onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Engine Question Type</label>
                      <select
                        value={newQ.kind}
                        onChange={(e) => setNewQ({ ...newQ, kind: e.target.value as EngineQuestionKind })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="MCQ_SINGLE">Multiple Choice (Single)</option>
                        <option value="MCQ_MULTI">Multiple Response (Partial)</option>
                        <option value="TRUE_FALSE_UNCERTAIN">True / False / Cannot Determine</option>
                        <option value="FILL_BLANK_EXACT">Fill-in-the-Blank (Exact)</option>
                        <option value="FILL_BLANK_FUZZY">Fill-in-the-Blank (Fuzzy)</option>
                        <option value="NUMERIC_TOLERANCE">Numeric (+/- Tolerance)</option>
                        <option value="FORMULA_SAFE">Formula (Safe Evaluator)</option>
                        <option value="SHORT_ANSWER">Short Answer (Human Marked)</option>
                        <option value="ESSAY_RUBRIC">Essay with Rubric</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Marks</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newQ.marks}
                        onChange={(e) => setNewQ({ ...newQ, marks: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="text-xs space-y-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Question Prompt</label>
                      <textarea
                        rows={2}
                        required
                        value={newQ.prompt}
                        onChange={(e) => setNewQ({ ...newQ, prompt: e.target.value })}
                        placeholder="Enter clear academic question text..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    {(newQ.kind === 'MCQ_SINGLE' || newQ.kind === 'MCQ_MULTI') && (
                      <div>
                        <label className="block text-slate-600 mb-1">Options (separated by | )</label>
                        <input
                          type="text"
                          value={newQ.optionsRaw}
                          onChange={(e) => setNewQ({ ...newQ, optionsRaw: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    )}

                    {newQ.kind === 'FORMULA_SAFE' ? (
                      <div>
                        <label className="block text-slate-600 mb-1">Target Safe Expression (tested at n = 5)</label>
                        <input
                          type="text"
                          value={newQ.formulaExpr}
                          onChange={(e) => setNewQ({ ...newQ, formulaExpr: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-600 mb-1">Answer Key / Keywords (stored server-side, never sent to candidates)</label>
                        <input
                          type="text"
                          value={newQ.correctAnswerRaw}
                          onChange={(e) => setNewQ({ ...newQ, correctAnswerRaw: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#092c60] text-white text-xs font-semibold rounded-lg"
                  >
                    Save as DRAFT Question
                  </button>
                </form>
              )}

              {/* Lifecycle Filter */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(['ALL', 'DRAFT', 'IN_REVIEW', 'APPROVED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setQStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                      qStatusFilter === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st} ({st === 'ALL' ? state.questions.length : state.questions.filter((q) => q.status === st).length})
                  </button>
                ))}
              </div>

              {/* Question Cards */}
              <div className="space-y-3">
                {filteredBank.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-[#092c60]">{q.code}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">v{q.version}</span>
                        <span>·</span>
                        <span>{q.unitCode}</span>
                        <span>·</span>
                        <span>{q.kind}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{q.marks} marks</span>
                        <span>·</span>
                        <span
                          className={`font-semibold ${
                            q.status === 'APPROVED'
                              ? 'text-emerald-700'
                              : q.status === 'IN_REVIEW'
                              ? 'text-amber-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{q.prompt}</p>
                      <p className="text-xs text-slate-500">
                        Author: {q.authorName}
                        {q.reviewerName ? ` · Approved by: ${q.reviewerName}` : ''}
                        {q.reviewNote ? ` · Note: ${q.reviewNote}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {q.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = examAssessmentService.submitQuestionForReview(q.id, role);
                            if (!res.ok) notify('err', res.error);
                            else notify('ok', `${q.code} submitted to moderation queue.`);
                            refresh();
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          <Send size={13} /> Submit Review
                        </button>
                      )}

                      {(q.status === 'DRAFT' || q.status === 'IN_REVIEW') && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const res = examAssessmentService.reviewQuestion(
                                q.id,
                                'APPROVE',
                                'Approved after technical & rubric check.',
                                role
                              );
                              if (!res.ok) notify('err', res.error);
                              else notify('ok', `${q.code} v${q.version} is now APPROVED and immutable.`);
                              refresh();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const res = examAssessmentService.reviewQuestion(
                                q.id,
                                'RETURN_DRAFT',
                                'Clarify rubric criteria.',
                                role
                              );
                              if (!res.ok) notify('err', res.error);
                              else notify('ok', `${q.code} returned to DRAFT.`);
                              refresh();
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg"
                          >
                            Return Draft
                          </button>
                        </>
                      )}

                      {q.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = examAssessmentService.createNewQuestionVersion(
                              q.id,
                              `${q.prompt} [Revised v${q.version + 1}]`,
                              q.marks,
                              role
                            );
                            if (!res.ok) notify('err', res.error);
                            else
                              notify(
                                'ok',
                                `Immutable v${q.version} preserved; created editable draft ${res.newQuestion.code} v${res.newQuestion.version}.`
                              );
                            refresh();
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          <GitBranch size={13} /> Branch v{q.version + 1} Draft
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {qSubView === 'catalogue63' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Complete 63 Configurable Assessment Question Formats
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mapped onto HI-TECH&apos;s validated CandidateView + Auto/Rubric Marking Engine.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {catalogueCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCat63Filter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        cat63Filter === cat
                          ? 'bg-[#092c60] text-white border-[#092c60]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered63.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.code} · {item.category} · {item.autoMarkable ? 'Auto-Marked' : 'Human Rubric'}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{item.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                      Engine Rule: <strong className="text-slate-700">{item.gradingMechanism}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: ASSESSMENT STUDIO (FIXED + RANDOM POOLS + SEPARATE PUBLISHER)
          ==================================================================== */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Builder Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = examAssessmentService.createAssessmentDraft(
                {
                  code: newAsm.code,
                  title: newAsm.title,
                  unitCode: newAsm.unitCode,
                  assessmentKind: newAsm.assessmentKind,
                  examBody: newAsm.examBody,
                  durationMinutes: newAsm.durationMinutes,
                  passMarkPercent: newAsm.passMarkPercent,
                  fixedQuestionIds: newAsm.selectedQuestionIds,
                  randomPoolUnit: newAsm.randomPoolUnit || undefined,
                  randomPoolCount: newAsm.randomPoolCount,
                },
                role
              );
              if (!res.ok) return notify('err', res.error);
              notify('ok', `Created assessment draft ${res.assessment.code} (${res.assessment.totalMarks} marks).`);
              refresh();
            }}
            className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">Build Assessment Blueprint</h3>
            <p className="text-xs text-slate-500">
              Combine fixed items and random approved pools. Independent publisher required before candidate launch.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Assessment Code</label>
                <input
                  type="text"
                  required
                  value={newAsm.code}
                  onChange={(e) => setNewAsm({ ...newAsm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAsm.title}
                  onChange={(e) => setNewAsm({ ...newAsm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 mb-1">Kind</label>
                  <select
                    value={newAsm.assessmentKind}
                    onChange={(e) =>
                      setNewAsm({
                        ...newAsm,
                        assessmentKind: e.target.value as typeof newAsm.assessmentKind,
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="QUIZ">Quiz</option>
                    <option value="CAT">CAT</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="COMPETENCY">Competency Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min={5}
                    value={newAsm.durationMinutes}
                    onChange={(e) => setNewAsm({ ...newAsm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Fixed Questions Included</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                  {state.questions.map((q) => {
                    const checked = newAsm.selectedQuestionIds.includes(q.id);
                    return (
                      <label key={q.id} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? newAsm.selectedQuestionIds.filter((id) => id !== q.id)
                              : [...newAsm.selectedQuestionIds, q.id];
                            setNewAsm({ ...newAsm, selectedQuestionIds: next });
                          }}
                        />
                        <span className="font-mono font-semibold text-slate-800">{q.code}</span>
                        <span className="text-slate-500">
                          ({q.status} · {q.marks}m)
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 mb-1">Random Pool Unit (optional)</label>
                  <select
                    value={newAsm.randomPoolUnit}
                    onChange={(e) => setNewAsm({ ...newAsm, randomPoolUnit: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">None</option>
                    <option value="KNEC-2920">KNEC-2920 (3 Approved)</option>
                    <option value="CSC 301">CSC 301 (7 Approved)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Random Draw Count</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newAsm.randomPoolCount}
                    onChange={(e) => setNewAsm({ ...newAsm, randomPoolCount: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#092c60] hover:bg-[#0d3a7d] text-white text-xs font-semibold rounded-xl"
            >
              Create Assessment Draft
            </button>
          </form>

          {/* Assessments List with Publish Gate & Sample Paper Notice */}
          <div className="lg:col-span-2 space-y-4">
            {state.assessments.map((asm) => (
              <div
                key={asm.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">
                      <span className="font-mono font-bold text-[#092c60]">{asm.code}</span>
                      <span> · {asm.examBody} · {asm.assessmentKind} · </span>
                      <span
                        className={`font-semibold ${
                          asm.status === 'PUBLISHED' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {asm.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{asm.title}</h3>
                    {asm.sourceNote && <p className="text-xs text-slate-600">{asm.sourceNote}</p>}
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      Author: {asm.authorName} · {asm.totalMarks} marks · {asm.durationMinutes} min ·{' '}
                      {asm.fixedQuestionIds.length} fixed + {asm.randomPools.reduce((s, p) => s + p.count, 0)} random pool
                      {asm.publisherName ? ` · Published by: ${asm.publisherName}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {asm.status === 'DRAFT' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const res = examAssessmentService.publishAssessment(asm.id, role);
                          if (!res.ok) notify('err', res.error);
                          else notify('ok', `Published ${asm.code} cleanly after checking independent publisher & 100% approved pools.`);
                          refresh();
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                      >
                        <ShieldCheck size={14} /> Verify &amp; Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssessmentId(asm.id);
                          handleLaunchAttempt(asm.id);
                        }}
                        className="px-3.5 py-2 bg-[#0875e8] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                      >
                        <Play size={14} /> Launch Candidate CBT
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: LIVE CBT EXAM RUNNER (SNAPSHOT + TIMER + GRACE + SAFE VIEW)
          ==================================================================== */}
      {activeTab === 'runner' && (
        <div className="space-y-6">
          {/* Launcher Bar */}
          {(!activeAttempt || activeAttempt.submittedAtIso) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Candidate Assessment Launch Console</h2>
                  <p className="text-xs text-slate-600">
                    Freezes immutable question versions, shuffles choices deterministically, strips answer keys via candidateView(), and enforces deadline + 30s grace.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Published Assessment</label>
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    {state.assessments
                      .filter((a) => a.status !== 'DRAFT')
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.title} ({a.totalMarks}m)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Accessibility Extra-Time Accommodation</label>
                  <select
                    value={extraTimePct}
                    onChange={(e) => setExtraTimePct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  >
                    <option value={0}>Standard Timing (+0%)</option>
                    <option value={25}>Approved Extra Time (+25%)</option>
                    <option value={50}>Approved Extra Time (+50%)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchAttempt(selectedAssessmentId)}
                  className="px-5 py-2.5 bg-[#092c60] hover:bg-[#0d3a7d] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <Play size={15} /> Start Timed Candidate Session
                </button>
              </div>
            </div>
          )}

          {/* Post-Submission Screen (Strict Unmarked Pass/Fail Hold) */}
          {activeAttempt && activeAttempt.submittedAtIso && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-mono text-slate-500">
                    Script {activeAttempt.anonymousScriptId} · Submitted {new Date(activeAttempt.submittedAtIso).toLocaleTimeString()}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{activeAttempt.assessmentTitle}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAttemptId(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
                >
                  Close Session
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Auto-Scored Subtotal</span>
                  <strong className="text-2xl font-bold text-[#092c60] font-mono tabular-nums mt-1 block">
                    {activeAttempt.totalAwarded} / {activeAttempt.maxPossibleMarks}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Release Status</span>
                  <strong className="text-sm font-bold text-slate-900 mt-1.5 block">
                    {activeAttempt.moderationStatus}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Pass / Fail Standing</span>
                  <strong className="text-sm font-bold text-slate-900 mt-1.5 block">
                    {activeAttempt.passFailOutcome ?? 'Held Blank (Pending Human Marking / Release)'}
                  </strong>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {activeAttempt.questionMarks.map((qm) => (
                  <div key={qm.questionId} className="px-4 py-3 flex items-center justify-between text-xs bg-white">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{qm.code}</span>
                      <span className="text-slate-500 ml-2">
                        {qm.autoMarked ? 'Auto-marked on submission' : 'Queued for anonymous rubric marker'}
                      </span>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-slate-900">
                      {qm.awardedMarks === null ? `Pending / ${qm.maxMarks}` : `${qm.awardedMarks} / ${qm.maxMarks}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Timed Runner */}
          {activeAttempt && !activeAttempt.submittedAtIso && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              {/* Top Session Header */}
              <div className="bg-[#092c60] text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-blue-200 font-mono">
                    {activeAttempt.anonymousScriptId} · Snapshot Frozen · +{activeAttempt.extraTimePercent}% Extra Time
                  </p>
                  <h3 className="text-base font-bold mt-0.5">{activeAttempt.assessmentTitle}</h3>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-3.5 py-2 rounded-lg bg-slate-900/70 border border-blue-400/30 font-mono text-sm font-bold tabular-nums flex items-center gap-2">
                    <Clock size={15} className="text-amber-300" />
                    <span>{formatMMSS(remainingSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Question Number Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {activeAttempt.frozenQuestions.map((fq, idx) => {
                    const answered = activeAttempt.responses[fq.questionId] !== undefined;
                    return (
                      <button
                        key={fq.questionId}
                        type="button"
                        onClick={() => setCurrentQIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tabular-nums border transition ${
                          idx === currentQIdx
                            ? 'bg-[#0875e8] text-white border-[#0875e8]'
                            : answered
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Q{idx + 1} · {fq.code}
                      </button>
                    );
                  })}
                </div>
                {graceMessage && <span className="text-xs font-mono text-slate-500">{graceMessage}</span>}
              </div>

              {/* Current Question Body */}
              {activeAttempt.frozenQuestions[currentQIdx] && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span className="font-mono font-semibold text-[#092c60]">
                      Question {currentQIdx + 1} of {activeAttempt.frozenQuestions.length} ·{' '}
                      {activeAttempt.frozenQuestions[currentQIdx].code} (v
                      {activeAttempt.frozenQuestions[currentQIdx].version}) ·{' '}
                      {activeAttempt.frozenQuestions[currentQIdx].kind}
                    </span>
                    <span className="font-mono font-bold tabular-nums">
                      {activeAttempt.frozenQuestions[currentQIdx].marks} Marks
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {activeAttempt.frozenQuestions[currentQIdx].prompt}
                  </p>

                  <QuestionRunnerWidget
                    question={activeAttempt.frozenQuestions[currentQIdx]}
                    value={activeAttempt.responses[activeAttempt.frozenQuestions[currentQIdx].questionId]}
                    onChange={(nextVal) =>
                      handleCandidateResponse(activeAttempt.frozenQuestions[currentQIdx].questionId, nextVal)
                    }
                  />
                </div>
              )}

              {/* Bottom Controls + 30s Grace Verification Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentQIdx === 0}
                    onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                    className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentQIdx >= activeAttempt.frozenQuestions.length - 1}
                    onClick={() => setCurrentQIdx((i) => i + 1)}
                    className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleCandidateResponse(
                        activeAttempt.frozenQuestions[currentQIdx].questionId,
                        activeAttempt.responses[activeAttempt.frozenQuestions[currentQIdx].questionId] ?? '',
                        true
                      )
                    }
                    className="px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg"
                  >
                    Test Past-Grace Reject ({activeAttempt.ignoredLateSaveCount} ignored)
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitAttempt}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Submit Final Attempt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 5: ANONYMOUS MARKING QUEUE, CONTROLLED RELEASE & ITEM ANALYSIS
          ==================================================================== */}
      {activeTab === 'marking' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Script Selector Queue */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <EyeOff size={16} className="text-[#092c60]" /> Anonymous Marking Queue
              </h3>
              <p className="text-xs text-slate-500">
                Candidate identities stay masked behind ANON script IDs until Exam Officer release.
              </p>
              <div className="space-y-2">
                {state.attempts
                  .filter((a) => a.submittedAtIso)
                  .map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setMarkingAttemptId(att.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition ${
                        markingAttemptId === att.id
                          ? 'border-[#092c60] bg-slate-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#092c60]">{att.anonymousScriptId}</span>
                        <span className="font-mono tabular-nums font-semibold">
                          {att.totalAwarded}/{att.maxPossibleMarks}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-1 truncate">{att.assessmentTitle}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {att.moderationStatus === 'RELEASED'
                          ? `Released (${att.studentRegNo}) · Outcome: ${att.passFailOutcome}`
                          : att.hasUnmarkedItems
                          ? 'Unmarked items remaining · Outcome blank'
                          : 'All items marked · Ready for Release'}
                      </p>
                    </button>
                  ))}
              </div>
            </div>

            {/* Selected Script Rubric & Controlled Release Workspace */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              {(() => {
                const script = state.attempts.find((a) => a.id === markingAttemptId);
                if (!script || !script.submittedAtIso) {
                  return (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      Select a submitted script from the queue to inspect or score.
                    </p>
                  );
                }

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <p className="text-xs font-mono text-slate-500">
                          {script.moderationStatus === 'RELEASED'
                            ? `${script.anonymousScriptId} · Candidate Revealed: ${script.studentName} (${script.studentRegNo})`
                            : `${script.anonymousScriptId} · Identity Masked (Anonymous Marking Mode)`}
                        </p>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{script.assessmentTitle}</h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono tabular-nums">
                          <span className="text-xs text-slate-500 block">Total Score</span>
                          <strong className="text-lg font-bold text-[#092c60]">
                            {script.totalAwarded} / {script.maxPossibleMarks}
                          </strong>
                        </div>
                        {script.moderationStatus !== 'RELEASED' && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = examAssessmentService.releaseAttemptResults(script.id, role);
                              if (!res.ok) notify('err', res.error);
                              else notify('ok', `Results released cleanly for ${script.anonymousScriptId}.`);
                              refresh();
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                          >
                            <Unlock size={14} /> Controlled Release
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {script.frozenQuestions.map((fq) => {
                        const markRow = script.questionMarks.find((m) => m.questionId === fq.questionId);
                        const resp = script.responses[fq.questionId];
                        const criteria = fq.rubricCriteria ?? [];
                        const draftKey = `${script.id}-${fq.questionId}`;
                        const currentScores =
                          rubricDrafts[draftKey] ?? markRow?.rubricScores ?? {};

                        return (
                          <div key={fq.questionId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-[#092c60]">
                                {fq.code} · {fq.kind}
                              </span>
                              <span className="font-mono font-bold tabular-nums">
                                {markRow?.awardedMarks === null
                                  ? `Awaiting Mark / ${fq.marks}`
                                  : `${markRow?.awardedMarks} / ${fq.marks}`}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-900">{fq.prompt}</p>

                            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono">
                              <span className="text-slate-600 block mb-1">Candidate Response:</span>
                              {typeof resp === 'string' ? (
                                resp || '(No answer submitted)'
                              ) : resp && typeof resp === 'object' && !Array.isArray(resp) && 'fileName' in resp ? (
                                <div className="space-y-1 font-sans">
                                  {(resp as Record<string, string>).fileName ? (
                                    <p className="font-semibold text-slate-900">
                                      Attached File: {(resp as Record<string, string>).fileName}{' '}
                                      <span className="font-mono font-normal text-slate-600">
                                        ({[(resp as Record<string, string>).fileSize, (resp as Record<string, string>).mimeType].filter(Boolean).join(' · ')})
                                      </span>
                                    </p>
                                  ) : (
                                    <p className="text-slate-600">(No file attached)</p>
                                  )}
                                  {(resp as Record<string, string>).notes && (
                                    <p className="text-slate-700 whitespace-pre-wrap">
                                      Notes: {(resp as Record<string, string>).notes}
                                    </p>
                                  )}
                                </div>
                              ) : resp ? (
                                JSON.stringify(resp)
                              ) : (
                                '(No answer submitted)'
                              )}
                            </div>

                            {markRow?.provisionalKeywordHint && (
                              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                                {markRow.provisionalKeywordHint}
                              </p>
                            )}

                            {!fq.autoMarkable && script.moderationStatus !== 'RELEASED' && (
                              <div className="pt-2 border-t border-slate-200 space-y-3">
                                {criteria.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {criteria.map((c) => (
                                      <div key={c.id} className="text-xs">
                                        <label className="block font-medium text-slate-700 mb-1">
                                          {c.label} (0–{c.maxMarks})
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          max={c.maxMarks}
                                          value={currentScores[c.id] ?? 0}
                                          onChange={(e) =>
                                            setRubricDrafts({
                                              ...rubricDrafts,
                                              [draftKey]: {
                                                ...currentScores,
                                                [c.id]: Number(e.target.value),
                                              },
                                            })
                                          }
                                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs max-w-xs">
                                    <label className="block font-medium text-slate-700 mb-1">
                                      Awarded Score (0–{fq.marks})
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={fq.marks}
                                      value={currentScores['direct'] ?? 0}
                                      onChange={(e) =>
                                        setRubricDrafts({
                                          ...rubricDrafts,
                                          [draftKey]: { direct: Number(e.target.value) },
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                                    />
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder="Marker feedback note (optional)..."
                                    value={markerNotes[draftKey] ?? markRow?.markerNote ?? ''}
                                    onChange={(e) =>
                                      setMarkerNotes({ ...markerNotes, [draftKey]: e.target.value })
                                    }
                                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = examAssessmentService.scoreRubricQuestion(
                                        script.id,
                                        fq.questionId,
                                        currentScores,
                                        markerNotes[draftKey] ?? '',
                                        role
                                      );
                                      if (!res.ok) notify('err', res.error);
                                      else notify('ok', `Saved validated rubric marks for ${fq.code}. Totals recalculated.`);
                                      refresh();
                                    }}
                                    className="px-3.5 py-1.5 bg-[#092c60] text-white text-xs font-semibold rounded-lg shrink-0"
                                  >
                                    Save Rubric Score
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Advisory Item Analysis Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#0875e8]" /> Advisory Psychometric Item Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Computes item difficulty (p), upper/lower discrimination (D), KR-20 reliability estimate, and distractor counts. Advisory only — never alters student marks.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <select
                  value={analysisAssessmentId}
                  onChange={(e) => setAnalysisAssessmentId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  {state.assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code}
                    </option>
                  ))}
                </select>
                <span className="font-mono font-bold text-[#092c60] tabular-nums">
                  Reliability (KR-20): {itemAnalysis.reliabilityEstimate ?? 'N/A'}
                </span>
              </div>
            </div>

            {itemAnalysis.items.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No fully marked attempts available yet for this assessment. Complete marking above to compute statistics.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Code</th>
                      <th className="py-2.5 px-3 font-semibold">Format</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Attempts</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Mean Score</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Difficulty (p)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Discrimination (D)</th>
                      <th className="py-2.5 px-3 font-semibold">Option / Distractor Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemAnalysis.items.map((it) => (
                      <tr key={it.questionId}>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#092c60]">{it.code}</td>
                        <td className="py-2.5 px-3 text-slate-600">{it.kind}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{it.attemptsCount}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {it.meanScore} / {it.maxMarks}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{it.difficultyIndex}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{it.discriminationIndex}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">
                          {it.optionCounts
                            ? Object.entries(it.optionCounts)
                                .map(([opt, cnt]) => `${opt}: ${cnt}`)
                                .join(' · ')
                            : 'Open / Expression'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: EXAM INCIDENTS, SUPPLEMENTARY BOARD & AUDIT LOG
          ==================================================================== */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incidents Logger & List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Examination Hall Incident Log</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = examAssessmentService.logExamIncident(incForm, role);
                  if (!res.ok) return notify('err', res.error);
                  setIncForm({ ...incForm, summary: '' });
                  notify('ok', `Incident ${res.incident.id} logged with immutable timestamp.`);
                  refresh();
                }}
                className="space-y-3 text-xs pb-4 border-b border-slate-200"
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={incForm.category}
                    onChange={(e) =>
                      setIncForm({ ...incForm, category: e.target.value as ExamIncidentRecord['category'] })
                    }
                    className="px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="DEVICE_FAILURE">Device / LAN Failure</option>
                    <option value="LATE_ARRIVAL">Late Arrival (&gt;30 min)</option>
                    <option value="MALPRACTICE_SUSPECTED">Suspected Malpractice</option>
                    <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                    <option value="PAPER_ERRATA">Paper Errata Notice</option>
                  </select>
                  <select
                    value={incForm.severity}
                    onChange={(e) =>
                      setIncForm({ ...incForm, severity: e.target.value as ExamIncidentRecord['severity'] })
                    }
                    className="px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="LOW">Severity: Low</option>
                    <option value="MEDIUM">Severity: Medium</option>
                    <option value="HIGH">Severity: High</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Student Reg No (optional e.g. HCA/STU/2026/001)"
                  value={incForm.studentRegNo}
                  onChange={(e) => setIncForm({ ...incForm, studentRegNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <textarea
                  rows={2}
                  required
                  placeholder="Describe invigilator observation and immediate remediation..."
                  value={incForm.summary}
                  onChange={(e) => setIncForm({ ...incForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg"
                >
                  Log Examination Incident
                </button>
              </form>

              <div className="space-y-3">
                {state.incidents.map((inc) => (
                  <div key={inc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-slate-500">
                      <span>
                        {inc.id} · {inc.category} · {inc.severity}
                      </span>
                      <span className={inc.resolutionStatus === 'RESOLVED' ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                        {inc.resolutionStatus}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium">{inc.summary}</p>
                    <p className="text-slate-500">
                      Recorded by {inc.recordedBy} · {inc.venue}
                    </p>
                    {inc.resolutionStatus !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = examAssessmentService.resolveExamIncident(
                            inc.id,
                            'Reviewed by Examination Committee.',
                            role
                          );
                          if (!res.ok) notify('err', res.error);
                          refresh();
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white font-semibold rounded-lg"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Supplementary & Resit Board Decisions (proposer !== approver) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Supplementary &amp; Special Exam Board</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = examAssessmentService.proposeSupplementaryDecision(supForm, role);
                  if (!res.ok) return notify('err', res.error);
                  setSupForm({ ...supForm, reason: '' });
                  notify('ok', 'Supplementary/resit recommendation submitted for independent Board sign-off.');
                  refresh();
                }}
                className="space-y-3 text-xs pb-4 border-b border-slate-200"
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Student Reg No"
                    value={supForm.studentRegNo}
                    onChange={(e) => setSupForm({ ...supForm, studentRegNo: e.target.value })}
                    className="px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <select
                    value={supForm.decisionType}
                    onChange={(e) =>
                      setSupForm({
                        ...supForm,
                        decisionType: e.target.value as SupplementaryDecision['decisionType'],
                      })
                    }
                    className="px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="SUPPLEMENTARY">Supplementary Sitting</option>
                    <option value="SPECIAL_EXAM">Special Exam (Medical/Comp.)</option>
                    <option value="RETAKE">Full Unit Retake</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Academic board justification..."
                  value={supForm.reason}
                  onChange={(e) => setSupForm({ ...supForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0875e8] text-white font-semibold rounded-lg"
                >
                  Propose Board Decision
                </button>
              </form>

              <div className="space-y-3">
                {state.supplementaryDecisions.map((dec) => (
                  <div key={dec.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-[#092c60]">
                        {dec.studentRegNo} · {dec.unitCode} · {dec.decisionType}
                      </span>
                      <span className="font-semibold text-slate-700">{dec.status}</span>
                    </div>
                    <p className="text-slate-800">{dec.reason}</p>
                    <p className="text-slate-500">
                      Proposed by: {dec.proposedByName}
                      {dec.approvedByName ? ` · Decided by: ${dec.approvedByName}` : ''}
                    </p>
                    {dec.status === 'PENDING_BOARD' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const res = examAssessmentService.decideSupplementary(dec.id, 'APPROVED', role);
                            if (!res.ok) notify('err', res.error);
                            refresh();
                          }}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-semibold rounded-lg"
                        >
                          Approve Decision
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = examAssessmentService.decideSupplementary(dec.id, 'REJECTED', role);
                            if (!res.ok) notify('err', res.error);
                            refresh();
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Auditable Exam Operations Ledger */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock size={15} className="text-[#092c60]" /> Recent Examination Audit Trail
            </h3>
            <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs font-mono">
              {state.auditLog.map((ev) => (
                <div key={ev.id} className="py-1.5 border-b border-slate-100 flex flex-wrap gap-2 text-slate-600">
                  <span className="text-slate-400">{new Date(ev.timestampIso).toLocaleTimeString()}</span>
                  <span className="font-bold text-[#092c60]">{ev.action}</span>
                  <span>({ev.actor})</span>
                  <span className="text-slate-800">— {ev.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invigilator' && <InvigilatorPortalWorkspace />}

      {activeTab === 'supervisor-dashboard' && (
        <ExaminationSupervisorDashboard onNotify={notify} />
      )}

      {activeTab === 'supervisor' && (
        <SecureExamSupervisorPanel onNotify={notify} />
      )}

      {activeTab === 'exam_files' && (
        <ModuleDocumentRepository
          moduleKey="EXAMINATION"
          allowedCategories={['EXAM_SCHEDULE', 'ACADEMIC_CLASS_RESOURCE']}
          defaultRecipient="Examinations & Moderation Directorate"
          title="Examination Papers, Marking Schemes & Moderated Scripts"
          description="Restricted Examination Directorate repository for exam question papers, marking schemes, answer keys, and moderation reports."
          securityBanner="Unpublished Exam Paper Isolation Guard: Students are strictly blocked by server RBAC from accessing unpublished EXAM_SCHEDULE files, marking schemes, or answer keys."
        />
      )}
    </div>
  );
}
