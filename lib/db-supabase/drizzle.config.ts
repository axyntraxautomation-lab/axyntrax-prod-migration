import { defineConfig } from "drizzle-kit";
import path from "path";
import { requireSupabaseDbUrl } from "./src/env";
import { resolveSslConfig } from "./src/index";

const url = requireSupabaseDbUrl();
const ssl = resolveSslConfig(url);

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: ssl as { rejectUnauthorized?: boolean },
  },
});
