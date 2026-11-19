import React, { useState } from "react";
import confetti from "canvas-confetti";
import { COURSES_CATALOGUE, COLLEGE_INFO } from "../../data/college";
import { collegeErpService } from "../../services/collegeErpService";
import { CourseProgramme } from "../../types";
import {
  GraduationCap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Clock,
  Lock,
} from "lucide-react";

interface ApplyProps {
  selectedCourse?: CourseProgramme | null;
  initialProgrammeName?: string;
  onNavigateToPortalGuide: () => void;
  onLaunchStudentDashboard: () => void;
}

export default function Apply({
  selectedCourse,
  initialProgrammeName,
  onNavigateToPortalGuide,
  onLaunchStudentDashboard,
}: ApplyProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [kcseYear, setKcseYear] = useState("2025");
  const [kcseIndex, setKcseIndex] = useState("");
  const [meanGrade, setMeanGrade] = useState("C+");
  const [courseId, setCourseId] = useState(
    selectedCourse?.id || COURSES_CATALOGUE[0].id
  );
  const [customProgramme, setCustomProgramme] = useState<string>(initialProgrammeName || "");
  const [campus, setCampus] = useState(COLLEGE_INFO.campuses[0].name);
  const [intake, setIntake] = useState("May 2026");
  const [mode, setMode] = useState("Full-time");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAppRef, setSubmittedAppRef] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedCourse?.id) {
      setCourseId(selectedCourse.id);
    }
    if (initialProgrammeName) {
      setCustomProgramme(initialProgrammeName);
    }
  }, [selectedCourse, initialProgrammeName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const courseTitle =
      customProgramme && !COURSES_CATALOGUE.some((c) => c.id === courseId && c.title === customProgramme)
        ? customProgramme
        : COURSES_CATALOGUE.find((c) => c.id === courseId)?.title || "Diploma in Information Communication Technology (DICT)";

    try {
      const res = await fetch("/api/admissions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          applicantName: fullName,
          email,
          phone: phoneNumber,
          nationalIdOrIndex: kcseIndex || nationalId || `KCSE-${kcseYear}`,
          programmeName: courseTitle,
          campusName: campus,
          intakeName: `${intake} Intake`,
          studyMode: mode,
          meanGrade,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Unable to submit online application.");
      }

      collegeErpService.submitOnlineApplication({
        applicantName: fullName,
        email,
        phoneNumber,
        nationalIdOrIndex: kcseIndex || nationalId || `KCSE-${kcseYear}`,
        targetProgramme: courseTitle,
        targetCampus: campus,
        intake: `${intake} Intake`,
        meanGrade,
      });

      setSubmittedAppRef(json.data.applicationNumber);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore headless
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Network error submitting application."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCourse = COURSES_CATALOGUE.find((c) => c.id === courseId);

  return (
    <div className="space-y-12 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f274a] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <span>2026 Online Admissions Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Apply for Admission to HI-TECH College
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Fill in the online application form below. Upon submission, you will receive an official application reference number and an automated admission assessment notification.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {submittedAppRef ? (
          /* Submission Success State */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Application Successfully Submitted!
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Congratulations, {fullName}!
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your admission request has been queued in the HI-TECH Admissions & Registrar ERP system.
              </p>
            </div>

            {/* Generated Application Reference */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center space-y-1.5 max-w-md mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Official Application Reference Number
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-[#153b70]">
                {submittedAppRef}
              </div>
              <p className="text-[11px] text-blue-700">
                Programme: <strong>{currentCourse?.title}</strong> ({campus})
              </p>
            </div>

            {/* How Student Gets Portal Explanation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs text-slate-700">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Next Step: How You Get Your Student Portal</span>
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1 leading-relaxed">
                <li>
                  Our Admissions Office verifies your KCSE results ({kcseIndex || "KCSE-2025"}) within 24 business hours.
                </li>
                <li>
                  The <strong>Central Registration Generator</strong> automatically creates your official student identity: <strong className="text-blue-900">HCA/STU/2026/001</strong>.
                </li>
                <li>
                  You receive your official Letter of Admission and initial password via SMS and to <code>{email}</code>.
                </li>
                <li>
                  Click <strong>"Student Portal"</strong> on the website to sign in, pick units, and access digital learning materials!
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onLaunchStudentDashboard}
                className="w-full sm:w-auto bg-[#153b70] hover:bg-[#0f274a] text-white px-6 py-3 rounded-xl font-bold text-xs tracking-wide transition shadow-md flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Try Demo Student Portal Access Now</span>
              </button>

              <button
                onClick={onNavigateToPortalGuide}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl font-semibold text-xs transition"
              >
                Read Portal Access Guide
              </button>
            </div>
          </div>
        ) : (
          /* Application Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-8"
          >
            {/* Step 1: Personal Details */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  1. Applicant Personal Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Legal Name (as on KCSE Certificate) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kelvin Kipchumba"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    National ID / Birth Certificate Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g. 38491024"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kelvin@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Active Mobile Phone Number (SMS Alerts) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0712 345 678"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Academic Qualifications */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  2. Academic Qualifications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    KCSE Year *
                  </label>
                  <select
                    value={kcseYear}
                    onChange={(e) => setKcseYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="Earlier">2021 or Earlier</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    KCSE Index Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kcseIndex}
                    onChange={(e) => setKcseIndex(e.target.value)}
                    placeholder="e.g. 2040182001"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    KCSE Mean Grade *
                  </label>
                  <select
                    value={meanGrade}
                    onChange={(e) => setMeanGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    {["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"].map(
                      (g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Programme Selection */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  3. Course & Campus Choice
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Selected Academic Programme *
                  </label>
                  <select
                    value={customProgramme && !COURSES_CATALOGUE.some((c) => c.title === customProgramme) ? "__custom__" : courseId}
                    onChange={(e) => {
                      if (e.target.value !== "__custom__") {
                        setCustomProgramme("");
                        setCourseId(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {customProgramme && !COURSES_CATALOGUE.some((c) => c.title === customProgramme) && (
                      <option value="__custom__">{customProgramme} (Department Selection)</option>
                    )}
                    {COURSES_CATALOGUE.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} — {c.level} ({c.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preferred Campus *
                  </label>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {COLLEGE_INFO.campuses.map((camp) => (
                      <option key={camp.name} value={camp.name}>
                        {camp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Intake Period *
                  </label>
                  <select
                    value={intake}
                    onChange={(e) => setIntake(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="May 2026">May 2026 Intake</option>
                    <option value="September 2026">September 2026 Intake</option>
                    <option value="January 2027">January 2027 Intake</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Study Mode *
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Full-time">Full-time (Day Classes)</option>
                    <option value="Evening">Evening (5:30 PM - 8:00 PM)</option>
                    <option value="Part-time">Part-time / Weekend</option>
                    <option value="Online">Online / Distance Learning</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Declaration & Submit */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 rounded text-blue-600" />
                <span>
                  I certify that all details provided are accurate and understand that falsification will lead to automatic disqualification. I consent to receive official admission notifications via SMS and email.
                </span>
              </label>

              {submitError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#d92332] hover:bg-[#b81d2a] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Processing Application &amp; Assigning Reg ID...</span>
                ) : (
                  <>
                    <span>Submit Application for 2026 Intake</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
