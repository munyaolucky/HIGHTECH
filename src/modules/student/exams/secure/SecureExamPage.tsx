import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import SecureExamLayout from './SecureExamLayout';
import { useExamSession } from './useExamSession';
import {
  enterExamFullscreen,
  exitExamFullscreen,
  installExamSecurity,
  isUnsupportedMobileOrSmallViewport,
} from './examSecurity';
import type { ExamSecurityEvent, ExamSession } from './examTypes';

interface SecureExamPageProps {
  initialSession: ExamSession;
  onExitPortal?: () => void;
  onStartServerSession?: (examId: string) => Promise<ExamSession | null>;
}

export default function SecureExamPage({
  initialSession,
  onExitPortal,
  onStartServerSession,
}: SecureExamPageProps) {
  const exam = useExamSession(initialSession);
  const policy = exam.session.securityPolicy;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(initialSession.status === 'active');
  const [startingBusy, setStartingBusy] = useState(false);
  const [submittingBusy, setSubmittingBusy] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [securityWarning, setSecurityWarning] = useState('');
  const [identityConfirmed, setIdentityConfirmed] = useState(false);

  const confirmDialogRef = useRef<HTMLButtonElement | null>(null);
  const mobileEnv = useMemo(() => isUnsupportedMobileOrSmallViewport(), []);

  const questions = exam.session.exam.questions;
  const question = questions[currentIndex];

  const answerMap = useMemo(
    () => new Map(exam.answers.map((answer) => [answer.questionId, answer.value])),
    [exam.answers]
  );

  const answeredCount = exam.answers.filter((answer) => {
    if (Array.isArray(answer.value)) return answer.value.length > 0;
    return answer.value.trim().length > 0;
  }).length;

  // Install browser security controls while exam is active
  useEffect(() => {
    if (!started || exam.session.status !== 'active') return;

    const cleanup = installExamSecurity({
      blockCopy: policy?.disableCopy ?? true,
      blockPaste: policy?.disablePaste ?? true,
      blockCut: policy?.disableCut ?? true,
      blockContextMenu: policy?.disableRightClick ?? true,
      blockShortcuts: policy?.blockProhibitedShortcuts ?? true,
      trackTabSwitching: policy?.trackTabSwitching ?? true,
      trackFullscreenExit: policy?.trackFullscreenExit ?? true,
      onEvent: (event: ExamSecurityEvent) => {
        void exam.recordSecurityEvent(event).then((policyMsg) => {
          if (policyMsg) {
            setSecurityWarning(policyMsg);
          } else if (event.type === 'TAB_HIDDEN' || event.type === 'FULLSCREEN_EXIT') {
            setSecurityWarning(
              'Your exam window lost focus or exited fullscreen. Return to fullscreen immediately.'
            );
          }
        });
      },
    });

    return cleanup;
  }, [
    started,
    exam.session.status,
    exam.recordSecurityEvent,
    policy?.disableCopy,
    policy?.disablePaste,
    policy?.disableCut,
    policy?.disableRightClick,
    policy?.blockProhibitedShortcuts,
    policy?.trackTabSwitching,
    policy?.trackFullscreenExit,
  ]);

  // Automatic submission on expiry
  useEffect(() => {
    if (exam.session.status === 'expired' && (policy?.autoSubmitOnExpiry ?? true)) {
      void exam.submitExam().catch(() => {
        setSecurityWarning(
          'Time has expired. Final confirmation could not reach the server. Contact the examination supervisor.'
        );
      });
    }
  }, [exam.session.status, exam.submitExam, policy?.autoSubmitOnExpiry]);

  // Modal Escape-key & focus handling
  useEffect(() => {
    if (!showSubmitDialog) return;
    confirmDialogRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSubmitDialog(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSubmitDialog]);

  async function handleEnterSecureExam() {
    if (!identityConfirmed) {
      setSecurityWarning('Please confirm your candidate identity and examination rules before starting.');
      return;
    }

    setStartingBusy(true);
    setSecurityWarning('');

    try {
      const requireFs = policy?.requireFullscreen ?? true;
      const fsOk = requireFs ? await enterExamFullscreen() : true;

      if (requireFs && !fsOk) {
        setSecurityWarning(
          'Fullscreen could not be activated automatically in this frame. Session started with focus & clipboard monitoring active; click "Re-enter Fullscreen" if supported.'
        );
      }

      if (onStartServerSession) {
        const startedServerSession = await onStartServerSession(exam.session.exam.id);
        if (startedServerSession) {
          exam.activateSession(startedServerSession);
        } else {
          exam.activateSession();
        }
      } else {
        exam.activateSession();
      }
      setStarted(true);
    } finally {
      setStartingBusy(false);
    }
  }

  async function confirmSubmit() {
    setSubmittingBusy(true);
    try {
      await exam.submitExam();
      setShowSubmitDialog(false);
      await exitExamFullscreen();
    } catch {
      setSecurityWarning('Submission failed. Your saved answers remain available for retry.');
    } finally {
      setSubmittingBusy(false);
    }
  }

  // -------------------------------------------------------------------------
  // STAGE 7: SUBMISSION CONFIRMATION / EXPIRED STATE
  // -------------------------------------------------------------------------
  if (exam.session.status === 'submitted' || exam.session.status === 'expired') {
    return (
      <main className="min-h-screen bg-[#F6F8FB] grid place-items-center p-6 text-[#25364A]">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-700 grid place-items-center">
            <CheckCircle2 size={28} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[#102D50]">
            {exam.session.status === 'expired'
              ? 'Examination time expired — answers submitted'
              : 'Examination submitted'}
          </h1>
          <p className="text-sm text-slate-600">
            Your answers for <strong>{exam.session.exam.title}</strong> have been finalized and recorded.
          </p>
          <div className="py-3 px-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
            <div>Session reference: {exam.session.id}</div>
            <div>
              Answered questions: {answeredCount} of {questions.length}
            </div>
            <div>Security events logged: {exam.securityEvents.length}</div>
          </div>
          {onExitPortal && (
            <button
              type="button"
              onClick={() => {
                void exitExamFullscreen();
                onExitPortal();
              }}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Return to Student Portal</span>
            </button>
          )}
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // STAGE 1 & 2: SECURE EXAM INSTRUCTIONS & ELIGIBILITY ENTRY
  // -------------------------------------------------------------------------
  if (!started) {
    return (
      <main className="min-h-screen bg-[#F6F8FB] grid place-items-center p-4 sm:p-6 text-[#25364A]">
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#102D50] text-white font-extrabold text-sm grid place-items-center shrink-0">
                HT
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#102D50]">HI-TECH COLLEGE</strong>
                <span className="block text-xs text-slate-500">Secure Examination Environment</span>
              </div>
            </div>

            {onExitPortal && (
              <button
                type="button"
                onClick={onExitPortal}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                <span>Back to Portal</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-[#1769AA] tracking-wide">
              Exam Instructions &amp; Entry Verification
            </p>
            <h1 className="text-2xl font-bold text-[#102D50]">{exam.session.exam.title}</h1>
            <p className="text-sm text-slate-600">{exam.session.exam.subject}</p>
            {exam.session.candidateName && (
              <p className="text-xs font-mono text-slate-600 pt-1">
                Candidate: {exam.session.candidateName}
                {exam.session.candidateRegNo ? ` · ${exam.session.candidateRegNo}` : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 rounded-xl bg-slate-50/50 text-center py-3.5">
            <div>
              <strong className="block text-xl font-bold text-[#102D50] font-mono tabular-nums">
                {exam.session.exam.durationMinutes}
              </strong>
              <span className="text-xs text-slate-500">Minutes</span>
            </div>
            <div>
              <strong className="block text-xl font-bold text-[#102D50] font-mono tabular-nums">
                {exam.session.exam.questions.length}
              </strong>
              <span className="text-xs text-slate-500">Questions</span>
            </div>
            <div>
              <strong className="block text-xl font-bold text-[#102D50] font-mono tabular-nums">
                {exam.session.exam.totalMarks}
              </strong>
              <span className="text-xs text-slate-500">Total marks</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-[#102D50]">Before you begin</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 leading-relaxed">
              {exam.session.exam.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-[#102D50] space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#1769AA]" aria-hidden="true" />
              <span>
                {policy?.securityLevel === 'LEVEL_2_LOCKED'
                  ? 'Level 2 — Locked Exam Mode (Managed Lab / Safe Exam Browser)'
                  : 'Level 1 — Web Secure Mode'}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Fullscreen enforcement, clipboard copy/cut/paste blocking, prohibited shortcuts blocking,
              focus/tab visibility tracking, autosave, and server-authoritative countdown are active
              during this session.
            </p>
          </div>

          {mobileEnv.restricted && (
            <div
              role="note"
              className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2"
            >
              <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{mobileEnv.reason}</span>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={identityConfirmed}
              onChange={(e) => setIdentityConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#1769AA]"
            />
            <span>
              I confirm my identity as the registered candidate and agree to abide by HI-TECH College
              examination regulations.
            </span>
          </label>

          {securityWarning && (
            <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900" role="alert">
              {securityWarning}
            </p>
          )}

          <button
            type="button"
            disabled={startingBusy}
            onClick={() => void handleEnterSecureExam()}
            className="w-full min-h-[46px] px-5 py-3 rounded-lg bg-[#1769AA] hover:bg-[#102D50] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {startingBusy ? 'Initializing secure session…' : 'Enter secure examination'}
          </button>
        </div>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="min-h-screen grid place-items-center p-6 text-sm text-slate-700">
        <p>No examination questions are available.</p>
      </main>
    );
  }

  const selected = answerMap.get(question.id) ?? '';

  // -------------------------------------------------------------------------
  // STAGES 3–6: ISOLATED ACTIVE EXAMINATION WORKSPACE
  // -------------------------------------------------------------------------
  return (
    <SecureExamLayout
      title={exam.session.exam.title}
      subject={exam.session.exam.subject}
      candidateName={exam.session.candidateName}
      candidateRegNo={exam.session.candidateRegNo}
      durationMinutes={exam.session.exam.durationMinutes}
      remainingSeconds={exam.remainingSeconds}
      saveState={exam.saveState}
      securityLevel={policy?.securityLevel}
      onSubmit={() => setShowSubmitDialog(true)}
    >
      {securityWarning && (
        <div
          className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
            <span>{securityWarning}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void enterExamFullscreen()}
              className="px-3 py-1.5 rounded-lg border border-amber-400 bg-white text-amber-900 font-semibold inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Maximize2 size={12} aria-hidden="true" />
              <span>Re-enter Fullscreen</span>
            </button>
            <button
              type="button"
              onClick={() => setSecurityWarning('')}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 font-semibold whitespace-nowrap"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Progress Strip */}
      <div className="mb-5 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-700">
            <strong className="font-mono tabular-nums text-[#102D50]">{answeredCount}</strong> of{' '}
            <strong className="font-mono tabular-nums text-[#102D50]">{questions.length}</strong> answered
          </span>
          <span className="font-mono tabular-nums text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <progress
          value={answeredCount}
          max={Math.max(1, questions.length)}
          aria-label="Examination answer completion progress"
          className="w-full h-2 rounded-full overflow-hidden accent-[#1769AA] bg-slate-200"
        />
      </div>

      {/* Answer Workspace + Question Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 xl:col-span-9 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1769AA]">
            <span className="font-mono">QUESTION {question.number}</span>
            <span className="font-mono tabular-nums">{question.marks} marks</span>
          </div>

          <h2 className="text-lg font-bold text-[#102D50] leading-relaxed">{question.text}</h2>

          {question.instruction && (
            <p className="text-xs text-slate-600">{question.instruction}</p>
          )}

          {question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE' ? (
            <div className="grid gap-2.5">
              {(question.options ?? []).map((option) => {
                const isChecked = selected === option.id;
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-[#1769AA] bg-blue-50/70 text-[#102D50] font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={isChecked}
                      onChange={() => exam.updateAnswer(question.id, option.id)}
                      className="accent-[#1769AA]"
                    />
                    <span>{option.text}</span>
                  </label>
                );
              })}
            </div>
          ) : question.type === 'MULTIPLE_CHOICE' ? (
            <div className="grid gap-2.5">
              {(question.options ?? []).map((option) => {
                const values = Array.isArray(selected) ? selected : [];
                const isChecked = values.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-[#1769AA] bg-blue-50/70 text-[#102D50] font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...values, option.id]
                          : values.filter((value) => value !== option.id);
                        exam.updateAnswer(question.id, next);
                      }}
                      className="accent-[#1769AA]"
                    />
                    <span>{option.text}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              value={typeof selected === 'string' ? selected : ''}
              onChange={(event) => exam.updateAnswer(question.id, event.target.value)}
              placeholder="Type your answer here..."
              rows={question.type === 'LONG_ANSWER' ? 8 : 4}
              spellCheck={false}
              autoComplete="off"
              className="w-full p-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 select-text focus:outline-none focus:border-[#1769AA] focus:ring-2 focus:ring-[#1769AA]/20"
            />
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-[#102D50] whitespace-nowrap"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-[#102D50] whitespace-nowrap"
            >
              Next question
            </button>
          </div>
        </section>

        {/* Question Navigator Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#102D50]">Question navigator</h2>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((item, index) => {
              const value = answerMap.get(item.id);
              const isAnswered = Array.isArray(value)
                ? value.length > 0
                : Boolean(value?.trim());
              const isCurrent = index === currentIndex;

              return (
                <button
                  type="button"
                  key={item.id}
                  aria-label={`Question ${item.number}${isAnswered ? ', answered' : ', not answered'}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => setCurrentIndex(index)}
                  className={`min-h-[40px] rounded-lg border text-xs font-mono font-bold transition-colors ${
                    isCurrent
                      ? 'border-[#1769AA] ring-2 ring-[#1769AA]/40'
                      : 'border-slate-200'
                  } ${
                    isAnswered
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.number}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-emerald-50 border border-emerald-500 inline-block" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-white border border-slate-300 inline-block" />
              <span>Not answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-white border border-[#1769AA] ring-1 ring-[#1769AA] inline-block" />
              <span>Current</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitDialog(true)}
            className="w-full min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 hover:border-[#1769AA] hover:bg-blue-50/40 text-xs font-semibold text-[#102D50] transition-colors"
          >
            Review and submit
          </button>
        </aside>
      </div>

      {/* Review & Final Submit Confirmation Modal */}
      {showSubmitDialog && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 grid place-items-center p-4"
          role="presentation"
        >
          <section
            className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="secure-submit-title"
          >
            <h2 id="secure-submit-title" className="text-lg font-bold text-[#102D50]">
              Submit examination?
            </h2>
            <p className="text-sm text-slate-600">
              You have answered <strong className="font-mono">{answeredCount}</strong> of{' '}
              <strong className="font-mono">{questions.length}</strong> questions.
            </p>
            {answeredCount < questions.length && (
              <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                Some questions have not been answered yet. You can return to review them before submitting.
              </p>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
              <button
                ref={confirmDialogRef}
                type="button"
                onClick={() => setShowSubmitDialog(false)}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Continue exam
              </button>
              <button
                type="button"
                disabled={submittingBusy}
                onClick={() => void confirmSubmit()}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#1769AA] hover:bg-[#102D50] disabled:opacity-60 text-white font-semibold"
              >
                {submittingBusy ? 'Submitting…' : 'Confirm submission'}
              </button>
            </div>
          </section>
        </div>
      )}
    </SecureExamLayout>
  );
}
