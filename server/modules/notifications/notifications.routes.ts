import crypto from 'node:crypto';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../../../src/db/index.ts';
import {
  broadcastCampaigns,
  notificationDeliveries,
  notificationPreferences,
  notificationTemplates,
  notifications,
  pushSubscriptions,
  users,
} from '../../../src/db/schema.ts';
import { ensurePostgresSeeded } from '../../lib/pg-sync.ts';
import { requireAuth, requirePortalAuth } from '../../middleware/auth.ts';

const router = Router();

const DEFAULT_CATEGORIES = ['SECURITY', 'ACADEMIC', 'DOCUMENT', 'FINANCE', 'ADMISSIONS', 'GENERAL'] as const;
const BROADCAST_ROLES = new Set([
  'ADMIN',
  'PRINCIPAL',
  'REGISTRAR',
  'COMMUNICATIONS_OFFICER',
  'STUDENT_AFFAIRS',
  'IT_SUPPORT',
]);

// User Notification Center Endpoints
router.get('/', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.json({ success: true, data: { items: [], unreadCount: 0 } });
      return;
    }

    const category = String(req.query.category ?? 'ALL').toUpperCase();
    const unreadOnly = req.query.unreadOnly === 'true';
    const includeArchived = req.query.archived === 'true';

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientUserId, pgUserId))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    const filtered = rows.filter((n) => {
      if (!includeArchived && n.archivedAt) return false;
      if (includeArchived && !n.archivedAt) return false;
      if (category !== 'ALL' && n.category !== category) return false;
      if (unreadOnly && n.readAt) return false;
      return true;
    });

    const unreadCount = rows.filter((n) => !n.readAt && !n.archivedAt).length;

    res.json({
      success: true,
      data: {
        items: filtered,
        unreadCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch notifications.',
    });
  }
});

router.get('/unread-count', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.json({ success: true, data: { unreadCount: 0 } });
      return;
    }
    const [{ value }] = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientUserId, pgUserId),
          isNull(notifications.readAt),
          isNull(notifications.archivedAt)
        )
      );
    res.json({ success: true, data: { unreadCount: Number(value) } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch unread count.',
    });
  }
});

router.post('/read-all', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.json({ success: true, data: { updated: true } });
      return;
    }
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.recipientUserId, pgUserId), isNull(notifications.readAt)));
    res.json({ success: true, data: { updated: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to mark notifications read.',
    });
  }
});

router.post('/:id/read', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.status(400).json({ success: false, error: 'Portal user required.' });
      return;
    }
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, String(req.params.id)),
          eq(notifications.recipientUserId, pgUserId)
        )
      );
    res.json({ success: true, data: { read: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to mark notification read.',
    });
  }
});

router.post('/:id/archive', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.status(400).json({ success: false, error: 'Portal user required.' });
      return;
    }
    await db
      .update(notifications)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(notifications.id, String(req.params.id)),
          eq(notifications.recipientUserId, pgUserId)
        )
      );
    res.json({ success: true, data: { archived: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to archive notification.',
    });
  }
});

// Notification Preferences
router.get('/preferences', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.json({ success: true, data: [] });
      return;
    }
    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, pgUserId));

    const map = new Map(existing.map((p) => [p.category, p]));
    const items = DEFAULT_CATEGORIES.map((category) => {
      const row = map.get(category);
      return {
        category,
        mandatory: category === 'SECURITY',
        inAppEnabled: category === 'SECURITY' ? true : (row?.inAppEnabled ?? true),
        emailEnabled: row?.emailEnabled ?? true,
        smsEnabled: row?.smsEnabled ?? false,
        pushEnabled: row?.pushEnabled ?? true,
      };
    });

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to fetch notification preferences.',
    });
  }
});

router.put('/preferences', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.status(400).json({ success: false, error: 'Portal user required.' });
      return;
    }
    const items = Array.isArray(req.body?.preferences) ? req.body.preferences : [];
    for (const pref of items) {
      const category = String(pref.category ?? '').toUpperCase();
      if (!DEFAULT_CATEGORIES.includes(category as (typeof DEFAULT_CATEGORIES)[number])) continue;

      // Mandatory SECURITY category cannot disable in-app security alerts
      const inAppEnabled = category === 'SECURITY' ? true : Boolean(pref.inAppEnabled);
      const emailEnabled = category === 'SECURITY' ? true : Boolean(pref.emailEnabled);
      const smsEnabled = Boolean(pref.smsEnabled);
      const pushEnabled = Boolean(pref.pushEnabled);

      await db
        .insert(notificationPreferences)
        .values({
          userId: pgUserId,
          category,
          inAppEnabled,
          emailEnabled,
          smsEnabled,
          pushEnabled,
        })
        .onConflictDoUpdate({
          target: [notificationPreferences.userId, notificationPreferences.category],
          set: {
            inAppEnabled,
            emailEnabled,
            smsEnabled,
            pushEnabled,
            updatedAt: new Date(),
          },
        });
    }
    res.json({ success: true, data: { updated: true } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to save preferences.',
    });
  }
});

