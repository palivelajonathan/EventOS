"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DYNAMITE_2026, EventData } from "@/lib/data/dynamite2026";
import { getLiveEventData } from "@/lib/services/eventDataService";
import { Card, LiveBeacon, StatusPill, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function AnalyticsTelemetryPage() {
  const params = useParams();
  const eventId = (params?.eventId as string) || "evt_dynamite2026";
  const [event, setEvent] = useState<EventData>(DYNAMITE_2026);
  const [activeRange, setActiveRange] = useState<"LIVE" | "1H" | "6H" | "ALL">("LIVE");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      const data = await getLiveEventData(eventId);
      setEvent(data);
    }
    fetchAnalytics();
  }, [eventId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const hourlyFlow = [
    { hour: "08:30", count: 45 },
    { hour: "09:00", count: 180 },
    { hour: "09:30", count: 340 },
    { hour: "10:00", count: 285 },
    { hour: "10:30", count: 140 },
    { hour: "11:00", count: 56 },
    { hour: "11:30", count: 22 },
    { hour: "12:00", count: 18 },
  ];

  const maxHourly = Math.max(...hourlyFlow.map((h) => h.count));

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-[#1a1e28] border border-[rgba(128,131,255,0.4)] text-white text-xs font-mono flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
            query_stats
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              TELEMETRY_ANALYTICS // {event.name.toUpperCase()}
            </h1>
            <LiveBeacon color="cyan" pulse label="HIGH FREQUENCY SAMPLING" />
          </div>
          <p className="text-xs text-[#8e909a] mt-1 font-mono">
            Granular foot-traffic distribution, gate velocity indexes, and college cohort analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Pills */}
          <div className="flex items-center gap-1 p-1 bg-[#151821] rounded-xl border border-[rgba(255,255,255,0.06)]">
            {(["LIVE", "1H", "6H", "ALL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors",
                  activeRange === r
                    ? "bg-[#8083ff] text-white shadow-sm"
                    : "text-[#8e909a] hover:text-white"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.open(`/api/export?eventId=${eventId}&type=attendance`, "_blank");
              showToast("Exporting attendance summary report as CSV...");
            }}
            className="text-xs"
          >
            <span className="material-symbols-outlined text-xs mr-1">
              download
            </span>
            Raw CSV
          </Button>
        </div>
      </div>

      {/* Top Level Metric Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-2">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            CONVERSION FUNNEL RATIO
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-white">
              {(event.metrics.attendanceRatio * 100).toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-[#6be794] flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +2.1%
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#8e909a]">
            {event.metrics.checkedIn.toLocaleString()} checked-in of {event.metrics.registered.toLocaleString()} registered
          </p>
        </Card>

        <Card className="p-5 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-2">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            PEAK INGRESS VELOCITY
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-[#4cd7f6]">
              {event.metrics.peakScansPerSec}
            </span>
            <span className="text-xs font-mono text-[#8e909a]">scans / sec</span>
          </div>
          <p className="text-[11px] font-mono text-[#8e909a]">
            Logged during peak turnstile admission rush
          </p>
        </Card>

        <Card className="p-5 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-2">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            EDGE SCAN LATENCY
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-[#8083ff]">
              {event.metrics.avgLatencyMs}ms
            </span>
            <span className="text-xs font-mono text-[#6be794]">LOW LATENCY</span>
          </div>
          <p className="text-[11px] font-mono text-[#8e909a]">
            WebAssembly optical decode & local database index lookup
          </p>
        </Card>

        <Card className="p-5 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-2">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            CACHE SYNCHRONIZATION
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-white">
              100%
            </span>
            <span className="text-xs font-mono text-[#6be794]">0 DROPPED</span>
          </div>
          <p className="text-[11px] font-mono text-[#8e909a]">
            Offline cached check-ins safely synchronized to cloud
          </p>
        </Card>
      </div>

      {/* Ingress Velocity Histogram */}
      <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#8083ff]">
                bar_chart
              </span>
              TEMPORAL INGRESS VELOCITY // ARRIVAL PATTERN
            </h3>
            <p className="text-xs text-[#8e909a] font-mono mt-0.5">
              Check-in volume aggregated in 30-minute intervals across all active turnstiles
            </p>
          </div>

          <span className="text-xs font-mono text-[#8e909a] bg-[#1a1e28] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.05)]">
            Total Scans: 1,086
          </span>
        </div>

        {/* Histogram Bars */}
        <div className="pt-4 grid grid-cols-8 gap-3 items-end h-48 border-b border-[rgba(255,255,255,0.06)] pb-2">
          {hourlyFlow.map((slot) => {
            const heightPct = Math.round((slot.count / maxHourly) * 100);
            return (
              <div key={slot.hour} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-[#8e909a] group-hover:text-white transition-colors">
                  {slot.count}
                </span>
                <div className="w-full bg-[#161a24] rounded-t-lg overflow-hidden h-full flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125",
                      heightPct > 80
                        ? "bg-[#ffb4ab]"
                        : heightPct > 50
                        ? "bg-[#8083ff]"
                        : "bg-[#4cd7f6]"
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#8e909a]">
                  {slot.hour}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two Column Layout: College Cohorts (Left) + Gate Distribution (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: College Cohort Breakdown */}
        <div className="lg:col-span-7">
          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
                  school
                </span>
                CAMPUS & INSTITUTION COHORT DISTRIBUTION
              </h3>
              <p className="text-xs text-[#8e909a] font-mono mt-0.5">
                Attendance volume clustered by student university registration
              </p>
            </div>

            <div className="space-y-3.5">
              {event.collegeBreakdown.map((item) => (
                <div key={item.college} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-medium">{item.college}</span>
                    <span className="text-[#8e909a]">
                      <span className="text-white font-bold">{item.count}</span>{" "}
                      ({item.percentage}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#1a1e28] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8083ff] to-[#4cd7f6] rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Gate Throughput Load Breakdown */}
        <div className="lg:col-span-5">
          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#6be794]">
                  door_front
                </span>
                TURNSTILE CONGESTION MATRIX
              </h3>
              <p className="text-xs text-[#8e909a] font-mono mt-0.5">
                Active ingress load across deployed gates
              </p>
            </div>

            <div className="space-y-3">
              {event.gates.map((gate) => (
                <div
                  key={gate.id}
                  className="p-4 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">
                        {gate.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#8e909a]">
                        {gate.category}
                      </span>
                    </div>

                    <StatusPill
                      status={
                        gate.status === "NEAR_CAPACITY"
                          ? "critical"
                          : gate.status === "OPTIMAL"
                          ? "live"
                          : "standby"
                      }
                      label={`${gate.loadPercent}% LOAD`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-[#8e909a]">
                    <span>
                      {gate.currentCount} / {gate.capacityLimit} scanned
                    </span>
                    <span className="text-[#4cd7f6]">
                      {gate.velocityPerMin} scans/min
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#1a1e28] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        gate.loadPercent > 90
                          ? "bg-[#ffb4ab]"
                          : gate.loadPercent > 70
                          ? "bg-[#8083ff]"
                          : "bg-[#4cd7f6]"
                      )}
                      style={{ width: `${gate.loadPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
