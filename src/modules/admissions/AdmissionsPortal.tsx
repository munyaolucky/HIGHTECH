import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Send,
  ShieldAlert,
  UploadCloud,
  UserCheck,
  Users,
} from "lucide-react";
import confetti from "canvas-confetti";
import { collegeErpService } from "../../services/collegeErpService";
import { AdmissionApplication, PortalRole } from "../../types";
import { useSyncedPortalTab } from "../../context/PortalShellContext";
import AdmissionOfferLetterModal from "../../components/AdmissionOfferLetterModal";

interface AdmissionsPortalProps {
  onSwitchPortal?: (role: PortalRole) => void;
}

interface ApiAdmissionApplication {
  id: string;
  applicationNumber: string;
  applicantName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalIdOrIndex: string;
  programmeName: string;
  departmentName?: string;
  campusName: string;
  intakeName: string;
  studyMode: string;
  meanGrade: string;
  status: string;
  missingDocumentsNote?: string | null;
  offerLetterRef?: string | null;
  generatedStudentRegNo?: string | null;
  linkedStudentId?: string | null;
  submittedAt: string;
  updatedAt: string;
}

const ADMISSION_STATUS_FILTERS = [
  "ALL",
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCUMENTS_REQUIRED",
  "APPROVED",
  "OFFER_SENT",
  "OFFER_ACCEPTED",
  "REGISTERED",
  "REJECTED",
] as const;

function toModalApp(item: ApiAdmissionApplication): AdmissionApplication {
  return {
    id: item.id,
    applicationReference: item.applicationNumber,
    applicantName: item.applicantName,
    email: item.email,
    phoneNumber: item.phone,
    nationalIdOrIndex: item.nationalIdOrIndex,
    targetProgramme: item.programmeName,
    targetCampus: item.campusName,
    intake: item.intakeName,
    meanGrade: item.meanGrade,
    status:
      item.status === "OFFER_SENT"
        ? "OFFER_MADE"
        : item.status === "OFFER_ACCEPTED"
        ? "ACCEPTED"
        : (item.status as AdmissionApplication["status"]),
    submittedAt: item.submittedAt,
    applicationFeePaid: true,
    generatedStudentRegNo: item.generatedStudentRegNo ?? undefined,
    offerLetterRef: item.offerLetterRef ?? undefined,
  };
}

