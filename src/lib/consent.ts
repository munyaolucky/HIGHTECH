/**
 * Single Source of Truth for Cookies, Tracking-Script Blocking & Storage Governance
 * Aligned with COOKIES.md & Kenya Data Protection Act, 2019 (ODPC)
 */

export const CONSENT_VERSION = '2026-11-v1';
export const CONSENT_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';
export type ConsentCategory = 'strictly_necessary' | 'preferences' | CookieCategory;
export type ConsentActionType = 'accept_all' | 'reject_optional' | 'customize' | 'withdraw';
export type ConsentNoticeReason = 'policy_updated' | 'expired' | null;

export interface CookiePreferences {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface StorageInventoryItem {
  name: string;
  kind: 'Cookie' | 'Local storage' | 'Cache storage';
  category: ConsentCategory;
  purpose: string;
  lifetime: string;
  keyPattern: string;
}

export interface ConsentRecord {
  version: string;
  strictlyNecessary: true;
  preferences: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  expiresAt: string;
}

export interface ConsentGateEntry {
  id: string;
  category: Exclude<CookieCategory, 'necessary'>;
  activate: () => void;
  deactivate?: () => void;
  active: boolean;
}

export interface BlockedScriptEvent {
  id: string;
  category: Exclude<CookieCategory, 'necessary'>;
  src?: string;
  reason: 'no_consent' | 'withdrawn';
  timestamp: string;
}

export const CONSENT_STORAGE_KEY = 'hitech.consent';
export const LEGACY_CONSENT_STORAGE_KEY = 'hitech-cookie-consent';
export const CONSENT_CHANGED_EVENT = 'hitech:cookie-consent-changed';

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export const OPTIONAL_BROWSER_COOKIE_NAMES = [
  '_ga',
  '_gid',
  '_gat',
  '_fbp',
  'hitech_analytics',
  'hitech_marketing',
];

export const STORAGE_INVENTORY: StorageInventoryItem[] = [
  {
    name: 'hitech_refresh',
    kind: 'Cookie',
    category: 'strictly_necessary',
    purpose: 'Session renewal after sign-in; HttpOnly, SameSite=Strict, Secure in production; removed on sign-out.',
    lifetime: '7 days (max 30 days)',
    keyPattern: 'hitech_refresh',
  },
  {
    name: 'hitech.consent',
    kind: 'Local storage',
    category: 'strictly_necessary',
    purpose: "Remembers the visitor's cookie and browser storage consent choice & policy version.",
    lifetime: '12 months, or until CONSENT_VERSION changes',
    keyPattern: 'hitech.consent',
  },
  {
    name: 'hitech-shell-v1',
    kind: 'Cache storage',
    category: 'strictly_necessary',
    purpose: 'Public application shell files for resilient loading only.',
    lifetime: 'Until the app updates',
    keyPattern: 'hitech-shell-v1',
  },
  {
    name: 'hitech-display-preferences:<user>',
    kind: 'Local storage',
    category: 'functional',
    purpose: 'Saved display theme, accent contrast, and accessibility text size.',
    lifetime: 'Until cleared or consent withdrawn',
    keyPattern: 'hitech-display-preferences:',
  },
  {
    name: 'hitech.learning-canvas.v1.<user>',
    kind: 'Local storage',
    category: 'functional',
    purpose: 'Saved interactive learning & network architecture diagrams.',
    lifetime: 'Until cleared or consent withdrawn',
    keyPattern: 'hitech.learning-canvas.v1.',
  },
];

export const OPTIONAL_CATEGORIES_IN_USE = {
  analytics: false,
  advertising: false,
  preferences: true,
  functional: true,
  marketing: false,
};

const registeredGates = new Map<string, ConsentGateEntry>();
const blockedScripts: BlockedScriptEvent[] = [];

function parseRawConsentObject(): (Omit<Partial<ConsentRecord>, 'preferences'> & {
  preferences?: boolean | Partial<CookiePreferences>;
}) | null {
  try {
    const raw =
      localStorage.getItem(CONSENT_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Omit<Partial<ConsentRecord>, 'preferences'> & {
      preferences?: boolean | Partial<CookiePreferences>;
    };
  } catch {
    return null;
  }
}

function normalizeConsentRecord(raw: unknown): ConsentRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Omit<Partial<ConsentRecord>, 'preferences'> & {
    preferences?: boolean | Partial<CookiePreferences>;
  };

  if (candidate.version !== CONSENT_VERSION) {
    return null;
  }

  const updatedMs = new Date(candidate.updatedAt || '').getTime();
  if (!Number.isFinite(updatedMs) || Date.now() - updatedMs > CONSENT_LIFETIME_MS) {
    return null;
  }

  const expiresMs = candidate.expiresAt
    ? new Date(candidate.expiresAt).getTime()
    : updatedMs + CONSENT_LIFETIME_MS;
  if (!Number.isFinite(expiresMs) || Date.now() > expiresMs) {
    return null;
  }

  let functional = false;
  let analytics = false;
  let marketing = false;

  if (typeof candidate.functional === 'boolean') {
    functional = candidate.functional;
  } else if (typeof candidate.preferences === 'boolean') {
    functional = candidate.preferences;
  } else if (candidate.preferences && typeof candidate.preferences === 'object') {
    const nested = candidate.preferences as Partial<CookiePreferences>;
    functional = Boolean(nested.functional);
    analytics = Boolean(nested.analytics);
    marketing = Boolean(nested.marketing);
  }

  if (typeof candidate.analytics === 'boolean') {
    analytics = candidate.analytics;
  }
  if (typeof candidate.marketing === 'boolean') {
    marketing = candidate.marketing;
  }

  return {
    version: CONSENT_VERSION,
    strictlyNecessary: true,
    preferences: functional,
    functional,
    analytics,
    marketing,
    updatedAt: new Date(updatedMs).toISOString(),
    expiresAt: new Date(expiresMs).toISOString(),
  };
}

export function getConsentNoticeReason(): ConsentNoticeReason {
  const candidate = parseRawConsentObject();
  if (!candidate) return null;
  if (candidate.version !== CONSENT_VERSION) return 'policy_updated';
  const updatedMs = new Date(candidate.updatedAt || '').getTime();
  const expiresMs = candidate.expiresAt
    ? new Date(candidate.expiresAt).getTime()
    : updatedMs + CONSENT_LIFETIME_MS;
  if (!Number.isFinite(updatedMs) || !Number.isFinite(expiresMs) || Date.now() > expiresMs) {
    return 'expired';
  }
  return null;
}

export function getConsentRecord(): ConsentRecord | null {
  const candidate = parseRawConsentObject();
  if (!candidate) return null;
  return normalizeConsentRecord(candidate);
}

export function getPreferencesFromRecord(record: ConsentRecord | null): CookiePreferences {
  if (!record) return { ...DEFAULT_COOKIE_PREFERENCES };
  return {
    necessary: true,
    functional: Boolean(record.functional),
    analytics: Boolean(record.analytics),
    marketing: Boolean(record.marketing),
  };
}

export function canUseCookieCategory(category: CookieCategory): boolean {
  if (category === 'necessary') return true;
  const record = getConsentRecord();
  if (!record) return false;
  return Boolean(record[category]);
}

export function canStore(category: ConsentCategory): boolean {
  if (category === 'strictly_necessary' || category === 'necessary') return true;
  if (category === 'preferences' || category === 'functional') {
    return canUseCookieCategory('functional');
  }
  if (category === 'analytics') return canUseCookieCategory('analytics');
  if (category === 'marketing') return canUseCookieCategory('marketing');
  return false;
}

export function clearOptionalPreferenceKeys(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('hitech-display-preferences:') ||
          key.startsWith('hitech.learning-canvas.v1.'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage access errors
  }
}

export function clearOptionalBrowserCookies(): void {
  if (typeof document === 'undefined') return;
  try {
    const existing = document.cookie
      .split(';')
      .map((pair) => pair.split('=')[0]?.trim())
      .filter(Boolean);
    const toExpire = new Set([...OPTIONAL_BROWSER_COOKIE_NAMES, ...existing.filter((n) => n.startsWith('_ga') || n.startsWith('hitech_opt_'))]);
    toExpire.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    });
  } catch {
    // Ignore cookie mutation errors in restricted environments
  }
}

