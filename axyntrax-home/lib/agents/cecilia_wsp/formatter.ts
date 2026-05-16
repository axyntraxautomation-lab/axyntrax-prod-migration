/**
 * Adapta el texto de la IA para las limitaciones y estilos de WhatsApp.
 */
export const formatWspText = (text: string): string => {
  if (!text) return '';

  return text
    // Convertir negritas de Markdown (**) a negritas de WhatsApp (*)
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    // Eliminar encabezados Markdown (#)
    .replace(/^#+\s+/gm, '')
    // Asegurar que las listas tengan un formato limpio
    .replace(/^\s*[-*+]\s+/gm, '• ')
    // Limpiar saltos de línea excesivos
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
