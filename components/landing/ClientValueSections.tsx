export function ClientValueSections() {
  const collegeItems = [
    { title: "Student Events & Fests", desc: "Manage multi-stage college cultural fests, sports meets, and student elections with zero ticket fraud.", icon: "celebration" },
    { title: "24-48h Hackathons", desc: "Fast-track hacker check-ins, kit distributions, lab security access, and submission credentialing.", icon: "terminal" },
    { title: "Seminars & Guest Lectures", desc: "Audit department-wise attendance automatically and eliminate paper signature rosters.", icon: "school" },
    { title: "Hands-on Workshops", desc: "Cap session capacity in real time, restrict track admissions, and issue digital completion certificates.", icon: "engineering" },
    { title: "Academic Conferences", desc: "Delegate badges, speaker tracks, and institutional verification that meets compliance standards.", icon: "menu_book" },
  ];

  const organizerItems = [
    { title: "Gate Operations", desc: "One-handed camera scanning on any smartphone. Anti-passback turnstiles prevent badge sharing.", icon: "meeting_room" },
    { title: "Live Attendance", desc: "Monitor real-time ingress velocity, track capacity, and view live college distributions.", icon: "radar" },
    { title: "Volunteer Staffing", desc: "Scoped ingress roles ensure volunteers only scan tickets without accessing confidential settings.", icon: "badge" },
    { title: "Granular Analytics", desc: "Breakdowns by college, ticket tier, and peak entry hours. Instant one-click CSV report exports.", icon: "query_stats" },
    { title: "Verifiable Certificates", desc: "Mint tamper-proof PDFs with public QR verification links and database integrity hashes.", icon: "verified" },
    { title: "Operations Automation", desc: "Webhooks and AI copilot answer queries and stream check-in events in real time.", icon: "smart_toy" },
  ];

  return (
    <section className="w-full px-4 lg:px-8 py-20 bg-[#111319] border-t border-[rgba(255,255,255,0.06)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        {/* Value Section 1: For Colleges */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs text-[#4cd7f6] uppercase tracking-widest mb-1 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">school</span>
                TAILORED FOR CAMPUSES & INSTITUTIONS
              </div>
              <h3 className="font-geist text-2xl lg:text-3xl text-[#e2e2ea] tracking-tight uppercase font-medium">
                For Colleges & Universities
              </h3>
            </div>
            <p className="font-geist text-xs sm:text-sm text-[#c7c4d7] max-w-md leading-relaxed">
              Replace paper rosters, scattered Google sheets, and long entry queues with a unified platform built for student life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {collegeItems.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.06)] hover:border-[#4cd7f6]/40 transition-all flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <span className="material-symbols-outlined text-[#4cd7f6] text-2xl mb-3 block">
                    {item.icon}
                  </span>
                  <h4 className="font-geist text-sm font-semibold text-[#e2e2ea] mb-1.5">
                    {item.title}
                  </h4>
                  <p className="font-geist text-xs text-[#908fa0] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Section 2: For Event Organizers */}
        <div className="flex flex-col gap-8 pt-8 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs text-[#c0c1ff] uppercase tracking-widest mb-1 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">local_activity</span>
                POWERFUL EXECUTION CONTROLS
              </div>
              <h3 className="font-geist text-2xl lg:text-3xl text-[#e2e2ea] tracking-tight uppercase font-medium">
                For Event Organizers & Production Leads
              </h3>
            </div>
            <p className="font-geist text-xs sm:text-sm text-[#c7c4d7] max-w-md leading-relaxed">
              Every operational tool you need at the venue — from gate staff coordination to instant attendance reports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {organizerItems.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl bg-[#191c21] border border-[rgba(255,255,255,0.06)] hover:border-[#c0c1ff]/40 transition-all flex flex-col justify-between min-h-[170px]"
              >
                <div>
                  <span className="material-symbols-outlined text-[#c0c1ff] text-2xl mb-3 block">
                    {item.icon}
                  </span>
                  <h4 className="font-geist text-sm font-semibold text-[#e2e2ea] mb-1.5">
                    {item.title}
                  </h4>
                  <p className="font-geist text-xs text-[#908fa0] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
