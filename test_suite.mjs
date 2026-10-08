// test_suite.mjs - End-to-End Test of EventOS Phase 2 APIs
const BASE = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('EVENTOS PHASE 2: VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Test Login Page
  try {
    const res = await fetch(`${BASE}/auth/login`);
    if (res.status === 200) {
      console.log('✔ [1/9] Auth Login Page: HTTP 200 OK (Obsidian Kinetic theme rendered)');
      passed++;
    } else {
      console.error(`✖ [1/9] Auth Login Page returned status: ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.error('✖ [1/9] Auth Login Page failed:', e.message);
    failed++;
  }

  // 2. Test Participants API
  try {
    const res = await fetch(`${BASE}/api/participants?eventId=evt_dynamite2026&page=1&limit=3`);
    const data = await res.json();
    if (res.status === 200 && data.participants && data.participants.length > 0) {
      console.log(`✔ [2/9] Participants API: HTTP 200 (Total: ${data.total}, Sample: ${data.participants[0].name} [${data.participants[0].passId}])`);
      passed++;
    } else {
      console.error('✖ [2/9] Participants API failed response:', data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [2/9] Participants API failed:', e.message);
    failed++;
  }

  // Generate unique pass & email for fresh check-in test
  const uniqueId = Date.now();
  const testPass = `DYN-TST-${uniqueId.toString().slice(-5)}`;
  const testEmail = `attendee_${uniqueId}@oxford.edu`;

  // First import the fresh participant via import API
  let freshPassCode = testPass;
  try {
    const impRes = await fetch(`${BASE}/api/participants/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 'evt_dynamite2026',
        rows: [
          { name: `Marcus Thorne ${uniqueId}`, email: testEmail, college: 'Imperial College', tier: 'VIP' }
        ]
      })
    });
    const impData = await impRes.json();
    // Get fresh list to find the generated passId
    const pListRes = await fetch(`${BASE}/api/participants?eventId=evt_dynamite2026&search=${testEmail}`);
    const pListData = await pListRes.json();
    if (pListData.participants && pListData.participants.length > 0) {
      freshPassCode = pListData.participants[0].passId;
    }
  } catch (e) {
    console.error('Setup failed:', e.message);
  }

  // 3. Test Check-in Valid Pass
  try {
    const res = await fetch(`${BASE}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passCode: freshPassCode,
        eventId: 'evt_dynamite2026',
        gateName: 'Gate Alpha (Main Concourse)',
        scannedBy: 'Sarah Jenkins (Security Lead)'
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.status === 'SUCCESS') {
      console.log(`✔ [3/9] Real Check-in API: SUCCESS (${data.participant.name} checked in at ${data.participant.check_in_gate})`);
      passed++;
    } else {
      console.error('✖ [3/9] Check-in API unexpected result:', data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [3/9] Check-in API failed:', e.message);
    failed++;
  }

  // 4. Test Duplicate Check-in Prevention (Race-Condition Guard)
  try {
    const res = await fetch(`${BASE}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passCode: freshPassCode,
        eventId: 'evt_dynamite2026',
        gateName: 'Gate Alpha (Main Concourse)',
        scannedBy: 'Sarah Jenkins (Security Lead)'
      })
    });
    const data = await res.json();
    if (res.status === 409 && data.status === 'ALREADY CHECKED IN') {
      console.log(`✔ [4/9] Duplicate Check-in Guard: HTTP 409 (${data.status} - Detected previous admission through turnstile)`);
      passed++;
    } else {
      console.error('✖ [4/9] Duplicate Check-in Guard unexpected result:', res.status, data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [4/9] Duplicate Check-in Guard failed:', e.message);
    failed++;
  }

  // 5. Test Invalid Pass Check-in
  try {
    const res = await fetch(`${BASE}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passCode: 'FORGED-PASS-99999',
        eventId: 'evt_dynamite2026'
      })
    });
    const data = await res.json();
    if (res.status === 404 && data.status === 'PARTICIPANT NOT FOUND') {
      console.log(`✔ [5/9] Invalid QR Guard: HTTP 404 (${data.status} - ${data.message})`);
      passed++;
    } else {
      console.error('✖ [5/9] Invalid QR Guard unexpected result:', res.status, data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [5/9] Invalid QR Guard failed:', e.message);
    failed++;
  }

  // 6. Test Real Certificate Public Verification
  try {
    const res = await fetch(`${BASE}/api/certificates/verify/cert_dyn_88912`);
    const data = await res.json();
    if (res.status === 200 && data.valid && data.sha256Hash) {
      console.log(`✔ [6/9] Certificate Verification: Verified (${data.participant.name} - SHA256: ${data.sha256Hash.slice(0, 16)}...)`);
      passed++;
    } else {
      console.error('✖ [6/9] Certificate Verification unexpected result:', data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [6/9] Certificate Verification failed:', e.message);
    failed++;
  }

  // 7. Test AI Copilot Sandbox Tools
  try {
    const res = await fetch(`${BASE}/api/ai/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Give me the current attendance rate and total registered participants for Dynamite 2026',
        eventId: 'evt_dynamite2026'
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.reply && (data.toolUsed === 'getEventStats' || data.toolUsed === 'getCheckInStats')) {
      console.log(`✔ [7/9] AI Copilot Backend: Tool '${data.toolUsed}' triggered cleanly. Snippet: "${data.reply.slice(0, 80)}..."`);
      passed++;
    } else {
      console.error('✖ [7/9] AI Copilot unexpected result:', data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [7/9] AI Copilot failed:', e.message);
    failed++;
  }

  // 8. Test CSV Ingestion Engine Validation
  try {
    const batchId = Date.now();
    const res = await fetch(`${BASE}/api/participants/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 'evt_dynamite2026',
        rows: [
          { name: `Fresh Attendee ${batchId}`, email: `fresh_${batchId}@mit.edu`, tier: 'VIP' }, // valid
          { name: '', email: `nameless_${batchId}@mit.edu` }, // should fail missing name
          { name: 'Invalid Email Person', email: 'malformed-address' }, // should fail bad email
          { name: 'Duplicate Person', email: testEmail } // should skip duplicate existing attendee
        ]
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.imported === 1 && data.skipped === 1 && data.failed === 2) {
      console.log(`✔ [8/9] CSV Validation Engine: Verified (Imported: ${data.imported}, Skipped: ${data.skipped}, Failed: ${data.failed})`);
      passed++;
    } else {
      console.error('✖ [8/9] CSV Validation Engine unexpected result:', data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [8/9] CSV Validation Engine failed:', e.message);
    failed++;
  }

  // 9. Test n8n Webhook Ingestion Point
  try {
    const res = await fetch(`${BASE}/api/webhooks/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'participant.checked_in',
        data: {
          participant_id: 'part_dyn_88912',
          event_id: 'evt_dynamite2026',
          timestamp: new Date().toISOString()
        }
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.status === 'received') {
      console.log(`✔ [9/9] n8n Webhook Ingestion: HTTP 200 (${data.event} acknowledged)`);
      passed++;
    } else {
      console.error('✖ [9/9] n8n Webhook Ingestion unexpected result:', data);
      failed++;
    }
  } catch (e) {
    console.error('✖ [9/9] n8n Webhook Ingestion failed:', e.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
