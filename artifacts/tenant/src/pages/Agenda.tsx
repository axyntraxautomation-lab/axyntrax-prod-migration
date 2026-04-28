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
  type Empleado,
  type ServicioItem,
} from "@/lib/api";
import { getTerminologia } from "@/lib/rubro-terminologia";

const ESTADOS = [
  "pendiente",
  "confirmado",
  "completado",
  "cancelado",
  "no_asistio",
] as const;
type Estado = (typeof ESTADOS)[number];

const ESTADO_LABEL: Record<Estado, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
  no_asistio: "No asistió",
};

const ESTADO_COLOR: Record<Estado, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmado: "bg-sky-100 text-sky-800",
  completado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-gray-100 text-gray-600",
  no_asistio: "bg-red-100 text-red-800",
};

type Vista = "lista" | "calendario";

const FormSchema = z.object({
  clienteFinalId: z.string().uuid().optional(),
  servicioId: z.string().uuid().optional(),
  empleadoId: z.string().uuid().optional(),
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
  empleadoId: string;
  titulo: string;
  fechaInicio: string;
  duracionMin: string;
  estado: Estado;
  notas: string;
};

function defaultDateTimeLocal(fecha?: Date): string {
  const d = fecha ? new Date(fecha) : new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function makeEmpty(): FormState {
  return {
    id: null,
    clienteFinalId: "",
    servicioId: "",
    empleadoId: "",
    titulo: "",
    fechaInicio: defaultDateTimeLocal(),
    duracionMin: "30",
    estado: "pendiente",
    notas: "",
  };
}

export function Agenda() {
  const me = useTenantReady();
  const term = getTerminologia(me.tenant.rubroId);
  const [items, setItems] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<ClienteFinal[]>([]);
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [vista, setVista] = useState<Vista>("lista");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const desde = new Date();
      desde.setDate(desde.getDate() - 7);
      const [citas, cls, srvs, emps] = await Promise.all([
        apiGet<{ items: Cita[] }>(
          `/api/tenant/citas?desde=${encodeURIComponent(desde.toISOString())}`,
        ),
        apiGet<{ items: ClienteFinal[] }>("/api/tenant/clientes"),
        apiGet<{ items: ServicioItem[] }>("/api/tenant/servicios"),
        apiGet<{ items: Empleado[] }>("/api/tenant/empleados"),
      ]);
      setItems(citas.items);
      setClientes(cls.items);
      setServicios(srvs.items);
      setEmpleados(emps.items);
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
      empleadoId: form.empleadoId || undefined,
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
        empleadoId: parsed.data.empleadoId,
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

  async function nuevoEmpleado() {
    const nombre = window.prompt("Nombre del nuevo empleado");
    if (!nombre || !nombre.trim()) return;
    const rol = window.prompt("Rol (opcional, ej. estilista, técnico)") ?? "";
    try {
      await apiSend("POST", "/api/tenant/empleados", {
        nombre: nombre.trim(),
        rol: rol.trim() || null,
      });
      await load();
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "No se pudo crear el empleado.",
      );
    }
  }

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.fechaInicio).getTime() -
          new Date(b.fechaInicio).getTime(),
      ),
    [items],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Cita[]>();
    for (const c of sorted) {
      const k = c.fechaInicio.slice(0, 10);
      const arr = map.get(k);
      if (arr) arr.push(c);
      else map.set(k, [c]);
    }
    return Array.from(map.entries());
  }, [sorted]);

  const clienteName = (id: string | null) =>
    id ? clientes.find((c) => c.id === id)?.nombre ?? "Cliente" : "Sin cliente";
  const servicioName = (id: string | null) =>
    id
      ? servicios.find((s) => s.id === id)?.nombre ?? "Servicio"
      : "Sin servicio";
  const empleadoName = (id: string | null) =>
    id ? empleados.find((e) => e.id === id)?.nombre ?? "Empleado" : null;

  function openEdit(c: Cita) {
    const inicio = new Date(c.fechaInicio);
    setForm({
      id: c.id,
      clienteFinalId: c.clienteFinalId ?? "",
      servicioId: c.servicioId ?? "",
      empleadoId: c.empleadoId ?? "",
      titulo: c.titulo ?? "",
      fechaInicio: defaultDateTimeLocal(inicio),
      duracionMin: c.fechaFin
        ? String(
            Math.max(
              0,
              Math.round(
                (new Date(c.fechaFin).getTime() - inicio.getTime()) / 60_000,
              ),
            ),
          )
        : "",
      estado: (ESTADOS.includes(c.estado as Estado)
        ? c.estado
        : "pendiente") as Estado,
      notas: c.notas ?? "",
    });
  }

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
            onClick={() => setForm(makeEmpty())}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-nueva-cita"
          >
            Nueva
          </button>
        </header>

        <div
          className="mt-3 flex items-center justify-between gap-2"
          data-testid="agenda-toolbar"
        >
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs">
            {(["lista", "calendario"] as Vista[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={
                  "rounded-md px-3 py-1 font-medium " +
                  (vista === v
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50")
                }
                data-testid={`vista-${v}`}
              >
                {v === "lista" ? "Lista" : "Calendario"}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-gray-500">
            {empleados.length > 0 && (
              <>
                {empleados.length} empleado{empleados.length === 1 ? "" : "s"} ·{" "}
              </>
            )}
            <button
              type="button"
              onClick={() => void nuevoEmpleado()}
              className="font-semibold text-gray-700 underline"
              data-testid="btn-nuevo-empleado"
            >
              + Empleado
            </button>
          </div>
        </div>

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
        ) : vista === "lista" ? (
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
                    const estado = (
                      ESTADOS.includes(c.estado as Estado)
                        ? c.estado
                        : "pendiente"
                    ) as Estado;
                    const emp = empleadoName(c.empleadoId);
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
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide " +
                              ESTADO_COLOR[estado]
                            }
                            data-testid={`cita-estado-${c.id}`}
                          >
                            {ESTADO_LABEL[estado]}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">
                          {servicioName(c.servicioId)} ·{" "}
                          {clienteName(c.clienteFinalId)}
                        </div>
                        {emp && (
                          <div className="text-[11px] text-gray-600">
                            Atiende: <span className="font-medium">{emp}</span>
                          </div>
                        )}
                        {c.notas && (
                          <p className="mt-1 text-[11px] text-gray-600">
                            {c.notas}
                          </p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
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
        ) : (
          <CalendarioSemanal
            citas={sorted}
            empleados={empleados}
            servicios={servicios}
            clientes={clientes}
            onPick={openEdit}
          />
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
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Atiende
                </span>
                <select
                  value={form.empleadoId}
                  onChange={(e) =>
                    setForm({ ...form, empleadoId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  data-testid="cita-input-empleado"
                >
                  <option value="">Sin asignar</option>
                  {empleados
                    .filter((e) => e.activo)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                        {e.rol ? ` · ${e.rol}` : ""}
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
                      estado: e.target.value as Estado,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  data-testid="cita-input-estado"
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {ESTADO_LABEL[s]}
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

/**
 * Vista calendario semanal: 7 columnas (Dom-Sáb) con las citas del rango
 * mostrando hora, servicio y empleado. Click en una celda abre el editor.
 */
function CalendarioSemanal({
  citas,
  empleados,
  servicios,
  clientes,
  onPick,
}: {
  citas: Cita[];
  empleados: Empleado[];
  servicios: ServicioItem[];
  clientes: ClienteFinal[];
  onPick: (c: Cita) => void;
}) {
  const dias = useMemo(() => {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(hoy.getDate() - hoy.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
  }, []);

  const porDia = useMemo(() => {
    const map = new Map<string, Cita[]>();
    for (const d of dias) map.set(d.toDateString(), []);
    for (const c of citas) {
      const k = new Date(c.fechaInicio).toDateString();
      const arr = map.get(k);
      if (arr) arr.push(c);
    }
    return map;
  }, [citas, dias]);

  const empName = (id: string | null) =>
    id ? empleados.find((e) => e.id === id)?.nombre ?? "" : "";
  const sName = (id: string | null) =>
    id ? servicios.find((s) => s.id === id)?.nombre ?? "" : "";
  const cName = (id: string | null) =>
    id ? clientes.find((c) => c.id === id)?.nombre ?? "" : "";
  const empColor = (id: string | null) =>
    id ? empleados.find((e) => e.id === id)?.color ?? "#10b981" : "#9ca3af";

  return (
    <div className="mt-3" data-testid="agenda-calendario">
      <div className="grid grid-cols-7 gap-1">
        {dias.map((d) => {
          const esHoy = d.toDateString() === new Date().toDateString();
          return (
            <div
              key={d.toISOString()}
              className={
                "min-h-[140px] rounded-lg border p-1.5 text-[11px] " +
                (esHoy
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-200 bg-white")
              }
            >
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-semibold text-gray-700">
                  {d.toLocaleDateString("es-PE", { weekday: "short" })}
                </span>
                <span
                  className={
                    "text-[10px] " +
                    (esHoy ? "font-bold text-emerald-700" : "text-gray-500")
                  }
                >
                  {d.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {(porDia.get(d.toDateString()) ?? []).map((c) => {
                  const t = new Date(c.fechaInicio).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onPick(c)}
                      className="block w-full truncate rounded border-l-2 bg-white px-1 py-0.5 text-left hover:bg-gray-50"
                      style={{ borderLeftColor: empColor(c.empleadoId) }}
                      data-testid={`cal-cita-${c.id}`}
                      title={`${t} · ${sName(c.servicioId) || c.titulo || "Cita"} · ${cName(c.clienteFinalId)}`}
                    >
                      <span className="font-semibold">{t}</span>{" "}
                      <span className="text-gray-700">
                        {sName(c.servicioId) || c.titulo || "Cita"}
                      </span>
                      {c.empleadoId && (
                        <div className="truncate text-[10px] text-gray-500">
                          {empName(c.empleadoId)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {empleados.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {empleados.map((e) => (
            <span
              key={e.id}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: e.color }}
              />
              {e.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
