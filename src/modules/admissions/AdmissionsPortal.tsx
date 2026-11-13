import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Send,
  UserCheck,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { collegeErpService, subscribeErpSync } from "../../services/collegeErpService";
import { AdmissionApplication, PortalRole } from "../../types";
import { useSyncedPortalTab } from "../../context/PortalShellContext";

interface AdmissionsPortalProps {
  onSwitchPortal?: (role: PortalRole) => void;
}

export default function AdmissionsPortal({ onSwitchPortal }: AdmissionsPortalProps) {
  const [applications, setApplications] = useState<AdmissionApplication[]>(
    () => collegeErpService.getState().applications
  );
  const [activeTab, setActiveTab] = useSyncedPortalTab<
    "applications" | "new_apply" | "conversion"
  >("admissions", "applications");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    return subscribeErpSync(() => {
      setApplications([...collegeErpService.getState().applications]);
    });
  }, []);

  // New application form state
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [nationalIdOrIndex, setNationalIdOrIndex] = useState("");
  const [targetProgramme, setTargetProgramme] = useState("BSc. Computer Science");
  const [targetCampus, setTargetCampus] = useState("Nairobi Main Campus");
  const [intake, setIntake] = useState("May 2026 Intake");
  const [meanGrade, setMeanGrade] = useState("B+");
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp = collegeErpService.submitOnlineApplication({
      applicantName,
      email: applicantEmail,
      phoneNumber: applicantPhone,
      nationalIdOrIndex,
      targetProgramme,
      targetCampus,
      intake,
      meanGrade,
    });

    setApplications([...collegeErpService.getState().applications]);
    setApplicationSuccess(
      `Application ${newApp.applicationReference} submitted and synced to Admissions & Central Registration Registry.`
    );
    setTimeout(() => {
      setApplicationSuccess(null);
      setActiveTab("applications");
      setApplicantName("");
      setApplicantEmail("");
      setApplicantPhone("");
      setNationalIdOrIndex("");
    }, 1800);
  };

  const handleMakeOffer = (appId: string) => {
    const res = collegeErpService.makeAdmissionOffer(appId);
    if (res.ok) {
      setApplications([...collegeErpService.getState().applications]);
      setStatusNotice(`Offer letter ${res.offerRef} dispatched to applicant. Waiting for acceptance.`);
    }
  };

  const handleAcceptOffer = (appId: string) => {
    const res = collegeErpService.acceptAdmissionOffer(appId);
    if (res.ok) {
      setApplications([...collegeErpService.getState().applications]);
      setStatusNotice("Offer accepted by applicant. Eligible for official student registration conversion.");
    }
  };

  const handleConvertToStudent = (app: AdmissionApplication) => {
    const res = collegeErpService.convertApplicationToStudent(app.id);
    setApplications([...collegeErpService.getState().applications]);

    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setStatusNotice(
      `Official Student Identity Created in Central Registry! Assigned Registration Number: ${res.studentRegNo}`
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-[#092c60] text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap size={16} />
            <span>MODULE 24 · ADMISSIONS &amp; STUDENT ENROLMENT PORTAL</span>
          </div>
          <h1 className="text-2xl font-bold">HI-TECH College Admissions Management</h1>
          <p className="text-blue-100 text-xs mt-1">
            Online application lifecycle, document verification, offer letters &amp; automated student registration conversion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSwitchPortal && (
            <>
              <button
                type="button"
                onClick={() => onSwitchPortal("generator")}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Reg Generator
              </button>
              <button
                type="button"
                onClick={() => onSwitchPortal("registrar")}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Registrar Portal
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab("new_apply")}
            className="px-4 py-2 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-bold rounded-xl flex items-center gap-2 shadow"
          >
            <Plus size={16} /> New Online Application
          </button>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3">
          <span>{statusNotice}</span>
          <button type="button" onClick={() => setStatusNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "applications"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} /> Application Queue ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab("new_apply")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "new_apply"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} /> Online Application Form
        </button>
      </div>

      {/* APPLICATIONS QUEUE TAB */}
      {activeTab === "applications" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">2026 Intake Applications &amp; Review Workflow</h3>
            <span className="text-xs text-slate-500">Admissions Board Desk</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Reference</th>
                <th className="p-4">Applicant Name</th>
                <th className="p-4">Target Programme</th>
                <th className="p-4">Campus &amp; Intake</th>
                <th className="p-4">Grade</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-blue-900">{app.applicationReference}</td>
                  <td className="p-4">
                    <strong className="text-slate-900 block">{app.applicantName}</strong>
                    <span className="text-[11px] text-slate-500">{app.email}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{app.targetProgramme}</td>
                  <td className="p-4 text-slate-600">
                    <span className="block">{app.targetCampus}</span>
                    <span className="text-[11px] text-slate-400">{app.intake}</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">{app.meanGrade}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === "REGISTERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "OFFER_MADE"
                          ? "bg-blue-100 text-blue-800"
                          : app.status === "ACCEPTED"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {app.status}
                    </span>
                    {app.generatedStudentRegNo && (
                      <span className="block font-mono text-[10px] text-emerald-800 mt-1 font-bold">
                        {app.generatedStudentRegNo}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1.5">
                    {app.status === "UNDER_REVIEW" && (
                      <button
                        onClick={() => handleMakeOffer(app.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                      >
                        Make Offer
                      </button>
                    )}

                    {app.status === "OFFER_MADE" && (
                      <button
                        onClick={() => handleAcceptOffer(app.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded"
                      >
                        Simulate Acceptance
                      </button>
                    )}

                    {app.status === "ACCEPTED" && (
                      <button
                        onClick={() => handleConvertToStudent(app)}
                        className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm flex items-center gap-1 inline-flex"
                      >
                        <UserCheck size={13} /> Convert to Student Record
                      </button>
                    )}

                    {app.status === "REGISTERED" && (
                      <span className="text-emerald-700 text-xs font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={14} /> Registered
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ONLINE APPLICATION WIZARD TAB */}
      {activeTab === "new_apply" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-base font-bold text-slate-900">Student Online Admission Application</h3>
            <p className="text-xs text-slate-500">2026 Academic Year Direct Admission Portal</p>
          </div>

          {applicationSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{applicationSuccess}</span>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Applicant Name</label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Dennis Mutiso"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">National ID / KCSE Index</label>
                  <input
                    type="text"
                    value={nationalIdOrIndex}
                    onChange={(e) => setNationalIdOrIndex(e.target.value)}
                    placeholder="e.g. KCSE-2025-901823"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="applicant@domain.com"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Programme</label>
                  <select
                    value={targetProgramme}
                    onChange={(e) => setTargetProgramme(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>BSc. Computer Science</option>
                    <option>Diploma in Cyber Security</option>
                    <option>Certificate in Information Technology</option>
                    <option>Diploma in Software Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Intake</label>
                  <select
                    value={intake}
                    onChange={(e) => setIntake(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>May 2026 Intake</option>
                    <option>September 2026 Intake</option>
                    <option>January 2027 Intake</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">KCSE Mean Grade</label>
                  <select
                    value={meanGrade}
                    onChange={(e) => setMeanGrade(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>A</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B</option>
                    <option>B-</option>
                    <option>C+</option>
                    <option>C</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("applications")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow flex items-center gap-2"
                >
                  <Send size={14} /> Submit Application
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
