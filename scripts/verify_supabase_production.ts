// scripts/verify_supabase_production.ts
import { createAdminClient } from "../lib/supabase/admin";
import { isSupabaseConfigured } from "../lib/supabase/client";

export async function verifyProductionSupabase() {
  console.log("================================================================================");
  console.log("EVENTOS: PRODUCTION SUPABASE VERIFICATION");
  console.log("================================================================================\n");

  if (!isSupabaseConfigured()) {
    console.error("✖ FAILED: Supabase environment variables not configured in .env.local.");
    console.error("  Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    return { success: false, error: "ENV_NOT_CONFIGURED" };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    console.error("✖ FAILED: Failed to initialize Supabase admin client.");
    return { success: false, error: "CLIENT_INIT_FAILED" };
  }

  const REQUIRED_TABLES = [
    "organizations",
    "organization_members",
    "events",
    "tiers",
    "gates",
    "participants",
    "check_ins",
    "sessions",
    "certificates",
    "feedback",
    "audit_logs",
    "event_documents", // RAG
    "volunteers",
    "notification_logs",
  ];

  const tableResults: Record<string, { exists: boolean; rlsEnabled?: boolean; count?: number; error?: string }> = {};

  console.log(">>> [1/3] VERIFYING CORE & RAG EVENT TABLES...");
  let allTablesExist = true;

  for (const table of REQUIRED_TABLES) {
    try {
      const { data, count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error && error.code === "42P01") {
        // 42P01: undefined_table
        console.log(`  ✖ Table [${table}] DOES NOT EXIST`);
        tableResults[table] = { exists: false, error: error.message };
        allTablesExist = false;
      } else if (error) {
        console.log(`  ⚠ Table [${table}] accessible with response: ${error.message}`);
        tableResults[table] = { exists: true, error: error.message };
      } else {
        console.log(`  ✔ Table [${table}] verified (row count: ${count ?? 0})`);
        tableResults[table] = { exists: true, count: count ?? 0 };
      }
    } catch (err: any) {
      console.log(`  ✖ Table [${table}] check exception: ${err.message}`);
      tableResults[table] = { exists: false, error: err.message };
      allTablesExist = false;
    }
  }

  console.log("\n>>> [2/3] VERIFYING RPC STORED PROCEDURES...");
  let rpcValid = true;
  try {
    // Probe process_check_in RPC with dummy parameters to verify function signature
    const { error: rpcErr } = await supabase.rpc("process_check_in", {
      p_event_id: "00000000-0000-0000-0000-000000000000",
      p_pass_code: "PROBE-NON-EXISTENT",
      p_gate_name: "Gate 01",
    });

    if (rpcErr && rpcErr.message.includes("does not exist")) {
      console.log("  ✖ RPC [process_check_in] does NOT exist in public schema.");
      rpcValid = false;
    } else {
      console.log("  ✔ RPC [process_check_in] exists and callable.");
    }
  } catch (e: any) {
    console.log(`  ✖ RPC probe error: ${e.message}`);
    rpcValid = false;
  }

  try {
    // Probe process_check_in_v2 RPC
    const { error: rpcV2Err } = await supabase.rpc("process_check_in_v2", {
      p_event_id: "00000000-0000-0000-0000-000000000000",
      p_pass_code: "PROBE-NON-EXISTENT",
      p_gate_name: "Gate 01",
    });

    if (rpcV2Err && rpcV2Err.message.includes("does not exist")) {
      console.log("  ✖ RPC [process_check_in_v2] does NOT exist in public schema.");
      rpcValid = false;
    } else {
      console.log("  ✔ RPC [process_check_in_v2] exists and callable.");
    }
  } catch (e: any) {
    console.log(`  ✖ RPC v2 probe error: ${e.message}`);
    rpcValid = false;
  }

  console.log("\n>>> [3/3] VERIFYING EVENT DOCUMENTS RAG READINESS...");
  let ragReady = false;
  try {
    const { data: docProbe, error: docErr } = await supabase
      .from("event_documents")
      .select("id, document_name, document_type, content")
      .limit(1);

    if (!docErr) {
      console.log("  ✔ RAG Knowledge Base table [event_documents] is queryable and ready.");
      ragReady = true;
    } else {
      console.log(`  ✖ RAG Knowledge Base query error: ${docErr.message}`);
    }
  } catch (e: any) {
    console.log(`  ✖ RAG probe exception: ${e.message}`);
  }

  console.log("\n================================================================================");
  console.log(`VERIFICATION RESULT: Tables: ${allTablesExist ? "PASS" : "FAIL"}, RPC: ${rpcValid ? "PASS" : "FAIL"}, RAG: ${ragReady ? "PASS" : "FAIL"}`);
  console.log("================================================================================\n");

  return {
    success: allTablesExist && rpcValid && ragReady,
    allTablesExist,
    rpcValid,
    ragReady,
    tableResults,
  };
}

verifyProductionSupabase()
  .then((res) => {
    process.exit(res.success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
