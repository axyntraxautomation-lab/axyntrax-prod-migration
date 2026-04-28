import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import { useTenantReady } from "@/providers/TenantProvider";
import {
  ApiError,
  apiGet,
  apiSend,
  type Cita,
  type ClienteFinal,
  type ServicioItem,
} from "@/lib/api";
import { getTerminologia } from "@/lib/rubro-terminologia";

const ESTADOS = [
  "agendada",
  "pendiente",
  "en_curso",
  "completada",
  "cancelada",
] as const;

const FormSchema = z.object({
  clienteFinalId: z.string().uuid().optional(),
  servicioId: z.string().uuid().optional(),
  titulo: z.string().trim().max(200).optional(),
  fechaInicio: z.string().min(1, "Fecha obligatoria"),
  duracionMin: z.number().int().min(0).max(24 * 60).optional(),
  estado: z.enum(ESTADOS),
  notas: z.string().trim().max(2000).optional(),
});

type FormState = {
  id: string | null;
  clienteFinalId: string;
  servicioId: string;
  titulo: string;
  fechaInicio: string; // datetime-local
  duracionMin: string;
  estado: (typeof ESTADOS)[number];
  notas: string;
};

const EMPTY: FormState = {
  id: null,
  clienteFinalId: "",
  servicioId: "",
  titulo: "",
  fechaInicio: defaultDateTimeLocal(),
  duracionMin: "30",
  estado: "agendada",
  notas: "",
};

function defaultDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function Agenda() {
  const me = useTenantReady();
  const term = getTerminologia(me.tenant.rubroId);
  const [items, setItems] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<ClienteFinal[]>([]);
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const desde = new Date();
      desde.setDate(desde.getDate() - 7);
      const [citas, cls, srvs] = await Promise.all([
        apiGet<{ items: Cita[] }>(
          `/api/tenant/citas?desde=${encodeURIComponent(desde.toISOString())}`,
        ),
        apiGet<{ items: ClienteFinal[] }>("/api/tenant/clientes"),
        apiGet<{ items: ServicioItem[] }>("/api/tenant/servicios"),
      ]);
      setItems(citas.items);
      setClientes(cls.items);
      setServicios(srvs.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cargar la agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit() {
    if (!form) return;
    const parsed = FormSchema.safeParse({
      clienteFinalId: form.clienteFinalId || undefined,
      servicioId: form.servicioId || undefined,
      titulo: form.titulo || undefined,
      fechaInicio: form.fechaInicio,
      duracionMin: form.duracionMin === "" ? undefined : Number(form.duracionMin),
      estado: form.estado,
      notas: form.notas || undefined,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const inicio = new Date(parsed.data.fechaInicio);
      if (Number.isNaN(inicio.getTime())) {
        setErr("Fecha inválida");
        return;
      }
      const fin =
        parsed.data.duracionMin && parsed.data.duracionMin > 0
          ? new Date(inicio.getTime() + parsed.data.duracionMin * 60_000)
          : null;
      const body = {
        clienteFinalId: parsed.data.clienteFinalId,
        servicioId: parsed.data.servicioId,
        titulo: parsed.data.titulo,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin ? fin.toISOString() : null,
        estado: parsed.data.estado,
        notas: parsed.data.notas,
      };
      if (form.id) {
        await apiSend("PATCH", `/api/tenant/citas/${form.id}`, body);
      } else {
        await apiSend("POST", "/api/tenant/citas", body);
      }
      setForm(null);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo guardar la cita.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta cita?")) return;
    try {
      await apiSend("DELETE", `/api/tenant/citas/${id}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }

  const groups = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) =>
        new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime(),
    );
    const map = new Map<string, Cita[]>();
    for (const c of sorted) {
      const k = c.fechaInicio.slice(0, 10);
      const arr = map.get(k);
      if (arr) arr.push(c);
      else map.set(k, [c]);
    }
    return Array.from(map.entries());
  }, [items]);

  const clienteName = (id: string | null) =>
    id ? clientes.find((c) => c.id === id)?.nombre ?? "Cliente" : "Sin cliente";
  const servicioName = (id: string | null) =>
    id
      ? servicios.find((s) => s.id === id)?.nombre ?? "Servicio"
      : "Sin servicio";

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <header className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{term.agenda}</h1>
            <p className="text-xs text-gray-500">
              Tus citas, reservas o trabajos del día.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-nueva-cita"
          >
            Nueva
          </button>
        </header>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-center text-sm text-gray-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p
            className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
            data-testid="agenda-empty"
          >
            No hay citas agendadas en los últimos 7 días.
          </p>
        ) : (
          <div className="mt-3 space-y-4" data-testid="agenda-list">
            {groups.map(([day, list]) => (
              <section key={day}>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {new Date(day).toLocaleDateString("es-PE", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </h2>
                <ul className="mt-1 space-y-2">
                  {list.map((c) => {
                    const inicio = new Date(c.fechaInicio);
                    return (
                      <li
                        key={c.id}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2"
                        data-testid={`cita-${c.id}`}
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-gray-900">
                            {inicio.toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
                            {c.estado}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">
                          {servicioName(c.servicioId)} · {clienteName(c.clienteFinalId)}
                        </div>
                        {c.notas && (
                          <p className="mt-1 text-[11px] text-gray-600">{c.notas}</p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                id: c.id,
                                clienteFinalId: c.clienteFinalId ?? "",
                                servicioId: c.servicioId ?? "",
                                titulo: c.titulo ?? "",
                                fechaInicio: toLocal(inicio),
                                duracionMin: c.fechaFin
                                  ? String(
                                      Math.max(
                                        0,
                                        Math.round(
                                          (new Date(c.fechaFin).getTime() -
                                            inicio.getTime()) /
                                            60_000,
                                        ),
                                      ),
                                    )
                                  : "",
                                estado: c.estado as (typeof ESTADOS)[number],
                                notas: c.notas ?? "",
                              })
                            }
                            className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(c.id)}
                            className="rounded-lg border border-red-200 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <SideNav />

      {form && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          data-testid="agenda-modal"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl">
            <h2 className="text-base font-semibold text-gray-900">
              {form.id ? "Editar cita" : "Nueva cita"}
            </h2>
            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </span>
                <select
                  value={form.clienteFinalId}
                  onChange={(e) =>
                    setForm({ ...form, clienteFinalId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  data-testid="cita-input-cliente"
                >
                  <option value="">Sin cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Servicio
                </span>
                <select
                  value={form.servicioId}
                  onChange={(e) =>
                    setForm({ ...form, servicioId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  data-testid="cita-input-servicio"
                >
                  <option value="">Sin servicio</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} (S/ {Number(s.precio).toFixed(2)})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Inicio
                  </span>
                  <input
                    type="datetime-local"
                    value={form.fechaInicio}
                    onChange={(e) =>
                      setForm({ ...form, fechaInicio: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    data-testid="cita-input-fecha"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Duración (min)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.duracionMin}
                    onChange={(e) =>
                      setForm({ ...form, duracionMin: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </span>
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estado: e.target.value as (typeof ESTADOS)[number],
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Notas
                </span>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--color-primario)" }}
                data-testid="cita-submit"
              >
                {busy ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function toLocal(d: Date): string {
  const c = new Date(d);
  c.setMinutes(c.getMinutes() - c.getTimezoneOffset());
  return c.toISOString().slice(0, 16);
}
