/**
 * Redirige al portal AXYNTRAX para login cuando el tenant no tiene cookie
 * `axyn_portal`. Usa la query `?next=` para volver al destino actual luego
 * del login. El portal vive en path `/portal/` y comparte cookies con el
 * tenant porque ambos van detrás del mismo dominio público.
 */
export function redirectToPortalLogin(): void {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/portal/login?next=${next}`;
}
