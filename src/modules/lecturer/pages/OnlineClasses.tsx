import React, { useState } from "react";
import { Video, Calendar, Clock, ExternalLink, Plus, CheckCircle2, X, Send } from "lucide-react";
import { lecturerApi, OnlineClassItem } from "../services/lecturerApi";

export default function OnlineClasses() {
  const [classes, setClasses] = useState<OnlineClassItem[]>(lecturerApi.getOnlineClasses());
  const assignments = lecturerApi.getAssignments();
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    assignmentId: assignments[0]?.id || "",
    unitCode: assignments[0]?.unitId || "CSC 301",
    title: "",
    description: "",
    scheduledStart: "2026-03-12T18:00",
    scheduledEnd: "2026-03-12T19:30",
    provider: "TEAMS" as "TEAMS" | "GOOGLE_MEET",
    meetingUrl: "https://teams.microsoft.com/l/meetup-join/hca-virtual-class",
  });

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.meetingUrl.trim()) return;

    const newClass = lecturerApi.scheduleOnlineClass({
      assignmentId: form.assignmentId,
      unitCode: form.unitCode,
      title: form.title.trim(),
      description: form.description.trim(),
      scheduledStart: form.scheduledStart,
      scheduledEnd: form.scheduledEnd,
      provider: form.provider,
      meetingUrl: form.meetingUrl.trim(),
    });

    setClasses([newClass, ...classes]);
    setShowModal(false);
    setForm({
      ...form,
      title: "",
      description: "",
    });
    setSuccessMsg("Online class scheduled and calendar invites broadcast to enrolled students.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DISTANCE LEARNING &amp; VIRTUAL LABS</span>
          <h1>Online Class Scheduling</h1>
          <p>Schedule virtual lectures, evening remedial workshops, and guest industry masterclasses.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={15} /> Schedule Virtual Class
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ONLINE CLASSES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-blue-300 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded">
                  {c.unitCode}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  {c.provider === "TEAMS" ? "Microsoft Teams" : "Google Meet"}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {c.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
              {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span>Starts: {c.scheduledStart.replace("T", " ")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span>Ends: {c.scheduledEnd.replace("T", " ")}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11.5px] text-slate-500 font-mono truncate max-w-[200px]">
                {c.meetingUrl}
              </span>
              <a
                href={c.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="primary-button text-xs py-1.5"
              >
                <Video size={14} /> Join Meeting Room
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* SCHEDULE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule Virtual Classroom</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course Unit</label>
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
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.unitId}: {a.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Virtual Remedial: Dynamic Programming Walkthrough"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Topic Outline</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summary of topics covered, lab prerequisites, or guest speaker bio..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Start</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledStart}
                    onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled End</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledEnd}
                    onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Platform Provider</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value as "TEAMS" | "GOOGLE_MEET" })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="TEAMS">Microsoft Teams</option>
                    <option value="GOOGLE_MEET">Google Meet</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meeting Invite URL</label>
                  <input
                    type="url"
                    value={form.meetingUrl}
                    onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Send size={14} /> Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
