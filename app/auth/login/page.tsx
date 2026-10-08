"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/authContext";
import { UserRole } from "@/lib/auth/roles";
import { LiveBeacon, Button, Input, Card } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard/evt_dynamite2026";
  const { signInWithPassword, switchRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signInWithPassword(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      if (email.includes("volunteer") || email.includes("gate")) {
        router.push("/volunteer/scan");
      } else {
        router.push(redirectUrl);
      }
    }
  };

  const handleRoleQuickSelect = (role: UserRole) => {
    switchRole(role);
    if (role === "VOLUNTEER" || role === "GATE_STAFF") {
      router.push("/volunteer/scan");
    } else if (role === "PARTICIPANT") {
      router.push("/dashboard/evt_dynamite2026/passes");
    } else {
      router.push("/dashboard/evt_dynamite2026");
    }
  };

  return (
    <Card className="p-6 bg-[#111319] border-[rgba(255,255,255,0.08)] shadow-2xl space-y-5">
      <div className="border-b border-[rgba(255,255,255,0.06)] pb-3">
        <h2 className="text-base font-bold font-mono text-white">
          AUTHENTICATE IDENTITY
        </h2>
        <p className="text-xs text-[#8e909a] font-mono mt-0.5">
          Enter credentials or select a verified test role profile
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#ff5555]/15 border border-[#ff5555]/30 text-xs font-mono text-[#ff8888] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[#8e909a]">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="name@college.ac.in or organizer@eventos.sh"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-xs font-mono bg-[#161a24]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-mono text-[#8e909a]">
              Password
            </label>
            <span className="text-[10px] font-mono text-[#8083ff] cursor-pointer hover:underline">
              Forgot?
            </span>
          </div>
          <Input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="text-xs font-mono bg-[#161a24]"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full text-xs font-mono justify-center py-2.5 mt-2"
        >
          {loading ? "Authenticating Session..." : "Authorize Access"}
        </Button>
      </form>

      {/* Quick Role Simulation (Testing & QA) */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2.5">
        <span className="text-[10px] font-mono text-[#8e909a] uppercase tracking-wider block text-center">
          DEMO ACCESS // INSTANT ROLE SELECT
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleRoleQuickSelect("ORGANIZER")}
            className="p-2.5 rounded-xl bg-[#161a24] hover:bg-[#8083ff]/20 hover:border-[#8083ff]/50 border border-[rgba(255,255,255,0.06)] text-left transition-all group"
          >
            <div className="text-[11px] font-bold font-mono text-white group-hover:text-[#8083ff]">
              Organizer
            </div>
            <div className="text-[10px] font-mono text-[#8e909a]">
              Full Command Center
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleQuickSelect("VOLUNTEER")}
            className="p-2.5 rounded-xl bg-[#161a24] hover:bg-[#4cd7f6]/20 hover:border-[#4cd7f6]/50 border border-[rgba(255,255,255,0.06)] text-left transition-all group"
          >
            <div className="text-[11px] font-bold font-mono text-white group-hover:text-[#4cd7f6]">
              Volunteer
            </div>
            <div className="text-[10px] font-mono text-[#8e909a]">
              Mobile Scanner HUD
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleQuickSelect("GATE_STAFF")}
            className="p-2.5 rounded-xl bg-[#161a24] hover:bg-[#6be794]/20 hover:border-[#6be794]/50 border border-[rgba(255,255,255,0.06)] text-left transition-all group"
          >
            <div className="text-[11px] font-bold font-mono text-white group-hover:text-[#6be794]">
              Gate Staff
            </div>
            <div className="text-[10px] font-mono text-[#8e909a]">
              Turnstile Console
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleQuickSelect("PARTICIPANT")}
            className="p-2.5 rounded-xl bg-[#161a24] hover:bg-[#c0c1ff]/20 hover:border-[#c0c1ff]/50 border border-[rgba(255,255,255,0.06)] text-left transition-all group"
          >
            <div className="text-[11px] font-bold font-mono text-white group-hover:text-[#c0c1ff]">
              Attendee
            </div>
            <div className="text-[10px] font-mono text-[#8e909a]">
              Digital Pass & Wallet
            </div>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08090d] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-[#8083ff]/30">
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#8083ff]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-[#8083ff] flex items-center justify-center text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(128,131,255,0.4)]">
              EO
            </span>
            <span className="text-xl font-bold font-mono tracking-tight text-white">
              EVENT<span className="text-[#8083ff]">OS</span>
            </span>
          </Link>
          <div className="flex items-center justify-center gap-2 pt-1">
            <LiveBeacon color="cyan" pulse label="SECURE ACCESS GATEWAY" />
          </div>
        </div>

        {/* Suspense-wrapped form */}
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs font-mono text-[#8e909a] bg-[#111319] rounded-2xl border border-[rgba(255,255,255,0.08)]">
              Loading Gateway...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
