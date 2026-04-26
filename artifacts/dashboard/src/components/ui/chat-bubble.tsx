import * as React from "react";
import { cn } from "@/lib/utils";
import { JarvisAvatar } from "./jarvis-avatar";

type ChatBubbleProps = {
  role: "user" | "assistant" | "system";
  children: React.ReactNode;
  meta?: React.ReactNode;
  showAvatar?: boolean;
  className?: string;
};

export function ChatBubble({ role, children, meta, showAvatar = true, className }: ChatBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  if (isSystem) {
    return (
      <div className={cn("mx-auto max-w-md text-center text-xs text-slate-500", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full items-end gap-2", isUser ? "flex-row-reverse" : "flex-row", className)}>
      {showAvatar && !isUser && <JarvisAvatar size="sm" />}
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-slate-800/80 text-slate-100 border border-white/5 rounded-br-md"
            : "bg-cyan-400/10 text-cyan-50 border border-cyan-400/20 rounded-bl-md shadow-[0_8px_30px_-12px_rgba(34,211,238,0.4)]",
        )}
      >
        <div className="whitespace-pre-wrap break-words">{children}</div>
        {meta && <div className="mt-1.5 text-[10px] text-slate-400">{meta}</div>}
      </div>
    </div>
  );
}

export function ChatTypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <JarvisAvatar size="sm" />
      <div className="rounded-2xl rounded-bl-md border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
        </div>
      </div>
    </div>
  );
}
