import * as React from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  actions?: React.ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  actions,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        align === "left" && actions && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-3", align === "center" && "items-center")}>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]" aria-hidden />
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl md:text-[2.6rem]">
          {title}
        </h2>
        {description && (
          <p className={cn("max-w-2xl text-base leading-relaxed text-slate-400", align === "center" && "mx-auto")}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
