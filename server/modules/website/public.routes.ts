import crypto from 'node:crypto';
import { Router } from 'express';
import { getDb, saveDb } from '../../data/store.ts';
import { websiteService } from './website.service.ts';

const router = Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Unauthenticated Public College Website APIs.
 * STRICT PRIVACY: Only PUBLISHED + showOnPublicWebsite records are exposed;
 * phone numbers, home addresses, contracts, and salary bands are stripped.
 */
router.get('/staff', (req, res) => {
  const data = websiteService.listPublicStaff({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    departmentId: typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 12,
  });
  res.json({ success: true, data });
});

router.get('/staff/:slug', (req, res) => {
  const profile = websiteService.getPublicStaffBySlug(String(req.params.slug));
  if (!profile) {
    res.status(404).json({
      success: false,
      error: 'Published staff profile not found.',
    });
    return;
  }
  res.json({ success: true, data: profile });
});

router.get('/departments', (req, res) => {
  const data = websiteService.listPublicDepartments({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 12,
  });
  res.json({ success: true, data });
});

router.get('/departments/:slug', (req, res) => {
  const department = websiteService.getPublicDepartmentBySlug(String(req.params.slug));
  if (!department) {
    res.status(404).json({
      success: false,
      error: 'Published department profile not found.',
    });
    return;
  }
  res.json({ success: true, data: department });
});

router.post('/newsletter/subscribe', (req, res) => {
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const source = typeof req.body?.source === 'string' && req.body.source.trim()
    ? req.body.source.trim().slice(0, 48)
    : 'website-footer';

  if (!rawEmail || !EMAIL_PATTERN.test(rawEmail)) {
    res.status(400).json({
      success: false,
      error: 'Please enter a valid email address.',
    });
    return;
  }

  const db = getDb();
  const existing = db.newsletterSubscribers.find((sub) => sub.email === rawEmail);
  if (existing) {
    res.status(200).json({
      success: true,
      data: {
        alreadySubscribed: true,
        email: existing.email,
        message: 'This email address is already subscribed to HI-TECH College updates.',
      },
    });
    return;
  }

  const record = {
    id: `news-sub-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    email: rawEmail,
    source,
    status: 'ACTIVE' as const,
    subscribedAt: new Date().toISOString(),
  };

  db.newsletterSubscribers.unshift(record);
  saveDb(db);

  res.status(201).json({
    success: true,
    data: {
      alreadySubscribed: false,
      email: record.email,
      message: 'Thank you! Your subscription has been confirmed.',
    },
  });
});

const ALLOWED_CONSENT_ACTIONS = new Set([
  'accept_all',
  'reject_optional',
  'customize',
  'withdraw',
]);

router.post('/cookie-consent', (req, res) => {
  const version =
    typeof req.body?.version === 'string' && req.body.version.trim()
      ? req.body.version.trim().slice(0, 32)
      : '2026-11-v1';
  const rawAction = typeof req.body?.action === 'string' ? req.body.action.trim() : 'customize';
  const action = ALLOWED_CONSENT_ACTIONS.has(rawAction)
    ? (rawAction as 'accept_all' | 'reject_optional' | 'customize' | 'withdraw')
    : 'customize';

  const record = {
    id: `consent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    version,
    action,
    functional: Boolean(req.body?.functional),
    analytics: Boolean(req.body?.analytics),
    marketing: Boolean(req.body?.marketing),
    recordedAt: new Date().toISOString(),
  };

  const db = getDb();
  db.cookieConsentAudits.unshift(record);
  if (db.cookieConsentAudits.length > 500) {
    db.cookieConsentAudits.length = 500;
  }
  saveDb(db);

  res.status(201).json({
    success: true,
    data: {
      id: record.id,
      version: record.version,
      action: record.action,
      recordedAt: record.recordedAt,
    },
  });
});

export default router;
