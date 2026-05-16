export const metadata = {
  title: 'Términos y Condiciones | Axyntrax Automation',
};

export default function Terminos() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-[#00D4FF]/30 p-8 md:p-24">
      <div className="container mx-auto max-w-4xl glass p-8 rounded-2xl border border-white/10">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Términos y Condiciones</h1>
        
        <section className="space-y-6 text-slate-300">
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">1. Aceptación de los Términos</h2>
            <p>Al acceder a axyntrax-automation.net, aceptas estos términos completos y te comprometes a cumplir con las leyes peruanas vigentes.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">2. Servicios</h2>
            <p>Axyntrax Automation proporciona soluciones de automatización empresarial, WhatsApp bots, dashboards y servicios avanzados de IA/LLM para el mercado B2B.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">3. Responsabilidades del Usuario</h2>
            <p>El usuario se compromete a usar los servicios de forma legal, ética y no intentar vulnerar la seguridad o integridad del sistema.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">4. Propiedad Intelectual</h2>
            <p>Todos los contenidos, logos, marcas y software desarrollados son propiedad exclusiva de Axyntrax Automation S.A.C.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">5. Contacto</h2>
            <p>Para cualquier consulta legal o de términos, puede dirigirse a: <span className="text-cyan-300">legal@axyntrax-automation.net</span></p>
          </div>
        </section>
      </div>
    </div>
  );
}
