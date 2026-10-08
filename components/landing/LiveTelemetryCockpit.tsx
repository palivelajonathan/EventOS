"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ZoneFilter {
  id: string;
  name: string;
  status: "ACTIVE" | "STANDBY" | "LOCKED";
  statusColor: string;
  registered: number;
  checkedIn: number;
  ratio: string;
  scansPerMin: number;
  recentLogs: Array<{ gate: string; passId: string; college: string; latency: string }>;
}

const ZONES: ZoneFilter[] = [
  {
    id: "alpha",
    name: "GATE ALPHA (MAIN CONCOURSE)",
    status: "ACTIVE",
    statusColor: "text-[#4cd7f6]",
    registered: 1247,
    checkedIn: 1086,
    ratio: "87.1%",
    scansPerMin: 34,
    recentLogs: [
      { gate: "GATE 01", passId: "#DYN-88912", college: "CBIT HYDERABAD", latency: "0.18s" },
      { gate: "GATE 02", passId: "#DYN-88913", college: "VASAVI ENGG", latency: "0.22s" },
      { gate: "GATE 01", passId: "#DYN-88914", college: "VNR VJIET", latency: "0.15s" },
    ],
  },
  {
    id: "bravo",
    name: "STAGE BRAVO (KEYNOTE HALL)",
    status: "STANDBY",
    statusColor: "text-[#F59E0B]",
    registered: 650,
    checkedIn: 580,
    ratio: "89.2%",
    scansPerMin: 18,
    recentLogs: [
      { gate: "HALL 02", passId: "#DYN-77102", college: "IIT HYDERABAD", latency: "0.19s" },
      { gate: "HALL 02", passId: "#DYN-77105", college: "BITS PILANI HYD", latency: "0.21s" },
    ],
  },
  {
    id: "delta",
    name: "LOUNGE DELTA (VIP / FOUNDERS)",
    status: "LOCKED",
    statusColor: "text-[#c0c1ff]",
    registered: 120,
    checkedIn: 98,
    ratio: "81.6%",
    scansPerMin: 6,
    recentLogs: [
      { gate: "VIP-A", passId: "#DYN-VIP-09", college: "VC / ANGEL PARTNER", latency: "0.12s" },
      { gate: "VIP-A", passId: "#DYN-VIP-14", college: "FOUNDER & KEYNOTE", latency: "0.14s" },
    ],
  },
];

