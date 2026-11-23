import React, { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Lock,
  Maximize2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  X,
} from 'lucide-react';
import { useExamSecurity, type UseExamSecurityOptions } from '../../hooks/useExamSecurity';
import type {
  ExamChatMessage,
  ExamMessageKind,
  ExamMessagePriority,
  ExamMessagingConnectionState,
  ExamSecurityEvent,
} from '../../exams/secure/examTypes';
import type { SaveState } from '../../exams/secure/useExamSession';

export interface SecureExamLayoutProps {
  title: string;
  subject: string;
  candidateName?: string;
  candidateRegNo?: string;
  durationMinutes?: number;
  remainingSeconds: number;
  saveState: SaveState;
  securityLevel?: 'LEVEL_1_WEB' | 'LEVEL_2_LOCKED';
  enableSecurity?: boolean;
  securityOptions?: Omit<UseExamSecurityOptions, 'enabled' | 'onSecurityEvent'>;
  onSecurityEvent?: (event: ExamSecurityEvent) => void;
  isFullscreen?: boolean;
  onReenterFullscreen?: () => void;
  securityWarning?: string;
  onDismissWarning?: () => void;
  messages?: ExamChatMessage[];
  messagingConnection?: ExamMessagingConnectionState;
  unreadSupervisorCount?: number;
  sendingHelpMessage?: boolean;
  messagingError?: string;
  onSendHelpMessage?: (input: {
    body: string;
    priority: ExamMessagePriority;
    kind?: ExamMessageKind;
  }) => Promise<unknown> | void;
  onMarkMessagesRead?: () => void;
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

const QUICK_HELP_PROMPTS = [
  'Requesting supervisor assistance with a question diagram or wording.',
  'Experiencing temporary network or browser display issues.',
  'Need clarification on examination submission instructions.',
];

export default function SecureExamLayout({
  title,
  subject,
  candidateName,
  candidateRegNo,
  durationMinutes,
  remainingSeconds,
  saveState,
  securityLevel = 'LEVEL_1_WEB',
  enableSecurity = true,
  securityOptions,
  onSecurityEvent,
  isFullscreen,
  onReenterFullscreen,
  securityWarning,
  onDismissWarning,
  messages = [],
  messagingConnection = 'connected',
  unreadSupervisorCount,
  sendingHelpMessage = false,
  messagingError,
  onSendHelpMessage,
  onMarkMessagesRead,
  children,
  onSubmit,
}: SecureExamLayoutProps) {
  const security = useExamSecurity({
    enabled: enableSecurity,
    requireFullscreen: securityOptions?.requireFullscreen ?? true,
    blockCopy: securityOptions?.blockCopy ?? true,
    blockPaste: securityOptions?.blockPaste ?? true,
    blockCut: securityOptions?.blockCut ?? true,
    blockContextMenu: securityOptions?.blockContextMenu ?? true,
    blockShortcuts: securityOptions?.blockShortcuts ?? true,
    trackTabSwitching: securityOptions?.trackTabSwitching ?? true,
    trackFullscreenExit: securityOptions?.trackFullscreenExit ?? true,
    onSecurityEvent,
  });

  const [helpOpen, setHelpOpen] = useState(false);
  const [draftBody, setDraftBody] = useState('');
  const [draftPriority, setDraftPriority] = useState<ExamMessagePriority>('NORMAL');
  const [localSendFeedback, setLocalSendFeedback] = useState('');

  const effectiveIsFullscreen = isFullscreen ?? (enableSecurity ? security.isFullscreen : true);
  const handleReenterFullscreen =
    onReenterFullscreen ??
    (() => {
      void security.enterFullscreen();
    });

  const isCriticalTime = remainingSeconds <= 300;

  const computedUnreadSupervisor =
    unreadSupervisorCount ??
    messages.filter((m) => m.senderRole === 'SUPERVISOR' && !m.readByStudent).length;

  const latestUnreadInstruction = [...messages]
    .reverse()
    .find((m) => m.senderRole === 'SUPERVISOR' && !m.readByStudent);

  useEffect(() => {
    if (helpOpen && computedUnreadSupervisor > 0) {
      onMarkMessagesRead?.();
    }
  }, [helpOpen, computedUnreadSupervisor, onMarkMessagesRead]);

  useEffect(() => {
    if (!helpOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [helpOpen]);

  const handleOpenHelp = () => {
    setHelpOpen(true);
    setLocalSendFeedback('');
    onMarkMessagesRead?.();
  };

  const handleSubmitHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftBody.trim();
    if (!trimmed) return;
    if (!onSendHelpMessage) {
      setLocalSendFeedback('Supervisor channel is initialized once a live session is active.');
      return;
    }
    await onSendHelpMessage({
      body: trimmed,
      priority: draftPriority,
      kind: 'HELP_REQUEST',
    });
    setDraftBody('');
    setDraftPriority('NORMAL');
    setLocalSendFeedback('');
  };

  return (
    <main
      data-secure-exam-shell="locked"
      className="min-h-screen w-full flex flex-col bg-[#F6F8FB] text-[#25364A] select-none"
    >
      {/* Locked-down Secure Exam Header — Portal Sidebar & Global Navigation Hidden */}
      <header className="w-full min-h-[72px] px-4 sm:px-8 py-3 bg-[#102D50] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c406d]">
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

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleOpenHelp}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              computedUnreadSupervisor > 0
                ? 'bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400'
                : 'bg-[#1D3B60] hover:bg-[#264c7a] border-white/20 text-white'
            }`}
          >
            <MessageSquare size={14} aria-hidden="true" />
            <span>Ask Supervisor</span>
            {computedUnreadSupervisor > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-slate-950 text-white font-mono tabular-nums text-[11px]">
                {computedUnreadSupervisor}
              </span>
            )}
          </button>

          {!effectiveIsFullscreen && (
            <button
              type="button"
              onClick={handleReenterFullscreen}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/40 text-amber-100 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Maximize2 size={13} aria-hidden="true" />
              <span>Re-enter Fullscreen</span>
            </button>
          )}

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

      {/* Examination Title, Candidate Details & Autosave Telemetry Strip */}
      <section className="w-full px-4 sm:px-8 py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
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

        <div className="flex items-center gap-4 text-xs font-medium" role="status">
          {enableSecurity && !security.isWindowFocused && (
            <span className="text-amber-700 font-semibold">Focus loss detected</span>
          )}
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

      {/* Full-Width Isolated Examination Content Workspace */}
      <div className="flex-1 w-full px-4 sm:px-8 py-6">
        {/* Live Supervisor Instruction Alert Banner */}
        {latestUnreadInstruction && (
          <div
            role="status"
            className={`mb-5 p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              latestUnreadInstruction.priority === 'URGENT'
                ? 'bg-red-50 border-red-300 text-red-950'
                : 'bg-blue-50 border-blue-300 text-[#102D50]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {latestUnreadInstruction.priority === 'URGENT' ? (
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-700" aria-hidden="true" />
              ) : (
                <MessageSquare size={16} className="shrink-0 mt-0.5 text-[#1769AA]" aria-hidden="true" />
              )}
              <div className="space-y-0.5">
                <strong className="font-bold block">
                  {latestUnreadInstruction.priority === 'URGENT'
                    ? 'Urgent Supervisor Instruction'
                    : 'Supervisor Instruction'}{' '}
                  · {latestUnreadInstruction.senderName}
                </strong>
                <p className="leading-relaxed">{latestUnreadInstruction.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenHelp}
                className="px-3 py-1.5 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold whitespace-nowrap"
              >
                Open Messages
              </button>
              {onMarkMessagesRead && (
                <button
                  type="button"
                  onClick={onMarkMessagesRead}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold whitespace-nowrap"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        )}

        {securityWarning && (
          <div
            className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
              <span>{securityWarning}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReenterFullscreen}
                className="px-3 py-1.5 rounded-lg border border-amber-400 bg-white text-amber-900 font-semibold inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Maximize2 size={12} aria-hidden="true" />
                <span>Re-enter Fullscreen</span>
              </button>
              {onDismissWarning && (
                <button
                  type="button"
                  onClick={onDismissWarning}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 font-semibold whitespace-nowrap"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {children}
      </div>

      {/* Secure Exam Footer */}
      <footer className="w-full px-4 sm:px-8 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-500">
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

      {/* Real-Time Supervisor Assistance & Instructions Drawer */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end"
          role="presentation"
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-help-drawer-title"
            className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col text-xs text-slate-800"
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 bg-[#102D50] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-blue-200 flex items-center gap-1.5">
                  <Wifi size={12} aria-hidden="true" />
                  <span>
                    {messagingConnection === 'connected'
                      ? 'Live Supervisor Channel Connected'
                      : messagingConnection === 'reconnecting'
                      ? 'Reconnecting to Supervisor Channel…'
                      : messagingConnection === 'preview'
                      ? 'Supervisor Channel Ready'
                      : 'Connecting Supervisor Channel…'}
                  </span>
                </p>
                <h2 id="exam-help-drawer-title" className="text-sm font-bold truncate mt-0.5">
                  Supervisor Help &amp; Live Instructions
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close supervisor help drawer"
                className="p-1.5 rounded-lg text-blue-100 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
              {messages.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-white text-slate-600 space-y-1">
                  <strong className="text-slate-900 block">Direct Examination Invigilator Desk</strong>
                  <p className="leading-relaxed">
                    Use this private channel if you experience a technical problem, screen issue, or
                    need clarification on an examination question. Supervisors respond directly here
                    without leaving Secure Exam Mode.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isStudent = msg.senderRole === 'STUDENT';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl border space-y-1.5 ${
                        isStudent
                          ? 'bg-white border-slate-200 ml-6'
                          : msg.priority === 'URGENT'
                          ? 'bg-red-50 border-red-300 mr-4'
                          : 'bg-blue-50 border-blue-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-[#102D50]">
                          {isStudent ? 'You (Candidate)' : `${msg.senderName} · Supervisor`}
                          {msg.priority === 'URGENT' ? ' · URGENT' : ''}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed select-text">{msg.body}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Help Templates + Composer */}
            <form
              onSubmit={(e) => void handleSubmitHelp(e)}
              className="p-4 bg-white border-t border-slate-200 space-y-3 shrink-0"
            >
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Quick Help Prompts
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_HELP_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setDraftBody(prompt)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 text-left"
                    >
                      {prompt.length > 44 ? `${prompt.slice(0, 44)}…` : prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label htmlFor="student-help-input" className="font-semibold text-slate-900">
                  Message to Supervisor
                </label>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md text-[11px]">
                  {(['NORMAL', 'URGENT'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDraftPriority(level)}
                      className={`px-2 py-0.5 rounded font-semibold ${
                        draftPriority === level
                          ? level === 'URGENT'
                            ? 'bg-red-700 text-white'
                            : 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {level === 'URGENT' ? 'Urgent' : 'Standard'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="student-help-input"
                rows={3}
                maxLength={1000}
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder="Describe your technical issue or question clarification request..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 select-text focus:outline-none focus:border-[#1769AA]"
              />

              {(messagingError || localSendFeedback) && (
                <p role="alert" className="text-[11px] text-red-700 font-medium">
                  {messagingError || localSendFeedback}
                </p>
              )}

              <button
                type="submit"
                disabled={sendingHelpMessage || !draftBody.trim()}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#1769AA] hover:bg-[#102D50] disabled:opacity-50 text-white font-semibold inline-flex items-center justify-center gap-2"
              >
                <Send size={14} aria-hidden="true" />
                <span>{sendingHelpMessage ? 'Sending…' : 'Send Help Request'}</span>
              </button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
