import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";
import { pilotStore } from "@/lib/data/pilotStore";
import { dispatchWebhookEvent } from "@/lib/services/webhooks";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let passCode = body.passCode || body.qrCode || body.qr || body.code || body.ticketCode;
    const { eventId = "evt_dynamite2026", gateName = "Gate 01 • Main Arena", scannedBy } = body;

    // 1. Multi-Tenant Authorization Guard (Organizer, Admin, Volunteer, Gate Staff)
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN", "VOLUNTEER", "GATE_STAFF"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Check if event is active
    const evRecord = pilotStore.getEvent(eventId);
    if (evRecord && evRecord.status === "DEACTIVATED") {
      return NextResponse.json(
        { status: "EVENT INACTIVE", message: "Event turnstiles are currently deactivated by the organizer." },
        { status: 403 }
      );
    }

    if (!passCode || typeof passCode !== "string") {
      return NextResponse.json(
        { status: "INVALID QR", message: "QR payload is missing or unreadable." },
        { status: 400 }
      );
    }

    // Sanitize passCode: extract code if embedded in URI or standard EVTOS format
    // e.g. "EVTOS:DYN:88912:..." -> "DYN-88912" or direct "DYN-88912"
    // Sanitize passCode: extract code if embedded in URI or standard EVENTOS / EVTOS format
    passCode = passCode.trim();
    if (passCode.startsWith("EVENTOS:")) {
      const parts = passCode.split(":");
      if (parts.length >= 3) {
        const qrEventId = parts[1];
        if (qrEventId && qrEventId !== eventId && !eventId.includes(qrEventId) && !qrEventId.includes(eventId)) {
          return NextResponse.json(
            { status: "WRONG EVENT", message: `This pass is registered for event "${qrEventId}", not "${eventId}".` },
            { status: 400 }
          );
        }
        passCode = parts[2];
      }
    } else if (passCode.startsWith("EVTOS:")) {
      const parts = passCode.split(":");
      if (parts.length >= 3) {
        passCode = parts[2].startsWith("DYN-") || parts[2].startsWith("EVT-") ? parts[2] : `DYN-${parts[2]}`;
      }
    }

    // 1. Supabase Production Flow with RPC
    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        // Resolve event ID if slug passed
        let targetEventId = eventId;
        if (!eventId.includes("-") || eventId.startsWith("evt_")) {
          const { data: ev } = await adminClient
            .from("events")
            .select("id")
            .or(`id.eq.${eventId},slug.eq.${eventId}`)
            .single();
          if (ev) targetEventId = ev.id;
        }

        // Call PostgreSQL stored procedure with SELECT ... FOR UPDATE atomic lock
        const { data, error } = await adminClient.rpc("process_check_in_v2", {
          p_event_id: targetEventId,
          p_pass_code: passCode,
          p_gate_name: gateName,
          p_scanned_by: scannedBy || authResult.user?.id || null,
          p_device_id: body.deviceId || null,
          p_synced_from_offline: false,
        });

        if (error) {
          console.error("Supabase process_check_in RPC error:", error);
          return NextResponse.json(
            { status: "EVENT NOT ACTIVE", message: error.message },
            { status: 500 }
          );
        }

        const rpcResult = data as any;

        // Dispatch asynchronous non-blocking webhook if success
        if (rpcResult.status === "SUCCESS") {
          dispatchWebhookEvent("participant.checked_in", {
            event_id: targetEventId,
            gate: gateName,
            participant: rpcResult.participant,
            timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json(rpcResult);
      }
    }

    // 2. In-Memory Atomic Check-In
    const result = pilotStore.atomicCheckIn(
      eventId,
      passCode,
      gateName,
      scannedBy || `${authResult.user?.role} (${authResult.user?.id || "Staff"})`,
      body.deviceId,
      false
    );

    if (result.status === "SUCCESS") {
      dispatchWebhookEvent("participant.checked_in", {
        event_id: eventId,
        gate: gateName,
        participant: {
          id: result.participant?.id,
          name: result.participant?.name,
          pass_code: result.participant?.passId,
          college: result.participant?.college,
          tier: result.participant?.tier,
        },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        status: "SUCCESS",
        message: "Access granted.",
        participant: {
          id: result.participant?.id,
          name: result.participant?.name,
          email: result.participant?.email,
          pass_code: result.participant?.passId,
          college: result.participant?.college,
          tier: result.participant?.tier,
          check_in_time: result.checkInTime,
          check_in_gate: gateName,
        },
      });
    }

    if (result.status === "ALREADY CHECKED IN") {
      return NextResponse.json(
        {
          status: "ALREADY CHECKED IN",
          message: result.message,
          participant: {
            id: result.participant?.id,
            name: result.participant?.name,
            pass_code: result.participant?.passId,
            college: result.participant?.college,
            check_in_time: result.checkInTime || "Earlier today",
            check_in_gate: result.participant?.checkInGate || gateName,
          },
        },
        { status: 409 }
      );
    }

    if (result.status === "EVENT INACTIVE") {
      return NextResponse.json(
        { status: "EVENT INACTIVE", message: result.message },
        { status: 403 }
      );
    }

    if (result.status === "WRONG EVENT") {
      return NextResponse.json(
        { status: "WRONG EVENT", message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { status: result.status, message: result.message },
      { status: result.status === "PARTICIPANT NOT FOUND" ? 404 : 400 }
    );
  } catch (err: any) {
    console.error("Check-in API exception:", err);
    return NextResponse.json(
      { status: "INVALID QR", message: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
