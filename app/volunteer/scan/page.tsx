"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DYNAMITE_2026, MOCK_PARTICIPANTS, Participant } from "@/lib/data/dynamite2026";
import { useAuth } from "@/lib/auth/authContext";
import { cn } from "@/lib/utils";

type MobileState = "valid" | "duplicate" | "invalid";

export default function MobileVolunteerScannerPage() {
  const event = DYNAMITE_2026;
  const { user, getAuthHeaders } = useAuth();
  const [state, setState] = useState<MobileState>("valid");
  const [attendee, setAttendee] = useState<any>(MOCK_PARTICIPANTS[0]);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const on = () => setIsOnline(true);
      const off = () => setIsOnline(false);
      window.addEventListener("online", on);
      window.addEventListener("offline", off);
      return () => {
        window.removeEventListener("online", on);
        window.removeEventListener("offline", off);
      };
    }
  }, []);

  const executeRealCheckIn = async (passCode: string) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          passCode,
          eventId: event.id,
          gateName: user?.assignedGate || "Gate 01 • Main Arena",
          scannedBy: user?.id,
        }),
      });

      const result = await res.json();
      if (res.status === 200 && result.status === "SUCCESS") {
        setState("valid");
        setAttendee(result.participant);
        setStatusMessage(`Access Granted: ${result.participant.name}`);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([40, 60, 40]);
        }
      } else if (res.status === 409 || result.status === "ALREADY CHECKED IN") {
        setState("duplicate");
        if (result.participant) setAttendee((prev: any) => ({ ...prev, ...result.participant }));
        setStatusMessage("Turnstile Blocked: Attendee already checked in.");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } else if (res.status === 401) {
        setState("invalid");
        setStatusMessage("Session Expired: Please re-authenticate.");
      } else if (res.status === 403) {
        setState("invalid");
        setStatusMessage(result.message || "Permission Denied: Staff event mismatch.");
      } else {
        setState("invalid");
        setStatusMessage(result.message || "Invalid pass code.");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200]);
        }
      }
    } catch (err: any) {
      console.error("Check-in request error:", err?.message);
      setState("invalid");
      setStatusMessage("Network Timeout: Check device connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerState = (s: MobileState) => {
    setState(s);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (s === "valid") navigator.vibrate([40, 60, 40]);
      else navigator.vibrate([100, 50, 100]);
    }
  };

  const handleNextScan = () => {
    const nextIdx = (MOCK_PARTICIPANTS.indexOf(attendee) + 1) % MOCK_PARTICIPANTS.length;
    const target = MOCK_PARTICIPANTS[nextIdx];
    executeRealCheckIn(target.passId);
  };

  return (
    <div className="min-h-screen bg-[#111319] text-[#e2e2ea] flex flex-col max-w-md mx-auto relative select-none">
      {/* Mobile Scanner Header */}
      <header className="h-14 px-4 bg-[#0c0e13] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/${event.id}`} className="text-[#908fa0] hover:text-[#e2e2ea]">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <span className="font-geist text-xs font-semibold text-[#e2e2ea] leading-tight">
              {user?.assignedGate || "Gate 01 • Main Arena"}
            </span>
            <span className="font-mono text-[10px] text-[#4cd7f6] uppercase">
              VOLUNTEER: {user?.name || "FIELD SCANNER"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-[#10B981] animate-pulse" : "bg-[#EF4444]")} />
          <span className={isOnline ? "text-[#10B981]" : "text-[#EF4444]"}>
            {isOnline ? "LEDGER CONNECTED" : "OFFLINE"}
          </span>
        </div>
      </header>

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-[#EF4444] text-[#0c0e13] px-3 py-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 z-40">
          <span className="material-symbols-outlined text-xs">wifi_off</span>
          NETWORK OFFLINE // LOCAL BUFFER ENGAGED
        </div>
      )}

      {/* Status Feedback Notice */}
      {statusMessage && (
        <div className="bg-[#191c21] text-[#4cd7f6] px-3 py-1.5 text-center font-mono text-xs border-b border-[#4cd7f6]/20">
          {statusMessage}
        </div>
      )}

      {/* Main Scanner Container */}
      <main className="p-4 flex-1 flex flex-col gap-4">
        {/* Full-width Optical Viewport */}
        <section className="relative w-full h-56 rounded-2xl bg-[#0c0e13] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e13] via-transparent to-[#0c0e13]/80" />

          {/* Corner Reticles */}
          <div className="relative w-44 h-44 flex flex-col justify-between p-1 z-10">
            <div className="flex justify-between w-full">
              <div className="w-5 h-5 border-t-2 border-l-2 border-[#4cd7f6]" />
              <div className="w-5 h-5 border-t-2 border-r-2 border-[#4cd7f6]" />
            </div>

            {/* Laser Line */}
            <div className="relative flex items-center justify-center w-full h-full">
              <div className="absolute w-full h-[2px] bg-[#4cd7f6] shadow-[0_0_12px_#4cd7f6] animate-pulse" />
              <div className="w-20 h-20 rounded bg-[#4cd7f6]/10 flex flex-col items-center justify-center text-center p-1 border border-[#4cd7f6]/30">
                <span className="font-mono text-[10px] text-[#4cd7f6] tracking-widest font-bold">
                  {attendee.passId}
                </span>
                <span className="material-symbols-outlined text-[#4cd7f6] text-xl mt-1">
                  qr_code_2
                </span>
              </div>
            </div>

            <div className="flex justify-between w-full">
              <div className="w-5 h-5 border-b-2 border-l-2 border-[#4cd7f6]" />
              <div className="w-5 h-5 border-b-2 border-r-2 border-[#4cd7f6]" />
            </div>
          </div>

          {/* HUD details */}
          <div className="absolute top-2 left-2 z-20 bg-[#282a30]/80 px-2 py-0.5 rounded font-mono text-[10px] text-[#e2e2ea] border border-[rgba(255,255,255,0.06)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
            <span>OPTICAL ENGINE ACTIVE • FOCUS LOCKED</span>
          </div>

          <div className="absolute bottom-2 right-2 z-20 bg-[#282a30]/80 px-2 py-0.5 rounded font-mono text-[10px] text-[#908fa0]">
            <span>ISO 800</span>
          </div>
        </section>

        {/* Interactive Diagnostic Preview Buttons */}
        <section className="flex items-center justify-between gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => triggerState("valid")}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg font-semibold uppercase active:scale-95 transition-all text-center border",
              state === "valid"
                ? "bg-[#10B981] text-[#0c0e13] border-[#10B981]"
                : "bg-[#282a30] text-[#e2e2ea] border-[rgba(255,255,255,0.08)]"
            )}
          >
            Sim Valid
          </button>
          <button
            type="button"
            onClick={() => triggerState("duplicate")}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg font-semibold uppercase active:scale-95 transition-all text-center border",
              state === "duplicate"
                ? "bg-[#EF4444] text-[#0c0e13] border-[#EF4444]"
                : "bg-[#282a30] text-[#e2e2ea] border-[rgba(255,255,255,0.08)]"
            )}
          >
            Sim Dup
          </button>
          <button
            type="button"
            onClick={() => triggerState("invalid")}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg font-semibold uppercase active:scale-95 transition-all text-center border",
              state === "invalid"
                ? "bg-[#F59E0B] text-[#0c0e13] border-[#F59E0B]"
                : "bg-[#282a30] text-[#e2e2ea] border-[rgba(255,255,255,0.08)]"
            )}
          >
            Sim Invalid
          </button>
        </section>

        {/* Verified Attendee Sheet Card */}
        <section className="bg-[#191c21] rounded-2xl p-4 shadow-xl border border-[rgba(255,255,255,0.07)] flex flex-col gap-3">
          {/* Status Header Banner */}
          {state === "valid" ? (
            <div className="flex items-center justify-between bg-[#064e3b]/80 px-3 py-2 rounded-xl border border-[#10B981]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#10B981] text-lg">
                  check_circle
                </span>
                <span className="font-mono text-xs text-[#10B981] uppercase font-bold">
                  ACCESS GRANTED
                </span>
              </div>
              <span className="font-mono text-xs text-[#a7f3d0]">10:42:18 AM</span>
            </div>
          ) : state === "duplicate" ? (
            <div className="flex items-center justify-between bg-[#450a0a]/80 px-3 py-2 rounded-xl border border-[#EF4444]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#EF4444] text-lg">
                  warning
                </span>
                <span className="font-mono text-xs text-[#EF4444] uppercase font-bold">
                  DUPLICATE DETECTED
                </span>
              </div>
              <span className="font-mono text-xs text-[#fca5a5]">GATE 01 (10:14)</span>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#78350f]/80 px-3 py-2 rounded-xl border border-[#F59E0B]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-lg">
                  gpp_bad
                </span>
                <span className="font-mono text-xs text-[#F59E0B] uppercase font-bold">
                  INVALID CREDENTIAL
                </span>
              </div>
              <span className="font-mono text-xs text-[#fde68a]">ERR-404</span>
            </div>
          )}

          {/* Attendee Details */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1">
              <h2 className="font-geist text-lg font-bold text-[#e2e2ea] truncate">
                {attendee.name}
              </h2>
              <p className="font-geist text-xs text-[#908fa0] truncate">
                {attendee.college}
              </p>
            </div>
            <div className="bg-[#8083ff]/20 text-[#c0c1ff] px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border border-[#8083ff]/30">
              {attendee.tier} PASS
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div className="bg-[#1d2025] p-2.5 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col">
              <span className="text-[10px] text-[#908fa0] uppercase">PASS CODE</span>
              <span className="font-geist text-sm text-[#4cd7f6] font-semibold mt-0.5">
                {attendee.passId}
              </span>
            </div>

            <div className="bg-[#1d2025] p-2.5 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col">
              <span className="text-[10px] text-[#908fa0] uppercase">SEAT SECTOR</span>
              <span className="font-geist text-sm text-[#e2e2ea] font-semibold mt-0.5">
                Hall 2 • Row E-14
              </span>
            </div>
          </div>

          {/* Swag Kit Status */}
          <div className="flex items-center justify-between bg-[#1d2025] px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.04)] mt-1">
            <div className="flex items-center gap-2 text-[#e2e2ea] font-geist text-xs">
              <span className="material-symbols-outlined text-base text-[#4cd7f6]">
                backpack
              </span>
              <span>Welcome Swag Kit & RFID Band</span>
            </div>
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#10B981] font-bold uppercase">
              <span className="material-symbols-outlined text-xs">done</span> COLLECTED
            </span>
          </div>
        </section>

        {/* Big Tactical Thumb Action Trigger */}
        <section className="flex flex-col gap-2 pt-1 font-mono">
          <button
            type="button"
            onClick={handleNextScan}
            className="w-full py-4 px-4 rounded-xl bg-[#8083ff] text-[#1000a9] flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(128,131,255,0.4)] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-xl">center_focus_weak</span>
            <span>Scan Next Attendee</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>

          {/* Secondary Fast Action Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="py-2.5 px-2 rounded-xl bg-[#282a30] hover:bg-[#33353b] text-[#e2e2ea] flex flex-col items-center justify-center gap-0.5 text-xs transition-colors border border-[rgba(255,255,255,0.08)]"
            >
              <span className="material-symbols-outlined text-base">search</span>
              <span>Manual ID</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert("NFC Reader active. Hold attendee card to back of device.");
              }}
              className="py-2.5 px-2 rounded-xl bg-[#282a30] hover:bg-[#33353b] text-[#e2e2ea] flex flex-col items-center justify-center gap-0.5 text-xs transition-colors border border-[rgba(255,255,255,0.08)]"
            >
              <span className="material-symbols-outlined text-base text-[#4cd7f6]">nfc</span>
              <span>Tap Card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerState("valid");
              }}
              className="py-2.5 px-2 rounded-xl bg-[#282a30] text-[#EF4444] hover:bg-[#EF4444]/20 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors border border-[#EF4444]/30"
            >
              <span className="material-symbols-outlined text-base">security</span>
              <span>Override</span>
            </button>
          </div>
        </section>

        {/* Turnstile Audit Log Stream */}
        <section className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between text-[#908fa0] font-mono text-xs uppercase px-1">
            <span>Turnstile Audit Log</span>
            <span className="text-[#4cd7f6]">LIVE FEED</span>
          </div>

          <div className="flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-geist text-xs text-[#e2e2ea] font-medium truncate">
                    Jonathan Vance
                  </span>
                  <span className="text-[10px] text-[#908fa0]">PASS #DYN-0482 • VIP</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-[#10B981] font-semibold uppercase">Granted</span>
                <span className="text-[10px] text-[#908fa0] block">10:42:18</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-geist text-xs text-[#e2e2ea] font-medium truncate">
                    Sarah Al-Mansoor
                  </span>
                  <span className="text-[10px] text-[#908fa0]">PASS #DYN-0481 • Delegate</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-[#10B981] font-semibold uppercase">Granted</span>
                <span className="text-[10px] text-[#908fa0] block">10:41:55</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Manual Search Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.1)] p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-geist text-base font-semibold text-[#e2e2ea]">
                Manual Turnstile Lookup
              </h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-[#908fa0] hover:text-[#e2e2ea]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search by Pass ID, Name, or Roll No..."
              className="w-full bg-[#0c0e13] text-[#e2e2ea] px-3.5 py-2.5 rounded-xl text-xs font-geist outline-none border border-[rgba(255,255,255,0.1)] focus:border-[#c0c1ff]"
              autoFocus
            />

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {MOCK_PARTICIPANTS.filter((p) =>
                p.name.toLowerCase().includes(searchVal.toLowerCase()) ||
                p.passId.toLowerCase().includes(searchVal.toLowerCase())
              ).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    executeRealCheckIn(p.passId);
                    setManualModalOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-[#1d2025] hover:bg-[#282a30] cursor-pointer flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-geist text-xs text-[#e2e2ea] font-medium">{p.name}</span>
                    <span className="font-mono text-[10px] text-[#908fa0]">{p.college}</span>
                  </div>
                  <span className="font-mono text-xs text-[#4cd7f6]">{p.passId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
