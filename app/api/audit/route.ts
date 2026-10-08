import { NextRequest, NextResponse } from "next/server";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { pilotStore } from "@/lib/data/pilotStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "evt_dynamite2026";

    // Only Organizers and Admins can view audit logs
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const logs = pilotStore.getAuditLogs(eventId);
    return NextResponse.json({
      eventId,
      logs,
      count: logs.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
