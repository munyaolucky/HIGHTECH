import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ExamAnswer,
  ExamAnswerValue,
  ExamSecurityEvent,
  ExamSession,
} from './examTypes';

const API = '/api/student/exam-sessions';

export type SaveState = 'saved' | 'saving' | 'offline' | 'error';

export function useExamSession(initialSession: ExamSession) {
  const [session, setSession] = useState<ExamSession>(initialSession);
  const [answers, setAnswers] = useState<ExamAnswer[]>(initialSession.answers ?? []);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (initialSession.expiresAt) {
      return Math.max(
        0,
        Math.floor((new Date(initialSession.expiresAt).getTime() - Date.now()) / 1000)
      );
    }
    return initialSession.exam.durationMinutes * 60;
  });
  const [securityEvents, setSecurityEvents] = useState<ExamSecurityEvent[]>([]);
  const [lastPolicyWarning, setLastPolicyWarning] = useState<string>('');

  const saveTimer = useRef<number | undefined>(undefined);
  const latestAnswers = useRef<ExamAnswer[]>(initialSession.answers ?? []);
  const latestSessionStatus = useRef(initialSession.status);

  useEffect(() => {
    latestAnswers.current = answers;
  }, [answers]);

  useEffect(() => {
    latestSessionStatus.current = session.status;
  }, [session.status]);

  // Keep synced when initialSession changes (e.g., entering active session from instructions)
  useEffect(() => {
    setSession(initialSession);
    setAnswers(initialSession.answers ?? []);
    latestAnswers.current = initialSession.answers ?? [];
    if (initialSession.expiresAt) {
      setRemainingSeconds(
        Math.max(
          0,
          Math.floor((new Date(initialSession.expiresAt).getTime() - Date.now()) / 1000)
        )
      );
    }
  }, [initialSession]);

  const persistAnswers = useCallback(
    async (allowDuringExpiry = false) => {
      const currentStatus = latestSessionStatus.current;
      if (currentStatus !== 'active' && !(allowDuringExpiry && currentStatus === 'expired')) {
        return;
      }

      setSaveState('saving');

      if (session.localPreviewMode) {
        try {
          localStorage.setItem(
            `exam-recovery-${session.id}`,
            JSON.stringify(latestAnswers.current)
          );
          setSaveState('saved');
          setSession((curr) => ({ ...curr, lastSavedAt: new Date().toISOString() }));
        } catch {
          setSaveState('error');
        }
        return;
      }

      try {
        const response = await fetch(`${API}/${session.id}/answers`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: latestAnswers.current.map((a) => ({
              questionId: a.questionId,
              value: a.value,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Answer save failed');
        }

        setSaveState('saved');
        setSession((curr) => ({ ...curr, lastSavedAt: new Date().toISOString() }));
        localStorage.removeItem(`exam-recovery-${session.id}`);
      } catch {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setSaveState(online ? 'error' : 'offline');
        try {
          localStorage.setItem(
            `exam-recovery-${session.id}`,
            JSON.stringify(latestAnswers.current)
          );
        } catch {
          // Ignore storage quota errors
        }
      }
    },
    [session.id, session.localPreviewMode]
  );

  // Authoritative countdown synced to session.expiresAt
  useEffect(() => {
    if (!session.expiresAt || session.status !== 'active') return;

    const updateTime = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(session.expiresAt!).getTime() - Date.now()) / 1000)
      );
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        setSession((current) =>
          current.status === 'active'
            ? {
                ...current,
                status: 'expired',
              }
            : current
        );
      }
    };

    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, [session.expiresAt, session.status]);

  // Periodic background autosave + online recovery flush
  useEffect(() => {
    if (session.status !== 'active') return;
    const periodicId = window.setInterval(() => {
      void persistAnswers();
    }, 20_000);

    const handleOnline = () => {
      void persistAnswers();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.clearInterval(periodicId);
      window.removeEventListener('online', handleOnline);
    };
  }, [persistAnswers, session.status]);

  const activateSession = useCallback(
    (startedSession?: Partial<ExamSession>) => {
      setSession((current) => {
        const durationMs = current.exam.durationMinutes * 60 * 1000;
        const nowIso = new Date().toISOString();
        const expiresAt =
          startedSession?.expiresAt ||
          current.expiresAt ||
          new Date(Date.now() + durationMs).toISOString();

        return {
          ...current,
          ...startedSession,
          status: 'active',
          startedAt: startedSession?.startedAt || current.startedAt || nowIso,
          expiresAt,
        };
      });
    },
    []
  );

  const updateAnswer = useCallback(
    (questionId: string, value: ExamAnswerValue) => {
      if (latestSessionStatus.current !== 'active') return;

      setAnswers((current) => {
        const next = [...current];
        const index = next.findIndex((answer) => answer.questionId === questionId);

        const answer: ExamAnswer = {
          questionId,
          value,
          updatedAt: new Date().toISOString(),
        };

        if (index >= 0) next[index] = answer;
        else next.push(answer);

        latestAnswers.current = next;
        return next;
      });

      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }

      saveTimer.current = window.setTimeout(() => {
        void persistAnswers();
      }, 650);
    },
    [persistAnswers]
  );

  const recordSecurityEvent = useCallback(
    async (event: ExamSecurityEvent): Promise<string | null> => {
      setSecurityEvents((prev) => [...prev, event]);

      if (session.localPreviewMode) {
        try {
          const key = `exam-events-${session.id}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]') as ExamSecurityEvent[];
          localStorage.setItem(key, JSON.stringify([...existing, event]));
        } catch {
          // ignore
        }
        if (event.type === 'TAB_HIDDEN') {
          const msg =
            'Warning: Switching tabs during Secure Exam Mode is monitored and logged.';
          setLastPolicyWarning(msg);
          return msg;
        }
        if (event.type === 'FULLSCREEN_EXIT') {
          const msg =
            'Fullscreen mode exited. Please re-enter fullscreen immediately.';
          setLastPolicyWarning(msg);
          return msg;
        }
        if (
          event.type === 'COPY_ATTEMPT' ||
          event.type === 'PASTE_ATTEMPT' ||
          event.type === 'CUT_ATTEMPT' ||
          event.type === 'PROHIBITED_SHORTCUT'
        ) {
          const msg = 'Clipboard actions and prohibited shortcuts are blocked in Secure Exam Mode.';
          setLastPolicyWarning(msg);
          return msg;
        }
        return null;
      }

      try {
        const res = await fetch(`${API}/${session.id}/security-events`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (res.ok) {
          const payload = (await res.json()) as {
            data?: { warningMessage?: string | null };
          };
          const warning = payload.data?.warningMessage ?? null;
          if (warning) setLastPolicyWarning(warning);
          return warning;
        }
      } catch {
        try {
          const key = `exam-events-${session.id}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]') as ExamSecurityEvent[];
          localStorage.setItem(key, JSON.stringify([...existing, event]));
        } catch {
          // ignore
        }
      }
      return null;
    },
    [session.id, session.localPreviewMode]
  );

  const submitExam = useCallback(async () => {
    // Allow flushing final answer buffer even when local clock transitioned to 'expired'
    await persistAnswers(true);

    if (session.localPreviewMode) {
      const nowIso = new Date().toISOString();
      setSession((current) => ({
        ...current,
        status: 'submitted',
        submittedAt: nowIso,
      }));
      return;
    }

    const response = await fetch(`${API}/${session.id}/submit`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('The exam could not be submitted.');
    }

    const nowIso = new Date().toISOString();
    setSession((current) => ({
      ...current,
      status: 'submitted',
      submittedAt: nowIso,
    }));
  }, [persistAnswers, session.id, session.localPreviewMode]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, []);

  return {
    session,
    answers,
    saveState,
    remainingSeconds,
    securityEvents,
    lastPolicyWarning,
    activateSession,
    updateAnswer,
    recordSecurityEvent,
    persistAnswers,
    submitExam,
  };
}
