import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCheck,
  Megaphone,
  MessageSquare,
  Send,
  Wifi,
} from 'lucide-react';
import type {
  ExamChatMessage,
  ExamMessagePriority,
  ExamMessagingConnectionState,
} from '../../student/exams/secure/examTypes';

export interface SupervisorChannelSessionSummary {
  id: string;
  examId: string;
  examTitle: string;
  unitCode: string;
  studentRegNo: string;
  studentName: string;
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED';
  isDisconnected: boolean;
}

interface SupervisorMessagingPanelProps {
  sessions: SupervisorChannelSessionSummary[];
  messages: ExamChatMessage[];
  connectionState: ExamMessagingConnectionState;
  sending: boolean;
  errorMessage?: string;
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onSendInstruction: (input: {
    sessionId: string;
    body: string;
    priority: ExamMessagePriority;
    targetStudentName?: string;
    targetStudentRegNo?: string;
    targetExamTitle?: string;
  }) => Promise<unknown> | void;
  onBroadcastInstruction: (input: {
    examId: string;
    body: string;
    priority: ExamMessagePriority;
  }) => Promise<unknown> | void;
  onMarkSessionRead: (sessionId: string) => void;
}

const SUPERVISOR_TEMPLATES = [
  'Please stay in fullscreen mode and keep focus on your exam window.',
  'Your answers are autosaved continuously. Continue with your examination.',
  'Clarification: Show all intermediate steps cleanly in the structured answer box.',
];

