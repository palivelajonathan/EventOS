"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DYNAMITE_2026, EventData, CheckInLog } from "@/lib/data/dynamite2026";
import { getLiveEventData } from "@/lib/services/eventDataService";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function CommandCenterPage() {
  const urlParams = useParams();
  const eventId = (urlParams?.eventId as string) || "evt_dynamite2026";
  const [event, setEvent] = useState<EventData>(DYNAMITE_2026);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [routed, setRouted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [liveCheckins, setLiveCheckins] = useState<CheckInLog[]>(event.recentCheckins);
  const [justIncremented, setJustIncremented] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const live = await getLiveEventData(eventId);
      if (isMounted) {
        setEvent(live);
        setLiveCheckins(live.recentCheckins);
      }
    }
    loadData();

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const channel = supabase
          .channel(`command-center-realtime-${eventId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "check_ins" },
            (payload) => {
              setJustIncremented(true);
              setTimeout(() => setJustIncremented(false), 2000);
              setEvent((prev) => {
                const nextChecked = prev.metrics.checkedIn + 1;
                const nextRatio = prev.metrics.registered > 0 ? Number((nextChecked / prev.metrics.registered).toFixed(3)) : 0;
                return {
                  ...prev,
                  metrics: {
                    ...prev.metrics,
                    checkedIn: nextChecked,
                    attendanceRatio: nextRatio,
                  },
                };
              });
              loadData();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
          isMounted = false;
        };
      }
    }
  }, [event.id]);

  const handleScanClick = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
    }, 800);
  };

  return (
    <AppShell eventId={event.id} eventName={event.name} stageName="STAGE 01 LIVE">
      <div className="p-4 lg:p-8 flex flex-col gap-6 w-full max-w-[1600px] mx-auto">
        {/* ============================================================
            DEMO ENVIRONMENT STATUS STRIP
            ============================================================ */}
        {eventId === "evt_dynamite2026" && (
          <div className="p-3.5 px-4 rounded-xl bg-[#8083ff]/10 border border-[#8083ff]/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-white">
              <span className="px-2 py-0.5 rounded bg-[#8083ff] text-[#1000a9] font-bold text-[10px] tracking-wider uppercase">
                DEMO ENVIRONMENT
              </span>
              <span className="text-[#c0c1ff]">
                Exploring Dynamite 2026 Showcase (Isolated Sandbox Partition)
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <Link href="/org/org_dynamite_default/events/new" className="text-[#4cd7f6] hover:underline flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Create Production Event
              </Link>
              <span className="text-[#908fa0]">•</span>
              <Link href="/volunteer/scan" className="text-[#c7c4d7] hover:text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                Gate Scanner
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================
            EVENT CONTEXT HEADER BAR
            ============================================================ */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 p-4 lg:p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-md">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4cd7f6]" />
              </span>
              <span className="font-geist text-xl lg:text-2xl font-semibold tracking-tight text-[#e2e2ea]">
                {event.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-xs uppercase font-bold tracking-wider">
                Live Now
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[#c7c4d7] font-geist text-xs">
              <span className="material-symbols-outlined text-sm text-[#908fa0]">
                location_on
              </span>
              <span>{event.venue}, {event.city}</span>
            </div>

            <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] hidden sm:block" />

            <div className="flex items-center gap-2 font-mono text-xs text-[#e2e2ea]">
              <span className="text-[#908fa0]">TARGET:</span>
              <span className="font-semibold text-[#8083ff]">
                {(event.metrics.attendanceRatio * 100).toFixed(1)}% ACHIEVED
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1d2025] font-mono text-xs text-[#908fa0] border border-[rgba(255,255,255,0.05)]">
              <span className="material-symbols-outlined text-xs text-[#4cd7f6] animate-spin" style={{ animationDuration: "4s" }}>
                sync
              </span>
              <span>SYNC 10:42:18 AM</span>
            </div>
          </div>

          {/* Action Button Cluster */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end">
            <Link
              href={`/dashboard/${event.id}/gate`}
              onClick={handleScanClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8083ff] text-[#1000a9] font-mono text-xs font-semibold hover:bg-[#c0c1ff] transition-all shadow-[0_0_20px_rgba(128,131,255,0.35)]"
            >
              <span className="material-symbols-outlined text-base">
                {scanning ? "progress_activity" : "qr_code_scanner"}
              </span>
              <span>{scanning ? "Armed..." : "Scan Check-In"}</span>
            </Link>

            <button
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#282a30] text-[#e2e2ea] hover:bg-[#33353b] transition-all font-mono text-xs border border-[rgba(255,255,255,0.08)]"
            >
              <span className="material-symbols-outlined text-base text-[#4cd7f6]">
                campaign
              </span>
              <span>Broadcast</span>
            </button>

            <Link
              href={`/dashboard/${event.id}/passes`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#282a30] text-[#e2e2ea] hover:bg-[#33353b] transition-all font-mono text-xs border border-[rgba(255,255,255,0.08)]"
            >
              <span className="material-symbols-outlined text-base text-[#c0c1ff]">
                id_card
              </span>
              <span>Passes</span>
            </Link>

            <button
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#282a30] text-[#c7c4d7] hover:text-[#e2e2ea] hover:bg-[#33353b] transition-all font-mono text-xs border border-[rgba(255,255,255,0.08)]"
            >
              <span className="material-symbols-outlined text-base">file_download</span>
              <span className="hidden sm:inline">Export Ledger</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            4 STAT METRIC CARDS
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Registered */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#908fa0] font-mono text-xs uppercase">
              <span>Registered Attendees</span>
              <span className="material-symbols-outlined text-base text-[#c0c1ff]">
                groups
              </span>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <div className="font-geist text-3xl font-semibold text-[#e2e2ea] tracking-tight">
                {event.metrics.registered.toLocaleString()}
              </div>
              <span className="px-2 py-0.5 rounded bg-[#c0c1ff]/10 text-[#c0c1ff] font-mono text-xs font-semibold">
                +142 today
              </span>
            </div>
            <div className="w-full pt-1">
              <svg className="w-full h-8 text-[#8083ff] overflow-visible" fill="none" viewBox="0 0 160 30">
                <path d="M 0 25 Q 20 22 40 24 T 80 18 T 120 10 T 160 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                <path d="M 0 25 Q 20 22 40 24 T 80 18 T 120 10 T 160 4 L 160 30 L 0 30 Z" fill="currentColor" fillOpacity="0.08" />
              </svg>
            </div>
          </div>

          {/* Card 2: Checked In Active */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#908fa0] font-mono text-xs uppercase">
              <span>Checked In Active</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6] animate-pulse" />
                <span className="font-mono text-[10px] text-[#4cd7f6] font-bold tracking-wider">
                  LIVE BEACON
                </span>
              </div>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <div
                className={cn(
                  "font-geist text-3xl font-semibold tracking-tight transition-all duration-300",
                  justIncremented
                    ? "text-[#4cd7f6] scale-105 drop-shadow-[0_0_12px_#4cd7f6]"
                    : "text-[#e2e2ea]"
                )}
              >
                {event.metrics.checkedIn.toLocaleString()}
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-xs text-[#4cd7f6] font-semibold">
                  {event.metrics.peakScansPerSec} scans/s
                </span>
                <span className="text-[#908fa0] text-[10px]">Peak flow rate</span>
              </div>
            </div>
            <div className="w-full bg-[#1d2025] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#4cd7f6] h-full rounded-full transition-all duration-700"
                style={{ width: `${(event.metrics.checkedIn / event.metrics.registered) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 3: Attendance Ratio */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#908fa0] font-mono text-xs uppercase">
              <span>Attendance Ratio</span>
              <span className="material-symbols-outlined text-base text-[#bdc2ff]">
                pie_chart
              </span>
            </div>
            <div className="my-3 flex items-center justify-between">
              <div>
                <div className="font-geist text-3xl font-semibold text-[#e2e2ea] tracking-tight">
                  {(event.metrics.attendanceRatio * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-[#908fa0] mt-0.5">
                  Target: {(event.metrics.targetRatio * 100).toFixed(1)}% minimum
                </div>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#33353b]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-[#bdc2ff]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="87.1, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-mono text-xs text-[#bdc2ff] font-bold">
                  87%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[#c7c4d7] font-mono text-[10px] pt-1">
              <span>DELTA TO GOAL</span>
              <span className="text-[#4cd7f6] font-semibold">+2.1% OVER</span>
            </div>
          </div>

          {/* Card 4: Certificates Issued */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#908fa0] font-mono text-xs uppercase">
              <span>Certificates Issued</span>
              <span className="material-symbols-outlined text-base text-[#c0c1ff]">
                verified
              </span>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <div className="font-geist text-3xl font-semibold text-[#e2e2ea] tracking-tight">
                {event.metrics.certificatesMinted.toLocaleString()}
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-xs text-[#c0c1ff] font-medium">
                  244 queued
                </span>
                <span className="text-[#908fa0] text-[10px]">Auto-mint active</span>
              </div>
            </div>
            <div className="w-full flex items-center gap-2 pt-1">
              <div className="flex-1 bg-[#1d2025] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#c0c1ff] h-full rounded-full transition-all"
                  style={{ width: "77.5%" }}
                />
              </div>
              <span className="font-mono text-[10px] text-[#908fa0]">77.5%</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            MAIN TELEMETRY GRID (8-COL CHARTS + 4-COL FEED)
            ============================================================ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Attendance Flow Velocity + Gate Capacities */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Live Attendance Flow Velocity Chart Card */}
            <div className="p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-lg">
                      show_chart
                    </span>
                    <h2 className="font-geist text-lg font-semibold text-[#e2e2ea]">
                      Live Attendance Flow Velocity
                    </h2>
                  </div>
                  <p className="font-geist text-xs text-[#908fa0] mt-0.5">
                    Scans per minute trajectory across main operational timeline
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                    PEAK 10:15 AM (KEYNOTE)
                  </span>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-mono text-xs text-[#908fa0] uppercase mr-1">
                  Filter by College:
                </span>
                {["all", "CBIT", "VNR VJIET", "Osmania Univ"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSelectedFilter(item)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-mono text-xs transition-colors",
                      selectedFilter === item
                        ? "bg-[#8083ff]/20 text-[#c0c1ff] font-semibold border border-[rgba(128,131,255,0.4)]"
                        : "bg-[#1d2025] text-[#c7c4d7] hover:text-[#e2e2ea] hover:bg-[#282a30]"
                    )}
                  >
                    {item === "all" ? "All Streams" : item}
                  </button>
                ))}
                <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] mx-1 hidden sm:block" />
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-[#282a30] text-[#4cd7f6] font-mono text-xs hover:bg-[#33353b] transition-colors"
                >
                  North Turnstiles
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-[#1d2025] text-[#c7c4d7] font-mono text-xs hover:text-[#e2e2ea] hover:bg-[#282a30] transition-colors"
                >
                  VIP Express
                </button>
              </div>

              {/* Spline Chart Graphic */}
              <div className="relative w-full h-64 sm:h-72 mt-2 bg-[#0c0e13] rounded-xl p-4 lg:p-6 border border-[rgba(255,255,255,0.05)] flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#8083ff]/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-x-4 top-1/4 h-px bg-[rgba(255,255,255,0.05)] pointer-events-none" />
                <div className="absolute inset-x-4 top-2/4 h-px bg-[rgba(255,255,255,0.05)] pointer-events-none" />
                <div className="absolute inset-x-4 top-3/4 h-px bg-[rgba(255,255,255,0.05)] pointer-events-none" />

                <div className="relative z-10 w-full h-full flex flex-col justify-end">
                  <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 160">
                    <defs>
                      <linearGradient id="splineGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="strokeGradient" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#8083ff" />
                        <stop offset="65%" stopColor="#4cd7f6" />
                        <stop offset="100%" stopColor="#c0c1ff" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 145 C 50 140, 80 135, 120 115 C 160 95, 200 90, 250 60 C 290 35, 330 20, 375 10 C 410 40, 440 65, 480 85 C 520 100, 560 115, 600 120 L 600 160 L 0 160 Z"
                      fill="url(#splineGradient)"
                    />
                    <path
                      d="M 0 145 C 50 140, 80 135, 120 115 C 160 95, 200 90, 250 60 C 290 35, 330 20, 375 10 C 410 40, 440 65, 480 85 C 520 100, 560 115, 600 120"
                      fill="none"
                      stroke="url(#strokeGradient)"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <line stroke="#4cd7f6" strokeDasharray="3,3" strokeWidth="1.5" x1="375" x2="375" y1="0" y2="160" />
                    <circle className="animate-pulse" cx="375" cy="10" fill="#4cd7f6" r="5" />
                    <circle cx="375" cy="10" fill="#4cd7f6" fillOpacity="0.25" r="10" />
                  </svg>
                </div>

                <div className="relative z-10 flex justify-between font-mono text-xs text-[#908fa0] pt-2 border-t border-[rgba(255,255,255,0.05)]">
                  <span>08:00 AM</span>
                  <span>08:45 AM</span>
                  <span>09:30 AM</span>
                  <span className="text-[#4cd7f6] font-semibold">10:15 AM (PEAK)</span>
                  <span>10:45 AM</span>
                  <span>11:00 AM</span>
                </div>
              </div>

              {/* 4 Bottom Micro-Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                <div className="p-3 rounded-xl bg-[#1d2025] flex flex-col border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#908fa0] text-[10px]">AVG SCAN LATENCY</span>
                  <span className="text-[#e2e2ea] text-xs font-semibold mt-0.5">380 ms</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1d2025] flex flex-col border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#908fa0] text-[10px]">FASTEST LANE</span>
                  <span className="text-[#4cd7f6] text-xs font-semibold mt-0.5">Gate 01-A</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1d2025] flex flex-col border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#908fa0] text-[10px]">OFFLINE CACHED</span>
                  <span className="text-[#e2e2ea] text-xs font-semibold mt-0.5">0 records</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1d2025] flex flex-col border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#908fa0] text-[10px]">SYNC INTEGRITY</span>
                  <span className="text-[#c0c1ff] text-xs font-semibold mt-0.5">99.98%</span>
                </div>
              </div>
            </div>

            {/* Gate Throughput & Zone Capacities */}
            <div className="p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8083ff] text-lg">
                    density_medium
                  </span>
                  <h2 className="font-geist text-lg font-semibold text-[#e2e2ea]">
                    Gate Throughput & Zone Capacities
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#908fa0]">
                  HARDWARE TELEMETRY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.gates.map((gate) => (
                  <div
                    key={gate.id}
                    className="p-4 rounded-xl bg-[#1d2025] border border-[rgba(255,255,255,0.05)] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-geist text-sm font-semibold text-[#e2e2ea]">
                          {gate.name}
                        </div>
                        <div className="font-geist text-xs text-[#908fa0]">
                          {gate.category}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded font-mono text-[10px] font-bold",
                          gate.status === "NEAR_CAPACITY"
                            ? "bg-[#ffb4ab]/15 text-[#ffb4ab]"
                            : "bg-[#4cd7f6]/15 text-[#4cd7f6]"
                        )}
                      >
                        {gate.loadPercent}% LOAD
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="w-full bg-[#282a30] h-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            gate.status === "NEAR_CAPACITY" ? "bg-[#EF4444]" : "bg-[#4cd7f6]"
                          )}
                          style={{ width: `${gate.loadPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-xs text-[#908fa0]">
                        <span>Throughput: {gate.currentCount} / {gate.capacityLimit}</span>
                        <span
                          className={
                            gate.status === "NEAR_CAPACITY" ? "text-[#EF4444] font-medium" : "text-[#4cd7f6] font-medium"
                          }
                        >
                          {gate.status === "NEAR_CAPACITY" ? "Surge alert" : "Optimal flow"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Live Feed + AI Dispatch */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Live Gate Activity Feed */}
            <div className="p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-lg">
                    stream
                  </span>
                  <h2 className="font-geist text-base font-semibold text-[#e2e2ea]">
                    Live Gate Activity
                  </h2>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#1d2025] text-[#4cd7f6] font-bold tracking-wider animate-pulse border border-[rgba(76,215,246,0.2)]">
                  STREAM ACTIVE
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {liveCheckins.map((chk) => (
                  <div
                    key={chk.id}
                    className="p-3 rounded-xl bg-[#1d2025] hover:bg-[#282a30] transition-colors flex flex-col gap-1 border border-[rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-[#4cd7f6] font-semibold">
                        CHECK-IN CONFIRMED
                      </span>
                      <span className="text-[#908fa0]">{chk.timestamp}</span>
                    </div>
                    <div className="font-geist text-sm text-[#e2e2ea] font-medium">
                      {chk.participantName}{" "}
                      <span className="text-[#908fa0] font-normal">
                        ({chk.college})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#908fa0] font-mono text-xs pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-[#908fa0]">
                          door_front
                        </span>
                        {chk.gate}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#c0c1ff] font-semibold text-[10px]">
                        PASS #{chk.passId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Intelligence Dispatch Widget */}
            <div className="relative overflow-hidden p-6 rounded-2xl bg-[#282a30] border border-[rgba(255,255,255,0.09)] shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#c0c1ff]">
                  <span className="material-symbols-outlined text-xl">psychology</span>
                  <span className="font-geist text-base font-semibold text-[#e2e2ea]">
                    AI Intelligence Dispatch
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#8083ff]/20 text-[#c0c1ff] font-mono text-[10px] font-bold tracking-wider">
                  AUTO-ADVISE
                </span>
              </div>

              <p className="font-geist text-xs text-[#e2e2ea] leading-relaxed">
                <span className="font-semibold text-[#4cd7f6]">Turnstile 01</span> experiencing surge (<span className="font-semibold text-[#EF4444]">+38%</span> velocity over Hall 02 entry). Recommend dynamically rerouting the incoming <span className="text-[#c0c1ff] font-medium">BCA stream</span> toward <span className="font-semibold text-[#e2e2ea]">Gate 03</span> to prevent concourse bottlenecks.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setRouted(!routed)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all shadow-md",
                    routed
                      ? "bg-[#4cd7f6] text-[#003640]"
                      : "bg-[#8083ff] text-[#1000a9] hover:bg-[#c0c1ff]"
                  )}
                >
                  <span className="material-symbols-outlined text-sm">
                    {routed ? "check_circle" : "alt_route"}
                  </span>
                  <span>{routed ? "Volunteers Dispatched to Gate 03" : "Auto-Route Volunteers"}</span>
                </button>

                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg bg-[#0c0e13] text-[#c7c4d7] hover:text-[#e2e2ea] transition-colors border border-[rgba(255,255,255,0.08)]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            BOTTOM FEED CARDS (STAGE CAMERA & SECURITY CONCOURSE)
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-2xl overflow-hidden shadow-md h-48 flex flex-col justify-end p-5 group border border-[rgba(255,255,255,0.07)]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e13] via-[#0c0e13]/60 to-transparent" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-[#4cd7f6] uppercase font-semibold">
                  Main Stage Camera Feed
                </span>
                <div className="font-geist text-base font-semibold text-[#e2e2ea]">
                  Hall 01 • Keynote Session Ongoing
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#0c0e13]/90 text-[#e2e2ea] font-mono text-xs backdrop-blur flex items-center gap-1.5 border border-[rgba(255,255,255,0.1)]">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" /> 4K60 LIVE
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-md h-48 flex flex-col justify-end p-5 group border border-[rgba(255,255,255,0.07)]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e13] via-[#0c0e13]/60 to-transparent" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-[#c0c1ff] uppercase font-semibold">
                  Security Concourse Perimeter
                </span>
                <div className="font-geist text-base font-semibold text-[#e2e2ea]">
                  North Entrance • RFID & QR Turnstiles
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#0c0e13]/90 text-[#e2e2ea] font-mono text-xs backdrop-blur flex items-center gap-1.5 border border-[rgba(255,255,255,0.1)]">
                <span className="w-2 h-2 rounded-full bg-[#8083ff]" /> 8 LANES ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
