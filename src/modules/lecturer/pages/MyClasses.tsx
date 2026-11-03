import React, { useState } from "react";
import { Users, FileDown, Search, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { lecturerApi } from "../services/lecturerApi";

interface MyClassesProps {
  onViewClassStudents: (assignmentId: string) => void;
}

export default function MyClasses({ onViewClassStudents }: MyClassesProps) {
  const assignments = lecturerApi.getAssignments();

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC COHORTS &amp; GROUPS</span>
          <h1>My Classes &amp; Student Groups</h1>
          <p>Assigned student cohorts for lectures, computer labs, and continuous assessments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded">
                Cohort {assignment.classGroupId}
              </span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                {assignment.enrolledStudentsCount} Enrolled
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{assignment.unitName}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{assignment.unitId} · {assignment.courseName}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Class Attendance Average:</span>
                <span className="font-bold text-emerald-700">89.4%</span>
              </div>
              <div className="flex justify-between">
                <span>Continuous Assessment Average:</span>
                <span className="font-bold text-blue-800">77.2 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Allocated Lab / Room:</span>
                <span className="font-semibold text-slate-800">
                  {assignment.id === "asg-csc301" ? "Computer Lab 3B" : "Cyber Forensics Lab 1A"}
                </span>
              </div>
            </div>

            <button
              onClick={() => onViewClassStudents(assignment.id)}
              className="w-full primary-button justify-center py-2.5"
            >
              <Users size={15} /> View Enrolled Student Register
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
