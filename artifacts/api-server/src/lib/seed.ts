import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  clientsTable,
  licensesTable,
  modulesCatalogTable,
} from "@workspace/db";
import { hashPassword } from "./auth";
import { encryptField } from "./crypto";
import { logger } from "./logger";

const ADMIN_EMAIL = "axyntraxautomation@gmail.com";

export async function ensureSeedData(): Promise<void> {
  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL))
      .limit(1);

    if (!existing) {
      const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
      if (!bootstrapPassword) {
        logger.warn(
          { email: ADMIN_EMAIL },
          "Admin user not found and ADMIN_BOOTSTRAP_PASSWORD not set. Skipping admin seed. " +
            "Set ADMIN_BOOTSTRAP_PASSWORD once to bootstrap the first admin, then unset it.",
        );
      } else {
        const hash = await hashPassword(bootstrapPassword);
        await db.insert(usersTable).values({
          name: "Miguel Montero",
          email: ADMIN_EMAIL,
          passwordHash: hash,
          role: "admin",
        });
        logger.info(
          { email: ADMIN_EMAIL },
          "Seeded admin user from ADMIN_BOOTSTRAP_PASSWORD. Remove the env var now and rotate the password.",
        );
      }
    }

    const [anyClient] = await db.select().from(clientsTable).limit(1);
    if (!anyClient) {
      const seeded = await db
        .insert(clientsTable)
        .values([
          {
            name: "Lucía Vargas",
            company: "TextilSur SAC",
            industry: "Textil",
            email: "lvargas@textilsur.pe",
            phone: encryptField("+51 987 654 321"),
            channel: "whatsapp",
            stage: "demo_activa",
            score: 78,
            notes: encryptField("Interesada en módulo de inventario y CRM."),
          },
          {
            name: "Carlos Quispe",
            company: "Granja Andina",
            industry: "Agroindustria",
            email: "carlos@granjaandina.pe",
            phone: encryptField("+51 912 345 678"),
            channel: "facebook",
            stage: "negociacion",
            score: 65,
            notes: encryptField("Solicita propuesta plan 12m con AXIA."),
          },
          {
            name: "Renata Flores",
            company: "Boutique Renata",
            industry: "Retail",
            email: "renata@boutique.pe",
            phone: encryptField("+51 999 111 222"),
            channel: "instagram",
            stage: "cliente",
            score: 92,
            notes: encryptField("Cliente activo, módulo finanzas."),
          },
          {
            name: "Iván Soto",
            company: "Soto Logística",
            industry: "Logística",
            email: "ivan@sotolog.pe",
            phone: encryptField("+51 944 222 333"),
            channel: "web",
            stage: "prospecto",
            score: 35,
            notes: encryptField("Llegó por la web, agendar demo."),
          },
        ])
        .returning();
      logger.info({ count: seeded.length }, "Seeded sample clients");

      if (seeded.length > 0) {
        const now = Date.now();
        const oneYearFromNow = new Date(now + 365 * 24 * 60 * 60 * 1000);
        const sixMonthsFromNow = new Date(now + 180 * 24 * 60 * 60 * 1000);
        await db.insert(licensesTable).values([
          {
            clientId: seeded[2].id,
            key: encryptField("AXYN-RENATA-2026-LIVE") ?? "AXYN-RENATA-2026-LIVE",
            type: "plan_12m",
            module: "finanzas",
            status: "activa",
            startDate: new Date(),
            endDate: oneYearFromNow,
            amount: "1200.00",
            currency: "PEN",
          },
          {
            clientId: seeded[0].id,
            key: encryptField("AXYN-DEMO-LUCIA-30D") ?? "AXYN-DEMO-LUCIA-30D",
            type: "demo",
            module: "crm",
            status: "activa",
            startDate: new Date(),
            endDate: new Date(now + 30 * 24 * 60 * 60 * 1000),
          },
          {
            clientId: seeded[1].id,
            key: encryptField("AXYN-CQUISPE-6M") ?? "AXYN-CQUISPE-6M",
            type: "plan_6m",
            module: "axia",
            status: "pendiente",
            startDate: new Date(),
            endDate: sixMonthsFromNow,
            amount: "780.00",
            currency: "PEN",
          },
        ]);
        logger.info("Seeded sample licenses");
      }
    }
    await ensureModulesCatalog();
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}

const DEFAULT_MODULES = [
  // Medical
  { slug: "med-historia-clinica", industry: "medical", name: "Historia Clínica Electrónica", description: "Gestión de fichas médicas, antecedentes y recetas digitales.", monthlyPrice: "199.00" },
  { slug: "med-citas", industry: "medical", name: "Agenda Médica con Recordatorios", description: "Reservas online y recordatorios automáticos por WhatsApp.", monthlyPrice: "149.00" },
  { slug: "med-facturacion", industry: "medical", name: "Facturación SUNAT Salud", description: "Comprobantes electrónicos integrados con tu consultorio.", monthlyPrice: "129.00" },
  // Legal
  { slug: "legal-expedientes", industry: "legal", name: "Expedientes y Casos", description: "Gestión de casos, plazos procesales y notificaciones.", monthlyPrice: "199.00" },
  { slug: "legal-contratos", industry: "legal", name: "Generador de Contratos IA", description: "Plantillas legales y borradores con asistente IA.", monthlyPrice: "179.00" },
  { slug: "legal-honorarios", industry: "legal", name: "Honorarios y Cobranza", description: "Control de horas, honorarios y cobranza automática.", monthlyPrice: "129.00" },
  // Dental
  { slug: "dental-odontograma", industry: "dental", name: "Odontograma Digital", description: "Ficha dental interactiva por paciente.", monthlyPrice: "169.00" },
  { slug: "dental-citas", industry: "dental", name: "Agenda Dental + Recordatorios", description: "Reservas online y recordatorios de control.", monthlyPrice: "129.00" },
  // Veterinary
  { slug: "vet-historial", industry: "veterinary", name: "Historial de Mascotas", description: "Fichas, vacunas y controles por mascota.", monthlyPrice: "149.00" },
  { slug: "vet-tienda", industry: "veterinary", name: "Tienda y Stock Veterinario", description: "Inventario de productos y ventas POS.", monthlyPrice: "139.00" },
  // Condo
  { slug: "condo-cuotas", industry: "condo", name: "Cuotas y Cobranza", description: "Cuotas mensuales y mora automática por unidad.", monthlyPrice: "199.00" },
  { slug: "condo-reservas", industry: "condo", name: "Reservas de Áreas Comunes", description: "Calendario y reservas de salones, piscina, gimnasio.", monthlyPrice: "99.00" },
  { slug: "condo-comunicaciones", industry: "condo", name: "Comunicaciones a Residentes", description: "Avisos masivos por WhatsApp y email.", monthlyPrice: "89.00" },
];

async function ensureModulesCatalog(): Promise<void> {
  const [first] = await db.select().from(modulesCatalogTable).limit(1);
  if (first) return;
  await db.insert(modulesCatalogTable).values(
    DEFAULT_MODULES.map((m) => ({
      slug: m.slug,
      name: m.name,
      description: m.description,
      industry: m.industry,
      monthlyPrice: m.monthlyPrice,
      currency: "PEN",
      active: 1,
    })),
  );
  logger.info({ count: DEFAULT_MODULES.length }, "Seeded modules catalog");
}
