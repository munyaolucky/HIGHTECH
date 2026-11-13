import React, { useState } from 'react';
import {
  Vote,
  ShieldCheck,
  Users,
  Calendar,
  Heart,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Flag,
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import { CommunityOperatorRole } from '../../types/community';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

type TabId = 'elections' | 'clubs' | 'events-volunteers' | 'alumni';

export default function ElectionsCommunityPortal() {
  const [role, setRole] = useState<CommunityOperatorRole>('STUDENT_VOTER');
  const [activeTab, setActiveTab] = useSyncedPortalTab<TabId>('community', 'elections');
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [disputeSubject, setDisputeSubject] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  const state = communityService.getState();
  void tick;

  const studentRegNo = role === 'ALUMNI_GRADUATE' ? 'HCA/ALU/2025/041' : 'HCA/STU/2026/001';
  const studentName = role === 'ALUMNI_GRADUATE' ? 'Sharon Muthoni' : 'Brian Omondi Otieno';

  const run = (res: { ok: boolean; error?: string }, msg: string) => {
    if (res.ok) {
      setFeedback({ type: 'ok', text: msg });
      setTick((t) => t + 1);
    } else {
      setFeedback({ type: 'err', text: res.error || 'Operation failed.' });
    }
  };

  const activeElection = state.elections[0];
  const participation = activeElection
    ? state.participations.find(
        (p) => p.electionId === activeElection.id && p.voterStudentRegNo === studentRegNo
      )
    : undefined;
  const totalTurnout = activeElection
    ? state.participations.filter((p) => p.electionId === activeElection.id && p.hasVoted).length
    : 0;

  const canSeeTally =
    activeElection &&
    ((role === 'ELECTION_COMMUNITY_MANAGER' &&
      (activeElection.stage === 'VOTING_CLOSED' || activeElection.stage === 'RESULTS_PUBLISHED')) ||
      activeElection.stage === 'RESULTS_PUBLISHED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153b70] to-[#1a2f5a] rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <Vote className="w-4 h-4" />
              <span>Secret-Ballot Governance &amp; Campus Life</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Student Elections, Clubs &amp; Community Portal
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Cryptographically separated secret ballots, student societies, capacity-enforced campus
              events, outreach volunteering, and consent-controlled alumni directory.
            </p>
          </div>

          <div className="bg-black/25 border border-white/15 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              Community Perspective
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'STUDENT_VOTER', label: 'Student Voter (001)' },
                { id: 'ELECTION_COMMUNITY_MANAGER', label: 'Election & Community Mgr' },
                { id: 'ALUMNI_GRADUATE', label: 'Alumni Profile (Consent)' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id as CommunityOperatorRole);
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
        {[
          { id: 'elections', label: 'Secret-Ballot Elections', icon: Vote },
          { id: 'clubs', label: 'Clubs & Societies', icon: Users },
          { id: 'events-volunteers', label: 'Events & Volunteering', icon: Calendar },
          { id: 'alumni', label: 'Consent Alumni Directory', icon: GraduationCap },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as TabId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeTab === t.id
                  ? 'bg-[#153b70] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ELECTIONS */}
      {activeTab === 'elections' && activeElection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] text-[10px] font-black uppercase">
                    Stage: {activeElection.stage}
                  </span>
                  <h2 className="text-lg font-black text-[#153b70] mt-1">{activeElection.title}</h2>
                  <p className="text-xs text-slate-600 mt-1">{activeElection.description}</p>
                </div>

                {role === 'ELECTION_COMMUNITY_MANAGER' &&
                  activeElection.stage !== 'RESULTS_PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          communityService.advanceElectionStage(activeElection.id),
                          'Advanced election lifecycle stage.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#d92332] hover:bg-[#b81d2a] text-white text-xs font-extrabold shadow-sm"
                    >
                      <span>Advance Election Stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
              </div>

              {/* Secret Ballot Separation Architecture Callout */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Secret-Ballot Separation Enforced:</strong> Voter participation stores only
                  a boolean flag with zero ballot foreign key or timestamp. Ballot choices link
                  solely to a random token (currently <strong>{state.ballots.length}</strong>{' '}
                  anonymous ballots cast across{' '}
                  <strong>{totalTurnout}</strong> verified voters).
                </div>
              </div>

              {/* Positions & Voting Cards */}
              {activeElection.positions.map((pos) => {
                const posCandidates = state.candidates.filter(
                  (c) =>
                    c.electionId === activeElection.id &&
                    c.positionId === pos.id &&
                    (role === 'ELECTION_COMMUNITY_MANAGER' || c.status === 'APPROVED')
                );
                const posVotes = state.votes.filter(
                  (v) => v.electionId === activeElection.id && v.positionId === pos.id
                );

                return (
                  <div key={pos.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-[#153b70]">{pos.title}</h3>
                      <span className="text-[11px] font-bold text-slate-500">1 Seat</span>
                    </div>
                    <div className="space-y-2">
                      {posCandidates.map((c) => {
                        const voteCount = posVotes.filter((v) => v.candidateId === c.id).length;
                        const selected = selections[pos.id] === c.id;
                        return (
                          <div
                            key={c.id}
                            className={`p-3 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                              selected ? 'border-[#153b70] ring-2 ring-blue-200' : 'border-slate-200'
                            }`}
                          >
                            <div>
                              <div className="font-extrabold text-slate-900">
                                {c.studentName}{' '}
                                <span className="font-mono text-[11px] text-slate-500">
                                  ({c.studentRegNo})
                                </span>
                              </div>
                              <div className="text-slate-600 mt-0.5">{c.manifesto}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              {canSeeTally && (
                                <span className="px-2.5 py-1 rounded bg-blue-100 text-[#153b70] font-black">
                                  {voteCount} votes
                                </span>
                              )}
                              {role === 'STUDENT_VOTER' &&
                                activeElection.stage === 'VOTING_OPEN' &&
                                !participation?.hasVoted &&
                                c.status === 'APPROVED' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelections((prev) => ({ ...prev, [pos.id]: c.id }))
                                    }
                                    className={`px-3 py-1.5 rounded-lg font-extrabold transition ${
                                      selected
                                        ? 'bg-[#153b70] text-white'
                                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {selected ? 'Selected' : 'Select'}
                                  </button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Submit Secret Ballot */}
              {role === 'STUDENT_VOTER' && activeElection.stage === 'VOTING_OPEN' && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  {participation?.hasVoted ? (
                    <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Your participation is recorded; your ballot remains strictly anonymous.
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const res = communityService.castSecretBallot(
                          activeElection.id,
                          studentRegNo,
                          selections
                        );
                        if (res.ok) {
                          setFeedback({
                            type: 'ok',
                            text: `Secret ballot cast cleanly! Anonymous ballot token: ${res.anonymousReceiptHash}`,
                          });
                          setTick((t) => t + 1);
                        } else {
                          setFeedback({ type: 'err', text: res.error || 'Ballot error.' });
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#d92332] hover:bg-[#b81d2a] text-white text-xs font-extrabold shadow-md"
                    >
                      Cast Secret Ballot (One-Time Final)
                    </button>
                  )}

                  {!canSeeTally && (
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Live vote counts hidden until voting closes &amp; results publish
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Election Disputes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-[#d92332]" />
              <span>Election Disputes &amp; Appeals</span>
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Dispute subject"
                value={disputeSubject}
                onChange={(e) => setDisputeSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <textarea
                placeholder="Describe procedural concern..."
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!disputeSubject || !disputeDetails) return;
                  run(
                    communityService.submitDispute(
                      activeElection.id,
                      studentRegNo,
                      disputeSubject,
                      disputeDetails
                    ),
                    'Election dispute filed cleanly.'
                  );
                  setDisputeSubject('');
                  setDisputeDetails('');
                }}
                className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
              >
                Submit Formal Dispute
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              {state.disputes.length === 0 ? (
                <p className="text-xs text-slate-500">Zero open election disputes.</p>
              ) : (
                state.disputes.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{d.subject}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{d.details}</p>
                    {role === 'ELECTION_COMMUNITY_MANAGER' && d.status === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            communityService.resolveDispute(d.id, 'Reviewed & closed by Electoral Board'),
                            'Dispute marked RESOLVED.'
                          )
                        }
                        className="mt-2 px-2.5 py-1 rounded bg-emerald-700 text-white font-bold text-[11px]"
                      >
                        Resolve Dispute
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLUBS */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.clubs.map((club) => {
            const members = state.memberships.filter((m) => m.clubId === club.id);
            const myMember = members.find((m) => m.studentRegNo === studentRegNo);
            return (
              <div key={club.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold bg-blue-100 text-[#153b70] px-2 py-0.5 rounded">
                      {club.code}
                    </span>
                    <h3 className="text-base font-extrabold text-[#153b70] mt-1">{club.name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{club.description}</p>
                  </div>
                  {!myMember ? (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          communityService.requestClubJoin(club.id, studentRegNo, studentName),
                          `Requested membership in ${club.name}.`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#153b70] text-white text-xs font-extrabold shrink-0"
                    >
                      Join Club
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">
                      {myMember.status}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500">
                    Roster ({members.length} members/requests)
                  </div>
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg"
                    >
                      <span>
                        {m.studentName}{' '}
                        <span className="font-mono text-slate-400">({m.studentRegNo})</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-700">{m.status}</span>
                        {role === 'ELECTION_COMMUNITY_MANAGER' && m.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() =>
                              run(
                                communityService.reviewMembership(m.id, 'APPROVED'),
                                `Approved ${m.studentName}.`
                              )
                            }
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: EVENTS & VOLUNTEERING */}
      {activeTab === 'events-volunteers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70] flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Campus Events (Capacity-Checked)</span>
            </h2>
            {state.events.map((ev) => (
              <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{ev.title}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] font-bold text-[10px]">
                    {ev.registrations.length} / {ev.capacity} seats
                  </span>
                </div>
                <div className="text-slate-600">
                  {ev.branch} • {ev.location} • <strong>{ev.startDateTime}</strong>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      communityService.registerForEvent(ev.id, studentRegNo, studentName),
                      `Registered for ${ev.title}.`
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-[#153b70] text-white font-bold"
                >
                  RSVP / Register Seat
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70] flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#d92332]" />
              <span>Community Outreach &amp; Volunteering</span>
            </h2>
            {state.projects.map((prj) => (
              <div key={prj.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{prj.title}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {prj.volunteers.length} Volunteers
                  </span>
                </div>
                <p className="text-slate-600">{prj.description}</p>
                <div className="text-slate-500">
                  {prj.branch} • {prj.schedule}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      communityService.volunteerForProject(prj.id, studentRegNo, studentName),
                      `Registered volunteer interest for ${prj.title}.`
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                >
                  Apply to Volunteer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ALUMNI */}
      {activeTab === 'alumni' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#153b70]">
                Consent-Controlled Alumni Directory
              </h2>
              <p className="text-xs text-slate-500">
                Only profiles with explicit graduate public consent and staff approval are listed publicly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.alumni
              .filter(
                (a) =>
                  (a.publicConsent && a.staffApproved) ||
                  role === 'ELECTION_COMMUNITY_MANAGER' ||
                  a.studentRegNo === studentRegNo
              )
              .map((alm) => (
                <div key={alm.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#153b70]">{alm.fullName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alm.publicConsent
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {alm.publicConsent ? 'CONSENT: PUBLIC' : 'CONSENT: PRIVATE'}
                    </span>
                  </div>
                  <div className="text-slate-700 font-semibold">
                    {alm.currentRole} @ {alm.employer}
                  </div>
                  <div className="text-slate-500">
                    Class of {alm.graduationYear} • {alm.programme}
                  </div>
                  {(role === 'ALUMNI_GRADUATE' || role === 'ELECTION_COMMUNITY_MANAGER') && (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          communityService.updateAlumniConsent(alm.id, !alm.publicConsent),
                          `Updated public display consent for ${alm.fullName}.`
                        )
                      }
                      className="mt-2 px-3 py-1 rounded-lg border border-slate-300 bg-white font-bold text-[#153b70]"
                    >
                      Toggle Public Display Consent
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
