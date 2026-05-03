import { useOutletContext } from 'react-router'
import { BaseReports } from '@/components/base/BaseReports'
import { FileDown, Calendar, Users, Briefcase, Activity } from 'lucide-react'

export default function ReportesMedicos() {
  const { config } = useOutletContext()

  const medReports = [
    { label: 'Ingresos por Médico', description: 'Desglose detallado de honorarios y rentabilidad clínica.', icon: Briefcase },
    { label: 'Citas y Asistencia', description: 'Tasa de cumplimiento, cancelaciones y re-programaciones.', icon: Calendar },
    { label: 'Insumos y Logística', description: 'Consumo mensual de materiales quirúrgicos y críticos.', icon: Activity },
    { label: 'SUNAT / Facturacion', description: 'Resumen de documentos electrónicos procesados en el periodo.', icon: FileDown },
    { label: 'Historias Nuevas', description: 'Crecimiento de base de datos de pacientes.', icon: Users },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Centro de Reportes Médicos</h2>
      </div>

      <BaseReports reports={medReports} primaryColor={config.primaryColor} />

      <div className="bg-black border border-white/10 rounded-3xl p-8">
         <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-6">Frecuencia de Citas por Especialidad</h3>
         <div className="h-64 flex items-end gap-3 mt-8">
            {[65, 45, 80, 55, 90, 70].map((h, i) => (
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
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">ESP-{i+1}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  )
}
