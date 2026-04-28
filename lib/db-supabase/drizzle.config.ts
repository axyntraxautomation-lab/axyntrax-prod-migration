import { defineConfig } from "drizzle-kit";
import path from "path";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  throw new Error(
    "SUPABASE_DB_URL no está configurado. Crea el proyecto en Supabase y registra la cadena de conexión Postgres como secret. " +
      "Esta variable es la 'Connection string > URI' del panel Settings > Database del proyecto Supabase.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
