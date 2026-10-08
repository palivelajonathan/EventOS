"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DYNAMITE_2026, Participant } from "@/lib/data/dynamite2026";
import { useAuth } from "@/lib/auth/authContext";
import {
  enqueueOfflineScan,
  getPendingOfflineScans,
  reconcileOfflineQueue,
  OfflineScanEntry,
} from "@/lib/offline/offlineQueue";
import { Html5Qrcode } from "html5-qrcode";

const GATES = [
  "Gate 01 • Main Arena",
  "Gate 02 • Technical Annex",
  "Gate 03 • VIP & Speakers",
  "Gate 04 • Express Ingress",
];

// Web Audio API chimes for tactile feedback
function playChime(type: "success" | "error" | "duplicate") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pleasant A5 chime
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "duplicate") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Audio context silently ignored if user hasn't interacted
  }
}

export default function EmergencyEventOpsPage() {
  const params = useParams();
  const eventId = (params?.eventId as string) || "evt_dynamite2026";
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();

  // Selected Gate
  const [activeGate, setActiveGate] = useState(user?.assignedGate || GATES[0]);

  // Telemetry Metrics
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Scan & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // Scanner UI States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "SUCCESS" | "ALREADY CHECKED IN" | "PARTICIPANT NOT FOUND" | "EVENT INACTIVE" | "WRONG EVENT" | "INVALID QR";
    message: string;
    participant?: any;
    timestamp: string;
  } | null>(null);

  // Offline Queue
  const [isOnline, setIsOnline] = useState(true);
  const [pendingScans, setPendingScans] = useState<OfflineScanEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // 1. Initial Load & Telemetry
  const refreshTelemetry = async () => {
    try {
      const res = await fetch(`/api/participants?eventId=${eventId}&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const parts: Participant[] = data.participants || [];
        setTotalParticipants(data.total || parts.length);
        const admitted = parts.filter((p) => p.checkedIn);
        setCheckedInCount(admitted.length);

        // Sort by check-in time for recent scans feed
        const sorted = [...admitted].slice(0, 8);
        setRecentScans(sorted);
      }
    } catch (e) {
      console.error("Telemetry refresh error:", e);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 5000); // 5s telemetry polling
    return () => clearInterval(interval);
  }, [eventId]);

  // 2. Offline Connectivity Monitoring
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setPendingScans(getPendingOfflineScans(eventId));

      const handleOnline = () => {
        setIsOnline(true);
        handleSyncOffline();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [eventId]);

  // 3. Search Attendees
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/participants?eventId=${eventId}&search=${encodeURIComponent(searchQuery)}&limit=10`,
          { headers: getAuthHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.participants || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, eventId]);

  // 4. Execute Check-In
  const handleCheckIn = async (passIdentifier: string) => {
    if (!passIdentifier || !passIdentifier.trim()) return;
    const cleanId = passIdentifier.trim();

    // Check if offline
    if (!navigator.onLine) {
      const queued = enqueueOfflineScan(eventId, cleanId, activeGate, user?.name || "STAFF");
      setPendingScans(getPendingOfflineScans(eventId));
      playChime("duplicate");
      setScanResult({
        status: "SUCCESS",
        message: "SAVED OFFLINE // Queued for automatic sync when network restores",
        participant: { name: cleanId, passId: cleanId, college: "Offline Queue" },
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          passCode: cleanId,
          eventId,
          gateName: activeGate,
        }),
      });

      const data = await res.json();
      const status = data.status;

      if (res.ok && status === "SUCCESS") {
        playChime("success");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([40, 60, 40]);
        }
        setScanResult({
          status: "SUCCESS",
          message: "ACCESS GRANTED // TURNSTILE UNLOCKED",
          participant: data.participant,
          timestamp: new Date().toLocaleTimeString(),
        });
        refreshTelemetry();
      } else if (status === "ALREADY CHECKED IN") {
        playChime("duplicate");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([150, 60, 150]);
        }
        setScanResult({
          status: "ALREADY CHECKED IN",
          message: data.message || "ALREADY CHECKED IN",
          participant: data.participant,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        playChime("error");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200]);
        }
        setScanResult({
          status: status || "INVALID QR",
          message: data.message || "ADMISSION REJECTED",
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      // Flaky connection error fallback
      enqueueOfflineScan(eventId, cleanId, activeGate, user?.name || "STAFF");
      setPendingScans(getPendingOfflineScans(eventId));
      playChime("duplicate");
      setScanResult({
        status: "SUCCESS",
        message: "SAVED OFFLINE // Queued due to network timeout",
        participant: { name: cleanId, passId: cleanId, college: "Offline Queue" },
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // 5. Camera QR Scanner Controls
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("ops-qr-reader");
          html5QrCodeRef.current = scanner;
          await scanner.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              handleCheckIn(decodedText);
            },
            () => {}
          );
        } catch (e: any) {
          alert("Unable to access device camera: " + e.message);
          setIsCameraActive(false);
        }
      }, 300);
    }
  };

  // 6. Manual Check-in Reversal
  const handleReverseCheckIn = async (passCode: string) => {
    if (!confirm(`Reverse check-in for ticket ${passCode}?`)) return;
    try {
      const res = await fetch("/api/check-in/reversal", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          passCode,
          eventId,
          reason: "Manual reversal from Emergency Ops console",
        }),
      });
      const data = await res.json();
      if (data.success) {
        refreshTelemetry();
        alert(`Check-in reversed for ${passCode}.`);
      } else {
        alert(data.message || "Failed to reverse.");
      }
    } catch (e: any) {
      alert("Reversal error: " + e.message);
    }
  };

  // 7. Sync Offline Scans
  const handleSyncOffline = async () => {
    setIsSyncing(true);
    const res = await reconcileOfflineQueue(eventId, getAuthHeaders());
    setIsSyncing(false);
    setPendingScans(getPendingOfflineScans(eventId));
    if (res.syncedCount > 0) {
      refreshTelemetry();
      alert(`Synced ${res.syncedCount} scans to server.`);
    }
  };

  const attendanceRatio = totalParticipants > 0 ? Math.round((checkedInCount / totalParticipants) * 100) : 0;

  return (
    <AppShell eventId={eventId} eventName={DYNAMITE_2026.name} stageName="EMERGENCY EVENT OPS">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto p-3 sm:p-6 gap-5 font-sans">
        {/* Top Emergency Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#14161a] border border-[rgba(255,255,255,0.08)] shadow-lg">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]"></span>
            </span>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                LIVE TURNSTILE OPERATIONS // {eventId}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-[#8e909a]">
                <span>Status: LIVE INGRESS</span>
                <span>•</span>
                <span className={isOnline ? "text-[#10b981]" : "text-[#f59e0b] font-bold"}>
                  {isOnline ? "ONLINE (CONNECTED)" : "OFFLINE (QUEUE ACTIVE)"}
                </span>
              </div>
            </div>
          </div>

          {/* Gate Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-[#8e909a] hidden sm:block">ACTIVE GATE:</label>
            <select
              value={activeGate}
              onChange={(e) => setActiveGate(e.target.value)}
              className="px-3 py-2 bg-[#1f2229] text-[#4cd7f6] font-mono text-xs font-bold rounded-xl border border-[rgba(255,255,255,0.12)] focus:border-[#4cd7f6] outline-none"
            >
              {GATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Pending Sync Button if offline items exist */}
          {pendingScans.length > 0 && (
            <button
              onClick={handleSyncOffline}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d98b06] text-black font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg animate-pulse"
            >
              <span className="material-symbols-outlined text-sm">cloud_sync</span>
              <span>Sync Offline Scans ({pendingScans.length})</span>
            </button>
          )}
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.06)] shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8e909a]">REGISTERED ROSTER</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-white mt-1">
              {totalParticipants.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[#8e909a] mt-1">Verified attendee records</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#191c21] border border-[#10b981]/30 shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#10b981]">CHECKED IN</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-[#10b981] mt-1">
              {checkedInCount.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[#10b981]/80 mt-1">{attendanceRatio}% of total roster admitted</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.06)] shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#4cd7f6]">PENDING ADMISSION</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-white mt-1">
              {(totalParticipants - checkedInCount).toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[#8e909a] mt-1">Expected at turnstiles</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.06)] shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8083ff]">ACTIVE GATE LOAD</div>
            <div className="text-lg font-bold font-mono text-[#8083ff] truncate mt-1">
              {activeGate.split("•")[0].trim()}
            </div>
            <div className="text-[10px] font-mono text-[#8e909a] mt-1">Ready for optical scans</div>
          </div>
        </div>

        {/* Main Operational Split: Scanner / Manual Input on Left, Live Telemetry on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Tactical Scan & Search Panel (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Camera Viewfinder & Manual Input Container */}
            <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.08)] shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">qr_code_scanner</span>
                  PRIMARY SCANNER ENGINE
                </span>

                <button
                  onClick={toggleCamera}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                    isCameraActive
                      ? "bg-[#ef4444] text-white hover:bg-[#dc2626]"
                      : "bg-[#4cd7f6] text-black hover:bg-[#38c5e4] shadow-lg shadow-[#4cd7f6]/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isCameraActive ? "videocam_off" : "photo_camera"}
                  </span>
                  <span>{isCameraActive ? "Stop Camera" : "Open Camera Scanner"}</span>
                </button>
              </div>

              {/* Viewfinder Container */}
              {isCameraActive && (
                <div className="relative w-full rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.15)] bg-black">
                  <div id="ops-qr-reader" className="w-full aspect-square max-h-[360px] mx-auto" />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 font-mono text-[10px] text-[#4cd7f6] uppercase tracking-wider">
                    SCANNING: {activeGate}
                  </div>
                </div>
              )}

              {/* Quick Manual Code Check-In */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) {
                    handleCheckIn(manualCode);
                    setManualCode("");
                  }
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter Ticket ID (e.g. EVT-DYN-000001, DYN-80562, or Ext Reg ID)..."
                    className="w-full bg-[#131518] text-white px-4 py-3 rounded-xl font-mono text-sm border border-[rgba(255,255,255,0.12)] focus:border-[#4cd7f6] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#8083ff] hover:bg-[#6b6eed] text-white font-mono text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">login</span>
                  <span>Check In</span>
                </button>
              </form>

              {/* Scan Outcome Banner */}
              {scanResult && (
                <div
                  className={`p-4 rounded-xl border animate-slide-in font-mono ${
                    scanResult.status === "SUCCESS"
                      ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]"
                      : scanResult.status === "ALREADY CHECKED IN"
                      ? "bg-[#f59e0b]/15 border-[#f59e0b]/40 text-[#f59e0b]"
                      : "bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold tracking-wide">
                        {scanResult.status === "SUCCESS" && "✓ "}
                        {scanResult.status === "ALREADY CHECKED IN" && "⚠ "}
                        {scanResult.status !== "SUCCESS" && scanResult.status !== "ALREADY CHECKED IN" && "✕ "}
                        {scanResult.message}
                      </div>
                      {scanResult.participant && (
                        <div className="mt-2 text-xs space-y-0.5 text-white">
                          <div className="font-bold text-sm">{scanResult.participant.name}</div>
                          <div className="text-[#8e909a]">
                            {scanResult.participant.college} • {scanResult.participant.tier || "GENERAL"} Pass
                          </div>
                          <div className="text-[11px] text-[#4cd7f6]">
                            Ticket: {scanResult.participant.passId || scanResult.participant.pass_code}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8e909a]">{scanResult.timestamp}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Instant Attendee Search & Manual Fallback */}
            <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.08)] shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8083ff] text-base">person_search</span>
                  HIGH-VELOCITY ATTENDEE LOOKUP
                </span>
                <span className="text-[11px] font-mono text-[#8e909a]">
                  Search Name, Phone, Email, or Reg ID
                </span>
              </div>

              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type attendee name, phone (+91...), email, or registration number..."
                  className="w-full bg-[#131518] text-white pl-10 pr-4 py-2.5 rounded-xl font-mono text-xs border border-[rgba(255,255,255,0.12)] focus:border-[#8083ff] outline-none"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8e909a] text-sm">
                  search
                </span>
              </div>

              {/* Search Results Table */}
              {searchResults.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#14161a]">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#101215] text-[#8e909a] text-[10px] uppercase border-b border-[rgba(255,255,255,0.06)]">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">College</th>
                        <th className="p-2.5">Pass ID</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                      {searchResults.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 font-bold text-white">
                            <div>{p.name}</div>
                            <div className="text-[10px] text-[#8e909a] font-normal">{p.email}</div>
                          </td>
                          <td className="p-2.5 text-[#8e909a] truncate max-w-[140px]">{p.college}</td>
                          <td className="p-2.5 text-[#4cd7f6]">{p.passId}</td>
                          <td className="p-2.5">
                            {p.checkedIn ? (
                              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold">
                                ADMITTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-white/10 text-[#8e909a] text-[10px]">
                                UNCHECKED
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            {p.checkedIn ? (
                              <button
                                onClick={() => handleReverseCheckIn(p.passId)}
                                className="px-2.5 py-1 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 text-[#ff8888] rounded-lg text-[10px] font-bold transition-colors"
                              >
                                Reverse
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCheckIn(p.passId)}
                                className="px-3 py-1 bg-[#10b981] hover:bg-[#0da472] text-black rounded-lg text-[10px] font-bold transition-colors"
                              >
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Admissions Feed & Gate Activity (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-5 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.08)] shadow-lg flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#10b981] text-base">history</span>
                  RECENT INGRESS AUDIT FEED
                </span>
                <span className="text-[10px] font-mono text-[#8e909a]">Auto-refreshing</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mt-3 max-h-[500px]">
                {recentScans.length === 0 ? (
                  <div className="p-8 text-center text-[#8e909a] font-mono text-xs">
                    No turnstile check-ins recorded yet for this session.
                  </div>
                ) : (
                  recentScans.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#14161a] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)] transition-all flex items-center justify-between font-mono text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#8083ff]/20 text-[#8083ff]">
                            {item.tier || "PASS"}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e909a]">
                          {item.checkInGate || "Gate 01"} • {item.checkInTime || "Just now"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#4cd7f6] font-bold">{item.passId}</span>
                        <button
                          onClick={() => handleReverseCheckIn(item.passId)}
                          title="Reverse this check-in"
                          className="p-1 text-[#8e909a] hover:text-[#ef4444] rounded hover:bg-white/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">undo</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
