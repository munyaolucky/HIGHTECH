import { and, desc, eq, isNull } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../../../src/db/index.ts';
import { loginEvents, userSessions } from '../../../src/db/schema.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import { requirePortalAuth } from '../../middleware/auth.ts';

const router = Router();
router.use(requirePortalAuth);

router.get('/sessions', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.json({ success: true, data: [] });
      return;
    }
    const rows = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, pgUserId), isNull(userSessions.revokedAt)))
      .orderBy(desc(userSessions.lastActiveAt));

    res.json({
      success: true,
      data: rows.map((s) => ({
        id: s.id,
        deviceLabel: s.deviceLabel,
        ipAddress: s.ipAddress,
        rememberMe: s.rememberMe,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        isCurrent: s.id === req.portalUser?.sessionId,
      })),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch active sessions.',
    });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.status(400).json({ success: false, error: 'Portal session required.' });
      return;
    }
    await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(userSessions.id, String(req.params.id)), eq(userSessions.userId, pgUserId)));
    res.json({ success: true, data: { revoked: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to revoke session.',
    });
  }
});

router.post('/sessions/revoke-others', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.status(400).json({ success: false, error: 'Portal session required.' });
      return;
    }
    const now = new Date();
    const rows = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, pgUserId), isNull(userSessions.revokedAt)));
    for (const row of rows) {
      if (row.id !== req.portalUser?.sessionId) {
        await db.update(userSessions).set({ revokedAt: now }).where(eq(userSessions.id, row.id));
      }
    }
    res.json({ success: true, data: { revokedOthers: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to revoke other sessions.',
    });
  }
});

router.get('/login-history', async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.json({ success: true, data: [] });
      return;
    }
    const rows = await db
      .select()
      .from(loginEvents)
      .where(eq(loginEvents.userId, pgUserId))
      .orderBy(desc(loginEvents.createdAt))
      .limit(25);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch login history.',
    });
  }
});

export default router;
