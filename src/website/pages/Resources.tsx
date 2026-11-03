import React, { useState } from "react";
import { DOWNLOADABLE_RESOURCES, FAQS_LIST } from "../../data/college";
import {
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface ResourcesProps {
  onOpenPortalModal: () => void;
}

export default function Resources({ onOpenPortalModal }: ResourcesProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleDownload = (title: string) => {
    setDownloadSuccess(title);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3000);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f274a] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-900/60 border border-blue-700/60 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Official Institutional Repository</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Resources, Downloads & FAQs
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Access downloadable academic documents, official fee structures, student handbooks, and answers to common enquiries.
          </p>
        </div>
      </div>

      {/* Download Alert Notification */}
      {downloadSuccess && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Simulated download started: <strong>{downloadSuccess}</strong></span>
            </div>
            <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded font-mono">COMPLETE</span>
          </div>
        </div>
      )}

      {/* Downloadable Documents Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
            Document Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Official College Publications & Forms
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOWNLOADABLE_RESOURCES.map((res) => (
            <div
              key={res.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                    {res.category}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{res.size}</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-[#d92332] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{res.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{res.description}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">{res.fileType} Document</span>
                <button
                  onClick={() => handleDownload(res.title)}
                  className="bg-[#153b70] hover:bg-[#0f274a] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="bg-slate-50 py-12 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500">
              Click any question below to expand the detailed answer.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS_LIST.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-[#153b70] transition"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{faq.question}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Portal Action inside FAQs */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-blue-900">
              <strong>Need immediate portal access?</strong> Use your student registration number or test the live demo.
            </div>
            <button
              onClick={onOpenPortalModal}
              className="bg-[#153b70] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#0f274a] transition whitespace-nowrap"
            >
              Open Student Portal Modal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
