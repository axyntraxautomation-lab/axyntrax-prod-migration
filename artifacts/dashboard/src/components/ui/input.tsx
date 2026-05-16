import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1 text-sm text-slate-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-500 hover:border-white/15 focus-visible:outline-none focus-visible:border-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
