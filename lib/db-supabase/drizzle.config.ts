import { defineConfig } from "drizzle-kit";
import path from "path";
import { requireSupabaseDbUrl } from "./src/env";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: requireSupabaseDbUrl(),
  },
});
