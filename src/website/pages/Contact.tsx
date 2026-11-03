import React, { useState } from "react";
import { COLLEGE_INFO } from "../../data/college";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Building,
  ShieldCheck,
} from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Admissions Office");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    }, 500);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f274a] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-900/60 border border-blue-700/60 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>Multi-Campus Network Across Kenya</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Contact HI-TECH College
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Have questions about admissions, academic certificates, fee payments, or campus tours? Get in touch with our admissions counsellors and administrative team.
          </p>
        </div>
      </div>

      {/* Main Grid: Form & Contact Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Enquiry Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Send an Enquiry / Request Callback
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Our support desk will respond within 4 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">Thank you for your enquiry!</h4>
                <p className="text-xs text-emerald-700">
                  Your message has been assigned to the <strong>{department}</strong> desk. An admissions advisor will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs font-bold text-emerald-800 underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mary Atieno"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. mary@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0722 000 111"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Department *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Admissions Office">Admissions & Enrolment</option>
                      <option value="School of Computing">School of Computing & IT</option>
                      <option value="School of Business">School of Business Studies</option>
                      <option value="Finance & Fees">Finance & Fee Enquiries</option>
                      <option value="Academic Registrar">Registrar & Transcripts</option>
                      <option value="Student Support Desk">Student Portal & IT Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Message or Enquiry *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry (e.g. course fees, intake dates, hostel availability)..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#153b70] hover:bg-[#0f274a] text-white px-6 py-3 rounded-lg font-bold text-xs transition flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

          {/* Contact Details & Campuses */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0f274a] text-white p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-base text-white">Central Institutional Contacts</h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Main Campus Headquarters</strong>
                    <span>{COLLEGE_INFO.headquarters.address}, {COLLEGE_INFO.headquarters.city}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Admissions Helplines</strong>
                    <span>{COLLEGE_INFO.contacts.admissionsPhone} / {COLLEGE_INFO.contacts.mainPhone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Official Email</strong>
                    <span>{COLLEGE_INFO.contacts.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Office Working Hours</strong>
                    <span>Monday - Friday: 7:30 AM - 6:00 PM</span>
                    <span className="block">Saturday: 8:00 AM - 2:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campus List Preview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                Regional Campuses
              </h4>
              {COLLEGE_INFO.campuses.slice(1).map((camp, idx) => (
                <div key={idx} className="space-y-0.5 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="font-bold text-slate-900">{camp.name}</span>
                  <p className="text-slate-500 text-[11px]">{camp.address}</p>
                  <p className="text-blue-700 font-mono text-[11px]">{camp.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
