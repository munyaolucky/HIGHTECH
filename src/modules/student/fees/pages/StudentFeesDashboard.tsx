import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import type { StudentPortalSection } from '../../../../services/studentPortalService';
import { formatKes, studentFeesApi } from '../feesApi';
import type { StudentFeesOverviewDto } from '../fees.types';

export interface StudentFeesPageProps {
  onNavigate?: (section: StudentPortalSection) => void;
  onNotify?: (type: 'ok' | 'err', message: string) => void;
  onRefresh?: () => void;
}

export default function StudentFeesDashboard({
  onNavigate,
  onNotify,
}: StudentFeesPageProps) {
  const [overview, setOverview] = useState<StudentFeesOverviewDto>(() =>
    studentFeesApi.getSyncOverview()
  );
  const [loading, setLoading] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const next = await studentFeesApi.getOverview();
      setOverview(next);
    } catch (err) {
      onNotify?.(
        'err',
        err instanceof Error ? err.message : 'Unable to refresh student fee ledger.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const summaryCards = [
    {
      label: 'Total fees',
      value: formatKes(overview.totalFees),
      detail: overview.account.termLabel,
      toneClass: 'text-[#092c60] dark:text-blue-300',
      borderClass: 'border-t-[#092c60]',
    },
    {
      label: 'Total paid',
      value: formatKes(overview.totalPaid),
      detail: `${overview.progressPercent}% settled`,
      toneClass: 'text-emerald-700 dark:text-emerald-400',
      borderClass: 'border-t-emerald-600',
    },
    {
      label: 'Outstanding balance',
      value: formatKes(overview.outstandingBalance),
      detail:
        overview.outstandingBalance === 0
          ? 'Settled in full'
          : `Clearance: ${overview.clearanceStatus}`,
      toneClass:
        overview.outstandingBalance === 0
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-amber-700 dark:text-amber-400',
      borderClass: 'border-t-amber-600',
    },
    {
      label: 'Next instalment',
      value: formatKes(overview.nextInstalment),
      detail:
        overview.nextInstalment === 0
          ? 'No pending instalment'
          : `Due ${overview.nextInstalmentDueDate}`,
      toneClass: 'text-[#1769AA] dark:text-blue-400',
      borderClass: 'border-t-[#1769AA]',
    },
  ];

  return (
    <main className="space-y-6">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Student Finance
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Fees &amp; Payments
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {overview.account.academicYear} · {overview.account.programme} ·{' '}
            <span className="font-mono font-semibold">{overview.account.studentRegNo}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadOverview()}
            className="min-h-[40px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{loading ? 'Refreshing…' : 'Refresh Ledger'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('fees-pay')}
            className="min-h-[40px] px-4 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <CreditCard size={14} aria-hidden="true" />
            <span>+ Pay fees</span>
          </button>
        </div>
      </header>

      {/* Summary Metric Cards */}
      <section aria-label="Fee balance summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 ${card.borderClass} rounded-2xl p-5 space-y-1.5`}
          >
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block">
              {card.label}
            </span>
            <strong
              className={`block text-2xl font-bold font-mono tabular-nums ${card.toneClass}`}
            >
              {card.value}
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {card.detail}
            </span>
          </article>
        ))}
      </section>

      {/* Fee Payment Progress & Quick Finance Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Fee Payment Progress
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {formatKes(overview.totalPaid)} paid out of {formatKes(overview.totalFees)}
              </p>
            </div>
            <strong className="text-xl font-bold font-mono tabular-nums text-[#092c60] dark:text-blue-300">
              {overview.progressPercent}%
            </strong>
          </div>

          <progress
            value={overview.progressPercent}
            max={100}
            aria-label={`Fee payment progress ${overview.progressPercent} percent`}
            className="w-full h-3 rounded-lg overflow-hidden accent-emerald-600 bg-slate-200 dark:bg-slate-800"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.('fees-pay')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-[#1769AA] text-left transition-colors flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Smartphone size={15} className="text-emerald-600" aria-hidden="true" />
                  <span>Pay via M-Pesa</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Pay fees instantly using Safaricom STK Push (Paybill 890123).
                </p>
              </div>
              <ArrowUpRight size={15} className="text-slate-400 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('fees-statement')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-[#1769AA] text-left transition-colors flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <FileText size={15} className="text-[#1769AA]" aria-hidden="true" />
                  <span>Statement</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  View itemized charges, credits, and export certified statement.
                </p>
              </div>
              <ArrowUpRight size={15} className="text-slate-400 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('fees-plans')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-[#1769AA] text-left transition-colors flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <CalendarClock size={15} className="text-[#092c60] dark:text-blue-300" aria-hidden="true" />
                  <span>Payment Plans</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Track instalment due dates or request a term schedule.
                </p>
              </div>
              <ArrowUpRight size={15} className="text-slate-400 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('fees-clearance')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-[#1769AA] text-left transition-colors flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <ShieldCheck size={15} className="text-emerald-700" aria-hidden="true" />
                  <span>Financial Clearance</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Status: {overview.clearanceStatus} — verify CAT &amp; exam permit eligibility.
                </p>
              </div>
              <ArrowUpRight size={15} className="text-slate-400 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Account Summary & Sponsorship Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wallet size={16} className="text-[#1769AA]" aria-hidden="true" />
            <span>Account Standing &amp; Funding</span>
          </h2>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Student Name</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100 text-right">
                {overview.account.studentName}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Registration Number</dt>
              <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-right">
                {overview.account.studentRegNo}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Sponsorship / Funding</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100 text-right">
                {overview.account.sponsorshipStatus}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Exam Clearance Standing</dt>
              <dd className="font-semibold text-emerald-700 dark:text-emerald-400 text-right inline-flex items-center gap-1">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>{overview.clearanceStatus}</span>
              </dd>
            </div>
          </dl>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.('fees-receipts')}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Receipt size={13} aria-hidden="true" />
              <span>View Receipts</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('fees-structure')}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Fee Structure
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('fees-refunds')}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Refund Requests
            </button>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified fee settlements and pending payment submissions
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('fees-history')}
            className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
          >
            View full payment history
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Transaction ID</th>
                <th className="py-3 px-4 font-semibold">Date &amp; Channel</th>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {overview.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                    No fee transactions recorded for this semester yet.
                  </td>
                </tr>
              ) : (
                overview.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {tx.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        Fee payment · {tx.method}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(tx.paidAt || tx.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {tx.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      + {formatKes(tx.amount)}
                    </td>
                    <td className="py-3 px-4 font-semibold whitespace-nowrap">
                      <span
                        className={
                          tx.status === 'CONFIRMED'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : tx.status === 'PENDING'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                        }
                      >
                        {tx.status === 'CONFIRMED' ? 'Confirmed' : tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {tx.receiptNumber ? (
                        <button
                          type="button"
                          onClick={() => onNavigate?.('fees-receipts')}
                          className="font-mono font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                        >
                          {tx.receiptNumber}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
