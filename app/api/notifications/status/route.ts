import { NextRequest, NextResponse } from "next/server";
import { pilotStore } from "@/lib/data/pilotStore";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "evt_dynamite2026";

    // Multi-tenant authorization guard
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN", "VOLUNTEER"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // 1. Supabase stats if active
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        if (adminClient) {
          const { data: participants } = await adminClient
            .from("participants")
            .select("id, email, phone")
            .eq("event_id", eventId);

          const { data: logs } = await adminClient
            .from("notification_logs")
            .select("*")
            .eq("event_id", eventId)
            .order("created_at", { ascending: false });

          if (participants && logs) {
            const totalParticipants = participants.length;
            const emailSent = logs.filter((l) => l.notification_type === "EMAIL" && l.status === "SENT").length;
            const emailFailed = logs.filter((l) => l.notification_type === "EMAIL" && l.status === "FAILED").length;
            const emailPending = Math.max(0, totalParticipants - emailSent - emailFailed);

            const whatsappSent = logs.filter((l) => l.notification_type === "WHATSAPP" && l.status === "SENT").length;
            const whatsappFailed = logs.filter((l) => l.notification_type === "WHATSAPP" && l.status === "FAILED").length;
            const whatsappPending = Math.max(0, totalParticipants - whatsappSent - whatsappFailed);

            return NextResponse.json({
              success: true,
              totalParticipants,
              emailSent,
              emailPending,
              emailFailed,
              whatsappSent,
              whatsappPending,
              whatsappFailed,
              recentActivity: logs.slice(0, 25),
            });
          }
        }
      } catch (e) {
        console.warn("Supabase notification status query fallback:", e);
      }
    }

    // 2. High-performance In-Memory PilotStore stats
    const stats = pilotStore.getNotificationDeliveryStats(eventId);

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (err: any) {
    console.error("Notification status error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve notification status", details: err?.message },
      { status: 500 }
    );
  }
}