function teardownBlockedCategoryScripts(category: Exclude<CookieCategory, 'necessary'>): void {
  if (typeof document === 'undefined') return;
  try {
    const nodes = document.querySelectorAll(`script[data-consent-category="${category}"]`);
    nodes.forEach((node) => node.parentNode?.removeChild(node));
  } catch {
    // Ignore DOM cleanup errors in SSR
  }
}

function recordBlockedEvent(
  id: string,
  category: Exclude<CookieCategory, 'necessary'>,
  reason: 'no_consent' | 'withdrawn',
  src?: string
): void {
  blockedScripts.unshift({
    id,
    category,
    src,
    reason,
    timestamp: new Date().toISOString(),
  });
  if (blockedScripts.length > 50) {
    blockedScripts.length = 50;
  }
}

export function syncConsentGates(): void {
  for (const gate of registeredGates.values()) {
    const allowed = canUseCookieCategory(gate.category);
    if (allowed && !gate.active) {
      gate.active = true;
      gate.activate();
    } else if (!allowed) {
      if (gate.active) {
        gate.active = false;
        gate.deactivate?.();
        recordBlockedEvent(gate.id, gate.category, 'withdrawn');
      }
      teardownBlockedCategoryScripts(gate.category);
    }
  }
}

export function registerConsentGate(options: {
  id: string;
  category: Exclude<CookieCategory, 'necessary'>;
  activate: () => void;
  deactivate?: () => void;
}): () => void {
  const existing = registeredGates.get(options.id);
  const entry: ConsentGateEntry = {
    id: options.id,
    category: options.category,
    activate: options.activate,
    deactivate: options.deactivate,
    active: existing?.active ?? false,
  };
  registeredGates.set(options.id, entry);

  if (canUseCookieCategory(entry.category)) {
    entry.active = true;
    entry.activate();
  } else {
    if (existing?.active) {
      entry.deactivate?.();
    }
    entry.active = false;
    recordBlockedEvent(entry.id, entry.category, 'no_consent');
  }

  return () => {
    const current = registeredGates.get(options.id);
    if (current?.active) {
      current.deactivate?.();
    }
    registeredGates.delete(options.id);
  };
}

