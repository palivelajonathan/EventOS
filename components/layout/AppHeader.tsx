"use client";

import { useState } from "react";
import Link from "next/link";
import { LiveBeacon } from "@/components/ui";

interface AppHeaderProps {
  eventName?: string;
  stageName?: string;
}

export function AppHeader({
  eventName = "Dynamite 2026",
  stageName = "STAGE 01 LIVE",
}: AppHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-[#111319]/90 backdrop-blur-xl border-b border-[rgba(255,255,255,0.07)] shadow-[0_1px_8px_rgba(0,0,0,0.4)] z-40 flex items-center justify-between px-4 lg:px-8">
      {/* Left controls: Event switcher & stage status */}
      <div className="flex items-center gap-3 lg:gap-4">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-colors"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]" />
          <span className="font-mono text-xs text-[#e2e2ea] uppercase font-medium tracking-wide">
            {eventName}
          </span>
          <span className="material-symbols-outlined text-[#908fa0] text-sm">
            expand_more
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#c7c4d7]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>{stageName}</span>
        </div>
      </div>

      {/* Right controls: Omni-search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c0e13] border border-[rgba(255,255,255,0.08)] text-[#c7c4d7] hover:border-[rgba(255,255,255,0.2)] transition-colors text-xs"
        >
          <span className="material-symbols-outlined text-sm text-[#908fa0]">
            search
          </span>
          <span className="hidden md:inline font-geist text-[#908fa0]">
            Omni-search commands...
          </span>
          <kbd className="hidden sm:inline-block font-mono text-[10px] px-1 py-0.5 rounded bg-[#282a30] border border-[rgba(255,255,255,0.1)] text-[#e2e2ea]">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-lg hover:bg-[#1d2025] text-[#c7c4d7] hover:text-[#e2e2ea] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">
            notifications
          </span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#03b5d3] shadow-[0_0_6px_#4cd7f6]" />
        </button>

        <div className="flex items-center gap-2 pl-1 border-l border-[rgba(255,255,255,0.07)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8083ff] to-[#4cd7f6] p-[1px] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#111319] flex items-center justify-center text-xs font-mono font-semibold text-[#c0c1ff]">
              OP
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
