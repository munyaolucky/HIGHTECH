/**
 * HI-TECH College Academic & Certification Platform
 * Module 36 & 39: Public Website Chatbot & AI Support Centre
 * Controlled RAG, Citation Tags, Multilingual Support & Human Escalation Desk
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Languages,
  ExternalLink,
  ChevronDown,
  Headphones,
  Paperclip,
} from 'lucide-react';
import {
  getOrCreateConversation,
  processUserMessage,
  submitMessageFeedback,
  createEscalation,
  detectLanguage,
  getAIConfig,
} from '../../services/chatbotService';
import {
  ChatbotConversation,
  ChatbotEscalationDepartment,
  ChatbotFeedbackRating,
  ChatbotMessage,
} from '../../types/chatbot';

interface CollegeChatbotProps {
  onNavigateToApply?: () => void;
  onOpenPortalModal?: () => void;
}

export default function CollegeChatbot({
  onNavigateToApply,
  onOpenPortalModal,
}: CollegeChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<ChatbotConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'sw'>('en');
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [feedbackSuccessMsgId, setFeedbackSuccessMsgId] = useState<string | null>(null);

  // Escalation form state
  const [escalationForm, setEscalationForm] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    department: 'ADMISSIONS' as ChatbotEscalationDepartment,
    subject: '',
    description: '',
  });
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);
  const [escalationSuccessTicket, setEscalationSuccessTicket] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load or initialize active conversation
    const activeConv = getOrCreateConversation();
    setConversation(activeConv);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages, isOpen, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !conversation) return;

    setInputText('');
    setIsTyping(true);

    // Simulate natural AI thinking delay (400ms)
    setTimeout(() => {
      const result = processUserMessage(conversation.id, text);
      const updatedConv = getOrCreateConversation(conversation.id);
      setConversation({ ...updatedConv });
      setIsTyping(false);
    }, 450);
  };

  const handleFeedback = (messageId: string, rating: ChatbotFeedbackRating) => {
    if (!conversation) return;
    submitMessageFeedback(conversation.id, messageId, rating);
    const updatedConv = getOrCreateConversation(conversation.id);
    setConversation({ ...updatedConv });
    setFeedbackSuccessMsgId(messageId);
    setTimeout(() => setFeedbackSuccessMsgId(null), 3000);
  };

  const handleEscalationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation) return;

    setIsSubmittingEscalation(true);
    setTimeout(() => {
      const ticket = createEscalation({
        conversationId: conversation.id,
        visitorName: escalationForm.visitorName || 'Website Visitor',
        visitorEmail: escalationForm.visitorEmail || 'visitor@example.com',
        visitorPhone: escalationForm.visitorPhone,
        department: escalationForm.department,
        subject: escalationForm.subject || 'Website Support Escalation',
        description: escalationForm.description || 'Request for support follow-up from chatbot.',
      });

      setEscalationSuccessTicket(ticket.ticketNumber);
      setIsSubmittingEscalation(false);

      // Inquire back into the chat as system confirmation
      const systemConfirmMsg: ChatbotMessage = {
        id: `msg-esc-${Date.now()}`,
        conversationId: conversation.id,
        role: 'SYSTEM',
        content: `🎫 Support Ticket Issued: ${ticket.ticketNumber}\nDepartment: ${ticket.department}\nOur staff will review your query and contact you at ${ticket.visitorEmail} within 24 business hours.`,
        createdAt: new Date().toISOString(),
      };

      const conv = getOrCreateConversation(conversation.id);
      conv.messages.push(systemConfirmMsg);
      setConversation({ ...conv });

      setTimeout(() => {
        setShowEscalationModal(false);
        setEscalationSuccessTicket(null);
        setEscalationForm({
          visitorName: '',
          visitorEmail: '',
          visitorPhone: '',
          department: 'ADMISSIONS',
          subject: '',
          description: '',
        });
      }, 2500);
    }, 600);
  };

  const suggestedPrompts = [
    { label: 'How do I apply online?', query: 'How do I submit an application to HI-TECH College online?' },
    { label: 'Admission requirements?', query: 'What are the admission requirements for Certificate and Diploma programmes?' },
    { label: 'Official M-Pesa Fee Paybill?', query: 'How do I pay college fees via M-Pesa?' },
    { label: 'Student Portal login help?', query: 'How do I access the Student Portal or reset my portal password?' },
    { label: 'Accreditation & TVETA status?', query: 'Is HI-TECH College accredited by the government and TVETA?' },
    { label: 'Jinsi ya Kujiunga (Kiswahili)', query: 'Jinsi ya kujiunga na chuo cha HI-TECH College (Kiswahili)?' },
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open College Chatbot"
            className="group flex items-center gap-3 bg-[#153B70] hover:bg-[#092c60] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-amber-400/80"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-[#092c60] flex items-center justify-center font-bold shadow-inner">
                <MessageSquare size={20} className="text-[#092c60]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#153B70] rounded-full animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <span>HI-TECH Support</span>
                <Sparkles size={11} />
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                Ask Questions &amp; Admissions
              </div>
            </div>
          </button>
        ) : null}
      </div>

      {/* Floating Chat Modal / Panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[440px] max-h-[88vh] h-[640px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-[#153B70] text-white p-4 flex items-center justify-between border-b border-blue-900/40 relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-[#092c60] flex items-center justify-center font-black shadow-md">
                  <Sparkles size={20} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#153B70] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base leading-tight">
                    HI-TECH Support Assistant
                  </h3>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                    TVETA Grounded
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Official Institutional Knowledge Desk
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Selector */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'sw' : 'en')}
                title="Toggle Language (English / Kiswahili)"
                className="px-2 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 border border-white/10"
              >
                <Languages size={13} />
                <span>{selectedLanguage.toUpperCase()}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Institutional Security Notice Disclaimer */}
          <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 py-2 text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldAlert size={15} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <strong>Official Security Notice:</strong> Never share passwords, PINs, OTPs or personal payment transactions here. HI-TECH staff will never ask for your password.
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
            {conversation?.messages.map((msg) => {
              const isUser = msg.role === 'USER';
              const isSystem = msg.role === 'SYSTEM';

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium whitespace-pre-line shadow-sm"
                  >
                    {msg.content}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      {isUser ? 'You' : 'HI-TECH Support'}
                    </span>
                    {!isUser && msg.confidence && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1 rounded">
                        Confidence: {(msg.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                      isUser
                        ? 'bg-[#153B70] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {msg.content}

                    {/* Citations Tag */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                          <span>📚 Verified Institutional Source:</span>
                        </div>
                        <ul className="space-y-0.5">
                          {msg.citations.map((cite, i) => (
                            <li key={i} className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] inline-block mr-1">
                              {cite}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Feedback Rating (Thumbs Up / Down) */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-[10px]">Was this answer accurate?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleFeedback(msg.id, 'HELPFUL')}
                            className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                              msg.feedback === 'HELPFUL' ? 'text-emerald-600 font-bold' : ''
                            }`}
                            title="Helpful & Accurate"
                          >
                            <ThumbsUp size={13} />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'NOT_HELPFUL')}
                            className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                              msg.feedback === 'NOT_HELPFUL' ? 'text-rose-600 font-bold' : ''
                            }`}
                            title="Not Helpful / Unresolved"
                          >
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {feedbackSuccessMsgId === msg.id && (
                      <div className="text-[10px] text-emerald-600 font-medium mt-1">
                        ✓ Thank you! Your feedback helps us improve college records.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 max-w-[200px] shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] font-medium">Consulting Knowledge Base...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompt Chips */}
          <div className="bg-white border-t border-slate-100 px-3 py-2 overflow-x-auto flex gap-1.5 no-scrollbar">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                className="whitespace-nowrap px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Escalation Request Action Bar */}
          <div className="bg-slate-100/70 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">Need specific human assistance?</span>
            <button
              onClick={() => setShowEscalationModal(true)}
              className="text-[#153B70] hover:text-[#d92332] font-semibold flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
            >
              <Headphones size={12} />
              <span>Request Human Escalation</span>
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                selectedLanguage === 'sw'
                  ? 'Uliza kuhusu kozi, ada, au udahili...'
                  : 'Ask about courses, fees, admissions, exams...'
              }
              className="flex-1 bg-slate-100 text-slate-800 placeholder-slate-400 text-sm px-3.5 py-2.5 rounded-xl border border-transparent focus:border-[#153B70] focus:bg-white focus:outline-none transition-all"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="p-2.5 bg-[#153B70] text-white rounded-xl hover:bg-[#092c60] disabled:opacity-40 disabled:hover:bg-[#153B70] transition-colors shadow-sm"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Escalation Ticket Modal */}
      {showEscalationModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#153B70] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#092c60] flex items-center justify-center font-bold">
                  <Headphones size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Escalate to Official Support Desk</h4>
                  <p className="text-[11px] text-blue-200">
                    Direct routing to Admissions, Finance, or Registrar offices
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEscalationModal(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {escalationSuccessTicket ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h5 className="font-bold text-slate-900 text-lg">Ticket Registered Successfully!</h5>
                <p className="text-sm text-slate-600">
                  Your official ticket reference number is:
                </p>
                <div className="bg-slate-100 py-2 px-4 rounded-xl font-mono text-base font-bold text-[#153B70] inline-block border border-slate-300">
                  {escalationSuccessTicket}
                </div>
                <p className="text-xs text-slate-500">
                  An institutional representative will follow up via email or SMS within 24-48 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEscalationSubmit} className="p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={escalationForm.visitorName}
                      onChange={(e) =>
                        setEscalationForm({ ...escalationForm, visitorName: e.target.value })
                      }
                      placeholder="e.g. Kelvin Mutiso"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={escalationForm.visitorEmail}
                      onChange={(e) =>
                        setEscalationForm({ ...escalationForm, visitorEmail: e.target.value })
                      }
                      placeholder="e.g. kelvin@gmail.com"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={escalationForm.visitorPhone}
                      onChange={(e) =>
                        setEscalationForm({ ...escalationForm, visitorPhone: e.target.value })
                      }
                      placeholder="+254 7XX XXX XXX"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department Routing *
                    </label>
                    <select
                      value={escalationForm.department}
                      onChange={(e) =>
                        setEscalationForm({
                          ...escalationForm,
                          department: e.target.value as ChatbotEscalationDepartment,
                        })
                      }
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70] bg-white"
                    >
                      <option value="ADMISSIONS">Admissions &amp; Enrolments</option>
                      <option value="FINANCE">Finance &amp; Fee Payments</option>
                      <option value="ACADEMICS">Academic Operations &amp; Faculty</option>
                      <option value="EXAMINATIONS">Examinations &amp; CBT</option>
                      <option value="ICT_SUPPORT">ICT Support &amp; Portal Passwords</option>
                      <option value="GENERAL">General Inquiries &amp; Campuses</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Summary *
                  </label>
                  <input
                    type="text"
                    required
                    value={escalationForm.subject}
                    onChange={(e) =>
                      setEscalationForm({ ...escalationForm, subject: e.target.value })
                    }
                    placeholder="Brief description of your enquiry"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Inquiry *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={escalationForm.description}
                    onChange={(e) =>
                      setEscalationForm({ ...escalationForm, description: e.target.value })
                    }
                    placeholder="Provide relevant information (e.g. application reference or question details)..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowEscalationModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEscalation}
                    className="px-4 py-2 text-xs font-bold bg-[#153B70] text-white hover:bg-[#092c60] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmittingEscalation ? 'Registering Ticket...' : 'Submit Escalation Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
