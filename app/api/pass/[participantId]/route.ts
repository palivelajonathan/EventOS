import { NextRequest, NextResponse } from "next/server";
import { pilotStore } from "@/lib/data/pilotStore";
import { DYNAMITE_2026, MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const { participantId } = await params;
    if (!participantId) {
      return NextResponse.json({ error: "Participant ID required" }, { status: 400 });
    }

    const cleanId = decodeURIComponent(participantId).trim();
    let participant: any = null;
    let eventData: any = {
      id: "evt_dynamite2026",
      name: DYNAMITE_2026.name,
      slug: DYNAMITE_2026.slug,
      venue: DYNAMITE_2026.venue,
      city: DYNAMITE_2026.city,
      date: DYNAMITE_2026.date,
      time: "09:00 AM IST",
    };

    // 1. Check Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        if (adminClient) {
          const { data: dbPart } = await adminClient
            .from("participants")
            .select("*, events(*)")
            .or(`id.eq.${cleanId},pass_code.eq.${cleanId},external_registration_id.eq.${cleanId}`)
            .single();

          if (dbPart) {
            participant = {
              id: dbPart.id,
              passId: dbPart.pass_code,
              name: dbPart.name,
              email: dbPart.email,
              phone: dbPart.phone,
              college: dbPart.college,
              tier: dbPart.tier,
              rollNumber: dbPart.roll_number,
              qrPayload: `EVENTOS:${dbPart.event_id}:${dbPart.pass_code}:${(dbPart.sha256_hash || "").slice(0, 16)}`,
              sha256Hash: dbPart.sha256_hash,
              checkedIn: dbPart.checked_in,
              checkInTime: dbPart.check_in_time,
              checkInGate: dbPart.check_in_gate,
            };
            if (dbPart.events) {
              eventData = {
                id: dbPart.events.id,
                name: dbPart.events.name,
                slug: dbPart.events.slug,
                venue: dbPart.events.venue || DYNAMITE_2026.venue,
                city: DYNAMITE_2026.city,
                date: dbPart.events.start_date || DYNAMITE_2026.date,
                time: "09:00 AM IST",
              };
            }
          }
        }
      } catch (e) {
        console.warn("Supabase pass lookup exception:", e);
      }
    }

    // 2. Check PilotStore if not found in Supabase
    if (!participant) {
      const match = pilotStore.findParticipantGlobally(cleanId);
      if (match) {
        participant = match.participant;
        const ev = pilotStore.getEvent(match.eventId);
        if (ev) {
          eventData = {
            id: ev.id,
            name: ev.name,
            slug: ev.slug,
            venue: ev.venue_name || DYNAMITE_2026.venue,
            city: ev.city || DYNAMITE_2026.city,
            date: ev.date_start || DYNAMITE_2026.date,
            time: "09:00 AM IST",
          };
        }
      }
    }

    // 3. Fallback to DYNAMITE_2026 mock participants
    if (!participant) {
      const mockMatch = (MOCK_PARTICIPANTS as any[]).find(
        (p: any) =>
          p.id.toLowerCase() === cleanId.toLowerCase() ||
          p.passId.toLowerCase() === cleanId.toLowerCase() ||
          p.email.toLowerCase() === cleanId.toLowerCase()
      );
      if (mockMatch) {
        participant = mockMatch;
      }
    }

    if (!participant) {
      return NextResponse.json(
        {
          error: "Pass Not Found",
          message: `No active registration pass found for identifier: "${cleanId}". Please check your pass link or consult registration desk.`,
        },
        { status: 404 }
      );
    }

    // Generate high-contrast, error-tolerant QR Code Data URL (scannable from mobile, print, pdf)
    const qrText = participant.qrPayload || `EVENTOS:${eventData.id}:${participant.passId}:${(participant.sha256Hash || "").slice(0, 16)}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 480,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        passId: participant.passId,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        college: participant.college,
        tier: participant.tier,
        checkedIn: participant.checkedIn,
        checkInTime: participant.checkInTime,
        checkInGate: participant.checkInGate,
        qrPayload: qrText,
      },
      event: eventData,
      qrDataUrl,
    });
  } catch (err: any) {
    console.error("Pass retrieval exception:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err?.message },
      { status: 500 }
    );
  }
}
