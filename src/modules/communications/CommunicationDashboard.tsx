import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FileText, Megaphone, Send, Users } from 'lucide-react';
import { ALL_STAFF_ROLES, type StaffUserAccount } from '../../config/staff-navigation';
import {
  StaffButton,
  StaffPageHeader,
  StaffStatusTag,
} from '../staff/components/StaffDashboardUI';

interface TemplateItem {
  id: string;
  code: string;
  title: string;
  category: string;
  bodyTemplate: string;
  defaultChannels: string[];
}

interface CampaignItem {
  id: string;
  title: string;
  category: string;
  targetAudience: string;
  targetScopeValue: string | null;
  channels: string[];
  message: string;
  recipientCount: number;
  sentByName: string;
  createdAt: string;
}

export default function CommunicationDashboard({ user }: { user: StaffUserAccount }) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Composer form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [targetAudience, setTargetAudience] = useState('ALL_USERS');
  const [targetScopeValue, setTargetScopeValue] = useState('');
  const [channels, setChannels] = useState<string[]>(['IN_APP', 'EMAIL']);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tplRes, cmpRes] = await Promise.all([
        fetch('/api/notifications/admin/templates', { credentials: 'include' }),
        fetch('/api/notifications/admin/campaigns', { credentials: 'include' }),
      ]);
      const tplJson = await tplRes.json().catch(() => null);
      const cmpJson = await cmpRes.json().catch(() => null);

      if (tplJson?.success) setTemplates(tplJson.data);
      if (cmpRes.ok && cmpJson?.success) {
        setCampaigns(cmpJson.data);
      } else if (cmpRes.status === 403) {
        setError(cmpJson?.error || 'Communications privileges required to view/publish broadcasts.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((item) => item !== ch) : [...prev, ch]
    );
  };

  const applyTemplate = (tpl: TemplateItem) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setMessage(tpl.bodyTemplate);
    if (Array.isArray(tpl.defaultChannels) && tpl.defaultChannels.length > 0) {
      setChannels(tpl.defaultChannels);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/notifications/admin/broadcast', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          priority,
          targetAudience,
          targetScopeValue: targetScopeValue || undefined,
          channels: channels.length > 0 ? channels : ['IN_APP'],
          message,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Broadcast failed.');
        return;
      }
      setNotice(
        `Broadcast "${json.data.campaign.title}" dispatched to ${json.data.dispatchedCount} active portal account(s).`
      );
      setTitle('');
      setMessage('');
      await loadData();
    } catch {
      setError('Network error while publishing broadcast.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Institutional Broadcasts & Communications"
        description={`Publish verified announcements across IN-APP, EMAIL, SMS, and PUSH channels (${user.roleTitle}).`}
        breadcrumb="Broadcast Communications"
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={15} /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr] items-start">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Megaphone size={18} className="text-[#1769AA]" /> Compose Broadcast Campaign
            </h2>
            {templates.length > 0 && (
              <select
                aria-label="Apply message template"
                defaultValue=""
                onChange={(e) => {
                  const found = templates.find((t) => t.id === e.target.value);
                  if (found) applyTemplate(found);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="">Load Approved Template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Announcement Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Trimester Examination Clearance Window"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="ADMISSIONS">ADMISSIONS</option>
                  <option value="DOCUMENT">DOCUMENT</option>
                  <option value="SECURITY">SECURITY</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Target Audience
                <select
                  value={targetAudience}
                  onChange={(e) => {
                    setTargetAudience(e.target.value);
                    setTargetScopeValue('');
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ALL_USERS">All Portal Accounts</option>
                  <option value="ALL_STUDENTS">All Students</option>
                  <option value="ALL_STAFF">All Staff</option>
                  <option value="CAMPUS">Specific Campus</option>
                  <option value="ROLE">Specific Role</option>
                </select>
              </label>
            </div>

            {targetAudience === 'CAMPUS' && (
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Select Target Campus
                <select
                  value={targetScopeValue}
                  onChange={(e) => setTargetScopeValue(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Choose campus...</option>
                  <option value="cmp-nairobi">Nairobi Main Campus</option>
                  <option value="cmp-westlands">Westlands Technology Park Campus</option>
                  <option value="cmp-mombasa">Mombasa Coastal Campus</option>
                </select>
              </label>
            )}

            {targetAudience === 'ROLE' && (
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Select Target Role
                <select
                  value={targetScopeValue}
                  onChange={(e) => setTargetScopeValue(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Choose role...</option>
                  <option value="STUDENT">STUDENT</option>
                  {ALL_STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Delivery Channels
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {(['IN_APP', 'EMAIL', 'SMS', 'PUSH'] as const).map((ch) => (
                  <label
                    key={ch}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={channels.includes(ch)}
                      onChange={() => toggleChannel(ch)}
                      className="accent-[#1769AA]"
                    />
                    <span className="font-semibold">{ch}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Message Content
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Write clear official institutional notice..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <StaffButton type="submit" disabled={submitting}>
              <Send size={14} /> {submitting ? 'Dispatching...' : 'Dispatch Official Broadcast'}
            </StaffButton>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Users size={18} className="text-[#1769AA]" /> Recent Broadcast Campaigns
          </h2>
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">Loading campaign history...</div>
          ) : campaigns.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <FileText size={24} className="mx-auto text-slate-400" />
              <p className="text-xs text-slate-500">No broadcast campaigns sent yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns.map((c) => (
                <div key={c.id} className="py-3.5 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#102D50] dark:text-white">
                      {c.title}
                    </span>
                    <StaffStatusTag status={c.category} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {c.message}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Audience: <strong>{c.targetAudience}</strong> ({c.recipientCount} recipients)
                    </span>
                    <span className="font-mono">
                      {String(c.createdAt).slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
