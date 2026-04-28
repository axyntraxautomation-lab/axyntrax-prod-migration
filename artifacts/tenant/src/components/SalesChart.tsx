import { useEffect, useRef } from "react";
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
export function SalesChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
            data: [0, 0, 0, 0, 0, 0, 0],
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
    return () => chart.destroy();
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
