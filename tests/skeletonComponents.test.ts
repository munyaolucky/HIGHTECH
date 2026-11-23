import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Phase4ModuleSkeleton,
  PortalTableSkeleton,
  SkeletonBlock,
  SkeletonCardList,
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonTable,
  SkeletonText,
  SkeletonToolbar,
} from '../src/components/ui/PortalUI.tsx';
import type { StudentPortalSection } from '../src/services/studentPortalService.ts';

const PHASE_4_SECTIONS: StudentPortalSection[] = [
  'examinations',
  'results',
  'timetable',
  'calendar',
  'elearning',
  'library',
  'documents',
  'notifications',
  'appeals',
  'finance',
  'receipts',
  'course-registration',
];

function assertNoAntiPatterns(html: string, context: string): void {
  assert.equal(html.includes('animate-pulse'), false, `${context}: must not use animate-pulse`);
  assert.equal(/\sstyle="/i.test(html), false, `${context}: must not emit inline style attributes`);
  assert.equal(html.includes('hitech-skeleton'), true, `${context}: must use hitech-skeleton design class`);
}

test('Skeleton primitives render design-token classes without animate-pulse or inline styles', () => {
  const blockHtml = renderToStaticMarkup(
    React.createElement(SkeletonBlock, { className: 'h-6 w-48', radius: 'xl' })
  );
  assertNoAntiPatterns(blockHtml, 'SkeletonBlock');
  assert.match(blockHtml, /aria-hidden="true"/);
  assert.match(blockHtml, /rounded-xl/);

  const textHtml = renderToStaticMarkup(
    React.createElement(SkeletonText, { lines: 3, lastLineWidth: 'w-1/2' })
  );
  assertNoAntiPatterns(textHtml, 'SkeletonText');
  assert.match(textHtml, /w-1\/2/);

  const headerHtml = renderToStaticMarkup(
    React.createElement(SkeletonPageHeader, { showAction: true })
  );
  assertNoAntiPatterns(headerHtml, 'SkeletonPageHeader');
  assert.match(headerHtml, /var\(--surface\)/);
  assert.match(headerHtml, /var\(--border-subtle\)/);

  const statsHtml = renderToStaticMarkup(React.createElement(SkeletonStatGrid, { count: 3 }));
  assertNoAntiPatterns(statsHtml, 'SkeletonStatGrid');
  assert.match(statsHtml, /sm:grid-cols-3/);

  const toolbarHtml = renderToStaticMarkup(
    React.createElement(SkeletonToolbar, { showFilters: true, filterCount: 4 })
  );
  assertNoAntiPatterns(toolbarHtml, 'SkeletonToolbar');
});

test('SkeletonTable, PortalTableSkeleton, and SkeletonCardList enforce accessible status semantics', () => {
  const tableHtml = renderToStaticMarkup(
    React.createElement(SkeletonTable, {
      rows: 4,
      columns: 5,
      showHeader: true,
      label: 'Loading exam schedule...',
    })
  );
  assertNoAntiPatterns(tableHtml, 'SkeletonTable');
  assert.match(tableHtml, /role="status"/);
  assert.match(tableHtml, /aria-live="polite"/);
  assert.match(tableHtml, /aria-busy="true"/);
  assert.match(tableHtml, /class="sr-only">Loading exam schedule\.\.\.<\/span>/);

  const legacyAliasHtml = renderToStaticMarkup(
    React.createElement(PortalTableSkeleton, { rows: 3 })
  );
  assertNoAntiPatterns(legacyAliasHtml, 'PortalTableSkeleton');
  assert.match(legacyAliasHtml, /role="status"/);
  assert.match(legacyAliasHtml, /aria-busy="true"/);

  const cardsHtml = renderToStaticMarkup(
    React.createElement(SkeletonCardList, {
      items: 2,
      columns: 2,
      showMeta: true,
      showAction: true,
      label: 'Loading digital holdings...',
    })
  );
  assertNoAntiPatterns(cardsHtml, 'SkeletonCardList');
  assert.match(cardsHtml, /role="status"/);
  assert.match(cardsHtml, /aria-busy="true"/);
  assert.match(cardsHtml, /md:grid-cols-2/);
  assert.match(cardsHtml, /Loading digital holdings\.\.\./);
});

test('Phase4ModuleSkeleton covers all Phase 4 student portal modules with consistent accessible markup', () => {
  for (const section of PHASE_4_SECTIONS) {
    const html = renderToStaticMarkup(
      React.createElement(Phase4ModuleSkeleton, {
        section,
        includeHeader: true,
      })
    );
    assertNoAntiPatterns(html, `Phase4ModuleSkeleton(${section})`);
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /var\(--surface\)/);
    assert.match(html, /var\(--border-subtle\)/);
    assert.match(html, new RegExp(`Loading ${section.replace(/-/g, ' ')} module\\.\\.\\.`));
  }
});
