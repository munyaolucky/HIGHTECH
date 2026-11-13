/**
 * HI-TECH College Academic & Certification Platform
 * Modules 40, 41 & 42: AI Administration, Knowledge Indexing, Audit & Performance Monitoring Centre
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  History,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Play,
  RotateCcw,
  Plus,
  Check,
  X,
  Sliders,
  Layers,
  Clock,
  Server,
  FileText,
  Lock,
  Search,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  getAIConfig,
  updateAIConfig,
  triggerEmergencyDisable,
  liftEmergencyDisable,
  getAIProviders,
  runProviderHealthCheck,
  getProviderHealthHistory,
  getAIQuotas,
  saveAIQuota,
  getPromptTemplates,
  getPromptHistory,
  createPromptTemplate,
  publishPromptTemplate,
  archivePromptTemplate,
  getIndexingJobs,
  retryIndexingJob,
  cancelIndexingJob,
  runBulkReindexPublished,
  processNextIndexingBatch,
  getGovernanceAudits,
  exportGovernanceAuditsCSV,
  getAIServiceAlerts,
  updateAIServiceAlert,
  getAIPerformanceDashboard,
} from '../../services/chatbotService';
import {
  AIGovernanceAudit,
  AIKnowledgeIndexJob,
  AIPerformanceReport,
  AIPromptTemplate,
  AIPromptVersionHistory,
  AIProviderConfiguration,
  AIProviderHealthHistory,
  AIServiceAlert,
  AIUsageQuota,
  ChatbotAIConfig,
} from '../../types/chatbot';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

type GovernanceTab = 'controls' | 'prompts' | 'indexing' | 'performance' | 'audit';

export default function AIGovernancePortal() {
  const [activeTab, setActiveTab] = useSyncedPortalTab<GovernanceTab>('ai-governance', 'controls');
  const [toast, setToast] = useState<string | null>(null);

  // Module 40: Configuration, Providers, Quotas
  const [config, setConfig] = useState<ChatbotAIConfig>(getAIConfig());
  const [providers, setProviders] = useState<AIProviderConfiguration[]>([]);
  const [healthHistory, setHealthHistory] = useState<AIProviderHealthHistory[]>([]);
  const [quotas, setQuotas] = useState<AIUsageQuota[]>([]);
  const [checkingProviderKey, setCheckingProviderKey] = useState<string | null>(null);

  // Module 40/41: Prompts & Rollback
  const [prompts, setPrompts] = useState<AIPromptTemplate[]>([]);
  const [promptHistory, setPromptHistory] = useState<AIPromptVersionHistory[]>([]);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [newPromptForm, setNewPromptForm] = useState({
    name: 'HI-TECH Grounded Support Advisor',
    description: '',
    content: '',
  });

  // Module 41: Indexing Queue
  const [indexJobs, setIndexJobs] = useState<AIKnowledgeIndexJob[]>([]);
  const [indexStatusFilter, setIndexStatusFilter] = useState<string>('ALL');

  // Module 42: Performance & Alerts
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [report, setReport] = useState<AIPerformanceReport | null>(null);
  const [alerts, setAlerts] = useState<AIServiceAlert[]>([]);

  // Module 41: Governance Audit
  const [audits, setAudits] = useState<AIGovernanceAudit[]>([]);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    targetType: '',
    from: '',
    to: '',
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = () => {
    setConfig(getAIConfig());
    setProviders(getAIProviders());
    setHealthHistory(getProviderHealthHistory());
    setQuotas(getAIQuotas());
    setPrompts(getPromptTemplates());
    setPromptHistory(getPromptHistory());
    setIndexJobs(getIndexingJobs());
    setReport(getAIPerformanceDashboard(daysFilter));
    setAlerts(getAIServiceAlerts());
    setAudits(getGovernanceAudits(auditFilters));
  };

  useEffect(() => {
    loadAll();
  }, [daysFilter]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateAIConfig(config);
    loadAll();
    notify('Institutional AI governance settings saved.');
  };

  const handleEmergencyToggle = () => {
    if (config.emergencyMode) {
      liftEmergencyDisable();
      notify('Emergency AI override lifted. Normal governance policies resumed.');
    } else {
      triggerEmergencyDisable('Emergency AI shutdown triggered from AI Governance Centre');
      notify('EMERGENCY DISABLE ACTIVATED: All automated AI responses paused.');
    }
    loadAll();
  };

  const handleCheckProvider = (providerKey: string) => {
    setCheckingProviderKey(providerKey);
    setTimeout(() => {
      const res = runProviderHealthCheck(providerKey);
      setCheckingProviderKey(null);
      loadAll();
      notify(res.healthy ? `Provider ${providerKey} is healthy (${res.latencyMs}ms).` : res.message);
    }, 350);
  };

  const handleSaveQuota = (quota: AIUsageQuota) => {
    saveAIQuota(quota);
    loadAll();
    notify(`Updated monthly usage quota for role ${quota.role}.`);
  };

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    createPromptTemplate(newPromptForm);
    setShowPromptModal(false);
    setNewPromptForm({
      name: 'HI-TECH Grounded Support Advisor',
      description: '',
      content: '',
    });
    loadAll();
    notify('Draft prompt template version created.');
  };

  const handlePublishPrompt = (id: string, isRollback = false) => {
    publishPromptTemplate(id, isRollback);
    loadAll();
    notify(isRollback ? 'Prompt rolled back and published.' : 'Prompt version published to production.');
  };

  const handleArchivePrompt = (id: string) => {
    archivePromptTemplate(id);
    loadAll();
    notify('Prompt template archived.');
  };

  const handleBulkReindex = () => {
    const count = runBulkReindexPublished();
    loadAll();
    notify(`Queued ${count} published knowledge articles for indexing.`);
  };

  const handleProcessBatch = () => {
    const processed = processNextIndexingBatch();
    loadAll();
    notify(
      processed > 0
        ? `Processed ${processed} pending indexing jobs successfully.`
        : 'No pending jobs available in the indexing queue.'
    );
  };

  const handleRetryJob = (jobId: string) => {
    retryIndexingJob(jobId);
    loadAll();
    notify('Failed indexing job retried and marked INDEXED.');
  };

  const handleCancelJob = (jobId: string) => {
    cancelIndexingJob(jobId);
    loadAll();
    notify('Pending indexing job cancelled.');
  };

  const handleAlertAction = (alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    updateAIServiceAlert(alertId, status);
    loadAll();
    notify(`Service alert marked ${status}.`);
  };

  const handleApplyAuditFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setAudits(getGovernanceAudits(auditFilters));
  };

  const handleDownloadAuditCSV = () => {
    const csv = exportGovernanceAuditsCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hitech-ai-governance-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Audit log CSV exported.');
  };

  const filteredIndexJobs =
    indexStatusFilter === 'ALL'
      ? indexJobs
      : indexJobs.filter((j) => j.status === indexStatusFilter);

  const indexStats = {
    pending: indexJobs.filter((j) => j.status === 'PENDING').length,
    processing: indexJobs.filter((j) => j.status === 'PROCESSING').length,
    indexed: indexJobs.filter((j) => j.status === 'INDEXED').length,
    failed: indexJobs.filter((j) => j.status === 'FAILED').length,
  };

  const openAlertsCount = alerts.filter((a) => a.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#153B70] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-blue-400 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Executive Governance Header */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153B70] to-[#1a437e] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-black bg-amber-400 text-[#092c60] tracking-wider uppercase">
                Modules 40 – 42
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-white/10 text-blue-200 border border-white/10 flex items-center gap-1">
                <Lock size={12} />
                <span>Server-Side Credential Isolation</span>
              </span>
              {config.emergencyMode ? (
                <span className="px-2.5 py-0.5 rounded text-xs font-black bg-rose-600 text-white animate-pulse">
                  EMERGENCY SHUTDOWN ACTIVE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  AI GOVERNANCE OPERATIONAL
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Governance, Knowledge Indexing &amp; Performance Centre
            </h1>
            <p className="text-sm text-blue-200 max-w-3xl mt-1">
              Platform-wide AI availability controls, role quotas, prompt version rollback, persistent indexing queue, retrieval telemetry, service alerts, and compliance audit exports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={loadAll}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-colors"
            >
              <RefreshCw size={14} />
              <span>Sync Telemetry</span>
            </button>
            <button
              onClick={handleEmergencyToggle}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-colors ${
                config.emergencyMode
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  : 'bg-[#d92332] hover:bg-rose-700 text-white'
              }`}
            >
              <ShieldAlert size={15} />
              <span>{config.emergencyMode ? 'Lift Emergency Disable' : 'Emergency Disable AI'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-7 flex flex-wrap gap-2 border-t border-white/15 pt-4">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'controls'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sliders size={15} />
            <span>Governance &amp; Quotas (Mod 40)</span>
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'prompts'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Layers size={15} />
            <span>Prompts &amp; Rollback ({prompts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('indexing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'indexing'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Database size={15} />
            <span>
              Indexing Queue ({indexStats.pending} Pending{indexStats.failed > 0 ? ` · ${indexStats.failed} Failed` : ''})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'performance'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Activity size={15} />
            <span>
              Performance &amp; Alerts (Mod 42)
              {openAlertsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#d92332] text-white text-[10px]">
                  {openAlertsCount}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-white text-[#153B70] shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <History size={15} />
            <span>Audit Log ({audits.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GOVERNANCE, PROVIDERS & ROLE QUOTAS (MODULE 40) */}
      {activeTab === 'controls' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Institutional Configuration */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Cpu size={18} className="text-[#153B70]" />
                <span>Institution AI Availability &amp; Thresholds</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controls whether the website chatbot and academic AI assistants are permitted to respond.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Institution AI Enabled</div>
                  <div className="text-[11px] text-slate-500">
                    Allows AI-assisted RAG responses when safety conditions are satisfied.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#153B70]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Global Platform AI Gate</div>
                  <div className="text-[11px] text-slate-500">
                    Master institution-level switch synchronized with server environment gate.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.globalEnabled}
                  onChange={(e) => setConfig({ ...config, globalEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#153B70]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Token Cap
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={config.monthlyTokenLimit}
                    onChange={(e) =>
                      setConfig({ ...config, monthlyTokenLimit: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Request Cap
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={config.monthlyRequestLimit}
                    onChange={(e) =>
                      setConfig({ ...config, monthlyRequestLimit: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#153B70]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Retrieval Confidence Threshold</span>
                  <span className="font-mono text-[#153B70]">
                    {config.confidenceThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.40"
                  max="0.95"
                  step="0.01"
                  value={config.confidenceThreshold}
                  onChange={(e) =>
                    setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#153B70]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Grounded Context Articles
                  </label>
                  <select
                    value={config.maxContextArticles}
                    onChange={(e) =>
                      setConfig({ ...config, maxContextArticles: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} Articles
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Response Language Policy
                  </label>
                  <select
                    value={config.defaultLanguage}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultLanguage: e.target.value as ChatbotAIConfig['defaultLanguage'],
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="auto">Automatic (English &amp; Kiswahili)</option>
                    <option value="en">English Only</option>
                    <option value="sw">Kiswahili Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153B70] hover:bg-[#092c60] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck size={15} />
                  <span>Save AI Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right: Provider Status & Health Checks */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Server size={18} className="text-[#153B70]" />
                  <span>Server-Side AI Providers &amp; Health Checks</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secret keys remain strictly server-side; administrators inspect operational health only.
                </p>
              </div>

              <div className="space-y-3">
                {providers.map((prov) => (
                  <div
                    key={prov.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{prov.displayName}</span>
                          {prov.isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{prov.endpointLabel}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          prov.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : prov.status === 'DEGRADED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {prov.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
                      <div className="text-slate-600 font-mono">
                        Chat: {prov.chatModel} · Embed: {prov.embeddingModel}
                      </div>
                      <button
                        onClick={() => handleCheckProvider(prov.providerKey)}
                        disabled={checkingProviderKey === prov.providerKey}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-[#153B70] border border-slate-300 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Zap size={12} />
                        <span>
                          {checkingProviderKey === prov.providerKey ? 'Testing...' : 'Test Health'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {healthHistory.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                    Latest Probe Results
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {healthHistory.slice(0, 4).map((hh) => (
                      <div
                        key={hh.id}
                        className="text-[11px] flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200"
                      >
                        <span className="font-medium text-slate-700 truncate max-w-[70%]">
                          <strong>{hh.providerKey}:</strong> {hh.message}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {hh.healthy ? `${hh.latencyMs}ms` : 'OFF'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Full-Width: Role-Based Usage Quotas */}
          <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-base">
                Role-Based Monthly AI Usage Quotas
              </h2>
              <p className="text-xs text-slate-500">
                Enforce token and request ceilings per institutional role to prevent runaway costs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quotas.map((q) => {
                const tokenPct = Math.min(
                  100,
                  Math.round((q.usedTokensThisMonth / Math.max(1, q.monthlyTokens)) * 100)
                );
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-[#153B70] tracking-wide">
                        ROLE: {q.role}
                      </span>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={q.enabled}
                          onChange={(e) =>
                            setQuotas((list) =>
                              list.map((item) =>
                                item.id === q.id ? { ...item, enabled: e.target.checked } : item
                              )
                            )
                          }
                          className="accent-[#153B70]"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Current Month Consumption</span>
                        <span className="font-mono font-bold">
                          {q.usedTokensThisMonth.toLocaleString()} / {q.monthlyTokens.toLocaleString()} tokens ({tokenPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tokenPct >= 90 ? 'bg-rose-600' : 'bg-[#153B70]'
                          }`}
                          style={{ width: `${tokenPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Monthly Token Limit
                        </label>
                        <input
                          type="number"
                          value={q.monthlyTokens}
                          onChange={(e) =>
                            setQuotas((list) =>
                              list.map((item) =>
                                item.id === q.id
                                  ? { ...item, monthlyTokens: Number(e.target.value) }
                                  : item
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Monthly Request Limit
                        </label>
                        <input
                          type="number"
                          value={q.monthlyRequests}
                          onChange={(e) =>
                            setQuotas((list) =>
                              list.map((item) =>
                                item.id === q.id
                                  ? { ...item, monthlyRequests: Number(e.target.value) }
                                  : item
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveQuota(q)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#153B70] border border-slate-300 text-xs font-bold"
                      >
                        Save Quota
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERSIONED PROMPT TEMPLATES & ROLLBACK (MODULE 40 & 41) */}
      {activeTab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">
                  System Prompt Templates
                </h2>
                <p className="text-xs text-slate-500">
                  Only one published version per prompt name is active at runtime.
                </p>
              </div>
              <button
                onClick={() => setShowPromptModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#153B70] hover:bg-[#092c60] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>New Draft Version</span>
              </button>
            </div>

            <div className="space-y-3">
              {prompts.map((prm) => (
                <div
                  key={prm.id}
                  className={`bg-white p-5 rounded-2xl border shadow-sm space-y-3 ${
                    prm.status === 'PUBLISHED' ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{prm.name}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          v{prm.version}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{prm.description}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        prm.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prm.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {prm.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                    {prm.content}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Updated: {new Date(prm.updatedAt).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {prm.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublishPrompt(prm.id, false)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Publish Version
                        </button>
                      )}
                      {prm.status === 'ARCHIVED' && (
                        <button
                          onClick={() => handlePublishPrompt(prm.id, true)}
                          className="px-3 py-1 rounded-lg bg-[#153B70] hover:bg-[#092c60] text-white font-bold flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          <span>Rollback to v{prm.version}</span>
                        </button>
                      )}
                      {prm.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleArchivePrompt(prm.id)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Version History Timeline */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <History size={16} className="text-[#153B70]" />
              <span>Prompt Version History &amp; Rollback Ledger</span>
            </h3>

            <div className="space-y-3 border-l-2 border-blue-200 ml-2 pl-4">
              {promptHistory.map((h) => (
                <div key={h.id} className="text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800">
                      v{h.version} · {h.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">By {h.changedByName}</div>
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                    {h.contentSnapshot}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERSISTENT KNOWLEDGE INDEXING QUEUE (MODULE 41) */}
      {activeTab === 'indexing' && (
        <div className="space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Jobs</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{indexStats.pending}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Processing</span>
              <span className="text-2xl font-black text-blue-600 block mt-1">{indexStats.processing}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Indexed</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">{indexStats.indexed}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Failed (Retryable)</span>
              <span className="text-2xl font-black text-rose-600 block mt-1">{indexStats.failed}</span>
            </div>
          </div>

          {/* Queue Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'PENDING', 'INDEXED', 'FAILED', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setIndexStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    indexStatusFilter === st
                      ? 'bg-[#153B70] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleProcessBatch}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Play size={13} />
                <span>Process Pending Batch</span>
              </button>
              <button
                onClick={handleBulkReindex}
                className="px-3.5 py-2 rounded-xl bg-[#153B70] hover:bg-[#092c60] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw size={13} />
                <span>Re-index All Published</span>
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-3">
            {filteredIndexJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black">
                        {job.articleCategory}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{job.id}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{job.articleQuestion}</h4>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black self-start ${
                      job.status === 'INDEXED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : job.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : job.status === 'FAILED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                {job.lastError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{job.lastError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex flex-wrap gap-4">
                    <span>
                      Attempts: <strong>{job.attempts}/{job.maxAttempts}</strong>
                    </span>
                    <span>
                      Embedding Model: <strong>{job.embeddingModel || 'text-embedding-004'}</strong>
                    </span>
                    <span>Created: {new Date(job.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        className="px-3 py-1 rounded-lg bg-[#153B70] text-white font-bold hover:bg-[#092c60]"
                      >
                        Retry Job
                      </button>
                    )}
                    {job.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI PERFORMANCE ANALYTICS & SERVICE ALERTS (MODULE 42) */}
      {activeTab === 'performance' && report && (
        <div className="space-y-6">
          {/* Period Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm">
                Telemetry Window &amp; Service Health
              </h2>
              <p className="text-[11px] text-slate-500">
                Real metrics recorded from live chatbot traffic, embeddings, and provider probes.
              </p>
            </div>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
              <option value={365}>Last 365 Days</option>
            </select>
          </div>

          {/* 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">AI Requests</span>
              <span className="text-2xl font-black text-slate-900 block mt-1">
                {report.totals.requests.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {report.totals.successfulRequests} succeeded
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tokens</span>
              <span className="text-2xl font-black text-[#153B70] block mt-1">
                {report.totals.totalTokens.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">
                In {report.totals.inputTokens} / Out {report.totals.outputTokens}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Cost</span>
              <span className="text-2xl font-black text-purple-700 block mt-1">
                ${report.totals.estimatedCost.toFixed(4)}
              </span>
              <span className="text-[10px] text-slate-500">USD equivalent</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Latency</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">
                {report.totals.avgLatencyMs}ms
              </span>
              <span className="text-[10px] text-slate-500">End-to-end RAG</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Failed / Blocked</span>
              <span className="text-2xl font-black text-rose-600 block mt-1">
                {report.totals.failedRequests + report.totals.blockedRequests}
              </span>
              <span className="text-[10px] text-slate-500">
                {report.totals.failedRequests} err · {report.totals.blockedRequests} blocked
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Open Alerts</span>
              <span className="text-2xl font-black text-[#d92332] block mt-1">
                {report.openAlerts}
              </span>
              <span className="text-[10px] text-slate-500">Needs review</span>
            </div>
          </div>

          {/* Breakdown Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Retrieval Outcomes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Knowledge Retrieval Outcomes
              </h3>
              <div className="space-y-2">
                {report.retrievalBreakdown.map((item) => (
                  <div
                    key={item.outcome}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-bold text-slate-800">
                      {item.outcome.replaceAll('_', ' ')}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-500">
                        Avg Similarity: <strong>{item.avgSimilarity}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153B70] font-black">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider Reliability & Model Usage */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Provider &amp; Model Consumption
              </h3>
              <div className="space-y-2">
                {report.byModel.map((m) => (
                  <div
                    key={`${m.providerKey}-${m.model}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{m.model}</div>
                      <div className="text-[10px] text-slate-500">{m.providerKey}</div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div className="font-bold text-[#153B70]">
                        {m.totalTokens.toLocaleString()} tokens
                      </div>
                      <div className="text-slate-500">
                        {m.requests} req · ${m.estimatedCost.toFixed(5)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consumption by Role */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Consumption by User Role</h3>
              <div className="space-y-2">
                {report.byRole.map((r) => (
                  <div
                    key={r.role}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-bold text-slate-800">{r.role}</span>
                    <span className="font-mono text-slate-600">
                      {r.totalTokens.toLocaleString()} tokens ({r.requests} requests)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consumption by Department */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Consumption by Academic/Support Department
              </h3>
              <div className="space-y-2">
                {report.byDepartment.map((d) => (
                  <div
                    key={d.department}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-bold text-slate-800">{d.department}</span>
                    <span className="font-mono text-slate-600">
                      {d.totalTokens.toLocaleString()} tokens ({d.requests} requests)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Service Health Alerts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <span>Automated AI Service Health &amp; Quota Alerts</span>
            </h3>

            <div className="space-y-3">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    al.status === 'OPEN'
                      ? 'bg-rose-50/60 border-rose-200'
                      : al.status === 'ACKNOWLEDGED'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          al.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : al.severity === 'WARNING'
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {al.severity}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{al.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-600">
                        {al.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{al.message}</p>
                    <div className="text-[10px] text-slate-400">
                      Source: {al.source} · {new Date(al.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {al.status === 'OPEN' && (
                      <button
                        onClick={() => handleAlertAction(al.id, 'ACKNOWLEDGED')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Acknowledge
                      </button>
                    )}
                    {al.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleAlertAction(al.id, 'RESOLVED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FILTERABLE AI GOVERNANCE AUDIT LOG (MODULE 41) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <form
            onSubmit={handleApplyAuditFilters}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Action Type
              </label>
              <select
                value={auditFilters.action}
                onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">All Actions</option>
                <option value="CONFIG_UPDATED">Configuration Updated</option>
                <option value="EMERGENCY_DISABLED">Emergency Disabled</option>
                <option value="EMERGENCY_LIFTED">Emergency Lifted</option>
                <option value="PROVIDER_CHECKED">Provider Checked</option>
                <option value="PROMPT_CREATED">Prompt Created</option>
                <option value="PROMPT_PUBLISHED">Prompt Published</option>
                <option value="PROMPT_ROLLED_BACK">Prompt Rolled Back</option>
                <option value="INDEXING_REQUESTED">Indexing Requested</option>
                <option value="QUOTA_UPDATED">Quota Updated</option>
                <option value="ALERT_RESOLVED">Alert Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Target Type
              </label>
              <input
                type="text"
                placeholder="e.g. AI_PROMPT"
                value={auditFilters.targetType}
                onChange={(e) => setAuditFilters({ ...auditFilters, targetType: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                From Date
              </label>
              <input
                type="date"
                value={auditFilters.from}
                onChange={(e) => setAuditFilters({ ...auditFilters, from: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                To Date
              </label>
              <input
                type="date"
                value={auditFilters.to}
                onChange={(e) => setAuditFilters({ ...auditFilters, to: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 rounded-lg bg-[#153B70] text-white text-xs font-bold hover:bg-[#092c60]"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={handleDownloadAuditCSV}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
                title="Export CSV"
              >
                <Download size={14} />
                <span>CSV</span>
              </button>
            </div>
          </form>

          <div className="space-y-2.5">
            {audits.map((rec) => (
              <div
                key={rec.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#153B70] font-mono text-[11px] font-black">
                      {rec.action}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {rec.targetType} {rec.targetId ? `· ${rec.targetId}` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rec.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  Actor: <strong className="text-slate-700">{rec.actorName}</strong> ({rec.actorId})
                </div>

                {rec.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-[#153B70] font-semibold text-[11px]">
                      Inspect Event Payload
                    </summary>
                    <pre className="mt-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono overflow-x-auto text-slate-700">
                      {JSON.stringify(rec.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE NEW PROMPT TEMPLATE MODAL */}
      {showPromptModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#153B70] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-amber-400" />
                <h4 className="font-bold text-sm">Create New System Prompt Version</h4>
              </div>
              <button onClick={() => setShowPromptModal(false)} className="text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePrompt} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={newPromptForm.name}
                  onChange={(e) => setNewPromptForm({ ...newPromptForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Version Notes *</label>
                <input
                  type="text"
                  required
                  placeholder="Describe changes in this prompt version..."
                  value={newPromptForm.description}
                  onChange={(e) =>
                    setNewPromptForm({ ...newPromptForm, description: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grounded System Instruction Content *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Enter institutional grounding rules..."
                  value={newPromptForm.content}
                  onChange={(e) => setNewPromptForm({ ...newPromptForm, content: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPromptModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#153B70] hover:bg-[#092c60] text-white rounded-lg"
                >
                  Save Draft Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