export function loadOptionalScript(options: {
  id: string;
  src: string;
  category: Exclude<CookieCategory, 'necessary'>;
  async?: boolean;
  defer?: boolean;
}): boolean {
  if (!canUseCookieCategory(options.category)) {
    recordBlockedEvent(options.id, options.category, 'no_consent', options.src);
    return false;
  }
  if (typeof document === 'undefined') {
    return true;
  }
  const existing = document.getElementById(options.id);
  if (existing) {
    return true;
  }
  const script = document.createElement('script');
  script.id = options.id;
  script.src = options.src;
  script.async = options.async ?? true;
  script.defer = options.defer ?? true;
  script.setAttribute('data-consent-category', options.category);
  document.head.appendChild(script);
  return true;
}

export function getBlockedScriptEvents(): BlockedScriptEvent[] {
  return [...blockedScripts];
}

export function resetBlockedScriptEventsForTest(): void {
  blockedScripts.length = 0;
  registeredGates.clear();
}

function sendAnonymizedConsentAudit(record: ConsentRecord, action: ConsentActionType): void {
  if (typeof fetch !== 'function' || typeof window === 'undefined') return;
  try {
    void fetch('/api/public/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        version: record.version,
        functional: record.functional,
        analytics: record.analytics,
        marketing: record.marketing,
        action,
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking audit telemetry
  }
}

export function saveConsentPreferences(
  prefs: Pick<CookiePreferences, 'functional' | 'analytics' | 'marketing'>,
  action?: ConsentActionType
): ConsentRecord {
  const now = Date.now();
  const resolvedAction: ConsentActionType =
    action ??
    (prefs.functional && prefs.analytics && prefs.marketing
      ? 'accept_all'
      : !prefs.functional && !prefs.analytics && !prefs.marketing
      ? 'reject_optional'
      : 'customize');

  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    strictlyNecessary: true,
    preferences: Boolean(prefs.functional),
    functional: Boolean(prefs.functional),
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    updatedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CONSENT_LIFETIME_MS).toISOString(),
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    if (!record.functional) {
      clearOptionalPreferenceKeys();
    }
    if (!record.analytics || !record.marketing) {
      clearOptionalBrowserCookies();
    }
    syncConsentGates();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: record }));
    }
    sendAnonymizedConsentAudit(record, resolvedAction);
  } catch {
    // Ignore storage write errors
  }

  return record;
}

export function withdrawOptionalConsent(): ConsentRecord {
  return saveConsentPreferences(
    {
      functional: false,
      analytics: false,
      marketing: false,
    },
    'withdraw'
  );
}

export function saveConsentChoice(preferencesAccepted: boolean): ConsentRecord {
  return saveConsentPreferences(
    {
      functional: preferencesAccepted,
      analytics: false,
      marketing: false,
    },
    preferencesAccepted ? 'customize' : 'reject_optional'
  );
}

export function initializeAnalytics(): boolean {
  const allowed = canUseCookieCategory('analytics');
  if (!allowed) {
    recordBlockedEvent('hitech-analytics-runtime', 'analytics', 'no_consent');
    return false;
  }
  return true;
}

export function initializeMarketing(): boolean {
  const allowed = canUseCookieCategory('marketing');
  if (!allowed) {
    recordBlockedEvent('hitech-marketing-runtime', 'marketing', 'no_consent');
    return false;
  }
  return true;
}
