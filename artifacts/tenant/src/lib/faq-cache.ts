import { LRUCache } from "lru-cache";
import type { FaqItem } from "./api";

const FAQ_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Cache LRU de listas de FAQs por tenant. Evita refetch durante una hora
 * y permite que el chat de Cecilia las consulte sin pegarle de nuevo al
 * servidor en cada turno.
 */
const faqsByTenant = new LRUCache<string, FaqItem[]>({
  max: 50,
  ttl: FAQ_TTL_MS,
});

export function setCachedFaqs(tenantId: string, faqs: FaqItem[]): void {
  faqsByTenant.set(tenantId, faqs);
}

export function getCachedFaqs(tenantId: string): FaqItem[] | undefined {
  return faqsByTenant.get(tenantId);
}

export function clearCachedFaqs(tenantId: string): void {
  faqsByTenant.delete(tenantId);
}

/** Normaliza un string para matching: minúsculas, sin tildes, sin signos. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[¿?¡!.,:;()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "y", "o",
  "a", "en", "con", "por", "para", "que", "se", "es", "son", "está", "están",
  "tu", "tus", "su", "sus", "lo", "le", "les", "mi", "me", "te", "ti",
  "como", "cuando", "donde", "cual", "cuales", "cuanto", "cuanta", "cuantos",
]);

function tokenize(s: string): string[] {
  return normalizeText(s)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/**
 * Busca la FAQ más cercana al texto del usuario via similitud de Jaccard
 * sobre tokens. Devuelve null si la similitud máxima cae bajo el umbral.
 *
 * Umbral por defecto 0.5 (mitad de los tokens significativos coinciden).
 */
export function findFaqMatch(
  userText: string,
  faqs: FaqItem[],
  threshold = 0.5,
): { faq: FaqItem; score: number } | null {
  const userTokens = new Set(tokenize(userText));
  if (userTokens.size === 0) return null;
  let best: { faq: FaqItem; score: number } | null = null;
  for (const faq of faqs) {
    const faqTokens = new Set(tokenize(faq.pregunta));
    if (faqTokens.size === 0) continue;
    let inter = 0;
    for (const t of userTokens) if (faqTokens.has(t)) inter += 1;
    const union = userTokens.size + faqTokens.size - inter;
    if (union === 0) continue;
    const score = inter / union;
    if (!best || score > best.score) {
      best = { faq, score };
    }
  }
  return best && best.score >= threshold ? best : null;
}
