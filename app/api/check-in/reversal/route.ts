import { NextRequest, NextResponse } from "next/server";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { pilotStore } from "@/lib/data/pilotStore";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = body.eventId;
    const passCode = body.passCode || body.ticketCode || body.code;
    const reason = body.reason || "Manual organizer reversal";

    if (!eventId || !passCode) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing eventId or passCode/ticketCode." },
        { status: 400 }
      );
    }

    // Must be ORGANIZER or ADMIN to reverse a check-in
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const actor = `${authResult.user?.role} (${authResult.user?.id || "Admin"})`;

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: participant } = await adminClient
          .from("participants")
          .select("id, name, checked_in")
          .eq("event_id", eventId)
          .eq("pass_code", passCode)
          .single();

        if (participant) {
          if (!participant.checked_in) {
            return NextResponse.json(
              { error: "Bad Request", message: "Participant is not currently checked in." },
              { status: 400 }
            );
          }

          await adminClient
            .from("participants")
            .update({ checked_in: false, check_in_time: null, check_in_gate: null })
            .eq("id", participant.id);

          await adminClient.from("check_ins").insert({
            event_id: eventId,
            participant_id: participant.id,
            gate_name: "REVERSAL",
            status: "REVERSED",
            scanned_by: actor,
          });

          return NextResponse.json({
            success: true,
            message: `Check-in reversed for ${participant.name}.`,
          });
        }
      }
    }

    const reversed = pilotStore.reverseParticipantCheckIn(eventId, passCode, actor, reason);
    if (!reversed) {
      return NextResponse.json(
        {
          error: "Not Found or Not Checked In",
          message: `Unable to reverse check-in for "${passCode}". Either pass was not found or is not currently checked in.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: reversed,
      message: `Check-in reversed for pass ${passCode}. Audit record logged.`,
      auditLogged: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
