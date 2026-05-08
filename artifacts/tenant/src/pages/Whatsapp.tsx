import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { BrandingHeader } from "@/components/BrandingHeader";
import { SideNav } from "@/components/SideNav";
import { ApiError, apiGet, apiSend } from "@/lib/api";

type EstadoSesion =
  | "desconectado"
  | "iniciando"
  | "qr_pendiente"
  | "conectado"
  | "error";

type SesionRow = {
  id: string;
  status: EstadoSesion | string;
  qr_code: string | null;
  phone_number: string | null;
  updated_at: string | null;
};

type EstadoResponse = {
  session: SesionRow | null;
  live: { state?: EstadoSesion | string } | null;
  workerOnline?: boolean;
};

type Mensaje = {
  id: string;
  direccion: "in" | "out" | string;
  from: string | null;
  to: string | null;
  body: string;
  estado: string | null;
  created_at: string | null;
};

const SendSchema = z.object({
  to: z
    .string()
    .trim()
    .min(6, "Número muy corto")
    .regex(/^[+0-9 ]+$/, "Solo dígitos, espacios o +"),
  text: z.string().trim().min(1, "Escribe un mensaje").max(4096),
});

function fmtFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(s: string | null | undefined): {
  text: string;
  tone: "ok" | "warn" | "muted" | "danger";
} {
  switch (s) {
    case "conectado":
      return { text: "Conectado", tone: "ok" };
    case "qr_pendiente":
      return { text: "Esperando escaneo de QR", tone: "warn" };
    case "iniciando":
      return { text: "Iniciando…", tone: "warn" };
    case "error":
      return { text: "Error en la sesión", tone: "danger" };
    case "desconectado":
    case null:
    case undefined:
    case "":
      return { text: "Desconectado", tone: "muted" };
    default:
      return { text: String(s), tone: "muted" };
  }
}

