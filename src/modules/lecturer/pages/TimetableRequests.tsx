import React, { useState } from "react";
import { ArrowLeft, Calendar, Send, CheckCircle2, Clock, X } from "lucide-react";
import { lecturerApi, TimetableChangeRequestItem } from "../services/lecturerApi";

interface TimetableRequestsProps {
  onBack: () => void;
}

export default function TimetableRequests({ onBack }: TimetableRequestsProps) {
  const [requests, setRequests] = useState<TimetableChangeRequestItem[]>(lecturerApi.getTimetableRequests());
  const assignments = lecturerApi.getAssignments();
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    assignmentId: assignments[0]?.id || "",
    unitCode: assignments[0]?.unitId || "CSC 301",
    currentDate: "2026-03-09",
    requestedDate: "2026-03-10",
    currentStart: "08:00 AM",
    requestedStart: "02:00 PM",
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) return;

    const newReq = lecturerApi.createTimetableRequest({
      assignmentId: form.assignmentId,
      unitCode: form.unitCode,
      currentDate: form.currentDate,
      requestedDate: form.requestedDate,
      currentStart: form.currentStart,
      requestedStart: form.requestedStart,
      reason: form.reason.trim(),
    });

    setRequests([newReq, ...requests]);
    setForm({
      ...form,
      reason: "",
    });
    setSuccessMsg("Timetable adjustment request submitted to Academic Registrar & Timetable Committee.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="secondary-button py-1.5 px-3">
            <ArrowLeft size={15} /> Back to Timetable
          </button>
          <div>
            <span className="eyebrow">ACADEMIC TIMETABLE COMMITTEE</span>
            <h1>Timetable Adjustment Requests</h1>
            <p>Request venue or timeslot adjustments due to laboratory maintenance, exams, or makeup classes.</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* REQUEST SUBMISSION FORM */}
      <section className="form-panel shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-blue-700" /> Submit New Timetable Adjustment Request
        </h3>

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
              <label>Current Scheduled Date</label>
              <input
                type="date"
                value={form.currentDate}
                onChange={(e) => setForm({ ...form, currentDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label>Current Slot</label>
              <input
                type="text"
                value={form.currentStart}
                onChange={(e) => setForm({ ...form, currentStart: e.target.value })}
                placeholder="e.g. 08:00 AM - 11:00 AM"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Requested New Date</label>
              <input
                type="date"
                value={form.requestedDate}
                onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label>Requested New Slot</label>
              <input
                type="text"
                value={form.requestedStart}
                onChange={(e) => setForm({ ...form, requestedStart: e.target.value })}
                placeholder="e.g. 02:00 PM - 05:00 PM"
                required
              />
            </div>
          </div>

          <div>
            <label>Reason / Justification for Timetable Committee</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="State reason (e.g. scheduled hardware maintenance in Lab 3B, academic workshop conflict, student makeup session)..."
              required
            />
          </div>

          <div className="form-actions pt-2 border-t">
            <button type="submit" className="primary-button">
              <Send size={14} /> Submit Adjustment Request
            </button>
          </div>
        </form>
      </section>

      {/* REQUESTS HISTORY */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <Clock size={16} className="text-amber-600" /> Submitted Adjustment Requests
        </h3>

        <div className="overflow-x-auto">
          <table className="student-table">
            <thead>
              <tr>
                <th>Unit Code</th>
                <th>Original Date &amp; Slot</th>
                <th>Requested Date &amp; Slot</th>
                <th>Reason</th>
                <th>Submission Date</th>
                <th>Committee Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-bold text-blue-900">{r.unitCode}</td>
                  <td className="text-slate-600 font-medium">
                    {r.currentDate} ({r.currentStart})
                  </td>
                  <td className="text-blue-900 font-bold">
                    {r.requestedDate} ({r.requestedStart})
                  </td>
                  <td className="text-slate-600 max-w-xs">{r.reason}</td>
                  <td className="font-mono text-slate-500 text-[11px]">{r.createdAt}</td>
                  <td>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        r.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
