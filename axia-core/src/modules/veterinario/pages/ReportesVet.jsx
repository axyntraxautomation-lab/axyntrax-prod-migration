import { useOutletContext } from 'react-router'
import { BaseReports } from '@/components/base/BaseReports'
import { FileDown, Calendar, Users, Briefcase, Activity } from 'lucide-react'

export default function ReportesVet() {
  const { config } = useOutletContext()

  const vetReports = [
    { label: 'Consultas Médicas', description: 'Historial de atenciones, diagnósticos y altas médicas.', icon: Briefcase },
    { label: 'Control de Vacunación', description: 'Resumen de inmunizaciones aplicadas y vencidas.', icon: Calendar },
    { label: 'Movimiento PetShop', description: 'Análisis de ventas de productos y rotación de stock.', icon: Activity },
    { label: 'Reporte SUNAT / Servicios', description: 'Declaración mensual de servicios y facturación.', icon: FileDown },
    { label: 'Afiliación de Mascotas', description: 'Tasa de crecimiento de nuevos pacientes veterinarios.', icon: Users },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Reportes Veterinarios</h2>
      </div>

      <BaseReports reports={vetReports} primaryColor={config.primaryColor} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-black border border-white/10 rounded-3xl p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-6">Distribución por Especie</h3>
            <div className="flex items-center justify-center py-8">
               <div className="relative w-48 h-48 rounded-full border-[12px] border-white/5 flex items-center justify-center">
                  <div className="text-center">
                     <p className="text-2xl font-black text-white">145</p>
                     <p className="text-[10px] font-black uppercase text-white/20">Pacientes</p>
                  </div>
                  {/* Simplificacion visual de grafico de dona */}
                  <div className="absolute inset-[-12px] rounded-full border-[12px] border-amber-500 border-t-transparent border-l-transparent rotate-45" />
               </div>
               <div className="ml-12 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 bg-amber-500 rounded-sm" />
                     <span className="text-xs font-bold text-white/60">Caninos (65%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 bg-white/20 rounded-sm" />
                     <span className="text-xs font-bold text-white/60">Felinos (35%)</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-black border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Exportación Automatizada</h3>
            <p className="text-[11px] text-white/20 uppercase font-black leading-relaxed">
               Todos los reportes son firmados digitalmente. Los archivos PDF incluyen el historial médico completo en caso de derivación técnica.
            </p>
            <button className="mt-8 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all">
               Descargar Todo (ZIP)
            </button>
         </div>
      </div>
    </div>
  )
}
