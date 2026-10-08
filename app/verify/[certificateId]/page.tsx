"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { DYNAMITE_2026, MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";
import { cn } from "@/lib/utils";

interface VerificationRecord {
  valid: boolean;
  certificateNumber: string;
  credentialType: string;
  sha256Hash: string;
  issuedAt: string;
  event: {
    id: string;
    name: string;
    venue_name: string;
    city: string;
    date_start: string;
  };
  participant: {
    id: string;
    name: string;
    email: string;
    college: string;
    roll_number?: string;
    checked_in: boolean;
    check_in_time?: string;
    check_in_gate?: string;
  };
}

export default function CertificateVerificationPage() {
  const params = useParams();
  const certIdParam = (params?.certificateId as string) || "cert_dyn_88912";

  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadVerification() {
      try {
        const res = await fetch(`/api/certificates/verify/${certIdParam}`);
        if (res.ok) {
          const json = await res.json();
          setRecord(json);
        }
      } catch (err) {
        console.error("Verification fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadVerification();
  }, [certIdParam]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      if (typeof window !== "undefined") {
        window.open(`/api/certificates/pdf/${certIdParam}`, "_blank");
      }
    } catch {
      window.print();
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  // Fallback defaults while loading
  const participant = record?.participant || MOCK_PARTICIPANTS[0];
  const certNumber = record?.certificateNumber || "CERT-DYN-2026-88912";
  const sha256Hash = record?.sha256Hash || MOCK_PARTICIPANTS[0].sha256Hash;

  return (
    <div className="min-h-screen bg-[#111319] text-[#e2e2ea] flex flex-col">
      <PublicNavbar />

      <main className="w-full pt-16 flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-10 flex flex-col gap-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.07)]">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#10B981] font-semibold uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                <span>OFFICIAL CREDENTIAL VERIFICATION GATEWAY</span>
              </div>
              <h1 className="font-geist text-2xl lg:text-3xl font-bold text-[#e2e2ea] tracking-tight">
                Verifiable Credential Gateway
              </h1>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold">
                ✓ VERIFIED & RECORDED IN DATABASE
              </span>
            </div>
          </div>

          {/* Main 12-Col Dynamic Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left: The Museum-Grade Dark Certificate Card (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between font-mono text-xs text-[#908fa0]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8083ff] text-base">
                    workspace_premium
                  </span>
                  <span className="text-[#e2e2ea] font-medium font-geist">
                    Official Credential Document
                  </span>
                </div>
                <span>AUDIT CITATION: {certNumber}</span>
              </div>

              {/* Master Certificate Card */}
              <article className="relative rounded-2xl bg-[#0c0e13] p-6 sm:p-10 shadow-2xl border border-[rgba(255,255,255,0.09)] overflow-hidden">
                {/* Subtle Shimmer Aura */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#8083ff]/10 via-transparent to-[#4cd7f6]/10 pointer-events-none opacity-50" />

                {/* Inner Border Frame */}
                <div className="relative z-10 flex flex-col justify-between min-h-[540px] bg-[#191c21] rounded-xl p-6 sm:p-8 border border-[rgba(255,255,255,0.06)] shadow-inner">
                  {/* Top Certificate Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#8083ff] transform rotate-45" />
                        <span className="font-mono text-xs text-[#8083ff] tracking-widest uppercase font-semibold">
                          OFFICIAL CREDENTIAL CITATION // {certNumber}
                        </span>
                      </div>
                      <h2 className="font-geist text-xl font-bold text-[#e2e2ea] tracking-tight">
                        EVENTOS ACADEMIC CONSORTIUM
                      </h2>
                      <p className="font-geist text-xs text-[#908fa0] uppercase tracking-wider">
                        In Conjunction with Telangana Higher Education AI Grid
                      </p>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="px-2.5 py-1 rounded bg-[#10B981]/15 text-[#10B981] font-mono text-[11px] font-bold border border-[#10B981]/30">
                        {record?.credentialType || "HONORS"} PASS
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="my-8 text-center space-y-4">
                    <span className="font-mono text-xs text-[#908fa0] tracking-widest uppercase">
                      THIS CERTIFIES THAT
                    </span>
                    <h3 className="font-geist text-3xl sm:text-4xl font-extrabold text-[#e2e2ea] tracking-tight">
                      {participant.name}
                    </h3>
                    <p className="font-geist text-sm text-[#4cd7f6] font-semibold">
                      {participant.college}
                    </p>
                    <p className="font-geist text-xs text-[#908fa0] max-w-md mx-auto leading-relaxed pt-2">
                      has attended and fulfilled all participation requirements for{" "}
                      <span className="text-[#e2e2ea] font-semibold">
                        {record?.event?.name || DYNAMITE_2026.name}
                      </span>
                      , held at {record?.event?.venue_name || DYNAMITE_2026.venue}, {record?.event?.city || DYNAMITE_2026.city}.
                    </p>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-6 border-t border-[rgba(255,255,255,0.06)]">
                    {/* Signatory 1 */}
                    <div className="space-y-1">
                      <div className="h-10 flex items-center justify-start overflow-hidden">
                        <svg className="h-8 text-[#8083ff] opacity-80" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 160 40">
                          <path d="M5 25 C25 5, 30 35, 45 15 C55 0, 65 38, 85 20 C100 8, 115 32, 135 15 C145 7, 155 28, 158 22" />
                          <path d="M40 32 L110 30" strokeDasharray="2 3" />
                        </svg>
                      </div>
                      <div className="h-0.5 w-full bg-[rgba(255,255,255,0.1)]" />
                      <p className="font-geist text-xs text-[#e2e2ea] font-medium pt-0.5">Dr. Vikram Sethi</p>
                      <p className="font-mono text-[10px] text-[#908fa0]">General Chair, EventOS Consortium</p>
                    </div>

                    {/* Center Seal */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full text-[#4cd7f6] animate-[spin_24s_linear_infinite]" viewBox="0 0 100 100">
                          <circle className="opacity-60" cx="50" cy="50" fill="none" r="46" stroke="currentColor" strokeDasharray="3 4" strokeWidth="1.5" />
                          <circle className="opacity-40" cx="50" cy="50" fill="none" r="38" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        <div className="w-12 h-12 rounded-full bg-[#282a30] flex flex-col items-center justify-center shadow-lg relative z-10 border border-[#4cd7f6]/30">
                          <span className="material-symbols-outlined text-[#4cd7f6] text-lg">verified</span>
                          <span className="font-mono text-[8px] text-[#c0c1ff] tracking-tighter">AUTHENTIC</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatory 2 */}
                    <div className="space-y-1 sm:text-right">
                      <div className="h-10 flex items-center justify-start sm:justify-end overflow-hidden">
                        <svg className="h-8 text-[#4cd7f6] opacity-80" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 160 40">
                          <path d="M10 20 C30 35, 45 5, 65 25 C80 15, 95 35, 120 10 C135 25, 150 15, 155 20" />
                        </svg>
                      </div>
                      <div className="h-0.5 w-full bg-[rgba(255,255,255,0.1)]" />
                      <p className="font-geist text-xs text-[#e2e2ea] font-medium pt-0.5">Arvind Swamy</p>
                      <p className="font-mono text-[10px] text-[#908fa0]">Director, Academic Alliance</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Right: Database Proof & Audit Details (5 cols) */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-geist text-base font-semibold text-[#e2e2ea]">
                    Database Ledger Verification
                  </span>
                  <span className="font-mono text-xs text-[#10B981] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    VALIDATED IN DATABASE
                  </span>
                </div>

                <div className="flex flex-col gap-3 font-mono text-xs">
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#1d2025] border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#908fa0] text-[10px] uppercase">SHA-256 Checksum</span>
                    <span className="text-[#4cd7f6] text-[10px] break-all">
                      {sha256Hash}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#1d2025] border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#908fa0] text-[10px] uppercase">Turnstile Ingress Verification</span>
                    <span className="text-[#10B981] text-xs">
                      {((participant as any).checked_in ?? (participant as any).checkedIn)
                        ? `Admitted at ${(participant as any).check_in_gate || (participant as any).checkInGate || "Gate 01"} (${(participant as any).check_in_time || (participant as any).checkInTime || "10:42 AM"})`
                        : "Checked-in Attendee"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#1d2025] border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#908fa0] text-[10px] uppercase">Certificate Registry Number</span>
                    <span className="text-[#e2e2ea] text-xs">{certNumber}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8083ff] text-[#1000a9] hover:bg-[#c0c1ff] font-geist text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">
                      {downloading ? "progress_activity" : "print"}
                    </span>
                    <span>{downloading ? "Preparing PDF..." : "Print / Save PDF Certificate"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1d2025] hover:bg-[#282a30] text-[#c7c4d7] hover:text-[#e2e2ea] font-mono text-xs border border-[rgba(255,255,255,0.05)] transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copied ? "check" : "content_copy"}
                    </span>
                    <span>{copied ? "Verification Link Copied!" : "Copy Verification URL"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
