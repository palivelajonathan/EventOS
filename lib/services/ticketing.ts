/**
 * External Ticketing Integration Abstraction Layer
 * Supports pluggable attendee registration providers (CSV, StudentTribe, Eventbrite, etc.)
 * Core business logic remains completely decoupled from specific vendors.
 */

export interface ImportedAttendee {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  rollNumber?: string;
  tier?: string;
  externalRegistrationId?: string;
}

export interface IngestionResult {
  imported: number;
  skipped: number;
  failed: number;
  errors?: Array<{ row: number; email?: string; reason: string }>;
}

export interface TicketingProvider {
  readonly id: string;
  readonly name: string;

  importParticipants(
    eventId: string,
    source: string | Array<Record<string, any>>
  ): Promise<IngestionResult>;

  syncParticipants(eventId: string): Promise<{ syncedCount: number; lastSyncedAt: string }>;

  getRegistrationStatus(
    eventId: string,
    externalId: string
  ): Promise<{ status: "REGISTERED" | "CANCELLED" | "PENDING"; attendee?: ImportedAttendee }>;
}

/**
 * Native CSV File Ticketing Provider
 */
export class CsvTicketingProvider implements TicketingProvider {
  readonly id = "csv";
  readonly name = "CSV / Excel File Ingestion";

  async importParticipants(
    eventId: string,
    source: string | Array<Record<string, any>>
  ): Promise<IngestionResult> {
    const rows = Array.isArray(source) ? source : [];

    const res = await fetch("/api/participants/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, rows }),
    });

    if (!res.ok) {
      throw new Error(`CSV Ingestion API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.summary;
  }

  async syncParticipants(_eventId: string): Promise<{ syncedCount: number; lastSyncedAt: string }> {
    return {
      syncedCount: 0,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async getRegistrationStatus(
    _eventId: string,
    _externalId: string
  ): Promise<{ status: "REGISTERED" | "CANCELLED" | "PENDING" }> {
    return { status: "REGISTERED" };
  }
}

/**
 * Future StudentTribe Integration Provider Stub
 * Extensible for webhook-based or API-token synchronization
 */
export class StudentTribeTicketingProvider implements TicketingProvider {
  readonly id = "studenttribe";
  readonly name = "StudentTribe Campus Ticketing";

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async importParticipants(
    _eventId: string,
    _source: any
  ): Promise<IngestionResult> {
    // Stub implementation awaiting production API keys
    return {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [{ row: 0, reason: "StudentTribe API synchronization configured for future release." }],
    };
  }

  async syncParticipants(_eventId: string): Promise<{ syncedCount: number; lastSyncedAt: string }> {
    return {
      syncedCount: 0,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async getRegistrationStatus(
    _eventId: string,
    _externalId: string
  ): Promise<{ status: "REGISTERED" | "CANCELLED" | "PENDING" }> {
    return { status: "PENDING" };
  }
}

/**
 * Provider Registry Factory
 */
export function getTicketingProvider(type: "csv" | "studenttribe" | string): TicketingProvider {
  switch (type.toLowerCase()) {
    case "studenttribe":
      return new StudentTribeTicketingProvider();
    case "csv":
    default:
      return new CsvTicketingProvider();
  }
}