export default function AdmissionsPortal({ onSwitchPortal }: AdmissionsPortalProps) {
  const [applications, setApplications] = useState<ApiAdmissionApplication[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    submittedOrReview: 0,
    documentsRequired: 0,
    offersAndAccepted: 0,
    registered: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useSyncedPortalTab<
    "applications" | "new_apply" | "conversion"
  >("admissions", "applications");

  const [selectedOfferApp, setSelectedOfferApp] = useState<AdmissionApplication | null>(null);
  const [docRequestApp, setDocRequestApp] = useState<ApiAdmissionApplication | null>(null);
  const [docRequestNote, setDocRequestNote] = useState(
    "Please upload a certified copy of your KCSE Result Slip and National ID."
  );

  // New application form state
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [nationalIdOrIndex, setNationalIdOrIndex] = useState("");
  const [targetProgramme, setTargetProgramme] = useState(
    "Diploma in Information Communication Technology (DICT)"
  );
  const [targetCampus, setTargetCampus] = useState("Nairobi Main Campus");
  const [intake, setIntake] = useState("September 2026 Intake");
  const [meanGrade, setMeanGrade] = useState("B+");
  const [docKcseSlip, setDocKcseSlip] = useState<string>("kcse_slip_verified.pdf");
  const [docNationalId, setDocNationalId] = useState<string>("national_id_card.pdf");
  const [docPassportPhoto, setDocPassportPhoto] = useState<string>("passport_photo_clean.jpg");
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({
        status: statusFilter,
        q: search.trim(),
        pageSize: "50",
      });
      const res = await fetch(`/api/admissions?${qs.toString()}`, {
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Unable to load admissions applications.");
      }
      setApplications(json.data.items ?? []);
      if (json.data.summary) setSummary(json.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch admissions records.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await fetch("/api/admissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName,
          email: applicantEmail,
          phone: applicantPhone,
          nationalIdOrIndex,
          programmeName: targetProgramme,
          campusName: targetCampus,
          intakeName: intake,
          meanGrade,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Unable to create admission application.");
      }

      collegeErpService.submitOnlineApplication({
        applicantName,
        email: applicantEmail,
        phoneNumber: applicantPhone,
        nationalIdOrIndex,
        targetProgramme,
        targetCampus,
        intake,
        meanGrade,
      });

      setApplicationSuccess(
        `Application ${json.data.applicationNumber} created and persisted in the Admissions Registry.`
      );
      await loadApplications();
      setTimeout(() => {
        setApplicationSuccess(null);
        setActiveTab("applications");
        setApplicantName("");
        setApplicantEmail("");
        setApplicantPhone("");
        setNationalIdOrIndex("");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit application.");
    }
  };

  const handleUpdateStatus = async (
    appId: string,
    status: string,
    missingDocumentsNote?: string
  ) => {
    try {
      setBusyId(appId);
      setError(null);
      const res = await fetch(`/api/admissions/${encodeURIComponent(appId)}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, missingDocumentsNote }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Unable to update application status.");
      }
      setStatusNotice(
        `Application ${json.data.applicationNumber} moved to ${json.data.status}${
          json.data.offerLetterRef ? ` (${json.data.offerLetterRef})` : ""
        }.`
      );
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update admission status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleConvertToStudent = async (app: ApiAdmissionApplication) => {
    try {
      setBusyId(app.id);
      setError(null);
      const res = await fetch(`/api/admissions/${encodeURIComponent(app.id)}/convert`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to convert applicant into student.");
      }

      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore headless
      }

      setStatusNotice(
        `Official Student Identity Created! Assigned Registration Number: ${json.data.generatedStudentRegNo}`
      );
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setBusyId(null);
    }
  };

  const statusTone = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-emerald-100 text-emerald-800";
      case "OFFER_SENT":
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "OFFER_ACCEPTED":
        return "bg-indigo-100 text-indigo-800";
      case "DOCUMENTS_REQUIRED":
      case "REJECTED":
        return "bg-red-100 text-[#B83232]";
      default:
        return "bg-amber-100 text-amber-800";
    }
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
            Application lifecycle, missing document follow-ups, admission offers &amp; atomic HCA/STU student conversion.
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
            type="button"
            onClick={() => setActiveTab("new_apply")}
            className="px-4 py-2 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-bold rounded-xl flex items-center gap-2 shadow"
          >
            <Plus size={16} /> New Application
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 text-xs">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-slate-500 font-semibold">Total Applications</div>
          <div className="mt-1 text-2xl font-extrabold text-[#102D50] tabular-nums">
            {summary.total}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-slate-500 font-semibold">Pending / Under Review</div>
          <div className="mt-1 text-2xl font-extrabold text-[#1769AA] tabular-nums">
            {summary.submittedOrReview}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-slate-500 font-semibold">Approved / Offers Active</div>
          <div className="mt-1 text-2xl font-extrabold text-[#102D50] tabular-nums">
            {summary.offersAndAccepted}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-slate-500 font-semibold">Converted Students</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-700 tabular-nums">
            {summary.registered}
          </div>
        </div>
      </div>

      {statusNotice && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3"
        >
          <span>{statusNotice}</span>
          <button type="button" onClick={() => setStatusNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#B83232] text-xs font-semibold flex items-center justify-between gap-3"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldAlert size={15} /> {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
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
          type="button"
          onClick={() => setActiveTab("new_apply")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "new_apply"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} /> Intake Application Form
        </button>
      </div>

      {/* APPLICATIONS QUEUE TAB */}
      {activeTab === "applications" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                2026 Intake Applications &amp; Review Workflow
              </h3>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference, name, email..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ADMISSION_STATUS_FILTERS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    statusFilter === st
                      ? "bg-[#102D50] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {st.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Loading admissions applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No admissions applications matched your selected status or search filter.
            </div>
          ) : (
            <>
              {/* Mobile Application Cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-blue-900">
                          {app.applicationNumber}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{app.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusTone(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="text-slate-700 font-semibold">{app.programmeName}</div>
                    <div className="text-slate-500">
                      {app.campusName} · {app.intakeName} · Grade {app.meanGrade}
                    </div>
                    {app.generatedStudentRegNo && (
                      <div className="font-mono font-bold text-emerald-800">
                        Student Reg: {app.generatedStudentRegNo}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_REQUIRED"].includes(app.status) && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => handleUpdateStatus(app.id, "OFFER_SENT")}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-[#102D50] text-white rounded"
                          >
                            Send Offer
                          </button>
                        </>
                      )}
                      {["APPROVED", "OFFER_SENT", "OFFER_ACCEPTED"].includes(app.status) && (
                        <button
                          type="button"
                          disabled={busyId === app.id}
                          onClick={() => handleConvertToStudent(app)}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded"
                        >
                          Convert to Student
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
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
                        <td className="p-4 font-mono font-bold text-blue-900">
                          {app.applicationNumber}
                        </td>
                        <td className="p-4">
                          <strong className="text-slate-900 block">{app.applicantName}</strong>
                          <span className="text-[11px] text-slate-500">{app.email}</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-800">{app.programmeName}</td>
                        <td className="p-4 text-slate-600">
                          <span className="block">{app.campusName}</span>
                          <span className="text-[11px] text-slate-400">{app.intakeName}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800">{app.meanGrade}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusTone(app.status)}`}>
                            {app.status}
                          </span>
                          {app.missingDocumentsNote && (
                            <span className="block text-[10px] text-[#B83232] mt-1 max-w-[200px]">
                              {app.missingDocumentsNote}
                            </span>
                          )}
                          {app.generatedStudentRegNo && (
                            <span className="block font-mono text-[10px] text-emerald-800 mt-1 font-bold">
                              {app.generatedStudentRegNo}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex flex-wrap justify-end items-center gap-1.5">
                            {["SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_REQUIRED"].includes(
                              app.status
                            ) && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => setDocRequestApp(app)}
                                  className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded"
                                >
                                  Request Docs
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => handleUpdateStatus(app.id, "OFFER_SENT")}
                                  className="px-2.5 py-1 text-xs font-semibold bg-[#102D50] text-white hover:bg-[#1769AA] rounded"
                                >
                                  Send Offer
                                </button>
                              </>
                            )}

                            {app.status === "APPROVED" && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => handleUpdateStatus(app.id, "OFFER_SENT")}
                                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                                >
                                  Send Offer
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => handleConvertToStudent(app)}
                                  className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded inline-flex items-center gap-1"
                                >
                                  <UserCheck size={13} /> Convert to Student
                                </button>
                              </>
                            )}

                            {app.status === "OFFER_SENT" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOfferApp(toModalApp(app))}
                                  className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded inline-flex items-center gap-1"
                                >
                                  <Eye size={12} /> Offer Letter
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => handleUpdateStatus(app.id, "OFFER_ACCEPTED")}
                                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded"
                                >
                                  Accept Offer
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => handleConvertToStudent(app)}
                                  className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded inline-flex items-center gap-1"
                                >
                                  <UserCheck size={13} /> Convert
                                </button>
                              </>
                            )}

                            {app.status === "OFFER_ACCEPTED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOfferApp(toModalApp(app))}
                                  className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded inline-flex items-center gap-1"
                                >
                                  <Eye size={12} /> Offer Letter
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === app.id}
                                  onClick={() => handleConvertToStudent(app)}
                                  className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm inline-flex items-center gap-1"
                                >
                                  <UserCheck size={13} /> Convert to Student
                                </button>
                              </>
                            )}

                            {app.status === "REGISTERED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOfferApp(toModalApp(app))}
                                  className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded inline-flex items-center gap-1"
                                >
                                  <Eye size={12} /> Offer Letter
                                </button>
                                <span className="text-emerald-700 text-xs font-bold inline-flex items-center gap-1">
                                  <CheckCircle2 size={14} /> Registered
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ONLINE APPLICATION WIZARD TAB */}
      {activeTab === "new_apply" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Student Online Admission Application
            </h3>
            <p className="text-xs text-slate-500">
              2026 Academic Year Direct Admission Desk
            </p>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Applicant Name
                  </label>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    National ID / KCSE Index
                  </label>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mobile Phone Number
                  </label>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Target Programme
                  </label>
                  <select
                    value={targetProgramme}
                    onChange={(e) => setTargetProgramme(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Diploma in Information Communication Technology (DICT)</option>
                    <option>Diploma in Cyber Security</option>
                    <option>Diploma in Business Management</option>
                    <option>Diploma in Artificial Intelligence &amp; Machine Learning</option>
                    <option>Certificate in Information Technology</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Campus
                  </label>
                  <select
                    value={targetCampus}
                    onChange={(e) => setTargetCampus(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Nairobi Main Campus</option>
                    <option>Westlands Technology Park Campus</option>
                    <option>Mombasa Coastal Campus</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    KCSE Mean Grade
                  </label>
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
                    <option>C-</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck2 size={15} className="text-blue-700" />
                    Required Documents Checklist
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    TVETA Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 block">
                      1. KCSE Result Slip
                    </span>
                    <label className="flex items-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <UploadCloud size={16} className="text-blue-600 shrink-0" />
                      <span className="text-[10px] text-slate-600 truncate font-mono">
                        {docKcseSlip}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocKcseSlip(file.name);
                        }}
                      />
                    </label>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 block">
                      2. National ID / Birth Cert
                    </span>
                    <label className="flex items-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <UploadCloud size={16} className="text-blue-600 shrink-0" />
                      <span className="text-[10px] text-slate-600 truncate font-mono">
                        {docNationalId}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocNationalId(file.name);
                        }}
                      />
                    </label>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 block">
                      3. Passport Photograph
                    </span>
                    <label className="flex items-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <UploadCloud size={16} className="text-blue-600 shrink-0" />
                      <span className="text-[10px] text-slate-600 truncate font-mono">
                        {docPassportPhoto}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocPassportPhoto(file.name);
                        }}
                      />
                    </label>
                  </div>
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

      {/* INLINE MISSING DOCUMENTS REQUEST MODAL */}
      {docRequestApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#102D50]">
              Request Missing Documents · {docRequestApp.applicationNumber}
            </h3>
            <p className="text-xs text-slate-600">
              Specify the missing certificates or verification documents for{' '}
              <strong>{docRequestApp.applicantName}</strong>.
            </p>
            <textarea
              rows={3}
              value={docRequestNote}
              onChange={(e) => setDocRequestNote(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocRequestApp(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = docRequestApp;
                  setDocRequestApp(null);
                  await handleUpdateStatus(target.id, "DOCUMENTS_REQUIRED", docRequestNote);
                }}
                className="rounded-xl bg-[#B83232] px-4 py-2 text-xs font-semibold text-white"
              >
                Send Document Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL ADMISSION OFFER LETTER MODAL */}
      <AdmissionOfferLetterModal
        application={selectedOfferApp}
        onClose={() => setSelectedOfferApp(null)}
      />
    </div>
  );
}
