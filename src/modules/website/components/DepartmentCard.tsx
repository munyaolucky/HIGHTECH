import React, { useState } from 'react';
import { ArrowRight, BookOpen, Building2, Users } from 'lucide-react';
import { resolveWebsiteMediaUrl } from '../website-media';
import type { PublicDepartmentSummary } from '../website-types';

interface DepartmentCardProps {
  department: PublicDepartmentSummary;
  onSelectDepartment: (slug: string) => void;
  onSelectStaff?: (slug: string) => void;
}

export function DepartmentCard({
  department,
  onSelectDepartment,
  onSelectStaff,
}: DepartmentCardProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedBanner = resolveWebsiteMediaUrl(department.bannerImageUrl);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#1769AA]/50">
      <button
        type="button"
        onClick={() => onSelectDepartment(department.slug)}
        className="relative aspect-[16/10] w-full overflow-hidden bg-[#102D50] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] focus-visible:ring-offset-2"
        aria-label={`Explore ${department.name} department`}
      >
        {resolvedBanner && !imgError ? (
          <img
            src={resolvedBanner}
            alt={`${department.name} laboratory and learning space at HI-TECH College`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#102D50] to-[#1769AA] p-6 text-white">
            <Building2 className="h-10 w-10 text-[#F5EBDD]" aria-hidden="true" />
            <span className="mt-2 text-sm font-semibold">{department.code}</span>
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
          <span className="font-mono font-semibold text-[#1769AA]">{department.code}</span>
          <span aria-hidden="true">·</span>
          <span>{department.campusName}</span>
        </div>

        <h3 className="mt-2 text-lg font-bold tracking-tight text-[#102D50]">
          <button
            type="button"
            onClick={() => onSelectDepartment(department.slug)}
            className="text-left hover:text-[#1769AA] focus-visible:outline-none focus-visible:underline"
          >
            {department.name}
          </button>
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {department.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600 tabular-nums">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <BookOpen className="h-3.5 w-3.5 text-[#1769AA]" aria-hidden="true" />
            {department.programmeCount} Programmes
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5 text-[#1769AA]" aria-hidden="true" />
            {department.staffCount} Published Staff
          </span>
        </div>

        {department.hod && (
          <div className="mt-3 rounded-xl bg-[#F4F7FB] px-3.5 py-2.5 text-xs">
            <span className="text-slate-500">Head of Department: </span>
            {onSelectStaff ? (
              <button
                type="button"
                onClick={() => onSelectStaff(department.hod!.slug)}
                className="font-semibold text-[#102D50] hover:text-[#1769AA] hover:underline"
              >
                {department.hod.fullName}
              </button>
            ) : (
              <span className="font-semibold text-[#102D50]">{department.hod.fullName}</span>
            )}
          </div>
        )}

        <div className="mt-4 pt-1">
          <button
            type="button"
            onClick={() => onSelectDepartment(department.slug)}
            className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-[#1769AA] hover:text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] rounded-lg px-1"
          >
            <span>Explore Department</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
