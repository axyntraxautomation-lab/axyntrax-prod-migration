import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "strong" | "raised";
  glow?: "none" | "cyan" | "violet";
  border?: "default" | "gradient" | "soft";
  asChild?: boolean;
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { className, tone = "default", glow = "none", border = "default", children, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl",
          tone === "default" && "glass",
          tone === "strong" && "glass-strong",
          tone === "raised" && "glass-strong shadow-2xl",
          border === "gradient" && "gradient-border",
          border === "soft" && "border border-white/10",
          glow === "cyan" && "glow-cyan-sm",
          glow === "violet" && "glow-violet",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
