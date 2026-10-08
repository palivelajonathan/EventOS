import { NextRequest, NextResponse } from "next/server";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { pilotStore } from "@/lib/data/pilotStore";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, scans } = body;

    if (!eventId || !Array.isArray(scans)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing eventId or scans array." },
        { status: 400 }
      );
    }

    // 1. Authorization Guard
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN", "GATE_STAFF", "VOLUNTEER"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    let syncedCount = 0;
    let conflictCount = 0;
    const results: Array<{ scanId: string; status: string; message: string }> = [];

    // Sort scans by client timestamp to preserve true arrival order
    const sortedScans = [...scans].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const scan of sortedScans) {
      let passToken = scan.participantToken.trim();

      // Parse EVENTOS payload if present: EVENTOS:<event_id>:<pass_id>:<hash>
      if (passToken.startsWith("EVENTOS:")) {
        const parts = passToken.split(":");
        if (parts.length >= 3) {
          passToken = parts[2];
        }
      }

      // Check Supabase if configured
      if (isSupabaseConfigured()) {
        const adminClient = createAdminClient();
        if (adminClient) {
          const { data, error } = await adminClient.rpc("process_check_in_v2", {
            p_event_id: eventId,
            p_pass_code: passToken,
            p_gate_name: scan.gate || "Gate 01 • Main Arena",
            p_scanned_by: authResult.user?.id || null,
            p_device_id: scan.deviceId || null,
            p_synced_from_offline: true,
          });

          if (!error && data?.status === "SUCCESS") {
            syncedCount++;
            results.push({ scanId: scan.scanId, status: "SYNCED", message: "Admitted." });
          } else {
            conflictCount++;
            results.push({
              scanId: scan.scanId,
              status: "CONFLICT",
              message: data?.message || error?.message || "Already admitted or invalid.",
            });
          }
          continue;
        }
      }

      // In-Memory Pilot Store Flow
      const checkInResult = pilotStore.atomicCheckIn(
        eventId,
        passToken,
        scan.gate || "Gate 01 • Main Arena",
        scan.staff || authResult.user?.role || "GATE_STAFF",
        scan.deviceId,
        true // synced from offline
      );

      if (checkInResult.status === "SUCCESS") {
        syncedCount++;
        results.push({ scanId: scan.scanId, status: "SYNCED", message: "Admitted." });
      } else {
        conflictCount++;
        results.push({
          scanId: scan.scanId,
          status: "CONFLICT",
          message: checkInResult.message,
        });
      }
    }

    // Log batch reconciliation
    pilotStore.addAuditLog({
      id: `aud_sync_${Date.now()}`,
      eventId,
      action: "OFFLINE_SYNC",
      actor: `${authResult.user?.role} (${authResult.user?.id || "Staff"})`,
      target: `${scans.length} Scans`,
      details: `Reconciled offline scan queue: ${syncedCount} admitted, ${conflictCount} conflicts.`,
      metadata: { syncedCount, conflictCount, totalScans: scans.length },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      syncedCount,
      conflictCount,
      totalProcessed: scans.length,
      summary: {
        synced: syncedCount,
        conflicts: conflictCount,
        total: scans.length,
      },
      results,
      message: `Offline queue reconciled: ${syncedCount} admitted, ${conflictCount} conflicts/duplicates.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
