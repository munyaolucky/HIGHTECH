/**
 * Single Source of Truth for Cookies & Browser Storage Governance
 * Aligned with COOKIES.md & Kenya Data Protection Act, 2019 (Draft Policy)
 */

export const CONSENT_VERSION = '2026-11-v1';

export type ConsentCategory = 'strictly_necessary' | 'preferences';

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
  updatedAt: string;
}

export const CONSENT_STORAGE_KEY = 'hitech.consent';

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
    purpose: "Remembers the visitor's cookie and browser storage consent choice.",
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
    category: 'preferences',
    purpose: 'Saved display theme, accent contrast, and accessibility text size.',
    lifetime: 'Until cleared or consent withdrawn',
    keyPattern: 'hitech-display-preferences:',
  },
  {
    name: 'hitech.learning-canvas.v1.<user>',
    kind: 'Local storage',
    category: 'preferences',
    purpose: 'Saved interactive learning & network architecture diagrams.',
    lifetime: 'Until cleared or consent withdrawn',
    keyPattern: 'hitech.learning-canvas.v1.',
  },
];

export const OPTIONAL_CATEGORIES_IN_USE = {
  analytics: false,
  advertising: false,
  preferences: true,
};

export function getConsentRecord(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed || parsed.version !== CONSENT_VERSION) {
      return null;
    }
    // Enforce 12-month expiry
    const updatedMs = new Date(parsed.updatedAt).getTime();
    if (!Number.isFinite(updatedMs) || Date.now() - updatedMs > 365 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function canStore(category: ConsentCategory): boolean {
  if (category === 'strictly_necessary') return true;
  const record = getConsentRecord();
  return Boolean(record && record.preferences === true);
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

export function saveConsentChoice(preferencesAccepted: boolean): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    strictlyNecessary: true,
    preferences: preferencesAccepted,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    if (!preferencesAccepted) {
      clearOptionalPreferenceKeys();
    }
  } catch {
    // Ignore storage write errors
  }
  return record;
}
