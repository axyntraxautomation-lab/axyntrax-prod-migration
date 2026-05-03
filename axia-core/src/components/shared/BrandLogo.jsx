import React from 'react'

/**
 * Official AxyntraX Automation Logo
 * Design: "Axyntra" (Black) + "X" (Turquoise with outward arrows) + "Automation" (Below)
 */
export function BrandLogo({ className = "", size = "md", light = false }) {
  const sizes = {
    sm: { scale: 0.8, text: "text-lg", subtext: "text-[8px]" },
    md: { scale: 1, text: "text-2xl", subtext: "text-[10px]" },
    lg: { scale: 1.5, text: "text-4xl", subtext: "text-[12px]" },
    xl: { scale: 2.5, text: "text-6xl", subtext: "text-[16px]" }
  }

  const currentSize = sizes[size] || sizes.md

  return (
    <div className={`flex flex-col items-center justify-center leading-none ${className}`}>
      <div className="flex items-center gap-0.5">
        <span className={`font-black tracking-tighter ${light ? 'text-white' : 'text-black'} ${currentSize.text} uppercase`}>
          Axyntra
        </span>
        <div className="relative flex items-center justify-center">
          {/* Stylized Turquoise X */}
          <span className={`font-black italic ${currentSize.text} text-[#00BCD4] select-none`}>
            X
          </span>
          {/* Outward Arrows (Geometric) */}
          <svg 
            viewBox="0 0 24 24" 
            className="absolute inset-0 w-full h-full text-[#00BCD4] opacity-40 scale-125"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M7 7l-2-2M17 7l2-2M7 17l-2 2M17 17l2 2" />
          </svg>
        </div>
      </div>
      <span className={`font-bold tracking-[0.4em] ${light ? 'text-white/60' : 'text-slate-500'} ${currentSize.subtext} uppercase -mt-1 ml-1`}>
        Automation
      </span>
    </div>
  )
}
