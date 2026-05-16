import { useEffect, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import { ApiError, apiGet, apiSend, type FaqOverride } from "@/lib/api";

const FormSchema = z.object({
  pregunta: z.string().trim().min(3, "Mínimo 3 caracteres").max(500),
  respuesta: z.string().trim().min(3, "Mínimo 3 caracteres").max(2000),
  categoria: z.string().trim().max(64).optional(),
  orden: z.number().int().min(0),
  activo: z.boolean(),
});

type FormState = {
  id: string | null;
  pregunta: string;
  respuesta: string;
  categoria: string;
  orden: string;
  activo: boolean;
};

const EMPTY: FormState = {
  id: null,
  pregunta: "",
  respuesta: "",
  categoria: "general",
  orden: "0",
  activo: true,
};

export function FaqEditor() {
  const [items, setItems] = useState<FaqOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiGet<{ items: FaqOverride[] }>(
        "/api/tenant/faq-overrides",
      );
      setItems(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron cargar las FAQs.");
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
      pregunta: form.pregunta,
      respuesta: form.respuesta,
      categoria: form.categoria || undefined,
      orden: Number(form.orden),
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
        await apiSend(
          "PATCH",
          `/api/tenant/faq-overrides/${form.id}`,
          parsed.data,
        );
      } else {
        await apiSend("POST", "/api/tenant/faq-overrides", parsed.data);
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
    if (!window.confirm("¿Eliminar esta FAQ?")) return;
    try {
      await apiSend("DELETE", `/api/tenant/faq-overrides/${id}`);
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
              FAQs personalizadas
            </h1>
            <p className="text-xs text-gray-500">
              Tus respuestas tienen prioridad sobre las del rubro al hablar con Cecilia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-nueva-faq"
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
            data-testid="faqs-empty"
          >
            Aún no has agregado FAQs propias. Cecilia usa las del rubro.
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="faqs-list">
            {items.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2"
                data-testid={`faq-${f.id}`}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {f.pregunta}
                </div>
                <p className="mt-1 text-[12px] text-gray-700">{f.respuesta}</p>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                  {f.categoria ?? "general"} · orden {f.orden}
                  {!f.activo && " · inactiva"}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        id: f.id,
                        pregunta: f.pregunta,
                        respuesta: f.respuesta,
                        categoria: f.categoria ?? "general",
                        orden: String(f.orden),
                        activo: f.activo,
                      })
                    }
                    className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(f.id)}
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
          data-testid="faq-modal"
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl">
            <h2 className="text-base font-semibold text-gray-900">
              {form.id ? "Editar FAQ" : "Nueva FAQ"}
            </h2>
            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Pregunta
                </span>
                <input
                  type="text"
                  value={form.pregunta}
                  onChange={(e) =>
                    setForm({ ...form, pregunta: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  data-testid="faq-input-pregunta"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Respuesta
                </span>
                <textarea
                  value={form.respuesta}
                  onChange={(e) =>
                    setForm({ ...form, respuesta: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  data-testid="faq-input-respuesta"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
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
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Orden
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.orden}
                    onChange={(e) =>
                      setForm({ ...form, orden: e.target.value })
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
                Activa (Cecilia puede usarla)
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
                data-testid="faq-submit"
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
