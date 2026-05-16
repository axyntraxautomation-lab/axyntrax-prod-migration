import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarProps = {
  size?: "sm" | "md" | "lg" | "xl";
  pulse?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
};

export function JarvisAvatar({ size = "md", pulse = false, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        "border border-cyan-300/40 bg-slate-950/70 font-mono font-semibold tracking-[0.18em] text-cyan-200",
        "shadow-[inset_0_0_18px_rgba(34,211,238,0.18)]",
        sizeMap[size],
        pulse && "animate-pulse-ring",
        className,
      )}
      aria-label="JARVIS"
    >
      <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-400/20 via-transparent to-violet-500/20" />
      <span className="relative">JX</span>
    </span>
  );
}

export function CeciliaAvatar({ size = "md", pulse = false, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        "border border-rose-300/40 bg-slate-950/70 font-mono font-semibold tracking-[0.18em] text-rose-200",
        "shadow-[inset_0_0_18px_rgba(244,114,182,0.18)]",
        sizeMap[size],
        pulse && "animate-pulse-ring",
        className,
      )}
      aria-label="Cecilia"
    >
      <span aria-hidden className="absolute inset-1 rounded-full bg-gradient-to-br from-rose-400/20 via-transparent to-violet-500/20" />
      <span className="relative">CX</span>
    </span>
  );
}
