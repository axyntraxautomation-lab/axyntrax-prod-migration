import { useOutletContext } from 'react-router'
import BaseDashboardKPIs from '@/components/base/BaseDashboardKPIs'
import BaseAxiaChat from '@/components/base/BaseAxiaChat'
import BaseCharts from '@/components/base/BaseCharts'
import { BaseSkeleton } from '@/components/base/BaseSkeletons'

/**
 * Demo Dashboard constructed using the Axia Module Engine components.
 * Zero custom CSS or ad-hoc components used here.
 */
export default function ClinicaDashboard() {
  const { config } = useOutletContext()

  // Mock data for the demo
  const mockData = {
    citas_hoy: 12,
    nuevos_pacientes: 4,
    recaudacion_dia: 1450.00,
    atencion_promedio: 22,
  }

  const chartData = [
    { name: 'Lun', value: 400 },
    { name: 'Mar', value: 300 },
    { name: 'Mie', value: 500 },
    { name: 'Jue', value: 450 },
    { name: 'Vie', value: 600 },
  ]

  return (
    <div className="space-y-6">
      {/* 1. KPIs Section */}
      <BaseDashboardKPIs kpis={config.kpis} data={mockData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Charts Section */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xs font-bold text-text uppercase tracking-widest">Fluidez de Atencion Semanal</h3>
          </div>
          <BaseCharts data={chartData} color={config.primaryColor} isCurrency={true} />
        </div>

        {/* 3. Small Widget Section */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
           <h3 className="text-xs font-bold text-text uppercase tracking-widest">Status Clinica</h3>
           <div className="space-y-2">
             <div className="p-3 bg-surface-2 rounded-lg flex justify-between items-center">
                <span className="text-[10px] text-text-dim font-bold uppercase">Medicos Activos</span>
                <span className="text-sm font-black text-text">8</span>
             </div>
             <div className="p-3 bg-surface-2 rounded-lg flex justify-between items-center">
                <span className="text-[10px] text-text-dim font-bold uppercase">Urgencias</span>
                <span className="text-sm font-black text-danger">0</span>
             </div>
           </div>
        </div>
      </div>

      {/* 4. Axia Intelligence Section */}
      <BaseAxiaChat config={config} recommendations={config.axiaRecommendations} />
    </div>
  )
}
