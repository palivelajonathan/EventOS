"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Overview", href: "/" },
    { label: "Command Center", href: "/dashboard/evt_dynamite2026" },
    { label: "Gate Control", href: "/dashboard/evt_dynamite2026/gate" },
    { label: "Digital Passes", href: "/dashboard/evt_dynamite2026/passes" },
    { label: "AI Intelligence", href: "/dashboard/evt_dynamite2026/ai" },
    { label: "Schedule", href: "/event/dynamite-2026/schedule" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#111319]/90 backdrop-blur-xl border-b border-[rgba(255,255,255,0.07)] shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand + Event context */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#8083ff] shadow-[0_0_12px_rgba(128,131,255,0.5)]">
              <span className="material-symbols-outlined text-[#1000a9] text-base">
                bolt
              </span>
            </div>
            <span className="font-geist font-semibold tracking-tight text-sm text-[#e2e2ea]">
              EventOS
            </span>
          </Link>

          <div className="h-5 w-px bg-[rgba(255,255,255,0.1)] hidden md:block" />

          {/* Quick Event Switcher Badge */}
          <Link
            href="/dashboard/evt_dynamite2026"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-colors"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]" />
            <span className="font-mono text-xs text-[#e2e2ea] uppercase font-medium">
              Dynamite 2026
            </span>
            <span className="material-symbols-outlined text-[#908fa0] text-sm">
              expand_more
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-geist transition-all duration-150",
                    isActive
                      ? "bg-[#33353b] text-[#e2e2ea] border border-[rgba(255,255,255,0.15)] shadow-sm"
                      : "text-[#c7c4d7] hover:text-[#e2e2ea] hover:bg-[#1d2025]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Telemetry status + Search + Launch */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 font-mono text-xs px-3 py-1 rounded-lg bg-[#0c0e13] border border-[rgba(255,255,255,0.07)] text-[#c7c4d7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
            <span>ONLINE</span>
            <span className="text-[#464554]">•</span>
            <span className="text-[#4cd7f6]">12ms</span>
          </div>

          <Link
            href="/dashboard/evt_dynamite2026"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c0e13] border border-[rgba(255,255,255,0.08)] text-[#c7c4d7] hover:border-[rgba(255,255,255,0.2)] transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-sm text-[#908fa0]">
              search
            </span>
            <span className="hidden md:inline font-geist text-[#908fa0]">
              Search event telemetry...
            </span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] px-1 py-0.5 rounded bg-[#282a30] border border-[rgba(255,255,255,0.1)] text-[#e2e2ea]">
              ⌘K
            </kbd>
          </Link>

          <Link
            href="/org/org_dynamite/events/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8083ff] text-[#1000a9] font-mono text-xs font-semibold shadow-[0_0_20px_rgba(128,131,255,0.4)] hover:shadow-[0_0_30px_rgba(128,131,255,0.6)] transition-all"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span className="hidden sm:inline">Launch Event</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
