import { useOutletContext } from 'react-router'
import { BaseReports } from '@/components/base/BaseReports'
import { FileDown, Calendar, Users, Briefcase, Activity } from 'lucide-react'

export default function ReportesDent() {
  const { config } = useOutletContext()

  const dentReports = [
    { label: 'Ingresos por Tratamiento', description: 'Desglose financiero por especialidad (Ortodoncia, Implantes, etc).', icon: Briefcase },
    { label: 'Tasa de Asistencia', description: 'Porcentaje de citas confirmadas vs reprogramadas.', icon: Calendar },
    { label: 'Consumo de Insumos', description: 'Gasto en resinas, anestesia y materiales dentales.', icon: Activity },
    { label: 'Facturación / SUNAT', description: 'Resumen de documentos electrónicos y cierres de mes.', icon: FileDown },
    { label: 'Nuevos Odontogramas', description: 'Expansión de la cartera de pacientes registrados.', icon: Users },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Centro de Reportes Dentales</h2>
      </div>

      <BaseReports reports={dentReports} primaryColor={config.primaryColor} />

      <div className="bg-black border border-white/10 rounded-3xl p-8">
         <h3 className="text-xs font-black uppercase tracking-widest text-[#ec4899] mb-6">Rentabilidad por Especialidad</h3>
         <div className="h-64 flex items-end gap-3 mt-8">
            {[80, 60, 45, 70, 95, 65].map((h, i) => (
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
