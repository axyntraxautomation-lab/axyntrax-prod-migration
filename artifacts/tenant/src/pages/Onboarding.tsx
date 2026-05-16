import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import { apiGet, apiSend, ApiError } from "@/lib/api";
import { useTenant } from "@/providers/TenantProvider";
import { nombreEmpresaToIniciales } from "@/lib/initials";

type RubroOption = {
  rubroId: string;
  nombre: string;
  cecilia_persona: string;
  modulos: string[];
  kpis: string[];
  onboarding_steps: string[];
};

type RubrosResponse = { rubros: RubroOption[] };

type SignupResponse = { tenant_id: string; slug: string };

type BrandingResponse = {
  branding: {
    id: string;
    logoUrl: string | null;
    colorPrimario: string;
    colorSecundario: string;
  };
};

type LogoResponse = { logo_url: string };

const COLOR_PRESETS: Array<{ primario: string; secundario: string; nombre: string }> = [
  { nombre: "Cian + Violeta", primario: "#06B6D4", secundario: "#7C3AED" },
  { nombre: "Verde + Esmeralda", primario: "#10B981", secundario: "#059669" },
  { nombre: "Rojo + Naranja", primario: "#EF4444", secundario: "#F97316" },
  { nombre: "Azul + Índigo", primario: "#2563EB", secundario: "#4F46E5" },
  { nombre: "Rosa + Fucsia", primario: "#EC4899", secundario: "#D946EF" },
  { nombre: "Ámbar + Café", primario: "#F59E0B", secundario: "#92400E" },
];

