import React from "react";
import { BookOpen, Users, Calendar, MapPin, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { lecturerApi } from "../services/lecturerApi";

interface MyCoursesProps {
  onSelectAssignment: (assignmentId: string, action: string) => void;
}

export default function MyCourses({ onSelectAssignment }: MyCoursesProps) {
  const assignments = lecturerApi.getAssignments();

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">APPROVED TEACHING ASSIGNMENTS</span>
          <h1>My Courses &amp; Units</h1>
          <p>Institutional teaching assignments approved by the Academic Dean and Department Head.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-blue-400 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded">
                  {assignment.unitId}
                </span>
                <span className="ml-2 font-mono text-xs text-slate-500 font-semibold">
                  {assignment.classGroupId}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={12} /> Active Assignment
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{assignment.unitName}</h3>
              <p className="text-xs text-slate-500 mt-1">{assignment.courseName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>{assignment.academicYear} · {assignment.semester}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={14} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800">{assignment.enrolledStudentsCount} Students Enrolled</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 col-span-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span>{assignment.campusName}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectAssignment(assignment.id, "students")}
                className="secondary-button"
              >
                <Users size={14} /> View Students
              </button>
              <button
                onClick={() => onSelectAssignment(assignment.id, "lessons")}
                className="secondary-button"
              >
                <FileText size={14} /> Lesson Plans
              </button>
              <button
                onClick={() => onSelectAssignment(assignment.id, "attendance")}
                className="primary-button"
              >
                Take Attendance
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
