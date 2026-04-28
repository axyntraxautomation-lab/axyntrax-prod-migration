/**
 * Banner discreto que se muestra cuando la conexión Realtime al backend
 * Supabase pierde estado (típicamente por expiración del JWT). Junto con
 * `TenantProvider.onTokenExpired` que dispara una rotación inmediata, el
 * usuario ve "Reconectando…" durante el reauth y luego desaparece.
 */
import { useEffect, useState } from "react";
import {
  getRealtimeStatus,
  onRealtimeStatus,
  type RealtimeStatus,
} from "@/lib/supabase";

export function RealtimeStatusBanner() {
  const [status, setStatus] = useState<RealtimeStatus>(getRealtimeStatus());

  useEffect(() => {
    return onRealtimeStatus((s) => setStatus(s));
  }, []);

  if (status === "ok") return null;

  const reconnecting = status === "reconnecting";
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="rt-status-banner"
      className="fixed left-1/2 top-3 z-[80] -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-medium shadow-md"
      style={{
        background: reconnecting ? "#fef3c7" : "#fee2e2",
        color: reconnecting ? "#92400e" : "#991b1b",
        border: reconnecting ? "1px solid #fcd34d" : "1px solid #fecaca",
      }}
    >
      {reconnecting ? (
        <span>Reconectando con el servidor…</span>
      ) : (
        <span>Sin conexión en vivo. Refresca la página para reintentar.</span>
      )}
    </div>
  );
}
