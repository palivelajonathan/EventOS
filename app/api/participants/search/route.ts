import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { authenticateRequest, authorizeEventAccess } from "@/lib/auth/serverAuth";
import { pilotStore } from "@/lib/data/pilotStore";
import { MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "evt_dynamite2026";
    const query = (searchParams.get("query") || searchParams.get("q") || "").trim();

    // 1. Authorization Guard
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN", "GATE_STAFF", "VOLUNTEER"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // 2. Query Supabase if configured
    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        let dbQuery = adminClient
          .from("participants")
          .select(`
            id,
            name,
            email,
            phone,
            college,
            pass_code,
            external_registration_id,
            checked_in,
            check_in_time,
            check_in_gate,
            tier:tiers(name)
          `)
          .eq("event_id", eventId);

        if (query) {
          dbQuery = dbQuery.or(
            `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,pass_code.ilike.%${query}%,external_registration_id.ilike.%${query}%`
          );
        }

        const { data, error } = await dbQuery.limit(50);
        if (!error && data) {
          const formatted = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            college: p.college,
            passId: p.pass_code,
            externalRegistrationId: p.external_registration_id,
            tier: p.tier?.name || "GENERAL",
            checkedIn: p.checked_in,
            checkInTime: p.check_in_time,
            checkInGate: p.check_in_gate,
          }));

          return NextResponse.json({
            eventId,
            query,
            totalFound: formatted.length,
            participants: formatted,
          });
        }
      }
    }

    // 3. Resilient Store Search (In-memory pilotStore with fallback to MOCK)
    let participants = pilotStore.searchParticipants(eventId, query);
    if (participants.length === 0 && (!query || query.length === 0)) {
      participants = pilotStore.getParticipants(eventId);
    }
    if (participants.length === 0) {
      participants = MOCK_PARTICIPANTS.filter((p) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.passId.toLowerCase().includes(q) ||
          p.college.toLowerCase().includes(q)
        );
      });
    }

    const formatted = participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      college: p.college,
      passId: p.passId,
      externalRegistrationId: p.externalRegistrationId,
      tier: p.tier,
      checkedIn: p.checkedIn,
      checkInTime: p.checkInTime,
      checkInGate: p.checkInGate,
    }));

    return NextResponse.json({
      eventId,
      query,
      totalFound: formatted.length,
      participants: formatted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err?.message },
      { status: 500 }
    );
  }
}
