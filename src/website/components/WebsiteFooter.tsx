import React, { useState, type FormEvent } from "react";
import {
  GraduationCap,
  BookOpen,
  BriefcaseBusiness,
  Cpu,
  Monitor,
  Building2,
  Headset,
  Award,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  Facebook,
  Linkedin,
  Youtube,
  Send,
  ShieldCheck,
  Newspaper,
  LockKeyhole,
  Settings,
} from "lucide-react";
import { COLLEGE_INFO } from "../../data/college";
import { websiteApi } from "../../modules/website/website-api";

export interface FooterNavTarget {
  page: string;
  slug?: string;
  categoryFilter?: string;
  levelFilter?: string;
  departmentFilter?: string;
}

interface WebsiteFooterProps {
  onNavigate: (page: string, options?: Omit<FooterNavTarget, "page">) => void;
  onOpenPortalModal: () => void;
  onSwitchToERP: (role: string) => void;
  onOpenCookieSettings?: () => void;
  onOpenVerifyModal?: () => void;
  onOpenEnquireModal?: () => void;
}

export default function WebsiteFooter({
  onNavigate,
  onOpenPortalModal,
  onSwitchToERP,
  onOpenCookieSettings,
  onOpenVerifyModal,
  onOpenEnquireModal,
}: WebsiteFooterProps) {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [campusImageError, setCampusImageError] = useState(false);

  const quickLinks: { label: string; href: string; target: FooterNavTarget }[] = [
    { label: "Home", href: "/", target: { page: "home" } },
    { label: "About Us", href: "/about", target: { page: "about" } },
    { label: "Departments & Staff", href: "/departments", target: { page: "departments" } },
    { label: "Academics", href: "/academics", target: { page: "academics" } },
    { label: "Admissions", href: "/admissions", target: { page: "admissions" } },
    { label: "Campus", href: "/campus", target: { page: "campus" } },
    { label: "Student Life", href: "/student-life", target: { page: "student-life" } },
    { label: "Events & Registration", href: "/events", target: { page: "events" } },
    { label: "Graduation & Convocation", href: "/graduation", target: { page: "graduation" } },
    { label: "Digital Library", href: "/resources", target: { page: "resources" } },
    { label: "News & Bulletins", href: "/news", target: { page: "news" } },
    { label: "FAQs", href: "/admissions", target: { page: "admissions" } },
    { label: "Contact Us", href: "/contact", target: { page: "contact" } },
  ];

  const services: {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    onClick: () => void;
  }[] = [
    {
      label: "ICT & Computing",
      href: "/departments/ict-computer-science",
      icon: Monitor,
      onClick: () => goTo({ page: "department-details", slug: "ict-computer-science" }),
    },
    {
      label: "AI & Machine Learning",
      href: "/departments/artificial-intelligence-data-science",
      icon: Cpu,
      onClick: () =>
        goTo({ page: "department-details", slug: "artificial-intelligence-data-science" }),
    },
    {
      label: "Business Management",
      href: "/departments/business-management",
      icon: BriefcaseBusiness,
      onClick: () => goTo({ page: "department-details", slug: "business-management" }),
    },
    {
      label: "Engineering & Technology",
      href: "/departments/engineering-technical-studies",
      icon: Building2,
      onClick: () =>
        goTo({ page: "department-details", slug: "engineering-technical-studies" }),
    },
    {
      label: "E-Learning Portal",
      href: "/portal/login",
      icon: BookOpen,
      onClick: () => onOpenPortalModal(),
    },
    {
      label: "Library Services",
      href: "/portal/library",
      icon: BookOpen,
      onClick: () => onSwitchToERP("library"),
    },
    {
      label: "Student Support",
      href: "/student-life",
      icon: Headset,
      onClick: () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("hitech:open-chat"));
        }
      },
    },
    {
      label: "Certifications (KNEC/KASNEB/TVET)",
      href: "/verify",
      icon: Award,
      onClick: () => (onOpenVerifyModal ? onOpenVerifyModal() : goTo({ page: "verify" })),
    },
  ];

  const socialLinks = [
    {
      label: "Facebook",
      href: COLLEGE_INFO.socialLinks.facebook,
      bgClass: "bg-[#1877f2]",
      icon: Facebook,
    },
    {
      label: "X (Twitter)",
      href: COLLEGE_INFO.socialLinks.twitter,
      bgClass: "bg-[#151515]",
      icon: null,
    },
    {
      label: "YouTube",
      href: COLLEGE_INFO.socialLinks.youtube,
      bgClass: "bg-[#e30620]",
      icon: Youtube,
    },
    {
      label: "LinkedIn",
      href: COLLEGE_INFO.socialLinks.linkedin,
      bgClass: "bg-[#0879ae]",
      icon: Linkedin,
    },
    {
      label: "Telegram",
      href: "https://t.me/hitechcollegeke",
      bgClass: "bg-[#229ed9]",
      icon: Send,
    },
  ];

  function goTo(target: FooterNavTarget) {
    const { page, slug, categoryFilter, levelFilter, departmentFilter } = target;
    onNavigate(page, { slug, categoryFilter, levelFilter, departmentFilter });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = email.trim();
    if (!cleaned) {
      setFeedback({ type: "error", text: "Please enter your email address." });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await websiteApi.subscribeNewsletter(cleaned, "website-footer");
      setFeedback({ type: "success", text: res.message });
      if (!res.alreadySubscribed) {
        setEmail("");
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Subscription failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-[#061b3d] text-white overflow-hidden">
      {/* Decorative Curved Cream / Red / Navy Top Wave */}
      <div className="relative w-full h-10 sm:h-12 bg-[#f5ebdd] overflow-hidden" aria-hidden="true">
        <svg
          viewBox="0 0 1440 56"
          preserveAspectRatio="none"
          className="block w-full h-full"
        >
          <path
            d="M0,18 C280,52 540,4 820,24 C1080,44 1260,6 1440,14 L1440,56 L0,56 Z"
            fill="#e30620"
          />
          <path
            d="M0,26 C290,56 560,12 830,30 C1090,48 1270,12 1440,22 L1440,56 L0,56 Z"
            fill="#061b3d"
          />
        </svg>
      </div>

      {/* Main 4-Column Footer Body */}
      <div className="max-w-[1510px] mx-auto px-5 sm:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-9 lg:gap-10 items-start">
          {/* Column 1: Brand, Institutional Overview, Stats & Social */}
          <section className="xl:col-span-4 space-y-6">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                goTo({ page: "home" });
              }}
              aria-label="HI-TECH College homepage"
              className="flex items-center gap-4 group"
            >
              <div className="w-[82px] min-w-[82px] h-[96px] rounded-[44%_44%_48%_48%] border-[3px] border-white bg-gradient-to-br from-[#173c6b] to-[#061b3d] text-[#ffc928] flex flex-col items-center justify-center gap-1 shadow-[0_0_0_3px_rgba(255,201,40,0.22)]">
                <GraduationCap size={42} strokeWidth={1.7} />
                <span className="text-[10px] font-black tracking-wide text-white bg-[#e30620] px-2 py-0.5 rounded-sm">
                  HI-TECH
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-[28px] font-black tracking-tight leading-none whitespace-nowrap">
                  HI-TECH <span className="text-[#e30620]">COLLEGE</span>
                </div>
                <p className="mt-2 text-xs italic text-[#c5d0e1]">
                  {COLLEGE_INFO.motto}
                </p>
              </div>
            </a>

            <p className="text-xs sm:text-[13px] leading-relaxed text-[#dce5f2] max-w-md">
              {COLLEGE_INFO.tagline}. Providing government-accredited diploma and certificate
              programmes in Computing, Artificial Intelligence, Business Management, and
              Engineering with high-fidelity digital campus infrastructure.
            </p>

            {/* Institutional Statistics Box */}
            <div className="grid grid-cols-3 border border-white/25 rounded-2xl py-3.5 px-2 bg-white/[0.035] divide-x divide-white/30 tabular-nums">
              <div className="flex flex-col items-center justify-center text-center px-2 gap-1">
                <GraduationCap className="w-6 h-6 text-[#ffc928]" />
                <strong className="text-lg sm:text-xl font-black text-white">
                  {COLLEGE_INFO.stats.studentsEnrolled.toLocaleString()}+
                </strong>
                <span className="text-[11px] text-[#c5d0e1]">Enrolled Students</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center px-2 gap-1">
                <Award className="w-6 h-6 text-[#ffc928]" />
                <strong className="text-lg sm:text-xl font-black text-white">
                  {COLLEGE_INFO.stats.knecCdaccPassRate}%
                </strong>
                <span className="text-[11px] text-[#c5d0e1]">Success Rate</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center px-2 gap-1">
                <BookOpen className="w-6 h-6 text-[#ffc928]" />
                <strong className="text-lg sm:text-xl font-black text-white">
                  {COLLEGE_INFO.stats.academicProgrammes}+
                </strong>
                <span className="text-[11px] text-[#c5d0e1]">Programmes</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <strong className="text-sm font-bold text-white">Follow Us:</strong>
              <div className="flex flex-wrap items-center gap-2.5">
                {socialLinks.map(({ label, href, bgClass, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-10 h-10 rounded-full ${bgClass} text-white flex items-center justify-center transition-transform hover:-translate-y-1 shadow-sm`}
                  >
                    {Icon ? (
                      <Icon size={18} />
                    ) : (
                      <span className="text-sm font-black leading-none">X</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Column 2: Quick Links */}
          <section className="xl:col-span-2">
            <h3 className="min-h-[46px] border-b border-white/25 border-l-4 border-l-[#e30620] pl-3.5 pb-2.5 mb-5 flex items-center gap-2.5 text-lg font-extrabold">
              <GraduationCap className="w-5 h-5 text-white shrink-0" />
              <span>Quick Links</span>
            </h3>

            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(link.target);
                    }}
                    className="group flex items-center gap-2 text-xs sm:text-[13px] text-[#e1e9f4] hover:text-[#ffc928] transition-all"
                  >
                    <ChevronRight
                      size={15}
                      className="text-[#ffc928] shrink-0 transition-transform group-hover:translate-x-1"
                    />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Column 3: Our Services */}
          <section className="xl:col-span-2">
            <h3 className="min-h-[46px] border-b border-white/25 border-l-4 border-l-[#e30620] pl-3.5 pb-2.5 mb-5 flex items-center gap-2.5 text-lg font-extrabold">
              <Settings className="w-5 h-5 text-white shrink-0" />
              <span>Our Services</span>
            </h3>

            <ul className="space-y-3.5">
              {services.map(({ label, href, icon: Icon, onClick }) => (
                <li key={label}>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      onClick();
                    }}
                    className="flex items-center gap-3 text-xs sm:text-[13px] leading-snug text-[#e1e9f4] hover:text-[#ffc928] transition-colors"
                  >
                    <Icon size={19} className="text-[#ffc928] shrink-0" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Column 4: Contact Us, Campus Card & Newsletter */}
          <section className="xl:col-span-4 space-y-6">
            <h3 className="min-h-[46px] border-b border-white/25 border-l-4 border-l-[#e30620] pl-3.5 pb-2.5 flex items-center gap-2.5 text-lg font-extrabold">
              <Phone className="w-5 h-5 text-white shrink-0" />
              <span>Contact Us</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-5 items-start">
              {/* Contact Information */}
              <div className="xl:col-span-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 min-w-[32px] rounded-full bg-[#e30620] flex items-center justify-center text-white">
                    <MapPin size={15} />
                  </span>
                  <p className="text-xs leading-relaxed text-[#e1e9f4]">
                    <strong className="text-white block">{COLLEGE_INFO.shortName}</strong>
                    {COLLEGE_INFO.headquarters.address},
                    <br />
                    {COLLEGE_INFO.headquarters.postalCode}, {COLLEGE_INFO.headquarters.city}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 min-w-[32px] rounded-full bg-[#e30620] flex items-center justify-center text-white">
                    <Phone size={15} />
                  </span>
                  <p className="text-xs leading-relaxed text-[#e1e9f4] tabular-nums">
                    <a
                      href={`tel:${COLLEGE_INFO.contacts.mainPhone.replace(/\s+/g, "")}`}
                      className="hover:text-[#ffc928] transition-colors block"
                    >
                      {COLLEGE_INFO.contacts.mainPhone}
                    </a>
                    <a
                      href={`tel:${COLLEGE_INFO.contacts.admissionsPhone.replace(/\s+/g, "")}`}
                      className="hover:text-[#ffc928] transition-colors block"
                    >
                      {COLLEGE_INFO.contacts.admissionsPhone}
                    </a>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 min-w-[32px] rounded-full bg-[#e30620] flex items-center justify-center text-white">
                    <Mail size={15} />
                  </span>
                  <p className="text-xs leading-relaxed text-[#e1e9f4]">
                    <a
                      href={`mailto:${COLLEGE_INFO.contacts.email}`}
                      className="hover:text-[#ffc928] transition-colors break-all"
                    >
                      {COLLEGE_INFO.contacts.email}
                    </a>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 min-w-[32px] rounded-full bg-[#e30620] flex items-center justify-center text-white">
                    <Clock size={15} />
                  </span>
                  <p className="text-xs leading-relaxed text-[#e1e9f4]">
                    Mon - Fri: 7:30 AM - 6:00 PM
                    <br />
                    Sat: 8:00 AM - 2:00 PM
                  </p>
                </div>
              </div>

              {/* Campus Preview Card */}
              <div className="xl:col-span-6">
                <a
                  href="/campus"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo({ page: "campus" });
                  }}
                  aria-label="Explore our campus"
                  className="group relative block h-44 rounded-2xl overflow-hidden border border-white/30 bg-[#173c6b] shadow-md"
                >
                  {!campusImageError ? (
                    <img
                      src="/src/assets/images/hitech_innovation_campus_1794981896251.jpg"
                      alt="HI-TECH College campus and students"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() => setCampusImageError(true)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#173c6b] via-[#102d50] to-[#061b3d] flex items-center justify-center text-[#ffc928]">
                      <Building2 size={44} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3.5 py-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent text-xs font-bold text-white">
                    <Building2 size={16} className="text-[#ffc928] shrink-0" />
                    <span>Explore Our Campus</span>
                    <ArrowRight
                      size={16}
                      className="ml-auto transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </a>
              </div>
            </div>

            {/* Newsletter Box */}
            <div className="border-l-2 border-white/25 pl-4 pt-1">
              <div className="flex items-center gap-3 mb-3">
                <Newspaper size={24} className="text-[#ffc928] shrink-0" />
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    Subscribe to Our Newsletter
                  </h4>
                  <p className="text-xs text-[#c5d0e1]">
                    Get the latest updates and academic news.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                <label htmlFor="ht-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="ht-newsletter-email"
                  type="email"
                  required
                  value={email}
                  disabled={submitting}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 min-w-0 h-11 px-3.5 rounded-lg border border-[#c9d4e4] bg-white text-[#15233b] text-xs font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 px-5 rounded-lg bg-[#e30620] hover:bg-[#b80019] disabled:opacity-65 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>{submitting ? "Sending..." : "Subscribe"}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {feedback && (
                <p
                  role="status"
                  className={`mt-2 text-xs font-medium ${
                    feedback.type === "error" ? "text-red-300" : "text-[#ffc928]"
                  }`}
                >
                  {feedback.text}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Student & Staff Portals Strip */}
      <div className="border-t border-white/15 bg-[#08162a] px-5 sm:px-8 py-5">
        <div className="max-w-[1510px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black tracking-wide text-[#ffc928] uppercase">
              <LockKeyhole size={14} />
              <span>Student &amp; Staff Portals</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenPortalModal}
                className="inline-flex items-center justify-between gap-4 min-w-[200px] px-4 py-2.5 rounded-lg bg-[#e30620] hover:bg-[#b80019] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Student Portal Login</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => goTo({ page: "portal-guide" })}
                className="inline-flex items-center justify-between gap-4 min-w-[200px] px-4 py-2.5 rounded-lg bg-[#102b52] hover:bg-[#193d70] border border-[#28518d] hover:border-[#ffc928] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span>How to Access Portal Guide</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#c5d0e1]">
            <button
              type="button"
              onClick={() => onSwitchToERP("staff")}
              className="hover:text-[#ffc928] transition-colors font-semibold cursor-pointer"
            >
              Staff Portal Login
            </button>
            <button
              type="button"
              onClick={() => onSwitchToERP("activate-account")}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Activate Invited Account
            </button>
            <button
              type="button"
              onClick={() => onSwitchToERP("manual-registration")}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Manual User Registration Desk
            </button>
            <button
              type="button"
              onClick={() => onSwitchToERP("catalogue")}
              className="text-amber-300 hover:text-white transition-colors font-semibold cursor-pointer"
            >
              Master Blueprint (84 Modules)
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Verified Accreditations Bar */}
      <div className="border-t-[3px] border-[#ffc928] bg-[#061323] px-5 sm:px-8 py-5">
        <div className="max-w-[1510px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <p className="text-[11px] leading-relaxed text-[#c5d0e1]">
            © {currentYear} {COLLEGE_INFO.name}. All Rights Reserved.
            <br />
            Reg No: {COLLEGE_INFO.registrationNumber} · KNEC Exam Centre 2040182.
          </p>

          <nav
            aria-label="Legal and verification links"
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#c5d0e1]"
          >
            <button
              type="button"
              onClick={() => (onOpenVerifyModal ? onOpenVerifyModal() : goTo({ page: "verify" }))}
              className="text-amber-300 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Verify Certificate
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => goTo({ page: "fees" })}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Fees Structure
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => onOpenEnquireModal?.()}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Admissions Enquiry
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => goTo({ page: "privacy-policy" })}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => goTo({ page: "terms" })}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => goTo({ page: "cookie-policy" })}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Cookie Policy
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => goTo({ page: "accessibility" })}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Accessibility
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => goTo({ page: "sitemap" })}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Sitemap
            </button>
            <span aria-hidden="true" className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => onOpenCookieSettings?.()}
              className="hover:text-[#ffc928] transition-colors cursor-pointer"
            >
              Cookie Settings
            </button>
          </nav>

          {/* Verified Kenyan Accreditation Credentials + Back to Top */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#ffc928] shrink-0" />
              <span className="flex flex-col text-[10px] leading-tight text-[#c5d0e1]">
                <strong className="text-xs text-white font-bold">TVETA</strong>
                Approved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-[#ffc928] shrink-0" />
              <span className="flex flex-col text-[10px] leading-tight text-[#c5d0e1]">
                <strong className="text-xs text-white font-bold">KNEC</strong>
                Registered
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#ffc928] shrink-0" />
              <span className="flex flex-col text-[10px] leading-tight text-[#c5d0e1]">
                <strong className="text-xs text-white font-bold">CDACC / KASNEB</strong>
                Accredited Centre
              </span>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              title="Back to top"
              className="ml-1 w-10 h-10 rounded-full border border-white/40 bg-[#173c6b] hover:bg-[#e30620] text-white flex items-center justify-center transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
