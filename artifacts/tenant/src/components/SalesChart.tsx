import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, type FinanzaMov } from "@/lib/api";
import { useRealtimeRefetch } from "@/hooks/useRealtimeBus";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
);

const LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * Gráfico de ventas semanal. Por ahora arranca vacío (zeros) — cuando se
 * conecten los movimientos finanzas se reemplaza el dataset.
 */
function buildWeekBuckets(movs: FinanzaMov[]): { labels: string[]; data: number[] } {
  // Lun..Dom de la semana actual basado en hoy.
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  // En JS getDay(): dom=0..sab=6. Queremos lunes como inicio.
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const buckets = days.map(() => 0);
  for (const m of movs) {
    if (m.tipo !== "ingreso") continue;
    const dt = new Date(m.fecha);
    const idx = days.findIndex(
      (d) =>
        dt.getFullYear() === d.getFullYear() &&
        dt.getMonth() === d.getMonth() &&
        dt.getDate() === d.getDate(),
    );
    if (idx >= 0) buckets[idx] += parseFloat(m.monto || "0") || 0;
  }
  return { labels: LABELS, data: buckets };
}

export function SalesChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const [series, setSeries] = useState<{ labels: string[]; data: number[] }>({
    labels: LABELS,
    data: [0, 0, 0, 0, 0, 0, 0],
  });

  const refetch = useCallback(async () => {
    try {
      const monday = new Date();
      monday.setHours(0, 0, 0, 0);
      const offset = (monday.getDay() + 6) % 7;
      monday.setDate(monday.getDate() - offset);
      const next = new Date(monday);
      next.setDate(next.getDate() + 7);
      const r = await apiGet<{ items: FinanzaMov[] }>(
        `/api/tenant/finanzas?desde=${encodeURIComponent(monday.toISOString())}&hasta=${encodeURIComponent(next.toISOString())}&tipo=ingreso&limit=500`,
      );
      setSeries(buildWeekBuckets(r.items));
    } catch {
      // mantener serie previa
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useRealtimeRefetch(["tenant_finanzas_movimientos"], () => {
    void refetch();
  });

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data.datasets[0]!.data = series.data;
      chartRef.current.update("none");
    }
  }, [series]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cs = getComputedStyle(document.documentElement);
    const primario = cs.getPropertyValue("--color-primario").trim() || "#06B6D4";
    const secundario = cs.getPropertyValue("--color-secundario").trim() || "#7C3AED";
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, primario + "55");
    gradient.addColorStop(1, primario + "00");
    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: LABELS,
        datasets: [
          {
            label: "Ventas (S/)",
            data: series.data,
            borderColor: primario,
            backgroundColor: gradient,
            pointBackgroundColor: secundario,
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#111827",
            padding: 8,
            displayColors: false,
            callbacks: { label: (i) => `S/ ${i.formattedValue}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#6B7280", font: { size: 11 } } },
          y: {
            beginAtZero: true,
            grid: { color: "#F3F4F6" },
            ticks: { color: "#9CA3AF", font: { size: 11 }, callback: (v) => `S/${v}` },
          },
        },
      },
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Ventas de la semana</h3>
        <span className="text-[11px] text-gray-400">conecta WhatsApp para datos reales</span>
      </header>
      <div className="mt-3 h-[180px]">
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}
