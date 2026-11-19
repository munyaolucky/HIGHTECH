import React, { useState } from "react";
import WebsiteHeader from "./components/WebsiteHeader";
import WebsiteFooter from "./components/WebsiteFooter";
import PortalAccessModal from "./components/PortalAccessModal";
import Home from "./pages/Home";
import About from "./pages/About";
import Academics from "./pages/Academics";
import CourseDetails from "./pages/CourseDetails";
import Admissions from "./pages/Admissions";
import Apply from "./pages/Apply";
import CampusLife from "./pages/CampusLife";
import News from "./pages/News";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import StudentPortalGuide from "./pages/StudentPortalGuide";
import PublicGovernancePages from "./pages/PublicGovernancePages";
import CollegeChatbot from "./components/CollegeChatbot";
import CookieConsentBanner from "./components/CookieConsentBanner";
import PublicVerifyEnquireModals from "./components/PublicVerifyEnquireModals";
import { StaffDirectoryPage } from "../modules/website/staff/StaffDirectoryPage";
import { StaffProfilePage } from "../modules/website/staff/StaffProfilePage";
import { DepartmentsPage } from "../modules/website/departments/DepartmentsPage";
import { DepartmentProfilePage } from "../modules/website/departments/DepartmentProfilePage";
import EventsPage from "./events/EventsPage";
import EventDetailPage from "./events/EventDetailPage";
import EventRegistrationPage from "./events/EventRegistrationPage";
import EventRegistrationConfirmationPage from "./events/EventRegistrationConfirmationPage";
import PublicEventCalendarPage from "./events/PublicEventCalendarPage";
import PublicTicketVerifyPage from "./events/PublicTicketVerifyPage";
import { mapEventBannerPath } from "./events/eventBannerKeys";
import { resolveWebsiteMediaUrl } from "../modules/website/website-media";
import { CourseProgramme } from "../types";
import { COURSES_CATALOGUE } from "../data/college";

interface PublicWebsiteProps {
  initialPage?: string;
  initialSlug?: string;
  initialToken?: string;
  initialPortalModalOpen?: boolean;
  onPageChange?: (page: string, slug?: string, token?: string) => void;
  onSwitchToERP: (role: string) => void;
  onLaunchStudentDashboard: () => void;
}

