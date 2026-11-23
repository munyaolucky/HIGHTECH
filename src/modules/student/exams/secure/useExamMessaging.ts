import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ExamChatMessage,
  ExamMessageKind,
  ExamMessagePriority,
  ExamMessagingConnectionState,
} from './examTypes';

export interface UseExamMessagingOptions {
  role: 'student' | 'supervisor';
  sessionId?: string;
  examId?: string;
  examTitle?: string;
  studentName?: string;
  studentRegNo?: string;
  enabled?: boolean;
  localPreviewMode?: boolean;
  initialMessages?: ExamChatMessage[];
}

export function mergeMessagesIdempotently(
  existing: ExamChatMessage[],
  incoming: ExamChatMessage[]
): ExamChatMessage[] {
  const byId = new Map<string, ExamChatMessage>();
  for (const msg of existing) {
    byId.set(msg.id, msg);
  }
  for (const msg of incoming) {
    byId.set(msg.id, msg);
  }
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createSeededSupervisorPreviewMessages(): ExamChatMessage[] {
  const now = Date.now();
  return [
    {
      id: 'EXAMMSG-001',
      sessionId: 'EXAM-SESSION-001',
      examId: 'sec-exam-net-cat',
      examTitle: 'Computer Networking CAT',
      studentId: 'stu-sample-002',
      studentName: 'Brian Kipkorir',
      studentRegNo: 'HCA/STU/2026/014',
      senderRole: 'STUDENT',
      senderId: 'stu-sample-002',
      senderName: 'Brian Kipkorir',
      kind: 'HELP_REQUEST',
      priority: 'URGENT',
      body: 'Browser exited fullscreen briefly after a low-battery notification appeared. Can I continue my attempt?',
      createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
      readByStudent: true,
      readBySupervisor: false,
    },
    {
      id: 'EXAMMSG-002',
      sessionId: 'EXAM-SESSION-001',
      examId: 'sec-exam-net-cat',
      examTitle: 'Computer Networking CAT',
      studentId: 'stu-sample-002',
      studentName: 'Brian Kipkorir',
      studentRegNo: 'HCA/STU/2026/014',
      senderRole: 'SUPERVISOR',
      senderId: 'usr-exam-01',
      senderName: 'Dr. Kiprop Chemweno',
      kind: 'SUPERVISOR_INSTRUCTION',
      priority: 'NORMAL',
      body: 'Noted. Click Re-enter Fullscreen and continue your assessment. Your answers remain saved.',
      createdAt: new Date(now - 9 * 60 * 1000).toISOString(),
      readByStudent: false,
      readBySupervisor: true,
    },
  ];
}

export function useExamMessaging({
  role,
  sessionId,
  examId = 'sec-exam-net-cat',
  examTitle = 'Secure Examination',
  studentName = 'Candidate',
  studentRegNo = 'HCA/STU',
  enabled = true,
  localPreviewMode = false,
  initialMessages,
}: UseExamMessagingOptions) {
  const [messages, setMessages] = useState<ExamChatMessage[]>(() => {
    if (initialMessages) return initialMessages;
    return role === 'supervisor' ? createSeededSupervisorPreviewMessages() : [];
  });
  const [connectionState, setConnectionState] = useState<ExamMessagingConnectionState>(
    localPreviewMode ? 'preview' : 'connecting'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [sending, setSending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | undefined>(undefined);
  const retryAttemptRef = useRef(0);
  const unmountedRef = useRef(false);

  const fetchSnapshot = useCallback(async () => {
    if (!enabled || localPreviewMode || typeof fetch !== 'function') return;
    if (role === 'student' && !sessionId) return;

    const url =
      role === 'supervisor'
        ? sessionId
          ? `/api/exams/supervisor/messages?sessionId=${encodeURIComponent(sessionId)}`
          : '/api/exams/supervisor/messages'
        : `/api/student/exam-sessions/${encodeURIComponent(sessionId!)}/messages`;

    try {
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setConnectionState('preview');
        return;
      }
      if (!res.ok) return;
      const payload = (await res.json()) as {
        success?: boolean;
        data?: { messages?: ExamChatMessage[] };
      };
      if (payload.success && Array.isArray(payload.data?.messages)) {
        setMessages((prev) =>
          role === 'supervisor' && !sessionId
            ? mergeMessagesIdempotently([], payload.data!.messages!)
            : mergeMessagesIdempotently(prev, payload.data!.messages!)
        );
      }
    } catch {
      // Keep existing state when offline
    }
  }, [enabled, localPreviewMode, role, sessionId]);

  useEffect(() => {
    unmountedRef.current = false;
    if (!enabled) return;

    if (localPreviewMode) {
      setConnectionState('preview');
      return;
    }

    if (role === 'student' && !sessionId) {
      return;
    }

    void fetchSnapshot();

    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      return;
    }

    const connect = () => {
      if (unmountedRef.current) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const query = new URLSearchParams({ role });
      if (sessionId) query.set('sessionId', sessionId);

      setConnectionState(retryAttemptRef.current > 0 ? 'reconnecting' : 'connecting');
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws/exam-messages?${query.toString()}`);
      wsRef.current = socket;

      socket.onopen = () => {
        if (unmountedRef.current) return;
        retryAttemptRef.current = 0;
        setConnectionState('connected');
        setErrorMessage('');
        socket.send(
          JSON.stringify({
            type: 'subscribe',
            sessionId: sessionId || undefined,
          })
        );
      };

      socket.onmessage = (event) => {
        if (unmountedRef.current) return;
        try {
          const packet = JSON.parse(String(event.data)) as {
            type?: string;
            sessionId?: string;
            readerRole?: 'STUDENT' | 'SUPERVISOR';
            message?: ExamChatMessage;
            messages?: ExamChatMessage[];
            error?: string;
          };

          if (packet.type === 'exam:messages:init' && Array.isArray(packet.messages)) {
            setMessages((prev) => mergeMessagesIdempotently(prev, packet.messages!));
          } else if (packet.type === 'exam:message:created' && packet.message) {
            setMessages((prev) => mergeMessagesIdempotently(prev, [packet.message!]));
          } else if (packet.type === 'exam:messages:read' && packet.sessionId && packet.readerRole) {
            setMessages((prev) =>
              prev.map((m) =>
                m.sessionId === packet.sessionId
                  ? {
                      ...m,
                      readByStudent:
                        packet.readerRole === 'STUDENT' ? true : m.readByStudent,
                      readBySupervisor:
                        packet.readerRole === 'SUPERVISOR' ? true : m.readBySupervisor,
                    }
                  : m
              )
            );
          } else if (packet.type === 'exam:messages:error' && packet.error) {
            setErrorMessage(packet.error);
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };

      socket.onclose = (ev) => {
        if (unmountedRef.current) return;
        wsRef.current = null;
        if (ev.code === 1008) {
          setConnectionState('preview');
          return;
        }
        const attempt = retryAttemptRef.current;
        retryAttemptRef.current = attempt + 1;
        setConnectionState('reconnecting');
        const delayMs = Math.min(6000, 1500 * Math.pow(2, attempt));
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, delayMs);
      };

      socket.onerror = () => {
        // Closed handler triggers reconnect/preview fallback
      };
    };

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, fetchSnapshot, localPreviewMode, role, sessionId]);

  const sendMessage = useCallback(
    async (input: {
      sessionId?: string;
      body: string;
      priority?: ExamMessagePriority;
      kind?: ExamMessageKind;
      targetStudentName?: string;
      targetStudentRegNo?: string;
      targetExamTitle?: string;
    }): Promise<ExamChatMessage | null> => {
      const targetSessionId = input.sessionId || sessionId;
      const trimmed = input.body.trim();
      if (!targetSessionId || !trimmed) {
        setErrorMessage('Please enter a message before sending.');
        return null;
      }

      setSending(true);
      setErrorMessage('');

      const priority: ExamMessagePriority = input.priority ?? 'NORMAL';
      const kind: ExamMessageKind =
        input.kind ?? (role === 'supervisor' ? 'SUPERVISOR_INSTRUCTION' : 'HELP_REQUEST');

      const buildFallbackMessage = (): ExamChatMessage => ({
        id: `PREVIEW-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sessionId: targetSessionId,
        examId,
        examTitle: input.targetExamTitle ?? examTitle,
        studentId: role === 'student' ? 'stu-local' : targetSessionId,
        studentName: input.targetStudentName ?? studentName,
        studentRegNo: input.targetStudentRegNo ?? studentRegNo,
        senderRole: role === 'supervisor' ? 'SUPERVISOR' : 'STUDENT',
        senderId: role === 'supervisor' ? 'supervisor-preview' : 'stu-local',
        senderName: role === 'supervisor' ? 'Examination Supervisor' : studentName,
        kind,
        priority,
        body: trimmed,
        createdAt: new Date().toISOString(),
        readByStudent: role === 'student',
        readBySupervisor: role === 'supervisor',
      });

      try {
        if (localPreviewMode || connectionState === 'preview') {
          const previewMsg = buildFallbackMessage();
          setMessages((prev) => mergeMessagesIdempotently(prev, [previewMsg]));
          return previewMsg;
        }

        const endpoint =
          role === 'supervisor'
            ? `/api/exams/supervisor/sessions/${encodeURIComponent(targetSessionId)}/messages`
            : `/api/student/exam-sessions/${encodeURIComponent(targetSessionId)}/messages`;

        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: trimmed,
            priority,
            kind,
          }),
        });

        if (res.status === 401 || res.status === 403) {
          setConnectionState('preview');
          const previewMsg = buildFallbackMessage();
          setMessages((prev) => mergeMessagesIdempotently(prev, [previewMsg]));
          return previewMsg;
        }

        const payload = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: { message?: ExamChatMessage };
          error?: string;
        };

        if (!res.ok || !payload.success || !payload.data?.message) {
          const err = payload.error ?? 'Could not deliver message. Please retry.';
          setErrorMessage(err);
          return null;
        }

        setMessages((prev) => mergeMessagesIdempotently(prev, [payload.data!.message!]));
        return payload.data.message;
      } catch {
        setErrorMessage('Network error sending message.');
        return null;
      } finally {
        setSending(false);
      }
    },
    [
      connectionState,
      examId,
      examTitle,
      localPreviewMode,
      role,
      sessionId,
      studentName,
      studentRegNo,
    ]
  );

  const broadcastInstruction = useCallback(
    async (input: {
      examId: string;
      body: string;
      priority?: ExamMessagePriority;
    }): Promise<ExamChatMessage[]> => {
      const trimmed = input.body.trim();
      if (!trimmed) {
        setErrorMessage('Please enter an announcement before broadcasting.');
        return [];
      }

      setSending(true);
      setErrorMessage('');

      try {
        if (localPreviewMode || connectionState === 'preview' || typeof fetch !== 'function') {
          const previewMsg: ExamChatMessage = {
            id: `PREVIEW-BCAST-${Date.now()}`,
            sessionId: sessionId || 'EXAM-SESSION-001',
            examId: input.examId,
            examTitle,
            studentId: 'stu-sample-002',
            studentName: 'Brian Kipkorir',
            studentRegNo: 'HCA/STU/2026/014',
            senderRole: 'SUPERVISOR',
            senderId: 'supervisor-preview',
            senderName: 'Examination Supervisor',
            kind: 'SUPERVISOR_INSTRUCTION',
            priority: input.priority ?? 'URGENT',
            body: `[COHORT BROADCAST] ${trimmed}`,
            createdAt: new Date().toISOString(),
            readByStudent: false,
            readBySupervisor: true,
          };
          setMessages((prev) => mergeMessagesIdempotently(prev, [previewMsg]));
          return [previewMsg];
        }

        const res = await fetch(
          `/api/exams/supervisor/exams/${encodeURIComponent(input.examId)}/broadcast-instruction`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              body: trimmed,
              priority: input.priority ?? 'URGENT',
            }),
          }
        );

        const payload = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: { messages?: ExamChatMessage[] };
          error?: string;
        };

        if (res.status === 401 || res.status === 403) {
          setConnectionState('preview');
          return [];
        }

        if (!res.ok || !payload.success || !Array.isArray(payload.data?.messages)) {
          setErrorMessage(payload.error ?? 'Failed to broadcast instruction.');
          return [];
        }

        setMessages((prev) => mergeMessagesIdempotently(prev, payload.data!.messages!));
        return payload.data.messages;
      } catch {
        setErrorMessage('Network error broadcasting instruction.');
        return [];
      } finally {
        setSending(false);
      }
    },
    [connectionState, examTitle, localPreviewMode, sessionId]
  );

  const markSessionRead = useCallback(
    async (targetSessionId?: string) => {
      const id = targetSessionId || sessionId;
      if (!id) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.sessionId === id
            ? {
                ...m,
                readByStudent: role === 'student' ? true : m.readByStudent,
                readBySupervisor: role === 'supervisor' ? true : m.readBySupervisor,
              }
            : m
        )
      );

      if (localPreviewMode || connectionState === 'preview' || typeof fetch !== 'function') {
        return;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'exam:messages:read', sessionId: id }));
        return;
      }

      const url =
        role === 'supervisor'
          ? `/api/exams/supervisor/sessions/${encodeURIComponent(id)}/messages/read`
          : `/api/student/exam-sessions/${encodeURIComponent(id)}/messages/read`;

      void fetch(url, { method: 'POST', credentials: 'include' }).catch(() => {
        // Non-blocking
      });
    },
    [connectionState, localPreviewMode, role, sessionId]
  );

  const unreadCount = useMemo(() => {
    if (role === 'student') {
      return messages.filter(
        (m) => m.senderRole === 'SUPERVISOR' && !m.readByStudent && (!sessionId || m.sessionId === sessionId)
      ).length;
    }
    return messages.filter((m) => m.senderRole === 'STUDENT' && !m.readBySupervisor).length;
  }, [messages, role, sessionId]);

  return {
    messages,
    connectionState,
    unreadCount,
    sending,
    errorMessage,
    clearError: () => setErrorMessage(''),
    sendMessage,
    broadcastInstruction,
    markSessionRead,
    refresh: fetchSnapshot,
  };
}
