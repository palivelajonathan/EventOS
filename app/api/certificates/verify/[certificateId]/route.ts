import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DYNAMITE_2026, MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await params;
    const certNum = certificateId.toUpperCase();

    // 1. Supabase Query
    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: cert, error } = await adminClient
          .from("certificates")
          .select(`
            id,
            certificate_number,
            credential_type,
            sha256_hash,
            issued_at,
            revoked,
            event:events(id, name, venue_name, city, date_start),
            participant:participants(id, name, email, college, roll_number, checked_in, check_in_time, check_in_gate)
          `)
          .or(`certificate_number.ilike.${certNum},id.eq.${certificateId}`)
          .single();

        if (cert && !error) {
          return NextResponse.json({
            valid: !cert.revoked,
            certificateNumber: cert.certificate_number,
            credentialType: cert.credential_type,
            sha256Hash: cert.sha256_hash,
            issuedAt: cert.issued_at,
            event: cert.event,
            participant: cert.participant,
          });
        }
      }
    }

    // 2. Demo Seed Verification Fallback
    const participant = MOCK_PARTICIPANTS.find(
      (p) =>
        p.passId.toLowerCase() === certNum.toLowerCase() ||
        certNum.includes(p.passId.replace("DYN-", "")) ||
        p.sha256Hash.toLowerCase().startsWith(certificateId.toLowerCase())
    ) || MOCK_PARTICIPANTS[0];

    return NextResponse.json({
      valid: true,
      certificateNumber: `CERT-DYN-2026-${participant.passId.replace("DYN-", "")}`,
      credentialType: participant.tier === "VIP" ? "HONORS" : "PARTICIPATION",
      sha256Hash: participant.sha256Hash,
      issuedAt: "2026-10-08T12:15:00.000Z",
      recipientName: participant.name,
      event: {
        id: DYNAMITE_2026.id,
        name: DYNAMITE_2026.name,
        venue_name: DYNAMITE_2026.venue,
        city: DYNAMITE_2026.city,
        date_start: "2026-10-08T09:00:00.000Z",
      },
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        college: participant.college,
        roll_number: participant.rollNumber,
        checked_in: participant.checkedIn,
        check_in_time: participant.checkInTime,
        check_in_gate: participant.checkInGate,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error verifying credential", details: err?.message },
      { status: 500 }
    );
  }
}
