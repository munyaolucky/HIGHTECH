import React, { useEffect, useState } from 'react';
import { Download, FileText, Printer, RefreshCw } from 'lucide-react';
import { downloadCsv, formatKes, studentFeesApi } from '../feesApi';
import type { StudentFeeStatementDto } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function FeeStatementPage({ onNavigate, onNotify }: StudentFeesPageProps) {
  const [statement, setStatement] = useState<StudentFeeStatementDto>(() =>
    studentFeesApi.getSyncStatement()
  );
  const [termFilter, setTermFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStatement = async (term?: string) => {
    setLoading(true);
    try {
      const next = await studentFeesApi.getStatement(term);
      setStatement(next);
    } catch (err) {
      onNotify?.('err', err instanceof Error ? err.message : 'Unable to load fee statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatement();
  }, []);

  const handleExportCsv = () => {
    downloadCsv(
      `Fee_Statement_${statement.account.studentRegNo.replace(/\//g, '_')}.csv`,
      ['Date', 'Reference', 'Entry Type', 'Description', 'Debit (KES)', 'Credit (KES)', 'Balance (KES)'],
      statement.entries.map((row) => [
        new Date(row.date).toISOString().slice(0, 10),
        row.reference,
        row.entryType,
        row.description,
        row.debit,
        row.credit,
        row.runningBalance,
      ])
    );
    onNotify?.('ok', 'Fee statement CSV downloaded.');
  };

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Official Student Ledger
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Fee Statement
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Detailed tuition charges, verified M-Pesa/bank payments, credits, and running balance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => void loadStatement(termFilter || undefined)}
            disabled={loading}
            className="min-h-[38px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{loading ? 'Syncing…' : 'Sync Ledger'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && typeof window.print === 'function') {
                window.print();
              }
            }}
            className="min-h-[38px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Printer size={14} aria-hidden="true" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[38px] px-3.5 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download size={14} aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Summary Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-slate-500 dark:text-slate-400 block">Total Charges Billed</span>
          <strong className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 block mt-1">
            {formatKes(statement.totalFees)}
          </strong>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-slate-500 dark:text-slate-400 block">Total Payments &amp; Credits</span>
          <strong className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 block mt-1">
            {formatKes(statement.totalPaid)}
          </strong>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-slate-500 dark:text-slate-400 block">Closing Balance Due</span>
          <strong className="text-xl font-bold font-mono tabular-nums text-[#092c60] dark:text-blue-300 block mt-1">
            {formatKes(statement.outstandingBalance)}
          </strong>
        </div>
      </section>

      {/* Filter & Ledger Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
            <FileText size={15} className="text-[#1769AA]" aria-hidden="true" />
            <span>Running Fee Ledger ({statement.account.studentRegNo})</span>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <select
              aria-label="Filter statement by academic term"
              value={termFilter}
              onChange={(e) => {
                setTermFilter(e.target.value);
                void loadStatement(e.target.value || undefined);
              }}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100"
            >
              <option value="">All Academic Terms (2026)</option>
              <option value="Semester 1">Academic Year 2026 · Semester 1</option>
            </select>
            {statement.outstandingBalance > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.('fees-pay')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Settle Balance
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Debit (KES)</th>
                <th className="py-3 px-4 font-semibold text-right">Credit (KES)</th>
                <th className="py-3 px-4 font-semibold text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {statement.entries.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#092c60] dark:text-blue-300 whitespace-nowrap">
                    {row.reference}
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{row.description}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {row.debit > 0 ? row.debit.toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {row.credit > 0 ? row.credit.toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatKes(row.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
