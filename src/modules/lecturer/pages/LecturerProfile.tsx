import React, { useState } from "react";
import { User, Shield, Briefcase, GraduationCap, Phone, Mail, Building, MapPin, Send, CheckCircle2, Clock } from "lucide-react";
import { lecturerApi, LecturerProfileData, ProfileCorrectionRequest } from "../services/lecturerApi";

export default function LecturerProfile() {
  const [profile, setProfile] = useState<LecturerProfileData>(lecturerApi.getProfile());
  const [corrections, setCorrections] = useState<ProfileCorrectionRequest[]>(lecturerApi.getProfileCorrections());
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedField, setSelectedField] = useState("phone");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !reason.trim()) return;

    const req = lecturerApi.requestProfileCorrection({
      fieldName: selectedField,
      newValue: newValue.trim(),
      reason: reason.trim(),
    });

    setCorrections([req, ...corrections]);
    setShowRequestModal(false);
    setNewValue("");
    setReason("");
    setSuccessMsg("Correction request submitted to HR Division for authorized verification.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FACULTY IDENTITY &amp; CREDENTIALS</span>
          <h1>Lecturer Profile &amp; HR Records</h1>
          <p>Authoritative staff profile linked directly to central Human Resources.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowRequestModal(true)}
        >
          <Briefcase size={15} />
          Request HR Profile Correction
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* IDENTITY OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-[#153b70] text-white flex items-center justify-center text-2xl font-black border-4 border-amber-400 shadow-md mb-4">
            PO
          </div>
          <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
          <p className="text-xs font-semibold text-blue-700 mt-0.5">{profile.designation}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
              {profile.employmentStatus}
            </span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
              {profile.employmentType}
            </span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-100 text-left space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Lecturer Reg No:</span>
              <span className="font-mono font-bold text-blue-900">{profile.registrationNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Staff Identity:</span>
              <span className="font-mono font-bold text-amber-700">{profile.staffRegistrationNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Campus:</span>
              <span className="font-semibold text-slate-800">{profile.campus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Hire Date:</span>
              <span className="font-semibold text-slate-800">{profile.hireDate}</span>
            </div>
          </div>
        </div>

        {/* DETAILS COLUMN */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <Shield size={16} className="text-blue-700" /> Professional &amp; Departmental Data
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Official Email Address</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> {profile.officialEmail}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Mobile Contact Phone</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" /> {profile.phone}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Department</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building size={14} className="text-slate-400" /> {profile.department}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Office Location</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> {profile.officeLocation}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">Reporting Head of Department</span>
                <p className="font-semibold text-slate-800">{profile.reportingHod}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <GraduationCap size={16} className="text-purple-700" /> Academic &amp; Professional Certifications
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Academic Qualifications</span>
                <p className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {profile.academicQualifications}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Professional Accreditations</span>
                <p className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {profile.professionalQualifications}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Research &amp; Teaching Specialization</span>
                <p className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {profile.specialization}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORRECTION REQUESTS HISTORY */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <Clock size={16} className="text-amber-600" /> HR Profile Correction Requests Audit Trail
        </h3>

        <div className="overflow-x-auto">
          <table className="student-table">
            <thead>
              <tr>
                <th>Submission Date</th>
                <th>Field Name</th>
                <th>Old Value</th>
                <th>Requested New Value</th>
                <th>Justification / Reason</th>
                <th>HR Review Status</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((req) => (
                <tr key={req.id}>
                  <td className="font-mono text-slate-500">{req.submittedAt}</td>
                  <td className="font-semibold text-slate-800 capitalize">{req.fieldName}</td>
                  <td className="text-slate-500">{req.oldValue || "—"}</td>
                  <td className="font-semibold text-blue-900">{req.newValue}</td>
                  <td className="text-slate-600">{req.reason}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        req.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CORRECTION MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request HR Profile Correction</h3>
            <p className="text-xs text-slate-500">
              Institutional staff records are protected. Proposed changes will be reviewed and approved by Human Resources.
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Field to Correct</label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="phone">Contact Phone Number</option>
                  <option value="officialEmail">Official Email Address</option>
                  <option value="specialization">Research &amp; Teaching Specialization</option>
                  <option value="academicQualifications">Academic Qualifications</option>
                  <option value="professionalQualifications">Professional Qualifications</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposed New Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter corrected value"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Justification for HR</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide supporting notes or reference documentation for HR verification..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Send size={14} /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
