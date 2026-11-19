import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Check,
  ArrowRight,
  Filter,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';
import {
  institutionalEventBus,
  InstitutionalEvent,
  STAFF_CHANNEL_REGISTRY,
  StaffChannelAssignment,
} from '../services/institutionalEventBus';
import { PortalRole } from '../types';

interface StaffEventFeedPaneProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: PortalRole;
  onNavigateTab?: (tabId: string) => void;
  onSwitchPortal?: (role: PortalRole) => void;
}

export default function StaffEventFeedPane({
  isOpen,
  onClose,
  currentRole,
  onNavigateTab,
  onSwitchPortal,
}: StaffEventFeedPaneProps) {
  const [events, setEvents] = useState<InstitutionalEvent[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'RESOLVED'>('ALL');
  const [activeTab, setActiveTab] = useState<'MY_CHANNEL' | 'ALL_CAMPUS'>('MY_CHANNEL');

  const staffAssignment: StaffChannelAssignment | undefined = useMemo(() => {
    return Object.values(STAFF_CHANNEL_REGISTRY).find((s) => s.role === currentRole);
  }, [currentRole]);

  const loadEvents = () => {
    setEvents(institutionalEventBus.getAllEvents());
  };

  useEffect(() => {
    loadEvents();
    return institutionalEventBus.subscribe(loadEvents);
  }, [currentRole]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredEvents = useMemo(() => {
    let list = events;
    if (activeTab === 'MY_CHANNEL' && staffAssignment) {
      list = list.filter((e) => e.channel === staffAssignment.channel);
    }
    if (filter === 'ACTION_REQUIRED') {
      list = list.filter((e) => e.severity === 'ACTION_REQUIRED' && e.status === 'PENDING');
    } else if (filter === 'RESOLVED') {
      list = list.filter((e) => e.status === 'RESOLVED');
    }
    return list;
  }, [events, activeTab, staffAssignment, filter]);

  const unreadMyChannel = useMemo(() => {
    if (!staffAssignment) return 0;
    return events.filter(
      (e) => e.channel === staffAssignment.channel && e.status === 'PENDING'
    ).length;
  }, [events, staffAssignment]);

  if (!isOpen) return null;

  const handleActionClick = (ev: InstitutionalEvent) => {
    institutionalEventBus.markStatus(ev.id, 'ACKNOWLEDGED');
    if (ev.actionRole && ev.actionRole !== currentRole && onSwitchPortal) {
      onSwitchPortal(ev.actionRole);
    }
    if (ev.actionTab && onNavigateTab) {
      onNavigateTab(ev.actionTab);
    }
    onClose();
  };

  const handleResolve = (evId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    institutionalEventBus.markStatus(evId, 'RESOLVED');
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-200">
        {/* DRAWER HEADER */}
        <div className="bg-gradient-to-r from-[#061d40] to-[#0a2f64] text-white p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#092c60] flex items-center justify-center font-black">
                <Bell size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  Staff Channel &amp; Event Feed
                </h3>
                <span className="text-[10px] text-blue-200 font-mono">
                  {staffAssignment ? `Channel: ${staffAssignment.channel}` : 'All Institutional Channels'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              title="Close Feed (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* ACTIVE ASSIGNED OFFICER CHIP */}
          {staffAssignment && (
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/15 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <strong className="block text-white truncate">{staffAssignment.staffName}</strong>
                <span className="text-amber-300 font-mono text-[10px] block">
                  {staffAssignment.staffRegNo} · {staffAssignment.staffTitle}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                Live Channel
              </span>
            </div>
          )}

          {/* FEED SCOPE TABS */}
          <div className="flex bg-black/20 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('MY_CHANNEL')}
              className={`flex-1 py-1.5 rounded-md text-center transition flex items-center justify-center gap-1.5 ${
                activeTab === 'MY_CHANNEL'
                  ? 'bg-white text-[#092c60] font-bold shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <span>Routed to Me</span>
              {unreadMyChannel > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadMyChannel}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL_CAMPUS')}
              className={`flex-1 py-1.5 rounded-md text-center transition ${
                activeTab === 'ALL_CAMPUS'
                  ? 'bg-white text-[#092c60] font-bold shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Campus Broadcasts ({events.length})
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filter === 'ALL'
                  ? 'bg-[#092c60] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({filteredEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('ACTION_REQUIRED')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filter === 'ACTION_REQUIRED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Action Required
            </button>
            <button
              type="button"
              onClick={() => setFilter('RESOLVED')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filter === 'RESOLVED'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Resolved
            </button>
          </div>

          <button
            type="button"
            onClick={loadEvents}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
            title="Refresh events"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* EVENT LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-60" />
              <p className="text-sm font-bold text-slate-700">No pending channel events</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                All requests routed to this channel have been acknowledged or resolved.
              </p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isAction = ev.severity === 'ACTION_REQUIRED';
              const isSuccess = ev.severity === 'SUCCESS';
              const isResolved = ev.status === 'RESOLVED';

              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border text-left transition space-y-2.5 ${
                    isResolved
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : isAction
                      ? 'bg-amber-50/60 border-amber-300'
                      : isSuccess
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isResolved
                            ? 'bg-slate-400'
                            : isAction
                            ? 'bg-amber-500 animate-pulse'
                            : isSuccess
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {ev.channel} · {ev.sourceRole}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                      <Clock size={11} /> {formatTimeAgo(ev.timestampIso)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{ev.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.summary}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono text-slate-500 truncate">
                      Assigned: <span className="font-bold text-slate-700">{ev.targetStaffName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isResolved && (
                        <button
                          type="button"
                          onClick={(e) => handleResolve(ev.id, e)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 text-[10px] font-bold transition flex items-center gap-1"
                          title="Mark event as resolved"
                        >
                          <Check size={11} /> Done
                        </button>
                      )}

                      {ev.actionLabel && !isResolved && (
                        <button
                          type="button"
                          onClick={() => handleActionClick(ev)}
                          className="px-2.5 py-1 rounded bg-[#092c60] hover:bg-[#061d40] text-white text-[10px] font-bold transition flex items-center gap-1 shadow-xs"
                        >
                          <span>{ev.actionLabel}</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DRAWER FOOTER */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="text-[11px] font-medium">
            Channel: <strong className="text-[#092c60] font-mono">{staffAssignment?.channel || 'all'}</strong>
          </span>

          {staffAssignment && (
            <button
              type="button"
              onClick={() => {
                institutionalEventBus.markChannelAllResolved(staffAssignment.channel);
              }}
              className="text-xs text-[#0866d7] font-bold hover:underline"
            >
              Resolve All Channel Events
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
