import React, { useCallback, useEffect, useState } from 'react';
import { Building2, RotateCcw, Search } from 'lucide-react';
import { DepartmentCard } from '../components/DepartmentCard';
import { websiteApi } from '../website-api';
import type { PublicDepartmentSummary } from '../website-types';

interface DepartmentsPageProps {
  onSelectDepartment: (slug: string) => void;
  onSelectStaff: (slug: string) => void;
}

export function DepartmentsPage({
  onSelectDepartment,
  onSelectStaff,
}: DepartmentsPageProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PublicDepartmentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await websiteApi.listPublicDepartments({
        q: search.trim() || undefined,
        page,
        pageSize: 12,
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load academic departments.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    document.title = 'Academic Departments | HI-TECH College of Technology & Applied Sciences';
  }, []);

  return (
    <div className="bg-[#F4F7FB] pb-16">
      <section className="border-b border-slate-200 bg-[#102D50] py-12 px-4 sm:px-6 text-white">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#F5EBDD]">
            Schools, Faculties &amp; Centres of Excellence
          </div>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
            Academic Departments
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
            Explore HI-TECH College’s accredited academic departments, training laboratories, programme entry requirements, Heads of Departments, and teaching faculty.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-6">
        <section
          aria-label="Search academic departments"
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-xl">
              <label htmlFor="departments-search-input" className="sr-only">
                Search departments by name, code, or programme
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="departments-search-input"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search departments, codes, programmes, or labs..."
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#102D50] focus-visible:border-[#1769AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="tabular-nums">
                Showing <strong className="text-[#102D50]">{items.length}</strong> of{' '}
                <strong className="text-[#102D50]">{total}</strong> published departments
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#B83232] hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83232]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear Search</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <div
            aria-busy="true"
            aria-label="Loading published academic departments"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="aspect-[16/10] w-full rounded-xl bg-slate-200" />
                <div className="h-3.5 w-1/3 rounded bg-slate-200" />
                <div className="h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
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
              onClick={loadDepartments}
              className="min-h-[44px] rounded-xl bg-[#102D50] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1769AA]"
            >
              Retry Loading Departments
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <Building2 className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#102D50]">No academic departments matched</h2>
            <p className="mx-auto max-w-md text-sm text-slate-600">
              Try clearing your search query to view all accredited HI-TECH College departments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((dept) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                onSelectDepartment={onSelectDepartment}
                onSelectStaff={onSelectStaff}
              />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <nav
            aria-label="Departments directory pagination"
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
