import { Link, useLocation } from "wouter";
import { useTenantReady } from "@/providers/TenantProvider";
import { getTerminologia } from "@/lib/rubro-terminologia";

type Item = {
  href: (slug: string) => string;
  label: string;
  testid: string;
};

/**
 * Barra inferior fija (mobile-first) con los módulos del tenant.
 * Las etiquetas se adaptan al rubro vía `getTerminologia`.
 */
export function SideNav() {
  const me = useTenantReady();
  const [loc] = useLocation();
  const slug = me.tenant.slug;
  const term = getTerminologia(me.tenant.rubroId);

  const items: Item[] = [
    {
      href: (s) => `/t/${s}/dashboard`,
      label: "Inicio",
      testid: "nav-dashboard",
    },
    {
      href: (s) => `/t/${s}/agenda`,
      label: term.agenda,
      testid: "nav-agenda",
    },
    {
      href: (s) => `/t/${s}/inventario`,
      label: term.inventario,
      testid: "nav-inventario",
    },
    {
      href: (s) => `/t/${s}/clientes`,
      label: term.clientes,
      testid: "nav-clientes",
    },
    {
      href: (s) => `/t/${s}/finanzas`,
      label: "Finanzas",
      testid: "nav-finanzas",
    },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm"
        data-testid="side-nav"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {items.map((it) => {
            const href = it.href(slug);
            const active = loc === href || loc.startsWith(`${href}/`);
            return (
              <li key={it.testid}>
                <Link
                  href={href}
                  className={
                    "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium uppercase tracking-wide " +
                    (active ? "text-gray-900" : "text-gray-500 hover:text-gray-700")
                  }
                  data-testid={it.testid}
                  data-active={active ? "true" : "false"}
                >
                  <span
                    className="h-1 w-6 rounded-full"
                    style={{
                      background: active
                        ? "var(--color-primario)"
                        : "transparent",
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Spacer para que el contenido no quede tapado por la nav fija. */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
}
