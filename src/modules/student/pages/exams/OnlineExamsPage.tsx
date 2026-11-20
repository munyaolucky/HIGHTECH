import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Monitor,
  Play,
  Send,
  ShieldCheck,
} from 'lucide-react';
import StudentCbtExamModal from '../../../../components/StudentCbtExamModal';
import { PortalCard, PortalPageHeader } from '../../../../components/ui/PortalUI';
import { examAssessmentService } from '../../../../services/examAssessmentService';
import { studentPortalService } from '../../../../services/studentPortalService';
import {
  AssessmentDefinition,
  CandidateResponseValue,
  ExamAttempt,
} from '../../../../types/examAssessment';
import {
  buildFallbackCatalog,
  buildInstructionSessionFromCatalog,
  fetchAvailableSecureExams,
  resumeServerSecureExamSession,
  type SecureExamCatalogItem,
} from '../../exams/secure/secureExamData';
import type { ExamSession } from '../../exams/secure/examTypes';
import SecureExamPage from '../../exams/secure/SecureExamPage';
import { ExamWorkspaceProps } from './examWorkspaceUtils';

export default function OnlineExamsPage({
  onNavigate,
  onNotify,
  onRefresh,
  onSwitchPortal,
  onLaunchSecureExam,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;
  const engineState = examAssessmentService.getState();

  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [secureCatalog, setSecureCatalog] = useState<SecureExamCatalogItem[]>(() =>
    buildFallbackCatalog()
  );
  const [serverBackedSecure, setServerBackedSecure] = useState(false);
  const [launchingExamId, setLaunchingExamId] = useState<string | null>(null);
  const [inlineSecureSession, setInlineSecureSession] = useState<ExamSession | null>(null);

  useEffect(() => {
    let active = true;
    void fetchAvailableSecureExams().then(({ items, serverBacked }) => {
      if (!active) return;
      setSecureCatalog(items);
      setServerBackedSecure(serverBacked);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleLaunchSecureExamMode = async (item: SecureExamCatalogItem) => {
    setLaunchingExamId(item.id);
    try {
      const candidate = { name: profile.fullName, regNo };
      let session: ExamSession | null = null;
      if (serverBackedSecure && item.activeSessionId) {
        session = await resumeServerSecureExamSession(item.activeSessionId, candidate);
      }
      if (!session) {
        session = buildInstructionSessionFromCatalog(item, candidate, !serverBackedSecure);
      }
      if (onLaunchSecureExam) {
        onLaunchSecureExam(session);
      } else {
        setInlineSecureSession(session);
      }
    } finally {
      setLaunchingExamId(null);
    }
  };

  const publishedAssessments = engineState.assessments.filter(
    (a) => a.status === 'PUBLISHED' || a.status === 'MARKING' || a.status === 'RELEASED'
  );
  const myAttempts = engineState.attempts.filter(
    (a) => a.studentRegNo.toUpperCase() === regNo.toUpperCase()
  );

  useEffect(() => {
    if (!activeAttempt || activeAttempt.submittedAtIso) return;
    const updateClock = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(activeAttempt.effectiveDeadlineIso).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
    };
    updateClock();
    const id = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(id);
  }, [activeAttempt]);

  if (inlineSecureSession) {
    return (
      <SecureExamPage
        initialSession={inlineSecureSession}
        onExitPortal={() => setInlineSecureSession(null)}
      />
    );
  }

  const formatClock = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartExam = (asm: AssessmentDefinition) => {
    const existingOpen = myAttempts.find(
      (a) => a.assessmentId === asm.id && !a.submittedAtIso
    );
    if (existingOpen) {
      setActiveAttempt(existingOpen);
      onNotify('ok', `Resumed active CBT session: ${asm.title}`);
      return;
    }
    const res = examAssessmentService.startAttempt(asm.id, 0, regNo, profile.fullName);
    if (!res.ok) {
      onNotify('err', res.error);
      return;
    }
    setActiveAttempt(res.attempt);
    onNotify(
      'ok',
      `CBT session started (${asm.durationMinutes} minutes). Script ID: ${res.attempt.anonymousScriptId}`
    );
    onRefresh();
  };

  const handleAnswerChange = (questionId: string, value: CandidateResponseValue) => {
    if (!activeAttempt) return;
    const res = examAssessmentService.saveAttemptAnswer(activeAttempt.id, questionId, value);
    if (!res.ok) {
      onNotify('err', res.error);
      return;
    }
    const updated = examAssessmentService
      .getState()
      .attempts.find((a) => a.id === activeAttempt.id);
    if (updated) {
      setActiveAttempt({ ...updated });
    }
  };

  const handleSubmitAttempt = () => {
    if (!activeAttempt) return;
    const res = examAssessmentService.submitAttempt(activeAttempt.id);
    if (!res.ok) {
      onNotify('err', res.error);
      return;
    }
    const linkedStudentAsm = state.assessments.find(
      (s) => s.cbtAssessmentId === activeAttempt.assessmentId
    );
    if (linkedStudentAsm && linkedStudentAsm.status !== 'Marked') {
      studentPortalService.submitAssessmentWork(
        linkedStudentAsm.id,
        `Submitted CBT script ${res.attempt.anonymousScriptId} (${res.attempt.totalAwarded}/${res.attempt.maxPossibleMarks} auto-scored)`
      );
    }
    setActiveAttempt(null);
    onNotify(
      'ok',
      `CBT script ${res.attempt.anonymousScriptId} submitted. ${
        res.attempt.hasUnmarkedItems
          ? 'Auto-marked items scored; essay/rubric items queued for anonymous marking.'
          : `Score recorded: ${res.attempt.totalAwarded}/${res.attempt.maxPossibleMarks}`
      }`
    );
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Online Exams"
        title="Online Exams (CBT & Secure Exam Mode)"
        description="Launch timed examinations inside HI-TECH College's isolated Secure Examination Environment with fullscreen enforcement, clipboard protection, and server-clock autosave."
      >
        <button
          type="button"
          onClick={() => setPracticeModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Play size={14} /> Quick CBT Practice
        </button>
        {onSwitchPortal && (
          <button
            type="button"
            onClick={() => onSwitchPortal('examination')}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <ExternalLink size={14} /> Full Examination Engine
          </button>
        )}
      </PortalPageHeader>

      {/* Isolated Secure Exam Mode Sessions */}
      <PortalCard
        title={`Secure Exam Mode Sessions (${secureCatalog.length})`}
        description="Starting a secure exam leaves the normal student portal chrome and enables fullscreen, clipboard blocking, shortcut filtering, and focus monitoring."
      >
        <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
          {secureCatalog.map((item) => (
            <div
              key={item.id}
              className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                    {item.unitCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {item.securityLevel === 'LEVEL_2_LOCKED'
                      ? 'Level 2 Locked Mode'
                      : 'Level 1 Web Secure Mode'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                  {item.durationMinutes} mins · {item.questionCount} questions · {item.totalMarks} marks · Attempts {item.attemptsUsed}/{item.maxAttempts}
                  {item.activeSessionId ? ' · Active session ready to resume' : ''}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1">
                  <Lock size={13} className="text-[#1769AA]" aria-hidden="true" />
                  <span>Isolated UI</span>
                </span>
                <button
                  type="button"
                  disabled={!item.windowOpen || launchingExamId === item.id}
                  onClick={() => void handleLaunchSecureExamMode(item)}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#102D50] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>
                    {launchingExamId === item.id
                      ? 'Preparing…'
                      : item.activeSessionId
                      ? 'Resume Secure Exam'
                      : 'Launch Secure Exam Mode'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </PortalCard>

      {activeAttempt && (
        <PortalCard
          title={`Live CBT Session: ${activeAttempt.assessmentTitle}`}
          description={`Script ${activeAttempt.anonymousScriptId} · Autosave active · Synced with Examination Engine`}
          action={
            <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
              <span className="text-amber-700 dark:text-amber-400 font-bold inline-flex items-center gap-1.5">
                <Clock size={14} /> {formatClock(secondsLeft)}
              </span>
              <button
                type="button"
                onClick={handleSubmitAttempt}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Send size={13} /> Submit Script
              </button>
            </div>
          }
        >
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
            {activeAttempt.frozenQuestions.map((q, idx) => {
              const currentVal = activeAttempt.responses[q.questionId];
              return (
                <div key={q.snapshotId} className="py-4 first:pt-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 font-mono">
                    <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                      Question {idx + 1} · {q.code} · {q.kind.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                      {q.marks} marks
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {q.prompt}
                  </p>

                  {(q.kind === 'MCQ_SINGLE' || q.kind === 'TRUE_FALSE_UNCERTAIN') && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt) => {
                        const selected = currentVal === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerChange(q.questionId, opt)}
                            className={`text-left px-3 py-2.5 rounded-lg border font-medium transition-colors ${
                              selected
                                ? 'bg-[#102D50] text-white border-[#102D50]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.kind === 'MCQ_MULTI' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt) => {
                        const arr = Array.isArray(currentVal) ? (currentVal as string[]) : [];
                        const selected = arr.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? arr.filter((x) => x !== opt)
                                : [...arr, opt];
                              handleAnswerChange(q.questionId, next);
                            }}
                            className={`text-left px-3 py-2.5 rounded-lg border font-medium transition-colors ${
                              selected
                                ? 'bg-[#1769AA] text-white border-[#1769AA]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {selected ? '[Selected] ' : ''}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.kind !== 'MCQ_SINGLE' &&
                    q.kind !== 'TRUE_FALSE_UNCERTAIN' &&
                    q.kind !== 'MCQ_MULTI' && (
                      <textarea
                        rows={
                          q.kind === 'CODE_SANDBOX' ||
                          q.kind === 'SQL_SANDBOX' ||
                          q.kind === 'ESSAY_RUBRIC'
                            ? 4
                            : 2
                        }
                        value={typeof currentVal === 'string' ? currentVal : ''}
                        onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                        placeholder={
                          q.starterCode
                            ? `Starter hint: ${q.starterCode}`
                            : 'Type your answer here (autosaves automatically)...'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    )}
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveAttempt(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
              >
                Pause &amp; Save Draft
              </button>
              <button
                type="button"
                onClick={handleSubmitAttempt}
                className="px-5 py-2 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} /> Finalize &amp; Submit Exam
              </button>
            </div>
          </div>
        </PortalCard>
      )}

      {/* Scheduled Online Exams Directory */}
      <PortalCard
        title={`Scheduled Online Exams (${publishedAssessments.length})`}
        description="Published digital papers with anti-cheat question snapshotting and anonymous marking."
      >
        <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
          {publishedAssessments.map((asm) => {
            const attempt = myAttempts.find((a) => a.assessmentId === asm.id);
            const isSubmitted = Boolean(attempt?.submittedAtIso);
            return (
              <div
                key={asm.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                      {asm.unitCode}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{asm.assessmentKind}</span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{asm.examBody}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {asm.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                    Duration {asm.durationMinutes} mins · {asm.totalMarks} marks · Pass mark{' '}
                    {asm.passMarkPercent}%
                    {attempt && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {' '}
                        · Script {attempt.anonymousScriptId} (
                        {isSubmitted
                          ? `${attempt.moderationStatus.replace(/_/g, ' ')} ${attempt.totalAwarded}/${attempt.maxPossibleMarks}`
                          : 'In Progress'}
                        )
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1">
                    <ShieldCheck size={13} className="text-[#1769AA]" />
                    Anonymous ID
                  </span>
                  {isSubmitted ? (
                    <button
                      type="button"
                      onClick={() => onNavigate('exams-results')}
                      className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold whitespace-nowrap"
                    >
                      View Script Status
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartExam(asm)}
                      className="px-4 py-2 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <Monitor size={14} /> {attempt ? 'Resume CBT' : 'Start Online Exam'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PortalCard>

      <PortalCard
        title={`Submitted CBT Attempts (${myAttempts.length})`}
        description="Moderation workflow and official score release tracking."
      >
        {myAttempts.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-300">
            No online exam attempts started yet. Select any published paper above to begin.
          </p>
        ) : (
          <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
            {myAttempts.map((att) => (
              <div
                key={att.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                    {att.unitCode} · Script {att.anonymousScriptId}
                  </span>
                  <strong className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {att.assessmentTitle}
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {att.submittedAtIso
                      ? `Submitted ${new Date(att.submittedAtIso).toLocaleString()}`
                      : 'Active draft in progress'}
                  </span>
                </div>
                <div className="sm:text-right font-mono tabular-nums">
                  <strong className="block text-sm font-semibold text-[#102D50] dark:text-white">
                    {att.moderationStatus === 'RELEASED'
                      ? `${att.totalAwarded} / ${att.maxPossibleMarks}`
                      : `Auto: ${att.totalAwarded}/${att.maxPossibleMarks}`}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {att.moderationStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PortalCard>

      {practiceModalOpen && (
        <StudentCbtExamModal
          isOpen={practiceModalOpen}
          studentRegNo={regNo}
          studentName={profile.fullName}
          programme={profile.programme}
          onClose={() => setPracticeModalOpen(false)}
          onFinished={(score, maxScore) => {
            onNotify('ok', `Completed CBT practice exam with ${score}/${maxScore} marks.`);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
