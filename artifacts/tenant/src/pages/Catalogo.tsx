import { useEffect, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import { useTenantReady } from "@/providers/TenantProvider";
import { ApiError, apiGet, apiSend, type ServicioItem } from "@/lib/api";
import { getTerminologia } from "@/lib/rubro-terminologia";

const FormSchema = z.object({
  nombre: z.string().trim().min(1, "Pon un nombre"),
  descripcion: z.string().trim().optional(),
  categoria: z.string().trim().max(64).optional(),
  precio: z.number({ message: "Precio inválido" }).min(0),
  duracionMinutos: z.number().int().min(0).max(24 * 60).optional(),
  activo: z.boolean(),
});

type FormState = {
  id: string | null;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: string;
  duracionMinutos: string;
  activo: boolean;
};

const EMPTY: FormState = {
  id: null,
  nombre: "",
  descripcion: "",
  categoria: "",
  precio: "0",
  duracionMinutos: "30",
  activo: true,
};

export function Catalogo() {
  const me = useTenantReady();
  const term = getTerminologia(me.tenant.rubroId);
  const [items, setItems] = useState<ServicioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiGet<{ items: ServicioItem[] }>(
        "/api/tenant/servicios",
      );
      setItems(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cargar el catálogo.");
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
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      categoria: form.categoria || undefined,
      precio: Number(form.precio),
      duracionMinutos:
        form.duracionMinutos === "" ? undefined : Number(form.duracionMinutos),
      activo: form.activo,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (form.id) {
        await apiSend("PATCH", `/api/tenant/servicios/${form.id}`, parsed.data);
      } else {
        await apiSend("POST", "/api/tenant/servicios", parsed.data);
      }
      setForm(null);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este registro del catálogo?")) return;
    try {
      await apiSend("DELETE", `/api/tenant/servicios/${id}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <header className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {term.catalogo}
            </h1>
            <p className="text-xs text-gray-500">
              Lo que ofreces y cobras a tus clientes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-nuevo-servicio"
          >
            Nuevo
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
            data-testid="catalogo-empty"
          >
            Tu catálogo está vacío. Agrega lo que vendes.
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="catalogo-list">
            {items.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2"
                data-testid={`servicio-${s.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-gray-900">
                      {s.nombre}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      S/ {Number(s.precio).toFixed(2)}
                      {s.duracionMinutos != null && (
                        <> · {s.duracionMinutos} min</>
                      )}
                      {s.categoria && <> · {s.categoria}</>}
                      {!s.activo && <> · inactivo</>}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        id: s.id,
                        nombre: s.nombre,
                        descripcion: s.descripcion ?? "",
                        categoria: s.categoria ?? "",
                        precio: s.precio,
                        duracionMinutos:
                          s.duracionMinutos != null
                            ? String(s.duracionMinutos)
                            : "",
                        activo: s.activo,
                      })
                    }
                    className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(s.id)}
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
          data-testid="catalogo-modal"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl">
            <h2 className="text-base font-semibold text-gray-900">
              {form.id ? "Editar" : "Nuevo"}
            </h2>
            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Nombre
                </span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  data-testid="serv-input-nombre"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Descripción
                </span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Precio S/
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) =>
                      setForm({ ...form, precio: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    data-testid="serv-input-precio"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Duración min
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.duracionMinutos}
                    onChange={(e) =>
                      setForm({ ...form, duracionMinutos: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Categoría
                  </span>
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) =>
                      setForm({ ...form, categoria: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    setForm({ ...form, activo: e.target.checked })
                  }
                />
                Activo en el menú
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
                data-testid="serv-submit"
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
