"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { OrbitalVisualization } from "@/components/landing/OrbitalVisualization";
import { PipelineGrid } from "@/components/landing/PipelineGrid";
import { ClientValueSections } from "@/components/landing/ClientValueSections";
import { LiveTelemetryCockpit } from "@/components/landing/LiveTelemetryCockpit";
import { TrustTicker } from "@/components/landing/TrustTicker";
import { RequestDemoModal } from "@/components/landing/RequestDemoModal";

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#111319] text-[#e2e2ea] flex flex-col selection:bg-[#8083ff] selection:text-[#1000a9]">
      <PublicNavbar />

      <main className="w-full pt-16 flex-1 flex flex-col">
        {/* ============================================================
            HERO SECTION
            ============================================================ */}
        <section className="relative w-full px-4 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[90vh] bg-[#0c0e13] overflow-hidden">
          {/* Ambient Orbital Lighting Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-[#8083ff]/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[340px] h-[340px] bg-[#4cd7f6]/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Top Status Badge */}
          <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#282a30] border border-[rgba(255,255,255,0.08)] shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4cd7f6]" />
            </span>
            <span className="font-mono text-xs tracking-wider text-[#e2e2ea] uppercase">
              EVENTOS v4.0 PILOT VERIFIED <span className="text-[#464554]">•</span> THE OPERATING SYSTEM FOR MODERN EVENTS
            </span>
          </div>

          {/* Main Architectural Headline */}
          <div className="relative z-10 text-center max-w-5xl mt-6 flex flex-col items-center">
            <h1 className="font-geist text-3xl sm:text-5xl lg:text-6xl font-semibold text-[#e2e2ea] tracking-tight uppercase max-w-4xl text-balance leading-none">
              THE OPERATING SYSTEM FOR MODERN EVENTS.
            </h1>

            {/* Lifecycle Pipeline Flow Banner */}
            <div className="mt-4 px-3 py-1.5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.06)] font-mono text-[11px] sm:text-xs text-[#4cd7f6] flex flex-wrap items-center justify-center gap-1.5 shadow-inner">
              <span className="text-white font-semibold">Registration</span>
              <span className="text-[#908fa0]">→</span>
              <span className="text-[#c0c1ff] font-semibold">QR Pass</span>
              <span className="text-[#908fa0]">→</span>
              <span className="text-white font-semibold">Check-in</span>
              <span className="text-[#908fa0]">→</span>
              <span className="text-[#4cd7f6] font-semibold">Attendance</span>
              <span className="text-[#908fa0]">→</span>
              <span className="text-[#c0c1ff] font-semibold">Certificates</span>
              <span className="text-[#908fa0]">→</span>
              <span className="text-white font-semibold">Analytics</span>
              <span className="text-[#908fa0]">→</span>
              <span className="text-[#10B981] font-semibold">AI Copilot</span>
            </div>

            <p className="font-geist text-sm sm:text-base lg:text-lg text-[#c7c4d7] max-w-3xl mt-4 text-balance leading-relaxed">
              EventOS works seamlessly alongside your existing registration and ticketing sources (Google Forms, Luma, Townscript, or direct CSV rosters). From attendee ingress to tamper-proof certificates, run your entire event with zero bottlenecks.
            </p>

            {/* Action Cluster */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#8083ff] text-[#1000a9] font-geist text-sm sm:text-base font-semibold shadow-[0_0_30px_rgba(128,131,255,0.4)] hover:shadow-[0_0_45px_rgba(128,131,255,0.6)] hover:bg-[#c0c1ff] transition-all duration-200"
              >
                <span className="material-symbols-outlined text-xl">calendar_month</span>
                <span>Request a Demo</span>
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>

              <Link
                href="/dashboard/evt_dynamite2026"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#282a30] text-[#e2e2ea] hover:bg-[#33353b] border border-[rgba(255,255,255,0.08)] shadow-md transition-all duration-200 font-geist text-sm sm:text-base font-medium"
              >
                <span
                  className="material-symbols-outlined text-[#4cd7f6] text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_circle
                </span>
                <span>Explore Interactive Demo</span>
              </Link>

              <Link
                href="/org/org_dynamite_default/events/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#191c21] hover:bg-[#20232a] text-[#c7c4d7] hover:text-white border border-[rgba(255,255,255,0.06)] transition-all font-geist text-sm font-medium"
              >
                <span className="material-symbols-outlined text-base">add_box</span>
                <span>Create Live Event</span>
              </Link>
            </div>
          </div>

          {/* 3D Spatial Event Core Showcase */}
          <OrbitalVisualization />

          {/* Live Featured Demo Showcase Event Banner */}
          <div className="relative z-10 w-full max-w-6xl mt-8">
            <div className="w-full p-4 lg:p-6 rounded-2xl bg-[#1d2025] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#282a30] text-[#4cd7f6] flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-2xl">
                    local_fire_department
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-bold uppercase tracking-wider">
                      PILOT DEMO SHOWCASE
                    </span>
                    <span className="font-mono text-xs text-[#c7c4d7]">
                      OCTOBER • HYDERABAD (HICC)
                    </span>
                  </div>
                  <h3 className="font-geist text-base lg:text-lg font-semibold text-[#e2e2ea] tracking-tight mt-0.5">
                    DYNAMITE 2026 — Autonomous Systems & AI Summit
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-6 self-end md:self-auto font-mono text-xs">
                <div className="text-right">
                  <div className="text-[#908fa0]">REGISTERED</div>
                  <div className="text-sm font-semibold text-[#4cd7f6]">
                    1,247 <span className="text-[#908fa0]">/ 1,500</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-[rgba(255,255,255,0.1)] hidden sm:block" />

                <div className="text-right">
                  <div className="text-[#908fa0]">ADMITTED</div>
                  <div className="text-sm font-semibold text-[#c0c1ff]">
                    842 <span className="text-[#908fa0]">(67.5%)</span>
                  </div>
                </div>

                <Link
                  href="/dashboard/evt_dynamite2026"
                  className="px-4 py-2 rounded-lg bg-[#282a30] hover:bg-[#33353b] text-[#e2e2ea] font-medium transition-colors border border-[rgba(255,255,255,0.08)] flex items-center gap-1.5"
                >
                  <span>Launch Demo Console</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            LIFECYCLE PIPELINE ARCHITECTURE SECTION
            ============================================================ */}
        <PipelineGrid />

        {/* ============================================================
            CLIENT VALUE SECTIONS (FOR COLLEGES & ORGANIZERS)
            ============================================================ */}
        <ClientValueSections />

        {/* ============================================================
            INTERACTIVE LIVE TELEMETRY COCKPIT SECTION
            ============================================================ */}
        <LiveTelemetryCockpit />

        {/* ============================================================
            TRUST TICKER & ARCHITECTURE RELIABILITY
            ============================================================ */}
        <section className="w-full px-4 lg:px-8 py-16 bg-[#111319] border-t border-[rgba(255,255,255,0.05)]">
          <TrustTicker />
        </section>
      </main>

      <PublicFooter />

      {/* Interactive Request Demo Modal */}
      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}
