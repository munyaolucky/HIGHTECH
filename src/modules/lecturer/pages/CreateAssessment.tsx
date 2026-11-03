import React, { useState } from "react";
import { ArrowLeft, Send, ClipboardCheck, Sparkles, AlertCircle } from "lucide-react";
import { lecturerApi, LecturerAssessmentType } from "../services/lecturerApi";

interface CreateAssessmentProps {
  onBack: () => void;
  onAssessmentCreated: (id: string) => void;
}

export default function CreateAssessment({ onBack, onAssessmentCreated }: CreateAssessmentProps) {
  const assignments = lecturerApi.getAssignments();

  const [form, setForm] = useState({
    assignmentId: assignments[0]?.id || "",
    unitCode: assignments[0]?.unitId || "CSC 301",
    title: "",
    instructions: "Answer all questions. Ensure code compilation passes standard validation flags.",
    assessmentType: "CAT" as LecturerAssessmentType,
    totalMarks: 30,
    passMark: 15,
    durationMinutes: 60,
    availableFrom: "2026-03-15T09:00",
    availableUntil: "2026-03-15T12:00",
    allowLate: false,
    randomizeQuestions: true,
    status: "DRAFT" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const created = lecturerApi.createAssessment({
      assignmentId: form.assignmentId,
      unitCode: form.unitCode,
      title: form.title.trim(),
      instructions: form.instructions.trim(),
      assessmentType: form.assessmentType,
      totalMarks: Number(form.totalMarks),
      passMark: Number(form.passMark),
      durationMinutes: Number(form.durationMinutes),
      availableFrom: form.availableFrom,
      availableUntil: form.availableUntil,
      allowLate: form.allowLate,
      randomizeQuestions: form.randomizeQuestions,
      status: "DRAFT",
    });

    onAssessmentCreated(created.id);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="secondary-button py-1.5 px-3">
            <ArrowLeft size={15} /> Back
          </button>
          <div>
            <span className="eyebrow">CONTINUOUS EVALUATION BUILDER</span>
            <h1>Create New Assessment / Examination</h1>
            <p>Configure Continuous Assessment Tests (CATs), programming lab exams, or assignments.</p>
          </div>
        </div>
      </div>

      <section className="form-panel shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label>Target Teaching Unit</label>
              <select
                value={form.assignmentId}
                onChange={(e) => {
                  const sel = assignments.find((a) => a.id === e.target.value);
                  setForm({
                    ...form,
                    assignmentId: e.target.value,
                    unitCode: sel ? sel.unitId : "",
                  });
                }}
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.unitId}: {a.unitName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Assessment Classification</label>
              <select
                value={form.assessmentType}
                onChange={(e) => setForm({ ...form, assessmentType: e.target.value as LecturerAssessmentType })}
              >
                <option value="CAT">Continuous Assessment Test (CAT)</option>
                <option value="ASSIGNMENT">Take-Home Practical Assignment</option>
                <option value="THEORY_EXAM">Main Theory Examination Paper</option>
                <option value="PRACTICAL_EXAM">Software / Hardware Practical Exam</option>
                <option value="PROGRAMMING">C++ / Python Programming Task</option>
                <option value="NETWORKING_LAB">Packet Tracer &amp; Network Forensics Lab</option>
                <option value="ICDL">ICDL / Computer Applications Exam</option>
              </select>
            </div>

            <div>
              <label>Assessment Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Continuous Assessment Test 2: Graph Theory"
                required
              />
            </div>
          </div>

          <div>
            <label>Student Instructions &amp; Examination Regulations</label>
            <textarea
              rows={3}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Candidate instructions, allowed tools, reference materials, compiler versions..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label>Total Examination Marks</label>
              <input
                type="number"
                min="10"
                max="100"
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label>Pass Mark (Cut-Off)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={form.passMark}
                onChange={(e) => setForm({ ...form, passMark: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label>Duration (Minutes)</label>
              <input
                type="number"
                min="15"
                max="360"
                step="15"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Available From (Date &amp; Time)</label>
              <input
                type="datetime-local"
                value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
              />
            </div>

            <div>
              <label>Available Until (Submission Deadline)</label>
              <input
                type="datetime-local"
                value={form.availableUntil}
                onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.randomizeQuestions}
                onChange={(e) => setForm({ ...form, randomizeQuestions: e.target.checked })}
              />
              Randomize question delivery sequence for each student
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.allowLate}
                onChange={(e) => setForm({ ...form, allowLate: e.target.checked })}
              />
              Permit late submissions with automated late penalty flag
            </label>
          </div>

          <div className="form-actions pt-2 border-t">
            <button type="submit" className="primary-button">
              <Send size={14} /> Save Assessment Draft &amp; Proceed to Questions
            </button>
            <button type="button" onClick={onBack} className="secondary-button">
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
