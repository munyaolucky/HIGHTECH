import React, { useState } from "react";
import { Wrench, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Plus, Send, X, Clock } from "lucide-react";
import { lecturerApi, LaboratoryEquipmentItem, EquipmentFaultItem } from "../services/lecturerApi";

export default function LaboratoryManagement() {
  const [equipment] = useState<LaboratoryEquipmentItem[]>(lecturerApi.getLabEquipment());
  const [faults, setFaults] = useState<EquipmentFaultItem[]>(lecturerApi.getFaults());
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState(equipment[0]?.id || "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [successMsg, setSuccessMsg] = useState("");

  const handleReportFault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const eq = equipment.find((item) => item.id === selectedEqId) || equipment[0];
    const newFault = lecturerApi.reportFault({
      equipmentId: eq.id,
      equipmentName: eq.equipmentName,
      assetCode: eq.assetCode,
      reportedBy: "Dr. Peter Otieno Onyango",
      description: description.trim(),
      priority,
    });

    setFaults([newFault, ...faults]);
    setShowFaultModal(false);
    setDescription("");
    setSuccessMsg("Equipment defect ticket logged with ICT Campus Infrastructure Maintenance team.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ICT HARDWARE &amp; COMPUTING ASSETS</span>
          <h1>Laboratory Equipment &amp; Defect Reporting</h1>
          <p>Monitor laboratory workstations, servers, switches, and log urgent maintenance tickets.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowFaultModal(true)}
        >
          <AlertTriangle size={15} /> Log Hardware Defect
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* EQUIPMENT ASSET REGISTER */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <Cpu size={16} className="text-blue-700" /> Allocated Laboratory Asset Register
        </h3>

        <div className="overflow-x-auto">
          <table className="student-table">
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Equipment Name</th>
                <th>Laboratory Location</th>
                <th>Specification / Model</th>
                <th>Hardware Condition</th>
                <th>Last Serviced</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq) => (
                <tr key={eq.id}>
                  <td className="font-mono font-bold text-blue-900">{eq.assetCode}</td>
                  <td className="font-semibold text-slate-900">{eq.equipmentName}</td>
                  <td className="text-slate-600">{eq.laboratoryName}</td>
                  <td className="text-slate-500 text-[11px] max-w-xs">{eq.modelNumber}</td>
                  <td>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        eq.condition === "GOOD"
                          ? "bg-emerald-100 text-emerald-800"
                          : eq.condition === "FAIR"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {eq.condition}
                    </span>
                  </td>
                  <td className="font-mono text-slate-500 text-[11px]">{eq.lastServiceDate || "—"}</td>
                  <td className="text-right">
                    <button
                      onClick={() => {
                        setSelectedEqId(eq.id);
                        setShowFaultModal(true);
                      }}
                      className="secondary-button text-[11px] py-1 px-2.5 ml-auto"
                    >
                      Report Issue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAULT LOGS TABLE */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-600" /> Active Maintenance &amp; Fault Tickets
        </h3>

        <div className="overflow-x-auto">
          <table className="student-table">
            <thead>
              <tr>
                <th>Reported At</th>
                <th>Asset Code</th>
                <th>Equipment Description</th>
                <th>Defect Details</th>
                <th>Priority</th>
                <th>Ticket Status</th>
              </tr>
            </thead>
            <tbody>
              {faults.map((flt) => (
                <tr key={flt.id}>
                  <td className="font-mono text-slate-500 text-[11px]">{flt.reportedAt}</td>
                  <td className="font-mono font-bold text-blue-900">{flt.assetCode}</td>
                  <td className="font-semibold text-slate-900">{flt.equipmentName}</td>
                  <td className="text-slate-600 max-w-xs text-xs">{flt.description}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        flt.priority === "URGENT"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {flt.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        flt.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : flt.status === "IN_PROGRESS"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {flt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* REPORT FAULT MODAL */}
      {showFaultModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" /> Log Equipment Defect / Fault
              </h3>
              <button onClick={() => setShowFaultModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportFault} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Laboratory Asset</label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.assetCode} - {eq.equipmentName} ({eq.laboratoryName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fault Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "NORMAL" | "URGENT")}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NORMAL">Normal Priority (Routine service maintenance)</option>
                  <option value="URGENT">Urgent Priority (Directly impacting scheduled class)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Defect Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe failure symptoms, optical/hardware behavior, error codes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFaultModal(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button bg-amber-600 hover:bg-amber-700">
                  <Send size={14} /> Submit Defect Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
