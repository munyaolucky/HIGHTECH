import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  FilePlus2,
  History,
  KeyRound,
  PenTool,
  Plus,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { StaffUserAccount } from '../../config/staff-navigation';
import {
  StaffButton,
  StaffPageHeader,
  StaffStatusTag,
} from '../staff/components/StaffDashboardUI';

interface SignerRow {
  id: string;
  stepOrder: number;
  signerStaffId: string;
  signerName: string;
  signerRole: string;
  signerTitle: string;
  status: string;
  signedAt: string | null;
  declineReason: string | null;
}

interface SignatureRecordRow {
  id: string;
  signerName: string;
  signerTitle: string;
  signatureType: string;
  signatureDigest: string;
  documentChecksumSha256: string;
  signedAt: string;
}

interface SignatureRequestDto {
  id: string;
  documentId: string;
  documentTitle: string;
  documentReference: string | null;
  versionNumber: number;
  versionChecksumSha256: string;
  signingMode: string;
  status: string;
  verificationCode: string;
  requestedById: string;
  requestedByName: string;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  signers: SignerRow[];
  records: SignatureRecordRow[];
  canSignNow: boolean;
}

interface AuditEventRow {
  id: string;
  actorName: string;
  eventType: string;
  detail: string;
  createdAt: string;
}

interface AuthorityRow {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  authorityLevel: string;
  maxCategoryScope: string;
  delegatedToStaffId: string | null;
  delegatedToName: string | null;
  active: boolean;
}

interface CertificateRow {
  id: string;
  serialNumber: string;
  subjectName: string;
  issuerName: string;
  fingerprintSha256: string;
  status: string;
  revokedReason: string | null;
  issuedAt: string;
  expiresAt: string;
}

type WorkspaceTab = 'requests' | 'create' | 'verify' | 'governance';

