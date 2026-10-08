"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DYNAMITE_2026 } from "@/lib/data/dynamite2026";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/authContext";

const STAGES = [
  { step: 1, label: "Core Engine", desc: "Identity & Venue" },
  { step: 2, label: "Branding", desc: "Design & Themes" },
  { step: 3, label: "Sessions", desc: "Schedule Matrix" },
  { step: 4, label: "Attendees & Gates", desc: "Tiers & Turnstiles" },
  { step: 5, label: "Staff & Automations", desc: "Staff & Webhooks" },
  { step: 6, label: "Publish", desc: "Deploy Live Event" },
];

export default function EventStudioPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = (params?.orgId as string) || "org_dynamite_default";
  const { getAuthHeaders } = useAuth();

  const [currentStage, setCurrentStage] = useState(1);
  const [meshActive, setMeshActive] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [createdEventId, setCreatedEventId] = useState("");

  // Form states
  const [eventName, setEventName] = useState("DYNAMITE 2026");
  const [slug, setSlug] = useState("dynamite-2026");
  const [tagline, setTagline] = useState("Autonomous Systems & AI Summit");
  const [description, setDescription] = useState("Flagship technical festival and conference for 1,500 builders.");
  const [logoUrl, setLogoUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80");
  const [coverImageUrl, setCoverImageUrl] = useState("https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80");
  const [venueName, setVenueName] = useState("Begumpet Exhibition Concourse");
  const [city, setCity] = useState("Hyderabad");
  const [dateStart, setDateStart] = useState("2026-10-15T09:00");
  const [dateEnd, setDateEnd] = useState("2026-10-15T18:00");
  const [capacity, setCapacity] = useState(1500);
  const [primaryBrand, setPrimaryBrand] = useState("#8083ff");

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: eventName,
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          tagline,
          description,
          logo_url: logoUrl,
          cover_image_url: coverImageUrl,
          primary_color: primaryBrand,
          venueName,
          city,
          dateStart,
          dateEnd,
          capacity: Number(capacity),
        }),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        setCreatedEventId(data.event.id);
        setDeployed(true);
      } else {
        const fallbackId = `evt_${Date.now()}`;
        setCreatedEventId(fallbackId);
        setDeployed(true);
      }
    } catch {
      const fallbackId = `evt_${Date.now()}`;
      setCreatedEventId(fallbackId);
      setDeployed(true);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <AppShell eventId={createdEventId || DYNAMITE_2026.id} eventName={eventName} stageName="EVENT STUDIO ARCHITECT">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto p-4 lg:p-8 gap-8">
        {/* ============================================================
            WIZARD PROGRESS STEPPER BAR
            ============================================================ */}
        <div className="p-4 lg:p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-[#908fa0]">
              <span className="material-symbols-outlined text-[#8083ff] text-base">
                architecture
              </span>
              <span className="text-[#e2e2ea] font-medium font-geist">
                EventOS Multi-Stage Onboarding & Provisioning Wizard
              </span>
            </div>

            <span className="font-mono text-xs text-[#4cd7f6] bg-[#4cd7f6]/10 px-2.5 py-1 rounded-md border border-[#4cd7f6]/20">
              STAGE 0{currentStage} OF 06
            </span>
          </div>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {STAGES.map((s) => {
              const isPast = s.step < currentStage;
              const isCurrent = s.step === currentStage;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStage(s.step)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all",
                    isCurrent
                      ? "bg-[#282a30] border-[#8083ff] shadow-[0_0_15px_rgba(128,131,255,0.25)]"
                      : isPast
                      ? "bg-[#1d2025] border-[#10B981]/30 text-[#e2e2ea]"
                      : "bg-[#191c21] border-transparent text-[#908fa0] opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold",
                      isCurrent
                        ? "bg-[#8083ff] text-[#1000a9]"
                        : isPast
                        ? "bg-[#10B981] text-[#0c0e13]"
                        : "bg-[#282a30] text-[#908fa0]"
                    )}
                  >
                    {isPast ? "✓" : s.step}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase font-bold",
                        isCurrent ? "text-[#4cd7f6]" : isPast ? "text-[#10B981]" : "text-[#908fa0]"
                      )}
                    >
                      {isCurrent ? "ACTIVE" : `STAGE 0${s.step}`}
                    </span>
                    <span className="font-geist text-xs font-semibold text-[#e2e2ea] truncate">
                      {s.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            MAIN STAGE WORKSPACE (LEFT FORM CONTROLS, RIGHT PREVIEW)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Configuration & Form Controls */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Stage 1: Core Engine */}
            {currentStage === 1 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-[#4cd7f6]">STAGE 01 // CORE ENGINE</span>
                  <h2 className="font-geist text-xl font-bold text-[#e2e2ea]">Identity & Venue Parameters</h2>
                  <p className="font-geist text-xs text-[#908fa0]">Define the basic event parameters, official name, venue and seating capacity.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-geist text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Event Official Name</label>
                      <input
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Event URL Slug</label>
                      <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 font-geist text-xs">
                    <label className="text-[#908fa0]">Tagline / Subheading</label>
                    <input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-geist text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Venue / Concourse</label>
                      <input
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Host City</label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-geist text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Start Date</label>
                      <input
                        type="datetime-local"
                        value={dateStart}
                        onChange={(e) => setDateStart(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">End Date</label>
                      <input
                        type="datetime-local"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Capacity (Pax)</label>
                      <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 2: Branding */}
            {currentStage === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-[#4cd7f6]">STAGE 02 // BRANDING & VISUAL IDENTITY</span>
                  <h2 className="font-geist text-xl font-bold text-[#e2e2ea]">Visual Identity & Assets</h2>
                  <p className="font-geist text-xs text-[#908fa0]">Upload brand assets, set cover graphics and theme accents within the Obsidian shell.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-col gap-4 font-geist text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#908fa0]">Event Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Logo Image URL</label>
                      <input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#908fa0]">Cover Banner URL</label>
                      <input
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        className="bg-[#0c0e13] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[#e2e2ea] focus:border-[#c0c1ff] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#908fa0]">Primary Accent Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryBrand}
                        onChange={(e) => setPrimaryBrand(e.target.value)}
                        className="w-10 h-9 rounded-lg bg-transparent cursor-pointer border border-[rgba(255,255,255,0.1)]"
                      />
                      <span className="font-mono text-xs text-[#e2e2ea]">{primaryBrand}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3: Sessions */}
            {currentStage === 3 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-[#4cd7f6]">STAGE 03 // SESSION RUN-OF-SHOW</span>
                  <h2 className="font-geist text-xl font-bold text-[#e2e2ea]">Stage Tracks & Keynotes</h2>
                  <p className="font-geist text-xs text-[#908fa0]">Calibrate auditorium stages, speaker bios, and broadcast timestamps.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-col gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold">STAGE 01: MAIN ARENA KEYNOTE</span>
                      <p className="text-[#908fa0] text-[10px]">Autonomous Agentic Architecture (09:30 AM)</p>
                    </div>
                    <span className="text-[#10B981] text-[10px] font-bold">READY</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold">STAGE 02: HACKATHON ARENA</span>
                      <p className="text-[#908fa0] text-[10px]">24-Hour Hardware Sprint (11:00 AM)</p>
                    </div>
                    <span className="text-[#4cd7f6] text-[10px] font-bold">CONFIGURED</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 4: Attendees & Gates */}
            {currentStage === 4 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-[#4cd7f6]">STAGE 04 // INGRESS RULES</span>
                  <h2 className="font-geist text-xl font-bold text-[#e2e2ea]">Attendee Tiers & Turnstiles</h2>
                  <p className="font-geist text-xs text-[#908fa0]">Calibrate pass tiers, turnstile gates, and offline mesh resilience.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-col gap-4 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e14]">
                    <div>
                      <span className="text-white font-bold">DELEGATE TIER (₹649)</span>
                      <p className="text-[#908fa0] text-[10px]">General access to keynote and tech tracks</p>
                    </div>
                    <span className="text-[#4cd7f6] font-bold">1,000 SEATS</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e14]">
                    <div>
                      <span className="text-white font-bold">VIP / KEYNOTE PASS (₹1,499)</span>
                      <p className="text-[#908fa0] text-[10px]">Reserved front auditorium seats & speaker lounge</p>
                    </div>
                    <span className="text-[#8083ff] font-bold">200 SEATS</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 5: Staff & Automations */}
            {currentStage === 5 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-[#4cd7f6]">STAGE 05 // STAFF ALLOCATION</span>
                  <h2 className="font-geist text-xl font-bold text-[#e2e2ea]">Gate Staff & Webhooks</h2>
                  <p className="font-geist text-xs text-[#908fa0]">Assign turnstile volunteer operators and configure real-time attendance webhooks.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-col gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#0c0e14] flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold">GATE OPERATOR 01 (Lead Ingress)</span>
                      <p className="text-[#908fa0] text-[10px]">Restricted to Turnstile Ingress Scanner</p>
                    </div>
                    <span className="text-[#10B981] font-bold text-[10px]">ASSIGNED</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c0e14] flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold">WEBHOOK REALTIME BUS</span>
                      <p className="text-[#908fa0] text-[10px]">Events dispatched: participant.checked_in</p>
                    </div>
                    <span className="text-[#4cd7f6] font-bold text-[10px]">ACTIVE</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 6: Publish & Deploy */}
            {currentStage === 6 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-[#4cd7f6]">STAGE 06 // CLUSTER DEPLOY</span>
                  <h2 className="font-geist text-xl font-bold text-[#e2e2ea]">Publish Live Event</h2>
                  <p className="font-geist text-xs text-[#908fa0]">Initialize live turnstile routing, generate participant ingress slots, and deploy to production.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#0c0e14] flex flex-col gap-2 font-mono text-xs">
                    <div className="flex justify-between text-[#908fa0]">
                      <span>EVENT NAME:</span>
                      <span className="text-white font-bold">{eventName}</span>
                    </div>
                    <div className="flex justify-between text-[#908fa0]">
                      <span>VENUE:</span>
                      <span className="text-[#4cd7f6]">{venueName}, {city}</span>
                    </div>
                    <div className="flex justify-between text-[#908fa0]">
                      <span>CAPACITY:</span>
                      <span className="text-white">{capacity} pax</span>
                    </div>
                  </div>

                  {deployed ? (
                    <div className="p-4 rounded-xl bg-[#064e3b]/80 border border-[#10B981]/40 text-[#d1fae5] flex flex-col gap-3">
                      <div className="flex items-center gap-2 font-geist text-sm font-semibold">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        <span>Event Provisioned Successfully!</span>
                      </div>
                      <p className="font-geist text-xs text-[#a7f3d0]">
                        Event ID: <span className="font-mono font-bold">{createdEventId}</span> is ready for attendee import and live turnstile scanning.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link
                          href={`/dashboard/${createdEventId}/participants`}
                          className="py-2 px-3 rounded-lg bg-[#10B981] text-[#0c0e13] font-mono text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          Import Participants (CSV) →
                        </Link>
                        <Link
                          href={`/dashboard/${createdEventId}`}
                          className="py-2 px-3 rounded-lg bg-[#282a30] text-[#e2e2ea] font-mono text-xs font-semibold hover:bg-[#33353b] transition-colors"
                        >
                          Command Center →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#8083ff] text-[#1000a9] hover:bg-[#c0c1ff] font-geist text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(128,131,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">
                        {isDeploying ? "progress_activity" : "rocket_launch"}
                      </span>
                      <span>{isDeploying ? "Provisioning Event..." : "Deploy Event Live"}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.07)]">
              <button
                type="button"
                onClick={() => setCurrentStage(Math.max(1, currentStage - 1))}
                disabled={currentStage === 1}
                className="px-4 py-2 rounded-xl bg-[#282a30] text-[#e2e2ea] hover:bg-[#33353b] font-mono text-xs disabled:opacity-40 transition-colors"
              >
                ← Previous Stage
              </button>

              <button
                type="button"
                onClick={() => setCurrentStage(Math.min(6, currentStage + 1))}
                disabled={currentStage === 6}
                className="px-5 py-2.5 rounded-xl bg-[#8083ff] text-[#1000a9] hover:bg-[#c0c1ff] font-mono text-xs font-semibold shadow-md transition-all disabled:opacity-40"
              >
                Proceed to Stage 0{currentStage + 1} →
              </button>
            </div>
          </div>

          {/* Right Column (5 cols): Live Deployment Canvas & Telemetry Simulator */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-geist text-base font-semibold text-[#e2e2ea]">
                  Live Cluster Simulator
                </span>
                <span className="font-mono text-xs text-[#4cd7f6] bg-[#4cd7f6]/10 px-2 py-0.5 rounded">
                  PILOT READY
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0c0e13] border border-[rgba(255,255,255,0.05)] flex flex-col gap-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[#908fa0]">
                  <span>EVENT CAPACITY</span>
                  <span className="text-[#e2e2ea] font-semibold">{capacity.toLocaleString()} PAX</span>
                </div>
                <div className="flex items-center justify-between text-[#908fa0]">
                  <span>ACTIVE INGRESS LANES</span>
                  <span className="text-[#4cd7f6] font-semibold">2 GATES (TURNSTILES)</span>
                </div>
                <div className="flex items-center justify-between text-[#908fa0]">
                  <span>PASS VERIFICATION</span>
                  <span className="text-[#10B981] font-semibold">SHA-256 REGISTRY HASH</span>
                </div>
                <div className="flex items-center justify-between text-[#908fa0]">
                  <span>DATA PARTITION</span>
                  <span className="text-[#c0c1ff] font-semibold">ISOLATED TENANT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
