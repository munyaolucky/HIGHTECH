import React, { useState } from 'react';
import { ArrowRight, Mail, MapPin } from 'lucide-react';
import { resolveWebsiteMediaUrl } from '../website-media';
import type { PublicStaffSummary } from '../website-types';

interface StaffCardProps {
  staff: PublicStaffSummary;
  onSelectStaff: (slug: string) => void;
  onSelectDepartment?: (slug: string) => void;
}

function getInitials(name: string): string {
  const parts = name
    .replace(/^(Dr\.|Prof\.|Eng\.|Mrs\.|Ms\.|Mr\.|CPA)\s+/i, '')
    .trim()
    .split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function StaffCard({ staff, onSelectStaff, onSelectDepartment }: StaffCardProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedPhoto = resolveWebsiteMediaUrl(staff.photoUrl);
  const primaryDept = staff.departments[0];
  const isHodAnywhere = staff.departments.some((d) => d.isHod);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#1769AA]/50">
      <button
        type="button"
        onClick={() => onSelectStaff(staff.slug)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#102D50] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] focus-visible:ring-offset-2"
        aria-label={`View profile for ${staff.fullName}, ${staff.officialTitle}`}
      >
        {resolvedPhoto && !imgError ? (
          <img
            src={resolvedPhoto}
            alt={`Portrait of ${staff.fullName}, ${staff.officialTitle} at HI-TECH College`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#102D50] to-[#1769AA] text-white">
            <span className="text-3xl font-extrabold tracking-wider">
              {getInitials(staff.fullName)}
            </span>
            <span className="mt-1 text-xs text-slate-200">{staff.category}</span>
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
          <span className="text-[#1769AA] font-semibold">{staff.category}</span>
          {isHodAnywhere && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#B83232]">Head of Department</span>
            </>
          )}
        </div>

        <h3 className="mt-2 text-lg font-bold tracking-tight text-[#102D50]">
          <button
            type="button"
            onClick={() => onSelectStaff(staff.slug)}
            className="text-left hover:text-[#1769AA] focus-visible:outline-none focus-visible:underline"
          >
            {staff.fullName}
          </button>
        </h3>

        <p className="mt-1 text-sm font-medium text-slate-700">{staff.officialTitle}</p>

        {staff.designation && (
          <p className="mt-1 text-xs text-slate-500">{staff.designation}</p>
        )}

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {primaryDept && (
            <div>
              Department:{' '}
              {onSelectDepartment ? (
                <button
                  type="button"
                  onClick={() => onSelectDepartment(primaryDept.slug)}
                  className="font-semibold text-[#102D50] hover:text-[#1769AA] hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  {primaryDept.name}
                </button>
              ) : (
                <span className="font-semibold text-[#102D50]">{primaryDept.name}</span>
              )}
            </div>
          )}
          {staff.publicEmail && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0 text-[#1769AA]" aria-hidden="true" />
              <span className="truncate">{staff.publicEmail}</span>
            </div>
          )}
          {staff.officeLocation && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{staff.officeLocation}</span>
            </div>
          )}
        </div>

        <div className="mt-5 pt-2">
          <button
            type="button"
            onClick={() => onSelectStaff(staff.slug)}
            className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-[#1769AA] hover:text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] rounded-lg px-1"
          >
            <span>View Full Profile</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
