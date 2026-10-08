"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DYNAMITE_2026, MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";
import { useAuth } from "@/lib/auth/authContext";
import { cn } from "@/lib/utils";

export default function DigitalPassesPage() {
  const urlParams = useParams();
  const eventId = (urlParams?.eventId as string) || "evt_dynamite2026";
  const { getAuthHeaders } = useAuth();
  const event = DYNAMITE_2026;
  const participant = MOCK_PARTICIPANTS[0];

  // Pass Delivery Telemetry State
  const [deliveryStats, setDeliveryStats] = useState<{
    totalParticipants: number;
    emailSent: number;
    emailPending: number;
    emailFailed: number;
    whatsappSent: number;
    whatsappPending: number;
    whatsappFailed: number;
    recentActivity: any[];
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [deliveryActionMessage, setDeliveryActionMessage] = useState<string | null>(null);

  const fetchDeliveryStats = async () => {
    try {
      const res = await fetch(`/api/notifications/status?eventId=${eventId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveryStats(data);
      }
    } catch (e) {
      console.warn("Failed to fetch notification stats:", e);
    }
  };

  useEffect(() => {
    fetchDeliveryStats();
    const interval = setInterval(fetchDeliveryStats, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleSendAll = async () => {
    setIsSending(true);
    setDeliveryActionMessage("Dispatching passes to all participants via Email & WhatsApp...");
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          eventId,
          action: "SEND_ALL",
          channels: ["EMAIL", "WHATSAPP"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryActionMessage(`Successfully dispatched ${data.dispatched} passes!`);
        fetchDeliveryStats();
      } else {
        setDeliveryActionMessage(`Error: ${data.error || "Dispatch failed"}`);
      }
    } catch (err: any) {
      setDeliveryActionMessage(`Failed: ${err.message}`);
    } finally {
      setIsSending(false);
      setTimeout(() => setDeliveryActionMessage(null), 6000);
    }
  };

  const handleRetryFailed = async () => {
    setIsSending(true);
    setDeliveryActionMessage("Retrying all failed pass deliveries...");
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          eventId,
          action: "RETRY_FAILED",
          channels: ["EMAIL", "WHATSAPP"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryActionMessage(`Retried delivery for ${data.dispatched} participants.`);
        fetchDeliveryStats();
      } else {
        setDeliveryActionMessage(`Error: ${data.error || "Retry failed"}`);
      }
    } catch (err: any) {
      setDeliveryActionMessage(`Failed: ${err.message}`);
    } finally {
      setIsSending(false);
      setTimeout(() => setDeliveryActionMessage(null), 6000);
    }
  };

  // 3D Card Tilt State
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -14;
    const rY = ((x - centerX) / centerX) * 14;

    setRotateX(rX);
    setRotateY(rY);
    setSheenPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setSheenPos({ x: 50, y: 50 });
  };

  return (
    <AppShell eventId={event.id} eventName={event.name} stageName="DIGITAL PASSES ACTIVE">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto p-4 lg:p-8 gap-8">
        {/* ============================================================
            SUB-HEADER CONTEXT BAR
            ============================================================ */}
        <div className="p-4 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]" />
              <span className="font-mono text-xs font-semibold text-[#e2e2ea]">
                HOLOGRAPHIC ATTENDEE CREDENTIAL // SHA-256 INTEGRITY
              </span>
            </div>
            <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] hidden sm:block" />
            <span className="font-mono text-xs text-[#908fa0]">
              TOTAL ISSUED: 1,247 PASSES
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/verify/cert_dyn_88912`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] text-[#c0c1ff] hover:bg-[#33353b] font-mono text-xs transition-colors border border-[rgba(255,255,255,0.08)]"
            >
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Verify Gateway</span>
            </Link>

            <button
              type="button"
              onClick={() => alert("Batch pass generation job dispatched to edge cluster.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8083ff] text-[#1000a9] font-mono text-xs font-semibold hover:bg-[#c0c1ff] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-sm">qr_code</span>
              <span>Export All Passes (ZIP)</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            12-COL ASYMMETRIC PASS SHOWCASE GRID
            ============================================================ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Holographic Pass Card & 3D Gyro Controls */}
          <div className="xl:col-span-7 flex flex-col items-center justify-center gap-4">
            {/* Lanyard Top Loop Simulator */}
            <div className="w-28 h-5 bg-[#33353b] rounded-t-xl border-t border-x border-[rgba(255,255,255,0.1)] flex items-center justify-center shadow-inner">
              <div className="w-12 h-1.5 bg-[#0c0e13] rounded-full" />
            </div>

            {/* 3D Holographic Card Viewport */}
            <div
              className="relative w-full max-w-[460px]"
              style={{ perspective: "1200px" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div
                ref={cardRef}
                className="relative w-full rounded-2xl bg-[#191c21] p-6 lg:p-7 border border-[rgba(255,255,255,0.1)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between overflow-hidden transition-transform duration-100 ease-out select-none"
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Iridescent Prismatic Sheen Overlay (Color Dodge) */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(76,215,246,0.35) 0%, rgba(192,193,255,0.2) 35%, transparent 70%)`,
                    mixBlendMode: "color-dodge",
                  }}
                />

                {/* Subtle Edge Keylight Emulation */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* Top Row: NFC/EMV Chip + Event Identity */}
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Simulated EMV / NFC Gold-Plated Chip */}
                    <div className="w-11 h-8 rounded bg-[#282a30] relative overflow-hidden flex items-center justify-center border border-amber-400/40 shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 via-yellow-200/50 to-amber-600/40" />
                      <div className="w-full h-px bg-[#0c0e13]/70 my-auto" />
                      <div className="h-full w-px bg-[#0c0e13]/70 mx-auto absolute" />
                      <span className="material-symbols-outlined text-xs text-amber-200 relative z-10">
                        contactless
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-mono text-xs tracking-wider text-[#4cd7f6] uppercase font-bold">
                        {event.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#908fa0]">
                        CONFERENCE PROTOCOL
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#03b5d3]/20 text-[#4cd7f6] border border-[#4cd7f6]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] shadow-[0_0_6px_currentColor]" />
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                      ALL-ACCESS
                    </span>
                  </div>
                </div>

                {/* Holographic Guilloche Security Watermark Strip */}
                <div className="w-full h-2 rounded-full bg-[#1d2025] overflow-hidden my-1">
                  <div className="w-full h-full bg-gradient-to-r from-[#4cd7f6]/30 via-[#8083ff]/40 to-[#4cd7f6]/30" />
                </div>

                {/* Main Participant Profile Section */}
                <div className="flex items-center gap-4 py-4">
                  {/* Avatar with Multi-layer Glow Ring */}
                  <div className="relative w-24 h-24 shrink-0 rounded-full p-1 bg-gradient-to-tr from-[#4cd7f6] via-[#8083ff] to-transparent shadow-lg">
                    <img
                      src={participant.avatarUrl}
                      alt={participant.name}
                      className="w-full h-full object-cover rounded-full bg-[#282a30]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0c0e13] flex items-center justify-center border border-[#4cd7f6]/40">
                      <span
                        className="material-symbols-outlined text-xs text-[#4cd7f6]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="font-mono text-[10px] text-[#4cd7f6] uppercase tracking-widest font-semibold">
                      DELEGATE // KEYNOTE SPEAKER
                    </div>
                    <h1 className="font-geist text-xl font-bold text-[#e2e2ea] tracking-tight truncate mt-0.5">
                      {participant.name}
                    </h1>
                    <p className="font-geist text-xs text-[#c7c4d7] truncate">
                      {participant.college}
                    </p>
                    <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                      <span className="text-[#908fa0]">REG: HYD-2026-BCA</span>
                      <span className="w-1 h-1 rounded-full bg-[#908fa0]" />
                      <span className="text-[#4cd7f6] font-semibold">TIER 1 VIP</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Scannable Gateway with Laser Reticle */}
                <div className="w-full rounded-xl bg-[#1d2025] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner border border-[rgba(255,255,255,0.05)]">
                  <div className="relative p-2 rounded-lg bg-[#0c0e13] shrink-0 shadow-md border border-[rgba(255,255,255,0.1)]">
                    <svg className="w-28 h-28 text-[#e2e2ea]" fill="currentColor" viewBox="0 0 120 120">
                      <rect fill="none" height="30" rx="3" stroke="currentColor" strokeWidth="5" width="30" x="10" y="10" />
                      <rect fill="currentColor" height="14" rx="2" width="14" x="18" y="18" />
                      <rect fill="none" height="30" rx="3" stroke="currentColor" strokeWidth="5" width="30" x="80" y="10" />
                      <rect fill="currentColor" height="14" rx="2" width="14" x="88" y="18" />
                      <rect fill="none" height="30" rx="3" stroke="currentColor" strokeWidth="5" width="30" x="10" y="80" />
                      <rect fill="currentColor" height="14" rx="2" width="14" x="18" y="88" />
                      <rect height="6" width="6" x="50" y="12" />
                      <rect height="6" width="6" x="62" y="12" />
                      <rect height="10" width="6" x="50" y="24" />
                      <rect height="6" width="6" x="62" y="30" />
                      <rect height="6" width="8" x="12" y="50" />
                      <rect height="6" width="6" x="26" y="50" />
                      <rect height="8" width="6" x="12" y="62" />
                      <rect height="6" width="8" x="24" y="66" />
                      <rect height="6" width="6" x="46" y="46" />
                      <rect height="6" width="6" x="68" y="46" />
                      <rect height="6" width="6" x="46" y="68" />
                      <rect height="6" width="6" x="68" y="68" />
                      <rect height="6" width="8" x="82" y="50" />
                      <rect height="6" width="12" x="96" y="50" />
                      <rect height="12" width="6" x="82" y="64" />
                      <rect height="6" width="6" x="102" y="64" />
                      <rect height="8" width="6" x="50" y="82" />
                      <rect height="6" width="6" x="62" y="82" />
                      <rect height="12" width="8" x="50" y="96" />
                      <rect height="6" width="6" x="64" y="96" />
                      <rect height="6" width="6" x="82" y="82" />
                      <rect height="6" width="6" x="94" y="82" />
                      <rect height="14" width="6" x="82" y="94" />
                      <rect height="6" width="14" x="94" y="102" />
                    </svg>
                    {/* Center bolt logo inside QR */}
                    <div className="absolute inset-0 m-auto w-7 h-7 rounded bg-[#282a30] flex items-center justify-center text-[#4cd7f6] shadow-md border border-[rgba(255,255,255,0.1)]">
                      <span className="material-symbols-outlined text-sm">bolt</span>
                    </div>
                  </div>

                  {/* Credential Metadata Telemetry */}
                  <div className="flex flex-col gap-1.5 w-full text-left font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#908fa0]">PASS ID</span>
                      <span className="text-[#4cd7f6] font-semibold">{participant.passId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#908fa0]">TICKET NO.</span>
                      <span className="text-[#e2e2ea]">#0842-X</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#908fa0]">GATE ACCESS</span>
                      <span className="text-[#c7c4d7]">HALL 1 • 2 • VIP LOUNGE</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1.5 bg-[#282a30]/60 px-2 py-1 rounded">
                      <span className="text-[#908fa0]">DYN-REFRESH</span>
                      <span className="text-[#4cd7f6] font-bold">24s</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Secure Strip */}
                <div className="pt-3 flex items-center justify-between text-[#908fa0] font-mono text-[10px] border-t border-[rgba(255,255,255,0.06)] mt-3">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#4cd7f6]">lock</span>
                    HARDWARE-BOUND TO SECURE ENCLAVE
                  </span>
                  <span className="text-[#e2e2ea]">DYN//2026</span>
                </div>
              </div>
            </div>

            {/* Interactive Tilt & Coordinate Feed HUD */}
            <div className="w-full max-w-[460px] flex items-center justify-between px-4 py-2 bg-[#191c21] rounded-xl border border-[rgba(255,255,255,0.07)] text-[#908fa0] font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
                  screen_rotation
                </span>
                <span>SPATIAL GYRO:</span>
                <span className="text-[#e2e2ea] font-semibold">
                  X: {rotateX.toFixed(1)}° Y: {rotateY.toFixed(1)}°
                </span>
              </div>
              <button
                type="button"
                onClick={handleMouseLeave}
                className="text-[#4cd7f6] hover:underline transition-colors"
              >
                Reset Tilt
              </button>
            </div>

            {/* Mobile Wallet Quick Provisioning */}
            <div className="w-full max-w-[460px] grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => alert("Generating Apple Wallet PKPass package...")}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1d2025] hover:bg-[#282a30] transition-all text-[#e2e2ea] border border-[rgba(255,255,255,0.07)]"
              >
                <span className="material-symbols-outlined text-base">wallet</span>
                <div className="flex flex-col text-left font-geist">
                  <span className="text-[10px] text-[#908fa0] leading-none">Add to</span>
                  <span className="text-xs font-semibold leading-tight">Apple Wallet</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => alert("Creating Google Wallet JWT Save link...")}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1d2025] hover:bg-[#282a30] transition-all text-[#e2e2ea] border border-[rgba(255,255,255,0.07)]"
              >
                <span className="material-symbols-outlined text-base text-[#4cd7f6]">
                  account_balance_wallet
                </span>
                <div className="flex flex-col text-left font-geist">
                  <span className="text-[10px] text-[#908fa0] leading-none">Save to</span>
                  <span className="text-xs font-semibold leading-tight">Google Wallet</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column (5 cols): Live Day Itinerary & Allocated Perks */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            {/* Live Day Itinerary */}
            <div className="rounded-2xl bg-[#191c21] p-6 border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-lg">
                    schedule
                  </span>
                  <span className="font-geist text-base font-semibold text-[#e2e2ea]">
                    Live Day Itinerary
                  </span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#282a30] text-[#4cd7f6]">
                  HYD TIME: 10:48 AM
                </span>
              </div>

              {/* Chronological Stage Timeline */}
              <div className="relative pl-6 flex flex-col gap-4 mt-2">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[#282a30]" />

                {/* Session 1 */}
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#0c0e13] ring-4 ring-[#4cd7f6]/20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-ping" />
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#4cd7f6] font-semibold">10:00 AM – 11:15 AM</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#03b5d3]/20 text-[#4cd7f6] uppercase font-bold text-[10px]">
                      IN PROGRESS
                    </span>
                  </div>
                  <h3 className="font-geist text-sm font-semibold text-[#e2e2ea]">
                    Opening Keynote: Decentralized AI Networks
                  </h3>
                  <p className="font-geist text-xs text-[#908fa0]">
                    Main Auditorium • Tier A Orchestra • Host: Dr. Vikram Sethi
                  </p>
                </div>

                {/* Session 2 */}
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#33353b]" />
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#908fa0]">11:30 AM – 01:00 PM</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#c7c4d7] uppercase font-bold text-[10px]">
                      RESERVED
                    </span>
                  </div>
                  <h3 className="font-geist text-sm font-medium text-[#e2e2ea]">
                    Hands-on Event AI Workshop
                  </h3>
                  <p className="font-geist text-xs text-[#908fa0]">
                    Hall 2 • Assigned Seat: <span className="text-[#c0c1ff] font-mono font-semibold">E-14</span> • Bring Laptop
                  </p>
                </div>

                {/* Session 3 */}
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#33353b]" />
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#908fa0]">02:00 PM – 04:30 PM</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#c7c4d7] uppercase font-bold text-[10px]">
                      UPCOMING
                    </span>
                  </div>
                  <h3 className="font-geist text-sm font-medium text-[#e2e2ea]">
                    Dynamite 2026 Grand Hackathon Pitch
                  </h3>
                  <p className="font-geist text-xs text-[#908fa0]">
                    Exhibition Arena Stage C • 12 Finalist Teams
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Pass Privileges & Digital Vouchers */}
            <div className="rounded-2xl bg-[#191c21] p-6 border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-geist text-base font-semibold text-[#e2e2ea]">
                  Allocated Perks & Tokens
                </span>
                <span className="font-mono text-xs text-[#908fa0]">3 OF 3 ACTIVE</span>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-1">
                {/* Voucher 1 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#1d2025] hover:bg-[#282a30] transition-colors border border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#282a30] flex items-center justify-center text-[#c0c1ff]">
                      <span className="material-symbols-outlined text-lg">restaurant</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-geist text-xs font-semibold text-[#e2e2ea]">
                        Executive Dining Voucher
                      </span>
                      <span className="font-mono text-[10px] text-[#908fa0]">
                        Code: #8921 • Dining Zone B
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("Voucher claimed! Present QR at Counter B.")}
                    className="px-2.5 py-1 rounded-md bg-[#8083ff]/10 text-[#c0c1ff] hover:bg-[#8083ff]/20 font-mono text-xs font-semibold transition-all"
                  >
                    CLAIM
                  </button>
                </div>

                {/* Voucher 2 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#1d2025] hover:bg-[#282a30] transition-colors border border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#282a30] flex items-center justify-center text-[#4cd7f6]">
                      <span className="material-symbols-outlined text-lg">wifi_tethering</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-geist text-xs font-semibold text-[#e2e2ea]">
                        Gigabit Mesh Wi-Fi (SSID: DYN-VIP)
                      </span>
                      <span className="font-mono text-[10px] text-[#908fa0]">
                        Passphrase: aurora-dyn-99
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText("aurora-dyn-99");
                      alert("Wi-Fi passphrase copied!");
                    }}
                    className="p-1.5 rounded-md hover:bg-[#33353b] text-[#c7c4d7] transition-colors"
                    title="Copy WiFi Details"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>

                {/* Voucher 3 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#1d2025] hover:bg-[#282a30] transition-colors border border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#282a30] flex items-center justify-center text-[#bdc2ff]">
                      <span className="material-symbols-outlined text-lg">celebration</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-geist text-xs font-semibold text-[#e2e2ea]">
                        VIP After-Party RSVP
                      </span>
                      <span className="font-mono text-[10px] text-[#908fa0]">
                        Begumpet Sky Lounge • 07:30 PM
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#10B981] font-semibold">
                    CONFIRMED
                  </span>
                </div>
              </div>
            </div>

            {/* Secure Registry Audit Proof */}
            <div className="rounded-2xl bg-[#0c0e13] p-5 border border-[rgba(255,255,255,0.06)] flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[#908fa0]">
                <span>INTEGRITY CHECKSUM (SHA-256)</span>
                <span className="text-[#10B981]">VERIFIED IN DATABASE REGISTRY</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#191c21] text-[10px] text-[#c7c4d7] break-all border border-[rgba(255,255,255,0.04)]">
                {participant.sha256Hash}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            P0: PASS DELIVERY OPERATIONAL DASHBOARD
            ============================================================ */}
        <div className="p-6 rounded-2xl bg-[#13161c] border border-[rgba(255,255,255,0.08)] flex flex-col gap-6 shadow-xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
              </div>
              <div>
                <h2 className="font-mono text-sm font-bold tracking-wider uppercase text-white">
                  PASS DELIVERY // MULTI-CHANNEL ORCHESTRATION
                </h2>
                <p className="font-mono text-xs text-[#908fa0]">
                  Automated delivery via Resend Email & Meta/Twilio Official WhatsApp API
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSendAll}
                disabled={isSending}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-mono text-xs font-bold hover:bg-cyan-300 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Send Passes to All</span>
              </button>

              <button
                type="button"
                onClick={handleRetryFailed}
                disabled={isSending || (deliveryStats?.emailFailed === 0 && deliveryStats?.whatsappFailed === 0)}
                className="px-4 py-2 rounded-xl bg-[#232732] hover:bg-[#2d3240] text-amber-300 font-mono text-xs font-semibold border border-amber-400/30 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">replay</span>
                <span>Retry Failed</span>
              </button>

              <button
                type="button"
                onClick={fetchDeliveryStats}
                className="p-2 rounded-xl bg-[#1d2025] hover:bg-[#282a30] text-[#908fa0] hover:text-white transition-colors"
                title="Refresh Live Telemetry"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
              </button>
            </div>
          </div>

          {/* Alert / Notification Feedback */}
          {deliveryActionMessage && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 font-mono text-xs text-cyan-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>{deliveryActionMessage}</span>
            </div>
          )}

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Total */}
            <div className="p-3.5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.05)]">
              <div className="font-mono text-[10px] text-[#908fa0] uppercase mb-1">TOTAL ATTENDEES</div>
              <div className="font-mono text-xl font-black text-white">
                {deliveryStats?.totalParticipants ?? 0}
              </div>
            </div>

            {/* Email Sent */}
            <div className="p-3.5 rounded-xl bg-[#191c21] border border-emerald-500/20">
              <div className="font-mono text-[10px] text-emerald-400 uppercase mb-1">EMAIL SENT</div>
              <div className="font-mono text-xl font-black text-emerald-400">
                {deliveryStats?.emailSent ?? 0}
              </div>
            </div>

            {/* Email Pending */}
            <div className="p-3.5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.05)]">
              <div className="font-mono text-[10px] text-[#908fa0] uppercase mb-1">EMAIL PENDING</div>
              <div className="font-mono text-xl font-black text-[#d0d4e4]">
                {deliveryStats?.emailPending ?? 0}
              </div>
            </div>

            {/* Email Failed */}
            <div className="p-3.5 rounded-xl bg-[#191c21] border border-rose-500/20">
              <div className="font-mono text-[10px] text-rose-400 uppercase mb-1">EMAIL FAILED</div>
              <div className="font-mono text-xl font-black text-rose-400">
                {deliveryStats?.emailFailed ?? 0}
              </div>
            </div>

            {/* WhatsApp Sent */}
            <div className="p-3.5 rounded-xl bg-[#191c21] border border-emerald-500/20">
              <div className="font-mono text-[10px] text-emerald-400 uppercase mb-1">WHATSAPP SENT</div>
              <div className="font-mono text-xl font-black text-emerald-400">
                {deliveryStats?.whatsappSent ?? 0}
              </div>
            </div>

            {/* WhatsApp Pending */}
            <div className="p-3.5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.05)]">
              <div className="font-mono text-[10px] text-[#908fa0] uppercase mb-1">WHATSAPP PENDING</div>
              <div className="font-mono text-xl font-black text-[#d0d4e4]">
                {deliveryStats?.whatsappPending ?? 0}
              </div>
            </div>

            {/* WhatsApp Failed */}
            <div className="p-3.5 rounded-xl bg-[#191c21] border border-rose-500/20">
              <div className="font-mono text-[10px] text-rose-400 uppercase mb-1">WHATSAPP FAILED</div>
              <div className="font-mono text-xl font-black text-rose-400">
                {deliveryStats?.whatsappFailed ?? 0}
              </div>
            </div>
          </div>

          {/* Recent Delivery Activity Log */}
          <div className="flex flex-col gap-2">
            <div className="font-mono text-xs text-[#908fa0] uppercase tracking-wider flex items-center justify-between">
              <span>RECENT PASS DELIVERY TRANSACTIONS</span>
              <span className="text-[11px] text-cyan-400 font-normal">Idempotent Delivery Key Protected</span>
            </div>

            <div className="rounded-xl bg-[#0c0e13] border border-[rgba(255,255,255,0.06)] overflow-hidden">
              {deliveryStats?.recentActivity && deliveryStats.recentActivity.length > 0 ? (
                <div className="divide-y divide-[rgba(255,255,255,0.04)] font-mono text-xs">
                  {deliveryStats.recentActivity.slice(0, 8).map((log: any, idx: number) => (
                    <div key={log.id || idx} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.type === "EMAIL"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="text-white font-medium">{log.recipient}</span>
                        <span className="text-[#656a82] text-[10px]">({log.provider})</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`text-[11px] font-bold ${
                            log.status === "SENT"
                              ? "text-emerald-400"
                              : log.status === "FAILED"
                              ? "text-rose-400"
                              : "text-amber-400"
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="text-[#656a82] text-[10px]">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "Just now"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-[#656a82] font-mono text-xs">
                  No active delivery logs recorded yet. Import participants or trigger "Send Passes to All".
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
