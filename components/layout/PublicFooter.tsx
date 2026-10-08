import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="w-full bg-[#0c0e13] border-t border-[rgba(255,255,255,0.07)] py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-geist text-xs text-[#c7c4d7]">
        <div className="flex items-center gap-2">
          <span>EventOS Telemetry Platform v3.8.2</span>
          <span className="text-[#464554]">—</span>
          <span className="text-[#10B981] font-mono">Production Mode</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:gap-6 font-mono text-xs">
          <span className="text-[#908fa0]">CLUSTER: US-EAST-01</span>
          <span className="text-[#4cd7f6] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
            SYNCED
          </span>
          <Link href="/verify/cert_dyn_88912" className="text-[#908fa0] hover:text-[#e2e2ea]">
            Verify Credentials
          </Link>
          <span className="text-[#908fa0]">© 2026 EventOS Inc.</span>
        </div>
      </div>
    </footer>
  );
}
