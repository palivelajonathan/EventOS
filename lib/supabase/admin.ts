import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Privileged Admin Supabase Client (Service Role)
 * SERVER-SIDE ONLY - NEVER EXPOSE TO CLIENT/BROWSER
 * Used for administrative check-ins, batch imports, webhook triggers, and seed operations.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: createAdminClient cannot be called in client-side code.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<any>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
