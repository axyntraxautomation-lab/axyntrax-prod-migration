import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ApiError,
  apiGet,
  apiSend,
  type ClienteFinal,
  type PagoQr,
  type ServicioItem,
} from "@/lib/api";
import { useTenantReady } from "@/providers/TenantProvider";
import { getTerminologia } from "@/lib/rubro-terminologia";

const CANALES = [
  "yape",
  "plin",
  "efectivo",
  "transferencia",
  "tarjeta",
  "otro",
] as const;
type Canal = (typeof CANALES)[number];

type Step = "que" | "cliente" | "cobro" | "qr" | "ok";

const Schema = z.object({
  servicioId: z.string().uuid().optional(),
  conceptoLibre: z.string().trim().max(200).optional(),
  monto: z.number({ message: "Monto inválido" }).positive(),
  clienteFinalId: z.string().uuid().optional(),
  canal: z.enum(CANALES),
});

type FormState = {
  servicioId: string;
  conceptoLibre: string;
  monto: string;
  clienteFinalId: string;
  canal: Canal;
};

const EMPTY: FormState = {
  servicioId: "",
  conceptoLibre: "",
  monto: "",
  clienteFinalId: "",
  canal: "yape",
};

/**
 * Wizard adaptativo de "Nueva venta": pregunta qué se vendió,
 * a quién, y cómo se cobra. Para Yape/Plin genera QR vivo y luego
 * confirma; para otros canales registra el ingreso directo.
 */
