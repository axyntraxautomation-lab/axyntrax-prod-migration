/**
 * Mini agenda semanal con conteo real de citas por día.
 *
 * Trae las citas de la semana actual desde `/api/tenant/citas?desde&hasta`
 * y muestra un badge con el número de citas por cada día. Se mantiene
 * sincronizado en vivo gracias a `useRealtimeRefetch(tenant_citas_servicios)`.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { apiGet, type Cita } from "@/lib/api";
import { useRealtimeRefetch } from "@/hooks/useRealtimeBus";

const DIAS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function semanaActualRange(): { dias: { fecha: Date; etiqueta: string; key: string }[]; desde: string; hasta: string } {
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(hoy.getDate() - hoy.getDay());
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return {
      fecha: d,
      etiqueta: DIAS_ES[d.getDay()]!,
      key: d.toISOString().slice(0, 10),
    };
  });
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 7);
  return { dias, desde: inicio.toISOString(), hasta: fin.toISOString() };
}

export function AgendaCalendar() {
  const { dias, desde, hasta } = semanaActualRange();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const hoyKey = new Date().toDateString();

  const refetch = useCallback(() => {
    apiGet<{ items: Cita[] }>(
      `/api/tenant/citas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
    )
      .then((d) => {
        const map: Record<string, number> = {};
        for (const c of d.items) {
          const k = c.fechaInicio.slice(0, 10);
          map[k] = (map[k] ?? 0) + 1;
        }
        setCounts(map);
      })
      .catch(() => {
        // mantener estado anterior
      });
  }, [desde, hasta]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeRefetch(["tenant_citas_servicios"], refetch);

  return (
    <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Agenda</h3>
        <Link
          href={`/t/${slug}/agenda`}
          className="text-[11px] font-medium text-gray-500 hover:underline"
          style={{ color: "var(--color-primario)" }}
        >
          Ver semana →
        </Link>
      </header>
      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((d) => {
          const esHoy = d.fecha.toDateString() === hoyKey;
          const n = counts[d.key] ?? 0;
          return (
            <Link
              key={d.fecha.toISOString()}
              href={`/t/${slug}/agenda`}
              className="flex flex-col items-center rounded-lg border border-gray-100 px-1 py-2 hover:bg-gray-50"
              style={
                esHoy
                  ? {
                      borderColor: "var(--color-primario)",
                      background:
                        "color-mix(in srgb, var(--color-primario) 8%, white)",
                    }
                  : {}
              }
            >
              <span className="text-[10px] font-medium uppercase text-gray-400">
                {d.etiqueta}
              </span>
              <span
                className="text-base font-bold"
                style={{ color: esHoy ? "var(--color-primario)" : "#111827" }}
              >
                {d.fecha.getDate()}
              </span>
              {n > 0 ? (
                <span
                  className="mt-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: "var(--color-primario)" }}
                  data-testid={`agenda-count-${d.key}`}
                >
                  {n}
                </span>
              ) : (
                <span className="mt-0.5 text-[10px] text-gray-300">—</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
