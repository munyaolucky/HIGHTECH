import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatKes, studentFeesApi } from '../feesApi';
import type { FinancialClearanceSummaryDto } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function FinancialClearancePage({ onNavigate, onNotify }: StudentFeesPageProps) {
  const [clearance, setClearance] = useState<FinancialClearanceSummaryDto>(() =>
    studentFeesApi.getSyncClearance()
  );
  const [loading, setLoading] = useState(false);

  const loadClearance = async () => {
    setLoading(true);
    try {
      const next = await studentFeesApi.getFinancialClearance();
      setClearance(next);
    } catch (err) {
      onNotify?.('err', err instanceof Error ? err.message : 'Unable to verify clearance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClearance();
  }, []);

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Eligibility &amp; Compliance
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Financial Clearance
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Real-time clearance thresholds for unit registration, CAT permits, library, and graduation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadClearance()}
            className="min-h-[38px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{loading ? 'Checking…' : 'Re-verify Ledger Clearance'}</span>
          </button>
          {clearance.outstandingBalance > 0 && (
            <button
              type="button"
              onClick={() => onNavigate?.('fees-pay')}
              className="min-h-[38px] px-4 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white rounded-lg text-xs font-semibold"
            >
              Pay Outstanding ({formatKes(clearance.outstandingBalance)})
            </button>
          )}
        </div>
      </header>

      {/* Progress Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#1769AA]" aria-hidden="true" />
            <span>
              Overall Settlement Ratio: {formatKes(clearance.totalPaid)} / {formatKes(clearance.totalFees)}
            </span>
          </span>
          <strong className="font-mono text-base text-[#092c60] dark:text-blue-300">
            {clearance.progressPercent}%
          </strong>
        </div>
        <progress
          value={clearance.progressPercent}
          max={100}
          aria-label={`Financial clearance ratio ${clearance.progressPercent} percent`}
          className="w-full h-3 rounded-lg overflow-hidden accent-emerald-600 bg-slate-200 dark:bg-slate-800"
        />
      </section>

      {/* Clearance Threshold Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clearance.items.map((item) => (
          <article
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[11px] font-semibold text-slate-500 block">
                  {item.category} · Min {item.thresholdPercent}% Threshold
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {item.label}
                </h2>
              </div>
              <span
                className={`font-bold inline-flex items-center gap-1 shrink-0 ${
                  item.status === 'CLEARED'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : item.status === 'PROVISIONAL' || item.status === 'PENDING'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {item.status === 'CLEARED' ? (
                  <CheckCircle2 size={14} aria-hidden="true" />
                ) : item.status === 'HOLD' ? (
                  <AlertCircle size={14} aria-hidden="true" />
                ) : (
                  <Clock size={14} aria-hidden="true" />
                )}
                <span>{item.status}</span>
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300">{item.requirementNote}</p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
              <span>Verified by {item.checkedBy}</span>
              <span className="font-mono">{new Date(item.checkedAt).toLocaleDateString()}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
