import type { ReactNode } from 'react';
import type { StudentPortalSection } from '../../services/studentPortalService';

export type SkeletonRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const RADIUS_CLASS: Record<SkeletonRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export interface SkeletonBlockProps {
  className?: string;
  radius?: SkeletonRadius;
}

/** Base design-token skeleton primitive with reduced-motion-safe shimmer. */
export function SkeletonBlock({ className = 'h-4 w-full', radius = 'lg' }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`hitech-skeleton ${RADIUS_CLASS[radius]} ${className}`}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: 'w-1/3' | 'w-1/2' | 'w-2/3' | 'w-3/4' | 'w-full';
  lineHeight?: 'h-2.5' | 'h-3' | 'h-3.5' | 'h-4';
  gapClass?: string;
}

/** Multi-line text skeleton matching body and metadata typography rhythm. */
export function SkeletonText({
  lines = 2,
  lastLineWidth = 'w-2/3',
  lineHeight = 'h-3',
  gapClass = 'space-y-2',
}: SkeletonTextProps) {
  return (
    <div className={gapClass} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => {
        const isLast = idx === lines - 1 && lines > 1;
        return (
          <SkeletonBlock
            key={idx}
            radius="md"
            className={`${lineHeight} ${isLast ? lastLineWidth : 'w-full'}`}
          />
        );
      })}
    </div>
  );
}

export interface SkeletonSurfaceProps {
  children: ReactNode;
  className?: string;
}

