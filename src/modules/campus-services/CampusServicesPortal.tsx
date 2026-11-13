import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  UserPlus,
  CalendarClock,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  FileWarning,
  Plus,
} from 'lucide-react';
import { campusServicesService } from '../../services/campusServicesService';
import {
  CampusServicesRole,
  CrmEnquiryStage,
  DigitalCredential,
} from '../../types/campusServices';
import { COLLEGE_INFO, COURSES_CATALOGUE } from '../../data/college';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

type TabId = 'credentials' | 'crm' | 'appointments' | 'compliance';

const ACTORS: Record<CampusServicesRole, { userId: string; name: string; label: string }> = {
  REQUESTOR_STAFF: {
    userId: 'usr-staff-req',
    name: 'M. Kariuki (Records & Admissions Staff)',
    label: 'Records / CRM Staff (Requestor)',
  },
  APPROVER_REGISTRAR: {
    userId: 'usr-registrar-app',
    name: 'H. Oduor (Chief Registrar / Principal)',
    label: 'Chief Registrar (Approver)',
  },
  PUBLIC_OR_STUDENT: {
    userId: 'usr-stu-001',
    name: 'Brian Omondi Otieno (HCA/STU/2026/001)',
    label: 'Student / Public Verifier',
  },
};

export default function CampusServicesPortal() {
  const [role, setRole] = useState<CampusServicesRole>('REQUESTOR_STAFF');
  const [activeTab, setActiveTab] = useSyncedPortalTab<TabId>('campus-services', 'credentials');
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const actor = ACTORS[role];
  const state = campusServicesService.getState();
  void tick;

  // Credentials form & public lookup
  const [verifyCodeInput, setVerifyCodeInput] = useState(
    state.credentials[0]?.verificationCode ?? ''
  );
  const [verifyResult, setVerifyResult] = useState<ReturnType<
    typeof campusServicesService.verifyPublicCredential
  > | null>(null);
  const [credReg, setCredReg] = useState('HCA/STU/2026/022');
  const [credFirst, setCredFirst] = useState('');
  const [credLast, setCredLast] = useState('');
  const [credProg, setCredProg] = useState(COURSES_CATALOGUE[0].title);
  const [credAward, setCredAward] =
    useState<DigitalCredential['awardType']>('DIPLOMA_CERTIFICATE');

  // CRM notes
  const [crmNotes, setCrmNotes] = useState<Record<string, string>>({});

  // Appointments
  const [aptServiceId, setAptServiceId] = useState(state.services[0]?.id ?? '');
  const [aptDate, setAptDate] = useState('2026-11-20');
  const [aptSlot, setAptSlot] = useState(state.services[0]?.availableSlots[0] ?? '09:00 EAT');

  const run = (res: { ok: boolean; error?: string }, okMsg: string) => {
    if (res.ok) {
      setFeedback({ type: 'ok', text: okMsg });
      setTick((t) => t + 1);
    } else {
      setFeedback({ type: 'err', text: res.error || 'Operation rejected.' });
    }
  };

  const selectedService = state.services.find((s) => s.id === aptServiceId) ?? state.services[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153b70] to-[#0c234a] rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>Public Trust, Credentials &amp; Service Delivery Suite</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Digital Credentials, Admissions CRM, Appointments &amp; Compliance
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Checksummed QR credential verification with privacy masking, consented admissions CRM
              pipeline, Nairobi-hour office bookings, policy approvals, and data-quality audits.
            </p>
          </div>

          <div className="bg-black/25 border border-white/15 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              Active Operator Role (Tests Requestor ≠ Approver)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ACTORS) as CampusServicesRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setFeedback(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    role === r
                      ? 'bg-amber-400 text-[#092c60] shadow'
                      : 'bg-white/10 text-blue-100 hover:bg-white/20'
                  }`}
                >
                  {ACTORS[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Issued Credentials</div>
            <div className="text-xl font-black mt-0.5">
              {state.credentials.filter((c) => c.status === 'ISSUED').length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Active CRM Enquiries</div>
            <div className="text-xl font-black mt-0.5">{state.enquiries.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Booked Office Slots</div>
            <div className="text-xl font-black mt-0.5">
              {state.appointments.filter((a) => a.status === 'BOOKED').length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Data Quality Alerts</div>
            <div className="text-xl font-black mt-0.5 text-amber-300">
              {state.dataQualityFindings.length}
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
          { id: 'credentials', label: 'Digital Credentials & QR Verify', icon: QrCode },
          { id: 'crm', label: 'Admissions CRM Pipeline', icon: UserPlus },
          { id: 'appointments', label: 'Campus Appointments (EAT)', icon: CalendarClock },
          { id: 'compliance', label: 'Policies, Obligations & Data Quality', icon: Scale },
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

      {/* TAB 1: DIGITAL CREDENTIALS */}
      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#153b70]">
                  Checksummed Credential Registry (Requestor ≠ Approver)
                </h2>
                <span className="text-[11px] font-bold bg-blue-50 text-[#153b70] px-2.5 py-1 rounded-lg border border-blue-200">
                  Public endpoint exposes First Name + Last Initial ONLY
                </span>
              </div>

              {state.credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-[#153b70] bg-blue-100 px-2 py-0.5 rounded">
                        {cred.verificationCode}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {cred.firstName} {cred.lastName}
                      </span>
                      <span className="font-mono text-slate-500">({cred.studentRegNo})</span>
                    </div>
                    <div className="text-slate-700">
                      {cred.programme} • <strong>{cred.awardType.replace(/_/g, ' ')}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Requested by: {cred.requestedByName}
                      {cred.approvedByName && <> • Approved by: {cred.approvedByName}</>} • Verified{' '}
                      <strong>{cred.verificationCount}</strong> times
                    </div>
                    {cred.replacedByCode && (
                      <div className="text-[11px] font-bold text-amber-800">
                        Replaced by: <span className="font-mono">{cred.replacedByCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        cred.status === 'ISSUED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cred.status === 'REVOKED' || cred.status === 'REPLACED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cred.status}
                    </span>

                    {cred.status === 'REQUESTED' && role !== 'PUBLIC_OR_STUDENT' && (
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            campusServicesService.approveAndIssueCredential(
                              cred.id,
                              actor.userId,
                              actor.name
                            ),
                            `Approved and issued ${cred.verificationCode}.`
                          )
                        }
                        className="px-3 py-1 rounded bg-emerald-700 text-white font-bold"
                      >
                        Approve &amp; Issue
                      </button>
                    )}

                    {cred.status === 'ISSUED' && role === 'APPROVER_REGISTRAR' && (
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            campusServicesService.revokeOrReplaceCredential(
                              cred.id,
                              'REPLACED',
                              'Name typography correction requested by Registrar',
                              actor.name
                            ),
                            `Replaced ${cred.verificationCode} with a new checksummed code.`
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-300 bg-amber-50 text-amber-900 font-bold"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setVerifyCodeInput(cred.verificationCode);
                        setVerifyResult(
                          campusServicesService.verifyPublicCredential(cred.verificationCode)
                        );
                        setTick((t) => t + 1);
                      }}
                      className="px-2.5 py-1 rounded bg-[#153b70] text-white font-bold"
                    >
                      Test Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Public Verification Simulator */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                <span>Public Verification Test (/?verify=CODE)</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="HTC-2026-8419-..."
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVerifyResult(campusServicesService.verifyPublicCredential(verifyCodeInput));
                    setTick((t) => t + 1);
                  }}
                  className="px-3 py-2 rounded-lg bg-[#153b70] text-white text-xs font-bold"
                >
                  Verify
                </button>
              </div>
              {verifyResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    verifyResult.found
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {verifyResult.found ? (
                    <>
                      <div className="font-extrabold flex items-center justify-between">
                        <span>Holder (Masked): {verifyResult.maskedHolderName}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px]">
                          {verifyResult.status}
                        </span>
                      </div>
                      <div>{verifyResult.programme}</div>
                      <div className="text-[11px] text-emerald-800">
                        {verifyResult.awardType} • Issued {verifyResult.issueDate} • Checks:{' '}
                        <strong>{verifyResult.verificationCount}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="font-bold">No issued/revoked credential matches this code.</div>
                  )}
                </div>
              )}
            </div>

            {/* Request Credential */}
            {role === 'REQUESTOR_STAFF' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
                <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Request New Checksummed Credential</span>
                </h3>
                <input
                  type="text"
                  placeholder="Student Reg No"
                  value={credReg}
                  onChange={(e) => setCredReg(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={credFirst}
                    onChange={(e) => setCredFirst(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={credLast}
                    onChange={(e) => setCredLast(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <select
                  value={credProg}
                  onChange={(e) => setCredProg(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  {COURSES_CATALOGUE.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <select
                  value={credAward}
                  onChange={(e) =>
                    setCredAward(e.target.value as DigitalCredential['awardType'])
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="DIPLOMA_CERTIFICATE">DIPLOMA_CERTIFICATE</option>
                  <option value="OFFICIAL_TRANSCRIPT">OFFICIAL_TRANSCRIPT</option>
                  <option value="CDACC_COMPETENCY">CDACC_COMPETENCY</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!credFirst || !credLast) return;
                    const res = campusServicesService.requestCredential({
                      studentRegNo: credReg,
                      firstName: credFirst,
                      lastName: credLast,
                      programme: credProg,
                      awardType: credAward,
                      requestorUserId: actor.userId,
                      requestorName: actor.name,
                    });
                    run(res, `Requested credential ${res.code} (awaiting Registrar approval).`);
                    setCredFirst('');
                    setCredLast('');
                  }}
                  className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
                >
                  Submit Credential Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ADMISSIONS CRM PIPELINE */}
      {activeTab === 'crm' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#153b70]">
                Admissions CRM Pipeline (Public Website Enquiries)
              </h2>
              <p className="text-xs text-slate-500">
                Captures consented public enquiries with honeypot spam defense, duplicate phone/email
                detection, and outreach contact logs.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              {(['NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED'] as CrmEnquiryStage[]).map((st) => (
                <span
                  key={st}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold"
                >
                  {st}: {state.enquiries.filter((e) => e.stage === st).length}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {state.enquiries.map((enq) => (
              <div key={enq.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#153b70] mr-2">{enq.reference}</span>
                    <span className="font-extrabold text-sm text-slate-900">{enq.fullName}</span>
                    <span className="text-slate-500 ml-2">
                      {enq.email} • {enq.phone}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-blue-100 text-[#153b70] font-extrabold text-[10px]">
                    {enq.stage}
                  </span>
                </div>
                {enq.duplicateWarning && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 font-bold">
                    Duplicate Alert: {enq.duplicateWarning}
                  </div>
                )}
                <div className="text-slate-700">
                  Interest: <strong>{enq.programmeInterest}</strong> ({enq.preferredCampus} •{' '}
                  {enq.intake})
                </div>
                <div className="text-slate-600">{enq.message}</div>

                {enq.contactLogs.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {enq.contactLogs.map((cl) => (
                      <div key={cl.id} className="bg-white px-2.5 py-1.5 rounded border border-slate-200 text-[11px]">
                        <strong>{cl.actor}:</strong> {cl.note}
                      </div>
                    ))}
                  </div>
                )}

                {role !== 'PUBLIC_OR_STUDENT' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Log adviser outreach call / follow-up note..."
                      value={crmNotes[enq.id] || ''}
                      onChange={(e) =>
                        setCrmNotes((prev) => ({ ...prev, [enq.id]: e.target.value }))
                      }
                      className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                    {(['CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'CLOSED'] as CrmEnquiryStage[]).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            run(
                              campusServicesService.updateEnquiryStage(
                                enq.id,
                                st,
                                crmNotes[enq.id] || `Moved lead to ${st}`,
                                actor.name
                              ),
                              `Updated ${enq.reference} stage to ${st}.`
                            );
                            setCrmNotes((prev) => ({ ...prev, [enq.id]: '' }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#153b70] text-white font-bold"
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Campus Office Queue &amp; Scheduled Appointments (Africa/Nairobi)
            </h2>
            {state.appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-extrabold text-slate-900">
                    <span className="font-mono text-[#153b70] mr-2">{apt.bookingRef}</span>
                    {apt.serviceName}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {apt.studentName} ({apt.studentRegNo}) • <strong>{apt.date}</strong> at{' '}
                    <strong>{apt.timeSlot}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] font-bold text-[10px]">
                    {apt.status}
                  </span>
                  {apt.status === 'BOOKED' && (
                    <>
                      {role !== 'PUBLIC_OR_STUDENT' && (
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              campusServicesService.transitionAppointment(
                                apt.id,
                                'COMPLETED',
                                'Served cleanly at desk'
                              ),
                              `Completed appointment ${apt.bookingRef}.`
                            )
                          }
                          className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold"
                        >
                          Mark Served
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            campusServicesService.transitionAppointment(apt.id, 'CANCELLED'),
                            `Cancelled ${apt.bookingRef}.`
                          )
                        }
                        className="px-2.5 py-1 rounded border border-red-300 text-red-700 bg-white font-bold"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70]">
              Book Office Service Slot ({selectedService?.officeHoursEAT})
            </h3>
            <select
              value={aptServiceId}
              onChange={(e) => {
                setAptServiceId(e.target.value);
                const next = state.services.find((s) => s.id === e.target.value);
                if (next?.availableSlots[0]) setAptSlot(next.availableSlots[0]);
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              {state.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.campus})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={aptDate}
              onChange={(e) => setAptDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <select
              value={aptSlot}
              onChange={(e) => setAptSlot(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              {selectedService?.availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const res = campusServicesService.bookAppointment({
                  serviceId: aptServiceId,
                  studentRegNo: 'HCA/STU/2026/001',
                  studentName: 'Brian Omondi Otieno',
                  date: aptDate,
                  timeSlot: aptSlot,
                });
                run(res, `Booked campus appointment ${res.bookingRef}.`);
              }}
              className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
            >
              Reserve Time Slot
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: POLICIES, COMPLIANCE & DATA QUALITY */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Policy Register &amp; Acknowledgements</span>
            </h2>
            {state.policies.map((pol) => (
              <div key={pol.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#153b70]">
                    {pol.code} ({pol.version}) — {pol.title}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {pol.status}
                  </span>
                </div>
                <div className="text-slate-600">
                  Owner: {pol.ownerRole} • Acknowledgements: <strong>{pol.acknowledgements.length}</strong>
                </div>
                <div className="flex gap-2">
                  {pol.status === 'PENDING_APPROVAL' && role !== 'PUBLIC_OR_STUDENT' && (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          campusServicesService.approvePolicy(pol.id, actor.userId, actor.name),
                          `Approved policy ${pol.code}.`
                        )
                      }
                      className="px-3 py-1 rounded bg-emerald-700 text-white font-bold"
                    >
                      Independent Approve
                    </button>
                  )}
                  {pol.status === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          campusServicesService.acknowledgePolicy(
                            pol.id,
                            actor.userId,
                            actor.name
                          ),
                          `Recorded policy acknowledgement for ${pol.code}.`
                        )
                      }
                      className="px-3 py-1 rounded bg-[#153b70] text-white font-bold"
                    >
                      Acknowledge Policy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
              <h2 className="text-base font-extrabold text-[#153b70] flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-[#d92332]" />
                <span>Read-Only Student Record Data Quality Audit</span>
              </h2>
              {state.dataQualityFindings.map((dq) => (
                <div key={dq.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">{dq.ruleName}</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                      {dq.severity}
                    </span>
                  </div>
                  <div className="font-mono text-[#153b70] text-[11px] mt-0.5">{dq.recordRef}</div>
                  <div className="text-slate-600 mt-0.5">{dq.detail}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
              <h3 className="text-sm font-extrabold text-[#153b70]">
                Regulatory Obligations ({COLLEGE_INFO.registrationNumber})
              </h3>
              {state.obligations.map((ob) => (
                <div key={ob.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">
                      [{ob.regulator}] {ob.obligationTitle}
                    </div>
                    <div className="text-slate-500">
                      Due: {ob.dueDate} • Evidence: {ob.evidenceRef}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#153b70] font-bold text-[10px]">
                    {ob.status}
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
