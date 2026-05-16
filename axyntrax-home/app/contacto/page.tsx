export const metadata = {
  title: 'Contacto | Axyntrax Automation',
  description: 'Canales oficiales de contacto de Axyntrax Automation.',
};

export default function Contacto() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-[#00D4FF]/30 p-8 md:p-24">
      <main className="container mx-auto max-w-3xl glass p-8 md:p-12 rounded-2xl border border-white/10">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Contacto</h1>

        <p className="text-slate-300 mb-8 leading-relaxed">
          Este es el canal oficial de Axyntrax Automation para consultas comerciales, soporte y coordinación.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Datos de contacto</h2>
          <div className="space-y-2 text-slate-300">
            <p><strong>WhatsApp:</strong> 991740590</p>
            <p><strong>Correo:</strong> <span className="text-cyan-300">contacto@axyntrax-automation.net</span></p>
            <p><strong>Ubicación:</strong> Arequipa, Perú</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Horario de atención</h2>
          <p className="text-slate-300">
            Lunes a viernes, horario laboral de Perú.
          </p>
        </section>

        <section className="mb-8 border-t border-white/5 pt-8">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Representante</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white">
              MM
            </div>
            <p className="text-xl font-bold text-slate-100">
              Miguel Montero
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
