import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
} from 'lucide-react';
import { websiteApi } from '../website-api';
import { resolveWebsiteMediaUrl } from '../website-media';
import type { PublicStaffProfileDetail } from '../website-types';

interface StaffProfilePageProps {
  slug: string;
  onBackToDirectory: () => void;
  onSelectDepartment: (deptSlug: string) => void;
  onEnquireAboutProgramme: () => void;
}

export function StaffProfilePage({
  slug,
  onBackToDirectory,
  onSelectDepartment,
  onEnquireAboutProgramme,
}: StaffProfilePageProps) {
  const [profile, setProfile] = useState<PublicStaffProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setImgError(false);
      const data = await websiteApi.getPublicStaffBySlug(slug);
      setProfile(data);
      document.title = data.seoTitle || `${data.fullName} | HI-TECH College`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load staff profile.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="bg-[#F4F7FB] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 space-y-6">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="grid gap-8 md:grid-cols-[300px_1fr]">
            <div className="aspect-[3/4] rounded-2xl bg-slate-200" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-slate-200" />
              <div className="h-5 w-1/2 rounded bg-slate-100" />
              <div className="h-28 w-full rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-[#F4F7FB] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-[#102D50]">Staff Profile Unavailable</h1>
          <p className="text-sm text-slate-600">
            {error || 'The requested staff profile is either unpublished or could not be found.'}
          </p>
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#102D50] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1769AA]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Our Staff Directory</span>
          </button>
        </div>
      </div>
    );
  }

  const resolvedPhoto = resolveWebsiteMediaUrl(profile.photoUrl);

  return (
    <div className="bg-[#F4F7FB] pb-16">
      <div className="border-b border-slate-200 bg-white py-4 px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex min-h-[40px] items-center gap-2 font-semibold text-[#1769AA] hover:text-[#102D50]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Our Staff Directory</span>
          </button>
          <span className="text-xs font-medium text-slate-500">
            {profile.category} · HI-TECH College Faculty &amp; Staff
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Top Hero Split */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-1 items-stretch md:grid-cols-[320px_1fr]">
            <div className="relative min-h-[320px] bg-[#102D50]">
              {resolvedPhoto && !imgError ? (
                <img
                  src={resolvedPhoto}
                  alt={`Portrait of ${profile.fullName}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center bg-gradient-to-br from-[#102D50] to-[#1769AA] text-4xl font-extrabold text-white">
                  {profile.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between p-6 sm:p-8 space-y-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
                  {profile.category}
                </div>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102D50] sm:text-3xl">
                  {profile.fullName}
                </h1>
                <p className="mt-1 text-base font-semibold text-slate-700">
                  {profile.officialTitle}
                </p>
                {profile.designation && (
                  <p className="mt-1 text-sm text-slate-500">{profile.designation}</p>
                )}

                <p className="mt-5 text-sm leading-relaxed text-slate-700 max-w-3xl">
                  {profile.biography}
                </p>
              </div>

              <div className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 text-sm text-slate-700">
                {profile.publicEmail && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-[#1769AA]" aria-hidden="true" />
                    <a
                      href={`mailto:${profile.publicEmail}`}
                      className="font-medium text-[#102D50] hover:text-[#1769AA] hover:underline"
                    >
                      {profile.publicEmail}
                    </a>
                  </div>
                )}
                {profile.officeLocation && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B83232]" aria-hidden="true" />
                    <span>{profile.officeLocation}</span>
                  </div>
                )}
                {profile.officeHours && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#1769AA]" aria-hidden="true" />
                    <span>Consultation: {profile.officeHours}</span>
                  </div>
                )}
                {profile.linkedinUrl && (
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="h-4 w-4 shrink-0 text-[#1769AA]" aria-hidden="true" />
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#1769AA] hover:underline"
                    >
                      Professional Profile Link
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {profile.publicEmail && (
                  <a
                    href={`mailto:${profile.publicEmail}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#102D50] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1769AA]"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span>Email Office</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onEnquireAboutProgramme}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102D50] hover:bg-slate-50"
                >
                  <span>Admissions &amp; Academic Enquiry</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Academic Credentials & Department Assignments */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {profile.academicQualifications.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#102D50]">
                  <GraduationCap className="h-5 w-5 text-[#1769AA]" aria-hidden="true" />
                  <span>Academic Qualifications</span>
                </h2>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {profile.academicQualifications.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </section>
            )}

            {profile.subjectsTaught.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#102D50]">
                  <BookOpen className="h-5 w-5 text-[#1769AA]" aria-hidden="true" />
                  <span>Programmes &amp; Subjects Taught</span>
                </h2>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {profile.subjectsTaught.map((sub) => (
                    <li key={sub}>{sub}</li>
                  ))}
                </ul>
              </section>
            )}

            {(profile.specializations.length > 0 || profile.professionalCertifications.length > 0) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                {profile.specializations.length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-[#102D50]">Areas of Specialisation</h2>
                    <p className="mt-1.5 text-sm text-slate-700">
                      {profile.specializations.join(' · ')}
                    </p>
                  </div>
                )}
                {profile.professionalCertifications.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <h2 className="flex items-center gap-2 text-base font-bold text-[#102D50]">
                      <Award className="h-4 w-4 text-[#B83232]" aria-hidden="true" />
                      <span>Professional Memberships &amp; Certifications</span>
                    </h2>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                      {profile.professionalCertifications.map((cert) => (
                        <li key={cert}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#102D50]">
                <Building2 className="h-4 w-4 text-[#1769AA]" aria-hidden="true" />
                <span>Department Affiliations</span>
              </h2>
              {profile.departments.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Institutional governance &amp; central college administration.
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.departments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => onSelectDepartment(dept.slug)}
                      className="w-full rounded-xl border border-slate-200 bg-[#F4F7FB] p-3.5 text-left transition-colors hover:border-[#1769AA]"
                    >
                      <div className="text-sm font-bold text-[#102D50]">{dept.name}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {dept.isHod ? 'Head of Department' : dept.roleInDepartment}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