export function Onboarding() {
  const { state, refresh, setMe } = useTenant();
  const [, setLocation] = useLocation();

  const initialStep =
    state.status === "ready"
      ? Math.min(2, Math.max(0, state.me.onboarding?.currentStep ?? 0))
      : 0;
  const [step, setStep] = useState<number>(initialStep);
  const [rubros, setRubros] = useState<RubroOption[]>([]);
  const [rubroId, setRubroId] = useState<string>(
    state.status === "ready" ? state.me.tenant.rubroId : "",
  );
  const [nombreEmpresa, setNombreEmpresa] = useState<string>(
    state.status === "ready" ? state.me.tenant.nombreEmpresa : "",
  );
  const [colorPrimario, setColorPrimario] = useState(
    state.status === "ready"
      ? state.me.branding?.colorPrimario ?? "#06B6D4"
      : "#06B6D4",
  );
  const [colorSecundario, setColorSecundario] = useState(
    state.status === "ready"
      ? state.me.branding?.colorSecundario ?? "#7C3AED"
      : "#7C3AED",
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(
    state.status === "ready" ? state.me.branding?.logoUrl ?? null : null,
  );
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga catálogo de rubros (público no expuesto: usamos /api/tenant/me + fallback estático).
  // Como no hay endpoint público para listar rubros, los inferimos del registry baseline.
  useEffect(() => {
    let cancelled = false;
    apiGet<RubrosResponse>("/api/tenant/rubros")
      .then((r) => {
        if (!cancelled) setRubros(r.rubros);
      })
      .catch(() => {
        // Fallback: hardcodea los 9 rubros baseline conocidos.
        if (!cancelled) {
          setRubros([
            { rubroId: "car_wash", nombre: "Car Wash", cecilia_persona: "Asistente de lavado vehicular", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "restaurante", nombre: "Restaurante", cecilia_persona: "Asistente de cocina y pedidos", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "salon", nombre: "Salón de Belleza", cecilia_persona: "Asistente de citas y estética", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "taller", nombre: "Taller Mecánico", cecilia_persona: "Asistente técnico automotriz", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "gimnasio", nombre: "Gimnasio", cecilia_persona: "Asistente de membresías y rutinas", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "farmacia", nombre: "Farmacia", cecilia_persona: "Asistente de medicamentos y stock", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "bodega", nombre: "Bodega / Minimarket", cecilia_persona: "Asistente de stock y ventas", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "consultoria", nombre: "Consultoría", cecilia_persona: "Asistente de proyectos y clientes", modulos: [], kpis: [], onboarding_steps: [] },
            { rubroId: "logistica", nombre: "Logística", cecilia_persona: "Asistente de envíos y almacén", modulos: [], kpis: [], onboarding_steps: [] },
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tenantExists = state.status === "ready";

  const continuarStep1 = async () => {
    setError(null);
    if (!rubroId) {
      setError("Elige un rubro para continuar.");
      return;
    }
    if (nombreEmpresa.trim().length < 2) {
      setError("El nombre de tu negocio debe tener al menos 2 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (!tenantExists) {
        await apiSend<SignupResponse>("POST", "/api/tenant/signup", {
          nombre_empresa: nombreEmpresa.trim(),
          rubro_id: rubroId,
        });
        await refresh();
      }
      setStep(1);
      await apiSend("PUT", "/api/tenant/onboarding", { current_step: 1, total_steps: 3 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el negocio.");
    } finally {
      setBusy(false);
    }
  };

  const continuarStep2 = async () => {
    setError(null);
    setBusy(true);
    try {
      const data = await apiSend<BrandingResponse>("PUT", "/api/tenant/branding", {
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        logo_url: logoUrl,
      });
      if (state.status === "ready") {
        setMe({
          ...state.me,
          branding: {
            id: data.branding.id,
            logoUrl: data.branding.logoUrl,
            colorPrimario: data.branding.colorPrimario,
            colorSecundario: data.branding.colorSecundario,
            welcomeText: state.me.branding?.welcomeText ?? null,
          },
        });
      }
      await apiSend("PUT", "/api/tenant/onboarding", { current_step: 2, total_steps: 3 });
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar tu branding.");
    } finally {
      setBusy(false);
    }
  };

  const finalizar = async () => {
    setError(null);
    setBusy(true);
    try {
      await apiSend("PUT", "/api/tenant/onboarding", {
        current_step: 3,
        total_steps: 3,
        estado: "completado",
        completados: ["rubro", "branding", "whatsapp"],
      });
      await refresh();
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo finalizar el onboarding.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("El logo no puede pesar más de 2 MB.");
      return;
    }
    if (!tenantExists) {
      setError("Primero crea tu negocio en el paso anterior.");
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setError("Formato no soportado. Usa PNG, JPG, WebP o SVG.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(
        Array.from(new Uint8Array(buf))
          .map((b) => String.fromCharCode(b))
          .join(""),
      );
      const data = await apiSend<LogoResponse>("POST", "/api/tenant/logo", {
        base64,
        mime: file.type,
      });
      setLogoUrl(data.logo_url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir el logo.");
    } finally {
      setBusy(false);
    }
  };

  const headerStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario})`,
    }),
    [colorPrimario, colorSecundario],
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <header className="px-5 pt-8 pb-6 text-white" style={headerStyle}>
        <div className="mx-auto max-w-md">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
            AXYNTRAX · Cecilia
          </div>
          <h1 className="mt-1 text-2xl font-bold">Configura tu negocio</h1>
          <p className="mt-1 text-sm opacity-90">
            En 3 pasos vas a tener tu dashboard listo, con Cecilia adaptada a tu rubro.
          </p>
          <div className="mt-4 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                aria-hidden
                className="h-1.5 flex-1 rounded-full bg-white/30"
                style={i <= step ? { background: "white" } : {}}
              />
            ))}
          </div>
          <div className="mt-2 text-[11px] opacity-80">Paso {step + 1} de 3</div>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-5 shadow-sm">
        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        ) : null}

        {step === 0 ? (
          <div>
            <h2 className="text-base font-semibold text-gray-900">Paso 1 · Tu rubro</h2>
            <p className="mt-1 text-xs text-gray-500">
              Cecilia se ajusta automáticamente al rubro: KPIs, FAQs y agenda cambian
              según tu negocio.
            </p>
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-gray-700" htmlFor="nombre">
                Nombre de tu negocio
              </label>
              <input
                id="nombre"
                type="text"
                value={nombreEmpresa}
                onChange={(e) => setNombreEmpresa(e.target.value)}
                placeholder="Ej. Lavado El Misti"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                data-testid="onboarding-nombre"
                disabled={tenantExists}
              />
              {tenantExists ? (
                <p className="text-[11px] text-gray-400">
                  Ya creaste tu negocio. Para cambiar el nombre escribe a soporte.
                </p>
              ) : null}
            </div>
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium text-gray-700">Selecciona tu rubro</div>
              <div className="grid grid-cols-2 gap-2">
                {rubros.map((r) => (
                  <button
                    type="button"
                    key={r.rubroId}
                    onClick={() => setRubroId(r.rubroId)}
                    className={`rounded-xl border px-3 py-3 text-left text-xs transition ${
                      rubroId === r.rubroId
                        ? "border-cyan-500 bg-cyan-50 text-cyan-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                    data-testid={`rubro-${r.rubroId}`}
                  >
                    <div className="text-sm font-semibold">{r.nombre}</div>
                    <div className="mt-0.5 text-[10px] text-gray-500">
                      {r.cecilia_persona}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={continuarStep1}
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
              data-testid="onboarding-continuar-1"
            >
              {busy ? "Creando..." : "Continuar"}
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h2 className="text-base font-semibold text-gray-900">Paso 2 · Tu marca</h2>
            <p className="mt-1 text-xs text-gray-500">
              Carga tu logo y elige los colores. Si no tienes logo, mostramos las
              iniciales de tu negocio.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-base font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario})`,
                }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  nombreEmpresaToIniciales(nombreEmpresa || "TU NEGOCIO")
                )}
              </div>
              <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-center text-xs text-gray-700 hover:border-gray-400">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFile}
                  className="hidden"
                  data-testid="onboarding-logo"
                />
                {logoUrl ? "Reemplazar logo" : "Subir logo (PNG/JPG/SVG, máx 2 MB)"}
              </label>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-xs font-medium text-gray-700">Paletas sugeridas</div>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p.nombre}
                    onClick={() => {
                      setColorPrimario(p.primario);
                      setColorSecundario(p.secundario);
                    }}
                    className="rounded-xl border border-gray-200 p-2 text-[10px] text-gray-700 hover:border-gray-300"
                    aria-label={p.nombre}
                  >
                    <div
                      className="h-6 w-full rounded-md"
                      style={{
                        background: `linear-gradient(135deg, ${p.primario}, ${p.secundario})`,
                      }}
                    />
                    <div className="mt-1 text-center">{p.nombre}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-700">
                Color primario
                <input
                  type="color"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="mt-1 block h-10 w-full cursor-pointer rounded-xl border border-gray-200"
                  data-testid="onboarding-color-primario"
                />
              </label>
              <label className="text-xs text-gray-700">
                Color secundario
                <input
                  type="color"
                  value={colorSecundario}
                  onChange={(e) => setColorSecundario(e.target.value)}
                  className="mt-1 block h-10 w-full cursor-pointer rounded-xl border border-gray-200"
                  data-testid="onboarding-color-secundario"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={continuarStep2}
                disabled={busy}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                data-testid="onboarding-continuar-2"
              >
                {busy ? "Guardando..." : "Continuar"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h2 className="text-base font-semibold text-gray-900">Paso 3 · WhatsApp</h2>
            <p className="mt-1 text-xs text-gray-500">
              Conectaremos tu WhatsApp Business para que Cecilia atienda clientes 24/7.
              Por ahora deja tu número y nuestro equipo coordina la activación contigo.
            </p>
            <label className="mt-4 block text-xs font-medium text-gray-700" htmlFor="wa">
              Número WhatsApp Business (opcional)
            </label>
            <input
              id="wa"
              type="tel"
              inputMode="tel"
              value={whatsappNumero}
              onChange={(e) => setWhatsappNumero(e.target.value)}
              placeholder="+51 999 999 999"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
              data-testid="onboarding-whatsapp"
            />
            <p className="mt-2 text-[11px] text-gray-400">
              Aún no se conecta automáticamente: lo dejas guardado y AXYNTRAX te
              contacta para terminar la integración.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={finalizar}
                disabled={busy}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                data-testid="onboarding-finalizar"
              >
                {busy ? "Activando..." : "Ir al dashboard"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
