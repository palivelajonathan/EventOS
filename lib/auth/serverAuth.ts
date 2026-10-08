import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Role } from "./roles";
import { DYNAMITE_2026 } from "@/lib/data/dynamite2026";
import { pilotStore } from "@/lib/data/pilotStore";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  orgId: string;
  name?: string;
  assignedGate?: string;
  assignedEventId?: string;
}

export interface AuthSuccess {
  authorized: true;
  user: AuthenticatedUser;
  event?: any;
}

export interface AuthFailure {
  authorized: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Resolves the authenticated user from cookies, bearer headers, or test simulation headers.
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization");
  const testRole = req.headers.get("x-eventos-auth-role") as Role | null;
  const testOrgId = req.headers.get("x-eventos-org-id");
  const testUserId = req.headers.get("x-eventos-user-id");
  const testEventId = req.headers.get("x-eventos-event-id");

  // 1. Check for test/simulation token or headers (used in automated security audit and dev)
  if (authHeader?.startsWith("Bearer test-token:")) {
    const tokenParts = authHeader.replace("Bearer test-token:", "").split(":");
    // format: test-token:<role>:<orgId>:<userId>
    const role = (tokenParts[0]?.toUpperCase() || "ORGANIZER") as Role;
    const orgId = tokenParts[1] || "org_dynamite_default";
    const id = tokenParts[2] || `usr_${role.toLowerCase()}_01`;
    return {
      id,
      email: `${role.toLowerCase()}@test.eventos.io`,
      role,
      orgId,
      name: `Test ${role}`,
      assignedEventId: tokenParts[3] || undefined,
    };
  }

  if (testRole) {
    return {
      id: testUserId || `usr_${testRole.toLowerCase()}_sim`,
      email: `${testRole.toLowerCase()}@eventos.io`,
      role: testRole,
      orgId: testOrgId || "org_dynamite_default",
      name: `${testRole} User`,
      assignedEventId: testEventId || undefined,
    };
  }

  // 2. Check real Supabase Session (production auth)
  if (isSupabaseConfigured()) {
    try {
      const serverClient = await createServerSupabaseClient();
      if (serverClient) {
        const { data: { user }, error } = await serverClient.auth.getUser();
        if (user && !error) {
          // Fetch user's organization membership and role
          const adminClient = createAdminClient();
          if (adminClient) {
            const { data: membership } = await adminClient
              .from("organization_members")
              .select("org_id, role, assigned_gate")
              .eq("user_id", user.id)
              .single();

            return {
              id: user.id,
              email: user.email || "",
              role: (membership?.role as Role) || "PARTICIPANT",
              orgId: membership?.org_id || "unassigned",
              name: user.user_metadata?.full_name || user.email?.split("@")[0],
              assignedGate: membership?.assigned_gate || undefined,
            };
          }
        }
      }
    } catch (err) {
      console.error("Supabase auth resolution error:", err);
    }
  }

  // 3. Check for Bearer JWT token if passed directly
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (isSupabaseConfigured() && token && token.length > 20) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: { user }, error } = await adminClient.auth.getUser(token);
        if (user && !error) {
          const { data: membership } = await adminClient
            .from("organization_members")
            .select("org_id, role, assigned_gate")
            .eq("user_id", user.id)
            .single();

          return {
            id: user.id,
            email: user.email || "",
            role: (membership?.role as Role) || "PARTICIPANT",
            orgId: membership?.org_id || "unassigned",
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
            assignedGate: membership?.assigned_gate || undefined,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Strict Multi-Tenant Authorization Guard for API Routes
 * Verifies:
 * 1. User Authentication (Returns 401 if unauthenticated)
 * 2. Event Existence (Returns 404 if event not found)
 * 3. Organization Membership / Tenant Isolation (Returns 403 if Org A accesses Org B)
 * 4. Role Permissions (Returns 403 if role not permitted)
 * 5. Event Assignment for Staff (Returns 403 if volunteer/staff assigned to unrelated event)
 */
export async function authorizeEventAccess(
  req: NextRequest,
  eventId: string,
  allowedRoles: Role[]
): Promise<AuthResult> {
  // 1. Authenticate
  const user = await authenticateRequest(req);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required. Bearer token or active session missing.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    };
  }

  // 2. Fetch Event & Org ID
  let eventOrgId: string = "org_dynamite_default";
  let targetEvent: any = null;

  if (isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data: ev, error } = await adminClient
        .from("events")
        .select("id, org_id, slug, name, status")
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .single();

      if (error || !ev) {
        // In production mode, do not fall back to demo event
        if (process.env.NODE_ENV === "production" || eventId !== "evt_dynamite2026") {
          return {
            authorized: false,
            response: NextResponse.json(
              {
                error: "Event Not Found",
                message: `Event with identifier "${eventId}" does not exist.`,
                code: "EVENT_NOT_FOUND",
              },
              { status: 404 }
            ),
          };
        }
      } else {
        eventOrgId = ev.org_id;
        targetEvent = ev;
      }
    }
  } else {
    // In strict cloud-only mode, fail loudly if Supabase is unconfigured
    if (process.env.NODE_ENV === "production" && process.env.EVENTOS_STRICT_CLOUD_ONLY === "true") {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: "Service Unavailable",
            message: "Production database connection not configured. Refusing mock fallback.",
            code: "DATABASE_UNAVAILABLE",
          },
          { status: 503 }
        ),
      };
    }

    // Dynamic store fallback for registered events
    const inMemoryEv = pilotStore.getEvent(eventId);
    if (inMemoryEv) {
      eventOrgId = inMemoryEv.org_id;
      targetEvent = inMemoryEv;
    } else {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: "Event Not Found",
            message: `Event "${eventId}" not found in database.`,
            code: "EVENT_NOT_FOUND",
          },
          { status: 404 }
        ),
      };
    }
  }

  // 3. Organization Membership / Cross-Tenant Guard
  if (user.orgId !== eventOrgId && user.role !== "ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: `Cross-tenant event access denied. Organization mismatch: user org "${user.orgId}" cannot access event belonging to org "${eventOrgId}".`,
          code: "CROSS_TENANT_ACCESS_DENIED",
        },
        { status: 403 }
      ),
    };
  }

  // 4. Role Permissions Guard
  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: `Role "${user.role}" does not have required permissions for this endpoint. Required: [${allowedRoles.join(", ")}].`,
          code: "INSUFFICIENT_ROLE_PERMISSIONS",
        },
        { status: 403 }
      ),
    };
  }

  // 5. Gate Staff / Volunteer Event-Scope Guard
  if (
    (user.role === "VOLUNTEER" || user.role === "GATE_STAFF") &&
    user.assignedEventId &&
    user.assignedEventId !== eventId &&
    user.assignedEventId !== targetEvent?.id
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: `Staff member is assigned to event "${user.assignedEventId}" and cannot operate on event "${eventId}".`,
          code: "STAFF_EVENT_MISMATCH",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
    event: targetEvent,
  };
}
