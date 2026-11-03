import React, { useState } from "react";
import { Users, Search, FileDown, ArrowLeft, Eye, CheckCircle2, ShieldCheck } from "lucide-react";
import { lecturerApi, EnrolledStudentItem } from "../services/lecturerApi";

interface ClassStudentsProps {
  assignmentId: string;
  onBack: () => void;
  onSelectStudent: (studentId: string) => void;
}

export default function ClassStudents({ assignmentId, onBack, onSelectStudent }: ClassStudentsProps) {
  const [search, setSearch] = useState("");
  const students = lecturerApi.getClassStudents(assignmentId, search);
  const assignments = lecturerApi.getAssignments();
  const currentAssignment = assignments.find((a) => a.id === assignmentId) || assignments[0];

  const handleExportCSV = () => {
    const headers = ["Registration Number", "Full Name", "Course", "Study Year", "Attendance %", "CAT Average", "Status"];
    const rows = students.map((s) => [
      s.registrationNumber,
      s.fullName,
      s.courseName,
      s.studyYear,
      `${s.attendancePercentage}%`,
      `${s.catAverage}%`,
      s.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentAssignment.unitId}_Class_Register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="secondary-button py-1.5 px-3">
            <ArrowLeft size={15} /> Back
          </button>
          <div>
            <span className="eyebrow">ENROLLED STUDENTS REGISTER</span>
            <h1>{currentAssignment.unitId}: {currentAssignment.unitName}</h1>
            <p>Class Cohort: {currentAssignment.classGroupId} · {students.length} Students Listed</p>
          </div>
        </div>

        <button onClick={handleExportCSV} className="primary-button">
          <FileDown size={15} /> Export Class List (CSV)
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or Reg No..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Official TVET CDACC / CUE Academic Cohort Register
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="student-table">
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Student Full Name</th>
                <th>Institutional Email</th>
                <th>Attendance %</th>
                <th>CAT Score</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="font-mono font-bold text-blue-900">{student.registrationNumber}</td>
                  <td className="font-semibold text-slate-900">{student.fullName}</td>
                  <td className="text-slate-500 font-mono text-[11px]">{student.email}</td>
                  <td>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        student.attendancePercentage >= 80
                          ? "bg-emerald-100 text-emerald-800"
                          : student.attendancePercentage >= 70
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.attendancePercentage}%
                    </span>
                  </td>
                  <td className="font-bold text-slate-800">{student.catAverage}%</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {student.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => onSelectStudent(student.id)}
                      className="secondary-button text-[11px] py-1 px-2.5 ml-auto"
                    >
                      <Eye size={13} /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
