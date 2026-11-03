import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Code2,
  Terminal,
  Award,
  Layers,
  Search,
  BookOpen,
} from "lucide-react";
import confetti from "canvas-confetti";
import { INITIAL_EXAMS, QUESTION_TYPES_63_REGISTRY } from "../../data/mockCollegeData";
import { ExamRecord } from "../../types";

export default function ExaminationPortal() {
  const [activeTab, setActiveTab] = useState<"exams" | "types63" | "cbt_runner" | "rubric">("exams");
  const [exams] = useState<ExamRecord[]>(INITIAL_EXAMS);
  const [searchQuery, setSearchQuery] = useState("");

  // CBT Exam Runner state
  const [examActive, setExamActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes for demo
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(null);

  const sampleQuestions = [
    {
      id: 1,
      type: "Multiple Choice (MCQ)",
      question: "Which data structure implements the Last-In, First-Out (LIFO) operational mechanism?",
      options: ["Queue", "Stack", "Binary Search Tree", "Linked List"],
      correct: "Stack",
    },
    {
      id: 2,
      type: "Online Programming Sandbox (Python)",
      question: "Complete the function that checks if an integer n is prime.",
      initialCode: "def is_prime(n):\n    if n <= 1: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0: return False\n    return True",
      correctKeyword: "return True",
    },
    {
      id: 3,
      type: "Fill-in-the-Blank (Exact match)",
      question: "In the central registration format HCA/STAFF/2026/001, what does the prefix 'HCA' designate?",
      placeholder: "Type exact abbreviation...",
      correct: "HI-TECH College",
    },
  ];

  useEffect(() => {
    let timer: any;
    if (examActive && !examSubmitted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && examActive && !examSubmitted) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [examActive, examSubmitted, timeLeft]);

  const handleStartExam = () => {
    setExamActive(true);
    setExamSubmitted(false);
    setTimeLeft(300);
    setAnswers({});
    setExamScore(null);
    setCurrentQuestionIndex(0);
  };

  const handleSubmitExam = () => {
    setExamSubmitted(true);
    setExamActive(false);

    // Calculate score
    let score = 0;
    if (answers[0] === "Stack") score += 35;
    if (answers[1] && answers[1].includes("return True")) score += 35;
    if (answers[2] && (answers[2].toLowerCase().includes("hi-tech") || answers[2].toLowerCase().includes("institution"))) score += 30;

    setExamScore(score);

    if (score >= 70) {
      try {
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      } catch {}
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-[#092c60] text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck2 size={16} />
            <span>MODULE 23 · EXAMINATION &amp; ASSESSMENT MANAGEMENT PORTAL</span>
          </div>
          <h1 className="text-2xl font-bold">HI-TECH College Examination &amp; CBT Portal</h1>
          <p className="text-blue-100 text-xs mt-1">
            Governing KNEC, TVET CDACC, KASNEB &amp; Internal exams with 63-question assessment engine &amp; proctored CBT.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab("cbt_runner");
            if (!examActive) handleStartExam();
          }}
          className="px-4 py-2 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-bold rounded-xl flex items-center gap-2 shadow"
        >
          <Play size={15} /> Launch Live CBT Exam Runner
        </button>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("exams")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "exams"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar size={16} /> Examination Series &amp; Timetables ({exams.length})
        </button>
        <button
          onClick={() => setActiveTab("types63")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "types63"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers size={16} /> 63 Assessment Question Types Registry
        </button>
        <button
          onClick={() => setActiveTab("cbt_runner")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "cbt_runner"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Code2 size={16} /> Live CBT Exam Test Engine
        </button>
      </div>

      {/* EXAMS TAB */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((ex) => (
              <div key={ex.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {ex.examBody}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {ex.candidatesCount} Candidates
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{ex.courseTitle}</h3>
                  <span className="text-xs font-mono text-blue-700 block mb-3 font-semibold">{ex.courseCode}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Date &amp; Time:</span>
                    <strong className="text-slate-800">{ex.examDate} ({ex.time})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Venue:</span>
                    <strong className="text-slate-800">{ex.room}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration / Marks:</span>
                    <span>{ex.durationMinutes} mins · {ex.totalMarks} Marks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 63 QUESTION TYPES REGISTRY TAB */}
      {activeTab === "types63" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              HI-TECH Assessment Engine: 63 Configurable Question Formats
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supporting objective, practical, programming sandbox, spreadsheet, audio/oral, and essay evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {QUESTION_TYPES_63_REGISTRY.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:bg-blue-50/50 hover:border-blue-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">TYPE #{t.id}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {t.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className={t.autoMarkable ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                    {t.autoMarkable ? "⚡ Auto-Marked" : "✍️ Manual Rubric"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE CBT EXAM RUNNER */}
      {activeTab === "cbt_runner" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {!examActive && !examSubmitted && (
            <div className="text-center py-10 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto">
                <Code2 size={32} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Computer Science CBT Examination</h2>
              <p className="text-xs text-slate-600">
                Assessment: CSC 301 Data Structures &amp; Architectural Coding · 3 Questions · 100 Marks Total
              </p>
              <button
                onClick={handleStartExam}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Begin Assessment (Start Timer)
              </button>
            </div>
          )}

          {examActive && !examSubmitted && (
            <div className="space-y-6">
              {/* TOP CBT BAR */}
              <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Proctored Assessment Session</span>
                  <h3 className="text-sm font-bold">CSC 301 CBT Examination</h3>
                </div>
                <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/50 text-red-300 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
                  <Clock size={16} />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* CURRENT QUESTION */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase">
                    Question {currentQuestionIndex + 1} of {sampleQuestions.length} ({sampleQuestions[currentQuestionIndex].type})
                  </span>
                  <span className="text-xs text-slate-500">Max Score: 35 Marks</span>
                </div>

                <p className="text-sm font-bold text-slate-900">{sampleQuestions[currentQuestionIndex].question}</p>

                {/* Question Type 1: MCQ */}
                {sampleQuestions[currentQuestionIndex].options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {sampleQuestions[currentQuestionIndex].options!.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswers({ ...answers, [currentQuestionIndex]: opt })}
                        className={`p-3 rounded-lg border text-xs font-semibold text-left transition ${
                          answers[currentQuestionIndex] === opt
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Question Type 2: Code Editor */}
                {sampleQuestions[currentQuestionIndex].initialCode && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-slate-500 block">Python 3 Execution Sandbox:</label>
                    <textarea
                      rows={6}
                      value={answers[currentQuestionIndex] || sampleQuestions[currentQuestionIndex].initialCode}
                      onChange={(e) => setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-950 text-emerald-400 p-3 rounded-lg border border-slate-800"
                    />
                  </div>
                )}

                {/* Question Type 3: Fill-in-Blank */}
                {sampleQuestions[currentQuestionIndex].placeholder && (
                  <input
                    type="text"
                    value={answers[currentQuestionIndex] || ""}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })}
                    placeholder={sampleQuestions[currentQuestionIndex].placeholder}
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg bg-white font-medium"
                  />
                )}
              </div>

              {/* CONTROLS */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Previous Question
                </button>

                {currentQuestionIndex < sampleQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
                  >
                    Submit Exam &amp; Auto-Mark
                  </button>
                )}
              </div>
            </div>
          )}

          {examSubmitted && (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Assessment Graded Automatically</h3>
              <div className="p-4 bg-white rounded-xl border border-slate-200 inline-block px-8">
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Automated CBT Score</span>
                <strong className="text-3xl font-black text-blue-900">{examScore}%</strong>
                <span className="text-xs text-emerald-700 block font-bold mt-1">Status: PASSED</span>
              </div>
              <p className="text-xs text-slate-600">
                Score has been provisioned to the moderation queue and linked to your student profile (HCA/STU/2026/001).
              </p>
              <button
                onClick={handleStartExam}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-2 mx-auto"
              >
                <RotateCcw size={14} /> Retake Assessment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
