export const metadata = {
  title: 'Política de Privacidad | Axyntrax Automation',
};

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-[#00D4FF]/30 p-8 md:p-24">
      <div className="container mx-auto max-w-4xl glass p-8 rounded-2xl border border-white/10">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Política de Privacidad</h1>
        
        <section className="space-y-6 text-slate-300">
          <div className="bg-slate-900/50 p-6 rounded-xl border border-cyan-500/10">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">1. Responsable del Tratamiento</h2>
            <p><strong>Empresa:</strong> Axyntrax Automation S.A.C.<br/>
            <strong>RUC:</strong> 10406750324<br/>
            <strong>Dirección:</strong> Arequipa, Perú<br/>
            <strong>Email:</strong> <span className="text-cyan-300">privacidad@axyntrax-automation.net</span><br/>
            <strong>Representante:</strong> Miguel Montero</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">2. Datos que Recopilamos</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Datos de contacto (nombre, email, teléfono de WhatsApp)</li>
              <li>Datos de navegación (cookies, dirección IP, tipo de navegador)</li>
              <li>Datos de facturación (procesados por pasarelas de pago seguras)</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">3. Finalidad del Tratamiento</h2>
            <p>Proveer servicios de automatización, gestión de licencias, soporte técnico, mejora de la experiencia del usuario y cumplimiento de obligaciones legales ante la SUNAT.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">4. Derechos ARCO (Ley 29733)</h2>
            <p>En cumplimiento de la <strong>Ley de Protección de Datos Personales de Perú</strong>, puedes ejercer tus derechos de <strong>Acceso, Rectificación, Cancelación u Oposición</strong> enviando una solicitud a <span className="text-cyan-300">privacidad@axyntrax-automation.net</span> con una copia de tu DNI.</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-cyan-400 mt-6 mb-2">5. Cookies</h2>
            <p>Utilizamos cookies esenciales para el funcionamiento del sistema y cookies de análisis (Google Analytics) para mejorar nuestro servicio.</p>
          </div>
          
          <div className="pt-8 border-t border-white/5 text-sm text-slate-500">
            Última actualización: Mayo 2026. Los cambios importantes serán notificados vía correo electrónico.
          </div>
        </section>
      </div>
    </div>
  );
}
