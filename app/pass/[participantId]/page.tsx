"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";

interface PassData {
  participant: {
    id: string;
    passId: string;
    name: string;
    email: string;
    phone?: string;
    college: string;
    tier: string;
    checkedIn: boolean;
    checkInTime?: string;
    checkInGate?: string;
    qrPayload: string;
  };
  event: {
    id: string;
    name: string;
    slug: string;
    venue: string;
    city: string;
    date: string;
    time: string;
  };
  qrDataUrl: string;
}

export default function DigitalPassPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const unwrappedParams = use(params);
  const participantId = unwrappedParams.participantId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passData, setPassData] = useState<PassData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPass() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pass/${encodeURIComponent(participantId)}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Unable to retrieve pass credentials.");
        }
        const data = await res.json();
        setPassData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load digital pass.");
      } finally {
        setLoading(false);
      }
    }
    if (participantId) {
      loadPass();
    }
  }, [participantId]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${passData?.event.name} Digital Pass - ${passData?.participant.name}`,
          text: `Here is my verified digital entry pass for ${passData?.event.name} (${passData?.participant.passId}).`,
          url,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!passData?.qrDataUrl) return;
    const a = document.createElement("a");
    a.href = passData.qrDataUrl;
    a.download = `EventOS-Pass-${passData.participant.passId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090d] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs text-cyan-400 tracking-widest uppercase">
          Synthesizing Cryptographic Hologram...
        </p>
      </div>
    );
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen bg-[#08090d] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-white mb-2">PASS NOT VERIFIED</h1>
        <p className="text-sm text-[#8c8f9f] max-w-md mb-6">{error || "Participant record could not be resolved."}</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-[#141724] border border-[#232942] hover:border-cyan-500/50 text-xs font-mono tracking-wider uppercase text-cyan-400 transition-all"
        >
          Return to EventOS
        </Link>
      </div>
    );
  }

  const { participant, event, qrDataUrl } = passData;

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f2f4f8] py-8 px-4 sm:px-6 flex flex-col items-center justify-center selection:bg-cyan-500 selection:text-black">
      {/* Top Brand Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center font-black text-xs text-black">
            E
          </div>
          <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
            EVENTOS<span className="text-cyan-400">.LIVE</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] tracking-wider text-emerald-400 uppercase font-semibold">
            {participant.checkedIn ? "CHECKED IN" : "GATE ACTIVE"}
          </span>
        </div>
      </div>

      {/* Main Holographic Digital Pass */}
      <div
        id="printable-pass"
        className="w-full max-w-md relative rounded-2xl bg-gradient-to-b from-[#121624] to-[#0c0e17] border border-[#232942] shadow-[0_0_50px_rgba(0,240,255,0.08)] overflow-hidden transition-all print:shadow-none print:border-black print:bg-white print:text-black"
      >
        {/* Holographic Header Gradient Strip */}
        <div className="h-2.5 w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" />

        {/* Header Event Details */}
        <div className="p-6 border-b border-[#1f2438] print:border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-bold print:text-black">
              OFFICIAL ENTRY PASS
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 print:border-black print:text-black">
              {participant.tier}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase mb-1 print:text-black">
            {event.name}
          </h1>
          <p className="text-xs text-[#8c8f9f] print:text-gray-600 font-mono">
            {event.venue} • {event.city}
          </p>
        </div>

        {/* Attendee Name & College */}
        <div className="px-6 pt-5 pb-4 bg-[#0a0d17]/60 print:bg-transparent">
          <div className="text-[10px] font-mono tracking-widest text-[#656a82] uppercase mb-1 print:text-gray-500">
            PARTICIPANT NAME
          </div>
          <div className="text-xl font-bold tracking-tight text-white mb-1 print:text-black">
            {participant.name}
          </div>
          <div className="text-xs font-mono text-cyan-300/80 print:text-black">
            {participant.college}
          </div>
        </div>

        {/* QR Code Presentation (High Contrast & Clear Ingress) */}
        <div className="p-6 flex flex-col items-center justify-center bg-black/40 border-y border-[#1f2438] print:border-gray-200 print:bg-transparent">
          <div className="p-3.5 bg-white rounded-xl shadow-2xl border-4 border-cyan-400/40 print:border-black">
            {/* Scannable from screen, PDF, screenshot, printed paper */}
            <img
              src={qrDataUrl}
              alt={`Entry QR for ${participant.passId}`}
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain block"
            />
          </div>

          {/* Participant ID Code */}
          <div className="mt-4 flex flex-col items-center">
            <span className="text-[10px] font-mono tracking-widest text-[#656a82] uppercase print:text-gray-500">
              PARTICIPANT ID
            </span>
            <span className="font-mono text-xl font-black tracking-wider text-cyan-400 print:text-black">
              {participant.passId}
            </span>
          </div>

          <p className="text-[11px] font-mono text-[#656a82] mt-2 text-center print:text-gray-600">
            Hold QR directly against the volunteer turnstile scanner
          </p>
        </div>

        {/* Event Schedule & Logistics Metadata */}
        <div className="p-6 grid grid-cols-2 gap-4 text-xs font-mono bg-[#0f121d]/80 print:bg-transparent">
          <div>
            <div className="text-[10px] text-[#656a82] tracking-wider uppercase mb-0.5 print:text-gray-500">
              DATE
            </div>
            <div className="font-bold text-[#d0d4e4] print:text-black">{event.date}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#656a82] tracking-wider uppercase mb-0.5 print:text-gray-500">
              TIME
            </div>
            <div className="font-bold text-[#d0d4e4] print:text-black">{event.time}</div>
          </div>
          <div className="col-span-2 pt-2 border-t border-[#1f2438] print:border-gray-200 flex items-center justify-between">
            <span className="text-[10px] text-[#656a82] uppercase print:text-gray-500">STATUS</span>
            <span
              className={`font-mono text-[11px] font-bold ${
                participant.checkedIn ? "text-emerald-400" : "text-cyan-400"
              } print:text-black`}
            >
              {participant.checkedIn
                ? `CHECKED IN (${participant.checkInGate || "GATE 01"})`
                : "READY FOR INGRESS"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls: Download, Share, Print */}
      <div className="w-full max-w-md mt-6 grid grid-cols-3 gap-3 print:hidden">
        {/* Download */}
        <button
          onClick={handleDownload}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#121624] border border-[#232942] hover:border-cyan-500/50 hover:bg-[#181d2f] transition-all text-xs font-mono font-semibold text-white group"
        >
          <svg
            className="w-5 h-5 mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#121624] border border-[#232942] hover:border-violet-500/50 hover:bg-[#181d2f] transition-all text-xs font-mono font-semibold text-white group"
        >
          <svg
            className="w-5 h-5 mb-1.5 text-violet-400 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? "Copied!" : "Share Pass"}
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#121624] border border-[#232942] hover:border-emerald-500/50 hover:bg-[#181d2f] transition-all text-xs font-mono font-semibold text-white group"
        >
          <svg
            className="w-5 h-5 mb-1.5 text-emerald-400 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / PDF
        </button>
      </div>

      {/* Security Footnote */}
      <div className="mt-8 text-center text-[10px] font-mono text-[#656a82] max-w-sm print:hidden">
        Holographic cryptographic token dynamically generated by EventOS. Tamper-evident badge.
      </div>
    </div>
  );
}
