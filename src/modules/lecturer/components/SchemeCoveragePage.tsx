import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Layers,
  ListChecks,
} from 'lucide-react';
import {
  teachingModuleApi,
  type SchemeOfWorkDTO,
} from '../../../services/teachingModuleApi';

export default function SchemeCoveragePage() {
  const [schemes, setSchemes] = useState<SchemeOfWorkDTO[]>([]);
  const [catchUps, setCatchUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await teachingModuleApi.ensureLecturerSession();
      const [sch, cu] = await Promise.all([
        teachingModuleApi.listSchemes(),
        teachingModuleApi.listCatchUps(),
      ]);
      setSchemes(sch);
      setCatchUps(cu);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load schemes & catch-ups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleTopic = async (schemeId: string, topicId: string, nextCovered: boolean) => {
    try {
      setError(null);
      await teachingModuleApi.toggleSchemeTopic(schemeId, topicId, nextCovered);
      setNotice(`Syllabus topic updated as ${nextCovered ? 'COVERED' : 'PENDING'}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update topic coverage.');
    }
  };

  const handleCatchUpComplete = async (cuId: string) => {
    try {
      setError(null);
      await teachingModuleApi.updateCatchUpStatus(cuId, 'COMPLETED', 'Student completed supervised remedial session.');
      setNotice('Catch-up session marked COMPLETED.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update catch-up status.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-400">
          Syllabus Pacing &amp; Remedial Catch-Up Lessons
        </p>
        <h1 className="text-xl font-bold text-[#102D50] dark:text-white mt-0.5">
          Scheme of Work Coverage &amp; Catch-Up Practicals
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          Track planned vs covered weekly topics and manage missed practical or makeup lessons.
        </p>
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

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-600">
          Loading syllabus coverage and catch-up schedule...
        </div>
      ) : (
        <>
          {schemes.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                    {s.unitCode} · {s.classGroupId}
                  </span>
                  <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2 mt-0.5">
                    <Layers size={15} className="text-[#1769AA]" />
                    {s.title}
                  </h2>
                </div>
                <div className="text-right tabular-nums">
                  <strong className="text-lg font-bold text-[#102D50] dark:text-white">{s.coveragePct}%</strong>
                  <span className="block text-[11px] text-slate-600 dark:text-slate-300">
                    {s.coveredTopics} of {s.totalTopics} topics covered
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Wk</th>
                      <th className="py-2.5 px-3 font-semibold">Planned Date</th>
                      <th className="py-2.5 px-3 font-semibold">Topic &amp; Subtopics</th>
                      <th className="py-2.5 px-3 font-semibold">Actual Date</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Coverage Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {s.topics.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2.5 px-3 font-mono font-bold tabular-nums">{t.weekNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 tabular-nums">{t.plannedDate}</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 dark:text-white block">{t.topicTitle}</strong>
                          <span className="text-slate-600 dark:text-slate-300">{t.subtopics}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                          {t.actualCoveredDate || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleTopic(s.id, t.id, !t.covered)}
                            className={`px-3 py-1.5 rounded-lg font-semibold ${
                              t.covered
                                ? 'bg-emerald-700 text-white'
                                : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {t.covered ? 'Covered' : 'Mark Covered'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {s.unfinishedTopics.length > 0 && (
                <div className="rounded-xl bg-[#F5EBDD]/60 dark:bg-slate-800/80 p-3 flex items-center gap-2 text-[#102D50] dark:text-slate-200">
                  <ListChecks size={15} className="shrink-0 text-[#B83232]" />
                  <span>
                    <strong>Unfinished Topics ({s.unfinishedTopics.length}):</strong>{' '}
                    {s.unfinishedTopics.map((u) => `Wk ${u.weekNumber} ${u.topicTitle}`).join(' · ')}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* CATCH-UP LESSONS & MISSED PRACTICALS */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <CalendarClock size={16} className="text-[#1769AA]" />
              Scheduled Catch-Up Lessons &amp; Missed Practicals
            </h2>
            {catchUps.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-300">No catch-up sessions scheduled yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {catchUps.map((cu) => (
                  <div key={cu.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">
                        {cu.studentName} ({cu.studentRegNo}) · {cu.unitCode}
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        Missed: {cu.missedLessonDate} · Makeup: {cu.scheduledDate} ({cu.scheduledTime}) at {cu.roomOrLink}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${cu.status === 'COMPLETED' ? 'text-emerald-700' : 'text-[#1769AA]'}`}>
                        {cu.status}
                      </span>
                      {cu.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => handleCatchUpComplete(cu.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#102D50] text-white font-semibold"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
