import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { apiGet, apiSend, type Alerta } from "@/lib/api";
import { useRealtimeRefetch } from "@/hooks/useRealtimeBus";

/**
 * Mapea tipo+payload de la alerta a una ruta interna del tenant para que
 * el usuario pueda saltar al recurso afectado (cita, item de inventario,
 * pago QR pendiente, etc.).
 */
function recursoLink(
  slug: string,
  a: Alerta,
): { href: string; label: string } | null {
  const p = (a.payload ?? {}) as Record<string, unknown>;
  switch (a.tipo) {
    case "stock_bajo":
      return { href: `/t/${slug}/inventario`, label: "Ver inventario" };
    case "cita_proxima":
    case "cita_completada_sin_pago":
      return { href: `/t/${slug}/agenda`, label: "Ver agenda" };
    case "pago_pendiente_24h":
      return { href: `/t/${slug}/pagos`, label: "Ver pago" };
    case "dia_sin_ventas":
      return { href: `/t/${slug}/finanzas`, label: "Ver finanzas" };
    default:
      if (typeof p.cita_id === "string")
        return { href: `/t/${slug}/agenda`, label: "Ver agenda" };
      if (typeof p.item_id === "string")
        return { href: `/t/${slug}/inventario`, label: "Ver inventario" };
      if (typeof p.pago_id === "string")
        return { href: `/t/${slug}/pagos`, label: "Ver pago" };
      return null;
  }
}

const SEVERIDAD_STYLES: Record<string, { dot: string; chip: string; label: string }> = {
  critical: {
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 ring-red-200",
    label: "Crítica",
  },
  warning: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    label: "Importante",
  },
  info: {
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    label: "Aviso",
  },
};

const TIPO_LABEL: Record<string, string> = {
  stock_bajo: "Stock bajo",
  cita_proxima: "Cita próxima",
  pago_pendiente_24h: "Pago pendiente",
  cita_completada_sin_pago: "Cita sin pago",
  dia_sin_ventas: "Sin ventas hoy",
};

function tiempoRelativo(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function useAlertasUnreadCount(): {
  count: number;
  refetch: () => Promise<void>;
} {
  const [count, setCount] = useState(0);
  const refetch = useCallback(async () => {
    try {
      const data = await apiGet<{ items: Alerta[] }>(
        "/api/tenant/alertas?leida=false",
      );
      setCount(data.items.length);
    } catch {
      // Silencio: si falla, mantenemos el último valor.
    }
  }, []);
  useEffect(() => {
    void refetch();
  }, [refetch]);
  useRealtimeRefetch(["tenant_alertas"], () => {
    void refetch();
  });
  return { count, refetch };
}

export function AlertasDrawer({
  open,
  onClose,
  onCountChange,
}: {
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}) {
  const [items, setItems] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [, setLocation] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ items: Alerta[] }>(
        "/api/tenant/alertas?leida=false",
      );
      setItems(data.items);
      onCountChange?.(data.items.length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useRealtimeRefetch(["tenant_alertas"], () => {
    if (open) void load();
  });

  const ordenadas = useMemo(
    () =>
      [...items].sort((a, b) => {
        const sevOrder = (s: string) =>
          s === "critical" ? 0 : s === "warning" ? 1 : 2;
        const d = sevOrder(a.severidad) - sevOrder(b.severidad);
        if (d !== 0) return d;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [items],
  );

  const marcarLeida = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await apiSend<unknown>("PATCH", `/api/tenant/alertas/${id}`, { leida: true });
        const next = items.filter((it) => it.id !== id);
        setItems(next);
        onCountChange?.(next.length);
      } catch {
        // ignore
      } finally {
        setBusyId(null);
      }
    },
    [items, onCountChange],
  );

  const marcarTodas = useCallback(async () => {
    if (items.length === 0) return;
    setBusyAll(true);
    try {
      await apiSend<{ marcadas: number }>(
        "POST",
        "/api/tenant/alertas/marcar-todas-leidas",
      );
      setItems([]);
      onCountChange?.(0);
    } catch {
      // ignore
    } finally {
      setBusyAll(false);
    }
  }, [items.length, onCountChange]);

  const irRecurso = useCallback(
    (a: Alerta) => {
      const link = recursoLink(slug, a);
      if (!link) return;
      onClose();
      setLocation(link.href);
    },
    [setLocation, onClose, slug],
  );

  return (
    <>
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Bandeja de alertas"
        aria-modal="true"
        data-testid="alertas-drawer"
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(92vw,380px)] flex-col bg-white shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header
          className="flex items-center justify-between border-b px-4 py-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-primario) 30%, #e5e7eb)",
          }}
        >
          <h2 className="text-sm font-semibold text-gray-900">
            Bandeja de alertas
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void marcarTodas()}
              disabled={busyAll || items.length === 0}
              className="rounded-lg px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              data-testid="btn-marcar-todas"
            >
              {busyAll ? "Marcando…" : "Marcar todas"}
            </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar bandeja"
            data-testid="btn-cerrar-alertas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading && items.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-gray-500">
              Cargando alertas…
            </p>
          ) : ordenadas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
              <p className="text-sm font-medium text-gray-700">
                No tienes alertas abiertas
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Cecilia te avisará apenas detecte algo importante.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {ordenadas.map((a) => {
                const sev = SEVERIDAD_STYLES[a.severidad] ?? SEVERIDAD_STYLES.info;
                const tipoLabel = TIPO_LABEL[a.tipo] ?? a.tipo;
                return (
                  <li
                    key={a.id}
                    data-testid={`alerta-${a.tipo}`}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${sev!.dot}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${sev!.chip}`}
                          >
                            {sev!.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">
                            {tipoLabel}
                          </span>
                          <span className="ml-auto text-[10px] text-gray-400">
                            {tiempoRelativo(a.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {a.titulo}
                        </p>
                        {a.detalle ? (
                          <p className="mt-0.5 text-xs text-gray-600">
                            {a.detalle}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-end gap-1">
                          {(() => {
                            const link = recursoLink(slug, a);
                            if (!link) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => irRecurso(a)}
                                className="rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-gray-100"
                                style={{ color: "var(--color-primario)" }}
                                data-testid={`btn-ver-recurso-${a.id}`}
                              >
                                {link.label}
                              </button>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => void marcarLeida(a.id)}
                            disabled={busyId === a.id}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            data-testid={`btn-marcar-leida-${a.id}`}
                          >
                            {busyId === a.id ? "Guardando…" : "Marcar como leída"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