export default function SupervisorMessagingPanel({
  sessions,
  messages,
  connectionState,
  sending,
  errorMessage,
  selectedSessionId,
  onSelectSession,
  onSendInstruction,
  onBroadcastInstruction,
  onMarkSessionRead,
}: SupervisorMessagingPanelProps) {
  const [channelSearch, setChannelSearch] = useState('');
  const [composerMode, setComposerMode] = useState<'direct' | 'broadcast'>('direct');
  const [draftBody, setDraftBody] = useState('');
  const [priority, setPriority] = useState<ExamMessagePriority>('NORMAL');
  const [broadcastExamId, setBroadcastExamId] = useState<string>('');

  const availableExams = useMemo(() => {
    const byId = new Map<string, { examId: string; examTitle: string; unitCode: string }>();
    for (const s of sessions) {
      if (!byId.has(s.examId)) {
        byId.set(s.examId, { examId: s.examId, examTitle: s.examTitle, unitCode: s.unitCode });
      }
    }
    return Array.from(byId.values());
  }, [sessions]);

  useEffect(() => {
    if (!broadcastExamId && availableExams.length > 0) {
      setBroadcastExamId(availableExams[0].examId);
    }
  }, [availableExams, broadcastExamId]);

  const sortedChannels = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    const filtered = sessions.filter((s) => {
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.studentRegNo.toLowerCase().includes(q) ||
        s.examTitle.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });

    return filtered
      .map((s) => {
        const sessionMsgs = messages.filter((m) => m.sessionId === s.id);
        const unreadFromStudent = sessionMsgs.filter(
          (m) => m.senderRole === 'STUDENT' && !m.readBySupervisor
        ).length;
        const latestMsg = sessionMsgs[sessionMsgs.length - 1];
        return {
          session: s,
          unreadFromStudent,
          totalCount: sessionMsgs.length,
          latestMsg,
        };
      })
      .sort((a, b) => {
        if (b.unreadFromStudent !== a.unreadFromStudent) {
          return b.unreadFromStudent - a.unreadFromStudent;
        }
        if (a.session.status === 'ACTIVE' && b.session.status !== 'ACTIVE') return -1;
        if (a.session.status !== 'ACTIVE' && b.session.status === 'ACTIVE') return 1;
        return (b.latestMsg?.createdAt ?? '').localeCompare(a.latestMsg?.createdAt ?? '');
      });
  }, [sessions, messages, channelSearch]);

  const activeSession =
    sessions.find((s) => s.id === selectedSessionId) ??
    sortedChannels[0]?.session ??
    null;

  const activeThread = useMemo(() => {
    if (!activeSession) return [];
    return messages.filter((m) => m.sessionId === activeSession.id);
  }, [messages, activeSession]);

  const activeUnreadCount = activeThread.filter(
    (m) => m.senderRole === 'STUDENT' && !m.readBySupervisor
  ).length;

  const totalUnreadHelp = messages.filter(
    (m) => m.senderRole === 'STUDENT' && !m.readBySupervisor
  ).length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftBody.trim();
    if (!trimmed) return;

    if (composerMode === 'broadcast') {
      const targetExamId = broadcastExamId || availableExams[0]?.examId;
      if (!targetExamId) return;
      await onBroadcastInstruction({
        examId: targetExamId,
        body: trimmed,
        priority,
      });
      setDraftBody('');
      setPriority('NORMAL');
      return;
    }

    if (!activeSession) return;
    await onSendInstruction({
      sessionId: activeSession.id,
      body: trimmed,
      priority,
      targetStudentName: activeSession.studentName,
      targetStudentRegNo: activeSession.studentRegNo,
      targetExamTitle: activeSession.examTitle,
    });
    onMarkSessionRead(activeSession.id);
    setDraftBody('');
    setPriority('NORMAL');
  };

  return (
    <section
      aria-labelledby="supervisor-live-messaging-title"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Real-Time Proctoring Communications · WebSocket Channel
          </p>
          <h3
            id="supervisor-live-messaging-title"
            className="text-base font-bold text-[#092c60] flex items-center gap-2 mt-0.5"
          >
            <MessageSquare size={17} className="text-[#1769AA]" aria-hidden="true" />
            <span>Candidate Help Requests &amp; Direct Instructions</span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg border ${
              connectionState === 'connected'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : connectionState === 'reconnecting'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <Wifi size={13} aria-hidden="true" />
            <span>
              {connectionState === 'connected'
                ? 'Live WebSocket Connected'
                : connectionState === 'reconnecting'
                ? 'Reconnecting Socket…'
                : connectionState === 'preview'
                ? 'Interactive Preview Channel'
                : 'Connecting Socket…'}
            </span>
          </span>

          <span className="font-mono tabular-nums px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-semibold">
            {totalUnreadHelp} unread help request(s)
          </span>
        </div>
      </div>

      {/* 2-Column Messaging Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Candidate Channel List */}
        <div className="lg:col-span-4 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Candidate Channels</span>
            <input
              type="text"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Filter candidate or session..."
              aria-label="Filter messaging channels"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="divide-y divide-slate-200 max-h-[380px] overflow-y-auto">
            {sortedChannels.length === 0 ? (
              <p className="p-4 text-xs text-slate-500">No candidate channels found.</p>
            ) : (
              sortedChannels.map(({ session, unreadFromStudent, totalCount, latestMsg }) => {
                const isSelected = activeSession?.id === session.id;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      onSelectSession(session.id);
                      if (unreadFromStudent > 0) onMarkSessionRead(session.id);
                    }}
                    className={`w-full text-left p-3.5 transition-colors space-y-1 ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-l-[#1769AA]'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <strong className="font-semibold text-slate-900 truncate">
                        {session.studentName}
                      </strong>
                      {unreadFromStudent > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-700 text-white font-mono tabular-nums text-[11px] font-bold shrink-0">
                          {unreadFromStudent} new
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums text-[11px] text-slate-500 shrink-0">
                          {totalCount} msg
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 flex items-center justify-between gap-2">
                      <span>{session.studentRegNo}</span>
                      <span
                        className={
                          session.status === 'ACTIVE'
                            ? session.isDisconnected
                              ? 'text-amber-700 font-semibold'
                              : 'text-emerald-700 font-semibold'
                            : 'text-slate-500'
                        }
                      >
                        {session.isDisconnected ? 'DISCONNECTED' : session.status}
                      </span>
                    </div>
                    {latestMsg && (
                      <p className="text-[11px] text-slate-600 truncate">{latestMsg.body}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Conversation & Instruction Composer */}
        <div className="lg:col-span-8 border border-slate-200 rounded-xl flex flex-col overflow-hidden bg-white">
          {/* Active Thread Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {activeSession ? (
              <div>
                <strong className="text-slate-900 font-bold">
                  {activeSession.studentName} ({activeSession.studentRegNo})
                </strong>
                <span className="block text-slate-500 font-mono text-[11px]">
                  {activeSession.examTitle} · Session {activeSession.id}
                </span>
              </div>
            ) : (
              <span className="text-slate-500">Select a candidate session to message.</span>
            )}

            {activeSession && activeUnreadCount > 0 && (
              <button
                type="button"
                onClick={() => onMarkSessionRead(activeSession.id)}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <CheckCheck size={13} aria-hidden="true" />
                <span>Mark Help Read</span>
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 min-h-[220px] max-h-[280px] overflow-y-auto p-4 space-y-3 bg-slate-50/40 text-xs">
            {activeThread.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">
                No messages exchanged in this session yet. Send a direct instruction below.
              </p>
            ) : (
              activeThread.map((msg) => {
                const isSupervisor = msg.senderRole === 'SUPERVISOR';
                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isSupervisor
                        ? 'bg-blue-50/80 border-blue-200 ml-6'
                        : msg.priority === 'URGENT'
                        ? 'bg-amber-50 border-amber-300 mr-6'
                        : 'bg-white border-slate-200 mr-6'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-[#092c60] inline-flex items-center gap-1.5">
                        {msg.priority === 'URGENT' && (
                          <AlertTriangle
                            size={12}
                            className="text-amber-700"
                            aria-hidden="true"
                          />
                        )}
                        <span>
                          {isSupervisor
                            ? `${msg.senderName} · Direct Instruction`
                            : `${msg.studentName} · Help Request`}
                        </span>
                        {msg.priority === 'URGENT' && (
                          <span className="font-mono text-red-700 font-bold">URGENT</span>
                        )}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{msg.body}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Instruction Composer (Direct or Cohort Broadcast) */}
          <form
            onSubmit={(e) => void handleSend(e)}
            className="p-4 border-t border-slate-200 bg-white space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setComposerMode('direct')}
                  className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1.5 ${
                    composerMode === 'direct'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  <Send size={12} aria-hidden="true" />
                  <span>Direct to Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode('broadcast')}
                  className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1.5 ${
                    composerMode === 'broadcast'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  <Megaphone size={12} aria-hidden="true" />
                  <span>Broadcast to Exam Cohort</span>
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['NORMAL', 'URGENT'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      priority === level
                        ? level === 'URGENT'
                          ? 'bg-red-700 text-white'
                          : 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {level === 'URGENT' ? 'Urgent Alert' : 'Normal Instruction'}
                  </button>
                ))}
              </div>
            </div>

            {composerMode === 'broadcast' && availableExams.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label
                  htmlFor="supervisor-broadcast-exam"
                  className="font-semibold text-slate-700 shrink-0"
                >
                  Target Active Exam:
                </label>
                <select
                  id="supervisor-broadcast-exam"
                  value={broadcastExamId}
                  onChange={(e) => setBroadcastExamId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {availableExams.map((ex) => (
                    <option key={ex.examId} value={ex.examId}>
                      {ex.unitCode} · {ex.examTitle}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {SUPERVISOR_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setDraftBody(tpl)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700"
                >
                  {tpl.length > 48 ? `${tpl.slice(0, 48)}…` : tpl}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                maxLength={1000}
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder={
                  composerMode === 'broadcast'
                    ? 'Enter instruction to broadcast to all active candidates in this exam...'
                    : activeSession
                    ? `Send direct instruction to ${activeSession.studentName}...`
                    : 'Select a candidate session first...'
                }
                aria-label="Supervisor instruction message"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
              <button
                type="submit"
                disabled={
                  sending ||
                  !draftBody.trim() ||
                  (composerMode === 'direct' && !activeSession)
                }
                className="min-h-[38px] px-4 py-2 rounded-lg bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Send size={13} aria-hidden="true" />
                <span>
                  {sending
                    ? 'Sending…'
                    : composerMode === 'broadcast'
                    ? 'Broadcast Instruction'
                    : 'Send Instruction'}
                </span>
              </button>
            </div>

            {errorMessage && (
              <p role="alert" className="text-[11px] text-red-700 font-medium">
                {errorMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
