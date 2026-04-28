import { useEffect, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import { useTenantReady } from "@/providers/TenantProvider";
import { ApiError, apiGet, apiSend, type ClienteFinal } from "@/lib/api";
import { getTerminologia } from "@/lib/rubro-terminologia";

const FormSchema = z.object({
  nombre: z.string().trim().min(1, "Pon un nombre"),
  telefono: z.string().trim().max(32).optional(),
  email: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  documentoTipo: z.string().trim().max(16).optional(),
  documentoNumero: z.string().trim().max(32).optional(),
  notas: z.string().trim().max(2000).optional(),
});

type FormState = {
  id: string | null;
  nombre: string;
  telefono: string;
  email: string;
  documentoTipo: string;
  documentoNumero: string;
  notas: string;
};

const EMPTY: FormState = {
  id: null,
  nombre: "",
  telefono: "",
  email: "",
  documentoTipo: "DNI",
  documentoNumero: "",
  notas: "",
};

export function Clientes() {
  const me = useTenantReady();
  const term = getTerminologia(me.tenant.rubroId);
  const [items, setItems] = useState<ClienteFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(query = "") {
    setLoading(true);
    setErr(null);
    try {
      const url =
        "/api/tenant/clientes" + (query ? `?q=${encodeURIComponent(query)}` : "");
      const data = await apiGet<{ items: ClienteFinal[] }>(url);
      setItems(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron cargar los clientes.");
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
      telefono: form.telefono || undefined,
      email: form.email || "",
      documentoTipo: form.documentoTipo || undefined,
      documentoNumero: form.documentoNumero || undefined,
      notas: form.notas || undefined,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (form.id) {
        await apiSend("PATCH", `/api/tenant/clientes/${form.id}`, parsed.data);
      } else {
        await apiSend("POST", "/api/tenant/clientes", parsed.data);
      }
      setForm(null);
      await load(q);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try {
      await apiSend("DELETE", `/api/tenant/clientes/${id}`);
      await load(q);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <header className="mt-3 flex items-center justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{term.clientes}</h1>
            <p className="text-xs text-gray-500">
              Tus contactos. Las notas privadas se guardan cifradas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-nuevo-cliente"
          >
            Nuevo
          </button>
        </header>

        <div className="mt-3 flex gap-2">
          <input
            type="search"
            placeholder="Buscar por nombre, correo o documento"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(q);
            }}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            data-testid="cli-search"
          />
          <button
            type="button"
            onClick={() => void load(q)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            Buscar
          </button>
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
            data-testid="clientes-empty"
          >
            No tienes clientes registrados todavía.
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="clientes-list">
            {items.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2"
                data-testid={`cliente-${c.id}`}
              >
                <div className="text-sm font-medium text-gray-900">{c.nombre}</div>
                <div className="text-[11px] text-gray-500">
                  {c.telefono && <>📞 {c.telefono} · </>}
                  {c.email && <>{c.email} · </>}
                  {c.documentoNumero && (
                    <>{c.documentoTipo ?? "DOC"} {c.documentoNumero}</>
                  )}
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
                        nombre: c.nombre,
                        telefono: c.telefono ?? "",
                        email: c.email ?? "",
                        documentoTipo: c.documentoTipo ?? "DNI",
                        documentoNumero: c.documentoNumero ?? "",
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
            ))}
          </ul>
        )}
      </main>
      <SideNav />

      {form && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          data-testid="clientes-modal"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl">
            <h2 className="text-base font-semibold text-gray-900">
              {form.id ? "Editar cliente" : "Nuevo cliente"}
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
                  data-testid="cli-input-nombre"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Teléfono
                  </span>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    data-testid="cli-input-telefono"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Correo
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Tipo doc.
                  </span>
                  <select
                    value={form.documentoTipo}
                    onChange={(e) =>
                      setForm({ ...form, documentoTipo: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </label>
                <label className="col-span-2 block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Número doc.
                  </span>
                  <input
                    type="text"
                    value={form.documentoNumero}
                    onChange={(e) =>
                      setForm({ ...form, documentoNumero: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Notas (privadas, cifradas)
                </span>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={3}
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
                data-testid="cli-submit"
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
