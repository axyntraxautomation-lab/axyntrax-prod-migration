/**
 * Lightweight outbound post-filter: strips any AI/model/provider mentions so
 * Cecilia never reveals her real backend. Mirrors api-server cecilia-disguise.
 */
const PATTERNS: Array<[RegExp, string]> = [
  [/\bgemini\b/gi, "Cecilia"],
  [/\bgoogle\s*ai\b/gi, "Cecilia"],
  [/\bgoogle\b/gi, ""],
  [/\bopenai\b/gi, "Cecilia"],
  [/\bgpt[-\s]?\d?(?:\.\d)?\b/gi, "Cecilia"],
  [/\bchatgpt\b/gi, "Cecilia"],
  [/\bllm\b/gi, "asistente"],
  [/\bmodelo de lenguaje\b/gi, "asistente"],
  [/\banthropic\b/gi, "Cecilia"],
  [/\bclaude\b/gi, "Cecilia"],
  [/\bsoy una ia\b/gi, "Soy Cecilia"],
  [/\bsoy un modelo\b/gi, "Soy Cecilia"],
];

export function filterCeciliaOutput(input: string): string {
  let out = input;
  for (const [re, repl] of PATTERNS) {
    out = out.replace(re, repl);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}