function toneClasses(tone: "ok" | "warn" | "muted" | "danger"): string {
  switch (tone) {
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "muted":
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function Whatsapp() {
  const [estado, setEstado] = useState<EstadoResponse | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "iniciar" | "detener" | "enviar">(null);

  const [destino, setDestino] = useState("");
  const [texto, setTexto] = useState("");

  const pollRef = useRef<number | null>(null);

  async function loadEstado() {
    try {
      const data = await apiGet<EstadoResponse>("/api/tenant/whatsapp/estado");
      setEstado(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        setErr("El módulo WhatsApp aún no está habilitado en este entorno.");
      } else if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("No se pudo consultar el estado de WhatsApp.");
      }
    }
  }

  async function loadMensajes() {
    try {
      const data = await apiGet<{ messages: Mensaje[] }>(
        "/api/tenant/whatsapp/mensajes?limit=50",
      );
      setMensajes(data.messages);
    } catch {
      // Silencioso: el bloque de estado ya muestra el error principal.
    }
  }

  async function refresh() {
    await Promise.all([loadEstado(), loadMensajes()]);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    pollRef.current = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciar() {
    setBusy("iniciar");
    setErr(null);
    setInfo(null);
    try {
      await apiSend("POST", "/api/tenant/whatsapp/sesion/iniciar", {});
      setInfo("Sesión iniciada. Escanea el QR desde tu WhatsApp.");
      await refresh();
    } catch (e) {
      // 503 wa_worker_offline → mostrar inmediatamente el banner amarillo
      // de offline, sin esperar al próximo poll que confirma workerOnline.
      if (e instanceof ApiError && e.code === "wa_worker_offline") {
        setEstado((prev) =>
          prev
            ? { ...prev, workerOnline: false }
            : { session: null, live: null, workerOnline: false },
        );
      } else {
        setErr(e instanceof Error ? e.message : "No se pudo iniciar.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function detener() {
    if (!window.confirm("¿Cerrar la sesión de WhatsApp del bot?")) return;
    setBusy("detener");
    setErr(null);
    setInfo(null);
    try {
      await apiSend("POST", "/api/tenant/whatsapp/sesion/detener", {});
      setInfo("Sesión detenida.");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo detener.");
    } finally {
      setBusy(null);
    }
  }

  async function enviar() {
    const parsed = SendSchema.safeParse({ to: destino, text: texto });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setBusy("enviar");
    setErr(null);
    setInfo(null);
    try {
      await apiSend("POST", "/api/tenant/whatsapp/enviar", parsed.data);
      setInfo("Mensaje enviado.");
      setTexto("");
      await loadMensajes();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo enviar.");
    } finally {
      setBusy(null);
    }
  }

  const sesion = estado?.session ?? null;
  const liveState = estado?.live?.state ?? null;
  const effectiveStatus = liveState ?? sesion?.status ?? "desconectado";
  const tag = statusLabel(effectiveStatus);
  const conectado = effectiveStatus === "conectado";
  const qr = sesion?.qr_code ?? null;
  const workerOffline = estado?.workerOnline === false;

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <header className="mt-3">
          <h1 className="text-lg font-semibold text-gray-900">WhatsApp del bot</h1>
          <p className="text-xs text-gray-500">
            Cecilia atiende a tus clientes por WhatsApp. Conecta tu número una sola
            vez escaneando el QR.
          </p>
        </header>

        {workerOffline && (
          <div
            className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            data-testid="wa-worker-offline"
          >
            El servicio de WhatsApp está temporalmente offline. Intentá en unos
            minutos. Si el problema persiste, contactá al soporte AXYNTRAX.
          </div>
        )}
        {err && (
          <div
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            data-testid="wa-error"
          >
            {err}
          </div>
        )}
        {info && (
          <div
            className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
            data-testid="wa-info"
          >
            {info}
          </div>
        )}

        <section
          className={
            "mt-4 rounded-2xl border px-4 py-3 " + toneClasses(tag.tone)
          }
          data-testid="wa-estado"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                Estado
              </div>
              <div className="text-sm font-semibold" data-testid="wa-estado-label">
                {tag.text}
              </div>
            </div>
            <div className="text-right text-[11px] opacity-70">
              {sesion?.phone_number ? (
                <div data-testid="wa-numero">+{sesion.phone_number}</div>
              ) : (
                <div>Sin número conectado</div>
              )}
              {sesion?.updated_at && (
                <div>Actualizado {fmtFecha(sesion.updated_at)}</div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void iniciar()}
            disabled={busy !== null || conectado}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
            data-testid="wa-iniciar"
          >
            {busy === "iniciar"
              ? "Iniciando…"
              : conectado
                ? "Sesión activa"
                : "Iniciar / generar QR"}
          </button>
          <button
            type="button"
            onClick={() => void detener()}
            disabled={busy !== null || effectiveStatus === "desconectado"}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
            data-testid="wa-detener"
          >
            {busy === "detener" ? "Cerrando…" : "Desconectar"}
          </button>
        </section>

        {qr && !conectado && (
          <section
            className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-center"
            data-testid="wa-qr-block"
          >
            <p className="text-xs text-gray-600">
              Abre WhatsApp en tu teléfono → Menú → Dispositivos vinculados →
              Vincular un dispositivo, y apunta la cámara a este código.
            </p>
            <div className="mt-3 flex justify-center">
              {qr.startsWith("data:image") ? (
                <img
                  src={qr}
                  alt="Código QR para vincular WhatsApp"
                  className="h-64 w-64 rounded-lg border border-gray-200"
                  data-testid="wa-qr-img"
                />
              ) : (
                <pre
                  className="max-w-full overflow-auto rounded-lg bg-gray-900 p-3 text-left text-[10px] leading-tight text-emerald-300"
                  data-testid="wa-qr-text"
                >
{qr}
                </pre>
              )}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              El QR caduca a los pocos minutos. Si no logras escanearlo, vuelve a
              presionar “Iniciar”.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Enviar mensaje manual
          </h2>
          <p className="mt-1 text-[11px] text-gray-500">
            Solo funciona cuando la sesión está conectada. Usa el formato
            internacional sin espacios, por ejemplo 51987654321.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr,2fr]">
            <input
              type="tel"
              inputMode="tel"
              placeholder="51987654321"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              data-testid="wa-input-destino"
            />
            <input
              type="text"
              placeholder="Mensaje"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              data-testid="wa-input-texto"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={busy !== null || !conectado}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              data-testid="wa-enviar"
            >
              {busy === "enviar" ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">
            Últimos mensajes
          </h2>
          {loading ? (
            <p className="mt-2 text-xs text-gray-500">Cargando…</p>
          ) : mensajes.length === 0 ? (
            <p
              className="mt-2 text-xs text-gray-500"
              data-testid="wa-mensajes-vacio"
            >
              Aún no hay mensajes. Cuando un cliente escriba al número, aparecerá
              aquí.
            </p>
          ) : (
            <ul className="mt-2 space-y-2" data-testid="wa-mensajes-lista">
              {mensajes.map((m) => {
                const entrante = m.direccion === "in";
                return (
                  <li
                    key={m.id}
                    className={
                      "rounded-xl border px-3 py-2 text-xs " +
                      (entrante
                        ? "border-gray-200 bg-white"
                        : "border-emerald-200 bg-emerald-50")
                    }
                    data-testid="wa-mensaje"
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-500">
                      <span>
                        {entrante ? "Entrante" : "Saliente"} ·{" "}
                        {entrante ? (m.from ?? "?") : (m.to ?? "?")}
                      </span>
                      <span>{fmtFecha(m.created_at)}</span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-gray-800">
                      {m.body}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <SideNav />
    </>
  );
}
