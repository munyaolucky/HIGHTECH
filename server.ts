import http from 'node:http';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import staffRoutes from './server/modules/staff/staff.routes.ts';
import usersRoutes from './server/modules/users/users.routes.ts';
import documentsRoutes from './server/modules/documents/documents.routes.ts';
import registrationRoutes from './server/modules/registration/registration.routes.ts';
import authRoutes from './server/modules/auth/auth.routes.ts';
import mfaRoutes from './server/modules/mfa/mfa.routes.ts';
import accountRoutes from './server/modules/account/account.routes.ts';
import notificationsRoutes from './server/modules/notifications/notifications.routes.ts';
import signaturesRoutes from './server/modules/signatures/signatures.routes.ts';
import sisRoutes from './server/modules/sis/sis.routes.ts';
import platformRoutes from './server/modules/platform/platform.routes.ts';
import publicWebsiteRoutes from './server/modules/website/public.routes.ts';
import websiteCmsRoutes from './server/modules/website/website.routes.ts';
import admissionsRoutes from './server/modules/admissions/admissions.routes.ts';
import {
  publicEventsRoutes,
  staffEventsRoutes,
} from './server/modules/events/events.routes.ts';
import {
  absenceRoutes,
  managementRoutes,
  teachingRoutes,
} from './server/modules/teaching/teaching.routes.ts';
import {
  studentSecureExamRoutes,
  supervisorSecureExamRoutes,
} from './server/modules/exams/secure/secureExam.routes.ts';
import { secureExamService } from './server/modules/exams/secure/secureExam.service.ts';
import { attachExamMessagingWebSocket } from './server/modules/exams/secure/examMessagingWs.ts';
import {
  mpesaWebhookRoutes,
  staffFinanceRoutes,
  studentFeesRoutes,
} from './server/modules/finance/finance.routes.ts';
import { isPostgresConfigured } from './src/db/index.ts';
import { ensurePostgresSeeded } from './server/lib/pg-sync.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT ?? 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '35mb' }));

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', service: 'hi-tech-college-portal' });
  });

  // Lazy Cloud SQL initialization & store hydration on first incoming API request
  app.use('/api', async (req, _res, next) => {
    if (req.path !== '/health' && isPostgresConfigured()) {
      try {
        await ensurePostgresSeeded();
      } catch (err) {
        console.error('Lazy Cloud SQL seed/hydration warning:', err);
      }
    }
    next();
  });

  // Backend API Modules
  app.use('/api/public/events', publicEventsRoutes);
  app.use('/api/public', publicWebsiteRoutes);
  app.use('/api/website', websiteCmsRoutes);
  app.use('/api/events', staffEventsRoutes);
  app.use('/api/admissions', admissionsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/mfa', mfaRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/signatures', signaturesRoutes);
  app.use('/api/registrations', registrationRoutes);
  app.use('/api/sis', sisRoutes);
  app.use('/api/platform', platformRoutes);
  app.use('/api/teaching', teachingRoutes);
  app.use('/api/absence', absenceRoutes);
  app.use('/api/management', managementRoutes);
  app.use('/api/student/exam-sessions', studentSecureExamRoutes);
  app.use('/api/exams/supervisor', supervisorSecureExamRoutes);
  app.use('/api/student/fees', studentFeesRoutes);
  app.use('/api/payments', mpesaWebhookRoutes);
  app.use('/api/finance', staffFinanceRoutes);

  // Explicit 404 for unknown API paths so HTML fallback never masks missing routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'API endpoint not found.' });
  });

  // Structured API error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    res.status(500).json({ success: false, error: message });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Server-authoritative expiry sweep for active exam sessions (single coordinated interval)
  setInterval(() => {
    try {
      secureExamService.expireActiveSessions();
    } catch {
      // Ignore transient sweep errors
    }
  }, 60_000).unref();

  attachExamMessagingWebSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HI-TECH College full-stack portal listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HI-TECH College server:', err);
  process.exit(1);
});
