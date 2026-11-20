import React, { type ReactNode } from 'react';
import { CheckCircle2, CloudOff, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import type { SaveState } from './useExamSession';

interface SecureExamLayoutProps {
  title: string;
  subject: string;
  candidateName?: string;
  candidateRegNo?: string;
  durationMinutes?: number;
  remainingSeconds: number;
  saveState: SaveState;
  securityLevel?: 'LEVEL_1_WEB' | 'LEVEL_2_LOCKED';
  children: ReactNode;
  onSubmit: () => void;
}

export function formatExamCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export default function SecureExamLayout({
  title,
  subject,
  candidateName,
  candidateRegNo,
  durationMinutes,
  remainingSeconds,
  saveState,
  securityLevel = 'LEVEL_1_WEB',
  children,
  onSubmit,
}: SecureExamLayoutProps) {
  const isCriticalTime = remainingSeconds <= 300;

  return (
    <main className="min-h-screen flex flex-col bg-[#F6F8FB] text-[#25364A] select-none">
      {/* Isolated Secure Exam Header — No Portal Sidebar or External Navigation */}
      <header className="min-h-[72px] px-4 sm:px-8 py-3 bg-[#102D50] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c406d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white text-[#102D50] font-extrabold text-sm grid place-items-center shrink-0">
            HT
          </div>
          <div>
            <strong className="block text-sm font-bold tracking-tight">HI-TECH COLLEGE</strong>
            <span className="block text-xs text-blue-200">
              Secure Examination Environment ·{' '}
              {securityLevel === 'LEVEL_2_LOCKED'
                ? 'Level 2 Locked Mode'
                : 'Level 1 Web Secure Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-emerald-300">
            <Lock size={13} className="text-emerald-300" aria-hidden="true" />
            <span>SECURE EXAM MODE</span>
          </span>

          <div
            className={`min-w-[128px] px-3.5 py-2 rounded-lg text-center border ${
              isCriticalTime
                ? 'bg-[#762B2B] border-red-400/50 text-white'
                : 'bg-[#1D3B60] border-white/15 text-white'
            }`}
            aria-live="off"
          >
            <small className="block text-[10px] font-semibold text-blue-200 tracking-wider">
              TIME REMAINING
            </small>
            <strong className="block text-xl font-bold font-mono tabular-nums mt-0.5">
              {formatExamCountdown(remainingSeconds)}
            </strong>
          </div>
        </div>
      </header>

      {/* Examination Heading & Candidate / Autosave Status Strip */}
      <section className="px-4 sm:px-8 py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-slate-500">{subject}</p>
          <h1 className="text-xl font-bold text-[#102D50] tracking-tight">{title}</h1>
          {(candidateName || durationMinutes) && (
            <p className="text-xs text-slate-600 font-mono">
              {candidateName ? `Candidate: ${candidateName}` : ''}
              {candidateRegNo ? ` (${candidateRegNo})` : ''}
              {durationMinutes ? ` · Duration: ${durationMinutes} Minutes` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-medium" role="status">
          {saveState === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>All answers saved</span>
            </span>
          )}
          {saveState === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-[#1769AA] font-semibold">
              <RefreshCw size={14} aria-hidden="true" />
              <span>Saving answers…</span>
            </span>
          )}
          {saveState === 'offline' && (
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
              <CloudOff size={14} aria-hidden="true" />
              <span>Offline — recovery copy stored</span>
            </span>
          )}
          {saveState === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-red-700 font-semibold">
              <CloudOff size={14} aria-hidden="true" />
              <span>Save failed — reconnect to sync</span>
            </span>
          )}
        </div>
      </section>

      {/* Isolated Examination Content Workspace */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-6">{children}</div>

      {/* Secure Exam Footer */}
      <footer className="px-4 sm:px-8 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-[#1769AA]" aria-hidden="true" />
          <span>HI-TECH College · Examination Services · Monitored Session</span>
        </span>
        <button
          type="button"
          onClick={onSubmit}
          className="min-h-[42px] px-5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#102D50] text-white font-semibold whitespace-nowrap shrink-0 transition-colors"
        >
          Submit examination
        </button>
      </footer>
    </main>
  );
}
