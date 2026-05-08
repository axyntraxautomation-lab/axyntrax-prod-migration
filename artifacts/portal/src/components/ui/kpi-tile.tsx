import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

type KpiTileProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: { value: string; tone?: "up" | "down" | "neutral" };
  icon?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function KpiTile({ label, value, hint, delta, icon, className, align = "left" }: KpiTileProps) {
  return (
    <GlassCard
      tone="default"
      border="gradient"
      className={cn(
        "px-5 py-5 sm:px-6 sm:py-6 transition-all duration-300",
        "hover:-translate-y-0.5 hover:glow-cyan-sm",
        className,
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", align === "center" && "flex-col items-center text-center")}>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            {label}
          </span>
          <div className="font-display text-3xl font-semibold leading-none text-slate-50 sm:text-4xl">
            {value}
          </div>
          {hint && <span className="mt-1 text-xs text-slate-400">{hint}</span>}
          {delta && (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                delta.tone === "up" && "text-emerald-300",
                delta.tone === "down" && "text-rose-300",
                (!delta.tone || delta.tone === "neutral") && "text-slate-300",
              )}
            >
              {delta.value}
            </span>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
