"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { DYNAMITE_2026 } from "@/lib/data/dynamite2026";
import { cn } from "@/lib/utils";

export default function AttendeeSchedulePage() {
  const event = DYNAMITE_2026;
  const [activeTrack, setActiveTrack] = useState("all");
  const [qaCount, setQaCount] = useState(42);
  const [audioRelayActive, setAudioRelayActive] = useState(false);

  const tracks = [
    { id: "all", label: "All Tracks", icon: "tune" },
    { id: "keynotes", label: "Keynotes", icon: "mic" },
    { id: "ai", label: "AI & Agents", icon: "psychology" },
    { id: "hackathon", label: "Hackathon", icon: "terminal" },
    { id: "firesides", label: "Firesides", icon: "rocket_launch" },
    { id: "collegiate", label: "Collegiate", icon: "school" },
  ];

  return (
    <div className="min-h-screen bg-[#111319] text-[#e2e2ea] flex flex-col">
      <PublicNavbar />

      <main className="w-full pt-16 flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 py-8 flex flex-col gap-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.07)]">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#4cd7f6] uppercase tracking-wider mb-1">
                <span>{event.name}</span>
                <span>•</span>
                <span>OCT 8, 2026</span>
              </div>
              <h1 className="font-geist text-2xl lg:text-3xl font-bold text-[#e2e2ea] tracking-tight">
                Official Conference Timeline
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/${event.id}/passes`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#282a30] text-[#c0c1ff] hover:bg-[#33353b] font-mono text-xs border border-[rgba(255,255,255,0.08)] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>My Pass (#DYN-0482)</span>
              </Link>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTrack(t.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full font-mono text-xs transition-all shadow-sm",
                  activeTrack === t.id
                    ? "bg-[#8083ff] text-[#1000a9] font-semibold"
                    : "bg-[#1d2025] hover:bg-[#282a30] text-[#c7c4d7] border border-[rgba(255,255,255,0.05)]"
                )}
              >
                <span className="material-symbols-outlined text-sm">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ============================================================
              LIVE NOW SPOTLIGHT CARD
              ============================================================ */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1d2025] p-5 lg:p-6 shadow-2xl border border-[rgba(255,255,255,0.08)]">
            {/* Ambient glowing backdrop aura */}
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#8083ff]/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
              {/* Status Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#03b5d3]/20 text-[#4cd7f6] font-mono text-xs font-bold tracking-wider uppercase border border-[#4cd7f6]/30">
                    <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-ping" />
                    LIVE NOW
                  </span>
                  <span className="font-mono text-xs text-[#c7c4d7]">
                    10:00 – 11:15 AM
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#c7c4d7] font-mono text-xs">
                  <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
                    location_on
                  </span>
                  <span>Stage 01 • Main Auditorium</span>
                </div>
              </div>

              {/* Title & Speakers */}
              <div className="flex flex-col gap-2">
                <h2 className="font-geist text-xl font-bold text-[#e2e2ea] leading-tight">
                  Keynote: Decentralized AI Networks & Edge Compute in Education
                </h2>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex -space-x-2 overflow-hidden">
                    <img
                      className="inline-block h-8 w-8 rounded-full object-cover border border-[#4cd7f6]/50 shadow-md"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                      alt="Dr. Vikram Sethi"
                    />
                    <img
                      className="inline-block h-8 w-8 rounded-full object-cover border border-[#8083ff]/50 shadow-md"
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                      alt="Arvind Swamy"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 font-geist text-xs">
                    <span className="text-[#e2e2ea] font-medium truncate">
                      Dr. Vikram Sethi & Arvind Swamy
                    </span>
                    <span className="text-[#908fa0] truncate">
                      EventOS Consortium Core
                    </span>
                  </div>
                </div>
              </div>

              {/* Telemetry Progress & Capacity Bar */}
              <div className="rounded-xl bg-[#191c21] p-4 flex flex-col gap-2 border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[#908fa0]">Progress (64%)</span>
                  <span className="text-[#4cd7f6] font-semibold">Ends in 27m</span>
                </div>
                <div className="w-full bg-[#282a30] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4cd7f6] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_currentColor]"
                    style={{ width: "64%" }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#908fa0]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span>
                    <span>Turnstiles: 1,140 inside</span>
                  </span>
                  <span className="text-[#EF4444] font-medium">95% Full • SRO</span>
                </div>
              </div>

              {/* Interactive Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1 font-geist text-xs">
                <button
                  type="button"
                  onClick={() => setQaCount(qaCount + 1)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8083ff] text-[#1000a9] font-semibold hover:bg-[#c0c1ff] active:scale-[0.98] transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-base">forum</span>
                  <span>Slido Q&A ({qaCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioRelayActive(!audioRelayActive)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm border",
                    audioRelayActive
                      ? "bg-[#4cd7f6] text-[#003640] border-[#4cd7f6]"
                      : "bg-[#282a30] text-[#e2e2ea] hover:bg-[#33353b] border-[rgba(255,255,255,0.08)]"
                  )}
                >
                  <span className="material-symbols-outlined text-base">
                    {audioRelayActive ? "graphic_eq" : "podcasts"}
                  </span>
                  <span>{audioRelayActive ? "Relay Listening..." : "Audio Relay"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================
              UP NEXT IN YOUR ITINERARY (RESERVED SESSION DETAIL)
              ============================================================ */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8083ff] text-base">
                  bookmark_added
                </span>
                <h3 className="font-mono text-xs uppercase font-semibold text-[#8083ff] tracking-wider">
                  UP NEXT IN YOUR ITINERARY
                </h3>
              </div>
              <span className="font-mono text-xs text-[#908fa0]">RESERVED PASS</span>
            </div>

            <div className="flex flex-col rounded-2xl bg-[#191c21] p-5 lg:p-6 gap-4 border border-[rgba(255,255,255,0.07)] shadow-xl relative overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs text-[#4cd7f6] font-semibold">
                    11:30 AM – 01:00 PM (90m)
                  </span>
                  <div className="flex items-center gap-1 text-[#908fa0] font-mono text-xs">
                    <span className="material-symbols-outlined text-xs">meeting_room</span>
                    <span>Hall 2 • Begumpet Convention Wing</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#8083ff]/15 text-[#c0c1ff] font-mono text-xs font-bold tracking-wider border border-[#8083ff]/30">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>POD E-14</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-geist text-lg font-semibold text-[#e2e2ea]">
                  Hands-on Event AI Workshop: Building Realtime Agent Swarms
                </h4>
                <div className="flex items-center gap-2.5 font-geist text-xs text-[#c7c4d7]">
                  <img
                    className="w-7 h-7 rounded-full object-cover border border-[#8083ff]/40"
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80"
                    alt="Maya Lin"
                  />
                  <span>
                    Led by <strong className="text-[#e2e2ea]">Maya Lin</strong> (Lead Architect @ EventOS) + Mentors
                  </span>
                </div>
              </div>

              {/* Prerequisites Alert Callout */}
              <div className="p-3.5 rounded-xl bg-[#282a30] border border-[rgba(255,255,255,0.08)] flex items-start gap-3">
                <span className="material-symbols-outlined text-[#F59E0B] text-base mt-0.5">
                  info
                </span>
                <div className="font-geist text-xs text-[#c7c4d7] leading-relaxed">
                  <strong className="text-[#e2e2ea]">Prerequisites:</strong> Bring your charged laptop with Python 3.11+ and Docker installed. Local LLM models will be distributed over local LAN mesh.
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              AFTERNOON SESSIONS TIMELINE
              ============================================================ */}
          <div className="flex flex-col gap-3">
            <h3 className="font-mono text-xs uppercase font-semibold text-[#908fa0] tracking-wider">
              AFTERNOON TRACKS
            </h3>

            <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#908fa0]">02:00 PM – 04:30 PM</span>
                  <span className="text-[#464554]">•</span>
                  <span className="text-[#4cd7f6]">Arena Stage C</span>
                </div>
                <h4 className="font-geist text-base font-semibold text-[#e2e2ea]">
                  Dynamite 2026 Grand Hackathon Pitch
                </h4>
                <p className="font-geist text-xs text-[#908fa0]">
                  12 Finalist Collegiate Teams pitching before VCs and Industry CTOs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => alert("Spot reserved for Grand Pitch!")}
                className="px-4 py-2 rounded-lg bg-[#282a30] hover:bg-[#33353b] text-[#e2e2ea] font-mono text-xs font-medium border border-[rgba(255,255,255,0.08)] transition-colors self-end sm:self-auto"
              >
                RSVP Spot
              </button>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
