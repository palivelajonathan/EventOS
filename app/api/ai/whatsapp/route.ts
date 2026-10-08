import { NextRequest, NextResponse } from "next/server";
import {
  getEventInfo,
  getEventSchedule,
  getParticipant,
  getParticipantPass,
  resendParticipantPass,
  getCheckInStatus,
  getVenueInfo,
  getFAQ,
  searchEventDocumentsRAG,
} from "@/lib/ai/agentTools";
import { activeLLMProvider } from "@/lib/ai/llmProvider";
import { pilotStore } from "@/lib/data/pilotStore";

/**
 * WhatsApp Conversational Agent
 * POST /api/ai/whatsapp
 * 
 * STRICT ARCHITECTURE:
 * WhatsApp message -> Intent Analysis -> Controlled Server Tool -> Real Data -> Conversational Response
 * - Never grants LLM direct DB access.
 * - Clear separation: Database Tools for participant/event state vs RAG for event documents.
 */

export async function GET(req: NextRequest) {
  // Support Meta WhatsApp Webhook Verification handshake
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Meta handshake validation:
  // 1. hub.mode must be "subscribe"
  // 2. hub.verify_token must match process.env.WHATSAPP_VERIFY_TOKEN
  // 3. hub.challenge must be provided
  if (
    mode === "subscribe" &&
    token &&
    expectedToken &&
    token.trim() === expectedToken.trim() &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  // If verification fails or parameters are invalid, return HTTP 403 Forbidden
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }

    // Extract message and sender across Meta, Twilio, or standard API formats
    let messageText = "";
    let senderPhone = "";
    let eventId = body.eventId || "evt_dynamite2026";

    // Meta WhatsApp Cloud API Webhook structure
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      messageText = msgObj.text?.body || "";
      senderPhone = msgObj.from ? `+${msgObj.from.replace(/[^\d]/g, "")}` : "";
    }
    // Twilio Webhook structure
    else if (body.Body || body.From) {
      messageText = body.Body || "";
      senderPhone = body.From?.replace("whatsapp:", "") || "";
    }
    // Direct JSON API format
    else {
      messageText = body.message || body.body || body.query || body.text || "";
      senderPhone = body.from || body.phone || body.mobile || "";
    }

    if (!messageText || typeof messageText !== "string") {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing WhatsApp message content." },
        { status: 400 }
      );
    }

    const cleanMsg = messageText.trim();
    const lowerMsg = cleanMsg.toLowerCase();

    // -------------------------------------------------------------------------
    // Intent Classification & Tool Execution
    // -------------------------------------------------------------------------
    let intent = "GENERAL_QUERY";
    let toolUsed = "none";
    let toolResult: any = null;
    let dataSource: "DATABASE_TOOL" | "EVENT_DOCUMENT_RAG" | "SYSTEM" = "SYSTEM";
    let conversationalReply = "";

    // 1. Intent: Pass Not Received / Resend Pass
    if (
      lowerMsg.includes("didn't receive") ||
      lowerMsg.includes("did not receive") ||
      lowerMsg.includes("no qr") ||
      lowerMsg.includes("where is my qr") ||
      lowerMsg.includes("resend") ||
      lowerMsg.includes("lost my pass") ||
      lowerMsg.includes("haven't got my qr") ||
      lowerMsg.includes("send pass") ||
      lowerMsg.includes("get my pass")
    ) {
      intent = "RESEND_PASS";
      toolUsed = "resendParticipantPass";
      dataSource = "DATABASE_TOOL";

      // Identify participant by sender's phone or search tokens in message
      const queryTarget = senderPhone || cleanMsg;
      const passInfo = await getParticipantPass(queryTarget, eventId);

      if (passInfo.found) {
        const resendOutcome = await resendParticipantPass(passInfo.participantId!, "BOTH", eventId);
        toolResult = { passInfo, resendOutcome };

        conversationalReply = `Hello ${passInfo.name} 👋\n\nYour digital entry pass has been identified and resent!\n\n🎟️ Participant ID: ${passInfo.participantId}\n✨ Pass Tier: ${passInfo.passType}\n🔗 Pass URL: ${passInfo.passUrl}\n\nPlease click your pass link to display your dynamic holographic QR code at turnstiles. Keep it ready for entrance!`;
      } else {
        conversationalReply = `Hello 👋\n\nI couldn't locate a verified registration matching your number (${senderPhone || "provided"}).\n\nPlease reply with your registered *Email Address* or *Registration ID* (e.g. REG-DYN-1001), and I'll immediately fetch your digital pass.`;
      }
    }

    // 2. Intent: Check-In Status (Strict DB tool, NOT RAG)
    else if (
      lowerMsg.includes("have i checked in") ||
      lowerMsg.includes("check in status") ||
      lowerMsg.includes("am i checked in") ||
      lowerMsg.includes("already checked in") ||
      lowerMsg.includes("check-in status") ||
      lowerMsg.includes("did i check in")
    ) {
      intent = "CHECK_IN_STATUS";
      toolUsed = "getCheckInStatus";
      dataSource = "DATABASE_TOOL";

      const queryTarget = senderPhone || cleanMsg;
      const statusRes = await getCheckInStatus(queryTarget, eventId);
      toolResult = statusRes;

      if (statusRes.found) {
        if (statusRes.checkedIn) {
          conversationalReply = `Hello ${statusRes.name} 👋\n\n✅ You are officially checked in!\n• Gate: ${statusRes.checkInGate || "Gate 01"}\n• Time: ${statusRes.checkInTime || "Today"}\n• Status: Active inside Summit Concourse. Enjoy the event!`;
        } else {
          conversationalReply = `Hello ${statusRes.name} 👋\n\nℹ️ You have not checked in yet.\nYour badge is ready for ingress. Please present your digital QR pass at Gate 01 or your designated gate turnstile upon arrival.`;
        }
      } else {
        conversationalReply = `Hello 👋\n\nI couldn't resolve your registration to check attendance status. Please provide your registered *Email Address* or *Participant ID* (e.g. DYN-82775).`;
      }
    }

    // 3. Intent: Participant Details / Ticket Tier
    else if (
      lowerMsg.includes("my registration") ||
      lowerMsg.includes("my ticket") ||
      lowerMsg.includes("my pass") ||
      lowerMsg.includes("who am i registered as") ||
      lowerMsg.includes("what tier")
    ) {
      intent = "GET_PARTICIPANT";
      toolUsed = "getParticipant";
      dataSource = "DATABASE_TOOL";

      const queryTarget = senderPhone || cleanMsg;
      const partRes = await getParticipant(queryTarget, eventId);
      toolResult = partRes;

      if (partRes.found) {
        conversationalReply = `Hello ${partRes.name} 👋\n\nHere are your registration details:\n• Participant ID: ${partRes.participantId}\n• Tier: ${partRes.passType}\n• Institution: ${partRes.college}\n• Status: ${partRes.checkedIn ? "Checked In" : "Confirmed & Active"}\n• Pass Link: ${partRes.passUrl}`;
      } else {
        conversationalReply = `Hello 👋\n\nPlease share your registered email or full name so I can locate your participant details.`;
      }
    }

    // 4. Intent: Schedule & Agenda
    else if (
      lowerMsg.includes("schedule") ||
      lowerMsg.includes("agenda") ||
      lowerMsg.includes("timeline") ||
      lowerMsg.includes("what time") ||
      lowerMsg.includes("when does") ||
      lowerMsg.includes("sessions")
    ) {
      intent = "GET_SCHEDULE";
      toolUsed = "getEventSchedule";
      dataSource = "DATABASE_TOOL";

      const scheduleRes = await getEventSchedule(eventId);
      toolResult = scheduleRes;

      conversationalReply = `📅 *DYNAMITE 2026 Schedule Highlights*:\n\n• 10:00 AM: Keynote by Dr. Vikram Seth (Autonomous Multi-Agent Swarms) - Main Arena\n• 11:30 AM: Deep-Dive Workshops - Arena B\n• 01:00 PM: Lunch & Networking - Pavilion 3\n• 02:00 PM: 24-Hour Hackathon Finals - Stage A\n• 06:30 PM: Grand Award & Minting Ceremony - Main Arena`;
    }

    // 5. Intent: Rules, Laptop Policy, Equipment, Speakers, Sponsors, Terms (Event Documents RAG)
    else if (
      lowerMsg.includes("laptop") ||
      lowerMsg.includes("equipment") ||
      lowerMsg.includes("bring") ||
      lowerMsg.includes("charger") ||
      lowerMsg.includes("bag") ||
      lowerMsg.includes("speaker") ||
      lowerMsg.includes("keynote") ||
      lowerMsg.includes("sponsor") ||
      lowerMsg.includes("rule") ||
      lowerMsg.includes("guideline") ||
      lowerMsg.includes("conduct") ||
      lowerMsg.includes("food") ||
      lowerMsg.includes("lunch")
    ) {
      intent = "EVENT_DOCUMENT_RAG";
      toolUsed = "searchEventDocumentsRAG";
      dataSource = "EVENT_DOCUMENT_RAG";

      const ragDocs = await searchEventDocumentsRAG(cleanMsg, eventId);
      toolResult = ragDocs;

      if (ragDocs.length > 0) {
        const primaryDoc = ragDocs[0];
        conversationalReply = `ℹ️ *${primaryDoc.name}*:\n\n${primaryDoc.content}\n\n_Feel free to ask if you have any more questions about the event!_`;
      } else {
        conversationalReply = `I couldn't locate specific guidelines regarding that in the event documentation. Please consult the helpdesk at Gate 01 upon arrival.`;
      }
    }

    // 6. Intent: Venue, Gates, Directions, Parking
    else if (
      lowerMsg.includes("venue") ||
      lowerMsg.includes("where is") ||
      lowerMsg.includes("location") ||
      lowerMsg.includes("gate") ||
      lowerMsg.includes("parking") ||
      lowerMsg.includes("address") ||
      lowerMsg.includes("how to get to")
    ) {
      intent = "GET_VENUE_INFO";
      toolUsed = "getVenueInfo";
      dataSource = "DATABASE_TOOL";

      const venueRes = await getVenueInfo(eventId);
      toolResult = venueRes;

      conversationalReply = `📍 *Venue & Entrance Guide*:\n\n• Location: ${venueRes.venueName}, ${venueRes.city}\n• Parking: ${venueRes.parking}\n• Gates:\n  - Gate 01: Main Arena Ingress\n  - Gate 02: Technical Annex & Workshops\n  - Gate 03: VIP & Speaker Entrance\n  - Gate 04: Express Digital Pass Ingress\n• WiFi: SSID "${venueRes.wifi.ssid}" (Password: "${venueRes.wifi.passcode}")`;
    }

    // 7. Fallback: Search all event documents in RAG, then Overview
    else {
      intent = "EVENT_DOCUMENT_RAG";
      toolUsed = "searchEventDocumentsRAG";
      dataSource = "EVENT_DOCUMENT_RAG";

      const ragDocs = await searchEventDocumentsRAG(cleanMsg, eventId);
      toolResult = ragDocs;

      if (ragDocs.length > 0) {
        const primaryDoc = ragDocs[0];
        conversationalReply = `ℹ️ *${primaryDoc.name}*:\n\n${primaryDoc.content}\n\n_Feel free to ask if you have any more questions about the event!_`;
      } else {
        const eventInfo = await getEventInfo(eventId);
        conversationalReply = `Hello 👋\n\nWelcome to *${eventInfo.eventName}*!\n${eventInfo.tagline}\n\nVenue: ${eventInfo.venue}, ${eventInfo.city}\nDate: ${eventInfo.date}\n\nYou can ask me:\n• "Send my pass / QR code"\n• "Have I checked in?"\n• "Can I bring a laptop?"\n• "Who is the keynote speaker?"\n• "Where is parking?"`;
      }
    }

    // -------------------------------------------------------------------------
    // Optional LLM Polish with Groq (if GROQ_API_KEY is configured)
    // -------------------------------------------------------------------------
    if (activeLLMProvider.isConfigured() && toolResult) {
      try {
        const prompt = `You are the official EventOS WhatsApp concierge for the summit DYNAMITE 2026.
Participant message: "${cleanMsg}"
Sender mobile: "${senderPhone || "unknown"}"
Tool executed: ${toolUsed} (Source: ${dataSource})
Ground Truth Tool Result: ${JSON.stringify(toolResult)}

Instructions:
- Write a warm, concise WhatsApp response (under 120 words).
- Use WhatsApp markdown (*bold*, _italic_, bullet points).
- NEVER hallucinate facts outside the Ground Truth Tool Result.
- If it's a pass resend, include the pass URL clearly.
- If it's a check-in question, state the status accurately.`;

        const llmResult = await activeLLMProvider.generateChat({
          messages: [
            {
              role: "system",
              content:
                "You are the official EventOS WhatsApp concierge. Adhere strictly to the Ground Truth Tool Result provided. Never invent details.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          maxTokens: 300,
        });

        if (llmResult && llmResult.text) {
          conversationalReply = llmResult.text.trim();
        }
      } catch (aiErr) {
        // Graceful fallback to deterministic response
        console.warn("Groq polishing non-fatal exception, using deterministic reply:", aiErr);
      }
    }

    // -------------------------------------------------------------------------
    // Audit Logging
    // -------------------------------------------------------------------------
    pilotStore.addAuditLog({
      id: `aud_wa_${Date.now()}`,
      eventId,
      action: "SEARCH",
      actor: `WhatsApp Bot (${senderPhone || "Guest"})`,
      target: intent,
      details: `Inbound WhatsApp: "${cleanMsg.substring(0, 60)}" -> Tool: ${toolUsed} (${dataSource})`,
      metadata: { intent, toolUsed, dataSource, senderPhone },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      sender: senderPhone,
      messageReceived: cleanMsg,
      intent,
      toolUsed,
      dataSource,
      reply: conversationalReply,
      toolResult,
    });
  } catch (err: any) {
    console.error("WhatsApp AI Agent route exception:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err?.message },
      { status: 500 }
    );
  }
}
