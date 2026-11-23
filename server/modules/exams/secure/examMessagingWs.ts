import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { Socket } from 'node:net';
import { WebSocket, WebSocketServer } from 'ws';
import {
  resolveSessionContextFromCookieHeader,
  type AuthenticatedSessionUser,
  type PortalSessionContext,
} from '../../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../../staff/staff.permissions.ts';
import { SecureExamHttpError, secureExamService } from './secureExam.service.ts';
import type {
  ExamMessageKind,
  ExamMessagePriority,
  SecureExamMessageRecord,
} from './secureExam.types.ts';

interface ExamMessagingClient {
  ws: WebSocket;
  role: 'STUDENT' | 'SUPERVISOR';
  userId: string;
  userName: string;
  canManageExams: boolean;
  rooms: Set<string>;
  isAlive: boolean;
}

const WS_PATH = '/ws/exam-messages';

class ExamMessagingHub {
  private wss: WebSocketServer | null = null;
  private clients = new Set<ExamMessagingClient>();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  attach(server: HttpServer): WebSocketServer {
    if (this.wss) return this.wss;

    const wss = new WebSocketServer({ noServer: true });
    this.wss = wss;

    server.on('upgrade', (req, socket, head) => {
      void this.handleUpgrade(wss, req, socket as Socket, head);
    });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage, authCtx: {
      role: 'STUDENT' | 'SUPERVISOR';
      userId: string;
      userName: string;
      canManageExams: boolean;
      initialSessionId?: string;
    }) => {
      const client: ExamMessagingClient = {
        ws,
        role: authCtx.role,
        userId: authCtx.userId,
        userName: authCtx.userName,
        canManageExams: authCtx.canManageExams,
        rooms: new Set<string>(),
        isAlive: true,
      };

      this.clients.add(client);

      if (authCtx.role === 'SUPERVISOR') {
        client.rooms.add('supervisor:all');
        const initial = secureExamService.listAllSupervisorMessages(authCtx.initialSessionId);
        this.sendJson(ws, {
          type: 'exam:messages:init',
          sessionId: authCtx.initialSessionId ?? null,
          messages: initial.messages,
          unreadHelpCount: initial.unreadHelpCount,
        });
      } else if (authCtx.initialSessionId) {
        try {
          const messages = secureExamService.listSessionMessages(
            authCtx.initialSessionId,
            authCtx.userId
          );
          client.rooms.add(`session:${authCtx.initialSessionId}`);
          this.sendJson(ws, {
            type: 'exam:messages:init',
            sessionId: authCtx.initialSessionId,
            messages,
          });
        } catch {
          this.sendJson(ws, {
            type: 'exam:messages:error',
            error: 'Exam session access denied.',
          });
        }
      }

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', (raw) => {
        this.handleClientPayload(client, raw.toString('utf8'));
      });

      ws.on('close', () => {
        this.clients.delete(client);
      });

      ws.on('error', () => {
        this.clients.delete(client);
      });

      void req;
    });

    this.heartbeatTimer = setInterval(() => {
      for (const client of this.clients) {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          continue;
        }
        client.isAlive = false;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, 30_000);
    this.heartbeatTimer.unref();

    server.once('close', () => {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      for (const client of this.clients) {
        client.ws.terminate();
      }
      this.clients.clear();
      wss.close();
      if (this.wss === wss) {
        this.wss = null;
      }
    });

    return wss;
  }

  private async handleUpgrade(
    wss: WebSocketServer,
    req: IncomingMessage,
    socket: Socket,
    head: Buffer
  ): Promise<void> {
    try {
      const parsed = new URL(req.url ?? '/', 'http://localhost');
      if (parsed.pathname !== WS_PATH) {
        return;
      }

      const { staffUser, portalUser } = await resolveSessionContextFromCookieHeader(
        req.headers.cookie
      );
      if (!staffUser && !portalUser) {
        socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      const requestedRole = parsed.searchParams.get('role');
      const initialSessionId = parsed.searchParams.get('sessionId') || undefined;
      const isSupervisorCapable = Boolean(
        staffUser && staffUser.permissions.includes(STAFF_PERMISSIONS.ACADEMICS_VIEW)
      );

      let role: 'STUDENT' | 'SUPERVISOR' = 'STUDENT';
      if (requestedRole === 'supervisor') {
        if (!isSupervisorCapable) {
          socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
          socket.destroy();
          return;
        }
        role = 'SUPERVISOR';
      } else if (!portalUser && isSupervisorCapable && !initialSessionId) {
        role = 'SUPERVISOR';
      }

      const identity = resolveWsIdentity(role, portalUser, staffUser);
      if (!identity) {
        socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, {
          role,
          userId: identity.id,
          userName: identity.name,
          canManageExams: Boolean(
            staffUser && staffUser.permissions.includes(STAFF_PERMISSIONS.EXAMINATIONS_MANAGE)
          ),
          initialSessionId,
        });
      });
    } catch {
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
    }
  }

  private handleClientPayload(client: ExamMessagingClient, rawText: string): void {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      this.sendJson(client.ws, { type: 'exam:messages:error', error: 'Invalid message payload.' });
      return;
    }

    const type = String(payload.type ?? '');

    try {
      if (type === 'subscribe') {
        const sessionId =
          typeof payload.sessionId === 'string' && payload.sessionId.trim()
            ? payload.sessionId.trim()
            : undefined;

        if (client.role === 'SUPERVISOR') {
          client.rooms.add('supervisor:all');
          if (sessionId) client.rooms.add(`session:${sessionId}`);
          const snapshot = secureExamService.listAllSupervisorMessages(sessionId);
          this.sendJson(client.ws, {
            type: 'exam:messages:init',
            sessionId: sessionId ?? null,
            messages: snapshot.messages,
            unreadHelpCount: snapshot.unreadHelpCount,
          });
          return;
        }

        if (!sessionId) {
          this.sendJson(client.ws, {
            type: 'exam:messages:error',
            error: 'sessionId is required to subscribe.',
          });
          return;
        }

        const messages = secureExamService.listSessionMessages(sessionId, client.userId);
        client.rooms.add(`session:${sessionId}`);
        this.sendJson(client.ws, {
          type: 'exam:messages:init',
          sessionId,
          messages,
        });
        return;
      }

      if (type === 'exam:message:send') {
        const sessionId = String(payload.sessionId ?? '').trim();
        const body = String(payload.body ?? '');
        const priority: ExamMessagePriority =
          payload.priority === 'URGENT' ? 'URGENT' : 'NORMAL';
        const kind = payload.kind as ExamMessageKind | undefined;

        if (client.role === 'SUPERVISOR') {
          if (!client.canManageExams) {
            this.sendJson(client.ws, {
              type: 'exam:messages:error',
              error: 'Permission denied: requires examinations management privilege.',
            });
            return;
          }
          const created = secureExamService.sendSupervisorMessage({
            sessionId,
            actorId: client.userId,
            actorName: client.userName,
            priority,
            kind,
            body,
          });
          this.broadcastMessage(created);
          return;
        }

        const created = secureExamService.sendStudentHelpMessage({
          sessionId,
          studentId: client.userId,
          priority,
          kind,
          body,
        });
        this.broadcastMessage(created);
        return;
      }

      if (type === 'exam:messages:read') {
        const sessionId = String(payload.sessionId ?? '').trim();
        if (!sessionId) return;
        secureExamService.markSessionMessagesRead({
          sessionId,
          readerRole: client.role,
          studentId: client.role === 'STUDENT' ? client.userId : undefined,
        });
        this.broadcastReadReceipt(sessionId, client.role);
      }
    } catch (err) {
      const msg =
        err instanceof SecureExamHttpError
          ? err.message
          : 'Unable to process exam messaging request.';
      this.sendJson(client.ws, { type: 'exam:messages:error', error: msg });
    }
  }

  broadcastMessage(message: SecureExamMessageRecord): void {
    const packet = JSON.stringify({
      type: 'exam:message:created',
      message,
    });
    const sessionRoom = `session:${message.sessionId}`;
    for (const client of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      if (client.rooms.has(sessionRoom) || client.rooms.has('supervisor:all')) {
        client.ws.send(packet);
      }
    }
  }

  broadcastMessages(messages: SecureExamMessageRecord[]): void {
    for (const msg of messages) {
      this.broadcastMessage(msg);
    }
  }

  broadcastReadReceipt(sessionId: string, readerRole: 'STUDENT' | 'SUPERVISOR'): void {
    const packet = JSON.stringify({
      type: 'exam:messages:read',
      sessionId,
      readerRole,
    });
    const sessionRoom = `session:${sessionId}`;
    for (const client of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      if (client.rooms.has(sessionRoom) || client.rooms.has('supervisor:all')) {
        client.ws.send(packet);
      }
    }
  }

  private sendJson(ws: WebSocket, data: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

function resolveWsIdentity(
  role: 'STUDENT' | 'SUPERVISOR',
  portalUser?: PortalSessionContext,
  staffUser?: AuthenticatedSessionUser
): { id: string; name: string } | null {
  if (role === 'SUPERVISOR' && staffUser) {
    return { id: staffUser.id, name: staffUser.fullName };
  }
  if (portalUser) {
    return { id: portalUser.uid, name: portalUser.fullName };
  }
  if (staffUser) {
    return { id: staffUser.id, name: staffUser.fullName };
  }
  return null;
}

export const examMessagingHub = new ExamMessagingHub();
export function attachExamMessagingWebSocket(server: HttpServer): WebSocketServer {
  return examMessagingHub.attach(server);
}
