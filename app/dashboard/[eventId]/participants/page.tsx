"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DYNAMITE_2026, Participant } from "@/lib/data/dynamite2026";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import { useAuth } from "@/lib/auth/authContext";
import { SpreadsheetImportModal } from "@/components/participants/SpreadsheetImportModal";

export default function ParticipantsManagementPage() {
  const urlParams = useParams();
  const eventId = (urlParams?.eventId as string) || "evt_dynamite2026";
  const { getAuthHeaders } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [checkedInOnly, setCheckedInOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    skipped: number;
    failed: number;
    duplicate?: number;
    totalProcessed: number;
    errors?: Array<{ row: number; reason: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        eventId,
        page: page.toString(),
        limit: limit.toString(),
        search,
        tier: selectedTier,
        checkedIn: checkedInOnly ? "true" : "ALL",
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/participants?${params.toString()}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) {
        const json = await res.json();
        setParticipants(json.participants || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching participants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParticipants();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedTier, checkedInOnly, page, sortBy, sortOrder]);

  const handleAction = async (participant: Participant) => {
    if (participant.checkedIn) {
      // Reverse check-in with audit log
      try {
        const res = await fetch("/api/check-in/reversal", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            passCode: participant.passId,
            eventId,
            reason: "Organizer manual check-in reversal",
          }),
        });
        const data = await res.json();
        if (data.success) {
          fetchParticipants();
        } else {
          alert(data.message || "Failed to reverse check-in.");
        }
      } catch (err) {
        console.error("Error reversing check-in:", err);
      }
    } else {
      // Manual check-in
      try {
        const res = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            passCode: participant.passId,
            eventId,
            gateName: "Gate 01 • Main Arena",
          }),
        });
        const data = await res.json();
        if (data.status === "SUCCESS") {
          fetchParticipants();
        } else {
          alert(data.message || data.status);
        }
      } catch (err) {
        console.error("Error in check-in:", err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          const res = await fetch("/api/participants/import", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({
              eventId,
              rows: results.data,
            }),
          });
          const json = await res.json();
          if (json.success) {
            setImportSummary({
              ...json.summary,
              errors: json.errors,
            });
            fetchParticipants();
          } else {
            alert(json.error || "Failed to import CSV.");
          }
        } catch (err: any) {
          alert("CSV Upload Error: " + err?.message);
        } finally {
          setImportLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (err: any) => {
        alert("Failed to parse CSV: " + err.message);
        setImportLoading(false);
      },
    });
  };

  const exportCsv = () => {
    const csvData = participants.map((p) => ({
      "Pass ID": p.passId,
      Name: p.name,
      Email: p.email,
      Phone: p.phone,
      College: p.college,
      Tier: p.tier,
      "Checked In": p.checkedIn ? "YES" : "NO",
      "Check-In Time": p.checkInTime || "",
      "Check-In Gate": p.checkInGate || "",
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventos_participants_${eventId}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell eventId={eventId} eventName={DYNAMITE_2026.name} stageName="PARTICIPANT ROSTER">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto p-4 lg:p-8 gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6 rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] shadow-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-mono text-xs text-[#4cd7f6] uppercase tracking-wider mb-1">
              <span>{eventId}</span>
              <span>•</span>
              <span>ATTENDEE REGISTRY</span>
            </div>
            <h1 className="font-geist text-2xl font-bold text-[#e2e2ea]">
              Participant Directory & Credentials
            </h1>
            <span className="font-mono text-xs text-[#908fa0] mt-0.5">
              {total} Total Registered • Page {page} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#282a30] hover:bg-[#33353b] text-[#e2e2ea] border border-[rgba(255,255,255,0.08)] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8083ff] text-[#1000a9] hover:bg-[#c0c1ff] font-semibold transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-sm">upload_file</span>
              <span>Import Spreadsheet (CSV / XLSX)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#908fa0] text-sm">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Pass ID, Email, or College..."
              className="w-full bg-[#191c21] text-[#e2e2ea] pl-9 pr-4 py-2.5 rounded-xl font-geist text-xs outline-none border border-[rgba(255,255,255,0.08)] focus:border-[#c0c1ff]"
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1">
            {["ALL", "VIP", "ALL-ACCESS", "HACKER", "DELEGATE"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap",
                  selectedTier === t
                    ? "bg-[#8083ff] text-[#1000a9] font-bold"
                    : "bg-[#191c21] text-[#908fa0] hover:text-[#e2e2ea] border border-[rgba(255,255,255,0.06)]"
                )}
              >
                {t}
              </button>
            ))}

            <button
              onClick={() => setCheckedInOnly(!checkedInOnly)}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border whitespace-nowrap",
                checkedInOnly
                  ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                  : "bg-[#191c21] text-[#908fa0] border-[rgba(255,255,255,0.06)] hover:text-[#e2e2ea]"
              )}
            >
              <span className="material-symbols-outlined text-xs">
                {checkedInOnly ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span>Checked-In Only</span>
            </button>
          </div>
        </div>

        {/* Participant Ledger Table */}
        <div className="rounded-2xl bg-[#191c21] border border-[rgba(255,255,255,0.07)] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-geist text-xs">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#14161a] text-[#908fa0] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Attendee</th>
                  <th className="py-3.5 px-4">Institution / College</th>
                  <th className="py-3.5 px-4">Pass Tier</th>
                  <th className="py-3.5 px-4">Pass Identifier</th>
                  <th className="py-3.5 px-4">Check-in Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#908fa0] font-mono">
                      Querying Supabase Participant Ledger...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#908fa0] font-mono">
                      No matching attendee records found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#20232a] transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.avatarUrl ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                            }
                            alt={p.name}
                            className="w-7 h-7 rounded-full object-cover border border-[rgba(255,255,255,0.15)]"
                          />
                          <div>
                            <span className="font-semibold text-[#e2e2ea] block">
                              {p.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#908fa0]">
                              {p.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#c5c6d3]">
                        {p.college}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "font-mono text-[10px] font-bold px-2 py-0.5 rounded border",
                            p.tier === "VIP"
                              ? "bg-[#8083ff]/15 text-[#8083ff] border-[#8083ff]/30"
                              : p.tier === "ALL-ACCESS"
                              ? "bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30"
                              : p.tier === "HACKER"
                              ? "bg-[#6be794]/15 text-[#6be794] border-[#6be794]/30"
                              : "bg-[#c0c1ff]/15 text-[#c0c1ff] border-[#c0c1ff]/30"
                          )}
                        >
                          {p.tier}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[#908fa0]">
                        <span className="text-white font-semibold">{p.passId}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {p.checkedIn ? (
                          <div className="flex items-center gap-1.5 text-[#10b981]">
                            <span className="material-symbols-outlined text-sm">
                              check_circle
                            </span>
                            <span>{p.checkInTime || "Admitted"}</span>
                            {p.checkInGate && (
                              <span className="text-[#908fa0] text-[10px]">
                                ({p.checkInGate.split(" • ")[0]})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#908fa0] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#52555f]" />
                            Pending Ingress
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/${eventId}/passes`}
                            className="p-1 rounded hover:bg-[#282a30] text-[#908fa0] hover:text-[#4cd7f6] transition-colors"
                            title="Inspect Holographic Pass"
                          >
                            <span className="material-symbols-outlined text-base">
                              id_card
                            </span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleAction(p)}
                            className={cn(
                              "px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all border",
                              p.checkedIn
                                ? "bg-[#282a30] text-[#908fa0] border-[rgba(255,255,255,0.06)] hover:bg-[#33353b]"
                                : "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40 hover:bg-[#10b981]/30"
                            )}
                          >
                            {p.checkedIn ? "Undo" : "Check In"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[#14161a] text-xs font-mono text-[#908fa0]">
            <div>
              Showing {participants.length} of {total} records
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-[#20232a] disabled:opacity-40 hover:bg-[#282a30] text-white"
              >
                Previous
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-[#20232a] disabled:opacity-40 hover:bg-[#282a30] text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Format Spreadsheet Import Wizard (CSV & XLSX with Column Mapping) */}
      <SpreadsheetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        eventId={eventId}
        onImportComplete={fetchParticipants}
        getAuthHeaders={getAuthHeaders}
      />
    </AppShell>
  );
}
