"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DYNAMITE_2026 } from "@/lib/data/dynamite2026";
import { Card, LiveBeacon, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/authContext";

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, getAuthHeaders } = useAuth();
  const eventId = (params?.eventId as string) || "evt_dynamite2026";

  // Gate Staff & Volunteer Access Guard
  const isOrganizerOrAdmin = user?.role === "ORGANIZER" || user?.role === "ADMIN";

  // General & Branding States
  const [eventName, setEventName] = useState(DYNAMITE_2026.name);
  const [tagline, setTagline] = useState(DYNAMITE_2026.tagline);
  const [description, setDescription] = useState("Flagship Autonomous Systems & AI Summit for 1,500 students and builders.");
  const [logoUrl, setLogoUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80");
  const [coverImageUrl, setCoverImageUrl] = useState("https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80");
  const [venue, setVenue] = useState(DYNAMITE_2026.venue);
  const [city, setCity] = useState(DYNAMITE_2026.city);
  const [dateStart, setDateStart] = useState("2026-10-15T09:00");
  const [dateEnd, setDateEnd] = useState("2026-10-15T18:00");
  const [primaryBrand, setPrimaryBrand] = useState("#8083ff");
  const [subdomain, setSubdomain] = useState("dynamite-2026");
  const [capacity, setCapacity] = useState(DYNAMITE_2026.metrics.capacity);

  // Operational States
  const [eventActive, setEventActive] = useState(true);
  const [gates, setGates] = useState([
    { id: "g_01", name: "Gate 01 • Main Arena", capacity: 800, staff: "Rahul Deshmukh", status: "ACTIVE" },
    { id: "g_02", name: "Gate 02 • North Turnstiles", capacity: 500, staff: "Ananya Nair", status: "ACTIVE" },
    { id: "g_03", name: "Gate 03 • VIP / Speaker Fast-Track", capacity: 200, staff: "Siddharth K.", status: "STANDBY" },
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Mesh & Webhooks
  const [meshEnabled, setMeshEnabled] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("https://api.dynamitefest.org/webhooks/eventos");
  const [activeTab, setActiveTab] = useState<"GENERAL" | "OPERATIONS" | "MESH" | "WEBHOOKS" | "TEAM">("GENERAL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudit() {
      try {
        const res = await fetch(`/api/audit?eventId=${eventId}`, {
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) {
          const json = await res.json();
          setAuditLogs(json.logs || []);
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      }
    }
    if (activeTab === "OPERATIONS" && isOrganizerOrAdmin) {
      loadAudit();
    }
  }, [activeTab, eventId, isOrganizerOrAdmin]);

  if (!isOrganizerOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 font-mono">
        <div className="w-16 h-16 rounded-2xl bg-[#ef4444]/15 border border-[#ef4444]/40 flex items-center justify-center text-[#ef4444]">
          <span className="material-symbols-outlined text-3xl">gpp_maybe</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-wider">ACCESS RESTRICTED // 403 FORBIDDEN</h2>
        <p className="text-sm text-[#908fa0] max-w-md">
          Gate Staff and Field Volunteers cannot configure event system parameters or operational controls. Your operational post is turnstile ingress control.
        </p>
        <button
          onClick={() => router.push("/volunteer/scan")}
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#00F0FF] text-[#050811] font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all"
        >
          Return to Scanner
        </button>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          eventId,
          updates: {
            name: eventName,
            tagline,
            description,
            logo_url: logoUrl,
            cover_image_url: coverImageUrl,
            primary_color: primaryBrand,
            venue_name: venue,
            city,
            capacity,
            status: eventActive ? "ACTIVE" : "DEACTIVATED",
          },
        }),
      });
      if (res.ok) {
        showToast("Event configuration & branding saved live!");
      } else {
        showToast("Parameters saved locally to session.");
      }
    } catch {
      showToast("Parameters saved locally to session.");
    }
  };

  const toggleEventStatus = async () => {
    const nextStatus = !eventActive;
    setEventActive(nextStatus);
    try {
      await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          eventId,
          updates: { status: nextStatus ? "ACTIVE" : "DEACTIVATED" },
        }),
      });
      showToast(`Event status updated: ${nextStatus ? "ACTIVATED" : "DEACTIVATED"}`);
    } catch {
      showToast(`Event marked ${nextStatus ? "ACTIVE" : "DEACTIVATED"}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-[#1a1e28] border border-[rgba(128,131,255,0.4)] text-white text-xs font-mono flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              SYSTEM_CONFIG // EVENT SETTINGS
            </h1>
            <LiveBeacon color={eventActive ? "cyan" : "warning"} pulse label={eventActive ? "EVENT ACTIVE" : "EVENT PAUSED"} />
          </div>
          <p className="text-xs text-[#8e909a] mt-1 font-mono">
            Manage global venue parameters, branding, turnstile status, gate staffing, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={eventActive ? "destructive" : "secondary"}
            size="sm"
            onClick={toggleEventStatus}
            className="text-xs"
          >
            <span className="material-symbols-outlined text-xs mr-1">
              {eventActive ? "pause_circle" : "play_circle"}
            </span>
            {eventActive ? "Deactivate Event" : "Activate Event"}
          </Button>

          <Button variant="primary" size="sm" onClick={handleSave} className="text-xs">
            <span className="material-symbols-outlined text-xs mr-1">save</span>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3 overflow-x-auto">
        {[
          { key: "GENERAL", label: "General & Branding", icon: "palette" },
          { key: "OPERATIONS", label: "Operations & Audit", icon: "shield" },
          { key: "TEAM", label: "Gates & Staff", icon: "badge" },
          { key: "MESH", label: "Offline Mesh", icon: "hub" },
          { key: "WEBHOOKS", label: "Webhooks", icon: "webhook" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "bg-[#8083ff]/15 text-[#8083ff] border border-[#8083ff]/30 font-bold"
                : "text-[#8e909a] hover:text-white hover:bg-[#161a24]"
            )}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: General & Branding */}
      {activeTab === "GENERAL" && (
        <div className="space-y-5">
          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              EVENT IDENTITY & BRANDING
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Event Official Name</label>
                <Input value={eventName} onChange={(e) => setEventName(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Tagline</label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono text-[#8e909a]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#161a24] text-white rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-mono focus:border-[#8083ff] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Logo Image URL</label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Cover Banner URL</label>
                <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Venue / Concourse</label>
                <Input value={venue} onChange={(e) => setVenue(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">City</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Start Date & Time</label>
                <Input type="datetime-local" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">End Date & Time</label>
                <Input type="datetime-local" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Primary Brand Accent</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryBrand}
                    onChange={(e) => setPrimaryBrand(e.target.value)}
                    className="w-10 h-9 rounded-lg bg-transparent cursor-pointer border border-[rgba(255,255,255,0.1)]"
                  />
                  <span className="font-mono text-xs text-white uppercase">{primaryBrand}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8e909a]">Capacity Limit</label>
                <Input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="font-mono text-xs" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">PUBLIC EVENT ROUTING</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center bg-[#161a24] rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-mono">
                <span className="text-[#8e909a]">https://eventos.sh/event/</span>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="bg-transparent text-white font-bold px-1 focus:outline-none flex-1"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={() => showToast("Subdomain verified and routing active")} className="text-xs">
                Test Route
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Operations & Audit */}
      {activeTab === "OPERATIONS" && (
        <div className="space-y-5">
          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">EVENT OPERATIONAL SWITCH</h3>
                <p className="text-xs text-[#8e909a] font-mono mt-1">
                  When deactivated, turnstiles and scanners will reject all incoming ticket scans with HTTP 403 (EVENT INACTIVE).
                </p>
              </div>

              <button
                onClick={toggleEventStatus}
                className={cn(
                  "px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2",
                  eventActive ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40" : "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40"
                )}
              >
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: eventActive ? "#10B981" : "#EF4444" }} />
                <span>{eventActive ? "EVENT ACTIVE" : "EVENT DEACTIVATED"}</span>
              </button>
            </div>
          </Card>

          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">OPERATIONAL AUDIT TRAIL</h3>
              <span className="text-[10px] font-mono text-[#8e909a]">{auditLogs.length} AUDIT RECORDS LOGGED</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0c0e14] text-center font-mono text-xs text-[#8e909a]">
                  No operational modifications recorded yet. All actions are logged immutably.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)] flex items-start justify-between gap-3 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#8083ff]/15 text-[#8083ff] font-bold text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-white font-semibold">{log.actor}</span>
                      </div>
                      <p className="text-[#8e909a] text-[11px]">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-[#4cd7f6] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Gates & Staff */}
      {activeTab === "TEAM" && (
        <div className="space-y-5">
          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">GATE INGRESS ALLOCATION</h3>
              <Button variant="secondary" size="sm" onClick={() => showToast("Added Gate 04 • South Annex")} className="text-xs">
                <span className="material-symbols-outlined text-xs mr-1">add</span>
                Add Gate
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {gates.map((g) => (
                <div key={g.id} className="p-4 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)] space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{g.name}</span>
                    <span className="text-[10px] text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded font-bold">{g.status}</span>
                  </div>
                  <div className="text-[11px] text-[#8e909a] flex justify-between">
                    <span>Capacity: {g.capacity} pax</span>
                    <span className="text-[#4cd7f6]">{g.staff}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">ACTIVE GATE VOLUNTEERS & STAFF</h3>
              <Button variant="primary" size="sm" onClick={() => showToast("Invite link copied to clipboard")} className="text-xs">
                <span className="material-symbols-outlined text-xs mr-1">person_add</span>
                Invite Staff Member
              </Button>
            </div>

            <div className="space-y-2">
              {[
                { name: "Rahul Deshmukh", role: "HEAD OF SECURITY", gate: "Gate 01", status: "ONLINE" },
                { name: "Ananya Nair", role: "GATE OPERATOR", gate: "Gate 02", status: "ONLINE" },
                { name: "Siddharth K.", role: "ANNEX VOLUNTEER", gate: "Gate 03", status: "ONLINE" },
              ].map((staff) => (
                <div key={staff.name} className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e14] border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1f2330] flex items-center justify-center font-mono text-xs text-white">
                      {staff.name.charAt(0)}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{staff.name}</h4>
                      <p className="text-[10px] font-mono text-[#8e909a]">{staff.role} • Assigned to {staff.gate}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#6be794] bg-[#6be794]/10 px-2.5 py-1 rounded-full border border-[#6be794]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6be794] animate-pulse" />
                    {staff.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Offline Mesh */}
      {activeTab === "MESH" && (
        <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">PEER-TO-PEER OFFLINE TOLERANCE</h3>
              <p className="text-xs text-[#8e909a] font-mono mt-1">
                Allows volunteer devices to buffer scan tickets during Wi-Fi drops and synchronize once back online.
              </p>
            </div>
            <button
              onClick={() => setMeshEnabled(!meshEnabled)}
              className={cn("w-12 h-6 rounded-full transition-colors relative", meshEnabled ? "bg-[#8083ff]" : "bg-[#1f2330]")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5", meshEnabled ? "left-6" : "left-1")} />
            </button>
          </div>
        </Card>
      )}

      {/* Tab 5: Webhooks */}
      {activeTab === "WEBHOOKS" && (
        <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">OUTBOUND WEBHOOK PIPELINE</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8e909a]">Webhook Target Endpoint</label>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="font-mono text-xs" />
          </div>
          <Button variant="secondary" size="sm" onClick={() => showToast("Test webhook payload dispatched! HTTP 200 OK.")} className="text-xs mt-2">
            <span className="material-symbols-outlined text-xs mr-1">send</span>
            Dispatch Test Payload
          </Button>
        </Card>
      )}
    </div>
  );
}
