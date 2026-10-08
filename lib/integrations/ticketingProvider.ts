/**
 * EventOS Pluggable Ticketing Provider Integration Interface
 * Clean architectural abstraction for external registration providers:
 * - Google Forms / Excel (CsvProvider)
 * - REST API Webhook / Sync (RestApiProvider)
 * - Inbound Webhook (WebhookProvider for Luma, Eventbrite, Stripe, Razorpay)
 */

export interface NormalizedAttendee {
  fullName: string;
  email: string;
  phone?: string;
  college?: string;
  tier?: string;
  externalRegistrationId?: string;
  metadata?: Record<string, any>;
}

export interface TicketingProvider {
  id: string;
  name: string;
  description: string;
  fetchAttendees(config?: Record<string, any>): Promise<NormalizedAttendee[]>;
  processWebhookPayload(payload: any): NormalizedAttendee[];
}

/**
 * 1. CSV / Spreadsheet Provider
 */
export class CsvXlsxProvider implements TicketingProvider {
  id = "csv_xlsx";
  name = "Spreadsheet Ingestion Provider";
  description = "Ingests attendees from CSV, XLS, and XLSX spreadsheets with fuzzy column mapping.";

  async fetchAttendees(config: { rows: any[]; mappings: Record<string, string> }): Promise<NormalizedAttendee[]> {
    if (!config?.rows) return [];
    return config.rows.map((r, idx) => ({
      fullName: r.full_name || r.name || `Attendee ${idx + 1}`,
      email: (r.email || "").toLowerCase().trim(),
      phone: r.phone || undefined,
      college: r.college || "Unspecified",
      tier: (r.tier || "GENERAL").toUpperCase(),
      externalRegistrationId: r.external_registration_id || r.reg_id || undefined,
      metadata: r,
    }));
  }

  processWebhookPayload(payload: any): NormalizedAttendee[] {
    if (Array.isArray(payload)) {
      return payload.map((p) => ({
        fullName: p.name || p.fullName,
        email: p.email,
        phone: p.phone,
        college: p.college,
        tier: p.tier,
        externalRegistrationId: p.externalRegistrationId || p.id,
      }));
    }
    return [];
  }
}

/**
 * 2. Remote REST API Ticketing Provider
 */
export class RestApiProvider implements TicketingProvider {
  id = "rest_api";
  name = "Generic REST API Provider";
  description = "Polls and synchronizes attendees from an authenticated external endpoint.";

  async fetchAttendees(config?: { endpoint?: string; apiKey?: string }): Promise<NormalizedAttendee[]> {
    const endpoint = config?.endpoint || process.env.REGISTRATION_API_ENDPOINT;
    const apiKey = config?.apiKey || process.env.REGISTRATION_API_KEY;

    if (!endpoint) {
      throw new Error("REST API Endpoint not configured.");
    }

    const res = await fetch(endpoint, {
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`External ticketing provider returned HTTP ${res.status}`);
    }

    const json = await res.json();
    const rawList = Array.isArray(json) ? json : json.data || json.attendees || [];

    return rawList.map((item: any) => ({
      fullName: item.name || item.fullName || item.full_name,
      email: (item.email || "").toLowerCase().trim(),
      phone: item.phone || item.mobile,
      college: item.college || item.institution,
      tier: (item.tier || item.category || "GENERAL").toUpperCase(),
      externalRegistrationId: item.id || item.registrationId || item.ticketId,
      metadata: item,
    }));
  }

  processWebhookPayload(): NormalizedAttendee[] {
    return [];
  }
}

/**
 * 3. Inbound Webhook Provider
 */
export class WebhookProvider implements TicketingProvider {
  id = "webhook";
  name = "Inbound Webhook Event Provider";
  description = "Receives real-time registration webhooks from external ticketing and form tools.";

  async fetchAttendees(): Promise<NormalizedAttendee[]> {
    return [];
  }

  processWebhookPayload(payload: any): NormalizedAttendee[] {
    // Normalizes singular, registration-wrapped, or array webhook payload
    const items = Array.isArray(payload)
      ? payload
      : payload.registration
      ? [payload.registration]
      : payload.attendees || [payload];

    return items
      .filter((item: any) => item && (item.email || item.name || item.fullName))
      .map((item: any) => ({
        fullName: item.name || item.fullName || item.full_name || "Guest Attendee",
        email: (item.email || "").toLowerCase().trim(),
        phone: item.phone || item.mobile,
        college: item.college || item.institution || "Unspecified",
        tier: (item.tier || item.category || "GENERAL").toUpperCase(),
        externalRegistrationId: item.external_registration_id || item.externalRegistrationId || item.id || item.ticket_id,
        metadata: item,
      }));
  }
}

// Provider Registry Singleton
export const ticketingProviders: Record<string, TicketingProvider> = {
  csv: new CsvXlsxProvider(),
  rest: new RestApiProvider(),
  webhook: new WebhookProvider(),
};
