import logoSrc from "@assets/WhatsApp_Image_2026-04-16_at_10.25.07_PM_1777171897664.jpeg";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
  xl: "h-28",
  hero: "h-40 md:h-48",
} as const;

type Size = keyof typeof SIZES;

export function BrandLogo({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <img
      src={logoSrc}
      alt="AXYNTRAX Automation"
      className={cn(
        "block w-auto select-none rounded-2xl bg-white object-contain p-1 shadow-[0_10px_30px_-10px_rgba(34,211,238,0.55)] ring-1 ring-white/10",
        SIZES[size],
        className,
      )}
      draggable={false}
    />
  );
}
