import { NextRequest, NextResponse } from "next/server";
import { pilotStore } from "@/lib/data/pilotStore";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { notificationService, NotificationType } from "@/lib/notifications/notificationProvider";
import { DYNAMITE_2026 } from "@/lib/data/dynamite2026";

interface SendRequestPayload {
  eventId: string;
  action: "SEND_ALL" | "RETRY_FAILED" | "RESEND_SELECTED";
  channels?: NotificationType[];
  participantIds?: string[]; // for RESEND_SELECTED
  forceResend?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: SendRequestPayload = await req.json();
    const {
      eventId = "evt_dynamite2026",
      action = "SEND_ALL",
      channels = ["EMAIL", "WHATSAPP"],
      participantIds = [],
      forceResend = false,
    } = body;

    // Multi-tenant authorization guard
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const participants = pilotStore.getParticipants(eventId);
    if (participants.length === 0) {
      return NextResponse.json({
        success: true,
        dispatched: 0,
        message: "No participants registered for this event.",
      });
    }

    const eventRecord = pilotStore.getEvent(eventId) || {
      name: DYNAMITE_2026.name,
      venue: DYNAMITE_2026.venue,
      date: DYNAMITE_2026.date,
    };

    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://eventos.live";

    let targetParticipants = participants;

    if (action === "RESEND_SELECTED" && participantIds.length > 0) {
      const idSet = new Set(participantIds.map((id) => id.toLowerCase()));
      targetParticipants = participants.filter(
        (p) => idSet.has(p.id.toLowerCase()) || idSet.has(p.passId.toLowerCase())
      );
    } else if (action === "RETRY_FAILED") {
      targetParticipants = participants.filter(
        (p) => p.emailStatus === "FAILED" || p.whatsappStatus === "FAILED"
      );
    }

    let dispatchedCount = 0;
    const results: Array<{
      participantId: string;
      emailResult?: any;
      whatsAppResult?: any;
    }> = [];

    // Process delivery batches
    for (const p of targetParticipants) {
      const passUrl = p.passUrl || `${origin}/pass/${p.passId}`;
      const res = await notificationService.sendPassNotification(
        {
          eventId,
          participantId: p.passId,
          name: p.name,
          email: p.email,
          phone: p.phone,
          rawPhone: p.rawPhone,
          passUrl,
          eventName: eventRecord.name,
          venue: (eventRecord as any).venue || DYNAMITE_2026.venue,
          dateTime: (eventRecord as any).date || DYNAMITE_2026.date,
          tier: p.tier,
          college: p.college,
          qrPayload: p.qrPayload,
        },
        {
          channels,
          forceResend: action === "RESEND_SELECTED" ? true : forceResend,
        }
      );

      dispatchedCount++;
      results.push({
        participantId: p.passId,
        emailResult: res.emailResult,
        whatsAppResult: res.whatsAppResult,
      });
    }

    // Record audit log entry
    pilotStore.addAuditLog({
      id: `aud_del_${Date.now()}`,
      eventId,
      action: "STATUS_CHANGED",
      actor: `${authResult.user?.role} (${authResult.user?.id || "Admin"})`,
      target: `${dispatchedCount} Participants`,
      details: `Dispatched passes (${action}) to ${dispatchedCount} attendees across [${channels.join(", ")}].`,
      metadata: { action, channels, dispatchedCount },
      timestamp: new Date().toISOString(),
    });

    const updatedStats = pilotStore.getNotificationDeliveryStats(eventId);

    return NextResponse.json({
      success: true,
      action,
      dispatched: dispatchedCount,
      stats: updatedStats,
      results: results.slice(0, 50),
    });
  } catch (err: any) {
    console.error("Pass dispatch exception:", err);
    return NextResponse.json(
      { error: "Error during pass dispatch", details: err?.message },
      { status: 500 }
    );
  }
}
