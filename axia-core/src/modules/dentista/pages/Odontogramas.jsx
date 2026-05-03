import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'
import { Activity, Plus, FileText, Search } from 'lucide-react'

export default function Odontogramas() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'date', label: 'Fecha' },
    { key: 'patient', label: 'Paciente' },
    { key: 'treatment', label: 'Motivo / Diagnóstico' },
    { 
      key: 'teeth', 
      label: 'Piezas Tratas',
      render: (val) => <span className="text-[10px] font-mono text-white/40">{val.join(', ')}</span>
    },
  ]

  const data = [
    { date: '18/04/2026', patient: 'Sofia Vergara', treatment: 'Restauración Resina', teeth: [16, 17] },
    { date: '19/04/2026', patient: 'Carlos Slim', treatment: 'Endodoncia', teeth: [24] },
    { date: '21/04/2026', patient: 'Elon Musk', treatment: 'Extracción Tercer Molar', teeth: [38] },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Odontogramas Digitales</h2>
      
      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Analisis', icon: Activity },
          { label: 'Siguiente Cita', icon: FileText },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
         <div className="lg:col-span-3 bg-black border border-white/5 rounded-3xl p-8 flex items-center justify-center min-h-[300px]">
            {/* Representación visual simbólica del mapa dental */}
            <div className="space-y-4 w-full">
               <div className="flex justify-around">
                  {Array.from({length: 16}, (_, i) => (
                    <div key={i} className="w-8 h-10 border border-white/10 rounded-md flex flex-col items-center justify-center hover:border-[#ec4899] cursor-pointer transition-all">
                       <span className="text-[8px] text-white/20">{18-i > 0 ? 18-i : i+21}</span>
                       <div className="w-3 h-3 rounded-full bg-white/5" />
                    </div>
                  ))}
               </div>
               <div className="h-px bg-white/5 w-full" />
               <div className="flex justify-around">
                  {Array.from({length: 16}, (_, i) => (
                    <div key={i} className="w-8 h-10 border border-white/10 rounded-md flex flex-col items-center justify-center hover:border-[#ec4899] cursor-pointer transition-all">
                       <div className="w-3 h-3 rounded-full bg-white/5" />
                       <span className="text-[8px] text-white/20">{48-i > 32 ? 48-i : i+31}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
         <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h4 className="text-[10px] font-black uppercase text-white/40 mb-4">Leyenda Ética</h4>
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-[10px] text-white/60">Caries / Infección</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#ec4899] rounded-full" />
                  <span className="text-[10px] text-white/60">Tratamiento Realizado</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white/10 rounded-full" />
                  <span className="text-[10px] text-white/60">Pieza Sana</span>
               </div>
            </div>
         </div>
      </div>

      <BaseTables 
        columns={columns}
        data={data}
        primaryColor={config.primaryColor}
        onAction={(item) => console.log('View full record:', item)}
      />
    </div>
  )
}
