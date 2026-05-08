import { useOutletContext } from 'react-router'
import { BaseReports } from '@/components/base/BaseReports'
import { FileDown, Calendar, Users, Briefcase, Activity, Home } from 'lucide-react'

export default function ReportesCondo() {
  const { config } = useOutletContext()

  const condoReports = [
    { label: 'Estado de Cuenta Mensual', description: 'Balance general de ingresos, gastos y fondos de reserva.', icon: Briefcase },
    { label: 'Ranking de Morosidad', description: 'Detalle de unidades con deuda pendiente y antigüedad.', icon: Activity },
    { label: 'Gestión de Incidencias', description: 'Resumen de tareas de mantenimiento y reparaciones.', icon: Home },
    { label: 'Sincronización SUNAT', description: 'Reporte de comprobantes emitidos por mantenimiento.', icon: FileDown },
    { label: 'Historial de Asambleas', description: 'Actas y acuerdos logrados en reuniones de residentes.', icon: Users },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Centro de Reportes Residencial</h2>
      </div>

      <BaseReports reports={condoReports} primaryColor={config.primaryColor} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-black border border-white/10 rounded-3xl p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#3b82f6] mb-6">Recaudación Anual</h3>
            <div className="h-64 flex items-end gap-3 mt-8">
               {[40, 55, 75, 45, 90, 60, 50, 65, 80, 70, 85, 95].map((h, i) => (
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
                     <span className="text-[7px] font-black text-white/20 uppercase tracking-tighter">M-{i+1}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-black border border-white/10 rounded-3xl p-8 flex flex-col justify-center text-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Auditoría Residencial</h3>
            <p className="text-[11px] text-white/20 uppercase font-black leading-relaxed max-w-sm mx-auto">
               Los reportes reflejan la salud financiera del condominio y son firmados digitalmente para validez legal ante asambleas.
            </p>
            <div className="mt-8 flex justify-center gap-4">
               <button className="px-6 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[#3b82f6] hover:text-white transition-all shadow-lg active:scale-95">Exportar BALANCE (PDF)</button>
               <button className="px-6 py-3 bg-white/5 text-white/40 border border-white/10 font-black uppercase text-[10px] tracking-widest rounded-xl">Data Maestra (XLS)</button>
            </div>
         </div>
      </div>
    </div>
  )
}
