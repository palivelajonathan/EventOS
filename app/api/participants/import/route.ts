import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DYNAMITE_2026, Participant } from "@/lib/data/dynamite2026";
import { pilotStore } from "@/lib/data/pilotStore";
import { dispatchWebhookEvent } from "@/lib/services/webhooks";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { normalizePhoneE164 } from "@/lib/utils/phone";
import { notificationService } from "@/lib/notifications/notificationProvider";
import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CsvRowInput {
  name?: string;
  full_name?: string;
  fullName?: string;
  attendee_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  college?: string;
  institution?: string;
  rollNumber?: string;
  roll_number?: string;
  tier?: string;
  pass_tier?: string;
  external_registration_id?: string;
  externalRegistrationId?: string;
  reg_id?: string;
  rawRowNumber?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId = "evt_dynamite2026", rows, columnMapping } = body;

    let parsedRows = rows || body.participants || body.data;
    if (!parsedRows && typeof body.csvData === "string") {
      const lines = body.csvData.trim().split("\n");
      const headers = lines[0].split(",").map((h: string) => h.trim());
      parsedRows = lines.slice(1).map((line: string) => {
        const values = line.split(",").map((v: string) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          row[h] = values[idx] || "";
        });
        return row;
      });
    }

    // Apply columnMapping if provided
    if (parsedRows && Array.isArray(parsedRows) && columnMapping && typeof columnMapping === "object") {
      parsedRows = parsedRows.map((r: any) => {
        const mapped: Record<string, any> = { ...r };
        for (const [targetField, sourceCol] of Object.entries(columnMapping)) {
          if (r[sourceCol as string] !== undefined) {
            mapped[targetField] = r[sourceCol as string];
          }
        }
        return mapped;
      });
    }

    // 1. Multi-Tenant Authorization Guard (Organizer & Admin Only)
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    if (!parsedRows || !Array.isArray(parsedRows)) {
      return NextResponse.json(
        { error: "Invalid payload. Provide 'rows' array or 'csvData' string." },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let duplicate = 0;
    const errors: Array<{ row: number; email?: string; reason: string; data?: any }> = [];
    const validRecordsToInsert: any[] = [];
    const newBatch: Participant[] = [];
    const seenEmailsInBatch = new Set<string>();

    const adminClient = isSupabaseConfigured() ? createAdminClient() : null;
    let targetEventId = eventId;

    if (adminClient) {
      const { data: ev } = await adminClient
        .from("events")
        .select("id")
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .single();

      if (!ev) {
        return NextResponse.json(
          { error: `Invalid event: Event "${eventId}" does not exist in the system.` },
          { status: 404 }
        );
      }
      targetEventId = ev.id;
    }

    // Determine host origin for digital pass URLs
    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://eventos.live";

    // Track used pass IDs to ensure absolute uniqueness
    const usedPassCodes = new Set<string>();
    const existingParticipants = pilotStore.getParticipants(targetEventId);
    existingParticipants.forEach((p) => usedPassCodes.add(p.passId));

    // 1. Validate and prepare each row
    for (let i = 0; i < parsedRows.length; i++) {
      const rowNumber = parsedRows[i].rawRowNumber || i + 1;
      const row: CsvRowInput = parsedRows[i];
      const nameVal =
        row.name ||
        row.full_name ||
        row.fullName ||
        row.attendee_name ||
        (row as any)["Full Name"] ||
        (row as any)["Participant Name"] ||
        (row as any)["Name"];

      // Missing Name Check
      if (!nameVal || typeof nameVal !== "string" || !nameVal.trim()) {
        failed++;
        errors.push({
          row: rowNumber,
          reason: "Missing required field: Name / Full Name.",
          data: row,
        });
        continue;
      }

      const emailRaw =
        row.email ||
        (row as any)["Email"] ||
        (row as any)["Email Address"] ||
        (row as any)["Email ID"];

      // Missing Email Check
      if (!emailRaw || typeof emailRaw !== "string" || !emailRaw.trim()) {
        failed++;
        errors.push({
          row: rowNumber,
          reason: "Missing required field: Email / Email Address.",
          data: row,
        });
        continue;
      }

      const cleanEmail = emailRaw.trim().toLowerCase();

      // Malformed Email Check
      if (!EMAIL_REGEX.test(cleanEmail)) {
        failed++;
        errors.push({
          row: rowNumber,
          email: cleanEmail,
          reason: `Malformed email format: "${cleanEmail}".`,
          data: row,
        });
        continue;
      }

      // Intra-batch Duplicate Check
      if (seenEmailsInBatch.has(cleanEmail)) {
        duplicate++;
        skipped++;
        errors.push({
          row: rowNumber,
          email: cleanEmail,
          reason: `Duplicate attendee email within the uploaded file: "${cleanEmail}".`,
          data: row,
        });
        continue;
      }
      seenEmailsInBatch.add(cleanEmail);

      // Phone Normalization (E.164 standard +91XXXXXXXXXX while preserving rawPhone)
      const rawPhoneInput =
        row.phone ||
        row.mobile ||
        row.whatsapp ||
        (row as any)["Mobile"] ||
        (row as any)["WhatsApp Number"] ||
        (row as any)["Phone Number"] ||
        "";
      const phoneNorm = normalizePhoneE164(rawPhoneInput, "91");
      const normalizedPhone = phoneNorm.isValid ? phoneNorm.normalized : (rawPhoneInput || null);

      // College / Institution
      const collegeVal =
        row.college ||
        row.institution ||
        (row as any)["College"] ||
        (row as any)["Institution"] ||
        "Unspecified Institution";

      // Tier / Category
      const rawTier =
        row.tier ||
        row.pass_tier ||
        (row as any)["Tier"] ||
        (row as any)["Category"] ||
        (row as any)["Pass Type"] ||
        "STUDENT";
      const tierVal = rawTier.toUpperCase();

      // External Registration ID
      const extRegId =
        row.external_registration_id ||
        row.externalRegistrationId ||
        row.reg_id ||
        (row as any)["Registration ID"] ||
        (row as any)["Ticket ID"] ||
        (row as any)["Application ID"] ||
        null;

      // Unique EventOS Participant ID: e.g. DYN-82775
      let passCode = "";
      for (let attempt = 0; attempt < 100; attempt++) {
        const rand5 = Math.floor(10000 + Math.random() * 90000);
        const candidate = `DYN-${rand5}`;
        if (!usedPassCodes.has(candidate)) {
          passCode = candidate;
          usedPassCodes.add(candidate);
          break;
        }
      }
      if (!passCode) {
        passCode = `DYN-${Date.now().toString().slice(-5)}`;
      }

      // Zero-PII Cryptographic QR token
      const qrToken = crypto.randomBytes(8).toString("hex");
      const qrPayload = `EVENTOS:${targetEventId}:${passCode}:${qrToken}`;
      const sha256Hash = crypto
        .createHash("sha256")
        .update(`EVENTOS:${targetEventId}:${passCode}:${qrToken}:${Date.now()}`)
        .digest("hex");

      const passUrl = `${origin}/pass/${passCode}`;

      validRecordsToInsert.push({
        event_id: targetEventId,
        pass_code: passCode,
        name: nameVal.trim(),
        email: cleanEmail,
        phone: normalizedPhone,
        raw_phone: rawPhoneInput || null,
        college: collegeVal.trim(),
        tier: tierVal,
        roll_number: row.rollNumber?.trim() || row.roll_number?.trim() || extRegId,
        external_registration_id: extRegId,
        sha256_hash: sha256Hash,
        qr_payload: qrPayload,
        pass_url: passUrl,
        checked_in: false,
      });
    }

    let newlyImportedRecords: any[] = [];

    // 2. Insert into Supabase if configured
    if (adminClient && validRecordsToInsert.length > 0) {
      // Check existing emails in database
      const emailsToCheck = validRecordsToInsert.map((r) => r.email);
      const { data: existingRecords } = await adminClient
        .from("participants")
        .select("email")
        .eq("event_id", targetEventId)
        .in("email", emailsToCheck);

      const existingSet = new Set((existingRecords || []).map((e) => e.email.toLowerCase()));

      const finalInserts: any[] = [];
      validRecordsToInsert.forEach((rec, idx) => {
        if (existingSet.has(rec.email)) {
          duplicate++;
          skipped++;
          errors.push({
            row: idx + 1,
            email: rec.email,
            reason: `Attendee already registered in database: "${rec.email}".`,
            data: rec,
          });
        } else {
          finalInserts.push(rec);
        }
      });

      if (finalInserts.length > 0) {
        const { error: insertError } = await adminClient.from("participants").insert(finalInserts);
        if (insertError) {
          console.error("Batch insert error:", insertError);
          return NextResponse.json(
            { error: "Database error during participant ingestion", details: insertError.message },
            { status: 500 }
          );
        }
        imported = finalInserts.length;
        newlyImportedRecords = finalInserts;

        // Dispatch webhook
        dispatchWebhookEvent("participant.created", {
          event_id: targetEventId,
          count: imported,
          sample_pass: finalInserts[0]?.pass_code,
        });
      }
    } else {
      // Production mode safety check
      if (process.env.NODE_ENV === "production" && process.env.EVENTOS_STRICT_CLOUD_ONLY === "true") {
        return NextResponse.json(
          {
            error: "Database Connection Unavailable",
            message: "Production mode requires an active Supabase connection. Demo fallback is disabled in production.",
            code: "DATABASE_UNAVAILABLE",
          },
          { status: 503 }
        );
      }

      // High-performance In-Memory / Pilot Store Persistence
      const existingList = pilotStore.getParticipants(targetEventId);
      newBatch.length = 0;

      validRecordsToInsert.forEach((rec, idx) => {
        const alreadyExists = existingList.some(
          (p) => p.email.toLowerCase() === rec.email
        );
        if (alreadyExists) {
          duplicate++;
          skipped++;
          errors.push({
            row: idx + 1,
            email: rec.email,
            reason: `Attendee already registered: "${rec.email}".`,
            data: rec,
          });
        } else {
          imported++;
          const newParticipant: Participant = {
            id: `p_${Date.now()}_${idx}`,
            passId: rec.pass_code,
            name: rec.name,
            email: rec.email,
            phone: rec.phone || "",
            rawPhone: rec.raw_phone || undefined,
            college: rec.college,
            tier: rec.tier || "STUDENT",
            tierPrice: rec.tier === "VIP" ? 1499 : 499,
            rollNumber: rec.roll_number || "",
            externalRegistrationId: rec.external_registration_id || undefined,
            qrPayload: rec.qr_payload,
            sha256Hash: rec.sha256_hash,
            checkedIn: false,
            passUrl: rec.pass_url,
            emailStatus: "QUEUED",
            whatsappStatus: "QUEUED",
          };
          newBatch.push(newParticipant);
        }
      });

      if (newBatch.length > 0) {
        pilotStore.addParticipants(targetEventId, newBatch);
        newlyImportedRecords = newBatch;
      }

      if (imported > 0) {
        dispatchWebhookEvent("participant.created", {
          event_id: targetEventId,
          count: imported,
        });

        pilotStore.addAuditLog({
          id: `aud_imp_${Date.now()}`,
          eventId: targetEventId,
          action: "PARTICIPANT_IMPORTED",
          actor: `${authResult.user?.role} (${authResult.user?.id || "Admin"})`,
          target: `${imported} Attendees`,
          details: `Ingested ${imported} attendees (${duplicate} duplicates, ${failed} invalid/skipped).`,
          metadata: { imported, duplicate, failed, total: parsedRows.length },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 3. Trigger Asynchronous Non-Blocking Notification Job (Email & Official WhatsApp)
    if (newlyImportedRecords.length > 0) {
      const eventRecord = pilotStore.getEvent(targetEventId) || {
        name: DYNAMITE_2026.name,
        venue: DYNAMITE_2026.venue,
        date: DYNAMITE_2026.date,
      };

      // Asynchronous background delivery: NEVER blocks participant registration
      setTimeout(async () => {
        for (const attendee of newlyImportedRecords) {
          try {
            await notificationService.sendPassNotification({
              eventId: targetEventId,
              participantId: attendee.pass_code || attendee.passId,
              name: attendee.name,
              email: attendee.email,
              phone: attendee.phone,
              rawPhone: attendee.raw_phone || attendee.rawPhone,
              passUrl:
                attendee.pass_url ||
                attendee.passUrl ||
                `${origin}/pass/${attendee.pass_code || attendee.passId}`,
              eventName: eventRecord.name,
              venue: (eventRecord as any).venue || DYNAMITE_2026.venue,
              dateTime: (eventRecord as any).date || DYNAMITE_2026.date,
              tier: attendee.tier,
              college: attendee.college,
              qrPayload: attendee.qr_payload || attendee.qrPayload,
            });
          } catch (notifErr) {
            console.warn("Background pass delivery warning:", notifErr);
          }
        }
      }, 50);
    }

    return NextResponse.json({
      success: true,
      total: parsedRows.length,
      imported,
      duplicates: duplicate,
      invalid: failed,
      skipped,
      summary: {
        total: parsedRows.length,
        imported,
        duplicates: duplicate,
        invalid: failed,
        skipped,
      },
      sampleImported: (newBatch.length > 0 ? newBatch : validRecordsToInsert).slice(0, 10),
      errors: errors.slice(0, 100),
      failedRows: errors, // Exportable failure records
    });
  } catch (err: any) {
    console.error("Participant spreadsheet import exception:", err);
    return NextResponse.json(
      { error: "Internal error processing spreadsheet import", details: err?.message },
      { status: 500 }
    );
  }
}
