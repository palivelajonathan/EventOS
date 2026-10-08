"use client";

import { motion } from "framer-motion";

export function OrbitalVisualization() {
  return (
    <div className="relative z-10 w-full max-w-6xl mt-12 pt-6">
      <div className="relative w-full rounded-2xl bg-[#191c21] p-6 lg:p-8 border border-[rgba(255,255,255,0.07)] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden min-h-[460px] flex flex-col justify-between">
        {/* Live Telemetry Stream Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4cd7f6] shadow-[0_0_10px_#4cd7f6]" />
            <span className="font-mono text-xs text-[#e2e2ea] uppercase tracking-wider font-semibold">
              EVENTOS KERNEL MATRIX // DUAL-CLUSTER RUNTIME
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-[#c7c4d7]">
            <span>
              PACKETS: <span className="text-[#4cd7f6] font-medium">9.84k/sec</span>
            </span>
            <span className="hidden sm:inline">
              CLOCK DRIFT: <span className="text-[#c0c1ff] font-medium">±0.4μs</span>
            </span>
            <span>
              NODES: <span className="text-[#e2e2ea] font-medium">7 HEALTHY</span>
            </span>
          </div>
        </div>

        {/* Central Orbit Visualization */}
        <div className="relative w-full h-[320px] flex items-center justify-center my-4 overflow-hidden">
          {/* Orbital Concentric SVG Rings */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40 text-[#464554]"
            viewBox="0 0 1000 400"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse
              cx="500"
              cy="200"
              fill="none"
              rx="420"
              ry="140"
              stroke="currentColor"
              strokeDasharray="3 6"
              strokeWidth="1"
            />
            <ellipse
              cx="500"
              cy="200"
              fill="none"
              rx="260"
              ry="85"
              stroke="currentColor"
              strokeDasharray="2 4"
              strokeWidth="1.2"
            />
            <line
              opacity="0.4"
              stroke="currentColor"
              strokeDasharray="4 8"
              strokeWidth="0.5"
              x1="500"
              x2="500"
              y1="20"
              y2="380"
            />
            <line
              opacity="0.4"
              stroke="currentColor"
              strokeDasharray="4 8"
              strokeWidth="0.5"
              x1="100"
              x2="900"
              y1="200"
              y2="200"
            />
          </svg>

          {/* Core Glowing Node */}
          <div className="relative z-20 flex flex-col items-center justify-center w-28 h-28 rounded-full bg-[#33353b] border border-[rgba(76,215,246,0.3)] shadow-[0_0_50px_rgba(76,215,246,0.35)] p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#03b5d3]/20 flex items-center justify-center text-[#4cd7f6] mb-1">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <span className="font-geist text-sm font-semibold tracking-tight text-[#e2e2ea] leading-none">
              CORE
            </span>
            <span className="font-mono text-[10px] text-[#4cd7f6] uppercase font-bold tracking-widest mt-0.5">
              RUNNING
            </span>
          </div>

          {/* Floating Orbiting Telemetry Nodes with smooth micro-animation */}
          {/* 01 REGISTRATION */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[6%] top-[18%] z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
            <span className="font-mono text-xs text-[#e2e2ea] font-medium">
              01 REGISTRATION
            </span>
            <span className="font-mono text-xs text-[#4cd7f6] pl-1 font-semibold">
              99.8%
            </span>
          </motion.div>

          {/* 02 PARTICIPANTS */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute left-[14%] bottom-[12%] z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] shadow-lg"
          >
            <span className="material-symbols-outlined text-xs text-[#c0c1ff]">groups</span>
            <span className="font-mono text-xs text-[#e2e2ea]">PARTICIPANTS</span>
            <span className="font-mono text-xs text-[#c7c4d7] font-medium">1,247</span>
          </motion.div>

          {/* 03 CHECK-IN */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute left-[36%] top-[8%] z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] shadow-lg"
          >
            <span className="material-symbols-outlined text-xs text-[#4cd7f6]">
              qr_code_scanner
            </span>
            <span className="font-mono text-xs text-[#e2e2ea]">CHECK-IN</span>
            <span className="font-mono text-xs text-[#4cd7f6] font-semibold">240ms</span>
          </motion.div>

          {/* 04 ANALYTICS */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute right-[34%] bottom-[8%] z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] shadow-lg"
          >
            <span className="material-symbols-outlined text-xs text-[#bdc2ff]">query_stats</span>
            <span className="font-mono text-xs text-[#e2e2ea]">ANALYTICS</span>
            <span className="font-mono text-xs text-[#bdc2ff] font-semibold">REAL-TIME</span>
          </motion.div>

          {/* 05 CERTIFICATES */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute right-[14%] top-[14%] z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] shadow-lg"
          >
            <span className="material-symbols-outlined text-xs text-[#c0c1ff]">
              verified_user
            </span>
            <span className="font-mono text-xs text-[#e2e2ea]">CERTIFICATES</span>
            <span className="font-mono text-xs text-[#c0c1ff] font-semibold">SHA-256</span>
          </motion.div>

          {/* 06 AI ENGINE */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute right-[4%] bottom-[22%] z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282a30] border border-[rgba(255,255,255,0.08)] shadow-lg"
          >
            <span className="material-symbols-outlined text-xs text-[#4cd7f6]">
              psychology
            </span>
            <span className="font-mono text-xs text-[#e2e2ea]">AI CO-PILOT</span>
            <span className="font-mono text-xs text-[#4cd7f6] font-semibold">AUTO</span>
          </motion.div>
        </div>

        {/* Telemetry Bottom Bar */}
        <div className="w-full pt-3 border-t border-[rgba(255,255,255,0.07)] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#c7c4d7]">
          <div className="flex items-center gap-4">
            <span>SPATIAL VECTOR: 44.1209 // 12.0093</span>
            <span className="text-[#464554]">•</span>
            <span>ENCRYPTION: HARDWARE AES-256</span>
          </div>
          <div className="flex items-center gap-2 text-[#4cd7f6]">
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
            <span>SIGNAL FEED CALIBRATED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
