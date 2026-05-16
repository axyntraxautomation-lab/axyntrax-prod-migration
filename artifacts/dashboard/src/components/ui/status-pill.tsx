import * as React from "react";
import { cn } from "@/lib/utils";

type StatusPillProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "info" | "success" | "warn" | "danger" | "neutral" | "violet";
  dot?: boolean;
  size?: "sm" | "md";
};

const toneMap: Record<NonNullable<StatusPillProps["tone"]>, { bg: string; text: string; border: string; dot: string }> = {
  info:    { bg: "bg-cyan-400/10",   text: "text-cyan-100",   border: "border-cyan-400/30",   dot: "bg-cyan-300" },
  success: { bg: "bg-emerald-400/10", text: "text-emerald-100", border: "border-emerald-400/30", dot: "bg-emerald-300" },
  warn:    { bg: "bg-amber-400/10",  text: "text-amber-100",  border: "border-amber-400/30",  dot: "bg-amber-300" },
  danger:  { bg: "bg-rose-400/10",   text: "text-rose-100",   border: "border-rose-400/30",   dot: "bg-rose-300" },
  neutral: { bg: "bg-white/[0.04]",  text: "text-slate-300",  border: "border-white/10",      dot: "bg-slate-300" },
  violet:  { bg: "bg-violet-400/10", text: "text-violet-100", border: "border-violet-400/30", dot: "bg-violet-300" },
};

export function StatusPill({
  className,
  tone = "info",
  dot = true,
  size = "sm",
  children,
  ...rest
}: StatusPillProps) {
  const t = toneMap[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" && "px-2.5 py-0.5 text-[11px]",
        size === "md" && "px-3 py-1 text-xs",
        t.bg, t.text, t.border,
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} aria-hidden />}
      {children}
    </span>
  );
}
