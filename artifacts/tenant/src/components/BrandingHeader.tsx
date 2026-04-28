import { Link } from "wouter";
import { useTenantReady } from "@/providers/TenantProvider";
import { nombreEmpresaToIniciales } from "@/lib/initials";

export function BrandingHeader() {
  const me = useTenantReady();
  const nombre = me.tenant.nombreEmpresa;
  const logo = me.branding?.logoUrl ?? null;
  const iniciales = nombreEmpresaToIniciales(nombre);
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
        </nav>
      </div>
    </header>
  );
}
