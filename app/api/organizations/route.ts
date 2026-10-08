import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { authenticateRequest } from "@/lib/auth/serverAuth";
import { pilotStore } from "@/lib/data/pilotStore";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient
          .from("organizations")
          .select("*")
          .eq("id", user.orgId);

        if (!error && data) {
          return NextResponse.json({ organizations: data });
        }
      }
    }

    const stored = pilotStore.listOrganizations(user.role === "ADMIN" ? undefined : user.orgId);
    return NextResponse.json({ organizations: stored });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only organization organizers or administrators can create an organization." },
        { status: 403 }
      );
    }

    const { name, slug } = await req.json();
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: 'name' and 'slug'." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (adminClient) {
        // 1. Insert organization
        const { data: org, error: orgErr } = await adminClient
          .from("organizations")
          .insert({
            name,
            slug: cleanSlug,
            owner_id: user.id.startsWith("usr_") ? null : user.id,
            billing_tier: "PRO",
          })
          .select()
          .single();

        if (orgErr) {
          return NextResponse.json({ error: orgErr.message }, { status: 400 });
        }

        // 2. Insert organization member (OWNER)
        if (!user.id.startsWith("usr_")) {
          await adminClient.from("organization_members").insert({
            org_id: org.id,
            user_id: user.id,
            role: "OWNER",
          });
        }

        return NextResponse.json({ success: true, organization: org }, { status: 201 });
      }
    }

    const orgId = user.orgId && user.orgId !== "org_dynamite_default" ? user.orgId : `org_${Date.now()}`;
    const mockOrg = {
      id: orgId,
      name,
      slug: cleanSlug,
      billing_tier: "PRO",
      created_at: new Date().toISOString(),
    };
    pilotStore.saveOrganization(mockOrg);

    return NextResponse.json({ success: true, organization: mockOrg }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
