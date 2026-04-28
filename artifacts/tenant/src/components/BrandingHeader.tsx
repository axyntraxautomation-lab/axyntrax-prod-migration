import { useState } from "react";
import { Link } from "wouter";
import { useTenantReady } from "@/providers/TenantProvider";
import { nombreEmpresaToIniciales } from "@/lib/initials";
import { AlertasDrawer, useAlertasUnreadCount } from "@/components/AlertasDrawer";

export function BrandingHeader() {
  const me = useTenantReady();
  const nombre = me.tenant.nombreEmpresa;
  const logo = me.branding?.logoUrl ?? null;
  const iniciales = nombreEmpresaToIniciales(nombre);
  const [alertasOpen, setAlertasOpen] = useState(false);
  const { count, refetch } = useAlertasUnreadCount();
  return (
    <header
      className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur"
      style={{ borderColor: "color-mix(in srgb, var(--color-primario) 30%, #e5e7eb)" }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          aria-label="Ir al dashboard"
        >
          {logo ? (
            <img
              src={logo}
              alt={nombre}
              className="h-10 w-10 rounded-xl object-cover"
              style={{
                boxShadow: "0 0 0 2px var(--color-primario)",
              }}
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primario), var(--color-secundario))",
              }}
            >
              {iniciales}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">{nombre}</div>
            <div className="text-[11px] text-gray-500">
              Cecilia · {me.rubro?.nombre ?? "Tu negocio"}
            </div>
          </div>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-xs">
          <Link
            href="/dashboard"
            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            Inicio
          </Link>
          <Link
            href="/faq"
            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            FAQs
          </Link>
          <button
            type="button"
            onClick={() => setAlertasOpen(true)}
            className="relative ml-1 rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
            aria-label={
              count > 0
                ? `Bandeja de alertas: ${count} sin leer`
                : "Bandeja de alertas"
            }
            data-testid="btn-abrir-alertas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {count > 0 ? (
              <span
                data-testid="alertas-badge"
                className="absolute -right-0.5 -top-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white"
              >
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </button>
        </nav>
      </div>
      <AlertasDrawer
        open={alertasOpen}
        onClose={() => {
          setAlertasOpen(false);
          void refetch();
        }}
        onCountChange={() => {
          void refetch();
        }}
      />
    </header>
  );
}
