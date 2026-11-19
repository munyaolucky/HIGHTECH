import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  Globe,
  Plus,
  Search,
  Send,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { StaffUserAccount } from '../../../config/staff-navigation';
import { hasStaffPermission } from '../../../config/staff-navigation';
import { websiteApi } from '../../website/website-api';
import {
  DEPARTMENT_BANNER_PRESETS,
  STAFF_PHOTO_PRESETS,
  resolveWebsiteMediaUrl,
} from '../../website/website-media';
import {
  WEBSITE_STAFF_CATEGORIES,
  type CmsDepartmentItem,
  type CmsStaffProfileItem,
  type CmsSummaryResponse,
  type DepartmentProgrammeItem,
  type WebsiteStaffCategory,
} from '../../website/website-types';
import {
  StaffButton,
  StaffPageHeader,
  StaffStatCard,
  StaffStatusTag,
} from '../components/StaffDashboardUI';

export type WebsiteCmsTab = 'overview' | 'staff' | 'departments' | 'approvals';

interface WebsiteCmsWorkspaceProps {
  user: StaffUserAccount;
  initialTab?: WebsiteCmsTab;
  onNavigate: (path: string) => void;
  onOpenPublicPreview?: (publicPath: string) => void;
}

const TAB_TO_PATH: Record<WebsiteCmsTab, string> = {
  overview: '/staff/website',
  staff: '/staff/website/staff',
  departments: '/staff/website/departments',
  approvals: '/staff/website/approvals',
};

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitComma(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function WebsiteCmsWorkspace({
  user,
  initialTab = 'overview',
  onNavigate,
  onOpenPublicPreview,
}: WebsiteCmsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WebsiteCmsTab>(initialTab);
  const [summary, setSummary] = useState<CmsSummaryResponse | null>(null);
  const [staffList, setStaffList] = useState<CmsStaffProfileItem[]>([]);
  const [deptList, setDeptList] = useState<CmsDepartmentItem[]>([]);
  const [deptOptions, setDeptOptions] = useState<
    { id: string; name: string; slug: string; status: string }[]
  >([]);

  const [staffSearch, setStaffSearch] = useState('');
  const [staffStatus, setStaffStatus] = useState<string>('ALL');
  const [staffCategory, setStaffCategory] = useState<string>('ALL');
  const [staffDeptFilter, setStaffDeptFilter] = useState<string>('ALL');

  const [deptSearch, setDeptSearch] = useState('');
  const [deptStatus, setDeptStatus] = useState<string>('ALL');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Staff editor modal state
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    titlePrefix: '',
    officialTitle: '',
    positionTitle: '',
    designation: '',
    category: 'Lecturers and trainers' as WebsiteStaffCategory,
    primaryDepartmentId: '',
    secondaryDepartmentIds: [] as string[],
    photoUrl: STAFF_PHOTO_PRESETS[2].value,
    biography: '',
    academicQualifications: '',
    professionalCertifications: '',
    specializations: '',
    subjectsTaught: '',
    publicEmail: '',
    officeLocation: '',
    officeHours: 'Mon – Fri · 09:00 – 16:00',
    linkedinUrl: '',
    featured: false,
    showOnPublicWebsite: true,
    seoTitle: '',
    seoDescription: '',
  });

  // Department editor modal state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    slug: '',
    campusName: 'Nairobi Main Campus',
    shortDescription: '',
    overview: '',
    bannerImageUrl: DEPARTMENT_BANNER_PRESETS[0].value,
    contactEmail: '',
    officeLocation: '',
    facilitiesText: '',
    outcomesText: '',
    careersText: '',
    programmes: [] as DepartmentProgrammeItem[],
    featured: false,
    showOnPublicWebsite: true,
    seoTitle: '',
    seoDescription: '',
  });

  // Department assignment modal state
  const [assignDept, setAssignDept] = useState<CmsDepartmentItem | null>(null);
  const [assignmentRows, setAssignmentRows] = useState<
    {
      staffProfileId: string;
      fullName: string;
      officialTitle: string;
      included: boolean;
      isHod: boolean;
      roleInDepartment: string;
      isPrimaryDepartment: boolean;
    }[]
  >([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const canCreateStaff = hasStaffPermission(user.permissions, 'website.staff.create');
  const canEditStaff = hasStaffPermission(user.permissions, 'website.staff.edit');
  const canPublishStaff = hasStaffPermission(user.permissions, 'website.staff.publish');
  const canArchiveStaff = hasStaffPermission(user.permissions, 'website.staff.archive');
  const canCreateDept = hasStaffPermission(user.permissions, 'website.department.create');
  const canEditDept = hasStaffPermission(user.permissions, 'website.department.edit');
  const canPublishDept = hasStaffPermission(user.permissions, 'website.department.publish');
  const canAssignDeptStaff = hasStaffPermission(
    user.permissions,
    'website.department.assign_staff'
  );
  const canApproveContent = hasStaffPermission(user.permissions, 'website.content.approve');

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, staffData, deptData] = await Promise.all([
        websiteApi.getCmsSummary(),
        websiteApi.listCmsStaff({
          q: staffSearch.trim() || undefined,
          status: staffStatus === 'ALL' ? undefined : staffStatus,
          category: staffCategory === 'ALL' ? undefined : staffCategory,
          departmentId: staffDeptFilter === 'ALL' ? undefined : staffDeptFilter,
        }),
        websiteApi.listCmsDepartments({
          q: deptSearch.trim() || undefined,
          status: deptStatus === 'ALL' ? undefined : deptStatus,
        }),
      ]);
      setSummary(sumData);
      setStaffList(staffData.items);
      setDeptOptions(staffData.departments);
      setDeptList(deptData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Website CMS data.');
    } finally {
      setLoading(false);
    }
  }, [staffSearch, staffStatus, staffCategory, staffDeptFilter, deptSearch, deptStatus]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const switchTab = (tab: WebsiteCmsTab) => {
    setActiveTab(tab);
    onNavigate(TAB_TO_PATH[tab]);
  };

  const openCreateStaffModal = () => {
    setEditingStaffId(null);
    setStaffForm({
      fullName: '',
      titlePrefix: '',
      officialTitle: '',
      positionTitle: '',
      designation: '',
      category: 'Lecturers and trainers',
      primaryDepartmentId: deptOptions[0]?.id ?? '',
      secondaryDepartmentIds: [],
      photoUrl: STAFF_PHOTO_PRESETS[2].value,
      biography: '',
      academicQualifications: '',
      professionalCertifications: '',
      specializations: '',
      subjectsTaught: '',
      publicEmail: '',
      officeLocation: 'Nairobi Main Campus',
      officeHours: 'Mon – Fri · 09:00 – 16:00',
      linkedinUrl: '',
      featured: false,
      showOnPublicWebsite: true,
      seoTitle: '',
      seoDescription: '',
    });
    setStaffModalOpen(true);
  };

  const openEditStaffModal = (item: CmsStaffProfileItem) => {
    setEditingStaffId(item.id);
    setStaffForm({
      fullName: item.fullName,
      titlePrefix: item.titlePrefix ?? '',
      officialTitle: item.officialTitle,
      positionTitle: item.positionTitle,
      designation: item.designation,
      category: item.category,
      primaryDepartmentId: item.primaryDepartmentId ?? '',
      secondaryDepartmentIds: item.secondaryDepartmentIds ?? [],
      photoUrl: item.photoUrl ?? STAFF_PHOTO_PRESETS[2].value,
      biography: item.biography,
      academicQualifications: item.academicQualifications.join('\n'),
      professionalCertifications: item.professionalCertifications.join('\n'),
      specializations: item.specializations.join(', '),
      subjectsTaught: item.subjectsTaught.join('\n'),
      publicEmail: item.publicEmail ?? '',
      officeLocation: item.officeLocation ?? '',
      officeHours: item.officeHours ?? '',
      linkedinUrl: item.linkedinUrl ?? '',
      featured: item.featured,
      showOnPublicWebsite: item.showOnPublicWebsite,
      seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '',
    });
    setStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = {
        fullName: staffForm.fullName,
        titlePrefix: staffForm.titlePrefix || null,
        officialTitle: staffForm.officialTitle,
        positionTitle: staffForm.positionTitle || staffForm.officialTitle,
        designation: staffForm.designation || staffForm.officialTitle,
        category: staffForm.category,
        primaryDepartmentId: staffForm.primaryDepartmentId || null,
        secondaryDepartmentIds: staffForm.secondaryDepartmentIds,
        photoUrl: staffForm.photoUrl || null,
        biography: staffForm.biography,
        academicQualifications: splitLines(staffForm.academicQualifications),
        professionalCertifications: splitLines(staffForm.professionalCertifications),
        specializations: splitComma(staffForm.specializations),
        subjectsTaught: splitLines(staffForm.subjectsTaught),
        publicEmail: staffForm.publicEmail || null,
        officeLocation: staffForm.officeLocation || null,
        officeHours: staffForm.officeHours || null,
        linkedinUrl: staffForm.linkedinUrl || null,
        featured: staffForm.featured,
        showOnPublicWebsite: staffForm.showOnPublicWebsite,
        seoTitle: staffForm.seoTitle || undefined,
        seoDescription: staffForm.seoDescription || undefined,
      };
      if (editingStaffId) {
        await websiteApi.updateStaff(editingStaffId, payload);
        setNotice(`Updated staff profile for ${staffForm.fullName}.`);
      } else {
        await websiteApi.createStaff(payload);
        setNotice(`Created draft staff profile for ${staffForm.fullName}.`);
      }
      setStaffModalOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save staff profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleStaffWorkflow = async (
    item: CmsStaffProfileItem,
    action: 'submit' | 'approve' | 'publish' | 'archive'
  ) => {
    try {
      setSaving(true);
      setError(null);
      await websiteApi.transitionStaffStatus(item.id, action);
      setNotice(`Staff profile "${item.fullName}" updated (${action.toUpperCase()}).`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update staff workflow status.');
    } finally {
      setSaving(false);
    }
  };

  const openCreateDeptModal = () => {
    setEditingDeptId(null);
    setDeptForm({
      code: '',
      name: '',
      slug: '',
      campusName: 'Nairobi Main Campus',
      shortDescription: '',
      overview: '',
      bannerImageUrl: DEPARTMENT_BANNER_PRESETS[0].value,
      contactEmail: '',
      officeLocation: '',
      facilitiesText: '',
      outcomesText: '',
      careersText: '',
      programmes: [
        {
          code: 'PROG-101',
          title: 'Diploma Programme Title',
          level: 'Diploma',
          duration: '2 Years (6 Terms)',
          entryRequirements: 'KCSE Mean Grade C- (Minus) and above',
          studyModes: ['Full-time', 'Evening'],
          examiningBody: 'CDACC / KNEC',
        },
      ],
      featured: false,
      showOnPublicWebsite: true,
      seoTitle: '',
      seoDescription: '',
    });
    setDeptModalOpen(true);
  };

  const openEditDeptModal = (dept: CmsDepartmentItem) => {
    setEditingDeptId(dept.id);
    setDeptForm({
      code: dept.code,
      name: dept.name,
      slug: dept.slug,
      campusName: dept.campusName,
      shortDescription: dept.shortDescription,
      overview: dept.overview,
      bannerImageUrl: dept.bannerImageUrl ?? DEPARTMENT_BANNER_PRESETS[0].value,
      contactEmail: dept.contactEmail ?? '',
      officeLocation: dept.officeLocation ?? '',
      facilitiesText: dept.facilities.join('\n'),
      outcomesText: dept.learningOutcomes.join('\n'),
      careersText: dept.careerOpportunities.join('\n'),
      programmes: dept.programmes,
      featured: dept.featured,
      showOnPublicWebsite: dept.showOnPublicWebsite,
      seoTitle: dept.seoTitle ?? '',
      seoDescription: dept.seoDescription ?? '',
    });
    setDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = {
        code: deptForm.code,
        name: deptForm.name,
        slug: deptForm.slug || undefined,
        campusName: deptForm.campusName,
        shortDescription: deptForm.shortDescription,
        overview: deptForm.overview || deptForm.shortDescription,
        bannerImageUrl: deptForm.bannerImageUrl || null,
        contactEmail: deptForm.contactEmail || null,
        officeLocation: deptForm.officeLocation || null,
        facilities: splitLines(deptForm.facilitiesText),
        learningOutcomes: splitLines(deptForm.outcomesText),
        careerOpportunities: splitLines(deptForm.careersText),
        programmes: deptForm.programmes,
        featured: deptForm.featured,
        showOnPublicWebsite: deptForm.showOnPublicWebsite,
        seoTitle: deptForm.seoTitle || undefined,
        seoDescription: deptForm.seoDescription || undefined,
      };
      if (editingDeptId) {
        await websiteApi.updateDepartment(editingDeptId, payload);
        setNotice(`Updated department "${deptForm.name}".`);
      } else {
        await websiteApi.createDepartment(payload);
        setNotice(`Created draft department "${deptForm.name}".`);
      }
      setDeptModalOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save department.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeptWorkflow = async (
    dept: CmsDepartmentItem,
    action: 'submit' | 'approve' | 'publish' | 'archive'
  ) => {
    try {
      setSaving(true);
      setError(null);
      await websiteApi.transitionDepartmentStatus(dept.id, action);
      setNotice(`Department "${dept.name}" updated (${action.toUpperCase()}).`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update department status.');
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = (dept: CmsDepartmentItem) => {
    const existingByStaff = new Map(dept.assignments.map((a) => [a.staffProfileId, a]));
    const rows = staffList.map((s) => {
      const match = existingByStaff.get(s.id);
      return {
        staffProfileId: s.id,
        fullName: s.fullName,
        officialTitle: s.officialTitle,
        included: Boolean(match),
        isHod: Boolean(match?.isHod || dept.hodStaffProfileId === s.id),
        roleInDepartment: match?.roleInDepartment || s.officialTitle,
        isPrimaryDepartment: match?.isPrimaryDepartment ?? s.primaryDepartmentId === dept.id,
      };
    });
    setAssignmentRows(rows);
    setAssignDept(dept);
  };

  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDept) return;
    try {
      setSaving(true);
      setError(null);
      const selected = assignmentRows
        .filter((r) => r.included)
        .map((r, idx) => ({
          staffProfileId: r.staffProfileId,
          isHod: r.isHod,
          roleInDepartment: r.roleInDepartment || 'Faculty Member',
          isPrimaryDepartment: r.isPrimaryDepartment,
          displayOrder: idx + 1,
        }));
      await websiteApi.assignDepartmentStaff(assignDept.id, selected);
      setNotice(`Updated staff roster and HOD assignment for ${assignDept.name}.`);
      setAssignDept(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save department staff roster.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setError(null);
      await websiteApi.exportDirectoryCsv();
      setNotice('Exported published public staff directory CSV.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export CSV.');
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Website Content & Directory CMS"
        description="Manage HI-TECH College public Our Staff profiles, Academic Departments, HOD attributions, and publishing approvals."
        breadcrumb="Website CMS"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {onOpenPublicPreview && (
              <>
                <StaffButton
                  variant="secondary"
                  onClick={() => onOpenPublicPreview('/our-staff')}
                >
                  <Globe size={15} /> Preview Our Staff
                </StaffButton>
                <StaffButton
                  variant="secondary"
                  onClick={() => onOpenPublicPreview('/departments')}
                >
                  <Building2 size={15} /> Preview Departments
                </StaffButton>
              </>
            )}
            <StaffButton variant="secondary" onClick={handleExportCsv}>
              <Download size={15} /> Export Public CSV
            </StaffButton>
          </div>
        }
      />

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-semibold text-emerald-900 dark:text-emerald-200"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={15} /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-[#B83232] dark:text-red-300"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldAlert size={15} /> {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Workspace Tabs */}
      <nav
        aria-label="Website CMS sections"
        className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2"
      >
        {(
          [
            { id: 'overview', label: 'CMS Overview' },
            { id: 'staff', label: `Staff Profiles (${summary?.staff.total ?? staffList.length})` },
            {
              id: 'departments',
              label: `Departments (${summary?.departments.total ?? deptList.length})`,
            },
            {
              id: 'approvals',
              label: `Approval Queue (${summary?.pendingApprovals.length ?? 0})`,
            },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={`min-h-[40px] rounded-xl px-4 text-xs font-bold transition-colors ${
                active
                  ? 'bg-[#102D50] text-white dark:bg-[#1769AA]'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StaffStatCard
              label="Published Staff Profiles"
              value={summary?.staff.published ?? 0}
              description={`${summary?.staff.total ?? 0} total staff directory records`}
              icon={Users}
            />
            <StaffStatCard
              label="Published Departments"
              value={summary?.departments.published ?? 0}
              description={`${summary?.departments.total ?? 0} total academic units`}
              icon={Building2}
            />
            <StaffStatCard
              label="Pending Approval"
              value={summary?.pendingApprovals.length ?? 0}
              description="Submitted for editorial sign-off"
              icon={FileCheck2}
            />
            <StaffStatCard
              label="Unassigned Staff"
              value={summary?.staff.withoutDepartment ?? 0}
              description="Central office or pending unit link"
              icon={UserPlus}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#102D50] dark:text-white">
                  Department Staffing &amp; HOD Coverage
                </h2>
                <StaffButton variant="secondary" onClick={() => switchTab('departments')}>
                  Manage Departments
                </StaffButton>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2.5 pr-3 font-bold">Department</th>
                      <th className="py-2.5 pr-3 font-bold">Status</th>
                      <th className="py-2.5 pr-3 font-bold">HOD Linked</th>
                      <th className="py-2.5 font-bold text-right">Assigned Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(summary?.staffByDepartment ?? []).map((row) => (
                      <tr key={row.departmentId}>
                        <td className="py-2.5 pr-3 font-semibold text-[#102D50] dark:text-white">
                          {row.departmentName}
                        </td>
                        <td className="py-2.5 pr-3">
                          <StaffStatusTag status={row.status} />
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                          {row.hasHod ? 'Assigned' : 'Not Assigned'}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold tabular-nums">
                          {row.staffCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white">
                Recent Website Publishing Audit
              </h2>
              <div className="space-y-2.5">
                {(summary?.recentAuditLogs ?? []).slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/50 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#102D50] dark:text-white">
                        {log.entityLabel}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-[#1769AA]">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{log.detail}</p>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {log.actorName} ({log.actorRole}) · {log.createdAt.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF PROFILES CMS */}
      {activeTab === 'staff' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#102D50] dark:text-white">
                Public Staff Directory Profiles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confidential HR salary bands, personal phones, and home addresses are never exposed on public endpoints.
              </p>
            </div>
            {canCreateStaff && (
              <StaffButton onClick={openCreateStaffModal}>
                <Plus size={15} /> Add Staff Profile
              </StaffButton>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search staff name or title..."
                className="min-h-[40px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 text-xs"
              />
            </div>
            <select
              aria-label="Filter by workflow status"
              value={staffStatus}
              onChange={(e) => setStaffStatus(e.target.value)}
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
            <select
              aria-label="Filter by staff category"
              value={staffCategory}
              onChange={(e) => setStaffCategory(e.target.value)}
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-semibold"
            >
              <option value="ALL">All 15 Categories</option>
              {WEBSITE_STAFF_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by department"
              value={staffDeptFilter}
              onChange={(e) => setStaffDeptFilter(e.target.value)}
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-semibold"
            >
              <option value="ALL">All Departments</option>
              {deptOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">Loading staff CMS records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-3 pr-3 font-bold">Staff Member</th>
                    <th className="py-3 pr-3 font-bold">Category</th>
                    <th className="py-3 pr-3 font-bold">Primary Department</th>
                    <th className="py-3 pr-3 font-bold">Status</th>
                    <th className="py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffList.map((member) => {
                    const thumb = resolveWebsiteMediaUrl(member.photoUrl);
                    const deptName =
                      deptOptions.find((d) => d.id === member.primaryDepartmentId)?.name ?? 'Central Office';
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#102D50]">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={member.fullName}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover object-top"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white">
                                  {member.fullName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#102D50] dark:text-white">
                                {member.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">{member.officialTitle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-slate-700 dark:text-slate-300">
                          {member.category}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 dark:text-slate-300">{deptName}</td>
                        <td className="py-3 pr-3">
                          <StaffStatusTag status={member.status} />
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            {canEditStaff && (
                              <StaffButton
                                variant="secondary"
                                onClick={() => openEditStaffModal(member)}
                              >
                                Edit
                              </StaffButton>
                            )}
                            {member.status === 'DRAFT' && canEditStaff && (
                              <StaffButton
                                variant="secondary"
                                disabled={saving}
                                onClick={() => handleStaffWorkflow(member, 'submit')}
                              >
                                Submit
                              </StaffButton>
                            )}
                            {member.status === 'PENDING_APPROVAL' && canApproveContent && (
                              <StaffButton
                                disabled={saving}
                                onClick={() => handleStaffWorkflow(member, 'approve')}
                              >
                                Approve &amp; Publish
                              </StaffButton>
                            )}
                            {member.status !== 'PUBLISHED' && canPublishStaff && (
                              <StaffButton
                                variant="secondary"
                                disabled={saving}
                                onClick={() => handleStaffWorkflow(member, 'publish')}
                              >
                                Publish
                              </StaffButton>
                            )}
                            {member.status !== 'ARCHIVED' && canArchiveStaff && (
                              <StaffButton
                                variant="secondary"
                                disabled={saving}
                                onClick={() => handleStaffWorkflow(member, 'archive')}
                              >
                                Archive
                              </StaffButton>
                            )}
                            {member.status === 'PUBLISHED' &&
                              member.showOnPublicWebsite &&
                              onOpenPublicPreview && (
                                <StaffButton
                                  variant="secondary"
                                  onClick={() => onOpenPublicPreview(`/our-staff/${member.slug}`)}
                                >
                                  <ExternalLink size={12} /> Preview
                                </StaffButton>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: DEPARTMENTS CMS */}
      {activeTab === 'departments' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#102D50] dark:text-white">
                Academic Departments &amp; HOD Attributions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage programmes, labs, contact offices, and assign one Head of Department per department.
              </p>
            </div>
            {canCreateDept && (
              <StaffButton onClick={openCreateDeptModal}>
                <Plus size={15} /> Add Department
              </StaffButton>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Search department code, name, or campus..."
                className="min-h-[40px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 text-xs"
              />
            </div>
            <select
              aria-label="Filter departments by workflow status"
              value={deptStatus}
              onChange={(e) => setDeptStatus(e.target.value)}
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {deptList.map((dept) => {
              const hodName =
                staffList.find((s) => s.id === dept.hodStaffProfileId)?.fullName ?? 'Unassigned';
              return (
                <article
                  key={dept.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/40 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono font-bold text-[#1769AA]">{dept.code}</div>
                      <h3 className="text-sm font-bold text-[#102D50] dark:text-white">{dept.name}</h3>
                      <div className="text-[11px] text-slate-500">{dept.campusName}</div>
                    </div>
                    <StaffStatusTag status={dept.status} />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {dept.shortDescription}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                    <span>
                      Programmes: <strong>{dept.programmes.length}</strong>
                    </span>
                    <span>
                      Assigned Staff: <strong>{dept.assignments.length}</strong>
                    </span>
                    <span>
                      HOD: <strong>{hodName}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {canEditDept && (
                      <StaffButton variant="secondary" onClick={() => openEditDeptModal(dept)}>
                        Edit Details
                      </StaffButton>
                    )}
                    {canAssignDeptStaff && (
                      <StaffButton variant="secondary" onClick={() => openAssignModal(dept)}>
                        Assign Staff &amp; HOD
                      </StaffButton>
                    )}
                    {dept.status === 'DRAFT' && canEditDept && (
                      <StaffButton
                        variant="secondary"
                        disabled={saving}
                        onClick={() => handleDeptWorkflow(dept, 'submit')}
                      >
                        Submit
                      </StaffButton>
                    )}
                    {dept.status === 'PENDING_APPROVAL' && canApproveContent && (
                      <StaffButton
                        disabled={saving}
                        onClick={() => handleDeptWorkflow(dept, 'approve')}
                      >
                        Approve &amp; Publish
                      </StaffButton>
                    )}
                    {dept.status !== 'PUBLISHED' && canPublishDept && (
                      <StaffButton
                        variant="secondary"
                        disabled={saving}
                        onClick={() => handleDeptWorkflow(dept, 'publish')}
                      >
                        Publish
                      </StaffButton>
                    )}
                    {dept.status === 'PUBLISHED' &&
                      dept.showOnPublicWebsite &&
                      onOpenPublicPreview && (
                        <StaffButton
                          variant="secondary"
                          onClick={() => onOpenPublicPreview(`/departments/${dept.slug}`)}
                        >
                          <ExternalLink size={12} /> Preview
                        </StaffButton>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">
              Pending Website Publishing Approvals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review submitted staff profiles and department updates before they appear on the public HI-TECH College website.
            </p>
          </div>

          {(summary?.pendingApprovals ?? []).length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/40 p-8 text-center text-xs text-slate-600 dark:text-slate-300">
              All website staff profiles and department records are reviewed. No pending approvals right now.
            </div>
          ) : (
            <div className="space-y-3">
              {(summary?.pendingApprovals ?? []).map((item) => (
                <div
                  key={`${item.entityType}-${item.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/40 p-4"
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-[#1769AA]">
                      {item.entityType === 'STAFF_PROFILE' ? 'STAFF PROFILE' : 'DEPARTMENT'}
                    </div>
                    <div className="text-sm font-bold text-[#102D50] dark:text-white">{item.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {item.subtitle} · Submitted by {item.updatedByName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StaffButton
                      variant="secondary"
                      onClick={() =>
                        switchTab(item.entityType === 'STAFF_PROFILE' ? 'staff' : 'departments')
                      }
                    >
                      Inspect Record
                    </StaffButton>
                    {canApproveContent && (
                      <StaffButton
                        disabled={saving}
                        onClick={async () => {
                          if (item.entityType === 'STAFF_PROFILE') {
                            await websiteApi.transitionStaffStatus(item.id, 'approve');
                          } else {
                            await websiteApi.transitionDepartmentStatus(item.id, 'approve');
                          }
                          setNotice(`Approved and published "${item.title}" to public website.`);
                          await loadAll();
                        }}
                      >
                        <Send size={13} /> Approve &amp; Publish
                      </StaffButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* STAFF CREATE/EDIT MODAL */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                {editingStaffId ? 'Edit Public Staff Profile' : 'Create Public Staff Profile'}
              </h3>
              <button
                type="button"
                aria-label="Close staff modal"
                onClick={() => setStaffModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={staffForm.category}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, category: e.target.value as WebsiteStaffCategory })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  >
                    {WEBSITE_STAFF_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold mb-1">Official Title *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.officialTitle}
                    onChange={(e) => setStaffForm({ ...staffForm, officialTitle: e.target.value })}
                    placeholder="e.g. Senior Lecturer, Computer Science"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Primary Department</label>
                  <select
                    value={staffForm.primaryDepartmentId}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, primaryDepartmentId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  >
                    <option value="">Central College Administration</option>
                    {deptOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold mb-1">Institutional Email</label>
                  <input
                    type="email"
                    value={staffForm.publicEmail}
                    onChange={(e) => setStaffForm({ ...staffForm, publicEmail: e.target.value })}
                    placeholder="name@hitech.ac.ke"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Office Location</label>
                  <input
                    type="text"
                    value={staffForm.officeLocation}
                    onChange={(e) => setStaffForm({ ...staffForm, officeLocation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Portrait Photo Preset</label>
                <select
                  value={staffForm.photoUrl}
                  onChange={(e) => setStaffForm({ ...staffForm, photoUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {STAFF_PHOTO_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Public Biography *</label>
                <textarea
                  rows={3}
                  required
                  value={staffForm.biography}
                  onChange={(e) => setStaffForm({ ...staffForm, biography: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold mb-1">
                    Academic Qualifications (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={staffForm.academicQualifications}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, academicQualifications: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Subjects / Units Taught (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={staffForm.subjectsTaught}
                    onChange={(e) => setStaffForm({ ...staffForm, subjectsTaught: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={staffForm.showOnPublicWebsite}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, showOnPublicWebsite: e.target.checked })
                    }
                  />
                  <span>Show on Public Website</span>
                </label>
                <label className="inline-flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={staffForm.featured}
                    onChange={(e) => setStaffForm({ ...staffForm, featured: e.target.checked })}
                  />
                  <span>Featured Leadership / Faculty</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <StaffButton variant="secondary" onClick={() => setStaffModalOpen(false)}>
                  Cancel
                </StaffButton>
                <StaffButton type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingStaffId ? 'Save Changes' : 'Create Draft Profile'}
                </StaffButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT CREATE/EDIT MODAL */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                {editingDeptId ? 'Edit Academic Department' : 'Create Academic Department'}
              </h3>
              <button
                type="button"
                aria-label="Close department modal"
                onClick={() => setDeptModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="e.g. ICT-CS"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold mb-1">Department Email</label>
                  <input
                    type="email"
                    value={deptForm.contactEmail}
                    onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Office Location</label>
                  <input
                    type="text"
                    value={deptForm.officeLocation}
                    onChange={(e) => setDeptForm({ ...deptForm, officeLocation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Banner Photo Preset</label>
                <select
                  value={deptForm.bannerImageUrl}
                  onChange={(e) => setDeptForm({ ...deptForm, bannerImageUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {DEPARTMENT_BANNER_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Short Card Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={deptForm.shortDescription}
                  onChange={(e) => setDeptForm({ ...deptForm, shortDescription: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Full Department Overview *</label>
                <textarea
                  rows={3}
                  required
                  value={deptForm.overview}
                  onChange={(e) => setDeptForm({ ...deptForm, overview: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold mb-1">Facilities &amp; Labs (one per line)</label>
                  <textarea
                    rows={3}
                    value={deptForm.facilitiesText}
                    onChange={(e) => setDeptForm({ ...deptForm, facilitiesText: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Career Pathways (one per line)</label>
                  <textarea
                    rows={3}
                    value={deptForm.careersText}
                    onChange={(e) => setDeptForm({ ...deptForm, careersText: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={deptForm.showOnPublicWebsite}
                    onChange={(e) =>
                      setDeptForm({ ...deptForm, showOnPublicWebsite: e.target.checked })
                    }
                  />
                  <span>Show on Public Website</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <StaffButton variant="secondary" onClick={() => setDeptModalOpen(false)}>
                  Cancel
                </StaffButton>
                <StaffButton type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingDeptId ? 'Save Department' : 'Create Draft Department'}
                </StaffButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN STAFF & SINGLE HOD MODAL */}
      {assignDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                  Assign Staff &amp; HOD · {assignDept.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Each department permits at most one assigned Head of Department (HOD).
                </p>
              </div>
              <button
                type="button"
                aria-label="Close assignment modal"
                onClick={() => setAssignDept(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignments} className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 text-xs">
                {assignmentRows.map((row, idx) => (
                  <div
                    key={row.staffProfileId}
                    className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/40 p-3"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAssignmentRows((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, included: checked, isHod: checked ? item.isHod : false }
                                : item
                            )
                          );
                        }}
                      />
                      <div>
                        <div className="font-bold text-[#102D50] dark:text-white">{row.fullName}</div>
                        <div className="text-[11px] text-slate-500">{row.officialTitle}</div>
                      </div>
                    </label>

                    <input
                      type="text"
                      disabled={!row.included}
                      value={row.roleInDepartment}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssignmentRows((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, roleInDepartment: val } : item))
                        );
                      }}
                      placeholder="Role in department"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 disabled:opacity-50"
                    />

                    <label className="inline-flex items-center gap-1.5 font-semibold text-[#B83232] cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!row.included}
                        checked={row.isHod}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAssignmentRows((prev) =>
                            prev.map((item, i) => ({
                              ...item,
                              isHod: i === idx ? checked : false,
                            }))
                          );
                        }}
                      />
                      <span>HOD</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <StaffButton variant="secondary" onClick={() => setAssignDept(null)}>
                  Cancel
                </StaffButton>
                <StaffButton type="submit" disabled={saving}>
                  {saving ? 'Saving Roster...' : 'Save Department Roster'}
                </StaffButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
