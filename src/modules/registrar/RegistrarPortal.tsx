import React, { useState } from "react";
import {
  FileText,
  Award,
  Users,
  CheckCircle2,
  Search,
  Printer,
  ShieldCheck,
  Building2,
  FileCheck,
  Download,
  Plus,
} from "lucide-react";
import {
  INITIAL_STUDENT_PROFILE,
  INITIAL_TRANSCRIPTS,
} from "../../data/mockCollegeData";
import { registrationService } from "../../services/registrationService";
import { TranscriptRecord } from "../../types";

export default function RegistrarPortal() {
  const [activeTab, setActiveTab] = useState<"students" | "transcripts" | "certificates" | "verification">("students");
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>(INITIAL_TRANSCRIPTS);
  const [searchStudent, setSearchStudent] = useState("");

  // Certificate Issuance State
  const [certRecipient, setCertRecipient] = useState("Faith Chebet");
  const [certProgramme, setCertProgramme] = useState("Diploma in Information Communication Technology");
  const [certRefStudent, setCertRefStudent] = useState("HCA/STU/2024/089");
  const [certSuccess, setCertSuccess] = useState<string | null>(null);

  // Verification Desk State
  const [docVerifyInput, setDocVerifyInput] = useState("TRX-2026-0001");
  const [verifyOutcome, setVerifyOutcome] = useState<any>(null);

  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const issuance = registrationService.generateNextRegistrationNumber({
      recordType: "CERT",
      year: 2026,
      recipientName: certRecipient,
      identifierReference: certRefStudent,
      department: "Information Technology",
      programmeOrRole: certProgramme,
      issuedBy: "Academic Senate Clearance & Registrar",
    });

    setCertSuccess(`Official Certificate Issued! Number: ${issuance.registrationNumber}`);
    setTimeout(() => {
      setCertSuccess(null);
    }, 4000);
  };

  const handleVerifyDoc = () => {
    const clean = docVerifyInput.trim().toUpperCase();
    const foundTrx = transcripts.find((t) => t.issuanceReference.toUpperCase() === clean);
    if (foundTrx) {
      setVerifyOutcome({
        valid: true,
        type: "Official Academic Transcript",
        record: foundTrx,
      });
      return;
    }

    const foundReg = registrationService.lookupIssuance(clean);
    if (foundReg) {
      setVerifyOutcome({
        valid: true,
        type: `${foundReg.recordType} Registration Credential`,
        record: foundReg,
      });
      return;
    }

    setVerifyOutcome({
      valid: false,
      error: `No official record matching identifier '${docVerifyInput}' was found in the Registrar archive.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-[#092c60] text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 size={16} />
            <span>MODULE 19 · REGISTRAR PORTAL &amp; ACADEMIC RECORDS</span>
          </div>
          <h1 className="text-2xl font-bold">Office of the Academic Registrar</h1>
          <p className="text-blue-100 text-xs mt-1">
            Official repository for student academic files, transcript registers (TRX-xxxx), certificates &amp; credentials verification.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-400/30 px-3 py-1.5 rounded-xl text-xs">
          <ShieldCheck size={16} className="text-amber-400" />
          <span>Chief Registrar: <strong>Dr. Kiprop Chemweno (HCA/STAFF/2026/001)</strong></span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "students"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} /> Official Student Records
        </button>
        <button
          onClick={() => setActiveTab("transcripts")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "transcripts"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} /> Transcript Issuance Register (TRX-xxxx)
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "certificates"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award size={16} /> Certificate Management (HCA/CERT/...)
        </button>
        <button
          onClick={() => setActiveTab("verification")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "verification"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCheck size={16} /> Document Verification Desk
        </button>
      </div>

      {/* STUDENTS TAB */}
      {activeTab === "students" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Student Registry</h3>
            <span className="text-xs text-slate-500">Academic Year 2026</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Reg Number</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Programme</th>
                <th className="p-4">Campus</th>
                <th className="p-4">Attendance</th>
                <th className="p-4">Cumulative GPA</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-blue-900">{INITIAL_STUDENT_PROFILE.registrationNumber}</td>
                <td className="p-4 font-bold text-slate-900">{INITIAL_STUDENT_PROFILE.fullName}</td>
                <td className="p-4 text-slate-800">{INITIAL_STUDENT_PROFILE.programme}</td>
                <td className="p-4 text-slate-600">{INITIAL_STUDENT_PROFILE.campus}</td>
                <td className="p-4 font-bold text-emerald-700">{INITIAL_STUDENT_PROFILE.attendanceRate}%</td>
                <td className="p-4 font-mono font-bold text-amber-700">{INITIAL_STUDENT_PROFILE.gpa.toFixed(2)}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {INITIAL_STUDENT_PROFILE.status}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSCRIPTS TAB */}
      {activeTab === "transcripts" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Official Transcript Issuance Register</h3>
              <p className="text-xs text-slate-500">Each official transcript creates an immutable ledger entry</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"
            >
              <Printer size={14} /> Print Register
            </button>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Issuance Reference</th>
                <th className="p-4">Student Reg No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Programme</th>
                <th className="p-4">Issued Date</th>
                <th className="p-4">Verification Code</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {transcripts.map((trx) => (
                <tr key={trx.issuanceReference} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-emerald-800 text-xs bg-emerald-50/50 px-2 rounded">
                    {trx.issuanceReference}
                  </td>
                  <td className="p-4 font-mono font-bold text-blue-900">{trx.studentRegNo}</td>
                  <td className="p-4 font-bold text-slate-900">{trx.studentName}</td>
                  <td className="p-4 text-slate-700">{trx.programme}</td>
                  <td className="p-4 text-slate-500">{trx.issueDate}</td>
                  <td className="p-4 font-mono text-slate-500">{trx.verificationCode}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {trx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CERTIFICATES TAB */}
      {activeTab === "certificates" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-base font-bold text-slate-900">Certificate Generation &amp; Conferment</h3>
            <p className="text-xs text-slate-500">
              Generates independent sequence under format <code className="font-mono text-blue-700">HCA/CERT/2026/xxx</code>
            </p>
          </div>

          {certSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{certSuccess}</span>
            </div>
          ) : (
            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Graduand Full Name</label>
                <input
                  type="text"
                  value={certRecipient}
                  onChange={(e) => setCertRecipient(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Student Registration Number</label>
                <input
                  type="text"
                  value={certRefStudent}
                  onChange={(e) => setCertRefStudent(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Awarded Academic Credential</label>
                <input
                  type="text"
                  value={certProgramme}
                  onChange={(e) => setCertProgramme(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Confer &amp; Generate Official Certificate (HCA/CERT/...)
              </button>
            </form>
          )}
        </div>
      )}

      {/* VERIFICATION DESK TAB */}
      {activeTab === "verification" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Official Registrar Document Verification
            </h3>
            <p className="text-xs text-slate-500">
              Lookup any transcript reference (e.g. TRX-2026-0001) or certificate (e.g. HCA/CERT/2026/001)
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={docVerifyInput}
              onChange={(e) => setDocVerifyInput(e.target.value)}
              placeholder="e.g. TRX-2026-0001"
              className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg"
            />
            <button
              onClick={handleVerifyDoc}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5"
            >
              <Search size={14} /> Verify
            </button>
          </div>

          {verifyOutcome && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                verifyOutcome.valid
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : "bg-red-50 border-red-300 text-red-950"
              }`}
            >
              {verifyOutcome.valid ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 size={16} />
                    <span>AUTHENTIC &amp; CERTIFIED DOCUMENT</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1 border-t border-emerald-200">
                    <div>Document Type: <strong>{verifyOutcome.type}</strong></div>
                    <div>Holder: <strong>{verifyOutcome.record.studentName || verifyOutcome.record.recipientName}</strong></div>
                    <div>Reference: <span className="font-mono font-bold">{verifyOutcome.record.issuanceReference || verifyOutcome.record.registrationNumber}</span></div>
                    <div>Status: <span className="font-bold text-emerald-700">{verifyOutcome.record.status}</span></div>
                  </div>
                </>
              ) : (
                <div className="text-red-700 font-semibold">{verifyOutcome.error}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
