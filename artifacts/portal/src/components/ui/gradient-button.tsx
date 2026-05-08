import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type GradientButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "soft";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  loading?: boolean;
};

const sizeMap = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  function GradientButton(
    { className, variant = "primary", size = "md", asChild = false, loading, children, disabled, ...rest },
    ref,
  ) {
    const Comp: React.ElementType = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-full font-medium",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-[0.98]",
          sizeMap[size],
          variant === "primary" && [
            "text-slate-950 font-semibold",
            "gradient-cyan-violet",
            "shadow-[0_8px_30px_-10px_rgba(34,211,238,0.55)]",
            "hover:shadow-[0_12px_40px_-8px_rgba(34,211,238,0.7)]",
            "hover:brightness-110",
          ],
          variant === "outline" && [
            "border border-cyan-400/30 bg-white/[0.03] text-cyan-100",
            "hover:bg-cyan-400/10 hover:border-cyan-300/50",
          ],
          variant === "ghost" && [
            "bg-transparent text-slate-200",
            "hover:bg-white/[0.04] hover:text-cyan-100",
          ],
          variant === "soft" && [
            "bg-cyan-400/10 text-cyan-100 border border-cyan-400/20",
            "hover:bg-cyan-400/15",
          ],
          className,
        )}
        {...rest}
      >
        {children}
      </Comp>
    );
  },
);
