import React, { useState } from 'react';
import {
  Building,
  BedDouble,
  ClipboardCheck,
  Wrench,
  UserCheck,
  Receipt,
  HeartHandshake,
  Megaphone,
  ShieldAlert,
  Plus,
  CheckCircle2,
  XCircle,
  Lock,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { hostelsService, getNairobiTodayDate } from '../../services/hostelsService';
import {
  AnnouncementAudience,
  BedStatus,
  HostelOperatorRole,
  OccupancyPolicy,
  SupportRequestCategory,
  SupportRequestStatus,
} from '../../types/hostels';
import { COLLEGE_INFO } from '../../data/college';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

type TabId =
  | 'inventory'
  | 'allocations'
  | 'maintenance-visitors'
  | 'billing'
  | 'welfare'
  | 'announcements';

const ACTOR_BY_ROLE: Record<HostelOperatorRole, { id: string; name: string; label: string }> = {
  HOSTEL_OFFICER: {
    id: 'actor-hostel-1',
    name: 'Hostel Officer (J. Mutua)',
    label: 'Hostel Officer',
  },
  STUDENT_SERVICES_OFFICER: {
    id: 'actor-welfare-1',
    name: 'Student Services Officer (L. Wambui)',
    label: 'Student Services Officer',
  },
  FINANCE_OFFICER: {
    id: 'actor-finance-1',
    name: 'Finance Officer (D. Kiprop)',
    label: 'Finance Officer',
  },
  STUDENT: {
    id: 'HCA/STU/2026/001',
    name: 'Brian Omondi Otieno',
    label: 'Student (HCA/STU/2026/001)',
  },
};

export default function HostelsServicesPortal() {
  const [role, setRole] = useState<HostelOperatorRole>('HOSTEL_OFFICER');
  const [activeTab, setActiveTab] = useSyncedPortalTab<TabId>('hostels', 'inventory');
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const state = hostelsService.getState();
  const visibleHostels = hostelsService.getHostelsForRole(role);
  const actor = ACTOR_BY_ROLE[role];
  const nairobiToday = getNairobiTodayDate();

  // Form states
  const [newHostelCode, setNewHostelCode] = useState('');
  const [newHostelName, setNewHostelName] = useState('');
  const [newHostelBranch, setNewHostelBranch] = useState(COLLEGE_INFO.campuses[0].name);
  const [newHostelPolicy, setNewHostelPolicy] = useState<OccupancyPolicy>('MIXED');
  const [newHostelDesc, setNewHostelDesc] = useState('');
  const [newHostelWarden, setNewHostelWarden] = useState('');

  const [roomHostelId, setRoomHostelId] = useState(state.hostels[0]?.id ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [roomFloor, setRoomFloor] = useState('Floor 1');
  const [bedCode, setBedCode] = useState('');

  const [appHostelId, setAppHostelId] = useState(state.hostels[0]?.id ?? '');
  const [appStart, setAppStart] = useState(nairobiToday);
  const [appEnd, setAppEnd] = useState('2026-12-20');
  const [appReason, setAppReason] = useState('');

  const [allocAppId, setAllocAppId] = useState('');
  const [allocBedId, setAllocBedId] = useState('');
  const [allocStart, setAllocStart] = useState(nairobiToday);
  const [allocEnd, setAllocEnd] = useState('2026-12-20');

  const [mntTitle, setMntTitle] = useState('');
  const [mntPriority, setMntPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [visResident, setVisResident] = useState('HCA/STU/2026/001');
  const [visName, setVisName] = useState('');
  const [visIdNo, setVisIdNo] = useState('');
  const [visDate, setVisDate] = useState(nairobiToday);
  const [visPurpose, setVisPurpose] = useState('');

  const [chgAllocId, setChgAllocId] = useState(state.allocations[0]?.id ?? '');
  const [chgDesc, setChgDesc] = useState('Term 3 Hostel Accommodation & Utilities');
  const [chgAmount, setChgAmount] = useState('14500');

  const [welCategory, setWelCategory] = useState<SupportRequestCategory>('COUNSELLING');
  const [welSensitive, setWelSensitive] = useState(true);
  const [welSubject, setWelSubject] = useState('');
  const [welDesc, setWelDesc] = useState('');
  const [welUpdateNote, setWelUpdateNote] = useState<Record<string, string>>({});

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annBranch, setAnnBranch] = useState(COLLEGE_INFO.campuses[0].name);
  const [annAudience, setAnnAudience] = useState<AnnouncementAudience>('ALL_STUDENTS');

  const refresh = (res: { ok: boolean; error?: string }, okMsg: string) => {
    if (res.ok) {
      setFeedback({ type: 'ok', text: okMsg });
      setTick((t) => t + 1);
    } else {
      setFeedback({ type: 'err', text: res.error || 'Operation rejected.' });
    }
  };

  // Suppress unused variable warning for tick state trigger
  void tick;

  const occupiedCount = state.beds.filter((b) => b.status === 'OCCUPIED').length;
  const availableCount = state.beds.filter((b) => b.status === 'AVAILABLE').length;
  const unassignedRestricted = state.supportRequests.filter(
    (r) => r.restricted && !r.assignedToActorId
  );

  // Role-filtered student support requests
  const visibleStandardOrAssignedCases = state.supportRequests.filter((r) => {
    if (role === 'STUDENT') return r.studentRegNo === actor.id;
    if (role === 'STUDENT_SERVICES_OFFICER') {
      // Unassigned restricted cases live exclusively in masked queue until assigned
      if (r.restricted && !r.assignedToActorId) return false;
      return true;
    }
    return !r.restricted;
  });

  // Announcements filtered by branch & resident allocation for Student role
  const studentActiveHostelIds = new Set(
    state.allocations
      .filter((a) => a.studentRegNo === 'HCA/STU/2026/001' && (a.status === 'CHECKED_IN' || a.status === 'RESERVED'))
      .map((a) => a.hostelId)
  );
  const visibleAnnouncements = state.announcements.filter((ann) => {
    if (role === 'STUDENT') {
      if (ann.audience === 'STAFF_ONLY') return false;
      if (ann.branch !== 'Nairobi Main Campus') return false;
      if (ann.audience === 'HOSTEL_RESIDENTS' && ann.hostelId && !studentActiveHostelIds.has(ann.hostelId)) {
        return false;
      }
      return true;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153b70] to-[#0f274a] rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>Campus Operations • Africa/Nairobi Calendar ({nairobiToday})</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Hostels &amp; Student Welfare Services
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Residence bed inventory, overlap-safe stay allocations, check-in/out, visitor log,
              maker-checker accommodation billing, and confidential student welfare referrals.
            </p>
          </div>

          {/* Role Perspective Switcher */}
          <div className="bg-black/25 border border-white/15 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              Active Operator Role (Enforces RBAC &amp; Separation of Duties)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ACTOR_BY_ROLE) as HostelOperatorRole[]).map((r) => (
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
                  {ACTOR_BY_ROLE[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Visible Residences</div>
            <div className="text-xl font-black mt-0.5">{visibleHostels.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Available / Occupied Beds</div>
            <div className="text-xl font-black mt-0.5">
              {availableCount} <span className="text-xs font-semibold text-blue-200">/ {occupiedCount} occ</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Draft / Pending Charges</div>
            <div className="text-xl font-black mt-0.5">
              {state.charges.filter((c) => c.status === 'DRAFT' || c.status === 'APPROVED').length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Unassigned Sensitive Cases</div>
            <div className="text-xl font-black mt-0.5 text-amber-300">{unassignedRestricted.length}</div>
          </div>
        </div>
      </div>

      {/* Feedback alert */}
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
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'inventory', label: 'Residences & Beds', icon: BedDouble },
          { id: 'allocations', label: 'Applications & Stays', icon: ClipboardCheck },
          { id: 'maintenance-visitors', label: 'Maintenance & Visitors', icon: Wrench },
          { id: 'billing', label: 'Accommodation Charges', icon: Receipt },
          { id: 'welfare', label: 'Student Welfare & Restricted Cases', icon: HeartHandshake },
          { id: 'announcements', label: 'Announcements & Audit', icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                active
                  ? 'bg-[#153b70] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-[#153b70]">
                  {role === 'STUDENT'
                    ? 'Student-Eligible Residence Catalogue'
                    : 'All Institutional Residences & Bed Matrix'}
                </h2>
                {role === 'STUDENT' && (
                  <span className="text-[11px] font-bold bg-blue-50 text-[#153b70] px-2.5 py-1 rounded-lg border border-blue-100">
                    STAFF_ONLY &amp; Room/Warden Details Hidden
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {visibleHostels.map((hostel) => {
                  const hostelRooms = state.rooms.filter((r) => r.hostelId === hostel.id);
                  const hostelBeds = state.beds.filter((b) => b.hostelId === hostel.id);
                  const freeBeds = hostelBeds.filter((b) => b.status === 'AVAILABLE').length;
                  return (
                    <div key={hostel.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-[#153b70] bg-blue-100 px-2 py-0.5 rounded">
                              {hostel.code}
                            </span>
                            <h3 className="font-extrabold text-sm text-slate-900">{hostel.name}</h3>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{hostel.shortDescription}</p>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Campus: <strong>{hostel.branch}</strong> • Policy:{' '}
                            <span className="font-mono font-bold text-[#153b70]">
                              {hostel.occupancyPolicy}
                            </span>
                            {role !== 'STUDENT' && (
                              <>
                                {' '}
                                • Warden: <strong>{hostel.wardenName}</strong>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            {freeBeds} / {hostelBeds.length} Beds Available
                          </div>
                        </div>
                      </div>

                      {/* Staff detailed rooms & beds */}
                      {role !== 'STUDENT' && hostelRooms.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {hostelRooms.map((room) => {
                            const rBeds = state.beds.filter((b) => b.roomId === room.id);
                            return (
                              <div
                                key={room.id}
                                className="bg-white rounded-lg border border-slate-200 p-2.5 text-xs"
                              >
                                <div className="font-bold text-slate-800 mb-1.5">
                                  Room {room.roomCode} ({room.floor})
                                </div>
                                <div className="space-y-1.5">
                                  {rBeds.map((bed) => (
                                    <div
                                      key={bed.id}
                                      className="flex items-center justify-between gap-2 bg-slate-50 px-2 py-1 rounded"
                                    >
                                      <span className="font-mono font-bold text-slate-700">
                                        {bed.bedCode}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            bed.status === 'AVAILABLE'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : bed.status === 'OCCUPIED'
                                              ? 'bg-blue-100 text-blue-800'
                                              : bed.status === 'RESERVED'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {bed.status}
                                        </span>
                                        {role === 'HOSTEL_OFFICER' &&
                                          bed.status !== 'OCCUPIED' &&
                                          bed.status !== 'RESERVED' && (
                                            <select
                                              aria-label={`Change status for ${bed.bedCode}`}
                                              value={bed.status}
                                              onChange={(e) =>
                                                refresh(
                                                  hostelsService.updateBedStatus(
                                                    bed.id,
                                                    e.target.value as BedStatus,
                                                    actor.name
                                                  ),
                                                  `Updated ${bed.bedCode} status.`
                                                )
                                              }
                                              className="text-[10px] border border-slate-300 rounded px-1 py-0.5 bg-white"
                                            >
                                              <option value="AVAILABLE">AVAILABLE</option>
                                              <option value="MAINTENANCE">MAINTENANCE</option>
                                              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                                            </select>
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Form: Add Hostel / Room & Bed (Staff Only) */}
          <div className="space-y-4">
            {role === 'HOSTEL_OFFICER' ? (
              <>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Register Residence Wing</span>
                  </h3>
                  <input
                    type="text"
                    placeholder="Code e.g. HST-ELD-01"
                    value={newHostelCode}
                    onChange={(e) => setNewHostelCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Residence Name"
                    value={newHostelName}
                    onChange={(e) => setNewHostelName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <select
                    value={newHostelBranch}
                    onChange={(e) => setNewHostelBranch(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    {COLLEGE_INFO.campuses.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newHostelPolicy}
                    onChange={(e) => setNewHostelPolicy(e.target.value as OccupancyPolicy)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="MIXED">MIXED</option>
                    <option value="SINGLE_GENDER">SINGLE_GENDER</option>
                    <option value="DESIGNATED_STUDENT_GROUP">DESIGNATED_STUDENT_GROUP</option>
                    <option value="ACCESSIBILITY_FOCUSED">ACCESSIBILITY_FOCUSED</option>
                    <option value="STAFF_ONLY">STAFF_ONLY (Hidden from students)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Warden Name"
                    value={newHostelWarden}
                    onChange={(e) => setNewHostelWarden(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <textarea
                    placeholder="Short public description..."
                    value={newHostelDesc}
                    onChange={(e) => setNewHostelDesc(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newHostelCode || !newHostelName) {
                        setFeedback({ type: 'err', text: 'Enter hostel code and name.' });
                        return;
                      }
                      refresh(
                        hostelsService.createHostel({
                          code: newHostelCode,
                          name: newHostelName,
                          branch: newHostelBranch,
                          occupancyPolicy: newHostelPolicy,
                          shortDescription: newHostelDesc || 'Official college hostel wing.',
                          wardenName: newHostelWarden || 'Campus Warden',
                          actor: actor.name,
                        }),
                        `Created hostel ${newHostelCode.toUpperCase()}.`
                      );
                      setNewHostelCode('');
                      setNewHostelName('');
                      setNewHostelDesc('');
                    }}
                    className="w-full bg-[#153b70] hover:bg-[#0f274a] text-white py-2 rounded-lg text-xs font-extrabold transition"
                  >
                    Save Hostel Wing
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4" />
                    <span>Add Room &amp; Bed Code</span>
                  </h3>
                  <select
                    value={roomHostelId}
                    onChange={(e) => setRoomHostelId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    {state.hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.code} — {h.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Room e.g. A-103"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Floor"
                      value={roomFloor}
                      onChange={(e) => setRoomFloor(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Unique Bed Code e.g. A-103-B1"
                    value={bedCode}
                    onChange={(e) => setBedCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!roomCode || !bedCode) {
                        setFeedback({ type: 'err', text: 'Provide room and bed codes.' });
                        return;
                      }
                      refresh(
                        hostelsService.addRoomAndBed({
                          hostelId: roomHostelId,
                          roomCode,
                          floor: roomFloor,
                          bedCode,
                          actor: actor.name,
                        }),
                        `Added bed ${bedCode.toUpperCase()} to ${roomCode.toUpperCase()}.`
                      );
                      setBedCode('');
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-lg text-xs font-extrabold transition"
                  >
                    Add Bed to Inventory
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Inventory Governance Control</span>
                </div>
                <p>
                  Only the <strong>Hostel Officer</strong> role can register new residences, edit bed
                  serviceability statuses, or create beds. Switch role above to test Hostel Officer
                  controls.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATIONS & ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Applications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-[#153b70] mb-3">
                Accommodation Applications
              </h2>
              <div className="space-y-3">
                {state.applications
                  .filter((a) => role !== 'STUDENT' || a.studentRegNo === actor.id)
                  .map((app) => {
                    const hostel = state.hostels.find((h) => h.id === app.hostelId);
                    return (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#153b70]">
                              {app.reference}
                            </span>
                            <span className="font-extrabold text-slate-900">{app.studentName}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {app.studentRegNo}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-1">
                            {hostel?.name} • <strong>{app.startDate}</strong> to{' '}
                            <strong>{app.endDate}</strong>
                          </div>
                          <div className="text-slate-500 mt-0.5">{app.reason}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              app.status === 'ALLOCATED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.status === 'APPROVED'
                                ? 'bg-blue-100 text-blue-800'
                                : app.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.status}
                          </span>
                          {role === 'HOSTEL_OFFICER' &&
                            (app.status === 'SUBMITTED' || app.status === 'WAITLISTED') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    refresh(
                                      hostelsService.reviewApplication(
                                        app.id,
                                        'APPROVED',
                                        actor.name,
                                        'Verified stay dates'
                                      ),
                                      `Approved ${app.reference}.`
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    refresh(
                                      hostelsService.reviewApplication(
                                        app.id,
                                        'REJECTED',
                                        actor.name,
                                        'Capacity exceeded'
                                      ),
                                      `Rejected ${app.reference}.`
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Active / Reserved Allocations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-[#153b70] mb-3">
                Bed Allocations &amp; Check-In / Check-Out
              </h2>
              <div className="space-y-3">
                {state.allocations
                  .filter((al) => role !== 'STUDENT' || al.studentRegNo === actor.id)
                  .map((al) => {
                    const bed = state.beds.find((b) => b.id === al.bedId);
                    const hostel = state.hostels.find((h) => h.id === al.hostelId);
                    return (
                      <div
                        key={al.id}
                        className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#153b70]">
                              {bed?.bedCode ?? al.bedId}
                            </span>
                            <span className="font-extrabold text-slate-900">{al.studentName}</span>
                            <span className="text-slate-500">({al.studentRegNo})</span>
                          </div>
                          <div className="text-slate-600 mt-1">
                            {hostel?.name} • Stay Window: <strong>{al.startDate}</strong> to{' '}
                            <strong>{al.endDate}</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              al.status === 'CHECKED_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : al.status === 'RESERVED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {al.status}
                          </span>
                          {role === 'HOSTEL_OFFICER' && al.status === 'RESERVED' && (
                            <button
                              type="button"
                              onClick={() =>
                                refresh(
                                  hostelsService.checkInAllocation(al.id, actor.name),
                                  `Checked in ${al.studentRegNo}.`
                                )
                              }
                              className="px-2.5 py-1 rounded bg-[#153b70] text-white font-bold hover:bg-[#0f274a]"
                            >
                              Check In
                            </button>
                          )}
                          {role === 'HOSTEL_OFFICER' && al.status === 'CHECKED_IN' && (
                            <button
                              type="button"
                              onClick={() =>
                                refresh(
                                  hostelsService.checkOutAllocation(al.id, actor.name),
                                  `Checked out ${al.studentRegNo}.`
                                )
                              }
                              className="px-2.5 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Form: Student Application OR Officer Bed Allocation */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-[#153b70]">
                Submit Accommodation Application
              </h3>
              <select
                value={appHostelId}
                onChange={(e) => setAppHostelId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                {visibleHostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.occupancyPolicy})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={appStart}
                    onChange={(e) => setAppStart(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={appEnd}
                    onChange={(e) => setAppEnd(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
              </div>
              <textarea
                placeholder="Reason / programme justification..."
                value={appReason}
                onChange={(e) => setAppReason(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  refresh(
                    hostelsService.submitApplication({
                      studentRegNo: 'HCA/STU/2026/001',
                      studentName: 'Brian Omondi Otieno',
                      branch: 'Nairobi Main Campus',
                      hostelId: appHostelId,
                      startDate: appStart,
                      endDate: appEnd,
                      reason: appReason || 'Trimester academic accommodation',
                    }),
                    'Accommodation application submitted.'
                  );
                  setAppReason('');
                }}
                className="w-full bg-[#d92332] hover:bg-[#b81d2a] text-white py-2 rounded-lg text-xs font-extrabold transition"
              >
                Submit Application
              </button>
            </div>

            {role === 'HOSTEL_OFFICER' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#153b70]">
                  Allocate Serviceable Bed (Overlap-Safe)
                </h3>
                <select
                  value={allocAppId}
                  onChange={(e) => setAllocAppId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="">-- Select Approved Application --</option>
                  {state.applications
                    .filter((a) => a.status === 'APPROVED')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.reference} — {a.studentName}
                      </option>
                    ))}
                </select>
                <select
                  value={allocBedId}
                  onChange={(e) => setAllocBedId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="">-- Select Bed --</option>
                  {state.beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedCode} ({b.status})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={allocStart}
                    onChange={(e) => setAllocStart(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="date"
                    value={allocEnd}
                    onChange={(e) => setAllocEnd(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!allocAppId || !allocBedId) {
                      setFeedback({ type: 'err', text: 'Select an approved application and bed.' });
                      return;
                    }
                    refresh(
                      hostelsService.allocateBed({
                        applicationId: allocAppId,
                        bedId: allocBedId,
                        startDate: allocStart,
                        endDate: allocEnd,
                        actor: actor.name,
                      }),
                      'Allocated bed cleanly inside overlap-checked window.'
                    );
                  }}
                  className="w-full bg-[#153b70] hover:bg-[#0f274a] text-white py-2 rounded-lg text-xs font-extrabold transition"
                >
                  Confirm Allocation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MAINTENANCE & VISITORS */}
      {activeTab === 'maintenance-visitors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#153b70] flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span>Residence Maintenance Requests</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Describe repair / maintenance issue..."
                value={mntTitle}
                onChange={(e) => setMntTitle(e.target.value)}
                className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <select
                value={mntPriority}
                onChange={(e) => setMntPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                className="border border-slate-300 rounded-lg px-2 py-2 text-xs bg-white"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!mntTitle.trim()) return;
                  refresh(
                    hostelsService.reportMaintenance({
                      studentRegNo: role === 'STUDENT' ? actor.id : 'HCA/STU/2026/001',
                      studentName: actor.name,
                      issueTitle: mntTitle,
                      priority: mntPriority,
                      isStaff: role !== 'STUDENT',
                      hostelId: state.hostels[0]?.id,
                      roomId: state.rooms[0]?.id,
                    }),
                    'Maintenance ticket logged.'
                  );
                  setMntTitle('');
                }}
                className="bg-[#153b70] text-white px-4 py-2 rounded-lg text-xs font-extrabold"
              >
                Log Ticket
              </button>
            </div>
            <div className="space-y-2.5">
              {state.maintenance.map((m) => (
                <div key={m.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#153b70]">{m.reference}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {m.priority} • {m.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 mt-1">{m.issueTitle}</div>
                  <div className="text-slate-500 mt-0.5">Reported by {m.reportedByName}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#153b70] flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Resident Visitor Register</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Resident Reg No (e.g. HCA/STU/2026/001)"
                value={visResident}
                onChange={(e) => setVisResident(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <input
                type="date"
                value={visDate}
                onChange={(e) => setVisDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Visitor Full Name"
                value={visName}
                onChange={(e) => setVisName(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="National ID / Passport No"
                value={visIdNo}
                onChange={(e) => setVisIdNo(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Visit purpose..."
                value={visPurpose}
                onChange={(e) => setVisPurpose(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!visName || !visIdNo) return;
                  refresh(
                    hostelsService.registerVisitor({
                      residentRegNo: visResident,
                      visitorName: visName,
                      visitorIdNo: visIdNo,
                      expectedDate: visDate,
                      purpose: visPurpose || 'Academic / family visit',
                      actor: actor.name,
                    }),
                    'Visitor registered for active resident stay window.'
                  );
                  setVisName('');
                  setVisIdNo('');
                  setVisPurpose('');
                }}
                className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-extrabold"
              >
                Register Visitor
              </button>
            </div>
            <div className="space-y-2.5">
              {state.visitors.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {v.visitorName} <span className="font-mono text-slate-500">({v.visitorIdNo})</span>
                    </div>
                    <div className="text-slate-600">
                      Visiting {v.residentName} • {v.expectedDate} • {v.purpose}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {v.status}
                    </span>
                    {role === 'HOSTEL_OFFICER' && v.status === 'EXPECTED' && (
                      <button
                        type="button"
                        onClick={() =>
                          refresh(
                            hostelsService.transitionVisitor(v.id, 'CHECKED_IN', actor.name),
                            `${v.visitorName} checked in.`
                          )
                        }
                        className="px-2 py-1 rounded bg-[#153b70] text-white font-bold"
                      >
                        Check In
                      </button>
                    )}
                    {role === 'HOSTEL_OFFICER' && v.status === 'CHECKED_IN' && (
                      <button
                        type="button"
                        onClick={() =>
                          refresh(
                            hostelsService.transitionVisitor(v.id, 'CHECKED_OUT', actor.name),
                            `${v.visitorName} checked out.`
                          )
                        }
                        className="px-2 py-1 rounded bg-slate-700 text-white font-bold"
                      >
                        Check Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOMMODATION CHARGES (MAKER-CHECKER) */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#153b70]">
                Accommodation Charges &amp; Finance Draft Invoicing
              </h2>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                Maker ≠ Finance Approver Enforced
              </span>
            </div>

            {state.charges
              .filter((c) => role !== 'STUDENT' || c.studentRegNo === actor.id)
              .map((chg) => (
                <div
                  key={chg.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#153b70]">{chg.chargeRef}</span>
                      <span className="font-extrabold text-slate-900">
                        KES {chg.amount.toLocaleString()}
                      </span>
                      {chg.draftInvoiceRef && (
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          {chg.draftInvoiceRef}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700 mt-1">{chg.description}</div>
                    <div className="text-slate-500 mt-0.5">
                      Resident: {chg.studentName} ({chg.studentRegNo}) • Created by:{' '}
                      <strong>{chg.createdByName}</strong>
                      {chg.approvedByName && (
                        <>
                          {' '}
                          • Approved by: <strong>{chg.approvedByName}</strong>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                      {chg.status}
                    </span>
                    {chg.status === 'DRAFT' && role !== 'STUDENT' && (
                      <button
                        type="button"
                        onClick={() =>
                          refresh(
                            hostelsService.approveCharge(chg.id, actor.id, actor.name),
                            `Approved charge ${chg.chargeRef}.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                      >
                        Approve Charge
                      </button>
                    )}
                    {chg.status === 'APPROVED' && role === 'FINANCE_OFFICER' && (
                      <button
                        type="button"
                        onClick={() =>
                          refresh(
                            hostelsService.generateDraftInvoice(chg.id, actor.name),
                            `Generated draft invoice for ${chg.chargeRef}.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#153b70] hover:bg-[#0f274a] text-white font-bold"
                      >
                        Generate Draft Invoice
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70]">
              Raise Draft Hostel Charge (Hostel Officer)
            </h3>
            {role === 'HOSTEL_OFFICER' ? (
              <>
                <select
                  value={chgAllocId}
                  onChange={(e) => setChgAllocId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  {state.allocations.map((al) => (
                    <option key={al.id} value={al.id}>
                      {al.studentRegNo} — {al.studentName}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Charge description"
                  value={chgDesc}
                  onChange={(e) => setChgDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  placeholder="Amount (KES)"
                  value={chgAmount}
                  onChange={(e) => setChgAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    refresh(
                      hostelsService.createDraftCharge({
                        allocationId: chgAllocId,
                        description: chgDesc,
                        amount: Number(chgAmount),
                        actorId: actor.id,
                        actorName: actor.name,
                      }),
                      'Draft accommodation charge created; switch to Finance Officer to approve.'
                    )
                  }
                  className="w-full bg-[#153b70] hover:bg-[#0f274a] text-white py-2 rounded-lg text-xs font-extrabold"
                >
                  Create Draft Charge
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-600">
                Switch to <strong>Hostel Officer</strong> to originate draft charges, then switch to{' '}
                <strong>Finance Officer</strong> to approve and issue draft invoices.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: WELFARE & RESTRICTED CASES */}
      {activeTab === 'welfare' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Unassigned Sensitive Queue (Masked Descriptions) */}
            {(role === 'STUDENT_SERVICES_OFFICER' || role === 'HOSTEL_OFFICER') && (
              <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-amber-700" />
                    <span>Unassigned Restricted Queue (Privacy-Masked Intake)</span>
                  </h2>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                    Descriptions Hidden Until Assigned
                  </span>
                </div>
                {unassignedRestricted.length === 0 ? (
                  <p className="text-xs text-amber-800">All restricted referrals are currently assigned.</p>
                ) : (
                  unassignedRestricted.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-xl border border-amber-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#d92332]">{req.caseRef}</span>
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                            RESTRICTED • {req.category}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-1">
                          Branch: <strong>{req.branch}</strong> • Admission:{' '}
                          <span className="font-mono">{req.studentRegNo}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          [Sensitive subject and narrative masked prior to case handler assignment]
                        </div>
                      </div>
                      {role === 'STUDENT_SERVICES_OFFICER' && (
                        <button
                          type="button"
                          onClick={() =>
                            refresh(
                              hostelsService.assignSupportRequest(req.id, actor.id, actor.name),
                              `Assigned restricted case ${req.caseRef} to ${actor.name}.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#153b70] text-white font-bold hover:bg-[#0f274a]"
                        >
                          Assign to Me &amp; Unmask
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Assigned / Visible Welfare Cases */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-[#153b70]">
                Active Student Support Cases
              </h2>
              {visibleStandardOrAssignedCases.map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#153b70]">{req.caseRef}</span>
                      <span className="font-extrabold text-slate-900">{req.subject}</span>
                      {req.restricted && (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                          RESTRICTED
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
                      {req.status}
                    </span>
                  </div>
                  <p className="text-slate-700">{req.description}</p>
                  <div className="text-[11px] text-slate-500">
                    Requester: {req.studentName} ({req.studentRegNo}) • Handler:{' '}
                    <strong>{req.assignedToName ?? 'Unassigned'}</strong>
                  </div>
                  {req.updates.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-slate-200">
                      {req.updates.map((u) => (
                        <div key={u.id} className="bg-white p-2 rounded border border-slate-200">
                          <span className="font-bold text-[#153b70]">{u.author}: </span>
                          <span>{u.note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {role === 'STUDENT_SERVICES_OFFICER' && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add confidential case note..."
                        value={welUpdateNote[req.id] || ''}
                        onChange={(e) =>
                          setWelUpdateNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          refresh(
                            hostelsService.addSupportUpdate(
                              req.id,
                              actor.name,
                              welUpdateNote[req.id] || 'Case follow-up logged.',
                              'IN_PROGRESS'
                            ),
                            `Updated ${req.caseRef}.`
                          );
                          setWelUpdateNote((prev) => ({ ...prev, [req.id]: '' }));
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#153b70] text-white font-bold"
                      >
                        Post Update
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          refresh(
                            hostelsService.addSupportUpdate(
                              req.id,
                              actor.name,
                              'Support plan completed and closed.',
                              'RESOLVED' as SupportRequestStatus
                            ),
                            `Resolved ${req.caseRef}.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#d92332]" />
              <span>Submit Welfare / Counselling Referral</span>
            </h3>
            <select
              value={welCategory}
              onChange={(e) => setWelCategory(e.target.value as SupportRequestCategory)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="COUNSELLING">Counselling (Auto-Restricted)</option>
              <option value="HEALTH_REFERRAL">Health Referral (Auto-Restricted)</option>
              <option value="ACCOMMODATION_WELFARE">Accommodation Welfare</option>
              <option value="FINANCIAL_AID">Financial Aid / Hardship</option>
              <option value="GENERAL_SUPPORT">General Student Support</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={welSensitive}
                onChange={(e) => setWelSensitive(e.target.checked)}
                className="accent-[#d92332]"
              />
              <span>Mark as Restricted / Sensitive Referral</span>
            </label>
            <input
              type="text"
              placeholder="Case Subject"
              value={welSubject}
              onChange={(e) => setWelSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <textarea
              placeholder="Confidential narrative (masked from general staff)..."
              value={welDesc}
              onChange={(e) => setWelDesc(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!welSubject || !welDesc) return;
                refresh(
                  hostelsService.submitSupportRequest({
                    studentRegNo: 'HCA/STU/2026/001',
                    studentName: 'Brian Omondi Otieno',
                    branch: 'Nairobi Main Campus',
                    category: welCategory,
                    explicitSensitive: welSensitive,
                    subject: welSubject,
                    description: welDesc,
                  }),
                  'Support case submitted cleanly.'
                );
                setWelSubject('');
                setWelDesc('');
              }}
              className="w-full bg-[#d92332] hover:bg-[#b81d2a] text-white py-2 rounded-lg text-xs font-extrabold"
            >
              Submit Support Request
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: ANNOUNCEMENTS & AUDIT */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Campus &amp; Residence Announcements
            </h2>
            {role !== 'STUDENT' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={annBranch}
                    onChange={(e) => setAnnBranch(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                  >
                    {COLLEGE_INFO.campuses.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={annAudience}
                    onChange={(e) => setAnnAudience(e.target.value as AnnouncementAudience)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="ALL_STUDENTS">ALL_STUDENTS (Branch)</option>
                    <option value="HOSTEL_RESIDENTS">HOSTEL_RESIDENTS</option>
                    <option value="STAFF_ONLY">STAFF_ONLY</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Announcement title"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                />
                <textarea
                  placeholder="Announcement body..."
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!annTitle || !annBody) return;
                    refresh(
                      hostelsService.publishAnnouncement({
                        title: annTitle,
                        body: annBody,
                        branch: annBranch,
                        hostelId: annAudience === 'HOSTEL_RESIDENTS' ? state.hostels[0]?.id : undefined,
                        audience: annAudience,
                        actor: actor.name,
                      }),
                      'Announcement published.'
                    );
                    setAnnTitle('');
                    setAnnBody('');
                  }}
                  className="bg-[#153b70] text-white px-4 py-2 rounded-lg text-xs font-extrabold"
                >
                  Publish Notice
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {visibleAnnouncements.map((ann) => (
                <div key={ann.id} className="p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-[#153b70]">{ann.title}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold">
                      {ann.audience}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{ann.body}</p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ann.branch} • {ann.publishedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Residence &amp; Welfare Audit Trail
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {state.auditLog.map((ev) => (
                <div key={ev.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800">{ev.action}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {ev.actor} • {new Date(ev.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
