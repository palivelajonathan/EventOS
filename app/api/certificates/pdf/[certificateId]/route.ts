import { NextRequest, NextResponse } from "next/server";
import { generateCertificatePdf } from "@/lib/services/certificatePdf";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { MOCK_PARTICIPANTS, DYNAMITE_2026 } from "@/lib/data/dynamite2026";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await params;
    const origin = req.nextUrl.origin || "http://localhost:3000";

    let participantName = "Aryan Varma";
    let eventName = "DYNAMITE 2026";
    let college = "CBIT Hyderabad";
    let credentialType = "HONORS";
    let issuedAt = new Date().toISOString();
    let sha256Hash = "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";

    // 1. Supabase Query if configured
    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: cert } = await adminClient
          .from("certificates")
          .select(`
            id,
            certificate_number,
            credential_type,
            sha256_hash,
            issued_at,
            event:events(name),
            participant:participants(name, college)
          `)
          .or(`certificate_number.eq.${certificateId},id.eq.${certificateId}`)
          .single();

        if (cert) {
          participantName = (cert.participant as any)?.name || participantName;
          college = (cert.participant as any)?.college || college;
          eventName = (cert.event as any)?.name || eventName;
          credentialType = cert.credential_type;
          issuedAt = cert.issued_at;
          sha256Hash = cert.sha256_hash;
        } else if (process.env.NODE_ENV === "production") {
          return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
        }
      }
    } else {
      if (process.env.NODE_ENV === "production" && process.env.EVENTOS_STRICT_CLOUD_ONLY === "true") {
        return NextResponse.json(
          { error: "Production Supabase database connection is not configured.", code: "DATABASE_UNAVAILABLE" },
          { status: 503 }
        );
      }
      // In demo mode, check mock participant
      const p = MOCK_PARTICIPANTS[0];
      if (p) {
        participantName = p.name;
        college = p.college;
        sha256Hash = p.sha256Hash;
      }
    }

    const verificationUrl = `${origin}/verify/${certificateId}`;

    const pdfBytes = await generateCertificatePdf({
      certificateId,
      participantName,
      eventName,
      college,
      credentialType,
      issuedAt,
      sha256Hash,
      verificationUrl,
      organizerName: "Dynamite Events Collective",
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="EventOS_Certificate_${certificateId}.pdf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    console.error("Certificate PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate certificate PDF", message: err?.message },
      { status: 500 }
    );
  }
}
