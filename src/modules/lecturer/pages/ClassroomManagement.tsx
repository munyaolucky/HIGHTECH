import React, { useState } from "react";
import { Building, Users, MapPin, CheckCircle2, ShieldCheck, Monitor } from "lucide-react";
import { lecturerApi } from "../services/lecturerApi";

export default function ClassroomManagement() {
  const classrooms = lecturerApi.getClassrooms();
  const [filterType, setFilterType] = useState("ALL");

  const filtered = classrooms.filter((c) => {
    if (filterType !== "ALL" && c.roomType !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ESTATES &amp; VENUE ALLOCATIONS</span>
          <h1>Classroom &amp; Venue Management</h1>
          <p>Institutional venues, computer laboratories, lecture halls, and seating capacities.</p>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex items-center gap-2 border-b pb-3 text-xs">
        <span className="font-semibold text-slate-500 mr-2">Filter Venue Type:</span>
        {[
          { label: "All Venues", value: "ALL" },
          { label: "Computer Labs", value: "COMPUTER_LAB" },
          { label: "Lecture Halls", value: "LECTURE_HALL" },
          { label: "Tutorial Rooms", value: "CLASSROOM" },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilterType(btn.value)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === btn.value ? "bg-[#153b70] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* CLASSROOMS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-blue-300 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded">
                  {room.roomCode}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  {room.roomType.replace("_", " ")}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={12} /> Operational
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{room.roomName}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Building size={14} className="text-slate-400" /> {room.building} · {room.campusName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Seating Capacity</span>
                <strong className="text-slate-900 text-sm">{room.capacity} Students</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Facilities</span>
                <strong className="text-slate-900 text-sm">
                  {room.roomType === "COMPUTER_LAB" ? "Gigabit LAN & UPS" : "A/V Projector & Mic"}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
