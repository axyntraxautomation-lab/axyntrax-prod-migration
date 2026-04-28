import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  apiGet,
  ApiError,
  type TenantMe,
  type TenantJwtResponse,
} from "@/lib/api";
import { redirectToPortalLogin } from "@/lib/portal-redirect";
import { useTenantRealtimeBootstrap } from "@/hooks/useRealtimeBus";
import { setSupabaseAuth } from "@/lib/supabase";

type TenantState =
  | { status: "loading" }
  | { status: "needs_signup" }
  | { status: "ready"; me: TenantMe }
  | { status: "error"; message: string };

type TenantContextValue = {
  state: TenantState;
  refresh: () => Promise<void>;
  setMe: (me: TenantMe) => void;
  /** JWT in-memory para llamadas opcionales a Supabase REST. */
  getJwt: () => string | null;
};

const TenantContext = createContext<TenantContextValue | null>(null);

const JWT_REFRESH_BEFORE_EXP_MS = 10 * 60 * 1000; // refresca 10min antes
const JWT_FALLBACK_REFRESH_MS = 50 * 60 * 1000; // o cada 50min

export function TenantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TenantState>({ status: "loading" });
  const jwtRef = useRef<{ token: string; expiresAt: number } | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const rotateInFlightRef = useRef<Promise<void> | null>(null);
  const lastRotateAtRef = useRef<number>(0);

  const scheduleJwtRefresh = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }
    const next = jwtRef.current;
    if (!next) return;
    const wait = Math.max(
      30_000,
      Math.min(JWT_FALLBACK_REFRESH_MS, next.expiresAt - Date.now() - JWT_REFRESH_BEFORE_EXP_MS),
    );
    refreshTimerRef.current = window.setTimeout(() => {
      void rotateJwt();
    }, wait);
  }, []);

  const rotateJwt = useCallback(async (): Promise<void> => {
    // Dedupe: si ya hay rotación en vuelo, devolvemos la misma promesa.
    if (rotateInFlightRef.current) return rotateInFlightRef.current;
    const p = (async () => {
      try {
        const data = await apiGet<TenantJwtResponse>("/api/tenant/jwt");
        jwtRef.current = {
          token: data.jwt,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
        // Empuja el token nuevo a Supabase Realtime si está activo.
        setSupabaseAuth(data.jwt);
        scheduleJwtRefresh();
      } catch {
        // Si el JWT no se puede rotar (p.ej. tenant aún no creado) no es fatal:
        // el frontend usará los endpoints proxied del api-server.
        jwtRef.current = null;
      } finally {
        lastRotateAtRef.current = Date.now();
        rotateInFlightRef.current = null;
      }
    })();
    rotateInFlightRef.current = p;
    return p;
  }, [scheduleJwtRefresh]);

  // Llamado por el bus Realtime cuando un canal reporta CHANNEL_ERROR /
  // TIMED_OUT (típicamente JWT expirado o reconexión sin auth fresco).
  // Rota el JWT y deja que `setSupabaseAuth` lo aplique automáticamente.
  // Throttle: si recién rotamos hace <5s o hay rotación en vuelo, no relanza
  // (los 8 canales del bus pueden disparar el callback en simultáneo).
  const onTokenExpired = useCallback(() => {
    if (rotateInFlightRef.current) return;
    if (Date.now() - lastRotateAtRef.current < 5000) return;
    void rotateJwt();
  }, [rotateJwt]);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const me = await apiGet<TenantMe>("/api/tenant/me");
      setState({ status: "ready", me });
      void rotateJwt();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          redirectToPortalLogin();
          return;
        }
        if (err.status === 404 && err.code === "tenant_not_found") {
          setState({ status: "needs_signup" });
          return;
        }
        if (err.status === 503) {
          setState({
            status: "error",
            message:
              "El módulo Cecilia aún no está activo en este entorno. Contacta a soporte AXYNTRAX.",
          });
          return;
        }
        setState({ status: "error", message: err.message });
        return;
      }
      setState({ status: "error", message: "No se pudo conectar con el servidor." });
    }
  }, [rotateJwt]);

  useEffect(() => {
    void load();
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [load]);

  const getJwt = useCallback(() => jwtRef.current?.token ?? null, []);

  const value: TenantContextValue = {
    state,
    refresh: load,
    setMe: (me) => setState({ status: "ready", me }),
    getJwt,
  };

  const realtime = state.status === "ready" ? state.me.realtime : null;
  const tenantId = state.status === "ready" ? state.me.tenant.id : null;
  useTenantRealtimeBootstrap({
    url: realtime?.supabaseUrl ?? null,
    anonKey: realtime?.supabaseAnonKey ?? null,
    tenantId,
    getJwt,
    onTokenExpired,
  });

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant debe usarse dentro de <TenantProvider>");
  return ctx;
}

export function useTenantReady() {
  const { state } = useTenant();
  if (state.status !== "ready") {
    throw new Error("useTenantReady llamado fuera de estado ready");
  }
  return state.me;
}
