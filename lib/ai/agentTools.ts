/**
 * EventOS Server-Side Agent Tools & Knowledge Boundary
 * 
 * STRICT ARCHITECTURAL RULE:
 * The LLM must NEVER have direct SQL / database client access.
 * It interacts ONLY through these audited, event-scoped server-side tools.
 * 
 * Tool Separation:
 * - Structured Participant & Event State -> Database Tools (getParticipant, getCheckInStatus, resendParticipantPass)
 * - Unstructured Event Information -> RAG Document Layer (searchEventDocumentsRAG)
 */

import { pilotStore, EventDocument } from "@/lib/data/pilotStore";
import { DYNAMITE_2026, Participant } from "@/lib/data/dynamite2026";
import { notificationService } from "@/lib/notifications/notificationProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

// -----------------------------------------------------------------------------
// Tool 1: getEventInfo
// -----------------------------------------------------------------------------
export async function getEventInfo(eventId = "evt_dynamite2026") {
  const ev = pilotStore.getEvent(eventId);
  const participants = pilotStore.getParticipants(eventId);
  const checkedIn = participants.filter((p) => p.checkedIn).length;

  return {
    eventId,
    eventName: ev?.name || DYNAMITE_2026.name,
    tagline: ev?.tagline || DYNAMITE_2026.tagline,
    venue: ev?.venue_name || DYNAMITE_2026.venue,
    city: ev?.city || DYNAMITE_2026.city,
    date: ev?.date_start || DYNAMITE_2026.date,
    status: ev?.status || DYNAMITE_2026.status,
    totalRegistered: participants.length || DYNAMITE_2026.metrics.registered,
    totalCheckedIn: checkedIn || DYNAMITE_2026.metrics.checkedIn,
    capacity: ev?.capacity || DYNAMITE_2026.metrics.capacity,
  };
}

// -----------------------------------------------------------------------------
// Tool 2: getEventSchedule / getSchedule
// -----------------------------------------------------------------------------
export async function getEventSchedule(eventId = "evt_dynamite2026", track?: string) {
  let sessions = DYNAMITE_2026.sessions || [];
  if (track && track !== "ALL") {
    sessions = sessions.filter(
      (s) => s.track.toLowerCase() === track.toLowerCase()
    );
  }

  return {
    eventId,
    count: sessions.length,
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      track: s.track,
      stage: s.stage,
      timeSlot: s.timeSlot,
      startTime: s.startTime,
      endTime: s.endTime,
      speaker: {
        name: s.speaker.name,
        title: s.speaker.title,
        org: s.speaker.org,
      },
      isLiveNow: s.isLiveNow,
    })),
  };
}

// -----------------------------------------------------------------------------
// Tool 3: getParticipant
// -----------------------------------------------------------------------------
export async function getParticipant(query: string, eventId = "evt_dynamite2026") {
  if (!query || !query.trim()) {
    return { found: false, message: "Search query required." };
  }

  const clean = query.trim().toLowerCase();
  const participant = pilotStore.findParticipant(eventId, clean);

  if (!participant) {
    return {
      found: false,
      message: `No participant matching "${query}" was found for event ${eventId}.`,
    };
  }

  return {
    found: true,
    participantId: participant.passId,
    name: participant.name,
    email: participant.email,
    phone: participant.phone,
    college: participant.college,
    passType: participant.tier,
    checkedIn: participant.checkedIn,
    checkInTime: participant.checkInTime || null,
    checkInGate: participant.checkInGate || null,
    passUrl: participant.passUrl || `https://eventos.live/pass/${participant.passId}`,
  };
}

// -----------------------------------------------------------------------------
// Tool 4: getParticipantPass
// -----------------------------------------------------------------------------
export async function getParticipantPass(
  query: string,
  eventId = "evt_dynamite2026",
  origin = "https://eventos.live"
) {
  const p = await getParticipant(query, eventId);
  if (!p.found || !p.participantId) {
    return { found: false, message: p.message };
  }

  const passUrl = p.passUrl || `${origin}/pass/${p.participantId}`;
  return {
    found: true,
    participantId: p.participantId,
    name: p.name,
    passType: p.passType,
    passUrl,
    qrPayload: `EVENTOS:${eventId}:${p.participantId}:QR_SECURE`,
    instructions: "Open your pass URL to display your high-contrast holographic QR code to entrance turnstile scanners.",
  };
}

