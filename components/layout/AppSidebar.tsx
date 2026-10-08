"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LiveBeacon } from "@/components/ui";

/* ──────────────────────────────────────────────────────────
   AppSidebar
   256px fixed sidebar — exact Stitch command_center spec
   ────────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  icon: string; // Material Symbol name
  href: string;
  badge?: string;
}

interface SidebarSection {
  label: string;
  items: NavItem[];
}

interface AppSidebarProps {
  eventId: string;
}

export function AppSidebar({ eventId }: AppSidebarProps) {
  const pathname = usePathname();
  const base = `/dashboard/${eventId}`;

  const sections: SidebarSection[] = [
    {
      label: "Console Operations",
      items: [
        {
          label: "Command Center",
          icon: "dashboard",
          href: `${base}`,
        },
        {
          label: "Gate Control",
          icon: "qr_code_scanner",
          href: `${base}/gate`,
        },
        {
          label: "Digital Passes",
          icon: "id_card",
          href: `${base}/passes`,
        },
        {
          label: "AI Intelligence",
          icon: "cognition",
          href: `${base}/ai`,
        },
      ],
    },
    {
      label: "Event Management",
      items: [
        {
          label: "Participants",
          icon: "group",
          href: `${base}/participants`,
        },
        {
          label: "Sessions",
          icon: "event_note",
          href: `${base}/sessions`,
        },
        {
          label: "Certificates",
          icon: "workspace_premium",
          href: `${base}/certificates`,
        },
        {
          label: "Analytics",
          icon: "query_stats",
          href: `${base}/analytics`,
        },
      ],
    },
    {
      label: "Configuration",
      items: [
        {
          label: "Event Settings",
          icon: "settings",
          href: `${base}/settings`,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 w-64 z-40",
        "bg-[#0c0e13] border-r border-[rgba(255,255,255,0.07)]",
        "flex flex-col"
      )}
    >
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-[rgba(255,255,255,0.07)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              "bg-[#8083ff] shadow-[0_0_12px_rgba(128,131,255,0.5)]"
            )}
          >
            <span className="material-symbols-outlined text-[#1000a9] text-base">
              bolt
            </span>
          </div>
          <span
            className="text-[#e2e2ea] font-geist font-semibold tracking-tight text-sm"
          >
            EventOS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-label-sm text-[#464554] font-mono uppercase tracking-widest mb-1.5 px-2">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== base && pathname.startsWith(item.href));
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-lg",
                        "text-body-sm font-geist transition-all duration-150",
                        isActive
                          ? [
                              "bg-[#1d2025] text-[#c0c1ff]",
                              "border border-[rgba(99,102,241,0.3)]",
                              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
                            ].join(" ")
                          : [
                              "text-[#908fa0] hover:text-[#e2e2ea]",
                              "hover:bg-[#1d2025]/60",
                            ].join(" ")
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-base",
                          isActive ? "text-[#c0c1ff]" : "text-[#464554]"
                        )}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto text-label-sm font-mono text-[#4cd7f6] bg-[#4cd7f6]/10 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div
        className={cn(
          "px-4 py-4 border-t border-[rgba(255,255,255,0.07)]",
          "space-y-2"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-[#464554] font-mono">
            SYS STATUS
          </span>
          <div className="flex items-center gap-1.5">
            <LiveBeacon color="secondary" size="sm" />
            <span className="text-label-sm text-[#4cd7f6] font-mono">
              NOMINAL
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-[#464554] font-mono">
            LATENCY
          </span>
          <span className="text-label-sm text-[#10B981] font-mono">12ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-[#464554] font-mono">
            UPTIME
          </span>
          <span className="text-label-sm text-[#908fa0] font-mono">
            99.98%
          </span>
        </div>
      </div>
    </aside>
  );
}
