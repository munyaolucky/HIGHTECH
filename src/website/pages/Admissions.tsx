import React from "react";
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  FileText,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Download,
} from "lucide-react";
import { COLLEGE_INFO } from "../../data/college";

interface AdmissionsProps {
  onNavigate: (page: string) => void;
  onOpenPortalModal: () => void;
}

export default function Admissions({ onNavigate, onOpenPortalModal }: AdmissionsProps) {
  const steps = [
    {
      num: "01",
      title: "Select Course & Check Requirements",
      description: "Review academic programmes to ensure you meet the minimum entry requirements (KCSE C- for Diploma, D for Certificate)."
    },
    {
      num: "02",
      title: "Submit Online Application",
      description: "Complete the online application form or visit any campus admissions office with copies of your KCSE result slip and National ID."
    },
    {
      num: "03",
      title: "Receive Admission Letter & Reg No",
      description: "The Admissions Office generates your official letter of admission containing your unique institutional registration number (HCA/STU/2026/001)."
    },
    {
      num: "04",
      title: "Activate Student Portal & Register Units",
      description: "Log into the Student Portal with your new registration number, pay initial fees via M-Pesa STK, and pick your semester units."
    }
  ];

  const requirementsList = [
    {
      level: "Diploma Programmes (TVET CDACC / KNEC)",
      grades: "KCSE Mean Grade C- (Minus) or relevant Level 5 Certificate",
      duration: "2 - 2.5 Years",
      examBody: "TVET CDACC / KNEC"
    },
    {
      level: "Certificate Programmes (TVET CDACC / KNEC)",
      grades: "KCSE Mean Grade D (Plain) or D- (Minus)",
      duration: "1 Year",
      examBody: "TVET CDACC / KNEC"
    },
    {
      level: "Professional Accounting (KASNEB CPA / ATD)",
      grades: "KCSE Mean Grade C+ with C+ in Maths & English (or ATD for CPA)",
      duration: "Flexible Modular",
      examBody: "KASNEB"
    },
    {
      level: "Short & Digital Literacy Courses",
      grades: "Open to all students, professionals and form four leavers",
      duration: "4 - 8 Weeks",
      examBody: "NITA / HI-TECH"
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Page Header */}
      <div className="bg-[#0f274a] text-white py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <span>2026 Academic Year Admissions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Admissions & Enrolment Process
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Joining HI-TECH College is seamless. Learn about our intake periods, minimum entry qualifications, and how your automated student portal is set up.
          </p>
        </div>
      </div>

      {/* Step by Step Walkthrough */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
            Simple 4-Step Pathway
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How to Apply & Join HI-TECH College
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden"
            >
              <div className="text-3xl font-black text-slate-200">{step.num}</div>
              <h3 className="font-bold text-sm text-slate-900">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Entry Requirements Matrix */}
      <div className="bg-slate-50 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
              Eligibility Criteria
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Minimum Academic Entry Requirements
            </h2>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#153b70] text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Qualification Level</th>
                  <th className="py-3 px-4">KCSE Entry Grade</th>
                  <th className="py-3 px-4">Standard Duration</th>
                  <th className="py-3 px-4">Examining Board</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requirementsList.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{req.level}</td>
                    <td className="py-3.5 px-4 font-semibold text-blue-900">{req.grades}</td>
                    <td className="py-3.5 px-4 text-slate-600">{req.duration}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                        {req.examBody}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Intake Calendar & Required Documents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Intakes */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-slate-900">2026 Intake Schedule</h3>
          </div>
          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">January Intake</span>
                <span className="text-slate-500 text-[11px]">Reporting: First week of January</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                ONGOING
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">May Intake</span>
                <span className="text-slate-500 text-[11px]">Reporting: First week of May</span>
              </div>
              <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                OPEN FOR APPLICATION
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">September Intake</span>
                <span className="text-slate-500 text-[11px]">Reporting: First week of September</span>
              </div>
              <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px]">
                EARLY REGISTRATION
              </span>
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-700" />
            <h3 className="text-lg font-bold text-slate-900">Required Documents Checklist</h3>
          </div>
          <ul className="space-y-2.5 pt-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Copy of KCSE Result Slip / Certificate</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Copy of National ID Card or Birth Certificate</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Two (2) recent passport-sized color photographs</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Copy of School Leaving Certificate from secondary school</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Any prior certificates / transcripts for credit transfer</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-[#153b70] to-[#0f274a] text-white p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold">Ready to Start Your Application?</h3>
            <p className="text-xs text-slate-300">
              Apply online in less than 5 minutes and receive an immediate reference number.
            </p>
          </div>
          <button
            onClick={() => onNavigate("apply")}
            className="bg-[#d92332] hover:bg-[#b81d2a] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-wide transition shadow-md flex items-center gap-2"
          >
            <span>Proceed to Online Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
