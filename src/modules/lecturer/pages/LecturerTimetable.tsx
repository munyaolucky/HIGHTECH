import React, { useState } from "react";
import { Calendar, Clock, MapPin, Building, ArrowRight, Plus, CheckCircle2 } from "lucide-react";
import { lecturerApi, TimetableEntry } from "../services/lecturerApi";

interface LecturerTimetableProps {
  onRequestChange: () => void;
}

export default function LecturerTimetable({ onRequestChange }: LecturerTimetableProps) {
  const timetable = lecturerApi.getTimetable();
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">TEACHING SCHEDULE &amp; VENUES</span>
          <h1>Weekly Teaching Timetable</h1>
          <p>Institutional schedule of lectures, practical computing sessions, and student tutorials.</p>
        </div>

        <button onClick={onRequestChange} className="primary-button">
          <Calendar size={15} /> Request Timetable Adjustment
        </button>
      </div>

      {/* TIMETABLE TOOLBAR */}
      <div className="timetable-toolbar">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-800">Academic Term:</span>
          <span className="bg-blue-50 text-blue-900 font-semibold px-2.5 py-1 rounded-lg border border-blue-200">
            Semester 1 (2025/2026)
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">Total Contact Hours: <strong>10.5 Hours / Week</strong></span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Lab Practical
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Lecture
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Tutorial
          </span>
        </div>
      </div>

      {/* 5-DAY TIMETABLE GRID */}
      <div className="timetable-grid">
        {days.map((day) => {
          const sessions = timetable.filter((t) => t.dayOfWeek === day);

          return (
            <div key={day} className="timetable-day">
              <header>
                <span>{day}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
                </span>
              </header>

              {sessions.length === 0 ? (
                <div className="empty-day text-center py-10">
                  <p>No allocated teaching slots.</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="timetable-event space-y-2 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded text-[10px] border border-blue-200">
                        {session.unitCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          session.sessionType === "Lab Practical"
                            ? "bg-blue-100 text-blue-800"
                            : session.sessionType === "Lecture"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {session.sessionType}
                      </span>
                    </div>

                    <strong className="block text-slate-900 text-xs leading-snug">
                      {session.unitTitle}
                    </strong>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <p className="flex items-center gap-1 m-0">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </p>
                      <p className="flex items-center gap-1 m-0">
                        <Building size={12} className="text-slate-400 shrink-0" />
                        <span>{session.roomName} ({session.roomCode})</span>
                      </p>
                      <p className="text-[10.5px] text-slate-500 m-0">
                        Class: {session.classGroupId} · {session.building}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
