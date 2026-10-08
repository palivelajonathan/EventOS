"use client";

import { useState } from "react";

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestDemoModal({ isOpen, onClose }: RequestDemoModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [eventType, setEventType] = useState("College Fest");
  const [attendeeCount, setAttendeeCount] = useState("500 - 1,500");
  const [ticketingSource, setTicketingSource] = useState("Google Forms / CSV");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#191c21] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#908fa0] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4 font-geist">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/30">
              <span className="material-symbols-outlined text-3xl">check</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Demo Request Scheduled!
            </h3>
            <p className="text-xs text-[#c7c4d7] max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="text-white font-semibold">{fullName}</span>. Our deployment engineers will prepare a dedicated sandboxed EventOS environment for <span className="text-white font-semibold">{organization}</span> and reach out to <span className="text-[#4cd7f6] font-mono">{email}</span>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#8083ff] text-[#1000a9] font-bold text-xs uppercase tracking-wider hover:bg-[#c0c1ff] transition-all"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-[#4cd7f6] uppercase tracking-wider font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
                Schedule Client Demonstration
              </div>
              <h2 className="text-xl font-bold text-white font-geist tracking-tight">
                Experience EventOS For Your Event
              </h2>
              <p className="text-xs text-[#908fa0] font-geist">
                See live turnstile scanning, CSV ingestion, dynamic digital passes, and instant credential verification in action.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-geist text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#908fa0]">Your Full Name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aditya Sharma"
                    className="w-full bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-white outline-none focus:border-[#8083ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#908fa0]">Work / College Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditya@college.edu"
                    className="w-full bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-white outline-none focus:border-[#8083ff]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#908fa0]">College / Organization Name</label>
                <input
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. CBIT Student Council, TechFest 2026"
                  className="w-full bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-white outline-none focus:border-[#8083ff]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#908fa0]">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-white outline-none focus:border-[#8083ff]"
                  >
                    <option value="College Fest">College Fest</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Conference / Summit">Conference / Summit</option>
                    <option value="Workshop / Seminar">Workshop / Seminar</option>
                    <option value="Student Community Event">Student Community Event</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#908fa0]">Expected Attendees</label>
                  <select
                    value={attendeeCount}
                    onChange={(e) => setAttendeeCount(e.target.value)}
                    className="w-full bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-white outline-none focus:border-[#8083ff]"
                  >
                    <option value="< 500">&lt; 500 Attendees</option>
                    <option value="500 - 1,500">500 – 1,500 Attendees</option>
                    <option value="1,500 - 5,000">1,500 – 5,000 Attendees</option>
                    <option value="5,000+">5,000+ Attendees</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#908fa0]">Existing Registration Source</label>
                <select
                  value={ticketingSource}
                  onChange={(e) => setTicketingSource(e.target.value)}
                  className="w-full bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-white outline-none focus:border-[#8083ff]"
                >
                  <option value="Google Forms / CSV">Google Forms / CSV Roster</option>
                  <option value="Luma / Townscript">Luma / Townscript / External Tickets</option>
                  <option value="College ERP / Portal">College ERP / Internal Portal</option>
                  <option value="Direct EventOS Registration">Direct EventOS Registration</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#8083ff] text-[#1000a9] font-bold text-xs uppercase tracking-wider hover:bg-[#c0c1ff] transition-all shadow-[0_0_20px_rgba(128,131,255,0.4)] disabled:opacity-50"
                >
                  {loading ? "Scheduling Demo..." : "Request Product Demo →"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
