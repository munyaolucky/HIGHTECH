import React, { useState } from "react";
import { ArrowLeft, Plus, CheckCircle2, Award, Clock, FileText, Send, X, ShieldCheck } from "lucide-react";
import { lecturerApi } from "../services/lecturerApi";

interface AssessmentDetailsProps {
  assessmentId: string;
  onBack: () => void;
  onNavigateToQuestionBank: () => void;
}

export default function AssessmentDetails({
  assessmentId,
  onBack,
  onNavigateToQuestionBank,
}: AssessmentDetailsProps) {
  const assessment = lecturerApi.getAssessmentById(assessmentId) || lecturerApi.getAssessments()[0];
  const allQuestions = lecturerApi.getQuestions({ unitCode: assessment.unitCode });
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [status, setStatus] = useState(assessment.status);

  const handleToggleSelectQ = (id: string) => {
    setSelectedQIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAttachQuestions = () => {
    if (selectedQIds.length === 0) return;
    lecturerApi.addQuestionsToAssessment(assessment.id, selectedQIds);
    setShowAttachModal(false);
    setSelectedQIds([]);
    setSuccessMsg(`Successfully attached ${selectedQIds.length} questions to ${assessment.unitCode} assessment.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleSubmitForApproval = () => {
    setStatus("PENDING_APPROVAL");
    setSuccessMsg("Assessment examination paper submitted to Head of Department & Exam Office for moderation.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="secondary-button py-1.5 px-3">
            <ArrowLeft size={15} /> Back to Assessments
          </button>
          <div>
            <span className="eyebrow">{assessment.unitCode} · ASSESSMENT WORKSPACE</span>
            <h1>{assessment.title}</h1>
            <p>Assessment Type: <strong>{assessment.assessmentType}</strong> · Created on {assessment.createdAt}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "DRAFT" ? (
            <button onClick={handleSubmitForApproval} className="primary-button">
              <Send size={14} /> Submit for HOD Moderation
            </button>
          ) : (
            <span className="px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-blue-200">
              <ShieldCheck size={14} /> Moderation Status: {status}
            </span>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* OVERVIEW SPECIFICATION TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Total Examination Marks</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{assessment.totalMarks} Marks</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Pass Mark: {assessment.passMark} Marks</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Allowed Time Duration</span>
          <h2 className="text-2xl font-black text-blue-900 mt-1">{assessment.durationMinutes} Mins</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Timed CBT Session</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Questions Attached</span>
          <h2 className="text-2xl font-black text-purple-900 mt-1">{assessment.questionsCount} Questions</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Randomization: {assessment.randomizeQuestions ? "Enabled" : "Disabled"}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Student Submissions</span>
          <h2 className="text-2xl font-black text-emerald-800 mt-1">{assessment.submissionsCount} Received</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Automated Marking Ready</p>
        </div>
      </div>

      {/* ATTACHED QUESTIONS SECTION */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Question Paper Sections</h3>
            <p className="text-xs text-slate-500">Items pulled from the certified institutional question bank.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAttachModal(true)}
              className="primary-button text-xs py-1.5"
            >
              <Plus size={14} /> Attach from Question Bank
            </button>
            <button
              onClick={onNavigateToQuestionBank}
              className="secondary-button text-xs py-1.5"
            >
              Open Question Bank
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {allQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center font-mono text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <strong className="text-slate-900 text-xs">{q.title}</strong>
                  <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    {q.type}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-700">{q.marks} Marks</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                    {q.difficulty}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 pl-7">{q.prompt}</p>

              {q.options && q.options.length > 0 && (
                <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                  {q.options.map((opt: { id: string; text: string }) => (
                    <div key={opt.id} className="p-1.5 bg-white border border-slate-200 rounded">
                      {opt.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ATTACH QUESTIONS MODAL */}
      {showAttachModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Select Questions to Attach</h3>
              <button onClick={() => setShowAttachModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1 text-xs">
              {allQuestions.map((q) => (
                <label
                  key={q.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    selectedQIds.includes(q.id)
                      ? "bg-blue-50 border-blue-600"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedQIds.includes(q.id)}
                    onChange={() => handleToggleSelectQ(q.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <strong className="block text-slate-900">{q.title}</strong>
                    <p className="text-slate-600 mt-0.5 line-clamp-1">{q.prompt}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-500">
                      <span>Type: {q.type}</span>
                      <span>· Marks: {q.marks}</span>
                      <span>· Difficulty: {q.difficulty}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                {selectedQIds.length} Questions Selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAttachQuestions}
                  disabled={selectedQIds.length === 0}
                  className="primary-button"
                >
                  Attach to Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
