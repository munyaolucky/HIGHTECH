import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { StaffButton, StaffPageHeader, StaffStatusTag } from '../staff/components/StaffDashboardUI';

interface MfaStatusDto {
  mfaEnabled: boolean;
  method: string;
  verifiedAt: string | null;
  privilegedRolePolicy: boolean;
  remainingBackupCodes: number;
  trustedDevices: {
    id: string;
    deviceLabel: string;
    ipAddress: string;
    lastUsedAt: string;
    expiresAt: string;
  }[];
}

interface SessionDto {
  id: string;
  deviceLabel: string;
  ipAddress: string;
  rememberMe: boolean;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface LoginEventDto {
  id: number;
  identifier: string;
  authMethod: string;
  outcome: string;
  failureReason: string | null;
  ipAddress: string;
  deviceLabel: string;
  createdAt: string;
}

export default function AccountSecurityPage() {
  const [mfaStatus, setMfaStatus] = useState<MfaStatusDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Enrollment flow
  const [enrollSetup, setEnrollSetup] = useState<{
    qrDataUrl: string;
    manualKey: string;
  } | null>(null);
  const [enrollCode, setEnrollCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Re-auth password for sensitive MFA actions
  const [reauthPassword, setReauthPassword] = useState('');

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      const [mfaRes, sesRes, histRes] = await Promise.all([
        fetch('/api/mfa/status', { credentials: 'include' }),
        fetch('/api/account/sessions', { credentials: 'include' }),
        fetch('/api/account/login-history', { credentials: 'include' }),
      ]);
      const mfaJson = await mfaRes.json().catch(() => null);
      const sesJson = await sesRes.json().catch(() => null);
      const histJson = await histRes.json().catch(() => null);

      if (mfaJson?.success) setMfaStatus(mfaJson.data);
      if (sesJson?.success) setSessions(sesJson.data);
      if (histJson?.success) setLoginHistory(histJson.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  const handleStartMfa = async () => {
    setError(null);
    setNotice(null);
    const res = await fetch('/api/mfa/enroll/start', {
      method: 'POST',
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Could not start MFA enrollment.');
      return;
    }
    setEnrollSetup({ qrDataUrl: json.data.qrDataUrl, manualKey: json.data.manualKey });
    setEnrollCode('');
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/mfa/enroll/confirm', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: enrollCode }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Invalid authenticator code.');
      return;
    }
    setEnrollSetup(null);
    setBackupCodes(json.data.backupCodes);
    setNotice('Multi-Factor Authentication enabled. Save your 10 single-use backup codes below.');
    await loadSecurityData();
  };

  const handleRegenerateCodes = async () => {
    setError(null);
    const res = await fetch('/api/mfa/backup-codes/regenerate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: reauthPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Password confirmation required to regenerate backup codes.');
      return;
    }
    setBackupCodes(json.data.backupCodes);
    setReauthPassword('');
    setNotice('10 new backup recovery codes generated. Previous codes are invalidated.');
    await loadSecurityData();
  };

  const handleDisableMfa = async () => {
    setError(null);
    const res = await fetch('/api/mfa/disable', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: reauthPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Password confirmation required to disable MFA.');
      return;
    }
    setReauthPassword('');
    setNotice('Multi-Factor Authentication has been disabled.');
    await loadSecurityData();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    const res = await fetch('/api/auth/password/change', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Password change failed.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNotice('Password changed and other active sessions signed out.');
    await loadSecurityData();
  };

  const handleRevokeSession = async (sessionId: string) => {
    await fetch(`/api/account/sessions/${sessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setNotice('Session revoked.');
    await loadSecurityData();
  };

  const handleRevokeOthers = async () => {
    await fetch('/api/account/sessions/revoke-others', {
      method: 'POST',
      credentials: 'include',
    });
    setNotice('All other active sessions were signed out.');
    await loadSecurityData();
  };

  const handleRevokeDevice = async (deviceId: string) => {
    await fetch(`/api/mfa/devices/${deviceId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setNotice('Trusted device removed.');
    await loadSecurityData();
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Account Security, MFA & Active Sessions"
        description="Manage Authenticator App (TOTP) verification, single-use backup codes, trusted devices, active sessions, and sign-in history."
        breadcrumb="Account Security"
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-800 dark:text-red-200 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-Factor Authentication Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                <Smartphone size={18} className="text-[#1769AA]" />
                Multi-Factor Authentication (TOTP)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protect your portal account with Google Authenticator, Microsoft Authenticator, or Authy plus 10 one-time backup codes.
              </p>
            </div>
            <StaffStatusTag status={mfaStatus?.mfaEnabled ? 'ACTIVE' : 'PENDING'} />
          </div>

          {mfaStatus?.privilegedRolePolicy && !mfaStatus.mfaEnabled && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>
                Privileged role security policy strongly requires enabling MFA for Administrator, Principal, Registrar, Finance, HR, and Examination officers.
              </span>
            </div>
          )}

          {!loading && !mfaStatus?.mfaEnabled && !enrollSetup && (
            <StaffButton onClick={handleStartMfa}>
              <ShieldCheck size={15} /> Set Up Authenticator App
            </StaffButton>
          )}

          {enrollSetup && (
            <form onSubmit={handleConfirmMfa} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={enrollSetup.qrDataUrl}
                  alt="TOTP Authenticator QR Code"
                  className="h-40 w-40 rounded-xl border border-slate-200 bg-white p-2"
                />
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-[#102D50] dark:text-white">
                    1. Scan QR code with your Authenticator App
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Or enter this setup key manually:
                  </p>
                  <div className="font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 select-all">
                    {enrollSetup.manualKey}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value)}
                  placeholder="Enter 6-digit app code"
                  required
                  className="flex-1 min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-mono"
                />
                <StaffButton type="submit">Verify &amp; Enable MFA</StaffButton>
              </div>
            </form>
          )}

          {mfaStatus?.mfaEnabled && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  Remaining single-use backup codes:
                </span>
                <span className="font-mono font-bold text-[#102D50] dark:text-white">
                  {mfaStatus.remainingBackupCodes} / 10
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="Confirm current password for MFA changes..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <StaffButton variant="secondary" onClick={handleRegenerateCodes}>
                    <RefreshCw size={14} /> Regenerate 10 Backup Codes
                  </StaffButton>
                  <StaffButton variant="danger" onClick={handleDisableMfa}>
                    Disable MFA
                  </StaffButton>
                </div>
              </div>
            </div>
          )}

          {backupCodes && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 size={15} /> Save these 10 single-use backup recovery codes
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-900 dark:text-white">
                {backupCodes.map((c) => (
                  <div
                    key={c}
                    className="rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-center"
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Change Password */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <KeyRound size={18} className="text-[#1769AA]" />
              Update Account Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Strong password policy required (min 8 chars, upper &amp; lowercase, digit, symbol). Changing your password automatically signs out other sessions.
            </p>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New strong password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs"
            />
            <StaffButton type="submit">
              <Lock size={14} /> Update Password
            </StaffButton>
          </form>
        </section>
      </div>

      {/* Active Sessions & Trusted Devices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Laptop size={18} className="text-[#1769AA]" /> Active Sessions ({sessions.length})
            </h2>
            {sessions.length > 1 && (
              <StaffButton variant="secondary" onClick={handleRevokeOthers}>
                <LogOut size={14} /> Sign Out Other Devices
              </StaffButton>
            )}
          </div>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              Active session tracking appears when signed in via Unified Portal Login.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {sessions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{s.deviceLabel}</span>
                      {s.isCurrent && (
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      IP {s.ipAddress} · Last active {String(s.lastActiveAt).slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-red-700 hover:bg-red-50 font-semibold"
                    >
                      <Trash2 size={12} /> Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#1769AA]" /> Trusted MFA Devices
          </h2>
          {!mfaStatus || mfaStatus.trustedDevices.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No devices are currently marked as 30-day trusted browsers.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {mfaStatus.trustedDevices.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{d.deviceLabel}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      IP {d.ipAddress} · Expires {String(d.expiresAt).slice(0, 10)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeDevice(d.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Login Audit History */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#102D50] dark:text-white">
          Recent Sign-In &amp; Security Events
        </h2>
        {loginHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No sign-in history recorded yet for this account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Timestamp</th>
                  <th className="py-2 pr-4 font-semibold">Method</th>
                  <th className="py-2 pr-4 font-semibold">Outcome</th>
                  <th className="py-2 pr-4 font-semibold">Device</th>
                  <th className="py-2 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loginHistory.map((ev) => (
                  <tr key={ev.id}>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-slate-500">
                      {String(ev.createdAt).slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold">{ev.authMethod}</td>
                    <td className="py-2.5 pr-4">
                      <StaffStatusTag status={ev.outcome} />
                    </td>
                    <td className="py-2.5 pr-4">{ev.deviceLabel}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">{ev.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
