"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DYNAMITE_2026, MOCK_PARTICIPANTS, Participant, EventData } from "@/lib/data/dynamite2026";
import { getLiveEventData } from "@/lib/services/eventDataService";
import { useAuth } from "@/lib/auth/authContext";
import { cn } from "@/lib/utils";

type ScanState = "verified" | "duplicate" | "invalid";

export default function GateControlPage() {
  const urlParams = useParams();
  const { getAuthHeaders } = useAuth();
  const eventId = (urlParams?.eventId as string) || "evt_dynamite2026";
  const [event, setEvent] = useState<EventData>(DYNAMITE_2026);
  const [activeMode, setActiveMode] = useState<"optical" | "manual" | "nfc">("optical");
  const [activeState, setActiveState] = useState<ScanState>("verified");
  const [manualQuery, setManualQuery] = useState("");
  const [currentAttendee, setCurrentAttendee] = useState<Participant>(MOCK_PARTICIPANTS[0]);
  const [chimeEnabled, setChimeEnabled] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      const data = await getLiveEventData(eventId);
      setEvent(data);
    }
    loadEvent();
  }, [eventId]);

  // Audio tone generation for realistic gate experience
  const playChime = (type: "success" | "alert") => {
    if (!chimeEnabled || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext may be restricted by browser policy
    }
  };

  const executeCheckIn = async (passCode: string) => {
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          passCode,
          eventId,
          gateName: "Gate 01 • Main Arena",
        }),
      });
      const result = await res.json();
      if (result.status === "SUCCESS") {
        setCurrentAttendee(result.participant);
        setActiveState("verified");
        playChime("success");
      } else if (result.status === "ALREADY CHECKED IN") {
        if (result.participant) setCurrentAttendee((prev) => ({ ...prev, ...result.participant }));
        setActiveState("duplicate");
        playChime("alert");
      } else {
        setActiveState("invalid");
        playChime("alert");
      }
    } catch (err) {
      console.error("Gate check-in error:", err);
      setActiveState("invalid");
      playChime("alert");
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    executeCheckIn(manualQuery);
  };

  const setDiagnostic = (state: ScanState) => {
    setActiveState(state);
    if (state === "verified") {
      setCurrentAttendee(MOCK_PARTICIPANTS[0]);
      playChime("success");
    } else if (state === "duplicate") {
      playChime("alert");
    } else {
      playChime("alert");
    }
  };

  return (
    <AppShell eventId={event.id} eventName={event.name} stageName="GATE CONTROL ACTIVE">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto p-4 lg:p-8 gap-6">
        {/* ============================================================
            GATE CONSOLE SUB-HEADER BAR
            ============================================================ */}
        <div className="p-4 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
              <span className="font-mono text-xs font-semibold text-[#e2e2ea]">
                TERMINAL: CONCOURSE-ALPHA-01
              </span>
            </div>

            <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] hidden sm:block" />

            <span className="font-mono text-xs text-[#908fa0]">
              OPERATOR: JONATHAN (STAFF ID: #STF-882)
            </span>

            <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] hidden md:block" />

            <span className="font-mono text-xs text-[#4cd7f6] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">speed</span>
              LATENCY: 12ms (EDGE OPTIMAL)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Chime toggle */}
            <button
              type="button"
              onClick={() => setChimeEnabled(!chimeEnabled)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors",
                chimeEnabled
                  ? "bg-[#1d2025] text-[#10B981] border-[#10B981]/30"
                  : "bg-[#1d2025] text-[#908fa0] border-[rgba(255,255,255,0.08)]"
              )}
            >
              <span className="material-symbols-outlined text-sm">
                {chimeEnabled ? "volume_up" : "volume_off"}
              </span>
              <span className="hidden sm:inline">
                CHIME: {chimeEnabled ? "ENABLED" : "MUTED"}
              </span>
            </button>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 bg-[#0c0e13] p-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
              {(["optical", "manual", "nfc"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveMode(m)}
                  className={cn(
                    "px-3 py-1 rounded font-mono text-xs uppercase transition-all",
                    activeMode === m
                      ? "bg-[#8083ff] text-[#1000a9] font-semibold shadow-sm"
                      : "text-[#908fa0] hover:text-[#e2e2ea]"
                  )}
                >
                  {m === "optical" ? "Optical HUD" : m === "manual" ? "Manual ID" : "NFC Tap"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
            MAIN SCANNER HUD GRID (LEFT SCANNER, RIGHT ATTENDEE)
            ============================================================ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Camera Viewport HUD & Recent Pipeline */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#0c0e13] border border-[rgba(255,255,255,0.07)] shadow-2xl flex flex-col">
              {/* Camera Viewport Area */}
              <div className="relative h-[440px] w-full bg-[#0c0e13] overflow-hidden flex items-center justify-center select-none">
                {/* Background image overlay */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 scale-105"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e13] via-transparent to-[#0c0e13]/80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e13]/80 via-transparent to-[#0c0e13]/80" />

                {/* Top status chips */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#282a30]/80 backdrop-blur-md font-mono text-xs text-[#4cd7f6] border border-[#4cd7f6]/20">
                    <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-ping" />
                    FOV: 60FPS LOW-LATENCY OPTICAL STREAM
                  </span>
                </div>
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-[#282a30]/70 font-mono text-[10px] text-[#908fa0]">
                    AUTO-EXPOSURE: ACTIVE
                  </span>
                </div>

                {/* Target Scanner Reticle Box */}
                <div className="relative w-64 h-64 flex items-center justify-center z-10">
                  {/* Neon Cyan Corner Reticles */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#4cd7f6]" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#4cd7f6]" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#4cd7f6]" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#4cd7f6]" />

                  {/* Laser Scan Sweep Animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4cd7f6] to-transparent shadow-[0_0_12px_#4cd7f6] animate-laser" />

                  {/* QR Graphic locked in target */}
                  <div className="p-3 bg-[#0c0e13]/90 rounded-xl shadow-2xl flex flex-col items-center border border-[rgba(255,255,255,0.1)]">
                    <svg className="w-32 h-32 text-[#e2e2ea]" fill="currentColor" viewBox="0 0 100 100">
                      <rect fill="none" height="28" rx="2" stroke="currentColor" strokeWidth="5" width="28" x="5" y="5" />
                      <rect fill="currentColor" height="14" width="14" x="12" y="12" />
                      <rect fill="none" height="28" rx="2" stroke="currentColor" strokeWidth="5" width="28" x="67" y="5" />
                      <rect fill="currentColor" height="14" width="14" x="74" y="12" />
                      <rect fill="none" height="28" rx="2" stroke="currentColor" strokeWidth="5" width="28" x="5" y="67" />
                      <rect fill="currentColor" height="14" width="14" x="12" y="74" />
                      <rect fill="currentColor" height="8" width="8" x="42" y="10" />
                      <rect fill="currentColor" height="16" width="6" x="42" y="24" />
                      <rect fill="currentColor" height="8" width="16" x="10" y="44" />
                      <rect fill="currentColor" height="10" width="10" x="32" y="44" />
                      <rect fill="currentColor" height="18" width="8" x="52" y="44" />
                      <rect fill="currentColor" height="6" width="14" x="68" y="42" />
                      <rect fill="currentColor" height="22" width="8" x="86" y="42" />
                      <rect fill="currentColor" height="6" width="18" x="42" y="70" />
                      <rect fill="currentColor" height="24" width="10" x="70" y="68" />
                      <rect fill="currentColor" height="8" width="16" x="42" y="84" />
                    </svg>
                    <div className="mt-2 flex items-center gap-1 font-mono text-xs text-[#4cd7f6] font-semibold">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      <span>LOCK: {currentAttendee.passId} [VALID]</span>
                    </div>
                  </div>

                  <div className="absolute -bottom-8 flex items-center gap-2 font-mono text-[10px] text-[#c7c4d7]">
                    <span>ALIGN CODE WITHIN TARGET RETICLE</span>
                  </div>
                </div>

                {/* Viewport bottom stats */}
                <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between font-mono text-xs text-[#908fa0]">
                  <span>ZOOM: 1.0X DIGITAL FIX</span>
                  <span className="text-[#4cd7f6] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                    AUTOFOCUS LOCKED
                  </span>
                  <span>BUFFER: READY</span>
                </div>
              </div>

              {/* Quick ID Search & Telemetry Summary Below Scanner */}
              <div className="p-4 bg-[#191c21] flex flex-col gap-3 border-t border-[rgba(255,255,255,0.07)]">
                <form onSubmit={handleManualSearch} className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#908fa0]">
                    search
                  </span>
                  <input
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Scan hardware ready... Or type DYN-xxxx, Student Name, Roll No. (Press Enter)"
                    className="w-full bg-[#0c0e13] text-[#e2e2ea] pl-10 pr-24 py-2.5 rounded-xl text-xs font-geist outline-none border border-[rgba(255,255,255,0.08)] placeholder:text-[#908fa0] focus:border-[#c0c1ff] transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-[#282a30] font-mono text-[10px] text-[#908fa0]">
                    /
                  </kbd>
                </form>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="bg-[#1d2025] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col">
                    <span className="text-[#908fa0] text-[10px] uppercase tracking-wider">
                      Today Verified
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-geist text-xl font-semibold text-[#4cd7f6]">
                        412
                      </span>
                      <span className="text-[#908fa0] text-[10px]">pax</span>
                    </div>
                    <span className="text-[#4cd7f6]/80 text-[10px] mt-1">
                      ▲ 98.2% throughput
                    </span>
                  </div>

                  <div className="bg-[#1d2025] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col">
                    <span className="text-[#908fa0] text-[10px] uppercase tracking-wider">
                      Duplicate Flags
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-geist text-xl font-semibold text-[#EF4444]">
                        3
                      </span>
                      <span className="text-[#908fa0] text-[10px]">re-entries</span>
                    </div>
                    <span className="text-[#EF4444]/80 text-[10px] mt-1">
                      Audited via Gate 01
                    </span>
                  </div>

                  <div className="bg-[#1d2025] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col">
                    <span className="text-[#908fa0] text-[10px] uppercase tracking-wider">
                      Invalid Hash
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-geist text-xl font-semibold text-[#e2e2ea]">
                        0
                      </span>
                      <span className="text-[#908fa0] text-[10px]">rejects</span>
                    </div>
                    <span className="text-[#908fa0] text-[10px] mt-1">
                      Zero counterfeit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Passenger Pipeline Log */}
            <div className="flex flex-col gap-2 bg-[#191c21] p-4 rounded-2xl border border-[rgba(255,255,255,0.07)]">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#908fa0] uppercase">RECENT PASSENGER PIPELINE</span>
                <span className="text-[#4cd7f6] hover:underline cursor-pointer">
                  Full Log (F4)
                </span>
              </div>
              <div className="space-y-1.5 mt-1 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#282a30]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-[#e2e2ea] font-medium">10:41:55 AM</span>
                    <span className="text-[#908fa0]">DYN-0481</span>
                    <span className="text-[#e2e2ea] truncate max-w-[140px]">
                      Sarah Al-Mansoor
                    </span>
                  </div>
                  <span className="text-[#10B981] font-semibold">PASS GRANTED</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#282a30]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-[#e2e2ea] font-medium">10:41:20 AM</span>
                    <span className="text-[#908fa0]">DYN-0480</span>
                    <span className="text-[#e2e2ea] truncate max-w-[140px]">
                      Vikramaditya Rao
                    </span>
                  </div>
                  <span className="text-[#10B981] font-semibold">PASS GRANTED</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#282a30]/40">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                    <span className="text-[#e2e2ea] font-medium">10:40:02 AM</span>
                    <span className="text-[#908fa0]">DYN-0312</span>
                    <span className="text-[#e2e2ea] truncate max-w-[140px]">
                      Devin DeSilva
                    </span>
                  </div>
                  <span className="text-[#EF4444] font-semibold">DUPLICATE DETECTED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Scanned Attendee Card */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            <div className="bg-[#191c21] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.07)] shadow-2xl">
              {/* Header Banner - Status Adaptive */}
              {activeState === "verified" ? (
                <div className="bg-[#064e3b]/80 p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-[#10B981]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center text-[#0c0e13] shadow-[0_0_16px_rgba(16,185,129,0.5)]">
                      <span className="material-symbols-outlined text-2xl font-bold">check</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-geist text-base font-semibold text-[#d1fae5] tracking-tight uppercase">
                        VERIFIED — ACCESS GRANTED
                      </span>
                      <span className="font-mono text-xs text-[#a7f3d0]">
                        CLEARANCE CODE: SEC-STAGE-A // TURNSTILE 2 OPEN
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col font-mono">
                    <span className="text-xs text-[#d1fae5] font-semibold">10:42:18 AM</span>
                    <span className="text-[10px] text-[#a7f3d0]/80">Oct 24, 2026</span>
                  </div>
                </div>
              ) : activeState === "duplicate" ? (
                <div className="bg-[#450a0a]/80 p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-[#EF4444]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EF4444] flex items-center justify-center text-[#0c0e13] shadow-[0_0_16px_rgba(239,68,68,0.5)]">
                      <span className="material-symbols-outlined text-2xl font-bold">warning</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-geist text-base font-semibold text-[#fee2e2] tracking-tight uppercase">
                        ENTRY REJECTED — DUPLICATE PASS
                      </span>
                      <span className="font-mono text-xs text-[#fca5a5]">
                        ALREADY CHECKED IN AT 10:14 AM VIA GATE 01
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col font-mono">
                    <span className="text-xs text-[#fee2e2] font-semibold">SECURITY FLAGGED</span>
                    <span className="text-[10px] text-[#fca5a5]/80">Station 01</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#78350f]/80 p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-[#F59E0B]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#0c0e13] shadow-[0_0_16px_rgba(245,158,11,0.5)]">
                      <span className="material-symbols-outlined text-2xl font-bold">gpp_bad</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-geist text-base font-semibold text-[#fef3c7] tracking-tight uppercase">
                        SIGNATURE REJECTED — UNREGISTERED
                      </span>
                      <span className="font-mono text-xs text-[#fde68a]">
                        NO MATCHING HASH IN EVENT DATABASE REGISTRY
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col font-mono">
                    <span className="text-xs text-[#fef3c7] font-semibold">ERR-404</span>
                    <span className="text-[10px] text-[#fde68a]/80">Invalid Signature</span>
                  </div>
                </div>
              )}

              {/* Attendee Profile Section */}
              <div className="p-6 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1d2025] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={currentAttendee.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                        alt={currentAttendee.name}
                        className="w-20 h-20 rounded-xl object-cover shadow-md border border-[rgba(255,255,255,0.1)]"
                      />
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-[#4cd7f6] text-[#003640] font-mono text-[10px] font-bold">
                        {activeState === "verified" ? "VALID" : "ALERT"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-geist text-xl font-semibold text-[#e2e2ea] leading-tight">
                        {currentAttendee.name}
                      </span>
                      <span className="font-geist text-xs text-[#908fa0] mt-0.5">
                        {currentAttendee.college}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-[#282a30] font-mono text-xs text-[#c0c1ff] font-semibold">
                          #{currentAttendee.passId}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#4cd7f6]/10 font-mono text-xs text-[#4cd7f6] font-medium">
                          {currentAttendee.rollNumber || "BATCH 2024-2027"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex flex-col font-mono">
                    <span className="text-[10px] text-[#908fa0] uppercase">Seat Allocation</span>
                    <span className="font-geist text-xl font-semibold text-[#4cd7f6]">
                      Hall 2
                    </span>
                    <span className="text-xs text-[#c7c4d7]">Row E, Seat 14</span>
                  </div>
                </div>

                {/* Credential Tier & Physical Kit Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#1d2025] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-[#908fa0] uppercase">
                      Credential Tier
                    </span>
                    <span className="font-geist text-sm text-[#e2e2ea] font-medium">
                      {currentAttendee.tier} Delegate
                    </span>
                    <span className="font-mono text-xs text-[#4cd7f6] flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">stars</span>
                      Includes AI Workshop Pass
                    </span>
                  </div>

                  <div className="bg-[#1d2025] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-[#908fa0] uppercase">
                        Physical Kit Status
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#10B981] text-[#0c0e13]">
                          <span className="material-symbols-outlined text-xs">done</span>
                        </span>
                        <span className="font-geist text-xs text-[#e2e2ea] font-medium">
                          Lanyard & Swag Bag Collected
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#908fa0] mt-1">
                      Issuer: Station 04 at 09:30 AM
                    </span>
                  </div>
                </div>

                {/* Permitted Security Zones */}
                <div className="bg-[#1d2025] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex flex-col gap-2">
                  <span className="font-mono text-[10px] text-[#908fa0] uppercase">
                    Permitted Security Zones
                  </span>
                  <div className="flex flex-wrap gap-2 mt-0.5 font-mono text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-[#282a30] text-[#e2e2ea]">
                      MAIN KEYNOTE STAGE
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#282a30] text-[#e2e2ea]">
                      HACKATHON PIT 01-04
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#4cd7f6]/15 text-[#4cd7f6] font-semibold">
                      AI LABS & WORKSHOPS
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#282a30] text-[#e2e2ea]">
                      FOOD COMMISSARY
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Next Attendee, Print Badge, Override */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextIndex = (MOCK_PARTICIPANTS.indexOf(currentAttendee) + 1) % MOCK_PARTICIPANTS.length;
                      setCurrentAttendee(MOCK_PARTICIPANTS[nextIndex]);
                      setActiveState("verified");
                      playChime("success");
                    }}
                    className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8083ff] text-[#1000a9] font-geist text-sm font-semibold shadow-md hover:bg-[#c0c1ff] transition-all"
                  >
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                    <span>Next Attendee</span>
                    <kbd className="ml-1 px-1.5 py-0.5 rounded bg-[#1000a9]/20 font-mono text-[10px] text-[#1000a9]">
                      Enter
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("Sending print instruction to Zebra ZD621 RFID printer...")}
                    className="flex items-center gap-2 py-3 px-4 rounded-xl bg-[#282a30] text-[#e2e2ea] hover:bg-[#33353b] font-geist text-sm font-medium border border-[rgba(255,255,255,0.08)] transition-all"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span>Print Badge</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#191c21] font-mono text-[10px] text-[#908fa0]">
                      ⌘P
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveState("verified");
                      playChime("success");
                    }}
                    className="flex items-center gap-2 py-3 px-4 rounded-xl bg-[#191c21] text-[#EF4444] hover:bg-[#EF4444]/15 font-geist text-sm font-medium border border-[#EF4444]/30 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">security</span>
                    <span>Override</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0c0e13] font-mono text-[10px] text-[#EF4444]">
                      F2
                    </kbd>
                  </button>
                </div>
              </div>
            </div>

            {/* Edge Case Diagnostic Simulation Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#908fa0] uppercase tracking-wider">
                  SIMULATE EDGE CASES (DIAGNOSTIC PREVIEW)
                </span>
                <span className="text-[#908fa0]">Click to preview state UI</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setDiagnostic("duplicate")}
                  className="p-4 rounded-xl bg-[#191c21] hover:bg-[#1d2025] transition-all cursor-pointer flex flex-col gap-1.5 border border-[rgba(255,255,255,0.06)] hover:border-[#EF4444]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-xs text-[#EF4444] font-semibold">
                      <span className="material-symbols-outlined text-sm">warning</span> DUPLICATE PASS
                    </span>
                    <span className="font-mono text-xs text-[#908fa0]">10:14 AM</span>
                  </div>
                  <span className="font-geist text-sm text-[#e2e2ea] font-medium truncate">
                    Anya Sharma (#DYN-0199)
                  </span>
                  <span className="font-mono text-[10px] text-[#908fa0]">
                    Already checked-in at Turnstile Gate 01
                  </span>
                </div>

                <div
                  onClick={() => setDiagnostic("invalid")}
                  className="p-4 rounded-xl bg-[#191c21] hover:bg-[#1d2025] transition-all cursor-pointer flex flex-col gap-1.5 border border-[rgba(255,255,255,0.06)] hover:border-[#F59E0B]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-xs text-[#F59E0B] font-semibold">
                      <span className="material-symbols-outlined text-sm">gpp_bad</span> UNREGISTERED HASH
                    </span>
                    <span className="font-mono text-xs text-[#908fa0]">ERR-404</span>
                  </div>
                  <span className="font-geist text-sm text-[#e2e2ea] font-medium truncate">
                    Hash: 8f4b23a9c7
                  </span>
                  <span className="font-mono text-[10px] text-[#908fa0]">
                    Signature invalid or revoked event voucher
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
