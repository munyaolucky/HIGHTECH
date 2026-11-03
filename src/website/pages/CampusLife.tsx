import React from "react";
import {
  Users,
  Trophy,
  Home,
  Sparkles,
  HeartHandshake,
  Cpu,
  Coffee,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function CampusLife() {
  const clubs = [
    {
      name: "HI-TECH Robotics & AI Club",
      members: "240+ Active Members",
      focus: "Embedded systems, drone automation, computer vision, and machine learning competitions.",
      icon: Cpu,
    },
    {
      name: "Developer Student Circle (Google & Microsoft)",
      members: "380+ Members",
      focus: "Full-stack web, cloud architecture, open source contributions, and weekly code sprints.",
      icon: Sparkles,
    },
    {
      name: "Rotaract Club of HI-TECH College",
      members: "150+ Members",
      focus: "Community service, leadership mentorship, environmental conservation, and social outreach.",
      icon: HeartHandshake,
    },
    {
      name: "Debate & Model United Nations",
      members: "90+ Members",
      focus: "Public speaking, parliamentary debate, critical thinking, and inter-collegiate tournaments.",
      icon: Users,
    },
  ];

  const hostelFeatures = [
    "High-speed campus fiber Wi-Fi in all resident halls",
    "24/7 CCTV surveillance and biometric access turnstiles",
    "Subsidized hot meal plan at the modern campus cafeteria",
    "Quiet study lounges and collaborative project rooms",
    "On-site clinic, student nurse and wellness counselors",
    "Solar water heating and reliable backup power generators",
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f274a] text-white py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-900/60 border border-blue-700/60 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Vibrant Student Experience</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Campus Life & Student Experience
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            At HI-TECH College, learning goes far beyond lecture halls. Discover student clubs, competitive sports, secure hostel facilities, and student leadership opportunities.
          </p>
        </div>
      </div>

      {/* Clubs & Societies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
            Extracurricular Excellence
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Student Clubs & Innovation Societies
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {clubs.map((club, idx) => {
            const Icon = club.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#153b70] flex items-center justify-center font-bold">
                  <Icon className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{club.name}</h3>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  {club.members}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">{club.focus}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hostel Accommodation & Living */}
      <div className="bg-slate-50 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
                Secure Living & Accommodation
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Hostels & Residential Services
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We provide affordable, clean, and fully-equipped on-campus and partnered private hostels. Located within walking distance of academic lecture rooms and digital laboratories.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {hostelFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Hostel Booking Through Student Portal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admitted students can reserve hostel rooms, select room types (Executive Single, 2-Sharing, or 4-Sharing), and pay hostel deposits directly through their <strong>Student Portal</strong>.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">Single Room</span>
                  <strong className="text-[#153b70] text-sm">KES 14,000</strong>
                  <span className="text-[10px] text-slate-400 block">/ term</span>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">2-Sharing</span>
                  <strong className="text-[#153b70] text-sm">KES 9,500</strong>
                  <span className="text-[10px] text-slate-400 block">/ term</span>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">4-Sharing</span>
                  <strong className="text-[#153b70] text-sm">KES 6,500</strong>
                  <span className="text-[10px] text-slate-400 block">/ term</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sports & Recreation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-[#0f274a] to-[#153b70] text-white p-8 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h3 className="font-bold text-base text-white">Championship Athletics</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              HI-TECH teams compete in the Kenya National TVET Sports Organization (KETTISO) tournaments in football, rugby, basketball, and volleyball.
            </p>
          </div>
          <div className="space-y-2">
            <Cpu className="w-8 h-8 text-sky-400" />
            <h3 className="font-bold text-base text-white">E-Sports & Hackathons</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Quarterly inter-departmental coding hackathons, cybersecurity CTF challenges, and competitive gaming leagues in our gaming hub.
            </p>
          </div>
          <div className="space-y-2">
            <HeartHandshake className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Student Welfare & Mentorship</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dedicated student guidance counsellors, career placement advisors, and peer tutoring networks to ensure every student succeeds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
