import React, { useEffect, useState } from 'react';
import { Download, Layers } from 'lucide-react';
import { downloadStudentDocument } from '../../../../services/studentPortalService';
import { formatKes, studentFeesApi } from '../feesApi';
import type { FinanceFeeStructureRecord } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function FeeStructurePage({ onNotify }: StudentFeesPageProps) {
  const [structures, setStructures] = useState<FinanceFeeStructureRecord[]>(() =>
    studentFeesApi.getSyncStructures()
  );
  const [selectedId, setSelectedId] = useState<string>(
    () => studentFeesApi.getSyncStructures()[0]?.id ?? ''
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await studentFeesApi.listFeeStructures();
        setStructures(res.structures);
        if (res.structures.length > 0 && !res.structures.some((s) => s.id === selectedId)) {
          setSelectedId(res.structures[0].id);
        }
      } catch (err) {
        onNotify?.('err', err instanceof Error ? err.message : 'Unable to load fee structures.');
      }
    })();
  }, []);

  const current = structures.find((s) => s.id === selectedId) ?? structures[0];

  const handleDownloadSchedule = () => {
    if (!current) return;
    const text = [
      `HI-TECH COLLEGE — APPROVED FEE STRUCTURE (${current.academicYear})`,
      `Programme: ${current.programmeName} (${current.programmeCode})`,
      `Term:      ${current.termLabel}`,
      '------------------------------------------------------',
      ...current.items.map((item) => `${item.code}\t${item.label}\t${formatKes(item.amount)}`),
      '------------------------------------------------------',
      `TOTAL APPROVED FEE: ${formatKes(current.totalAmount)}.00`,
    ].join('\n');
    downloadStudentDocument(`Fee_Structure_${current.programmeCode}.txt`, text);
    onNotify?.('ok', `Fee structure for ${current.programmeCode} downloaded.`);
  };

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Academic Year 2026
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Fee Structure
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Official Senate-approved tuition, ICT laboratory, examination, and library fee schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadSchedule}
          className="min-h-[40px] px-4 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shrink-0"
        >
          <Download size={14} aria-hidden="true" />
          <span>Download Fee Schedule</span>
        </button>
      </header>

      {/* Programme Selector */}
      <section className="flex flex-wrap gap-2">
        {structures.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setSelectedId(st.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              current?.id === st.id
                ? 'bg-[#092c60] text-white border-[#092c60]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            {st.programmeCode} · {st.programmeName.split('(')[0].trim()}
          </button>
        ))}
      </section>

      {current && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Layers size={16} className="text-[#1769AA]" aria-hidden="true" />
              <span>{current.programmeName}</span>
            </div>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {current.termLabel}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Vote Head</th>
                  <th className="py-3 px-4 font-semibold">Fee Component</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {current.items.map((item) => (
                  <tr key={item.code}>
                    <td className="py-3 px-4 font-mono font-bold text-[#092c60] dark:text-blue-300">
                      {item.code}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{item.label}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {formatKes(item.amount)}.00
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-[#092c60] dark:text-blue-300">
                  <td className="py-3.5 px-4 font-mono">TOTAL</td>
                  <td className="py-3.5 px-4">Approved Term Total</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                    {formatKes(current.totalAmount)}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
