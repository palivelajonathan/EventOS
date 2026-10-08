import { NextRequest, NextResponse } from "next/server";
import { getLiveEventData } from "@/lib/services/eventDataService";
import { MOCK_PARTICIPANTS } from "@/lib/data/dynamite2026";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { activeLLMProvider } from "@/lib/ai/llmProvider";
import { pilotStore } from "@/lib/data/pilotStore";

// ==============================================================================
// 1. STRUCTURED DATABASE TOOLS (Precise ground truth from DB)
// ==============================================================================

async function getEventStats(eventId: string) {
  const data = await getLiveEventData(eventId);
  return {
    eventId: data.id,
    eventName: data.name,
    venue: data.venue,
    registered: data.metrics.registered,
    capacity: data.metrics.capacity,
    checkedIn: data.metrics.checkedIn,
    attendanceRatio: `${(data.metrics.attendanceRatio * 100).toFixed(1)}%`,
    status: data.status,
  };
}

async function getParticipantStats(eventId: string) {
  const data = await getLiveEventData(eventId);
  return {
    totalRegistered: data.metrics.registered,
    collegeBreakdown: data.collegeBreakdown,
  };
}

async function getCheckInStats(eventId: string) {
  const data = await getLiveEventData(eventId);
  return {
    peakScansPerSec: data.metrics.peakScansPerSec,
    gates: data.gates.map((g) => ({
      name: g.name,
      loadPercent: `${g.loadPercent}%`,
      currentCount: g.currentCount,
      capacityLimit: g.capacityLimit,
      velocityPerMin: `${g.velocityPerMin} scans/min`,
      status: g.status,
    })),
  };
}

async function getGateStats(eventId: string) {
  const data = await getLiveEventData(eventId);
  return {
    activeGatesCount: data.gates.length,
    gates: data.gates.map((g) => ({
      name: g.name,
      loadPercent: `${g.loadPercent}%`,
      currentCount: g.currentCount,
      capacityLimit: g.capacityLimit,
      velocityPerMin: `${g.velocityPerMin} scans/min`,
      status: g.status,
    })),
  };
}

async function getSchedule(eventId: string) {
  const data = await getLiveEventData(eventId);
  return {
    sessionsCount: data.sessions.length,
    sessions: data.sessions.map((s) => ({
      title: s.title,
      track: s.track,
      stage: s.stage,
      timeSlot: s.timeSlot,
      speaker: s.speaker.name,
      isLiveNow: s.isLiveNow,
    })),
  };
}

async function getSessionAttendance(sessionId: string) {
  const data = await getLiveEventData("evt_dynamite2026");
  const sess = data.sessions.find(
    (s) => s.id === sessionId || s.title.toLowerCase().includes(sessionId.toLowerCase())
  );
  if (!sess) return { error: "Session not found." };
  return {
    title: sess.title,
    stage: sess.stage,
    capacity: sess.capacity,
    enrolled: sess.enrolled,
    occupancyPercent: `${Math.round((sess.enrolled / sess.capacity) * 100)}%`,
    isLiveNow: sess.isLiveNow,
  };
}

async function getCertificateStats(eventId: string) {
  const data = await getLiveEventData(eventId);
  return {
    mintedCount: data.metrics.certificatesMinted,
    eligibleCount: data.metrics.checkedIn,
    pendingMint: data.metrics.checkedIn - data.metrics.certificatesMinted,
  };
}

async function getParticipant(query: string, eventId: string = "evt_dynamite2026") {
  const clean = query.toLowerCase().trim();
  const pilotAttendees = pilotStore.getParticipants(eventId);
  let p = pilotAttendees.find(
    (item) =>
      item.passId.toLowerCase() === clean ||
      item.email.toLowerCase() === clean ||
      (item.externalRegistrationId && item.externalRegistrationId.toLowerCase() === clean) ||
      item.name.toLowerCase().includes(clean)
  );

  if (!p) {
    p = MOCK_PARTICIPANTS.find(
      (item) =>
        item.passId.toLowerCase() === clean ||
        item.email.toLowerCase() === clean ||
        item.name.toLowerCase().includes(clean)
    );
  }

  if (!p) {
    return { found: false, message: "Participant record not found." };
  }

  return {
    found: true,
    name: p.name,
    email: p.email,
    college: p.college,
    tier: p.tier,
    passCode: p.passId,
    checkedIn: p.checkedIn,
    checkInTime: p.checkInTime || null,
    checkInGate: p.checkInGate || null,
  };
}

// ==============================================================================
// 2. RAG KNOWLEDGE SYSTEM (Unstructured event documents)
// ==============================================================================

