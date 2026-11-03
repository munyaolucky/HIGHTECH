import React, { useState } from "react";
import { ArrowLeft, User, Award, CheckCircle2, AlertTriangle, Calendar, BookOpen, Send } from "lucide-react";
import { lecturerApi, EnrolledStudentItem } from "../services/lecturerApi";

interface StudentAcademicProfileProps {
  studentId: string;
  onBack: () => void;
}

export default function StudentAcademicProfile({ studentId, onBack }: StudentAcademicProfileProps) {
  const student = lecturerApi.getStudentProfile(studentId) || {
    id: "stu-001",
    studentId: "stu-001",
    registrationNumber: "HCA/STU/2026/001",
    fullName: "Faith Wangari Ndung'u",
    email: "f.wangari@student.hitech.ac.ke",
    phone: "+254 711 223 344",
    courseName: "BSc Computer Science",
    studyYear: "Year 3 Sem 1",
    attendancePercentage: 96,
    catAverage: 88,
    status: "APPROVED" as const,
  };

  const [notes, setNotes] = useState([
    {
      id: "note-1",
      date: "2026-02-20",
      author: "Dr. Peter Otieno",
      text: "Demonstrated exceptional problem solving in AVL Tree rebalancing proofs. Recommended for ICPC college algorithmic programming team.",
    },
    {
      id: "note-2",
      date: "2026-01-25",
      author: "Prof. Grace Wanjiku (HOD)",
      text: "All prerequisite units (CSC 201 & CSC 202) cleared with Grade A.",
    },
  ]);

  const [newNote, setNewNote] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([
      {
        id: "note-" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        author: "Dr. Peter Otieno (Lecturer)",
        text: newNote.trim(),
      },
      ...notes,
    ]);
    setNewNote("");
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="secondary-button py-1.5 px-3">
            <ArrowLeft size={15} /> Back to Register
          </button>
          <div>
            <span className="eyebrow">ACADEMIC PROFILE &amp; RECORD</span>
            <h1>{student.fullName}</h1>
            <p>Registration No: <strong className="font-mono text-blue-900">{student.registrationNumber}</strong> · {student.courseName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {student.attendancePercentage >= 75 ? (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Exam Eligible (≥ 75%)
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <AlertTriangle size={14} /> Attendance Deficit (&lt; 75%)
            </span>
          )}
        </div>
      </div>

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Attendance Rate</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{student.attendancePercentage}%</h2>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">24 of 25 Sessions Present</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Continuous Assessment</span>
          <h2 className="text-2xl font-black text-blue-900 mt-1">{student.catAverage}%</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Grade: A (Distinction)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Enrolment Standing</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">{student.status}</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Tuition Fees Cleared</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Study Cohort</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">{student.studyYear}</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Class Group CS-3A</p>
        </div>
      </div>

      {/* BREAKDOWN SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RECENT ASSESSMENTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
            <Award size={16} className="text-blue-700" /> Unit Continuous Assessments
          </h3>

          <div className="space-y-3">
            {[
              { title: "CAT 1 (Balanced BSTs & Heaps)", score: "28 / 30", grade: "A", date: "2026-02-15" },
              { title: "Practical Lab 1 (AVL Tree Verification)", score: "19 / 20", grade: "A", date: "2026-02-22" },
              { title: "Assignment 1 (Dijkstra Proofs)", score: "18 / 20", grade: "A-", date: "2026-02-28" },
            ].map((a, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900 block">{a.title}</strong>
                  <span className="text-slate-500">{a.date}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-900 text-sm">{a.score}</span>
                  <span className="ml-2 font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">{a.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LECTURER ADVISORY NOTES */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-purple-700" /> Lecturer Advisory Remarks
          </h3>

          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Record academic advisory observation or mentorship note..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
            <button type="submit" className="primary-button text-xs py-1.5">
              <Send size={13} /> Save Advisory Note
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {notes.map((n) => (
              <div key={n.id} className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span className="font-semibold text-blue-900">{n.author}</span>
                  <span>{n.date}</span>
                </div>
                <p className="text-slate-800">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
