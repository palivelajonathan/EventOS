"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DYNAMITE_2026 } from "@/lib/data/dynamite2026";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/authContext";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  time: string;
  content: string;
  latency?: string;
  warning?: boolean;
  actions?: Array<{ label: string; action: string; icon: string; done?: boolean }>;
  breakdown?: Array<{ name: string; checkedIn: number; percent: number }>;
}

export default function AICopilotPage() {
  const event = DYNAMITE_2026;
  const { getAuthHeaders } = useAuth();
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_1",
      sender: "user",
      time: "10:42:19 AM",
      content: "How many participants have checked in so far, and which college has the highest turnout?",
    },
    {
      id: "msg_2",
      sender: "ai",
      time: "10:42:21 AM",
      latency: "+184ms",
      content: "1,086 participants have checked in (87.1% of registered total). Aurora's Degree College leads with 342 attendees (92% arrival rate), followed closely by CBIT with 284 attendees.",
      breakdown: [
        { name: "Aurora's Degree College", checkedIn: 342, percent: 92 },
        { name: "CBIT (Chaitanya Bharathi Inst. of Tech)", checkedIn: 284, percent: 88 },
        { name: "Vasavi College of Engineering", checkedIn: 216, percent: 82 },
        { name: "VNR Vignana Jyothi Inst.", checkedIn: 178, percent: 74 },
      ],
    },
    {
      id: "msg_3",
      sender: "user",
      time: "10:45:03 AM",
      content: "Are there any bottlenecks forming right now?",
    },
    {
      id: "msg_4",
      sender: "ai",
      time: "10:45:04 AM",
      latency: "+112ms",
      warning: true,
      content: "Recommended operational mitigations generated based on spatial flow patterns:",
      actions: [
        {
          label: "Broadcast Overflow Stream to Hall 3",
          action: "Hall 3 stream routing initialized. Stage monitors synced.",
          icon: "cast",
        },
        {
          label: "Redeploy 2 Volunteers from Gate 03 to Gate 01",
          action: "Radio command sent: Volunteers Priya & Alex re-routed to Gate 01.",
          icon: "transfer_within_a_station",
        },
      ],
    },
  ]);

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleActionClick = (actionText: string) => {
    setFeedbackNotice(actionText);
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const currentInput = inputVal;
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      content: currentInput,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ message: currentInput, eventId: event.id }),
      });
      const json = await res.json();
      const aiReply: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        latency: `+${Math.floor(110 + Math.random() * 70)}ms`,
        content: json.reply || "I don't have that information.",
        actions: json.toolUsed === "getCheckInStats" ? [
          {
            label: "Re-route 2 Volunteers to High-Load Gate",
            action: "Field staff notification dispatched via push telemetry.",
            icon: "transfer_within_a_station",
          },
        ] : undefined,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const errorReply: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        latency: "+40ms",
        content: "I don't have that information. Please check database connectivity.",
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  return (
    <AppShell eventId={event.id} eventName={event.name} stageName="AI COPILOT SYNTHESIZER">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto p-4 lg:p-8 gap-6">
        {/* ============================================================
            AI NEURAL CORE SPHERICAL VISUALIZER HEADER
            ============================================================ */}
        <div className="p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-lg flex flex-col sm:flex-row items-center gap-6">
          {/* Animated Spherical Core Visualizer */}
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
            {/* Outer Counter-Rotating SVG Rings */}
            <svg
              className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-[#8083ff]/30"
                cx="50"
                cy="50"
                fill="none"
                r="48"
                stroke="currentColor"
                strokeDasharray="6 10"
                strokeWidth="1.5"
              />
              <circle className="text-[#4cd7f6]" cx="50" cy="2" fill="currentColor" r="2.5" />
            </svg>

            <svg
              className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite_reverse]"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-[#03b5d3]/40"
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="currentColor"
                strokeDasharray="4 8"
                strokeWidth="1"
              />
              <circle className="text-[#c0c1ff]" cx="90" cy="50" fill="currentColor" r="2.5" />
            </svg>

            {/* Central Living Sphere */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#33353b] via-[#282a30] to-[#0c0e13] flex items-center justify-center shadow-[inset_0_0_20px_rgba(76,215,246,0.3)] border border-[#4cd7f6]/30">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8083ff] to-[#4cd7f6] opacity-75 blur-xs flex items-center justify-center animate-ping" />
              <div className="absolute w-12 h-12 rounded-full bg-[#0c0e13]/90 backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.1)]">
                <span className="material-symbols-outlined text-[#4cd7f6] text-2xl">
                  lens_blur
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Neural Status Readout */}
          <div className="flex flex-col gap-2 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 font-mono text-xs text-[#908fa0]">
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]" />
              <span>SYNCHRONOUS SPATIAL TELEMETRY</span>
              <span className="text-[#464554]">•</span>
              <span className="text-[#4cd7f6] font-semibold">READY FOR DISPATCH</span>
            </div>

            <h1 className="font-geist text-2xl font-bold text-[#e2e2ea] tracking-tight">
              EventOS Co-Pilot Intelligence
            </h1>
            <p className="font-geist text-xs text-[#c7c4d7] max-w-xl leading-relaxed">
              Cross-analyzing turnstile optics, NFC gate taps, stage audio-visual feeds, and audience reaction polls in real-time.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 font-mono text-xs">
              <span className="bg-[#282a30] px-2.5 py-1 rounded-md text-[#c0c1ff] border border-[rgba(255,255,255,0.06)]">
                OPTICAL RECOG: 99.8%
              </span>
              <span className="bg-[#282a30] px-2.5 py-1 rounded-md text-[#4cd7f6] border border-[rgba(255,255,255,0.06)]">
                LATENCY: 12ms
              </span>
              <span className="bg-[#282a30] px-2.5 py-1 rounded-md text-[#e2e2ea] border border-[rgba(255,255,255,0.06)]">
                NODE: HYD-CLUSTER-01
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Feedback Alert */}
        {feedbackNotice && (
          <div className="p-3.5 rounded-xl bg-[#0c0e13] border border-[#4cd7f6]/40 text-[#4cd7f6] font-mono text-xs flex items-center gap-2 animate-fadeIn shadow-lg">
            <span className="material-symbols-outlined text-base">task_alt</span>
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* ============================================================
            MAIN CONVERSATION STREAM + TELEMETRY SIDEBAR GRID
            ============================================================ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Synthesized Conversation Stream */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-2">
                  {msg.sender === "user" ? (
                    <div className="self-end max-w-xl rounded-2xl bg-[#282a30] px-5 py-3 text-[#e2e2ea] shadow-md border border-[rgba(255,255,255,0.08)]">
                      <div className="flex items-center justify-between gap-4 mb-1 font-mono text-xs text-[#c0c1ff]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">person</span>
                          ORGANIZER DISPATCH
                        </span>
                        <span className="text-[#908fa0]">{msg.time}</span>
                      </div>
                      <p className="font-geist text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="self-start w-full max-w-3xl rounded-2xl bg-[#191c21] p-5 lg:p-6 text-[#e2e2ea] shadow-md border border-[rgba(255,255,255,0.07)]">
                      <div className="flex items-center justify-between gap-4 mb-3 font-mono text-xs text-[#4cd7f6]">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className="material-symbols-outlined text-base">psychology</span>
                          <span>
                            {msg.warning ? "CRITICAL TELEMETRY WARNING IDENTIFIED" : "NEURAL SYNTHESIS RESOLUTION"}
                          </span>
                        </div>
                        <span className="text-[#908fa0]">
                          {msg.time} ({msg.latency})
                        </span>
                      </div>

                      {/* Warning Sensor Callout if present */}
                      {msg.warning && (
                        <div className="mb-4 p-4 rounded-xl bg-[#282a30] border border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-1 font-mono text-xs text-[#4cd7f6] font-semibold">
                              <span className="material-symbols-outlined text-sm">sensor_door</span>
                              <span>TURNSTILE GATE 01</span>
                            </div>
                            <div className="font-geist text-xl font-bold text-[#e2e2ea]">
                              5.2 <span className="font-mono text-xs text-[#908fa0] font-normal">scans/sec</span>
                            </div>
                            <div className="font-geist text-xs text-[#c7c4d7]">
                              Approaching 95% maximum optical throughput capacity.
                            </div>
                          </div>

                          <div className="h-px sm:h-auto sm:w-px bg-[rgba(255,255,255,0.1)]" />

                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-1 font-mono text-xs text-[#c0c1ff] font-semibold">
                              <span className="material-symbols-outlined text-sm">meeting_room</span>
                              <span>HALL 2 (AI WORKSHOP)</span>
                            </div>
                            <div className="font-geist text-xl font-bold text-[#e2e2ea]">
                              91% <span className="font-mono text-xs text-[#908fa0] font-normal">occupancy</span>
                            </div>
                            <div className="font-geist text-xs text-[#c7c4d7]">
                              Projected overflow for the upcoming 11:30 AM keynote.
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="font-geist text-sm text-[#e2e2ea] leading-relaxed mb-4">
                        {msg.content}
                      </p>

                      {/* Embedded College Turnout Breakdown */}
                      {msg.breakdown && (
                        <div className="rounded-xl bg-[#1d2025] p-4 flex flex-col gap-3 border border-[rgba(255,255,255,0.05)]">
                          <div className="flex items-center justify-between font-mono text-xs text-[#908fa0]">
                            <span>COLLEGE DELEGATION BREAKDOWN</span>
                            <span className="text-[#4cd7f6]">REAL-TIME GUEST MATRIX</span>
                          </div>

                          {msg.breakdown.map((item) => (
                            <div key={item.name} className="flex flex-col gap-1 font-geist text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[#e2e2ea] font-medium">{item.name}</span>
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  <span className="text-[#c7c4d7]">{item.checkedIn} Checked In</span>
                                  <span className="px-1.5 py-0.5 rounded bg-[#8083ff]/20 text-[#c0c1ff] font-semibold">
                                    {item.percent}% ARRIVED
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-[#282a30] h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-[#8083ff] to-[#4cd7f6] h-full rounded-full transition-all duration-700"
                                  style={{ width: `${item.percent}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dynamic Action Trigger Buttons */}
                      {msg.actions && (
                        <div className="flex flex-wrap gap-3">
                          {msg.actions.map((act) => (
                            <button
                              key={act.label}
                              type="button"
                              onClick={() => handleActionClick(act.action)}
                              className="px-4 py-2.5 rounded-xl bg-[#8083ff] text-[#1000a9] hover:bg-[#c0c1ff] font-geist text-xs font-semibold transition-all flex items-center gap-2 shadow-md active:scale-95"
                            >
                              <span className="material-symbols-outlined text-base">
                                {act.icon}
                              </span>
                              <span>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* High-End Terminal Omni-Prompt Command Console Input */}
            <div className="relative w-full rounded-2xl bg-[#191c21] p-3 border border-[rgba(255,255,255,0.08)] shadow-xl mt-2">
              <form onSubmit={handleSendPrompt} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-2">
                  <span className="material-symbols-outlined text-[#8083ff] text-base">
                    auto_fix_high
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#908fa0]">
                    EventOS Natural Language Terminal
                  </span>
                </div>

                <div className="relative flex items-center bg-[#0c0e13] rounded-xl px-3 py-2 border border-[rgba(255,255,255,0.06)]">
                  <input
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Ask EventOS AI anything (e.g. 'What is the projected lunch rush at Food Court 2?')..."
                    className="w-full bg-transparent font-geist text-xs text-[#e2e2ea] placeholder:text-[#908fa0] focus:outline-none min-w-0"
                  />

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => alert("Voice input active...")}
                      className="p-1.5 rounded-lg hover:bg-[#282a30] text-[#908fa0] hover:text-[#4cd7f6] transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">mic</span>
                    </button>

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-[#8083ff] text-[#1000a9] font-mono text-xs font-semibold hover:bg-[#c0c1ff] transition-all flex items-center gap-1 shadow-sm"
                    >
                      <span>Query</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (4 cols): Sentiment & Autonomous Agent Watchlist */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* CARD 1: Live Sentiment Analyzer */}
            <div className="w-full rounded-2xl bg-[#191c21] p-6 border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-lg">
                    sentiment_very_satisfied
                  </span>
                  <span className="font-geist text-base font-semibold text-[#e2e2ea]">
                    Audience Sentiment
                  </span>
                </div>
                <span className="font-mono text-xs text-[#4cd7f6] bg-[#4cd7f6]/10 px-2 py-0.5 rounded border border-[#4cd7f6]/20">
                  96% OPTIMAL
                </span>
              </div>

              {/* Metric Ring Visualizer */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#282a30]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-[#4cd7f6]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="96, 100"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-bold text-[#e2e2ea]">
                    96%
                  </span>
                </div>

                <div className="flex flex-col font-geist text-xs text-[#c7c4d7]">
                  <span className="font-semibold text-[#e2e2ea]">Overall Energy Index: High</span>
                  <span className="text-[#908fa0] mt-0.5">
                    Analyzed across 420 live poll votes and Q&A reactions.
                  </span>
                </div>
              </div>

              {/* Trending Mentions */}
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-[#908fa0] pt-2 border-t border-[rgba(255,255,255,0.06)]">
                <span className="px-2 py-0.5 rounded bg-[#1d2025]">#AgentNetworks</span>
                <span className="px-2 py-0.5 rounded bg-[#1d2025]">#ZeroKnowledge</span>
                <span className="px-2 py-0.5 rounded bg-[#1d2025]">#BegumpetVenue</span>
              </div>
            </div>

            {/* CARD 2: Autonomous Agent Watchlist */}
            <div className="w-full rounded-2xl bg-[#191c21] p-6 border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[#908fa0]">
                <span>AUTONOMOUS AGENT DAEMONS</span>
                <span className="text-[#10B981]">3 RUNNING</span>
              </div>

              <div className="p-3 rounded-xl bg-[#1d2025] flex items-center justify-between border border-[rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[#e2e2ea]">Turnstile Gate 01 Monitor</span>
                </div>
                <span className="text-[#4cd7f6]">Every 5s</span>
              </div>

              <div className="p-3 rounded-xl bg-[#1d2025] flex items-center justify-between border border-[rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[#e2e2ea]">Hall 2 Occupancy Watcher</span>
                </div>
                <span className="text-[#4cd7f6]">Realtime</span>
              </div>

              <div className="p-3 rounded-xl bg-[#1d2025] flex items-center justify-between border border-[rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[#e2e2ea]">Certificate Minting Worker</span>
                </div>
                <span className="text-[#c0c1ff]">Batching</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
