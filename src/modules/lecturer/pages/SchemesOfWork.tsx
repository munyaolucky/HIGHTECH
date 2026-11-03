import React, { useState } from "react";
import { Plus, FileText, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, X, Send } from "lucide-react";
import { lecturerApi, SchemeOfWorkItem, SchemeWeek } from "../services/lecturerApi";

export default function SchemesOfWork() {
  const [schemes, setSchemes] = useState<SchemeOfWorkItem[]>(lecturerApi.getSchemes());
  const assignments = lecturerApi.getAssignments();
  const [showForm, setShowForm] = useState(false);
  const [expandedScheme, setExpandedScheme] = useState<string | null>(schemes[0]?.id || null);
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    assignmentId: assignments[0]?.id || "",
    unitCode: assignments[0]?.unitId || "CSC 301",
    unitTitle: assignments[0]?.unitName || "Advanced Data Structures & Algorithms",
    title: "CSC 301 Scheme of Work - Semester 1 2026",
    academicYear: "2025/2026",
    semester: "Semester 1",
    weeks: [
      {
        weekNumber: 1,
        topic: "Asymptotic Complexity & Algorithm Analysis",
        subtopic: "Big-O, Omega, Theta, Master Theorem",
        learningOutcome: "Derive asymptotic bounds for divide-and-conquer algorithms",
        activities: "Lecture & problem set walkthrough",
        resources: "CLRS Textbook Ch. 3",
        assessment: "Problem Set 1",
        completed: true,
      },
      {
        weekNumber: 2,
        topic: "Advanced Heaps & Priority Queues",
        subtopic: "Binomial & Fibonacci Heaps",
        learningOutcome: "Implement decrease-key and extract-min routines",
        activities: "Interactive visualization & C++ code walkthrough",
        resources: "Heap Visualizer Tool",
        assessment: "Lab Practical 1",
        completed: true,
      },
    ] as SchemeWeek[],
  });

  const handleAddWeek = () => {
    const nextWeek = form.weeks.length + 1;
    setForm({
      ...form,
      weeks: [
        ...form.weeks,
        {
          weekNumber: nextWeek,
          topic: "",
          subtopic: "",
          learningOutcome: "",
          activities: "",
          resources: "",
          assessment: "",
          completed: false,
        },
      ],
    });
  };

  const handleUpdateWeek = (index: number, field: keyof SchemeWeek, value: any) => {
    setForm({
      ...form,
      weeks: form.weeks.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    });
  };

  const handleSaveScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.weeks.length === 0) return;

    const newScheme = lecturerApi.createScheme({
      assignmentId: form.assignmentId,
      unitCode: form.unitCode,
      unitTitle: form.unitTitle,
      title: form.title.trim(),
      academicYear: form.academicYear,
      semester: form.semester,
      weeks: form.weeks,
    });

    setSchemes([newScheme, ...schemes]);
    setShowForm(false);
    setExpandedScheme(newScheme.id);
    setSuccessMsg("Scheme of Work successfully logged and queued for departmental academic audit.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">TERM-LONG CURRICULUM BLUEPRINT</span>
          <h1>Schemes of Work</h1>
          <p>Comprehensive 14-week institutional semester teaching plan and syllabus tracking.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Create Scheme of Work"}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CREATE SCHEME FORM */}
      {showForm && (
        <section className="form-panel shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-3 mb-4">
            New Scheme of Work Builder
          </h3>

          <form onSubmit={handleSaveScheme} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label>Teaching Unit</label>
                <select
                  value={form.assignmentId}
                  onChange={(e) => {
                    const sel = assignments.find((a) => a.id === e.target.value);
                    setForm({
                      ...form,
                      assignmentId: e.target.value,
                      unitCode: sel ? sel.unitId : "",
                      unitTitle: sel ? sel.unitName : "",
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
                <label>Scheme Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Academic Year &amp; Semester</label>
                <input
                  type="text"
                  value={`${form.academicYear} · ${form.semester}`}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* WEEKS BUILDER */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Weekly Syllabus Breakdown ({form.weeks.length} Weeks)
                </h4>
                <button
                  type="button"
                  onClick={handleAddWeek}
                  className="secondary-button text-xs py-1"
                >
                  <Plus size={13} /> Add Week
                </button>
              </div>

              {form.weeks.map((week, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs text-blue-900">Week {week.weekNumber}</span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={week.completed}
                        onChange={(e) => handleUpdateWeek(idx, "completed", e.target.checked)}
                      />
                      Completed
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label>Main Topic</label>
                      <input
                        type="text"
                        value={week.topic}
                        onChange={(e) => handleUpdateWeek(idx, "topic", e.target.value)}
                        placeholder="e.g. Graph Traversal Algorithms"
                        required
                      />
                    </div>
                    <div>
                      <label>Subtopic</label>
                      <input
                        type="text"
                        value={week.subtopic || ""}
                        onChange={(e) => handleUpdateWeek(idx, "subtopic", e.target.value)}
                        placeholder="e.g. Breadth-First & Depth-First Search"
                      />
                    </div>
                  </div>

                  <div>
                    <label>Intended Learning Outcomes</label>
                    <textarea
                      rows={2}
                      value={week.learningOutcome || ""}
                      onChange={(e) => handleUpdateWeek(idx, "learningOutcome", e.target.value)}
                      placeholder="Student should be able to formulate and code..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label>Activities</label>
                      <input
                        type="text"
                        value={week.activities || ""}
                        onChange={(e) => handleUpdateWeek(idx, "activities", e.target.value)}
                        placeholder="Lab exercise, lecture"
                      />
                    </div>
                    <div>
                      <label>Resources</label>
                      <input
                        type="text"
                        value={week.resources || ""}
                        onChange={(e) => handleUpdateWeek(idx, "resources", e.target.value)}
                        placeholder="Textbook Ch 4, Slides"
                      />
                    </div>
                    <div>
                      <label>Assessment</label>
                      <input
                        type="text"
                        value={week.assessment || ""}
                        onChange={(e) => handleUpdateWeek(idx, "assessment", e.target.value)}
                        placeholder="Quiz 2, Lab check"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions pt-2 border-t">
              <button type="submit" className="primary-button">
                <Send size={14} /> Save Scheme of Work
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

      {/* SCHEMES ACCORDION LIST */}
      <div className="space-y-4">
        {schemes.map((scheme) => {
          const completedCount = scheme.weeks.filter((w: SchemeWeek) => w.completed).length;
          const progressPercent = Math.round((completedCount / (scheme.weeks.length || 1)) * 100);
          const isExpanded = expandedScheme === scheme.id;

          return (
            <div
              key={scheme.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => setExpandedScheme(isExpanded ? null : scheme.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {scheme.unitCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{scheme.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {scheme.academicYear} · {scheme.semester} · {scheme.weeks.length} Weeks Planned
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {scheme.status}
                  </span>

                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Weekly Syllabus Milestone Matrix
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="student-table bg-white rounded-xl shadow-sm">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Topic &amp; Subtopic</th>
                          <th>Intended Learning Outcomes</th>
                          <th>Activities &amp; Resources</th>
                          <th>Assessment</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheme.weeks.map((week: SchemeWeek) => (
                          <tr key={week.weekNumber}>
                            <td className="font-mono font-bold text-blue-900">Week {week.weekNumber}</td>
                            <td>
                              <strong className="block text-slate-900">{week.topic}</strong>
                              {week.subtopic && <small className="text-slate-500">{week.subtopic}</small>}
                            </td>
                            <td className="max-w-xs text-slate-600 text-[11.5px]">{week.learningOutcome}</td>
                            <td className="text-slate-600 text-[11.5px]">
                              <div>{week.activities || "Class Lecture"}</div>
                              <small className="text-slate-400">{week.resources}</small>
                            </td>
                            <td className="font-semibold text-slate-700">{week.assessment || "Formative Review"}</td>
                            <td>
                              {week.completed ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 w-max">
                                  <CheckCircle2 size={11} /> Covered
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold">
                                  Scheduled
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
