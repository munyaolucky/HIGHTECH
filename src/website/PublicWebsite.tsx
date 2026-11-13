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
import CollegeChatbot from "./components/CollegeChatbot";
import CookieConsentBanner from "./components/CookieConsentBanner";
import PublicVerifyEnquireModals from "./components/PublicVerifyEnquireModals";
import { CourseProgramme } from "../types";
import { COURSES_CATALOGUE } from "../data/college";

interface PublicWebsiteProps {
  onSwitchToERP: (role: string) => void;
  onLaunchStudentDashboard: () => void;
}

export default function PublicWebsite({
  onSwitchToERP,
  onLaunchStudentDashboard,
}: PublicWebsiteProps) {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedCourse, setSelectedCourse] = useState<CourseProgramme | null>(
    COURSES_CATALOGUE[0]
  );
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [enquireModalOpen, setEnquireModalOpen] = useState(false);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCourse = (course: CourseProgramme) => {
    setSelectedCourse(course);
    setCurrentPage("course-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyCourse = (course: CourseProgramme) => {
    setSelectedCourse(course);
    setCurrentPage("apply");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Global Header */}
      <WebsiteHeader
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenPortalModal={() => setIsPortalModalOpen(true)}
        onSwitchToERP={onSwitchToERP}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === "home" && (
          <Home
            onNavigate={handleNavigate}
            onSelectCourse={handleSelectCourse}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
          />
        )}

        {currentPage === "about" && (
          <About
            onNavigate={handleNavigate}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
          />
        )}

        {currentPage === "academics" && (
          <Academics
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
            onNavigate={handleNavigate}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
          />
        )}

        {currentPage === "apply" && (
          <Apply
            selectedCourse={selectedCourse}
            onNavigateToPortalGuide={() => handleNavigate("portal-guide")}
            onLaunchStudentDashboard={onLaunchStudentDashboard}
          />
        )}

        {currentPage === "campus-life" && <CampusLife />}

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
