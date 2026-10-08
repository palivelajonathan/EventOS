"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DYNAMITE_2026, Session } from "@/lib/data/dynamite2026";
import { Card, LiveBeacon, StatusPill, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function SessionsManagementPage() {
  const params = useParams();
  const eventId = (params?.eventId as string) || "evt_dynamite2026";
  const [sessions, setSessions] = useState<Session[]>(DYNAMITE_2026.sessions);
  const [activeTrack, setActiveTrack] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [activeSession, setActiveSession] = useState<Session | null>(sessions[0] || null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tracks = ["ALL", "KEYNOTE", "AI & AGENTS", "FOUNDERS", "WEB3", "DESIGN"];
  const stages = [
    "ALL",
    "Main Arena (Hall 01)",
    "Lab Stage B (Hall 02)",
    "Auditorium Delta",
  ];

  const filteredSessions = sessions.filter((s) => {
    const matchTrack = activeTrack === "ALL" || s.track === activeTrack;
    const matchStage = selectedStage === "ALL" || s.stage === selectedStage;
    return matchTrack && matchStage;
  });

  const toggleLiveStatus = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const nextLive = !s.isLiveNow;
          showToast(
            nextLive
              ? `Session "${s.title.slice(0, 30)}..." is now BROADCASTING LIVE`
              : `Session concluded broadcast`
          );
          return { ...s, isLiveNow: nextLive };
        }
        // If one is live, others on same stage might turn off
        return s;
      })
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-[#1a1e28] border border-[rgba(128,131,255,0.4)] text-white text-xs font-mono flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
            sensors
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              STAGE_CHRONOLOGY // SESSIONS
            </h1>
            <LiveBeacon color="cyan" pulse label="3 STAGES ACTIVE" />
          </div>
          <p className="text-xs text-[#8e909a] mt-1 font-mono">
            Orchestrate track timelines, speaker stage access, and live audience telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast("Exporting run of show schedule (PDF)...")}
            className="text-xs"
          >
            <span className="material-symbols-outlined text-xs mr-1">print</span>
            Run of Show
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast("Add Session modal ready")}
            className="text-xs"
          >
            <span className="material-symbols-outlined text-xs mr-1">add</span>
            New Session
          </Button>
        </div>
      </div>

      {/* Controls & Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Track Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#151821] rounded-xl border border-[rgba(255,255,255,0.06)]">
          {tracks.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTrack(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap",
                activeTrack === t
                  ? "bg-[#8083ff] text-white shadow-sm"
                  : "text-[#8e909a] hover:text-white hover:bg-[#1a1e28]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Stage Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#151821] rounded-xl border border-[rgba(255,255,255,0.06)]">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap",
                selectedStage === stage
                  ? "bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/40"
                  : "text-[#8e909a] hover:text-white"
              )}
            >
              {stage === "ALL" ? "All Stages" : stage.split(" • ")[0].split(" (")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Sessions List (Left) + Detail & Telemetry Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Timeline Cards */}
        <div className="lg:col-span-7 space-y-4">
          {filteredSessions.map((session) => {
            const isSelected = activeSession?.id === session.id;
            const occupancyPct = Math.round((session.enrolled / session.capacity) * 100);

            return (
              <div
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={cn(
                  "p-5 rounded-2xl cursor-pointer transition-all duration-200 border relative overflow-hidden",
                  isSelected
                    ? "bg-[#161a24] border-[#8083ff]/60 shadow-[0_0_25px_rgba(128,131,255,0.15)]"
                    : "bg-[#111319] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#151821]"
                )}
              >
                {/* Active Indicator Rail */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8083ff]" />
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8e909a] tracking-wider">
                        {session.timeSlot}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-[#8083ff]/15 text-[#8083ff] border border-[#8083ff]/30">
                        {session.track}
                      </span>
                      {session.isLiveNow && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#ff5555]/20 text-[#ff7777] border border-[#ff5555]/40 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5555]" />
                          LIVE ON STAGE
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-white group-hover:text-[#4cd7f6] transition-colors leading-snug">
                      {session.title}
                    </h3>

                    <div className="flex items-center gap-2 pt-1">
                      <img
                        src={session.speaker.avatar}
                        alt={session.speaker.name}
                        className="w-5 h-5 rounded-full object-cover border border-[rgba(255,255,255,0.2)]"
                      />
                      <span className="text-xs text-[#c5c6d3] font-medium">
                        {session.speaker.name}
                      </span>
                      <span className="text-xs text-[#8e909a]">
                        • {session.speaker.org}
                      </span>
                    </div>
                  </div>

                  {/* Stage & Capacity Stats */}
                  <div className="text-right space-y-2 shrink-0">
                    <span className="inline-block text-[11px] font-mono text-[#4cd7f6] bg-[#4cd7f6]/10 px-2 py-1 rounded border border-[#4cd7f6]/20">
                      {session.stage}
                    </span>

                    <div className="text-[11px] font-mono text-[#8e909a]">
                      <span className="text-white font-semibold">
                        {session.enrolled}
                      </span>
                      /{session.capacity}
                      <span className="ml-1 text-[10px] text-[#4cd7f6]">
                        ({occupancyPct}%)
                      </span>
                    </div>

                    {/* Mini Occupancy Bar */}
                    <div className="w-24 h-1.5 bg-[#1f2330] rounded-full overflow-hidden ml-auto">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          occupancyPct > 90
                            ? "bg-[#ffb4ab]"
                            : occupancyPct > 75
                            ? "bg-[#4cd7f6]"
                            : "bg-[#8083ff]"
                        )}
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Session Control Console */}
        <div className="lg:col-span-5">
          {activeSession ? (
            <Card className="p-6 sticky top-24 space-y-6 bg-[#13161f] border-[rgba(255,255,255,0.08)]">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#8e909a] uppercase">
                    STAGE CONSOLE // {activeSession.id}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1 leading-snug">
                    {activeSession.title}
                  </h2>
                </div>

                <button
                  onClick={() => toggleLiveStatus(activeSession.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                    activeSession.isLiveNow
                      ? "bg-[#ff5555] text-white shadow-[0_0_15px_rgba(255,85,85,0.4)]"
                      : "bg-[#1f2330] text-[#c5c6d3] hover:bg-[#8083ff] hover:text-white"
                  )}
                >
                  <span className="material-symbols-outlined text-xs">
                    {activeSession.isLiveNow ? "stop_circle" : "play_circle"}
                  </span>
                  {activeSession.isLiveNow ? "GO OFFLINE" : "GO LIVE"}
                </button>
              </div>

              {/* Speaker Dossier */}
              <div className="p-4 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.06)] space-y-3">
                <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
                  SPEAKER PROFILE
                </span>
                <div className="flex items-center gap-3">
                  <img
                    src={activeSession.speaker.avatar}
                    alt={activeSession.speaker.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#8083ff]/40 shadow-md"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {activeSession.speaker.name}
                    </h4>
                    <p className="text-xs text-[#8083ff]">
                      {activeSession.speaker.title}
                    </p>
                    <p className="text-xs text-[#8e909a]">
                      {activeSession.speaker.org}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => showToast("Slide deck link copied to clipboard")}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#1a1e28] hover:bg-[#252a38] text-[11px] font-mono text-[#c5c6d3] flex items-center justify-center gap-1.5 transition-colors border border-[rgba(255,255,255,0.05)]"
                  >
                    <span className="material-symbols-outlined text-xs text-[#4cd7f6]">
                      slideshow
                    </span>
                    Keynote Slides.pdf
                  </button>
                  <button
                    onClick={() => showToast("Microphone 04 calibrated: +3dB")}
                    className="py-1.5 px-3 rounded-lg bg-[#1a1e28] hover:bg-[#252a38] text-[11px] font-mono text-[#c5c6d3] flex items-center justify-center gap-1.5 transition-colors border border-[rgba(255,255,255,0.05)]"
                  >
                    <span className="material-symbols-outlined text-xs text-[#8083ff]">
                      mic
                    </span>
                    Audio In
                  </button>
                </div>
              </div>

              {/* Realtime Hall Telemetry */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
                  REALTIME HALL LOAD
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[10px] font-mono text-[#8e909a] block">
                      SEATS ENROLLED
                    </span>
                    <span className="text-xl font-bold text-white font-mono">
                      {activeSession.enrolled}
                    </span>
                    <span className="text-[10px] text-[#4cd7f6] block mt-0.5">
                      97.5% filled
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[10px] font-mono text-[#8e909a] block">
                      LIVE IN-ROOM
                    </span>
                    <span className="text-xl font-bold text-[#8083ff] font-mono">
                      {Math.round(activeSession.enrolled * 0.92)}
                    </span>
                    <span className="text-[10px] text-[#8e909a] block mt-0.5">
                      via Gate 01 scans
                    </span>
                  </div>
                </div>
              </div>

              {/* Tactical Actions */}
              <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => showToast("Pushing push notification: 'Session starting now'")}
                  className="w-full text-xs justify-center"
                >
                  <span className="material-symbols-outlined text-xs mr-1 text-[#4cd7f6]">
                    send_to_mobile
                  </span>
                  Broadcast 10-Min Warning to Attendees
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showToast("Opening Stage Slido Q&A moderation window")}
                  className="w-full text-xs justify-center text-[#8e909a] hover:text-white"
                >
                  <span className="material-symbols-outlined text-xs mr-1">
                    forum
                  </span>
                  Open Live Slido / Audience Q&A
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-[#8e909a] font-mono text-xs">
              Select a session to inspect stage telemetry
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