export function NuevaVentaWizard({
  open,
  onClose,
  onCompleted,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const me = useTenantReady();
  const term = getTerminologia(me.tenant.rubroId);
  const [step, setStep] = useState<Step>("que");
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [clientes, setClientes] = useState<ClienteFinal[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pago, setPago] = useState<PagoQr | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("que");
    setForm({ ...EMPTY });
    setErr(null);
    setPago(null);
    Promise.all([
      apiGet<{ items: ServicioItem[] }>("/api/tenant/servicios").then(
        (d) => d.items,
      ),
      apiGet<{ items: ClienteFinal[] }>("/api/tenant/clientes").then(
        (d) => d.items,
      ),
    ])
      .then(([srv, cls]) => {
        setServicios(srv);
        setClientes(cls);
      })
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : "No se pudo preparar la venta.");
      });
  }, [open]);

  const servicioSel = useMemo(
    () => servicios.find((s) => s.id === form.servicioId) ?? null,
    [form.servicioId, servicios],
  );

  function next() {
    setErr(null);
    if (step === "que") {
      if (!form.servicioId && !form.conceptoLibre.trim()) {
        setErr("Elige un servicio o describe lo vendido.");
        return;
      }
      if (servicioSel && !form.monto) {
        setForm((f) => ({ ...f, monto: servicioSel.precio }));
      }
      setStep("cliente");
      return;
    }
    if (step === "cliente") {
      setStep("cobro");
      return;
    }
  }

  async function cobrar() {
    const parsed = Schema.safeParse({
      servicioId: form.servicioId || undefined,
      conceptoLibre: form.conceptoLibre || undefined,
      monto: Number(form.monto),
      clienteFinalId: form.clienteFinalId || undefined,
      canal: form.canal,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    const concepto =
      parsed.data.conceptoLibre ?? servicioSel?.nombre ?? term.venta;
    setBusy(true);
    setErr(null);
    try {
      if (parsed.data.canal === "yape" || parsed.data.canal === "plin") {
        const generado = await apiSend<PagoQr>(
          "POST",
          "/api/tenant/pagos-qr/generar",
          {
            metodo: parsed.data.canal,
            monto: parsed.data.monto,
            concepto,
            clienteFinalId: parsed.data.clienteFinalId,
          },
        );
        setPago(generado);
        setStep("qr");
      } else {
        await apiSend("POST", "/api/tenant/finanzas", {
          tipo: "ingreso",
          concepto,
          monto: parsed.data.monto,
          metodoPago: parsed.data.canal,
          clienteFinalId: parsed.data.clienteFinalId,
        });
        setStep("ok");
        onCompleted?.();
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo registrar la venta.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmarQr() {
    if (!pago) return;
    setBusy(true);
    setErr(null);
    try {
      await apiSend("POST", "/api/tenant/pagos-qr/confirmar", { pagoId: pago.id });
      setStep("ok");
      onCompleted?.();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo confirmar.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      data-testid="venta-wizard"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{term.venta}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500"
            data-testid="venta-cerrar"
          >
            Cerrar
          </button>
        </header>
        <Stepper step={step} />
        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        {step === "que" && (
          <div className="mt-3 grid gap-3" data-testid="venta-step-que">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {term.catalogo}
              </span>
              <select
                value={form.servicioId}
                onChange={(e) => {
                  const id = e.target.value;
                  const s = servicios.find((x) => x.id === id) ?? null;
                  setForm({
                    ...form,
                    servicioId: id,
                    monto: s ? s.precio : form.monto,
                  });
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                data-testid="venta-servicio"
              >
                <option value="">— Concepto libre —</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} (S/ {Number(s.precio).toFixed(2)})
                  </option>
                ))}
              </select>
            </label>
            {!form.servicioId && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Concepto
                </span>
                <input
                  type="text"
                  value={form.conceptoLibre}
                  onChange={(e) =>
                    setForm({ ...form, conceptoLibre: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Ej. Lavado simple, almuerzo, corte"
                />
              </label>
            )}
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
                data-testid="venta-monto"
              />
            </label>
          </div>
        )}

        {step === "cliente" && (
          <div className="mt-3 grid gap-3" data-testid="venta-step-cliente">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {term.clientes}
              </span>
              <select
                value={form.clienteFinalId}
                onChange={(e) =>
                  setForm({ ...form, clienteFinalId: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                data-testid="venta-cliente"
              >
                <option value="">— Cliente ocasional —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-gray-500">
              Asociar un cliente te ayuda a ver su historial y volver a contactarlo.
            </p>
          </div>
        )}

        {step === "cobro" && (
          <div className="mt-3 grid gap-3" data-testid="venta-step-cobro">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Cómo cobras
              </span>
              <select
                value={form.canal}
                onChange={(e) =>
                  setForm({ ...form, canal: e.target.value as Canal })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                data-testid="venta-canal"
              >
                {CANALES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-gray-500">
              Si eliges Yape o Plin, generaré un QR para tu cliente. Otros canales
              quedan registrados al toque.
            </p>
          </div>
        )}

        {step === "qr" && pago?.qrDataUrl && (
          <div className="mt-3 text-center" data-testid="venta-step-qr">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Muestra este código a tu cliente
            </p>
            <img
              src={pago.qrDataUrl}
              alt="QR de pago"
              className="mx-auto mt-2 h-56 w-56 rounded-lg border border-emerald-200 bg-white p-2"
            />
            <p className="mt-2 text-sm font-semibold text-gray-900">
              S/ {Number(pago.monto).toFixed(2)} · {pago.metodo.toUpperCase()}
            </p>
          </div>
        )}

        {step === "ok" && (
          <div
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center"
            data-testid="venta-step-ok"
          >
            <p className="text-sm font-semibold text-emerald-800">
              Venta registrada. Buen trabajo.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {step !== "ok" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
              disabled={busy}
            >
              Cancelar
            </button>
          )}
          {(step === "que" || step === "cliente") && (
            <button
              type="button"
              onClick={next}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--color-primario)" }}
              data-testid="venta-siguiente"
            >
              Siguiente
            </button>
          )}
          {step === "cobro" && (
            <button
              type="button"
              onClick={() => void cobrar()}
              disabled={busy}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--color-primario)" }}
              data-testid="venta-cobrar"
            >
              {busy ? "Procesando…" : "Cobrar"}
            </button>
          )}
          {step === "qr" && (
            <button
              type="button"
              onClick={() => void confirmarQr()}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              data-testid="venta-confirmar-qr"
            >
              {busy ? "Confirmando…" : "Marcar como pagado"}
            </button>
          )}
          {step === "ok" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--color-primario)" }}
              data-testid="venta-listo"
            >
              Listo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const order: Step[] = ["que", "cliente", "cobro"];
  const idx = order.indexOf(step);
  const labels = ["Qué", "Quién", "Cómo cobrar"];
  return (
    <ol className="mt-3 flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-400">
      {labels.map((l, i) => {
        const active = i === idx;
        const done = idx > i || step === "qr" || step === "ok";
        return (
          <li
            key={l}
            className={
              "rounded-full px-2 py-0.5 " +
              (active
                ? "bg-gray-900 text-white"
                : done
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500")
            }
          >
            {i + 1}. {l}
          </li>
        );
      })}
    </ol>
  );
}
