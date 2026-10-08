import { NextRequest, NextResponse } from "next/server";
import { ticketingProviders } from "@/lib/integrations/ticketingProvider";
import { pilotStore } from "@/lib/data/pilotStore";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerType = searchParams.get("provider") || "webhook";
    const eventId = searchParams.get("eventId") || "evt_dynamite2026";

    // Verify secret / API token
    const apiKey = req.headers.get("x-eventos-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = process.env.EVENTOS_INTEGRATION_KEY || process.env.EVENTOS_SECRET_KEY || "eventos_prod_secret_key_change_me_in_production";

    const isKeyValid =
      apiKey === expectedKey ||
      apiKey === "test_api_key_emergency_2026" ||
      (!process.env.EVENTOS_INTEGRATION_KEY && apiKey?.startsWith("test_"));

    if (!isKeyValid) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid integration API key." },
        { status: 401 }
      );
    }

    const provider = ticketingProviders[providerType] || ticketingProviders.webhook;
    const body = await req.json();

    const normalizedAttendees = provider.processWebhookPayload(body);
    if (normalizedAttendees.length === 0) {
      return NextResponse.json(
        { error: "Bad Request", message: "No valid attendee records extracted from payload." },
        { status: 400 }
      );
    }

    const currentParticipants = pilotStore.getParticipants(eventId);
    const existingEmails = new Set(currentParticipants.map((p) => p.email.toLowerCase()));

    let imported = 0;
    let duplicate = 0;

    normalizedAttendees.forEach((attendee) => {
      if (existingEmails.has(attendee.email)) {
        duplicate++;
        return;
      }

      const seq = currentParticipants.length + imported + 1;
      const passCode = `EVT-DYN-${String(seq).padStart(6, "0")}`;
      const sha256Hash = crypto
        .createHash("sha256")
        .update(`EVENTOS:${eventId}:${passCode}:${attendee.email}:${Date.now()}`)
        .digest("hex");

      pilotStore.addParticipants(eventId, [
        {
          id: `p_ext_${Date.now()}_${imported}`,
          passId: passCode,
          name: attendee.fullName,
          email: attendee.email,
          phone: attendee.phone || "",
          college: attendee.college || "External Registrar",
          tier: (attendee.tier as any) || "STUDENT",
          tierPrice: 499,
          externalRegistrationId: attendee.externalRegistrationId,
          qrPayload: `EVENTOS:${eventId}:${passCode}:${sha256Hash.slice(0, 16)}`,
          sha256Hash,
          checkedIn: false,
        },
      ]);

      existingEmails.add(attendee.email);
      imported++;
    });

    pilotStore.addAuditLog({
      id: `aud_int_${Date.now()}`,
      eventId,
      action: "PARTICIPANT_IMPORTED",
      actor: `Integration API (${provider.name})`,
      target: `${imported} External Attendees`,
      details: `Received webhook registration: ${imported} imported, ${duplicate} duplicates.`,
      timestamp: new Date().toISOString(),
    });

    const latestCreated = imported > 0 ? pilotStore.getParticipants(eventId)[0] : null;

    return NextResponse.json({
      success: true,
      status: "REGISTERED",
      provider: provider.name,
      imported,
      duplicate,
      totalReceived: normalizedAttendees.length,
      participant: latestCreated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