router.post('/push-subscribe', requirePortalAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const pgUserId = req.portalUser?.pgUserId;
    if (!pgUserId) {
      res.status(400).json({ success: false, error: 'Portal user required.' });
      return;
    }
    const endpoint = String(
      req.body?.endpoint || `https://push.hitech.ac.ke/sub/${crypto.randomBytes(8).toString('hex')}`
    );
    const deviceLabel = String(req.body?.deviceLabel || 'Portal Web Browser');

    const [created] = await db
      .insert(pushSubscriptions)
      .values({
        id: `push-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: pgUserId,
        endpoint,
        deviceLabel,
        active: true,
      })
      .returning();

    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Push registration failed.',
    });
  }
});

// Staff & Admin Broadcast Communications
router.get('/admin/templates', requireAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    const rows = await db.select().from(notificationTemplates);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load templates.',
    });
  }
});

router.get('/admin/campaigns', requireAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    if (!req.staffUser || !BROADCAST_ROLES.has(req.staffUser.role)) {
      res.status(403).json({ success: false, error: 'Communication campaigns require authorized staff privileges.' });
      return;
    }
    const campaigns = await db
      .select()
      .from(broadcastCampaigns)
      .orderBy(desc(broadcastCampaigns.createdAt))
      .limit(30);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load broadcast campaigns.',
    });
  }
});

router.post('/admin/broadcast', requireAuth, async (req, res) => {
  try {
    await ensurePostgresSeeded();
    if (!req.staffUser || !BROADCAST_ROLES.has(req.staffUser.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied: publishing broadcasts requires Communications, Registrar, Principal, or Admin role.',
      });
      return;
    }

    const title = String(req.body?.title ?? '').trim();
    const message = String(req.body?.message ?? '').trim();
    const category = String(req.body?.category ?? 'GENERAL').toUpperCase();
    const targetAudience = String(req.body?.targetAudience ?? 'ALL_USERS').toUpperCase();
    const targetScopeValue = req.body?.targetScopeValue ? String(req.body.targetScopeValue) : null;
    const priority = String(req.body?.priority ?? 'NORMAL').toUpperCase();
    const channels = Array.isArray(req.body?.channels) && req.body.channels.length > 0
      ? req.body.channels.map((c: unknown) => String(c).toUpperCase())
      : ['IN_APP'];

    if (!title || !message) {
      res.status(400).json({ success: false, error: 'Title and message are required for a broadcast.' });
      return;
    }

    const allUsers = await db.select().from(users).where(eq(users.accountStatus, 'ACTIVE'));
    const recipients = allUsers.filter((u) => {
      if (targetAudience === 'ALL_STUDENTS') return u.primaryRole === 'STUDENT';
      if (targetAudience === 'ALL_STAFF') return u.primaryRole !== 'STUDENT' && u.primaryRole !== 'PARENT';
      if (targetAudience === 'CAMPUS' && targetScopeValue) return u.campusId === targetScopeValue;
      if (targetAudience === 'ROLE' && targetScopeValue) return u.primaryRole === targetScopeValue;
      return true;
    });

    const campaignId = `cmp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const [campaign] = await db
      .insert(broadcastCampaigns)
      .values({
        id: campaignId,
        title,
        category,
        targetAudience,
        targetScopeValue,
        channels,
        message,
        recipientCount: recipients.length,
        sentByUserId: req.portalUser?.pgUserId ?? null,
        sentByName: req.staffUser.fullName,
      })
      .returning();

    for (const recipient of recipients) {
      const notifId = `notif-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await db.insert(notifications).values({
        id: notifId,
        recipientUserId: recipient.id,
        category,
        priority,
        title,
        message,
        senderName: `${req.staffUser.fullName} (${req.staffUser.roleTitle})`,
        metadata: { campaignId },
      });
      for (const ch of channels) {
        await db.insert(notificationDeliveries).values({
          id: `ndel-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          notificationId: notifId,
          channel: ch,
          status: 'DELIVERED',
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        campaign,
        dispatchedCount: recipients.length,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to dispatch broadcast.',
    });
  }
});

export default router;
