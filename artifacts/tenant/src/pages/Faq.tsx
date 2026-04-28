import { useEffect, useMemo, useState } from "react";
import { BrandingHeader } from "@/components/BrandingHeader";
import { CeciliaFloatingChat } from "@/components/CeciliaFloatingChat";
import { apiGet, type FaqItem } from "@/lib/api";
import { getCachedFaqs, setCachedFaqs, normalizeText } from "@/lib/faq-cache";
import { useTenantReady } from "@/providers/TenantProvider";

type FaqsPayload = { faqs: FaqItem[] };

export function Faq() {
  const me = useTenantReady();
  const [faqs, setFaqs] = useState<FaqItem[]>(() => getCachedFaqs(me.tenant.id) ?? []);
  const [loading, setLoading] = useState(faqs.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (faqs.length > 0) return;
    apiGet<FaqsPayload>("/api/tenant/faqs")
      .then((data) => {
        setCachedFaqs(me.tenant.id, data.faqs);
        setFaqs(data.faqs);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las preguntas.");
      })
      .finally(() => setLoading(false));
  }, [faqs.length, me.tenant.id]);

  const filtered = useMemo(() => {
    if (!query.trim()) return faqs;
    const q = normalizeText(query);
    return faqs.filter(
      (f) =>
        normalizeText(f.pregunta).includes(q) ||
        normalizeText(f.respuesta).includes(q),
    );
  }, [faqs, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const f of filtered) {
      const cat = f.categoria || "general";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(f);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-3">
        <h1 className="text-lg font-semibold text-gray-900">Preguntas frecuentes</h1>
        <p className="mt-1 text-xs text-gray-500">
          Respuestas precargadas para los clientes de tu rubro. Cuando Cecilia atienda
          por WhatsApp, las usará primero antes de redactar una respuesta nueva.
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          style={{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--tw-ring-color" as any]: "var(--color-primario)",
          }}
          data-testid="faq-search"
        />
        {loading ? <p className="mt-4 text-sm text-gray-500">Cargando...</p> : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {!loading && faqs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Aún no hay preguntas configuradas para tu rubro.
          </p>
        ) : null}
        <div className="mt-4 space-y-5">
          {grouped.map(([cat, items]) => (
            <section key={cat}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {cat}
              </h2>
              <ul className="space-y-2">
                {items.map((f) => (
                  <li
                    key={f.id}
                    className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="text-sm font-semibold text-gray-900">{f.pregunta}</div>
                    <p className="mt-1 text-sm text-gray-600">{f.respuesta}</p>
                    {f.origen === "tenant" ? (
                      <span className="mt-2 inline-block rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-700">
                        personalizada
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <CeciliaFloatingChat />
    </>
  );
}
