import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  LifeBuoy,
  ShieldCheck,
  Send,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  EyeOff,
  FileText,
} from 'lucide-react';
import {
  ASSISTANT_PERSONAS,
  aiSupportCentreService,
  redactSensitiveInput,
} from '../../services/aiSupportCentreService';
import {
  KnowledgeVisibility,
  SupportAssistantRole,
  SupportTicketCategory,
  SupportTicketStatus,
} from '../../types/aiSupportCentre';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

type TabId = 'assistant' | 'knowledge' | 'tickets' | 'quota-privacy';

export default function AISupportCentrePortal() {
  const [role, setRole] = useState<SupportAssistantRole>('STUDENT');
  const [activeTab, setActiveTab] = useSyncedPortalTab<TabId>('ai-support', 'assistant');
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const persona = ASSISTANT_PERSONAS[role];
  const state = aiSupportCentreService.getState();
  void tick;

  // Private conversations scoped strictly to signed-in ownerUserId
  const myConversations = state.conversations.filter((c) => c.ownerUserId === persona.userId);
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>(myConversations[0]?.id);
  const activeConversation =
    myConversations.find((c) => c.id === selectedConvId) ?? myConversations[0];

  const [promptInput, setPromptInput] = useState('');
  const [handoffCategory, setHandoffCategory] = useState<SupportTicketCategory>('PORTAL_TECH');
  const [attachTranscript, setAttachTranscript] = useState(true);

  // Knowledge base form
  const [kbSearch, setKbSearch] = useState('');
  const [kbTitle, setKbTitle] = useState('');
  const [kbSummary, setKbSummary] = useState('');
  const [kbBody, setKbBody] = useState('');
  const [kbVisibility, setKbVisibility] = useState<KnowledgeVisibility>('ALL_AUTHENTICATED');
  const [kbReviewNote, setKbReviewNote] = useState<Record<string, string>>({});

  // Support ticket form
  const [tktCategory, setTktCategory] = useState<SupportTicketCategory>('ACCOUNT_ACCESS');
  const [tktSubject, setTktSubject] = useState('');
  const [tktDesc, setTktDesc] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyInternal, setReplyInternal] = useState<Record<string, boolean>>({});

  // Live redaction inspector
  const [testPiiInput, setTestPiiInput] = useState(
    'Reset portal password for brian@example.com or ID 32948102 phone 0712345678'
  );
  const previewRedaction = redactSensitiveInput(testPiiInput);

  const readableKnowledge = aiSupportCentreService.getReadableKnowledgeForRole(role, kbSearch);
  const reviewQueue = state.articles.filter((a) => a.status === 'PENDING_REVIEW');

  const visibleTickets =
    role === 'IT_SUPPORT'
      ? state.tickets
      : state.tickets.filter((t) => t.requesterUserId === persona.userId);

  const usedCount = state.quota.usedCounts[role] ?? 0;
  const quotaPct = Math.min(100, Math.round((usedCount / state.quota.monthlyLimitPerUser) * 100));

  const run = (res: { ok: boolean; error?: string }, okMsg: string) => {
    if (res.ok) {
      setFeedback({ type: 'ok', text: okMsg });
      setTick((t) => t + 1);
    } else {
      setFeedback({ type: 'err', text: res.error || 'Operation rejected.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153b70] to-[#0f274a] rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Module 43 • Authenticated Role Assistants &amp; General Help Desk</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Complete AI Support Centre &amp; Help Desk
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Permission-filtered institutional knowledge search in knowledge-only mode, private
              owner conversations, automatic PII redaction, peer-reviewed articles, and Help Centre
              tickets with internal-note isolation.
            </p>
          </div>

          {/* 7-Role Switcher */}
          <div className="bg-black/25 border border-white/15 rounded-xl p-3 max-w-xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              Authenticated Role Context (Scopes Articles, Conversations &amp; Ticket Internal Notes)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ASSISTANT_PERSONAS) as SupportAssistantRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setSelectedConvId(undefined);
                    setFeedback(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    role === r
                      ? 'bg-amber-400 text-[#092c60] shadow'
                      : 'bg-white/10 text-blue-100 hover:bg-white/20'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Role Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Active Persona</div>
            <div className="text-xs font-black mt-0.5 truncate">{persona.title}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Readable KB Articles</div>
            <div className="text-xl font-black mt-0.5">{readableKnowledge.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">
              Monthly Quota ({state.quota.monthKey})
            </div>
            <div className="text-xl font-black mt-0.5">
              {usedCount}{' '}
              <span className="text-xs font-semibold text-blue-200">
                / {state.quota.monthlyLimitPerUser}
              </span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Visible Support Tickets</div>
            <div className="text-xl font-black mt-0.5 text-amber-300">{visibleTickets.length}</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'assistant', label: 'Role AI Assistant', icon: Sparkles },
          { id: 'knowledge', label: 'Knowledge Base & Peer Review', icon: BookOpen },
          { id: 'tickets', label: 'General Help Centre Tickets', icon: LifeBuoy },
          { id: 'quota-privacy', label: 'Quotas, PII Redaction & Audit', icon: ShieldCheck },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as TabId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeTab === t.id
                  ? 'bg-[#153b70] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROLE-SCOPED AI ASSISTANT */}
      {activeTab === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Private Conversations Column */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase text-[#153b70] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Private History</span>
              </h2>
              <button
                type="button"
                onClick={() => setSelectedConvId('__NEW__')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-[#153b70] text-[11px] font-bold hover:bg-blue-100"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Owned solely by <strong>{persona.name}</strong>. Support staff cannot read AI threads
              unless explicitly attached in a ticket handoff.
            </p>
            <div className="space-y-1.5">
              {myConversations.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  No private conversations yet for {role}. Ask a question on the right.
                </div>
              ) : (
                myConversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                      activeConversation?.id === c.id && selectedConvId !== '__NEW__'
                        ? 'bg-blue-50 border-[#153b70] font-bold text-[#153b70]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate">{c.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>{c.messages.length} msgs</span>
                      <span>{c.status}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">
                Suggested Role Prompts
              </div>
              {persona.quickPrompts.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => setPromptInput(qp)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[11px] text-slate-700 transition"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Workspace */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between min-h-[480px] space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-[#153b70]">{persona.title}</h2>
                  <p className="text-[11px] text-slate-500">Scope: {persona.focusAreas}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold">
                  KNOWLEDGE_ONLY MODE • ZERO PRIVATE RECORD ACCESS
                </span>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {!activeConversation || selectedConvId === '__NEW__' ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 space-y-2">
                    <Sparkles className="w-6 h-6 text-[#153b70] mx-auto" />
                    <div className="font-extrabold text-[#153b70]">
                      Start a private AI Support thread as {role}
                    </div>
                    <p>
                      Only published, non-expired articles allowed for <strong>{role}</strong> are
                      searched. Emails, phone numbers, and ID numbers are automatically redacted.
                    </p>
                  </div>
                ) : (
                  activeConversation.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs space-y-2 ${
                        m.role === 'USER'
                          ? 'bg-[#153b70] text-white ml-8'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-80 font-bold">
                        <span>{m.role === 'USER' ? persona.name : 'HI-TECH AI Support'}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed">
                        {m.redactedQuery ?? m.content}
                      </div>
                      {m.redactionsApplied && m.redactionsApplied.length > 0 && (
                        <div className="text-[10px] bg-amber-400 text-[#092c60] px-2 py-0.5 rounded font-extrabold inline-block">
                          Redacted before processing: {m.redactionsApplied.join(', ')}
                        </div>
                      )}
                      {m.citedArticles && m.citedArticles.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-200 flex flex-wrap gap-1.5">
                          {m.citedArticles.map((art) => (
                            <span
                              key={art.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-[#153b70] text-[10px] font-bold"
                            >
                              <FileText className="w-3 h-3" />
                              {art.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Composer & Explicit Support Ticket Handoff */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Ask ${persona.title}... (emails/IDs auto-redacted)`}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && promptInput.trim()) {
                      const res = aiSupportCentreService.sendMessage({
                        role,
                        conversationId:
                          selectedConvId === '__NEW__' ? undefined : activeConversation?.id,
                        prompt: promptInput,
                      });
                      if (res.ok) {
                        setSelectedConvId(res.conversationId);
                        setPromptInput('');
                        setTick((t) => t + 1);
                      } else {
                        setFeedback({ type: 'err', text: res.error || 'Failed to send.' });
                      }
                    }
                  }}
                  className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const res = aiSupportCentreService.sendMessage({
                      role,
                      conversationId:
                        selectedConvId === '__NEW__' ? undefined : activeConversation?.id,
                      prompt: promptInput,
                    });
                    if (res.ok) {
                      setSelectedConvId(res.conversationId);
                      setPromptInput('');
                      setTick((t) => t + 1);
                    } else {
                      setFeedback({ type: 'err', text: res.error || 'Quota or input error.' });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#153b70] hover:bg-[#0f274a] text-white text-xs font-extrabold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask Assistant</span>
                </button>
              </div>

              {/* Explicit Ticket Handoff Bar */}
              {activeConversation &&
                selectedConvId !== '__NEW__' &&
                activeConversation.status === 'OPEN' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-extrabold text-amber-950">Need human follow-up?</span>
                      <select
                        value={handoffCategory}
                        onChange={(e) =>
                          setHandoffCategory(e.target.value as SupportTicketCategory)
                        }
                        className="border border-amber-300 rounded-lg px-2 py-1 bg-white text-xs"
                      >
                        <option value="PORTAL_TECH">PORTAL_TECH</option>
                        <option value="ACCOUNT_ACCESS">ACCOUNT_ACCESS</option>
                        <option value="FEES_INVOICING">FEES_INVOICING</option>
                        <option value="EXAMS_RESULTS">EXAMS_RESULTS</option>
                        <option value="LIBRARY_ELEARNING">LIBRARY_ELEARNING</option>
                      </select>
                      <label className="flex items-center gap-1.5 font-semibold text-amber-950">
                        <input
                          type="checkbox"
                          checked={attachTranscript}
                          onChange={(e) => setAttachTranscript(e.target.checked)}
                        />
                        <span>Include Redacted AI Transcript</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const res = aiSupportCentreService.handoffConversationToTicket({
                          conversationId: activeConversation.id,
                          role,
                          category: handoffCategory,
                          includeTranscript: attachTranscript,
                        });
                        run(res, `Handed off cleanly to Support Ticket ${res.ticketRef}!`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d92332] hover:bg-[#b81d2a] text-white font-extrabold"
                    >
                      <span>Escalate to Help Desk Ticket</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE & INDEPENDENT REVIEW */}
      {activeTab === 'knowledge' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Readable Articles for Role */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-[#153b70]">
                  Published Articles Readable by {role} ({readableKnowledge.length})
                </h2>
                <input
                  type="text"
                  placeholder="Search FAQs & SOPs..."
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-56"
                />
              </div>

              {readableKnowledge.map((art) => (
                <div key={art.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-[#153b70]">{art.title}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] text-[10px] font-mono font-bold">
                      {art.visibility}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{art.body}</p>
                  <div className="text-[11px] text-slate-500">
                    Author: {art.authorName} • Reviewed by: {art.reviewedByName ?? 'Pending'} •
                    Effective: {art.effectiveFrom} to {art.effectiveTo}
                  </div>
                </div>
              ))}
            </div>

            {/* Independent Peer Review Queue */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#153b70]">
                  Pending Review Queue (Author ≠ Independent Reviewer)
                </h3>
                <span className="text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  {reviewQueue.length} Pending
                </span>
              </div>

              {reviewQueue.map((art) => (
                <div key={art.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-2">
                  <div className="font-extrabold text-slate-900">{art.title}</div>
                  <div className="text-slate-600">{art.body}</div>
                  <div className="text-[11px] text-slate-500">
                    Submitted by: <strong>{art.authorName}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Review note (required to reject)"
                      value={kbReviewNote[art.id] || ''}
                      onChange={(e) =>
                        setKbReviewNote((prev) => ({ ...prev, [art.id]: e.target.value }))
                      }
                      className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          aiSupportCentreService.reviewKnowledgeArticle({
                            articleId: art.id,
                            decision: 'PUBLISHED',
                            reviewerUserId: persona.userId,
                            reviewerName: persona.name,
                            note: kbReviewNote[art.id] || 'Verified institutional accuracy',
                          }),
                          `Published "${art.title}" to Knowledge Base.`
                        )
                      }
                      className="px-3 py-1 rounded bg-emerald-700 text-white font-bold"
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          aiSupportCentreService.reviewKnowledgeArticle({
                            articleId: art.id,
                            decision: 'REJECTED',
                            reviewerUserId: persona.userId,
                            reviewerName: persona.name,
                            note: kbReviewNote[art.id] || '',
                          }),
                          `Rejected "${art.title}".`
                        )
                      }
                      className="px-3 py-1 rounded bg-red-600 text-white font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70]">
              Submit Knowledge Article for Review
            </h3>
            <input
              type="text"
              placeholder="Article Title"
              value={kbTitle}
              onChange={(e) => setKbTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Short summary"
              value={kbSummary}
              onChange={(e) => setKbSummary(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <select
              value={kbVisibility}
              onChange={(e) => setKbVisibility(e.target.value as KnowledgeVisibility)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="ALL_AUTHENTICATED">ALL_AUTHENTICATED (Includes Students)</option>
              <option value="STAFF_ONLY">STAFF_ONLY (Excludes Students)</option>
              <option value="ROLE_RESTRICTED">ROLE_RESTRICTED ({role})</option>
            </select>
            <textarea
              placeholder="Authoritative policy / procedure text..."
              value={kbBody}
              onChange={(e) => setKbBody(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!kbTitle || !kbBody) return;
                run(
                  aiSupportCentreService.createKnowledgeDraft({
                    title: kbTitle,
                    summary: kbSummary || kbTitle,
                    body: kbBody,
                    category: 'College Operations',
                    visibility: kbVisibility,
                    allowedRoles: [role],
                    authorUserId: persona.userId,
                    authorName: persona.name,
                  }),
                  'Article submitted to Pending Review queue (switch role to independently approve).'
                );
                setKbTitle('');
                setKbSummary('');
                setKbBody('');
              }}
              className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
            >
              Submit Draft for Review
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL HELP CENTRE TICKETS (INTERNAL NOTES ISOLATION) */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#153b70]">
                  {role === 'IT_SUPPORT'
                    ? 'Support Team Queue (Includes Internal Staff Notes)'
                    : 'My Support Tickets (Internal Staff Notes Filtered)'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Separate from Welfare/Counselling. Priority is server-assigned; closed tickets block
                  new replies until reopened.
                </p>
              </div>
              {role !== 'IT_SUPPORT' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Internal Notes Hidden from Non-Support</span>
                </span>
              )}
            </div>

            {visibleTickets.map((tkt) => {
              const msgs = aiSupportCentreService.getVisibleTicketMessages(tkt, role);
              return (
                <div key={tkt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[#153b70]">{tkt.ticketRef}</span>
                      <span className="font-extrabold text-sm text-slate-900">{tkt.subject}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] font-bold text-[10px]">
                        SYS PRIORITY: {tkt.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {tkt.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-700 whitespace-pre-line">{tkt.description}</p>
                  <div className="text-[11px] text-slate-500">
                    Requester: {tkt.requesterName} • Category: {tkt.category} • Assignee:{' '}
                    <strong>{tkt.assignedToName ?? 'Unassigned'}</strong>
                  </div>

                  {/* Conversation Messages */}
                  {msgs.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      {msgs.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-lg border ${
                            m.isInternalNote
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                            <span>
                              {m.authorName}{' '}
                              {m.isInternalNote && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-300 text-amber-950">
                                  INTERNAL STAFF NOTE
                                </span>
                              )}
                            </span>
                            <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div>{m.body}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply + Support Transition */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyText[tkt.id] || ''}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [tkt.id]: e.target.value }))
                      }
                      className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                    />
                    {role === 'IT_SUPPORT' && (
                      <label className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                        <input
                          type="checkbox"
                          checked={Boolean(replyInternal[tkt.id])}
                          onChange={(e) =>
                            setReplyInternal((prev) => ({ ...prev, [tkt.id]: e.target.checked }))
                          }
                        />
                        <span>Internal Note</span>
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!replyText[tkt.id]?.trim()) return;
                        run(
                          aiSupportCentreService.replyToTicket({
                            ticketId: tkt.id,
                            role,
                            body: replyText[tkt.id],
                            isInternalNote: Boolean(replyInternal[tkt.id]),
                          }),
                          'Posted ticket message.'
                        );
                        setReplyText((prev) => ({ ...prev, [tkt.id]: '' }));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#153b70] text-white font-bold"
                    >
                      Send Reply
                    </button>
                    {role === 'IT_SUPPORT' && (
                      <select
                        aria-label={`Change status for ${tkt.ticketRef}`}
                        value={tkt.status}
                        onChange={(e) =>
                          run(
                            aiSupportCentreService.transitionTicketStatus(
                              tkt.id,
                              e.target.value as SupportTicketStatus,
                              persona.name
                            ),
                            `Ticket transitioned to ${e.target.value}.`
                          )
                        }
                        className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white font-bold"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70]">
              Open General Support Ticket
            </h3>
            <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              Do not enter passwords, OTPs, or sensitive welfare details here. Use Hostels &amp;
              Welfare for private counselling referrals.
            </p>
            <select
              value={tktCategory}
              onChange={(e) => setTktCategory(e.target.value as SupportTicketCategory)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="ACCOUNT_ACCESS">ACCOUNT_ACCESS (Auto Priority: HIGH)</option>
              <option value="EXAMS_RESULTS">EXAMS_RESULTS (Auto Priority: HIGH)</option>
              <option value="PORTAL_TECH">PORTAL_TECH (Auto Priority: NORMAL)</option>
              <option value="FEES_INVOICING">FEES_INVOICING (Auto Priority: NORMAL)</option>
              <option value="LIBRARY_ELEARNING">LIBRARY_ELEARNING (Auto Priority: NORMAL)</option>
              <option value="DOCUMENTS">DOCUMENTS (Auto Priority: NORMAL)</option>
              <option value="HOSTEL_GENERAL">HOSTEL_GENERAL (Auto Priority: LOW)</option>
            </select>
            <input
              type="text"
              placeholder="Ticket Subject"
              value={tktSubject}
              onChange={(e) => setTktSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <textarea
              placeholder="Describe technical or portal issue..."
              value={tktDesc}
              onChange={(e) => setTktDesc(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!tktSubject || !tktDesc) return;
                const res = aiSupportCentreService.createSupportTicket({
                  role,
                  category: tktCategory,
                  subject: tktSubject,
                  description: tktDesc,
                });
                run(res, `Opened Support Ticket ${res.ticketRef}.`);
                setTktSubject('');
                setTktDesc('');
              }}
              className="w-full bg-[#d92332] hover:bg-[#b81d2a] text-white py-2 rounded-lg text-xs font-extrabold"
            >
              Submit General Ticket
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: QUOTAS, PII REDACTION & AUDIT */}
      {activeTab === 'quota-privacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Monthly AI Support Quota &amp; Live PII Redaction Tester
            </h2>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>
                  {role} Monthly Usage ({state.quota.monthKey})
                </span>
                <span>
                  {usedCount} / {state.quota.monthlyLimitPerUser} ({quotaPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-[#153b70] transition-all ${
                    quotaPct >= 80
                      ? 'w-5/6'
                      : quotaPct >= 50
                      ? 'w-1/2'
                      : quotaPct >= 25
                      ? 'w-1/4'
                      : 'w-4'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Test Client-Side PII Redaction Before Dispatch:
              </label>
              <textarea
                value={testPiiInput}
                onChange={(e) => setTestPiiInput(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
              />
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-900">
                  Sanitized Output ({previewRedaction.redactionsApplied.length} patterns scrubbed):
                </div>
                <div className="font-mono text-emerald-950">{previewRedaction.redacted}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Privacy-Safe AI &amp; Support Audit Log
            </h2>
            <p className="text-[11px] text-slate-500">
              Audit records track lifecycle events only and never store raw ticket bodies,
              passwords, or private user transcripts.
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {state.auditLog.map((a) => (
                <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800">{a.action}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {a.actor} • {new Date(a.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
