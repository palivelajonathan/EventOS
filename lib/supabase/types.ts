export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          billing_tier: "FREE" | "PRO" | "ENTERPRISE";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          billing_tier?: "FREE" | "PRO" | "ENTERPRISE";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          billing_tier?: "FREE" | "PRO" | "ENTERPRISE";
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          org_id: string;
          slug: string;
          name: string;
          tagline: string | null;
          venue_name: string | null;
          city: string | null;
          date_start: string;
          date_end: string | null;
          status: "DRAFT" | "PUBLISHED" | "LIVE" | "CONCLUDED";
          capacity: number;
          offline_mesh_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          slug: string;
          name: string;
          tagline?: string | null;
          venue_name?: string | null;
          city?: string | null;
          date_start: string;
          date_end?: string | null;
          status?: "DRAFT" | "PUBLISHED" | "LIVE" | "CONCLUDED";
          capacity?: number;
          offline_mesh_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          slug?: string;
          name?: string;
          tagline?: string | null;
          venue_name?: string | null;
          city?: string | null;
          date_start?: string;
          date_end?: string | null;
          status?: "DRAFT" | "PUBLISHED" | "LIVE" | "CONCLUDED";
          capacity?: number;
          offline_mesh_enabled?: boolean;
          created_at?: string;
        };
      };
      tiers: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          price: number;
          currency: string;
          capacity: number;
          allocated: number;
          color_accent: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          price?: number;
          currency?: string;
          capacity?: number;
          allocated?: number;
          color_accent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          price?: number;
          currency?: string;
          capacity?: number;
          allocated?: number;
          color_accent?: string;
          created_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          event_id: string;
          tier_id: string;
          pass_code: string;
          name: string;
          email: string;
          phone: string | null;
          college: string | null;
          roll_number: string | null;
          sha256_hash: string;
          checked_in: boolean;
          check_in_time: string | null;
          check_in_gate: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          tier_id: string;
          pass_code: string;
          name: string;
          email: string;
          phone?: string | null;
          college?: string | null;
          roll_number?: string | null;
          sha256_hash: string;
          checked_in?: boolean;
          check_in_time?: string | null;
          check_in_gate?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          tier_id?: string;
          pass_code?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          college?: string | null;
          roll_number?: string | null;
          sha256_hash?: string;
          checked_in?: boolean;
          check_in_time?: string | null;
          check_in_gate?: string | null;
          created_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          event_id: string;
          participant_id: string;
          gate_name: string;
          scanned_by: string | null;
          status: "VALIDATED" | "DENIED" | "FLAGGED";
          latency_ms: number;
          synced_from_offline: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          participant_id: string;
          gate_name: string;
          scanned_by?: string | null;
          status?: "VALIDATED" | "DENIED" | "FLAGGED";
          latency_ms?: number;
          synced_from_offline?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          participant_id?: string;
          gate_name?: string;
          scanned_by?: string | null;
          status?: "VALIDATED" | "DENIED" | "FLAGGED";
          latency_ms?: number;
          synced_from_offline?: boolean;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          track: string;
          stage: string;
          speaker_name: string;
          speaker_title: string | null;
          speaker_org: string | null;
          speaker_avatar: string | null;
          start_time: string;
          end_time: string;
          capacity: number;
          enrolled: number;
          is_live_now: boolean;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          track: string;
          stage: string;
          speaker_name: string;
          speaker_title?: string | null;
          speaker_org?: string | null;
          speaker_avatar?: string | null;
          start_time: string;
          end_time: string;
          capacity?: number;
          enrolled?: number;
          is_live_now?: boolean;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          track?: string;
          stage?: string;
          speaker_name?: string;
          speaker_title?: string | null;
          speaker_org?: string | null;
          speaker_avatar?: string | null;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          enrolled?: number;
          is_live_now?: boolean;
        };
      };
      certificates: {
        Row: {
          id: string;
          event_id: string;
          participant_id: string;
          certificate_number: string;
          credential_type: "PARTICIPATION" | "HONORS" | "HACKATHON_WINNER" | "SPEAKER";
          sha256_hash: string;
          issued_at: string;
          revoked: boolean;
        };
        Insert: {
          id?: string;
          event_id: string;
          participant_id: string;
          certificate_number: string;
          credential_type?: "PARTICIPATION" | "HONORS" | "HACKATHON_WINNER" | "SPEAKER";
          sha256_hash: string;
          issued_at?: string;
          revoked?: boolean;
        };
        Update: {
          id?: string;
          event_id?: string;
          participant_id?: string;
          certificate_number?: string;
          credential_type?: "PARTICIPATION" | "HONORS" | "HACKATHON_WINNER" | "SPEAKER";
          sha256_hash?: string;
          issued_at?: string;
          revoked?: boolean;
        };
      };
    };
  };
}
