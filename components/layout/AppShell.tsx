"use client";

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppShellProps {
  children: React.ReactNode;
  eventId?: string;
  eventName?: string;
  stageName?: string;
}

export function AppShell({
  children,
  eventId = "evt_dynamite2026",
  eventName = "Dynamite 2026",
  stageName = "STAGE 01 LIVE",
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#111319] text-[#e2e2ea]">
      {/* Desktop Sidebar (hidden on mobile, fixed left 64) */}
      <div className="hidden lg:block">
        <AppSidebar eventId={eventId} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-72 h-full">
            <AppSidebar eventId={eventId} />
          </div>
        </div>
      )}

      {/* Content wrapper offset for sidebar */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AppHeader eventName={eventName} stageName={stageName} />

        {/* Mobile menu trigger in floating corner if needed */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-3 rounded-full bg-[#8083ff] text-[#1000a9] shadow-[0_0_20px_rgba(128,131,255,0.5)] flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {/* Main content body with header clearance */}
        <main className="relative pt-16 flex-1 bg-[#111319]">
          {children}
        </main>
      </div>
    </div>
  );
}
