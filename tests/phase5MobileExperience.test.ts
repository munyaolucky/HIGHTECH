import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function installMemoryStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

installMemoryStorage();

const { default: MobileStudentCompanion } = await import(
  '../src/modules/student/components/MobileStudentCompanion.tsx'
);
const { Phase4ModuleSkeleton } = await import('../src/components/ui/PortalUI.tsx');

beforeEach(() => {
  globalThis.localStorage.clear();
});

const TAB_EXPECTATIONS: Array<{
  tab:
    | 'today'
    | 'learning'
    | 'assignments'
    | 'documents'
    | 'assessments'
    | 'support'
    | 'alerts-pay';
  expectedHeading: string;
}> = [
  { tab: 'today', expectedHeading: 'Mobile Timetable Companion' },
  { tab: 'learning', expectedHeading: 'E-Learning Modules' },
  { tab: 'assignments', expectedHeading: 'Coursework &amp; Mobile File Submissions' },
  { tab: 'documents', expectedHeading: 'Instant Official Downloads' },
  { tab: 'assessments', expectedHeading: 'Exam Eligibility &amp; Mobile CBT Access' },
  { tab: 'support', expectedHeading: 'Create Helpdesk Ticket' },
  { tab: 'alerts-pay', expectedHeading: 'Lipa na M-Pesa Mobile Pay' },
];

test('MobileStudentCompanion renders all 7 Phase 5 mobile workflows with touch targets and zero anti-patterns', () => {
  for (const { tab, expectedHeading } of TAB_EXPECTATIONS) {
    const html = renderToStaticMarkup(
      React.createElement(MobileStudentCompanion, {
        headerBlock: React.createElement('div', null, 'Header'),
        initialTab: tab,
        onNavigate: () => {},
        onNotify: () => {},
        onRefresh: () => {},
        onSwitchPortal: () => {},
      })
    );

    assert.equal(html.includes('animate-pulse'), false, `${tab}: must not use animate-pulse`);
    assert.equal(/\sstyle="/i.test(html), false, `${tab}: must not emit inline style attributes`);
    assert.match(html, /min-h-\[44px\]/, `${tab}: must include >=44px touch targets`);
    assert.match(html, /role="tablist"/, `${tab}: must expose accessible tablist`);
    assert.equal(
      html.includes(expectedHeading),
      true,
      `${tab}: expected heading "${expectedHeading}"`
    );
  }
});

test('Phase4ModuleSkeleton supports mobile-companion transition skeleton cleanly', () => {
  const html = renderToStaticMarkup(
    React.createElement(Phase4ModuleSkeleton, {
      section: 'mobile-companion',
      includeHeader: true,
    })
  );
  assert.equal(html.includes('animate-pulse'), false);
  assert.equal(/\sstyle="/i.test(html), false);
  assert.match(html, /Loading mobile companion module\.\.\./);
});
