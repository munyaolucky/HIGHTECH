import React, { useEffect, useState } from "react";
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
  ClipboardCheck,
  BookOpen,
} from "lucide-react";
import { collegeErpService, subscribeErpSync } from "../../services/collegeErpService";
import { registrationService } from "../../services/registrationService";
import { studentPortalService } from "../../services/studentPortalService";
import { PortalRole, TranscriptRecord } from "../../types";
import { useSyncedPortalTab } from "../../context/PortalShellContext";
import SemesterRegistrationTab from "./SemesterRegistrationTab";
import ModuleDocumentRepository from "../documents/ModuleDocumentRepository";

interface RegistrarPortalProps {
  onSwitchPortal?: (role: PortalRole) => void;
}

export default function RegistrarPortal({ onSwitchPortal }: RegistrarPortalProps) {
  const [activeTab, setActiveTab] = useSyncedPortalTab<
    "students" | "academic_reg" | "requests" | "transcripts" | "certificates" | "verification" | "student_records"
  >("registrar", "students");
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>(
    () => collegeErpService.getState().transcripts
  );
  const [, setSyncTick] = useState(0);
  const [regNotice, setRegNotice] = useState<string | null>(null);

  useEffect(() => {
    return subscribeErpSync(() => {
      setTranscripts([...collegeErpService.getState().transcripts]);
      setSyncTick((n) => n + 1);
    });
  }, []);

  const studentState = studentPortalService.getState();
  const enrolledStudents = registrationService.getAllIssuances({ recordType: "STU" });

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
    const outcome = collegeErpService.verifyCredentialAnywhere(docVerifyInput);
    if (outcome.valid) {
      setVerifyOutcome({
        valid: true,
        type: outcome.type,
        holder: outcome.holder,
        reference: outcome.reference,
        detail: outcome.detail,
        status: outcome.status,
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

        <div className="flex flex-wrap items-center gap-2">
          {onSwitchPortal && (
            <>
              <button
                type="button"
                onClick={() => onSwitchPortal("admissions")}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Admissions Queue
              </button>
              <button
                type="button"
                onClick={() => onSwitchPortal("generator")}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Central Reg Ledger
              </button>
              <button
                type="button"
                onClick={() => onSwitchPortal("student")}
                className="px-3 py-1.5 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-bold rounded-xl"
              >
                Student Portal
              </button>
            </>
          )}
          <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-400/30 px-3 py-1.5 rounded-xl text-xs">
            <ShieldCheck size={16} className="text-amber-400" />
            <span>Chief Registrar: <strong>Dr. Kiprop Chemweno</strong></span>
          </div>
        </div>
      </div>

      {regNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3">
          <span>{regNotice}</span>
          <button type="button" onClick={() => setRegNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

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
          <Users size={16} /> Enrolled Registry ({enrolledStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("academic_reg")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "academic_reg"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen size={16} /> Semester Unit Registrations
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "requests"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardCheck size={16} /> Student Requests ({studentState.unitChanges.length + studentState.defermentRequests.length})
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
        <button
          onClick={() => setActiveTab("student_records")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "student_records"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} /> Student Records DMS
        </button>
      </div>

      {/* SEMESTER ACADEMIC REGISTRATIONS TAB (CLOUD SQL FEAT-016) */}
      {activeTab === "academic_reg" && <SemesterRegistrationTab />}

      {/* STUDENTS TAB */}
      {activeTab === "students" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Student Registry (Synced with Admissions &amp; Student Portal)</h3>
            <span className="text-xs text-slate-500">Academic Year 2026</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Reg Number</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Programme</th>
                <th className="p-4">Campus</th>
                <th className="p-4">Nominal Roll / Stats</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {enrolledStudents.map((stu) => {
                const isPrimary =
                  stu.registrationNumber.toUpperCase() ===
                  studentState.profile.registrationNumber.toUpperCase();
                return (
                  <tr key={stu.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-blue-900">{stu.registrationNumber}</td>
                    <td className="p-4 font-bold text-slate-900">{stu.recipientName}</td>
                    <td className="p-4 text-slate-800">{stu.programmeOrRole}</td>
                    <td className="p-4 text-slate-600">{stu.campus}</td>
                    <td className="p-4 font-mono text-slate-700">
                      {isPrimary
                        ? `${studentState.units.length} Units · ${studentState.profile.attendanceRate}% Att. · GPA ${studentState.profile.gpa.toFixed(2)}`
                        : `${stu.issuedBy}`}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {isPrimary ? studentState.profile.status : stu.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* STUDENT REQUESTS APPROVALS TAB */}
      {activeTab === "requests" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Unit Add / Drop / Swap Requests ({studentState.unitChanges.length})
            </h3>
            {studentState.unitChanges.length === 0 ? (
              <p className="text-slate-500">
                No unit change requests submitted yet from the Student Portal.
              </p>
            ) : (
              studentState.unitChanges.map((req) => (
                <div key={req.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between font-mono">
                    <strong className="text-[#092c60]">{req.action} · {req.unitCode}</strong>
                    <span className="font-bold text-amber-700">{req.status}</span>
                  </div>
                  <p className="text-slate-600">{req.reason}</p>
                  {req.status === "PENDING_REGISTRAR" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          studentPortalService.reviewUnitChangeRequest(req.id, "APPROVED");
                          setRegNotice(`Approved ${req.action} ${req.unitCode} and updated student timetable.`);
                          setSyncTick((n) => n + 1);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg"
                      >
                        Approve &amp; Update Units
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          studentPortalService.reviewUnitChangeRequest(req.id, "REJECTED");
                          setRegNotice(`Rejected ${req.action} ${req.unitCode}.`);
                          setSyncTick((n) => n + 1);
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Academic Leave, Deferment &amp; Transfers ({studentState.defermentRequests.length})
            </h3>
            {studentState.defermentRequests.length === 0 ? (
              <p className="text-slate-500">
                No academic leave or deferment requests submitted yet from the Student Portal.
              </p>
            ) : (
              studentState.defermentRequests.map((req) => (
                <div key={req.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between font-mono">
                    <strong className="text-[#092c60]">{req.type.replace("_", " ")} · {req.targetSemester}</strong>
                    <span className="font-bold text-amber-700">{req.status}</span>
                  </div>
                  <p className="text-slate-600">{req.reason}</p>
                  {req.status === "SUBMITTED_TO_DEAN" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          studentPortalService.reviewDefermentRequest(req.id, "APPROVED");
                          setRegNotice(`Approved ${req.type} for ${req.targetSemester}.`);
                          setSyncTick((n) => n + 1);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg"
                      >
                        Approve Request
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          studentPortalService.reviewDefermentRequest(req.id, "REJECTED");
                          setRegNotice(`Declined ${req.type}.`);
                          setSyncTick((n) => n + 1);
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
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
                    <div>Holder: <strong>{verifyOutcome.holder}</strong></div>
                    <div>Reference: <span className="font-mono font-bold">{verifyOutcome.reference}</span></div>
                    <div>Detail: <span>{verifyOutcome.detail}</span></div>
                    <div>Status: <span className="font-bold text-emerald-700">{verifyOutcome.status}</span></div>
                  </div>
                </>
              ) : (
                <div className="text-red-700 font-semibold">{verifyOutcome.error}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STUDENT RECORDS DMS TAB */}
      {activeTab === "student_records" && (
        <ModuleDocumentRepository
          moduleKey="ADMISSIONS_REGISTRAR"
          defaultRecipient="Office of the Academic Registrar"
          title="Student Records, Admissions & Transcripts DMS"
          description="Unified academic records repository for student registration files, admission letters, official transcripts, certificates, and statutory forms."
        />
      )}
    </div>
  );
}
