/**
 * HI-TECH College Integrated Digital Academic & Certification Platform
 * Multi-Role Enterprise ERP & Central Registration Number Generator Suite
 */

import React, { useCallback, useEffect, useState } from "react";
import StudentDashboard from "./modules/student/StudentDashboard";
import StaffPortal from "./modules/staff/StaffPortal";
import RegistrationGeneratorPortal from "./components/RegistrationGeneratorPortal";
import LibraryPortal from "./modules/library/LibraryPortal";
import ExaminationPortal from "./modules/examination/ExaminationPortal";
import AdmissionsPortal from "./modules/admissions/AdmissionsPortal";
import RegistrarPortal from "./modules/registrar/RegistrarPortal";
import FinancePortal from "./modules/finance/FinancePortal";
import LecturerPortal from "./modules/lecturer/LecturerPortal";
import MasterFeatureCataloguePortal from "./modules/catalogue/MasterFeatureCataloguePortal";
import ChatbotAdminPortal from "./modules/chatbot/ChatbotAdminPortal";
import AIGovernancePortal from "./modules/ai-governance/AIGovernancePortal";
import HostelsServicesPortal from "./modules/hostels/HostelsServicesPortal";
import HRStaffPortal from "./modules/hr/HRStaffPortal";
import ElectionsCommunityPortal from "./modules/community/ElectionsCommunityPortal";
import EngagementHubPortal from "./modules/engagement/EngagementHubPortal";
import QualityReportsPortal from "./modules/quality/QualityReportsPortal";
import AISupportCentrePortal from "./modules/ai-support/AISupportCentrePortal";
import CampusServicesPortal from "./modules/campus-services/CampusServicesPortal";
import ActivateAccountPage from "./modules/activation/ActivateAccountPage";
import PortalLoginPage from "./modules/auth/PortalLoginPage";
import StudentLoginPage from "./modules/auth/StudentLoginPage";
import ForgotPasswordPage from "./modules/auth/ForgotPasswordPage";
import ResetPasswordPage from "./modules/auth/ResetPasswordPage";
import ChangePasswordPage from "./modules/auth/ChangePasswordPage";
import CompleteProfilePage from "./modules/auth/CompleteProfilePage";
import AccountSecurityPage from "./modules/security/AccountSecurityPage";
import StudentProfileDetailPage from "./modules/sis/StudentProfileDetailPage";
import PublicWebsite from "./website/PublicWebsite";
import UserPortalShell from "./components/UserPortalShell";
import { ScrollProgressBar, ScrollToTopButton } from "./components/ScrollView";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PortalRedirect } from "./auth/PortalRedirect";
import StaffUserManagementPage from "./modules/users/StaffUserManagementPage";
import GlobalPortalSwitcherModal from "./components/GlobalPortalSwitcherModal";
import { PortalShellProvider, usePortalShellContext } from "./context/PortalShellContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./shared/components/toast/ToastProvider";
import { getPortalShellConfig, ShellRoleKey } from "./config/portalShellConfigs";
import { STAFF_ACCOUNTS, type StaffRole } from "./config/staff-navigation";
import {
  resolveStudentSectionFromPath,
  type StudentPortalSection,
} from "./services/studentPortalService";
import { PortalRole } from "./types";

const WEBSITE_PAGES = new Set([
  "home",
  "about",
  "departments",
  "department-details",
  "our-staff",
  "staff-details",
  "academics",
  "course-details",
  "admissions",
  "apply",
  "campus",
  "student-life",
  "campus-life",
  "events",
  "events-calendar",
  "events-verify-ticket",
  "event-details",
  "event-register",
  "event-confirmation",
  "graduation",
  "news",
  "resources",
  "portal-guide",
  "contact",
  "verify",
  "privacy-policy",
  "cookie-policy",
  "terms",
  "accessibility",
  "fees",
  "sitemap",
  "not-found",
]);

const PORTAL_ROLES = new Set<PortalRole>([
  "website",
  "catalogue",
  "chatbot-admin",
  "ai-governance",
  "student",
  "staff",
  "generator",
  "lecturer",
  "registrar",
  "finance",
  "library",
  "examination",
  "admissions",
  "hostels",
  "hr",
  "community",
  "engagement",
  "quality-reports",
  "ai-support",
  "campus-services",
  "staff-users",
]);

