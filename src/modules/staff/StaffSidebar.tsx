import type { ElementType } from 'react';
import { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bed,
  Bell,
  BookMarked,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  Building,
  Building2,
  Bus,
  Calendar,
  CalendarDays,
  ChartNoAxesCombined,
  ChartPie,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CreditCard,
  FilePenLine,
  FilePlus,
  Files,
  FileText,
  Folder,
  FolderCheck,
  FolderOpen,
  Gauge,
  Globe,
  GraduationCap,
  HeartHandshake,
  Images,
  Laptop,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Monitor,
  MonitorCheck,
  Network,
  Package,
  PackageCheck,
  PackageMinus,
  Presentation,
  Receipt,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Ticket,
  TrendingUp,
  Truck,
  User,
  UserPlus,
  Users,
  Vote,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import {
  ALL_STAFF_ROLES,
  getStaffNavigation,
  hasStaffPermission,
  STAFF_ACCOUNTS,
  type StaffNavItem,
  type StaffRole,
} from '../../config/staff-navigation';

const iconMap: Record<string, ElementType> = {
  LayoutDashboard,
  User,
  ClipboardList,
  MessageSquare,
  Bell,
  LifeBuoy,
  Folder,
  Settings,
  Building2,
  Users,
  Network,
  MapPin,
  CheckCircle,
  ChartNoAxesCombined,
  GraduationCap,
  BriefcaseBusiness,
  UserPlus,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  FileText,
  Award,
  Wallet,
  CreditCard,
  Smartphone,
  Receipt,
  ChartPie,
  Clock,
  Star,
  Presentation,
  FolderOpen,
  FilePenLine,
  CheckCheck,
  BookMarked,
  RotateCcw,
  Bookmark,
  Library,
  Package,
  Ticket,
  Monitor,
  MonitorCheck,
  Wrench,
  Building,
  Calendar,
  Files,
  Mail,
  Gauge,
  FolderCheck,
  TrendingUp,
  HeartHandshake,
  Vote,
  Bed,
  Laptop,
  FilePlus,
  Truck,
  ShoppingCart,
  PackageCheck,
  PackageMinus,
  Megaphone,
  Globe,
  Images,
  ShieldCheck,
  AlertTriangle,
  Bus,
};

interface Props {
  role: StaffRole | 'UNCONFIGURED';
  activePath: string;
  onNavigate: (path: string) => void;
  onSwitchRole: (role: StaffRole | 'UNCONFIGURED') => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  permissions: string[];
  collapsed?: boolean;
}

export default function StaffSidebar({
  role,
  activePath,
  onNavigate,
  onSwitchRole,
  mobileOpen,
  onCloseMobile,
  permissions,
  collapsed = false,
}: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const isConfigured = role !== 'UNCONFIGURED' && Boolean(STAFF_ACCOUNTS[role]);
  const { roleItems, sharedItems } = isConfigured
    ? getStaffNavigation(role as StaffRole, permissions)
    : { roleItems: [], sharedItems: [] };

  function toggleExpand(label: string) {
    setExpanded((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  }

  function handleSelectPath(path: string) {
    onNavigate(path);
    onCloseMobile();
  }

  function renderItem(item: StaffNavItem) {
    const Icon = iconMap[item.icon] ?? Folder;
    const isExpanded = expanded.includes(item.label);
    const hasChildren = Boolean(item.children?.length);
    const isActive = activePath === item.path;

    if (hasChildren) {
      return (
        <div key={item.path}>
          <button
            type="button"
            onClick={() => toggleExpand(item.label)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-blue-100/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-expanded={isExpanded}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </>
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-2">
              {item.children!
                .filter((child) => hasStaffPermission(permissions, child.permission))
                .map(renderItem)}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.path}
        type="button"
        onClick={() => handleSelectPath(item.path)}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
          isActive
            ? 'bg-[#1769AA] border-l-4 border-[#F5EBDD] font-semibold text-white shadow-xs'
            : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/15 bg-[#102D50] text-white transition-all duration-200 lg:static lg:translate-x-0 ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 items-center justify-between border-b-2 border-[#B83232] px-4">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5EBDD] text-sm font-black text-[#102D50]">
                H
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold tracking-tight text-white truncate">
                  HI-TECH COLLEGE
                </div>
                <div className="text-[11px] font-semibold text-[#F5EBDD] truncate">Staff Portal</div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5EBDD] text-xs font-black text-[#102D50]">
              H
            </div>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        {!collapsed && (
          <div className="border-b border-white/10 px-4 py-3.5 space-y-2.5">
            <div className="rounded-xl bg-white/10 p-3">
              <div className="text-[11px] text-blue-200">Signed-in staff role</div>
              <div className="mt-0.5 text-sm font-bold text-white truncate">
                {role.replaceAll('_', ' ')}
              </div>
            </div>

            <div>
              <label
                htmlFor="staff-role-switcher"
                className="block text-[11px] font-medium text-blue-200/90 mb-1"
              >
                Staff Role Perspective (RBAC)
              </label>
              <select
                id="staff-role-switcher"
                value={role}
                onChange={(e) => onSwitchRole(e.target.value as StaffRole | 'UNCONFIGURED')}
                className="w-full rounded-lg border border-white/20 bg-[#0b203a] px-2.5 py-2 text-xs font-semibold text-white focus:border-[#E8B44A] focus:ring-2 focus:ring-[#E8B44A]/30 cursor-pointer"
              >
                {ALL_STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll('_', ' ')}
                  </option>
                ))}
                <option value="UNCONFIGURED">UNCONFIGURED ROLE (Test Access Boundary)</option>
              </select>
            </div>
          </div>
        )}

        <nav
          aria-label="Staff navigation"
          className="scrollview-dark flex-1 space-y-4 overflow-y-auto p-3.5"
        >
          {roleItems.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold text-blue-300/80">
                  Role Operations
                </div>
              )}
              {roleItems.map(renderItem)}
            </div>
          )}

          {sharedItems.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold text-blue-300/80">
                  Shared Workspace
                </div>
              )}
              {sharedItems.map(renderItem)}
            </div>
          )}
        </nav>

        {!collapsed && (
          <div className="border-t border-white/10 px-4 py-3 text-xs text-blue-200/75">
            HI-TECH College · Staff Portal
          </div>
        )}
      </aside>
    </>
  );
}
