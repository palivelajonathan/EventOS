"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DYNAMITE_2026, MOCK_PARTICIPANTS, Participant } from "@/lib/data/dynamite2026";
import { Card, LiveBeacon, StatusPill, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/authContext";

interface CertificateItem {
  id: string;
  certNumber: string;
  participantId: string;
  name: string;
  college: string;
  type: "PARTICIPATION" | "HONORS" | "HACKATHON_WINNER" | "SPEAKER";
  sha256Hash: string;
  issuedAt: string;
  verifiedCount: number;
}

export default function CertificatesManagementPage() {
  const params = useParams();
  const eventId = (params?.eventId as string) || "evt_dynamite2026";

  const initialCerts: CertificateItem[] = [
    {
      id: "cert_01",
      certNumber: "CERT-DYN-2026-88912",
      participantId: "p_001",
      name: "Aryan Varma",
      college: "CBIT Hyderabad",
      type: "HONORS",
      sha256Hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      issuedAt: "Oct 8, 2026 12:15 PM",
      verifiedCount: 14,
    },
    {
      id: "cert_02",
      certNumber: "CERT-DYN-2026-88913",
      participantId: "p_002",
      name: "Priya Sundaram",
      college: "Vasavi College",
      type: "PARTICIPATION",
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      issuedAt: "Oct 8, 2026 12:14 PM",
      verifiedCount: 8,
    },
    {
      id: "cert_03",
      certNumber: "CERT-DYN-2026-88914",
      participantId: "p_003",
      name: "Karthik Reddy",
      college: "VNR VJIET",
      type: "HACKATHON_WINNER",
      sha256Hash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      issuedAt: "Oct 8, 2026 12:10 PM",
      verifiedCount: 32,
    },
    {
      id: "cert_04",
      certNumber: "CERT-DYN-2026-88915",
      participantId: "p_004",
      name: "Sana Sheikh",
      college: "Osmania Univ",
      type: "PARTICIPATION",
      sha256Hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      issuedAt: "Oct 8, 2026 12:08 PM",
      verifiedCount: 5,
    },
    {
      id: "cert_05",
      certNumber: "CERT-DYN-2026-88916",
      participantId: "p_005",
      name: "Rahul Nambiar",
      college: "BITS Pilani Hyd",
      type: "HACKATHON_WINNER",
      sha256Hash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
      issuedAt: "Oct 8, 2026 12:05 PM",
      verifiedCount: 19,
    },
  ];

  const { getAuthHeaders } = useAuth();
  const [certificates, setCertificates] = useState<CertificateItem[]>(initialCerts);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMintingBatch, setIsMintingBatch] = useState(false);
  const [mintProgress, setMintProgress] = useState(842);
  const [totalEligible, setTotalEligible] = useState(1086);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCerts() {
      try {
        const res = await fetch(`/api/certificates?eventId=${eventId}`, {
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.certificates && json.certificates.length > 0) {
            setCertificates(json.certificates);
            setTotalEligible(json.total || 1086);
          }
        }
      } catch (err) {
        console.error("Failed to load certificates:", err);
      }
    }
    loadCerts();
  }, [eventId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBatchMint = () => {
    setIsMintingBatch(true);
    showToast("Generating verified credentials (SHA-256)...");

    let current = mintProgress;
    const interval = setInterval(() => {
      current += 48;
      if (current >= totalEligible) {
        current = totalEligible;
        clearInterval(interval);
        setIsMintingBatch(false);
        showToast("Batch issuance complete! Credentials published to verified registry.");
      }
      setMintProgress(current);
    }, 180);
  };

  const filtered = certificates.filter((c) => {
    const matchType = filterType === "ALL" || c.type === filterType;
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-[#1a1e28] border border-[rgba(128,131,255,0.4)] text-white text-xs font-mono flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
            verified_user
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              CREDENTIAL_VAULT // CERTIFICATES
            </h1>
            <LiveBeacon color="cyan" pulse label="VERIFIED DATABASE REGISTRY" />
          </div>
          <p className="text-xs text-[#8e909a] mt-1 font-mono">
            Issue, revoke, and verify tamper-proof attendance & excellence credentials with database SHA-256 verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              window.open(`/api/export?eventId=${eventId}&type=certificates`, "_blank");
              showToast("Exporting certificate credential ledger as CSV...");
            }}
            className="px-3 py-2 rounded-xl text-xs font-mono text-[#c0c1ff] bg-[#282a30] hover:bg-[#33353b] border border-[rgba(255,255,255,0.08)] flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Ledger (CSV)
          </button>

          <Link
            href="/verify/cert_dyn_88912"
            target="_blank"
            className="px-3 py-2 rounded-xl text-xs font-mono text-[#4cd7f6] bg-[#4cd7f6]/10 hover:bg-[#4cd7f6]/20 border border-[#4cd7f6]/30 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-xs">open_in_new</span>
            Public Gateway Demo
          </Link>

          <Button
            variant="primary"
            size="sm"
            disabled={isMintingBatch || mintProgress >= totalEligible}
            onClick={handleBatchMint}
            className="text-xs"
          >
            <span className="material-symbols-outlined text-xs mr-1">
              {isMintingBatch ? "hourglass_top" : "token"}
            </span>
            {isMintingBatch
              ? `Signing (${mintProgress}/${totalEligible})...`
              : mintProgress >= totalEligible
              ? "All Checked-In Minted"
              : `Mint Pending (${totalEligible - mintProgress})`}
          </Button>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-1">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            MINTED CREDENTIALS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              {mintProgress}
            </span>
            <span className="text-xs font-mono text-[#4cd7f6]">
              {Math.round((mintProgress / totalEligible) * 100)}%
            </span>
          </div>
          <div className="w-full h-1 bg-[#1a1e28] rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-[#8083ff] rounded-full transition-all duration-300"
              style={{ width: `${(mintProgress / totalEligible) * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-1">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            ELIGIBLE ATTENDEES
          </span>
          <span className="text-2xl font-bold font-mono text-white">
            {totalEligible}
          </span>
          <span className="text-[10px] font-mono text-[#8e909a] block">
            Validated at gates
          </span>
        </Card>

        <Card className="p-4 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-1">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            PUBLIC AUDIT SCANS
          </span>
          <span className="text-2xl font-bold font-mono text-[#4cd7f6]">
            1,489
          </span>
          <span className="text-[10px] font-mono text-[#8e909a] block">
            LinkedIn & recruiter verifications
          </span>
        </Card>

        <Card className="p-4 bg-[#111319] border-[rgba(255,255,255,0.06)] space-y-1">
          <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block">
            REVOCATION RATE
          </span>
          <span className="text-2xl font-bold font-mono text-[#6be794]">
            0.00%
          </span>
          <span className="text-[10px] font-mono text-[#8e909a] block">
            0 certificates flagged
          </span>
        </Card>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 bg-[#111319] rounded-2xl border border-[rgba(255,255,255,0.06)]">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8e909a] text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, college, or hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161a24] text-xs font-mono text-white pl-9 pr-4 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-[#8083ff]"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "PARTICIPATION", "HONORS", "HACKATHON_WINNER"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap",
                filterType === type
                  ? "bg-[#8083ff] text-white shadow-sm"
                  : "text-[#8e909a] hover:text-white hover:bg-[#1a1e28]"
              )}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Registry Table */}
      <Card className="bg-[#111319] border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#0c0e14]">
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-[#8e909a]">
                  CREDENTIAL / PARTICIPANT
                </th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-[#8e909a]">
                  COLLEGE / INSTITUTION
                </th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-[#8e909a]">
                  TYPE
                </th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-[#8e909a]">
                  SHA-256 LEDGER HASH
                </th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-[#8e909a]">
                  AUDIT VISITS
                </th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-[#8e909a] text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs font-mono">
              {filtered.map((cert) => (
                <tr key={cert.id} className="hover:bg-[#161a24] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{cert.name}</div>
                    <div className="text-[11px] text-[#8e909a] tracking-wider">
                      {cert.certNumber}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-[#c5c6d3]">
                    {cert.college}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-mono font-bold border",
                        cert.type === "HACKATHON_WINNER"
                          ? "bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/30"
                          : cert.type === "HONORS"
                          ? "bg-[#8083ff]/15 text-[#8083ff] border-[#8083ff]/30"
                          : "bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30"
                      )}
                    >
                      {cert.type.replace("_", " ")}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[#8e909a]">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-[#8083ff] font-semibold">
                        {cert.sha256Hash.slice(0, 10)}
                      </span>
                      <span>...{cert.sha256Hash.slice(-8)}</span>
                      <button
                        onClick={() => showToast(`Hash copied: ${cert.sha256Hash}`)}
                        className="material-symbols-outlined text-[14px] hover:text-white transition-colors"
                        title="Copy full SHA-256 hash"
                      >
                        content_copy
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-[#c5c6d3]">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#6be794]">
                        visibility
                      </span>
                      {cert.verifiedCount}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      href={`/verify/${cert.certNumber.toLowerCase()}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1f2330] hover:bg-[#8083ff] text-white text-[11px] transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">
                        verified
                      </span>
                      Verify
                    </Link>
                    <button
                      onClick={() => showToast(`Generating PDF certificate for ${cert.name}...`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1f2330] hover:bg-[#2e3447] text-[#c5c6d3] text-[11px] transition-colors"
                      title="Download PDF"
                    >
                      <span className="material-symbols-outlined text-xs">
                        download
                      </span>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
