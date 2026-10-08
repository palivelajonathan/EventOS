import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventHeader = req.headers.get("x-eventos-event") || payload.event;

    // Verify presence of event payload
    if (!payload || !payload.event) {
      return NextResponse.json(
        { error: "Invalid webhook payload structure. Missing 'event' key." },
        { status: 400 }
      );
    }

    // Inbound webhook processing hook (for n8n or external triggers)
    console.log(`[EventOS Webhook Ingested] ${eventHeader}:`, payload.data);

    return NextResponse.json({
      status: "received",
      event: eventHeader,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Webhook ingestion error", details: err?.message },
      { status: 500 }
    );
  }
}
