import { eq } from "drizzle-orm";
import { db, modulesCatalogTable } from "@workspace/db";

/**
 * Static facts about the AXYNTRAX business that JARVIS must always know.
 * Edit here to update what the AI knows about the company.
 */
export const BUSINESS_FACTS = `
EMPRESA: AXYNTRAX AUTOMATION
UBICACIÓN: Arequipa, Perú
FUNDADOR / CEO: Miguel Angel Montero Garcia
CONTACTO PRINCIPAL: axyntraxautomation@gmail.com
WHATSAPP / YAPE: 991 740 590 (titular Miguel Angel Montero Garcia)

PROPUESTA DE VALOR:
AXYNTRAX vende módulos SaaS de automatización con IA, listos para
profesionales peruanos. Cada módulo es independiente y se factura por mes.
JARVIS (esta IA) coordina ventas, soporte, cotizaciones, publicidad y
administración del negocio.

INDUSTRIAS ATENDIDAS:
- Medicina (consultorios, clínicas)
- Dental (odontología)
- Veterinaria (clínicas veterinarias y pet shops)
- Legal (estudios y abogados)
- Condominios (administración y juntas de propietarios)

MODELO HÍBRIDO DE VENTA:
- Módulos con precio mensual > 0 → COTIZABLES. Se arma cotización formal en
  PDF con IGV 18 % incluido y se manda por email. El cliente acepta dentro
  del portal y paga por Yape.
- Módulos con precio mensual = 0 → DEMO GRATUITA por 30 días.
  Activación inmediata por el equipo / admin.

PROCESO ESTÁNDAR:
1. Prospecto crea cuenta en el portal (www.axyntrax-automation.net).
2. Habla con JARVIS (chat público) o navega el catálogo.
3. Pide cotización o demo según el módulo.
4. Recibe cotización en PDF + email.
5. Acepta dentro del portal.
6. Paga por Yape al 991 740 590 (Miguel Angel Montero Garcia).
7. JARVIS / admin activa el módulo y emite la license key
   (formato AXYN-<SLUG>-<HEX12>) más certificado PDF.

CANALES ACTIVOS:
- Web pública: portal en /, catálogo + chat JARVIS Ventas.
- Dashboard interno JARVIS en /jarvis/ (acceso admin con 2FA).
- WhatsApp Cloud API (responde automáticamente con JARVIS).
- Facebook + Instagram DMs (ingestados al inbox).
- Gmail triage interno por "Cecilia".
- Publicidad automática (Facebook + Instagram) cada 1 hora.

TONO Y FORMATO:
- Español neutral profesional, voz peruana cuando aplique.
- Sin emojis nunca.
- Respuestas breves y directas (máx 6 líneas en chat / WhatsApp).
- Para depósitos siempre mencionar el Yape 991 740 590 a nombre de
  Miguel Angel Montero Garcia.
`.trim();

export interface CatalogSnapshotEntry {
  slug: string;
  name: string;
  industry: string;
  monthlyPrice: number;
  currency: string;
  description: string | null;
  kind: "cotizable" | "demo";
}

/**
 * Snapshot del catálogo activo, para meterlo dentro del system prompt.
 */
export async function loadCatalogSnapshot(): Promise<CatalogSnapshotEntry[]> {
  const rows = await db
    .select()
    .from(modulesCatalogTable)
    .where(eq(modulesCatalogTable.active, 1));
  return rows.map((m) => {
    const price = Number(m.monthlyPrice);
    return {
      slug: m.slug,
      name: m.name,
      industry: m.industry,
      monthlyPrice: price,
      currency: m.currency,
      description: m.description ?? null,
      kind: price > 0 ? ("cotizable" as const) : ("demo" as const),
    };
  });
}

/** Texto humano-legible del catálogo, listo para inyectar en un prompt. */
export function formatCatalogForPrompt(rows: CatalogSnapshotEntry[]): string {
  if (rows.length === 0) return "(catálogo vacío)";
  return rows
    .map((m) => {
      const tag =
        m.kind === "cotizable"
          ? `${m.currency} ${m.monthlyPrice.toFixed(2)}/mes`
          : "DEMO GRATIS 30 días";
      const desc = m.description ? `\n  ${m.description}` : "";
      return `- [${m.slug}] ${m.name} · industria=${m.industry} · ${tag}${desc}`;
    })
    .join("\n");
}

/**
 * Devuelve el bloque completo de conocimiento (BUSINESS_FACTS + catálogo).
 * Úsenlo cualquier prompt de JARVIS (CORE, sales-bot, WhatsApp).
 */
export async function buildJarvisKnowledge(): Promise<string> {
  const rows = await loadCatalogSnapshot();
  const cotizables = rows.filter((r) => r.kind === "cotizable").length;
  const demos = rows.filter((r) => r.kind === "demo").length;
  const industries = new Set(rows.map((r) => r.industry));
  return `${BUSINESS_FACTS}

CATÁLOGO ACTUAL (${rows.length} módulos · ${cotizables} cotizables · ${demos} demos · ${industries.size} industrias):
${formatCatalogForPrompt(rows)}`;
}