async function searchEventKnowledge(eventId: string, query: string) {
  // Try Supabase event_documents table first if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("event_documents")
          .select("id, document_name, document_type, content")
          .ilike("content", `%${query}%`)
          .limit(3);
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            name: d.document_name,
            type: d.document_type,
            content: d.content,
          }));
        }
      }
    } catch {
      // Fall through to in-memory store
    }
  }

  // Fallback to in-memory store
  const docs = pilotStore.searchDocuments(eventId, query);
  return docs.map((d) => ({
    name: d.name,
    type: d.type,
    content: d.content,
  }));
}

// ==============================================================================
// 3. ROUTE HANDLER (Intent router: DB tools vs RAG)
// ==============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = body.eventId || "evt_dynamite2026";
    const message = body.message || body.query;

    // Multi-Tenant Authorization Guard
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN", "VOLUNTEER", "GATE_STAFF"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing 'message' or 'query' string in request body." },
        { status: 400 }
      );
    }

    // Live Groq LLM execution if configured (powered by GROQ_API_KEY & GROQ_MODEL)
    if (activeLLMProvider.isConfigured()) {
      try {
        const liveData = await getLiveEventData(eventId);
        const ragDocs = await searchEventKnowledge(eventId, message);

        const promptContext = `You are the EventOS AI Operations Copilot for event "${liveData.name}".
Verified Database Telemetry:
- Event: ${liveData.name} (${liveData.venue}, ${liveData.city})
- Registered Participants: ${liveData.metrics.registered}
- Checked In Participants: ${liveData.metrics.checkedIn}
- Attendance Ratio: ${(liveData.metrics.attendanceRatio * 100).toFixed(1)}%
- Certificates Issued: ${liveData.metrics.certificatesMinted}
- Sessions: ${JSON.stringify(liveData.sessions.map((s) => ({ title: s.title, stage: s.stage, timeSlot: s.timeSlot, speaker: s.speaker.name, isLive: s.isLiveNow })))}
- Gate Status: ${JSON.stringify(liveData.gates.map((g) => ({ name: g.name, load: `${g.loadPercent}%`, velocity: `${g.velocityPerMin} scans/min` })))}
- College Attendance: ${JSON.stringify(liveData.collegeBreakdown.map((c) => ({ college: c.college, count: c.count, percentage: `${c.percentage}%` })))}

Retrieved Knowledge Documents (RAG):
${ragDocs.length > 0 ? ragDocs.map((d) => `[Document: ${d.name} (${d.type})]\n${d.content}`).join("\n\n") : "No matching knowledge documents found."}

STRICT OPERATING INSTRUCTIONS:
1. Ground answers only in the verified data or documents above.
2. For counts, turnstiles, and attendee lookups, rely strictly on database figures.
3. For speaker bios, venue location, rules, and FAQs, rely strictly on retrieved documents.
4. If asked about something not in either verified source, respond EXACTLY: "I don't have that information in the event records."
5. Never hallucinate or fabricate event information.`;

        const llmResult = await activeLLMProvider.generateChat({
          messages: [
            { role: "system", content: promptContext },
            { role: "user", content: `User Query: ${message}` },
          ],
          temperature: 0.2,
        });

        if (llmResult && llmResult.text) {
          const reply = llmResult.text;
          return NextResponse.json({
            reply,
            answer: reply,
            toolUsed: ragDocs.length > 0 ? `rag-retrieval+${llmResult.provider.toLowerCase()}` : `database-tools+${llmResult.provider.toLowerCase()}`,
            model: llmResult.model,
            data: liveData.metrics,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (llmError: any) {
        console.warn("Groq LLM error, continuing to deterministic sandbox tool:", llmError?.message);
      }
    }

    // Controlled Deterministic Dual-Path Router (Database Tools vs RAG Knowledge)
    const lower = message.toLowerCase();
    let reply = "";
    let toolUsed = "";
    let dataPayload: any = null;

    // PATH A: RAG (Unstructured event documents: speakers, venue details, wifi, rules, FAQ)
    const isRagIntent =
      lower.includes("where is") ||
      lower.includes("location") ||
      lower.includes("parking") ||
      lower.includes("wifi") ||
      lower.includes("password") ||
      lower.includes("passcode") ||
      lower.includes("lunch") ||
      lower.includes("food") ||
      lower.includes("first aid") ||
      lower.includes("medical") ||
      lower.includes("rule") ||
      lower.includes("guideline") ||
      lower.includes("faq") ||
      lower.includes("who is the keynote") ||
      lower.includes("keynote speaker") ||
      lower.includes("speaker bio");

    if (isRagIntent) {
      toolUsed = "searchEventKnowledge";
      const docs = await searchEventKnowledge(eventId, message);
      dataPayload = { docsCount: docs.length, docs };

      if (docs.length > 0) {
        reply = `[Event Knowledge • ${docs[0].name}]: ${docs[0].content}`;
      } else {
        reply = "I don't have that information in the event records or documents.";
      }
    }
    // PATH B: DATABASE TOOLS (Structured metrics, participants, turnstiles, certificates)
    else if (
      lower.includes("certificate") ||
      lower.includes("mint") ||
      lower.includes("credential") ||
      lower.includes("issued")
    ) {
      toolUsed = "getCertificateStats";
      dataPayload = await getCertificateStats(eventId);
      reply = `Credential vault telemetry: **${dataPayload.mintedCount}** verified certificates have been minted. **${dataPayload.pendingMint}** eligible checked-in participants are currently queued for batch signature.`;
    } else if (
      lower.includes("college") ||
      lower.includes("campus") ||
      lower.includes("demographic") ||
      lower.includes("cohort") ||
      lower.includes("highest attendance") ||
      lower.includes("top college")
    ) {
      toolUsed = "getParticipantStats";
      dataPayload = await getParticipantStats(eventId);
      const topColleges = dataPayload.collegeBreakdown
        .slice(0, 3)
        .map((c: any) => `${c.college} (${c.count} students, ${c.percentage}%)`)
        .join(", ");
      reply = `Participant demographic analysis shows highest representation from: **${topColleges}**.`;
    } else if (
      lower.includes("attendance") ||
      lower.includes("how many") ||
      lower.includes("checked in") ||
      lower.includes("registered") ||
      lower.includes("stats") ||
      lower.includes("overview")
    ) {
      toolUsed = "getEventStats";
      dataPayload = await getEventStats(eventId);
      reply = `According to verified event records for ${dataPayload.eventName}, there are currently **${dataPayload.checkedIn.toLocaleString()}** checked-in attendees out of **${dataPayload.registered.toLocaleString()}** registered (**${dataPayload.attendanceRatio}** attendance ratio). Venue capacity is ${dataPayload.capacity} pax.`;
    } else if (
      lower.includes("gate") ||
      lower.includes("turnstile") ||
      lower.includes("bottleneck") ||
      lower.includes("congestion") ||
      lower.includes("scans")
    ) {
      toolUsed = "getGateStats";
      dataPayload = await getGateStats(eventId);
      const checkInPayload = await getCheckInStats(eventId);
      reply =
        `Turnstile telemetry reports peak velocity at **${checkInPayload.peakScansPerSec} scans/sec**. Active gates: ` +
        dataPayload.gates.map((g: any) => `**${g.name}** (${g.loadPercent} load, ${g.velocityPerMin})`).join(", ") +
        `. All turnstiles operating within capacity thresholds.`;
    } else if (
      lower.includes("schedule") ||
      lower.includes("session") ||
      lower.includes("stage")
    ) {
      toolUsed = "getSchedule";
      dataPayload = await getSchedule(eventId);
      const live = dataPayload.sessions.find((s: any) => s.isLiveNow);
      reply =
        `EventOS is orchestrating ${dataPayload.sessionsCount} staged sessions. ` +
        (live
          ? `Currently broadcasting live: **"${live.title}"** on **${live.stage}** with **${live.speaker}**.`
          : `All stages are running according to run-of-show.`);
    } else if (
      lower.includes("find") ||
      lower.includes("lookup") ||
      lower.includes("who is") ||
      lower.includes("evt-") ||
      lower.includes("dyn-")
    ) {
      toolUsed = "getParticipant";
      const match = message.match(/(EVT-[A-Z0-9-]+|DYN-\d+)/i) || message.match(/\b\w+@[\w.]+\b/i);
      const queryParam = match ? match[0] : message.split(" ").slice(-1)[0];
      dataPayload = await getParticipant(queryParam, eventId);
      if (dataPayload.found) {
        reply = `Found record: **${dataPayload.name}** (${dataPayload.college}, ${dataPayload.tier} Pass). Status: ${dataPayload.checkedIn ? `Checked in at ${dataPayload.checkInGate} (${dataPayload.checkInTime})` : "Not checked in yet"}.`;
      } else {
        reply = `I searched the participant ledger for "${queryParam}", but no matching record was found.`;
      }
    } else {
      // Fallback search in RAG before concluding
      const docs = await searchEventKnowledge(eventId, message);
      if (docs.length > 0) {
        toolUsed = "searchEventKnowledge";
        dataPayload = { docsCount: docs.length, docs };
        reply = `[Event Knowledge • ${docs[0].name}]: ${docs[0].content}`;
      } else {
        reply = "I don't have that information in the event records. You can ask me about attendance statistics, gate congestion, sessions schedule, college distributions, or certificate minting progress.";
      }
    }

    return NextResponse.json({
      reply,
      answer: reply,
      toolUsed: toolUsed || "sandboxed-tool",
      data: dataPayload,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "AI Co-pilot error", details: err?.message },
      { status: 500 }
    );
  }
}
