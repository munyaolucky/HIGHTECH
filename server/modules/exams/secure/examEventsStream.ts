import type { Response } from 'express';

export type ExamStreamEventName =
  | 'candidate.started'
  | 'candidate.heartbeat'
  | 'candidate.disconnected'
  | 'candidate.reconnected'
  | 'candidate.submitted'
  | 'candidate.expired'
  | 'incident.created'
  | 'supervisor.action';

interface StreamSubscriber {
  id: string;
  examId?: string;
  res: Response;
  heartbeatTimer: ReturnType<typeof setInterval>;
}

const subscribers = new Set<StreamSubscriber>();

export const examEventsStream = {
  subscribe(res: Response, examId?: string): () => void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const id = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        // Ignore broken pipe; close handler cleans up
      }
    }, 25_000);
    heartbeatTimer.unref?.();

    const sub: StreamSubscriber = { id, examId, res, heartbeatTimer };
    subscribers.add(sub);

    try {
      res.write(
        `event: connected\ndata: ${JSON.stringify({
          subscribedAt: new Date().toISOString(),
          examId: examId ?? 'ALL',
        })}\n\n`
      );
    } catch {
      // Ignore write error
    }

    return () => {
      clearInterval(sub.heartbeatTimer);
      subscribers.delete(sub);
    };
  },

  publish(event: ExamStreamEventName, payload: Record<string, unknown> & { examId?: string }) {
    const serialized = `event: ${event}\ndata: ${JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    })}\n\n`;

    for (const sub of subscribers) {
      if (sub.examId && payload.examId && sub.examId !== payload.examId) {
        continue;
      }
      try {
        sub.res.write(serialized);
      } catch {
        clearInterval(sub.heartbeatTimer);
        subscribers.delete(sub);
      }
    }
  },
};
