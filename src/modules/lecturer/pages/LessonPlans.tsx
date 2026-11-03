import React, { useState } from "react";
import { Plus, FileText, CalendarDays, Clock, CheckCircle2, Send, X, BookOpen } from "lucide-react";
import { lecturerApi, LessonPlanItem } from "../services/lecturerApi";

export default function LessonPlans() {
  const [lessons, setLessons] = useState<LessonPlanItem[]>(lecturerApi.getLessonPlans());
  const [assignments] = useState(lecturerApi.getAssignments());
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    assignmentId: assignments[0]?.id || "",
    unitCode: assignments[0]?.unitId || "CSC 301",
    unitTitle: assignments[0]?.unitName || "Advanced Data Structures & Algorithms",
    lessonDate: "2026-03-09",
    durationMinutes: 180,
    topic: "",
    subtopic: "",
    objectives: "",
    teachingMethods: "Interactive whiteboard lecture, live debugger demonstration, algorithmic tracing.",
    activities: "Whiteboard derivations, paired coding exercises in Lab 3B.",
    resources: "Course Lecture Notes, Online Tree Visualizer, Lab Worksheet.",
    assessmentMethods: "Formative coding quiz and peer-reviewed complexity proofs.",
    remarks: "",
  });

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asgId = e.target.value;
    const selected = assignments.find((a) => a.id === asgId);
    setForm({
      ...form,
      assignmentId: asgId,
      unitCode: selected ? selected.unitId : "",
      unitTitle: selected ? selected.unitName : "",
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.objectives.trim()) return;

    const newLesson = lecturerApi.createLessonPlan({
      assignmentId: form.assignmentId,
      unitCode: form.unitCode,
      unitTitle: form.unitTitle,
      lessonDate: form.lessonDate,
      durationMinutes: Number(form.durationMinutes),
      topic: form.topic.trim(),
      subtopic: form.subtopic.trim(),
      objectives: form.objectives.trim(),
      teachingMethods: form.teachingMethods.trim(),
      activities: form.activities.trim(),
      resources: form.resources.trim(),
      assessmentMethods: form.assessmentMethods.trim(),
      remarks: form.remarks.trim(),
    });

    setLessons([newLesson, ...lessons]);
    setShowForm(false);
    setForm({
      ...form,
      topic: "",
      subtopic: "",
      objectives: "",
      remarks: "",
    });
    setSuccessMsg("Lesson plan successfully submitted to Departmental Head for curriculum approval.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CURRICULUM DELIVERY &amp; PLANNING</span>
          <h1>Lesson Plans</h1>
          <p>Prepare, submit, and track competency-based weekly lesson plans aligned to TVET CDACC &amp; CUE standards.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Close Form" : "Create Lesson Plan"}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CREATE LESSON PLAN FORM */}
      {showForm && (
        <section className="form-panel shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-blue-700" /> New Lesson Plan Submission
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label>Teaching Assignment</label>
                <select
                  value={form.assignmentId}
                  onChange={handleAssignmentChange}
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.unitId}: {a.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Lesson Date</label>
                <input
                  type="date"
                  value={form.lessonDate}
                  onChange={(e) => setForm({ ...form, lessonDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  min="30"
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
                <label>Lesson Topic</label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g. Balanced Binary Search Trees & AVL Rotations"
                  required
                />
              </div>

              <div>
                <label>Subtopic / Specific Key Focus</label>
                <input
                  type="text"
                  value={form.subtopic}
                  onChange={(e) => setForm({ ...form, subtopic: e.target.value })}
                  placeholder="e.g. Left/Right Double Rotations & Balance Factor Calculations"
                />
              </div>
            </div>

            <div>
              <label>Specific Learning Objectives</label>
              <textarea
                rows={2}
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                placeholder="State measurable learner outcomes: By end of lesson, student will be able to..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label>Teaching Methods</label>
                <textarea
                  rows={2}
                  value={form.teachingMethods}
                  onChange={(e) => setForm({ ...form, teachingMethods: e.target.value })}
                />
              </div>

              <div>
                <label>Learning Activities</label>
                <textarea
                  rows={2}
                  value={form.activities}
                  onChange={(e) => setForm({ ...form, activities: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label>Teaching Resources &amp; Equipment</label>
                <textarea
                  rows={2}
                  value={form.resources}
                  onChange={(e) => setForm({ ...form, resources: e.target.value })}
                />
              </div>

              <div>
                <label>Assessment &amp; Evaluation Methods</label>
                <textarea
                  rows={2}
                  value={form.assessmentMethods}
                  onChange={(e) => setForm({ ...form, assessmentMethods: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label>Lecturer Remarks &amp; Reflections (Optional)</label>
              <textarea
                rows={2}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Initial setup notes, prerequisite check warnings, or lab constraints..."
              />
            </div>

            <div className="form-actions pt-2 border-t">
              <button type="submit" className="primary-button">
                <Send size={14} /> Submit Lesson Plan for HOD Review
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="secondary-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LESSON PLANS LIST */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Approved &amp; Submitted Lesson Plans</h3>

        <div className="space-y-3">
          {lessons.map((lesson) => (
            <article
              key={lesson.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                    {lesson.unitCode}
                  </span>
                  <strong className="text-slate-900 text-sm">{lesson.topic}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      lesson.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : lesson.status === "SUBMITTED"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {lesson.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays size={13} />
                    <span>{lesson.lessonDate}</span>
                    <span>· {lesson.durationMinutes} mins</span>
                  </div>
                </div>
              </div>

              {lesson.subtopic && (
                <p className="text-xs font-semibold text-slate-700">Subtopic: {lesson.subtopic}</p>
              )}

              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong className="text-slate-800">Learning Objectives:</strong> {lesson.objectives}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-slate-500">
                <div>
                  <strong>Methods:</strong> {lesson.teachingMethods || "Lecture & Lab"}
                </div>
                <div>
                  <strong>Resources:</strong> {lesson.resources || "Standard Lab"}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
