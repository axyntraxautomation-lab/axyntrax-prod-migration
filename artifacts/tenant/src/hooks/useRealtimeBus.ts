/**
 * Bus de eventos Realtime para el tenant. Suscripción única por proceso a
 * todas las tablas tenant_* relevantes, con filtro `tenant_id=eq.<id>` para
 * defense-in-depth (RLS ya filtra en el server, esto evita ruido).
 *
 * Cada componente escucha un evento por nombre de tabla y, vía
 * `useRealtimeRefetch(tablas, callback)`, recibe un único disparo con
 * debounce 200ms y tope de 5 invalidaciones/segundo por tabla (para evitar
 * tormentas si llegan muchos eventos seguidos).
 */
import { useEffect, useRef } from "react";
import { useTenant } from "@/providers/TenantProvider";
import {
  getSupabaseRealtime,
  setSupabaseAuth,
  disposeSupabase,
  type RealtimeChannel,
} from "@/lib/supabase";

type TableName =
  | "tenant_alertas"
  | "tenant_inventario"
  | "tenant_finanzas_movimientos"
  | "tenant_citas_servicios"
  | "tenant_clientes_finales"
  | "tenant_pagos_qr"
  | "tenant_servicios"
  | "tenant_empleados";

const TABLES: TableName[] = [
  "tenant_alertas",
  "tenant_inventario",
  "tenant_finanzas_movimientos",
  "tenant_citas_servicios",
  "tenant_clientes_finales",
  "tenant_pagos_qr",
  "tenant_servicios",
  "tenant_empleados",
];

type Listener = () => void;
const listeners = new Map<TableName, Set<Listener>>();
const lastDispatchAt = new Map<TableName, number>();
const pendingTimer = new Map<TableName, number>();

const DEBOUNCE_MS = 200;
const MAX_PER_SEC = 5;

function dispatch(table: TableName): void {
  const now = Date.now();
  const lastAt = lastDispatchAt.get(table) ?? 0;
  const minInterval = 1000 / MAX_PER_SEC;
  const wait = Math.max(DEBOUNCE_MS, minInterval - (now - lastAt));
  if (pendingTimer.has(table)) return; // ya hay uno pendiente, coalesce
  const timer = window.setTimeout(() => {
    pendingTimer.delete(table);
    lastDispatchAt.set(table, Date.now());
    const set = listeners.get(table);
    if (!set) return;
    for (const cb of set) {
      try {
        cb();
      } catch {
        // listener malo no debe romper el bus
      }
    }
  }, wait);
  pendingTimer.set(table, timer);
}

let bootstrapped = false;
let bootstrappedTenantId: string | null = null;
let channels: RealtimeChannel[] = [];

function bootstrap(args: {
  tenantId: string;
  url: string;
  anonKey: string;
  jwt: string;
}): void {
  if (bootstrapped && bootstrappedTenantId === args.tenantId) {
    setSupabaseAuth(args.jwt);
    return;
  }
  if (bootstrapped) {
    disposeSupabase();
    channels = [];
    bootstrapped = false;
  }
  const client = getSupabaseRealtime({ url: args.url, anonKey: args.anonKey });
  setSupabaseAuth(args.jwt);
  channels = TABLES.map((table) =>
    client
      .channel(`tenant:${args.tenantId}:${table}`)
      .on(
        "postgres_changes" as unknown as "system",
        {
          event: "*",
          schema: "public",
          table,
          filter: `tenant_id=eq.${args.tenantId}`,
        } as never,
        () => dispatch(table),
      )
      .subscribe(),
  );
  bootstrapped = true;
  bootstrappedTenantId = args.tenantId;
}

/**
 * Mount-once: arranca el bus en cuanto el TenantProvider entrega un JWT.
 * Se invoca desde un punto único (ver TenantProvider) para evitar múltiples
 * canales por tabla.
 */
export function useTenantRealtimeBootstrap(args: {
  url: string | null;
  anonKey: string | null;
  tenantId: string | null;
  getJwt: () => string | null;
}): void {
  const { url, anonKey, tenantId, getJwt } = args;
  useEffect(() => {
    if (!url || !anonKey || !tenantId) return;
    let cancelled = false;
    let attempts = 0;
    const tryBoot = () => {
      if (cancelled) return;
      const jwt = getJwt();
      if (!jwt) {
        attempts++;
        if (attempts < 30) {
          window.setTimeout(tryBoot, 500);
        }
        return;
      }
      bootstrap({ tenantId, url, anonKey, jwt });
    };
    tryBoot();
    return () => {
      cancelled = true;
      // Limpieza completa: remueve los canales Realtime y cierra el cliente
      // si el bootstrap arrancó. Si nunca llegó a bootstrappearse (no hubo
      // jwt), no hay nada que cerrar.
      if (bootstrapped && bootstrappedTenantId === tenantId) {
        try {
          disposeSupabase();
        } catch {
          // ignore dispose errors
        }
        channels = [];
        bootstrapped = false;
        bootstrappedTenantId = null;
      }
      // Cancela cualquier dispatch pendiente (timers de debounce/throttle).
      for (const [t, timer] of pendingTimer) {
        window.clearTimeout(timer);
        pendingTimer.delete(t);
      }
    };
  }, [url, anonKey, tenantId, getJwt]);
}

/**
 * Suscribe `cb` a uno o más eventos de tabla. Devuelve un unsubscribe que
 * se debe limpiar en useEffect.
 */
export function useRealtimeRefetch(tablas: TableName[], cb: () => void): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    const wrapped: Listener = () => cbRef.current();
    for (const t of tablas) {
      let set = listeners.get(t);
      if (!set) {
        set = new Set();
        listeners.set(t, set);
      }
      set.add(wrapped);
    }
    return () => {
      for (const t of tablas) {
        listeners.get(t)?.delete(wrapped);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablas.join("|")]);
}