export default function SignatureWorkspace({ user }: { user: StaffUserAccount }) {
  const [tab, setTab] = useState<WorkspaceTab>('requests');
  const [requests, setRequests] = useState<SignatureRequestDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventRow[]>([]);
  const [authorities, setAuthorities] = useState<AuthorityRow[]>([]);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [availableDocs, setAvailableDocs] = useState<
    { id: string; title: string; referenceNumber: string | null; status: string }[]
  >([]);
  const [staffDir, setStaffDir] = useState<
    { id: string; fullName: string; role: string; roleTitle: string }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Signing modal state
  const [signingTarget, setSigningTarget] = useState<SignatureRequestDto | null>(null);
  const [sigMode, setSigMode] = useState<'TYPED' | 'DRAWN' | 'CERTIFICATE'>('TYPED');
  const [typedSignature, setTypedSignature] = useState(user.fullName);
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [submittingSign, setSubmittingSign] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasCanvasStroke, setHasCanvasStroke] = useState(false);

  // Create request form
  const [docId, setDocId] = useState('');
  const [workflowMode, setWorkflowMode] = useState<'SEQUENTIAL' | 'PARALLEL'>('SEQUENTIAL');
  const [requestNotes, setRequestNotes] = useState('');
  const [orderedSigners, setOrderedSigners] = useState<string[]>([]);
  const [pickerSignerId, setPickerSignerId] = useState('');

  // Verify code state
  const [verifyCode, setVerifyCode] = useState('HCA-SIG-9A41C7E2');
  const [verifyData, setVerifyData] = useState<{
    verified: boolean;
    status: string;
    message?: string;
    verificationCode?: string;
    documentTitle?: string;
    documentReference?: string;
    versionNumber?: number;
    versionChecksumSha256?: string;
    signingMode?: string;
    pendingSigners?: number;
    signatures?: {
      signerName: string;
      signerTitle: string;
      signatureType: string;
      signatureDigest: string;
      signedAt: string;
    }[];
  } | null>(null);

  // Certificate form
  const [newCertSubject, setNewCertSubject] = useState('HI-TECH College Signatory Authority');

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reqRes, docRes, dirRes, authRes, certRes] = await Promise.all([
        fetch('/api/signatures/requests', { credentials: 'include' }),
        fetch('/api/documents?pageSize=40', { credentials: 'include' }),
        fetch('/api/staff/directory?pageSize=40', { credentials: 'include' }),
        fetch('/api/signatures/authorities', { credentials: 'include' }),
        fetch('/api/signatures/certificates', { credentials: 'include' }),
      ]);

      const reqJson = await reqRes.json().catch(() => null);
      if (reqRes.ok && reqJson?.success) {
        setRequests(reqJson.data);
        if (!selectedId && reqJson.data.length > 0) {
          setSelectedId(reqJson.data[0].id);
        }
      }

      const docJson = await docRes.json().catch(() => null);
      if (docRes.ok && docJson?.success) {
        setAvailableDocs(docJson.data.items ?? []);
        if (!docId && docJson.data.items?.length > 0) {
          setDocId(docJson.data.items[0].id);
        }
      }

      const dirJson = await dirRes.json().catch(() => null);
      if (dirRes.ok && dirJson?.success) {
        const items = dirJson.data.items ?? [];
        setStaffDir(items);
        if (!pickerSignerId && items.length > 0) {
          setPickerSignerId(items[0].id);
        }
      }

      const authJson = await authRes.json().catch(() => null);
      if (authRes.ok && authJson?.success) setAuthorities(authJson.data);

      const certJson = await certRes.json().catch(() => null);
      if (certRes.ok && certJson?.success) setCertificates(certJson.data);
    } catch {
      setError('Unable to load Digital Signature Workspace.');
    } finally {
      setLoading(false);
    }
  }, [selectedId, docId, pickerSignerId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const loadSelectedAudit = useCallback(async (id: string | null) => {
    if (!id) {
      setAuditEvents([]);
      return;
    }
    const res = await fetch(`/api/signatures/requests/${id}`, { credentials: 'include' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setAuditEvents(json.data.auditEvents ?? []);
    }
  }, []);

  useEffect(() => {
    loadSelectedAudit(selectedId);
  }, [selectedId, loadSelectedAudit]);

  const selectedRequest = requests.find((r) => r.id === selectedId) ?? null;

  // Canvas helpers
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasCanvasStroke(false);
  };

  const getPointerCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handleCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerCoords(e);
    drawingRef.current = true;
    ctx.strokeStyle = '#102D50';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasCanvasStroke(true);
  };

  const handleCanvasUp = () => {
    drawingRef.current = false;
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!docId || orderedSigners.length === 0) {
      setError('Select a document and add at least one signer to the route.');
      return;
    }

    const res = await fetch('/api/signatures/requests', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: docId,
        signingMode: workflowMode,
        signerStaffIds: orderedSigners,
        notes: requestNotes,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Could not create signature request.');
      return;
    }
    setNotice(
      `Created ${workflowMode} signature request (${json.data.verificationCode}). Signers notified.`
    );
    setOrderedSigners([]);
    setRequestNotes('');
    setSelectedId(json.data.id);
    setTab('requests');
    await loadWorkspace();
  };

  const handleExecuteSign = async () => {
    if (!signingTarget) return;
    setError(null);
    setSubmittingSign(true);
    try {
      if (declineMode) {
        const res = await fetch(`/api/signatures/requests/${signingTarget.id}/decline`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: declineReason }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || 'Failed to decline request.');
          return;
        }
        setNotice(`Declined signature request for "${signingTarget.documentTitle}".`);
        setSigningTarget(null);
        await loadWorkspace();
        await loadSelectedAudit(signingTarget.id);
        return;
      }

      let payload = typedSignature;
      if (sigMode === 'DRAWN') {
        if (!canvasRef.current || !hasCanvasStroke) {
          setError('Draw your signature on the pad before submitting.');
          return;
        }
        payload = canvasRef.current.toDataURL('image/png');
      } else if (sigMode === 'CERTIFICATE') {
        payload = `PKI-ATTESTATION:${user.employeeNumber}:${user.fullName}`;
      }

      const res = await fetch(`/api/signatures/requests/${signingTarget.id}/sign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureType: sigMode,
          signaturePayload: payload,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Signing failed.');
        return;
      }
      setNotice(
        `Applied ${sigMode} signature (${json.data.signatureRecord.signatureDigest}). Workflow status: ${json.data.requestStatus}.`
      );
      setSigningTarget(null);
      await loadWorkspace();
      await loadSelectedAudit(signingTarget.id);
    } finally {
      setSubmittingSign(false);
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyCode.trim()) return;
    const res = await fetch(`/api/signatures/verify/${encodeURIComponent(verifyCode.trim())}`);
    const json = await res.json();
    if (json?.success) {
      setVerifyData(json.data);
    }
  };

  const handleDelegateAuthority = async (authorityId: string, delegatedToStaffId: string) => {
    const res = await fetch(`/api/signatures/authorities/${authorityId}/delegate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delegatedToStaffId: delegatedToStaffId || null }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Delegation update failed.');
      return;
    }
    setNotice('Signing authority delegation updated.');
    await loadWorkspace();
  };

  const handleIssueCert = async () => {
    const res = await fetch('/api/signatures/certificates', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectName: newCertSubject }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Certificate issuance failed.');
      return;
    }
    setNotice(`Issued institutional signing certificate ${json.data.serialNumber}.`);
    await loadWorkspace();
  };

  const handleRevokeCert = async (certId: string) => {
    const res = await fetch(`/api/signatures/certificates/${certId}/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Administrative rotation from Digital Signature Console' }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Certificate revocation failed.');
      return;
    }
    setNotice('Signing certificate revoked.');
    await loadWorkspace();
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Digital Signatures & Institutional Approvals"
        description={`Cryptographic multi-signer sequential & parallel routing, signature pad, and certificate registry for ${user.roleTitle}.`}
        breadcrumb="Digital Signatures"
        actions={
          <StaffButton onClick={() => setTab('create')}>
            <FilePlus2 size={15} /> New Signature Request
          </StaffButton>
        }
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={15} /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-800 dark:text-red-200 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <ShieldAlert size={15} /> {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
        {(
          [
            ['requests', `Signature Queue (${requests.length})`],
            ['create', 'Request Signatures'],
            ['verify', 'Verify Signature Code'],
            ['governance', 'Authorities & Certificates'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
              tab === key
                ? 'bg-[#102D50] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Create Request Tab */}
      {tab === 'create' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 max-w-3xl space-y-5">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <PenTool size={18} className="text-[#1769AA]" /> Route Document for Digital Signatures
          </h2>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Target Document
                <select
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {availableDocs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.referenceNumber ?? 'DRAFT'} — {d.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Routing Mode
                <select
                  value={workflowMode}
                  onChange={(e) =>
                    setWorkflowMode(e.target.value as 'SEQUENTIAL' | 'PARALLEL')
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="SEQUENTIAL">SEQUENTIAL (Ordered Step 1 → Step N)</option>
                  <option value="PARALLEL">PARALLEL (All Signers Simultaneously)</option>
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Add Ordered Signer(s)
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Choose staff signer"
                  value={pickerSignerId}
                  onChange={(e) => setPickerSignerId(e.target.value)}
                  className="flex-1 min-w-[220px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {staffDir.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} · {s.roleTitle} ({s.role})
                    </option>
                  ))}
                </select>
                <StaffButton
                  variant="secondary"
                  onClick={() => {
                    if (pickerSignerId && !orderedSigners.includes(pickerSignerId)) {
                      setOrderedSigners((prev) => [...prev, pickerSignerId]);
                    }
                  }}
                >
                  <Plus size={14} /> Add Signer
                </StaffButton>
              </div>

              {orderedSigners.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
                  {orderedSigners.map((sid, idx) => {
                    const person = staffDir.find((s) => s.id === sid);
                    return (
                      <div
                        key={sid}
                        className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
                      >
                        <span>
                          <strong className="font-mono text-[#1769AA] mr-2">
                            Step {idx + 1}
                          </strong>
                          {person?.fullName ?? sid} ({person?.roleTitle})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setOrderedSigners((prev) => prev.filter((id) => id !== sid))
                          }
                          className="text-red-600 hover:underline"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Instructions / Attestation Note
              <textarea
                rows={2}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Optional note pinned with signature request..."
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </label>

            <StaffButton type="submit">Send Signature Request</StaffButton>
          </form>
        </section>
      )}

      {/* Verify Code Tab */}
      {tab === 'verify' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 max-w-2xl space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <QrCode size={18} className="text-[#1769AA]" /> Verify Cryptographic Signature Code
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify any HI-TECH College digital signature code (e.g.{' '}
            <span className="font-mono">HCA-SIG-9A41C7E2</span>) to validate document SHA-256
            integrity and signer chain.
          </p>
          <form onSubmit={handleVerifyCode} className="flex flex-wrap gap-2">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="HCA-SIG-XXXXXXXX"
              className="flex-1 min-w-[220px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-mono"
            />
            <StaffButton type="submit">Verify Code</StaffButton>
          </form>

          {verifyData && (
            <div
              className={`rounded-xl border p-4 space-y-2.5 text-xs ${
                verifyData.verified
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                  : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm">
                  {verifyData.verified
                    ? 'Cryptographic Signature Record Verified'
                    : verifyData.message || 'Pending Signatures'}
                </span>
                <StaffStatusTag status={verifyData.status} />
              </div>
              {verifyData.documentTitle && (
                <div>
                  <strong>Document:</strong> {verifyData.documentTitle} (
                  {verifyData.documentReference}) · v{verifyData.versionNumber}
                </div>
              )}
              {verifyData.versionChecksumSha256 && (
                <div className="font-mono break-all text-[11px]">
                  SHA-256: {verifyData.versionChecksumSha256}
                </div>
              )}
              {verifyData.signatures && verifyData.signatures.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <strong>Recorded Signatures:</strong>
                  {verifyData.signatures.map((s) => (
                    <div key={s.signatureDigest} className="font-mono text-[11px]">
                      {s.signerName} ({s.signerTitle}) · {s.signatureType} · {s.signatureDigest}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Authorities & Certificates Tab */}
      {tab === 'governance' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#1769AA]" /> Institutional Signing Authorities
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {authorities.map((auth) => (
                <div key={auth.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[#102D50] dark:text-white">
                        {auth.staffName}
                      </div>
                      <div className="text-slate-500">
                        {auth.role} · Level: <strong>{auth.authorityLevel}</strong> · Scope:{' '}
                        {auth.maxCategoryScope}
                      </div>
                    </div>
                    <StaffStatusTag status={auth.active ? 'ACTIVE' : 'SUSPENDED'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">Delegated Acting Signer:</span>
                    <select
                      aria-label={`Delegate signing authority for ${auth.staffName}`}
                      value={auth.delegatedToStaffId ?? ''}
                      onChange={(e) => handleDelegateAuthority(auth.id, e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs"
                    >
                      <option value="">None (Direct Authority)</option>
                      {staffDir.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <KeyRound size={18} className="text-[#1769AA]" /> Signing Certificates (Root PKI)
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newCertSubject}
                onChange={(e) => setNewCertSubject(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
              <StaffButton onClick={handleIssueCert}>
                <Award size={14} /> Issue Certificate
              </StaffButton>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {certificates.map((cert) => (
                <div key={cert.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#1769AA]">
                      {cert.serialNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <StaffStatusTag status={cert.status} />
                      {cert.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeCert(cert.id)}
                          className="text-red-600 font-semibold hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {cert.subjectName}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 break-all">
                    SHA-256: {cert.fingerprintSha256}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Signature Queue & Inspector */}
      {tab === 'requests' && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr] items-start">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">
              Authorized Signing Requests
            </h2>
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Loading signature workflows...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No signature requests in your queue. Click &ldquo;New Signature Request&rdquo; to
                route a document.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left py-4 px-3 rounded-xl transition flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                      selectedId === r.id
                        ? 'bg-[#eef4fd] dark:bg-slate-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                          {r.verificationCode}
                        </span>
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold">
                          {r.signingMode}
                        </span>
                        {r.canSignNow && (
                          <span className="rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-bold">
                            ACTION REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm font-bold text-[#102D50] dark:text-white truncate">
                        {r.documentTitle}
                      </div>
                      <div className="text-xs text-slate-500">
                        Ref: {r.documentReference} · Signers:{' '}
                        {r.signers.filter((s) => s.status === 'SIGNED').length}/{r.signers.length}
                      </div>
                    </div>
                    <StaffStatusTag status={r.status} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            {!selectedRequest ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Select a signature request to view ordered signers, checksums, and audit logs.
              </div>
            ) : (
              <>
                <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#1769AA]">
                      {selectedRequest.verificationCode}
                    </span>
                    <StaffStatusTag status={selectedRequest.status} />
                  </div>
                  <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                    {selectedRequest.documentTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Requested by {selectedRequest.requestedByName} · Mode:{' '}
                    {selectedRequest.signingMode}
                  </p>
                  <p className="font-mono text-[11px] text-slate-400 break-all">
                    Version SHA-256: {selectedRequest.versionChecksumSha256}
                  </p>
                </div>

                {selectedRequest.canSignNow && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Your signature turn is active for this document.
                    </div>
                    <div className="flex gap-2">
                      <StaffButton
                        onClick={() => {
                          setDeclineMode(false);
                          setSigningTarget(selectedRequest);
                        }}
                      >
                        <PenTool size={14} /> Open Sign Pad
                      </StaffButton>
                      <StaffButton
                        variant="danger"
                        onClick={() => {
                          setDeclineMode(true);
                          setSigningTarget(selectedRequest);
                        }}
                      >
                        <XCircle size={14} /> Decline
                      </StaffButton>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div className="font-bold text-[#102D50] dark:text-white">
                    Assigned Signer Chain
                  </div>
                  {selectedRequest.signers.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Step {s.stepOrder}: {s.signerName}
                        </div>
                        <div className="text-slate-500">
                          {s.signerTitle} ({s.signerRole})
                        </div>
                        {s.declineReason && (
                          <div className="text-red-600 mt-0.5">Reason: {s.declineReason}</div>
                        )}
                      </div>
                      <StaffStatusTag status={s.status} />
                    </div>
                  ))}
                </div>

                {selectedRequest.records.length > 0 && (
                  <div className="space-y-2 text-xs border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div className="font-bold text-[#102D50] dark:text-white">
                      Applied Cryptographic Signatures
                    </div>
                    {selectedRequest.records.map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-1"
                      >
                        <div className="font-bold text-emerald-900 dark:text-emerald-200">
                          {rec.signerName} · {rec.signatureType}
                        </div>
                        <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          Digest: {rec.signatureDigest}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {auditEvents.length > 0 && (
                  <div className="space-y-2 text-xs border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div className="font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                      <History size={14} /> Signature Audit Trail
                    </div>
                    {auditEvents.map((ev) => (
                      <div key={ev.id} className="text-slate-600 dark:text-slate-300 py-1">
                        <span className="font-mono font-bold text-[#1769AA] mr-1.5">
                          [{ev.eventType}]
                        </span>
                        {ev.detail} — <strong>{ev.actorName}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* Interactive Sign / Decline Modal */}
      {signingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                  {declineMode ? 'Decline Signature Request' : 'Apply Institutional Digital Signature'}
                </h3>
                <p className="text-xs text-slate-500">
                  {signingTarget.documentTitle} ({signingTarget.verificationCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSigningTarget(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            {declineMode ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Mandatory Decline Reason
                  <textarea
                    rows={3}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Specify reason for rejecting signature..."
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <StaffButton variant="secondary" onClick={() => setSigningTarget(null)}>
                    Cancel
                  </StaffButton>
                  <StaffButton
                    variant="danger"
                    disabled={submittingSign || !declineReason.trim()}
                    onClick={handleExecuteSign}
                  >
                    {submittingSign ? 'Recording...' : 'Confirm Decline'}
                  </StaffButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSigMode('TYPED')}
                    className={`rounded-lg py-1.5 ${
                      sigMode === 'TYPED'
                        ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Typed Sign
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigMode('DRAWN')}
                    className={`rounded-lg py-1.5 ${
                      sigMode === 'DRAWN'
                        ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Draw Pad
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigMode('CERTIFICATE')}
                    className={`rounded-lg py-1.5 ${
                      sigMode === 'CERTIFICATE'
                        ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    PKI Cert
                  </button>
                </div>

                {sigMode === 'TYPED' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Legal Full Name Signature
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-base font-serif italic text-[#102D50] dark:text-white"
                      />
                    </label>
                  </div>
                )}

                {sigMode === 'DRAWN' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Draw signature below:
                      </span>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[#1769AA] font-semibold hover:underline"
                      >
                        Clear Pad
                      </button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={140}
                      onPointerDown={handleCanvasDown}
                      onPointerMove={handleCanvasMove}
                      onPointerUp={handleCanvasUp}
                      onPointerLeave={handleCanvasUp}
                      className="w-full h-36 rounded-xl border border-slate-300 dark:border-slate-700 bg-white touch-none cursor-crosshair"
                    />
                  </div>
                )}

                {sigMode === 'CERTIFICATE' && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3.5 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                    <div className="font-bold">Institutional Signing Certificate Attestation</div>
                    <div>
                      Signs using active college root certificate bound to{' '}
                      <span className="font-mono">{user.employeeNumber}</span> and document SHA-256
                      checksum.
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <StaffButton variant="secondary" onClick={() => setSigningTarget(null)}>
                    Cancel
                  </StaffButton>
                  <StaffButton disabled={submittingSign} onClick={handleExecuteSign}>
                    <CheckCircle2 size={14} />{' '}
                    {submittingSign ? 'Signing...' : 'Apply Cryptographic Signature'}
                  </StaffButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
