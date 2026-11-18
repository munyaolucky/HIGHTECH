import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import computingLabImg from "../../assets/images/hitech_computing_lab_1794981896260.jpg";
import innovationHubImg from "../../assets/images/hitech_innovation_campus_1794981896251.jpg";
import campusBannerImg from "../../assets/images/campus_hero_banner_1794587290452.jpg";
import libraryPromoImg from "../../assets/images/student_library_promo_1794587291004.jpg";
import studentPortraitImg from "../../assets/images/student_profile_portrait_1794587291385.jpg";

interface HeroProps {
  onNavigate: (page: string) => void;
  onOpenPortalModal: () => void;
}

interface HeroCampusSlide {
  id: string;
  image: string;
  alt: string;
  tag: string;
  title: string;
  caption: string;
}

const CAMPUS_SLIDES: HeroCampusSlide[] = [
  {
    id: "ai-lab",
    image: computingLabImg,
    alt: "HI-TECH College students collaborating at dual-monitor workstations in the AI and Computer Science Laboratory",
    tag: "AI & COMPUTING LAB",
    title: "38+ Dual-Screen Practical Labs",
    caption: "Hands-on software engineering, cloud, and AI model training",
  },
  {
    id: "innovation-hub",
    image: innovationHubImg,
    alt: "Students walking across the landscaped courtyard outside the HI-TECH College Innovation Hub at golden hour",
    tag: "INNOVATION HUB",
    title: "Modern Digital Campus",
    caption: "Nairobi, Mombasa & Kisumu learning centres with high-speed Wi-Fi",
  },
  {
    id: "digital-library",
    image: libraryPromoImg,
    alt: "HI-TECH College students studying with laptops inside the modern digital library and resource centre",
    tag: "DIGITAL LIBRARY",
    title: "24/7 E-Resources & Study Commons",
    caption: "Thousands of technical texts, KNEC past papers, and IEEE journals",
  },
  {
    id: "main-campus",
    image: campusBannerImg,
    alt: "Panoramic architectural view of the HI-TECH College main academic complex",
    tag: "MAIN CAMPUS",
    title: "TVETA & KNEC Accredited Excellence",
    caption: "Industry-aligned diplomas and certificates since 2012",
  },
];