function SkeletonSurface({ children, className = '' }: SkeletonSurfaceProps) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xs ${className}`}
    >
      {children}
    </div>
  );
}

export function SkeletonPageHeader({ showAction = true }: { showAction?: boolean }) {
  return (
    <SkeletonSurface className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2.5 min-w-0 flex-1 max-w-xl" aria-hidden="true">
        <SkeletonBlock className="h-3 w-48" radius="md" />
        <SkeletonBlock className="h-7 w-72 max-w-full" radius="lg" />
        <SkeletonBlock className="h-3.5 w-96 max-w-full" radius="md" />
      </div>
      {showAction && (
        <div className="flex items-center gap-2 shrink-0" aria-hidden="true">
          <SkeletonBlock className="h-9 w-28" radius="xl" />
          <SkeletonBlock className="h-9 w-36" radius="xl" />
        </div>
      )}
    </SkeletonSurface>
  );
}

export interface SkeletonStatGridProps {
  count?: 2 | 3 | 4;
  columnsClass?: string;
}

/** Metric summary strip skeleton matching 2-4 column academic & finance KPIs. */
export function SkeletonStatGrid({
  count = 4,
  columnsClass,
}: SkeletonStatGridProps) {
  const gridCols =
    columnsClass ??
    (count === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : count === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');

  return (
    <div className={`grid ${gridCols} gap-4`} aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonSurface key={idx} className="p-4 space-y-2.5">
          <SkeletonBlock className="h-3 w-28" radius="md" />
          <SkeletonBlock className="h-6 w-36" radius="lg" />
          <SkeletonBlock className="h-2.5 w-24" radius="md" />
        </SkeletonSurface>
      ))}
    </div>
  );
}

export interface SkeletonToolbarProps {
  showFilters?: boolean;
  filterCount?: number;
}

export function SkeletonToolbar({
  showFilters = true,
  filterCount = 4,
}: SkeletonToolbarProps) {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <SkeletonBlock className="h-10 w-full sm:max-w-lg" radius="xl" />
        <div className="flex items-center gap-2 shrink-0">
          <SkeletonBlock className="h-10 w-24" radius="xl" />
          <SkeletonBlock className="h-10 w-32" radius="xl" />
        </div>
      </div>
      {showFilters && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: filterCount }).map((_, idx) => (
            <SkeletonBlock key={idx} className="h-8 w-24" radius="xl" />
          ))}
        </div>
      )}
    </div>
  );
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: 3 | 4 | 5;
  showHeader?: boolean;
  label?: string;
}

/** High-density data table skeleton (row height matches 44px academic tables). */
export function SkeletonTable({
  rows = 4,
  columns = 4,
  showHeader = true,
  label = 'Loading table records...',
}: SkeletonTableProps) {
  const colWidths = ['w-24', 'flex-1', 'w-28', 'w-20', 'w-16'];

  return (
    <SkeletonSurface className="overflow-hidden">
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{label}</span>
        {showHeader && (
          <div
            className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-center gap-4"
            aria-hidden="true"
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <SkeletonBlock
                key={cIdx}
                className={`h-3 ${colWidths[cIdx] ?? 'w-20'}`}
                radius="md"
              />
            ))}
          </div>
        )}
        <div className="divide-y divide-[var(--border-subtle)]" aria-hidden="true">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div key={rIdx} className="h-12 px-4 flex items-center gap-4">
              {Array.from({ length: columns }).map((__, cIdx) => (
                <SkeletonBlock
                  key={cIdx}
                  className={`h-3.5 ${colWidths[cIdx] ?? 'w-20'}`}
                  radius="md"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </SkeletonSurface>
  );
}

export interface SkeletonCardListProps {
  items?: number;
  columns?: 1 | 2;
  showMeta?: boolean;
  showAction?: boolean;
  label?: string;
}

/** Standardized card-list skeleton for assignments, documents, library holdings, notifications, and Cloud SQL records. */
export function SkeletonCardList({
  items = 3,
  columns = 1,
  showMeta = true,
  showAction = true,
  label = 'Loading module cards...',
}: SkeletonCardListProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: items }).map((_, idx) => (
        <SkeletonSurface key={idx} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3" aria-hidden="true">
            <div className="space-y-2 flex-1 min-w-0">
              {showMeta && <SkeletonBlock className="h-3 w-44 max-w-full" radius="md" />}
              <SkeletonBlock className="h-4 w-3/4" radius="md" />
              <SkeletonBlock className="h-3 w-1/2" radius="md" />
            </div>
            {showAction && <SkeletonBlock className="h-8 w-24 shrink-0" radius="xl" />}
          </div>
          {showMeta && (
            <div
              className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2"
              aria-hidden="true"
            >
              <SkeletonBlock className="h-3 w-36" radius="md" />
              <SkeletonBlock className="h-3 w-20" radius="md" />
            </div>
          )}
        </SkeletonSurface>
      ))}
    </div>
  );
}

export interface Phase4ModuleSkeletonProps {
  section: StudentPortalSection;
  includeHeader?: boolean;
  label?: string;
}

/**
 * Geometry-matched skeleton layouts for all Phase 4 student portal modules.
 * Ensures < 2px geometry delta between loading and populated views.
 */
export function Phase4ModuleSkeleton({
  section,
  includeHeader = false,
  label,
}: Phase4ModuleSkeletonProps) {
  const accessibleLabel = label ?? `Loading ${section.replace(/-/g, ' ')} module...`;

  const renderBody = () => {
    switch (section) {
      case 'examinations':
      case 'exams-assessments':
      case 'exams-assignments':
      case 'exams-timetable':
      case 'exams-online':
      case 'exams-practical':
      case 'exams-clearance':
      case 'exams-history':
        return (
          <div className="space-y-5">
            <SkeletonSurface className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1" aria-hidden="true">
                <SkeletonBlock className="h-4 w-56" radius="md" />
                <SkeletonBlock className="h-3 w-80 max-w-full" radius="md" />
              </div>
              <SkeletonBlock className="h-9 w-36 shrink-0" radius="xl" />
            </SkeletonSurface>
            <SkeletonTable rows={4} columns={5} label={accessibleLabel} />
            <SkeletonSurface className="p-5 space-y-4">
              <div className="flex items-center justify-between" aria-hidden="true">
                <SkeletonBlock className="h-4 w-64" radius="md" />
                <SkeletonBlock className="h-3.5 w-32" radius="md" />
              </div>
              <SkeletonCardList items={2} columns={2} showMeta={false} label={accessibleLabel} />
            </SkeletonSurface>
          </div>
        );

      case 'results':
      case 'exams-results':
      case 'exams-appeals':
      case 'exams-progress':
        return (
          <div className="space-y-5">
            <SkeletonSurface className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2 flex-1" aria-hidden="true">
                <SkeletonBlock className="h-3 w-48" radius="md" />
                <SkeletonBlock className="h-4 w-64" radius="md" />
                <SkeletonBlock className="h-3 w-80 max-w-full" radius="md" />
              </div>
              <SkeletonBlock className="h-10 w-28 shrink-0" radius="xl" />
            </SkeletonSurface>
            <SkeletonTable rows={6} columns={5} label={accessibleLabel} />
          </div>
        );

      case 'timetable':
      case 'calendar':
        return (
          <div className="space-y-5">
            <SkeletonSurface className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3" aria-hidden="true">
                <SkeletonBlock className="h-4 w-56" radius="md" />
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-8 w-20" radius="lg" />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <SkeletonBlock className="h-3 w-44" radius="md" />
                      <SkeletonBlock className="h-4 w-64 max-w-full" radius="md" />
                      <SkeletonBlock className="h-3 w-36" radius="md" />
                    </div>
                    <SkeletonBlock className="h-4 w-28 shrink-0" radius="md" />
                  </div>
                ))}
              </div>
            </SkeletonSurface>
            <SkeletonSurface className="p-5 space-y-4">
              <SkeletonBlock className="h-4 w-52" radius="md" />
              <SkeletonCardList items={3} columns={1} showMeta label={accessibleLabel} />
            </SkeletonSurface>
          </div>
        );

      case 'elearning':
        return (
          <SkeletonSurface className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3" aria-hidden="true">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-64" radius="md" />
                <SkeletonBlock className="h-3 w-40" radius="md" />
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-8 w-20" radius="lg" />
                ))}
              </div>
            </div>
            <SkeletonCardList items={4} columns={1} showMeta={false} label={accessibleLabel} />
          </SkeletonSurface>
        );

      case 'library':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkeletonSurface className="p-5 space-y-3">
              <SkeletonBlock className="h-4 w-64" radius="md" />
              <SkeletonCardList items={4} columns={1} showMeta={false} label={accessibleLabel} />
            </SkeletonSurface>
            <SkeletonSurface className="p-5 space-y-3">
              <SkeletonBlock className="h-4 w-56" radius="md" />
              <SkeletonCardList items={3} columns={1} showMeta label={accessibleLabel} />
            </SkeletonSurface>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-5">
            <SkeletonSurface className="p-5 space-y-4">
              <div className="space-y-1.5" aria-hidden="true">
                <SkeletonBlock className="h-4 w-60" radius="md" />
                <SkeletonBlock className="h-3 w-72 max-w-full" radius="md" />
              </div>
              <SkeletonCardList items={4} columns={2} showMeta={false} label={accessibleLabel} />
            </SkeletonSurface>
            <SkeletonSurface className="p-5 space-y-4">
              <SkeletonToolbar showFilters={false} />
              <SkeletonCardList items={3} columns={1} showMeta label={accessibleLabel} />
            </SkeletonSurface>
          </div>
        );

      case 'notifications':
        return (
          <SkeletonSurface className="divide-y divide-[var(--border-subtle)]">
            <div role="status" aria-live="polite" aria-busy="true">
              <span className="sr-only">{accessibleLabel}</span>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  aria-hidden="true"
                >
                  <div className="space-y-2 flex-1">
                    <SkeletonBlock className="h-3 w-48" radius="md" />
                    <SkeletonBlock className="h-4 w-72 max-w-full" radius="md" />
                    <SkeletonBlock className="h-3 w-96 max-w-full" radius="md" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SkeletonBlock className="h-8 w-28" radius="lg" />
                    <SkeletonBlock className="h-8 w-24" radius="lg" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonSurface>
        );

      case 'appeals':
        return (
          <SkeletonSurface className="p-5 space-y-4">
            <SkeletonToolbar showFilters filterCount={5} />
            <SkeletonCardList items={3} columns={1} showMeta label={accessibleLabel} />
          </SkeletonSurface>
        );

      case 'finance':
      case 'receipts':
        return (
          <div className="space-y-5">
            <SkeletonStatGrid count={3} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <SkeletonSurface className="p-5 space-y-3" >
                <SkeletonBlock className="h-4 w-48" radius="md" />
                <SkeletonText lines={2} />
                <SkeletonBlock className="h-10 w-full" radius="lg" />
                <SkeletonBlock className="h-10 w-full" radius="lg" />
                <SkeletonBlock className="h-10 w-full" radius="xl" />
              </SkeletonSurface>
              <div className="lg:col-span-2">
                <SkeletonTable rows={4} columns={5} label={accessibleLabel} />
              </div>
            </div>
          </div>
        );

      case 'course-registration':
        return (
          <div className="space-y-5">
            <SkeletonCardList items={2} columns={2} showMeta label={accessibleLabel} />
            <SkeletonTable rows={5} columns={5} label={accessibleLabel} />
          </div>
        );

      case 'mobile-companion':
        return (
          <div className="space-y-5">
            <SkeletonStatGrid count={2} />
            <SkeletonToolbar showFilters filterCount={5} />
            <SkeletonCardList items={3} columns={2} showMeta label={accessibleLabel} />
          </div>
        );

      default:
        return (
          <div className="space-y-5">
            <SkeletonStatGrid count={4} />
            <SkeletonTable rows={4} columns={4} label={accessibleLabel} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{accessibleLabel}</span>
      {includeHeader && <SkeletonPageHeader />}
      {renderBody()}
    </div>
  );
}
