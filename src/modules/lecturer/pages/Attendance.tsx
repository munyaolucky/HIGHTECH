import React, { useState } from "react";
import { ClipboardCheck, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, Smartphone, Save } from "lucide-react";
import { lecturerApi } from "../services/lecturerApi";

export default function Attendance() {
  const assignments = lecturerApi.getAssignments();
  const [selectedAsgId, setSelectedAsgId] = useState(assignments[0]?.id || "asg-csc301");
  const [date, setDate] = useState("2026-03-02");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [roster, setRoster] = useState([
    { regNo: "HCA/STU/2026/001", name: "Faith Wangari Ndung'u", status: "PRESENT" },
    { regNo: "HCA/STU/2026/002", name: "Brian Kipruto Korir", status: "PRESENT" },
    { regNo: "HCA/STU/2025/110", name: "Samuel Ochieng Odhiambo", status: "LATE" },
    { regNo: "HCA/STU/2025/142", name: "Dennis Mutiso Kyalo", status: "ABSENT" },
    { regNo: "HCA/STU/2026/044", name: "Mercy Chepngetich", status: "PRESENT" },
    { regNo: "HCA/STU/2026/058", name: "Kelvin Mwangi Karanja", status: "EXCUSED" },
  ]);

  const toggleStatus = (regNo: string) => {
    setRoster(
      roster.map((s) => {
        if (s.regNo !== regNo) return s;
        const nextMap: Record<string, string> = {
          PRESENT: "LATE",
          LATE: "ABSENT",
          ABSENT: "EXCUSED",
          EXCUSED: "PRESENT",
        };
        return { ...s, status: nextMap[s.status] || "PRESENT" };
      })
    );
  };

  const markAllPresent = () => {
    setRoster(roster.map((s) => ({ ...s, status: "PRESENT" })));
  };

  const handleSynchronize = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus(`Mobile & Server synchronization successful. 6 records committed with Idempotency Key #HCA-SYNC-${Date.now().toString().slice(-6)}.`);
      setTimeout(() => setSyncStatus(null), 5000);
    }, 800);
  };

  const presentCount = roster.filter((s) => s.status === "PRESENT").length;
  const lateCount = roster.filter((s) => s.status === "LATE").length;
  const absentCount = roster.filter((s) => s.status === "ABSENT").length;
  const excusedCount = roster.filter((s) => s.status === "EXCUSED").length;
  const attendanceRate = Math.round(((presentCount + lateCount * 0.5) / roster.length) * 100);

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">STUDENT ATTENDANCE REGISTER &amp; AUDIT</span>
          <h1>Interactive Class Attendance</h1>
          <p>Real-time roll call, offline draft capture, and mobile batch synchronization.</p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={markAllPresent} className="secondary-button">
            <CheckCircle2 size={15} /> Mark All Present
          </button>
          <button
            type="button"
            onClick={handleSynchronize}
            disabled={isSyncing}
            className="primary-button"
          >
            {isSyncing ? (
              <RefreshCw size={15} className="motion-safe:animate-spin" />
            ) : (
              <Smartphone size={15} />
            )}
            {isSyncing ? "Synchronizing..." : "Synchronize Register"}
          </button>
        </div>
      </div>

      {syncStatus && (
        <div
          role="status"
          className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-2"
        >
          <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-300 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">Attendance Rate</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">{attendanceRate}%</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Present</span>
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 tabular-nums">{presentCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">Late</span>
          <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5 tabular-nums">{lateCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-red-700 dark:text-red-300 font-semibold">Absent</span>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5 tabular-nums">{absentCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Excused</span>
          <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5 tabular-nums">{excusedCount}</h2>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="attendance-assignment-select" className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
            Teaching Assignment:
          </label>
          <select
            id="attendance-assignment-select"
            value={selectedAsgId}
            onChange={(e) => setSelectedAsgId(e.target.value)}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.unitId}: {a.unitName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="attendance-session-date" className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
            Session Date:
          </label>
          <input
            id="attendance-session-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold tabular-nums"
          />
        </div>
      </div>

      {/* ROSTER TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="student-table">
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Student Full Name</th>
                <th>Attendance Status</th>
                <th className="text-right">Click to Cycle Status</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.regNo}>
                  <td className="font-mono font-bold text-blue-900 dark:text-blue-300">{s.regNo}</td>
                  <td className="font-semibold text-slate-900 dark:text-white">{s.name}</td>
                  <td>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        s.status === "PRESENT"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : s.status === "LATE"
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                          : s.status === "ABSENT"
                          ? "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300"
                          : "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.regNo)}
                      className="secondary-button text-[11px] py-1 px-3 ml-auto"
                    >
                      Cycle Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