export default function Hero({ onNavigate, onOpenPortalModal }: HeroProps) {
  const { reducedMotion } = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentSlide = CAMPUS_SLIDES[activeSlide];
  const autoPlayActive = !isPaused && !reducedMotion;

  useEffect(() => {
    if (!autoPlayActive) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAMPUS_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [autoPlayActive]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + CAMPUS_SLIDES.length) % CAMPUS_SLIDES.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % CAMPUS_SLIDES.length);
  };

  return (
    <div className="relative bg-[#0d2345] text-white overflow-hidden">
      {/* Animated Ambient Campus Backdrop */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {CAMPUS_SLIDES.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.image}
            alt=""
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
              index === activeSlide ? "opacity-25 hero-ken-burns" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07162c]/95 via-[#0d2345]/88 to-[#0d2345]/75" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      {/* Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 lg:pt-14 lg:pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headlines, Call to Actions & Campus Visual Strip */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Accreditation Badge */}
            <div className="hero-fade-up inline-flex items-center gap-2 bg-blue-900/70 border border-blue-700/70 text-blue-100 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Government Registered &amp; TVETA Accredited College</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-fade-up hero-delay-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Shape the Future of <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-white">
                Technology &amp; Innovation
              </span>
            </h1>

            {/* Subheading */}
            <p className="hero-fade-up hero-delay-2 text-base sm:text-lg text-slate-200 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Equip yourself with industry-validated diplomas and certificates in Computing, Artificial Intelligence, Business Management, and Engineering. Join over 4,800 students on a modern digital campus.
            </p>

            {/* Action Buttons */}
            <div className="hero-fade-up hero-delay-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => onNavigate("apply")}
                className="bg-[#d92332] hover:bg-[#b81d2a] text-white px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-red-950/40 flex items-center gap-2 group cursor-pointer"
              >
                <span>Apply for 2026 Intake</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>

              <button
                type="button"
                onClick={onOpenPortalModal}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/25 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer backdrop-blur-sm"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Student Portal Login</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("academics")}
                className="text-slate-200 hover:text-white px-3 py-3 text-sm font-semibold transition-colors underline underline-offset-4 cursor-pointer"
              >
                Explore Programmes
              </button>
            </div>

            {/* Trust Points */}
            <div className="hero-fade-up hero-delay-3 pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>TVET CDACC &amp; KNEC Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Flexible Day &amp; Evening Classes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant Reg No &amp; Portal Access</span>
              </div>
            </div>

            {/* Interactive Campus Photo Selector Strip */}
            <div className="hero-fade-up hero-delay-3 pt-3">
              <div className="grid grid-cols-4 gap-2.5 max-w-lg mx-auto lg:mx-0">
                {CAMPUS_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`View campus showcase: ${slide.title}`}
                      aria-pressed={isActive}
                      className={`group relative rounded-xl overflow-hidden aspect-video border transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-300 ${
                        isActive
                          ? "border-sky-300 ring-2 ring-sky-400/50 scale-[1.03] shadow-lg"
                          : "border-white/20 opacity-75 hover:opacity-100 hover:border-white/50"
                      }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent px-1.5 py-1 text-[9px] font-bold tracking-wide text-white truncate block text-left">
                        {slide.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Animated Campus Image Showcase & Portal Gateway Card */}
          <div className="lg:col-span-6 hero-fade-up hero-delay-2">
            <div className="bg-gradient-to-b from-white/12 to-white/5 border border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-2xl space-y-4">
              {/* Live Crossfading Campus Photography Carousel */}
              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-white/15 group">
                {CAMPUS_SLIDES.map((slide, idx) => (
                  <img
                    key={slide.id}
                    src={slide.image}
                    alt={slide.alt}
                    referrerPolicy="no-referrer"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                      idx === activeSlide
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-105 pointer-events-none"
                    }`}
                  />
                ))}

                {/* Editorial Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07162c]/95 via-[#07162c]/25 to-transparent pointer-events-none" />

                {/* Top Overlay Pill & Playback Controls */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#07162c]/80 backdrop-blur-md border border-white/20 text-sky-200 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{currentSlide.tag}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPaused((p) => !p)}
                      aria-label={isPaused ? "Resume campus slideshow" : "Pause campus slideshow"}
                      className="w-7 h-7 rounded-full bg-[#07162c]/80 hover:bg-[#07162c] border border-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      aria-label="Previous campus photo"
                      className="w-7 h-7 rounded-full bg-[#07162c]/80 hover:bg-[#07162c] border border-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      aria-label="Next campus photo"
                      className="w-7 h-7 rounded-full bg-[#07162c]/80 hover:bg-[#07162c] border border-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Caption & Slide Indicators */}
                <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                      {currentSlide.title}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-200 truncate">
                      {currentSlide.caption}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pb-1">
                    {CAMPUS_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlide(idx)}
                        aria-label={`Show slide ${idx + 1}: ${slide.title}`}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activeSlide ? "w-5 bg-amber-400" : "w-1.5 bg-white/45 hover:bg-white/75"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Animated Slide Progress Bar */}
                {autoPlayActive && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/15">
                    <div
                      key={activeSlide}
                      className="h-full bg-gradient-to-r from-sky-400 to-amber-400 hero-slide-progress"
                    />
                  </div>
                )}
              </div>

              {/* Compact Portal Gateway Header with Real Student Portrait */}
              <div className="bg-slate-900/65 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3 hero-float-slow">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={studentPortraitImg}
                    alt="Verified student Amina Wanjiku portrait"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400/70 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                      <span>Digital Student Portal · Live Profile</span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      Amina Wanjiku (HCA/STU/2026/001)
                    </div>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  ACTIVE
                </span>
              </div>

              {/* Portal Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="text-[10px] text-slate-300">Course Units</div>
                  <div className="font-bold text-white text-xs sm:text-sm mt-0.5">6 Registered</div>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="text-[10px] text-slate-300">Trimester GPA</div>
                  <div className="font-bold text-amber-300 text-xs sm:text-sm mt-0.5">3.75 Distinction</div>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="text-[10px] text-slate-300">Transcripts</div>
                  <div className="font-bold text-emerald-300 text-xs sm:text-sm mt-0.5">Instant PDF</div>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="text-[10px] text-slate-300">M-Pesa STK</div>
                  <div className="font-bold text-sky-300 text-xs sm:text-sm mt-0.5">Direct Push</div>
                </div>
              </div>

              {/* Direct Portal Entrance Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenPortalModal}
                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all duration-200 hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enter Student Portal Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("portal-guide")}
                  className="text-[11px] font-semibold text-slate-200 hover:text-white underline underline-offset-2 whitespace-nowrap px-2 py-1.5 cursor-pointer"
                >
                  Portal Access Guide →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Statistics Banner Strip */}
      <div className="relative z-10 bg-[#08182f]/95 border-t border-b border-blue-900/60 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">4,850+</div>
            <div className="text-xs text-blue-200 mt-0.5">Enrolled Students</div>
          </div>
          <div className="transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">98.4%</div>
            <div className="text-xs text-blue-200 mt-0.5">TVET Exam Pass Rate</div>
          </div>
          <div className="transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">38+</div>
            <div className="text-xs text-blue-200 mt-0.5">Modern Computer Labs</div>
          </div>
          <div className="transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">100%</div>
            <div className="text-xs text-blue-200 mt-0.5">Attachment Placement</div>
          </div>
        </div>
      </div>
    </div>
  );
}

