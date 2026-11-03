import React, { useState } from "react";
import { Plus, ClipboardCheck, Clock, Users, ArrowRight, Award, CheckCircle2 } from "lucide-react";
import { lecturerApi, LecturerAssessmentItem } from "../services/lecturerApi";

interface MyAssessmentsProps {
  onCreateNew: () => void;
  onSelectAssessment: (id: string) => void;
}

export default function MyAssessments({ onCreateNew, onSelectAssessment }: MyAssessmentsProps) {
  const [assessments] = useState<LecturerAssessmentItem[]>(lecturerApi.getAssessments());
  const [filterType, setFilterType] = useState("ALL");

  const filtered = assessments.filter((a) => {
    if (filterType !== "ALL" && a.assessmentType !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTINUOUS EVALUATION &amp; EXAMINATIONS</span>
          <h1>My Assessments &amp; CATs</h1>
          <p>Continuous Assessment Tests (CATs), laboratory practical tasks, assignments, and exams.</p>
        </div>

        <button onClick={onCreateNew} className="primary-button">
          <Plus size={15} /> Create Assessment
        </button>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex items-center gap-2 border-b pb-3 text-xs">
        <span className="font-semibold text-slate-500 mr-2">Filter Category:</span>
        {["ALL", "CAT", "ASSIGNMENT", "PRACTICAL_EXAM", "THEORY_EXAM"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === type ? "bg-[#153b70] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {type.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* ASSESSMENTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-blue-400 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded">
                  {item.unitCode}
                </span>
                <span className="ml-2 font-bold text-xs bg-purple-50 text-purple-800 px-2.5 py-1 rounded border border-purple-200">
                  {item.assessmentType}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  item.status === "PUBLISHED" || item.status === "OPEN"
                    ? "bg-emerald-100 text-emerald-800"
                    : item.status === "APPROVED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.instructions}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs text-center">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Total Marks</span>
                <strong className="text-slate-900 font-bold">{item.totalMarks} Pts</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Duration</span>
                <strong className="text-slate-900 font-bold">{item.durationMinutes} Mins</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Submissions</span>
                <strong className="text-blue-900 font-bold">{item.submissionsCount} Recv</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {item.questionsCount} Questions Attached
              </span>
              <button
                onClick={() => onSelectAssessment(item.id)}
                className="secondary-button text-xs py-1.5"
              >
                View Details &amp; Questions <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
