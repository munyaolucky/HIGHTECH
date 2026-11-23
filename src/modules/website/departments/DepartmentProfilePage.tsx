import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  MapPin,
  Wrench,
} from 'lucide-react';
import { StaffCard } from '../components/StaffCard';
import { websiteApi } from '../website-api';
import { resolveWebsiteMediaUrl } from '../website-media';
import type { PublicDepartmentDetail } from '../website-types';

interface DepartmentProfilePageProps {
  slug: string;
  onBackToDepartments: () => void;
  onSelectStaff: (staffSlug: string) => void;
  onSelectDepartment: (deptSlug: string) => void;
  onApplyForProgramme: (programmeTitle?: string) => void;
}

export function DepartmentProfilePage({
  slug,
  onBackToDepartments,
  onSelectStaff,
  onSelectDepartment,
  onApplyForProgramme,
}: DepartmentProfilePageProps) {
  const [department, setDepartment] = useState<PublicDepartmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [hodImgError, setHodImgError] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const loadDepartment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setImgError(false);
      setHodImgError(false);
      const data = await websiteApi.getPublicDepartmentBySlug(slug);
      setDepartment(data);
      document.title = data.seoTitle || `${data.name} | HI-TECH College`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load department details.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadDepartment();
  }, [loadDepartment]);

  if (loading) {
    return (
      <div className="bg-[#F4F7FB] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 space-y-6">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-64 w-full rounded-2xl bg-slate-200" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 h-40 rounded-xl bg-slate-100" />
            <div className="h-40 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="bg-[#F4F7FB] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-[#102D50]">Department Unavailable</h1>
          <p className="text-sm text-slate-600">
            {error || 'The requested academic department is either unpublished or could not be found.'}
          </p>
          <button
            type="button"
            onClick={onBackToDepartments}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#102D50] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1769AA]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to All Departments</span>
          </button>
        </div>
      </div>
    );
  }

  const resolvedBanner = resolveWebsiteMediaUrl(department.bannerImageUrl);
  const resolvedHodPhoto = resolveWebsiteMediaUrl(department.hod?.photoUrl);

  return (
    <div className="bg-[#F4F7FB] pb-16">
      {/* Breadcrumb Bar */}
      <div className="border-b border-slate-200 bg-white py-4 px-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={onBackToDepartments}
            className="inline-flex min-h-[40px] items-center gap-2 font-semibold text-[#1769AA] hover:text-[#102D50]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Academic Departments</span>
          </button>
          <div className="text-xs font-medium text-slate-500">
            <span className="font-mono font-semibold text-[#1769AA]">{department.code}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>{department.campusName}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Department Hero Banner */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col justify-between p-6 sm:p-8 space-y-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
                  {department.code} · {department.campusName}
                </div>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102D50] sm:text-3xl">
                  {department.name}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                  {department.overview}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onApplyForProgramme(department.programmes[0]?.title)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#B83232] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#9c2727] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83232] focus-visible:ring-offset-2"
                >
                  <span>Apply Now for 2026 Intake</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                {department.contactEmail && (
                  <a
                    href={`mailto:${department.contactEmail}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102D50] hover:bg-slate-50"
                  >
                    <Mail className="h-4 w-4 text-[#1769AA]" aria-hidden="true" />
                    <span>Email Department</span>
                  </a>
                )}
              </div>
            </div>

            <div className="relative min-h-[260px] bg-[#102D50]">
              {resolvedBanner && !imgError ? (
                <img
                  src={resolvedBanner}
                  alt={`${department.name} facility and students at HI-TECH College`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center bg-gradient-to-br from-[#102D50] to-[#1769AA] text-white">
                  <Building2 className="h-12 w-12 text-[#F5EBDD]" aria-hidden="true" />
                  <span className="mt-2 text-sm font-bold">{department.code}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content + Sidebar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Accredited Programmes & Entry Requirements */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#102D50]">
                  <BookOpen className="h-5 w-5 text-[#1769AA]" aria-hidden="true" />
                  <span>Accredited Programmes &amp; Entry Requirements</span>
                </h2>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {department.programmes.length} Programmes Offered
                </span>
              </div>

              {department.programmes.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Programme schedules are currently being updated by the Academic Registry.
                </p>
              ) : (
                <div className="space-y-4">
                  {department.programmes.map((prog) => (
                    <div
                      key={prog.code}
                      className="rounded-xl border border-slate-200 bg-[#F4F7FB] p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-[#1769AA]">
                            <span className="font-mono">{prog.code}</span> · {prog.level} · {prog.examiningBody}
                          </div>
                          <h3 className="mt-1 text-base font-bold text-[#102D50]">{prog.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => onApplyForProgramme(prog.title)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#102D50] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1769AA]"
                        >
                          <span>Apply</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
                        <div>
                          <span className="font-semibold text-[#102D50]">Duration:</span>{' '}
                          <span className="tabular-nums">{prog.duration}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#102D50]">Study Modes:</span>{' '}
                          {prog.studyModes.join(', ')}
                        </div>
                        <div>
                          <span className="font-semibold text-[#102D50]">Entry Req:</span>{' '}
                          {prog.entryRequirements}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Facilities & Training Laboratories */}
            {department.facilities.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#102D50]">
                  <Wrench className="h-5 w-5 text-[#1769AA]" aria-hidden="true" />
                  <span>Laboratories, Workshops &amp; Facilities</span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
                  {department.facilities.map((facility) => (
                    <li
                      key={facility}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-[#F4F7FB] p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                      <span>{facility}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Learning Outcomes & Career Opportunities */}
            {(department.learningOutcomes.length > 0 || department.careerOpportunities.length > 0) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 grid gap-6 sm:grid-cols-2">
                {department.learningOutcomes.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-base font-bold text-[#102D50]">Key Learning Outcomes</h2>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                      {department.learningOutcomes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {department.careerOpportunities.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-base font-bold text-[#102D50]">
                      <Briefcase className="h-4 w-4 text-[#1769AA]" aria-hidden="true" />
                      <span>Career Pathways</span>
                    </h2>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                      {department.careerOpportunities.map((career) => (
                        <li key={career}>{career}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Sidebar: HOD Spotlight, Contact, Announcements & FAQs */}
          <aside className="space-y-6">
            {department.hod && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#B83232]">
                  Head of Department
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#102D50]">
                    {resolvedHodPhoto && !hodImgError ? (
                      <img
                        src={resolvedHodPhoto}
                        alt={`Portrait of ${department.hod.fullName}`}
                        referrerPolicy="no-referrer"
                        onError={() => setHodImgError(true)}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                        {department.hod.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#102D50] truncate">
                      {department.hod.fullName}
                    </h2>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {department.hod.officialTitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectStaff(department.hod!.slug)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-300 bg-[#F4F7FB] px-4 text-xs font-semibold text-[#102D50] hover:border-[#1769AA] hover:text-[#1769AA]"
                >
                  View HOD Full Profile
                </button>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-sm text-slate-700">
              <h2 className="text-base font-bold text-[#102D50]">Department Office</h2>
              {department.officeLocation && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B83232]" aria-hidden="true" />
                  <span>{department.officeLocation}</span>
                </div>
              )}
              {department.contactEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[#1769AA]" aria-hidden="true" />
                  <a
                    href={`mailto:${department.contactEmail}`}
                    className="font-medium text-[#1769AA] hover:underline break-all"
                  >
                    {department.contactEmail}
                  </a>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onApplyForProgramme(department.programmes[0]?.title)}
                  className="w-full min-h-[44px] rounded-xl bg-[#102D50] px-4 text-xs font-semibold text-white hover:bg-[#1769AA]"
                >
                  Apply to {department.code} Department
                </button>
              </div>
            </section>

            {department.announcements.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#102D50]">
                  <Bell className="h-4 w-4 text-[#B83232]" aria-hidden="true" />
                  <span>Department Updates</span>
                </h2>
                <div className="space-y-3">
                  {department.announcements.map((ann) => (
                    <div key={ann.id} className="rounded-xl bg-[#F4F7FB] p-3.5 text-xs space-y-1">
                      <div className="font-semibold text-[#1769AA] tabular-nums">{ann.date}</div>
                      <div className="font-bold text-[#102D50]">{ann.title}</div>
                      <p className="text-slate-600 leading-relaxed">{ann.summary}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {department.faqs.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#102D50]">
                  <HelpCircle className="h-4 w-4 text-[#1769AA]" aria-hidden="true" />
                  <span>Frequently Asked Questions</span>
                </h2>
                <div className="space-y-2">
                  {department.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={faq.question} className="rounded-xl border border-slate-200">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="flex w-full items-center justify-between gap-2 p-3 text-left text-xs font-bold text-[#102D50]"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="border-t border-slate-100 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* Assigned Department Faculty & Support Staff */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-[#102D50]">
                Lecturers, Trainers &amp; Department Staff
              </h2>
              <p className="text-sm text-slate-600">
                Published faculty and technical personnel assigned to {department.name}.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {department.staffMembers.length} Published Members
            </span>
          </div>

          {department.staffMembers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              No public staff profiles are currently assigned to this department.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {department.staffMembers.map((member) => (
                <StaffCard
                  key={member.id}
                  staff={member}
                  onSelectStaff={onSelectStaff}
                  onSelectDepartment={onSelectDepartment}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
