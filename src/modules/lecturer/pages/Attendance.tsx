import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  QrCode,
  RefreshCw,
  Save,
  ShieldAlert,
} from 'lucide-react';
import {
  teachingModuleApi,
  type AttendanceSessionDTO,
} from '../../../services/teachingModuleApi';

const DEFAULT_ROSTER = [
  { studentRegNo: 'HCA/STU/2026/001', studentName: 'Amina Wanjiku Kamau', status: 'PRESENT' as const },
  { studentRegNo: 'HCA/STU/2026/0001', studentName: "Faith Wangari Ndung'u", status: 'PRESENT' as const },
  { studentRegNo: 'HCA/STU/2026/002', studentName: 'Brian Kipruto Korir', status: 'PRESENT' as const },
  { studentRegNo: 'HCA/STU/2025/110', studentName: 'Samuel Ochieng Odhiambo', status: 'LATE' as const },
  { studentRegNo: 'HCA/STU/2025/142', studentName: 'Dennis Mutiso Kyalo', status: 'ABSENT' as const },
  { studentRegNo: 'HCA/STU/2026/044', studentName: 'Mercy Chepngetich', status: 'PRESENT' as const },
];

export default function Attendance() {
  const [sessions, setSessions] = useState<AttendanceSessionDTO[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [entries, setEntries] = useState<
    Array<{ id?: string; studentRegNo: string; studentName: string; status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'; method?: string; remarks?: string }>
  >(DEFAULT_ROSTER);
  const [unitCode, setUnitCode] = useState('CSC 301');
  const [sessionDate, setSessionDate] = useState('2026-11-19');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Amendment request state for locked registers
  const [amendRecord, setAmendRecord] = useState<{ id: string; studentName: string; currentStatus: string } | null>(null);
  const [amendStatus, setAmendStatus] = useState('EXCUSED');
  const [amendReason, setAmendReason] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await teachingModuleApi.ensureLecturerSession();
      const data = await teachingModuleApi.listAttendance();
      setSessions(data.sessions || []);
      setCorrections(data.corrections || []);
      if (data.sessions?.length) {
        const target = data.sessions.find((s) => s.id === selectedSessionId) || data.sessions[0];
        setSelectedSessionId(target.id);
        setUnitCode(target.unitCode);
        setSessionDate(target.sessionDate);
        if (target.records.length > 0) {
          setEntries(
            target.records.map((r) => ({
              id: r.id,
              studentRegNo: r.studentRegNo,
              studentName: r.studentName,
              status: r.status,
              method: r.method,
              remarks: r.remarks,
            }))
          );
        } else {
          setEntries(DEFAULT_ROSTER);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load class attendance registers.');
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || null;

  const selectSession = (session: AttendanceSessionDTO) => {
    setSelectedSessionId(session.id);
    setUnitCode(session.unitCode);
    setSessionDate(session.sessionDate);
    setEntries(
      session.records.length > 0
        ? session.records.map((r) => ({
            id: r.id,
            studentRegNo: r.studentRegNo,
            studentName: r.studentName,
            status: r.status,
            method: r.method,
            remarks: r.remarks,
          }))
        : DEFAULT_ROSTER
    );
  };

  const cycleStatus = (regNo: string) => {
    if (activeSession?.locked) return;
    setEntries((prev) =>
      prev.map((s) => {
        if (s.studentRegNo !== regNo) return s;
        const nextMap: Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'> = {
          PRESENT: 'LATE',
          LATE: 'ABSENT',
          ABSENT: 'EXCUSED',
          EXCUSED: 'PRESENT',
        };
        return { ...s, status: nextMap[s.status] || 'PRESENT' };
      })
    );
  };

  const markAllPresent = () => {
    if (activeSession?.locked) return;
    setEntries((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
  };

  const handleCommit = async (lockSession: boolean) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await teachingModuleApi.commitAttendance({
        sessionId: activeSession?.id,
        unitCode,
        sessionDate,
        lockSession,
        entries: entries.map((e) => ({
          studentRegNo: e.studentRegNo,
          studentName: e.studentName,
          status: e.status,
          remarks: e.remarks || '',
        })),
      });
      const triggered = res.triggeredAbsenceCases?.length || 0;
      setNotice(
        `${lockSession ? 'Submitted & Locked' : 'Saved Draft'} register for ${res.session.unitCode} (${res.session.attendanceRate}%). ${
          triggered > 0
            ? `${triggered} absence case(s) & student notification(s) automatically created/evaluated.`
            : ''
        }`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit attendance register.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!activeSession) return;
    try {
      setError(null);
      const qr = await teachingModuleApi.generateQr(activeSession.id);
      setNotice(`Live QR Session Code active: ${qr.qrToken} (Expires ${new Date(qr.qrExpiresAt).toLocaleTimeString()})`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate QR token.');
    }
  };

  const handleRequestAmendment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !amendRecord) return;
    try {
      setError(null);
      await teachingModuleApi.requestCorrection(
        activeSession.id,
        amendRecord.id,
        amendStatus,
        amendReason.trim()
      );
      setNotice(`Submitted locked-session amendment request for ${amendRecord.studentName} to HOD.`);
      setAmendRecord(null);
      setAmendReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Amendment request failed.');
    }
  };

  const presentCount = entries.filter((s) => s.status === 'PRESENT').length;
  const lateCount = entries.filter((s) => s.status === 'LATE').length;
  const absentCount = entries.filter((s) => s.status === 'ABSENT').length;
  const excusedCount = entries.filter((s) => s.status === 'EXCUSED').length;
  const attendanceRate = entries.length
    ? Math.round(((presentCount + excusedCount + lateCount * 0.5) / entries.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-400">
            Student Attendance Register, QR Check-In &amp; Auto Absence Engine
          </p>
          <h1 className="text-xl font-bold text-[#102D50] dark:text-white mt-0.5">
            Class Attendance &amp; Session Lock
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Marking students ABSENT automatically creates Student Absence Cases, sends student notifications, and triggers HOD/Principal threshold alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!activeSession?.locked && (
            <>
              <button
                type="button"
                onClick={markAllPresent}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleGenerateQr}
                className="px-3.5 py-2 rounded-xl border border-[#1769AA] text-[#1769AA] dark:text-blue-300 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <QrCode size={14} /> Generate Live QR Code
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleCommit(false)}
                className="px-3.5 py-2 rounded-xl bg-[#1769AA] hover:bg-[#12558a] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save size={14} /> Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleCommit(true)}
                className="px-4 py-2 rounded-xl bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={14} className="motion-safe:animate-spin" /> : <Lock size={14} />}
                Commit &amp; Lock Session
              </button>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-[#B83232] dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ACTIVE QR BANNER */}
      {activeSession?.qrToken && !activeSession.locked && (
        <div className="rounded-2xl border border-[#1769AA]/40 bg-[#F5EBDD]/60 dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <QrCode size={22} className="text-[#102D50] dark:text-blue-400 shrink-0" />
            <div>
              <strong className="text-sm text-[#102D50] dark:text-white block">
                Student Self Check-In Code: <span className="font-mono text-[#B83232] dark:text-amber-300">{activeSession.qrToken}</span>
              </strong>
              <span className="text-slate-700 dark:text-slate-300">
                Students enter this code in the Student Portal Attendance section before{' '}
                {activeSession.qrExpiresAt ? new Date(activeSession.qrExpiresAt).toLocaleTimeString() : 'session close'}.
              </span>
            </div>
          </div>
          <span className="font-mono font-bold text-[#1769AA] dark:text-blue-300">LIVE SESSION</span>
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 tabular-nums">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">Attendance Rate</span>
          <h2 className="text-xl font-bold text-[#102D50] dark:text-white mt-0.5">{attendanceRate}%</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Present</span>
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{presentCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">Late</span>
          <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">{lateCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-[#B83232] dark:text-red-300 font-semibold">Absent</span>
          <h2 className="text-xl font-bold text-[#B83232] dark:text-red-300 mt-0.5">{absentCount}</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">Excused</span>
          <h2 className="text-xl font-bold text-[#1769AA] dark:text-blue-300 mt-0.5">{excusedCount}</h2>
        </div>
      </div>

      {/* SESSION PICKER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="session-select" className="font-bold text-[#102D50] dark:text-white">
            Active Class Session:
          </label>
          <select
            id="session-select"
            value={selectedSessionId}
            onChange={(e) => {
              const s = sessions.find((item) => item.id === e.target.value);
              if (s) selectSession(s);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.unitCode} · {s.sessionDate} ({s.startTime}-{s.endTime}) {s.locked ? '[LOCKED]' : '[OPEN]'}
              </option>
            ))}
          </select>
        </div>

        {activeSession?.locked && (
          <span className="inline-flex items-center gap-1.5 font-bold text-[#B83232] dark:text-red-400">
            <ShieldAlert size={14} /> Locked Session — Changes Require HOD Amendment Approval
          </span>
        )}
      </div>

      {/* AMENDMENT MODAL PANEL */}
      {amendRecord && (
        <form onSubmit={handleRequestAmendment} className="rounded-2xl border-2 border-[#B83232] bg-white dark:bg-slate-900 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <strong className="text-sm text-[#102D50] dark:text-white">
              Request HOD Attendance Amendment — {amendRecord.studentName}
            </strong>
            <button type="button" onClick={() => setAmendRecord(null)} className="text-slate-500">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={amendStatus} onChange={(e) => setAmendStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
              <option value="EXCUSED">EXCUSED</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
            </select>
            <input
              type="text"
              required
              placeholder="Explain why locked register requires correction..."
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#B83232] text-white font-semibold">
            Submit Amendment to HOD
          </button>
        </form>
      )}

      {/* ROSTER TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600">Loading attendance roster...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4 font-semibold">Registration No</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((s) => (
                  <tr key={s.studentRegNo}>
                    <td className="py-3 px-4 font-mono font-bold text-[#102D50] dark:text-blue-300">{s.studentRegNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{s.studentName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{s.method || 'ROLL_CALL'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          s.status === 'PRESENT'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : s.status === 'LATE'
                            ? 'text-amber-700 dark:text-amber-300'
                            : s.status === 'ABSENT'
                            ? 'text-[#B83232] dark:text-red-400'
                            : 'text-[#1769AA] dark:text-blue-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {activeSession?.locked ? (
                        s.id && (
                          <button
                            type="button"
                            onClick={() =>
                              setAmendRecord({
                                id: s.id!,
                                studentName: s.studentName,
                                currentStatus: s.status,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                          >
                            Request Amendment
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => cycleStatus(s.studentRegNo)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[#102D50] dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                        >
                          Cycle Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {corrections.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 text-xs">
          <h3 className="font-bold text-[#102D50] dark:text-white">Locked Session Amendment Requests</h3>
          {corrections.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              <span>
                <strong>{c.studentName}</strong> ({c.previousStatus} &rarr; {c.requestedStatus}) — {c.reason}
              </span>
              <span className="font-bold text-[#1769AA]">{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
