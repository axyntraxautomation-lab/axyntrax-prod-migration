import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import {
  ApiError,
  apiGet,
  apiSend,
  type FinanzaMov,
  type FinanzaSummary,
} from "@/lib/api";

const TIPOS = ["ingreso", "egreso"] as const;
const CANALES = [
  "yape",
  "plin",
  "efectivo",
  "transferencia",
  "tarjeta",
  "otro",
] as const;

const FormSchema = z.object({
  tipo: z.enum(TIPOS),
  monto: z.number({ message: "Monto inválido" }).positive("Monto debe ser mayor a 0"),
  metodoPago: z.enum(CANALES),
  concepto: z.string().trim().max(200).optional(),
  fecha: z.string().min(1, "Fecha obligatoria"),
});

type FormState = {
  // id presente sólo cuando estamos editando un movimiento existente. Si está
  // vacío se trata como create (POST), de lo contrario como update (PATCH).
  id?: string;
  tipo: (typeof TIPOS)[number];
  monto: string;
  metodoPago: (typeof CANALES)[number];
  concepto: string;
  fecha: string;
};

function defaultLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY: FormState = {
  tipo: "ingreso",
  monto: "",
  metodoPago: "yape",
  concepto: "",
  fecha: defaultLocal(),
};

export function Finanzas() {
  const [items, setItems] = useState<FinanzaMov[]>([]);
  const [summary, setSummary] = useState<FinanzaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [list, sum] = await Promise.all([
        apiGet<{ items: FinanzaMov[] }>("/api/tenant/finanzas"),
        apiGet<FinanzaSummary>("/api/tenant/finanzas/summary"),
      ]);
      setItems(list.items);
      setSummary(sum);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron cargar las finanzas.");
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
      tipo: form.tipo,
      monto: Number(form.monto),
      metodoPago: form.metodoPago,
      concepto: form.concepto || undefined,
      fecha: form.fecha,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const fechaIso = new Date(parsed.data.fecha).toISOString();
      const payload = { ...parsed.data, fecha: fechaIso };
      if (form.id) {
        await apiSend("PATCH", `/api/tenant/finanzas/${form.id}`, payload);
      } else {
        await apiSend("POST", "/api/tenant/finanzas", payload);
      }
      setForm(null);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(m: FinanzaMov) {
    // datetime-local necesita "YYYY-MM-DDTHH:mm" en hora local del navegador.
    const d = new Date(m.fecha);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setForm({
      id: m.id,
      tipo: m.tipo,
      monto: String(m.monto),
      metodoPago: m.metodoPago as (typeof CANALES)[number],
      concepto: m.concepto ?? "",
      fecha: d.toISOString().slice(0, 16),
    });
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este movimiento?")) return;
    try {
      await apiSend("DELETE", `/api/tenant/finanzas/${id}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <header className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Finanzas</h1>
            <p className="text-xs text-gray-500">
              Tus ingresos y gastos del día, semana y mes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-nuevo-movimiento"
          >
            Registrar
          </button>
        </header>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        {summary && (
          <section className="mt-3 grid grid-cols-3 gap-2" data-testid="finanzas-summary">
            {(["dia", "semana", "mes"] as const).map((p) => (
              <div
                key={p}
                className="rounded-xl border border-gray-200 bg-white p-3 text-center"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {p === "dia" ? "Hoy" : p === "semana" ? "Semana" : "Mes"}
                </div>
                <div className="mt-1 text-base font-bold text-gray-900">
                  S/ {fmt.format(summary[p].balance)}
                </div>
                <div className="text-[10px] text-gray-500">
                  +{fmt.format(summary[p].ingreso)} / -{fmt.format(summary[p].egreso)}
                </div>
              </div>
            ))}
          </section>
        )}

        {summary && (
          <section className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Ingresos del mes por canal
            </div>
            <ul className="mt-2 grid grid-cols-3 gap-2">
              {CANALES.map((c) => (
                <li
                  key={c}
                  className="rounded-lg bg-gray-50 px-2 py-1 text-center"
                  data-testid={`canal-${c}`}
                >
                  <div className="text-[10px] uppercase text-gray-500">{c}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    S/ {fmt.format(summary.canalesMes[c] ?? 0)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {loading ? (
          <p className="mt-6 text-center text-sm text-gray-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p
            className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
            data-testid="finanzas-empty"
          >
            Sin movimientos registrados todavía.
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="finanzas-list">
            {items.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2"
                data-testid={`mov-${m.id}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-gray-900">
                      {m.concepto ?? (m.tipo === "ingreso" ? "Ingreso" : "Gasto")}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {new Date(m.fecha).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {m.metodoPago}
                    </div>
                  </div>
                  <span
                    className={
                      "shrink-0 text-sm font-bold " +
                      (m.tipo === "ingreso" ? "text-emerald-700" : "text-red-700")
                    }
                  >
                    {m.tipo === "ingreso" ? "+" : "-"} S/ {fmt.format(Number(m.monto))}
                  </span>
                </div>
                <div className="mt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                    data-testid={`mov-${m.id}-editar`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(m.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SideNav />

      {form && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          data-testid="finanzas-modal"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl">
            <h2 className="text-base font-semibold text-gray-900">
              {form.id ? "Editar movimiento" : "Registrar movimiento"}
            </h2>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Tipo
                  </span>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipo: e.target.value as (typeof TIPOS)[number],
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    data-testid="mov-input-tipo"
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Gasto</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Canal
                  </span>
                  <select
                    value={form.metodoPago}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metodoPago: e.target.value as (typeof CANALES)[number],
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {CANALES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Monto S/
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    data-testid="mov-input-monto"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Fecha
                  </span>
                  <input
                    type="datetime-local"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Concepto
                </span>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={(e) =>
                    setForm({ ...form, concepto: e.target.value })
                  }
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
                data-testid="mov-submit"
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
