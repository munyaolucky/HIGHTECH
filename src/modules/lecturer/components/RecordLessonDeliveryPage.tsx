import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Plus,
} from 'lucide-react';
import {
  teachingModuleApi,
  type LessonDeliveryDTO,
  type SchemeOfWorkDTO,
} from '../../../services/teachingModuleApi';

export default function RecordLessonDeliveryPage() {
  const [lessons, setLessons] = useState<LessonDeliveryDTO[]>([]);
  const [schemes, setSchemes] = useState<SchemeOfWorkDTO[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form state
  const [unitCode, setUnitCode] = useState('CSC 301');
  const [lessonDate, setLessonDate] = useState('2026-11-19');
  const [timetableEntryId, setTimetableEntryId] = useState('');
  const [schemeTopicId, setSchemeTopicId] = useState('');
  const [status, setStatus] = useState<'CONDUCTED' | 'PARTIALLY_CONDUCTED' | 'NOT_CONDUCTED' | 'RESCHEDULED'>('CONDUCTED');
  const [plannedTopic, setPlannedTopic] = useState('');
  const [actualTopicTaught, setActualTopicTaught] = useState('');
  const [subtopicsCovered, setSubtopicsCovered] = useState('');
  const [learningObjectivesAchieved, setLearningObjectivesAchieved] = useState('');
  const [teachingMethods, setTeachingMethods] = useState('Interactive Lecture & Live Lab Demo');
  const [practicalsDone, setPracticalsDone] = useState('');
  const [pagesOrSectionsCovered, setPagesOrSectionsCovered] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [homeworkAssigned, setHomeworkAssigned] = useState('');
  const [nextLessonPlan, setNextLessonPlan] = useState('');
  const [substituteName, setSubstituteName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await teachingModuleApi.ensureLecturerSession();
      const [summary, lessonRows, schemeRows] = await Promise.all([
        teachingModuleApi.getSummary(),
        teachingModuleApi.listLessons({ status: statusFilter }),
        teachingModuleApi.listSchemes(),
      ]);
      setTimetable(summary.timetable || []);
      setLessons(lessonRows);
      setSchemes(schemeRows);
      if (summary.timetable?.length && !timetableEntryId) {
        const first = summary.timetable[0];
        setTimetableEntryId(first.id);
        setUnitCode(first.unitCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load lesson delivery records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, timetableEntryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const slot = timetable.find((t) => t.id === timetableEntryId) ?? timetable[0];
      await teachingModuleApi.saveLessonDelivery({
        timetableEntryId: slot?.id,
        assignmentId: slot?.assignmentId,
        unitCode: slot?.unitCode || unitCode,
        unitTitle: slot?.unitTitle,
        courseName: slot?.courseName,
        classGroupId: slot?.classGroupId,
        schemeTopicId: schemeTopicId || null,
        lessonDate,
        startTime: slot?.startTime,
        endTime: slot?.endTime,
        roomName: slot?.roomName,
        plannedTopic,
        actualTopicTaught,
        subtopicsCovered,
        learningObjectivesAchieved,
        teachingMethods,
        practicalsDone,
        pagesOrSectionsCovered,
        challengesFaced,
        homeworkAssigned,
        nextLessonPlan,
        status,
        actualTrainerId: substituteName.trim() ? 'usr-sub-trainer' : undefined,
        actualTrainerName: substituteName.trim() || undefined,
      });
      setNotice(
        `Saved ${slot?.unitCode || unitCode} lesson delivery record (${status}) linked directly to attendance & scheme of work.`
      );
      setPlannedTopic('');
      setActualTopicTaught('');
      setSubtopicsCovered('');
      setLearningObjectivesAchieved('');
      setPracticalsDone('');
      setChallengesFaced('');
      setHomeworkAssigned('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson record.');
    } finally {
      setSaving(false);
    }
  };

  const activeSchemeTopics = schemes
    .filter((s) => !unitCode || s.unitCode === unitCode)
    .flatMap((s) => s.topics);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-400">
          Lesson Accountability Chain · Timetable &rarr; Lesson Record &rarr; Attendance
        </p>
        <h1 className="text-xl font-bold text-[#102D50] dark:text-white mt-0.5">
          Record Today&apos;s Lesson &amp; Delivery History
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          A lesson can only be marked CONDUCTED when actual topic, subtopics covered, learning objectives, and teaching methods are documented. Individual student absences do not block a conducted lesson.
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

      {/* RECORD LESSON FORM */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs"
      >
        <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
          <Plus size={16} className="text-[#1769AA]" />
          Log Lesson Delivery Record
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Timetable Slot / Unit</label>
            <select
              value={timetableEntryId}
              onChange={(e) => {
                setTimetableEntryId(e.target.value);
                const slot = timetable.find((t) => t.id === e.target.value);
                if (slot) setUnitCode(slot.unitCode);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {timetable.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.unitCode} ({slot.startTime}-{slot.endTime}) · {slot.roomName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Lesson Date</label>
            <input
              type="date"
              required
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Delivery Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="CONDUCTED">CONDUCTED</option>
              <option value="PARTIALLY_CONDUCTED">PARTIALLY CONDUCTED</option>
              <option value="NOT_CONDUCTED">NOT CONDUCTED</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Link Scheme of Work Topic</label>
            <select
              value={schemeTopicId}
              onChange={(e) => {
                setSchemeTopicId(e.target.value);
                const top = activeSchemeTopics.find((t) => t.id === e.target.value);
                if (top && !plannedTopic) setPlannedTopic(top.topicTitle);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Optional Scheme Topic --</option>
              {activeSchemeTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  Wk {t.weekNumber}: {t.topicTitle} {t.covered ? '(Covered)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Planned Topic *</label>
            <input
              type="text"
              required
              placeholder="e.g. Binary Search Trees & AVL Rotations"
              value={plannedTopic}
              onChange={(e) => setPlannedTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Actual Topic Taught {status === 'CONDUCTED' ? '*' : ''}
            </label>
            <input
              type="text"
              placeholder="Topic actually taught during this session"
              value={actualTopicTaught}
              onChange={(e) => setActualTopicTaught(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Subtopics Covered {status === 'CONDUCTED' ? '*' : ''}
            </label>
            <input
              type="text"
              placeholder="Insertion, In-order traversal, Delete node cases"
              value={subtopicsCovered}
              onChange={(e) => setSubtopicsCovered(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Learning Objectives Achieved {status === 'CONDUCTED' ? '*' : ''}
            </label>
            <input
              type="text"
              placeholder="Students implemented and benchmarked BST balance factors"
              value={learningObjectivesAchieved}
              onChange={(e) => setLearningObjectivesAchieved(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Teaching Methods Used {status === 'CONDUCTED' ? '*' : ''}
            </label>
            <input
              type="text"
              value={teachingMethods}
              onChange={(e) => setTeachingMethods(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Practicals / Lab Activities Done</label>
            <input
              type="text"
              placeholder="Optional lab exercises completed"
              value={practicalsDone}
              onChange={(e) => setPracticalsDone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Module Pages / Sections Covered</label>
            <input
              type="text"
              placeholder="Chapter 5.1 – 5.4"
              value={pagesOrSectionsCovered}
              onChange={(e) => setPagesOrSectionsCovered(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Challenges / Unconducted Reason {status !== 'CONDUCTED' ? '*' : ''}
            </label>
            <input
              type="text"
              placeholder="Required if partially conducted, unconducted, or rescheduled"
              value={challengesFaced}
              onChange={(e) => setChallengesFaced(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Homework / Assignment Given</label>
            <input
              type="text"
              placeholder="Exercise sheet #4 due next lecture"
              value={homeworkAssigned}
              onChange={(e) => setHomeworkAssigned(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Substitute Trainer (If Covering Class)</label>
            <input
              type="text"
              placeholder="Leave blank if taught by assigned lecturer"
              value={substituteName}
              onChange={(e) => setSubstituteName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#102D50] hover:bg-[#0b203a] text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving Record...' : 'Save Lesson Delivery Record'}
          </button>
        </div>
      </form>

      {/* LESSON DELIVERY HISTORY */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <BookOpenCheck size={16} className="text-[#1769AA]" />
            Lesson Delivery History &amp; Attendance Linkage
          </h2>
          <select
            aria-label="Filter lessons by delivery status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONDUCTED">Conducted</option>
            <option value="PARTIALLY_CONDUCTED">Partially Conducted</option>
            <option value="NOT_CONDUCTED">Not Conducted</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-600 dark:text-slate-300">Loading lesson logs...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lessons.map((l) => (
              <div key={l.id} className="p-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#102D50] dark:text-blue-300">{l.unitCode}</span>
                    <span className="text-slate-500 dark:text-slate-400">·</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      {l.lessonDate} ({l.startTime}-{l.endTime})
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">·</span>
                    <span className="text-slate-600 dark:text-slate-300">{l.roomName}</span>
                    {l.isSubstitute && (
                      <span className="font-semibold text-[#1769AA] dark:text-blue-300">
                        · Substitute: {l.actualTrainerName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold ${
                        l.status === 'CONDUCTED'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : l.status === 'NOT_CONDUCTED'
                          ? 'text-[#B83232] dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {l.status}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">|</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      HOD: {l.hodReviewStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <strong className="text-sm text-slate-900 dark:text-white block">
                    {l.actualTopicTaught || l.plannedTopic}
                  </strong>
                  {l.subtopicsCovered && (
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Subtopics: {l.subtopicsCovered} · Methods: {l.teachingMethods}
                    </p>
                  )}
                  {l.challengesFaced && (
                    <p className="text-[#B83232] dark:text-red-300 mt-0.5">
                      Challenges / Remarks: {l.challengesFaced}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {l.attendanceSummary ? (
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <ClipboardList size={13} className="text-[#1769AA]" />
                      Register {l.attendanceSummary.attendanceRate}% · Present {l.attendanceSummary.presentCount} / Late{' '}
                      {l.attendanceSummary.lateCount} / Absent {l.attendanceSummary.absentCount} / Excused{' '}
                      {l.attendanceSummary.excusedCount}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> Attendance session pending roll call
                    </span>
                  )}

                  {l.observations.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-medium text-[#102D50] dark:text-blue-300">
                      <Eye size={13} /> {l.observations.length} Lesson Observation(s)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
