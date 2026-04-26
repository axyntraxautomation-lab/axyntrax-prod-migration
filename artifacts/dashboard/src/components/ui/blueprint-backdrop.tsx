import * as React from "react";
import { cn } from "@/lib/utils";

type BlueprintBackdropProps = React.HTMLAttributes<HTMLDivElement> & {
  intensity?: "subtle" | "default" | "vivid";
  withMesh?: boolean;
  animated?: boolean;
};

export function BlueprintBackdrop({
  className,
  intensity = "default",
  withMesh = true,
  animated = false,
  children,
  ...rest
}: BlueprintBackdropProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)} {...rest}>
      {withMesh && (
        <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh-cyan opacity-90" aria-hidden />
      )}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-blueprint",
          animated && "animate-grid-drift",
          intensity === "subtle" && "opacity-30",
          intensity === "default" && "opacity-60",
          intensity === "vivid" && "opacity-90",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
      />
      {children}
    </div>
  );
}