// -----------------------------------------------------------------------------
// Tool 5: resendParticipantPass
// -----------------------------------------------------------------------------
export async function resendParticipantPass(
  query: string,
  channel: "WHATSAPP" | "EMAIL" | "BOTH" = "BOTH",
  eventId = "evt_dynamite2026",
  origin = "https://eventos.live"
) {
  const participantRecord = pilotStore.findParticipant(eventId, query);
  if (!participantRecord) {
    return {
      success: false,
      message: `Cannot resend pass: Attendee "${query}" could not be identified. Please verify mobile or email.`,
    };
  }

  const channelsToUse =
    channel === "BOTH" ? ["EMAIL", "WHATSAPP"] : [channel];

  const passUrl =
    participantRecord.passUrl || `${origin}/pass/${participantRecord.passId}`;

  const ev = pilotStore.getEvent(eventId);

  const deliveryResult = await notificationService.sendPassNotification(
    {
      eventId,
      participantId: participantRecord.passId,
      name: participantRecord.name,
      email: participantRecord.email,
      phone: participantRecord.phone,
      rawPhone: participantRecord.rawPhone,
      passUrl,
      eventName: ev?.name || DYNAMITE_2026.name,
      venue: ev?.venue_name || DYNAMITE_2026.venue,
      dateTime: ev?.date_start || DYNAMITE_2026.date,
      tier: participantRecord.tier,
      college: participantRecord.college,
      qrPayload: participantRecord.qrPayload,
    },
    {
      channels: channelsToUse as any,
      forceResend: true,
    }
  );

  return {
    success: true,
    message: `Digital pass redelivered to ${participantRecord.name} via [${channelsToUse.join(", ")}].`,
    participantId: participantRecord.passId,
    passUrl,
    delivery: {
      emailStatus: deliveryResult.emailResult?.status || "SKIPPED",
      whatsappStatus: deliveryResult.whatsAppResult?.status || "SKIPPED",
    },
  };
}

// -----------------------------------------------------------------------------
// Tool 6: getCheckInStatus
// -----------------------------------------------------------------------------
export async function getCheckInStatus(query: string, eventId = "evt_dynamite2026") {
  const p = await getParticipant(query, eventId);
  if (!p.found) {
    return { found: false, message: p.message };
  }

  return {
    found: true,
    participantId: p.participantId,
    name: p.name,
    checkedIn: p.checkedIn,
    statusText: p.checkedIn ? "CHECKED_IN" : "NOT_CHECKED_IN",
    checkInTime: p.checkInTime,
    checkInGate: p.checkInGate,
    advice: p.checkedIn
      ? `Badge verified at ${p.checkInGate} (${p.checkInTime}). Access to Summit Concourse is active.`
      : "You have not checked in yet. Please show your QR pass at Gate 01 or your designated gate turnstile upon arrival.",
  };
}

// -----------------------------------------------------------------------------
// Tool 7: getVenueInfo
// -----------------------------------------------------------------------------
export async function getVenueInfo(eventId = "evt_dynamite2026") {
  const ev = pilotStore.getEvent(eventId);
  return {
    eventId,
    venueName: ev?.venue_name || DYNAMITE_2026.venue,
    city: ev?.city || DYNAMITE_2026.city,
    gates: [
      { name: "Gate 01", location: "Main Arena Ingress", access: "All attendees & delegates" },
      { name: "Gate 02", location: "North Turnstiles", access: "Technical Annex & Workshops" },
      { name: "Gate 03", location: "VIP & Speaker Desk", access: "Speakers, VIPs, Media" },
      { name: "Gate 04", location: "Express Turnstile", access: "Pre-verified Digital Pass holders" },
    ],
    parking: "West Parking Deck B is designated for summit attendees. Valet is available at Gate 03 East.",
    firstAid: "First Aid & Medical Station is located adjacent to Gate 01 East Concourse.",
    wifi: {
      ssid: "EventOS-FastNet",
      passcode: "event-mesh-2026",
      coverage: "Entire arena, stages, and hacker pavilion",
    },
  };
}

// -----------------------------------------------------------------------------
// Tool 8: getFAQ
// -----------------------------------------------------------------------------
export async function getFAQ(topic?: string, eventId = "evt_dynamite2026") {
  const docs = pilotStore.getEventDocuments(eventId).filter((d) => d.type === "FAQ");
  if (topic) {
    const cleanTopic = topic.toLowerCase();
    const matched = docs.filter((d) => (d.name + " " + d.content).toLowerCase().includes(cleanTopic));
    if (matched.length > 0) {
      return { faqs: matched.map((m) => ({ topic: m.name, answer: m.content })) };
    }
  }

  return {
    faqs: [
      {
        question: "Can I re-enter after checking in?",
        answer: "Yes, turnstiles record scan-out and scan-in for badges.",
      },
      {
        question: "How do I claim my participation certificate?",
        answer: "Digital certificates are verifiable at /verify/[id] after attendance is recorded.",
      },
      {
        question: "Where is food and lunch served?",
        answer: "Complimentary lunch is served in Pavilion 3 between 1:00 PM and 2:00 PM.",
      },
      {
        question: "What is the WiFi network and password?",
        answer: "SSID: EventOS-FastNet, Passcode: event-mesh-2026.",
      },
    ],
  };
}

// -----------------------------------------------------------------------------
// Tool 9: searchEventDocumentsRAG (Event Documents Knowledge)
// -----------------------------------------------------------------------------
export async function searchEventDocumentsRAG(query: string, eventId = "evt_dynamite2026") {
  // Query Supabase if active
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data, error } = await admin
          .from("event_documents")
          .select("id, document_name, document_type, content")
          .ilike("content", `%${query}%`)
          .limit(4);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            name: d.document_name,
            type: d.document_type,
            content: d.content,
          }));
        }
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  // In-Memory RAG Search
  const matches = pilotStore.searchDocuments(eventId, query);
  return matches.slice(0, 4).map((d) => ({
    name: d.name,
    type: d.type,
    content: d.content,
  }));
}
