/**
 * Mini agenda semanal. Por ahora muestra la semana actual sin eventos
 * para dar al tenant una idea visual de dónde verá sus citas.
 */
const HOY = new Date();
const DIAS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function semanaActual(): { fecha: Date; etiqueta: string }[] {
  const inicio = new Date(HOY);
  inicio.setDate(HOY.getDate() - HOY.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return { fecha: d, etiqueta: DIAS_ES[d.getDay()] };
  });
}

export function AgendaCalendar() {
  const dias = semanaActual();
  const hoyKey = HOY.toDateString();
  return (
    <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Agenda</h3>
        <span className="text-[11px] text-gray-400">próximos 7 días</span>
      </header>
      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((d) => {
          const esHoy = d.fecha.toDateString() === hoyKey;
          return (
            <div
              key={d.fecha.toISOString()}
              className="flex flex-col items-center rounded-lg border border-gray-100 px-1 py-2"
              style={
                esHoy
                  ? {
                      borderColor: "var(--color-primario)",
                      background:
                        "color-mix(in srgb, var(--color-primario) 8%, white)",
                    }
                  : {}
              }
            >
              <span className="text-[10px] font-medium uppercase text-gray-400">
                {d.etiqueta}
              </span>
              <span
                className="text-base font-bold"
                style={{ color: esHoy ? "var(--color-primario)" : "#111827" }}
              >
                {d.fecha.getDate()}
              </span>
              <span className="mt-1 text-[9px] text-gray-400">—</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Cuando conectes WhatsApp, las citas se reservarán solas y aparecerán aquí.
      </p>
    </section>
  );
}
