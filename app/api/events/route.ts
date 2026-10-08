import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { authenticateRequest } from "@/lib/auth/serverAuth";
import { pilotStore } from "@/lib/data/pilotStore";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required." },
        { status: 401 }
      );
    }

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        let query = adminClient.from("events").select("*");
        if (user.role !== "ADMIN") {
          query = query.eq("org_id", user.orgId);
        }
        const { data, error } = await query.order("date_start", { ascending: false });
        if (!error && data) {
          return NextResponse.json({ events: data });
        }
      }
    }

    const events = pilotStore.listEvents(user.role === "ADMIN" ? undefined : user.orgId);
    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required." },
        { status: 401 }
      );
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only Organizers and Admins can create events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      slug,
      tagline,
      description,
      venueName,
      city = "Hyderabad",
      dateStart,
      dateEnd,
      capacity = 1000,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: 'name' and 'slug'." },
        { status: 400 }
      );
    }

    const eventRecord = {
      org_id: user.orgId,
      name,
      slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-"),
      tagline,
      description,
      venue_name: venueName,
      city,
      date_start: dateStart || new Date().toISOString(),
      date_end: dateEnd || null,
      capacity: Number(capacity),
      status: "LIVE",
    };

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient
          .from("events")
          .insert(eventRecord)
          .select()
          .single();

        if (error) {
          console.error("Create event error in Supabase:", error);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, event: data }, { status: 201 });
      }
    }

    // Demo store response
    const mockCreated = {
      id: body.id || `evt_${Date.now()}`,
      ...eventRecord,
      created_at: new Date().toISOString(),
    };
    pilotStore.saveEvent(mockCreated);

    return NextResponse.json({ success: true, event: mockCreated }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required." },
        { status: 401 }
      );
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only Organizers and Admins can update events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const eventId = body.eventId;
    let updates = body.updates ? { ...body.updates } : null;
    if (!updates) {
      const { eventId: _e, ...rest } = body;
      updates = { ...rest };
    }

    if (!eventId || !updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Missing eventId or updates in request body." },
        { status: 400 }
      );
    }

    // Normalize camelCase to snake_case for branding attributes
    if (updates.logoUrl && !updates.logo_url) updates.logo_url = updates.logoUrl;
    if (updates.coverImageUrl && !updates.cover_image_url) updates.cover_image_url = updates.coverImageUrl;
    if (updates.primaryColor && !updates.primary_color) updates.primary_color = updates.primaryColor;

    // Tenant check
    const currentEvent = pilotStore.getEvent(eventId);
    if (currentEvent && currentEvent.org_id !== user.orgId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Cross-tenant event modification denied." },
        { status: 403 }
      );
    }

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient
          .from("events")
          .update(updates)
          .eq("id", eventId)
          .select()
          .single();
        if (!error && data) {
          return NextResponse.json({ success: true, event: data });
        }
      }
    }

    pilotStore.updateEvent(eventId, updates);
    if (updates.status) {
      pilotStore.addAuditLog({
        id: `aud_${Date.now()}`,
        eventId,
        action: "STATUS_CHANGED",
        actor: `${user.role} (${user.id || "User"})`,
        details: `Event operational status updated to: ${updates.status}`,
        timestamp: new Date().toISOString(),
      });
    }
    if (updates.logo_url || updates.cover_image_url || updates.primary_color) {
      pilotStore.addAuditLog({
        id: `aud_${Date.now()}`,
        eventId,
        action: "BRANDING_UPDATED",
        actor: `${user.role} (${user.id || "User"})`,
        details: `Event branding updated: ${JSON.stringify(updates)}`,
        timestamp: new Date().toISOString(),
      });
    }

    const updated = pilotStore.getEvent(eventId);
    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

