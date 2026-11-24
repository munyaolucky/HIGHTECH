import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Printer,
  Receipt,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collegeErpService, subscribeErpSync } from '../../services/collegeErpService';
import { studentPortalService } from '../../services/studentPortalService';
import { FeeTransaction, PortalRole } from '../../types';
import { useSyncedPortalTab } from '../../context/PortalShellContext';
import { useToast } from '../../shared/components/toast/useToast';
import FeeReceiptModal from '../../components/FeeReceiptModal';
import MpesaStkPromptModal from '../../components/MpesaStkPromptModal';
import type {
  FinanceAuditLogRecord,
  FinanceFeeStructureRecord,
  FinancePaymentPlanRecord,
  FinancePaymentRecord,
  FinanceRefundRequestRecord,
  MpesaTransactionRecord,
} from '../student/fees/fees.types';
import ModuleDocumentRepository from '../documents/ModuleDocumentRepository';

interface FinancePortalProps {
  onSwitchPortal?: (role: PortalRole) => void;
}

interface StaffFinanceDashboardPayload {
  metrics: {
    totalCollections: number;
    totalOutstanding: number;
    confirmedReceipts: number;
    pendingBankVerifications: number;
    pendingMpesaCallbacks: number;
    pendingPlans: number;
    pendingRefunds: number;
  };
  payments: FinancePaymentRecord[];
  mpesaTransactions: MpesaTransactionRecord[];
  feeStructures: FinanceFeeStructureRecord[];
  paymentPlans: FinancePaymentPlanRecord[];
  refundRequests: FinanceRefundRequestRecord[];
  auditLogs: FinanceAuditLogRecord[];
}

