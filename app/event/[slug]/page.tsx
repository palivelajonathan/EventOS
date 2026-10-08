"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DYNAMITE_2026 } from "@/lib/data/dynamite2026";
import { LiveBeacon, Button, Badge } from "@/components/ui";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PublicEventPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "dynamite-2026";
  const event = DYNAMITE_2026;
  const [selectedTier, setSelectedTier] = useState<string>("VIP");

  return (
    <div className="min-h-screen bg-[#08090d] text-white flex flex-col selection:bg-[#8083ff]/30 selection:text-[#c5c6d3]">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#8083ff]/15 to-[#4cd7f6]/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-6 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161a24] border border-[rgba(255,255,255,0.08)]">
              <LiveBeacon color="cyan" pulse label="HYDERABAD'S LARGEST STUDENT SUMMIT" />
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight font-mono uppercase bg-clip-text text-transparent bg-gradient-to-b from-white via-[#e3e2ec] to-[#8e909a]">
              {event.name}
            </h1>

            <p className="text-lg md:text-xl text-[#c5c6d3] font-light max-w-2xl mx-auto leading-relaxed">
              {event.tagline}. Multi-college hackathons, agent intelligence keynotes, and verifiable peer credentials.
            </p>

            {/* Quick Meta Chips */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[#8e909a] pt-2">
              <span className="flex items-center gap-1.5 bg-[#111319] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.06)]">
                <span className="material-symbols-outlined text-sm text-[#8083ff]">
                  calendar_today
                </span>
                {event.date}
              </span>

              <span className="flex items-center gap-1.5 bg-[#111319] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.06)]">
                <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
                  location_on
                </span>
                {event.venue}, {event.city}
              </span>

              <span className="flex items-center gap-1.5 bg-[#111319] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.06)]">
                <span className="material-symbols-outlined text-sm text-[#6be794]">
                  group
                </span>
                1,247 / 1,500 Registered
              </span>
            </div>

            {/* Tactical Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/dashboard/evt_dynamite2026/passes">
                <Button variant="primary" size="lg" className="font-mono text-sm px-8 shadow-lg shadow-[#8083ff]/20">
                  <span className="material-symbols-outlined text-base mr-2">
                    id_card
                  </span>
                  Claim Holographic Pass
                </Button>
              </Link>

              <Link href={`/event/${slug}/schedule`}>
                <Button variant="secondary" size="lg" className="font-mono text-sm px-8">
                  <span className="material-symbols-outlined text-base mr-2">
                    schedule
                  </span>
                  Full Schedule & Stages
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Keynote Speakers */}
        <section className="py-16 px-6 max-w-7xl mx-auto border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-mono text-[#8083ff] tracking-widest uppercase">
                LINEUP // SPEAKERS
              </span>
              <h2 className="text-2xl font-bold font-mono text-white mt-1">
                STAGE KEYNOTES & MENTORS
              </h2>
            </div>
            <Link
              href={`/event/${slug}/schedule`}
              className="text-xs font-mono text-[#4cd7f6] hover:underline flex items-center gap-1"
            >
              View Full Schedule
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {event.sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-6 rounded-2xl bg-[#111319] border border-[rgba(255,255,255,0.06)] hover:border-[#8083ff]/40 transition-all duration-300 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={sess.speaker.avatar}
                    alt={sess.speaker.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#8083ff]/40"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">
                      {sess.speaker.name}
                    </h3>
                    <p className="text-xs text-[#8083ff]">
                      {sess.speaker.title}
                    </p>
                    <p className="text-xs text-[#8e909a]">
                      {sess.speaker.org}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[rgba(255,255,255,0.05)]">
                  <span className="text-[10px] font-mono text-[#4cd7f6] uppercase tracking-wider block">
                    {sess.timeSlot} • {sess.stage}
                  </span>
                  <p className="text-xs font-semibold text-[#c5c6d3] mt-1 line-clamp-2">
                    {sess.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pass Tiers & Registration */}
        <section className="py-16 px-6 max-w-7xl mx-auto border-t border-[rgba(255,255,255,0.06)]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono text-[#4cd7f6] tracking-widest uppercase">
              REGISTRATION // ACCESS TIERS
            </span>
            <h2 className="text-3xl font-bold font-mono text-white">
              SELECT YOUR ACCESS SPECIFICATION
            </h2>
            <p className="text-xs text-[#8e909a] font-mono">
              Every pass generates a cryptographic SHA-256 verifiable credential with offline turnstile validity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "STUDENT",
                name: "STUDENT / HACKER",
                price: "₹499",
                perks: [
                  "Access to Main Arena & Annex",
                  "24h Hackathon Participation",
                  "Digital Attendance Credential",
                  "Standard Ingress Gates",
                ],
                recommended: false,
              },
              {
                id: "VIP",
                name: "VIP / ALL-ACCESS",
                price: "₹1,299",
                perks: [
                  "Front Row Keynote Seating",
                  "Speaker Lounge & Mixer Access",
                  "Priority Gate 01 Fast-Track",
                  "Holographic Apple/Google Wallet Pass",
                  "Honors Verifiable Certificate",
                ],
                recommended: true,
              },
              {
                id: "DELEGATE",
                name: "CAMPUS DELEGATE",
                price: "₹649",
                perks: [
                  "College Representative Badge",
                  "Career Fair Priority Ingress",
                  "Workshop Lab Seat Guarantee",
                  "Digital Credential Vault",
                ],
                recommended: false,
              },
            ].map((tier) => (
              <div
                key={tier.id}
                className={`p-6 rounded-2xl relative transition-all duration-300 border flex flex-col justify-between ${
                  tier.recommended
                    ? "bg-[#141724] border-[#8083ff] shadow-[0_0_30px_rgba(128,131,255,0.15)]"
                    : "bg-[#111319] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]"
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#8083ff] text-[10px] font-mono font-bold tracking-wider uppercase text-white shadow-md">
                    MOST POPULAR
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-mono text-white">
                      {tier.name}
                    </h3>
                    <div className="text-3xl font-extrabold font-mono text-white">
                      {tier.price}
                    </div>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#c5c6d3] font-mono">
                    {tier.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-[#6be794]">
                          check_circle
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link href="/dashboard/evt_dynamite2026/passes" className="w-full">
                    <Button
                      variant={tier.recommended ? "primary" : "secondary"}
                      size="sm"
                      className="w-full justify-center text-xs font-mono"
                    >
                      Acquire {tier.id} Pass
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
