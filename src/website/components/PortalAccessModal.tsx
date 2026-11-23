import React, { useContext, useState } from "react";
import {
  X,
  Lock,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Building2,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { AuthContext } from "../../auth/AuthProvider";
import { getUserDashboardPath } from "../../auth/auth-utils";

interface PortalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchStudentDashboard: () => void;
  onSwitchToERP: (role: string) => void;
  onNavigateToApply: () => void;
}

export default function PortalAccessModal({
  isOpen,
  onClose,
  onLaunchStudentDashboard,
  onSwitchToERP,
  onNavigateToApply,
}: PortalAccessModalProps) {
  const authCtx = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<"signin" | "guide">("signin");
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber.trim() || !password) {
      setLoginError("Please enter your Registration Number / Email and Password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: regNumber.trim(),
          password,
          rememberMe: false,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setLoginError(json?.error || "Invalid email/registration number or password.");
        return;
      }

      const data = json.data as {
        mfaRequired?: boolean;
        destination?: string;
        user?: { primaryRole?: string };
      };

      if (data.mfaRequired) {
        onClose();
        onSwitchToERP("portal-login");
        return;
      }

      const refreshedUser = authCtx ? await authCtx.refreshSession() : null;
      const dest = refreshedUser ? getUserDashboardPath(refreshedUser) : data.destination;
      onClose();

      if (dest === "/portal/student") {
        onLaunchStudentDashboard();
      } else if (dest) {
        onSwitchToERP(dest);
      } else {
        onLaunchStudentDashboard();
      }
    } catch {
      setLoginError("Unable to reach authentication service. Please use the Unified Portal Login page.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = () => {
    onLaunchStudentDashboard();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#0f274a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">HI-TECH College Student Portal</h3>
              <p className="text-xs text-blue-200">Integrated Digital Academic & Certification Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === "signin"
                ? "border-[#153b70] text-[#153b70] bg-white font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Student Sign-In</span>
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === "guide"
                ? "border-[#153b70] text-[#153b70] bg-white font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>How Can Students Get Portal?</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === "signin" ? (
            <div className="space-y-4">
              {/* Notice Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Official Student Authentication</strong>: Access your real-time academic records, registered units, exam transcripts, and M-Pesa fee receipts using your official registration number.
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Registration Number
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. HCA/STU/2026/001"
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Issued on your official admission letter (Format: HCA/STU/YYYY/SEQ)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password / Student PIN
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter portal password"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#153b70] hover:bg-[#0f274a] text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <span>Authenticating Student Record...</span>
                  ) : (
                    <>
                      <span>Sign In to Student Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Instant 1-Click Demo Shortcut & Full Student / Unified Portal Sign In */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToERP("student-login");
                    }}
                    className="w-full bg-[#1769AA] hover:bg-[#102D50] text-white py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>Dedicated Student Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToERP("portal-login");
                    }}
                    className="w-full bg-[#0f274a] hover:bg-[#1769AA] text-white py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Unified / Staff Login</span>
                  </button>
                </div>
                <button
                  onClick={handleDemoLogin}
                  disabled={isLoggingIn}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between"
                >
                  <div className="text-left">
                    <div>Student Preview Mode: Amina Wanjiku</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-normal">
                      Sample Record: HCA/STU/2026/001 • Diploma in Computer Science
                    </div>
                  </div>
                  <span className="bg-emerald-700 text-white text-[10px] px-2 py-1 rounded font-semibold">
                    Preview
                  </span>
                </button>
              </div>

              {/* Need Account / Alternative Portals */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToApply();
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Don't have a Reg No? Apply Online →
                </button>
                <button
                  onClick={() => setActiveTab("guide")}
                  className="text-slate-600 hover:underline"
                >
                  Read Student Access Guide
                </button>
              </div>
            </div>
          ) : (
            /* Guide Tab: Directly Answers "How can student get portal" */
            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 leading-relaxed">
                <strong>How a Student Gets Their Portal Access:</strong> Every student requires an official Registration Number generated by the College Admissions & Central Reg Engine. Follow these 4 simple steps:
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#153b70] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Apply for Admission</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Submit your application through the college website or in person at the Admissions Office. Provide your KCSE Index Number or national ID and select your course.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#153b70] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Automatic Reg Number Generation</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Upon approval by Admissions & Registrar, the system generates your unique institutional Registration Number in the format <strong className="text-blue-900">HCA/STU/YYYY/SEQ</strong> (e.g. <code>HCA/STU/2026/001</code>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#153b70] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Receive Admission Letter & Default Credentials</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Your official Letter of Admission contains your Registration Number, official student email (<code>@student.hitech.ac.ke</code>), and a default security PIN sent via SMS.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#153b70] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Sign In & Access Full Campus Services</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Click the "Student Portal" button anywhere on the website, type your Reg No, and instantly access: course registration, timetables, M-Pesa fee payments, online CBT assessments, and digital library e-books.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToApply();
                  }}
                  className="w-full sm:flex-1 bg-[#153b70] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-[#0f274a] transition text-center"
                >
                  Apply Online Now (Get Reg No)
                </button>
                <button
                  onClick={handleDemoLogin}
                  className="w-full sm:flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition text-center"
                >
                  Launch Demo Student Portal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Staff & Administration Links */}
        {/* Modal Footer with Staff & Administration Links */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col gap-2.5 text-[11px] text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-[#092c60]">Quick Launch Institutional Role Dashboards:</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400">20 Portals Connected</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToERP("activate-account");
                }}
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-bold"
              >
                <KeyRound className="w-3 h-3" />
                <span>Activate Invited Account</span>
              </button>
            </div>
          </div>

          {/* Persona Direct Jumps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchStudentDashboard();
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-left transition shadow-2xs hover:bg-blue-50/50"
            >
              <strong className="block text-blue-900 font-bold">👩‍🎓 Student Portal</strong>
              <span className="text-[10px] text-slate-500 font-mono">Amina Wanjiku · HCA/STU</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToERP("lecturer");
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-left transition shadow-2xs hover:bg-emerald-50/50"
            >
              <strong className="block text-emerald-900 font-bold">👨‍🏫 Lecturer Portal</strong>
              <span className="text-[10px] text-slate-500 font-mono">Dr. Peter Otieno · HCA/LECT</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToERP("registrar");
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-purple-400 text-left transition shadow-2xs hover:bg-purple-50/50"
            >
              <strong className="block text-purple-900 font-bold">🏛️ Academic Registrar</strong>
              <span className="text-[10px] text-slate-500 font-mono">Dr. Chemweno · TRX Desk</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToERP("finance");
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-400 text-left transition shadow-2xs hover:bg-teal-50/50"
            >
              <strong className="block text-teal-900 font-bold">💳 Finance &amp; M-Pesa</strong>
              <span className="text-[10px] text-slate-500 font-mono">CPA Beatrice · Treasury</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToERP("examination");
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-left transition shadow-2xs hover:bg-indigo-50/50"
            >
              <strong className="block text-indigo-900 font-bold">📝 Examinations &amp; CBT</strong>
              <span className="text-[10px] text-slate-500 font-mono">63 Formats &amp; Timed Runner</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToERP("staff-users");
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-left transition shadow-2xs hover:bg-amber-50/50"
            >
              <strong className="block text-amber-900 font-bold">🛡️ Staff User Admin</strong>
              <span className="text-[10px] text-slate-500 font-mono">Platform Accounts &amp; RBAC</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200 text-[10px] font-semibold text-slate-600">
            <span className="text-slate-400">Other Portals:</span>
            {[
              { role: "staff", label: "Staff Portal (21 Roles)" },
              { role: "admissions", label: "Admissions" },
              { role: "library", label: "Library" },
              { role: "generator", label: "Reg Generator" },
              { role: "hostels", label: "Hostels" },
              { role: "hr", label: "HR Staff" },
              { role: "community", label: "SRC Elections" },
              { role: "engagement", label: "Notices & Careers" },
              { role: "quality-reports", label: "Quality Audit" },
              { role: "campus-services", label: "Credentials CRM" },
              { role: "chatbot-admin", label: "AI Service Desk" },
              { role: "ai-governance", label: "AI Governance" },
              { role: "ai-support", label: "AI Support" },
              { role: "catalogue", label: "Master Blueprint" },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToERP(item.role);
                }}
                className={`px-2 py-0.5 rounded border transition ${
                  item.role === "staff"
                    ? "bg-[#153b70] text-white border-[#153b70] hover:bg-[#0f274a]"
                    : "bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
