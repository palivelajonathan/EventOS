import Link from "next/link";

export function TrustTicker() {
  const categories = [
    { name: "COLLEGE TECHNICAL FESTS", icon: "school", color: "text-[#4cd7f6]" },
    { name: "24-48H HACKATHONS", icon: "terminal", color: "text-[#c0c1ff]" },
    { name: "INNOVATION & AI SUMMITS", icon: "rocket_launch", color: "text-[#4cd7f6]" },
    { name: "ACADEMIC CONFERENCES", icon: "menu_book", color: "text-[#bdc2ff]" },
    { name: "HANDS-ON WORKSHOPS", icon: "engineering", color: "text-[#4cd7f6]" },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Category badges */}
      <span className="font-mono text-xs text-[#908fa0] uppercase tracking-wider mb-6 text-center font-semibold">
        BUILT TO POWER MODERN STUDENT & PROFESSIONAL GATHERINGS
      </span>

      <div className="w-full flex flex-wrap items-center justify-center gap-3 lg:gap-4 font-mono text-xs text-[#c7c4d7]">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#282a30] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-all shadow-sm"
          >
            <span className={`material-symbols-outlined text-base ${cat.color}`}>
              {cat.icon}
            </span>
            <span className="font-medium text-[#e2e2ea] tracking-wide">
              {cat.name}
            </span>
          </div>
        ))}
      </div>

      {/* Verified System Architecture Strip */}
      <div className="w-full max-w-7xl mt-12 p-4 rounded-xl bg-[#282a30] border border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
          </span>
          <span className="font-mono text-xs text-[#e2e2ea] font-medium">
            Production Ready • Multi-Tenant Data Isolation • Anti-Passback Mutex Active
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs text-[#c7c4d7]">
          <span>
            PASS INTEGRITY: <span className="text-[#4cd7f6] font-semibold">SHA-256</span>
          </span>
          <span className="hidden md:inline">
            INGRESS CONCURRENCY: <span className="text-[#10B981] font-semibold">VERIFIED</span>
          </span>
          <Link href="/dashboard/evt_dynamite2026" className="text-[#4cd7f6] hover:underline font-semibold">
            Explore Dynamite 2026 Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
