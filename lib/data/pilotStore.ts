import { DYNAMITE_2026, MOCK_PARTICIPANTS, Participant, EventData } from "./dynamite2026";

export interface StoredOrganization {
  id: string;
  name: string;
  slug: string;
  owner_id?: string | null;
  billing_tier: string;
  created_at: string;
}

export interface StoredEvent {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  primary_color?: string;
  venue_name?: string;
  city?: string;
  date_start: string;
  date_end?: string | null;
  capacity: number;
  status: "ACTIVE" | "DEACTIVATED" | "DRAFT" | "CONCLUDED" | string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  eventId: string;
  action: "CHECK_IN" | "CHECK_IN_REVERSED" | "STATUS_CHANGED" | "GATE_ASSIGNED" | "STAFF_INVITED" | "PARTICIPANT_IMPORTED" | "BRANDING_UPDATED" | "OFFLINE_SYNC" | "LOGIN" | "SEARCH";
  actor: string;
  target?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface EventDocument {
  id: string;
  eventId: string;
  name: string;
  type: "BROCHURE" | "SCHEDULE" | "SPEAKER" | "VENUE" | "FAQ" | "RULES" | "SPONSORS" | "TERMS" | string;
  content: string;
  createdAt: string;
}

export interface StoredNotification {
  id: string;
  eventId: string;
  participantId: string;
  type: "EMAIL" | "WHATSAPP";
  idempotencyKey: string;
  recipient: string;
  status: "QUEUED" | "SENT" | "FAILED";
  provider: string;
  templateId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  sentAt?: string;
}

// Global In-Memory Pilot Store (Shared singleton across Next.js server routes)
const globalStore = globalThis as unknown as {
  __eventos_organizations?: Map<string, StoredOrganization>;
  __eventos_events?: Map<string, StoredEvent>;
  __eventos_participants?: Map<string, Participant[]>;
  __eventos_audit_logs?: Map<string, AuditLogEntry[]>;
  __eventos_documents?: Map<string, EventDocument[]>;
  __eventos_notifications?: Map<string, StoredNotification[]>;
};

if (!globalStore.__eventos_notifications) {
  globalStore.__eventos_notifications = new Map<string, StoredNotification[]>();
}

if (!globalStore.__eventos_organizations) {
  globalStore.__eventos_organizations = new Map<string, StoredOrganization>();
  // Pre-seed default organization
  globalStore.__eventos_organizations.set("org_dynamite_default", {
    id: "org_dynamite_default",
    name: "Dynamite Events Collective",
    slug: "dynamite-collective",
    billing_tier: "PRO",
    created_at: new Date().toISOString(),
  });
}

if (!globalStore.__eventos_events) {
  globalStore.__eventos_events = new Map<string, StoredEvent>();
  // Pre-seed default event
  globalStore.__eventos_events.set("evt_dynamite2026", {
    id: "evt_dynamite2026",
    org_id: "org_dynamite_default",
    name: DYNAMITE_2026.name,
    slug: DYNAMITE_2026.slug,
    tagline: DYNAMITE_2026.tagline,
    description: "Flagship Autonomous Systems & AI Summit for 1,500 students and builders.",
    logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
    cover_image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    primary_color: "#8083ff",
    venue_name: DYNAMITE_2026.venue,
    city: DYNAMITE_2026.city,
    date_start: "2026-10-15T09:00:00Z",
    capacity: DYNAMITE_2026.metrics.capacity,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  });
}

if (!globalStore.__eventos_participants) {
  globalStore.__eventos_participants = new Map<string, Participant[]>();
  // Pre-seed default participants
  globalStore.__eventos_participants.set("evt_dynamite2026", [...MOCK_PARTICIPANTS]);
}

if (!globalStore.__eventos_audit_logs) {
  globalStore.__eventos_audit_logs = new Map<string, AuditLogEntry[]>();
  // Pre-seed sample audit logs
  globalStore.__eventos_audit_logs.set("evt_dynamite2026", [
    {
      id: "aud_01",
      eventId: "evt_dynamite2026",
      action: "STATUS_CHANGED",
      actor: "Organizer (System)",
      details: "Event marked ACTIVE for live turnstile admissions",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "aud_02",
      eventId: "evt_dynamite2026",
      action: "GATE_ASSIGNED",
      actor: "Lead Coordinator",
      details: "Gate 01 and Gate 02 assigned to North Concourse turnstiles",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);
}

if (!globalStore.__eventos_documents) {
  globalStore.__eventos_documents = new Map<string, EventDocument[]>();
  globalStore.__eventos_documents.set("evt_dynamite2026", [
    {
      id: "doc_01",
      eventId: "evt_dynamite2026",
      name: "Summit Agenda & Keynote Run of Show",
      type: "SCHEDULE",
      content: "Main Arena Keynote commences at 10:00 AM IST. Keynote Speaker is Dr. Vikram Seth, VP of Systems Architecture at NeuralScale, speaking on Autonomous Multi-Agent Swarms. Technical workshops in Arena B start at 11:30 AM. Stage A hosts the 24-Hour Hackathon finals starting at 2:00 PM. Award ceremony is at 6:30 PM.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_02",
      eventId: "evt_dynamite2026",
      name: "Venue Ingress & Turnstile Guide",
      type: "VENUE",
      content: "Begumpet Exhibition Concourse has 4 primary ingress checkpoints: Gate 01 (Main Arena Ingress), Gate 02 (Technical Annex & Workshops), Gate 03 (VIP, Speakers & Media), and Gate 04 (Express Ingress for pre-verified badges). West Parking Deck B is reserved for attendees.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_03",
      eventId: "evt_dynamite2026",
      name: "Logistics, WiFi & Safety Guidelines",
      type: "RULES",
      content: "High-speed mesh WiFi is available throughout the arena. SSID: EventOS-FastNet, Passcode: event-mesh-2026. Official physical or holographic digital QR passes must be presented at turnstiles. Digital certificates will be issued to verified checked-in attendees. Lunch will be served in Pavilion 3 from 1:00 PM to 2:00 PM.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_04",
      eventId: "evt_dynamite2026",
      name: "Frequently Asked Questions (FAQ)",
      type: "FAQ",
      content: "Q: Can I re-enter after checking in? A: Yes, scan out/scan in is logged at turnstiles. Q: How do I claim my participation certificate? A: Certificates are automatically verifiable at /verify/[id] once attendance is recorded. Q: Where is medical assistance located? A: First Aid Station is adjacent to Gate 01 East.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_05",
      eventId: "evt_dynamite2026",
      name: "Official Event Brochure & Summit Overview",
      type: "BROCHURE",
      content: "DYNAMITE 2026 is South Asia's flagship autonomous systems and agentic computing summit held at Begumpet Exhibition Concourse, Hyderabad. Featuring 1,500+ attendees, 4 stages, a 24-hour hackathon, and over 40 technical workshops. Theme: 'From Automation to Autonomy'.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_06",
      eventId: "evt_dynamite2026",
      name: "Speaker Profiles & Keynote Directory",
      type: "SPEAKER",
      content: "Keynote: Dr. Vikram Seth (VP Systems Architecture, NeuralScale) - Autonomous Agent Swarms at Scale. Track 2: Anya Sharma (Chief AI Architect, FastNet Labs) - Sub-millisecond Neural Inference on Edge. Track 3: Rajesh Varma (Founding Partner, CyberVentures) - Zero-Knowledge Identity for Physical Events. All speaker bios and Q&A slots are detailed in the official guide.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_07",
      eventId: "evt_dynamite2026",
      name: "Equipment Policy & Laptop Guidelines",
      type: "RULES",
      content: "Laptop & Equipment Policy: Yes, all attendees, hackathon builders, and delegates are strongly encouraged to bring laptops, chargers, and development hardware. Dedicated high-density charging strips and 10 Gbps Ethernet drop-points are situated throughout Hall 02, Arena B, and Hacker Annex. Prohibited items: Outside hazardous materials, laser pointers, and unapproved commercial drones.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_08",
      eventId: "evt_dynamite2026",
      name: "Official Partners & Ecosystem Sponsors",
      type: "SPONSORS",
      content: "Title Partner: NeuralScale. Networking Infrastructure: FastNet Mesh Systems. Cloud Compute Partner: Vertex Grid. Venture Partners: CyberVentures, Hyderabad Tech Angels. All attendees can claim sponsor credits and API grants at the sponsor pavilion in Pavilion 2.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc_09",
      eventId: "evt_dynamite2026",
      name: "Attendee Terms, Code of Conduct & Check-In Instructions",
      type: "TERMS",
      content: "All participants must display their official EventOS holographic digital pass or badge at all times. Gates open at 08:30 AM IST. Turnstiles require scanning your dynamic QR code. Check-in is valid for single admission per gate zone. Code of conduct enforces mutual respect, safe environment, and zero tolerance for harassment.",
      createdAt: new Date().toISOString(),
    },
  ]);
}

export const pilotStore = {
  // Organizations
  getOrganization(id: string): StoredOrganization | undefined {
    return globalStore.__eventos_organizations?.get(id);
  },
  saveOrganization(org: StoredOrganization): void {
    globalStore.__eventos_organizations?.set(org.id, org);
  },
  listOrganizations(userOrgId?: string): StoredOrganization[] {
    const all = Array.from(globalStore.__eventos_organizations?.values() || []);
    if (!userOrgId) return all;
    return all.filter((o) => o.id === userOrgId);
  },

  // Events
  getEvent(idOrSlug: string): StoredEvent | undefined {
    const events = Array.from(globalStore.__eventos_events?.values() || []);
    return events.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
  },
  saveEvent(event: StoredEvent): void {
    globalStore.__eventos_events?.set(event.id, event);
  },
  updateEvent(eventId: string, updates: Partial<StoredEvent>): boolean {
    const ev = globalStore.__eventos_events?.get(eventId);
    if (!ev) return false;
    globalStore.__eventos_events?.set(eventId, { ...ev, ...updates });
    return true;
  },
  listEvents(orgId?: string): StoredEvent[] {
    const all = Array.from(globalStore.__eventos_events?.values() || []);
    if (!orgId) return all;
    return all.filter((e) => e.org_id === orgId);
  },

  // Participants
  getParticipants(eventId: string): Participant[] {
    return globalStore.__eventos_participants?.get(eventId) || [];
  },
  addParticipants(eventId: string, newParticipants: Participant[]): void {
    const current = globalStore.__eventos_participants?.get(eventId) || [];
    globalStore.__eventos_participants?.set(eventId, [...newParticipants, ...current]);
  },
  findParticipant(eventId: string, identifier: string): Participant | undefined {
    const list = globalStore.__eventos_participants?.get(eventId) || [];
    const clean = identifier.trim().toLowerCase();
    return list.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.passId.toLowerCase() === clean ||
        p.qrPayload.toLowerCase() === clean ||
        p.sha256Hash.toLowerCase() === clean ||
        (p.externalRegistrationId && p.externalRegistrationId.toLowerCase() === clean) ||
        p.email.toLowerCase() === clean ||
        p.phone.toLowerCase() === clean ||
        (p.rawPhone && p.rawPhone.toLowerCase() === clean) ||
        p.name.toLowerCase() === clean
    );
  },
  findParticipantGlobally(identifier: string): { participant: Participant; eventId: string } | undefined {
    const clean = identifier.trim().toLowerCase();
    if (!globalStore.__eventos_participants) return undefined;
    for (const [evtId, list] of globalStore.__eventos_participants.entries()) {
      const match = list.find(
        (p) =>
          p.id.toLowerCase() === clean ||
          p.passId.toLowerCase() === clean ||
          p.qrPayload.toLowerCase() === clean ||
          p.sha256Hash.toLowerCase() === clean ||
          (p.externalRegistrationId && p.externalRegistrationId.toLowerCase() === clean) ||
          p.email.toLowerCase() === clean ||
          p.phone.toLowerCase() === clean ||
          (p.rawPhone && p.rawPhone.toLowerCase() === clean) ||
          p.name.toLowerCase() === clean
      );
      if (match) return { participant: match, eventId: evtId };
    }
    return undefined;
  },
  searchParticipants(eventId: string, query: string): Participant[] {
    const list = globalStore.__eventos_participants?.get(eventId) || [];
    if (!query || !query.trim()) return list;
    const clean = query.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(clean) ||
        p.email.toLowerCase().includes(clean) ||
        p.phone.includes(clean) ||
        p.passId.toLowerCase().includes(clean) ||
        p.college.toLowerCase().includes(clean) ||
        (p.externalRegistrationId && p.externalRegistrationId.toLowerCase().includes(clean))
    );
  },
  updateParticipant(eventId: string, passId: string, updates: Partial<Participant>): boolean {
    const list = globalStore.__eventos_participants?.get(eventId) || [];
    const idx = list.findIndex((p) => p.passId === passId);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    globalStore.__eventos_participants?.set(eventId, list);
    return true;
  },

  // Atomic Check-In with Concurrency Lock & Status Verification
  atomicCheckIn(
    eventId: string,
    identifier: string,
    gateName: string = "Gate 01 • Main Arena",
    staffName: string = "GATE_STAFF",
    deviceId?: string,
    syncedFromOffline: boolean = false
  ): {
    status: "SUCCESS" | "ALREADY CHECKED IN" | "PARTICIPANT NOT FOUND" | "EVENT INACTIVE" | "WRONG EVENT" | "INVALID QR";
    message: string;
    participant?: Participant;
    checkInTime?: string;
  } {
    const event = this.getEvent(eventId);
    if (!event) {
      return { status: "WRONG EVENT", message: "Event record does not exist." };
    }
    if (event.status === "DEACTIVATED") {
      return { status: "EVENT INACTIVE", message: "Event turnstiles are currently deactivated by organizer." };
    }

    const participant = this.findParticipant(eventId, identifier);
    if (!participant) {
      return { status: "PARTICIPANT NOT FOUND", message: `No attendee record found matching "${identifier}".` };
    }

    if (participant.checkedIn) {
      return {
        status: "ALREADY CHECKED IN",
        message: `Badge already admitted at ${participant.checkInGate || "Gate 01"} (${participant.checkInTime || "earlier"}).`,
        participant,
        checkInTime: participant.checkInTime,
      };
    }

    // Atomic admission
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    participant.checkedIn = true;
    participant.checkInTime = nowTime;
    participant.checkInGate = gateName;

    this.updateParticipant(eventId, participant.passId, {
      checkedIn: true,
      checkInTime: nowTime,
      checkInGate: gateName,
    });

    this.addAuditLog({
      id: `aud_scan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      eventId,
      action: "CHECK_IN",
      actor: staffName,
      target: participant.passId,
      details: `Admitted ${participant.name} (${participant.tier} Pass) at ${gateName}${syncedFromOffline ? " [Synced from Offline Queue]" : ""}`,
      metadata: { deviceId, syncedFromOffline, gate: gateName },
      timestamp: new Date().toISOString(),
    });

    return {
      status: "SUCCESS",
      message: "Access granted.",
      participant,
      checkInTime: nowTime,
    };
  },

  reverseParticipantCheckIn(eventId: string, passId: string, actor: string, reason: string): boolean {
    const list = globalStore.__eventos_participants?.get(eventId) || [];
    const idx = list.findIndex((p) => p.passId === passId);
    if (idx === -1) return false;
    const participant = list[idx];
    if (!participant.checkedIn) return false;

    list[idx] = {
      ...participant,
      checkedIn: false,
      checkInTime: undefined,
      checkInGate: undefined,
    };
    globalStore.__eventos_participants?.set(eventId, list);

    this.addAuditLog({
      id: `aud_rev_${Date.now()}`,
      eventId,
      action: "CHECK_IN_REVERSED",
      actor,
      target: passId,
      details: `Reversed check-in for ${participant.name} (${passId}). Reason: ${reason || "Manual Organizer override"}`,
      timestamp: new Date().toISOString(),
    });
    return true;
  },

  // Audit Logs
  getAuditLogs(eventId: string): AuditLogEntry[] {
    return globalStore.__eventos_audit_logs?.get(eventId) || [];
  },
  addAuditLog(entry: AuditLogEntry): void {
    const current = globalStore.__eventos_audit_logs?.get(entry.eventId) || [];
    globalStore.__eventos_audit_logs?.set(entry.eventId, [entry, ...current]);
  },

  // Event Documents & Knowledge Base (RAG)
  getEventDocuments(eventId: string): EventDocument[] {
    return globalStore.__eventos_documents?.get(eventId) || [];
  },
  saveDocument(doc: EventDocument): void {
    const current = globalStore.__eventos_documents?.get(doc.eventId) || [];
    globalStore.__eventos_documents?.set(doc.eventId, [doc, ...current]);
  },
  searchDocuments(eventId: string, query: string): EventDocument[] {
    const docs = this.getEventDocuments(eventId);
    if (!query || !query.trim()) return docs;
    const STOP_WORDS = new Set([
      "what", "is", "the", "of", "an", "a", "in", "to", "for", "and", "or", "on", "at", "by",
      "from", "with", "as", "about", "into", "through", "during", "before", "after", "above",
      "below", "between", "under", "there", "here", "when", "where", "why", "how", "all", "any",
      "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
      "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now", "are",
      "were", "was", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing",
      "would", "could", "per", "hour"
    ]);
    const rawTokens = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    const meaningfulTokens = rawTokens.filter((t) => t.length > 2 && !STOP_WORDS.has(t));
    const tokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens.filter((t) => t.length > 3);
    if (tokens.length === 0) return [];

    return docs
      .map((doc) => {
        let score = 0;
        const text = (doc.name + " " + doc.content).toLowerCase();
        for (const token of tokens) {
          if (text.includes(token)) score += 1;
        }
        return { doc, score };
      })
      .filter((item) => {
        if (tokens.length >= 4) {
          return item.score >= 2 && item.score / tokens.length >= 0.25;
        }
        return item.score > 0;
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.doc);
  },

  // Notifications & Pass Delivery Tracking
  getNotifications(eventId: string, type?: "EMAIL" | "WHATSAPP"): StoredNotification[] {
    const list = globalStore.__eventos_notifications?.get(eventId) || [];
    if (!type) return list;
    return list.filter((n) => n.type === type);
  },
  addNotification(notif: StoredNotification): void {
    const current = globalStore.__eventos_notifications?.get(notif.eventId) || [];
    const existingIdx = current.findIndex((n) => n.idempotencyKey === notif.idempotencyKey);
    if (existingIdx !== -1) {
      current[existingIdx] = notif;
      globalStore.__eventos_notifications?.set(notif.eventId, [...current]);
    } else {
      globalStore.__eventos_notifications?.set(notif.eventId, [notif, ...current]);
    }
  },
  getNotificationDeliveryStats(eventId: string) {
    const participants = this.getParticipants(eventId);
    const notifications = this.getNotifications(eventId);

    const emailSent = participants.filter((p) => p.emailStatus === "SENT").length;
    const emailFailed = participants.filter((p) => p.emailStatus === "FAILED").length;
    const emailPending = participants.length - emailSent - emailFailed;

    const whatsappSent = participants.filter((p) => p.whatsappStatus === "SENT").length;
    const whatsappFailed = participants.filter((p) => p.whatsappStatus === "FAILED").length;
    const whatsappPending = participants.length - whatsappSent - whatsappFailed;

    return {
      totalParticipants: participants.length,
      emailSent,
      emailPending: Math.max(0, emailPending),
      emailFailed,
      whatsappSent,
      whatsappPending: Math.max(0, whatsappPending),
      whatsappFailed,
      recentActivity: notifications.slice(0, 20),
    };
  },
};
