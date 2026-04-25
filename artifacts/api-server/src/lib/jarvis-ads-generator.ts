import { desc } from "drizzle-orm";
import { db, jarvisAdsTable, type InsertJarvisAd } from "@workspace/db";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { logger } from "./logger";

const CHANNELS = ["fb", "ig", "both"] as const;
const AUDIENCES = [
  "pymes",
  "doctores",
  "abogados",
  "dentistas",
  "veterinarios",
  "administradores de condominios",
  "academias",
  "restaurantes",
  "tiendas retail",
];
const HOOKS = [
  "ahorrá tiempo",
  "automatizá la cobranza",
  "respondé clientes 24/7",
  "tené tu agenda al día",
  "menos llamadas, más ventas",
  "control total de tu pyme",
  "deja que JARVIS atienda mientras dormís",
];

const SYSTEM = `Eres JARVIS, la IA de marketing de AXYNTRAX AUTOMATION (Arequipa, Perú).
Generás avisos publicitarios para Facebook e Instagram, en español peruano, sin emojis, breves (máx 3 oraciones de cuerpo, título de hasta 8 palabras, 4 a 7 hashtags).
Cada aviso debe ser claramente DIFERENTE de los anteriores: no repitas títulos, ganchos ni estructuras ya usadas.
Mencioná el nombre AXYNTRAX o JARVIS en el cuerpo. Cuando aplique, recordá el contacto Yape 991740590 a nombre de Miguel Montero.
Devolvé SIEMPRE JSON con exactamente esta forma:
{ "title":"...", "body":"...", "hashtags":"#axyntrax #...", "cta":"...", "imagePrompt":"descripción para imagen ilustrativa" }`;

interface GenInput {
  recentTitles: string[];
  channel: (typeof CHANNELS)[number];
  audience: string;
  hook: string;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function buildUserPrompt(input: GenInput): string {
  const recent = input.recentTitles.length
    ? `Títulos recientes ya usados (NO los repitas, no uses sinónimos cercanos):\n- ${input.recentTitles.join(
        "\n- ",
      )}`
    : "Sin avisos previos.";
  return `Generá UN aviso para ${input.channel === "both" ? "Facebook e Instagram" : input.channel === "fb" ? "Facebook" : "Instagram"}.
Audiencia objetivo: ${input.audience}.
Gancho a usar: "${input.hook}".
${recent}
Devolvé únicamente el JSON.`;
}

interface RawAd {
  title?: unknown;
  body?: unknown;
  hashtags?: unknown;
  cta?: unknown;
  imagePrompt?: unknown;
}

function normalizeAd(raw: RawAd): {
  title: string;
  body: string;
  hashtags: string;
  cta: string;
  imagePrompt: string;
} {
  const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 200) : "";
  const body = typeof raw.body === "string" ? raw.body.trim().slice(0, 2000) : "";
  const hashtags =
    typeof raw.hashtags === "string" ? raw.hashtags.trim().slice(0, 500) : "";
  const cta = typeof raw.cta === "string" ? raw.cta.trim().slice(0, 200) : "";
  const imagePrompt =
    typeof raw.imagePrompt === "string"
      ? raw.imagePrompt.trim().slice(0, 1000)
      : "";
  return { title, body, hashtags, cta, imagePrompt };
}

export async function generateAd(opts?: {
  channel?: (typeof CHANNELS)[number];
  audience?: string;
  source?: string;
}): Promise<InsertJarvisAd | null> {
  const recent = await db
    .select({ title: jarvisAdsTable.title })
    .from(jarvisAdsTable)
    .orderBy(desc(jarvisAdsTable.createdAt))
    .limit(20);
  const channel = opts?.channel ?? pick(CHANNELS);
  const audience = opts?.audience ?? pick(AUDIENCES);
  const hook = pick(HOOKS);

  try {
    const result = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: SYSTEM }] },
        {
          role: "model",
          parts: [
            {
              text: '{"title":"","body":"","hashtags":"","cta":"","imagePrompt":""}',
            },
          ],
        },
        {
          role: "user",
          parts: [
            {
              text: buildUserPrompt({
                recentTitles: recent.map((r) => r.title),
                channel,
                audience,
                hook,
              }),
            },
          ],
        },
      ],
      config: { temperature: 0.95, responseMimeType: "application/json" },
    });
    const text =
      result.text ??
      result.candidates?.[0]?.content?.parts?.[0]?.text ??
      "{}";
    let raw: RawAd = {};
    try {
      raw = JSON.parse(text) as RawAd;
    } catch {
      logger.warn({ text: text.slice(0, 200) }, "jarvis-ad: failed to parse json");
    }
    const norm = normalizeAd(raw);
    if (!norm.title || !norm.body) {
      logger.warn("jarvis-ad: empty title/body, skipping");
      return null;
    }

    const insert: InsertJarvisAd = {
      channel,
      audience,
      industry: null,
      title: norm.title,
      body: norm.body,
      hashtags: norm.hashtags || null,
      cta: norm.cta || null,
      imagePrompt: norm.imagePrompt || null,
      status: "pendiente",
      source: opts?.source ?? "auto",
      approvedAt: null,
      publishedAt: null,
    };
    const [row] = await db.insert(jarvisAdsTable).values(insert).returning();
    return row ?? insert;
  } catch (err) {
    logger.error({ err }, "jarvis-ad: generation failed");
    return null;
  }
}

const ONE_HOUR_MS = 60 * 60 * 1000;
let started = false;

export function startJarvisAdScheduler(): void {
  if (started) return;
  started = true;
  // First tick after 30s so the server has time to settle.
  setTimeout(() => {
    void generateAd({ source: "auto" });
  }, 30_000).unref();
  setInterval(() => {
    void generateAd({ source: "auto" });
  }, ONE_HOUR_MS).unref();
  logger.info("jarvis-ad scheduler started (every 1h)");
}
