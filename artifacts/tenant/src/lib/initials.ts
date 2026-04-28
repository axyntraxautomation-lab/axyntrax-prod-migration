/**
 * Genera iniciales (1-2 chars) a partir del nombre de la empresa.
 * Usado como fallback cuando el tenant aún no subió logo.
 */
export function nombreEmpresaToIniciales(nombre: string): string {
  const limpio = nombre.trim();
  if (!limpio) return "·";
  const palabras = limpio.split(/\s+/).filter((p) => p.length > 0);
  if (palabras.length === 1) {
    return palabras[0].slice(0, 2).toUpperCase();
  }
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}
