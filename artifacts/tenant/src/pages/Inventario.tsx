import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import { useTenantReady } from "@/providers/TenantProvider";
import { ApiError, apiGet, apiSend, type InventarioItem } from "@/lib/api";
import { getTerminologia } from "@/lib/rubro-terminologia";

const FormSchema = z.object({
  nombre: z.string().trim().min(1, "Pon un nombre"),
  sku: z.string().trim().max(64).optional(),
  categoria: z.string().trim().max(64).optional(),
  unidad: z.string().trim().min(1, "Unidad obligatoria").max(16),
  cantidad: z.number({ message: "Cantidad inválida" }).min(0),
  minimoAlerta: z.number({ message: "Mínimo inválido" }).min(0),
  precioCosto: z.number().min(0).optional(),
  precioVenta: z.number().min(0).optional(),
});

type FormState = {
  id: string | null;
  nombre: string;
  sku: string;
  categoria: string;
  unidad: string;
  cantidad: string;
  minimoAlerta: string;
  precioCosto: string;
  precioVenta: string;
};

const EMPTY: FormState = {
  id: null,
  nombre: "",
  sku: "",
  categoria: "",
  unidad: "unidad",
  cantidad: "0",
  minimoAlerta: "0",
  precioCosto: "",
  precioVenta: "",
};

export function Inventario() {
  const me = useTenantReady();
  const term = getTerminologia(me.tenant.rubroId);
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiGet<{ items: InventarioItem[] }>(
        "/api/tenant/inventario",
      );
      setItems(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cargar el inventario.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openNew() {
    setForm({ ...EMPTY });
  }

  function openEdit(it: InventarioItem) {
    setForm({
      id: it.id,
      nombre: it.nombre,
      sku: it.sku ?? "",
      categoria: it.categoria ?? "",
      unidad: it.unidad,
      cantidad: it.cantidad,
      minimoAlerta: it.minimoAlerta,
      precioCosto: it.precioCosto ?? "",
      precioVenta: it.precioVenta ?? "",
    });
  }

  async function submit() {
    if (!form) return;
    const parsed = FormSchema.safeParse({
      nombre: form.nombre,
      sku: form.sku || undefined,
      categoria: form.categoria || undefined,
      unidad: form.unidad,
      cantidad: Number(form.cantidad),
      minimoAlerta: Number(form.minimoAlerta),
      precioCosto: form.precioCosto === "" ? undefined : Number(form.precioCosto),
      precioVenta: form.precioVenta === "" ? undefined : Number(form.precioVenta),
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (form.id) {
        await apiSend("PATCH", `/api/tenant/inventario/${form.id}`, parsed.data);
      } else {
        await apiSend("POST", "/api/tenant/inventario", parsed.data);
      }
      setForm(null);
      await load();
    } catch (e) {
      setErr(
        e instanceof ApiError ? e.message : "No se pudo guardar el item.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este item del inventario?")) return;
    try {
      await apiSend("DELETE", `/api/tenant/inventario/${id}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const ra = ratio(a);
        const rb = ratio(b);
        if (ra !== rb) return ra - rb;
        return a.nombre.localeCompare(b.nombre);
      }),
    [items],
  );

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <header className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {term.inventario}
            </h1>
            <p className="text-xs text-gray-500">
              Controla stock, mínimos y costos de tu negocio.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-nuevo-inventario"
          >
            Nuevo item
          </button>
        </header>

        {err && (
          <div
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            data-testid="inventario-error"
          >
            {err}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-center text-sm text-gray-500">Cargando…</p>
        ) : sorted.length === 0 ? (
          <p
            className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
            data-testid="inventario-empty"
          >
            Aún no hay items. Crea el primero para empezar.
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="inventario-list">
            {sorted.map((it) => {
              const cantidad = Number(it.cantidad);
              const minimo = Number(it.minimoAlerta);
              const critical = minimo > 0 && cantidad < minimo;
              return (
                <li
                  key={it.id}
                  className={
                    "rounded-xl border px-3 py-2 " +
                    (critical
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-white")
                  }
                  data-testid={`inv-item-${it.id}`}
                  data-critical={critical ? "true" : "false"}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-gray-900">
                        {it.nombre}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {cantidad} {it.unidad} · mínimo {minimo} {it.unidad}
                        {it.precioVenta != null && (
                          <> · S/ {Number(it.precioVenta).toFixed(2)}</>
                        )}
                      </div>
                    </div>
                    {critical && (
                      <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Stock bajo
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(it)}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                      data-testid={`inv-edit-${it.id}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(it.id)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
                      data-testid={`inv-del-${it.id}`}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SideNav />

      {form && (
        <ModalForm
          form={form}
          setForm={setForm}
          onClose={() => setForm(null)}
          onSubmit={() => void submit()}
          busy={busy}
        />
      )}
    </>
  );
}

function ratio(it: InventarioItem): number {
  const m = Number(it.minimoAlerta);
  if (m <= 0) return 1;
  return Number(it.cantidad) / m;
}

function ModalForm({
  form,
  setForm,
  onClose,
  onSubmit,
  busy,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      data-testid="inventario-modal"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl">
        <h2 className="text-base font-semibold text-gray-900">
          {form.id ? "Editar item" : "Nuevo item"}
        </h2>
        <div className="mt-3 grid gap-3">
          <Field label="Nombre">
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              data-testid="inv-input-nombre"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Categoría">
              <input
                type="text"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="SKU">
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Cantidad">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                data-testid="inv-input-cantidad"
              />
            </Field>
            <Field label="Mínimo">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={form.minimoAlerta}
                onChange={(e) =>
                  setForm({ ...form, minimoAlerta: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                data-testid="inv-input-minimo"
              />
            </Field>
            <Field label="Unidad">
              <input
                type="text"
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Precio costo">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={form.precioCosto}
                onChange={(e) =>
                  setForm({ ...form, precioCosto: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Precio venta">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={form.precioVenta}
                onChange={(e) =>
                  setForm({ ...form, precioVenta: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            style={{ background: "var(--color-primario)" }}
            data-testid="inv-submit"
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
