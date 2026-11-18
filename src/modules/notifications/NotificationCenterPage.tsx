import { useCallback, useEffect, useState } from 'react';
import {
  Archive,
  ArrowUpRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  StaffButton,
  StaffPageHeader,
  StaffStatusTag,
} from '../staff/components/StaffDashboardUI';
import NotificationPreferencesPage from './NotificationPreferencesPage';

interface NotificationDto {
  id: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  actionUrl: string | null;
  senderName: string | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

const CATEGORIES = ['ALL', 'SECURITY', 'DOCUMENT', 'ACADEMIC', 'FINANCE', 'ADMISSIONS', 'GENERAL'];

export default function NotificationCenterPage({
  onNavigatePath,
}: {
  onNavigatePath?: (path: string) => void;
}) {
  const [viewMode, setViewMode] = useState<'inbox' | 'preferences'>('inbox');
  const [category, setCategory] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        category,
        unreadOnly: String(unreadOnly),
        archived: String(showArchived),
      });
      const res = await fetch(`/api/notifications?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Unable to load notifications.');
        return;
      }
      setItems(json.data.items ?? []);
      setUnreadCount(json.data.unreadCount ?? 0);
    } catch {
      setError('Network error while fetching notifications.');
    } finally {
      setLoading(false);
    }
  }, [category, unreadOnly, showArchived]);

  useEffect(() => {
    if (viewMode === 'inbox') {
      loadNotifications();
    }
  }, [viewMode, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      credentials: 'include',
    });
    await loadNotifications();
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/notifications/${id}/archive`, {
      method: 'POST',
      credentials: 'include',
    });
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      credentials: 'include',
    });
    await loadNotifications();
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Central Notification Center"
        description="Real-time institutional alerts, workflow actions, security notices, and multi-channel delivery preferences."
        breadcrumb="Notifications"
        actions={
          <div className="flex flex-wrap gap-2">
            <StaffButton
              variant={viewMode === 'inbox' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('inbox')}
            >
              <Bell size={14} /> Inbox ({unreadCount} Unread)
            </StaffButton>
            <StaffButton
              variant={viewMode === 'preferences' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('preferences')}
            >
              <SlidersHorizontal size={14} /> Preferences
            </StaffButton>
            {viewMode === 'inbox' && unreadCount > 0 && (
              <StaffButton variant="secondary" onClick={handleMarkAllRead}>
                <CheckCheck size={14} /> Mark All Read
              </StaffButton>
            )}
          </div>
        }
      />

      {viewMode === 'preferences' ? (
        <NotificationPreferencesPage />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    category === cat
                      ? 'bg-[#102D50] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="accent-[#1769AA]"
                />
                <span>Unread only</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="accent-[#1769AA]"
                />
                <span>Show archived</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                Loading notifications...
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bell size={26} className="mx-auto text-slate-400" />
                <p className="text-sm font-semibold text-[#102D50] dark:text-white">
                  No notifications in this view
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Security alerts, signature requests, and institutional broadcasts will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex flex-col gap-3 py-4 px-3 rounded-xl sm:flex-row sm:items-center sm:justify-between ${
                      !n.readAt ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="rounded-xl bg-[#eef4fd] dark:bg-slate-800 p-2.5 text-[#1769AA] dark:text-blue-400 shrink-0">
                        <Bell size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                            {n.category}
                          </span>
                          <StaffStatusTag status={n.priority} />
                          <span className="font-mono text-[11px] text-slate-400">
                            {String(n.createdAt).slice(0, 16).replace('T', ' ')}
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-[#102D50] dark:text-white">
                          {n.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {n.message}
                        </p>
                        {n.senderName && (
                          <p className="mt-1 text-[11px] text-slate-400">From: {n.senderName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <StaffStatusTag status={n.readAt ? 'READ' : 'UNREAD'} />
                      {n.actionUrl && onNavigatePath && (
                        <StaffButton
                          variant="secondary"
                          onClick={() => {
                            if (!n.readAt) handleMarkRead(n.id);
                            onNavigatePath(n.actionUrl!);
                          }}
                        >
                          Open <ArrowUpRight size={13} />
                        </StaffButton>
                      )}
                      {!n.readAt && (
                        <StaffButton variant="secondary" onClick={() => handleMarkRead(n.id)}>
                          <CheckCircle2 size={13} /> Mark read
                        </StaffButton>
                      )}
                      {!n.archivedAt && (
                        <button
                          type="button"
                          onClick={() => handleArchive(n.id)}
                          aria-label={`Archive ${n.title}`}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Archive size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
