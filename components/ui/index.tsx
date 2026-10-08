import * as React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────
   LiveBeacon
   Pinging dot animation — Stitch standard status indicator
   ────────────────────────────────────────────────────────── */
interface LiveBeaconProps {
  color?: "secondary" | "primary" | "live" | "warning" | "danger" | "cyan" | "purple";
  size?: "sm" | "md" | "lg";
  label?: string;
  pulse?: boolean;
  className?: string;
}

const beaconColorMap: Record<string, string> = {
  secondary: "bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]",
  cyan: "bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]",
  primary: "bg-[#c0c1ff] shadow-[0_0_8px_#c0c1ff]",
  purple: "bg-[#8083ff] shadow-[0_0_8px_#8083ff]",
  live: "bg-[#10B981] shadow-[0_0_8px_#10B981]",
  warning: "bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]",
  danger: "bg-[#EF4444] shadow-[0_0_8px_#EF4444]",
};

const beaconSizeMap = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

export function LiveBeacon({
  color = "secondary",
  size = "md",
  label,
  pulse = true,
  className,
}: LiveBeaconProps) {
  const mappedColor = beaconColorMap[color] || beaconColorMap.secondary;

  const beacon = (
    <span className={cn("relative flex items-center justify-center shrink-0", beaconSizeMap[size])}>
      {pulse && (
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-pill opacity-75",
            mappedColor.split(" ")[0]
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-pill",
          beaconSizeMap[size],
          mappedColor
        )}
      />
    </span>
  );

  if (label) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-xs font-mono font-medium text-[#c5c6d3]", className)}>
        {beacon}
        <span>{label}</span>
      </span>
    );
  }

  return <span className={className}>{beacon}</span>;
}

/* ──────────────────────────────────────────────────────────
   StatusPill
   Semantic chip — LIVE / STANDBY / LOCKED / ACTIVE
   ────────────────────────────────────────────────────────── */
interface StatusPillProps {
  label: string;
  variant?: "live" | "standby" | "locked" | "primary" | "secondary" | "error" | "default" | "critical";
  status?: "live" | "standby" | "locked" | "primary" | "secondary" | "error" | "default" | "critical" | string;
  className?: string;
}

const pillVariantMap: Record<string, string> = {
  live: "bg-[#10B981]/15 text-[#10B981]",
  standby: "bg-[#F59E0B]/15 text-[#F59E0B]",
  locked: "bg-[#c0c1ff]/10 text-[#c0c1ff]",
  primary: "bg-[#c0c1ff]/10 text-[#c0c1ff]",
  secondary: "bg-[#4cd7f6]/10 text-[#4cd7f6]",
  error: "bg-[#93000a] text-[#ffdad6]",
  critical: "bg-[#ff5555]/20 text-[#ff7777] border border-[#ff5555]/30",
  default: "bg-[#1d2025] text-[#908fa0]",
};

export function StatusPill({ label, variant, status, className }: StatusPillProps) {
  const activeKey = (variant || status || "default") as string;
  const style = pillVariantMap[activeKey] || pillVariantMap.default;

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-label-sm font-mono uppercase font-semibold tracking-wide",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Button
   Stitch-spec button variants
   ────────────────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const buttonVariantMap = {
  primary: [
    "bg-[#8083ff] text-[#1000a9] font-medium",
    "shadow-[0_0_30px_rgba(128,131,255,0.4)] hover:shadow-[0_0_45px_rgba(128,131,255,0.6)]",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]",
    "hover:bg-[#c0c1ff] transition-all duration-200",
  ].join(" "),
  ghost: [
    "bg-[#282a30] text-[#e2e2ea]",
    "border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]",
    "hover:bg-[#33353b] transition-all duration-200",
  ].join(" "),
  destructive: [
    "bg-[#1A1114] text-[#EF4444]",
    "border border-[rgba(239,68,68,0.3)]",
    "hover:border-[rgba(239,68,68,0.5)] transition-all duration-200",
  ].join(" "),
  secondary: [
    "bg-[#282a30] text-[#4cd7f6]",
    "border border-[#4cd7f6]/20 hover:border-[#4cd7f6]/40",
    "transition-all duration-200",
  ].join(" "),
};

const buttonSizeMap = {
  sm: "px-3 py-1.5 text-label-sm gap-1",
  md: "px-4 py-2 text-body-sm gap-1.5",
  lg: "px-6 py-3 text-body-md gap-2",
};

export function Button({
  variant = "ghost",
  size = "md",
  leftIcon,
  rightIcon,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-mono",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98] transition-all duration-150",
        buttonVariantMap[variant],
        buttonSizeMap[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-sm animate-spin">
          progress_activity
        </span>
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
   Card
   Stitch-spec card surface
   ────────────────────────────────────────────────────────── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: "low" | "default" | "high";
  interactive?: boolean;
}

const cardElevationMap = {
  low: "bg-[#191c21]",
  default: "bg-[#1d2025]",
  high: "bg-[#282a30]",
};

export function Card({
  elevation = "low",
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[rgba(255,255,255,0.07)]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        cardElevationMap[elevation],
        interactive &&
          "cursor-pointer hover:border-[rgba(99,102,241,0.3)] transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(99,102,241,0.2)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Input
   Stitch-spec text input with recessed styling
   ────────────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: string; // material symbol name
  rightElement?: React.ReactNode;
  error?: string;
}

export function Input({
  leftIcon,
  rightElement,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative flex flex-col gap-1">
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="material-symbols-outlined absolute left-3 text-[#908fa0] text-base pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          className={cn(
            "w-full bg-[#090D13] rounded-lg border border-[rgba(255,255,255,0.1)]",
            "text-[#e2e2ea] text-body-md font-geist placeholder:text-[#908fa0]",
            "py-2 px-3 transition-all duration-150",
            "focus:outline-none focus:border-[#c0c1ff] focus:shadow-[0_0_0_2px_rgba(192,193,255,0.2)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            leftIcon && "pl-10",
            rightElement && "pr-10",
            error && "border-[#EF4444] focus:border-[#EF4444] focus:shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3">{rightElement}</div>
        )}
      </div>
      {error && (
        <p className="text-label-sm text-[#EF4444] font-mono">{error}</p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Badge
   Stitch data chip
   ────────────────────────────────────────────────────────── */
interface BadgeProps {
  label: string;
  color?: "primary" | "secondary" | "tertiary" | "outline";
  className?: string;
}

const badgeColorMap = {
  primary: "border-[#c0c1ff]/20 text-[#c0c1ff] bg-[#c0c1ff]/05",
  secondary: "border-[#4cd7f6]/20 text-[#4cd7f6] bg-[#4cd7f6]/05",
  tertiary: "border-[#bdc2ff]/20 text-[#bdc2ff] bg-[#bdc2ff]/05",
  outline: "border-[#464554] text-[#908fa0] bg-transparent",
};

export function Badge({ label, color = "outline", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded border text-label-sm font-mono uppercase tracking-wider",
        badgeColorMap[color],
        className
      )}
    >
      {label}
    </span>
  );
}
