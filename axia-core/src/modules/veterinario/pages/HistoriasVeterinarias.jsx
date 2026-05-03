import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'
import { Dog, Cat, Printer, Download } from 'lucide-react'

export default function HistoriasVeterinarias() {
  const { config } = useOutletContext()
  
  const columns = [
    { 
      key: 'species', 
      label: 'Especies',
      render: (val) => val === 'Canino' ? <Dog className="w-4 h-4 text-white/40" /> : <Cat className="w-4 h-4 text-white/40" />
    },
    { key: 'name', label: 'Nombre Mascota' },
    { key: 'owner', label: 'Tutor / Dueño' },
    { key: 'breed', label: 'Raza' },
    { key: 'last_visit', label: 'Ultima Visita' },
  ]

  const data = [
    { species: 'Canino', name: 'Toby', owner: 'Miguel Montero', breed: 'Golden Retriever', last_visit: '10/04/2026' },
    { species: 'Felino', name: 'Simba', owner: 'Ana Garcia', breed: 'Persa', last_visit: '12/04/2026' },
    { species: 'Canino', name: 'Luna', owner: 'Robert Valdivia', breed: 'Bulldog Frances', last_visit: '20/04/2026' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Historias Clínicas</h2>
      
      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Imprimir', icon: Printer },
          { label: 'PDF', icon: Download },
        ]}
      />

      <BaseTables 
        columns={columns}
        data={data}
        primaryColor={config.primaryColor}
        onAction={(item) => console.log('View history:', item)}
      />
    </div>
  )
}
