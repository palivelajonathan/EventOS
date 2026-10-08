import { NextRequest, NextResponse } from "next/server";
import { authorizeEventAccess } from "@/lib/auth/serverAuth";
import { pilotStore } from "@/lib/data/pilotStore";
import { getLiveEventData } from "@/lib/services/eventDataService";

function toCsv(rows: Array<Record<string, any>>, defaultHeaders: string[] = []): string {
  if (!rows || rows.length === 0) {
    if (defaultHeaders.length > 0) {
      return defaultHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
    }
    return "";
  }
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "evt_dynamite2026";
    const type = (searchParams.get("type") || "participants").toLowerCase();
    const format = (searchParams.get("format") || "csv").toLowerCase();

    // 1. Authorization: Only Organizers and Admins can export event data
    const authResult = await authorizeEventAccess(req, eventId, ["ORGANIZER", "ADMIN"]);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const eventData = await getLiveEventData(eventId);
    const participants = pilotStore.getParticipants(eventId);

    let rows: Array<Record<string, any>> = [];
    let filenamePrefix = "export";

    switch (type) {
      case "participants":
        filenamePrefix = "participants";
        rows = participants.map((p) => ({
          "Participant ID": p.id,
          "Pass Code": p.passId,
          "Full Name": p.name,
          "Email": p.email,
          "Phone": p.phone || "N/A",
          "College": p.college,
          "Roll Number": p.rollNumber || "N/A",
          "Tier": p.tier,
          "Checked In": p.checkedIn ? "YES" : "NO",
          "Check-In Time": p.checkInTime || "",
          "Check-In Gate": p.checkInGate || "",
          "Integrity Hash": p.sha256Hash || "",
        }));
        break;

      case "check-ins":
      case "checkins":
        filenamePrefix = "check_ins";
        rows = participants
          .filter((p) => p.checkedIn)
          .map((p, idx) => ({
            "Log Index": idx + 1,
            "Pass Code": p.passId,
            "Attendee Name": p.name,
            "College": p.college,
            "Gate Name": p.checkInGate || "Gate 01",
            "Admission Time": p.checkInTime || "",
            "Status": "ADMITTED",
          }));
        break;

      case "attendance":
        filenamePrefix = "attendance_summary";
        rows = [
          { "Metric": "Event Name", "Value": eventData.name },
          { "Metric": "Venue", "Value": eventData.venue },
          { "Metric": "Total Registered", "Value": eventData.metrics.registered },
          { "Metric": "Total Checked In", "Value": eventData.metrics.checkedIn },
          {
            "Metric": "Attendance Ratio",
            "Value": `${(eventData.metrics.attendanceRatio * 100).toFixed(1)}%`,
          },
          { "Metric": "Total Capacity", "Value": eventData.metrics.capacity },
          { "Metric": "Certificates Minted", "Value": eventData.metrics.certificatesMinted },
          { "Metric": "Peak Ingress Velocity", "Value": `${eventData.metrics.peakScansPerSec} scans/sec` },
        ];
        break;

      case "colleges":
      case "college-wise":
        filenamePrefix = "college_distribution";
        rows = eventData.collegeBreakdown.map((c) => ({
          "College / Institution": c.college,
          "Registered Attendees": c.count,
          "Representation Percentage": `${c.percentage}%`,
        }));
        break;

      case "certificates":
        filenamePrefix = "certificates";
        rows = participants
          .filter((p) => p.checkedIn)
          .map((p) => ({
            "Certificate Number": `CERT-DYN-2026-${p.passId.replace("DYN-", "")}`,
            "Participant Name": p.name,
            "College": p.college,
            "Credential Type": p.tier === "VIP" ? "HONORS" : "PARTICIPATION",
            "SHA256 Hash": p.sha256Hash,
            "Issued Status": "VERIFIED_ISSUED",
            "Verification URL": `https://eventos.sh/verify/CERT-DYN-2026-${p.passId.replace("DYN-", "")}`,
          }));
        break;

      default:
        return NextResponse.json(
          {
            error: "Bad Request",
            message: `Unknown export type "${type}". Supported types: participants, check-ins, attendance, colleges, certificates.`,
          },
          { status: 400 }
        );
    }

    if (format === "json") {
      return NextResponse.json({
        eventId,
        type,
        count: rows.length,
        data: rows,
      });
    }

    const defaultHeadersMap: Record<string, string[]> = {
      participants: ["Participant ID", "Pass Code", "Full Name", "Email", "Phone", "College", "Roll Number", "Tier", "Checked In", "Check-In Time", "Check-In Gate", "Integrity Hash"],
      "check-ins": ["Log Index", "Pass Code", "Attendee Name", "College", "Gate Name", "Admission Time"],
      checkins: ["Log Index", "Pass Code", "Attendee Name", "College", "Gate Name", "Admission Time"],
      attendance: ["Metric", "Value"],
      colleges: ["College / Institution", "Registered Attendees", "Representation Percentage"],
      "college-wise": ["College / Institution", "Registered Attendees", "Representation Percentage"],
      certificates: ["Certificate Number", "Participant Name", "College", "Credential Type", "SHA256 Hash", "Issued Status", "Verification URL"],
    };

    const csvContent = toCsv(rows, defaultHeadersMap[type] || []);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="EventOS_${filenamePrefix}_${eventId}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
