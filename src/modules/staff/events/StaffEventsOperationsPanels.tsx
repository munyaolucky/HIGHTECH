import React, { useEffect, useState, type FormEvent } from 'react';
import {
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldAlert,
  Star,
} from 'lucide-react';
import {
  staffEventsApi,
  type EventCertificateRecord,
  type EventFeedbackRecord,
  type EventInvitationRecord,
  type EventMediaRecord,
  type EventPaymentRecord,
  type EventSettingsRecord,
  type EventVenueRecord,
  type PublicEventSummary,
} from '../../../website/events/eventsApi';
import { EVENT_BANNER_PRESETS } from '../../../website/events/eventBannerKeys';

function PanelCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#102D50] dark:text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// ==========================================================
// 1. VENUES DIRECTORY & CONFLICT GUARD
// ==========================================================
export function VenuesPanel({
  venues,
  canManage,
  onReload,
  onNotify,
}: {
  venues: EventVenueRecord[];
  canManage: boolean;
  onReload: () => Promise<void>;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('Nairobi Main Campus');
  const [building, setBuilding] = useState('Academic Towers');
  const [venueType, setVenueType] = useState<EventVenueRecord['venueType']>('Lecture Hall');
  const [capacity, setCapacity] = useState(100);
  const [resourcesText, setResourcesText] = useState('HD Projector, PA System');

  const handleAddVenue = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await staffEventsApi.createVenue({
        name,
        campus,
        building,
        venueType,
        capacity,
        resources: resourcesText
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      });
      onNotify({ type: 'success', text: `Venue "${name}" added to campus directory.` });
      setName('');
      setAdding(false);
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add venue.' });
    }
  };

  const toggleStatus = async (venue: EventVenueRecord) => {
    const next = venue.maintenanceStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      await staffEventsApi.updateVenue(venue.id, { maintenanceStatus: next });
      onNotify({ type: 'success', text: `${venue.name} marked ${next}.` });
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update venue.' });
    }
  };

  return (
    <PanelCard
      title="Campus Venues & Facilities Directory"
      subtitle="Shared rooms, laboratories, auditoriums, seating capacity, AV resources, and maintenance availability."
      actions={
        canManage ? (
          <button
            type="button"
            onClick={() => setAdding((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-3.5 py-2 text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            <Plus size={14} />
            <span>{adding ? 'Close Form' : 'Add Venue'}</span>
          </button>
        ) : null
      }
    >
      {adding && (
        <form
          onSubmit={handleAddVenue}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"
        >
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Venue Name *"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          >
            <option>Nairobi Main Campus</option>
            <option>Westlands Technology Park Campus</option>
            <option>Mombasa Coastal Campus</option>
          </select>
          <input
            type="text"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="Building / Block"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <select
            value={venueType}
            onChange={(e) => setVenueType(e.target.value as EventVenueRecord['venueType'])}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          >
            <option>Auditorium</option>
            <option>Lecture Hall</option>
            <option>Laboratory</option>
            <option>Workshop</option>
            <option>Boardroom</option>
            <option>Outdoor</option>
          </select>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) || 50)}
            placeholder="Capacity"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 font-mono tabular-nums"
          />
          <input
            type="text"
            value={resourcesText}
            onChange={(e) => setResourcesText(e.target.value)}
            placeholder="Resources (comma separated)"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-[#B83232] hover:bg-[#952424] text-white px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Save Venue
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2.5 bg-slate-50/40 dark:bg-slate-800/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-[#1769AA] uppercase">{v.campus}</p>
                <h4 className="text-sm font-black text-[#102D50] dark:text-white flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#B83232]" />
                  <span>{v.name}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {v.building} · {v.venueType}
                </p>
              </div>
              <span
                className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                  v.maintenanceStatus === 'AVAILABLE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {v.maintenanceStatus}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-mono tabular-nums">
                Capacity: <strong className="text-[#102D50] dark:text-white">{v.capacity}</strong> · {v.seatingLayout}
              </p>
              <p className="text-[11px] text-slate-500">
                AV &amp; Facilities: {v.resources.join(' · ') || 'Standard setup'}
              </p>
            </div>

            {canManage && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => toggleStatus(v)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-[11px] font-bold hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                >
                  {v.maintenanceStatus === 'AVAILABLE' ? 'Mark Maintenance' : 'Mark Available'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

// ==========================================================
// 2. PAYMENTS & FEE RECONCILIATION PANEL
// ==========================================================
export function PaymentsPanel({
  eventId,
  eventTitle,
  payments,
  canVerify,
  canRefund,
  onReload,
  onNotify,
}: {
  eventId: string;
  eventTitle: string;
  payments: EventPaymentRecord[];
  canVerify: boolean;
  canRefund: boolean;
  onReload: () => Promise<void>;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [refInput, setRefInput] = useState<Record<string, string>>({});

  const totalCollected = payments
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'UNPAID')
    .reduce((s, p) => s + p.amount, 0);

  const handleVerify = async (p: EventPaymentRecord) => {
    try {
      await staffEventsApi.verifyPayment(p.id, refInput[p.id] || p.transactionRef);
      onNotify({ type: 'success', text: `Verified payment for ${p.registrationNumber}.` });
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Verification failed.' });
    }
  };

  const handleRefund = async (p: EventPaymentRecord) => {
    try {
      await staffEventsApi.refundPayment(p.id, 'Refund authorised via Finance Bursar ledger');
      onNotify({ type: 'success', text: `Issued refund for ${p.registrationNumber}.` });
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Refund failed.' });
    }
  };

  return (
    <PanelCard
      title={`Payments & Fee Ledger — ${eventTitle || 'Selected Event'}`}
      subtitle="Verify M-Pesa / Bank / Bursar receipts and reconcile workshop or conference ticket revenue."
      actions={
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          <span className="rounded-lg bg-emerald-50 text-emerald-800 px-3 py-1 font-bold">
            Collected: KES {totalCollected.toLocaleString()}
          </span>
          <span className="rounded-lg bg-amber-50 text-amber-800 px-3 py-1 font-bold">
            Pending: KES {totalPending.toLocaleString()}
          </span>
        </div>
      }
    >
      {!eventId || payments.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          <CreditCard size={24} className="mx-auto mb-2 text-slate-400" />
          No paid ticket transactions recorded for this event yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="py-2 pr-3 font-bold">Participant &amp; Reg No</th>
                <th className="py-2 pr-3 font-bold">Ticket &amp; Amount</th>
                <th className="py-2 pr-3 font-bold">Method &amp; Reference</th>
                <th className="py-2 pr-3 font-bold">Status</th>
                <th className="py-2 text-right font-bold">Bursar Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-3">
                    <div className="font-bold text-[#102D50] dark:text-white">{p.participantName}</div>
                    <div className="font-mono text-[11px] text-[#1769AA]">{p.registrationNumber}</div>
                  </td>
                  <td className="py-3 pr-3 font-mono tabular-nums">
                    <div className="font-bold">
                      {p.currency} {p.amount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500">{p.ticketType}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="font-semibold">{p.method}</div>
                    <input
                      type="text"
                      value={refInput[p.id] ?? p.transactionRef}
                      onChange={(e) => setRefInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      disabled={p.status === 'PAID' || p.status === 'REFUNDED'}
                      aria-label="Transaction reference"
                      className="mt-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-mono"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                        p.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'REFUNDED'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {canVerify && (p.status === 'PENDING' || p.status === 'UNPAID') && (
                        <button
                          type="button"
                          onClick={() => handleVerify(p)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          Verify Paid
                        </button>
                      )}
                      {canRefund && p.status === 'PAID' && (
                        <button
                          type="button"
                          onClick={() => handleRefund(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-[#B83232] hover:bg-red-50 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          <RotateCcw size={11} />
                          <span>Refund</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}

// ==========================================================
// 3. INVITATIONS & ACCESS CODES PANEL
// ==========================================================
export function InvitationsPanel({
  eventId,
  eventTitle,
  invitations,
  canManage,
  onReload,
  onNotify,
}: {
  eventId: string;
  eventTitle: string;
  invitations: EventInvitationRecord[];
  canManage: boolean;
  onReload: () => Promise<void>;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [groupName, setGroupName] = useState('VIP / Invited Partner');
  const [copiedCode, setCopiedCode] = useState('');

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    try {
      const created = await staffEventsApi.createInvitation(eventId, {
        inviteeName: name,
        inviteeEmail: email,
        inviteePhone: phone,
        groupName,
      });
      onNotify({
        type: 'success',
        text: `Invitation code ${created.invitationCode} dispatched to ${created.inviteeEmail}.`,
      });
      setName('');
      setEmail('');
      setPhone('');
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send invitation.' });
    }
  };

  const copyCode = async (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    }
  };

  return (
    <PanelCard
      title={`VIP Invitations & Access Codes — ${eventTitle || 'Selected Event'}`}
      subtitle="Generate unique HTE-INV-... registration access codes for restricted or executive events."
    >
      {canManage && eventId && (
        <form
          onSubmit={handleInvite}
          className="grid grid-cols-1 md:grid-cols-5 gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3.5 text-xs"
        >
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Invitee Full Name *"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address *"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (+254...)"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Guest Group / VIP"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white px-3 py-2 font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Mail size={13} />
            <span>Issue Invite</span>
          </button>
        </form>
      )}

      {invitations.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          No invitations issued for this event yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="py-2 pr-3 font-bold">Invitee</th>
                <th className="py-2 pr-3 font-bold">Group</th>
                <th className="py-2 pr-3 font-bold">Code</th>
                <th className="py-2 pr-3 font-bold">Status</th>
                <th className="py-2 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2.5 pr-3">
                    <div className="font-bold text-[#102D50] dark:text-white">{inv.inviteeName}</div>
                    <div className="text-[11px] text-slate-500">{inv.inviteeEmail}</div>
                  </td>
                  <td className="py-2.5 pr-3">{inv.groupName}</td>
                  <td className="py-2.5 pr-3 font-mono font-bold text-[#1769AA]">
                    {inv.invitationCode}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                        inv.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => copyCode(inv.invitationCode)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                    >
                      <Copy size={11} />
                      <span>{copiedCode === inv.invitationCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}

// ==========================================================
// 4. CERTIFICATES PANEL
// ==========================================================
export function CertificatesPanel({
  eventId,
  eventTitle,
  certificates,
  canManage,
  onReload,
  onNotify,
}: {
  eventId: string;
  eventTitle: string;
  certificates: EventCertificateRecord[];
  canManage: boolean;
  onReload: () => Promise<void>;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const handleGenerate = async () => {
    if (!eventId) return;
    setIssuing(true);
    try {
      const res = await staffEventsApi.generateCertificates(eventId, onlyCheckedIn);
      onNotify({
        type: 'success',
        text: `Issued ${res.issuedCount} new verifiable certificate(s) for ${eventTitle}.`,
      });
      await onReload();
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to issue certificates.',
      });
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async (cert: EventCertificateRecord) => {
    try {
      await staffEventsApi.revokeCertificate(cert.id, 'Revoked via Staff Events Certificate Desk');
      onNotify({ type: 'success', text: `Revoked ${cert.certificateNumber}.` });
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Failed to revoke.' });
    }
  };

  return (
    <PanelCard
      title={`Event Certificates — ${eventTitle || 'Selected Event'}`}
      subtitle="Batch issue verifiable HTE-CERT certificates to eligible attendees and manage verification status."
      actions={
        canManage && eventId ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={onlyCheckedIn}
                onChange={(e) => setOnlyCheckedIn(e.target.checked)}
              />
              <span>Checked-in attendees only</span>
            </label>
            <button
              type="button"
              disabled={issuing}
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-3.5 py-2 text-xs font-bold cursor-pointer"
            >
              <Award size={14} />
              <span>{issuing ? 'Generating...' : 'Generate Eligible Certificates'}</span>
            </button>
          </div>
        ) : null
      }
    >
      {certificates.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          No certificates have been issued for this event yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="py-2 pr-3 font-bold">Certificate No</th>
                <th className="py-2 pr-3 font-bold">Verification Code</th>
                <th className="py-2 pr-3 font-bold">Recipient</th>
                <th className="py-2 pr-3 font-bold">Type</th>
                <th className="py-2 pr-3 font-bold">Status</th>
                <th className="py-2 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {certificates.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 pr-3 font-mono font-bold text-[#102D50] dark:text-white">
                    {c.certificateNumber}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[#1769AA]">{c.verificationCode}</td>
                  <td className="py-2.5 pr-3">
                    <div className="font-bold">{c.participantName}</div>
                    <div className="text-[11px] text-slate-500">{c.participantEmail}</div>
                  </td>
                  <td className="py-2.5 pr-3">{c.certificateType}</td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                        c.status === 'ISSUED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {canManage && c.status === 'ISSUED' && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(c)}
                        className="rounded-lg border border-red-200 text-[#B83232] hover:bg-red-50 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}

// ==========================================================
// 5. FEEDBACK ANALYTICS PANEL
// ==========================================================
export function FeedbackPanel({
  eventTitle,
  feedback,
  summary,
}: {
  eventTitle: string;
  feedback: EventFeedbackRecord[];
  summary: { responseCount: number; averageRating: number; npsScore: number };
}) {
  return (
    <PanelCard
      title={`Post-Event Evaluation & NPS — ${eventTitle || 'Selected Event'}`}
      subtitle="Participant ratings across event organisation, keynote speakers, venue, and recommendation score."
      actions={
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <span className="rounded-lg bg-[#F5EBDD] text-[#102D50] px-3 py-1 font-bold inline-flex items-center gap-1">
            <Star size={12} className="text-[#B83232]" />
            Avg {summary.averageRating || '—'} / 5
          </span>
          <span className="rounded-lg bg-blue-50 text-[#1769AA] px-3 py-1 font-bold">
            NPS {summary.npsScore} ({summary.responseCount} replies)
          </span>
        </div>
      }
    >
      {feedback.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          <MessageSquare size={22} className="mx-auto mb-2 text-slate-400" />
          No feedback responses submitted for this event yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {feedback.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#102D50] dark:text-white">{f.respondentName}</span>
                <span className="font-mono font-bold text-[#1769AA] tabular-nums">
                  {f.overallRating}/5 · NPS {f.recommendNps}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {f.comments || 'No written comment.'}
              </p>
              {f.futureTopicInterest && (
                <p className="text-[11px] text-slate-500">
                  Requested Topic: <strong>{f.futureTopicInterest}</strong>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

// ==========================================================
// 6. MEDIA GALLERY & CONSENT PANEL
// ==========================================================
export function MediaPanel({
  eventId,
  eventTitle,
  media,
  canManage,
  onReload,
  onNotify,
}: {
  eventId: string;
  eventTitle: string;
  media: EventMediaRecord[];
  canManage: boolean;
  onReload: () => Promise<void>;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<EventMediaRecord['mediaType']>('PHOTO');
  const [url, setUrl] = useState<string>(EVENT_BANNER_PRESETS[0].key);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'STAFF_ONLY'>('PUBLIC');

  const handleCreateMedia = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    try {
      await staffEventsApi.createMedia(eventId, {
        title,
        mediaType,
        url,
        caption,
        visibility,
        consentVerified: true,
      });
      onNotify({ type: 'success', text: `Added media asset "${title}".` });
      setTitle('');
      setCaption('');
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add media.' });
    }
  };

  const toggleConsent = async (item: EventMediaRecord) => {
    try {
      await staffEventsApi.updateMedia(item.id, {
        consentVerified: !item.consentVerified,
      });
      await onReload();
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Update failed.' });
    }
  };

  return (
    <PanelCard
      title={`Event Media, Flyers & Photo Consent — ${eventTitle || 'Selected Event'}`}
      subtitle="Publish event photography, slide decks, and brochures once participant media consent is verified."
    >
      {canManage && eventId && (
        <form
          onSubmit={handleCreateMedia}
          className="grid grid-cols-1 md:grid-cols-5 gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3.5 text-xs"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Asset Title *"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as EventMediaRecord['mediaType'])}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          >
            <option value="PHOTO">Photo</option>
            <option value="POSTER">Poster</option>
            <option value="BROCHURE">Programme Brochure</option>
            <option value="PRESENTATION">Slide Deck</option>
            <option value="VIDEO">Video Recap</option>
          </select>
          <select
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          >
            {EVENT_BANNER_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption / Context"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
          />
          <button
            type="submit"
            onClick={() => setVisibility('PUBLIC')}
            className="rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white px-3 py-2 font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ImageIcon size={13} />
            <span>Add Asset</span>
          </button>
        </form>
      )}

      {media.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          No media assets attached to this event yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {media.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#1769AA]">
                  {m.mediaType} · {m.visibility}
                </p>
                <h4 className="font-bold text-[#102D50] dark:text-white mt-0.5">{m.title}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{m.caption}</p>
                <p className="text-[10px] text-slate-500 mt-1">Uploaded by {m.uploadedByName}</p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => toggleConsent(m)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold shrink-0 cursor-pointer ${
                    m.consentVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.consentVerified ? 'Consent Verified' : 'Needs Consent'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

// ==========================================================
// 7. REPORTS & ANALYTICS PANEL
// ==========================================================
export function ReportsPanel({
  canExport,
}: {
  canExport: boolean;
}) {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof staffEventsApi.getReportsSummary>> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await staffEventsApi.getReportsSummary();
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <PanelCard
      title="Institutional Events Performance & Attendance Analytics"
      subtitle="Seat occupancy, physical/online turnout rates, revenue reconciliation, and feedback scores across all events."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          {canExport && (
            <a
              href="/api/events/reports/export"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-3.5 py-1.5 text-xs font-bold"
            >
              <Download size={13} />
              <span>Export Summary CSV</span>
            </a>
          )}
        </div>
      }
    >
      {loading || !summary ? (
        <p className="py-6 text-center text-xs text-slate-500">Generating event analytics...</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] font-sans text-slate-500">Total Revenue Collected</p>
              <p className="text-lg font-black text-[#102D50] dark:text-white mt-0.5">
                KES {summary.kpis.totalRevenueKes.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] font-sans text-slate-500">Outstanding Event Fees</p>
              <p className="text-lg font-black text-[#B83232] mt-0.5">
                KES {summary.kpis.outstandingFeesKes.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] font-sans text-slate-500">Certificates Issued</p>
              <p className="text-lg font-black text-[#1769AA] mt-0.5">
                {summary.totalCertificatesIssued}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] font-sans text-slate-500">Feedback Responses</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                {summary.totalFeedbackCount}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="py-2 pr-3 font-bold">Code &amp; Event</th>
                  <th className="py-2 pr-3 font-bold">Date &amp; Campus</th>
                  <th className="py-2 pr-3 font-bold">Registered / Cap</th>
                  <th className="py-2 pr-3 font-bold">Checked In</th>
                  <th className="py-2 pr-3 font-bold">Revenue</th>
                  <th className="py-2 font-bold">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                {summary.eventPerformance.map((row) => (
                  <tr key={row.eventId}>
                    <td className="py-2.5 pr-3 font-sans">
                      <div className="font-bold text-[#102D50] dark:text-white">{row.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {row.eventCode} · {row.category}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 font-sans">
                      <div>{row.eventDate}</div>
                      <div className="text-[11px] text-slate-500">{row.campus}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      {row.registeredCount} / {row.capacity} ({row.occupancyPct}%)
                    </td>
                    <td className="py-2.5 pr-3">
                      {row.checkedInCount} ({row.attendanceRatePct}%)
                    </td>
                    <td className="py-2.5 pr-3">KES {row.revenueKes.toLocaleString()}</td>
                    <td className="py-2.5">
                      {row.feedbackCount > 0 ? `${row.averageRating} / 5 (${row.feedbackCount})` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PanelCard>
  );
}

// ==========================================================
// 8. SETTINGS PANEL
// ==========================================================
export function SettingsPanel({
  canManage,
  onNotify,
}: {
  canManage: boolean;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [settings, setSettings] = useState<EventSettingsRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    staffEventsApi
      .getSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await staffEventsApi.updateSettings(settings);
      setSettings(updated);
      onNotify({ type: 'success', text: 'Institutional event governance settings saved.' });
    } catch (err) {
      onNotify({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelCard
      title="Events Platform Governance & Defaults"
      subtitle="Configure institutional currency, timezone, guest registration policy, automatic QR pass generation, and retention rules."
      actions={
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
          <Settings size={13} />
          {settings ? `Updated by ${settings.updatedByName}` : 'Loading...'}
        </span>
      }
    >
      {!settings ? (
        <p className="py-6 text-center text-xs text-slate-500">Loading settings...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold mb-1">Default Currency</label>
              <input
                type="text"
                disabled={!canManage}
                value={settings.defaultCurrency}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, defaultCurrency: e.target.value } : s))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Default Timezone</label>
              <input
                type="text"
                disabled={!canManage}
                value={settings.defaultTimezone}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, defaultTimezone: e.target.value } : s))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Archive Retention (Days)</label>
              <input
                type="number"
                min={30}
                disabled={!canManage}
                value={settings.dataRetentionDays}
                onChange={(e) =>
                  setSettings((s) =>
                    s ? { ...s, dataRetentionDays: Number(e.target.value) || 365 } : s
                  )
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-2">
            <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={settings.autoGenerateTickets}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, autoGenerateTickets: e.target.checked } : s))
                }
              />
              <span>Auto-generate QR Ticket Passes upon Registration</span>
            </label>
            <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={settings.allowGuestRegistration}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, allowGuestRegistration: e.target.checked } : s))
                }
              />
              <span>Allow Public / External Guest Registration</span>
            </label>
            <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={settings.requireFeedbackConsent}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, requireFeedbackConsent: e.target.checked } : s))
                }
              />
              <span>Require Data Protection Consent Notice</span>
            </label>
          </div>

          {canManage ? (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-4 py-2 font-bold cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-amber-700 inline-flex items-center gap-1">
              <ShieldAlert size={13} />
              <span>Read-only view: Event settings modification requires Principal/Admin permission.</span>
            </p>
          )}
        </form>
      )}
    </PanelCard>
  );
}

// Keep unused icon clean import satisfied if needed
export { BarChart3 };
