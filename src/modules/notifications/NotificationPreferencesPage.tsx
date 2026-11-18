import { useCallback, useEffect, useState } from 'react';
import { BellRing, CheckCircle2, Lock, Save, ShieldAlert } from 'lucide-react';
import { StaffButton } from '../staff/components/StaffDashboardUI';

export interface NotificationPreferenceItem {
  category: string;
  mandatory: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

const CATEGORY_LABELS: Record<string, { title: string; description: string }> = {
  SECURITY: {
    title: 'Account Security & Sign-In Alerts',
    description:
      'Password resets, MFA changes, suspicious login warnings, and session revocations. Mandatory in-app & email delivery.',
  },
  ACADEMIC: {
    title: 'Academic, Timetables & SIS Transitions',
    description:
      'Unit registration windows, examination schedules, transfers, deferments, and graduation milestones.',
  },
  DOCUMENT: {
    title: 'Documents & Digital Signatures',
    description:
      'Approval requests, sequential/parallel digital signature turns, and official document issuance.',
  },
  FINANCE: {
    title: 'Fees, Invoices & M-Pesa Receipts',
    description:
      'Tuition invoices, payment receipts, clearance alerts, and financial holds.',
  },
  ADMISSIONS: {
    title: 'Admissions & Registration Onboarding',
    description:
      'Application status changes, offer letters, and portal onboarding invitations.',
  },
  GENERAL: {
    title: 'Campus Bulletins & Announcements',
    description:
      'College-wide operational notices, events, library reminders, and campus updates.',
  },
};

export default function NotificationPreferencesPage() {
  const [items, setItems] = useState<NotificationPreferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Unable to load notification preferences.');
        return;
      }
      setItems(json.data);
    } catch {
      setError('Network error while loading preferences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const toggleChannel = (
    category: string,
    field: 'inAppEnabled' | 'emailEnabled' | 'smsEnabled' | 'pushEnabled'
  ) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row.category !== category) return row;
        if (row.mandatory && (field === 'inAppEnabled' || field === 'emailEnabled')) {
          return row;
        }
        return { ...row, [field]: !row[field] };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to save preferences.');
        return;
      }
      setNotice('Notification channel preferences saved.');
      await loadPreferences();
    } catch {
      setError('Unable to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterPush = async () => {
    setPushLoading(true);
    setNotice(null);
    setError(null);
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission().catch(() => undefined);
      }
      const res = await fetch('/api/notifications/push-subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceLabel:
            typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'Portal Browser',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Unable to register browser for push notifications.');
        return;
      }
      setNotice(`Registered device for push notifications (${json.data.id}).`);
    } catch {
      setError('Push subscription failed.');
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="space-y-5">
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

      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-2.5">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>Institutional Safety Policy:</strong> Mandatory{' '}
            <span className="font-mono font-bold">SECURITY</span> alerts (password resets, MFA
            events, active session alerts) cannot be silenced for in-app or email channels.
          </div>
        </div>
        <StaffButton variant="secondary" disabled={pushLoading} onClick={handleRegisterPush}>
          <BellRing size={14} /> {pushLoading ? 'Registering...' : 'Enable Browser Push'}
        </StaffButton>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
            Loading channel preferences...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                  <th className="py-3.5 px-5 font-bold">Notification Category</th>
                  <th className="py-3.5 px-4 text-center font-bold">In-App</th>
                  <th className="py-3.5 px-4 text-center font-bold">Email</th>
                  <th className="py-3.5 px-4 text-center font-bold">SMS</th>
                  <th className="py-3.5 px-4 text-center font-bold">Push</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => {
                  const meta = CATEGORY_LABELS[item.category] ?? {
                    title: item.category,
                    description: 'Institutional portal updates.',
                  };
                  return (
                    <tr
                      key={item.category}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#102D50] dark:text-white">
                            {meta.title}
                          </span>
                          {item.mandatory && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              <Lock size={10} /> MANDATORY
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                          {meta.description}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${item.category} In-App`}
                          checked={item.inAppEnabled}
                          disabled={item.mandatory}
                          onChange={() => toggleChannel(item.category, 'inAppEnabled')}
                          className="h-4 w-4 accent-[#1769AA] cursor-pointer disabled:opacity-60"
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${item.category} Email`}
                          checked={item.emailEnabled}
                          disabled={item.mandatory}
                          onChange={() => toggleChannel(item.category, 'emailEnabled')}
                          className="h-4 w-4 accent-[#1769AA] cursor-pointer disabled:opacity-60"
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${item.category} SMS`}
                          checked={item.smsEnabled}
                          onChange={() => toggleChannel(item.category, 'smsEnabled')}
                          className="h-4 w-4 accent-[#1769AA] cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${item.category} Push`}
                          checked={item.pushEnabled}
                          onChange={() => toggleChannel(item.category, 'pushEnabled')}
                          className="h-4 w-4 accent-[#1769AA] cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 flex justify-end bg-slate-50/50 dark:bg-slate-800/30">
          <StaffButton disabled={saving || loading} onClick={handleSave}>
            <Save size={14} /> {saving ? 'Saving Preferences...' : 'Save Channel Preferences'}
          </StaffButton>
        </div>
      </section>
    </div>
  );
}
