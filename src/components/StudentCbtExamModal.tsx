import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Download,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { examAssessmentService } from '../services/examAssessmentService';

interface StudentCbtExamModalProps {
  isOpen: boolean;
  studentRegNo: string;
  studentName: string;
  programme: string;
  onClose: () => void;
  onFinished?: (score: number, maxScore: number) => void;
}

interface MockCbtQuestion {
  id: string;
  prompt: string;
  type: 'MCQ' | 'TF' | 'CODE';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

const CBT_QUESTIONS: MockCbtQuestion[] = [
  {
    id: 'cbt-q1',
    prompt: 'Which data structure follows the Last-In First-Out (LIFO) operational principle?',
    type: 'MCQ',
    options: ['Queue', 'Stack', 'Linked List', 'Binary Search Tree'],
    correctAnswer: 'Stack',
    explanation: 'A Stack stores items in LIFO order where insertions and removals occur at the top.',
    points: 20,
  },
  {
    id: 'cbt-q2',
    prompt: 'In SQL database systems, the PRIMARY KEY constraint enforces both UNIQUE and NOT NULL constraints on a column.',
    type: 'TF',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'Primary keys uniquely identify rows and cannot contain null values by relational definition.',
    points: 20,
  },
  {
    id: 'cbt-q3',
    prompt: 'What is the worst-case time complexity of the standard QuickSort algorithm when picking an unbalanced pivot?',
    type: 'MCQ',
    options: ['O(n log n)', 'O(n²)', 'O(log n)', 'O(1)'],
    correctAnswer: 'O(n²)',
    explanation: 'When the partition is consistently unbalanced (e.g., sorted array with last element pivot), QuickSort degrades to O(n²).',
    points: 20,
  },
  {
    id: 'cbt-q4',
    prompt: 'Which HTTP response status code indicates an unauthorized request requiring authentication?',
    type: 'MCQ',
    options: ['200 OK', '401 Unauthorized', '403 Forbidden', '500 Server Error'],
    correctAnswer: '401 Unauthorized',
    explanation: 'HTTP 401 Semantics define that the client request lacks valid authentication credentials for the target resource.',
    points: 20,
  },
  {
    id: 'cbt-q5',
    prompt: 'Which security mechanism protects web applications from unauthorized cross-site data submissions?',
    type: 'MCQ',
    options: ['CSRF Tokens & SameSite Cookies', 'HTML5 Web Storage', 'CSS Grid Layout', 'DNS Pre-fetching'],
    correctAnswer: 'CSRF Tokens & SameSite Cookies',
    explanation: 'Anti-CSRF tokens and SameSite cookie flags prevent state-changing forged requests originating from third-party sites.',
    points: 20,
  },
];

export default function StudentCbtExamModal({
  isOpen,
  studentRegNo,
  studentName,
  programme,
  onClose,
  onFinished,
}: StudentCbtExamModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIdx(0);
      setAnswers({});
      setSecondsRemaining(600);
      setIsSubmitted(false);
      setScore(0);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((sec) => {
        if (sec <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQ = CBT_QUESTIONS[currentIdx];
  const maxPossible = CBT_QUESTIONS.reduce((s, q) => s + q.points, 0);

  const handleSelectOption = (opt: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleSubmitTest = () => {
    let earned = 0;
    CBT_QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        earned += q.points;
      }
    });

    setScore(earned);
    setIsSubmitted(true);

    if (earned >= maxPossible * 0.6) {
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }

    if (onFinished) {
      onFinished(earned, maxPossible);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const percent = Math.round((score / maxPossible) * 100);
  const letterGrade =
    percent >= 80 ? 'A' : percent >= 70 ? 'B' : percent >= 60 ? 'C' : percent >= 50 ? 'D' : 'E';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-6">
        {/* TOP BAR */}
        <div className="bg-[#092c60] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-sm font-bold tracking-tight">HI-TECH CBT ONLINE EXAMINATION RUNNER</h2>
            </div>
            <p className="text-[11px] text-blue-200 mt-0.5 font-mono">
              Candidate: {studentName} ({studentRegNo}) · {programme}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs ${
                  secondsRemaining < 120
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-white/10 text-emerald-300'
                }`}
              >
                <Clock size={14} />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {!isSubmitted ? (
            <>
              {/* PROGRESS BAR & COUNTER */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1.5">
                  <span>
                    Question <strong className="text-slate-900">{currentIdx + 1}</strong> of{' '}
                    <strong>{CBT_QUESTIONS.length}</strong>
                  </span>
                  <span>{Math.round(((currentIdx + 1) / CBT_QUESTIONS.length) * 100)}% Completed</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0866d7] h-full transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / CBT_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* QUESTION CARD */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 rounded bg-blue-100 text-[#092c60] text-[10px] font-bold font-mono">
                    {currentQ.points} MARKS
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    QID: {currentQ.id.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {currentQ.prompt}
                </h3>

                {/* OPTIONS */}
                <div className="space-y-2 pt-2">
                  {currentQ.options?.map((opt, i) => {
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                          isSelected
                            ? 'border-[#092c60] bg-[#092c60] text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              isSelected
                                ? 'bg-amber-400 text-[#092c60]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </span>
                        {isSelected && <CheckCircle2 size={16} className="text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl disabled:opacity-40 hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Previous
                </button>

                <div className="flex items-center gap-2">
                  {currentIdx < CBT_QUESTIONS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((i) => Math.min(CBT_QUESTIONS.length - 1, i + 1))}
                      className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      Next <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitTest}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} /> Finalize &amp; Submit CBT Exam
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* SCORECARD RESULT VIEW */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center font-black text-2xl shadow-sm ${
                    percent >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {letterGrade}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    CBT Examination Completed!
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {percent >= 60
                      ? 'Congratulations, you met the official module proficiency threshold.'
                      : 'You scored below the passing grade. Supplementary examination will be scheduled.'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 max-w-sm mx-auto text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Earned Marks</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {score} / {maxPossible}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Percentage</span>
                    <strong className="text-sm font-bold text-emerald-700 block mt-0.5">
                      {percent}%
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Grade</span>
                    <strong className="text-sm font-bold text-blue-900 block mt-0.5">
                      {letterGrade} ({percent >= 50 ? 'PASS' : 'FAIL'})
                    </strong>
                  </div>
                </div>
              </div>

              {/* BREAKDOWN OF QUESTIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Question Analysis &amp; Correct Answer Key
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                  {CBT_QUESTIONS.map((q, idx) => {
                    const candidateAns = answers[q.id];
                    const isCorrect = candidateAns === q.correctAnswer;
                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-rose-50/60 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {idx + 1}. {q.prompt}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                              isCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                            }`}
                          >
                            {isCorrect ? `+${q.points}` : '0'} / {q.points}
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] space-y-0.5">
                          <p>
                            <span className="text-slate-500">Your Selection:</span>{' '}
                            <strong className={isCorrect ? 'text-emerald-800' : 'text-rose-800'}>
                              {candidateAns || 'Not Answered'}
                            </strong>
                          </p>
                          {!isCorrect && (
                            <p>
                              <span className="text-slate-500">Correct Answer:</span>{' '}
                              <strong className="text-emerald-700">{q.correctAnswer}</strong>
                            </p>
                          )}
                          <p className="text-slate-600 text-[10px] italic mt-1 font-serif">
                            Note: {q.explanation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-2 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#092c60] hover:bg-[#061f46] text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Return to Student Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

