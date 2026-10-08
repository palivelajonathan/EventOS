"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EmergencyOpsRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "dynamite-2026";

  useEffect(() => {
    // Map human slug to internal event ID
    const eventId = slug === "dynamite-2026" ? "evt_dynamite2026" : slug;
    router.replace(`/dashboard/${eventId}/ops`);
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-[#08090d] text-white flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm tracking-wider uppercase">
        <svg className="w-5 h-5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Mounting EventOS Live Turnstile Ops Console...
      </div>
      <p className="text-xs text-[#8c8f9f] mt-2 font-mono">Routing to High-Velocity Check-In Terminal</p>
    </div>
  );
}
