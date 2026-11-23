import React, { useCallback, useEffect, useState } from 'react';
import { RotateCcw, Search, Users } from 'lucide-react';
import { StaffCard } from '../components/StaffCard';
import { websiteApi } from '../website-api';
import {
  WEBSITE_STAFF_CATEGORIES,
  type PublicStaffSummary,
} from '../website-types';

interface StaffDirectoryPageProps {
  initialCategory?: string;
  onSelectStaff: (slug: string) => void;
  onSelectDepartment: (slug: string) => void;
}

export function StaffDirectoryPage({
  initialCategory,
  onSelectStaff,
  onSelectDepartment,
}: StaffDirectoryPageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(initialCategory ?? 'ALL');
  const [departmentId, setDepartmentId] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategory(initialCategory ?? 'ALL');
    setPage(1);
  }, [initialCategory]);

  const [items, setItems] = useState<PublicStaffSummary[]>([]);
  const [departments, setDepartments] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await websiteApi.listPublicStaff({
        q: search.trim() || undefined,
        category: category === 'ALL' ? undefined : category,
        departmentId: departmentId === 'ALL' ? undefined : departmentId,
        page,
        pageSize: 12,
      });
      setItems(data.items);
      setDepartments(data.departments);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the staff directory.');
    } finally {
      setLoading(false);
    }
  }, [search, category, departmentId, page]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    document.title = 'Our Staff | HI-TECH College of Technology & Applied Sciences';
  }, []);

  return (
    <div className="bg-[#F4F7FB] pb-16">
      {/* Institutional Hero Header */}
      <section className="border-b border-slate-200 bg-[#102D50] py-12 px-4 sm:px-6 text-white">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#F5EBDD]">
            Academic &amp; Administrative Directory
          </div>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
            Our Staff &amp; Academic Leadership
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
            Meet HI-TECH College’s Principal’s Office, Registrar, Heads of Departments, TVET-accredited lecturers, ICT engineers, and student support specialists.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-6">
        {/* Search & Filter Controls */}
        <section
          aria-label="Filter college staff directory"
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <label htmlFor="staff-directory-search" className="sr-only">
                Search staff by name, title, or specialization
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="staff-directory-search"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, title, or subject..."
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#102D50] focus-visible:border-[#1769AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              />
            </div>

            <div className="md:col-span-4">
              <label htmlFor="staff-category-filter" className="sr-only">
                Filter by staff category
              </label>
              <select
                id="staff-category-filter"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-[#102D50] focus-visible:border-[#1769AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              >
                <option value="ALL">All Staff Categories ({WEBSITE_STAFF_CATEGORIES.length})</option>
                {WEBSITE_STAFF_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="staff-department-filter" className="sr-only">
                Filter by academic department
              </label>
              <select
                id="staff-department-filter"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-[#102D50] focus-visible:border-[#1769AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              >
                <option value="ALL">All Academic Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="tabular-nums">
              Showing <strong className="text-[#102D50]">{items.length}</strong> of{' '}
              <strong className="text-[#102D50]">{total}</strong> published staff members
            </div>
            {(search || category !== 'ALL' || departmentId !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategory('ALL');
                  setDepartmentId('ALL');
                  setPage(1);
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#B83232] hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83232]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </section>

        {/* States & Directory Grid */}
        {loading ? (
          <div
            aria-busy="true"
            aria-label="Loading published staff directory"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="aspect-[4/3] w-full rounded-xl bg-slate-200" />
                <div className="h-3.5 w-1/3 rounded bg-slate-200" />
                <div className="h-5 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-4/5 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-8 text-center space-y-3"
          >
            <p className="text-sm font-semibold text-[#B83232]">{error}</p>
            <button
              type="button"
              onClick={loadStaff}
              className="min-h-[44px] rounded-xl bg-[#102D50] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1769AA]"
            >
              Retry Loading Staff Directory
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <Users className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#102D50]">No staff profiles matched</h2>
            <p className="mx-auto max-w-md text-sm text-slate-600">
              Try clearing your search or selecting another category or department filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                onSelectStaff={onSelectStaff}
                onSelectDepartment={onSelectDepartment}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <nav
            aria-label="Staff directory pagination"
            className="flex items-center justify-center gap-3 pt-4"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#102D50] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600 tabular-nums">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#102D50] disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
