import React, { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { UnitCourse } from '../../../types';

interface StudentAnalyticsRowProps {
  units: UnitCourse[];
  gpa: number;
  attendanceRate: number;
  onNavigateResults: () => void;
  onNavigateAttendance: () => void;
}

const GPA_SERIES = [
  { term: 'Y1 S1', gpa: 3.42, avg: 68 },
  { term: 'Y1 S2', gpa: 3.55, avg: 71 },
  { term: 'Y2 S1', gpa: 3.68, avg: 74 },
  { term: 'Y2 S2', gpa: 3.74, avg: 76 },
  { term: 'Y3 S1', gpa: 3.82, avg: 79 },
];

export default function StudentAnalyticsRow({
  units,
  gpa,
  attendanceRate,
  onNavigateResults,
  onNavigateAttendance,
}: StudentAnalyticsRowProps) {
  const [selectedUnitCode, setSelectedUnitCode] = useState<string>(units[0]?.code ?? '');
  const [selectedTermIdx, setSelectedTermIdx] = useState<number>(GPA_SERIES.length - 1);

  const activeUnit = units.find((u) => u.code === selectedUnitCode) ?? units[0];
  const chartSeries = GPA_SERIES.map((pt, i) =>
    i === GPA_SERIES.length - 1 ? { ...pt, gpa } : pt
  );

  // Compute polyline coordinates inside viewBox 0 0 320 96
  const points = chartSeries.map((pt, idx) => {
    const x = 18 + idx * 71;
    const y = 84 - ((pt.gpa - 2.8) / 1.2) * 64;
    return { x, y: Math.max(10, Math.min(84, y)), ...pt };
  });
  const polylinePath = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0].x},88 L ${points
    .map((p) => `${p.x},${p.y}`)
    .join(' L ')} L ${points[points.length - 1].x},88 Z`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* ATTENDANCE PROGRESS CHART */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
            <BarChart3 size={18} className="text-[#1769AA] dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-extrabold">Unit Attendance Progress</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Average {attendanceRate}% · Exam threshold 75%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateAttendance}
            className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            QR Check-In
          </button>
        </div>

        <div className="relative pt-2">
          {/* 75% minimum line */}
          <div className="flex items-end justify-between gap-2.5 h-32 px-1 border-b border-slate-200 dark:border-slate-800">
            {units.map((u) => {
              const selected = activeUnit?.code === u.code;
              const pct = Math.max(25, Math.min(100, u.attendance));
              const heightClass =
                pct >= 96
                  ? 'h-full'
                  : pct >= 90
                  ? 'h-11/12'
                  : pct >= 85
                  ? 'h-5/6'
                  : pct >= 75
                  ? 'h-3/4'
                  : pct >= 65
                  ? 'h-2/3'
                  : pct >= 50
                  ? 'h-1/2'
                  : 'h-1/3';
              const belowRule = u.attendance < 75;
              const barColor = belowRule
                ? 'bg-amber-500'
                : selected
                ? 'bg-[#1769AA]'
                : 'bg-[#102D50]/80 dark:bg-blue-500/75';

              return (
                <button
                  key={u.code}
                  type="button"
                  onClick={() => setSelectedUnitCode(u.code)}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  aria-label={`${u.code} ${u.attendance}% attendance`}
                >
                  <span className="text-[10px] font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                    {u.attendance}%
                  </span>
                  <div className="w-full max-w-[34px] h-20 bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${barColor} ${heightClass}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold truncate max-w-full ${
                      selected
                        ? 'text-[#1769AA] dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {u.code.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeUnit && (
          <div className="p-3 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <strong className="text-slate-900 dark:text-slate-100 block truncate">
                {activeUnit.code} — {activeUnit.title}
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeUnit.lecturerName} · {activeUnit.room}
              </span>
            </div>
            <strong className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
              {activeUnit.attendance}%
            </strong>
          </div>
        )}
      </section>

      {/* ACADEMIC PERFORMANCE CHART */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
            <TrendingUp size={18} className="text-[#1769AA] dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-extrabold">Academic Performance Trend</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cumulative GPA progression across 5 terms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateResults}
            className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            Transcript
          </button>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox="0 0 320 105" className="w-full h-28" role="img" aria-label="Semester GPA Trend">
            <defs>
              <linearGradient id="gpaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1769AA" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#1769AA" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <line x1="12" y1="22" x2="308" y2="22" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
            <line x1="12" y1="54" x2="308" y2="54" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
            <path d={areaPath} fill="url(#gpaAreaGrad)" />
            <polyline
              fill="none"
              stroke="#1769AA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePath}
            />
            {points.map((p, idx) => {
              const active = idx === selectedTermIdx;
              return (
                <g
                  key={p.term}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`${p.term}: GPA ${p.gpa.toFixed(2)}, Mean score ${p.avg}%`}
                  onClick={() => setSelectedTermIdx(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTermIdx(idx);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {active && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={9}
                      fill="none"
                      stroke="#E8B44A"
                      strokeWidth="1.5"
                      strokeOpacity="0.6"
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={active ? 5 : 3.5}
                    fill={active ? '#E8B44A' : '#1769AA'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={p.x}
                    y="102"
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-slate-600 dark:fill-slate-300 font-mono"
                  >
                    {p.term}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="p-3 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div>
            <strong className="text-slate-900 dark:text-slate-100 block">
              {chartSeries[selectedTermIdx].term} Standing
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
              Mean Score: {chartSeries[selectedTermIdx].avg}% · First Class Honours Track
            </span>
          </div>
          <strong className="text-base font-extrabold font-mono tabular-nums text-[#1769AA] dark:text-blue-400">
            {chartSeries[selectedTermIdx].gpa.toFixed(2)} GPA
          </strong>
        </div>
      </section>
    </div>
  );
}
