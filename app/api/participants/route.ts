import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_PARTICIPANTS, Participant } from "@/lib/data/dynamite2026";
import { pilotStore } from "@/lib/data/pilotStore";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "evt_dynamite2026";

    // 1. Multi-Tenant Authorization Guard
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const tier = searchParams.get("tier") || "ALL";
    const checkedInFilter = searchParams.get("checkedIn") || "ALL";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? false : true;

    // 2. Supabase Production Flow
    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        // Resolve actual UUID if needed
        let targetEventId = eventId;
        if (!eventId.includes("-") || eventId.startsWith("evt_")) {
          const { data: ev } = await adminClient
            .from("events")
            .select("id")
            .or(`id.eq.${eventId},slug.eq.${eventId}`)
            .single();
          if (ev) targetEventId = ev.id;
        }

        let query = adminClient
          .from("participants")
          .select("*, tier:tiers(name)", { count: "exact" })
          .eq("event_id", targetEventId);

        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,pass_code.ilike.%${search}%,college.ilike.%${search}%`);
        }

        if (tier !== "ALL") {
          query = query.eq("tier_id", tier);
        }

        if (checkedInFilter === "true") {
          query = query.eq("checked_in", true);
        } else if (checkedInFilter === "false") {
          query = query.eq("checked_in", false);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.order(sortBy === "name" ? "name" : "created_at", { ascending: sortOrder }).range(from, to);

        const { data, count, error } = await query;

        if (error) {
          console.error("Supabase participants error:", error);
          throw error;
        }

        const formattedParticipants: Participant[] = (data || []).map((p: any) => ({
          id: p.id,
          passId: p.pass_code,
          name: p.name,
          email: p.email,
          phone: p.phone || "",
          college: p.college || "Unspecified",
          tier: (p.tier?.name || "STUDENT") as any,
          tierPrice: 499,
          rollNumber: p.roll_number || "",
          qrPayload: `EVTOS:${p.pass_code}:${p.sha256_hash.slice(0, 8)}`,
          sha256Hash: p.sha256_hash,
          checkedIn: p.checked_in,
          checkInTime: p.check_in_time ? new Date(p.check_in_time).toLocaleTimeString() : undefined,
          checkInGate: p.check_in_gate || undefined,
          avatarUrl: p.avatar_url,
        }));

        return NextResponse.json({
          participants: formattedParticipants,
          total: count ?? formattedParticipants.length,
          page,
          limit,
          totalPages: Math.ceil((count ?? formattedParticipants.length) / limit),
        });
      }
    }

    // 3. Resilient Store Mode (In-Memory Pagination & Filtering)
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

    const eventParticipants = pilotStore.getParticipants(eventId);
    let filtered = eventParticipants.length > 0 ? [...eventParticipants] : [...MOCK_PARTICIPANTS];

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.email.toLowerCase().includes(search) ||
          p.passId.toLowerCase().includes(search) ||
          p.college.toLowerCase().includes(search)
      );
    }

    if (tier !== "ALL") {
      filtered = filtered.filter((p) => p.tier === tier);
    }

    if (checkedInFilter === "true") {
      filtered = filtered.filter((p) => p.checkedIn);
    } else if (checkedInFilter === "false") {
      filtered = filtered.filter((p) => !p.checkedIn);
    }

    filtered.sort((a, b) => {
      const valA = (a as any)[sortBy] || "";
      const valB = (b as any)[sortBy] || "";
      return sortOrder ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      participants: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch participants", details: err?.message },
      { status: 500 }
    );
  }
}
