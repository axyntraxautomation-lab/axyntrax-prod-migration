import { useEffect } from "react";
import { useTenant } from "./TenantProvider";

/**
 * Aplica las CSS variables de branding del tenant (--color-primario y
 * --color-secundario) sobre el root para que todos los componentes
 * white-label hereden la paleta del negocio.
 */
export function BrandingStyles() {
  const { state } = useTenant();
  useEffect(() => {
    if (state.status !== "ready") return;
    const branding = state.me.branding;
    const primario = branding?.colorPrimario ?? "#06B6D4";
    const secundario = branding?.colorSecundario ?? "#7C3AED";
    const root = document.documentElement;
    root.style.setProperty("--color-primario", primario);
    root.style.setProperty("--color-secundario", secundario);
  }, [state]);
  return null;
}
