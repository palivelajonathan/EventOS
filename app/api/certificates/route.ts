import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "evt_dynamite2026";

    // Multi-tenant authorization guard
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        let targetEventId = eventId;
        if (!eventId.includes("-") || eventId.startsWith("evt_")) {
          const { data: ev } = await adminClient
            .from("events")
            .select("id")
            .or(`id.eq.${eventId},slug.eq.${eventId}`)
            .single();
          if (ev) targetEventId = ev.id;
        }

        const { data: certs, error } = await adminClient
          .from("certificates")
          .select(`
            id,
            certificate_number,
            credential_type,
            sha256_hash,
            issued_at,
            revoked,
            participant:participants(id, name, college, pass_code)
          `)
          .eq("event_id", targetEventId)
          .order("issued_at", { ascending: false });

        if (!error && certs) {
          const formatted = certs.map((c: any) => ({
            id: c.id,
            certNumber: c.certificate_number,
            participantId: c.participant?.id || "unknown",
            name: c.participant?.name || "Participant",
            college: c.participant?.college || "Unspecified",
            type: c.credential_type,
            sha256Hash: c.sha256_hash,
            issuedAt: new Date(c.issued_at).toLocaleString(),
            verifiedCount: 1,
            revoked: c.revoked,
          }));

          return NextResponse.json({
            certificates: formatted,
            total: formatted.length,
          });
        }
      }
    }

    // Fail loud only in strict cloud-only mode
    if (process.env.NODE_ENV === "production" && process.env.EVENTOS_STRICT_CLOUD_ONLY === "true") {
      return NextResponse.json(
        {
          error: "Database Connection Unavailable",
          message: "Production mode requires an active Supabase connection. Demo certificates disabled in production.",
          code: "DATABASE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    // Demo store fallback for Dynamite 2026
    const demoCerts = MOCK_PARTICIPANTS.filter((p) => p.checkedIn).map((p, idx) => ({
      id: `cert_0${idx + 1}`,
      certNumber: `CERT-DYN-2026-${p.passId.replace("DYN-", "")}`,
      participantId: p.id,
      name: p.name,
      college: p.college,
      type: idx === 0 ? "HONORS" : idx === 2 ? "HACKATHON_WINNER" : "PARTICIPATION",
      sha256Hash: p.sha256Hash,
      issuedAt: "Oct 8, 2026 12:15 PM",
      verifiedCount: 12 + idx * 4,
    }));

    return NextResponse.json({
      certificates: demoCerts,
      total: demoCerts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch certificates", details: err?.message },
      { status: 500 }
    );
  }
}