export default function FinancePortal({ onSwitchPortal }: FinancePortalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useSyncedPortalTab<
    | 'overview'
    | 'transactions'
    | 'reconciliation'
    | 'approvals'
    | 'feestructure'
    | 'stk_push'
    | 'finance_docs'
    | 'audit'
  >('finance', 'overview');

  const [transactions, setTransactions] = useState<FeeTransaction[]>(
    () => collegeErpService.getState().transactions
  );
  const [staffData, setStaffData] = useState<StaffFinanceDashboardPayload | null>(null);
  const [serverConnected, setServerConnected] = useState(false);
  const [loadingServer, setLoadingServer] = useState(false);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<FeeTransaction | null>(null);

  // STK Prompt Modal State
  const [isStkPromptOpen, setIsStkPromptOpen] = useState(false);

  // Manual Payment Desk State
  const [manualRegNo, setManualRegNo] = useState('HCA/STU/2026/001');
  const [manualAmount, setManualAmount] = useState('5000');
  const [manualMethod, setManualMethod] = useState<'BANK' | 'MPESA' | 'CASH' | 'SCHOLARSHIP'>('BANK');
  const [manualRef, setManualRef] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  // STK Push State
  const [stkPhone, setStkPhone] = useState('0712345678');
  const [stkAmount, setStkAmount] = useState('15000');
  const [stkStudentReg, setStkStudentReg] = useState('HCA/STU/2026/001');
  const [stkStudentName, setStkStudentName] = useState('Amina Wanjiku');
  const [stkState, setStkState] = useState<'IDLE' | 'PENDING' | 'CONFIRMED'>('IDLE');

  const loadStaffFinance = useCallback(async () => {
    if (typeof fetch !== 'function') return;
    setLoadingServer(true);
    try {
      const res = await fetch('/api/finance/dashboard', { credentials: 'include' });
      if (!res.ok) {
        setServerConnected(false);
        return;
      }
      const payload = (await res.json()) as {
        success?: boolean;
        data?: StaffFinanceDashboardPayload;
      };
      if (payload.success && payload.data) {
        setStaffData(payload.data);
        setServerConnected(true);
      }
    } catch {
      setServerConnected(false);
    } finally {
      setLoadingServer(false);
    }
  }, []);

  useEffect(() => {
    void loadStaffFinance();
    return subscribeErpSync(() => {
      setTransactions([...collegeErpService.getState().transactions]);
    });
  }, [loadStaffFinance]);

  const primaryStudentFin = studentPortalService.getFinancialSummary();

  const feeStructures = [
    { programme: 'BSc. Computer Science', tuition: 32000, lab: 7500, exam: 5500, total: 45000 },
    { programme: 'Diploma in Cyber Security', tuition: 26000, lab: 6500, exam: 5500, total: 38000 },
    { programme: 'Certificate in IT', tuition: 19000, lab: 4500, exam: 4500, total: 28000 },
    { programme: 'TVET CDACC Modular', tuition: 18000, lab: 4000, exam: 3000, total: 25000 },
  ];

  const handleOpenStkPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStkPromptOpen(true);
  };

  const handleConfirmMpesaPayment = (mpesaCode: string) => {
    setIsStkPromptOpen(false);
    setStkState('PENDING');

    const posted = collegeErpService.recordFeePayment({
      studentRegNo: stkStudentReg,
      studentName: stkStudentName,
      amount: Number(stkAmount),
      paymentMethod: 'M-PESA',
      phoneOrRef: `${mpesaCode} · ${stkPhone}`,
      description: `Tuition & Lab Fee Payment (M-Pesa STK Push · ${mpesaCode})`,
    });

    if (posted.ok && posted.transaction) {
      setTransactions([...collegeErpService.getState().transactions]);
      setStkState('CONFIRMED');
      setSelectedReceipt(posted.transaction);
      toast({
        type: 'success',
        title: 'M-Pesa Payment Confirmed',
        message: `Receipt ${posted.transaction.receiptNumber} issued for ${stkStudentReg}.`,
      });
      try {
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      } catch {
        // ignore headless env
      }
    } else {
      setStkState('IDLE');
      toast({ type: 'error', title: 'Payment Error', message: 'Could not record payment.' });
    }
  };

  const handleVerifyBankPayment = async (
    paymentId: string,
    decision: 'CONFIRM' | 'REJECT'
  ) => {
    try {
      const res = await fetch(`/api/finance/payments/${encodeURIComponent(paymentId)}/verify-bank`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes:
            decision === 'CONFIRM'
              ? 'Matched against KCB/Equity collection statement.'
              : 'Reference not found on collection bank statement.',
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Verification failed.');
      }
      toast({
        type: 'success',
        title: decision === 'CONFIRM' ? 'Bank Payment Confirmed' : 'Bank Payment Rejected',
        message: `Transaction ${paymentId} updated and audited.`,
      });
      await loadStaffFinance();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Bank Verification',
        message: err instanceof Error ? err.message : 'Unable to verify bank reference.',
      });
    }
  };

  const handleReviewPlan = async (planId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/finance/payment-plans/${encodeURIComponent(planId)}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Plan review failed.');
      }
      toast({
        type: 'success',
        title: 'Payment Plan Reviewed',
        message: `Plan ${planId} marked ${decision === 'APPROVE' ? 'ACTIVE' : 'REJECTED'}.`,
      });
      await loadStaffFinance();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Payment Plan Review',
        message: err instanceof Error ? err.message : 'Unable to update payment plan.',
      });
    }
  };

  const handleReviewRefund = async (
    refundId: string,
    decision: 'APPROVE' | 'REJECT' | 'DISBURSE'
  ) => {
    try {
      const res = await fetch(
        `/api/finance/refund-requests/${encodeURIComponent(refundId)}/review`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision }),
        }
      );
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Refund review failed.');
      }
      toast({
        type: 'success',
        title: 'Refund Updated',
        message: `Refund ${refundId} updated (${decision}).`,
      });
      await loadStaffFinance();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Refund Review',
        message: err instanceof Error ? err.message : 'Unable to review refund request.',
      });
    }
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualBusy(true);
    try {
      const res = await fetch('/api/finance/payments/manual', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentRegNo: manualRegNo,
          amount: Number(manualAmount),
          method: manualMethod,
          referenceNumber: manualRef,
          description: manualNotes || undefined,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to post manual fee settlement.');
      }
      setManualRef('');
      setManualNotes('');
      toast({
        type: 'success',
        title: 'Manual Payment Posted',
        message: `Credited KES ${Number(manualAmount).toLocaleString()} to ${manualRegNo}.`,
      });
      await loadStaffFinance();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Manual Posting Error',
        message: err instanceof Error ? err.message : 'Could not post manual payment.',
      });
    } finally {
      setManualBusy(false);
    }
  };

  const totalCollections =
    staffData?.metrics.totalCollections ??
    transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const pendingBankPayments = (staffData?.payments ?? []).filter(
    (p) => p.method === 'BANK' && p.status === 'PENDING'
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-[#092c60] text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard size={16} aria-hidden="true" />
            <span>MODULE 20 · FINANCE &amp; ACCOUNTS MANAGEMENT PORTAL</span>
          </div>
          <h1 className="text-2xl font-bold">HI-TECH College Finance &amp; Cash Office</h1>
          <p className="text-blue-100 text-xs mt-1">
            Fee billing structures, student financial ledgers, M-Pesa Daraja STK reconciliation &amp; official receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loadingServer}
            onClick={() => void loadStaffFinance()}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{loadingServer ? 'Syncing…' : serverConnected ? 'Server Synced' : 'Refresh'}</span>
          </button>
          {onSwitchPortal && (
            <>
              <button
                type="button"
                onClick={() => onSwitchPortal('student')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Student Fee View (Bal: KES {primaryStudentFin.balance.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => onSwitchPortal('registrar')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Registrar Portal
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('stk_push')}
            className="px-4 py-2 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <Smartphone size={16} aria-hidden="true" /> M-Pesa Daraja STK Simulator
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Collections</span>
            <strong className="text-xl font-bold font-mono tabular-nums text-slate-900 block mt-1">
              KES {totalCollections.toLocaleString()}.00
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <TrendingUp size={20} aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">M-Pesa Paybill</span>
            <strong className="text-xl font-mono font-bold text-blue-900 block mt-1">890123</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Smartphone size={20} aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Issued Receipts</span>
            <strong className="text-xl font-mono tabular-nums font-bold text-slate-900 block mt-1">
              {staffData?.metrics.confirmedReceipts ?? transactions.length} RCT
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Receipt size={20} aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Approvals</span>
            <strong className="text-sm font-bold text-emerald-700 block mt-1 font-mono tabular-nums">
              {(staffData?.metrics.pendingBankVerifications ?? 0) +
                (staffData?.metrics.pendingPlans ?? 0) +
                (staffData?.metrics.pendingRefunds ?? 0)}{' '}
              Queue Items
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {(
          [
            ['overview', 'Financial Overview & Budget', BarChart3],
            ['transactions', `Official Receipts (${transactions.length})`, Receipt],
            ['reconciliation', `Reconciliation (${pendingBankPayments.length})`, ShieldCheck],
            ['approvals', 'Plans & Refunds Approvals', CheckCircle2],
            ['feestructure', 'Fee Structures', CreditCard],
            ['stk_push', 'M-Pesa STK Simulator', Smartphone],
            ['finance_docs', 'Financial Documents', FileText],
            ['audit', 'Finance Audit Trail', ScrollText],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-3.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === key
                ? 'border-blue-600 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Monthly Collections vs Target (KES)
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span>September 2026 Collections</span>
                  <span className="font-mono tabular-nums text-blue-900">
                    KES 850,000 / KES 1,000,000 (85%)
                  </span>
                </div>
                <progress
                  value={85}
                  max={100}
                  aria-label="September collections 85 percent"
                  className="w-full h-2.5 rounded-lg overflow-hidden accent-blue-600 bg-slate-100"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span>October 2026 Collections</span>
                  <span className="font-mono tabular-nums text-blue-900">
                    KES 1,120,000 / KES 1,200,000 (93%)
                  </span>
                </div>
                <progress
                  value={93}
                  max={100}
                  aria-label="October collections 93 percent"
                  className="w-full h-2.5 rounded-lg overflow-hidden accent-emerald-600 bg-slate-100"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span>November 2026 (Active)</span>
                  <span className="font-mono tabular-nums text-blue-900">
                    KES 980,000 / KES 1,000,000 (98%)
                  </span>
                </div>
                <progress
                  value={98}
                  max={100}
                  aria-label="November collections 98 percent"
                  className="w-full h-2.5 rounded-lg overflow-hidden accent-purple-600 bg-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Collections by Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">
                  M-Pesa Daraja
                </span>
                <strong className="text-lg font-bold font-mono tabular-nums text-emerald-950 block mt-1">
                  74.2%
                </strong>
                <span className="text-[11px] text-emerald-700">STK Push &amp; Paybill 890123</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-800">
                  Direct Bank Transfer
                </span>
                <strong className="text-lg font-bold font-mono tabular-nums text-blue-950 block mt-1">
                  21.8%
                </strong>
                <span className="text-[11px] text-blue-700">Equity &amp; KCB Collection Accts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTIONS REGISTER TAB */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              Official Fee Payment Receipts Register
            </h3>
            <span className="text-xs text-slate-500 font-mono">Format: RCT-2026-xxxx</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Receipt No</th>
                  <th className="p-4">Student Reg No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Channel &amp; Ref</th>
                  <th className="p-4">Date &amp; Time</th>
                  <th className="p-4">Amount (KES)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-blue-900">{tx.receiptNumber}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">{tx.studentRegNo}</td>
                    <td className="p-4 font-bold text-slate-900">{tx.studentName}</td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{tx.paymentMethod}</span>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {tx.referenceNumber}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono tabular-nums font-bold text-slate-900">
                      KES {tx.amount.toLocaleString()}.00
                    </td>
                    <td className="p-4 font-bold text-emerald-800">{tx.status}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(tx)}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1 transition"
                      >
                        <Eye size={13} aria-hidden="true" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BANK & M-PESA RECONCILIATION TAB */}
      {activeTab === 'reconciliation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Pending Bank Slips &amp; M-Pesa Callbacks
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {pendingBankPayments.length} pending bank verification(s)
              </span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {pendingBankPayments.length === 0 ? (
                <p className="p-6 text-slate-500 text-center">
                  All submitted bank deposit slips are reconciled.
                </p>
              ) : (
                pendingBankPayments.map((p) => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <strong className="font-mono text-[#092c60] block">
                        {p.referenceNumber} · KES {p.amount.toLocaleString()}
                      </strong>
                      <p className="text-slate-700">
                        {p.studentName} ({p.studentRegNo}) · {p.channelLabel}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleVerifyBankPayment(p.id, 'CONFIRM')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                      >
                        Verify &amp; Issue Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleVerifyBankPayment(p.id, 'REJECT')}
                        className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 font-semibold rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form
            onSubmit={handleRecordManualPayment}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900">Post Cash / EFT / HELB Settlement</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Reg No</label>
              <input
                type="text"
                required
                value={manualRegNo}
                onChange={(e) => setManualRegNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Channel</label>
                <select
                  value={manualMethod}
                  onChange={(e) =>
                    setManualMethod(e.target.value as 'BANK' | 'MPESA' | 'CASH' | 'SCHOLARSHIP')
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="BANK">BANK EFT</option>
                  <option value="MPESA">M-PESA</option>
                  <option value="CASH">CASH DESK</option>
                  <option value="SCHOLARSHIP">HELB / BURSARY</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  min={50}
                  required
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference Number</label>
              <input
                type="text"
                required
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="e.g. HELB-2026-8812"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Optional cashier verification remark"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={manualBusy || !serverConnected}
              className="w-full py-2.5 bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white font-bold rounded-lg"
            >
              {manualBusy ? 'Posting Ledger Entry…' : 'Post & Issue Official Receipt'}
            </button>
          </form>
        </div>
      )}

      {/* PAYMENT PLANS & REFUNDS APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Student Payment Plan Queue</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(staffData?.paymentPlans ?? []).map((plan) => (
                <div key={plan.id} className="p-4 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-[#092c60]">
                      {plan.id} · {plan.studentName}
                    </span>
                    <span>{plan.status}</span>
                  </div>
                  <p className="text-slate-600">
                    Covered Balance: KES {plan.totalCoveredAmount.toLocaleString()} ·{' '}
                    {plan.instalments.length} instalments
                  </p>
                  {plan.status === 'PENDING_APPROVAL' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleReviewPlan(plan.id, 'APPROVE')}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg"
                      >
                        Approve Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReviewPlan(plan.id, 'REJECT')}
                        className="px-3 py-1.5 border border-red-300 text-red-700 font-semibold rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Refund Requests Queue</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(staffData?.refundRequests ?? []).map((req) => (
                <div key={req.id} className="p-4 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-[#092c60]">
                      {req.id} · {req.studentName} (KES {req.amount.toLocaleString()})
                    </span>
                    <span>{req.status}</span>
                  </div>
                  <p className="text-slate-600">{req.reason}</p>
                  <div className="flex gap-2">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleReviewRefund(req.id, 'APPROVE')}
                          className="px-3 py-1.5 bg-[#092c60] text-white font-semibold rounded-lg"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReviewRefund(req.id, 'REJECT')}
                          className="px-3 py-1.5 border border-red-300 text-red-700 font-semibold rounded-lg"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => void handleReviewRefund(req.id, 'DISBURSE')}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg"
                      >
                        Mark Disbursed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FEE STRUCTURE TAB */}
      {activeTab === 'feestructure' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Approved 2026 Programme Fee Structures
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Academic Programme</th>
                  <th className="p-4">Tuition (KES)</th>
                  <th className="p-4">Laboratory / ICT</th>
                  <th className="p-4">Examination &amp; Library</th>
                  <th className="p-4 font-bold">Total Semester Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {feeStructures.map((f) => (
                  <tr key={f.programme} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{f.programme}</td>
                    <td className="p-4 font-mono tabular-nums text-slate-700">
                      KES {f.tuition.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono tabular-nums text-slate-700">
                      KES {f.lab.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono tabular-nums text-slate-700">
                      KES {f.exam.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono tabular-nums font-bold text-blue-900">
                      KES {f.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* M-PESA STK SIMULATOR TAB */}
      {activeTab === 'stk_push' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone size={20} className="text-emerald-600" aria-hidden="true" />
              Safaricom Daraja STK Push Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Initiates instantaneous prompt to payer and posts double-entry receipt record.
            </p>
          </div>

          <form onSubmit={handleOpenStkPrompt} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Student Registration Number
              </label>
              <input
                type="text"
                value={stkStudentReg}
                onChange={(e) => setStkStudentReg(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Student Full Name
              </label>
              <input
                type="text"
                value={stkStudentName}
                onChange={(e) => setStkStudentName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payer Mobile Number (254...)
              </label>
              <input
                type="text"
                value={stkPhone}
                onChange={(e) => setStkPhone(e.target.value)}
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Amount to Pay (KES)
              </label>
              <input
                type="number"
                value={stkAmount}
                onChange={(e) => setStkAmount(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={stkState === 'PENDING'}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <Smartphone size={16} aria-hidden="true" />
              {stkState === 'PENDING'
                ? 'Processing Daraja Callback...'
                : 'Dispatch STK Push & Generate Official Receipt'}
            </button>
          </form>

          {stkState === 'CONFIRMED' && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-2 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 size={16} aria-hidden="true" /> M-Pesa STK Push Completed!
              </div>
              <p>
                Amount KES {Number(stkAmount).toLocaleString()} credited to student {stkStudentReg}.
              </p>
              <p className="font-mono text-[11px] text-emerald-700">
                Receipt generated and ledger reconciled.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const latest = transactions[0];
                    if (latest) setSelectedReceipt(latest);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <Printer size={13} aria-hidden="true" /> View &amp; Print Official Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUDIT TRAIL TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Immutable Finance Audit Trail
            </h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {(staffData?.auditLogs ?? []).length === 0 ? (
              <p className="p-6 text-center text-slate-500">
                Sign in with Finance Officer credentials to inspect live server audit logs.
              </p>
            ) : (
              (staffData?.auditLogs ?? []).map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className="font-mono text-[#092c60]">{log.action}</strong>
                    <p className="text-slate-700 mt-0.5">{log.detail}</p>
                    <span className="text-slate-500">
                      Actor: {log.actorName} ({log.actorRole})
                      {log.studentRegNo ? ` · ${log.studentRegNo}` : ''}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FINANCIAL DOCUMENTS DMS TAB */}
      {activeTab === 'finance_docs' && (
        <ModuleDocumentRepository
          moduleKey="FINANCE"
          defaultRecipient="Finance & Cash Office"
          title="Financial Documents, Bank Slips & Bursary Evidence (Central DMS)"
          description="Audited Finance repository for bank deposit slips, M-Pesa confirmation evidence, fee statements, bursary letters, and refund support files."
        />
      )}

      {/* SAFARICOM M-PESA STK PHONE PROMPT MODAL */}
      <MpesaStkPromptModal
        isOpen={isStkPromptOpen}
        phone={stkPhone}
        amount={Number(stkAmount) || 0}
        accountReference={stkStudentReg}
        onConfirm={handleConfirmMpesaPayment}
        onCancel={() => setIsStkPromptOpen(false)}
      />

      {/* OFFICIAL FEE RECEIPT MODAL */}
      <FeeReceiptModal transaction={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
