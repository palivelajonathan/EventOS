/**
 * EVENTOS INTELLIGENCE LAYER INTEGRATION TEST
 * Tests Universal Registration Webhook/API and WhatsApp AI Concierge with controlled tools & RAG
 */

import { normalizePhoneE164 } from "../lib/utils/phone";
import { pilotStore } from "../lib/data/pilotStore";
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
} from "../lib/ai/agentTools";
import { activeLLMProvider } from "../lib/ai/llmProvider";
import crypto from "crypto";

console.log("================================================================================");
console.log("EVENTOS — INTELLIGENCE LAYER INTEGRATION TESTS");
console.log("================================================================================\n");

async function runTests() {
  const eventId = "evt_dynamite2026";
  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      testsPassed++;
      console.log(`  ✔ [PASS] ${testName}`);
    } else {
      console.error(`  ✖ [FAIL] ${testName}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Universal Registration API Simulation
  // ---------------------------------------------------------------------------
  console.log("▶ [1/4] TESTING REGISTRATION PIPELINE & NOTIFICATION EMISSION...");

  const testPayload = {
    eventId,
    name: "Jonathan Test",
    email: "jonathan.test@summit2026.live",
    phone: "9849019999",
    college: "Hyderabad Institute of Tech",
    registrationId: "REG-JON-2026",
    passType: "Hacker",
  };

  // E.164 normalization check
  const phoneNorm = normalizePhoneE164(testPayload.phone, "91");
  assert(phoneNorm.isValid && phoneNorm.normalized === "+919849019999", "E.164 phone normalization produces +919849019999");

  // Generate ID and QR
  const randDigits = Math.floor(10000 + Math.random() * 90000);
  const passCode = `DYN-${randDigits}`;
  const qrToken = crypto.randomBytes(8).toString("hex");
  const qrPayload = `EVENTOS:${eventId}:${passCode}:${qrToken}`;
  const passUrl = `https://eventos.live/pass/${passCode}`;

  pilotStore.addParticipants(eventId, [
    {
      id: `p_test_${Date.now()}`,
      passId: passCode,
      name: testPayload.name,
      email: testPayload.email,
      phone: phoneNorm.normalized,
      rawPhone: testPayload.phone,
      college: testPayload.college,
      tier: "HACKER",
      tierPrice: 499,
      externalRegistrationId: testPayload.registrationId,
      qrPayload,
      sha256Hash: crypto.createHash("sha256").update(qrPayload).digest("hex"),
      checkedIn: false,
      passUrl,
      emailStatus: "QUEUED",
      whatsappStatus: "QUEUED",
    },
  ]);

  const foundReg = pilotStore.findParticipant(eventId, testPayload.email);
  assert(!!foundReg && foundReg.passId === passCode, "Participant persisted and retrievable via email");
  assert(foundReg?.phone === "+919849019999", "Normalized phone stored on participant record");
  assert(Boolean(foundReg?.qrPayload.startsWith("EVENTOS:evt_dynamite2026:DYN-")), "Zero-PII QR code properly structured");

  // ---------------------------------------------------------------------------
  // 2. Server-Side Tools Verification (No direct DB access by LLM)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [2/4] TESTING CONTROLLED SERVER-SIDE AGENT TOOLS...");

  // Tool: getEventInfo
  const evInfo = await getEventInfo(eventId);
  assert(evInfo.eventName === "DYNAMITE 2026" && evInfo.venue.includes("Begumpet"), "getEventInfo returns event metadata");

  // Tool: getEventSchedule
  const schedule = await getEventSchedule(eventId);
  assert(schedule.count > 0 && schedule.sessions.some((s) => s.speaker.name.includes("Vikram Seth")), "getEventSchedule returns sessions and keynote");

  // Tool: getParticipant
  const partInfo = await getParticipant(testPayload.email, eventId);
  assert(partInfo.found && partInfo.name === "Jonathan Test", "getParticipant identifies attendee by email");

  // Tool: getParticipantPass
  const passInfo = await getParticipantPass("+919849019999", eventId);
  assert(Boolean(passInfo.found && passInfo.passUrl && passInfo.passUrl.includes(passCode)), "getParticipantPass returns valid pass URL");

  // Tool: resendParticipantPass
  const resendResult = await resendParticipantPass("+919849019999", "BOTH", eventId);
  assert(Boolean(resendResult.success && resendResult.delivery && resendResult.delivery.emailStatus === "SENT"), "resendParticipantPass dispatches pass via Email and WhatsApp");

  // Tool: getCheckInStatus (Not checked in yet)
  const initialCheckInStatus = await getCheckInStatus(passCode, eventId);
  assert(initialCheckInStatus.found && initialCheckInStatus.checkedIn === false, "getCheckInStatus accurately reports unadmitted state");

  // Tool: getVenueInfo
  const venueInfo = await getVenueInfo(eventId);
  assert(venueInfo.gates.length >= 4 && venueInfo.wifi.ssid === "EventOS-FastNet", "getVenueInfo returns ingress gates and WiFi SSID");

  // Tool: getFAQ
  const faq = await getFAQ("wifi", eventId);
  assert(faq.faqs.length > 0, "getFAQ returns matching event FAQs");

  // ---------------------------------------------------------------------------
  // 3. Turnstile Admission & Check-In Status Tool Update
  // ---------------------------------------------------------------------------
  console.log("\n▶ [3/4] SIMULATING CHECK-IN & TESTING CHECK-IN TOOL STATE CHANGE...");
  const checkInRes = pilotStore.atomicCheckIn(
    eventId,
    passCode,
    "Gate 01 • Main Arena",
    "Turnstile Volunteer",
    "Tablet-01",
    false
  );
  assert(checkInRes.status === "SUCCESS", "Turnstile scan succeeds for Jonathan Test");

  const postCheckInStatus = await getCheckInStatus("+919849019999", eventId);
  assert(Boolean(postCheckInStatus.checkedIn === true && postCheckInStatus.checkInGate?.includes("Gate 01")), "getCheckInStatus dynamically reflects live check-in at Gate 01");

  // Duplicate Check-In Rejection
  const dupeCheckIn = pilotStore.atomicCheckIn(
    eventId,
    passCode,
    "Gate 01 • Main Arena",
    "Turnstile Volunteer",
    "Tablet-01",
    false
  );
  assert(dupeCheckIn.status === "ALREADY CHECKED IN", "Duplicate turnstile scan rejected");

  // ---------------------------------------------------------------------------
  // 4. RAG Document Layer (Strict Separation: Laptops, Rules, Speakers)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [4/4] TESTING EVENT DOCUMENTS RAG LAYER...");

  // Query 1: Laptop Policy -> RAG
  const laptopDocs = await searchEventDocumentsRAG("laptop guidelines equipment", eventId);
  assert(
    laptopDocs.length > 0 && laptopDocs[0].content.toLowerCase().includes("laptops"),
    "RAG: 'Can I bring a laptop?' matches Equipment Policy & Laptop Guidelines"
  );

  // Query 2: Keynote Speaker -> RAG
  const speakerDocs = await searchEventDocumentsRAG("keynote speaker Vikram Seth", eventId);
  assert(
    speakerDocs.length > 0 && speakerDocs[0].content.includes("Dr. Vikram Seth"),
    "RAG: 'Who is the keynote speaker?' matches Speaker Profiles directory"
  );

  // Query 3: Sponsors -> RAG
  const sponsorDocs = await searchEventDocumentsRAG("sponsors partners", eventId);
  assert(
    sponsorDocs.length > 0 && sponsorDocs[0].content.includes("NeuralScale"),
    "RAG: 'Who are the sponsors?' matches Ecosystem Sponsors document"
  );

  // ---------------------------------------------------------------------------
  // 5. Groq LLM Provider Abstraction Verification
  // ---------------------------------------------------------------------------
  console.log("\n▶ [5/5] TESTING GROQ LLM PROVIDER ABSTRACTION...");
  assert(activeLLMProvider.name === "GROQ", "Active LLM Provider is set to GROQ");
  assert(
    activeLLMProvider.getModelName() === (process.env.GROQ_MODEL || "llama-3.3-70b-versatile"),
    `Configured Groq model is '${activeLLMProvider.getModelName()}'`
  );
  if (!process.env.GROQ_API_KEY) {
    const fallbackRes = await activeLLMProvider.generateChat({
      messages: [{ role: "user", content: "Ping" }],
    });
    assert(fallbackRes === null, "Unconfigured GROQ_API_KEY returns null for deterministic fallback");
  } else {
    assert(activeLLMProvider.isConfigured() === true, "GROQ_API_KEY detected and provider is active");
  }

  console.log("\n================================================================================");
  console.log(`INTELLIGENCE LAYER RESULTS: ${testsPassed}/${totalTests} TESTS PASSED`);
  console.log(`ALL CRITERIA SATISFIED: ${testsPassed === totalTests ? "YES" : "NO"}`);
  console.log("================================================================================\n");

  if (testsPassed !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
