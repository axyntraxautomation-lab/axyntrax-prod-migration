import { useEffect, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import { ApiError, apiGet, apiSend, type PagoQr } from "@/lib/api";

const FormSchema = z.object({
  metodo: z.enum(["yape", "plin"]),
  monto: z.number({ message: "Monto inválido" }).positive("Monto debe ser mayor a 0"),
  concepto: z.string().trim().max(200).optional(),
});

export function Pagos() {
  const [items, setItems] = useState<PagoQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<"yape" | "plin">("yape");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [busy, setBusy] = useState(false);
  const [recienGenerado, setRecienGenerado] = useState<PagoQr | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiGet<{ items: PagoQr[] }>("/api/tenant/pagos-qr");
      setItems(data.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function generar() {
    const parsed = FormSchema.safeParse({
      metodo,
      monto: Number(monto),
      concepto: concepto || undefined,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const pago = await apiSend<PagoQr>(
        "POST",
        "/api/tenant/pagos-qr/generar",
        parsed.data,
      );
      setRecienGenerado(pago);
      setMonto("");
      setConcepto("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo generar el QR.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmar(id: string) {
    if (!window.confirm("¿Confirmar que el cliente ya pagó este monto?")) return;
    try {
      await apiSend("POST", "/api/tenant/pagos-qr/confirmar", { pagoId: id });
      if (recienGenerado?.id === id) setRecienGenerado(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo confirmar.");
    }
  }

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <header className="mt-3">
          <h1 className="text-lg font-semibold text-gray-900">Pagos QR</h1>
          <p className="text-xs text-gray-500">
            Genera un código para que tu cliente pague por Yape o Plin.
          </p>
        </header>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        <section
          className="mt-3 rounded-xl border border-gray-200 bg-white p-3"
          data-testid="pagos-form"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Método
              </span>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as "yape" | "plin")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                data-testid="pago-input-metodo"
              >
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Monto S/
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                data-testid="pago-input-monto"
              />
            </label>
          </div>
          <label className="mt-2 block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Concepto
            </span>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Lavado simple, almuerzo, etc."
            />
          </label>
          <button
            type="button"
            onClick={() => void generar()}
            disabled={busy}
            className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--color-primario)" }}
            data-testid="btn-generar-qr"
          >
            {busy ? "Generando…" : "Generar QR"}
          </button>
        </section>

        {recienGenerado?.qrDataUrl && (
          <section
            className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center"
            data-testid="pago-qr-vista"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Muestra este código a tu cliente
            </p>
            <img
              src={recienGenerado.qrDataUrl}
              alt={`QR ${recienGenerado.metodo}`}
              className="mx-auto mt-2 h-56 w-56 rounded-lg border border-emerald-200 bg-white p-2"
              data-testid="pago-qr-img"
            />
            <p className="mt-2 text-sm text-emerald-900">
              S/ {Number(recienGenerado.monto).toFixed(2)} ·{" "}
              {recienGenerado.metodo.toUpperCase()}
            </p>
            <button
              type="button"
              onClick={() => void confirmar(recienGenerado.id)}
              className="mt-2 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              data-testid="btn-confirmar-recien"
            >
              Marcar como pagado
            </button>
          </section>
        )}

        <h2 className="mt-5 text-sm font-semibold text-gray-900">Historial</h2>
        {loading ? (
          <p className="mt-2 text-center text-sm text-gray-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p
            className="mt-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500"
            data-testid="pagos-empty"
          >
            Aún no has generado ningún QR.
          </p>
        ) : (
          <ul className="mt-2 space-y-2" data-testid="pagos-list">
            {items.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2"
                data-testid={`pago-${p.id}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-gray-900">
                      {p.concepto ?? `Pago ${p.metodo.toUpperCase()}`}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {new Date(p.createdAt).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {p.metodo} ·{" "}
                      <span
                        className={
                          p.estado === "confirmado"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }
                      >
                        {p.estado}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gray-900">
                    S/ {Number(p.monto).toFixed(2)}
                  </span>
                </div>
                {p.estado === "pendiente" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void confirmar(p.id)}
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800"
                      data-testid={`pago-confirmar-${p.id}`}
                    >
                      Confirmar pago
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <SideNav />
    </>
  );
}
