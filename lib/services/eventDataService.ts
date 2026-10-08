import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { DYNAMITE_2026, EventData, CheckInLog } from "@/lib/data/dynamite2026";
import { pilotStore } from "@/lib/data/pilotStore";

/**
 * EventOS Database Data Service
 * Connects directly to Supabase with automatic fallback to initial demonstration seed data.
 */
export async function getLiveEventData(eventId: string = "evt_dynamite2026"): Promise<EventData> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      if (supabase) {
        // 1. Fetch Event record
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("*")
          .or(`id.eq.${eventId},slug.eq.${eventId}`)
          .single();

        if (event && !eventError) {
          const actualEventId = event.id;

          // 2. Aggregate Participants
          const { count: registeredCount } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", actualEventId);

          const { count: checkedInCount } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", actualEventId)
            .eq("checked_in", true);

          // 3. Certificates count
          const { count: certCount } = await supabase
            .from("certificates")
            .select("*", { count: "exact", head: true })
            .eq("event_id", actualEventId)
            .eq("revoked", false);

          // 4. Sessions
          const { data: sessionsData } = await supabase
            .from("sessions")
            .select("*")
            .eq("event_id", actualEventId)
            .order("start_time", { ascending: true });

          // 5. Recent Check-ins
          const { data: checkinsData } = await supabase
            .from("check_ins")
            .select(`
              id,
              created_at,
              gate_name,
              status,
              latency_ms,
              participant:participants(pass_code, name, college)
            `)
            .eq("event_id", actualEventId)
            .order("created_at", { ascending: false })
            .limit(10);

          // 6. College breakdown
          const { data: participantsData } = await supabase
            .from("participants")
            .select("college")
            .eq("event_id", actualEventId);

          const collegeMap: Record<string, number> = {};
          (participantsData || []).forEach((p) => {
            const coll = p.college || "Unspecified";
            collegeMap[coll] = (collegeMap[coll] || 0) + 1;
          });

          const totalParticipants = participantsData?.length || 1;
          const collegeBreakdown = Object.entries(collegeMap)
            .map(([college, count]) => ({
              college,
              count,
              percentage: Math.round((count / totalParticipants) * 100),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

          const registered = registeredCount ?? DYNAMITE_2026.metrics.registered;
          const checkedIn = checkedInCount ?? DYNAMITE_2026.metrics.checkedIn;
          const attendanceRatio = registered > 0 ? Number((checkedIn / registered).toFixed(3)) : 0;

          const recentCheckins: CheckInLog[] = (checkinsData || []).map((c: any) => ({
            id: c.id,
            timestamp: new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            gate: c.gate_name,
            passId: c.participant?.pass_code || "DYN-UNKNOWN",
            participantName: c.participant?.name || "Attendee",
            college: c.participant?.college || "Unknown",
            status: c.status,
            latencyMs: c.latency_ms || 18,
          }));

          return {
            id: event.id,
            slug: event.slug,
            name: event.name,
            tagline: event.tagline || DYNAMITE_2026.tagline,
            organization: "Dynamite Events Collective",
            venue: event.venue_name || DYNAMITE_2026.venue,
            city: event.city || DYNAMITE_2026.city,
            date: new Date(event.date_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            status: event.status as any,
            metrics: {
              registered,
              capacity: event.capacity || 1500,
              checkedIn,
              attendanceRatio,
              targetRatio: 0.85,
              certificatesMinted: certCount ?? DYNAMITE_2026.metrics.certificatesMinted,
              peakScansPerSec: 4.8,
              avgLatencyMs: 12,
            },
            collegeBreakdown: collegeBreakdown.length > 0 ? collegeBreakdown : DYNAMITE_2026.collegeBreakdown,
            gates: DYNAMITE_2026.gates,
            recentCheckins: recentCheckins.length > 0 ? recentCheckins : DYNAMITE_2026.recentCheckins,
            sessions: (sessionsData && sessionsData.length > 0)
              ? sessionsData.map((s) => ({
                  id: s.id,
                  timeSlot: `${new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                  startTime: new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  endTime: new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  title: s.title,
                  track: s.track as any,
                  stage: s.stage,
                  speaker: {
                    name: s.speaker_name,
                    title: s.speaker_title || "",
                    org: s.speaker_org || "",
                    avatar: s.speaker_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                  },
                  capacity: s.capacity,
                  enrolled: s.enrolled,
                  isLiveNow: s.is_live_now,
                }))
              : DYNAMITE_2026.sessions,
          };
        }
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Production database connection failed: ${err?.message || err}`);
      }
      console.warn("Falling back to demo seed data due to Supabase query exception:", err);
    }
  }

  // Development / Demo mode fallback with dynamic pilotStore support
  const storedEv = pilotStore.getEvent(eventId);
  if (storedEv) {
    const participants = pilotStore.getParticipants(storedEv.id);
    const registered = participants.length > 0 ? participants.length : (storedEv.id === "evt_dynamite2026" ? DYNAMITE_2026.metrics.registered : 0);
    const checkedIn = participants.filter((p) => p.checkedIn).length;
    const attendanceRatio = registered > 0 ? Number((checkedIn / registered).toFixed(3)) : 0;

    const collegeMap: Record<string, number> = {};
    participants.forEach((p) => {
      const c = p.college || "Unspecified";
      collegeMap[c] = (collegeMap[c] || 0) + 1;
    });
    const totalP = participants.length || 1;
    const dynamicBreakdown = Object.entries(collegeMap)
      .map(([college, count]) => ({
        college,
        count,
        percentage: Math.round((count / totalP) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      ...DYNAMITE_2026,
      id: storedEv.id,
      name: storedEv.name,
      slug: storedEv.slug,
      tagline: storedEv.tagline || DYNAMITE_2026.tagline,
      venue: storedEv.venue_name || DYNAMITE_2026.venue,
      city: storedEv.city || DYNAMITE_2026.city,
      status: storedEv.status as any,
      metrics: {
        ...DYNAMITE_2026.metrics,
        registered,
        checkedIn,
        attendanceRatio,
        capacity: storedEv.capacity || 1500,
      },
      collegeBreakdown: dynamicBreakdown.length > 0 ? dynamicBreakdown : DYNAMITE_2026.collegeBreakdown,
    };
  }

  return DYNAMITE_2026;
}
