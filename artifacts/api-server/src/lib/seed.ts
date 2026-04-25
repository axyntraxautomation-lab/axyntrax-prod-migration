import { eq } from "drizzle-orm";
import { db, usersTable, clientsTable, licensesTable } from "@workspace/db";
import { hashPassword } from "./auth";
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
            phone: "+51 987 654 321",
            channel: "whatsapp",
            stage: "demo_activa",
            score: 78,
            notes: "Interesada en módulo de inventario y CRM.",
          },
          {
            name: "Carlos Quispe",
            company: "Granja Andina",
            industry: "Agroindustria",
            email: "carlos@granjaandina.pe",
            phone: "+51 912 345 678",
            channel: "facebook",
            stage: "negociacion",
            score: 65,
            notes: "Solicita propuesta plan 12m con AXIA.",
          },
          {
            name: "Renata Flores",
            company: "Boutique Renata",
            industry: "Retail",
            email: "renata@boutique.pe",
            phone: "+51 999 111 222",
            channel: "instagram",
            stage: "cliente",
            score: 92,
            notes: "Cliente activo, módulo finanzas.",
          },
          {
            name: "Iván Soto",
            company: "Soto Logística",
            industry: "Logística",
            email: "ivan@sotolog.pe",
            phone: "+51 944 222 333",
            channel: "web",
            stage: "prospecto",
            score: 35,
            notes: "Llegó por la web, agendar demo.",
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
            key: "AXYN-RENATA-2026-LIVE",
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
            key: "AXYN-DEMO-LUCIA-30D",
            type: "demo",
            module: "crm",
            status: "activa",
            startDate: new Date(),
            endDate: new Date(now + 30 * 24 * 60 * 60 * 1000),
          },
          {
            clientId: seeded[1].id,
            key: "AXYN-CQUISPE-6M",
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
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}
