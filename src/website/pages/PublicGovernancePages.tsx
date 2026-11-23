import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Cookie,
  FileText,
  Home as HomeIcon,
  Loader2,
  Lock,
  QrCode,
  Scale,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { COLLEGE_INFO, COURSES_CATALOGUE } from '../../data/college';
import { campusServicesService } from '../../services/campusServicesService';
import {
  CONSENT_VERSION,
  STORAGE_INVENTORY,
  getConsentRecord,
  withdrawOptionalConsent,
} from '../../lib/consent';

interface PublicGovernancePagesProps {
  page:
    | 'verify'
    | 'privacy-policy'
    | 'cookie-policy'
    | 'terms'
    | 'accessibility'
    | 'fees'
    | 'sitemap'
    | 'not-found';
  onNavigate: (page: string) => void;
  onOpenPortalModal: () => void;
  onOpenCookieSettings?: () => void;
  onSwitchToERP?: (role: string) => void;
}

interface VerifyState {
  found: boolean;
  code: string;
  kind?: string;
  title?: string;
  holder?: string;
  status?: string;
  detail?: string;
  meta?: string;
}

export default function PublicGovernancePages({
  page,
  onNavigate,
  onOpenPortalModal,
  onOpenCookieSettings,
  onSwitchToERP,
}: PublicGovernancePagesProps) {
  const [verifyCode, setVerifyCode] = useState('HCA-SIG-9A41C7E2');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyState | null>(null);
  const [liveProgrammes, setLiveProgrammes] = useState<
    Array<{
      code: string;
      title: string;
      level: string;
      examBody: string;
      tuitionPerSemesterKes: number;
    }>
  >([]);

  const handleVerify = useCallback(async (raw: string) => {
    const clean = raw.trim();
    if (!clean) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/platform/verify/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data?.verified) {
          const kindLabel =
            data.sourceType === 'DIGITAL_SIGNATURE'
              ? 'Signed Institutional Record'
              : data.sourceType === 'STUDENT_REGISTRATION'
              ? 'Privacy-Minimized Student Enrolment'
              : 'Issued College Document';
          setVerifyResult({
            found: true,
            code: data.code || clean,
            kind: kindLabel,
            title: data.title || 'Verified Institutional Record',
            holder: data.holderMasked || 'Verified Holder',
            status: data.status || 'VERIFIED',
            detail: data.reference ? `${kindLabel} · ${data.reference}` : kindLabel,
            meta: `Code: ${data.code || clean} · Issued: ${
              String(data.issuedAt || '').slice(0, 10) || 'Verified'
            } · Cloud SQL Registry`,
          });
          return;
        }
      }
    } catch {
      // Fallback cleanly
    } finally {
      setVerifying(false);
    }

    const localMatch = campusServicesService.verifyPublicCredential(clean);
    if (localMatch.found) {
      setVerifyResult({
        found: true,
        code: localMatch.verificationCode || clean,
        kind: localMatch.awardType || 'Credential',
        title: localMatch.programme,
        holder: localMatch.maskedHolderName,
        status: localMatch.status,
        detail: `Award: ${localMatch.awardType} · Issued: ${localMatch.issueDate}`,
        meta: `Verification Count: ${localMatch.verificationCount}`,
      });
    } else {
      setVerifyResult({ found: false, code: clean });
    }
  }, []);

  useEffect(() => {
    if (page === 'verify') {
      const q = new URLSearchParams(window.location.search).get('code');
      if (q) {
        setVerifyCode(q);
        void handleVerify(q);
      }
    }
    if (page === 'fees') {
      fetch('/api/platform/academic-structure')
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && Array.isArray(json?.data?.programmes)) {
            setLiveProgrammes(json.data.programmes);
          }
        })
        .catch(() => {});
    }
  }, [page, handleVerify]);

  if (page === 'verify') {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="rounded-2xl bg-[#102D50] text-white p-6 sm:p-8 shadow-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F5EBDD]">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>OFFICIAL PUBLIC VERIFICATION PORTAL (/verify)</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
            Verify HI-TECH Certificates, Signatures &amp; Student Status
          </h1>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            Employers, licensing bodies, and guardians can validate issued institutional documents,
            digital signatures, and active student registration numbers without exposing confidential
            grades or personal contact data.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Enter Signature ID (HCA-SIG-...), Student Reg (HCA/STU/...), or Credential Code"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono uppercase focus:border-[#1769AA] outline-none"
            />
            <button
              type="button"
              disabled={verifying}
              onClick={() => void handleVerify(verifyCode)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] hover:bg-[#102D50] px-6 py-2.5 text-sm font-extrabold text-white transition disabled:opacity-60"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify Record</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">Quick lookup samples:</span>
            {['HCA-SIG-9A41C7E2', 'HCA/STU/2026/001', 'HTC-2026-8419-Y7'].map(
              (sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setVerifyCode(sample);
                    void handleVerify(sample);
                  }}
                  className="rounded-lg border border-slate-200 bg-[#F4F7FB] px-2.5 py-1 font-mono text-[11px] font-bold text-[#102D50] hover:border-[#1769AA]"
                >
                  {sample}
                </button>
              )
            )}
          </div>

          {verifyResult && (
            <div
              className={`rounded-xl border p-5 space-y-2 ${
                verifyResult.found
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {verifyResult.found ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-black text-base">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      <span>{verifyResult.holder}</span>
                    </div>
                    <span className="rounded-full bg-emerald-700 px-3 py-0.5 text-[11px] font-black text-white">
                      {verifyResult.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold">{verifyResult.title}</div>
                  <div className="text-xs text-emerald-900">
                    {verifyResult.kind} · {verifyResult.detail}
                  </div>
                  <div className="text-xs font-semibold text-emerald-800">{verifyResult.meta}</div>
                </>
              ) : (
                <div className="text-sm font-bold">
                  No active or historical institutional record matched code &ldquo;{verifyResult.code}&rdquo;.
                  Confirm the exact code printed on the official transcript or certificate QR code.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (page === 'fees') {
    const rows =
      liveProgrammes.length > 0
        ? liveProgrammes
        : COURSES_CATALOGUE.slice(0, 8).map((c) => ({
            code: c.code,
            title: c.title,
            level: c.level,
            examBody: c.examiningBody,
            tuitionPerSemesterKes: c.tuitionPerTerm || 28500,
          }));

    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="rounded-2xl bg-[#102D50] text-white p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F5EBDD]">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>OFFICIAL TUITION &amp; PAYMENT GUIDE</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
              HI-TECH College Fee Structure
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Transparent semester tuition schedule &amp; official M-Pesa / Bank payment channels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('apply')}
            className="rounded-xl bg-[#B83232] hover:bg-[#992626] px-5 py-2.5 text-sm font-extrabold text-white transition shrink-0"
          >
            Apply Online
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-[11px] font-black uppercase text-[#102D50] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Programme Title</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Exam Body</th>
                  <th className="px-4 py-3 text-right">Tuition / Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.code} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#1769AA]">{r.code}</td>
                    <td className="px-4 py-3 font-bold text-[#102D50]">{r.title}</td>
                    <td className="px-4 py-3 text-slate-600">{r.level}</td>
                    <td className="px-4 py-3 text-slate-600">{r.examBody}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-[#102D50]">
                      KES {Number(r.tuitionPerSemesterKes || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-[#F5EBDD] p-5 text-xs text-[#102D50] space-y-1.5">
          <div className="font-black text-sm">Official Fee Payment Channels (Zero Cash Policy)</div>
          <p>
            All tuition payments must be settled via M-Pesa Paybill (Account: Student Registration
            Number e.g. <span className="font-mono font-bold">HCA/STU/2026/0001</span>) or official
            bank deposit verified through the Student Portal Finance Ledger.
          </p>
        </div>
      </section>
    );
  }

  if (page === 'cookie-policy') {
    const activeConsent = getConsentRecord();
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="rounded-2xl bg-[#102D50] text-white p-6 sm:p-8 shadow-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F5EBDD]">
            <Cookie className="w-4 h-4 text-amber-400" />
            <span>COOKIE &amp; BROWSER STORAGE POLICY · VERSION {CONSENT_VERSION}</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
            HI-TECH College Cookie &amp; Tracking Governance Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
            Strict consent-before-execution enforcement for optional functional, analytics, and
            outreach scripts in compliance with the Kenya Data Protection Act, 2019 (ODPC).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-[#F4F7FB] p-4 space-y-1">
              <div className="font-extrabold text-[#102D50]">Policy Version &amp; Expiry</div>
              <p className="text-slate-600">
                Current version: <span className="font-mono font-bold text-[#102D50]">{CONSENT_VERSION}</span>. Consent records remain valid for 12 months or until policy version updates require re-confirmation.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F4F7FB] p-4 space-y-1">
              <div className="font-extrabold text-[#102D50]">Current Browser Status</div>
              <p className="text-slate-600">
                {activeConsent
                  ? `Necessary: On · Functional: ${activeConsent.functional ? 'On' : 'Blocked'} · Analytics: ${activeConsent.analytics ? 'On' : 'Blocked'} · Marketing: ${activeConsent.marketing ? 'On' : 'Blocked'}`
                  : 'No optional cookies approved — all optional scripts & preference keys are currently blocked.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F7FB] text-[11px] font-black uppercase text-[#102D50] border-b border-slate-200">
                  <th className="px-4 py-3">Key / Cookie</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {STORAGE_INVENTORY.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#102D50]">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.kind}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.category === 'strictly_necessary'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.category === 'strictly_necessary' ? 'Strictly Necessary' : 'Functional'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.purpose}</td>
                    <td className="px-4 py-3 text-slate-500">{item.lifetime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onOpenCookieSettings && (
              <button
                type="button"
                onClick={onOpenCookieSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-4 py-2.5 text-xs font-extrabold text-white transition"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Manage Cookie Preferences</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                withdrawOptionalConsent();
                onOpenCookieSettings?.();
              }}
              className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 text-xs font-extrabold text-[#B83232] transition"
            >
              Withdraw All Optional Consent
            </button>
            <button
              type="button"
              onClick={() => onNavigate('privacy-policy')}
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-[#102D50] transition"
            >
              Read Privacy Policy
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (page === 'sitemap') {
    const groups = [
      {
        title: 'Public College Website',
        links: [
          { label: 'Home', target: 'home' },
          { label: 'About HI-TECH College', target: 'about' },
          { label: 'Academic Departments', target: 'departments' },
          { label: 'Our Staff & Faculty Directory', target: 'our-staff' },
          { label: 'Academic Programmes', target: 'academics' },
          { label: 'Campus & Facilities', target: 'campus' },
          { label: 'Student Life & Welfare', target: 'student-life' },
          { label: 'News, Events & Circulars', target: 'news' },
          { label: 'Resources & Prospectus', target: 'resources' },
          { label: 'Contact & Directions', target: 'contact' },
        ],
      },
      {
        title: 'Admissions & Portals',
        links: [
          { label: 'Admissions Information', target: 'admissions' },
          { label: 'Online Course Application', target: 'apply' },
          { label: 'Fee Structure & Payment Guide', target: 'fees' },
          { label: 'How to Access Student Portal', target: 'portal-guide' },
          { label: 'Verify Certificate / Signature (/verify)', target: 'verify' },
        ],
      },
      {
        title: 'Governance & Compliance',
        links: [
          { label: 'Privacy Policy (ODPC 2019)', target: 'privacy-policy' },
          { label: 'Cookie & Storage Policy', target: 'cookie-policy' },
          { label: 'Terms & Academic Regulations', target: 'terms' },
          { label: 'Accessibility Statement', target: 'accessibility' },
        ],
      },
    ];

    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="rounded-2xl bg-[#102D50] text-white p-6 sm:p-8 shadow-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F5EBDD]">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>INSTITUTIONAL WEBSITE SITEMAP</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">
            HI-TECH College Navigation &amp; Sitemap
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            Direct index of public website pages, admissions guides, governance disclosures, and authenticated portals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groups.map((grp) => (
            <div key={grp.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-[#102D50] border-b border-slate-100 pb-2">
                {grp.title}
              </h2>
              <ul className="space-y-2 text-xs">
                {grp.links.map((item) => (
                  <li key={item.target}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.target)}
                      className="text-[#1769AA] hover:text-[#102D50] hover:underline font-semibold text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <strong className="text-[#102D50]">Authenticated Campus Portals:</strong> Student Portal, Staff Workspace, Registrar, Finance, Library &amp; Examinations.
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSwitchToERP?.('student-login')}
              className="rounded-xl bg-[#1769AA] hover:bg-[#102D50] px-4 py-2 text-xs font-extrabold text-white transition"
            >
              Student Portal Login
            </button>
            <button
              type="button"
              onClick={() => onSwitchToERP?.('portal-login')}
              className="rounded-xl bg-[#102D50] hover:bg-[#B83232] px-4 py-2 text-xs font-extrabold text-white transition"
            >
              Staff &amp; Unified Portal Login
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (page === 'not-found') {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5EBDD] text-[#B83232]">
            <SearchX className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-[#B83232]">
              HTTP 404 · Page Not Found
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#102D50] tracking-tight">
              We could not locate that HI-TECH College page
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              The requested URL may have moved or been typed incorrectly. Use the links below or inspect the full college sitemap to continue.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-5 py-2.5 text-xs font-extrabold text-white transition"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Return to Home</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sitemap')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-extrabold text-[#102D50] transition"
            >
              <Compass className="w-4 h-4 text-[#1769AA]" />
              <span>View Sitemap</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchToERP?.('student-login')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#1769AA] bg-blue-50 hover:bg-blue-100 px-5 py-2.5 text-xs font-extrabold text-[#102D50] transition"
            >
              <span>Student Portal Login</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const contentMap: Record<
    'privacy-policy' | 'terms' | 'accessibility',
    { title: string; badge: string; icon: React.ReactNode; sections: Array<{ heading: string; body: string }> }
  > = {
    'privacy-policy': {
      title: 'Privacy Policy & Kenya Data Protection Notice',
      badge: 'KENYA DATA PROTECTION ACT, 2019 (ODPC COMPLIANT)',
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      sections: [
        {
          heading: '1. Data Controller & Institutional Purpose',
          body: `${COLLEGE_INFO.name} (${COLLEGE_INFO.registrationNumber}) processes student, parent, staff, and applicant personal data strictly for academic admissions, instruction, statutory TVETA/KNEC/CDACC/KASNEB exam registration, tuition accounting, and campus safety.`,
        },
        {
          heading: '2. Role-Based Access & Sensitive Record Isolation',
          body: 'Having a staff or administrative dashboard does not grant access to every college record. Confidential student counselling notes, medical declarations, and private HR files are strictly segregated by role permissions and never displayed to unauthorized administrators.',
        },
        {
          heading: '3. Public Verification Privacy Minimization',
          body: 'Public verification via /verify discloses only masked holder identifiers, programme/document validity, and status. Full transcripts, national IDs, phone numbers, and fee balances are never publicly exposed.',
        },
        {
          heading: '4. Your Data Subject Rights',
          body: `Data subjects may request correction or lawful access review through the Registrar or Data Protection Desk at ${COLLEGE_INFO.contacts.email}.`,
        },
      ],
    },
    terms: {
      title: 'Portal Terms & Academic Regulations',
      badge: 'INSTITUTIONAL GOVERNANCE & CODE OF CONDUCT',
      icon: <Scale className="w-5 h-5 text-amber-400" />,
      sections: [
        {
          heading: '1. Authorized Account Usage',
          body: 'Portal credentials (Student, Parent, Lecturer, Staff, and Admin) are issued via staff-managed registration and secure activation tokens. Account sharing or credential impersonation is prohibited and logged in security audit trails.',
        },
        {
          heading: '2. Academic Integrity & Examination Security',
          body: 'All Computer-Based Tests (CBT), assignments, and project submissions are governed by college examination integrity policies, time-window validation, and institutional moderation before final Senate release.',
        },
        {
          heading: '3. Official Financial & Document Validity',
          body: 'Only fee receipts reconciled in the official Finance Ledger and transcripts bearing verifiable QR/signature codes constitute valid institutional records.',
        },
      ],
    },
    accessibility: {
      title: 'Digital Accessibility Statement',
      badge: 'WCAG 2.1 AA TARGET COMPLIANCE',
      icon: <CheckCircle2 className="w-5 h-5 text-amber-400" />,
      sections: [
        {
          heading: '1. Inclusive Academic Access',
          body: 'HI-TECH College designs its public website, student portal, and staff workspaces for keyboard navigation, high-contrast typography, responsive desktop/tablet/mobile layouts, and screen-reader semantic landmarks.',
        },
        {
          heading: '2. Examination & Learning Accommodations',
          body: 'Students requiring extra examination time or assistive accommodations should register needs with the Student Affairs & Academic Registry office ahead of scheduled assessments.',
        },
      ],
    },
  };

  const doc = contentMap[page];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="rounded-2xl bg-[#102D50] text-white p-6 sm:p-8 shadow-lg">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F5EBDD]">
          {doc.icon}
          <span>{doc.badge}</span>
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">{doc.title}</h1>
        <p className="mt-2 text-xs text-blue-100">
          {COLLEGE_INFO.name} · Official Regulatory &amp; Digital Governance Disclosure
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        {doc.sections.map((sec) => (
          <div key={sec.heading} className="space-y-1.5 border-b border-slate-100 pb-4 last:border-none last:pb-0">
            <h2 className="text-sm font-black text-[#102D50] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1769AA]" />
              <span>{sec.heading}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{sec.body}</p>
          </div>
        ))}

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('verify')}
            className="rounded-xl bg-[#1769AA] hover:bg-[#102D50] px-4 py-2 text-xs font-bold text-white transition"
          >
            Public Verification (/verify)
          </button>
          <button
            type="button"
            onClick={onOpenPortalModal}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-[#102D50] transition"
          >
            Portal Sign-In
          </button>
        </div>
      </div>
    </section>
  );
}
