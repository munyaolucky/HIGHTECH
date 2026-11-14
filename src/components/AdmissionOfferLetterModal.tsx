import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Award,
  CheckCircle2,
  Calendar,
  FileCheck2,
  GraduationCap,
} from 'lucide-react';
import { AdmissionApplication } from '../types';

interface AdmissionOfferLetterModalProps {
  application: AdmissionApplication | null;
  onClose: () => void;
}

export default function AdmissionOfferLetterModal({
  application,
  onClose,
}: AdmissionOfferLetterModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!application) return null;

  const handlePrint = () => {
    window.print();
  };

  const offerRef = `HCA/OFFER/2026/${application.applicationReference.replace('HCA/APP/2026/', '')}`;

  const handleDownloadText = () => {
    const text = `
================================================================================
                HI-TECH COLLEGE OF ACADEMIA & TECHNOLOGY
             DIRECTORATE OF ADMISSIONS & STUDENT ENROLMENT
================================================================================
Reference: ${offerRef}
Date     : ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}

TO:
${application.applicantName.toUpperCase()}
National ID / Index: ${application.nationalIdOrIndex}
Email: ${application.email}
Phone: ${application.phoneNumber}

SUBJECT: PROVISIONAL OFFER OF ADMISSION - 2026 ACADEMIC YEAR
--------------------------------------------------------------------------------
Dear ${application.applicantName},

Following your application and academic review of your credentials (Mean Grade: ${application.meanGrade}),
we are pleased to offer you admission to HI-TECH COLLEGE for the following programme:

Programme Name : ${application.targetProgramme}
Reporting Campus: ${application.targetCampus}
Intake Session : ${application.intake}
Tuition Schedule: KES 45,000.00 per semester (Paybill 890123 / Acc: ${application.applicationReference})

REPORTING INSTRUCTIONS:
1. You are required to report to the campus Admissions Office by 8:30 AM on reporting date.
2. Present original and copies of National ID / Birth Certificate, KCSE Result Slip,
   and two recent passport-size photographs.
3. Pay the registration and tuition commitment fee to secure your biometric seat.

We congratulate you on your academic achievements and welcome you to the HI-TECH family.

Yours sincerely,

Dr. Margaret Nduta, PhD
Registrar, Academic Affairs
HI-TECH COLLEGE
================================================================================
    `.trim();

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Admission_Offer_Letter_${application.applicantName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
        {/* MODAL ACTION BAR */}
        <div className="bg-[#092c60] text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-amber-400" size={18} />
            <h2 className="text-sm font-bold tracking-tight">Formal Letter of Admission Offer</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer size={14} /> Print Letter
            </button>
            <button
              onClick={handleDownloadText}
              type="button"
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#092c60] rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download size={14} /> Download (.txt)
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE LETTER CONTENT */}
        <div ref={printableRef} className="p-8 sm:p-12 space-y-6 text-slate-800 bg-white font-serif">
          {/* INSTITUTION LETTERHEAD */}
          <div className="text-center border-b-2 border-[#092c60] pb-5">
            <div className="w-12 h-12 bg-[#092c60] text-amber-400 rounded-xl mx-auto flex items-center justify-center mb-2 shadow">
              <GraduationCap size={28} />
            </div>
            <h1 className="text-xl font-black tracking-tight text-[#092c60] font-sans">
              HI-TECH COLLEGE OF ACADEMIA &amp; TECHNOLOGY
            </h1>
            <p className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Directorate of Admissions &amp; Enrolment · Nairobi, Kenya
            </p>
            <p className="text-[10px] font-sans text-slate-400">
              Approved by TVETA (TVETA/ACC/2024/0912) · Examining Centers: KNEC, TVET CDACC, KASNEB
            </p>
          </div>

          {/* METADATA & RECIPIENT */}
          <div className="flex justify-between items-start text-xs font-sans">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Applicant Details</span>
              <strong className="text-slate-900 text-sm block mt-0.5 font-sans">{application.applicantName}</strong>
              <span className="text-slate-600 font-mono block">ID / Index: {application.nationalIdOrIndex}</span>
              <span className="text-slate-500 block">{application.email} · {application.phoneNumber}</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Admission Reference</span>
              <span className="font-mono font-bold text-blue-900 block mt-0.5">{offerRef}</span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* LETTER BODY */}
          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            <div className="font-sans font-bold text-sm text-[#092c60] border-b pb-1">
              RE: PROVISIONAL OFFER OF ADMISSION TO {application.targetProgramme.toUpperCase()}
            </div>

            <p>
              Dear <strong className="font-sans text-slate-900">{application.applicantName}</strong>,
            </p>

            <p>
              Following your successful online application through our Central Admissions System and subsequent review of your secondary school completion credentials (Certified Mean Grade: <strong className="font-sans text-blue-900">{application.meanGrade}</strong>), we are pleased to inform you that you have been offered provisional admission to HI-TECH College.
            </p>

            {/* ADMISSION SPECIFICATIONS TABLE */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Programme of Study</span>
                  <strong className="text-slate-900">{application.targetProgramme}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Campus</span>
                  <strong className="text-slate-900">{application.targetCampus}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Intake Session</span>
                  <strong className="text-slate-900">{application.intake}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Provisional Student ID</span>
                  <strong className="text-blue-900 font-mono">
                    {application.generatedStudentRegNo || application.applicationReference}
                  </strong>
                </div>
              </div>
            </div>

            <h4 className="font-sans font-bold text-slate-900 pt-2">Requirements for Official Enrolment:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
              <li>Original and certified copies of your KCSE Certificate / Result Slip.</li>
              <li>Original and copy of National Identity Card or Birth Certificate.</li>
              <li>Two recent passport-size colored photographs on white background.</li>
              <li>Initial semester tuition fee settlement via Paybill <strong className="font-sans font-mono text-slate-900">890123</strong> (Account: Your Application Reference).</li>
            </ol>

            <p>
              Please confirm your acceptance of this offer by logging into the admissions portal and completing your biometric registration conversion.
            </p>
          </div>

          {/* SIGNATURES */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between font-sans">
            <div>
              <div className="w-32 h-10 border-b border-slate-400 flex items-center justify-center italic text-blue-900 font-serif text-sm">
                Dr. M. Nduta
              </div>
              <strong className="text-xs font-bold text-slate-900 block mt-1">Dr. Margaret Nduta, PhD</strong>
              <span className="text-[10px] text-slate-500">Registrar, Academic &amp; Student Affairs</span>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 border-2 border-emerald-600 rounded-full flex flex-col items-center justify-center p-1 text-emerald-800 transform rotate-[-4deg] bg-emerald-50">
                <span className="text-[8px] font-black uppercase">ADMISSIONS</span>
                <span className="text-[10px] font-black">APPROVED</span>
                <span className="text-[7px]">HI-TECH 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition"
          >
            Close Letter
          </button>
        </div>
      </div>
    </div>
  );
}

