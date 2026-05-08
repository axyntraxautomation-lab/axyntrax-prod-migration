import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

type EmptyPremiumProps = {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyPremium({ icon, title, description, action, className }: EmptyPremiumProps) {
  return (
    <GlassCard
      tone="default"
      border="soft"
      className={cn("flex flex-col items-center justify-center gap-4 px-6 py-14 text-center", className)}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[inset_0_0_18px_rgba(34,211,238,0.15)]">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg font-semibold text-slate-100">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </GlassCard>
  );
}
