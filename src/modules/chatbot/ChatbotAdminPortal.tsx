/**
 * HI-TECH College Academic & Certification Platform
 * Modules 37, 38 & 39: Chatbot Admin Dashboard, Service Desk & AI Intelligence Portal
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Headphones,
  BarChart3,
  Sliders,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText,
  Filter,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Check,
  X,
  Mail,
  User,
  HelpCircle,
} from 'lucide-react';
import {
  getKnowledgeArticles,
  saveKnowledgeArticle,
  updateArticleStatus,
  deleteKnowledgeArticle,
  getEscalations,
  getEscalationHistory,
  updateEscalationStatus,
  assignEscalation,
  getChatbotAnalytics,
  getFallbackQueries,
  resolveFallbackQuery,
  getAIConfig,
  updateAIConfig,
} from '../../services/chatbotService';
import {
  ChatbotAIConfig,
  ChatbotAnalyticsSummary,
  ChatbotEscalation,
  ChatbotEscalationDepartment,
  ChatbotEscalationHistory,
  ChatbotEscalationStatus,
  ChatbotFallbackQuery,
  ChatbotKnowledgeArticle,
  ChatbotKnowledgeStatus,
} from '../../types/chatbot';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

export default function ChatbotAdminPortal() {
  const [activeTab, setActiveTab] = useSyncedPortalTab<
    'knowledge' | 'escalations' | 'analytics' | 'settings'
  >('chatbot-admin', 'knowledge');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Knowledge base state
  const [articles, setArticles] = useState<ChatbotKnowledgeArticle[]>([]);
  const [kbSearch, setKbSearch] = useState('');
  const [kbStatusFilter, setKbStatusFilter] = useState<'ALL' | ChatbotKnowledgeStatus>('ALL');
  const [editingArticle, setEditingArticle] = useState<ChatbotKnowledgeArticle | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [articleForm, setArticleForm] = useState({
    id: '',
    category: 'ADMISSIONS',
    question: '',
    answer: '',
    keywords: '',
    citations: '',
    status: 'PUBLISHED' as ChatbotKnowledgeStatus,
    displayOrder: 1,
  });

  // Escalations state
  const [escalations, setEscalations] = useState<ChatbotEscalation[]>([]);
  const [escStatusFilter, setEscStatusFilter] = useState<'ALL' | ChatbotEscalationStatus>('ALL');
  const [escDeptFilter, setEscDeptFilter] = useState<'ALL' | ChatbotEscalationDepartment>('ALL');
  const [selectedEscalation, setSelectedEscalation] = useState<ChatbotEscalation | null>(null);
  const [selectedEscHistory, setSelectedEscHistory] = useState<ChatbotEscalationHistory[]>([]);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');

  // Analytics & Fallbacks state
  const [analytics, setAnalytics] = useState<ChatbotAnalyticsSummary | null>(null);
  const [fallbacks, setFallbacks] = useState<ChatbotFallbackQuery[]>([]);

  // AI Config state
  const [aiConfig, setAIConfig] = useState<ChatbotAIConfig>(getAIConfig());
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    setArticles(getKnowledgeArticles());
    setEscalations(getEscalations());
    setAnalytics(getChatbotAnalytics());
    setFallbacks(getFallbackQueries());
    setAIConfig(getAIConfig());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (selectedEscalation) {
      setSelectedEscHistory(getEscalationHistory(selectedEscalation.id));
    }
  }, [selectedEscalation]);

  // Handle Knowledge Article Form
  const handleOpenNewArticle = () => {
    setEditingArticle(null);
    setArticleForm({
      id: '',
      category: 'ADMISSIONS',
      question: '',
      answer: '',
      keywords: '',
      citations: 'HI-TECH College Prospectus 2026',
      status: 'PUBLISHED',
      displayOrder: articles.length + 1,
    });
    setIsArticleModalOpen(true);
  };

  const handleEditArticle = (art: ChatbotKnowledgeArticle) => {
    setEditingArticle(art);
    setArticleForm({
      id: art.id,
      category: art.category,
      question: art.question,
      answer: art.answer,
      keywords: art.keywords.join(', '),
      citations: art.citations.join(', '),
      status: art.status,
      displayOrder: art.displayOrder,
    });
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    const keywordsArr = articleForm.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const citationsArr = articleForm.citations
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    saveKnowledgeArticle({
      id: articleForm.id || undefined,
      institutionId: 'HCA-KE-2026',
      category: articleForm.category,
      question: articleForm.question,
      answer: articleForm.answer,
      keywords: keywordsArr,
      citations: citationsArr,
      status: articleForm.status,
      displayOrder: Number(articleForm.displayOrder) || 1,
      createdById: 'HCA/ADMIN/2026/001',
    });

    setIsArticleModalOpen(false);
    refreshData();
    showToast('Knowledge Base Article saved successfully.');
  };

  const handleToggleArticleStatus = (id: string, currentStatus: ChatbotKnowledgeStatus) => {
    const nextStatus: ChatbotKnowledgeStatus =
      currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updateArticleStatus(id, nextStatus);
    refreshData();
    showToast(`Article status updated to ${nextStatus}.`);
  };

  const handleDeleteArticle = (id: string) => {
    deleteKnowledgeArticle(id);
    setConfirmDeleteId(null);
    refreshData();
    showToast('Article removed from knowledge base.');
  };

  // Convert Unanswered Query into Knowledge Article
  const handleConvertFallback = (fallback: ChatbotFallbackQuery) => {
    setEditingArticle(null);
    setArticleForm({
      id: '',
      category: 'GENERAL',
      question: fallback.query,
      answer: '',
      keywords: fallback.query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').slice(0, 5).join(', '),
      citations: 'HI-TECH College Academic Prospectus 2026',
      status: 'PUBLISHED',
      displayOrder: articles.length + 1,
    });
    resolveFallbackQuery(fallback.id);
    setIsArticleModalOpen(true);
    setActiveTab('knowledge');
  };

  // Handle Escalations Actions
  const handleAssignToMe = (esc: ChatbotEscalation) => {
    assignEscalation(
      esc.id,
      'Dennis Kemboi (Admin Desk)',
      'dennis.kemboi@hitechcollege.ac.ke',
      'Dennis Kemboi'
    );
    refreshData();
    setSelectedEscalation(getEscalations().find((e) => e.id === esc.id) || null);
    showToast(`Ticket ${esc.ticketNumber} assigned to Dennis Kemboi.`);
  };

  const handleUpdateEscalationStatus = (newStatus: ChatbotEscalationStatus) => {
    if (!selectedEscalation) return;
    if (!resolutionNoteInput.trim()) {
      setResolutionError('Please provide internal resolution / action notes before updating status.');
      return;
    }

    setResolutionError(null);
    updateEscalationStatus(
      selectedEscalation.id,
      newStatus,
      resolutionNoteInput.trim(),
      'Dennis Kemboi (Admin Desk)',
      'HCA/STAFF/2026/001'
    );
    setResolutionNoteInput('');
    refreshData();
    setSelectedEscalation(getEscalations().find((e) => e.id === selectedEscalation.id) || null);
    showToast(`Ticket ${selectedEscalation.ticketNumber} updated to ${newStatus}.`);
  };

  // Handle AI Config Save
  const handleSaveAIConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateAIConfig(aiConfig);
    setConfigSaveSuccess(true);
    refreshData();
    setTimeout(() => setConfigSaveSuccess(false), 3000);
    showToast('AI Intelligence settings applied.');
  };

  // Filtered Knowledge Articles
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.question.toLowerCase().includes(kbSearch.toLowerCase()) ||
      art.answer.toLowerCase().includes(kbSearch.toLowerCase()) ||
      art.keywords.some((k) => k.toLowerCase().includes(kbSearch.toLowerCase()));
    const matchesStatus = kbStatusFilter === 'ALL' || art.status === kbStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Escalations
  const filteredEscalations = escalations.filter((esc) => {
    const matchesStatus = escStatusFilter === 'ALL' || esc.status === escStatusFilter;
    const matchesDept = escDeptFilter === 'ALL' || esc.department === escDeptFilter;
    return matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#153B70] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-blue-400 text-sm animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153B70] to-[#1e4b8a] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-black bg-amber-400 text-[#092c60] tracking-wider uppercase">
                Modules 36 - 39
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-white/10 text-blue-200 border border-white/10">
                TVETA Grounded AI Support
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Chatbot Administration &amp; AI Service Desk
            </h1>
            <p className="text-sm text-blue-200 max-w-2xl mt-1">
              Grounded Institutional Knowledge Base, Human Support Escalations, Real Analytics &amp; Controlled RAG Governance.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshData}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
            >
              <RefreshCw size={14} />
              <span>Refresh Desk</span>
            </button>
            <button
              onClick={handleOpenNewArticle}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#092c60] text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus size={16} />
              <span>New Knowledge Article</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'knowledge'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BookOpen size={15} />
            <span>Knowledge Base Manager ({articles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('escalations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'escalations'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Headphones size={15} />
            <span>Support Escalations Desk ({escalations.filter((e) => e.status === 'PENDING').length} Pending)</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BarChart3 size={15} />
            <span>Analytics &amp; Unanswered Queries</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sliders size={15} />
            <span>AI Governance &amp; RAG Controls</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KNOWLEDGE BASE MANAGER (MODULE 37) */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search knowledge questions, answers or keywords..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#153B70]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter size={13} /> Status:
              </span>
              {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setKbStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors ${
                    kbStatusFilter === st
                      ? 'bg-[#153B70] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                      {art.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        art.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : art.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {art.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug">
                    {art.question}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line mb-3">
                    {art.answer}
                  </p>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {art.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* Citations */}
                  {art.citations.length > 0 && (
                    <div className="text-[10px] text-slate-500 bg-blue-50/60 p-2 rounded-lg border border-blue-100 mb-3">
                      <span className="font-semibold text-blue-900">📚 Source Reference: </span>
                      {art.citations.join(' • ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Updated: {new Date(art.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleArticleStatus(art.id, art.status)}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {art.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleEditArticle(art)}
                      className="p-1.5 rounded text-blue-700 hover:bg-blue-50"
                      title="Edit Article"
                    >
                      <Edit2 size={14} />
                    </button>
                    {confirmDeleteId === art.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art.id)}
                          className="px-2 py-1 rounded text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(art.id)}
                        className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                        title="Delete Article"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <BookOpen size={36} className="text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">No Knowledge Articles Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search keywords or add a new approved college answer.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPORT ESCALATIONS DESK (MODULE 37 & 38) */}
      {activeTab === 'escalations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Ticket Listing Column */}
          <div className="lg:col-span-5 space-y-3">
            {/* Escalation Stats Bar */}
            <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200">
              {(['PENDING', 'ASSIGNED', 'RESOLVED', 'REJECTED'] as const).map((st) => {
                const count = escalations.filter((e) => e.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setEscStatusFilter(escStatusFilter === st ? 'ALL' : st)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      escStatusFilter === st
                        ? 'bg-[#153B70] text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-black">{count}</div>
                    <div className="text-[9px] font-bold uppercase tracking-tight">{st}</div>
                  </button>
                );
              })}
            </div>

            {/* Department Filter */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Dept:</span>
              <button
                onClick={() => setEscDeptFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                  escDeptFilter === 'ALL'
                    ? 'bg-[#153B70] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Departments
              </button>
              {(['ADMISSIONS', 'FINANCE', 'ACADEMICS', 'EXAMINATIONS', 'ICT_SUPPORT', 'GENERAL'] as const).map(
                (dep) => (
                  <button
                    key={dep}
                    onClick={() => setEscDeptFilter(dep)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                      escDeptFilter === dep
                        ? 'bg-[#153B70] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dep.replace('_', ' ')}
                  </button>
                )
              )}
            </div>

            {/* Tickets List */}
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredEscalations.map((esc) => {
                const isSelected = selectedEscalation?.id === esc.id;
                return (
                  <div
                    key={esc.id}
                    onClick={() => setSelectedEscalation(esc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#153B70] shadow-md ring-1 ring-[#153B70]'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-[#153B70]">
                        {esc.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          esc.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : esc.status === 'ASSIGNED'
                            ? 'bg-blue-100 text-blue-800'
                            : esc.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {esc.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mb-1 line-clamp-1">
                      {esc.subject}
                    </h4>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                      {esc.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700">{esc.visitorName}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                        {esc.department}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredEscalations.length === 0 && (
                <div className="bg-white p-8 text-center rounded-xl border border-dashed border-slate-300">
                  <Headphones size={28} className="text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-600">No Escalations in this view</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Detail & Audit Replay Column */}
          <div className="lg:col-span-7">
            {selectedEscalation ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-black text-[#153B70]">
                        {selectedEscalation.ticketNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-slate-100 text-slate-700">
                        {selectedEscalation.department}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          selectedEscalation.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : selectedEscalation.status === 'ASSIGNED'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedEscalation.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {selectedEscalation.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {selectedEscalation.subject}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedEscalation.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleAssignToMe(selectedEscalation)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#153B70] text-white hover:bg-[#092c60] flex items-center gap-1 shadow-xs"
                      >
                        <UserCheck size={14} />
                        <span>Assign to Me</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Visitor & Requester Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Visitor</span>
                    <span className="font-bold text-slate-900">{selectedEscalation.visitorName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Email</span>
                    <a
                      href={`mailto:${selectedEscalation.visitorEmail}`}
                      className="font-medium text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Mail size={12} />
                      <span className="truncate">{selectedEscalation.visitorEmail}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Assigned Officer</span>
                    <span className="font-medium text-slate-800">
                      {selectedEscalation.assignedToName || 'Unassigned (In Pool)'}
                    </span>
                  </div>
                </div>

                {/* Query Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Inquiry Content &amp; User Request
                  </h4>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {selectedEscalation.description}
                  </div>
                </div>

                {/* Chronological Escalation Audit Trail (Module 38) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-700" />
                    <span>Status Transition History &amp; Audit Trail</span>
                  </h4>
                  <div className="space-y-2 border-l-2 border-blue-200 ml-2 pl-3">
                    {selectedEscHistory.map((hist) => (
                      <div key={hist.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{hist.changedByName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {hist.fromStatus || 'START'} → {hist.toStatus}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(hist.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {hist.note && (
                          <p className="text-[11px] text-slate-600 mt-0.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                            {hist.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution & Status Action Form */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    Update Ticket Status &amp; Record Resolution Notes
                  </h4>

                  <textarea
                    rows={2}
                    placeholder="Enter internal action note, student follow-up outcome or resolution details..."
                    value={resolutionNoteInput}
                    onChange={(e) => {
                      setResolutionNoteInput(e.target.value);
                      if (resolutionError) setResolutionError(null);
                    }}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#153B70]"
                  />

                  {resolutionError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle size={14} />
                      <span>{resolutionError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleUpdateEscalationStatus('REJECTED')}
                      className="px-3.5 py-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                    >
                      Reject / Invalid
                    </button>
                    <button
                      onClick={() => handleUpdateEscalationStatus('ASSIGNED')}
                      className="px-3.5 py-2 rounded-lg text-xs font-bold text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors"
                    >
                      Keep In Review
                    </button>
                    <button
                      onClick={() => handleUpdateEscalationStatus('RESOLVED')}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-300 h-full flex flex-col items-center justify-center">
                <Headphones size={42} className="text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-base">Select an Escalation Ticket</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Choose an inquiry from the queue on the left to review visitor communication, assign officers, and update resolution status.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & SERVICE DESK METRICS (MODULE 38) */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Conversations
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {analytics.totalConversations}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                ↑ Active on Website
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Messages
              </span>
              <span className="text-2xl font-black text-[#153B70] mt-1 block">
                {analytics.totalMessages}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                Exchanged with visitors
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Escalations
              </span>
              <span className="text-2xl font-black text-purple-700 mt-1 block">
                {analytics.totalEscalations}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                {analytics.pendingEscalations} Pending Action
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Resolution Rate
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {analytics.totalEscalations > 0
                  ? Math.round((analytics.resolvedEscalations / analytics.totalEscalations) * 100)
                  : 100}
                %
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                {analytics.resolvedEscalations} cases closed
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Avg Resolution Time
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {analytics.avgResolutionHours}h
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                Within 24h SLA target
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Helpfulness Ratio
              </span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">
                {analytics.helpfulnessRatio}%
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                👍 Verified Grounded
              </span>
            </div>
          </div>

          {/* Department Breakdown & Unanswered Queries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Department Workload Breakdown */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 size={16} className="text-[#153B70]" />
                <span>Escalation Volume by Department</span>
              </h3>

              <div className="space-y-3">
                {Object.entries(analytics.departmentDistribution).map(([dept, count]) => {
                  const pct =
                    analytics.totalEscalations > 0
                      ? Math.round((count / analytics.totalEscalations) * 100)
                      : 0;
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{dept.replace('_', ' ')}</span>
                        <span className="text-slate-500">
                          {count} tickets ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#153B70] to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                💡 <strong>Operational Insight:</strong> Admissions and Finance account for the majority of human inquiries. Pre-approving FAQ articles on fee deadlines and admission cut-offs significantly reduces pending support tickets.
              </div>
            </div>

            {/* Unanswered Questions / Fallback Log */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <HelpCircle size={16} className="text-amber-600" />
                    <span>Unanswered &amp; Low-Confidence Enquiries</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    User queries that fell below the {aiConfig.confidenceThreshold} confidence threshold. Convert these into official Knowledge Base articles with 1 click.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900">
                  {fallbacks.filter((f) => !f.resolved).length} Unaddressed
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {fallbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                      fb.resolved
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">"{fb.query}"</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-200 text-slate-700 uppercase">
                          {fb.language}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Logged on {new Date(fb.timestamp).toLocaleDateString()} at{' '}
                        {new Date(fb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {!fb.resolved ? (
                        <button
                          onClick={() => handleConvertFallback(fb)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#153B70] text-white hover:bg-[#092c60] flex items-center gap-1 shadow-2xs"
                        >
                          <Plus size={13} />
                          <span>Convert to KB Article</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check size={13} />
                          <span>Resolved</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI GOVERNANCE & RAG CONTROLS (MODULE 39) */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Sliders size={20} className="text-[#153B70]" />
              <span>Controlled RAG &amp; AI Intelligence Governance</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enforce strict institutional boundaries, response thresholds, and emergency overrides to prevent hallucinated fees or unauthorized admission offers.
            </p>
          </div>

          <form onSubmit={handleSaveAIConfig} className="space-y-6">
            {/* Confidence Threshold Slider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800">
                    Minimum RAG Confidence Threshold
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Answers below this threshold automatically trigger institutional human escalation.
                  </p>
                </div>
                <div className="text-base font-black text-[#153B70] font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {aiConfig.confidenceThreshold.toFixed(2)} ({(aiConfig.confidenceThreshold * 100).toFixed(0)}%)
                </div>
              </div>

              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.01"
                value={aiConfig.confidenceThreshold}
                onChange={(e) =>
                  setAIConfig({ ...aiConfig, confidenceThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-[#153B70] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.50 (Permissive)</span>
                <span className="font-bold text-[#153B70]">0.68 (Recommended Standard)</span>
                <span>0.95 (Strict Matching)</span>
              </div>
            </div>

            {/* Provider Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Operating Retrieval Architecture
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setAIConfig({ ...aiConfig, providerMode: 'CONTROLLED_RAG' })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    aiConfig.providerMode === 'CONTROLLED_RAG'
                      ? 'border-[#153B70] bg-blue-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Controlled RAG</span>
                    {aiConfig.providerMode === 'CONTROLLED_RAG' && (
                      <CheckCircle2 size={16} className="text-[#153B70]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Semantic matching with approved article citations and source badges.
                  </p>
                </div>

                <div
                  onClick={() => setAIConfig({ ...aiConfig, providerMode: 'STRICT_MATCH' })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    aiConfig.providerMode === 'STRICT_MATCH'
                      ? 'border-[#153B70] bg-blue-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Strict Match Only</span>
                    {aiConfig.providerMode === 'STRICT_MATCH' && (
                      <CheckCircle2 size={16} className="text-[#153B70]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Requires direct keyword match without paraphrase generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Mode Kill Switch */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                  <AlertTriangle size={16} className="text-rose-600" />
                  <span>Emergency AI Override / Kill Switch</span>
                </div>
                <p className="text-[11px] text-rose-700 mt-1 leading-tight">
                  When enabled, all automated responses are paused and visitors are immediately redirected to submit verified human escalation tickets.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={aiConfig.emergencyMode}
                  onChange={(e) => setAIConfig({ ...aiConfig, emergencyMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Changes take effect across the live website chatbot immediately.
              </span>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#153B70] hover:bg-[#092c60] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <ShieldCheck size={15} />
                <span>Save AI Policy Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE / EDIT ARTICLE MODAL */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#153B70] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#092c60] flex items-center justify-center font-bold">
                  <BookOpen size={18} />
                </div>
                <h4 className="font-bold text-sm">
                  {editingArticle ? 'Edit Knowledge Article' : 'Create Approved Knowledge Article'}
                </h4>
              </div>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70] bg-white"
                  >
                    <option value="ADMISSIONS">Admissions</option>
                    <option value="FINANCE">Finance &amp; Fees</option>
                    <option value="ACADEMICS">Academics &amp; Programmes</option>
                    <option value="EXAMINATIONS">Examinations &amp; CBT</option>
                    <option value="ICT_SUPPORT">ICT Support</option>
                    <option value="GENERAL">General &amp; Campuses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publishing Status *
                  </label>
                  <select
                    value={articleForm.status}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        status: e.target.value as ChatbotKnowledgeStatus,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70] bg-white"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live on Chatbot)</option>
                    <option value="DRAFT">DRAFT (Under Internal Review)</option>
                    <option value="ARCHIVED">ARCHIVED (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How do I pay college fees via M-Pesa?"
                  value={articleForm.question}
                  onChange={(e) => setArticleForm({ ...articleForm, question: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Answer (Grounded) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Official college response provided by department head..."
                  value={articleForm.answer}
                  onChange={(e) => setArticleForm({ ...articleForm, answer: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Search Keywords (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mpesa, fee, payment, paybill, tuition"
                  value={articleForm.keywords}
                  onChange={(e) => setArticleForm({ ...articleForm, keywords: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Citation Sources (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HI-TECH College Prospectus 2026, TVETA Guidelines"
                  value={articleForm.citations}
                  onChange={(e) => setArticleForm({ ...articleForm, citations: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#153B70] text-white hover:bg-[#092c60] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  <span>Save Approved Article</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
