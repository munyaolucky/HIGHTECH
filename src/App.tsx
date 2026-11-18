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
import ForgotPasswordPage from "./modules/auth/ForgotPasswordPage";
import ResetPasswordPage from "./modules/auth/ResetPasswordPage";
import AccountSecurityPage from "./modules/security/AccountSecurityPage";
import StudentProfileDetailPage from "./modules/sis/StudentProfileDetailPage";
import PublicWebsite from "./website/PublicWebsite";
import UserPortalShell from "./components/UserPortalShell";
import { ScrollProgressBar, ScrollToTopButton } from "./components/ScrollView";
import { PortalShellProvider } from "./context/PortalShellContext";
import { ThemeProvider } from "./context/ThemeContext";
import { getPortalShellConfig, ShellRoleKey } from "./config/portalShellConfigs";
import { STAFF_ACCOUNTS, type StaffRole } from "./config/staff-navigation";
import { PortalRole } from "./types";

const WEBSITE_PAGES = new Set([
  "home",
  "about",
  "academics",
  "course-details",
  "admissions",
  "apply",
  "campus-life",
  "news",
  "resources",
  "portal-guide",
  "contact",
  "verify",
  "privacy-policy",
  "terms",
  "accessibility",
  "fees",
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
]);

interface RouteState {
  mode: "website" | "portal" | "activate" | "login" | "forgot-password" | "reset-password" | "security" | "sis-detail";
  role: PortalRole;
  websitePage: string;
  staffInitialPath: string;
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
    websitePage: "home",
    staffInitialPath: "/staff/dashboard",
    openLoginModal: false,
  };
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
    }
  };

  return (
    <ThemeProvider>
      <PortalShellProvider>
        <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] text-[#102D50] dark:text-slate-100 flex flex-col font-sans transition-colors">
          <ScrollProgressBar />

          <div className="flex-1">
            {route.mode === "activate" ? (
              <ActivateAccountPage
                initialToken={route.activationToken}
                onNavigateToLogin={() => navigateToPortal("portal-login")}
                onNavigateHome={() => navigateToWebsite("home", false)}
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
            ) : route.mode === "security" ? (
              <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigateToPortal("portal-login")}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold"
                  >
                    Portal Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToWebsite("home", false)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold"
                  >
                    College Website
                  </button>
                </div>
                <AccountSecurityPage />
              </div>
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
                initialPortalModalOpen={route.openLoginModal}
                onPageChange={(page) => {
                  const targetUrl = page === "home" ? "/" : `/${page}`;
                  if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
                    window.history.pushState({}, "", targetUrl);
                  }
                }}
                onSwitchToERP={(target) => navigateToPortal(target)}
                onLaunchStudentDashboard={() => navigateToPortal("student")}
              />
            ) : route.role === "student" ? (
              <StudentDashboard
                onSwitchPortal={(role) => navigateToPortal(role)}
                onLogout={() => navigateToWebsite("home", false)}
              />
            ) : route.role === "staff" ? (
              <StaffPortal
                initialRole={route.authenticatedStaffRole}
                initialPath={route.staffInitialPath}
                onSwitchPortal={(role) => navigateToPortal(role)}
                onOpenActivationPage={(token) => navigateToActivation(token)}
                onLogout={() => navigateToWebsite("home", false)}
              />
            ) : route.role === "lecturer" ? (
              <LecturerPortal onLogout={() => navigateToWebsite("home", false)} />
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
      </PortalShellProvider>
    </ThemeProvider>
  );
}