interface RouteState {
  mode:
    | "website"
    | "portal"
    | "activate"
    | "login"
    | "student-login"
    | "forgot-password"
    | "reset-password"
    | "change-password"
    | "complete-profile"
    | "portal-redirect"
    | "security"
    | "sis-detail";
  role: PortalRole;
  websitePage: string;
  websiteSlug?: string;
  websiteToken?: string;
  staffInitialPath: string;
  studentInitialSection?: StudentPortalSection;
  authenticatedStaffRole?: StaffRole;
  openLoginModal: boolean;
  activationToken?: string;
  resetToken?: string;
  sisStudentId?: string;
}

function parseLocationToRoute(): RouteState {
  if (typeof window === "undefined") {
    return {
      mode: "website",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(window.location.search);

  if (pathname === "/activate-account" || pathname === "/activate") {
    return {
      mode: "activate",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
      activationToken: params.get("token") ?? undefined,
    };
  }

  if (pathname === "/portal/student/login") {
    return {
      mode: "student-login",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/login") {
    return {
      mode: "login",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/forgot-password") {
    return {
      mode: "forgot-password",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/reset-password") {
    return {
      mode: "reset-password",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
      resetToken: params.get("token") ?? undefined,
    };
  }

  if (pathname === "/portal/change-password") {
    return {
      mode: "change-password",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/complete-profile") {
    return {
      mode: "complete-profile",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/dashboard" || pathname === "/portal") {
    return {
      mode: "portal-redirect",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/security") {
    return {
      mode: "security",
      role: "website",
      websitePage: "home",
      staffInitialPath: "/staff/security",
      openLoginModal: false,
    };
  }

  if (pathname.startsWith("/portal/sis/students/")) {
    const studentId = pathname.slice("/portal/sis/students/".length).split("/")[0];
    if (studentId) {
      return {
        mode: "sis-detail",
        role: "website",
        websitePage: "home",
        staffInitialPath: "/staff/sis",
        openLoginModal: false,
        sisStudentId: decodeURIComponent(studentId),
      };
    }
  }

  if (pathname === "/portal/admin/users/manual-registration") {
    return {
      mode: "portal",
      role: "staff",
      websitePage: "home",
      staffInitialPath: "/staff/admin/users/manual-registration",
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/staff/events" || pathname.startsWith("/portal/staff/events/")) {
    const subSection = pathname.slice("/portal/staff/events".length);
    return {
      mode: "portal",
      role: "staff",
      websitePage: "home",
      staffInitialPath: `/staff/events${subSection}`,
      openLoginModal: false,
    };
  }

  if (pathname === "/portal/student" || pathname.startsWith("/portal/student/")) {
    return {
      mode: "portal",
      role: "student",
      websitePage: "home",
      staffInitialPath: "/staff/dashboard",
      studentInitialSection: resolveStudentSectionFromPath(pathname),
      openLoginModal: false,
    };
  }

  if (pathname.startsWith("/portal/")) {
    const seg = pathname.slice("/portal/".length).split("/")[0] as PortalRole;
    if (PORTAL_ROLES.has(seg) && seg !== "website") {
      return {
        mode: "portal",
        role: seg,
        websitePage: "home",
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
      };
    }
  }

  if (pathname === "/events/calendar") {
    return {
      mode: "website",
      role: "website",
      websitePage: "events-calendar",
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname === "/events/verify-ticket") {
    return {
      mode: "website",
      role: "website",
      websitePage: "events-verify-ticket",
      websiteSlug: params.get("code") ?? undefined,
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  if (pathname.startsWith("/events/feedback/")) {
    const eventSlug = pathname.slice("/events/feedback/".length).split("/")[0];
    if (eventSlug) {
      return {
        mode: "website",
        role: "website",
        websitePage: "event-details",
        websiteSlug: decodeURIComponent(eventSlug),
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
      };
    }
  }

  if (pathname.startsWith("/events/register/")) {
    const eventId = pathname.slice("/events/register/".length).split("/")[0];
    if (eventId) {
      return {
        mode: "website",
        role: "website",
        websitePage: "event-register",
        websiteSlug: decodeURIComponent(eventId),
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
      };
    }
  }

  if (pathname.startsWith("/events/my-registration/")) {
    const regId = pathname.slice("/events/my-registration/".length).split("/")[0];
    if (regId) {
      return {
        mode: "website",
        role: "website",
        websitePage: "event-confirmation",
        websiteSlug: decodeURIComponent(regId),
        websiteToken: params.get("token") ?? undefined,
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
      };
    }
  }

  if (pathname.startsWith("/events/")) {
    const eventSlug = pathname.slice("/events/".length).split("/")[0];
    if (eventSlug) {
      return {
        mode: "website",
        role: "website",
        websitePage: "event-details",
        websiteSlug: decodeURIComponent(eventSlug),
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
      };
    }
  }

  if (pathname.startsWith("/our-staff/")) {
    const staffSlug = pathname.slice("/our-staff/".length).split("/")[0];
    if (staffSlug) {
      return {
        mode: "website",
        role: "website",
        websitePage: "staff-details",
        websiteSlug: decodeURIComponent(staffSlug),
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
      };
    }
  }

  if (pathname.startsWith("/departments/")) {
    const deptSlug = pathname.slice("/departments/".length).split("/")[0];
    if (deptSlug) {
      return {
        mode: "website",
        role: "website",
        websitePage: "department-details",
        websiteSlug: decodeURIComponent(deptSlug),
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
      };
    }
  }

  const slug = pathname === "/" ? "home" : pathname.slice(1);
  if (WEBSITE_PAGES.has(slug)) {
    return {
      mode: "website",
      role: "website",
      websitePage: slug,
      staffInitialPath: "/staff/dashboard",
      openLoginModal: false,
    };
  }

  return {
    mode: "website",
    role: "website",
    websitePage: "not-found",
    staffInitialPath: "/staff/dashboard",
    openLoginModal: false,
  };
}


function GlobalPortalSwitcherWrapper({
  navigateToPortal,
  navigateToWebsite,
}: {
  navigateToPortal: (target: string) => void;
  navigateToWebsite: (page: string, openLoginModal?: boolean) => void;
}) {
  const ctx = usePortalShellContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (ctx?.isSwitcherOpen) {
          ctx.closeSwitcher();
        } else {
          ctx?.openSwitcher();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ctx]);

  if (!ctx) return null;

  return (
    <GlobalPortalSwitcherModal
      isOpen={ctx.isSwitcherOpen}
      onClose={ctx.closeSwitcher}
      currentRole={ctx.currentRole ?? 'website'}
      onSelectRole={(role) => {
        ctx.closeSwitcher();
        if (role === "website") {
          navigateToWebsite("home", false);
        } else {
          navigateToPortal(role);
        }
      }}
    />
  );
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => parseLocationToRoute());

  const pushUrl = useCallback((url: string, nextState: RouteState) => {
    setRoute(nextState);
    if (typeof window !== "undefined") {
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== url) {
        window.history.pushState({}, "", url);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseLocationToRoute());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToWebsite = useCallback(
    (page = "home", openLogin = false) => {
      const targetUrl = openLogin
        ? "/portal/login"
        : page === "home"
        ? "/"
        : `/${page}`;
      pushUrl(targetUrl, {
        mode: "website",
        role: "website",
        websitePage: page,
        staffInitialPath: "/staff/dashboard",
        openLoginModal: openLogin,
      });
    },
    [pushUrl]
  );

  const navigateToActivation = useCallback(
    (token?: string) => {
      const url = token
        ? `/activate-account?token=${encodeURIComponent(token)}`
        : "/activate-account";
      pushUrl(url, {
        mode: "activate",
        role: "website",
        websitePage: "home",
        staffInitialPath: "/staff/dashboard",
        openLoginModal: false,
        activationToken: token,
      });
    },
    [pushUrl]
  );

  const navigateToPortal = useCallback(
    (target: string, staffRoleOverride?: StaffRole) => {
      if (target === "website") {
        navigateToWebsite("home", false);
        return;
      }
      if (target === "student-login" || target === "/portal/student/login") {
        pushUrl("/portal/student/login", {
          mode: "student-login",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          openLoginModal: false,
        });
        return;
      }
      if (target === "portal-login" || target === "/portal/login") {
        pushUrl("/portal/login", {
          mode: "login",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          openLoginModal: false,
        });
        return;
      }
      if (target === "/portal/forgot-password") {
        pushUrl("/portal/forgot-password", {
          mode: "forgot-password",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          openLoginModal: false,
        });
        return;
      }
      if (target === "/portal/reset-password") {
        pushUrl("/portal/reset-password", {
          mode: "reset-password",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          openLoginModal: false,
        });
        return;
      }
      if (target === "/portal/change-password") {
        pushUrl("/portal/change-password", {
          mode: "change-password",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          openLoginModal: false,
        });
        return;
      }
      if (target === "/portal/complete-profile") {
        pushUrl("/portal/complete-profile", {
          mode: "complete-profile",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          openLoginModal: false,
        });
        return;
      }
      if (target === "/portal/dashboard" || target === "/portal") {
        pushUrl("/portal/dashboard", {
          mode: "portal-redirect",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          openLoginModal: false,
        });
        return;
      }
      if (target === "/portal/security") {
        pushUrl("/portal/security", {
          mode: "security",
          role: "website",
          websitePage: "home",
          staffInitialPath: "/staff/security",
          openLoginModal: false,
        });
        return;
      }
      if (target === "activate-account") {
        navigateToActivation();
        return;
      }
      if (target === "manual-registration") {
        pushUrl("/portal/admin/users/manual-registration", {
          mode: "portal",
          role: "staff",
          websitePage: "home",
          staffInitialPath: "/staff/admin/users/manual-registration",
          authenticatedStaffRole: staffRoleOverride,
          openLoginModal: false,
        });
        return;
      }

      if (target.startsWith("/portal/student")) {
        const cleanTarget = target.replace(/\/+$/, "") || "/portal/student";
        pushUrl(cleanTarget, {
          mode: "portal",
          role: "student",
          websitePage: "home",
          staffInitialPath: "/staff/dashboard",
          studentInitialSection: resolveStudentSectionFromPath(cleanTarget),
          authenticatedStaffRole: staffRoleOverride,
          openLoginModal: false,
        });
        return;
      }

      const normalized = target.startsWith("/portal/")
        ? target.slice("/portal/".length).split("/")[0]
        : target;

      const role = PORTAL_ROLES.has(normalized as PortalRole)
        ? (normalized as PortalRole)
        : "website";
      if (role === "website") {
        navigateToWebsite("home", false);
        return;
      }

      pushUrl(`/portal/${role}`, {
        mode: "portal",
        role,
        websitePage: "home",
        staffInitialPath: "/staff/dashboard",
        studentInitialSection: role === "student" ? "dashboard" : undefined,
        authenticatedStaffRole: staffRoleOverride,
        openLoginModal: false,
      });
    },
    [navigateToActivation, navigateToWebsite, pushUrl]
  );

  const renderShellPortalBody = (role: ShellRoleKey) => {
    switch (role) {
      case "catalogue":
        return <MasterFeatureCataloguePortal />;
      case "chatbot-admin":
        return <ChatbotAdminPortal />;
      case "ai-governance":
        return <AIGovernancePortal />;
      case "generator":
        return <RegistrationGeneratorPortal />;
      case "registrar":
        return <RegistrarPortal onSwitchPortal={(r) => navigateToPortal(r)} />;
      case "finance":
        return <FinancePortal onSwitchPortal={(r) => navigateToPortal(r)} />;
      case "library":
        return <LibraryPortal onSwitchPortal={(r) => navigateToPortal(r)} />;
      case "examination":
        return <ExaminationPortal />;
      case "admissions":
        return <AdmissionsPortal onSwitchPortal={(r) => navigateToPortal(r)} />;
      case "hostels":
        return <HostelsServicesPortal />;
      case "hr":
        return <HRStaffPortal />;
      case "community":
        return <ElectionsCommunityPortal />;
      case "engagement":
        return <EngagementHubPortal />;
      case "quality-reports":
        return <QualityReportsPortal />;
      case "ai-support":
        return <AISupportCentrePortal />;
      case "campus-services":
        return <CampusServicesPortal />;
      case "staff-users":
        return <StaffUserManagementPage />;
    }
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <PortalShellProvider
            currentRole={route.role}
            onRoleChange={(role) => {
              if (role === "website") {
                navigateToWebsite("home", false);
              } else {
                navigateToPortal(role);
              }
            }}
          >
            <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] text-[#102D50] dark:text-slate-100 flex flex-col font-sans transition-colors">
            <ScrollProgressBar />

            <div className="flex-1">
              {route.mode === "activate" ? (
                <ActivateAccountPage
                  initialToken={route.activationToken}
                  onNavigateToLogin={() => navigateToPortal("portal-login")}
                  onNavigateHome={() => navigateToWebsite("home", false)}
                />
              ) : route.mode === "student-login" ? (
                <StudentLoginPage
                  onSuccessRedirect={(dest, userRole) => {
                    const upperRole = userRole.toUpperCase() as StaffRole;
                    const staffRole = STAFF_ACCOUNTS[upperRole] ? upperRole : undefined;
                    navigateToPortal(dest, staffRole);
                  }}
                  onNavigateForgotPassword={() => navigateToPortal("/portal/forgot-password")}
                  onNavigateActivate={() => navigateToActivation()}
                  onNavigateApply={() => navigateToWebsite("apply", false)}
                  onNavigateHome={() => navigateToWebsite("home", false)}
                  onNavigatePrivacy={() => navigateToWebsite("privacy-policy", false)}
                  onNavigateTerms={() => navigateToWebsite("terms", false)}
                  onNavigateContact={() => navigateToWebsite("contact", false)}
                  onNavigateUnifiedLogin={() => navigateToPortal("portal-login")}
                />
              ) : route.mode === "login" ? (
                <PortalLoginPage
                  onSuccessRedirect={(dest, userRole) => {
                    const upperRole = userRole.toUpperCase() as StaffRole;
                    const staffRole = STAFF_ACCOUNTS[upperRole] ? upperRole : undefined;
                    navigateToPortal(dest, staffRole);
                  }}
                  onNavigateForgotPassword={() => navigateToPortal("/portal/forgot-password")}
                  onNavigateActivate={() => navigateToActivation()}
                  onNavigateHome={() => navigateToWebsite("home", false)}
                />
              ) : route.mode === "forgot-password" ? (
                <ForgotPasswordPage onBackToLogin={() => navigateToPortal("portal-login")} />
              ) : route.mode === "reset-password" ? (
                <ResetPasswordPage
                  initialToken={route.resetToken}
                  onBackToLogin={() => navigateToPortal("portal-login")}
                />
              ) : route.mode === "change-password" ? (
                <ProtectedRoute
                  allowPasswordChange
                  allowProfileCompletion
                  onRedirect={(dest) => navigateToPortal(dest)}
                  onNavigateHome={() => navigateToWebsite("home", false)}
                >
                  <ChangePasswordPage
                    onNavigate={(dest) => navigateToPortal(dest)}
                    onNavigateHome={() => navigateToWebsite("home", false)}
                  />
                </ProtectedRoute>
              ) : route.mode === "complete-profile" ? (
                <ProtectedRoute
                  allowProfileCompletion
                  onRedirect={(dest) => navigateToPortal(dest)}
                  onNavigateHome={() => navigateToWebsite("home", false)}
                >
                  <CompleteProfilePage
                    onNavigate={(dest) => navigateToPortal(dest)}
                    onNavigateHome={() => navigateToWebsite("home", false)}
                  />
                </ProtectedRoute>
              ) : route.mode === "portal-redirect" ? (
                <PortalRedirect onRedirect={(dest) => navigateToPortal(dest)} />
              ) : route.mode === "security" ? (
                <ProtectedRoute
                  onRedirect={(dest) => navigateToPortal(dest)}
                  onNavigateHome={() => navigateToWebsite("home", false)}
                >
                  <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigateToPortal("/portal/dashboard")}
                        className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold"
                      >
                        Return to Workspace
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToWebsite("home", false)}
                        className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold"
                      >
                        College Website
                      </button>
                    </div>
                    <AccountSecurityPage />
                  </div>
                </ProtectedRoute>
              ) : route.mode === "sis-detail" && route.sisStudentId ? (
                <div className="mx-auto max-w-6xl p-4 md:p-8">
                  <StudentProfileDetailPage
                    studentId={route.sisStudentId}
                    onBack={() => navigateToPortal("staff")}
                  />
                </div>
              ) : route.mode === "website" || route.role === "website" ? (
                <PublicWebsite
                  initialPage={route.websitePage}
                  initialSlug={route.websiteSlug}
                  initialToken={route.websiteToken}
                  initialPortalModalOpen={route.openLoginModal}
                  onPageChange={(page, slug, token) => {
                    const targetUrl =
                      page === "home"
                        ? "/"
                        : page === "events-calendar"
                        ? "/events/calendar"
                        : page === "events-verify-ticket"
                        ? "/events/verify-ticket"
                        : page === "staff-details" && slug
                        ? `/our-staff/${encodeURIComponent(slug)}`
                        : page === "department-details" && slug
                        ? `/departments/${encodeURIComponent(slug)}`
                        : page === "event-details" && slug
                        ? `/events/${encodeURIComponent(slug)}`
                        : page === "event-register" && slug
                        ? `/events/register/${encodeURIComponent(slug)}`
                        : page === "event-confirmation" && slug
                        ? `/events/my-registration/${encodeURIComponent(slug)}${
                            token ? `?token=${encodeURIComponent(token)}` : ""
                          }`
                        : `/${page}`;
                    if (
                      typeof window !== "undefined" &&
                      `${window.location.pathname}${window.location.search}` !== targetUrl
                    ) {
                      window.history.pushState({}, "", targetUrl);
                    }
                  }}
                  onSwitchToERP={(target) => navigateToPortal(target)}
                  onLaunchStudentDashboard={() => navigateToPortal("student")}
                />
              ) : route.role === "student" ? (
                <StudentDashboard
                  initialSection={route.studentInitialSection}
                  onSectionPathChange={(targetPath) => {
                    if (
                      typeof window !== "undefined" &&
                      window.location.pathname !== targetPath
                    ) {
                      window.history.pushState({}, "", targetPath);
                    }
                  }}
                  onSwitchPortal={(role) => navigateToPortal(role)}
                  onLogout={() => navigateToWebsite("home", false)}
                />
              ) : route.role === "staff" ? (
                <StaffPortal
                  initialRole={route.authenticatedStaffRole}
                  initialPath={route.staffInitialPath}
                  onSwitchPortal={(role) => navigateToPortal(role)}
                  onOpenActivationPage={(token) => navigateToActivation(token)}
                  onOpenPublicPreview={(publicPath) => {
                    if (publicPath === "/events/calendar") {
                      pushUrl(publicPath, {
                        mode: "website",
                        role: "website",
                        websitePage: "events-calendar",
                        staffInitialPath: "/staff/dashboard",
                        openLoginModal: false,
                      });
                      return;
                    }
                    if (publicPath === "/events/verify-ticket") {
                      pushUrl(publicPath, {
                        mode: "website",
                        role: "website",
                        websitePage: "events-verify-ticket",
                        staffInitialPath: "/staff/dashboard",
                        openLoginModal: false,
                      });
                      return;
                    }
                    if (publicPath.startsWith("/our-staff/")) {
                      const slug = publicPath.slice("/our-staff/".length);
                      pushUrl(publicPath, {
                        mode: "website",
                        role: "website",
                        websitePage: "staff-details",
                        websiteSlug: decodeURIComponent(slug),
                        staffInitialPath: "/staff/dashboard",
                        openLoginModal: false,
                      });
                      return;
                    }
                    if (publicPath.startsWith("/departments/")) {
                      const slug = publicPath.slice("/departments/".length);
                      pushUrl(publicPath, {
                        mode: "website",
                        role: "website",
                        websitePage: "department-details",
                        websiteSlug: decodeURIComponent(slug),
                        staffInitialPath: "/staff/dashboard",
                        openLoginModal: false,
                      });
                      return;
                    }
                    if (publicPath.startsWith("/events/")) {
                      const slug = publicPath.slice("/events/".length);
                      pushUrl(publicPath, {
                        mode: "website",
                        role: "website",
                        websitePage: "event-details",
                        websiteSlug: decodeURIComponent(slug),
                        staffInitialPath: "/staff/dashboard",
                        openLoginModal: false,
                      });
                      return;
                    }
                    navigateToWebsite(publicPath.replace(/^\//, "") || "home", false);
                  }}
                  onLogout={() => navigateToWebsite("home", false)}
                />
              ) : route.role === "lecturer" ? (
                <LecturerPortal
                  onLogout={() => navigateToWebsite("home", false)}
                  onSwitchPortal={(role) => navigateToPortal(role)}
                />
              ) : (
                <UserPortalShell
                  config={getPortalShellConfig(route.role as ShellRoleKey)}
                  onSwitchPortal={(role) => navigateToPortal(role)}
                  onLogout={() => navigateToWebsite("home", false)}
                >
                  {renderShellPortalBody(route.role as ShellRoleKey)}
                </UserPortalShell>
              )}
            </div>

            <ScrollToTopButton lifted={route.mode === "website"} />
            </div>
            <GlobalPortalSwitcherWrapper
              navigateToPortal={navigateToPortal}
              navigateToWebsite={navigateToWebsite}
            />
          </PortalShellProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
