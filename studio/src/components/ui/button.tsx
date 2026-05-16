import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", size = "default", ...props }, ref) => {
    const sizeClass = size === "sm" ? "h-8 px-3 text-xs" : size === "lg" ? "h-12 px-8" : "h-10 px-4 py-2";
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 ${sizeClass} ${className} bg-cyan-600 hover:bg-cyan-500 text-white`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