export function LiveTelemetryCockpit() {
  const [selectedZone, setSelectedZone] = useState<ZoneFilter>(ZONES[0]);

  return (
    <section className="w-full px-4 lg:px-8 py-16 bg-[#111319]">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Split Presentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Narrative & Telemetry Indicators */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="font-mono text-xs text-[#c0c1ff] uppercase tracking-wider font-semibold">
              LIVE TELEMETRY COCKPIT
            </div>
            <h3 className="font-geist text-2xl lg:text-3xl font-medium text-[#e2e2ea] tracking-tight uppercase leading-tight">
              CONTROL EVERY TURNSTILE AND RUN OF SHOW.
            </h3>
            <p className="font-geist text-sm text-[#c7c4d7] leading-relaxed">
              The organizer console processes thousands of wristband and ticket scans in milliseconds, keeping gates flowing and VIP stages secure.
            </p>

            {/* Interactive Switchable Filter Tabs */}
            <div className="flex flex-col gap-2 mt-2">
              {ZONES.map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg flex items-center justify-between font-mono text-xs transition-all duration-150 border",
                      isSelected
                        ? "bg-[#282a30] text-[#e2e2ea] border-[rgba(255,255,255,0.15)] shadow-md"
                        : "bg-[#191c21] text-[#908fa0] hover:text-[#e2e2ea] hover:bg-[#1d2025] border-transparent"
                    )}
                    type="button"
                  >
                    <span>{zone.name}</span>
                    <span className={cn("font-bold", zone.statusColor)}>
                      {zone.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Organizer Dashboard Live Console Component */}
          <div className="lg:col-span-8 rounded-2xl bg-[#191c21] p-6 lg:p-8 border border-[rgba(255,255,255,0.07)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            {/* Mock Header Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.07)]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="w-3 h-3 rounded-full bg-[#4cd7f6]" />
                <span className="w-3 h-3 rounded-full bg-[#c0c1ff]" />
                <span className="font-mono text-xs text-[#908fa0] ml-2">
                  eventos://hyd-begumpet/dynamite-2026/live
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#4cd7f6] bg-[#0c0e13] px-2.5 py-1 rounded-md border border-[rgba(255,255,255,0.07)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-ping" />
                <span>STREAMING LIVE</span>
              </div>
            </div>

            {/* High-Contrast Live Telemetry Metrics Counter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#1d2025] border border-[rgba(255,255,255,0.05)] flex flex-col">
                <span className="font-mono text-xs text-[#c7c4d7] uppercase">
                  TOTAL REGISTERED
                </span>
                <span className="font-geist text-2xl lg:text-3xl text-[#e2e2ea] font-semibold tracking-tight mt-1">
                  {selectedZone.registered.toLocaleString()}
                </span>
                <span className="font-mono text-xs text-[#4cd7f6] mt-1">
                  +42 in last 10m
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#1d2025] border border-[rgba(255,255,255,0.05)] flex flex-col">
                <span className="font-mono text-xs text-[#c7c4d7] uppercase">
                  CHECKED IN (GATES)
                </span>
                <span className="font-geist text-2xl lg:text-3xl text-[#4cd7f6] font-semibold tracking-tight mt-1">
                  {selectedZone.checkedIn.toLocaleString()}
                </span>
                <span className="font-mono text-xs text-[#c7c4d7] mt-1">
                  Sub-second NFC/QR
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#1d2025] border border-[rgba(255,255,255,0.05)] flex flex-col">
                <span className="font-mono text-xs text-[#c7c4d7] uppercase">
                  CONVERSION / RUN RATE
                </span>
                <span className="font-geist text-2xl lg:text-3xl text-[#c0c1ff] font-semibold tracking-tight mt-1">
                  {selectedZone.ratio}
                </span>
                <span className="font-mono text-xs text-[#c0c1ff] mt-1">
                  Peak expected: 92%
                </span>
              </div>
            </div>

            {/* Real-Time Activity Graph & Stream */}
            <div className="p-4 rounded-xl bg-[#0c0e13] border border-[rgba(255,255,255,0.05)] flex flex-col gap-3">
              <div className="flex items-center justify-between font-mono text-xs text-[#c7c4d7]">
                <span>SCAN VELOCITY (PAST 60 MINUTES)</span>
                <span className="text-[#4cd7f6]">
                  PEAK: {selectedZone.scansPerMin} SCANS / MIN
                </span>
              </div>

              {/* Inline High-Performance SVG Chart */}
              <div className="w-full h-32 pt-2">
                <svg
                  className="w-full h-full text-[#4cd7f6]"
                  preserveAspectRatio="none"
                  viewBox="0 0 600 120"
                >
                  <defs>
                    <linearGradient id="metricGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,100 Q40,95 80,70 T160,80 T240,40 T320,60 T400,20 T480,35 T560,15 L600,10 L600,120 L0,120 Z"
                    fill="url(#metricGrad)"
                  />
                  <path
                    d="M0,100 Q40,95 80,70 T160,80 T240,40 T320,60 T400,20 T480,35 T560,15 L600,10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                  <line
                    stroke="#464554"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    x1="0"
                    x2="600"
                    y1="50"
                    y2="50"
                  />
                </svg>
              </div>

              {/* Micro Turnstile Log Stream */}
              <div className="flex flex-col gap-1.5 pt-1 font-mono text-xs">
                {selectedZone.recentLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#1d2025]/50 border border-[rgba(255,255,255,0.04)]"
                  >
                    <span className="text-[#e2e2ea] font-medium">
                      [{log.gate}] PASS_ID: {log.passId} ({log.college})
                    </span>
                    <span className="text-[#4cd7f6]">
                      VALIDATED ({log.latency})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
