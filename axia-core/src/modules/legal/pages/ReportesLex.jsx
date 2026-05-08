import { useOutletContext } from 'react-router'
import { BaseReports } from '@/components/base/BaseReports'
import { FileDown, Calendar, Users, Briefcase, Activity, Gavel } from 'lucide-react'

export default function ReportesLex() {
  const { config } = useOutletContext()

  const lexReports = [
    { label: 'Estado de Expedientes', description: 'Resumen de carga procesal por abogado y materia.', icon: Briefcase },
    { label: 'Récord de Audiencias', description: 'Tasa de éxito, reprogramaciones y asistencia.', icon: Gavel },
    { label: 'Gestión Documental', description: 'Flujo de contratos y escritos firmados por el estudio.', icon: Activity },
    { label: 'Facturación / SUNAT', description: 'Liquidación de honorarios y tributos retenidos.', icon: FileDown },
    { label: 'Cartera de Clientes', description: 'Crecimiento de base de clientes corporativos.', icon: Users },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Centro de Reportes Jurídicos</h2>
      </div>

      <BaseReports reports={lexReports} primaryColor={config.primaryColor} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-black border border-white/10 rounded-3xl p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#ef4444] mb-6">Carga Procesal por Materia</h3>
            <div className="h-64 flex items-end gap-3 mt-8">
               {[75, 45, 90, 60, 55].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                     <div 
                       className="w-full bg-white/5 rounded-t-xl transition-all group-hover:bg-opacity-20 relative overflow-hidden"
                       style={{ height: `${h}%` }}
                     >
                        <div 
                          className="absolute bottom-0 w-full transition-all group-hover:opacity-100 opacity-20"
                          style={{ height: '100%', backgroundColor: config.primaryColor }}
                        />
                     </div>
                     <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">MAT-{i+1}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-black border border-white/10 rounded-3xl p-8 flex flex-col justify-center text-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Auditoría Ejecutiva</h3>
            <p className="text-[11px] text-white/20 uppercase font-black leading-relaxed max-w-sm mx-auto">
               Todos los reportes están sujetos a auditoría de Axia para garantizar el cumplimiento de plazos procesales.
            </p>
            <div className="mt-8 flex justify-center gap-4">
               <button className="px-6 py-3 bg-white text-black font-black uppercase text-[9px] rounded-xl hover:bg-[#ef4444] hover:text-white transition-all">Exportar PDF</button>
               <button className="px-6 py-3 bg-white/5 text-white/40 border border-white/10 font-black uppercase text-[9px] rounded-xl">Excel Maestro</button>
            </div>
         </div>
      </div>
    </div>
  )
}