export default function PublicWebsite({
  initialPage = "home",
  initialSlug,
  initialToken,
  initialPortalModalOpen = false,
  onPageChange,
  onSwitchToERP,
  onLaunchStudentDashboard,
}: PublicWebsiteProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(initialSlug);
  const [selectedToken, setSelectedToken] = useState<string | undefined>(initialToken);
  const [staffCategoryFilter, setStaffCategoryFilter] = useState<string | undefined>(undefined);
  const [academicsLevelFilter, setAcademicsLevelFilter] = useState<string | undefined>(undefined);
  const [academicsDeptFilter, setAcademicsDeptFilter] = useState<string | undefined>(undefined);
  const [eventsDateFilter, setEventsDateFilter] = useState<string | undefined>(undefined);
  const [eventsCategoryFilter, setEventsCategoryFilter] = useState<string | undefined>(undefined);
  const [eventsModeFilter, setEventsModeFilter] = useState<string | undefined>(undefined);
  const [selectedCourse, setSelectedCourse] = useState<CourseProgramme | null>(
    COURSES_CATALOGUE[0]
  );
  const [preferredProgrammeTitle, setPreferredProgrammeTitle] = useState<string | undefined>(
    undefined
  );
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(initialPortalModalOpen);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [enquireModalOpen, setEnquireModalOpen] = useState(false);

  React.useEffect(() => {
    setCurrentPage(initialPage);
    setSelectedSlug(initialSlug);
    setSelectedToken(initialToken);
  }, [initialPage, initialSlug, initialToken]);

  React.useEffect(() => {
    if (initialPortalModalOpen) {
      setIsPortalModalOpen(true);
    }
  }, [initialPortalModalOpen]);

  const handleNavigate = (
    page: string,
    slugOrOptions?:
      | string
      | {
          slug?: string;
          token?: string;
          categoryFilter?: string;
          levelFilter?: string;
          departmentFilter?: string;
          dateFilter?: string;
          modeFilter?: string;
        }
  ) => {
    const options =
      typeof slugOrOptions === "string"
        ? { slug: slugOrOptions }
        : slugOrOptions ?? {};

    setCurrentPage(page);
    setSelectedSlug(options.slug);
    setSelectedToken(options.token);
    setStaffCategoryFilter(options.categoryFilter);
    setAcademicsLevelFilter(options.levelFilter);
    setAcademicsDeptFilter(options.departmentFilter);
    setEventsDateFilter(options.dateFilter);
    setEventsCategoryFilter(page === "events" ? options.categoryFilter : undefined);
    setEventsModeFilter(options.modeFilter);
    if (page !== "apply") {
      setPreferredProgrammeTitle(undefined);
    }
    onPageChange?.(page, options.slug, options.token);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCourse = (course: CourseProgramme) => {
    setSelectedCourse(course);
    setCurrentPage("course-details");
    onPageChange?.("course-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyCourse = (course: CourseProgramme) => {
    setSelectedCourse(course);
    setPreferredProgrammeTitle(course.title);
    setCurrentPage("apply");
    onPageChange?.("apply");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyProgrammeTitle = (programmeTitle?: string) => {
    if (programmeTitle) {
      const matched = COURSES_CATALOGUE.find(
        (c) =>
          c.title.toLowerCase().includes(programmeTitle.toLowerCase()) ||
          programmeTitle.toLowerCase().includes(c.title.toLowerCase())
      );
      if (matched) setSelectedCourse(matched);
      setPreferredProgrammeTitle(programmeTitle);
    }
    handleNavigate("apply");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Global Header */}
      <WebsiteHeader
        currentPage={currentPage}
        onNavigate={(page, options) => handleNavigate(page, options)}
        onOpenPortalModal={() => setIsPortalModalOpen(true)}
        onSwitchToERP={onSwitchToERP}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === "home" && (
          <Home
            onNavigate={(page) => handleNavigate(page)}
            onSelectCourse={handleSelectCourse}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
          />
        )}

        {currentPage === "about" && (
          <About
            onNavigate={(page) => handleNavigate(page)}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
          />
        )}

        {currentPage === "departments" && (
          <DepartmentsPage
            onSelectDepartment={(slug) => handleNavigate("department-details", slug)}
            onSelectStaff={(slug) => handleNavigate("staff-details", slug)}
          />
        )}

        {currentPage === "department-details" && selectedSlug && (
          <DepartmentProfilePage
            slug={selectedSlug}
            onBackToDepartments={() => handleNavigate("departments")}
            onSelectStaff={(slug) => handleNavigate("staff-details", slug)}
            onSelectDepartment={(slug) => handleNavigate("department-details", slug)}
            onApplyForProgramme={handleApplyProgrammeTitle}
          />
        )}

        {currentPage === "our-staff" && (
          <StaffDirectoryPage
            initialCategory={staffCategoryFilter}
            onSelectStaff={(slug) => handleNavigate("staff-details", slug)}
            onSelectDepartment={(slug) => handleNavigate("department-details", slug)}
          />
        )}

        {currentPage === "staff-details" && selectedSlug && (
          <StaffProfilePage
            slug={selectedSlug}
            onBackToDirectory={() => handleNavigate("our-staff")}
            onSelectDepartment={(slug) => handleNavigate("department-details", slug)}
            onEnquireAboutProgramme={() => setEnquireModalOpen(true)}
          />
        )}

        {currentPage === "academics" && (
          <Academics
            initialDepartment={academicsDeptFilter}
            initialLevel={academicsLevelFilter}
            onSelectCourse={handleSelectCourse}
            onApplyCourse={handleApplyCourse}
          />
        )}

        {currentPage === "course-details" && selectedCourse && (
          <CourseDetails
            course={selectedCourse}
            onBack={() => handleNavigate("academics")}
            onApply={handleApplyCourse}
          />
        )}

        {currentPage === "admissions" && (
          <Admissions
            onNavigate={(page) => handleNavigate(page)}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
          />
        )}

        {currentPage === "apply" && (
          <Apply
            selectedCourse={selectedCourse}
            initialProgrammeName={preferredProgrammeTitle}
            onNavigateToPortalGuide={() => handleNavigate("portal-guide")}
            onLaunchStudentDashboard={onLaunchStudentDashboard}
          />
        )}

        {(currentPage === "campus-life" ||
          currentPage === "campus" ||
          currentPage === "student-life") && <CampusLife />}

        {currentPage === "events" && (
          <EventsPage
            initialFilter={{
              dateFilter: eventsDateFilter,
              category: eventsCategoryFilter,
              mode: eventsModeFilter,
            }}
            resolveBannerUrl={(url, cat) => resolveWebsiteMediaUrl(mapEventBannerPath(url, cat))}
            onSelectEvent={(slug) => handleNavigate("event-details", slug)}
            onRegisterEvent={(eventId) => handleNavigate("event-register", eventId)}
            onLookupTicket={(regId, token) =>
              handleNavigate("event-confirmation", { slug: regId, token })
            }
            onOpenCalendar={() => handleNavigate("events-calendar")}
            onOpenVerifyTicket={() => handleNavigate("events-verify-ticket")}
          />
        )}

        {currentPage === "events-calendar" && (
          <PublicEventCalendarPage
            onSelectEvent={(slug) => handleNavigate("event-details", slug)}
            onRegisterEvent={(eventId) => handleNavigate("event-register", eventId)}
            onBackToEvents={() => handleNavigate("events")}
            onOpenVerifyTicket={() => handleNavigate("events-verify-ticket")}
          />
        )}

        {currentPage === "events-verify-ticket" && (
          <PublicTicketVerifyPage
            initialCode={selectedSlug || ""}
            onBackToEvents={() => handleNavigate("events")}
            onOpenCalendar={() => handleNavigate("events-calendar")}
          />
        )}

        {currentPage === "event-details" && selectedSlug && (
          <EventDetailPage
            slug={selectedSlug}
            resolveBannerUrl={(url, cat) => resolveWebsiteMediaUrl(mapEventBannerPath(url, cat))}
            onBackToEvents={() => handleNavigate("events")}
            onRegisterEvent={(eventId) => handleNavigate("event-register", eventId)}
          />
        )}

        {currentPage === "event-register" && selectedSlug && (
          <EventRegistrationPage
            eventId={selectedSlug}
            onBackToEvent={(slug) => handleNavigate("event-details", slug)}
            onBackToEvents={() => handleNavigate("events")}
            onRegistrationSuccess={(registrationId, token) =>
              handleNavigate("event-confirmation", { slug: registrationId, token })
            }
          />
        )}

        {currentPage === "event-confirmation" && selectedSlug && (
          <EventRegistrationConfirmationPage
            registrationId={selectedSlug}
            initialToken={selectedToken}
            onBackToEvents={() => handleNavigate("events")}
            onSelectEvent={(slug) => handleNavigate("event-details", slug)}
          />
        )}

        {currentPage === "news" && <News />}

        {currentPage === "resources" && (
          <Resources onOpenPortalModal={() => setIsPortalModalOpen(true)} />
        )}

        {currentPage === "contact" && <Contact />}

        {currentPage === "portal-guide" && (
          <StudentPortalGuide
            onLaunchStudentDashboard={onLaunchStudentDashboard}
            onNavigateToApply={() => handleNavigate("apply")}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
            onSwitchToERP={onSwitchToERP}
          />
        )}

        {(currentPage === "verify" ||
          currentPage === "privacy-policy" ||
          currentPage === "cookie-policy" ||
          currentPage === "terms" ||
          currentPage === "accessibility" ||
          currentPage === "fees" ||
          currentPage === "sitemap" ||
          currentPage === "not-found") && (
          <PublicGovernancePages
            page={currentPage}
            onNavigate={(page) => handleNavigate(page)}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
            onOpenCookieSettings={() => setCookieSettingsOpen(true)}
            onSwitchToERP={onSwitchToERP}
          />
        )}
      </main>

      {/* Global Footer */}
      <WebsiteFooter
        onNavigate={handleNavigate}
        onOpenPortalModal={() => setIsPortalModalOpen(true)}
        onSwitchToERP={onSwitchToERP}
        onOpenCookieSettings={() => setCookieSettingsOpen(true)}
        onOpenVerifyModal={() => setVerifyModalOpen(true)}
        onOpenEnquireModal={() => setEnquireModalOpen(true)}
      />

      {/* Interactive Portal Access & Sign-In Modal */}
      <PortalAccessModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        onLaunchStudentDashboard={onLaunchStudentDashboard}
        onSwitchToERP={onSwitchToERP}
        onNavigateToApply={() => {
          setIsPortalModalOpen(false);
          handleNavigate("apply");
        }}
      />

      {/* Floating Grounded Chatbot & AI Support Desk (Modules 36 & 39) */}
      <CollegeChatbot
        onNavigateToApply={() => handleNavigate("apply")}
        onOpenPortalModal={() => setIsPortalModalOpen(true)}
      />

      {/* Privacy & Browser Storage Consent (COOKIES.md) */}
      <CookieConsentBanner
        externalOpen={cookieSettingsOpen}
        onExternalClose={() => setCookieSettingsOpen(false)}
        onNavigate={(page) => handleNavigate(page)}
      />

      {/* Public Credential Verify & Admissions CRM Enquiry (/?verify=CODE, /?enquire=1) */}
      <PublicVerifyEnquireModals
        verifyModalOpen={verifyModalOpen}
        onCloseVerify={() => setVerifyModalOpen(false)}
        enquireModalOpen={enquireModalOpen}
        onCloseEnquire={() => setEnquireModalOpen(false)}
      />
    </div>
  );
}
