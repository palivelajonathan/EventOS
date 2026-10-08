export function PipelineGrid() {
  const stages = [
    {
      step: "01",
      icon: "app_registration",
      title: "REGISTRATION",
      desc: "Works alongside your existing ticketing & forms (Google Forms, Luma, Townscript, or direct CSV roster import).",
      tag: "CSV & FORM SYNC",
      color: "text-[#4cd7f6]",
      hoverBorder: "hover:border-[#4cd7f6]/40",
    },
    {
      step: "02",
      icon: "qr_code_2",
      title: "QR PASSES",
      desc: "Every participant receives a personalized digital pass with unique Pass ID and SHA-256 integrity verification.",
      tag: "DIGITAL PASS",
      color: "text-[#c0c1ff]",
      hoverBorder: "hover:border-[#c0c1ff]/40",
    },
    {
      step: "03",
      icon: "nfc",
      title: "CHECK-IN",
      desc: "High-velocity turnstile scanning with optical camera HUD, manual search fallback, and anti-passback duplicate blocking.",
      tag: "RAPID TURNSTILE",
      color: "text-[#4cd7f6]",
      hoverBorder: "hover:border-[#4cd7f6]/40",
    },
    {
      step: "04",
      icon: "radar",
      title: "ATTENDANCE",
      desc: "Live gate throughput monitoring, real-time college demographic breakdowns, and venue capacity alerts.",
      tag: "REALTIME FEED",
      color: "text-[#bdc2ff]",
      hoverBorder: "hover:border-[#bdc2ff]/40",
    },
    {
      step: "05",
      icon: "verified",
      title: "CERTIFICATES",
      desc: "Automated generation of tamper-proof PDF credentials with public verification URL and instant SHA-256 lookup.",
      tag: "GENUINE PDF",
      color: "text-[#c0c1ff]",
      hoverBorder: "hover:border-[#c0c1ff]/40",
    },
    {
      step: "06",
      icon: "analytics",
      title: "ANALYTICS",
      desc: "Detailed post-event telemetry, college participation distributions, peak throughput hours, and instant CSV exports.",
      tag: "EXPORT READY",
      color: "text-[#4cd7f6]",
      hoverBorder: "hover:border-[#4cd7f6]/40",
    },
    {
      step: "07",
      icon: "smart_toy",
      title: "AI COPILOT",
      desc: "Natural-language operations copilot grounded directly in your live database records with zero-hallucination guards.",
      tag: "DB GROUNDED",
      color: "text-[#c0c1ff]",
      hoverBorder: "hover:border-[#c0c1ff]/40",
    },
  ];

  return (
    <section className="w-full px-4 lg:px-8 py-16 bg-[#0c0e13]">
      <div className="max-w-7xl mx-auto flex flex-col">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="font-mono text-xs text-[#4cd7f6] uppercase tracking-widest mb-1 font-semibold">
              COMPLETE EVENT LIFECYCLE
            </div>
            <h2 className="font-geist text-2xl lg:text-3xl text-[#e2e2ea] tracking-tight uppercase font-medium">
              ONE SYSTEM. FROM ROSTER TO CREDENTIALS.
            </h2>
          </div>
          <p className="font-geist text-sm text-[#c7c4d7] max-w-md leading-relaxed">
            EventOS works alongside your existing registration sources. Ingest rosters in seconds, issue verified passes, and run turnstiles with zero bottlenecks.
          </p>
        </div>

        {/* 7-Stage Interactive Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {stages.map((stage) => (
            <div
              key={stage.step}
              className={`group p-4 rounded-xl bg-[#191c21] hover:bg-[#1d2025] border border-[rgba(255,255,255,0.06)] ${stage.hoverBorder} transition-all duration-200 flex flex-col justify-between min-h-[220px] shadow-sm`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-mono text-sm ${stage.color} font-semibold`}>
                    {stage.step}
                  </span>
                  <span className="material-symbols-outlined text-[#908fa0] group-hover:text-[#e2e2ea] text-lg transition-colors">
                    {stage.icon}
                  </span>
                </div>
                <h4 className="font-geist text-sm font-semibold text-[#e2e2ea] uppercase tracking-tight mb-1">
                  {stage.title}
                </h4>
                <p className="font-geist text-xs text-[#c7c4d7] leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              <div className={`pt-4 font-mono text-[10px] tracking-wider uppercase text-[#908fa0] group-hover:${stage.color} flex items-center gap-1 transition-colors border-t border-[rgba(255,255,255,0.04)]`}>
                <span>{stage.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
