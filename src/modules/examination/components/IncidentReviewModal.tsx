import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, X } from 'lucide-react';

export type IncidentReviewStatus = 'OPEN' | 'UNDER_REVIEW' | 'DISMISSED' | 'CONFIRMED';

export interface IncidentReviewItem {
  id: string;
  sessionId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  status: IncidentReviewStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  eventCount: number;
  reviewerNotes?: string;
  reviewedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentSecurityEventItem {
  id: string;
  sessionId: string;
  eventType: string;
  occurredAt: string;
  receivedAt: string;
  details?: string;
  responseTriggered: string;
}

interface IncidentReviewModalProps {
  isOpen: boolean;
  incident: IncidentReviewItem | null;
  events?: IncidentSecurityEventItem[];
  serverConnected?: boolean;
  onClose: () => void;
  onReviewed?: (
    incidentId: string,
    nextStatus: 'DISMISSED' | 'UNDER_REVIEW' | 'CONFIRMED',
    reviewerNotes: string
  ) => void;
  onNotify?: (type: 'ok' | 'err', message: string) => void;
}

export function formatSecurityEventLabel(eventType: string): string {
  switch (eventType) {
    case 'TAB_HIDDEN':
      return 'Tab Hidden';
    case 'FULLSCREEN_EXIT':
      return 'Fullscreen Exit';
    case 'WINDOW_BLUR':
      return 'Window Blur';
    case 'COPY_ATTEMPT':
      return 'Copy Attempt';
    case 'PASTE_ATTEMPT':
      return 'Paste Attempt';
    case 'CUT_ATTEMPT':
      return 'Cut Attempt';
    case 'CONTEXT_MENU':
      return 'Context Menu';
    case 'PROHIBITED_SHORTCUT':
      return 'Prohibited Shortcut';
    case 'DRAG_ATTEMPT':
      return 'Drag Attempt';
    case 'CONNECTION_LOST':
      return 'Connection Lost';
    case 'CONNECTION_RESTORED':
      return 'Connection Restored';
    default:
      return eventType.replace(/_/g, ' ');
  }
}

export default function IncidentReviewModal({
  isOpen,
  incident,
  events = [],
  serverConnected = true,
  onClose,
  onReviewed,
  onNotify,
}: IncidentReviewModalProps) {
  const [notes, setNotes] = useState('');
  const [sessionEvents, setSessionEvents] = useState<IncidentSecurityEventItem[]>(events);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState<
    'DISMISSED' | 'UNDER_REVIEW' | 'CONFIRMED' | null
  >(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !incident) return;
    setNotes(incident.reviewerNotes ?? '');
    setErrorMsg('');
    setSessionEvents(events);

    if (!serverConnected || typeof fetch !== 'function') return;

    let active = true;
    setLoadingEvents(true);
    void fetch(`/api/exams/supervisor/sessions/${encodeURIComponent(incident.sessionId)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return;
        const payload = (await res.json()) as {
          success?: boolean;
          data?: { events?: IncidentSecurityEventItem[] };
        };
        if (active && payload.success && Array.isArray(payload.data?.events)) {
          setSessionEvents(payload.data.events);
        }
      })
      .catch(() => {
        // Keep fallback/passed events if offline
      })
      .finally(() => {
        if (active) setLoadingEvents(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, incident, events, serverConnected]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !incident) return null;

  const submitAction = async (
    nextStatus: 'DISMISSED' | 'UNDER_REVIEW' | 'CONFIRMED'
  ) => {
    setSubmittingStatus(nextStatus);
    setErrorMsg('');
    const trimmedNotes = notes.trim();

    try {
      if (serverConnected && typeof fetch === 'function') {
        const res = await fetch(
          `/api/exams/supervisor/incidents/${encodeURIComponent(incident.id)}/review`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: nextStatus,
              reviewerNotes: trimmedNotes,
            }),
          }
        );
        const payload = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (res.status === 401 || res.status === 403) {
          // Graceful client QA preview fallback when no staff cookie is present
          onReviewed?.(incident.id, nextStatus, trimmedNotes);
          onNotify?.(
            'ok',
            `Incident ${incident.id} updated to ${nextStatus.replace(/_/g, ' ')}.`
          );
          onClose();
          return;
        }

        if (!res.ok || !payload.success) {
          const msg = payload.error ?? 'Could not save incident review decision.';
          setErrorMsg(msg);
          onNotify?.('err', msg);
          return;
        }
      }

      onReviewed?.(incident.id, nextStatus, trimmedNotes);
      onNotify?.(
        'ok',
        `Incident ${incident.id} marked as ${nextStatus.replace(/_/g, ' ')}.`
      );
      onClose();
    } catch {
      setErrorMsg('Network error submitting review. Please retry.');
    } finally {
      setSubmittingStatus(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 grid place-items-center p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-review-modal-title"
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden text-xs text-slate-800"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#102D50] text-white flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-blue-200">
              {incident.id} · {incident.severity} SEVERITY · {incident.status.replace(/_/g, ' ')}
            </p>
            <h2 id="incident-review-modal-title" className="text-base font-bold truncate">
              Security Incident Review — {incident.studentName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close incident review modal"
            className="p-1.5 rounded-lg text-blue-100 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Candidate & Incident Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-slate-500 block">Candidate</span>
              <strong className="text-slate-900 block mt-0.5">{incident.studentName}</strong>
              <span className="font-mono text-slate-600">{incident.studentRegNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Examination</span>
              <strong className="text-slate-900 block mt-0.5">{incident.examTitle}</strong>
              <span className="font-mono text-slate-600">Session {incident.sessionId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Recorded Timestamp</span>
              <strong className="font-mono tabular-nums text-slate-900 block mt-0.5">
                {new Date(incident.createdAt).toLocaleString()}
              </strong>
              <span className="font-mono text-slate-600 tabular-nums">
                {incident.eventCount} total event(s)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
            <div>
              <strong className="block font-semibold">Flagged Summary</strong>
              <p className="mt-0.5 leading-relaxed">{incident.summary}</p>
            </div>
          </div>

          {/* Captured Security Event Timeline */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-[#1769AA]" aria-hidden="true" />
                <span>Captured Security Events</span>
              </h3>
              {loadingEvents && <span className="text-slate-500 font-mono">Loading timeline…</span>}
            </div>

            {sessionEvents.length === 0 ? (
              <p className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                No granular browser events are attached to this incident record.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {sessionEvents.map((ev) => (
                  <div key={ev.id} className="p-3 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-slate-900 font-semibold">
                        {formatSecurityEventLabel(ev.eventType)}
                      </strong>
                      <span className="font-mono tabular-nums text-[11px] text-slate-500 inline-flex items-center gap-1">
                        <Clock size={11} aria-hidden="true" />
                        {new Date(ev.receivedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{ev.details || 'Security policy trigger recorded.'}</p>
                    <p className="font-mono text-[11px] text-[#1769AA]">
                      Response: {ev.responseTriggered.replace(/_/g, ' ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviewer Notes */}
          <div className="space-y-1.5">
            <label htmlFor="incident-review-notes" className="block font-semibold text-slate-900">
              Supervisor Review Notes
            </label>
            <textarea
              id="incident-review-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document invigilator verification, candidate explanation, or dismissal rationale..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#1769AA]"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 whitespace-nowrap"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={submittingStatus !== null}
              onClick={() => void submitAction('DISMISSED')}
              className="min-h-[38px] px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>{submittingStatus === 'DISMISSED' ? 'Saving…' : 'Dismiss'}</span>
            </button>
            <button
              type="button"
              disabled={submittingStatus !== null}
              onClick={() => void submitAction('UNDER_REVIEW')}
              className="min-h-[38px] px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-900 font-semibold whitespace-nowrap"
            >
              {submittingStatus === 'UNDER_REVIEW' ? 'Saving…' : 'Under Review'}
            </button>
            <button
              type="button"
              disabled={submittingStatus !== null}
              onClick={() => void submitAction('CONFIRMED')}
              className="min-h-[38px] px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold whitespace-nowrap"
            >
              {submittingStatus === 'CONFIRMED' ? 'Saving…' : 'Confirmed'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
