import React, { useState } from 'react';
import {
  Bell,
  Users,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  Mail,
  ExternalLink,
  Calendar,
  XCircle,
} from 'lucide-react';
import { engagementService } from '../../services/engagementService';
import { EngagementRole, GuardianScope, NotificationCategory } from '../../types/campusOps';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

type TabId = 'notifications' | 'guardians' | 'careers';

export default function EngagementHubPortal() {
  const [role, setRole] = useState<EngagementRole>('STUDENT');
  const [activeTab, setActiveTab] = useSyncedPortalTab<TabId>('engagement', 'notifications');
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [bcCategory, setBcCategory] = useState<NotificationCategory>('ACADEMIC');
  const [bcTitle, setBcTitle] = useState('');
  const [bcMsg, setBcMsg] = useState('');

  const [invEmail, setInvEmail] = useState('');
  const [invScopes, setInvScopes] = useState<GuardianScope[]>(['OVERVIEW', 'ACADEMICS', 'FEES']);
  const [revokeReason, setRevokeReason] = useState<Record<string, string>>({});
  const [mtgTopic, setMtgTopic] = useState('');
  const [mtgDate, setMtgDate] = useState('2026-11-28');

  const [coverLetters, setCoverLetters] = useState<Record<string, string>>({});

  const state = engagementService.getState();
  void tick;

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const run = (res: { ok: boolean; error?: string }, okMsg: string) => {
    if (res.ok) {
      setFeedback({ type: 'ok', text: okMsg });
      setTick((t) => t + 1);
    } else {
      setFeedback({ type: 'err', text: res.error || 'Operation rejected.' });
    }
  };

  const toggleScope = (scope: GuardianScope) => {
    setInvScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153b70] to-[#0f274a] rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              <span>Stakeholder Communications &amp; Pathways</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Notifications, Guardian Consent &amp; Careers Hub
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              In-app notifications &amp; email/SMS outbox, explicit student-consented guardian
              access with scoped expiry &amp; instant revocation, and verified career placements.
            </p>
          </div>

          <div className="bg-black/25 border border-white/15 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              Active Account View
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'STUDENT', label: 'Student (Brian 001)' },
                { id: 'PARENT_GUARDIAN', label: 'Parent / Guardian View' },
                { id: 'CAREERS_NOTIFICATIONS_MANAGER', label: 'Notifications & Careers Admin' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id as EngagementRole);
                    setFeedback(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    role === r.id
                      ? 'bg-amber-400 text-[#092c60] shadow'
                      : 'bg-white/10 text-blue-100 hover:bg-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            activeTab === 'notifications'
              ? 'bg-[#153b70] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications &amp; Outbox ({unreadCount} Unread)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guardians')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            activeTab === 'guardians'
              ? 'bg-[#153b70] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Optional Guardian Portal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('careers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            activeTab === 'careers'
              ? 'bg-[#153b70] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Careers &amp; Industrial Attachments</span>
        </button>
      </div>

      {/* TAB 1: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#153b70]">In-App Notification Inbox</h2>
                <button
                  type="button"
                  onClick={() => {
                    engagementService.markAllRead();
                    setTick((t) => t + 1);
                  }}
                  className="text-xs font-bold text-[#153b70] hover:underline"
                >
                  Mark All Read
                </button>
              </div>
              {state.notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                    n.read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/70 border-blue-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#153b70] text-white text-[10px] font-bold">
                        {n.category}
                      </span>
                      <span className="font-extrabold text-slate-900">{n.title}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{n.message}</p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => {
                        engagementService.markNotificationRead(n.id);
                        setTick((t) => t + 1);
                      }}
                      className="px-2.5 py-1 rounded bg-white border border-slate-300 font-bold text-[#153b70] shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>

            {role === 'CAREERS_NOTIFICATIONS_MANAGER' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span>Email / SMS Delivery Outbox Queue (Queued ≠ Proof of Delivery)</span>
                </h3>
                {state.outbox.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#153b70] mr-2">[{o.channel}]</span>
                      <span className="font-bold text-slate-900">{o.subject}</span>
                      <div className="text-[11px] text-slate-500">To: {o.recipientAddress}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-[#153b70]">
                Channel Preferences (Email/SMS Opt-In)
              </h3>
              <div className="space-y-2 text-xs">
                {state.preferences.map((p) => (
                  <div key={p.category} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-extrabold text-slate-800 mb-1.5">{p.category}</div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={p.inApp}
                          disabled={p.category === 'SECURITY'}
                          onChange={(e) => {
                            engagementService.updatePreference(p.category, 'inApp', e.target.checked);
                            setTick((t) => t + 1);
                          }}
                        />
                        <span>In-App {p.category === 'SECURITY' && '(Locked)'}</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={p.emailOptIn}
                          onChange={(e) => {
                            engagementService.updatePreference(
                              p.category,
                              'emailOptIn',
                              e.target.checked
                            );
                            setTick((t) => t + 1);
                          }}
                        />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={p.smsOptIn}
                          onChange={(e) => {
                            engagementService.updatePreference(p.category, 'smsOptIn', e.target.checked);
                            setTick((t) => t + 1);
                          }}
                        />
                        <span>SMS</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {role === 'CAREERS_NOTIFICATIONS_MANAGER' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                  <Send className="w-4 h-4" />
                  <span>Broadcast Notification</span>
                </h3>
                <select
                  value={bcCategory}
                  onChange={(e) => setBcCategory(e.target.value as NotificationCategory)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="WELFARE">WELFARE</option>
                  <option value="CAREERS">CAREERS</option>
                </select>
                <input
                  type="text"
                  placeholder="Notification Title"
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <textarea
                  placeholder="Message body..."
                  value={bcMsg}
                  onChange={(e) => setBcMsg(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!bcTitle || !bcMsg) return;
                    run(
                      engagementService.broadcastNotification({
                        category: bcCategory,
                        title: bcTitle,
                        message: bcMsg,
                      }),
                      'Broadcast delivered per recipient channel preferences.'
                    );
                    setBcTitle('');
                    setBcMsg('');
                  }}
                  className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
                >
                  Dispatch Broadcast
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GUARDIANS */}
      {activeTab === 'guardians' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Student Consent Master Toggle */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-extrabold text-[#153b70] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Optional Student-Controlled Guardian Sharing</span>
                </div>
                <p className="text-slate-600 mt-0.5">
                  Guardian links are optional and never include passwords, safeguarding cases, or
                  secret ballots. Consent expires after 1 year and can be revoked anytime.
                </p>
              </div>
              {role === 'STUDENT' && (
                <button
                  type="button"
                  onClick={() => {
                    engagementService.setGuardianConsentEnabled(
                      !state.studentGuardianSharingEnabled
                    );
                    setTick((t) => t + 1);
                  }}
                  className={`px-3.5 py-2 rounded-lg font-extrabold text-xs ${
                    state.studentGuardianSharingEnabled
                      ? 'bg-emerald-700 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {state.studentGuardianSharingEnabled
                    ? 'Sharing Enabled (Click to Withdraw All)'
                    : 'Sharing Withdrawn (Click to Enable)'}
                </button>
              )}
            </div>

            {/* Active Links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-[#153b70]">
                Guardian Access Relationships
              </h2>
              {state.guardianLinks.map((lnk) => (
                <div key={lnk.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900">{lnk.parentName}</span>{' '}
                      <span className="text-slate-500">({lnk.parentEmail})</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        lnk.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {lnk.status}
                    </span>
                  </div>
                  <div>
                    Granted Scopes:{' '}
                    {lnk.scopes.length > 0 ? (
                      lnk.scopes.map((sc) => (
                        <span
                          key={sc}
                          className="inline-block mr-1.5 px-2 py-0.5 rounded bg-blue-100 text-[#153b70] font-bold text-[10px]"
                        >
                          {sc}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">All scopes cleared</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Consent Expiry: {new Date(lnk.consentExpiresAt).toLocaleDateString()}
                    {lnk.revokedReason && <> • Revocation Reason: <strong>{lnk.revokedReason}</strong></>}
                  </div>

                  {/* Parent Scoped Data Preview */}
                  {role === 'PARENT_GUARDIAN' && lnk.status === 'ACTIVE' && (
                    <div className="mt-2 p-3 rounded-xl bg-white border border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {lnk.scopes.includes('ACADEMICS') && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">ACADEMICS (SCOPED)</div>
                          <div className="font-extrabold text-[#153b70]">DICT-L6 • GPA 3.74</div>
                        </div>
                      )}
                      {lnk.scopes.includes('ATTENDANCE') && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">ATTENDANCE</div>
                          <div className="font-extrabold text-emerald-700">94.2% Present</div>
                        </div>
                      )}
                      {lnk.scopes.includes('FEES') && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">FEE BALANCE</div>
                          <div className="font-extrabold text-[#d92332]">KES 8,500</div>
                        </div>
                      )}
                    </div>
                  )}

                  {lnk.status === 'ACTIVE' && role !== 'PARENT_GUARDIAN' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Revocation reason (required)"
                        value={revokeReason[lnk.id] || ''}
                        onChange={(e) =>
                          setRevokeReason((prev) => ({ ...prev, [lnk.id]: e.target.value }))
                        }
                        className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            engagementService.revokeGuardianLink(
                              lnk.id,
                              revokeReason[lnk.id] || ''
                            ),
                            'Guardian link revoked and scopes cleared immediately.'
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 text-white font-bold"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Invitations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
              <h3 className="text-sm font-extrabold text-[#153b70]">
                One-Time Guardian Invitations (7-Day Token Expiry)
              </h3>
              {state.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {inv.parentEmail}{' '}
                      <span className="font-mono text-[10px] text-slate-500">
                        ({inv.tokenPreview})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Scopes: {inv.scopes.join(', ')} • Expires:{' '}
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {inv.status}
                    </span>
                    {inv.status === 'PENDING' && role === 'PARENT_GUARDIAN' && (
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            engagementService.acceptInvitation(inv.id, 'Mary Achieng Otieno'),
                            'Accepted invitation & established 1-year guardian consent link.'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold"
                      >
                        Accept Invite
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Form: Invite Guardian OR Parent Meeting */}
          <div className="space-y-4">
            {role === 'STUDENT' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#153b70]">
                  Invite Parent / Guardian
                </h3>
                <input
                  type="email"
                  placeholder="guardian@example.co.ke"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-600">Select Granted Data Scopes:</div>
                  {(['OVERVIEW', 'ATTENDANCE', 'ACADEMICS', 'FEES', 'ACCOMMODATION'] as GuardianScope[]).map(
                    (sc) => (
                      <label key={sc} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={invScopes.includes(sc)}
                          onChange={() => toggleScope(sc)}
                        />
                        <span>{sc}</span>
                      </label>
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    run(
                      engagementService.inviteGuardian(invEmail, invScopes),
                      'Sent 7-day guardian invitation.'
                    );
                    setInvEmail('');
                  }}
                  className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
                >
                  Send One-Time Invitation
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Parent Consultation Meetings</span>
              </h3>
              {role === 'PARENT_GUARDIAN' && (
                <div className="space-y-2 pb-2 border-b border-slate-200">
                  <input
                    type="text"
                    placeholder="Meeting topic"
                    value={mtgTopic}
                    onChange={(e) => setMtgTopic(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="date"
                    value={mtgDate}
                    onChange={(e) => setMtgDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!mtgTopic) return;
                      run(
                        engagementService.requestParentMeeting(
                          'joseph.otieno@example.co.ke',
                          mtgTopic,
                          mtgDate
                        ),
                        'Parent consultation meeting requested.'
                      );
                      setMtgTopic('');
                    }}
                    className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
                  >
                    Request Meeting
                  </button>
                </div>
              )}
              {state.meetings.map((m) => (
                <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">{m.topic}</div>
                  <div className="text-slate-500">
                    {m.preferredDate} • {m.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAREERS */}
      {activeTab === 'careers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-[#153b70]">
                Open Career &amp; Industrial Attachment Opportunities
              </h2>
              {state.opportunities.map((opp) => (
                <div key={opp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] font-bold text-[10px] mr-2">
                        {opp.employmentType}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">{opp.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {opp.status}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Employer: <strong>{opp.employerName}</strong> • {opp.location} • Deadline:{' '}
                    <strong>{opp.deadline}</strong>
                  </div>

                  {opp.applicationMode === 'INTERNAL_PLATFORM' ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Short cover letter / technical stack summary..."
                        value={coverLetters[opp.id] || ''}
                        onChange={(e) =>
                          setCoverLetters((prev) => ({ ...prev, [opp.id]: e.target.value }))
                        }
                        className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            engagementService.applyInternalOpportunity(
                              opp.id,
                              coverLetters[opp.id] ||
                                'DICT Level 6 final-term trainee available immediately for industrial attachment.'
                            ),
                            'Application submitted cleanly.'
                          )
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-[#153b70] text-white font-bold"
                      >
                        Apply In-Platform
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-[#153b70] font-bold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>External Employer Portal: {opp.externalUrl}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-[#153b70]">
                Submitted Career Applications ({state.applications.length})
              </h3>
              {state.applications.length === 0 ? (
                <p className="text-xs text-slate-500">No in-platform applications submitted yet.</p>
              ) : (
                state.applications.map((app) => (
                  <div key={app.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-extrabold text-slate-900">{app.opportunityTitle}</div>
                    <div className="text-slate-600">{app.studentName} ({app.studentRegNo})</div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] font-bold text-[10px]">
                        {app.status}
                      </span>
                      {role === 'CAREERS_NOTIFICATIONS_MANAGER' &&
                        app.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            onClick={() =>
                              run(
                                engagementService.updateApplicationStatus(
                                  app.id,
                                  'SHORTLISTED',
                                  'Meets CDACC practical competencies.'
                                ),
                                'Application shortlisted.'
                              )
                            }
                            className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold text-[11px]"
                          >
                            Shortlist
                          </button>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
              <h3 className="text-sm font-extrabold text-[#153b70]">Verified Employers</h3>
              {state.employers.map((emp) => (
                <div key={emp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-slate-500">{emp.industry}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {emp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
