import React from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  MapPin,
  Briefcase,
  KeyRound,
  LogOut,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  STAFF_CHANNEL_REGISTRY,
  StaffChannelAssignment,
} from '../services/institutionalEventBus';
import { PortalRole } from '../types';

interface StaffIdentityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: PortalRole;
  onSwitchPortal: (role: PortalRole) => void;
  onLogout: () => void;
}

export default function StaffIdentityDrawer({
  isOpen,
  onClose,
  currentRole,
  onSwitchPortal,
  onLogout,
}: StaffIdentityDrawerProps) {
  if (!isOpen) return null;

  const currentAssignment: StaffChannelAssignment | undefined =
    Object.values(STAFF_CHANNEL_REGISTRY).find((s) => s.role === currentRole);

  const allStaffList = Object.values(STAFF_CHANNEL_REGISTRY);

  const handleSelectStaff = (role: PortalRole) => {
    onSwitchPortal(role);
    onClose();
  };

  const initials = currentAssignment?.staffName
    ? currentAssignment.staffName
        .split(' ')
        .filter((w) => !w.endsWith('.'))
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : 'HT';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-200">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#061d40] to-[#0d346c] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-[#092c60] font-black text-sm flex items-center justify-center shadow-md">
              {initials}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white leading-tight">
                Staff Identity &amp; Channel Hub
              </h3>
              <span className="text-xs text-blue-200 font-mono">
                {currentAssignment?.staffRegNo || 'Authenticated Session'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Close Drawer (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* ACTIVE PROFILE OVERVIEW */}
        <div className="p-5 bg-[#f8fafc] border-b border-slate-200 space-y-3">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-[#0866d7] uppercase font-mono">
              Active Institutional Official
            </span>
            <h4 className="text-lg font-black text-[#092c60]">
              {currentAssignment?.staffName || 'College Administrator'}
            </h4>
            <p className="text-xs font-semibold text-slate-700">
              {currentAssignment?.staffTitle || 'Platform Authority'}
            </p>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-blue-600 shrink-0" />
              <span>{currentAssignment?.department || 'Central Directorate'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-emerald-600 shrink-0" />
              <span>Nairobi Main Campus · Executive Academic Wing</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-purple-600 shrink-0" />
              <span>Designated Channel: <code className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{currentAssignment?.channel}</code></span>
            </div>
          </div>
        </div>

        {/* ALL INSTITUTIONAL STAFF PERSONAS */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <strong className="text-xs font-bold text-[#092c60] block">
                Institutional Staff Personas
              </strong>
              <span className="text-[11px] text-slate-500">
                Switch perspective to operate another officer&apos;s workspace
              </span>
            </div>
            <Sparkles size={15} className="text-amber-500" />
          </div>

          <div className="space-y-2">
            {allStaffList.map((st) => {
              const isCurrent = currentRole === st.role;
              return (
                <button
                  key={st.channel}
                  type="button"
                  onClick={() => handleSelectStaff(st.role)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-blue-50 border-[#0866d7] ring-2 ring-blue-100 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-slate-900 truncate">
                        {st.staffName}
                      </strong>
                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white flex items-center gap-0.5">
                          <CheckCircle2 size={9} /> Current
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 block truncate">
                      {st.staffTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {st.staffRegNo} · Channel: {st.channel}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <LogOut size={14} /> Sign Out to Website
          </button>
        </div>
      </div>
    </div>
  );
}
